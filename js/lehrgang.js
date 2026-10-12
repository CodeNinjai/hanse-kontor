/* Einstieg ins Spiel: Handelsrat und Lehrgang „Erste Schritte“.
   Der Handelsrat sagt zu jeder Ware, wer sie gerade am teuersten abnimmt und wer sie am billigsten
   hergibt — Besucher, Markt und eigene Aufträge zusammen, alles mit Zoll und Gebühren gerechnet.
   Der Lehrgang führt einen neuen Spieler in neun Schritten vom angehaltenen Spiel zum ersten
   eigenen Marktstand. Er merkt sich, was der Spieler tut, statt ihn durch Fenster zu zwingen. */
'use strict';

/* ---------- Handelsrat ---------- */
HK.nettoKauf = (st, v, g) => { const c = v.cargo[g]; return c ? Math.round(c.price * (1 + HK.tariffRate(st) * (1 - HK.customsDiscount(st)))) : 0; };
HK.nettoVerkauf = (st, v, g) => { const w = v.wants[g]; return w ? Math.round(w.price * (g === 'cloth' && HK.hasVenture && HK.hasVenture(st, 'dyer') ? 1.1 : 1) * (1 - HK.tariffRate(st) * 0.5 * (1 - HK.customsDiscount(st)))) : 0; };
HK.besucherAlle = st => st.ships.concat(st.caravans);
HK.besucherName = v => v.sea ? v.name : HK.t('caravanFrom', { origin: HK.name(HK.ORIGIN[v.origin]) });

/* Wer zahlt am meisten für g? Besucher (außer `ohne`), Markt und angenommene Lieferaufträge. */
HK.besterAbnehmer = function (st, g, ohne) {
  let best = null;
  const nimm = (preis, wer, menge, art) => { if (preis > 0 && menge > 0 && (!best || preis > best.preis)) best = { preis, wer, menge, art }; };
  for (const v of HK.besucherAlle(st)) if (v !== ohne && v.wants[g]) nimm(HK.nettoVerkauf(st, v, g), HK.besucherName(v), v.wants[g].qty, 'besucher');
  const cap = HK.marketCap(st, g); if (ohne !== 'markt' && cap > 0) nimm(HK.marketSellPrice(st, g, 1), HK.t('market'), cap, 'markt');
  for (const c of (st.contracts ? st.contracts.active : [])) if (c.type === 'deliver' && c.good === g) nimm(c.price, HK.t('giver_' + c.giver), c.qty, 'auftrag');
  return best;
};
/* Wer gibt g am billigsten her? Besucher (außer `ohne`) und Markt. */
HK.besteQuelle = function (st, g, ohne) {
  let best = null;
  const nimm = (preis, wer, menge, art) => { if (preis > 0 && menge > 0 && (!best || preis < best.preis)) best = { preis, wer, menge, art }; };
  for (const v of HK.besucherAlle(st)) if (v !== ohne && v.cargo[g]) nimm(HK.nettoKauf(st, v, g), HK.besucherName(v), v.cargo[g].qty, 'besucher');
  if (ohne !== 'markt' && (st.town.stock[g] || 0) >= 1) nimm(HK.marketBuyPrice(st, g, 1), HK.t('market'), Math.floor(st.town.stock[g]), 'markt');
  return best;
};
/* Lohnt sich bei diesem Besucher irgendein Geschäft? Für das Kärtchen in der Liste. */
HK.besucherLohnt = function (st, v) {
  let max = 0;
  for (const g in v.cargo) { const a = HK.besterAbnehmer(st, g, v); if (a) max = Math.max(max, (a.preis - HK.nettoKauf(st, v, g)) / HK.nettoKauf(st, v, g)); }
  for (const g in v.wants) { if ((st.warehouse.stock[g] || 0) >= 1) max = Math.max(max, 0.2); const q = HK.besteQuelle(st, g, v); if (q) max = Math.max(max, (HK.nettoVerkauf(st, v, g) - q.preis) / q.preis); }
  return max;
};

