import assert from "node:assert/strict";
import {PGlite} from "@electric-sql/pglite";
import {setupJourneyDatabase,sqlRepositories,fixtureOwners} from "./journey.integration.test";
import {runJourneyAction,type JourneyModels} from "./src/lib/server/journey-actions";
import {buildProfile} from "./src/lib/engines/onboarding";
import {mockClassifyOnboarding,mockGenerateQuest,mockDailyQuestion,mockGradeResponse,mockEvolveSkillName,mockDiscoveryMessage,mockBehaviorSummary} from "./src/lib/llm/mock";
import {restoreStreak,streakRecovery} from "./src/lib/engines/streak";
import {runPostGradePipeline} from "./src/lib/engines/pipeline";
import type {Profile,Quest} from "./src/lib/types";

const answers={Q1:["Designer"],Q2:["A"],Q3:["B"],Q4:["C"],Q5:["D"]};
const today=new Date().toISOString().slice(0,10),day=(ago:number)=>new Date(Date.parse(today)-ago*86400000).toISOString().slice(0,10);
const base=()=>buildProfile(fixtureOwners[0],"Mira",mockClassifyOnboarding(answers));
function history(p:Profile,days:number[]){p.quest_history=days.map(ago=>({quest_id:crypto.randomUUID(),quest_title:"Lesson",quest_type:"daily",grade:"Good",exp_earned:10,skills_targeted:[],completed_at:`${day(ago)}T12:00:00.000Z`}));p.last_quest_date=day(Math.min(...days));p.tokens=5;}
async function main(){
 const p=base();history(p,[5,4,3]);p.streak=3;
 const quote=streakRecovery(p)!;assert.equal(quote.cost,2);assert.equal(quote.streak,3);
 const poor=structuredClone(p);poor.tokens=1;assert.throws(()=>restoreStreak(poor,quote.gap),/need 2/);assert.equal(poor.tokens,1);
 assert.throws(()=>restoreStreak(p,"2000-01-01:2000-01-02"),/changed/);
 restoreStreak(p,quote.gap);assert.equal(p.tokens,3);assert.equal(streakRecovery(p),null);assert.equal(p.quest_history.length,3);assert.equal(p.cumulative_exp,0);
 assert.throws(()=>restoreStreak(p,quote.gap),/changed/);assert.equal(p.tokens,3);
 const tomorrow=new Date(Date.parse(today)+86400000).toISOString().slice(0,10);
 assert.equal(streakRecovery(p,tomorrow)?.cost,1,"Previously purchased days are never charged twice");
 const q:Quest={...mockGenerateQuest(p,"daily",2),id:crypto.randomUUID(),date:today,created_at:new Date().toISOString(),status:"active"};
 const response=`Option ${q.learning!.check.correct_option}`;
 const result=await runPostGradePipeline({profile:p,quest:q,gradeResult:mockGradeResponse({quest:q,response,profile:p,responseTimeSeconds:90}),responseText:response,responseTimeSeconds:90,swiftModeUsed:false,exploit:{severity:null,flag_type:null,rejected:false,expPenalty:1,strictGrader:false},enrichment:{skillName:async(name,_profile,tier)=>mockEvolveSkillName(name,tier),discoveryMessage:async(name,profile)=>mockDiscoveryMessage(name,profile.profession),behaviorSummary:async profile=>mockBehaviorSummary(profile)}});
 assert.equal(result.profile.streak,4,"Next real completion increments the restored streak instead of resetting it");
 const after=base();history(after,[6,5,4,1,0]);after.streak=2;const afterQuote=streakRecovery(after)!;assert.equal(afterQuote.cost,2);assert.equal(afterQuote.streak,5);restoreStreak(after,afterQuote.gap);assert.equal(after.streak,5);assert.equal(streakRecovery(after),null);
 const intact=base();history(intact,[2,1,0]);assert.equal(streakRecovery(intact),null);
 const failed=base();history(failed,[3,0]);failed.quest_history[1].grade="Fail";assert.equal(streakRecovery(failed)?.streak,1,"Failed responses never add streak days");
 // Use the existing private SQL/CAS path: no schema change or production data needed.
 const db=new PGlite();try{
  await setupJourneyDatabase(db);await db.exec("SET ROLE service_role");const {repo}=sqlRepositories(db);
  const models:JourneyModels={classify:async()=>mockClassifyOnboarding(answers),generate:async(p,t,d)=>mockGenerateQuest(p,t,d),question:async p=>mockDailyQuestion(p)};
  const user={id:fixtureOwners[0],name:"Mira",email:"fixture@local.test"};
  await runJourneyAction(user,{kind:"onboard",answers},repo,models);
  const fixture=base();history(fixture,[5,4,3]);fixture.streak=3;
  await db.query("UPDATE public.profiles SET quest_history=$2, last_quest_date=$3,streak=3,tokens=5 WHERE user_id=$1",[user.id,JSON.stringify(fixture.quest_history),fixture.last_quest_date]);
  const action={kind:"restore_streak",gap:streakRecovery(fixture)!.gap};
  await assert.rejects(()=>runJourneyAction(user,{...action,cost:0},repo,models),/not valid/);
  const restored=await runJourneyAction(user,action,repo,models);assert.equal(restored.profile?.tokens,3);assert.equal(restored.profile?.streak,3);
  const repeated=await runJourneyAction(user,action,repo,models);assert.equal(repeated.replayed,true);assert.equal(repeated.profile?.tokens,3);assert.equal(repeated.profile?.memory.milestones.filter(m=>m.type==="streak_restored").length,1);
 }finally{await db.close();}
 console.log("Streak recovery checks passed: cost, insufficient balance, real-day history, resumed streak, strict server inputs and SQL replay.");
}
main().catch(e=>{console.error(e);process.exitCode=1;});
