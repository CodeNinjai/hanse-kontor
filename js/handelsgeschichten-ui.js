'use strict';
Object.assign(HK.UI,{
 opportunityCard(report){
  const st=HK.state,inc=st.incoming.find(i=>i.id===report.incoming),q=HK.opportunityQuote(st,report.incoming),captain=st.regularCaptains[report.captain];
  return `<article class="trade-supply opportunity-card"><div class="plan-heading">${HK.MenuArt.good(report.good)}<div><b>${this.esc(captain?.name||HK.name(HK.ORIGIN[report.origin]))}</b><small>${HK.t('opportunitySource_'+report.source)} · ${HK.t('opportunityDated',{date:HK.fmtDate(report.day)})}</small></div></div><details><summary>${HK.t('opportunityDated',{date:HK.fmtDate(report.day)})}</summary><small>${HK.t('opportunityTerms',{...report,good:HK.goodName(report.good)})}</small><small>${HK.t('tradeEta',{date:HK.fmtDate(report.eta)})} · ${HK.t('tradeDelayRisk',{chance:Math.round(report.chance*100)})}</small></details>${inc?`<small>${this.tradeArrivalHint(inc)}</small><small>${HK.t('opportunityUntil',{date:HK.fmtDate(report.until)})}</small>`:''}${q.ok?`<button class="small primary" data-action="opportunityreserve" data-id="${report.incoming}" ${st.money<q.cost?'disabled':''}>${HK.t('opportunityReserve',{qty:q.qty,cost:HK.fmt(q.cost)})}</button><small>${HK.t('tradeRefundDate',{date:HK.fmtDate(q.latest+1)})}</small>`:`<small>${HK.t('opportunityExpired')}</small>`}<button class="small link" data-action="tradeplans">${HK.t('tradePlanning')} →</button></article>`;
 },
 opportunityPanel(){
  const st=HK.state,unknown=st.incoming.filter(i=>i.days>0&&i.tradeLot&&!HK.tradeArrivalKnown(st,i)),reports=st.tradingStories.reports.filter(r=>st.day<=r.until&&st.incoming.some(i=>i.id===r.incoming)).slice(-3);
  return `<section class="opportunity-panel">${this.helpHeading('opportunityTitle','opportunityHelp')}<p class="hint">${HK.t('opportunityHint')}</p><div class="trade-supplies">${reports.map(r=>this.opportunityCard(r)).join('')}${unknown.slice(0,3).map(i=>`<article class="trade-supply"><div class="plan-heading">${HK.MenuArt.place(i.sea?'harbour':'gate')}<b>${HK.t('opportunityUnknown',{origin:HK.name(HK.ORIGIN[i.origin])})}</b></div><button class="small" data-action="opportunityreport" data-id="${i.id}" ${st.money<25?'disabled':''}>${HK.t('opportunityBuy')}</button></article>`).join('')}</div>${!unknown.length&&!reports.length?`<p class="hint">${HK.t('opportunityNone')}</p>`:''}</section>`;
 },
 clothChoices(interactive=true){
  const st=HK.state;return `<p>${HK.t('clothIntro')}</p><div class="cloth-choices">${Object.entries(HK.CLOTH_CHOICES).map(([id,d])=>{
   const goods=8*Math.round(d.price*.92),cost=goods+Math.round(goods*HK.tariffRate(st)*(1-HK.customsDiscount(st)));
   return `<article class="trade-supply"><div class="plan-heading">${HK.MenuArt.good('cloth')}<b>${HK.t('clothLabel_'+id)}</b></div><div class="delivery-result"><span>${HK.t('clothPrepaidProfit')}</span><strong class="positive">+${HK.fmt(d.reward-cost)} ${HK.t('mark')}</strong></div><small>${HK.t('clothChoiceTerms',{quality:d.minQuality,reward:HK.fmt(d.reward)})}</small><small>${HK.t('clothSourceTerms',{quality:d.quality,days:d.days})}</small><small>${HK.t('clothPrepaidCost',{cost:HK.fmt(cost)})}</small><small>${HK.t('tradePenalty',{penalty:Math.round(d.reward*.15)})}</small>${interactive?`<button class="small primary" data-action="clothstart" data-choice="${id}" ${st.contracts.active.length>=3?'disabled':''}>${HK.t('clothChoice_'+id)}</button>`:''}</article>`;
  }).join('')}</div>`;
 },
 clothReturnTerms(){const q=HK.clothReturnQuote(HK.state);return q.ok?HK.t('clothReturnTerms',{...q,reward:HK.fmt(q.reward),date:HK.fmtDate(q.deadline),penalty:Math.round(q.reward*.15)})+this.deliveryCalculation({type:'deliver',good:'smokedfish',qty:q.qty,reward:q.reward},'available'):HK.t('clothReturnGone');},
 clothMissionCard(){
  const C=HK.state.tradingStories.cloth,status=HK.clothStatus(C),c=HK.clothContract(HK.state),done=C.receipts.filter(r=>!r.failed).length;
  return `<article class="mission-card ${status}" data-mission="cloth">${this.missionHeader('story',HK.t('clothTitle'),'Willem de Groot · '+HK.t('guild'),HK.MenuArt.good('cloth'),status)}${c?this.deliveryCalculation(c,'active'):''}${this.missionProgress(HK.t('clothSeries'),C.phase==='done'?2:done,2)}${this.missionNext(HK.t('clothNext_'+C.phase))}<button class="small" data-action="clothopen">${HK.t('clothOpen')}</button></article>`;
 },
 clothPanel(){
  const st=HK.state,C=st.tradingStories.cloth,c=HK.clothContract(st);
  let h=`<button class="small work-back" data-action="missionfocus" data-value="">← ${HK.t('clothBack')}</button><section class="cloth-story">${this.helpHeading('clothTitle','clothHelp',2)}`;
  if(C.phase==='offer')h+=this.clothChoices();
  else h+=this.missionNext(HK.t('clothNext_'+C.phase));
  if(c){
   h+=this.missionContractCard(c,'active');const p=HK.deliveryProjection(st,c);
   if(p.missing)h+=`<p class="hint">${HK.t('missionSourceHint')}</p>`;
  }
  if(C.phase==='returnOffer')h+=`<p>${this.clothReturnTerms()}</p><div class="btn-row"><button class="small primary" data-action="clothreturn" data-choice="accept" ${!HK.clothReturnQuote(st).ok||st.contracts.active.length>=3?'disabled':''}>${HK.t('clothAcceptReturn')}</button><button class="small" data-action="clothreturn" data-choice="decline">${HK.t('clothFinish')}</button></div>`;
  if(C.ending)h+=`<p>${HK.t('clothOutcome_'+C.ending)}</p>`;
  if(C.receipts.length)h+=`<details class="delivery-calculation"><summary>${HK.t('clothReceipts')}</summary>${C.receipts.map(r=>`<p>${HK.fmtDate(r.day)} · ${HK.t(r.leg==='cloth'?'tradeTitle_brugesCloth':'tradeTitle_brugesReturn')}</p>${this.deliveryCalculation({type:'deliver',reward:r.revenue,receipt:r},r.failed?'failed':'done')}`).join('')}<small>${HK.t('clothTrust',{n:C.buyerTrust})}</small></details>`;
  if(C.report)h+=`<details><summary>${HK.t('opportunityDated',{date:HK.fmtDate(C.report.day)})}</summary><small>${HK.t('clothReport',{date:HK.fmtDate(C.report.day),price:C.report.market,quality:C.report.quality})}</small></details>`;
  return h+'</section>';
 }
});
HK.clothStatus=C=>C.phase==='offer'?'available':C.phase==='done'?'done':C.phase==='failed'?'failed':'active';
{
 const tavern=HK.UI.panel_tavern;HK.UI.panel_tavern=function(){const h=tavern.call(this);return h.replace('</section>','</section>'+this.opportunityPanel());};
 const records=HK.UI.missionRecords;HK.UI.missionRecords=function(){const list=records.call(this).filter(r=>!r.value?.clothStory),C=HK.state.tradingStories?.cloth;if(C&&C.phase!=='locked')list.push({kind:'cloth',status:HK.clothStatus(C)});return list;};
 const missions=HK.UI.missionsPanel;HK.UI.missionsPanel=function(){return this.missionFocus==='cloth'?this.clothPanel():missions.call(this);};
 const letter=HK.UI.postLetterBody;HK.UI.postLetterBody=function(m){
  if(m.type==='opportunity')return this.opportunityCard(m.ref.report);
  if(m.type==='clothOffer')return HK.t('clothIntro')+' '+HK.t('clothSnapshot')+`<button class="small" data-action="clothopen">${HK.t('clothOpen')}</button>`+(HK.state.tradingStories.cloth.phase==='offer'?this.clothChoices(false):'');
  if(m.type==='clothReturn')return this.clothReturnTerms()+`<button class="small" data-action="clothopen">${HK.t('clothOpen')}</button>`;
  if(m.type==='clothReceipt')return this.deliveryCalculation({type:'deliver',reward:m.ref.receipt.revenue,receipt:m.ref.receipt},'done');
  return letter.call(this,m);
 };
 const visitor=HK.UI.visitorTrade;HK.UI.visitorTrade=function(v,...args){const html=visitor.call(this,v,...args),report=HK.state.tradingStories.reports.find(r=>r.captain===v.captainId&&HK.state.incoming.some(i=>i.id===r.incoming));return html+(report?this.opportunityCard(report):'');};
 const action=HK.UI.action;HK.UI.action=function(d){const st=HK.state;
  if(d.action==='clothopen'){this.missionFocus='cloth';this.setTab('missions');this.sidebar.scrollTop=0;return;}
  if(d.action==='clothstart')this.result(HK.startClothStory(st,d.choice));
  else if(d.action==='clothreturn')this.result(HK.chooseClothReturn(st,d.choice==='accept'));
  else if(d.action==='opportunityreport')this.result(HK.buyArrivalReport(st,+d.id));
  else if(d.action==='opportunityreserve')this.result(HK.reserveOpportunity(st,+d.id));
  else return action.call(this,d);
  HK.scheduleSave?.();this.renderAll();
 };
}
