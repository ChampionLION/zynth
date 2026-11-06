// One focused interface check, using disposable local accounts only.
const assert=require('node:assert/strict'),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {createAccountFixture}=require('./fixtures/account-server.cjs');
(async()=>{const fixture=createAccountFixture();let browser,release;
 const avatar={version:1,gender:'female',skin:'copper',hair:'bob',hairColor:'ink',outfit:'studio-knit',palette:'plum',background:'grove',accessory:null,aura:null};
 fixture.account.user_metadata.zynth_avatar=avatar;fixture.state.tables.profiles[0].energy_date=null;
 fixture.state.tables.profiles.push({...fixture.state.tables.profiles[0],user_id:'00000000-0000-4000-8000-000000000008',display_name:'Another Learner',cumulative_exp:50,fixture_avatar:{...avatar,hair:'long'}});
 await new Promise(resolve=>fixture.server.listen(54339,'127.0.0.1',resolve));
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),page=await context.newPage();
  let gate=new Promise(resolve=>release=resolve);
  await context.route('**/rest/v1/profiles?**',async route=>{if(route.request().method()==='POST')await gate;await route.continue();});
  await page.goto('http://localhost:3002/auth?mode=signin');await page.getByLabel('Email address',{exact:true}).fill('preview@zynth.local');await page.getByLabel('Password',{exact:true}).fill('preview-password');await page.getByRole('button',{name:/^Sign in/}).click();await page.waitForURL(/\/(quest|dashboard)$/);await page.goto('http://localhost:3002/dashboard');
  await page.getByText(/how.s your energy today/).waitFor();await page.getByRole('button',{name:/HIGH/}).click();await page.getByRole('status').filter({hasText:'Preparing your question...'}).waitFor();assert.equal(await page.getByRole('button',{name:/HIGH|MID|LOW/}).count(),0,'Energy answer buttons hide before the delayed save completes');release();
  await page.getByText('A QUICK ONE',{exact:true}).waitFor();gate=new Promise(resolve=>release=resolve);const popup=page.locator('.fixed.inset-0.z-50');await popup.getByRole('button').first().click();await page.getByRole('status').filter({hasText:'Saving your answer...'}).waitFor();assert.equal(await popup.getByRole('button').count(),0,'Quick-question buttons hide immediately');release();await page.getByText('A QUICK ONE',{exact:true}).waitFor({state:'hidden'});
  await page.goto('http://localhost:3002/profile');assert.equal(await page.getByRole('region',{name:'Cosmetic inventory'}).count(),0);await page.getByRole('button',{name:'Customize appearance'}).click();await page.getByRole('navigation',{name:'Customize sections'}).getByRole('button',{name:'Inventory',exact:true}).click();await page.getByRole('region',{name:'Cosmetic inventory'}).waitFor();await page.getByRole('button',{name:'Close appearance editor'}).click();
  assert.equal(await page.locator('.workspace-nav .profile-picture').count(),1);
  await page.goto('http://localhost:3002/leaderboard');await page.getByRole('button',{name:'Decide later',exact:true}).click();const leaders=page.getByRole('group',{name:'Leading journeys'});await leaders.locator('.profile-picture').first().waitFor();assert.equal(await leaders.locator('.profile-picture').count(),2);assert.match(await leaders.locator('.avatar-art').first().getAttribute('aria-label'),/female avatar/);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'.review/profile-pictures-phone.png',fullPage:true});
  console.log('Focused interface passed: immediate energy/question button removal, energy wording, inventory inside customization, own navigation picture, other-user leaderboard avatars and phone fit.');
 }finally{if(release)release();if(browser)await browser.close();await new Promise(resolve=>fixture.server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
