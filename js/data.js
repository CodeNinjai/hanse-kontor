/* Hanse-Kontor – Spieldaten / game data
   Alle Mengen in "Last" (Schiffsladung-Einheit), alle Preise in Mark lübisch.
*/
'use strict';
const HK = {};

HK.GOODS = [
  { id: 'grain',     name: { de: 'Getreide',   en: 'Grain' },     base: 30 },
  { id: 'salt',      name: { de: 'Salz',       en: 'Salt' },      base: 45 },
  { id: 'fish',      name: { de: 'Hering',     en: 'Herring' },   base: 55 },
  { id: 'stockfish', name: { de: 'Stockfisch', en: 'Stockfish' }, base: 70 },
  { id: 'beer',      name: { de: 'Bier',       en: 'Beer' },      base: 60 },
  { id: 'timber',    name: { de: 'Holz',       en: 'Timber' },    base: 25 },
  { id: 'hemp',      name: { de: 'Hanf',       en: 'Hemp' },      base: 40 },
  { id: 'cloth',     name: { de: 'Tuch',       en: 'Cloth' },     base: 160 },
  { id: 'wine',      name: { de: 'Wein',       en: 'Wine' },      base: 180 },
  { id: 'honey',     name: { de: 'Honig',      en: 'Honey' },     base: 90 },
  { id: 'wax',       name: { de: 'Wachs',      en: 'Wax' },       base: 130 },
  { id: 'furs',      name: { de: 'Pelze',      en: 'Furs' },      base: 220 },
  { id: 'iron',      name: { de: 'Eisen',      en: 'Iron' },      base: 110 },
  { id: 'spices',    name: { de: 'Gewürze',    en: 'Spices' },    base: 420 },
];
HK.GOOD = {};
HK.GOODS.forEach(g => HK.GOOD[g.id] = g);

