'use strict';
HK.breadStatus=B=>{const F=B.followup;if(B.phase==='offer')return'available';if(B.phase==='declined')return'archived';if(F?.status==='offer')return'available';if(['active','reaction'].includes(F?.status))return'active';if(F?.status==='resolved'&&F.ending==='fulfilled')return'done';if(F?.status==='resolved'&&['breach','withdrawn'].includes(F.ending))return'failed';if(F?.status==='resolved'&&['declined','unanswered'].includes(F.ending))return'archived';return B.phase==='done'?['expired','exposed','missedReview'].includes(B.ending)?'failed':['declined','unanswered'].includes(B.ending)?'archived':'done':'active';};
Object.assign(HK.UI,{
 breadNext(){const B=HK.state.breadStory,F=B.followup;if(F?.status==='scheduled')return HK.t('breadFollowupNext_scheduled',{date:HK.fmtDate(F.availableAt)});if(F?.status==='offer')return HK.t('breadFollowupNext_offer',{date:HK.fmtDate(F.terms.replyDue)});if(F?.status==='active')return HK.t('breadFollowupNext_active',{pledge:HK.t('breadFollowupName_'+F.pledge),date:HK.fmtDate(F.terms.dueAt)});if(F?.status==='reaction')return HK.t('breadFollowupNext_reaction',{date:HK.fmtDate(F.reaction.at)});if(F?.status==='resolved'&&['fulfilled','breach','declined','unanswered','withdrawn'].includes(F.ending))return HK.t('breadFollowupNext_'+F.ending,{pledge:HK.t('breadFollowupName_'+(F.pledge||'none'))});return HK.t(B.phase==='done'?'breadEnd_'+B.ending:B.phase==='investigate'&&B.method?'breadNext_pending':'breadNext_'+B.phase);},
 breadOpen(){return `<button class="small" data-action="breadopen">${HK.t('ig_open')} →</button>`;},
 breadMissionCard(){
  const B=HK.state.breadStory,status=HK.breadStatus(B);
  const F=B.followup,deadline=['offer','investigate','decision'].includes(B.phase)?B.due:F?.status==='offer'?F.terms.replyDue:F?.status==='active'?F.terms.dueAt:F?.status==='reaction'?F.reaction.at:null;
  return `<article class="mission-card ${status}" data-mission="bread">${this.missionHeader('story',HK.t('breadTitle'),HK.t('breadSubtitle'),HK.MenuArt.good('grain'),status)}${this.missionNext(this.breadNext())}${deadline!==null?`<small>${HK.t(F&&B.phase==='done'?'breadFollowupDeadline':'ig_until',{date:HK.fmtDate(deadline)})}</small>`:''}<div class="mission-actions">${this.breadOpen()}</div></article>`;
 },
 breadChoice(action){
  const st=HK.state,B=st.breadStory,q=HK.breadQuote(st,action,B.phase),d=HK.BREAD_ACTIONS[action];
  let h=`<article class="intrigue-choice bread-choice"><div class="plan-heading">${HK.GOOD[d.art]?HK.MenuArt.good(d.art):HK.MenuArt.place(d.art)}<b>${HK.t('breadAction_'+action)}</b></div>`;
  if(q.cost)h+=`<div class="intrigue-price"><span>${HK.t('ig_cost')}</span><strong>${HK.fmt(q.cost)} ${HK.t('mark')}</strong></div>`;
  else if(!q.income)h+=`<small>${HK.t('breadFree')}</small>`;
  if(q.income)h+=`<div class="intrigue-price"><span>${HK.t('ig_income')}</span><strong>+${HK.fmt(q.income)} ${HK.t('mark')}</strong></div>`;
  h+=`<p>${HK.t('breadDesc_'+action)}</p>`;
  if(q.goods)h+=`<b>${HK.t('breadGoods',{qty:q.goods})}</b><small>${HK.t('breadGoodsValue',{value:HK.fmt(q.basis)})}</small>`;
  if(['bribe','frame','collude'].includes(action))h+=`<details><summary>${HK.t('breadHearing')}</summary><small class="plan-risk">${HK.t('breadReviewRisk')}</small></details>`;
  if(Object.values(q.preview||{}).some(Boolean))h+=`<details class="intrigue-consequences"><summary>${HK.t('ig_effects')}</summary>${this.intrigueEffects(q.preview)}</details>`;
  if(!q.ok)h+=`<small class="plan-risk">${HK.t(q.msg)}</small>`;
  return h+`<button class="small ${['decline','skip','acknowledge'].includes(action)?'':'primary'}" data-action="breadact" data-choice="${action}" data-phase="${B.phase}" ${q.ok?'':'disabled'}>${HK.t('breadAction_'+action)}</button></article>`;
 },
 breadFollowupChoice(action,status){
  const st=HK.state,F=st.breadStory.followup,T=F.terms,q=HK.breadFollowupQuote(st,action,status);let title,desc='',value='';
  if(status==='offer'&&action!=='decline'){
   const term=T[action];title=HK.t('breadFollowupName_'+action);desc=HK.t('breadFollowupOption_'+action,{qty:term.qty||0,quality:term.quality||85,cost:HK.fmt(term.cost||0),influence:term.influence||0,due:HK.fmtDate(T.dueAt)});
   desc+=` ${(term.reasons||[term.reason]).map(reason=>HK.t('breadFollowupReason_'+action+'_'+reason)).join(' ')}`;
   if(action==='council')value=HK.t('breadFollowupTerm_council',{qty:term.qty,quality:term.quality,influence:term.influence});
   if(action==='merchants')value=HK.t('breadFollowupTerm_merchants',{cost:HK.fmt(term.cost)});
   if(action==='church')value=HK.t('breadFollowupTerm_church',{qty:term.qty,quality:term.quality});
  }else if(status==='offer'){title=HK.t('breadFollowupAction_decline');desc=HK.t('breadFollowupDecline');}
  else if(action==='fulfill'){
   title=HK.t('breadFollowupAction_fulfill');desc=HK.t('breadFollowupFulfill_'+F.pledge,{qty:T[F.pledge].qty||0,quality:T[F.pledge].quality||85,cost:HK.fmt(T[F.pledge].cost||0),date:HK.fmtDate(T.dueAt)});
   if(q.goods)value=HK.fmt(q.basis)+' '+HK.t('mark');
  }else if(action==='extend'){
   title=HK.t('breadFollowupAction_extend');desc=HK.t('breadFollowupExtendTerms',{date:HK.fmtDate(T.dueAt),newDate:HK.fmtDate(T.dueAt+7)});value=HK.t('breadFollowupInfluenceCost',{n:q.influenceCost});
  }else{title=HK.t('breadFollowupAction_withdraw');desc=HK.t('breadFollowupWithdraw');}
  const place=action==='church'||(action==='fulfill'&&F.pledge==='church')?'church':action==='merchants'||(action==='fulfill'&&F.pledge==='merchants')?'guild':'townhall';
  let h=`<article class="intrigue-choice bread-choice bread-followup-choice"><div class="plan-heading">${HK.MenuArt.place(place)}<b>${title}</b></div>`;
  if(value)h+=`<div class="intrigue-price"><span>${HK.t(status==='offer'?'breadFollowupTermLabel':action==='fulfill'?'breadGoodsValueLabel':'ig_cost')}</span><strong>${value}</strong></div>`;
  h+=`<p>${desc}</p>`;
  if(status==='offer'&&action!=='decline')h+=`${this.intrigueEffects(HK.breadFollowupEffects(action,'fulfilled'))}<small>${HK.t('breadFollowupReactionBenefit')}</small><details class="intrigue-consequences"><summary>${HK.t('breadFollowupConsequences')}</summary>${this.intrigueEffects(HK.breadFollowupEffects(action,'withdrawn'))}<small>${HK.t('breadFollowupWithdrawCost')}</small>${this.intrigueEffects(HK.breadFollowupEffects(action,'breach'))}<small>${HK.t('breadFollowupBreachCost')}</small></details>`;
  if(q.effects&&Object.values(q.effects).some(Boolean))h+=`<details class="intrigue-consequences" open><summary>${HK.t(action==='withdraw'?'breadFollowupReactionEffects':'ig_effects')}</summary>${this.intrigueEffects(q.effects)}</details>`;
  if(!q.ok)h+=`<small class="plan-risk">${HK.t(q.msg)}</small>`;
  const label=status==='offer'?action==='decline'?'decline':'accept':action;
  return h+`<button class="small ${action==='decline'||action==='withdraw'?'':'primary'}" data-action="breadfollow" data-choice="${action}" data-status="${status}" ${q.ok?'':'disabled'}>${HK.t('breadFollowupAction_'+label)}</button></article>`;
 },
 breadFollowupPanel(){
  const st=HK.state,F=st.breadStory.followup,T=F.terms,previous=HK.t('breadAction_'+F.previous);
  let h=`<section class="bread-followup"><h3>${HK.t('breadFollowupTitle')}</h3><p>${HK.t('breadFollowupContext',{previous})}</p>`;
  if(F.status==='scheduled')h+=`<p>${HK.t('breadFollowupNext_scheduled',{date:HK.fmtDate(F.availableAt)})}</p>`;
  if(F.status==='offer')h+=`<p>${HK.t('breadFollowupOfferIntro',{date:HK.fmtDate(T.replyDue),previous})}</p><div class="intrigue-choices">${['church','merchants','council'].map(a=>this.breadFollowupChoice(a,'offer')).join('')}${this.breadFollowupChoice('decline','offer')}</div>`;
  if(F.status==='active'){
   h+=`<p>${HK.t('breadFollowupActive',{pledge:HK.t('breadFollowupName_'+F.pledge),date:HK.fmtDate(T.dueAt)})}</p><p>${HK.t('breadFollowupWarning_'+F.pledge)}</p><p class="hint">${HK.t('breadFollowupReactionBenefit')}</p><p class="plan-risk">${HK.t('breadFollowupBreachCost')}</p><div class="intrigue-choices">${this.breadFollowupChoice('fulfill','active')}${!F.extended?this.breadFollowupChoice('extend','active'):''}${this.breadFollowupChoice('withdraw','active')}</div>`;
  }
  if(F.status==='reaction')h+=`<p>${HK.t('breadFollowupReactionDue',{date:HK.fmtDate(F.reaction.at),previous,pledge:HK.t('breadFollowupName_'+F.pledge),outcome:HK.t('breadFollowupOutcome_'+F.ending)})}</p>`;
  if(F.status==='resolved'){
   h+=`<p>${HK.t('breadFollowupFinal',{previous,pledge:HK.t('breadFollowupName_'+(F.pledge||'none')),outcome:HK.t('breadFollowupOutcome_'+F.ending)})}</p>`;
   if(F.support)h+=`<p>${HK.t('breadFollowupSupport',{n:HK.breadFollowupElection(st),date:HK.fmtDate(F.support.until)})}</p>`;
  }
  if(F.history?.length)h+=`<details class="intrigue-history"><summary>${HK.t('breadFollowupHistory')}</summary><ol>${F.history.map(e=>`<li><small>${HK.fmtDate(e.day)} · ${this.esc(e.author)}</small><b>${HK.t('breadFollowupEvent_'+e.action,{pledge:HK.t('breadFollowupName_'+(e.pledge||'none')),date:e.dueAt?HK.fmtDate(e.dueAt):''})}</b></li>`).join('')}</ol></details>`;
  return h+'</section>';
 },
 breadPanel(){
  const st=HK.state,B=st.breadStory;if(!B||B.phase==='locked')return `<p>${HK.t('breadGone')}</p>`;
  let h=`<button class="small work-back" data-action="missionfocus" data-value="">← ${HK.t('missionBack')}</button><section class="intrigue-story bread-story">${this.helpHeading('breadTitle','breadHelp',2)}${this.missionNext(this.breadNext())}`;
  const groups=actions=>`<div class="intrigue-choices">${actions.map(a=>this.breadChoice(a)).join('')}</div>`;
  if(B.phase!=='done')h+=`<details class="bread-supply"><summary>${HK.t('breadSupply')}</summary><p>${HK.t('breadReserve',{qty:B.reserve})} · ${HK.t('breadPublic',{qty:Math.floor(st.town.stock.grain||0)})}</p><div class="btn-row"><button class="small" data-action="warehousetrade" data-good="grain">${HK.t('breadVisit')} ↗</button><button class="small" data-action="tradeplans">${HK.t('tradePlanning')} →</button></div></details>`;
  if(['offer','investigate','decision','declined'].includes(B.phase))h+=`<p class="intrigue-deadline">${HK.t('ig_until',{date:HK.fmtDate(B.due)})}</p>`;
  if(B.phase==='offer')h+=`<p>${HK.t('breadIntro')}</p><details><summary>${HK.t('breadSupply')}</summary><p>${HK.t('breadTerms',{date:HK.fmtDate(B.due)})}</p></details>`+groups(['accept','decline']);
  if(B.phase==='investigate'&&!B.method){
   if(HK.breadTrusted(st))h+=`<p class="positive">${HK.t('breadTrusted')}</p>`;
   const p=st.population.people[B.person];if(p)h+=`<p>${this.esc(HK.t('breadContact',{name:HK.citizenName(st,p)}))}</p>`;
   h+=groups(['audit','listen','bribe','skip']);
  }
  if(B.phase==='investigate'&&B.method)h+=`<div class="intrigue-dossier"><b>${HK.t('breadAction_'+B.method)}</b><span>${HK.t('breadReportAt',{date:HK.fmtDate(B.reportAt)})}</span></div>`;
  if(B.report)h+=`<details class="intrigue-group" ${B.phase==='decision'?'open':''}><summary>${HK.t('breadReportTitle')}</summary>${B.reportDay!==undefined?`<small>${HK.t('breadDated',{date:HK.fmtDate(B.reportDay)})}</small>`:''}<p>${HK.t('breadReport_'+B.report)}</p></details>`;
  if(B.phase==='decision'){
   if(['rumour','none'].includes(B.report))h+=`<details class="intrigue-group"><summary>${HK.t('breadAction_verify')}</summary>${groups(['verify'])}</details>`;
   if(st.intrigue.pact)h+=`<p class="positive">${HK.t('breadPact')}</p>`;
   if(HK.intrigueBacked(st))h+=`<p class="positive">${HK.t('breadHouse')}</p>`;
   if(st.intrigue.monopoly.ending==='sellout')h+=`<p>${HK.t('breadPastDeal')}</p>`;
   h+=groups(['negotiate','warrant','relief']);
   h+=`<details class="intrigue-group"><summary>${HK.t('breadOtherMethods')}</summary>${groups(['frame','collude'])}</details>`;
   h+=`<p class="hint">${HK.t(B.corruptInquiry?'breadReviewRisk':'breadReviewClean')}</p>`;
  }
  if(B.phase==='waiting')h+=`<div class="intrigue-dossier"><b>${HK.t('breadAction_'+B.solution)}</b><span>${HK.t('breadReviewAt',{date:HK.fmtDate(B.reviewAt)})}</span></div><p class="hint">${HK.t(B.dirty?'breadReviewRisk':'breadReviewClean')}</p>`;
  if(B.phase==='review'){
   h+=`<p class="intrigue-deadline">${HK.t('breadReviewDue',{date:HK.fmtDate(B.reviewDue)})}</p>`;
   if(B.dirty)h+=`<p class="plan-risk">${HK.t('breadFound')}</p>`+groups(['restitution','confess','suppress']);
   else h+=`<p>${HK.t('breadDated',{date:HK.fmtDate(B.review.day)})}</p><p>${HK.t('breadRecheck',{stock:Math.floor(B.review.stock),target:B.review.threshold,relief:B.review.relief})}</p>`+groups(HK.breadQuote(st,'account','review').ok?['account']:['aid','acknowledge']);
  }
  if(B.phase==='done'&&B.support)h+=`<p>${HK.t('breadSupport',{n:HK.breadElection(st),date:HK.fmtDate(B.supportUntil)})}</p>`;
  if(B.phase==='done'&&B.followup)h+=this.breadFollowupPanel();
  if(B.history.length)h+=`<details class="intrigue-history"><summary>${HK.t('breadHistory')}</summary><p>${HK.t('breadCash')}: <b>${HK.fmt(B.cash)} ${HK.t('mark')}</b><br>${HK.t('breadBasis')}: <b>${HK.fmt(B.basis)} ${HK.t('mark')}</b></p><small>${HK.t('breadAccounting')}</small><ol>${B.history.map(e=>`<li><small>${HK.fmtDate(e.day)} · ${this.esc(e.author)}</small><b>${HK.t('breadAction_'+e.action)}</b>${this.intrigueEffects(e.delta)}${e.goods?`<small>${HK.t('breadGoods',{qty:e.goods})}</small>`:''}</li>`).join('')}</ol></details>`;
  return h+'</section>';
 }
});
{
 const records=HK.UI.missionRecords;HK.UI.missionRecords=function(){const list=records.call(this),B=HK.state.breadStory;if(B&&B.phase!=='locked')list.push({kind:'bread',status:HK.breadStatus(B)});return list;};
 const panel=HK.UI.missionsPanel;HK.UI.missionsPanel=function(){return this.missionFocus==='bread'?this.breadPanel():panel.call(this);};
 const letter=HK.UI.postLetterBody;HK.UI.postLetterBody=function(m){if(m.type==='bread'){const stage=m.ref?.stage;if(stage?.startsWith('followup_'))return HK.t('breadFollowupLetter_'+stage,{date:HK.fmtDate(m.day),due:HK.fmtDate(HK.state.breadStory.followup?.terms?.dueAt||m.day)})+'<br>'+this.breadOpen();return HK.t('breadLetter',{date:HK.fmtDate(m.day)})+'<br>'+this.breadOpen();}return letter.call(this,m);};
 for(const method of ['panel_townhall','panel_market']){const panel=HK.UI[method];HK.UI[method]=function(...args){const h=panel.apply(this,args),B=HK.state.breadStory,F=B?.followup,open=F&&['offer','active','reaction'].includes(F.status);return h+(B&&(!['locked','done','declined'].includes(B.phase)||open)?`<section class="bread-link"><b>${HK.t('breadTitle')}</b><p>${this.breadNext()}</p>${this.breadOpen()}</section>`:'');};}
 const action=HK.UI.action;HK.UI.action=function(d){
  if(d.action==='breadopen'){this.missionFocus='bread';this.setTab('missions');this.sidebar.scrollTop=0;return;}
  if(d.action==='breadact'){this.result(HK.breadAct(HK.state,d.choice,d.phase));this.renderAll();return;}
  if(d.action==='breadfollow'){this.result(HK.breadFollowupAct(HK.state,d.choice,d.status));this.renderAll();return;}
  return action.call(this,d);
 };
}
