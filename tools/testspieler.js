/* Geskripteter Testspieler für Hanse-Kontor: spielt einen Weg (path) über N Jahre headless und druckt Jahreskurven.
   Aufruf: node tools/testspieler.js [merchant|shipowner|patron|mayor|alderman|nightlord|all] [Seeds] [Jahre] [easy|normal|hard]  */
'use strict';
const fs = require('fs'), vm = require('vm');
const ROOT = process.env.HK_ROOT || require('path').join(__dirname, '..');
const args = process.argv.slice(2);
const PATH = args[0] || 'all', SEEDS = +(args[1] || 3), YEARS = +(args[2] || 20), DIFF = args[3] || 'normal', QUIET = args.includes('--csv');

function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function load(seed) {
  const M = Object.create(Math); M.random = seeded(seed);
  const ctx = { console, Intl, Math: M, Date, JSON }; vm.createContext(ctx);
  for (const f of ['data', 'town', 'i18n', 'game', 'paths', 'rivals', 'contracts', 'sea', 'family', 'offices', 'faith', 'deals', 'staff', 'burghers', 'chains']) vm.runInContext(fs.readFileSync(ROOT + '/js/' + f + '.js', 'utf8'), ctx, { filename: f });
  vm.runInContext('globalThis.HK = HK', ctx);
  return ctx.HK;
}

