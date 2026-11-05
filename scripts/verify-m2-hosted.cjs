// Focused M2-D only. Requires an explicitly authorized, confirmed disposable
// account marked user_metadata.zynth_test = 'm2'. Never use a real user account.
// Credentials stay in ignored .review/m2-account.json; no secrets are logged.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {createClient}=require('@supabase/supabase-js');
const env=Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\r?\n/).filter(l=>l&&!l.startsWith('#')).map(l=>{const n=l.indexOf('=');return[l.slice(0,n),l.slice(n+1).replace(/^"|"$/g,'')];}));
const url=env.NEXT_PUBLIC_SUPABASE_URL,key=env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
assert.equal(new URL(url).host,'khvzjbhmozvpwidaxbah.supabase.co');
const credentials=JSON.parse(fs.readFileSync('.review/m2-account.json','utf8'));
assert.match(credentials.email,/^codex-m2-/);
let failPreferences=false;
const client=()=>createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(input,init)=>{if(failPreferences&&String(input).includes('/rest/v1/user_preferences')&&init?.method==='POST')return Promise.resolve(Response.json({message:'Local test of interrupted preference save'},{status:503}));return fetch(input,init);}}});
const checked=async query=>{const result=await query;if(result.error)throw result.error;return result.data;};
const login=async c=>{const data=await checked(c.auth.signInWithPassword(credentials));assert.equal(data.user.email,credentials.email);if(data.user.user_metadata.zynth_test!=='m2')await checked(c.auth.updateUser({data:{zynth_test:'m2'}}));return data.user.id;};
const progress=p=>Object.fromEntries(Object.entries(p).filter(([name])=>!['display_name','character_name','updated_at','progression_revision'].includes(name)));
(async()=>{
 const first=client(),owner=await login(first);
 let before=await checked(first.from('profiles').select('*').eq('user_id',owner).maybeSingle());
 assert.ok(before,'Initialize the authorized test profile with leaderboard_opt_out=true before running this check');
 assert.equal(before.leaderboard_opt_out,true,'The test account must stay hidden from rankings');
 assert.equal(before.cumulative_exp,0,'Only an unused test profile may be changed');
 const previous=await checked(first.from('user_preferences').select('theme,motion').eq('user_id',owner).maybeSingle());
 try{
  await checked(first.from('profiles').update({display_name:'M2 Session Check',character_name:'M2 Wayfarer'}).eq('user_id',owner));
  await checked(first.from('user_preferences').upsert({user_id:owner,theme:'light',motion:'system',updated_at:new Date().toISOString()},{onConflict:'user_id'}));
  failPreferences=true;const failed=await first.from('user_preferences').upsert({user_id:owner,theme:'dark',motion:'reduced'},{onConflict:'user_id'});assert.ok(failed.error);failPreferences=false;
  assert.equal((await checked(first.from('user_preferences').select('theme').eq('user_id',owner).single())).theme,'light');
  await checked(first.from('user_preferences').upsert({user_id:owner,theme:'dark',motion:'reduced',updated_at:new Date().toISOString()},{onConflict:'user_id'}));
  await checked(first.auth.signOut({scope:'local'}));
  const second=client();assert.equal(await login(second),owner);
  const restored=await checked(second.from('profiles').select('*').eq('user_id',owner).single()),appearance=await checked(second.from('user_preferences').select('theme,motion').eq('user_id',owner).single());
  assert.equal(restored.display_name,'M2 Session Check');assert.equal(restored.character_name,'M2 Wayfarer');assert.deepEqual(appearance,{theme:'dark',motion:'reduced'});assert.deepEqual(progress(restored),progress(before));
  await checked(second.from('profiles').update({display_name:before.display_name,character_name:before.character_name}).eq('user_id',owner));
  if(previous)await checked(second.from('user_preferences').upsert({user_id:owner,...previous},{onConflict:'user_id'}));else await checked(second.from('user_preferences').delete().eq('user_id',owner));
  assert.deepEqual(progress(await checked(second.from('profiles').select('*').eq('user_id',owner).single())),progress(before));
  await checked(second.auth.signOut({scope:'local'}));
  fs.writeFileSync('.review/m2-hosted-evidence.json',JSON.stringify({date:new Date().toISOString(),project:'khvzjbhmozvpwidaxbah',crossSessionNames:true,crossSessionAppearance:true,failedSavePreservesCloud:true,retry:true,progressUnchanged:true,originalPreferencesRestored:true,existingUsersChanged:false},null,2));
  console.log('M2-D hosted check passed: names, themes and motion restored in a fresh signed-in session; failed save/retry verified; progress unchanged; test preferences restored.');
 }finally{failPreferences=false;await first.auth.signOut({scope:'local'});}
})().catch(error=>{console.error(error.message||'M2 hosted check did not complete.');process.exitCode=1;});
