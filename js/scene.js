/* Stadtszene Sundhaven, isometrisch: Wasser, Boden, sortierte Objekte, Licht, Wetter */
'use strict';
const I = HK.Iso;

HK.Scene = {
  canvas: null, ctx: null, RS: 2, PICK_SCALE: 1, walkers: [], carts: [], chickens: [], gulls: [], smoke: [], shipAnim: {}, hover: null, selected: null,
  clock: 0.35, time: 0, pat: {}, windows: [], lamps: [], weather: 'clear', weatherDay: -1, lastSeason: null, ground: null, grain: null,

  init(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    canvas.width = HK.SCENE.W * this.RS; canvas.height = HK.SCENE.H * this.RS;
    this.makePatterns(); this.makeGrain();
    for (let i = 0; i < 70; i++) this.walkers.push(this.makeWalker(true));
    for (let i = 0; i < 9; i++) this.gulls.push({ x: HK.rnd(40, 700), y: HK.rnd(80, 1000), a: HK.rnd(0, 6.28), r: HK.rnd(25, 60), s: HK.rnd(0.25, 0.6) });
    this.carts = [{ a: [9.5, 2.8], b: [9.5, 17.8], t: 0.2, dir: 1, v: 0.25, ox: true }, { a: [8.0, 10], b: [27.0, 10], t: 0.7, dir: -1, v: 0.2, ox: false }, { a: [24, 2.8], b: [24, 17.8], t: 0.5, dir: 1, v: 0.22, ox: true }];
    for (let i = 0; i < 8; i++) this.chickens.push({ cx: i < 3 ? 8.9 : i < 5 ? 17.0 : 26.6, cy: i < 3 ? -0.2 : i < 5 ? 9.7 : 9.2, x: 0, y: 0, t: Math.random() * 10, a: Math.random() * 6.28 });
    this.initInput(canvas);
  },
  /* ---------- Kamera: Zoom und Verschieben ---------- */
  cam: { z: 1, x: 0, y: 0 },
  ZOOM_MIN: 1, ZOOM_MAX: 2.8,
  zoomMin() { return Math.max(HK.SCENE.W / HK.MAP.W, HK.SCENE.H / HK.MAP.H); },
  clampCam() { const z = this.cam.z; this.cam.x = HK.clamp(this.cam.x, 0, HK.MAP.W - HK.SCENE.W / z); this.cam.y = HK.clamp(this.cam.y, 0, HK.MAP.H - HK.SCENE.H / z); },
  /* Zoom um einen Ankerpunkt (Bildschirm-Szenenkoordinaten), der dabei stehen bleibt */
  setZoom(z, ax, ay) {
    const old = this.cam.z; z = HK.clamp(z, this.zoomMin(), this.ZOOM_MAX);
    if (ax === undefined) { ax = HK.SCENE.W / 2; ay = HK.SCENE.H / 2; }
    const wx = ax / old + this.cam.x, wy = ay / old + this.cam.y;
    this.cam.z = z; this.cam.x = wx - ax / z; this.cam.y = wy - ay / z; this.clampCam();
  },
  panBy(dx, dy) { this.cam.x -= dx / this.cam.z; this.cam.y -= dy / this.cam.z; this.clampCam(); },
  resetCam() { this.cam.z = this.zoomMin(); this.cam.x = 0; this.cam.y = 0; this.clampCam(); },
  viewTransform(ctx, scale) { const z = this.cam.z * scale; ctx.setTransform(z, 0, 0, z, -this.cam.x * z, -this.cam.y * z); },
  /* Bildschirmpunkt (Szenenpixel des Canvas) → Szenenkoordinaten der ungezoomten Karte */
  toMap(p) { return { x: p.x / this.cam.z + this.cam.x, y: p.y / this.cam.z + this.cam.y }; },
  initInput(canvas) {
    canvas.style.touchAction = 'none';
    const ptrs = new Map(); let drag = null, pinch = null;
    const hoverAt = e => { const p = this.toMap(this.toScene(e)); const h = this.hit(p.x, p.y); this.hover = h; canvas.style.cursor = h ? 'pointer' : 'grab'; this.tooltip(h, e); };
    canvas.addEventListener('pointerdown', e => {
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); canvas.setPointerCapture(e.pointerId);
      if (ptrs.size === 1) drag = { x: e.clientX, y: e.clientY, moved: false };
      else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: this.cam.z }; drag = null; }
    });
    canvas.addEventListener('pointermove', e => {
      if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const r = canvas.getBoundingClientRect(), k = HK.SCENE.W / r.width;
      if (pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); this.setZoom(pinch.z * d / (pinch.d || 1), ((a.x + b.x) / 2 - r.left) * k, ((a.y + b.y) / 2 - r.top) * k); return; }
      if (drag) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!drag.moved && Math.hypot(dx, dy) > 4) { drag.moved = true; canvas.style.cursor = 'grabbing'; this.tooltip(null); }
        if (drag.moved) { this.panBy(dx * k, dy * k); drag.x = e.clientX; drag.y = e.clientY; return; }
      }
      if (e.pointerType === 'mouse') hoverAt(e);
    });
    const up = e => {
      ptrs.delete(e.pointerId);
      if (drag && !drag.moved && e.type === 'pointerup') { const p = this.toMap(this.toScene(e)); const h = this.hit(p.x, p.y, true); if (h) HK.UI.sceneClick(h); }
      if (ptrs.size < 2) pinch = null;
      if (ptrs.size === 0) { drag = null; canvas.style.cursor = this.hover ? 'pointer' : 'grab'; }
    };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('mouseleave', () => { this.hover = null; this.tooltip(null); });
    canvas.addEventListener('wheel', e => { e.preventDefault(); const p = this.toScene(e); this.setZoom(this.cam.z * (e.deltaY < 0 ? 1.15 : 1 / 1.15), p.x, p.y); if (e.pointerType !== 'touch') hoverAt(e); }, { passive: false });
    canvas.addEventListener('dblclick', e => { e.preventDefault(); const p = this.toScene(e); this.setZoom(this.cam.z < 1.5 ? 2 : 1, p.x, p.y); });
    window.addEventListener('keydown', e => {
      if (!HK.state || HK.preview || HK.UI.modalOpen) return; const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      const step = 80;
      if (e.key === '+' || e.key === '=') this.setZoom(this.cam.z * 1.2); else if (e.key === '-') this.setZoom(this.cam.z / 1.2); else if (e.key === '0') this.resetCam();
      else if (e.key === 'ArrowLeft') this.panBy(step, 0); else if (e.key === 'ArrowRight') this.panBy(-step, 0); else if (e.key === 'ArrowUp') this.panBy(0, step); else if (e.key === 'ArrowDown') this.panBy(0, -step); else return;
      e.preventDefault();
    });
    document.querySelectorAll('#zoom-ctl button').forEach(b => b.addEventListener('click', () => { const a = b.dataset.zoom; if (a === 'in') this.setZoom(this.cam.z * 1.25); else if (a === 'out') this.setZoom(this.cam.z / 1.25); else this.resetCam(); }));
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
    this.pat.cobble = mk(20, 10, (g) => { g.fillStyle = '#9f9681'; g.fillRect(0, 0, 20, 10); for (const [x, y, w, h] of [[1, 1, 7, 3.5], [10, 0.5, 8, 4], [0, 5.5, 6, 4], [8, 5.5, 5, 4], [15, 5.5, 5, 4]]) { g.fillStyle = (x + y) % 3 ? '#a9a18a' : '#948c77'; g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 6.28); g.fill(); g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.ellipse(x + w / 2 - 1, y + h / 2 - 1, w / 3, h / 4, 0, 0, 6.28); g.fill(); } });
    this.pat.earth = mk(40, 40, (g, w, h) => { g.fillStyle = '#aa9f7b'; g.fillRect(0, 0, w, h); for (let i = 0; i < 160; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(90,70,40,0.18)' : 'rgba(255,245,220,0.14)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 1.5); } });
    this.pat.grass = mk(30, 30, (g, w, h) => { g.fillStyle = '#6e7d58'; g.fillRect(0, 0, w, h); for (let i = 0; i < 110; i++) { g.strokeStyle = Math.random() < 0.5 ? 'rgba(46,58,33,0.4)' : 'rgba(174,192,138,0.35)'; const x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 1, y - 3); g.stroke(); } for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(120,150,70,0.35)'; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 5, 2.5, 0, 0, 6.28); g.fill(); } });
    this.pat.snow = mk(30, 30, (g, w, h) => { g.fillStyle = '#e9edf0'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(180,195,215,0.35)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 1); } });
    this.pat.stone = mk(24, 12, (g) => { g.fillStyle = '#8b8476'; g.fillRect(0, 0, 24, 12); g.fillStyle = '#6b655a'; g.fillRect(0, 5, 24, 1); g.fillRect(0, 11, 24, 1); g.fillRect(11, 0, 1, 5); g.fillRect(4, 6, 1, 5); g.fillRect(18, 6, 1, 5); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, 0, 11, 2); g.fillRect(12, 0, 12, 2); });
    this.pat.planks = mk(8, 24, (g) => { g.fillStyle = '#9f8361'; g.fillRect(0, 0, 8, 24); g.fillStyle = '#6e5944'; g.fillRect(7, 0, 1, 24); g.fillStyle = 'rgba(255,220,170,0.15)'; g.fillRect(1, 0, 1, 24); g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(0, 11, 8, 1); });
    this.pat.field = mk(24, 24, (g) => { g.fillStyle = '#ab9b68'; g.fillRect(0, 0, 24, 24); g.strokeStyle = 'rgba(90,70,30,0.35)'; for (let i = 0; i < 24; i += 4) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 12, 24); g.stroke(); } });
  },
  makeGrain() { const c = document.createElement('canvas'); c.width = 240; c.height = 160; const g = c.getContext('2d'); const img = g.createImageData(240, 160); for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (Math.random() - 0.5) * 90; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; } g.putImageData(img, 0, 0); this.grain = c; },

  /* ---------- Zeit, Licht, Jahreszeit ---------- */
  KEYS: [
    { c: 0.00, top: [14, 24, 33], near: [18, 32, 40], far: [32, 50, 59], tint: [10, 30, 46, 0.58], amb: 0.28 },
    { c: 0.20, top: [16, 28, 38], near: [19, 33, 41], far: [36, 55, 65], tint: [10, 30, 46, 0.54], amb: 0.3 },
    { c: 0.26, top: [77, 91, 107], near: [69, 95, 105], far: [202, 146, 118], tint: [255, 160, 95, 0.16], amb: 0.7 },
    { c: 0.34, top: [134, 182, 201], near: [62, 102, 118], far: [128, 165, 177], tint: [255, 228, 186, 0.08], amb: 0.95 },
    { c: 0.50, top: [109, 163, 188], near: [54, 99, 117], far: [101, 146, 164], tint: [255, 238, 208, 0.06], amb: 1 },
    { c: 0.66, top: [121, 158, 180], near: [62, 98, 113], far: [146, 146, 146], tint: [255, 214, 164, 0.1], amb: 0.95 },
    { c: 0.76, top: [100, 119, 142], near: [64, 88, 101], far: [206, 137, 109], tint: [255, 150, 78, 0.2], amb: 0.75 },
    { c: 0.84, top: [49, 65, 83], near: [32, 51, 61], far: [95, 66, 92], tint: [46, 44, 74, 0.38], amb: 0.45 },
    { c: 0.90, top: [16, 27, 36], near: [19, 33, 41], far: [34, 53, 63], tint: [10, 30, 46, 0.56], amb: 0.3 },
    { c: 1.00, top: [14, 24, 33], near: [18, 32, 40], far: [32, 50, 59], tint: [10, 30, 46, 0.58], amb: 0.28 },
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
    if (HK.state && HK.state.pilgrimage) for (let i = 0; i < 3; i++) types.push({ id: 'pilgrim', colors: ['#6a6058', '#5a4a3a', '#7a6a5a', '#4a4a4a'] });
    const t = HK.pick(types), keys = Object.keys(HK.ROAD_NODES);
    const from = HK.pick(keys), to = HK.pick(HK.ROAD_ADJ[from]);
    return { type: t.id, color: HK.pick(t.colors), from, to, t: anywhere ? Math.random() : 0, speed: HK.rnd(0.25, 0.5) * (t.id === 'child' ? 1.5 : t.id === 'beggar' ? 0.6 : 1), off: HK.rnd(-0.22, 0.22), pause: 0, nightOwl: Math.random() < 0.2 || t.id === 'guard', skin: HK.pick(['#e8c39e', '#d9a98a', '#c9946c']), hat: Math.random() < 0.5, basket: Math.random() < 0.3, phase: Math.random() * 6.28 };
  },
  /* Hindernisraster: Requisiten und Gebäude werden einmal in ein Gitter gestempelt, und zu jeder
     besetzten Zelle wird die nächste freie Zelle gemerkt. Damit landet nie ein Passant in einer Kiste. */
  GRID: { x0: -10, y0: -18, cell: 0.2, w: 290, h: 230 },
  buildGrid() {
    const G = this.GRID, n = G.w * G.h, blocked = new Uint8Array(n);
    const stamp = (b) => {
      const i0 = Math.max(0, Math.floor((b[0] - G.x0) / G.cell)), i1 = Math.min(G.w - 1, Math.ceil((b[2] - G.x0) / G.cell));
      const j0 = Math.max(0, Math.floor((b[1] - G.y0) / G.cell)), j1 = Math.min(G.h - 1, Math.ceil((b[3] - G.y0) / G.cell));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) blocked[j * G.w + i] = 1;
    };
    for (const p of HK.PROPS) { if (p.t === 'stalls') continue; const b = this.propBox(p); stamp([b[0] - 0.08, b[1] - 0.08, b[2] + 0.08, b[3] + 0.08]); }
    for (const b of HK.BUILDINGS) if (b.kind !== 'water' && b.kind !== 'market') stamp([b.x - 0.06, b.y - 0.06, b.x + b.w + 0.06, b.y + b.d + 0.06]);
    // Wasser sperren, Stegplanken bleiben begehbar
    for (let j = 0; j < G.h; j++) for (let i = 0; i < G.w; i++) { const k = j * G.w + i; if (blocked[k]) continue;
      const wx = G.x0 + (i + 0.5) * G.cell, wy = G.y0 + (j + 0.5) * G.cell;
      if (this.isWater(wx, wy) && !this.deckZ(wx, wy)) blocked[k] = 1; }
    // Zu jeder besetzten Zelle die nächste freie suchen, im Ring nach außen
    const dx = new Int8Array(n), dy = new Int8Array(n);
    for (let j = 0; j < G.h; j++) for (let i = 0; i < G.w; i++) {
      const k = j * G.w + i; if (!blocked[k]) continue;
      let best = null, bestD = 1e9;
      for (let r = 1; r <= 12 && !best; r++) {
        for (let q = -r; q <= r; q++) for (const [ii, jj] of [[i + q, j - r], [i + q, j + r], [i - r, j + q], [i + r, j + q]]) {
          if (ii < 0 || jj < 0 || ii >= G.w || jj >= G.h || blocked[jj * G.w + ii]) continue;
          const d = (ii - i) * (ii - i) + (jj - j) * (jj - j);
          if (d < bestD) { bestD = d; best = [ii - i, jj - j]; }
        }
        if (bestD < 1e9) break;
      }
      if (best) { dx[k] = Math.max(-127, Math.min(127, best[0])); dy[k] = Math.max(-127, Math.min(127, best[1])); }
    }
    return (this._grid = { blocked, dx, dy });
  },
  /* Punkt auf die nächste freie Stelle setzen, falls er in einem Hindernis liegt */
  avoid(x, y) {
    const G = this.GRID, g = this._grid || this.buildGrid();
    const i = Math.floor((x - G.x0) / G.cell), j = Math.floor((y - G.y0) / G.cell);
    if (i < 0 || j < 0 || i >= G.w || j >= G.h) return [x, y];
    const k = j * G.w + i;
    if (!g.blocked[k]) return [x, y];
    return [G.x0 + (i + g.dx[k] + 0.5) * G.cell, G.y0 + (j + g.dy[k] + 0.5) * G.cell];
  },
  /* Höhe der Stegplanken: wer darauf geht, läuft nicht unter dem Steg */
  deckZ(x, y) {
    for (const p of HK.PIERS) if (x > p.x - 0.3 && x < p.x + 0.3 && y > p.y0 - 0.1 && y < p.y1 + 0.05) return 0.2;
    return 0;
  },
  walkerWorld(w) {
    const A = HK.ROAD_NODES[w.from], B = HK.ROAD_NODES[w.to];
    const dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy) || 1;
    const p = this.avoid(A[0] + dx * w.t - dy / len * w.off, A[1] + dy * w.t + dx / len * w.off);
    return { wx: p[0], wy: p[1], wz: this.deckZ(p[0], p[1]), len, dir: (dx - dy) >= 0 ? 1 : -1 };
  },
  walkerPos(w) { const q = this.walkerWorld(w); const s = I.p(q.wx, q.wy, q.wz); return { x: s[0], y: s[1], wx: q.wx, wy: q.wy, wz: q.wz, len: q.len, dir: q.dir }; },
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
    // Wallfahrt: Pilger mischen sich nach und nach unter die Passanten
    if (st && st.pilgrimage && Math.random() < dt * 0.5 && this.walkers.filter(w => w.type === 'pilgrim').length < 14) { const i = this.walkers.findIndex(w => w.type === 'citizen'); if (i >= 0) { const old = this.walkers[i], nw = this.makeWalker(false); Object.assign(nw, { from: old.from, to: old.to, t: old.t, type: 'pilgrim', color: HK.pick(['#6a6058', '#5a4a3a', '#7a6a5a', '#4a4a4a']), hat: false, basket: false }); this.walkers[i] = nw; } }
    // Prozession der Bruderschaft: am Festtag zieht ein Zug von der Kirche über den Markt und zurück
    if (st && st.processionDay === st.day) { if (!this.procession) this.procession = { t: 0, n: Math.min(24, 8 + Math.floor((st.brotherhood ? st.brotherhood.members : 0) / 8)), route: ['NN', 'S1', 'S3', 'MK', 'M3', 'M2', 'NN'] }; this.procession.t += dt * 0.09; }
    else this.procession = null;
    if (st) {
      st.ships.forEach((s, i) => {
        const b = HK.BERTHS[s.berth != null ? s.berth : i] || HK.BERTHS[i]; let a = this.shipAnim[s.id];
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
      for (const b of HK.BUILDINGS) { if (['eave', 'gable', 'hall', 'townhall', 'longhouse', 'hospital', 'school'].includes(b.kind) && !b.low) chimneys.push(I.p(b.x + b.w * 0.75, b.y + b.d * 0.4, b.h + b.d * 0.5)); if (b.panel === 'venture' && st.ventures && st.ventures[b.id] && (b.id === 'bakery' || b.id === 'smokery' || b.id === 'potter')) { const p = I.p(b.x + b.w * 0.6, b.y + b.d * 0.4, b.h + 1.2); chimneys.push(p, p, p); } if (b.kind === 'plot' && st.workshops[b.plot].type && !st.workshops[b.plot].idle) { const p = I.p(b.x + b.w * 0.7, b.y + b.d * 0.4, b.h + 0.5); chimneys.push(p, p); } }
      if (Math.random() < dt * 5) { const c = HK.pick(chimneys); this.smoke.push({ x: c[0], y: c[1], age: 0, vx: HK.rnd(-3, 3) + (this.weather === 'rain' ? -6 : 0) }); }
      this.smoke = this.smoke.filter(s => (s.age += dt) < 4.5);
      for (const s of this.smoke) { s.y -= 9 * dt; s.x += s.vx * dt; }
    }
  },
  snapShips() { this.shipAnim = {}; if (!HK.state) return; HK.state.ships.forEach((s, i) => { const b = HK.BERTHS[s.berth != null ? s.berth : i] || HK.BERTHS[i]; this.shipAnim[s.id] = { x: b.x, y: b.y, tx: b.x, ty: b.y, heading: HK.BERTH_HEADING, leaving: false, name: s.name, origin: s.origin }; }); },
  isWater(wx, wy) { return !I.inHull(HK.LAND, wx, wy); },
  inTown(wx, wy) { return I.inHull(HK.TOWN, wx, wy); },

  /* ---------- Trefferprüfung ---------- */
  hit(x, y, fresh) {
    const st = HK.state; if (!st) return null;
    if (!this.pickCanvas || this.time - this.pickTime > (fresh ? 0 : 0.7)) this.renderPick();
    // 3×3-Umfeld abtasten: nur reine Kennfarben zählen (Rot voll, Code durch 3 teilbar), Kantenmischungen fallen heraus
    const PS = this.PICK_SCALE;
    const px = HK.clamp(Math.round(x * PS), 1, Math.ceil(HK.MAP.W * PS) - 2), py = HK.clamp(Math.round(y * PS), 1, Math.ceil(HK.MAP.H * PS) - 2);
    const d = this.pickCtx.getImageData(px - 1, py - 1, 3, 3).data, votes = {}; let best = 0, bestN = 0;
    for (let i = 0; i < 9; i++) { const o = i * 4; if (d[o] < 250) continue; const code = d[o + 1] + (d[o + 2] << 8); if (code % 3) continue; const id = code / 3; if (!id || !this.pickTable || !this.pickTable[id]) continue; const n = (votes[id] || 0) + (i === 4 ? 3 : 1); votes[id] = n; if (n > bestN) { bestN = n; best = id; } }
    if (best) return this.pickTable[best];
    const wpt = this.toWorld(x, y); if (this.isWater(wpt.x, wpt.y) && wpt.x > -16 && wpt.y < 34 && wpt.x < 50) return { kind: 'building', building: HK.BUILDING.harbour, panel: 'harbour', label: HK.t('harbour') };
    return null;
  },
  shipHull(x, y, h, s) { const c = Math.cos(h), sn = Math.sin(h), pts = []; for (const [u, v] of [[-1.15, -0.4], [1.2, -0.4], [1.2, 0.4], [-1.15, 0.4]]) for (const z of [0, 2.7]) pts.push(I.p(x + (u * c - v * sn) * s, y + (u * sn + v * c) * s, z * s)); return I.hull(pts); },

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
    for (const b of HK.BUILDINGS) if (b.kind !== 'water' && b.kind !== 'market') items.push({ k: b.x + b.w + b.y + b.d, box: [b.x, b.y, b.x + b.w, b.y + b.d], f: c => this.drawBuilding(c, b, st, season, sv), pick: b.panel ? { kind: 'building', building: b, panel: b.panel, label: HK.buildingLabel ? HK.buildingLabel(st, b) : HK.name(b) } : null });
    const m = HK.BUILDING.market; items.push({ k: 0, f: c => { if (this.picking) I.poly(c, [[m.x, m.y, 0], [m.x + m.w, m.y, 0], [m.x + m.w, m.y + m.d, 0], [m.x, m.y + m.d, 0]], '#000'); }, pick: { kind: 'building', building: m, panel: 'market', label: HK.name(m) } });
    for (const seg of this.wallSegments()) items.push({ k: seg.k, box: seg.box, f: c => seg.f(c, sv) });
    for (const tr of HK.TREES) items.push({ k: tr[0] + tr[1] + tr[2], box: [tr[0] - 0.12, tr[1] - 0.12, tr[0] + 0.12, tr[1] + 0.12], f: c => this.drawTree(c, tr[0], tr[1], tr[2], season, sv) });
    for (const p of HK.PROPS) { if (p.t === 'stalls') continue; const b = this.propBox(p); items.push({ k: (b[0] + b[2]) / 2 + b[3] + 0.1, box: b, f: c => this.drawProp(c, p, st, sv) }); }
    this.marketStalls(HK.BUILDING.market).forEach((sd, i) => items.push({ k: sd.x + 0.55 + sd.y + 0.35, box: [sd.x, sd.y, sd.x + 1.0, sd.y + 0.7], f: c => this.drawStall(c, sd, i, st) }));
    for (const sk of this.marketSacks(HK.BUILDING.market)) items.push({ k: sk[0] + sk[1], box: [sk[0] - 0.1, sk[1] - 0.1, sk[0] + 0.1, sk[1] + 0.1], f: c => { const q = I.p(sk[0], sk[1], 0); c.fillStyle = '#b8a070'; c.beginPath(); c.ellipse(q[0], q[1] - 2, 4, 3, 0, 0, 6.28); c.fill(); } });
    items.push({ k: HK.MOLE.x + HK.MOLE.y1 + 1, box: [HK.MOLE.x, HK.MOLE.y0, HK.MOLE.x + HK.MOLE.w, HK.MOLE.y1], f: c => this.drawMole(c, sv) });
    items.push({ k: HK.ISLET.x + HK.ISLET.y, box: [HK.ISLET.x - 1.5, HK.ISLET.y - 1.5, HK.ISLET.x + 1.5, HK.ISLET.y + 1.5], f: c => this.drawIslet(c, season, sv) });
    items.push({ k: HK.GUARD_SHIP.x + HK.GUARD_SHIP.y + 0.6, box: [HK.GUARD_SHIP.x - 0.9, HK.GUARD_SHIP.y - 0.9, HK.GUARD_SHIP.x + 0.9, HK.GUARD_SHIP.y + 0.9], f: c => this.drawShip(c, HK.GUARD_SHIP.x, HK.GUARD_SHIP.y, HK.GUARD_SHIP.heading, 1.15, 'guard', true, false), pick: { kind: 'building', building: HK.BUILDING.arsenal, panel: 'arsenal', label: HK.t('watchShip') } });
    items.push({ k: HK.WINDMILL.x + HK.WINDMILL.y + 1, box: [HK.WINDMILL.x - 0.45, HK.WINDMILL.y - 0.45, HK.WINDMILL.x + 0.45, HK.WINDMILL.y + 0.45], f: c => this.drawWindmill(c, t, sv) });
    items.push({ k: HK.FARM.x + HK.FARM.w + HK.FARM.y + HK.FARM.d, box: [HK.FARM.x, HK.FARM.y, HK.FARM.x + HK.FARM.w, HK.FARM.y + HK.FARM.d], f: c => this.drawFarm(c, season, sv) });
    for (const f of HK.HAMLET) items.push({ k: f.x + f.w + f.y + f.d, box: [f.x, f.y, f.x + f.w, f.y + f.d], f: c => this.drawFarm(c, season, sv, f) });
    for (const p of HK.PIERS) for (let y = p.y0; y < p.y1; y += 0.6) { const seg = { x: p.x, y0: y, y1: Math.min(p.y1, y + 0.6), full: p, first: y === p.y0 }; items.push({ k: p.x + 0.25 + seg.y1, box: [p.x - 0.3, seg.y0, p.x + 0.3, seg.y1], f: c => this.drawPier(c, seg, t) }); }
    st.ownShips.forEach((sh, i) => { if (sh.status === 'port' && HK.OWN_BERTHS[i]) { const b = HK.OWN_BERTHS[i]; items.push({ k: b.x + b.y + 0.5, box: [b.x - 0.9, b.y - 0.9, b.x + 0.9, b.y + 0.9], f: c => this.drawShip(c, b.x, b.y, HK.BERTH_HEADING + 0.3, HK.SHIP_TYPE[sh.type] ? HK.SHIP_TYPE[sh.type].scale : 0.95, 'own', true, false), pick: { kind: 'building', building: HK.BUILDING.harbour, panel: 'harbour', label: sh.name } }); } });
    st.rivals.forEach((r, i) => { if (!r.ships) return; const sp = HK.RIVAL_ANCHORAGE[i]; items.push({ k: sp.x + sp.y + 0.5, box: [sp.x - 0.9, sp.y - 0.9, sp.x + 0.9, sp.y + 0.9], f: c => this.drawShip(c, sp.x, sp.y, sp.h, 0.9, 'rival_' + r.id, true, false), pick: { kind: 'building', building: HK.BUILDING.harbour, panel: 'rivals', label: HK.rivalName(r.id) } }); });
    for (const id in this.shipAnim) { const a = this.shipAnim[id]; const sh = st.ships.find(x => String(x.id) === id); items.push({ k: a.x + a.y + 0.6, box: [a.x - 1.0, a.y - 1.0, a.x + 1.0, a.y + 1.0], f: c => this.drawShip(c, a.x, a.y, a.heading, HK.SHIP_SCALE, a.origin, !a.leaving && Math.abs(a.x - a.tx) + Math.abs(a.y - a.ty) < 0.05, HK.UI.selectedVisitor === Number(id) && !a.leaving), pick: sh && !a.leaving ? { kind: 'visitor', id: sh.id, panel: 'harbour', label: sh.name + ' (' + HK.name(HK.ORIGIN[sh.origin]) + ')' } : null }); }
    const nBoats = Math.min(4, 2 + st.boats);
    for (let i = 0; i < nBoats; i++) { const b = HK.BOAT_SPOTS[i]; items.push({ k: b.x + b.y, box: [b.x - 0.4, b.y - 0.4, b.x + 0.4, b.y + 0.4], f: c => this.drawBoat(c, b.x, b.y, i >= 2, t + i), pick: { kind: 'building', building: HK.BUILDING.fishermen, panel: 'fishermen', label: HK.t('fishingBoat') } }); }
    st.caravans.forEach((cv, i) => { const sp = HK.CARAVAN_SPOTS[i]; items.push({ k: sp.x + sp.y + 0.6, box: [sp.x - 0.6, sp.y - 0.4, sp.x + 0.6, sp.y + 0.4], f: c => this.drawCaravan(c, sp.x, sp.y, t + i, sv), pick: { kind: 'visitor', id: cv.id, panel: 'gate', label: HK.t('caravanFrom', { origin: HK.name(HK.ORIGIN[cv.origin]) }) } }); });
    for (const c0 of this.carts) { const wx = c0.a[0] + (c0.b[0] - c0.a[0]) * c0.t, wy = c0.a[1] + (c0.b[1] - c0.a[1]) * c0.t; items.push({ k: this.pointKey(wx, wy), box: [wx - 0.3, wy - 0.3, wx + 0.3, wy + 0.3], f: c => this.drawCart(c, wx, wy, c0, t) }); }
    for (const ch of this.chickens) items.push({ k: this.pointKey(ch.x, ch.y), box: [ch.x - 0.05, ch.y - 0.05, ch.x + 0.05, ch.y + 0.05], f: c => { const s2 = I.p(ch.x, ch.y, 0); this.drawChicken(c, s2[0], s2[1], t); } });
    for (const n of HK.STATIC_NPCS) { const pp = HK.PERSON[n.person]; items.push({ k: this.pointKey(n.x, n.y), box: [n.x - 0.05, n.y - 0.05, n.x + 0.05, n.y + 0.05], f: c => { const s2 = I.p(n.x, n.y, 0); this.drawPerson(c, s2[0], s2[1], n.color, 'static', 1, this.hover && this.hover.person === n.person, null, 0, 1, n.person); }, pick: { kind: 'person', person: n.person, label: pp.name + ', ' + (pp.title[HK.LANG] || pp.title.de) } }); }
    // Fehde: der Ritter mit seinen Reitern lauert vor dem Landtor
    if (st && st.chains && st.chains.active.some(c => c.id === 'feud')) {
      const K = [[33.3, 9.5, -1, true], [34.0, 10.3, -1, false], [33.9, 8.7, -1, false], [34.8, 9.6, 1, false]];
      for (const [wx, wy, dir, mounted] of K) { const sp = I.p(wx, wy, 0), r = mounted ? 0.4 : 0.05; items.push({ k: this.pointKey(wx, wy), box: [wx - r, wy - r, wx + r, wy + r], f: c => mounted ? this.drawHorseman(c, sp[0], sp[1], dir, '#5a3a22') : this.drawPerson(c, sp[0], sp[1], '#7a3030', 'guard', 1, false, '#d9a98a', this.time * 2, dir, null, null, 0.85) }); }
      if (!this.picking) { const fp = I.p(34.4, 9.9, 0); items.push({ k: this.pointKey(34.4, 9.9), box: [34.2, 9.7, 34.6, 10.1], f: c => { c.fillStyle = 'rgba(255,140,40,' + (0.5 + Math.sin(this.time * 7) * 0.2) + ')'; c.beginPath(); c.ellipse(fp[0], fp[1] - 4, 4, 6, 0, 0, 6.28); c.fill(); c.fillStyle = '#4a3a2a'; c.beginPath(); c.ellipse(fp[0], fp[1], 6, 2.5, 0, 0, 6.28); c.fill(); } }); }
    }
    // Zunftaufstand: Handwerker mit Fackeln vor dem Rathaus
    if (st && st.unrestUntil > st.day) {
      for (let i = 0; i < 12; i++) { const wx = 12.35 + ((i * 37) % 13) / 10, wy = 8.55 + ((i * 53) % 11) / 10, sp = I.p(wx, wy, 0); items.push({ k: this.pointKey(wx, wy), box: [wx - 0.05, wy - 0.05, wx + 0.05, wy + 0.05], f: c => this.drawPerson(c, sp[0], sp[1], ['#7a5a3a', '#5a6a4a', '#8a6a3a', '#6a4a6a'][i % 4], 'torch', 1, false, '#d9a98a', this.time * 2 + i, i % 2 ? 1 : -1, null, null, 0.85) }); }
    }
    if (this.procession) {
      const P = this.procession, segs = P.route.length - 1;
      for (let i = 0; i < P.n; i++) {
        let u = P.t - i * 0.055; if (u < 0) continue; u = u % segs; const k = Math.floor(u), f = u - k;
        const A = HK.ROAD_NODES[P.route[k]], B = HK.ROAD_NODES[P.route[k + 1]]; const wx = A[0] + (B[0] - A[0]) * f + (i % 2 ? 0.16 : -0.16), wy = A[1] + (B[1] - A[1]) * f + (i % 2 ? -0.16 : 0.16);
        const sp = I.p(wx, wy, 0), dir = ((B[0] - A[0]) - (B[1] - A[1])) >= 0 ? 1 : -1, col = i === 0 ? '#e0b040' : i % 3 === 1 ? '#8a2a2a' : '#e8e0d0';
        items.push({ k: this.pointKey(wx, wy), box: [wx - 0.05, wy - 0.05, wx + 0.05, wy + 0.05], f: c => { this.drawPerson(c, sp[0], sp[1], col, 'monk', 1, false, '#e8c39e', this.time * 5 + i, dir, null, null, 0.85); if (!this.picking && i === 0) { c.strokeStyle = '#e0b040'; c.lineWidth = 2; c.beginPath(); c.moveTo(sp[0], sp[1] - 26); c.lineTo(sp[0], sp[1] - 44); c.moveTo(sp[0] - 4, sp[1] - 40); c.lineTo(sp[0] + 4, sp[1] - 40); c.stroke(); } } });
      }
    }
    for (const w of this.walkers) { const a = this.walkerAlpha(w); if (a <= 0.02) continue; const p = this.walkerPos(w); items.push({ k: this.pointKey(p.wx, p.wy), box: [p.wx - 0.05, p.wy - 0.05, p.wx + 0.05, p.wy + 0.05], f: c => this.drawPerson(c, p.x, p.y, w.color, w.type, a, this.hover && this.hover.walker === w, w.skin, w.pause > 0 ? 0 : w.phase, p.dir, null, w), pick: a >= 0.4 ? { kind: 'walker', walker: w, label: HK.t('enc_' + w.type + '_label') } : null }); }
    return this.depthSort(items);
  },
  /* Gemessene Grundrisse der Requisiten als Abstand von ihrem Bezugspunkt: [x0, y0, x1, y1].
     Die meisten werden von der Ecke aus gezeichnet, nicht mittig, darum reicht keine bloße Größe. */
  PROP_BOX: { crates: [-0.17, -0.25, 0.6, 0.52], barrels: [-0.19, -0.23, 0.38, 0.35], crane: [-0.68, -0.56, 0.68, 0.56], well: [-0.32, -0.3, 0.3, 0.32], statue: [-0.26, -0.26, 0.26, 0.28], pillory: [-0.31, -0.27, 0.23, 0.27], nets: [-0.33, -0.02, 0.29, 0.6], laundry: [-0.04, -0.12, 1.18, 0.14], kiln: [-0.23, -0.4, 0.71, 0.54], frames: [-0.12, -0.06, 0.14, 1.0], dyecloths: [-0.14, -0.02, 0.16, 1.1], gallows: [-0.35, -0.33, 0.33, 0.35], tollbar: [-0.2, -0.14, 0.79, 0.2], logs: [-0.31, -0.5, 1.08, 0.88], shrine: [-0.24, -0.22, 0.22, 0.24], boatup: [-0.17, -0.16, 1.05, 0.36], fishracks: [-0.04, -0.12, 0.98, 0.14], cross: [-0.16, -0.14, 0.12, 0.14], ropes: [-0.04, -0.16, 1.9, 0.22], sails: [-0.04, -0.12, 0.98, 0.14] },
  propBox(p) { const b = this.PROP_BOX[p.t] || [-0.25, -0.25, 0.25, 0.25]; return [p.x + b[0], p.y + b[1], p.x + b[2], p.y + b[3]]; },
  /* Tiefensortierung als Malerreihenfolge: Grundrisse, die sich entlang einer Achse nicht überlappen, legen die Reihenfolge fest
     (der Betrachter steht bei +x,+y); nur bei überlappenden Grundrissen entscheidet der Schlüssel k. */
  depthSort(items) {
    const e = 0.02, flat = [], solid = [];
    for (const it of items) (it.box ? solid : flat).push(it);
    flat.sort((a, b) => a.k - b.k); solid.sort((a, b) => a.k - b.k);
    const m = solid.length, behind = new Array(m);
    for (let i = 0; i < m; i++) behind[i] = [];
    for (let i = 0; i < m; i++) {
      const A = solid[i].box;
      for (let j = i + 1; j < m; j++) {
        const B = solid[j].box;
        const sx = A[2] <= B[0] + e ? -1 : B[2] <= A[0] + e ? 1 : 0, sy = A[3] <= B[1] + e ? -1 : B[3] <= A[1] + e ? 1 : 0;
        if (sx && sy && sx !== sy) continue;
        const sgn = sx || sy; if (!sgn) continue;
        if (sgn < 0) behind[j].push(i); else behind[i].push(j);
      }
    }
    const out = [], state = new Uint8Array(m);
    const visit = i => { if (state[i]) return; state[i] = 1; const bl = behind[i]; for (let q = 0; q < bl.length; q++) if (!state[bl[q]]) visit(bl[q]); state[i] = 2; out.push(solid[i]); };
    for (let i = 0; i < m; i++) visit(i);
    return flat.concat(out);
  },
  /* Sichtbarer Kartenausschnitt in Kartenpixeln, großzügig nach oben erweitert für hohe Bauten */
  visibleMapRect() {
    const c = this.cam, W = HK.SCENE.W / c.z, H = HK.SCENE.H / c.z;
    return { x0: Math.max(0, c.x - 40), y0: Math.max(0, c.y - 260), x1: Math.min(HK.MAP.W, c.x + W + 40), y1: Math.min(HK.MAP.H, c.y + H + 60) };
  },

  /* Pick-Kanal: jedes anklickbare Objekt in eigener Kennfarbe */
  renderPick() {
    const st = HK.state; if (!st) return;
    const PS = this.PICK_SCALE;
    if (!this.pickCanvas) { this.pickCanvas = document.createElement('canvas'); this.pickCanvas.width = Math.ceil(HK.MAP.W * PS); this.pickCanvas.height = Math.ceil(HK.MAP.H * PS); this.pickCtx = this.pickCanvas.getContext('2d', { willReadFrequently: true }); }
    const real = this.pickCtx; this.pickColor = '#000';
    const noop = () => {};
    // Gebundene Methoden einmal zwischenspeichern: ohne den Zwischenspeicher entsteht bei jedem
    // Zugriff eine neue Funktion, was den Pick-Durchgang teuer macht und den Bildlauf stocken lässt
    if (!this.pickBound) this.pickBound = new Map();
    const bound = this.pickBound;
    const proxy = this.pickProxy || (this.pickProxy = new Proxy(real, {
      get: (t, k) => {
        if (k === 'stroke' || k === 'strokeRect' || k === 'strokeText' || k === 'fillText') return noop;
        let v = bound.get(k); if (v !== undefined) return v;
        v = t[k]; if (typeof v === 'function') { v = v.bind(t); bound.set(k, v); }
        return v;
      },
      set: (t, k, v) => { if (k === 'fillStyle' || k === 'strokeStyle') t[k] = this.pickColor; else if (k === 'globalAlpha') t[k] = 1; else t[k] = v; return true; },
    }));
    real.setTransform(PS, 0, 0, PS, 0, 0); real.fillStyle = '#000'; real.fillRect(0, 0, HK.MAP.W, HK.MAP.H);
    // Beschnitt auf den sichtbaren Ausschnitt: beim Hineinzoomen spart das den größten Teil der Arbeit
    const v = this.visibleMapRect();
    real.save(); real.beginPath(); real.rect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0); real.clip();
    const savedW = this.windows, savedL = this.lamps; this.windows = []; this.lamps = []; this.picking = true;
    const items = this.buildItems(proxy, st, this.season(), this.time);
    this.pickTable = [null];
    for (const it of items) { if (!it.pick) continue; const id = this.pickTable.length; this.pickTable.push(it.pick); const code = id * 3; const col = `rgb(255,${code & 255},${(code >> 8) & 255})`; this.pickColor = col; real.fillStyle = col; real.strokeStyle = col; it.f(proxy); }
    real.restore();
    this.picking = false; this.windows = savedW; this.lamps = savedL; this.pickTime = this.time;
  },

  /* Zeichenkontext, der jeden Füllbefehl zusätzlich als schwarze Silhouette in die Emissionsebene schreibt */
  teeCtx() {
    if (this.tee) { this.em.setTransform(1, 0, 0, 1, 0, 0); this.em.clearRect(0, 0, HK.SCENE.W, HK.SCENE.H); this.viewTransform(this.em, 1); return this.tee; }
    const c = document.createElement('canvas'); c.width = HK.SCENE.W; c.height = HK.SCENE.H; this.emCanvas = c; const em = this.em = c.getContext('2d');
    const real = this.ctx, tee = {}, skip = new Set(['stroke', 'strokeRect', 'strokeText', 'fillText', 'measureText', 'getImageData', 'putImageData', 'createImageData', 'createLinearGradient', 'createRadialGradient', 'createConicGradient', 'createPattern', 'getTransform', 'isPointInPath', 'isPointInStroke', 'getLineDash', 'getContextAttributes', 'drawFocusIfNeeded']);
    const proto = Object.getPrototypeOf(real); let o = proto; const keys = new Set(); while (o && o !== Object.prototype) { Object.getOwnPropertyNames(o).forEach(k => keys.add(k)); o = Object.getPrototypeOf(o); }
    for (const k of keys) {
      if (k === 'constructor') continue;
      const d = Object.getOwnPropertyDescriptor(proto, k) || {};
      if (typeof real[k] === 'function') { tee[k] = skip.has(k) ? (...a) => real[k](...a) : (...a) => { const r = real[k](...a); em[k](...a); return r; }; }
      else Object.defineProperty(tee, k, { get: () => real[k], set: v => { real[k] = v; em[k] = k === 'fillStyle' || k === 'strokeStyle' ? '#000' : k === 'globalAlpha' ? 1 : k === 'globalCompositeOperation' ? 'source-over' : v; } });
    }
    this.tee = tee; em.setTransform(1, 0, 0, 1, 0, 0); em.clearRect(0, 0, HK.SCENE.W, HK.SCENE.H); this.viewTransform(em, 1); return tee;
  },
  /* Leuchtendes Fenster in die Emissionsebene schreiben (Weltkoordinaten) */
  emit(pts, col) { if (!this.em || !this.nightK || this.picking || this.emitOff) return; const em = this.em; em.save(); em.fillStyle = col; em.beginPath(); pts.forEach((q, i) => { const p = I.p(q[0], q[1], q[2]); i ? em.lineTo(p[0], p[1]) : em.moveTo(p[0], p[1]); }); em.closePath(); em.fill(); em.restore(); },

  /* ---------- Zeichnen ---------- */
  draw() {
    const ctx = this.ctx, st = HK.state; if (!st) return;
    this.viewTransform(ctx, this.RS);
    const P = this.palette(), t = this.time, W = HK.SCENE.W, H = HK.SCENE.H, season = this.season();
    if (season !== this.lastSeason) { this.lastSeason = season; this.makeGround(season); }
    this.windows = []; this.lamps = [];
    this.nightK = P.amb < 0.7 ? HK.clamp((0.7 - P.amb) / 0.4, 0, 1) : 0;
    this.drawWater(ctx, P, t);
    ctx.drawImage(this.ground, 0, 0, HK.MAP.W, HK.MAP.H);
    this.drawCoast(ctx, P, t);
    // Nachts läuft alles zusätzlich als schwarze Silhouette in die Emissionsebene, Fenster leuchten dort farbig; so verdecken vordere Gebäude die Lichter dahinter
    const dctx = this.nightK > 0 ? this.teeCtx() : ctx;
    for (const it of this.buildItems(dctx, st, season, t)) it.f(dctx);
    // Rauch, Möwen
    for (const s of this.smoke) { ctx.fillStyle = `rgba(215,215,220,${0.32 * (1 - s.age / 4.5)})`; ctx.beginPath(); ctx.arc(s.x, s.y, 1.5 + s.age * 2, 0, 6.28); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.1;
    for (const g of this.gulls) { const x = g.x + Math.cos(g.a) * g.r, y = g.y + Math.sin(g.a) * g.r * 0.5, f = Math.sin(t * 8 + g.a) * 2; ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.quadraticCurveTo(x - 2, y - 1.5 - f, x, y); ctx.quadraticCurveTo(x + 2, y - 1.5 - f, x + 4, y); ctx.stroke(); }
    const hb = this.hover && this.hover.building, sb = this.selected && HK.BUILDING[this.selected];
    if (sb && sb.kind !== 'water') this.outline(ctx, sb, 'rgba(255,215,102,0.95)', 2 / this.cam.z);
    if (hb && hb !== sb && hb.kind !== 'water') this.outline(ctx, hb, 'rgba(255,255,255,0.85)', 1.2 / this.cam.z);
    // Wetter, Licht, Vignette und Korn liegen auf dem Bildausschnitt, nicht auf der Karte
    ctx.setTransform(this.RS, 0, 0, this.RS, 0, 0);
    this.drawWeather(ctx, t);
    this.drawLighting(ctx, P, t);
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(20,10,0,0.4)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = 0.04; ctx.globalCompositeOperation = 'overlay'; for (let y = 0; y < H; y += 160) for (let x = 0; x < W; x += 240) ctx.drawImage(this.grain, x + ((t * 30) | 0) % 7, y); ctx.restore();
  },
  outline(ctx, b, color, w) { const hh = b.kind === 'church' ? 6.2 : b.h + Math.min(b.w, b.d) * 0.7 + 0.2; const hull = I.boxHull(b.x - 0.1, b.y - 0.1, b.w + 0.2, b.d + 0.2, hh); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.setLineDash([5, 4]); ctx.beginPath(); hull.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]); },

  /* Wasser über die ganze Fläche, Wellen und Glitzern */
  drawWater(ctx, P, t) {
    const W = HK.MAP.W, H = HK.MAP.H;
    const g = ctx.createLinearGradient(0, 0, W * 0.3, H); g.addColorStop(0, this.rgb(P.far)); g.addColorStop(1, this.rgb(P.near)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // Farbflecken (Tiefe, Strömung)
    for (let i = 0; i < 40; i++) { const x = (i * 173) % W, y = (i * 97 + 40) % H, r = 60 + (i % 5) * 30; const gr = ctx.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, i % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,10,30,0.10)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
    // Flachwasser entlang der Küste: heller Saum außen an jeder Landkante
    for (const e of this.coastEdges()) { const [P0, P1, n] = e; I.poly(ctx, [[P0[0], P0[1], 0], [P1[0], P1[1], 0], [P1[0] + n[0] * 1.3, P1[1] + n[1] * 1.3, 0], [P0[0] + n[0] * 1.3, P0[1] + n[1] * 1.3, 0]], 'rgba(120,190,190,0.16)'); }
    ctx.strokeStyle = `rgba(255,255,255,${0.08 + 0.14 * P.amb})`; ctx.lineWidth = 1;
    for (let i = 0; i < 420; i++) { const x = ((i * 137 + t * 9) % (W + 60)) - 30, y = ((i * 89 + (i % 3) * 7) % (H + 20)) - 10 + Math.sin(t * 1.4 + i) * 1.5; const len = 6 + (i % 5) * 2.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + len / 2, y - 1.5, x + len, y); ctx.stroke(); }
    const st = this.sunT();
    if (st !== null && this.weather !== 'rain') { const lx = W * (0.05 + 0.24 * st), ly = H * 0.45 + 140 * Math.sin(st * Math.PI); for (let i = 0; i < 70; i++) { const x = lx + Math.cos(i * 2.4) * 90 * Math.sqrt((i % 10) / 10), y = ly + Math.sin(i * 2.4) * 50 * Math.sqrt((i % 10) / 10); const a = 0.35 * (0.5 + 0.5 * Math.sin(t * 5 + i)); ctx.fillStyle = `rgba(255,245,210,${a})`; ctx.fillRect(x, y, 4, 1.2); } }
    const c = this.clock, fog = c > 0.22 && c < 0.42 ? 1 - Math.abs(c - 0.3) / 0.12 : 0;
    if (fog > 0) { for (let i = 0; i < 14; i++) { const x = 40 + i * 75 + Math.sin(t * 0.3 + i) * 20, y = 160 + (i % 3) * 200 + i * 30; const gr = ctx.createRadialGradient(x, y, 5, x, y, 110); gr.addColorStop(0, `rgba(235,235,240,${0.35 * fog})`); gr.addColorStop(1, 'rgba(235,235,240,0)'); ctx.fillStyle = gr; ctx.fillRect(x - 110, y - 110, 220, 220); } }
  },
  /* Landkanten mit Normale zur Wasserseite: [P0, P1, n, quay] */
  coastEdges() {
    if (this._edges) return this._edges;
    const L = HK.LAND; let area = 0; for (let i = 0; i < L.length; i++) { const a = L[i], b = L[(i + 1) % L.length]; area += a[0] * b[1] - b[0] * a[1]; }
    const sgn = area > 0 ? 1 : -1; const out = [];
    for (let i = 0; i < L.length; i++) { const a = L[i], b = L[(i + 1) % L.length]; if (Math.abs(a[0] - b[0]) > 20 || Math.abs(a[1] - b[1]) > 20) continue; const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1; const n = [sgn * dy / len, -sgn * dx / len]; out.push([a, b, n, a[2] === 'quay', len]); }
    // Normale muss ins Wasser zeigen: Probe am Kantenmittelpunkt
    for (const e of out) { const mx = (e[0][0] + e[1][0]) / 2 + e[2][0] * 0.3, my = (e[0][1] + e[1][1]) / 2 + e[2][1] * 0.3; if (I.inHull(HK.LAND, mx, my)) { e[2][0] *= -1; e[2][1] *= -1; } }
    return this._edges = out;
  },
  /* Küste: gemauerte Kaikanten mit sichtbarer Stirnseite, natürliche Ufer mit Sand, Uferböschung und Gischt */
  drawCoast(ctx, P, t) {
    for (const [A, B, n, quay, len] of this.coastEdges()) {
      const vis = n[0] + n[1] > 0.05; // Stirnseite zeigt zum Betrachter (+x/+y)
      if (quay) {
        // Schatten der Kaimauer im Wasser, Mauerstirn wenn sichtbar
        I.poly(ctx, [[A[0], A[1], 0], [B[0], B[1], 0], [B[0] + n[0] * 0.45, B[1] + n[1] * 0.45, 0], [A[0] + n[0] * 0.45, A[1] + n[1] * 0.45, 0]], 'rgba(10,20,40,0.28)');
        if (vis) { I.poly(ctx, [[A[0], A[1], 0], [B[0], B[1], 0], [B[0], B[1], 0.4], [A[0], A[1], 0.4]], '#6f685c', 'rgba(20,15,10,0.5)'); for (let k = 0; k < len; k += 0.5) { const f = k / len; I.line(ctx, [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, 0], [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, 0.4], 'rgba(0,0,0,0.2)', 0.6); } I.line(ctx, [A[0], A[1], 0.2], [B[0], B[1], 0.2], 'rgba(0,0,0,0.2)', 0.6); I.poly(ctx, [[A[0], A[1], 0], [B[0], B[1], 0], [B[0] + n[0] * 0.2, B[1] + n[1] * 0.2, 0], [A[0] + n[0] * 0.2, A[1] + n[1] * 0.2, 0]], 'rgba(40,70,60,0.4)'); }
      } else {
        // nasser Saum und Böschung
        I.poly(ctx, [[A[0], A[1], 0], [B[0], B[1], 0], [B[0] + n[0] * 0.25, B[1] + n[1] * 0.25, 0], [A[0] + n[0] * 0.25, A[1] + n[1] * 0.25, 0]], 'rgba(150,140,100,0.55)');
        if (vis) I.poly(ctx, [[A[0], A[1], 0], [B[0], B[1], 0], [B[0], B[1], 0.22], [A[0], A[1], 0.22]], '#8a7a58', 'rgba(20,15,10,0.35)');
        for (let k = 0.3; k < len; k += 0.9) { const f = k / len; const q = I.p(A[0] + (B[0] - A[0]) * f + n[0] * 0.1, A[1] + (B[1] - A[1]) * f + n[1] * 0.1, 0); ctx.fillStyle = '#7d766a'; ctx.beginPath(); ctx.ellipse(q[0], q[1], 3.5, 2, 0, 0, 6.28); ctx.fill(); }
      }
      // Gischt
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let k = 0; k < len; k += 0.25) { const f = k / len; if (((k * 13) | 0) % 3) continue; const q = I.p(A[0] + (B[0] - A[0]) * f + n[0] * 0.3, A[1] + (B[1] - A[1]) * f + n[1] * 0.3, 0); ctx.fillRect(q[0] - 2 + Math.sin(t * 3 + k * 5), q[1], 3, 1); }
    }
  },
  makeGround(season) {
    const c = document.createElement('canvas'); c.width = HK.MAP.W * this.RS; c.height = HK.MAP.H * this.RS; const g = c.getContext('2d'); g.scale(this.RS, this.RS);
    const poly = (pts, fill, stroke) => { g.beginPath(); pts.forEach((q, i) => { const s = I.p(q[0], q[1], 0); i ? g.lineTo(s[0], s[1]) : g.moveTo(s[0], s[1]); }); g.closePath(); g.fillStyle = fill; g.fill(); if (stroke) { g.strokeStyle = stroke; g.lineWidth = 0.8; g.stroke(); } };
    const winter = season === 'winter';
    // Land
    poly(HK.LAND, winter ? this.pat.snow : this.pat.grass);
    if (!winter) { for (let i = 0; i < 160; i++) { const x = 7 + Math.random() * 45, y = -30 + Math.random() * 50; if (this.isWater(x, y)) continue; const s = I.p(x, y, 0); g.fillStyle = i % 3 ? 'rgba(52,66,38,0.18)' : 'rgba(184,196,140,0.16)'; g.beginPath(); g.ellipse(s[0], s[1], 8 + Math.random() * 22, 4 + Math.random() * 9, 0, 0, 6.28); g.fill(); } }
    // Sand (Fischerdorf, Strand)
    for (const sa of HK.SAND) poly(sa, winter ? this.pat.snow : '#b9ad8b');
    // Stadtboden innerhalb der Mauer
    poly(HK.TOWN, winter ? this.pat.snow : this.pat.earth);
    // Kaistreifen entlang der gemauerten Kanten
    for (const [A, B, n, quay] of this.coastEdges()) if (quay) poly([[A[0], A[1]], [B[0], B[1]], [B[0] - n[0] * 0.5, B[1] - n[1] * 0.5], [A[0] - n[0] * 0.5, A[1] - n[1] * 0.5]], this.pat.stone, 'rgba(0,0,0,0.3)');
    // Felder
    for (const [fx, fy, fw, fd] of HK.FIELDS) { poly([[fx, fy, 0], [fx + fw, fy, 0], [fx + fw, fy + fd, 0], [fx, fy + fd, 0]], winter ? '#d8dbe0' : this.pat.field, 'rgba(60,40,20,0.35)'); for (let k = 0.35; k < fd; k += 0.35) { const a = I.p(fx, fy + k, 0), b = I.p(fx + fw, fy + k, 0); g.strokeStyle = 'rgba(70,50,20,0.3)'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); } }
    // Straßen in beliebiger Richtung: Rechteck um die Strecke
    for (const [x1, y1, x2, y2, w] of HK.STREETS) { const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, nx = -dy / len * w / 2, ny = dx / len * w / 2; const pts = [[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]]; const outside = !this.inTown((x1 + x2) / 2, (y1 + y2) / 2); poly(pts, winter ? '#cfd3d8' : (outside ? '#a89474' : this.pat.cobble), 'rgba(60,45,25,0.35)'); }
    // Marktplatz
    const m = HK.BUILDING.market; poly([[m.x, m.y, 0], [m.x + m.w, m.y, 0], [m.x + m.w, m.y + m.d, 0], [m.x, m.y + m.d, 0]], winter ? '#d3d6da' : this.pat.cobble, 'rgba(60,45,25,0.4)');
    // Pfützen, Schmutz
    for (let i = 0; i < 120; i++) { const x = 8 + Math.random() * 23, y = -2 + Math.random() * 20; if (!this.inTown(x, y)) continue; const s = I.p(x, y, 0); g.fillStyle = 'rgba(70,55,30,0.12)'; g.beginPath(); g.ellipse(s[0], s[1], 5 + Math.random() * 10, 2 + Math.random() * 3, 0, 0, 6.28); g.fill(); }
    this.ground = c;
  },

  /* ---------- Wetter, Licht ---------- */
  drawWeather(ctx, t) {
    if (this.weather === 'rain') { ctx.strokeStyle = 'rgba(200,215,235,0.35)'; ctx.lineWidth = 1; for (let i = 0; i < 220; i++) { const x = ((i * 67 + t * 260) % (HK.SCENE.W + 40)) - 20, y = ((i * 131 + t * 420) % (HK.SCENE.H + 60)) - 30; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 12); ctx.stroke(); } }
    if (this.weather === 'snow') { ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 180; i++) { const x = ((i * 89 + t * 18 + Math.sin(t + i) * 20) % (HK.SCENE.W + 40)) - 20, y = ((i * 151 + t * 40) % (HK.SCENE.H + 40)) - 20; ctx.beginPath(); ctx.arc(x, y, 1.2 + (i % 3) * 0.5, 0, 6.28); ctx.fill(); } }
    if (this.weather === 'cloudy') { ctx.fillStyle = 'rgba(120,125,135,0.10)'; ctx.fillRect(0, 0, HK.SCENE.W, HK.SCENE.H); }
  },
  drawLighting(ctx, P, t) {
    const l = P.amb;
    const W = HK.SCENE.W, H = HK.SCENE.H;
    if (P.tint[3] > 0.005) { ctx.fillStyle = this.rgb(P.tint, P.tint[3]); ctx.fillRect(0, 0, W, H); }
    const st = this.sunT();
    if (st !== null && Math.sin(st * Math.PI) < 0.45) { const g = ctx.createLinearGradient(st < 0.5 ? 0 : W, 0, st < 0.5 ? W : 0, 0); g.addColorStop(0, `rgba(255,190,110,${0.14 * (1 - Math.sin(st * Math.PI) / 0.45)})`); g.addColorStop(1, 'rgba(255,190,110,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    if (l < 0.7) {
      const k = HK.clamp((0.7 - l) / 0.4, 0, 1);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      if (this.emCanvas && this.nightK) { ctx.save(); ctx.globalAlpha = 0.55 * k; ctx.filter = 'blur(6px)'; ctx.drawImage(this.emCanvas, 0, 0, W, H); ctx.filter = 'blur(1.5px)'; ctx.globalAlpha = 0.8 * k; ctx.drawImage(this.emCanvas, 0, 0, W, H); ctx.restore(); }
      const cz = this.cam.z;
      for (const [lx, ly] of this.lamps) { const x = (lx - this.cam.x) * cz, y = (ly - this.cam.y) * cz; const g = ctx.createRadialGradient(x, y, 1, x, y, 40 * cz); g.addColorStop(0, `rgba(255,190,90,${0.5 * k})`); g.addColorStop(0.3, `rgba(255,170,70,${0.18 * k})`); g.addColorStop(1, 'rgba(255,160,60,0)'); ctx.fillStyle = g; ctx.fillRect(x - 40 * cz, y - 40 * cz, 80 * cz, 80 * cz); ctx.fillStyle = `rgba(255,230,160,${0.9 * k})`; ctx.beginPath(); ctx.arc(x, y - 1, 1.8 * cz, 0, 6.28); ctx.fill(); }
      ctx.restore();
    }
  },
};
