'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);
 await page.locator('#new-game-form button[type=submit]').click();await page.evaluate(()=>{HK.loop=()=>{};HK.setSpeed(0);});
 assert.equal(await page.locator('#city-links [data-place=kontor]').getAttribute('aria-label'),'Handelshaus');
 for(const panel of ['market','kontor','harbour','townhall','rural']){
  await page.locator(`#city-links [data-place=${panel}]`).click();
  assert.deepEqual(await page.evaluate(()=>[HK.UI.tab,HK.UI.panel]),['place',panel]);
  assert.equal(await page.locator('#city-links .active').count(),1);
  assert.equal(await page.locator('#tabs .active').count(),0);
  assert(await page.locator('#place-return').isHidden());
 }
 assert.equal(await page.locator('.rural-site').count(),12);
 assert.deepEqual(await page.locator('#city-links [data-place]').evaluateAll(es=>es.map(e=>e.dataset.place)),['market','kontor','harbour','townhall','rural','books']);
 const ruralCam=await page.evaluate(()=>JSON.stringify(HK.Scene.cam));
 await page.locator('[data-action=ruralopen][data-site=hunter]').click();
 await page.locator('#city-links [data-place=books]').click();await page.locator('#tabs [data-tab=planning]').click();await page.locator('#place-return button').click();
 assert.equal(await page.evaluate(()=>HK.Scene.selected),'hunter');
 await page.locator('#city-links [data-place=rural]').click();assert.equal(await page.locator('.rural-site').count(),12);
 assert.equal(await page.evaluate(()=>JSON.stringify(HK.Scene.cam)),ruralCam);
 assert.equal(await page.locator('.rural-entry').count(),0);
 // Books form a sixth area and their second-level pages retain warehouse context.
 await page.locator('#city-links [data-place=kontor]').click();
 assert.deepEqual(await page.locator('#area-links [data-panel]').evaluateAll(es=>es.map(e=>e.dataset.panel)),['kontor','warehouse','staff','agreements']);
 await page.locator('#area-links [data-panel=warehouse]').click();
 const cam=await page.evaluate(()=>JSON.stringify(HK.Scene.cam));
 for(const tab of ['overview','planning','missions','log','mail']){
  await page.locator('#city-links [data-place=books]').click();
  if(tab!=='overview')await page.locator(`#tabs [data-tab=${tab}]`).click();
  assert.equal(await page.evaluate(()=>HK.UI.tab),tab);
  assert(await page.locator('#area-links').isVisible());assert(await page.locator('#area-destinations').isHidden());assert(await page.locator('#tabs').isVisible());
  assert.equal(await page.locator('#city-links [data-place].active').count(),1);assert(await page.locator('#city-links [data-place=books]').evaluate(el=>el.classList.contains('active')));
  assert.equal(await page.locator('#tabs [aria-current=page]').getAttribute('data-tab'),tab);
  assert.equal(await page.locator('#tab-place-label').textContent(),'Lagerhaus');
  assert.equal(await page.locator('.action-heading > .menu-art').count(),1);
  await page.locator('#place-return button').click();
  assert.deepEqual(await page.evaluate(()=>[HK.UI.tab,HK.UI.panel]),['place','warehouse']);
  assert(await page.locator('#area-destinations').isVisible());assert(await page.locator('#tabs').isHidden());
  assert.equal(await page.evaluate(()=>JSON.stringify(HK.Scene.cam)),cam);
 }
 await page.locator('#area-links [data-panel=staff]').click();
 assert.equal(await page.locator('.office-factor').count(),1);assert.equal(await page.locator('.finance-warehouse-staff').count(),1);
 await page.locator('#area-links [data-panel=agreements]').click();assert.equal(await page.locator('.office-factor,.finance-warehouse-staff').count(),0);assert.equal(await page.locator('#sidebar h2').textContent(),'Verträge');
 await page.locator('#city-links [data-place=books]').click();await page.locator('#tabs [data-tab=planning]').focus();await page.keyboard.press('Space');
 assert.equal(await page.evaluate(()=>HK.UI.tab),'planning');assert.equal(await page.evaluate(()=>HK.state.speed),0);
 await page.locator('#place-return button').focus();await page.keyboard.press('Enter');
 assert.equal(await page.evaluate(()=>HK.UI.panel),'agreements');assert.equal(await page.evaluate(()=>HK.UI.tab),'place');
 // Laws expose the actual prerequisite, and an enabled motion still reaches gameplay.
 await page.locator('#city-links [data-place=townhall]').click();
 const ratPanels=['townhall','rightsOffices','laws','monopolyLease','townProjects','customsLease'];
 assert.deepEqual(await page.locator('#area-links [data-panel]').evaluateAll(es=>es.map(e=>e.dataset.panel)),ratPanels);
 const ratExpect={townhall:['[data-action=run]'],rightsOffices:['[data-action=pardon]','[data-action=buymarque]'],laws:['#law-cost','[data-action=propose]'],monopolyLease:['[data-action=pacht]'],townProjects:['[data-action=project]'],customsLease:['[data-action=taxfarm]']};
 for(const panel of ratPanels){
  await page.locator(`#area-links [data-panel=${panel}]`).click();
  assert.equal(await page.evaluate(()=>HK.UI.panel),panel);
  assert.equal(await page.locator(`#area-links [data-panel=${panel}]`).getAttribute('aria-current'),'page');
  assert.equal(await page.locator(`#area-links [data-panel=${panel}] .section-picture`).count(),1);
  assert(await page.locator(ratExpect[panel].join(',')).first().count(),`Missing content/action on ${panel}`);
  const absent=ratPanels.filter(other=>other!==panel).flatMap(other=>ratExpect[other]);
  for(const selector of absent)assert.equal(await page.locator(selector).count(),0,`Content from another Rat page leaked into ${panel}: ${selector}`);
 }
 const navPureBefore=await page.evaluate(()=>{const state=JSON.parse(HK.serialize(HK.state));delete state._presentation;return JSON.stringify(state);});
 await page.locator('#area-links [data-panel=rightsOffices]').click();
 const navPureAfter=await page.evaluate(()=>{const state=JSON.parse(HK.serialize(HK.state));delete state._presentation;return JSON.stringify(state);});
 assert.equal(navPureAfter,navPureBefore,'Changing Rat subpages changed game state');
 const renderPure=await page.evaluate(()=>{const before=HK.serialize(HK.state);for(const panel of ['townhall','rightsOffices','laws','monopolyLease','townProjects','customsLease'])HK.UI['panel_'+panel]();return before===HK.serialize(HK.state);});
 assert(renderPure,'Rat page rendering changed serialized game state');
 // Pardon and office actions live only on Rights & offices; domain rules remain enforced.
 await page.locator('#area-links [data-panel=townhall]').click();
 assert.equal(await page.locator('[data-action=pardon],[data-action=buymarque],[data-action=appointoffice]').count(),0);
 await page.locator('#area-links [data-panel=rightsOffices]').click();
 assert.equal(await page.locator('[data-action=pardon]').count(),1);
 assert.equal(await page.locator('.action-heading [data-menu-art="section-rightsOffices"]').count(),1,'Rights & offices uses its section icon in the panel heading');
 await page.evaluate(()=>{HK.state.ventures.dive={owner:false,level:1};HK.state.network={watch:true};HK.UI.renderAll();});
 assert.equal(await page.locator('[data-action=pardon]:not([disabled])').count(),0,'Pardon must require clean hands');
 assert(await page.locator('#sidebar').textContent().then(t=>t.includes('Erst Spelunke und Netzwerk aufgeben.')),'Pardon clean-hands prerequisite is explained');
 await page.evaluate(()=>{HK.state.money=100000;HK.state.rep=60;HK.state.suspicion=20;HK.state.network={};HK.UI.renderAll();});
 await page.evaluate(()=>{delete HK.state.ventures.dive;HK.UI.renderAll();});
 const pardonBefore=await page.evaluate(()=>({money:HK.state.money,rep:HK.state.rep,cost:HK.pardonCost(HK.state)}));
 await page.locator('[data-action=pardon]').click();
 const pardonAfter=await page.evaluate(()=>({money:HK.state.money,rep:HK.state.rep,suspicion:HK.state.suspicion,active:!!HK.state.pardon}));
 assert.equal(pardonAfter.active,true,'Pardon action did not complete');assert.equal(pardonBefore.money-pardonAfter.money,pardonBefore.cost);assert.equal(pardonAfter.rep,pardonBefore.rep+5);assert.equal(pardonAfter.suspicion,0);
 await page.evaluate(()=>{HK.state.pardon=null;HK.state.seat='none';HK.state.money=100000;HK.state.rep=49;HK.state.marque=null;HK.UI.renderAll();});
 assert.equal(await page.locator('[data-action=buymarque]:not([disabled])').count(),0,'Without a council seat, the letter of marque requires reputation 50');
 await page.evaluate(()=>{HK.state.seat='councillor';HK.UI.renderAll();});
 assert.equal(await page.locator('[data-action=buymarque]:not([disabled])').count(),1,'A council seat permits a letter of marque below reputation 50');
 await page.locator('[data-action=buymarque]').click();
 assert(await page.evaluate(()=>HK.hasMarque(HK.state)),'Letter of marque action did not complete');
 await page.evaluate(()=>{HK.state.seat='none';HK.UI.renderAll();});
 await page.evaluate(()=>{HK.state.seat='mayor';HK.state.influence=40;HK.state.money=100000;HK.UI.renderAll();});
 assert.equal(await page.locator('[data-action=appointoffice][data-who=own]').count(),4,'Mayor should see all four available offices');
 const officeBefore=await page.evaluate(()=>({money:HK.state.money,influence:HK.state.influence,holder:HK.state.persons.customs.holder}));
 await page.locator('[data-action=appointoffice][data-person=customs][data-who=own]').click();
 const officeAfter=await page.evaluate(()=>({money:HK.state.money,influence:HK.state.influence,holder:HK.state.persons.customs.holder}));
 assert.equal(officeAfter.holder,'own');assert.equal(officeBefore.money-officeAfter.money,2500);assert.equal(officeBefore.influence-officeAfter.influence,15);
 await page.evaluate(()=>{HK.state.seat='none';HK.UI.renderAll();});
 assert.equal(await page.locator('[data-action=appointoffice]').count(),0,'Office appointments must require mayor status');
 // Save/load and book return preserve this virtual Rat page and map context.
 await page.evaluate(()=>{HK.UI.panel='rightsOffices';HK.Scene.selected=null;HK.Scene.focusDistrict('market');HK.UI.setTab('place');});
 const rightsSave=await page.evaluate(()=>{const state=HK.deserialize(HK.serialize(HK.state));HK.startWithState(state);return[HK.UI.tab,HK.UI.panel,HK.Scene.selected];});
 assert.deepEqual(rightsSave,['place','rightsOffices',null]);
 await page.locator('#city-links [data-place=books]').click();await page.locator('#tabs [data-tab=planning]').click();
 await page.locator('#place-return button').click();assert.deepEqual(await page.evaluate(()=>[HK.UI.tab,HK.UI.panel]),['place','rightsOffices']);
 await page.evaluate(()=>{HK.state.influence=5;HK.UI.renderAll();});
 await page.locator('#area-links [data-panel=laws]').click();
 assert.match(await page.locator('#law-cost').textContent(),/20 Einfluss.*15 Einfluss/);
 assert.equal(await page.locator('[data-action=propose]:enabled').count(),0);
 await page.locator('[data-help=councilLawsHelp] summary').click();
 assert(await page.locator('[data-help=councilLawsHelp]').getAttribute('open')!==null);
 await page.locator('.council-laws').screenshot({path:'/tmp/hanse-menu-laws.png'});
 await page.evaluate(()=>{HK.state.influence=40;HK.UI.renderAll();});
 await page.locator('[data-action=propose]').first().click();
 assert([20,25].includes(await page.evaluate(()=>HK.state.influence)));
 // All global views fit both languages and stacked/desktop layouts.
 for(const width of [1600,1024,768,390,360,320])for(const lang of ['de','en']){
  await page.setViewportSize({width,height:800});await page.evaluate(lang=>HK.setLang(lang),lang);
  await page.locator('#city-links [data-place=townhall]').click();await page.locator('#area-links [data-panel=rightsOffices]').click();
  assert.equal(await page.locator('#sidebar h2').textContent(),lang==='de'?'Rechte & Ämter':'Rights & offices');
  assert.equal(await page.locator('#area-links [data-panel=rightsOffices] .section-picture').count(),1);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Body overflow on Rights & offices ${width}/${lang}`);
  assert(await page.locator('#sidebar').evaluate(el=>el.scrollWidth<=el.clientWidth+1),`Panel overflow on Rights & offices ${width}/${lang}`);
  assert(await page.locator('#area-links [data-panel]').evaluateAll(es=>es.every(el=>el.scrollWidth<=el.clientWidth+1&&el.querySelector('span').scrollWidth<=el.querySelector('span').clientWidth+1)),`Rat subnavigation buttons/text overflow ${width}/${lang}`);
  if(lang==='de'&&[1600,390].includes(width)){await page.evaluate(()=>document.querySelector('#toasts')?.replaceChildren());await page.locator('#side').screenshot({path:`/tmp/hanse-rights-offices-${width}.png`});}
  await page.locator('#city-links [data-place=rural]').click();
  assert.equal(await page.locator('.rural-site').count(),12);
  assert(await page.locator('#city-links').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Destination navigation overflow');
  if(lang==='de'&&[1600,390].includes(width))await page.locator('#side').screenshot({path:'/tmp/hanse-rural-menu-'+width+'.png'});
  await page.locator('#city-links [data-place=books]').click();
  for(const tab of ['overview','planning','missions','log','mail']){
   if(tab!=='overview')await page.locator(`#tabs [data-tab=${tab}]`).click();
   assert.equal(await page.locator('#tabs .section-picture').count(),5);
   assert.equal(await page.locator('.panel-eyebrow').count(),1);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Body overflow ${width}/${lang}/${tab}`);
   assert(await page.locator('#sidebar').evaluate(el=>el.scrollWidth<=el.clientWidth+1),`Panel overflow ${width}/${lang}/${tab}`);
  }
 }
 for(const panel of ['staff','agreements']){
  await page.locator('#city-links [data-place=kontor]').click();await page.locator(`#area-links [data-panel=${panel}]`).click();const selected=await page.evaluate(()=>HK.Scene.selected);await page.locator('#city-links [data-place=books]').click();await page.locator('#tabs [data-tab=log]').click();
  const restored=await page.evaluate(()=>{const json=HK.serialize(HK.state),state=HK.deserialize(json);HK.startWithState(state);return [HK.UI.tab,HK.UI.panel,HK.Scene.selected];});
  assert.deepEqual(restored.slice(0,2),['log',panel],`saved navigation context ${panel}`);
  await page.locator('#place-return button').click();assert.deepEqual(await page.evaluate(()=>[HK.UI.tab,HK.UI.panel,HK.Scene.selected]),['place',panel,selected]);
 }
 const citizen=await page.evaluate(()=>{const id=Object.keys(HK.state.population.people)[0];HK.UI.panel='citizen';HK.UI.citizen=id;HK.UI.citizenDestination=null;HK.UI.tab='place';HK.Scene.selected=null;HK.UI.returnContext=null;const state=HK.deserialize(HK.serialize(HK.state));HK.startWithState(state);return{id,current:HK.UI.citizen,title:document.querySelector('#sidebar h2')?.textContent,name:HK.citizenName(HK.state,HK.state.population.people[id])};});
 assert(citizen.id,'A resident is available for the restore check');assert.equal(citizen.current,citizen.id);assert.equal(citizen.title,citizen.name,'Resident profile restored');
 const legacy=await page.evaluate(()=>{const data=JSON.parse(HK.serialize(HK.state));delete data._presentation;HK.UI.returnContext={panel:'staff'};HK.startWithState(HK.deserialize(JSON.stringify(data)));return{panel:HK.UI.panel,tab:HK.UI.tab,returnContext:HK.UI.returnContext};});
 assert.deepEqual(legacy,{panel:'kontor',tab:'place',returnContext:null},'Legacy saves do not inherit stale UI context');
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({result:'PASS',cityPlaces:6,ratPanels:6,ratRenderPure:true,rightsActions:true,subpages:true,books:5,contextReturn:true,saveLoad:true,cameraPreserved:true,keyboard:true,councilMotion:true,widths:6,languages:2,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
