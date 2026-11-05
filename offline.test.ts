import assert from "node:assert/strict";
import {sessionStorageAdapter,setRememberSession,remembersSession} from "./src/lib/remember-session";
import {nextLessons,syncOfflineStudy} from "./src/lib/offline-sync";
import {emptyJournal,finishStudy,readOfflinePack,writeOfflinePack,queuedQuest,queueQuest,acknowledgeQueuedQuest,mergeJournals,type OfflinePack} from "./src/lib/offline-learning";
import {buildProfile} from "./src/lib/engines/onboarding";
import {mockClassifyOnboarding} from "./src/lib/llm/mock";
import {signIn,signOut} from "./src/lib/auth";
import type {Domain} from "./src/lib/types";
const local=new Map<string,string>(),session=new Map<string,string>();
function fakeStorage(data:Map<string,string>){return {getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>data.set(key,value),removeItem:(key:string)=>data.delete(key),clear:()=>data.clear(),key:(index:number)=>[...data.keys()][index]??null,get length(){return data.size;}};}
Object.defineProperty(globalThis,"localStorage",{value:fakeStorage(local),configurable:true});Object.defineProperty(globalThis,"sessionStorage",{value:fakeStorage(session),configurable:true});
Object.defineProperty(globalThis,"window",{value:new EventTarget(),configurable:true});
async function main(){
 const key="sb-offline-test-auth-token";
 sessionStorageAdapter.setItem(key,"original-session");sessionStorageAdapter.setItem(`${key}-code-verifier`,"pkce");
 assert.equal(local.get(key),"original-session");setRememberSession(false,key);
 assert.equal(remembersSession(),false);assert.equal(local.has(key),false);assert.equal(session.get(key),"original-session");assert.equal(session.get(`${key}-code-verifier`),"pkce");
 session.clear();assert.equal(sessionStorageAdapter.getItem(key),null,"Closing a non-remembered tab discards its session");
 setRememberSession(true,key);sessionStorageAdapter.setItem(key,"persistent-session");session.clear();assert.equal(sessionStorageAdapter.getItem(key),"persistent-session");
 sessionStorageAdapter.removeItem(key);assert.equal(local.has(key),false);
 const user={id:"00000000-0000-4000-8000-000000000003",email:"offline@local.test",name:"Offline learner"};
 const profile=buildProfile(user.id,user.name,mockClassifyOnboarding({Q1:["Designer"],Q2:["A"],Q3:["B"],Q4:["C"],Q5:["D"]}));
 for(const domain of ["TECHNICAL","CREATIVE","ANALYTICAL","SOCIAL","STRATEGIC"] as Domain[]){
  const p={...profile,domain};let pack:OfflinePack={version:1,owner:user.id,user,profile:p,quest:null,mode:"trusted",lessons:nextLessons(p,emptyJournal()),journal:emptyJournal(),updatedAt:new Date().toISOString()};
  assert.equal(pack.lessons.length,3);assert.equal(new Set(pack.lessons.map(q=>q.title)).size,3);
  assert.throws(()=>finishStudy(pack,pack.lessons[1],"Choice A"),/earlier lesson/);
  for(const lesson of pack.lessons){pack=finishStudy(pack,lesson,"Choice A");writeOfflinePack(pack);pack=readOfflinePack(user.id)!;}
  assert.equal(pack.journal.cursors[domain],3);assert.equal(pack.lessons.filter(q=>q.sequence>=3).length,0);
  const next=nextLessons(p,pack.journal);assert.deepEqual(next.map(q=>q.sequence),[3,4,5]);assert.equal(next.length,3);
  assert.equal(readOfflinePack("different-account"),null,"Account B never reads A's cache");
 }
 queueQuest(user.id,"quest-one","A saved answer");const queued=queuedQuest(user.id)!;
 assert.throws(()=>queueQuest(user.id,"quest-two","different answer"),/Sync your saved quest/);
 queueQuest(user.id,"quest-one","Edited answer");acknowledgeQueuedQuest(user.id,queued);assert.equal(queuedQuest(user.id)?.responseText,"Edited answer","An in-flight receipt cannot erase a later edit");
 acknowledgeQueuedQuest(user.id,queuedQuest(user.id)!);assert.equal(queuedQuest(user.id),null);
 // Exercise actual SDK Auth GET/PUT, keeping each device journal isolated.
 process.env.NEXT_PUBLIC_SUPABASE_URL="https://offline-test.supabase.co";process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_local_test";
 const account={id:user.id,email:user.email,role:"authenticated",aud:"authenticated",user_metadata:{full_name:user.name} as Record<string,unknown>,created_at:new Date().toISOString()};
 const jwt=[Buffer.from('{"alg":"HS256"}').toString('base64url'),Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),"fixture"].join('.');
 const original=globalThis.fetch;
 globalThis.fetch=async(input,init)=>{const url=new URL(String(input));assert.equal(url.hostname,"offline-test.supabase.co");const body=init?.body?JSON.parse(String(init.body)):null;
  if(url.pathname==="/auth/v1/token")return Response.json({access_token:jwt,refresh_token:"fixture",expires_in:3600,token_type:"bearer",user:account});
  if(url.pathname==="/auth/v1/user"){if(init?.method==="PUT")Object.assign(account.user_metadata,body.data);return Response.json(account);}
  if(url.pathname==="/auth/v1/logout")return new Response(null,{status:204});throw new Error(`Unexpected request ${url.pathname}`);
 };
 try{
  await signIn(user.email,"fixture-password",true);
  const first=await syncOfflineStudy(user,profile,null,"trusted");assert.equal(first.lessons.length,3);
  writeOfflinePack(finishStudy(first,first.lessons[0],"Choice A"));
  const refill=await syncOfflineStudy(user,profile,null,"trusted");assert.deepEqual(refill.lessons.map(q=>q.sequence),[1,2,3]);
  local.set("zynth:study-device","second-device");const second=await syncOfflineStudy(user,profile,null,"trusted");
  writeOfflinePack(finishStudy(second,second.lessons[0],"Choice B"));await syncOfflineStudy(user,profile,null,"trusted");
  const journals=Object.entries(account.user_metadata).filter(([key])=>key.startsWith("zynth_study_"));assert.equal(journals.length,2);assert.equal(mergeJournals(...journals.map(([,v])=>v as ReturnType<typeof emptyJournal>)).cursors[profile.domain],2);
  assert.equal(account.user_metadata.full_name,user.name,"Study sync preserves other account metadata");await signOut();
 }finally{globalThis.fetch=original;}
 console.log("Offline checks passed: remembered/session-only sign-in, PKCE migration, three-lesson packs across five domains, restart/draft ownership, ordered completion, refill, safe queue acknowledgements, actual SDK study sync and independent device journals.");
}
void main().catch(error=>{console.error(error);process.exitCode=1;});
