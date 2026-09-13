/* Die Bürgerhäuser von Sundhaven: bewohnte Häuser mit Familien, Gewerben und Stimmung.
   Sie stehen nicht einfach zum Verkauf, sondern nur, wenn ein Haushalt in Not gerät, wegzieht oder ausstirbt.
   Wer kauft, bekommt Miete und Pflichten: Instandhaltung, Brandschaden, Leerstand, Pest und Aufruhr. */
'use strict';

Object.assign(HK.CONST, {
  BURGHER_REPAIR: 700, BURGHER_SALE_DAYS: 60, BURGHER_RAISE_DAYS: 365,
  BURGHER_PATRICIAN: 6, RIVAL_PATRICIAN: 4,
});

HK.BURGHER_FAMILIES = ['Kröger', 'Rodenberg', 'Stolterfoth', 'Mekelenborch', 'Lange', 'Vosberg', 'Sudermann', 'Hamer', 'Rike', 'Bardewik', 'Grote', 'Dassow', 'Kalve', 'Wittenborg', 'Schepenstede', 'Krummesse', 'Hoyer', 'Pleskow', 'Segeberg', 'Darsow', 'Klingenberg', 'Morneweg', 'Attendorn', 'Geverdes', 'Bere', 'Lüneborch'];
HK.BURGHER_TRADES = ['weaver', 'cobbler', 'smith', 'baker', 'carter', 'fisher', 'scribe', 'brewer', 'ropemaker', 'widow', 'mason', 'tailor'];
HK.BURGHER_REASONS = ['debt', 'death', 'move', 'heir'];
HK.BURGHER_QUARTERS = { altstadt: 1.15, hafen: 1.0, neustadt: 0.85 };

/* Viertel nach Lage: nördlich der alten Mauer die Neustadt, unten am Kai das Hafenviertel */
HK.burgherQuarter = b => b.y < 2 ? 'neustadt' : b.y >= 9.5 ? 'hafen' : 'altstadt';

/* Alle Häuser ohne eigene Aufgabe werden zu Bürgerhäusern */
HK.BURGHER_HOUSES = HK.BUILDINGS.filter(b => !b.panel && (b.kind === 'gable' || b.kind === 'eave'));
for (const b of HK.BURGHER_HOUSES) { b.panel = 'burgher'; b.burgher = b.id; }

HK.burgherName = h => HK.t('burgherHouseOf', { family: h.family });
/* Beschriftung auf der Karte: Bürgerhäuser tragen den Namen ihrer Familie */
HK.buildingLabel = function (st, b) {
  if (b.burgher && st.burghers && st.burghers[b.burgher]) { const h = st.burghers[b.burgher]; return HK.burgherName(h) + (h.owner === 'player' ? ' · ' + HK.t('yours') : HK.burgherForSale(st, h) ? ' · ' + HK.t('burgherForSale') : ''); }
  return HK.name(b);
};
HK.burgherTrade = h => HK.t('trade_' + h.trade);

/* ---------- Anlage und Migration ---------- */
HK.makeBurghers = function (st) {
  const fams = HK.BURGHER_FAMILIES.slice();
  st.burghers = {};
  for (const b of HK.BURGHER_HOUSES) {
    const i = Math.floor(Math.random() * fams.length), family = fams.length ? fams.splice(i, 1)[0] : HK.pick(HK.BURGHER_FAMILIES);
    st.burghers[b.id] = {
      id: b.id, family, trade: HK.pick(HK.BURGHER_TRADES), standing: HK.rndi(0, 2), quarter: HK.burgherQuarter(b),
      owner: 'burgher', level: 1, damaged: false, vacantUntil: 0, mood: HK.rndi(45, 70), raisedUntil: 0, sale: null, since: 0,
    };
  }
};
HK.newGameHooks.push(st => HK.makeBurghers(st));
HK.migrateHooks.push(st => {
  if (!st.burghers) HK.makeBurghers(st);
  for (const id in st.burghers) { const h = st.burghers[id]; if (h.vacantUntil === undefined) h.vacantUntil = 0; if (h.raisedUntil === undefined) h.raisedUntil = 0; if (h.mood === undefined) h.mood = 55; }
});

