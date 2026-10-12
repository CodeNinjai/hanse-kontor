'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);await page.locator('#new-game-form button[type=submit]').click();
 const result=await page.evaluate(()=>{
  const S=HK.Scene,R=HK.PixiScene;HK.setSpeed(0);S.clock=.5;S.weather='clear';S.zeigeAuf(13.1,7.7);S.cam.z=3;
  const at=HK.Iso.p(13.1,7.7,.3);S.cam.x=at[0]-HK.SCENE.W/(2*S.cam.z);S.cam.y=at[1]-HK.SCENE.H/(2*S.cam.z);S.camAuto=false;
  S.draw();const before=R.cache.get('ms0'),stock=HK.state.town.stock.grain;
  HK.state.town.stock.grain=0;S.draw();const empty=R.cache.get('ms0');
  if(empty===before||empty.revision===before.revision)throw Error('Sold-out stall retains its full display');
  HK.state.town.stock.grain=stock;S.draw();
  const items=[];S.cityItems(items,HK.state,'summer',S.time);
  const vendors=items.filter(it=>it.cityVendor!==undefined),customers=items.filter(it=>it.marketCustomer!==undefined);
  if(vendors.length!==6||customers.length!==6)throw Error('Market is empty');
  S.renderPick();
  HK.marketBuy(HK.state,'grain',3);S.updateFreight(0);
  const courier=S.porters.find(w=>w.freightJob?.kind==='market');
  if(!courier||courier.path.at(-1)!=='WH')throw Error('Purchase does not reach warehouse');
  HK.UI.sceneClick(S.freightPick(courier));
  if(HK.UI.panel!=='warehouse')throw Error('Courier opens wrong destination');
  for(const lang of ['de','en']){HK.setLang(lang);const route=HK.localTransport(HK.state,'warehouse','windmill','grain',3);if(!HK.UI.freightRows().includes(HK.freightBuildingName('windmill')))throw Error('Production route missing from receipt');}
  HK.setLang('de');return{vendors:vendors.length,customers:customers.length,stockCache:true,courierClick:true,receiptLanguages:2};
 });
 await page.locator('#scene').screenshot({path:'/tmp/logistics-market-day.png'});
 await page.evaluate(()=>{HK.Scene.weather='rain';HK.Scene.draw();});await page.locator('#scene').screenshot({path:'/tmp/logistics-market-rain.png'});
 const closed=await page.evaluate(()=>{const S=HK.Scene;S.clock=.95;const items=[];S.cityItems(items,HK.state,'summer',S.time);S.draw();return !items.some(it=>it.marketCustomer!==undefined||it.cityVendor!==undefined);});assert(closed);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',...result,nightClosed:closed,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
