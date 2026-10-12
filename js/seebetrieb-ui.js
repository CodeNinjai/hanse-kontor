'use strict';
Object.assign(HK.UI,{
 shipyardCatalogue(){
  const st=HK.state,orders=st.operations.orders,fishOrders=orders.filter(o=>o.type==='fishingBoat').length;
  const counts=[['yardBerths',orders.length,2],['yardFishing',st.boats,HK.CONST.BOAT_MAX,fishOrders],['yardTrading',st.ownShips.length,HK.CONST.MAX_OWN_SHIPS,orders.length-fishOrders]];
  return `<div class="ship-catalogue">${this.helpHeading('yardChoose','yardCatalogueHelp',3)}
   <div class="ship-yard-summary">${counts.map(([key,n,max,pending])=>`<span>${HK.t(key)} <b>${n}/${max}</b>${pending?` <small>${HK.t('yardPending',{n:pending})}</small>`:''}</span>`).join('')}</div>
   <div class="fleet-builds ship-build-grid">${['fishingBoat',...HK.SHIP_TYPES.map(t=>t.id)].map(type=>{
    const fishing=type==='fishingBoat',t=HK.SHIP_TYPE[type],d=HK.FLEET_TYPES[type],q=HK.fleetOrderQuote(st,type);
    const cost=q.cost??(fishing?HK.CONST.BOAT_PRICE:HK.shipTypePrice(st,type)),name=fishing?HK.t('fishingBoat'):HK.name(t);
    const reason=q.ok?'':q.msg==='notEnoughMoney'?HK.t('actionMissing',{money:HK.fmt(Math.max(0,cost-st.money))}):q.msg==='maxShips'?HK.t(fishing?'yardFishingFull':'yardTradingFull'):HK.t(q.msg);
    return `<article class="ship-build-card" data-ship-type="${type}" aria-labelledby="yard-name-${type}">
     <div class="ship-build-heading">${HK.MenuArt.ship(type)}<div><span class="ship-purpose">${HK.t(fishing?'yardFishingPurpose':'yardTradingPurpose')}</span><h4 id="yard-name-${type}">${name}</h4></div></div>
     <p class="ship-build-description">${HK.t(fishing?'yardFishingDescription':'fleetType_'+type)}</p>
     <dl class="ship-build-facts"><div><dt>${HK.t(fishing?'yardCatch':'yardHold')}</dt><dd>${HK.t(fishing?'yardCatchValue':'yardHoldValue',{n:fishing?HK.CONST.BOAT_FISH:t.cap})}</dd></div><div><dt>${HK.t('yardDuration')}</dt><dd>${HK.t('yardDays',{n:fishing?3:d.days})}</dd></div></dl>
     <p class="ship-build-preparation">${HK.t(fishing?'yardFishingReady':'yardCrewNeeded',{n:d?.crew})}</p>
     <div class="ship-build-footer"><div class="ship-build-price"><small>${HK.t('yardPrice')}</small><strong>${HK.fmt(cost)} <small>${HK.t('mark')}</small></strong></div><button class="primary" data-action="${fishing?'buyboat':'buyship'}" ${fishing?'':`data-type="${type}"`} aria-label="${this.esc(HK.t('yardCommission',{name}))}" ${q.ok?'':`disabled aria-describedby="yard-reason-${type}"`}>${HK.t('actionBuild')}</button></div>
     <small class="ship-build-reason" id="yard-reason-${type}" ${reason?'':'aria-hidden="true"'}>${reason}</small>
    </article>`;
   }).join('')}</div>
   ${orders.length?`<div class="ship-yard-orders"><h3>${HK.t('yardOrders')}</h3>${orders.map(o=>{const p=HK.shipBuildProgress(st,o);return `<article class="yard-progress"><h4>${HK.t('yardStage'+p.phase)}</h4><progress max="100" value="${p.percent}" aria-label="${HK.t('yardProgress',{step:p.index+1,count:p.count,percent:p.percent})}"></progress><small>${HK.t('yardProgress',{step:p.index+1,count:p.count,percent:p.percent})}</small><p>${HK.t('fleetBuilding',{ship:o.type==='fishingBoat'?HK.t('fishingBoat'):HK.name(HK.SHIP_TYPE[o.type]),date:HK.fmtDate(o.due)})}</p>${this.fleetButton('fleetcancel',HK.t('fleetCancel'),o.id,'',st.day>=o.due)}</article>`;}).join('')}</div>`:''}</div>`;
 },
 panel_fleet(){return this.head(HK.t('fleetOverview'),'', 'fleetHelp')+`<div class="btn-row">${this.foreignLink()}${this.fleetButton('fleetgo',HK.t('fleetYard'),0,'data-panel="shipyard"')}</div>`+this.ownShips()+this.operationsPanel(false)+(HK.state.operations.losses.length?`<details><summary>${HK.t('fleetLost')}</summary>${HK.state.operations.losses.map(l=>`<p>${this.esc(l.ship)} · ${HK.fmtDate(l.day)}<br>${HK.t('fleetEvent_wreck')}</p>`).join('')}</details>`:'');},
 fleetButton(action,label,id,more='',disabled=false){return `<button class="small" data-action="${action}" data-id="${id}" ${more} ${disabled?'disabled':''}>${label}</button>`;},
 operationsPanel(){const st=HK.state,O=st.operations,q=HK.operationsQuote(st),used=O.handlingDay===st.day?O.handling:0,ledger=st.ledger.at(-1)||{};return `<section class="operations-panel">${this.helpHeading('operationsTitle','operationsHelp',3)}<dl class="warehouse-facts">${[['operationsShips',q.ships],['operationsWorkers',q.workers],['operationsBuildings',q.buildings]].map(([k,n])=>`<div><dt>${HK.t(k)}</dt><dd>${HK.fmt(n)} ${HK.t('mark')}/${HK.t('day')}</dd></div>`).join('')}</dl><small>${HK.t('operationsOther',{n:HK.fmt(-['wages','interest','upkeep'].reduce((n,k)=>n+Math.min(0,ledger[k]||0),0))})}</small><p>${HK.t('operationsWorkersLine',{n:O.workers.length,free:Math.max(0,Math.floor(O.workers.length*80-used))})}</p><div class="btn-row">${this.fleetButton('fleetworker',HK.t('operationsHire'),0,'',st.gameOver||st.money<60||O.workers.length>=8||O.debt>0)}${this.fleetButton('fleetfireworker',HK.t('operationsDismiss'),0,'',!O.workers.length||O.debt>0)}</div>${O.debt?`<p class="negative">${HK.t('fleetDebt',{n:HK.fmt(O.debt)})}</p>${this.fleetButton('fleetpay',HK.t('fleetPay'),0,'',st.money<O.debt)}`:''}${O.workers.length?`<details><summary>${HK.t('operationsWorkers')}</summary>${O.workers.map(p=>this.esc(p.name)).join(' · ')}</details>`:''}</section>`;},
 fleetShipPanel(s){const st=HK.state,f=s.fleet;if(!f)return '';const def=HK.FLEET_TYPES[s.type],port=s.status==='port',dest=HK.ORIGIN[this.inputs.dest]?.sea?this.inputs.dest:'luebeck',ready=HK.fleetReady(st,s,dest),disabled=!port||st.gameOver;
 let h=`<section class="fleet-panel">${this.helpHeading('fleetTitle','fleetHelp',3)}<h3>${this.esc(s.name)} · ${HK.name(HK.SHIP_TYPE[s.type])}</h3><div class="intrigue-dossier"><b>${HK.t('fleetMorale',{n:Math.round(f.morale)})}</b><span>${HK.t('fleetDaily',{n:HK.fleetDailyCost(st,s)})}</span></div>`;
 if(f.legacy)return h+`<p>${HK.t('fleetLegacy')}</p></section>`;
 h+=`<p>${HK.t('fleetRoster',{n:f.crew.length,need:def.crew,cook:f.cook?this.esc(f.cook.name):HK.t('fleetNoCook')})}</p><div class="btn-row">${!s.captain?this.fleetButton('fleetgo',HK.t('fleetCaptain'),s.id,'data-panel="shipyard"'):''}${f.crew.length<def.crew?this.fleetButton('fleethire',HK.t('fleetHireCrew',{cost:(def.crew-f.crew.length)*20}),s.id,'data-role="crew"',disabled||f.debt>0||st.money<(def.crew-f.crew.length)*20):this.fleetButton('fleetfire',HK.t('fleetDismissCrew'),s.id,'data-role="crew"',disabled||f.debt>0)}${!f.cook?this.fleetButton('fleethire',HK.t('fleetHireCook'),s.id,'data-role="cook"',disabled||f.debt>0||st.money<50):this.fleetButton('fleetfire',HK.t('fleetDismissCook'),s.id,'data-role="cook"',disabled||f.debt>0)}</div>`;
 h+=`<details><summary>${HK.t('fleetCrew')}</summary>${[s.captain?.name,...f.crew.map(p=>p.name),f.cook?.name].filter(Boolean).map(n=>this.esc(n)).join(' · ')||'—'}</details>`;
 if(f.debt)h+=`<p class="negative">${HK.t('fleetDebt',{n:HK.fmt(f.debt)})}</p>${this.fleetButton('fleetpay',HK.t('fleetPay'),s.id,'',st.money<f.debt)}`;
 h+=`<h4>${HK.t('fleetFood')}</h4>${port?`<small>${HK.t('fleetTripNeed',{city:HK.name(HK.ORIGIN[dest]),days:HK.fleetTripDays(st,s,dest)+3,qty:Math.ceil((HK.fleetTripDays(st,s,dest)+3)*HK.fleetPeople(s)/150)})}</small>`:''}<p>${HK.t('fleetFoodLine',{n:Math.floor(HK.fleetFood(s)),days:Math.floor(HK.fleetFood(s)/Math.max(1,HK.fleetPeople(s))),space:Math.ceil(HK.fleetFood(s)/150)})}</p><div class="btn-row">${HK.FLEET_FOOD.map(g=>this.fleetButton('fleetfood',HK.t('fleetFoodAdd',{qty:1,good:HK.goodName(g)}),s.id,`data-good="${g}"`,disabled||!HK.fleetHandling(st,1).ok||(st.warehouse.stock[g]||0)<1||HK.goodQuality(st,g)<85||HK.shipCap(s)-HK.stockUsed(s.cargo)<1)).join('')}${HK.fleetFood(s)?this.fleetButton('fleetunfood',HK.t('fleetFoodUnload'),s.id,'',disabled):''}</div>`;
 h+=`<h4>${HK.t('fleetCapital',{n:HK.fmt(f.capital)})}</h4><div class="btn-row">${[1000,5000].map(n=>this.fleetButton('fleetfund',HK.t('fleetFund',{n:HK.fmt(n)}),s.id,`data-amount="${n}"`,disabled||st.money<n)).join('')}${f.capital?this.fleetButton('fleetfund',HK.t('fleetWithdraw'),s.id,`data-amount="${-f.capital}"`,disabled):''}</div>`;
 if(port)h+=`<p class="${ready.ok?'positive':'negative'}">${ready.ok?HK.t('fleetReady',{city:HK.name(HK.ORIGIN[dest])}):HK.t(ready.msg)}</p>`;
 if(f.events?.length)h+=`<details><summary>${HK.t('journal')}</summary>${f.events.map(e=>`<p><small>${HK.fmtDate(e.day)}</small><br>${HK.t('fleetEvent_'+e.kind,e)}</p>`).join('')}</details>`;
 return h+'</section>';
 }
});
{
 const yard=HK.UI.panel_shipyard;
 HK.UI.panel_shipyard=function(){return yard.call(this)+`<section>${this.fleetButton('fleetgo',HK.t('fleetOpen'),0,'data-panel="harbour"')}</section>`;};
 const ships=HK.UI.ownShips;HK.UI.ownShips=function(){const body=ships.call(this),s=HK.state.ownShips.find(s=>s.id===this.selectedOwnShip);return (s?this.fleetShipPanel(s):'')+body;};
 for(const name of ['panel_warehouse','panel_kontor']){const original=HK.UI[name];if(original)HK.UI[name]=function(){return original.call(this)+(name==='panel_kontor'?this.businessPortfolio():'');};}
 const action=HK.UI.action;HK.UI.action=function(d){const st=HK.state,id=Number(d.id);let r;
  switch(d.action){case 'fleetgo':if(id){this.selectedOwnShip=id;this.inputs.hireship=id;}this.panel=d.panel==='shipyard'?'shipyard':'fleet';this.setTab('place');this.sidebar.scrollTop=0;return;
   case 'fleetcancel':r=HK.cancelShipOrder(st,id);break;case 'fleethire':r=HK.fleetHire(st,id,d.role);break;case 'fleetfire':r=HK.fleetDismiss(st,id,d.role);break;
   case 'fleetfood':r=HK.fleetProvision(st,id,d.good,1);break;case 'fleetunfood':r=HK.fleetUnloadFood(st,id);break;case 'fleetfund':r=HK.fleetFund(st,id,Number(d.amount));break;
   case 'fleetpay':r=HK.fleetPayDebt(st,id);break;case 'fleetworker':r=HK.hireWarehouseWorker(st);break;case 'fleetfireworker':r=HK.dismissWarehouseWorker(st);break;default:return action.call(this,d);}
  this.result(r);this.renderAll();HK.scheduleSave?.();
 };
 const post=HK.postActions;HK.postActions=function(st,m){return m.type==='fleet'?[]:post(st,m);};
 const letter=HK.UI.postLetterBody;HK.UI.postLetterBody=function(m){if(m.type!=='fleet')return letter.call(this,m);return `<b>${this.esc(m.ref.ship)}</b><p>${HK.t('fleetEvent_'+m.ref.kind,m.ref)}</p>`+this.fleetButton('fleetgo',HK.t('fleetOpen'),0,'data-panel="harbour"');};
}
