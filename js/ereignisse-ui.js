/* The town bulletin shows the exact consequences and costs before any commitment. */
'use strict';
Object.assign(HK.UI, {
  cityQualityBadge(quality=100) {
    const q=Math.floor(quality*10)/10;
    return `<span class="quality-badge ${q<90?'poor':q>105?'fine':''}" title="${this.esc(HK.t('cityQualityHint'))}">${HK.t('cityQualityLabel',{quality:HK.cityNumber(q)})}</span>`;
  },
  cityMarketQuality(g) {
    return `<div class="market-quality"><small>${HK.t('market')}: ${this.cityQualityBadge(HK.goodQuality(HK.state,g,true))}</small>${HK.state.warehouse.stock[g]?`<small>${HK.t('warehouse')}: ${this.cityQualityBadge(HK.goodQuality(HK.state,g))}</small>`:''}</div>`;
  },
  cityEffects(e) {
    const st=HK.state, d=HK.CITY_STORIES[e.type], scale=HK.storyScale(e), rows=[];
    const percent=n=>`${n>0?'+':''}${HK.cityNumber(n*100)} %`;
    const onceScale=e.appliedScale ?? scale;
    for (const [field,key] of [['prod','cityProduction'],['demand','cityDemand'],['supply','citySupply']]) {
      const entries=Object.entries(d[field]||{}).map(([g,f])=>`${HK.goodName(g)} ${percent((field==='supply'?f:f-1)*(field==='supply'?onceScale:scale))}`);
      if (entries.length) rows.push(`<li><b>${HK.t(key)}</b><span>${entries.join(' · ')}</span></li>`);
    }
    for (const [field,key] of [['quality','cityQuality'],['qualityShock','cityQualityShock']]) {
      const entries=Object.entries(d[field]||{}).map(([g,q])=>`${HK.goodName(g)} ${HK.cityNumber(field==='qualityShock' ? (e.shockResults?.[g] ?? 100+(q-100)*onceScale) : 100+(q-100)*scale)} / 100`);
      if (entries.length) rows.push(`<li><b>${HK.t(key)}</b><span>${entries.join(' · ')}</span></li>`);
    }
    const imports=Object.entries(d.import||{}).map(([g,f])=>`${HK.goodName(g)} ${percent((f-1)*scale)}`);
    if (d.importAll) imports.push(percent((d.importAll-1)*scale));
    if (imports.length) rows.push(`<li><b>${HK.t('cityImport')}</b><span>${imports.join(' · ')}</span></li>`);
    for (const [field,key] of [['wages','cityWages'],['importPrice','cityImportPrice']]) if (d[field]) rows.push(`<li><b>${HK.t(key)}</b><span>${percent((d[field]-1)*scale)}</span></li>`);
    for (const [route,days] of Object.entries(d.delay||{})) rows.push(`<li>${HK.t('cityDelay',{route:HK.t(route==='sea'?'citySea':'cityLand'),days:Math.ceil(days*onceScale)})}</li>`);
    if (d.mood) rows.push(`<li>${HK.t('cityMoodChange',{value:(d.mood*onceScale>0?'+':'')+HK.cityNumber(d.mood*onceScale)})}</li>`);
    if (d.damage) {
      const protectedStock=st.cityLife.protectionUntil>=st.day || HK.hasVenture(st,'cooper');
      const losses=Object.entries(e.damageLosses||{}).map(([g,q])=>`${q} ${HK.t('unitLast')} ${HK.goodName(g)}`);
      if (e.damageDone) rows.push(`<li>${losses.length?HK.t('cityDamageRecorded',{goods:losses.join(' · ')}):HK.t('cityDamageNone')}</li>`);
      else rows.push(`<li class="${protectedStock?'':'plan-risk'}">${HK.t('cityDamage',{date:HK.fmtDate(e.respondBy+1),goods:Object.entries(d.damage).map(([g,f])=>`${HK.goodName(g)} ${HK.cityNumber(f*scale*100)} %`).join(' · ')})}${protectedStock?' '+HK.t('cityProtected'):''}</li>`);
    }
    return `<ul class="city-effects">${rows.join('')}</ul>`;
  },
  cityResponseCard(e,c) {
    const st=HK.state, quote=HK.cityChoiceQuote(st,e.id,c.id), costs=[c.cost?`${c.cost} ${HK.t('mark')}`:HK.t('cityFree'),...Object.entries(c.goods||{}).map(([g,q])=>`${q} ${HK.t('unitLast')} ${HK.goodName(g)}`)], benefits=[];
    if (c.mood) benefits.push(HK.t('cityMoodChange',{value:'+'+c.mood}));
    if (c.rep) benefits.push(HK.t('cityRepChange',{value:c.rep}));
    if (c.influence) benefits.push(HK.t('cityInfluenceChange',{value:c.influence}));
    if (c.faction) benefits.push(HK.t('cityFactionChange'));
    if (c.protect) benefits.push(HK.t('cityProtectTerm',{days:c.protect}));
    if (c.mitigate) benefits.push(HK.t('cityReliefTerm'));
    if (c.follow) benefits.push(HK.t('cityFollowTerm',{event:HK.t('cityTitle_'+c.follow)}));
    return `<div class="city-response"><button class="small" data-action="cityresponse" data-id="${e.id}" data-choice="${c.id}" ${quote.ok?'':'disabled'}>${HK.t('cityChoice_'+c.id)}</button><small>${costs.join(' + ')}</small>${benefits.length?`<small>${benefits.join(' · ')}</small>`:''}${!quote.ok?`<small class="plan-risk">${HK.t(quote.msg)}</small>`:''}</div>`;
  },
  cityContractCard(c,active) {
    const st=HK.state, have=Math.floor(st.warehouse.stock[c.good]||0), quality=HK.goodQuality(st,c.good), due=active?c.deadline:c.deliverBy;
    return `<article class="trade-plan-card city-contract" data-contract="${c.id}"><div class="plan-heading">${HK.MenuArt.good(c.good)}<div><b>${HK.t('cityTitle_'+c.cityStory)}</b><small>${c.qty} ${HK.t('unitLast')} ${HK.goodName(c.good)}</small></div></div><b>${HK.t('cityMinQuality',{quality:c.minQuality})}</b>${this.cityQualityBadge(quality)}<small>${HK.t('tradeStock',{have,qty:c.qty,missing:Math.max(0,c.qty-have)})}</small><b>${HK.t('tradeFixedRevenue')}: ${c.reward} ${HK.t('mark')}</b><small>${HK.t('tradeDue')}: ${HK.fmtDate(due)}</small><small>${HK.t('tradePenalty',{penalty:Math.round(c.reward*.15)})}</small>${!active?`<small>${HK.t('tradeOfferUntil',{date:HK.fmtDate(c.expires-1)})}</small>`:''}<button class="small primary" data-action="${active?'delivercontract':'acceptcontract'}" data-id="${c.id}" ${active?(have<c.qty || quality<c.minQuality || st.day>due?'disabled':''):(st.contracts.active.length>=3?'disabled':'')}>${HK.t(active?'deliver':'tradePromise')}</button></article>`;
  },
  cityLifePanel() {
    const st=HK.state, L=st.cityLife, mood=Math.round(L.mood), status=mood<40?'low':mood>70?'high':'mid';
    let html=`<section class="city-life">${this.helpHeading('cityLife','cityLifeHelp')}<div class="city-mood ${status}"><div><b>${HK.t('cityMood')}</b><strong>${HK.t('cityMood_'+status)} · ${mood}/100</strong></div><meter min="0" max="100" value="${mood}" aria-label="${HK.t('cityMood')}"></meter></div>`;
    if (L.protectionUntil>=st.day && L.protectionUntil>0) html+=`<p class="city-protection">${HK.t('cityProtection',{date:HK.fmtDate(L.protectionUntil)})}</p>`;
    if (HK.hasVenture(st,'cooper')) html+=`<p class="city-protection">${HK.t('cityCooperProtection')}</p>`;
    const events=L.stories.filter(e=>e.end>=st.day);
    for (const e of events) {
      const d=HK.CITY_STORIES[e.type];
      html+=`<article class="city-story" data-story="${e.id}"><div class="plan-heading">${HK.MenuArt.good(d.art)}<div><span class="tag ${e.activated?'gold':''}">${HK.t(e.activated?'cityActive':'cityUpcoming')}</span><b>${HK.t('cityTitle_'+e.type)}</b><small>${HK.fmtDate(e.start)} – ${HK.fmtDate(e.end)}</small></div></div>${e.cause?`<small>${HK.t('cityFollow')}: ${HK.t('cityTitle_'+e.cause)}</small>`:''}<p>${HK.t('cityText_'+e.type)}</p>${this.cityEffects(e)}`;
      if (e.mitigated) html+=`<p class="city-protection">${HK.t('cityMitigated')}</p>`;
      if (!e.choice && st.day<=e.respondBy && d.choices.length) html+=`<small>${HK.t('cityUntil',{date:HK.fmtDate(e.respondBy)})}</small><div class="city-responses">${[...d.choices,{id:'pass'}].map(c=>this.cityResponseCard(e,c)).join('')}</div><small>${HK.t('cityAuto')}</small>`;
      else if (e.choice) html+=`<small>${HK.t('cityHandled',{choice:HK.t('cityChoice_'+e.choice)})}</small>`;
      html+='</article>';
    }
    if (!events.length) html+=`<p class="hint">${HK.t('cityNone')}</p>`;
    const contracts=[...st.contracts.active.filter(c=>c.cityStory).map(c=>this.cityContractCard(c,true)),...st.contracts.offers.filter(c=>c.cityStory&&c.expires>st.day).map(c=>this.cityContractCard(c,false))];
    if (contracts.length) html+=`<div class="trade-plans">${contracts.join('')}</div>`;
    html+=``;
    if (L.history.length) html+=`<details><summary>${HK.t('cityRecent')}</summary>${L.history.slice(-4).reverse().map(e=>`<p class="hint">${HK.fmtDate(e.start)} · ${HK.t('cityTitle_'+e.type)} · ${HK.t('cityChoice_'+(e.choice||'pass'))}</p>`).join('')}</details>`;
    return html+'</section>';
  },
});
const cityTeaser=HK.UI.tradeTeaser;
HK.UI.tradeTeaser=function () { const count=HK.state.cityLife.stories.filter(e=>e.end>=HK.state.day).length; return cityTeaser.call(this)+(count?`<button class="planning-link city-bulletin" data-action="tradeplans">${HK.MenuArt.symbol('planning')}${HK.t('cityMore',{count})}</button>`:''); };
const cityUIAction=HK.UI.action;
HK.UI.action=function (d) { if (d.action!=='cityresponse') return cityUIAction.call(this,d); this.result(HK.respondCityStory(HK.state,+d.id,d.choice)); HK.scheduleSave?.(); this.renderAll(); };
const cityContractRow=HK.UI.contractRow;
HK.UI.contractRow=function (c,active) { const html=cityContractRow.call(this,c,active); return c.minQuality?html.replace('</td>',`<br><small>${HK.t('cityMinQuality',{quality:c.minQuality})}</small></td>`):html; };
