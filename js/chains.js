/* Ereignisketten: mehrstufige Geschichten mit Entscheidungen. Jede Stufe hat Text, optionale Wahlmöglichkeiten
   und eine Folgestufe; Entscheidungen halten das Spiel an, bis der Spieler gewählt hat. */
'use strict';

HK.CHAINS = {
  vitalien: {
    cooldown: 700,
    stages: {
      rumor:   { days: 4, next: 'offer' },
      offer:   { choices: ['buy', 'report', 'ignore'] },
      raid:    { days: 2, next: 'council' },
      council: { choices: ['fund', 'lead', 'stayout'] },
      hunt:    { days: 12, next: 'peace' },
      peace:   { end: true },
    },
    enter(st, ch, stage) {
      if (stage === 'offer') { const g = HK.pick(['furs', 'cloth', 'spices', 'wine']); ch.data.good = g; ch.data.qty = 30; ch.data.price = Math.round(HK.GOOD[g].base * 0.55); }
      if (stage === 'raid') {
        const warned = ch.data.choice === 'report';
        if (st.militia) { HK.log(st, 'vt_raidRepelled', {}, 'good'); ch.data.repelled = true; }
        else { if (st.ships.length) st.ships.pop(); for (const g in st.town.stock) st.town.stock[g] *= warned ? 0.97 : 0.93; st.town.prosperity = HK.clamp(st.town.prosperity - (warned ? 2 : 5), 0, 100); HK.log(st, warned ? 'vt_raidWarned' : 'vt_raid', {}, 'bad'); }
      }
      if (stage === 'hunt' && ch.data.choice === 'lead') { const s = st.ownShips.find(x => x.id === ch.data.shipId); if (s) { s.status = 'away'; s.dest = 'luebeck'; s.daysLeft = 12; s.phase = 'hunt'; s.cargo = {}; } }
      if (stage === 'peace') {
        if (ch.data.choice === 'lead') {
          const s = st.ownShips.find(x => x.id === ch.data.shipId); const bonus = (st.militia ? 0.1 : 0) + (st.blessedUntil > st.day ? 0.1 : 0) + (HK.rivalAlly(st) ? 0.1 : 0) + (ch.data.funded ? 0.1 : 0);
          if (Math.random() < 0.55 + bonus) { const loot = HK.rndi(3000, 6000); HK.book(st, 'expedition', loot); st.rep = HK.clamp(st.rep + 10, 0, 100); HK.fac(st, 'patrizier', 8); HK.fac(st, 'kirche', 3); HK.fac(st, 'kaufleute', 5); st.influence += 8; st.stats.pirateVictory = (st.stats.pirateVictory || 0) + 1; HK.log(st, 'vt_victory', { loot: HK.fmt(loot) }, 'good'); }
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
  /* Der Bischofsstreit: Zehnt, Weigerung des Rats, Interdikt, Vergleich */
  bishop: {
    cooldown: 900,
    stages: {
      demand:     { days: 5, next: 'council' },
      council:    { choices: ['tithe', 'council', 'mediate'] },
      interdict:  { days: 24, next: 'settlement' },
      settlement: { choices: ['fund', 'farm', 'stayout'] },
      end:        { end: true },
    },
    enter(st, ch, stage) {
      if (stage === 'demand') ch.data.tithe = Math.round(2000 + Math.max(0, HK.netWorth(st)) * 0.01);
      if (stage === 'interdict') {
        if (ch.data.mediated) { HK.log(st, 'bs_noInterdict', {}, 'good'); HK.enterStage(st, ch, 'settlement'); return; }
        st.interdictUntil = st.day + 24; HK.log(st, 'bs_interdict', {}, 'bad');
      }
      if (stage === 'end') HK.log(st, 'bs_end', {}, 'info');
    },
    choose(st, ch, choice) {
      const d = ch.data;
      if (ch.stage === 'council') {
        if (choice === 'tithe') { if (st.money < d.tithe) return { ok: false, msg: 'notEnoughMoney' }; HK.book(st, 'church', -d.tithe); HK.fac(st, 'kirche', 10); HK.fac(st, 'patrizier', -6); HK.fac(st, 'kaufleute', -3); st.piety = HK.clamp(st.piety + 8, 0, 100); }
        if (choice === 'council') { HK.fac(st, 'patrizier', 8); HK.fac(st, 'kaufleute', 3); HK.fac(st, 'kirche', -10); st.influence += 8; st.piety = HK.clamp(st.piety - 5, 0, 100); }
        if (choice === 'mediate') {
          if (st.influence < 40) return { ok: false, msg: 'needInfluence40' };
          st.influence -= 20;
          const ok = Math.random() < 0.4 + st.piety / 300 + (st.seat === 'mayor' ? 0.15 : st.seat === 'councillor' ? 0.05 : 0) + (st.brotherhood ? 0.1 : 0);
          d.mediated = ok;
          if (ok) { HK.fac(st, 'kirche', 6); HK.fac(st, 'patrizier', 6); st.rep = HK.clamp(st.rep + 8, 0, 100); st.influence += 10; HK.log(st, 'bs_mediated', {}, 'good'); }
          else HK.log(st, 'bs_mediateFailed', {}, 'bad');
        }
        d.choice = choice; return { ok: true, next: 'interdict' };
      }
      if (ch.stage === 'settlement') {
        if (choice === 'fund') { if (st.money < 4000) return { ok: false, msg: 'notEnoughMoney' }; HK.book(st, 'church', -4000); st.rep = HK.clamp(st.rep + 6, 0, 100); HK.facAll(st, 3); st.influence += 5; }
        if (choice === 'farm') { if (st.money < 3000) return { ok: false, msg: 'notEnoughMoney' }; HK.book(st, 'politics', -3000); st.titheFarm = { until: st.day + 300 }; HK.fac(st, 'kirche', -4); HK.fac(st, 'zuenfte', -2); }
        d.settlement = choice; return { ok: true, next: 'end' };
      }
      return { ok: false };
    },
  },
  /* Die Fehde: ein Ritter im Umland kapert Karawanen; Frieden kaufen, Miliz schicken, Lösegeld oder abwarten */
  feud: {
    cooldown: 900,
    stages: {
      raid:    { days: 3, next: 'council' },
      council: { choices: ['peace', 'militia', 'ransom', 'ignore'] },
      siege:   { days: 18, next: 'end' },
      end:     { end: true },
    },
    enter(st, ch, stage) {
      if (stage === 'raid') { st.caravans = []; for (const g of ['grain', 'wool', 'timber']) st.town.stock[g] = (st.town.stock[g] || 0) * 0.85; HK.log(st, 'fd_raid', {}, 'bad'); }
      if (stage === 'siege') {
        const d = ch.data;
        if (d.choice === 'peace' || d.choice === 'ransom') { HK.enterStage(st, ch, 'end'); return; }
        if (d.choice === 'militia') {
          if (Math.random() < 0.55 + (st.town.projects.wall ? 0.15 : 0) + (st.militia ? 0.1 : 0)) { const loot = HK.rndi(800, 2000); HK.book(st, 'expedition', loot); st.rep = HK.clamp(st.rep + 8, 0, 100); HK.fac(st, 'patrizier', 6); HK.fac(st, 'zuenfte', 4); st.influence += 6; HK.log(st, 'fd_victory', { loot: HK.fmt(loot) }, 'good'); HK.enterStage(st, ch, 'end'); return; }
          st.militia = false; HK.fac(st, 'patrizier', -3); HK.log(st, 'fd_defeat', {}, 'bad');
        }
        st.landClosedUntil = st.day + 18; HK.fac(st, 'kaufleute', -4); HK.log(st, 'fd_siege', {}, 'bad');
      }
      if (stage === 'end') HK.log(st, 'fd_end', {}, 'info');
    },
    choose(st, ch, choice) {
      const d = ch.data;
      if (ch.stage !== 'council') return { ok: false };
      if (choice === 'peace') { if (st.money < 3000) return { ok: false, msg: 'notEnoughMoney' }; HK.book(st, 'politics', -3000); st.rep = HK.clamp(st.rep + 4, 0, 100); HK.fac(st, 'patrizier', 4); HK.fac(st, 'kaufleute', 3); st.influence += 4; }
      if (choice === 'militia') { if (!st.militia) return { ok: false, msg: 'needMilitia' }; }
      if (choice === 'ransom') { if (st.money < 1500) return { ok: false, msg: 'notEnoughMoney' }; HK.book(st, 'bribes', -1500); st.rep = HK.clamp(st.rep - 5, 0, 100); HK.fac(st, 'patrizier', -6); HK.fac(st, 'kirche', -2); st.suspicion = HK.clamp(st.suspicion + 3, 0, 100); }
      d.choice = choice; return { ok: true, next: 'siege' };
    },
  },
  /* Der Zunftaufstand: wenn die Zünfte nichts mehr zu verlieren haben */
  uprising: {
    cooldown: 900,
    stages: {
      unrest:    { days: 3, next: 'council' },
      council:   { choices: ['militia', 'mediate', 'lead', 'hide'] },
      aftermath: { days: 5, next: 'end' },
      end:       { end: true },
    },
    enter(st, ch, stage) {
      if (stage === 'unrest') { st.unrestUntil = st.day + 9; HK.log(st, 'up_unrest', {}, 'bad'); }
      if (stage === 'aftermath') {
        const d = ch.data;
        if (d.choice === 'militia') { const mine = Object.keys(st.ventures).filter(id => !st.ventures[id].owner && HK.VENTURE[id].craft && st.ventures[id].level > 1); if (mine.length) { const id = HK.pick(mine); st.ventures[id].level--; HK.log(st, 'up_burned', { venture: HK.name(HK.VENTURE[id]) }, 'bad'); } }
        if (d.choice === 'lead' && st.seat !== 'none') { st.seat = 'none'; if (HK.resetOffices) HK.resetOffices(st); HK.log(st, 'up_seatLost', {}, 'bad'); }
      }
      if (stage === 'end') { st.unrestUntil = 0; HK.log(st, 'up_end', {}, 'info'); }
    },
    choose(st, ch, choice) {
      const d = ch.data; if (ch.stage !== 'council') return { ok: false };
      if (choice === 'militia') { if (!st.militia) return { ok: false, msg: 'needMilitia' }; HK.fac(st, 'patrizier', 8); HK.fac(st, 'zuenfte', -15); st.rep = HK.clamp(st.rep - 3, 0, 100); }
      if (choice === 'mediate') {
        if (st.influence < 30) return { ok: false, msg: 'needInfluence30' }; st.influence -= 20;
        const ok = Math.random() < 0.45 + st.factions.zuenfte / 200 + (st.craftGuild ? 0.15 : 0) + (st.masterTitle ? 0.1 : 0);
        if (ok) { HK.facAll(st, 4); st.rep = HK.clamp(st.rep + 6, 0, 100); st.influence += 8; st.unrestUntil = st.day + 1; HK.log(st, 'up_mediated', {}, 'good'); } else { HK.fac(st, 'zuenfte', -5); HK.log(st, 'up_mediateFailed', {}, 'bad'); }
      }
      if (choice === 'lead') { HK.fac(st, 'zuenfte', 18); HK.fac(st, 'patrizier', -12); HK.fac(st, 'kaufleute', -6); st.persons.craftmaster.loyalty = HK.clamp(st.persons.craftmaster.loyalty + 25, 0, 100); st.rep = HK.clamp(st.rep + 2, 0, 100); }
      if (choice === 'hide') { HK.fac(st, 'zuenfte', -4); HK.fac(st, 'patrizier', -2); }
      d.choice = choice; return { ok: true, next: 'aftermath' };
    },
  },
  /* Der Hansetag: Einladung, Gesandter, Verhandlung, Privileg oder Blamage */
  hansetag: {
    cooldown: 900,
    stages: {
      invitation:  { days: 3, next: 'envoy' },
      envoy:       { choices: ['go', 'delegate', 'decline'] },
      journey:     { days: 6, next: 'negotiation' },
      negotiation: { choices: ['bribe', 'plead', 'stand'] },
      verdict:     { days: 8, next: 'result' },
      result:      { end: true },
    },
    enter(st, ch, stage) {
      if (stage !== 'result') return;
      const d = ch.data;
      if (d.choice === 'decline') { HK.log(st, 'ht_declined', {}, 'info'); return; }
      let p = 0.3 + st.rep / 250 + (Object.keys(st.kontors || {}).length ? 0.1 : 0) + (st.seat === 'mayor' ? 0.1 : 0);
      if (d.choice === 'delegate') { const ally = st.rivals.find(r => r.ally); p = 0.25 + (ally ? ally.attitude / 200 : 0); }
      if (d.neg === 'bribe') p += 0.25; if (d.neg === 'plead') p += 0.2;
      if (Math.random() < p) { st.hansePrivilege = { since: st.day }; st.rep = HK.clamp(st.rep + 10, 0, 100); HK.facAll(st, 5); st.influence += 15; HK.log(st, 'ht_privilege', {}, 'good'); }
      else { st.rep = HK.clamp(st.rep - 5, 0, 100); HK.fac(st, 'patrizier', -5); HK.log(st, 'ht_blamage', {}, 'bad'); }
    },
    choose(st, ch, choice) {
      const d = ch.data;
      if (ch.stage === 'envoy') {
        if (choice === 'go') { if (st.rep < 60) return { ok: false, msg: 'needRep60' }; if (st.money < 2000) return { ok: false, msg: 'notEnoughMoney' }; HK.book(st, 'politics', -2000); HK.fac(st, 'patrizier', 4); d.choice = 'go'; return { ok: true, next: 'journey' }; }
        if (choice === 'delegate') { if (!st.rivals.some(r => r.ally)) return { ok: false, msg: 'needAlly' }; d.choice = 'delegate'; return { ok: true, next: 'verdict' }; }
        HK.fac(st, 'patrizier', -4); HK.fac(st, 'kaufleute', -3); d.choice = 'decline'; return { ok: true, next: 'result' };
      }
      if (ch.stage === 'negotiation') {
        if (choice === 'bribe') { if (st.money < 5000) return { ok: false, msg: 'notEnoughMoney' }; HK.book(st, 'bribes', -5000); st.stats.bribes += 5000; st.suspicion = HK.clamp(st.suspicion + 5, 0, 100); }
        if (choice === 'plead') { if (st.influence < 25) return { ok: false, msg: 'needInfluence25' }; st.influence -= 25; }
        d.neg = choice; return { ok: true, next: 'verdict' };
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
  if (sd.end) { st.chains.active = st.chains.active.filter(c => c !== ch); st.chains.history.push({ id: ch.id, day: st.day, choice: ch.data.choice }); st.chains.cooldown[ch.id] = st.day + (def.cooldown || 400); }
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
    else if (st.day > 200 && !(st.chains.cooldown.bishop > st.day) && Math.random() < 0.0009) HK.startChain(st, 'bishop');
    else if (st.day > 400 && st.rank >= 2 && !(st.chains.cooldown.hansetag > st.day) && Math.random() < 0.001) HK.startChain(st, 'hansetag');
    else if (st.day > 150 && !(st.chains.cooldown.feud > st.day) && Math.random() < 0.001) HK.startChain(st, 'feud');
    else if (st.day > 300 && st.factions.zuenfte < 25 && !(st.chains.cooldown.uprising > st.day) && Math.random() < 0.003) HK.startChain(st, 'uprising');
  }
  // Interdikt: keine Messen, Frömmigkeit fällt, die Kirche grollt; Zehntpacht zahlt
  if (st.interdictUntil > st.day) { st.piety = HK.clamp(st.piety - 0.25, 0, 100); HK.fac(st, 'kirche', -0.04); }
  if (st.titheFarm) { if (st.titheFarm.until > st.day) HK.book(st, 'taxFarm', 25); else { st.titheFarm = null; HK.log(st, 'titheFarmEnded', {}, 'info'); } }
});

/* Während des Interdikts sind Kirchenhandlungen gesperrt */
for (const name of ['donate', 'supplyChurch', 'sermon', 'churchProject', 'indulgence', 'blessShips', 'donateRelic', 'foundBrotherhood', 'callPilgrimage', 'startChurchBuild']) {
  const orig = HK[name]; if (!orig) continue;
  HK[name] = function (st, ...args) { if (st.interdictUntil > st.day) return { ok: false, msg: 'interdictActive' }; return orig(st, ...args); };
}
