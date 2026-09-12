/* Spiellogik: Zustand, Tick, Aktionen */
'use strict';

HK.state = null;

HK.log = function (state, key, vars, kind, cityId) {
  state.log.unshift({ day: state.day, key, vars: vars || {}, kind: kind || 'info', city: cityId || null });
  if (state.log.length > 300) state.log.length = 300;
  if (HK.onLog) HK.onLog(state.log[0]);
};

HK.newGame = function (opts) {
  const diff = HK.DIFFICULTY[opts.difficulty] || HK.DIFFICULTY.normal;
  const state = {
    version: 1, day: 0, speed: 0, playerName: opts.name || HK.t('defaultName'), home: opts.home, difficulty: opts.difficulty,
    money: diff.money, loan: 0, cities: {}, ships: [], kontors: {}, log: [], history: [], nextId: 1,
    stats: { profit: 0, volume: 0, bought: 0, sold: 0 }, rank: 0, won: false, gameOver: false, negDays: 0, usedNames: [],
  };
  HK.CITIES.forEach(c => state.cities[c.id] = HK.initCityState(c));
  state.cities[opts.home].rep = 15;
  state.kontors[opts.home] = HK.newKontor();
  const ship = HK.newShip(state, diff.ship, opts.home);
  state.ships.push(ship);
  state.history.push({ day: 0, worth: HK.netWorth(state) });
  HK.log(state, 'welcome', { city: opts.home, name: state.playerName, ship: HK.name(HK.SHIP_TYPE[ship.type]) }, 'good', opts.home);
  return state;
};

HK.newKontor = function () {
  return { capacity: HK.CONST.KONTOR_CAPACITY, storage: {}, buildings: [], manager: {} };
};

HK.newShip = function (state, type, cityId, name) {
  const t = HK.SHIP_TYPE[type];
  const avail = HK.SHIP_NAMES.filter(n => !state.usedNames.includes(n));
  const pick = name || (avail.length ? avail[Math.floor(Math.random() * avail.length)] : 'Schiff ' + state.nextId);
  state.usedNames.push(pick);
  return { id: state.nextId++, type, name: pick, city: cityId, path: null, travelled: 0, dest: null, cargo: {}, hull: 100, weapons: 0,
    route: null, routeIdx: 0, routeActive: false, lon: HK.CITY[cityId].lon, lat: HK.CITY[cityId].lat, heading: 0 };
};

/* ---------- Hilfsfunktionen ---------- */
HK.cargoUsed = function (ship) { let s = 0; for (const g in ship.cargo) s += ship.cargo[g]; return s; };
HK.cargoCap = function (ship) { return HK.SHIP_TYPE[ship.type].capacity; };
HK.storageUsed = function (k) { let s = 0; for (const g in k.storage) s += k.storage[g]; return s; };
HK.shipSpeed = function (ship) {
  const t = HK.SHIP_TYPE[ship.type];
  const load = HK.cargoUsed(ship) / t.capacity;
  const hullMod = ship.hull < 50 ? 0.7 + 0.3 * ship.hull / 50 : 1;
  return t.speed * (1 - 0.15 * load) * hullMod;
};
HK.shipValue = function (ship) {
  const t = HK.SHIP_TYPE[ship.type];
  return Math.round(t.price * 0.6 * (0.3 + 0.7 * ship.hull / 100) + ship.weapons * HK.CONST.WEAPON_COST * 0.5);
};
HK.cargoBaseValue = function (cargo) { let v = 0; for (const g in cargo) v += cargo[g] * HK.GOOD[g].base; return v; };
HK.netWorth = function (state) {
  let w = state.money - state.loan;
  for (const s of state.ships) w += HK.shipValue(s) + HK.cargoBaseValue(s.cargo);
  for (const cid in state.kontors) {
    const k = state.kontors[cid];
    w += HK.CONST.KONTOR_COST * 0.5 + (k.capacity - HK.CONST.KONTOR_CAPACITY) / 500 * HK.CONST.KONTOR_EXPAND_COST * 0.5;
    w += HK.cargoBaseValue(k.storage);
    for (const b of k.buildings) w += HK.BUILDING[b.type].cost * 0.6;
  }
  return Math.round(w);
};
HK.loanLimit = function (state) {
  const assets = HK.netWorth(state) + state.loan;
  return Math.max(0, Math.round(5000 + assets * 0.4 * (1 + state.rank * 0.25) - state.loan));
};
HK.travelDays = function (ship, from, to) {
  const p = HK.findPath(from, to);
  if (!p) return null;
  return Math.ceil(p.dist / HK.shipSpeed(ship));
};
HK.demandLabel = function (state, cityId, good) {
  const ratio = (state.cities[cityId].stock[good] || 0) / HK.desiredStock(HK.CITY[cityId], good);
  if (ratio < 0.5) return 'shortage';
  if (ratio > 1.6) return 'surplus';
  return 'normalDemand';
};
HK.dailyCosts = function (state) {
  let wages = 0, upkeep = 0;
  for (const s of state.ships) wages += HK.SHIP_TYPE[s.type].crew * HK.CONST.CREW_WAGE;
  for (const cid in state.kontors) {
    upkeep += HK.CONST.KONTOR_UPKEEP;
    for (const b of state.kontors[cid].buildings) upkeep += HK.BUILDING[b.type].upkeep;
  }
  return { wages, upkeep, interest: Math.round(state.loan * HK.CONST.LOAN_INTEREST_DAILY) };
};

