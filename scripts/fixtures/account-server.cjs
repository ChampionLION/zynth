// Disposable local account fixture. Never connects to hosted Supabase.
const http = require('node:http');
const {buildProfile} = require('../../.test-build/src/lib/engines/onboarding');
const {mockClassifyOnboarding, mockGenerateQuest} = require('../../.test-build/src/lib/llm/mock');

function createAccountFixture() {
  const owner = '00000000-0000-4000-8000-000000000003', now = new Date().toISOString();
  const account = {id:owner,email:'preview@zynth.local',aud:'authenticated',role:'authenticated',user_metadata:{full_name:'Mira Cole'},created_at:now};
  const jwt = [Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'),Buffer.from(JSON.stringify({sub:owner,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})).toString('base64url'),'local-test-only'].join('.');
  const profile = buildProfile(owner,'Mira Cole',mockClassifyOnboarding({Q1:['Designer'],Q2:['A'],Q3:['B'],Q4:['C'],Q5:['D']}));
  profile.energy_date=now.slice(0,10);profile.energy_today='mid';
  const quest = {...mockGenerateQuest(profile,'mission',2),id:'00000000-0000-4000-8000-000000000004',created_at:now,date:now.slice(0,10),status:'active'};
  const state = {failPreferences:false,failProfile:false,failLeaderboard:false,tables:{profiles:[profile],quests:[{id:quest.id,user_id:owner,quest_data:quest,status:'active',created_at:now,draft_data:{response:'',step_responses:[],current_step:0,elapsed_seconds:120,updated_at:now}}],onboarding_drafts:[],user_preferences:[],leaderboard_cache:[]}};
  const server = http.createServer(async (req,res) => {
    res.setHeader('Access-Control-Allow-Origin','http://localhost:3002');
    res.setHeader('Access-Control-Allow-Headers','*');res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE,OPTIONS');
    const send=(value,status=200)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));};
    if(req.method==='OPTIONS'){res.statusCode=204;return res.end();}
    try {
      const url=new URL(req.url,'http://127.0.0.1:54339');let raw='';for await(const chunk of req)raw+=chunk;const body=raw?JSON.parse(raw):null;
      if(url.pathname==='/auth/v1/token')return send({access_token:jwt,refresh_token:'local-test-only',expires_in:3600,token_type:'bearer',user:account});
      if(url.pathname==='/auth/v1/user'){
        if(req.headers.authorization!==`Bearer ${jwt}`)return send({message:'Local sign-in required'},401);
        if(req.method==='PUT')account.user_metadata={...account.user_metadata,...body.data};
        return send(account);
      }
      if(url.pathname==='/auth/v1/logout')return send({});
      if(req.headers.authorization!==`Bearer ${jwt}`)return send({message:'Local sign-in required'},401);
      if(url.pathname==='/rest/v1/rpc/get_live_leaderboard'||url.pathname==='/rest/v1/rpc/get_leaderboard'){
        if(state.failLeaderboard)return send({message:'Simulated board failure'},503);
        const current=state.tables.profiles.find(p=>p.user_id===owner);
        const norm=value=>(value??'').trim().toLowerCase().replace(/\s+/g,' '),member=p=>p.user_id===owner?account.user_metadata.zynth_leaderboard:p.fixture_membership;
        const participants=state.tables.profiles.filter(p=>!p.leaderboard_opt_out&&p.fixture_verified!==false);
        const area=p=>Object.fromEntries(['country','state','city'].map(key=>[key,norm(member(p)?.location?.[key])]));
        const regions=Array.from(new Map(participants.filter(p=>member(p)?.choice==='regional'&&Object.values(area(p)).every(Boolean)).map(p=>[JSON.stringify(area(p)),area(p)])).values());
        const mine=member(current);const selected=body.p_country||body.p_state||body.p_city?{country:norm(body.p_country),state:norm(body.p_state),city:norm(body.p_city)}:mine?.choice==='regional'?area(current):regions[0]??{country:'',state:'',city:''};
        const scope=body.p_scope??'global';
        const ranked=participants.filter(p=>(body.p_category==='all'||p.domain===body.p_category)&&(scope==='global'||member(p)?.choice==='regional'&&area(p).country===selected.country&&(scope==='national'||area(p).state===selected.state)&&(scope!=='local'||area(p).city===selected.city))).sort((a,b)=>b.cumulative_exp-a.cumulative_exp||a.user_id.localeCompare(b.user_id)).map((p,i)=>{const parts=p.display_name.trim().split(/\s+/);return {rank:i+1,display_name:parts[0]+(parts.length>1?' '+parts.at(-1)[0]+'.':''),domain:p.domain,level:p.level,streak:p.streak,score:p.cumulative_exp,is_user:p.user_id===owner};});
        const userRow=ranked.find(p=>p.is_user)??null;
        return send({rows:ranked.slice(body.p_offset,body.p_offset+body.p_limit),total:ranked.length,userRank:userRow?.rank??0,userRow,participation:current.leaderboard_opt_out?'opted_out':scope!=='global'&&mine?.choice!=='regional'?'global_only':body.p_category!=='all'&&body.p_category!==current.domain?'other_category':userRow?'ranked':'outside_region',updatedAt:new Date().toISOString(),region:selected,regions});
      }
      const table=url.pathname.split('/').at(-1);if(!state.tables[table])return send({message:'Unknown fixture table'},404);
      const matches=row=>(table==='leaderboard_cache'||row.user_id===owner)&&[...url.searchParams].every(([k,v])=>['select','order','limit','offset','on_conflict'].includes(k)||v.startsWith('eq.')&&String(row[k])===v.slice(3)||v.startsWith('neq.')&&String(row[k])!==v.slice(4));
      const project=row=>{const fields=url.searchParams.get('select');return !fields||fields==='*'?row:Object.fromEntries(fields.split(',').map(k=>[k,row[k]]));};
      const representation=rows=>req.headers.accept?.includes('vnd.pgrst.object+json')?rows.length===1?send(project(rows[0])):send({message:'Expected one row'},406):send(rows.map(project));
      if(req.method==='GET'){const matched=state.tables[table].filter(matches);if(req.headers.prefer?.includes('count=exact'))res.setHeader('Content-Range',matched.length?`0-${matched.length-1}/${matched.length}`:'*/0');return representation(matched.slice(Number(url.searchParams.get('offset')??0),Number(url.searchParams.get('offset')??0)+Number(url.searchParams.get('limit')??10000)));}
      if(table==='user_preferences'&&state.failPreferences||table==='profiles'&&state.failProfile)return send({message:'Simulated save failure'},503);
      if(req.method==='PATCH'){const changed=state.tables[table].filter(matches).map(row=>({...row,...body}));state.tables[table]=state.tables[table].map(row=>matches(row)?{...row,...body}:row);return representation(changed);}
      if(req.method==='POST'){
        if(body.user_id!==owner)return send({message:'Wrong fixture account'},403);
        const key=table==='quests'?'id':'user_id',index=state.tables[table].findIndex(row=>row[key]===body[key]);
        if(index<0)state.tables[table].push(body);else if(!req.headers.prefer?.includes('ignore-duplicates'))state.tables[table][index]={...state.tables[table][index],...body};
        return representation(index<0||!req.headers.prefer?.includes('ignore-duplicates')?[body]:[]);
      }
      return send({message:'Method not used in preview'},405);
    } catch {send({message:'Invalid fixture request'},400);}
  });
  return {server,state,owner,quest,account};
}
module.exports={createAccountFixture};
