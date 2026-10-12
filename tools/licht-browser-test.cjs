'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1400,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);await page.locator('#new-game-form button[type=submit]').click();
 const result=await page.evaluate(()=>{
  const S=HK.Scene,R=HK.PixiScene;HK.setSpeed(0);S.update=()=>{};S.time=15;
  let samples=0;
  for(const weather of ['clear','cloudy','rain','snow']) {
   S.weather=weather;let prev;
   for(let i=0;i<=1440;i++) {
    S.clock=i/1440;const p=S.palette();
    if(p.tint[3]!==1||p.tint.slice(0,3).some(v=>!Number.isFinite(v)||v<0||v>255))throw Error('Invalid illumination');
    if(prev&&p.tint.slice(0,3).some((v,j)=>Math.abs(v-prev[j])>2))throw Error('Abrupt colour transition');
    prev=p.tint;samples++;
   }
   S.clock=0;const start=S.palette();S.clock=1;const end=S.palette();
   if(JSON.stringify(start)!==JSON.stringify(end))throw Error('Midnight seam');
  }
  S.weather='clear';
  for(const boundary of [.24,.8]) {
   const sides=[boundary-.000001,boundary+.000001].map(c=>{S.clock=c;R.luftUndLicht(S.palette(),HK.SCENE.W,HK.SCENE.H,S.time);return{rgb:Array.from(R._hl.luft.getContext('2d').getImageData(0,0,1,1).data),shadow:S.shadowVec()};});
   if(sides[0].rgb.some((v,i)=>Math.abs(v-sides[1].rgb[i])>1))throw Error('Sunrise/sunset overlay jumps');
   if(sides[0].shadow.v.some((v,i)=>Math.abs(v-sides[1].shadow.v[i])>.001)||Math.abs(sides[0].shadow.a-sides[1].shadow.a)>.001)throw Error('Shadow jumps at horizon');
  }
  const readings=[];
  for(const clock of [.26,.5,.76,.84,.94]) {
   S.clock=clock;S.weather='clear';for(let i=0;i<20;i++)S.draw();
   if(R.lg.hebung.visible)throw Error('Additive haze returned');
   if(R.lg.glanz.visible!==(S.palette().amb<.7))throw Error('Local lights have wrong schedule');
   // Exercise the actual GPU blend: a black surface must stay black at all times.
   const target=new PIXI.Container(),bg=new PIXI.Graphics();
   bg.rect(0,0,16,16).fill(0x000000).rect(16,0,16,16).fill(0x808080).rect(32,0,16,16).fill(0xffffff);
   const light=new PIXI.Sprite(R.lg.luft.texture);light.width=48;light.height=16;light.blendMode=R.lg.luft.blendMode;target.addChild(bg,light);
   const canvas=R.app.renderer.extract.canvas({target,resolution:1});
   const data=canvas.getContext('2d').getImageData(0,0,48,16).data;
   const at=x=>Array.from(data.slice((8*48+x)*4,(8*48+x)*4+3));
   const black=at(8),grey=at(24),white=at(40);
   if(black.some(v=>v>1))throw Error('Lighting lifts black into a milky colour');
   if(grey.some((v,i)=>v<=0||v>=white[i]))throw Error('Material contrast lost');
   readings.push({clock,black,grey,white});target.destroy({children:true});
  }
  S.clock=.94;const lamps=R.lampen.map(([x,y,role])=>[x,y,role,S.lampGlow(x,y,role)]);
  if(!lamps.length)throw Error('No lamps in lighting test');
  S.time+=5;
  if(lamps.some(([x,y,role,v])=>S.lampGlow(x,y,role)!==v))throw Error('Lamp intensity flickers');
  S.weather='rain';S.draw();R.fit();S.draw();R.verwerfen();S.draw();
  return{samples,readings,steadyLamps:lamps.length,resizeAndReset:true};
 });
 assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',...result,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
