const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {createTrustedFixture}=require('./fixtures/trusted-server.cjs');
(async()=>{
 const fixture=await createTrustedFixture();await new Promise(resolve=>fixture.server.listen(54339,'127.0.0.1',resolve));let browser,page;const errors=[];
 try{
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
  const context=await browser.newContext({viewport:{width:1365,height:900}});await context.route('**/*',route=>['localhost','127.0.0.1'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
  page=await context.newPage();page.on('pageerror',e=>errors.push(e.stack??e.message));
  await page.goto('http://localhost:3002/auth?mode=signin');await page.waitForFunction(()=>document.querySelector('.account-submit')?.disabled===false,null,{timeout:60000});
  await page.getByLabel('Email address',{exact:true}).fill('preview@zynth.local');await page.getByLabel('Password',{exact:true}).fill('fixture-password');await page.getByRole('button',{name:/^Sign in/}).click();
  await page.waitForURL(/\/dashboard$/, {timeout:60000});await page.getByRole('button',{name:'MID',exact:false}).click();await page.getByRole('button',{name:'skip',exact:true}).click();
  await page.getByRole('button',{name:'Begin Quest',exact:false}).waitFor();await page.getByRole('button',{name:'Begin Quest',exact:false}).click();await page.waitForURL(/\/quest$/);
  const quest=(await fixture.pool.query("SELECT id FROM public.quests WHERE user_id=$1 AND status='active'",[fixture.owner])).rows[0];assert.ok(quest);
  await fixture.pool.query("UPDATE public.quests SET created_at=now()-interval '3 minutes' WHERE id=$1",[quest.id]);
  await page.getByLabel('Your reply / editable transcript',{exact:true}).fill('I would first draft a clear layout with a strong heading, compare two alternatives and their tradeoffs, test the structure with another reader, and refine the final result based on that feedback.\nFor example, my event poster would use a single headline, a visible date, and a short route description so a visitor could identify the essential information immediately.\nBecause visual hierarchy changes comprehension, I would compare an illustrated concept with a quieter typographic version, explain the strengths of each approach, and ask a reader which details they remember.\nFinally, I would revise the spacing, simplify distracting decoration, verify the links and directions, and document what the comparison taught me before sharing the finished design.');
  await page.waitForTimeout(800);await page.reload();await page.getByLabel('Your reply / editable transcript',{exact:true}).waitFor();assert.match(await page.getByLabel('Your reply / editable transcript',{exact:true}).inputValue(),/clear layout/);
  fixture.loseCompletionReply();await page.getByRole('button',{name:'Submit',exact:false}).click();await page.getByText('Your response is still here. We couldn’t save the result.',{exact:false}).waitFor();
  const saved=(await fixture.pool.query('SELECT cumulative_exp FROM public.profiles WHERE user_id=$1',[fixture.owner])).rows[0].cumulative_exp;assert.ok(saved>0,'Result committed despite a lost response');
  await page.reload();await page.waitForURL(/\/grade$/);await page.getByRole('button',{name:'Continue',exact:false}).waitFor();await page.getByRole('button',{name:'Continue',exact:false}).click();
  await page.waitForURL(url=>url.pathname!=='/grade');
  const eventCount=(await fixture.pool.query("SELECT jsonb_array_length(result->'events') AS count FROM public.quest_outcomes WHERE quest_id=$1",[quest.id])).rows[0].count;
  assert.ok(eventCount>0,'Exercise actual durable event acknowledgements');
  for(let i=0;i<eventCount;i++)await page.locator('button:enabled').filter({hasText:/^Continue/}).click();
  await page.waitForURL(/\/dashboard$/);await page.reload();await page.getByText('Keep becoming.',{exact:true}).waitFor();assert.equal(new URL(page.url()).pathname,'/dashboard','Acknowledged outcomes do not replay after reload');
  assert.equal((await fixture.pool.query('SELECT cumulative_exp FROM public.profiles WHERE user_id=$1',[fixture.owner])).rows[0].cumulative_exp,saved);
  assert.equal(Number((await fixture.pool.query('SELECT count(*) FROM public.quest_outcomes WHERE user_id=$1',[fixture.owner])).rows[0].count),1);
  await page.goto('http://localhost:3002/settings');await page.getByLabel('Display name',{exact:true}).fill('Mira Updated');await page.getByRole('button',{name:'Save changes',exact:true}).click();await page.getByText('Profile saved.',{exact:false}).waitFor();
  assert.equal((await fixture.pool.query('SELECT cumulative_exp FROM public.profiles WHERE user_id=$1',[fixture.owner])).rows[0].cumulative_exp,saved,'Editable fields preserve authoritative progress');
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'.review/trusted-settings-mobile.png'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);console.log('Browser → Next routes → SDK → real PostgreSQL passed: check-in, stored generation, editable transcript/draft restore, committed-reply loss, durable grade/events, no duplicate rewards, editable fields and phone fit.');
 }catch(error){if(page){await page.screenshot({path:'.review/trusted-failure.png'});console.error((await page.locator('body').innerText()).slice(0,4000),errors);}throw error;}
 finally{await browser?.close();await fixture.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
