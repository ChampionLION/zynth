// Independent connections to a disposable loopback database only.
const assert=require('node:assert/strict'),{Client}=require('pg');
const {checkInventory}=require('../.test-build/inventory.integration.test');
(async()=>{
 const url=new URL(process.env.ZYNTH_TEST_DATABASE_URL||'postgresql://zynth_local@127.0.0.1:55439/postgres');
 assert.ok(['127.0.0.1','localhost'].includes(url.hostname));const admin=new Client({connectionString:url.href});await admin.connect();
 const name='zynth_inventory_'+Date.now(),connections=[];
 try{
  await admin.query(`CREATE DATABASE ${name}`);url.pathname='/'+name;
  const connect=async()=>{const c=new Client({connectionString:url.href});await c.connect();connections.push(c);return c;};
  const main=await connect();await checkInventory({exec:sql=>main.query(sql),query:(...args)=>main.query(...args)});
  const owner='00000000-0000-4000-8000-000000000003';await main.query('INSERT INTO auth.users(id) VALUES($1)',[owner]);await main.query('INSERT INTO profiles(user_id) VALUES($1)',[owner]);
  const a=await connect(),b=await connect();for(const c of [a,b])await c.query('SET ROLE service_role');
  // Hold the first grant transaction open while the second connection races it.
  await a.query('BEGIN');await a.query('SELECT sync_cosmetic_inventory($1)',[owner]);
  const pid=(await b.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
  const second=b.query('SELECT sync_cosmetic_inventory($1)',[owner]);let blocked=false;
  for(let i=0;i<30;i++){blocked=(await main.query("SELECT wait_event='advisory' AS blocked FROM pg_stat_activity WHERE pid=$1",[pid])).rows[0]?.blocked===true;if(blocked)break;await new Promise(resolve=>setTimeout(resolve,10));}
  assert.equal(blocked,true,'The second independent connection waits on the owner grant lock');
  await a.query('COMMIT');await second;
  assert.equal(Number((await main.query('SELECT count(*) FROM cosmetic_grants WHERE user_id=$1',[owner])).rows[0].count),3);
  const source='20000000-0000-4000-8000-000000000001';await main.query("INSERT INTO quests VALUES($1,$2,'daily','{\"learning\":{}}')",[source,owner]);await main.query("INSERT INTO quest_outcomes VALUES($1,$2,'{\"gradeResult\":{\"grade\":\"Good\"}}',now(),'server')",[owner,source]);
  await Promise.all([a.query('SELECT sync_cosmetic_inventory($1)',[owner]),b.query('SELECT sync_cosmetic_inventory($1)',[owner])]);
  assert.equal(Number((await main.query('SELECT count(*) FROM cosmetic_grants WHERE user_id=$1',[owner])).rows[0].count),4);
  console.log('Independent PostgreSQL connections passed simultaneous starter/earned grants and source replay: one receipt per user/item.');
 }finally{for(const c of connections)await c.end();await admin.query(`DROP DATABASE ${name}`);await admin.end();}
})().catch(error=>{console.error(error);process.exitCode=1;});
