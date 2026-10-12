/* Binding delivery promises, public calendars, supplier advances and named competition.
   Quotes and UI reads are pure. Only actions and daily simulation settle money/goods. */
'use strict';
HK.initTradePlanning = function (st) {
  st.tradePlanning ||= { introduced: false, nextCycle: st.day, news: [], advances: [], competition: [], nextId: 1 };
  return st.tradePlanning;
};
HK.decorateTradeArrival = function (inc) {
  inc.delayChance ??= inc.sea ? .35 : .25; inc.delayResolved ??= false;
  if (inc.tradeLot) return;
  const origin = HK.ORIGIN[inc.origin], goods = Object.keys(origin.sell), good = goods[inc.id % goods.length];
  inc.tradeLot = { good, qty: 16 + (inc.id % 3) * 4, price: Math.max(1, Math.round(HK.GOOD[good].base * HK.sellFactor(origin.sell[good]) * (.98 + (inc.id % 5) * .01))) };
};
const scheduleTradeArrival = HK.scheduleArrival;
HK.scheduleArrival = function (st, sea) { scheduleTradeArrival(st, sea); HK.decorateTradeArrival(st.incoming.at(-1)); };

HK.TRADE_NEWS = {
  marketdays: { offset: 6, duration: 3, cons: { beer: 1.35, grain: 1.2, cloth: 1.2, honey: 1.3, cheese: 1.25 } },
  quayworks: { offset: 10, duration: 3, cons: { timber: 1.4, iron: 1.2, bricks: 1.4, pitch: 1.3, rope: 1.25, canvas: 1.2 } },
  pilgrims: { offset: 8, duration: 3, cons: { fish: 1.35, smokedfish: 1.2 }, chance: .65 },
};
HK.addTradeCycle = function (st, base) {
  const P = HK.initTradePlanning(st);
  for (const [type, def] of Object.entries(HK.TRADE_NEWS)) P.news.push({ id: P.nextId++, type, start: base + def.offset, end: base + def.offset + def.duration - 1, known: !def.chance, confidence: def.chance || 1, resolved: !def.chance, happens: !def.chance });
  P.nextCycle = base + 14;
  const C = st.contracts;
  C.offers = C.offers.filter(c => c.expires > base);
  if (HK.introStage(st) < 2) return;
  for (const [good, qty, due, title] of [['grain', 18, 5, 'grain'], ['timber', 14, 9, 'timber']]) {
    if (C.offers.length >= 3) break;
    if (C.active.some(c => c.tradeTitle === title) || C.offers.some(c => c.tradeTitle === title)) continue;
    const price = Math.round(HK.GOOD[good].base * 1.4);
    C.offers.push({ id: C.nextId++, giver: 'council', type: 'deliver', good, qty, price, reward: qty * price, offered: base, expires: base + 3, days: due, deliverBy: base + due, tradeTitle: title });
  }
};
HK.introduceTradePlanning = function (st, freshGame = false) {
  const P = HK.initTradePlanning(st); st.incoming.forEach(HK.decorateTradeArrival);
  if (P.introduced || st.gameOver) return;
  P.introduced = true; HK.addTradeCycle(st, st.day);
  // The starter letter describes a real scheduled caravan and a shared stock.
  const caravan = st.incoming.find(i => !i.sea);
  if (caravan && freshGame && st.day === 0) { caravan.origin = 'umland'; caravan.days = 4; caravan.known = true; caravan.tradeLot = { good: 'grain', qty: 24, price: 24 }; }
};
HK.newGameHooks.push(st => HK.introduceTradePlanning(st, true));
HK.migrateHooks.push(HK.introduceTradePlanning);

