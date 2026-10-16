const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {createAccountFixture}=require('./fixtures/account-server.cjs');
(async()=>{
 const fixture=createAccountFixture();const profile=fixture.state.tables.profiles[0];profile.cumulative_exp=50;
 for(let i=0;i<60;i++)fixture.state.tables.profiles.push({...profile,user_id:`10000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,display_name:`Explorer Private Surname${i}`,domain:i%2===0?'CREATIVE':'TECHNICAL',cumulative_exp:1000-i});
 await new Promise(resolve=>fixture.server.listen(54339,'127.0.0.1',resolve));let browser;
 try{
  browser=await chromium.launch({...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{}),headless:true});
  const context=await browser.newContext({viewport:{width:1365,height:900},colorScheme:'light'});
  await context.route('**/*',route=>['localhost','127.0.0.1'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:3002/auth?mode=signin');await page.waitForFunction(()=>document.querySelector('.account-submit')?.disabled===false);await page.getByLabel('Email address',{exact:true}).fill('preview@zynth.local');await page.getByLabel('Password',{exact:true}).fill('fixture-password');await page.getByRole('button',{name:/^Sign in/}).click();await page.waitForURL(/\/(dashboard|quest)$/);
  await page.goto('http://localhost:3002/leaderboard');await page.getByRole('region',{name:'Your position'}).waitFor();
  assert.match(await page.getByRole('region',{name:'Your position'}).innerText(),/#61/);assert.equal(await page.getByRole('article').count(),3);assert.equal(await page.locator('.leaderboard-list li').count(),22);
  assert.ok(!(await page.locator('main').innerText()).includes('Private'));assert.ok(!(await page.locator('main').innerText()).includes('Surname'));
  await page.getByRole('button',{name:'Next →',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.leaderboard-pagination')?.textContent.includes('26–50'));assert.equal(await page.locator('.leaderboard-list li').count(),25);
  await page.getByRole('button',{name:'creative',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.leaderboard-own')?.textContent.includes('#31'));assert.equal(await page.locator('.leaderboard-podium article').count(),3);
  await page.getByRole('button',{name:'social',exact:true}).click();await page.getByRole('heading',{name:'A new board. A first step.'}).waitFor();assert.equal(await page.getByRole('region',{name:'Your position'}).count(),0);
  await page.getByRole('button',{name:'All skills',exact:true}).click();await page.getByRole('region',{name:'Your position'}).waitFor();
  fixture.state.failLeaderboard=true;await page.getByRole('button',{name:'Refresh ↻',exact:true}).click();await page.getByRole('alert').waitFor();fixture.state.failLeaderboard=false;await page.getByRole('button',{name:'Try again',exact:true}).click();await page.getByRole('region',{name:'Your position'}).waitFor();
  await page.screenshot({path:'.review/leaderboard-desktop.png'});
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'.review/leaderboard-mobile.png'});
  await page.goto('http://localhost:3002/settings');await page.getByLabel('Show me on the leaderboard',{exact:false}).uncheck();await page.getByRole('button',{name:'Save changes',exact:true}).click();await page.getByRole('status').filter({hasText:'Profile saved'}).waitFor();
  await page.goto('http://localhost:3002/leaderboard');await page.getByText('You’re browsing privately and aren’t included in these rankings.',{exact:false}).waitFor();assert.equal(await page.getByRole('region',{name:'Your position'}).count(),0);assert.ok((await page.locator('.leaderboard-toolbar').innerText()).includes('60 participants'));
  assert.deepEqual(errors,[]);console.log('Leaderboard browser checks passed: real SDK RPC, pagination, category/empty/error recovery, own rank outside page, anonymized names, phone layout and settings opt-out. Disposable local data only.');
 }finally{await browser?.close();await new Promise(resolve=>fixture.server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
