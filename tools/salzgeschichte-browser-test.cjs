/* NODE_PATH=/tmp/hanse-browser/node_modules node tools/salzgeschichte-browser-test.cjs */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const shots='/tmp/hanse-map-audit';fs.mkdirSync(shots,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1050},locale:'de-DE'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{let seed=42;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);});
  await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);
  await page.locator('#new-game-form button[type=submit]').click();await page.evaluate(()=>{HK.loop=()=>{};HK.UI.lehrgangAktion('zu');HK.state.speed=0;});
  await page.locator('#tabs [data-tab=missions]').click();await page.locator('[data-action=missionfocus][data-value=salt]').click();assert.equal(await page.locator('.salt-story').getAttribute('data-salt-phase'),'offer');
  await page.locator('[data-action=saltstart]').click();assert.equal(await page.evaluate(()=>HK.saltContract(HK.state).deadline),4);
  assert(await page.locator('.salt-people').textContent().then(s=>s.includes('Ludeke Horn')&&s.includes('Jakob Wessel')),'Named people missing');
  await page.locator('.salt-story').screenshot({path:shots+'/salt-story-decisions.png'});
  const before=await page.evaluate(()=>({money:HK.state.money,cost:HK.saltProjection(HK.state).cost}));
  await page.locator('.salt-options>summary').click();await page.locator('[data-action=saltchoice][data-choice=pact]').click();assert.equal(await page.evaluate(()=>HK.state.money),before.money-120);
  await page.locator('[data-action=saltbuy]').click();assert.equal(await page.evaluate(()=>HK.state.warehouse.stock.salt),32);
  assert.equal(await page.evaluate(()=>HK.state.money),before.money-120-before.cost);
  const old=await page.evaluate(()=>({money:HK.state.money,basis:HK.state.saltStory.costs.salt.value,mood:HK.state.cityLife.mood}));
  await page.locator('[data-action=saltdeliver][data-choice=community]').click();assert.equal(await page.evaluate(()=>HK.state.money),old.money+1920);
  assert.equal(await page.locator('.salt-story').getAttribute('data-salt-phase'),'followOffer');
  assert.equal(await page.evaluate(()=>HK.state.saltStory.receipts[0].contribution),1920-old.basis-120);
  assert.equal(await page.evaluate(()=>HK.state.cityLife.mood),old.mood+6);
  await page.evaluate(()=>{HK.state=HK.deserialize(HK.serialize(HK.state));HK.UI.renderAll();});
  assert(await page.locator('.salt-receipt').textContent().then(s=>s.includes('Abgerechnetes Geschäft')),'Saved receipt missing');
  await page.locator('[data-action=saltfollow][data-choice=accept]').click();await page.locator('[data-action=saltbuy]').click();
  await page.evaluate(()=>{HK.state.warehouse.quality.smokedfish=75;HK.UI.renderAll();});
  assert(await page.locator('[data-action=saltdeliver]').isDisabled(),'Low quality delivery is not disabled');
  await page.evaluate(()=>{HK.state.warehouse.quality.smokedfish=100;HK.UI.renderAll();});await page.locator('[data-action=saltdeliver]').click();
  assert.equal(await page.locator('.salt-story').getAttribute('data-salt-phase'),'done');assert.equal(await page.locator('.salt-receipt').count(),2);
  await page.evaluate(()=>{
   HK.state=HK.newGame({name:'Karte',difficulty:'normal',years:20});HK.startSaltStory(HK.state);
   HK.state.cityLife.stories=['guildFair','dockStrike','highWater','herringRun'].map((type,i)=>({id:i,type,start:0,end:8,activated:true,respondBy:2}));
   HK.Scene.clock=.5;HK.Scene.weather='clear';HK.Scene.time=10;HK.Scene.snapShips();HK.UI.missionFocus='salt';HK.UI.renderAll();HK.Scene.draw();
  });
  const map=await page.evaluate(()=>{
   const st=HK.state,S=HK.Scene,items=S.buildItems(null,st,'spring',10);
   return {events:items.filter(i=>i.townEvent).map(i=>i.townEvent),actors:items.filter(i=>i.townEventActor).length};
  });assert.equal(map.events.length,4);assert.equal(map.actors,5);
  const reused=await page.evaluate(()=>{const P=HK.PixiScene;HK.Scene.draw();const before=new Map([...P.cache].filter(([k])=>k.startsWith('town-event:')).map(([k,e])=>[k,e.g]));HK.Scene.draw();return {count:before.size,reused:[...before].every(([k,g])=>P.cache.get(k)?.g===g)};});
  assert(reused.reused&&reused.count>0,'Event geometry is rebuilt each frame');
  const target=await page.evaluate(()=>{
    const S=HK.Scene;S.zeigeAuf(23.9,19.8);S.setZoom(3);S.draw();S.renderPick();
    const p=HK.Iso.p(24,19.835,.79),h=S.hit(p[0],p[1],true);
    return {kind:h?.kind,x:(p[0]-S.cam.x)*S.cam.z,y:(p[1]-S.cam.y)*S.cam.z};
  });assert.equal(target.kind,'town-event','Visible quay sign cannot be selected');
  const canvas=await page.locator('#scene').boundingBox();const size=await page.evaluate(()=>HK.SCENE);
  await page.mouse.click(canvas.x+target.x*canvas.width/size.W,canvas.y+target.y*canvas.height/size.H);
  assert(await page.locator('.city-life').isVisible(),'Map sign does not open town bulletin');
  await page.screenshot({path:shots+'/salt-town-events.png',fullPage:true});
  await page.evaluate(()=>{HK.UI.missionFocus=null;});await page.locator('#tabs [data-tab=missions]').click();await page.locator('[data-action=missionfocus][data-value=salt]').click();await page.locator('#side .lang-btn[data-lang=en]').click();assert.match(await page.locator('.salt-story').textContent(),/The salt of Lüneburg/);
  assert(!(await page.locator('.salt-story').textContent()).includes('saltTerms_'),'Untranslated story key');
  await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile overflow');
  await page.locator('.salt-story').screenshot({path:shots+'/salt-story-mobile.png'});
  const pure=await page.evaluate(()=>{const st=HK.state,s=HK.serialize(st);HK.UI.saltStoryPanel();HK.cityMapEvents(st);return s===HK.serialize(st);});assert(pure,'UI mutates simulation');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',orders:2,saveLoad:true,community:true,map,cacheReused:reused.reused,languages:2,mobile:true,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
