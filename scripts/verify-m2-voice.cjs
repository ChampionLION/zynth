// Run npm test first, then start the app on 3002 against the local fixture URL.
// PLAYWRIGHT_MODULE can point to an already installed Playwright package.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {createAccountFixture}=require('./fixtures/account-server.cjs');

(async()=>{
  const fixture=createAccountFixture();
  await new Promise(resolve=>fixture.server.listen(54339,'127.0.0.1',resolve));
  let browser;
  try {
    browser=await chromium.launch({...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{}),headless:true,args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
    const context=await browser.newContext({viewport:{width:1365,height:900},colorScheme:'light'});
    const errors=[];
    await context.route('**/*',route=>{const url=new URL(route.request().url());return ['localhost','127.0.0.1'].includes(url.hostname)||['blob:','data:'].includes(url.protocol)?route.continue():route.abort();});
    await context.addInitScript(()=>{
      class Speech {
        start(){window.__speech=this;}
        stop(){this.onend?.();}
        abort(){}
      }
      window.SpeechRecognition=Speech;
    });
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://localhost:3002/auth?mode=signin');
    await page.getByLabel('Email address', {exact:true}).fill('preview@zynth.local');
    await page.getByLabel('Password', {exact:true}).fill('preview-password');
    await page.getByRole('button',{name:/^Sign in/}).click();
    await page.waitForURL(/\/(dashboard|quest)$/);
    await page.goto('http://localhost:3002/settings');
    await page.getByRole('heading',{name:'Settings',exact:true}).waitFor();
    await page.getByLabel('Display name',{exact:true}).fill('Mira Updated');
    await page.getByRole('button',{name:'Save changes',exact:true}).click();
    await page.getByRole('status').filter({hasText:'Profile saved'}).waitFor();
    assert.equal(fixture.state.tables.profiles[0].display_name,'Mira Updated');
    const xp=fixture.state.tables.profiles[0].exp;
    fixture.state.failProfile=true;
    await page.getByLabel('Display name',{exact:true}).fill('Save should fail');await page.getByRole('button',{name:'Save changes',exact:true}).click();
    await page.getByRole('alert').filter({hasText:'couldn’t save'}).waitFor();
    assert.equal(fixture.state.tables.profiles[0].display_name,'Mira Updated');assert.equal(fixture.state.tables.profiles[0].exp,xp);
    fixture.state.failProfile=false;await page.getByRole('button',{name:'Discard',exact:true}).click();
    assert.equal(await page.getByLabel('Display name',{exact:true}).inputValue(),'Mira Updated');
    await page.getByLabel('Display name',{exact:true}).fill('Unsaved navigation');
    await page.getByRole('link',{name:'Overview',exact:false}).last().click();
    const dialog=page.getByRole('dialog');await dialog.waitFor();await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
    await page.getByRole('link',{name:'Overview',exact:false}).last().click();await page.getByRole('button',{name:'Discard and leave'}).click();
    await page.waitForURL('**/dashboard');await page.goto('http://localhost:3002/settings');
    assert.equal(await page.getByLabel('Display name',{exact:true}).inputValue(),'Mira Updated','Discarded edits must not return');
    await page.getByRole('radio',{name:'Light',exact:true}).check();
    await page.getByRole('status').filter({hasText:'Appearance saved'}).waitFor();
    assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
    await fs.mkdir('.review',{recursive:true});await page.screenshot({path:'.review/m2-settings-light.png',fullPage:true});
    await page.getByRole('radio',{name:'Use device setting'}).check();await page.emulateMedia({colorScheme:'dark'});
    await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
    await page.emulateMedia({colorScheme:'light'});await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
    await page.getByLabel('Reduce motion',{exact:false}).check();
    await page.getByRole('status').filter({hasText:'Appearance saved'}).waitFor();assert.equal(await page.locator('html').getAttribute('data-motion'),'reduced');
    fixture.state.failPreferences=true;await page.getByRole('radio',{name:'Dark',exact:true}).check();
    await page.getByRole('status').filter({hasText:'Account sync is unavailable'}).waitFor();await page.reload();
    await page.getByRole('heading',{name:'Settings',exact:true}).waitFor();
    await page.getByRole('status').filter({hasText:'Account sync is unavailable'}).waitFor();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    fixture.state.failPreferences=false;await page.getByRole('button',{name:'Retry account sync'}).click();
    await page.getByRole('status').filter({hasText:'Appearance saved'}).waitFor();assert.equal(fixture.state.tables.user_preferences[0].theme,'dark');
    await page.screenshot({path:'.review/m2-settings-dark.png',fullPage:true});
    await page.evaluate(()=>{for(const key of Object.keys(localStorage))if(key.startsWith('zynth:appearance:'))localStorage.removeItem(key);});await page.reload();
    await page.getByRole('heading',{name:'Settings',exact:true}).waitFor();await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
    assert.equal(await page.getByRole('radio',{name:'Dark',exact:true}).isChecked(),true,'Cloud preferences restore without browser cache');
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.screenshot({path:'.review/m2-settings-mobile.png'});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Settings must fit portrait phones');

    await page.goto('http://localhost:3002/quest');await page.getByRole('button',{name:'Record reply',exact:false}).waitFor();
    await page.getByRole('button',{name:'Record reply',exact:false}).click();await page.waitForFunction(()=>Boolean(window.__speech?.onresult));
    await page.waitForTimeout(400); // Let the synthetic microphone produce a playable chunk.
    assert.equal(await page.getByRole('button',{name:'Next Step',exact:false}).isDisabled(),true);
    const first='I made a clear design draft, compared two layouts, and chose the one with simpler navigation.';
    await page.evaluate(text=>window.__speech.onresult({results:[{0:{transcript:text},isFinal:true}]}),first);
    await page.getByRole('button',{name:'Stop recording'}).click();await page.getByRole('button',{name:/Record (more|reply)/}).waitFor();
    assert.equal(await page.getByLabel('Your reply / editable transcript').inputValue(),first);
    assert.ok(await page.locator('audio').getAttribute('src'));
    await page.screenshot({path:'.review/voice-mission-mobile.png',fullPage:true});
    await page.getByLabel('Your reply / editable transcript').fill(first+' I tested the result.');
    await page.getByRole('button',{name:'Next Step',exact:false}).click();assert.equal(await page.locator('audio').count(),0,'Changing steps releases local audio');
    await page.getByRole('button',{name:'Record reply',exact:false}).click();await page.waitForFunction(()=>Boolean(window.__speech?.onresult));
    const second='The feedback showed that my first layout was too crowded. I removed distractions and improved the final version.';
    await page.evaluate(text=>window.__speech.onresult({results:[{0:{transcript:text},isFinal:true}]}),second);
    await page.getByRole('button',{name:'Stop recording'}).click();await page.getByRole('button',{name:/Record (more|reply)/}).waitFor();
    await page.waitForTimeout(900);await page.reload();await page.getByLabel('Your reply / editable transcript').waitFor();
    assert.equal(await page.getByLabel('Your reply / editable transcript').inputValue(),second,'Voice transcript restores through the existing account draft');
    assert.equal(await page.locator('audio').count(),0,'Audio is not uploaded or restored');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Voice input must fit portrait phones');
    await page.setViewportSize({width:1365,height:900});await page.screenshot({path:'.review/voice-mission-desktop.png',fullPage:true});
    // Unsupported browsers retain the editable answer and the existing submit path.
    await page.addInitScript(()=>{delete window.SpeechRecognition;delete window.webkitSpeechRecognition;});await page.reload();
    await page.getByText('Voice transcription isn’t available in this browser.',{exact:false}).waitFor();
    assert.equal(await page.getByLabel('Your reply / editable transcript').isEnabled(),true);
    for(let index=2;index<fixture.quest.steps.length;index++){
      await page.getByRole('button',{name:'Next Step',exact:false}).click();
      await page.getByLabel('Your reply / editable transcript').fill('I completed the final design, checked every requirement, and refined the result using concrete feedback.');
    }
    await page.getByRole('button',{name:'Complete Mission',exact:false}).click();await page.waitForURL('**/grade');
    assert.equal(fixture.state.tables.profiles[0].quest_history.at(-1).quest_id,fixture.quest.id,'A recorded mission reply must reach the existing grading pipeline');
    assert.equal(fixture.state.tables.quests[0].status,'completed');
    // An ordinary quest uses the same voice control and the same grading path.
    const ordinary={...fixture.quest,id:'00000000-0000-4000-8000-000000000005',type:'daily',steps:[],quest_title:'Ordinary voice test',status:'active'};
    fixture.state.tables.quests.push({id:ordinary.id,user_id:fixture.owner,quest_data:ordinary,status:'active',created_at:new Date().toISOString(),draft_data:{response:'',step_responses:[],current_step:0,elapsed_seconds:120,updated_at:new Date().toISOString()}});
    // A fresh document reinstates supported recognition without the previous fallback override.
    await page.close();const ordinaryPage=await context.newPage();ordinaryPage.on('pageerror',error=>errors.push(error.message));
    await ordinaryPage.goto('http://localhost:3002/quest');await ordinaryPage.getByRole('button',{name:'Record reply',exact:false}).click();
    await ordinaryPage.waitForFunction(()=>Boolean(window.__speech?.onresult));
    await ordinaryPage.evaluate(()=>window.__speech.onresult({results:[{0:{transcript:'For this daily challenge I planned three distinct steps, built a working prototype, tested it with a friend, and corrected the unclear instructions.'},isFinal:true}]}));
    await ordinaryPage.getByRole('button',{name:'Stop recording'}).click();await ordinaryPage.getByRole('button',{name:/Record (more|reply)/}).waitFor();
    await ordinaryPage.getByRole('button',{name:'Submit',exact:false}).click();await ordinaryPage.waitForURL('**/grade');
    assert.equal(fixture.state.tables.profiles[0].quest_history.at(-1).quest_id,ordinary.id);
    await ordinaryPage.goto('http://localhost:3002/settings');await ordinaryPage.getByRole('radio',{name:'Light',exact:true}).check();
    await ordinaryPage.getByRole('status').filter({hasText:'Appearance saved'}).waitFor();
    for(const route of ['dashboard','profile','achievements','markmap']){
      await ordinaryPage.goto(`http://localhost:3002/${route}`);
      await ordinaryPage.locator('main.app-page').waitFor();await ordinaryPage.waitForFunction(()=>document.documentElement.dataset.theme==='light');
      if(route==='dashboard'){
        const skipQuestion=ordinaryPage.getByRole('button',{name:'skip',exact:true});
        if(await skipQuestion.isVisible())await skipQuestion.click();
        assert.equal(await ordinaryPage.locator('.overview-strip').evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(255, 254, 250, 0.94)');
        assert.equal(await ordinaryPage.locator('.overview-attributes dt').count(),6);
        assert.deepEqual((await ordinaryPage.locator('.overview-attributes dt').allTextContents()).slice(0,4),['Focus','Consistency','Adaptability','Execution']);
        assert.equal((await ordinaryPage.locator('.overview-attributes').evaluate(el=>getComputedStyle(el).gridTemplateColumns)).split(' ').length,3);
        await ordinaryPage.setViewportSize({width:390,height:844});await ordinaryPage.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        assert.equal((await ordinaryPage.locator('.overview-attributes').evaluate(el=>getComputedStyle(el).gridTemplateColumns)).split(' ').length,2);
        assert.equal(await ordinaryPage.locator('.overview-attributes dd').count(),6);
        await ordinaryPage.locator('.overview-attributes').scrollIntoViewIfNeeded();await ordinaryPage.screenshot({path:'.review/m2-overview-six-stats-mobile.png'});await ordinaryPage.setViewportSize({width:1365,height:900});
      }
      await ordinaryPage.screenshot({path:`.review/m2-${route}-light.png`,fullPage:route==='dashboard'});
    }
    assert.deepEqual(errors,[],'Browser must have no uncaught application errors');
    console.log('Browser M2/voice checks passed: save/failure/discard, navigation dialog/Escape, light/dark/system, reduced motion, offline preference retry/cloud restoration, portrait layout, synthetic microphone capture, editable mission transcripts, step isolation, draft reload, unsupported-browser fallback, quest AND mission submission through grading, and shared light themes on dashboard/profile/achievements/map. Speech-provider accuracy and hosted migration are not tested.');
  } finally {await browser?.close();await new Promise(resolve=>fixture.server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