const originalTradeConsMod = HK.consMod;
HK.consMod = function (st, good) {
  let mod = originalTradeConsMod(st, good);
  for (const news of st.tradePlanning?.news || []) if (news.happens && st.day >= news.start && st.day <= news.end) mod *= HK.TRADE_NEWS[news.type].cons[good] || 1;
  return mod;
};
HK.tradeDayStart = function (st) {
  const P = HK.initTradePlanning(st);
  if (st.day >= P.nextCycle) HK.addTradeCycle(st, st.day);
  P.news = P.news.filter(n => n.end >= st.day - 3);
  for (const news of P.news) if (!news.resolved && st.day >= news.start) {
    news.happens = Math.random() < news.confidence; news.resolved = true; news.known = true;
    HK.log(st, news.happens ? 'tradeNewsConfirmed' : 'tradeNewsDenied', { news: HK.t('tradeNews_' + news.type) }, news.happens ? 'event' : 'info');
  }
  for (const inc of st.incoming) {
    HK.decorateTradeArrival(inc);
    if (inc.days !== 1 || inc.delayResolved) continue;
    inc.delayResolved = true;
    if (Math.random() < inc.delayChance) {
      const delay = HK.rndi(1, 2); inc.days += delay; inc.delayed = delay;
      if (HK.tradeArrivalKnown(st, inc)) HK.log(st, 'tradeArrivalDelayed', { origin: HK.name(HK.ORIGIN[inc.origin]), days: delay }, 'event');
    }
  }
};
HK.buyTradeInfo = function (st, id) {
  const news = st.tradePlanning?.news.find(n => n.id === id);
  if (st.gameOver || !news || news.known || news.start <= st.day) return { ok: false, msg: 'tradeOfferGone' };
  if (st.money < 40) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'tavern', -40); news.known = true;
  HK.lehrgangMerke?.(st, 'geruecht');
  return { ok: true };
};
HK.tradeAdvances = st => (st.tradePlanning?.advances || []).filter(a => a.status === 'waiting');
HK.tradeSeasonForecast = function (st) {
  const today = HK.dayOfYear(st);
  return HK.SEASON_EVENTS.map(e => {
    const active = today >= e.from && today <= e.to, delta = active ? e.from - today : (e.from - today + 365) % 365;
    return { type: e.id, start: st.day + delta, end: st.day + delta + e.to - e.from, cons: e.cons, active };
  }).filter(e => e.active || e.start - st.day <= 45).sort((a, b) => a.start - b.start);
};
HK.tradeArrivalKnown = (st, inc) => inc.known || HK.knowsIncoming(st);
const originalTradeWhFree = HK.whFree, originalTradeWorth = HK.netWorth;
HK.whFree = st => originalTradeWhFree(st) - HK.tradeAdvances(st).reduce((q, a) => q + a.qty, 0);
HK.netWorth = st => originalTradeWorth(st) + HK.tradeAdvances(st).reduce((money, a) => money + a.cost, 0);

