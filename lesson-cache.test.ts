import assert from "node:assert/strict";
import {useZynth} from "./src/lib/store";
import {saveJourneyCache,nextCachedLesson} from "./src/lib/lesson-cache";
import {buildProfile} from "./src/lib/engines/onboarding";
import {mockClassifyOnboarding,mockGenerateQuest} from "./src/lib/llm/mock";
import {prepareNextQuest,JourneyRequestError} from "./src/lib/journey-client";
import {plannedQuestId,missionProgress} from "./src/lib/engines/quest-cycle";
import type {Quest} from "./src/lib/types";
const data=new Map<string,string>();
Object.defineProperty(globalThis,"localStorage",{value:{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v),removeItem:(k:string)=>data.delete(k)},configurable:true});
Object.defineProperty(globalThis,"window",{value:{location:{origin:"http://localhost:3002"}},configurable:true});
const connection={onLine:false};Object.defineProperty(globalThis,"navigator",{value:connection,configurable:true});
process.env.NEXT_PUBLIC_SUPABASE_URL="http://cache-test.local";process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_fixture";
const user={id:"00000000-0000-4000-8000-000000000001",email:"cache@local.test",name:"Learner"};
const profile=buildProfile(user.id,user.name,mockClassifyOnboarding({Q1:["Designer"],Q2:["A"],Q3:["B"],Q4:["C"],Q5:["D"]}));
const quest={...mockGenerateQuest(profile,"daily",1),id:"00000000-0000-4000-8000-000000000002",date:new Date().toISOString().slice(0,10),created_at:new Date().toISOString(),status:"active" as const};
const token=[Buffer.from('{"alg":"HS256"}').toString('base64url'),Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),"fixture"].join('.');
data.set("sb-cache-test-auth-token",JSON.stringify({access_token:token,refresh_token:"fixture",expires_at:Math.floor(Date.now()/1000)+3600,user,token_type:"bearer"}));
saveJourneyCache({user,profile,activeQuest:quest,mode:"trusted",pendingOutcome:null,pack:{key:"lesson-pack:test",lessons:[{quest,ordinal:0}]}});
assert.equal(nextCachedLesson(user.id,profile)?.id,quest.id);assert.equal(nextCachedLesson("another-account",profile),null);
let cloudReads=0;
const original=globalThis.fetch;globalThis.fetch=async input=>{const path=String(input);if(path==="/api/journey/state"){cloudReads++;return Response.json({mode:"trusted",profile,activeQuest:quest});}if(path.endsWith('/auth/v1/user'))return Response.json(user);throw new Error(`Unexpected fixture request ${path}`);};
void(async()=>{try{
 await useZynth.getState().hydrate();assert.equal(useZynth.getState().activeQuest?.id,quest.id);assert.equal(cloudReads,0);
 connection.onLine=true;await useZynth.getState().hydrate();assert.equal(cloudReads,1,"A synchronous cached restore must not block cloud hydration after reconnecting");
 const requests:string[]=[],fresh={...quest,id:"00000000-0000-4000-8000-000000000003"};
 let cacheStatus=409,cachedQuest:Quest={...quest};
 globalThis.fetch=async input=>{
  const path=String(input);requests.push(path);
  if(path==="/api/journey/lessons")return cacheStatus===200?Response.json({profile,quest:cachedQuest}):Response.json({error:"This lesson is not ready yet."},{status:cacheStatus});
  if(path==="/api/journey/action")return Response.json({profile,quest:fresh});
  throw new Error(`Unexpected preparation request ${path}`);
 };
 for(const status of [404,409]){
  cacheStatus=status;requests.length=0;
  assert.equal((await prepareNextQuest(user.id,profile)).quest?.id,fresh.id);
  assert.deepEqual(requests,["/api/journey/lessons","/api/journey/action"],"An obsolete saved pack falls back to the current server plan");
 }
 cacheStatus=200;cachedQuest={...quest,status:"completed"};requests.length=0;
 assert.equal((await prepareNextQuest(user.id,profile)).quest?.id,fresh.id,"A completed cached quest cannot be reopened");
 for(const status of [401,503]){
  cacheStatus=status;requests.length=0;
  await assert.rejects(()=>prepareNextQuest(user.id,profile),error=>error instanceof JourneyRequestError&&error.status===status);
  assert.deepEqual(requests,["/api/journey/lessons"],"Access and service errors are not bypassed");
 }
 const ready=structuredClone(profile),day=new Date().toISOString().slice(0,10);
 ready.quest_history=[0,1,2].map(i=>({quest_id:`lesson-${i}`,quest_type:"daily",grade:"Good",completed_at:`${day}T0${i}:00:00Z`,learning_topics:[`topic-${i}`],quest_title:"Lesson",exp_earned:10,skills_targeted:[]}));
 const oldMission={...quest,type:"mission" as const,id:await plannedQuestId(user.id,"mission",1,0,day)};
 ready.memory.milestones.push({type:"mission_skipped",date:`${day}T04:00:00Z`,quest_id:oldMission.id,cycle:1});
 assert.equal(missionProgress(ready).attempts,1);
 saveJourneyCache({user,profile:ready,activeQuest:null,mode:"trusted",pendingOutcome:null,pack:{key:"lesson-pack:old",lessons:[],mission:oldMission}});
 requests.length=0;cacheStatus=409;
 assert.equal((await prepareNextQuest(user.id,ready)).quest?.id,fresh.id);
 assert.deepEqual(requests,["/api/journey/action"],"A skipped mission changes its attempt; its old cached plan must not block the retry");
 console.log("Shared lesson cache passed: isolation, reconnect, stale pack recovery, completed-quest protection, mission retry planning and preserved access/service errors.");
}finally{globalThis.fetch=original;}})().catch(error=>{console.error(error);process.exitCode=1;});
