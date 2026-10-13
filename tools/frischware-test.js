/* node tools/frischware-test.js — Frischware: Jahreslauf, Betriebe, Marktstand, Reste, Naturalien und Korbgeschenke */
'use strict';
const assert = require('node:assert/strict');
let seed = 810, forced = null, checks = 0;
const random = () => forced !== null ? forced : ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const H = require('./domain-loader.cjs')(seed, { random });
const check = (v, m) => { checks++; assert(v, m); };
const fresh = () => { H.state = H.newGame({ name: 'Frischprüfung', difficulty: 'normal', years: 20 }); H.state.money = 1000000; H.state.town.events = []; return H.state; };
const dayOfYear = d => (d + 60) % 365;                     // Spieltag zu Tag des Jahres (wie HK.dayOfYear)
const setWeather = (st, type) => { st.weather.current = { ...st.weather.current, type, start: st.day, end: st.day + 3 }; st.cityLife && (st.cityLife.stories = []); };
const SORTEN = Object.keys(H.FRISCH);

/* ---------- Jahreslauf ---------- */
const same = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
check(same(H.frischSorten(3), ['eggs', 'herbs', 'leek']), 'April: Eier, Kräuter, Lauch');
check(same(H.frischSorten(6), ['eggs', 'cherries', 'peas', 'beans']), 'Juli: Eier, Kirschen, Erbsen, Bohnen');
check(same(H.frischSorten(9), ['eggs', 'apples', 'pears', 'plums', 'cabbage', 'turnips']), 'Oktober: Eier, Äpfel, Birnen, Pflaumen, Kohl, Rüben');
for (const m of [11, 0, 1]) check(same(H.frischSorten(m), ['cabbage', 'turnips', 'driedfruit']), 'Winter nur Lagerkohl, Rüben, Dörrobst: Monat ' + m);
check(same(H.frischSorten(3, 'orchard'), []) && same(H.frischSorten(6, 'orchard'), ['cherries']) && same(H.frischSorten(0, 'poultry'), []), 'Obstgarten blüht im Frühjahr; Hühner ruhen im Winter');
const preise = { eggs: 4, herbs: 3, leek: 3, cherries: 6, peas: 4, beans: 4, apples: 4, pears: 5, plums: 5, cabbage: 3, turnips: 2, driedfruit: 7 };
check(same(SORTEN, Object.keys(preise)) && SORTEN.every(s => H.FRISCH[s].base === preise[s]), 'Grundpreise je Korb');
const herkunft = { poultry: ['eggs'], gardenfarm: ['herbs', 'leek', 'peas', 'beans', 'cabbage', 'turnips'], orchard: ['cherries', 'apples', 'pears', 'plums', 'driedfruit'] };
for (const [site, list] of Object.entries(herkunft)) check(same(SORTEN.filter(s => H.FRISCH[s].site === site), list), 'Herkunft ' + site);
for (let m = 0; m < 12; m++) check(H.frischSorten(m).every(s => H.FRISCH[s].months.includes(m)), 'Monatsliste stimmt: ' + m);

