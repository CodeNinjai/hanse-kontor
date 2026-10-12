'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1500,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);await page.locator('#new-game-form button[type=submit]').click();
 await page.evaluate(()=>{HK.loop=()=>{};HK.setSpeed(0);HK.UI.lehrgangAktion('zu');const s=HK.state;s.day=35;s.money=20000;s.influence=40;Object.assign(s.breadStory,{phase:'done',finished:30,ending:'account'});HK.shoreSync(s);for(const g of ['timber','stone','tools'])HK.withQuality(100,()=>HK.addStock(s.warehouse.stock,g,25,25*HK.GOOD[g].base));HK.UI.setTab('missions');});
 assert.equal(await page.locator('[data-mission=shore-main]').count(),1);await page.locator('[data-mission=shore-main] [data-action=shoreopen]').click();
 const check=async()=>{for(const lang of ['de','en'])for(const width of [1500,390,320]){
  await page.setViewportSize({width,height:1100});await page.evaluate(lang=>{HK.setLang(lang);HK.UI.renderAll();document.querySelectorAll('.shore-story details').forEach(el=>el.open=true);},lang);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'viewport '+lang+width);
  assert(await page.locator('.shore-story').evaluate(el=>el.scrollWidth<=el.clientWidth+2),'story overflow '+lang+width);
  assert(!/shore[A-Z_]\w*|undefined|NaN/.test(await page.locator('.shore-story').innerText()),'missing copy '+lang);
 }};
 const click=choice=>page.locator('.shore-story [data-choice='+choice+']').click();
 await check();await click('start');await check();
 await page.evaluate(()=>{HK.state.day=HK.state.shoreStory.surveyAt;HK.shoreSync(HK.state);HK.UI.renderAll();});await check();await click('bank');await check();await click('sponsor');
 assert(await page.locator('[data-choice=guild]').isDisabled());await page.locator('.shore-story [data-action=shoreopen][data-quest=neighbours]').click();await check();await click('hours');await page.locator('.shore-story [data-action=shoreopen][data-quest=main]').click();await check();
 const pure=await page.evaluate(()=>{const b=JSON.stringify(HK.state);HK.UI.shorePanel('main');HK.UI.missionRecords();return b===JSON.stringify(HK.state);});assert(pure);
 await page.evaluate(()=>HK.state.shoreStory.seed=1);await click('cheap');await check();
 // Static scene integration creates a pickable notice and routes its click to the mission.
 const markers=await page.evaluate(()=>{const items=[];HK.Scene.cityItems(items,HK.state,HK.Scene.season(),0);return items.filter(i=>i.c==='shore-project').map(i=>({box:i.box,pick:i.pick}));});assert.equal(markers.length,1);await page.evaluate(pick=>HK.UI.sceneClick(pick),markers[0].pick);
 await page.evaluate(()=>{HK.state.day=HK.state.shoreStory.buildAt;HK.shoreSync(HK.state);HK.autosave();HK.loadGame();HK.setSpeed(0);HK.UI.missionFocus='shore:main';HK.UI.setTab('missions');});await check();await click('inspect');await check();await click('conceal');
 await page.evaluate(()=>{HK.state.day=HK.state.shoreStory.aftercare.at;HK.shoreSync(HK.state);HK.UI.postSelected=HK.state.post.messages.find(m=>m.type==='shore'&&m.ref.quest==='aftercare').id;HK.UI.setTab('mail');});
 await page.locator('.post-letter [data-action=shoreopen]').click();assert.equal(await page.evaluate(()=>HK.state.shoreStory.damaged),true);await check();
 await page.setViewportSize({width:1500,height:1100});await page.evaluate(()=>{HK.setLang('de');HK.UI.renderAll();HK.UI.sidebar.scrollTop=0;document.querySelectorAll('.shore-story details').forEach(el=>el.open=false);});await page.mouse.move(10,10);await page.screenshot({path:'/tmp/hanse-ufergeschichte.png'});
 await click('repair');await check();await page.evaluate(()=>{HK.state.day=HK.state.shoreStory.aftercare.ready;HK.shoreSync(HK.state);HK.UI.renderAll();});await click('certify');assert.equal(await page.evaluate(()=>HK.shoreSupport(HK.state)),1);await check();
 await page.evaluate(()=>{HK.UI.missionFocus='shore:main';HK.UI.renderAll();document.querySelectorAll('.shore-story details').forEach(el=>el.open=true);});await click('repay');await check();assert.equal(await page.evaluate(()=>HK.state.shoreStory.debt),0);
 await page.evaluate(()=>{HK.UI.missionFocus=null;HK.UI.missionFilter='finished';HK.UI.setTab('missions');});assert.equal(await page.locator('[data-mission^=shore-]').count(),3);
 // The sound, publicly funded branch remains distinct from the concealed-defect route.
 await page.evaluate(()=>{const s=HK.newGame({name:'Guild test',difficulty:'normal',years:20});HK.state=s;s.day=35;s.money=20000;Object.assign(s.breadStory,{phase:'done',finished:30,ending:'account'});HK.shoreSync(s);HK.shoreAct(s,'main','start','offer');s.day+=2;HK.shoreSync(s);HK.shoreAct(s,'main','quay','site');for(const g of ['timber','stone','tools'])HK.withQuality(100,()=>HK.addStock(s.warehouse.stock,g,25,1000));HK.UI.missionFocus='shore:main';HK.UI.setTab('missions');});
 await click('parish');await page.locator('.shore-story [data-action=shoreopen][data-quest=neighbours]').click();await click('compensate');await page.locator('.shore-story [data-action=shoreopen][data-quest=main]').click();await click('guild');await page.evaluate(()=>{HK.state.day=HK.state.shoreStory.buildAt;HK.shoreSync(HK.state);HK.UI.renderAll();});await click('inspect');assert.equal(await page.locator('[data-choice=conceal]').count(),0);await click('open');await check();
 // Render both actual locations; verify the notice stands on land and outside buildings.
 await page.setViewportSize({width:1500,height:1100});
 for(const site of ['quay','bank']){
  const geometry=await page.evaluate(async site=>{const S=HK.Scene;HK.state.shoreStory.site=site;const p=HK.shoreMapPoint(HK.state);HK.UI.renderAll();document.querySelectorAll('.shore-story details').forEach(el=>el.open=false);S.clock=.48;S.cam.z=2.8;S.zeigeAuf(p.x,p.y);for(let n=0;n<35;n++){S.update(.016);S.draw();await new Promise(requestAnimationFrame);}S.renderPick();const pp=HK.Iso.p(p.x+.17,p.y+.02,.42),hit=S.hit(pp[0],pp[1],true);const overlap=HK.BUILDINGS.filter(b=>b.w&&b.d&&!['market','water','gate'].includes(b.kind)&&p.x>b.x&&p.x<b.x+b.w&&p.y>b.y&&p.y<b.y+b.d).map(b=>b.id);return{water:S.isWater(p.x,p.y),overlap,hit:hit?.kind};},site);
  assert.equal(geometry.hit,'shore-project',site+' notice is not pickable');assert(!geometry.water,site+' notice in water');assert.deepEqual(geometry.overlap,[],site+' overlaps building');await page.mouse.move(10,10);await page.screenshot({path:'/tmp/hanse-ufer-'+site+'.png'});
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',construction:true,neighbours:true,savedDefect:true,aftercare:true,repayment:true,mapMarker:true,persistence:true,pureViews:pure,languages:2,widths:3,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