/* ---------- Handel ---------- */
HK.buy = function (state, ship, good, qty) {
  qty = Math.floor(qty);
  if (qty <= 0 || ship.city === null) return { ok: false };
  const city = state.cities[ship.city];
  const avail = Math.floor(city.stock[good] || 0);
  if (avail < qty) return { ok: false, msg: 'notEnoughStock' };
  if (HK.cargoCap(ship) - HK.cargoUsed(ship) < qty) return { ok: false, msg: 'shipFull' };
  const price = HK.buyPrice(state, ship.city, good, qty);
  const cost = price * qty;
  if (state.money < cost) return { ok: false, msg: 'notEnoughMoney' };
  state.money -= cost;
  city.stock[good] -= qty;
  ship.cargo[good] = (ship.cargo[good] || 0) + qty;
  state.stats.volume += cost; state.stats.bought += cost; state.stats.profit -= cost;
  return { ok: true, cost, price };
};
HK.sell = function (state, ship, good, qty) {
  qty = Math.floor(qty);
  if (qty <= 0 || ship.city === null) return { ok: false };
  if ((ship.cargo[good] || 0) < qty) return { ok: false, msg: 'notEnoughCargo' };
  const price = HK.sellPrice(state, ship.city, good, qty);
  const rev = price * qty;
  HK.sellToCity(state, ship.city, good, qty);
  ship.cargo[good] -= qty;
  if (ship.cargo[good] <= 0) delete ship.cargo[good];
  state.money += rev;
  state.stats.volume += rev; state.stats.sold += rev; state.stats.profit += rev;
  return { ok: true, cost: rev, price };
};
HK.sellToCity = function (state, cityId, good, qty) {
  const city = state.cities[cityId];
  const label = HK.demandLabel(state, cityId, good);
  city.stock[good] = (city.stock[good] || 0) + qty;
  const gain = qty * (label === 'shortage' ? 0.015 : label === 'normalDemand' ? 0.004 : 0.001);
  city.rep = Math.min(100, city.rep + gain);
};

/* Kontor <-> Schiff */
HK.transfer = function (state, ship, good, qty, toKontor) {
  qty = Math.floor(qty);
  const k = state.kontors[ship.city];
  if (!k || qty <= 0) return { ok: false, msg: 'noKontor' };
  if (toKontor) {
    if ((ship.cargo[good] || 0) < qty) return { ok: false, msg: 'notEnoughCargo' };
    if (k.capacity - HK.storageUsed(k) < qty) return { ok: false, msg: 'storageFull' };
    ship.cargo[good] -= qty; if (ship.cargo[good] <= 0) delete ship.cargo[good];
    k.storage[good] = (k.storage[good] || 0) + qty;
  } else {
    if ((k.storage[good] || 0) < qty) return { ok: false, msg: 'notEnoughCargo' };
    if (HK.cargoCap(ship) - HK.cargoUsed(ship) < qty) return { ok: false, msg: 'shipFull' };
    k.storage[good] -= qty; if (k.storage[good] <= 0) delete k.storage[good];
    ship.cargo[good] = (ship.cargo[good] || 0) + qty;
  }
  return { ok: true };
};

