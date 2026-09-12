/* Wege zum Titel, Spielende mit Chronik, Ansehen bei den Fraktionen.
   Hängt sich über Hooks und Funktionswrapper in game.js ein und bleibt DOM-frei. */
'use strict';

HK.FACTION_IDS = ['patrizier', 'kaufleute', 'zuenfte', 'kirche'];
HK.fac = function (st, f, d) { if (!st.factions || !f) return; st.factions[f] = HK.clamp(st.factions[f] + d, 0, 100); };
HK.facAll = function (st, d) { for (const f of HK.FACTION_IDS) HK.fac(st, f, d); };
HK.facAvg = st => st.factions ? HK.FACTION_IDS.reduce((a, f) => a + st.factions[f], 0) / 4 : st.rep;

/* ---------- Titel: sechs Wege ---------- */
HK.TITLES = [
  { id: 'merchant', name: { de: 'Handelsfürst', en: 'Merchant prince' }, conds: st => [
    ['cond_worth', HK.netWorth(st), 500000], ['cond_volume', st.stats.volume, 600000], ['cond_monopoly', HK.law(st, 'monopoly') !== 'none' && st.town.monopolyHolder === 'player' ? 1 : 0, 1], ['cond_storages', st.storages.filter(s => s.owner === 'player').length, 2]] },
  { id: 'mayor', name: { de: 'Bürgermeister auf Lebenszeit', en: 'Mayor for life' }, conds: st => [
    ['cond_mayorYears', st.seat === 'mayor' && st.mayorSince !== undefined ? Math.floor((st.day - st.mayorSince) / 365) : 0, 2], ['cond_loyalCouncil', HK.councillors().filter(c => st.persons[c.id].loyalty >= 70).length, 3], ['cond_staple', HK.law(st, 'staple') ? 1 : 0, 1], ['cond_factionsHigh', HK.FACTION_IDS.filter(f => st.factions[f] >= 60).length, 2]] },
  { id: 'shipowner', name: { de: 'Reeder der Hanse', en: 'Shipowner of the Hanse' }, conds: st => [
    ['cond_ships', st.ownShips.length, 3], ['cond_voyages', st.stats.voyages || 0, 20], ['cond_rigging', (HK.hasVenture(st, 'ropewalk') ? 1 : 0) + (HK.hasVenture(st, 'sailmaker') ? 1 : 0), 2], ['cond_expedition', st.stats.expeditionRevenue || 0, 150000]] },
  { id: 'patron', name: { de: 'Stifter von St. Nikolai', en: 'Patron of St Nicholas' }, conds: st => [
    ['cond_piety', Math.round(st.piety), 90], ['cond_churchProjects', HK.CHURCH_PROJECTS.filter(p => st.church.projects[p.id]).length, 3], ['cond_relic', st.relicDay !== undefined ? 1 : 0, 1], ['cond_hospital', st.hospitalEndowed ? 1 : 0, 1]] },
  { id: 'alderman', name: { de: 'Ältermann der Zünfte', en: 'Alderman of the guilds' }, conds: st => [
    ['cond_master', st.masterTitle ? 1 : 0, 1], ['cond_ventures', Object.keys(st.ventures).length, 7], ['cond_workshops', st.workshops.filter(w => w.type).length, 3], ['cond_guildRep', Math.round(st.factions.zuenfte), 70]] },
  { id: 'nightlord', name: { de: 'Herr der Nacht', en: 'Lord of the night' }, conds: st => [
    ['cond_smuggled', Math.round(st.stats.smuggled), 60000], ['cond_dive', HK.hasVenture(st, 'dive') ? 1 : 0, 1], ['cond_watch', st.stats.watchBribes || 0, 3], ['cond_bailiff', Math.round(st.persons.bailiff.loyalty), 60], ['cond_noTrial', (st.stats.trials || 0) === 0 ? 1 : 0, 1]] },
];
HK.TITLE = {}; HK.TITLES.forEach(t => HK.TITLE[t.id] = t);
HK.titleProgress = function (st, t) { return t.conds(st).map(([key, v, target]) => ({ key, v, target, done: v >= target })); };
HK.checkTitles = function (st) {
  for (const t of HK.TITLES) {
    if (st.titles[t.id]) continue;
    if (HK.titleProgress(st, t).every(c => c.done)) { st.titles[t.id] = st.day; st.rep = HK.clamp(st.rep + 10, 0, 100); st.influence += 10; HK.log(st, 'titleWon', { title: HK.name(t) }, 'good'); if (HK.onTitle) HK.onTitle(t); }
  }
};

