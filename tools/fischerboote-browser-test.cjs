'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1600,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);await page.locator('#new-game-form button[type=submit]').click();
 const report=await page.evaluate(()=>{
  HK.loop=()=>{};HK.UI.lehrgangAktion('zu');const S=HK.Scene,st=HK.state,I=HK.Iso;st.speed=1;st.boats=4;S.clock=.5;S.updateFishingBoats(0);
  const phases=new Set(),wet=p=>S.isWater(p[0],p[1])&&!S.pierAt(p[0],p[1])&&!S.moleAt(p[0],p[1]);let dry=0,maxStep=0,maxTurn=0,departed=0;
  for(let i=0;i<6;i++){
   const r=S.fishingBoatRoute(i);let previous=S.fishingBoatPose(i,0);
   for(let t=0;t<r.cycle;t+=1/60){const p=S.fishingBoatPose(i,t);phases.add(p.activity);maxStep=Math.max(maxStep,Math.hypot(p.x-previous.x,p.y-previous.y));maxTurn=Math.max(maxTurn,Math.abs(p.heading-previous.heading));
    for(const [u,v]of [[.6,0],[-.55,-.2],[-.55,.2],[0,-.3],[0,.62*p.net],[-.92,-.29],[-.92,.29]]){const co=Math.cos(p.heading),si=Math.sin(p.heading);if(!wet([p.x+u*co-v*si,p.y+u*si+v*co]))dry++;}previous=p;
   }
   const end=S.fishingBoatPose(i,r.cycle);if(Math.hypot(end.x-r.a.x,end.y-r.a.y)>1e-8)throw Error('Did not return to own berth');
  }
  const beforeStock=JSON.stringify(st.warehouse.stock),beforeMoney=st.money;
  for(let t=0;t<20;t+=.1)S.updateFishingBoats(.1);
  for(let i=0;i<6;i++){const p=S.fishingBoatPose(i,st.fishingTraffic[i]),a=HK.BOAT_SPOTS[i];if(Math.hypot(p.x-a.x,p.y-a.y)>.01)departed++;}
  const saved=HK.serialize(st),restored=HK.deserialize(saved),saveSame=JSON.stringify(st.fishingTraffic)===JSON.stringify(restored.fishingTraffic);HK.state=restored;
  restored.speed=0;const pause=JSON.stringify(restored.fishingTraffic);S.updateFishingBoats(10);const paused=pause===JSON.stringify(restored.fishingTraffic);
  restored.speed=1;S.clock=.9;for(let t=0;t<160;t+=.1)S.updateFishingBoats(.1);const nightHome=restored.fishingTraffic.every(e=>e<0);S.clock=.5;restored.fishingTraffic.fill(-1);const weather=HK.weatherAt;HK.weatherAt=()=>({type:'storm'});S.updateFishingBoats(10);const stormHome=restored.fishingTraffic.every(e=>e<0);HK.weatherAt=weather;
  const economicUnchanged=beforeStock===JSON.stringify(restored.warehouse.stock)&&beforeMoney===restored.money;
  const items=[];S.fishingBoatItems(items,restored,S.time);const own=items.filter(it=>it.pick.label.includes('Eigenes')).length;
  // Sample artwork at several headings, including active and furled sails.
  const sheet=document.createElement('canvas');sheet.width=1000;sheet.height=640;const ctx=sheet.getContext('2d');ctx.fillStyle='#36565b';ctx.fillRect(0,0,1000,640);
  for(let i=0;i<8;i++){ctx.save();ctx.translate(125+(i%4)*250,220+Math.floor(i/4)*300);ctx.scale(5,5);const p=I.p(0,0,0);ctx.translate(-p[0],-p[1]);S.drawBoat(ctx,0,0,true,0,{heading:i*Math.PI/4,moving:i<4,net:i<4?0:1});ctx.restore();}
  S.clock=.5;restored.fishingTraffic[2]=12;S.cam.z=4;S.zeigeAuf(15.25,23.7);S.draw();const g=HK.PixiScene.animiert.get('fishing-boat:2')?.g,position=g&&[g.x,g.y];
  S.updateFishingBoats(1/60);S.time+=1/60;S.draw();const after=HK.PixiScene.animiert.get('fishing-boat:2')?.g,renderMoved=!!(position&&after&&(position[0]!==after.x||position[1]!==after.y)),retained=g===after;
  S.renderPick();const p=S.fishingBoatPose(2,restored.fishingTraffic[2]),screen=I.p(p.x,p.y,S.WATER_Z);let picked=false;for(let dx=-14;dx<15;dx+=2)for(let dy=-25;dy<3;dy+=2)if(S.hit(screen[0]+dx,screen[1]+dy)?.label?.includes('Eigenes Fischerboot'))picked=true;
  return {phases:[...phases],dry,maxStep,maxTurn,departed,saveSame,paused,nightHome,stormHome,economicUnchanged,count:items.length,own,renderMoved,retained,picked,sheet:sheet.toDataURL()};
 });
 fs.writeFileSync('/tmp/hanse-fischerboote-details.png',Buffer.from(report.sheet.split(',')[1],'base64'));delete report.sheet;await page.screenshot({path:'/tmp/hanse-fischerboote.png'});
 assert.equal(report.dry,0);assert(report.maxStep<.004);assert(report.maxTurn<.014);assert.equal(report.departed,6);assert.equal(report.count,6);assert.equal(report.own,4);for(const key of ['saveSame','paused','nightHome','stormHome','economicUnchanged','renderMoved','retained','picked'])assert(report[key],key);assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',...report,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
