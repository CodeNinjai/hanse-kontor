'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await b.newPage({viewport:{width:1500,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);await page.locator('#new-game-form button[type=submit]').click();
 await page.evaluate(()=>{HK.loop=()=>{};HK.setSpeed(0);HK.UI.lehrgangAktion('zu');HK.UI.panel='tavern';HK.UI.setTab('place');});
 const before=await page.evaluate(()=>HK.state.money);await page.locator('[data-action=opportunityreport]').first().click();assert.equal(await page.evaluate(()=>HK.state.money),before-25);assert(await page.locator('.opportunity-card').count());
 await page.locator('[data-action=opportunityreserve]').first().click();assert.equal(await page.evaluate(()=>HK.state.tradePlanning.advances.length),1);
 await page.evaluate(()=>{HK.state.saltStory.phase='done';HK.clothSync(HK.state);HK.UI.setTab('missions');});await page.locator('[data-action=clothopen]').click();assert.equal(await page.locator('.cloth-choices .trade-supply').count(),2);
 for(const lang of ['de','en'])for(const width of [1500,390,320]){
  await page.setViewportSize({width,height:1100});await page.evaluate(lang=>{HK.setLang(lang);HK.UI.renderAll();},lang);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page overflows '+lang+width);
  assert(await page.locator('.cloth-story').evaluate(el=>el.scrollWidth<=el.clientWidth+2),'story overflows '+lang+width);
 }
 await page.setViewportSize({width:1500,height:1100});await page.evaluate(()=>{HK.setLang('de');HK.UI.renderAll();});
 await page.screenshot({path:'/tmp/hanse-bruegger-tuch.png'});
 await page.locator('[data-action=clothstart][data-choice=fine]').click();assert(await page.locator('.cloth-story [data-action=delivercontract]').isDisabled());
 const purity=await page.evaluate(()=>{const snapshot=JSON.stringify(HK.state);HK.UI.clothPanel();HK.UI.opportunityPanel();HK.UI.missionRecords();return snapshot===JSON.stringify(HK.state);});assert(purity);
 await page.locator('.cloth-story [data-action=tradeadvance]').click();
 await page.evaluate(()=>{const s=HK.state,i=s.incoming.find(i=>i.clothStory);s.ships=[];if(!HK.dockShip(s,i.origin,i))throw Error('Dock failed');s.incoming=s.incoming.filter(x=>x!==i);HK.UI.renderAll();});
 assert.equal(await page.evaluate(()=>HK.goodQuality(HK.state,'cloth')),112);await page.locator('.cloth-story [data-action=delivercontract]').click();assert.equal(await page.evaluate(()=>HK.state.tradingStories.cloth.phase),'returnOffer');
 await page.locator('[data-action=clothreturn][data-choice=accept]').click();await page.evaluate(()=>{const s=HK.state,c=HK.clothContract(s);HK.withQuality(100,()=>HK.addStock(s.warehouse.stock,c.good,c.qty,500));HK.UI.renderAll();});
 await page.locator('.cloth-story [data-action=delivercontract]').click();assert.equal(await page.evaluate(()=>HK.state.tradingStories.cloth.ending),'roundTrip');
 await page.evaluate(()=>{HK.UI.missionFocus=null;HK.UI.missionFilter='finished';HK.UI.setTab('missions');});assert.equal(await page.locator('[data-mission=cloth]').count(),1);
 const result=await page.evaluate(()=>{const s=JSON.parse(JSON.stringify(HK.state));HK.migrate(s);return{receipts:s.tradingStories.cloth.receipts.length,phase:s.tradingStories.cloth.phase,chapterCards:HK.UI.missionRecords().filter(r=>r.kind==='cloth').length,duplicatedContracts:HK.UI.missionRecords().filter(r=>r.value?.clothStory).length};});
 assert.equal(result.receipts,2);assert.equal(result.duplicatedContracts,0);
 // Letters remain usable and show the same terms; help opens from the chapter.
 await page.evaluate(()=>{HK.UI.postSelected=HK.state.post.messages.find(m=>m.type==='opportunity').id;HK.UI.setTab('mail');});assert(await page.locator('.post-letter .opportunity-card').count());
 await page.evaluate(()=>{HK.UI.missionFocus='cloth';HK.UI.setTab('missions');});await page.locator('[data-help=clothHelp] summary').click();assert.match(await page.locator('[data-help=clothHelp]').innerText(),/Durchschnittsgüte/);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',...result,pureViews:purity,widths:3,languages:2,errors}));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
