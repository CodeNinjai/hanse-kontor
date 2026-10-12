/* Oberflächen für Preisgedächtnis, Handelsbriefe und Warenverkehr. */
'use strict';
Object.assign(HK.UI, {
  priceChart(good) {
    const points = HK.state.priceHistory || [], samples = points.map(p => [p.day, p.goods[good]?.buy, p.goods[good]?.sell]).filter(p => p.slice(1).every(Number.isFinite));
    if (!samples.length) return '';
    const lo = Math.max(0, Math.min(...samples.flatMap(p => p.slice(1))) - 5), hi = Math.max(...samples.flatMap(p => p.slice(1))) + 5;
    const first = samples[0][0], last = samples.at(-1)[0], x = day => 35 + (day - first) / Math.max(1, last - first) * 275, y = n => 110 - (n - lo) / (hi - lo) * 85;
    const path = col => samples.map((p, i) => (i ? 'L' : 'M') + x(p[0]).toFixed(2) + ',' + y(p[col]).toFixed(2)).join(' ');
    const legend = HK.t('marketBuyLine') + ' / ' + HK.t('marketSellLine');
    return `<details class="market-details price-history"><summary>${HK.t('priceHistory')}</summary><svg viewBox="0 0 330 145" role="img" aria-label="${this.esc(HK.goodName(good) + ': ' + legend)}"><path d="M35,20V110H315" fill="none" stroke="#8b805f"/><text x="3" y="28">${hi}</text><text x="3" y="112">${lo}</text><path class="price-buy" d="${path(1)}"/><path class="price-sell" d="${path(2)}"/><circle cx="${x(last)}" cy="${y(samples.at(-1)[1])}" r="2.5" fill="#947744"/><circle cx="${x(last)}" cy="${y(samples.at(-1)[2])}" r="2.5" fill="#567465"/><text x="35" y="133">${this.esc(HK.fmtDate(first))}</text><text x="310" y="133" text-anchor="end">${this.esc(HK.fmtDate(last))}</text></svg><div class="price-legend"><span class="money-amount">${HK.t('mark')} / ${HK.t('unitLast')}</span><span>${HK.t('marketBuyLine')}</span><span>${HK.t('marketSellLine')}</span></div>${samples.length < 2 ? `<small>${HK.t('priceHistoryEmpty')}</small>` : ''}</details>`;
  },
  freightRows() {
    const jobs = (HK.state.freight?.jobs || []).filter(j => j.owner === 'player');
    const shown = jobs.filter(j => j.status !== 'done').slice(0, 8).concat(jobs.filter(j => j.status === 'done').slice(-3));
    return shown.length ? shown.map(j => {
      const inward=j.direction==='in',warehouse=HK.t('warehouseBuilding');
      const source=j.kind==='market'?HK.t('market'):j.kind==='rural'?(HK.RURAL_BUILDINGS?.[j.ruralSite]?HK.name(HK.RURAL_BUILDINGS[j.ruralSite]):HK.t('ruralNav')):j.kind==='own'?(HK.state.ownShips.find(s=>s.id===j.sourceId)?.name||HK.t('harbour')):HK.ORIGIN[j.origin]?HK.name(HK.ORIGIN[j.origin]):HK.t('freightCarrier');
      const endpoints=HK.freightBuildings(j), route=endpoints.map(id=>id?HK.freightBuildingName(id):source).join(' → ');
      const progress=HK.t('freightProgress',{done:j.completed,qty:j.qty});
      return `<li class="freight-movement ${inward?'inbound':'outbound'} ${j.status}">${HK.MenuArt.good(j.good)}<div class="freight-description"><div class="freight-title"><b>${HK.goodName(j.good)}</b><strong>${inward?'+':'−'}${j.qty} <small>${HK.t('unitLast')}</small></strong></div><small class="freight-route"><span class="freight-direction">${HK.t(inward?'freightArrival':'freightDeparture')}</span> · ${this.esc(route)}</small><div class="freight-status"><small>${HK.t(j.nightCargo&&j.status!=='done'?(j.status==='active'?'nightCargoMoving':'nightCargoWaiting'):'freight' + j.status[0].toUpperCase() + j.status.slice(1))} · ${HK.fmtDate(j.finishedDay??j.day)}</small><small>${progress}</small></div><progress max="${j.qty}" value="${j.completed}" aria-label="${this.esc(HK.goodName(j.good)+': '+progress)}"></progress></div></li>`;
    }).join('') : `<li class="warehouse-empty">${HK.MenuArt.symbol('stock')}<span>${HK.t('freightEmpty')}</span></li>`;
  },
  freightPanel() { return `<section class="freight-panel"><h3>${HK.t('freight')}</h3><ul id="freight-list">${this.freightRows()}</ul></section>`; },
  refreshFreight() {
    const el = document.getElementById('freight-list'); if (!el) return;
    const rows = this.freightRows(); if (el.innerHTML !== rows) el.innerHTML = rows;
  },
  chapterPanel() {
    const st=HK.state,c=st.chapters;if(!c)return '';
    const done=c.step>=3,status=done?'done':'active';
    let html=`<article class="mission-card chapter-card ${status}" data-mission="chapters">${this.missionHeader('chapter',HK.t(done?'chapters':'chapterTitle'+c.step),done?'':HK.t('chapters')+' · '+HK.t('missionChapterPart',{n:c.step+1,m:3}),c.step===1?HK.MenuArt.good('grain'):HK.MenuArt.book('missions'),status)}`;
    if(done)return html+this.missionProgress(HK.t('chapterComplete'),3,3)+'</article>';
    const ready=HK.chapterReady(st),amount=c.step===0?Math.min(10,c.bought):c.step===1?Math.min(12,Math.floor(st.warehouse.stock.grain||0)):Math.min(2,Object.values(c.sold).filter(q=>q>=10).length),max=[10,12,2][c.step];
    const progress=c.step===0?HK.t('chapterProgress0',{n:amount}):c.step===1?HK.t('tradeStock',{have:amount,qty:12,missing:12-amount}):HK.t('chapterProgress2',{n:amount});
    html+=`<p>${HK.t('missionChapterGoal'+c.step)}</p><div class="mission-terms"><b>${HK.t('missionChapterReward'+c.step,{money:HK.fmt(Math.round(12*HK.GOOD.grain.base*1.2))})}</b><small>${HK.t('missionNoDeadline')}</small></div>`;
    html+=this.missionProgress(progress,amount,max)+this.missionNext(HK.t(ready?'missionChapterReady'+c.step:'missionChapterNext'+c.step,{missing:max-amount}));
    const button=(choice,key,vars)=>`<button class="small ${choice==='aid'?'':'primary'}" data-action="chapter" data-choice="${choice}" ${ready?'':'disabled'}>${HK.t(key,vars)}</button>`;
    html+=`<div class="mission-actions">${c.step===1?button('aid','chapterAid')+button('contract','missionChapterDeliver',{money:HK.fmt(Math.round(12*HK.GOOD.grain.base*1.2))}):button('','chapterClaim')}${c.step===1&&!ready?`<button class="small" data-action="warehousetrade" data-good="grain">${HK.t('missionBuyGrain')}</button>`:''}</div></article>`;
    return html;

  },
});
for (const name of ['panel_warehouse', 'panel_harbour']) {
  const original = HK.UI[name]; HK.UI[name] = function () { return original.call(this) + this.freightPanel(); };
}
const visitorMethod = ['visitorTrade', 'visitorDetail', 'visitorPanel'].find(name => typeof HK.UI[name] === 'function');
if (visitorMethod) {
  const original = HK.UI[visitorMethod];
  HK.UI[visitorMethod] = function (v, ...args) {
    const record = HK.captainRecord(HK.state, v), html = original.call(this, v, ...args);
    return !record ? html : `<div class="captain-card">${HK.MenuArt.portrait(record.name)}<div><b>${HK.t('regularCaptain')}: ${this.esc(record.name)}</b><small>${HK.t('captainVisits', { n: record.visits, trust: record.trust })}</small><small>${HK.t('captainAdvantage', { n: Math.round((v.captainDiscount || 0) * 1000) / 10 })}</small>${this.helpHeading('regularCaptain','captainTrustHint')}</div></div>` + html;
  };
}
const originalAction = HK.UI.action;
HK.UI.action = function (d) { if (d.action === 'chapter') { this.result(HK.finishChapter(HK.state, d.choice)); this.renderAll(); } else originalAction.call(this, d); };
const originalHeader = HK.UI.renderHeader;
HK.UI.renderHeader = function () { originalHeader.call(this); this.refreshFreight(); };
