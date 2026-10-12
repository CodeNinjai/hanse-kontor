'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1600,height:1050},locale:'de-DE'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);await page.locator('#new-game-form button[type=submit]').click();await page.evaluate(()=>{HK.loop=()=>{};HK.state.speed=0;});
 const open=async(id)=>page.evaluate(id=>{const b=HK.BUILDING[id];HK.UI.sceneClick({kind:'building',building:b,panel:b.panel});},id);
 // Navigation actions remain aligned; map action moves the camera without buying or opening another panel.
 await page.evaluate(()=>HK.UI.action({action:'ruralopen',site:'grainfarm'}));
 const nav=await page.locator('.location-actions button').evaluateAll(bs=>bs.map(b=>{const r=b.getBoundingClientRect();return{y:r.y,h:r.height};}));
 assert.equal(nav.length,2);assert(Math.abs(nav[0].y-nav[1].y)<1);assert(Math.abs(nav[0].h-nav[1].h)<1);
 assert.equal(await page.locator('.map-action .menu-symbol').count(),1);
 const money=await page.evaluate(()=>HK.state.money);await page.locator('.map-action').click();assert.equal(await page.evaluate(()=>HK.UI.panel),'rural');assert.equal(await page.evaluate(()=>HK.state.money),money);
 // Affordability reasons update and the original button still performs exactly one purchase.
 await page.evaluate(()=>{HK.state.money=50;HK.UI.renderAll();});assert(await page.locator('[data-action=ruralbuy]').isDisabled());assert.match(await page.locator('.decision-reason').textContent(),/Mark/);
 await page.evaluate(()=>{HK.state.money=100000;HK.UI.renderAll();});await page.locator('[data-action=ruralbuy]').click();assert.equal(await page.evaluate(()=>HK.state.money),100000-await page.evaluate(()=>HK.RURAL_SITES.grainfarm.cost));assert(await page.evaluate(()=>HK.state.rural.sites.grainfarm.owner));
 await open('shipyard');assert.equal(await page.locator('[data-action=buyship]').count(),await page.evaluate(()=>HK.SHIP_TYPES.length));
 const cost=await page.evaluate(()=>HK.shipTypePrice(HK.state,'kogge')),before=await page.evaluate(()=>HK.state.money);await page.locator('[data-action=buyship][data-type=kogge]').click();assert.equal(await page.evaluate(()=>HK.state.money),before-cost);assert.equal(await page.evaluate(()=>HK.state.ownShips.length),0);assert.equal(await page.evaluate(()=>HK.state.operations.orders.length),1);await page.evaluate(()=>{HK.state.day=HK.state.operations.orders[0].due;HK.fleetBuildDay(HK.state);});assert.equal(await page.evaluate(()=>HK.state.ownShips.length),1);
 // Exhaustive render sweep across actual city buildings, all rural sites, all books and two languages.
 const report=[];fs.mkdirSync('/tmp/hanse-action-design',{recursive:true});
 for(const width of [1600,1024,768,390,360])for(const lang of ['de','en']){
  await page.setViewportSize({width,height:1050});await page.evaluate(lang=>HK.setLang(lang),lang);
  const result=await page.evaluate(()=>{
   const U=HK.UI,issues=[],panels=new Set();
   const inspect=label=>{
    const s=U.sidebar;
    if(s.scrollWidth>s.clientWidth+2)issues.push(label+': sidebar overflow '+s.scrollWidth+'/'+s.clientWidth);
    if(document.documentElement.scrollWidth>innerWidth)issues.push(label+': page overflow');
    if(/\b(undefined|NaN)\b/.test(s.textContent))issues.push(label+': invalid text');
    for(const btn of s.querySelectorAll('.decision-commit:disabled'))if(!document.getElementById(btn.getAttribute('aria-describedby'))?.textContent)issues.push(label+': missing reason');
   };
   for(const b of HK.BUILDINGS){if(!b.panel||!U['panel_'+b.panel])continue;U.sceneClick({kind:'building',building:b,panel:b.panel});inspect(b.id);panels.add(b.panel);}
   for(const id of Object.keys(HK.RURAL_SITES)){U.action({action:'ruralopen',site:id});inspect(id);}
   for(const tab of ['overview','planning','missions','log','mail']){U.setTab(tab);inspect(tab);}
   return{panels:panels.size,issues};
  });
  report.push({width,lang,...result});
 }
 // Owned, damaged, expanded and poor states expose different actions than an initial game.
 const owned=await page.evaluate(()=>{
  const snapshot=HK.serialize(HK.state),U=HK.UI,st=HK.state,issues=[];
  st.craftGuild=true;st.guildMember=true;st.money=1e7;
  for(const r of st.rivals)r.attitude=80;
  for(const v of HK.VENTURES)HK.buyVenture(st,v.id);
  for(let i=0;i<st.houses.length;i++){HK.buyHouse(st,i);st.houses[i].damaged=true;}
  for(const hs of Object.values(st.burghers)){hs.owner='player';hs.level=1;hs.damaged=false;}
  for(let i=0;i<st.storages.length;i++)HK.buyStorage(st,i);
  for(const b of HK.BUILDINGS){if(!b.panel||!U['panel_'+b.panel])continue;
   for(const funds of [0,1e6]){st.money=funds;U.sceneClick({kind:'building',building:b,panel:b.panel});
    if(U.sidebar.scrollWidth>U.sidebar.clientWidth+2)issues.push(b.id+': owned overflow');
    if(/\b(undefined|NaN)\b/.test(U.sidebar.textContent))issues.push(b.id+': invalid owned text');
   }
  }
  HK.state=HK.deserialize(snapshot);return issues;
 });
 assert.deepEqual(owned,[]);
 const issues=report.filter(r=>r.issues.length);assert.deepEqual(issues,[],JSON.stringify(issues));
 // Shared enhancement is idempotent and must not modify game state.
 await open('shipyard');assert(await page.evaluate(()=>{const before=HK.serialize(HK.state),n=document.querySelectorAll('.decision-purchase').length;HK.ActionDesign.enhance(HK.UI);return before===HK.serialize(HK.state)&&n===document.querySelectorAll('.decision-purchase').length;}));
 for(const width of [1600,390]){
  await page.setViewportSize({width,height:1100});await page.evaluate(()=>HK.setLang('de'));
  for(const id of ['grainfarm','shipyard','church','kontor']){
   if(id==='grainfarm')await page.evaluate(()=>HK.UI.action({action:'ruralopen',site:'grainfarm'}));else await open(id);
   await page.evaluate(()=>{HK.UI.sidebar.scrollTop=0;window.scrollTo(0,0);});
   await page.locator('#side').screenshot({path:`/tmp/hanse-action-design/${id}-${width}.png`});
  }
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',alignedButtons:true,mapAction:true,realPurchases:true,widths:5,languages:2,panels:report[0].panels,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
