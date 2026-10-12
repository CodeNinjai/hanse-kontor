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
    this.initCarts();
    this.initChickens();
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
  /* Kamera auf einen Weltpunkt richten, ohne aus der Nähe herauszuzoomen */
  zeigeAuf(wx, wy) {
    const p = I.p(wx, wy, 0), z = HK.clamp(Math.max(this.cam.z, 1.5), this.zoomMin(), this.ZOOM_MAX);
    this.camAuto = false; this.cam.z = z; this.cam.x = p[0] - HK.SCENE.W / (2 * z); this.cam.y = p[1] - HK.SCENE.H / (2 * z); this.clampCam();
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
      if (ptrs.size === 1) drag = { x: e.clientX, y: e.clientY, point: this.toMap(this.toScene(e)), moved: false };
      else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: this.cam.z }; drag = null; }
    });
    canvas.addEventListener('pointermove', e => {
      if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const r = canvas.getBoundingClientRect(), k = HK.SCENE.W / r.width;
      if (pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); this.setZoom(pinch.z * d / (pinch.d || 1), ((a.x + b.x) / 2 - r.left) * k, ((a.y + b.y) / 2 - r.top) * k); return; }
      if (drag) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!drag.moved && Math.hypot(dx, dy) > 8) { drag.moved = true; canvas.style.cursor = 'grabbing'; this.tooltip(null); }
        if (drag.moved) { this.panBy(dx * k, dy * k); drag.x = e.clientX; drag.y = e.clientY; return; }
      }
      if (e.pointerType === 'mouse') hoverAt(e);
    });
    const up = e => {
      ptrs.delete(e.pointerId);
      if (drag && !drag.moved && e.type === 'pointerup') { const p = drag.point; const h = this.hit(p.x, p.y, true); if (h) HK.UI.sceneClick(h); }
      if (ptrs.size < 2) pinch = null;
      if (ptrs.size === 0) { drag = null; canvas.style.cursor = this.hover ? 'pointer' : 'grab'; }
    };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('mouseleave', () => { this.hover = null; this.tooltip(null); });
    canvas.addEventListener('wheel', e => { e.preventDefault(); const p = this.toScene(e); this.setZoom(this.cam.z * (e.deltaY < 0 ? 1.15 : 1 / 1.15), p.x, p.y); if (e.pointerType !== 'touch') hoverAt(e); }, { passive: false });
    canvas.addEventListener('dblclick', e => { e.preventDefault(); const p = this.toScene(e), m = this.toMap(p); if (this.hit(m.x, m.y, true)) return; this.setZoom(this.cam.z < 1.5 ? 2 : 1, p.x, p.y); });
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
  // Multiplicative illumination: no additive colour floor in dark materials.
  KEYS: [
    { c: 0.00, top: [20, 25, 28], near: [24, 32, 35], far: [39, 50, 53], tint: [102, 123, 158, 1], amb: 0.28 },
    { c: 0.20, top: [22, 28, 32], near: [25, 33, 36], far: [43, 55, 59], tint: [108, 128, 164, 1], amb: 0.3 },
    { c: 0.26, top: [84, 91, 100], near: [77, 95, 98], far: [197, 150, 124], tint: [235, 219, 199, 1], amb: 0.7 },
    { c: 0.34, top: [65, 130, 151], near: [58, 92, 101], far: [77, 120, 128], tint: [252, 248, 235, 1], amb: 0.95 },
    { c: 0.50, top: [57, 112, 135], near: [51, 89, 101], far: [64, 101, 114], tint: [255, 255, 255, 1], amb: 1 },
    { c: 0.66, top: [68, 106, 124], near: [58, 88, 98], far: [102, 99, 92], tint: [255, 246, 228, 1], amb: 0.95 },
    { c: 0.76, top: [108, 119, 133], near: [72, 88, 94], far: [199, 142, 116], tint: [243, 209, 170, 1], amb: 0.75 },
    { c: 0.84, top: [56, 65, 75], near: [39, 51, 55], far: [95, 70, 86], tint: [155, 169, 197, 1], amb: 0.45 },
    { c: 0.90, top: [22, 28, 31], near: [25, 33, 36], far: [41, 53, 57], tint: [108, 128, 164, 1], amb: 0.3 },
    { c: 1.00, top: [20, 25, 28], near: [24, 32, 35], far: [39, 50, 53], tint: [102, 123, 158, 1], amb: 0.28 },
  ],
  palette() {
    const c = this.clock, K = this.KEYS; let i = 0;
    while (i < K.length - 2 && K[i + 1].c <= c) i++;
    const a = K[i], b = K[i + 1], t = (c - a.c) / (b.c - a.c);
    const mix = (u, v) => u.map((x, k) => x + (v[k] - x) * t);
    const p = { top: mix(a.top, b.top), near: mix(a.near, b.near), far: mix(a.far, b.far), tint: mix(a.tint, b.tint), amb: a.amb + (b.amb - a.amb) * t };
    if (this.weather === 'rain') { const g = v => v.map((x, k) => (x * 0.6 + [110, 115, 125][k] * 0.4)); p.top = g(p.top); p.near = g(p.near); p.far = g(p.far); p.amb *= 0.8; }
    // Overcast light dims and cools materials instead of laying grey paint over them.
    const weatherLight = {rain:[.79,.84,.91],cloudy:[.89,.92,.96],snow:[.94,.97,1]}[this.weather];
    if(weatherLight)p.tint=p.tint.map((v,i)=>i<3?v*weatherLight[i]:v);
    return p;
  },
  rgb: (v, a) => `rgba(${v[0] | 0},${v[1] | 0},${v[2] | 0},${a === undefined ? 1 : a})`,
  light() { return this.palette().amb; },
  sunT() { const c = this.clock; return c >= 0.24 && c <= 0.80 ? (c - 0.24) / 0.56 : null; },
  shadowVec() {
    const t=this.sunT(), moon={v:[.25,.25],a:.08};
    const diffuse={rain:.45,cloudy:.62,snow:.7}[this.weather]||1;
    if(t===null)return{v:moon.v,a:moon.a*diffuse};
    const elevation=Math.sin(t*Math.PI), len=.35+.9*(1-elevation);
    const u=HK.clamp(elevation/.16,0,1), fade=u*u*(3-2*u);
    const sun=[(.6-t)*1.4*len+.1,.35*len+.15];
    return{v:sun.map((v,i)=>moon.v[i]+(v-moon.v[i])*fade),a:(moon.a+(.2+.12*elevation-moon.a)*fade)*diffuse};
  },
  season() { const m = HK.state ? HK.monthOf(HK.state.day) : 5; return [11, 0, 1].includes(m) ? 'winter' : [8, 9, 10].includes(m) ? 'autumn' : m <= 3 ? 'spring' : 'summer'; },
  SMOKY: new Set(['eave', 'gable', 'hall', 'longhouse', 'hospital', 'school']),
  rollWeather() { this.weather = HK.weatherVisual?.(HK.state) || 'clear'; },

  /* ---------- Passanten ---------- */
  makeWalker(anywhere) {
    const types = []; HK.WALKER_TYPES.forEach(t => { for (let i = 0; i < t.weight; i++) types.push(t); });
    if (HK.state && HK.state.pilgrimage) for (let i = 0; i < 3; i++) types.push({ id: 'pilgrim', colors: ['#6f645c', '#6c5946', '#7b6a5a', '#595959'] });
    const t = HK.pick(types), keys = Object.keys(HK.ROAD_NODES);
    const from = HK.pick(keys), to = HK.pick(HK.ROAD_ADJ[from]);
    const off = this.pickOff(from, to);
    return { type: t.id, color: HK.pick(t.colors), from, to, t: anywhere ? Math.random() : 0, speed: HK.rnd(0.25, 0.5) * (t.id === 'child' ? 1.5 : t.id === 'beggar' ? 0.6 : 1), off, pause: 0, nightOwl: Math.random() < 0.2 || t.id === 'guard', skin: HK.pick(['#dcc3aa', '#d2aa91', '#c59570']), hat: Math.random() < 0.5, basket: Math.random() < 0.3, phase: Math.random() * 6.28 };
  },
  /* Das Raster sucht nur nahe Hindernisse. Die genaue Grenze entscheidet
     anschließend über den Punkt, damit eine Randzelle keine Hauswand freigibt. */
  GRID: { x0: -10, y0: -24, cell: 0.2, w: 310, h: 260 },
  buildGrid() {
    const G = this.GRID, n = G.w * G.h, blocked = new Uint8Array(n), obstacles = new Array(n);
    const stamp = (b) => {
      const i0 = Math.max(0, Math.floor((b[0] - G.x0) / G.cell)), i1 = Math.min(G.w - 1, Math.floor((b[2] - G.x0) / G.cell));
      const j0 = Math.max(0, Math.floor((b[1] - G.y0) / G.cell)), j1 = Math.min(G.h - 1, Math.floor((b[3] - G.y0) / G.cell));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) (obstacles[j * G.w + i] ||= []).push(b);
    };
    for (const p of HK.PROPS) { if (p.t === 'stalls') continue;
      const boxes = p.t === 'tollbar' ? [[p.x - 0.23, p.y - 0.88, p.x + 0.2, p.y - 0.5], [p.x - 0.05, p.y + 0.5, p.x + 0.05, p.y + 0.6]] : [this.propBox(p)];
      for (const b of boxes) stamp([b[0] - 0.12, b[1] - 0.12, b[2] + 0.12, b[3] + 0.12]);
    }
    for (const b of [...HK.BUILDINGS, HK.FARM, ...HK.HAMLET]) if (b.kind !== 'water' && b.kind !== 'market' && b.kind !== 'gate') {
      // Dachüberstand und Körperbreite brauchen Platz neben der Fassade.
      const gap = ['yard', 'plot', 'timberyard'].includes(b.kind) ? .03 : b.brick || b.kind === 'hall' ? .08 : .16;
      const box = this.buildingBox(b); stamp([box[0] - gap, box[1] - gap, box[2] + gap, box[3] + gap]);
      for (const extra of this.buildingExtras?.(b) || []) if (extra.box && extra.part !== 'hoist') {
        const a = extra.box; stamp([a[0] - .12, a[1] - .12, a[2] + .12, a[3] + .12]);
      }
    }
    // Collision uses the same footprints as the rendered foregate. The bridge
    // and central passage stay open; only the two gatehouse flanks are solid.
    for (const gate of HK.WALL.gates) {
      const sp = this.gateSpec(gate);
      for (const part of this.gateParts(sp)) {
        if (typeof part.part !== 'number') continue;
        const b = part.box; stamp([b[0] - .1, b[1] - .1, b[2] + .1, b[3] + .1]);
      }
      for (const sign of [-1, 1]) {
        const points = [-.6, .5].flatMap(u => [sp.pw / 2, sp.pw / 2 + 1.15].map(v =>
          [sp.cx + sp.d[0] * u + sp.s[0] * v * sign, sp.cy + sp.d[1] * u + sp.s[1] * v * sign]));
        stamp([Math.min(...points.map(p => p[0])) - .1, Math.min(...points.map(p => p[1])) - .1,
          Math.max(...points.map(p => p[0])) + .1, Math.max(...points.map(p => p[1])) + .1]);
      }
    }
    for (const sp of HK.CARAVAN_SPOTS) {
      const b = HK.caravanBox(sp); stamp([b[0] - .1, b[1] - .1, b[2] + .1, b[3] + .1]);
    }
    for (const [x, y] of HK.TREES) stamp([x - 0.1, y - 0.1, x + 0.1, y + 0.1]);
    for (const p of this.marketStalls(HK.BUILDING.market)) stamp([p.x - 0.06, p.y - 0.06, p.x + 0.61, p.y + 0.41]);
    for (const r of (HK.NOWALK || [])) stamp(r);
    // Kran und Stapelplätze auf den Stegen sind für Passanten tabu; die Fahrrinne daneben bleibt frei
    for (const d of this.docks()) {
      stamp([d.cx - 0.72, d.cy - 0.6, d.cx + 0.72, d.cy + 0.6]);
      for (const sl of d.slots) stamp([sl.x - 0.3, sl.y - 0.2, sl.x + 0.3, sl.y + 0.36]);
    }
    for (const detail of HK.CITY_DETAILS || []) {
      const b = this.cityDetailBox(detail); stamp([b[0] - .10, b[1] - .10, b[2] + .10, b[3] + .10]);
    }
    // Wasser sperren, Stegplanken bleiben begehbar
    for (let j = 0; j < G.h; j++) for (let i = 0; i < G.w; i++) { const k = j * G.w + i; if (blocked[k]) continue;
      const wx = G.x0 + (i + 0.5) * G.cell, wy = G.y0 + (j + 0.5) * G.cell;
      if (this.isWater(wx, wy) && !this.pierAt(wx, wy) && !this.moleAt(wx, wy) && !this.deckZ(wx, wy)) blocked[k] = 1; }
    return (this._grid = { blocked, obstacles, aisle: this.churchAisle() });
  },
  moleAt(x, y) {
    const m=HK.MOLE;
    return x>=m.x-.28&&x<=m.x+m.w+.28&&y>=m.y1-1.25&&y<=m.y1 ||
      x>=m.x&&x<=m.x+m.w&&y>=this.uferY(x)&&y<=m.y1;
  },
  blockedAt(x, y) {
    const L=HK.LIGHTHOUSE;
    if(Math.hypot(x-L.x,y-L.y)<L.r+.025)return true;
    if (this._grid && this._grid.aisle !== this.churchAisle()) { this._grid = null; this._edgeFree = null; }
    const G = this.GRID, g = this._grid || this.buildGrid();
    const i = Math.floor((x - G.x0) / G.cell), j = Math.floor((y - G.y0) / G.cell);
    if (i < 0 || j < 0 || i >= G.w || j >= G.h) return false;
    const k = j * G.w + i;
    return !!g.blocked[k] || !!g.obstacles[k]?.some(b => x >= b[0] && y >= b[1] && x <= b[2] && y <= b[3]);
  },
  /* Für jede Wegstrecke einmal prüfen, welche seitlichen Versätze durchgehend frei sind.
     Passanten wählen einen davon und behalten ihn: ihre Bahn bleibt eine Gerade, nichts springt. */
  OFFSETS: [0, 0.13, -0.13, 0.22, -0.22],
  edgeFree(a, b) {
    if (this._grid && this._grid.aisle !== this.churchAisle()) { this._grid = null; this._edgeFree = null; }
    const cache = this._edgeFree || (this._edgeFree = {});
    // Offsets are relative to the travel direction; reversing an edge reverses
    // left and right as well. A shared undirected key picks the blocked side.
    const key = a + '>' + b;
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
  // Begehbare Stege unabhängig von ihrer Höhe erkennen: ein bündiges Deck
  // liegt wie der Kai bei z = 0 und darf deshalb nicht als Wasser gelten.
  pierAt(x, y) {
    return HK.PIERS.find(p => { const h = (p.w || 0.6) / 2; return x >= p.x - h && x <= p.x + h && y >= p.y0 && y <= p.y1; });
  },
  /* Gemeinsame Auflagehöhe von Planken, Kränen, Waren und Trägern */
  deckZ(x, y) {
    if (this.pierAt(x, y)) return this.DECK_Z;
    for (const g of HK.WALL.gates) {
      const sp = this.gateSpec(g), dx = x - sp.cx, dy = y - sp.cy;
      const u = dx * sp.d[0] + dy * sp.d[1], v = dx * sp.s[0] + dy * sp.s[1];
      if (u >= 0.45 && u <= sp.moat.d1 + 0.25 && Math.abs(v) <= sp.pw / 2 + 0.08) return 0.1;
    }
    return 0;
  },

  /* ---------- Hafenumschlag: Kran auf dem Steg, Stapelplätze, Träger ---------- */
  CRANE_CYCLE: 13, DECK_Z: 0, STACK_MAX: 3,
  /* Ein Kran je Steg bedient die beiden seitlichen Liegeplätze. */
  docks() {
    if (this._docks) return this._docks;
    return (this._docks = HK.PIERS.map((p, i) => {
      const cx = p.crane, cy = p.y0 + 1.05, R = 2.7;
      const slots = [0, 1, 2].map(i => { const x = p.x + 0.05, y = cy + 0.78 + i * 0.62; return { th: Math.atan2(x - cx, y - cy), R: Math.hypot(x - cx, y - cy), x, y, items: [], reserved: null, claimedBy: null }; });
      const b = HK.BERTHS[i * 2], sx = b.x, sy = b.y;
      return { pier: p, i, cx, cy, R, slots, berth: i * 2, shipTh: Math.atan2(sx - cx, sy - cy), shipR: Math.hypot(sx - cx, sy - cy), parkTh: slots[0].th, parkR: slots[0].R, u: 0, working: false, dropped: -1, pending: [], seenShips: new Set(), delivered: [], cancelled: [] };
    }));
  },
  dockFree(d) { return d.slots.some(s => s.items.length < this.STACK_MAX); },
  dockSlotFor(d) { return d.slots.find(s => s.items.length < this.STACK_MAX) || d.slots[0]; },
  dockItems(d) { let n = 0; for (const s of d.slots) n += s.items.length; return n; },
  goodKind: { grain: 'sack', salt: 'sack', wool: 'sack', spices: 'sack', beer: 'barrel', wine: 'barrel', fish: 'barrel', smokedfish: 'barrel', wax: 'barrel' },
  cargoSlot(d, it) { return d.slots.find(s => !s.reserved && !s.claimedBy && s.items.length < this.STACK_MAX && s.items.every(v => v.good === it.good && v.kind === it.kind)); },
  dockManifest(d) {
    const ships = HK.state?.ships || [];
    for (const ship of ships.filter(v => Math.floor(v.berth / 2) === d.i && this.craneBusy({ berth: v.berth }))) {
      if (d.seenShips.has(ship.id)) continue;
      d.seenShips.add(ship.id);
      for (const [good, cargo] of Object.entries(ship.cargo || {})) {
        const qty = Math.max(0, Math.floor(typeof cargo === 'number' ? cargo : cargo.qty));
        const count = Math.min(3, Math.ceil(qty / 8));
        for (let i = 0; i < count; i++) d.pending.push({ id: ship.id + ':' + good + ':' + i, shipId: ship.id, berth: ship.berth, good, kind: this.goodKind[good] || 'crate', qty: Math.floor(qty / count) + (i < qty % count ? 1 : 0) });
      }
    }
    d.pending = d.pending.filter(it => { const exists = ships.some(v => v.id === it.shipId); if (!exists) d.cancelled.push(it); return exists; });
  },
  /* Kranlauf: heben, an Land schwenken, absetzen, leeren Haken zurück. Beim Absetzen wächst der Stapel. */
  updateDocks(dt) {
    for (const d of this.docks()) {
      this.dockManifest(d);
      if (d.load && d.u < 0.2 && !this.craneBusy({ berth: d.load.berth })) {
        d.cancelled.push(d.load); if (d.slot) d.slot.reserved = null;
        d.load = null; d.slot = null; d.u = 0;
      }
      if (d.u === 0 && !d.load) {
        const next = d.pending.findIndex(it => this.craneBusy({ berth: it.berth }) && this.cargoSlot(d, it));
        if (next < 0) { d.working = false; continue; }
        d.load = d.pending.splice(next, 1)[0]; d.slot = this.cargoSlot(d, d.load); d.slot.reserved = d.load; d.lastDrop = null;
        d.berth = d.load.berth;
        const b = HK.BERTHS[d.berth]; d.shipTh = Math.atan2(b.x - d.cx, b.y - d.cy); d.shipR = Math.hypot(b.x - d.cx, b.y - d.cy);
      }
      d.working = true;
      const prev = d.u;
      d.u = Math.min(1, d.u + dt / this.CRANE_CYCLE);
      if (prev < 0.67 && d.u >= 0.67 && d.dropped < 0) {
        const slot = d.slot || this.dockSlotFor(d);
        if (slot.items.length < this.STACK_MAX && d.load) { d.lastDrop = { item: d.load, index: slot.items.length }; slot.items.push(d.load); }
        slot.reserved = null;
        d.load = null; d.dropped = 1;
      }
      if (d.u >= 1) { d.parkTh = d.slot.th; d.parkR = d.slot.R || d.R; d.u = 0; d.dropped = -1; }
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
  roadPoint(node, cart = false) {
    const p = HK.ROAD_NODES[node];
    return cart && p[1] === 18.3 ? [p[0], 18.85] : p;
  },
  porterOff(a, b, cart) {
    if (!cart) return this.pickOff(a, b);
    const A = this.roadPoint(a, true), B = this.roadPoint(b, true);
    // Der breite Wagen braucht am Kai mehr Fassadenabstand als ein Passant.
    // In beiden Fahrtrichtungen bleibt seine Spur auf der Wasserseite.
    if (A[1] === 18.85 && B[1] === 18.85) return 0;
    // Karren halten Abstand zur äußeren Stegkante; Fußgängerspuren wären zu schmal.
    if (this.PORTER_DOCK.includes(a) || this.PORTER_DOCK.includes(b)) return HK.ROAD_NODES[b][1] > HK.ROAD_NODES[a][1] ? 0.1 : -0.1;
    return this.edgeFree(a, b).slice().sort((x, y) => Math.abs(x) - Math.abs(y))[0] ?? 0;
  },
  /* Träger holen die gestapelte Ware vom Steg ins Lager am Kai */
  spawnPorter(d, cart) {
    const home = this.PORTER_HOME[d.i], path = this.route(home, this.PORTER_DOCK[d.i]);
    if (path.length < 2) return;
    this.porters.push({
      type: 'porter', cart: !!cart, cap: cart ? 3 : 1, dock: d, state: 'go', path, pi: 1, from: path[0], to: path[1], t: 0,
      off: this.porterOff(path[0], path[1], cart), speed: cart ? HK.rnd(0.34, 0.42) : HK.rnd(0.42, 0.55), phase: Math.random() * 6.28,
      color: HK.pick(['#7a5e3e', '#80694b', '#705a3f', '#7a6445']), skin: HK.pick(['#dcc3aa', '#d2aa91', '#c59570']),
      items: [], wait: 0, slot: null, a: null, b: null, ft: 0, hat: Math.random() < 0.4,
    });
    return this.porters.at(-1);
  },
  /* Ein Fahrzeug dreht sich in die Fahrtrichtung, statt auf die nächste Achse zu springen */
  turn(o, target, dt) {
    if (o.head == null) { o.head = target; return; }
    const d = Math.atan2(Math.sin(target - o.head), Math.cos(target - o.head));
    o.head += d * Math.min(1, dt * 5);
  },
  rollCart(o, before, after, radius) {
    const dx = after.wx - before.wx, dy = after.wy - before.wy;
    o.moving = Math.hypot(dx, dy) > 1e-7;
    // Am Auflagepunkt muss die Umfangsgeschwindigkeit der Fahrt entgegenwirken.
    o.wheelSpin = (o.wheelSpin || 0) - (dx * Math.cos(o.head || 0) + dy * Math.sin(o.head || 0)) / radius;
  },
  initCarts() {
    // Ochsenkarren folgen Rundwegen: In schmalen Gassen ist kein Platz für
    // eine Drehung des ganzen Gespanns um die Wagenachse.
    const loop = (route, t, v) => ({ route, leg: 0, a: route[0], b: route[1], t, dir: 1, v, ox: true });
    this.carts = [
      loop([[9.5, 5.5], [21, 5.5], [21, 10], [9.5, 10]], .2, .25),
      { a: [9.5, 9.9], b: [27, 9.9], t: .7, dir: -1, v: .2, ox: false },
      loop([[24, 5.1], [27.7, 5.1], [27.7, 10], [24, 10]], .5, .22),
    ];
    for (const c of this.carts) this.updateCartActor(c, 0);
  },
  updateCartActor(c, dt) {
    if (!c.route) return;
    // Das Zugtier läuft auf derselben Straße voraus, statt beim Abbiegen
    // diagonal durch den Innenblock zu schwenken.
    let leg = c.leg, a = c.a, b = c.b, distance = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let ahead = distance * c.t + .92;
    while (ahead > distance) {
      ahead -= distance; leg = (leg + 1) % c.route.length;
      a = c.route[leg]; b = c.route[(leg + 1) % c.route.length]; distance = Math.hypot(b[0] - a[0], b[1] - a[1]);
    }
    c.actorPos = [a[0] + (b[0] - a[0]) * ahead / distance, a[1] + (b[1] - a[1]) * ahead / distance];
    const animal = { head: c.actorHead };
    this.turn(animal, Math.atan2(b[1] - a[1], b[0] - a[0]), dt);
    c.actorHead = animal.head;
  },
  porterPos(w) {
    if (w.a) {
      const wx = w.a[0] + (w.b[0] - w.a[0]) * w.ft, wy = w.a[1] + (w.b[1] - w.a[1]) * w.ft;
      return { wx, wy, wz: this.deckZ(wx, wy), dir: ((w.b[0] - w.a[0]) - (w.b[1] - w.a[1])) >= 0 ? 1 : -1 };
    }
    return this.walkerWorld(w);
  },
  porterHeading(w, dx, dy) {
    const angle = Math.atan2(dy, dx);
    // Auf dem schmalen Steg schiebt der Träger den Karren zurück. Erst auf
    // dem Kai wird gewendet; eine Drehung am Stapel reicht über die Deckkante.
    w.pushing = w.cart && dy < 0 && Math.abs(dx) < .01 && (!!w.a || this.PORTER_DOCK.includes(w.from));
    return w.pushing ? angle + Math.PI : angle;
  },
  updatePorters(dt) {
    const docks = this.docks();
    for (const d of docks) {
      const n = d.slots.reduce((sum,s)=>sum+s.items.filter(p=>p.direction!=='out').length,0);
      const mine = this.porters.filter(w => w.dock === d);
      const want = Math.min(this.PORTER_MAX, Math.ceil(n / 3));
      if (mine.length < want && Math.random() < dt * 0.8) this.spawnPorter(d, n >= 3 || d.slots.some(s => s.items.some(it => it.kind === 'barrel')));
    }
    for (let k = this.porters.length - 1; k >= 0; k--) {
      const w = this.porters[k];
      w.moving = false;
      if (w.wait > 0) { w.wait -= dt; if (w.wait <= 0) this.porterNext(w); continue; }
      const before = this.porterPos(w);
      if (w.a) {
        const len = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
        if (len < 1e-8) { this.porterNext(w); continue; }
        if (w.cart) { const angle = this.porterHeading(w, w.b[0] - w.a[0], w.b[1] - w.a[1]); this.turn(w, angle, dt); if (Math.abs(Math.atan2(Math.sin(angle - w.head), Math.cos(angle - w.head))) > 0.12) continue; }
        w.ft = Math.min(1, w.ft + w.speed * dt / len); w.phase += dt * 9;
        const end = this.porterPos(w); if (!w.cart) this.turn(w, Math.atan2(end.wy - before.wy, end.wx - before.wx), dt);
        this.rollCart(w, before, end, 0.23);
        if (w.ft >= 1) this.porterNext(w); continue;
      }
      const q = this.walkerWorld(w);
      if (w.cart) { const A = this.roadPoint(w.from, true), B = this.roadPoint(w.to, true), angle = this.porterHeading(w, B[0] - A[0], B[1] - A[1]); this.turn(w, angle, dt); if (Math.abs(Math.atan2(Math.sin(angle - w.head), Math.cos(angle - w.head))) > 0.12) continue; }
      if (!this.gatePassageClear(q,this.walkerWorld({...w,t:Math.min(1,w.t+w.speed*dt/q.len)}))) continue;
      if (!w.cart && this.trafficClear && !this.trafficClear(w, q, this.walkerWorld({ ...w, t: Math.min(1, w.t + w.speed * dt / q.len) }), dt)) {
        const yielded = this.walkerWorld(w), distance = Math.hypot(yielded.wx - q.wx, yielded.wy - q.wy);
        if (distance > 1e-7) { w.head = Math.atan2(yielded.wy - q.wy, yielded.wx - q.wx); w.phase += distance * 24; w.moving = true; }
        continue;
      }
      w.t = Math.min(1, w.t + w.speed * dt / q.len); w.phase += dt * 9;
      const end = this.porterPos(w); if (!w.cart) this.turn(w, Math.atan2(end.wy - before.wy, end.wx - before.wx), dt); this.rollCart(w, before, end, 0.23);
      if (w.t >= 1) {
        w.bx = end.wx; w.by = end.wy; w.t = 0; w.pi++;
        if (w.pi >= w.path.length) { this.porterNext(w); continue; }
        w.from = w.path[w.pi - 1]; w.to = w.path[w.pi]; w.off = this.porterOff(w.from, w.to, w.cart);
      }
    }
  },
  /* Zustandswechsel: am Steg zum Stapel, aufnehmen, zurück zum Weg, ins Lager, dort ablegen */
  porterNext(w) {
    const d = w.dock, dockNode = HK.ROAD_NODES[this.PORTER_DOCK[d.i]], node = [dockNode[0] - (w.cart ? 0.1 : 0), dockNode[1]];
    if (w.state === 'go') {
      const slot = [...d.slots].reverse().find(s => s.items.length && s.items.every(p=>p.direction!=='out') && !s.reserved && !s.claimedBy);
      if (!slot) { this.porters.splice(this.porters.indexOf(w), 1); return; }
      slot.claimedBy = w; w.slot = slot; w.state = 'approach'; w.a = [node[0], node[1]]; w.b = [node[0], slot.y - (w.cart ? .16 : 0)]; w.ft = 0;
    } else if (w.state === 'approach') {
      if (w.cart) { w.state = 'lift'; w.wait = 0.7; return; }
      w.state = 'fetch'; w.a = [...w.b]; w.b = [w.slot.x + (w.cart ? 0.55 : 0.42), w.slot.y]; w.ft = 0;
    } else if (w.state === 'fetch') {
      w.state = 'lift'; w.wait = 0.7;
    } else if (w.state === 'lift') {
      const slot = w.slot;
      if (slot?.reserved) { w.wait = 0.2; return; }
      if (slot && slot.items.length && w.items.length < w.cap) {
        w.items.push(slot.items.pop());
        if (w.items.length < w.cap && slot.items.length) { w.wait = 0.55; return; }
      }
      if (slot) slot.claimedBy = null;
      if (!w.items.length) { this.porters.splice(this.porters.indexOf(w), 1); return; }
      w.state = 'clear'; w.a = [...w.b]; w.b = [node[0], w.b[1]]; w.ft = 0;
    } else if (w.state === 'clear') {
      w.state = 'back'; w.a = [...w.b]; w.b = [node[0], node[1]]; w.ft = 0;
    } else if (w.state === 'back') {
      const path = this.route(this.PORTER_DOCK[d.i], this.PORTER_HOME[d.i]);
      w.a = null; w.b = null; w.state = 'carry'; w.path = path; w.pi = 1; w.t = 0;
      w.from = path[0]; w.to = path[1]; w.off = this.porterOff(w.from, w.to, w.cart); w.bx = node[0]; w.by = node[1];
    } else if (w.state === 'carry') {
      w.state = 'drop'; w.wait = 0.8;
    } else {
      if (w.state === 'drop') { d.delivered.push(...w.items); w.items.length = 0; }
      if (this.dockItems(d)) {
        const path = this.route(this.PORTER_HOME[d.i], this.PORTER_DOCK[d.i]);
        w.state = 'go'; w.path = path; w.pi = 1; w.t = 0; w.from = path[0]; w.to = path[1]; w.off = this.porterOff(w.from, w.to, w.cart); w.bx = undefined;
      } else this.porters.splice(this.porters.indexOf(w), 1);
    }
  },
  /* Der leere Haken fährt vom letzten Stapel zum Schiff. Erst nach dem
     Anschlagen wird die Last gehoben, geschwenkt und am reservierten Platz abgesetzt. */
  craneState(d) {
    const u = d.u, slot = d.slot || this.dockSlotFor(d), sl = slot.th, sh = d.shipTh, landR = slot.R || d.R, shipR = d.shipR || d.R;
    const ease = f => { f = HK.clamp(f, 0, 1); return f * f * (3 - 2 * f); };
    if (!d.working) return { th: d.parkTh ?? sl, reach: d.parkR ?? landR, lift: 1, load: false };
    if (u < 0.13) { const f = ease(u / 0.13); return { th: (d.parkTh ?? sl) + (sh - (d.parkTh ?? sl)) * f, reach: (d.parkR ?? landR) + (shipR - (d.parkR ?? landR)) * f, lift: 1, load: false }; }
    if (u < 0.20) return { th: sh, reach: shipR, lift: 1 - ease((u - 0.13) / 0.07), load: false };
    if (u < 0.26) return { th: sh, reach: shipR, lift: 0, load: true };
    if (u < 0.40) return { th: sh, reach: shipR, lift: ease((u - 0.26) / 0.14), load: true };
    if (u < 0.55) { const f = ease((u - 0.40) / 0.15); return { th: sh + (sl - sh) * f, reach: shipR + (landR - shipR) * f, lift: 1, load: true }; }
    if (u < 0.67) return { th: sl, reach: landR, lift: 1 - ease((u - 0.55) / 0.12), load: true };
    if (u < 0.74) return { th: sl, reach: landR, lift: 0, load: false };
    if (u < 0.86) return { th: sl, reach: landR, lift: ease((u - 0.74) / 0.12), load: false };
    return { th: sl, reach: landR, lift: 1, load: false };
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
    const A = this.roadPoint(w.from, w.cart), B = this.roadPoint(w.to, w.cart);
    const dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy) || 1;
    let wx = A[0] + dx * w.t - dy / len * w.off, wy = A[1] + dy * w.t + dx / len * w.off;
    // Am Knoten vom zuletzt gelaufenen Punkt aus einblenden, damit der Seitenversatz nicht springt
    if (w.bx !== undefined && w.t < 0.18) { const k = w.t / 0.18; wx = w.bx + (wx - w.bx) * k; wy = w.by + (wy - w.by) * k; }
    return { wx, wy, wz: this.deckZ(wx, wy), len, dir: (dx - dy) >= 0 ? 1 : -1 };
  },
  walkerPos(w) { const q = this.walkerWorld(w); const s = I.p(q.wx, q.wy, q.wz); return { x: s[0], y: s[1], wx: q.wx, wy: q.wy, wz: q.wz, len: q.len, dir: q.dir }; },
  personFacing(w) {
    const A = HK.ROAD_NODES[w.from], B = HK.ROAD_NODES[w.to];
    const head = w.head ?? (w.a ? Math.atan2(w.b[1] - w.a[1], w.b[0] - w.a[0]) : A && B ? Math.atan2(B[1] - A[1], B[0] - A[0]) : 0);
    return Math.round(head / (Math.PI / 4)) * Math.PI / 4;
  },
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
    if (w.nightOwl) return 1;
    // Weniger Menschen gehen hinaus; die verbleibenden werden nicht durchsichtig.
    // Der persönliche Rang bleibt trotz Gangphase und Wetterwechsel unverändert.
    const rank = w.outdoorRank ??= (((w.phase || 0) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI);
    if (this.light() < .58 + rank * .12) return 0;
    const plague = HK.state?.town.events.some(e => e.type === 'plague');
    if (plague && w.type !== 'monk' && rank >= .3) return 0;
    if (this.weather === 'rain' && rank >= .55) return 0;
    if ((HK.state?.cityLife?.mood ?? 55) < 35 && rank >= .8) return 0;
    return 1;
  },
  initChickens() {
    this.chickens = [];
    for (let i = 0; i < 8; i++) {
      const cx = i < 3 ? 9.6 : i < 5 ? 17.0 : 26.6, cy = i < 3 ? -0.95 : i < 5 ? 9.7 : 9.2;
      this.chickens.push({ cx, cy, x: cx, y: cy, wait: Math.random() * 2, head: Math.random() * Math.PI * 2, phase: 0, moving: false });
    }
  },
  updateChickens(dt) {
    for (const ch of this.chickens) {
      ch.moving = false;
      if (ch.wait > 0) { ch.wait = Math.max(0, ch.wait - dt); continue; }
      if (!ch.target) {
        for (let tries = 0; tries < 16; tries++) {
          const a = Math.random() * Math.PI * 2, r = HK.rnd(0.12, 0.45), x = ch.cx + Math.cos(a) * r, y = ch.cy + Math.sin(a) * r;
          const free = Array.from({ length: 8 }, (_, i) => this.blockedAt(ch.x + (x - ch.x) * (i + 1) / 8, ch.y + (y - ch.y) * (i + 1) / 8)).every(v => !v);
          if (free && Math.hypot(x - ch.x, y - ch.y) > 0.08) { ch.target = [x, y]; break; }
        }
        if (!ch.target) { ch.wait = 0.6; continue; }
      }
      const dx = ch.target[0] - ch.x, dy = ch.target[1] - ch.y, angle = Math.atan2(dy, dx), distance = Math.hypot(dx, dy);
      this.turn(ch, angle, dt);
      if (Math.abs(Math.atan2(Math.sin(angle - ch.head), Math.cos(angle - ch.head))) > 0.12) continue;
      if (distance < 0.006) { ch.target = null; ch.wait = HK.rnd(0.5, 2); continue; }
      const step = Math.min(distance, dt * 0.13), x = ch.x + dx / distance * step, y = ch.y + dy / distance * step;
      if (this.blockedAt(x, y)) { ch.target = null; ch.wait = HK.rnd(0.5, 2); continue; }
      ch.x = x; ch.y = y; ch.head = angle; ch.phase += step * 55; ch.moving = true;
    }
  },

  gateOpening(sp) { return this.gateMotion?.[sp.cx+','+sp.cy]?.open || 0; },
  gateLocal(sp, q) {
    const x=q.wx-sp.cx,y=q.wy-sp.cy;
    return {u:x*sp.d[0]+y*sp.d[1],v:x*sp.s[0]+y*sp.s[1]};
  },
  updateGates(dt) {
    const people=(this.populationPositions?.()||[]).concat(this.walkers.map(w=>this.walkerWorld(w)))
      .concat(this.porters.map(w=>this.porterPos(w)))
      .concat(this.carts.map(c=>({wx:c.a[0]+(c.b[0]-c.a[0])*c.t,wy:c.a[1]+(c.b[1]-c.a[1])*c.t})));
    this.gateMotion ||= {};
    for(const g of HK.WALL.gates){
      const sp=this.gateSpec(g),key=sp.cx+','+sp.cy;
      const motion=this.gateMotion[key] ||= {open:0,hold:0};
      const near=people.some(q=>{const p=this.gateLocal(sp,q);return Math.abs(p.u)<2.8&&Math.abs(p.v)<sp.pw/2+.35;});
      if(near)motion.hold=2.5;else motion.hold=Math.max(0,motion.hold-dt);
      const target=near||motion.hold>0?1:0;
      motion.open=HK.clamp(motion.open+(target?1:-.45)*dt,0,1);
    }
  },
  gatePassageClear(before, next) {
    return HK.WALL.gates.every(g=>{
      const sp=this.gateSpec(g);if(this.gateOpening(sp)>=.98)return true;
      const a=this.gateLocal(sp,before),b=this.gateLocal(sp,next);
      // Wait outside the portal while the grille rises, from either direction.
      return Math.min(a.u,b.u)>.85||Math.max(a.u,b.u)<-.95||Math.min(Math.abs(a.v),Math.abs(b.v))>sp.pw/2+.3;
    });
  },
  gateHouseLayers(item, sp) {
    const open=this.gateOpening(sp);
    item.layers=[{...item},{r:'gate-grille:'+sp.cx+','+sp.cy,v:open,ap:I.p(sp.cx,sp.cy,0),
      k:item.k,box:item.box,pick:item.pick,f:c=>this.drawGateGrille(c,sp,open)}];
    return item;
  },

  update(dt) {
    this.time += dt;
    this.prepareTraffic?.();
    this.updateGates(dt);
    this.updateWallGuards(dt);
    const st = HK.state;
    if (st) { this.weatherDay = st.day; this.rollWeather(); }
    for (const w of this.walkers) {
      w.moving = false;
      if (w.pause > 0) { w.pause -= dt; continue; }
      const q = this.walkerWorld(w);
      const next = this.walkerWorld({ ...w, t: Math.min(1, w.t + w.speed * dt / q.len) });
      if (!this.gatePassageClear(q, next)) continue;
      if (this.trafficClear && !this.trafficClear(w, q, next, dt)) { const yielded = this.walkerWorld(w), distance = Math.hypot(yielded.wx - q.wx, yielded.wy - q.wy); if (distance > 1e-7) { w.head = Math.atan2(yielded.wy - q.wy, yielded.wx - q.wx); w.phase += distance * 24; w.moving = true; } continue; }
      w.t += w.speed * dt / q.len; w.phase += dt * 9; w.moving = true;
      const moved = this.walkerWorld(w); this.turn(w, Math.atan2(moved.wy - q.wy, moved.wx - q.wx), dt);
      if (w.t >= 1) { const prev = w.from, end = this.walkerWorld({ ...w, t: 1 }); w.bx = end.wx; w.by = end.wy; w.from = w.to; w.t = 0; const opts = HK.ROAD_ADJ[w.from].filter(n => n !== prev); w.to = HK.pick(opts.length ? opts : HK.ROAD_ADJ[w.from]); w.off = this.pickOff(w.from, w.to); if (Math.random() < 0.15) w.pause = HK.rnd(1, 4); }
    }
    for (const c of this.carts) {
      const len = Math.hypot(c.b[0] - c.a[0], c.b[1] - c.a[1]);
      const before = { wx: c.a[0] + (c.b[0] - c.a[0]) * c.t, wy: c.a[1] + (c.b[1] - c.a[1]) * c.t };
      const angle = Math.atan2((c.b[1] - c.a[1]) * c.dir, (c.b[0] - c.a[0]) * c.dir); this.turn(c, angle, dt);
      if (Math.abs(Math.atan2(Math.sin(angle - c.head), Math.cos(angle - c.head))) < 0.12) c.t = HK.clamp(c.t + c.dir * c.v * dt / len, 0, 1);
      this.rollCart(c, before, { wx: c.a[0] + (c.b[0] - c.a[0]) * c.t, wy: c.a[1] + (c.b[1] - c.a[1]) * c.t }, c.ox ? 0.22 : 0.23);
      if (c.route && c.t >= 1) {
        c.leg = (c.leg + 1) % c.route.length; c.a = c.route[c.leg]; c.b = c.route[(c.leg + 1) % c.route.length]; c.t = 0;
      } else if (!c.route) { if (c.t >= 1) c.dir = -1; if (c.t <= 0) c.dir = 1; }
      this.updateCartActor(c, dt);
    }
    this.updateChickens(dt);
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
        if (!a) a = this.shipAnim[s.id] = { x: HK.ARRIVE_POINT.x, y: HK.ARRIVE_POINT.y, tx: b.x, ty: b.y, heading: 0, head: 0, stage: 'entry', leaving: false, name: s.name, origin: s.origin };
        a.tx = b.x; a.ty = b.y;
        if (!a.stage) a.stage = 'entry';
        if (a.stage === 'entry') {
          if (this.moveShip(a, HK.ARRIVE_POINT.x, HK.SEA_LANE_Y, 1.1, dt)) a.stage = 'approach';
        } else if (a.stage === 'approach') {
          if (this.moveShip(a, b.x, HK.SEA_LANE_Y, 1.1, dt)) a.stage = 'turn';
        } else if (a.stage === 'turn') {
          this.turn(a, HK.BERTH_HEADING, dt);
          a.heading = a.head;
          if (Math.abs(Math.atan2(Math.sin(a.heading - HK.BERTH_HEADING), Math.cos(a.heading - HK.BERTH_HEADING))) < 0.02) {
            a.heading = a.head = HK.BERTH_HEADING; a.stage = 'berth';
          }
        } else if (a.stage === 'berth') {
          // Back into the berth with the bow facing the sea. Turning beside a
          // pier would sweep the hull through its wooden deck.
          if (this.moveShip(a, b.x, b.y, 0.65, dt, HK.BERTH_HEADING)) a.stage = 'moored';
        }
      });
      for (const id in this.shipAnim) {
        const a = this.shipAnim[id];
        if (!st.ships.some(s => String(s.id) === id)) {
          if (!a.leaving) { a.leaving = true; a.stage = 'out'; }
          if (a.stage === 'out' && this.moveShip(a, a.x, HK.SEA_LANE_Y, 0.9, dt, HK.BERTH_HEADING)) a.stage = 'leave';
          if (a.stage === 'leave' && this.moveShip(a, HK.LEAVE_POINT.x, HK.LEAVE_POINT.y, 0.9, dt)) delete this.shipAnim[id];
        }
      }
      // Die Liste der Schornsteine ändert sich höchstens, wenn gebaut wird — einmal je Sekunde genügt
      let chimneys = this._chim;
      if (!chimneys || this.time - this._chimT > 1) {
        chimneys = this._chim = []; this._chimT = this.time;
        for (const b of HK.BUILDINGS) {
          if (this.SMOKY.has(b.kind) && !b.low) {
            const q = this.houseChimneys(b).at(-1), wx = q.x + q.w / 2, wy = q.y + q.w / 2;
            const point = I.p(wx, wy, q.z + q.h);
            const emitter = { x: point[0], y: point[1], wx, wy, k: b.x + b.w + b.y + b.d + 0.05 };
            chimneys.push(emitter);
            if (b.panel === 'venture' && st.ventures?.[b.id]) chimneys.push(emitter, emitter);
          }
        if (b.kind === 'plot' && st.workshops[b.plot].type && !st.workshops[b.plot].idle) {
          const q = this.houseChimneys(b).at(-1), wx = q.x + q.w / 2, wy = q.y + q.w / 2, point = I.p(wx, wy, q.z + q.h);
            chimneys.push({ x: point[0], y: point[1], wx, wy, k: b.x + b.w + b.y + b.d + 0.05 });
          }
        }
      }
      if (chimneys.length && Math.random() < dt * 5) { const c = HK.pick(chimneys); this.smoke.push({ ...c, age: 0, vx: HK.rnd(-3, 3) + (this.weather === 'rain' ? -6 : 0) }); }
      this.smoke = this.smoke.filter(s => (s.age += dt) < 4.5);
      for (const s of this.smoke) { s.y -= 9 * dt; s.x += s.vx * dt; }
    }
  },
  moveShip(a, x, y, speed, dt, heading) {
    const dx = x - a.x, dy = y - a.y, distance = Math.hypot(dx, dy);
    if (distance < 0.005) { a.x = x; a.y = y; return true; }
    const step = Math.min(distance, speed * dt);
    a.x += dx / distance * step; a.y += dy / distance * step;
    this.turn(a, heading ?? Math.atan2(dy, dx), dt); a.heading = a.head;
    return step === distance;
  },
  shipFootprint(x, y, heading, scale) {
    const c = Math.cos(heading), s = Math.sin(heading), profile = this.SHIP_PROFILE;
    return profile.concat(profile.slice().reverse().map(([u, v]) => [u, -v]))
      .map(([u, v]) => [x + scale * (u * c - v * s), y + scale * (u * s + v * c)]);
  },
  shipBox(x, y, heading, scale) {
    const hull = this.shipFootprint(x, y, heading, scale);
    return [Math.min(...hull.map(p => p[0])), Math.min(...hull.map(p => p[1])), Math.max(...hull.map(p => p[0])), Math.max(...hull.map(p => p[1]))];
  },
  snapShips() { this.shipAnim = {}; this.porters.length = 0; if (this._docks) for (const d of this._docks) { d.u = 0; d.working = false; d.load = null; d.slot = null; d.lastDrop = null; d.dropped = -1; d.pending = []; d.seenShips.clear(); d.delivered = []; d.cancelled = []; d.parkTh = d.slots[0].th; d.parkR = d.slots[0].R; for (const s of d.slots) { s.items.length = 0; s.reserved = null; s.claimedBy = null; } }
    if (!HK.state) return; HK.state.ships.forEach((s, i) => { const b = HK.BERTHS[s.berth != null ? s.berth : i] || HK.BERTHS[i]; this.shipAnim[s.id] = { x: b.x, y: b.y, tx: b.x, ty: b.y, heading: HK.BERTH_HEADING, head: HK.BERTH_HEADING, stage: 'moored', leaving: false, name: s.name, origin: s.origin }; }); },
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
  shipHull(x, y, h, s) { const c = Math.cos(h), sn = Math.sin(h), pts = []; for (const [u, v] of [[-1.15, -0.4], [1.2, -0.4], [1.2, 0.4], [-1.15, 0.4]]) for (const z of [0, 2.7]) pts.push(I.p(x + (u * c - v * sn) * s, y + (u * sn + v * c) * s, this.WATER_Z + z * s)); return I.hull(pts); },

  /* Tiefenschlüssel für Punktobjekte: vor einer Gebäudefront stehende Personen kommen vor das Gebäude */
  pointKey(px, py) {
    // Eindeutige Beziehungen zu Gebäuden ordnet depthSort über die Grundrisse.
    // Ein großzügiger "vor der Fassade"-Bonus zieht Figuren hinter einer Ecke
    // fälschlich vor das Dach des Nachbarhauses.
    return px + py + 0.1;
  },
  cartItems(items, p, vehicle, t, alpha = 1, porter = false) {
    const layout = this.barrowLayout(p.wx, p.wy, vehicle.head ?? 0, { ox: !porter && vehicle.ox, loading: porter && vehicle.state === 'lift', actorPos: vehicle.actorPos, actorHead: vehicle.pushing ? vehicle.head + Math.PI : vehicle.actorHead });
    for (const part of ['body', 'actor']) {
      const box = part === 'body' ? layout.bodyBox : layout.actorBox;
      const k = part === 'body' ? this.pointKey(p.wx, p.wy) : this.pointKey(...layout.actor);
      items.push({ cartPart: part, vehicle, k, box, pick: porter ? this.freightPick?.(vehicle) : null, f: c => {
        c.save(); c.globalAlpha = alpha;
        if (porter) this.drawPortCart(c, p.wx, p.wy, p.wz, vehicle, t, part);
        else this.drawCart(c, p.wx, p.wy, vehicle, t, part);
        c.restore();
      } });
    }
  },
  /* Alle sortierten Objekte; f(ctx) zeichnet, pick beschreibt das Trefferobjekt */
  churchAisle() { const cb = HK.state?.churchBuild; return !!(cb?.done.aisle || cb?.active?.id === 'aisle'); },
  buildingBox(b) { return [b.x, b.y, b.x + b.w, b.y + b.d + (b.kind === 'church' && this.churchAisle() ? 0.5 : 0)]; },
  staticNpcPos(n) { return n.person === 'priest' && this.churchAisle() ? { ...n, y: 5.0 } : n; },
  buildingHeight(b) {
    if (b.kind === 'church') {
      const cb = HK.state?.churchBuild, progress = HK.state && HK.churchBuildProgress ? HK.churchBuildProgress(HK.state) : 0;
      const tower = 4.6 + 1.6 * (cb?.done.tower ? 1 : cb?.active?.id === 'tower' ? progress : 0);
      return tower + (cb?.active?.id === 'tower' ? 0.3 : 1.9 + (cb?.done.tower ? 0.9 : 0) + 14 / I.ZS);
    }
    if (b.kind === 'townhall') return b.h + 0.7 + 2.4;
    return Math.max(b.h + Math.min(b.w, b.d) * 0.7 + 0.2, ...this.houseChimneys(b).map(q => q.z + q.h));
  },
  /* Gebäude und Requisiten stehen an ihrem Platz; ob sie sich trotzdem regen (schwingender Aufzugskorb,
     Dampf, Schmiedefeuer, schwankende Bäume, wehende Wimpel), stellt der Renderer selbst fest, indem er
     beim Ablegen der Geometrie beobachtet, wer die Uhr liest. Darum darf hier alles einen Schlüssel haben. */
  RUHT() { return true; },
  buildItems(ctx, st, season, t, view) {
    const items = [], sv = this.shadowVec();
    // Grobstufe von Sonnenstand und Zeit: sie gehen in den Aussehens-Schlüssel ein, wo ein bewegtes
    // Objekt Schatten oder Eigenbewegung mitzeichnet. Ohne sie bliebe eine gepufferte Geometrie stehen.
    const svk = Math.round(sv.v[0] * 12) + ',' + Math.round(sv.v[1] * 12) + ',' + Math.round(sv.a * 40);
    const phase = value => Math.floor(((value % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI) * 16) * (2 * Math.PI) / 16;
    const phaseKey = value => Math.round(value / (2 * Math.PI) * 16);
    const tk = n => Math.floor(t * 15) % n;   // 15 Stufen je Sekunde: fein genug fürs Auge, grob genug für den Puffer
    for (const b of HK.BUILDINGS) {
      if (b.kind === 'water' || b.kind === 'market') continue;
      const pick = b.panel ? { kind: 'building', building: b, panel: b.panel, label: HK.buildingLabel ? HK.buildingLabel(st, b) : HK.name(b) } : null;
      if (b.kind === 'gate') {
        const sp = this.gateSpec(HK.WALL.gates.find(g => g.haus === 'gebaeude'));
        for (const p of this.gateParts(sp)) {
          const item={ c: 'b' + b.id + ':' + p.part, k: p.flat ? 0 : p.k, box: p.flat ? null : p.box, f: c => this.drawGatehouse(c, sp, sv, p.part), pick };
          items.push(p.part==='house'?this.gateHouseLayers(item,sp):item);
        }
      } else {
        const box = this.buildingBox(b), extras = this.buildingExtras?.(b) || [];
        items.push({ c: 'b' + b.id, v: this.houseLightKey(b)+(b.kind==='yard'?'|'+(st.operations?.orders||[]).map(o=>o.id+':'+o.type+':'+HK.shipBuildProgress(st,o).phase).join(','):''), k: box[2] + box[3], box, f: c => this.drawBuilding(c, b, st, season, sv, extras.length > 0), pick });
        for (const extra of extras) {
          const a = extra.box;
          items.push({ c: 'extra:' + b.id + ':' + extra.part, k: a ? (a[0] + a[2]) / 2 + a[3] + .1 : 0, box: a, f: extra.f, pick: a ? pick : null });
        }
      }
    }
    const m = HK.BUILDING.market; items.push({ k: 0, f: c => { if (this.picking) I.poly(c, [[m.x, m.y, 0], [m.x + m.w, m.y, 0], [m.x + m.w, m.y + m.d, 0], [m.x, m.y + m.d, 0]], '#000'); }, pick: { kind: 'building', building: m, panel: 'market', label: HK.name(m) } });
    this.wallSegments().forEach((seg, i) => {
      const item = { c: 'w' + i, k: seg.k, box: seg.box, f: c => seg.f(c, sv) };
      if (seg.gateHouse) this.gateHouseLayers(item,seg.gateHouse);
      if (seg.guardRange) {
        // Die Mauer wird als Ganzes einsortiert. Ihre feste hintere und vordere
        // Grafik umschließen separat bewegte Wachen auf Wehrganghöhe.
        const layers = [{ ...item, c: item.c + ':rear', wallPart: 'rear', f: c => seg.f(c, sv, 'rear') }];
        const { segment, u0, u1 } = seg.guardRange;
        for (const guard of this.wallGuards || []) {
          if (guard.p.seg !== segment || guard.u < u0 || guard.u >= u1) continue;
          const q = this.wallGuardPos(guard), ap = I.p(q.x, q.y, HK.WALL.h + .02);
          const ph = guard.wait > 0 ? 0 : Math.floor(((guard.phase % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI) * 8) * Math.PI / 4;
          layers.push({ k: seg.k, box: seg.box, wallPart: 'guard', guard, ap, s: 'wg|' + q.facing + '|' + phaseKey(ph),
            f: c => this.drawPerson(c, ...ap, '#435479', 'guard', 1, false, '#dcc3aa', ph, q.facing, null, null, .85) });
        }
        layers.push({ ...item, c: item.c + ':front', wallPart: 'front', f: c => seg.f(c, sv, 'front') });
        item.layers = layers;
      }
      items.push(item);
    });
    HK.TREES.forEach(([x, y, r], i) => {
      const box = [x - .12, y - .12, x + .12, y + .12], k = x + y + r;
      if (!this.drawTreeCrown) { items.push({ c: 't' + i, k, box, f: c => this.drawTree(c, x, y, r, season, sv) }); return; }
      // Stamm und Schatten ruhen. Die einmal gezeichnete Krone bewegt sich
      // als Ganzes um die Astgabel, auch in der nächtlichen Verdeckung.
      const angle = this.picking ? 0 : this.treeMotion(x, y, r, t);
      items.push({ c: 't' + i, v: svk, k, box, f: c => this.drawTreeBody(c, x, y, r, season, sv) });
      items.push({ r: 'tree-crown:' + i, v: season, ap: this.treePivot(x, y, r), angle, k: k + .01, box, depthFixed: true,
        viewBox: [x - r, y - r, x + r, y + r], f: c => this.drawTreeCrown(c, x, y, r, season, this.picking ? angle : 0) });
    });
    HK.PROPS.forEach((p, i) => { if (p.t === 'stalls') return; const b = this.propBox(p); items.push({ c: 'p' + i, k: (b[0] + b[2]) / 2 + b[3] + 0.1, box: b, f: c => this.drawProp(c, p, st, sv) }); });
    this.marketStalls(HK.BUILDING.market).forEach((sd, i) => items.push({ c: 'ms' + i, v: this.marketStallKey?.(i) || '', k: sd.x + 0.55 + sd.y + 0.35, box: [sd.x, sd.y, sd.x + 0.55, sd.y + 0.4], f: c => this.drawStall(c, sd, i, st) }));
    this.marketSacks(HK.BUILDING.market).forEach((sk, i) => (st.town.stock[i % 2 ? 'wool' : 'grain'] || 0)>0 && items.push({ c: 'mk' + i, k: sk[0] + sk[1], box: [sk[0] - 0.14, sk[1] - 0.14, sk[0] + 0.14, sk[1] + 0.14], f: c => this.drawCargo(c, sk[0], sk[1], 0, { good: i % 2 ? 'wool' : 'grain', kind: 'sack' }) }));
    items.push({ c: 'mole', k: 0, viewBox: [HK.MOLE.x-.28, HK.MOLE.y0, HK.MOLE.x+HK.MOLE.w+.28, HK.MOLE.y1], f: c => this.drawMole(c, sv) });
    { const L=HK.LIGHTHOUSE;items.push({c:'lighthouse',k:L.x+L.y,box:[L.x-L.r,L.y-L.r,L.x+L.r,L.y+L.r],f:c=>this.drawLighthouse(c)}); }
    items.push({ c: 'islet', k: HK.ISLET.x + HK.ISLET.y, box: [HK.ISLET.x - 1.5, HK.ISLET.y - 1.5, HK.ISLET.x + 1.5, HK.ISLET.y + 1.5], f: c => this.drawIslet(c, season, sv) });
    { const w = this.guardShip();
      items.push({ r: 'watchship', v: Math.floor(t * 10), ap: I.p(w.x, w.y, 0), k: w.x + w.y + 0.6, box: this.shipBox(w.x, w.y, w.heading, 1.15), f: c => this.drawShip(c, w.x, w.y, w.heading, 1.15, 'guard', false, false), pick: { kind: 'building', building: HK.BUILDING.arsenal, panel: 'arsenal', label: HK.t('watchShip') } }); }
    items.push({ c: 'windmill-shadow', v: svk, k: 0, f: c => this.drawWindmillShadow(c, sv) });
    items.push({ c: 'windmill-body', k: HK.WINDMILL.x + HK.WINDMILL.y + 1, box: this.windmillBox(), f: c => this.drawWindmillBody(c, sv) });
    items.push({ r: 'windmill-rotor', v: 0, ap: this.windmillHub(), angle: t * this.MILL_SPEED, k: HK.WINDMILL.x + HK.WINDMILL.y + 1.01, box: this.windmillBox(), f: c => this.drawWindmillRotor(c, this.picking ? t * this.MILL_SPEED : 0) });
    items.push({ c: 'farm', v: this.houseLightKey(HK.FARM), k: HK.FARM.x + HK.FARM.w + HK.FARM.y + HK.FARM.d, box: [HK.FARM.x, HK.FARM.y, HK.FARM.x + HK.FARM.w, HK.FARM.y + HK.FARM.d], f: c => this.withHouseLights(HK.FARM, () => this.drawFarm(c, season, sv)) });
    HK.HAMLET.forEach((f, i) => items.push({ c: 'ham' + i, v: this.houseLightKey(f), k: f.x + f.w + f.y + f.d, box: [f.x, f.y, f.x + f.w, f.y + f.d], f: c => this.withHouseLights(f, () => this.drawFarm(c, season, sv, f)) }));
    for (const d of this.docks()) {
      const h = (d.pier.w || 0.6) / 2;
      const craneKey = (d.working ? Math.floor(d.u * this.CRANE_CYCLE * 15) : 'idle') + '|' + d.direction + '|' + d.berth + '|' + (d.slot?.th ?? d.parkTh) + '|' + this.cargoKey(d.load ? [d.load] : []) + '|' + this.cargoKey((d.slot || this.dockSlotFor(d)).items);
      items.push({ r: 'crane:' + d.i, v: craneKey, ap: I.p(d.cx, d.cy, 0), k: d.cx + d.cy + 1.7, box: [d.cx - 0.68, d.cy - 0.56, d.cx + 0.68, d.cy + 0.56], viewBox: [d.cx - d.R, d.cy - d.R, d.cx + d.R, d.cy + d.R], f: c => this.drawTreadCrane(c, d, !!this.freightItems) });
      for (const sl of d.slots) if (sl.items.length) items.push({ s: 'sp|' + this.cargoKey(sl.items) + '|' + svk, ap: I.p(sl.x, sl.y, 0), k: sl.x + sl.y + 0.2, box: [sl.x - 0.3, sl.y - 0.2, sl.x + 0.3, sl.y + 0.36], f: c => this.drawStack(c, sl, sv) });
      items.push({ s: 'sk|' + d.pier.x + '|' + tk(60), ap: I.p(d.pier.x, d.pier.y1, 0), k: d.pier.x + h + d.pier.y1, box: [d.pier.x - h, d.pier.y1 - 0.3, d.pier.x + h, d.pier.y1], f: c => this.drawPierEnd(c, d.pier, t) });
    }
    for (const w of this.porters) {
      const p = this.porterPos(w), a = this.walkerAlpha(w); if (a <= 0.02) continue;
      const r = w.cart ? 0.4 : w.items.length ? 0.25 : 0.05;
      if (w.cart) this.cartItems(items, p, w, t, a, true);
      else { const sp = I.p(p.wx, p.wy, p.wz), ph = w.moving ? Math.floor(((w.phase % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI) * 8) * Math.PI / 4 : 0, face = this.personFacing(w, p); items.push({ porter: w, s: 'tr|' + w.color + '|' + w.skin + '|' + face + '|' + (phaseKey(ph)) + '|' + Math.round(a * 6) + '|' + this.cargoKey(w.items) + '|' + (w.hat ? 1 : 0), ap: sp, k: this.pointKey(p.wx, p.wy), pick: this.freightPick?.(w), box: [p.wx - r, p.wy - r, p.wx + r, p.wy + r], f: c => this.drawPerson(c, sp[0], sp[1], w.color, 'porter', a, false, w.skin, ph, p.dir, null, { ...w, head: face }) }); }
    }
    st.ownShips.forEach((sh, i) => { if (sh.status === 'port' && HK.OWN_BERTHS[i]) { const b = HK.OWN_BERTHS[sh.anchorIndex ?? i], cargo = HK.visibleCargo ? HK.visibleCargo(st, sh, 'own') : sh.cargo; items.push({ r: 'own:' + sh.id, v: Math.floor(t * 10) + '|' + sh.type + '|' + JSON.stringify(cargo), ap: I.p(b.x, b.y, 0), k: b.x + b.y + 0.5, box: this.shipBox(b.x, b.y, HK.BERTH_HEADING + 0.3, HK.SHIP_TYPE[sh.type]?.scale || 0.95), f: c => this.drawShip(c, b.x, b.y, HK.BERTH_HEADING + 0.3, HK.SHIP_TYPE[sh.type] ? HK.SHIP_TYPE[sh.type].scale : 0.95, 'own', true, false, cargo), pick: { kind: 'building', building: HK.BUILDING.harbour, panel: 'harbour', label: sh.name } }); } });
    st.rivals.forEach((r, i) => { if (!r.ships) return; const sp = HK.RIVAL_ANCHORAGE[i]; items.push({ r: 'rival:' + r.id, v: Math.floor(t * 10), ap: I.p(sp.x, sp.y, 0), k: sp.x + sp.y + 0.5, box: this.shipBox(sp.x, sp.y, sp.h, 0.9), f: c => this.drawShip(c, sp.x, sp.y, sp.h, 0.9, 'rival_' + r.id, true, false), pick: { kind: 'building', building: HK.BUILDING.harbour, panel: 'rivals', label: HK.rivalName(r.id) } }); });
    for (const id in this.shipAnim) { const a = this.shipAnim[id]; const sh = st.ships.find(x => String(x.id) === id), cargo = sh && HK.visibleCargo ? HK.visibleCargo(st, sh, 'visitor') : sh?.cargo; const fest = !a.leaving && Math.abs(a.x - a.tx) + Math.abs(a.y - a.ty) < 0.05, gewaehlt = HK.UI.selectedVisitor === Number(id) && !a.leaving; items.push({ r: 'visitor:' + id, v: Math.floor(t * 10) + '|' + JSON.stringify(cargo) + '|' + a.origin + '|' + (fest ? 1 : 0) + '|' + (gewaehlt ? 1 : 0), ap: I.p(a.x, a.y, 0), k: a.x + a.y + 0.6, box: this.shipBox(a.x, a.y, a.heading, HK.SHIP_SCALE), f: c => this.drawShip(c, a.x, a.y, a.heading, HK.SHIP_SCALE, a.origin, !a.leaving && Math.abs(a.x - a.tx) + Math.abs(a.y - a.ty) < 0.05, HK.UI.selectedVisitor === Number(id) && !a.leaving, cargo), pick: sh && !a.leaving ? { kind: 'visitor', id: sh.id, panel: 'harbour', label: sh.name + ' (' + HK.name(HK.ORIGIN[sh.origin]) + ')' } : null }); }
    this.fishingBoatItems(items, st, t);
    st.caravans.forEach((cv, i) => { const sp = HK.CARAVAN_SPOTS[cv.spotIndex ?? i]; items.push({ r: 'caravan:' + cv.id, v: (this.light() < 0.6 ? 'night' : 'day') + '|' + Math.floor(t * 8) + '|' + Object.entries(cv.cargo).map(([g, c]) => g + ':' + c.qty).join(','), ap: I.p(sp.x, sp.y, 0), k: sp.x + sp.y + 0.5, box: HK.caravanBox(sp), f: c => this.drawCaravan(c, sp.x, sp.y, Math.floor(t * 8) / 8, sv, { ...cv, cargo: HK.visibleCargo ? Object.fromEntries(Object.entries(HK.visibleCargo(st, cv, 'visitor')).map(([g, qty]) => [g, { qty }])) : cv.cargo }), pick: { kind: 'visitor', id: cv.id, panel: 'gate', label: HK.t('caravanFrom', { origin: HK.name(HK.ORIGIN[cv.origin]) }) } }); });
    for (const c0 of this.carts) { const wx = c0.a[0] + (c0.b[0] - c0.a[0]) * c0.t, wy = c0.a[1] + (c0.b[1] - c0.a[1]) * c0.t; this.cartItems(items, { wx, wy, wz: 0 }, c0, t); }
    for (const ch of this.chickens) {
      const sp = I.p(ch.x, ch.y, 0), ph = ch.moving ? phase(ch.phase) : 0, angle = Math.round(ch.head / (Math.PI * 2) * 32) * Math.PI * 2 / 32;
      const peck = !ch.moving && ch.wait > 0.1 && ch.wait < 0.35;
      items.push({ s: 'ch|' + angle + '|' + phaseKey(ph) + '|' + (ch.moving ? 1 : 0) + '|' + (peck ? 1 : 0), ap: sp, k: this.pointKey(ch.x, ch.y), box: [ch.x - 0.05, ch.y - 0.05, ch.x + 0.05, ch.y + 0.05], f: c => this.drawChicken(c, sp[0], sp[1], ph, angle, ch.moving, peck) });
    }
    for (const source of HK.STATIC_NPCS) {
      const n = this.namedNpcPose(source,t), pp = HK.PERSON[source.person], sp = I.p(n.x,n.y,0);
      const hov = !!(this.hover && this.hover.person === source.person);
      const activity = HK.NAMED_ACTIVITIES[n.action][HK.LANG === 'en' ? 1 : 0];
      items.push({ s: 'named|' + source.person + '|' + n.action + '|' + n.head + '|' + n.frame + '|' + +hov,
        namedPerson: source.person, ap: sp, k: this.pointKey(n.x,n.y), box: [n.x-.09,n.y-.09,n.x+.09,n.y+.09],
        f: c => this.drawPerson(c,...sp,source.color,'static',1,hov,null,n.phase,1,source.person,{head:n.head,gesture:n.gesture,working:!n.moving}),
        pick: {kind:'person',person:source.person,label:pp.name+', '+(pp.title[HK.LANG]||pp.title.de)+' · '+activity} });
    }
    // Fehde: der Ritter mit seinen Reitern lauert vor dem Landtor
    if (st && st.chains && st.chains.active.some(c => c.id === 'feud')) {
      const K = [[40.6, 14.0, -1, true], [41.3, 14.8, -1, false], [41.2, 13.2, -1, false], [42.1, 14.1, 1, false]];
      for (const [wx, wy, dir, mounted] of K) { const sp = I.p(wx, wy, 0), r = mounted ? 0.4 : 0.05; items.push({ citizenKey: 'feud:'+wx+','+wy, k: this.pointKey(wx, wy), box: [wx - r, wy - r, wx + r, wy + r], f: c => mounted ? this.drawHorseman(c, sp[0], sp[1], dir, '#754d30') : this.drawPerson(c, sp[0], sp[1], '#873737', 'guard', 1, false, '#d2aa91', this.time * 2, dir, null, null, 0.85) }); }
      if (!this.picking) { const fp = I.p(41.6, 14.4, 0); items.push({ k: this.pointKey(41.6, 14.4), box: [41.4, 14.2, 41.8, 14.6], f: c => { c.fillStyle = 'rgba(255,140,40,' + (0.5 + Math.sin(this.time * 7) * 0.2) + ')'; c.beginPath(); c.ellipse(fp[0], fp[1] - 4, 4, 6, 0, 0, 6.28); c.fill(); c.fillStyle = '#66503a'; c.beginPath(); c.ellipse(fp[0], fp[1], 6, 2.5, 0, 0, 6.28); c.fill(); } }); }
    }
    // Zunftaufstand: Handwerker mit Fackeln vor dem Rathaus
    if (st && st.unrestUntil > st.day) {
      for (let i = 0; i < 12; i++) { const wx = 12.35 + ((i * 37) % 13) / 10, wy = 8.55 + ((i * 53) % 11) / 10, sp = I.p(wx, wy, 0); items.push({ citizenKey: 'unrest:'+i, k: this.pointKey(wx, wy), box: [wx - 0.05, wy - 0.05, wx + 0.05, wy + 0.05], f: c => this.drawPerson(c, sp[0], sp[1], ['#84623f', '#627350', '#906e3c', '#735073'][i % 4], 'torch', 1, false, '#d2aa91', this.time * 2 + i, i % 2 ? 1 : -1, null, null, 0.85) }); }
    }
    if (this.procession) {
      const P = this.procession, segs = P.route.length - 1;
      for (let i = 0; i < P.n; i++) {
        let u = P.t - i * 0.055; if (u < 0) continue; u = u % segs; const k = Math.floor(u), f = u - k;
        const A = HK.ROAD_NODES[P.route[k]], B = HK.ROAD_NODES[P.route[k + 1]]; const wx = A[0] + (B[0] - A[0]) * f + (i % 2 ? 0.16 : -0.16), wy = A[1] + (B[1] - A[1]) * f + (i % 2 ? -0.16 : 0.16);
        const sp = I.p(wx, wy, 0), dir = ((B[0] - A[0]) - (B[1] - A[1])) >= 0 ? 1 : -1, col = i === 0 ? '#bfa361' : i % 3 === 1 ? '#8b3939' : '#e8e0d0';
        items.push({ citizenKey: 'procession:'+i, k: this.pointKey(wx, wy), box: [wx - 0.05, wy - 0.05, wx + 0.05, wy + 0.05], f: c => { this.drawPerson(c, sp[0], sp[1], col, 'monk', 1, false, '#dcc3aa', this.time * 5 + i, dir, null, null, 0.85); if (!this.picking && i === 0) { c.strokeStyle = '#bfa361'; c.lineWidth = 2; c.beginPath(); c.moveTo(sp[0], sp[1] - 26); c.lineTo(sp[0], sp[1] - 44); c.moveTo(sp[0] - 4, sp[1] - 40); c.lineTo(sp[0] + 4, sp[1] - 40); c.stroke(); } } });
      }
    }
    for (const w of this.walkers) {
      const a = this.walkerAlpha(w); if (a <= 0.02) continue;
      const p = this.walkerPos(w), ph = w.pause > 0 || w.moving === false ? 0 : Math.floor(((w.phase % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI) * 8) * Math.PI / 4, hov = !!(this.hover && this.hover.walker === w), face = this.personFacing(w, p);
      items.push({ s: 'w|' + w.type + '|' + w.color + '|' + w.skin + '|' + (w.hat ? 1 : 0) + (w.basket ? 1 : 0) + '|' + face + '|' + (phaseKey(ph)) + '|' + Math.round(a * 6) + '|' + (hov ? 1 : 0), ap: [p.x, p.y],
        k: this.pointKey(p.wx, p.wy), box: [p.wx - 0.05, p.wy - 0.05, p.wx + 0.05, p.wy + 0.05], f: c => this.drawPerson(c, p.x, p.y, w.color, w.type, a, hov, w.skin, ph, p.dir, null, { ...w, head: face }), pick: a >= 0.4 ? { kind: 'walker', walker: w, label: HK.t('enc_' + w.type + '_label') } : null });
    }
    if (!this.picking) for (const s of this.smoke) items.push({
      k: s.k, box: [s.wx - 0.03, s.wy - 0.03, s.wx + 0.03, s.wy + 0.03],
      f: c => { c.fillStyle = `rgba(215,215,220,${0.32 * (1 - s.age / 4.5)})`; c.beginPath(); c.arc(s.x, s.y, 1.5 + s.age * 2, 0, 2 * Math.PI); c.fill(); },
    });
    this.freightItems?.(items, t);
    this.cityItems?.(items, st, season, t);
    // Unsichtbare Objekte können keine sichtbaren Flächen verdecken. Vor der
    // paarweisen Tiefensortierung aussieben; der Pick-Kanal prüft weiterhin alles.
    this.addRuralItems?.(items,ctx,st,season,t);
    this.populationItems?.(items,st,t);
    return this.depthSort(view ? items.filter(it => !(it.viewBox || it.box) || this.inView(it.viewBox || it.box, view)) : items).flatMap(it => it.layers || [it]);
  },
  /* Gemessene Grundrisse der Requisiten als Abstand von ihrem Bezugspunkt: [x0, y0, x1, y1].
     Die meisten werden von der Ecke aus gezeichnet, nicht mittig, darum reicht keine bloße Größe. */
  PROP_BOX: { crates: [-0.02, -0.02, 0.52, 0.29], barrels: [-0.19, -0.23, 0.38, 0.35], crane: [-0.68, -0.56, 0.68, 0.56], well: [-0.32, -0.3, 0.3, 0.32], statue: [-0.26, -0.26, 0.26, 0.28], pillory: [-0.31, -0.27, 0.23, 0.27], nets: [-0.33, -0.02, 0.29, 0.6], laundry: [-0.04, -0.03, 1.18, 0.14], kiln: [-0.3, -0.3, 0.7, 0.3], frames: [-0.42, -0.06, 0.14, 1.04], dyecloths: [-0.45, -0.02, 0.16, 1.14], gallows: [-0.35, -0.33, 0.33, 0.35], tollbar: [-0.23, -0.88, 0.2, 0.6], logs: [-0.04, -0.04, 0.9, 0.5], shrine: [-0.24, -0.22, 0.22, 0.24], boatup: [-0.17, -0.16, 1.05, 0.36], fishracks: [-0.04, -0.12, 0.98, 0.14], cross: [-0.16, -0.14, 0.12, 0.14], ropes: [-0.04, -0.16, 2.3, 0.3], sails: [-0.04, -0.12, 0.98, 0.14] },
  cargoKey(items) { return (items || []).map(it => it.good + ':' + it.kind).join(','); },
  propBox(p) { const b = this.PROP_BOX[p.t] || [-0.25, -0.25, 0.25, 0.25]; return [p.x + b[0], p.y + b[1], p.x + b[2], p.y + b[3]]; },
  /* Tiefensortierung als Malerreihenfolge: Grundrisse, die sich entlang einer Achse nicht überlappen, legen die Reihenfolge fest
     (der Betrachter steht bei +x,+y); nur bei überlappenden Grundrissen entscheidet der Schlüssel k. */
  depthSort(items) {
    const e = 0.02, flat = [], solid = [];
    for (const it of items) (it.box ? solid : flat).push(it);
    flat.sort((a, b) => a.k - b.k); solid.sort((a, b) => a.k - b.k);
    const m = solid.length, behind = new Array(m);
    for (let i = 0; i < m; i++) behind[i] = [];
    const fixed = [], moving = [];
    for (let i = 0; i < m; i++) (solid[i].c || solid[i].depthFixed ? fixed : moving).push(i);
    const relation = (A, B) => {
      const sx = A[2] <= B[0] + e ? -1 : B[2] <= A[0] + e ? 1 : 0;
      const sy = A[3] <= B[1] + e ? -1 : B[3] <= A[1] + e ? 1 : 0;
      return sx && sy && sx !== sy ? 0 : sx || sy;
    };
    const connect = (i, j, direction) => { if (direction < 0) behind[j].push(i); else if (direction > 0) behind[i].push(j); };
    const signature = fixed.map(i => (solid[i].c || solid[i].r) + ':' + solid[i].box.join(',')).join('|');
    const cache = this._depthRelations ||= new Map();
    let pairs = cache.get(signature);
    if (!pairs) {
      pairs = [];
      for (let a = 0; a < fixed.length; a++) for (let b = a + 1; b < fixed.length; b++) {
        const direction = relation(solid[fixed[a]].box, solid[fixed[b]].box);
        if (direction) pairs.push([a, b, direction]);
      }
      // Keep only the necessary static constraints. If A precedes B and B
      // precedes C, re-adding A -> C in every frame buys no extra correctness.
      const parents = Array.from({ length: fixed.length }, () => []), children = parents.map(() => []);
      for (const [a, b, direction] of pairs) { const p = direction < 0 ? a : b, c = direction < 0 ? b : a; parents[c].push(p); children[p].push(c); }
      const degree = parents.map(p => p.length), queue = degree.flatMap((n, i) => n ? [] : [i]), order = [];
      for (let q = 0; q < queue.length; q++) { const p = queue[q]; order.push(p); for (const c of children[p]) if (--degree[c] === 0) queue.push(c); }
      if (order.length === fixed.length) {
        const rank = new Int32Array(fixed.length); order.forEach((n, i) => { rank[n] = i; });
        const ancestors = order.map(() => new Uint8Array(fixed.length)), reduced = [];
        for (const c of order) for (const p of parents[c].sort((a, b) => rank[b] - rank[a])) {
          if (ancestors[c][p]) continue;
          reduced.push([p, c, -1]); ancestors[c][p] = 1;
          for (let k = 0; k < fixed.length; k++) if (ancestors[p][k]) ancestors[c][k] = 1;
        }
        pairs = reduced;
      }
      cache.set(signature, pairs);
      if (cache.size > 4) cache.delete(cache.keys().next().value);
    }
    for (const [a, b, direction] of pairs) connect(fixed[a], fixed[b], direction);
    for (let a = 0; a < moving.length; a++) {
      const i = moving[a];
      for (const j of fixed) connect(i, j, relation(solid[i].box, solid[j].box));
      for (let b = a + 1; b < moving.length; b++) { const j = moving[b]; connect(i, j, relation(solid[i].box, solid[j].box)); }
    }
    // Preserve the original deterministic traversal when moving objects interleave.
    for (const parents of behind) parents.sort((a, b) => a - b);
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
    for (const it of items) { if (it.box && !this.inView(it.viewBox || it.box, vr)) continue; const id = it.pick ? this.pickTable.length : 0; if (it.pick) this.pickTable.push(it.pick); const code = id * 3; const col = id ? `rgb(255,${code & 255},${(code >> 8) & 255})` : '#000'; this.pickColor = col; real.fillStyle = col; real.strokeStyle = col; it.f(proxy); }
    real.restore();
    this.picking = false; this.lamps = savedL; this.pickTime = this.time;
  },

  /* Zeichenkontext, der jeden Füllbefehl zusätzlich als schwarze Silhouette in die Emissionsebene schreibt */
  /* Leuchtendes Fenster in die Emissionsebene schreiben (Weltkoordinaten) */
  emit(pts, col) { if (!this.em || !this.nightK || this.picking || this.emitOff) return; const em = this.em; em.save(); em.schwarz = false; em.fillStyle = col; em.beginPath(); pts.forEach((q, i) => { const p = I.p(q[0], q[1], q[2]); i ? em.lineTo(p[0], p[1]) : em.moveTo(p[0], p[1]); }); em.closePath(); em.fill(); em.restore(); },

  /* Dezente kühle Tiefenstaffelung. Wetter verstärkt sie leicht, ohne dunkle
     Oberflächen durch zusätzliches Streulicht aufzuhellen. */
  GRADE: { haze: '153,165,177', near: 0.003, far: 0.018 },
  hazeK() { return this.weather === 'rain' ? 2.3 : this.weather === 'snow' ? 1.9 : this.weather === 'cloudy' ? 1.5 : 1; },
  /* ---------- Zeichnen ----------
     Gezeichnet wird über die Grafikkarte (js/scene-pixi.js). Hier steht nur noch, was beide Seiten
     brauchen: Boden und Wasserflecken als Zwischenbilder, Küste, Wetter, Umriss und das Fensterlicht. */
  draw() { if (HK.PixiScene && HK.PixiScene.bereit) HK.PixiScene.draw(); },
  /* Die Vignette ändert sich nie: einmal anlegen, danach auflegen */
  outline(ctx, b, color, w) { const box = this.buildingBox(b), hull = I.boxHull(box[0] - 0.1, box[1] - 0.1, box[2] - box[0] + 0.2, box[3] - box[1] + 0.2, this.buildingHeight(b)); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.setLineDash([5, 4]); ctx.beginPath(); hull.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]); },

  /* Wasser über die ganze Fläche, Wellen und Glitzern */
  /* Tiefenflecken und Flachwassersaum hängen nicht vom Licht ab. Sie entstehen einmal und liegen
     danach als fertiges Bild über dem Farbverlauf, statt in jedem Bild aus 40 Verläufen neu zu wachsen. */
  waterOverlay() {
    if (this._waterOv) return this._waterOv;
    const W = HK.MAP.W, H = HK.MAP.H, c = document.createElement('canvas');
    c.width = Math.round(W * this.RS); c.height = Math.round(H * this.RS);
    const g = c.getContext('2d'); g.scale(this.RS, this.RS);
    for (let i = 0; i < 40; i++) { const x = (i * 173) % W, y = (i * 97 + 40) % H, r = 60 + (i % 5) * 30; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, i % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(0,10,30,0.14)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    for (const e of this.coastEdges()) { const [P0, P1, n] = e; I.poly(g, [[P0[0], P0[1], this.WATER_Z], [P1[0], P1[1], this.WATER_Z], [P1[0] + n[0] * 1.3, P1[1] + n[1] * 1.3, this.WATER_Z], [P0[0] + n[0] * 1.3, P0[1] + n[1] * 1.3, this.WATER_Z]], 'rgba(120,190,190,0.07)'); }
    // Tiefenflecken weich auslaufen lassen, statt sie am Texturrand abzuschneiden.
    g.globalCompositeOperation = 'destination-in';
    for (const [x0, y0, x1, y1] of [[0, 0, 64, 0], [W, 0, W - 64, 0], [0, 0, 0, 64], [0, H, 0, H - 64]]) {
      const fade = g.createLinearGradient(x0, y0, x1, y1);
      fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, '#000');
      g.fillStyle = fade; g.fillRect(0, 0, W, H);
    }
    g.globalCompositeOperation = 'source-over';
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
  // Land und Kaideck liegen bei z = 0; das Meer liegt eine Mauerhöhe darunter.
  get WATER_Z() { return -this.QUAI_H; },
  /* Kaikante und Mole reichen vom gemeinsamen Boden bei z = 0 hinunter zum Meer. */
  drawQuayWall(ctx, A, B, n, len, h = this.QUAI_H) {
    const stein = '#6e6d68';
    const dx = (B[0] - A[0]) / len, dy = (B[1] - A[1]) / len;
    const P = (s, z) => [A[0] + dx * s, A[1] + dy * s, z - h];
    const zuf = u => { const r = Math.sin(u * 12.9898) * 43758.5453; return r - Math.floor(r); };
    const keim = A[0] * 3.1 + A[1] * 7.7;

    // Beide Enden schließen bündig an den Boden an.
    I.poly(ctx, [P(0, 0), P(len, 0), P(len, h), P(0, h)], stein);

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
        const t = zuf(keim + s * 2.3 + li * 19.4);
        I.poly(ctx, [P(a, L.z0), P(b, L.z0), P(b, L.z1), P(a, L.z1)], I.shade(stein, L.licht + (t - 0.5) * 0.26));
        I.line(ctx, P(a + 0.04, L.z1 - 0.008), P(b - 0.04, L.z1 - 0.008), 'rgba(255,250,238,0.13)', 0.7);
        if (s > 0) fugen.push([P(a, L.z0 + 0.012), P(a, L.z1 - 0.012)]);
      }
      if (li) fugen.push([P(0, L.z0), P(len, L.z0)]);
    });
    I.lines(ctx, fugen, 'rgba(26,22,16,0.46)', 0.7);

    // Der Deckstein bleibt auch an Ecken vollständig auf Bodenhöhe.
    I.poly(ctx, [P(0, h - 0.085), P(len, h - 0.085), P(len, h), P(0, h)], '#9c9a92');
    I.line(ctx, P(0, h - 0.092), P(len, h - 0.092), 'rgba(22,18,12,0.5)', 1.2);

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
      if (t > 0.3) continue;
      spuren.push([P(s, h - 0.1), P(s + (t - 0.15) * 0.06, 0.12)]);
    }
    I.lines(ctx, spuren, 'rgba(44,44,36,0.13)', 1.4);

    /* Beiwerk des Hafens: eiserne Ringe zum Festmachen, hölzerne Poller auf der Krone und
       ab und zu eine Steigeisenleiter hinunter zum Wasser. */
    for (let s = 0.9; s < len - 0.4; s += 1.5) {
      const t = zuf(keim * 5.5 + s * 3.7);
      if (t < 0.12) {                              // Leiter
        const li = s - 0.06, re = s + 0.06, sprossen = [];
        for (let z = h - 0.1; z > 0.04; z -= 0.085) sprossen.push([P(li, z), P(re, z)]);
        I.lines(ctx, sprossen, 'rgba(46,38,30,0.7)', 1.2);
        I.lines(ctx, [[P(li, h - 0.1), P(li, 0.04)], [P(re, h - 0.1), P(re, 0.04)]], 'rgba(46,38,30,0.45)', 0.9);
      } else if (t < 0.55) {                       // Ring in der Wand
        const q = I.p(A[0] + dx * s, A[1] + dy * s, 0.4 - h);
        ctx.strokeStyle = 'rgba(48,40,32,0.65)'; ctx.lineWidth = 0.9;
        ctx.beginPath(); ctx.ellipse(q[0], q[1] + 1.8, 1.9, 1.5, 0, 0, 6.28); ctx.stroke();
        ctx.fillStyle = 'rgba(58,50,40,0.75)'; ctx.fillRect(q[0] - 0.7, q[1] - 0.6, 1.4, 1.6);
      }
    }
    // Poller stehen mit Waren und Personen auf der Kaifläche bei z = 0.
    for (let s = 1.3; s < len - 0.6; s += 3.1) {
      const t = zuf(keim * 7.3 + s * 4.1);
      if (t < 0.25) continue;
      const px = A[0] + dx * s - n[0] * 0.12, py = A[1] + dy * s - n[1] * 0.12;
      const fuss = I.p(px, py, 0);
      ctx.fillStyle = 'rgba(30,24,16,0.28)';        // kurzer Standschatten, damit er aufsitzt
      ctx.beginPath(); ctx.ellipse(fuss[0] + 1, fuss[1] + 0.6, 3.6, 1.9, 0, 0, 6.28); ctx.fill();
      I.cylinder(ctx, px, py, 0, 0.11, 0.3, '#6d5a43', { noTop: false });
    }
  },
  /* ---------- Natürliches Ufer ----------
     Wo keine Mauer steht, fällt das Land in einer niedrigen Böschung zum Wasser ab: heller Sand oben,
     feuchter und dunkler nach unten, dazwischen die waagerechten Linien, die das Wasser in den Sand
     gewaschen hat. Am Fuß liegen Steine unterschiedlicher Größe, oben am Rand steht Gras. */
  drawBank(ctx, A, B, n, len, vis, season) {
    const h = -this.WATER_Z;
    const dx = (B[0] - A[0]) / len, dy = (B[1] - A[1]) / len;
    const P = (s, z) => [A[0] + dx * s, A[1] + dy * s, z - h];
    const W = (s, a) => [A[0] + dx * s + n[0] * a, A[1] + dy * s + n[1] * a, this.WATER_Z];
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
      I.poly(ctx, [P(s, 0), P(b, 0), P(b, h), P(s, h)], I.shade(sand, 0.94 + t * 0.14));
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
      const q = I.p(A[0] + dx * s + n[0] * a, A[1] + dy * s + n[1] * a, this.WATER_Z);
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
        for (let k = -1; k <= 1; k++) halme.push([[A[0] + dx * (s + k * 0.03) + n[0] * b, A[1] + dy * (s + k * 0.03) + n[1] * b, -0.02], [A[0] + dx * (s + k * 0.05) + n[0] * b, A[1] + dy * (s + k * 0.05) + n[1] * b, 0.05 + t * 0.06]]);
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
  drawCoast(ctx, P, t) {
    const season = this.season();
    const kanten = this.coastEdges();
    for (const [A, B, n, quay, len] of kanten) {
      const vis = n[0] + n[1] > 0.05; // Stirnseite zeigt zum Betrachter (+x/+y)
      if (quay) {
        // Schatten der Kaimauer im Wasser: dicht an der Mauer dunkel, nach außen auslaufend
        I.poly(ctx, [[A[0], A[1], this.WATER_Z], [B[0], B[1], this.WATER_Z], [B[0] + n[0] * 0.5, B[1] + n[1] * 0.5, this.WATER_Z], [A[0] + n[0] * 0.5, A[1] + n[1] * 0.5, this.WATER_Z]], 'rgba(10,20,40,0.16)');
        I.poly(ctx, [[A[0], A[1], this.WATER_Z], [B[0], B[1], this.WATER_Z], [B[0] + n[0] * 0.22, B[1] + n[1] * 0.22, this.WATER_Z], [A[0] + n[0] * 0.22, A[1] + n[1] * 0.22, this.WATER_Z]], 'rgba(8,16,34,0.26)');
        if (vis) {
          this.drawQuayWall(ctx, A, B, n, len);
        }
      } else {
        this.drawBank(ctx, A, B, n, len, vis, season);
      }
      // Gischt — beim Ablegen der festen Küstengeometrie bleibt sie außen vor, weil sie sich bewegt
      if (this.gischtAus) continue;
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let k = 0; k < len; k += 0.25) { const f = k / len; if (((k * 13) | 0) % 3) continue; const q = I.p(A[0] + (B[0] - A[0]) * f + n[0] * 0.3, A[1] + (B[1] - A[1]) * f + n[1] * 0.3, this.WATER_Z); ctx.fillRect(q[0] - 2 + Math.sin(t * 3 + k * 5), q[1], 3, 1); }
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
  roadGeometry() {
    const signature=JSON.stringify(HK.STREETS)+JSON.stringify(HK.SQUARES)+[I.TW,I.TH,I.OX,I.OY];
    if(this._roadGeometry?.signature===signature)return this._roadGeometry;
    const core=new Path2D(),shoulder=new Path2D(),streets=[],ends=new Map();
    const endpoint=(x,y)=>x.toFixed(3)+','+y.toFixed(3);
    for(const [x1,y1,x2,y2,width] of HK.STREETS)for(const [x,y] of [[x1,y1],[x2,y2]]){
      const key=endpoint(x,y);if(!ends.has(key))ends.set(key,[]);ends.get(key).push(width/2);
    }
    const jointRadius=(x,y,r)=>{const widths=ends.get(endpoint(x,y));return widths.length===2?(widths[0]+widths[1])/2:r;};
    // All contours have the same winding: nonzero fill forms a union even at
    // T junctions and unequal widths. Never stroke individual segment borders.
    const polygon=(path,points)=>{
      const area=points.reduce((n,p,i)=>{const q=points[(i+1)%points.length];return n+p[0]*q[1]-q[0]*p[1];},0);
      if(area<0)points=points.slice().reverse();
      points.forEach((p,i)=>{const q=I.p(...p,0);if(i)path.lineTo(...q);else path.moveTo(...q);});path.closePath();
    };
    const disc=(path,x,y,r)=>polygon(path,Array.from({length:16},(_,k)=>[x+Math.cos(k*Math.PI/8)*r,y+Math.sin(k*Math.PI/8)*r]));
    for(const [x1,y1,x2,y2,width] of HK.STREETS){
      const len=Math.hypot(x2-x1,y2-y1);if(!len)continue;
      const tx=(x2-x1)/len,ty=(y2-y1)/len,nx=-ty,ny=tx,n=Math.max(2,Math.ceil(len/.22));
      const samples=[],startRadius=jointRadius(x1,y1,width/2),endRadius=jointRadius(x2,y2,width/2);
      for(let k=0;k<=n;k++){
        const u=k/n,x=x1+(x2-x1)*u,y=y1+(y2-y1)*u,outside=!this.inTown(x,y);
        // Small wear variations only; the navigable centreline stays inside.
        const wav=outside?Math.sin(Math.PI*u)*Math.sin(x*2.7+y*1.9)*.018:0;
        const blendStart=Math.max(0,1-u*len/.65),blendEnd=Math.max(0,1-(1-u)*len/.65);
        const radius=width/2+(startRadius-width/2)*blendStart*blendStart+(endRadius-width/2)*blendEnd*blendEnd;
        const r=radius*(outside?1+.07*Math.sin(x*6.1+y*4.7)+.045*Math.sin(x*13-y*9):1);
        samples.push({x:x+nx*wav,y:y+ny*wav,r});
      }
      for(const [path,pad] of [[shoulder,.055],[core,0]]){
        polygon(path,samples.map(p=>[p.x+nx*(p.r+pad),p.y+ny*(p.r+pad)]).concat(samples.slice().reverse().map(p=>[p.x-nx*(p.r+pad),p.y-ny*(p.r+pad)])));
        for(const p of [samples[0],samples.at(-1)])disc(path,p.x,p.y,p.r+pad);
      }
      streets.push({x1,y1,x2,y2,width,len,tx,ty,nx,ny,samples});
    }
    const m=HK.BUILDING.market,squares=[[m.x,m.y,m.w,m.d],...(HK.SQUARES||[])];
    for(const [x,y,w,d] of squares)for(const path of [core,shoulder])polygon(path,[[x,y],[x+w,y],[x+w,y+d],[x,y+d]]);
    return this._roadGeometry={signature,core,shoulder,streets,squares};
  },
  drawRoadNetwork(g,season) {
    const {core,shoulder,streets,squares}=this.roadGeometry(),winter=season==='winter';
    const noise=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
    g.save();I.path(g,HK.LAND);g.clip();
    // A muted verge under one continuous surface; overlap never darkens a junction.
    g.fillStyle=winter?'#c0c7c6':'#858263';g.fill(shoulder);
    g.fillStyle=winter?'#d1d4ce':'#ad9775';g.fill(core);
    g.save();g.clip(core);
    // Deterministic fine gravel and earth texture, shared by the whole road network.
    const tile=document.createElement('canvas');tile.width=96;tile.height=64;const t=tile.getContext('2d');
    for(let k=0;k<360;k++){
      t.fillStyle=k%3?'rgba(68,55,37,.07)':'rgba(242,224,185,.16)';
      t.fillRect(noise(k,1)*96,noise(k,2)*64,.5+noise(k,3)*1.3,.4+noise(k,4)*.7);
    }
    g.fillStyle=g.createPattern(tile,'repeat');g.fillRect(0,0,HK.MAP.W,HK.MAP.H);
    if(!winter)for(const road of streets){
      const {x1,y1,len,tx,ty,nx,ny,width}=road;
      for(let u=.12;u<len;u+=.17){
        const x=x1+tx*u,y=y1+ty*u;if(this.inTown(x,y))continue;
        // Interrupt ruts at junctions, instead of drawing bars through another lane.
        const junction=streets.some(other=>{
          if(other===road)return false;
          const v=HK.clamp((x-other.x1)*other.tx+(y-other.y1)*other.ty,0,other.len);
          return Math.hypot(x-other.x1-v*other.tx,y-other.y1-v*other.ty)<other.width/2+.12;
        });
        if(!junction){
          for(const side of [-1,1]){
            const across=side*width*.23,jitter=Math.sin(u*3.2+x1)*.012;
            I.line(g,[x+nx*(across+jitter),y+ny*(across+jitter),0],[x+tx*.13+nx*across,y+ty*.13+ny*across,0],'rgba(86,68,43,.12)',width>.5?1.5:.7);
          }
        }
        // Small stones and broken grassy margins keep lanes from looking like ribbons.
        if(noise(x,y)>.55){
          const side=noise(y,x)>.5?1:-1,across=side*width*(.4+noise(x,9)*.12),p=I.p(x+nx*across,y+ny*across,0);
          g.fillStyle=noise(x,7)>.65?'#bcb092':'#8e8b63';g.beginPath();g.ellipse(...p,.6+noise(x,4)*.8,.35,0,0,Math.PI*2);g.fill();
        }
      }
    }
    // One world-aligned stone layout for streets AND squares. Crossroads no
    // longer layer two incompatible grids or drainage lines over one another.
    g.save();I.path(g,HK.TOWN);g.clip();g.fillStyle=winter?'#d4d7d3':'#878a7a';g.fill(core);
    if(!winter){
      const cells=new Set(),sx=.24,sy=.20;
      const collect=(x0,y0,x1,y1)=>{for(let j=Math.floor(y0/sy)-1;j<=Math.ceil(y1/sy);j++)for(let i=Math.floor(x0/sx)-1;i<=Math.ceil(x1/sx);i++)cells.add(i+','+j);};
      for(const r of streets)if(this.inTown(r.x1,r.y1)||this.inTown(r.x2,r.y2)||this.inTown((r.x1+r.x2)/2,(r.y1+r.y2)/2))collect(Math.min(r.x1,r.x2)-r.width,Math.min(r.y1,r.y2)-r.width,Math.max(r.x1,r.x2)+r.width,Math.max(r.y1,r.y2)+r.width);
      for(const [x,y,w,d] of squares)collect(x,y,x+w,y+d);
      for(const key of cells){
        const [i,j]=key.split(',').map(Number),x=(i+(j%2)*.5)*sx,y=j*sy,n=noise(i,j),inset=.015+n*.012;
        const colors=HK.Art?.pavingPalette?.(x,y)||['#9a9884','#a9a38c','#929480'];
        I.poly(g,[[x+inset,y+.015,0],[x+sx-.015,y+.01+n*.01,0],[x+sx-.018,y+sy-.018,0],[x+.012,y+sy-.014,0]],colors[Math.floor(n*colors.length)]);
      }
    }
    g.restore();g.restore();g.restore();
  },
  quayPaving(width = .5) {
    const edges = this.coastEdges(), same = (a, b) => a[0] === b[0] && a[1] === b[1];
    const inset = (p, n, adjacent) => {
      if (!adjacent) return [p[0] - n[0] * width, p[1] - n[1] * width];
      const dot = n[0] * adjacent[0] + n[1] * adjacent[1];
      // Intersect the two parallel inner edges at a shared corner.
      const scale = width / Math.max(.25, 1 + dot);
      return [p[0] - (n[0] + adjacent[0]) * scale, p[1] - (n[1] + adjacent[1]) * scale];
    };
    return edges.flatMap(([A, B, n, quay], i) => {
      if (!quay) return [];
      const prev = edges[(i + edges.length - 1) % edges.length], next = edges[(i + 1) % edges.length];
      const joinedStart = prev[3] && same(prev[1], A), joinedEnd = next[3] && same(B, next[0]);
      return [{ points: [A, B, inset(B, n, joinedEnd ? next[2] : null), inset(A, n, joinedStart ? prev[2] : null)], joinedStart, joinedEnd }];
    });
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
    for (const { points: [A, B, C, D], joinedStart, joinedEnd } of this.quayPaving()) {
      poly([A, B, C, D], this.pat.stone);
      for (const [a, b] of [[A, B], [C, D], ...(!joinedStart ? [[D, A]] : []), ...(!joinedEnd ? [[B, C]] : [])]) {
        const p = I.p(a[0], a[1], 0), q = I.p(b[0], b[1], 0);
        g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = .8; g.beginPath(); g.moveTo(...p); g.lineTo(...q); g.stroke();
      }
    }
    // Felder
    for (const [fx, fy, fw, fd] of HK.FIELDS) { poly([[fx, fy, 0], [fx + fw, fy, 0], [fx + fw, fy + fd, 0], [fx, fy + fd, 0]], winter ? '#d8dbe0' : this.pat.field, 'rgba(60,40,20,0.35)'); for (let k = 0.35; k < fd; k += 0.35) { const a = I.p(fx, fy + k, 0), b = I.p(fx + fw, fy + k, 0); g.strokeStyle = 'rgba(70,50,20,0.3)'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); } }
    this.drawRoadNetwork(g, season);
    // Pfützen, Schmutz
    for (let i = 0; i < 150; i++) { const x = 8 + Math.random() * 30, y = -2 + Math.random() * 20; if (!this.inTown(x, y)) continue; const s = I.p(x, y, 0); g.fillStyle = 'rgba(70,55,30,0.12)'; g.beginPath(); g.ellipse(s[0], s[1], 5 + Math.random() * 10, 2 + Math.random() * 3, 0, 0, 6.28); g.fill(); }
    this.ground = c;
  },

  /* ---------- Wetter, Licht ---------- */
  drawWeather(ctx, t) {
    const density = .5 + .5 * (HK.weatherAt?.(HK.state)?.strength ?? 1);
    if (this.weather === 'rain') { ctx.strokeStyle = 'rgba(200,215,235,0.35)'; ctx.lineWidth = 1; for (let i = 0; i < 220 * density; i++) { const x = ((i * 67 + t * 260) % (HK.SCENE.W + 40)) - 20, y = ((i * 131 + t * 420) % (HK.SCENE.H + 60)) - 30; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 12); ctx.stroke(); } }
    if (this.weather === 'snow') { ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 180 * density; i++) { const x = ((i * 89 + t * 18 + Math.sin(t + i) * 20) % (HK.SCENE.W + 40)) - 20, y = ((i * 151 + t * 40) % (HK.SCENE.H + 40)) - 20; ctx.beginPath(); ctx.arc(x, y, 1.2 + (i % 3) * 0.5, 0, 6.28); ctx.fill(); } }
    // Cloud cover is part of palette lighting, not an opaque grey overlay.
  },
  /* Tageslicht wird im Pixi-Renderer multipliziert; lokale Lichtquellen folgen danach. */
  /* Der Lichtschein der Fenster: die Emissionsebene liegt in kleiner Auflösung vor und wird dort auch
     weichgezeichnet. Eine Weichzeichnung über das ganze große Bild kostete mehr als alles andere zusammen. */
  /* Laternenschein einmal als Bildchen, statt für jede Laterne einen eigenen Farbverlauf anzulegen */
};
