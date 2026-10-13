/* node tools/muehle-test.js — Bannmühle, Mahlgeld, Mühlenpacht, Müller und Erntevorkauf */
'use strict';
const assert = require('node:assert/strict');
let seed = 811, forced = null, checks = 0;
const random = () => forced !== null ? forced : ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const H = require('./domain-loader.cjs')(seed, { random });
const check = (v, m) => { checks++; assert(v, m); };
const fresh = () => { H.state = H.newGame({ name: 'Mühlenprüfung', difficulty: 'normal', years: 20 }); H.state.money = 1000000; return H.state; };
const firstDay = (st, month, from = st.day) => { let d = from; while (H.monthOf(d) !== month || H.monthOf(d - 1) === month) d++; return d; };

/* ---------- Mahlgeld ---------- */
let st = fresh();
check(st.muehle && !st.muehle.pacht && !st.muehle.strecken && st.vorkauf && typeof st.vorkauf === 'object', 'Neues Spiel hat Mühlen- und Vorkaufszustand');
const basis = H.mahlgeldBasis(st);
check(basis >= 8 && basis <= 14, 'Grundwert des Mahlgelds liegt bei 8–14 Mark: ' + basis.toFixed(2));
check(H.muehleEmpfaenger(st) === 'town', 'Ohne Pacht nimmt die Stadt das Mahlgeld ein');
let cash = st.money; st.day = 1; H.muehleTag(st);
check(st.money === cash && !st.ledger.at(-1).millage, 'Kein Mahlgeld ohne Pacht oder Besitz');
st.town.pop = 9000; check(H.mahlgeldBasis(st) > basis, 'Mehr Einwohner, mehr Mahlgeld'); st.town.pop = 6000;
st.town.events.push({ type: 'famine', daysLeft: 5 }); check(H.mahlgeldBasis(st) > basis, 'Hungersnot treibt den Kornverbrauch und das Mahlgeld'); st.town.events = [];

/* ---------- Pacht ---------- */
const preis = H.muehlePachtPreis(st);
check(Math.abs(preis - 300 * basis * (0.8 + st.town.prosperity / 200)) <= 1, 'Pachtpreis nach Formel');
check(preis > H.mahlgeld(st) * 200 && preis < H.mahlgeld(st) * 365, 'Pacht ist günstiger als ein Jahr Mahlgeld, aber nicht geschenkt: ' + preis);
st.money = preis - 1; let before = H.serialize(st);
check(!H.muehlePachten(st).ok && H.serialize(st) === before, 'Pacht ohne Geld ist rein');
st.money = 1000000; cash = st.money;
check(H.muehlePachten(st).ok && st.money === cash - preis && st.muehle.pacht.until === st.day + 365, 'Pacht für ein Jahr erworben');
check(!H.muehlePachten(st).ok && st.money === cash - preis, 'Keine zweite Pacht');
st.ledger.push({}); cash = st.money; st.day++; H.muehleTag(st);
const geld = H.mahlgeld(st);
check(st.money === cash + geld && st.ledger.at(-1).millage === geld && geld > 0, 'Mahlgeld fließt an den Pächter und steht im Kassenbuch');
check(H.t('src_millage') === 'Mahlgeld', 'Kassenbuchquelle hat einen deutschen Text');
check(st.post.messages.some(m => m.type === 'millerOffer'), 'Am ersten Pachttag schreibt der Müller');
st.day = st.muehle.pacht.until; cash = st.money; H.muehleTag(st);
check(!st.muehle.pacht && st.money === cash && H.muehleEmpfaenger(st) === 'town', 'Pacht läuft nach einem Jahr ab');
check(st.log.some(e => e.key === 'muehlePachtEnde'), 'Ablauf steht in der Chronik');
// Über den echten Tagestick: Pacht bucht täglich Mahlgeld
st = fresh(); H.muehlePachten(st); H.tick(st); check(st.ledger.at(-1).millage > 0, 'Tagestick bucht Mahlgeld');

