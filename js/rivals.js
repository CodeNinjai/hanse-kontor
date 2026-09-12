/* Rivalen als handelnde Personen: jeder verfolgt einen Weg, kauft Häuser, Betriebe, Speicher und Schiffe,
   zieht in den Rat, stellt Anträge, sabotiert oder verbündet sich – je nach Haltung zum Spieler. */
'use strict';

HK.RIVAL_DEF = {
  kruse:   { path: 'merchant',  faction: 'kaufleute', color: '#556b2f', wants: ['storage', 'house', 'venture'], ventures: ['goldsmith', 'inn', 'cooper', 'dyer'], law: ['monopoly', 'marketFee'] },
  bracht:  { path: 'shipowner', faction: 'patrizier', color: '#8b4513', wants: ['ship', 'house', 'venture'], ventures: ['sailmaker', 'ropewalk', 'timberyard', 'smokery'], law: ['tariff', 'staple'] },
  detmers: { path: 'patron',    faction: 'kirche',    color: '#4b0082', wants: ['house', 'venture', 'donate'], ventures: ['bakery', 'apothecary', 'potter', 'butcher'], law: ['bathBan', 'usuryBan'] },
};
HK.rivalName = id => HK.RIVALS.find(x => x.id === id).name;
HK.attitudeLabel = a => a >= 60 ? 'att_allied' : a >= 25 ? 'att_friendly' : a > -25 ? 'att_neutral' : a > -60 ? 'att_cold' : 'att_hostile';
HK.rivalHoldingsText = (st, r) => ({ houses: r.holdings.houses.length, ventures: r.holdings.ventures.length, storages: r.holdings.storages.length, ships: r.ships });
HK.initRival = function (r) {
  if (r.attitude === undefined) r.attitude = HK.rndi(-10, 10);
  if (!r.holdings) r.holdings = { houses: [], ventures: [], storages: [] };
  if (r.ships === undefined) r.ships = 0; if (!r.seat) r.seat = 'none'; if (r.ally === undefined) r.ally = false;
  if (r.lastAct === undefined) r.lastAct = 0; if (r.lastMeet === undefined) r.lastMeet = -99; if (r.brotherhood === undefined) r.brotherhood = false;
};
HK.newGameHooks.push(st => st.rivals.forEach(HK.initRival));
HK.migrateHooks.push(st => st.rivals.forEach(HK.initRival));

/* ---------- Spieleraktionen ---------- */
HK.meetCost = (st, r) => Math.round(400 + r.wealth * 0.004);
HK.meetRival = function (st, id) {
  const r = st.rivals.find(x => x.id === id); if (!r) return { ok: false };
  if (st.day - r.lastMeet < 20) return { ok: false, msg: 'rivalMetRecently' };
  const cost = HK.meetCost(st, r); if (st.money < cost) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'bribes', -cost); r.lastMeet = st.day; r.attitude = HK.clamp(r.attitude + HK.rndi(8, 15), -100, 100);
  HK.log(st, 'metRival', { rival: HK.rivalName(id) }, 'info');
  return { ok: true };
};
HK.allyRival = function (st, id) {
  const r = st.rivals.find(x => x.id === id); if (!r || r.ally) return { ok: false };
  if (r.attitude < 45) return { ok: false, msg: 'rivalNotReady' };
  if (st.money < 2000) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'politics', -2000); r.ally = true; r.attitude = HK.clamp(r.attitude + 15, -100, 100);
  HK.log(st, 'rivalAllied', { rival: HK.rivalName(id) }, 'good');
  return { ok: true };
};
HK.rivalAlly = st => st.rivals.some(r => r.ally);

