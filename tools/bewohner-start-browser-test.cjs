'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1500,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);await page.locator('#new-game-form button[type=submit]').click();
 const result=await page.evaluate(()=>{
  HK.setSpeed(0);const S=HK.Scene;S.clock=.35;S.weather='clear';
  const people=Object.values(HK.state.population.people).filter(p=>['resident','customer'].includes(p.group)),start=people.filter(p=>!p.motion.hidden).length;
  for(let i=0;i<100;i++){S.time+=.1;S.updateGates(.1);S.populationUpdate(.1);}
  const walking=people.filter(p=>p.motion.moving).length;
  // Capture actual draw commands: knees and ankles must both move, shoes keep
  // a flat silhouette over a complete walking cycle in three directions.
  const canvas=document.createElement('canvas');canvas.width=960;canvas.height=420;const c=canvas.getContext('2d');c.fillStyle='#a2a992';c.fillRect(0,0,960,420);
  const traces=[],shoes=[];
  for(let row=0;row<3;row++)for(let i=0;i<8;i++){
   const lines=[],ellipses=[],proxy=new Proxy(c,{get(t,k){if(k==='ellipse')return(...a)=>{ellipses.push(a);return t.ellipse(...a);};if(k==='lineTo')return(...a)=>{lines.push(a);return t.lineTo(...a);};const v=t[k];return typeof v==='function'?v.bind(t):v;},set(t,k,v){t[k]=v;return true;}});
   c.save();c.translate(60+i*120,125+row*140);c.scale(5,5);
   S.drawPerson(proxy,0,0,'#647865','citizen',1,false,'#d2baa0',i*Math.PI/4,1,null,{head:[0,Math.PI/4,Math.PI/2][row],look:{hair:'#69513d',cap:'cap'}},1);c.restore();traces.push(lines.slice(0,4));shoes.push(ellipses.slice(1,3));
  }
  const kneeChanged=traces[0][0].some((v,i)=>Math.abs(v-traces[2][0][i])>.1),ankleChanged=traces[0][1].some((v,i)=>Math.abs(v-traces[2][1][i])>.1);
  const shoesFixed=shoes.every((pair,i)=>pair.every((shoe,j)=>shoe[2]/shoe[3]>=1.8&&shoe[4]===0&&shoe[2]===shoes[Math.floor(i/8)*8][j][2]));
  window.poseImage=canvas.toDataURL();return{start,walking,kneeChanged,ankleChanged,shoesFixed};
 });
 assert(result.start<10);assert(result.walking>=12);assert(result.kneeChanged&&result.ankleChanged&&result.shoesFixed);assert.deepEqual(errors,[]);
 require('node:fs').writeFileSync('/tmp/hanse-schritte.png',Buffer.from((await page.evaluate(()=>poseImage)).split(',')[1],'base64'));
 console.log(JSON.stringify({result:'PASS',...result,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
