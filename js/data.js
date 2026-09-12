/* Hanse-Kontor – Spieldaten: Sundhaven, eine kleine Hansestadt an der Küste, anno 1372 */
'use strict';
const HK = {};

HK.GOODS = [
  { id: 'grain',      name: { de: 'Getreide',     en: 'Grain' },        base: 30,  cons: 22, prod: 12 },
  { id: 'fish',       name: { de: 'Frischfisch',  en: 'Fresh fish' },   base: 40,  cons: 16, prod: 20 },
  { id: 'smokedfish', name: { de: 'Räucherfisch', en: 'Smoked fish' },  base: 75,  cons: 6,  prod: 2 },
  { id: 'beer',       name: { de: 'Bier',         en: 'Beer' },         base: 60,  cons: 18, prod: 10 },
  { id: 'salt',       name: { de: 'Salz',         en: 'Salt' },         base: 50,  cons: 8,  prod: 0 },
  { id: 'timber',     name: { de: 'Holz',         en: 'Timber' },       base: 25,  cons: 10, prod: 5 },
  { id: 'wool',       name: { de: 'Wolle',        en: 'Wool' },         base: 45,  cons: 3,  prod: 6 },
  { id: 'cloth',      name: { de: 'Tuch',         en: 'Cloth' },        base: 160, cons: 4,  prod: 0.5 },
  { id: 'wine',       name: { de: 'Wein',         en: 'Wine' },         base: 180, cons: 3,  prod: 0 },
  { id: 'wax',        name: { de: 'Wachs',        en: 'Wax' },          base: 130, cons: 2,  prod: 0 },
  { id: 'furs',       name: { de: 'Pelze',        en: 'Furs' },         base: 220, cons: 1.5, prod: 0 },
  { id: 'iron',       name: { de: 'Eisen',        en: 'Iron' },         base: 110, cons: 3,  prod: 0 },
  { id: 'tools',      name: { de: 'Werkzeug',     en: 'Tools' },        base: 150, cons: 2,  prod: 0.8 },
  { id: 'spices',     name: { de: 'Gewürze',      en: 'Spices' },       base: 420, cons: 0.6, prod: 0 },
];
HK.GOOD = {}; HK.GOODS.forEach(g => HK.GOOD[g.id] = g);

/* Herkunftsorte der Schiffe und Karawanen: was sie günstig bringen (sell) und was sie suchen (want) */
HK.ORIGINS = [
  { id: 'luebeck',   name: { de: 'Lübeck', en: 'Lübeck' },     sea: true,  days: 4,  sell: { salt: 0.7, beer: 0.8 },                  want: { fish: 1.5, smokedfish: 1.6, wool: 1.4, timber: 1.5 } },
  { id: 'bruegge',   name: { de: 'Brügge', en: 'Bruges' },     sea: true,  days: 9,  sell: { cloth: 0.65, wine: 0.7, spices: 0.7 },    want: { smokedfish: 1.7, wax: 1.6, furs: 1.5, wool: 1.3 } },
  { id: 'bergen',    name: { de: 'Bergen', en: 'Bergen' },     sea: true,  days: 8,  sell: { fish: 0.6, timber: 0.7 },                want: { grain: 1.8, beer: 1.6, salt: 1.5 } },
  { id: 'danzig',    name: { de: 'Danzig', en: 'Danzig' },     sea: true,  days: 6,  sell: { grain: 0.6, timber: 0.6, wax: 0.8 },      want: { salt: 1.6, cloth: 1.5, tools: 1.6, wine: 1.4 } },
  { id: 'riga',      name: { de: 'Riga', en: 'Riga' },         sea: true,  days: 10, sell: { furs: 0.65, wax: 0.7, timber: 0.7 },      want: { salt: 1.7, cloth: 1.6, beer: 1.5, tools: 1.5 } },
  { id: 'stockholm', name: { de: 'Stockholm', en: 'Stockholm' }, sea: true, days: 8, sell: { iron: 0.65, timber: 0.75 },              want: { cloth: 1.5, salt: 1.5, beer: 1.4, wine: 1.5 } },
  { id: 'london',    name: { de: 'London', en: 'London' },     sea: true,  days: 10, sell: { wool: 0.6, cloth: 0.75, tools: 0.8 },    want: { wine: 1.5, wax: 1.6, furs: 1.6, fish: 1.4 } },
  { id: 'koeln',     name: { de: 'Köln', en: 'Cologne' },      sea: false, days: 7,  sell: { wine: 0.65, iron: 0.75, tools: 0.7 },    want: { fish: 1.4, smokedfish: 1.6, furs: 1.5, wax: 1.4 } },
  { id: 'umland',    name: { de: 'Umland', en: 'Countryside' }, sea: false, days: 2, sell: { grain: 0.65, wool: 0.7, timber: 0.75 },  want: { salt: 1.5, tools: 1.6, cloth: 1.5, beer: 1.3 } },
];
HK.ORIGIN = {}; HK.ORIGINS.forEach(o => HK.ORIGIN[o.id] = o);

