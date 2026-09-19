/* Zeichenkontext in Gestalt eines Canvas-Kontexts, der seine Befehle aber als PixiJS-Geometrie ablegt.
   Damit bleibt der gesamte Zeichencode in buildings.js, iso.js und scene.js unverändert: Er bekommt
   statt des echten Kontexts dieses Objekt gereicht — so wie es teeCtx und renderPick schon tun.
   Der Unterschied zum Canvas: Die Geometrie bleibt liegen. Ein einmal beschriebenes Haus kostet in
   jedem weiteren Bild nichts mehr, egal wie fein es gezeichnet ist. */
'use strict';
HK.Gfx = HK.Gfx || {};

/* Farbangaben werden über alle Kontexte hinweg gemerkt: dieselben Wandfarben kehren tausendfach wieder */
HK.Gfx._farben = new Map();
HK.Gfx.FARBEN_MAX = 4000;
/* Deckkraft auf drei Stellen runden: Rauch, Gischt und Feuerschein blenden stufenlos aus und
   erzeugen sonst endlos neue Farbangaben, die sich in der Tabelle sammeln. */
HK.Gfx.farbschluessel = function (v) {
  if (typeof v !== 'string' || v.charCodeAt(0) !== 114) return v;      // beginnt nicht mit 'r'
  return v.replace(/(\d*\.\d{4,})\s*\)/, (m, z) => (Math.round(parseFloat(z) * 1000) / 1000) + ')');
};
HK.Gfx.farbe = function (roh) {
  const v = HK.Gfx.farbschluessel(roh);
  let c = HK.Gfx._farben.get(v);
  if (c === undefined) {
    try {
      const p = new PIXI.Color(v);
      c = { color: p.toNumber(), alpha: p.alpha };
    } catch (e) {
      // Canvas nimmt auch krumme Farbangaben klaglos hin — etwa rgba(…, -0.01), wie sie beim
      // Ausblenden von Rauch entstehen. Pixi wirft dort. Also selbst lesen und in die Grenzen holen.
      c = HK.Gfx.farbeNotfall(v);
    }
    if (HK.Gfx._farben.size >= HK.Gfx.FARBEN_MAX) HK.Gfx._farben.clear();
    HK.Gfx._farben.set(v, c);
  }
  return c;
};
HK.Gfx.farbeNotfall = function (v) {
  const g = (x, lo, hi) => Math.max(lo, Math.min(hi, isFinite(x) ? x : 0));
  const m = /^\s*rgba?\s*\(([^)]*)\)/i.exec(String(v));
  if (m) {
    const teil = m[1].split(/[,\/\s]+/).filter(x => x !== '').map(parseFloat);
    const r = g(teil[0], 0, 255) | 0, gr = g(teil[1], 0, 255) | 0, b = g(teil[2], 0, 255) | 0;
    return { color: (r << 16) | (gr << 8) | b, alpha: teil.length > 3 ? g(teil[3], 0, 1) : 1 };
  }
  return { color: 0xffffff, alpha: 1 };
};

