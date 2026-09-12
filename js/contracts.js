/* Aufträge und Verträge: Rat, Gilde, Kloster, Spelunke und Hafenmeister hängen befristete Aufträge aus.
   Lieferaufträge zahlen einen Aufschlag auf den Grundpreis und Ansehen; Fahrtaufträge belohnen eine Kogge auf einer bestimmten Route. */
'use strict';

HK.CONTRACT_GIVERS = {
  council:       { faction: 'patrizier', goods: ['grain', 'salt', 'timber', 'fish'], premium: [1.25, 1.45], panel: 'townhall' },
  guild:         { faction: 'kaufleute', goods: ['cloth', 'iron', 'wool', 'tools'], premium: [1.2, 1.4], panel: 'guild' },
  abbey:         { faction: 'kirche',    goods: ['wax', 'wine', 'beer', 'smokedfish'], premium: [1.3, 1.5], panel: 'monastery' },
  dive:          { faction: 'zuenfte',   goods: ['spices', 'furs', 'wine', 'cloth'], premium: [1.7, 2.0], panel: 'dive', shady: true },
  harbourmaster: { faction: 'kaufleute', voyage: true, panel: 'harbourmaster' },
};
HK.newGameHooks.push(st => { st.contracts = { offers: [], active: [], nextRefresh: 2, done: 0, failed: 0, nextId: 1 }; });
HK.migrateHooks.push(st => { if (!st.contracts) st.contracts = { offers: [], active: [], nextRefresh: st.day + 1, done: 0, failed: 0, nextId: 1 }; });

HK.makeContract = function (st, giverId) {
  const g = HK.CONTRACT_GIVERS[giverId], c = { id: st.contracts.nextId++, giver: giverId, offered: st.day, expires: st.day + 12 };
  if (g.voyage) { const o = HK.pick(HK.ORIGINS.filter(x => x.sea)); c.type = 'voyage'; c.dest = o.id; c.days = o.days * 2 + 14; c.reward = Math.round((2500 + o.days * 400) * (0.8 + st.town.prosperity / 200)); }
  else { const good = HK.pick(g.goods), base = HK.GOOD[good].base; c.type = 'deliver'; c.good = good; c.qty = HK.rndi(3, 8) * 5; c.price = Math.round(base * HK.rnd(g.premium[0], g.premium[1])); c.reward = c.qty * c.price; c.days = HK.rndi(20, 45); if (g.shady) c.shady = true; }
  return c;
};
HK.refreshContracts = function (st) {
  const C = st.contracts; C.offers = C.offers.filter(c => c.expires > st.day);
  const givers = Object.keys(HK.CONTRACT_GIVERS).filter(id => !C.offers.some(c => c.giver === id) && !C.active.some(c => c.giver === id));
  while (C.offers.length < 3 && givers.length) { const id = givers.splice(Math.floor(Math.random() * givers.length), 1)[0]; if (id === 'harbourmaster' && !st.ownShips.length) continue; C.offers.push(HK.makeContract(st, id)); }
  C.nextRefresh = st.day + 12;
};
HK.acceptContract = function (st, id) {
  const C = st.contracts, c = C.offers.find(x => x.id === id); if (!c) return { ok: false };
  if (C.active.length >= 3) return { ok: false, msg: 'tooManyContracts' };
  C.offers = C.offers.filter(x => x !== c); c.accepted = st.day; c.deadline = st.day + c.days; C.active.push(c);
  HK.log(st, 'contractAccepted', { giver: HK.t('giver_' + c.giver) }, 'info');
  return { ok: true };
};
HK.deliverContract = function (st, id) {
  const C = st.contracts, c = C.active.find(x => x.id === id); if (!c || c.type !== 'deliver') return { ok: false };
  if ((st.warehouse.stock[c.good] || 0) < c.qty) return { ok: false, msg: 'notEnoughCargo' };
  HK.addStock(st.warehouse.stock, c.good, -c.qty); HK.completeContract(st, c);
  return { ok: true, cost: c.reward };
};
HK.completeContract = function (st, c) {
  const C = st.contracts, g = HK.CONTRACT_GIVERS[c.giver];
  C.active = C.active.filter(x => x !== c); C.done++;
  HK.book(st, c.shady ? 'shipTrade' : 'contracts', c.reward); st.stats.volume += c.reward;
  if (c.shady) { st.suspicion = HK.clamp(st.suspicion + 6, 0, 100); HK.fac(st, 'kirche', -2); HK.fac(st, 'zuenfte', 2); if (Math.random() < 0.15) { const fine = Math.round(c.reward * 0.5); HK.book(st, 'fines', -fine); st.suspicion = HK.clamp(st.suspicion + 10, 0, 100); HK.log(st, 'contractCaught', { fine: HK.fmt(fine) }, 'bad'); } }
  else { HK.fac(st, g.faction, 4); st.rep = HK.clamp(st.rep + 1.5, 0, 100); if (c.giver === 'council') st.influence += 3; if (c.giver === 'abbey') st.piety = HK.clamp(st.piety + 3, 0, 100); }
  HK.log(st, 'contractDone', { giver: HK.t('giver_' + c.giver), reward: HK.fmt(c.reward) }, 'good');
};
HK.failContract = function (st, c) {
  const C = st.contracts, g = HK.CONTRACT_GIVERS[c.giver];
  C.active = C.active.filter(x => x !== c); C.failed++;
  const pen = Math.round(c.reward * 0.15); HK.book(st, 'fines', -pen); HK.fac(st, g.faction, -5); st.rep = HK.clamp(st.rep - 2, 0, 100);
  HK.log(st, 'contractFailed', { giver: HK.t('giver_' + c.giver), penalty: HK.fmt(pen) }, 'bad');
};
HK.contractsFor = (st, panel) => { const ids = Object.keys(HK.CONTRACT_GIVERS).filter(g => HK.CONTRACT_GIVERS[g].panel === panel); return { offers: st.contracts.offers.filter(c => ids.includes(c.giver)), active: st.contracts.active.filter(c => ids.includes(c.giver)) }; };

/* Fahrtauftrag: erstes Schiff, das nach Annahme zum Ziel fährt, zählt; Erfüllung bei Rückkehr */
HK.wrapAction('sendShip', (st, r, id, dest) => { for (const c of st.contracts.active) if (c.type === 'voyage' && c.dest === dest && !c.shipId) { c.shipId = id; break; } });
HK.tickHooks.push(st => {
  const C = st.contracts; if (!C) return;
  if (st.day >= C.nextRefresh) HK.refreshContracts(st);
  for (const c of C.active.slice()) {
    if (c.type === 'voyage' && c.shipId) { const s = st.ownShips.find(x => x.id === c.shipId); if (!s) { c.shipId = null; } else if (s.status === 'port' && s.dest === null) { HK.completeContract(st, c); continue; } }
    if (st.day > c.deadline) HK.failContract(st, c);
  }
});
