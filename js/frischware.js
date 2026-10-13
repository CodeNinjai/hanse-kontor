/* Frischware (8.10): Eier, Gemüse und Obst als eigene Klasse neben den Handelswaren. DOM-frei.
   Frischware ist nur lokal: Sie hält einen Tag, geht nie ins Lagerhaus und nie aufs Schiff und
   steht weder in HK.GOODS noch in Markttabelle, Preisseite oder Handelsrat. Hühnerhof, Gemüsegarten
   und Obstgarten im Umland legen jeden Morgen Körbe ihrer Saisonsorten bereit; wer einen Marktstand
   hat, kauft sie für den Stand. Am Abend verkauft der Stand nach Nachfrage (Feste, Wetter,
   Wohlstand); Reste verderben oder gehen an Spital und Arme. Eigene Betriebe liefern jede Woche
   einen Korb als Naturalie, den man verschenken oder auf den Stand legen kann. */
'use strict';

Object.assign(HK.CONST, {
  FRISCH_NACHFRAGE: 5,      // Körbe je Sorte und Stand an einem gewöhnlichen Tag
  FRISCH_AUFSCHLAG: 1.8,    // Verkaufspreis am Stand = Grundpreis × 1,8 × Wohlstand
  FRISCH_STAND_PLATZ: 20,   // so viele Körbe passen auf einen Stand
  FRISCH_VORRAT: 6,         // Naturalien-Vorrat höchstens
  FRISCH_SPITAL_PIETY: 0.3, // Frömmigkeit je Tag, an dem Reste ans Spital gehen
  FRISCH_MARTINI: [314, 318], // Tag des Jahres: Woche von Martini (11. November)
});

/* Sorten: Grundpreis je Korb (Mark), Herkunft und Monate (0 = Januar).
   Entscheidung: Eier gibt es von März bis November; im Winter legen die Hühner kaum, dann ruht der Hühnerhof. */
HK.FRISCH = {
  eggs:       { base: 4, site: 'poultry',    months: [2, 3, 4, 5, 6, 7, 8, 9, 10] },
  herbs:      { base: 3, site: 'gardenfarm', months: [2, 3, 4] },
  leek:       { base: 3, site: 'gardenfarm', months: [2, 3, 4] },
  cherries:   { base: 6, site: 'orchard',    months: [5, 6, 7] },
  peas:       { base: 4, site: 'gardenfarm', months: [5, 6, 7] },
  beans:      { base: 4, site: 'gardenfarm', months: [5, 6, 7] },
  apples:     { base: 4, site: 'orchard',    months: [8, 9, 10] },
  pears:      { base: 5, site: 'orchard',    months: [8, 9, 10] },
  plums:      { base: 5, site: 'orchard',    months: [8, 9, 10] },
  cabbage:    { base: 3, site: 'gardenfarm', months: [8, 9, 10, 11, 0, 1] },
  turnips:    { base: 2, site: 'gardenfarm', months: [8, 9, 10, 11, 0, 1] },
  driedfruit: { base: 7, site: 'orchard',    months: [11, 0, 1] },
};
HK.FRISCH_SITES = ['poultry', 'gardenfarm', 'orchard'];
HK.FRISCH_SITE_ICON = { poultry: 'eggs', gardenfarm: 'cabbage', orchard: 'apples' };
/* Die drei Betriebe stehen bei den übrigen Umlandbetrieben; ruralDay überspringt sie (fresh). */
Object.assign(HK.RURAL_SITES, {
  poultry:    { period: 1, cost: 2400, wage: 4, out: {}, fresh: true, baskets: 6 },
  gardenfarm: { period: 1, cost: 2800, wage: 5, out: {}, fresh: true, baskets: 8 },
  orchard:    { period: 1, cost: 3200, wage: 5, out: {}, fresh: true, baskets: 8 },
});
/* Feste und Fastenzeit verschieben die Nachfrage am Stand */
HK.FRISCH_FESTE = {
  lent:       { herbs: 1.4, leek: 1.4, peas: 1.4, beans: 1.4, cabbage: 1.4, turnips: 1.4, eggs: 0.5 },
  easter:     { eggs: 2.5, herbs: 1.3, leek: 1.3 },
  midsummer:  { cherries: 2, peas: 1.3, beans: 1.3 },
  michaelmas: { apples: 1.8, cabbage: 1.8, pears: 1.3, plums: 1.3 },
  christmas:  { driedfruit: 2, apples: 1.5 },
};
HK.FRISCH_WETTER = { clear: 1.1, cloudy: 1, rain: 0.6, storm: 0.5, snow: 0.4 };

