import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PGlite} from "@electric-sql/pglite";
import {LeaderboardResultSchema} from "./src/lib/leaderboard-result";
async function main(){
 const db=new PGlite();
 try{
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
  CREATE TABLE auth.users(id uuid PRIMARY KEY);
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
  GRANT USAGE ON SCHEMA public,auth TO anon,authenticated; GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated;`);
  await db.exec(readFileSync("supabase/schema.sql","utf8"));
  await db.exec(readFileSync("supabase/migrations/20261016030828_live_leaderboard.sql","utf8"));
  await db.exec("GRANT SELECT,UPDATE ON public.profiles TO authenticated;");
  const owner="00000000-0000-4000-8000-000000000099";
  const ids=Array.from({length:60},(_,i)=>`00000000-0000-4000-8000-${String(i+1).padStart(12,"0")}`);
  for(let i=0;i<ids.length;i++){
   await db.query("INSERT INTO auth.users(id) VALUES($1)",[ids[i]]);
   await db.query("INSERT INTO public.profiles(user_id,display_name,profession,domain,cumulative_exp,level,streak,created_at,learning_style,behavior_signature,stats,onboarding_stats) VALUES($1,$2,'Designer',$3,$4,2,3,'2026-01-01','Practical Learner','test','{}','{}')",[ids[i],`Explorer Private Surname${i}`,i%2===0?"CREATIVE":"TECHNICAL",1000-i]);
  }
  await db.query("INSERT INTO auth.users(id) VALUES($1)",[owner]);
  await db.query("INSERT INTO public.profiles(user_id,display_name,profession,domain,cumulative_exp,level,created_at,learning_style,behavior_signature,stats,onboarding_stats) VALUES($1,'Mira Hidden Cole','Designer','CREATIVE',10,1,'2026-01-01','Practical Learner','test','{}','{}')",[owner]);
  const query=async(category="all",offset=0,limit=25)=>(await db.query<{result:unknown}>("SELECT public.get_live_leaderboard($1,$2,$3) AS result",[category,offset,limit])).rows[0].result;
  await db.exec("SET ROLE anon;");await assert.rejects(()=>query(),/permission denied/);
  await db.exec("RESET ROLE; SET ROLE authenticated;");await assert.rejects(()=>query(),/Sign in required/);
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[owner]);
  const first=LeaderboardResultSchema.parse(await query());
  assert.equal(first.total,61);assert.equal(first.rows.length,25);assert.equal(first.userRank,61);
  assert.equal(first.userRow?.display_name,"Mira C.");assert.equal(first.userRow?.score,10);
  assert.equal(first.rows[0].display_name,"Explorer S.");assert.equal(first.rows[0].rank,1);
  assert.ok(!JSON.stringify(first).includes(owner));assert.ok(!JSON.stringify(first).includes("Hidden"));assert.ok(!JSON.stringify(first).includes("Private"));
  assert.deepEqual(Object.keys(first.rows[0]).sort(),["display_name","domain","is_user","level","rank","score","streak"].sort());
  const last=LeaderboardResultSchema.parse(await query("all",50));assert.equal(last.rows.length,11);assert.equal(last.rows.at(-1)?.is_user,true);assert.equal(last.userRank,61);
  const domain=LeaderboardResultSchema.parse(await query("CREATIVE"));assert.equal(domain.total,31);assert.equal(domain.userRank,31);assert.ok(domain.rows.every(row=>row.domain==="CREATIVE"));
  const other=LeaderboardResultSchema.parse(await query("TECHNICAL"));assert.equal(other.userRank,0);assert.equal(other.participation,"other_category");assert.equal(other.userRow,null);
  assert.equal((await db.query("SELECT * FROM public.profiles")).rows.length,1,"Ranking projection must not expose other private profiles through RLS");
  await db.query("UPDATE public.profiles SET leaderboard_opt_out=true WHERE user_id=$1",[owner]);
  const opted=LeaderboardResultSchema.parse(await query());assert.equal(opted.total,60);assert.equal(opted.userRank,0);assert.equal(opted.participation,"opted_out");assert.equal(opted.userRow,null);
  await db.query("UPDATE public.profiles SET leaderboard_opt_out=false,cumulative_exp=1000 WHERE user_id=$1",[owner]);
  const tied=LeaderboardResultSchema.parse(await query());assert.equal(tied.userRank,2,"Equal scores use stable creation/account ordering");
  await db.query("UPDATE public.profiles SET cumulative_exp=1100 WHERE user_id=$1",[owner]);assert.equal(LeaderboardResultSchema.parse(await query()).userRank,1,"Saved progress must update ranking without a cron/cache job");
  await db.query("UPDATE public.profiles SET cumulative_exp=0 WHERE user_id=$1",[owner]);assert.equal(LeaderboardResultSchema.parse(await query()).participation,"no_progress");
  assert.equal(LeaderboardResultSchema.parse(await query("SOCIAL")).rows.length,0);
  await assert.rejects(()=>query("invalid"),/Invalid leaderboard/);await assert.rejects(()=>query("all",-1),/Invalid leaderboard/);await assert.rejects(()=>query("all",0,51),/Invalid leaderboard/);
  console.log("Leaderboard Postgres checks passed: real rankings/counts, category filters, paging, own rank outside page, ties, immediate progress/opt-out, anonymized output, private-profile RLS, authentication and bounded inputs.");
 }finally{await db.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