/* ---------- Der Spieler ---------- */
function makeBot(HK, st, path) {
  const basis = { salt: 40, beer: 48 }, held = {}; // Einstandspreise, Haltebeginn
  const acc = {}; const origBook = HK.book; HK.book = (s, src, amt) => { acc[src] = (acc[src] || 0) + amt; origBook(s, src, amt); };
  const T = { events: {}, invest: [], titleYear: null, seatYear: {}, trials: 0, caught: 0, decisions: [] };
  const P = {
    merchant: { ships: 2, politics: 'council', craft: false, smuggle: false },
    shipowner: { ships: 5, politics: 'none', craft: true, smuggle: false },
    patron: { ships: 1, politics: 'none', craft: false, smuggle: false },
    mayor: { ships: 1, politics: 'mayor', craft: false, smuggle: false },
    alderman: { ships: 1, politics: 'none', craft: true, smuggle: false },
    nightlord: { ships: 1, politics: 'none', craft: false, smuggle: true },
  }[path];
  const B = HK.GOOD;
  const wantPrice = (o, g) => Math.round(B[g].base * HK.wantFactor(o.want[g])); // was ein Ort im Mittel zahlt
  const bestWant = {}; for (const g of HK.GOODS) { let b = 0; for (const o of HK.ORIGINS) if (o.want[g.id]) b = Math.max(b, wantPrice(o, g.id)); bestWant[g.id] = b; }
  const stock = g => Math.floor(st.warehouse.stock[g] || 0);
  const reserve = () => 600 + 40 * (st.workshops.filter(w => w.type).length * 20 + st.ownShips.length * 8 + st.boats * 4 + (st.militia ? 12 : 0) + Object.keys(st.kontors || {}).length * 15) + st.loan * 0.02;
  const free = () => st.money - reserve();
  const reservedFor = g => st.contracts.active.filter(c => c.type === 'deliver' && c.good === g).reduce((a, c) => a + c.qty, 0);
  const maxHold = g => HK.clamp(Math.round(20000 / B[g].base), 30, 200);
  const noteBuy = (g, q, p) => { const have = stock(g) - q; basis[g] = have > 0 && basis[g] ? (basis[g] * have + p * q) / (have + q) : p; if (!held[g]) held[g] = st.day; };
  const tariff = () => HK.tariffRate(st) * (1 - HK.customsDiscount(st));
  const smuggleOk = (value) => P.smuggle && !st.investigation && value >= 2000 && (st.suspicion < 30 || (st.watchUntil > st.day && st.suspicion < 50));
  const workshopInputs = () => { const need = {}; for (const w of st.workshops) if (w.type) for (const g in HK.WORKSHOP[w.type].inp) need[g] = (need[g] || 0) + HK.WORKSHOP[w.type].inp[g]; return need; };

  function trade() {
    const need = workshopInputs();
    // 1. Verkaufen an Besucher (bester Preis) oder Markt
    for (const g of HK.GOODS.map(x => x.id)) {
      let q = stock(g) - reservedFor(g) - (need[g] || 0) * 10; if (q <= 0) continue;
      const cost = basis[g] || B[g].base * 0.8;
      let best = null;
      for (const v of HK.visitors(st)) if (v.wants[g] && v.wants[g].price > (best ? best.price : 0)) best = { v, price: v.wants[g].price, qty: v.wants[g].qty };
      const mp = HK.marketSellPrice(st, g, Math.min(q, 20)), mcap = HK.marketCap(st, g);
      const old = held[g] && st.day - held[g] > 120;
      const floor = cost * (old ? 0.9 : 1.08);
      if (best && best.price >= floor && best.price >= mp) { const n = Math.min(q, best.qty); const r = HK.sellToVisitor(st, best.v, g, n, smuggleOk(best.price * n * 0.5) && tariff() > 0.03); if (r.ok) { q -= n; if (r.caught) T.caught++; } }
      if ((g === 'fish' || g === 'smokedfish') && q > 0) { const fp = HK.fishmarketPrice(st, g); if (fp >= floor) { const r = HK.fishmarketSell(st, g, q); if (r.ok) q -= r.qty; } }
      if (q > 0 && mcap > 0 && mp >= floor) { const n = Math.min(q, mcap); if (HK.marketSell(st, g, n).ok) q -= n; }
      if (q > 0 && P.smuggle && HK.hasVenture(st, 'dive') && st.suspicion < 45) { const fp = HK.fencePrice(st, g); if (fp >= floor && fp > mp) HK.fenceSell(st, g, q); }
      if (stock(g) <= 0) delete held[g];
    }
    // 2. Kaufen von Besuchern: günstig gegenüber dem, was andere zahlen
    for (const v of HK.visitors(st)) for (const g in v.cargo) {
      const c = v.cargo[g]; const smug = smuggleOk(c.price * Math.min(c.qty, 40)) && tariff() > 0.03; const eff = c.price * (1 + (smug ? 0 : tariff()));
      const resale = Math.max(HK.marketSellPrice(st, g, 10), bestWant[g] * 0.9);
      if (eff > resale * 0.8) continue;
      const n = Math.min(c.qty, HK.whFree(st) - 10, Math.floor(free() * 0.7 / eff), maxHold(g) - stock(g));
      if (n >= 3) { const r = HK.buyFromVisitor(st, v, g, n, smug); if (r.ok) { noteBuy(g, n, eff); if (r.caught) T.caught++; } }
    }
    // 3. Markt: Überschuss günstig kaufen, Werkstattbedarf decken
    for (const g of HK.GOODS.map(x => x.id)) {
      const p = HK.marketBuyPrice(st, g, 10);
      const wantIn = (need[g] || 0) * 12 - stock(g);
      if (wantIn > 0 && p < B[g].base * 1.25 && free() > p * wantIn) { const n = Math.min(wantIn, st.town.stock[g] * 0.5 | 0, HK.whFree(st) - 5); if (n > 0 && HK.marketBuy(st, g, n).ok) noteBuy(g, n, p); continue; }
      if (p < B[g].base * 0.72 && bestWant[g] > p * 1.5 && stock(g) < maxHold(g) * 0.5 && free() > p * 30) { const n = Math.min(20, HK.whFree(st) - 10); if (n > 0 && HK.marketBuy(st, g, n).ok) noteBuy(g, n, p); }
    }
    // 4. Kloster, Fischerhütten
    if (path === 'patron' || free() > 3000) for (const g of ['beer', 'wax']) { const p = HK.monkPrice(st, g); if (p < bestWant[g] * 0.7 && HK.whFree(st) > 20) { const r = HK.buyFromMonks(st, g, 12); if (r.ok) noteBuy(g, r.qty, p); } }
    if (HK.hasVenture(st, 'smokery') && st.hutFish > 10 && HK.whFree(st) > 30 && free() > 1000) { const r = HK.buyFishFromHuts(st, Math.min(st.hutFish, 20)); if (r.ok) noteBuy('fish', 20, 24); }
  }

  function contracts() {
    const C = st.contracts;
    for (const c of C.offers.slice()) {
      if (C.active.length >= 3) break;
      if (c.shady && !P.smuggle) continue;
      if (st.money < 3000) break;
      if (c.type === 'voyage') { if (st.ownShips.some(s => s.status === 'port' && s.hull >= 50) && !C.active.some(x => x.type === 'voyage')) HK.acceptContract(st, c.id); continue; }
      const mb = HK.marketBuyPrice(st, c.good, c.qty);
      if (stock(c.good) >= c.qty || (st.town.stock[c.good] > c.qty * 2 && mb * 1.05 < c.price && free() > mb * c.qty)) HK.acceptContract(st, c.id);
    }
    for (const c of C.active.slice()) {
      if (c.type !== 'deliver') continue;
      if (stock(c.good) >= c.qty) { HK.deliverContract(st, c.id); continue; }
      const miss = c.qty - stock(c.good), mb = HK.marketBuyPrice(st, c.good, miss);
      if (mb < c.price * 0.97 && free() > mb * miss && HK.whFree(st) >= miss && st.town.stock[c.good] >= miss) { if (HK.marketBuy(st, c.good, miss).ok) { noteBuy(c.good, miss, mb); HK.deliverContract(st, c.id); } }
      else if (st.day > c.deadline - 3 && free() > mb * miss * 1.5 && HK.whFree(st) >= miss && st.town.stock[c.good] >= miss) { if (HK.marketBuy(st, c.good, miss).ok) HK.deliverContract(st, c.id); }
    }
  }

  function ships() {
    for (const s of st.ownShips) {
      if (s.status !== 'port') continue;
      if (s.hull < 70 && free() > 2000) HK.repairShip(st, s.id);
      if (!s.captain && st.captainOffers.length && free() > 1500) { const o = st.captainOffers.find(c => ['navigator', 'fighter', 'steady', 'smuggler'].includes(c.trait)); if (o) HK.hireCaptain(st, s.id, o.id); }
      if (s.hull < 30) continue;
      // Ziel wählen: erwarteter Gewinn aus Lagerware + Marktzukauf
      let best = null;
      for (const o of HK.ORIGINS.filter(x => x.sea)) {
        let cap = HK.shipCap(s), profit = 0, plan = [];
        const goods = Object.keys(o.want).sort((a, b) => wantPrice(o, b) - wantPrice(o, a));
        for (const g of goods) {
          const wp = wantPrice(o, g) * (st.kontors[o.id] ? 1.25 : 1);
          let have = Math.min(cap, Math.max(0, stock(g) - reservedFor(g)));
          if (have > 0) { plan.push({ g, q: have, src: 'wh' }); profit += have * (wp - (basis[g] || B[g].base * 0.8)); cap -= have; }
          const mb = HK.marketBuyPrice(st, g, 30);
          if (cap > 0 && mb * 1.1 < wp) { const q = Math.min(cap, Math.floor(st.town.stock[g] * 0.4), Math.floor(free() * 0.5 / mb)); if (q > 5) { plan.push({ g, q, src: 'mk', p: mb }); profit += q * (wp - mb); cap -= q; } }
        }
        let back = null, bm = 0; for (const g in o.sell) { const bp = B[g].base * o.sell[g], home = Math.max(HK.marketSellPrice(st, g, 20), bestWant[g] * 0.85); if (home / bp > bm) { bm = home / bp; back = g; } }
        profit -= o.days * 2 * 15;
        const vc = st.contracts.active.find(c => c.type === 'voyage' && c.dest === o.id && !c.shipId); if (vc) profit += vc.reward;
        if (!best || profit > best.profit) best = { o, profit, plan, back: bm > 1.25 ? back : null };
      }
      if (!best || best.profit < (st.contracts.active.some(c => c.type === 'voyage' && !c.shipId) ? -300 : 500)) { if (HK.hasMarque(st) && s.hull >= 50 && !HK.stockUsed(s.cargo)) HK.privateer(st, s.id); continue; }
      for (const p of best.plan) { if (p.src === 'mk') { if (!HK.marketBuy(st, p.g, p.q).ok) continue; } HK.loadShip(st, s.id, p.g, p.q); }
      if (HK.stockUsed(s.cargo) < 10) { for (const g in s.cargo) HK.unloadShip(st, s.id, g, s.cargo[g]); continue; }
      HK.sendShip(st, s.id, best.o.id, best.back);
    }
    // Rückfracht als Einstand buchen
    for (const s of st.ownShips) if (s.status === 'port' && HK.stockUsed(s.cargo) > 0) for (const g in s.cargo) { const q = Math.min(s.cargo[g], HK.whFree(st)); if (q > 0) { HK.unloadShip(st, s.id, g, q); noteBuy(g, q, B[g].base * 0.75); } }
  }

  function politics() {
    // Liquidität: Darlehen aufnehmen, notfalls verkaufen
    if (st.money < 200) { const lim = HK.loanLimit(st); if (lim >= 500) HK.takeLoan(st, Math.min(lim, 3000 - st.money)); }
    if (st.money < -500) { const sh = st.ownShips.find(x => x.status === 'port'); if (sh) HK.sellOwnShip(st, sh.id); else { const h = st.houses.find(x => x.owner === 'player' && x.id !== 2); if (h) HK.sellHouse(st, h.id); else { const vid = Object.keys(st.ventures).find(id => !st.ventures[id].owner); if (vid) HK.sellVenture(st, vid); } } }
    if (st.pendingLevy && st.money > st.pendingLevy.amount + 500) HK.payLevy(st);
    if (st.investigation && st.money > 4000 && (P.smuggle || st.suspicion > 60)) HK.bribeBailiff(st);
    if ((st.suspicion > 60 || (P.smuggle && st.suspicion > 42)) && free() > 2500) HK.indulgence(st);
    if (st.pendingDecision) {
      const d = st.pendingDecision; let choice;
      if (d.chain === 'vitalien' && d.stage === 'offer') choice = P.smuggle ? 'buy' : 'report';
      if (d.chain === 'vitalien' && d.stage === 'council') choice = st.ownShips.some(s => s.status === 'port') && path === 'shipowner' ? 'lead' : (free() > 4000 && (path === 'mayor' || path === 'merchant') ? 'fund' : 'stayout');
      if (d.chain === 'plague' && d.stage === 'hospital') choice = free() > 2500 ? 'donate' : 'refuse';
      if (d.chain === 'plague' && d.stage === 'procession') choice = path === 'patron' || path === 'mayor' ? 'join' : 'stay';
      if (d.chain === 'bishop' && d.stage === 'council') choice = path === 'patron' ? 'tithe' : (path === 'mayor' && st.influence >= 40 ? 'mediate' : 'council');
      if (d.chain === 'bishop' && d.stage === 'settlement') choice = (path === 'patron' || path === 'mayor') && free() > 6000 ? 'fund' : (path === 'merchant' && free() > 5000 ? 'farm' : 'stayout');
      if (d.chain === 'hansetag' && d.stage === 'envoy') choice = st.rep >= 60 && free() > 4000 ? 'go' : (st.rivals.some(r => r.ally) ? 'delegate' : 'decline');
      if (d.chain === 'feud' && d.stage === 'council') choice = st.militia ? 'militia' : (free() > 6000 ? 'peace' : 'ignore');
      if (d.chain === 'uprising' && d.stage === 'council') choice = path === 'alderman' ? 'lead' : (st.influence >= 30 ? 'mediate' : (st.militia && path === 'mayor' ? 'militia' : 'hide'));
      if (d.chain === 'hansetag' && d.stage === 'negotiation') choice = free() > 15000 ? 'bribe' : (st.influence >= 25 ? 'plead' : 'stand');
      const r = HK.decide(st, d.chain, choice); if (!r.ok) HK.decide(st, d.chain, { offer: 'ignore', council: d.chain === 'bishop' ? 'council' : 'stayout', hospital: 'refuse', procession: 'stay', settlement: 'stayout', envoy: 'decline', negotiation: 'stand' }[d.stage] || (d.chain === 'feud' ? 'ignore' : d.chain === 'uprising' ? 'hide' : undefined));
      T.decisions.push(d.chain + ':' + d.stage + ':' + choice);
    }
    if (st.family.offer) HK.answerOffer(st, true);
    if (st.family.children.length && st.family.heir === null || st.family.heir === undefined && st.family.children.length) HK.chooseHeir(st, 0);
    if (P.politics === 'none' && path !== 'patron') { if (st.day % 30 === 0 && free() > 8000) HK.donate(st, 300); return; }
    // Ruf und Räte pflegen
    if (st.day % 10 === 0 && free() > 3000) HK.donate(st, Math.min(600, free() * 0.04));
    if (st.day % 6 === 0 && free() > 4000 && !st.titles[path]) { const c = HK.councillors().map(c => c.id).filter(id => st.persons[id].loyalty < 75).sort((a, b) => st.persons[a].loyalty - st.persons[b].loyalty)[0]; if (c && HK.giftCost(st, c) < free() * 0.1) HK.gift(st, c); }
    if (st.day % 20 === 0 && st.persons.priest.loyalty >= 40 && st.rep < 60 && free() > 3000) HK.sermon(st, 'favor');
    if (P.politics !== 'none' && st.seat !== 'mayor' && st.day % 15 === 0) { const wantMayor = st.seat === 'councillor'; if (P.politics === 'mayor' || !wantMayor) { const cost = wantMayor ? 6000 : 3000; if (free() > cost + 2000) { const r = HK.runForSeat(st); if (r.ok && r.won) T.seatYear[st.seat] = st.day / 365; } } }
    const loyal = HK.councillors().filter(c => st.persons[c.id].loyalty >= 60).length;
    if (st.influence >= 45 && st.day % 7 === 0 && loyal >= 4) {
      if (path === 'mayor' && !HK.law(st, 'staple')) HK.propose(st, 'staple', 1);
      else if (path === 'merchant' && HK.law(st, 'monopoly') === 'none' && st.seat !== 'none') HK.propose(st, 'monopoly', 'salt');
      else if (path === 'mayor' && HK.law(st, 'tariff') !== 5 && st.taxFarm === null) HK.propose(st, 'tariff', 5);
    }
  }

  // Investitionen: je Tag höchstens eine; Liste je Weg in Reihenfolge
  function investList() {
    const L = [];
    const v = (id, cond) => { if (cond === false || HK.hasVenture(st, id) || (HK.VENTURE[id].craft && !st.craftGuild)) return; const cur = st.ventures[id]; if (cur && cur.owner) { const r = st.rivals.find(x => x.id === cur.owner); if (r && r.attitude < 20) { if (st.day - (r.lastMeet || -99) > 20) L.push([HK.meetCost(st, r), () => HK.meetRival(st, r.id)]); return; } L.push([Math.round(HK.VENTURE[id].cost * 1.4), () => HK.buyVenture(st, id)]); return; } L.push([HK.ventureCost(st, HK.VENTURE[id]), () => HK.buyVenture(st, id)]); };
    const ws = type => { const plot = st.workshops.find(w => !w.type); if (!plot) return; if (!st.guildMember) L.push([HK.CONST.GUILD_FEE, () => HK.joinGuild(st)]); else if (!st.licenses[type]) L.push([HK.WORKSHOP[type].license, () => HK.buyLicense(st, type)]); else L.push([HK.WORKSHOP[type].cost, () => HK.buildWorkshop(st, plot.plot, type)]); };
    const ship = type => { if (st.ownShips.length < P.ships && (st.ownShips.length < 2 || (acc.expedition || 0) > st.ownShips.length * 4000 * Math.max(1, st.day / 365))) L.push([HK.shipTypePrice(st, type), () => HK.buyShip(st, type)]); };
    const storage = () => { const i = st.storages.findIndex(s => s.owner === 'npc'); if (i >= 0) L.push([HK.STORAGES[i].price, () => HK.buyStorage(st, i)]); };
    const house = () => { const h = st.houses.find(h => h.owner === 'npc'); if (h) L.push([HK.housePrice(st, h), () => HK.buyHouse(st, h.id)]); else { const u = st.houses.find(h => h.owner === 'player' && h.level < 3); if (u) L.push([HK.CONST.HOUSE_UPGRADE, () => HK.upgradeHouse(st, u.id)]); } };
    // Bürgerhäuser: kaufen, was angeboten wird, und Schäden sofort beheben
    const burgher = () => {
      const dmg = HK.burgherOwned(st).find(id => st.burghers[id].damaged);
      if (dmg) { L.push([HK.CONST.BURGHER_REPAIR, () => HK.repairBurgher(st, dmg)]); return; }
      const off = Object.keys(st.burghers).find(id => HK.burgherForSale(st, st.burghers[id]));
      if (off) L.push([st.burghers[off].sale.price, () => HK.buyBurgher(st, off)]);
    };
    burgher();
    const craft = () => { if (!st.craftGuild) L.push([HK.CONST.CRAFT_FEE, () => HK.joinCraftGuild(st)]); };
    const project = id => { if (!st.town.projects[id]) L.push([HK.PROJECTS.find(p => p.id === id).cost, () => HK.fundProject(st, id)]); };
    const church = id => { if (!st.church.projects[id]) L.push([HK.CHURCH_PROJECTS.find(p => p.id === id).cost, () => HK.churchProject(st, id)]); };
    if (st.stalls < 1) L.push([HK.CONST.STALL_COST, () => HK.buyStall(st)]);
    if (!st.factor && (path === 'merchant' || path === 'alderman') && st.day > 200) L.push([HK.CONST.FACTOR_COST, () => HK.hireFactor(st)]);
    if (st.warehouse.cap < 700) L.push([HK.CONST.WAREHOUSE_EXPAND_COST, () => HK.expandWarehouse(st)]);
    for (const h of st.houses) if (h.owner === 'player' && h.damaged) L.push([800, () => HK.repairHouse(st, h.id)]);
    switch (path) {
      case 'merchant':
        if (st.stalls < 3) L.push([HK.CONST.STALL_COST, () => HK.buyStall(st)]);
        storage(); ws('brewery'); project('harbour'); L.push([HK.CONST.TAVERN_PRICE, () => st.tavernOwned ? { ok: false } : HK.buyTavern(st)]); storage(); house(); ship('kogge'); if (st.town.berths < 5) L.push([HK.CONST.EXTRA_BERTH, () => HK.buyExtraBerth(st)]);
        if (st.rank >= 2 && !st.kontors.luebeck) L.push([HK.CONST.KONTOR_PRICE, () => HK.buyKontor(st, 'luebeck')]);
        if (st.warehouse.cap < 1300) L.push([HK.CONST.WAREHOUSE_EXPAND_COST, () => HK.expandWarehouse(st)]);
        ws('smokehouse'); house(); if (st.rank >= 2 && !st.kontors.bruegge) L.push([HK.CONST.KONTOR_PRICE, () => HK.buyKontor(st, 'bruegge')]);
        if (st.rank >= 1 && !HK.hasTreaty(st, 'luebeck')) L.push([HK.CONST.TREATY_COST, () => HK.signTreaty(st, 'luebeck')]);
        break;
      case 'shipowner':
        ship('schnigge'); craft(); v('ropewalk'); ship('kogge'); v('sailmaker'); v('timberyard'); ship('kogge'); ship('holk'); ship('holk'); if (st.rank >= 2 && !st.kontors.luebeck) L.push([HK.CONST.KONTOR_PRICE, () => HK.buyKontor(st, 'luebeck')]);
        if (st.blessedUntil <= st.day && st.ownShips.some(s => s.status === 'port')) L.push([HK.CONST.BLESSING_COST, () => HK.blessShips(st)]);
        if (!st.militia && st.ownShips.length >= 3) L.push([HK.CONST.MILITIA_COST, () => HK.fundMilitia(st)]);
        if (st.rank >= 2 && !st.kontors.bruegge) L.push([HK.CONST.KONTOR_PRICE, () => HK.buyKontor(st, 'bruegge')]);
        if (!HK.hasMarque(st) && st.rep >= 50 && st.ownShips.length >= 3) L.push([HK.CONST.MARQUE_COST, () => HK.buyMarque(st)]);
        break;
      case 'patron':
        house(); church('altar'); v('inn'); if (st.day % 20 === 0 && free() > 6000) L.push([1000, () => HK.donate(st, 1000)]); if (st.relicDay === undefined) L.push([HK.CONST.RELIC_COST, () => HK.donateRelic(st)]); if (!st.brotherhood && st.piety >= 50 && st.rep >= 40) L.push([HK.CONST.BROTHERHOOD_COST, () => HK.foundBrotherhood(st)]); church('bells'); storage(); if (!st.hospitalEndowed) L.push([HK.CONST.HOSPITAL_ENDOW, () => HK.hospitalEndow(st)]); church('chapel'); if (!st.churchBuild.done.aisle && !st.churchBuild.active) L.push([12000, () => HK.startChurchBuild(st, 'aisle')]); if (!st.pilgrimage) L.push([HK.CONST.PILGRIMAGE_COST, () => HK.callPilgrimage(st)]); v('stables'); house(); if (st.churchBuild.done.aisle && !st.churchBuild.done.tower && !st.churchBuild.active) L.push([20000, () => HK.startChurchBuild(st, 'tower')]); ship('kogge');
        if (st.day % 30 === 0 && free() > 8000) L.push([HK.CONST.HOSPITAL_DONATION, () => HK.hospitalDonate(st)]);
        break;
      case 'mayor':
        house(); project('well'); L.push([HK.CONST.TAVERN_PRICE, () => st.tavernOwned ? { ok: false } : HK.buyTavern(st)]); if (!st.schoolEndowed) L.push([HK.CONST.SCHOOL_ENDOW, () => HK.schoolEndow(st)]); if (!st.hospitalEndowed) L.push([HK.CONST.HOSPITAL_ENDOW, () => HK.hospitalEndow(st)]); if (!st.militia) L.push([HK.CONST.MILITIA_COST, () => HK.fundMilitia(st)]); house(); project('harbour'); if (st.town.berths < 5) L.push([HK.CONST.EXTRA_BERTH, () => HK.buyExtraBerth(st)]); storage(); project('wall'); ship('kogge');
        if (!st.taxFarm && st.seat !== 'none' && HK.taxFarmPrice(st) < free() * 0.5) L.push([HK.taxFarmPrice(st), () => HK.buyTaxFarm(st)]);
        if (st.seat === 'mayor') for (const pid of ['customs', 'bailiff', 'harbourmaster']) if (HK.canAppoint(st, pid) && HK.officeHolder(st, pid) === 'default' && st.influence >= 30) L.push([HK.CONST.OFFICE_COST, () => HK.appointOffice(st, pid, 'own')]);
        break;
      case 'alderman':
        craft(); v('potter'); v('bakery'); v('butcher'); ws('brewery'); v('cooper'); v('apothecary'); v('ropewalk'); ws('smokehouse'); v('sailmaker'); v('dyer'); ws('weaver'); v('timberyard'); v('inn'); v('goldsmith');
        if (!st.masterTitle && HK.ventureCount(st) >= 3) L.push([HK.CONST.MASTER_TITLE, () => HK.masterTitle(st)]);
        if (st.apprenticesUntil <= st.day && st.craftGuild && HK.ventureCount(st) >= 2) L.push([HK.CONST.APPRENTICES, () => HK.hireApprentices(st)]);
        for (const id in st.ventures) if (!st.ventures[id].owner) { if (st.ventures[id].level < 3) L.push([HK.VENTURE[id].cost * 0.5, () => HK.upgradeVenture(st, id)]); if (!st.ventures[id].master) L.push([HK.CONST.MASTER_COST, () => HK.hireMaster(st, id)]); }
        project('well'); if (!st.hospitalEndowed) L.push([HK.CONST.HOSPITAL_ENDOW, () => HK.hospitalEndow(st)]); ship('kogge');
        break;
      case 'nightlord':
        v('dive'); L.push([HK.CONST.TAVERN_PRICE, () => st.tavernOwned ? { ok: false } : HK.buyTavern(st)]); L.push([HK.CONST.BATHHOUSE_PRICE, () => st.bathhouseOwned ? { ok: false } : HK.buyBathhouse(st)]); house(); storage(); ship('kogge');
        if (st.day % 5 === 0 && st.persons.bailiff.loyalty < 70 && HK.giftCost(st, 'bailiff') < free() * 0.1) L.push([HK.giftCost(st, 'bailiff'), () => HK.gift(st, 'bailiff')]);
        if (st.day % 5 === 2 && st.persons.customs.loyalty < 80 && HK.giftCost(st, 'customs') < free() * 0.1) L.push([HK.giftCost(st, 'customs'), () => HK.gift(st, 'customs')]);
        if (HK.hasVenture(st, 'dive') && st.watchUntil <= st.day) L.push([HK.CONST.WATCH_BRIBE, () => HK.bribeWatch(st)]);
        if (HK.hasVenture(st, 'dive') && free() > 20000) for (const p of ['customs', 'bailiff', 'watch']) if (!st.network[p]) L.push([HK.NETWORK_POSTS[p], () => HK.toggleNetwork(st, p)]);
        break;
    }
    return L;
  }
  function invest() {
    // Darlehen tilgen, wenn genug Bargeld
    if (st.loan > 0 && free() > st.loan * 1.5) HK.repayLoan(st, st.loan);
    if (st.day % 3 !== 0) return;
    let n = 0;
    for (const [cost, act] of investList()) {
      if (cost === null) continue;
      if (st.money - cost < Math.max(3000 + st.ownShips.length * 1500 + st.workshops.filter(w => w.type).length * 1500, cost * 0.6)) continue;
      const r = act(); if (r && r.ok) { T.invest.push([Math.round(st.day / 365 * 10) / 10, cost]); if (++n >= 1) break; }
    }
  }
  function nightlord() {
    if (!P.smuggle || !HK.hasVenture(st, 'dive')) return;
    const o = st.dive.offer;
    if (o && o.qty > 0 && st.suspicion < 50 && free() > o.qty * o.price) { const r = HK.buyContraband(st, o.qty); if (r.ok) noteBuy(o.good, r.qty, o.price); }
  }
  function finance() {
    // Wechselbriefe für überschüssiges Geld; Nachtherr: Spitzel, Erpressung, Falschgeld
    if (free() > 40000 && st.bills.length < 2 && (path === 'merchant' || path === 'patron' || path === 'mayor')) HK.buyBill(st, 'safe', 20000);
    if (P.smuggle) {
      if (st.spyUntil <= st.day && free() > 5000 && st.day % 60 === 0) HK.hireSpy(st);
      for (const r of st.rivals) if (HK.canBlackmail(st, r) && st.suspicion < 35 && r.attitude < 0) HK.blackmail(st, r.id);
      if (HK.hasVenture(st, 'dive') && !st.counterfeit && st.suspicion < 25 && free() > 6000) HK.counterfeit(st, 3000);
    }
  }
  function rivals() {
    if (st.day % 30 !== 0 || free() < 5000) return;
    const r = st.rivals.filter(x => !x.ally).sort((a, b) => b.attitude - a.attitude)[0]; if (!r) return;
    if (r.attitude >= 45 && free() > 4000) HK.allyRival(st, r.id); else if (r.attitude < 45 && (path === 'merchant' || path === 'mayor' || path === 'shipowner')) HK.meetRival(st, r.id);
  }
  return { day() { politics(); trade(); contracts(); ships(); nightlord(); invest(); rivals(); finance(); }, acc, T };
}

