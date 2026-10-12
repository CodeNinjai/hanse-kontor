/* Handelsbelege, Transportaufträge, Preisgedächtnis und drei verbundene Kapitel.
   DOM-frei: Eine Animation verändert niemals Geld oder Warenbestände. */
'use strict';
HK.initProgress = function (st) {
  st.freight ||= { nextId: 1, jobs: [] };
  st.priceHistory ||= [];
  st.regularCaptains ||= {};
  st.chapters ||= { step: 0, bought: 0, sold: {}, done: [], choice: null };
};
HK.cargoKind = g => g === 'cattle' ? 'livestock' : ['grain', 'salt', 'wool', 'spices', 'hemp', 'flax', 'flour'].includes(g) ? 'sack' : ['beer', 'wine', 'fish', 'smokedfish', 'wax', 'pitch', 'honey', 'milk'].includes(g) ? 'barrel' : 'crate';
HK.transport = function (st, source, good, qty, direction, kind = 'visitor', owner = 'player') {
  if (!HK.GOOD[good] || !(qty > 0)) return null;
  HK.initProgress(st);
  const jobs = st.freight.jobs, id = st.freight.nextId++, count = Math.min(3, Math.ceil(qty / 8));
  const index = kind === 'own' ? (source.anchorIndex ?? st.ownShips.indexOf(source)) : kind === 'visitor' && !source.sea ? (source.spotIndex ?? st.caravans.indexOf(source)) : -1;
  const job = { id, day: st.day, kind, owner, sourceId: source?.id ?? null, sea: kind === 'own' || !!source?.sea,
    berth: source?.berth ?? -1, index, good, qty, direction, status: 'queued', completed: 0, origin: source?.origin || null,
    parcels: Array.from({ length: count }, (_, i) => ({ id: 'freight:' + id + ':' + i, jobId: id, good, kind: HK.cargoKind(good),
      owner, qty: Math.floor(qty / count) + (i < qty % count ? 1 : 0), direction, state: 'queued' })) };
  jobs.push(job);
  HK.trimFreight(st);
  if (owner === 'player') HK.scheduleSave?.();
  return job;
};
HK.trimFreight = function (st) {
  // Long sessions retain the latest receipts, never discard unfinished work.
  const complete = st.freight.jobs.filter(j => j.status === 'done');
  const keep = new Set(complete.slice(-40).map(j => j.id));
  st.freight.jobs = st.freight.jobs.filter(j => j.status !== 'done' || keep.has(j.id));
};
// Ordinary receipts describe settled transfers; nightCargo uses its saved
// handover schedule in nachttransport.js. Drawing must never book
// the same goods again. Local production uses the same transport pipeline.
HK.localTransport = function (st, from, to, good, qty, owner = 'player') {
  qty = Math.floor(qty); if (qty <= 0 || from === to) return null;
  const job = HK.transport(st, null, good, qty, to === 'warehouse' ? 'in' : 'out', 'local', owner);
  if (job) {
    job.fromBuilding = from; job.toBuilding = to;
    if(!['warehouse','market'].includes(from)) job.afterJobs=st.freight.jobs.filter(j=>j.id<job.id&&j.toBuilding===from&&j.status!=='done').map(j=>j.id);
  }
  return job;
};
HK.freightBuildings = function (job) {
  if (job.fromBuilding && job.toBuilding) return [job.fromBuilding, job.toBuilding];
  const home = job.owner === 'city' ? 'market' : 'warehouse';
  const other = job.kind === 'market' ? 'market' : job.kind === 'rural' ? job.ruralSite : null;
  return job.direction === 'in' ? [other, home] : [home, other];
};
HK.freightBuildingName = id => HK.name(HK.BUILDING[id] || HK.RURAL_BUILDINGS?.[id] || { name: {de: 'Umschlagplatz', en: 'Transfer point'} });
HK.completeParcel = function (st, parcel) {
  const job = st.freight?.jobs.find(j => j.id === parcel.jobId);
  if (!job || parcel.state === 'done') return;
  parcel.state = 'done'; job.completed += parcel.qty;
  if (job.kind === 'visitor' && job.direction === 'out') {
    const visitor = HK.findVisitor(st, job.sourceId);
    if (visitor) { visitor.receivedCargo ||= {}; visitor.receivedCargo[parcel.good] = (visitor.receivedCargo[parcel.good] || 0) + parcel.qty; }
  }
  if (job.completed >= job.qty) { job.completed = job.qty; job.status = 'done'; job.finishedDay = st.day; }
};
HK.visibleCargo = function (st, source, kind) {
  const cargo = {};
  for (const [g, c] of Object.entries(source.cargo || {})) cargo[g] = typeof c === 'number' ? c : c.qty;
  if (kind === 'visitor') for (const [g, qty] of Object.entries(source.receivedCargo || {})) cargo[g] = (cargo[g] || 0) + qty;
  for (const job of st.freight?.jobs || []) if (job.sourceId === source.id && job.kind === kind && job.status !== 'done') {
    if (kind === 'own' && job.direction === 'out') cargo[job.good] = (cargo[job.good] || 0) - (job.qty - job.completed);
    if (job.direction === 'in') cargo[job.good] = (cargo[job.good] || 0) + job.parcels.filter(p => ['queued', 'craneQueue'].includes(p.state)).reduce((n, p) => n + p.qty, 0);
  }
  for (const g in cargo) if (cargo[g] <= 0) delete cargo[g];
  return cargo;
};
HK.recordPrices = function (st) {
  HK.initProgress(st);
  const goods = {};
  for (const g of HK.GOODS) goods[g.id] = { buy: HK.marketBuyPrice(st, g.id, 1), sell: HK.marketSellPrice(st, g.id, 1) };
  const point = { day: st.day, goods }, last = st.priceHistory.at(-1);
  if (last?.day === st.day) st.priceHistory[st.priceHistory.length - 1] = point; else st.priceHistory.push(point);
  if (st.priceHistory.length > 60) st.priceHistory.splice(0, st.priceHistory.length - 60);
};
HK.captainRecord = function (st, v) { return st.regularCaptains?.[v.captainId]; };
const originalVisitor = HK.makeVisitor;
HK.REGULAR_CAPTAIN_NAMES = [...new Set(HK.CAPTAIN_NAMES.concat(HK.CAPTAIN_NAMES2, ['Bertolt Witte', 'Godeke Brandt', 'Hermann Stegel', 'Albrecht Wulff', 'Diederik Pape', 'Anders Holm', 'Matthias Vinke', 'Evert Greve', 'Niels Brok', 'Jasper Smit', 'Ludeke Horn', 'Willem de Groot', 'Jakob Rade', 'Hendrik Engel', 'Otto Berg', 'Simon Faber', 'Paul Wegener', 'Sören Dahl']))];
HK.makeVisitor = function (st, origin) {
  const v = originalVisitor(st, origin);
  if (!v.sea) return v;
  HK.initProgress(st);
  const oi = HK.ORIGINS.findIndex(o => o.id === origin), candidates = Array.from({ length: HK.BERTHS.length }, (_, i) => origin + ':' + i).concat(Object.keys(st.regularCaptains).filter(id => id.startsWith('legacy:' + origin + ':') || id.startsWith(origin+':') && +id.split(':').at(-1)>=HK.BERTHS.length));
  // Pick an available captain so the same person cannot command two ships at once.
  const free = candidates.filter(id => !st.ships.some(s => s.captainId === id) && !st.incoming.some(i => i.captainId === id));
  if(!free.length){let slot=HK.BERTHS.length;while(st.regularCaptains[origin+':'+slot]||st.incoming.some(i=>i.captainId===origin+':'+slot))slot++;free.push(origin+':'+slot);}
  const known = free.filter(id => st.regularCaptains[id]);
  const id = HK.pick(known.length && Math.random() < 0.65 ? known : free.length ? free : candidates), slot = +id.split(':').at(-1);
  const record = st.regularCaptains[id] ||= { name: HK.REGULAR_CAPTAIN_NAMES[(oi * HK.BERTHS.length + slot) % HK.REGULAR_CAPTAIN_NAMES.length], visits: 0, trust: 0, traded: 0, lastTradeVisit: null };
  record.visits++; record.lastSeen = st.day; v.captainId = id; v.captain = record.name;
  const discount = Math.min(0.04, Math.max(0, record.trust) * 0.005);
  for (const c of Object.values(v.cargo)) c.price = Math.max(1, Math.round(c.price * (1 - discount)));
  for (const w of Object.values(v.wants)) w.price = Math.max(1, Math.round(w.price * (1 + discount)));
  v.captainDiscount = discount;
  return v;
};
HK.noteCaptainTrade = function (st, v, qty, result, smuggle) {
  const record = HK.captainRecord(st, v); if (!record) return;
  record.traded += qty;
  if (result.caught) record.trust = Math.max(-8, record.trust - 2);
  else if (!smuggle && record.lastTradeVisit !== v.id) { record.trust = Math.min(8, record.trust + 1); record.lastTradeVisit = v.id; }
};
for (const [name, direction] of [['buyFromVisitor', 'in'], ['sellToVisitor', 'out']]) {
  const original = HK[name];
  HK[name] = function (st, v, g, qty, smuggle) {
    const result = original(st, v, g, qty, smuggle);
    if (result.ok) {
      const job=HK.transport(st, v, g, Math.floor(qty), direction);
      if(result.deferredCargo){HK.queueNightCargo(st,job,result.deferredCargo,v);return result;}
      HK.noteCaptainTrade(st, v, Math.floor(qty), result, smuggle);
      if (direction === 'in') st.chapters.bought += Math.floor(qty);
      else if (v.sea) st.chapters.sold[v.origin] = (st.chapters.sold[v.origin] || 0) + Math.floor(qty);
      HK.recordPrices(st);
    }
    return result;
  };
}
for (const [name, direction] of [['marketBuy', 'in'], ['marketSell', 'out']]) {
  const original = HK[name];
  HK[name] = function (st, g, qty) { const r = original(st, g, qty); if (r.ok) { HK.transport(st, null, g, Math.floor(qty), direction, 'market'); HK.recordPrices(st); } return r; };
}
for (const [name, direction] of [['loadShip', 'out'], ['unloadShip', 'in']]) {
  const original = HK[name];
  HK[name] = function (st, id, g, qty) { const r = original(st, id, g, qty); if (r.ok) HK.transport(st, st.ownShips.find(s => s.id === id), g, Math.floor(qty), direction, 'own'); return r; };
}

