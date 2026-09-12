/* Spiellogik: Zustand, Wirtschaft, Aktionen, Tagestick */
'use strict';

HK.state = null;
HK.rnd = (a, b) => a + Math.random() * (b - a);
HK.rndi = (a, b) => Math.floor(HK.rnd(a, b + 1));
HK.pick = arr => arr[Math.floor(Math.random() * arr.length)];
HK.clamp = (v, a, b) => Math.max(a, Math.min(b, v));

HK.log = function (state, key, vars, kind) {
  state.log.unshift({ day: state.day, key, vars: vars || {}, kind: kind || 'info' });
  if (state.log.length > 300) state.log.length = 300;
  if (HK.onLog) HK.onLog(state.log[0]);
};
/* Kassenbuch: Einnahmen (+) und Ausgaben (−) je Quelle, rollierend 30 Tage */
HK.book = function (state, source, amount) {
  state.money += amount;
  const today = state.ledger[state.ledger.length - 1];
  today[source] = (today[source] || 0) + amount;
};

/* ---------- Neues Spiel ---------- */
HK.newGame = function (opts) {
  const diff = HK.DIFFICULTY[opts.difficulty] || HK.DIFFICULTY.normal;
  const st = {
    version: 2, day: 0, speed: 0, name: opts.name, difficulty: opts.difficulty,
    money: diff.money, loan: 0, rep: 20, influence: 5, piety: 30, suspicion: 0,
    town: { stock: {}, prosperity: 50, pop: 6000, laws: {}, berths: 3, projects: {}, events: [], monopolyHolder: null },
    persons: {}, seat: 'none', acceptBribes: false, candidacyPaid: false,
    ships: [], caravans: [], incoming: [],
    warehouse: { cap: HK.CONST.WAREHOUSE_CAP, stock: {} },
    stalls: 0, houses: [], workshops: [], licenses: {}, guildMember: false,
    ownShips: [], boats: 0, tavernOwned: false, bathhouseOwned: false,
    loansOut: [], loanOffers: [], taxFarm: null, church: { projects: {}, supply: { wax: 10, wine: 8 }, supplyDay: 0 },
    rivals: HK.RIVALS.map(r => ({ id: r.id, wealth: r.wealth })),
    investigation: null, log: [], history: [], ledger: [{}], stats: { profit: 0, volume: 0, smuggled: 0, bribes: 0 },
    rank: 0, won: false, gameOver: false, negDays: 0, nextId: 1, usedNames: [], rumors: [], spyUntil: 0,
  };
  for (const g of HK.GOODS) st.town.stock[g.id] = g.cons * 18 + g.prod * 20;
  for (const k in HK.LAWS) st.town.laws[k] = HK.LAWS[k].init;
  for (const p of HK.PERSONS) st.persons[p.id] = { loyalty: HK.rndi(15, 35) };
  for (let i = 0; i < HK.CONST.HOUSE_COUNT; i++) st.houses.push({ id: i, owner: i === 2 ? 'player' : 'npc', level: 1, price: HK.CONST.HOUSE_PRICE + i * 800, damaged: false });
  for (let i = 0; i < HK.CONST.WORKSHOP_PLOTS; i++) st.workshops.push({ plot: i, type: null, idle: false });
  st.warehouse.stock.salt = 20; st.warehouse.stock.beer = 30; st.hutFish = 25;
  for (let i = 0; i < 3; i++) HK.scheduleArrival(st, true);
  HK.scheduleArrival(st, false);
  HK.refreshLoanOffers(st);
  // Zwei Schiffe liegen schon im Hafen
  HK.dockShip(st, 'luebeck'); HK.dockShip(st, 'danzig'); HK.dockCaravan(st, 'umland');
  st.history.push({ day: 0, worth: HK.netWorth(st) });
  HK.log(st, 'welcome', { name: st.name }, 'good');
  return st;
};

/* ---------- Kennzahlen ---------- */
HK.netWorth = function (st) {
  let w = st.money - st.loan + HK.stockValue(st.warehouse.stock);
  for (const h of st.houses) if (h.owner === 'player') w += h.price * (0.8 + h.level * 0.2);
  for (const ws of st.workshops) if (ws.type) w += HK.WORKSHOP[ws.type].cost * 0.6;
  for (const s of st.ownShips) w += HK.CONST.SHIP_PRICE * 0.6 * (s.hull / 100) + HK.stockValue(s.cargo);
  w += st.boats * HK.CONST.BOAT_PRICE * 0.6 + st.stalls * HK.CONST.STALL_COST * 0.6;
  if (st.tavernOwned) w += HK.CONST.TAVERN_PRICE * 0.7;
  if (st.bathhouseOwned) w += HK.CONST.BATHHOUSE_PRICE * 0.7;
  for (const l of st.loansOut) w += l.amount * 0.8;
  return Math.round(w);
};
HK.stockValue = function (stock) { let v = 0; for (const g in stock) v += stock[g] * HK.GOOD[g].base; return v; };
HK.stockUsed = function (stock) { let s = 0; for (const g in stock) s += stock[g]; return s; };
HK.whFree = st => st.warehouse.cap - HK.stockUsed(st.warehouse.stock);
HK.addStock = function (stock, g, q) { stock[g] = (stock[g] || 0) + q; if (stock[g] <= 0.0001) delete stock[g]; };
HK.loanLimit = st => Math.max(0, Math.round(4000 + (HK.netWorth(st) + st.loan) * 0.4 - st.loan));
HK.law = (st, k) => st.town.laws[k];
HK.customsDiscount = st => HK.clamp(st.persons.customs.loyalty / 100 * 0.85, 0, 0.85);
HK.tariffRate = st => HK.law(st, 'tariff') / 100;
HK.dayOfYear = st => (st.day + 60) % 365; // Spiel beginnt am 1. März

/* Feste Kirchenfeste: Tag im Jahr (Jahresbeginn 1. Januar = 0) */
HK.SEASON_EVENTS = [
  { id: 'lent', from: 45, to: 90, cons: { fish: 1.6, smokedfish: 1.5, beer: 0.8, wine: 0.7 } },
  { id: 'easter', from: 91, to: 95, cons: { wine: 2, wax: 2.5, beer: 1.4 } },
  { id: 'midsummer', from: 172, to: 176, cons: { beer: 2, fish: 1.3 } },
  { id: 'michaelmas', from: 271, to: 275, cons: { wine: 1.5, cloth: 1.5, furs: 1.5 } },
  { id: 'christmas', from: 355, to: 364, cons: { wine: 2, wax: 3, spices: 2.5, beer: 1.5 } },
];
HK.seasonEvent = st => { const d = HK.dayOfYear(st); return HK.SEASON_EVENTS.find(e => d >= e.from && d <= e.to) || null; };
HK.consMod = function (st, g) {
  let m = 1;
  const se = HK.seasonEvent(st); if (se && se.cons[g]) m *= se.cons[g];
  for (const ev of st.town.events) if (HK.TOWN_EVENTS[ev.type].cons && HK.TOWN_EVENTS[ev.type].cons[g]) m *= HK.TOWN_EVENTS[ev.type].cons[g];
  return m;
};

