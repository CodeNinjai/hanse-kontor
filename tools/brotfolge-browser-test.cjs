'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1500,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);await page.locator('#new-game-form button[type=submit]').click();
 await page.evaluate(()=>{
  HK.loop=()=>{};HK.setSpeed(0);HK.UI.lehrgangAktion('zu');const s=HK.state;s.day=64;s.money=20000;s.influence=30;HK.breadInit(s);const B=s.breadStory;Object.assign(B,{phase:'done',ending:'account',solution:'warrant',dirty:false,finished:50,review:{day:50,stock:s.town.stock.grain,threshold:0,relief:0},history:[],cash:0,basis:0,support:1,supportUntil:170,supportGeneration:s.family.generation});B.followup={version:1,status:'scheduled',availableAt:64,history:[],previous:'warrant',dirty:false,factions:{...s.factions}};HK.breadSync(s);HK.UI.missionFocus='bread';HK.UI.setTab('missions');
 });
 assert.equal(await page.locator('.bread-followup').count(),1);assert.equal(await page.evaluate(()=>HK.state.breadStory.followup.status),'offer');
 const pure=await page.evaluate(()=>{const before=JSON.stringify(HK.state);HK.UI.breadPanel();HK.breadFollowupQuote(HK.state,'church','offer');return JSON.stringify(HK.state)===before;});assert(pure,'follow-up rendering/quote changed state');
 for(const lang of ['de','en'])for(const width of [1500,390,320]){
  await page.setViewportSize({width,height:1100});await page.evaluate(lang=>{HK.setLang(lang);HK.UI.renderAll();document.querySelectorAll('.bread-story details').forEach(d=>d.open=false);},lang);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'document overflow '+lang+' '+width);
  assert(await page.locator('.bread-story').evaluate(el=>el.scrollWidth<=el.clientWidth+2),'story overflow '+lang+' '+width);
  const copy=await page.locator('.bread-story').innerText();assert(!/bread[A-Z_]\w*|undefined|NaN/.test(copy),'missing copy '+lang);
 }
 await page.setViewportSize({width:1500,height:1100});await page.evaluate(()=>{HK.setLang('de');HK.UI.renderAll();const side=document.querySelector('#side');side.scrollTop=side.scrollHeight;document.querySelectorAll('.bread-story details').forEach(d=>d.open=false);});
 await page.locator('.bread-followup').screenshot({path:'/tmp/hanse-brotfolge-offer-desktop.png'});
 await page.setViewportSize({width:390,height:1100});await page.evaluate(()=>{HK.UI.renderAll();document.querySelector('#side').scrollTop=document.querySelector('#side').scrollHeight;});
 await page.locator('.bread-followup').screenshot({path:'/tmp/hanse-brotfolge-offer-390.png'});
 await page.locator('[data-action=breadfollow][data-choice=church][data-status=offer]').click();assert.equal(await page.evaluate(()=>HK.state.breadStory.followup.status),'active');
 const activeCopy=await page.locator('.bread-followup').innerText();assert(/10 Last|8 Last|12 Last/.test(activeCopy),'active duty quantity missing');assert(activeCopy.includes('Folgen bei der Ratsberatung'),'withdrawal timing label missing');
 await page.evaluate(()=>{HK.autosave();HK.loadGame();HK.setSpeed(0);HK.UI.missionFocus='bread';HK.UI.setTab('missions');});assert.equal(await page.evaluate(()=>HK.state.breadStory.followup.pledge),'church');
 await page.evaluate(()=>{HK.setLang('en');HK.UI.renderAll();});const activeEnglish=await page.locator('.bread-followup').innerText();assert(activeEnglish.includes('Church aid'));assert(activeEnglish.includes('Effects at the council review'));await page.evaluate(()=>{HK.setLang('de');HK.UI.renderAll();});
 assert(await page.locator('.bread-story').evaluate(el=>el.scrollWidth<=el.clientWidth+2),'active 390 overflow');await page.locator('.bread-followup').screenshot({path:'/tmp/hanse-brotfolge-active-390.png'});
 await page.evaluate(()=>{const s=HK.state,F=s.breadStory.followup;HK.withQuality(94,()=>HK.addStock(s.warehouse.stock,'grain',F.terms.church.qty));HK.UI.renderAll();});
 assert(await page.locator('[data-action=breadfollow][data-choice=fulfill]').isEnabled());await page.locator('[data-action=breadfollow][data-choice=fulfill]').click();
 assert.equal(await page.evaluate(()=>HK.state.breadStory.followup.status),'reaction');assert((await page.locator('.bread-followup').innerText()).includes('berät'));
 await page.evaluate(()=>{const s=HK.state,F=s.breadStory.followup;s.day=F.reaction.at;HK.breadSync(s);HK.UI.renderAll();});assert.equal(await page.evaluate(()=>HK.state.breadStory.followup.status),'resolved');assert(await page.locator('.bread-story').evaluate(el=>el.scrollWidth<=el.clientWidth+2),'reaction 390 overflow');
 const final=await page.locator('.bread-followup').innerText();assert(final.includes('erfüllt'));assert(final.includes('Wahlunterstützung'));
 await page.evaluate(()=>{document.querySelectorAll('.toast,.toast-message,[role=status]').forEach(e=>e.remove());document.querySelector('#side').scrollTop=document.querySelector('#side').scrollHeight;});
 await page.locator('.bread-followup').screenshot({path:'/tmp/hanse-brotfolge-reaction-desktop.png'});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',offer:true,active:true,reaction:true,persistence:true,pureViews:pure,languages:2,widths:[1500,390,320],errors,screenshots:['/tmp/hanse-brotfolge-offer-desktop.png','/tmp/hanse-brotfolge-offer-390.png','/tmp/hanse-brotfolge-active-390.png','/tmp/hanse-brotfolge-reaction-desktop.png']}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