HK.frischSaison = month => [2, 3, 4].includes(month) ? 'spring' : [5, 6, 7].includes(month) ? 'summer' : [8, 9, 10].includes(month) ? 'autumn' : 'winter';
HK.frischSorten = (month, site) => Object.keys(HK.FRISCH).filter(s => HK.FRISCH[s].months.includes(month) && (!site || HK.FRISCH[s].site === site));
HK.frischName = sorte => HK.t('frisch_' + sorte);
HK.frischKoerbeText = n => HK.t(n === 1 ? 'frischKorb' : 'frischKoerbe', { qty: n });
HK.frischAnzahl = koerbe => Object.values(koerbe || {}).reduce((n, q) => n + q, 0);

HK.frischInit = function (st) {
  const F = st.frisch ||= {};
  F.stand ||= {}; F.koerbe ||= {}; F.hof ||= {};
  F.tag ||= { day: -1, verkauft: 0, erloes: 0, verdorben: 0, spital: 0, sorten: {} };
  for (const k of ['abend', 'spitalTag', 'naturTag']) if (F[k] === undefined) F[k] = -1;
  // Neues Spiel und alter Spielstand: Die Betriebe haben heute schon Körbe bereit, ohne Lohn.
  if (F.hofTag === undefined && st.rural?.sites) HK.frischErnten(st, false);
  return F;
};
HK.newGameHooks.push(HK.frischInit); HK.migrateHooks.push(HK.frischInit);

/* Tagesertrag eines Betriebs: die Körbe verteilen sich gleichmäßig auf die Saisonsorten.
   Garten und Obstgarten geben im Winter nur die Hälfte (Lagerkohl, Rüben, Dörrobst aus dem Vorrat). */
HK.frischErtrag = function (st, site) {
  const month = HK.monthOf(st.day), sorten = HK.frischSorten(month, site), d = HK.RURAL_SITES[site];
  if (!sorten.length || !d) return {};
  const total = Math.round(d.baskets * (site !== 'poultry' && HK.frischSaison(month) === 'winter' ? 0.5 : 1));
  const out = {}, je = Math.floor(total / sorten.length);
  sorten.forEach((s, i) => { const n = je + (i < total - je * sorten.length ? 1 : 0); if (n > 0) out[s] = n; });
  return out;
};
/* Warum heute keine Körbe am Hof liegen: pausiert, Jahreszeit (Winter, Blüte) oder schon alles verkauft */
HK.frischLeerGrund = function (st, site) {
  const s = st.rural?.sites?.[site]; if (!s) return 'frischNichts';
  if (s.active === false) return 'ruralPaused';
  if (HK.frischAnzahl(st.frisch?.hof?.[site]) >= 1) return null;
  return Object.keys(HK.frischErtrag(st, site)).length ? 'frischVergriffen' : s.reason || 'frischNichts';
};
HK.frischRuheGrund = (st, site) => site === 'orchard' && HK.frischSaison(HK.monthOf(st.day)) === 'spring' ? 'frischBluete' : 'frischRuht';
/* Morgens: Die Körbe von gestern verfallen, die Betriebe legen neue bereit; eigene Betriebe zahlen Lohn. */
HK.frischErnten = function (st, lohn = true) {
  const F = st.frisch, sites = st.rural?.sites || {};
  for (const site of HK.FRISCH_SITES) {
    const s = sites[site], d = HK.RURAL_SITES[site];
    if (!s) { F.hof[site] = {}; continue; }
    const out = s.active ? HK.frischErtrag(st, site) : {};
    F.hof[site] = out;
    if (!s.active) continue;
    s.reason = Object.keys(out).length ? null : HK.frischRuheGrund(st, site);
    if (lohn && s.owner && !s.reason && d.wage) HK.book(st, 'wages', -d.wage);
  }
  F.hofTag = st.day;
};

