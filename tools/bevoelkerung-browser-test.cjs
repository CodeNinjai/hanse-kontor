'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);await page.locator('#new-game-form button[type=submit]').click();
 const result=await page.evaluate(()=>{HK.setSpeed(0);const S=HK.Scene,U=HK.UI,st=HK.state;S.update=()=>{};S.clock=.5;S.weather='clear';
  // Boat crews used to be omitted entirely from the hit map.
  const ship=Object.values(S.shipAnim)[0];if(!ship)throw Error('No visitor ship');
  S.cam.z=3;const focus=HK.Iso.p(ship.x,ship.y,0);S.cam.x=focus[0]-HK.SCENE.W/(2*S.cam.z);S.cam.y=focus[1]-HK.SCENE.H/(2*S.cam.z);S.camAuto=false;
  S.draw();S.renderPick();
  const pixels=S.pickCtx.getImageData(0,0,S.pickCanvas.width,S.pickCanvas.height).data,visible=new Set();
  for(let i=0;i<pixels.length;i+=4)if(pixels[i]===255){const code=pixels[i+1]+(pixels[i+2]<<8);if(code%3===0)visible.add(code/3);}
  const crew=[...visible].map(i=>S.pickTable[i]).find(h=>h?.citizen?.startsWith('service:visitor:'));
  if(!crew)throw Error('Ship crew has no selectable pixels');U.sceneClick(crew);
  if(!U.sidebar.textContent.includes('An Bord'))throw Error('Crew lodging missing');
  const savedCrew=JSON.stringify(st.population.people[crew.citizen]);S.time+=1;S.draw();S.renderPick();if(savedCrew!==JSON.stringify(st.population.people[crew.citizen]))throw Error('Crew identity changed between poses');
  const p=st.population.people['vendor:0'];p.motion.hidden=false;p.motion.place='work';
  S.cam.z=3;const a=HK.Iso.p(p.motion.x,p.motion.y,.3);S.cam.x=a[0]-HK.SCENE.W/(2*S.cam.z);S.cam.y=a[1]-HK.SCENE.H/(2*S.cam.z);S.camAuto=false;
  for(let i=0;i<25;i++)S.draw();S.renderPick();const xy=HK.Iso.p(p.motion.x,p.motion.y,0);let picked;
  for(const dy of [15,12,8]){const hit=S.hit(xy[0],xy[1]-dy);if(hit?.citizen===p.id)picked=hit;}
  if(!picked)throw Error('Market vendor cannot be clicked');U.sceneClick(picked);
  if(U.panel!=='citizen'||!U.sidebar.textContent.includes(p.name))throw Error('Profile missing');
  for(const lang of ['de','en']){HK.setLang(lang);const h=U.panel_citizen();if(/undefined|NaN/.test(h))throw Error('Broken profile translation');}
  HK.setLang('de');U.action({action:'citizentalk',id:p.id});const first=JSON.stringify(p.conversation);U.action({action:'citizentalk',id:p.id});if(first!==JSON.stringify(p.conversation))throw Error('Conversation rerolls on every click');
  const origin=p.home;U.action({action:'citizenhome',id:p.id});if(S.selected!==origin)throw Error('Home link is wrong');
  U.sceneClick({kind:'building',building:HK.BUILDING.inn,panel:'venture'});if(!U.sidebar.textContent.includes('Gästebuch'))throw Error('Inn has no guest book');
  return{people:Object.keys(st.population.people).length,vendorClick:true,crewClick:true,profileLanguages:2,conversation:true,homeLink:true,guestBook:true};
 });
 await page.screenshot({path:'/tmp/population-inn.png'});
 await page.evaluate(()=>HK.UI.sceneClick({kind:'citizen',citizen:'vendor:0'}));await page.screenshot({path:'/tmp/population-person.png'});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',...result,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
