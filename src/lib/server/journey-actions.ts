import {JourneyActionInput,type JourneyAction,type JourneyActionResult} from "../journey-contract";
import type {AccountUser} from "../account-flow";
import type {DailyQuestion,LLMProfileResult,Profile,Quest} from "../types";
import {buildProfile,validateOnboardingAnswers} from "../engines/onboarding";
import {resolveQuestPlan,todayStr} from "../engines/quest";
import {missionProgress,plannedQuestId} from "../engines/quest-cycle";
import {detectUserState} from "../engines/adaptive";
import {spendToken,spendXPCards,XP_CARD_COSTS} from "../engines/economy";
import {applyPrestige} from "../engines/progression";
import {writeMilestone} from "../engines/memory";
import {checkProfessionEvolution} from "../engines/leaderboard";
import {JourneyError,RevisionConflict} from "./complete-quest";
export interface ActionClaim {status:"claimed"|"busy"|"complete";plan:Record<string,unknown>;result?:JourneyActionResult}
export interface JourneyRepository {
 profile:(owner:string)=>Promise<Profile|null>;
 activeQuest:(owner:string)=>Promise<Quest|null>;
 quest:(owner:string,id:string)=>Promise<Quest|null>;
 action:(owner:string,key:string)=>Promise<JourneyActionResult|null>;
 claim:(owner:string,key:string,kind:string,input:unknown,plan:Record<string,unknown>,lease:string)=>Promise<ActionClaim>;
 release:(owner:string,key:string,lease:string)=>Promise<void>;
 commit:(owner:string,key:string,lease:string,revision:number,profile:Profile|null,quest:Quest|null,extra:Record<string,unknown>)=>Promise<JourneyActionResult>;
 rank:(owner:string)=>Promise<{rank:number;total:number}>;
 verifiedCredits:(owner:string)=>Promise<number>;
}
export interface JourneyModels {
 classify:(answers:Extract<JourneyAction,{kind:"onboard"}>["answers"])=>Promise<LLMProfileResult>;
 generate:(profile:Profile,type:Quest["type"],difficulty:number)=>Promise<Omit<Quest,"id"|"status"|"created_at"|"date">>;
 question:(profile:Profile)=>Promise<DailyQuestion>;
}
function required(profile:Profile|null):Profile{if(!profile)throw new JourneyError("Please complete your starting profile first.",404);return profile;}
/** Every reward-sensitive decision derives from stored state. Input schemas are
 * strict: callers cannot submit grades, XP, stats, timestamps, type or eligibility.
 */
