/* Personal mit Eigenschaften, Eis im Winter und die letzten Züge der Unterwelt:
   Faktor (handelt am Markt), Meister mit Charakter, Falschgeld, Erpressung, Freikauf und die Lederkette der Gerberei. */
'use strict';

Object.assign(HK.CONST, { FACTOR_COST: 1500, FACTOR_WAGE: 6, COUNTERFEIT_MIN: 1000, COUNTERFEIT_MAX: 5000, PARDON_BASE: 8000, BLACKMAIL_COOLDOWN: 365, COUNTERFEIT_COOLDOWN: 30 });
HK.FACTOR_NAMES = ['Hans Vorrade', 'Brun Warendorp', 'Godeke Nyebur', 'Tile Kleinschmidt', 'Heyno Groning', 'Werner Hoop'];
HK.STAFF_TRAITS = ['able', 'greedy', 'faithful'];
HK.MASTER_TRAITS = ['able', 'drunk', 'faithful'];
HK.ICE_PORTS = ['bergen', 'stockholm', 'riga'];
HK.isWinter = st => [11, 0, 1].includes(HK.monthOf(st.day));

HK.newGameHooks.push(st => { st.factor = null; st.counterfeit = null; st.pardon = null; st.unrestUntil = 0; });
HK.migrateHooks.push(st => { if (st.factor === undefined) st.factor = null; if (st.counterfeit === undefined) st.counterfeit = null; if (st.pardon === undefined) st.pardon = null; if (st.unrestUntil === undefined) st.unrestUntil = 0; if (!st.town.stock.leather) st.town.stock.leather = 20; });

/* ---------- Faktor ---------- */
HK.hireFactor = function (st) {
  if (st.factor) return { ok: false };
  if (st.money < HK.CONST.FACTOR_COST) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'wages', -HK.CONST.FACTOR_COST);
  st.factor = { name: HK.pick(HK.FACTOR_NAMES), trait: HK.pick(HK.STAFF_TRAITS), since: st.day, sold: 0 };
  HK.log(st, 'factorHired', { name: st.factor.name, trait: HK.t('trait_' + st.factor.trait) }, 'info');
  return { ok: true };
};
HK.dismissFactor = function (st) { if (!st.factor) return { ok: false }; st.factor = null; return { ok: true }; };
/* Der Faktor verkauft knappe Ware am Markt, solange die Bürger gut zahlen */
HK.factorTrade = function (st) {
  const f = st.factor; if (!f) return;
  for (const g of HK.GOODS) {
    const have = Math.floor(st.warehouse.stock[g.id] || 0); if (have < 10) continue;
    if (HK.demandLabel(st, g.id) !== 'shortage') continue;
    const cap = Math.max(0, Math.floor(HK.marketCap(st, g.id) / 2)), q = Math.min(cap, Math.floor(have / 3)); if (q <= 0) continue;
    const r = HK.marketSell(st, g.id, q); if (!r.ok) continue;
    const adj = f.trait === 'able' ? Math.round(r.cost * 0.06) : f.trait === 'greedy' ? -Math.round(r.cost * 0.08) : 0;
    if (adj) HK.book(st, 'market', adj);
    f.sold += r.cost + adj;
  }
};

/* ---------- Meister mit Charakter ---------- */
{ const orig = HK.hireMaster; HK.hireMaster = function (st, id) { const r = orig(st, id); if (r.ok) st.ventures[id].masterTrait = HK.pick(HK.MASTER_TRAITS); return r; }; }
HK.masterFactor = function (st, id) {
  const o = st.ventures[id]; if (!o || !o.master) return 1;
  if (o.masterTrait === 'able') return 1.4;
  if (o.masterTrait === 'drunk' && (st.day * 7 + id.length) % 9 === 0) return 0.6;
  return 1.3;
};

/* ---------- Falschgeld ---------- */
HK.counterfeit = function (st, amount) {
  amount = Math.floor(amount);
  if (!HK.hasVenture(st, 'dive')) return { ok: false, msg: 'needDive' };
  if (st.counterfeit) return { ok: false, msg: 'counterfeitPending' };
  if (st.counterfeitDay !== undefined && st.day - st.counterfeitDay < HK.CONST.COUNTERFEIT_COOLDOWN) return { ok: false, msg: 'counterfeitRecent' };
  if (amount < HK.CONST.COUNTERFEIT_MIN || amount > HK.CONST.COUNTERFEIT_MAX) return { ok: false, msg: 'billAmount' };
  const cost = Math.round(amount * 0.6); if (st.money < cost) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'bribes', -cost); st.counterfeit = { amount, due: st.day + 10 };
  return { ok: true };
};

