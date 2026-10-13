/* Oberfläche für Bannmühle, Müller und Erntevorkauf: Abschnitte in der Mühlen- und Hofansicht
   sowie die Mühlenpacht im Rathaus neben der Zollpacht. Reines Rendern ändert den Spielstand nicht. */
'use strict';
Object.assign(HK.UI, {
  muehleSection() {
    const st = HK.state, M = st.muehle, wer = HK.muehleEmpfaenger(st);
    let h = `<section class="muehle-section" data-muehle="${wer}">${this.helpHeading('muehleTitel', 'muehleHelp')}`;
    h += `<p>${HK.t('muehleEmpfaenger_' + wer, { datum: M.pacht ? HK.fmtDate(M.pacht.until) : '' })}</p>`;
    h += `<p><b>${HK.t('muehleMahlgeldHeute', { geld: HK.fmt(HK.mahlgeld(st)) })}</b> · <small>${HK.t('muehleMehlGuete', { quality: Math.round(HK.goodQuality(st, 'flour', true)) })}</small></p>`;
    if (wer === 'town') {
      h += `<p class="hint">${HK.t('muehlePachtHinweis')} ${HK.t('muehleKeinZugriff')}</p><button class="small" data-action="open" data-panel="customsLease">${HK.t('muehleZumRathaus')} →</button>`;
      return h + '</section>';
    }
    h += `<div class="muehle-mueller" data-muehle-strecken="${M.strecken ? 'on' : 'off'}"><h3>${HK.t('muehleMueller')}</h3><p><i>${HK.t('muehleMuellerText')}</i></p>`;
    if (M.gesperrtBis > st.day) h += `<p class="hint">${HK.t('muehleGesperrt', { datum: HK.fmtDate(M.gesperrtBis) })}</p>`;
    else {
      const basis = HK.mahlgeldBasis(st);
      if (M.strecken) h += `<p class="tag">${HK.t('muehleStreckenAktiv')}</p>`;
      h += `<p class="hint">${HK.t('muehleStreckenVergleich', { ehrlich: HK.fmt(basis), gestreckt: HK.fmt(basis * HK.CONST.MUEHLE_STRECKEN) })}</p><button class="small ${M.strecken ? 'primary' : ''}" data-action="muehlestrecken" data-value="${M.strecken ? 0 : 1}">${HK.t(M.strecken ? 'muehleStreckenAus' : 'muehleStreckenAn')}</button>`;
    }
    return h + '</div></section>';
  },
  muehlePachtSection() {
    const st = HK.state, preis = HK.muehlePachtPreis(st);
    let h = `<section class="muehle-pacht">${this.helpHeading('muehleTitel', 'muehleHelp')}<p class="hint">${HK.t('muehlePachtText', { geld: HK.fmt(HK.mahlgeldBasis(st)) })} ${HK.t('muehlePachtJahr', { jahr: HK.fmt(Math.round(HK.mahlgeldBasis(st)) * 365) })} ${HK.t('muehleKaufHinweis', { cost: HK.fmt(HK.RURAL_SITES.windmill.cost) })}</p>`;
    if (HK.muehleBesitz(st)) h += `<p class="tag gold">${HK.t('muehleEmpfaenger_owner')}</p>`;
    else if (HK.muehlePachtAktiv(st)) h += `<p class="tag gold">${HK.t('muehleEmpfaenger_lease', { datum: HK.fmtDate(st.muehle.pacht.until) })}</p>`;
    else h += `<button class="small" data-action="muehlepacht" ${st.money >= preis ? '' : 'disabled'}>${HK.t('muehlePachtButton', { cost: HK.fmt(preis) })}</button>`;
    return h + '</section>';
  },
  vorkaufSection(id) {
    const st = HK.state, a = HK.vorkaufAngebot(st, id); if (!a) return '';
    const v = st.vorkauf?.[a.jahr]?.[id];
    let h = `<section class="vorkauf-section" data-vorkauf="${id}">${this.helpHeading('vorkaufTitel', 'vorkaufHelp')}`;
    if (v) {
      h += `<p class="tag gold">${HK.t('vorkaufGekauft', { qty: v.qty, good: HK.goodName(v.good), price: HK.fmt(v.price) })}</p>`;
      if (v.done) {
        const unterwegs = st.rural.deliveries.some(d => d.vorkauf && d.site === id && d.status === 'waiting');
        h += `<p>${HK.t(unterwegs ? 'vorkaufUnterwegs' : 'vorkaufGeliefert', { qty: v.delivered })}</p>`;
      }
      return h + '</section>';
    }
    if (!HK.vorkaufFruehjahr(st)) return h + `<p class="hint">${HK.t('vorkaufNurFruehjahr')}</p></section>`;
    if (a.msg === 'vorkaufHungersnot') return h + `<p class="hint" data-vorkauf-famine>${HK.t('vorkaufHungersnot')}</p></section>`;
    h += `<div class="rural-stock-row">${HK.MenuArt.good(a.good)}<div><p><b>${HK.t('vorkaufAngebotText', { qty: a.qty, good: HK.goodName(a.good), price: HK.fmt(a.price), unit: HK.fmt(a.price / a.qty) })}</b></p>`;
    h += `<p><small>${HK.t('vorkaufMarkt', { market: HK.fmt(a.market), unit: HK.fmt(a.price / a.qty) })}</small></p><p class="hint">${HK.t('vorkaufRisiko')}</p>`;
    h += `${a.msg && a.msg !== 'notEnoughMoney' ? `<small class="decision-reason" id="vorkauf-reason-${id}">${HK.t(a.msg)}</small>` : ''}<button class="small primary" data-action="vorkauf" data-site="${id}" ${a.ok ? '' : `disabled`}>${HK.t('vorkaufButton', { price: HK.fmt(a.price) })}</button></div></div>`;
    return h + '</section>';
  },
});
{
  const rural = HK.UI.panel_rural;
  HK.UI.panel_rural = function () {
    let h = rural.call(this); const b = this.selBuilding(), id = b && HK.RURAL_SITES[b.id] ? b.id : null;
    if (id === 'windmill') h += this.muehleSection();
    else if (id && HK.RURAL_SITES[id].crops && !HK.state.rural.sites[id].owner) h += this.vorkaufSection(id);
    return h;
  };
  const customs = HK.UI.panel_customsLease;
  HK.UI.panel_customsLease = function () { return customs.call(this) + this.muehlePachtSection(); };
  const action = HK.UI.action;
  HK.UI.action = function (d) {
    let r;
    if (d.action === 'muehlepacht') r = HK.muehlePachten(HK.state);
    else if (d.action === 'muehlestrecken') r = HK.muehleStrecken(HK.state, d.value === '1');
    else if (d.action === 'vorkauf') r = HK.vorkaufen(HK.state, d.site);
    else return action.call(this, d);
    this.result(r); HK.scheduleSave?.(); this.renderAll();
  };
}
