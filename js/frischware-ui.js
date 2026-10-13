/* Oberfläche der Frischware: Betriebsansicht von Hühnerhof, Gemüsegarten und Obstgarten, Abschnitt
   auf der Seite „Marktstände“ und der Korb-Knopf in der Personenzeile. Reines Rendern ändert den
   Spielstand nicht. */
'use strict';
const frischKoerbe = qty => HK.frischKoerbeText(qty);
{
  // Kleine Korbbilder je Sorte, im Stil der übrigen Menübilder (120 × 88).
  const FARBE = {
    eggs: ['#efe4c8', '#d9c9a3'], herbs: ['#6f9445', '#8fb35a'], leek: ['#9cb86a', '#e9e6cf'], cherries: ['#a8322e', '#7e2422'],
    peas: ['#8fb35a', '#6f9445'], beans: ['#6d8f3e', '#8aa955'], apples: ['#b8452f', '#8fae4a'], pears: ['#c9b45a', '#a99a45'],
    plums: ['#5b3f6e', '#76558a'], cabbage: ['#86a65a', '#a7c27a'], turnips: ['#e3d6c8', '#9a5f87'], driedfruit: ['#8a5a36', '#a97446'],
  };
  const cache = new Map();
  HK.MenuArt.fresh = function (sorte, cls = '') {
    const key = sorte + ':' + cls; if (cache.has(key)) return cache.get(key);
    const [a, b] = FARBE[sorte] || ['#b39a67', '#8c7651'], big = ['cabbage', 'apples', 'pears'].includes(sorte), small = ['cherries', 'peas', 'beans', 'herbs'].includes(sorte);
    const pts = big ? [[44, 40, 11], [64, 37, 12], [82, 42, 10], [54, 30, 9], [73, 28, 9]] : small ? [[38, 42, 5], [48, 37, 5], [58, 41, 5], [68, 36, 5], [78, 41, 5], [86, 37, 5], [52, 31, 5], [63, 29, 5], [74, 30, 5], [44, 33, 4]] : [[42, 41, 8], [56, 38, 8], [70, 39, 8], [83, 42, 7], [49, 30, 7], [63, 28, 7], [76, 31, 7]];
    let body = pts.map(([x, y, r], i) => sorte === 'eggs' ? `<ellipse cx="${x}" cy="${y}" rx="${r * .8}" ry="${r}" fill="${i % 2 ? a : b}" stroke="#a89470" stroke-width="1"/>` : sorte === 'leek' ? `<path d="M${x} ${y + 6}L${x - 4} ${y - 18}M${x} ${y + 6}L${x + 5} ${y - 16}" stroke="${a}" stroke-width="4"/><rect x="${x - 3}" y="${y - 2}" width="6" height="10" rx="2" fill="${b}"/>` : sorte === 'beans' ? `<path d="M${x - 7} ${y}Q${x} ${y - 6} ${x + 7} ${y}" stroke="${i % 2 ? a : b}" stroke-width="4" fill="none" stroke-linecap="round"/>` : sorte === 'herbs' ? `<path d="M${x} ${y + 4}Q${x - 6} ${y - 6} ${x} ${y - 12}Q${x + 6} ${y - 6} ${x} ${y + 4}Z" fill="${i % 2 ? a : b}"/>` : `<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 2 ? a : b}"/>`).join('');
    if (sorte === 'cherries' || sorte === 'apples') body += pts.slice(0, 4).map(([x, y, r]) => `<path d="M${x} ${y - r}l3 -6" stroke="#5d4a2c" stroke-width="1.6"/>`).join('');
    if (sorte === 'turnips') body += pts.slice(0, 5).map(([x, y, r]) => `<path d="M${x - 4} ${y - r}L${x} ${y - r - 9}L${x + 4} ${y - r}" stroke="#6f9445" stroke-width="2.4" fill="none"/>`).join('');
    const basket = `<path d="M26 44L96 44L88 74Q61 82 34 74Z" fill="#a1834f"/><path d="M30 52H92M32 60H90M34 68H87" stroke="#7d6339" stroke-width="2.5"/><path d="M40 46L43 75M53 46L54 78M66 46L66 78M79 46L77 76" stroke="#bb9d62" stroke-width="2"/><path d="M30 44Q61 4 92 44" fill="none" stroke="#8a6c40" stroke-width="4"/>`;
    const svg = `<svg class="menu-art ${cls}" viewBox="0 0 120 88" aria-hidden="true" focusable="false" data-menu-art="fresh-${sorte}" xmlns="http://www.w3.org/2000/svg"><ellipse cx="61" cy="76" rx="39" ry="7" fill="#071a17" opacity=".35"/>${basket}${body}</svg>`;
    cache.set(key, svg); return svg;
  };
}
HK.UI.ruralSections.ruralFields.push(...HK.FRISCH_SITES);
Object.assign(HK.UI, {
  frischKorbZeile(site, sorte, qty) {
    const st = HK.state, own = st.rural.sites[site]?.owner, unit = HK.frischEinkaufspreis(st, site, sorte), platz = HK.frischStandPlatz(st);
    const alle = Math.min(qty, platz, unit ? Math.floor(st.money / unit) : qty);
    let knoepfe = '';
    if (st.stalls > 0) {
      const one = HK.frischAngebot(st, site, sorte, 1);
      knoepfe = `<div class="btn-row frisch-buttons"><button class="small" data-action="frischkaufen" data-site="${site}" data-sorte="${sorte}" data-qty="1" ${one.ok ? '' : 'disabled'}>${HK.t('frischAufStandEinzeln')}</button>${alle > 1 ? `<button class="small primary" data-action="frischkaufen" data-site="${site}" data-sorte="${sorte}" data-qty="${alle}">${HK.t('frischAufStandAlle', { qty: alle })}</button>` : ''}</div>${one.ok || !one.msg ? '' : `<small class="decision-reason">${HK.t(one.msg)}</small>`}`;
    }
    return `<article class="rural-stock-row frisch-row" data-frisch="${site}:${sorte}">${HK.MenuArt.fresh(sorte)}<div><b>${HK.frischName(sorte)}</b><small>${HK.t('frischKoerbe', { qty })} · ${own ? HK.t('frischEigenGratis') : HK.t('frischKorbPreis', { price: HK.fmt(unit) })}</small>${knoepfe}</div></article>`;
  },
  frischHofListe(site) {
    const hof = HK.state.frisch?.hof?.[site] || {}, sorten = Object.keys(hof).filter(s => hof[s] >= 1);
    if (!sorten.length) { const leer = HK.frischLeerGrund(HK.state, site) || 'frischNichts'; return `<p class="hint" data-frisch-leer="${leer}">${HK.t(leer)}</p>`; }
    return sorten.map(s => this.frischKorbZeile(site, s, Math.floor(hof[s]))).join('');
  },
  frischJahreslauf(site) {
    return `<ul class="frisch-jahr">${['spring', 'summer', 'autumn', 'winter'].map(season => {
      const months = { spring: 3, summer: 6, autumn: 9, winter: 0 }, sorten = HK.frischSorten(months[season], site);
      return `<li><b>${HK.t('frischSaison_' + season)}:</b> ${sorten.length ? sorten.map(HK.frischName).join(', ') : '—'}</li>`;
    }).join('')}</ul>`;
  },
  panel_frischBetrieb(id) {
    const st = HK.state, b = HK.RURAL_BUILDINGS[id], s = st.rural.sites[id], d = HK.RURAL_SITES[id], section = this.ruralSection(id);
    let h = this.head(HK.name(b), '', 'frischHelp');
    h += `<nav class="btn-row location-actions" aria-label="${HK.t('actionLocation')}"><button class="small work-back" data-action="ruralopen" data-section="${section}">← ${HK.t(section + 'Sub')}</button><button class="small map-action" data-action="ruralshow" data-site="${id}" title="${HK.t('ruralShowMap')}" aria-label="${HK.t('ruralShowMap')}">${HK.MenuArt.symbol('map')}<span>${HK.t('actionMap')}</span></button></nav>`;
    h += `<section class="frisch-hof" data-frisch-site="${id}">${this.helpHeading('frischHeute', 'frischHelp')}<span class="tag">${HK.t(s.owner ? 'ruralOwned' : 'ruralLocal')}</span>`;
    h += this.frischHofListe(id);
    if (!(st.stalls > 0)) h += `<p class="hint">${HK.t('frischOhneStand')}</p>`;
    h += `<button class="small" data-action="tradepage" data-panel="marketStalls">${HK.t('frischZumStand')} →</button></section>`;
    h += `<section class="rural-ownership">${this.helpHeading(s.owner ? 'ruralManage' : 'ruralBusinessBuy', 'ruralOwnershipHelp')}<p class="hint">${HK.t('frischBetriebInfo')}</p>`;
    h += `<p>${HK.t('frischTagesertrag', { qty: d.baskets })} · ${HK.t(s.owner ? 'ruralWages' : 'ruralOwnerWages', { cost: d.wage })}</p>${this.frischJahreslauf(id)}<p class="hint">${HK.t('frischNaturalHinweis')}</p>`;
    if (s.owner) h += `<button class="small" data-action="ruralpause" data-site="${id}">${HK.t(s.active ? 'ruralPause' : 'ruralResume')}</button>`;
    else h += `<button class="small" data-action="ruralbuy" data-site="${id}" ${st.money < d.cost ? 'disabled' : ''}>${HK.t('ruralBuy', { cost: HK.fmt(d.cost) })}</button>`;
    return h + '</section>';
  },
  frischStandSection() {
    const st = HK.state, F = st.frisch || { stand: {}, koerbe: {}, hof: {}, tag: {} };
    let h = `<section class="frisch-stand" data-frisch-stand>${this.helpHeading('frischTitel', 'frischHelp')}`;
    if (!(st.stalls > 0)) h += `<p class="hint">${HK.t('frischOhneStand')}</p>`;
    else {
      const stand = Object.keys(F.stand).filter(s => F.stand[s] >= 1), fest = HK.seasonEvent(st);
      h += `<h3>${HK.t('frischStand')}</h3>`;
      h += stand.length ? `<ul class="frisch-auf-stand">${stand.map(s => `<li data-frisch-stand-sorte="${s}">${HK.frischName(s)}: <b>${frischKoerbe(Math.floor(F.stand[s]))}</b> · <small>${HK.t('frischNachfrageHeute', { qty: frischKoerbe(HK.frischNachfrage(st, s)), price: HK.fmt(HK.frischVerkaufspreis(st, s)) })}</small></li>`).join('')}</ul>` : `<p class="hint">${HK.t('frischStandLeer')}</p>`;
      h += `<p><small>${HK.t('frischStandPlatz', { qty: frischKoerbe(HK.frischStandPlatz(st)) })} · ${HK.t('frischFaktoren', { wetter: HK.frischWetterFaktor(st).toFixed(1), stimmung: HK.frischStimmung(st).toFixed(2), fest: fest && HK.FRISCH_FESTE[fest.id] ? HK.t('frischFestHinweis', { fest: HK.t('season_' + fest.id) }) : '' })}</small></p>`;
      h += `<p class="hint">${HK.t(HK.frischSpital(st) ? 'frischResteSpital' : 'frischResteVerdorben')}</p>`;
    }
    const T = F.tag; if (T && T.day >= 0) {
      const rest = T.spital ? HK.t('frischGesternRest_spital', { qty: frischKoerbe(T.spital) }) : T.verdorben ? HK.t('frischGesternRest_verdorben', { qty: frischKoerbe(T.verdorben) }) : HK.t('frischGesternRest_none');
      h += `<p class="frisch-gestern">${HK.t('frischGestern', { date: HK.fmtDate(T.day), verkauft: frischKoerbe(T.verkauft), erloes: HK.fmt(T.erloes), rest })}</p>`;
    }
    h += `<h3>${HK.t('frischBetriebe')}</h3>`;
    for (const site of HK.FRISCH_SITES) h += `<div class="frisch-betrieb"><button class="small" data-action="ruralopen" data-site="${site}">${HK.name(HK.RURAL_BUILDINGS[site])} →</button>${this.frischHofListe(site)}</div>`;
    h += `<h3>${HK.t('frischNaturalienTitel')}</h3>`;
    const k = Object.keys(F.koerbe).filter(s => F.koerbe[s] >= 1);
    if (!k.length) h += `<p class="hint">${HK.t('frischNaturalienLeer')}</p>`;
    else {
      h += `<p>${HK.t('frischNaturalienText', { qty: HK.frischAnzahl(F.koerbe), max: HK.CONST.FRISCH_VORRAT })}</p>`;
      for (const s of k) h += `<article class="rural-stock-row frisch-row" data-frisch-korb="${s}">${HK.MenuArt.fresh(s)}<div><b>${HK.frischName(s)}</b><small>${frischKoerbe(Math.floor(F.koerbe[s]))}</small>${st.stalls > 0 ? `<button class="small" data-action="korbstand" data-sorte="${s}" ${HK.frischStandPlatz(st) >= 1 ? '' : 'disabled'}>${HK.t('frischAufStandEinzeln')}</button>` : ''}</div></article>`;
    }
    return h + '</section>';
  },
  korbGeschenk(pid) {
    const st = HK.state, k = st.frisch?.koerbe || {}, sorten = Object.keys(k).filter(s => k[s] >= 1);
    if (!sorten.length || st.gameOver || !st.persons?.[pid]) return '';
    const wahl = sorten.includes(this.inputs?.korbSorte) ? this.inputs.korbSorte : sorten[0];
    return `<span class="korb-gift"><select data-field="korbSorte" data-korb-sorte="${pid}" aria-label="${HK.t('korbSchenkenSorte')}">${sorten.map(s => `<option value="${s}" ${s === wahl ? 'selected' : ''}>${HK.frischName(s)} (${Math.floor(k[s])})</option>`).join('')}</select><button class="small" data-action="korbschenken" data-person="${pid}">${HK.t('korbSchenken')}</button></span>`;
  },
});
{
  const rural = HK.UI.panel_rural;
  HK.UI.panel_rural = function () {
    const b = this.selBuilding(), id = b && HK.RURAL_SITES[b.id]?.fresh ? b.id : null;
    return id ? this.panel_frischBetrieb(id) : rural.call(this);
  };
  const stalls = HK.UI.panel_marketStalls;
  HK.UI.panel_marketStalls = function () { return stalls.call(this) + this.frischStandSection(); };
  const row = HK.UI.personRow;
  HK.UI.personRow = function (pid, extra) { return row.call(this, pid, this.korbGeschenk(pid) + (extra || '')); };
  const action = HK.UI.action;
  HK.UI.action = function (d) {
    const st = HK.state; let r;
    if (d.action === 'frischkaufen') r = HK.frischKaufen(st, d.site, d.sorte, parseInt(d.qty, 10) || 1);
    else if (d.action === 'korbstand') r = HK.korbAufStand(st, d.sorte);
    else if (d.action === 'korbschenken') {
      const sorte = this.sidebar?.querySelector(`[data-korb-sorte="${d.person}"]`)?.value || this.inputs?.korbSorte || d.sorte || Object.keys(st.frisch?.koerbe || {})[0];
      r = HK.korbSchenken(st, d.person, sorte);
      if (r.ok) this.toast?.(HK.t('korbGeschenktToast', { sorte: HK.frischName(sorte), name: HK.personName(st, d.person), gain: r.gain }), 'good', 2200);
    } else return action.call(this, d);
    this.result(r); HK.scheduleSave?.(); this.renderAll();
  };
}
