/* NODE_PATH=/tmp/hanse-browser/node_modules node tools/ereignisse-browser-test.cjs */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try {
  const page=await browser.newPage({viewport:{width:1500,height:1000},locale:'de-DE'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);await page.locator('#new-game-form button[type=submit]').click();
  await page.evaluate(()=>{HK.loop=()=>{};HK.UI.lehrgangAktion('zu');const st=HK.state;st.speed=0;st.cityLife.nextStory=100000;st.money=100000;HK.addStock(st.warehouse.stock,'grain',100);HK.announceCityStory(st,'rats',3);HK.announceCityStory(st,'guildFair',4);HK.UI.renderAll();});
  await page.locator('#tabs [data-tab=mail]').click();await page.locator('[data-action=postmode][data-value=world]').click();assert.equal(await page.locator('.city-story').count(),2);assert(await page.locator('.city-mood meter').count());
  assert(await page.locator('.city-story').first().textContent().then(t=>t.includes('6 %')&&t.includes('70 Mark')&&t.includes('36 Tage')),'Consequences and precautions not visible before choice');
  const id=await page.evaluate(()=>HK.state.cityLife.stories.find(e=>e.type==='rats').id),money=await page.evaluate(()=>HK.state.money);
  await page.locator(`[data-story="${id}"] [data-choice=clean]`).click();assert.equal(await page.evaluate(()=>HK.state.money),money-70);assert.equal(await page.locator(`[data-story="${id}"] [data-action=cityresponse]`).count(),0);
  await page.evaluate(()=>{HK.state=HK.deserialize(HK.serialize(HK.state));for(let i=0;i<6;i++)HK.tick(HK.state);HK.UI.renderAll();});
  assert.equal(await page.evaluate(()=>HK.state.warehouse.stock.grain),100,'Saved precautions fail to protect goods');assert(await page.locator('.city-contract').count(),'Special quality contract never shown');
  const offerId=await page.evaluate(()=>HK.state.contracts.offers.find(c=>c.cityStory==='guildFair').id);await page.locator(`[data-contract="${offerId}"] [data-action=acceptcontract]`).click();
  await page.evaluate(()=>{HK.addStock(HK.state.warehouse.stock,'tools',8);HK.state.warehouse.quality.tools=75;HK.UI.renderAll();});
  assert(await page.locator(`[data-contract="${offerId}"] [data-action=delivercontract]`).isDisabled(),'Low-grade delivery is not disabled');
  await page.evaluate(()=>{HK.state.warehouse.quality.tools=110;HK.UI.renderAll();});await page.locator(`[data-contract="${offerId}"] [data-action=delivercontract]`).click();
  assert.equal(await page.evaluate(()=>HK.state.contracts.done),1);assert.equal(await page.locator('.city-contract').count(),0);
  fs.mkdirSync('/tmp/hanse-map-audit',{recursive:true});await page.locator('#sidebar').evaluate(el=>el.scrollTop=0);await page.addStyleTag({content:'.toast { display: none !important; }'});await page.screenshot({path:'/tmp/hanse-map-audit/city-events-desktop.png'});
  // Every story and its response terms render in both languages without side effects.
  for(const lang of ['de','en']) {
   await page.evaluate(lang=>{HK.LANG=lang;HK.UI.renderAll();},lang);
   for(const type of await page.evaluate(()=>Object.keys(HK.CITY_STORIES))) {
    const result=await page.evaluate(type=>{const st=HK.state,previous=st.cityLife.stories;st.cityLife.stories=[{id:999,type,start:st.day+2,end:st.day+10,respondBy:st.day+4,activated:false,choice:null}];const snapshot=HK.serialize(st),html=HK.UI.cityLifePanel(),same=HK.serialize(st)===snapshot;st.cityLife.stories=previous;return{html,same};},type);
    assert(result.same&&result.html.includes('data-story="999"'),'Rendering changes the simulation');assert(!/city(?:Title|Text|Choice)_/.test(result.html),'Translation missing for '+type);
   }
  }
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>HK.UI.renderAll());
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile document overflows');assert(await page.locator('#sidebar').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Mobile panel overflows');
  await page.locator('#sidebar').evaluate(el=>el.scrollTop=0);await page.screenshot({path:'/tmp/hanse-map-audit/city-events-mobile.png'});
  await page.locator('#city-links [data-place=market]').click();assert(await page.locator('.market-quality .quality-badge').count(),'Market quality invisible');
  await page.locator('#city-links [data-place=kontor]').click();await page.locator('[data-action=businessplace][data-building=warehouse]').click();assert(await page.locator('.warehouse-good .quality-badge').count(),'Warehouse quality invisible');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',stories:23,languages:2,precautions:'saved and applied',qualityContract:'rejected then fulfilled',mobile:true,errors}));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
