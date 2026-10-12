/* Weighted acquisition values shared by delivery contracts. No cash or stock is created here. */
'use strict';
HK.goodsBasisStocks=new WeakMap();
HK.registerGoodsBasis=function(st,holder,stock){
 holder.costBasis ||= {};HK.goodsBasisStocks.set(stock,{st,basis:holder.costBasis});
 for(const [g,qty] of Object.entries(stock))if(qty>0&&!holder.costBasis[g]){const legacy=holder===st.warehouse?st.saltStory?.costs[g]:null;holder.costBasis[g]={qty,value:legacy?.qty?qty*legacy.value/legacy.qty:qty*HK.marketSellPrice(st,g,qty)};}
};
HK.goodsBasisInit=function(st){HK.registerGoodsBasis(st,st.warehouse,st.warehouse.stock);for(const s of st.ownShips)HK.registerGoodsBasis(st,s,s.cargo);};
HK.newGameHooks.push(HK.goodsBasisInit);HK.migrateHooks.push(HK.goodsBasisInit);
HK.goodsValue=function(st,g,qty,holder=st.warehouse){const p=holder.costBasis?.[g];return qty>0?(p?.qty>0?p.value/p.qty:HK.marketSellPrice(st,g,qty))*qty:0;};
HK.saltCost=(st,g,qty)=>HK.goodsValue(st,g,qty);
let transferValue=null;
{
 const add=HK.addStock;HK.addStock=function(stock,g,q,totalCost){
  const reg=HK.goodsBasisStocks.get(stock),before=stock[g]||0,p=reg?.basis[g];
  const oldValue=reg?HK.goodsValue(reg.st,g,before,{costBasis:reg.basis}):0;
  add(stock,g,q);if(!reg)return;
  const after=stock[g]||0,added=after-before;
  const unit=transferValue?.good===g?transferValue.unit:HK.marketSellPrice(reg.st,g,Math.max(1,added));
  if(after<=0)delete reg.basis[g];else reg.basis[g]={qty:after,value:added<0?oldValue*after/Math.max(before,1):oldValue+(Number.isFinite(totalCost)?totalCost:added*unit)};
 };
 for(const [method,good] of [['marketBuy',a=>a[0]],['buyFromVisitor',a=>a[1]],['buyFromMonks',a=>a[0]],['buyFishFromHuts',()=> 'fish'],['buyContraband',(a,st)=>st.dive.offer?.good]]){
  const original=HK[method];HK[method]=function(st,...args){const g=good(args,st),before=st.warehouse.stock[g]||0,value=HK.goodsValue(st,g,before),r=original(st,...args);if(r.ok&&(st.warehouse.stock[g]||0)>before&&Number.isFinite(r.cost))st.warehouse.costBasis[g]={qty:st.warehouse.stock[g],value:value+r.cost};return r;};
 }
 for(const method of ['loadShip','unloadShip']){const original=HK[method];HK[method]=function(st,id,g,qty){const s=st.ownShips.find(s=>s.id===id);if(!s)return original(st,id,g,qty);HK.registerGoodsBasis(st,s,s.cargo);const old=transferValue;transferValue={good:g,unit:HK.goodsValue(st,g,1,method==='loadShip'?st.warehouse:s)};try{return original(st,id,g,qty);}finally{transferValue=old;}};}
 const buy=HK.buyShip;HK.buyShip=function(st,...args){const r=buy(st,...args);if(r.ok)HK.registerGoodsBasis(st,st.ownShips.at(-1),st.ownShips.at(-1).cargo);return r;};
 const sell=HK.sellOwnShip;HK.sellOwnShip=function(st,id){const s=st.ownShips.find(s=>s.id===id),before={...st.warehouse.stock},values={};if(s)for(const g of Object.keys(s.cargo))values[g]={unit:HK.goodsValue(st,g,1,s),value:HK.goodsValue(st,g,before[g]||0)};const r=sell(st,id);if(r.ok)for(const [g,v]of Object.entries(values)){const qty=st.warehouse.stock[g]||0;st.warehouse.costBasis[g]={qty,value:v.value+(qty-(before[g]||0))*v.unit};}return r;};
}
HK.deliveryProjection=function(st,c){
 if(!c||c.type!=='deliver')return null;
 const have=Math.min(c.qty,Math.floor(st.warehouse.stock[c.good]||0)),missing=c.qty-have;
 const stock=HK.goodsValue(st,c.good,have),cost=missing*HK.marketBuyPrice(st,c.good,Math.max(1,missing)),extras=0;
 const supply=HK.ruralWaiting(st).concat(HK.tradeAdvances(st)).filter(a=>a.good===c.good);
 const pending=supply.reduce((n,a)=>n+a.qty,0),bound=supply.reduce((n,a)=>n+a.cost,0);
 const available=!missing||((st.town.stock[c.good]||0)>=missing&&HK.whFree(st)>=missing&&!(HK.law(st,'monopoly')===c.good&&st.town.monopolyHolder==='rival'));
 return {have,missing,stock,cost,extras,pending,bound,available,contribution:c.reward-stock-cost};
};
{
 const deliver=HK.deliverContract;HK.deliverContract=function(st,id){
  const c=st.contracts.active.find(c=>c.id===id);if(!c||c.saltStory)return deliver(st,id);
  const p=HK.deliveryProjection(st,c),money=st.money,r=deliver(st,id);if(!r.ok)return r;
  const paid=st.money-money,receipt={day:st.day,revenue:c.reward,basis:p.stock,extras:c.reward-paid,contribution:paid-p.stock};
  c.receipt=receipt;const archived=st.post.contracts.find(x=>x.id===id);if(archived)archived.receipt={...receipt};
  HK.log(st,'deliveryResult',{good:HK.goodName(c.good),money:HK.fmt(receipt.contribution)},receipt.contribution>=0?'good':'info');return r;
 };
 const fail=HK.failContract;HK.failContract=function(st,c){const active=st.contracts.active.includes(c),money=st.money,r=fail(st,c);if(active&&!c.saltStory&&!st.contracts.active.includes(c)){const archived=st.post.contracts.find(x=>x.id===c.id);if(archived)archived.receipt={day:st.day,revenue:0,basis:0,extras:money-st.money,contribution:st.money-money};}return r;};
}
Object.assign(HK.I18N.de,{deliveryResult:'Lieferung von {good} abgerechnet: {money} Mark nach Warenwert und direkten Kosten.',deliveryEstimate:'Voraussichtlich nach Warenwert',deliverySettled:'Abgerechnet nach Warenwert',deliveryCalculation:'Kalkulation ansehen',deliveryCalculationHelp:'Die Auszahlung ist nicht der Gewinn. Für gekaufte Ware zählen die erfassten Einkaufskosten einschließlich Zoll und Fracht. Mischbestände werden nach ihrem durchschnittlichen Warenwert entnommen; Umladen verändert ihn nicht. Vorhandene und selbst erzeugte Ware erhält bei Aufnahme in die Erfassung ihren damaligen Marktverkaufswert. Fehlende Ware wird zum heutigen Marktkaufpreis bewertet. Vorausbezahlte Ankünfte sind noch kein Lagerbestand: Bis zur Ankunft zeigt die Rechnung ausdrücklich Ersatzbeschaffung am Markt. Waren sind keinem Auftrag exklusiv zugeordnet. Laufende Löhne, Mieten, Zinsen und allgemeine Betriebskosten sind nicht enthalten. Bei einer schattigen Lieferung ist eine mögliche Strafe vorab unbekannt; die Abrechnung zieht tatsächlich verhängte Strafen ab.',deliveryRevenue:'Auszahlung',deliveryBasis:'Wert der Lagerware',deliveryShortfall:'Fehlmenge zum heutigen Marktpreis',deliveryExtras:'Direkte Zusatzkosten',deliveryBound:'Bereits unterwegs: {qty} Last · {cost} Mark gebunden. Die Vorschau rechnet bis zur Ankunft mit Ersatzkauf.',deliveryUnavailable:'Die gesamte Fehlmenge ist momentan nicht am Markt beschaffbar. Vergleiche andere Bezugsquellen.',deliveryEstimateRisk:'Schätzung vor laufenden Kosten; Einkaufspreise können sich ändern.',deliveryShadyRisk:'Zusätzliches Risiko: 20 % Wahrscheinlichkeit einer Strafe von 75 % der Auszahlung.',deliveryOldReceipt:'Für diesen früheren Auftrag wurde noch keine Kostenabrechnung erfasst.'});
Object.assign(HK.I18N.en,{deliveryResult:'Delivery of {good} settled: {money} marks after goods value and direct costs.',deliveryEstimate:'Estimated after goods value',deliverySettled:'Settled after goods value',deliveryCalculation:'View calculation',deliveryCalculationHelp:'Payment is not profit. Purchased goods use recorded acquisition costs including duty and freight. Mixed stocks use average goods value; moving cargo does not change it. Existing and self-produced goods use their market sale value when first recorded. Missing goods use today’s market purchase price. Prepaid arrivals are not yet stock: until arrival the calculation explicitly assumes replacement purchases at market. Goods are not reserved exclusively for a contract. Recurring wages, rent, interest and general operating costs are excluded. A shady delivery may incur an unknown fine; final settlement subtracts actual fines.',deliveryRevenue:'Payment',deliveryBasis:'Value of stored goods',deliveryShortfall:'Shortfall at today’s market price',deliveryExtras:'Direct additional costs',deliveryBound:'In transit: {qty} last · {cost} marks committed. Until arrival the forecast assumes replacement purchases.',deliveryUnavailable:'The entire shortfall cannot currently be sourced at market. Compare other suppliers.',deliveryEstimateRisk:'Estimate before ongoing costs; purchase prices may change.',deliveryShadyRisk:'Additional risk: a 20% chance of a fine equal to 75% of payment.',deliveryOldReceipt:'No cost settlement was recorded for this earlier contract.'});
