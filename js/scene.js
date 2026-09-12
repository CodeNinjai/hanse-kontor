/* Stadtszene Sundhaven: Blick vom Hügel über die Stadt auf den Hafen.
   Himmel, Meer, Kai, drei Häuserreihen mit Tiefenstaffelung, Tageszeiten, Wetter, Jahreszeiten. */
'use strict';

HK.Scene = {
  canvas: null, ctx: null, walkers: [], carts: [], chickens: [], gulls: [], smoke: [], shipAnim: {}, hover: null, selected: null,
  clock: 0.35, time: 0, pat: {}, stars: [], clouds: [], windows: [], weather: 'clear', weatherDay: -1, lastSeason: null, ground: null, grain: null,

  /* ---------- Initialisierung ---------- */
  init(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    canvas.width = HK.SCENE.W; canvas.height = HK.SCENE.H;
    this.makePatterns(); this.makeGrain();
    for (let i = 0; i < 130; i++) this.stars.push({ x: Math.random() * 960, y: Math.random() * 140, r: Math.random() < 0.15 ? 1.4 : 0.8, tw: Math.random() * 6.28 });
    for (let i = 0; i < 7; i++) this.clouds.push({ x: Math.random() * 1100 - 70, y: 18 + Math.random() * 80, w: 80 + Math.random() * 120, h: 14 + Math.random() * 16, v: 3 + Math.random() * 5 });
    for (let i = 0; i < 34; i++) this.walkers.push(this.makeWalker(true));
    for (let i = 0; i < 5; i++) this.gulls.push({ x: HK.rnd(100, 860), y: HK.rnd(120, 260), a: HK.rnd(0, 6.28), r: HK.rnd(25, 70), s: HK.rnd(0.25, 0.6) });
    this.carts = [{ x: 100, y: 421, dir: 1, v: 16, ox: true }, { x: 700, y: 544, dir: -1, v: 12, ox: false }];
    for (let i = 0; i < 5; i++) this.chickens.push({ cx: i < 3 ? 218 : 80, cy: i < 3 ? 420 : 532, x: 0, y: 0, t: Math.random() * 10, a: Math.random() * 6.28 });
    canvas.addEventListener('mousemove', e => { const p = this.toScene(e); const h = this.hit(p.x, p.y); this.hover = h; canvas.style.cursor = h ? 'pointer' : 'default'; this.tooltip(h, e); });
    canvas.addEventListener('mouseleave', () => { this.hover = null; this.tooltip(null); });
    canvas.addEventListener('click', e => { const p = this.toScene(e); const h = this.hit(p.x, p.y); if (h) HK.UI.sceneClick(h); });
  },
  toScene(e) { const r = this.canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * HK.SCENE.W / r.width, y: (e.clientY - r.top) * HK.SCENE.H / r.height }; },
  tooltip(h, e) {
    const tip = document.getElementById('tooltip');
    if (!h) { tip.hidden = true; return; }
    tip.hidden = false; tip.textContent = h.label;
    const wrap = this.canvas.parentElement.getBoundingClientRect();
    tip.style.left = (e.clientX - wrap.left + 14) + 'px'; tip.style.top = (e.clientY - wrap.top + 14) + 'px';
  },

  /* Texturen als Muster */
  makePatterns() {
    const mk = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); fn(g, w, h); return this.ctx.createPattern(c, 'repeat'); };
    this.pat.plaster = mk(48, 48, (g, w, h) => { g.fillStyle = 'rgba(0,0,0,0)'; for (let i = 0; i < 260; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(80,60,30,0.10)' : 'rgba(255,255,240,0.12)'; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); } });
    this.pat.brick = mk(16, 10, (g) => { g.fillStyle = '#a24a3a'; g.fillRect(0, 0, 16, 10); g.fillStyle = '#c9c0ad'; g.fillRect(0, 4, 16, 1); g.fillRect(0, 9, 16, 1); g.fillRect(7, 0, 1, 4); g.fillRect(15, 5, 1, 4); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(2, 0, 4, 4); g.fillRect(9, 5, 5, 4); g.fillStyle = 'rgba(255,200,160,0.12)'; g.fillRect(0, 0, 3, 4); });
    this.pat.stone = mk(24, 14, (g) => { g.fillStyle = '#8f887a'; g.fillRect(0, 0, 24, 14); g.fillStyle = '#6f685c'; g.fillRect(0, 6, 24, 1); g.fillRect(0, 13, 24, 1); g.fillRect(11, 0, 1, 6); g.fillRect(4, 7, 1, 6); g.fillRect(18, 7, 1, 6); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, 0, 11, 2); g.fillRect(12, 0, 12, 2); });
    this.pat.tilesRed = mk(12, 8, (g) => { g.fillStyle = '#8f3f2e'; g.fillRect(0, 0, 12, 8); g.fillStyle = '#6a2a1e'; g.beginPath(); g.arc(3, 4, 3, 0, Math.PI); g.arc(9, 8, 3, 0, Math.PI); g.stroke(); g.strokeStyle = '#5a2418'; g.lineWidth = 1; g.beginPath(); g.arc(3, 2, 3, 0, Math.PI); g.stroke(); g.beginPath(); g.arc(9, 6, 3, 0, Math.PI); g.stroke(); g.fillStyle = 'rgba(255,180,140,0.15)'; g.fillRect(0, 0, 12, 1); g.fillRect(0, 4, 12, 1); });
    this.pat.tilesDark = mk(12, 8, (g) => { g.fillStyle = '#4e4650'; g.fillRect(0, 0, 12, 8); g.strokeStyle = '#332c36'; g.lineWidth = 1; g.beginPath(); g.arc(3, 2, 3, 0, Math.PI); g.stroke(); g.beginPath(); g.arc(9, 6, 3, 0, Math.PI); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, 0, 12, 1); g.fillRect(0, 4, 12, 1); });
    this.pat.thatch = mk(10, 6, (g) => { g.fillStyle = '#9a8352'; g.fillRect(0, 0, 10, 6); g.strokeStyle = 'rgba(60,40,10,0.4)'; for (let i = 0; i < 10; i += 2) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 1, 6); g.stroke(); } });
    this.pat.cobble = mk(20, 14, (g) => { g.fillStyle = '#a89f8a'; g.fillRect(0, 0, 20, 14); const st = [[2, 2, 6, 4], [10, 1, 8, 5], [1, 8, 7, 5], [10, 8, 5, 5], [16, 8, 4, 5]]; for (const [x, y, w, h] of st) { g.fillStyle = Math.random() < 0.5 ? '#b3aa94' : '#9d947f'; g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 6.28); g.fill(); g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.ellipse(x + w / 2 - 1, y + h / 2 - 1.5, w / 3, h / 4, 0, 0, 6.28); g.fill(); } });
    this.pat.earth = mk(40, 40, (g, w, h) => { g.fillStyle = '#b5a77e'; g.fillRect(0, 0, w, h); for (let i = 0; i < 160; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(90,70,40,0.18)' : 'rgba(255,245,220,0.14)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 1.5); } });
    this.pat.grass = mk(30, 30, (g, w, h) => { g.fillStyle = '#7f9450'; g.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { g.strokeStyle = Math.random() < 0.5 ? 'rgba(40,70,20,0.35)' : 'rgba(200,230,120,0.35)'; const x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 1, y - 3); g.stroke(); } });
    this.pat.planks = mk(8, 24, (g) => { g.fillStyle = '#8a6a44'; g.fillRect(0, 0, 8, 24); g.fillStyle = '#5f4630'; g.fillRect(7, 0, 1, 24); g.fillStyle = 'rgba(255,220,170,0.15)'; g.fillRect(1, 0, 1, 24); g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(0, 11, 8, 1); });
    this.pat.snow = mk(30, 30, (g, w, h) => { g.fillStyle = '#e9edf0'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(180,195,215,0.35)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 1); } });
  },
  makeGrain() { const c = document.createElement('canvas'); c.width = 240; c.height = 160; const g = c.getContext('2d'); const img = g.createImageData(240, 160); for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (Math.random() - 0.5) * 90; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; } g.putImageData(img, 0, 0); this.grain = c; },

  /* ---------- Zeit, Licht, Jahreszeit ---------- */
  KEYS: [
    { c: 0.00, top: [8, 14, 40], bot: [22, 36, 78], far: [24, 42, 70], near: [12, 26, 48], tint: [8, 16, 60, 0.58], amb: 0.28 },
    { c: 0.20, top: [10, 16, 46], bot: [30, 42, 86], far: [28, 46, 76], near: [12, 26, 50], tint: [8, 16, 60, 0.54], amb: 0.3 },
    { c: 0.26, top: [70, 70, 120], bot: [240, 160, 110], far: [210, 150, 120], near: [60, 90, 120], tint: [255, 150, 80, 0.16], amb: 0.7 },
    { c: 0.34, top: [122, 176, 224], bot: [222, 232, 240], far: [150, 185, 205], near: [66, 112, 150], tint: [255, 225, 170, 0.07], amb: 0.95 },
    { c: 0.50, top: [92, 150, 214], bot: [206, 226, 240], far: [128, 170, 200], near: [48, 100, 145], tint: [255, 255, 255, 0], amb: 1 },
    { c: 0.66, top: [110, 140, 200], bot: [235, 205, 160], far: [190, 175, 165], near: [58, 98, 138], tint: [255, 210, 150, 0.08], amb: 0.95 },
    { c: 0.76, top: [96, 90, 160], bot: [245, 165, 100], far: [225, 150, 110], near: [58, 84, 120], tint: [255, 140, 60, 0.2], amb: 0.75 },
    { c: 0.84, top: [40, 40, 96], bot: [170, 90, 120], far: [110, 70, 100], near: [26, 44, 74], tint: [50, 30, 90, 0.38], amb: 0.45 },
    { c: 0.90, top: [10, 16, 44], bot: [26, 40, 84], far: [26, 44, 74], near: [12, 26, 50], tint: [8, 16, 60, 0.56], amb: 0.3 },
    { c: 1.00, top: [8, 14, 40], bot: [22, 36, 78], far: [24, 42, 70], near: [12, 26, 48], tint: [8, 16, 60, 0.58], amb: 0.28 },
  ],
  palette() {
    const c = this.clock, K = this.KEYS; let i = 0;
    while (i < K.length - 2 && K[i + 1].c <= c) i++;
    const a = K[i], b = K[i + 1], t = (c - a.c) / (b.c - a.c);
    const mix = (u, v) => u.map((x, k) => x + (v[k] - x) * t);
    const p = { top: mix(a.top, b.top), bot: mix(a.bot, b.bot), far: mix(a.far, b.far), near: mix(a.near, b.near), tint: mix(a.tint, b.tint), amb: a.amb + (b.amb - a.amb) * t };
    if (this.weather === 'rain') { const g = v => v.map((x, k) => (x * 0.6 + [110, 115, 125][k] * 0.4)); p.top = g(p.top); p.bot = g(p.bot); p.far = g(p.far); p.near = g(p.near); p.amb *= 0.8; }
    return p;
  },
  rgb: (v, a) => `rgba(${v[0] | 0},${v[1] | 0},${v[2] | 0},${a === undefined ? 1 : a})`,
  light() { return this.palette().amb; },
  sunT() { const c = this.clock; return c >= 0.24 && c <= 0.80 ? (c - 0.24) / 0.56 : null; },
  moonT() { const c = this.clock; const t = c >= 0.82 ? (c - 0.82) / 0.42 : c < 0.24 ? (c + 0.18) / 0.42 : null; return t; },
  shadow() { const t = this.sunT(); if (t === null) return { dx: 3, dy: 4, a: 0.12 }; const len = 8 + 26 * (1 - Math.sin(t * Math.PI)); return { dx: (0.5 - t) * 2 * len, dy: 4 + len * 0.35, a: 0.22 + 0.1 * Math.sin(t * Math.PI) }; },
  season() { const m = HK.state ? HK.monthOf(HK.state.day) : 5; return [11, 0, 1].includes(m) ? 'winter' : [8, 9, 10].includes(m) ? 'autumn' : m <= 3 ? 'spring' : 'summer'; },
  rollWeather() {
    const s = this.season(), r = Math.random();
    this.weather = s === 'winter' ? (r < 0.3 ? 'snow' : r < 0.5 ? 'rain' : r < 0.75 ? 'cloudy' : 'clear') : s === 'autumn' ? (r < 0.3 ? 'rain' : r < 0.6 ? 'cloudy' : 'clear') : (r < 0.12 ? 'rain' : r < 0.35 ? 'cloudy' : 'clear');
  },

  /* ---------- Passanten & Tiere ---------- */
  makeWalker(anywhere) {
    const types = []; HK.WALKER_TYPES.forEach(t => { for (let i = 0; i < t.weight; i++) types.push(t); });
    const t = HK.pick(types), keys = Object.keys(HK.ROAD_NODES);
    const from = HK.pick(keys), to = HK.pick(HK.ROAD_ADJ[from]);
    return { type: t.id, color: HK.pick(t.colors), from, to, t: anywhere ? Math.random() : 0, speed: HK.rnd(13, 26) * (t.id === 'child' ? 1.6 : t.id === 'beggar' ? 0.6 : 1), off: HK.rnd(-6, 6), pause: 0, nightOwl: Math.random() < 0.2 || t.id === 'guard', skin: HK.pick(['#e8c39e', '#d9a98a', '#c9946c']), hat: Math.random() < 0.5, basket: Math.random() < 0.3, phase: Math.random() * 6.28 };
  },
  walkerPos(w) {
    const A = HK.ROAD_NODES[w.from], B = HK.ROAD_NODES[w.to];
    const dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy) || 1;
    return { x: A[0] + dx * w.t - dy / len * w.off, y: A[1] + dy * w.t + dx / len * w.off, len, dir: dx >= 0 ? 1 : -1 };
  },
  depth(y) { return HK.clamp(0.62 + 0.38 * (y - 320) / 320, 0.55, 1.05); },
  walkerAlpha(w) {
    const l = this.light();
    const plague = HK.state && HK.state.town.events.some(e => e.type === 'plague');
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
      const p = this.walkerPos(w);
      w.t += w.speed * this.depth(p.y) * dt / p.len; w.phase += dt * 9;
      if (w.t >= 1) {
        const prev = w.from; w.from = w.to; w.t = 0;
        const opts = HK.ROAD_ADJ[w.from].filter(n => n !== prev);
        w.to = HK.pick(opts.length ? opts : HK.ROAD_ADJ[w.from]);
        if (Math.random() < 0.15) w.pause = HK.rnd(1, 4);
      }
    }
    for (const c of this.carts) { c.x += c.dir * c.v * dt; if (c.x > 850) c.dir = -1; if (c.x < 60) c.dir = 1; }
    for (const ch of this.chickens) { ch.t += dt; if (ch.t > 2) { ch.t = 0; ch.a = Math.random() * 6.28; } ch.x = ch.cx + Math.cos(ch.a) * 10 * Math.sin(ch.t * 1.5); ch.y = ch.cy + Math.sin(ch.a) * 4 * Math.sin(ch.t * 1.5); }
    for (const c of this.clouds) { c.x += c.v * dt; if (c.x > 1060) c.x = -c.w - 40; }
    for (const g of this.gulls) g.a += g.s * dt;
    if (st) {
      st.ships.forEach((s, i) => {
        const b = HK.BERTHS[i]; let a = this.shipAnim[s.id];
        if (!a) a = this.shipAnim[s.id] = { x: HK.HORIZON_SHIP.x, y: HK.HORIZON_SHIP.y, s: 0.12, tx: b.x, ty: b.y, leaving: false, name: s.name, origin: s.origin };
        a.tx = b.x; a.ty = b.y;
        const k = Math.min(1, dt * 1.4); a.x += (a.tx - a.x) * k; a.y += (a.ty - a.y) * k; a.s += (this.shipScale(a.y) - a.s) * k; if (Math.abs(a.x - a.tx) < 1.5) { a.x = a.tx; a.y = a.ty; a.s = this.shipScale(a.y); }
      });
      for (const id in this.shipAnim) {
        const a = this.shipAnim[id];
        if (!st.ships.some(s => String(s.id) === id)) { a.leaving = true; const k = Math.min(1, dt * 0.35); a.x += (HK.LEAVE_POINT.x - a.x) * k; a.y += (HK.LEAVE_POINT.y - a.y) * k; a.s += (0.1 - a.s) * k; if (a.s < 0.13) delete this.shipAnim[id]; }
      }
      const chimneys = [];
      for (const b of HK.BUILDINGS) {
        if (['eave', 'gable', 'hall', 'townhall'].includes(b.kind)) chimneys.push([b.x + b.w * 0.78, b.y + 6]);
        if (b.kind === 'plot' && st.workshops[b.plot].type && !st.workshops[b.plot].idle) { chimneys.push([b.x + b.w * 0.7, b.y + 8]); chimneys.push([b.x + b.w * 0.7, b.y + 8]); }
      }
      if (Math.random() < dt * 5) { const c = HK.pick(chimneys); this.smoke.push({ x: c[0], y: c[1], age: 0, vx: HK.rnd(-3, 3) + (this.weather === 'rain' ? -6 : 0) }); }
      this.smoke = this.smoke.filter(s => (s.age += dt) < 4.5);
      for (const s of this.smoke) { s.y -= 9 * dt; s.x += s.vx * dt; }
    }
  },
  shipScale(y) { return HK.clamp(0.12 + 0.88 * (y - 160) / 124, 0.1, 1); },
  /* Schiffe ohne Animation an die Liegeplätze setzen (nach Laden) */
  snapShips() { this.shipAnim = {}; if (!HK.state) return; HK.state.ships.forEach((s, i) => { const b = HK.BERTHS[i]; this.shipAnim[s.id] = { x: b.x, y: b.y, s: this.shipScale(b.y), tx: b.x, ty: b.y, leaving: false, name: s.name, origin: s.origin }; }); },

  /* ---------- Trefferprüfung ---------- */
  hit(x, y) {
    const st = HK.state; if (!st) return null;
    for (const w of this.walkers) { if (this.walkerAlpha(w) < 0.4) continue; const p = this.walkerPos(w); const d = this.depth(p.y); if (Math.hypot(p.x - x, p.y - 8 * d - y) < 10 * d) return { kind: 'walker', walker: w, label: HK.t('enc_' + w.type + '_label') }; }
    for (const n of HK.STATIC_NPCS) if (Math.hypot(n.x - x, n.y - 8 - y) < 11) { const p = HK.PERSON[n.person]; return { kind: 'person', person: n.person, label: p.name + ', ' + (p.title[HK.LANG] || p.title.de) }; }
    for (const s of st.ships) { const a = this.shipAnim[s.id]; if (a && !a.leaving && Math.abs(x - a.x) < 52 * a.s && y > a.y - 62 * a.s && y < a.y + 10) return { kind: 'visitor', id: s.id, panel: 'harbour', label: s.name + ' (' + HK.name(HK.ORIGIN[s.origin]) + ')' }; }
    for (let i = 0; i < st.caravans.length; i++) { const c = HK.CARAVAN_SPOTS[i]; if (x > c.x - 26 && x < c.x + 26 && y > c.y - 30 && y < c.y + 12) return { kind: 'visitor', id: st.caravans[i].id, panel: 'gate', label: HK.t('caravanFrom', { origin: HK.name(HK.ORIGIN[st.caravans[i].origin]) }) }; }
    for (const b of HK.BUILDINGS) { if (!b.panel) continue; const top = b.kind === 'church' ? b.y - 170 : b.y - 6; const xw = b.kind === 'church' ? [b.x, b.x + (y < b.y - 6 ? 40 : b.w)] : [b.x, b.x + b.w]; if (x >= xw[0] && x <= xw[1] && y >= top && y <= b.y + b.h + 2) return { kind: 'building', building: b, panel: b.panel, label: HK.name(b) }; }
    return null;
  },

  /* ---------- Zeichnen ---------- */
  draw() {
    const ctx = this.ctx, st = HK.state; if (!st) return;
    const P = this.palette(), t = this.time, W = HK.SCENE.W, H = HK.SCENE.H;
    const season = this.season();
    if (season !== this.lastSeason) { this.lastSeason = season; this.makeGround(season); }
    this.windows = []; this.lamps = [];
    this.drawSky(ctx, P, t);
    this.drawSea(ctx, P, t);
    // Schiffe auf See (nach y sortiert, weit hinten zuerst)
    const ships = [];
    st.ownShips.forEach((s, i) => { if (s.status === 'port') ships.push({ x: HK.OWN_BERTHS[i].x, y: HK.OWN_BERTHS[i].y, s: 0.5, origin: 'own', docked: true }); });
    for (const id in this.shipAnim) { const a = this.shipAnim[id]; ships.push({ x: a.x, y: a.y, s: a.s, origin: a.origin, docked: !a.leaving && Math.abs(a.x - a.tx) < 3, sel: HK.UI.selectedVisitor === Number(id) && !a.leaving }); }
    ships.sort((a, b) => a.y - b.y);
    for (const s of ships) this.drawShip(ctx, s.x, s.y + Math.sin(t * 1.4 + s.x) * 1.2 * s.s, s.s, s.origin, s.docked, s.sel);
    const nBoats = Math.min(4, 2 + st.boats);
    for (let i = 0; i < nBoats; i++) this.drawBoat(ctx, HK.BOAT_SPOTS[i].x, HK.BOAT_SPOTS[i].y + Math.sin(t * 2 + i) * 1.2, i >= 2);
    this.drawQuay(ctx, t);
    ctx.drawImage(this.ground, 0, 0);
    // Gebäude, Bäume, Requisiten, Personen nach Fußpunkt sortieren
    const items = [];
    for (const b of HK.BUILDINGS) if (b.kind !== 'water') items.push({ y: b.y + b.h, f: () => this.drawBuilding(ctx, b, st, season) });
    items.push({ y: 700, f: () => this.drawWall(ctx, st) });
    for (const tr of HK.TREES) if (tr.r) items.push({ y: tr.y + 4, f: () => this.drawTree(ctx, tr.x, tr.y, tr.r, season) });
    for (const p of HK.PROPS) items.push({ y: (p.y || p.y1) + 6, f: () => this.drawProp(ctx, p, st) });
    st.caravans.forEach((c, i) => items.push({ y: HK.CARAVAN_SPOTS[i].y + 8, f: () => this.drawCaravan(ctx, HK.CARAVAN_SPOTS[i].x, HK.CARAVAN_SPOTS[i].y, t + i) }));
    for (const c of this.carts) items.push({ y: c.y + 6, f: () => this.drawCart(ctx, c, t) });
    for (const ch of this.chickens) items.push({ y: ch.y + 1, f: () => this.drawChicken(ctx, ch.x, ch.y, t) });
    for (const n of HK.STATIC_NPCS) items.push({ y: n.y, f: () => this.drawPerson(ctx, n.x, n.y, n.color, 'static', 1, this.hover && this.hover.person === n.person, null, 0, 1, n.person) });
    for (const w of this.walkers) { const a = this.walkerAlpha(w); if (a <= 0.02) continue; const p = this.walkerPos(w); items.push({ y: p.y, f: () => this.drawPerson(ctx, p.x, p.y, w.color, w.type, a, this.hover && this.hover.walker === w, w.skin, w.pause > 0 ? 0 : w.phase, p.dir, null, w) }); }
    items.sort((a, b) => a.y - b.y);
    for (const it of items) it.f();
    // Rauch, Möwen
    for (const s of this.smoke) { ctx.fillStyle = `rgba(215,215,220,${0.32 * (1 - s.age / 4.5)})`; ctx.beginPath(); ctx.arc(s.x, s.y, 2 + s.age * 2.2, 0, 6.28); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.2;
    for (const g of this.gulls) { const x = g.x + Math.cos(g.a) * g.r, y = g.y + Math.sin(g.a) * g.r * 0.3, f = Math.sin(t * 8 + g.a) * 2, sz = 3 + (y - 120) / 40; ctx.beginPath(); ctx.moveTo(x - sz, y); ctx.quadraticCurveTo(x - sz / 2, y - 1.5 - f, x, y); ctx.quadraticCurveTo(x + sz / 2, y - 1.5 - f, x + sz, y); ctx.stroke(); }
    this.drawWeather(ctx, t, season);
    this.drawLighting(ctx, P, t);
    // Vignette und Korn
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(20,10,0,0.38)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = 0.045; ctx.globalCompositeOperation = 'overlay'; for (let y = 0; y < H; y += 160) for (let x = 0; x < W; x += 240) ctx.drawImage(this.grain, x + ((t * 30) | 0) % 7, y); ctx.restore();
    // Auswahl / Hover
    const hb = this.hover && this.hover.building, sb = this.selected && HK.BUILDING[this.selected];
    if (sb && sb.kind !== 'water') this.outline(ctx, sb, 'rgba(255,215,102,0.95)', 2.5);
    if (hb && hb !== sb && hb.kind !== 'water') this.outline(ctx, hb, 'rgba(255,255,255,0.85)', 1.5);
  },
  outline(ctx, b, color, w) { const top = b.kind === 'church' ? b.y - 170 : b.y - 6; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.setLineDash([5, 4]); ctx.strokeRect(b.x - 3, top, b.w + 6, b.y + b.h + 3 - top); ctx.setLineDash([]); },

  /* Himmel */
  drawSky(ctx, P, t) {
    const HZ = HK.SCENE.HORIZON;
    const g = ctx.createLinearGradient(0, 0, 0, HZ); g.addColorStop(0, this.rgb(P.top)); g.addColorStop(1, this.rgb(P.bot)); ctx.fillStyle = g; ctx.fillRect(0, 0, 960, HZ + 2);
    const night = 1 - HK.clamp((P.amb - 0.28) / 0.5, 0, 1);
    if (night > 0.05) { for (const s of this.stars) { ctx.fillStyle = `rgba(255,255,240,${night * (0.5 + 0.5 * Math.sin(t * 2 + s.tw))})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.28); ctx.fill(); } }
    const st = this.sunT();
    if (st !== null && this.weather !== 'rain' && this.weather !== 'snow') { const x = 120 + 720 * st, y = HZ - 8 - Math.sin(st * Math.PI) * 118; const gl = ctx.createRadialGradient(x, y, 4, x, y, 90); gl.addColorStop(0, 'rgba(255,240,200,0.9)'); gl.addColorStop(0.15, 'rgba(255,220,150,0.45)'); gl.addColorStop(1, 'rgba(255,200,120,0)'); ctx.fillStyle = gl; ctx.fillRect(x - 90, y - 90, 180, 180); ctx.fillStyle = '#fff6d8'; ctx.beginPath(); ctx.arc(x, y, 11, 0, 6.28); ctx.fill(); this.sunX = x; this.sunY = y; } else this.sunX = null;
    const mt = this.moonT();
    if (mt !== null && night > 0.2) { const x = 160 + 640 * mt, y = HZ - 20 - Math.sin(mt * Math.PI) * 100; ctx.fillStyle = `rgba(245,242,225,${night})`; ctx.beginPath(); ctx.arc(x, y, 9, 0, 6.28); ctx.fill(); ctx.fillStyle = this.rgb(P.top, night); ctx.beginPath(); ctx.arc(x + 4, y - 3, 8, 0, 6.28); ctx.fill(); this.moonX = x; this.moonY = y; } else this.moonX = null;
    // Wolken
    for (const c of this.clouds) {
      const light = `rgba(${255 * P.amb + 30 | 0},${250 * P.amb + 30 | 0},${245 * P.amb + 40 | 0},0.85)`, dark = this.rgb(P.bot.map((v, i) => v * 0.75 + P.top[i] * 0.1), 0.9);
      ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(c.x, c.y + 4, c.w / 2, c.h / 2, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(c.x - c.w * 0.2, c.y, c.w * 0.3, c.h * 0.6, 0, 0, 6.28); ctx.ellipse(c.x + c.w * 0.12, c.y - 3, c.w * 0.32, c.h * 0.7, 0, 0, 6.28); ctx.ellipse(c.x + c.w * 0.36, c.y + 1, c.w * 0.2, c.h * 0.5, 0, 0, 6.28); ctx.fill();
    }
    // ferne Küste rechts und Segel am Horizont
    ctx.fillStyle = this.rgb(P.far.map((v, i) => v * 0.55 + P.top[i] * 0.25)); ctx.beginPath(); ctx.moveTo(700, HZ + 1); ctx.quadraticCurveTo(790, HZ - 9, 860, HZ - 6); ctx.quadraticCurveTo(920, HZ - 10, 960, HZ - 4); ctx.lineTo(960, HZ + 1); ctx.fill();
    ctx.fillStyle = `rgba(255,250,235,${0.35 + 0.45 * P.amb})`; for (let i = 0; i < 3; i++) { const x = (120 + i * 300 + t * (2 + i)) % 1000 - 20; ctx.beginPath(); ctx.moveTo(x, HZ - 1); ctx.lineTo(x + 3, HZ - 6 - i); ctx.lineTo(x + 3, HZ - 1); ctx.fill(); }
  },
  /* Meer */
  drawSea(ctx, P, t) {
    const HZ = HK.SCENE.HORIZON, QY = HK.SCENE.QUAY_Y;
    const g = ctx.createLinearGradient(0, HZ, 0, QY); g.addColorStop(0, this.rgb(P.far)); g.addColorStop(0.35, this.rgb(P.far.map((v, i) => v * 0.6 + P.near[i] * 0.4))); g.addColorStop(1, this.rgb(P.near)); ctx.fillStyle = g; ctx.fillRect(0, HZ, 960, QY - HZ + 4);
    // Sonnen-/Mondglitzern
    const lx = this.sunX !== null ? this.sunX : this.moonX, la = this.sunX !== null ? 0.5 : 0.35;
    if (lx != null && this.weather !== 'rain') { for (let y = HZ + 3; y < QY; y += 4 + (y - HZ) * 0.12) { const spread = 8 + (y - HZ) * 0.9; for (let k = -2; k <= 2; k++) { const x = lx + k * spread * 0.4 + Math.sin(t * 3 + y * 0.7 + k) * spread * 0.3; const a = la * (1 - (y - HZ) / (QY - HZ)) * (0.5 + 0.5 * Math.sin(t * 5 + y + k * 2)); ctx.fillStyle = `rgba(255,245,210,${a})`; ctx.fillRect(x - 2 - (y - HZ) * 0.05, y, 4 + (y - HZ) * 0.1, 1.2); } } }
    // Wellen
    for (let y = HZ + 6; y < QY; y += 3 + (y - HZ) * 0.09) { const n = 14 - (y - HZ) * 0.06, len = 6 + (y - HZ) * 0.3; for (let i = 0; i < n; i++) { const x = ((i * 137 + y * 7 + t * (6 + (y - HZ) * 0.1)) % 1000) - 20; ctx.strokeStyle = `rgba(255,255,255,${0.10 + 0.14 * P.amb})`; ctx.lineWidth = 1 + (y - HZ) * 0.006; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + len / 2, y - 1.5, x + len, y); ctx.stroke(); } }
    // Morgennebel
    const c = this.clock; const fog = c > 0.22 && c < 0.42 ? 1 - Math.abs(c - 0.3) / 0.12 : 0;
    if (fog > 0) { const fg = ctx.createLinearGradient(0, HZ - 10, 0, HZ + 80); fg.addColorStop(0, `rgba(235,235,240,${0.55 * fog})`); fg.addColorStop(1, 'rgba(235,235,240,0)'); ctx.fillStyle = fg; ctx.fillRect(0, HZ - 10, 960, 90); }
  },
  /* Kai */
  drawQuay(ctx, t) {
    const QY = HK.SCENE.QUAY_Y;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, QY - 3, 960, 3); // Wasserschatten an der Kaimauer
    ctx.fillStyle = this.pat.stone; ctx.save(); ctx.translate(0, QY); ctx.fillRect(0, 0, 960, 14); ctx.restore();
    ctx.fillStyle = 'rgba(40,50,60,0.35)'; ctx.fillRect(0, QY, 960, 14);
    // Algen/Feuchte am unteren Rand
    ctx.fillStyle = 'rgba(40,70,50,0.35)'; ctx.fillRect(0, QY, 960, 4);
    // Poller und Leitern, Taue zu Schiffen
    for (let x = 30; x < 960; x += 90) { ctx.fillStyle = '#3a3230'; ctx.fillRect(x - 3, QY + 12, 6, 8); ctx.fillStyle = '#5a504a'; ctx.fillRect(x - 3, QY + 12, 6, 2); }
    for (let x = 320; x < 960; x += 360) { ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, QY); ctx.lineTo(x, QY + 14); ctx.moveTo(x + 5, QY); ctx.lineTo(x + 5, QY + 14); for (let y = QY + 3; y < QY + 14; y += 4) { ctx.moveTo(x, y); ctx.lineTo(x + 5, y); } ctx.stroke(); }
    if (HK.state) HK.state.ships.forEach((s, i) => { const a = this.shipAnim[s.id]; if (a && !a.leaving && Math.abs(a.x - a.tx) < 4) { ctx.strokeStyle = 'rgba(60,45,30,0.9)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x - 34, a.y - 6); ctx.quadraticCurveTo(a.x - 44, QY + 2, a.x - 60, QY + 14); ctx.moveTo(a.x + 30, a.y - 6); ctx.quadraticCurveTo(a.x + 42, QY + 2, a.x + 60, QY + 14); ctx.stroke(); } });
    // Kran
    const cx = 470, cy = QY + 16; ctx.fillStyle = '#4a3320'; ctx.fillRect(cx - 5, cy - 52, 10, 52); ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.moveTo(cx - 12, cy); ctx.lineTo(cx + 12, cy); ctx.lineTo(cx + 8, cy - 8); ctx.lineTo(cx - 8, cy - 8); ctx.fill();
    ctx.strokeStyle = '#4a3320'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx, cy - 50); ctx.lineTo(cx - 34, cy - 34); ctx.stroke(); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy - 30); ctx.lineTo(cx - 24, cy - 39); ctx.stroke();
    ctx.strokeStyle = '#222'; ctx.lineWidth = 1; const hy = cy - 6 + Math.sin(t * 0.8) * 8; ctx.beginPath(); ctx.moveTo(cx - 34, cy - 34); ctx.lineTo(cx - 34, hy); ctx.stroke(); ctx.fillStyle = '#8a6a3a'; ctx.fillRect(cx - 40, hy, 12, 9); ctx.strokeStyle = '#5a4020'; ctx.strokeRect(cx - 40, hy, 12, 9);
    this.lamps.push([80, QY + 20], [340, QY + 20], [640, QY + 20], [900, QY + 20]);
    for (const [x, y] of this.lamps.slice(0, 4)) { ctx.fillStyle = '#2a2420'; ctx.fillRect(x - 1, y - 22, 2, 22); ctx.fillStyle = '#3a3430'; ctx.fillRect(x - 4, y - 26, 8, 6); }
  },
  /* Boden (vorgerendert je Jahreszeit) */
  makeGround(season) {
    const c = document.createElement('canvas'); c.width = 960; c.height = 640; const g = c.getContext('2d');
    const Y0 = HK.SCENE.QUAY_Y + 14;
    g.fillStyle = this.pat.cobble; g.fillRect(0, Y0, 960, 22); // Kaifläche
    g.fillStyle = season === 'winter' ? this.pat.snow : this.pat.earth; g.fillRect(0, Y0 + 20, 960, 640 - Y0 - 20);
    if (season !== 'winter') { g.fillStyle = this.pat.grass; for (const [x, y, w, h] of [[0, 440, 34, 200], [800, 560, 90, 80], [900, 336, 60, 120], [900, 500, 60, 140], [816, 522, 60, 16]]) { g.beginPath(); g.roundRect(x, y, w, h, 10); g.fill(); } }
    g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 1;
    for (const [x1, y1, x2, y2, w] of HK.STREETS) { g.save(); g.strokeStyle = season === 'winter' ? '#cfd3d8' : this.pat.cobble; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.restore(); g.save(); g.strokeStyle = 'rgba(60,50,30,0.25)'; g.lineWidth = w + 2; g.globalCompositeOperation = 'destination-over'; g.restore(); }
    // Marktplatz
    g.fillStyle = season === 'winter' ? '#d3d6da' : this.pat.cobble; g.fillRect(330, 494, 260, 70);
    g.strokeStyle = 'rgba(60,50,30,0.3)'; g.strokeRect(330.5, 494.5, 260, 70);
    // Weg vor dem Tor
    g.fillStyle = season === 'winter' ? '#c8ccd2' : '#a89474'; g.fillRect(898, 468, 62, 16);
    // Kai-Kante
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, Y0 + 20, 960, 2);
    // Schmutzränder und Pfützen
    for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(70,55,30,0.12)'; g.beginPath(); g.ellipse(Math.random() * 960, Y0 + 30 + Math.random() * 290, 6 + Math.random() * 14, 2 + Math.random() * 3, 0, 0, 6.28); g.fill(); }
    this.ground = c;
  },

  /* ---------- Gebäude ---------- */
  shadowPoly(ctx, x, y, w, h) { const s = this.shadow(); ctx.fillStyle = `rgba(20,15,10,${s.a})`; ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w + s.dx, y + h + s.dy); ctx.lineTo(x + s.dx, y + h + s.dy); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x + w + s.dx * 0.6, y + s.dy * 0.6); ctx.lineTo(x + w + s.dx, y + h + s.dy); ctx.lineTo(x + w, y + h); ctx.fill(); },
  ao(ctx, x, y, w) { const g = ctx.createLinearGradient(0, y - 6, 0, y + 3); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(30,20,10,0.35)'); ctx.fillStyle = g; ctx.fillRect(x - 2, y - 6, w + 4, 9); },
  side(ctx, x, y, w, h, color, d) { ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x + w + d, y - d * 0.6); ctx.lineTo(x + w + d, y + h - d * 0.6); ctx.lineTo(x + w, y + h); ctx.fill(); },
  shade(hex, f) { const n = parseInt(hex.slice(1), 16); const r = HK.clamp(((n >> 16) & 255) * f, 0, 255) | 0, g = HK.clamp(((n >> 8) & 255) * f, 0, 255) | 0, b = HK.clamp((n & 255) * f, 0, 255) | 0; return `rgb(${r},${g},${b})`; },
  window(ctx, x, y, w, h, opts) {
    opts = opts || {};
    ctx.fillStyle = '#2b2620'; if (opts.arch) { ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + w / 2); ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); ctx.lineTo(x + w, y + h); ctx.fill(); } else ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(160,190,210,0.35)'; ctx.fillRect(x + 1, y + 1, w - 2, (h - 2) * 0.45);
    ctx.fillStyle = 'rgba(230,220,200,0.8)'; if (w > 5) { ctx.fillRect(x + w / 2 - 0.5, y + 1, 1, h - 2); ctx.fillRect(x + 1, y + h / 2 - 0.5, w - 2, 1); }
    if (opts.shutters) { ctx.fillStyle = opts.shutters; ctx.fillRect(x - 3, y, 2.5, h); ctx.fillRect(x + w + 0.5, y, 2.5, h); }
    this.windows.push([x, y, w, h]);
  },
  door(ctx, x, y, w, h, arch) { ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + (arch ? w / 2 : 0)); if (arch) ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); else ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.fill(); ctx.fillStyle = 'rgba(255,220,160,0.15)'; ctx.fillRect(x + 1, y + 2, w / 2 - 1, h - 2); ctx.fillStyle = '#c8a24a'; ctx.fillRect(x + w - 3, y + h / 2, 1.5, 1.5); },
  timberFrame(ctx, x, y, w, h, s) {
    ctx.strokeStyle = 'rgba(70,45,22,0.85)'; ctx.lineWidth = 1.6 * s;
    const bays = Math.max(2, Math.round(w / (16 * s)));
    for (let i = 0; i <= bays; i++) { const xx = x + i * w / bays; ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx, y + h); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.moveTo(x, y + h * 0.5); ctx.lineTo(x + w, y + h * 0.5); ctx.stroke();
    ctx.lineWidth = 1.2 * s; ctx.beginPath(); ctx.moveTo(x, y + h * 0.5); ctx.lineTo(x + w / bays, y); ctx.moveTo(x + w, y + h * 0.5); ctx.lineTo(x + w - w / bays, y); ctx.moveTo(x, y + h); ctx.lineTo(x + w / bays, y + h * 0.5); ctx.moveTo(x + w, y + h); ctx.lineTo(x + w - w / bays, y + h * 0.5); ctx.stroke();
    return bays;
  },
  roofSlope(ctx, x, y, w, rh, pat, snow) {
    ctx.fillStyle = snow ? '#e6eaee' : pat; ctx.beginPath(); ctx.moveTo(x - 4, y + rh); ctx.lineTo(x + w + 4, y + rh); ctx.lineTo(x + w - 7, y); ctx.lineTo(x + 7, y); ctx.closePath(); ctx.fill();
    const g = ctx.createLinearGradient(0, y, 0, y + rh); g.addColorStop(0, 'rgba(255,240,200,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0.28)'); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(40,20,10,0.6)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = 'rgba(30,20,10,0.7)'; ctx.fillRect(x + 5, y - 1, w - 10, 2); // First
  },
  chimney(ctx, x, y, s) { ctx.fillStyle = '#5a4a44'; ctx.fillRect(x, y, 6 * s, 12 * s); ctx.fillStyle = '#3a2f2c'; ctx.fillRect(x - 1, y - 2, 8 * s, 3); },
  drawEave(ctx, b, st, season, opts) {
    opts = opts || {};
    const s = [0.82, 0.92, 1][b.row] || 1, x = b.x, y = b.y, w = b.w, h = b.h, rh = Math.round(h * 0.42), fh = h - rh;
    const wall = b.wall || '#e2d4b4', roof = b.roof || '#8f3f2e';
    this.shadowPoly(ctx, x, y + rh, w, fh);
    // Fassade
    this.ao(ctx, x, y + h, w);
    ctx.fillStyle = b.stone ? this.pat.stone : wall; ctx.fillRect(x, y + rh, w, fh);
    if (!b.stone) { ctx.fillStyle = this.pat.plaster; ctx.fillRect(x, y + rh, w, fh); }
    this.side(ctx, x, y + rh, w, fh, b.stone ? '#6f685c' : this.shade(wall, 0.72), 7 * s);
    // Obergeschoss-Überstand
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x, y + rh + fh * 0.5, w, 2.5);
    const bays = b.stone ? Math.max(2, Math.round(w / 22)) : this.timberFrame(ctx, x, y + rh, w, fh, s);
    // Fenster und Tür
    const bw = w / bays, shut = HK.pick.constructor ? null : null;
    const shutterColors = ['#5a7a4a', '#7a3a3a', '#3a5a7a', null];
    const sc = shutterColors[(x + w) % 4];
    for (let i = 0; i < bays; i++) { const wx = x + i * bw + bw / 2 - 3.5 * s; this.window(ctx, wx, y + rh + fh * 0.16, 7 * s, 9 * s, { shutters: sc, arch: b.stone }); }
    for (let i = 0; i < bays; i++) { if (i === Math.floor(bays / 2)) continue; const wx = x + i * bw + bw / 2 - 3.5 * s; this.window(ctx, wx, y + rh + fh * 0.62, 7 * s, 9 * s, { arch: b.stone }); }
    this.door(ctx, x + Math.floor(bays / 2) * bw + bw / 2 - 5 * s, y + h - 15 * s, 10 * s, 15 * s, b.stone);
    // Dach
    this.roofSlope(ctx, x, y, w, rh, roof === '#5b5560' || roof === '#4e4a52' || roof === '#5a4a4a' ? this.pat.tilesDark : this.pat.tilesRed, season === 'winter');
    if (w > 70) { // Gaube
      const gx = x + w * 0.5, gy = y + rh * 0.35; ctx.fillStyle = this.shade(wall, 0.9); ctx.fillRect(gx - 7, gy, 14, rh * 0.5); ctx.fillStyle = '#4a3a30'; ctx.beginPath(); ctx.moveTo(gx - 9, gy); ctx.lineTo(gx + 9, gy); ctx.lineTo(gx, gy - 8); ctx.fill(); this.window(ctx, gx - 3, gy + 3, 6, 7, {});
    }
    this.chimney(ctx, x + w * 0.78, y + 2, s);
    if (b.sign === 'tavern') { ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 2, y + rh + 8); ctx.lineTo(x - 14, y + rh + 8); ctx.stroke(); ctx.fillStyle = '#c8a24a'; ctx.beginPath(); ctx.ellipse(x - 12, y + rh + 15, 6, 4, -0.3, 0, 6.28); ctx.fill(); ctx.fillStyle = '#7a2a2a'; ctx.fillRect(x - 15, y + rh + 8, 6, 3); }
    if (b.sign === 'bank') { ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 2, y + rh + 8); ctx.lineTo(x - 14, y + rh + 8); ctx.stroke(); ctx.fillStyle = '#e0b040'; ctx.beginPath(); ctx.arc(x - 12, y + rh + 15, 5, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#7a5a10'; ctx.lineWidth = 1; ctx.stroke(); }
    if (b.id === 'customs') { ctx.fillStyle = '#c8102e'; for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#f0ece0' : '#c8102e'; ctx.fillRect(x - 8, y + rh + 20 + i * 6, 3, 6); } }
    if (b.id === 'bathhouse') { for (let i = 0; i < 3; i++) { ctx.fillStyle = `rgba(240,240,240,${0.25 - i * 0.06})`; ctx.beginPath(); ctx.arc(x + w * 0.78 + 3 + Math.sin(this.time * 2 + i) * 3, y - 6 - i * 7, 4 + i * 2, 0, 6.28); ctx.fill(); } }
    if (opts.workshop) this.workshopDeco(ctx, b, opts.workshop, s, st);
  },
  drawGable(ctx, b, st, season) {
    const s = [0.82, 0.92, 1][b.row] || 1, x = b.x, y = b.y, w = b.w, h = b.h, gh = Math.round(h * 0.46), fh = h - gh;
    const brick = !!b.brick, wall = b.wall || '#e2d4b4';
    this.shadowPoly(ctx, x, y + gh, w, fh);
    // Dach dahinter (Tiefe)
    ctx.fillStyle = season === 'winter' ? '#dfe3e8' : this.shade(b.roof || '#7a3a2a', 0.8); ctx.beginPath(); ctx.moveTo(x + 4, y + gh + 2); ctx.lineTo(x + w + 9, y + gh - 4); ctx.lineTo(x + w / 2 + 9, y - 5); ctx.lineTo(x + w / 2 + 2, y); ctx.fill();
    // Fassade + Giebel
    const facade = () => { ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + gh); if (brick) { const steps = 5; for (let i = 0; i <= steps; i++) { const sx = x + (w / 2) * i / steps, sy = y + gh - gh * i / steps; ctx.lineTo(sx, sy); ctx.lineTo(sx + (w / 2) / steps, sy); } for (let i = steps; i >= 0; i--) { const sx = x + w / 2 + (w / 2) * (steps - i) / steps, sy = y + gh - gh * i / steps; ctx.lineTo(sx, sy); ctx.lineTo(sx + (w / 2) / steps, sy); } } else { ctx.lineTo(x + w / 2, y); } ctx.lineTo(x + w, y + gh); ctx.lineTo(x + w, y + h); ctx.closePath(); };
    this.ao(ctx, x, y + h, w);
    facade(); ctx.fillStyle = brick ? this.pat.brick : wall; ctx.fill();
    if (!brick) { facade(); ctx.fillStyle = this.pat.plaster; ctx.fill(); }
    facade(); ctx.strokeStyle = 'rgba(40,20,10,0.55)'; ctx.lineWidth = 1; ctx.stroke();
    this.side(ctx, x, y + gh, w, fh, brick ? '#6e2f24' : this.shade(wall, 0.72), 7 * s);
    if (!brick) {
      const bays = this.timberFrame(ctx, x, y + gh, w, fh, s);
      ctx.strokeStyle = 'rgba(70,45,22,0.85)'; ctx.lineWidth = 1.4 * s; ctx.beginPath(); ctx.moveTo(x + w / 2, y + 2); ctx.lineTo(x + w / 2, y + gh); ctx.moveTo(x + w * 0.25, y + gh * 0.5); ctx.lineTo(x + w * 0.75, y + gh * 0.5); ctx.moveTo(x + w * 0.25, y + gh * 0.5); ctx.lineTo(x + w * 0.25, y + gh); ctx.moveTo(x + w * 0.75, y + gh * 0.5); ctx.lineTo(x + w * 0.75, y + gh); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x, y + gh, w, 2.5);
      const bw = w / bays; for (let i = 0; i < bays; i++) { this.window(ctx, x + i * bw + bw / 2 - 3.5 * s, y + gh + fh * 0.16, 7 * s, 9 * s, { shutters: ['#5a7a4a', '#7a3a3a', '#3a5a7a'][(x + i) % 3] }); if (i !== Math.floor(bays / 2)) this.window(ctx, x + i * bw + bw / 2 - 3.5 * s, y + gh + fh * 0.62, 7 * s, 9 * s, {}); }
      this.window(ctx, x + w / 2 - 3, y + gh * 0.6, 6, 7, {});
      this.door(ctx, x + w / 2 - 5 * s, y + h - 15 * s, 10 * s, 15 * s, false);
    } else {
      // Backstein: Blendnischen, Spitzbogenfenster, Ladeluken
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 3; i++) ctx.fillRect(x + 8 + i * (w - 16) / 3 + 3, y + gh + 6, (w - 16) / 3 - 6, fh - 12);
      const cols = 3; for (let i = 0; i < cols; i++) { const wx = x + 8 + i * (w - 16) / cols + (w - 16) / cols / 2 - 4; this.window(ctx, wx, y + gh + fh * 0.18, 8, 11, { arch: true }); if (i !== 1) this.window(ctx, wx, y + gh + fh * 0.62, 8, 11, { arch: true }); }
      ctx.fillStyle = '#2b2620'; ctx.fillRect(x + w / 2 - 6, y + gh * 0.45, 12, 10); ctx.fillRect(x + w / 2 - 5, y + gh * 0.15, 10, 8);
      this.door(ctx, x + w / 2 - 7, y + h - 18, 14, 18, true);
      if (b.hoist) { ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + w / 2, y + 3); ctx.lineTo(x + w / 2, y - 8); ctx.lineTo(x + w / 2 + 14, y - 6); ctx.stroke(); ctx.lineWidth = 1; ctx.strokeStyle = '#222'; ctx.beginPath(); ctx.moveTo(x + w / 2 + 14, y - 6); ctx.lineTo(x + w / 2 + 14, y + gh * 0.5 + Math.sin(this.time) * 4); ctx.stroke(); ctx.fillStyle = '#8a6a3a'; ctx.fillRect(x + w / 2 + 10, y + gh * 0.5 + Math.sin(this.time) * 4, 8, 7); }
      if (season === 'winter') { ctx.fillStyle = '#e6eaee'; for (let i = 0; i <= 5; i++) { ctx.fillRect(x + (w / 2) * i / 5, y + gh - gh * i / 5 - 2, w / 10, 2.5); ctx.fillRect(x + w / 2 + (w / 2) * (5 - i) / 5, y + gh - gh * i / 5 - 2, w / 10, 2.5); } }
    }
    this.chimney(ctx, x + w * 0.8, y + gh * 0.7, s * 0.9);
  },
  drawHall(ctx, b, st, season) {
    // Backstein-Giebelhaus mit Ecktürmchen
    this.drawGable(ctx, b, st, season);
    const x = b.x, y = b.y, w = b.w, h = b.h;
    ctx.fillStyle = this.pat.brick; ctx.fillRect(x + w - 10, y + h * 0.3, 12, h * 0.7); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x + w - 10, y + h * 0.3, 12, h * 0.7);
    ctx.fillStyle = '#3a3038'; ctx.beginPath(); ctx.moveTo(x + w - 13, y + h * 0.3); ctx.lineTo(x + w + 5, y + h * 0.3); ctx.lineTo(x + w - 4, y + h * 0.3 - 18); ctx.fill();
    if (b.banner) { ctx.fillStyle = '#6a2a8a'; ctx.fillRect(x + w / 2 - 12, y + h * 0.5, 8, 22); ctx.fillStyle = '#e0b040'; ctx.fillRect(x + w / 2 - 10, y + h * 0.5 + 4, 4, 4); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x + w / 2 - 14, y + h * 0.5 - 1, 12, 2); }
    if (b.id === 'bailiff') { ctx.fillStyle = '#e0b040'; ctx.beginPath(); ctx.arc(x + w / 2 - 12, y + h * 0.55, 3, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + w / 2 - 12, y + h * 0.4); ctx.lineTo(x + w / 2 - 12, y + h * 0.52); ctx.stroke(); this.lamps.push([x + w / 2 - 12, y + h * 0.55]); }
  },
  drawTownhall(ctx, b, st, season) {
    const x = b.x, y = b.y, w = b.w, h = b.h, rh = 24, fh = h - rh;
    this.shadowPoly(ctx, x, y + rh, w, fh);
    ctx.fillStyle = this.pat.brick; ctx.fillRect(x, y + rh, w, fh);
    this.side(ctx, x, y + rh, w, fh, '#6e2f24', 8);
    // Arkaden im Erdgeschoss
    for (let i = 0; i < 9; i++) { const ax = x + 8 + i * (w - 16) / 9, aw = (w - 16) / 9 - 4; ctx.fillStyle = '#2b2620'; ctx.beginPath(); ctx.moveTo(ax, y + h); ctx.lineTo(ax, y + h - 14); ctx.arc(ax + aw / 2, y + h - 14, aw / 2, Math.PI, 0); ctx.lineTo(ax + aw, y + h); ctx.fill(); ctx.fillStyle = 'rgba(255,220,160,0.12)'; ctx.fillRect(ax + 1, y + h - 12, aw - 2, 12); }
    // Fensterreihe
    for (let i = 0; i < 11; i++) { const wx = x + 10 + i * (w - 20) / 11 + 4; this.window(ctx, wx, y + rh + 6, 9, 13, { arch: true }); }
    // Zinnenfries und Treppengiebel an den Enden
    ctx.fillStyle = '#c9c0ad'; ctx.fillRect(x, y + rh - 2, w, 2);
    for (let i = 0; i < 2; i++) { const gx = i ? x + w - 60 : x; ctx.fillStyle = this.pat.brick; ctx.beginPath(); ctx.moveTo(gx, y + rh); for (let k = 0; k <= 4; k++) { ctx.lineTo(gx + 30 * k / 4, y + rh - rh * k / 4); ctx.lineTo(gx + 30 * (k + 1) / 4, y + rh - rh * k / 4); } for (let k = 4; k >= 0; k--) { ctx.lineTo(gx + 30 + 30 * (4 - k) / 4, y + rh - rh * k / 4); ctx.lineTo(gx + 30 + 30 * (5 - k) / 4, y + rh - rh * k / 4); } ctx.lineTo(gx + 60, y + rh); ctx.fill(); ctx.strokeStyle = 'rgba(40,20,10,0.5)'; ctx.stroke(); this.window(ctx, gx + 26, y + 8, 8, 10, { arch: true }); }
    // Dach zwischen den Giebeln
    ctx.fillStyle = season === 'winter' ? '#e6eaee' : this.pat.tilesDark; ctx.beginPath(); ctx.moveTo(x + 60, y + rh); ctx.lineTo(x + w - 60, y + rh); ctx.lineTo(x + w - 66, y + 4); ctx.lineTo(x + 66, y + 4); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fill();
    // Turm in der Mitte
    const tx = x + w / 2; ctx.fillStyle = this.pat.brick; ctx.fillRect(tx - 12, y - 26, 24, rh + 30); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(tx - 12, y - 26, 24, rh + 30);
    ctx.fillStyle = '#3a3038'; ctx.beginPath(); ctx.moveTo(tx - 15, y - 26); ctx.lineTo(tx + 15, y - 26); ctx.lineTo(tx, y - 58); ctx.fill(); ctx.fillStyle = '#e0b040'; ctx.fillRect(tx - 1, y - 66, 2, 8); ctx.beginPath(); ctx.moveTo(tx + 1, y - 66); ctx.lineTo(tx + 9, y - 63); ctx.lineTo(tx + 1, y - 60); ctx.fill();
    this.window(ctx, tx - 4, y - 18, 8, 10, { arch: true }); ctx.fillStyle = '#e0b040'; ctx.beginPath(); ctx.arc(tx, y - 4, 5, 0, 6.28); ctx.fill(); ctx.fillStyle = '#2b2620'; ctx.beginPath(); ctx.arc(tx, y - 4, 3.5, 0, 6.28); ctx.fill();
    // Wimpel an den Giebeln
    for (const gx of [x + 30, x + w - 30]) { ctx.fillStyle = '#3a2a1a'; ctx.fillRect(gx - 0.5, y - 12, 1, 14); ctx.fillStyle = '#c8102e'; ctx.beginPath(); ctx.moveTo(gx, y - 12); ctx.lineTo(gx + 8 + Math.sin(this.time * 4) * 2, y - 9); ctx.lineTo(gx, y - 6); ctx.fill(); }
    this.lamps.push([x + 4, y + h - 6], [x + w - 4, y + h - 6]);
  },
  drawChurch(ctx, b, st, season) {
    const x = b.x, y = b.y, w = b.w, h = b.h, tw = 36, nx = x + tw, nw = w - tw, rh = Math.round(h * 0.5), fh = h - rh;
    this.shadowPoly(ctx, nx, y + rh, nw, fh);
    // Kirchenschiff
    ctx.fillStyle = this.pat.brick; ctx.fillRect(nx, y + rh, nw, fh); this.side(ctx, nx, y + rh, nw, fh, '#6e2f24', 8);
    for (let i = 0; i < 4; i++) { const wx = nx + 10 + i * (nw - 14) / 4; this.window(ctx, wx, y + rh + 6, 8, fh - 16, { arch: true }); ctx.fillStyle = '#7e3a2c'; ctx.fillRect(wx + 12, y + rh, 4, fh); }
    // steiles Dach
    ctx.fillStyle = season === 'winter' ? '#e6eaee' : this.pat.tilesDark; ctx.beginPath(); ctx.moveTo(nx - 4, y + rh); ctx.lineTo(nx + nw + 4, y + rh); ctx.lineTo(nx + nw - 6, y - 8); ctx.lineTo(nx + 6, y - 8); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill(); ctx.strokeStyle = 'rgba(30,20,20,0.6)'; ctx.stroke();
    ctx.fillStyle = '#c9c0ad'; ctx.fillRect(nx + 6, y - 9, nw - 12, 2);
    this.door(ctx, nx + nw / 2 - 8, y + h - 20, 16, 20, true);
    // Turm
    const ty = y - 150; this.shadowPoly(ctx, x, ty, tw, h + 150 - 20);
    ctx.fillStyle = this.pat.brick; ctx.fillRect(x, ty, tw, h + 150); this.side(ctx, x, ty, tw, h + 150, '#6e2f24', 8);
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; for (let i = 0; i < 3; i++) ctx.fillRect(x + 6 + i * 10, ty + 20, 6, h + 110);
    for (let k = 0; k < 4; k++) this.window(ctx, x + tw / 2 - 4, ty + 26 + k * 32, 8, 12, { arch: true });
    ctx.fillStyle = '#2b2620'; ctx.fillRect(x + tw / 2 - 6, ty + 8, 12, 12); ctx.fillStyle = '#e0b040'; ctx.beginPath(); ctx.arc(x + tw / 2, ty + 14, 2, 0, 6.28); ctx.fill();
    // Helm
    ctx.fillStyle = season === 'winter' ? '#dfe3e8' : '#3a3038'; ctx.beginPath(); ctx.moveTo(x - 4, ty); ctx.lineTo(x + tw + 4, ty); ctx.lineTo(x + tw / 2, ty - 62); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.moveTo(x - 4, ty); ctx.lineTo(x + tw / 2, ty); ctx.lineTo(x + tw / 2, ty - 62); ctx.fill();
    ctx.strokeStyle = '#e0b040'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + tw / 2, ty - 62); ctx.lineTo(x + tw / 2, ty - 78); ctx.moveTo(x + tw / 2 - 5, ty - 72); ctx.lineTo(x + tw / 2 + 5, ty - 72); ctx.stroke();
    ctx.fillStyle = '#e0b040'; ctx.beginPath(); ctx.arc(x + tw / 2, ty - 62, 2.5, 0, 6.28); ctx.fill();
    this.door(ctx, x + tw / 2 - 6, y + h - 18, 12, 18, true);
  },
  drawHuts(ctx, b, st, season) {
    const x = b.x, y = b.y;
    for (let i = 0; i < 2; i++) { const hx = x + i * 42, hy = y + 6 + i * 6, hw = 34, hh = 40, rh = 16; this.shadowPoly(ctx, hx, hy + rh, hw, hh - rh); ctx.fillStyle = this.pat.planks; ctx.fillRect(hx, hy + rh, hw, hh - rh); this.side(ctx, hx, hy + rh, hw, hh - rh, '#5f4630', 5); ctx.fillStyle = season === 'winter' ? '#e6eaee' : this.pat.thatch; ctx.beginPath(); ctx.moveTo(hx - 4, hy + rh); ctx.lineTo(hx + hw + 4, hy + rh); ctx.lineTo(hx + hw - 6, hy); ctx.lineTo(hx + 6, hy); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fill(); this.door(ctx, hx + hw / 2 - 4, hy + hh - 12, 8, 12, false); this.window(ctx, hx + 4, hy + rh + 5, 5, 6, {}); }
    // Fischgestell und Netz
    ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 6, y + 60); ctx.lineTo(x + 6, y + 44); ctx.moveTo(x + 40, y + 60); ctx.lineTo(x + 40, y + 44); ctx.moveTo(x + 6, y + 46); ctx.lineTo(x + 40, y + 46); ctx.stroke();
    ctx.fillStyle = '#b8a888'; for (let i = 0; i < 6; i++) ctx.fillRect(x + 9 + i * 5.5, y + 47, 2, 6);
    ctx.strokeStyle = 'rgba(60,50,40,0.6)'; ctx.lineWidth = 0.8; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x + 50 + i * 5, y + 44); ctx.lineTo(x + 52 + i * 5, y + 60); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 48, y + 46 + i * 3.5); ctx.lineTo(x + 76, y + 46 + i * 3.5); ctx.stroke(); }
  },
  drawYard(ctx, b) {
    const x = b.x, y = b.y, w = b.w, h = b.h;
    ctx.fillStyle = this.pat.planks; ctx.fillRect(x, y + 20, w, h - 20); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x, y + 20, w, h - 20);
    // Schiffsrumpf im Bau
    ctx.strokeStyle = '#c9a878'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x + 8, y + 52); ctx.quadraticCurveTo(x + w / 2, y + 66, x + w - 8, y + 50); ctx.stroke();
    for (let i = 0; i < 7; i++) { const rx = x + 14 + i * (w - 28) / 6; ctx.beginPath(); ctx.moveTo(rx, y + 58); ctx.quadraticCurveTo(rx - 2, y + 38, rx + 4, y + 26); ctx.stroke(); }
    ctx.fillStyle = '#6a4a2a'; for (let i = 0; i < 3; i++) ctx.fillRect(x + 6 + i * 8, y + 40 + i * 3, 30, 3); // Plankenstapel
    // Schuppen hinten
    ctx.fillStyle = this.pat.planks; ctx.fillRect(x + w - 34, y + 4, 30, 22); ctx.fillStyle = '#5a4a3a'; ctx.beginPath(); ctx.moveTo(x + w - 37, y + 4); ctx.lineTo(x + w - 1, y + 4); ctx.lineTo(x + w - 19, y - 6); ctx.fill();
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x + 4, y + 2, 3, 30); ctx.fillStyle = '#e0b040'; ctx.beginPath(); ctx.moveTo(x + 7, y + 2); ctx.lineTo(x + 16 + Math.sin(this.time * 4) * 2, y + 5); ctx.lineTo(x + 7, y + 8); ctx.fill();
  },
  drawPlot(ctx, b, st, season) {
    const ws = st.workshops[b.plot];
    if (!ws.type) {
      const x = b.x, y = b.y + 20, w = b.w, h = b.h - 20;
      ctx.fillStyle = 'rgba(90,70,40,0.18)'; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2; for (let xx = x; xx <= x + w; xx += 8) { ctx.beginPath(); ctx.moveTo(xx, y + h); ctx.lineTo(xx, y + h - 9); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(x, y + h - 6); ctx.lineTo(x + w, y + h - 6); ctx.stroke();
      ctx.strokeStyle = '#6a4a2a'; ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x, y + h); ctx.moveTo(x + w, y + 4); ctx.lineTo(x + w, y + h); ctx.stroke();
      if (season !== 'winter') { ctx.fillStyle = this.pat.grass; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, w * 0.35, h * 0.28, 0, 0, 6.28); ctx.fill(); }
      ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x + w - 22, y + 8, 18, 14); ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.moveTo(x + w - 24, y + 8); ctx.lineTo(x + w - 2, y + 8); ctx.lineTo(x + w - 13, y); ctx.fill();
      ctx.fillStyle = '#c9c0ad'; ctx.fillRect(x + 6, y + 14, 12, 8); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x + 11, y + 22, 2, 8);
      return;
    }
    const cols = { brewery: ['#d9b56b', '#6a3a2a'], smokehouse: ['#8a7a6a', '#3a3a3a'], weaver: ['#d9d0b8', '#4e4a52'], smithy: ['#7a6a5a', '#4e4a52'], saltworks: ['#e0dcd0', '#5b5560'] };
    const c = cols[ws.type];
    this.drawEave(ctx, Object.assign({}, b, { wall: c[0], roof: c[1], stone: ws.type === 'smithy' }), st, season, { workshop: ws });
  },
  workshopDeco(ctx, b, ws, s, st) {
    const x = b.x, y = b.y + b.h;
    if (ws.type === 'brewery') { for (let i = 0; i < 3; i++) this.barrel(ctx, x + 6 + i * 9, y - 2 - (i === 1 ? 6 : 0)); }
    if (ws.type === 'smokehouse') { ctx.fillStyle = '#b8a888'; for (let i = 0; i < 5; i++) ctx.fillRect(x + b.w - 30 + i * 5, y - 14, 2, 7); ctx.strokeStyle = '#4a3a2a'; ctx.beginPath(); ctx.moveTo(x + b.w - 32, y - 15); ctx.lineTo(x + b.w - 4, y - 15); ctx.stroke(); }
    if (ws.type === 'smithy') { const gl = ctx.createRadialGradient(x + b.w / 2, y - 4, 1, x + b.w / 2, y - 4, 16); gl.addColorStop(0, `rgba(255,140,40,${0.5 + Math.sin(this.time * 7) * 0.2})`); gl.addColorStop(1, 'rgba(255,100,20,0)'); ctx.fillStyle = gl; ctx.fillRect(x + b.w / 2 - 16, y - 20, 32, 22); ctx.fillStyle = '#3a3a3a'; ctx.fillRect(x + 8, y - 8, 12, 5); }
    if (ws.type === 'weaver') { ctx.fillStyle = '#3b6ac2'; ctx.fillRect(x + b.w - 20, y - 12, 14, 4); ctx.fillStyle = '#c23b3b'; ctx.fillRect(x + b.w - 20, y - 8, 14, 4); ctx.fillStyle = '#e8e0c8'; ctx.fillRect(x + b.w - 20, y - 4, 14, 4); }
    if (ws.type === 'saltworks') { ctx.fillStyle = '#f0eee8'; ctx.beginPath(); ctx.moveTo(x + 4, y); ctx.lineTo(x + 24, y); ctx.lineTo(x + 14, y - 10); ctx.fill(); }
    ctx.fillStyle = ws.idle ? '#a03030' : '#3a9a4a'; ctx.beginPath(); ctx.arc(x + b.w + 3, y - b.h * 0.5, 3, 0, 6.28); ctx.fill();
  },
  drawMarket(ctx, b, st) {
    const stalls = [[346, 506, '#c23b3b'], [392, 500, '#3b6ac2'], [438, 508, '#3b9a4a'], [498, 500, '#c29a3b'], [546, 506, '#7a3bc2']];
    stalls.forEach(([x, y, c], i) => {
      const mine = i < st.stalls;
      this.shadowPoly(ctx, x, y + 6, 30, 16);
      ctx.fillStyle = this.pat.planks; ctx.fillRect(x, y + 10, 30, 12); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x, y + 10, 30, 12);
      ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x + 1, y + 2, 2, 20); ctx.fillRect(x + 27, y + 2, 2, 20);
      ctx.fillStyle = mine ? '#e0b040' : c; ctx.beginPath(); ctx.moveTo(x - 3, y + 3); ctx.lineTo(x + 33, y + 3); ctx.lineTo(x + 30, y - 4); ctx.lineTo(x, y - 4); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; for (let sx = 0; sx < 33; sx += 8) ctx.fillRect(x - 3 + sx, y - 3, 4, 6);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let sx = -3; sx < 33; sx += 6) { ctx.beginPath(); ctx.arc(x + sx + 3, y + 3, 3, 0, Math.PI); ctx.fill(); }
      const goods = [['#d9c56b', '#c9a24a'], ['#c94a3a', '#8ab04a'], ['#8ab04a', '#d9c56b'], ['#c9a24a', '#8a6a3a'], ['#c94a3a', '#7a3bc2']][i];
      for (let k = 0; k < 5; k++) { ctx.fillStyle = goods[k % 2]; ctx.beginPath(); ctx.arc(x + 5 + k * 5, y + 11, 2.2, 0, 6.28); ctx.fill(); }
      if (mine) { ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x + 14, y - 16, 1.2, 13); ctx.fillStyle = '#e0b040'; ctx.beginPath(); ctx.moveTo(x + 15, y - 16); ctx.lineTo(x + 23, y - 13); ctx.lineTo(x + 15, y - 10); ctx.fill(); }
    });
    // Säcke und Körbe
    ctx.fillStyle = '#b8a070'; for (const [sx, sy] of [[360, 540], [366, 542], [560, 544]]) { ctx.beginPath(); ctx.ellipse(sx, sy, 5, 4, 0, 0, 6.28); ctx.fill(); }
  },
  drawWall(ctx, st) {
    const x = HK.WALL_X, top = 326;
    // Mauer (innere Seite sichtbar) mit Wehrgang
    ctx.fillStyle = this.pat.stone; ctx.fillRect(x, top, 14, 640 - top); ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(x, top, 14, 640 - top);
    ctx.fillStyle = '#7a7466'; ctx.fillRect(x + 12, top, 6, 640 - top);
    ctx.fillStyle = '#5e594e'; for (let y = top; y < 640; y += 14) ctx.fillRect(x + 12, y, 6, 7);
    // Torturm
    const b = HK.BUILDING.gate, gx = b.x, gy = b.y;
    this.shadowPoly(ctx, gx, gy + 16, b.w, b.h - 16);
    ctx.fillStyle = this.pat.stone; ctx.fillRect(gx, gy + 10, b.w, b.h - 10); ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(gx, gy + 10, b.w, b.h - 10);
    ctx.fillStyle = '#5e594e'; for (let i = 0; i < 5; i++) ctx.fillRect(gx - 2 + i * 9, gy + 2, 6, 10);
    ctx.fillStyle = '#3a3038'; ctx.beginPath(); ctx.moveTo(gx - 3, gy + 12); ctx.lineTo(gx + b.w + 3, gy + 12); ctx.lineTo(gx + b.w / 2, gy - 14); ctx.fill();
    ctx.fillStyle = '#1e1a18'; ctx.beginPath(); ctx.moveTo(gx + b.w / 2 - 9, gy + b.h); ctx.lineTo(gx + b.w / 2 - 9, gy + b.h - 20); ctx.arc(gx + b.w / 2, gy + b.h - 20, 9, Math.PI, 0); ctx.lineTo(gx + b.w / 2 + 9, gy + b.h); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,200,0.18)'; ctx.fillRect(gx + b.w / 2 - 7, gy + b.h - 22, 14, 22);
    this.window(ctx, gx + b.w / 2 - 3, gy + 24, 6, 8, { arch: true });
    ctx.fillStyle = '#c8102e'; ctx.fillRect(gx + b.w / 2 - 6, gy + 36, 12, 8); ctx.fillStyle = '#f0ece0'; ctx.fillRect(gx + b.w / 2 - 6, gy + 40, 12, 4);
    this.lamps.push([gx - 3, gy + b.h - 14], [gx + b.w + 3, gy + b.h - 14]);
    for (const [lx, ly] of [[gx - 3, gy + b.h - 14], [gx + b.w + 3, gy + b.h - 14]]) { ctx.fillStyle = '#3a2a1a'; ctx.fillRect(lx - 1, ly, 2, 8); }
  },
  drawTree(ctx, x, y, r, season) {
    const s = this.shadow(); ctx.fillStyle = `rgba(20,15,10,${s.a * 0.8})`; ctx.beginPath(); ctx.ellipse(x + s.dx * 0.5, y + 3, r * 0.9, r * 0.35, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#4a3320'; ctx.fillRect(x - 2.5, y - r * 0.8, 5, r * 0.8 + 2);
    if (season === 'winter') { ctx.strokeStyle = '#4a3320'; ctx.lineWidth = 1.5; for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.35; ctx.beginPath(); ctx.moveTo(x, y - r * 0.7); ctx.lineTo(x + Math.cos(a) * r * 1.1, y - r * 0.7 + Math.sin(a) * r * 1.1); ctx.stroke(); } return; }
    const cols = season === 'autumn' ? ['#b8702a', '#d08a30', '#e0a848'] : ['#3f6a2e', '#5a8a3a', '#7aa84a'];
    const cy = y - r * 1.1, sway = Math.sin(this.time * 1.2 + x) * 1.5;
    ctx.fillStyle = cols[0]; ctx.beginPath(); ctx.arc(x + sway, cy, r, 0, 6.28); ctx.arc(x - r * 0.5 + sway, cy + r * 0.2, r * 0.7, 0, 6.28); ctx.arc(x + r * 0.5 + sway, cy + r * 0.2, r * 0.7, 0, 6.28); ctx.fill();
    ctx.fillStyle = cols[1]; ctx.beginPath(); ctx.arc(x - r * 0.15 + sway, cy - r * 0.15, r * 0.75, 0, 6.28); ctx.fill();
    ctx.fillStyle = cols[2]; ctx.beginPath(); ctx.arc(x - r * 0.35 + sway, cy - r * 0.4, r * 0.4, 0, 6.28); ctx.fill();
  },
  barrel(ctx, x, y) { ctx.fillStyle = '#7a5a34'; ctx.beginPath(); ctx.ellipse(x, y - 4, 4, 5.5, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x - 4, y - 6.5, 8, 1); ctx.fillRect(x - 4, y - 1.5, 8, 1); ctx.fillStyle = 'rgba(255,220,170,0.25)'; ctx.fillRect(x - 2, y - 8, 1.5, 8); },
  drawProp(ctx, p, st) {
    switch (p.t) {
      case 'crates': for (const [dx, dy, sz] of [[0, 0, 9], [10, 1, 8], [4, -8, 8]]) { ctx.fillStyle = '#9a7a4a'; ctx.fillRect(p.x + dx, p.y + dy - sz, sz, sz); ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 1; ctx.strokeRect(p.x + dx + 0.5, p.y + dy - sz + 0.5, sz - 1, sz - 1); ctx.beginPath(); ctx.moveTo(p.x + dx, p.y + dy - sz); ctx.lineTo(p.x + dx + sz, p.y + dy); ctx.stroke(); } break;
      case 'barrels': this.barrel(ctx, p.x, p.y); this.barrel(ctx, p.x + 9, p.y + 1); this.barrel(ctx, p.x + 4, p.y - 8); break;
      case 'laundry': { const x1 = 112, x2 = 148, y = 462; ctx.strokeStyle = '#333'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x1, y); ctx.quadraticCurveTo((x1 + x2) / 2, y + 4, x2, y); ctx.stroke(); ['#e8e0c8', '#7a3a3a', '#3a5a7a', '#e8e0c8'].forEach((c, i) => { const lx = x1 + 6 + i * 8, sw = Math.sin(this.time * 3 + i) * 1.5; ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(lx, y + 1); ctx.lineTo(lx + 5, y + 1); ctx.lineTo(lx + 5 + sw, y + 9); ctx.lineTo(lx + sw, y + 9); ctx.fill(); }); break; }
      case 'well': { ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(p.x + 3, p.y + 3, 10, 4, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = this.pat.stone; ctx.beginPath(); ctx.ellipse(p.x, p.y, 9, 5, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = '#7a7466'; ctx.fillRect(p.x - 9, p.y - 6, 18, 6); ctx.fillStyle = '#3f6a8a'; ctx.beginPath(); ctx.ellipse(p.x, p.y - 6, 7, 3, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = '#4a3320'; ctx.fillRect(p.x - 8, p.y - 24, 2, 20); ctx.fillRect(p.x + 6, p.y - 24, 2, 20); ctx.fillStyle = '#5a3a2a'; ctx.beginPath(); ctx.moveTo(p.x - 12, p.y - 22); ctx.lineTo(p.x + 12, p.y - 22); ctx.lineTo(p.x, p.y - 30); ctx.fill(); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(p.x - 8, p.y - 18, 16, 1.5); ctx.fillStyle = '#5a4a3a'; ctx.fillRect(p.x - 2, p.y - 16, 4, 5); break; }
      case 'cross': { ctx.fillStyle = '#5a5048'; ctx.fillRect(p.x - 1.5, p.y - 22, 3, 22); ctx.fillRect(p.x - 6, p.y - 17, 12, 3); ctx.fillStyle = '#3a3028'; ctx.fillRect(p.x - 4, p.y - 2, 8, 3); break; }
      case 'nets': { ctx.strokeStyle = 'rgba(60,50,40,0.7)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(p.x, p.y - 12); ctx.lineTo(p.x, p.y); ctx.moveTo(p.x + 22, p.y - 12); ctx.lineTo(p.x + 22, p.y); ctx.stroke(); for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(p.x, p.y - 11 + i * 3); ctx.quadraticCurveTo(p.x + 11, p.y - 8 + i * 3, p.x + 22, p.y - 11 + i * 3); ctx.stroke(); } break; }
      case 'bench': ctx.fillStyle = '#6a4a2a'; ctx.fillRect(p.x, p.y - 5, 18, 3); ctx.fillRect(p.x + 2, p.y - 2, 2, 4); ctx.fillRect(p.x + 14, p.y - 2, 2, 4); break;
      case 'stalls': this.drawMarket(ctx, HK.BUILDING.market, st); break;
    }
  },
  drawBuilding(ctx, b, st, season) {
    switch (b.kind) {
      case 'eave': this.drawEave(ctx, b, st, season); break;
      case 'gable': this.drawGable(ctx, b, st, season); break;
      case 'hall': this.drawHall(ctx, b, st, season); break;
      case 'townhall': this.drawTownhall(ctx, b, st, season); break;
      case 'church': this.drawChurch(ctx, b, st, season); break;
      case 'huts': this.drawHuts(ctx, b, st, season); break;
      case 'yard': this.drawYard(ctx, b); break;
      case 'plot': this.drawPlot(ctx, b, st, season); break;
      case 'market': case 'gate': return;
    }
    const owned = (b.panel === 'house' && st.houses[b.plot].owner === 'player') || (b.panel === 'workshop' && st.workshops[b.plot].type) || (b.id === 'tavern' && st.tavernOwned) || (b.id === 'bathhouse' && st.bathhouseOwned) || b.id === 'kontor' || b.id === 'warehouse';
    if (owned) { const fx = b.x + 6, fy = b.y + (b.kind === 'gable' ? b.h * 0.46 : b.h * 0.42) - 2; ctx.fillStyle = '#3a2a1a'; ctx.fillRect(fx - 0.6, fy - 16, 1.2, 16); ctx.fillStyle = '#e0b040'; ctx.beginPath(); ctx.moveTo(fx, fy - 16); ctx.lineTo(fx + 10 + Math.sin(this.time * 4 + b.x) * 2, fy - 12); ctx.lineTo(fx, fy - 8); ctx.fill(); }
    if (b.panel === 'house' && st.houses[b.plot].damaged) { ctx.fillStyle = 'rgba(20,15,10,0.6)'; ctx.fillRect(b.x, b.y + b.h * 0.42, b.w, b.h * 0.58); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(b.x + 4, b.y, b.w - 8, b.h * 0.42); }
    // Beschriftung
    const labels = { church: ['Kirche', 'Church'], guild: ['Gilde', 'Guild'], townhall: ['Rathaus', 'Town hall'], tavern: ['Taverne', 'Tavern'], bank: ['Wechsler', 'Changer'], kontor: ['Kontor', 'Office'], warehouse: ['Lagerhaus', 'Warehouse'], customs: ['Zoll', 'Customs'], bathhouse: ['Badehaus', 'Bathhouse'], bailiff: ['Vogtei', 'Bailiff'], shipyard: ['Werft', 'Shipyard'], fishermen: ['Fischer', 'Fishermen'] };
    if (labels[b.id]) { ctx.font = `bold ${b.row === 0 ? 9 : 10}px Georgia, serif`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(30,22,12,0.75)'; ctx.fillStyle = '#f3e6c8'; ctx.strokeText(labels[b.id][HK.LANG === 'de' ? 0 : 1], b.x + b.w / 2, b.y + b.h + 11); ctx.fillText(labels[b.id][HK.LANG === 'de' ? 0 : 1], b.x + b.w / 2, b.y + b.h + 11); }
  },

  /* ---------- Schiffe, Boote, Karawanen, Karren ---------- */
  drawShip(ctx, x, y, s, origin, docked, selected) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const flag = { luebeck: '#c8102e', bruegge: '#3b6ac2', bergen: '#3b9a4a', danzig: '#c29a3b', riga: '#7a3bc2', stockholm: '#e0c020', london: '#a02020', own: '#e0b040' }[origin] || '#888';
    // Spiegelung
    ctx.save(); ctx.globalAlpha = 0.22; ctx.scale(1, -0.55); ctx.translate(0, -4); this.shipBody(ctx, flag, docked, true); ctx.restore();
    this.shipBody(ctx, flag, docked, false);
    if (selected) { ctx.strokeStyle = '#ffd766'; ctx.lineWidth = 2 / s; ctx.setLineDash([5, 4]); ctx.strokeRect(-52, -66, 104, 74); ctx.setLineDash([]); }
    ctx.restore();
  },
  shipBody(ctx, flag, docked, mirror) {
    // Rumpf einer Kogge in Seitenansicht: Heck links mit Kastell, Bug rechts
    ctx.fillStyle = '#4a2e16'; ctx.beginPath(); ctx.moveTo(-44, -8); ctx.quadraticCurveTo(-40, 4, -30, 5); ctx.lineTo(30, 5); ctx.quadraticCurveTo(44, 2, 50, -14); ctx.lineTo(44, -14); ctx.quadraticCurveTo(40, -2, 30, -2); ctx.lineTo(-30, -2); ctx.quadraticCurveTo(-36, -2, -40, -12); ctx.lineTo(-46, -12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6b4424'; ctx.beginPath(); ctx.moveTo(-46, -12); ctx.lineTo(44, -14); ctx.lineTo(48, -20); ctx.lineTo(-48, -18); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; for (let i = -40; i < 44; i += 7) { ctx.beginPath(); ctx.moveTo(i, -13); ctx.lineTo(i + 1, 4); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(-42, -6); ctx.lineTo(42, -6); ctx.moveTo(-36, 0); ctx.lineTo(36, 0); ctx.stroke();
    ctx.fillStyle = '#c9a24a'; ctx.fillRect(-40, -9, 80, 1.5); // Zierleiste
    // Heckkastell
    ctx.fillStyle = '#7a5030'; ctx.fillRect(-46, -34, 26, 16); ctx.fillStyle = '#3a2410'; for (let i = 0; i < 4; i++) ctx.fillRect(-44 + i * 6, -33, 3, 5); ctx.fillStyle = '#5a3a1a'; ctx.fillRect(-48, -36, 30, 3);
    // Mast, Rah, Segel
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-2, -66, 4, 50);
    ctx.fillStyle = '#5a4a3a'; ctx.fillRect(-4, -56, 8, 4); ctx.fillStyle = '#4a3a2a'; ctx.fillRect(-6, -62, 12, 5); // Mastkorb
    ctx.fillStyle = '#2a1a0a'; ctx.fillRect(-26, -54, 52, 2.5); // Rah
    if (docked) { ctx.fillStyle = '#e8e0c8'; ctx.beginPath(); ctx.moveTo(-26, -52); ctx.quadraticCurveTo(-13, -45, 0, -50); ctx.quadraticCurveTo(13, -45, 26, -52); ctx.lineTo(26, -49); ctx.quadraticCurveTo(13, -42, 0, -46); ctx.quadraticCurveTo(-13, -42, -26, -49); ctx.fill(); }
    else { ctx.fillStyle = '#f0e8d4'; ctx.beginPath(); ctx.moveTo(-26, -52); ctx.lineTo(26, -52); ctx.quadraticCurveTo(34, -34, 26, -18); ctx.lineTo(-26, -18); ctx.quadraticCurveTo(-18, -34, -26, -52); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.moveTo(-26, -52); ctx.lineTo(-10, -52); ctx.lineTo(-10, -18); ctx.lineTo(-26, -18); ctx.quadraticCurveTo(-18, -34, -26, -52); ctx.fill(); ctx.fillStyle = '#c8102e'; ctx.beginPath(); ctx.moveTo(-8, -40); ctx.lineTo(8, -40); ctx.lineTo(0, -28); ctx.fill(); }
    // Takelage
    ctx.strokeStyle = 'rgba(30,20,10,0.8)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, -64); ctx.lineTo(46, -16); ctx.moveTo(0, -64); ctx.lineTo(-44, -18); ctx.moveTo(-26, -54); ctx.lineTo(-40, -22); ctx.moveTo(26, -54); ctx.lineTo(40, -22); ctx.stroke();
    // Flagge
    if (!mirror) { ctx.fillStyle = flag; ctx.beginPath(); ctx.moveTo(2, -66); ctx.lineTo(14 + Math.sin(this.time * 5) * 2, -63); ctx.lineTo(2, -60); ctx.fill(); }
  },
  drawBoat(ctx, x, y, own) {
    ctx.save(); ctx.globalAlpha = 0.2; ctx.fillStyle = '#4a3018'; ctx.beginPath(); ctx.moveTo(x - 13, y + 2); ctx.lineTo(x + 13, y + 2); ctx.lineTo(x + 9, y + 8); ctx.lineTo(x - 9, y + 8); ctx.fill(); ctx.restore();
    ctx.fillStyle = own ? '#7a5030' : '#4a3018'; ctx.beginPath(); ctx.moveTo(x - 14, y - 4); ctx.quadraticCurveTo(x - 12, y + 3, x - 6, y + 3); ctx.lineTo(x + 8, y + 3); ctx.quadraticCurveTo(x + 14, y + 2, x + 16, y - 5); ctx.lineTo(x + 12, y - 5); ctx.lineTo(x - 12, y - 4); ctx.fill();
    ctx.fillStyle = '#c9a24a'; ctx.fillRect(x - 11, y - 3, 22, 1);
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x - 1, y - 20, 2, 16);
    ctx.fillStyle = own ? '#e0b040' : '#e8e0c8'; ctx.beginPath(); ctx.moveTo(x + 1, y - 19); ctx.lineTo(x + 10, y - 6); ctx.lineTo(x + 1, y - 6); ctx.fill();
    this.drawPerson(ctx, x - 5, y + 2, '#3a5a7a', 'fisher', 1, false, '#d9a98a', 0, 1, null, null, 0.6);
  },
  drawCaravan(ctx, x, y, t) {
    this.shadowPoly(ctx, x - 20, y - 14, 44, 16);
    ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x - 20, y - 14, 30, 12); ctx.fillStyle = this.pat.planks; ctx.fillRect(x - 20, y - 14, 30, 12);
    ctx.fillStyle = '#d9cfb0'; ctx.beginPath(); ctx.moveTo(x - 22, y - 14); ctx.quadraticCurveTo(x - 5, y - 32, x + 12, y - 14); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.moveTo(x - 16, y - 14); ctx.quadraticCurveTo(x - 5, y - 28, x + 6, y - 14); ctx.stroke();
    ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.arc(x - 13, y, 5, 0, 6.28); ctx.arc(x + 3, y, 5, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + t; ctx.beginPath(); ctx.moveTo(x - 13, y); ctx.lineTo(x - 13 + Math.cos(a) * 4, y + Math.sin(a) * 4); ctx.moveTo(x + 3, y); ctx.lineTo(x + 3 + Math.cos(a) * 4, y + Math.sin(a) * 4); ctx.stroke(); }
    ctx.fillStyle = '#8a6a4a'; ctx.beginPath(); ctx.ellipse(x + 20, y - 6, 10, 6, 0, 0, 6.28); ctx.fill(); ctx.fillRect(x + 26, y - 14, 6, 8); ctx.fillRect(x + 14, y - 2, 2, 5); ctx.fillRect(x + 24, y - 2, 2, 5); ctx.fillStyle = '#e8e0c8'; ctx.fillRect(x + 30, y - 18, 1.5, 5);
    ctx.fillStyle = '#c9b078'; ctx.beginPath(); ctx.moveTo(x - 40, y + 4); ctx.lineTo(x - 18, y + 4); ctx.lineTo(x - 29, y - 12); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.moveTo(x - 29, y + 4); ctx.lineTo(x - 18, y + 4); ctx.lineTo(x - 29, y - 12); ctx.fill();
    if (this.light() < 0.6) { ctx.fillStyle = `rgba(255,160,60,${0.8 + Math.sin(t * 9) * 0.2})`; ctx.beginPath(); ctx.arc(x - 46, y + 2, 3, 0, 6.28); ctx.fill(); this.lamps.push([x - 46, y + 2]); }
  },
  drawCart(ctx, c, t) {
    const x = c.x, y = c.y, d = c.dir;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(x, y + 3, 18, 3, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = this.pat.planks; ctx.fillRect(x - 12, y - 10, 20, 9); ctx.fillStyle = '#b8a070'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(x - 7 + i * 5, y - 11, 4, 3, 0, 0, 6.28); ctx.fill(); }
    ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.arc(x - 6, y, 4, 0, 6.28); ctx.arc(x + 5, y, 4, 0, 6.28); ctx.fill();
    ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 1; for (let i = 0; i < 3; i++) { const a = i * 2.09 + t * 3 * d; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x - 6 + Math.cos(a) * 3.5, y + Math.sin(a) * 3.5); ctx.stroke(); }
    if (c.ox) { ctx.fillStyle = '#6a4a3a'; ctx.beginPath(); ctx.ellipse(x + 18 * d, y - 6, 9, 5, 0, 0, 6.28); ctx.fill(); ctx.fillRect(x + 24 * d - 3, y - 13, 6, 8); const st = Math.sin(t * 6) * 2; ctx.fillRect(x + 13 * d - 1, y - 2, 2, 5 + st); ctx.fillRect(x + 22 * d - 1, y - 2, 2, 5 - st); }
    else this.drawPerson(ctx, x + 16 * d, y + 2, '#5a6a4a', 'citizen', 1, false, '#e8c39e', t * 9, d, null, null, this.depth(y));
  },
  drawChicken(ctx, x, y, t) { ctx.fillStyle = '#f0ece0'; ctx.beginPath(); ctx.ellipse(x, y - 2, 3, 2.2, 0, 0, 6.28); ctx.fill(); ctx.beginPath(); ctx.arc(x + 2.5, y - 4, 1.4, 0, 6.28); ctx.fill(); ctx.fillStyle = '#c8102e'; ctx.fillRect(x + 2, y - 6, 1, 1.2); ctx.fillStyle = '#e0a020'; ctx.fillRect(x + 3.5, y - 4, 1.2, 0.8); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x - 1, y, 0.8, 2 + Math.sin(t * 10 + x) * 0.5); ctx.fillRect(x + 1, y, 0.8, 2 - Math.sin(t * 10 + x) * 0.5); },

  /* ---------- Personen ---------- */
  drawPerson(ctx, x, y, color, type, alpha, hover, skin, phase, dir, person, w, forceScale) {
    const d = forceScale || this.depth(y);
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(d * (type === 'child' ? 0.7 : 1), d * (type === 'child' ? 0.7 : 1));
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(1, 1, 5, 2, 0, 0, 6.28); ctx.fill();
    if (hover) { ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, -9, 11, 0, 6.28); ctx.stroke(); }
    const step = Math.sin(phase || 0) * 2.5;
    ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-1.5, -5); ctx.lineTo(-1.5 + step, 0); ctx.moveTo(1.5, -5); ctx.lineTo(1.5 - step, 0); ctx.stroke();
    // Umhang / Rock
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-3, -13); ctx.lineTo(3, -13); ctx.lineTo(5, -4); ctx.lineTo(-5, -4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(-3, -13, 2.5, 9);
    if (type === 'monk') { ctx.strokeStyle = '#d9c9a0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-4, -8); ctx.lineTo(4, -8); ctx.stroke(); }
    if (type === 'guard') { ctx.fillStyle = '#9a9aa0'; ctx.fillRect(-3, -13, 6, 5); ctx.strokeStyle = '#6a5a4a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(5, -24); ctx.stroke(); ctx.fillStyle = '#8a8a90'; ctx.beginPath(); ctx.moveTo(5, -24); ctx.lineTo(3.5, -20); ctx.lineTo(6.5, -20); ctx.fill(); }
    if (type === 'beggar') { ctx.strokeStyle = '#6a5a4a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-4, -14); ctx.stroke(); }
    if (w && w.basket) { ctx.fillStyle = '#b8a070'; ctx.beginPath(); ctx.ellipse(5 * (dir || 1), -6, 3, 2.5, 0, 0, 6.28); ctx.fill(); }
    // Arme
    ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-3, -12); ctx.lineTo(-4 - step * 0.4, -6); ctx.moveTo(3, -12); ctx.lineTo(4 + step * 0.4, -6); ctx.stroke();
    // Kopf
    ctx.fillStyle = skin || '#e8c39e'; ctx.beginPath(); ctx.arc(0, -16, 3.2, 0, 6.28); ctx.fill();
    if (type === 'monk') { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, -16.5, 3.8, Math.PI * 1.05, Math.PI * 1.95); ctx.fill(); }
    else if (type === 'merchant' || type === 'static' || (w && w.hat)) { ctx.fillStyle = type === 'static' && person === 'priest' ? '#1a1a1a' : '#2a1a0a'; ctx.fillRect(-4.5, -19.5, 9, 1.5); ctx.fillRect(-3, -23, 6, 4); }
    else if (type === 'fisher') { ctx.fillStyle = '#8a8a7a'; ctx.beginPath(); ctx.arc(0, -17, 3.6, Math.PI, 0); ctx.fill(); }
    else if (type === 'citizen' && !(w && w.hat)) { ctx.fillStyle = '#e8e0c8'; ctx.beginPath(); ctx.arc(0, -16.5, 3.6, Math.PI * 1.1, Math.PI * 1.9); ctx.fill(); }
    if (person === 'priest') { ctx.fillStyle = '#f0ece0'; ctx.fillRect(-2.5, -13, 5, 1.5); }
    if (person === 'mayor') { ctx.fillStyle = '#e0b040'; ctx.fillRect(-3, -11, 6, 1.5); }
    if (person === 'customs' || person === 'bailiff') { ctx.fillStyle = '#e0b040'; ctx.beginPath(); ctx.arc(0, -10, 1.3, 0, 6.28); ctx.fill(); }
    ctx.restore();
  },

  /* ---------- Wetter und Licht ---------- */
  drawWeather(ctx, t, season) {
    if (this.weather === 'rain') { ctx.strokeStyle = 'rgba(200,215,235,0.35)'; ctx.lineWidth = 1; for (let i = 0; i < 140; i++) { const x = ((i * 67 + t * 260) % 1000) - 20, y = ((i * 131 + t * 420) % 700) - 30; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 12); ctx.stroke(); } }
    if (this.weather === 'snow') { ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 110; i++) { const x = ((i * 89 + t * 18 + Math.sin(t + i) * 20) % 1000) - 20, y = ((i * 151 + t * 40) % 680) - 20; ctx.beginPath(); ctx.arc(x, y, 1.2 + (i % 3) * 0.5, 0, 6.28); ctx.fill(); } }
    if (this.weather === 'cloudy') { ctx.fillStyle = 'rgba(120,125,135,0.10)'; ctx.fillRect(0, 0, 960, 640); }
  },
  drawLighting(ctx, P, t) {
    const l = P.amb;
    if (P.tint[3] > 0.005) { ctx.fillStyle = this.rgb(P.tint, P.tint[3]); ctx.fillRect(0, 0, 960, 640); }
    // Sonnenlicht von der Seite: warmer Schleier
    const st = this.sunT();
    if (st !== null && Math.sin(st * Math.PI) < 0.45) { const g = ctx.createLinearGradient(st < 0.5 ? 0 : 960, 0, st < 0.5 ? 960 : 0, 0); g.addColorStop(0, `rgba(255,190,110,${0.14 * (1 - Math.sin(st * Math.PI) / 0.45)})`); g.addColorStop(1, 'rgba(255,190,110,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 960, 640); }
    if (l < 0.7) {
      const k = HK.clamp((0.7 - l) / 0.4, 0, 1);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const [x, y, w, h] of this.windows) { if (((x * 7 + y * 13) | 0) % 5 === 0) continue; ctx.fillStyle = `rgba(255,170,70,${0.55 * k})`; ctx.fillRect(x + 1, y + 1, w - 2, h - 2); const g = ctx.createRadialGradient(x + w / 2, y + h / 2, 1, x + w / 2, y + h / 2, 12); g.addColorStop(0, `rgba(255,160,60,${0.22 * k})`); g.addColorStop(1, 'rgba(255,160,60,0)'); ctx.fillStyle = g; ctx.fillRect(x - 12, y - 12, w + 24, h + 24); }
      for (const [x, y] of this.lamps) { const g = ctx.createRadialGradient(x, y, 1, x, y, 46); g.addColorStop(0, `rgba(255,190,90,${0.5 * k})`); g.addColorStop(0.3, `rgba(255,170,70,${0.18 * k})`); g.addColorStop(1, 'rgba(255,160,60,0)'); ctx.fillStyle = g; ctx.fillRect(x - 46, y - 46, 92, 92); ctx.fillStyle = `rgba(255,230,160,${0.9 * k})`; ctx.beginPath(); ctx.arc(x, y - 1, 2, 0, 6.28); ctx.fill(); }
      // Mondlicht auf dem Wasser bereits im Glitzern; Sterne-Reflexion leicht
      ctx.restore();
    }
  },
};
