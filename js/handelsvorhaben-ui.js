/* Planning is a first-class menu: deadlines, cash commitments and uncertainty are visible before action. */
'use strict';
Object.assign(HK.UI, {
  tradeTeaser() {
    const st = HK.state, c = st.contracts.active.find(c => c.tradeTitle) || st.contracts.offers.find(c => c.tradeTitle && c.expires > st.day);
    if (!c) return `<button class="planning-link" data-action="tradeplans">${HK.MenuArt.symbol('planning')} ${HK.t('tradePlanning')}</button>`;
    return `<div class="trade-teaser">${HK.MenuArt.good(c.good)}<div><b>${HK.t('tradeTitle_' + c.tradeTitle)}</b><small>${HK.t('tradeTeaser', { qty: c.qty, good: HK.goodName(c.good), date: HK.fmtDate(c.deadline??c.deliverBy??st.day+c.days) })}</small></div><button class="small" data-action="tradeplans">${HK.t('tradePlan')}</button></div>`;
  },
  tradePlanCard(c, active) {
    const st = HK.state, have = Math.floor(st.warehouse.stock[c.good] || 0), missing = Math.max(0, c.qty - have), due = active ? c.deadline : (c.deliverBy ?? st.day+c.days), penalty = Math.round(c.reward * .15), inTransit = HK.tradeAdvances(st).filter(a => a.good === c.good).reduce((n, a) => n + a.qty, 0);
    const title=c.tradeTitle?HK.t('tradeTitle_'+c.tradeTitle):c.saltStory?HK.t(c.saltStory==='salt'?'saltFirstOrder':'saltSecondOrder'):HK.t('giver_'+c.giver)+' · '+HK.goodName(c.good);
    let html = `<article class="trade-plan-card ${active ? 'committed' : ''}" data-contract="${c.id}"><div class="plan-heading">${HK.MenuArt.good(c.good)}<div><b>${title}</b><small>${c.qty} ${HK.t('unitLast')} ${HK.goodName(c.good)}</small></div></div>${c.tradeTitle?`<p class="plan-story">${HK.t('tradeStory_' + c.tradeTitle)}</p>`:''}<div class="plan-terms"><span>${HK.t('tradeFixedRevenue')}<strong>${c.reward} ${HK.t('mark')}</strong></span><span>${HK.t('tradeDue')}<strong>${this.esc(HK.fmtDate(due))}</strong></span></div><small>${HK.t('tradePenalty', { penalty })}</small>`;
    if(c.minQuality)html+=`<small>${HK.t('cityMinQuality',{quality:c.minQuality})}</small>${this.cityQualityBadge?.(HK.goodQuality(st,c.good))||''}`;
    if (!active) return html + `<small>${HK.t('tradeOfferUntil', { date: HK.fmtDate(c.expires - 1) })}</small><button class="small primary" data-action="acceptcontract" data-id="${c.id}" ${st.contracts.active.length >= 3 ? 'disabled' : ''}>${HK.t('tradePromise')}</button></article>`;
    html += `<p class="plan-stock">${HK.t('tradeStock', { have, qty: c.qty, missing })}</p><progress value="${Math.min(have, c.qty)}" max="${c.qty}" aria-label="${this.esc(HK.goodName(c.good))}"></progress>`;
    if (inTransit) html += `<small class="plan-in-transit">${HK.t('tradeInTransit', { qty: inTransit })}</small>`;
    if (missing) {
      html += '<div class="procurement-options">';
      const price = HK.marketBuyPrice(st, c.good, missing) * missing;
      html += `<div class="procurement-option"><small>${HK.t('tradeBuyNow')}</small><b>${HK.t('tradeMarketCost', { qty: missing, cost: price })}</b><button class="small" data-action="warehousetrade" data-good="${c.good}">${HK.t('missionVisitMarket')}</button></div>`;
      const arrival = st.incoming.filter(i => HK.tradeArrivalKnown(st, i) && i.days > 0 && i.tradeLot?.good === c.good && i.tradeLot.qty >= missing).sort((a, b) => a.days - b.days)[0];
      const reserve=Math.max(0,missing-inTransit),quote = arrival && HK.quoteTradeAdvance(st, arrival.id, reserve),wind=arrival?.saltStory==='salt'&&!st.saltStory.windDone?(st.saltStory.windChoice==='pilot'?1:2):0;
      if (quote?.ok) html += `<div class="procurement-option"><small>${HK.t('tradeWaitSource', { origin: HK.name(HK.ORIGIN[arrival.origin]) })}</small><b>${HK.t('tradeMarketCost', { qty: reserve, cost: quote.cost })}</b><small>${this.tradeArrivalHint(arrival)}</small>${quote.eta + quote.maxDelay+wind > due ? `<strong class="plan-risk">${HK.t('tradeLateRisk')}</strong>` : ''}<button class="small" data-action="tradeadvance" data-id="${arrival.id}" data-qty="${reserve}" ${st.money < quote.cost ? 'disabled' : ''}>${HK.t('tradePrepay')}</button></div>`;
      html += '</div>';
    }
    return html + `<button class="small" data-action="missions">${HK.t('missionsTrack')}</button></article>`;
  },
  tradeArrivalHint(inc) {
    const expected = HK.fmtDate(HK.state.day + Math.max(0, inc.days)), chance = inc.delayResolved ? 0 : Math.round(inc.delayChance * 100);
    return HK.t('tradeEta', { date: expected }) + ' · ' + (chance ? HK.t('tradeDelayRisk', { chance }) : HK.t('tradeDelayResolved')) + '. ' + HK.t(inc.sea?'tradeBerthRisk':'tradeLandRisk');
  },
  planningPanel() {
    const st = HK.state, P = st.tradePlanning, active = st.contracts.active.filter(c => c.type==='deliver'), offers = [];
    let html = `<div class="panel-head illustrated-head">${HK.MenuArt.place('kontor', 'panel-picture')}<div>${this.helpHeading('tradePlanning','planningScope',2)}</div></div>`;
    html += `<section><h3>${HK.t('tradePromises')}</h3><div class="trade-plans">${active.map(c => this.tradePlanCard(c, true)).join('')}${offers.map(c => this.tradePlanCard(c, false)).join('')}</div>${!active.length && !offers.length ? `<p class="hint">${HK.t('tradeNoPlans')}</p>` : ''}</section>`;
    html += this.tradeCalendarPanel();
    html += `<section>${this.helpHeading('tradeAnnouncedSupply','tradeAdvanceHelp')}${this.qtyRow()}<div class="trade-supplies">`;
    const incoming = st.incoming.filter(i => HK.tradeArrivalKnown(st, i) && i.tradeLot && i.days > 0);
    for (const inc of incoming) {
      const lot = inc.tradeLot, qty = Math.min(this.qty(), lot.qty, Math.max(0, HK.whFree(st))), quote = HK.quoteTradeAdvance(st, inc.id, qty);
      html += `<article class="trade-supply"><div class="plan-heading">${HK.MenuArt.good(lot.good)}<div><b>${HK.name(HK.ORIGIN[inc.origin])}</b><small>${HK.goodName(lot.good)} · ${lot.qty} ${HK.t('unitLast')}</small></div></div><small>${this.tradeArrivalHint(inc)}</small>${quote.ok ? `<b>${HK.t('tradeMarketCost', { qty, cost: quote.cost })}</b><small>${HK.t('tradeRefundDate', { date: HK.fmtDate(quote.latest + 1) })}</small>` : `<small>${HK.t(quote.msg)}</small>`}<button class="small" data-action="tradeadvance" data-id="${inc.id}" data-qty="${qty}" ${!quote.ok || st.money < quote.cost ? 'disabled' : ''}>${HK.t('tradePrepay')}</button></article>`;
    }
    if (!incoming.length) html += `<p class="hint">${HK.t('tradeNoKnownSupply')}</p>`;
    html += `</div>`;
    for (const a of P.advances.slice(-5)) html += `<div class="trade-advance-receipt"><b>${a.qty} ${HK.t('unitLast')} ${HK.goodName(a.good)}</b><small>${HK.name(HK.ORIGIN[a.origin])} · ${a.cost} ${HK.t('mark')} · ${HK.t('tradeAdvance_' + a.status)}</small></div>`;
    html += `</section><section>${this.helpHeading('tradeCompetition','tradeCompetitionHint')}<ul class="log">${P.competition.slice(-4).reverse().map(c => `<li>${HK.t('tradeRivalPurchase', { rival: this.esc(HK.rivalName(c.rival)), qty: c.qty, good: HK.goodName(c.good), ship: this.esc(c.visitor) })}<small>${HK.fmtDate(c.day)}</small></li>`).join('') || `<li>${HK.t('tradeNoCompetition')}</li>`}</ul></section>`;
    return html;
  },
});
const planningAction = HK.UI.action;
HK.UI.action = function (d) {
  const st = HK.state;
  if (d.action === 'tradeplans') { this.setTab('planning'); return; }
  if (d.action === 'tradeadvance') this.result(HK.reserveTradeSupply(st, +d.id, +d.qty));
  else if (d.action === 'tradeinfo') this.result(HK.buyTradeInfo(st, +d.id));
  else if (d.action === 'tradebulk') this.result(HK.buyBulkTrade(st, HK.findVisitor(st, +d.visitor), d.good, +d.qty));
  else { planningAction.call(this, d); return; }
  HK.scheduleSave?.(); this.renderAll();
};
// Keep price, source and penalty visible in the existing council/guild contract lists too.
const planningContractRow = HK.UI.contractRow;
HK.UI.contractRow = function (c, active) {
  let html = planningContractRow.call(this, c, active);
  if (c.tradeTitle) html = html.replace('</td>', `<br><small>${HK.t('tradeDue')}: ${HK.fmtDate(c.deadline??c.deliverBy??HK.state.day+c.days)} · ${HK.t('tradePenalty', { penalty: Math.round(c.reward * .15) })}</small></td>`);
  return html;
};
