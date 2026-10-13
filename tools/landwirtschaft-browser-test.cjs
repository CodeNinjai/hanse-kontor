'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1600,height:1100},locale:'de-DE'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);await page.locator('#new-game-form button[type=submit]').click();
 await page.evaluate(()=>{HK.loop=()=>{};HK.setSpeed(0);HK.state.money=100000;});
 const sites=await page.evaluate(()=>Object.keys(HK.RURAL_SITES));
 const ruralGroups={ruralFields:['grainfarm','fiberfarm','sheepfarm','cattlefarm','hopgarden','poultry','gardenfarm','orchard'],ruralMill:['windmill','dairy','malthouse'],ruralForest:['woodcutter','hunter','quarry','stonemason'],ruralDeliveries:[]},groupOf=id=>Object.keys(ruralGroups).find(k=>ruralGroups[k].includes(id));
 assert.deepEqual(Object.values(ruralGroups).flat().sort(),[...sites].sort(),'Every producer belongs to exactly one subpage');
 // Real pixel picking must reach both reused rural landmarks and each new building.
 for(const id of sites){
  const point=await page.evaluate(id=>{const S=HK.Scene,b=HK.RURAL_BUILDINGS[id],w=b.w||.6,d=b.d||.6;S.zeigeAuf(b.x+w/2,b.y+d/2);S.renderPick();for(const z of [b.h||1,2.15,.65,.4,.25,0])for(const dx of [.5,.3,.7])for(const dy of [.5,.3,.7]){const p=HK.Iso.p(b.x+w*dx,b.y+d*dy,z),hit=S.hit(...p);if(hit?.building?.id!==id)continue;const x=(p[0]-S.cam.x)*S.cam.z,y=(p[1]-S.cam.y)*S.cam.z;if(x<0||y<0||x>HK.SCENE.W||y>HK.SCENE.H)continue;const r=document.getElementById('scene').getBoundingClientRect();return{x:r.left+x*r.width/HK.SCENE.W,y:r.top+y*r.height/HK.SCENE.H};}throw Error('Cannot pick rural site '+id);},id);
  const camera=await page.evaluate(()=>({...HK.Scene.cam}));
  await page.mouse.click(point.x,point.y);assert.equal(await page.evaluate(()=>HK.UI.panel),'rural');assert.equal(await page.evaluate(()=>HK.Scene.selected),id);assert.equal(await page.locator('#sidebar h2').textContent(),await page.evaluate(id=>HK.name(HK.RURAL_BUILDINGS[id]),id));
  assert.equal(await page.locator('#area-destinations [aria-current=page]').getAttribute('data-panel'),groupOf(id),'Map click marks wrong subpage: '+id);
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
 await page.locator('[data-action=ruralcrop][data-good=barley]').click();assert.equal(await page.evaluate(()=>HK.state.rural.sites.grainfarm.nextCrop),'barley');
 await page.locator('[data-action=ruralcrop][data-good=hemp]').click();assert.equal(await page.evaluate(()=>HK.state.rural.sites.grainfarm.nextCrop),'hemp');assert.equal(await page.evaluate(()=>HK.state.rural.sites.grainfarm.crop),'grain');
 await page.locator('[data-action=ruralpause]').click();assert(!(await page.evaluate(()=>HK.state.rural.sites.grainfarm.active)));await page.locator('[data-action=ruralpause]').click();
 // Native butcher/tannery ownership and mode controls process actual stock.
 await page.evaluate(()=>{HK.state.craftGuild=true;HK.state.warehouse.stock.hides=2;HK.state.warehouse.quality.hides=84;HK.UI.action({action:'businessplace',building:'tannery'});});await page.locator('[data-action=buyventure]').click();await page.locator('[data-action=ruralcraft]').click();assert.equal(await page.evaluate(()=>HK.state.rural.crafts.tannery),'produce');
 await page.evaluate(()=>{HK.tick(HK.state);HK.UI.renderAll();});assert.equal(await page.evaluate(()=>HK.state.warehouse.stock.leather),2);assert.equal(await page.evaluate(()=>HK.goodQuality(HK.state,'leather')),84);
 const migrated=await page.evaluate(()=>{const saved=JSON.parse(HK.serialize(HK.state)),cash=saved.money,stock=JSON.stringify(saved.warehouse);delete saved.rural;for(const g of ['flour','cattle','milk','meat','hides','stone','dressedstone'])delete saved.town.stock[g];const st=HK.deserialize(JSON.stringify(saved));HK.startWithState(st);HK.setSpeed(0);return{cash:st.money===cash,stock:JSON.stringify(st.warehouse)===stock,npc:Object.values(st.rural.sites).every(s=>!s.owner),income:HK.ventureIncome(st,'tannery')>0};});assert.deepEqual(migrated,{cash:true,stock:true,npc:true,income:true});
 fs.mkdirSync('/tmp/hanse-map-audit',{recursive:true});
 // Countryside subpages: presence, contents, active marking, back navigation, render purity, narrow widths.
 await page.setViewportSize({width:1600,height:1100});await page.evaluate(()=>{HK.setLang('de');HK.UI.action({action:'ruralopen',site:'windmill'});});
 await page.locator('#qty-input').fill('1');await page.locator('[data-action=ruralorder][data-good=flour]').click();
 const waiting=await page.evaluate(()=>HK.ruralWaiting(HK.state).length);assert(waiting>0,'Test needs a waiting delivery');
 await page.evaluate(()=>HK.UI.action({action:'ruralopen'}));
 assert.deepEqual(await page.locator('#area-destinations [data-panel]').evaluateAll(es=>es.map(e=>e.dataset.panel)),['rural','ruralFields','ruralMill','ruralForest','ruralDeliveries']);
 assert.equal(await page.locator('#area-destinations [aria-current=page]').getAttribute('data-panel'),'rural');
 for(const [panel,ids] of Object.entries(ruralGroups)){
  await page.locator(`#area-destinations [data-panel=${panel}]`).click();
  assert.equal(await page.evaluate(()=>HK.UI.panel),panel);assert.equal(await page.evaluate(()=>HK.Scene.selected),null);
  assert.equal(await page.locator(`#area-destinations [data-panel=${panel}]`).getAttribute('aria-current'),'page');
  assert.equal(await page.locator('#area-destinations [aria-current=page]').count(),1);
  assert.deepEqual(await page.locator('#sidebar .rural-site').evaluateAll(es=>es.map(e=>e.dataset.site)),ids,'Wrong producers on '+panel);
  assert.equal(await page.locator('#tab-place-label').textContent(),await page.evaluate(p=>HK.t(p+'Sub'),panel));
  assert(!(await page.locator('#sidebar').textContent()).includes('NaN'));
 }
 await page.locator('#area-destinations [data-panel=ruralMill]').click();assert.deepEqual(await page.locator('#sidebar [data-action=businessplace]').evaluateAll(es=>es.map(e=>e.dataset.building)),['butcher','tannery','bakery']);
 await page.locator('#area-destinations [data-panel=ruralForest]').click();
 assert.deepEqual(await page.locator('#sidebar .rural-site:has(progress)').evaluateAll(es=>es.map(e=>e.dataset.site)),['woodcutter','hunter']);
 assert.equal(await page.locator('#sidebar .rural-site[data-site=woodcutter] progress').getAttribute('value'),String(await page.evaluate(()=>Math.floor(HK.state.rural.sites.woodcutter.resource))));
 await page.locator('#area-destinations [data-panel=ruralDeliveries]').click();assert.equal(await page.locator('#sidebar [data-rural-delivery]').count(),waiting);
 for(const id of sites){
  await page.evaluate(id=>HK.UI.action({action:'ruralopen',site:id}),id);
  assert.equal(await page.evaluate(()=>HK.UI.panel),'rural');assert.equal(await page.locator('#sidebar h2').textContent(),await page.evaluate(id=>HK.name(HK.RURAL_BUILDINGS[id]),id));
  assert.equal(await page.locator('#area-destinations [aria-current=page]').getAttribute('data-panel'),groupOf(id),'ruralopen marks wrong subpage: '+id);
  await page.locator('#sidebar .work-back').click();assert.equal(await page.evaluate(()=>HK.UI.panel),groupOf(id),'Back leads to wrong subpage: '+id);
 }
 // Old and unknown saved panel names restore safely; new names survive a save round trip.
 for(const [saved,expected] of [['ruralForest','ruralForest'],['rural','rural'],['ruralNoSuchPage','kontor']]){
  const restored=await page.evaluate(saved=>{const data=JSON.parse(HK.serialize(HK.state));data._presentation.panel=saved;data._presentation.tab='place';HK.startWithState(HK.deserialize(JSON.stringify(data)));HK.setSpeed(0);return{panel:HK.UI.panel,saved:JSON.parse(HK.serialize(HK.state))._presentation.panel};},saved);
  assert.deepEqual(restored,{panel:expected,saved:expected},'Restore of '+saved);
 }
 await page.evaluate(()=>{HK.loop=()=>{};HK.setSpeed(0);HK.UI.action({action:'ruralopen'});});
 const pure=await page.evaluate(()=>HK.serialize(HK.state));
 for(let i=0;i<3;i++)await page.evaluate(()=>{for(const p of ['rural','ruralFields','ruralMill','ruralForest','ruralDeliveries']){HK.UI['panel_'+p]();HK.UI.action({action:'ruralopen',section:p});}HK.UI.action({action:'ruralopen'});});
 assert.equal(await page.evaluate(()=>HK.serialize(HK.state)),pure,'Rendering countryside subpages changes the game state');
 for(const width of [320,390])for(const lang of ['de','en']){
  await page.setViewportSize({width,height:900});await page.evaluate(lang=>HK.setLang(lang),lang);
  for(const panel of ['rural','ruralFields','ruralMill','ruralForest','ruralDeliveries']){
   await page.evaluate(panel=>HK.UI.action({action:'ruralopen',section:panel}),panel);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Subpage overflow '+panel+'/'+width+'/'+lang);
   assert(await page.evaluate(()=>[...document.querySelectorAll('#sidebar,#area-destinations')].every(e=>e.scrollWidth<=e.clientWidth+1)),'Subpage inner overflow '+panel+'/'+width+'/'+lang);
  }
  if(lang==='de')await page.locator('#side').screenshot({path:`/tmp/hanse-map-audit/rural-subpages-${width}.png`}).catch(()=>{});
 }
 await page.setViewportSize({width:1600,height:1100});await page.evaluate(()=>HK.setLang('de'));
 for(const width of [1600,1024,390,360])for(const lang of ['de','en']){
  await page.setViewportSize({width,height:1100});await page.evaluate(lang=>{HK.setLang(lang);HK.UI.action({action:'ruralopen'});},lang);assert.equal(await page.locator('.rural-site').count(),15);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Catalogue overflow '+width+'/'+lang);
  if(lang==='de'&&[1600,390].includes(width))await page.locator('#side').screenshot({path:`/tmp/hanse-map-audit/rural-catalogue-${width}.png`});
  for(const id of ['cattlefarm','windmill','quarry','stonemason','hunter']){
   await page.evaluate(id=>HK.UI.action({action:'ruralopen',site:id}),id);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Site overflow '+id+'/'+width+'/'+lang);
   assert.equal(await page.locator('#sidebar [data-help=ruralHelp]').count(),1);assert(!(await page.locator('#sidebar').textContent()).includes('NaN'));
   if(id==='cattlefarm'&&lang==='de'&&width===390)await page.locator('#side').screenshot({path:'/tmp/hanse-map-audit/rural-cattle-mobile.png'});
  }
 }
 // Bannmühle, Müller und Erntevorkauf (8.2, 8.3): Pacht im Rathaus, Schalter in der Mühle, Angebot im Frühjahr.
 await page.setViewportSize({width:1600,height:1100});await page.evaluate(()=>{HK.setLang('de');HK.loop=()=>{};HK.setSpeed(0);HK.state.money=100000;const st=HK.state;let d=st.day;while(HK.monthOf(d)!==3)d++;st.day=d;HK.UI.action({action:'ruralopen',site:'windmill'});});
 assert.equal(await page.locator('#sidebar .muehle-section').getAttribute('data-muehle'),'town');assert.equal(await page.locator('#sidebar .muehle-section [data-action=muehlestrecken]').count(),0);
 await page.locator('#sidebar .muehle-section [data-action=open][data-panel=customsLease]').click();assert.equal(await page.evaluate(()=>HK.UI.panel),'customsLease');
 const leasePrice=await page.evaluate(()=>HK.muehlePachtPreis(HK.state)),leaseCash=await page.evaluate(()=>HK.state.money);
 assert((await page.locator('#sidebar [data-action=taxfarm]').count())+(await page.locator('#sidebar .tag.gold').count())>0,'Customs lease section missing next to the mill lease');
 await page.locator('#sidebar .muehle-pacht [data-action=muehlepacht]').click();assert.equal(await page.evaluate(()=>HK.state.money),leaseCash-leasePrice);assert(await page.evaluate(()=>HK.muehlePachtAktiv(HK.state)));
 assert.equal(await page.locator('#sidebar .muehle-pacht [data-action=muehlepacht]').count(),0);
 await page.evaluate(()=>HK.UI.action({action:'ruralopen',site:'windmill'}));assert.equal(await page.locator('#sidebar .muehle-section').getAttribute('data-muehle'),'lease');
 await page.locator('#sidebar [data-action=muehlestrecken]').click();assert(await page.evaluate(()=>HK.state.muehle.strecken));assert.equal(await page.locator('#sidebar .muehle-mueller').getAttribute('data-muehle-strecken'),'on');
 await page.locator('#sidebar [data-action=muehlestrecken]').click();assert(!(await page.evaluate(()=>HK.state.muehle.strecken)));
 await page.evaluate(()=>HK.UI.action({action:'ruralopen',site:'fiberfarm'}));
 const offer=await page.evaluate(()=>HK.vorkaufAngebot(HK.state,'fiberfarm'));assert(offer.ok&&offer.qty===60);
 const farmText=await page.locator('#sidebar .vorkauf-section').textContent();assert(farmText.includes(String(offer.qty))&&farmText.includes(await page.evaluate(p=>HK.fmt(p),offer.price))&&farmText.includes('Verkauf am Markt heute'),'Spring offer shows quantity, price and market comparison');
 assert.equal(await page.locator('#sidebar .vorkauf-section [data-action=vorkauf]').isEnabled(),true);
 const pureMill=await page.evaluate(()=>HK.serialize(HK.state));
 for(let i=0;i<3;i++)await page.evaluate(()=>{for(const site of ['windmill','fiberfarm','grainfarm']){HK.UI.action({action:'ruralopen',site});HK.UI.panel_rural();}HK.UI.action({action:'open',panel:'customsLease'});HK.UI.panel_customsLease();HK.UI.action({action:'ruralopen',site:'fiberfarm'});});
 assert.equal(await page.evaluate(()=>HK.serialize(HK.state)),pureMill,'Rendering mill, farm or lease views changes the game state');
 for(const width of [320,390])for(const lang of ['de','en']){
  await page.setViewportSize({width,height:900});await page.evaluate(lang=>HK.setLang(lang),lang);
  for(const view of [{action:'ruralopen',site:'windmill'},{action:'ruralopen',site:'fiberfarm'},{action:'open',panel:'customsLease'}]){
   await page.evaluate(v=>{HK.UI.action(v);HK.UI.renderAll();},view);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mill/forward overflow '+JSON.stringify(view)+'/'+width+'/'+lang);
   assert(await page.evaluate(()=>[...document.querySelectorAll('#sidebar')].every(e=>e.scrollWidth<=e.clientWidth+1)),'Mill/forward inner overflow '+JSON.stringify(view)+'/'+width+'/'+lang);
   assert(!(await page.locator('#sidebar').textContent()).includes('NaN')&&!(await page.locator('#sidebar').textContent()).includes('undefined'));
  }
  if(lang==='de'&&width===390){await page.evaluate(()=>HK.UI.action({action:'ruralopen',site:'windmill'}));await page.locator('#side').screenshot({path:'/tmp/hanse-map-audit/rural-mill-390.png'}).catch(()=>{});}
 }
 await page.setViewportSize({width:1600,height:1100});await page.evaluate(()=>{HK.setLang('de');HK.UI.action({action:'ruralopen',site:'fiberfarm'});});
 await page.locator('#sidebar [data-action=vorkauf]').click();assert(await page.evaluate(()=>!!HK.state.vorkauf[HK.yearOf(HK.state.day)].fiberfarm));assert.equal(await page.locator('#sidebar .vorkauf-section [data-action=vorkauf]').count(),0);
 await page.evaluate(()=>{const st=HK.state;st.vorkauf={};let d=st.day;while(HK.monthOf(d)!==5)d++;st.day=d;HK.UI.action({action:'ruralopen',site:'fiberfarm'});});
 assert.equal(await page.locator('#sidebar .vorkauf-section [data-action=vorkauf]').count(),0);assert((await page.locator('#sidebar .vorkauf-section').textContent()).includes('Frühjahr'),'Outside spring the farm explains when to buy');
 // Frischware (8.10): drei Betriebe, Kauf für den Stand, Korbknopf in der Personenzeile, reines Rendern, schmale Breiten.
 const shots=process.env.HK_SHOTS||'/tmp/hanse-map-audit';fs.mkdirSync(shots,{recursive:true});
 await page.setViewportSize({width:1600,height:1100});
 await page.evaluate(()=>{HK.setLang('de');HK.loop=()=>{};HK.setSpeed(0);const st=HK.state;st.money=100000;st.stalls=0;st.day=130;st.frisch.stand={};st.frisch.koerbe={};st.persons.priest.loyalty=30;HK.frischErnten(st,false);HK.UI.action({action:'ruralopen',site:'poultry'});});
 assert.equal(await page.locator('#sidebar h2').textContent(),await page.evaluate(()=>HK.name(HK.RURAL_BUILDINGS.poultry)));
 assert.deepEqual(await page.locator('#sidebar [data-frisch]').evaluateAll(es=>es.map(e=>e.dataset.frisch)),['poultry:eggs']);
 assert.equal(await page.locator('#sidebar [data-action=frischkaufen]').count(),0,'Without a stall there is no buy button');
 assert((await page.locator('#sidebar').textContent()).includes(await page.evaluate(()=>HK.t('frischOhneStand'))));
 await page.evaluate(()=>HK.UI.action({action:'ruralopen',site:'orchard'}));assert.deepEqual(await page.locator('#sidebar [data-frisch]').evaluateAll(es=>es.map(e=>e.dataset.frisch)),['orchard:cherries']);
 await page.evaluate(()=>{HK.state.stalls=1;HK.UI.action({action:'tradepage',panel:'marketStalls'});});
 assert.equal(await page.locator('#sidebar [data-frisch-stand]').count(),1);
 let freshCash=await page.evaluate(()=>HK.state.money);
 await page.locator('#sidebar [data-action=frischkaufen][data-site=orchard][data-sorte=cherries][data-qty="1"]').click();
 assert.deepEqual(await page.evaluate(()=>({stand:HK.state.frisch.stand.cherries,hof:HK.state.frisch.hof.orchard.cherries,ledger:HK.state.ledger.at(-1).freshmarket})),{stand:1,hof:7,ledger:-6});
 assert.equal(await page.evaluate(()=>HK.state.money),freshCash-6);
 assert.equal(await page.locator('#sidebar [data-frisch-stand-sorte=cherries]').count(),1,'Stall view lists the basket');
 await page.locator('#sidebar').screenshot({path:shots+'/frischware-stand.png'}).catch(()=>{});
 await page.evaluate(()=>HK.UI.action({action:'ruralopen',site:'poultry'}));freshCash=await page.evaluate(()=>HK.state.money);
 await page.locator('#sidebar [data-action=frischkaufen][data-sorte=eggs]:not([data-qty="1"])').click();
 assert.equal(await page.evaluate(()=>HK.state.frisch.stand.eggs),6);assert.equal(await page.evaluate(()=>HK.state.money),freshCash-24);
 assert.equal(await page.evaluate(()=>HK.state.warehouse.stock.eggs),undefined,'Fresh produce never enters the warehouse');
 await page.evaluate(()=>HK.UI.sceneClick({kind:'building',building:HK.BUILDING.church,panel:'church'}));
 assert.equal(await page.locator('#sidebar .korb-gift').count(),0,'Basket control without baskets');
 await page.evaluate(()=>{HK.state.frisch.koerbe={apples:2,cabbage:1};HK.UI.renderAll();});
 assert(await page.locator('#sidebar .korb-gift').count()>=1,'Basket control missing in the person row');
 await page.locator('#sidebar [data-korb-sorte=priest]').selectOption('cabbage');await page.evaluate(()=>HK.UI.renderAll());
 assert.equal(await page.locator('#sidebar [data-korb-sorte=priest]').inputValue(),'cabbage','Basket choice survives a redraw');
 await page.locator('#sidebar [data-korb-sorte=priest]').selectOption('apples');
 const loyal=await page.evaluate(()=>HK.state.persons.priest.loyalty);freshCash=await page.evaluate(()=>HK.state.money);
 await page.locator('#sidebar [data-action=korbschenken][data-person=priest]').click();
 assert.deepEqual(await page.evaluate(()=>HK.state.frisch.koerbe),{apples:1,cabbage:1});
 const gained=await page.evaluate(()=>HK.state.persons.priest.loyalty)-loyal;assert(gained>=4&&gained<=8,'Basket gift raises loyalty by 4 to 8: '+gained);assert.equal(await page.evaluate(()=>HK.state.money),freshCash,'A basket costs no money');
 const pureFresh=await page.evaluate(()=>HK.serialize(HK.state));
 for(let i=0;i<3;i++)await page.evaluate(()=>{for(const site of HK.FRISCH_SITES){HK.UI.action({action:'ruralopen',site});HK.UI.panel_rural();}HK.UI.action({action:'tradepage',panel:'marketStalls'});HK.UI.panel_marketStalls();HK.UI.sceneClick({kind:'building',building:HK.BUILDING.church,panel:'church'});HK.UI.renderAll();});
 assert.equal(await page.evaluate(()=>HK.serialize(HK.state)),pureFresh,'Rendering fresh produce views changes the game state');
 for(const width of [320,390])for(const lang of ['de','en']){
  await page.setViewportSize({width,height:900});await page.evaluate(lang=>HK.setLang(lang),lang);
  for(const view of [...['poultry','gardenfarm','orchard'].map(site=>({action:'ruralopen',site})),{action:'tradepage',panel:'marketStalls'},{church:true}]){
   await page.evaluate(v=>{if(v.church)HK.UI.sceneClick({kind:'building',building:HK.BUILDING.church,panel:'church'});else HK.UI.action(v);HK.UI.renderAll();},view);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Fresh produce overflow '+JSON.stringify(view)+'/'+width+'/'+lang);
   assert(await page.evaluate(()=>[...document.querySelectorAll('#sidebar')].every(e=>e.scrollWidth<=e.clientWidth+1)),'Fresh produce inner overflow '+JSON.stringify(view)+'/'+width+'/'+lang);
   const text=await page.locator('#sidebar').textContent();assert(!text.includes('NaN')&&!text.includes('undefined')&&!/frisch[A-Z_]/.test(text),'Missing text '+JSON.stringify(view)+'/'+lang);
  }
  if(lang==='de'&&width===390){await page.evaluate(()=>HK.UI.action({action:'tradepage',panel:'marketStalls'}));await page.locator('#side').screenshot({path:shots+'/frischware-stand-390.png'}).catch(()=>{});}
 }
 await page.setViewportSize({width:1600,height:1100});await page.evaluate(()=>HK.setLang('de'));
 assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',mapSites:sites.length,visibleWorkers:sites.length,stableCamera:true,purchases:true,deliveries:true,reservations:true,craftProduction:true,cropChoice:true,legacy:true,languages:2,widths:4,ruralSubpages:5,millLease:true,forwardHarvest:true,freshProduce:true,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
