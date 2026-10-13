/* Der Müller und die Bannmühle (8.2) und der Vorkauf der Ernte auf dem Halm (8.3). DOM-frei.
   Bannmühle: Die Bauern des Umlands müssen in der Windmühle mahlen lassen und zahlen Mahlgeld, ein
   Sechzehntel des Korns. Das Mahlgeld fließt an den Mühlenpächter (sonst an die Stadt) oder an den
   Spieler, wenn ihm die Mühle gehört. Der Müller bietet an, das Mehl zu strecken.
   Vorkauf: Im Frühjahr kauft der Kaufmann einem fremden Ackerhof die Ernte auf dem Halm ab und
   bekommt sie zur Ernte im August über den gewöhnlichen Lieferweg. */
'use strict';

Object.assign(HK.CONST, {
  MUEHLE_ANTEIL: 0.2,        // Anteil des städtischen Korns, den die Bauern des Umlands in der Bannmühle mahlen
  MUEHLE_METZE: 1 / 16,      // Mahlgeld: ein Sechzehntel des gemahlenen Korns
  MUEHLE_PACHT_TAGE: 365,
  MUEHLE_STRECKEN: 1.4,      // Gestrecktes Mehl bringt 40 % mehr Mahlgeld
  MUEHLE_AUFFLIEGEN: 0.02,
  MUEHLE_SPERRE: 60,
  MUEHLE_QUALITAET_MIN: 70,
  VORKAUF_GAENGE: 6, VORKAUF_RABATT: 0.65, VORKAUF_MONATE: [2, 3, 4], ERNTE_MONAT: 7,
});

HK.muehleInit = function (st) {
  st.muehle ||= { pacht: null, strecken: false, gesperrtBis: 0, angebot: 0, erholung: false, einnahmen: 0, aufgeflogen: 0 };
  const M = st.muehle;
  for (const [k, v] of Object.entries({ pacht: null, strecken: false, gesperrtBis: 0, angebot: 0, erholung: false, einnahmen: 0, aufgeflogen: 0 })) if (M[k] === undefined) M[k] = v;
  st.vorkauf ||= {};
  return M;
};
HK.newGameHooks.push(HK.muehleInit); HK.migrateHooks.push(HK.muehleInit);

