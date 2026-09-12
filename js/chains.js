/* Ereignisketten: mehrstufige Geschichten mit Entscheidungen. Jede Stufe hat Text, optionale Wahlmöglichkeiten
   und eine Folgestufe; Entscheidungen halten das Spiel an, bis der Spieler gewählt hat. */
'use strict';

HK.CHAINS = {
  vitalien: {
    stages: {
      rumor:   { days: 4, next: 'offer' },
      offer:   { choices: ['buy', 'report', 'ignore'] },
      raid:    { days: 2, next: 'council' },
      council: { choices: ['fund', 'lead', 'stayout'] },
      hunt:    { days: 12, next: 'peace' },
      peace:   { end: true },
    },
    enter(st, ch, stage) {
      if (stage === 'offer') { const g = HK.pick(['furs', 'cloth', 'spices', 'wine']); ch.data.good = g; ch.data.qty = 40; ch.data.price = Math.round(HK.GOOD[g].base * 0.4); }
      if (stage === 'raid') {
        const warned = ch.data.choice === 'report';
        if (st.militia) { HK.log(st, 'vt_raidRepelled', {}, 'good'); ch.data.repelled = true; }
        else { if (st.ships.length) st.ships.pop(); for (const g in st.town.stock) st.town.stock[g] *= warned ? 0.97 : 0.93; st.town.prosperity = HK.clamp(st.town.prosperity - (warned ? 2 : 5), 0, 100); HK.log(st, warned ? 'vt_raidWarned' : 'vt_raid', {}, 'bad'); }
      }
      if (stage === 'hunt' && ch.data.choice === 'lead') { const s = st.ownShips.find(x => x.id === ch.data.shipId); if (s) { s.status = 'away'; s.dest = 'luebeck'; s.daysLeft = 12; s.phase = 'hunt'; s.cargo = {}; } }
      if (stage === 'peace') {
        if (ch.data.choice === 'lead') {
          const s = st.ownShips.find(x => x.id === ch.data.shipId); const bonus = (st.militia ? 0.1 : 0) + (st.blessedUntil > st.day ? 0.1 : 0) + (HK.rivalAlly(st) ? 0.1 : 0) + (ch.data.funded ? 0.1 : 0);
          if (Math.random() < 0.55 + bonus) { const loot = HK.rndi(6000, 12000); HK.book(st, 'expedition', loot); st.rep = HK.clamp(st.rep + 10, 0, 100); HK.fac(st, 'patrizier', 8); HK.fac(st, 'kirche', 3); HK.fac(st, 'kaufleute', 5); st.influence += 8; st.stats.pirateVictory = (st.stats.pirateVictory || 0) + 1; HK.log(st, 'vt_victory', { loot: HK.fmt(loot) }, 'good'); }
          else { if (s) s.hull = Math.max(5, s.hull - 40); st.rep = HK.clamp(st.rep - 3, 0, 100); HK.log(st, 'vt_defeat', {}, 'bad'); }
          if (s) { s.status = 'port'; s.dest = null; s.daysLeft = 0; s.phase = 'out'; }
        } else if (ch.data.choice === 'fund') { const won = Math.random() < 0.6; HK.log(st, won ? 'vt_fleetWon' : 'vt_fleetLost', {}, won ? 'good' : 'info'); if (won) { HK.fac(st, 'patrizier', 3); st.rep = HK.clamp(st.rep + 3, 0, 100); } }
        else HK.log(st, 'vt_peace', {}, 'info');
      }
    },
    choose(st, ch, choice) {
      const d = ch.data;
      if (ch.stage === 'offer') {
        if (choice === 'buy') { const cost = d.qty * d.price; if (st.money < cost) return { ok: false, msg: 'notEnoughMoney' }; if (HK.whFree(st) < d.qty) return { ok: false, msg: 'warehouseFull' }; HK.book(st, 'shipTrade', -cost); HK.addStock(st.warehouse.stock, d.good, d.qty); st.suspicion = HK.clamp(st.suspicion + 6, 0, 100); st.stats.smuggled += cost; HK.fac(st, 'kaufleute', -3); HK.fac(st, 'kirche', -2); const b = st.rivals.find(r => r.id === 'bracht'); if (b) b.attitude = HK.clamp(b.attitude + 15, -100, 100); }
        if (choice === 'report') { st.rep = HK.clamp(st.rep + 4, 0, 100); st.influence += 5; HK.fac(st, 'patrizier', 5); HK.fac(st, 'kirche', 2); const b = st.rivals.find(r => r.id === 'bracht'); if (b) b.attitude = HK.clamp(b.attitude - 15, -100, 100); }
        d.choice = choice; return { ok: true, next: 'raid' };
      }
      if (ch.stage === 'council') {
        if (choice === 'fund') { if (st.money < 2000) return { ok: false, msg: 'notEnoughMoney' }; HK.book(st, 'politics', -2000); d.funded = true; HK.fac(st, 'patrizier', 4); st.rep = HK.clamp(st.rep + 3, 0, 100); }
        if (choice === 'lead') { const s = st.ownShips.find(x => x.status === 'port'); if (!s) return { ok: false, msg: 'needShipInPort' }; d.shipId = s.id; }
        if (choice === 'stayout') HK.fac(st, 'patrizier', -3);
        d.choice = choice; return { ok: true, next: 'hunt' };
      }
      return { ok: false };
    },
  },
  plague: {
    stages: {
      cases:      { days: 5, next: 'hospital' },
      hospital:   { choices: ['donate', 'refuse'] },
      closed:     { days: 5, next: 'procession' },
      procession: { choices: ['join', 'flee', 'stay'] },
      waiting:    { days: 14, next: 'aftermath' },
      aftermath:  { end: true },
    },
    enter(st, ch, stage) {
      if (stage === 'closed') { st.harbourClosedUntil = st.day + 10; for (const i of st.incoming) if (i.sea) i.days += 10; for (const v of st.ships) v.daysLeft = Math.min(v.daysLeft, 1); HK.log(st, 'pl_closed', {}, 'bad'); }
      if (stage === 'aftermath') { st.wageModUntil = st.day + 60; st.cheapHousesUntil = st.day + 60; st.town.pop = Math.round(st.town.pop * (ch.data.choice === 'join' ? 0.95 : 0.92)); st.town.events = st.town.events.filter(e => e.type !== 'plague'); HK.log(st, 'pl_aftermath', {}, 'event'); }
    },
    choose(st, ch, choice) {
      const d = ch.data;
      if (ch.stage === 'hospital') {
        if (choice === 'donate') { if (st.money < 1500) return { ok: false, msg: 'notEnoughMoney' }; HK.book(st, 'church', -1500); HK.fac(st, 'kirche', 5); HK.fac(st, 'zuenfte', 4); st.rep = HK.clamp(st.rep + 4, 0, 100); st.hospitalGiven = (st.hospitalGiven || 0) + 1500; const ev = st.town.events.find(e => e.type === 'plague'); if (ev) ev.daysLeft = Math.max(3, ev.daysLeft - 5); }
        else { st.rep = HK.clamp(st.rep - 2, 0, 100); HK.fac(st, 'kirche', -2); }
        d.hospital = choice; return { ok: true, next: 'closed' };
      }
      if (ch.stage === 'procession') {
        if (choice === 'join') { if (st.money < 500) return { ok: false, msg: 'notEnoughMoney' }; HK.book(st, 'church', -500); st.piety = HK.clamp(st.piety + 8, 0, 100); HK.fac(st, 'kirche', 6); const ev = st.town.events.find(e => e.type === 'plague'); if (ev) ev.daysLeft = Math.max(2, ev.daysLeft - 8); }
        if (choice === 'flee') { st.rep = HK.clamp(st.rep - 6, 0, 100); HK.fac(st, 'patrizier', -4); HK.fac(st, 'zuenfte', -3); for (const g in st.warehouse.stock) st.warehouse.stock[g] = Math.floor(st.warehouse.stock[g] * 0.92); }
        if (choice === 'stay') { if (Math.random() < 0.25) { HK.book(st, 'church', -800); HK.log(st, 'pl_sick', {}, 'bad'); } }
        d.choice = choice; return { ok: true, next: 'waiting' };
      }
      return { ok: false };
    },
  },
};

