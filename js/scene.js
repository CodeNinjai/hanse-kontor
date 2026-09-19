/* Stadtszene Sundhaven, isometrisch: Wasser, Boden, sortierte Objekte, Licht, Wetter */
'use strict';
const I = HK.Iso;

/* Zählt hoch, sobald sich am Spielstand etwas ändert, was man sehen kann. Abgelegte Geometrie
   trägt diesen Stand in ihrem Schlüssel und entsteht daher nach jeder Änderung neu. */
HK.geoStand = 0;
HK.Scene = {
  canvas: null, ctx: null, RS: 2, PICK_SCALE: 1, walkers: [], porters: [], carts: [], chickens: [], gulls: [], smoke: [], shipAnim: {}, hover: null, selected: null,
  clock: 0.35, time: 0, pat: {}, lamps: [], weather: 'clear', weatherDay: -1, lastSeason: null, ground: null, grain: null,

  init(canvas) {
    this.canvas = canvas;
    // Die sichtbare Leinwand gehört jetzt der Grafikkarte. Ein kleiner eigener Zeichenkontext bleibt,
    // weil Musterfüllungen über createPattern entstehen.
    this.ctx = document.createElement('canvas').getContext('2d');
    this.fit(true);
    if (window.ResizeObserver) new ResizeObserver(() => this.fit()).observe(canvas.parentElement);
    else window.addEventListener('resize', () => this.fit());
    this.makePatterns(); this.makeGrain();
    /* Der Renderer richtet sich selbst ein; bis er bereit ist, bleibt das Bild leer.
       Scheitert er, darf das nicht stumm geschehen — sonst sieht man nur eine schwarze Fläche
       und hält das Spiel für abgestürzt. */
    HK.PixiScene.init(canvas)
      .then(() => { this.fit(true); this.meldung(null); })
      .catch(e => {
        this.meldung('Das Bild kann nicht aufgebaut werden: ' + (e && e.message || e)
          + '  —  Meist hilft es, die Seite neu zu laden. Bleibt es dabei, ist die Hardwarebeschleunigung des Browsers abgeschaltet.');
      });
    // Sicherheitsnetz: Wenn nach acht Sekunden nichts steht, sagen wir Bescheid, statt schwarz zu bleiben
    setTimeout(() => { if (!HK.PixiScene.bereit) this.meldung('Der Zeichenaufbau dauert ungewöhnlich lange. Vielleicht hilft ein Neuladen der Seite.'); }, 8000);
    // Beim Verlassen der Seite den Zeichenkontext freigeben
    window.addEventListener('pagehide', e => { if (!e.persisted) HK.PixiScene.zerstoeren(); });
    for (let i = 0; i < 70; i++) this.walkers.push(this.makeWalker(true));
    for (let i = 0; i < 9; i++) this.gulls.push({ x: HK.rnd(40, 700), y: HK.rnd(80, 1000), a: HK.rnd(0, 6.28), r: HK.rnd(25, 60), s: HK.rnd(0.25, 0.6) });
    this.carts = [{ a: [9.5, 2.8], b: [9.5, 17.8], t: 0.2, dir: 1, v: 0.25, ox: true }, { a: [8.0, 10], b: [27.0, 10], t: 0.7, dir: -1, v: 0.2, ox: false }, { a: [24, 2.8], b: [24, 17.8], t: 0.5, dir: 1, v: 0.22, ox: true }];
    for (let i = 0; i < 8; i++) this.chickens.push({ cx: i < 3 ? 8.9 : i < 5 ? 17.0 : 26.6, cy: i < 3 ? -0.2 : i < 5 ? 9.7 : 9.2, x: 0, y: 0, t: Math.random() * 10, a: Math.random() * 6.28 });
    this.initInput(canvas);
  },
  /* Eine Zeile über dem Bild, wenn mit dem Zeichnen etwas nicht stimmt. null nimmt sie wieder weg. */
  meldung(text) {
    let el = document.getElementById('scene-meldung');
    if (!text) { if (el) el.remove(); return; }
    if (!el) {
      el = document.createElement('div');
      el.id = 'scene-meldung';
      el.style.cssText = 'position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);max-width:34em;'
        + 'background:rgba(28,20,12,0.92);color:#e8ddc6;border:1px solid #6b5a3c;border-radius:6px;'
        + 'padding:14px 18px;font:15px/1.5 "EB Garamond",Georgia,serif;text-align:center;z-index:40';
      (this.canvas && this.canvas.parentElement ? this.canvas.parentElement : document.body).appendChild(el);
    }
    el.textContent = text;
  },

  /* ---------- Kamera: Zoom und Verschieben ---------- */
  cam: { z: 1, x: 0, y: 0 },
  ZOOM_MIN: 1, ZOOM_MAX: 2.8,
  /* Das Bild füllt den verfügbaren Platz. Gezeichnet wird über die Grafikkarte, darum darf die volle
     Bildschirmauflösung genutzt werden; der Deckel greift erst bei sehr großen Fenstern. Zu Canvas-Zeiten
     lag er bei 3,4 Millionen Bildpunkten und zwang das Bild sogar unter die Auflösung des Bildschirms. */
  PIXEL_BUDGET: 12e6,
  fit(first) {
    const wrap = this.canvas.parentElement;
    const w = Math.max(360, Math.round(wrap.clientWidth)), h = Math.max(260, Math.round(wrap.clientHeight));
    if (!first && w === HK.SCENE.W && h === HK.SCENE.H) return;
    HK.SCENE.W = w; HK.SCENE.H = h;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.RS = Math.max(0.75, Math.min(dpr, Math.sqrt(this.PIXEL_BUDGET / (w * h))));
    if (HK.PixiScene && HK.PixiScene.bereit) HK.PixiScene.fit();
    this._waterOv = null;                    // hängt an der Zeichenauflösung
    // Solange der Spieler nicht selbst gezoomt oder geschoben hat, bleibt das Bild auf die Stadt eingepasst
    if (first || this.camAuto !== false) this.resetCam(); else this.setZoom(this.cam.z);
  },
  /* Kleinster Zoom: die ganze Karte passt ins Bild. Was darüber hinaus sichtbar wird, ist offene See. */
  zoomMin() { return Math.max(0.4, Math.min(HK.SCENE.W / HK.MAP.W, HK.SCENE.H / HK.MAP.H)); },
  clampCam() {
    const z = this.cam.z, vw = HK.SCENE.W / z, vh = HK.SCENE.H / z;
    this.cam.x = vw >= HK.MAP.W ? (HK.MAP.W - vw) / 2 : HK.clamp(this.cam.x, 0, HK.MAP.W - vw);
    this.cam.y = vh >= HK.MAP.H ? (HK.MAP.H - vh) / 2 : HK.clamp(this.cam.y, 0, HK.MAP.H - vh);
  },
  /* Zoom um einen Ankerpunkt (Bildschirm-Szenenkoordinaten), der dabei stehen bleibt */
  setZoom(z, ax, ay) {
    this.camAuto = false;
    const old = this.cam.z; z = HK.clamp(z, this.zoomMin(), this.ZOOM_MAX);
    if (ax === undefined) { ax = HK.SCENE.W / 2; ay = HK.SCENE.H / 2; }
    const wx = ax / old + this.cam.x, wy = ay / old + this.cam.y;
    this.cam.z = z; this.cam.x = wx - ax / z; this.cam.y = wy - ay / z; this.clampCam();
  },
  panBy(dx, dy) { this.camAuto = false; this.cam.x -= dx / this.cam.z; this.cam.y -= dy / this.cam.z; this.clampCam(); },
  /* Umriss der bebauten Fläche in Kartenpixeln: darauf passt der Anfangsblick, nicht auf die ganze Seekarte */
  mapFit() {
    if (this._fitBox) return this._fitBox;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const b of HK.BUILDINGS) {
      if (b.kind === 'water') continue;
      for (const c of [[b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + b.d], [b.x + b.w, b.y + b.d]]) {
        const p = I.p(c[0], c[1], 0);
        if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0];
        if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1];
      }
    }
    return (this._fitBox = { x0: x0 - 50, y0: y0 - 130, x1: x1 + 50, y1: y1 + 150 });
  },
  resetCam() {
    const f = this.mapFit(), fw = f.x1 - f.x0, fh = f.y1 - f.y0;
    const z = HK.clamp(Math.min(HK.SCENE.W / fw, HK.SCENE.H / fh), this.zoomMin(), this.ZOOM_MAX);
    this.cam.z = z; this.camAuto = true;
    this.cam.x = (f.x0 + f.x1) / 2 - HK.SCENE.W / (2 * z);
    this.cam.y = (f.y0 + f.y1) / 2 - HK.SCENE.H / (2 * z);
    this.clampCam();
  },
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
  /* Die Quell-Leinwand bleibt am Muster hängen: ein Zeichenkontext, der nicht auf Canvas zeichnet,
     kann daraus seine eigene Textur bauen (siehe gfx-pixi.js). */
  makePatterns() {
    const mk = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w * this.RS; c.height = h * this.RS; const g = c.getContext('2d'); g.scale(this.RS, this.RS); fn(g, w, h); const pat = this.ctx.createPattern(c, 'repeat'); if (pat.setTransform) pat.setTransform(new DOMMatrix().scale(1 / this.RS)); pat._quelle = c; pat._rs = this.RS; return pat; };
    this.pat.cobble = mk(20, 10, (g) => { g.fillStyle = '#9f9681'; g.fillRect(0, 0, 20, 10); for (const [x, y, w, h] of [[1, 1, 7, 3.5], [10, 0.5, 8, 4], [0, 5.5, 6, 4], [8, 5.5, 5, 4], [15, 5.5, 5, 4]]) { g.fillStyle = (x + y) % 3 ? '#a49b86' : '#97907c'; g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 6.28); g.fill(); g.fillStyle = 'rgba(255,250,235,0.07)'; g.beginPath(); g.ellipse(x + w / 2 - 1, y + h / 2 - 1, w / 3, h / 4, 0, 0, 6.28); g.fill(); } });
    this.pat.earth = mk(40, 40, (g, w, h) => { g.fillStyle = '#aa9f7b'; g.fillRect(0, 0, w, h); for (let i = 0; i < 160; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(90,70,40,0.18)' : 'rgba(255,245,220,0.14)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 1.5); } });
    this.pat.grass = mk(30, 30, (g, w, h) => { g.fillStyle = '#6e7d58'; g.fillRect(0, 0, w, h); for (let i = 0; i < 110; i++) { g.strokeStyle = Math.random() < 0.5 ? 'rgba(46,58,33,0.4)' : 'rgba(174,192,138,0.35)'; const x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 1, y - 3); g.stroke(); } for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(120,150,70,0.35)'; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 5, 2.5, 0, 0, 6.28); g.fill(); } });
    this.pat.snow = mk(30, 30, (g, w, h) => { g.fillStyle = '#e9edf0'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(180,195,215,0.35)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 1); } });
    this.pat.stone = mk(24, 12, (g) => { g.fillStyle = '#8b8476'; g.fillRect(0, 0, 24, 12); g.fillStyle = '#6f695e'; g.fillRect(0, 5, 24, 1); g.fillRect(0, 11, 24, 1); g.fillRect(11, 0, 1, 5); g.fillRect(4, 6, 1, 5); g.fillRect(18, 6, 1, 5); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, 0, 11, 2); g.fillRect(12, 0, 12, 2); });
    this.pat.planks = mk(8, 24, (g) => { g.fillStyle = '#9f8361'; g.fillRect(0, 0, 8, 24); g.fillStyle = '#78614a'; g.fillRect(7, 0, 1, 24); g.fillStyle = 'rgba(255,220,170,0.15)'; g.fillRect(1, 0, 1, 24); g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(0, 11, 8, 1); });
    this.pat.field = mk(24, 24, (g) => { g.fillStyle = '#ab9b68'; g.fillRect(0, 0, 24, 24); g.strokeStyle = 'rgba(90,70,30,0.35)'; for (let i = 0; i < 24; i += 4) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 12, 24); g.stroke(); } });
  },
  /* Filmkorn als helle und dunkle Punkte mit eigener Deckkraft. So hebt es sich im Mittel auf und kann
     schlicht aufgelegt werden; die Mischart 'overlay' rechnet jeden Bildpunkt einzeln durch und ist bei
     dieser Bildgröße der teuerste Durchgang von allen. */
  makeGrain() { const c = document.createElement('canvas'); c.width = 240; c.height = 160; const g = c.getContext('2d'); const img = g.createImageData(240, 160); for (let i = 0; i < img.data.length; i += 4) { const v = (Math.random() - 0.5) * 2; const w = v > 0 ? 255 : 0; img.data[i] = img.data[i + 1] = img.data[i + 2] = w; img.data[i + 3] = Math.abs(v) * 190; } g.putImageData(img, 0, 0); this.grain = c; },

  /* ---------- Zeit, Licht, Jahreszeit ---------- */
  KEYS: [
    { c: 0.00, top: [20, 25, 28], near: [24, 32, 35], far: [39, 50, 53], tint: [10, 30, 46, 0.58], amb: 0.28 },
    { c: 0.20, top: [22, 28, 32], near: [25, 33, 36], far: [43, 55, 59], tint: [10, 30, 46, 0.54], amb: 0.3 },
    { c: 0.26, top: [84, 91, 100], near: [77, 95, 98], far: [197, 150, 124], tint: [255, 160, 95, 0.16], amb: 0.7 },
    { c: 0.34, top: [65, 130, 151], near: [58, 92, 101], far: [77, 120, 128], tint: [255, 228, 186, 0.02], amb: 0.95 },
    { c: 0.50, top: [57, 112, 135], near: [51, 89, 101], far: [64, 101, 114], tint: [255, 238, 208, 0.015], amb: 1 },
    { c: 0.66, top: [68, 106, 124], near: [58, 88, 98], far: [102, 99, 92], tint: [255, 214, 164, 0.03], amb: 0.95 },
    { c: 0.76, top: [108, 119, 133], near: [72, 88, 94], far: [199, 142, 116], tint: [255, 150, 78, 0.2], amb: 0.75 },
    { c: 0.84, top: [56, 65, 75], near: [39, 51, 55], far: [95, 70, 86], tint: [46, 44, 74, 0.38], amb: 0.45 },
    { c: 0.90, top: [22, 28, 31], near: [25, 33, 36], far: [41, 53, 57], tint: [10, 30, 46, 0.56], amb: 0.3 },
    { c: 1.00, top: [20, 25, 28], near: [24, 32, 35], far: [39, 50, 53], tint: [10, 30, 46, 0.58], amb: 0.28 },
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
  SMOKY: new Set(['eave', 'gable', 'hall', 'townhall', 'longhouse', 'hospital', 'school']),
  rollWeather() { const s = this.season(), r = Math.random(); this.weather = s === 'winter' ? (r < 0.3 ? 'snow' : r < 0.5 ? 'rain' : r < 0.75 ? 'cloudy' : 'clear') : s === 'autumn' ? (r < 0.3 ? 'rain' : r < 0.6 ? 'cloudy' : 'clear') : (r < 0.12 ? 'rain' : r < 0.35 ? 'cloudy' : 'clear'); },

  /* ---------- Passanten ---------- */
  makeWalker(anywhere) {
    const types = []; HK.WALKER_TYPES.forEach(t => { for (let i = 0; i < t.weight; i++) types.push(t); });
    if (HK.state && HK.state.pilgrimage) for (let i = 0; i < 3; i++) types.push({ id: 'pilgrim', colors: ['#6f645c', '#6c5946', '#7b6a5a', '#595959'] });
    const t = HK.pick(types), keys = Object.keys(HK.ROAD_NODES);
    const from = HK.pick(keys), to = HK.pick(HK.ROAD_ADJ[from]);
    const off = this.pickOff(from, to);
    return { type: t.id, color: HK.pick(t.colors), from, to, t: anywhere ? Math.random() : 0, speed: HK.rnd(0.25, 0.5) * (t.id === 'child' ? 1.5 : t.id === 'beggar' ? 0.6 : 1), off, pause: 0, nightOwl: Math.random() < 0.2 || t.id === 'guard', skin: HK.pick(['#dcc3aa', '#d2aa91', '#c59570']), hat: Math.random() < 0.5, basket: Math.random() < 0.3, phase: Math.random() * 6.28 };
  },
  /* Hindernisraster: Requisiten und Gebäude werden einmal in ein Gitter gestempelt, und zu jeder
     besetzten Zelle wird die nächste freie Zelle gemerkt. Damit landet nie ein Passant in einer Kiste. */
  GRID: { x0: -10, y0: -18, cell: 0.2, w: 290, h: 230 },
  buildGrid() {
    const G = this.GRID, n = G.w * G.h, blocked = new Uint8Array(n);
    // Nur Zellen sperren, deren Mittelpunkt im Hindernis liegt; Aufrunden würde jedes Hindernis um eine Zelle aufblähen
    const stamp = (b) => {
      const i0 = Math.max(0, Math.ceil((b[0] - G.x0) / G.cell - 0.5)), i1 = Math.min(G.w - 1, Math.floor((b[2] - G.x0) / G.cell - 0.5));
      const j0 = Math.max(0, Math.ceil((b[1] - G.y0) / G.cell - 0.5)), j1 = Math.min(G.h - 1, Math.floor((b[3] - G.y0) / G.cell - 0.5));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) blocked[j * G.w + i] = 1;
    };
    for (const p of HK.PROPS) { if (p.t === 'stalls') continue; const b = this.propBox(p); stamp([b[0] - 0.12, b[1] - 0.12, b[2] + 0.12, b[3] + 0.12]); }
    for (const b of HK.BUILDINGS) if (b.kind !== 'water' && b.kind !== 'market' && b.kind !== 'gate') stamp([b.x - 0.03, b.y - 0.03, b.x + b.w + 0.03, b.y + b.d + 0.03]);
    for (const r of (HK.NOWALK || [])) stamp(r);
    // Kran und Stapelplätze auf den Stegen sind für Passanten tabu; die Fahrrinne daneben bleibt frei
    for (const d of this.docks()) {
      stamp([d.cx - 0.72, d.cy - 0.6, d.cx + 0.72, d.cy + 0.6]);
      for (const sl of d.slots) stamp([sl.x - 0.26, sl.y - 0.26, sl.x + 0.26, sl.y + 0.26]);
    }
    // Wasser sperren, Stegplanken bleiben begehbar
    for (let j = 0; j < G.h; j++) for (let i = 0; i < G.w; i++) { const k = j * G.w + i; if (blocked[k]) continue;
      const wx = G.x0 + (i + 0.5) * G.cell, wy = G.y0 + (j + 0.5) * G.cell;
      if (this.isWater(wx, wy) && !this.deckZ(wx, wy)) blocked[k] = 1; }
    return (this._grid = { blocked });
  },
  blockedAt(x, y) {
    const G = this.GRID, g = this._grid || this.buildGrid();
    const i = Math.floor((x - G.x0) / G.cell), j = Math.floor((y - G.y0) / G.cell);
    if (i < 0 || j < 0 || i >= G.w || j >= G.h) return false;
    return !!g.blocked[j * G.w + i];
  },
  /* Für jede Wegstrecke einmal prüfen, welche seitlichen Versätze durchgehend frei sind.
     Passanten wählen einen davon und behalten ihn: ihre Bahn bleibt eine Gerade, nichts springt. */
  OFFSETS: [0, 0.13, -0.13, 0.22, -0.22],
  edgeFree(a, b) {
    const cache = this._edgeFree || (this._edgeFree = {});
    const key = a < b ? a + '|' + b : b + '|' + a;
    let v = cache[key]; if (v) return v;
    const A = HK.ROAD_NODES[a], B = HK.ROAD_NODES[b];
    const dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy) || 1;
    const steps = Math.max(8, Math.ceil(len / 0.15));
    v = [];
    for (const off of this.OFFSETS) {
      let ok = true;
      for (let q = 0; q <= steps && ok; q++) { const t = q / steps; if (this.blockedAt(A[0] + dx * t - dy / len * off, A[1] + dy * t + dx / len * off)) ok = false; }
      if (ok) v.push(off);
    }
    return (cache[key] = v);
  },
  /* Ist eine Strecke auf ganzer Breite verbaut, nimmt der Passant den am wenigsten verstellten Streifen */
  pickOff(a, b) {
    const v = this.edgeFree(a, b); if (v.length) return HK.pick(v);
    const A = HK.ROAD_NODES[a], B = HK.ROAD_NODES[b];
    const dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy) || 1, steps = 24;
    let best = 0, bestN = 1e9;
    for (const off of this.OFFSETS) {
      let n = 0;
      for (let q = 0; q <= steps; q++) { const t = q / steps; if (this.blockedAt(A[0] + dx * t - dy / len * off, A[1] + dy * t + dx / len * off)) n++; }
      if (n < bestN) { bestN = n; best = off; }
    }
    return best;
  },
  /* Höhe der Stegplanken: wer darauf geht, läuft nicht unter dem Steg */
  deckZ(x, y) {
    for (const p of HK.PIERS) { const h = (p.w || 0.6) / 2; if (x > p.x - h && x < p.x + h && y > p.y0 - 0.1 && y < p.y1 + 0.05) return 0.2; }
    return 0;
  },

  /* ---------- Hafenumschlag: Kran auf dem Steg, Stapelplätze, Träger ---------- */
  CRANE_CYCLE: 13, DECK_Z: 0.2, STACK_MAX: 3,
  /* Ein Kran je Steg, auf der Seeseite; er bedient den Liegeplatz an seiner Außenseite */
  docks() {
    if (this._docks) return this._docks;
    return (this._docks = HK.PIERS.map((p, i) => {
      const cx = p.crane, cy = p.y0 + 1.05, R = 1.6;
      const slots = [0.24, 0.45, 0.66].map(th => ({ th, x: cx + Math.sin(th) * R, y: cy + Math.cos(th) * R, items: [] }));
      const b = HK.BERTHS[i * 2], sx = b.x, sy = cy + 0.9;
      return { pier: p, i, cx, cy, R, slots, berth: i * 2, shipTh: Math.atan2(sx - cx, sy - cy), u: 0, working: false, dropped: -1 };
    }));
  },
  dockFree(d) { return d.slots.some(s => s.items.length < this.STACK_MAX); },
  dockSlotFor(d) { return d.slots.find(s => s.items.length < this.STACK_MAX) || d.slots[0]; },
  dockItems(d) { let n = 0; for (const s of d.slots) n += s.items.length; return n; },
  /* Welche Ware der Kran gerade löscht: aus der Ladung des Schiffes am Liegeplatz */
  dockGood(d) {
    const st = HK.state; if (!st) return 'crate';
    const sh = st.ships.find(v => v.berth === d.berth);
    const keys = sh ? Object.keys(sh.cargo) : [];
    return keys.length ? HK.pick(keys) : 'salt';
  },
  goodKind: { grain: 'sack', salt: 'sack', wool: 'sack', spices: 'sack', beer: 'barrel', wine: 'barrel', fish: 'barrel', smokedfish: 'barrel', wax: 'barrel' },
  /* Kranlauf: heben, an Land schwenken, absetzen, leeren Haken zurück. Beim Absetzen wächst der Stapel. */
  updateDocks(dt) {
    for (const d of this.docks()) {
      const busy = this.craneBusy({ berth: d.berth }) && this.dockFree(d);
      d.working = busy || d.u > 0.001;
      if (!d.working) continue;
      const prev = d.u;
      if (!d.load) { const g = this.dockGood(d); d.load = { good: g, kind: this.goodKind[g] || 'crate' }; }
      d.u += dt / this.CRANE_CYCLE;
      if (d.u >= 1) { d.u = busy ? d.u - 1 : 0; d.dropped = -1; }
      if (prev < 0.67 && d.u >= 0.67 && d.dropped < 0) {
        const slot = this.dockSlotFor(d);
        if (slot.items.length < this.STACK_MAX && d.load) slot.items.push(d.load);
        d.load = null; d.dropped = 1;
      }
      if (d.u < 0.6) d.dropped = -1;
    }
  },
  /* Kürzester Weg im Wegenetz, einmal berechnet und gemerkt */
  route(a, b) {
    const cache = this._routes || (this._routes = {}), key = a + '>' + b;
    if (cache[key]) return cache[key];
    const prev = { [a]: null }, q = [a];
    while (q.length) {
      const n = q.shift(); if (n === b) break;
      for (const m of HK.ROAD_ADJ[n]) if (!(m in prev)) { prev[m] = n; q.push(m); }
    }
    if (!(b in prev)) return (cache[key] = [a]);
    const out = []; for (let n = b; n !== null; n = prev[n]) out.unshift(n);
    return (cache[key] = out);
  },
  PORTER_MAX: 3, PORTER_HOME: ['H6', 'O6'], PORTER_DOCK: ['PA', 'PB'],
  /* Träger holen die gestapelte Ware vom Steg ins Lager am Kai */
  spawnPorter(d, cart) {
    const home = this.PORTER_HOME[d.i], path = this.route(home, this.PORTER_DOCK[d.i]);
    if (path.length < 2) return;
    this.porters.push({
      type: 'porter', cart: !!cart, cap: cart ? 3 : 1, dock: d, state: 'go', path, pi: 1, from: path[0], to: path[1], t: 0,
      off: this.pickOff(path[0], path[1]), speed: cart ? HK.rnd(0.34, 0.42) : HK.rnd(0.42, 0.55), phase: Math.random() * 6.28,
      color: HK.pick(['#7a5e3e', '#80694b', '#705a3f', '#7a6445']), skin: HK.pick(['#dcc3aa', '#d2aa91', '#c59570']),
      items: [], wait: 0, slot: null, a: null, b: null, ft: 0, hat: Math.random() < 0.4,
    });
  },
  /* Ein Fahrzeug dreht sich in die Fahrtrichtung, statt auf die nächste Achse zu springen */
  turn(o, target, dt) {
    if (o.head == null) { o.head = target; return; }
    const d = Math.atan2(Math.sin(target - o.head), Math.cos(target - o.head));
    o.head += d * Math.min(1, dt * 5);
  },
  porterPos(w) {
    if (w.a) {
      const wx = w.a[0] + (w.b[0] - w.a[0]) * w.ft, wy = w.a[1] + (w.b[1] - w.a[1]) * w.ft;
      return { wx, wy, wz: this.deckZ(wx, wy), dir: ((w.b[0] - w.a[0]) - (w.b[1] - w.a[1])) >= 0 ? 1 : -1 };
    }
    return this.walkerWorld(w);
  },
  updatePorters(dt) {
    const docks = this.docks();
    for (const d of docks) {
      const n = this.dockItems(d);
      const want = Math.min(this.PORTER_MAX, Math.floor(n / 2));   // erst wenn sich etwas stapelt, kommt ein Träger
      const mine = this.porters.filter(w => w.dock === d);
      if (mine.filter(w => !w.cart).length < want && Math.random() < dt * 0.5) this.spawnPorter(d, false);
      // Türmt es sich, kommt ein Karren und nimmt gleich drei Stück mit
      if (n >= 4 && !mine.some(w => w.cart) && Math.random() < dt * 0.4) this.spawnPorter(d, true);
    }
    for (let k = this.porters.length - 1; k >= 0; k--) {
      const w = this.porters[k];
      if (w.wait > 0) { w.wait -= dt; if (w.wait <= 0) this.porterNext(w); continue; }
      if (w.a) {
        const len = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]) || 0.1;
        if (w.cart) this.turn(w, Math.atan2(w.b[1] - w.a[1], w.b[0] - w.a[0]), dt);
        w.ft += w.speed * dt / len; w.phase += dt * 9; if (w.ft >= 1) { w.ft = 1; this.porterNext(w); } continue;
      }
      const q = this.walkerWorld(w); w.t += w.speed * dt / q.len; w.phase += dt * 9;
      if (w.cart) { const A = HK.ROAD_NODES[w.from], B = HK.ROAD_NODES[w.to]; this.turn(w, Math.atan2(B[1] - A[1], B[0] - A[0]), dt); }
      if (w.t >= 1) {
        w.bx = q.wx; w.by = q.wy; w.t = 0; w.pi++;
        if (w.pi >= w.path.length) { this.porterNext(w); continue; }
        w.from = w.path[w.pi - 1]; w.to = w.path[w.pi]; w.off = this.pickOff(w.from, w.to);
      }
    }
  },
  /* Zustandswechsel: am Steg zum Stapel, aufnehmen, zurück zum Weg, ins Lager, dort ablegen */
  porterNext(w) {
    const d = w.dock, node = HK.ROAD_NODES[this.PORTER_DOCK[d.i]];
    if (w.state === 'go') {
      const slot = [...d.slots].reverse().find(s => s.items.length);
      if (!slot) { this.porters.splice(this.porters.indexOf(w), 1); return; }
      w.slot = slot; w.state = 'fetch'; w.a = [node[0], node[1]]; w.b = [slot.x + (w.cart ? 0.45 : 0.35), slot.y + 0.1]; w.ft = 0;
    } else if (w.state === 'fetch') {
      w.state = 'lift'; w.wait = 0.7;
    } else if (w.state === 'lift') {
      const slot = [...d.slots].reverse().find(s => s.items.length);
      if (slot && w.items.length < w.cap) {
        w.items.push(slot.items.pop());
        if (w.items.length < w.cap && d.slots.some(s => s.items.length)) { w.wait = 0.55; return; }
      }
      if (!w.items.length) { this.porters.splice(this.porters.indexOf(w), 1); return; }
      w.state = 'back'; w.a = [w.b[0], w.b[1]]; w.b = [node[0], node[1]]; w.ft = 0;
    } else if (w.state === 'back') {
      const path = this.route(this.PORTER_DOCK[d.i], this.PORTER_HOME[d.i]);
      w.a = null; w.b = null; w.state = 'carry'; w.path = path; w.pi = 1; w.t = 0;
      w.from = path[0]; w.to = path[1]; w.off = this.pickOff(w.from, w.to); w.bx = node[0]; w.by = node[1];
    } else if (w.state === 'carry') {
      w.items.length = 0; w.state = 'drop'; w.wait = 0.8;
    } else {
      if (this.dockItems(d)) {
        const path = this.route(this.PORTER_HOME[d.i], this.PORTER_DOCK[d.i]);
        w.state = 'go'; w.path = path; w.pi = 1; w.t = 0; w.from = path[0]; w.to = path[1]; w.off = this.pickOff(w.from, w.to); w.bx = undefined;
      } else this.porters.splice(this.porters.indexOf(w), 1);
    }
  },
  /* Wo hängt die Last gerade? Gibt Winkel, Höhe und ob eine Kiste am Haken ist.
     Der Lauf beginnt über dem Schiff mit dem leeren Seil: es fährt hinunter, unten wird angeschlagen,
     erst dann hebt der Kran. Vorher erschien die Last aus dem Nichts am tiefsten Punkt. */
  craneState(d) {
    const u = d.u, sl = this.dockSlotFor(d).th, sh = d.shipTh;
    if (!d.working) return { th: sl, lift: 1, load: false };   // im Leerlauf hängt der Haken über dem Steg, nicht über dem Wasser
    if (u < 0.13) return { th: sh, lift: 1 - u / 0.13, load: false };          // leeres Seil hinunter ins Schiff
    if (u < 0.20) return { th: sh, lift: 0, load: false };                      // der Haken wird angeschlagen
    if (u < 0.26) return { th: sh, lift: 0, load: true };                       // die Last hängt, noch unten
    if (u < 0.40) return { th: sh, lift: (u - 0.26) / 0.14, load: true };       // heben
    if (u < 0.55) return { th: sh + (sl - sh) * (u - 0.40) / 0.15, lift: 1, load: true };
    if (u < 0.67) return { th: sl, lift: 1 - (u - 0.55) / 0.12, load: true };   // über dem Stapel absetzen
    if (u < 0.74) return { th: sl, lift: 0, load: false };
    if (u < 0.86) return { th: sl, lift: (u - 0.74) / 0.12, load: false };
    return { th: sl + (sh - sl) * (u - 0.86) / 0.14, lift: 1, load: false };    // leer zurück über das Schiff
  },
  /* Streifenfahrt des Wachschiffs: eine geschlossene Runde, aus der Uhr gerechnet statt gespeichert.
     Der Bug zeigt in die Fahrtrichtung. Gefahren wird nach Weglänge, nicht nach Winkel — sonst
     kröche das Schiff an den beiden Kehren und schösse auf den langen Seiten dahin. */
  guardShip() {
    const G = HK.GUARD_PATROL;
    let tab = G._weg;
    if (!tab) {
      const N = 96; tab = G._weg = new Float64Array(N + 1);
      let x0 = G.cx + G.a, y0 = G.cy, L = 0;
      for (let k = 1; k <= N; k++) {
        const w = k / N * Math.PI * 2, x = G.cx + Math.cos(w) * G.a, y = G.cy + Math.sin(w) * G.b;
        L += Math.hypot(x - x0, y - y0); tab[k] = L; x0 = x; y0 = y;
      }
      G._laenge = L;
    }
    const N = tab.length - 1, s = (this.time / G.dauer % 1 + 1) % 1 * G._laenge;
    let k = 1; while (k < N && tab[k] < s) k++;
    const f = (s - tab[k - 1]) / ((tab[k] - tab[k - 1]) || 1);
    const t = (k - 1 + f) / N * Math.PI * 2, co = Math.cos(t), si = Math.sin(t);
    return { x: G.cx + co * G.a, y: G.cy + si * G.b, heading: Math.atan2(co * G.b, -si * G.a) };
  },
  walkerWorld(w) {
    const A = HK.ROAD_NODES[w.from], B = HK.ROAD_NODES[w.to];
    const dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy) || 1;
    let wx = A[0] + dx * w.t - dy / len * w.off, wy = A[1] + dy * w.t + dx / len * w.off;
    // Am Knoten vom zuletzt gelaufenen Punkt aus einblenden, damit der Seitenversatz nicht springt
    if (w.bx !== undefined && w.t < 0.18) { const k = w.t / 0.18; wx = w.bx + (wx - w.bx) * k; wy = w.by + (wy - w.by) * k; }
    return { wx, wy, wz: this.deckZ(wx, wy), len, dir: (dx - dy) >= 0 ? 1 : -1 };
  },
  walkerPos(w) { const q = this.walkerWorld(w); const s = I.p(q.wx, q.wy, q.wz); return { x: s[0], y: s[1], wx: q.wx, wy: q.wy, wz: q.wz, len: q.len, dir: q.dir }; },
  /* Wachen auf dem Wehrgang: gehen ihr Stück ab, halten an den Enden kurz inne, kehren um */
  updateWallGuards(dt) {
    if (!this.wallGuards) this.wallGuards = HK.WALL_PATROLS.map((p, i) => ({ p, u: p.u0 + (p.u1 - p.u0) * ((i * 0.37 + 0.2) % 1), dir: i % 2 ? 1 : -1, phase: 0, wait: 0 }));
    for (const g of this.wallGuards) {
      if (g.wait > 0) { g.wait -= dt; continue; }
      g.u += g.dir * 0.26 * dt; g.phase += dt * 5.5;
      if (g.u >= g.p.u1) { g.u = g.p.u1; g.dir = -1; g.wait = 1.5 + Math.random() * 2; }
      if (g.u <= g.p.u0) { g.u = g.p.u0; g.dir = 1; g.wait = 1.5 + Math.random() * 2; }
    }
  },
  wallGuardPos(g) {
    const W = HK.WALL, A = W.pts[g.p.seg], B = W.pts[g.p.seg + 1], dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy), d = [dx / len, dy / len], nIn = [-d[1], d[0]];
    const x = A[0] + d[0] * g.u + nIn[0] * 0.07, y = A[1] + d[1] * g.u + nIn[1] * 0.07;
    const f = ((d[0] - d[1]) * g.dir) >= 0 ? 1 : -1;
    return { x, y, facing: f };
  },
  walkerAlpha(w) {
    const l = this.light(), plague = HK.state && HK.state.town.events.some(e => e.type === 'plague');
    let a = w.nightOwl ? 1 : HK.clamp((l - 0.35) * 2.2, 0, 1);
    if (plague && !w.nightOwl && w.type !== 'monk') a *= 0.3;
    if (this.weather === 'rain' && !w.nightOwl) a *= 0.55;
    return a;
  },

  update(dt) {
    this.time += dt;
    this.updateWallGuards(dt);
    const st = HK.state;
    if (st && st.day !== this.weatherDay) { this.weatherDay = st.day; if (Math.random() < 0.45 || this.weatherDay === 0) this.rollWeather(); }
    for (const w of this.walkers) {
      if (w.pause > 0) { w.pause -= dt; continue; }
      const q = this.walkerWorld(w);
      w.t += w.speed * dt / q.len; w.phase += dt * 9;
      if (w.t >= 1) { const prev = w.from; w.bx = q.wx; w.by = q.wy; w.from = w.to; w.t = 0; const opts = HK.ROAD_ADJ[w.from].filter(n => n !== prev); w.to = HK.pick(opts.length ? opts : HK.ROAD_ADJ[w.from]); w.off = this.pickOff(w.from, w.to); if (Math.random() < 0.15) w.pause = HK.rnd(1, 4); }
    }
    for (const c of this.carts) {
      const len = Math.hypot(c.b[0] - c.a[0], c.b[1] - c.a[1]);
      c.t += c.dir * c.v * dt / len; if (c.t > 1) { c.t = 1; c.dir = -1; } if (c.t < 0) { c.t = 0; c.dir = 1; }
      this.turn(c, Math.atan2((c.b[1] - c.a[1]) * c.dir, (c.b[0] - c.a[0]) * c.dir), dt);
    }
    for (const ch of this.chickens) { ch.t += dt; if (ch.t > 2) { ch.t = 0; ch.a = Math.random() * 6.28; } ch.x = ch.cx + Math.cos(ch.a) * 0.3 * Math.sin(ch.t * 1.5); ch.y = ch.cy + Math.sin(ch.a) * 0.3 * Math.sin(ch.t * 1.5); }
    for (const g of this.gulls) g.a += g.s * dt;
    this.updateDocks(dt); this.updatePorters(dt);
    // Wallfahrt: Pilger mischen sich nach und nach unter die Passanten
    if (st && st.pilgrimage && Math.random() < dt * 0.5 && this.walkers.filter(w => w.type === 'pilgrim').length < 14) { const i = this.walkers.findIndex(w => w.type === 'citizen'); if (i >= 0) { const old = this.walkers[i], nw = this.makeWalker(false); Object.assign(nw, { from: old.from, to: old.to, t: old.t, type: 'pilgrim', color: HK.pick(['#6f645c', '#6c5946', '#7b6a5a', '#595959']), hat: false, basket: false }); this.walkers[i] = nw; } }
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
      // Die Liste der Schornsteine ändert sich höchstens, wenn gebaut wird — einmal je Sekunde genügt
      let chimneys = this._chim;
      if (!chimneys || this.time - this._chimT > 1) {
      chimneys = this._chim = []; this._chimT = this.time;
      for (const b of HK.BUILDINGS) { if (this.SMOKY.has(b.kind) && !b.low) chimneys.push(I.p(b.x + b.w * 0.75, b.y + b.d * 0.4, b.h + b.d * 0.5)); if (b.panel === 'venture' && st.ventures && st.ventures[b.id] && (b.id === 'bakery' || b.id === 'smokery' || b.id === 'potter')) { const p = I.p(b.x + b.w * 0.6, b.y + b.d * 0.4, b.h + 1.2); chimneys.push(p, p, p); } if (b.kind === 'plot' && st.workshops[b.plot].type && !st.workshops[b.plot].idle) { const p = I.p(b.x + b.w * 0.7, b.y + b.d * 0.4, b.h + 0.5); chimneys.push(p, p); } }
      }
      if (chimneys.length && Math.random() < dt * 5) { const c = HK.pick(chimneys); this.smoke.push({ x: c[0], y: c[1], age: 0, vx: HK.rnd(-3, 3) + (this.weather === 'rain' ? -6 : 0) }); }
      this.smoke = this.smoke.filter(s => (s.age += dt) < 4.5);
      for (const s of this.smoke) { s.y -= 9 * dt; s.x += s.vx * dt; }
    }
  },
  snapShips() { this.shipAnim = {}; this.porters.length = 0; if (this._docks) for (const d of this._docks) { d.u = 0; d.working = false; d.load = null; for (const s of d.slots) s.items.length = 0; }
    if (!HK.state) return; HK.state.ships.forEach((s, i) => { const b = HK.BERTHS[s.berth != null ? s.berth : i] || HK.BERTHS[i]; this.shipAnim[s.id] = { x: b.x, y: b.y, tx: b.x, ty: b.y, heading: HK.BERTH_HEADING, leaving: false, name: s.name, origin: s.origin }; }); },
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
  /* Gebäude und Requisiten stehen an ihrem Platz; ob sie sich trotzdem regen (schwingender Aufzugskorb,
     Dampf, Schmiedefeuer, schwankende Bäume, wehende Wimpel), stellt der Renderer selbst fest, indem er
     beim Ablegen der Geometrie beobachtet, wer die Uhr liest. Darum darf hier alles einen Schlüssel haben. */
  RUHT() { return true; },
  buildItems(ctx, st, season, t) {
    const items = [], sv = this.shadowVec();
    // Grobstufe von Sonnenstand und Zeit: sie gehen in den Aussehens-Schlüssel ein, wo ein bewegtes
    // Objekt Schatten oder Eigenbewegung mitzeichnet. Ohne sie bliebe eine gepufferte Geometrie stehen.
    const svk = Math.round(sv.v[0] * 12) + ',' + Math.round(sv.v[1] * 12) + ',' + Math.round(sv.a * 40);
    const tk = n => Math.round(t * 15) % n;   // 15 Stufen je Sekunde: fein genug fürs Auge, grob genug für den Puffer
    this.solids = HK.BUILDINGS.filter(b => b.kind !== 'water' && b.kind !== 'market' && b.h > 0);
    for (const b of HK.BUILDINGS) if (b.kind !== 'water' && b.kind !== 'market') items.push({ c: 'b' + b.id, k: b.x + b.w + b.y + b.d, box: [b.x, b.y, b.x + b.w, b.y + b.d], f: c => this.drawBuilding(c, b, st, season, sv), pick: b.panel ? { kind: 'building', building: b, panel: b.panel, label: HK.buildingLabel ? HK.buildingLabel(st, b) : HK.name(b) } : null });
    const m = HK.BUILDING.market; items.push({ k: 0, f: c => { if (this.picking) I.poly(c, [[m.x, m.y, 0], [m.x + m.w, m.y, 0], [m.x + m.w, m.y + m.d, 0], [m.x, m.y + m.d, 0]], '#000'); }, pick: { kind: 'building', building: m, panel: 'market', label: HK.name(m) } });
    this.wallSegments().forEach((seg, i) => items.push({ c: 'w' + i, k: seg.k, box: seg.box, f: c => seg.f(c, sv) }));
    // Wachen auf dem Wehrgang: gleiche Schlüsselung wie Passanten, gezeichnet über dem Mauerstück, auf dem sie stehen
    for (const g of (this.wallGuards || [])) {
      const q = this.wallGuardPos(g), sp = I.p(q.x, q.y, HK.WALL.h + 0.02), ph = g.wait > 0 ? 0 : g.phase, still = g.wait > 0;
      items.push({ s: 'wg|' + q.facing + '|' + (still ? 'r' : Math.round(ph * 2.5) % 16), ap: sp, k: q.x + q.y + 2.5, box: [q.x - 0.3, q.y - 0.3, q.x + 0.3, q.y + 0.3], f: c => this.drawPerson(c, sp[0], sp[1], '#435479', 'guard', 1, false, '#dcc3aa', ph, q.facing, null, null, 0.85) });
    }
    HK.TREES.forEach((tr, i) => items.push({ c: 't' + i, k: tr[0] + tr[1] + tr[2], box: [tr[0] - 0.12, tr[1] - 0.12, tr[0] + 0.12, tr[1] + 0.12], f: c => this.drawTree(c, tr[0], tr[1], tr[2], season, sv) }));
    HK.PROPS.forEach((p, i) => { if (p.t === 'stalls') return; const b = this.propBox(p); items.push({ c: 'p' + i, k: (b[0] + b[2]) / 2 + b[3] + 0.1, box: b, f: c => this.drawProp(c, p, st, sv) }); });
    this.marketStalls(HK.BUILDING.market).forEach((sd, i) => items.push({ c: 'ms' + i, k: sd.x + 0.55 + sd.y + 0.35, box: [sd.x, sd.y, sd.x + 1.0, sd.y + 0.7], f: c => this.drawStall(c, sd, i, st) }));
    this.marketSacks(HK.BUILDING.market).forEach((sk, i) => items.push({ c: 'mk' + i, k: sk[0] + sk[1], box: [sk[0] - 0.1, sk[1] - 0.1, sk[0] + 0.1, sk[1] + 0.1], f: c => { const q = I.p(sk[0], sk[1], 0); c.fillStyle = '#b8a070'; c.beginPath(); c.ellipse(q[0], q[1] - 2, 4, 3, 0, 0, 6.28); c.fill(); } }));
    items.push({ c: 'mole', k: HK.MOLE.x + HK.MOLE.y1 + 1, box: [HK.MOLE.x, HK.MOLE.y0, HK.MOLE.x + HK.MOLE.w, HK.MOLE.y1], f: c => this.drawMole(c, sv) });
    items.push({ c: 'islet', k: HK.ISLET.x + HK.ISLET.y, box: [HK.ISLET.x - 1.5, HK.ISLET.y - 1.5, HK.ISLET.x + 1.5, HK.ISLET.y + 1.5], f: c => this.drawIslet(c, season, sv) });
    { const w = this.guardShip();
      items.push({ k: w.x + w.y + 0.6, box: [w.x - 1.1, w.y - 1.1, w.x + 1.1, w.y + 1.1], f: c => this.drawShip(c, w.x, w.y, w.heading, 1.15, 'guard', false, false), pick: { kind: 'building', building: HK.BUILDING.arsenal, panel: 'arsenal', label: HK.t('watchShip') } }); }
    items.push({ k: HK.WINDMILL.x + HK.WINDMILL.y + 1, box: [HK.WINDMILL.x - 0.45, HK.WINDMILL.y - 0.45, HK.WINDMILL.x + 0.45, HK.WINDMILL.y + 0.45], f: c => this.drawWindmill(c, t, sv) });
    items.push({ c: 'farm', k: HK.FARM.x + HK.FARM.w + HK.FARM.y + HK.FARM.d, box: [HK.FARM.x, HK.FARM.y, HK.FARM.x + HK.FARM.w, HK.FARM.y + HK.FARM.d], f: c => this.drawFarm(c, season, sv) });
    HK.HAMLET.forEach((f, i) => items.push({ c: 'ham' + i, k: f.x + f.w + f.y + f.d, box: [f.x, f.y, f.x + f.w, f.y + f.d], f: c => this.drawFarm(c, season, sv, f) }));
    for (const d of this.docks()) {
      const h = (d.pier.w || 0.6) / 2;
      items.push({ k: d.cx + d.cy + 1.7, box: [d.cx - 0.68, d.cy - 0.56, d.cx + 0.68, d.cy + 0.56], f: c => this.drawTreadCrane(c, d) });
      for (const sl of d.slots) if (sl.items.length) items.push({ s: 'sp|' + sl.items.join('.') + '|' + svk, ap: I.p(sl.x, sl.y, 0), k: sl.x + sl.y + 0.2, box: [sl.x - 0.2, sl.y - 0.2, sl.x + 0.2, sl.y + 0.2], f: c => this.drawStack(c, sl, sv) });
      items.push({ s: 'sk|' + d.pier.x + '|' + tk(60), ap: I.p(d.pier.x, d.pier.y1, 0), k: d.pier.x + h + d.pier.y1, box: [d.pier.x - h, d.pier.y1 - 0.3, d.pier.x + h, d.pier.y1], f: c => this.drawPierEnd(c, d.pier, t) });
    }
    for (const w of this.porters) {
      const p = this.porterPos(w), a = this.walkerAlpha(w); if (a <= 0.02) continue;
      const r = w.cart ? 0.4 : 0.05;
      if (w.cart) { items.push({ k: this.pointKey(p.wx, p.wy), box: [p.wx - r, p.wy - r, p.wx + r, p.wy + r], f: c => { c.save(); c.globalAlpha = a; this.drawPortCart(c, p.wx, p.wy, p.wz, w, t); c.restore(); } }); }
      else { const sp = I.p(p.wx, p.wy, p.wz), ph = w.wait > 0 ? 0 : w.phase; items.push({ s: 'tr|' + w.color + '|' + w.skin + '|' + p.dir + '|' + (Math.round(ph * 2.5) % 16) + '|' + Math.round(a * 6) + '|' + (w.load ? 1 : 0), ap: sp, k: this.pointKey(p.wx, p.wy), box: [p.wx - r, p.wy - r, p.wx + r, p.wy + r], f: c => this.drawPerson(c, sp[0], sp[1], w.color, 'porter', a, false, w.skin, ph, p.dir, null, w) }); }
    }
    st.ownShips.forEach((sh, i) => { if (sh.status === 'port' && HK.OWN_BERTHS[i]) { const b = HK.OWN_BERTHS[i]; items.push({ s: 'sf|own|' + sh.type, ap: I.p(b.x, b.y, 0), k: b.x + b.y + 0.5, box: [b.x - 0.9, b.y - 0.9, b.x + 0.9, b.y + 0.9], f: c => this.drawShip(c, b.x, b.y, HK.BERTH_HEADING + 0.3, HK.SHIP_TYPE[sh.type] ? HK.SHIP_TYPE[sh.type].scale : 0.95, 'own', true, false), pick: { kind: 'building', building: HK.BUILDING.harbour, panel: 'harbour', label: sh.name } }); } });
    st.rivals.forEach((r, i) => { if (!r.ships) return; const sp = HK.RIVAL_ANCHORAGE[i]; items.push({ s: 'sf|rv|' + r.id, ap: I.p(sp.x, sp.y, 0), k: sp.x + sp.y + 0.5, box: [sp.x - 0.9, sp.y - 0.9, sp.x + 0.9, sp.y + 0.9], f: c => this.drawShip(c, sp.x, sp.y, sp.h, 0.9, 'rival_' + r.id, true, false), pick: { kind: 'building', building: HK.BUILDING.harbour, panel: 'rivals', label: HK.rivalName(r.id) } }); });
    for (const id in this.shipAnim) { const a = this.shipAnim[id]; const sh = st.ships.find(x => String(x.id) === id); const fest = !a.leaving && Math.abs(a.x - a.tx) + Math.abs(a.y - a.ty) < 0.05, gewaehlt = HK.UI.selectedVisitor === Number(id) && !a.leaving; items.push({ s: 'sf|' + a.origin + '|' + Math.round(a.heading * 20) + '|' + (fest ? 1 : 0) + '|' + (gewaehlt ? 1 : 0), ap: I.p(a.x, a.y, 0), k: a.x + a.y + 0.6, box: [a.x - 1.0, a.y - 1.0, a.x + 1.0, a.y + 1.0], f: c => this.drawShip(c, a.x, a.y, a.heading, HK.SHIP_SCALE, a.origin, !a.leaving && Math.abs(a.x - a.tx) + Math.abs(a.y - a.ty) < 0.05, HK.UI.selectedVisitor === Number(id) && !a.leaving), pick: sh && !a.leaving ? { kind: 'visitor', id: sh.id, panel: 'harbour', label: sh.name + ' (' + HK.name(HK.ORIGIN[sh.origin]) + ')' } : null }); }
    const nBoats = Math.min(4, 2 + st.boats);
    for (let i = 0; i < nBoats; i++) { const b = HK.BOAT_SPOTS[i]; items.push({ s: 'bt|' + (i >= 2 ? 1 : 0) + '|' + (Math.round((t + i) * 15) % 90), ap: I.p(b.x, b.y, 0), k: b.x + b.y, box: [b.x - 0.4, b.y - 0.4, b.x + 0.4, b.y + 0.4], f: c => this.drawBoat(c, b.x, b.y, i >= 2, t + i), pick: { kind: 'building', building: HK.BUILDING.fishermen, panel: 'fishermen', label: HK.t('fishingBoat') } }); }
    st.caravans.forEach((cv, i) => { const sp = HK.CARAVAN_SPOTS[i]; items.push({ s: 'cv|' + i + '|' + (Math.round((t + i) * 15) % 90) + '|' + svk, ap: I.p(sp.x, sp.y, 0), k: sp.x + sp.y + 0.5, box: [sp.x - 1.2, sp.y - 0.4, sp.x + 1.4, sp.y + 1.4], f: c => this.drawCaravan(c, sp.x, sp.y, t + i, sv), pick: { kind: 'visitor', id: cv.id, panel: 'gate', label: HK.t('caravanFrom', { origin: HK.name(HK.ORIGIN[cv.origin]) }) } }); });
    for (const c0 of this.carts) { const wx = c0.a[0] + (c0.b[0] - c0.a[0]) * c0.t, wy = c0.a[1] + (c0.b[1] - c0.a[1]) * c0.t; items.push({ k: this.pointKey(wx, wy), box: [wx - 0.5, wy - 0.5, wx + 0.5, wy + 0.5], f: c => this.drawCart(c, wx, wy, c0, t) }); }
    for (const ch of this.chickens) { const sp = I.p(ch.x, ch.y, 0); items.push({ s: 'ch|' + (Math.round(t * 15) % 40), ap: sp, k: this.pointKey(ch.x, ch.y), box: [ch.x - 0.05, ch.y - 0.05, ch.x + 0.05, ch.y + 0.05], f: c => this.drawChicken(c, sp[0], sp[1], t) }); }
    for (const n of HK.STATIC_NPCS) { const pp = HK.PERSON[n.person], sp = I.p(n.x, n.y, 0), hov = !!(this.hover && this.hover.person === n.person); items.push({ s: 'n|' + n.person + '|' + (hov ? 1 : 0), ap: sp, k: this.pointKey(n.x, n.y), box: [n.x - 0.05, n.y - 0.05, n.x + 0.05, n.y + 0.05], f: c => { this.drawPerson(c, sp[0], sp[1], n.color, 'static', 1, hov, null, 0, 1, n.person); }, pick: { kind: 'person', person: n.person, label: pp.name + ', ' + (pp.title[HK.LANG] || pp.title.de) } }); }
    // Fehde: der Ritter mit seinen Reitern lauert vor dem Landtor
    if (st && st.chains && st.chains.active.some(c => c.id === 'feud')) {
      const K = [[40.6, 14.0, -1, true], [41.3, 14.8, -1, false], [41.2, 13.2, -1, false], [42.1, 14.1, 1, false]];
      for (const [wx, wy, dir, mounted] of K) { const sp = I.p(wx, wy, 0), r = mounted ? 0.4 : 0.05; items.push({ k: this.pointKey(wx, wy), box: [wx - r, wy - r, wx + r, wy + r], f: c => mounted ? this.drawHorseman(c, sp[0], sp[1], dir, '#754d30') : this.drawPerson(c, sp[0], sp[1], '#873737', 'guard', 1, false, '#d2aa91', this.time * 2, dir, null, null, 0.85) }); }
      if (!this.picking) { const fp = I.p(41.6, 14.4, 0); items.push({ k: this.pointKey(41.6, 14.4), box: [41.4, 14.2, 41.8, 14.6], f: c => { c.fillStyle = 'rgba(255,140,40,' + (0.5 + Math.sin(this.time * 7) * 0.2) + ')'; c.beginPath(); c.ellipse(fp[0], fp[1] - 4, 4, 6, 0, 0, 6.28); c.fill(); c.fillStyle = '#66503a'; c.beginPath(); c.ellipse(fp[0], fp[1], 6, 2.5, 0, 0, 6.28); c.fill(); } }); }
    }
    // Zunftaufstand: Handwerker mit Fackeln vor dem Rathaus
    if (st && st.unrestUntil > st.day) {
      for (let i = 0; i < 12; i++) { const wx = 12.35 + ((i * 37) % 13) / 10, wy = 8.55 + ((i * 53) % 11) / 10, sp = I.p(wx, wy, 0); items.push({ k: this.pointKey(wx, wy), box: [wx - 0.05, wy - 0.05, wx + 0.05, wy + 0.05], f: c => this.drawPerson(c, sp[0], sp[1], ['#84623f', '#627350', '#906e3c', '#735073'][i % 4], 'torch', 1, false, '#d2aa91', this.time * 2 + i, i % 2 ? 1 : -1, null, null, 0.85) }); }
    }
    if (this.procession) {
      const P = this.procession, segs = P.route.length - 1;
      for (let i = 0; i < P.n; i++) {
        let u = P.t - i * 0.055; if (u < 0) continue; u = u % segs; const k = Math.floor(u), f = u - k;
        const A = HK.ROAD_NODES[P.route[k]], B = HK.ROAD_NODES[P.route[k + 1]]; const wx = A[0] + (B[0] - A[0]) * f + (i % 2 ? 0.16 : -0.16), wy = A[1] + (B[1] - A[1]) * f + (i % 2 ? -0.16 : 0.16);
        const sp = I.p(wx, wy, 0), dir = ((B[0] - A[0]) - (B[1] - A[1])) >= 0 ? 1 : -1, col = i === 0 ? '#bfa361' : i % 3 === 1 ? '#8b3939' : '#e8e0d0';
        items.push({ k: this.pointKey(wx, wy), box: [wx - 0.05, wy - 0.05, wx + 0.05, wy + 0.05], f: c => { this.drawPerson(c, sp[0], sp[1], col, 'monk', 1, false, '#dcc3aa', this.time * 5 + i, dir, null, null, 0.85); if (!this.picking && i === 0) { c.strokeStyle = '#bfa361'; c.lineWidth = 2; c.beginPath(); c.moveTo(sp[0], sp[1] - 26); c.lineTo(sp[0], sp[1] - 44); c.moveTo(sp[0] - 4, sp[1] - 40); c.lineTo(sp[0] + 4, sp[1] - 40); c.stroke(); } } });
      }
    }
    for (const w of this.walkers) {
      const a = this.walkerAlpha(w); if (a <= 0.02) continue;
      const p = this.walkerPos(w), ph = w.pause > 0 ? 0 : w.phase, hov = !!(this.hover && this.hover.walker === w);
      items.push({ s: 'w|' + w.type + '|' + w.color + '|' + w.skin + '|' + (w.hat ? 1 : 0) + (w.basket ? 1 : 0) + '|' + p.dir + '|' + (Math.round(ph * 2.5) % 16) + '|' + Math.round(a * 6) + '|' + (hov ? 1 : 0), ap: [p.x, p.y],
        k: this.pointKey(p.wx, p.wy), box: [p.wx - 0.05, p.wy - 0.05, p.wx + 0.05, p.wy + 0.05], f: c => this.drawPerson(c, p.x, p.y, w.color, w.type, a, hov, w.skin, ph, p.dir, null, w), pick: a >= 0.4 ? { kind: 'walker', walker: w, label: HK.t('enc_' + w.type + '_label') } : null });
    }
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
  /* Sichtbarer Ausschnitt in Kartenpixeln, ohne Beschnitt auf die Karte: auch was draußen auf See
     liegt, soll geprüft werden. Oben großzügig für hohe Bauten und ihre Schatten. */
  cullRect() {
    const c = this.cam, W = HK.SCENE.W / c.z, H = HK.SCENE.H / c.z;
    return { x0: c.x - 60, y0: c.y - 320, x1: c.x + W + 60, y1: c.y + H + 80 };
  },
  /* Liegt der Grundriss eines Objekts im Bild? */
  inView(b, v) {
    const p0 = I.p(b[0], b[1], 0), p1 = I.p(b[2], b[1], 0), p2 = I.p(b[0], b[3], 0), p3 = I.p(b[2], b[3], 0);
    return Math.max(p0[0], p1[0], p2[0], p3[0]) >= v.x0 && Math.min(p0[0], p1[0], p2[0], p3[0]) <= v.x1
      && Math.max(p0[1], p1[1], p2[1], p3[1]) >= v.y0 && Math.min(p0[1], p1[1], p2[1], p3[1]) <= v.y1;
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
    const savedL = this.lamps; this.lamps = []; this.picking = true;
    const items = this.buildItems(proxy, st, this.season(), this.time);
    this.pickTable = [null];
    const vr = this.cullRect();
    for (const it of items) { if (!it.pick) continue; if (it.box && !this.inView(it.box, vr)) continue; const id = this.pickTable.length; this.pickTable.push(it.pick); const code = id * 3; const col = `rgb(255,${code & 255},${(code >> 8) & 255})`; this.pickColor = col; real.fillStyle = col; real.strokeStyle = col; it.f(proxy); }
    real.restore();
    this.picking = false; this.lamps = savedL; this.pickTime = this.time;
  },

  /* Zeichenkontext, der jeden Füllbefehl zusätzlich als schwarze Silhouette in die Emissionsebene schreibt */
  /* Leuchtendes Fenster in die Emissionsebene schreiben (Weltkoordinaten) */
  emit(pts, col) { if (!this.em || !this.nightK || this.picking || this.emitOff) return; const em = this.em; em.save(); em.schwarz = false; em.fillStyle = col; em.beginPath(); pts.forEach((q, i) => { const p = I.p(q[0], q[1], q[2]); i ? em.lineTo(p[0], p[1]) : em.moveTo(p[0], p[1]); }); em.closePath(); em.fill(); em.restore(); },

  /* Dunstschleier: warm eintrüben, nach hinten stärker. Bindet die Farben zusammen wie auf
     gemalten Hansestadtbildern. Bei klarem Wetter bleibt davon nur ein leiser Tiefenhinweis;
     erst Wolken, Regen und Schnee legen wirklich Dunst über die Stadt. */
  GRADE: { haze: '216,201,166', near: 0.02, far: 0.09 },
  hazeK() { return this.weather === 'rain' ? 2.3 : this.weather === 'snow' ? 1.9 : this.weather === 'cloudy' ? 1.5 : 1; },
  /* ---------- Zeichnen ----------
     Gezeichnet wird über die Grafikkarte (js/scene-pixi.js). Hier steht nur noch, was beide Seiten
     brauchen: Boden und Wasserflecken als Zwischenbilder, Küste, Wetter, Umriss und das Fensterlicht. */
  draw() { if (HK.PixiScene && HK.PixiScene.bereit) HK.PixiScene.draw(); },
  /* Die Vignette ändert sich nie: einmal anlegen, danach auflegen */
  outline(ctx, b, color, w) { const hh = b.kind === 'church' ? 6.2 : b.h + Math.min(b.w, b.d) * 0.7 + 0.2; const hull = I.boxHull(b.x - 0.1, b.y - 0.1, b.w + 0.2, b.d + 0.2, hh); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.setLineDash([5, 4]); ctx.beginPath(); hull.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]); },

  /* Wasser über die ganze Fläche, Wellen und Glitzern */
  /* Tiefenflecken und Flachwassersaum hängen nicht vom Licht ab. Sie entstehen einmal und liegen
     danach als fertiges Bild über dem Farbverlauf, statt in jedem Bild aus 40 Verläufen neu zu wachsen. */
  waterOverlay() {
    if (this._waterOv) return this._waterOv;
    const W = HK.MAP.W, H = HK.MAP.H, c = document.createElement('canvas');
    c.width = Math.round(W * this.RS); c.height = Math.round(H * this.RS);
    const g = c.getContext('2d'); g.scale(this.RS, this.RS);
    for (let i = 0; i < 40; i++) { const x = (i * 173) % W, y = (i * 97 + 40) % H, r = 60 + (i % 5) * 30; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, i % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(0,10,30,0.14)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    for (const e of this.coastEdges()) { const [P0, P1, n] = e; I.poly(g, [[P0[0], P0[1], 0], [P1[0], P1[1], 0], [P1[0] + n[0] * 1.3, P1[1] + n[1] * 1.3, 0], [P0[0] + n[0] * 1.3, P0[1] + n[1] * 1.3, 0]], 'rgba(120,190,190,0.07)'); }
    return this._waterOv = c;
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
  /* ---------- Kaimauer ----------
     Behauene Quader in drei Lagen, im Verband gesetzt: jede Lage ist um einen halben Stein versetzt,
     und jeder Stein bekommt seinen eigenen Ton, damit die Wand nicht als gestreiftes Band liest.
     Oben eine vorstehende Mauerkrone mit ihrem Schattenstrich, unten der Algensaum, den das Wasser
     anzeichnet, dazu Ablaufspuren, Ringe zum Festmachen und hier und da eine Steigeisenleiter. */
  /* Fester Zufall aus der Lage eines Steins: dieselbe Wand sieht in jedem Bild gleich aus */
  steinTon(u) { const r = Math.sin(u * 12.9898) * 43758.5453; return r - Math.floor(r); },
  QUAI_H: 0.62,
  /* Dieselbe Wand dient der Kaikante und den Flanken der Mole: ein Bauwerk aus einer Hand.
     quayVorn/quayHinten sagen, ob die Mauer an diesem Ende weitergeht oder auf Uferhöhe abläuft. */
  drawQuayWall(ctx, A, B, n, len, quayVorn, quayHinten, hoehe) {
    const h = hoehe || this.QUAI_H, stein = '#6e6d68', hUfer = 0.26;
    const dx = (B[0] - A[0]) / len, dy = (B[1] - A[1]) / len;
    const P = (s, z) => [A[0] + dx * s, A[1] + dy * s, z];
    const zuf = u => { const r = Math.sin(u * 12.9898) * 43758.5453; return r - Math.floor(r); };
    const keim = A[0] * 3.1 + A[1] * 7.7;

    /* Wo die Mauer auf ein natürliches Ufer trifft, darf sie nicht einfach abbrechen: über ein
       Kopfstück läuft sie auf die Höhe der Böschung herunter, sonst klafft dort eine Stufe. */
    const kopf = Math.min(1.4, len / 3);
    const hAn = s => {
      let f = h;
      if (!quayVorn && s < kopf) f = Math.min(f, hUfer + (h - hUfer) * (s / kopf));
      if (!quayHinten && s > len - kopf) f = Math.min(f, hUfer + (h - hUfer) * ((len - s) / kopf));
      return f;
    };

    // Grundton, damit zwischen den Quadern nichts durchblitzt
    { const rand = [P(0, 0), P(len, 0)];
      for (let s = len; s >= 0; s -= 0.1) rand.push(P(s, hAn(s)));
      rand.push(P(0, hAn(0)));
      I.poly(ctx, rand, stein); }

    /* Drei Lagen, nach unten schwerer: unten liegen die großen Fundamentquader, oben die kleineren.
       Jede Lage ist um einen halben Stein versetzt, und das Licht fällt von oben ein. */
    const lagen = [
      { z0: 0, z1: h * 0.39, breite: 1.5, licht: 0.88 },
      { z0: h * 0.39, z1: h * 0.71, breite: 1.2, licht: 1.02 },
      { z0: h * 0.71, z1: h, breite: 0.95, licht: 1.14 },
    ];
    const fugen = [];
    lagen.forEach((L, li) => {
      const versatz = (li % 2) * L.breite * 0.5;
      for (let s = -versatz; s < len; s += L.breite) {
        const a = Math.max(0, s), b = Math.min(len, s + L.breite);
        if (b - a < 0.05) continue;
        const za = Math.min(L.z1, hAn(a)), zb = Math.min(L.z1, hAn(b));
        if (za <= L.z0 + 0.005 && zb <= L.z0 + 0.005) continue;     // liegt schon über dem Kopfstück
        const t = zuf(keim + s * 2.3 + li * 19.4);
        I.poly(ctx, [P(a, L.z0), P(b, L.z0), P(b, Math.max(zb, L.z0)), P(a, Math.max(za, L.z0))], I.shade(stein, L.licht + (t - 0.5) * 0.26));
        if (za > L.z0 + 0.02 && zb > L.z0 + 0.02) I.line(ctx, P(a + 0.04, za - 0.008), P(b - 0.04, zb - 0.008), 'rgba(255,250,238,0.13)', 0.7);
        if (s > 0 && za > L.z0 + 0.02) fugen.push([P(a, L.z0 + 0.012), P(a, za - 0.012)]);
      }
      if (li) { const linie = []; for (let s = 0; s <= len; s += 0.2) if (hAn(s) > L.z0 + 0.01) linie.push(s); if (linie.length > 1) fugen.push([P(linie[0], L.z0), P(linie[linie.length - 1], L.z0)]); }
    });
    I.lines(ctx, fugen, 'rgba(26,22,16,0.46)', 0.7);

    // Mauerkrone: heller Deckstein, der ein wenig vorsteht und darunter Schatten wirft
    { const oben = [], unten = [], schatten = [];
      for (let s = 0; s <= len; s += 0.1) { const z = hAn(s); oben.push(P(s, z)); unten.push(P(s, z - 0.085)); schatten.push([P(s, z - 0.092), P(Math.min(len, s + 0.1), hAn(Math.min(len, s + 0.1)) - 0.092)]); }
      I.poly(ctx, unten.concat(oben.reverse()), '#9c9a92');
      I.lines(ctx, schatten, 'rgba(22,18,12,0.5)', 1.2); }

    /* Der nasse Fuß: dunkler Streifen, wo das Wasser die Mauer ständig benetzt, darüber der
       Algensaum mit ungleicher Oberkante — Stein für Stein anders, wie es das Hochwasser anzeichnet. */
    I.poly(ctx, [P(0, 0), P(len, 0), P(len, 0.07), P(0, 0.07)], 'rgba(18,26,28,0.32)');
    I.poly(ctx, [P(0, 0.02), P(len, 0.02), P(len, 0.082), P(0, 0.082)], 'rgba(58,78,52,0.34)');
    for (let s = 0; s < len; s += 0.38) {          // ungleiche Oberkante, wie das Hochwasser sie anzeichnet
      const b = Math.min(len, s + 0.38), t = zuf(keim * 1.7 + s * 6.1);
      if (t < 0.3) continue;
      I.poly(ctx, [P(s, 0.07), P(b, 0.07), P(b, 0.07 + t * 0.075), P(s, 0.07 + t * 0.075)], 'rgba(58,78,52,0.3)');
    }

    // Ablaufspuren unter der Krone, wo der Regen über den Rand läuft
    const spuren = [];
    for (let s = 0.5; s < len; s += 0.75) {
      const t = zuf(keim * 2.9 + s * 9.7);
      if (t > 0.3 || hAn(s) < h - 0.02) continue;
      spuren.push([P(s, h - 0.1), P(s + (t - 0.15) * 0.06, 0.12)]);
    }
    I.lines(ctx, spuren, 'rgba(44,44,36,0.13)', 1.4);

    /* Beiwerk des Hafens: eiserne Ringe zum Festmachen, hölzerne Poller auf der Krone und
       ab und zu eine Steigeisenleiter hinunter zum Wasser. */
    for (let s = 0.9; s < len - 0.4; s += 1.5) {
      if (hAn(s) < h - 0.02) continue;
      const t = zuf(keim * 5.5 + s * 3.7);
      if (t < 0.12) {                              // Leiter
        const li = s - 0.06, re = s + 0.06, sprossen = [];
        for (let z = h - 0.1; z > 0.04; z -= 0.085) sprossen.push([P(li, z), P(re, z)]);
        I.lines(ctx, sprossen, 'rgba(46,38,30,0.7)', 1.2);
        I.lines(ctx, [[P(li, h - 0.1), P(li, 0.04)], [P(re, h - 0.1), P(re, 0.04)]], 'rgba(46,38,30,0.45)', 0.9);
      } else if (t < 0.55) {                       // Ring in der Wand
        const q = I.p(A[0] + dx * s, A[1] + dy * s, 0.4);
        ctx.strokeStyle = 'rgba(48,40,32,0.65)'; ctx.lineWidth = 0.9;
        ctx.beginPath(); ctx.ellipse(q[0], q[1] + 1.8, 1.9, 1.5, 0, 0, 6.28); ctx.stroke();
        ctx.fillStyle = 'rgba(58,50,40,0.75)'; ctx.fillRect(q[0] - 0.7, q[1] - 0.6, 1.4, 1.6);
      }
    }
    /* Poller: kurze Eichenpfosten auf der Mauerkrone. Sie müssen auf der Krone stehen, nicht auf dem
       Boden dahinter: Die Mauerstirn ist ein vorgetäuschter Höhensprung — sie verdeckt den Boden noch
       gut anderthalb Einheiten landeinwärts, und ein dort stehender Pfosten schiene über ihr zu schweben. */
    for (let s = 1.3; s < len - 0.6; s += 3.1) {
      if (hAn(s) < h - 0.02) continue;
      const t = zuf(keim * 7.3 + s * 4.1);
      if (t < 0.25) continue;
      const px = A[0] + dx * s - n[0] * 0.12, py = A[1] + dy * s - n[1] * 0.12;
      const fuss = I.p(px, py, h);
      ctx.fillStyle = 'rgba(30,24,16,0.28)';        // kurzer Standschatten, damit er aufsitzt
      ctx.beginPath(); ctx.ellipse(fuss[0] + 1, fuss[1] + 0.6, 3.6, 1.9, 0, 0, 6.28); ctx.fill();
      I.cylinder(ctx, px, py, h, 0.11, 0.3, '#6d5a43', { noTop: false });
    }
  },
  /* ---------- Natürliches Ufer ----------
     Wo keine Mauer steht, fällt das Land in einer niedrigen Böschung zum Wasser ab: heller Sand oben,
     feuchter und dunkler nach unten, dazwischen die waagerechten Linien, die das Wasser in den Sand
     gewaschen hat. Am Fuß liegen Steine unterschiedlicher Größe, oben am Rand steht Gras. */
  drawBank(ctx, A, B, n, len, vis, season) {
    const h = 0.26;
    const dx = (B[0] - A[0]) / len, dy = (B[1] - A[1]) / len;
    const P = (s, z) => [A[0] + dx * s, A[1] + dy * s, z];
    const W = (s, a) => [A[0] + dx * s + n[0] * a, A[1] + dy * s + n[1] * a, 0];
    const zuf = u => { const r = Math.sin(u * 12.9898) * 43758.5453; return r - Math.floor(r); };
    const keim = A[0] * 4.7 + A[1] * 2.3;
    const winter = season === 'winter';

    // Nasser Saum im Wasser, mit ungleicher Kante
    for (let s = 0; s < len; s += 0.3) {
      const b = Math.min(len, s + 0.3), t = zuf(keim + s * 7.1);
      I.poly(ctx, [W(s, 0), W(b, 0), W(b, 0.16 + t * 0.2), W(s, 0.16 + t * 0.2)], 'rgba(150,140,100,0.5)');
    }
    if (!vis) return;

    // Die Böschung selbst: oben trockener Sand, unten feucht
    const sand = winter ? '#cfd3d8' : '#9c8c66';
    for (let s = 0; s < len; s += 0.55) {
      const b = Math.min(len, s + 0.55), t = zuf(keim * 1.9 + s * 3.7);
      I.poly(ctx, [P(s, 0), P(b, 0), P(b, h + (t - 0.5) * 0.06), P(s, h + (t - 0.5) * 0.06)], I.shade(sand, 0.94 + t * 0.14));
    }
    I.poly(ctx, [P(0, 0), P(len, 0), P(len, 0.1), P(0, 0.1)], 'rgba(72,62,44,0.38)');
    // Waschlinien
    const linien = [];
    for (let z = 0.06; z < h - 0.02; z += 0.055) linien.push([P(0, z), P(len, z)]);
    I.lines(ctx, linien, 'rgba(90,74,46,0.22)', 0.6);
    I.line(ctx, P(0, h), P(len, h), 'rgba(60,50,30,0.3)', 0.7);

    // Steine am Fuß, in Größe und Ton gemischt
    for (let s = 0.1; s < len; s += 0.19) {
      const t = zuf(keim * 3.3 + s * 5.9);
      if (t < 0.52) continue;                       // nur hier und da einer, nicht als Kette
      const u = zuf(keim * 8.9 + s * 2.7);
      const r = 0.9 + t * 1.7, a = 0.02 + u * 0.1;  // klein und dicht am Fuß der Böschung
      const q = I.p(A[0] + dx * s + n[0] * a, A[1] + dy * s + n[1] * a, 0);
      ctx.fillStyle = 'rgba(20,30,34,0.3)';         // sitzt auf, wirft einen kurzen Schatten
      ctx.beginPath(); ctx.ellipse(q[0] + 0.6, q[1] + 0.5, r * 1.05, r * 0.5, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = I.shade('#6f6a5e', 0.78 + u * 0.36);
      ctx.beginPath(); ctx.ellipse(q[0], q[1], r, r * (0.42 + u * 0.22), 0, 0, 6.28); ctx.fill();
      if (r > 1.6) { ctx.fillStyle = 'rgba(240,238,225,0.13)'; ctx.beginPath(); ctx.ellipse(q[0] - r * 0.22, q[1] - r * 0.14, r * 0.42, r * 0.2, 0, 0, 6.28); ctx.fill(); }
    }
    // Grasbüschel auf der Oberkante
    if (!winter) {
      const halme = [];
      for (let s = 0.2; s < len; s += 0.28) {
        const t = zuf(keim * 6.1 + s * 8.3);
        if (t < 0.45) continue;
        const b = -0.04 - t * 0.05;
        for (let k = -1; k <= 1; k++) halme.push([[A[0] + dx * (s + k * 0.03) + n[0] * b, A[1] + dy * (s + k * 0.03) + n[1] * b, h - 0.02], [A[0] + dx * (s + k * 0.05) + n[0] * b, A[1] + dy * (s + k * 0.05) + n[1] * b, h + 0.05 + t * 0.06]]);
      }
      I.lines(ctx, halme, 'rgba(84,96,58,0.55)', 0.8);
    }
  },
  /* Küste: gemauerte Kaikanten mit sichtbarer Stirnseite, natürliche Ufer mit Sand, Uferböschung und Gischt */
  /* Wo verläuft die Uferlinie bei dieser x-Stelle? Gebraucht dort, wo ein Bauwerk am Ufer ansetzen
     muss, ohne als gerader Schnitt abzubrechen — etwa die Wurzel der Mole. */
  uferY(x) {
    let bester = null, abstand = 1e9;
    for (const [A, B] of this.coastEdges()) {
      const lo = Math.min(A[0], B[0]), hi = Math.max(A[0], B[0]);
      if (x < lo - 0.01 || x > hi + 0.01 || Math.abs(B[0] - A[0]) < 1e-6) continue;
      const t = (x - A[0]) / (B[0] - A[0]);
      const y = A[1] + (B[1] - A[1]) * t;
      const d = Math.abs(y - 20.2);
      if (d < abstand) { abstand = d; bester = y; }
    }
    return bester === null ? 20.2 : bester;
  },
  /* Grenzt an dieses Ende der Kante wieder eine gemauerte Kante, oder hört die Mauer hier auf? */
  quayNachbar(kanten, punkt) {
    for (const k of kanten) {
      if (Math.abs(k[0][0] - punkt[0]) < 1e-6 && Math.abs(k[0][1] - punkt[1]) < 1e-6) return !!k[3];
      if (Math.abs(k[1][0] - punkt[0]) < 1e-6 && Math.abs(k[1][1] - punkt[1]) < 1e-6) return !!k[3];
    }
    return true;
  },
  drawCoast(ctx, P, t) {
    const season = this.season();
    const kanten = this.coastEdges();
    for (const [A, B, n, quay, len] of kanten) {
      const vis = n[0] + n[1] > 0.05; // Stirnseite zeigt zum Betrachter (+x/+y)
      if (quay) {
        // Schatten der Kaimauer im Wasser: dicht an der Mauer dunkel, nach außen auslaufend
        I.poly(ctx, [[A[0], A[1], 0], [B[0], B[1], 0], [B[0] + n[0] * 0.5, B[1] + n[1] * 0.5, 0], [A[0] + n[0] * 0.5, A[1] + n[1] * 0.5, 0]], 'rgba(10,20,40,0.16)');
        I.poly(ctx, [[A[0], A[1], 0], [B[0], B[1], 0], [B[0] + n[0] * 0.22, B[1] + n[1] * 0.22, 0], [A[0] + n[0] * 0.22, A[1] + n[1] * 0.22, 0]], 'rgba(8,16,34,0.26)');
        if (vis) {
          // Endet die Mauer hier, läuft sie über ein Kopfstück auf die Höhe des Ufers herunter
          const vorn = this.quayNachbar(kanten.filter(k => k[0] !== A || k[1] !== B), A);
          const hinten = this.quayNachbar(kanten.filter(k => k[0] !== A || k[1] !== B), B);
          this.drawQuayWall(ctx, A, B, n, len, vorn, hinten);
        }
      } else {
        this.drawBank(ctx, A, B, n, len, vis, season);
      }
      // Gischt — beim Ablegen der festen Küstengeometrie bleibt sie außen vor, weil sie sich bewegt
      if (this.gischtAus) continue;
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let k = 0; k < len; k += 0.25) { const f = k / len; if (((k * 13) | 0) % 3) continue; const q = I.p(A[0] + (B[0] - A[0]) * f + n[0] * 0.3, A[1] + (B[1] - A[1]) * f + n[1] * 0.3, 0); ctx.fillRect(q[0] - 2 + Math.sin(t * 3 + k * 5), q[1], 3, 1); }
    }
  },
  /* Der Wassergraben folgt der Mauer: für jeden Eckpunkt der betroffenen Strecke wird die mittlere
     Außennormale gebildet und der Punkt um d0 (Ufer) bzw. d1 (Außenrand) hinausgeschoben. Am Ende am
     Bollwerk läuft er ins Meer. */
  moatBand() {
    if (this._moat) return this._moat;
    const Wd = HK.WALL, M = Wd.moat, P = Wd.pts, i0 = M.from, i1 = M.to;
    const normale = i => {
      const nOf = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dy / l, -dx / l]; };
      const n1 = i > i0 ? nOf(P[i - 1], P[i]) : null, n2 = i < i1 ? nOf(P[i], P[i + 1]) : null;
      if (!n1) return n2; if (!n2) return n1;
      const n = [n1[0] + n2[0], n1[1] + n2[1]], l = Math.hypot(n[0], n[1]) || 1, k = 1 / Math.max(0.6, (1 + n1[0] * n2[0] + n1[1] * n2[1]) / 2);   // Gehrung an der Ecke
      return [n[0] / l * k, n[1] / l * k];
    };
    const innen = [], aussen = [];
    for (let i = i0; i <= i1; i++) { const n = normale(i), p = P[i]; innen.push([p[0] + n[0] * M.d0, p[1] + n[1] * M.d0]); aussen.push([p[0] + n[0] * M.d1, p[1] + n[1] * M.d1]); }
    // Letzter Abschnitt bis ins Wasser verlängern
    const e = innen.length - 1; innen[e] = [innen[e][0], innen[e][1] + 0.6]; aussen[e] = [aussen[e][0], aussen[e][1] + 0.6];
    const inner = innen.concat(aussen.slice().reverse());
    const uferA = innen.map(([x, y], i) => { const n = normale(i0 + i); return [x - n[0] * 0.18, y - n[1] * 0.18]; }), uferB = aussen.map(([x, y], i) => { const n = normale(i0 + i); return [x + n[0] * 0.2, y + n[1] * 0.2]; });
    const outer = uferA.concat(uferB.slice().reverse());
    const gl = innen.map(([x, y], i) => { const n = normale(i0 + i); return [x + n[0] * 0.25, y + n[1] * 0.25]; }), gl2 = innen.map(([x, y], i) => { const n = normale(i0 + i); return [x + n[0] * 0.5, y + n[1] * 0.5]; });
    return (this._moat = { inner, outer, glanz: gl.concat(gl2.slice().reverse()) });
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
    // Wassergraben vor der Landseite der Mauer: dunkles Wasser, heller Uferstreifen
    if (!winter || true) { const band = this.moatBand(); poly(band.outer, 'rgba(80,90,60,0.35)'); poly(band.inner, winter ? '#8fa3b0' : '#3d6570', 'rgba(30,45,40,0.5)'); poly(band.glanz, 'rgba(180,210,210,0.10)'); }
    // Stadtboden innerhalb der Mauer
    poly(HK.TOWN, winter ? this.pat.snow : this.pat.earth);
    // Kaistreifen entlang der gemauerten Kanten
    for (const [A, B, n, quay] of this.coastEdges()) if (quay) poly([[A[0], A[1]], [B[0], B[1]], [B[0] - n[0] * 0.5, B[1] - n[1] * 0.5], [A[0] - n[0] * 0.5, A[1] - n[1] * 0.5]], this.pat.stone, 'rgba(0,0,0,0.3)');
    // Felder
    for (const [fx, fy, fw, fd] of HK.FIELDS) { poly([[fx, fy, 0], [fx + fw, fy, 0], [fx + fw, fy + fd, 0], [fx, fy + fd, 0]], winter ? '#d8dbe0' : this.pat.field, 'rgba(60,40,20,0.35)'); for (let k = 0.35; k < fd; k += 0.35) { const a = I.p(fx, fy + k, 0), b = I.p(fx + fw, fy + k, 0); g.strokeStyle = 'rgba(70,50,20,0.3)'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); } }
    // Straßen in beliebiger Richtung: Rechteck um die Strecke
    for (const [x1, y1, x2, y2, w] of HK.STREETS) { const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, nx = -dy / len * w / 2, ny = dx / len * w / 2; const pts = [[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]]; const outside = !this.inTown((x1 + x2) / 2, (y1 + y2) / 2); poly(pts, winter ? '#cfd3d8' : (outside ? '#a89474' : this.pat.cobble), 'rgba(60,45,25,0.35)'); }
    // Marktplatz und die anderen gepflasterten Plätze
    const m = HK.BUILDING.market; poly([[m.x, m.y, 0], [m.x + m.w, m.y, 0], [m.x + m.w, m.y + m.d, 0], [m.x, m.y + m.d, 0]], winter ? '#d3d6da' : this.pat.cobble, 'rgba(60,45,25,0.4)');
    for (const [qx, qy, qw, qd] of (HK.SQUARES || [])) poly([[qx, qy, 0], [qx + qw, qy, 0], [qx + qw, qy + qd, 0], [qx, qy + qd, 0]], winter ? '#d3d6da' : this.pat.cobble, 'rgba(60,45,25,0.4)');
    // Pfützen, Schmutz
    for (let i = 0; i < 150; i++) { const x = 8 + Math.random() * 30, y = -2 + Math.random() * 20; if (!this.inTown(x, y)) continue; const s = I.p(x, y, 0); g.fillStyle = 'rgba(70,55,30,0.12)'; g.beginPath(); g.ellipse(s[0], s[1], 5 + Math.random() * 10, 2 + Math.random() * 3, 0, 0, 6.28); g.fill(); }
    this.ground = c;
  },

  /* ---------- Wetter, Licht ---------- */
  drawWeather(ctx, t) {
    if (this.weather === 'rain') { ctx.strokeStyle = 'rgba(200,215,235,0.35)'; ctx.lineWidth = 1; for (let i = 0; i < 220; i++) { const x = ((i * 67 + t * 260) % (HK.SCENE.W + 40)) - 20, y = ((i * 131 + t * 420) % (HK.SCENE.H + 60)) - 30; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 12); ctx.stroke(); } }
    if (this.weather === 'snow') { ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 180; i++) { const x = ((i * 89 + t * 18 + Math.sin(t + i) * 20) % (HK.SCENE.W + 40)) - 20, y = ((i * 151 + t * 40) % (HK.SCENE.H + 40)) - 20; ctx.beginPath(); ctx.arc(x, y, 1.2 + (i % 3) * 0.5, 0, 6.28); ctx.fill(); } }
    if (this.weather === 'cloudy') { ctx.fillStyle = 'rgba(142,134,120,0.09)'; ctx.fillRect(0, 0, HK.SCENE.W, HK.SCENE.H); }
  },
  /* Tageslicht-Ton und Morgen-/Abendrot sind weiche, großflächige Farbschleier. Sie entstehen in kleiner
     Auflösung und werden in einem Zug hochgezogen: ein ganzflächiger Durchgang statt zweien. */
  /* Der Lichtschein der Fenster: die Emissionsebene liegt in kleiner Auflösung vor und wird dort auch
     weichgezeichnet. Eine Weichzeichnung über das ganze große Bild kostete mehr als alles andere zusammen. */
  /* Laternenschein einmal als Bildchen, statt für jede Laterne einen eigenen Farbverlauf anzulegen */
};