/* ---------- Lehrgang ---------- */
HK.LEHRGANG = [
  { id: 'zeit',     ziel: null,                      check: st => st.speed > 0 },
  { id: 'hafen',    ziel: { panel: 'harbour' },     flag: 'hafen' },
  { id: 'verkauf',  ziel: { panel: 'gate' },        flag: 'verkauf' },
  { id: 'zwischen', ziel: { tab: 'missions' },       flag: 'zwischen', lohn: { geld: 250 } },
  { id: 'geruecht', ziel: { panel: 'tavern' },      flag: 'geruecht' },
  { id: 'markt',    ziel: { panel: 'market' },      flag: 'markt' },
  { id: 'auftrag',  ziel: { tab: 'missions' },      check: st => st.contracts.done > 0, lohn: { ruf: 3 } },
  { id: 'ausbau',   ziel: { panel: 'marketStalls' },flag: 'ausbau', lohn: { geld: 500 } },
  { id: 'weg',      ziel: { tab: 'overview' },      flag: 'weg', lohn: { einfluss: 5 } },
];
HK.newGameHooks.push(st => { st.lehrgang = { schritt: 0, flags: {}, einkauf: {}, offen: true, fertig: false, guided: true }; });
/* Alte Spielstände ohne Einführung bleiben abgeschlossen; vorhandener Fortschritt bleibt erhalten. */
HK.migrateHooks.push(st => { if (!st.lehrgang) st.lehrgang = { schritt: HK.LEHRGANG.length, flags: {}, einkauf: {}, offen: false, fertig: true }; });

// Only new games use gradual introductions; existing saves keep their open stories.
HK.introStage = st => !st.lehrgang?.guided || st.lehrgang.fertig || st.lehrgang.explore ? 2 : st.lehrgang.schritt >= 3 ? 1 : 0;
HK.lehrgangSchritt = st => st.lehrgang && !st.lehrgang.fertig ? HK.LEHRGANG[st.lehrgang.schritt] : null;
HK.lehrgangMerke = function (st, flag) {
  const L = st && st.lehrgang; if (!L || L.fertig) return;
  if (!L.flags[flag]) { L.flags[flag] = true; HK.scheduleSave?.(); }
  HK.lehrgangWeiter(st);
};
/* Schritte rücken nur der Reihe nach vor; was vorgezogen erledigt wurde, zählt beim Erreichen sofort */
HK.lehrgangWeiter = function (st) {
  const L = st.lehrgang; if (!L || L.fertig) return;
  const previousStep = L.schritt;
  let s;
  while ((s = HK.LEHRGANG[L.schritt]) && (s.check ? s.check(st) : L.flags[s.flag])) {
    if (s.lohn) {
      if (s.lohn.geld) HK.book(st, 'contracts', s.lohn.geld);
      if (s.lohn.ruf) st.rep = HK.clamp(st.rep + s.lohn.ruf, 0, 100);
      if (s.lohn.einfluss) st.influence += s.lohn.einfluss;
    }
    HK.log(st, 'lehrgangErledigt', { schritt: HK.t('lg_' + s.id + '_titel'), lohn: s.lohn ? HK.lehrgangLohnText(s.lohn) : '' }, 'good');
    (L.steps ||= []).push({ id: s.id, day: st.day });
    L.schritt++; L.offen = true;
  }
  if (L.schritt >= HK.LEHRGANG.length) { L.fertig = true; L.offen = false; L.finished = st.day; HK.log(st, 'lehrgangFertig', {}, 'good'); }
  if (L.schritt !== previousStep) { HK.introSync?.(st); HK.scheduleSave?.(); }
};
HK.lehrgangLohnText = l => [l.geld ? HK.fmt(l.geld) + ' ' + HK.t('mark') : '', l.ruf ? '+' + l.ruf + ' ' + HK.t('rep') : '', l.einfluss ? '+' + l.einfluss + ' ' + HK.t('influence') : ''].filter(Boolean).join(', ');
// Compatibility for old callers: a mission cannot be reset to collect its rewards again.
HK.lehrgangNeu = function (st) { return st.lehrgang; };