/* ---------- Preise ---------- */
HK.desired = g => HK.GOOD[g].cons * 20 + HK.GOOD[g].prod * 15 + 20;
HK.factor = (d, s) => HK.clamp(Math.pow(d / (s + 1), 0.8), 0.5, 1.9);
/* Mittlerer Preisfaktor über eine Menge (numerisch integriert) */
HK.avgFactor = function (d, from, to) {
  const n = 12, step = (to - from) / n; let sum = 0;
  for (let i = 0; i <= n; i++) sum += HK.factor(d, Math.max(0, from + step * i));
  return sum / (n + 1);
};
HK.prosperityMod = st => 0.8 + st.town.prosperity / 250;
HK.marketBuyPrice = function (st, g, q) {
  const s = st.town.stock[g] || 0, d = HK.desired(g), qq = Math.max(1, q || 1);
  let p = HK.GOOD[g].base * HK.avgFactor(d, s, s - qq) * HK.consMod(st, g) * HK.prosperityMod(st) * 1.1;
  return Math.max(1, Math.round(p));
};
/* Wie viel die Bürger heute noch von einer Ware abnehmen */
HK.marketCap = function (st, g) {
  const cap = Math.ceil((HK.GOOD[g].cons * 1.5 + 2) * (1 + st.stalls * 0.5) * HK.consMod(st, g));
  return Math.max(0, cap - ((st.town.sold || {})[g] || 0));
};
HK.marketSellPrice = function (st, g, q) {
  const s = st.town.stock[g] || 0, d = HK.desired(g), qq = Math.max(1, q || 1);
  let p = HK.GOOD[g].base * HK.avgFactor(d, s, s + qq) * HK.consMod(st, g) * HK.prosperityMod(st) * 0.85;
  p *= 1 + st.stalls * 0.04;
  if (HK.law(st, 'monopoly') === g && st.town.monopolyHolder === 'player') p *= 1.35;
  p *= 1 - HK.law(st, 'marketFee') / 100;
  return Math.max(1, Math.round(p));
};
HK.demandLabel = function (st, g) {
  const r = (st.town.stock[g] || 0) / HK.desired(g);
  return r < 0.5 ? 'shortage' : r > 1.6 ? 'surplus' : 'normalDemand';
};

/* ---------- Schiffe & Karawanen ---------- */
HK.scheduleArrival = function (st, sea) {
  const pool = HK.ORIGINS.filter(o => o.sea === sea);
  st.incoming.push({ id: st.nextId++, origin: HK.pick(pool).id, sea, days: HK.rndi(2, 7), known: false, waiting: 0 });
};
HK.makeVisitor = function (st, originId) {
  const o = HK.ORIGIN[originId], cargo = {}, wants = {};
  const sellKeys = Object.keys(o.sell), wantKeys = Object.keys(o.want);
  const nSell = Math.min(sellKeys.length, HK.rndi(2, 3)), nWant = Math.min(wantKeys.length, HK.rndi(2, 3));
  sellKeys.sort(() => Math.random() - 0.5).slice(0, nSell).forEach(g => cargo[g] = { qty: HK.rndi(30, o.sea ? 140 : 70), price: Math.round(HK.GOOD[g].base * o.sell[g] * HK.rnd(0.9, 1.1)) });
  wantKeys.sort(() => Math.random() - 0.5).slice(0, nWant).forEach(g => wants[g] = { qty: HK.rndi(20, o.sea ? 70 : 40), price: Math.round(HK.GOOD[g].base * (0.75 + o.want[g] * 0.4) * HK.rnd(0.92, 1.08)) });
  const avail = HK.SHIP_NAMES.filter(n => !st.ships.some(s => s.name === n));
  return { id: st.nextId++, origin: originId, name: o.sea ? HK.pick(avail.length ? avail : HK.SHIP_NAMES) : HK.name(o), captain: HK.pick(HK.CAPTAIN_NAMES), cargo, wants, daysLeft: HK.rndi(4, 7), sea: o.sea };
};
HK.dockShip = function (st, originId) {
  if (st.ships.length >= st.town.berths) return false;
  const v = HK.makeVisitor(st, originId);
  st.ships.push(v);
  HK.log(st, 'shipArrived', { ship: v.name, origin: HK.name(HK.ORIGIN[originId]) }, 'arrival');
  return true;
};
HK.dockCaravan = function (st, originId) {
  if (st.caravans.length >= 2) return false;
  const v = HK.makeVisitor(st, originId);
  st.caravans.push(v);
  HK.log(st, 'caravanArrived', { origin: HK.name(HK.ORIGIN[originId]) }, 'arrival');
  return true;
};
HK.visitors = st => st.ships.concat(st.caravans);
HK.findVisitor = (st, id) => HK.visitors(st).find(v => v.id === id);

/* Vom Schiff kaufen. smuggle: nachts ohne Zoll */
HK.buyFromVisitor = function (st, v, g, qty, smuggle) {
  qty = Math.floor(qty);
  const c = v.cargo[g];
  if (!c || qty <= 0) return { ok: false };
  if (c.qty < qty) return { ok: false, msg: 'notEnoughStock' };
  if (HK.whFree(st) < qty) return { ok: false, msg: 'warehouseFull' };
  const goods = c.price * qty;
  const tariff = smuggle ? 0 : Math.round(goods * HK.tariffRate(st) * (1 - HK.customsDiscount(st)));
  if (st.money < goods + tariff) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'shipTrade', -goods);
  if (tariff) HK.book(st, 'tariffs', -tariff);
  c.qty -= qty; if (c.qty <= 0) delete v.cargo[g];
  HK.addStock(st.warehouse.stock, g, qty);
  st.stats.volume += goods;
  const r = { ok: true, cost: goods + tariff };
  if (smuggle) HK.smuggleCheck(st, goods, r);
  return r;
};
HK.sellToVisitor = function (st, v, g, qty, smuggle) {
  qty = Math.floor(qty);
  const w = v.wants[g];
  if (!w || qty <= 0) return { ok: false };
  if (w.qty < qty) return { ok: false, msg: 'notWanted' };
  if ((st.warehouse.stock[g] || 0) < qty) return { ok: false, msg: 'notEnoughCargo' };
  const goods = w.price * qty;
  const tariff = smuggle ? 0 : Math.round(goods * HK.tariffRate(st) * 0.5 * (1 - HK.customsDiscount(st)));
  HK.book(st, 'shipTrade', goods);
  if (tariff) HK.book(st, 'tariffs', -tariff);
  w.qty -= qty; if (w.qty <= 0) delete v.wants[g];
  HK.addStock(st.warehouse.stock, g, -qty);
  st.stats.volume += goods;
  const r = { ok: true, cost: goods - tariff };
  if (smuggle) HK.smuggleCheck(st, goods, r);
  return r;
};
HK.smuggleCheck = function (st, goods, r) {
  const dutySaved = goods * HK.tariffRate(st);
  st.stats.smuggled += dutySaved;
  const risk = (0.12 + st.suspicion / 300) * (1 - st.persons.customs.loyalty / 160) * (st.town.projects.wall ? 1.15 : 1);
  if (Math.random() < risk) {
    const fine = Math.round(dutySaved * 3 + 200);
    HK.book(st, 'fines', -fine);
    st.suspicion = HK.clamp(st.suspicion + 15, 0, 100); st.rep = HK.clamp(st.rep - 4, 0, 100);
    HK.log(st, 'smuggleCaught', { fine: HK.fmt(fine) }, 'bad');
    r.caught = true;
  } else { st.suspicion = HK.clamp(st.suspicion + 2, 0, 100); r.saved = dutySaved; }
};