/* ---------- Nachfrage und Preise am Stand ---------- */
HK.frischFestFaktor = function (st, sorte) {
  const se = HK.seasonEvent(st);
  return se && HK.FRISCH_FESTE[se.id]?.[sorte] || 1;
};
HK.frischWetterFaktor = st => HK.FRISCH_WETTER[HK.weatherAt?.(st)?.type] ?? 1;
HK.frischStimmung = st => HK.prosperityMod(st);
HK.frischNachfrage = function (st, sorte) {
  if (!(st.stalls > 0) || !HK.FRISCH[sorte]) return 0;
  return Math.max(0, Math.round(HK.CONST.FRISCH_NACHFRAGE * st.stalls * HK.frischFestFaktor(st, sorte) * HK.frischWetterFaktor(st) * HK.frischStimmung(st)));
};
HK.frischVerkaufspreis = (st, sorte) => Math.round(HK.FRISCH[sorte].base * HK.CONST.FRISCH_AUFSCHLAG * HK.frischStimmung(st) * 10) / 10;
HK.frischEinkaufspreis = (st, site, sorte) => st.rural?.sites?.[site]?.owner ? 0 : HK.FRISCH[sorte].base;
HK.frischStandPlatz = st => Math.max(0, (st.stalls || 0) * HK.CONST.FRISCH_STAND_PLATZ - HK.frischAnzahl(st.frisch?.stand));
HK.frischSpital = st => !!st.hospitalEndowed || st.piety >= 40;
HK.frischBesitz = st => HK.FRISCH_SITES.some(site => st.rural?.sites?.[site]?.owner);

/* ---------- Handlungen ---------- */
HK.frischAngebot = function (st, site, sorte, qty) {
  const F = st.frisch, have = Math.floor(F?.hof?.[site]?.[sorte] || 0);
  if (st.gameOver || !F || !HK.FRISCH[sorte] || HK.FRISCH[sorte].site !== site) return { ok: false };
  if (!(st.stalls > 0)) return { ok: false, msg: 'frischKeinStand' };
  if (!Number.isInteger(qty) || qty <= 0 || have < qty) return { ok: false, msg: 'frischKeineKoerbe' };
  if (HK.frischStandPlatz(st) < qty) return { ok: false, msg: 'frischStandVoll' };
  const unit = HK.frischEinkaufspreis(st, site, sorte), cost = unit * qty;
  if (st.money < cost) return { ok: false, msg: 'notEnoughMoney' };
  return { ok: true, site, sorte, qty, unit, cost };
};
HK.frischKaufen = function (st, site, sorte, qty = 1) {
  HK.frischInit(st);
  const a = HK.frischAngebot(st, site, sorte, qty); if (!a.ok) return a;
  if (a.cost) HK.book(st, 'freshmarket', -a.cost);
  HK.addStock(st.frisch.hof[site], sorte, -qty); HK.addStock(st.frisch.stand, sorte, qty);
  HK.scheduleSave?.(); return { ok: true, cost: a.cost, qty };
};
HK.korbAufStand = function (st, sorte) {
  const F = HK.frischInit(st);
  if (st.gameOver || !HK.FRISCH[sorte]) return { ok: false };
  if (!(st.stalls > 0)) return { ok: false, msg: 'frischKeinStand' };
  if (!(F.koerbe[sorte] >= 1)) return { ok: false, msg: 'frischKeineKoerbe' };
  if (HK.frischStandPlatz(st) < 1) return { ok: false, msg: 'frischStandVoll' };
  HK.addStock(F.koerbe, sorte, -1); HK.addStock(F.stand, sorte, 1);
  HK.scheduleSave?.(); return { ok: true };
};
/* Martinswoche und Osterzeit: ein Korb zählt doppelt */
HK.korbFesttag = function (st) {
  const d = HK.dayOfYear(st), [a, b] = HK.CONST.FRISCH_MARTINI;
  if (d >= a && d <= b) return 'martini';
  return HK.seasonEvent(st)?.id === 'easter' ? 'easter' : null;
};
HK.korbSchenken = function (st, pid, sorte) {
  const F = HK.frischInit(st), p = st.persons?.[pid];
  if (st.gameOver || !p || !HK.PERSON[pid] || !HK.FRISCH[sorte]) return { ok: false };
  if (!(F.koerbe[sorte] >= 1)) return { ok: false, msg: 'frischKeineKoerbe' };
  const fest = HK.korbFesttag(st), gain = HK.rndi(4, 8) * (fest ? 2 : 1);
  HK.addStock(F.koerbe, sorte, -1);
  p.loyalty = HK.clamp(p.loyalty + gain, 0, 100);
  // Wie ein Geschenk: Die Gruppe der beschenkten Person sieht es; ein Korb aus dem eigenen Hof ist keine Bestechung.
  HK.fac?.(st, HK.factionOf(pid), HK.PERSON[pid].council ? 1.5 : 1);
  if (pid === 'priest') st.piety = HK.clamp(st.piety + 1, 0, 100);
  HK.log(st, fest ? 'korbGeschenktFest' : 'korbGeschenkt', { name: HK.personName(st, pid), sorte: HK.frischName(sorte), fest: fest ? HK.t('frischFest_' + fest) : '' }, 'good');
  HK.scheduleSave?.(); return { ok: true, gain, fest };
};