HK.SHIP_NAMES = ['Maria', 'Adler', 'Sankt Nikolaus', 'Bunte Kuh', 'Löwe', 'Greif', 'Fortuna', 'Sankt Anna', 'Seehund', 'Roter Löwe', 'Katharina', 'Pelikan', 'Schwan', 'Morgenstern', 'Sankt Georg', 'Einhorn', 'Falke', 'Ursula', 'Hansa', 'Delphin', 'Sankt Jakob', 'Engel'];
HK.CAPTAIN_NAMES = ['Hinrich Vos', 'Klaus Störtebeker', 'Jorgen Lund', 'Piet van Dyck', 'Arnd Sasse', 'Olaf Sjöberg', 'Wilkin Stade', 'Reyner Bock', 'Gerd Molenaar', 'Henning Kalsow', 'Magnus Ravn', 'Thomas Ashby'];
HK.BORROWER_NAMES = ['Hans Möller', 'Elsebe Kröger', 'Wenzel Barth', 'Ludeke Sassen', 'Ilsabe Wulf', 'Jasper Tode', 'Metke Brand', 'Volrad Kule', 'Bertram Hoyer', 'Wobbeke Sund'];

/* Betriebe (Werkstätten) */
HK.WORKSHOPS = [
  { id: 'brewery',    name: { de: 'Brauerei',    en: 'Brewery' },    out: 'beer',       qty: 6, inp: { grain: 4 },            cost: 9000,  wage: 18, license: 1500 },
  { id: 'smokehouse', name: { de: 'Räucherei',   en: 'Smokehouse' }, out: 'smokedfish', qty: 5, inp: { fish: 6, timber: 1 },  cost: 7000,  wage: 15, license: 1200 },
  { id: 'weaver',     name: { de: 'Weberei',     en: 'Weavery' },    out: 'cloth',      qty: 2, inp: { wool: 3 },             cost: 12000, wage: 25, license: 2500 },
  { id: 'smithy',     name: { de: 'Schmiede',    en: 'Smithy' },     out: 'tools',      qty: 2, inp: { iron: 2, timber: 1 },  cost: 11000, wage: 22, license: 2000 },
  { id: 'saltworks',  name: { de: 'Salzsiederei', en: 'Saltworks' }, out: 'salt',       qty: 4, inp: { timber: 2 },           cost: 14000, wage: 20, license: 3000 },
];
HK.WORKSHOP = {}; HK.WORKSHOPS.forEach(w => HK.WORKSHOP[w.id] = w);

/* Betriebe in der Stadt: käuflich, bringen Tageseinnahmen, manche verarbeiten Waren oder haben Nebenwirkungen.
   craft: braucht Zunftmitgliedschaft; inp: Ware, deren Knappheit in der Stadt die Einnahmen drückt */