/* ---------- Schiffe ---------- */
HK.sailTo = function (state, ship, dest) {
  if (ship.city === null || dest === ship.city) return { ok: false };
  const p = HK.findPath(ship.city, dest);
  if (!p) return { ok: false };
  ship.path = p.path; ship.travelled = 0; ship.dest = dest; ship.city = null;
  return { ok: true, days: Math.ceil(p.dist / HK.shipSpeed(ship)) };
};
HK.repairShip = function (state, ship) {
  const cost = HK.repairCost(ship);
  if (ship.city === null || cost <= 0) return { ok: false };
  if (state.money < cost) return { ok: false, msg: 'notEnoughMoney' };
  state.money -= cost; ship.hull = 100;
  return { ok: true };
};
HK.repairCost = function (ship) {
  const t = HK.SHIP_TYPE[ship.type];
  return Math.round((100 - ship.hull) * HK.CONST.REPAIR_COST_PER_PCT * (t.capacity / 100));
};
HK.buyWeapons = function (state, ship) {
  if (ship.weapons >= HK.CONST.MAX_WEAPONS) return { ok: false, msg: 'maxWeapons' };
  if (ship.city === null || !HK.CITY[ship.city].shipyard) return { ok: false, msg: 'noShipyard' };
  if (state.money < HK.CONST.WEAPON_COST) return { ok: false, msg: 'notEnoughMoney' };
  state.money -= HK.CONST.WEAPON_COST; ship.weapons++;
  return { ok: true };
};
HK.buildShip = function (state, cityId, type) {
  if (!HK.CITY[cityId].shipyard) return { ok: false, msg: 'noShipyard' };
  const t = HK.SHIP_TYPE[type];
  if (state.money < t.price) return { ok: false, msg: 'notEnoughMoney' };
  state.money -= t.price;
  const ship = HK.newShip(state, type, cityId);
  state.ships.push(ship);
  HK.log(state, 'shipBuilt', { ship: ship.name, city: cityId }, 'good', cityId);
  return { ok: true, ship };
};
HK.sellShip = function (state, ship) {
  if (ship.city === null) return { ok: false };
  const price = HK.shipValue(ship);
  // Ladung geht zum Verkaufspreis mit
  for (const g in ship.cargo) { const r = HK.sellPrice(state, ship.city, g, ship.cargo[g]); state.money += r * ship.cargo[g]; HK.sellToCity(state, ship.city, g, ship.cargo[g]); }
  state.money += price;
  state.ships = state.ships.filter(s => s.id !== ship.id);
  HK.log(state, 'shipSold', { ship: ship.name, price: HK.fmt(price) }, 'info');
  return { ok: true, price };
};

