import assert from "node:assert/strict";
import {buildProfile} from "./src/lib/engines/onboarding";
import {mockClassifyOnboarding,mockGenerateQuest,mockBehaviorSummary,mockDiscoveryMessage} from "./src/lib/llm/mock";
import {learningFocus,STAT_KEYS,statValue} from "./src/lib/learning-focus";
import {gradeLearningCheck,generatedQuest} from "./src/lib/learning";
import {runPostGradePipeline} from "./src/lib/engines/pipeline";
import {lessonRewards} from "./src/lib/engines/lesson-rewards";
import {nextCachedLesson,saveJourneyCache} from "./src/lib/lesson-cache";
import {todayStr} from "./src/lib/engines/quest";
import type {Profile,Quest} from "./src/lib/types";
const base=()=>buildProfile("00000000-0000-4000-8000-000000000051","Mira",mockClassifyOnboarding({Q1:["Software developer"],Q2:["A"],Q3:["B"],Q4:["C"],Q5:["D"]}));
const quest=(p:Profile):Quest=>({...mockGenerateQuest(p,"daily",1),id:crypto.randomUUID(),status:"active",date:todayStr(),created_at:new Date().toISOString()});
const enrichment={skillName:async(name:string)=>name,discoveryMessage:async(name:string,p:Profile)=>mockDiscoveryMessage(name,p.profession),behaviorSummary:async(p:Profile)=>mockBehaviorSummary(p)};
const complete=async(p:Profile,q:Quest,wrong=false)=>{
 const selected=wrong?q.learning!.check.options.find(o=>o.key!==q.learning!.check.correct_option)!.key:q.learning!.check.correct_option;
 const response=`Option ${selected}`;
 return runPostGradePipeline({profile:p,quest:q,gradeResult:gradeLearningCheck(q,response)!,responseText:response,responseTimeSeconds:180,swiftModeUsed:false,exploit:{severity:null,flag_type:null,rejected:false,expPenalty:1,strictGrader:false},enrichment});
};
async function main(){
 const p=base();p.skills.forEach(s=>s.level=10);p.skills.at(-1)!.level=1;
 const focus=learningFocus(p),q=quest(p);
 assert.equal(q.skills_targeted[0],p.skills.at(-1)!.name);assert.deepEqual(q.stats_targeted,focus.stats);
 assert.doesNotThrow(()=>generatedQuest(q,p,"daily",1));
 assert.throws(()=>generatedQuest({...q,skills_targeted:[p.skills[0].name]},p,"daily",1),/priority skill/);
 const struggling=base();struggling.skills.forEach(s=>s.level=3);
 struggling.quest_history=[0,1].map(i=>({quest_id:`correction-${i}`,quest_title:"Practice",quest_type:"daily",grade:"Basic",completed_at:new Date().toISOString(),skills_targeted:[struggling.skills.at(-1)!.name],exp_earned:6,learning_topics:["A difficult idea"]}));
 assert.equal(learningFocus(struggling).skills[0],struggling.skills.at(-1)!.name);
 let current=base();current.tokens=4;
 for(let i=1;i<=7;i++){
  const lesson=quest(current),result=await complete(current,lesson,i===2);
  assert.equal(result.profile.streak,1,"Several lessons in a day count as one streak day");
  assert.equal(result.profile.quest_history.at(-1)!.bonus_exp??0,i===1?0:2);
  assert.equal(result.profile.tokens,4+Math.floor((i-1)/2),"Every pair of extra lessons earns a bankable token, including above five");
  assert.equal(result.expEarned,(i===2?6:9)+(i===1?0:2));
  await assert.rejects(()=>complete(result.profile,lesson),/already graded/);
  current=result.profile;
 }
 assert.deepEqual(lessonRewards(current,{type:"mission"},"Good",todayStr()),{bonusExp:0,skipTokens:0});
 const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
 current.quest_history.forEach(q=>q.completed_at=`${yesterday}T12:00:00Z`);current.streak=4;current.last_quest_date=todayStr();
 const resumed=await complete(current,quest(current),true);
 assert.equal(resumed.profile.streak,5,"A correction counts as learning, and a prior same-day skip must not swallow the real streak day");
 assert.equal(resumed.profile.quest_history.at(-1)!.bonus_exp??0,0,"Bonus counts reset each day");
 for(const key of STAT_KEYS){
  let learner=base();for(const k of STAT_KEYS){if(k==="stat_5"||k==="stat_6")learner.stats[k].value=20;else learner.stats[k]=20;}
  if(key==="stat_5"||key==="stat_6")learner.stats[key].value=10;else learner.stats[key]=10;
  const lesson=quest(learner);assert.equal(lesson.stats_targeted![0],key);
  for(let i=0;i<3;i++)learner=(await complete(learner,{...lesson,id:crypto.randomUUID()})).profile;
  assert.ok(statValue(learner,key)>10,`${key} can improve with supported successful practice`);
 }
 const storage=new Map<string,string>();Object.defineProperty(globalThis,"localStorage",{value:{getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,v:string)=>storage.set(k,v)},configurable:true});
 Object.defineProperty(globalThis,"navigator",{value:{onLine:false},configurable:true});
 const learner=base(),future=quest(learner);future.date="2099-01-01";
 saveJourneyCache({user:{id:learner.user_id,name:"Mira",email:"local@test.invalid"},profile:learner,activeQuest:null,pendingOutcome:null,mode:"trusted",pack:{key:"lesson-pack:legacy",lessons:[{quest:future,ordinal:0}]}});
 assert.equal(nextCachedLesson(learner.user_id,learner)?.id,future.id,"Saved lessons no longer wait for a future calendar date");
 console.log("Lesson growth passed: weaker/recently struggling skill targeting, all six stats, seven same-day lessons, bonuses and token pairs, correction streaks, replay protection and unscheduled cached lessons.");
}
void main().catch(error=>{console.error(error);process.exitCode=1;});
