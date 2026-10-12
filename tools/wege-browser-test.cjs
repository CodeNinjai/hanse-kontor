'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);await page.locator('#new-game-form button[type=submit]').click();
 const report=await page.evaluate(()=>{
  HK.state.speed=0;const s=HK.Scene,I=HK.Iso,original=HK.STREETS,network=JSON.stringify([HK.ROAD_NODES,HK.ROAD_EDGES]),geometry=s.roadGeometry();
  const canvas=document.createElement('canvas');canvas.width=HK.MAP.W;canvas.height=HK.MAP.H;const g=canvas.getContext('2d',{willReadFrequently:true});
  let points=0;
  for(const r of geometry.streets)for(let k=0;k<=20;k++){
   const p=I.p(r.x1+(r.x2-r.x1)*k/20,r.y1+(r.y2-r.y1)*k/20,0);
   if(!g.isPointInPath(geometry.core,...p))throw Error('Gap on road centreline');points++;
  }
  g.fill(geometry.core);const forward=g.getImageData(0,0,canvas.width,canvas.height).data;
  try{HK.STREETS=original.slice().reverse();g.clearRect(0,0,canvas.width,canvas.height);g.fill(s.roadGeometry().core);}finally{HK.STREETS=original;}
  const backward=g.getImageData(0,0,canvas.width,canvas.height).data;
  let different=0;for(let i=3;i<forward.length;i+=4)if(forward[i]!==backward[i])different++;
  if(different)throw Error('Union depends on drawing order: '+different);
  const seasons={};
  for(const season of ['spring','summer','autumn','winter']){
   g.clearRect(0,0,canvas.width,canvas.height);const start=performance.now();s.drawRoadNetwork(g,season);seasons[season]=Math.round(performance.now()-start);
   const pixels=g.getImageData(0,0,canvas.width,canvas.height).data;
   for(let x=0;x<52;x+=.47)for(let y=-12;y<30;y+=.51){
    if(!s.isWater(x,y)||!s.isWater(x-.1,y)||!s.isWater(x+.1,y)||!s.isWater(x,y-.1)||!s.isWater(x,y+.1))continue;
    const p=I.p(x,y,0),px=Math.round(p[0]),py=Math.round(p[1]);if(px<0||py<0||px>=canvas.width||py>=canvas.height)continue;
    if(pixels[(py*canvas.width+px)*4+3]>0)throw Error('Road paint outside land '+x+','+y);
   }
  }
  if(network!==JSON.stringify([HK.ROAD_NODES,HK.ROAD_EDGES]))throw Error('Navigation changed');
  const make=s.makeGround;s._testRoadRebuilds=0;s.makeGround=function(...args){this._testRoadRebuilds++;return make.apply(this,args);};
  return{segments:geometry.streets.length,centrelinePoints:points,orderIndependent:true,seasons};
 });
 await page.waitForTimeout(700);assert.equal(await page.evaluate(()=>HK.Scene._testRoadRebuilds),0,'Ground rebuilt during animation');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',...report,cachedGround:true,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