HK.quoteTradeAdvance = function (st, id, qty) {
  const inc = st.incoming.find(i => i.id === id), lot = inc?.tradeLot;
  if (st.gameOver || !inc || !HK.tradeArrivalKnown(st, inc) || !lot || inc.days <= 0 || !Number.isInteger(qty) || qty <= 0 || qty > lot.qty) return { ok: false, msg: 'tradeOfferGone' };
  if (HK.whFree(st) < qty) return { ok: false, msg: 'warehouseFull' };
  const price = Math.max(1, Math.round(lot.price * .92)), goods = qty * price, tariff = Math.round(goods * HK.tariffRate(st) * (1 - HK.customsDiscount(st))), cost = goods + tariff;
  return { ok: true, id, good: lot.good, qty, price, goods, tariff, cost, eta: st.day + inc.days, latest: st.day + inc.days + 8, chance: inc.delayResolved ? 0 : inc.delayChance, maxDelay: inc.delayResolved ? 0 : 2 };
};
HK.reserveTradeSupply = function (st, id, qty) {
  const q = HK.quoteTradeAdvance(st, id, qty); if (!q.ok) return q;
  if (st.money < q.cost) return { ok: false, msg: 'notEnoughMoney' };
  const inc = st.incoming.find(i => i.id === id), P = HK.initTradePlanning(st);
  HK.book(st, 'shipTrade', -q.goods); if (q.tariff) HK.book(st, 'tariffs', -q.tariff);
  inc.tradeLot.qty -= qty;
  P.advances.push({ ...q, id: P.nextId++, incomingId: id, origin: inc.origin, since: st.day, status: 'waiting' });
  HK.log(st, 'tradeAdvanceBooked', { qty, good: HK.goodName(q.good), origin: HK.name(HK.ORIGIN[inc.origin]), cost: q.cost }, 'info');
  return { ok: true, cost: q.cost };
};
HK.settleTradeArrival = function (st, inc, visitor) {
  if (!inc?.tradeLot || inc.tradeSettled) return;
  inc.tradeSettled = true;
  const lot = inc.tradeLot;
  if (lot.qty > 0) visitor.cargo[lot.good] = { qty: lot.qty, price: lot.price, quality: lot.quality ?? 100 };
  else delete visitor.cargo[lot.good];
  for (const a of HK.tradeAdvances(st).filter(a => a.incomingId === inc.id)) {
    a.status = 'delivered'; a.finished = st.day; // release warehouse reservation before adding goods
    HK.withQuality(lot.quality ?? 100, () => HK.addStock(st.warehouse.stock, a.good, a.qty, a.cost)); st.stats.volume += a.goods;
    HK.transport(st, visitor, a.good, a.qty, 'in'); st.chapters.bought += a.qty;
    HK.log(st, 'tradeAdvanceDelivered', { qty: a.qty, good: HK.goodName(a.good), origin: HK.name(HK.ORIGIN[a.origin]) }, 'good');
  }
};
for (const method of ['dockShip', 'dockCaravan']) {
  const original = HK[method];
  HK[method] = function (st, origin, inc) {
    const ok = original(st, origin);
    if (ok && inc) HK.settleTradeArrival(st, inc, method === 'dockShip' ? st.ships.at(-1) : st.caravans.at(-1));
    return ok;
  };
}
HK.tickHooks.push(st => {
  const P = HK.initTradePlanning(st);
  st.contracts.offers = st.contracts.offers.filter(c => c.expires > st.day);
  for (const a of HK.tradeAdvances(st)) {
    const inc = st.incoming.find(i => i.id === a.incomingId);
    if (inc && st.day <= a.latest) continue;
    a.status = 'refunded'; a.finished = st.day;
    if (inc) inc.tradeLot.qty += a.qty;
    HK.book(st, 'shipTrade', a.goods); if (a.tariff) HK.book(st, 'tariffs', a.tariff);
    HK.log(st, 'tradeAdvanceRefunded', { qty: a.qty, good: HK.goodName(a.good), money: a.cost }, 'info');
  }
  const finished = P.advances.filter(a => a.status !== 'waiting');
  const keep = new Set(finished.slice(-12).map(a => a.id)); P.advances = P.advances.filter(a => a.status === 'waiting' || keep.has(a.id));
});

HK.quoteBulkTrade = function (st, visitor, good, qty) {
  const row = visitor?.cargo[good];
  if (st.gameOver || !row || HK.findVisitor(st, visitor.id) !== visitor || !Number.isInteger(qty) || qty < 10 || qty > row.qty || visitor.bulkDeals?.[good]) return { ok: false, msg: 'tradeBulkUnavailable' };
  const price = Math.max(1, Math.round(row.price * .95)), goods = qty * price, tariff = Math.round(goods * HK.tariffRate(st) * (1 - HK.customsDiscount(st)));
  return { ok: true, qty, price, cost: goods + tariff, saved: qty * (row.price - price), goods, tariff };
};
HK.buyBulkTrade = function (st, visitor, good, qty) {
  const quote = HK.quoteBulkTrade(st, visitor, good, qty); if (!quote.ok) return quote;
  const row = visitor.cargo[good], price = row.price; let result;
  row.price = quote.price;
  try { result = HK.buyFromVisitor(st, visitor, good, qty, false); }
  finally { row.price = price; }
  if (result.ok) { (visitor.bulkDeals ||= {})[good] = true; HK.log(st, 'tradeBulkBought', { qty, good: HK.goodName(good), money: quote.saved }, 'good'); }
  return result;
};

