'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);await page.locator('#new-game-form button[type=submit]').click();
 const result=await page.evaluate(()=>{
  HK.setSpeed(0);const S=HK.Scene,st=HK.state;S.update=()=>{};S.clock=.5;S.weather='clear';S.camAuto=false;
  let occupant;
  for(let i=0;i<5000&&!occupant;i++){
   S.time+=.1;S.updateGates(.1);S.populationUpdate(.1);
   occupant=Object.values(st.population.people).find(p=>p.motion?.place==='bench'&&p.motion.seated===1&&p.motion.bench.startsWith('harbour-bench'));
  }
  if(!occupant)throw Error('Harbour bench never used '+JSON.stringify({seats:S.populationBenches(),people:Object.values(st.population.people).filter(p=>p.motion?.bench).map(p=>[p.id,p.motion.bench,p.motion.place])}));
  const seat=S.populationBenches().find(b=>b.id===occupant.motion.bench),point=HK.Iso.p(...seat.foot,0);
  S.cam.z=5;S.cam.x=point[0]-HK.SCENE.W/10;S.cam.y=point[1]-HK.SCENE.H/10;
  S.draw();S.renderPick();let hit;
  for(let dy=3;dy<25;dy+=2)for(let dx=-4;dx<=4;dx+=2){const h=S.hit(point[0]+dx,point[1]-dy);if(h?.citizen===occupant.id)hit=h;}
  if(!hit)throw Error('Seated person is not selectable');HK.UI.sceneClick(hit);
  if(!HK.UI.sidebar.textContent.includes('Bank'))throw Error('Profile lacks bench activity');
  const female=Object.values(st.population.people).find(p=>p.gender==='female'&&p.group==='vendor');
  if(!HK.citizenJob(female).includes('händlerin'))throw Error('Wrong occupation');
  const portrait=HK.MenuArt.portrait(female.id,female);if(!portrait.includes('#d8ccb0'))throw Error('Female portrait missing');
  return {occupant:occupant.id,seatedClick:true,femaleProfession:true,femalePortrait:true};
 });
 await page.screenshot({path:'/tmp/hanse-bench.png'});
 const leave=await page.evaluate(()=>{
  const S=HK.Scene,st=HK.state;S.weather='rain';
  for(let i=0;i<1500;i++){S.time+=.1;S.updateGates(.1);S.populationUpdate(.1);}
  return Object.values(st.population.people).every(p=>!p.motion?.bench&&p.motion?.place!=='bench');
 });
 assert(leave,'Bench occupants stay in rain');assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',...result,rainClearsBenches:leave,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
