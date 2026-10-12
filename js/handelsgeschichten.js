/* Opportunities use actual scheduled cargo. Reports are dated snapshots;
   payments and reservations go through the shared trade/cost ledger. */
'use strict';
HK.tradingStoriesInit=function(st){
 st.tradingStories ||= {version:1,reports:[],cloth:{phase:'locked',receipts:[],buyerTrust:0}};
 return st.tradingStories;
};
HK.newGameHooks.push(HK.tradingStoriesInit);HK.migrateHooks.push(HK.tradingStoriesInit);
HK.arrivalReport=function(st,inc,source){
 const T=HK.tradingStoriesInit(st);if(T.reports.some(r=>r.incoming===inc.id))return;
 const report={incoming:inc.id,source,day:st.day,origin:inc.origin,captain:inc.captainId||null,good:inc.tradeLot.good,qty:inc.tradeLot.qty,price:inc.tradeLot.price,quality:inc.tradeLot.quality??100,eta:st.day+inc.days,chance:inc.delayResolved?0:inc.delayChance,until:st.day+Math.max(1,Math.min(3,inc.days)),reserved:0};
 T.reports.push(report);T.reports=T.reports.slice(-40);inc.known=true;
 HK.postAdd(st,'opportunity:'+inc.id,'opportunity',report.captain?'ship:'+report.captain:'person:innkeeper',{report:{...report}});
 return report;
};
HK.buyArrivalReport=function(st,id){
 const inc=st.incoming.find(i=>i.id===id);
 if(st.gameOver||!inc||!inc.tradeLot||inc.days<=0||HK.tradeArrivalKnown(st,inc)||st.tradingStories.reports.some(r=>r.incoming===id))return{ok:false,msg:'tradeOfferGone'};
 if(st.money<25)return{ok:false,msg:'notEnoughMoney'};
 HK.book(st,'tavern',-25);HK.arrivalReport(st,inc,'tavern');HK.lehrgangMerke?.(st,'geruecht');HK.scheduleSave?.();return{ok:true,cost:25};
};
HK.opportunityQuote=function(st,id){
 const report=st.tradingStories.reports.find(r=>r.incoming===id),inc=st.incoming.find(i=>i.id===id);
 if(!report||!inc||st.day>report.until)return{ok:false,msg:'tradeOfferGone'};
 const qty=Math.min(8-report.reserved,inc.tradeLot.qty,Math.max(0,HK.whFree(st)));
 return HK.quoteTradeAdvance(st,id,qty);
};
HK.reserveOpportunity=function(st,id){
 const q=HK.opportunityQuote(st,id);if(!q.ok)return q;
 const r=HK.reserveTradeSupply(st,id,q.qty);if(r.ok)st.tradingStories.reports.find(r=>r.incoming===id).reserved+=q.qty;
 HK.scheduleSave?.();return r;
};
HK.captainOpportunities=function(st){
 // A trusted captain may announce a real, as yet unassigned voyage from home.
 // The identity is reserved too, so it cannot appear aboard another ship.
 for(const inc of st.incoming){
  if(!inc.sea||inc.saltStory||inc.clothStory||inc.captainId||inc.days<2||!inc.tradeLot||st.tradingStories.reports.some(r=>r.incoming===inc.id))continue;
  const pair=Object.entries(st.regularCaptains).find(([id,r])=>id.startsWith(inc.origin+':')&&r.trust>=3&&r.visits>=3&&st.day-(r.lastReport??-999)>=14&&!st.ships.some(v=>v.captainId===id)&&!st.incoming.some(i=>i.captainId===id));
  if(!pair)continue;
  const [id,r]=pair;inc.captainId=id;r.lastReport=st.day;HK.arrivalReport(st,inc,'captain');
 }
};
// The base docking pipeline settles the same finite lot and prepaid stock.
// Replace only the generated captain identity; undo its incidental visit count.
{
 const dock=HK.dockShip;HK.dockShip=function(st,origin,inc){
  if(!inc?.captainId)return dock(st,origin,inc);
  if(st.ships.some(v=>v.captainId===inc.captainId))return false;
  const saved=new Map(Object.entries(st.regularCaptains).map(([id,r])=>[id,{...r}]));
  const ok=dock(st,origin,inc);if(!ok)return ok;
  const v=st.ships.at(-1),random=v.captainId;
  if(saved.has(random))Object.assign(st.regularCaptains[random],saved.get(random));else delete st.regularCaptains[random];
  const record=st.regularCaptains[inc.captainId];record.visits++;record.lastSeen=st.day;
  v.captainId=inc.captainId;v.captain=record.name;v.captainDiscount=Math.min(.04,Math.max(0,record.trust)*.005);

  // makeVisitor applied its random captain's discount. Restore that price base
  // for unrelated cargo, then apply the assigned captain's bounded discount.
  const oldDiscount=Math.min(.04,Math.max(0,saved.get(random)?.trust||0)*.005);
  for(const [g,row]of Object.entries(v.cargo))row.price=Math.max(1,Math.round(row.price/(g===inc.tradeLot.good?1:1-oldDiscount)*(1-v.captainDiscount)));
  for(const row of Object.values(v.wants))row.price=Math.max(1,Math.round(row.price/(1+oldDiscount)*(1+v.captainDiscount)));
  if(inc.clothStory){
   v.wants.smokedfish={qty:10,price:Math.round(HK.GOOD.smokedfish.base*HK.wantFactor(HK.ORIGIN.bruegge.want.smokedfish)*(1+v.captainDiscount))};
   v.clothStory=true;v.daysLeft=Math.max(v.daysLeft,8);st.tradingStories.cloth.visitor=v.id;
  }
  const letter=st.post?.messages.find(m=>m.token==='ship:'+v.id);if(letter)letter.sender='ship:'+v.captainId;
  const prepaid=st.tradePlanning.advances.filter(a=>a.incomingId===inc.id&&a.status==='delivered').reduce((n,a)=>n+a.qty,0);
  if(prepaid)HK.noteCaptainTrade(st,v,prepaid,{ok:true},false);
  return ok;
 };
}
HK.CLOTH_CHOICES={everyday:{quality:95,minQuality:85,price:104,reward:1520,days:5},fine:{quality:112,minQuality:110,price:145,reward:2000,days:7}};
HK.clothContract=st=>st.contracts.active.find(c=>c.clothStory);
HK.clothSync=function(st){
 const C=HK.tradingStoriesInit(st).cloth;
 if(C.phase==='locked'&&['done','failed'].includes(st.saltStory.phase)){
  C.phase='offer';C.report={day:st.day,market:HK.marketBuyPrice(st,'cloth',8),quality:HK.goodQuality(st,'cloth',true)};
  HK.postAdd(st,'cloth:offer','clothOffer','person:guild');
 }
 if(C.phase==='waitingShip'){
  const v=HK.findVisitor(st,C.visitor);
  if(v){C.phase='returnOffer';HK.postAdd(st,'cloth:return','clothReturn','ship:'+C.captainId);}
  else if(!st.incoming.some(i=>i.id===C.incoming)){C.phase='done';C.ending='clothOnly';C.finished=st.day;}
 }
 if(C.phase==='returnOffer'&&!HK.findVisitor(st,C.visitor)){C.phase='done';C.ending='clothOnly';C.finished=st.day;}
};
HK.startClothStory=function(st,choice){
 const C=st.tradingStories.cloth,d=HK.CLOTH_CHOICES[choice];
 if(st.gameOver||C.phase!=='offer'||!d)return{ok:false,msg:'tradeOfferGone'};
 if(st.contracts.active.length>=3)return{ok:false,msg:'tooManyContracts'};
 const c={id:st.contracts.nextId++,giver:'guild',type:'deliver',good:'cloth',qty:8,price:d.reward/8,reward:d.reward,offered:st.day,expires:st.day+1,days:12,minQuality:d.minQuality,clothStory:'cloth',tradeTitle:'brugesCloth'};
 st.contracts.offers.push(c);const r=HK.acceptContract(st,c.id);if(!r.ok)return r;
 Object.assign(C,{phase:'active',choice,started:st.day,captainId:'story:bruegge:cloth'});
 st.regularCaptains[C.captainId] ||= {name:'Willem de Groot',visits:0,trust:0,traded:0,lastTradeVisit:null};
 const inc={id:st.nextId++,origin:'bruegge',sea:true,days:d.days,known:true,waiting:0,delayResolved:false,delayChance:.25,captainId:C.captainId,clothStory:true,tradeLot:{good:'cloth',qty:12,price:d.price,quality:d.quality}};
 st.incoming.push(inc);C.incoming=inc.id;HK.arrivalReport(st,inc,'cloth');
 HK.log(st,'clothStarted',{choice:HK.t('clothChoice_'+choice)},'event');HK.scheduleSave?.();return r;
};
HK.clothReturnQuote=function(st){
 const C=st.tradingStories.cloth,v=HK.findVisitor(st,C.visitor),row=v?.wants.smokedfish;
 if(st.gameOver||C.phase!=='returnOffer'||!v||!row||row.qty<1||v.daysLeft<2)return{ok:false,msg:'tradeOfferGone'};
 const qty=Math.min(10,row.qty),price=HK.nettoVerkauf(st,v,'smokedfish',100);
 return{ok:true,qty,price,reward:qty*price,days:v.daysLeft-1,deadline:st.day+v.daysLeft-1,visitor:v.id};
};
HK.chooseClothReturn=function(st,accept){
 const C=st.tradingStories.cloth;
 if(st.gameOver||C.phase!=='returnOffer')return{ok:false,msg:'tradeOfferGone'};
 if(!accept){C.phase='done';C.ending='clothOnly';C.finished=st.day;HK.scheduleSave?.();return{ok:true};}
 const q=HK.clothReturnQuote(st);if(!q.ok)return q;
 if(st.contracts.active.length>=3)return{ok:false,msg:'tooManyContracts'};
 const c={id:st.contracts.nextId++,giver:'guild',type:'deliver',good:'smokedfish',qty:q.qty,price:q.price,reward:q.reward,offered:st.day,expires:st.day+1,days:q.days,minQuality:90,clothStory:'return',tradeTitle:'brugesReturn',visitorId:q.visitor,returnPrice:HK.findVisitor(st,q.visitor).wants.smokedfish.price};
 st.contracts.offers.push(c);const r=HK.acceptContract(st,c.id);if(!r.ok)return r;
 // Remove promised demand from the public visitor market immediately.
 HK.findVisitor(st,q.visitor).wants.smokedfish.qty-=q.qty;C.phase='returnActive';HK.scheduleSave?.();return r;
};
{
 const deliver=HK.deliverContract;HK.deliverContract=function(st,id){
  const c=st.contracts.active.find(c=>c.id===id),v=c?.visitorId&&HK.findVisitor(st,c.visitorId);
  if(c?.clothStory==='return'&&!v)return{ok:false,msg:'postShipLeft'};
  const r=deliver(st,id);if(!r.ok||!c?.clothStory)return r;
  const C=st.tradingStories.cloth;C.receipts.push({leg:c.clothStory,...c.receipt});C.buyerTrust+=c.clothStory==='cloth'&&C.choice==='fine'?2:1;
  if(v){HK.noteCaptainTrade(st,v,c.qty,{ok:true},false);C.phase='done';C.ending='roundTrip';C.finished=st.day;}
  else C.phase='waitingShip';
  HK.clothSync(st);HK.postAdd(st,'cloth:receipt:'+c.clothStory,'clothReceipt','person:guild',{receipt:{...c.receipt},leg:c.clothStory});HK.scheduleSave?.();return r;
 };
 const fail=HK.failContract;HK.failContract=function(st,c){
  const active=st.contracts.active.includes(c);if(c.clothStory&&!active)return;const r=fail(st,c);if(!active||!c.clothStory)return r;
  const C=st.tradingStories.cloth,receipt=st.post.contracts.find(x=>x.id===c.id)?.receipt;C.phase='failed';C.finished=st.day;C.buyerTrust--;
  if(receipt){C.receipts.push({leg:c.clothStory,...receipt,failed:true});HK.postAdd(st,'cloth:receipt:'+c.clothStory,'clothReceipt','person:guild',{receipt:{...receipt},leg:c.clothStory});}
  const v=c.visitorId&&HK.findVisitor(st,c.visitorId);if(v){(v.wants[c.good]||={qty:0,price:c.returnPrice}).qty+=c.qty;const record=HK.captainRecord(st,v);record.trust=Math.max(-8,record.trust-1);}
  return r;
 };
 const actions=HK.postActions;HK.postActions=function(st,m){
  if(st.gameOver)return[];const C=st.tradingStories?.cloth;
  if(m.type==='clothOffer'&&C?.phase==='offer')return Object.keys(HK.CLOTH_CHOICES).map(id=>({id:'cloth:'+id,label:'clothChoice_'+id}));
  if(m.type==='clothReturn'&&C?.phase==='returnOffer')return [...(HK.clothReturnQuote(st).ok?[{id:'cloth:return',label:'clothAcceptReturn'}]:[]),{id:'cloth:finish',label:'clothFinish'}];
  return actions(st,m);
 };
 const reply=HK.postReply;HK.postReply=function(st,id,action){
  if(!action.startsWith('cloth:'))return reply(st,id,action);
  const m=st.post.messages.find(m=>m.id===id),a=m&&HK.postActions(st,m).find(a=>a.id===action);if(!a)return{ok:false,msg:'postGone'};
  const choice=action.slice(6),r=['return','finish'].includes(choice)?HK.chooseClothReturn(st,choice==='return'):HK.startClothStory(st,choice);
  if(r.ok){m.read=true;m.replies.push({day:st.day,action,label:a.label,vars:{},cost:0});HK.scheduleSave?.();}return r;
 };
}
HK.tickHooks.push(st=>{HK.captainOpportunities(st);HK.clothSync(st);});
HK.migrateHooks.push(HK.clothSync);