/* ---------- Markt ---------- */
HK.marketBuy = function (st, g, qty) {
  qty = Math.floor(qty);
  if (qty <= 0) return { ok: false };
  if ((st.town.stock[g] || 0) < qty) return { ok: false, msg: 'notEnoughStock' };
  if (HK.whFree(st) < qty) return { ok: false, msg: 'warehouseFull' };
  if (HK.law(st, 'monopoly') === g && st.town.monopolyHolder === 'rival') return { ok: false, msg: 'monopolyBlocked' };
  const p = HK.marketBuyPrice(st, g, qty), cost = p * qty;
  if (st.money < cost) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'market', -cost);
  st.town.stock[g] -= qty; HK.addStock(st.warehouse.stock, g, qty); st.stats.volume += cost;
  return { ok: true, cost };
};
HK.marketSell = function (st, g, qty) {
  qty = Math.floor(qty);
  if (qty <= 0) return { ok: false };
  if ((st.warehouse.stock[g] || 0) < qty) return { ok: false, msg: 'notEnoughCargo' };
  if (HK.law(st, 'monopoly') === g && st.town.monopolyHolder === 'rival') return { ok: false, msg: 'monopolyBlocked' };
  if (HK.marketCap(st, g) < qty) return { ok: false, msg: 'marketSaturated' };
  const p = HK.marketSellPrice(st, g, qty), rev = p * qty;
  HK.book(st, 'market', rev);
  st.town.sold = st.town.sold || {}; st.town.sold[g] = (st.town.sold[g] || 0) + qty;
  if (HK.demandLabel(st, g) === 'shortage') st.rep = HK.clamp(st.rep + qty * 0.01, 0, 100);
  st.town.stock[g] = (st.town.stock[g] || 0) + qty; HK.addStock(st.warehouse.stock, g, -qty); st.stats.volume += rev;
  return { ok: true, cost: rev };
};
HK.buyStall = function (st) {
  if (st.stalls >= HK.CONST.STALL_MAX) return { ok: false };
  if (st.money < HK.CONST.STALL_COST) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'investments', -HK.CONST.STALL_COST); st.stalls++;
  return { ok: true };
};
HK.expandWarehouse = function (st) {
  if (st.money < HK.CONST.WAREHOUSE_EXPAND_COST) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'investments', -HK.CONST.WAREHOUSE_EXPAND_COST); st.warehouse.cap += HK.CONST.WAREHOUSE_EXPAND;
  return { ok: true };
};

/* ---------- Personen: Geschenke & Bestechung ---------- */
HK.giftCost = (st, pid) => Math.round(HK.CONST.GIFT_BASE + st.persons[pid].loyalty * st.persons[pid].loyalty * 0.25);
HK.gift = function (st, pid) {
  const cost = HK.giftCost(st, pid);
  if (st.money < cost) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'bribes', -cost); st.stats.bribes += cost;
  const p = st.persons[pid];
  p.loyalty = HK.clamp(p.loyalty + HK.rndi(6, 12), 0, 100);
  const official = ['customs', 'bailiff', 'mayor'].includes(pid) || HK.PERSON[pid].council;
  if (official) st.suspicion = HK.clamp(st.suspicion + 3, 0, 100);
  if (pid === 'priest') st.piety = HK.clamp(st.piety + 2, 0, 100);
  return { ok: true };
};

/* ---------- Kirche ---------- */
HK.donate = function (st, amount) {
  amount = Math.floor(amount);
  if (amount <= 0 || st.money < amount) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'church', -amount);
  st.piety = HK.clamp(st.piety + Math.sqrt(amount) / 3, 0, 100);
  st.rep = HK.clamp(st.rep + Math.sqrt(amount) / 8, 0, 100);
  return { ok: true };
};
HK.indulgence = function (st) {
  const cost = HK.CONST.INDULGENCE_COST + Math.round(st.suspicion * 15);
  if (st.money < cost) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'church', -cost);
  st.suspicion = HK.clamp(st.suspicion - 20, 0, 100); st.piety = HK.clamp(st.piety + 5, 0, 100);
  return { ok: true };
};
HK.churchProject = function (st, id) {
  const p = HK.CHURCH_PROJECTS.find(x => x.id === id);
  if (!p || st.church.projects[id]) return { ok: false };
  if (st.money < p.cost) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'church', -p.cost);
  st.church.projects[id] = true; st.piety = HK.clamp(st.piety + p.piety, 0, 100); st.rep = HK.clamp(st.rep + p.rep, 0, 100); st.influence += 5;
  HK.log(st, 'projectDone', { project: HK.name(p) }, 'good');
  return { ok: true };
};
HK.supplyChurch = function (st, g) {
  const want = st.church.supply[g] || 0;
  const q = Math.min(want, Math.floor(st.warehouse.stock[g] || 0));
  if (q <= 0) return { ok: false, msg: 'notEnoughCargo' };
  if (st.piety < 40) return { ok: false, msg: 'pietyTooLow' };
  const price = Math.round(HK.GOOD[g].base * (st.church.projects.chapel ? 2.0 : 1.5));
  HK.book(st, 'church', price * q); HK.addStock(st.warehouse.stock, g, -q); st.church.supply[g] -= q;
  st.piety = HK.clamp(st.piety + 1, 0, 100);
  return { ok: true, cost: price * q };
};
HK.sermon = function (st, kind) {
  const p = st.persons.priest;
  if (kind === 'favor') {
    if (p.loyalty < 40) return { ok: false, msg: 'needLoyalty' };
    if (st.money < 500) return { ok: false, msg: 'notEnoughMoney' };
    HK.book(st, 'church', -500); st.rep = HK.clamp(st.rep + 8, 0, 100); p.loyalty -= 10;
  } else {
    if (p.loyalty < 60) return { ok: false, msg: 'needLoyalty' };
    if (st.money < 800) return { ok: false, msg: 'notEnoughMoney' };
    HK.book(st, 'church', -800);
    const r = HK.pick(st.rivals); r.wealth = Math.round(r.wealth * 0.95); p.loyalty -= 15; st.suspicion = HK.clamp(st.suspicion + 4, 0, 100);
    HK.log(st, 'sermonAgainst', { rival: HK.RIVALS.find(x => x.id === r.id).name }, 'info');
  }
  return { ok: true };
};