/* Städte: Produktion und Verbrauch in Last pro Tag. pop in Tausend. */
HK.CITIES = [
  { id: 'luebeck', name: { de: 'Lübeck', en: 'Lübeck' }, lon: 10.69, lat: 53.87, pop: 22, shipyard: true,
    prod: { salt: 10, beer: 6 },
    cons: { grain: 10, fish: 8, cloth: 2, wine: 1.5, timber: 4, furs: 0.8, wax: 1, honey: 1, spices: 0.4, iron: 1.5, hemp: 1.5, stockfish: 1 } },
  { id: 'hamburg', name: { de: 'Hamburg', en: 'Hamburg' }, lon: 10.0, lat: 53.55, pop: 16, shipyard: true,
    prod: { beer: 12, grain: 6 },
    cons: { fish: 6, salt: 4, cloth: 1.5, spices: 0.3, wine: 1, timber: 3, furs: 0.5, wax: 0.6, honey: 0.7, iron: 1, stockfish: 1.5 } },
  { id: 'bremen', name: { de: 'Bremen', en: 'Bremen' }, lon: 8.8, lat: 53.08, pop: 13, shipyard: true,
    prod: { beer: 8, fish: 6 },
    cons: { grain: 6, salt: 3, timber: 3, wine: 1, cloth: 1.2, wax: 0.5, spices: 0.2, iron: 0.8, furs: 0.3, honey: 0.5 } },
  { id: 'koeln', name: { de: 'Köln', en: 'Cologne' }, lon: 6.95, lat: 50.94, pop: 40, shipyard: false,
    prod: { wine: 10, iron: 6, cloth: 3 },
    cons: { fish: 10, furs: 1.5, wax: 2, grain: 14, salt: 5, beer: 5, honey: 1.5, spices: 0.8, timber: 4, stockfish: 2, hemp: 1 } },
  { id: 'bruegge', name: { de: 'Brügge', en: 'Bruges' }, lon: 3.2, lat: 51.2, pop: 35, shipyard: false,
    prod: { cloth: 10, spices: 2.5, wine: 4 },
    cons: { grain: 12, furs: 2, wax: 2, fish: 8, timber: 4, salt: 4, beer: 4, honey: 1.2, iron: 1.5, stockfish: 1.5, hemp: 1.5 } },
  { id: 'london', name: { de: 'London', en: 'London' }, lon: -0.1, lat: 51.5, pop: 40, shipyard: false,
    prod: { cloth: 12, iron: 4 },
    cons: { wine: 4, wax: 2, furs: 1.5, timber: 5, fish: 6, grain: 6, salt: 3, beer: 3, honey: 1, spices: 0.6, stockfish: 1.5, hemp: 2 } },
  { id: 'rostock', name: { de: 'Rostock', en: 'Rostock' }, lon: 12.1, lat: 54.09, pop: 12, shipyard: true,
    prod: { grain: 12, beer: 6 },
    cons: { salt: 3, cloth: 1, iron: 0.8, fish: 4, wine: 0.5, furs: 0.2, wax: 0.4, honey: 0.4, timber: 2, spices: 0.1 } },
  { id: 'stralsund', name: { de: 'Stralsund', en: 'Stralsund' }, lon: 13.08, lat: 54.31, pop: 11, shipyard: true,
    prod: { fish: 12, grain: 6 },
    cons: { salt: 4, cloth: 1, beer: 3, iron: 0.6, wine: 0.4, timber: 2, wax: 0.3, honey: 0.4, furs: 0.2, spices: 0.1 } },
  { id: 'danzig', name: { de: 'Danzig', en: 'Danzig' }, lon: 18.65, lat: 54.35, pop: 18, shipyard: true,
    prod: { grain: 18, timber: 12, honey: 4, hemp: 5 },
    cons: { salt: 5, cloth: 1.5, fish: 5, wine: 1, beer: 3, iron: 1, spices: 0.3, furs: 0.3, wax: 0.5, stockfish: 1 } },
  { id: 'riga', name: { de: 'Riga', en: 'Riga' }, lon: 24.1, lat: 56.95, pop: 10, shipyard: true,
    prod: { timber: 10, hemp: 6, wax: 3, furs: 2 },
    cons: { salt: 4, cloth: 1, beer: 3, fish: 3, grain: 3, wine: 0.4, iron: 0.8, honey: 0.4, spices: 0.1 } },
  { id: 'reval', name: { de: 'Reval', en: 'Reval' }, lon: 24.75, lat: 59.44, pop: 8, shipyard: false,
    prod: { furs: 3, wax: 3, honey: 3, timber: 5 },
    cons: { salt: 3, cloth: 0.8, beer: 2.5, grain: 3, fish: 2, wine: 0.3, iron: 0.6, spices: 0.1 } },
  { id: 'novgorod', name: { de: 'Nowgorod', en: 'Novgorod' }, lon: 31.27, lat: 58.52, pop: 30, shipyard: false,
    prod: { furs: 6, wax: 6, honey: 6 },
    cons: { salt: 8, cloth: 3, beer: 3, fish: 6, spices: 0.5, wine: 1, iron: 2, grain: 6, stockfish: 1.5 } },
  { id: 'visby', name: { de: 'Visby', en: 'Visby' }, lon: 18.25, lat: 57.64, pop: 9, shipyard: false,
    prod: { fish: 8 },
    cons: { grain: 4, beer: 3, cloth: 0.8, timber: 2, salt: 2, wine: 0.4, wax: 0.3, honey: 0.3, furs: 0.2, iron: 0.5 } },
  { id: 'stockholm', name: { de: 'Stockholm', en: 'Stockholm' }, lon: 18.07, lat: 59.33, pop: 8, shipyard: true,
    prod: { iron: 8, timber: 8, fish: 4 },
    cons: { salt: 3, cloth: 0.8, beer: 3, wine: 0.3, grain: 4, honey: 0.4, wax: 0.3, spices: 0.1, hemp: 0.5 } },
  { id: 'bergen', name: { de: 'Bergen', en: 'Bergen' }, lon: 5.32, lat: 60.39, pop: 9, shipyard: false,
    prod: { stockfish: 14, timber: 5 },
    cons: { grain: 6, beer: 3, salt: 3, cloth: 0.8, wine: 0.3, honey: 0.4, iron: 0.6, wax: 0.3, spices: 0.1, hemp: 0.8 } },
];
HK.CITY = {};
HK.CITIES.forEach(c => HK.CITY[c.id] = c);

