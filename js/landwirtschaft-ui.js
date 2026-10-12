'use strict';
Object.assign(HK.UI,{
  ruralCycleText(days){return HK.t(days===1?'ruralDaily':'ruralCycle',{days});},
  ruralOrderQuote(id,good){
    const st=HK.state,s=st.rural.sites[id];let qty=Math.min(this.qty(),Math.floor(s.stock[good]||0),Math.max(0,Math.floor(HK.whFree(st))));
    while(qty>0&&!HK.ruralQuote(st,id,good,qty).ok)qty=Math.floor(qty*.9);
    return{...HK.ruralQuote(st,id,good,qty),qty};
  },
  ruralOrderOffer(id,good){
    const q=this.ruralOrderQuote(id,good),s=HK.state.rural.sites[id];
    return `<div class="rural-order-offer" data-rural-quote="${good}">${q.ok?`<span class="rural-order-price"><b>${HK.fmt(q.cost)} <small>${HK.t('mark')}</small></b><small>${HK.t('ruralOrderQuantity',{qty:q.qty})}</small><small>${HK.t(s.owner?'ruralFreightOnly':'ruralPriceBreakdown',{goods:HK.fmt(q.goods),freight:HK.fmt(q.freight)})}</small><small>${HK.t('ruralEarliest',{date:HK.fmtDate(q.eta)})}</small></span>`:`<small class="decision-reason" id="rural-order-reason-${good}">${HK.t(q.msg||'actionUnavailable')}</small>`}<button class="small ${q.ok?'primary':''}" data-action="ruralorder" data-site="${id}" data-good="${good}" data-qty="${q.qty}" ${q.ok?'':`disabled aria-describedby="rural-order-reason-${good}"`}>${HK.t(s.owner?'ruralCollect':'ruralOrder')}</button></div>`;
  },

  ruralDeliveryPanel(){
    const pending=HK.ruralWaiting(HK.state);if(!pending.length)return'';
    return `<section class="rural-deliveries"><h3>${HK.t('ruralDeliveries')}</h3>${this.ruralDeliveryRows()}</section>`;
  },
  ruralDeliveryRows(){
    return HK.ruralWaiting(HK.state).map(d=>`<article class="warehouse-delivery" data-rural-delivery="${d.id}">${HK.MenuArt.good(d.good)}<div><b>${d.qty} ${HK.t('unitLast')} ${HK.goodName(d.good)}</b><small>${HK.name(HK.RURAL_BUILDINGS[d.site])} → ${HK.t('warehouseBuilding')}</small><strong class="delivery-eta">${HK.t('tradeEta',{date:HK.fmtDate(Math.max(HK.state.day+1,d.eta))})}</strong>${this.warehouseRoute(1)}${this.cityQualityBadge(d.quality)}<button class="small" data-action="ruralopen" data-site="${d.site}">${HK.t('warehouseSupplier')} →</button></div></article>`).join('');
  },
  ruralRecipe(inp,out){return `<div class="rural-recipe">${Object.entries(inp||{}).map(([g,q])=>`<span>${HK.MenuArt.good(g)}<small>${q} ${HK.t('unitLast')} ${HK.goodName(g)}</small></span>`).join('')}${Object.keys(inp||{}).length?'<b aria-hidden="true">→</b>':''}${Object.entries(out).map(([g,q])=>`<span>${HK.MenuArt.good(g)}<small>${q} ${HK.t('unitLast')} ${HK.goodName(g)}</small></span>`).join('')}</div>`;},
  panel_rural(){
    const st=HK.state,b=this.selBuilding(),id=b&&HK.RURAL_SITES[b.id]?b.id:null;
    let h=this.head(id?HK.name(b):HK.t('ruralTitle'),'','ruralHelp');
    if(!id){
      h+=`<div class="rural-grid">${Object.entries(HK.RURAL_SITES).map(([site,d])=>{const s=st.rural.sites[site];return `<button class="rural-site" data-action="ruralopen" data-site="${site}">${HK.MenuArt.good(Object.keys(d.out)[0])}<b>${HK.name(HK.RURAL_BUILDINGS[site])}</b><small>${HK.t(s.owner?'ruralOwned':'ruralLocal')} · ${this.ruralCycleText(d.period)}</small>${s.reason?`<span class="tag">${HK.t(s.reason)}</span>`:''}</button>`;}).join('')}</div>`;
      h+=`<section><h3>${HK.t('ruralProduction')}</h3><div class="btn-row">${['butcher','tannery','bakery'].map(site=>`<button class="small" data-action="businessplace" data-building="${site}">${HK.name(HK.BUILDING[site])}</button>`).join('')}</div></section>`;return h+this.ruralDeliveryPanel();
    }
    const s=st.rural.sites[id],d=HK.RURAL_SITES[id],out=d.crops?{[s.crop]:s.crop==='grain'?12:10}:d.out;
    h+=`<nav class="btn-row location-actions" aria-label="${HK.t('actionLocation')}"><button class="small work-back" data-action="ruralopen">← ${HK.t('ruralTitle')}</button><button class="small map-action" data-action="ruralshow" data-site="${id}" title="${HK.t('ruralShowMap')}" aria-label="${HK.t('ruralShowMap')}">${HK.MenuArt.symbol('map')}<span>${HK.t('actionMap')}</span></button></nav>`;
    const farm=id.endsWith('farm'),orderTitle=s.owner?'ruralOwnStock':farm?'ruralFarmOrder':'ruralProducerOrder';
    h+=`<section class="rural-order-section">${this.helpHeading(orderTitle,'ruralOrderHelp')}<span class="tag">${HK.t(s.owner?'ruralOwned':'ruralLocal')}</span>`;
    const stock=Object.entries(s.stock).filter(([,qty])=>qty>=1);
    if(stock.length){
      h+=`${this.qtyRow()}<div class="rural-stock">`;
      for(const [g,quantity] of stock){
        h+=`<article class="rural-stock-row">${HK.MenuArt.good(g)}<div><b>${HK.goodName(g)}</b><small>${HK.t('ruralAvailable',{qty:Math.floor(quantity)})} · ${HK.t('ruralQuality',{quality:Math.round(s.quality[g]??100)})}</small>${this.ruralOrderOffer(id,g)}</div></article>`;
      }
      h+='</div>';
    }else h+=`<p class="hint">${HK.t(s.owner?'ruralOwnStockEmpty':'ruralStockEmpty')}</p>`;
    h+=`</section><section class="rural-ownership">${this.helpHeading(s.owner?'ruralManage':farm?'ruralFarmBuy':'ruralBusinessBuy','ruralOwnershipHelp')}`;
    if(!s.owner)h+=`<p class="hint">${HK.t('ruralStockExcluded')}</p>`;
    h+=`${this.helpHeading('ruralBatchOutput','ruralProductionHelp')}${this.ruralRecipe(d.inp,out)}<small>${this.ruralCycleText(d.period)} · ${HK.t(s.owner?'ruralWages':'ruralOwnerWages',{cost:d.wage})}</small><p>${HK.t(s.active?'ruralNext':'ruralPaused',{date:HK.fmtDate(s.next)})}${s.reason?` · <span class="tag">${HK.t(s.reason)}</span>`:''}</p>${d.extra?`<p class="hint">${HK.t('ruralGrainExtra')}</p>`:''}${d.resource?`<p>${HK.t('ruralResource',{qty:Math.floor(s.resource),max:d.resource})}${d.regrow?` · ${HK.t('ruralRegrow',{qty:d.regrow})}`:''}</p>`:''}`;
    if(s.owner){
      h+=`<button class="small" data-action="ruralpause" data-site="${id}">${HK.t(s.active?'ruralPause':'ruralResume')}</button>`;
      if(d.crops)h+=`<div class="rural-crops">${s.nextCrop?`<p>${HK.t('ruralQueuedCrop',{good:HK.goodName(s.nextCrop)})}</p>`:''}<h3>${HK.t('ruralCrop')}${this.contextualHelp('ruralCropHelp',HK.t('ruralCrop'))}</h3>${['grain','hemp','flax'].map(g=>`<button class="small ${(s.nextCrop||s.crop)===g?'primary':''}" data-action="ruralcrop" data-site="${id}" data-good="${g}" ${(s.nextCrop||s.crop)===g?'disabled':''}>${HK.goodName(g)}</button>`).join('')}</div>`;
    }else h+=`<button class="small" data-action="ruralbuy" data-site="${id}" ${st.money<d.cost?'disabled':''}>${HK.t('ruralBuy',{cost:HK.fmt(d.cost)})}</button>`;
    return h+'</section>'+this.ruralDeliveryPanel();
  },
});
const ruralUIAction=HK.UI.action;
HK.UI.action=function(d){
  if(d.action==='ruralopen'){
    const b=HK.RURAL_BUILDINGS[d.site];this.returnContext=null;this.panel='rural';HK.Scene.selected=b?.id||null;this.setTab('place');this.sidebar.scrollTop=0;return;
  }
  if(d.action==='ruralshow'){const b=HK.RURAL_BUILDINGS[d.site];if(b)HK.Scene.zeigeAuf(b.x+b.w/2,b.y+b.d/2);return;}
  let r;
  if(d.action==='ruralbuy')r=HK.buyRural(HK.state,d.site);
  else if(d.action==='ruralorder')r=HK.orderRural(HK.state,d.site,d.good,this.ruralOrderQuote(d.site,d.good).qty);
  else if(d.action==='ruralpause')r=HK.toggleRural(HK.state,d.site);
  else if(d.action==='ruralcrop')r=HK.setRuralCrop(HK.state,d.site,d.good);
  else if(d.action==='ruralcraft')r=HK.setRuralCraft(HK.state,d.site);
  else return ruralUIAction.call(this,d);
  this.result(r);HK.scheduleSave?.();this.renderAll();
};
const ruralUIInit=HK.UI.init;
HK.UI.init=function(){ruralUIInit.call(this);this.sidebar.addEventListener('input',e=>{
  if(e.target.dataset.field!=='qty'||this.panel!=='rural')return;
  for(const b of this.sidebar.querySelectorAll('[data-action=ruralorder]')){
    b.closest('.rural-order-offer').outerHTML=this.ruralOrderOffer(b.dataset.site,b.dataset.good);
  }
});};

