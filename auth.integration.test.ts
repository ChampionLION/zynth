import assert from "node:assert/strict";
import {signIn,signUp,signOut,getCurrentUser} from "./src/lib/auth";
import {useZynth} from "./src/lib/store";
import {supabase} from "./src/lib/supabase";
import {saveOnboardingDraft,saveQuestDraft,loadProfile} from "./src/lib/db";
import {resumePath,parseOnboardingDraft,parseQuestDraft,newestDraft} from "./src/lib/account-flow";
import {buildProfile} from "./src/lib/engines/onboarding";
import {mockClassifyOnboarding,mockGenerateQuest} from "./src/lib/llm/mock";
import type {Quest} from "./src/lib/types";

// Exercise the actual Supabase SDK, data layer, and store against a deterministic
// Auth/PostgREST contract. No real accounts, email, or external requests are used.
process.env.NEXT_PUBLIC_SUPABASE_URL="https://account-test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_test_fixture";
process.env.NEXT_PUBLIC_ZYNTH_MODE="mock";
const storage=new Map<string,string>();
Object.defineProperty(globalThis,"window",{value:{location:{origin:"http://localhost:3001"}},configurable:true});
Object.defineProperty(globalThis,"localStorage",{value:{getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,v:string)=>storage.set(k,v),removeItem:(k:string)=>storage.delete(k)},configurable:true});
const accounts=["a","b"].map((name,i)=>({id:`00000000-0000-4000-8000-00000000000${i+1}`,email:`${name}@local.test`,aud:"authenticated",role:"authenticated",user_metadata:{full_name:`Explorer ${name}`},created_at:new Date().toISOString()}));
const tables:Record<string,Record<string,unknown>[]>={profiles:[],quests:[],onboarding_drafts:[]};
const originalFetch=globalThis.fetch;
let failWrites=false;
let gateProfile:Promise<void>|null=null;
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json"}});
const jwt=(id:string)=>[Buffer.from(JSON.stringify({alg:"HS256",typ:"JWT"})).toString("base64url"),Buffer.from(JSON.stringify({sub:id,exp:Math.floor(Date.now()/1000)+3600,role:"authenticated"})).toString("base64url"),"testsignature"].join(".");
globalThis.fetch=async(input,init)=>{
 const url=new URL(typeof input==="string"?input:input instanceof URL?input.href:input.url);
 assert.equal(url.hostname,"account-test.supabase.co","Tests must never contact an external service");
 const method=init?.method??"GET",headers=new Headers(init?.headers);
 const body=init?.body?JSON.parse(String(init.body)):null;
 const token=headers.get("authorization")?.replace(/^Bearer /,"");
 const caller=accounts.find(a=>jwt(a.id)===token);
 if(url.pathname==="/auth/v1/signup")return reply({...accounts[0],identities:[]});
 if(url.pathname==="/auth/v1/token"){
   const account=accounts.find(a=>a.email===body.email);
   if(!account||body.password!=="test-password")return reply({msg:"Invalid login credentials",code:"invalid_credentials"},400);
   return reply({access_token:jwt(account.id),refresh_token:`refresh-${account.id}`,expires_in:3600,token_type:"bearer",user:account});
 }
 if(url.pathname==="/auth/v1/user")return caller?reply(caller):reply({msg:"Invalid token"},401);
 if(url.pathname==="/auth/v1/logout")return new Response(null,{status:204});
 const table=url.pathname.split("/").at(-1)!;
 assert.ok(tables[table],`Unexpected request: ${url.pathname}`);
 if(!caller)return reply({message:"not authenticated"},401);
 if(table==="profiles"&&method==="GET"&&gateProfile)await gateProfile;
 const matches=(row:Record<string,unknown>)=>row.user_id===caller.id&&[...url.searchParams].every(([key,value])=>{
   if(["select","order","limit","on_conflict"].includes(key))return true;
   if(value.startsWith("eq."))return String(row[key])===value.slice(3);
   if(value.startsWith("neq."))return String(row[key])!==value.slice(4);
   throw new Error(`Unhandled filter ${key}=${value}`);
 });
 if(method==="GET")return reply(tables[table].filter(matches).slice(0,Number(url.searchParams.get("limit")??100)));
 if(failWrites)return reply({message:"simulated save failure"},503);
 if(method==="POST"){
   if(body.user_id!==caller.id)return reply({message:"row-level security policy"},403);
   const key=table==="quests"?"id":"user_id";
   const index=tables[table].findIndex(r=>r[key]===body[key]);
   if(index<0)tables[table].push(body);else if(!headers.get("prefer")?.includes("resolution=ignore-duplicates"))tables[table][index]=body;
   return headers.get("prefer")?.includes("return=representation")?reply(index<0?[body]:[]):new Response(null,{status:201});
 }
 if(method==="PATCH"){tables[table]=tables[table].map(r=>matches(r)?{...r,...body}:r);return new Response(null,{status:204});}
 if(method==="DELETE"){tables[table]=tables[table].filter(r=>!matches(r));return new Response(null,{status:204});}
 throw new Error(`Unexpected method ${method}`);
};

