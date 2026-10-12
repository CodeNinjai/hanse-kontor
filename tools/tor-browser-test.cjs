'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);await page.locator('#new-game-form button[type=submit]').click();
 const result=await page.evaluate(()=>{
  HK.setSpeed(0);const S=HK.Scene,step=S.update.bind(S);S.update=()=>{};S.porters=[];S.carts=[];S.walkers=[];S.gateMotion={};S.clock=.46;S.weather='clear';
  let passes=0;
  for(const [index,from,to,t]of [[1,'G','OUT',0],[1,'OUT','G',.6],[0,'N1','NG',.7],[0,'NG2','NG',.8]]){
   const sp=S.gateSpec(HK.WALL.gates[index]),w={...S.makeWalker(false),from,to,t,off:0,speed:.5,pause:0};delete w.bx;delete w.by;S.walkers=[w];S.gateMotion={};
   const start=w.t;step(.05);if(w.t!==start)throw Error('Walker did not wait for closed gate');
   let progressed=false;
   for(let i=0;i<180;i++){
    const before=S.walkerWorld(w);step(1/60);const after=S.walkerWorld(w),local=S.gateLocal(sp,after);
    if(Math.hypot(after.wx-before.wx,after.wy-before.wy)>1e-6){progressed=true;if(Math.abs(local.u)<.7&&S.gateOpening(sp)<.98)throw Error('Walked through lowered grille');}
   }
   if(!progressed||S.gateOpening(sp)!==1)throw Error('Gate did not open for passage');passes++;
   S.walkers=[];S.porters=[];for(let i=0;i<120;i++)S.updateGates(1/60);
   if(S.gateOpening(sp)!==1)throw Error('Gate closes too soon');
   let previous=1;for(let i=0;i<240;i++){S.updateGates(1/60);const now=S.gateOpening(sp);if(now>previous||previous-now>.008)throw Error('Closing is not gradual');previous=now;}
   if(S.gateOpening(sp)!==0)throw Error('Gate never closes');
  }
  // Ironwork must stay inside the arched opening at every lift position.
  const original=HK.Iso.line;let lines=0;
  try{for(const g of HK.WALL.gates){const sp=S.gateSpec(g),radius=sp.pw/2-.05;
   HK.Iso.line=(ctx,a,b)=>{for(const q of [a,b]){const v=(q[0]-sp.cx)*sp.s[0]+(q[1]-sp.cy)*sp.s[1];if(Math.abs(v)>radius+1e-8||q[2]>.75+Math.sqrt(Math.max(0,radius*radius-v*v))+1e-8)throw Error('Grille drawn over masonry');}lines++;};
   for(let i=0;i<=60;i++)S.drawGateGrille({},sp,i/60);
  }}finally{HK.Iso.line=original;}
  const sp=S.gateSpec(HK.WALL.gates[1]);S.gateMotion={};const pos=HK.Iso.p(38.7,10,0);S.cam.z=4;S.cam.x=pos[0]-HK.SCENE.W/8;S.cam.y=pos[1]-HK.SCENE.H/8;S.camAuto=false;
  return{passes,lines};
 });
 await page.waitForTimeout(150);await page.locator('#scene').screenshot({path:'/tmp/gate-closed.png'});
 await page.evaluate(()=>{HK.Scene.gateMotion['38,10']={open:.5,hold:2.5};});await page.waitForTimeout(150);await page.locator('#scene').screenshot({path:'/tmp/gate-opening.png'});
 await page.evaluate(()=>{const S=HK.Scene;S.gateMotion['38,10']={open:1,hold:2.5};S.walkers=[{...S.makeWalker(false),from:'OUT',to:'G',t:.52,off:0,pause:0}];});await page.waitForTimeout(150);await page.locator('#scene').screenshot({path:'/tmp/gate-open.png'});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',...result,bothDirections:true,hold:true,smoothClosing:true,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