// The same goods formerly taken by anonymous traders are now bought by named rivals.
// Announced demand changes their priorities; budget and stock remain hard limits.
HK.tradeCompetitor = function (st, visitor, good, day = st.day) {
  const rivals = st.rivals.filter(r => r.wealth > 0), idx = HK.GOODS.findIndex(g => g.id === good);
  return rivals.length ? rivals[(visitor.id + day + idx) % rivals.length] : null;
};
HK.tradeCompetitionQty = function (st, visitor, good, day = st.day) {
  const row = visitor.cargo[good], r = HK.tradeCompetitor(st, visitor, good, day); if (!row || !r) return 0;
  const priority = (st.tradePlanning?.news || []).some(n => n.known && n.happens && n.start >= day && n.start - day <= 4 && HK.TRADE_NEWS[n.type].cons[good] > 1);
  return Math.min(row.qty, Math.floor(row.qty * (priority ? .21 : .14)), Math.floor(r.wealth / Math.max(1, row.price * (1 + HK.tariffRate(st)))));
};
HK.recordTradeCompetition = function (st, visitor, good, qty) {
  const r = HK.tradeCompetitor(st, visitor, good); if (!r || qty <= 0) return;
  const cost = qty * visitor.cargo[good].price * (1 + HK.tariffRate(st));
  r.wealth += qty * HK.marketSellPrice(st, good, qty) - cost;
  const P = HK.initTradePlanning(st); P.competition.push({ day: st.day, rival: r.id, visitor: visitor.name, good, qty });
  if (P.competition.length > 12) P.competition.shift();
};

const originalAcceptTradeContract = HK.acceptContract, originalDeliverTradeContract = HK.deliverContract;
HK.acceptContract = function (st, id) {
  const c = st.contracts.offers.find(c => c.id === id);
  if (st.gameOver || !c || c.expires <= st.day || (c.deliverBy !== undefined && c.deliverBy < st.day)) return { ok: false, msg: 'tradeOfferGone' };
  const r = originalAcceptTradeContract(st, id); if (r.ok && c.deliverBy !== undefined) c.deadline = c.deliverBy;
  if (r.ok) HK.lehrgangMerke?.(st, 'zwischen');
  return r;
};
HK.deliverContract = function (st, id) {
  const c = st.contracts.active.find(c => c.id === id);
  if (st.gameOver || !c || st.day > c.deadline) return { ok: false, msg: 'tradeOfferGone' };
  const result = originalDeliverTradeContract(st, id);
  if (result.ok && c.type === 'deliver') { HK.transport(st, c.visitorId?HK.findVisitor(st,c.visitorId):null, c.good, c.qty, 'out', c.visitorId?'visitor':'market'); HK.lehrgangMerke?.(st, 'lieferung'); }
  return result;
};

