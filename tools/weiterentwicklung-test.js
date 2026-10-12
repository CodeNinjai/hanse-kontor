/* node tools/weiterentwicklung-test.js */
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
let seed = 739, checks = 0;
const math = Object.create(Math); math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const ctx = vm.createContext({ console, Intl, Math: math, Date, JSON });
for (const file of ['data', 'town', 'i18n', 'game', 'paths', 'rivals', 'contracts', 'sea', 'family', 'offices', 'faith', 'deals', 'staff', 'burghers', 'chains', 'ostviertel', 'ausgleich', 'lehrgang', 'weiterentwicklung', 'handelsvorhaben', 'ereignisse', 'salzgeschichte', 'salzgeschichte-text','korrespondenz','korrespondenz-text','landwirtschaft', 'bevoelkerung', 'iso', 'scene', 'buildings', 'art', 'flair', 'stadtereignisse', 'warenverkehr','landwirtschaft-scene','fischerboote']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', file + '.js'), 'utf8'), ctx, { filename: file });
const H = vm.runInContext('HK', ctx), S = H.Scene;
const check = (value, message) => { checks++; assert(value, message); };
function fresh() { H.state = H.newGame({ name: 'Prüfung', difficulty: 'normal', years: 20 }); H.state.money = 100000; H.state.freight.jobs = []; S._docks = null; S.walkers = []; S.porters = []; S.chickens = []; S.carts = []; S.time = 0; S.clock = .5; S.snapShips(); H.UI = { selectedVisitor: null }; return H.state; }
let st = fresh(), v = st.ships[0]; v.cargo = { salt: { qty: 20, price: 40 } }; v.wants = { beer: { qty: 30, price: 60 } };
let money = st.money, salt = st.warehouse.stock.salt;
const buy = H.buyFromVisitor(st, v, 'salt', 10, false);
check(buy.ok && st.money === money - buy.cost && st.warehouse.stock.salt === salt + 10, 'Kauf wird nicht genau einmal gebucht');
check(st.freight.jobs.length === 1 && st.freight.jobs[0].qty === 10 && st.freight.jobs[0].direction === 'in', 'Kauf erzeugt keinen passenden Transport');
check(!H.buyFromVisitor(st, v, 'salt', 100, false).ok && st.freight.jobs.length === 1, 'Abgelehnter Kauf erzeugt Transport');
money = st.money; const beer = st.warehouse.stock.beer, sell = H.sellToVisitor(st, v, 'beer', 12, false);
check(sell.ok && st.money === money + sell.cost && st.warehouse.stock.beer === beer - 12 && st.freight.jobs.at(-1).direction === 'out', 'Verkauf hat falsche Richtung oder Buchung');
// Mixed directions and goods through the same cranes, plus market, caravans
// and own ships served by cargo tenders. No rendering is needed for simulation.
st = fresh(); st.ships = Array.from({ length: 5 }, (_, berth) => ({ id: 9500 + berth, berth, sea: true, origin: 'luebeck', name: 'Prüfschiff', cargo: {}, wants: {}, daysLeft: 6 })); S.snapShips();
S.walkers = Array.from({ length: 70 }, () => S.makeWalker(true));
S.initCarts();
for (const ship of st.ships) for (const good of ['salt', 'beer', 'tools']) for (const direction of ['in', 'out']) H.transport(st, ship, good, 17, direction);
H.transport(st, st.caravans[0], 'salt', 17, 'in'); H.transport(st, st.caravans[0], 'beer', 10, 'out');
H.transport(st, null, 'grain', 12, 'in', 'market'); H.transport(st, null, 'wool', 8, 'out', 'market');
check(H.buyShip(st, 'kogge').ok, 'Eigenes Schiff lässt sich nicht bauen'); const own = st.ownShips[0];
st.warehouse.stock.salt = 50; check(H.loadShip(st, own.id, 'salt', 20).ok && H.unloadShip(st, own.id, 'salt', 8).ok, 'Eigenes Schiff nicht be-/entladbar');
const receipts = st.freight.jobs.slice(), total = receipts.reduce((n, j) => n + j.qty, 0), economic = JSON.stringify({ money: st.money, warehouse: st.warehouse, cargo: own.cargo });
let maxBoat = 0, maxWorkers = 0;
for (let i = 0; i < 15000; i++) {
  S.update(.1); maxBoat = Math.max(maxBoat, S.tenders.length); maxWorkers = Math.max(maxWorkers, S.porters.length);
  const owners = S.docks().flatMap(d => [...d.pending, ...(d.load ? [d.load] : []), ...d.slots.flatMap(s => s.items)]).concat(S.porters.flatMap(w => w.items), S.tenders.map(t => t.parcel));
  check(new Set(owners.map(p => p.id)).size === owners.length, 'Paket wird gleichzeitig zweimal gezeigt');
  for (const d of S.docks()) for (const slot of d.slots) {
    check(slot.items.length <= 3 && !(slot.reserved && slot.claimedBy), 'Kran und Träger blockieren dieselbe Ware');
    check(slot.items.every(p => p.good === slot.items[0].good && p.direction === slot.items[0].direction), 'Stapel mischt Richtungen oder Waren');
  }
  for (const boat of S.tenders) check(S.isWater(boat.x, boat.y), 'Lastboot fährt über Land');
  if (receipts.every(j => j.status === 'done')) break;
}
check(maxBoat > 0 && maxBoat <= 2 && maxWorkers > 0, 'Lastboote oder Träger fehlen');
check(receipts.every(j => j.status === 'done' && j.completed === j.qty), 'Transport gerät bei gemischten Waren in eine Blockade: ' + JSON.stringify(receipts.filter(j => j.status !== 'done')));
check(receipts.reduce((n, j) => n + j.completed, 0) === total, 'Transport verändert eine Warenmenge');
check(JSON.stringify({ money: st.money, warehouse: st.warehouse, cargo: own.cargo }) === economic, 'Animation bucht Geld oder Waren ein zweites Mal');
// Queued load/unload actions must change the visible hold in physical order,
// although the economic inventory is settled immediately.
st = fresh(); H.buyShip(st, 'kogge'); const hold = st.ownShips[0]; st.warehouse.stock.salt = 50;
H.loadShip(st, hold.id, 'salt', 20); H.unloadShip(st, hold.id, 'salt', 8);
check(!H.visibleCargo(st, hold, 'own').salt, 'Noch nicht angelieferte Ware erscheint bereits im Schiff');
const loaded = st.freight.jobs[0], unloaded = st.freight.jobs[1];
for (const p of loaded.parcels) H.completeParcel(st, p);
check(H.visibleCargo(st, hold, 'own').salt === 20, 'Wartende Entladung verschwindet zu früh aus dem Schiff');
unloaded.parcels[0].state = 'tender';
check(H.visibleCargo(st, hold, 'own').salt === 12, 'Ware auf dem Lastboot steht weiter im Schiff');
H.completeParcel(st, unloaded.parcels[0]);
check(H.visibleCargo(st, hold, 'own').salt === 12, 'Abgeschlossene Entladung verdoppelt Waren im Schiff');
// Citizens and couriers yield to a cart without teleporting into blocked land.
st = fresh();
const edge = Object.entries(H.ROAD_ADJ).flatMap(([a, ns]) => ns.map(b => [a, b])).find(([a, b]) => S.edgeFree(a, b).length >= 3 && Math.hypot(H.ROAD_NODES[a][0] - H.ROAD_NODES[b][0], H.ROAD_NODES[a][1] - H.ROAD_NODES[b][1]) > 2);
const [A, B] = edge, a = H.ROAD_NODES[A], b = H.ROAD_NODES[B], off = S.edgeFree(A, B).slice().sort((a, b) => Math.abs(a) - Math.abs(b))[0];
const pedestrian = { ...S.makeWalker(false), from: A, to: B, t: .5, off, head: Math.atan2(b[1] - a[1], b[0] - a[0]), bx: undefined };
S.walkers = [pedestrian]; const foot = S.walkerWorld(pedestrian), dx = Math.cos(pedestrian.head), dy = Math.sin(pedestrian.head);
S.carts = [{ a: [foot.wx + dx * .25, foot.wy + dy * .25], b: [foot.wx + dx * .25, foot.wy + dy * .25], t: 0, head: pedestrian.head }];
S.prepareTraffic(); const advance = S.walkerWorld({ ...pedestrian, t: pedestrian.t + .01 });
check(!S.trafficClear(pedestrian, foot, advance, .05), 'Passant läuft ungehemmt durch einen Karren');
const yielded = S.walkerWorld(pedestrian);
check(Math.hypot(yielded.wx - foot.wx, yielded.wy - foot.wy) <= .05 * .35 + 1e-8 && !S.blockedAt(yielded.wx, yielded.wy), 'Ausweichschritt springt oder führt in eine Sperrfläche');
const courier = { ...pedestrian, trafficId: undefined, freightJob: {}, items: [], cart: false };
S.walkers = []; S.porters = [courier]; S.prepareTraffic();
check(!S.trafficClear(courier, S.porterPos(courier), advance, .05), 'Warenträger ignoriert Karren');
// A boom must remain visible when its mast is outside the viewport. Hanging
// cargo needs its own moving position in the depth list rather than the mast's.
st = fresh(); const crane = S.docks()[0]; const tip = H.Iso.p(crane.cx + crane.R, crane.cy, 0), view = { x0: tip[0] - 1, x1: tip[0] + 1, y0: tip[1] - 1, y1: tip[1] + 1 };
const edgeItems = S.buildItems(null, st, S.season(), 0, view), mast = edgeItems.find(it => it.r === 'crane:0');
check(mast && !S.inView(mast.box, view) && S.inView(mast.viewBox, view), 'Kran verschwindet am Bildrand trotz sichtbarem Ausleger');
const hanging = H.transport(st, st.ships[0], 'salt', 8, 'in');
for (let i = 0; i < 70; i++) S.update(.1);
const load = S.buildItems(null, st, S.season(), S.time).find(it => it.r === 'crane-load:0');
check(load && load.ap.every(Number.isFinite) && Math.abs(load.box[0] - crane.cx) > .1 && hanging.parcels[0].state !== 'done', 'Hängende Ware wird am Kranmast statt an ihrem Ort sortiert');
// Resume pending parcels, retain already completed receipts, close jobs on departure.
st = fresh(); v = st.ships[0]; const job = H.transport(st, v, 'salt', 24, 'in');
for (let i = 0; i < 120; i++) S.update(.1);
H.completeParcel(st, job.parcels[2]); st.timeOfDay = .63;
st = H.deserialize(H.serialize(st)); H.state = st; S.snapShips();
check(st.timeOfDay === .63 && st.freight.jobs[0].completed === 8 && st.freight.jobs[0].parcels[2].state === 'done', 'Laden verliert Tageszeit oder erledigte Menge');
for (let i = 0; i < 2000; i++) S.update(.1);
check(st.freight.jobs[0].completed === 24 && st.freight.jobs[0].status === 'done', 'Laden setzt den Resttransport nicht fort');
const departed = H.transport(st, st.ships[0], 'tools', 8, 'out'); st.ships = []; H.tick(st);
check(departed.status === 'done', 'Abfahrt hinterlässt offenen Transport');
// Departing a neighbour must not move an active caravan's camp or deliveries.
st = fresh(); H.dockCaravan(st, 'umland'); const staying = st.caravans[1], spot = staying.spotIndex;
const campJob = H.transport(st, staying, 'salt', 8, 'in'); st.caravans.shift(); H.dockCaravan(st, 'umland');
check(staying.spotIndex === spot && campJob.index === spot && st.caravans[1].spotIndex !== spot, 'Karawane und Transport springen nach Abfahrt des Nachbarn auf dessen Lagerplatz');
// Exactly one price sample per day, finite memory, no invented historical data.
st = fresh(); st.ships = []; st.caravans = []; st.contracts.active = [];
check(H.besterAbnehmer(st, 'salt', 'markt') === null && H.besteQuelle(st, 'salt', 'markt') === null, 'Marktvergleich empfiehlt den Markt selbst als Gegenpart');
check(H.besterAbnehmer(st, 'salt', null)?.art === 'markt' && H.besteQuelle(st, 'salt', null)?.art === 'markt', 'Besucherberatung verliert den Markt als Gegenpart');
st.caravans = [{ id: 999, sea: false, origin: 'umland', wants: { salt: { qty: 3, price: 200 } }, cargo: { salt: { qty: 4, price: 10 } } }];
check(H.besterAbnehmer(st, 'salt', 'markt')?.menge === 3 && H.besteQuelle(st, 'salt', 'markt')?.menge === 4, 'Marktvergleich verliert die begrenzte Gegenmenge');
st.caravans[0].wants.salt.qty = 0;
check(H.besterAbnehmer(st, 'salt', 'markt') === null, 'Erschöpfte Nachfrage bleibt im Marktvergleich');
st = fresh(); for (let day = 0; day < 90; day++) { st.day = day; H.recordPrices(st); H.recordPrices(st); }
check(st.priceHistory.length === 60 && st.priceHistory[0].day === 30 && st.priceHistory.at(-1).day === 89, 'Preisgedächtnis wächst unbegrenzt oder verdoppelt Tage');
check(st.priceHistory.at(-1).goods.salt.buy === H.marketBuyPrice(st, 'salt', 1), 'Preisverlauf zeigt falschen Einkaufspreis');
// All simultaneous ships have different captains. A returning captain remembers
// fair trade once per visit; splitting a transaction cannot farm trust.
st = fresh(); st.ships = []; const oldPick = H.pick; let firstId; H.pick = arr => typeof arr[0] === 'string' && arr[0].startsWith('luebeck:') ? (arr.includes(firstId) ? firstId : arr[0]) : oldPick(arr);
for (let visit = 0; visit < 3; visit++) {
  st.ships = []; v = H.makeVisitor(st, 'luebeck'); firstId ||= v.captainId; check(v.captainId === firstId, 'Stammkapitän wechselt Identität');
  st.ships.push(v); v.cargo.salt = { qty: 10, price: 40 }; H.buyFromVisitor(st, v, 'salt', 1, false); H.buyFromVisitor(st, v, 'salt', 1, false);
  check(H.captainRecord(st, v).trust === visit + 1, 'Kleine Teilkäufe erzeugen mehrfach Vertrauen');
  check(v.captainDiscount === visit * .005, 'Preisvorteil wird nicht bei der nächsten Ankunft angewendet');
}
H.pick = oldPick; st.ships = [];
for (let i = 0; i < 5; i++) st.ships.push(H.makeVisitor(st, 'luebeck'));
check(new Set(st.ships.map(v => v.captainId)).size === 5, 'Ein Kapitän führt gleichzeitig zwei Schiffe');
// Three chapters, real goods consumed, choice affects reward, no repeated payout.
for (const choice of ['aid', 'contract']) {
  st = fresh(); st.chapters.bought = 10; money = st.money;
  check(H.finishChapter(st).ok && st.chapters.step === 1 && st.money === money + 250, 'Erster Handelsbrief hat falschen Lohn');
  check(!H.finishChapter(st, choice).ok, 'Lieferkapitel ohne Getreide abschließbar');
  st.warehouse.stock.grain = 20; money = st.money; const rep = st.rep;
  check(H.finishChapter(st, choice).ok && st.warehouse.stock.grain === 8 && st.chapters.step === 2, 'Lieferkapitel verbraucht falsche Ware');
  check(choice === 'aid' ? st.rep === rep + 5 && st.money === money : st.money === money + Math.round(12 * H.GOOD.grain.base * 1.2), 'Kapitelentscheidung hat falsche Folge');
  st.chapters.sold = { luebeck: 10, riga: 10 }; check(H.finishChapter(st).ok && st.chapters.step === 3, 'Drittes Kapitel nicht abschließbar');
  money = st.money; check(!H.finishChapter(st).ok && money === st.money, 'Handelsbrief zahlt mehrfach aus');
}
// Save failure must not report success, and the retry is not per frame.
const storage = new Map(), messages = []; ctx.localStorage = { setItem: (k, v) => storage.set(k, v), getItem: k => storage.get(k) }; ctx.document = { addEventListener() {} }; ctx.requestAnimationFrame = () => {};
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js/main.js'), 'utf8'), ctx);
st = fresh(); H.UI.toast = (...args) => messages.push(args); H.preview = false; S.clock = .57;
check(H.autosave() && JSON.parse(storage.get(H.SAVE_KEY)).timeOfDay === .57, 'Autosave speichert Tageszeit nicht');
H.scheduleSave(); const due = H.saveDue; H.scheduleSave(); check(H.saveDue === due && due > Date.now(), 'Autosave wird bei jeder Aktion nach hinten geschoben');
ctx.localStorage.setItem = () => { throw new Error('quota'); }; H.saveGame();
check(H.saveFailed && !messages.some(m => m[0] === H.t('saved')) && messages.some(m => m[0] === H.t('saveFailed')), 'Speicherfehler wird als Erfolg gemeldet');
check(H.saveDue === 0 && H.lastSaveAt > 0 && H.SPEEDS[1] === 1200000 && H.SPEEDS[2] === 120000 && H.SPEEDS[3] === 6000, 'Speicherfehler oder Zeitstufen falsch behandelt');
console.log(`Weiterentwicklung bestanden: ${checks} Prüfungen, ${total} Last in beiden Richtungen, Lastboote, Migration, Preise, Kapitäne, Kapitel und Speichern.`);
