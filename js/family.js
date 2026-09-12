/* Familie, Alter und Nachfolge: Heiratsangebote mit Mitgift und Bündnis, Kinder, Erbe – und der Tod des Kaufmanns,
   nach dem der Erbe mit eigenen Schwächen übernimmt. Ohne Erben endet die Chronik. */
'use strict';

HK.FIRST_NAMES = { m: ['Hinrich', 'Johann', 'Tidemann', 'Godeke', 'Albrecht', 'Wilkin', 'Everd', 'Claus', 'Bertram', 'Ludeke'], f: ['Elsebe', 'Metke', 'Ilsabe', 'Wobbeke', 'Katharina', 'Grete', 'Adelheid', 'Margarethe', 'Gesche', 'Anneke'] };
HK.HEIR_TRAITS = ['pious', 'shrewd', 'diligent', 'wasteful'];
HK.MARRIAGE_HOUSES = ['patrician', 'rival', 'guild', 'widow'];
HK.surname = st => (st.family && st.family.surname) || (st.name.trim().split(/\s+/).slice(-1)[0] || st.name);
HK.newGameHooks.push(st => { st.family = { age: 28, surname: st.name.trim().split(/\s+/).slice(-1)[0] || st.name, spouse: null, children: [], heir: null, nextOffer: 300, generation: 1, founder: st.name, lastBirthYear: -1, offer: null }; });
HK.migrateHooks.push(st => { if (!st.family) st.family = { age: 28 + Math.floor(st.day / 365), surname: st.name.trim().split(/\s+/).slice(-1)[0] || st.name, spouse: null, children: [], heir: null, nextOffer: st.day + 200, generation: 1, founder: st.name, lastBirthYear: -1, offer: null }; });
HK.playerAge = st => st.family.age + Math.floor((st.day - (st.family.ageDay || 0)) / 365);

HK.makeOffer = function (st) {
  const house = HK.pick(HK.MARRIAGE_HOUSES), o = { house, name: HK.pick(HK.FIRST_NAMES.f) };
  if (house === 'patrician') { o.dowry = 6000; o.family = HK.PERSON.mayor.name.split(' ').slice(-1)[0]; }
  else if (house === 'rival') { const r = HK.pick(st.rivals); o.rival = r.id; o.family = HK.rivalName(r.id).split(' ').slice(-1)[0]; o.dowry = 4000; }
  else if (house === 'guild') { o.dowry = 2500; o.family = HK.PERSON.craftmaster.name.split(' ').slice(-1)[0]; }
  else { o.dowry = 3500; o.family = HK.pick(HK.BORROWER_NAMES).split(' ').slice(-1)[0]; }
  return o;
};
HK.answerOffer = function (st, accept) {
  const F = st.family, o = F.offer; if (!o) return { ok: false };
  F.offer = null;
  if (!accept) { F.nextOffer = st.day + 200; HK.log(st, 'offerDeclined', { name: o.name, family: o.family }, 'info'); return { ok: true }; }
  F.spouse = { name: o.name, family: o.family, house: o.house, since: st.day };
  HK.book(st, 'investments', o.dowry);
  if (o.house === 'patrician') { HK.fac(st, 'patrizier', 12); st.influence += 6; for (const c of HK.councillors()) if (c.faction === 'patrizier') st.persons[c.id].loyalty = HK.clamp(st.persons[c.id].loyalty + 15, 0, 100); }
  if (o.house === 'rival') { const r = st.rivals.find(x => x.id === o.rival); if (r) { r.attitude = HK.clamp(r.attitude + 45, -100, 100); r.ally = true; } HK.fac(st, 'kaufleute', 6); }
  if (o.house === 'guild') { HK.fac(st, 'zuenfte', 12); st.persons.craftmaster.loyalty = HK.clamp(st.persons.craftmaster.loyalty + 20, 0, 100); }
  if (o.house === 'widow') { HK.fac(st, 'kirche', 12); st.piety = HK.clamp(st.piety + 6, 0, 100); }
  HK.log(st, 'married', { name: o.name, family: o.family, dowry: HK.fmt(o.dowry) }, 'good');
  return { ok: true };
};
HK.chooseHeir = function (st, idx) { const c = st.family.children[idx]; if (!c) return { ok: false }; st.family.heir = idx; return { ok: true }; };
HK.childAge = (st, c) => Math.floor((st.day - c.born) / 365);
HK.succeed = function (st) {
  const F = st.family, heirs = F.children.filter(c => HK.childAge(st, c) >= 16);
  const heir = (F.heir !== null && F.children[F.heir] && HK.childAge(st, F.children[F.heir]) >= 16) ? F.children[F.heir] : heirs[0];
  const old = st.name;
  if (!heir) { HK.log(st, 'diedNoHeir', { name: old }, 'bad'); st.chronicleShown = true; st.endDay = st.day; if (HK.onChronicle) HK.onChronicle(); return; }
  st.name = heir.name + ' ' + F.surname; F.age = HK.childAge(st, heir); F.ageDay = st.day; F.generation++; F.spouse = null; F.children = F.children.filter(c => c !== heir); F.heir = null; F.nextOffer = st.day + 120;
  st.rep = HK.clamp(st.rep * 0.8, 0, 100); st.influence = Math.floor(st.influence * 0.7); HK.facAll(st, -8); st.seat = 'none'; st.mayorSince = undefined;
  for (const pid in st.persons) st.persons[pid].loyalty = HK.clamp(st.persons[pid].loyalty - 15, 0, 100);
  if (heir.trait === 'pious') st.piety = HK.clamp(st.piety + 15, 0, 100);
  if (heir.trait === 'shrewd') { st.influence += 10; st.suspicion = HK.clamp(st.suspicion + 10, 0, 100); }
  if (heir.trait === 'diligent') for (const id in st.ventures) if (!st.ventures[id].owner && st.ventures[id].level < 3) st.ventures[id].level++;
  if (heir.trait === 'wasteful') HK.book(st, 'investments', -Math.round(Math.max(0, st.money) * 0.15));
  HK.log(st, 'succession', { old, heir: st.name, trait: HK.t('heir_' + heir.trait) }, 'event');
  if (HK.onSuccession) HK.onSuccession(heir);
};
HK.tickHooks.push(st => {
  const F = st.family; if (!F) return;
  const age = HK.playerAge(st), year = Math.floor(st.day / 365);
  // Heiratsangebote
  if (!F.spouse && !F.offer && st.day >= F.nextOffer && age < 60) { F.offer = HK.makeOffer(st); F.nextOffer = st.day + 200; HK.log(st, 'offerReceived', { name: F.offer.name, family: F.offer.family }, 'event'); if (HK.onOffer) HK.onOffer(F.offer); }
  // Kinder
  if (F.spouse && F.children.length < 4 && st.day % 365 === 180 && F.lastBirthYear !== year && age < 55 && Math.random() < 0.55) { const sex = Math.random() < 0.5 ? 'm' : 'f'; const c = { name: HK.pick(HK.FIRST_NAMES[sex]), sex, born: st.day, trait: HK.pick(HK.HEIR_TRAITS) }; F.children.push(c); F.lastBirthYear = year; HK.log(st, 'childBorn', { name: c.name }, 'good'); }
  // Tod: ab 55 jährlich steigende Gefahr, mit 78 gewiss
  if (st.day % 365 === 364 && age >= 55 && (age >= 78 || Math.random() < (age - 55) * 0.025)) HK.succeed(st);
});