/* ---------- Kontor ---------- */
HK.buildKontor = function (state, cityId) {
  if (state.kontors[cityId]) return { ok: false };
  if (state.cities[cityId].rep < HK.CONST.KONTOR_MIN_REP) return { ok: false, msg: 'kontorNeedsRep' };
  if (state.money < HK.CONST.KONTOR_COST) return { ok: false, msg: 'notEnoughMoney' };
  state.money -= HK.CONST.KONTOR_COST;
  state.kontors[cityId] = HK.newKontor();
  HK.log(state, 'kontorBuilt', { city: cityId }, 'good', cityId);
  return { ok: true };
};
HK.expandKontor = function (state, cityId) {
  const k = state.kontors[cityId];
  if (!k) return { ok: false };
  if (state.money < HK.CONST.KONTOR_EXPAND_COST) return { ok: false, msg: 'notEnoughMoney' };
  state.money -= HK.CONST.KONTOR_EXPAND_COST; k.capacity += 500;
  return { ok: true };
};
HK.canBuildHere = function (bdef, cityId) { return bdef.cities.length === 0 || bdef.cities.includes(cityId); };
HK.buildBuilding = function (state, cityId, type) {
  const k = state.kontors[cityId], b = HK.BUILDING[type];
  if (!k || !HK.canBuildHere(b, cityId)) return { ok: false, msg: 'noBuildingsHere' };
  if (k.buildings.length >= HK.CONST.MAX_BUILDINGS) return { ok: false, msg: 'maxBuildings' };
  if (state.money < b.cost) return { ok: false, msg: 'notEnoughMoney' };
  state.money -= b.cost;
  k.buildings.push({ id: state.nextId++, type });
  HK.log(state, 'built', { building: HK.name(b), city: cityId }, 'good', cityId);
  return { ok: true };
};
HK.demolish = function (state, cityId, bid) {
  const k = state.kontors[cityId];
  if (!k) return { ok: false };
  const b = k.buildings.find(x => x.id === bid);
  if (!b) return { ok: false };
  k.buildings = k.buildings.filter(x => x.id !== bid);
  state.money += Math.round(HK.BUILDING[b.type].cost * 0.3);
  return { ok: true };
};
HK.setManager = function (state, cityId, good, mode, price, qty) {
  const k = state.kontors[cityId];
  if (!k) return;
  if (mode === 'none') delete k.manager[good];
  else k.manager[good] = { mode, price: Math.max(0, Math.round(price) || 0), qty: Math.max(1, Math.round(qty) || HK.CONST.MANAGER_QTY_DEFAULT) };
};
HK.donate = function (state, cityId, kind) {
  const cost = HK.donationCost(state, cityId, kind);
  if (state.money < cost) return { ok: false, msg: 'notEnoughMoney' };
  state.money -= cost;
  state.cities[cityId].rep = Math.min(100, state.cities[cityId].rep + (kind === 'church' ? 3 : 2));
  return { ok: true };
};
HK.donationCost = function (state, cityId, kind) {
  const rep = state.cities[cityId].rep;
  return Math.round((kind === 'church' ? 800 : 400) + rep * rep * (kind === 'church' ? 4 : 2));
};

/* ---------- Bank ---------- */
HK.takeLoan = function (state, amount) {
  amount = Math.floor(amount);
  if (amount <= 0) return { ok: false };
  if (amount > HK.loanLimit(state)) return { ok: false, msg: 'loanTooHigh' };
  state.loan += amount; state.money += amount;
  HK.log(state, 'loanTaken', { amount: HK.fmt(amount) }, 'info');
  return { ok: true };
};
HK.repayLoan = function (state, amount) {
  amount = Math.min(Math.floor(amount), state.loan, Math.max(0, state.money));
  if (amount <= 0) return { ok: false, msg: 'notEnoughMoney' };
  state.loan -= amount; state.money -= amount;
  HK.log(state, 'loanRepaid', { amount: HK.fmt(amount) }, 'info');
  return { ok: true };
};

/* ---------- Rang ---------- */
HK.rankMet = function (state, idx) {
  const r = HK.RANKS[idx];
  if (!r) return false;
  return HK.netWorth(state) >= r.worth && state.cities[state.home].rep >= r.rep && Object.keys(state.kontors).length >= r.kontors;
};
HK.checkRank = function (state) {
  while (state.rank + 1 < HK.RANKS.length && HK.rankMet(state, state.rank + 1)) {
    state.rank++;
    HK.log(state, 'promoted', { rank: HK.name(HK.RANKS[state.rank]) }, 'good');
    if (HK.onPromotion) HK.onPromotion(state.rank);
    if (state.rank === HK.RANKS.length - 1 && !state.won) { state.won = true; if (HK.onWin) HK.onWin(); }
  }
};

