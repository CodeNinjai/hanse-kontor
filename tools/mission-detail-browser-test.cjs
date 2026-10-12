'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try {
  const page=await browser.newPage({viewport:{width:1600,height:1200},locale:'de-DE'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);
  await page.locator('#new-game-form button[type=submit]').click();
  await page.evaluate(()=>{
   HK.loop=()=>{};const st=HK.state;st.speed=0;HK.UI.lehrgangAktion('zu');
   HK.startSaltStory(st);st.warehouse.stock.salt=32;HK.saltDeliver(st);HK.saltFollow(st,true);
   st.warehouse.stock.smokedfish=0;st.town.stock.smokedfish=100;st.town.quality.smokedfish=100;st.money=10000;
   const quote=HK.marketBuyPrice;HK.marketBuyPrice=(st,g,q)=>g==='smokedfish'?170:quote(st,g,q);
   HK.UI.missionFocus='salt';HK.UI.setTab('missions');
  });
  assert.match(await page.locator('.salt-outcome').textContent(),/Voraussichtlicher Verlust.*−480 Mark/s);
  assert.match(await page.locator('.salt-next').textContent(),/8 Last Räucherfisch.*Wessel/s);
  assert.equal(await page.locator('.salt-main-actions .primary').getAttribute('data-action'),'missionsources');
  assert.equal(await page.locator('.salt-numbers').getAttribute('open'),null);
  assert.equal(await page.locator('.salt-context').getAttribute('open'),null);
  assert.equal(await page.locator('.salt-receipt').getAttribute('open'),null);
  assert.equal(await page.locator('[data-action=saltdeliver],[data-action=saltbuy],[data-action=planbuy],[data-action=tradeadvance]').count(),0);
  for(const width of [1600,390,320]) {
   await page.setViewportSize({width,height:1200});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.locator('.salt-order').screenshot({path:`/tmp/hanse-mission-detail-${width}.png`});
  }
  await page.setViewportSize({width:1600,height:1200});
  const money=await page.evaluate(()=>HK.state.money);
  await page.locator('.salt-main-actions [data-action=missionsources]').click();
  assert.equal(await page.evaluate(()=>HK.UI.panel),'missionsources');assert.equal(await page.evaluate(()=>HK.state.money),money);
  assert.equal(await page.locator('[data-action=mbuy],[data-action=planbuy]').count(),0);
  await page.locator('[data-action=warehousetrade][data-good=smokedfish]').click();
  assert.equal(await page.evaluate(()=>HK.UI.panel),'market');assert.equal(await page.evaluate(()=>HK.Scene.selected),'market');
  await page.locator('[data-field=qty]').fill('8');await page.locator('[data-action=mbuy]').click();
  await page.locator('#tabs [data-tab=missions]').click();
  assert.equal(await page.evaluate(()=>HK.state.money),money-1360);
  assert.equal(await page.locator('.salt-main-actions .primary').getAttribute('data-action'),'saltmeet');
  assert.match(await page.locator('.salt-outcome').textContent(),/−480 Mark/);
  assert.match(await page.locator('.salt-next').textContent(),/Wessel am Kai/);
  await page.evaluate(()=>{HK.state.warehouse.quality.smokedfish=75;HK.UI.renderAll();});
  assert.match(await page.locator('.salt-next').textContent(),/Qualität|Warenqualität/);
  await page.locator('[data-action=saltmeet]').click();assert.equal(await page.evaluate(()=>HK.UI.panel),'saltmeeting');
  assert(await page.locator('[data-action=saltdeliver][data-choice=business]').isDisabled());
  await page.evaluate(()=>{HK.state.warehouse.quality.smokedfish=100;HK.UI.renderAll();});
  await page.locator('[data-action=saltdeliver][data-choice=business]').click();
  assert.equal(await page.evaluate(()=>HK.state.money),money-480);
  assert.equal(await page.evaluate(()=>HK.state.saltStory.receipts.at(-1).contribution),-480);
  await page.evaluate(()=>{
   const st=HK.state=HK.newGame({name:'Lieferung',difficulty:'normal',years:20});st.speed=0;HK.startSaltStory(st);
   const inc=HK.saltIncoming(st);HK.reserveTradeSupply(st,inc.id,24);HK.UI.missionFocus='salt';HK.UI.setTab('missions');
  });
  assert.match(await page.locator('.salt-transit-note').textContent(),/24 Last.*bezahlt.*zusätzliche Ware/s);
  assert.equal(await page.locator('[data-action=saltbuy],[data-action=tradeadvance]').count(),0);
  await page.locator('[data-help=saltProfitHelp]>summary').click();
  assert.match(await page.locator('[data-help=saltProfitHelp] .context-help-body').textContent(),/zusätzlichen Ersatzkauf/);
  await page.evaluate(()=>{HK.setLang('en');});
  assert.match(await page.locator('.salt-outcome').textContent(),/Estimated (profit|loss)/);
  assert.match(await page.locator('.salt-next').textContent(),/prepaid delivery/);
  assert(await page.evaluate(()=>{const before=HK.serialize(HK.state);HK.UI.saltStoryPanel();return before===HK.serialize(HK.state);}));
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({result:'PASS',lossPreview:480,actualLoss:480,clearNextAction:true,qualityGate:true,prepaidWarning:true,collapsedDetails:true,widths:3,languages:2,errors}));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
