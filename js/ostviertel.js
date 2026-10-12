/* Das Ostviertel hinter der alten Ostmauer: ein eigenes Viertel für die Bürgerhäuser und das
   Schifferhaus mit der Schiffergesellschaft. Wer ihr beitritt, versichert seine Ladungen auf See:
   ein kleiner Beitrag bei jeder Ausfahrt, dafür ersetzt die Gesellschaft, was Piraten und Stürme nehmen. */
'use strict';

/* ---------- Viertel ---------- */
HK.BURGHER_QUARTERS.ostviertel = 0.95;
{
  const alt = HK.burgherQuarter;
  HK.burgherQuarter = b => b.x >= 28.5 && b.y < 16 ? 'ostviertel' : alt(b);
}
/* Spielstände von vor dem Ausbau kennen die neuen Häuser nicht: sie bekommen jetzt ihre Familien */
HK.migrateHooks.push(st => {
  if (!st.burghers) return;
  const vergeben = new Set(Object.values(st.burghers).map(h => h.family));
  const frei = HK.BURGHER_FAMILIES.filter(f => !vergeben.has(f));
  for (const b of HK.BURGHER_HOUSES) {
    if (st.burghers[b.id]) continue;
    const family = frei.length ? frei.splice(Math.floor(Math.random() * frei.length), 1)[0] : HK.pick(HK.BURGHER_FAMILIES);
    st.burghers[b.id] = { id: b.id, family, trade: HK.pick(HK.BURGHER_TRADES), standing: HK.rndi(0, 2), quarter: HK.burgherQuarter(b),
      owner: 'burgher', level: 1, damaged: false, vacantUntil: 0, mood: HK.rndi(45, 70), raisedUntil: 0, sale: null, since: st.day };
  }
});

/* ---------- Schiffergesellschaft ---------- */
Object.assign(HK.CONST, { SCHIFFER_BEITRITT: 1500, SCHIFFER_JAHR: 600, SCHIFFER_PRAEMIE: 0.04, SCHIFFER_ERSATZ: 0.8 });
HK.newGameHooks.push(st => { st.schiffer = { mitglied: false, faellig: 0, praemien: 0, ersatz: 0, faelle: 0 }; });
HK.migrateHooks.push(st => { if (!st.schiffer) st.schiffer = { mitglied: false, faellig: 0, praemien: 0, ersatz: 0, faelle: 0 }; });

HK.schifferBeitreten = function (st) {
  const S = st.schiffer; if (S.mitglied) return { ok: false };
  if (!st.ownShips.length) return { ok: false, msg: 'schifferOhneSchiff' };
  if (st.money < HK.CONST.SCHIFFER_BEITRITT) return { ok: false, msg: 'notEnoughMoney' };
  HK.book(st, 'investments', -HK.CONST.SCHIFFER_BEITRITT);
  S.mitglied = true; S.faellig = st.day + 365; HK.fac(st, 'kaufleute', 3); st.rep = HK.clamp(st.rep + 2, 0, 100);
  HK.log(st, 'schifferBeigetreten', {}, 'good');
  return { ok: true };
};
HK.schifferAustreten = function (st) { const S = st.schiffer; if (!S.mitglied) return { ok: false }; S.mitglied = false; HK.log(st, 'schifferAusgetreten', {}, 'info'); return { ok: true }; };
/* Jahresbeitrag; wer ihn nicht zahlen kann, fliegt hinaus */
HK.tickHooks.push(st => {
  const S = st.schiffer; if (!S || !S.mitglied || st.day < S.faellig) return;
  if (st.money >= HK.CONST.SCHIFFER_JAHR) { HK.book(st, 'wages', -HK.CONST.SCHIFFER_JAHR); S.faellig = st.day + 365; }
  else { S.mitglied = false; HK.log(st, 'schifferAusgeschlossen', {}, 'bad'); }
});
/* Bei jeder Ausfahrt die Prämie auf den Wert der Ladung — die Ladung ist dann versichert */
HK.wrapAction('sendShip', (st, r, id) => {
  const S = st.schiffer, s = st.ownShips.find(x => x.id === id); if (!S || !S.mitglied || !s) return;
  const praemie = Math.round(HK.stockValue(s.cargo) * HK.CONST.SCHIFFER_PRAEMIE);
  if (praemie > 0 && st.money >= praemie) { HK.book(st, 'wages', -praemie); S.praemien += praemie; s.versichert = true; }
  else s.versichert = praemie === 0;
});
/* Wird aus game.js gerufen, wenn auf See Ladung verloren geht */
HK.seeschaden = function (st, s, wert) {
  const S = st.schiffer; if (!S || !s.versichert || wert <= 0) return;
  const ersatz = Math.round(wert * HK.CONST.SCHIFFER_ERSATZ);
  HK.book(st, 'insurance', ersatz); S.ersatz += ersatz; S.faelle++;
  HK.log(st, 'schifferErsatz', { ship: s.name, ersatz: HK.fmt(ersatz) }, 'good');
};