const ruralVenture=HK.UI.panel_venture;
HK.UI.panel_venture=function(){
  let h=ruralVenture.call(this);const id=this.selBuilding()?.id;if(!HK.RURAL_RECIPES[id])return h;const d=HK.ruralCraftRecipe(HK.state,id);
  if(id==='bakery')return h+`<section>${this.helpHeading('ruralNeeds','ruralHelp')}${HK.MenuArt.good('flour')} ${HK.goodName('flour')}</section>`;
  const produce=HK.state.rural.crafts[id]==='produce',owned=HK.hasVenture(HK.state,id);
  h+=`<section class="rural-craft"><h3>${HK.t('ruralProduction')}${this.contextualHelp('ruralHelp',HK.t('ruralProduction'))}</h3>${this.ruralRecipe(d.inp,d.out)}<small>${HK.t('ruralWages',{cost:d.wage})}</small>`;
  if(owned)h+=`<p><b>${HK.t(produce?'ruralProduction':'ruralIncome')}</b>${produce&&HK.state.rural.craftStatus?.[id]?` · ${HK.t(HK.state.rural.craftStatus[id])}`:''}</p><button class="small" data-action="ruralcraft" data-site="${id}">${HK.t('ruralCraftSwitch')}</button>`;
  return h+'</section>';
};
const ruralPanelTitle=HK.UI.panelTitle;
HK.UI.panelTitle=function(){if(this.panel==='rural')return HK.RURAL_SITES[HK.Scene.selected]?HK.name(HK.RURAL_BUILDINGS[HK.Scene.selected]):HK.t('ruralTitle');return ruralPanelTitle.call(this);};
