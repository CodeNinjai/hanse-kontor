/* A persistent trading story uses the same contracts, stock, arrivals and people as the economy.
   Rendering and quotes never advance the story. Time is measured in game days. */
'use strict';
HK.saltCostStocks = new WeakMap();
HK.saltStoryInit = function (st) {
  st.saltStory ||= { phase:'offer', captainId:'story:luebeck:salt', buyer:{name:'Jakob Wessel',trust:0}, receipts:[], costs:{}, extras:0 };
  HK.saltCostStocks.set(st.warehouse.stock, st);
  return st.saltStory;
};
HK.newGameHooks.push(HK.saltStoryInit); HK.migrateHooks.push(HK.saltStoryInit);
HK.saltContract = st => st.contracts.active.find(c=>c.saltStory);
HK.saltIncoming = st => st.incoming.find(i=>i.saltStory);
HK.saltRival = st => st.rivals.find(r=>r.id==='kruse');
HK.saltCost = (st,g,q) => { const p=st.saltStory.costs[g]; return p?.qty ? p.value/p.qty*q : HK.marketSellPrice(st,g,q)*q; };
const saltAddStock=HK.addStock;
HK.addStock=function(stock,g,q) {
  const st=HK.saltCostStocks.get(stock), s=st?.saltStory, before=stock[g]||0;
  saltAddStock(stock,g,q);
  if (!s?.costs[g] || !['active','followOffer','followActive'].includes(s.phase)) return;
  const p=s.costs[g], after=stock[g]||0;
  // Existing/produced goods use their sale value; real purchases replace this estimate below.
  p.value=after<before ? p.value*after/Math.max(1,before) : p.value+(after-before)*HK.marketSellPrice(st,g,Math.max(1,after-before));
  p.qty=after;
};
for (const method of ['marketBuy','buyFromVisitor']) {
  const previous=HK[method];
  HK[method]=function(st,...args) {
    const g=method==='marketBuy'?args[0]:args[1], p=st.saltStory?.costs[g], value=p?.value;
    const result=previous(st,...args);
    if(result.ok && p && ['active','followOffer','followActive'].includes(st.saltStory.phase)) p.value=value+result.cost;
    return result;
  };
}
const saltSettleArrival=HK.settleTradeArrival;
HK.settleTradeArrival=function(st,inc,v) {
  const paid=HK.tradeAdvances(st).filter(a=>a.incomingId===inc.id), values={};
  for(const a of paid) if(st.saltStory?.costs[a.good]) values[a.good]=st.saltStory.costs[a.good].value;
  saltSettleArrival(st,inc,v);
  for(const g of Object.keys(values)) st.saltStory.costs[g].value=values[g]+paid.filter(a=>a.good===g&&a.status==='delivered').reduce((sum,a)=>sum+a.cost,0);
};
HK.saltSendCaptain=function(st,good,qty,price,days,leg) {
  const inc={id:st.nextId++,origin:'luebeck',sea:true,days,known:true,waiting:0,delayResolved:true,delayChance:0,saltStory:leg,tradeLot:{good,qty,price}};
  st.incoming.push(inc); return inc;
};
HK.saltPlanReturn=function(st) {
  const s=st.saltStory;
  // One person cannot be sailing home while his first ship is still arriving or berthed.
  if(!s?.returnPending || HK.saltIncoming(st) || st.ships.some(v=>v.captainId===s.captainId)) return;
  s.returnPending=false; s.returnBooked=st.day;
  HK.saltSendCaptain(st,'beer',20,65,4,'return');
  HK.log(st,'saltReturnAnnounced',{date:HK.fmtDate(st.day+4)},'info');
};
HK.startSaltStory=function(st) {
  const s=st.saltStory;
  if(st.gameOver || s.phase!=='offer') return {ok:false,msg:'saltGone'};
  if(st.contracts.active.length>=3) return {ok:false,msg:'tooManyContracts'};
  s.phase='active'; s.started=st.day; s.rivalAt=st.day+1; s.windAt=st.day+2;
  for(const g of ['salt','smokedfish']) { const qty=st.warehouse.stock[g]||0; s.costs[g]={qty,value:qty*HK.marketSellPrice(st,g,Math.max(1,qty))}; }
  st.regularCaptains[s.captainId] ||= {name:'Ludeke Horn',visits:0,trust:0,traded:0,lastTradeVisit:null};
  const c={id:st.contracts.nextId++,giver:'council',type:'deliver',good:'salt',qty:32,price:70,reward:2240,days:4,offered:st.day,expires:st.day+1,deliverBy:st.day+4,saltStory:'salt'};
  st.contracts.offers.push(c);
  const result=HK.acceptContract(st,c.id); // slot and availability were checked above
  HK.saltSendCaptain(st,'salt',24,36,3,'salt');
  HK.log(st,'saltStarted',{},'event'); HK.scheduleSave?.(); return result;
};
const saltDockShip=HK.dockShip;
HK.dockShip=function(st,origin,inc) {
  if(!inc?.saltStory) return saltDockShip(st,origin,inc);
  const s=st.saltStory;
  if(st.ships.some(v=>v.captainId===s.captainId)) return false;
  const saved=new Map(Object.entries(st.regularCaptains).map(([id,r])=>[id,{...r}]));
  const ok=saltDockShip(st,origin,inc); if(!ok) return false;
  const v=st.ships.at(-1), randomId=v.captainId;
  if(saved.has(randomId)) Object.assign(st.regularCaptains[randomId],saved.get(randomId)); else delete st.regularCaptains[randomId];
  const record=st.regularCaptains[s.captainId]; record.visits++; record.lastSeen=st.day;
  v.captainId=s.captainId; v.captain=record.name; v.saltStory=inc.saltStory; v.daysLeft=Math.max(5,v.daysLeft);
  v.captainDiscount=Math.min(.04,Math.max(0,record.trust)*.005);
  if(v.cargo[inc.tradeLot.good]) v.cargo[inc.tradeLot.good].price=Math.max(1,Math.round(v.cargo[inc.tradeLot.good].price*(1-v.captainDiscount)));
  if(inc.saltStory==='return') v.wants.smokedfish={qty:16,price:100};
  HK.log(st,'saltCaptainArrived',{name:record.name},'arrival'); return true;
};
HK.saltChoiceQuote=function(st,choice) {
  const s=st.saltStory, c=HK.saltContract(st), inc=HK.saltIncoming(st), r=HK.saltRival(st);
  if(st.gameOver || !s || s.phase!=='active' || !c || st.day>c.deadline) return {ok:false,msg:'saltGone'};
  let cost=0;
  if(choice==='pact') { if(s.rivalDone || s.rivalChoice || !r) return {ok:false,msg:'saltGone'}; cost=120; }
  else if(choice==='buyback') {
    if(!s.rivalDone || s.rivalChoice || !s.rivalQty || !r) return {ok:false,msg:'saltGone'};
    cost=s.rivalQty*(s.rivalPrice+8); if(HK.whFree(st)<s.rivalQty) return {ok:false,msg:'warehouseFull'};
  } else if(choice==='pilot') { if(s.windDone || s.windChoice || !inc) return {ok:false,msg:'saltGone'}; cost=90; }
  else if(choice==='extend') { if(s.extended) return {ok:false,msg:'saltGone'}; }
  else return {ok:false,msg:'saltGone'};
  if(st.money<cost) return {ok:false,msg:'notEnoughMoney'};
  return {ok:true,cost,qty:choice==='buyback'?s.rivalQty:0};
};
HK.saltChoose=function(st,choice) {
  const q=HK.saltChoiceQuote(st,choice); if(!q.ok) return q;
  const s=st.saltStory, c=HK.saltContract(st), r=HK.saltRival(st);
  if(q.cost) HK.book(st,'shipTrade',-q.cost);
  if(choice==='pact') { s.rivalChoice='pact'; r.wealth+=q.cost; r.attitude=HK.clamp(r.attitude+8,-100,100); s.extras+=q.cost; }
  if(choice==='buyback') {
    const p=s.costs.salt, value=p.value;
    HK.withQuality(s.rivalQuality,()=>HK.addStock(st.warehouse.stock,'salt',q.qty,q.cost)); p.value=value+q.cost;
    r.wealth+=q.cost; s.rivalChoice='buyback'; s.rivalQty=0; r.attitude=HK.clamp(r.attitude+5,-100,100);
    HK.transport(st,null,'salt',q.qty,'in','market');
  }
  if(choice==='pilot') { s.windChoice='pilot'; s.extras+=q.cost; }
  if(choice==='extend') { s.extended=true; c.deadline+=2; c.deliverBy=c.deadline; c.reward-=160; c.price=c.reward/c.qty; s.buyer.trust=Math.max(-8,s.buyer.trust-1); }
  HK.log(st,'saltChosen',{choice:HK.t('saltChoice_'+choice)},'info'); HK.scheduleSave?.(); return q;
};
HK.saltDeliver=function(st,choice='business') {
  const c=HK.saltContract(st);
  if(st.gameOver || !c || !['business','community'].includes(choice) || (choice==='community'&&c.saltStory!=='salt')) return {ok:false,msg:'saltGone'};
  if((st.warehouse.stock[c.good]||0)<c.qty || st.day>c.deadline || (c.minQuality&&HK.goodQuality(st,c.good)<c.minQuality)) return {ok:false,msg:'notEnoughCargo'};
  if(choice==='community') { c.reward-=320; c.price=c.reward/c.qty; }
  const oldChoice=st.saltStory.deliveryChoice; st.saltStory.deliveryChoice=choice;
  const result=HK.deliverContract(st,c.id);
  if(!result.ok) { st.saltStory.deliveryChoice=oldChoice; if(choice==='community') { c.reward+=320; c.price=c.reward/c.qty; } }
  HK.scheduleSave?.(); return result;
};
const saltDeliverContract=HK.deliverContract;
HK.deliverContract=function(st,id) {
  const c=st.contracts.active.find(c=>c.id===id), basis=c?.saltStory?HK.saltCost(st,c.good,c.qty):0;
  const result=saltDeliverContract(st,id); if(!result.ok || !c?.saltStory) return result;
  const s=st.saltStory, first=c.saltStory==='salt', extras=first?s.extras:0;
  s.receipts.push({leg:c.saltStory,day:st.day,revenue:c.reward,basis,extras,contribution:c.reward-basis-extras,choice:s.deliveryChoice||'business'});
  s.buyer.trust=HK.clamp(s.buyer.trust+2,-8,8);
  const captain=st.regularCaptains[s.captainId]; if(captain) captain.trust=HK.clamp(captain.trust+1,-8,8);
  if(first) {
    s.outcome=s.deliveryChoice||'business'; s.phase='followOffer'; s.visualUntil=st.day+6;
    if(s.outcome==='community') { st.rep=HK.clamp(st.rep+4,0,100); st.cityLife.mood=HK.clamp(st.cityLife.mood+6,0,100); HK.fac(st,'zuenfte',3); }
    s.returnPending=true; HK.saltPlanReturn(st);
  } else { s.phase='done'; s.visualUntil=st.day+6; }
  s.deliveryChoice=null;
  HK.log(st,'saltDelivered',{money:HK.fmt(s.receipts.at(-1).contribution)},'good'); return result;
};
const saltFailContract=HK.failContract;
HK.failContract=function(st,c) {
  if(c.saltStory && !st.contracts.active.includes(c)) return;
  saltFailContract(st,c); if(!c.saltStory) return;
  const s=st.saltStory; s.phase='failed'; s.visualUntil=st.day+4; s.buyer.trust=HK.clamp(s.buyer.trust-3,-8,8);
  const captain=st.regularCaptains[s.captainId]; if(captain) captain.trust=HK.clamp(captain.trust-1,-8,8);
  const costs=Math.round(c.reward*.15)+(c.saltStory==='salt'?s.extras:0);
  s.receipts.push({leg:c.saltStory,day:st.day,revenue:0,basis:0,extras:costs,contribution:-costs,failed:true});
};
HK.saltFollow=function(st,accept) {
  const s=st.saltStory;
  if(st.gameOver || s.phase!=='followOffer') return {ok:false,msg:'saltGone'};
  if(!accept) { s.phase='done'; HK.scheduleSave?.(); return {ok:true}; }
  if(st.contracts.active.length>=3) return {ok:false,msg:'tooManyContracts'};
  // A new choice is available immediately, with no forced days of waiting.
  const c={id:st.contracts.nextId++,giver:'guild',type:'deliver',good:'smokedfish',qty:8,price:110,reward:880,days:7,offered:st.day,expires:st.day+1,deliverBy:st.day+7,saltStory:'fish',minQuality:90};
  st.contracts.offers.push(c); const result=HK.acceptContract(st,c.id);
  if(result.ok) { s.phase='followActive'; s.followStarted=st.day; } HK.scheduleSave?.(); return result;
};
const saltCityStart=HK.cityDayStart;
HK.cityDayStart=function(st) {
  saltCityStart(st); const s=st.saltStory; if(s?.started===undefined) return;
  if(!s.rivalDone && st.day>=s.rivalAt) {
    s.rivalDone=true; const r=HK.saltRival(st);
    if(r && !s.rivalChoice) {
      const price=HK.marketBuyPrice(st,'salt',8), qty=Math.max(0,Math.min(8,Math.floor(st.town.stock.salt||0),Math.floor(r.wealth/price)));
      s.rivalQty=qty; s.rivalPrice=price; s.rivalQuality=HK.goodQuality(st,'salt',true);
      st.town.stock.salt-=qty; r.wealth-=qty*price;
      if(qty) HK.transport(st,null,'salt',qty,'out','market','city');
      HK.log(st,'saltRivalBought',{rival:HK.rivalName(r.id),qty},'event');
    }
  }
  if(!s.windDone && st.day>=s.windAt) {
    s.windDone=true; const inc=st.incoming.find(i=>i.saltStory==='salt');
    if(inc) { const delay=s.windChoice==='pilot'?1:2; inc.days+=delay; s.windDelay=delay; HK.log(st,'saltWind',{days:delay},'event'); }
  }
};
const saltCityEnd=HK.cityDayEnd;
HK.cityDayEnd=function(st) { saltCityEnd(st); HK.saltPlanReturn(st); };
// Calculate a hypothetical contribution using all stock at its recorded value and today's missing goods quote.
HK.saltProjection=function(st) {
  const c=HK.saltContract(st); if(!c) return null;
  const have=Math.min(c.qty,Math.floor(st.warehouse.stock[c.good]||0)), missing=c.qty-have;
  const stock=HK.saltCost(st,c.good,have), cost=missing?HK.marketBuyPrice(st,c.good,missing)*missing:0;
  const extras=c.saltStory==='salt'?st.saltStory.extras:0;
  return {have,missing,stock,cost,extras,contribution:c.reward-stock-cost-extras};
};
