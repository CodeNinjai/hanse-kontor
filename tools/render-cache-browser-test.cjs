'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);await page.locator('#new-game-form button[type=submit]').click();
 const result=await page.evaluate(()=>{
  const S=HK.Scene,R=HK.PixiScene;HK.setSpeed(0);S.update=()=>{};S.clock=.5;S.weather='clear';
  for(let i=0;i<25;i++)S.draw();
  const parents=[...R.cache].filter(([,e])=>e.flags?.length&&!e.zeit&&e.flagG?.parent);
  if(parents.length<3)throw Error('No visible static buildings with captured flags');
  const phases=parents.map(([,e])=>e.flagFrame);
  for(let i=0;i<30;i++){S.time+=1/30;S.draw();}
  for(const[id,e]of parents){
   if(R.cache.get(id)!==e)throw Error('Flag animation rebuilt its building: '+id);
   if(e.flagFrame===phases[parents.findIndex(p=>p[0]===id)])throw Error('Flag stopped moving');
   const children=R.lg.objekte.children;if(children.indexOf(e.flagG)!==children.indexOf(e.g)+1)throw Error('Flag lost its parent depth order');
  }
  const before=parents.map(([,e])=>e);HK.geoStand++;
  for(let i=0;i<30;i++)S.draw();
  if(parents.some(([id],i)=>R.cache.get(id)===before[i]))throw Error('Game changes no longer invalidate buildings');
  S.clock=.92;for(let i=0;i<30;i++)S.draw();
  for(const[id]of parents){const e=R.cache.get(id);if(!e.flagEm||e.flagEm.context!==e.flagG.context||e.flagEm.parent!==R.emObjekte)throw Error('Flag missing from night occlusion');}
  S.renderPick(); // Real pick drawing must run without errors.
  const resources=parents.map(([id])=>R.cache.get(id));
  R.verwerfen();
  if(resources.some(e=>!e.flagG.destroyed||!e.flagEm.destroyed))throw Error('Flag resources leak on reset');
  S.draw();
  return{staticParents:parents.length,animation:true,depth:true,invalidation:true,night:true,cleanup:true};
 });
 await page.locator('#scene').screenshot({path:'/tmp/render-cache-night.png'});
 await page.evaluate(()=>{HK.Scene.clock=.5;});await page.waitForTimeout(350);await page.locator('#scene').screenshot({path:'/tmp/render-cache-day.png'});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',...result,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
