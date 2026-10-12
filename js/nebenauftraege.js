/* Two finite, optional side orders accompanying a guild surety. Goods are
   never reserved: the shared ledger makes competing promises visible. */
'use strict';
HK.guildSidequestsInit=function(st){
 if(st.guildSidequests)return st.guildSidequests;
 const main=st.guildSponsorship,active=['pledged','conflict','active'].includes(main?.status);
 return st.guildSidequests={version:1,status:'locked',legacyPending:!!active,quests:{hospital:{id:'hospital',status:'locked',history:[],extensionUsed:false},bracht:{id:'bracht',status:'locked',history:[],extensionUsed:false}},history:[],nextEvent:1};
};
HK.newGameHooks.push(HK.guildSidequestsInit);HK.migrateHooks.push(HK.guildSidequestsInit);
HK.guildSidequestNames={hospital:'sidequestHospitalTitle',bracht:'sidequestBrachtTitle'};
HK.guildSidequestEffects=function(id,outcome){
 const e={};
 if(id==='hospital'){
  if(outcome==='fulfilled')Object.assign(e,{rep:1,kirche:3,kaufleute:-1});
  else if(outcome==='withdrawn')Object.assign(e,{rep:-1,kirche:-1});
  else if(outcome==='breach')Object.assign(e,{rep:-2,kirche:-2,kaufleute:-1});
 }else{
  if(outcome==='fulfilled')Object.assign(e,{rep:1,zuenfte:1,kaufleute:2,brachtAttitude:4});
  else if(outcome==='withdrawn')Object.assign(e,{rep:-1,kaufleute:-1,brachtAttitude:-2});
  else if(outcome==='breach')Object.assign(e,{rep:-2,kaufleute:-2,brachtAttitude:-4});
 }
 return e;
};
HK.guildSidequestApply=function(st,id,outcome){
 const e=HK.guildSidequestEffects(id,outcome),r=id==='bracht'?st.rivals.find(x=>x.id==='bracht'):null;
 for(const[k,v]of Object.entries(e)){if(k==='brachtAttitude'){if(r)r.attitude=HK.clamp((r.attitude||0)+v,-100,100);}else if(HK.FACTION_IDS.includes(k))HK.fac(st,k,v);else if(k==='rep')st.rep=HK.clamp(st.rep+v,0,100);}
 return e;
};
HK.guildSidequestHasPromise=function(q){return !!q&&['active'].includes(q.status)&&!q.delivered;};
HK.guildSidequestSummary=function(st,prospectiveId=null,deliveryId=null){
 const G=st.guildSidequests||{quests:{}},main=st.guildSponsorship,items=[];
 if(main&&['pledged','conflict','active'].includes(main.status)&&main.terms&&!main.delivered)items.push({id:'guildSurety',labelKey:'guildSuretyTitle',good:main.terms.good,qty:main.terms.qty,due:main.terms.dueAt,kind:'surety'});
 for(const id of ['hospital','bracht']){const q=G.quests?.[id];if(HK.guildSidequestHasPromise(q))items.push({id,labelKey:HK.guildSidequestNames[id],good:q.good,qty:q.qty,due:q.dueAt,kind:'sidequest'});}
 for(const c of st.contracts?.active||[])if(c.type==='deliver'&&c.good&&Number.isFinite(c.qty))items.push({id:'contract:'+c.id,labelKey:'giver_'+c.giver,good:c.good,qty:c.qty,due:c.deadline??c.deliverBy??st.day+c.days,kind:'contract'});
 const baseItems=items.slice();
 const candidate=prospectiveId&&G.quests?.[prospectiveId];
 if(candidate&&candidate.status==='offer')items.push({id:'prospective:'+prospectiveId,labelKey:HK.guildSidequestNames[prospectiveId],good:candidate.good,qty:candidate.qty,due:candidate.dueAt,kind:'prospective'});
 
 const goods={};for(const item of items){const g=goods[item.good]||(goods[item.good]={good:item.good,have:Math.floor(st.warehouse.stock[item.good]||0),items:[],required:0,shortfall:0});g.items.push(item);g.required+=item.qty;}
 
 for(const g of Object.values(goods)){g.shortfall=Math.max(0,g.required-g.have);g.free=Math.max(0,g.have-g.required);}
 const result={items,baseItems,goods};
 if(deliveryId){const delivered=baseItems.find(x=>x.id===deliveryId);if(delivered){const same=baseItems.filter(x=>x.good===delivered.good&&x.id!==deliveryId),otherRequired=same.reduce((n,x)=>n+x.qty,0),have=Math.floor(st.warehouse.stock[delivered.good]||0),remaining=Math.max(0,have-delivered.qty);result.afterDelivery={id:deliveryId,good:delivered.good,qty:delivered.qty,remaining,otherRequired,shortfall:Math.max(0,otherRequired-remaining)};}}
 return result;
};
HK.guildSidequestSnapshot=function(st,good){
 const qty=st.warehouse.stock[good]||0;return{money:st.money,rep:st.rep,influence:st.influence,stock:qty,goodsValue:HK.goodsValue(st,good,qty),rivalWealth:st.rivals.find(r=>r.id==='bracht')?.wealth||0,factions:{...st.factions},attitude:st.rivals.find(r=>r.id==='bracht')?.attitude||0};
};
HK.guildSidequestRecord=function(st,id,action,before,extra={}){
 const G=st.guildSidequests,q=G.quests[id],after=HK.guildSidequestSnapshot(st,q.good||extra.good),delta={};
 for(const k of ['money','rep','influence','stock','goodsValue','rivalWealth','attitude'])if(after[k]!==before[k])delta[k]=(after[k]||0)-(before[k]||0);
 for(const f of HK.FACTION_IDS)if(after.factions[f]!==before.factions[f])delta[f]=after.factions[f]-before.factions[f];
 const ev={id,action,day:st.day,author:st.name,generation:q.actorGeneration??st.family.generation,delta,...extra};q.history.push(ev);G.history.push(ev);q.history=q.history.slice(-30);G.history=G.history.slice(-100);
 HK.recordDeed?.(st,'guildSidequest','sidequest:'+id+':'+G.nextEvent++,{choice:HK.t('sidequestAction_'+action)});return ev;
};
HK.guildSidequestMail=function(st,id,stage,day=st.day){
 HK.postInit?.(st);HK.postAdd?.(st,'guild-sidequest:'+id+':'+stage+':'+(st.guildSidequests?.nextEvent||1),'guildSidequest',id==='hospital'?'person:priest':'rival:bracht',{id,stage},{date:HK.fmtDate(day)});
};
HK.guildSidequestDetails=function(st,id){
 const main=st.guildSponsorship,q=st.guildSidequests.quests[id],good=main?.terms?.good||'cloth',qty=id==='hospital'?3:(good==='tools'?3:4),price=id==='bracht'?Math.round(HK.GOOD[good].base*1.25):0;
 return{good,qty,quality:85,price,escrow:price*qty,dueAt:q.dueAt,replyDue:q.replyDue};
};
HK.guildSidequestFundBracht=function(st,q,day){
 const r=st.rivals.find(x=>x.id==='bracht'),d=HK.guildSidequestDetails(st,'bracht');if(!r||r.wealth<d.escrow)return false;
 const before=HK.guildSidequestSnapshot(st,d.good);r.wealth-=d.escrow;Object.assign(q,d,{status:'offer',offerAt:day,replyDue:Math.min(day+5,q.fundBy),escrowState:'held',escrowAmount:d.escrow,offerWealth:r.wealth});
 HK.guildSidequestRecord(st,'bracht','funded',before,{good:d.good,qty:d.qty,price:d.price,escrow:d.escrow,replyDue:q.replyDue,dueAt:q.dueAt});HK.guildSidequestMail(st,'bracht','offer',day);return true;
};
HK.guildSidequestRefund=function(st,q){
 if(q.id!=='bracht'||q.escrowState!=='held')return 0;
 const r=st.rivals.find(x=>x.id==='bracht');if(r)r.wealth+=q.escrowAmount;
 q.escrowState='returned';q.refundedAt=st.day;return q.escrowAmount;
};
HK.guildSidequestEnd=function(st,id,outcome,day=st.day){
 const q=st.guildSidequests.quests[id];if(!q||['fulfilled','declined','withdrawn','breach','expired','unfunded'].includes(q.status))return false;
 const before=HK.guildSidequestSnapshot(st,q.good),refund=HK.guildSidequestRefund(st,q),effects=outcome==='withdrawn'||outcome==='breach'?HK.guildSidequestApply(st,id,outcome):{};
 q.status=outcome;q.ending=outcome;q.endedAt=day;q.refund=refund;HK.guildSidequestRecord(st,id,outcome,before,{day,refund,effects,generation:q.actorGeneration??st.family.generation,good:q.good});HK.guildSidequestMail(st,id,'result',day);HK.scheduleSave?.();return true;
};
HK.guildSidequestLaunch=function(st){
 const G=st.guildSidequests||HK.guildSidequestsInit(st),main=st.guildSponsorship,live=['pledged','conflict','active'].includes(main?.status);if(G.status!=='locked'||!Number.isFinite(main?.acceptedAt)||!(live||(!G.legacyPending&&main.status==='resolved')))return false;
 const legacy=G.legacyPending,anchor=legacy?st.day-1:main.acceptedAt,launchDay=legacy?st.day:main.acceptedAt+1;if(st.day<launchDay)return false;if(Number.isFinite(main.terms?.dueAt)&&st.day>main.terms.dueAt){G.status='done';G.legacyPending=false;HK.scheduleSave?.();return false;}
 G.legacyPending=false;G.anchor=anchor;G.launchDay=launchDay;
 for(const[id,days]of [['hospital',10],['bracht',12]]){const q=G.quests[id];if(q.status!=='locked')continue;const dates={anchor,offerAt:launchDay,dueAt:anchor+days,replyDue:launchDay+5};Object.assign(q,dates,{good:main.terms.good,qty:id==='hospital'?3:(main.terms.good==='tools'?3:4),quality:85,extensionUsed:false,history:[]});
  if(id==='hospital'){q.status=st.day>q.replyDue?'expired':'offer';if(q.status==='offer')HK.guildSidequestMail(st,id,'offer',launchDay);else{q.ending='expired';q.endedAt=q.replyDue+1;HK.guildSidequestRecord(st,id,'expired',HK.guildSidequestSnapshot(st,q.good),{day:q.endedAt,good:q.good});HK.guildSidequestMail(st,id,'result',q.endedAt);}}
  else{q.fundBy=q.replyDue;q.status='waitingFunds';if(st.day<q.fundBy)HK.guildSidequestFundBracht(st,q,st.day);else{q.status='unfunded';q.ending='unfunded';q.endedAt=q.fundBy;HK.guildSidequestRecord(st,id,'unfunded',HK.guildSidequestSnapshot(st,q.good),{day:q.endedAt,good:q.good});HK.guildSidequestMail(st,id,'result',q.endedAt);}}
 }
 G.status='open';HK.scheduleSave?.();return true;
};
HK.guildSidequestInitSchedule=function(st){
 const G=st.guildSidequests||HK.guildSidequestsInit(st),main=st.guildSponsorship;if(G.status!=='locked')return false;if(G.legacyPending)return HK.guildSidequestLaunch(st);
 if(!main||!['pledged','conflict','active','resolved'].includes(main.status))return false;
 return HK.guildSidequestLaunch(st);
};
HK.guildSidequestSync=function(st){
 const G=st.guildSidequests||HK.guildSidequestsInit(st);if(st.gameOver)return;HK.guildSidequestInitSchedule(st);
 for(const id of ['hospital','bracht']){const q=G.quests[id];
  if(q.status==='waitingFunds'){
   if(st.day>=q.fundBy){q.status='unfunded';q.ending='unfunded';q.endedAt=q.fundBy;HK.guildSidequestRecord(st,id,'unfunded',HK.guildSidequestSnapshot(st,q.good),{day:q.fundBy,good:q.good});continue;}
   HK.guildSidequestFundBracht(st,q,st.day);continue;
  }
  if(q.status==='offer'&&st.day>q.replyDue){HK.guildSidequestEnd(st,id,'expired',q.replyDue+1);continue;}
  if(q.status==='active'&&st.day>q.dueAt)HK.guildSidequestEnd(st,id,'breach',q.dueAt+1);
 }
};
HK.guildSidequestQuote=function(st,id,action,expected){
 const q=st.guildSidequests?.quests?.[id],no=msg=>({ok:false,msg:msg||'sidequestGone'});if(!q||st.gameOver)return no();const out={ok:true,id,action,expected,cost:0,goods:0,quality:0};
 if(expected==='offer'&&q.status==='offer'&&st.day<=q.replyDue){if(['accept','decline'].includes(action))return out;}
 if(expected==='active'&&q.status==='active'&&st.day<=q.dueAt){
  if(action==='withdraw')return out;
  if(action==='extend'){if(q.extensionUsed)return no('sidequestExtended');if(st.influence<1)return no('needInfluence');out.cost=1;out.newDue=q.dueAt+4;return out;}
  if(action==='fulfill'){
   out.goods=q.qty;out.good=q.good;out.quality=HK.goodQuality(st,q.good);out.requiredQuality=q.quality;out.remaining=Math.max(0,(st.warehouse.stock[q.good]||0)-q.qty);
   const summary=HK.guildSidequestSummary(st,null,id);out.afterDelivery=summary.afterDelivery;
   if((st.warehouse.stock[q.good]||0)<q.qty)out.ok=false,out.msg='notEnoughCargo';else if(out.quality<q.quality)out.ok=false,out.msg='cityQualityRequired';return out;
  }
 }
 return{ok:false,msg:'sidequestGone'};
};
HK.guildSidequestAct=function(st,id,action,expected){
 const q=st.guildSidequests?.quests?.[id],r=HK.guildSidequestQuote(st,id,action,expected);if(!r.ok)return r;
 const before=HK.guildSidequestSnapshot(st,q.good);
 if(expected==='offer'){
  if(action==='decline'){HK.guildSidequestEnd(st,id,'declined');return{ok:true};}
  q.status='active';q.acceptedAt=st.day;q.actorGeneration=st.family.generation;HK.guildSidequestRecord(st,id,'accept',before,{good:q.good,qty:q.qty,quality:q.quality,dueAt:q.dueAt,replyDue:q.replyDue,escrow:q.escrowAmount||0});HK.scheduleSave?.();return{ok:true};
 }
 if(action==='extend'){st.influence--;q.extensionUsed=true;q.extendedAt=st.day;q.dueAt=r.newDue;HK.guildSidequestRecord(st,id,'extend',before,{good:q.good,cost:1,dueAt:q.dueAt});HK.scheduleSave?.();return{ok:true};}
 if(action==='withdraw'){HK.guildSidequestEnd(st,id,'withdrawn');return{ok:true};}
 if(action==='fulfill'){
  const basis=HK.goodsValue(st,q.good,q.qty);HK.addStock(st.warehouse.stock,q.good,-q.qty);
  if(id==='bracht'){HK.book(st,'contracts',q.escrowAmount);st.stats.volume+=q.escrowAmount;q.escrowState='paid';q.paidAt=st.day;}
  HK.guildSidequestApply(st,id,'fulfilled');q.delivered={qty:q.qty,good:q.good,quality:r.quality,basis,day:st.day};q.status='fulfilled';q.ending='fulfilled';q.endedAt=st.day;
  HK.guildSidequestRecord(st,id,'fulfilled',before,{good:q.good,qty:q.qty,quality:r.quality,basis,reward:id==='bracht'?q.escrowAmount:0,afterDelivery:r.afterDelivery,generation:q.actorGeneration});HK.guildSidequestMail(st,id,'result');HK.scheduleSave?.();return{ok:true};
 }
 return{ok:false,msg:'sidequestGone'};
};
HK.tickHooks.push(st=>HK.guildSidequestSync(st));
