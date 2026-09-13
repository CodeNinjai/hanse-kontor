/* Ratsämter: Als Bürgermeister besetzt der Spieler Zöllner, Hafenmeister, Vogt und Waagemeister neu –
   mit eigenen Leuten (treu, aber Ämterschacher) oder mit Kandidaten eines Rivalen (Bündnis, aber fremde Loyalität). */
'use strict';

HK.OFFICES = ['customs', 'harbourmaster', 'bailiff', 'weighmaster'];
HK.OFFICE_NAMES = ['Hinrich Kröpelin', 'Gerd Wackerbarth', 'Ludolf Vinke', 'Tideke Sparenberg', 'Marquard Bonhorst', 'Jakob Rapesulver', 'Eler Hoveman', 'Nikolaus Mildehovet', 'Bertram Wesseler', 'Detmar Pleskow', 'Cord Ratlow', 'Henning Brekewolt'];
HK.CONST.OFFICE_COST = 2500; HK.CONST.OFFICE_INFLUENCE = 15; HK.CONST.OFFICE_TERM = 365;

HK.personName = (st, pid) => (st && st.persons[pid] && st.persons[pid].name) || HK.PERSON[pid].name;
HK.officeHolder = (st, pid) => (st.persons[pid] && st.persons[pid].holder) || 'default';
HK.canAppoint = (st, pid) => st.seat === 'mayor' && HK.OFFICES.includes(pid) && !(st.persons[pid].appointed !== undefined && st.day - st.persons[pid].appointed < HK.CONST.OFFICE_TERM);

/* who: 'own' oder Rivalen-Id */
HK.appointOffice = function (st, pid, who) {
  if (st.seat !== 'mayor') return { ok: false, msg: 'needMayor' };
  if (!HK.OFFICES.includes(pid)) return { ok: false };
  const p = st.persons[pid];
  if (!HK.canAppoint(st, pid)) return { ok: false, msg: 'officeRecent' };
  if (st.influence < HK.CONST.OFFICE_INFLUENCE) return { ok: false, msg: 'needInfluenceOffice' };
  const used = HK.OFFICES.map(o => st.persons[o].name).filter(Boolean);
  const name = HK.pick(HK.OFFICE_NAMES.filter(n => !used.includes(n)));
  if (who === 'own') {
    if (st.money < HK.CONST.OFFICE_COST) return { ok: false, msg: 'notEnoughMoney' };
    HK.book(st, 'politics', -HK.CONST.OFFICE_COST);
    p.name = name; p.holder = 'own'; p.loyalty = 85;
    st.suspicion = HK.clamp(st.suspicion + 6, 0, 100); HK.fac(st, 'patrizier', -4); HK.fac(st, 'kaufleute', -2);
  } else {
    const r = st.rivals.find(x => x.id === who); if (!r) return { ok: false };
    if (r.attitude < 0) return { ok: false, msg: 'rivalWontDeal' };
    p.name = name; p.holder = r.id; p.loyalty = 50;
    r.attitude = HK.clamp(r.attitude + 30, -100, 100); if (r.attitude >= 45) r.ally = true;
    HK.fac(st, HK.RIVAL_DEF[r.id].faction, 4);
  }
  p.appointed = st.day; st.influence -= HK.CONST.OFFICE_INFLUENCE;
  HK.log(st, 'officeAppointed', { office: HK.PERSON[pid].title[HK.LANG] || HK.PERSON[pid].title.de, name, by: who === 'own' ? HK.t('officeOwnMan') : HK.rivalName(who) }, 'good');
  return { ok: true };
};
/* Nach Amtsverlust setzt der neue Rat eigene Leute ein */
HK.resetOffices = function (st) {
  let any = false;
  for (const pid of HK.OFFICES) { const p = st.persons[pid]; if (p.holder && p.holder !== 'default') { p.holder = 'default'; delete p.name; p.loyalty = HK.clamp(p.loyalty - 25, 0, 100); delete p.appointed; any = true; } }
  if (any) HK.log(st, 'officesLost', {}, 'bad');
};
HK.tickHooks.push(st => {
  for (const pid of HK.OFFICES) {
    const p = st.persons[pid]; if (!p || !p.holder || p.holder === 'default') continue;
    if (p.holder === 'own') { if (p.loyalty < 70) p.loyalty = Math.min(70, p.loyalty + 0.3); }
    else { const r = st.rivals.find(x => x.id === p.holder); if (r && r.attitude < -30) p.loyalty = HK.clamp(p.loyalty - 0.2, 0, 100); else if (p.loyalty < 50) p.loyalty = Math.min(50, p.loyalty + 0.2); }
  }
  if (st.seat !== 'mayor' && HK.OFFICES.some(o => st.persons[o].holder && st.persons[o].holder !== 'default') && st.day % 30 === 0) HK.resetOffices(st);
});
