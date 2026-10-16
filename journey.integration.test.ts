import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PGlite} from "@electric-sql/pglite";
import {runJourneyAction,type JourneyRepository,type JourneyModels} from "./src/lib/server/journey-actions";
import {completeStoredQuest,RevisionConflict,type CompletionRepository} from "./src/lib/server/complete-quest";
import {mockClassifyOnboarding,mockGenerateQuest,mockDailyQuestion,mockGradeResponse} from "./src/lib/llm/mock";
import {missionProgress} from "./src/lib/engines/quest-cycle";
import type {Profile,Quest} from "./src/lib/types";
import {outcomePresentation,type PendingOutcome} from "./src/lib/journey-contract";
export const journeyMigrations=["supabase/schema.sql","supabase/migrations/20261015_auth_and_resume.sql","supabase/migrations/20261015204720_evolution_foundation.sql","supabase/migrations/20261016105454_trusted_journey_actions.sql","supabase/migrations/20261016105458_trusted_journey_cutover.sql"];
export const fixtureOwners=["00000000-0000-4000-8000-000000000011","00000000-0000-4000-8000-000000000012"];
export const setupSql=`DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role BYPASSRLS; END IF;
END $$;
CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,raw_user_meta_data jsonb DEFAULT '{}',confirmed_at timestamptz DEFAULT now());
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated,service_role;`;
export interface TestDatabase {exec:(sql:string)=>Promise<unknown>;query:<T=Record<string,unknown>>(sql:string,params?:unknown[])=>Promise<{rows:T[]}>}
export async function setupJourneyDatabase(db:TestDatabase){
 await db.exec(setupSql);for(const path of journeyMigrations){if(path.endsWith('trusted_journey_cutover.sql'))await db.exec("GRANT UPDATE(cumulative_exp) ON public.profiles TO authenticated;");await db.exec(readFileSync(path,"utf8"));}
 for(const id of fixtureOwners)await db.query("INSERT INTO auth.users(id) VALUES($1)",[id]);
}
export function sqlRepositories(db:TestDatabase){
 const value=async<T>(sql:string,params:unknown[])=>{try{return (await db.query<{value:T}>(sql,params)).rows[0]?.value;}catch(error){if((error as {code?:string}).code==="40001")throw new RevisionConflict();throw error;}};
 const profile=(owner:string)=>value<Profile|null>("SELECT (SELECT to_jsonb(p) FROM public.profiles p WHERE user_id=$1) AS value",[owner]);
 const quest=async(owner:string,id:string)=>{const row=await value<Record<string,unknown>|null>("SELECT (SELECT to_jsonb(q) FROM public.quests q WHERE user_id=$1 AND id=$2) AS value",[owner,id]);return row?{...(row.quest_data as Quest),id:row.id as string,status:row.status as Quest["status"],created_at:row.created_at as string}:null;};
 const repo:JourneyRepository={profile,quest,
 activeQuest:async owner=>{const id=await value<string|null>("SELECT (SELECT id FROM public.quests WHERE user_id=$1 AND status='active' ORDER BY created_at DESC,id LIMIT 1) AS value",[owner]);return id?quest(owner,id):null;},
 action:(owner,key)=>value("SELECT (SELECT result FROM public.journey_actions WHERE user_id=$1 AND action_key=$2) AS value",[owner,key]),
 claim:(owner,key,kind,input,plan,lease)=>value("SELECT public.claim_journey_action($1,$2,$3,$4,$5,$6) AS value",[owner,key,kind,JSON.stringify(input),JSON.stringify(plan),lease]),
 release:async(owner,key,lease)=>{await db.query("SELECT public.release_journey_action($1,$2,$3)",[owner,key,lease]);},
 commit:(owner,key,lease,revision,p,q,extra)=>value("SELECT public.commit_journey_action($1,$2,$3,$4,$5,$6,$7,$8) AS value",[owner,key,lease,revision,p?JSON.stringify(p):null,q?JSON.stringify(q):null,JSON.stringify(extra),p?JSON.stringify(missionProgress(p,q)):null]),
 rank:owner=>value("SELECT public.trusted_profession_rank($1) AS value",[owner]),
 verifiedCredits:owner=>value("SELECT public.verified_mission_credits($1) AS value",[owner]),
 };
 const completion:CompletionRepository={profile,quest,
 outcome:(owner,id)=>value("SELECT (SELECT result FROM public.quest_outcomes WHERE user_id=$1 AND quest_id=$2) AS value",[owner,id]),
 claim:(owner,id,lease)=>value("SELECT public.claim_quest_submission($1,$2,$3) AS value",[owner,id,lease]),
 release:async(owner,id,lease)=>{await db.query("SELECT public.release_quest_submission($1,$2,$3)",[owner,id,lease]);},
 reject:async(owner,id,revision,p)=>{await value("SELECT public.record_journey_rejection($1,$2,$3,$4) AS value",[owner,id,revision,JSON.stringify(p.exploit_flags)]);},
 commit:(owner,id,revision,p,result)=>value("SELECT public.commit_quest_result($1,$2,$3,$4,$5) AS value",[owner,id,revision,JSON.stringify(p),JSON.stringify(result)]),
 };
 return {repo,completion,value};
}
export async function runJourneyChecks(db:TestDatabase){
 const user={id:fixtureOwners[0],name:"Mira Cole",email:"fixture@local.test"};const {repo,completion,value}=sqlRepositories(db);
 const answers={Q1:["Designer"],Q2:["A"],Q3:["B"],Q4:["C"],Q5:["D"]};
 let generated=0,classified=0;
 const models:JourneyModels={classify:async a=>{classified++;return mockClassifyOnboarding(a);},generate:async(p,t,d)=>{generated++;return mockGenerateQuest(p,t,d);},question:async p=>mockDailyQuestion(p)};
 await db.exec("SET ROLE service_role;");
 const action=(input:unknown)=>runJourneyAction(user,input,repo,models);
 await assert.rejects(()=>action({kind:"onboard",answers,profile:{level:999}}),/not valid/);
 let result=await action({kind:"onboard",answers});assert.equal(result.profile?.level,1);assert.equal(result.profile?.cumulative_exp,0);assert.equal(classified,1);
 await action({kind:"onboard",answers});assert.equal(classified,1,"Reopening onboarding cannot replace the account or reclassify");
 await assert.rejects(()=>action({kind:"prestige",requestId:crypto.randomUUID()}),/level 100/);
 result=await action({kind:"energy",energy:"mid"});assert.equal(result.profile?.energy_today,"mid");
 const q=await action({kind:"daily_question"});assert.ok(q.question);
 await action({kind:"answer_daily",answer:q.question!.options[0].key});
 assert.equal((await repo.profile(user.id))?.continuous_profile_answers.length,1);
 await action({kind:"answer_daily",answer:q.question!.options[0].key});assert.equal((await repo.profile(user.id))?.continuous_profile_answers.length,1);
 const first=await action({kind:"generate"});assert.ok(first.quest);const quest=first.quest!;
 await action({kind:"generate"});assert.equal(generated,1,"The persisted active quest is reused");
 await assert.rejects(()=>runJourneyAction({...user,id:fixtureOwners[1]},{kind:"skip",questId:quest.id},repo,models),/starting profile/);
 await assert.rejects(()=>action({kind:"skip",questId:quest.id,tokens:999}),/not valid/);
 await db.query("UPDATE public.quests SET created_at=now()-interval '3 minutes' WHERE id=$1",[quest.id]);
 let gradingCalls=0;
 const response="I would first draft a simple layout with a clear heading, compare the alternatives, explain the tradeoffs, and test it with another reader before refining the design.";
 const completed=await completeStoredQuest(user.id,{questId:quest.id,responseText:response},completion,async args=>{gradingCalls++;return mockGradeResponse(args);});
 assert.ok(completed.profile.cumulative_exp>0);assert.equal(gradingCalls,1);
 const repeated=await completeStoredQuest(user.id,{questId:quest.id,responseText:response},completion,async args=>{gradingCalls++;return mockGradeResponse(args);});
 assert.equal(repeated.replayed,true);assert.equal(gradingCalls,1);assert.equal(repeated.profile.cumulative_exp,completed.profile.cumulative_exp);
 assert.equal(await value<string>("SELECT provenance AS value FROM public.quest_outcomes WHERE quest_id=$1",[quest.id]),"server");
 const pending=await value<PendingOutcome>("SELECT public.pending_journey_outcome($1) AS value",[user.id]);assert.equal(outcomePresentation(pending).gradeReveal?.expEarned,completed.result.expEarned);
 await db.query("SELECT public.ack_journey_outcome($1,$2,true,0)",[user.id,quest.id]);
 assert.equal((await value<PendingOutcome>("SELECT public.pending_journey_outcome($1) AS value",[user.id]))?.gradeSeen,completed.result.events.length>0?true:undefined);
 for(let i=1;i<=completed.result.events.length;i++)await db.query("SELECT public.ack_journey_outcome($1,$2,true,$3)",[user.id,quest.id,i]);
 assert.equal(await value("SELECT public.pending_journey_outcome($1) AS value",[user.id]),null,"Presentation acknowledges durably without granting again");
 // Prepare a fixture day; no production state or user records are used.
 await db.query("UPDATE public.profiles SET last_quest_date=NULL WHERE user_id=$1",[user.id]);
 const next=await action({kind:"generate"});assert.ok(next.quest);const tokens=next.profile!.tokens;
 await action({kind:"skip",questId:next.quest!.id});await action({kind:"skip",questId:next.quest!.id});
 assert.equal((await repo.profile(user.id))?.tokens,tokens-1,"Repeated skip consumes exactly one token");assert.equal((await repo.quest(user.id,next.quest!.id))?.status,"skipped");
 // Generation failure releases the lease but preserves its exact stored plan.
 await db.query("UPDATE public.profiles SET last_quest_date=NULL WHERE user_id=$1",[user.id]);
 await assert.rejects(()=>runJourneyAction(user,{kind:"generate"},repo,{...models,generate:async()=>{throw Error("Provider unavailable");}}),/Provider unavailable/);
 const failedPlan=await value<string>("SELECT plan->>'questId' AS value FROM public.journey_actions WHERE user_id=$1 AND kind='generate' AND result IS NULL ORDER BY created_at DESC LIMIT 1",[user.id]);
 const recovered=await action({kind:"generate"});assert.equal(recovered.quest?.id,failedPlan);
 // A late SQL failure rolls back both retirement and debit, not only the ledger.
 const beforeFailure=await repo.profile(user.id);
 await db.exec("RESET ROLE; CREATE FUNCTION public.fixture_fail_mission() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Injected mission storage failure'; END $$; CREATE TRIGGER fixture_fail BEFORE INSERT OR UPDATE ON public.journey_mission_state FOR EACH ROW EXECUTE FUNCTION public.fixture_fail_mission(); SET ROLE service_role;");
 await assert.rejects(()=>action({kind:"skip",questId:recovered.quest!.id}),/Injected mission storage failure/);
 assert.equal((await repo.profile(user.id))?.tokens,beforeFailure?.tokens);assert.equal((await repo.quest(user.id,recovered.quest!.id))?.status,"active");
 await db.exec("RESET ROLE; DROP TRIGGER fixture_fail ON public.journey_mission_state; DROP FUNCTION public.fixture_fail_mission(); SET ROLE service_role;");
 // Existing XP-card effects debit and update the same stored challenge atomically.
 await db.query("UPDATE public.quests SET difficulty=2,quest_data=jsonb_set(quest_data,'{difficulty}','2') WHERE id=$1",[recovered.quest!.id]);
 await db.query("UPDATE public.profiles SET xp_cards=2,xp_card_log=$2 WHERE user_id=$1",[user.id,JSON.stringify([{count:2,source:"fixture",earned_at:new Date().toISOString(),expires_at:new Date(Date.now()+86400000).toISOString()}])]);
 await action({kind:"economy",questId:recovered.quest!.id,effect:"reduce_difficulty"});await action({kind:"economy",questId:recovered.quest!.id,effect:"reduce_difficulty"});
 assert.equal((await repo.profile(user.id))?.xp_cards,1);assert.equal((await repo.quest(user.id,recovered.quest!.id))?.difficulty,1);
 await action({kind:"economy",questId:recovered.quest!.id,effect:"hint_upgrade"});assert.equal((await repo.profile(user.id))?.xp_cards,0);
 await action({kind:"legacy_archive",snapshot:{profile:{level:999,cumulative_exp:999999,quest_history:[]}}});assert.notEqual((await repo.profile(user.id))?.level,999,"Untrusted imported scores are archived, never authoritative");
 assert.equal(await value<number>("SELECT count(*)::int AS value FROM public.journey_legacy_snapshots WHERE user_id=$1",[user.id]),2);
 // Existing-user safety: prestige preserves history and cumulative progress.
 await db.query("UPDATE public.profiles SET level=100 WHERE user_id=$1",[user.id]);
 const before=await repo.profile(user.id),requestId=crypto.randomUUID();await action({kind:"prestige",requestId});await action({kind:"prestige",requestId});
 const after=await repo.profile(user.id);assert.equal(after?.prestige,1);assert.equal(after?.level,1);assert.deepEqual(after?.quest_history,before?.quest_history);assert.equal(after?.cumulative_exp,before?.cumulative_exp);
 await db.exec("RESET ROLE;");await db.query("UPDATE auth.users SET raw_user_meta_data=$2 WHERE id=$1",[user.id,JSON.stringify({zynth_leaderboard:{version:1,choice:"global",location:null}})]);await db.exec("SET ROLE service_role;");
 // A one-person list is top 100%, not top 5%. Seed an actual category cohort.
 await db.exec("RESET ROLE;");
 for(let i=0;i<20;i++){
  const id=`20000000-0000-4000-8000-${String(i+1).padStart(12,"0")}`;
  await db.query("INSERT INTO auth.users(id,raw_user_meta_data) VALUES($1,$2)",[id,JSON.stringify({zynth_leaderboard:{version:1,choice:"global",location:null}})]);
  await db.query("INSERT INTO public.profiles SELECT (jsonb_populate_record(NULL::public.profiles,$1::jsonb||jsonb_build_object('id',gen_random_uuid(),'user_id',$2::text,'cumulative_exp',1))).*",[JSON.stringify(after),id]);
 }
 await db.exec("SET ROLE service_role;");assert.deepEqual(await repo.rank(user.id),{rank:1,total:21});
 const professionRequest=crypto.randomUUID();await action({kind:"profession",requestId:professionRequest});await action({kind:"profession",requestId:professionRequest});
 assert.match((await repo.profile(user.id))!.profession,/^Principal /);assert.equal(await value<number>("SELECT count(*)::int AS value FROM public.profession_evolutions WHERE user_id=$1",[user.id]),1);
 await db.query("UPDATE public.quests SET created_at=now()-interval '3 minutes' WHERE id=$1",[recovered.quest!.id]);
 const beforeRejected=await repo.profile(user.id);
 await assert.rejects(()=>completeStoredQuest(user.id,{questId:recovered.quest!.id,responseText:response},completion,async args=>mockGradeResponse(args)),/fresh angle/);
 assert.equal((await repo.profile(user.id))?.exploit_flags.length,beforeRejected!.exploit_flags.length+1);assert.equal((await repo.profile(user.id))?.cumulative_exp,beforeRejected?.cumulative_exp);
 // Legacy credits keep old missions playable but never become verified credit.
 await db.query("UPDATE public.quests SET status='skipped' WHERE user_id=$1 AND status='active'",[user.id]);
 const missionProfile=await repo.profile(user.id);const legacyHistory=Array.from({length:7},(_,i)=>({quest_id:`30000000-0000-4000-8000-${String(i+1).padStart(12,"0")}`,quest_title:"Preserved old quest",quest_type:"daily",grade:"Good",exp_earned:5,skills_targeted:[],completed_at:new Date(Date.now()-86400000+i*1000).toISOString()}));
 await db.query("UPDATE public.profiles SET quest_history=$2 WHERE user_id=$1",[user.id,JSON.stringify([...legacyHistory,...missionProfile!.quest_history])]);
 const verifiedBefore=await repo.verifiedCredits(user.id);const mission=await action({kind:"generate"});assert.equal(mission.quest?.type,"mission");
 await db.query("UPDATE public.quests SET created_at=now()-interval '3 minutes' WHERE id=$1",[mission.quest!.id]);
 const missionReply=mission.quest!.steps.map((step,i)=>`[Step ${i+1}: ${step.title}]\nFor part ${i+1}, I would compare the requirements, explain my reasoning, draft an example and evaluate a different alternative against the success criteria before refining the result.`).join("\n\n");
 await assert.rejects(()=>completeStoredQuest(user.id,{questId:mission.quest!.id,responseText:missionReply},completion,async()=>{throw Error("Live grader unavailable");}),/Live grader unavailable/);
 assert.equal((await repo.quest(user.id,mission.quest!.id))?.status,"active");
 await completeStoredQuest(user.id,{questId:mission.quest!.id,responseText:missionReply},completion,async args=>mockGradeResponse(args));
 assert.equal(await value<string>("SELECT provenance AS value FROM public.quest_outcomes WHERE quest_id=$1",[mission.quest!.id]),"legacy");assert.equal(await repo.verifiedCredits(user.id),verifiedBefore,"Grandfathered mission eligibility is not verified reward evidence");
 await db.exec(`RESET ROLE; SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${user.id}',false);`);
 await assert.rejects(()=>db.query("UPDATE public.profiles SET cumulative_exp=999 WHERE user_id=$1",[user.id]),/permission denied/);
 await assert.rejects(()=>db.query("INSERT INTO public.profiles(user_id) VALUES($1)",[fixtureOwners[1]]),/permission denied/);
 await assert.rejects(()=>db.query("UPDATE public.quests SET status='completed' WHERE user_id=$1",[user.id]),/permission denied/);
 await assert.rejects(()=>db.query("SELECT public.claim_journey_action($1,'forged','skip','{}','{}',$2)",[user.id,crypto.randomUUID()]),/permission denied/);
 await db.query("UPDATE public.profiles SET display_name='Edited safely' WHERE user_id=$1",[user.id]);
 await db.query("UPDATE public.quests SET draft_data='{}' WHERE user_id=$1",[user.id]);
 await db.exec(`SELECT set_config('request.jwt.claim.sub','${fixtureOwners[1]}',false);`);
 assert.equal((await db.query("SELECT * FROM public.profiles")).rows.length,0);assert.equal((await db.query("SELECT * FROM public.quest_outcomes")).rows.length,0);assert.equal((await db.query("SELECT * FROM public.journey_legacy_snapshots")).rows.length,0);
 await db.exec("RESET ROLE; SET ROLE service_role;");
 assert.equal(await value<boolean>("SELECT public.consume_journey_budget($1,'fixture',1) AS value",[user.id]),true);assert.equal(await value<boolean>("SELECT public.consume_journey_budget($1,'fixture',1) AS value",[user.id]),false);
 const resetId=crypto.randomUUID();await db.query("SELECT public.reset_journey($1,$2)",[user.id,resetId]);assert.equal(await repo.profile(user.id),null);
 await action({kind:"onboard",answers});const fresh=await repo.profile(user.id);
 await db.query("SELECT public.reset_journey($1,$2)",[user.id,resetId]);assert.equal((await repo.profile(user.id))?.created_at,fresh?.created_at,"Retrying an old reset cannot erase a newly started journey");
 console.log("Trusted journey checks passed: authoritative onboarding, stored generation, daily inputs, completion replay/recovery, token debit, prestige, conservative legacy archive, budgets and column/RLS isolation.");
}
async function main(){const db=new PGlite();try{await setupJourneyDatabase(db);await runJourneyChecks(db);}finally{await db.close();}}
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1;});