/* Was der Spieler tut, wird mitgeschrieben. Der Zwischenhandel zählt erst, wenn eine bei einem
   Besucher gekaufte Ware an einen anderen Besucher teurer weitergeht, als sie gekostet hat. */
HK.wrapAction('buyFromVisitor', (st, r, v, g, qty) => {
  const L = st.lehrgang; if (!L || L.fertig) return;
  const alt = L.einkauf[g]; const preis = r.cost / Math.max(1, qty);
  L.einkauf[g] = { preis: alt ? Math.min(alt.preis, preis) : preis, von: v.id };
});
HK.wrapAction('sellToVisitor', (st, r, v, g, qty) => {
  const L = st.lehrgang; if (!L || L.fertig) return;
  HK.lehrgangMerke(st, 'verkauf');
  const e = L.einkauf[g]; if (e && e.von !== v.id && r.cost / Math.max(1, qty) > e.preis) HK.lehrgangMerke(st, 'zwischenhandel');
});
HK.wrapAction('buyRumor', st => HK.lehrgangMerke(st, 'geruecht'));
HK.wrapAction('marketSell', st => { HK.lehrgangMerke(st, 'verkauf'); HK.lehrgangMerke(st, 'markt'); });
HK.wrapAction('acceptContract', st => HK.lehrgangMerke(st, 'auftrag'));
HK.wrapAction('deliverContract', st => HK.lehrgangMerke(st, 'verkauf'));
HK.wrapAction('fishmarketSell', st => HK.lehrgangMerke(st, 'verkauf'));
// Recover a real, completed sale in older saves without awarding the step twice.
HK.migrateHooks.push(st => {
  if (!st.lehrgang?.fertig && (st.lehrgang?.flags.markt || st.saltStory?.receipts.some(r => !r.failed && r.revenue > 0) || st.post?.contracts.some(c => c.status === 'done' && c.type === 'deliver'))) HK.lehrgangMerke(st, 'verkauf');
});
HK.wrapAction('buyStall', st => HK.lehrgangMerke(st, 'ausbau'));
HK.wrapAction('buyShip', st => HK.lehrgangMerke(st, 'ausbau'));
HK.tickHooks.push(st => HK.lehrgangWeiter(st));