/* ---------- Betriebe ---------- */
let st = fresh();
const sites = { poultry: [2400, 4], gardenfarm: [2800, 5], orchard: [3200, 5] };
for (const [id, [cost, wage]] of Object.entries(sites)) check(H.RURAL_SITES[id].cost === cost && H.RURAL_SITES[id].wage === wage && H.RURAL_BUILDINGS[id] && st.rural.sites[id] && !st.rural.sites[id].owner, 'Betrieb ' + id + ' mit Preis und Lohn');
check(H.RURAL_WORKERS.filter(w => herkunft[w.site]).length === 3, 'Jeder Frischbetrieb hat einen Arbeiter');
check(H.monthOf(st.day) === 2 && JSON.stringify(st.frisch.hof) === JSON.stringify({ poultry: { eggs: 6 }, gardenfarm: { herbs: 4, leek: 4 }, orchard: {} }), 'Im März: 6 Eier, 4 Kräuter, 4 Lauch, Obstgarten blüht');
check(st.rural.sites.orchard.reason === 'frischBluete' && !st.rural.sites.poultry.reason, 'Blüte als Grund im Obstgarten');
const lager = H.serialize(st.warehouse), markt = H.serialize(st.town.stock);
st.frisch.hof.poultry.eggs = 2; H.tick(st);
check(st.frisch.hof.poultry.eggs === 6 && st.frisch.hof.gardenfarm.herbs === 4, 'Körbe von gestern verfallen, neue liegen bereit (kein Aufsummieren)');
check(!SORTEN.some(s => s in st.warehouse.stock || s in st.town.stock), 'Frischware landet nicht in Lager oder Markt');
const ernte = (day) => { const s = fresh(); s.day = day; H.frischErnten(s, false); return s.frisch.hof; };
let hof = ernte(130); // Juli
check(JSON.stringify(hof.orchard) === '{"cherries":8}' && hof.gardenfarm.peas === 4 && hof.gardenfarm.beans === 4 && hof.poultry.eggs === 6, 'Sommer: 8 Kirschen, 4 Erbsen, 4 Bohnen, 6 Eier');
hof = ernte(200); // Oktober
check(H.frischAnzahl(hof.orchard) === 8 && H.frischAnzahl(hof.gardenfarm) === 8 && hof.orchard.apples === 3 && hof.gardenfarm.cabbage === 4, 'Herbst: acht Körbe je Garten, gleichmäßig verteilt');
hof = ernte(300); // Dezember
check(JSON.stringify(hof.poultry) === '{}' && JSON.stringify(hof.orchard) === '{"driedfruit":4}' && hof.gardenfarm.cabbage === 2 && hof.gardenfarm.turnips === 2, 'Winter: halbe Körbe aus dem Vorrat, Hühner ruhen');
// Eigener Betrieb zahlt Lohn je Tag mit Ertrag, pausiert nichts
st = fresh(); check(H.buyRural(st, 'poultry').ok && st.rural.sites.poultry.owner, 'Hühnerhof kaufen');
let cash = st.money; H.tick(st);
check(st.ledger.at(-1).wages === -4 && st.frisch.hof.poultry.eggs === 6, 'Eigener Hühnerhof zahlt 4 Mark Lohn');
check(H.toggleRural(st, 'poultry').ok, 'Pausieren'); H.tick(st);
check(!st.ledger.at(-1).wages && JSON.stringify(st.frisch.hof.poultry) === '{}', 'Pausiert: keine Eier, kein Lohn');
st = fresh(); st.day = 299; H.frischErnten(st, false); H.buyRural(st, 'poultry'); H.tick(st);
check(!st.ledger.at(-1).wages && st.rural.sites.poultry.reason === 'frischRuht', 'Im Winter ruht der Hühnerhof ohne Lohn');

