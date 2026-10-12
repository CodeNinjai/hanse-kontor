'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1800,height:1250}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);await page.locator('#new-game-form button[type=submit]').click();
 await page.evaluate(()=>{HK.loop=()=>{};HK.setSpeed(0);HK.UI.lehrgangAktion('zu');HK.UI.panel='kontor';HK.UI.setTab('place');});
 assert.equal(await page.locator('.finance-stat').count(),3);assert.equal(await page.locator('.finance-flow').count(),2);assert.equal(await page.locator('.operations-panel').count(),0);assert.equal(await page.locator('.money-amount .money-amount').count(),0);
 await page.locator('#sidebar').screenshot({path:'/tmp/hanse-kontor-finanzen.png'});
 await page.locator('#area-links [data-panel=staff]').click();assert.equal(await page.locator('.operations-panel').count(),1);
 const money=await page.evaluate(()=>HK.state.money);await page.locator('[data-action=hirefactor]').click();assert.equal(await page.evaluate(()=>HK.state.money),money-1500);assert(await page.locator('.finance-person-heading').first().innerText());assert.equal(await page.locator('[data-action=dismissfactor]').count(),1);
 await page.locator('[data-action=fleetworker]').click();assert.equal(await page.evaluate(()=>HK.state.operations.workers.length),1);assert.equal(await page.evaluate(()=>HK.state.money),money-1560);assert.match(await page.locator('.finance-handling').innerText(),/80 \/ 80/);await page.locator('[data-action=fleetfireworker]').click();assert.equal(await page.evaluate(()=>HK.state.operations.workers.length),0);
 const pure=await page.evaluate(()=>{const saved=HK.serialize(HK.state);HK.UI.renderAll();const root=HK.UI.sidebar,before=root.innerHTML;HK.MoneyUI.decorate(root);HK.MoneyUI.decorate(root);return {state:saved===HK.serialize(HK.state),idempotent:before===root.innerHTML};});assert(pure.state&&pure.idempotent);
 // Currency-only recognition must not decorate quantities, dates or influence.
 const decoration=await page.evaluate(()=>{const root=document.createElement('div');root.innerHTML='<p>12 Last, 30 Ruf, 10 %, 1. März 1372; −1.200 Mark, +50 marks.</p><strong>3.000 <small>Mark</small></strong><button data-action="example">10 Mark</button><input data-field="loan" value="1000"><select><option>500 Mark</option></select>';HK.MoneyUI.decorate(root);const once=root.innerHTML;HK.MoneyUI.decorate(root);return{n:root.querySelectorAll('.money-amount').length,nested:root.querySelectorAll('.money-amount .money-amount').length,unchanged:once===root.innerHTML,option:root.querySelector('option').innerHTML,input:root.querySelector('input').value,button:root.querySelector('button').dataset.action};});assert.equal(decoration.n,4);assert.equal(decoration.nested,0);assert(decoration.unchanged);assert.equal(decoration.option,'500 Mark');assert.equal(decoration.input,'1000');assert.equal(decoration.button,'example');
 for(const lang of ['de','en'])for(const width of [1800,1500,390,320]){
  await page.setViewportSize({width,height:1250});await page.evaluate(lang=>{HK.setLang(lang);HK.UI.renderAll();},lang);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page '+width+lang);
  for(const el of await page.locator('.finance-stat,.finance-flow,.finance-cost,.finance-person-card').all())assert(await el.evaluate(e=>e.scrollWidth<=e.clientWidth+2),'card overflow '+width+lang);
  assert.equal(await page.locator('.money-amount .money-amount').count(),0);
  assert(!/finance[A-Z]|undefined|NaN/.test(await page.locator('#sidebar').innerText()));
 }
 await page.evaluate(()=>{HK.UI.panel='market';HK.UI.setTab('place');});assert.equal(await page.locator('.commodity-prices .money-amount').count(),await page.evaluate(()=>HK.GOODS.length*2));
 await page.evaluate(()=>{HK.UI.modal('<h2>Test</h2><p>Preis: 800 Mark. 12 Last.</p><button data-close>Schließen</button>');HK.UI.toast('Erhalten: 50 Mark');});assert.equal(await page.locator('#modal .money-amount').count(),1);assert(await page.locator('#toasts .money-amount').count()>0);await page.locator('#modal [data-close]').click();
 await page.evaluate(()=>{HK.UI.panel='staff';HK.state.money=0;HK.UI.setTab('place');});assert(await page.locator('[data-action=fleetworker]').isDisabled());assert(await page.locator('#worker-hire-reason').innerText());assert.deepEqual(errors,[]);
 console.log(JSON.stringify({result:'PASS',finances:true,hiring:true,coins:true,idempotent:true,modals:true,locales:2,widths:4,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
