import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {PGlite} from "@electric-sql/pglite";
import {LeaderboardResultSchema} from "./src/lib/leaderboard-result";
async function main(){const db=new PGlite();try{
 await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE SCHEMA auth;
 CREATE TABLE auth.users(id uuid PRIMARY KEY,raw_user_meta_data jsonb DEFAULT '{}',confirmed_at timestamptz DEFAULT now());
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role;`);
 await db.exec(readFileSync('supabase/schema.sql','utf8'));
 await db.exec(readFileSync('supabase/migrations/20261016111757_leaderboard_global_by_default.sql','utf8'));
 for(const suffix of ['_cosmetic_inventory.sql','_leaderboard_avatar_portraits.sql'])await db.exec(readFileSync('supabase/migrations/'+readdirSync('supabase/migrations').find(f=>f.endsWith(suffix))!,'utf8'));
 const ids=Array.from({length:4},(_,i)=>`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`);
 for(const id of ids){await db.query('INSERT INTO auth.users(id) VALUES($1)',[id]);await db.query("INSERT INTO profiles(user_id,display_name,profession,domain,learning_style,behavior_signature,stats,onboarding_stats) VALUES($1,'Mira Private Surname','Designer','CREATIVE','Practical Learner','test','{}','{}')",[id]);}
 await db.query("UPDATE profiles SET leaderboard_opt_out=true WHERE user_id=$1",[ids[2]]);await db.query('UPDATE auth.users SET confirmed_at=NULL WHERE id=$1',[ids[3]]);
 await db.query('UPDATE auth.users SET raw_user_meta_data=$1 WHERE id=$2',[JSON.stringify({email:'do-not-publish@example.invalid',zynth_avatar:{version:1,gender:'female',hair:'bob',outfit:'studio-knit',skin:'not-a-valid-skin',private_note:'secret',aura:'focus-halo'}}),ids[0]]);
 await db.query("INSERT INTO cosmetic_grants(user_id,item_id,source_kind,source_id) VALUES($1,'trail-scarf','quest',$1)",[ids[0]]);await db.query("INSERT INTO cosmetic_equipment VALUES($1,'accessory','trail-scarf')",[ids[0]]);
 const query=async(name='get_avatar_leaderboard')=>(await db.query<{value:unknown}>(`SELECT public.${name}('global') AS value`)).rows[0].value;
 await db.exec('SET ROLE anon');await assert.rejects(()=>query(),/permission denied/);await db.exec('RESET ROLE;SET ROLE authenticated');await assert.rejects(()=>query(),/Sign in required/);
 await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[ids[0]]);
 const result=LeaderboardResultSchema.parse(await query());assert.equal(result.total,2);
 assert.equal(result.userRow?.appearance?.avatar.gender,'female');assert.equal(result.userRow?.appearance?.avatar.hair,'bob');assert.equal(result.userRow?.appearance?.avatar.skin,'copper');
 assert.equal(result.userRow?.appearance?.equipment.accessory,'trail-scarf');assert.equal(result.userRow?.appearance?.equipment.aura,undefined,'Metadata cannot claim equipped rewards');
 const json=JSON.stringify(result);assert.ok(!json.includes('secret')&&!json.includes('private_note')&&!json.includes('example.invalid')&&!json.includes(ids[0]),'No private metadata or account IDs');
 const old=LeaderboardResultSchema.parse(await query('get_leaderboard'));assert.equal(old.total,result.total);assert.ok(!('appearance' in old.rows[0]),'Old cached clients retain their exact row contract');
 await db.exec('RESET ROLE');await db.query("UPDATE auth.users SET raw_user_meta_data=jsonb_set(raw_user_meta_data,'{zynth_avatar,hair}','\"long\"') WHERE id=$1",[ids[0]]);await db.exec('SET ROLE authenticated');
 assert.equal(LeaderboardResultSchema.parse(await query()).userRow?.appearance?.avatar.hair,'long','Saved appearance follows ranking reads immediately');
 console.log('Avatar leaderboard passed: current appearance/equipment, sanitized choices, no private metadata/IDs, opt-out/verification filtering, authenticated access and old-client compatibility.');
}finally{await db.close();}}
void main().catch(error=>{console.error(error);process.exitCode=1;});