// Leerer Hof: vergriffen oder kein Ertrag
st = fresh(); st.stalls = 1; H.buyRural(st, 'gardenfarm'); check(H.frischLeerGrund(st, 'poultry') === null && H.frischLeerGrund(st, 'orchard') === 'frischBluete', 'Blüte: kein Ertrag; Eier liegen bereit');
H.frischKaufen(st, 'poultry', 'eggs', 6); check(H.frischLeerGrund(st, 'poultry') === 'frischVergriffen', 'Alle Eier gekauft: vergriffen, nicht ohne Ertrag');
st.day = 299; H.frischErnten(st, false); check(H.frischLeerGrund(st, 'poultry') === 'frischRuht', 'Winter: Hühnerhof ruht');
H.toggleRural(st, 'gardenfarm'); H.frischErnten(st, false); check(H.frischLeerGrund(st, 'gardenfarm') === 'ruralPaused', 'Pausiert hat Vorrang');
check(H.frischKoerbeText(1) === '1 Korb' && H.frischKoerbeText(3) === '3 Körbe', 'Einzahl und Mehrzahl');
/* ---------- Kauf nur mit Marktstand ---------- */
st = fresh(); let before = H.serialize(st);
let r = H.frischKaufen(st, 'poultry', 'eggs', 3);
check(!r.ok && r.msg === 'frischKeinStand' && H.serialize(st) === before, 'Ohne Marktstand kein Kauf, Zustand unverändert');
st.stalls = 1; cash = st.money;
r = H.frischKaufen(st, 'poultry', 'eggs', 3);
check(r.ok && st.money === cash - 12 && st.ledger.at(-1).freshmarket === -12 && st.frisch.stand.eggs === 3 && st.frisch.hof.poultry.eggs === 3, 'Drei Körbe Eier für 12 Mark auf dem Stand, gebucht als Frischware');
before = H.serialize(st);
check(!H.frischKaufen(st, 'poultry', 'eggs', 4).ok && !H.frischKaufen(st, 'orchard', 'eggs', 1).ok && !H.frischKaufen(st, 'poultry', 'eggs', 0).ok && H.serialize(st) === before, 'Mehr als vorhanden, falscher Hof oder null Körbe: rein');
st.money = 3; r = H.frischKaufen(st, 'gardenfarm', 'herbs', 2); check(!r.ok && r.msg === 'notEnoughMoney', 'Ohne Geld kein Kauf'); st.money = 1000000;
st.frisch.stand = { cabbage: 19 }; r = H.frischKaufen(st, 'gardenfarm', 'herbs', 2);
check(!r.ok && r.msg === 'frischStandVoll' && H.frischKaufen(st, 'gardenfarm', 'herbs', 1).ok, 'Ein Stand fasst 20 Körbe');
st = fresh(); st.stalls = 1; H.buyRural(st, 'gardenfarm'); H.frischErnten(st, false); cash = st.money;
check(H.frischKaufen(st, 'gardenfarm', 'leek', 4).ok && st.money === cash, 'Aus dem eigenen Garten ohne Einkaufspreis');
check(H.netWorth(st) === H.netWorth({ ...st, frisch: { ...st.frisch, stand: {}, koerbe: {} } }), 'Körbe zählen nicht zum Vermögen');

/* ---------- Tagesverkauf ---------- */
const verkauf = (day, weather, stalls, sorte, qty, setup) => {
  const s = fresh(); s.day = day; s.stalls = stalls; setWeather(s, weather); s.frisch.stand = { [sorte]: qty }; s.piety = 10; setup?.(s);
  const demand = H.frischNachfrage(s, sorte), price = H.frischVerkaufspreis(s, sorte), cash = s.money, tag = H.frischAbend(s);
  return { s, demand, price, tag, earned: s.money - cash };
};
const sommer = 140; // 19. Juli, kein Fest
check(!H.seasonEvent({ day: sommer }), 'Testtag ohne Fest');
let v = verkauf(sommer, 'cloudy', 1, 'cherries', 30);
const pm = H.prosperityMod(v.s);
check(v.demand === Math.round(5 * pm), 'Grundnachfrage fünf Körbe je Stand × Wohlstand: ' + v.demand);
check(v.price === Math.round(6 * 1.8 * pm * 10) / 10, 'Preis = Grundpreis × 1,8 × Wohlstand');
check(v.tag.verkauft === v.demand && v.earned === Math.round(v.demand * v.price) && v.tag.erloes === v.earned, 'Erlös gebucht');
check(v.s.ledger.at(-1).freshmarket === v.earned && JSON.stringify(v.s.frisch.stand) === '{}', 'Kassenbuch und leerer Stand am Abend');
const klar = verkauf(sommer, 'clear', 1, 'cherries', 30), regen = verkauf(sommer, 'rain', 1, 'cherries', 30), schnee = verkauf(sommer, 'snow', 1, 'cherries', 30);
check(klar.demand === Math.round(5 * 1.1 * pm) && regen.demand === Math.round(5 * .6 * pm) && schnee.demand === Math.round(5 * .4 * pm), 'Wetter: klar 1,1, Regen 0,6, Schnee 0,4');
check(klar.tag.verkauft > regen.tag.verkauft && regen.tag.verkauft > schnee.tag.verkauft, 'Regen und Schnee verkaufen weniger');
const drei = verkauf(sommer, 'cloudy', 3, 'cherries', 30);
check(drei.demand === Math.round(15 * pm) && drei.tag.verkauft > v.tag.verkauft, 'Mehr Stände nehmen mehr ab');
const johannis = verkauf(172 - 60, 'cloudy', 1, 'cherries', 30);
check(H.seasonEvent(johannis.s).id === 'midsummer' && johannis.demand === Math.round(10 * pm), 'Johannis verdoppelt die Kirschen');
const ostern = verkauf(92 - 60, 'cloudy', 1, 'eggs', 30), fasten = verkauf(70 - 60, 'cloudy', 1, 'eggs', 30), fastenKohl = verkauf(70 - 60, 'cloudy', 1, 'cabbage', 30);
check(ostern.demand === Math.round(12.5 * pm) && fasten.demand === Math.round(2.5 * pm) && fastenKohl.demand === Math.round(7 * pm), 'Ostern hebt Eier, Fastenzeit senkt Eier und hebt Gemüse');
const michaelis = verkauf(273 - 60, 'cloudy', 1, 'apples', 30);
check(michaelis.demand === Math.round(9 * pm), 'Michaelis hebt Äpfel');
const reich = verkauf(sommer, 'cloudy', 1, 'cherries', 30, s => { s.town.prosperity = 100; });
check(reich.demand > v.demand && reich.price > v.price, 'Wohlstand hebt Nachfrage und Preis');
// Über den echten Tagestick: verkauft wird am Abend des Tages, an dem der Stand bestückt wurde
st = fresh(); st.stalls = 1; st.piety = 10; setWeather(st, 'clear'); H.frischKaufen(st, 'gardenfarm', 'herbs', 4);
const erwartet = Math.min(4, H.frischNachfrage(st, 'herbs')); cash = st.money; const tagVorher = st.day; H.tick(st);
check(st.frisch.tag.day === tagVorher && st.frisch.tag.verkauft === erwartet && st.money - cash >= st.frisch.tag.erloes - 10, 'Tagestick verkauft den Stand');
check(st.log.some(e => e.key.startsWith('frischTag')), 'Tagesabschluss in der Chronik');
before = H.serialize(st); check(H.frischAbend(st) === null && H.serialize(st) === before, 'Leerer Stand ändert nichts');
st.frisch.stand = { eggs: 1 }; st.frisch.abend = st.day; before = H.serialize(st); check(H.frischAbend(st) === null && H.serialize(st) === before, 'Kein zweiter Verkauf am selben Tag');

