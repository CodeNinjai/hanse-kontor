'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1500,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);await page.locator('#new-game-form button[type=submit]').click();
 await page.evaluate(()=>{HK.loop=()=>{};HK.setSpeed(0);HK.UI.lehrgangAktion('zu');HK.state.money=200000;HK.UI.panel='warehouse';HK.UI.setTab('place');});
 assert((await page.locator('.work-duration').innerText()).includes('4 Tage'));
 const cap=await page.evaluate(()=>HK.state.warehouse.cap);await page.locator('[data-action=expandwh]').click();assert.equal(await page.evaluate(()=>HK.state.warehouse.cap),cap);assert(await page.locator('[data-action=expandwh]').isDisabled());assert.equal(await page.locator('.work-order').count(),1);
 await page.locator('[data-action=tradeplans]').first().click();assert.equal(await page.locator('.work-order').count(),1);await page.locator('.work-plan .context-help summary').click();assert((await page.locator('.work-plan').innerText()).includes('80 %'));await page.screenshot({path:'/tmp/hanse-arbeitsplanung.png'});
 await page.evaluate(()=>{HK.autosave();HK.loadGame();HK.setSpeed(0);HK.UI.setTab('planning');});assert.equal(await page.locator('.work-order').count(),1);
 const money=await page.evaluate(()=>HK.state.money);await page.locator('[data-action=workcancel]').click();assert.equal(await page.locator('.work-order').count(),0);assert.equal(await page.evaluate(()=>HK.state.money),money+3200);
 await page.evaluate(()=>{const st=HK.state;st.day=5;st.houses.forEach(h=>h.owner='npc');HK.intrigueSync(st);HK.intrigueAct(st,'property','start','offer');HK.intrigueAct(st,'property','buy','acquire');HK.UI.missionFocus='intrigue:property';HK.UI.setTab('missions');});
 assert((await page.locator('.work-duration').innerText()).includes('4 Tage'));await page.locator('[data-action=intrigueact][data-choice=upgrade]').click();assert.equal(await page.locator('.work-order').count(),1);assert(await page.locator('[data-action=intrigueact][data-choice=upgrade]').isDisabled());
 await page.evaluate(()=>{const st=HK.state,w=st.works.active[0];st.day=w.due-1;HK.tick(st);HK.UI.renderAll();});assert.equal(await page.evaluate(()=>HK.state.intrigue.property.phase),'use');assert.equal(await page.locator('.work-order').count(),0);
 for(const lang of ['de','en'])for(const width of [1500,390,320]){await page.setViewportSize({width,height:1100});await page.evaluate(lang=>{HK.setLang(lang);const st=HK.state;if(!st.works.active.length)HK.expandWarehouse(st);HK.UI.setTab('planning');},lang);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert(!/undefined|NaN|workTitle|workDue/.test(await page.locator('#side').innerText()));const overflow=await page.locator('.work-plan').evaluate(el=>el.scrollWidth>el.clientWidth+1);assert(!overflow);}
 await page.evaluate(()=>{HK.setLang('de');HK.UI.panel='shipyard';HK.UI.setTab('place');});assert(!/undefined|NaN/.test(await page.locator('#side').innerText()));
 // Every construction entry point exposes a duration, including council and church.
 for(const panel of ['townhall','church','workshop','house','venture','burgher','shipyard']){
  await page.evaluate(panel=>{const st=HK.state,u=HK.UI;st.money=200000;u.plot=0;u.burgher=Object.keys(st.burghers)[0];st.burghers[u.burgher].owner='player';st.burghers[u.burgher].level=1;st.burghers[u.burgher].damaged=false;st.houses[0].owner='player';st.houses[0].level=1;st.houses[0].damaged=false;u.venture='tannery';st.ventures.tannery={level:1};if(!st.ownShips.length)HK.buyShip(st,'kogge');st.ownShips[0].hull=60;HK.Scene.selected='tannery';u.panel=panel;u.setTab('place');},panel);
  assert(!/undefined|NaN/.test(await page.locator('#side').innerText()),panel);
  assert(await page.locator('.work-duration').count(),panel+' duration');
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',warehouseQueued:true,cancellation:true,saveReload:true,storyCompletion:true,languages:2,widths:3,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