/* ---------- Rathaus ---------- */
HK.voteWeight = st => st.seat === 'mayor' ? 2 : st.seat === 'councillor' ? 1 : 0;
HK.councillors = () => HK.PERSONS.filter(p => p.council);
HK.propose = function (st, lawId, value) {
  const law = HK.LAWS[lawId];
  if (!law || !law.options.includes(value) || st.town.laws[lawId] === value) return { ok: false };
  if (st.influence < 20) return { ok: false, msg: 'needInfluence' };
  st.influence -= 20;
  let yes = HK.voteWeight(st), no = 0;
  const detail = [];
  for (const c of HK.councillors()) {
    const stance = law.stance[c.faction];
    const score = (stance[value] - stance[st.town.laws[lawId]]) * 0.8 + (st.persons[c.id].loyalty - 45) / 35 + HK.rnd(-0.35, 0.35);
    if (score > 0) yes++; else no++;
    detail.push({ id: c.id, yes: score > 0 });
  }
  const passed = yes > no;
  if (passed) {
    st.town.laws[lawId] = value;
    if (lawId === 'monopoly') st.town.monopolyHolder = value === 'none' ? null : 'player';
    if (lawId === 'bathBan' && value === 1 && st.bathhouseOwned) HK.log(st, 'bathClosed', {}, 'bad');
    st.influence += 5;
  }
  HK.log(st, passed ? 'motionPassed' : 'motionFailed', { law: HK.name(law), value: HK.lawValueText(lawId, value), yes, no }, passed ? 'good' : 'bad');
  return { ok: true, passed, yes, no, detail };
};
HK.lawValueText = function (lawId, v) {
  const law = HK.LAWS[lawId];
  if (law.bool) return HK.t(v ? 'yes' : 'no');
  if (lawId === 'monopoly') return v === 'none' ? HK.t('none') : HK.goodName(v);
  return v + ' ' + law.unit;
};
HK.runForSeat = function (st) {
  if (st.seat === 'mayor') return { ok: false };
  const wantMayor = st.seat === 'councillor';
  const cost = wantMayor ? 6000 : 3000, needRep = wantMayor ? 55 : 35, needLoyal = wantMayor ? 55 : 40, needCount = wantMayor ? 4 : 3;
  if (st.rep < needRep) return { ok: false, msg: 'needRep' };
  if (st.money < cost) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'politics', -cost);
  const support = HK.councillors().filter(c => st.persons[c.id].loyalty >= needLoyal).length;
  if (support >= needCount) {
    st.seat = wantMayor ? 'mayor' : 'councillor'; st.influence += 15;
    HK.log(st, wantMayor ? 'becameMayor' : 'becameCouncillor', {}, 'good');
    return { ok: true, won: true };
  }
  HK.log(st, 'electionLost', { support, need: needCount }, 'bad');
  return { ok: true, won: false };
};
HK.fundProject = function (st, id) {
  const p = HK.PROJECTS.find(x => x.id === id);
  if (!p || st.town.projects[id]) return { ok: false };
  if (st.money < p.cost) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'politics', -p.cost); st.town.projects[id] = true;
  st.rep = HK.clamp(st.rep + p.rep, 0, 100); st.influence += 10;
  if (p.effect === 'berth') st.town.berths = 4;
  if (p.effect === 'prosperity') st.town.prosperity = HK.clamp(st.town.prosperity + 8, 0, 100);
  HK.log(st, 'projectDone', { project: HK.name(p) }, 'good');
  return { ok: true };
};
HK.taxFarmPrice = st => Math.round(HK.tariffRate(st) * 100 * 900 * (0.8 + st.town.prosperity / 200) * st.town.berths / 3);
HK.buyTaxFarm = function (st) {
  if (st.taxFarm && st.taxFarm.until > st.day) return { ok: false };
  const price = HK.taxFarmPrice(st);
  if (st.money < price) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'politics', -price); st.taxFarm = { until: st.day + HK.CONST.TAXFARM_DAYS };
  HK.log(st, 'taxFarmBought', { days: HK.CONST.TAXFARM_DAYS }, 'good');
  return { ok: true };
};

/* ---------- Gilde, Werkstätten ---------- */
HK.joinGuild = function (st) {
  if (st.guildMember) return { ok: false };
  if (st.money < HK.CONST.GUILD_FEE) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'investments', -HK.CONST.GUILD_FEE); st.guildMember = true; st.influence += 5;
  return { ok: true };
};
HK.buyLicense = function (st, type) {
  const w = HK.WORKSHOP[type];
  if (!st.guildMember) return { ok: false, msg: 'needGuild' };
  if (st.licenses[type]) return { ok: false };
  if (st.money < w.license) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'investments', -w.license); st.licenses[type] = true;
  return { ok: true };
};
HK.buildWorkshop = function (st, plot, type) {
  const ws = st.workshops[plot], w = HK.WORKSHOP[type];
  if (!ws || ws.type || !w) return { ok: false };
  if (!st.licenses[type]) return { ok: false, msg: 'needLicense' };
  if (st.money < w.cost) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'investments', -w.cost); ws.type = type;
  HK.log(st, 'workshopBuilt', { workshop: HK.name(w) }, 'good');
  return { ok: true };
};
HK.demolishWorkshop = function (st, plot) {
  const ws = st.workshops[plot];
  if (!ws || !ws.type) return { ok: false };
  HK.book(st, 'investments', Math.round(HK.WORKSHOP[ws.type].cost * 0.3)); ws.type = null;
  return { ok: true };
};

/* ---------- Häuser, Taverne, Badehaus ---------- */
HK.buyHouse = function (st, id) {
  const h = st.houses[id];
  if (!h || h.owner === 'player') return { ok: false };
  if (st.money < h.price) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'investments', -h.price); h.owner = 'player';
  return { ok: true };
};
HK.sellHouse = function (st, id) {
  const h = st.houses[id];
  if (!h || h.owner !== 'player') return { ok: false };
  HK.book(st, 'investments', Math.round(h.price * (0.7 + h.level * 0.15))); h.owner = 'npc'; h.level = 1;
  return { ok: true };
};
HK.upgradeHouse = function (st, id) {
  const h = st.houses[id];
  if (!h || h.owner !== 'player' || h.level >= 3) return { ok: false };
  if (st.money < HK.CONST.HOUSE_UPGRADE) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'investments', -HK.CONST.HOUSE_UPGRADE); h.level++;
  return { ok: true };
};
HK.repairHouse = function (st, id) {
  const h = st.houses[id];
  if (!h || !h.damaged) return { ok: false };
  if (st.money < 800) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'investments', -800); h.damaged = false;
  return { ok: true };
};
HK.houseRent = (st, h) => h.damaged ? 0 : Math.round((18 + h.level * 12) * (0.6 + st.town.prosperity / 125));
HK.buyTavern = function (st) {
  if (st.tavernOwned) return { ok: false };
  if (st.money < HK.CONST.TAVERN_PRICE) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'investments', -HK.CONST.TAVERN_PRICE); st.tavernOwned = true;
  return { ok: true };
};
HK.tavernIncome = st => Math.round(30 + st.ships.length * 15 + st.town.prosperity * 0.4);
HK.buyBathhouse = function (st) {
  if (st.bathhouseOwned) return { ok: false };
  if (st.money < HK.CONST.BATHHOUSE_PRICE) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'investments', -HK.CONST.BATHHOUSE_PRICE); st.bathhouseOwned = true;
  return { ok: true };
};
HK.bathIncome = st => HK.law(st, 'bathBan') ? 0 : Math.round(45 + st.town.prosperity * 0.5);