/* Seewege: Wegpunkte (nicht sichtbar) und Kanten. Distanzen werden aus den Koordinaten berechnet. */
HK.WAYPOINTS = [
  { id: 'w_thames', lon: 1.9, lat: 51.5 },
  { id: 'w_rhine', lon: 4.0, lat: 52.3 },
  { id: 'w_ns_s', lon: 4.0, lat: 53.8 },
  { id: 'w_ns_c', lon: 5.0, lat: 57.8 },
  { id: 'w_weser', lon: 8.3, lat: 53.7 },
  { id: 'w_elbe', lon: 8.5, lat: 54.1 },
  { id: 'w_skagen', lon: 10.9, lat: 58.0 },
  { id: 'w_kattegat', lon: 11.8, lat: 56.7 },
  { id: 'w_oresund', lon: 12.75, lat: 55.7 },
  { id: 'w_baltic_sw', lon: 12.6, lat: 54.6 },
  { id: 'w_bornholm', lon: 15.3, lat: 54.9 },
  { id: 'w_danzig_bay', lon: 18.9, lat: 55.0 },
  { id: 'w_gotland_w', lon: 17.6, lat: 57.4 },
  { id: 'w_baltic_c', lon: 19.6, lat: 56.6 },
  { id: 'w_stockholm', lon: 18.6, lat: 59.2 },
  { id: 'w_riga_gulf', lon: 22.8, lat: 57.7 },
  { id: 'w_irbe', lon: 21.4, lat: 57.75 },
  { id: 'w_hiiumaa', lon: 21.0, lat: 59.0 },
  { id: 'w_gulf_fin', lon: 25.2, lat: 59.8 },
  { id: 'w_neva', lon: 29.5, lat: 60.0 },
];
HK.EDGES = [
  ['london', 'w_thames'], ['w_thames', 'w_ns_s'], ['bruegge', 'w_ns_s'], ['w_rhine', 'w_ns_s'], ['koeln', 'w_rhine'],
  ['w_ns_s', 'w_weser'], ['w_weser', 'bremen'], ['w_ns_s', 'w_elbe'], ['w_elbe', 'hamburg'], ['w_weser', 'w_elbe'],
  ['w_elbe', 'w_ns_c'], ['w_ns_s', 'w_ns_c'], ['w_ns_c', 'w_skagen'], ['w_ns_c', 'bergen'],
  ['w_skagen', 'w_kattegat'], ['w_kattegat', 'w_oresund'], ['w_oresund', 'w_baltic_sw'],
  ['w_baltic_sw', 'luebeck'], ['w_baltic_sw', 'rostock'], ['w_baltic_sw', 'stralsund'], ['rostock', 'stralsund'], ['luebeck', 'rostock'],
  ['hamburg', 'luebeck', 'canal'],
  ['w_baltic_sw', 'w_bornholm'], ['stralsund', 'w_bornholm'], ['w_bornholm', 'w_danzig_bay'], ['w_danzig_bay', 'danzig'],
  ['w_bornholm', 'w_gotland_w'], ['w_bornholm', 'w_baltic_c'], ['w_danzig_bay', 'w_baltic_c'],
  ['visby', 'w_gotland_w'], ['w_gotland_w', 'w_baltic_c'], ['w_gotland_w', 'w_stockholm'], ['w_stockholm', 'stockholm'],
  ['w_stockholm', 'w_gulf_fin'], ['w_stockholm', 'w_hiiumaa'],
  ['riga', 'w_riga_gulf'], ['w_riga_gulf', 'w_irbe'], ['w_irbe', 'w_baltic_c'], ['w_irbe', 'w_hiiumaa'],
  ['w_hiiumaa', 'w_gulf_fin'], ['reval', 'w_gulf_fin'], ['w_gulf_fin', 'w_neva'], ['w_neva', 'novgorod'],
];

