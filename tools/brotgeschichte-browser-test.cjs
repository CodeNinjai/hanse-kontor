'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1500,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);await page.locator('#new-game-form button[type=submit]').click();
 await page.evaluate(()=>{HK.loop=()=>{};HK.setSpeed(0);HK.UI.lehrgangAktion('zu');const s=HK.state;s.day=18;s.money=20000;s.influence=40;HK.breadSync(s);s.breadStory.cause='fraud';HK.UI.setTab('missions');});
 assert.equal(await page.locator('[data-mission=bread]').count(),1);await page.locator('[data-mission=bread] [data-action=breadopen]').click();
 assert(!/absichtliche Verknappung:/.test(await page.locator('.bread-story').innerText()),'cause leaked before investigation');
 const check=async()=>{for(const lang of ['de','en'])for(const width of [1500,390,320]){
  await page.setViewportSize({width,height:1100});await page.evaluate(lang=>{HK.setLang(lang);HK.UI.renderAll();document.querySelectorAll('.bread-story details').forEach(el=>el.open=true);},lang);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'viewport '+lang+width);
  assert(await page.locator('.bread-story').evaluate(el=>el.scrollWidth<=el.clientWidth+2),'story overflow '+lang+width);
  assert(!/bread[A-Z_]\w*|undefined|NaN/.test(await page.locator('.bread-story').innerText()),'missing copy '+lang);
 }};
 await check();await page.evaluate(()=>{HK.setLang('de');HK.UI.renderAll();});
 await page.locator('[data-choice=accept]').click();await check();await page.locator('[data-choice=listen]').click();
 const pure=await page.evaluate(()=>{const before=JSON.stringify(HK.state);HK.UI.breadPanel();HK.UI.missionRecords();return before===JSON.stringify(HK.state);});assert(pure);
 await page.evaluate(()=>{HK.tick(HK.state);HK.UI.renderAll();});assert(await page.locator('[data-choice=warrant]').isDisabled());
 await page.locator('.bread-story details').filter({has:page.locator('[data-choice=verify]')}).locator('summary').first().click();await page.locator('[data-choice=verify]').click();
 await page.evaluate(()=>{HK.autosave();HK.loadGame();HK.setSpeed(0);HK.UI.missionFocus='bread';HK.UI.setTab('missions');HK.tick(HK.state);HK.tick(HK.state);HK.UI.renderAll();});
 assert.equal(await page.evaluate(()=>HK.state.breadStory.report),'fraud');await check();
 await page.setViewportSize({width:1500,height:1100});await page.evaluate(()=>{HK.setLang('de');HK.UI.renderAll();document.querySelectorAll('[data-help] details, details[data-help]').forEach(el=>el.open=false);HK.UI.sidebar.scrollTop=0;});await page.screenshot({path:'/tmp/hanse-brotgeschichte.png'});
 const stock=await page.evaluate(()=>HK.state.town.stock.grain+HK.state.breadStory.reserve);await page.locator('[data-choice=warrant]').click();assert.equal(await page.evaluate(()=>HK.state.town.stock.grain),stock);
 await page.evaluate(()=>{for(let n=0;n<7;n++)HK.tick(HK.state);HK.UI.postSelected=HK.state.post.messages.find(m=>m.type==='bread'&&m.ref.stage==='review').id;HK.UI.setTab('mail');});
 await page.locator('.post-letter [data-action=breadopen]').click();await check();
 // The actual recorded supply determines which legal response is shown.
 if(await page.locator('[data-choice=account]').count())await page.locator('[data-choice=account]').click();else await page.locator('[data-choice=acknowledge]').click();
 await page.evaluate(()=>{HK.UI.missionFocus=null;HK.UI.missionFilter='finished';HK.UI.setTab('missions');});assert.equal(await page.locator('[data-mission=bread]').count(),1);
 // Corrupt route gets a different hearing, and remains so after save/load.
 await page.evaluate(()=>{const s=HK.newGame({name:'Corrupt test',difficulty:'normal',years:20});HK.state=s;s.day=18;s.money=20000;HK.breadSync(s);HK.breadAct(s,'accept','offer');HK.breadAct(s,'bribe','investigate');HK.UI.missionFocus='bread';HK.UI.setTab('missions');});
 await page.locator('[data-choice=negotiate]').click();await page.evaluate(()=>{const s=HK.state;s.day=s.breadStory.reviewAt;HK.breadSync(s);HK.autosave();HK.loadGame();HK.setSpeed(0);HK.UI.missionFocus='bread';HK.UI.setTab('missions');});
 assert.equal(await page.locator('[data-choice=account]').count(),0);await check();await page.locator('[data-choice=restitution]').click();assert.equal(await page.evaluate(()=>HK.state.breadStory.ending),'restitution');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',publicInvestigation:true,rumourRecovery:true,lawfulSeizure:true,corruptHearing:true,persistence:true,pureViews:pure,languages:2,widths:3,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
