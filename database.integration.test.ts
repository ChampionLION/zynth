import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PGlite} from "@electric-sql/pglite";
import {buildProfile} from "./src/lib/engines/onboarding";
import {mockClassifyOnboarding,mockGenerateQuest,mockGradeResponse} from "./src/lib/llm/mock";
import {completeStoredQuest,RevisionConflict,type CompletionRepository,type CompletionResponse,type CommittedResult} from "./src/lib/server/complete-quest";
import type {Profile,Quest} from "./src/lib/types";

async function main(){
 const db=new PGlite();
 try{
 await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
 CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role;
 GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated,service_role;`);
 await db.exec(readFileSync("supabase/schema.sql","utf8"));
 await db.exec(readFileSync("supabase/migrations/20261015_auth_and_resume.sql","utf8"));
 await db.exec(readFileSync("supabase/migrations/20261015204720_evolution_foundation.sql","utf8"));
 await db.exec("GRANT SELECT,INSERT,UPDATE,DELETE ON public.profiles,public.quests TO service_role,authenticated;");
 const owners=["00000000-0000-4000-8000-000000000001","00000000-0000-4000-8000-000000000002"];
 const classified=mockClassifyOnboarding({Q1:["Designer"],Q2:["A"],Q3:["B"],Q4:["C"],Q5:["D"]});
 const profile=buildProfile(owners[0],"Database test",classified);
 for(const owner of owners){
   await db.query("INSERT INTO auth.users VALUES($1)",[owner]);
   const seed={...profile,user_id:owner};const columns=Object.keys(seed);
   const values=Object.values(seed).map(v=>typeof v==="object"&&v!==null?JSON.stringify(v):v);
   await db.query(`INSERT INTO public.profiles (${columns.join(",")}) VALUES (${columns.map((_,i)=>`$${i+1}`).join(",")})`,values);
 }
 const q1="10000000-0000-4000-8000-000000000001",q2="10000000-0000-4000-8000-000000000002";
 for(const quest of [q1,q2])await db.query("INSERT INTO public.quests(id,user_id,quest_data,quest_type,difficulty) VALUES($1,$2,'{}','daily',1)",[quest,owners[0]]);
 const result={gradeResult:{grade:"Good",behavioral_signals:{}},expEarned:9,events:[{kind:"level_up",from:1,to:2}],responseText:"A meaningful test response"};
 const next={...profile,exp:9,cumulative_exp:9,display_name:"Must not replace settings",character_name:"Must not replace settings"};
 const commit=(quest:string,revision:number,p=next,r=result)=>db.query<{value:{replayed:boolean;profile:typeof profile;result:typeof result}}>("SELECT public.commit_quest_result($1,$2,$3,$4,$5) AS value",[owners[0],quest,revision,JSON.stringify(p),JSON.stringify(r)]);
 await db.exec(`SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${owners[0]}',false);`);
 await assert.rejects(()=>commit(q1,0),/permission denied/);
 await assert.rejects(()=>db.query("INSERT INTO public.quest_outcomes VALUES($1,$2,'{}',now())",[owners[0],q1]),/permission denied/);
 await db.query("INSERT INTO public.user_preferences(user_id,theme,motion) VALUES($1,'light','reduced')",[owners[0]]);
 await assert.rejects(()=>db.query("INSERT INTO public.user_preferences(user_id) VALUES($1)",[owners[1]]),/row-level security/);
 await db.exec("RESET ROLE; SET ROLE service_role;");
 const committed=(await commit(q1,0)).rows[0].value;
 assert.equal(committed.replayed,false);assert.equal(committed.profile.exp,9);
 assert.equal(committed.profile.display_name,profile.display_name,"Trusted math cannot overwrite settings");
 assert.equal(committed.profile.character_name,null);
 const repeats=await Promise.all(Array.from({length:8},()=>commit(q1,0)));
 assert.ok(repeats.every(x=>x.rows[0].value.replayed));
 assert.equal((await db.query<{count:number}>("SELECT count(*)::int AS count FROM public.quest_outcomes")).rows[0].count,1);
 assert.equal((await db.query<{count:number}>("SELECT count(*)::int AS count FROM public.progression_events")).rows[0].count,1);
 assert.equal((await db.query<{status:string}>("SELECT status FROM public.quests WHERE id=$1",[q1])).rows[0].status,"completed");
 await assert.rejects(()=>commit(q2,0),/Profile version changed/);
 await assert.rejects(()=>commit(q2,1,{...next,user_id:owners[1]}),/Profile owner mismatch/);
 // Deliberately fail event insertion after profile/quest mutation: all must roll back.
 await assert.rejects(()=>commit(q2,1,next,{...result,events:[{} as typeof result.events[0]]}),/null value/);
 const afterRollback=(await db.query<{exp:number;progression_revision:number}>("SELECT exp,progression_revision FROM public.profiles WHERE user_id=$1",[owners[0]])).rows[0];
 assert.equal(afterRollback.exp,9);assert.equal(Number(afterRollback.progression_revision),1);
 assert.equal((await db.query<{status:string}>("SELECT status FROM public.quests WHERE id=$1",[q2])).rows[0].status,"active");
 await db.exec(`RESET ROLE; SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${owners[1]}',false);`);
 assert.equal((await db.query("SELECT * FROM public.quest_outcomes")).rows.length,0);
 assert.equal((await db.query("SELECT * FROM public.progression_events")).rows.length,0);
 assert.equal((await db.query("SELECT * FROM public.user_preferences")).rows.length,0);
 await db.exec("RESET ROLE; SET ROLE anon;");
 await assert.rejects(()=>commit(q2,1),/permission denied/);
 await db.exec("RESET ROLE; SET ROLE service_role;");
 const quest={...mockGenerateQuest(profile,"daily",1),id:q2,created_at:new Date(Date.now()-180000).toISOString(),date:new Date().toISOString().slice(0,10),status:"active" as const};
 await db.query("UPDATE public.quests SET quest_data=$1 WHERE id=$2",[JSON.stringify(quest),q2]);
 const repo:CompletionRepository={
   profile:async owner=>(await db.query<{value:Profile}>("SELECT to_jsonb(p) AS value FROM public.profiles p WHERE user_id=$1",[owner])).rows[0]?.value??null,
   quest:async(owner,id)=>(await db.query<{value:Quest}>("SELECT quest_data || jsonb_build_object('status',status) AS value FROM public.quests WHERE user_id=$1 AND id=$2",[owner,id])).rows[0]?.value??null,
   outcome:async(owner,id)=>(await db.query<{value:CommittedResult}>("SELECT result AS value FROM public.quest_outcomes WHERE user_id=$1 AND quest_id=$2",[owner,id])).rows[0]?.value??null,
   claim:async(owner,id,lease)=>(await db.query<{value:boolean}>("SELECT claim_quest_submission($1,$2,$3) AS value",[owner,id,lease])).rows[0].value,
   release:async(owner,id,lease)=>{await db.query("SELECT release_quest_submission($1,$2,$3)",[owner,id,lease]);},
   commit:async(owner,id,version,p,r)=>{try{return (await db.query<{value:CompletionResponse}>("SELECT commit_quest_result($1,$2,$3,$4,$5) AS value",[owner,id,version,JSON.stringify(p),JSON.stringify(r)])).rows[0].value;}catch(e){if((e as {code?:string}).code==="40001")throw new RevisionConflict();throw e;}},
 };
 let gradingCalls=0;
 const grader=async(args:Parameters<typeof mockGradeResponse>[0])=>{gradingCalls++;return mockGradeResponse(args);};
 await assert.rejects(()=>completeStoredQuest(owners[0],{questId:q2,responseText:"Hello",grade:"Excellent"},repo,grader),/valid response/);
 await assert.rejects(()=>completeStoredQuest(owners[1],{questId:q2,responseText:"Hello"},repo,grader),/not available/);
 const inputs={questId:q2,responseText:"I would first map out the audience and the constraints for this design, then compare two approaches using a clear criterion. I would sketch a short flow, describe what each step does, and explain why the simpler version makes this easier to use."};
 const finishes=await Promise.allSettled(Array.from({length:6},()=>completeStoredQuest(owners[0],inputs,repo,grader)));
 assert.equal(gradingCalls,1,"The database lease suppresses duplicate model calls");assert.ok(finishes.some(r=>r.status==="fulfilled"));
 const replay=await completeStoredQuest(owners[0],inputs,repo,grader);assert.equal(replay.replayed,true);assert.equal(gradingCalls,1);
 assert.equal(replay.profile.quest_history.filter(q=>q.quest_id===q2).length,1);
 const q3="10000000-0000-4000-8000-000000000003";
 await db.query("INSERT INTO public.quests(id,user_id,quest_data,quest_type,difficulty) VALUES($1,$2,$3,'daily',1)",[q3,owners[0],JSON.stringify({...quest,id:q3})]);
 await assert.rejects(()=>completeStoredQuest(owners[0],{...inputs,questId:q3,responseText:"A distinct response about assessing information quality and testing a hypothesis against concrete observations before changing the design."},repo,async()=>{throw new Error("provider unavailable");}),/provider unavailable/);
 assert.equal(await repo.outcome(owners[0],q3),null);
 assert.equal((await db.query("SELECT * FROM public.quest_submission_leases WHERE quest_id=$1",[q3])).rows.length,0,"Provider failure releases the lease and preserves the attempt");
 console.log("Embedded Postgres passed: schema/migration execution, RLS preferences and account isolation, service-only commit, replay idempotency, revision conflict and atomic rollback. PGlite serializes queries; multi-connection hosted race testing remains separate.");
 }finally{await db.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
