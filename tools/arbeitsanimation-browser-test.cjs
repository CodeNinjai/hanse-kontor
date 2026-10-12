'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1600,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);await page.locator('#new-game-form button[type=submit]').click();
 const result=await page.evaluate(()=>{
  HK.setSpeed(0);const S=HK.Scene,st=HK.state;S.update=()=>{};S.clock=.5;S.weather='clear';S.populationSetup(st);
  const sheet=document.createElement('canvas');sheet.width=1200;sheet.height=1000;const sc=sheet.getContext('2d');sc.fillStyle='#a4ae91';sc.fillRect(0,0,1200,1000);
  const samples=[['stroke',0],['stroke',.35],['stroke',.48],['stroke',.74],['adjust',.5],['rest',.5]],workers=HK.RURAL_WORKERS.filter(w=>S.ruralWorkRoutines[w.task]),report=[];
  for(const [row,w] of workers.entries()){
   const p=st.population.people['worker:'+w.site],at=S.populationWork(p);Object.assign(p.motion,{x:at[0],y:at[1],hidden:false,place:'work',moving:false,head:0});st.rural.sites[w.site].reason=null;
   const keys=new Set(),clips=new Set();let lengthError=0,maxTipStep=0,joinGap=0,last;
   for(const clip of Object.keys(S.ruralWorkClips)){const end=S.ruralWorkPose({...w,motion:{clip,u:1-1e-8},working:true}),start=S.ruralWorkPose({...w,motion:{clip:'stroke',u:0},working:true});joinGap=Math.max(joinGap,Math.hypot(...end.tip.map((v,k)=>v-start.tip[k])));}
   for(let i=0;i<3600;i++){
    const motion=S.ruralWorkSample(w,i/60,true),pose=S.ruralWorkPose({...w,motion,working:true});
    keys.add(motion.key);clips.add(motion.clip);
    lengthError=Math.max(lengthError,Math.abs(Math.hypot(...pose.tip.map((v,k)=>v-pose.grip[k]))-pose.length));
    if(last)maxTipStep=Math.max(maxTipStep,Math.hypot(...pose.tip.map((v,k)=>v-last[k])));last=pose.tip;
   }
   const items=[];S.populationItems(items,st,1);const live=items.find(it=>it.citizen===p.id),liveKey=live.s;
   st.rural.sites[w.site].reason='paused';const paused=[];S.populationItems(paused,st,1);const idle=paused.find(it=>it.citizen===p.id);const later=[];S.populationItems(later,st,80);
   if(idle.s!==later.find(it=>it.citizen===p.id).s||idle.s===liveKey)throw Error('Invalid paused pose '+w.site);
   st.rural.sites[w.site].reason=null;
   samples.forEach(([clip,u],col)=>{sc.save();sc.translate(col*200+85,row*200+160);sc.scale(5,5);const q=HK.Iso.p(...at,0);sc.translate(-q[0],-q[1]);S.drawRuralWorker(sc,{...w,x:at[0],y:at[1],look:p.look,motion:{clip,u},working:true});sc.restore();sc.fillStyle='#29352a';sc.font='14px sans-serif';sc.fillText(w.task+' / '+clip+' '+u,col*200+8,row*200+190);});
   report.push({site:w.site,poses:keys.size,clips:[...clips],lengthError,maxTipStep,joinGap,pausedStable:true});
  }
  // Draw in the real scene to exercise retained Pixi geometry, depth sorting and picking.
  const w=st.population.people['worker:woodcutter'],point=HK.Iso.p(w.motion.x,w.motion.y,0);S.cam.z=5;S.cam.x=point[0]-HK.SCENE.W/10;S.cam.y=point[1]-HK.SCENE.H/10;S.camAuto=false;
  for(let i=0;i<120;i++){S.time=i/60;S.draw();}S.renderPick();
  let hit=false;for(let dy=3;dy<24;dy+=2)for(let dx=-4;dx<=4;dx+=2)if(S.hit(point[0]+dx,point[1]-dy)?.citizen===w.id)hit=true;
  return {report,pickable:hit,sheet:sheet.toDataURL()};
 });
 fs.writeFileSync('/tmp/hanse-work-poses.png',Buffer.from(result.sheet.split(',')[1],'base64'));delete result.sheet;
 await page.screenshot({path:'/tmp/hanse-work-scene.png'});
 for(const site of ['stonemason','grainfarm','fiberfarm']){
  await page.evaluate(site=>{const S=HK.Scene,p=HK.state.population.people['worker:'+site],point=HK.Iso.p(p.motion.x,p.motion.y,0);S.cam.x=point[0]-HK.SCENE.W/10;S.cam.y=point[1]-HK.SCENE.H/10;S.time=2.3;S.draw();},site);
  await page.locator('#scene').screenshot({path:'/tmp/hanse-work-'+site+'.png'});
 }
 for(const r of result.report){assert.equal(r.clips.length,3);assert(r.poses<=176);assert(r.poses>120);assert(r.lengthError<1e-10);assert(r.maxTipStep<.2,'Tool jumps: '+JSON.stringify(r));assert(r.joinGap<1e-6,'Discontinuous clip boundary');}
 assert(result.pickable);assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',...result,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