/* ---------- Reste ---------- */
v = verkauf(sommer, 'rain', 1, 'cherries', 12);
const rest = 12 - v.tag.verkauft;
check(v.s.log[0].vars.rest === H.frischKoerbeText(rest) && !/^1 Körbe/.test(v.s.log[0].vars.rest), 'Chronik mit Einzahl/Mehrzahl');
check(rest > 0 && v.tag.verdorben === rest && v.tag.spital === 0 && v.s.log[0].key === 'frischTagVerdorben' && v.s.log[0].kind === 'bad', 'Ohne Spital verderben die Reste');
check(v.s.piety === 10, 'Verderben bringt keine Frömmigkeit');
v = verkauf(sommer, 'rain', 1, 'cherries', 12, s => { s.piety = 45; });
check(v.tag.spital === rest && v.tag.verdorben === 0 && Math.abs(v.s.piety - 45.3) < 1e-9, 'Frömmigkeit ab 40: Reste ans Spital, +0,3');
check(v.s.log.some(e => e.key === 'frischSpitalWoche') && v.s.log[0].key === 'frischTagSpital', 'Chronik: Spital und Tagesabschluss');
v = verkauf(sommer, 'rain', 1, 'cherries', 12, s => { s.hospitalEndowed = true; });
check(v.tag.spital === rest, 'Gestiftetes Spital nimmt die Reste auch ohne Frömmigkeit');
st = v.s; let wochen = 0;
for (let i = 1; i <= 14; i++) { st.day++; st.frisch.stand = { cherries: 20 }; H.frischAbend(st); }
wochen = st.log.filter(e => e.key === 'frischSpitalWoche').length;
check(wochen === 3, 'Spital-Chronik einmal je Woche: ' + wochen);
v = verkauf(sommer, 'clear', 3, 'cherries', 2);
check(v.tag.verkauft === 2 && v.s.log[0].key === 'frischTag', 'Ohne Reste schlichter Tagesabschluss');