/* ---------- Chronik ---------- */
HK.YEARS_OPTIONS = [10, 20, 30];
HK.chronicle = function (st) {
  const worth = HK.netWorth(st), years = Math.floor(st.day / 365);
  const rivals = st.rivals.map(r => ({ name: HK.RIVALS.find(x => x.id === r.id).name, wealth: r.wealth, beaten: r.wealth < worth }));
  const holdings = { houses: st.houses.filter(h => h.owner === 'player').length, workshops: st.workshops.filter(w => w.type).length, ventures: Object.keys(st.ventures).length, storages: st.storages.filter(s => s.owner === 'player').length, ships: st.ownShips.length };
  const titles = HK.TITLES.filter(t => st.titles[t.id]);
  // Nachruf aus Taten
  const lines = [];
  if (titles.length >= 3) lines.push('ep_manyTitles'); else if (titles.length) lines.push('ep_' + titles[0].id); else if (worth >= 100000) lines.push('ep_rich'); else lines.push('ep_modest');
  if (st.stats.smuggled > 30000 && st.piety < 50) lines.push('ep_shady'); else if (st.piety >= 70) lines.push('ep_pious'); else if (st.seat !== 'none') lines.push('ep_office'); else lines.push('ep_trader');
  if (rivals.every(r => r.beaten)) lines.push('ep_beatAll'); else if (rivals.some(r => r.beaten)) lines.push('ep_beatSome'); else lines.push('ep_beatNone');
  return { worth, years, rivals, holdings, titles, lines, rank: HK.RANKS[st.rank], seat: st.seat, pop: st.town.pop, prosperity: Math.round(st.town.prosperity), factions: Object.assign({}, st.factions), ended: st.day >= st.endDay };
};

/* ---------- Hooks ---------- */
HK.newGameHooks.push((st, opts) => {
  st.years = HK.YEARS_OPTIONS.includes(+opts.years) ? +opts.years : 20; st.endDay = st.years * 365; st.chronicleShown = false;
  st.factions = { patrizier: 25, kaufleute: 35, zuenfte: 30, kirche: 30 }; st.titles = {}; st.stats.voyages = 0; st.stats.watchBribes = 0; st.stats.trials = 0; st.stats.expeditionRevenue = 0;
});
HK.migrateHooks.push(st => {
  if (!st.years) { st.years = 20; st.endDay = 20 * 365; st.chronicleShown = false; }
  if (!st.factions) st.factions = { patrizier: HK.clamp(st.rep - 5, 0, 100), kaufleute: HK.clamp(st.rep + 5, 0, 100), zuenfte: st.rep, kirche: HK.clamp((st.rep + st.piety) / 2, 0, 100) };
  if (!st.titles) st.titles = {};
  for (const k of ['voyages', 'watchBribes', 'trials', 'expeditionRevenue']) if (st.stats[k] === undefined) st.stats[k] = 0;
});
/* Wirkung von Ereignissen aus der Chronik auf das Ansehen */
HK.LOG_FACTION_EFFECTS = { smuggleCaught: { patrizier: -3, kaufleute: -2, kirche: -3 }, investigationFine: { patrizier: -5, kaufleute: -3, zuenfte: -2, kirche: -4 }, trial: { patrizier: -12, kaufleute: -8, zuenfte: -5, kirche: -10 }, sabotageFailed: { patrizier: -4, kaufleute: -6, kirche: -3 }, levyIgnored: { patrizier: -6 }, loanRepaid: { kaufleute: 0.5 }, shipReturned: { kaufleute: 0.3 }, projectDone: { patrizier: 3, zuenfte: 2, kaufleute: 2, kirche: 2 }, bishopPleased: { kirche: 6 }, bishopDispleased: { kirche: -5 }, workshopBuilt: { zuenfte: 2 }, thugsCollected: { kaufleute: -2, kirche: -2 }, sabotageOk: { kaufleute: -3 } };
HK.tickHooks.push(st => {
  // Chronikeinträge des Tages auswerten
  for (const e of st.log) { if (e.day !== st.day) continue; const eff = HK.LOG_FACTION_EFFECTS[e.key]; if (eff) for (const f in eff) HK.fac(st, f, eff[f]); if (e.key === 'trial') st.stats.trials++; if (e.key === 'shipReturned' && e.vars && e.vars.revenue) st.stats.expeditionRevenue += parseInt(String(e.vars.revenue).replace(/\D/g, ''), 10) || 0; }
  // Drift: Fraktionen und Ruf ziehen sich langsam aneinander
  const avg = HK.facAvg(st);
  for (const f of HK.FACTION_IDS) st.factions[f] += (st.rep - st.factions[f]) * 0.002;
  st.rep = HK.clamp(st.rep + (avg - st.rep) * 0.004, 0, 100);
  if (HK.hasVenture(st, 'dive')) HK.fac(st, 'kirche', -0.02);
  if (HK.hasVenture(st, 'tannery')) HK.fac(st, 'patrizier', -0.01);
  if (st.militia) HK.fac(st, 'patrizier', 0.01);
  if (st.seat === 'mayor' && st.acceptBribes) HK.fac(st, 'kaufleute', -0.02);
  HK.checkTitles(st);
  // Spielende
  if (st.day >= st.endDay && !st.chronicleShown) { st.chronicleShown = true; HK.log(st, 'endReached', { years: st.years }, 'event'); if (HK.onChronicle) HK.onChronicle(); }
});