/* Landmassen (lon/lat-Polygone, stilisiert) für die Karte */
HK.LAND = [
  // Britannien
  [[-3, 49.5], [1.0, 50.8], [1.45, 51.2], [1.6, 51.9], [1.75, 52.6], [0.3, 53.3], [-0.3, 54.3], [-1.4, 55.4], [-2.0, 56.5], [-3, 57.5]],
  // Kontinent
  [[1.5, 49.5], [1.85, 50.95], [2.9, 51.2], [3.7, 51.6], [4.1, 52.0], [4.7, 52.95], [5.5, 53.4], [6.9, 53.45], [8.5, 53.55], [8.9, 53.9],
   [8.6, 54.5], [8.2, 55.5], [8.1, 56.5], [8.6, 57.1], [10.6, 57.75], [10.5, 57.2], [10.2, 56.5], [10.9, 56.0], [10.2, 55.6], [9.7, 55.0],
   [9.5, 54.8], [10.0, 54.4], [10.8, 54.0], [11.4, 53.95], [12.1, 54.2], [12.5, 54.45], [13.1, 54.5], [13.8, 54.1], [14.2, 53.9],
   [15.5, 54.2], [16.5, 54.5], [17.5, 54.75], [18.5, 54.6], [18.65, 54.4], [19.4, 54.35], [19.9, 54.5], [20.9, 54.7], [21.1, 55.2],
   [21.0, 56.0], [21.3, 56.9], [22.5, 57.4], [23.3, 57.0], [24.4, 57.2], [24.4, 57.8], [23.5, 58.3], [23.5, 58.6], [23.4, 59.2],
   [24.0, 59.4], [24.75, 59.44], [26.5, 59.5], [28.0, 59.45], [29.5, 59.9], [30.3, 59.95], [31.5, 60.0], [34, 60.0], [34, 49.5]],
  // Seeland
  [[11.2, 55.9], [12.4, 56.05], [12.5, 55.6], [12.2, 55.0], [11.1, 55.2]],
  // Fünen
  [[9.8, 55.6], [10.8, 55.6], [10.7, 55.0], [9.9, 55.05]],
  // Skandinavien
  [[4.8, 61.6], [5.0, 60.6], [5.3, 60.3], [5.2, 59.4], [5.6, 58.9], [6.5, 58.2], [7.5, 58.0], [8.5, 58.2], [9.5, 58.9], [10.5, 59.2],
   [11.2, 58.9], [11.5, 58.0], [12.0, 57.4], [12.4, 56.6], [12.9, 56.0], [12.9, 55.4], [14.2, 55.4], [15.5, 56.1], [16.4, 56.7],
   [16.6, 57.6], [16.7, 58.6], [17.9, 58.9], [18.3, 59.3], [18.9, 59.8], [18.5, 60.3], [17.5, 61.0], [17.5, 61.6]],
  // Finnland
  [[21.0, 61.6], [21.4, 60.5], [22.5, 60.2], [24.9, 60.15], [26.0, 60.4], [28.0, 60.6], [30.0, 60.8], [30.0, 61.6]],
  // Gotland
  [[18.3, 57.95], [19.0, 57.85], [19.0, 57.25], [18.5, 57.0], [18.3, 57.4]],
  // Bornholm
  [[14.7, 55.3], [15.15, 55.3], [15.15, 55.0], [14.7, 55.05]],
  // Ösel (Saaremaa)
  [[21.8, 58.5], [23.0, 58.6], [23.2, 58.2], [22.0, 57.9]],
];

HK.SHIP_TYPES = [
  { id: 'schnigge', name: { de: 'Schnigge', en: 'Snekkja' }, capacity: 40,  speed: 170, price: 4000,  crew: 8,  strength: 6 },
  { id: 'kogge',    name: { de: 'Kogge',    en: 'Cog' },     capacity: 100, speed: 120, price: 12000, crew: 15, strength: 12 },
  { id: 'holk',     name: { de: 'Holk',     en: 'Hulk' },    capacity: 160, speed: 110, price: 22000, crew: 22, strength: 18 },
  { id: 'kraweel',  name: { de: 'Kraweel',  en: 'Carvel' },  capacity: 220, speed: 150, price: 38000, crew: 30, strength: 26 },
];
HK.SHIP_TYPE = {};
HK.SHIP_TYPES.forEach(s => HK.SHIP_TYPE[s.id] = s);

HK.SHIP_NAMES = ['Maria', 'Adler', 'Peter von Danzig', 'Sankt Nikolaus', 'Bunte Kuh', 'Lisa von Lübeck', 'Jesus von Lübeck', 'Löwe',
  'Greif', 'Hansa', 'Fortuna', 'Sankt Anna', 'Seehund', 'Wappen von Hamburg', 'Roter Löwe', 'Katharina', 'Elisabeth', 'Der Pelikan',
  'Schwan', 'Morgenstern', 'Sankt Georg', 'Concordia', 'Einhorn', 'Falke', 'Ursula'];