/* ---------- Lauf ---------- */
function run(path, seed, years) {
  const HK = load(seed);
  HK.onOffer = HK.onSuccession = HK.onChronicle = HK.onTitle = HK.onDecision = HK.onGameOver = null;
  const st = HK.newGame({ name: 'Tester ' + path, difficulty: DIFF, years: years <= 10 ? 10 : years <= 20 ? 20 : 30 });
  const bot = makeBot(HK, st, path);
  const rows = [], errors = [];
  let lastAcc = {};
  const titleDef = HK.TITLE[path];
  for (let y = 0; y < years; y++) {
    const evs = {}; let bad = 0;
    for (let d = 0; d < 365; d++) {
      try { bot.day(); } catch (e) { errors.push('day ' + st.day + ': ' + e.message); if (errors.length > 3) break; }
      HK.tick(st);
      if (st.gameOver) break;
    }
    for (const e of st.log) if (Math.floor((e.day - 1) / 365) === y && e.kind === 'bad') { bad++; evs[e.key] = (evs[e.key] || 0) + 1; }
    const inc = {}; for (const k in bot.acc) { const v = bot.acc[k] - (lastAcc[k] || 0); if (Math.abs(v) > 0.5) inc[k] = Math.round(v); } lastAcc = Object.assign({}, bot.acc);
    const prog = HK.titleProgress(st, titleDef);
    rows.push({ year: y + 1, worth: HK.netWorth(st), money: Math.round(st.money), loan: st.loan, rank: st.rank, rep: Math.round(st.rep), piety: Math.round(st.piety), susp: Math.round(st.suspicion), infl: Math.round(st.influence), seat: st.seat, prosp: Math.round(st.town.prosperity), fac: HK.FACTION_IDS.map(f => Math.round(st.factions[f])), rivals: st.rivals.map(r => Math.round(r.wealth / 1000)), titles: Object.keys(st.titles), prog: prog.map(c => (c.done ? '✓' : Math.round(Math.min(1, c.v / c.target) * 100) + '%')), inc, bad, evs, ships: st.ownShips.length, ventures: HK.ventureCount(st), ws: st.workshops.filter(w => w.type).length, houses: st.houses.filter(h => h.owner === 'player').length, cap: st.warehouse.cap, whUsed: Math.round(HK.stockUsed(st.warehouse.stock)), contracts: st.contracts.done + '/' + st.contracts.failed, age: HK.playerAge(st), gen: st.family.generation, over: st.gameOver });
    if (st.gameOver) break;
  }
  return { path, seed, rows, errors, st, T: bot.T, condKeys: titleDef.conds(st).map(c => c[0].replace('cond_', '')), titleYear: st.titles[path] ? Math.round(st.titles[path] / 36.5) / 10 : null };
}

