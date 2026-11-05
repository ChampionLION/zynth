// Production service worker + actual browser storage + disposable Auth backend.
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {createAccountFixture}=require('./fixtures/account-server.cjs');
const {mockGenerateQuest}=require('../.test-build/src/lib/llm/mock');
const {gradeLearningCheck}=require('../.test-build/src/lib/learning');
const {runExploitCheck}=require('../.test-build/src/lib/engines/exploit');
const {runPostGradePipeline}=require('../.test-build/src/lib/engines/pipeline');
(async()=>{
 const fixture=createAccountFixture();let browser,completeCalls=0,pending=null;
 const original=fixture.state.tables.profiles[0],now=new Date().toISOString();
 const quest={...mockGenerateQuest(original,'daily',2),id:crypto.randomUUID(),status:'active',date:now.slice(0,10),created_at:new Date(Date.now()-180000).toISOString()};
 fixture.state.tables.quests=[{id:quest.id,user_id:fixture.owner,quest_data:quest,status:'active',created_at:quest.created_at,draft_data:null}];
 await new Promise(resolve=>fixture.server.listen(54339,'127.0.0.1',resolve));
 try{
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{}),args:['--use-fake-ui-for-media-stream']});
  const context=await browser.newContext({viewport:{width:390,height:844}}),errors=[];
  await context.route('**/*',route=>{const u=new URL(route.request().url());return ['localhost','127.0.0.1'].includes(u.hostname)||['blob:','data:'].includes(u.protocol)?route.continue():route.abort();});
  await context.route('**/api/journey/state',route=>route.fulfill({json:{mode:'trusted',profile:fixture.state.tables.profiles[0],activeQuest:fixture.state.tables.quests.find(q=>q.status==='active')?.quest_data??null,pending}}));
  await context.route('**/api/journey/complete',async route=>{
   completeCalls++;const input=route.request().postDataJSON();assert.equal(input.questId,quest.id);
   if(!pending){const gradeResult=gradeLearningCheck(quest,input.responseText),profile=fixture.state.tables.profiles[0];
    const result=await runPostGradePipeline({profile:structuredClone(profile),quest,gradeResult,responseText:input.responseText,responseTimeSeconds:180,exploit:runExploitCheck({profile,quest,response:input.responseText,responseTimeSeconds:180}),swiftModeUsed:false});
    fixture.state.tables.profiles[0]=result.profile;fixture.state.tables.quests[0].status='completed';
    pending={questId:quest.id,result:{...result,gradeResult},gradeSeen:false,eventCursor:0};
   }
   await route.fulfill({json:{profile:fixture.state.tables.profiles[0],result:pending.result,replayed:completeCalls>1}});
  });
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://localhost:3002/auth?mode=signin');await page.getByLabel('Remember me',{exact:false}).check();
  await page.getByLabel('Email address',{exact:true}).fill('preview@zynth.local');await page.getByLabel('Password',{exact:true}).fill('preview-password');await page.getByRole('button',{name:/^Sign in/}).click();await page.waitForURL(/\/(quest|dashboard)$/);
  await page.goto('http://localhost:3002/offline');
  await page.waitForFunction(owner=>{const p=JSON.parse(localStorage.getItem(`zynth:offline:${owner}`)||'null');return p?.lessons.length===3;},fixture.owner);
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
  await page.waitForFunction(async()=>Boolean(await caches.match('/offline')));
  assert.equal(await page.locator('.offline-library button').count(),4);
  await context.setOffline(true);await page.reload();await page.getByRole('heading',{name:'Keep becoming.',exact:true}).waitFor();
  await page.getByLabel('Your answer / editable transcript').fill(`Choice ${quest.learning.check.correct_option}`);await page.getByRole('button',{name:'Save answer to sync'}).click();
  await page.getByText('Your quest answer is saved and waiting to sync.',{exact:false}).waitFor();assert.equal(completeCalls,0);
  for(let index=0;index<3;index++){
   const button=page.locator('.offline-library button').filter({hasText:'UPCOMING LESSON 1'});await button.click();
   await page.locator('.quest-check input').first().check();await page.getByRole('button',{name:'Finish lesson'}).click();
   await page.waitForFunction(({owner,n})=>JSON.parse(localStorage.getItem(`zynth:offline:${owner}`)).journal.cursors.CREATIVE===n,{owner:fixture.owner,n:index+1});
   await page.reload();await page.getByRole('heading',{name:'Keep becoming.',exact:true}).waitFor();
  }
  assert.equal(fixture.state.tables.profiles[0].quest_history.length,0,'No offline XP/history writes');assert.equal(await page.locator('.offline-library button').count(),1);
  await page.screenshot({path:'.review/offline-lessons-phone.png',fullPage:true});
  await context.setOffline(false);
  await page.waitForFunction(owner=>{const p=JSON.parse(localStorage.getItem(`zynth:offline:${owner}`)||'null');return p?.lessons[0]?.sequence===3&&!localStorage.getItem(`zynth:offline:${owner}:submission`);},fixture.owner,{timeout:45000});
  assert.deepEqual(await page.evaluate(owner=>JSON.parse(localStorage.getItem(`zynth:offline:${owner}`)).lessons.map(l=>l.sequence),fixture.owner),[3,4,5]);
  assert.equal(fixture.state.tables.profiles[0].quest_history.length,1);assert.equal(completeCalls,1);
  const journal=Object.entries(fixture.account.user_metadata).find(([key])=>key.startsWith('zynth_study_'))?.[1];assert.equal(journal.cursors.CREATIVE,3);assert.equal(journal.recent.length,3);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.goto('http://localhost:3002/download');await page.getByRole('link',{name:'Download for Android'}).waitFor();
  const apk=await context.request.get('http://localhost:3002/downloads/zynth-0.1.2.apk');assert.equal(apk.status(),200);assert.ok(apk.headers()['content-type'].includes('application/vnd.android.package-archive'));assert.ok(apk.headers()['content-disposition'].includes('attachment'));assert.equal(crypto.createHash('sha256').update(await apk.body()).digest('hex'),'835904c04ff41d0b7f44bcff6d648eca0f935626fde57d548aec2c5cac6601d1');
  await page.screenshot({path:'.review/download-phone.png',fullPage:true});
  const state=await context.storageState();const remembered=await browser.newContext({storageState:state});await remembered.route('**/api/journey/state',route=>route.fulfill({json:{mode:'legacy'}}));const returned=await remembered.newPage();await returned.goto('http://localhost:3002/auth?mode=signin');await returned.waitForURL(/\/(dashboard|quest)$/);await remembered.close();
  const cached=await page.evaluate(async()=>{const cache=await caches.open('zynth-offline-shell-v1');return (await cache.keys()).map(r=>r.url);});assert.ok(!cached.some(url=>url.includes('/api/')||url.includes('supabase')||url.includes('.apk')),'No private/API/APK responses in the offline shell');
  assert.deepEqual(errors,[]);console.log('Offline browser passed: real service worker cold reload, remembered restart, queued quest synced once, three lessons completed offline and synced, refill [3,4,5], private-cache boundary, phone layout, signed APK web download. No hosted writes.');
 }finally{if(browser)await browser.close();await new Promise(resolve=>fixture.server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