/* ---------- Taverne: Gerüchte, Glücksspiel, Anheuern ---------- */
HK.buyRumor = function (st) {
  if (st.money < HK.CONST.RUMOR_COST) return { ok: false, msg: 'notEnoughMoney' };
  const unknown = st.incoming.filter(i => !i.known);
  HK.book(st, 'tavern', -HK.CONST.RUMOR_COST);
  if (!unknown.length) { st.rumors.unshift({ day: st.day, key: 'rumorNothing', vars: {} }); return { ok: true }; }
  const inc = HK.pick(unknown); inc.known = true;
  const o = HK.ORIGIN[inc.origin];
  st.rumors.unshift({ day: st.day, key: inc.sea ? 'rumorShip' : 'rumorCaravan', vars: { origin: HK.name(o), days: inc.days, goods: Object.keys(o.sell).map(HK.goodName).join(', ') } });
  if (st.rumors.length > 8) st.rumors.length = 8;
  return { ok: true };
};
HK.gamble = function (st, bet) {
  bet = Math.floor(bet);
  if (bet <= 0 || st.money < bet) return { ok: false, msg: 'notEnoughMoney' };
  const won = Math.random() < 0.46;
  HK.book(st, 'gambling', won ? bet : -bet);
  if (Math.random() < 0.15) st.piety = HK.clamp(st.piety - 1, 0, 100);
  return { ok: true, won, bet };
};
HK.hireSpy = function (st) {
  if (st.money < HK.CONST.SPY_COST) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'bribes', -HK.CONST.SPY_COST); st.spyUntil = st.day + 60;
  return { ok: true };
};
HK.hireThugs = function (st, target) {
  if (st.money < HK.CONST.THUG_COST) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'bribes', -HK.CONST.THUG_COST);
  st.suspicion = HK.clamp(st.suspicion + 10, 0, 100);
  if (target === 'collect') {
    const bad = st.loansOut.filter(l => l.defaulted);
    if (!bad.length) return { ok: true, nothing: true };
    const l = bad[0];
    if (Math.random() < 0.65) { HK.book(st, 'lending', Math.round(l.amount * 0.9)); HK.log(st, 'thugsCollected', { name: l.name, amount: HK.fmt(Math.round(l.amount * 0.9)) }, 'good'); }
    else { st.rep = HK.clamp(st.rep - 5, 0, 100); HK.log(st, 'thugsFailed', { name: l.name }, 'bad'); }
    st.loansOut = st.loansOut.filter(x => x.id !== l.id);
  } else {
    const r = st.rivals.find(x => x.id === target);
    if (!r) return { ok: false };
    if (Math.random() < 0.75) { r.wealth = Math.round(r.wealth * 0.92); HK.log(st, 'sabotageOk', { rival: HK.RIVALS.find(x => x.id === r.id).name }, 'good'); }
    else { st.suspicion = HK.clamp(st.suspicion + 15, 0, 100); st.rep = HK.clamp(st.rep - 8, 0, 100); HK.log(st, 'sabotageFailed', { rival: HK.RIVALS.find(x => x.id === r.id).name }, 'bad'); }
  }
  return { ok: true };
};

/* ---------- Geldwechsler ---------- */
HK.takeLoan = function (st, amount) {
  amount = Math.floor(amount);
  if (amount <= 0) return { ok: false };
  if (amount > HK.loanLimit(st)) return { ok: false, msg: 'loanTooHigh' };
  st.loan += amount; HK.book(st, 'loans', amount);
  return { ok: true };
};
HK.repayLoan = function (st, amount) {
  amount = Math.min(Math.floor(amount), st.loan, Math.max(0, st.money));
  if (amount <= 0) return { ok: false, msg: 'notEnoughMoney' };
  st.loan -= amount; HK.book(st, 'loans', -amount);
  return { ok: true };
};
HK.refreshLoanOffers = function (st) {
  while (st.loanOffers.length < 3) {
    const amount = HK.rndi(4, 50) * 100, risk = HK.rnd(0.05, 0.4);
    st.loanOffers.push({ id: st.nextId++, name: HK.pick(HK.BORROWER_NAMES), amount, interest: Math.round(10 + risk * 90), days: HK.rndi(30, 120), risk });
  }
};
HK.lend = function (st, offerId) {
  const o = st.loanOffers.find(x => x.id === offerId);
  if (!o) return { ok: false };
  if (st.money < o.amount) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'lending', -o.amount);
  st.loanOffers = st.loanOffers.filter(x => x.id !== offerId);
  st.loansOut.push({ id: o.id, name: o.name, amount: o.amount, interest: o.interest, due: st.day + o.days, risk: o.risk, defaulted: false });
  if (HK.law(st, 'usuryBan')) { st.suspicion = HK.clamp(st.suspicion + 8, 0, 100); st.piety = HK.clamp(st.piety - 3, 0, 100); }
  else if (o.interest > 40) st.piety = HK.clamp(st.piety - 1, 0, 100);
  return { ok: true };
};

/* ---------- Vogtei ---------- */
HK.bribeBailiff = function (st) {
  if (!st.investigation) return { ok: false };
  const cost = 1500 + Math.round(st.suspicion * 20);
  if (st.money < cost) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'bribes', -cost); st.stats.bribes += cost;
  if (Math.random() < 0.3 + st.persons.bailiff.loyalty / 130) { st.investigation = null; st.suspicion = HK.clamp(st.suspicion - 15, 0, 100); HK.log(st, 'investigationDropped', {}, 'good'); return { ok: true, dropped: true }; }
  st.suspicion = HK.clamp(st.suspicion + 10, 0, 100); HK.log(st, 'bribeRefused', {}, 'bad');
  return { ok: true, dropped: false };
};