/* ---------- Werte ---------- */
HK.burgherOwned = st => Object.keys(st.burghers || {}).filter(id => st.burghers[id].owner === 'player');
HK.burgherPrice = function (st, h) {
  const qf = HK.BURGHER_QUARTERS[h.quarter] || 1;
  const base = (2600 + h.standing * 1100 + (h.level - 1) * 2600) * qf * (0.85 + st.town.prosperity / 200);
  return Math.round(base * (h.damaged ? 0.7 : 1) * (st.cheapHousesUntil > st.day ? 0.8 : 1));
};
HK.burgherPlague = st => st.town.events.some(e => e.type === 'plague');
HK.burgherRent = function (st, h) {
  if (h.owner !== 'player' || h.damaged || h.vacantUntil > st.day) return 0;
  const qf = HK.BURGHER_QUARTERS[h.quarter] || 1;
  let r = (6.5 + h.standing * 2.8 + (h.level - 1) * 4) * (0.6 + st.town.prosperity / 125) * qf;
  if (h.raisedUntil > st.day) r *= 1.25;
  if (st.unrestUntil > st.day) r *= 0.5;
  if (HK.burgherPlague(st)) r *= 0.7;
  return Math.round(r);
};
HK.burgherUpkeep = (st, h) => h.owner === 'player' ? 4 + h.standing : 0;
/* Stimmung der Mieter: Wohlstand, Steuern, Unruhe und die eigene Mietpolitik */
HK.burgherMoodTarget = function (st, h) {
  let m = 40 + st.town.prosperity * 0.4;
  m -= HK.law(st, 'tariff') * 0.4;
  if (st.unrestUntil > st.day) m -= 25;
  if (st.interdictUntil > st.day) m -= 12;
  if (HK.burgherPlague(st)) m -= 15;
  if (HK.law(st, 'beggarLaw')) m -= 5;
  if (HK.law(st, 'beerTax')) m -= 4;
  if (h.raisedUntil > st.day) m -= 20;
  if (h.damaged) m -= 20;
  if (st.hospitalEndowed) m += 5;
  if (st.rep >= 70) m += 5;
  return HK.clamp(m, 0, 100);
};
HK.burgherMoodLabel = h => h.mood >= 70 ? 'content' : h.mood >= 45 ? 'plain' : h.mood >= 25 ? 'grumbling' : 'bitter';