/* ---------- Erpressung ---------- */
HK.canBlackmail = (st, r) => st.spyUntil > st.day && !r.ally && !(r.blackmailed !== undefined && st.day - r.blackmailed < HK.CONST.BLACKMAIL_COOLDOWN);
HK.blackmail = function (st, rivalId) {
  const r = st.rivals.find(x => x.id === rivalId); if (!r) return { ok: false };
  if (st.spyUntil <= st.day) return { ok: false, msg: 'needSpy' };
  if (r.ally) return { ok: false, msg: 'rivalIsAlly' };
  if (!HK.canBlackmail(st, r)) return { ok: false, msg: 'blackmailRecent' };
  const gain = Math.round(HK.clamp(r.wealth * 0.02, 800, 4000));
  r.wealth -= gain; r.blackmailed = st.day; r.attitude = HK.clamp(r.attitude - 40, -100, 100);
  HK.book(st, 'blackmail', gain); st.suspicion = HK.clamp(st.suspicion + 12, 0, 100); st.stats.smuggled += gain * 0.2;
  if (Math.random() < 0.3 && !st.investigation) { st.investigation = { days: 10 }; HK.log(st, 'blackmailDenounced', { rival: HK.rivalName(r.id), amount: HK.fmt(gain) }, 'bad'); }
  else HK.log(st, 'blackmailDone', { rival: HK.rivalName(r.id), amount: HK.fmt(gain) }, 'info');
  return { ok: true };
};

/* ---------- Freikauf: aus dem Hehler wird ein ehrbarer Bürger ---------- */
HK.pardonCost = st => Math.round(HK.CONST.PARDON_BASE + Math.max(0, HK.netWorth(st)) * 0.03);
HK.buyPardon = function (st) {
  if (st.pardon) return { ok: false };
  if (st.rep < 50) return { ok: false, msg: 'needRep50' };
  if (HK.hasVenture(st, 'dive') || Object.keys(st.network || {}).some(k => st.network[k])) return { ok: false, msg: 'pardonNeedsCleanHands' };
  const cost = HK.pardonCost(st); if (st.money < cost) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'politics', -cost); st.pardon = { day: st.day }; st.suspicion = 0; st.stats.smuggledRecent = 0; st.investigation = null;
  HK.fac(st, 'kirche', 10); HK.fac(st, 'patrizier', 10); HK.fac(st, 'kaufleute', 5); st.rep = HK.clamp(st.rep + 5, 0, 100);
  HK.log(st, 'pardonBought', { cost: HK.fmt(cost) }, 'good');
  return { ok: true };
};

/* ---------- Tagestick ---------- */
HK.tickHooks.push(st => {
  if (st.factor === undefined) return;
  if (st.factor) { HK.book(st, 'wages', -HK.CONST.FACTOR_WAGE); HK.factorTrade(st); }
  if (st.counterfeit && st.day >= st.counterfeit.due) {
    const c = st.counterfeit; st.counterfeit = null; st.counterfeitDay = st.day;
    if (Math.random() < (HK.networkActive(st, 'councillor') ? 0.2 : 0.3)) { const fine = Math.round(c.amount * 1.5); HK.book(st, 'fines', -fine); st.suspicion = HK.clamp(st.suspicion + 25, 0, 100); st.rep = HK.clamp(st.rep - 10, 0, 100); HK.fac(st, 'kirche', -5); HK.fac(st, 'patrizier', -8); HK.fac(st, 'kaufleute', -6); HK.log(st, 'counterfeitCaught', { fine: HK.fmt(fine) }, 'bad'); }
    else { HK.book(st, 'counterfeit', c.amount); st.stats.smuggled += c.amount * 0.1; st.suspicion = HK.clamp(st.suspicion + 4, 0, 100); HK.log(st, 'counterfeitDone', { amount: HK.fmt(c.amount) }, 'info'); }
  }
  // Gerberei: Leder aus den Häuten der Stadt
  if (HK.hasVenture(st, 'tannery')) { const q = Math.min(2 * st.ventures.tannery.level, HK.whFree(st)); if (q > 0) HK.addStock(st.warehouse.stock, 'leather', q); }
});
