import {NextRequest} from "next/server";
import {journeyAuth,trustedClient,journeyReply,journeyFailure,journeyBody,journeyBudget} from "@/lib/server/journey-http";
import {journeyRepository} from "@/lib/server/journey-repository";
import {JourneyError} from "@/lib/server/complete-quest";
import {journeyModels} from "@/lib/server/journey-models";
import {plannedQuestId,missionProgress} from "@/lib/engines/quest-cycle";
import {calculateDifficulty,todayStr} from "@/lib/engines/quest";
import type {LessonPack} from "@/lib/lesson-cache";
import type {Quest} from "@/lib/types";
import {learningFocus} from "@/lib/learning-focus";
const count=(history:{quest_type:string}[])=>history.filter(q=>q.quest_type!=="mission").length;
async function freezeLesson(repo:ReturnType<typeof journeyRepository>,owner:string,quest:Quest):Promise<Quest>{
 const key=`lesson-content:${quest.id}`,existing=await repo.action(owner,key) as unknown as {lesson?:Quest}|null;
 if(existing?.lesson)return existing.lesson;
 const lease=crypto.randomUUID(),claim=await repo.claim(owner,key,"daily_question",{}, {},lease);
 if(claim.status==="complete")return (claim.result as unknown as {lesson:Quest}).lesson;
 if(claim.status!=="claimed")throw new JourneyError("Your lessons are being prepared.",409);
 try{await repo.commit(owner,key,lease,0,null,null,{lesson:quest});return quest;}finally{await repo.release(owner,key,lease);}
}
export async function GET(req:NextRequest){try{
 const {user,url}=await journeyAuth(req),client=await trustedClient(url),repo=journeyRepository(client);
 const profile=await repo.profile(user.id);if(!profile)throw new JourneyError("Complete your starting profile first.",404);
 const active=await repo.activeQuest(user.id),ordinal=count(profile.quest_history)+(active&&active.type!=="mission"?1:0),day=todayStr();
 const skips=new Set(profile.memory.milestones.filter(m=>m.type==="quest_skipped").map(m=>m.quest_id)).size;
 const key=`lesson-pack:v3:${profile.domain}:${ordinal}:${skips}:${day}`,existing=await repo.action(user.id,key);
 if(existing)return journeyReply((existing as unknown as {lessonPack:LessonPack}).lessonPack);
 await journeyBudget(client,user.id,"lesson-packs",4);
 const lease=crypto.randomUUID(),claim=await repo.claim(user.id,key,"daily_question",{}, {},lease);
 if(claim.status!=="claimed")throw new JourneyError("Your lessons are being prepared. Try again shortly.",409);
 try{
 const lessons:LessonPack["lessons"]=[];
 for(let i=0;i<3;i++){
  const working=structuredClone(profile);
  // Advance curriculum position only; this projection never grants progress.
  for(let n=count(working.quest_history);n<ordinal+i;n++){
   const focus=learningFocus(working),prior=lessons[n-ordinal]?.quest??active;
   working.quest_history.push({quest_id:`preview-${n}`,quest_type:"daily",grade:"Good",completed_at:new Date().toISOString(),learning_topics:prior?.learning?.lessons.map(l=>l.title)??[],quest_title:"Planned lesson",exp_earned:0,skills_targeted:prior?.skills_targeted??focus.skills,stats_targeted:prior?.stats_targeted??focus.stats});
  }
  const type=ordinal+i===0?"calibration":"daily";
  const content=await journeyModels.generate(working,type,calculateDifficulty(profile.level));
  const quest:Quest={...content,id:await plannedQuestId(user.id,type,0,ordinal+i,`buffer-v3:${skips}`),type,status:"active",date:day,created_at:new Date().toISOString()};
  lessons.push({quest:await freezeLesson(repo,user.id,quest),ordinal:ordinal+i});
 }
 const readiness=missionProgress(profile),content=await journeyModels.generate(profile,"mission",calculateDifficulty(profile.level));
 const mission:Quest={...content,id:await plannedQuestId(user.id,"mission",readiness.cycle,readiness.attempts,day),type:"mission",status:"active",date:day,created_at:new Date().toISOString()};
 const lessonPack:LessonPack={key,policy:3,lessons,mission:await freezeLesson(repo,user.id,mission)};await repo.commit(user.id,key,lease,profile.progression_revision??0,null,null,{lessonPack});return journeyReply(lessonPack);
 }finally{await repo.release(user.id,key,lease);}
}catch(error){return journeyFailure(error);}}
export async function POST(req:NextRequest){try{
 const {user,url}=await journeyAuth(req),client=await trustedClient(url),repo=journeyRepository(client);
 const input=await journeyBody(req,2000) as {key?:string;questId?:string};
 if(typeof input.key!=="string"||!input.key.startsWith("lesson-pack:")||typeof input.questId!=="string")throw new JourneyError("Reopen your daily lesson.",400);
 const saved=await repo.action(user.id,input.key) as unknown as {lessonPack?:LessonPack}|null;
 const lesson=saved?.lessonPack?.lessons.find(l=>l.quest.id===input.questId)??(saved?.lessonPack?.mission?.id===input.questId?{quest:saved.lessonPack.mission,ordinal:-1}:null),profile=await repo.profile(user.id);
 if(!lesson||!profile)throw new JourneyError("Reopen your daily lesson.",404);
 const stored=await repo.quest(user.id,lesson.quest.id);if(stored)return journeyReply({profile,quest:stored});
 const active=await repo.activeQuest(user.id);if(active)throw new JourneyError("Finish your current lesson first.",409);
 if(lesson.quest.type==="mission"?!missionProgress(profile).eligible:lesson.ordinal!==count(profile.quest_history))throw new JourneyError("This lesson is not ready yet.",409);
 if(lesson.quest.type==="mission"){const m=missionProgress(profile);if(lesson.quest.id!==await plannedQuestId(user.id,"mission",m.cycle,m.attempts,todayStr()))throw new JourneyError("Reopen your mission.",409);}
 const readiness=missionProgress(profile);
 const provenance=lesson.quest.type==="mission"&&await repo.verifiedCredits(user.id)<Math.max(2,readiness.readyChecks)?"legacy":"server";
 const plan={questId:lesson.quest.id,questType:lesson.quest.type,difficulty:lesson.quest.difficulty,day:todayStr(),cycle:readiness.cycle,attempt:readiness.attempts,provenance};
 const key=`generate:${lesson.quest.id}`,lease=crypto.randomUUID(),claim=await repo.claim(user.id,key,"generate",{},plan,lease);
 if(claim.status==="complete")return journeyReply(claim.result);
 if(claim.status!=="claimed")throw new JourneyError("Your lesson is being saved. Try again shortly.",409);
 try{return journeyReply(await repo.commit(user.id,key,lease,profile.progression_revision??0,profile,lesson.quest,{}));}finally{await repo.release(user.id,key,lease);}
}catch(error){return journeyFailure(error);}}
export async function PUT(req:NextRequest){try{
 const {user,url}=await journeyAuth(req),client=await trustedClient(url),repo=journeyRepository(client);
 const profile=await repo.profile(user.id),old=await repo.activeQuest(user.id);
 if(!profile||!old||old.type==="mission"||old.learning)return journeyReply({profile,quest:old});
 const key=`lesson-format:${old.id}`,lease=crypto.randomUUID(),claim=await repo.claim(user.id,key,"economy",{questId:old.id},{},lease);
 if(claim.status==="complete")return journeyReply(claim.result);
 if(claim.status!=="claimed")throw new JourneyError("Your daily lesson is being prepared.",409);
 try{
 const content=await journeyModels.generate(profile,old.type,old.difficulty),quest={...old,...content,id:old.id};
 return journeyReply(await repo.commit(user.id,key,lease,profile.progression_revision??0,profile,quest,{previousQuest:old}));
 }finally{await repo.release(user.id,key,lease);}
}catch(error){return journeyFailure(error);}}