/* ---------- Bannmühle ---------- */
HK.yearOf = function (day) {
  const c = HK.CONST, base = new Date(Date.UTC(2000, c.START_MONTH, c.START_DAY));
  base.setUTCDate(base.getUTCDate() + day);
  return c.START_YEAR + (base.getUTCFullYear() - 2000);
};
HK.muehlePachtAktiv = st => !!(st.muehle?.pacht && st.muehle.pacht.until > st.day);
HK.muehleBesitz = st => !!st.rural?.sites?.windmill?.owner;
HK.muehleEmpfaenger = st => HK.muehleBesitz(st) ? 'owner' : HK.muehlePachtAktiv(st) ? 'lease' : 'town';
/* Grundwert ohne Strecken: Getreideverbrauch der Stadt wie im Tagestick, davon der Bannanteil, ein Sechzehntel, zu Mehlpreis */
HK.mahlgeldBasis = function (st) {
  const C = HK.CONST, korn = HK.GOOD.grain.cons * (st.town.pop / 6000) * HK.consMod(st, 'grain') * C.MUEHLE_ANTEIL;
  return korn * C.MUEHLE_METZE * HK.GOOD.flour.base * HK.prosperityMod(st);
};
HK.mahlgeld = st => Math.round(HK.mahlgeldBasis(st) * (st.muehle?.strecken ? HK.CONST.MUEHLE_STRECKEN : 1));
HK.muehlePachtPreis = st => Math.round(300 * HK.mahlgeldBasis(st) * (0.8 + st.town.prosperity / 200));
HK.muehlePachten = function (st) {
  const M = HK.muehleInit(st);
  if (st.gameOver || HK.muehlePachtAktiv(st)) return { ok: false };
  if (HK.muehleBesitz(st)) return { ok: false, msg: 'muehleSchonBesitz' };
  const preis = HK.muehlePachtPreis(st); if (st.money < preis) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'politics', -preis); M.pacht = { until: st.day + HK.CONST.MUEHLE_PACHT_TAGE, since: st.day, price: preis };
  HK.log(st, 'muehlePachtErworben', { days: HK.CONST.MUEHLE_PACHT_TAGE, datum: HK.fmtDate(M.pacht.until) }, 'good');
  HK.scheduleSave?.(); return { ok: true, cost: preis };
};
/* Kauft der Pächter die Mühle, erstattet die Stadt die Restpacht anteilig */
HK.wrapAction('buyRural', (st, r, id) => {
  if (id !== 'windmill' || !HK.muehlePachtAktiv(st)) return;
  const P = st.muehle.pacht, rest = P.until - st.day, geld = Math.round((P.price || 0) * rest / HK.CONST.MUEHLE_PACHT_TAGE);
  st.muehle.pacht = null;
  if (geld > 0) HK.book(st, 'politics', geld);
  HK.log(st, 'muehlePachtErstattet', { tage: rest, geld: HK.fmt(geld) }, 'info');
});
HK.muehleStreckbar = st => HK.muehleEmpfaenger(st) !== 'town' && !(st.muehle.gesperrtBis > st.day);
HK.muehleStrecken = function (st, an) {
  const M = HK.muehleInit(st); an = !!an;
  if (st.gameOver || (an && !HK.muehleStreckbar(st)) || M.strecken === an) return { ok: false, msg: an && M.gesperrtBis > st.day ? 'muehleGesperrt' : undefined };
  M.strecken = an; if (an) M.erholung = true;
  HK.log(st, an ? 'muehleStreckenAnLog' : 'muehleStreckenAusLog', {}, an ? 'bad' : 'info');
  HK.scheduleSave?.(); return { ok: true };
};
HK.muehleAuffliegen = function (st) {
  const M = st.muehle;
  M.strecken = false; M.gesperrtBis = st.day + HK.CONST.MUEHLE_SPERRE; M.aufgeflogen++;
  st.suspicion = HK.clamp(st.suspicion + 8, 0, 100); st.rep = HK.clamp(st.rep - 3, 0, 100);
  for (const h of Object.values(st.burghers || {})) h.mood = HK.clamp(h.mood - 10, 0, 100);
  HK.fac(st, 'zuenfte', -6);
  HK.log(st, 'muehleAufgeflogen', { tage: HK.CONST.MUEHLE_SPERRE }, 'bad');
};
HK.muehleTag = function (st) {
  const M = HK.muehleInit(st);
  if (M.pacht && M.pacht.until <= st.day) {
    M.pacht = null; HK.log(st, 'muehlePachtEnde', {}, 'info');
  }
  const wer = HK.muehleEmpfaenger(st);
  if (wer === 'town' && M.strecken) M.strecken = false;
  // Beim ersten Tag als Pächter oder Besitzer schreibt der Müller seinen Brief
  if (wer !== 'town' && !M.angebot && !(M.gesperrtBis > st.day)) { M.angebot = st.day; HK.postInit?.(st); HK.postAdd?.(st, 'mill:offer', 'millerOffer', 'miller'); }
  if (M.strecken && Math.random() < HK.CONST.MUEHLE_AUFFLIEGEN) HK.muehleAuffliegen(st);
  if (wer !== 'town') { const geld = HK.mahlgeld(st); if (geld > 0) { HK.book(st, 'millage', geld); M.einnahmen += geld; } }
  // Gestrecktes Mehl verdirbt die Güte am Markt; danach erholt sie sich langsam
  const Q = st.town.quality; if (!Q) return;
  const q = Q.flour ?? 100, min = HK.CONST.MUEHLE_QUALITAET_MIN;
  if (M.strecken) { if (q > min) Q.flour = Math.max(min, q - 5); }
  else if (M.erholung) { if (q < 100) Q.flour = Math.min(100, q + 2); if ((Q.flour ?? 100) >= 100) M.erholung = false; }
};
HK.tickHooks.push(st => HK.muehleTag(st));

