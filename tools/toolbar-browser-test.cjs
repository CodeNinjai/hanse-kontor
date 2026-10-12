'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const p=await b.newPage({viewport:{width:1600,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(process.env.HK_URL||'http://localhost:8778');await p.waitForFunction(()=>HK.PixiScene.bereit);await p.locator('#new-game-form button[type=submit]').click();await p.evaluate(()=>{HK.loop=()=>{};HK.setSpeed(0);HK.UI.lehrgangAktion('zu');});
 assert.equal(await p.locator('#btn-export,#btn-import,#file-import,#hud .clock-controls,#side>.menu').count(),0);
 for(const id of ['btn-pause','btn-s1','btn-s2','btn-s3','btn-save','btn-audio','btn-help','map-menu','settings-menu'])assert.equal(await p.locator('#game-toolbar #'+id).count(),1);
 await p.locator('#btn-s3').click();assert.equal(await p.evaluate(()=>HK.state.speed),3);await p.locator('#btn-pause').click();assert.equal(await p.evaluate(()=>HK.state.speed),0);await p.locator('#btn-pause').click();assert.equal(await p.evaluate(()=>HK.state.speed),3);await p.locator('#btn-s1').click();assert.equal(await p.evaluate(()=>HK.state.speed),1);
 await p.locator('#btn-pause').click();await p.locator('#btn-save').click();assert(await p.evaluate(()=>JSON.parse(localStorage.getItem(HK.SAVE_KEY)).name===HK.state.name));
 await p.locator('#btn-audio').click();assert(await p.locator('#audio-master').isVisible());await p.locator('#modal [data-close]').click();const muted=await p.evaluate(()=>HK.Audio.settings.muted);await p.locator('#btn-audio-mute').click();assert.equal(await p.evaluate(()=>HK.Audio.settings.muted),!muted);
 await p.locator('#btn-help').click();assert(await p.locator('#modal').isVisible());await p.locator('#modal [data-close]').last().click();
 await p.locator('#settings-menu>summary').click();await p.locator('#settings-menu [data-lang=en]').click();assert.equal(await p.evaluate(()=>HK.LANG),'en');assert.match(await p.locator('#settings-menu>summary').innerText(),/Settings/);await p.locator('#settings-menu [data-lang=de]').click();await p.keyboard.press('Escape');
 const report=[];
 for(const lang of ['de','en'])for(const width of [1800,1024,901,900,768,390,320]){
  await p.setViewportSize({width,height:800});await p.evaluate(l=>HK.setLang(l),lang);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+width+lang);
  const footer=await p.locator('#game-toolbar').boundingBox();assert(footer.y>=0&&footer.y+footer.height<=801,'footer placement '+width);
  for(const id of ['map-menu','settings-menu','time-menu']){
   await p.locator('#'+id+'>summary').click();const box=await p.locator('#'+id+' .utility-popover').boundingBox();assert(box&&box.x>=-1&&box.x+box.width<=width+1&&box.y>=0&&box.y+box.height<=800,JSON.stringify({width,lang,id,box}));await p.keyboard.press('Escape');assert.equal(await p.locator('#'+id).getAttribute('open'),null);
  }
  report.push({lang,width});
 }
 await p.locator('#map-menu>summary').click();await p.locator('#view-district').selectOption('harbour');assert.equal(await p.evaluate(()=>HK.Scene.district),'harbour');const zoom=await p.evaluate(()=>HK.Scene.cam.z);await p.locator('[data-zoom=out]').click();assert(await p.evaluate(()=>HK.Scene.cam.z)<zoom);await p.keyboard.press('Escape');
 await p.locator('#time-toggle').click();const day=await p.evaluate(()=>HK.state.day);await p.locator('#btn-step').click();assert.equal(await p.evaluate(()=>HK.state.day),day+1);await p.keyboard.press('Escape');
 await p.locator('#settings-menu>summary').click();await p.locator('#btn-menu').click();assert(await p.locator('#t-resume').isVisible());await p.locator('#t-resume').click();assert(await p.locator('#game-toolbar').isVisible());
 assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',pauseResumeSpeed:true,save:true,sound:true,help:true,settings:true,map:true,nextDay:true,layouts:report,errors}));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