/* ---------- Besitz ---------- */
st = fresh(); H.buyRural(st, 'windmill'); check(H.muehleEmpfaenger(st) === 'owner', 'Besitzer bekommt das Mahlgeld');
check(!H.muehlePachten(st).ok, 'Besitzer braucht keine Pacht');
cash = st.money; st.day++; H.muehleTag(st); check(st.money === cash + H.mahlgeld(st), 'Besitzer bekommt das Mahlgeld ohne Pacht');

// Kauft der Pächter die Mühle, wird die Restpacht anteilig erstattet
st = fresh(); check(H.RURAL_SITES.windmill.cost === 9800, 'Windmühle kostet 9 800 Mark');
H.muehlePachten(st); const gezahlt = st.muehle.pacht.price; st.day += 100; cash = st.money;
check(H.buyRural(st, 'windmill').ok && !st.muehle.pacht, 'Kauf beendet die Pacht');
const erstattet = Math.round(gezahlt * 265 / 365);
check(st.money === cash - 9800 + erstattet && st.log.some(e => e.key === 'muehlePachtErstattet'), 'Restpacht wird anteilig erstattet: ' + erstattet);
check(H.muehleEmpfaenger(st) === 'owner', 'Danach Mahlgeld als Besitzer');

/* ---------- Müller und Strecken ---------- */
st = fresh();
check(!H.muehleStrecken(st, true).ok && !st.muehle.strecken, 'Ohne Pacht hat der Müller nichts anzubieten');
H.muehlePachten(st); st.day++; forced = 0.99; H.muehleTag(st); forced = null;
const brief = st.post.messages.find(m => m.type === 'millerOffer');
check(brief && H.postActions(st, brief).map(a => a.id).join() === 'millStretch,millHonest', 'Brief des Müllers bietet Strecken oder Ehrlichkeit an');
const ehrlich = H.mahlgeld(st);
check(H.postReply(st, brief.id, 'millStretch').ok && st.muehle.strecken, 'Antwort im Brief schaltet das Strecken ein');
check(!H.postActions(st, brief).length, 'Der Brief ist beantwortet');
check(H.mahlgeld(st) === Math.round(H.mahlgeldBasis(st) * 1.4) && H.mahlgeld(st) > ehrlich, 'Strecken bringt 40 % mehr Mahlgeld');
st.town.quality.flour = 100; const moods = Object.values(st.burghers).map(h => h.mood);
for (let i = 0; i < 3; i++) { st.day++; forced = 0.5; H.muehleTag(st); }
forced = null;
check(st.muehle.strecken && st.town.quality.flour === 85, 'Mehlgüte sinkt täglich um 5');
for (let i = 0; i < 5; i++) { st.day++; forced = 0.5; H.muehleTag(st); }
forced = null; check(st.town.quality.flour === 70, 'Mehlgüte fällt nicht unter 70');
check(Object.values(st.burghers).every((h, i) => Math.abs(h.mood - moods[i]) < 20), 'Ohne Auffliegen keine Strafen der Stimmung');
const vorher = { suspicion: st.suspicion, rep: st.rep, zuenfte: st.factions.zuenfte, moods: Object.values(st.burghers).map(h => h.mood) };
st.day++; forced = 0.01; H.muehleTag(st); forced = null;
check(!st.muehle.strecken && st.muehle.gesperrtBis === st.day + 60, 'Auffliegen beendet das Strecken für 60 Tage');
check(st.suspicion === Math.min(100, vorher.suspicion + 8) && st.rep === Math.max(0, vorher.rep - 3) && st.factions.zuenfte === Math.max(0, vorher.zuenfte - 6), 'Verdacht, Ruf und Zünfte reagieren');
check(Object.values(st.burghers).every((h, i) => h.mood === Math.max(0, vorher.moods[i] - 10)), 'Alle Haushalte sind verärgert');
check(st.log.some(e => e.key === 'muehleAufgeflogen' && e.kind === 'bad'), 'Skandal steht in der Chronik');
check(!H.muehleStrecken(st, true).ok, 'Während der Sperre kein neues Strecken');
const q0 = st.town.quality.flour; st.day++; H.muehleTag(st); check(st.town.quality.flour === q0 + 2, 'Mehlgüte erholt sich nach dem Abschalten');
st.day = st.muehle.gesperrtBis; check(H.muehleStrecken(st, true).ok && H.muehleStrecken(st, false).ok && !st.muehle.strecken, 'Nach der Sperre wieder schaltbar');
// Zufall über viele Tage: etwa 2 % je Tag
let auf = 0; for (let n = 0; n < 400; n++) { st = fresh(); H.muehlePachten(st); H.muehleStrecken(st, true); st.day++; H.muehleTag(st); if (st.muehle.aufgeflogen) auf++; }
check(auf >= 2 && auf <= 20, 'Auffliegen ist selten, aber möglich: ' + auf + '/400');
// Pacht endet: Strecken endet mit
st = fresh(); H.muehlePachten(st); H.muehleStrecken(st, true); st.day = st.muehle.pacht.until; forced = 0.5; H.muehleTag(st); forced = null;
check(!st.muehle.strecken, 'Ohne Pacht kein Strecken');