/* ---------- Kaufen, verkaufen, verwalten ---------- */
HK.burgherForSale = (st, h) => !!(h.sale && h.sale.until > st.day && h.owner !== 'player');
HK.buyBurgher = function (st, id) {
  const h = st.burghers[id]; if (!h || h.owner === 'player') return { ok: false };
  if (!HK.burgherForSale(st, h)) return { ok: false, msg: 'burgherNotForSale' };
  const price = h.sale.price; if (st.money < price) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'investments', -price);
  if (h.owner !== 'burgher') { const r = st.rivals.find(x => x.id === h.owner); if (r) { r.wealth += price; r.holdings.burghers = (r.holdings.burghers || []).filter(x => x !== id); } }
  h.owner = 'player'; h.sale = null; h.since = st.day; h.mood = HK.clamp(h.mood, 35, 100);
  HK.fac(st, 'kaufleute', 1);
  HK.log(st, 'burgherBought', { house: HK.burgherName(h), price: HK.fmt(price) }, 'good');
  return { ok: true };
};
HK.sellBurgher = function (st, id) {
  const h = st.burghers[id]; if (!h || h.owner !== 'player') return { ok: false };
  const price = Math.round(HK.burgherPrice(st, h) * 0.75);
  HK.book(st, 'investments', price); h.owner = 'burgher'; h.sale = null; h.raisedUntil = 0; h.level = 1;
  HK.log(st, 'burgherSold', { house: HK.burgherName(h), price: HK.fmt(price) }, 'info');
  return { ok: true };
};
HK.repairBurgher = function (st, id) {
  const h = st.burghers[id]; if (!h || h.owner !== 'player' || !h.damaged) return { ok: false };
  if (st.money < HK.CONST.BURGHER_REPAIR) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'investments', -HK.CONST.BURGHER_REPAIR); h.damaged = false; h.mood = HK.clamp(h.mood + 15, 0, 100);
  return { ok: true };
};
HK.improveBurgher = function (st, id) {
  const h = st.burghers[id]; if (!h || h.owner !== 'player' || h.level >= 3 || h.damaged) return { ok: false };
  const cost = 2200 + h.level * 800; if (st.money < cost) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'investments', -cost); h.level++; h.mood = HK.clamp(h.mood + 12, 0, 100);
  HK.log(st, 'burgherImproved', { house: HK.burgherName(h) }, 'good');
  return { ok: true };
};
HK.raiseBurgherRent = function (st, id) {
  const h = st.burghers[id]; if (!h || h.owner !== 'player' || h.raisedUntil > st.day) return { ok: false };
  h.raisedUntil = st.day + HK.CONST.BURGHER_RAISE_DAYS; h.mood = HK.clamp(h.mood - 25, 0, 100);
  HK.fac(st, 'kaufleute', -1); st.rep = HK.clamp(st.rep - 1, 0, 100);
  if (h.mood < 25 && Math.random() < 0.4) { h.vacantUntil = st.day + HK.rndi(30, 80); HK.log(st, 'burgherLeft', { house: HK.burgherName(h), family: h.family }, 'bad'); }
  else HK.log(st, 'burgherRaised', { house: HK.burgherName(h) }, 'info');
  return { ok: true };
};
HK.easeBurgherRent = function (st, id) {
  const h = st.burghers[id]; if (!h || h.owner !== 'player' || h.raisedUntil <= st.day) return { ok: false };
  h.raisedUntil = 0; h.mood = HK.clamp(h.mood + 20, 0, 100); HK.fac(st, 'kaufleute', 1);
  return { ok: true };
};

/* ---------- Angebote: ein Haus kommt nur in Not auf den Markt ---------- */
HK.offerBurgher = function (st) {
  const free = Object.keys(st.burghers).filter(id => { const h = st.burghers[id]; return h.owner !== 'player' && !HK.burgherForSale(st, h); });
  if (!free.length) return;
  const h = st.burghers[HK.pick(free)], reason = HK.pick(HK.BURGHER_REASONS);
  const mult = reason === 'debt' ? 0.8 : reason === 'move' ? 0.9 : reason === 'heir' ? 1.1 : 1;
  h.sale = { price: Math.round(HK.burgherPrice(st, h) * mult), until: st.day + HK.CONST.BURGHER_SALE_DAYS, reason };
  HK.log(st, 'burgherOffer_' + reason, { house: HK.burgherName(h), family: h.family, trade: HK.burgherTrade(h), price: HK.fmt(h.sale.price) }, 'event');
};
/* Rivalen greifen selbst zu, wer zögert, geht leer aus */
HK.rivalBurgherBid = function (st) {
  // Erst wenn ein Angebot eine Weile offen liegt, greifen die Rivalen zu
  const ripe = HK.CONST.BURGHER_SALE_DAYS - 25;
  const open = Object.keys(st.burghers).filter(id => { const h = st.burghers[id]; return HK.burgherForSale(st, h) && h.owner === 'burgher' && h.sale.until - st.day <= ripe; });
  if (!open.length || Math.random() > 0.45) return;
  const r = HK.pick(st.rivals); if (!r) return;
  r.holdings.burghers = r.holdings.burghers || [];
  const h = st.burghers[HK.pick(open)];
  if (r.wealth < h.sale.price * 5 || r.holdings.burghers.length >= 8) return;
  r.wealth -= Math.round(h.sale.price * 0.35); h.owner = r.id; h.sale = null; r.holdings.burghers.push(h.id);
  HK.log(st, 'burgherRivalBought', { rival: HK.rivalName(r.id), house: HK.burgherName(h) }, 'info');
};
HK.rivalPatrician = (st, r) => (r.holdings && r.holdings.burghers || []).length >= HK.CONST.RIVAL_PATRICIAN;
HK.playerPatrician = st => HK.burgherOwned(st).length >= HK.CONST.BURGHER_PATRICIAN;