export async function runJourneyAction(user:AccountUser,input:unknown,repo:JourneyRepository,models:JourneyModels):Promise<JourneyActionResult>{
 const parsed=JourneyActionInput.safeParse(input);if(!parsed.success)throw new JourneyError("That request is not valid. Reopen your journey and try again.",400);
 const action=parsed.data,owner=user.id,day=todayStr();
 if(action.kind==="onboard")try{action.answers=validateOnboardingAnswers(action.answers);}catch{throw new JourneyError("Please review your five onboarding answers.",400);}
 let profile=await repo.profile(owner);
 const active=await repo.activeQuest(owner);
 if(action.kind==="onboard"&&profile)return {profile,quest:active,replayed:true};
 if(action.kind==="generate"&&active)return {profile,quest:active,replayed:true};
 let plan:Record<string,unknown>={};
 let key:string=action.kind;
 if(action.kind==="generate"){
  const p=required(profile),m=missionProgress(p);
  if(p.last_quest_date===day&&!m.eligible)return {profile:p,quest:null};
  const working=structuredClone(p);working.current_adaptive_state=detectUserState(p).state;
  const planned=resolveQuestPlan(working);
  const skips=new Set(p.memory.milestones.filter(mark=>mark.type==="quest_skipped"&&mark.date.slice(0,10)===day).map(mark=>mark.quest_id)).size;
  const attempt=planned.questType==="mission"?m.attempts:p.quest_history.filter(q=>q.completed_at.slice(0,10)===day&&q.quest_type!=="mission").length+skips;
  const questId=await plannedQuestId(owner,planned.questType,m.cycle,attempt,day);
  plan={...planned,questId,day,cycle:m.cycle,attempt,adaptive:working.current_adaptive_state,provenance:planned.questType==="mission"&&await repo.verifiedCredits(owner)<7?"legacy":"server"};key=`generate:${questId}`;
 }else if(action.kind==="onboard"){
  const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(action.answers)));
  key=`onboard:${Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,"0")).join("")}`;
 }else if(action.kind==="skip")key=`skip:${action.questId}`;
 else if(action.kind==="economy")key=`economy:${action.questId}:${action.effect}`;
 else if(action.kind==="prestige"||action.kind==="profession")key=`${action.kind}:${action.requestId}`;
 else if(["energy","daily_question","answer_daily"].includes(action.kind))key=`${action.kind}:${day}`;
 const lease=crypto.randomUUID();
 const claim=await repo.claim(owner,key,action.kind,action,plan,lease);
 if(claim.status==="complete"){
  const stored=claim.result?.quest?await repo.quest(owner,claim.result.quest.id):null;
  return {...claim.result!,quest:stored?.status==="active"?stored:null,profile:await repo.profile(owner),replayed:true};
 }
 if(claim.status==="busy")throw new JourneyError("Your journey is already being updated. Please try again in a moment.",409);
 plan=claim.plan;
 try{
  // Generated content is reused for revision retries, not requested twice.
  let generated:Quest|null=null,question:DailyQuestion|null=null;
  if(action.kind==="onboard"){
   const complete=validateOnboardingAnswers(action.answers);
   const classified=await models.classify(complete);
   const name=user.name.trim().replace(/[\u0000-\u001f\u007f]/g,"").slice(0,60)||"Explorer";
   const starting=buildProfile(owner,name,classified,complete.Q1[0]);
   return await repo.commit(owner,key,lease,0,starting,null,{});
  }
  if(action.kind==="legacy_archive")return await repo.commit(owner,key,lease,0,null,null,{});
  if(action.kind==="generate"){
   const p=required(profile),type=plan.questType as Quest["type"],difficulty=plan.difficulty as number;
   const content=await models.generate({...p,current_adaptive_state:plan.adaptive as Profile["current_adaptive_state"]},type,difficulty);
   generated={...content,id:plan.questId as string,type,difficulty,status:"active",created_at:new Date().toISOString(),date:plan.day as string};
  }
  if(action.kind==="daily_question")question=await models.question(required(profile));
  for(let attempt=0;attempt<3;attempt++){
   profile=await repo.profile(owner);const p=structuredClone(required(profile));let quest:Quest|null=null;const extra:Record<string,unknown>={};
   if(action.kind==="generate"){
    const existing=await repo.activeQuest(owner);if(existing){quest=existing;}else{
     const m=missionProgress(p);
     if(generated!.type==="mission"&&(m.cycle!==plan.cycle||m.attempts!==plan.attempt||!m.eligible))throw new JourneyError("Your mission plan changed. Reopen your journey.",409);
     if(generated!.type!=="mission"&&p.last_quest_date===day)throw new JourneyError("Today's challenge is already resolved.",409);
     quest=generated;p.current_adaptive_state=plan.adaptive as Profile["current_adaptive_state"];p.adaptive_state_updated_at=new Date().toISOString();
    }
   }else if(action.kind==="energy"){
    p.energy_today=action.energy;p.energy_date=day;p.last_active=new Date().toISOString();
   }else if(action.kind==="daily_question")extra.question=question;
   else if(action.kind==="answer_daily"){
    const saved=await repo.action(owner,`daily_question:${day}`);const q=saved?.question;
    if(!q)throw new JourneyError("Reopen today's question before answering.",409);
    const choice=q.options.find(option=>option.key===action.answer);
    if(action.answer!==null&&!choice)throw new JourneyError("Choose an available answer.",400);
    if(!p.continuous_profile_answers.some(a=>a.answered_at.slice(0,10)===day))p.continuous_profile_answers.push({question:q.question,category:q.category,signals_mined:q.signals_mined,answer_key:action.answer,answer_label:choice?.label??null,answered_at:new Date().toISOString()});
   }else if(action.kind==="skip"){
    const q=await repo.quest(owner,action.questId);if(!q||q.status!=="active")throw new JourneyError("This challenge is no longer active.",409);
    if(!spendToken(p))throw new JourneyError("You need a Skip Token to skip this challenge.",422);
    p.last_quest_date=day;p.last_active=new Date().toISOString();writeMilestone(p,"quest_skipped",{quest_id:q.id});
    if(q.type==="mission")writeMilestone(p,"mission_skipped",{quest_id:q.id,cycle:missionProgress(p).cycle});
   }else if(action.kind==="prestige"){
    if(p.level<100)throw new JourneyError("Prestige unlocks at level 100.",422);
    Object.assign(p,applyPrestige(p));
   }else if(action.kind==="profession"){
    const rank=await repo.rank(owner),evolution=checkProfessionEvolution(p,rank.rank,rank.total);
    if(!evolution)throw new JourneyError("No profession evolution is available yet.",422);
    p.profession=evolution.to;writeMilestone(p,"profession_evolution",{from:evolution.from,to:evolution.to,source:"leaderboard"});
   }else if(action.kind==="economy"){
    const q=await repo.quest(owner,action.questId);if(!q||q.status!=="active")throw new JourneyError("Reopen your current challenge.",409);
    if(action.effect==="reduce_difficulty"&&q.difficulty<=1)throw new JourneyError("This challenge is already at its lowest difficulty.",422);
    if(!spendXPCards(p,XP_CARD_COSTS[action.effect]))throw new JourneyError("You don't have enough unexpired XP Cards.",422);
    quest={...q,...(action.effect==="reduce_difficulty"?{difficulty:q.difficulty-1}:{hint:`${q.hint}\n\nWork toward: ${q.success_criteria}`})};
   }
   try{return await repo.commit(owner,key,lease,p.progression_revision??0,p,quest,extra);}
   catch(error){if(!(error instanceof RevisionConflict)||attempt===2)throw error;}
  }
  throw new JourneyError("Your journey changed. Please try again.",409);
 }finally{try{await repo.release(owner,key,lease);}catch{/* Expiring leases allow retry after a disconnect. */}}
}
