/* Verträge und Geschäfte jenseits des Tageshandels: Handelsverträge mit Hansestädten, Wechselbriefe beim Geldwechsler,
   der Kaperbrief des Rats mit eigenen Kaperfahrten, das Netzwerk der Unterwelt und die Wirkung der neuen Gesetze. */
'use strict';

Object.assign(HK.CONST, { TREATY_COST: 3000, TREATY_DAYS: 365, MARQUE_COST: 2000, MARQUE_DAYS: 365, PRIVATEER_DAYS: 14, BILL_MIN: 500, BILL_MAX: 20000 });
HK.BILLS = { safe: { days: 90, rate: 0.06, risk: 0 }, luebeck: { days: 60, rate: 0.14, risk: 0.12 } };
HK.NETWORK_POSTS = { customs: 250, watch: 200, bailiff: 400, councillor: 500 };

HK.newGameHooks.push(st => { st.treaties = {}; st.bills = []; st.marque = null; st.network = {}; st.networkDay = 0; st.landClosedUntil = 0; });
HK.migrateHooks.push(st => { if (!st.treaties) st.treaties = {}; if (!st.bills) st.bills = []; if (st.marque === undefined) st.marque = null; if (!st.network) st.network = {}; if (st.networkDay === undefined) st.networkDay = 0; if (st.landClosedUntil === undefined) st.landClosedUntil = 0; });

/* ---------- Handelsverträge ---------- */
HK.hasTreaty = (st, city) => !!(st.treaties && st.treaties[city] && st.treaties[city].until > st.day);
HK.signTreaty = function (st, city) {
  const o = HK.ORIGIN[city]; if (!o || !o.sea) return { ok: false };
  if (HK.hasTreaty(st, city)) return { ok: false };
  if (st.rank < 1) return { ok: false, msg: 'needRankTrader' };
  if (st.money < HK.CONST.TREATY_COST) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'politics', -HK.CONST.TREATY_COST); st.treaties[city] = { until: st.day + HK.CONST.TREATY_DAYS };
  HK.fac(st, 'kaufleute', 3); st.influence += 2;
  HK.log(st, 'treatySigned', { city: HK.name(o) }, 'good');
  return { ok: true };
};

/* ---------- Wechselbriefe ---------- */
HK.buyBill = function (st, kind, amount) {
  const def = HK.BILLS[kind]; amount = Math.floor(amount);
  if (!def || amount < HK.CONST.BILL_MIN || amount > HK.CONST.BILL_MAX) return { ok: false, msg: 'billAmount' };
  if (st.money < amount) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'lending', -amount); st.bills.push({ id: st.nextId++, kind, amount, due: st.day + def.days });
  return { ok: true };
};

/* ---------- Kaperbrief und Kaperfahrt ---------- */
HK.hasMarque = st => !!(st.marque && st.marque.until > st.day);
HK.buyMarque = function (st) {
  if (HK.hasMarque(st)) return { ok: false };
  if (st.seat === 'none' && st.rep < 50) return { ok: false, msg: 'needRep50' };
  if (st.money < HK.CONST.MARQUE_COST) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'politics', -HK.CONST.MARQUE_COST); st.marque = { until: st.day + HK.CONST.MARQUE_DAYS };
  HK.fac(st, 'patrizier', 3); HK.fac(st, 'kaufleute', -2);
  HK.log(st, 'marqueBought', { days: HK.CONST.MARQUE_DAYS }, 'good');
  return { ok: true };
};
HK.privateer = function (st, id) {
  const s = st.ownShips.find(x => x.id === id);
  if (!s || s.status !== 'port') return { ok: false };
  if (!HK.hasMarque(st)) return { ok: false, msg: 'needMarque' };
  if (s.hull < 50) return { ok: false, msg: 'shipDamaged' };
  if (HK.stockUsed(s.cargo) > 0) return { ok: false, msg: 'unloadFirst' };
  s.status = 'away'; s.phase = 'privateer'; s.dest = 'luebeck'; s.daysLeft = HK.CONST.PRIVATEER_DAYS; s.bringBack = null;
  HK.log(st, 'privateerSent', { ship: s.name }, 'info');
  return { ok: true };
};