/* Betriebe: output pro Tag, optionaler Rohstoff, erlaubte Städte (leer = alle) */
HK.BUILDINGS = [
  { id: 'brewery',   name: { de: 'Brauerei',            en: 'Brewery' },        out: 'beer',      qty: 4, inp: 'grain', inQty: 2, cost: 15000, upkeep: 20, cities: [] },
  { id: 'saltworks', name: { de: 'Salzsiederei',        en: 'Saltworks' },      out: 'salt',      qty: 5, cost: 20000, upkeep: 30, cities: ['luebeck'] },
  { id: 'sawmill',   name: { de: 'Sägewerk',            en: 'Sawmill' },        out: 'timber',    qty: 7, cost: 8000,  upkeep: 12, cities: ['danzig', 'riga', 'reval', 'stockholm', 'bergen', 'rostock', 'stralsund'] },
  { id: 'fishery',   name: { de: 'Fischerei',           en: 'Fishery' },        out: 'fish',      qty: 5, cost: 7000,  upkeep: 12, cities: ['stralsund', 'bremen', 'visby', 'stockholm', 'rostock', 'hamburg'] },
  { id: 'stockfish', name: { de: 'Stockfisch-Trocknerei', en: 'Stockfish drying' }, out: 'stockfish', qty: 4, cost: 9000, upkeep: 12, cities: ['bergen'] },
  { id: 'weaving',   name: { de: 'Weberei',             en: 'Weaving mill' },   out: 'cloth',     qty: 2, cost: 25000, upkeep: 35, cities: ['bruegge', 'london', 'koeln'] },
  { id: 'apiary',    name: { de: 'Imkerei',             en: 'Apiary' },         out: 'honey',     qty: 3, cost: 9000,  upkeep: 10, cities: ['danzig', 'riga', 'reval', 'novgorod'] },
  { id: 'waxworks',  name: { de: 'Wachsbleiche',        en: 'Wax works' },      out: 'wax',       qty: 2, inp: 'honey', inQty: 1, cost: 14000, upkeep: 15, cities: ['novgorod', 'reval', 'riga'] },
  { id: 'hunting',   name: { de: 'Jagdhütte',           en: 'Hunting lodge' },  out: 'furs',      qty: 2, cost: 18000, upkeep: 20, cities: ['novgorod', 'reval', 'riga'] },
  { id: 'ironworks', name: { de: 'Eisenhütte',          en: 'Ironworks' },      out: 'iron',      qty: 3, inp: 'timber', inQty: 2, cost: 16000, upkeep: 20, cities: ['stockholm', 'koeln', 'london'] },
  { id: 'vineyard',  name: { de: 'Weingut',             en: 'Vineyard' },       out: 'wine',      qty: 2, cost: 22000, upkeep: 25, cities: ['koeln', 'bruegge'] },
  { id: 'farm',      name: { de: 'Kornhof',             en: 'Grain farm' },     out: 'grain',     qty: 8, cost: 6000,  upkeep: 10, cities: ['danzig', 'rostock', 'stralsund', 'hamburg', 'riga'] },
  { id: 'ropewalk',  name: { de: 'Reeperbahn',          en: 'Ropewalk' },       out: 'hemp',      qty: 4, cost: 7000,  upkeep: 10, cities: ['danzig', 'riga', 'hamburg', 'luebeck'] },
];
HK.BUILDING = {};
HK.BUILDINGS.forEach(b => HK.BUILDING[b.id] = b);

HK.RANKS = [
  { id: 'kraemer',       name: { de: 'Krämer',        en: 'Peddler' },   worth: 0,       rep: 0,  kontors: 0 },
  { id: 'haendler',      name: { de: 'Händler',       en: 'Trader' },    worth: 35000,   rep: 0,  kontors: 0 },
  { id: 'kaufmann',      name: { de: 'Kaufmann',      en: 'Merchant' },  worth: 60000,   rep: 20, kontors: 1 },
  { id: 'ratsherr',      name: { de: 'Ratsherr',      en: 'Councillor' }, worth: 150000, rep: 40, kontors: 2 },
  { id: 'buergermeister', name: { de: 'Bürgermeister', en: 'Mayor' },    worth: 400000,  rep: 60, kontors: 4 },
  { id: 'eldermann',     name: { de: 'Eldermann',     en: 'Alderman' },  worth: 1000000, rep: 80, kontors: 6 },
];

HK.DIFFICULTY = {
  easy:   { money: 15000, ship: 'kogge',    priceSpread: 0.92, eventRate: 0.7 },
  normal: { money: 8000,  ship: 'kogge',    priceSpread: 0.88, eventRate: 1.0 },
  hard:   { money: 4000,  ship: 'schnigge', priceSpread: 0.84, eventRate: 1.3 },
};

HK.CONST = {
  START_YEAR: 1370, START_MONTH: 3, START_DAY: 1,   // 1. April 1370
  KONTOR_COST: 10000, KONTOR_CAPACITY: 500, KONTOR_EXPAND_COST: 5000, KONTOR_UPKEEP: 5, KONTOR_MIN_REP: 15,
  MAX_BUILDINGS: 6,
  WEAPON_COST: 2500, MAX_WEAPONS: 3,
  REPAIR_COST_PER_PCT: 40,
  CREW_WAGE: 1,
  LOAN_INTEREST_DAILY: 0.0005,
  MANAGER_QTY_DEFAULT: 10,
  HISTORY_EVERY: 5,
  BANKRUPT_DAYS: 60,
};
