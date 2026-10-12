'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1600,height:1100},locale:'de-DE'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);await page.locator('#new-game-form button[type=submit]').click();await page.evaluate(()=>{HK.loop=()=>{};HK.state.speed=0;HK.UI.setTab('missions');});
 assert.deepEqual(await page.evaluate(()=>HK.UI.missionRecords().map(r=>r.kind)),['intro']);assert.equal(await page.evaluate(()=>HK.state.post.messages.length),1);
 await page.locator('[data-action=introexplore]').click();assert(await page.locator('[data-mission=salt]').count());assert.equal(await page.evaluate(()=>HK.state.lehrgang.schritt),0);
 const id=await page.evaluate(()=>{const st=HK.state;HK.startSaltStory(st);const c=HK.saltContract(st);const v=st.ships[0];v.cargo.salt={qty:20,price:40,quality:100};HK.UI.missionFocus='salt';HK.UI.setTab('missions');return c.id;});
 await page.locator('[data-action=missionsources]').click();const before=await page.evaluate(()=>HK.state.money);
 await page.locator('[data-action=missionsupplier]').first().click();assert.equal(await page.evaluate(()=>HK.UI.panel),'harbour');assert.equal(await page.evaluate(()=>HK.state.money),before);
 await page.evaluate(id=>HK.UI.action({action:'missionsources',id}),id);
 for(const width of [1600,390,320])for(const lang of ['de','en']){
  await page.setViewportSize({width,height:1100});await page.evaluate(lang=>{HK.setLang(lang);HK.UI.renderAll();},lang);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal(await page.locator('[data-action=planbuy],[data-action=saltbuy],[data-action=tradeadvance]').count(),0);
  for(const card of await page.locator('.mission-source').all()){const box=await card.boundingBox();assert(box.x>=0&&box.x+box.width<=width+1);}
 }
 await page.setViewportSize({width:1600,height:1100});await page.evaluate(()=>{HK.setLang('de');HK.UI.sceneClick({kind:'town-event',story:true});});assert.equal(await page.evaluate(()=>HK.UI.panel),'saltmeeting');assert(await page.locator('[data-action=saltdeliver][data-choice=business]').isDisabled());
 await page.screenshot({path:'/tmp/hanse-wessel-quay.png'});
 // The goods source list includes real local producers, and visiting them preserves the quote/economy.
 await page.evaluate(()=>{const st=HK.state;st.contracts.active=[];const c={id:st.contracts.nextId++,giver:'council',type:'deliver',good:'grain',qty:18,reward:756,price:42,deadline:st.day+12};st.contracts.active.push(c);HK.UI.action({action:'missionsources',id:c.id});});
 await page.locator('[data-action=ruralopen][data-site=grainfarm]').click();assert.equal(await page.evaluate(()=>HK.Scene.selected),'grainfarm');assert.equal(await page.evaluate(()=>HK.UI.panel),'rural');
 // Confirm a complete delivery only after visiting the actual council location.
 const cid=await page.evaluate(()=>{const c=HK.state.contracts.active[0];HK.state.warehouse.stock.grain=18;HK.UI.missionFocus=null;HK.UI.setTab('missions');return c.id;});
 await page.locator(`[data-action=missionvisit][data-id="${cid}"]`).click();assert.equal(await page.evaluate(()=>HK.Scene.selected),'townhall');assert.equal(await page.evaluate(()=>HK.UI.panel),'missionhandover');
 const cash=await page.evaluate(()=>HK.state.money);await page.locator(`[data-action=delivercontract][data-id="${cid}"]`).click();assert.equal(await page.evaluate(()=>HK.state.money),cash+756);assert.equal(await page.evaluate(()=>(HK.state.warehouse.stock.grain||0)),0);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',quietStart:true,freeExploration:true,supplierMapVisits:true,ruralMapVisit:true,wesselMapClick:true,recipientHandover:true,widths:3,languages:2,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