/* ---------- Netzwerk der Unterwelt ---------- */
HK.networkCost = st => Object.keys(st.network || {}).filter(k => st.network[k]).reduce((a, k) => a + HK.NETWORK_POSTS[k], 0);
HK.toggleNetwork = function (st, post) {
  if (!HK.NETWORK_POSTS[post]) return { ok: false };
  if (!HK.hasVenture(st, 'dive')) return { ok: false, msg: 'needDive' };
  if (st.network[post]) { st.network[post] = false; return { ok: true }; }
  const cost = HK.NETWORK_POSTS[post]; if (st.money < cost) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'bribes', -cost); st.stats.bribes += cost; st.network[post] = true; if (!HK.networkCost(st) || Object.keys(st.network).filter(k => st.network[k]).length === 1) st.networkDay = st.day;
  return { ok: true };
};
HK.networkActive = (st, post) => !!(st.network && st.network[post] && HK.hasVenture(st, 'dive'));
HK.exposeNetwork = function (st) {
  if (!Object.keys(st.network || {}).some(k => st.network[k])) return;
  st.network = {}; st.suspicion = HK.clamp(st.suspicion + 20, 0, 100); st.rep = HK.clamp(st.rep - 5, 0, 100); HK.fac(st, 'patrizier', -5); HK.fac(st, 'kaufleute', -3);
  HK.log(st, 'networkExposed', {}, 'bad');
};

/* ---------- Tagestick: Laufzeiten, Wechsel, Kaperfahrten, Netzwerk, Gesetze ---------- */
HK.tickHooks.push(st => {
  if (!st.treaties) return;
  for (const c in st.treaties) if (st.treaties[c].until === st.day) HK.log(st, 'treatyEnded', { city: HK.name(HK.ORIGIN[c]) }, 'info');
  if (st.marque && st.marque.until === st.day) HK.log(st, 'marqueEnded', {}, 'info');
  for (const b of st.bills.slice()) {
    if (b.due > st.day) continue;
    const def = HK.BILLS[b.kind]; st.bills = st.bills.filter(x => x !== b);
    if (Math.random() < def.risk) { const back = Math.round(b.amount * 0.5); HK.book(st, 'lending', back); HK.log(st, 'billLost', { amount: HK.fmt(b.amount), back: HK.fmt(back) }, 'bad'); }
    else { const back = Math.round(b.amount * (1 + def.rate)); HK.book(st, 'lending', back); HK.log(st, 'billPaid', { amount: HK.fmt(back) }, 'good'); }
  }
  for (const s of st.ownShips) {
    if (s.status !== 'away' || s.phase !== 'privateer') continue;
    if (--s.daysLeft > 0) continue;
    const p = 0.5 + (s.captain && s.captain.trait === 'fighter' ? 0.2 : 0) + (st.militia ? 0.05 : 0), r = Math.random();
    if (r < p) { const loot = HK.rndi(1500, 5000); HK.book(st, 'expedition', loot); s.hull = Math.max(5, s.hull - HK.rndi(5, 15)); st.rep = HK.clamp(st.rep + 3, 0, 100); HK.fac(st, 'patrizier', 2); HK.fac(st, 'kaufleute', -1); st.stats.expeditionRevenue = (st.stats.expeditionRevenue || 0) + loot; HK.log(st, 'pv_loot', { ship: s.name, loot: HK.fmt(loot) }, 'good'); }
    else if (r < p + 0.3) { s.hull = Math.max(5, s.hull - 5); HK.log(st, 'pv_nothing', { ship: s.name }, 'info'); }
    else { s.hull = Math.max(5, s.hull - 35); HK.log(st, 'pv_beaten', { ship: s.name }, 'bad'); }
    s.status = 'port'; s.phase = 'out'; s.dest = null; s.daysLeft = 0;
  }
  // Netzwerk: Monatsgeld, schleichender Verdacht
  const posts = Object.keys(st.network).filter(k => st.network[k]);
  if (posts.length) {
    if (!HK.hasVenture(st, 'dive')) st.network = {};
    else {
      st.suspicion = HK.clamp(st.suspicion + 0.02 * posts.length, 0, 100);
      if (st.day - st.networkDay >= 30) { st.networkDay = st.day; const cost = HK.networkCost(st); if (st.money >= cost) { HK.book(st, 'bribes', -cost); st.stats.bribes += cost; } else { st.network = {}; HK.log(st, 'networkLapsed', {}, 'bad'); } }
    }
  }
  // Gesetze: Zunftzwang enteignet Rivalen, Bettelordnung und Bierziese wirken auf Kirche und Patrizier
  if (HK.law(st, 'guildRule') && st.day % 30 === 0) {
    for (const r of st.rivals) { const ids = (r.holdings && r.holdings.ventures || []).filter(id => HK.VENTURE[id].craft); if (ids.length) { const id = ids[0]; delete st.ventures[id]; r.holdings.ventures = r.holdings.ventures.filter(x => x !== id); r.attitude = HK.clamp(r.attitude - 10, -100, 100); HK.log(st, 'guildRuleExpropriated', { rival: HK.rivalName(r.id), venture: HK.name(HK.VENTURE[id]) }, 'info'); break; } }
  }
  if (HK.law(st, 'beggarLaw')) { HK.fac(st, 'kirche', -0.02); HK.fac(st, 'patrizier', 0.01); }
  if (HK.law(st, 'beerTax') && st.taxFarm && st.taxFarm.until > st.day) HK.book(st, 'taxFarm', 12);
});