async function main(){
 const now=new Date().toISOString();
 assert.equal(await getCurrentUser(),null);
 assert.equal((await signUp("a@local.test","test-password","Explorer a")).needsConfirmation,true);
 assert.equal(await getCurrentUser(),null,"An unconfirmed signup must not authenticate");
 await assert.rejects(()=>signIn("a@local.test","wrong-password"));
 await signIn("a@local.test","test-password");await useZynth.getState().hydrate();
 assert.equal(useZynth.getState().user?.id,accounts[0].id);
 assert.equal(resumePath(useZynth.getState().profile,null),"/onboarding");
 const onboarding={version:2 as const,goal:"Animator",answers:{Q2:["B"]},step:2,updated_at:now};
 await saveOnboardingDraft(accounts[0].id,onboarding);
 storage.clear();useZynth.getState().reset();await useZynth.getState().hydrate();
 assert.equal(useZynth.getState().onboardingDraft?.goal,"Animator","Onboarding restores from cloud without browser cache");
 assert.equal(parseOnboardingDraft({...onboarding,step:9}),null);
 assert.equal(parseOnboardingDraft({...onboarding,answers:{Q2:["Z"]}}),null);
 const profile=buildProfile(accounts[0].id,"Explorer a",mockClassifyOnboarding({Q1:["Animator"],Q2:["B"],Q3:["A"],Q4:["B"],Q5:["C"]}),"Animator");
 profile.level=7;profile.exp=35;
 await useZynth.getState().setProfile(profile);
 const quest:Quest={...mockGenerateQuest(profile,"calibration",1),id:"10000000-0000-4000-8000-000000000001",date:now.slice(0,10),created_at:now,status:"active"};
 await useZynth.getState().setActiveQuest(quest,accounts[0].id);
 const draft={response:"My unfinished animation idea",step_responses:[],current_step:0,elapsed_seconds:81,updated_at:now};
 await saveQuestDraft(accounts[0].id,quest.id,draft);
 assert.equal(parseQuestDraft({...draft,current_step:1},0),null);
 assert.equal(newestDraft(draft,{...draft,response:"Newer",updated_at:new Date(Date.parse(now)+1000).toISOString()})?.response,"Newer");
 await signOut();useZynth.getState().reset();await useZynth.getState().hydrate();
 assert.equal(useZynth.getState().profile,null,"Sign-out clears private in-memory data");
 await signIn("b@local.test","test-password");await useZynth.getState().hydrate();
 assert.equal(useZynth.getState().profile,null,"A different account cannot inherit a journey");
 assert.equal(useZynth.getState().onboardingDraft,null);
 assert.equal(await loadProfile(accounts[0].id),null,"Other account queries are empty under RLS");
 await assert.rejects(()=>useZynth.getState().setProfile(profile),/sign in again/);
 await assert.rejects(()=>useZynth.getState().setActiveQuest(quest,accounts[0].id),/sign in again/);
 await signOut();useZynth.getState().reset();
 storage.clear();await signIn("a@local.test","test-password");await useZynth.getState().hydrate();
 assert.equal(useZynth.getState().profile?.level,7);
 assert.equal(useZynth.getState().profile?.exp,35);
 assert.equal(useZynth.getState().activeQuest?.draft?.response,draft.response);
 assert.equal(useZynth.getState().activeQuest?.draft?.elapsed_seconds,81);
 assert.equal(resumePath(useZynth.getState().profile,useZynth.getState().activeQuest),"/quest");
 assert.equal(resumePath(profile,{...quest,date:"2020-01-01",draft}),"/dashboard","An old quest must not hijack return routing");
 failWrites=true;await assert.rejects(()=>useZynth.getState().setProfile({...profile,level:8}));
 assert.equal(useZynth.getState().profile?.level,7,"Failed saves preserve the committed profile");failWrites=false;
 let release!:()=>void;gateProfile=new Promise<void>(r=>{release=r;});
 const stale=useZynth.getState().hydrate();await new Promise(r=>setTimeout(r,15));
 await signOut();useZynth.getState().reset();release();await stale;gateProfile=null;
 assert.equal(useZynth.getState().profile,null,"An in-flight load must not restore data after sign-out");
 assert.equal(useZynth.getState().user,null);
 console.log("Account integration passed: confirmation, invalid credentials, cloud onboarding and quest restore, account isolation, failed saves, stale-load protection.");
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await supabase().auth.stopAutoRefresh();globalThis.fetch=originalFetch;});