Object.assign(HK.I18N.de, {
  lehrgang: 'Erste Schritte', lehrgangSchritt: 'Schritt {n} von {m}', lehrgangZeig: 'Zeig mir wo', lehrgangAus: 'Ausblenden', lehrgangEin: 'Erste Schritte zeigen',
  lehrgangNeu: 'Lehrgang neu beginnen', lehrgangLohn: 'Belohnung: {lohn}', lehrgangErledigt: 'Erste Schritte: „{schritt}“ erledigt. {lohn}', lehrgangFertig: 'Einführungsmission abgeschlossen: Alle neun Schritte sind erledigt.',
  lehrgangFertigKurz: 'Alle Schritte erledigt.',
  lg_zeit_titel: 'Die Zeit laufen lassen', lg_zeit_text: 'Das Spiel beginnt angehalten. Drücke die <b>Leertaste</b> oder ▶ unter der Karte. Mit <b>1</b>, <b>2</b>, <b>3</b> wählst du das Tempo, <b>N</b> springt einen Tag weiter.',
  lg_hafen_titel: 'Den Hafen ansehen', lg_hafen_text: 'Klicke auf ein Schiff am Kai oder auf „Zeig mir wo“. Seine Warenkarten zeigen <b>Angebote</b>, <b>Gesuche</b> und den Preis nach Zoll. Bei größeren Mengen gibt es einen Rabatt; Hinweise auf andere Käufer zeigen, welche Ware morgen fehlen könnte.',
  lg_verkauf_titel: 'Deine erste Ware verkaufen', lg_verkauf_text: 'Verkaufe Ware aus deinem Lager an einen Besucher oder am Markt. Auch eine erfüllte, bezahlte Warenlieferung zählt. Du musst dafür keine bestimmte Startware aufheben. Ist dein Lager leer, kannst du neue Ware einkaufen und weiterverkaufen.',
  lg_zwischen_titel: 'Eine Lieferzusage eingehen', lg_zwischen_text: 'Nimm unter <b>Aufträge & Missionen</b> einen Lieferauftrag an. Prüfe Erlös, Frist und Vertragsstrafe. Danach vergleichst du in <b>Planung</b> den sofortigen Einkauf mit einer vorausbezahlten Lieferung.',
  lg_geruecht_titel: 'Ein Gerücht hören', lg_geruecht_text: 'In der Taverne erfährst du für ein paar Mark, welche Schiffe kommen. Wer weiß, was gesucht wird, kauft vorher ein.',
  lg_markt_titel: 'Am Markt verkaufen', lg_markt_text: 'Die Bürger zahlen nur gut, wo Ware <b>knapp</b> ist (rote Marke). Verkaufe dort etwas — aber nicht mehr, als sie heute abnehmen.',
  lg_auftrag_titel: 'Eine Zusage erfüllen', lg_auftrag_text: 'Liefere einen angenommenen Auftrag <b>vor Ablauf der Frist</b>. Unter <b>Aufträge & Missionen</b> siehst du den Fortschritt und findest den Auftraggeber auf der Karte. Dort übergibst du die Ware. <b>Planung</b> hilft bei fehlender Ware. Eine günstige, aber verspätete Lieferung verschiebt den Termin nicht.',
  lg_ausbau_titel: 'Das erste eigene Geschäft', lg_ausbau_text: 'Lass einen <b>Marktstand</b> errichten (zwei Tage Bauzeit) oder auf der Werft ein <b>Schiff</b> bauen. Der Schritt zählt erst bei Fertigstellung. Mit dem Stand nimmt der Markt mehr ab; ein Handelsschiff benötigt vor seiner ersten Reise noch Besatzung und Proviant.',
  lg_weg_titel: 'Einen Weg wählen', lg_weg_text: 'Sechs Wege führen zu einem Titel: Handel, Rat, Reederei, Kirche, Zünfte oder Unterwelt. In der <b>Übersicht</b> stehen ihre Bedingungen — such dir einen aus.',
  rat_spalte: 'Bester Gegenpart', rat_keiner: 'niemand', rat_lager: 'aus dem Lager', rat_lohnt: 'lohnt', rat_kurz_ab: 'nimmt ab: {wer} {preis}', rat_kurz_von: 'hat: {wer} {preis}',
  rat_hinweis: 'Grün: geschätzte Handelsspanne je Last beim Weiterverkauf, nach Zoll und Gebühren. Mengenpreise und begrenzte Nachfrage können den Gesamtgewinn verändern.',
  rat_marge: '{money} Mark/Last', rat_markt_titel: 'Handelsvergleich', rat_markt_kauf: 'Nach Einkauf hier: {wer} zahlt etwa {preis} Mark/Last netto. Nachfrage: {qty} Last.',
  rat_markt_kein: 'Zurzeit kein anderer Abnehmer mit positivem Preisabstand. Ein Einkauf wäre eine Wette auf spätere Nachfrage.',
  rat_markt_lager: 'Für deine Lagerware: {wer} zahlt etwa {preis} Mark/Last netto. Nachfrage: {qty} Last. Das ist ein Erlös, kein berechneter Lagergewinn.',
  rat_markt_auftrag: 'Lieferaufträge müssen vollständig erfüllt werden.',
  rat_buyer: 'Weiterverkauf an', rat_source: 'Einkauf bei', rat_zahlt: 'zahlt {money} Mark/Last', rat_verlangt: 'verlangt {money} Mark/Last', rat_gewinn: 'Gewinn', rat_verlust: 'Verlust',
  rat_no_buyer: 'Zurzeit kein anderer Abnehmer verfügbar.', rat_no_source: 'Zurzeit keine andere Bezugsquelle verfügbar.',
  rat_preisrhythmus: 'Marktpreise ändern sich durch Handel und beim Tageswechsel. Besucherpreise bleiben während des Besuchs fest. Bei Tempo 1 dauert ein Spieltag 20 Minuten; „Nächster Tag“ überspringt die Wartezeit.',
});
Object.assign(HK.I18N.en, {
  lehrgang: 'First steps', lehrgangSchritt: 'Step {n} of {m}', lehrgangZeig: 'Show me where', lehrgangAus: 'Hide', lehrgangEin: 'Show first steps',
  lehrgangNeu: 'Restart the tutorial', lehrgangLohn: 'Reward: {lohn}', lehrgangErledigt: 'First steps: “{schritt}” done. {lohn}', lehrgangFertig: 'Introductory mission complete: all nine steps are done.',
  lehrgangFertigKurz: 'All steps done.',
  lg_zeit_titel: 'Let time run', lg_zeit_text: 'The game starts paused. Press <b>Space</b> or ▶ below the map. <b>1</b>, <b>2</b>, <b>3</b> set the speed, <b>N</b> advances one day.',
  lg_hafen_titel: 'Visit the harbour', lg_hafen_text: 'Click a ship at the quay or “Show me where”. Its goods cards show <b>offers</b>, <b>wanted goods</b> and prices after duty. Larger purchases can earn a discount; notices about other buyers show which goods might disappear tomorrow.',
  lg_verkauf_titel: 'Sell your first goods', lg_verkauf_text: 'Sell warehouse goods to a visitor or at the market. Completing a paid goods delivery also counts. You do not need to keep any particular starting goods. If your warehouse is empty, buy new goods and resell them.',
  lg_zwischen_titel: 'Make a delivery promise', lg_zwischen_text: 'Accept a delivery contract under <b>Orders & missions</b>. Check revenue, deadline and penalty. Then use <b>Planning</b> to compare immediate purchases with prepaid supplies.',
  lg_geruecht_titel: 'Hear a rumour', lg_geruecht_text: 'In the tavern a few marks tell you which ships are coming. Whoever knows what will be wanted buys ahead.',
  lg_markt_titel: 'Sell at the market', lg_markt_text: 'Townsfolk only pay well where goods are <b>scarce</b> (red badge). Sell something there — but no more than they take today.',
  lg_auftrag_titel: 'Fulfil a promise', lg_auftrag_text: 'Deliver an accepted contract <b>before its deadline</b>. <b>Orders & missions</b> shows progress and takes you to the recipient on the map to hand over the goods. Use <b>Planning</b> to source missing goods. A cheap but delayed supply does not move the deadline.',
  lg_ausbau_titel: 'Your first own business', lg_ausbau_text: 'Commission a <b>market stall</b> (two days to build) or a <b>ship</b> at the shipyard. This step completes when construction finishes. A stall increases market capacity; a trading ship still needs crew and provisions before its first voyage.',
  lg_weg_titel: 'Choose a path', lg_weg_text: 'Six paths lead to a title: trade, council, shipping, church, guilds or underworld. The <b>overview</b> lists their conditions — pick one.',
  rat_spalte: 'Best counterpart', rat_keiner: 'nobody', rat_lager: 'from stock', rat_lohnt: 'profitable', rat_kurz_ab: 'takes: {wer} {preis}', rat_kurz_von: 'has: {wer} {preis}',
  rat_hinweis: 'Green: estimated resale spread per last, after duty and fees. Quantity pricing and limited demand can change the total profit.',
  rat_marge: '{money} marks/last', rat_markt_titel: 'Trade comparison', rat_markt_kauf: 'After buying here: {wer} pays about {preis} marks/last net. Demand: {qty} last.',
  rat_markt_kein: 'No other buyer currently offers a positive price spread. Buying would be a bet on future demand.',
  rat_markt_lager: 'For your stock: {wer} pays about {preis} marks/last net. Demand: {qty} last. This is revenue, not a calculated inventory profit.',
  rat_markt_auftrag: 'Delivery contracts must be fulfilled in full.',
  rat_buyer: 'Resell to', rat_source: 'Buy from', rat_zahlt: 'pays {money} marks/last', rat_verlangt: 'asks {money} marks/last', rat_gewinn: 'profit', rat_verlust: 'loss',
  rat_no_buyer: 'No other buyer is currently available.', rat_no_source: 'No other source is currently available.',
  rat_preisrhythmus: 'Market prices change with trades and each new day. Visitor prices stay fixed during a visit. At speed 1 a game day takes 20 minutes; “Next day” skips the wait.',
});