Object.assign(HK.I18N.de, {
  quarter_ostviertel: 'Ostviertel', src_insurance: 'Versicherung',
  skippers: 'Schifferhaus', skippersHint: 'Die Schiffergesellschaft der Schiffer und Reeder von Sundhaven. Mitglieder versichern ihre Ladungen auf See.',
  schifferMitglied: 'Du bist Mitglied der Schiffergesellschaft. Nächster Jahresbeitrag ({beitrag} Mark) am {datum}.',
  schifferNicht: 'Du bist kein Mitglied.', schifferBeitreten: 'Beitreten ({kosten} Mark)', schifferAustreten: 'Austreten',
  schifferRegel: 'Bei jeder Ausfahrt zahlst du {praemie} % vom Wert der Ladung. Nehmen Piraten oder ein Sturm Ladung, ersetzt die Gesellschaft {ersatz} % davon. Jahresbeitrag {jahr} Mark.',
  schifferBilanz: 'Bisher gezahlt: {praemien} Mark Prämien · ersetzt: {ersatz} Mark in {faelle} Fällen.',
  schifferOhneSchiff: 'Die Schiffergesellschaft nimmt nur Reeder auf — du brauchst ein eigenes Schiff.',
  schifferBeigetreten: 'Du bist der Schiffergesellschaft beigetreten. Deine Ladungen auf See sind ab der nächsten Ausfahrt versichert.',
  schifferAusgetreten: 'Du bist aus der Schiffergesellschaft ausgetreten.', schifferAusgeschlossen: 'Die Schiffergesellschaft hat dich ausgeschlossen: Der Jahresbeitrag blieb unbezahlt.',
  schifferErsatz: 'Die Schiffergesellschaft ersetzt die verlorene Ladung der {ship}: {ersatz} Mark.',
  schifferVersichert: 'versichert', schifferSchiffe: 'Deine Schiffe',
});
Object.assign(HK.I18N.en, {
  quarter_ostviertel: 'East quarter', src_insurance: 'Insurance',
  skippers: "Skippers' hall", skippersHint: "The skippers' company of Sundhaven's shipmasters and shipowners. Members insure their cargoes at sea.",
  schifferMitglied: "You are a member of the skippers' company. Next annual fee ({beitrag} marks) on {datum}.",
  schifferNicht: 'You are not a member.', schifferBeitreten: 'Join ({kosten} marks)', schifferAustreten: 'Leave',
  schifferRegel: 'Every departure costs {praemie} % of the cargo value. If pirates or a storm take cargo, the company pays back {ersatz} % of it. Annual fee {jahr} marks.',
  schifferBilanz: 'Paid so far: {praemien} marks in premiums · reimbursed: {ersatz} marks in {faelle} cases.',
  schifferOhneSchiff: "The skippers' company only admits shipowners — you need a ship of your own.",
  schifferBeigetreten: "You joined the skippers' company. Your cargoes at sea are insured from the next departure.",
  schifferAusgetreten: "You left the skippers' company.", schifferAusgeschlossen: "The skippers' company expelled you: the annual fee went unpaid.",
  schifferErsatz: "The skippers' company reimburses the lost cargo of the {ship}: {ersatz} marks.",
  schifferVersichert: 'insured', schifferSchiffe: 'Your ships',
});
