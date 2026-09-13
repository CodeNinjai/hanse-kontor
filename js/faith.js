/* Der Kirchenweg sichtbar gemacht: Bruderschaft (Mitglieder, Beiträge, Prozession), Wallfahrt (Pilger, Besucher, Gefahr)
   und Kirchenbau in Etappen (Seitenschiff, Turm), der auf der Karte wächst. */
'use strict';

HK.CONST.BROTHERHOOD_COST = 3000; HK.CONST.PILGRIMAGE_COST = 5000; HK.CONST.PROCESSION_DAY = 110; // Tag im Jahr (Mitte Juni)
HK.CHURCH_BUILDS = [
  { id: 'aisle', name: { de: 'Seitenschiff', en: 'Side aisle' }, cost: 12000, days: 120, piety: 10, rep: 8 },
  { id: 'tower', name: { de: 'Hoher Turm', en: 'High tower' }, cost: 20000, days: 200, piety: 15, rep: 12, needs: 'aisle' },
];
HK.CHURCH_BUILD = {}; HK.CHURCH_BUILDS.forEach(b => HK.CHURCH_BUILD[b.id] = b);

HK.newGameHooks.push(st => { st.brotherhood = null; st.pilgrimage = null; st.churchBuild = { active: null, done: {} }; st.processionDay = -99; });
HK.migrateHooks.push(st => { if (st.brotherhood === undefined) st.brotherhood = null; if (st.pilgrimage === undefined) st.pilgrimage = null; if (!st.churchBuild) st.churchBuild = { active: null, done: {} }; if (st.processionDay === undefined) st.processionDay = -99; });

HK.foundBrotherhood = function (st) {
  if (st.brotherhood) return { ok: false };
  if (st.piety < 50) return { ok: false, msg: 'pietyTooLow' };
  if (st.rep < 40) return { ok: false, msg: 'needRep' };
  if (st.money < HK.CONST.BROTHERHOOD_COST) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'church', -HK.CONST.BROTHERHOOD_COST);
  st.brotherhood = { since: st.day, members: 20, lastDues: st.day };
  HK.fac(st, 'kirche', 8); HK.fac(st, 'zuenfte', 4); HK.fac(st, 'patrizier', 2); st.influence += 5;
  HK.log(st, 'brotherhoodFoundedLog', {}, 'good');
  return { ok: true };
};
HK.brotherhoodDues = st => st.brotherhood ? Math.round(st.brotherhood.members * 2) : 0;
HK.callPilgrimage = function (st) {
  if (st.pilgrimage) return { ok: false };
  if (st.relicDay === undefined) return { ok: false, msg: 'needRelic' };
  if (!st.brotherhood) return { ok: false, msg: 'needBrotherhood' };
  if (!st.church.projects.chapel) return { ok: false, msg: 'needChapel' };
  if (st.money < HK.CONST.PILGRIMAGE_COST) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'church', -HK.CONST.PILGRIMAGE_COST);
  st.pilgrimage = { since: st.day }; st.piety = HK.clamp(st.piety + 10, 0, 100); st.rep = HK.clamp(st.rep + 5, 0, 100);
  HK.fac(st, 'kirche', 10); HK.fac(st, 'zuenfte', 4); HK.fac(st, 'kaufleute', 3);
  HK.log(st, 'pilgrimageCalled', {}, 'good');
  return { ok: true };
};
HK.startChurchBuild = function (st, id) {
  const b = HK.CHURCH_BUILD[id]; if (!b || st.churchBuild.done[id] || st.churchBuild.active) return { ok: false };
  if (b.needs && !st.churchBuild.done[b.needs]) return { ok: false, msg: 'needAisle' };
  if (st.money < b.cost) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'church', -b.cost);
  st.churchBuild.active = { id, start: st.day, until: st.day + b.days };
  HK.fac(st, 'kirche', 6); HK.fac(st, 'zuenfte', 3);
  HK.log(st, 'churchBuildStarted', { build: HK.name(b), days: b.days }, 'good');
  return { ok: true };
};
HK.churchBuildProgress = st => st.churchBuild.active ? HK.clamp((st.day - st.churchBuild.active.start) / (st.churchBuild.active.until - st.churchBuild.active.start), 0, 1) : 0;

HK.tickHooks.push(st => {
  if (!st.churchBuild) return;
  // Bruderschaft: Mitglieder, Beiträge, Prozession
  const B = st.brotherhood;
  if (B) {
    if (st.day - B.lastDues >= 30) {
      B.lastDues = st.day; B.members = Math.min(150, B.members + HK.rndi(1, 4) + (st.piety > 60 ? 1 : 0) + (st.pilgrimage ? 2 : 0));
      HK.book(st, 'brotherhood', HK.brotherhoodDues(st));
    }
    HK.facAll(st, 0.005);
    if (HK.dayOfYear(st) === HK.CONST.PROCESSION_DAY && !(st.interdictUntil > st.day)) { st.processionDay = st.day; st.piety = HK.clamp(st.piety + 3, 0, 100); st.rep = HK.clamp(st.rep + 2, 0, 100); HK.fac(st, 'kirche', 2); HK.log(st, 'processionLog', { members: B.members }, 'event'); }
  }
  // Wallfahrt: Bettler und Gedränge kosten ein wenig Ruf
  if (st.pilgrimage) st.rep = HK.clamp(st.rep - 0.01, 0, 100);
  // Kirchenbau
  const A = st.churchBuild.active;
  if (A && st.day >= A.until) {
    const b = HK.CHURCH_BUILD[A.id]; st.churchBuild.done[A.id] = true; st.churchBuild.active = null;
    st.piety = HK.clamp(st.piety + b.piety, 0, 100); st.rep = HK.clamp(st.rep + b.rep, 0, 100); st.influence += 8; HK.fac(st, 'kirche', 8); HK.facAll(st, 3);
    st.stats.donated = (st.stats.donated || 0) + 0; // Stiftung zählt bereits über die Buchung
    HK.log(st, 'churchBuildDone', { build: HK.name(b) }, 'good');
  }
});
