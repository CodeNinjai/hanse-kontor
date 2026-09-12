/* Stadtszene: Canvas-Rendering, Passanten, Schiffe, Tag und Nacht */
'use strict';

HK.Scene = {
  canvas: null, ctx: null, scale: 1, walkers: [], shipAnim: {}, smoke: [], gulls: [], hover: null, selected: null, clock: 0.35, time: 0, ground: null,

  init(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    canvas.width = HK.SCENE.W; canvas.height = HK.SCENE.H;
    this.makeGround();
    for (let i = 0; i < 28; i++) this.walkers.push(this.makeWalker(true));
    for (let i = 0; i < 4; i++) this.gulls.push({ x: HK.rnd(100, 900), y: HK.rnd(470, 620), a: HK.rnd(0, 6.28), r: HK.rnd(20, 60), s: HK.rnd(0.3, 0.7) });
    canvas.addEventListener('mousemove', e => { const p = this.toScene(e); const h = this.hit(p.x, p.y); this.hover = h; canvas.style.cursor = h ? 'pointer' : 'default'; this.tooltip(h, e); });
    canvas.addEventListener('mouseleave', () => { this.hover = null; this.tooltip(null); });
    canvas.addEventListener('click', e => { const p = this.toScene(e); const h = this.hit(p.x, p.y); if (h) HK.UI.sceneClick(h); });
  },
  toScene(e) { const r = this.canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * HK.SCENE.W / r.width, y: (e.clientY - r.top) * HK.SCENE.H / r.height }; },
  tooltip(h, e) {
    const tip = document.getElementById('tooltip');
    if (!h) { tip.hidden = true; return; }
    tip.hidden = false; tip.textContent = h.label;
    const r = this.canvas.getBoundingClientRect(), wrap = this.canvas.parentElement.getBoundingClientRect();
    tip.style.left = (e.clientX - wrap.left + 14) + 'px'; tip.style.top = (e.clientY - wrap.top + 14) + 'px';
  },

  makeGround() {
    const c = document.createElement('canvas'); c.width = HK.SCENE.W; c.height = HK.SCENE.H;
    const g = c.getContext('2d');
    g.fillStyle = '#b3a678'; g.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 6000; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(90,80,50,0.12)' : 'rgba(255,245,210,0.12)'; g.fillRect(Math.random() * c.width, Math.random() * 540, 2, 2); }
    // Grasflecken
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(120,140,70,0.25)'; g.beginPath(); g.ellipse(Math.random() * c.width, Math.random() * 500, HK.rnd(10, 40), HK.rnd(6, 20), 0, 0, 6.28); g.fill(); }
    // Straßen
    g.strokeStyle = '#cbbb92'; g.lineWidth = 24; g.lineCap = 'round'; g.lineJoin = 'round';
    for (const [a, b] of HK.ROAD_EDGES) { const A = HK.ROAD_NODES[a], B = HK.ROAD_NODES[b]; if (['P', 'Q', 'R'].includes(a) || ['P', 'Q', 'R'].includes(b)) continue; g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke(); }
    // Marktplatz
    g.fillStyle = '#cdbf99'; g.fillRect(376, 296, 208, 88);
    for (let i = 0; i < 700; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(80,70,50,0.15)' : 'rgba(255,255,240,0.15)'; g.fillRect(376 + Math.random() * 208, 296 + Math.random() * 88, 3, 2); }
    // Kai
    g.fillStyle = '#8f8878'; g.fillRect(0, 528, 960, 14);
    g.fillStyle = '#6f6858'; for (let x = 20; x < 960; x += 60) g.fillRect(x, 536, 5, 5);
    this.ground = c;
  },

  makeWalker(anywhere) {
    const types = []; HK.WALKER_TYPES.forEach(t => { for (let i = 0; i < t.weight; i++) types.push(t); });
    const t = HK.pick(types);
    const keys = Object.keys(HK.ROAD_NODES);
    const from = HK.pick(keys), to = HK.pick(HK.ROAD_ADJ[from]);
    return { type: t.id, color: HK.pick(t.colors), from, to, t: anywhere ? Math.random() : 0, speed: HK.rnd(14, 30) * (t.id === 'child' ? 1.6 : t.id === 'beggar' ? 0.6 : 1), off: HK.rnd(-7, 7), pause: 0, nightOwl: Math.random() < 0.2 || t.id === 'guard', skin: HK.pick(['#e8c39e', '#d9a98a', '#c9946c']) };
  },
  walkerPos(w) {
    const A = HK.ROAD_NODES[w.from], B = HK.ROAD_NODES[w.to];
    const dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy) || 1;
    return { x: A[0] + dx * w.t - dy / len * w.off, y: A[1] + dy * w.t + dx / len * w.off, len };
  },
  light() {
    const c = this.clock;
    if (c < 0.2) return 0; if (c < 0.3) return (c - 0.2) / 0.1; if (c < 0.75) return 1; if (c < 0.87) return 1 - (c - 0.75) / 0.12; return 0;
  },
  walkerAlpha(w) {
    const l = this.light();
    const plague = HK.state && HK.state.town.events.some(e => e.type === 'plague');
    let a = w.nightOwl ? 1 : HK.clamp(l * 1.5, 0, 1);
    if (plague && !w.nightOwl && w.type !== 'monk') a *= 0.3;
    return a;
  },

  update(dt) {
    this.time += dt;
    for (const w of this.walkers) {
      if (w.pause > 0) { w.pause -= dt; continue; }
      const p = this.walkerPos(w);
      w.t += w.speed * dt / p.len;
      if (w.t >= 1) {
        const prev = w.from; w.from = w.to; w.t = 0;
        const opts = HK.ROAD_ADJ[w.from].filter(n => n !== prev);
        w.to = HK.pick(opts.length ? opts : HK.ROAD_ADJ[w.from]);
        if (Math.random() < 0.15) w.pause = HK.rnd(1, 4);
      }
    }
    // Schiffsanimationen
    if (HK.state) {
      const st = HK.state;
      st.ships.forEach((s, i) => {
        const b = HK.BERTHS[i]; let a = this.shipAnim[s.id];
        if (!a) a = this.shipAnim[s.id] = { x: 1040, y: b.y, tx: b.x, leaving: false, name: s.name, origin: s.origin };
        a.tx = b.x; a.x += (a.tx - a.x) * Math.min(1, dt * 1.6);
      });
      for (const id in this.shipAnim) {
        const a = this.shipAnim[id];
        if (!st.ships.some(s => String(s.id) === id)) { a.leaving = true; a.x -= 90 * dt; if (a.x < -80) delete this.shipAnim[id]; }
      }
      // Rauch
      const chimneys = [];
      for (const b of HK.BUILDINGS) {
        if (b.kind === 'house' || b.kind === 'hall') chimneys.push([b.x + b.w - 10, b.y + 4]);
        if (b.kind === 'plot' && st.workshops[b.plot].type && !st.workshops[b.plot].idle) chimneys.push([b.x + b.w - 8, b.y + 4]);
      }
      if (Math.random() < dt * 4) { const c = HK.pick(chimneys); this.smoke.push({ x: c[0], y: c[1], age: 0, vx: HK.rnd(-3, 3) }); }
      this.smoke = this.smoke.filter(s => (s.age += dt) < 4);
      for (const s of this.smoke) { s.y -= 8 * dt; s.x += s.vx * dt; }
    }
    for (const g of this.gulls) g.a += g.s * dt;
  },

  /* Trefferprüfung: Passanten, feste Personen, Schiffe, Karawanen, Gebäude */
  hit(x, y) {
    const st = HK.state; if (!st) return null;
    for (const w of this.walkers) { if (this.walkerAlpha(w) < 0.4) continue; const p = this.walkerPos(w); if (Math.hypot(p.x - x, p.y - (y + 6)) < 9) return { kind: 'walker', walker: w, label: HK.t('enc_' + w.type + '_label') }; }
    for (const n of HK.STATIC_NPCS) if (Math.hypot(n.x - x, n.y - (y + 6)) < 10) { const p = HK.PERSON[n.person]; return { kind: 'person', person: n.person, label: p.name + ', ' + (p.title[HK.LANG] || p.title.de) }; }
    for (let i = 0; i < st.ships.length; i++) { const a = this.shipAnim[st.ships[i].id]; if (a && !a.leaving && x > a.x - 45 && x < a.x + 45 && y > a.y - 40 && y < a.y + 18) return { kind: 'visitor', id: st.ships[i].id, panel: 'harbour', label: st.ships[i].name + ' (' + HK.name(HK.ORIGIN[st.ships[i].origin]) + ')' }; }
    for (let i = 0; i < st.caravans.length; i++) { const c = HK.CARAVAN_SPOTS[i]; if (x > c.x - 25 && x < c.x + 25 && y > c.y - 22 && y < c.y + 14) return { kind: 'visitor', id: st.caravans[i].id, panel: 'gate', label: HK.t('caravanFrom', { origin: HK.name(HK.ORIGIN[st.caravans[i].origin]) }) }; }
    for (const b of HK.BUILDINGS) { const top = b.kind === 'church' ? b.y - 40 : b.y - 4; if (x >= b.x && x <= b.x + b.w && y >= top && y <= b.y + b.h + 4) return { kind: 'building', building: b, panel: b.panel, label: HK.name(b) }; }
    return null;
  },

  /* ---------- Zeichnen ---------- */
  draw() {
    const ctx = this.ctx, st = HK.state; if (!st) return;
    const W = HK.SCENE.W, H = HK.SCENE.H, t = this.time;
    ctx.drawImage(this.ground, 0, 0);
    this.drawWater(ctx, t);
    // Gebäude nach y sortiert (hinten zuerst)
    const bs = HK.BUILDINGS.filter(b => b.kind !== 'water').slice().sort((a, b) => (a.y + a.h) - (b.y + b.h));
    for (const b of bs) this.drawBuilding(ctx, b, st);
    this.drawCrane(ctx, 470, 528);
    // Karawanen
    st.caravans.forEach((c, i) => this.drawCaravan(ctx, HK.CARAVAN_SPOTS[i].x, HK.CARAVAN_SPOTS[i].y, t + i));
    // Boote
    const nBoats = Math.min(4, 2 + st.boats);
    for (let i = 0; i < nBoats; i++) this.drawBoat(ctx, HK.BOAT_SPOTS[i].x, HK.BOAT_SPOTS[i].y + Math.sin(t * 2 + i) * 1.5, i >= 2);
    // Schiffe
    for (const id in this.shipAnim) { const a = this.shipAnim[id]; this.drawShip(ctx, a.x, a.y + Math.sin(t * 1.5 + a.x) * 1.5, a.origin, !a.leaving && a.x - a.tx < 2, HK.state.ships.find(s => String(s.id) === id) && HK.UI.selectedVisitor === Number(id)); }
    st.ownShips.forEach((s, i) => { if (s.status === 'port') this.drawShip(ctx, 300 + i * 130, 617 + Math.sin(t * 1.5 + i) * 1.2, 'own', true, false, 0.8); });
    // Personen
    for (const n of HK.STATIC_NPCS) this.drawPerson(ctx, n.x, n.y, n.color, 'static', 1, this.hover && this.hover.person === n.person);
    for (const w of this.walkers) { const a = this.walkerAlpha(w); if (a <= 0.02) continue; const p = this.walkerPos(w); this.drawPerson(ctx, p.x, p.y, w.color, w.type, a, this.hover && this.hover.walker === w, w.skin); }
    // Rauch, Möwen
    for (const s of this.smoke) { ctx.fillStyle = `rgba(200,200,200,${0.35 * (1 - s.age / 4)})`; ctx.beginPath(); ctx.arc(s.x, s.y, 2 + s.age * 2, 0, 6.28); ctx.fill(); }
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2;
    for (const g of this.gulls) { const x = g.x + Math.cos(g.a) * g.r, y = g.y + Math.sin(g.a) * g.r * 0.4, f = Math.sin(t * 8 + g.a) * 2; ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.quadraticCurveTo(x - 2.5, y - 2 - f, x, y); ctx.quadraticCurveTo(x + 2.5, y - 2 - f, x + 5, y); ctx.stroke(); }
    // Nacht
    const l = this.light();
    if (l < 1) { ctx.fillStyle = `rgba(12,18,48,${(1 - l) * 0.55})`; ctx.fillRect(0, 0, W, H); }
    if (l < 0.6) { // Fenster leuchten
      ctx.fillStyle = `rgba(255,200,90,${(0.6 - l) * 1.2})`;
      for (const b of bs) if (['house', 'hall', 'church'].includes(b.kind) || (b.kind === 'plot' && st.workshops[b.plot].type)) { const rh = b.kind === 'church' ? 30 : Math.round(b.h * 0.35); for (let x = b.x + 8; x < b.x + b.w - 8; x += 16) ctx.fillRect(x, b.y + rh + 12, 5, 7); }
      // Laternen am Kai
      for (let x = 60; x < 960; x += 180) { const grd = ctx.createRadialGradient(x, 526, 2, x, 526, 40); grd.addColorStop(0, `rgba(255,200,90,${(0.6 - l) * 0.6})`); grd.addColorStop(1, 'rgba(255,200,90,0)'); ctx.fillStyle = grd; ctx.fillRect(x - 40, 486, 80, 80); }
    }
    // Hover / Auswahl
    const hb = this.hover && this.hover.building; const sb = this.selected && HK.BUILDING[this.selected];
    if (sb) this.outline(ctx, sb, '#ffd766', 2.5);
    if (hb && hb !== sb) this.outline(ctx, hb, '#ffffff', 1.5);
  },
  outline(ctx, b, color, w) { const top = b.kind === 'church' ? b.y - 40 : b.y - 4; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.setLineDash([4, 3]); ctx.strokeRect(b.x - 3, top, b.w + 6, b.y + b.h + 4 - top + 3); ctx.setLineDash([]); },

  drawWater(ctx, t) {
    const g = ctx.createLinearGradient(0, 540, 0, 640); g.addColorStop(0, '#5f8fae'); g.addColorStop(1, '#3f6a8a');
    ctx.fillStyle = g; ctx.fillRect(0, 542, 960, 98);
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1;
    for (let i = 0; i < 40; i++) { const x = (i * 97 + t * 12) % 980 - 20, y = 552 + (i * 37) % 85 + Math.sin(t + i) * 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 5, y - 2, x + 10, y); ctx.quadraticCurveTo(x + 15, y + 2, x + 20, y); ctx.stroke(); }
  },
  drawCrane(ctx, x, y) {
    ctx.fillStyle = '#5a3f22'; ctx.fillRect(x - 4, y - 46, 8, 46);
    ctx.strokeStyle = '#5a3f22'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y - 44); ctx.lineTo(x + 34, y - 28); ctx.stroke();
    ctx.lineWidth = 1; ctx.strokeStyle = '#333'; ctx.beginPath(); ctx.moveTo(x + 34, y - 28); ctx.lineTo(x + 34, y + 20 + Math.sin(this.time) * 6); ctx.stroke();
    ctx.fillStyle = '#8a6a3a'; ctx.fillRect(x + 28, y + 20 + Math.sin(this.time) * 6, 12, 9);
  },
  drawRoof(ctx, x, y, w, rh, color) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x - 3, y + rh); ctx.lineTo(x + w + 3, y + rh); ctx.lineTo(x + w - 8, y); ctx.lineTo(x + 8, y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; for (let yy = y + 4; yy < y + rh; yy += 5) { ctx.beginPath(); ctx.moveTo(x + 8 - (yy - y) * 0.45, yy); ctx.lineTo(x + w - 8 + (yy - y) * 0.45, yy); ctx.stroke(); }
  },
  drawHouse(ctx, x, y, w, h, wall, roof, opts) {
    opts = opts || {};
    const rh = Math.round(h * 0.35);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x + 4, y + rh + 4, w, h - rh); // Schatten
    ctx.fillStyle = wall; ctx.fillRect(x, y + rh, w, h - rh);
    if (opts.timber !== false) { ctx.strokeStyle = 'rgba(70,45,20,0.55)'; ctx.lineWidth = 2; for (let xx = x + 12; xx < x + w - 4; xx += 16) { ctx.beginPath(); ctx.moveTo(xx, y + rh); ctx.lineTo(xx, y + h); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(x, y + rh + (h - rh) / 2); ctx.lineTo(x + w, y + rh + (h - rh) / 2); ctx.stroke(); }
    if (opts.brick) { ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1; for (let yy = y + rh + 6; yy < y + h; yy += 6) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke(); } }
    ctx.fillStyle = '#3a2a1a'; for (let xx = x + 8; xx < x + w - 8; xx += 16) ctx.fillRect(xx, y + rh + 12, 5, 7); // Fenster
    ctx.fillRect(x + w / 2 - 5, y + h - 14, 10, 14); // Tür
    this.drawRoof(ctx, x, y, w, rh, roof);
    ctx.fillStyle = '#4a3a2a'; ctx.fillRect(x + w - 12, y + 2, 5, 8); // Schornstein
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(x, y + rh, w, h - rh);
  },
  drawFlag(ctx, x, y) { ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x, y - 16, 1.5, 18); ctx.fillStyle = '#e0b040'; ctx.beginPath(); ctx.moveTo(x + 1.5, y - 16); ctx.lineTo(x + 12 + Math.sin(this.time * 4) * 1.5, y - 12); ctx.lineTo(x + 1.5, y - 8); ctx.fill(); },
  drawBuilding(ctx, b, st) {
    const owned = (b.panel === 'house' && st.houses[b.plot].owner === 'player') || (b.panel === 'workshop' && st.workshops[b.plot].type) || (b.id === 'tavern' && st.tavernOwned) || (b.id === 'bathhouse' && st.bathhouseOwned) || b.id === 'kontor' || b.id === 'warehouse';
    switch (b.kind) {
      case 'house': {
        const damaged = b.panel === 'house' && st.houses[b.plot].damaged;
        this.drawHouse(ctx, b.x, b.y, b.w, b.h, damaged ? '#4a4038' : (b.color || HK.pick.constructor && this.houseColor(b)), damaged ? '#2a2420' : this.roofColor(b), {});
        if (b.panel === 'house') { const lvl = st.houses[b.plot].level; for (let i = 1; i < lvl; i++) { ctx.fillStyle = '#e0b040'; ctx.fillRect(b.x + 3 + i * 7, b.y + b.h - 6, 4, 4); } }
        if (b.id === 'tavern') { ctx.fillStyle = '#e0b040'; ctx.beginPath(); ctx.arc(b.x - 6, b.y + b.h * 0.55, 6, 0, 6.28); ctx.fill(); ctx.fillStyle = '#a02020'; ctx.fillRect(b.x - 8, b.y + b.h * 0.55 - 2, 4, 4); }
        if (b.id === 'bathhouse') { ctx.fillStyle = '#5fa0c0'; ctx.beginPath(); ctx.arc(b.x - 6, b.y + b.h * 0.55, 6, 0, 6.28); ctx.fill(); }
        if (b.id === 'customs') { ctx.fillStyle = '#c8102e'; ctx.fillRect(b.x + 4, b.y + b.h * 0.4, 8, 5); ctx.fillStyle = '#fff'; ctx.fillRect(b.x + 4, b.y + b.h * 0.4 + 5, 8, 5); }
        if (b.id === 'bank') { ctx.fillStyle = '#e0b040'; ctx.beginPath(); ctx.arc(b.x + b.w + 6, b.y + b.h * 0.55, 5, 0, 6.28); ctx.fill(); }
        break;
      }
      case 'hall': {
        this.drawHouse(ctx, b.x, b.y, b.w, b.h, b.color || '#b8574a', '#4a3a3a', { timber: false, brick: true });
        // Treppengiebel-Andeutung und Banner
        ctx.fillStyle = '#7a2a2a'; ctx.fillRect(b.x + b.w / 2 - 4, b.y + b.h * 0.35, 8, 22); ctx.fillStyle = '#e0b040'; ctx.fillRect(b.x + b.w / 2 - 2, b.y + b.h * 0.35 + 4, 4, 4);
        break;
      }
      case 'church': {
        const rh = 30;
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(b.x + 5, b.y + rh + 5, b.w, b.h - rh);
        ctx.fillStyle = '#c4614e'; ctx.fillRect(b.x, b.y + rh, b.w, b.h - rh);
        ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1; for (let yy = b.y + rh + 6; yy < b.y + b.h; yy += 6) { ctx.beginPath(); ctx.moveTo(b.x, yy); ctx.lineTo(b.x + b.w, yy); ctx.stroke(); }
        ctx.fillStyle = '#2a2020'; for (let xx = b.x + 44; xx < b.x + b.w - 10; xx += 22) { ctx.beginPath(); ctx.moveTo(xx, b.y + rh + 30); ctx.lineTo(xx, b.y + rh + 14); ctx.arc(xx + 4, b.y + rh + 14, 4, Math.PI, 0); ctx.lineTo(xx + 8, b.y + rh + 30); ctx.fill(); }
        ctx.fillRect(b.x + b.w / 2 - 7, b.y + b.h - 22, 14, 22);
        this.drawRoof(ctx, b.x + 30, b.y, b.w - 30, rh, '#4a4048');
        // Turm
        ctx.fillStyle = '#b8574a'; ctx.fillRect(b.x, b.y - 40, 34, b.h + 40);
        ctx.fillStyle = '#3a3038'; ctx.beginPath(); ctx.moveTo(b.x - 3, b.y - 40); ctx.lineTo(b.x + 37, b.y - 40); ctx.lineTo(b.x + 17, b.y - 78); ctx.fill();
        ctx.strokeStyle = '#e0b040'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b.x + 17, b.y - 80); ctx.lineTo(b.x + 17, b.y - 92); ctx.moveTo(b.x + 12, b.y - 88); ctx.lineTo(b.x + 22, b.y - 88); ctx.stroke();
        ctx.fillStyle = '#2a2020'; ctx.fillRect(b.x + 13, b.y - 30, 8, 14);
        break;
      }
      case 'barn': {
        this.drawHouse(ctx, b.x, b.y, b.w, b.h, '#8a6a42', '#5a4a3a', { timber: false });
        ctx.fillStyle = '#4a3220'; ctx.fillRect(b.x + b.w / 2 - 14, b.y + b.h - 26, 28, 26); ctx.strokeStyle = '#2a1a10'; ctx.beginPath(); ctx.moveTo(b.x + b.w / 2, b.y + b.h - 26); ctx.lineTo(b.x + b.w / 2, b.y + b.h); ctx.stroke();
        break;
      }
      case 'market': {
        const stalls = [[392, 322, '#c23b3b'], [432, 318, '#3b6ac2'], [470, 326, '#3b9a4a'], [508, 318, '#c29a3b'], [548, 324, '#7a3bc2']];
        stalls.forEach(([x, y, c], i) => {
          const mine = i < st.stalls;
          ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x + 2, y + 2, 26, 18);
          ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x, y + 8, 26, 10);
          ctx.fillStyle = mine ? '#e0b040' : c; ctx.fillRect(x - 2, y, 30, 9);
          ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let s = 0; s < 30; s += 8) ctx.fillRect(x - 2 + s, y, 4, 9);
          ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x + 1, y + 9, 2, 12); ctx.fillRect(x + 23, y + 9, 2, 12);
          ctx.fillStyle = ['#d9c56b', '#c94a3a', '#8ab04a', '#c9a24a'][i % 4]; for (let k = 0; k < 4; k++) ctx.fillRect(x + 3 + k * 6, y + 10, 4, 3);
        });
        if (st.town.projects.well) { ctx.fillStyle = '#7a7a72'; ctx.beginPath(); ctx.arc(480, 360, 8, 0, 6.28); ctx.fill(); ctx.fillStyle = '#4f7d9d'; ctx.beginPath(); ctx.arc(480, 360, 5, 0, 6.28); ctx.fill(); ctx.fillStyle = '#5a3a1a'; ctx.fillRect(471, 344, 2, 16); ctx.fillRect(487, 344, 2, 16); ctx.fillStyle = '#6a4a3a'; ctx.fillRect(469, 341, 22, 4); }
        break;
      }
      case 'plot': {
        const ws = st.workshops[b.plot];
        if (!ws.type) {
          ctx.fillStyle = '#9a8a5a'; ctx.fillRect(b.x, b.y + 20, b.w, b.h - 20);
          ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2; ctx.strokeRect(b.x + 2, b.y + 22, b.w - 4, b.h - 24);
          for (let xx = b.x + 6; xx < b.x + b.w; xx += 10) { ctx.beginPath(); ctx.moveTo(xx, b.y + 22); ctx.lineTo(xx, b.y + 30); ctx.stroke(); }
          ctx.fillStyle = 'rgba(120,140,70,0.4)'; ctx.beginPath(); ctx.ellipse(b.x + b.w / 2, b.y + b.h / 2 + 10, 18, 9, 0, 0, 6.28); ctx.fill();
        } else {
          const cols = { brewery: ['#d9b56b', '#6a3a2a'], smokehouse: ['#8a7a6a', '#3a3a3a'], weaver: ['#c9c0a8', '#4a5a7a'], smithy: ['#7a6a5a', '#2a2a2a'], saltworks: ['#e0dcd0', '#5a5a6a'] };
          const c = cols[ws.type] || ['#c9b08a', '#6a3a2a'];
          this.drawHouse(ctx, b.x, b.y, b.w, b.h, c[0], c[1], { timber: ws.type !== 'smithy' });
          ctx.fillStyle = ws.idle ? '#a03030' : '#3a9a4a'; ctx.beginPath(); ctx.arc(b.x - 5, b.y + b.h * 0.5, 4, 0, 6.28); ctx.fill();
        }
        break;
      }
      case 'huts': {
        for (let i = 0; i < 3; i++) this.drawHouse(ctx, b.x + i * 36, b.y + 6, 28, 28, '#9a8a6a', '#5a5a4a', { timber: false });
        ctx.strokeStyle = 'rgba(60,50,40,0.6)'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(b.x + 110 + i * 5, b.y + 8); ctx.lineTo(b.x + 110 + i * 5, b.y + 34); ctx.stroke(); ctx.beginPath(); ctx.moveTo(b.x + 108, b.y + 10 + i * 6); ctx.lineTo(b.x + 130, b.y + 10 + i * 6); ctx.stroke(); }
        break;
      }
      case 'yard': {
        ctx.fillStyle = '#7a6a4a'; ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1; for (let xx = b.x; xx < b.x + b.w; xx += 8) { ctx.beginPath(); ctx.moveTo(xx, b.y); ctx.lineTo(xx, b.y + b.h); ctx.stroke(); }
        ctx.strokeStyle = '#c9a878'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b.x + 20, b.y + 30); ctx.quadraticCurveTo(b.x + 60, b.y + 44, b.x + 100, b.y + 30); ctx.stroke();
        for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(b.x + 25 + i * 14, b.y + 33); ctx.quadraticCurveTo(b.x + 25 + i * 14, b.y + 14, b.x + 32 + i * 14, b.y + 8); ctx.stroke(); }
        ctx.fillStyle = '#5a3a1a'; ctx.fillRect(b.x + 110, b.y + 4, 4, 36);
        break;
      }
      case 'gate': {
        ctx.fillStyle = '#8a8478'; ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = '#6a645a'; ctx.fillRect(b.x, b.y - 14, 20, 20); ctx.fillRect(b.x + 28, b.y - 14, 20, 20);
        ctx.fillStyle = '#2a2420'; ctx.beginPath(); ctx.moveTo(b.x + 14, b.y + b.h); ctx.lineTo(b.x + 14, b.y + 30); ctx.arc(b.x + 24, b.y + 30, 10, Math.PI, 0); ctx.lineTo(b.x + 34, b.y + b.h); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.2)'; for (let yy = b.y + 6; yy < b.y + b.h; yy += 7) { ctx.beginPath(); ctx.moveTo(b.x, yy); ctx.lineTo(b.x + b.w, yy); ctx.stroke(); }
        ctx.fillStyle = '#8a8478'; ctx.fillRect(0, 0, 8, b.y); ctx.fillRect(0, b.y + b.h, 8, 528 - b.y - b.h);
        break;
      }
    }
    if (owned && b.kind !== 'market') this.drawFlag(ctx, b.x + 3, b.y + 6);
    if (b.kind === 'market' && st.stalls) this.drawFlag(ctx, 383, 318);
    // Beschriftung
    const labelled = ['church', 'guild', 'townhall', 'market', 'tavern', 'bank', 'kontor', 'warehouse', 'customs', 'bathhouse', 'bailiff', 'shipyard', 'fishermen', 'gate'];
    if (labelled.includes(b.id)) {
      const short = { church: { de: 'Kirche', en: 'Church' }, guild: { de: 'Gilde', en: 'Guild' }, townhall: { de: 'Rathaus', en: 'Town hall' }, market: { de: 'Markt', en: 'Market' }, tavern: { de: 'Taverne', en: 'Tavern' }, bank: { de: 'Wechsler', en: 'Changer' }, kontor: { de: 'Kontor', en: 'Office' }, warehouse: { de: 'Lager', en: 'Warehouse' }, customs: { de: 'Zoll', en: 'Customs' }, bathhouse: { de: 'Badehaus', en: 'Bathhouse' }, bailiff: { de: 'Vogtei', en: 'Bailiff' }, shipyard: { de: 'Werft', en: 'Shipyard' }, fishermen: { de: 'Fischer', en: 'Fishermen' }, gate: { de: 'Tor', en: 'Gate' } };
      ctx.font = 'bold 10px Georgia, serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(240,230,200,0.85)'; ctx.fillStyle = '#2f2214';
      const lx = b.x + b.w / 2, ly = b.id === 'gate' ? b.y + b.h + 12 : b.y + b.h + 15;
      ctx.strokeText(short[b.id][HK.LANG], lx, ly); ctx.fillText(short[b.id][HK.LANG], lx, ly);
    }
  },
  houseColor(b) { const cols = ['#e3d3ad', '#d9c7a0', '#e8d8b8', '#cfc0a0', '#dccaa8']; return cols[HK.BUILDINGS.indexOf(b) % cols.length]; },
  roofColor(b) { const cols = ['#8a3a2a', '#6a4a3a', '#7a3a3a', '#5a4a4a', '#8a4a2a']; return cols[HK.BUILDINGS.indexOf(b) % cols.length]; },

  drawShip(ctx, x, y, origin, docked, selected, s) {
    s = s || 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(0, 14, 44, 6, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = origin === 'own' ? '#6a4020' : '#4a3018'; ctx.beginPath(); ctx.moveTo(-40, 2); ctx.lineTo(40, 2); ctx.lineTo(46, -8); ctx.lineTo(-44, -8); ctx.quadraticCurveTo(-46, -2, -40, 2); ctx.fill();
    ctx.fillStyle = '#7a5030'; ctx.fillRect(-42, -12, 84, 5);
    ctx.strokeStyle = '#2a1a0a'; ctx.lineWidth = 1; for (let i = -36; i < 40; i += 8) { ctx.beginPath(); ctx.moveTo(i, -8); ctx.lineTo(i, 2); ctx.stroke(); }
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-2, -46, 4, 36);
    if (docked) { ctx.fillStyle = '#e8e0c8'; ctx.fillRect(-14, -44, 28, 6); }
    else { ctx.fillStyle = '#efe6d0'; ctx.beginPath(); ctx.moveTo(-18, -42); ctx.lineTo(18, -42); ctx.quadraticCurveTo(22, -26, 18, -12); ctx.lineTo(-18, -12); ctx.quadraticCurveTo(-22, -26, -18, -42); ctx.fill(); }
    const flag = { luebeck: '#c8102e', bruegge: '#3b6ac2', bergen: '#3b9a4a', danzig: '#c29a3b', riga: '#7a3bc2', stockholm: '#e0c020', london: '#a02020', own: '#e0b040' }[origin] || '#888';
    ctx.fillStyle = flag; ctx.beginPath(); ctx.moveTo(2, -46); ctx.lineTo(12 + Math.sin(this.time * 5) * 2, -43); ctx.lineTo(2, -40); ctx.fill();
    if (selected) { ctx.strokeStyle = '#ffd766'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.strokeRect(-48, -50, 96, 66); ctx.setLineDash([]); }
    ctx.restore();
  },
  drawBoat(ctx, x, y, own) {
    ctx.fillStyle = own ? '#7a5030' : '#5a4030'; ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x + 12, y); ctx.lineTo(x + 9, y + 5); ctx.lineTo(x - 9, y + 5); ctx.fill();
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 12); ctx.stroke();
    ctx.fillStyle = own ? '#e0b040' : '#e8e0c8'; ctx.beginPath(); ctx.moveTo(x, y - 12); ctx.lineTo(x + 7, y - 3); ctx.lineTo(x, y - 3); ctx.fill();
  },
  drawCaravan(ctx, x, y, t) {
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x, y + 8, 26, 5, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x - 18, y - 6, 26, 10); ctx.fillStyle = '#d9cfb0'; ctx.beginPath(); ctx.moveTo(x - 20, y - 6); ctx.quadraticCurveTo(x - 5, y - 20, x + 10, y - 6); ctx.fill();
    ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.arc(x - 12, y + 5, 4, 0, 6.28); ctx.arc(x + 2, y + 5, 4, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#8a6a4a'; ctx.beginPath(); ctx.ellipse(x + 18, y, 9, 5, 0, 0, 6.28); ctx.fill(); ctx.fillRect(x + 24, y - 6, 5, 6);
    ctx.fillStyle = '#c9b078'; ctx.beginPath(); ctx.moveTo(x - 34, y + 6); ctx.lineTo(x - 22, y + 6); ctx.lineTo(x - 28, y - 6); ctx.fill();
    if (this.light() < 0.5) { ctx.fillStyle = `rgba(255,160,60,${0.8 + Math.sin(t * 9) * 0.2})`; ctx.beginPath(); ctx.arc(x - 44, y + 4, 3, 0, 6.28); ctx.fill(); }
  },
  drawPerson(ctx, x, y, color, type, alpha, hover, skin) {
    ctx.save(); ctx.globalAlpha = alpha;
    const sz = type === 'child' ? 0.7 : 1;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x, y + 1, 5 * sz, 2, 0, 0, 6.28); ctx.fill();
    if (hover) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y - 6, 10, 0, 6.28); ctx.stroke(); }
    ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y - 5 * sz, 4 * sz, 6 * sz, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = skin || '#e8c39e'; ctx.beginPath(); ctx.arc(x, y - 12 * sz, 3 * sz, 0, 6.28); ctx.fill();
    if (type === 'merchant' || type === 'static') { ctx.fillStyle = '#2a1a0a'; ctx.fillRect(x - 4, y - 15, 8, 2); ctx.fillRect(x - 2.5, y - 18, 5, 3); }
    if (type === 'guard') { ctx.strokeStyle = '#5a5a5a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 5, y + 1); ctx.lineTo(x + 5, y - 20); ctx.stroke(); }
    if (type === 'monk') { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y - 13, 3.6, Math.PI, 0); ctx.fill(); }
    if (type === 'fisher') { ctx.fillStyle = '#8a8a7a'; ctx.fillRect(x - 7, y - 10, 3, 6); }
    ctx.restore();
  },
};
