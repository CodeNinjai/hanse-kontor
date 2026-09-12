/* Stadtszene Sundhaven, isometrisch: Wasser, Boden, sortierte Objekte, Licht, Wetter */
'use strict';
const I = HK.Iso;

HK.Scene = {
  canvas: null, ctx: null, RS: 2, walkers: [], carts: [], chickens: [], gulls: [], smoke: [], shipAnim: {}, hover: null, selected: null,
  clock: 0.35, time: 0, pat: {}, windows: [], lamps: [], weather: 'clear', weatherDay: -1, lastSeason: null, ground: null, grain: null,

  init(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    canvas.width = HK.SCENE.W * this.RS; canvas.height = HK.SCENE.H * this.RS;
    this.makePatterns(); this.makeGrain();
    for (let i = 0; i < 40; i++) this.walkers.push(this.makeWalker(true));
    for (let i = 0; i < 6; i++) this.gulls.push({ x: HK.rnd(60, 420), y: HK.rnd(80, 560), a: HK.rnd(0, 6.28), r: HK.rnd(25, 60), s: HK.rnd(0.25, 0.6) });
    this.carts = [{ a: [9.5, 2.8], b: [9.5, 15.8], t: 0.2, dir: 1, v: 0.25, ox: true }, { a: [8.0, 10], b: [23.2, 10], t: 0.7, dir: -1, v: 0.2, ox: false }];
    for (let i = 0; i < 5; i++) this.chickens.push({ cx: i < 3 ? 8.4 : 17.0, cy: i < 3 ? 3.3 : 9.7, x: 0, y: 0, t: Math.random() * 10, a: Math.random() * 6.28 });
    canvas.addEventListener('mousemove', e => { const p = this.toScene(e); const h = this.hit(p.x, p.y); this.hover = h; canvas.style.cursor = h ? 'pointer' : 'default'; this.tooltip(h, e); });
    canvas.addEventListener('mouseleave', () => { this.hover = null; this.tooltip(null); });
    canvas.addEventListener('click', e => { const p = this.toScene(e); const h = this.hit(p.x, p.y); if (h) HK.UI.sceneClick(h); });
  },
  toScene(e) { const r = this.canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * HK.SCENE.W / r.width, y: (e.clientY - r.top) * HK.SCENE.H / r.height }; },
  toWorld(sx, sy) { const a = (sx - I.OX) / I.TW, b = (sy - I.OY) / I.TH; return { x: (a + b) / 2, y: (b - a) / 2 }; },
  tooltip(h, e) {
    const tip = document.getElementById('tooltip');
    if (!h) { tip.hidden = true; return; }
    tip.hidden = false; tip.textContent = h.label;
    const wrap = this.canvas.parentElement.getBoundingClientRect();
    tip.style.left = (e.clientX - wrap.left + 14) + 'px'; tip.style.top = (e.clientY - wrap.top + 14) + 'px';
  },
  makePatterns() {
    const mk = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w * this.RS; c.height = h * this.RS; const g = c.getContext('2d'); g.scale(this.RS, this.RS); fn(g, w, h); const pat = this.ctx.createPattern(c, 'repeat'); if (pat.setTransform) pat.setTransform(new DOMMatrix().scale(1 / this.RS)); return pat; };
    this.pat.cobble = mk(20, 10, (g) => { g.fillStyle = '#a89f8a'; g.fillRect(0, 0, 20, 10); for (const [x, y, w, h] of [[1, 1, 7, 3.5], [10, 0.5, 8, 4], [0, 5.5, 6, 4], [8, 5.5, 5, 4], [15, 5.5, 5, 4]]) { g.fillStyle = (x + y) % 3 ? '#b3aa94' : '#9d947f'; g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 6.28); g.fill(); g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.ellipse(x + w / 2 - 1, y + h / 2 - 1, w / 3, h / 4, 0, 0, 6.28); g.fill(); } });
    this.pat.earth = mk(40, 40, (g, w, h) => { g.fillStyle = '#b3a57c'; g.fillRect(0, 0, w, h); for (let i = 0; i < 160; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(90,70,40,0.18)' : 'rgba(255,245,220,0.14)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 1.5); } });
    this.pat.grass = mk(30, 30, (g, w, h) => { g.fillStyle = '#6f8f46'; g.fillRect(0, 0, w, h); for (let i = 0; i < 110; i++) { g.strokeStyle = Math.random() < 0.5 ? 'rgba(40,70,20,0.4)' : 'rgba(190,220,110,0.35)'; const x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 1, y - 3); g.stroke(); } for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(120,150,70,0.35)'; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 5, 2.5, 0, 0, 6.28); g.fill(); } });
    this.pat.snow = mk(30, 30, (g, w, h) => { g.fillStyle = '#e9edf0'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(180,195,215,0.35)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 1); } });
    this.pat.stone = mk(24, 12, (g) => { g.fillStyle = '#8f887a'; g.fillRect(0, 0, 24, 12); g.fillStyle = '#6f685c'; g.fillRect(0, 5, 24, 1); g.fillRect(0, 11, 24, 1); g.fillRect(11, 0, 1, 5); g.fillRect(4, 6, 1, 5); g.fillRect(18, 6, 1, 5); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, 0, 11, 2); g.fillRect(12, 0, 12, 2); });
    this.pat.planks = mk(8, 24, (g) => { g.fillStyle = '#8a6a44'; g.fillRect(0, 0, 8, 24); g.fillStyle = '#5f4630'; g.fillRect(7, 0, 1, 24); g.fillStyle = 'rgba(255,220,170,0.15)'; g.fillRect(1, 0, 1, 24); g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(0, 11, 8, 1); });
    this.pat.field = mk(24, 24, (g) => { g.fillStyle = '#b9a35a'; g.fillRect(0, 0, 24, 24); g.strokeStyle = 'rgba(90,70,30,0.35)'; for (let i = 0; i < 24; i += 4) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 12, 24); g.stroke(); } });
  },
  makeGrain() { const c = document.createElement('canvas'); c.width = 240; c.height = 160; const g = c.getContext('2d'); const img = g.createImageData(240, 160); for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (Math.random() - 0.5) * 90; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; } g.putImageData(img, 0, 0); this.grain = c; },

  /* ---------- Zeit, Licht, Jahreszeit ---------- */
  KEYS: [
    { c: 0.00, top: [8, 14, 40], near: [12, 26, 48], far: [24, 42, 70], tint: [8, 16, 60, 0.58], amb: 0.28 },
    { c: 0.20, top: [10, 16, 46], near: [12, 26, 50], far: [28, 46, 76], tint: [8, 16, 60, 0.54], amb: 0.3 },
    { c: 0.26, top: [70, 70, 120], near: [60, 90, 120], far: [210, 150, 120], tint: [255, 150, 80, 0.16], amb: 0.7 },
    { c: 0.34, top: [122, 176, 224], near: [46, 96, 140], far: [120, 165, 195], tint: [255, 225, 170, 0.07], amb: 0.95 },
    { c: 0.50, top: [92, 150, 214], near: [36, 92, 140], far: [88, 140, 185], tint: [255, 255, 255, 0], amb: 1 },
    { c: 0.66, top: [110, 140, 200], near: [48, 92, 132], far: [150, 150, 150], tint: [255, 210, 150, 0.08], amb: 0.95 },
    { c: 0.76, top: [96, 90, 160], near: [54, 78, 116], far: [215, 140, 110], tint: [255, 140, 60, 0.2], amb: 0.75 },
    { c: 0.84, top: [40, 40, 96], near: [24, 42, 72], far: [100, 66, 96], tint: [50, 30, 90, 0.38], amb: 0.45 },
    { c: 0.90, top: [10, 16, 44], near: [12, 26, 50], far: [26, 44, 74], tint: [8, 16, 60, 0.56], amb: 0.3 },
    { c: 1.00, top: [8, 14, 40], near: [12, 26, 48], far: [24, 42, 70], tint: [8, 16, 60, 0.58], amb: 0.28 },
  ],
  palette() {
    const c = this.clock, K = this.KEYS; let i = 0;
    while (i < K.length - 2 && K[i + 1].c <= c) i++;
    const a = K[i], b = K[i + 1], t = (c - a.c) / (b.c - a.c);
    const mix = (u, v) => u.map((x, k) => x + (v[k] - x) * t);
    const p = { top: mix(a.top, b.top), near: mix(a.near, b.near), far: mix(a.far, b.far), tint: mix(a.tint, b.tint), amb: a.amb + (b.amb - a.amb) * t };
    if (this.weather === 'rain') { const g = v => v.map((x, k) => (x * 0.6 + [110, 115, 125][k] * 0.4)); p.top = g(p.top); p.near = g(p.near); p.far = g(p.far); p.amb *= 0.8; }
    return p;
  },
  rgb: (v, a) => `rgba(${v[0] | 0},${v[1] | 0},${v[2] | 0},${a === undefined ? 1 : a})`,
  light() { return this.palette().amb; },
  sunT() { const c = this.clock; return c >= 0.24 && c <= 0.80 ? (c - 0.24) / 0.56 : null; },
  shadowVec() { const t = this.sunT(); if (t === null) return { v: [0.25, 0.25], a: 0.12 }; const len = 0.35 + 0.9 * (1 - Math.sin(t * Math.PI)); return { v: [(0.6 - t) * 1.4 * len + 0.1, 0.35 * len + 0.15], a: 0.2 + 0.12 * Math.sin(t * Math.PI) }; },
  season() { const m = HK.state ? HK.monthOf(HK.state.day) : 5; return [11, 0, 1].includes(m) ? 'winter' : [8, 9, 10].includes(m) ? 'autumn' : m <= 3 ? 'spring' : 'summer'; },
  rollWeather() { const s = this.season(), r = Math.random(); this.weather = s === 'winter' ? (r < 0.3 ? 'snow' : r < 0.5 ? 'rain' : r < 0.75 ? 'cloudy' : 'clear') : s === 'autumn' ? (r < 0.3 ? 'rain' : r < 0.6 ? 'cloudy' : 'clear') : (r < 0.12 ? 'rain' : r < 0.35 ? 'cloudy' : 'clear'); },

  /* ---------- Passanten ---------- */
  makeWalker(anywhere) {
    const types = []; HK.WALKER_TYPES.forEach(t => { for (let i = 0; i < t.weight; i++) types.push(t); });
    const t = HK.pick(types), keys = Object.keys(HK.ROAD_NODES);
    const from = HK.pick(keys), to = HK.pick(HK.ROAD_ADJ[from]);
    return { type: t.id, color: HK.pick(t.colors), from, to, t: anywhere ? Math.random() : 0, speed: HK.rnd(0.25, 0.5) * (t.id === 'child' ? 1.5 : t.id === 'beggar' ? 0.6 : 1), off: HK.rnd(-0.22, 0.22), pause: 0, nightOwl: Math.random() < 0.2 || t.id === 'guard', skin: HK.pick(['#e8c39e', '#d9a98a', '#c9946c']), hat: Math.random() < 0.5, basket: Math.random() < 0.3, phase: Math.random() * 6.28 };
  },
  walkerWorld(w) {
    const A = HK.ROAD_NODES[w.from], B = HK.ROAD_NODES[w.to];
    const dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy) || 1;
    return { wx: A[0] + dx * w.t - dy / len * w.off, wy: A[1] + dy * w.t + dx / len * w.off, len, dir: (dx - dy) >= 0 ? 1 : -1 };
  },
  walkerPos(w) { const q = this.walkerWorld(w); const s = I.p(q.wx, q.wy, 0); return { x: s[0], y: s[1], wx: q.wx, wy: q.wy, len: q.len, dir: q.dir }; },
  walkerAlpha(w) {
    const l = this.light(), plague = HK.state && HK.state.town.events.some(e => e.type === 'plague');
    let a = w.nightOwl ? 1 : HK.clamp((l - 0.35) * 2.2, 0, 1);
    if (plague && !w.nightOwl && w.type !== 'monk') a *= 0.3;
    if (this.weather === 'rain' && !w.nightOwl) a *= 0.55;
    return a;
  },

  update(dt) {
    this.time += dt;
    const st = HK.state;
    if (st && st.day !== this.weatherDay) { this.weatherDay = st.day; if (Math.random() < 0.45 || this.weatherDay === 0) this.rollWeather(); }
    for (const w of this.walkers) {
      if (w.pause > 0) { w.pause -= dt; continue; }
      const q = this.walkerWorld(w);
      w.t += w.speed * dt / q.len; w.phase += dt * 9;
      if (w.t >= 1) { const prev = w.from; w.from = w.to; w.t = 0; const opts = HK.ROAD_ADJ[w.from].filter(n => n !== prev); w.to = HK.pick(opts.length ? opts : HK.ROAD_ADJ[w.from]); if (Math.random() < 0.15) w.pause = HK.rnd(1, 4); }
    }
    for (const c of this.carts) { const len = Math.hypot(c.b[0] - c.a[0], c.b[1] - c.a[1]); c.t += c.dir * c.v * dt / len; if (c.t > 1) { c.t = 1; c.dir = -1; } if (c.t < 0) { c.t = 0; c.dir = 1; } }
    for (const ch of this.chickens) { ch.t += dt; if (ch.t > 2) { ch.t = 0; ch.a = Math.random() * 6.28; } ch.x = ch.cx + Math.cos(ch.a) * 0.3 * Math.sin(ch.t * 1.5); ch.y = ch.cy + Math.sin(ch.a) * 0.3 * Math.sin(ch.t * 1.5); }
    for (const g of this.gulls) g.a += g.s * dt;
    if (st) {
      st.ships.forEach((s, i) => {
        const b = HK.BERTHS[i]; let a = this.shipAnim[s.id];
        if (!a) a = this.shipAnim[s.id] = { x: HK.ARRIVE_POINT.x, y: HK.ARRIVE_POINT.y, tx: b.x, ty: b.y, heading: 0, leaving: false, name: s.name, origin: s.origin };
        a.tx = b.x; a.ty = b.y;
        const dx = a.tx - a.x, dy = a.ty - a.y, dist = Math.hypot(dx, dy);
        if (dist > 0.02) { const step = Math.min(dist, 1.1 * dt); a.x += dx / dist * step; a.y += dy / dist * step; const target = Math.atan2(dy, dx); a.heading += (Math.atan2(Math.sin(target - a.heading), Math.cos(target - a.heading))) * Math.min(1, dt * 2); }
        else { a.x = a.tx; a.y = a.ty; a.heading += Math.atan2(Math.sin(HK.BERTH_HEADING - a.heading), Math.cos(HK.BERTH_HEADING - a.heading)) * Math.min(1, dt * 2); }
      });
      for (const id in this.shipAnim) {
        const a = this.shipAnim[id];
        if (!st.ships.some(s => String(s.id) === id)) { a.leaving = true; const dx = HK.LEAVE_POINT.x - a.x, dy = HK.LEAVE_POINT.y - a.y, dist = Math.hypot(dx, dy); const step = 0.9 * dt; a.x += dx / dist * step; a.y += dy / dist * step; const target = Math.atan2(dy, dx); a.heading += Math.atan2(Math.sin(target - a.heading), Math.cos(target - a.heading)) * Math.min(1, dt * 2); if (dist < 0.5) delete this.shipAnim[id]; }
      }
      const chimneys = [];
      for (const b of HK.BUILDINGS) { if (['eave', 'gable', 'hall', 'townhall'].includes(b.kind)) chimneys.push(I.p(b.x + b.w * 0.75, b.y + b.d * 0.4, b.h + b.d * 0.5)); if (b.kind === 'plot' && st.workshops[b.plot].type && !st.workshops[b.plot].idle) { const p = I.p(b.x + b.w * 0.7, b.y + b.d * 0.4, b.h + 0.5); chimneys.push(p, p); } }
      if (Math.random() < dt * 5) { const c = HK.pick(chimneys); this.smoke.push({ x: c[0], y: c[1], age: 0, vx: HK.rnd(-3, 3) + (this.weather === 'rain' ? -6 : 0) }); }
      this.smoke = this.smoke.filter(s => (s.age += dt) < 4.5);
      for (const s of this.smoke) { s.y -= 9 * dt; s.x += s.vx * dt; }
    }
  },
  snapShips() { this.shipAnim = {}; if (!HK.state) return; HK.state.ships.forEach((s, i) => { const b = HK.BERTHS[i]; this.shipAnim[s.id] = { x: b.x, y: b.y, tx: b.x, ty: b.y, heading: HK.BERTH_HEADING, leaving: false, name: s.name, origin: s.origin }; }); },
  isWater(wx, wy) { return wx < HK.WORLD.COAST_X || wy > HK.WORLD.COAST_Y; },

  /* ---------- Trefferprüfung ---------- */
  hit(x, y) {
    const st = HK.state; if (!st) return null;
    if (!this.pickCanvas || this.time - this.pickTime > 0.25) this.renderPick();
    const px = Math.round(HK.clamp(x, 0, HK.SCENE.W - 1)), py = Math.round(HK.clamp(y, 0, HK.SCENE.H - 1));
    const d = this.pickCtx.getImageData(px, py, 1, 1).data; const k = d[0] / 255;
    if (k > 0.3) { const code = Math.round(d[1] / k) + (Math.round(d[2] / k) << 8); const id = Math.round(code / 3); if (id > 0 && this.pickTable && this.pickTable[id]) return this.pickTable[id]; }
    const wpt = this.toWorld(x, y); if (this.isWater(wpt.x, wpt.y) && wpt.x > -12 && wpt.y < 30) return { kind: 'building', building: HK.BUILDING.harbour, panel: 'harbour', label: HK.t('harbour') };
    return null;
  },
  shipHull(x, y, h, s) { const c = Math.cos(h), sn = Math.sin(h), pts = []; for (const [u, v] of [[-1.15, -0.4], [1.2, -0.4], [1.2, 0.4], [-1.15, 0.4]]) for (const z of [0, 2.5]) pts.push(I.p(x + (u * c - v * sn) * s, y + (u * sn + v * c) * s, z * s)); return I.hull(pts); },

  /* Tiefenschlüssel für Punktobjekte: vor einer Gebäudefront stehende Personen kommen vor das Gebäude */
  pointKey(px, py) {
    let k = px + py + 0.1;
    for (const b of this.solids) { const bk = b.x + b.w + b.y + b.d; if (bk <= k) continue; const frontY = py >= b.y + b.d - 0.05 && py <= b.y + b.d + 1.6 && px >= b.x - 0.4 && px <= b.x + b.w + 0.4; const frontX = px >= b.x + b.w - 0.05 && px <= b.x + b.w + 1.6 && py >= b.y - 0.4 && py <= b.y + b.d + 0.4; if (frontY || frontX) k = bk + 0.05; }
    return k;
  },
  /* Alle sortierten Objekte; f(ctx) zeichnet, pick beschreibt das Trefferobjekt */
  buildItems(ctx, st, season, t) {
    const items = [], sv = this.shadowVec();
    this.solids = HK.BUILDINGS.filter(b => b.kind !== 'water' && b.kind !== 'market' && b.h > 0);
    for (const b of HK.BUILDINGS) if (b.kind !== 'water' && b.kind !== 'market') items.push({ k: b.x + b.w + b.y + b.d, f: c => this.drawBuilding(c, b, st, season, sv), pick: b.panel ? { kind: 'building', building: b, panel: b.panel, label: HK.name(b) } : null });
    const m = HK.BUILDING.market; items.push({ k: 0, f: c => { if (this.picking) I.poly(c, [[m.x, m.y, 0], [m.x + m.w, m.y, 0], [m.x + m.w, m.y + m.d, 0], [m.x, m.y + m.d, 0]], '#000'); }, pick: { kind: 'building', building: m, panel: 'market', label: HK.name(m) } });
    for (const seg of this.wallSegments()) items.push({ k: seg.k, f: c => seg.f(c, sv) });
    for (const tr of HK.TREES) items.push({ k: tr[0] + tr[1] + tr[2], f: c => this.drawTree(c, tr[0], tr[1], tr[2], season, sv) });
    for (const p of HK.PROPS) items.push({ k: p.x + p.y + 0.3, f: c => this.drawProp(c, p, st, sv) });
    items.push({ k: HK.MOLE.x + HK.MOLE.y1 + 1, f: c => this.drawMole(c, sv) });
    items.push({ k: HK.ISLET.x + HK.ISLET.y, f: c => this.drawIslet(c, season, sv) });
    items.push({ k: HK.GUARD_SHIP.x + HK.GUARD_SHIP.y + 0.6, f: c => this.drawShip(c, HK.GUARD_SHIP.x, HK.GUARD_SHIP.y, HK.GUARD_SHIP.heading, 1.05, 'guard', true, false) });
    items.push({ k: HK.WINDMILL.x + HK.WINDMILL.y + 1, f: c => this.drawWindmill(c, t, sv) });
    items.push({ k: HK.FARM.x + HK.FARM.w + HK.FARM.y + HK.FARM.d, f: c => this.drawFarm(c, season, sv) });
    for (const p of HK.PIERS) items.push({ k: p.x + p.y1 + 0.5, f: c => this.drawPier(c, p, t) });
    st.ownShips.forEach((sh, i) => { if (sh.status === 'port') { const b = HK.OWN_BERTHS[i]; items.push({ k: b.x + b.y + 0.5, f: c => this.drawShip(c, b.x, b.y, HK.BERTH_HEADING + 0.3, 0.8, 'own', true, false), pick: { kind: 'building', building: HK.BUILDING.harbour, panel: 'harbour', label: sh.name } }); } });
    for (const id in this.shipAnim) { const a = this.shipAnim[id]; const sh = st.ships.find(x => String(x.id) === id); items.push({ k: a.x + a.y + 0.6, f: c => this.drawShip(c, a.x, a.y, a.heading, HK.SHIP_SCALE, a.origin, !a.leaving && Math.abs(a.x - a.tx) + Math.abs(a.y - a.ty) < 0.05, HK.UI.selectedVisitor === Number(id) && !a.leaving), pick: sh && !a.leaving ? { kind: 'visitor', id: sh.id, panel: 'harbour', label: sh.name + ' (' + HK.name(HK.ORIGIN[sh.origin]) + ')' } : null }); }
    const nBoats = Math.min(4, 2 + st.boats);
    for (let i = 0; i < nBoats; i++) { const b = HK.BOAT_SPOTS[i]; items.push({ k: b.x + b.y, f: c => this.drawBoat(c, b.x, b.y, i >= 2, t + i) }); }
    st.caravans.forEach((cv, i) => { const sp = HK.CARAVAN_SPOTS[i]; items.push({ k: sp.x + sp.y + 0.6, f: c => this.drawCaravan(c, sp.x, sp.y, t + i, sv), pick: { kind: 'visitor', id: cv.id, panel: 'gate', label: HK.t('caravanFrom', { origin: HK.name(HK.ORIGIN[cv.origin]) }) } }); });
    for (const c0 of this.carts) { const wx = c0.a[0] + (c0.b[0] - c0.a[0]) * c0.t, wy = c0.a[1] + (c0.b[1] - c0.a[1]) * c0.t; items.push({ k: this.pointKey(wx, wy), f: c => this.drawCart(c, wx, wy, c0, t) }); }
    for (const ch of this.chickens) items.push({ k: this.pointKey(ch.x, ch.y), f: c => { const s2 = I.p(ch.x, ch.y, 0); this.drawChicken(c, s2[0], s2[1], t); } });
    for (const n of HK.STATIC_NPCS) { const pp = HK.PERSON[n.person]; items.push({ k: this.pointKey(n.x, n.y), f: c => { const s2 = I.p(n.x, n.y, 0); this.drawPerson(c, s2[0], s2[1], n.color, 'static', 1, this.hover && this.hover.person === n.person, null, 0, 1, n.person); }, pick: { kind: 'person', person: n.person, label: pp.name + ', ' + (pp.title[HK.LANG] || pp.title.de) } }); }
    for (const w of this.walkers) { const a = this.walkerAlpha(w); if (a <= 0.02) continue; const p = this.walkerPos(w); items.push({ k: this.pointKey(p.wx, p.wy), f: c => this.drawPerson(c, p.x, p.y, w.color, w.type, a, this.hover && this.hover.walker === w, w.skin, w.pause > 0 ? 0 : w.phase, p.dir, null, w), pick: a >= 0.4 ? { kind: 'walker', walker: w, label: HK.t('enc_' + w.type + '_label') } : null }); }
    items.sort((a, b) => a.k - b.k);
    return items;
  },
  /* Pick-Kanal: jedes anklickbare Objekt in eigener Kennfarbe */
  renderPick() {
    const st = HK.state; if (!st) return;
    if (!this.pickCanvas) { this.pickCanvas = document.createElement('canvas'); this.pickCanvas.width = HK.SCENE.W; this.pickCanvas.height = HK.SCENE.H; this.pickCtx = this.pickCanvas.getContext('2d', { willReadFrequently: true }); }
    const real = this.pickCtx; let color = '#000';
    const noop = () => {};
    const proxy = new Proxy(real, { get: (t, k) => { if (k === 'stroke' || k === 'strokeRect' || k === 'strokeText' || k === 'fillText') return noop; const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; }, set: (t, k, v) => { if (k === 'fillStyle' || k === 'strokeStyle') t[k] = color; else if (k === 'globalAlpha') t[k] = 1; else t[k] = v; return true; } });
    real.setTransform(1, 0, 0, 1, 0, 0); real.fillStyle = '#000'; real.fillRect(0, 0, HK.SCENE.W, HK.SCENE.H);
    const savedW = this.windows, savedL = this.lamps; this.windows = []; this.lamps = []; this.picking = true;
    const items = this.buildItems(proxy, st, this.season(), this.time);
    this.pickTable = [null];
    for (const it of items) { if (!it.pick) continue; const id = this.pickTable.length; this.pickTable.push(it.pick); const code = id * 3; color = `rgb(255,${code & 255},${(code >> 8) & 255})`; real.fillStyle = color; real.strokeStyle = color; it.f(proxy); }
    this.picking = false; this.windows = savedW; this.lamps = savedL; this.pickTime = this.time;
  },

  /* ---------- Zeichnen ---------- */
  draw() {
    const ctx = this.ctx, st = HK.state; if (!st) return;
    ctx.setTransform(this.RS, 0, 0, this.RS, 0, 0);
    const P = this.palette(), t = this.time, W = HK.SCENE.W, H = HK.SCENE.H, season = this.season();
    if (season !== this.lastSeason) { this.lastSeason = season; this.makeGround(season); }
    this.windows = []; this.lamps = [];
    this.drawWater(ctx, P, t);
    ctx.drawImage(this.ground, 0, 0, W, H);
    this.drawCoast(ctx, P, t);
    for (const it of this.buildItems(ctx, st, season, t)) it.f(ctx);
    // Rauch, Möwen
    for (const s of this.smoke) { ctx.fillStyle = `rgba(215,215,220,${0.32 * (1 - s.age / 4.5)})`; ctx.beginPath(); ctx.arc(s.x, s.y, 1.5 + s.age * 2, 0, 6.28); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.1;
    for (const g of this.gulls) { const x = g.x + Math.cos(g.a) * g.r, y = g.y + Math.sin(g.a) * g.r * 0.5, f = Math.sin(t * 8 + g.a) * 2; ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.quadraticCurveTo(x - 2, y - 1.5 - f, x, y); ctx.quadraticCurveTo(x + 2, y - 1.5 - f, x + 4, y); ctx.stroke(); }
    this.drawWeather(ctx, t);
    this.drawLighting(ctx, P, t);
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(20,10,0,0.4)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = 0.04; ctx.globalCompositeOperation = 'overlay'; for (let y = 0; y < H; y += 160) for (let x = 0; x < W; x += 240) ctx.drawImage(this.grain, x + ((t * 30) | 0) % 7, y); ctx.restore();
    const hb = this.hover && this.hover.building, sb = this.selected && HK.BUILDING[this.selected];
    if (sb && sb.kind !== 'water') this.outline(ctx, sb, 'rgba(255,215,102,0.95)', 2);
    if (hb && hb !== sb && hb.kind !== 'water') this.outline(ctx, hb, 'rgba(255,255,255,0.85)', 1.2);
  },
  outline(ctx, b, color, w) { const hh = b.kind === 'church' ? 6.2 : b.h + Math.min(b.w, b.d) * 0.7 + 0.2; const hull = I.boxHull(b.x - 0.1, b.y - 0.1, b.w + 0.2, b.d + 0.2, hh); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.setLineDash([5, 4]); ctx.beginPath(); hull.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]); },

  /* Wasser über die ganze Fläche, Wellen und Glitzern */
  drawWater(ctx, P, t) {
    const W = HK.SCENE.W, H = HK.SCENE.H;
    const g = ctx.createLinearGradient(0, 0, W * 0.3, H); g.addColorStop(0, this.rgb(P.far)); g.addColorStop(1, this.rgb(P.near)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // Farbflecken (Tiefe, Strömung)
    for (let i = 0; i < 26; i++) { const x = (i * 173) % W, y = (i * 97 + 40) % H, r = 60 + (i % 5) * 30; const gr = ctx.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, i % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,10,30,0.10)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
    // Flachwasser an der Küste
    const cx = HK.WORLD.COAST_X, cy = HK.WORLD.COAST_Y; I.poly(ctx, [[cx, 1.2, 0], [cx, cy + 0.5, 0], [cx - 1.4, cy + 1.9, 0], [cx - 1.4, 1.2, 0]], 'rgba(120,190,190,0.16)'); I.poly(ctx, [[cx, cy + 0.5, 0], [24.8, cy + 0.5, 0], [24.8, cy + 1.9, 0], [cx, cy + 1.9, 0]], 'rgba(120,190,190,0.16)');
    ctx.strokeStyle = `rgba(255,255,255,${0.08 + 0.14 * P.amb})`; ctx.lineWidth = 1;
    for (let i = 0; i < 260; i++) { const x = ((i * 137 + t * 9) % (W + 60)) - 30, y = ((i * 89 + (i % 3) * 7) % (H + 20)) - 10 + Math.sin(t * 1.4 + i) * 1.5; const len = 6 + (i % 5) * 2.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + len / 2, y - 1.5, x + len, y); ctx.stroke(); }
    const st = this.sunT();
    if (st !== null && this.weather !== 'rain') { const lx = 60 + 260 * st, ly = 260 + 120 * Math.sin(st * Math.PI); for (let i = 0; i < 70; i++) { const x = lx + Math.cos(i * 2.4) * 90 * Math.sqrt((i % 10) / 10), y = ly + Math.sin(i * 2.4) * 50 * Math.sqrt((i % 10) / 10); const a = 0.35 * (0.5 + 0.5 * Math.sin(t * 5 + i)); ctx.fillStyle = `rgba(255,245,210,${a})`; ctx.fillRect(x, y, 4, 1.2); } }
    const c = this.clock, fog = c > 0.22 && c < 0.42 ? 1 - Math.abs(c - 0.3) / 0.12 : 0;
    if (fog > 0) { for (let i = 0; i < 8; i++) { const x = 40 + i * 70 + Math.sin(t * 0.3 + i) * 20, y = 120 + (i % 3) * 140 + i * 20; const gr = ctx.createRadialGradient(x, y, 5, x, y, 110); gr.addColorStop(0, `rgba(235,235,240,${0.35 * fog})`); gr.addColorStop(1, 'rgba(235,235,240,0)'); ctx.fillStyle = gr; ctx.fillRect(x - 110, y - 110, 220, 220); } }
  },
  /* Kaikanten: sichtbare Südmauer, Schatten und Gischt an der Westkante */
  drawCoast(ctx, P, t) {
    const cx = HK.WORLD.COAST_X, cy = HK.WORLD.COAST_Y;
    // Schatten der Kaimauer im Wasser (West)
    I.poly(ctx, [[cx, 1.4, 0], [cx, cy + 0.4, 0], [cx - 0.45, cy + 0.4, 0], [cx - 0.45, 1.4, 0]], 'rgba(10,20,40,0.28)');
    // Südmauer (sichtbare +y-Fläche)
    I.poly(ctx, [[cx, cy + 0.4, 0], [24.5, cy + 0.4, 0], [24.5, cy + 0.4, 0.4], [cx, cy + 0.4, 0.4]], '#6f685c', 'rgba(20,15,10,0.5)');
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; for (let x = cx; x < 24.5; x += 0.5) I.line(ctx, [x, cy + 0.4, 0], [x, cy + 0.4, 0.4], 'rgba(0,0,0,0.2)', 0.6);
    I.line(ctx, [cx, cy + 0.4, 0.2], [24.5, cy + 0.4, 0.2], 'rgba(0,0,0,0.2)', 0.6);
    I.poly(ctx, [[cx, cy + 0.4, 0], [24.5, cy + 0.4, 0], [24.5, cy + 0.6, 0], [cx, cy + 0.6, 0]], 'rgba(40,70,60,0.4)');
    // Gischt
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let y = 1.6; y < cy; y += 0.25) { const p = I.p(cx - 0.05, y, 0); if ((y * 13 | 0) % 3 === 0) ctx.fillRect(p[0] - 2 + Math.sin(t * 3 + y * 5), p[1], 3, 1); }
    for (let x = cx; x < 24.5; x += 0.25) { const p = I.p(x, cy + 0.65, 0); if ((x * 13 | 0) % 3 === 0) ctx.fillRect(p[0] - 2 + Math.sin(t * 3 + x * 5), p[1], 3, 1); }
  },
  makeGround(season) {
    const c = document.createElement('canvas'); c.width = HK.SCENE.W * this.RS; c.height = HK.SCENE.H * this.RS; const g = c.getContext('2d'); g.scale(this.RS, this.RS);
    const cx = HK.WORLD.COAST_X, cy = HK.WORLD.COAST_Y;
    const poly = (pts, fill, stroke) => { g.beginPath(); pts.forEach((q, i) => { const s = I.p(q[0], q[1], 0); i ? g.lineTo(s[0], s[1]) : g.moveTo(s[0], s[1]); }); g.closePath(); g.fillStyle = fill; g.fill(); if (stroke) { g.strokeStyle = stroke; g.lineWidth = 0.8; g.stroke(); } };
    // Land
    poly([[cx, -30, 0], [60, -30, 0], [60, cy + 0.4, 0], [cx, cy + 0.4, 0]], season === 'winter' ? this.pat.snow : this.pat.grass);
    if (season !== 'winter') { for (let i = 0; i < 90; i++) { const x = cx + Math.random() * 40, y = -25 + Math.random() * 42; if (y > cy) continue; const s = I.p(x, y, 0); g.fillStyle = i % 3 ? 'rgba(40,80,25,0.18)' : 'rgba(200,220,120,0.16)'; g.beginPath(); g.ellipse(s[0], s[1], 8 + Math.random() * 22, 4 + Math.random() * 9, 0, 0, 6.28); g.fill(); } }
    // Stadtboden
    poly([[cx, 1.4, 0], [24.6, 1.4, 0], [24.6, cy + 0.4, 0], [cx, cy + 0.4, 0]], season === 'winter' ? this.pat.snow : this.pat.earth);
    // Kaistreifen
    poly([[cx, 1.4, 0], [cx + 0.5, 1.4, 0], [cx + 0.5, cy + 0.4, 0], [cx, cy + 0.4, 0]], this.pat.stone, 'rgba(0,0,0,0.3)');
    poly([[cx, cy - 0.1, 0], [24.6, cy - 0.1, 0], [24.6, cy + 0.4, 0], [cx, cy + 0.4, 0]], this.pat.stone, 'rgba(0,0,0,0.3)');
    // Felder
    for (const [fx, fy, fw, fd] of HK.FIELDS) { poly([[fx, fy, 0], [fx + fw, fy, 0], [fx + fw, fy + fd, 0], [fx, fy + fd, 0]], season === 'winter' ? '#d8dbe0' : this.pat.field, 'rgba(60,40,20,0.35)'); for (let k = 0.35; k < fd; k += 0.35) { const a = I.p(fx, fy + k, 0), b = I.p(fx + fw, fy + k, 0); g.strokeStyle = 'rgba(70,50,20,0.3)'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); } }
    // Straßen
    for (const [x1, y1, x2, y2, w] of HK.STREETS) { const pts = y1 === y2 ? [[x1, y1 - w / 2, 0], [x2, y1 - w / 2, 0], [x2, y1 + w / 2, 0], [x1, y1 + w / 2, 0]] : [[x1 - w / 2, y1, 0], [x1 + w / 2, y1, 0], [x1 + w / 2, y2, 0], [x1 - w / 2, y2, 0]]; const outside = x1 > 24 || x2 > 24 || y1 < 1.4 || y2 < 1.4; poly(pts, season === 'winter' ? '#cfd3d8' : (outside ? '#a89474' : this.pat.cobble), 'rgba(60,45,25,0.35)'); }
    // Marktplatz
    const m = HK.BUILDING.market; poly([[m.x, m.y, 0], [m.x + m.w, m.y, 0], [m.x + m.w, m.y + m.d, 0], [m.x, m.y + m.d, 0]], season === 'winter' ? '#d3d6da' : this.pat.cobble, 'rgba(60,45,25,0.4)');
    // Pfützen, Schmutz
    for (let i = 0; i < 60; i++) { const x = 8 + Math.random() * 15, y = 2 + Math.random() * 14; const s = I.p(x, y, 0); g.fillStyle = 'rgba(70,55,30,0.12)'; g.beginPath(); g.ellipse(s[0], s[1], 5 + Math.random() * 10, 2 + Math.random() * 3, 0, 0, 6.28); g.fill(); }
    this.ground = c;
  },

  /* ---------- Wetter, Licht ---------- */
  drawWeather(ctx, t) {
    if (this.weather === 'rain') { ctx.strokeStyle = 'rgba(200,215,235,0.35)'; ctx.lineWidth = 1; for (let i = 0; i < 140; i++) { const x = ((i * 67 + t * 260) % 1000) - 20, y = ((i * 131 + t * 420) % 700) - 30; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 12); ctx.stroke(); } }
    if (this.weather === 'snow') { ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 110; i++) { const x = ((i * 89 + t * 18 + Math.sin(t + i) * 20) % 1000) - 20, y = ((i * 151 + t * 40) % 680) - 20; ctx.beginPath(); ctx.arc(x, y, 1.2 + (i % 3) * 0.5, 0, 6.28); ctx.fill(); } }
    if (this.weather === 'cloudy') { ctx.fillStyle = 'rgba(120,125,135,0.10)'; ctx.fillRect(0, 0, 960, 640); }
  },
  drawLighting(ctx, P, t) {
    const l = P.amb;
    if (P.tint[3] > 0.005) { ctx.fillStyle = this.rgb(P.tint, P.tint[3]); ctx.fillRect(0, 0, 960, 640); }
    const st = this.sunT();
    if (st !== null && Math.sin(st * Math.PI) < 0.45) { const g = ctx.createLinearGradient(st < 0.5 ? 0 : 960, 0, st < 0.5 ? 960 : 0, 0); g.addColorStop(0, `rgba(255,190,110,${0.14 * (1 - Math.sin(st * Math.PI) / 0.45)})`); g.addColorStop(1, 'rgba(255,190,110,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 960, 640); }
    if (l < 0.7) {
      const k = HK.clamp((0.7 - l) / 0.4, 0, 1);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const [x, y, w, h] of this.windows) { if (((x * 7 + y * 13) | 0) % 5 === 0) continue; ctx.fillStyle = `rgba(255,170,70,${0.5 * k})`; ctx.fillRect(x, y, w, h); const g = ctx.createRadialGradient(x + w / 2, y + h / 2, 1, x + w / 2, y + h / 2, 10); g.addColorStop(0, `rgba(255,160,60,${0.2 * k})`); g.addColorStop(1, 'rgba(255,160,60,0)'); ctx.fillStyle = g; ctx.fillRect(x - 10, y - 10, w + 20, h + 20); }
      for (const [x, y] of this.lamps) { const g = ctx.createRadialGradient(x, y, 1, x, y, 40); g.addColorStop(0, `rgba(255,190,90,${0.5 * k})`); g.addColorStop(0.3, `rgba(255,170,70,${0.18 * k})`); g.addColorStop(1, 'rgba(255,160,60,0)'); ctx.fillStyle = g; ctx.fillRect(x - 40, y - 40, 80, 80); ctx.fillStyle = `rgba(255,230,160,${0.9 * k})`; ctx.beginPath(); ctx.arc(x, y - 1, 1.8, 0, 6.28); ctx.fill(); }
      ctx.restore();
    }
  },
};