/* Brief des Müllers: annehmen schaltet das Strecken ein, ablehnen lässt alles beim Alten */
{
  const actions = HK.postActions;
  HK.postActions = function (st, m) {
    if (m.type !== 'millerOffer') return actions(st, m);
    if (st.gameOver || m.replies.length || st.muehle.strecken || !HK.muehleStreckbar(st)) return [];
    return [{ id: 'millStretch', label: 'muehleBriefJa' }, { id: 'millHonest', label: 'muehleBriefNein' }];
  };
  const reply = HK.postReply;
  HK.postReply = function (st, id, action) {
    const m = st.post.messages.find(m => m.id === id);
    if (!m || m.type !== 'millerOffer') return reply(st, id, action);
    const a = HK.postActions(st, m).find(a => a.id === action); if (!a) return { ok: false, msg: 'postGone' };
    const r = action === 'millStretch' ? HK.muehleStrecken(st, true) : { ok: true };
    if (!r.ok) return r;
    m.read = true; m.replies.push({ day: st.day, action, label: a.label, vars: {}, cost: 0 });
    HK.log(st, 'postReplied', { sender: HK.postSenderName(st, m.sender), choice: HK.t(a.label) }, 'info');
    HK.postAdd(st, 'reply:' + m.id, 'answer', m.sender, { message: m.id }, { action: a.label });
    HK.scheduleSave?.(); return r;
  };
}

/* ---------- Vorkauf der Ernte auf dem Halm ---------- */
HK.vorkaufFruehjahr = st => HK.CONST.VORKAUF_MONATE.includes(HK.monthOf(st.day));
HK.vorkaufAngebot = function (st, id) {
  const s = st.rural?.sites?.[id], d = HK.RURAL_SITES[id];
  if (!s || !d?.crops) return null;
  const good = s.crop, qty = HK.CONST.VORKAUF_GAENGE * HK.ruralCropYield(good);
  const price = Math.round(qty * HK.GOOD[good].base * HK.CONST.VORKAUF_RABATT);
  const jahr = HK.yearOf(st.day), done = st.vorkauf?.[jahr]?.[id];
  let msg = null;
  if (s.owner) msg = 'vorkaufEigenerHof';
  else if (done) msg = 'vorkaufSchonGekauft';
  else if (!HK.vorkaufFruehjahr(st)) msg = 'vorkaufNurFruehjahr';
  else if (st.town.events.some(e => e.type === 'famine')) msg = 'vorkaufHungersnot';
  else if (st.money < price) msg = 'notEnoughMoney';
  return { ok: !msg && !st.gameOver, msg, site: id, good, qty, price, jahr, market: HK.marketSellPrice(st, good, qty) };
};
HK.vorkaufen = function (st, id) {
  HK.muehleInit(st);
  const a = HK.vorkaufAngebot(st, id); if (!a) return { ok: false }; if (!a.ok) return { ok: false, msg: a.msg };
  HK.book(st, 'market', -a.price);
  (st.vorkauf[a.jahr] ||= {})[id] = { qty: a.qty, good: a.good, price: a.price, day: st.day, famine: false };
  HK.log(st, 'vorkaufAbgeschlossen', { qty: a.qty, good: HK.goodName(a.good), site: HK.name(HK.RURAL_BUILDINGS[id]), price: HK.fmt(a.price) }, 'info');
  HK.scheduleSave?.(); return { ok: true, cost: a.price };
};
/* Bis zur Ernte ist der Vorkauf eine Forderung in Höhe des Kaufpreises */
HK.vorkaufOffen = st => Object.values(st.vorkauf || {}).reduce((n, jahr) => n + Object.values(jahr).reduce((m, v) => m + (v.done ? 0 : v.price), 0), 0);
{ const worth = HK.netWorth; HK.netWorth = st => Math.round(worth(st) + HK.vorkaufOffen(st)); }
/* Ausgang der Ernte: Hungersnot seit dem Vorkauf oder Missernte halbieren, eine gute Ernte bringt ein Fünftel mehr */
HK.vorkaufErnte = function (st, v) {
  if (v.famine) return { faktor: 0.5, art: 'famine' };
  const r = Math.random();
  if (r < 0.15) return { faktor: 0.5, art: 'bad' };
  if (r < 0.25) return { faktor: 1.2, art: 'good' };
  return { faktor: 1, art: 'normal' };
};
HK.vorkaufTag = function (st) {
  HK.muehleInit(st);
  const jahr = HK.yearOf(st.day), offen = st.vorkauf[jahr];
  for (const y of Object.keys(st.vorkauf)) if (+y < jahr - 1) delete st.vorkauf[y];
  if (!offen) return;
  const famine = st.town.events.some(e => e.type === 'famine');
  for (const v of Object.values(offen)) if (famine && !v.done) v.famine = true;
  if (HK.monthOf(st.day) !== HK.CONST.ERNTE_MONAT || HK.monthOf(st.day - 1) === HK.CONST.ERNTE_MONAT) return;
  HK.ruralInit(st);
  for (const [id, v] of Object.entries(offen)) {
    if (v.done) continue;
    const e = HK.vorkaufErnte(st, v), menge = Math.round(v.qty * e.faktor), platz = Math.max(0, Math.floor(HK.whFree(st))), qty = Math.min(menge, platz);
    v.done = st.day; v.outcome = e.art; v.delivered = qty; v.lost = menge - qty;
    const site = HK.name(HK.RURAL_BUILDINGS[id]), good = HK.goodName(v.good);
    HK.log(st, 'vorkaufErnte_' + e.art, { qty: menge, good, site }, e.art === 'good' ? 'good' : e.art === 'normal' ? 'info' : 'bad');
    if (qty > 0) {
      const cost = Math.round(v.price * qty / Math.max(1, menge));
      st.rural.deliveries.push({ ok: true, site: id, good: v.good, qty, quality: 100, unit: Math.round(cost / qty), goods: cost, freight: 0, cost, ownSource: false, value: cost, eta: st.day + 1, id: st.rural.nextId++, status: 'waiting', ordered: st.day, latest: st.day + 9, vorkauf: true, jahr: jahr });
    }
    if (v.lost > 0) HK.log(st, 'vorkaufVerfallen', { qty: v.lost, good }, 'bad');
  }
};
HK.tickHooks.push(st => HK.vorkaufTag(st));

