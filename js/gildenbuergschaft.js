/* The guild's trial surety is a finite, opt-in story. Promised goods always come
   from the player's warehouse; only the stated municipal share reaches town stock. */
'use strict';
HK.guildSponsorshipInit=function(st){return st.guildSponsorship ||= {version:1,status:'locked',history:[],nextEvent:1,voucher:null};};
HK.newGameHooks.push(HK.guildSponsorshipInit);HK.migrateHooks.push(HK.guildSponsorshipInit);
HK.guildSponsorshipPatronFaction=path=>({kruse:'kaufleute',guild:'zuenfte',independent:null}[path]||null);
HK.guildSponsorshipFreshBreach=st=>{
 const B=st.breadStory,F=B?.followup;
 const badDates=[];
 if(['exposed','missedReview','expired'].includes(B?.ending)&&Number.isFinite(B.finished))badDates.push(B.finished);
 if(F?.ending==='breach'&&Number.isFinite(F.resolvedAt))badDates.push(F.resolvedAt);
 const lastBad=Math.max(...badDates);
 if(!Number.isFinite(lastBad)||st.day-lastBad>=90)return false;
 return !(F?.ending==='fulfilled'&&Number.isFinite(F.resolvedAt)&&F.resolvedAt>lastBad);
};
HK.guildSponsorshipEligible=function(st){
 const B=st.breadStory,F=B?.followup;
 if(!B||B.phase!=='done')return false;
 if(F)return F.status==='resolved';
 return true; // Older completed saves receive an optional offer from a normal game sync.
};
HK.guildSponsorshipOffer=function(st){
 const S=HK.guildSponsorshipInit(st),B=st.breadStory,F=B?.followup;if(S.status!=='locked'||!HK.guildSponsorshipEligible(st))return false;
 const facts={kaufleute:st.factions.kaufleute,zuenfte:st.factions.zuenfte},freshBreach=HK.guildSponsorshipFreshBreach(st);
 const routes={
  kruse:{available:!freshBreach&&((F?.ending==='fulfilled'&&F.pledge==='merchants')||facts.kaufleute>=55),reason:freshBreach?'freshBreach':F?.ending==='fulfilled'&&F.pledge==='merchants'?'breadMerchants':facts.kaufleute>=55?'relation':'relationMissing',path:'kruse',good:'cloth',qty:8,quality:85,days:18,conflictAfter:5,cityQty:2,discount:20},
  guild:{available:(F?.ending==='fulfilled'&&F.pledge==='council')||facts.zuenfte>=55,reason:F?.ending==='fulfilled'&&F.pledge==='council'?'breadCouncil':facts.zuenfte>=55?'relation':'relationMissing',path:'guild',good:'flour',qty:10,quality:85,days:18,conflictAfter:5,cityQty:3,discount:20},
  independent:{available:true,reason:'independent',path:'independent',good:'tools',qty:6,quality:85,days:26,conflictAfter:8,cityQty:2,discount:20}
 };
 const previous=F?`${F.pledge||'none'}:${F.ending}`:B.ending||'legacy';
 S.status='offer';S.offer={at:st.day,replyDue:st.day+10,factions:facts,previous,freshBreach,routes};
 HK.guildSponsorshipMail(st,'offer');HK.scheduleSave?.();return true;
};
HK.guildSponsorshipSnapshot=function(st,good){
 const qty=good?st.warehouse.stock[good]||0:0;
 return {money:st.money,rep:st.rep,influence:st.influence,mood:st.cityLife?.mood,stock:qty,townStock:good?st.town.stock[good]||0:0,goodsValue:good?HK.goodsValue(st,good,qty):0,factions:{...st.factions}};
};
HK.guildSponsorshipRecord=function(st,action,before,extra={}){
 const S=st.guildSponsorship,good=extra.good||S.terms?.good,after=HK.guildSponsorshipSnapshot(st,good),delta={};
 for(const k of ['money','rep','influence','mood','stock','townStock','goodsValue'])if(after[k]!==before[k])delta[k]=(after[k]||0)-(before[k]||0);
 for(const f of HK.FACTION_IDS)if(after.factions[f]!==before.factions[f])delta[f]=after.factions[f]-before.factions[f];
 const e={action,day:st.day,author:st.name,generation:st.family.generation,delta,...extra};S.history.push(e);S.history=S.history.slice(-80);
 HK.recordDeed?.(st,'guildSponsorship','guild-surety:'+S.nextEvent++,{choice:HK.t('guildSuretyAction_'+action)});
 return e;
};
HK.guildSponsorshipMail=function(st,stage,day=st.day){
 HK.postInit?.(st);HK.postAdd?.(st,'guild-surety:'+stage+':'+(st.guildSponsorship?.nextEvent||1),'guildSponsorship','person:mayor',{stage},{date:HK.fmtDate(day)});
};
HK.guildSponsorshipTerms=function(st,path){
 const r=st.guildSponsorship.offer?.routes[path];if(!r?.available)return null;
 return {...r,dueAt:st.day+r.days,conflictAt:st.day+r.conflictAfter,cityQty:r.cityQty,patronQty:r.qty,replyDue:st.day+r.days};
};
HK.guildSponsorshipQuote=function(st,action,expected,path){
 const S=st.guildSponsorship,no=msg=>({ok:false,msg:msg||'guildSuretyGone'});if(st.gameOver||!S)return no();
 const q={ok:true,action,expected,path,cost:0,influenceCost:0,goods:0,quality:0};
 if(expected==='offer'&&S.status==='offer'&&st.day<=S.offer.replyDue){
  if(action==='decline')return q;
  if(action==='accept'){if(!S.offer.routes[path]?.available)return no();return q;}
 }else if(expected==='conflict'&&S.status==='conflict'&&st.day<=S.conflict.replyDue){
  if(action==='hold'||action==='withdraw')return q;
  if(action==='compromise'){q.influenceCost=2;if(st.influence<2)q.ok=false,q.msg='needInfluence';return q;}
 }else if(expected==='active'&&S.status==='active'&&st.day<=S.terms.dueAt){
  if(action==='withdraw')return q;
  if(action==='fulfill'){
   if(st.day>S.terms.dueAt)return no('guildSuretyLate');q.goods=S.delivery.qty;q.quality=HK.goodQuality(st,S.terms.good);q.requiredQuality=S.terms.quality;
   if((st.warehouse.stock[S.terms.good]||0)<q.goods)q.ok=false,q.msg='notEnoughCargo';else if(q.quality<q.requiredQuality)q.ok=false,q.msg='cityQualityRequired';return q;
  }
 }else if(expected==='reward'&&S.status==='resolved'&&S.voucher?.status==='available'&&action==='exchange')return q;
 return no();
};
HK.guildSponsorshipResolve=function(st,ending,day=st.day){
 const S=st.guildSponsorship;if(!S||S.status==='resolved')return;
 S.status='resolved';S.ending=ending;S.resolvedAt=day;
 if(ending==='fulfilled')S.voucher={status:'available',discount:S.delivery.kind==='hold'?20:10,earnedAt:day,usedFor:null,kind:'license'};
 HK.guildSponsorshipMail(st,'result',day);HK.scheduleSave?.();
};
HK.guildSponsorshipEffectDelta=function(S,ending){
 const patron=HK.guildSponsorshipPatronFaction(S.terms?.path),kind=S.delivery?.kind||'hold',e={};
 if(ending==='fulfilled'){
  e.rep=2;if(patron)e[patron]=kind==='hold'?4:2;
  if(kind==='hold'){e.influence=-2;e.patrizier=-2;}
  else {e.patrizier=1;}
 }else if(ending==='withdrawn'){e.rep=-1;if(patron)e[patron]=-2;}
 else if(ending==='breach'){e.rep=-3;e.mood=-2;if(patron)e[patron]=-4;}
 return e;
};
HK.guildSponsorshipEffects=function(st,ending){const e=HK.guildSponsorshipEffectDelta(st.guildSponsorship,ending);HK.intrigueEffects(st,e);if(e.mood&&st.cityLife)st.cityLife.mood=HK.clamp(st.cityLife.mood+e.mood,0,100);return e;};
HK.guildSponsorshipBreach=function(st,day){
 const S=st.guildSponsorship;if(!S||S.status==='resolved')return;
 const before=HK.guildSponsorshipSnapshot(st,S.terms?.good);HK.guildSponsorshipEffects(st,'breach');
 HK.guildSponsorshipRecord(st,'breach',before,{day,generation:S.actorGeneration,good:S.terms.good});HK.guildSponsorshipResolve(st,'breach',day);
};
HK.guildSponsorshipSync=function(st){
 const S=HK.guildSponsorshipInit(st);if(st.gameOver)return;
 if(S.status==='locked'){HK.guildSponsorshipOffer(st);return;}
 if(S.status==='offer'&&st.day>S.offer.replyDue){S.history.push({action:'unanswered',day:S.offer.replyDue+1,author:st.name,generation:st.family.generation});HK.guildSponsorshipResolve(st,'unanswered',S.offer.replyDue+1);return;}
 if(S.status==='pledged'&&st.day>=S.terms.conflictAt){
  const good=S.terms.good,have=Math.floor(st.warehouse.stock[good]||0),quality=HK.goodQuality(st,good),townStock=Math.floor(st.town.stock[good]||0),desired=HK.desired(good);
  S.conflict={at:S.terms.conflictAt,replyDue:S.terms.conflictAt+5,requested:S.terms.cityQty,available:have,quality,adequate:townStock>=desired,townStock,desired};
  S.status='conflict';HK.guildSponsorshipMail(st,'conflict',S.conflict.at);HK.scheduleSave?.();
 }
 if(S.status==='conflict'&&st.day>S.conflict.replyDue){HK.guildSponsorshipBreach(st,S.conflict.replyDue+1);return;}
 if(S.status==='active'&&st.day>S.terms.dueAt){HK.guildSponsorshipBreach(st,S.terms.dueAt+1);return;}
};
HK.guildSponsorshipAct=function(st,action,expected,path){
 const q=HK.guildSponsorshipQuote(st,action,expected,path);if(!q.ok)return q;
 const S=st.guildSponsorship,before=HK.guildSponsorshipSnapshot(st,S.terms?.good||path&&S.offer?.routes[path]?.good);
 if(q.influenceCost)st.influence-=q.influenceCost;
 if(expected==='offer'){
  if(action==='decline'){HK.guildSponsorshipRecord(st,'decline',before);HK.guildSponsorshipResolve(st,'declined');return{ok:true};}
  S.terms=HK.guildSponsorshipTerms(st,path);S.actorGeneration=st.family.generation;S.acceptedAt=st.day;S.status='pledged';HK.guildSponsorshipRecord(st,'accept',before,{path,good:S.terms.good,qty:S.terms.qty,terms:{...S.terms},generation:S.actorGeneration});HK.scheduleSave?.();return{ok:true};
 }
 if(expected==='conflict'){
  if(action==='withdraw'){HK.guildSponsorshipEffects(st,'withdrawn');HK.guildSponsorshipRecord(st,'withdraw',before,{path:S.terms.path,generation:S.actorGeneration});HK.guildSponsorshipResolve(st,'withdrawn');return{ok:true};}
  S.delivery={kind:action,qty:S.terms.qty,cityQty:action==='compromise'?S.terms.cityQty:0,patronQty:action==='compromise'?S.terms.qty-S.terms.cityQty:S.terms.qty,decisionAt:st.day};S.status='active';HK.guildSponsorshipRecord(st,action,before,{path:S.terms.path,good:S.terms.good,cityQty:S.delivery.cityQty,patronQty:S.delivery.patronQty,influence:q.influenceCost,generation:S.actorGeneration});HK.scheduleSave?.();return{ok:true};
 }
 if(expected==='active'){
  if(action==='withdraw'){HK.guildSponsorshipEffects(st,'withdrawn');HK.guildSponsorshipRecord(st,'withdraw',before,{path:S.terms.path,generation:S.actorGeneration});HK.guildSponsorshipResolve(st,'withdrawn');return{ok:true};}
  const quality=q.quality;HK.addStock(st.warehouse.stock,S.terms.good,-q.goods);
  if(S.delivery.cityQty)HK.withQuality(quality,()=>HK.addStock(st.town.stock,S.terms.good,S.delivery.cityQty));
  S.delivered={qty:q.goods,quality,cityQty:S.delivery.cityQty,patronQty:S.delivery.patronQty,good:S.terms.good,day:st.day};
  HK.guildSponsorshipEffects(st,'fulfilled');HK.guildSponsorshipRecord(st,'fulfill',before,{good:S.terms.good,quality,qty:q.goods,cityQty:S.delivery.cityQty,patronQty:S.delivery.patronQty,generation:S.actorGeneration});HK.guildSponsorshipResolve(st,'fulfilled');return{ok:true};
 }
 if(expected==='reward'){
  S.voucher.status='exchanged';S.voucher.exchangedAt=st.day;S.voucher.exchange='influence';st.influence+=3;HK.guildSponsorshipRecord(st,'exchange',before,{generation:st.family.generation,influence:3});HK.scheduleSave?.();return{ok:true};
 }
 return{ok:false,msg:'guildSuretyGone'};
};
HK.licensePrice=(function(base){return function(st,type){const price=base(st,type),v=st.guildSponsorship?.voucher;if(v?.kind==='license'&&v.status==='available'&&HK.WORKSHOP[type]&&!st.licenses[type])return Math.max(0,Math.round(price*(100-v.discount)/100));return price;};})(HK.licensePrice);
HK.guildSponsorshipConsumeVoucher=function(st,type,paid){
 const S=st.guildSponsorship,v=S?.voucher;if(!v||v.status!=='available')return false;
 const base=HK.WORKSHOP[type]?.license||0;v.status='used';v.usedAt=st.day;v.usedFor=type;v.paid=paid;v.saving=base-paid;
 S.history.push({action:'licenseDiscount',day:st.day,author:st.name,generation:st.family.generation,good:type,paid,saving:v.saving});HK.recordDeed?.(st,'guildSponsorship','guild-surety:voucher:'+type,{choice:HK.t('guildSuretyAction_licenseDiscount')});HK.scheduleSave?.();return true;
};
HK.tickHooks.push(st=>HK.guildSponsorshipSync(st));