HK.Gfx.PixiCtx = class {
  constructor(gc) {
    this.gc = gc || new PIXI.GraphicsContext();
    this.fluechtig = false;                 // zeichnet dieser Kontext in jedem Bild neu?
    this.sammler = null;                    // wer die hier gebauten Verläufe später wegräumt
    this._fill = '#000'; this._stroke = '#000';
    this.lineWidth = 1; this.globalAlpha = 1;
    this.lineJoin = 'miter'; this.lineCap = 'butt';
    this.globalCompositeOperation = 'source-over';
    this.font = ''; this.textAlign = 'left';
    this._m = new PIXI.Matrix();
    this._stack = [];
    this._dash = null;
    this._leer = true;          // noch kein Pfadpunkt gesetzt
    this._pkte = null;          // Aufzeichnung für gestrichelte Striche
    this.schwarz = false;       // Silhouetten-Weise für die Emissionsebene
  }

  /* ----- Zustand ----- */
  set fillStyle(v) { this._fill = v; }
  get fillStyle() { return this._fill; }
  set strokeStyle(v) { this._stroke = v; }
  get strokeStyle() { return this._stroke; }

  save() { this._stack.push([this._m.clone(), this._fill, this._stroke, this.lineWidth, this.globalAlpha, this.lineJoin, this.lineCap, this._dash, this.schwarz]); }
  restore() {
    const s = this._stack.pop(); if (!s) return;
    this._m = s[0]; this._fill = s[1]; this._stroke = s[2]; this.lineWidth = s[3];
    this.globalAlpha = s[4]; this.lineJoin = s[5]; this.lineCap = s[6]; this._dash = s[7]; this.schwarz = s[8];
    this.gc.setTransform(this._m);
  }

  /* ----- Lage ----- */
  _anwenden() { this.gc.setTransform(this._m); }
  setTransform(a, b, c, d, e, f) { this._m.set(a, b, c, d, e, f); this._anwenden(); }
  transform(a, b, c, d, e, f) { this._m.append(new PIXI.Matrix(a, b, c, d, e, f)); this._anwenden(); }
  translate(x, y) { this._m.append(new PIXI.Matrix(1, 0, 0, 1, x, y)); this._anwenden(); }
  scale(x, y) { this._m.append(new PIXI.Matrix(x, 0, 0, y === undefined ? x : y, 0, 0)); this._anwenden(); }
  rotate(r) { const c = Math.cos(r), s = Math.sin(r); this._m.append(new PIXI.Matrix(c, s, -s, c, 0, 0)); this._anwenden(); }

  /* ----- Pfad ----- */
  beginPath() { this.gc.beginPath(); this._leer = true; this._pkte = null; }
  closePath() {
    if (this._dash) { const p = this._pkte; if (p && p.length) { const u = p[p.length - 1]; if (u.length > 1) u.push(u[0]); } return; }
    this.gc.closePath();
  }
  moveTo(x, y) { this._leer = false; if (this._dash) { (this._pkte = this._pkte || []).push([[x, y]]); return; } this.gc.moveTo(x, y); }
  lineTo(x, y) { this._leer = false; if (this._dash) { const p = (this._pkte = this._pkte || [[]]); p[p.length - 1].push([x, y]); return; } this.gc.lineTo(x, y); }
  quadraticCurveTo(cx, cy, x, y) { this.gc.quadraticCurveTo(cx, cy, x, y); this._leer = false; }
  bezierCurveTo(c1x, c1y, c2x, c2y, x, y) { this.gc.bezierCurveTo(c1x, c1y, c2x, c2y, x, y); this._leer = false; }
  /* Pixi kennt nur die ganze, ungedrehte Ellipse. Canvas kann Teilbögen mit Anfangs- und Endwinkel,
     und genau daraus bestehen Zylinder, Kegel, Kuppeln und Fässer — eine halbe Ellipse unten, eine
     halbe oben, dazwischen zwei Striche. Darum wird jeder Bogen hier selbst in einen Linienzug gelegt;
     nur die volle, ungedrehte Ellipse nimmt die Abkürzung. Die Feinheit richtet sich nach dem Radius im Bild.
     Pixi skaliert außerdem den Radius eines Bogens nicht mit der Lagematrix mit — ein zweiter Grund,
     es nicht gc.arc zu überlassen. */
  _bogen(x, y, rx, ry, rot, a0, a1, ccw) {
    let spanne = a1 - a0;
    if (ccw) { while (spanne > 0) spanne -= Math.PI * 2; spanne = Math.max(spanne, -Math.PI * 2); }
    else { while (spanne < 0) spanne += Math.PI * 2; spanne = Math.min(spanne, Math.PI * 2); }
    const voll = Math.abs(spanne) > 6.2;
    if (voll && this._leer && !this._dash) {
      this._leer = false;
      if (!rot) { this.gc.ellipse(x, y, rx, ry); return; }
      const c = Math.cos(rot), sn = Math.sin(rot);
      const t = this._m.clone(); t.append(new PIXI.Matrix(c, sn, -sn, c, x, y));
      this.gc.setTransform(t); this.gc.ellipse(0, 0, rx, ry); this.gc.setTransform(this._m);
      return;
    }
    const m = this._m, mass = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1;
    const gross = Math.max(Math.abs(rx), Math.abs(ry)) * mass;
    const n = Math.max(6, Math.min(96, Math.ceil(Math.abs(spanne) / (Math.PI * 2) * Math.max(10, gross * 1.4))));
    const cr = Math.cos(rot || 0), sr = Math.sin(rot || 0);
    for (let i = 0; i <= n; i++) {
      const a = a0 + spanne * i / n, ux = Math.cos(a) * rx, uy = Math.sin(a) * ry;
      const px = x + ux * cr - uy * sr, py = y + ux * sr + uy * cr;
      if (i === 0 && this._leer) this.moveTo(px, py); else this.lineTo(px, py);
    }
  }
  arc(x, y, r, a0, a1, ccw) { this._bogen(x, y, r, r, 0, a0 === undefined ? 0 : a0, a1 === undefined ? Math.PI * 2 : a1, !!ccw); }
  arcTo(x1, y1, x2, y2, r) { this.gc.arcTo(x1, y1, x2, y2, r); this._leer = false; }
  rect(x, y, w, h) { if (this._dash) { this.moveTo(x, y); this.lineTo(x + w, y); this.lineTo(x + w, y + h); this.lineTo(x, y + h); this.closePath(); return; } this.gc.rect(x, y, w, h); this._leer = false; }
  ellipse(x, y, rx, ry, rot, a0, a1, ccw) { this._bogen(x, y, rx, ry, rot || 0, a0 === undefined ? 0 : a0, a1 === undefined ? Math.PI * 2 : a1, !!ccw); }

  /* ----- Füllen und Strichen ----- */
  _fuellstil(v) {
    // In der Emissionsebene zählt nur die Silhouette: alles wird schwarz, damit vordere Häuser
    // die Lichter dahinter verdecken. Nur die leuchtenden Fenster kommen farbig durch (siehe emit).
    if (this.schwarz) return { color: 0x000000, alpha: 1 };
    if (typeof v === 'string') { const c = HK.Gfx.farbe(v); return { color: c.color, alpha: c.alpha * this.globalAlpha }; }
    if (v && v._pixiFill) return v._pixiFill(this.fluechtig, this.sammler); // Verlauf
    if (v && v._quelle) return this._muster(v);          // Musterfüllung
    return { color: 0xffffff, alpha: this.globalAlpha };
  }
  /* Musterfüllung: aus der Quell-Leinwand des Canvas-Musters wird eine Textur. Der Maßstab steckt in der
     Lagematrix, weil die Wegpunkte schon in Bildpunkten vorliegen. */
  _muster(v) {
    const m = this._m, mass = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1;
    const schl = Math.round(mass * 1000);
    v._pixiMuster = v._pixiMuster || new Map();
    let f = v._pixiMuster.get(schl);
    if (!f) {
      if (!v._pixiTex) { v._pixiTex = PIXI.Texture.from(v._quelle); v._pixiTex.source.addressMode = 'repeat'; }
      f = new PIXI.FillPattern(v._pixiTex, 'repeat');
      const k = mass / (v._rs || 1);
      f.setTransform(new PIXI.Matrix(k, 0, 0, k, 0, 0));
      f.textureSpace = 'global';
      v._pixiMuster.set(schl, f);
    }
    return { fill: f, alpha: this.globalAlpha };
  }
  fill() { this.gc.fill(this._fuellstil(this._fill)); }
  stroke() {
    if (this.schwarz) return;          // Striche tragen zur Silhouette nichts bei
    if (this._dash && this._pkte) this._striche();
    const s = this._fuellstil(this._stroke);
    this.gc.stroke({ color: s.color, alpha: s.alpha, width: this.lineWidth, join: this.lineJoin === 'miter' ? 'miter' : this.lineJoin, cap: this.lineCap === 'butt' ? 'butt' : this.lineCap });
  }
  /* Gestrichelt: Pixi kann das nicht, also wird der aufgezeichnete Linienzug in Striche zerlegt.
     Gebraucht wird es für die Auswahlrahmen um Gebäude und Schiffe. */
  _striche() {
    const an = this._dash[0] || 4, aus = this._dash.length > 1 ? this._dash[1] : this._dash[0] || 4;
    for (const teil of this._pkte) {
      if (teil.length < 2) continue;
      let x = teil[0][0], y = teil[0][1], rest = an, zeichnend = true;
      this.gc.moveTo(x, y);
      for (let k = 1; k < teil.length; k++) {
        let zx = teil[k][0], zy = teil[k][1], dx = zx - x, dy = zy - y, len = Math.hypot(dx, dy);
        while (len > rest && rest > 0) {
          const f = rest / len;
          x += dx * f; y += dy * f;
          if (zeichnend) this.gc.lineTo(x, y); else this.gc.moveTo(x, y);
          zeichnend = !zeichnend; rest = zeichnend ? an : aus;
          dx = zx - x; dy = zy - y; len = Math.hypot(dx, dy);
        }
        rest -= len;
        if (zeichnend) this.gc.lineTo(zx, zy); else this.gc.moveTo(zx, zy);
        x = zx; y = zy;
      }
    }
    this._pkte = null;
  }
  fillRect(x, y, w, h) { this.beginPath(); this.rect(x, y, w, h); this.fill(); }
  strokeRect(x, y, w, h) { this.beginPath(); this.rect(x, y, w, h); this.stroke(); }
  clearRect() { /* im gesammelten Bild ohne Bedeutung */ }

  /* ----- Was Pixi anders oder nicht kann ----- */
  setLineDash(d) { this._dash = d && d.length ? d : null; }
  getLineDash() { return this._dash || []; }
  clip() { /* wird an den Stellen, an denen es vorkommt, gesondert gelöst */ }
  fillText() {}
  strokeText() {}
  measureText() { return { width: 0 }; }
  drawImage() {}
  createLinearGradient(x0, y0, x1, y1) { return new HK.Gfx.Verlauf('linear', [x0, y0, x1, y1]); }
  createRadialGradient(x0, y0, r0, x1, y1, r1) { return new HK.Gfx.Verlauf('radial', [x0, y0, r0, x1, y1, r1]); }
};

