'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1600,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);await page.locator('#new-game-form button[type=submit]').click();
 const report=await page.evaluate(()=>{
  HK.loop=()=>{};HK.setSpeed(0);HK.UI.lehrgangAktion('zu');const S=HK.Scene,st=HK.state;S.clock=.5;S.populationSetup(st);st.rural.sites.hunter.reason=null;
  const p=st.population.people['worker:hunter'],start=[p.motion.x,p.motion.y],home=p.home,visited=new Set();let distance=0,maxStep=0,previous=start,blocked=0;
  for(let i=0;i<1800;i++){S.time=i/10;S.populationUpdate(.1);const m=p.motion,step=Math.hypot(m.x-previous[0],m.y-previous[1]);distance+=step;maxStep=Math.max(maxStep,step);if(!S.populationFree(m.x,m.y))blocked++;if(m.place==='work')visited.add(m.visits);previous=[m.x,m.y];}
  const saved=HK.deserialize(HK.serialize(st));HK.state=saved;S.populationSetup(saved);const restored=saved.population.people[p.id];const saveGap=Math.hypot(restored.motion.x-p.motion.x,restored.motion.y-p.motion.y);
  S.clock=.9;for(let i=0;i<2400&&!restored.motion.hidden;i++)S.populationUpdate(.1);
  const returned=restored.motion.hidden&&restored.motion.place==='home';S.clock=.5;for(let i=0;i<200;i++)S.populationUpdate(.1);
  const forest=S.woodlandDetails(),kinds=[...new Set(forest.map(d=>d.kind))],animals=S.ruralAnimals(0),species=[...new Set(animals.map(a=>a.type))];
  let badAnimals=0;for(let i=0;i<600;i++)for(const a of S.ruralAnimals(i/10).slice(5))if(S.isWater(a.x,a.y)||S.blockedAt(a.x,a.y)||!HK.Iso.inHull(HK.LAND,a.x,a.y))badAnimals++;
  const sheet=document.createElement('canvas');sheet.width=1200;sheet.height=750;const c=sheet.getContext('2d');c.fillStyle='#899775';c.fillRect(0,0,1200,750);
  for(const [i,type]of ['deer','hind','fawn','hare','fox'].entries()){c.save();c.translate(110+i*225,130);c.scale(5,5);const q=HK.Iso.p(0,0,0);c.translate(-q[0],-q[1]);S.drawRuralAnimal(c,0,0,type,-Math.PI/4,0,{walk:0,graze:.015});c.restore();c.fillStyle='#25392e';c.font='18px sans-serif';c.fillText(type,70+i*225,180);}
  for(const [i,clip]of ['look','track','rest'].entries()){c.save();c.translate(170+i*380,400);c.scale(6,6);const q=HK.Iso.p(0,0,0);c.translate(-q[0],-q[1]);S.drawHunter(c,{x:0,y:0,color:p.color,look:p.look,working:true,motion:{clip,u:.5}});c.restore();c.fillStyle='#25392e';c.fillText(clip,145+i*380,440);}
  for(const [i,kind]of kinds.entries()){c.save();c.translate(150+i*240,640);c.scale(8,8);const q=HK.Iso.p(0,0,0);c.translate(-q[0],-q[1]);S.drawWoodlandDetail(c,{x:0,y:0,kind},'summer');c.restore();c.fillText(kind,100+i*240,690);}
  S.cam.z=3.8;S.zeigeAuf(24.4,-12.1);S.draw();S.renderPick();const m=restored.motion,q=HK.Iso.p(m.x,m.y,0);let picked=false;for(let dx=-4;dx<=4;dx+=2)for(let dy=3;dy<=20;dy+=2)if(S.hit(q[0]+dx,q[1]-dy)?.citizen===p.id)picked=true;
  const keys=new Set();for(let i=0;i<1440;i++)keys.add(S.ruralWorkSample({task:'hunt'},i/60).key);
  return {home,distance,maxStep,blocked,visited:[...visited],saveGap,returned,picked,flora:forest.length,kinds,species,badAnimals,poses:keys.size,sheet:sheet.toDataURL()};
 });
 fs.writeFileSync('/tmp/hanse-wald-details.png',Buffer.from(report.sheet.split(',')[1],'base64'));delete report.sheet;await page.screenshot({path:'/tmp/hanse-wald.png'});
 assert.equal(report.home,'hunter');assert(report.distance>12);assert(report.visited.length>=4);assert(report.maxStep<=.031);assert.equal(report.blocked,0);assert.equal(report.saveGap,0);assert(report.returned);assert(report.picked);assert.equal(report.badAnimals,0);assert(report.flora>=20);assert.equal(report.kinds.length,4);assert(report.species.includes('hare')&&report.species.includes('fox')&&report.species.includes('fawn'));assert(report.poses<=144&&report.poses>90);assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',...report,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
