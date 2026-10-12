'use strict';
HK.guildSidequestMissionStatus=q=>['active'].includes(q.status)?'active':['offer','waitingFunds'].includes(q.status)?'available':q.status==='breach'?'failed':['fulfilled','declined','withdrawn','expired','unfunded'].includes(q.status)?'done':null;
Object.assign(HK.UI,{
 guildSidequestNext(id){const q=HK.state.guildSidequests.quests[id];if(q.status==='offer')return HK.t('sidequestNext_offer',{date:HK.fmtDate(q.replyDue)});if(q.status==='waitingFunds')return HK.t('sidequestNext_waiting',{date:HK.fmtDate(q.fundBy)});if(q.status==='active')return HK.t('sidequestNext_active',{date:HK.fmtDate(q.dueAt)});if(q.status==='fulfilled')return HK.t('sidequestNext_fulfilled');if(q.status==='declined')return HK.t('sidequestNext_declined');if(q.status==='withdrawn')return HK.t('sidequestNext_withdrawn');if(q.status==='breach')return HK.t('sidequestNext_breach');if(q.status==='unfunded')return HK.t('sidequestNext_unfunded');return HK.t('sidequestNext_expired');},
 guildSidequestOpen(id){return `<button class="small" data-action="missionfocus" data-value="guildSidequest-${id}">${HK.t('missionOpen')} →</button>`;},
 guildSidequestMarket(good){return `<button class="small" data-action="guildside_market" data-good="${good}">${HK.t('sidequestMarket',{good:HK.goodName(good)})} →</button>`;},
 guildSidequestBalance(prospective=null,delivery=null){
  const st=HK.state,B=HK.guildSidequestSummary(st,prospective,delivery);let h=`<section class="guild-side-balance"><h3>${HK.t('sidequestBalanceTitle')}</h3><p>${HK.t('sidequestBalanceScope')}</p>`;
  const goods=Object.values(B.goods);if(!goods.length)return h+`<p>${HK.t('sidequestNoPromises')}</p></section>`;
  h+=goods.map(g=>`<article class="guild-side-balance-good"><h4>${HK.MenuArt.good(g.good)} ${HK.goodName(g.good)}</h4><p>${HK.t('sidequestBalanceLine',{have:g.have,required:g.required,shortfall:g.shortfall})}</p><ul>${g.items.map(i=>`<li>${HK.t(i.labelKey)} · ${i.qty} ${HK.t('unitLast')} · ${HK.t('tradeDue')}: ${HK.fmtDate(i.due)}${i.kind==='prospective'?` <b>${HK.t('sidequestProspective')}</b>`:''} ${this.guildSidequestPromiseLink(i)}</li>`).join('')}</ul>${g.free>0?`<small>${HK.t('sidequestAfterAll',{qty:g.free})}</small>`:''}</article>`).join('');
  if(delivery&&B.afterDelivery){const a=B.afterDelivery;h+=`<section class="guild-side-after-delivery"><h4>${HK.t('sidequestAfterDeliveryTitle')}</h4><p class="hint">${HK.t('sidequestAfterDelivery',{qty:a.qty,good:HK.goodName(a.good),remaining:a.remaining,required:a.otherRequired,shortfall:a.shortfall})}</p></section>`;}
  return h+'</section>';
 },
 guildSidequestPromiseLink(item){
  if(item.kind==='surety')return `<button class="small" data-action="guildsuretyopen">${HK.t('sidequestOpenPromise')} →</button>`;
  if(item.kind==='contract')return `<button class="small" data-action="missionfocus" data-value="guildContract-${this.esc(item.id.slice(9))}">${HK.t('sidequestOpenPromise')} →</button>`;
  const id=item.id.startsWith('prospective:')?item.id.slice(12):item.id;
  return `<button class="small" data-action="missionfocus" data-value="guildSidequest-${id}">${HK.t('sidequestOpenPromise')} →</button>`;
 },
 guildSidequestContract(id){
  const c=HK.state.contracts?.active?.find(x=>String(x.id)===String(id));if(!c)return this.workHeading('missionsTitle','missionsHint','missions')+`<button class="small work-back" data-action="missionfocus" data-value="">← ${HK.t('missionBack')}</button>`;
  return this.workHeading('missionsTitle','missionsHint','missions')+`<button class="small work-back" data-action="missionfocus" data-value="">← ${HK.t('missionBack')}</button>`+this.missionContractCard(c,'active');
 },
 guildSidequestEffects(id,outcome){return this.intrigueEffects(HK.guildSidequestEffects(id,outcome));},
 guildSidequestEffectHistory(delta){
  const labels={money:'sidequestDelta_money',rep:'sidequestDelta_rep',influence:'sidequestDelta_influence',stock:'sidequestDelta_stock',goodsValue:'sidequestDelta_goodsValue',rivalWealth:'sidequestDelta_rivalWealth',attitude:'sidequestDelta_attitude'};
  return `<div class="intrigue-effects">${Object.entries(delta||{}).filter(([,v])=>v).map(([k,v])=>`<span class="${v>0?'positive':'negative'}">${HK.FACTION_IDS.includes(k)?HK.FACTIONS[k][HK.LANG]:HK.t(labels[k]||k)} <b>${v>0?'+':''}${HK.fmt(v)}${['money','goodsValue','rivalWealth'].includes(k)?' '+HK.t('mark'):k==='stock'?' '+HK.t('unitLast'):''}</b></span>`).join('')}</div>`;
 },
 guildSidequestMissionCard(value,status){
  const q=HK.state.guildSidequests.quests[value];if(!q)return'';const good=q.good||HK.state.guildSponsorship?.terms?.good||'cloth';
  let h=`<article class="mission-card ${status}" data-mission="guildSidequest-${value}">${this.missionHeader('delivery',HK.t(HK.guildSidequestNames[value]),HK.t('sidequestSeries'),HK.MenuArt.place(value==='hospital'?'church':'guild'),status)}${this.missionNext(this.guildSidequestNext(value))}`;
  if(q.qty)h+=`<p>${HK.t('sidequestTerms',{qty:q.qty,good:HK.goodName(good),quality:q.quality??85,due:HK.fmtDate(q.dueAt??HK.state.day)})}</p>`;
  if(q.id==='bracht'&&q.escrowAmount)h+=`<p>${HK.t('sidequestBrachtPrice',{price:HK.fmt(q.price),total:HK.fmt(q.escrowAmount)})}</p>`;
  if(status==='active'){const have=Math.min(q.qty,Math.floor(HK.state.warehouse.stock[good]||0));h+=this.missionProgress(`${HK.goodName(good)} · ${HK.t('saltStockCompact',{have,qty:q.qty})}`,have,q.qty);}
  return h+`<div class="mission-actions">${this.guildSidequestOpen(value)}</div></article>`;
 },
 guildSidequestActionCard(id,action,expected,description,extra=''){
  const q=HK.guildSidequestQuote(HK.state,id,action,expected),name=action==='accept'?'sidequestAccept':action==='decline'?'sidequestDecline':action==='fulfill'?'sidequestFulfill':action==='extend'?'sidequestExtend':'sidequestWithdraw';
  let h=`<article class="intrigue-choice guild-side-choice"><div class="plan-heading">${HK.MenuArt.place(id==='hospital'?'church':'guild')}<b>${HK.t(name)}</b></div>`;
  if(extra)h+=extra;if(description)h+=`<p>${description}</p>`;if(!q.ok)h+=`<small class="plan-risk">${HK.t(q.msg)}</small>`;
  return h+`<button class="small ${['decline','withdraw'].includes(action)?'':'primary'}" data-action="guildsidequest" data-id="${id}" data-choice="${action}" data-stage="${expected}" ${q.ok?'':'disabled'}>${HK.t(name)}</button></article>`;
 },
 guildSidequestDetail(id){
  const st=HK.state,G=st.guildSidequests,q=G.quests[id],good=q.good||st.guildSponsorship?.terms?.good||'cloth',label=HK.t(HK.guildSidequestNames[id]),ef=id==='hospital'?'sidequestHospitalEffects':'sidequestBrachtEffects';
  let h=`<button class="small work-back" data-action="missionfocus" data-value="">← ${HK.t('missionBack')}</button><section class="intrigue-story guild-side-story">${this.helpHeading(HK.guildSidequestNames[id],'sidequestHelp',2)}${this.missionNext(this.guildSidequestNext(id))}`;
  if(q.status==='offer'){
   h+=`<p>${HK.t(id==='hospital'?'sidequestHospitalIntro':'sidequestBrachtIntro',{good:HK.goodName(good),qty:q.qty,quality:q.quality,due:HK.fmtDate(q.dueAt),reply:HK.fmtDate(q.replyDue),price:HK.fmt(q.price||0),total:HK.fmt(q.escrowAmount||0),sidequestUse:HK.t('sidequestUse_'+good)})}</p><p>${HK.t(ef)}</p>${id==='bracht'?`<p>${HK.t('sidequestEscrow',{rival:HK.rivalName('bracht'),amount:HK.fmt(q.escrowAmount)})}</p>`:''}${this.guildSidequestBalance(id)}${this.guildSidequestMarket(good)}<div class="intrigue-choices">${this.guildSidequestActionCard(id,'accept','offer',HK.t('sidequestAcceptNote'))}${this.guildSidequestActionCard(id,'decline','offer',HK.t(id==='hospital'?'sidequestDeclineNoteHospital':'sidequestDeclineNote'))}</div>`;
  }else if(q.status==='waitingFunds'){
   h+=`<p>${HK.t('sidequestWaitingFunds',{rival:HK.rivalName('bracht'),amount:HK.fmt(HK.guildSidequestDetails(st,'bracht').escrow),date:HK.fmtDate(q.fundBy)})}</p>${this.guildSidequestBalance()}`;
  }else if(q.status==='active'){
   const qf=HK.guildSidequestQuote(st,id,'fulfill','active'),balance=HK.guildSidequestSummary(st,null,id),g=balance.afterDelivery;
   h+=`<p>${HK.t(id==='hospital'?'sidequestHospitalIntro':'sidequestBrachtIntro',{good:HK.goodName(good),qty:q.qty,quality:q.quality,due:HK.fmtDate(q.dueAt),reply:HK.fmtDate(q.replyDue),price:HK.fmt(q.price||0),total:HK.fmt(q.escrowAmount||0),sidequestUse:HK.t('sidequestUse_'+good)})}</p><p>${HK.t(ef)}</p>${id==='bracht'?`<p>${HK.t('sidequestEscrowHeld',{amount:HK.fmt(q.escrowAmount)})}</p>`:''}${this.guildSidequestBalance(null,id)}<div class="mission-progress"><p>${HK.goodName(good)} · ${HK.t('saltStockCompact',{have:Math.min(q.qty,Math.floor(st.warehouse.stock[good]||0)),qty:q.qty})} · ${HK.t('cityMinQuality',{quality:q.quality})}</p><progress value="${Math.min(q.qty,Math.floor(st.warehouse.stock[good]||0))}" max="${q.qty}"></progress></div>${!qf.ok?`<small class="plan-risk">${HK.t(qf.msg)}</small>`:''}<div class="intrigue-choices">${this.guildSidequestActionCard(id,'fulfill','active',HK.t('sidequestFulfillNote',{good:HK.goodName(good),qty:q.qty,quality:qf.quality,remaining:g?.remaining??0,other:g?.otherRequired??0,shortfall:g?.shortfall??0}))}${this.guildSidequestActionCard(id,'extend','active',HK.t('sidequestExtendNote',{cost:1,date:HK.fmtDate(q.dueAt+4)}))}${this.guildSidequestActionCard(id,'withdraw','active',HK.t(id==='hospital'?'sidequestWithdrawNoteHospital':'sidequestWithdrawNote'))}</div>${this.guildSidequestMarket(good)}`;
  }else{
   h+=`<p>${HK.t((id==='hospital'?'sidequestHospitalResult_':'sidequestResult_')+q.status,{qty:q.delivered?.qty||q.qty||0,good:HK.goodName(q.delivered?.good||good),refund:HK.fmt(q.refund||q.escrowAmount||0),reward:HK.fmt(q.escrowAmount||0)})}</p>${id==='bracht'&&q.refund?`<p>${HK.t('sidequestRefund',{amount:HK.fmt(q.refund)})}</p>`:''}`;
   if(q.delivered)h+=`<p>${HK.t('sidequestDelivered',{qty:q.delivered.qty,good:HK.goodName(q.delivered.good),quality:q.delivered.quality,date:HK.fmtDate(q.delivered.day),basis:HK.fmt(q.delivered.basis)})}</p>`;
  }
  if(q.history?.length)h+=`<details class="intrigue-history"><summary>${HK.t('sidequestHistory')}</summary><ol>${q.history.map(e=>`<li><small>${HK.fmtDate(e.day)} · ${this.esc(e.author)}</small><b>${HK.t('sidequestAction_'+e.action)}</b>${this.guildSidequestEffectHistory(e.delta)}</li>`).join('')}</ol></details>`;
  return h+'</section>';
 },
 guildSidequestOverview(delivery=null){
  const G=HK.state.guildSidequests;if(!G||G.status==='locked')return'';
  let h=`<section class="guild-side-overview"><h3>${HK.t('sidequestTitle')}</h3><p>${HK.t('sidequestOverviewIntro')}</p>${this.guildSidequestBalance(null,delivery)}`;
  for(const id of ['hospital','bracht']){const q=G.quests[id];if(q.status!=='locked')h+=`<article class="guild-side-link"><b>${HK.t(HK.guildSidequestNames[id])}</b><p>${this.guildSidequestNext(id)}</p>${this.guildSidequestOpen(id)}</article>`;}
  return h+'</section>';
 }
});
{
 const records=HK.UI.missionRecords;HK.UI.missionRecords=function(){const list=records.call(this),G=HK.state.guildSidequests;for(const id of ['hospital','bracht']){const q=G?.quests?.[id],status=q&&HK.guildSidequestMissionStatus(q);if(status)list.push({kind:'guildSidequest',status,value:id});}return list;};
 const panels=HK.UI.missionsPanel;HK.UI.missionsPanel=function(){if(this.missionFocus==='guildSidequest-hospital'||this.missionFocus==='guildSidequest-bracht')return this.workHeading('missionsTitle','missionsHint','missions')+this.guildSidequestDetail(this.missionFocus.split('-')[1]);if(this.missionFocus?.startsWith('guildContract-'))return this.guildSidequestContract(this.missionFocus.slice(14));return panels.call(this);};
 const guild=HK.UI.panel_guild;HK.UI.panel_guild=function(...args){return guild.apply(this,args)+this.guildSidequestOverview();};
 const post=HK.UI.postLetterBody;HK.UI.postLetterBody=function(m){if(m.type==='guildSidequest'){const {id,stage}=m.ref,q=HK.state.guildSidequests.quests[id],day=stage==='offer'?q.replyDue:stage==='result'?q.endedAt:m.day;return `${HK.t('sidequestMail_'+id+'_'+stage,{date:HK.fmtDate(day??m.day),good:HK.goodName(q.good||'cloth'),qty:q.qty||0})}<br>${this.guildSidequestOpen(id)}`;}return post.call(this,m);};
 const action=HK.UI.action;HK.UI.action=function(d){
  if(d.action==='guildsidequest'){this.result(HK.guildSidequestAct(HK.state,d.id,d.choice,d.stage));this.renderAll();return;}
  if(d.action==='guildside_market'){this.marketGood=d.good;this.inputs.goodGroup='all';HK.Presentation.openPlace('market');this.marketGood=d.good;this.renderAll();return;}
  return action.call(this,d);
 };
 const main=HK.UI.guildSuretyPanel;HK.UI.guildSuretyPanel=function(){return main.call(this)+this.guildSidequestOverview('guildSurety');};
}