/* ---------- Routen ---------- */
/* route = { stops: [{ city, orders: { good: { mode: 'buy'|'sell'|'load'|'unload', price, qty } } }] } */
HK.runRouteStop = function (state, ship) {
  const stop = ship.route.stops[ship.routeIdx];
  if (!stop || stop.city !== ship.city) return;
  const k = state.kontors[ship.city];
  let sold = 0, bought = 0;
  const orders = stop.orders || {};
  // 1. verkaufen / entladen
  for (const g in orders) {
    const o = orders[g], have = ship.cargo[g] || 0;
    if (have <= 0) continue;
    if (o.mode === 'sell') {
      // in Teilmengen verkaufen, solange der Preis über dem Minimum liegt
      let q = have;
      while (q > 0) {
        const chunk = Math.min(q, 10);
        if (HK.sellPrice(state, ship.city, g, chunk) < (o.price || 0)) break;
        HK.sell(state, ship, g, chunk); sold += chunk; q -= chunk;
      }
    } else if (o.mode === 'unload' && k) {
      const q = Math.min(have, k.capacity - HK.storageUsed(k));
      if (q > 0) { HK.transfer(state, ship, g, q, true); sold += q; }
    }
  }
  // 2. kaufen / laden
  for (const g in orders) {
    const o = orders[g];
    if (o.mode === 'buy') {
      let want = Math.min(o.qty || 0, HK.cargoCap(ship) - HK.cargoUsed(ship));
      while (want > 0) {
        const chunk = Math.min(want, 10);
        const p = HK.buyPrice(state, ship.city, g, chunk);
        if (o.price && p > o.price) break;
        const r = HK.buy(state, ship, g, chunk);
        if (!r.ok) break;
        bought += chunk; want -= chunk;
      }
    } else if (o.mode === 'load' && k) {
      const q = Math.min(o.qty || 9999, k.storage[g] || 0, HK.cargoCap(ship) - HK.cargoUsed(ship));
      if (q > 0) { HK.transfer(state, ship, g, q, false); bought += q; }
    }
  }
  if (sold || bought) HK.log(state, 'routeTrade', { ship: ship.name, city: ship.city, sold, bought }, 'trade', ship.city);
  // weiter zur nächsten Station
  ship.routeIdx = (ship.routeIdx + 1) % ship.route.stops.length;
  const next = ship.route.stops[ship.routeIdx];
  if (next.city !== ship.city) HK.sailTo(state, ship, next.city);
};
HK.startRoute = function (state, ship) {
  if (!ship.route || ship.route.stops.length < 2) return { ok: false, msg: 'routeNeedsStops' };
  ship.routeActive = true;
  if (ship.city !== null) {
    const idx = ship.route.stops.findIndex(s => s.city === ship.city);
    if (idx >= 0) { ship.routeIdx = idx; HK.runRouteStop(state, ship); }
    else { ship.routeIdx = 0; HK.sailTo(state, ship, ship.route.stops[0].city); }
  }
  return { ok: true };
};
HK.stopRoute = function (state, ship) { ship.routeActive = false; };

/* ---------- Tick ---------- */
HK.tickShips = function (state) {
  const month = HK.monthOf(state.day);
  const winter = month >= 9 || month <= 1;
  const rate = HK.DIFFICULTY[state.difficulty].eventRate;
  for (const ship of state.ships.slice()) {
    if (ship.city !== null) continue;
    const t = HK.SHIP_TYPE[ship.type];
    ship.travelled += HK.shipSpeed(ship);
    const total = HK.pathDistance(ship.path);
    // Sturm
    if (Math.random() < (winter ? 0.035 : 0.01) * rate) {
      const dmg = 5 + Math.floor(Math.random() * 20);
      ship.hull -= dmg;
      if (ship.hull <= 0) {
        HK.log(state, 'sunk', { ship: ship.name }, 'bad');
        state.ships = state.ships.filter(s => s.id !== ship.id);
        continue;
      }
      HK.log(state, 'storm', { ship: ship.name, dmg }, 'bad');
      if (ship.hull < 30 && ship.hull + dmg >= 30) HK.log(state, 'hullWarning', { ship: ship.name }, 'bad');
    }
    // Piraten
    if (Math.random() < 0.012 * rate) {
      const strength = 8 + Math.random() * 28;
      const own = t.strength * (1 + ship.weapons * 0.6);
      if (own >= strength) {
        ship.hull = Math.max(1, ship.hull - 3);
        HK.log(state, 'piratesRepelled', { ship: ship.name }, 'good');
      } else {
        const value = HK.cargoBaseValue(ship.cargo);
        if (value > 500 && Math.random() < 0.6) {
          for (const g in ship.cargo) ship.cargo[g] = Math.floor(ship.cargo[g] * (0.4 + Math.random() * 0.3));
          for (const g in ship.cargo) if (ship.cargo[g] <= 0) delete ship.cargo[g];
          HK.log(state, 'piratesLoot', { ship: ship.name }, 'bad');
        } else {
          const ransom = Math.min(Math.max(0, state.money), Math.round(300 + Math.random() * 1500));
          state.money -= ransom;
          HK.log(state, 'piratesRansom', { ship: ship.name, amount: HK.fmt(ransom) }, 'bad');
        }
        ship.hull = Math.max(1, ship.hull - 10);
      }
    }
    if (ship.travelled >= total) {
      ship.city = ship.dest; ship.dest = null; ship.path = null; ship.travelled = 0;
      ship.lon = HK.CITY[ship.city].lon; ship.lat = HK.CITY[ship.city].lat;
      HK.log(state, 'arrived', { ship: ship.name, city: ship.city }, 'arrival', ship.city);
      if (ship.routeActive && ship.route) HK.runRouteStop(state, ship);
    } else {
      const pos = HK.positionOnPath(ship.path, ship.travelled);
      ship.lon = pos.lon; ship.lat = pos.lat; ship.heading = pos.heading;
    }
  }
};

