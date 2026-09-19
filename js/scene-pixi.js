/* Zweiter Renderer für dieselbe Szene, auf PixiJS statt Canvas 2D.
   Er ersetzt nur das Zeichnen, nicht das Spiel: Kamera, Uhrzeit, Wetter, Objektliste und sämtlicher
   Zeichencode kommen unverändert aus HK.Scene, buildings.js und iso.js. Der Unterschied liegt darin,
   dass die Geometrie liegen bleibt. Ein Haus wird einmal beschrieben und danach nur noch gezeigt —
   Schwenken und Zoomen sind bloße Container-Verschiebungen und kosten gar nichts.

   Ebenen von hinten nach vorn:
     see  wasser  boden  kueste  schatten  objekte  luft  wetter  glanz  vignette  korn          */
'use strict';

HK.PixiScene = {
  bereit: false, app: null,
  OHNE_EM: false,                          // nur zum Eingrenzen von Fehlern
  GESTALT_MAX: 3000,                       // so viele Figuren-Geometrien bleiben gemerkt
  BAUHAUSHALT: 12,                         // so viele ruhende Objekte dürfen je Bild neu entstehen

  async init(canvas) {
    const S = HK.Scene;
    this.app = new PIXI.Application();
    await this.app.init({
      canvas, width: HK.SCENE.W, height: HK.SCENE.H, resolution: S.RS, autoDensity: false,
      antialias: true, preference: 'webgl', background: 0x0d1316, autoStart: false,
    });
    canvas.style.width = '100%'; canvas.style.height = '100%';

    const C = () => new PIXI.Container();
    this.welt = C();                       // Kartenebene, trägt die Kamera
    this.bild = C();                       // Bildschirmebene
    this.lg = {                            // die einzelnen Ebenen
      see: new PIXI.Sprite(), wasser: C(), boden: new PIXI.Sprite(), kueste: C(),
      schatten: new PIXI.Graphics(), objekte: C(), vordergrund: new PIXI.Graphics(),
      dunst: new PIXI.Sprite(), hebung: new PIXI.Sprite(),
      luft: new PIXI.Sprite(), wetter: new PIXI.Graphics(), glanz: C(), vignette: new PIXI.Sprite(), korn: new PIXI.Sprite(),
    };
    this.bild.addChild(this.lg.see);
    this.welt.addChild(this.lg.wasser, this.lg.boden, this.lg.kueste, this.lg.schatten, this.lg.objekte, this.lg.vordergrund);
    this.bild.addChild(this.welt);
    this.bild.addChild(this.lg.dunst, this.lg.hebung, this.lg.wetter, this.lg.luft, this.lg.glanz, this.lg.vignette, this.lg.korn);

    // Emissionsebene: dieselbe Szene noch einmal als schwarze Silhouette mit leuchtenden Fenstern.
    // Sie hängt nicht an der Bühne, sondern wird für sich in eine kleine Textur gezeichnet.
    this.weltEm = C(); this.emObjekte = C(); this.weltEm.addChild(this.emObjekte);
    this.emA = new PIXI.Sprite(); this.emB = new PIXI.Sprite();
    // Die Mischart gehört an den Filter, nicht an das Sprite: ein gefiltertes Sprite wird erst in eine
    // Zwischentextur gezeichnet, und dabei ginge ein 'add' am Sprite verloren — die schwarze Silhouette
    // läge dann ganz normal über der Stadt.
    this.emA.filters = [new PIXI.BlurFilter({ strength: 6, quality: 3, blendMode: 'add', resolution: 0.5 })];
    this.emB.filters = [new PIXI.BlurFilter({ strength: 1.5, quality: 2, blendMode: 'add', resolution: 1 })];
    this.lampenLage = C(); this.lampenVorrat = []; this.lampen = [];
    this.lg.glanz.addChild(this.emA, this.emB, this.lampenLage);
    this.app.stage.addChild(this.bild);

    this.lg.luft.blendMode = 'normal';
    this.lg.korn.alpha = 0.04;

    this.cache = new Map();                // Schlüssel -> { g, schatten, marke }
    this.gestalten = new Map();            // Aussehen einer bewegten Figur -> fertige Geometrie
    this.figuren = new Map();              // Aussehen + laufende Nummer -> dauerhaftes Grafikobjekt
    this.figurenBenutzt = [];
    this.frei = [];                        // Vorrat für bewegte Objekte
    this.benutzt = [];
    this.figurenFrei = [];                 // Vorrat für Figuren-Grafikobjekte
    this.texturen = new Map();

    /* Die Grafikkarte kann ihren Kontext verlieren — beim Treiberwechsel, beim Aufwachen aus dem
       Ruhezustand, unter Last. Ohne Vorkehrung zeichnet der Renderer danach ins Leere und das Spiel
       wirkt eingefroren. Also: den Verlust abfangen, das Zeichnen aussetzen und beim Wiederkehren
       alle abgelegte Geometrie verwerfen, damit sie neu entsteht. */
    canvas.addEventListener('webglcontextlost', e => {
      e.preventDefault();               // ohne das wird der Kontext nie wiederhergestellt
      this.bereit = false;
      HK.Scene.meldung('Die Grafikkarte hat den Zeichenkontext verloren. Das Bild kehrt gleich zurück.');
    }, false);
    canvas.addEventListener('webglcontextrestored', () => { this.verwerfen(); this.bereit = true; HK.Scene.meldung(null); }, false);

    this.bereit = true;
    return this;
  },
  /* Alles Abgelegte wegwerfen; das nächste Bild baut es neu auf */
  verwerfen() {
    for (const e of this.cache.values()) {
      if (e.verl) for (const v of e.verl) v.destroy();
      if (e.emVerl) for (const v of e.emVerl) v.destroy();
      if (e.g) e.g.destroy(); if (e.gEm) e.gEm.destroy();
    }
    this.cache.clear();
    for (const g of this.gestalten.values()) { if (g._verl) for (const v of g._verl) v.destroy(); g.destroy(); }
    this.gestalten.clear();
    for (const g of this.figuren.values()) { g.unload(); g.destroy(); }
    this.figuren.clear();
    for (const g of this.figurenFrei) g.destroy();
    this.figurenFrei.length = 0;
    this.figurenBenutzt.length = 0;
    this.texturen.clear();
    for (const v of HK.Gfx._bleibend) v.destroy();
    HK.Gfx._bleibend.length = 0;
    this._kFest = null; this._kGischt = null; this._stege = null;
    this._wGrund = null; this._wOv = null; this._wellen = null;
    this.lg.kueste.removeChildren(); this.lg.wasser.removeChildren(); this.lg.objekte.removeChildren();
    this.emObjekte.removeChildren();
    this._seeMarke = null; this._wMarke = null; this._dunstMarke = null; this._luftMarke = null;
    this._vignFertig = false; this._kornFertig = false; this._hebungFertig = false; this._lampTex = null;
    this.bodenNeu = true;
  },
  /* Beim Verlassen der Seite den Zeichenkontext freigeben. Ohne das sammeln sich beim wiederholten
     Neuladen offene WebGL-Kontexte an, und irgendwann bekommt die Seite keinen mehr. */
  zerstoeren() {
    if (!this.app) return;
    this.bereit = false;
    try { this.app.destroy(false, { children: true, texture: true }); } catch (e) { /* beim Abbau ist alles erlaubt */ }
    this.app = null;
  },

  /* Eine Leinwand als Textur, die beim Ändern des Inhalts aufgefrischt wird */
  tex(canvas, frisch) {
    let t = this.texturen.get(canvas);
    if (!t) { t = PIXI.Texture.from(canvas); this.texturen.set(canvas, t); }
    else if (frisch) t.source.update();
    return t;
  },
  setzeSprite(sp, canvas, w, h, frisch) {
    sp.texture = this.tex(canvas, frisch);
    sp.width = w; sp.height = h; sp.visible = true;
  },

  /* Kleine Bildschirmebene über den vorhandenen Canvas-Code zeichnen und hochladen.
     So bleiben Dunst, Lichtton und Vignette farblich genau das, was sie vorher waren. */
  hilfsLeinwand(name, w, h) {
    this._hl = this._hl || {};
    let c = this._hl[name];
    if (!c || c.width !== w || c.height !== h) { c = this._hl[name] = document.createElement('canvas'); c.width = w; c.height = h; }
    return c;
  },

  /* ---------- Zeichnen ---------- */
  draw() {
    const S = HK.Scene, st = HK.state;
    if (!st || !this.bereit) return;
    const P = S.palette(), t = S.time, W = HK.SCENE.W, H = HK.SCENE.H, season = S.season();
    if (season !== S.lastSeason) { S.lastSeason = season; S.makeGround(season); this.bodenNeu = true; }
    S.lamps = [];
    S.nightK = P.amb < 0.7 ? HK.clamp((0.7 - P.amb) / 0.4, 0, 1) : 0;
    // Dieser Schalter steuert, ob ein Fenster erleuchtet gezeichnet wird; er gehört dem Zeichencode
    // (geschlossene Kirche beim Interdikt). Hier wird nur sichergestellt, dass er offen ist.
    S.emitOff = false;

    // Kamera: eine Container-Verschiebung, keine Neuberechnung von Geometrie
    this.welt.scale.set(S.cam.z);
    this.welt.position.set(-S.cam.x * S.cam.z, -S.cam.y * S.cam.z);

    HK.Gfx.bildWechsel();
    this.offeneSee(P, W, H);
    this.wasser(P, t);
    this.boden();
    this.kueste(t);
    this.objekte(st, season, t);
    this.vordergrund(t);
    this.luftUndLicht(P, W, H, t);
    this.glanz(P, W, H);
    this.app.renderer.render(this.app.stage);
  },

  /* Offene See jenseits der Karte: ein schmaler Farbverlauf, in Bildschirmlage gespannt */
  offeneSee(P, W, H) {
    const marke = P.far.map(v => v | 0).join() + '|' + P.near.map(v => v | 0).join();
    const c = this.hilfsLeinwand('see', 64, 64);
    if (marke !== this._seeMarke) {
      this._seeMarke = marke;
      const g = c.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 64 * 0.3, 64);
      gr.addColorStop(0, HK.Scene.rgb(P.far)); gr.addColorStop(1, HK.Scene.rgb(P.near));
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      this.setzeSprite(this.lg.see, c, W, H, true);
    } else { this.lg.see.width = W; this.lg.see.height = H; }
  },

  /* Wasser: Grundton und Tiefenflecken liegen fest, nur Wellen und Glitzern entstehen je Bild neu */
  wasser(P, t) {
    const S = HK.Scene, MW = HK.MAP.W, MH = HK.MAP.H;
    if (!this._wGrund) {
      this._wGrund = new PIXI.Sprite(); this._wOv = new PIXI.Sprite(); this._wellen = new PIXI.Graphics();
      this.lg.wasser.addChild(this._wGrund, this._wOv, this._wellen);
    }
    const marke = P.far.map(v => v | 0).join() + '|' + P.near.map(v => v | 0).join();
    const c = this.hilfsLeinwand('wgrund', 96, 96);
    if (marke !== this._wMarke) {
      this._wMarke = marke;
      const g = c.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 96 * 0.3, 96);
      gr.addColorStop(0, S.rgb(P.far)); gr.addColorStop(1, S.rgb(P.near));
      g.fillStyle = gr; g.fillRect(0, 0, 96, 96);
      this.setzeSprite(this._wGrund, c, MW, MH, true);
    } else { this._wGrund.width = MW; this._wGrund.height = MH; }
    this.setzeSprite(this._wOv, S.waterOverlay(), MW, MH, false);

    // Wellenkämme
    const v = S.cullRect(), g = this._wellen;
    g.clear();
    for (let i = 0; i < 420; i++) {
      const x = ((i * 137 + t * 9) % (MW + 60)) - 30, y = ((i * 89 + (i % 3) * 7) % (MH + 20)) - 10 + Math.sin(t * 1.4 + i) * 1.5;
      const len = 6 + (i % 5) * 2.5;
      if (x + len < v.x0 || x > v.x1 || y < v.y0 || y > v.y1) continue;
      g.moveTo(x, y); g.quadraticCurveTo(x + len / 2, y - 1.5, x + len, y);
    }
    g.stroke({ color: 0xffffff, alpha: 0.03 + 0.035 * P.amb, width: 1 });
  },

  boden() {
    const S = HK.Scene;
    this.setzeSprite(this.lg.boden, S.ground, HK.MAP.W, HK.MAP.H, !!this.bodenNeu);
    this.bodenNeu = false;
  },

  /* Küste: das Gemauerte liegt fest, die Gischt bewegt sich */
  kueste(t) {
    const S = HK.Scene;
    if (!this._kFest) {
      this._kFest = new PIXI.Graphics(); this._kGischt = new PIXI.Graphics();
      this.lg.kueste.addChild(this._kFest, this._kGischt);
      const pc = new HK.Gfx.PixiCtx(this._kFest.context);
      const gischtAus = S.gischtAus; S.gischtAus = true;
      S.drawCoast(pc, S.palette(), 0);
      S.gischtAus = gischtAus;
    }
    const g = this._kGischt; g.clear();
    for (const [A, B, n, , len] of S.coastEdges()) {
      for (let k = 0; k < len; k += 0.25) {
        const f = k / len; if (((k * 13) | 0) % 3) continue;
        const q = HK.Iso.p(A[0] + (B[0] - A[0]) * f + n[0] * 0.3, A[1] + (B[1] - A[1]) * f + n[1] * 0.3, 0);
        g.rect(q[0] - 2 + Math.sin(t * 3 + k * 5), q[1], 3, 1);
      }
    }
    g.fill({ color: 0xffffff, alpha: 0.35 });
  },

  /* Die Objektebene: unbewegte Objekte behalten ihre Geometrie, bewegte entstehen je Bild neu */
  objekte(st, season, t) {
    const S = HK.Scene;
    const M = this.mess = this.mess || {}; const U = () => performance.now(); let z0 = U();
    const tick = k => { const n = U(); M[k] = (M[k] || 0) + (n - z0); z0 = n; };
    const sv = S.shadowVec();
    const vr = S.cullRect();
    // Am Aussehen eines Hauses ändert das Licht nur zweierlei: ob die Fenster leuchten und ob eine
    // Laterne oder ein Feuer brennt. Ein feiner Helligkeitsschlüssel würde die halbe Stadt bei jedem
    // Sonnenschritt neu bauen lassen — es genügen diese wenigen Zustände.
    const amb = S.palette().amb;
    const lichtZustand = Math.round(S.nightK * 4) + (amb < 0.6 ? 'a' : '') + (amb < 0.8 ? 'b' : '');
    const marke = season + '|' + lichtZustand + '|' + (HK.geoStand || 0);
    // Der Schlagschatten wandert mit der Sonne, steckt aber nicht in der abgelegten Geometrie: er wird
    // aufgefangen und in jedem Bild neu gezogen. Einzig der Baum zeichnet seinen selbst — und der liest
    // ohnehin die Uhr, weil er schwankt, bekommt also gleich eine Zeitstufe.
    const zeitStufe = Math.round(S.time * 8);
    let haushalt = this.BAUHAUSHALT;          // so viele Auffrischungen je Bild, damit kein Ruckler entsteht
    const lage = this.lg.objekte;

    // Steg gehört zur Karte, nicht zu den Objekten
    if (!this._stege) {
      this._stege = new PIXI.Graphics();
      this.lg.kueste.addChild(this._stege);
    }
    tick('vorbereitung');
    const sg = this._stege; sg.clear();
    const spc = new HK.Gfx.PixiCtx(sg.context); spc.fluechtig = true;
    for (const d of S.docks()) S.drawPier(spc, d.pier, t);
    tick('stege');

    for (const g of this.benutzt) { this.frei.push(g); g.visible = false; }
    this.benutzt.length = 0;
    for (const fs of this.figurenBenutzt) { const g = this.figuren.get(fs); if (g) g.visible = false; }
    this.figurenBenutzt.length = 0;
    const zaehler = new Map();

    const schatten = [], lampen = [];
    let i = 0, eI = 0;
    const kinder = [], emKinder = [];
    const liste = S.buildItems(null, st, season, t);
    tick('liste');
    M.neuRuhend = 0; M.neuGestalt = 0; M.neuBewegt = 0;
    for (const it of liste) {
      if (it.box && !S.inView(it.box, vr)) continue;
      let g;
      if (it.c) {
        let e = this.cache.get(it.c);
        const soll = e && e.zeit ? marke + '|' + zeitStufe : marke;
        // Was noch nie gezeichnet wurde, muss sofort entstehen. Alles Übrige wartet, bis das Budget
        // dieses Bildes es zulässt: sonst baut sich nach jeder Zustandsänderung die halbe Stadt in
        // einem einzigen Bild neu, und das sieht man als Ruckler.
        if (!e || (e.marke !== soll && haushalt > 0)) {
          haushalt--;
          // Das Grafikobjekt bleibt bestehen und wird nur geleert. Es wegzuwerfen und neu anzulegen
          // hieße, für jede Auffrischung neue Puffer auf der Grafikkarte anzufordern — bei den
          // Objekten, die die Uhr lesen, achtmal je Sekunde, und der Speicher wächst mit.
          const gr = e ? e.g : new PIXI.Graphics();
          if (e) { gr.context.clear(); if (e.verl) for (const v of e.verl) v.destroy(); }
          const verl = [];
          const pc = new HK.Gfx.PixiCtx(gr.context); pc.sammler = verl;
          S.schattenFang = [];
          // Ob ein Objekt die Uhr liest, stellt sich beim Zeichnen heraus: dafür wird sie kurz beobachtet.
          // Nur wer sie liest, braucht später eine Zeitstufe im Schlüssel — alle anderen bleiben für immer liegen.
          const echteZeit = S.time; let liestZeit = false;
          Object.defineProperty(S, 'time', { configurable: true, get() { liestZeit = true; return echteZeit; }, set(v) { } });
          const lampenVorher = S.lamps; S.lamps = [];
          it.f(pc);
          const lampen = S.lamps; S.lamps = lampenVorher;
          delete S.time; S.time = echteZeit;
          const eAlt = e;
          e = { g: gr, verl, schatten: S.schattenFang, lampen, marke: liestZeit ? marke + '|' + zeitStufe : marke, zeit: liestZeit,
                gEm: eAlt ? eAlt.gEm : null, emVerl: eAlt ? eAlt.emVerl : null, emMarke: null };
          S.schattenFang = null;
          this.cache.set(it.c, e);
          M.neuRuhend++;
        }
        g = e.g;
        for (let q = 0; q < e.schatten.length; q += 5) schatten.push(e.schatten[q], e.schatten[q + 1], e.schatten[q + 2], e.schatten[q + 3], e.schatten[q + 4]);
        for (const l of e.lampen) lampen.push(l);
        // Nachts zusätzlich die Silhouette mit den leuchtenden Fenstern — nur einmal, dann liegt auch sie
        if (S.nightK > 0 && !this.OHNE_EM) {
          if (!e.gEm || e.emMarke !== e.marke) {
            const ge = e.gEm || new PIXI.Graphics();
            if (e.gEm) { ge.context.clear(); if (e.emVerl) for (const v of e.emVerl) v.destroy(); }
            e.emVerl = [];
            const pe = new HK.Gfx.PixiCtx(ge.context); pe.sammler = e.emVerl;
            pe.schwarz = true;
            const emVorher = S.em; S.em = pe;
            S.schattenFang = [];               // Schlagschatten gehören nicht in die Emissionsebene
            it.f(pe);
            S.schattenFang = null; S.em = emVorher;
            e.gEm = ge; e.emMarke = e.marke;
          }
          emKinder[eI++] = e.gEm;
        }
      } else if (it.s) {
        // Bewegte Gestalt: die Geometrie hängt nur am Aussehen, nicht am Ort. Gleich aussehende Figuren
        // teilen sich dieselbe Geometrie, und die Bewegung ist bloß eine Verschiebung.
        let gc = this.gestalten.get(it.s);
        if (gc === undefined) {
          gc = new PIXI.GraphicsContext();
          gc._verl = [];
          const pc = new HK.Gfx.PixiCtx(gc); pc.sammler = gc._verl;
          pc.setTransform(1, 0, 0, 1, -it.ap[0], -it.ap[1]);
          it.f(pc);
          this.gestalten.set(it.s, gc); M.neuGestalt++;
        } else {
          // Nach hinten stellen: eine Map behält die Einfügereihenfolge, und nur wenn wir sie beim
          // Gebrauch auffrischen, wirft das Aufräumen später wirklich das Ungebrauchte weg. Ohne das
          // fällt der Gang eines Fußgängers heraus, während er ihn noch geht, und muß neu entstehen.
          this.gestalten.delete(it.s); this.gestalten.set(it.s, gc);
        }
        // Ein Grafikobjekt je Aussehen und laufender Nummer. Nur so behält es seine Geometrie über die
        // Bilder hinweg; ein gemeinsamer Vorrat würde sie in jedem Bild neu zuweisen und alles zunichtemachen.
        const nr = (zaehler.get(it.s) || 0); zaehler.set(it.s, nr + 1);
        const fs = it.s + '#' + nr;
        g = this.figuren.get(fs);
        if (!g) { g = this.figurenFrei.pop() || new PIXI.Graphics(gc); g.context = gc; this.figuren.set(fs, g); }
        else if (g.context !== gc) g.context = gc;
        g.position.set(it.ap[0], it.ap[1]);
        this.figurenBenutzt.push(fs);
      } else {
        g = this.frei.pop() || new PIXI.Graphics();
        g.position.set(0, 0);
        if (g.context !== g._eigen) { g._eigen = g._eigen || new PIXI.GraphicsContext(); g.context = g._eigen; }
        g.clear();
        const pc = new HK.Gfx.PixiCtx(g.context); pc.fluechtig = true;
        it.f(pc);
        M.neuBewegt++;
        this.benutzt.push(g);
      }
      g.visible = true;
      kinder[i++] = g;
    }
    tick('durchlauf');
    // Reihenfolge setzen
    lage.removeChildren();
    for (let q = 0; q < i; q++) lage.addChild(kinder[q]);
    this.emObjekte.removeChildren();
    for (let q = 0; q < eI; q++) this.emObjekte.addChild(emKinder[q]);
    this.lampen = lampen;
    tick('einhaengen');

    // Schlagschatten aller ruhenden Objekte in einem Zug, mit dem Sonnenstand dieses Bildes
    const sg2 = this.lg.schatten; sg2.clear();
    const pcs = new HK.Gfx.PixiCtx(sg2.context); pcs.fluechtig = true;
    for (let q = 0; q < schatten.length; q += 5) {
      HK.Iso.shadow(pcs, schatten[q], schatten[q + 1], schatten[q + 2], schatten[q + 3], schatten[q + 4], sv.v, sv.a);
    }
    M.schattenZahl = schatten.length / 5;
    this.aufraeumen();
    tick('schatten');
  },

  /* Rauch, Möwen und der Auswahlrahmen */
  vordergrund(t) {
    const S = HK.Scene;
    const g = this.lg.vordergrund; g.clear();
    const pc = new HK.Gfx.PixiCtx(g.context); pc.fluechtig = true;
    for (const s of S.smoke) { pc.fillStyle = `rgba(215,215,220,${0.32 * (1 - s.age / 4.5)})`; pc.beginPath(); pc.arc(s.x, s.y, 1.5 + s.age * 2, 0, 6.28); pc.fill(); }
    pc.strokeStyle = 'rgba(255,255,255,0.9)'; pc.lineWidth = 1.1;
    for (const gu of S.gulls) { const x = gu.x + Math.cos(gu.a) * gu.r, y = gu.y + Math.sin(gu.a) * gu.r * 0.5, f = Math.sin(t * 8 + gu.a) * 2; pc.beginPath(); pc.moveTo(x - 4, y); pc.quadraticCurveTo(x - 2, y - 1.5 - f, x, y); pc.quadraticCurveTo(x + 2, y - 1.5 - f, x + 4, y); pc.stroke(); }
    const hb = S.hover && S.hover.building, sb = S.selected && HK.BUILDING[S.selected];
    if (sb && sb.kind !== 'water') S.outline(pc, sb, 'rgba(255,215,102,0.95)', 2 / S.cam.z);
    if (hb && hb !== sb && hb.kind !== 'water') S.outline(pc, hb, 'rgba(255,255,255,0.85)', 1.2 / S.cam.z);
  },

  /* Dunst, Lichtton, Wetter, Vignette, Korn */
  /* Dunst, Lichtton, Wetter, Vignette, Korn.
     Diese Ebenen sind großflächig und glatt — sie ändern sich über die Bildbreite kaum oder gar nicht.
     Darum entstehen sie in winzigen Zwischenbildern und werden aufgezogen: Ein Farbverlauf, der nur nach
     unten verläuft, braucht acht Bildpunkte Breite. Vorher lud ich hier über zwei Megabyte je Bild hoch. */
  luftUndLicht(P, W, H, t) {
    const S = HK.Scene;

    // Dunstschleier: verläuft nur senkrecht und multipliziert die Szene
    const G = S.GRADE, k = S.hazeK(), nah = G.near * k, fern = G.far * k;
    const dm = G.haze + '|' + nah.toFixed(3) + '|' + fern.toFixed(3);
    if (dm !== this._dunstMarke) {
      this._dunstMarke = dm;
      const dc = this.hilfsLeinwand('dunst', 8, 128), dg = dc.getContext('2d');
      const gr = dg.createLinearGradient(0, 0, 0, 128);
      gr.addColorStop(0, `rgba(${G.haze},${fern})`);
      gr.addColorStop(0.55, `rgba(${G.haze},${(fern + nah) / 2})`);
      gr.addColorStop(1, `rgba(${G.haze},${nah})`);
      dg.clearRect(0, 0, 8, 128); dg.fillStyle = gr; dg.fillRect(0, 0, 8, 128);
      this.setzeSprite(this.lg.dunst, dc, W, H, true);
    }
    this.lg.dunst.width = W; this.lg.dunst.height = H;
    this.lg.dunst.blendMode = 'multiply';

    // Streulicht bei trübem Wetter: eine einzige Farbe
    const hebung = 0.045 * (k - 1);
    this.lg.hebung.visible = hebung > 0.002;
    if (this.lg.hebung.visible) {
      if (!this._hebungFertig) {
        const hc = this.hilfsLeinwand('hebung', 4, 4), hg = hc.getContext('2d');
        hg.fillStyle = '#716c5b'; hg.fillRect(0, 0, 4, 4);
        this.setzeSprite(this.lg.hebung, hc, W, H, true); this._hebungFertig = true;
      }
      this.lg.hebung.width = W; this.lg.hebung.height = H;
      this.lg.hebung.blendMode = 'screen'; this.lg.hebung.alpha = hebung;
    }

    // Tageslicht-Ton und Morgen-/Abendrot: flache Fläche plus waagerechter Verlauf
    const st = S.sunT();
    const lm = P.tint.map(v => Math.round(v * 100) / 100).join() + '|' + (st === null ? 'x' : st.toFixed(3));
    if (lm !== this._luftMarke) {
      this._luftMarke = lm;
      const lc = this.hilfsLeinwand('luft', 256, 8), lg = lc.getContext('2d');
      lg.clearRect(0, 0, 256, 8);
      if (P.tint[3] > 0.005) { lg.fillStyle = S.rgb(P.tint, P.tint[3]); lg.fillRect(0, 0, 256, 8); }
      if (st !== null && Math.sin(st * Math.PI) < 0.45) {
        const g2 = lg.createLinearGradient(st < 0.5 ? 0 : 256, 0, st < 0.5 ? 256 : 0, 0);
        g2.addColorStop(0, `rgba(255,190,110,${0.14 * (1 - Math.sin(st * Math.PI) / 0.45)})`);
        g2.addColorStop(1, 'rgba(255,190,110,0)');
        lg.fillStyle = g2; lg.fillRect(0, 0, 256, 8);
      }
      this.setzeSprite(this.lg.luft, lc, W, H, true);
    }
    this.lg.luft.width = W; this.lg.luft.height = H;

    // Wetter
    const wg = this.lg.wetter; wg.clear();
    const wpc = new HK.Gfx.PixiCtx(wg.context); wpc.fluechtig = true;
    S.drawWeather(wpc, t);

    // Vignette: rund, darum im Seitenverhältnis des Bildes, aber klein
    const vw = 256, vh = Math.max(8, Math.round(256 * H / W));
    if (!this._vignFertig || this._vignW !== vw || this._vignH !== vh) {
      this._vignFertig = true; this._vignW = vw; this._vignH = vh;
      const vc = this.hilfsLeinwand('vignette', vw, vh), vg2 = vc.getContext('2d');
      vg2.clearRect(0, 0, vw, vh);
      vg2.setTransform(vw / W, 0, 0, vh / H, 0, 0);
      const rg = vg2.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95);
      rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(20,10,0,0.4)');
      vg2.fillStyle = rg; vg2.fillRect(0, 0, W, H);
      this.setzeSprite(this.lg.vignette, vc, W, H, true);
    }
    this.lg.vignette.width = W; this.lg.vignette.height = H;

    // Korn in voller Feinheit, einmal gekachelt
    if (!this._kornFertig) {
      const kc = this.hilfsLeinwand('korn', 960, 640), kg = kc.getContext('2d');
      for (let y = 0; y < 640; y += 160) for (let x = 0; x < 960; x += 240) kg.drawImage(S.grain, x, y);
      this.setzeSprite(this.lg.korn, kc, W, H, true); this._kornFertig = true;
    }
    this.lg.korn.width = W; this.lg.korn.height = H;
  },

  /* Der Schein der Fenster und Laternen. Die Emissionsebene entsteht in kleiner Auflösung; die
     Weichzeichnung macht die Grafikkarte, was sie im Gegensatz zur Leinwand fast nichts kostet. */
  EM_SCALE: 0.3,
  lampenTextur() {
    if (this._lampTex) return this._lampTex;
    const R = 64, c = this.hilfsLeinwand('lampe', R * 2, R * 2), g = c.getContext('2d');
    const gr = g.createRadialGradient(R, R, 1, R, R, R);
    gr.addColorStop(0, 'rgba(255,190,90,0.5)'); gr.addColorStop(0.3, 'rgba(255,170,70,0.18)'); gr.addColorStop(1, 'rgba(255,160,60,0)');
    g.fillStyle = gr; g.fillRect(0, 0, R * 2, R * 2);
    g.fillStyle = 'rgba(255,230,160,0.9)'; g.beginPath(); g.arc(R, R, 2.9, 0, 6.28); g.fill();
    this._lampTex = PIXI.Texture.from(c);
    return this._lampTex;
  },
  glanz(P, W, H) {
    const S = HK.Scene;
    const an = P.amb < 0.7;
    this.lg.glanz.visible = an;
    if (!an) return;
    const k = HK.clamp((0.7 - P.amb) / 0.4, 0, 1), EM = this.EM_SCALE;
    const ew = Math.max(2, Math.round(W * EM)), eh = Math.max(2, Math.round(H * EM));
    if (!this.emRT || this.emRT.width !== ew || this.emRT.height !== eh) {
      if (this.emRT) this.emRT.destroy(true);
      this.emRT = PIXI.RenderTexture.create({ width: ew, height: eh });
      this.emA.texture = this.emRT; this.emB.texture = this.emRT;
    }
    this.weltEm.scale.set(S.cam.z * EM);
    this.weltEm.position.set(-S.cam.x * S.cam.z * EM, -S.cam.y * S.cam.z * EM);
    this.app.renderer.render({ container: this.weltEm, target: this.emRT, clear: true });
    this.emA.width = W; this.emA.height = H; this.emA.alpha = 0.55 * k;
    this.emB.width = W; this.emB.height = H; this.emB.alpha = 0.8 * k;

    const tex = this.lampenTextur(), cz = S.cam.z, r = 40 * cz;
    let q = 0;
    for (const [lx, ly] of this.lampen) {
      const x = (lx - S.cam.x) * cz, y = (ly - S.cam.y) * cz;
      if (x < -r || y < -r || x > W + r || y > H + r) continue;
      let sp = this.lampenVorrat[q];
      if (!sp) { sp = this.lampenVorrat[q] = new PIXI.Sprite(tex); sp.blendMode = 'add'; this.lampenLage.addChild(sp); }
      sp.visible = true; sp.alpha = k; sp.width = r * 2; sp.height = r * 2; sp.position.set(x - r, y - r);
      q++;
    }
    for (let j = q; j < this.lampenVorrat.length; j++) this.lampenVorrat[j].visible = false;
  },

  /* Die Sammlung der Figuren-Geometrien wächst mit jeder neuen Erscheinung. Ist sie zu groß, fliegt
     das Älteste heraus — aber nur, was in diesem Bild nicht gebraucht wird, und immer samt der
     Grafikobjekte, die darauf zeigen. Sonst zeigt ein Grafikobjekt auf weggeworfene Geometrie. */
  aufraeumen() {
    if (this.gestalten.size <= this.GESTALT_MAX) return;
    const inGebrauch = new Set();
    for (const fs of this.figurenBenutzt) inGebrauch.add(fs.slice(0, fs.lastIndexOf('#')));
    let weg = this.gestalten.size - this.GESTALT_MAX;
    const raus = [];
    for (const schl of this.gestalten.keys()) {
      if (weg <= 0) break;
      if (inGebrauch.has(schl)) continue;
      raus.push(schl); weg--;
    }
    if (!raus.length) return;
    const fort = new Set(raus);
    for (const [fs, g] of this.figuren) {
      if (!fort.has(fs.slice(0, fs.lastIndexOf('#')))) continue;
      // Das Grafikobjekt wandert in den Vorrat. Es hier wegzuwerfen hilft nichts: es teilt sich die
      // Geometrie mit anderen, darum räumt Pixi beim Wegwerfen seine Puffer nicht mit ab. Erst
      // `unload` gibt sie zurück — und danach ist das Objekt wieder brauchbar.
      g.unload(); g.visible = false; g.removeFromParent();
      this.figuren.delete(fs);
      if (this.figurenFrei.length < 512) this.figurenFrei.push(g); else g.destroy();
    }
    for (const schl of raus) {
      const c = this.gestalten.get(schl);
      if (c._verl) for (const v of c._verl) v.destroy();
      c.destroy(); this.gestalten.delete(schl);
    }
  },

  fit() {
    if (!this.bereit) return;
    this.app.renderer.resolution = HK.Scene.RS;
    this.app.renderer.resize(HK.SCENE.W, HK.SCENE.H);
    this.app.canvas.style.width = '100%'; this.app.canvas.style.height = '100%';
  },
};
