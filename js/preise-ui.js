/* Handel → Preise & Verlauf: die Tabelle ist die Hauptansicht.
   Jede Zeile zeigt Vorrat, Marktpreise, Lage des heutigen Preises zwischen Tief und Hoch des gewählten
   Zeitraums, den Trend als kleine Kurve und den besten Besucher, der gerade im Hafen liegt. Ein Klick
   klappt darunter den großen Verlauf mit den beobachteten Besucherpreisen auf. Zeitraum, Sortierung und
   der Filter „nur Lagerware“ sind reine Ansichtswahl und schreiben nichts in den Spielstand. */
'use strict';

Object.assign(HK.I18N.de, {
  preisZeitraum: 'Zeitraum', preisTage: '{n} T', preisNurLager: 'Nur Lagerware', preisAlle: 'Alle Waren',
  preisSpalteMarkt: 'Markt', preisSpalteMarktHint: 'Einkauf / Verkauf am Markt, je Last',
  preisSpalteLage: 'Tief – Hoch', preisSpalteLageHint: 'Einkaufspreis am Markt: Tief und Hoch im Zeitraum, der Strich zeigt den heutigen Preis',
  preisSpalteTrend: 'Trend', preisSpalteTrendHint: 'Einkaufspreis am Markt im Zeitraum; Prozent gegenüber dem Beginn des Zeitraums',
  preisSpalteBesucher: 'Besucher jetzt', preisSpalteBesucherHint: 'Der Besucher im Hafen, der die Ware gerade am günstigsten hergibt oder am teuersten abnimmt. Grün: besser als der Markt.',
  preisGibt: '{wer} verkauft für {preis}', preisNimmt: '{wer} zahlt {preis}', preisMarktVergleich: 'Markt {preis}', preisKeinBesucher: '–',
  preisKnapp: 'knapp', preisGedeckt: 'gedeckt', preisUeberschuss: 'Überschuss',
  preisMarktZeitraum: 'Markt in {n} Tagen: Einkauf {kt}–{kh} · Verkauf {vt}–{vh} · heute {k} / {v}',
  preisBesucherZeitraum: 'Besucher in {n} Tagen: billigstes Angebot {angebot} · höchstes Gebot {gebot}',
  preisBeiWem: '{preis} ({wer}, {datum})', preisNiemand: 'keins',
  preisBeobachtet: 'Beobachtete Besucherpreise', preisBeobachtetHint: 'Täglich mitgeschrieben, solange ein Besucher im Hafen liegt: Preis je Last nach Zoll, Menge und Güte zum Zeitpunkt der Beobachtung. Alte Einträge sind keine Zusagen.',
  preisBesucher: 'Besucher', preisGesehen: 'Gesehen', preisRichtung: 'Richtung', preisPreis: 'Preis', preisMenge: 'Menge', preisGuete: 'Güte',
  preisImHafen: 'im Hafen', preisVorTagen: 'vor {n} T', preisHeute: 'heute', preisVerkauftDir: 'verkauft', preisKauftVonDir: 'kauft',
  preisLegende: 'Linien: Markt Einkauf / Verkauf · Punkte: Besucher', preisZuklappen: 'Zuklappen', preisAufklappen: 'Aufklappen',
});
Object.assign(HK.I18N.en, {
  preisZeitraum: 'Period', preisTage: '{n} d', preisNurLager: 'In stock only', preisAlle: 'All goods',
  preisSpalteMarkt: 'Market', preisSpalteMarktHint: 'Market buy / sell, per last',
  preisSpalteLage: 'Low – high', preisSpalteLageHint: 'Market buy price: low and high in the period, the mark shows today’s price',
  preisSpalteTrend: 'Trend', preisSpalteTrendHint: 'Market buy price in the period; percent against the start of the period',
  preisSpalteBesucher: 'Visitors now', preisSpalteBesucherHint: 'The visitor in port who currently sells the good cheapest or buys it dearest. Green: better than the market.',
  preisGibt: '{wer} sells for {preis}', preisNimmt: '{wer} pays {preis}', preisMarktVergleich: 'market {preis}', preisKeinBesucher: '–',
  preisKnapp: 'scarce', preisGedeckt: 'supplied', preisUeberschuss: 'surplus',
  preisMarktZeitraum: 'Market over {n} days: buy {kt}–{kh} · sell {vt}–{vh} · today {k} / {v}',
  preisBesucherZeitraum: 'Visitors over {n} days: cheapest offer {angebot} · highest bid {gebot}',
  preisBeiWem: '{preis} ({wer}, {datum})', preisNiemand: 'none',
  preisBeobachtet: 'Observed visitor prices', preisBeobachtetHint: 'Recorded daily while a visitor is in port: price per last after duty, quantity and grade at the time. Old entries are no promises.',
  preisBesucher: 'Visitor', preisGesehen: 'Seen', preisRichtung: 'Direction', preisPreis: 'Price', preisMenge: 'Qty', preisGuete: 'Grade',
  preisImHafen: 'in port', preisVorTagen: '{n} d ago', preisHeute: 'today', preisVerkauftDir: 'sells', preisKauftVonDir: 'buys',
  preisLegende: 'Lines: market buy / sell · dots: visitors', preisZuklappen: 'Collapse', preisAufklappen: 'Expand',
});