HK.newGameHooks.push(st => { st.chains = { active: [], cooldown: {}, history: [] }; st.pendingDecision = null; });
HK.migrateHooks.push(st => { if (!st.chains) { st.chains = { active: [], cooldown: {}, history: [] }; st.pendingDecision = null; } });

HK.startChain = function (st, id) {
  const def = HK.CHAINS[id]; if (!def || st.chains.active.some(c => c.id === id)) return;
  const ch = { id, stage: null, since: st.day, data: {} }; st.chains.active.push(ch);
  HK.log(st, 'chainStart_' + id, {}, 'event');
  HK.enterStage(st, ch, Object.keys(def.stages)[0]);
};
HK.enterStage = function (st, ch, stage) {
  const def = HK.CHAINS[ch.id], sd = def.stages[stage];
  ch.stage = stage; ch.since = st.day;
  if (def.enter) def.enter(st, ch, stage);
  if (sd.choices) { st.pendingDecision = { chain: ch.id, stage }; if (HK.onDecision) HK.onDecision(ch); }
  if (sd.end) { st.chains.active = st.chains.active.filter(c => c !== ch); st.chains.history.push({ id: ch.id, day: st.day, choice: ch.data.choice }); st.chains.cooldown[ch.id] = st.day + 400; }
};
HK.decide = function (st, chainId, choice) {
  const ch = st.chains.active.find(c => c.id === chainId); if (!ch) return { ok: false };
  const def = HK.CHAINS[chainId], sd = def.stages[ch.stage]; if (!sd.choices || !sd.choices.includes(choice)) return { ok: false };
  const r = def.choose(st, ch, choice); if (!r.ok) return r;
  st.pendingDecision = null; HK.log(st, 'chain_' + chainId + '_' + ch.stage + '_' + choice, {}, 'info');
  HK.enterStage(st, ch, r.next);
  return { ok: true };
};
HK.tickHooks.push(st => {
  if (!st.chains) return;
  // laufende Ketten: Stufen ohne Entscheidung schreiten nach Frist voran
  for (const ch of st.chains.active.slice()) { const sd = HK.CHAINS[ch.id].stages[ch.stage]; if (sd.days && st.day - ch.since >= sd.days) HK.enterStage(st, ch, sd.next); }
  // Auslöser
  if (!st.chains.active.length && st.day > 60) {
    if (!(st.chains.cooldown.vitalien > st.day) && Math.random() < 0.0018) HK.startChain(st, 'vitalien');
    else if (!(st.chains.cooldown.plague > st.day) && st.town.events.some(e => e.type === 'plague') && st.log.some(e => e.day >= st.day - 1 && e.key === 'ev_plague')) HK.startChain(st, 'plague');
  }
});
