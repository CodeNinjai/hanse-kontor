/* Wirtschaft: Preise, Stadt-Tick, Simulation des übrigen Hansehandels */
'use strict';

HK.desiredStock = function (cityDef, good) {
  const p = cityDef.prod[good] || 0, c = cityDef.cons[good] || 0;
  return (p + c) * 25 + 20;
};

HK.priceFactor = function (desired, stock) {
  return Math.min(3.0, Math.max(0.4, Math.pow(desired / (stock + 1), 0.7)));
};

/* Einkaufspreis für den Spieler (Stadt verkauft) */
HK.buyPrice = function (state, cityId, good, qty) {
  const def = HK.CITY[cityId], city = state.cities[cityId];
  const d = HK.desiredStock(def, good);
  const s0 = city.stock[good] || 0;
  const q = Math.max(1, qty || 1);
  const f = (HK.priceFactor(d, s0) + HK.priceFactor(d, Math.max(0, s0 - q))) / 2;
  const ev = HK.eventPriceMod(state, cityId, good);
  const repDisc = 1 - Math.min(0.1, (city.rep || 0) * 0.001);
  return Math.max(1, Math.round(HK.GOOD[good].base * f * ev * repDisc));
};

/* Verkaufspreis für den Spieler (Stadt kauft) */
HK.sellPrice = function (state, cityId, good, qty) {
  const def = HK.CITY[cityId], city = state.cities[cityId];
  const d = HK.desiredStock(def, good);
  const s0 = city.stock[good] || 0;
  const q = Math.max(1, qty || 1);
  const f = (HK.priceFactor(d, s0) + HK.priceFactor(d, s0 + q)) / 2;
  const ev = HK.eventPriceMod(state, cityId, good);
  const spread = HK.DIFFICULTY[state.difficulty].priceSpread;
  return Math.max(1, Math.round(HK.GOOD[good].base * f * ev * spread));
};

HK.eventPriceMod = function (state, cityId, good) {
  let m = 1;
  for (const ev of state.cities[cityId].events) {
    const def = HK.EVENTS[ev.type];
    if (def.priceMod && def.priceMod[good]) m *= def.priceMod[good];
  }
  return m;
};

/* Stadt-Ereignisse */
HK.EVENTS = {
  famine:   { days: [20, 40], priceMod: { grain: 1.8, fish: 1.4, stockfish: 1.4 }, consMod: { grain: 1.5 }, chance: 0.0015 },
  plague:   { days: [30, 60], priceMod: { spices: 1.6, wine: 1.3 }, consMod: { beer: 0.6, cloth: 0.5, furs: 0.5 }, chance: 0.0008 },
  festival: { days: [7, 14],  priceMod: { beer: 1.6, wine: 1.6, spices: 1.3 }, consMod: { beer: 2, wine: 2 }, chance: 0.003 },
  fire:     { days: [15, 30], priceMod: { timber: 2.0, iron: 1.3 }, consMod: { timber: 2.5 }, chance: 0.0012 },
  goodHarvest: { days: [20, 40], priceMod: { grain: 0.6, beer: 0.85 }, prodMod: { grain: 1.8 }, chance: 0.002 },
  fair:     { days: [10, 20], priceMod: { cloth: 1.4, furs: 1.3, wax: 1.3, honey: 1.2 }, consMod: { cloth: 1.5, furs: 1.5 }, chance: 0.002 },
};

HK.consMod = function (city, good) {
  let m = 1;
  for (const ev of city.events) { const d = HK.EVENTS[ev.type]; if (d.consMod && d.consMod[good]) m *= d.consMod[good]; }
  return m;
};
HK.prodMod = function (city, good) {
  let m = 1;
  for (const ev of city.events) { const d = HK.EVENTS[ev.type]; if (d.prodMod && d.prodMod[good]) m *= d.prodMod[good]; }
  return m;
};

/* Täglicher Wirtschafts-Tick aller Städte */
HK.tickEconomy = function (state) {
  const rate = HK.DIFFICULTY[state.difficulty].eventRate;
  for (const def of HK.CITIES) {
    const city = state.cities[def.id];
    // Ereignisse ablaufen lassen / neue erzeugen
    city.events = city.events.filter(e => --e.daysLeft > 0);
    if (city.events.length === 0) {
      for (const type in HK.EVENTS) {
        if (Math.random() < HK.EVENTS[type].chance * rate) {
          const [a, b] = HK.EVENTS[type].days;
          city.events.push({ type, daysLeft: a + Math.floor(Math.random() * (b - a)) });
          HK.log(state, 'ev_' + type, { city: def.id }, 'event', def.id);
          break;
        }
      }
    }
    for (const g of HK.GOODS) {
      const id = g.id;
      const prod = (def.prod[id] || 0) * HK.prodMod(city, id) * (0.85 + Math.random() * 0.3);
      const cons = (def.cons[id] || 0) * HK.consMod(city, id) * (0.85 + Math.random() * 0.3);
      let s = (city.stock[id] || 0) + prod - cons;
      const cap = HK.desiredStock(def, id) * 4;
      if (s > cap) s = cap + (s - cap) * 0.5; // Überschuss verdirbt / wird abtransportiert
      city.stock[id] = Math.max(0, s);
    }
    // Ansehen sinkt langsam Richtung Grundwert
    if (city.rep > 5) city.rep = Math.max(5, city.rep - 0.03);
  }
  HK.simulateHanseTrade(state);
};

/* Andere Hansekaufleute: Waren fließen von Überschuss- zu Mangelstädten (dämpft Extreme) */
HK.simulateHanseTrade = function (state) {
  for (const g of HK.GOODS) {
    const id = g.id;
    let hi = null, hiRatio = 0, lo = null, loRatio = Infinity;
    for (const def of HK.CITIES) {
      const ratio = (state.cities[def.id].stock[id] || 0) / HK.desiredStock(def, id);
      if (ratio > hiRatio) { hiRatio = ratio; hi = def; }
      if (ratio < loRatio) { loRatio = ratio; lo = def; }
    }
    if (hi && lo && hiRatio > 1.2 && loRatio < 0.7) {
      const move = Math.min(state.cities[hi.id].stock[id] * 0.03, HK.desiredStock(lo, id) * 0.04);
      state.cities[hi.id].stock[id] -= move;
      state.cities[lo.id].stock[id] = (state.cities[lo.id].stock[id] || 0) + move;
    }
  }
};

HK.initCityState = function (def) {
  const stock = {};
  for (const g of HK.GOODS) {
    const p = def.prod[g.id] || 0, c = def.cons[g.id] || 0;
    stock[g.id] = c * 20 + p * 45;
  }
  return { stock, rep: 5, events: [] };
};