/* ---------- Tagestick ---------- */
HK.tickHooks.push(st => {
  if (!st.burghers) return;
  let rent = 0, upkeep = 0;
  for (const id in st.burghers) {
    const h = st.burghers[id];
    h.mood += HK.clamp(HK.burgherMoodTarget(st, h) - h.mood, -1.5, 1.5);
    if (h.sale && h.sale.until === st.day) { h.sale = null; }
    if (h.raisedUntil === st.day) h.mood = HK.clamp(h.mood + 10, 0, 100);
    if (h.owner !== 'player') continue;
    rent += HK.burgherRent(st, h); upkeep += HK.burgherUpkeep(st, h);
    // Verbitterte Mieter ziehen aus, neue ziehen nach
    if (h.vacantUntil > st.day) continue;
    if (h.vacantUntil && h.vacantUntil === st.day) { h.family = HK.pick(HK.BURGHER_FAMILIES); h.trade = HK.pick(HK.BURGHER_TRADES); h.mood = HK.rndi(45, 65); h.vacantUntil = 0; HK.log(st, 'burgherMovedIn', { house: HK.burgherName(h), family: h.family }, 'good'); }
    if (h.mood < 18 && Math.random() < 0.01) { h.vacantUntil = st.day + HK.rndi(30, 90); HK.log(st, 'burgherLeft', { house: HK.burgherName(h), family: h.family }, 'bad'); }
  }
  if (rent) HK.book(st, 'rent', rent);
  if (upkeep) HK.book(st, 'upkeep', -upkeep);
  // Neue Angebote, etwa zwei bis drei im Jahr, und die Gebote der Rivalen
  if (Math.random() < 0.007) HK.offerBurgher(st);
  if (st.day % 10 === 0) HK.rivalBurgherBid(st);
  // Patriziertitel: viele Häuser machen im Rat Eindruck
  if (st.day % 30 === 0 && HK.playerPatrician(st)) st.influence += 1;
});

/* Hausbesitz im Rat: wer viele Bürgerhäuser hält, gilt als Patrizier und findet leichter Rückhalt;
   Rivalen mit vielen Häusern halten dagegen. */
HK.seatSupportMod = st => (HK.playerPatrician(st) ? 1 : 0) - st.rivals.filter(r => HK.rivalPatrician(st, r)).length;

/* Brand und Sturm treffen auch die Bürgerhäuser */
{
  const origFire = HK.fireEvent;
  HK.fireEvent = function (st) {
    const mine = HK.burgherOwned(st).filter(id => !st.burghers[id].damaged);
    if (mine.length && Math.random() < 0.35) { const h = st.burghers[HK.pick(mine)]; h.damaged = true; h.mood = HK.clamp(h.mood - 15, 0, 100); HK.log(st, 'fireBurgher', { house: HK.burgherName(h) }, 'bad'); return; }
    return origFire(st);
  };
}
/* Vermögen: eigene Bürgerhäuser zählen mit */
{
  const origWorth = HK.netWorth;
  HK.netWorth = function (st) {
    let w = origWorth(st);
    if (st.burghers) for (const id of HK.burgherOwned(st)) w += HK.burgherPrice(st, st.burghers[id]) * 0.85;
    return Math.round(w);
  };
}