/* ---------- Wrapper: Handlungen wirken auf Fraktionen ---------- */
HK.wrapAction = function (name, after) { const orig = HK[name]; HK[name] = function (st, ...args) { const r = orig(st, ...args); if (r && r.ok) after(st, r, ...args); return r; }; };
HK.wrapAction('gift', (st, r, pid) => HK.fac(st, HK.factionOf(pid), HK.PERSON[pid].council ? 1.5 : 1));
HK.wrapAction('donate', (st, r, amount) => HK.fac(st, 'kirche', Math.min(3, amount / 300)));
HK.wrapAction('indulgence', st => HK.fac(st, 'kirche', 1));
HK.wrapAction('churchProject', st => { HK.fac(st, 'kirche', 6); HK.fac(st, 'patrizier', 2); });
HK.wrapAction('supplyChurch', st => HK.fac(st, 'kirche', 0.5));
HK.wrapAction('sermon', (st, r, kind) => { if (kind === 'favor') HK.fac(st, 'kirche', 2); else { HK.fac(st, 'kirche', -1); HK.fac(st, 'kaufleute', -2); } });
HK.wrapAction('donateRelic', st => HK.fac(st, 'kirche', 8));
HK.wrapAction('propose', (st, r, lawId, value) => { if (!r.passed) return; const law = HK.LAWS[lawId]; for (const f of HK.FACTION_IDS) HK.fac(st, f, law.stance[f][value] * 3); if (lawId === 'monopoly' && value !== 'none') { HK.fac(st, 'kaufleute', -8); HK.fac(st, 'zuenfte', -4); HK.fac(st, 'patrizier', 4); } });
HK.wrapAction('runForSeat', (st, r) => { if (r.won) { HK.fac(st, 'patrizier', 5); HK.fac(st, 'kaufleute', 2); } });
HK.wrapAction('fundProject', (st, r, id) => { HK.facAll(st, 4); if (id === 'well') HK.fac(st, 'zuenfte', 3); if (id === 'harbour') HK.fac(st, 'kaufleute', 4); });
HK.wrapAction('buyTaxFarm', st => { HK.fac(st, 'kaufleute', -6); HK.fac(st, 'patrizier', 3); });
HK.wrapAction('buyWeighFarm', st => { HK.fac(st, 'kaufleute', -4); HK.fac(st, 'zuenfte', -3); HK.fac(st, 'patrizier', 2); });
HK.wrapAction('joinGuild', st => HK.fac(st, 'kaufleute', 6));
HK.wrapAction('joinCraftGuild', st => HK.fac(st, 'zuenfte', 6));
HK.wrapAction('masterTitle', st => { HK.fac(st, 'zuenfte', 10); HK.fac(st, 'kaufleute', -6); });
HK.wrapAction('buyVenture', (st, r, id) => { const v = HK.VENTURE[id]; if (v.craft) HK.fac(st, 'zuenfte', 2); if (id === 'dive') { HK.fac(st, 'kirche', -6); HK.fac(st, 'patrizier', -3); } if (id === 'goldsmith') HK.fac(st, 'patrizier', 2); });
HK.wrapAction('buyTavern', st => HK.fac(st, 'kirche', -3));
HK.wrapAction('buyBathhouse', st => { HK.fac(st, 'kirche', -4); HK.fac(st, 'zuenfte', 2); });
HK.wrapAction('buyExtraBerth', st => { HK.fac(st, 'kaufleute', 6); HK.fac(st, 'patrizier', 3); });
HK.wrapAction('fundMilitia', st => { HK.fac(st, 'patrizier', 6); HK.fac(st, 'zuenfte', 2); });
HK.wrapAction('hospitalDonate', st => { HK.fac(st, 'kirche', 2); HK.fac(st, 'zuenfte', 1); });
HK.wrapAction('hospitalEndow', st => { HK.fac(st, 'kirche', 6); HK.fac(st, 'zuenfte', 4); HK.fac(st, 'patrizier', 2); });
HK.wrapAction('schoolDonate', st => HK.fac(st, 'patrizier', 2));
HK.wrapAction('schoolEndow', st => { HK.fac(st, 'patrizier', 6); HK.fac(st, 'kirche', 2); });
HK.wrapAction('hireThugs', st => { HK.fac(st, 'patrizier', -3); HK.fac(st, 'kirche', -2); });
HK.wrapAction('buyContraband', st => HK.fac(st, 'kaufleute', -0.5));
HK.wrapAction('fenceSell', st => HK.fac(st, 'kaufleute', -0.3));
HK.wrapAction('lend', st => HK.fac(st, 'zuenfte', 0.5));
HK.wrapAction('buyHouse', st => HK.fac(st, 'patrizier', 1));
HK.wrapAction('buyStorage', st => HK.fac(st, 'kaufleute', 2));
