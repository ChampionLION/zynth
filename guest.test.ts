import assert from "node:assert/strict";
import {getCurrentUser} from "./src/lib/auth";
import {loadAccountJourney,saveProfile,loadProfile} from "./src/lib/db";
import {isSupabaseConfigured} from "./src/lib/supabase";
const values=new Map<string,string>([["zynth_profile",JSON.stringify({user_id:"existing-account",streak:42})]]);
Object.assign(globalThis,{window:{},localStorage:{getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v),removeItem:(k:string)=>values.delete(k)}});
async function main(){
 assert.equal(isSupabaseConfigured(),false);
 const user=await getCurrentUser();assert.ok(user);
 const first=await loadAccountJourney(user!);assert.ok(first.profile);assert.equal(first.mode,"legacy");
 const profile={...first.profile!,display_name:"Guest learner"};await saveProfile(profile);
 assert.equal((await loadProfile(user!.id))?.display_name,"Guest learner");
 assert.equal(JSON.parse(values.get("zynth_profile")!).streak,42,"Existing account data remains separate");
 assert.equal((await loadAccountJourney(user!)).profile?.display_name,"Guest learner");
 console.log("Guest access checks passed: no session required, profile creation, local persistence and account isolation.");
}
main().catch(e=>{console.error(e);process.exitCode=1;});