Object.assign(HK.I18N.de, {
  src_millage: 'Mahlgeld',
  muehleTitel: 'Bannmühle und Mahlgeld',
  muehleHelp: '<p><b>Bannmühle:</b> Die Bauern des Umlands müssen ihr Korn in der Windmühle mahlen lassen. Als Mahlgeld behält die Mühle ein Sechzehntel des Korns. Gerechnet wird mit etwa einem Fünftel des Getreides, das die Stadt täglich verbraucht, bewertet zum Mehlpreis. Mehr Einwohner, mehr Wohlstand und Hungerzeiten erhöhen das Mahlgeld.</p><p><b>Mühlenpacht:</b> Gewöhnlich nimmt die Stadt das Mahlgeld ein. Im Rathaus kannst du die Mühle ein Jahr lang pachten; der Preis richtet sich nach dem Mahlgeld und dem Wohlstand. Gehört dir die Windmühle, bekommst du das Mahlgeld ohne Pacht.</p><p><b>Der Müller:</b> Pächter und Besitzer bekommen ein Angebot des Müllers: Mehl mit Kreide und Kleie strecken. Das bringt 40 % mehr Mahlgeld, verschlechtert aber das Mehl am Markt. Jeden Tag kann es mit 2 % Wahrscheinlichkeit auffliegen: Verdacht +8, Ruf −3, die Zünfte und alle Haushalte sind verärgert, und für 60 Tage gibt es kein neues Angebot.</p>',
  muehleEmpfaenger_town: 'Das Mahlgeld nimmt zurzeit die Stadt ein.',
  muehleEmpfaenger_lease: 'Du hältst die Mühlenpacht bis {datum}. Das Mahlgeld gehört dir.',
  muehleEmpfaenger_owner: 'Die Mühle gehört dir. Das Mahlgeld fließt ohne Pacht in deine Kasse.',
  muehleMahlgeldHeute: 'Mahlgeld derzeit: {geld} Mark am Tag',
  muehlePachtText: 'Die Stadt verpachtet ihr Mahlgeld aus der Bannmühle für ein Jahr, derzeit etwa {geld} Mark am Tag.',
  muehlePachtButton: 'Mühlenpacht erwerben ({cost} Mark)',
  muehlePachtHinweis: 'Pachten kannst du im Rathaus.',
  muehleZumRathaus: 'Zur Mühlenpacht im Rathaus',
  muehleSchonBesitz: 'Die Mühle gehört dir bereits; du brauchst keine Pacht.',
  muehlePachtErstattet: 'Die Mühle gehört jetzt dir. Die Stadt erstattet die Mühlenpacht für die restlichen {tage} Tage: {geld} Mark.',
  muehleStreckenVergleich: 'Ehrlich: {ehrlich} Mark am Tag · gestreckt: {gestreckt} Mark am Tag. Fliegt es auf: Verdacht +8, Stimmung der Bürger, Zünfte, Ruf; 60 Tage gesperrt.',
  muehlePachtJahr: 'Bei heutigem Betrieb bringt die Pacht rund {jahr} Mark im Jahr.',
  muehleKaufHinweis: 'Die Windmühle lässt sich auch als Betrieb im Umland kaufen, für {cost} Mark; dann gehört dir das Mahlgeld ohne Pacht.',
  vorkaufHungersnot: 'In der Hungersnot verkaufen die Bauern nichts auf den Halm.',
  vorkaufUnterwegs: 'Geerntet: {qty} Last sind unterwegs ins Lagerhaus.',
  muehlePachtErworben: 'Du hast die Mühlenpacht für {days} Tage erworben, bis {datum}.',
  muehlePachtEnde: 'Deine Mühlenpacht ist abgelaufen; das Mahlgeld fällt an die Stadt zurück.',
  muehleMueller: 'Der Müller',
  muehleMuellerText: '„Ein wenig Kreide und Kleie unters Mehl, Herr, das merkt keiner. Ihr nehmt ein gutes Stück mehr ein.“',
  muehleStreckenAktiv: 'Das Mehl wird gestreckt: +40 % Mahlgeld, schlechteres Mehl am Markt, täglich 2 % Gefahr aufzufliegen.',
  muehleStreckenAn: 'Mehl strecken lassen',
  muehleStreckenAus: 'Ehrlich mahlen lassen',
  muehleGesperrt: 'Nach dem Skandal wagt der Müller es frühestens am {datum} wieder.',
  muehleKeinZugriff: 'Erst als Pächter oder Besitzer der Mühle hast du beim Müller etwas zu sagen.',
  muehleMehlGuete: 'Mehl am Markt: Güte {quality}',
  muehleAufgeflogen: 'Der Betrug des Müllers ist aufgeflogen: Kreide im Mehl! Die Bürger sind empört, die Zünfte zürnen, und der Vogt sieht genauer hin. {tage} Tage lang lässt der Müller die Finger davon.',
  muehleStreckenAnLog: 'Der Müller streckt jetzt das Mehl mit Kreide und Kleie.', muehleStreckenAusLog: 'Der Müller mahlt wieder ehrlich.',
  postSender_miller: 'Der Müller der Windmühle',
  postSubject_millerOffer: 'Ein Vorschlag aus der Mühle',
  postBody_millerOffer: 'Herr, nun mahlt Ihr mit mir. Ein alter Müllerbrauch: etwas Kreide und Kleie unter das Mehl, und das Mahlgeld steigt um vier Zehntel. Die Bauern merken es selten. Doch wenn es herauskommt, gibt es Ärger mit Vogt, Zünften und Bürgern. Wie haltet Ihr es?',
  muehleBriefJa: 'Strecken lassen (+40 % Mahlgeld, Risiko)',
  muehleBriefNein: 'Ehrlich mahlen',
  vorkaufTitel: 'Ernte auf dem Halm kaufen',
  vorkaufHelp: '<p><b>Vorkauf:</b> Im Frühjahr (März bis Mai) kannst du einem fremden Ackerhof die Ernte auf dem Halm abkaufen: so viel wie sechs Arbeitsgänge der jetzigen Frucht, zu 65 % des Grundpreises. Du zahlst sofort. Je Hof und Jahr ist ein Vorkauf möglich. In einer Hungersnot verkaufen die Bauern nichts auf den Halm.</p><p><b>Ernte:</b> Am 1. August wird geerntet und am Tag darauf über den gewöhnlichen Lieferweg ins Lagerhaus gebracht. Normal kommt die volle Menge. Herrscht seit dem Vorkauf eine Hungersnot oder gibt es eine Missernte (15 %), kommt nur die Hälfte; eine gute Ernte (10 %) bringt ein Fünftel mehr.</p><p><b>Lagerplatz:</b> Geliefert wird, was zur Ernte ins Lager passt. Der Rest verfällt.</p>',
  vorkaufAngebotText: '{qty} Last {good}, geerntet am 1. August und am Tag darauf im Lagerhaus · Preis {price} Mark sofort ({unit} Mark je Last)',
  vorkaufMarkt: 'Verkauf am Markt heute etwa {market} Mark je Last · Vorkauf {unit} Mark je Last',
  vorkaufRisiko: 'Risiko: Hungersnot oder Missernte halbieren die Menge, eine gute Ernte bringt mehr. Was nicht ins Lager passt, verfällt.',
  vorkaufButton: 'Ernte vorkaufen ({price} Mark)',
  vorkaufGekauft: 'Vorgekauft: {qty} Last {good} für {price} Mark. Am 1. August wird geerntet und am Tag darauf ins Lagerhaus gebracht.',
  vorkaufGeliefert: 'Ernte dieses Jahres: {qty} Last geliefert.',
  vorkaufEigenerHof: 'Den eigenen Hof kannst du nicht vorkaufen.',
  vorkaufSchonGekauft: 'Die Ernte dieses Hofes ist in diesem Jahr schon verkauft.',
  vorkaufNurFruehjahr: 'Die Ernte auf dem Halm wird nur im Frühjahr (März bis Mai) verkauft.',
  vorkaufAbgeschlossen: 'Vorkauf: {qty} Last {good} von {site} für {price} Mark. Am 1. August wird geerntet und am Tag darauf ins Lagerhaus gebracht.',
  vorkaufErnte_normal: 'Ernte, {site}: {qty} Last {good} wie vereinbart. Die Lieferung ist unterwegs.',
  vorkaufErnte_good: 'Gute Ernte, {site}: {qty} Last {good} statt der vereinbarten Menge. Die Lieferung ist unterwegs.',
  vorkaufErnte_bad: 'Missernte, {site}: Nur {qty} Last {good} sind zu holen.',
  vorkaufErnte_famine: 'Hungersnot, {site}: Die Felder geben nur {qty} Last {good} her.',
  vorkaufVerfallen: 'Im Lager war kein Platz: {qty} Last {good} aus dem Vorkauf sind verfallen.',
});
Object.assign(HK.I18N.en, {
  src_millage: 'Mill dues',
  muehleTitel: 'Ban mill and mill dues',
  muehleHelp: '<p><b>Ban mill:</b> The farmers of the countryside must have their grain ground at the windmill. As mill dues the mill keeps one sixteenth of the grain. The reckoning uses about a fifth of the grain the town eats each day, valued at the flour price. More inhabitants, more prosperity and times of hunger raise the dues.</p><p><b>Mill lease:</b> Normally the town collects the dues. At the town hall you can lease the mill for a year; the price follows the dues and prosperity. If you own the windmill, the dues are yours without a lease.</p><p><b>The miller:</b> Leaseholders and owners receive the miller’s offer: stretch the flour with chalk and bran. That brings 40 % more dues but worsens the flour on the market. Each day there is a 2 % chance it comes out: suspicion +8, reputation −3, the guilds and every household are angered, and there is no new offer for 60 days.</p>',
  muehleEmpfaenger_town: 'The town currently collects the mill dues.',
  muehleEmpfaenger_lease: 'You hold the mill lease until {datum}. The dues are yours.',
  muehleEmpfaenger_owner: 'You own the mill. The dues go to your treasury without a lease.',
  muehleMahlgeldHeute: 'Mill dues currently: {geld} marks a day',
  muehlePachtText: 'The town leases its dues from the ban mill for one year, currently about {geld} marks a day.',
  muehlePachtButton: 'Lease the mill ({cost} marks)',
  muehlePachtHinweis: 'You can lease it at the town hall.',
  muehleZumRathaus: 'Mill lease at the town hall',
  muehleSchonBesitz: 'You already own the mill; no lease is needed.',
  muehlePachtErstattet: 'The mill is now yours. The town refunds the mill lease for the remaining {tage} days: {geld} marks.',
  muehleStreckenVergleich: 'Honest: {ehrlich} marks a day · stretched: {gestreckt} marks a day. If discovered: suspicion +8, townsfolk mood, guilds, reputation; barred for 60 days.',
  muehlePachtJahr: 'At today’s trade the lease brings about {jahr} marks a year.',
  muehleKaufHinweis: 'The windmill can also be bought as a business in the countryside, for {cost} marks; then the dues are yours without a lease.',
  vorkaufHungersnot: 'During a famine the farmers sell nothing in the field.',
  vorkaufUnterwegs: 'Harvested: {qty} last are on their way to the warehouse.',
  muehlePachtErworben: 'You leased the mill for {days} days, until {datum}.',
  muehlePachtEnde: 'Your mill lease has expired; the dues revert to the town.',
  muehleMueller: 'The miller',
  muehleMuellerText: '“A little chalk and bran in the flour, sir, nobody notices. You would take a good deal more.”',
  muehleStreckenAktiv: 'The flour is being stretched: +40 % dues, poorer flour on the market, a 2 % daily risk of discovery.',
  muehleStreckenAn: 'Have the flour stretched',
  muehleStreckenAus: 'Grind honestly',
  muehleGesperrt: 'After the scandal the miller will not try again before {datum}.',
  muehleKeinZugriff: 'Only as leaseholder or owner of the mill do you have a say with the miller.',
  muehleMehlGuete: 'Flour on the market: quality {quality}',
  muehleAufgeflogen: 'The miller’s fraud is out: chalk in the flour! The townsfolk are outraged, the guilds are angry and the bailiff looks closer. The miller will keep his hands off it for {tage} days.',
  muehleStreckenAnLog: 'The miller now stretches the flour with chalk and bran.', muehleStreckenAusLog: 'The miller grinds honestly again.',
  postSender_miller: 'The windmill’s miller',
  postSubject_millerOffer: 'A proposal from the mill',
  postBody_millerOffer: 'Sir, now you grind with me. An old miller’s custom: a little chalk and bran in the flour, and the dues rise by four tenths. The farmers rarely notice. But if it comes out, there will be trouble with the bailiff, the guilds and the townsfolk. What is your wish?',
  muehleBriefJa: 'Stretch the flour (+40 % dues, risky)',
  muehleBriefNein: 'Grind honestly',
  vorkaufTitel: 'Buy the crop in the field',
  vorkaufHelp: '<p><b>Forward purchase:</b> In spring (March to May) you can buy the standing crop of another farm: as much as six batches of its current crop, at 65 % of the base price. You pay at once. One purchase per farm and year. During a famine the farmers sell nothing in the field.</p><p><b>Harvest:</b> The crop is harvested on 1 August and brought to your warehouse the following day by the usual delivery route. Normally the full amount arrives. If a famine has struck since the purchase or the harvest fails (15 %), only half comes; a good harvest (10 %) brings a fifth more.</p><p><b>Storage:</b> What fits into the warehouse at harvest is delivered. The rest is lost.</p>',
  vorkaufAngebotText: '{qty} last of {good}, harvested on 1 August and in your warehouse the day after · price {price} marks now ({unit} marks per last)',
  vorkaufMarkt: 'Selling at the market today about {market} marks per last · forward purchase {unit} marks per last',
  vorkaufRisiko: 'Risk: famine or a failed harvest halves the amount, a good harvest brings more. Whatever does not fit in the warehouse is lost.',
  vorkaufButton: 'Buy the crop ({price} marks)',
  vorkaufGekauft: 'Bought in advance: {qty} last of {good} for {price} marks. It is harvested on 1 August and brought to your warehouse the day after.',
  vorkaufGeliefert: 'This year’s harvest: {qty} last delivered.',
  vorkaufEigenerHof: 'You cannot buy your own farm’s crop in advance.',
  vorkaufSchonGekauft: 'This farm’s crop has already been sold this year.',
  vorkaufNurFruehjahr: 'The standing crop is only sold in spring (March to May).',
  vorkaufAbgeschlossen: 'Forward purchase: {qty} last of {good} from {site} for {price} marks. It is harvested on 1 August and brought to your warehouse the day after.',
  vorkaufErnte_normal: 'Harvest at {site}: {qty} last of {good} as agreed. The delivery is on its way.',
  vorkaufErnte_good: 'Good harvest at {site}: {qty} last of {good} instead of the agreed amount. The delivery is on its way.',
  vorkaufErnte_bad: 'Failed harvest at {site}: only {qty} last of {good} to collect.',
  vorkaufErnte_famine: 'The famine has emptied the fields of {site}: only {qty} last of {good}.',
  vorkaufVerfallen: 'There was no room in the warehouse: {qty} last of {good} from the forward purchase are lost.',
});