/* ---------- Werft, eigene Schiffe, Fischerei ---------- */
HK.buyShip = function (st) {
  if (st.money < HK.CONST.SHIP_PRICE) return { ok: false, msg: 'notEnoughMoney' };
  if (st.ownShips.length >= 3) return { ok: false, msg: 'maxShips' };
  HK.book(st, 'investments', -HK.CONST.SHIP_PRICE);
  const avail = HK.SHIP_NAMES.filter(n => !st.usedNames.includes(n));
  const name = HK.pick(avail.length ? avail : HK.SHIP_NAMES); st.usedNames.push(name);
  st.ownShips.push({ id: st.nextId++, name, status: 'port', dest: null, daysLeft: 0, cargo: {}, bringBack: null, hull: 100 });
  return { ok: true };
};
HK.repairShip = function (st, id) {
  const s = st.ownShips.find(x => x.id === id);
  if (!s || s.status !== 'port' || s.hull >= 100) return { ok: false };
  const cost = (100 - s.hull) * 30;
  if (st.money < cost) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'investments', -cost); s.hull = 100;
  return { ok: true };
};
HK.sellOwnShip = function (st, id) {
  const s = st.ownShips.find(x => x.id === id);
  if (!s || s.status !== 'port') return { ok: false };
  for (const g in s.cargo) HK.addStock(st.warehouse.stock, g, Math.min(s.cargo[g], Math.max(0, HK.whFree(st))));
  HK.book(st, 'investments', Math.round(HK.CONST.SHIP_PRICE * 0.6 * s.hull / 100));
  st.ownShips = st.ownShips.filter(x => x.id !== id);
  return { ok: true };
};
HK.loadShip = function (st, id, g, qty) {
  const s = st.ownShips.find(x => x.id === id); qty = Math.floor(qty);
  if (!s || s.status !== 'port' || qty <= 0) return { ok: false };
  if ((st.warehouse.stock[g] || 0) < qty) return { ok: false, msg: 'notEnoughCargo' };
  if (HK.stockUsed(s.cargo) + qty > 120) return { ok: false, msg: 'shipFull' };
  HK.addStock(st.warehouse.stock, g, -qty); HK.addStock(s.cargo, g, qty);
  return { ok: true };
};
HK.unloadShip = function (st, id, g, qty) {
  const s = st.ownShips.find(x => x.id === id); qty = Math.floor(qty);
  if (!s || s.status !== 'port' || qty <= 0 || (s.cargo[g] || 0) < qty) return { ok: false };
  if (HK.whFree(st) < qty) return { ok: false, msg: 'warehouseFull' };
  HK.addStock(s.cargo, g, -qty); HK.addStock(st.warehouse.stock, g, qty);
  return { ok: true };
};
HK.sendShip = function (st, id, dest, bringBack) {
  const s = st.ownShips.find(x => x.id === id), o = HK.ORIGIN[dest];
  if (!s || s.status !== 'port' || !o || !o.sea) return { ok: false };
  if (s.hull < 30) return { ok: false, msg: 'shipDamaged' };
  s.status = 'away'; s.dest = dest; s.daysLeft = o.days * 2 + 1; s.bringBack = bringBack && o.sell[bringBack] ? bringBack : null; s.phase = 'out';
  HK.log(st, 'shipSent', { ship: s.name, dest: HK.name(o) }, 'info');
  return { ok: true };
};
HK.buyBoat = function (st) {
  if (st.boats >= HK.CONST.BOAT_MAX) return { ok: false };
  if (st.money < HK.CONST.BOAT_PRICE) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'investments', -HK.CONST.BOAT_PRICE); st.boats++;
  return { ok: true };
};
HK.buyFishFromHuts = function (st, qty) {
  qty = Math.min(Math.floor(qty), st.hutFish || 0);
  if (qty <= 0) return { ok: false, msg: 'notEnoughStock' };
  if (HK.whFree(st) < qty) return { ok: false, msg: 'warehouseFull' };
  const p = Math.round(HK.GOOD.fish.base * 0.6), cost = p * qty;
  if (st.money < cost) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'market', -cost); st.hutFish -= qty; HK.addStock(st.warehouse.stock, 'fish', qty);
  return { ok: true, cost };
};

/* ---------- Passanten-Begegnungen ---------- */
HK.encounter = function (st, type) {
  const r = Math.random();
  switch (type) {
    case 'beggar': return { key: 'encBeggar', action: 'alms', cost: 20 };
    case 'monk': return { key: 'encMonk', action: 'alms', cost: 50 };
    case 'merchant': {
      const inc = st.incoming.find(i => !i.known);
      if (inc && r < 0.5) { inc.known = true; const o = HK.ORIGIN[inc.origin]; return { key: inc.sea ? 'rumorShip' : 'rumorCaravan', vars: { origin: HK.name(o), days: inc.days, goods: Object.keys(o.sell).map(HK.goodName).join(', ') } }; }
      const g = HK.pick(HK.GOODS.filter(x => HK.demandLabel(st, x.id) !== 'normalDemand'));
      return g ? { key: 'encMerchantTip', vars: { good: HK.goodName(g.id), label: HK.t(HK.demandLabel(st, g.id)) } } : { key: 'encMerchant' };
    }
    case 'fisher': return r < 0.5 ? { key: 'encFisher', action: 'cheapfish', cost: Math.round(HK.GOOD.fish.base * 0.5 * 10), qty: 10 } : { key: 'encFisherTalk' };
    case 'guard': return st.suspicion > 40 ? { key: 'encGuardSuspicious' } : { key: 'encGuard' };
    case 'child': return { key: 'encChild' };
    default: {
      if (r < 0.3) { const c = HK.pick(HK.councillors()); return { key: 'encGossip', vars: { name: c.name, loyalty: st.persons[c.id].loyalty > 50 ? HK.t('gossipFriendly') : HK.t('gossipCold') } }; }
      if (r < 0.5) return { key: 'encCitizenRep', vars: { rep: Math.round(st.rep) } };
      return { key: 'encCitizen' };
    }
  }
};
HK.encounterAction = function (st, enc) {
  if (enc.action === 'alms') {
    if (st.money < enc.cost) return { ok: false, msg: 'notEnoughMoney' };
    HK.book(st, 'church', -enc.cost); st.rep = HK.clamp(st.rep + 0.5, 0, 100); st.piety = HK.clamp(st.piety + 1, 0, 100);
    return { ok: true };
  }
  if (enc.action === 'cheapfish') {
    if (st.money < enc.cost) return { ok: false, msg: 'notEnoughMoney' };
    if (HK.whFree(st) < enc.qty) return { ok: false, msg: 'warehouseFull' };
    HK.book(st, 'market', -enc.cost); HK.addStock(st.warehouse.stock, 'fish', enc.qty);
    return { ok: true };
  }
  return { ok: false };
};

/* ---------- Stadtereignisse ---------- */
HK.TOWN_EVENTS = {
  famine:   { days: [20, 40], chance: 0.0012, cons: { grain: 1.6, fish: 1.3 } },
  plague:   { days: [30, 50], chance: 0.0006, cons: { beer: 0.6, cloth: 0.5, wine: 1.3, spices: 1.5 } },
  fire:     { days: [1, 1],   chance: 0.0015 },
  pirates:  { days: [1, 1],   chance: 0.0012 },
  storm:    { days: [1, 1],   chance: 0.004 },
  bishop:   { days: [1, 1],   chance: 0.0015 },
  levy:     { days: [1, 1],   chance: 0.0012 },
  goodCatch: { days: [5, 10], chance: 0.004, cons: { fish: 0.8 } },
  fair:     { days: [6, 10],  chance: 0.003, cons: { cloth: 1.6, furs: 1.5, spices: 1.5, wine: 1.3 } },
};
HK.fireEvent = function (st) {
  const mine = st.houses.filter(h => h.owner === 'player' && !h.damaged);
  if (mine.length && Math.random() < 0.5) { const h = HK.pick(mine); h.damaged = true; HK.log(st, 'fireHouse', { house: HK.name(HK.BUILDINGS.find(b => b.plot === h.id && b.panel === 'house')) }, 'bad'); }
  else { for (const g in st.warehouse.stock) st.warehouse.stock[g] = Math.floor(st.warehouse.stock[g] * 0.9); HK.log(st, 'fireWarehouse', {}, 'bad'); }
};
HK.triggerEvent = function (st, type) {
  const def = HK.TOWN_EVENTS[type];
  switch (type) {
    case 'fire': HK.fireEvent(st); return;
    case 'pirates':
      if (st.town.projects.wall) { HK.log(st, 'piratesRepelled', {}, 'good'); return; }
      st.ships = []; for (const g in st.town.stock) st.town.stock[g] *= 0.85;
      for (const g in st.warehouse.stock) st.warehouse.stock[g] = Math.floor(st.warehouse.stock[g] * 0.85);
      st.town.prosperity = HK.clamp(st.town.prosperity - 8, 0, 100);
      HK.log(st, 'piratesRaid', {}, 'bad'); return;
    case 'storm':
      for (const i of st.incoming) if (i.sea) i.days += 2;
      for (const s of st.ownShips) if (s.status === 'away') { s.hull = Math.max(5, s.hull - HK.rndi(10, 30)); for (const g in s.cargo) s.cargo[g] = Math.floor(s.cargo[g] * 0.8); }
      HK.log(st, 'stormEvent', {}, 'bad'); return;
    case 'bishop':
      if (st.piety >= 60) { st.rep = HK.clamp(st.rep + 10, 0, 100); st.piety = HK.clamp(st.piety + 5, 0, 100); st.influence += 5; HK.log(st, 'bishopPleased', {}, 'good'); }
      else { st.piety = HK.clamp(st.piety - 5, 0, 100); HK.log(st, 'bishopDispleased', {}, 'bad'); }
      return;
    case 'levy': {
      const amount = Math.round(Math.max(300, HK.netWorth(st) * 0.03));
      st.pendingLevy = { amount, until: st.day + 10 }; HK.log(st, 'levyDemand', { amount: HK.fmt(amount) }, 'event'); return;
    }
    default:
      st.town.events.push({ type, daysLeft: HK.rndi(def.days[0], def.days[1]) });
      HK.log(st, 'ev_' + type, {}, 'event');
  }
};
HK.payLevy = function (st) {
  if (!st.pendingLevy) return { ok: false };
  if (st.money < st.pendingLevy.amount) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'politics', -st.pendingLevy.amount); st.rep = HK.clamp(st.rep + 4, 0, 100); st.influence += 3; st.pendingLevy = null;
  return { ok: true };
};