/* ---------- Vorkauf ---------- */
st = fresh(); check(H.monthOf(0) === 2 && H.vorkaufFruehjahr(st), 'Spielbeginn im März ist Frühjahr');
let a = H.vorkaufAngebot(st, 'grainfarm');
check(a.ok && a.good === 'grain' && a.qty === 72 && a.price === Math.round(72 * 30 * 0.65), 'Angebot: 72 Last Getreide zu 65 % des Grundpreises');
check(H.vorkaufAngebot(st, 'fiberfarm').qty === 60 && !H.vorkaufAngebot(st, 'windmill'), 'Flachs ergibt 60 Last; Mühle hat keinen Vorkauf');
cash = st.money; check(H.vorkaufen(st, 'grainfarm').ok && st.money === cash - a.price, 'Vorkauf sofort bezahlt');
const jahr = H.yearOf(st.day);
check(H.netWorth(st) === Math.round(H.netWorth({ ...st, vorkauf: {} }) + a.price), 'Vorkauf zählt bis zur Ernte als Forderung zum Kaufpreis');

check(st.vorkauf[jahr].grainfarm.qty === 72, 'Vorkauf im Spielstand');
before = H.serialize(st); check(!H.vorkaufen(st, 'grainfarm').ok && H.serialize(st) === before, 'Nur ein Vorkauf je Hof und Jahr');
st = fresh(); H.buyRural(st, 'grainfarm'); check(!H.vorkaufen(st, 'grainfarm').ok, 'Eigener Hof kann nicht vorgekauft werden');
st = fresh(); st.town.events.push({ type: 'famine', daysLeft: 10 }); before = H.serialize(st);
a = H.vorkaufAngebot(st, 'grainfarm'); check(!a.ok && a.msg === 'vorkaufHungersnot' && !H.vorkaufen(st, 'grainfarm').ok && H.serialize(st) === before, 'In der Hungersnot kein Vorkauf');
st = fresh(); st.day = firstDay(st, 5); before = H.serialize(st); check(!H.vorkaufen(st, 'grainfarm').ok && H.serialize(st) === before, 'Im Juni kein Vorkauf');
st.day = firstDay(st, 2, st.day); check(H.vorkaufen(st, 'grainfarm').ok && H.yearOf(st.day) === H.CONST.START_YEAR + 1, 'Im nächsten Frühjahr wieder möglich');

