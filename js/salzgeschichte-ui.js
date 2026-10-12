'use strict';
Object.assign(HK.UI, {
  saltStoryPanel() {
    const st=HK.state,s=st.saltStory,c=HK.saltContract(st),p=HK.saltProjection(st),r=HK.saltRival(st),captain=st.regularCaptains[s.captainId];
    const button=(action,text,disabled=false,more='',primary=false)=>`<button class="small ${primary?'primary':''}" data-action="${action}" ${more} ${disabled?'disabled':''}>${text}</button>`;
    const choice=id=>{const q=HK.saltChoiceQuote(st,id);return `<div class="salt-decision">${button('saltchoice',HK.t('saltChoice_'+id),!q.ok,`data-choice="${id}"`)}<small>${HK.t('saltTerms_'+id,{cost:q.cost||0,qty:q.qty||0})}</small>${!q.ok?`<small class="plan-risk">${HK.t(q.msg)}</small>`:''}</div>`;};
    let html=`<section class="salt-story" data-salt-phase="${s.phase}"><div class="salt-title">${HK.MenuArt.good('salt')}<div><small>${HK.t('saltSeries')}</small><h3>${HK.t('saltTitle')}</h3></div></div>${s.phase==='offer'?`<p>${HK.t('saltIntro')}</p>`:''}`;
    if(s.phase==='offer') {
      html+=`<div class="plan-terms"><span>${HK.t('tradeFixedRevenue')}<strong>2240 ${HK.t('mark')}</strong></span><span>${HK.t('saltPromiseQty')}<strong>32 ${HK.t('unitLast')} · 4 ${HK.t('saltDays')}</strong></span></div><p class="hint">${HK.t('saltOpening')}</p>${button('saltstart',HK.t('saltStart'),st.contracts.active.length>=3)}`;
    } else {
      html+=`<details class="salt-details salt-context" data-salt-detail="context"><summary>${HK.t('saltBackground')}</summary><p>${HK.t('saltIntro')}</p><div class="salt-people"><div>${HK.MenuArt.portrait(s.buyer.name)}<b>${this.esc(s.buyer.name)}</b><small>${HK.t('saltBuyer')} · ${HK.t('saltTrust',{n:s.buyer.trust})}</small></div><div>${HK.MenuArt.portrait(captain?.name||'Ludeke Horn')}<b>${this.esc(captain?.name||'Ludeke Horn')}</b><small>${HK.t('regularCaptain')} · ${HK.t('saltTrust',{n:captain?.trust||0})}</small></div><div>${HK.MenuArt.portrait(r?.id||'kruse')}<b>${this.esc(HK.rivalName('kruse'))}</b><small>${HK.t('saltRival')} · ${HK.t('saltAttitude',{n:Math.round(r?.attitude||0)})}</small></div></div></details>`;
      if(c) {
        const paid=HK.tradeAdvances(st).filter(a=>a.good===c.good).reduce((sum,a)=>sum+a.qty,0);
        const late=st.day>c.deadline,qualityLow=!!c.minQuality&&HK.goodQuality(st,c.good)<c.minQuality;
        const ready=!p.missing&&!late&&!qualityLow;
        const next=late?'missionDeadlinePassed':p.missing?(paid?'saltNextWaiting':'saltNextBuy'):qualityLow?'missionQualityNext':'saltNextDeliver';
        html+=`<article class="salt-order" data-salt-contract="${c.id}"><div class="salt-order-heading">${HK.MenuArt.good(c.good)}<div><h4>${HK.t(c.saltStory==='salt'?'saltFirstOrder':'saltSecondOrder')}</h4><small>${HK.t('saltOrderGoal',{qty:c.qty,good:HK.goodName(c.good),date:HK.fmtDate(c.deadline)})} · ${HK.t('saltRemaining',{days:Math.max(0,c.deadline-st.day)})}</small></div></div>`;
        html+=`<div class="salt-outcome ${p.contribution>=0?'positive':'negative'}"><div><small>${HK.t(p.contribution>=0?'saltExpectedProfit':'saltExpectedLoss')}</small><strong>${p.contribution>=0?'+':'−'}${HK.fmt(Math.abs(p.contribution))} ${HK.t('mark')}</strong></div>${this.contextualHelp('saltProfitHelp',HK.t('saltCalculation'))}<small>${HK.t(p.missing?'saltEstimateMarket':'saltEstimateStock')}</small><div class="salt-money-flow"><span>${HK.t('saltPayout')} <b>${HK.fmt(c.reward)} ${HK.t('mark')}</b></span>${p.missing?`<span>${HK.t('saltBuyMissing')} <b>−${HK.fmt(p.cost)} ${HK.t('mark')}</b></span>`:''}</div></div>`;
        html+=`<div class="salt-next"><small>${HK.t('introNext')}</small><p>${HK.t(next,{qty:p.missing,good:HK.goodName(c.good),money:HK.fmt(c.reward)})}</p></div>`;
        if(paid&&p.missing)html+=`<p class="salt-transit-note">${HK.t('saltAlreadyPaid',{qty:paid})}</p>`;
        html+='<div class="salt-main-actions">';
        if(p.missing||qualityLow)html+=button('missionsources',HK.t('missionFindSources'),false,`data-id="${c.id}"`,true);
        html+=button('saltmeet',HK.t('saltVisit'),false,'',ready)+'</div>';
        html+=`<details class="salt-details salt-numbers" data-salt-detail="calculation"><summary>${HK.t('saltCalculation')}</summary><div class="salt-calculation"><span>${HK.t('saltPayout')}<b>${HK.fmt(c.reward)} ${HK.t('mark')}</b></span><span>${HK.t('saltGoodsValue')}<b>−${HK.fmt(p.stock)} ${HK.t('mark')}</b></span><span>${HK.t('saltMissingCost')}<b>−${HK.fmt(p.cost)} ${HK.t('mark')}</b></span><span>${HK.t('saltExtras')}<b>−${HK.fmt(p.extras)} ${HK.t('mark')}</b></span><span class="${p.contribution>=0?'positive':'negative'}">${HK.t('saltContribution')}<strong>${p.contribution>=0?'+':''}${HK.fmt(p.contribution)} ${HK.t('mark')}</strong></span></div><small>${HK.t('saltValuationHint')}</small><small>${HK.t('tradePenalty',{penalty:Math.round(c.reward*.15)})}</small>`;
        if(c.minQuality)html+=`<small>${HK.t('cityMinQuality',{quality:c.minQuality})}</small>${this.cityQualityBadge(HK.goodQuality(st,c.good))}`;
        html+='</details>';
        if(s.phase==='active') {
          html+=`<details class="salt-details salt-options" data-salt-detail="options"><summary>${HK.t('saltOtherOptions')}</summary>`;
          if(!s.rivalDone) html+=`<p class="plan-risk">${HK.t('saltRivalWarning',{rival:HK.rivalName('kruse'),date:HK.fmtDate(s.rivalAt)})}</p>`;
          else if(s.rivalQty) html+=`<p>${HK.t('saltRivalHas',{qty:s.rivalQty})}</p>`;
          if(!s.rivalChoice&&r)html+=!s.rivalDone?choice('pact'):s.rivalQty?choice('buyback'):'';
          if(s.rivalChoice)html+=`<small>${HK.t('saltRemembered',{choice:HK.t('saltChoice_'+s.rivalChoice)})}</small>`;
          if(!s.windDone&&!s.windChoice&&HK.saltIncoming(st))html+=choice('pilot');
          if(!s.extended)html+=choice('extend');
          else html+=`<small>${HK.t('saltExtended')}</small>`;
          html+=`<small>${HK.t('saltCommunityHint')}</small></details>`;
        }
        html+='</article>';
      }
      if(s.phase==='followOffer')html+=`<p>${HK.t('saltFollowText')}</p><details class="salt-details"><summary>${HK.t('saltHornExtraTitle')}</summary><p>${HK.t('saltHornExtra')}</p></details><div class="btn-row">${button('saltfollow',HK.t('saltFollowAccept'),st.contracts.active.length>=3,'data-choice="accept"')}${button('saltfollow',HK.t('saltFollowDecline'),false,'data-choice="decline"')}</div>`;
      if(['done','failed'].includes(s.phase))html+=`<p>${HK.t('saltEnd_'+s.phase)}</p>`;
      for(const [i,receipt] of s.receipts.entries())html+=`<details class="salt-details salt-receipt" data-salt-detail="receipt-${i}"><summary><span>${HK.t(receipt.leg==='salt'?'saltFirstOrder':'saltSecondOrder')}</span><strong class="${receipt.contribution>=0?'positive':'negative'}">${receipt.contribution>=0?'+':''}${HK.fmt(receipt.contribution)} ${HK.t('mark')}</strong></summary><b>${HK.t(receipt.failed?'saltReceiptFailed':'saltReceipt')}</b><small>${HK.fmtDate(receipt.day)} · ${HK.t(receipt.leg==='salt'?'saltFirstOrder':'saltSecondOrder')}</small><span>${HK.t('tradeFixedRevenue')}: ${HK.fmt(receipt.revenue)} · ${HK.t('saltGoodsValue')}: ${HK.fmt(receipt.basis)} · ${HK.t('saltExtras')}: ${receipt.extras} ${HK.t('mark')}</span><strong class="${receipt.contribution>=0?'positive':'negative'}">${HK.t('saltContribution')}: ${receipt.contribution>=0?'+':''}${HK.fmt(receipt.contribution)} ${HK.t('mark')}</strong></details>`;
    }
    html+='</section>';
    return ['done','failed'].includes(s.phase)?`<details class="salt-archive"><summary>${HK.t('saltTitle')} · ${HK.t('saltHistory')}</summary>${html}</details>`:html;
  },
});
const saltTeaser=HK.UI.tradeTeaser;
HK.UI.tradeTeaser=function(){return saltTeaser.call(this)+(!['done','failed'].includes(HK.state.saltStory.phase)&&(HK.state.saltStory.phase!=='offer'||HK.introStage(HK.state)===2)?`<button class="planning-link salt-teaser" data-action="missions">${HK.MenuArt.good('salt')}${HK.t('saltTitle')}</button>`:'');};
const saltUIAction=HK.UI.action;
HK.UI.action=function(d) {
  const st=HK.state;
  if(d.action==='saltstart')this.result(HK.startSaltStory(st));
  else if(d.action==='saltchoice')this.result(HK.saltChoose(st,d.choice));
  else if(d.action==='saltdeliver')this.result(HK.saltDeliver(st,d.choice));
  else if(d.action==='saltfollow')this.result(HK.saltFollow(st,d.choice==='accept'));
  else return saltUIAction.call(this,d);
  HK.scheduleSave?.();this.renderAll();
};
// Council/guild delivery buttons must honour the same story branch and receipt accounting.
const saltContractRow=HK.UI.contractRow;
HK.UI.contractRow=function(c,active){return saltContractRow.call(this,c,active).replace('</td>',c.saltStory?`<br><small>${HK.t('saltTitle')} · ${HK.t('saltBuyer')}</small></td>`:'</td>');};
const saltSceneClick=HK.UI.sceneClick;
HK.UI.sceneClick=function(h) {
  if(h.kind!=='town-event')return saltSceneClick.call(this,h);
  this.setTab('planning'); this.sidebar.querySelector(h.story?'.salt-story':'.city-life')?.scrollIntoView({block:'start'});
};
