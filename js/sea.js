/* Seefahrt: Kapitäne mit Eigenschaften, Fernkontore in anderen Hansestädten. Schiffstypen und Konvois stecken in game.js. */
'use strict';

HK.CAPTAIN_NAMES2 = ['Hinrich Vos', 'Jorgen Lund', 'Piet van Dyck', 'Arnd Sasse', 'Olaf Sjöberg', 'Wilkin Stade', 'Reyner Bock', 'Gerd Molenaar', 'Henning Kalsow', 'Magnus Ravn', 'Thomas Ashby', 'Claes Wittenborg', 'Detlef Brügge', 'Sven Halvorsen'];
HK.newGameHooks.push(st => { st.captainOffers = []; st.captainRefresh = 0; st.kontors = {}; });
HK.migrateHooks.push(st => { if (!st.captainOffers) { st.captainOffers = []; st.captainRefresh = 0; } if (!st.kontors) st.kontors = {}; for (const s of st.ownShips) { if (!s.type) { s.type = 'kogge'; s.cap = 120; } if (s.captain === undefined) s.captain = null; } });
HK.refreshCaptains = function (st) {
  st.captainOffers = []; const used = st.ownShips.map(s => s.captain && s.captain.name);
  for (let i = 0; i < 3; i++) { const t = HK.pick(HK.CAPTAIN_TRAITS); let name; do { name = HK.pick(HK.CAPTAIN_NAMES2); } while (used.includes(name) || st.captainOffers.some(c => c.name === name)); st.captainOffers.push({ id: st.nextId++, name, trait: t.id, wage: t.wage, fee: 200 + t.wage * 40 }); }
  st.captainRefresh = st.day + 15;
};
HK.hireCaptain = function (st, shipId, offerId) {
  const s = st.ownShips.find(x => x.id === shipId), o = st.captainOffers.find(x => x.id === offerId);
  if (!s || !o || s.status !== 'port') return { ok: false };
  if (st.money < o.fee) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'wages', -o.fee); s.captain = { name: o.name, trait: o.trait, wage: o.wage }; st.captainOffers = st.captainOffers.filter(x => x !== o);
  HK.log(st, 'captainHired', { captain: o.name, ship: s.name }, 'info');
  return { ok: true };
};
HK.dismissCaptain = function (st, shipId) { const s = st.ownShips.find(x => x.id === shipId); if (!s || !s.captain || s.status !== 'port') return { ok: false }; s.captain = null; return { ok: true }; };
HK.buyKontor = function (st, city) {
  if (!HK.KONTOR_CITIES.includes(city) || st.kontors[city]) return { ok: false };
  if (st.rank < 2) return { ok: false, msg: 'needRankMerchant' };
  if (st.money < HK.CONST.KONTOR_PRICE) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'investments', -HK.CONST.KONTOR_PRICE); st.kontors[city] = { since: st.day }; st.rep = HK.clamp(st.rep + 4, 0, 100); HK.fac(st, 'kaufleute', 6);
  HK.log(st, 'kontorFounded', { city: HK.name(HK.ORIGIN[city]) }, 'good');
  return { ok: true };
};
HK.kontorIncome = st => Math.round(45 * (0.6 + st.town.prosperity / 125)) - HK.CONST.KONTOR_UPKEEP;
HK.tickHooks.push(st => {
  if (st.day >= st.captainRefresh) HK.refreshCaptains(st);
  let inc = 0; for (const c in st.kontors) { inc += HK.kontorIncome(st); for (const i of st.incoming) if (i.origin === c) i.known = true; }
  if (inc) HK.book(st, 'kontor', inc);
});
