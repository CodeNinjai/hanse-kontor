'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const p=await b.newPage({viewport:{width:1440,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.HK_URL||'http://localhost:8778');await p.waitForFunction(()=>HK.PixiScene.bereit);await p.locator('#new-game-form button[type=submit]').click();
 await p.evaluate(()=>{HK.loop=()=>{};HK.setSpeed(0);HK.UI.showHelp('gambling');});await p.locator('[data-help-place="0"]').click();
 await p.locator('#bet-input').fill('90');const money=await p.evaluate(()=>HK.state.money);await p.locator('[data-action="dicestart"]').click();assert.equal(await p.evaluate(()=>HK.state.money),money-90);
 await p.evaluate(()=>{HK.state.diceGame.round.seed=0;});await p.locator('[data-action="diceroll"][data-count="2"]').click();assert.equal(await p.locator('.dice-face').count(),2);assert(await p.locator('[data-action="dicebank"]').isVisible());
 const saved=await p.evaluate(()=>HK.serialize(HK.state));await p.evaluate(()=>{HK.UI.setTab('overview');HK.UI.action({action:'businessplace',building:'tavern'});});assert.equal(await p.evaluate(()=>JSON.stringify(HK.state.diceGame)),JSON.stringify(JSON.parse(saved).diceGame));assert.equal(await p.evaluate(()=>HK.state.money),JSON.parse(saved).money);
 await p.evaluate(saved=>{HK.state=HK.deserialize(saved);HK.UI.renderAll();},saved);assert.equal(await p.evaluate(()=>HK.state.diceGame.round.throws.length),1);
 await p.locator('[data-action="dicebank"]').click();const round=await p.evaluate(()=>HK.state.diceGame.round);assert.equal(await p.evaluate(()=>HK.state.money),money-90+round.payout);assert.equal(await p.locator('[data-action="dicebank"]').count(),0);
 await p.locator('[data-action="diceagain"]').click();await p.locator('#bet-input').fill('201');await p.locator('[data-action="dicestart"]').click();assert.equal(await p.evaluate(()=>HK.state.diceGame.round.status),'banked');
 await p.locator('#bet-input').fill('90');await p.locator('[data-action="dicestart"]').click();await p.evaluate(()=>{const r=HK.state.diceGame.round;r.seed=0;HK.diceRoll(HK.state,2,r.id,0);HK.UI.renderAll();});
 for(const lang of ['de','en'])for(const width of [1440,390,320]){await p.setViewportSize({width,height:900});await p.evaluate(lang=>HK.setLang(lang),lang);assert(await p.locator('.tavern-dice').evaluate(el=>el.scrollWidth<=el.clientWidth+1));assert(!(await p.locator('.tavern-dice').innerText()).includes('diceOne'));}
 await p.setViewportSize({width:1440,height:1000});await p.evaluate(()=>HK.setLang('de'));await p.locator('.tavern-dice').screenshot({path:'/tmp/hanse-dice.png'});
 await p.emulateMedia({reducedMotion:'reduce'});await p.locator('[data-action="diceroll"][data-count="1"]').click();assert.equal(await p.locator('.dice-face').evaluate(el=>el.getAnimations().length),0);
 await p.locator('[data-help="gambleHelp"] summary').click();assert.match(await p.locator('[data-help="gambleHelp"]').innerText(),/30 Mark Gewinn/);assert.deepEqual(errors,[]);
 console.log('PASS: handbook route, interactive dice, real accounting, leave/resume/load, invalid stake, DE/EN at 1440/390/320, reduced motion, help; screenshot /tmp/hanse-dice.png');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
