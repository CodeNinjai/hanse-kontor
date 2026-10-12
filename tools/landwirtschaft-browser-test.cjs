'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1600,height:1100},locale:'de-DE'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);await page.locator('#new-game-form button[type=submit]').click();
 await page.evaluate(()=>{HK.loop=()=>{};HK.setSpeed(0);HK.state.money=100000;});
 const sites=await page.evaluate(()=>Object.keys(HK.RURAL_SITES));
 // Real pixel picking must reach both reused rural landmarks and each new building.
 for(const id of sites){
  const point=await page.evaluate(id=>{const S=HK.Scene,b=HK.RURAL_BUILDINGS[id],w=b.w||.6,d=b.d||.6;S.zeigeAuf(b.x+w/2,b.y+d/2);S.renderPick();for(const z of [b.h||1,2.15,.65,.4,.25,0])for(const dx of [.5,.3,.7])for(const dy of [.5,.3,.7]){const p=HK.Iso.p(b.x+w*dx,b.y+d*dy,z),hit=S.hit(...p);if(hit?.building?.id!==id)continue;const x=(p[0]-S.cam.x)*S.cam.z,y=(p[1]-S.cam.y)*S.cam.z;if(x<0||y<0||x>HK.SCENE.W||y>HK.SCENE.H)continue;const r=document.getElementById('scene').getBoundingClientRect();return{x:r.left+x*r.width/HK.SCENE.W,y:r.top+y*r.height/HK.SCENE.H};}throw Error('Cannot pick rural site '+id);},id);
  const camera=await page.evaluate(()=>({...HK.Scene.cam}));
  await page.mouse.click(point.x,point.y);assert.equal(await page.evaluate(()=>HK.UI.panel),'rural');assert.equal(await page.evaluate(()=>HK.Scene.selected),id);assert.equal(await page.locator('#sidebar h2').textContent(),await page.evaluate(id=>HK.name(HK.RURAL_BUILDINGS[id]),id));
  assert.deepEqual(await page.evaluate(()=>({...HK.Scene.cam})),camera,'Building click moves camera: '+id);
  await page.mouse.dblclick(point.x,point.y);assert.deepEqual(await page.evaluate(()=>({...HK.Scene.cam})),camera,'Building double click zooms camera: '+id);
  await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x+6,point.y+1);await page.mouse.up();assert.deepEqual(await page.evaluate(()=>({...HK.Scene.cam})),camera,'Small click drift pans camera: '+id);
 }
 const camera=await page.evaluate(()=>({...HK.Scene.cam}));await page.evaluate(()=>HK.UI.action({action:'ruralopen',site:'hunter'}));assert.deepEqual(await page.evaluate(()=>({...HK.Scene.cam})),camera,'Opening a business from the menu moves the map');
 await page.locator('[data-action=ruralshow]').click();assert.notDeepEqual(await page.evaluate(()=>({...HK.Scene.cam})),camera,'Explicit map location button does not work');
 // Real worker pixels must remain visible and select the business, including under tree crowns.
 await page.evaluate(()=>{HK.Scene.clock=.5;});
 for(const id of sites){const p=await page.evaluate(id=>{const S=HK.Scene,w=S.ruralWorkers(HK.state,S.season(),S.time).find(w=>w.site===id);S.cam.z=2.5;S.zeigeAuf(w.x,w.y);S.renderPick();for(const z of [.3,.5])if(S.hit(...HK.Iso.p(w.x,w.y,z))?.building?.id!==id)throw Error("Worker torso or head is obscured: "+id);for(const z of [.3,.45,.18]){const p=HK.Iso.p(w.x,w.y,z);if(S.hit(...p)?.building?.id!==id)continue;const r=document.getElementById('scene').getBoundingClientRect();return{x:r.left+(p[0]-S.cam.x)*S.cam.z*r.width/HK.SCENE.W,y:r.top+(p[1]-S.cam.y)*S.cam.z*r.height/HK.SCENE.H};}throw Error('Worker is hidden or unselectable: '+id);},id);await page.mouse.click(p.x,p.y);assert.equal(await page.evaluate(()=>HK.Scene.selected),id);}
 await page.evaluate(()=>HK.UI.action({action:'ruralopen',site:'windmill'}));await page.locator('#qty-input').fill('2');
 const cash=await page.evaluate(()=>HK.state.money),local=await page.evaluate(()=>HK.state.rural.sites.windmill.stock.flour);
 await page.locator('[data-action=ruralorder][data-good=flour]').click();assert.equal(await page.evaluate(()=>HK.state.rural.sites.windmill.stock.flour),local-2);assert(!(await page.evaluate(()=>HK.state.warehouse.stock.flour)));
 const cost=await page.evaluate(()=>HK.ruralWaiting(HK.state)[0].cost);assert.equal(await page.evaluate(()=>HK.state.money),cash-cost);
 await page.evaluate(()=>{const b=HK.BUILDING.warehouse;HK.UI.sceneClick({kind:'building',building:b,panel:b.panel});});assert.equal(await page.locator('[data-capacity=reserved] strong').textContent(),'2 Last');assert.equal(await page.locator('[data-rural-delivery]').count(),1);
 const before=await page.evaluate(()=>HK.serialize(HK.state));for(let i=0;i<5;i++)await page.evaluate(()=>{HK.UI.panel_rural();HK.UI.panel_warehouse();});assert.equal(await page.evaluate(()=>HK.serialize(HK.state)),before,'Views change quantities or delivery clocks');
 await page.evaluate(()=>{HK.tick(HK.state);HK.UI.renderAll();});assert.equal(await page.evaluate(()=>HK.state.warehouse.stock.flour),2);assert.equal(await page.locator('[data-rural-delivery]').count(),0);assert.equal(await page.locator('[data-capacity=reserved] strong').textContent(),'0 Last');
 await page.evaluate(()=>HK.UI.action({action:'ruralopen',site:'grainfarm'}));const funds=await page.evaluate(()=>HK.state.money);await page.locator('[data-action=ruralbuy]').click();assert.equal(await page.evaluate(()=>HK.state.money),funds-3600);
 await page.locator('[data-action=ruralcrop][data-good=hemp]').click();assert.equal(await page.evaluate(()=>HK.state.rural.sites.grainfarm.nextCrop),'hemp');assert.equal(await page.evaluate(()=>HK.state.rural.sites.grainfarm.crop),'grain');
 await page.locator('[data-action=ruralpause]').click();assert(!(await page.evaluate(()=>HK.state.rural.sites.grainfarm.active)));await page.locator('[data-action=ruralpause]').click();
 // Native butcher/tannery ownership and mode controls process actual stock.
 await page.evaluate(()=>{HK.state.craftGuild=true;HK.state.warehouse.stock.hides=2;HK.state.warehouse.quality.hides=84;HK.UI.action({action:'businessplace',building:'tannery'});});await page.locator('[data-action=buyventure]').click();await page.locator('[data-action=ruralcraft]').click();assert.equal(await page.evaluate(()=>HK.state.rural.crafts.tannery),'produce');
 await page.evaluate(()=>{HK.tick(HK.state);HK.UI.renderAll();});assert.equal(await page.evaluate(()=>HK.state.warehouse.stock.leather),2);assert.equal(await page.evaluate(()=>HK.goodQuality(HK.state,'leather')),84);
 const migrated=await page.evaluate(()=>{const saved=JSON.parse(HK.serialize(HK.state)),cash=saved.money,stock=JSON.stringify(saved.warehouse);delete saved.rural;for(const g of ['flour','cattle','milk','meat','hides','stone','dressedstone'])delete saved.town.stock[g];const st=HK.deserialize(JSON.stringify(saved));HK.startWithState(st);HK.setSpeed(0);return{cash:st.money===cash,stock:JSON.stringify(st.warehouse)===stock,npc:Object.values(st.rural.sites).every(s=>!s.owner),income:HK.ventureIncome(st,'tannery')>0};});assert.deepEqual(migrated,{cash:true,stock:true,npc:true,income:true});
 fs.mkdirSync('/tmp/hanse-map-audit',{recursive:true});
 for(const width of [1600,1024,390,360])for(const lang of ['de','en']){
  await page.setViewportSize({width,height:1100});await page.evaluate(lang=>{HK.setLang(lang);HK.UI.action({action:'ruralopen'});},lang);assert.equal(await page.locator('.rural-site').count(),10);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Catalogue overflow '+width+'/'+lang);
  if(lang==='de'&&[1600,390].includes(width))await page.locator('#side').screenshot({path:`/tmp/hanse-map-audit/rural-catalogue-${width}.png`});
  for(const id of ['cattlefarm','windmill','quarry','stonemason','hunter']){
   await page.evaluate(id=>HK.UI.action({action:'ruralopen',site:id}),id);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Site overflow '+id+'/'+width+'/'+lang);
   assert.equal(await page.locator('#sidebar [data-help=ruralHelp]').count(),1);assert(!(await page.locator('#sidebar').textContent()).includes('NaN'));
   if(id==='cattlefarm'&&lang==='de'&&width===390)await page.locator('#side').screenshot({path:'/tmp/hanse-map-audit/rural-cattle-mobile.png'});
  }
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',mapSites:sites.length,visibleWorkers:10,stableCamera:true,purchases:true,deliveries:true,reservations:true,craftProduction:true,cropChoice:true,legacy:true,languages:2,widths:4,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