/* ---------- Tagestick ---------- */
HK.tick = function (st) {
  if (st.gameOver) return;
  st.day++;
  st.ledger.push({}); if (st.ledger.length > 30) st.ledger.shift();
  const diff = HK.DIFFICULTY[st.difficulty];
  const winter = [11, 0, 1].includes(HK.monthOf(st.day));

  // Stadtwirtschaft
  st.town.sold = {};
  st.town.events = st.town.events.filter(e => --e.daysLeft > 0);
  let supply = 0, n = 0;
  for (const g of HK.GOODS) {
    const prod = g.prod * (0.7 + st.town.prosperity / 200) * HK.rnd(0.85, 1.15);
    const cons = g.cons * (st.town.pop / 6000) * HK.consMod(st, g.id) * HK.rnd(0.85, 1.15);
    let s = (st.town.stock[g.id] || 0) + prod - cons;
    const d = HK.desired(g.id);
    if (s < d * 0.8) s += (d * 0.8 - s) * 0.025; // Kleinhändler und Bauern aus dem Umland
    const cap = d * 4;
    if (s > cap) s = cap + (s - cap) * 0.5;
    st.town.stock[g.id] = Math.max(0, s);
    if (['grain', 'fish', 'beer', 'salt', 'timber', 'cloth'].includes(g.id)) { supply += HK.clamp(st.town.stock[g.id] / HK.desired(g.id), 0, 1.5); n++; }
  }
  const target = HK.clamp(supply / n * 70 + (st.town.projects.well ? 5 : 0) + (st.town.projects.wall ? 5 : 0), 10, 100);
  st.town.prosperity += (target - st.town.prosperity) * 0.03;
  st.town.pop = Math.round(st.town.pop * (1 + (st.town.prosperity - 50) * 0.00002));

  // Ankünfte
  const shipRate = 0.5 * diff.shipRate * (winter ? 0.45 : 1) * (HK.law(st, 'staple') ? 1.3 : 1) * (st.town.berths / 3);
  if (Math.random() < shipRate) HK.scheduleArrival(st, true);
  if (Math.random() < 0.25) HK.scheduleArrival(st, false);
  for (const inc of st.incoming.slice()) {
    inc.days--;
    if (inc.days <= 0) {
      const ok = inc.sea ? HK.dockShip(st, inc.origin) : HK.dockCaravan(st, inc.origin);
      if (ok) st.incoming = st.incoming.filter(x => x !== inc);
      else if (++inc.waiting > 5) { st.incoming = st.incoming.filter(x => x !== inc); if (inc.sea) HK.log(st, 'shipLeftNoBerth', { origin: HK.name(HK.ORIGIN[inc.origin]) }, 'bad'); }
    }
  }
  // Andere Kaufleute handeln mit den Besuchern; Zollpacht
  let tariffIncome = 0;
  for (const v of HK.visitors(st)) {
    for (const g in v.cargo) { const q = Math.floor(v.cargo[g].qty * 0.14); if (q > 0) { v.cargo[g].qty -= q; st.town.stock[g] += q; tariffIncome += q * v.cargo[g].price * HK.tariffRate(st); } }
    for (const g in v.wants) { const q = Math.min(Math.floor(v.wants[g].qty * 0.12), Math.floor(st.town.stock[g] * 0.3)); if (q > 0) { v.wants[g].qty -= q; st.town.stock[g] -= q; tariffIncome += q * v.wants[g].price * HK.tariffRate(st) * 0.5; } }
    for (const g in v.cargo) if (v.cargo[g].qty <= 0) delete v.cargo[g];
    for (const g in v.wants) if (v.wants[g].qty <= 0) delete v.wants[g];
    v.daysLeft--;
  }
  st.ships = st.ships.filter(v => v.daysLeft > 0);
  st.caravans = st.caravans.filter(v => v.daysLeft > 0);
  if (st.taxFarm) { if (st.taxFarm.until > st.day) HK.book(st, 'taxFarm', Math.round(tariffIncome)); else { st.taxFarm = null; HK.log(st, 'taxFarmEnded', {}, 'info'); } }

  // Werkstätten, Boote, Fischerhütten
  let wages = 0;
  for (const ws of st.workshops) {
    if (!ws.type) continue;
    const w = HK.WORKSHOP[ws.type];
    let can = true;
    for (const g in w.inp) if ((st.warehouse.stock[g] || 0) < w.inp[g]) can = false;
    if (can && HK.whFree(st) > 0) {
      for (const g in w.inp) HK.addStock(st.warehouse.stock, g, -w.inp[g]);
      HK.addStock(st.warehouse.stock, w.out, Math.min(w.qty, HK.whFree(st)));
      ws.idle = false; wages += w.wage;
    } else { ws.idle = true; wages += Math.round(w.wage / 2); }
  }
  if (st.boats) { const q = Math.min(st.boats * HK.CONST.BOAT_FISH * (winter ? 0.5 : 1), HK.whFree(st)); if (q > 0) HK.addStock(st.warehouse.stock, 'fish', Math.floor(q)); wages += st.boats * 4; }
  st.hutFish = HK.rndi(10, 40);
  if (wages) HK.book(st, 'wages', -wages);

  // Mieten, Taverne, Badehaus, Amt
  let rent = 0; for (const h of st.houses) if (h.owner === 'player') rent += HK.houseRent(st, h);
  if (rent) HK.book(st, 'rent', rent);
  if (st.tavernOwned) { HK.book(st, 'tavern', HK.tavernIncome(st)); st.piety = HK.clamp(st.piety - 0.03, 0, 100); }
  if (st.bathhouseOwned) { const inc = HK.bathIncome(st); if (inc) { HK.book(st, 'bathhouse', inc); st.piety = HK.clamp(st.piety - 0.08, 0, 100); } }
  if (st.seat !== 'none') {
    HK.book(st, 'office', st.seat === 'mayor' ? 15 : 5);
    if (st.acceptBribes) { HK.book(st, 'office', st.seat === 'mayor' ? 60 : 25); st.suspicion = HK.clamp(st.suspicion + 0.35, 0, 100); }
  }
  // Darlehen
  if (st.loan) HK.book(st, 'interest', -Math.round(st.loan * HK.CONST.LOAN_RATE_DAILY));
  for (const l of st.loansOut.slice()) {
    if (l.defaulted || l.due > st.day) continue;
    if (Math.random() < l.risk) { l.defaulted = true; HK.log(st, 'loanDefault', { name: l.name, amount: HK.fmt(l.amount) }, 'bad'); }
    else {
      const back = Math.round(l.amount * (1 + l.interest / 100)); HK.book(st, 'lending', back); st.rep = HK.clamp(st.rep + 0.5, 0, 100);
      if (HK.law(st, 'usuryBan')) st.suspicion = HK.clamp(st.suspicion + 4, 0, 100);
      st.loansOut = st.loansOut.filter(x => x.id !== l.id); HK.log(st, 'loanRepaid', { name: l.name, amount: HK.fmt(back) }, 'good');
    }
  }
  if (st.day % 10 === 0) { st.loanOffers = st.loanOffers.filter(() => Math.random() < 0.6); HK.refreshLoanOffers(st); }

  // Eigene Schiffe
  for (const s of st.ownShips) {
    if (s.status !== 'away') continue;
    s.daysLeft--;
    const o = HK.ORIGIN[s.dest];
    if (s.phase === 'out' && s.daysLeft <= o.days + 1) {
      s.phase = 'back';
      if (Math.random() < 0.05) { s.cargo = {}; s.hull = Math.max(5, s.hull - 25); HK.log(st, 'expeditionPirates', { ship: s.name }, 'bad'); }
      let rev = 0;
      for (const g in s.cargo) rev += s.cargo[g] * Math.round(HK.GOOD[g].base * (o.want[g] ? 0.75 + o.want[g] * 0.4 : 0.8));
      s.cargo = {}; s.revenue = rev;
      if (s.bringBack) { const price = Math.round(HK.GOOD[s.bringBack].base * o.sell[s.bringBack]); const q = Math.min(120, Math.floor(rev / price)); if (q > 0) { s.cargo[s.bringBack] = q; rev -= q * price; } }
      s.cash = rev;
    }
    if (s.daysLeft <= 0) {
      s.status = 'port'; s.hull = Math.max(5, s.hull - HK.rndi(5, 12));
      if (s.cash) HK.book(st, 'expedition', Math.round(s.cash));
      HK.log(st, 'shipReturned', { ship: s.name, revenue: HK.fmt(s.revenue || 0), cargo: Object.keys(s.cargo).map(g => s.cargo[g] + ' ' + HK.goodName(g)).join(', ') || '–' }, 'good');
      s.cash = 0; s.revenue = 0; s.dest = null;
    }
  }

  // Kirche: wöchentlicher Bedarf, Werte driften
  if (st.day - st.church.supplyDay >= 7) { st.church.supply = { wax: HK.rndi(6, 14), wine: HK.rndi(5, 10) }; st.church.supplyDay = st.day; }
  st.piety += (30 - st.piety) * 0.003; st.rep += (30 - st.rep) * 0.002;
  st.suspicion = HK.clamp(st.suspicion - 0.15, 0, 100);
  st.influence += 0.1 + st.rep / 300 + (st.seat === 'mayor' ? 1 : st.seat === 'councillor' ? 0.5 : 0);
  for (const pid in st.persons) st.persons[pid].loyalty = HK.clamp(st.persons[pid].loyalty - 0.05, 0, 100);
  // Konkurrenten
  for (const r of st.rivals) r.wealth = Math.round(r.wealth * (1 + (0.0007 + st.town.prosperity * 0.000006) * HK.rnd(0.6, 1.4)) + HK.visitors(st).length * 30);

  // Vogtei
  if (st.investigation) {
    if (--st.investigation.days <= 0) {
      const fine = Math.round(Math.max(500, Math.max(0, st.money) * 0.1));
      HK.book(st, 'fines', -fine); st.rep = HK.clamp(st.rep - 8, 0, 100); st.suspicion = HK.clamp(st.suspicion - 25, 0, 100); st.investigation = null;
      HK.log(st, 'investigationFine', { fine: HK.fmt(fine) }, 'bad');
    }
  } else if (st.suspicion >= 50 && Math.random() < 0.06 * (1 - st.persons.bailiff.loyalty / 130)) {
    st.investigation = { days: 10 }; HK.log(st, 'investigationOpened', {}, 'bad');
  }
  if (st.suspicion >= 85) {
    const fine = Math.round(Math.max(1000, Math.max(0, st.money) * 0.25));
    HK.book(st, 'fines', -fine); st.rep = HK.clamp(st.rep - 20, 0, 100); st.suspicion = 30; st.investigation = null;
    if (st.seat !== 'none') { st.seat = 'none'; }
    HK.log(st, 'trial', { fine: HK.fmt(fine) }, 'bad');
  }
  if (st.pendingLevy && st.pendingLevy.until <= st.day) { st.pendingLevy = null; st.rep = HK.clamp(st.rep - 6, 0, 100); st.influence = Math.max(0, st.influence - 5); HK.log(st, 'levyIgnored', {}, 'bad'); }

  // Zufallsereignisse
  for (const type in HK.TOWN_EVENTS) {
    if (st.town.events.some(e => e.type === type)) continue;
    if (Math.random() < HK.TOWN_EVENTS[type].chance * diff.eventRate) { HK.triggerEvent(st, type); break; }
  }

  // Verlauf, Rang, Sieg, Bankrott
  if (st.day % 5 === 0) { st.history.push({ day: st.day, worth: HK.netWorth(st) }); if (st.history.length > 400) st.history.splice(0, st.history.length - 400); }
  const worth = HK.netWorth(st);
  while (st.rank + 1 < HK.RANKS.length && worth >= HK.RANKS[st.rank + 1].worth) { st.rank++; HK.log(st, 'promoted', { rank: HK.name(HK.RANKS[st.rank]) }, 'good'); }
  if (!st.won && st.seat === 'mayor' && worth >= 500000 && st.rivals.every(r => r.wealth < worth)) { st.won = true; HK.log(st, 'won', {}, 'good'); if (HK.onWin) HK.onWin(); }
  if (st.money < 0) { if (++st.negDays >= HK.CONST.BANKRUPT_DAYS) { st.gameOver = true; HK.log(st, 'bankrupt', {}, 'bad'); if (HK.onGameOver) HK.onGameOver(); } }
  else st.negDays = 0;
};

HK.ledgerTotals = function (st) {
  const t = {};
  for (const day of st.ledger) for (const k in day) t[k] = (t[k] || 0) + day[k];
  return t;
};

HK.SAVE_KEY = 'hanse-kontor-v2';
HK.serialize = st => JSON.stringify(st);
HK.deserialize = function (json) { const s = JSON.parse(json); if (!s || s.version !== 2 || !s.town) throw new Error('bad save'); return s; };
