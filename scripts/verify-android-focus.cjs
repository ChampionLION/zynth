// Real web UI with a simulated Android message port and disposable local accounts.
// Does not prove native alarm delivery, overlay windows or Android permission screens.
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const {createAccountFixture} = require('./fixtures/account-server.cjs');

(async () => {
  const fixture = createAccountFixture();
  await new Promise(resolve => fixture.server.listen(54339, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({headless:true, ...(process.env.BROWSER_EXECUTABLE ? {executablePath:process.env.BROWSER_EXECUTABLE} : {})});
    const context = await browser.newContext({viewport:{width:390,height:844}});
    await context.route('**/*', route => ['localhost','127.0.0.1'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
    await context.addInitScript(() => {
      const initial = {platform:'android',owner:'',enabled:false,time:'18:00',reminderMinutes:5,overlayAllowed:false,exactAllowed:false,notificationsAllowed:false,overlay:false,nextAt:null};
      window.__nativeState = JSON.parse(localStorage.getItem('test:android-state') || 'null') || initial;
      window.__nativeCommands = [];
      window.ZynthNative = {onmessage:null, postMessage(raw) {
        const {id,command,data} = JSON.parse(raw), state = window.__nativeState;
        window.__nativeCommands.push({command,data});
        let error;
        if(command === 'bindOwner' && state.owner !== data.owner) {state.owner=data.owner;state.enabled=false;state.nextAt=null;}
        if(command === 'permission' && data.kind === 'notifications') state.notificationsAllowed=true;
        // Overlay access remains denied until the test explicitly changes the OS state.
        if(command === 'saveSchedule') {
          if(window.__failNativeSave) error='Simulated device save failure. Your edits are still here.';
          else if(data.enabled && !state.notificationsAllowed && !(state.overlayAllowed && state.exactAllowed)) error='Allow notifications, or allow both overlays and precise alarms first.';
          else Object.assign(state, {enabled:data.enabled,time:data.time,reminderMinutes:data.reminderMinutes,nextAt:data.enabled?'2026-11-04T08:20:00Z':null});
        }
        localStorage.setItem('test:android-state',JSON.stringify(state));
        queueMicrotask(() => window.ZynthNative.onmessage?.({data:JSON.stringify({id,ok:!error,state,error})}));
      }};
    });
    const page = await context.newPage(), errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://localhost:3002/auth?mode=signin');
    await page.getByLabel('Email address',{exact:true}).fill('preview@zynth.local');
    await page.getByLabel('Password',{exact:true}).fill('preview-password');
    await page.getByRole('button',{name:/^Sign in/}).click();
    await page.getByRole('dialog',{name:'Allow your quest to come to you.'}).waitFor();
    await page.getByRole('button',{name:'Allow quest overlays',exact:true}).click();
    await page.waitForURL(/settings/);
    await page.getByText('First, allow quest overlays.',{exact:true}).waitFor();
    assert.ok(await page.evaluate(()=>window.__nativeCommands.some(x=>x.command==='permission'&&x.data.kind==='overlay')),'Overlay permission must be requested explicitly');
    await page.getByLabel('Daily quest time',{exact:false}).fill('09:20');
    await page.getByLabel('Repeat notifications',{exact:false}).selectOption('10');
    await page.getByLabel('Enable daily quest focus',{exact:false}).check();
    await page.getByRole('button',{name:'Save quest time',exact:true}).click();
    await page.getByRole('alert').filter({hasText:'Allow notifications'}).waitFor();
    await page.locator('.focus-permissions > div').filter({hasText:'Notifications'}).getByRole('button').click();
    await page.getByRole('button',{name:'Save quest time',exact:true}).click();
    await page.getByRole('status').filter({hasText:'Daily quest time saved'}).waitFor();
    assert.deepEqual(await page.evaluate(()=>[window.__nativeState.enabled,window.__nativeState.time,window.__nativeState.reminderMinutes,window.__nativeState.overlayAllowed]),[true,'09:20',10,false]);
    await page.reload();
    await page.getByRole('heading',{name:'Settings',exact:true}).waitFor();
    await page.waitForFunction(()=>document.querySelector('#quest-focus-time')?.value==='09:20');
    assert.equal(await page.getByLabel('Enable daily quest focus',{exact:false}).isChecked(),true,'A returning account must keep its alarm');
    await page.getByLabel('Daily quest time',{exact:false}).fill('11:30');
    await page.evaluate(()=>{window.__nativeState.overlayAllowed=true;window.dispatchEvent(new Event('zynth-native-resume'));});
    await page.getByText('First, allow quest overlays.',{exact:true}).waitFor({state:'detached'});
    assert.equal(await page.getByLabel('Daily quest time',{exact:false}).inputValue(),'11:30','Returning from permissions preserves unsaved edits');
    await page.evaluate(()=>{window.__failNativeSave=true;});
    await page.getByRole('button',{name:'Save quest time',exact:true}).click();
    await page.getByRole('alert').filter({hasText:'Simulated device save failure'}).waitFor();
    assert.equal(await page.getByLabel('Daily quest time',{exact:false}).inputValue(),'11:30');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Focus settings must fit portrait phones');
    await page.screenshot({path:'.review/android-focus-phone.png',fullPage:true});
    await page.getByRole('button',{name:/^Sign out/}).click();
    await page.waitForURL(/auth/);
    await page.waitForFunction(()=>window.__nativeState.owner===''&&!window.__nativeState.enabled);
    assert.deepEqual(errors,[],'No browser runtime errors');
    await context.close();
    console.log('Android web integration passed: first-use overlay request, denial fallback, configurable repeats, permission refresh, saved alarm restoration, failed-save preservation, portrait layout and sign-out cancellation. Native runtime verification remains separate.');
  } finally { if(browser)await browser.close();await new Promise(resolve=>fixture.server.close(resolve)); }
})().catch(error=>{console.error(error);process.exitCode=1;});
