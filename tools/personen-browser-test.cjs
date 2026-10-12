'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);await page.locator('#new-game-form button[type=submit]').click();
 const result=await page.evaluate(()=>{
  HK.setSpeed(0);const S=HK.Scene,R=HK.PixiScene;S.clock=.5;S.weather='clear';S.camAuto=false;
  for(let i=0;i<1000;i++){S.time+=.2;S.updateGates(.2);S.populationUpdate(.2);}
  const contacts=[];
  for(const source of HK.STATIC_NPCS){
   let hit;
   for(let t=0;t<40&&!hit;t+=2){
    S.time=t;for(let j=0;j<20;j++){S.updateGates(.1);S.populationUpdate(.1);}const n=HK.state.population.people['contact:'+source.person].motion,at=HK.Iso.p(n.x,n.y,.3);S.cam.z=3;
    S.cam.x=at[0]-HK.SCENE.W/(2*S.cam.z);S.cam.y=at[1]-HK.SCENE.H/(2*S.cam.z);
    S.draw();S.renderPick();
    const p=HK.Iso.p(n.x,n.y,0);
    for(const z of [22,20,18,15,10,5]){const h=S.hit(p[0],p[1]-z);if(h?.citizen==='contact:'+source.person){hit=h;break;}}
   }
   if(!hit)throw Error('Named contact cannot be picked: '+source.person+' '+JSON.stringify(HK.state.population.people['contact:'+source.person].motion));
   HK.UI.sceneClick(hit);if(HK.UI.citizen!=='contact:'+source.person||HK.UI.panel!=='citizen')throw Error('Wrong contact opened');
   contacts.push(source.person);
  }
  const before=[...R.gestalten.keys()].filter(k=>k.startsWith('citizen|contact:')).length;
  for(const clock of [.5,.95]){S.clock=clock;S.draw();}
  return {contacts,namedPoses:before,nightRendered:true};
 });
 assert.equal(result.contacts.length,14);assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',...result,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
