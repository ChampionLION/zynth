// Actual quest UI, disposable accounts, synthetic speech input. No hosted writes.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {createAccountFixture}=require('./fixtures/account-server.cjs');
const {mockGenerateQuest}=require('../.test-build/src/lib/llm/mock');
const crypto=require('node:crypto');

(async()=>{
 const fixture=createAccountFixture();let browser,page;
 const setQuest=type=>{
  const profile=fixture.state.tables.profiles[0],now=new Date().toISOString();
  const quest={...mockGenerateQuest(profile,type,2),id:crypto.randomUUID(),status:'active',date:now.slice(0,10),created_at:new Date(Date.now()-180000).toISOString()};
  fixture.state.tables.quests.push({id:quest.id,user_id:fixture.owner,quest_data:quest,status:'active',created_at:quest.created_at,draft_data:{response:'',step_responses:[],current_step:0,elapsed_seconds:180,updated_at:now}});
  return quest;
 };
 fixture.state.tables.quests=[];const first=setQuest('daily');
 await new Promise(resolve=>fixture.server.listen(54339,'127.0.0.1',resolve));
 try{
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{}),args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.route('**/*',route=>{const u=new URL(route.request().url());return ['localhost','127.0.0.1'].includes(u.hostname)||['blob:','data:'].includes(u.protocol)?route.continue():route.abort();});
  await context.addInitScript(()=>{class Speech{start(){window.__speech=this;}stop(){this.onend?.();}abort(){}}window.SpeechRecognition=Speech;});
  page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://localhost:3002/auth?mode=signin');
  await page.getByLabel('Email address',{exact:true}).fill('preview@zynth.local');await page.getByLabel('Password',{exact:true}).fill('preview-password');
  await page.getByRole('button',{name:/^Sign in/}).click();await page.waitForURL(/\/(quest|dashboard)$/);await page.goto('http://localhost:3002/quest');
  await page.getByRole('group',{name:'A small check'}).waitFor();
  assert.equal(await page.locator('.quest-lesson').count(),2);assert.equal(await page.locator('.quest-worked-example').count(),2);
  const reply=page.getByLabel('Your reply / editable transcript');
  await reply.fill('This draft has not selected an option.');await page.getByRole('button',{name:'Check understanding',exact:false}).click();
  await page.getByRole('alert').filter({hasText:'Choose an option'}).waitFor();assert.equal(fixture.state.tables.profiles[0].quest_history.length,0);
  const reason='I used the rule from the worked example.';await reply.fill(reason);
  const wrong=first.learning.check.options.find(o=>o.key!==first.learning.check.correct_option).key;
  await page.locator(`.quest-check input[value="${wrong}"]`).check();
  await page.locator(`.quest-check input[value="${first.learning.check.correct_option}"]`).check();
  assert.ok((await reply.inputValue()).endsWith(reason),'Changing a choice preserves the explanation');
  await page.getByRole('status').filter({hasText:'Draft saved to your account'}).waitFor();await page.reload();
  await page.locator(`.quest-check input[value="${first.learning.check.correct_option}"]`).waitFor();
  assert.equal(await page.locator(`.quest-check input[value="${first.learning.check.correct_option}"]`).isChecked(),true);
  assert.ok((await reply.inputValue()).endsWith(reason));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.waitForFunction(()=>{const main=document.querySelector('main');return main&&getComputedStyle(main).opacity==='1';});
  await page.screenshot({path:'.review/learning-quest-phone.png',fullPage:true,animations:'disabled'});
  await page.getByRole('button',{name:'Check understanding',exact:false}).click();await page.waitForURL('**/grade');
  await page.getByText('Practice complete',{exact:true}).waitFor();
  assert.equal(fixture.state.tables.profiles[0].quest_history.at(-1).grade,'Good');
  assert.deepEqual(fixture.state.tables.profiles[0].quest_history.at(-1).learning_topics,first.learning.lessons.map(l=>l.title));
  const second=setQuest('daily'),incorrect=second.learning.check.options.find(o=>o.key!==second.learning.check.correct_option).key;
  await page.goto('http://localhost:3002/quest');await page.getByRole('group',{name:'A small check'}).waitFor();assert.equal(await page.locator('.quest-lesson').count(),1);
  await page.getByRole('button',{name:'Record reply',exact:false}).click();await page.waitForFunction(()=>Boolean(window.__speech?.onresult));
  await page.evaluate(key=>window.__speech.onresult({results:[{0:{transcript:`Option ${key}`},isFinal:true}]}),incorrect);
  await page.getByRole('button',{name:'Stop recording'}).click();await page.getByRole('button',{name:/Record (more|reply)/}).waitFor();
  await page.getByRole('button',{name:'Check understanding',exact:false}).click();await page.waitForURL('**/grade');await page.getByText('Practice complete',{exact:true}).waitFor();
  assert.equal(fixture.state.tables.profiles[0].quest_history.at(-1).grade,'Basic');
  await page.getByText(second.learning.check.explanation,{exact:false}).first().waitFor();await page.screenshot({path:'.review/learning-feedback-phone.png',fullPage:true});
  const mission=setQuest('mission');await page.goto('http://localhost:3002/quest');
  const scenario=page.getByRole('region',{name:'Provided mission scenario'});await scenario.waitFor();assert.ok((await scenario.textContent()).includes(mission.scenario));
  assert.equal(await page.locator('.quest-lesson').count(),0);await reply.fill('I am solving the supplied case and checking the facts and constraints.');
  await page.getByRole('button',{name:'Next Step',exact:false}).click();
  await page.getByRole('status').filter({hasText:'Draft saved to your account'}).waitFor();await page.reload();
  await page.getByText('Step 2 of 3',{exact:true}).waitFor();assert.ok((await scenario.textContent()).includes(mission.scenario));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'.review/mission-scenario-phone.png',fullPage:true});
  assert.deepEqual(errors,[]);console.log('Learning browser flow passed: two lessons, worked examples, concise choice checks, invalid-answer recovery, preserved drafts/explanations, voice input, corrective feedback, saved topics, supplied mission scenario and step restoration at phone width.');
 }catch(error){if(page){console.error({url:page.url(),screen:(await page.locator('body').innerText()).slice(0,1600)});await page.screenshot({path:'.review/learning-browser-failure.png',fullPage:true});}throw error;}finally{if(browser)await browser.close();await new Promise(resolve=>fixture.server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