HK.VENTURES = [
  { id: 'dive',      name: { de: 'Spelunke „Zum Nassen Hund“', en: 'The Wet Dog dive' }, cost: 6000,  income: 24, craft: false, effect: 'dive' },
  { id: 'bakery',    name: { de: 'Bäckerei',        en: 'Bakery' },        cost: 5000,  income: 28, craft: true, inp: 'grain', effect: 'feed' },
  { id: 'butcher',   name: { de: 'Fleischerei',     en: 'Butcher' },       cost: 5500,  income: 30, craft: true, effect: 'feed' },
  { id: 'cooper',    name: { de: 'Böttcherei',      en: 'Cooperage' },     cost: 6500,  income: 26, craft: true, inp: 'timber', effect: 'cooper' },
  { id: 'ropewalk',  name: { de: 'Seilerei',        en: 'Ropewalk' },      cost: 7000,  income: 30, craft: true, effect: 'ships' },
  { id: 'sailmaker', name: { de: 'Segelmacherei',   en: 'Sailmaker' },     cost: 8000,  income: 34, craft: true, inp: 'cloth', effect: 'ships' },
  { id: 'smokery',   name: { de: 'Fischräucherei',  en: 'Fish smokery' },  cost: 7500,  income: 18, craft: true, inp: 'fish', effect: 'smoke' },
  { id: 'tannery',   name: { de: 'Gerberei',        en: 'Tannery' },       cost: 6000,  income: 42, craft: true, effect: 'stink' },
  { id: 'potter',    name: { de: 'Töpferei',        en: 'Pottery' },       cost: 3500,  income: 16, craft: true },
  { id: 'dyer',      name: { de: 'Färberei',        en: 'Dye works' },     cost: 9000,  income: 38, craft: true, inp: 'cloth', effect: 'cloth' },
];
HK.VENTURE = {}; HK.VENTURES.forEach(v => HK.VENTURE[v.id] = v);
/* Speicher: eigener Lagerplatz oder Vermietung an andere Kaufleute */
HK.STORAGES = [
  { id: 'saltstore', price: 7000, cap: 200, rent: 42 },
  { id: 'storage2',  price: 8500, cap: 260, rent: 50 },
  { id: 'storage3',  price: 8500, cap: 260, rent: 50 },
];

/* Personen mit Loyalität */
HK.PERSONS = [
  { id: 'mayor',     name: 'Hinrich Wulflam',       title: { de: 'Bürgermeister', en: 'Mayor' },        faction: 'patrizier', council: true },
  { id: 'c_soest',   name: 'Albrecht von Soest',    title: { de: 'Ratsherr', en: 'Councillor' },        faction: 'kaufleute', council: true },
  { id: 'c_lange',   name: 'Tidemann Lange',        title: { de: 'Ratsherr', en: 'Councillor' },        faction: 'kaufleute', council: true },
  { id: 'c_witten',  name: 'Hermen Wittenborg',     title: { de: 'Ratsherr', en: 'Councillor' },        faction: 'zuenfte',   council: true },
  { id: 'c_rode',    name: 'Godeke Rode',           title: { de: 'Ratsherr', en: 'Councillor' },        faction: 'zuenfte',   council: true },
  { id: 'c_ploen',   name: 'Johann Plönnies',       title: { de: 'Ratsherr', en: 'Councillor' },        faction: 'kirche',    council: true },
  { id: 'customs',   name: 'Kort Hasenkamp',        title: { de: 'Zöllner', en: 'Customs officer' } },
  { id: 'priest',    name: 'Pater Anselm',          title: { de: 'Pfarrer', en: 'Parish priest' } },
  { id: 'bailiff',   name: 'Detlev von Bardowick',  title: { de: 'Vogt', en: 'Bailiff' } },
  { id: 'innkeeper', name: 'Grete Holste',          title: { de: 'Wirtin', en: 'Innkeeper' } },
  { id: 'changer',   name: 'Claus Schonefeld',      title: { de: 'Geldwechsler', en: 'Money changer' } },
  { id: 'guild',     name: 'Marquard Vrome',        title: { de: 'Gildemeister', en: 'Guild master' } },
  { id: 'shipwright', name: 'Bertold Ruge',         title: { de: 'Werftmeister', en: 'Shipwright' } },
  { id: 'abbot',     name: 'Abt Bruno',             title: { de: 'Abt von St. Marien', en: "Abbot of St Mary's" } },
  { id: 'craftmaster', name: 'Hinnerk Dreyer',      title: { de: 'Zunftmeister', en: 'Craft guild master' } },
  { id: 'harbourmaster', name: 'Klaus Brede',       title: { de: 'Hafenmeister', en: 'Harbour master' } },
  { id: 'divekeeper', name: 'Peer Lüdtke',          title: { de: 'Wirt der Spelunke', en: 'Dive keeper' } },
  { id: 'schoolmaster', name: 'Magister Johannes Kock', title: { de: 'Schulmeister', en: 'Schoolmaster' } },
];
HK.PERSON = {}; HK.PERSONS.forEach(p => HK.PERSON[p.id] = p);
HK.FACTIONS = { patrizier: { de: 'Patrizier', en: 'Patricians' }, kaufleute: { de: 'Kaufleute', en: 'Merchants' }, zuenfte: { de: 'Zünfte', en: 'Guilds' }, kirche: { de: 'Kirche', en: 'Church' } };

