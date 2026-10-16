// Disposable loopback Auth/PostgREST adapter backed by actual PostgreSQL.
// It accepts only synthetic fixture tokens and an intentionally fake service key.
const http=require('node:http');
const {Client,Pool}=require('pg');
const {setupJourneyDatabase,sqlRepositories,fixtureOwners}=require('../../.test-build/journey.integration.test');
const {runJourneyAction}=require('../../.test-build/src/lib/server/journey-actions');
const {mockClassifyOnboarding,mockGenerateQuest,mockDailyQuestion}=require('../../.test-build/src/lib/llm/mock');
const serviceKey='local_service_only_fixture';
const rpcNames=new Set(['claim_journey_action','release_journey_action','commit_journey_action','claim_quest_submission','release_quest_submission','commit_quest_result','consume_journey_budget','pending_journey_outcome','ack_journey_outcome','reset_journey','trusted_profession_rank','verified_mission_credits','record_journey_rejection']);
const tables=new Set(['profiles','quests','journey_actions','journey_configuration','quest_outcomes','onboarding_drafts','user_preferences','journey_legacy_snapshots']);
const ident=value=>{if(!/^[a-z_][a-z_0-9]*$/.test(value))throw Error('Invalid fixture identifier');return '"'+value+'"';};
async function createTrustedFixture(){
 const url=new URL(process.env.ZYNTH_TEST_DATABASE_URL||'postgresql://zynth_local@127.0.0.1:55439/postgres');
 if(!['127.0.0.1','localhost','[::1]'].includes(url.hostname))throw Error('Loopback database required');
 const admin=new Client({connectionString:url.href});await admin.connect();const database='zynth_test_browser_'+Date.now();
 await admin.query(`CREATE DATABASE ${database}`);url.pathname='/'+database;
 const pool=new Pool({connectionString:url.href,max:6});const setup=await pool.connect();
 try{
  await setupJourneyDatabase({exec:sql=>setup.query(sql),query:(...args)=>setup.query(...args)});
  await setup.query('SET ROLE service_role');
  await runJourneyAction({id:fixtureOwners[0],name:'Mira Cole',email:'preview@zynth.local'},{kind:'onboard',answers:{Q1:['Designer'],Q2:['A'],Q3:['B'],Q4:['C'],Q5:['D']}},sqlRepositories({exec:sql=>setup.query(sql),query:(...args)=>setup.query(...args)}).repo,{classify:async a=>mockClassifyOnboarding(a),generate:async(p,t,d)=>mockGenerateQuest(p,t,d),question:async p=>mockDailyQuestion(p)});
 }finally{await setup.query('RESET ROLE');setup.release();}
 const accounts=fixtureOwners.map((id,i)=>({id,email:i?'new@zynth.local':'preview@zynth.local',aud:'authenticated',role:'authenticated',user_metadata:{full_name:i?'New Explorer':'Mira Cole'},created_at:new Date().toISOString()}));
 const expires=Math.floor(Date.now()/1000)+3600;
 const jwt=account=>[Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'),Buffer.from(JSON.stringify({sub:account.id,exp:expires,role:'authenticated'})).toString('base64url'),'local-test-only'].join('.');
 let failCompletionReply=false;
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','http://localhost:3002');res.setHeader('Access-Control-Allow-Headers','*');res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE,OPTIONS');
  const send=(data,status=200)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));};
  if(req.method==='OPTIONS'){res.statusCode=204;return res.end();}
  let client;
  try{
   const request=new URL(req.url,'http://127.0.0.1:54339');let raw='';for await(const part of req)raw+=part;const body=raw?JSON.parse(raw):{};
   const bearer=req.headers.authorization?.replace(/^Bearer /,'');const account=accounts.find(a=>jwt(a)===bearer);
   if(request.pathname==='/auth/v1/token'){
    const user=accounts.find(a=>a.email===body.email);if(!user||body.password!=='fixture-password')return send({message:'Invalid credentials'},400);
    return send({access_token:jwt(user),refresh_token:'fixture-refresh',expires_in:3600,token_type:'bearer',user});
   }
   if(request.pathname==='/auth/v1/user'){if(!account){console.error('Fixture auth rejected user lookup:',bearer===serviceKey?'service':bearer?'unknown synthetic token':'missing token');return send({message:'Sign in required'},401);}if(req.method==='PUT')account.user_metadata={...account.user_metadata,...body.data};return send(account);}
   if(request.pathname==='/auth/v1/logout')return send({});
   const service=bearer===serviceKey;if(!service&&!account)return send({message:'Sign in required'},401);
   client=await pool.connect();await client.query('BEGIN');await client.query(`SET LOCAL ROLE ${service?'service_role':'authenticated'}`);
   if(account)await client.query("SELECT set_config('request.jwt.claim.sub',$1,true)",[account.id]);
   const rpc=request.pathname.startsWith('/rest/v1/rpc/');const name=request.pathname.split('/').at(-1);let result;
   if(rpc){
    if(!rpcNames.has(name))throw Error('Unexpected fixture RPC '+name);
    const entries=Object.entries(body);const params=entries.map(([,v])=>v!==null&&typeof v==='object'?JSON.stringify(v):v);
    const sql=`SELECT public.${ident(name)}(${entries.map(([k],i)=>ident(k)+'=>$'+(i+1)).join(',')}) AS value`;
    result=(await client.query(sql,params)).rows[0].value;
   }else{
    if(!tables.has(name))throw Error('Unexpected fixture table '+name);
    const fields=request.searchParams.get('select')??'*',selection=fields==='*'?'*':fields.split(',').map(ident).join(',');
    const params=[],filters=[];
    for(const [key,value] of request.searchParams){if(['select','order','limit','offset','on_conflict'].includes(key))continue;if(!value.startsWith('eq.'))throw Error('Unexpected fixture filter');params.push(value.slice(3));filters.push(ident(key)+'=$'+params.length);}
    const where=filters.length?' WHERE '+filters.join(' AND '):'';let sql;
    if(req.method==='GET'){
     sql=`SELECT ${selection} FROM public.${ident(name)}${where}`;
     const order=request.searchParams.get('order');if(order)sql+=' ORDER BY '+order.split(',').map(term=>{const [key,dir]=term.split('.');return ident(key)+(dir==='desc'?' DESC':' ASC');}).join(',');
     if(request.searchParams.has('limit')){params.push(Number(request.searchParams.get('limit')));sql+=' LIMIT $'+params.length;}
    }else if(req.method==='PATCH'){
     const changes=Object.entries(body).map(([key,v])=>{params.push(v!==null&&typeof v==='object'?JSON.stringify(v):v);return ident(key)+'=$'+params.length;});
     sql=`UPDATE public.${ident(name)} SET ${changes.join(',')}${where} RETURNING ${selection}`;
    }else if(req.method==='POST'){
     params.length=0;const entries=Object.entries(body),cols=entries.map(([key])=>ident(key));for(const [,v] of entries)params.push(v!==null&&typeof v==='object'?JSON.stringify(v):v);
     const conflict=request.searchParams.get('on_conflict');sql=`INSERT INTO public.${ident(name)}(${cols.join(',')}) VALUES(${params.map((_,i)=>'$'+(i+1)).join(',')})`;
     if(conflict)sql+=` ON CONFLICT(${ident(conflict)}) DO UPDATE SET `+cols.filter(c=>c!==ident(conflict)).map(c=>c+'=excluded.'+c).join(',');
     sql+=' RETURNING '+selection;
    }else if(req.method==='DELETE')sql=`DELETE FROM public.${ident(name)}${where} RETURNING ${selection}`;
    else throw Error('Unexpected fixture method');
    result=(await client.query(sql,params)).rows;
    if(req.headers.accept?.includes('vnd.pgrst.object+json')){if(result.length!==1){await client.query('COMMIT');return send({message:'Expected one row',code:'PGRST116',details:'The result contains 0 rows'},406);}result=result[0];}
   }
   await client.query('COMMIT');
   if(name==='commit_quest_result'&&failCompletionReply){failCompletionReply=false;return send({message:'Simulated lost committed reply'},503);}
   return send(result);
  }catch(error){if(client)await client.query('ROLLBACK');return send({message:error.message,code:error.code??'FIXTURE'},error.code==='42501'?403:500);}
  finally{client?.release();}
 });
 return {server,owner:fixtureOwners[0],accounts,pool,loseCompletionReply:()=>{failCompletionReply=true;},close:async()=>{await new Promise(resolve=>server.close(resolve));await pool.end();await admin.query(`DROP DATABASE ${database}`);await admin.end();}};
}
module.exports={createTrustedFixture,serviceKey};