/* ---------- Tagesablauf ---------- */
/* Abends (vor dem Tageswechsel): Der Stand verkauft mit Wetter, Festen und Wohlstand des Tages. */
HK.frischAbend = function (st) {
  const F = HK.frischInit(st); if (F.abend === st.day) return null;
  const sorten = Object.keys(F.stand).filter(s => F.stand[s] > 0); if (!sorten.length) return null;
  F.abend = st.day;
  let verkauft = 0, erloes = 0, rest = 0; const detail = {};
  for (const s of sorten) {
    const q = Math.floor(F.stand[s]), n = Math.min(q, HK.frischNachfrage(st, s));
    verkauft += n; erloes += n * HK.frischVerkaufspreis(st, s); rest += q - n; detail[s] = { verkauft: n, rest: q - n };
  }
  F.stand = {}; erloes = Math.round(erloes);
  if (erloes > 0) HK.book(st, 'freshmarket', erloes);
  const spital = rest > 0 && HK.frischSpital(st);
  if (spital) {
    st.piety = HK.clamp(st.piety + HK.CONST.FRISCH_SPITAL_PIETY, 0, 100);
    if (!(F.spitalTag > st.day - 7)) { F.spitalTag = st.day; HK.log(st, 'frischSpitalWoche', {}, 'good'); }
  }
  F.tag = { day: st.day, verkauft, erloes, verdorben: spital ? 0 : rest, spital: spital ? rest : 0, sorten: detail };
  HK.log(st, !rest ? 'frischTag' : spital ? 'frischTagSpital' : 'frischTagVerdorben', { verkauft: HK.frischKoerbeText(verkauft), erloes: HK.fmt(erloes), rest: HK.frischKoerbeText(rest) }, !rest ? 'good' : spital ? 'info' : 'bad');
  return F.tag;
};
{ const tick = HK.tick; HK.tick = function (st) { if (!st.gameOver) HK.frischAbend(st); return tick(st); }; }
/* Morgens (nach dem Tageswechsel): neue Körbe; einmal die Woche Naturalien von eigenen Betrieben. */
HK.frischMorgen = function (st) {
  const F = HK.frischInit(st); if (F.hofTag === st.day) return;
  HK.frischErnten(st);
  if (st.day % 7 === 0 && F.naturTag !== st.day) {
    F.naturTag = st.day; const got = [];
    for (const site of HK.FRISCH_SITES) {
      const s = st.rural.sites[site]; if (!s?.owner || !s.active) continue;
      const sorte = Object.keys(HK.frischErtrag(st, site))[0];
      if (!sorte || HK.frischAnzahl(F.koerbe) >= HK.CONST.FRISCH_VORRAT) continue;
      HK.addStock(F.koerbe, sorte, 1); got.push(HK.frischName(sorte));
    }
    if (got.length) HK.log(st, 'frischNaturalien', { sorten: got.join(', '), qty: HK.frischAnzahl(F.koerbe), max: HK.CONST.FRISCH_VORRAT }, 'good');
  }
};
HK.tickHooks.push(st => HK.frischMorgen(st));