/* ---------- Ernte in allen Ausgängen ---------- */
const ernte = (wurf, famine = false, frei = null) => {
  const st = fresh(); H.vorkaufen(st, 'grainfarm'); const day = firstDay(st, 7);
  st.day = day - 1; if (famine) st.town.events.push({ type: 'famine', daysLeft: 3 }); H.vorkaufTag(st); st.town.events = [];
  if (frei !== null) { st.warehouse.stock.tools = Math.floor(H.whFree(st)) - frei; }
  const korn = st.warehouse.stock.grain || 0; st.day = day; forced = wurf; H.vorkaufTag(st); forced = null;
  const d = st.rural.deliveries.find(x => x.vorkauf); st.rural.day = st.day; st.day++; H.ruralDay(st);
  return { st, d, got: (st.warehouse.stock.grain || 0) - korn, v: st.vorkauf[H.yearOf(day)].grainfarm };
};
let r = ernte(0.5); check(r.got === 72 && r.v.outcome === 'normal' && r.d.status === 'delivered', 'Normale Ernte: volle 72 Last über den Lieferweg');
check(r.st.freight.jobs.some(j => j.kind === 'rural' && j.ruralSite === 'grainfarm' && j.qty === 72), 'Lieferung fährt wie andere Umlandlieferungen');
check(r.d.jahr === H.yearOf(r.st.day) && H.vorkaufOffen(r.st) === 0, 'Nach der Ernte keine Forderung mehr');
r = ernte(0.05); check(r.got === 36 && r.v.outcome === 'bad' && r.st.log.some(e => e.key === 'vorkaufErnte_bad'), 'Missernte: halbe Menge mit Chronikeintrag');
r = ernte(0.2); check(r.got === 86 && r.v.outcome === 'good' && r.st.log.some(e => e.key === 'vorkaufErnte_good'), 'Gute Ernte: 120 %');
r = ernte(0.9, true); check(r.got === 36 && r.v.outcome === 'famine', 'Hungersnot seit dem Vorkauf halbiert die Ernte');
r = ernte(0.5, false, 30); check(r.got === 30 && r.v.lost === 42 && r.st.log.some(e => e.key === 'vorkaufVerfallen'), 'Was nicht ins Lager passt, verfällt');
st = r.st; const n = st.rural.deliveries.length; st.day = firstDay(st, 7, st.day + 30) ; H.vorkaufTag(st);
check(st.rural.deliveries.length === n, 'Keine zweite Lieferung');

/* ---------- Spielstand und Migration ---------- */
st = fresh(); H.muehlePachten(st); H.muehleStrecken(st, true); H.vorkaufen(st, 'fiberfarm');
const saved = H.deserialize(H.serialize(st));
check(saved.muehle.strecken && saved.muehle.pacht.until === st.muehle.pacht.until && saved.vorkauf[H.yearOf(0)].fiberfarm.good === 'flax', 'Pacht, Schalter und Vorkauf überstehen das Speichern');
st = fresh(); delete st.muehle; delete st.vorkauf; const alt = H.serialize(st), rnd = seed;
st = H.deserialize(alt);
check(seed === rnd && st.muehle && !st.muehle.pacht && !st.muehle.strecken && st.muehle.gesperrtBis === 0 && JSON.stringify(st.vorkauf) === '{}', 'Alter Spielstand bekommt leere Mühle und keinen Vorkauf');
const m1 = H.serialize(st); H.migrate(st); check(H.serialize(st) === m1, 'Migration ist idempotent');
st = fresh(); st.muehle = { pacht: { until: 50 } }; H.migrate(st); check(st.muehle.strecken === false && st.muehle.pacht.until === 50 && st.muehle.einnahmen === 0, 'Teilweiser Mühlenzustand wird ergänzt');
for (const lang of ['de', 'en']) for (const k of ['src_millage', 'muehleHelp', 'vorkaufHelp', 'postBody_millerOffer', 'muehleAufgeflogen', 'vorkaufErnte_famine', 'vorkaufVerfallen', 'vorkaufHungersnot', 'muehlePachtErstattet', 'muehleStreckenVergleich', 'muehlePachtJahr', 'muehleKaufHinweis', 'vorkaufUnterwegs']) check(typeof H.I18N[lang][k] === 'string' && H.I18N[lang][k].length > 5, 'Text ' + lang + '/' + k);
console.log(JSON.stringify({ result: 'PASS', checks, mahlgeld: +basis.toFixed(2), pachtpreis: preis, aufgeflogen: auf + '/400' }));
