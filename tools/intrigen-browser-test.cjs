'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1500,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);await page.locator('#new-game-form button[type=submit]').click();
 await page.evaluate(()=>{HK.loop=()=>{};HK.setSpeed(0);HK.UI.lehrgangAktion('zu');const s=HK.state;s.day=5;s.guildMember=true;s.rep=35;s.influence=40;s.money=60000;HK.intrigueSync(s);HK.UI.setTab('missions');});
 assert.equal(await page.locator('[data-mission^=intrigue-]').count(),2);
 await page.locator('[data-action=intrigueopen][data-story=monopoly]').click();await page.locator('[data-choice=start]').click();
 assert.equal(await page.locator('.intrigue-choice').count(),13);
 assert(await page.locator('[data-choice=pact]').isDisabled());
 for(const lang of ['de','en'])for(const width of [1500,390,320]){
  await page.setViewportSize({width,height:1100});await page.evaluate(lang=>{HK.setLang(lang);HK.UI.renderAll();document.querySelectorAll('.intrigue-group').forEach(el=>el.open=true);},lang);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page overflow '+lang+width);
  assert(await page.locator('.intrigue-story').evaluate(el=>el.scrollWidth<=el.clientWidth+2),'story overflow '+lang+width);
  assert(!/ig_[a-zA-Z_]+|undefined|NaN/.test(await page.locator('.intrigue-story').innerText()),'missing copy '+lang);
 }
 await page.setViewportSize({width:1500,height:1100});await page.evaluate(()=>{HK.setLang('de');HK.UI.renderAll();});
 await page.locator('[data-choice=bribe]').locator('..').locator('summary').click();assert.match(await page.locator('[data-choice=bribe]').locator('..').innerText(),/Verdacht \+5/);
 await page.screenshot({path:'/tmp/hanse-intrigen.png'});
 const pure=await page.evaluate(()=>{const before=JSON.stringify(HK.state);for(const story of ['monopoly','property'])HK.UI.intriguePanel(story);HK.UI.missionRecords();return JSON.stringify(HK.state)===before;});assert(pure);
 await page.locator('[data-choice=bribe]').click();assert.equal(await page.evaluate(()=>HK.state.intrigue.monopoly.evidence),2);assert.equal(await page.locator('[data-choice=steal]').count(),0);
 await page.locator('[data-choice=build]').click();assert(!(await page.evaluate(()=>HK.state.town.projects.well)));assert(await page.locator('[data-choice=pact]').isDisabled());await page.evaluate(()=>{const st=HK.state,due=st.works.active[0].due;while(st.day<due)HK.tick(st);HK.UI.renderAll();});assert(await page.evaluate(()=>HK.state.town.projects.well));
 await page.locator('[data-choice=pact]').click();assert(await page.evaluate(()=>HK.state.intrigue.pact));
 await page.locator('[data-help=igHelp] summary').click();assert.match(await page.locator('[data-help=igHelp]').innerText(),/Mitwisser/);
 // Actual day tick, mail, answer and saved game round trip.
 await page.evaluate(()=>{const m=HK.state.post.messages.find(m=>m.type==='intrigue'&&m.ref.story==='witness');if(!m)throw Error('No witness letter');HK.UI.postSelected=m.id;HK.UI.setTab('mail');});
 await page.locator('.post-letter [data-action=intrigueopen]').click();assert.equal(await page.locator('.intrigue-choice').count(),3);
 for(const width of [390,320]){await page.setViewportSize({width,height:1100});assert(await page.locator('.intrigue-story').evaluate(el=>el.scrollWidth<=el.clientWidth+2));}
 await page.locator('[data-choice=confess]').click();assert.equal(await page.evaluate(()=>HK.state.intrigue.witness.ending),'confess');
 // Separate story and a real building purchase, upgrade and kept property.
 await page.evaluate(()=>{const s=HK.state;s.intrigue.property.house=s.houses.find(h=>h.owner==='npc').id;HK.UI.missionFocus='intrigue:property';HK.UI.renderAll();});
 await page.locator('[data-choice=start]').click();await page.locator('[data-choice=buy]').click();await page.locator('[data-choice=upgrade]').click();assert.equal(await page.locator('[data-choice=keep]').count(),0);await page.evaluate(()=>{const st=HK.state,due=st.works.active[0].due;while(st.day<due)HK.tick(st);HK.UI.renderAll();});await page.locator('[data-choice=keep]').click();
 assert.equal(await page.evaluate(()=>HK.intrigueBacked(HK.state)),1);
 await page.locator('[data-action=businessplace]').click();assert.equal(await page.evaluate(()=>HK.UI.panel),'house');assert.equal(await page.evaluate(()=>HK.UI.plot),await page.evaluate(()=>HK.state.intrigue.property.house));
 await page.evaluate(()=>{HK.autosave();HK.loadGame();HK.setSpeed(0);HK.UI.missionFocus=null;HK.UI.missionFilter='finished';HK.UI.setTab('missions');});
 assert.equal(await page.locator('[data-mission^=intrigue-]').count(),3);
 assert(await page.evaluate(()=>HK.state.intrigue.pact));
 assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',stories:3,build:true,property:true,pact:true,witness:true,saveLoad:true,pureViews:pure,widths:3,languages:2,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
