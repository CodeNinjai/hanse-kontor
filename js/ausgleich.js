/* Ausgleich zwischen den Wegen (siehe docs/KONZEPT.md, Abschnitt 7.1 „Noch offen im Balancing“).
   1. Schmuggel im großen Stil spricht sich herum: die ehrbaren Kaufleute boykottieren den Schmuggler
      am Markt. Das trifft den Weg der Nacht dort, wo er sein frühes Geld verdient.
   2. Der Handelsweg bekommt einen planbaren Weg zum Monopol: der Rat verpachtet es gegen Geld und
      Einfluss, wenn die Patrizier hinter dem Kaufmann stehen — statt einer Abstimmung, die die
      Rivalen im Rat fast immer kippen.
   3. Geschenke an Ratsherren werden mit dem Vermögen teurer, auch über die bisherige Grenze hinaus. */
'use strict';

/* ---------- 1. Boykott ---------- */
Object.assign(HK.CONST, { BOYKOTT_SCHWELLE: 1500, BOYKOTT_TAGE: 30, BOYKOTT_FAKTOR: 0.85 });
HK.boykott = st => st.boykottUntil > st.day;
HK.tickHooks.push(st => {
  if (HK.boykott(st) || !st.stats) return;
  const r = st.stats.smuggledRecent || 0; if (r <= HK.CONST.BOYKOTT_SCHWELLE) return;
  // je mehr hinterzogen wurde, desto eher redet jemand
  if (Math.random() < Math.min(0.06, 0.012 * r / HK.CONST.BOYKOTT_SCHWELLE)) {
    st.boykottUntil = st.day + HK.CONST.BOYKOTT_TAGE;
    HK.fac(st, 'kaufleute', -5); st.rep = HK.clamp(st.rep - 3, 0, 100);
    for (const rv of st.rivals) if (rv.attitude !== undefined) rv.attitude = HK.clamp(rv.attitude - 4, -100, 100);
    HK.log(st, 'boykottBeginnt', { tage: HK.CONST.BOYKOTT_TAGE }, 'bad');
  }
});
{
  const alt = HK.marketSellPrice;
  HK.marketSellPrice = (st, g, q) => HK.boykott(st) ? Math.max(1, Math.round(alt(st, g, q) * HK.CONST.BOYKOTT_FAKTOR)) : alt(st, g, q);
}

/* ---------- 2. Monopolpacht ---------- */
Object.assign(HK.CONST, { PACHT_PREIS: 15000, PACHT_EINFLUSS: 30, PACHT_TAGE: 730, PACHT_PATRIZIER: 55, PACHT_SPEICHER: 2 });
HK.monopolPachtGruende = function (st) {
  const C = HK.CONST, g = [];
  if (HK.law(st, 'monopoly') !== 'none') g.push('pachtVergeben');
  if (st.seat === 'none') g.push('pachtOhneSitz');
  if ((st.factions ? st.factions.patrizier : 0) < C.PACHT_PATRIZIER) g.push('pachtPatrizier');
  if (st.storages.filter(s => s.owner === 'player').length < C.PACHT_SPEICHER) g.push('pachtSpeicher');
  if (st.influence < C.PACHT_EINFLUSS) g.push('pachtEinfluss');
  if (st.money < C.PACHT_PREIS) g.push('notEnoughMoney');
  return g;
};
HK.pachteMonopol = function (st, good) {
  if (!HK.LAWS.monopoly.options.includes(good) || good === 'none') return { ok: false };
  const g = HK.monopolPachtGruende(st); if (g.length) return { ok: false, msg: g[0] };
  HK.book(st, 'politics', -HK.CONST.PACHT_PREIS); st.influence -= HK.CONST.PACHT_EINFLUSS;
  st.town.laws.monopoly = good; st.town.monopolyHolder = 'player'; st.monopolPacht = st.day + HK.CONST.PACHT_TAGE;
  HK.fac(st, 'kaufleute', -8); HK.fac(st, 'zuenfte', -4); HK.fac(st, 'patrizier', 2);
  HK.log(st, 'pachtErteilt', { good: HK.goodName(good), datum: HK.fmtDate(st.monopolPacht) }, 'good');
  return { ok: true };
};
HK.tickHooks.push(st => {
  if (!st.monopolPacht || st.day < st.monopolPacht) return;
  st.monopolPacht = 0;
  if (st.town.monopolyHolder === 'player') { st.town.laws.monopoly = 'none'; st.town.monopolyHolder = null; HK.log(st, 'pachtAbgelaufen', {}, 'info'); }
});

/* ---------- 3. Geschenke ---------- */
{
  const alt = HK.giftCost;
  // Über 900.000 Mark Vermögen steigt der Preis weiter: je 600.000 Mark um einen Grundpreis
  HK.giftCost = (st, pid) => Math.round(alt(st, pid) * (1 + Math.max(0, HK.netWorth(st) - 900000) / 600000 / 4));
}

Object.assign(HK.I18N.de, {
  boykottBeginnt: 'Dein Schmuggel hat sich herumgesprochen. Die ehrbaren Kaufleute boykottieren dich: {tage} Tage lang zahlt der Markt dir weniger.',
  boykottAktiv: 'Boykott der Kaufleute: Der Markt zahlt dir noch {tage} Tage 15 % weniger.',
  pachtTitel: 'Monopolpacht', pachtText: 'Statt einer Abstimmung verpachtet der Rat das Handelsmonopol für zwei Jahre — an einen Ratsherrn mit Rückhalt bei den Patriziern und mindestens zwei eigenen Speichern. Preis: {preis} Mark und {einfluss} Einfluss.',
  pachtButton: 'Monopol auf {good} pachten', pachtLaeuft: 'Deine Monopolpacht läuft bis {datum}.',
  pachtErteilt: 'Der Rat verpachtet dir das Monopol auf {good} bis {datum}.', pachtAbgelaufen: 'Deine Monopolpacht ist abgelaufen; das Monopol fällt an den Rat zurück.',
  pachtVergeben: 'Das Monopol ist bereits vergeben.', pachtOhneSitz: 'Nur ein Ratsherr kann das Monopol pachten.', pachtPatrizier: 'Die Patrizier stehen nicht genug hinter dir (mindestens 55).', pachtSpeicher: 'Du brauchst mindestens zwei eigene Speicher.', pachtEinfluss: 'Dir fehlt Einfluss (30 nötig).',
});
Object.assign(HK.I18N.en, {
  boykottBeginnt: 'Word of your smuggling has spread. The honest merchants boycott you: for {tage} days the market pays you less.',
  boykottAktiv: "Merchants' boycott: the market pays you 15 % less for {tage} more days.",
  pachtTitel: 'Monopoly lease', pachtText: 'Instead of a vote, the council leases the trade monopoly for two years — to a councillor backed by the patricians and owning at least two warehouses. Price: {preis} marks and {einfluss} influence.',
  pachtButton: 'Lease the {good} monopoly', pachtLaeuft: 'Your monopoly lease runs until {datum}.',
  pachtErteilt: 'The council leases you the {good} monopoly until {datum}.', pachtAbgelaufen: 'Your monopoly lease has expired; the monopoly reverts to the council.',
  pachtVergeben: 'The monopoly is already held.', pachtOhneSitz: 'Only a councillor can lease the monopoly.', pachtPatrizier: 'The patricians do not back you enough (at least 55).', pachtSpeicher: 'You need at least two warehouses of your own.', pachtEinfluss: 'You lack influence (30 needed).',
});
