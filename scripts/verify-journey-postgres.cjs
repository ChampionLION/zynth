// Runs ONLY against a disposable loopback PostgreSQL cluster, never Supabase.
const assert=require('node:assert/strict');
const {Client}=require('pg');
const {setupJourneyDatabase,runJourneyChecks,sqlRepositories,fixtureOwners}=require('../.test-build/journey.integration.test');
const {runJourneyAction}=require('../.test-build/src/lib/server/journey-actions');
const {completeStoredQuest}=require('../.test-build/src/lib/server/complete-quest');
const {mockClassifyOnboarding,mockGenerateQuest,mockDailyQuestion,mockGradeResponse}=require('../.test-build/src/lib/llm/mock');
(async()=>{
 const target=new URL(process.env.ZYNTH_TEST_DATABASE_URL||'postgresql://zynth_local@127.0.0.1:55439/postgres');
 assert.ok(['127.0.0.1','localhost','[::1]'].includes(target.hostname),'A disposable loopback database is required');
 const admin=new Client({connectionString:target.href});await admin.connect();
 const database='zynth_test_'+Date.now();assert.match(database,/^zynth_test_\d+$/);
 const connections=[];
 try{
  await admin.query(`CREATE DATABASE ${database}`);target.pathname='/'+database;
  const connect=async()=>{const c=new Client({connectionString:target.href});await c.connect();connections.push(c);return c;};
  const main=await connect(),db={exec:sql=>main.query(sql),query:(...args)=>main.query(...args)};
  await setupJourneyDatabase(db);await runJourneyChecks(db);
  const a=await connect(),b=await connect();for(const c of [a,b])await c.query('SET ROLE service_role');
  const repoA=sqlRepositories({exec:sql=>a.query(sql),query:(...args)=>a.query(...args)}),repoB=sqlRepositories({exec:sql=>b.query(sql),query:(...args)=>b.query(...args)});
  const user={id:fixtureOwners[1],name:'Concurrent fixture',email:'race@local.test'};
  let generationCalls=0,gradingCalls=0;
  const models={classify:async answers=>mockClassifyOnboarding(answers),generate:async(p,t,d)=>{generationCalls++;await new Promise(resolve=>setTimeout(resolve,80));return mockGenerateQuest(p,t,d);},question:async p=>mockDailyQuestion(p)};
  await runJourneyAction(user,{kind:'onboard',answers:{Q1:['Designer'],Q2:['A'],Q3:['B'],Q4:['C'],Q5:['D']}},repoA.repo,models);
  const generated=await Promise.allSettled([runJourneyAction(user,{kind:'generate'},repoA.repo,models),runJourneyAction(user,{kind:'generate'},repoB.repo,models)]);
  assert.equal(generationCalls,1,'Independent connections reuse one generation lease');assert.equal(generated.filter(r=>r.status==='fulfilled').length,1);
  const quest=(await repoA.repo.activeQuest(user.id));assert.ok(quest);
  await main.query("UPDATE public.quests SET created_at=now()-interval '3 minutes' WHERE id=$1",[quest.id]);
  const input={questId:quest.id,responseText:'I would draft a clear structure, compare two layouts and their tradeoffs, test which heading works with another reader, and refine the final choice using that feedback.'};
  const grader=async args=>{gradingCalls++;await new Promise(resolve=>setTimeout(resolve,80));return mockGradeResponse(args);};
  const completed=await Promise.allSettled([completeStoredQuest(user.id,input,repoA.completion,grader),completeStoredQuest(user.id,input,repoB.completion,grader)]);
  assert.equal(gradingCalls,1,'Only one connection grades an outstanding submission');assert.equal(completed.filter(r=>r.status==='fulfilled').length,1);
  const replay=await completeStoredQuest(user.id,input,repoB.completion,grader);assert.equal(replay.replayed,true);assert.equal(gradingCalls,1);
  assert.equal(Number((await main.query('SELECT count(*) FROM public.quest_outcomes WHERE user_id=$1',[user.id])).rows[0].count),1);
  await main.query('UPDATE public.profiles SET last_quest_date=NULL WHERE user_id=$1',[user.id]);
  const next=await runJourneyAction(user,{kind:'generate'},repoA.repo,models),tokens=next.profile.tokens;
  const skipped=await Promise.allSettled([runJourneyAction(user,{kind:'skip',questId:next.quest.id},repoA.repo,models),runJourneyAction(user,{kind:'skip',questId:next.quest.id},repoB.repo,models)]);
  assert.ok(skipped.some(r=>r.status==='fulfilled'));await runJourneyAction(user,{kind:'skip',questId:next.quest.id},repoB.repo,models);
  assert.equal((await repoA.repo.profile(user.id)).tokens,tokens-1,'Concurrent skips debit one token');
  // Different valid actions can both read a revision, but only one CAS commits;
  // the service retries the other from current state without dropping settings.
  const persisted=await repoA.repo.profile(user.id);
  const lease=crypto.randomUUID();await repoA.repo.claim(user.id,'conflict','energy',{kind:'energy'}, {},lease);
  await main.query('UPDATE public.profiles SET display_name=$2 WHERE user_id=$1',[user.id,'Concurrent name']);
  await assert.rejects(()=>repoA.repo.commit(user.id,'conflict',lease,persisted.progression_revision,persisted,null,{}));
  assert.equal((await repoA.repo.profile(user.id)).display_name,'Concurrent name');
  console.log('Separate-connection PostgreSQL checks passed: shared generation/submission leases, single outcome/reward, concurrent skip debit, CAS and preserved settings.');
 }finally{
  await Promise.all(connections.map(c=>c.end()));
  await admin.query(`DROP DATABASE IF EXISTS ${database}`);await admin.end();
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