HK.tickKontors = function (state) {
  for (const cid in state.kontors) {
    const k = state.kontors[cid];
    // Betriebe
    for (const b of k.buildings) {
      const d = HK.BUILDING[b.type];
      if (d.inp) {
        if ((k.storage[d.inp] || 0) < d.inQty) { b.idle = true; continue; }
        k.storage[d.inp] -= d.inQty;
      }
      b.idle = false;
      const space = k.capacity - HK.storageUsed(k);
      k.storage[d.out] = (k.storage[d.out] || 0) + Math.min(d.qty, Math.max(0, space));
    }
    // Verwalter
    for (const g in k.manager) {
      const m = k.manager[g];
      if (m.mode === 'sell') {
        const q = Math.min(m.qty, Math.floor(k.storage[g] || 0));
        if (q > 0) {
          const p = HK.sellPrice(state, cid, g, q);
          if (p >= m.price) {
            k.storage[g] -= q; if (k.storage[g] <= 0) delete k.storage[g];
            HK.sellToCity(state, cid, g, q);
            const rev = p * q; state.money += rev; state.stats.volume += rev; state.stats.sold += rev; state.stats.profit += rev;
            HK.log(state, 'managerSold', { city: cid, qty: q, good: HK.goodName(g) }, 'trade', cid);
          }
        }
      } else if (m.mode === 'buy') {
        const q = Math.min(m.qty, k.capacity - HK.storageUsed(k), Math.floor(state.cities[cid].stock[g] || 0));
        if (q > 0) {
          const p = HK.buyPrice(state, cid, g, q);
          if (p <= m.price && state.money >= p * q) {
            state.money -= p * q; state.cities[cid].stock[g] -= q;
            k.storage[g] = (k.storage[g] || 0) + q;
            state.stats.volume += p * q; state.stats.bought += p * q; state.stats.profit -= p * q;
            HK.log(state, 'managerBought', { city: cid, qty: q, good: HK.goodName(g) }, 'trade', cid);
          }
        }
      }
    }
  }
};

HK.tick = function (state) {
  if (state.gameOver) return;
  state.day++;
  HK.tickEconomy(state);
  HK.tickShips(state);
  HK.tickKontors(state);
  const c = HK.dailyCosts(state);
  state.money -= c.wages + c.upkeep + c.interest;
  if (state.day % HK.CONST.HISTORY_EVERY === 0) {
    state.history.push({ day: state.day, worth: HK.netWorth(state) });
    if (state.history.length > 400) state.history.splice(0, state.history.length - 400);
  }
  HK.checkRank(state);
  if (state.money < 0) {
    state.negDays++;
    if (state.negDays >= HK.CONST.BANKRUPT_DAYS) { state.gameOver = true; HK.log(state, 'bankrupt', {}, 'bad'); if (HK.onGameOver) HK.onGameOver(); }
  } else state.negDays = 0;
};

/* ---------- Speichern ---------- */
HK.SAVE_KEY = 'hanse-kontor-save';
HK.serialize = function (state) { return JSON.stringify(state); };
HK.deserialize = function (json) {
  const s = JSON.parse(json);
  if (!s || s.version !== 1 || !s.cities || !s.ships) throw new Error('bad save');
  return s;
};
