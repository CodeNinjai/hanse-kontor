/* Reusable, explicitly dispatched routes and evidence-based city relationships.
   Uses the existing voyage settlement; it never creates another cargo or payment. */
'use strict';
HK.foreignInit=function(st){st.foreignTrade ||= {version:1,cities:{},routes:{},nextId:1};for(const o of HK.ORIGINS.filter(o=>o.sea))st.foreignTrade.cities[o.id] ||= {trust:0,visits:0,volume:0,lastReward:-30,history:[]};return st.foreignTrade;};
HK.newGameHooks.push(HK.foreignInit);HK.migrateHooks.push(HK.foreignInit);
HK.foreignDiscount=(st,city)=>Math.min(.2,Math.floor((st.foreignTrade?.cities[city]?.trust||0)/20)*.05);
HK.treatyCost=(st,city)=>Math.round(HK.CONST.TREATY_COST*(1-HK.foreignDiscount(st,city)));
HK.foreignRouteValid=r=>!!(r&&HK.ORIGIN[r.city]?.sea&&Object.hasOwn(HK.GOOD,r.good)&&Number.isInteger(r.qty)&&r.qty>=0&&(r.qty>0||!!r.bring)&&r.qty<=10000&&(!r.bring||HK.ORIGIN[r.city].sell[r.bring]));
HK.foreignSave=function(st,route){if(st.gameOver||!HK.foreignRouteValid(route))return{ok:false,msg:'foreignInvalid'};st.foreignTrade.routes[route.city]={city:route.city,good:route.good,qty:route.qty,bring:route.bring||''};HK.scheduleSave?.();return{ok:true};};
HK.foreignQuote=function(st,route,shipId){
 if(!HK.foreignRouteValid(route))return{ok:false,msg:'foreignInvalid'};
 const o=HK.ORIGIN[route.city],s=st.ownShips.find(s=>s.id===shipId),q={ok:true,days:o.days*4+3};
 const fail=msg=>{q.ok=false;q.msg=msg;};
 if(!s){fail('foreignNoShip');return q;}
 if(st.gameOver)fail('foreignInvalid');else if(s.status!=='port')fail('foreignAway');else if(HK.stockUsed(s.cargo)>0)fail('foreignUnload');else if(s.hull<30)fail('shipDamaged');
 else if(HK.ICE_PORTS.includes(route.city)&&HK.isWinter(st))fail('iceBound');else if(route.qty>HK.shipCap(s))fail('shipFull');else if((st.warehouse.stock[route.good]||0)<route.qty)fail('notEnoughCargo');
 q.days=Math.max(5,o.days*4+3+(HK.SHIP_TYPE[s.type]?.delta||0)-(s.captain?.trait==='navigator'?1:0)-(HK.hasVenture(st,'ropewalk')&&HK.hasVenture(st,'sailmaker')?1:0));q.maxDays=q.days+(s.captain?.trait==='drunkard'?2:0);
 q.quality=HK.goodQuality(st,route.good);q.basis=HK.goodsValue(st,route.good,route.qty);
 q.revenue=Math.round(route.qty*HK.shipSaleUnitPrice(st,{cargo:{},quality:{}},route.good,o)*(st.kontors[route.city]?1.2:1)*(s.captain?.trait==='smuggler'?1.08:1)*(route.city==='luebeck'&&st.hansePrivilege?1.1:1));
 q.premium=st.schiffer?.mitglied?Math.round(HK.stockValue({[route.good]:route.qty})*HK.CONST.SCHIFFER_PRAEMIE):0;
 if(st.money<q.premium)fail('foreignInsurance');
 q.returnUnit=route.bring?Math.round(HK.GOOD[route.bring].base*HK.sellFactor(o.sell[route.bring])*(st.kontors[route.city]?.92:1)):0;
 q.returnQty=q.returnUnit?Math.min(HK.shipCap(s),Math.floor(q.revenue/q.returnUnit)):0;q.cash=q.revenue-q.returnQty*q.returnUnit;q.contribution=q.revenue-q.basis-q.premium;
 const convoy=st.ownShips.some(x=>x!==s&&x.status==='away'&&x.dest===route.city&&x.phase==='out'&&x.daysLeft>=o.days*4-1);
 q.risk=(st.blessedUntil>st.day?.02:.05)*(st.militia?.7:1)*(HK.rivalAlly(st)?.6:1)*(s.captain?.trait==='fighter'?.5:1)*(convoy?.5:1);return q;
};
HK.foreignDispatch=function(st,city,shipId){
 const r=st.foreignTrade.routes[city],q=HK.foreignQuote(st,r,shipId);if(!q.ok)return q;
 // Validate all departure conditions before either of the existing mutations.
 const loaded=r.qty?HK.loadShip(st,shipId,r.good,r.qty):{ok:true};if(!loaded.ok)return loaded;
 const sent=HK.sendShip(st,shipId,city,r.bring);if(!sent.ok&&r.qty){HK.unloadShip(st,shipId,r.good,r.qty);return sent;}HK.scheduleSave?.();return sent;
};
{
 const send=HK.sendShip;HK.sendShip=function(st,id,dest,bring){
  const s=st.ownShips.find(s=>s.id===id),basis=s?Object.entries(s.cargo).reduce((sum,[g,n])=>sum+HK.goodsValue(st,g,n,s),0):0,money=st.money;
  if(st.gameOver)return{ok:false,msg:'foreignInvalid'};const result=send(st,id,dest,bring);
  if(result.ok){const F=HK.foreignInit(st);s.foreignVoyage={id:F.nextId++,city:dest,departed:st.day,ship:s.name,basis,premium:money-st.money};}return result;
 };
}
HK.foreignSold=function(st,s,revenue){
 const v=s.foreignVoyage;if(!v||v.sold!==undefined)return;
 const o=HK.ORIGIN[v.city],pairs=Object.entries(s.cargo).filter(([g,n])=>n>0&&o.want[g]),qty=pairs.reduce((n,[,q])=>n+q,0);
 v.exports=Object.fromEntries(Object.entries(s.cargo).filter(([,n])=>n>0));v.totalQty=Object.values(v.exports).reduce((n,q)=>n+q,0);v.totalQuality=v.totalQty?Object.entries(v.exports).reduce((n,[g,q])=>n+q*HK.shipGoodQuality(s,g),0)/v.totalQty:0;
 v.sold=st.day;v.revenue=revenue;v.qty=qty;v.quality=qty?pairs.reduce((n,[g,q])=>n+q*HK.shipGoodQuality(s,g),0)/qty:0;
};
HK.foreignReturned=function(st,s){
 const v=s.foreignVoyage;if(!v)return;
 const F=HK.foreignInit(st),c=F.cities[v.city];if(!c)return;
 const old=c.trust;let delta=0;
 if(v.sold!==undefined&&v.qty>=8&&v.revenue>=200){if(v.quality<85)delta=-3;else if(st.day-c.lastReward>=30){delta=4;c.lastReward=st.day;}}
 c.trust=HK.clamp(c.trust+delta,0,100);c.visits++;c.volume+=v.revenue||0;
 const backValue=Object.entries(s.cargo).reduce((n,[g,q])=>n+HK.goodsValue(st,g,q,s),0);
 const receipt={...v,returned:st.day,cash:s.cash||0,back:{...s.cargo},backValue,trust:c.trust-old,contribution:(s.cash||0)+backValue+(v.insurance||0)-v.basis-v.premium-(v.capital||0)-(v.operating||0)-(v.provisions||0)};
 c.history.push(receipt);c.history=c.history.slice(-12);c.lastVisit=st.day;
 HK.postAdd(st,'foreign:'+v.id,'foreign','person:harbourmaster',{city:v.city,receipt},{city:HK.name(HK.ORIGIN[v.city])});
 delete s.foreignVoyage;
};

{
 const damage=HK.seeschaden;HK.seeschaden=function(st,s,value){const money=st.money;const r=damage(st,s,value);if(s.foreignVoyage)s.foreignVoyage.insurance=(s.foreignVoyage.insurance||0)+st.money-money;return r;};
}
