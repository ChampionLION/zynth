// Short UI acceptance flow; all account and inventory data is disposable/local.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {createAccountFixture}=require('./fixtures/account-server.cjs');
(async()=>{
 const fixture=createAccountFixture(),owner=fixture.account.id;let browser;
 const rows=[['wayfarer-coat','outfit','Wayfarer coat'],['studio-knit','outfit','Studio knit'],['field-jacket','outfit','Field jacket'],['trail-scarf','accessory','Trail scarf'],['mission-satchel','accessory','Mission satchel'],['scholar-coat','outfit','Scholar coat'],['sharp-pin','accessory','Sharp pin'],['focus-halo','aura','Focus halo']];
 let snapshot={version:1,owner,equipment:{},items:rows.map(([id,slot,name],i)=>({id,slot,name,version:1,description:'A local preview item.',rarity:'Common',requirement:i<3?'Free starter outfit':'Earn through learning',rule:i<3?'starter':'lesson',owned:i<4,equipped:false,awardedAt:i<4?new Date().toISOString():null}))};
 const before=JSON.stringify(fixture.state.tables.profiles);
 await new Promise(resolve=>fixture.server.listen(54339,'127.0.0.1',resolve));
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
  const context=await browser.newContext({viewport:{width:1365,height:900},reducedMotion:'reduce'});
  await context.route('**/api/journey/inventory',async route=>{
   if(route.request().method()==='POST'){
    const {slot,itemId}=route.request().postDataJSON();assert.ok(itemId===null||snapshot.items.some(i=>i.id===itemId&&i.slot===slot&&i.owned));
    if(itemId===null)delete snapshot.equipment[slot];else snapshot.equipment[slot]=itemId;
    snapshot.items=snapshot.items.map(i=>({...i,equipped:snapshot.equipment[i.slot]===i.id}));
   }
   await route.fulfill({json:snapshot});
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:3002/auth?mode=signin');await page.getByLabel('Email address',{exact:true}).fill('preview@zynth.local');await page.getByLabel('Password',{exact:true}).fill('preview-password');await page.getByRole('button',{name:/^Sign in/}).click();await page.waitForURL(/\/(quest|dashboard)$/);
  await page.goto('http://localhost:3002/profile');assert.equal(await page.getByRole('region',{name:'Cosmetic inventory'}).count(),0,'Inventory stays out of the identity page');await page.getByRole('button',{name:'Customize appearance'}).click();await page.getByRole('navigation',{name:'Customize sections'}).getByRole('button',{name:'Inventory',exact:true}).click();const inventory=page.getByRole('region',{name:'Cosmetic inventory'});await inventory.getByRole('button',{name:/Scholar coat/}).waitFor();
  await inventory.getByRole('button',{name:/Scholar coat/}).click();assert.equal(await inventory.getByRole('button',{name:'Not earned yet',exact:true}).isDisabled(),true);
  await inventory.getByRole('button',{name:/Trail scarf/}).click();await inventory.getByRole('button',{name:'Equip item',exact:true}).click();await inventory.getByRole('status').filter({hasText:'Appearance updated.'}).waitFor();
  assert.match(await page.locator('.avatar-identity .avatar-art').getAttribute('aria-label'),/with trail scarf/);
  await inventory.getByRole('group',{name:'Show',exact:true}).getByRole('button',{name:'Owned',exact:true}).click();assert.equal(await inventory.locator('.inventory-card').count(),4);
  await inventory.getByRole('group',{name:'Show',exact:true}).getByRole('button',{name:'Equipped',exact:true}).click();assert.equal(await inventory.locator('.inventory-card').count(),1);
  await page.screenshot({path:'.review/m4-inventory-desktop.png',fullPage:true});
  await context.setOffline(true);await inventory.getByRole('button',{name:'Remove item',exact:true}).click();await inventory.getByRole('status').filter({hasText:'Sync pending.'}).waitFor();
  assert.doesNotMatch(await page.locator('.avatar-identity .avatar-art').getAttribute('aria-label'),/with trail scarf/,'Cached equipment updates immediately');
  await context.setOffline(false);await page.waitForFunction(()=>{const q=localStorage.getItem('zynth:inventory:00000000-0000-4000-8000-000000000003:pending');return q==='[]';});assert.equal(snapshot.equipment.accessory,undefined);
  await inventory.getByRole('group',{name:'Show',exact:true}).getByRole('button',{name:'All',exact:true}).click();await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Phone layout fits');await inventory.scrollIntoViewIfNeeded();await page.screenshot({path:'.review/m4-inventory-phone.png',fullPage:true});
  assert.equal(JSON.stringify(fixture.state.tables.profiles),before,'Cosmetics do not mutate progression');assert.deepEqual(errors,[]);
  console.log('Inventory browser passed: locked previews, validated equip/remove, shared avatar, owned/equipped filters, cached equipment/reconnect, unchanged progression and desktop/phone layouts.');
 }finally{if(browser)await browser.close();await new Promise(resolve=>fixture.server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