function HK_last(r) { return r.rows[r.rows.length - 1].prog.map((p, i) => p === '✓' ? null : HK_conds(r)[i] + '=' + p).filter(Boolean).join(' '); }
function HK_conds(r) { return r.condKeys; }
const paths = PATH === 'all' ? ['merchant', 'shipowner', 'patron', 'mayor', 'alderman', 'nightlord'] : [PATH];
const summary = [];
for (const p of paths) for (let s = 1; s <= SEEDS; s++) {
  const r = run(p, s * 7919, YEARS);
  const fmt = n => (n / 1000).toFixed(0) + 'k';
  if (!QUIET) {
    console.log(`\n=== ${p} seed ${s} ===  Titel: ${r.titleYear !== null ? 'Jahr ' + r.titleYear : '–'}  Titel gesamt: ${Object.keys(r.st.titles).join(',') || '–'}  Fehler: ${r.errors.length}`);
    console.log('Jahr | Vermögen | Bar | Rang | Ruf | Fröm | Verd | Einfl | Amt | Wohl | Fraktionen | Rivalen k | Fortschritt | schlecht | Besitz (Schiffe/Betriebe/Werkst/Häuser) | Lager | Aufträge');
    for (const w of r.rows) console.log(`${String(w.year).padStart(4)} | ${fmt(w.worth).padStart(7)} | ${fmt(w.money).padStart(5)} | ${w.rank} | ${String(w.rep).padStart(3)} | ${String(w.piety).padStart(3)} | ${String(w.susp).padStart(3)} | ${String(w.infl).padStart(5)} | ${w.seat.slice(0, 4).padEnd(4)} | ${String(w.prosp).padStart(3)} | ${w.fac.join('/').padEnd(11)} | ${w.rivals.join('/').padEnd(11)} | ${w.prog.join(' ').padEnd(24)} | ${String(w.bad).padStart(3)} | ${w.ships}/${w.ventures}/${w.ws}/${w.houses} | ${w.whUsed}/${w.cap} | ${w.contracts}${w.over ? ' BANKROTT' : ''}`);
    const last = r.rows[r.rows.length - 1];
    const incs = Object.entries(last.inc).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).map(([k, v]) => k + ' ' + fmt(v)).join(', ');
    console.log('Einnahmen/Ausgaben letztes Jahr: ' + incs);
    const mid = r.rows[Math.min(4, r.rows.length - 1)]; console.log('Jahr ' + mid.year + ': ' + Object.entries(mid.inc).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).map(([k, v]) => k + ' ' + fmt(v)).join(', '));
    const allEvs = {}; for (const w of r.rows) for (const k in w.evs) allEvs[k] = (allEvs[k] || 0) + w.evs[k];
    console.log('Schlechte Ereignisse gesamt: ' + Object.entries(allEvs).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + '×' + v).join(', '));
    console.log('Entscheidungen: ' + r.T.decisions.join(' ') + ' | Investitionen: ' + r.T.invest.length + ' | Alter ' + last.age + ' Gen ' + last.gen);
    if (r.errors.length) console.log('FEHLER: ' + r.errors.join(' | '));
  }
  summary.push({ path: p, seed: s, title: r.titleYear, fail: HK_last(r), worth: r.rows[r.rows.length - 1].worth, y5: (r.rows[4] || {}).worth, y10: (r.rows[9] || {}).worth, over: r.st.gameOver, titles: Object.keys(r.st.titles).length, rivalMax: Math.max(...r.st.rivals.map(x => x.wealth)), errors: r.errors.length });
}
console.log('\n=== Zusammenfassung ===');
console.log('Weg        | Seed | Titel Jahr | Vermögen J5 | J10 | Ende | Titel | Rival max | Bankrott | Fehler | offen');
for (const s of summary) console.log(`${s.path.padEnd(10)} | ${s.seed} | ${s.title === null ? '  –  ' : String(s.title).padStart(5)} | ${String(Math.round((s.y5 || 0) / 1000)).padStart(6)}k | ${String(Math.round((s.y10 || 0) / 1000)).padStart(5)}k | ${String(Math.round(s.worth / 1000)).padStart(6)}k | ${s.titles} | ${Math.round(s.rivalMax / 1000)}k | ${s.over ? 'JA' : 'nein'} | ${s.errors} | ${s.fail}`);