/* ---------- Tägliches Handeln der Rivalen ---------- */
HK.rivalBuy = function (st, r, def) {
  const kinds = def.wants.filter(k => k !== 'donate');
  for (let tries = 0; tries < 3; tries++) {
    const k = HK.pick(kinds);
    if (k === 'house' && r.holdings.houses.length < 1) { const free = st.houses.filter(h => h.owner === 'npc'); if (free.length) { const h = HK.pick(free); if (r.wealth > h.price * 4) { h.owner = r.id; r.holdings.houses.push(h.id); r.wealth -= Math.round(h.price * 0.3); HK.log(st, 'rivalBought', { rival: HK.rivalName(r.id), thing: HK.name(HK.BUILDINGS.find(b => b.panel === 'house' && b.plot === h.id)) }, 'info'); return true; } } }
    if (k === 'storage' && r.holdings.storages.length < 2) { const idx = st.storages.map((s, i) => s.owner === 'npc' ? i : -1).filter(i => i >= 0); if (idx.length) { const i = HK.pick(idx); if (r.wealth > HK.STORAGES[i].price * 4) { st.storages[i].owner = r.id; r.holdings.storages.push(i); r.wealth -= Math.round(HK.STORAGES[i].price * 0.3); HK.log(st, 'rivalBought', { rival: HK.rivalName(r.id), thing: HK.name(HK.BUILDINGS.find(b => b.panel === 'storage' && b.plot === i)) }, 'info'); return true; } } }
    if (k === 'venture' && r.holdings.ventures.length < 3) { const free = def.ventures.filter(id => !st.ventures[id]); if (free.length) { const id = HK.pick(free), v = HK.VENTURE[id]; if (r.wealth > v.cost * 4) { st.ventures[id] = { level: 1, since: st.day, owner: r.id }; r.holdings.ventures.push(id); r.wealth -= Math.round(v.cost * 0.3); HK.log(st, 'rivalBought', { rival: HK.rivalName(r.id), thing: HK.name(v) }, 'info'); return true; } } }
    if (k === 'ship') { if (r.ships < 4 && r.wealth > HK.CONST.SHIP_PRICE * 5) { r.ships++; r.wealth -= Math.round(HK.CONST.SHIP_PRICE * 0.4); HK.log(st, 'rivalShip', { rival: HK.rivalName(r.id), n: r.ships }, 'info'); return true; } }
  }
  return false;
};
HK.rivalMotion = function (st, r, def) {
  const lawId = HK.pick(def.law), law = HK.LAWS[lawId], cur = st.town.laws[lawId];
  let value;
  if (lawId === 'monopoly') value = st.town.monopolyHolder === 'rival' ? null : HK.pick(['salt', 'beer', 'cloth']);
  else if (law.bool) value = cur ? null : 1;
  else value = lawId === 'tariff' ? (cur === 5 ? null : 5) : (cur === 10 ? null : 10);
  if (value === null) return false;
  let yes = 0, no = 0;
  for (const c of HK.councillors()) { const stance = law.stance[c.faction]; const sc = (stance[value] - stance[cur]) * 0.8 - (st.persons[c.id].loyalty - 45) / 50 + HK.rnd(-0.35, 0.35); if (sc > 0) yes++; else no++; }
  yes += 1; no += HK.voteWeight(st);
  const passed = yes > no;
  if (passed) { st.town.laws[lawId] = value; if (lawId === 'monopoly') { st.town.monopolyHolder = 'rival'; r.monopolyGood = value; } if (lawId === 'bathBan' && st.bathhouseOwned) HK.log(st, 'bathClosed', {}, 'bad'); }
  HK.log(st, passed ? 'rivalMotionPassed' : 'rivalMotionFailed', { rival: HK.rivalName(r.id), law: HK.name(law), value: HK.lawValueText(lawId, value), yes, no }, passed ? 'bad' : 'info');
  return true;
};
HK.rivalHostile = function (st, r) {
  const acts = ['denounce', 'undercut', 'poach']; if (st.warehouse.cap > 0 && r.attitude < -60) acts.push('arson');
  const a = HK.pick(acts), name = HK.rivalName(r.id);
  if (a === 'denounce') { st.suspicion = HK.clamp(st.suspicion + 8, 0, 100); HK.log(st, 'rivalDenounce', { rival: name }, 'bad'); }
  else if (a === 'undercut') { const g = HK.pick(HK.GOODS).id; st.town.stock[g] = (st.town.stock[g] || 0) + HK.desired(g) * 1.2; HK.log(st, 'rivalUndercut', { rival: name, good: HK.goodName(g) }, 'bad'); }
  else if (a === 'poach') { const mine = Object.keys(st.ventures).filter(id => !st.ventures[id].owner && (st.ventures[id].master || st.ventures[id].level > 1)); if (mine.length) { const id = HK.pick(mine); if (st.ventures[id].master) st.ventures[id].master = false; else st.ventures[id].level--; HK.log(st, 'rivalPoach', { rival: name, venture: HK.name(HK.VENTURE[id]) }, 'bad'); } else { st.suspicion = HK.clamp(st.suspicion + 4, 0, 100); HK.log(st, 'rivalDenounce', { rival: name }, 'bad'); } }
  else if (a === 'arson') { for (const g in st.warehouse.stock) st.warehouse.stock[g] = Math.floor(st.warehouse.stock[g] * 0.94); HK.log(st, 'rivalArson', { rival: name }, 'bad'); }
};
HK.rivalFriendly = function (st, r) {
  const name = HK.rivalName(r.id);
  const unknown = st.incoming.filter(i => !i.known);
  if (unknown.length && Math.random() < 0.6) { const inc = HK.pick(unknown); inc.known = true; const o = HK.ORIGIN[inc.origin]; st.rumors.unshift({ day: st.day, key: inc.sea ? 'rumorShip' : 'rumorCaravan', vars: { origin: HK.name(o), days: inc.days, goods: Object.keys(o.sell).map(HK.goodName).join(', ') } }); if (st.rumors.length > 8) st.rumors.length = 8; HK.log(st, 'rivalTip', { rival: name }, 'good'); }
  else { for (const c of HK.councillors()) if (c.faction === HK.RIVAL_DEF[r.id].faction) st.persons[c.id].loyalty = HK.clamp(st.persons[c.id].loyalty + 3, 0, 100); HK.log(st, 'rivalWord', { rival: name }, 'good'); }
};
HK.tickHooks.push(st => {
  const worth = HK.netWorth(st);
  for (const r of st.rivals) {
    HK.initRival(r); const def = HK.RIVAL_DEF[r.id];
    // Besitz trägt Vermögen; Schiffe fahren
    r.wealth += r.holdings.houses.length * 18 + r.holdings.ventures.length * 30 + r.holdings.storages.length * 35 + r.ships * 45;
    // Haltung: Neid auf Vorsprung, Groll verblasst, Bündnis hält nur bei Wohlwollen
    if (worth > r.wealth * 1.3) r.attitude -= 0.03; if (r.ally && r.attitude < 20) { r.ally = false; HK.log(st, 'allianceBroken', { rival: HK.rivalName(r.id) }, 'bad'); }
    r.attitude += (0 - r.attitude) * 0.002; r.attitude = HK.clamp(r.attitude, -100, 100);
    if (r.ally) r.attitude = Math.max(r.attitude, 20);
    // Alle zwei Wochen eine Handlung
    if (st.day - r.lastAct < 14 || Math.random() < 0.3) continue;
    r.lastAct = st.day;
    // Ratssitz ab 90.000 Mark
    if (r.seat === 'none' && r.wealth >= 90000 && Math.random() < 0.5) { r.seat = 'councillor'; HK.log(st, 'rivalSeat', { rival: HK.rivalName(r.id) }, 'event'); continue; }
    if (r.seat === 'councillor' && r.attitude < 0 && !r.ally && Math.random() < 0.2) { if (HK.rivalMotion(st, r, def)) continue; }
    if (def.path === 'patron' && !r.brotherhood && r.wealth >= 120000) { r.brotherhood = true; HK.fac(st, 'kirche', -5); HK.log(st, 'brotherhoodFounded', { rival: HK.rivalName(r.id) }, 'event'); continue; }
    if (r.attitude <= -30 && !r.ally && Math.random() < 0.45) { HK.rivalHostile(st, r); continue; }
    if (r.attitude >= 40 && Math.random() < 0.4) { HK.rivalFriendly(st, r); continue; }
    HK.rivalBuy(st, r, def);
  }
});
/* Bündnis: gemeinsamer Konvoi senkt Piratengefahr; verbündete Ratsherren stimmen mit (in HK.propose berücksichtigt) */
HK.wrapAction('propose', (st, r, lawId, value) => { if (r.passed && lawId === 'monopoly' && value !== 'none') for (const rv of st.rivals) rv.attitude = HK.clamp(rv.attitude - (rv.id === 'kruse' ? 20 : 6), -100, 100); });