/* Konkurrenten */
HK.RIVALS = [
  { id: 'kruse',   name: 'Everd Kruse',        wealth: 60000 },
  { id: 'bracht',  name: 'Wessel Bracht',      wealth: 45000 },
  { id: 'detmers', name: 'Katharina Detmers',  wealth: 38000 },
];

/* Gesetze: Optionen und Haltung der Fraktionen (+ dafür, - dagegen) */
HK.LAWS = {
  tariff:     { name: { de: 'Hafenzoll', en: 'Harbour tariff' }, options: [5, 10, 20], unit: '%', init: 10,
                stance: { patrizier: { 5: -1, 10: 0, 20: 1 }, kaufleute: { 5: 1, 10: 0, 20: -1 }, zuenfte: { 5: 0, 10: 0, 20: 0 }, kirche: { 5: 0, 10: 0, 20: 0 } } },
  marketFee:  { name: { de: 'Marktgebühr', en: 'Market fee' }, options: [2, 5, 10], unit: '%', init: 5,
                stance: { patrizier: { 2: -1, 5: 0, 10: 1 }, kaufleute: { 2: 1, 5: 0, 10: -1 }, zuenfte: { 2: 1, 5: 0, 10: -1 }, kirche: { 2: 0, 5: 0, 10: 0 } } },
  usuryBan:   { name: { de: 'Wucherverbot', en: 'Usury ban' }, options: [0, 1], bool: true, init: 0,
                stance: { patrizier: { 0: 0, 1: 0 }, kaufleute: { 0: 1, 1: -1 }, zuenfte: { 0: 0, 1: 0 }, kirche: { 0: -1, 1: 1 } } },
  staple:     { name: { de: 'Stapelrecht', en: 'Staple right' }, options: [0, 1], bool: true, init: 0,
                stance: { patrizier: { 0: 0, 1: 1 }, kaufleute: { 0: -1, 1: 1 }, zuenfte: { 0: 0, 1: 0 }, kirche: { 0: 0, 1: 0 } } },
  bathBan:    { name: { de: 'Badehausverbot', en: 'Bathhouse ban' }, options: [0, 1], bool: true, init: 0,
                stance: { patrizier: { 0: 0, 1: -1 }, kaufleute: { 0: 1, 1: -1 }, zuenfte: { 0: 0, 1: 0 }, kirche: { 0: -1, 1: 1 } } },
  monopoly:   { name: { de: 'Handelsmonopol', en: 'Trade monopoly' }, options: ['none', 'salt', 'beer', 'cloth'], init: 'none',
                stance: { patrizier: { none: 0, salt: 0, beer: 0, cloth: 0 }, kaufleute: { none: 1, salt: -1, beer: -1, cloth: -1 }, zuenfte: { none: 0, salt: -1, beer: -1, cloth: -1 }, kirche: { none: 0, salt: 0, beer: 0, cloth: 0 } } },
};