Object.assign(HK.I18N.de, {
  frisch_eggs: 'Eier', frisch_herbs: 'Kräuter', frisch_leek: 'Lauch', frisch_cherries: 'Kirschen', frisch_peas: 'Erbsen', frisch_beans: 'Bohnen',
  frisch_apples: 'Äpfel', frisch_pears: 'Birnen', frisch_plums: 'Pflaumen', frisch_cabbage: 'Kohl', frisch_turnips: 'Rüben', frisch_driedfruit: 'Dörrobst',
  frischSaison_spring: 'Frühjahr', frischSaison_summer: 'Sommer', frischSaison_autumn: 'Herbst', frischSaison_winter: 'Winter',
  frischFest_martini: 'Martinswoche', frischFest_easter: 'Osterzeit',
  src_freshmarket: 'Frischware am Stand',
  frischTitel: 'Frischware',
  frischHelp: '<p><b>Frischware</b> sind Eier, Gemüse und Obst aus dem Umland: Hühnerhof, Gemüsegarten und Obstgarten. Sie ist keine Handelsware. Sie hält nur einen Tag, kommt nie ins Lagerhaus und nie aufs Schiff und erscheint nicht in der Preisliste.</p><p><b>Jahreslauf:</b> Im Frühjahr Eier, Kräuter und Lauch; im Sommer Kirschen, Erbsen und Bohnen; im Herbst Äpfel, Birnen, Pflaumen, Kohl und Rüben; im Winter nur Lagerkohl, Rüben und Dörrobst. Eier gibt es von März bis November. Im Frühjahr blüht der Obstgarten und trägt noch nichts.</p><p><b>Marktstand:</b> Mit mindestens einem eigenen Marktstand kaufst du morgens Körbe bei den Betrieben und bezahlst sofort, bei eigenen Betrieben nichts. Am Abend verkauft der Stand: je Sorte etwa fünf Körbe je Stand, mehr an Festtagen (Ostern Eier, Johannis Kirschen, Michaelis Äpfel und Kohl), in der Fastenzeit mehr Gemüse und weniger Eier. Regen (×0,6) und Schnee (×0,4) halten die Kundschaft fern, klares Wetter bringt etwas mehr. Der Preis je Korb ist der Grundpreis × 1,8 × Wohlstand der Stadt.</p><p><b>Reste:</b> Was abends übrig ist, verdirbt. Hast du das Spital gestiftet oder steht die Kirche zu dir (Frömmigkeit ab 40), gehen die Reste an Spital und Arme: +0,3 Frömmigkeit je Tag.</p><p><b>Naturalien:</b> Gehört dir einer der drei Betriebe, liefert er jede Woche einen Korb der Saison, bis zu sechs Körbe Vorrat; sie verderben nicht (eingelegt, gedörrt, lebende Hühner). Du kannst einen Korb verschenken (Loyalität +4 bis +8, in der Martinswoche und zu Ostern doppelt) oder auf deinen Stand legen.</p>',
  frischHeute: 'Heute bereit',
  frischKoerbe: '{qty} Körbe', frischKorb: '1 Korb',
  frischKorbPreis: '{price} Mark je Korb',
  frischEigenGratis: 'eigene Ernte, nur Lohn',
  frischAufStand: 'Auf den Stand',
  frischAufStandAlle: 'Alle {qty} auf den Stand',
  frischAufStandEinzeln: '1 Korb auf den Stand',
  frischKeinStand: 'Frischware verkaufst du nur über einen eigenen Marktstand.',
  frischKeineKoerbe: 'Davon sind keine Körbe mehr da.',
  frischStandVoll: 'Auf deinen Ständen ist kein Platz mehr für weitere Körbe.',
  frischNichts: 'Heute trägt der Betrieb nichts.', frischVergriffen: 'Heute vergriffen: Alle Körbe sind schon verkauft.',
  frischRuht: 'Ruht in dieser Jahreszeit',
  frischBluete: 'Die Bäume blühen, noch keine Ernte',
  frischStand: 'Auf deinem Stand',
  frischStandLeer: 'Noch keine Frischware auf dem Stand.',
  frischStandPlatz: 'Freier Platz: {qty}',
  frischNachfrageHeute: 'Abnahme heute je Sorte etwa: {qty} · {price} Mark je Korb',
  frischFaktoren: 'Wetter ×{wetter} · Wohlstand ×{stimmung}{fest}',
  frischFestHinweis: ' · {fest}',
  frischGestern: 'Zuletzt ({date}): verkauft {verkauft}, {erloes} Mark; {rest}',
  frischGesternRest_none: 'nichts übrig',
  frischGesternRest_spital: 'an Spital und Arme: {qty}',
  frischGesternRest_verdorben: 'verdorben: {qty}',
  frischResteSpital: 'Reste gehen an Spital und Arme (+0,3 Frömmigkeit je Tag).',
  frischResteVerdorben: 'Reste verderben am Abend. Mit gestiftetem Spital oder Frömmigkeit ab 40 gingen sie an die Armen.',
  frischBetriebe: 'Frischware aus dem Umland',
  frischOhneStand: 'Ohne eigenen Marktstand kannst du keine Frischware verkaufen.',
  frischNaturalienTitel: 'Naturalien',
  frischNaturalienText: 'Vorrat: {qty} von {max} Körben. Eigene Betriebe liefern jede Woche einen Korb.',
  frischNaturalienLeer: 'Kein Vorrat. Eigene Hühnerhöfe, Gärten und Obstgärten liefern jede Woche einen Korb.',
  frischTagesertrag: 'Je Tag: {qty} Körbe der Saison',
  frischBetriebInfo: 'Erzeugt Frischware, keine Handelsware: Die Körbe halten einen Tag und gehen nicht ins Lager.',
  frischNaturalHinweis: 'Als Eigentümer: jede Woche ein Korb als Naturalie, Körbe für den Stand ohne Einkaufspreis.',
  frischZumStand: 'Zu den Marktständen',
  korbSchenken: 'Korb schenken',
  korbSchenkenSorte: 'Korb zum Verschenken',
  korbGeschenktToast: 'Korb {sorte} für {name}: Loyalität +{gain}',
  korbGeschenkt: 'Du schenkst {name} einen Korb {sorte}.',
  korbGeschenktFest: 'Du schenkst {name} einen Korb {sorte}. In der {fest} zählt die Gabe doppelt.',
  frischTag: 'Marktstand: Frischware verkauft ({verkauft}), {erloes} Mark. Nichts ist übrig.',
  frischTagVerdorben: 'Marktstand: Frischware verkauft ({verkauft}), {erloes} Mark. Verdorben: {rest}.',
  frischTagSpital: 'Marktstand: Frischware verkauft ({verkauft}), {erloes} Mark. An Spital und Arme: {rest}.',
  frischSpitalWoche: 'Die Reste deines Standes gehen an das Spital und die Armen der Stadt. Die Kirche sieht es gern.',
  frischNaturalien: 'Naturalien aus deinen Betrieben: {sorten}. Vorrat {qty} von {max} Körben.',
});
Object.assign(HK.I18N.en, {
  frisch_eggs: 'Eggs', frisch_herbs: 'Herbs', frisch_leek: 'Leeks', frisch_cherries: 'Cherries', frisch_peas: 'Peas', frisch_beans: 'Beans',
  frisch_apples: 'Apples', frisch_pears: 'Pears', frisch_plums: 'Plums', frisch_cabbage: 'Cabbage', frisch_turnips: 'Turnips', frisch_driedfruit: 'Dried fruit',
  frischSaison_spring: 'Spring', frischSaison_summer: 'Summer', frischSaison_autumn: 'Autumn', frischSaison_winter: 'Winter',
  frischFest_martini: 'Martinmas week', frischFest_easter: 'Easter season',
  src_freshmarket: 'Fresh produce stall',
  frischTitel: 'Fresh produce',
  frischHelp: '<p><b>Fresh produce</b> means eggs, vegetables and fruit from the countryside: the hen yard, the kitchen garden and the orchard. It is not a trade good. It keeps for one day, never goes into the warehouse or aboard a ship and does not appear in the price list.</p><p><b>Seasons:</b> Spring brings eggs, herbs and leeks; summer cherries, peas and beans; autumn apples, pears, plums, cabbage and turnips; winter only stored cabbage, turnips and dried fruit. Eggs are available from March to November. In spring the orchard is in blossom and bears nothing yet.</p><p><b>Market stall:</b> With at least one market stall of your own you buy baskets from the producers in the morning and pay at once; from your own businesses they cost nothing. In the evening the stall sells: about five baskets per kind and stall, more on feast days (eggs at Easter, cherries at Midsummer, apples and cabbage at Michaelmas), more vegetables and fewer eggs in Lent. Rain (×0.6) and snow (×0.4) keep customers away, clear weather brings a few more. A basket sells for its base price × 1.8 × the town’s prosperity.</p><p><b>Leftovers:</b> Whatever is left in the evening spoils. If you endowed the hospital or the church favours you (piety 40 or more), leftovers go to the hospital and the poor: +0.3 piety per day.</p><p><b>Produce in kind:</b> If you own one of the three businesses, it delivers one basket of the season each week, up to six baskets in store; these do not spoil (pickled, dried, live hens). You can give a basket as a present (loyalty +4 to +8, doubled in Martinmas week and at Easter) or put it on your stall.</p>',
  frischHeute: 'Ready today',
  frischKoerbe: '{qty} baskets', frischKorb: '1 basket',
  frischKorbPreis: '{price} marks per basket',
  frischEigenGratis: 'own harvest, wages only',
  frischAufStand: 'Put on the stall',
  frischAufStandAlle: 'All {qty} onto the stall',
  frischAufStandEinzeln: '1 basket onto the stall',
  frischKeinStand: 'You can only sell fresh produce from a market stall of your own.',
  frischKeineKoerbe: 'There are no baskets of that left.',
  frischStandVoll: 'Your stalls have no room for more baskets.',
  frischNichts: 'The business yields nothing today.', frischVergriffen: 'Sold out today: every basket has been bought.',
  frischRuht: 'Resting this season',
  frischBluete: 'The trees are in blossom, no harvest yet',
  frischStand: 'On your stall',
  frischStandLeer: 'No fresh produce on the stall yet.',
  frischStandPlatz: 'Room left: {qty}',
  frischNachfrageHeute: 'Sales today per kind about: {qty} · {price} marks per basket',
  frischFaktoren: 'Weather ×{wetter} · prosperity ×{stimmung}{fest}',
  frischFestHinweis: ' · {fest}',
  frischGestern: 'Last time ({date}): sold {verkauft}, {erloes} marks; {rest}',
  frischGesternRest_none: 'nothing left',
  frischGesternRest_spital: 'to the hospital and the poor: {qty}',
  frischGesternRest_verdorben: 'spoiled: {qty}',
  frischResteSpital: 'Leftovers go to the hospital and the poor (+0.3 piety per day).',
  frischResteVerdorben: 'Leftovers spoil in the evening. With an endowed hospital or piety of 40 they would go to the poor.',
  frischBetriebe: 'Fresh produce from the countryside',
  frischOhneStand: 'Without a market stall of your own you cannot sell fresh produce.',
  frischNaturalienTitel: 'Produce in kind',
  frischNaturalienText: 'In store: {qty} of {max} baskets. Your businesses deliver one basket each week.',
  frischNaturalienLeer: 'Nothing in store. Hen yards, gardens and orchards of your own deliver one basket each week.',
  frischTagesertrag: 'Per day: {qty} baskets of the season',
  frischBetriebInfo: 'Produces fresh produce, not trade goods: baskets keep for one day and never go into the warehouse.',
  frischNaturalHinweis: 'As owner: one basket in kind each week, and baskets for your stall without purchase price.',
  frischZumStand: 'To the market stalls',
  korbSchenken: 'Give a basket',
  korbSchenkenSorte: 'Basket to give',
  korbGeschenktToast: 'Basket of {sorte} for {name}: loyalty +{gain}',
  korbGeschenkt: 'You give {name} a basket of {sorte}.',
  korbGeschenktFest: 'You give {name} a basket of {sorte}. In {fest} the gift counts double.',
  frischTag: 'Market stall: fresh produce sold ({verkauft}) for {erloes} marks. Nothing left over.',
  frischTagVerdorben: 'Market stall: fresh produce sold ({verkauft}) for {erloes} marks. Spoiled: {rest}.',
  frischTagSpital: 'Market stall: fresh produce sold ({verkauft}) for {erloes} marks. To the hospital and the poor: {rest}.',
  frischSpitalWoche: 'The leftovers from your stall go to the hospital and the town’s poor. The church is pleased.',
  frischNaturalien: 'Produce in kind from your businesses: {sorten}. In store {qty} of {max} baskets.',
});