/* ---------- Naturalien ---------- */
st = fresh(); for (let i = 0; i < 21; i++) H.tick(st);
check(H.frischAnzahl(st.frisch.koerbe) === 0, 'Ohne eigenen Betrieb keine Naturalien');
st = fresh(); H.buyRural(st, 'gardenfarm');
const wochen0 = [];
for (let i = 0; i < 70; i++) { H.tick(st); wochen0.push(H.frischAnzahl(st.frisch.koerbe)); }
check(wochen0[5] <= 1 && wochen0.at(-1) === 6 && wochen0.every((n, i) => !i || n - wochen0[i - 1] <= 1), 'Jede Woche ein Korb bis sechs: ' + wochen0.filter((n, i) => !i || n !== wochen0[i - 1]).join(','));
check(Object.keys(st.frisch.koerbe).every(s => H.FRISCH[s].site === 'gardenfarm'), 'Naturalien der Saison aus dem eigenen Garten');
{ const p = fresh(); H.buyRural(p, 'gardenfarm'); H.toggleRural(p, 'gardenfarm'); for (let i = 0; i < 21; i++) H.tick(p); check(H.frischAnzahl(p.frisch.koerbe) === 0, 'Pausierter Betrieb liefert keine Naturalien'); }
const k0 = JSON.stringify(st.frisch.koerbe); st.day += 30; H.frischAbend(st); check(JSON.stringify(st.frisch.koerbe) === k0, 'Naturalien verderben nicht');
check(H.netWorth(st) === H.netWorth({ ...st, frisch: { ...st.frisch, koerbe: {} } }), 'Naturalien zählen nicht zum Vermögen');
// Auf den Stand legen
const sorte = Object.keys(st.frisch.koerbe)[0];
before = H.serialize(st); r = H.korbAufStand(st, sorte); check(!r.ok && r.msg === 'frischKeinStand' && H.serialize(st) === before, 'Naturalie nur mit Stand auf den Stand');
st.stalls = 1; const n0 = st.frisch.koerbe[sorte];
check(H.korbAufStand(st, sorte).ok && (st.frisch.koerbe[sorte] || 0) === n0 - 1 && st.frisch.stand[sorte] === 1, 'Korb wandert auf den Stand');

/* ---------- Korbgeschenk ---------- */
st = fresh(); st.day = sommer; st.frisch.koerbe = { apples: 2 }; st.persons.priest.loyalty = 30; const piety = st.piety, kirche = st.factions.kirche;
forced = 0; r = H.korbSchenken(st, 'priest', 'apples'); forced = null;
check(r.ok && r.gain === 4 && st.persons.priest.loyalty === 34 && st.frisch.koerbe.apples === 1, 'Korb hebt die Loyalität um 4 bis 8 und wird verbraucht');
check(st.piety === piety + 1 && st.factions.kirche > kirche && st.money === 1000000, 'Wie ein Geschenk: Frömmigkeit, Kirche; kostet kein Geld');
let gains = new Set(); for (let i = 0; i < 60; i++) { const s = fresh(); s.day = sommer; s.frisch.koerbe = { apples: 1 }; s.persons.guild.loyalty = 10; gains.add(H.korbSchenken(s, 'guild', 'apples').gain); }
check([...gains].every(g => g >= 4 && g <= 8) && gains.size >= 4, 'Loyalität +4 bis +8: ' + [...gains].sort().join(','));
H.korbSchenken(st, 'priest', 'apples'); before = H.serialize(st);
r = H.korbSchenken(st, 'priest', 'apples'); check(!r.ok && r.msg === 'frischKeineKoerbe' && H.serialize(st) === before, 'Ohne Korb kein Geschenk, Zustand unverändert');
st = fresh(); st.day = 315 - 60; st.frisch.koerbe = { cabbage: 1 }; st.persons.mayor.loyalty = 20;
check(dayOfYear(st.day) === 315 && H.korbFesttag(st) === 'martini', 'Martinswoche erkannt');
forced = 0; r = H.korbSchenken(st, 'mayor', 'cabbage'); forced = null;
check(r.ok && r.gain === 8 && r.fest === 'martini' && st.persons.mayor.loyalty === 28 && st.log[0].key === 'korbGeschenktFest', 'Martini: der Korb zählt doppelt');
st = fresh(); st.day = 93 - 60; st.frisch.koerbe = { eggs: 1 }; forced = .99; r = H.korbSchenken(st, 'customs', 'eggs'); forced = null;
check(r.fest === 'easter' && r.gain === 16, 'Ostern: doppelt, höchstens 16');
check(H.korbFesttag({ day: 319 - 60 }) === null && H.korbFesttag({ day: 313 - 60 }) === null, 'Außerhalb der Martinswoche einfach');
const susp = st.suspicion; check(susp === H.newGame({ name: 'x', difficulty: 'normal', years: 20 }).suspicion, 'Korb an den Zöllner weckt keinen Verdacht');

