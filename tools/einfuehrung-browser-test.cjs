'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 fs.mkdirSync('/tmp/hanse-map-audit',{recursive:true});
 const page=await browser.newPage({viewport:{width:1600,height:1050},locale:'de-DE'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);await page.locator('#new-game-form button[type=submit]').click();
 await page.evaluate(()=>{HK.loop=()=>{};HK.state.speed=0;});
 const bookTab=async tab=>{await page.locator('#city-links [data-place=books]').click();await page.locator(`#tabs [data-tab=${tab}]`).click();};
 const step=async n=>assert.equal(await page.evaluate(()=>HK.state.lehrgang.schritt),n);
 assert.equal(await page.locator('#lehrgang').count(),0);assert.equal(await page.locator('#sidebar .intro-mission').count(),0);
 await bookTab('missions');assert.equal(await page.locator('.intro-mission').count(),1);
 await page.locator('[data-action=missionfocus][data-value=intro]').click();assert.equal(await page.locator('.intro-steps>li').count(),9);await step(0);
 await page.locator('#side').screenshot({path:'/tmp/hanse-map-audit/introduction-mission.png'});
 await page.locator('[data-action=introtime]').click();await step(1);await page.locator('#btn-pause').click();
 await page.locator('[data-action=lehrgang][data-lg=zeig]').click();await step(2);assert.equal(await page.evaluate(()=>HK.UI.panel),'harbour');
 const g=await page.evaluate(()=>{const st=HK.state;st.caravans[0].wants.beer={qty:10,price:40};const v=HK.besucherAlle(st).find(v=>Object.keys(v.wants).some(g=>(st.warehouse.stock[g]||0)>0&&v.wants[g].qty>0));const g=Object.keys(v.wants).find(g=>(st.warehouse.stock[g]||0)>0&&v.wants[g].qty>0);HK.UI.selectedVisitor=v.id;HK.UI.panel=v.sea?'harbour':'gate';HK.UI.inputs.qty=1;HK.UI.setTab('place');return g;});
 await page.locator(`[data-action=vsell][data-good=${g}]`).click();await step(3);
 // Failed economy actions must not complete a mission subgoal or pay a reward.
 assert(await page.evaluate(()=>{const st=HK.state,save=HK.serialize(st);return !HK.acceptContract(st,-123).ok&&!HK.deliverContract(st,-123).ok&&save===HK.serialize(st);}));
 await bookTab('missions');await page.locator('[data-action=missionfocus][data-value=intro]').click();await page.locator('[data-action=lehrgang][data-lg=zeig]').click();assert.equal(await page.evaluate(()=>HK.UI.missionFocus),null);
 const contract=await page.evaluate(()=>HK.state.contracts.offers.find(c=>c.tradeTitle==='grain').id),funds=await page.evaluate(()=>HK.state.money);
 await page.locator(`[data-action=acceptcontract][data-id="${contract}"]`).click();await step(4);assert.equal(await page.evaluate(()=>HK.state.money),funds+250);
 await page.locator('[data-action=missionfocus][data-value=intro]').click();await page.locator('[data-action=lehrgang][data-lg=zeig]').click();await page.locator('[data-action=rumor]').click();await step(5);
 await bookTab('missions');await page.locator('[data-action=missionfocus][data-value=intro]').click();await page.locator('[data-action=lehrgang][data-lg=zeig]').click();assert.equal(await page.evaluate(()=>HK.UI.panel),'market');
 const marketGood=await page.evaluate(()=>HK.GOODS.find(g=>(HK.state.warehouse.stock[g.id]||0)>=1&&HK.marketCap(HK.state,g.id)>=1).id);await page.locator(`[data-action=mselect][data-good=${marketGood}]`).click();await page.locator('[data-action=msell]').click();await step(6);
 await bookTab('planning');await page.locator('.trade-plan-card [data-action=warehousetrade]').click();await page.locator('[data-field=qty]').fill('18');await page.locator('[data-action=mbuy]').click();await bookTab('missions');await page.locator(`[data-action=missionvisit][data-id="${contract}"]`).click();await page.locator(`[data-action=delivercontract][data-id="${contract}"]`).click();await step(7);
 await bookTab('missions');
 await page.locator('[data-action=missionfocus][data-value=intro]').click();await page.locator('[data-action=lehrgang][data-lg=zeig]').click();assert.equal(await page.evaluate(()=>HK.UI.panel),'marketStalls');const stallMoney=await page.evaluate(()=>HK.state.money);await page.locator('[data-action=stall]').click();await step(7);await page.evaluate(()=>{const w=HK.workActive(HK.state,'stalls');HK.state.day=w.due;HK.workDayStart(HK.state);HK.UI.renderAll();});assert((await page.evaluate(()=>HK.state.lehrgang.schritt))>=8);assert.equal(await page.evaluate(()=>HK.state.money),stallMoney-await page.evaluate(()=>HK.CONST.STALL_COST)+500);
 // Save halfway, then continue using the existing mission without restarting.
 await page.evaluate(()=>{const before=HK.serialize({lehrgang:HK.state.lehrgang,money:HK.state.money,rep:HK.state.rep,influence:HK.state.influence,contracts:HK.state.contracts});HK.state=HK.deserialize(HK.serialize(HK.state));const after=HK.serialize({lehrgang:HK.state.lehrgang,money:HK.state.money,rep:HK.state.rep,influence:HK.state.influence,contracts:HK.state.contracts});if(after!==before)throw Error('Load changed mission or rewards');HK.UI.renderAll();});
 if(!(await page.evaluate(()=>HK.state.lehrgang.fertig))){await bookTab('missions');await page.locator('[data-action=missionfocus][data-value=intro]').click();await page.locator('[data-action=lehrgang][data-lg=zeig]').click();await step(9);}assert(await page.evaluate(()=>HK.state.lehrgang.fertig&&HK.state.lehrgang.finished===HK.state.day));assert.equal(await page.locator('#lehrgang').count(),0);assert.equal(await page.locator('.intro-mission').count(),0);
 await bookTab('missions');assert.equal(await page.locator('.intro-mission').count(),0);await page.locator('[data-action=missionfilter][data-value=finished]').click();assert.equal(await page.locator('.intro-mission.done').count(),1);
 assert(await page.evaluate(()=>{const before=HK.serialize(HK.state);for(let i=0;i<5;i++){HK.lehrgangWeiter(HK.state);HK.lehrgangNeu(HK.state);}HK.state=HK.deserialize(HK.serialize(HK.state));return before===HK.serialize(HK.state)&&HK.state.post.journal.some(e=>e.key==='lehrgangFertig'&&e.category==='missions');}),'Completed intro restarts/rewards twice or lacks journal');
 await page.evaluate(()=>{const st=HK.deserialize(HK.serialize(HK.state)),money=st.money;delete st.lehrgang;const old=HK.deserialize(HK.serialize(st));if(!old.lehrgang.fertig||old.money!==money)throw Error('Old save restarted introduction');});
 // Read-only help works with keyboard/touch, remains open across refreshes and does not start time.
 for(const width of [1600,390,360])for(const lang of ['de','en']){
  await page.setViewportSize({width,height:1050});await page.evaluate(lang=>{HK.setLang(lang);HK.UI.missionFilter='all';HK.UI.missionFocus=null;HK.setSpeed(0);},lang);
  for(const view of ['market','planning','missions','mail','log','gate','church']){
   await page.evaluate(view=>{if(['market','gate','church'].includes(view)){HK.UI.panel=view;HK.UI.setTab('place');}else HK.UI.setTab(view);},view);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Overflow '+view+'/'+width+'/'+lang);
   const help=page.locator('#sidebar .context-help').first();assert(await help.count(),'Missing contextual help '+view);
   const before=await page.evaluate(()=>HK.serialize({...HK.state,helpSeen:null}));await help.locator('summary').focus();await page.keyboard.press('Space');assert(await help.evaluate(el=>el.open));assert.equal(await page.evaluate(()=>HK.serialize({...HK.state,helpSeen:null})),before,'Help changes speed or game state beyond its read marker');
   const bounds=await help.locator('.context-help-body').boundingBox();assert(bounds.x>=0&&bounds.x+bounds.width<=width+1,'Help outside viewport '+view+'/'+width);
   if(width===390&&lang==='de'&&view==='market')await page.locator('#side').screenshot({path:'/tmp/hanse-map-audit/context-help-mobile.png'});
   await page.evaluate(()=>HK.UI.renderSidebar());assert(await help.evaluate(el=>el.open),'Refresh closes active help');await page.keyboard.press('Escape');assert.equal(await help.evaluate(el=>el.open),false);
  }
 }
 await page.setViewportSize({width:1600,height:1050});await page.evaluate(()=>{HK.setLang('de');HK.UI.panel='market';HK.UI.setTab('place');});fs.mkdirSync('/tmp/hanse-map-audit',{recursive:true});await page.screenshot({path:'/tmp/hanse-map-audit/compact-market-help.png'});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',introSteps:9,realActions:true,oneTimeRewards:true,saveLoad:true,oldSave:true,archive:true,helpViews:7,languages:2,widths:3,keyboard:true,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
