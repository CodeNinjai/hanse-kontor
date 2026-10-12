'use strict';
HK.guildSponsorshipStatus=function(S){
 if(!S||S.status==='locked')return'active';
 if(['offer','conflict'].includes(S.status)||S.status==='resolved'&&S.voucher?.status==='available')return'available';
 if(['pledged','active'].includes(S.status))return'active';
 if(S.status==='resolved'&&['breach','withdrawn'].includes(S.ending))return'failed';
 return'done';
};
Object.assign(HK.UI,{
 guildSuretyNext(){const S=HK.state.guildSponsorship;if(S.status==='offer')return HK.t('guildSuretyNext_offer',{date:HK.fmtDate(S.offer.replyDue)});if(S.status==='pledged')return HK.t('guildSuretyNext_pledged',{date:HK.fmtDate(S.terms.conflictAt)});if(S.status==='conflict')return HK.t('guildSuretyNext_conflict',{date:HK.fmtDate(S.conflict.replyDue)});if(S.status==='active')return HK.t('guildSuretyNext_active',{date:HK.fmtDate(S.terms.dueAt)});if(S.status==='resolved')return HK.t('guildSuretyNext_resolved',{ending:HK.t('guildSuretyEnding_'+S.ending)});return HK.t('guildSuretyStoryIntro');},
 guildSuretyOpen(){return `<button class="small" data-action="guildsuretyopen">${HK.t('guildSuretyOpen')} →</button>`;},
 guildSuretyRouteCard(path,r){
  const st=HK.state,S=st.guildSponsorship,term=r,due=HK.fmtDate(HK.state.day+term.days),conflict=term.conflictAfter;
  const reason=HK.t('guildSuretyReason_'+path+'_'+term.reason);
  let h=`<article class="intrigue-choice guild-surety-choice"><div class="plan-heading">${HK.MenuArt.place(path==='kruse'?'guild':'craftguild')}<b>${HK.t('guildSuretyRoute_'+path)}</b></div><p>${reason}</p><p>${HK.t('guildSuretyRouteTerms',{due,qty:term.qty,good:HK.goodName(term.good),quality:term.quality,conflict,cityQty:term.cityQty})}</p><p>${HK.t('guildSuretyPreview_full')}</p><div class="guild-surety-effects">${this.intrigueEffects(HK.guildSponsorshipEffectDelta({terms:{path},delivery:{kind:'hold'}},'fulfilled'))}</div><p>${HK.t('guildSuretyPreview_split',{cityQty:term.cityQty})}</p><div class="guild-surety-effects">${this.intrigueEffects(HK.guildSponsorshipEffectDelta({terms:{path},delivery:{kind:'compromise'}},'fulfilled'))}</div><p class="hint">${HK.t('guildSuretyRouteReward')}</p><button class="small primary" data-action="guildsurety" data-choice="accept" data-stage="offer" data-path="${path}" ${term.available?'':'disabled'}>${HK.t(term.available?'guildSuretyAction_accept':'guildSuretyUnavailable')}</button></article>`;
  return h;
 },
 guildSuretyActionCard(action,expected,desc,extra=''){
  const q=HK.guildSponsorshipQuote(HK.state,action,expected),place=action==='withdraw'?'townhall':action==='exchange'?'guild':'guild';
  let h=`<article class="intrigue-choice guild-surety-choice"><div class="plan-heading">${HK.MenuArt.place(place)}<b>${HK.t('guildSuretyAction_'+(action==='accept'?'accept':action==='decline'?'declineButton':action==='hold'?'holdButton':action==='compromise'?'compromiseButton':action==='withdraw'?'withdrawButton':action==='fulfill'?'fulfillButton':'exchangeButton'))}</b></div>`;
  if(extra)h+=extra;
  if(desc)h+=`<p>${desc}</p>`;
  if(!q.ok)h+=`<small class="plan-risk">${HK.t(q.msg)}</small>`;
  return h+`<button class="small ${['withdraw','decline','exchange'].includes(action)?'':'primary'}" data-action="guildsurety" data-choice="${action}" data-stage="${expected}" ${q.ok?'':'disabled'}>${HK.t('guildSuretyAction_'+(action==='accept'?'accept':action==='decline'?'declineButton':action==='hold'?'holdButton':action==='compromise'?'compromiseButton':action==='withdraw'?'withdrawButton':action==='fulfill'?'fulfillButton':'exchangeButton'))}</button></article>`;
 },
 guildSuretyMissionCard(value,status){
  const S=HK.state.guildSponsorship;let h=`<article class="mission-card ${status}" data-mission="guildSurety">${this.missionHeader('story',HK.t('guildSuretyTitle'),HK.t('guildSuretySubtitle'),HK.MenuArt.place('guild'),status)}${this.missionNext(this.guildSuretyNext())}`;
  if(S.terms)h+=`<p>${HK.t('guildSuretyTermsActive',{qty:S.terms.qty,good:HK.goodName(S.terms.good),quality:S.terms.quality,date:HK.fmtDate(S.terms.dueAt),patronQty:S.delivery?.patronQty??S.terms.qty,cityQty:S.delivery?.cityQty??0})}</p>`;
  if(S.voucher?.status==='available')h+=`<p class="tag gold">${HK.t('guildSuretyVoucherAvailable',{discount:S.voucher.discount})}</p>`;
  return h+`<div class="mission-actions"><button class="small" data-action="missionfocus" data-value="guildSurety">${HK.t('missionOpen')}</button></div></article>`;
 },
 guildSuretyPanel(){
  const st=HK.state,S=st.guildSponsorship;let h=`<button class="small work-back" data-action="missionfocus" data-value="">← ${HK.t('missionBack')}</button><section class="intrigue-story guild-surety-story">${this.helpHeading('guildSuretyTitle','guildSuretyStoryIntro',2)}${this.missionNext(this.guildSuretyNext())}`;
  if(S.status==='offer'){
   h+=`<p>${HK.t('guildSuretyOfferIntro',{date:HK.fmtDate(S.offer.replyDue)})}</p><p>${HK.t('guildSuretyNoAdvance')}</p><p>${HK.t('guildSuretyConflictRisk')}</p><div class="intrigue-choices">${Object.entries(S.offer.routes).map(([path,r])=>this.guildSuretyRouteCard(path,r)).join('')}${this.guildSuretyActionCard('decline','offer',HK.t('guildSuretyDecline'))}</div>`;
  }
  if(S.status==='pledged')h+=`<p>${HK.t('guildSuretyTermsActive',{qty:S.terms.qty,good:HK.goodName(S.terms.good),quality:S.terms.quality,date:HK.fmtDate(S.terms.dueAt),patronQty:S.terms.qty,cityQty:0})}</p><p>${HK.t('guildSuretyNext_pledged',{date:HK.fmtDate(S.terms.conflictAt)})}</p>`;
  if(S.status==='conflict'){
   const c=S.conflict,T=S.terms;
   h+=`<h3>${HK.t('guildSuretyConflictTitle')}</h3><p>${HK.t('guildSuretyConflictText',{date:HK.fmtDate(c.at),requested:c.requested,good:HK.goodName(T.good),available:c.available,quality:Math.round(c.quality),townStock:c.townStock,desired:c.desired,qty:T.qty,due:HK.fmtDate(T.dueAt)})}</p><p class="${c.adequate?'positive':'hint'}">${HK.t(c.adequate?'guildSuretyStockEnough':'guildSuretyStockLow')}</p><p>${HK.t('guildSuretyConflictChoice')}</p><div class="intrigue-choices">${this.guildSuretyActionCard('hold','conflict',HK.t('guildSuretyPreview_full'),this.intrigueEffects(HK.guildSponsorshipEffectDelta({terms:{path:T.path},delivery:{kind:'hold'}},'fulfilled')))}${this.guildSuretyActionCard('compromise','conflict',HK.t('guildSuretyPreview_split',{cityQty:T.cityQty}),this.intrigueEffects(HK.guildSponsorshipEffectDelta({terms:{path:T.path},delivery:{kind:'compromise'}},'fulfilled'))+'<div class="intrigue-price"><span>'+HK.t('ig_cost')+'</span><strong>'+HK.t('guildSuretyInfluenceCost')+'</strong></div>')}${this.guildSuretyActionCard('withdraw','conflict',HK.t('guildSuretyWithdraw'),this.intrigueEffects(HK.guildSponsorshipEffectsPreview('withdrawn')))}</div>`;
  }
  if(S.status==='active'){
   const T=S.terms,D=S.delivery,q=HK.guildSponsorshipQuote(st,'fulfill','active');
   h+=`<p>${HK.t('guildSuretyTermsActive',{qty:T.qty,good:HK.goodName(T.good),quality:T.quality,date:HK.fmtDate(T.dueAt),patronQty:D.patronQty,cityQty:D.cityQty})}</p><p>${D.cityQty?HK.t('guildSuretyActualQuality',{quality:Math.round(HK.goodQuality(st,T.good))}):HK.t('guildSuretyNoCityShare')}</p><p>${HK.t('guildSuretyPatronHandover')}</p><div class="mission-progress"><p>${HK.goodName(T.good)} · ${HK.t('saltStockCompact',{have:Math.min(D.qty,Math.floor(st.warehouse.stock[T.good]||0)),qty:D.qty})}</p><progress value="${Math.min(D.qty,Math.floor(st.warehouse.stock[T.good]||0))}" max="${D.qty}"></progress></div>${!q.ok?`<small class="plan-risk">${HK.t(q.msg)}</small>`:''}<div class="intrigue-choices">${this.guildSuretyActionCard('fulfill','active',HK.t('guildSuretyTermsActive',{qty:D.qty,good:HK.goodName(T.good),quality:T.quality,date:HK.fmtDate(T.dueAt),patronQty:D.patronQty,cityQty:D.cityQty}))}${this.guildSuretyActionCard('withdraw','active',HK.t('guildSuretyWithdraw'),this.intrigueEffects(HK.guildSponsorshipEffectsPreview('withdrawn')))}</div>`;
  }
  if(S.status==='resolved'){
   h+=`<p>${HK.t('guildSuretyNext_resolved',{ending:HK.t('guildSuretyEnding_'+S.ending)})}</p>`;
   if(S.delivered)h+=`<p>${HK.t('guildSuretyTermsActive',{qty:S.delivered.qty,good:HK.goodName(S.delivered.good),quality:S.delivered.quality,date:HK.fmtDate(S.delivered.day),patronQty:S.delivered.patronQty,cityQty:S.delivered.cityQty})}</p>`;
   if(S.voucher?.status==='available')h+=`<section><h3>${HK.t('guildSuretyRewardTitle')}</h3><p>${HK.t('guildSuretyVoucherAvailable',{discount:S.voucher.discount})}</p>${this.guildSuretyActionCard('exchange','reward',HK.t('guildSuretyVoucherExchanged'))}<button class="small" data-action="guildsuretyguild">${HK.t('guildSuretyGoGuild')} →</button></section>`;
   else if(S.voucher?.status==='used')h+=`<p class="tag gold">${HK.t('guildSuretyVoucherUsed',{workshop:HK.name(HK.WORKSHOP[S.voucher.usedFor]),saving:HK.fmt(S.voucher.saving)})}</p>`;
   else if(S.voucher?.status==='exchanged')h+=`<p class="tag gold">${HK.t('guildSuretyVoucherExchanged')}</p>`;
  }
  if(S.history?.length)h+=`<details class="intrigue-history"><summary>${HK.t('guildSuretyHistory')}</summary><ol>${S.history.map(e=>`<li><small>${HK.fmtDate(e.day)} · ${this.esc(e.author)}</small><b>${HK.t('guildSuretyAction_'+e.action)}</b>${this.intrigueEffects(e.delta)}</li>`).join('')}</ol></details>`;
  return h+'</section>';
 }
});
HK.guildSponsorshipEffectsPreview=ending=>HK.guildSponsorshipEffectDelta(HK.state.guildSponsorship,ending);
{
 const records=HK.UI.missionRecords;HK.UI.missionRecords=function(){const list=records.call(this),S=HK.state.guildSponsorship,status=HK.guildSponsorshipStatus(S);if(S&&S.status!=='locked'&&(status!=='done'||S.history?.length))list.push({kind:'guildSurety',status});return list;};
 const panel=HK.UI.missionsPanel;HK.UI.missionsPanel=function(){return this.missionFocus==='guildSurety'?this.guildSuretyPanel():panel.call(this);};
 const letter=HK.UI.postLetterBody;HK.UI.postLetterBody=function(m){if(m.type==='guildSponsorship'){const S=HK.state.guildSponsorship,date=m.ref.stage==='offer'?S.offer?.replyDue:m.ref.stage==='conflict'?S.conflict?.at:m.day;return `${HK.t('guildSuretyMail_'+m.ref.stage,{date:HK.fmtDate(date??m.day)})}<br>${this.guildSuretyOpen()}`;}return letter.call(this,m);};
 const guild=HK.UI.panel_guild;HK.UI.panel_guild=function(...args){const h=guild.apply(this,args),S=HK.state.guildSponsorship;if(!S||S.status==='locked')return h;const status=HK.guildSponsorshipStatus(S);return h+`<section class="guild-surety-link"><h3>${HK.t('guildSuretyTitle')}</h3><p>${(status==='available'?HK.t('guildSuretyGuildLink'):this.guildSuretyNext())}</p>${this.guildSuretyOpen()}<button class="small" data-action="guildsuretyguild">${HK.t('guildSuretyGoGuild')} →</button></section>`;};
 const action=HK.UI.action;HK.UI.action=function(d){
  if(d.action==='guildsuretyopen'){this.missionFocus='guildSurety';this.setTab('missions');this.sidebar.scrollTop=0;return;}
  if(d.action==='guildsuretyguild'){this.setTab('place');this.panel='guild';this.renderAll();return;}
  if(d.action==='guildsurety'){this.result(HK.guildSponsorshipAct(HK.state,d.choice,d.stage,d.path));this.renderAll();return;}
  return action.call(this,d);
 };
}