const originalBuyShip = HK.buyShip;
HK.buyShip = function (st, type) { const r = originalBuyShip(st, type); if (r.ok) { const ship = st.ownShips.at(-1); ship.anchorIndex = HK.OWN_BERTHS.findIndex((b, i) => !st.ownShips.some(s => s !== ship && (s.anchorIndex ?? st.ownShips.indexOf(s)) === i)); HK.scheduleSave?.(); } return r; };
const originalDockCaravan = HK.dockCaravan;
HK.dockCaravan = function (st, origin) {
  const spot = HK.CARAVAN_SPOTS.findIndex((p, i) => !st.caravans.some((v, vi) => (v.spotIndex ?? vi) === i));
  if (spot < 0) return false;
  const ok = originalDockCaravan(st, origin); if (ok) st.caravans.at(-1).spotIndex = spot;
  return ok;
};
HK.chapterReady = st => st.chapters.step === 0 ? st.chapters.bought >= 10 : st.chapters.step === 1 ? (st.warehouse.stock.grain || 0) >= 12 : st.chapters.step === 2 ? Object.values(st.chapters.sold).filter(q => q >= 10).length >= 2 : false;
HK.finishChapter = function (st, choice) {
  HK.initProgress(st); if (!HK.chapterReady(st) || st.gameOver) return { ok: false, msg: 'chapterNotReady' };
  const c = st.chapters, step = c.step;
  if (step === 1 && !['aid', 'contract'].includes(choice)) return { ok: false };
  if (step === 1) {
    HK.addStock(st.warehouse.stock, 'grain', -12); c.choice = choice;
    HK.transport(st, null, 'grain', 12, 'out', 'market');
    if (choice === 'aid') { st.rep = HK.clamp(st.rep + 5, 0, 100); st.piety = HK.clamp(st.piety + 4, 0, 100); }
    else HK.book(st, 'contracts', Math.round(12 * HK.GOOD.grain.base * 1.2));
    c.sold = {}; // final chapter measures the trade network built after this decision
  } else { HK.book(st, 'contracts', step === 0 ? 250 : 750); st.influence += step === 0 ? 2 : 5; }
  c.done.push({ step, day: st.day, choice: choice || null }); c.step++;
  HK.log(st, 'chapterFinished', { chapter: HK.t('chapterTitle' + step) }, 'good'); HK.scheduleSave?.();
  return { ok: true };
};
HK.newGameHooks.push(st => { HK.initProgress(st); HK.recordPrices(st); });
HK.migrateHooks.push(st => {
  HK.initProgress(st);
  st.ownShips.forEach((s, i) => { s.anchorIndex ??= i; });
  st.caravans.forEach((v, i) => { v.spotIndex ??= i; });
  for (const j of st.freight.jobs) {
    // Resume a partially shown receipt from its remaining parcels after loading.
    for (const p of j.parcels) if (p.state !== 'done') p.state = 'queued';
    if (j.status !== 'done') j.status = 'queued';
  }
  for (const v of st.ships) if (!v.captainId) {
    v.captainId = 'legacy:' + v.origin + ':' + v.captain;
    st.regularCaptains[v.captainId] ||= { name: v.captain, visits: 1, trust: 0, traded: 0, lastTradeVisit: null };
  }
  HK.recordPrices(st);
});
HK.tickHooks.push(st => {
  HK.recordPrices(st);
  for (const j of st.freight.jobs) {
    const source = j.kind === 'own' ? st.ownShips.find(s => s.id === j.sourceId && s.status === 'port') : j.kind === 'visitor' ? HK.findVisitor(st, j.sourceId) : true;
    if (!j.nightCargo && j.status !== 'done' && (!source || st.day - j.day > 7)) {
      // Trades are already settled; accelerated time closes outstanding visual
      // receipts at departure, without debiting or crediting stock a second time.
      for (const p of j.parcels) HK.completeParcel(st, p);
      j.closedAtDeparture = !source;
    }
  }
  HK.trimFreight(st);
});
Object.assign(HK.I18N.de, {
  saveFailed: 'Speichern fehlgeschlagen. Bitte den Spielstand über „Exportieren“ sichern.',
  speed1: '20 Minuten je Tag', speed2: '2 Minuten je Tag', speed3: '6 Sekunden je Tag',
  priceHistory: 'Preisverlauf · letzte 60 Tage', priceHistoryEmpty: 'Weitere Preise entstehen mit jedem Spieltag.', marketBuyLine: 'Markt: Einkauf', marketSellLine: 'Markt: Verkauf',
  regularCaptain: 'Stammkapitän', captainVisits: '{n}. Besuch · Vertrauen {trust}/8', captainAdvantage: 'Preisvorteil bei dieser Ankunft: {n} %', captainTrustHint: 'Ehrlicher Handel stärkt das Vertrauen einmal je Besuch. Vorteile gelten bei der nächsten Ankunft.',
  freight: 'Warenverkehr', freightReceipt: '{qty} Last {good} · {done} übergeben', freightIn: 'zum Lager', freightOut: 'vom Lager', freightQueued: 'wartet', freightActive: 'unterwegs', freightDone: 'abgeschlossen',
  chapters: 'Die ersten Handelsbriefe', chapterTitle0: 'Ein Name am Kai', chapterTitle1: 'Zwölf Last für die Stadt', chapterTitle2: 'Zwei Häfen, ein Handelshaus',
  chapterText0: 'Der Hafenmeister empfiehlt dich erst weiter, wenn du zehn Last bei Schiffen oder Karawanen eingekauft hast. Danach erhältst du deinen ersten Handelsbrief: 250 Mark und 2 Einfluss.',
  chapterText1: 'Der Kornspeicher braucht zwölf Last Getreide. Hilfst du der Stadt als Stifter oder nimmst du einen bezahlten Liefervertrag an? Die Ware wird aus deinem Lager geliefert.',
  chapterText2: 'Dein Handelsbrief öffnet Türen. Verkaufe jetzt jeweils zehn Last an Schiffe aus zwei verschiedenen Häfen. Die Kaufleute honorieren das neue Netz mit 750 Mark und 5 Einfluss.',
  chapterProgress0: '{n}/10 Last eingekauft', chapterProgress2: '{n}/2 Häfen mit je zehn Last beliefert', chapterClaim: 'Handelsbrief abholen', chapterAid: 'Stiften (+5 Ruf, +4 Frömmigkeit)', chapterContract: 'Liefervertrag ({money} Mark)', chapterComplete: 'Deine drei Handelsbriefe sind vollständig.', chapterFinished: 'Handelsbrief: „{chapter}“ abgeschlossen.', chapterNotReady: 'Die Bedingungen für diesen Handelsbrief sind noch nicht erfüllt.',
});
Object.assign(HK.I18N.en, {
  saveFailed: 'Saving failed. Please use “Export” to keep a copy of your game.',
  speed1: '20 minutes per day', speed2: '2 minutes per day', speed3: '6 seconds per day',
  priceHistory: 'Price history · last 60 days', priceHistoryEmpty: 'More prices are recorded each game day.', marketBuyLine: 'Market: buy', marketSellLine: 'Market: sell',
  regularCaptain: 'Returning captain', captainVisits: 'Visit {n} · trust {trust}/8', captainAdvantage: 'Price advantage on this arrival: {n}%', captainTrustHint: 'Honest trade increases trust once per visit. Better prices apply on the next arrival.',
  freight: 'Cargo movements', freightReceipt: '{qty} units of {good} · {done} handed over', freightIn: 'to warehouse', freightOut: 'from warehouse', freightQueued: 'waiting', freightActive: 'in transit', freightDone: 'completed',
  chapters: 'Your first trading letters', chapterTitle0: 'A name at the quay', chapterTitle1: 'Twelve loads for the town', chapterTitle2: 'Two ports, one trading house',
  chapterText0: 'The harbour master will recommend you after you buy ten units from ships or caravans. Your first trading letter earns 250 marks and 2 influence.',
  chapterText1: 'The granary needs twelve units of grain. Donate them to the town or accept a paid delivery contract. The goods come from your warehouse.',
  chapterText2: 'Your trading letter opens doors. Now sell ten units each to ships from two different ports. The merchants reward your network with 750 marks and 5 influence.',
  chapterProgress0: '{n}/10 units purchased', chapterProgress2: '{n}/2 ports supplied with ten units each', chapterClaim: 'Collect trading letter', chapterAid: 'Donate (+5 reputation, +4 piety)', chapterContract: 'Delivery contract ({money} marks)', chapterComplete: 'You have completed all three trading letters.', chapterFinished: 'Trading letter: “{chapter}” completed.', chapterNotReady: 'This trading letter’s conditions are not yet met.',
});
