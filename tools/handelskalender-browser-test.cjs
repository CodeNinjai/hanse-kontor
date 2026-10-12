'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1800,height:1100},locale:'de-DE'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.HK_URL||'http://localhost:8778');await page.waitForFunction(()=>HK.PixiScene.bereit);await page.locator('#new-game-form button[type=submit]').click();
 await page.evaluate(()=>{HK.state.speed=0;HK.UI.setTab('planning');});
 assert.equal(await page.locator('.calendar-card.current').count(),1);assert.match(await page.locator('.calendar-card.current').textContent(),/Fastenzeit/);
 assert.equal(await page.locator('.calendar-rumour').count(),1);assert.equal(await page.locator('.calendar-rumour .calendar-good').count(),0);
 assert.match(await page.locator('.calendar-good.fall').first().textContent(),/−20/);
 const before=await page.evaluate(()=>HK.state.money);await page.locator('[data-action=tradeinfo]').click();assert.equal(await page.evaluate(()=>HK.state.money),before-40);
 assert.equal(await page.locator('.calendar-rumour').count(),0);assert.match(await page.locator('.trade-calendar').textContent(),/65 % Verlässlichkeit/);
 await page.locator('[data-calendar-detail=news-1] summary').click();await page.evaluate(()=>HK.UI.renderAll());assert(await page.locator('[data-calendar-detail=news-1]').evaluate(e=>e.open));
 for(const width of [1800,1000,390,320])for(const lang of ['de','en']){
  await page.setViewportSize({width,height:1100});await page.evaluate(lang=>{HK.setLang(lang);HK.UI.renderAll();},lang);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+width+'/'+lang);
  for(const card of await page.locator('.calendar-card').all()){const b=await card.boundingBox();assert(b.x>=0&&b.x+b.width<=width+1);}
 }
 await page.setViewportSize({width:1800,height:1100});await page.evaluate(()=>HK.setLang('de'));await page.locator('.trade-calendar').screenshot({path:'/tmp/hanse-handelskalender.png'});
 await page.locator('.calendar-good[data-good=fish]').first().click();assert.equal(await page.evaluate(()=>HK.UI.panel),'market');assert.equal(await page.evaluate(()=>HK.UI.marketGood),'fish');
 await page.evaluate(()=>{HK.UI.setTab('planning');const n=HK.state.tradePlanning.news.find(n=>n.type==='pilgrims');n.known=true;n.resolved=true;n.happens=false;HK.UI.renderAll();});
 assert.equal(await page.locator('.calendar-card.cancelled .calendar-good').count(),0);
 await page.locator('.calendar-card[data-calendar-event=news-2] .calendar-visit').click();assert.equal(await page.evaluate(()=>HK.Scene.selected),'harbour');
 assert(await page.evaluate(()=>{const s=HK.serialize(HK.state);HK.UI.tradeCalendarPanel();return s===HK.serialize(HK.state);}));
 assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',chronological:true,rumours:true,infoPurchase:true,deniedEvents:true,mapLinks:true,readOnly:true,languages:2,widths:4,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