/* ---------- Spielstand und Migration ---------- */
st = fresh(); st.stalls = 2; H.frischKaufen(st, 'poultry', 'eggs', 2); st.frisch.koerbe = { pears: 3 };
const saved = H.deserialize(H.serialize(st));
check(saved.frisch.stand.eggs === 2 && saved.frisch.koerbe.pears === 3 && saved.frisch.hof.poultry.eggs === 4, 'Stand, Vorrat und Hofkörbe überstehen das Speichern');
st = fresh(); delete st.frisch; for (const id of H.FRISCH_SITES) delete st.rural.sites[id];
const alt = H.serialize(st), rnd = seed; st = H.deserialize(alt);
check(seed === rnd, 'Migration zieht keine Zufallszahlen');
check(st.frisch && JSON.stringify(st.frisch.stand) === '{}' && JSON.stringify(st.frisch.koerbe) === '{}' && st.frisch.hof.poultry.eggs === 6 && H.FRISCH_SITES.every(id => st.rural.sites[id] && !st.rural.sites[id].owner), 'Alter Spielstand bekommt Betriebe und leeren Stand');
const m1 = H.serialize(st); H.migrate(st); check(H.serialize(st) === m1, 'Migration ist idempotent');
st = fresh(); st.frisch = { stand: { eggs: 2 } }; H.migrate(st); check(st.frisch.stand.eggs === 2 && st.frisch.koerbe && st.frisch.tag && st.frisch.hof, 'Teilweiser Zustand wird ergänzt');
st = fresh(); for (let i = 0; i < 400; i++) H.tick(st); check(!st.gameOver && st.frisch.hofTag === st.day, 'Ein Jahr Tagestick ohne Fehler');

/* ---------- Keine Handelsware ---------- */
const goods = new Set(H.GOODS.map(g => g.id));
for (const s of SORTEN) check(!goods.has(s) && !H.GOOD[s] && !(s in st.town.stock) && !(s in st.warehouse.stock), 'Frischware ist keine Handelsware: ' + s);
for (const s of SORTEN) check(!H.CONTRACT_GIVERS || Object.values(H.CONTRACT_GIVERS).every(g => !(g.goods || []).includes(s)), 'Keine Aufträge für ' + s);
check(Object.values(H.ORIGIN).every(o => !SORTEN.some(s => s in (o.sell || {}) || s in (o.buy || {}))), 'Kein Handelsort führt Frischware');
for (const lang of ['de', 'en']) for (const k of ['src_freshmarket', 'frischHelp', 'frischTag', 'frischTagVerdorben', 'frischTagSpital', 'frischSpitalWoche', 'frischNaturalien', 'korbGeschenkt', 'korbGeschenktFest', 'korbSchenken', 'frischKeinStand', 'frischStandVoll', 'frischKeineKoerbe', 'frischBluete', 'frischRuht', ...SORTEN.map(s => 'frisch_' + s)]) check(typeof H.I18N[lang][k] === 'string' && H.I18N[lang][k].length > 1, 'Text ' + lang + '/' + k);
console.log(JSON.stringify({ result: 'PASS', checks, sorten: SORTEN.length, betriebe: 3, nachfrageSommer: H.frischNachfrage(Object.assign(fresh(), { stalls: 1, day: sommer }), 'cherries') }));