/* Farbverlauf: sammelt die Haltepunkte und übersetzt sie beim Füllen in einen Pixi-Verlauf */
/* Farbverläufe werden gemerkt. Jeder angelegte PIXI.FillGradient hält eine eigene Textur; ohne
   dieses Gedächtnis entstehen bei jedem neu gezeichneten Zylinder, Schiffsrumpf oder Segel neue
   Texturen — gemessen tausend in der Sekunde, bis der Tab am Speicher stirbt. */
/* Verläufe in Geometrie, die in jedem Bild neu entsteht, taugen nicht zum Merken: ihre Haltepunkte
   stehen in Weltkoordinaten und wiederholen sich nie, weil der Kran, die Karren und die Gischt sich
   bewegen. Sie kommen darum in einen Ringpuffer über drei Bilder. Wenn ein Verlauf daraus fällt,
   ist die Geometrie, die ihn benutzte, längst zweimal neu gebaut — er hält nichts mehr fest. */
HK.Gfx._bleibend = [];                  // was einmal entsteht und liegen bleibt (Küste, Grundformen)
HK.Gfx._ring = [[], [], []];
HK.Gfx._ringNr = 0;
HK.Gfx.bildWechsel = function () {
  HK.Gfx._ringNr = (HK.Gfx._ringNr + 1) % 3;
  const alt = HK.Gfx._ring[HK.Gfx._ringNr];
  for (const g of alt) g.destroy();
  alt.length = 0;
};
HK.Gfx.Verlauf = class {
  constructor(art, werte) { this.art = art; this.werte = werte; this.stops = []; }
  addColorStop(p, c) { this.stops.push([p, c]); }
  _pixiFill(fluechtig, sammler) {
    const f = this._bauen();
    // Jeder Verlauf gehört jemandem: der Geometrie, die ihn benutzt, oder — wenn die in jedem Bild
    // neu entsteht — dem Ringpuffer. Ein Verlauf ohne Besitzer bliebe für immer liegen, und mit ihm
    // seine Textur; genau daran ist der Tab vorher gestorben.
    (sammler || (fluechtig ? HK.Gfx._ring[HK.Gfx._ringNr] : HK.Gfx._bleibend)).push(f.fill);
    return f;
  }
  _bauen() {
    const w = this.werte;
    const g = this.art === 'linear'
      ? new PIXI.FillGradient({ type: 'linear', start: { x: w[0], y: w[1] }, end: { x: w[2], y: w[3] }, textureSpace: 'global' })
      : new PIXI.FillGradient({ type: 'radial', center: { x: w[0], y: w[1] }, innerRadius: w[2], outerCenter: { x: w[3], y: w[4] }, outerRadius: w[5], textureSpace: 'global' });
    for (const [p, c] of this.stops) { const f = HK.Gfx.farbe(c); g.addColorStop(p, new PIXI.Color({ r: (f.color >> 16) & 255, g: (f.color >> 8) & 255, b: f.color & 255, a: f.alpha })); }
    return { fill: g };
  }
};
