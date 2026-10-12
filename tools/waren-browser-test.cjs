'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
  const page=await browser.newPage({viewport:{width:1600,height:1100},locale:'de-DE'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);
  await page.locator('#new-game-form button[type=submit]').click();
  await page.evaluate(()=>{HK.loop=()=>{};HK.setSpeed(0);HK.state.money=100000;HK.UI.panel='market';HK.UI.setTab('place');});
  await page.locator('#qty-input').fill('1');
  const ids=['hemp','flax','pitch','bricks','honey','cheese','rope','canvas'];
  for(const id of ids){
    await page.locator('#market-good-'+id).click();
    assert.equal(await page.locator('.selected-good-picture').getAttribute('data-menu-art'),id);
    const before=await page.evaluate(id=>({money:HK.state.money,price:HK.marketBuyPrice(HK.state,id,1)}),id);
    await page.locator('[data-action=mbuy]').click();
    assert.equal(await page.evaluate(()=>HK.state.money),before.money-before.price);
    assert.equal(await page.evaluate(id=>HK.state.warehouse.stock[id],id),1);
    await page.locator('[data-action=msell]').click();
    assert.equal(await page.evaluate(id=>HK.state.warehouse.stock[id]||0,id),0);
  }
  const state=await page.evaluate(()=>{const data=JSON.parse(HK.serialize(HK.state));delete data._presentation;return JSON.stringify(data);});
  for(const group of ['food','materials','maritime','textiles','luxury','all']){
    await page.locator('#market-good-group').selectOption(group);
    const expected=await page.evaluate(group=>group==='all'?HK.GOODS.length:HK.GOOD_GROUPS[group].length,group);
    assert.equal(await page.locator('.goods-grid .commodity').count(),expected);
    assert.equal(await page.locator('.goods-grid [aria-pressed=true]').count(),1);
    const selected=await page.locator('[data-action=mbuy]').getAttribute('data-good');
    assert(await page.evaluate(({group,selected})=>group==='all'||HK.GOOD_GROUPS[group].includes(selected),{group,selected}));
    assert(await page.locator('#market-good-group').evaluate(el=>el===document.activeElement));
  }
  assert.equal(await page.evaluate(()=>{const data=JSON.parse(HK.serialize(HK.state));delete data._presentation;return JSON.stringify(data);}),state,'Category filters mutate the economy');
  // A warehouse shortcut must clear a previously selected incompatible category.
  await page.locator('#market-good-canvas').click();await page.locator('[data-action=mbuy]').click();
  await page.locator('#market-good-group').selectOption('food');
  await page.evaluate(()=>{const b=HK.BUILDING.warehouse;HK.UI.sceneClick({kind:'building',building:b,panel:b.panel});});
  await page.locator('[data-action=warehousetrade][data-good=canvas]').click();
  assert.equal(await page.locator('#market-good-group').inputValue(),'all');assert.equal(await page.locator('#market-good-canvas').getAttribute('aria-pressed'),'true');
  // Purchase both new licences and buildings using their actual menu controls.
  await page.evaluate(()=>{HK.state.guildMember=true;HK.UI.panel='guild';HK.UI.renderAll();});
  for(const type of ['ropemaker','sailweaver'])await page.locator(`[data-action=license][data-type=${type}]`).click();
  for(const [plot,type] of [[0,'ropemaker'],[1,'sailweaver']]){
    await page.evaluate(plot=>{HK.UI.panel='workshop';HK.UI.plot=plot;HK.UI.renderAll();},plot);
    await page.locator(`[data-action=buildws][data-type=${type}]`).click();
    const due=await page.evaluate(plot=>HK.workActive(HK.state,'workshop:'+plot)?.due,plot);assert(Number.isInteger(due),'Workshop construction was not scheduled');
    await page.evaluate(due=>{HK.state.day=due;HK.workDayStart(HK.state);HK.UI.renderAll();},due);
    assert.equal(await page.evaluate(plot=>HK.state.workshops[plot].type,plot),type);
    await page.evaluate(()=>{HK.Scene.zeigeAuf(22,17);HK.Scene.draw();});await page.waitForTimeout(150);
  }
  // Load a save from before the extra goods and inspect each new market/price view.
  const migrated=await page.evaluate(ids=>{
    const saved=JSON.parse(HK.serialize(HK.state)), money=saved.money, warehouse=JSON.stringify(saved.warehouse);
    for(const id of ids){delete saved.town.stock[id];for(const p of saved.priceHistory)delete p.goods[id];}
    const st=HK.deserialize(JSON.stringify(saved));HK.startWithState(st);HK.setSpeed(0);
    return{cash:st.money===money,warehouse:JSON.stringify(st.warehouse)===warehouse,supplied:ids.every(id=>st.town.stock[id]>0)};
  },ids);assert.deepEqual(migrated,{cash:true,warehouse:true,supplied:true});
  fs.mkdirSync('/tmp/hanse-map-audit',{recursive:true});
  for(const width of [1600,1024,390,360])for(const lang of ['de','en']){
    await page.setViewportSize({width,height:1100});await page.evaluate(lang=>{HK.setLang(lang);HK.UI.panel='market';HK.UI.setTab('place');},lang);
    await page.locator('#market-good-group').selectOption('all');assert.equal(await page.locator('.goods-grid .commodity').count(),await page.evaluate(()=>HK.GOODS.length));
    assert(await page.locator('#market-good-group option').evaluateAll(els=>els.every(el=>el.textContent&&!el.textContent.includes('goodGroup_'))));
    for(const id of ids){await page.locator('#market-good-'+id).click();assert.equal(await page.locator('[data-action=mbuy]').getAttribute('data-good'),id);assert(!(await page.locator('#sidebar').textContent()).includes('NaN'));}
    for(const group of ['maritime','textiles']){
      await page.locator('#market-good-group').selectOption(group);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Page overflow '+width+'/'+lang+'/'+group);
      assert(await page.locator('.goods-grid').evaluate(el=>el.scrollWidth<=el.clientWidth),'Goods grid overflow');
      if(lang==='de' && [1600,390].includes(width))await page.locator('#side').screenshot({path:`/tmp/hanse-map-audit/goods-${group}-${width}.png`});
    }
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',nativeTrades:16,newWorkshops:2,categoryFilters:6,oldSave:true,warehouseShortcut:true,languages:2,widths:4,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
