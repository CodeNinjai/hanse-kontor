'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try {
  const page=await browser.newPage({viewport:{width:1600,height:1050},locale:'de-DE'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.HK_URL||'http://localhost:8778/');
  await page.waitForFunction(()=>HK.PixiScene.bereit);
  await page.locator('#new-game-form button[type=submit]').click();
  await page.evaluate(()=>{
   HK.loop=()=>{};const st=HK.state;st.speed=0;
   st.lehrgang.fertig=true;st.lehrgang.schritt=9;st.lehrgang.finished=st.day;
   st.chapters.step=1;st.warehouse.stock.grain=0;st.contracts.active=[];
   HK.startSaltStory(st);st.warehouse.stock.salt=32;HK.saltDeliver(st);HK.saltFollow(st,true);
   st.warehouse.stock.smokedfish=0;st.warehouse.stock.furs=0;
   st.contracts.active.push({id:90001,type:'deliver',giver:'council',good:'furs',qty:20,reward:5280,deadline:st.day+30});
   st.contracts.offers=[{id:90002,type:'deliver',giver:'guild',good:'beer',qty:10,reward:800,days:10,expires:st.day+3}];
   HK.UI.missionFocus=null;HK.UI.missionFilter='active';HK.UI.setTab('missions');
  });
  assert.equal(await page.locator('.mission-list>.mission-card').count(),3);
  assert.equal(await page.locator('[data-mission-count=active]').textContent(),'3');
  assert.equal(await page.locator('#mission-badge').textContent(),'3');
  assert.equal(await page.locator('[data-mission-count=available]').textContent(),'1');
  assert.equal(await page.locator('[data-mission-count=finished]').textContent(),'1','Salt milestone is not a completed whole story');
  for(const width of [1600,1024,390,320]) {
   await page.setViewportSize({width,height:1050});
   const boxes=await page.locator('.mission-list>.mission-card').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,w:r.width};}));
   assert(boxes.every(b=>Math.abs(b.x-boxes[0].x)<1&&Math.abs(b.w-boxes[0].w)<1),'Cards must share one width and column');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow');
   assert.equal(await page.locator('.mission-list .mission-heading').count(),3);
   if(width===1600){await page.setViewportSize({width,height:2300});await page.locator('.mission-list').screenshot({path:'/tmp/hanse-missions-1600.png'});}
   if(width===390)await page.locator('[data-mission=chapters]').screenshot({path:'/tmp/hanse-missions-390.png'});
  }
  await page.setViewportSize({width:1600,height:1050});
  const chapter=page.locator('[data-mission=chapters]');
  assert.match(await chapter.locator('.mission-next').textContent(),/12 Last Getreide fehlen/);
  assert(await chapter.locator('[data-choice=contract]').isDisabled());
  await chapter.locator('[data-action=warehousetrade]').click();
  assert.deepEqual(await page.evaluate(()=>[HK.UI.panel,HK.UI.marketGood]),['market','grain']);
  await page.evaluate(()=>{HK.state.warehouse.stock.grain=12;HK.UI.setTab('missions');});
  const money=await page.evaluate(()=>HK.state.money);
  await chapter.locator('[data-choice=contract]').click();
  assert.equal(await page.evaluate(()=>HK.state.chapters.step),2);
  assert.equal(await page.evaluate(()=>HK.state.warehouse.stock.grain||0),0);
  assert.equal(await page.evaluate(()=>HK.state.money),money+432);
  await page.evaluate(()=>{HK.state.warehouse.stock.smokedfish=8;HK.state.warehouse.quality.smokedfish=50;HK.UI.renderAll();});
  assert.match(await page.locator('[data-mission=salt] .mission-next').textContent(),/Qualität|Warenqualität/);
  await page.locator('[data-action=missionfilter][data-value=available]').click();
  assert.equal(await page.locator('.mission-list>.mission-card').count(),1);
  await page.locator('[data-action=missionfilter][data-value=finished]').click();
  assert.equal(await page.locator('.mission-list>.mission-card').count(),1);
  assert.equal(await page.locator('.intro-mission.done').count(),1);
  await page.locator('[data-action=missionfilter][data-value=all]').click();
  assert.equal(await page.locator('.mission-list>.mission-card').count(),4);
  await page.evaluate(()=>{HK.state.contracts.offers=[];HK.UI.missionFilter='available';HK.UI.renderAll();});
  assert.match(await page.locator('.mission-empty').textContent(),/keine neuen Angebote/);
  await page.evaluate(()=>{HK.setLang('en');HK.UI.missionFilter='active';HK.UI.renderAll();});
  assert.match(await page.locator('[data-mission=chapters] .mission-meta').textContent(),/Trading letters/);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({result:'PASS',consistentCards:3,widths:4,counts:true,filters:true,chapterDelivery:true,qualityHint:true,languages:2,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