// Compact contextual explanations; values needed for a decision stay in the main view.
Object.assign(HK.I18N.de, {
  introMission: 'Einführungsmission', introProgress: '{n} von {m} Schritten erledigt', introNext: 'Nächster Schritt', introOpen: 'Einführung öffnen', introStartTime: 'Zeit mit Tempo 1 starten',
  contextHelp: 'Hilfe', contextHelpFor: 'Hilfe zu: {topic}', marketFeeCompact: 'Marktgebühr: {fee} %', priceUnitCompact: 'Preise in Mark je Last',
  marketHelp: 'Wähle eine Ware und die Handelsmenge. Einkauf füllt dein Lager; Verkauf ist durch die heutige Abnahme begrenzt. Marktpreise reagieren auf Geschäfte und den Tageswechsel. Tempo 1: 20 Minuten pro Tag.',
  tradeComparisonHelp: 'Grün zeigt die geschätzte Handelsspanne je Last nach Zoll und Gebühren. Mengenpreise und begrenzte Nachfrage beeinflussen den Gesamtgewinn. Lieferaufträge verlangen die volle Menge. Besucherpreise bleiben während ihres Besuchs fest.',
  tradeAdvanceHelp: 'Du zahlst die ausgewählte Menge samt Zoll sofort und reservierst Lagerplatz. Bei Ankunft kommt die Ware automatisch ins Lager. Verzögerungen ändern deine Auftragsfrist nicht. Die angezeigte Rückerstattung erfolgt, wenn die Lieferung bis dahin ausbleibt.',
  cityLifeHelp: 'Stimmung beeinflusst Handel und Stadtleben. Warenqualität reicht von 50 bis 120 und verändert Preise sowie die Eignung für Aufträge. Ereignisse können beides verändern; konkrete Folgen stehen bei der jeweiligen Nachricht.',
});
Object.assign(HK.I18N.en, {
  introMission: 'Introductory mission', introProgress: '{n} of {m} steps completed', introNext: 'Next step', introOpen: 'Open introduction', introStartTime: 'Start time at speed 1',
  contextHelp: 'Help', contextHelpFor: 'Help with: {topic}', marketFeeCompact: 'Market fee: {fee} %', priceUnitCompact: 'Prices in marks per last',
  marketHelp: 'Choose a good and trade quantity. Buying fills your warehouse; sales are limited by today’s demand. Market prices respond to trades and each new day. Speed 1: 20 minutes per day.',
  tradeComparisonHelp: 'Green shows the estimated spread per last after duty and fees. Quantity prices and limited demand affect total profit. Delivery contracts require the full quantity. Visitor prices stay fixed during their visit.',
  tradeAdvanceHelp: 'Pay for the selected quantity and duty immediately, reserving warehouse space. Goods enter your warehouse automatically on arrival. Delays do not extend your contract deadline. If the shipment has not arrived by the displayed refund date, your payment is returned.',
  cityLifeHelp: 'Mood affects trade and town life. Goods quality ranges from 50 to 120, affecting prices and suitability for contracts. Events can change both; each message lists its actual effects.',
});
