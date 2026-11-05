// One focused acceptance flow; disposable accounts only.
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {createAccountFixture}=require('./fixtures/account-server.cjs');
const {mockGenerateQuest}=require('../.test-build/src/lib/llm/mock');
const {gradeLearningCheck}=require('../.test-build/src/lib/learning');
const {runPostGradePipeline}=require('../.test-build/src/lib/engines/pipeline');
const {runExploitCheck}=require('../.test-build/src/lib/engines/exploit');
(async()=>{
 const fixture=createAccountFixture();let browser,completed=0,pending=null;
 const profile=fixture.state.tables.profiles[0],now=new Date().toISOString(),day=now.slice(0,10);
 profile.continuous_profile_answers=[{answered_at:now}];
 const quest={...mockGenerateQuest(profile,'daily',2),id:crypto.randomUUID(),status:'active',date:day,created_at:now};let active=quest;
 const pack={key:'lesson-pack:fixture',lessons:Array.from({length:3},(_,i)=>({ordinal:i+1,quest:{...quest,id:crypto.randomUUID(),date:new Date(Date.now()+(i+1)*86400000).toISOString().slice(0,10)}}))};
 await new Promise(resolve=>fixture.server.listen(54339,'127.0.0.1',resolve));
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.route('**/api/journey/state',r=>r.fulfill({json:{mode:'trusted',profile:fixture.state.tables.profiles[0],activeQuest:active,pending}}));
  await context.route('**/api/journey/lessons',r=>r.fulfill({json:pack}));
  await context.route('**/api/journey/complete',async r=>{completed++;const input=r.request().postDataJSON();const gradeResult=gradeLearningCheck(quest,input.responseText);const result=await runPostGradePipeline({profile,quest,gradeResult,responseText:input.responseText,responseTimeSeconds:180,exploit:runExploitCheck({profile,quest,response:input.responseText,responseTimeSeconds:180}),swiftModeUsed:false});fixture.state.tables.profiles[0]=result.profile;active=null;pending={questId:quest.id,result:{...result,gradeResult},gradeSeen:false,eventCursor:0};await r.fulfill({json:{profile:result.profile,result:pending.result}});});
  await context.route('**/api/journey/ack',r=>r.fulfill({json:{ok:true}}));
  const page=await context.newPage();await page.goto('http://localhost:3002/auth?mode=signin');await page.getByLabel('Email address',{exact:true}).fill('preview@zynth.local');await page.getByLabel('Password',{exact:true}).fill('preview-password');await page.getByRole('button',{name:/^Sign in/}).click();await page.waitForURL('**/dashboard');
  await page.getByRole('button',{name:'Begin lesson',exact:false}).waitFor();assert.equal(await page.getByRole('region',{name:'Your lessons'}).count(),0);
  await page.waitForFunction(owner=>JSON.parse(localStorage.getItem(`zynth:journey-cache:v2:${owner}`)||'null')?.pack?.lessons.length===3,fixture.owner);
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.waitForFunction(async()=>Boolean(await caches.match(location.origin+'/quest')));
  await page.getByRole('button',{name:'Begin lesson',exact:false}).click();await page.waitForURL('**/quest');await page.getByRole('group',{name:'A small check'}).waitFor();
  await context.setOffline(true);await page.reload();await page.getByRole('group',{name:'A small check'}).waitFor();assert.ok(page.url().endsWith('/quest'));assert.ok(!(await page.locator('body').innerText()).includes('OFFLINE'));
  await page.locator(`.quest-check input[value="${quest.learning.check.correct_option}"]`).check();await page.getByRole('button',{name:'Check understanding',exact:false}).click();await page.waitForURL('**/grade');await page.getByText('Practice complete',{exact:true}).waitFor();
  assert.equal(completed,0);assert.equal(await page.evaluate(owner=>JSON.parse(localStorage.getItem(`zynth:journey-cache:v2:${owner}:replies`)).length,fixture.owner),1);
  await context.setOffline(false);await page.waitForFunction(owner=>JSON.parse(localStorage.getItem(`zynth:journey-cache:v2:${owner}:replies`)||'[]').length===0,fixture.owner,{timeout:45000});assert.equal(completed,1);
  console.log('Unified daily lesson passed: normal Overview/quest/grade routes, same cached lesson after cold reload, local check feedback, one automatic server submission, three upcoming daily lessons, no separate mode UI.');
 }finally{if(browser)await browser.close();await new Promise(resolve=>fixture.server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
