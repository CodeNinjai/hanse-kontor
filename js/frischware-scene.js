/* Frischware auf der Karte: Hühnerhof, Gemüsegarten und Obstgarten im Jahreslauf, Hühner vor dem
   Hühnerhof, die Obstpflückerin mit ihrem Korb und eine Frischwarenbude auf dem Marktplatz.
   Zeichnen ändert den Spielstand nicht und zieht keine Zufallszahlen der Simulation. */
'use strict';
(() => {
  const S = HK.Scene, I = HK.Iso, A = HK.Art;
  // Farbtupfer der Saisonware: Frühjahr grün/weiß, Sommer rot, Herbst rot/grün, Winter blass.
  S.FRISCH_TUPFER = { spring: ['#7fa451', '#ece6cf', '#a9c46c'], summer: ['#b0302c', '#8a2622', '#7fa451'], autumn: ['#b8452f', '#86a65a', '#c9a84a'], winter: ['#cfc6b0', '#a58a6a', '#b9b3a3'] };

  /* Hühnerhof: kleines Stallhaus; Schlupfloch, Hühnerleiter und Eierkorb auf der Ostseite, wo die Hühner scharren */
  S.drawPoultry = function (c, b, st, season, sv) {
    // Das Stallhaus lässt rechts einen Streifen für Leiter und Eierkorb frei, damit alles in der Standfläche bleibt.
    const yy = b.y + b.d, xx = b.x + b.w - .32, winter = season === 'winter';
    this.drawHouse(c, { ...b, w: b.w - .32, kind: 'eave', noWindowsUpper: true }, st, season, sv, false);
    if (this.picking) return;
    // Schlupfloch mit Leiter auf der rechten Wand
    I.poly(c, [[xx + .006, b.y + .3, .05], [xx + .006, b.y + .48, .05], [xx + .006, b.y + .48, .22], [xx + .006, b.y + .3, .22]], '#3f2f22');
    for (let i = 0; i < 4; i++) I.line(c, [xx + .02 + i * .07, b.y + .32, .05 - i * .012], [xx + .02 + i * .07, b.y + .46, .05 - i * .012], '#9c8256', .8);
    I.line(c, [xx + .01, b.y + .3, .05], [xx + .29, b.y + .3, 0], '#8b7049', .9); I.line(c, [xx + .01, b.y + .48, .05], [xx + .29, b.y + .48, 0], '#8b7049', .9);
    // Nestkasten an der Vorderwand
    I.poly(c, [[b.x + .2, yy + .004, .17], [b.x + .62, yy + .004, .17], [b.x + .62, yy + .004, .34], [b.x + .2, yy + .004, .34]], '#8d7552', '#6f5c43', .6);
    for (const u of [.27, .41, .55]) I.poly(c, [[b.x + u - .04, yy + .005, .21], [b.x + u + .04, yy + .005, .21], [b.x + u + .04, yy + .005, .3], [b.x + u - .04, yy + .005, .3]], '#3e2f22');
    // Eierkorb neben dem Schlupfloch
    I.cylinder(c, xx + .14, b.y + .72, 0, .08, .07, '#a1834f', { segments: 8 });
    if (!winter) for (const [u, v] of [[-.03, -.01], [.025, .005], [0, .03]]) { const q = I.p(xx + .14 + u, b.y + .72 + v, .085); c.fillStyle = '#efe4c8'; c.beginPath(); c.ellipse(q[0], q[1], 1.4, 1.1, 0, 0, Math.PI * 2); c.fill(); }
  };

  /* Gemüsegarten: Beete mit Kohlköpfen und Bohnenstangen, im Frühjahr junge Triebe, im Winter kahl */
  S.drawGardenPlot = function (c, b, season) {
    const P = (u, v, z = 0) => [b.x + u, b.y + v, z], winter = season === 'winter';
    I.poly(c, [P(0, 0), P(b.w, 0), P(b.w, b.d), P(0, b.d)], winter ? '#cfccc0' : '#7e8a55');
    if (this.picking) return;
    const rows = 4, bw = b.d / rows;
    for (let r = 0; r < rows; r++) {
      const v0 = r * bw + .07, v1 = (r + 1) * bw - .07;
      I.poly(c, [P(.12, v0, .01), P(b.w - .45, v0, .01), P(b.w - .45, v1, .01), P(.12, v1, .01)], winter ? '#b5aea0' : '#6e5a3e');
      const vm = (v0 + v1) / 2;
      for (let u = .22; u < b.w - .5; u += .2) {
        const kind = r % 2 ? 'cabbage' : 'bean';
        if (winter) { const q = I.p(b.x + u, b.y + vm, .02); c.fillStyle = '#a49a86'; c.beginPath(); c.ellipse(q[0], q[1], 1.3, .7, 0, 0, Math.PI * 2); c.fill(); continue; }
        if (season === 'spring') { I.line(c, P(u, vm, .01), P(u - .02, vm, .09), '#8fb35a', .9); I.line(c, P(u, vm, .01), P(u + .025, vm, .08), '#a9c46c', .8); continue; }
        if (kind === 'cabbage') {
          const q = I.p(b.x + u, b.y + vm, .06);
          c.fillStyle = '#5d7d3c'; c.beginPath(); c.ellipse(q[0], q[1] + .6, 4.2, 2.6, 0, 0, Math.PI * 2); c.fill();
          c.fillStyle = season === 'autumn' ? '#9cbc6e' : '#86a65a'; c.beginPath(); c.ellipse(q[0] - .3, q[1] - .4, 3, 2, 0, 0, Math.PI * 2); c.fill();
          if (season === 'autumn' && r === 3) { c.fillStyle = '#9a5f87'; c.beginPath(); c.arc(q[0] + 4.5, q[1] + 1, 1.2, 0, Math.PI * 2); c.fill(); }
        } else {
          I.line(c, P(u, vm, 0), P(u, vm, .32), '#8b7049', .9);
          for (let k = 0; k < 3; k++) { const q = I.p(b.x + u + (k % 2 ? .02 : -.02), b.y + vm, .1 + k * .08); c.fillStyle = k % 2 ? '#6f9445' : '#8fb35a'; c.beginPath(); c.ellipse(q[0], q[1], 1.8, 1.2, 0, 0, Math.PI * 2); c.fill(); }
          if (season === 'summer') { const q = I.p(b.x + u + .03, b.y + vm, .18); c.fillStyle = '#c4c08a'; c.fillRect(q[0], q[1], .9, 2.2); }
        }
      }
    }
    // Flechtzaun an den Vorderkanten, kleiner Geräteschuppen hinten rechts
    for (const [a, z] of [[[0, b.d], [b.w, b.d]], [[b.w, 0], [b.w, b.d]]].map(e => [e, 0])) {
      const [p0, p1] = a, n = Math.ceil(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / .25);
      for (let i = 0; i <= n; i++) { const u = p0[0] + (p1[0] - p0[0]) * i / n, v = p0[1] + (p1[1] - p0[1]) * i / n; I.line(c, P(u, v, z), P(u, v, .2), '#7d6643', 1); }
      for (const h of [.08, .15]) I.line(c, P(...p0, h), P(...p1, h), '#9a8158', 1.1);
    }
    this.drawHouse(c, { x: b.x + b.w - .38, y: b.y + .08, w: .32, d: .42, h: .38, kind: 'eave', wall: '#a6946e', roof: '#6c5c44', noWindowsUpper: true }, HK.state, season, this.shadowVec(), false);
    this.barrel3(c, b.x + b.w - .2, b.y + .72, 0, .55);
  };

  /* Obstgarten: Baumreihen; Frühjahr Blüte, Sommer Kirschen, Herbst rote Äpfel, Winter kahl */
  S.drawOrchard = function (c, b, season) {
    const P = (u, v, z = 0) => [b.x + u, b.y + v, z], winter = season === 'winter';
    I.poly(c, [P(0, 0), P(b.w, 0), P(b.w, b.d), P(0, b.d)], winter ? '#d4d5cb' : '#7a9150');
    if (this.picking) return;
    const trees = []; for (const u of [.3, .95, 1.6]) for (const v of [.35, 1.2]) trees.push([u + (v > 1 ? .15 : 0), v]);
    trees.sort((p, q) => p[0] + p[1] - q[0] - q[1]);
    for (const [i, [u, v]] of trees.entries()) {
      const x = b.x + u, y = b.y + v, base = I.p(x, y, 0), top = I.p(x, y, .45);
      c.fillStyle = 'rgba(30,40,20,.18)'; c.beginPath(); c.ellipse(base[0] + 3, base[1] + 1, 8, 3, 0, 0, Math.PI * 2); c.fill();
      I.line(c, [x, y, 0], [x, y, .45], '#6c4a2f', 2.4);
      if (winter) {
        c.strokeStyle = '#6c5440'; c.lineWidth = 1;
        for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * .42; c.beginPath(); c.moveTo(top[0], top[1]); c.lineTo(top[0] + Math.cos(a) * 9, top[1] + Math.sin(a) * 7); c.stroke(); }
        continue;
      }
      const cx = top[0], cy = top[1] - 5, R = 8.5;
      c.fillStyle = 'rgba(37,50,26,.5)'; c.beginPath(); c.ellipse(cx, cy, R + .8, R * .78 + .8, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = season === 'spring' ? '#9fbf6a' : season === 'autumn' ? '#7f9a3e' : '#5f8a3a'; c.beginPath(); c.ellipse(cx, cy, R, R * .78, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = season === 'spring' ? '#b4cf80' : season === 'autumn' ? '#a3a84c' : '#77a04a'; c.beginPath(); c.ellipse(cx - 2, cy - 2.2, R * .55, R * .42, 0, 0, Math.PI * 2); c.fill();
      const dots = season === 'spring' ? ['#f4efe2', '#f1d6dc'] : season === 'summer' ? ['#b0302c', '#8a2622'] : ['#c0392b', '#d4573a'];
      const n = season === 'summer' ? (i % 2 ? 7 : 3) : 9;
      for (let k = 0; k < n; k++) { const a = k * 2.39 + i, r = 2.5 + (k * 3.7 % 5); c.fillStyle = dots[k % 2]; c.beginPath(); c.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r * .7, season === 'spring' ? 1.2 : 1.35, 0, Math.PI * 2); c.fill(); }
      if (season === 'autumn' && i % 2 === 0) for (const [du, dv] of [[.18, .08], [-.12, .15]]) { const q = I.p(x + du, y + dv, .015); c.fillStyle = '#b8452f'; c.beginPath(); c.arc(q[0], q[1], 1.3, 0, Math.PI * 2); c.fill(); }
    }
    // Leiter und Erntekörbe in der Erntezeit, Wurzelgraben als Zaun
    if (season === 'autumn' || season === 'summer') {
      const [u, v] = trees[trees.length - 2];
      I.line(c, P(u + .18, v + .2, 0), P(u + .04, v + .05, .55), '#9c8256', 1.2); I.line(c, P(u + .24, v + .14, 0), P(u + .1, v - .01, .55), '#9c8256', 1.2);
      for (let k = 1; k < 5; k++) { const f = k / 5; I.line(c, P(u + .18 - .14 * f, v + .2 - .15 * f, .55 * f), P(u + .24 - .14 * f, v + .14 - .15 * f, .55 * f), '#b49a6b', .8); }
      for (const [du, dv] of [[.55, .8], [1.25, .82]]) {
        I.cylinder(c, b.x + du, b.y + dv, 0, .08, .08, '#a1834f', { segments: 8 });
        const q = I.p(b.x + du, b.y + dv, .09); c.fillStyle = season === 'summer' ? '#a8322e' : '#c0392b'; for (const [ox, oy] of [[-1.3, 0], [1.2, -.3], [0, .7]]) { c.beginPath(); c.arc(q[0] + ox, q[1] + oy, 1.2, 0, Math.PI * 2); c.fill(); }
      }
    }
    for (const [p0, p1] of [[[0, b.d], [b.w, b.d]], [[b.w, 0], [b.w, b.d]]]) { I.line(c, P(...p0, .1), P(...p1, .1), '#8b7752', 1.1); for (let i = 0; i <= 8; i++) { const u = p0[0] + (p1[0] - p0[0]) * i / 8, v = p0[1] + (p1[1] - p0[1]) * i / 8; I.line(c, P(u, v, 0), P(u, v, .16), '#7d6643', 1); } }
  };

  /* Garten, Obstgarten und Bude folgen dem Jahreslauf der Spiellogik (HK.frischSaison), nicht S.season:
     im Mai trägt der Obstgarten schon Kirschen. Die Jahreszeit steht im Cache-Schlüssel, damit am Monatswechsel neu gezeichnet wird. */
  S.frischJahreszeit = function () { return HK.state ? HK.frischSaison(HK.monthOf(HK.state.day)) : this.season(); };
  const lightKey = S.houseLightKey;
  S.houseLightKey = function (b) { const k = lightKey.call(this, b); return ['garden', 'orchard', 'poultry'].includes(b?.kind) ? k + '|' + this.frischJahreszeit() : k; };
  const build = S.drawBuilding;
  S.drawBuilding = function (ctx, b, st, season, sv, separate) {
    if (b.kind === 'poultry') return this.drawPoultry(ctx, b, st, season, sv);
    if (b.kind === 'garden') return this.drawGardenPlot(ctx, b, this.frischJahreszeit());
    if (b.kind === 'orchard') return this.drawOrchard(ctx, b, this.frischJahreszeit());
    return build.call(this, ctx, b, st, season, sv, separate);
  };

  /* Die Obstbäuerin trägt einen Korb mit der Ware der Jahreszeit */
  const worker = S.drawRuralWorker;
  S.drawRuralWorker = function (c, w) {
    if (w.task !== 'fruit') return worker.call(this, c, w);
    const p = I.p(w.x, w.y, 0), season = this.frischJahreszeit(), lift = w.working ? Math.sin(w.phase || 0) * .03 : 0;
    this.drawPerson(c, ...p, w.color, 'porter', 1, false, '#d6b995', 0, 1, null, { look: w.look, hat: true, head: 0 }, .9);
    I.cylinder(c, w.x + .2, w.y + .07, .18 + lift, .08, .09, '#a1834f', { segments: 8 });
    I.line(c, [w.x + .12, w.y + .07, .27 + lift], [w.x + .2, w.y + .07, .42], '#8a6c40', 1);
    if (season === 'spring') return;
    const q = I.p(w.x + .2, w.y + .07, .28 + lift), col = S.FRISCH_TUPFER[season];
    for (const [k, [ox, oy]] of [[-1.4, 0], [1.2, -.4], [0, .5]].entries()) { c.fillStyle = col[k % col.length]; c.beginPath(); c.arc(q[0] + ox, q[1] + oy, 1.25, 0, Math.PI * 2); c.fill(); }
  };

  /* Vier Hühner scharren vor dem Hühnerhof, zusätzlich zu denen im Fischerdorf */
  const chickens = S.initChickens;
  S.initChickens = function () {
    chickens.call(this);
    const b = HK.BUILDING.poultry; if (!b) return;
    for (let i = 0; i < 4; i++) {
      const cx = b.x + b.w + .5 + (i > 1 ? .2 : 0), cy = b.y + .15 + (i % 2) * .45;
      this.chickens.push({ cx, cy, x: cx, y: cy, wait: Math.random() * 2, head: Math.random() * Math.PI * 2, phase: 0, moving: false, frisch: true });
    }
  };

  /* Frischwarenbude auf dem Marktplatz: siebte Bude neben den sechs Warenständen */
  HK.CITY_DETAILS.push({ id: 'market-fresh', kind: 'freshStall', x: 12.9, y: 8.15, w: .55, d: .4, district: 'market' });
  S.drawFreshStall = function (ctx, d, season) {
    const { x, y } = d, open = this.cityMarketOpen();
    I.box(ctx, x, y, 0, .55, .35, .3, { wall: '#84623f', top: '#9a7a4a' });
    for (const [px, py] of [[x, y], [x + .55, y], [x, y + .35], [x + .55, y + .35]]) I.line(ctx, [px, py, 0], [px, py, .7], '#72502e', 1.2);
    A.drawMarketCanopy(ctx, x, y, '#6f8a4f', season === 'winter');
    if (!open) { I.poly(ctx, [[x + .04, y + .26, .34], [x + .51, y + .26, .34], [x + .51, y + .39, .31], [x + .04, y + .39, .31]], '#87906d', '#6f7558', .55); return; }
    const col = this.FRISCH_TUPFER[season] || this.FRISCH_TUPFER.summer;
    for (let basket = 0; basket < 3; basket++) {
      const bx = x + .1 + basket * .17, by = y + .33;
      I.cylinder(ctx, bx, by, .31, .06, .06, '#a18b61', { segments: 8 });
      for (let k = 0; k < 4; k++) { const p = I.p(bx + (k % 2 - .5) * .045, by + (k > 1 ? .02 : -.015), .385 + (k === 3 ? .012 : 0)); ctx.fillStyle = col[(basket + k) % col.length]; ctx.beginPath(); ctx.ellipse(...p, season === 'autumn' && basket === 1 ? 1.7 : 1.25, .85, -.3, 0, Math.PI * 2); ctx.fill(); }
    }
    // Kohlköpfe oder Eierkorb unter dem Tisch zeigen den Vorrat
    const q = I.p(x + .45, y + .42, .06); ctx.fillStyle = season === 'spring' ? '#efe4c8' : season === 'winter' ? '#b9b3a3' : '#86a65a'; ctx.beginPath(); ctx.ellipse(q[0], q[1], 2.6, 1.7, 0, 0, Math.PI * 2); ctx.fill();
  };
  const detail = S.drawCityDetail;
  S.drawCityDetail = function (ctx, d, season, sv) {
    if (d.kind !== 'freshStall') return detail.call(this, ctx, d, season, sv);
    if (!this.picking) I.shadow(ctx, d.x, d.y, d.w, d.d, .5, sv.v, sv.a * .65);
    this.drawFreshStall(ctx, d, this.frischJahreszeit());
  };
  const items = S.cityItems;
  S.cityItems = function (list, st, season, t) {
    const n = list.length; items.call(this, list, st, season, t);
    for (let i = n; i < list.length; i++) if (list[i].cityDetail?.kind === 'freshStall') list[i].v = this.frischJahreszeit() + '|' + this.cityMarketOpen();
  };
})();