Object.assign(HK.I18N.de, {
  tradePlanning: 'Handelsvorhaben', tradePlanningTab: 'Planung', tradePlan: 'Planen', tradePlanningHint: 'Termine abwägen, Geld binden, Lieferungen sichern.',
  tradeTeaser: '{qty} Last {good} bis {date}', tradePromises: 'Deine Lieferzusagen', tradeTitle_grain: 'Korn für die Markttage', tradeTitle_timber: 'Bauholz für den Kai',
  tradeStory_grain: 'Der Rat braucht Getreide vor den Markttagen. Sofort einkaufen oder auf die günstigere Karawane warten?',
  tradeStory_timber: 'Die Zimmerleute brauchen Holz vor Beginn der Kaiarbeiten. Sichere die Ware, bevor andere Händler zugreifen.',
  tradeFixedRevenue: 'Fester Erlös', tradeDue: 'Liefern bis', tradePenalty: 'Bei Fristbruch: {penalty} Mark Strafe und Verlust an Ruf und Ansehen.',
  tradeOfferUntil: 'Zusage möglich bis {date}. Die Lieferfrist bleibt fest.', tradePromise: 'Verbindlich zusagen', tradeStock: '{have}/{qty} Last im Lager · noch {missing} fehlen',
  tradeBuyNow: 'Sofortige Beschaffung', tradeMarketCost: '{qty} Last · {cost} Mark Gesamtkosten', tradeSourceNow: 'Jetzt am Markt beschaffen',
  tradeWaitSource: 'Angekündigte Lieferung aus {origin}', tradeLateRisk: 'Eine Verzögerung kann die Lieferfrist sprengen.', tradePrepay: 'Vorauszahlen & Ware sichern',
  tradeEta: 'Erwartet: {date}', tradeDelayRisk: '{chance} % Risiko für 1–2 Tage Verzögerung', tradeDelayResolved: 'Transportverzögerung bereits geklärt',
  tradeBerthRisk: 'Unwetter, volle Liegeplätze und Sperren können die Ankunft zusätzlich verschieben.', tradeLandRisk: 'Frost, gesperrte Landwege und ein voller Karawanenplatz am Stadttor können die Ankunft zusätzlich verschieben.', tradeNoPlans: 'Neue befristete Vorhaben erscheinen mit dem nächsten Marktzyklus. Weitere Aufträge findest du beim Rat, der Gilde und dem Kloster.',
  tradeCalendar: 'Nachrichten & Kalender', tradeUnheard: 'Ein Hinweis aus der Taverne', tradeUnheardHint: 'Eine erwartete Nachfrageänderung; der Bericht ist unbestätigt.', tradeInfoBuy: 'Hinweis kaufen · 40 Mark',
  tradeConfirmed: 'Offiziell bestätigt', tradeDenied: 'Nicht eingetreten', tradeReliability: 'Gerücht · {chance} % Verlässlichkeit',
  tradeInTransit: '{qty} Last bereits vorausbezahlt und unterwegs. Sie zählen erst nach Ankunft zum Lagerbestand.', tradeBackupBuy: 'Ersatz am Markt beschaffen',
  tradeSeason_lent: 'Fastenzeit', tradeSeason_easter: 'Ostern', tradeSeason_midsummer: 'Johannisfest', tradeSeason_michaelmas: 'Michaelis', tradeSeason_christmas: 'Weihnachten',
  tradeNews_marketdays: 'Die nächsten Markttage', tradeNews_quayworks: 'Arbeiten am Hafenkai', tradeNews_pilgrims: 'Ein Pilgerzug wird erwartet',
  tradeNewsText_marketdays: 'Bürger und Gäste kaufen mehr Bier, Korn, Tuch, Honig und Käse. Der Termin steht fest.',
  tradeNewsText_quayworks: 'Der Rat hat die Kaiarbeiten angesetzt. Die Arbeiten brauchen mehr Holz, Eisen, Backsteine, Pech, Seile und Segeltuch.',
  tradeNewsText_pilgrims: 'Ein Wirt erwartet Pilger zur Fastenspeisung. Kommen sie an, steigt die Nachfrage nach Fisch. Der Bericht kann sich als falsch erweisen.',
  tradeDemandEffect: 'Bei Eintritt: Nachfrage {goods}.', tradeCalendarHint: 'Nachfrage beeinflusst Preise und Tagesmengen. Ein höherer Verkaufspreis ist kein garantierter Gewinn: Einkauf, Zoll, Lagerplatz und Konkurrenz zählen mit.',
  tradeAnnouncedSupply: 'Ware vor der Ankunft sichern', tradeAdvanceTerms: 'Du zahlst die gesamte ausgewählte Menge samt heutigem Zoll voraus, erhältst einen Preisnachlass und reservierst Lagerplatz. Diese Ware ist vor anderen Käufern geschützt. Bei Ankunft geht sie automatisch ins Lager; eine verspätete Ankunft verschiebt deine Lieferzusage nicht.',
  tradeRefundDate: 'Falls bis dahin nicht geliefert: vollständige Erstattung am {date}.', tradeNoKnownSupply: 'Noch keine angekündigte Lieferung bekannt. In der Taverne oder beim Hafenmeister erfährst du mehr.',
  tradeAdvance_waiting: 'vorausbezahlt · unterwegs', tradeAdvance_delivered: 'ins Lager geliefert', tradeAdvance_refunded: 'vollständig erstattet',
  tradeCompetition: 'Andere Kaufleute', tradeCompetitionHint: 'Rivalen kaufen dieselben begrenzten Waren. Angekündigte Nachfrage zieht sie an. Vorausbezahlte Mengen sind reserviert; ungesicherte Ware kann verschwinden.',
  tradeRivalPurchase: '{rival} kaufte {qty} Last {good} bei {ship}.', tradeNoCompetition: 'Mit dem nächsten Tag greifen auch die anderen Kaufleute zu.',
  tradeBulk: 'Mengenrabatt · {qty} Last für {cost} Mark', tradeBulkSaving: 'Preisnachlass: {money} Mark vor Zoll. Einmal je Ware und Besuch; mindestens 10 Last.',
  tradeRivalIntent: 'Morgen will {rival} hier bis zu {qty} Last kaufen.', tradeBulkUnavailable: 'Der Mengenrabatt ist für diese Menge oder diesen Besuch nicht verfügbar.', tradeOfferGone: 'Dieses Angebot ist abgelaufen oder die Menge ist nicht mehr verfügbar.',
  tradeNewsConfirmed: 'Bestätigt: {news}. Die angekündigte Nachfrage tritt ein.', tradeNewsDenied: 'Der Bericht „{news}“ hat sich nicht bestätigt.', tradeArrivalDelayed: 'Die Lieferung aus {origin} verspätet sich um {days} Tage.',
  tradeAdvanceBooked: '{qty} Last {good} aus {origin} für {cost} Mark vorausbezahlt. Die Ware ist reserviert.', tradeAdvanceDelivered: '{qty} Last {good} aus {origin} wurden ins Lager geliefert.', tradeAdvanceRefunded: 'Die vorausbezahlten {qty} Last {good} kamen nicht rechtzeitig an. {money} Mark wurden vollständig erstattet.',
  tradeBulkBought: 'Mengenrabatt: {qty} Last {good} gekauft; {money} Mark Preisnachlass vor Zoll.',
});
Object.assign(HK.I18N.en, {
  tradePlanning: 'Trading ventures', tradePlanningTab: 'Planning', tradePlan: 'Plan', tradePlanningHint: 'Weigh deadlines, commit cash and secure supplies.',
  tradeTeaser: '{qty} last of {good} by {date}', tradePromises: 'Your delivery promises', tradeTitle_grain: 'Grain for market days', tradeTitle_timber: 'Timber for the quay',
  tradeStory_grain: 'The council needs grain before market days. Buy now or wait for the cheaper caravan?', tradeStory_timber: 'Carpenters need timber before work on the quay begins. Secure supplies before other merchants buy them.',
  tradeFixedRevenue: 'Fixed revenue', tradeDue: 'Deliver by', tradePenalty: 'Missing the deadline costs {penalty} marks and reputation and standing.',
  tradeOfferUntil: 'Commit by {date}. The delivery deadline stays fixed.', tradePromise: 'Commit to delivery', tradeStock: '{have}/{qty} last in stock · {missing} still needed',
  tradeBuyNow: 'Immediate supply', tradeMarketCost: '{qty} last · {cost} marks total', tradeSourceNow: 'Buy at market now', tradeWaitSource: 'Announced delivery from {origin}', tradeLateRisk: 'A delay could break the delivery deadline.', tradePrepay: 'Prepay & secure goods',
  tradeEta: 'Expected: {date}', tradeDelayRisk: '{chance}% risk of a 1–2 day delay', tradeDelayResolved: 'Transport delay already resolved', tradeBerthRisk: 'Storms, full berths and closures may delay arrival further.', tradeLandRisk: 'Frost, closed country roads and a full caravan camp at the town gate may delay arrival further.',
  tradeNoPlans: 'New timed ventures appear with the next market cycle. Other contracts are available from the council, guild and abbey.',
  tradeCalendar: 'News & calendar', tradeUnheard: 'A tip from the tavern', tradeUnheardHint: 'An expected change in demand; this report is unconfirmed.', tradeInfoBuy: 'Buy information · 40 marks',
  tradeConfirmed: 'Officially confirmed', tradeDenied: 'Did not happen', tradeReliability: 'Rumour · {chance}% reliability', tradeNews_marketdays: 'The next market days', tradeNews_quayworks: 'Work on the harbour quay', tradeNews_pilgrims: 'Pilgrims are expected',
  tradeInTransit: '{qty} last already prepaid and in transit. They count as stock only after arrival.', tradeBackupBuy: 'Buy backup stock at market',
  tradeSeason_lent: 'Lent', tradeSeason_easter: 'Easter', tradeSeason_midsummer: 'Midsummer', tradeSeason_michaelmas: 'Michaelmas', tradeSeason_christmas: 'Christmas',
  tradeNewsText_marketdays: 'Citizens and visitors buy more beer, grain, cloth, honey and cheese. The dates are fixed.', tradeNewsText_quayworks: 'The council has scheduled quay repairs. The works need more timber, iron, bricks, pitch, rope and sailcloth.', tradeNewsText_pilgrims: 'An innkeeper expects pilgrims for fasting meals. Their arrival would raise fish demand. The report may prove false.',
  tradeDemandEffect: 'If it happens: demand {goods}.', tradeCalendarHint: 'Demand affects prices and daily quantities. A higher sale price does not guarantee profit: purchase cost, duty, warehouse space and competition matter.',
  tradeAnnouncedSupply: 'Secure goods before arrival', tradeAdvanceTerms: 'Pay the full selected quantity and current duty in advance for a discount and reserved warehouse space. These goods are protected from other buyers and go into your warehouse automatically on arrival. A delayed arrival does not move your delivery promise.',
  tradeRefundDate: 'If still undelivered: full refund on {date}.', tradeNoKnownSupply: 'No delivery has been announced yet. Ask at the tavern or harbour master’s office.',
  tradeAdvance_waiting: 'prepaid · in transit', tradeAdvance_delivered: 'delivered to warehouse', tradeAdvance_refunded: 'fully refunded', tradeCompetition: 'Other merchants', tradeCompetitionHint: 'Rivals buy the same limited goods. Announced demand attracts them. Prepaid quantities are reserved; unsecured goods may disappear.',
  tradeRivalPurchase: '{rival} bought {qty} last of {good} from {ship}.', tradeNoCompetition: 'Other merchants will start buying when the next day begins.', tradeBulk: 'Bulk deal · {qty} last for {cost} marks', tradeBulkSaving: 'Price reduction: {money} marks before duty. Once per good and visit; at least 10 last.',
  tradeRivalIntent: 'Tomorrow {rival} intends to buy up to {qty} last here.', tradeBulkUnavailable: 'The bulk discount is unavailable for this quantity or visit.', tradeOfferGone: 'This offer has expired or the quantity is no longer available.',
  tradeNewsConfirmed: 'Confirmed: {news}. The announced demand has arrived.', tradeNewsDenied: 'The report “{news}” did not come true.', tradeArrivalDelayed: 'The delivery from {origin} is delayed by {days} days.', tradeAdvanceBooked: 'Prepaid {qty} last of {good} from {origin} for {cost} marks. The goods are reserved.', tradeAdvanceDelivered: '{qty} last of {good} from {origin} were delivered to your warehouse.', tradeAdvanceRefunded: 'The prepaid {qty} last of {good} did not arrive in time. {money} marks were refunded in full.', tradeBulkBought: 'Bulk deal: bought {qty} last of {good}, saving {money} marks before duty.',
});

HK.introSync = function(st) {
  if (!st.contracts || !st.tradePlanning || !st.post) return;
  const stage = HK.introStage(st), C = st.contracts;
  if (stage === 1 && !st.lehrgang.flags.zwischen && !C.active.length) {
    C.offers = C.offers.filter(c => c.expires > st.day);
    if (!C.offers.length) {
      const price = Math.round(HK.GOOD.grain.base * 1.4);
      C.offers.push({id:C.nextId++,giver:'council',type:'deliver',good:'grain',qty:18,price,reward:18*price,offered:st.day,expires:st.day+12,days:12,tradeTitle:'grain',intro:true});
    }
  }
  if (stage === 2 && st.lehrgang?.guided && !st.lehrgang.released) {
    st.lehrgang.released = true;
    HK.refreshContracts(st);
  }
  HK.postSync?.(st);
};
