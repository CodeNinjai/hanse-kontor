'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await b.newPage({viewport:{width:1600,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.HK_URL||'http://localhost:8778');await page.waitForFunction(()=>HK.PixiScene.bereit);await page.locator('#new-game-form button[type=submit]').click();
 const report=await page.evaluate(()=>{
  HK.setSpeed(0);const S=HK.Scene,st=HK.state;S.update=()=>{};S.clock=.5;S.weather='clear';S.populationSetup(st);
  const a=HK.CITY_ACTORS.find(a=>a.id==='dock-angler'),p=st.population.people['actor:dock-angler'],m=p.motion;
  // Existing saves retain the original person and position; walk from the old quay.
  Object.assign(m,{x:25.7,y:19.7,place:'work',hidden:false,wait:0,route:[],planning:false,visits:1});p.point=[25.65,19.72];
  const oldName=p.name;let maxStep=0,walked=false,minTower=Infinity;
  for(let i=0;i<3600;i++){
   const x=m.x,y=m.y;S.populationUpdate(1/60);maxStep=Math.max(maxStep,Math.hypot(m.x-x,m.y-y));walked ||= m.place==='walking';
   if(S.moleAt(m.x,m.y)){minTower=Math.min(minTower,Math.hypot(m.x-HK.LIGHTHOUSE.x,m.y-HK.LIGHTHOUSE.y));if(!S.populationFree(m.x,m.y))throw Error('Blocked walking point');}
   if(m.place==='work'&&Math.hypot(m.x-a.x,m.y-a.y)<.05)break;
  }
  const keys=new Set(),clips=new Set();let water=true,fish=false,maxHookStep=0,last;
  for(let i=0;i<60*90;i++){
   const motion=S.fishingSample(a,i/60),pose=S.fishingPose(a,motion);keys.add(motion.key);clips.add(motion.clip);fish ||=pose.fish;
   water &&= S.isWater(...pose.hook)&&!S.moleAt(...pose.hook)&&!S.pierAt(...pose.hook);
   if(last)maxHookStep=Math.max(maxHookStep,Math.hypot(...pose.hook.map((v,k)=>v-last[k])));last=pose.hook;
  }
  const q=HK.Iso.p(m.x,m.y,0);S.cam.z=5;S.cam.x=q[0]-HK.SCENE.W/10;S.cam.y=q[1]-HK.SCENE.H/10;S.camAuto=false;
  S.time=0;S.draw();S.renderPick();let pickable=false;
  for(let dy=3;dy<24;dy+=2)for(let dx=-4;dx<=4;dx+=2)if(S.hit(q[0]+dx,q[1]-dy)?.citizen===p.id)pickable=true;
  return {walked,arrived:Math.hypot(m.x-a.x,m.y-a.y)<.05,maxStep,minTower,samePerson:p.name===oldName,poses:keys.size,clips:[...clips],fish,water,maxHookStep,pickable};
 });
 for(const [name,phase]of [['wait',8],['catch',36.5]]){
  await page.evaluate(phase=>{const S=HK.Scene,a=HK.CITY_ACTORS.find(a=>a.id==='dock-angler');S.time=phase-HK.citizenHash(a.id)%19;S.draw();},phase);
  await page.locator('#scene').screenshot({path:'/tmp/hanse-angler-'+name+'.png'});
 }
 assert(report.walked&&report.arrived&&report.samePerson);assert(report.maxStep<=.005001);assert(report.minTower>.475);assert(report.water&&report.fish&&report.pickable);assert(report.maxHookStep<.035);assert.equal(report.clips.length,5);assert(report.poses<=304);assert.deepEqual(errors,[]);
 console.log(JSON.stringify({result:'PASS',...report,errors}));
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1;});
