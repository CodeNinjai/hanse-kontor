'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1500,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);await page.locator('#new-game-form button[type=submit]').click();await page.evaluate(()=>{HK.loop=()=>{};HK.setSpeed(0);});
 const names=['market','gate','marketPrices','marketStalls'];
 await page.locator('#city-links [data-place=market]').click();
 assert.deepEqual(await page.locator('#area-links [data-panel]').evaluateAll(es=>es.map(e=>e.dataset.panel)),names);
 const initialGoods=await page.evaluate(()=>HK.GOODS.length);
 await page.locator('#area-links [data-panel=market]').click();
 assert.equal(await page.locator('.tradebox').count(),1);assert.equal(await page.locator('.goods-list').count(),1);assert.equal(await page.locator('.price-history,.visitor-history,.stall-ownership').count(),0);
 // Real market purchase remains on its original economy action.
 await page.evaluate(()=>{HK.state.money=100000;HK.state.town.stock.grain=50;HK.state.warehouse.stock.grain=0;HK.UI.marketGood='grain';HK.UI.inputs.qty=1;HK.UI.renderAll();});
 const beforeBuy=await page.evaluate(()=>({money:HK.state.money,stock:HK.state.town.stock.grain,wh:HK.state.warehouse.stock.grain}));
 await page.locator('[data-action=mbuy][data-good=grain]').click();
 assert(await page.evaluate(({money,stock,wh})=>HK.state.money<money&&HK.state.town.stock.grain<stock&&HK.state.warehouse.stock.grain>wh,beforeBuy),'Market purchase did not change economy');
 // Four independent renderers stay free of game-state writes and duplicate major content.
 await page.evaluate(()=>{HK.dockCaravan(HK.state,'umland');const v=HK.state.caravans[0];v.wants.beer={qty:8,price:180};HK.state.warehouse.stock.beer=10;HK.UI.selectedVisitor=v.id;HK.UI.marketGood='fish';HK.UI.inputs.goodGroup='all';HK.UI.renderAll();});
 const purity=await page.evaluate(()=>{const before=JSON.stringify(JSON.parse(HK.serialize(HK.state)));for(const p of ['market','gate','marketPrices','marketStalls'])HK.UI['panel_'+p]();return before===JSON.stringify(JSON.parse(HK.serialize(HK.state)));});assert(purity,'A market renderer mutated saved game state');
 await page.locator('#area-links [data-panel=gate]').click();assert.equal(await page.evaluate(()=>HK.UI.panel),'gate');assert.equal(await page.evaluate(()=>HK.Scene.district),'gate');assert(await page.locator('.visitor-goods').count()>=1);assert.equal(await page.locator('#city-links [data-place=market]').getAttribute('aria-pressed'),'true');
 // Click a caravan on the map and confirm the trading context remains associated with the market area.
 const caravanId=await page.evaluate(()=>HK.state.caravans[0].id);await page.evaluate(id=>HK.UI.sceneClick({kind:'visitor',id,panel:'gate'}),caravanId);assert.equal(await page.evaluate(()=>HK.Presentation.currentArea()),'market');assert.equal(await page.evaluate(()=>HK.UI.selectedVisitor),caravanId);
 const gateRestore=await page.evaluate(()=>{const st=HK.deserialize(HK.serialize(HK.state));HK.startWithState(st);return [HK.UI.panel,HK.Scene.selected,HK.UI.selectedVisitor,HK.Scene.district];});assert.deepEqual(gateRestore,['gate','gate',caravanId,'gate']);
 await page.locator('[data-action=vsell][data-good=beer]').click();assert(await page.evaluate(()=>HK.state.warehouse.stock.beer<10),'Caravan trade did not consume warehouse stock');
 await page.locator('#area-links [data-panel=marketPrices]').click();assert.equal(await page.locator('.visitor-history').count(),1);assert.equal(await page.locator('tr.preis-zeile').count(),initialGoods);assert.equal(await page.locator('tr.preis-zeile.offen').getAttribute('data-good'),'fish');assert.equal(await page.locator('.menu-art.preis-symbol').count(),initialGoods);
 const price=await page.evaluate(()=>HK.marketBuyPrice(HK.state,'fish',1));assert.equal(Number((await page.locator('tr.preis-zeile[data-good=fish] .p-kauf').textContent()).replace(/\D/g,'')),price);
 await page.locator('tr.preis-zeile[data-good=salt] .preis-ware').click();assert.equal(await page.locator('tr.preis-zeile.offen').getAttribute('data-good'),'salt');assert.equal(await page.locator('.visitor-history').count(),1);
 // Zeitraum, Sortierung und Filter sind reine Ansicht
 await page.locator('[data-action=preiszeit][data-tage="7"]').click();assert.equal(await page.evaluate(()=>HK.UI.inputs.preisZeit),7);
 await page.locator('[data-action=preissort][data-key=markt]').click();const sorted=await page.locator('tr.preis-zeile .p-kauf').evaluateAll(es=>es.map(e=>+e.textContent.replace(/\D/g,'')));assert.deepEqual(sorted,[...sorted].sort((a,b)=>b-a));
 await page.locator('[data-action=preislager]').click();assert(await page.locator('tr.preis-zeile').count()<initialGoods);await page.locator('[data-action=preislager]').click();
 await page.locator('tr.preis-zeile[data-good=salt] .preis-ware').click();assert.equal(await page.locator('tr.preis-detail').count(),0);await page.locator('tr.preis-zeile[data-good=salt] .preis-ware').click();assert.equal(await page.locator('tr.preis-detail').count(),1);assert.deepEqual(await page.evaluate(()=>[HK.UI.marketGood,HK.UI.inputs.goodGroup]),['salt','all']);
 await page.locator('#area-links [data-panel=market]').click();assert.equal(await page.evaluate(()=>HK.UI.marketGood),'salt');assert.equal(await page.locator('#market-good-salt').count(),1);
 await page.locator('#area-links [data-panel=marketPrices]').click();await page.locator('[data-action=marketpricegood][data-good=wine]').click();assert.equal(await page.evaluate(()=>HK.UI.marketGood),'wine');
 const saved=await page.evaluate(()=>{const st=HK.deserialize(HK.serialize(HK.state));HK.startWithState(st);return [HK.UI.panel,HK.UI.marketGood,HK.UI.inputs.goodGroup];});assert.deepEqual(saved,['marketPrices','wine','all']);
 await page.locator('#area-links [data-panel=market]').click();await page.evaluate(()=>{HK.UI.marketGood=HK.GOOD_GROUPS.materials[0];HK.UI.renderAll();});await page.locator('#market-good-group').selectOption('materials');const filteredSave=await page.evaluate(()=>{const st=HK.deserialize(HK.serialize(HK.state));HK.startWithState(st);return [HK.UI.panel,HK.UI.marketGood,HK.UI.inputs.goodGroup,HK.GOOD_GROUPS.materials[0]];});assert.deepEqual(filteredSave.slice(0,3),['market',filteredSave[3],'materials']);
 await page.locator('#area-links [data-panel=marketStalls]').click();assert.equal(await page.locator('.stall-ownership').count(),1);assert.equal(await page.locator('.market-details,.visitor-history,.goods-list').count(),0);
 await page.evaluate(()=>{HK.state.money=100000;HK.UI.renderAll();});const funds=await page.evaluate(()=>HK.state.money),stallCost=await page.evaluate(()=>HK.CONST.STALL_COST);await page.locator('[data-action=stall]').click();assert.equal(await page.evaluate(()=>HK.state.stalls),0);assert.equal(await page.evaluate(()=>HK.workActive(HK.state,'stalls')?.due-HK.state.day),2);assert.equal(await page.evaluate(()=>HK.state.money),funds-stallCost);
 await page.evaluate(()=>{const w=HK.workActive(HK.state,'stalls');HK.state.day=w.due;HK.workDayStart(HK.state);HK.UI.renderAll();});assert.equal(await page.evaluate(()=>HK.state.stalls),1);
 // Help and business portfolio land on their specific market pages.
 await page.evaluate(()=>HK.UI.businessPortfolio());
 await page.evaluate(()=>{HK.UI.panel='kontor';HK.UI.setTab('place');HK.state.stalls=1;HK.UI.renderAll();});await page.locator('.business-portfolio summary').click();await page.locator('.business-assets [data-panel=marketStalls]').click();assert.equal(await page.evaluate(()=>HK.UI.panel),'marketStalls');
 await page.setViewportSize({width:320,height:850});
 for(const lang of ['de','en']){await page.evaluate(l=>HK.setLang(l),lang);for(const p of names){await page.locator(`#area-links [data-panel=${p}]`).click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Horizontal page overflow ${p}/${lang}`);assert(await page.locator('#sidebar').evaluate(el=>el.scrollWidth<=el.clientWidth+1),`Sidebar overflow ${p}/${lang}`);}}
 await page.setViewportSize({width:390,height:850});for(const p of names){await page.locator(`#area-links [data-panel=${p}]`).click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow ${p}/390`);}
 assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',tradePages:4,renderPure:true,marketBuy:true,caravanTrade:true,gateCamera:true,priceRows:initialGoods,selectedGoodSaveLoad:true,stallBuildDays:2,stallFinishes:true,portfolioLink:true,widths:[320,390],languages:2,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