HK.PROJECTS = [
  { id: 'harbour',  name: { de: 'Hafenerweiterung', en: 'Harbour extension' }, cost: 20000, rep: 15, effect: 'berth' },
  { id: 'wall',     name: { de: 'Stadtmauer', en: 'Town wall' },              cost: 30000, rep: 20, effect: 'safety' },
  { id: 'well',     name: { de: 'Marktbrunnen', en: 'Market well' },           cost: 6000,  rep: 8,  effect: 'prosperity' },
];
HK.CHURCH_PROJECTS = [
  { id: 'altar',  name: { de: 'Neuer Altar', en: 'New altar' },       cost: 5000,  piety: 15, rep: 5 },
  { id: 'bells',  name: { de: 'Glocken', en: 'Bells' },               cost: 9000,  piety: 20, rep: 8 },
  { id: 'chapel', name: { de: 'Seitenkapelle', en: 'Side chapel' },   cost: 16000, piety: 30, rep: 12 },
];

HK.RANKS = [
  { id: 'kraemer',  name: { de: 'Krämer', en: 'Peddler' },      worth: 0 },
  { id: 'haendler', name: { de: 'Händler', en: 'Trader' },      worth: 30000 },
  { id: 'kaufmann', name: { de: 'Kaufmann', en: 'Merchant' },   worth: 100000 },
  { id: 'patrizier', name: { de: 'Patrizier', en: 'Patrician' }, worth: 300000 },
  { id: 'magnat',   name: { de: 'Handelsfürst', en: 'Merchant prince' }, worth: 800000 },
];

HK.DIFFICULTY = {
  easy:   { money: 12000, eventRate: 0.7, shipRate: 1.2 },
  normal: { money: 6000,  eventRate: 1.0, shipRate: 1.0 },
  hard:   { money: 3000,  eventRate: 1.3, shipRate: 0.85 },
};

HK.CONST = {
  START_YEAR: 1372, START_MONTH: 2, START_DAY: 1,
  WAREHOUSE_CAP: 400, WAREHOUSE_EXPAND: 300, WAREHOUSE_EXPAND_COST: 4000,
  STALL_COST: 2500, STALL_MAX: 3,
  HOUSE_COUNT: 5, HOUSE_PRICE: 5000, HOUSE_UPGRADE: 3000,
  TAVERN_PRICE: 12000, BATHHOUSE_PRICE: 9000,
  SHIP_PRICE: 9000, BOAT_PRICE: 1500, BOAT_MAX: 4, BOAT_FISH: 5,
  BRIBE_BASE: 300, GIFT_BASE: 150,
  RUMOR_COST: 25, SPY_COST: 600, THUG_COST: 900,
  LOAN_RATE_DAILY: 0.0006, GUILD_FEE: 2000,
  INDULGENCE_COST: 800,
  BANKRUPT_DAYS: 60, WORKSHOP_PLOTS: 3,
  TAXFARM_DAYS: 365,
  CRAFT_FEE: 1500, VENTURE_UPGRADE: 0.5, VENTURE_MAX_LEVEL: 3,
  CONTRABAND_QTY: 12, FENCE_CAP: 30, WATCH_BRIBE: 700, WATCH_DAYS: 15, SAILORS_COST: 350,
  RELIC_COST: 3000, SCRIPT_COST: 400, SCRIPT_DAYS: 30, MONK_BEER: 12, MONK_WAX: 5,
  HOSPITAL_DONATION: 1000, HOSPITAL_ENDOW: 8000, SCHOOL_DONATION: 1500, SCHOOL_ENDOW: 6000,
  HARBOUR_BOOK: 200, HARBOUR_BOOK_DAYS: 20, BERTH_PRIORITY: 800, EXTRA_BERTH: 15000, MAX_BERTHS: 5,
  APPRENTICES: 1000, APPRENTICE_DAYS: 60, MASTER_TITLE: 5000, FISHMARKET_CAP: 25,
};