Object.assign(HK.UI, {
  PREIS_ZEITEN: [7, 30, 60],
  preisAnsicht() {
    const i = this.inputs;
    if (!this.PREIS_ZEITEN.includes(i.preisZeit)) i.preisZeit = 30;
    if (!i.preisSort) i.preisSort = { key: 'name', dir: 1 };
    return i;
  },
  /* Alles, was eine Zeile und ihre Aufklappung über eine Ware wissen müssen — ohne den Spielstand zu ändern */
  preisDaten(st, good, tage) {
    const ab = st.day - tage;
    const punkte = (st.priceHistory || []).filter(p => p.day >= ab && Number.isFinite(p.goods[good]?.buy) && Number.isFinite(p.goods[good]?.sell))
      .map(p => ({ day: p.day, buy: p.goods[good].buy, sell: p.goods[good].sell }));
    const heute = { day: st.day, buy: HK.marketBuyPrice(st, good, 1), sell: HK.marketSellPrice(st, good, 1) };
    if (punkte.at(-1)?.day === st.day) punkte[punkte.length - 1] = heute; else punkte.push(heute);
    const buys = punkte.map(p => p.buy), sells = punkte.map(p => p.sell);
    const anfang = punkte[0].buy, trend = anfang ? (heute.buy - anfang) / anfang : 0;
    const beob = (st.ascent?.prices || []).filter(p => p.good === good && p.day >= ab);
    let billigst = null, hoechst = null;
    for (const p of beob) {
      if (p.direction === 'buy' && (!billigst || p.price < billigst.price)) billigst = p;
      if (p.direction === 'sell' && (!hoechst || p.price > hoechst.price)) hoechst = p;
    }
    return { punkte, heute, tief: Math.min(...buys), hoch: Math.max(...buys), vTief: Math.min(...sells), vHoch: Math.max(...sells), trend, beob, billigst, hoechst };
  },
  /* Bester Besucher, der jetzt im Hafen liegt: wer gibt am billigsten, wer nimmt am teuersten — und um wie viel besser als der Markt */
  preisBesucherJetzt(st, good, heute) {
    let quelle = null, abnehmer = null;
    for (const v of HK.besucherAlle(st)) {
      if (v.cargo[good]?.qty > 0) { const p = HK.nettoKauf(st, v, good); if (!quelle || p < quelle.preis) quelle = { preis: p, v }; }
      if (v.wants[good]?.qty > 0) { const p = HK.nettoVerkauf(st, v, good); if (!abnehmer || p > abnehmer.preis) abnehmer = { preis: p, v }; }
    }
    const kauf = quelle ? { ...quelle, art: 'gibt', vorteil: heute.buy - quelle.preis } : null;
    const verk = abnehmer ? { ...abnehmer, art: 'nimmt', vorteil: abnehmer.preis - heute.sell } : null;
    return !kauf ? verk : !verk ? kauf : kauf.vorteil >= verk.vorteil ? kauf : verk;
  },
  preisFunke(punkte, trend) {
    if (punkte.length < 2) return '<span class="preis-funke leer"></span>';
    const w = 64, h = 18, v = punkte.map(p => p.buy), lo = Math.min(...v), hi = Math.max(...v), d0 = punkte[0].day, d1 = punkte.at(-1).day;
    const x = d => 1 + (d - d0) / Math.max(1, d1 - d0) * (w - 4), y = n => hi === lo ? h / 2 : 2 + (hi - n) / (hi - lo) * (h - 4);
    const pfad = punkte.map((p, i) => (i ? 'L' : 'M') + x(p.day).toFixed(1) + ',' + y(p.buy).toFixed(1)).join('');
    const cls = trend > 0.02 ? 'steigt' : trend < -0.02 ? 'faellt' : 'ruhig';
    return `<svg class="preis-funke ${cls}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${pfad}"/><circle cx="${x(d1).toFixed(1)}" cy="${y(v.at(-1)).toFixed(1)}" r="1.8"/></svg>`;
  },
  preisTrendText(trend) {
    const pct = Math.round(trend * 100), cls = trend > 0.02 ? 'steigt' : trend < -0.02 ? 'faellt' : 'ruhig';
    return `<small class="preis-trend ${cls}">${pct > 0 ? '▲ +' : pct < 0 ? '▼ ' : '→ '}${pct} %</small>`;
  },
  /* Großer Verlauf in der Aufklappung: Markt als Linien, beobachtete Besucher als Punkte */
  preisKurve(good, D, tage) {
    const pts = D.punkte, besucher = D.beob;
    const werte = pts.flatMap(p => [p.buy, p.sell]).concat(besucher.map(p => p.price));
    if (pts.length < 2) return `<p class="hint">${HK.t('priceHistoryEmpty')}</p>`;
    const lo = Math.max(0, Math.min(...werte) - 4), hi = Math.max(...werte) + 4, st = HK.state, d0 = Math.max(pts[0].day, st.day - tage), d1 = st.day;
    const x = d => 34 + (d - d0) / Math.max(1, d1 - d0) * 286, y = n => 112 - (n - lo) / Math.max(1, hi - lo) * 96;
    const linie = key => pts.map((p, i) => (i ? 'L' : 'M') + x(p.day).toFixed(1) + ',' + y(p[key]).toFixed(1)).join(' ');
    const punkte = besucher.map(p => `<circle class="${p.direction === 'buy' ? 'bes-angebot' : 'bes-gebot'}" cx="${x(p.day).toFixed(1)}" cy="${y(p.price).toFixed(1)}" r="1.7"/>`).join('');
    return `<svg class="preis-kurve" viewBox="0 0 330 134" role="img" aria-label="${this.esc(HK.goodName(good) + ': ' + HK.t('preisLegende'))}"><path class="achse" d="M34,14V112H322"/><text x="2" y="20">${Math.round(hi)}</text><text x="2" y="114">${Math.round(lo)}</text><text x="34" y="128">${HK.fmtDate(d0)}</text><text x="322" y="128" text-anchor="end">${HK.fmtDate(d1)}</text>${pts.length > 1 ? `<path class="price-buy" d="${linie('buy')}"/><path class="price-sell" d="${linie('sell')}"/>` : ''}${punkte}<circle class="heute-kauf" cx="${x(d1)}" cy="${y(D.heute.buy).toFixed(1)}" r="3"/><circle class="heute-verk" cx="${x(d1)}" cy="${y(D.heute.sell).toFixed(1)}" r="3"/></svg><small class="hint">${HK.t('preisLegende')}</small>`;
  },
  /* Beobachtungen zusammengefasst: ein Eintrag je Besucher und Richtung, der jüngste zählt */
  preisBeobachtungen(st, D) {
    const je = new Map();
    for (const p of D.beob) { const k = p.visitor + '|' + p.direction, a = je.get(k); if (!a || p.day >= a.day) je.set(k, p); }
    const liste = [...je.values()].sort((a, b) => b.day - a.day || a.price - b.price).slice(0, 8);
    const imHafen = new Set(HK.besucherAlle(st).map(v => v.id)), schiff = new Map(HK.besucherAlle(st).filter(v => v.sea).map(v => [v.id, v.name]));
    const rows = liste.map(r => {
      const gesehen = imHafen.has(r.visitor) ? `<span class="tag gold">${HK.t('preisImHafen')}</span>` : st.day - r.day ? HK.t('preisVorTagen', { n: st.day - r.day }) : HK.t('preisHeute');
      return `<tr class="visitor-price-row ${imHafen.has(r.visitor) ? '' : 'alt'}"><td><b>${schiff.has(r.visitor) ? this.esc(schiff.get(r.visitor)) + ' (' + HK.name(HK.ORIGIN[r.origin]) + ')' : HK.name(HK.ORIGIN[r.origin])}</b><small class="preis-unter">${this.esc(r.name)}${r.name ? ' · ' : ''}${r.qty} ${HK.t('unitLast')} · ${HK.t('preisGuete')} ${Math.round(r.quality)}</small></td><td>${gesehen}</td><td>${HK.t(r.direction === 'buy' ? 'preisVerkauftDir' : 'preisKauftVonDir')}</td><td class="num" data-money>${r.price}</td></tr>`;
    }).join('');
    return `<details class="market-details visitor-history" open><summary>${HK.t('preisBeobachtet')} <span class="preis-info" title="${this.esc(HK.t('preisBeobachtetHint'))}">ⓘ</span></summary>${rows ? `<table class="market preis-beob"><thead><tr><th>${HK.t('preisBesucher')}</th><th>${HK.t('preisGesehen')}</th><th>${HK.t('preisRichtung')}</th><th class="num">${HK.t('preisPreis')}</th></tr></thead><tbody>${rows}</tbody></table>` : `<p class="hint">${HK.t('priceHistoryEmpty')}</p>`}</details>`;
  },
  preisAufklappung(st, good, D, tage) {
    const beiWem = p => p ? HK.t('preisBeiWem', { preis: p.price, wer: HK.name(HK.ORIGIN[p.origin]), datum: HK.fmtDate(p.day) }) : HK.t('preisNiemand');
    return `<div class="preis-details">${this.preisKurve(good, D, tage)}
      <p class="preis-spannen">${HK.t('preisMarktZeitraum', { n: tage, kt: D.tief, kh: D.hoch, vt: D.vTief, vh: D.vHoch, k: D.heute.buy, v: D.heute.sell })}<br>${HK.t('preisBesucherZeitraum', { n: tage, angebot: beiWem(D.billigst), gebot: beiWem(D.hoechst) })}</p>
      ${this.preisBeobachtungen(st, D)}
      <div class="btn-row"><button class="small" data-action="warehousetrade" data-good="${good}">${HK.t('marketTradeNow')} →</button></div></div>`;
  },
  panel_marketPrices() {
    const st = HK.state, A = this.preisAnsicht(), tage = A.preisZeit, offen = HK.GOOD[this.marketGood] ? this.marketGood : 'beer', zu = this.preisZu === offen;
    let zeilen = HK.GOODS.map(g => {
      const D = this.preisDaten(st, g.id, tage), B = this.preisBesucherJetzt(st, g.id, D.heute);
      return { g, D, B, vorrat: Math.floor(st.town.stock[g.id] || 0), lager: Math.floor(st.warehouse.stock[g.id] || 0), cap: HK.marketCap(st, g.id), lage: D.hoch > D.tief ? (D.heute.buy - D.tief) / (D.hoch - D.tief) : 0.5 };
    });
    if (A.preisNurLager) zeilen = zeilen.filter(z => z.lager > 0 || z.g.id === offen);
    const S = A.preisSort, wert = {
      name: z => HK.goodName(z.g.id), vorrat: z => z.vorrat, markt: z => z.D.heute.buy, lage: z => z.lage, trend: z => z.D.trend,
      besucher: z => z.B ? z.B.vorteil : -1e9, heute: z => z.cap, lager: z => z.lager,
    }[S.key] || (z => HK.goodName(z.g.id));
    zeilen.sort((a, b) => { const x = wert(a), y = wert(b); return (typeof x === 'string' ? x.localeCompare(y, HK.LANG) : x - y) * S.dir; });

    const kopf = (key, label, hint, num) => `<th class="${num ? 'num ' : ''}k-${key}"${hint ? ` title="${this.esc(HK.t(hint))}"` : ''}><button class="preis-sort ${S.key === key ? 'aktiv' : ''}" data-action="preissort" data-key="${key}">${HK.t(label)}${S.key === key ? (S.dir > 0 ? ' ▲' : ' ▼') : ''}</button></th>`;
    let h = this.head(HK.t('marketPricesSub'));
    h += `<section class="preis-werkzeug"><span class="preis-zeiten" role="group" aria-label="${HK.t('preisZeitraum')}"><small>${HK.t('preisZeitraum')}</small>${this.PREIS_ZEITEN.map(n => `<button class="small ${n === tage ? 'active' : ''}" data-action="preiszeit" data-tage="${n}">${HK.t('preisTage', { n })}</button>`).join('')}</span>
      <button class="small ${A.preisNurLager ? 'active' : ''}" data-action="preislager">${HK.t(A.preisNurLager ? 'preisAlle' : 'preisNurLager')}</button>
      <span class="preis-legende"><i class="d-shortage"></i>${HK.t('preisKnapp')} <i class="d-normalDemand"></i>${HK.t('preisGedeckt')} <i class="d-surplus"></i>${HK.t('preisUeberschuss')}</span></section>`;
    h += `<div class="preis-tabelle"><table class="market preis-liste"><thead><tr>${kopf('name', 'good')}${kopf('vorrat', 'stock', null, 1)}${kopf('markt', 'preisSpalteMarkt', 'preisSpalteMarktHint', 1)}${kopf('lage', 'preisSpalteLage', 'preisSpalteLageHint')}${kopf('trend', 'preisSpalteTrend', 'preisSpalteTrendHint')}${kopf('besucher', 'preisSpalteBesucher', 'preisSpalteBesucherHint')}${kopf('heute', 'marketCapHint', null, 1)}${kopf('lager', 'warehouse', null, 1)}</tr></thead><tbody>`;
    for (const z of zeilen) {
      const id = z.g.id, auf = id === offen && !zu, D = z.D, B = z.B;
      const besucher = B ? `<span class="${B.vorteil > 0 ? 'rat gut' : 'preis-schwach'}">${HK.t(B.art === 'gibt' ? 'preisGibt' : 'preisNimmt', { wer: this.esc(HK.besucherName(B.v)), preis: B.preis })}</span>${B.vorteil > 0 ? '' : `<small class="preis-unter">${HK.t('preisMarktVergleich', { preis: B.art === 'gibt' ? D.heute.buy : D.heute.sell })}</small>`}` : `<span class="preis-schwach">${HK.t('preisKeinBesucher')}</span>`;
      h += `<tr class="preis-zeile ${auf ? 'offen' : ''} ${id === offen ? 'gewaehlt' : ''}" data-good="${id}" data-action="marketpricegood">
        <td class="gname"><button class="preis-ware" aria-expanded="${auf}" title="${HK.t(auf ? 'preisZuklappen' : 'preisAufklappen')}"><span class="preis-pfeil">${auf ? '▾' : '▸'}</span>${HK.MenuArt?.good ? HK.MenuArt.good(id, 'preis-symbol') : ''}<span>${HK.goodName(id)}</span></button></td>
        <td class="num k-vorrat"><i class="preis-punkt d-${HK.demandLabel(st, id)}" title="${HK.t(HK.demandLabel(st, id))}"></i>${z.vorrat}</td>
        <td class="num k-markt"><span class="p-kauf" data-money>${D.heute.buy}</span> <span class="preis-trenn">/</span> <span class="p-verk" data-money>${D.heute.sell}</span></td>
        <td class="k-lage"><span class="preis-lage"><small>${D.tief}</small><span class="lage-balken"><i style="left:${Math.round(z.lage * 100)}%"></i></span><small>${D.hoch}</small></span></td>
        <td class="k-trend">${this.preisFunke(D.punkte, D.trend)}${this.preisTrendText(D.trend)}</td>
        <td class="k-besucher">${besucher}</td>
        <td class="num k-heute">${z.cap}</td>
        <td class="num k-lager">${z.lager || '<span class="preis-schwach">0</span>'}</td></tr>`;
      if (auf) h += `<tr class="preis-detail"><td colspan="8">${this.preisAufklappung(st, id, D, tage)}</td></tr>`;
    }
    return h + '</tbody></table></div>';
  },
});

/* Ansichtswahl: Ware auf- und zuklappen, Zeitraum, Sortierung, Filter. Ändert nur die Oberfläche. */
{
  const action = HK.UI.action;
  HK.UI.action = function (d) {
    const A = this.preisAnsicht();
    switch (d.action) {
      case 'marketpricegood': if (!HK.GOOD[d.good]) return; if (this.marketGood === d.good) this.preisZu = this.preisZu === d.good ? null : d.good; else { this.marketGood = d.good; this.preisZu = null; } this.inputs.goodGroup = 'all'; break;
      case 'preiszeit': { const n = +d.tage; if (this.PREIS_ZEITEN.includes(n)) A.preisZeit = n; break; }
      case 'preissort': A.preisSort = A.preisSort.key === d.key ? { key: d.key, dir: -A.preisSort.dir } : { key: d.key, dir: d.key === 'name' ? 1 : -1 }; break;
      case 'preislager': A.preisNurLager = !A.preisNurLager; break;
      default: return action.call(this, d);
    }
    this.renderSidebar();
  };
}
