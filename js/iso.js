/* Isometrische Projektion und Grundformen */
'use strict';
HK.Iso = {
  TW: 26, TH: 13, OX: 338, OY: 30, ZS: 28,
  p(x, y, z) { return [this.OX + (x - y) * this.TW, this.OY + (x + y) * this.TH - (z || 0) * this.ZS]; },
  path(ctx, pts) { ctx.beginPath(); pts.forEach((q, i) => { const s = this.p(q[0], q[1], q[2]); i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); }); ctx.closePath(); },
  poly(ctx, pts, fill, stroke, lw) { this.path(ctx, pts); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 0.8; ctx.stroke(); } },
  line(ctx, a, b, stroke, lw) { const A = this.p(a[0], a[1], a[2]), B = this.p(b[0], b[1], b[2]); ctx.strokeStyle = stroke; ctx.lineWidth = lw || 0.8; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke(); },
  shade(hex, f) { if (hex[0] !== '#') return hex; const n = parseInt(hex.slice(1), 16); const r = HK.clamp(((n >> 16) & 255) * f, 0, 255) | 0, g = HK.clamp(((n >> 8) & 255) * f, 0, 255) | 0, b = HK.clamp((n & 255) * f, 0, 255) | 0; return `rgb(${r},${g},${b})`; },
  /* Sonnenrichtung: linke (+y) Wand hell, rechte (+x) Wand dunkler */
  LIGHT: { top: 1.08, left: 1.0, right: 0.74, roofL: 1.0, roofR: 0.8, back: 0.6 },
  /* Schatten eines Quaders auf dem Boden (konvexe Hülle von Grundriss und verschobenem Grundriss) */
  shadow(ctx, x, y, w, d, h, vec, alpha) {
    if (HK.Scene && HK.Scene.picking) return;
    const pts = [[x, y, 0], [x + w, y, 0], [x + w, y + d, 0], [x, y + d, 0]].map(q => this.p(q[0], q[1], 0));
    const sh = [[x, y, 0], [x + w, y, 0], [x + w, y + d, 0], [x, y + d, 0]].map(q => this.p(q[0] + vec[0] * h, q[1] + vec[1] * h, 0));
    const hull = this.hull(pts.concat(sh));
    ctx.fillStyle = `rgba(15,10,5,${alpha})`; ctx.beginPath(); hull.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fill();
  },
  hull(points) {
    const pts = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lower = []; for (const p of pts) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
    const upper = []; for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
    upper.pop(); lower.pop(); return lower.concat(upper);
  },
  inHull(hull, px, py) { let inside = false; for (let i = 0, j = hull.length - 1; i < hull.length; j = i++) { const xi = hull[i][0], yi = hull[i][1], xj = hull[j][0], yj = hull[j][1]; if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) inside = !inside; } return inside; },
  /* Silhouette eines Quaders für Trefferprüfung */
  boxHull(x, y, w, d, h) { const c = []; for (const z of [0, h]) for (const q of [[x, y], [x + w, y], [x + w, y + d], [x, y + d]]) c.push(this.p(q[0], q[1], z)); return this.hull(c); },
  /* Quader: Deckel, linke (+y) und rechte (+x) Wand */
  box(ctx, x, y, z0, w, d, h, col, o) {
    o = o || {}; const L = this.LIGHT;
    if (!o.noTop) this.poly(ctx, [[x, y, z0 + h], [x + w, y, z0 + h], [x + w, y + d, z0 + h], [x, y + d, z0 + h]], this.shade(col.top || col.wall, L.top), o.stroke || 'rgba(30,20,10,0.45)');
    this.poly(ctx, [[x, y + d, z0], [x + w, y + d, z0], [x + w, y + d, z0 + h], [x, y + d, z0 + h]], this.shade(col.wall, L.left), o.stroke || 'rgba(30,20,10,0.45)');
    this.poly(ctx, [[x + w, y, z0], [x + w, y + d, z0], [x + w, y + d, z0 + h], [x + w, y, z0 + h]], this.shade(col.wall, L.right), o.stroke || 'rgba(30,20,10,0.45)');
  },
  /* Satteldach über Grundriss; ridge 'x' = First entlang x-Achse */
  gableRoof(ctx, x, y, z, w, d, rh, col, ridge, o) {
    o = o || {}; const L = this.LIGHT, ov = o.overhang === undefined ? 0.12 : o.overhang;
    if (ridge === 'x') {
      const ym = y + d / 2;
      // hintere Fläche (zeigt nach -y), dann vordere (+y); Giebelwände an x und x+w
      this.poly(ctx, [[x - ov, y - ov, z - ov * 0.5], [x + w + ov, y - ov, z - ov * 0.5], [x + w + ov, ym, z + rh], [x - ov, ym, z + rh]], this.shade(col, L.back));
      if (o.gableFill) { this.poly(ctx, [[x + w, y, z], [x + w, y + d, z], [x + w, ym, z + rh]], this.shade(o.gableFill, L.right), 'rgba(30,20,10,0.5)'); this.poly(ctx, [[x, y, z], [x, y + d, z], [x, ym, z + rh]], this.shade(o.gableFill, L.left)); }
      const front = [[x - ov, ym, z + rh], [x + w + ov, ym, z + rh], [x + w + ov, y + d + ov, z - ov * 0.5], [x - ov, y + d + ov, z - ov * 0.5]];
      this.poly(ctx, front, this.shade(col, L.roofL), 'rgba(30,20,10,0.5)');
      this.roofLines(ctx, front, o.rows || 7, o.tileDark);
      this.line(ctx, [x - ov, ym, z + rh], [x + w + ov, ym, z + rh], this.shade(col, 0.5), 1.6);
    } else {
      const xm = x + w / 2;
      this.poly(ctx, [[x - ov, y - ov, z - ov * 0.5], [xm, y - ov, z + rh], [xm, y + d + ov, z + rh], [x - ov, y + d + ov, z - ov * 0.5]], this.shade(col, L.back));
      if (o.gableFill) { this.poly(ctx, [[x, y + d, z], [x + w, y + d, z], [xm, y + d, z + rh]], this.shade(o.gableFill, L.left), 'rgba(30,20,10,0.5)'); }
      const right = [[xm, y - ov, z + rh], [x + w + ov, y - ov, z - ov * 0.5], [x + w + ov, y + d + ov, z - ov * 0.5], [xm, y + d + ov, z + rh]];
      this.poly(ctx, right, this.shade(col, L.roofR), 'rgba(30,20,10,0.5)');
      this.roofLines(ctx, right, o.rows || 7, o.tileDark);
      this.line(ctx, [xm, y - ov, z + rh], [xm, y + d + ov, z + rh], this.shade(col, 0.5), 1.6);
    }
  },
  roofLines(ctx, quad, rows, dark) {
    // Ziegelreihen: Linien zwischen den beiden Seitenkanten des Dachvierecks (First → Traufe)
    const A = quad[0], B = quad[1], C = quad[2], D = quad[3];
    ctx.strokeStyle = dark || 'rgba(0,0,0,0.28)'; ctx.lineWidth = 0.7;
    for (let i = 1; i < rows; i++) { const t = i / rows; const a = [A[0] + (D[0] - A[0]) * t, A[1] + (D[1] - A[1]) * t, A[2] + (D[2] - A[2]) * t], b = [B[0] + (C[0] - B[0]) * t, B[1] + (C[1] - B[1]) * t, B[2] + (C[2] - B[2]) * t]; this.line(ctx, a, b, ctx.strokeStyle, 0.7); }
    const ridgeLen = Math.hypot(...[0, 1].map(k => this.p(B[0], B[1], B[2])[k] - this.p(A[0], A[1], A[2])[k]));
    const n = Math.max(4, Math.round(ridgeLen / 6));
    for (let i = 1; i < n; i++) { const t = i / n; const a = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t], b = [D[0] + (C[0] - D[0]) * t, D[1] + (C[1] - D[1]) * t, D[2] + (C[2] - D[2]) * t]; this.line(ctx, a, b, 'rgba(0,0,0,0.10)', 0.6); }
  },
  /* Walmdach / Zeltdach als Pyramide */
  pyramid(ctx, x, y, z, w, d, rh, col) {
    const L = this.LIGHT, cx = x + w / 2, cy = y + d / 2;
    this.poly(ctx, [[x, y, z], [x + w, y, z], [cx, cy, z + rh]], this.shade(col, L.back));
    this.poly(ctx, [[x, y, z], [x, y + d, z], [cx, cy, z + rh]], this.shade(col, L.back * 1.1));
    this.poly(ctx, [[x + w, y, z], [x + w, y + d, z], [cx, cy, z + rh]], this.shade(col, L.roofR), 'rgba(30,20,10,0.5)');
    this.poly(ctx, [[x, y + d, z], [x + w, y + d, z], [cx, cy, z + rh]], this.shade(col, L.roofL), 'rgba(30,20,10,0.5)');
  },
  /* Zylinder (Turm): Mantel als Verlauf, Deckel */
  cylinder(ctx, cx, cy, z0, r, h, col, o) {
    o = o || {}; const T = this.p(cx, cy, z0 + h), B = this.p(cx, cy, z0);
    const rx = r * this.TW * 1.0, ry = r * this.TH * 1.0;
    ctx.fillStyle = this.shade(col, 0.85); ctx.beginPath(); ctx.ellipse(B[0], B[1], rx, ry, 0, 0, Math.PI); ctx.lineTo(T[0] - rx, T[1]); ctx.ellipse(T[0], T[1], rx, ry, 0, Math.PI, 0, true); ctx.closePath(); ctx.fill();
    const g = ctx.createLinearGradient(B[0] - rx, 0, B[0] + rx, 0); g.addColorStop(0, 'rgba(0,0,0,0.12)'); g.addColorStop(0.35, 'rgba(255,255,240,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0.42)'); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(30,20,10,0.45)'; ctx.lineWidth = 0.8; ctx.stroke();
    if (o.brick) { ctx.strokeStyle = 'rgba(0,0,0,0.14)'; for (let z = z0 + 0.12; z < z0 + h; z += 0.12) { const P = this.p(cx, cy, z); ctx.beginPath(); ctx.ellipse(P[0], P[1], rx, ry, 0, 0, Math.PI); ctx.stroke(); } }
    if (!o.noTop) { ctx.fillStyle = this.shade(col, 1.08); ctx.beginPath(); ctx.ellipse(T[0], T[1], rx, ry, 0, 0, 6.28); ctx.fill(); ctx.stroke(); }
  },
  cone(ctx, cx, cy, z0, r, h, col) {
    const T = this.p(cx, cy, z0 + h), B = this.p(cx, cy, z0), rx = r * this.TW, ry = r * this.TH;
    ctx.fillStyle = this.shade(col, 0.9); ctx.beginPath(); ctx.ellipse(B[0], B[1], rx, ry, 0, 0, Math.PI); ctx.lineTo(T[0], T[1]); ctx.closePath(); ctx.fill();
    const g = ctx.createLinearGradient(B[0] - rx, 0, B[0] + rx, 0); g.addColorStop(0, 'rgba(0,0,0,0.1)'); g.addColorStop(0.4, 'rgba(255,255,240,0.2)'); g.addColorStop(1, 'rgba(0,0,0,0.4)'); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(30,20,10,0.5)'; ctx.lineWidth = 0.8; ctx.stroke();
  },
  /* Fenster auf der linken (+y) Wand bei u (Anteil entlang x) oder rechten (+x) Wand bei v (entlang y) */
  windowL(ctx, x, y, d, z, u, wz, hz, o) { const yy = y + d; this.window3(ctx, [x + u - wz / 2, yy, z], [x + u + wz / 2, yy, z], [x + u + wz / 2, yy, z + hz], [x + u - wz / 2, yy, z + hz], o); },
  windowR(ctx, x, w, y, z, v, wz, hz, o) { const xx = x + w; this.window3(ctx, [xx, y + v - wz / 2, z], [xx, y + v + wz / 2, z], [xx, y + v + wz / 2, z + hz], [xx, y + v - wz / 2, z + hz], o); },
  window3(ctx, a, b, c, d, o) {
    o = o || {};
    const pts = [a, b, c, d];
    // Rahmen
    const ex = (q, k) => [q[0] + (q[0] - (a[0] + b[0] + c[0] + d[0]) / 4) * k, q[1] + (q[1] - (a[1] + b[1] + c[1] + d[1]) / 4) * k, q[2] + (q[2] - (a[2] + b[2] + c[2] + d[2]) / 4) * k];
    this.poly(ctx, pts.map(q => ex(q, 0.18)), o.frame || '#5a4028');
    const S = HK.Scene, lit = S && S.nightK && !S.picking && (((a[0] * 7.3 + a[1] * 5.1 + a[2] * 3.7) * 10) | 0) % 5 !== 0;
    const pane = lit ? '#e8a850' : '#23262d', shape = o.arch ? [a, b, c, [(c[0] + d[0]) / 2, (c[1] + d[1]) / 2, c[2] + (c[2] - b[2]) * 0.35], d] : pts;
    this.poly(ctx, shape, pane);
    if (lit) S.emit(shape, `rgba(255,${160 + ((a[0] * 13) | 0) % 30},${60 + ((a[1] * 17) | 0) % 30},${0.85 * S.nightK})`);
    // Glasreflex und Kreuz
    this.poly(ctx, [a, b, [b[0], b[1], b[2] + (c[2] - b[2]) * 0.5], [a[0], a[1], a[2] + (d[2] - a[2]) * 0.5]], 'rgba(150,185,215,0.45)');
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, a[2]], midT = [(c[0] + d[0]) / 2, (c[1] + d[1]) / 2, c[2]];
    this.line(ctx, mid, midT, 'rgba(230,220,200,0.85)', 0.6);
    this.line(ctx, [a[0], a[1], a[2] + (d[2] - a[2]) * 0.5], [b[0], b[1], b[2] + (c[2] - b[2]) * 0.5], 'rgba(230,220,200,0.85)', 0.6);
    if (o.shutters) { const sw = 0.35; const dx = (b[0] - a[0]), dy = (b[1] - a[1]); this.poly(ctx, [[a[0] - dx * sw, a[1] - dy * sw, a[2]], a, d, [d[0] - dx * sw, d[1] - dy * sw, d[2]]], o.shutters); this.poly(ctx, [b, [b[0] + dx * sw, b[1] + dy * sw, b[2]], [c[0] + dx * sw, c[1] + dy * sw, c[2]], c], this.shade(o.shutters, 0.85)); }
    if (o.flowers) { this.poly(ctx, [[a[0], a[1], a[2] - 0.02], [b[0], b[1], b[2] - 0.02], [b[0], b[1], b[2] - 0.1], [a[0], a[1], a[2] - 0.1]], '#4a6a2a'); const P = this.p(a[0], a[1], a[2]), Q = this.p(b[0], b[1], b[2]); for (let t = 0.1; t < 1; t += 0.22) { ctx.fillStyle = ['#c8102e', '#e0b040', '#e88'][Math.round(t * 10) % 3]; ctx.fillRect(P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t - 1.5, 1.6, 1.6); } }
  },
  doorL(ctx, x, y, d, z0, u, wz, hz, arch) { const yy = y + d; const a = [x + u - wz / 2, yy, z0], b = [x + u + wz / 2, yy, z0], c = [x + u + wz / 2, yy, z0 + hz], dd = [x + u - wz / 2, yy, z0 + hz]; this.poly(ctx, [a, b, c, dd].map(q => [q[0], q[1], q[2]]), '#5a4028'); const m = [(c[0] + dd[0]) / 2, yy, z0 + hz + (arch ? wz * 0.5 : 0)]; this.poly(ctx, arch ? [a, b, c, m, dd] : [a, b, c, dd], '#2b1d0e'); this.line(ctx, [x + u, yy, z0], [x + u, yy, z0 + hz], 'rgba(0,0,0,0.5)', 0.6); const P = this.p(x + u + wz * 0.3, yy, z0 + hz * 0.5); ctx.fillStyle = '#c9a24a'; ctx.fillRect(P[0], P[1], 1.5, 1.5); },
  doorR(ctx, x, w, y, z0, v, wz, hz, arch) { const xx = x + w; const a = [xx, y + v - wz / 2, z0], b = [xx, y + v + wz / 2, z0], c = [xx, y + v + wz / 2, z0 + hz], dd = [xx, y + v - wz / 2, z0 + hz]; this.poly(ctx, [a, b, c, dd], '#4a3320'); const m = [xx, y + v, z0 + hz + (arch ? wz * 0.5 : 0)]; this.poly(ctx, arch ? [a, b, c, m, dd] : [a, b, c, dd], '#22160b'); },
  /* Fachwerk auf einer Wand: vertikale Pfosten, Riegel, Streben */
  timberL(ctx, x, y, d, z0, w, h, n, col) { const yy = y + d; col = col || 'rgba(70,45,22,0.85)'; for (let i = 0; i <= n; i++) this.line(ctx, [x + w * i / n, yy, z0], [x + w * i / n, yy, z0 + h], col, 1.2); this.line(ctx, [x, yy, z0 + h * 0.5], [x + w, yy, z0 + h * 0.5], col, 1.1); this.line(ctx, [x, yy, z0 + h], [x + w, yy, z0 + h], col, 1.3); this.line(ctx, [x, yy, z0], [x + w, yy, z0], col, 1.3); this.line(ctx, [x, yy, z0 + h * 0.5], [x + w / n, yy, z0 + h], col, 1); this.line(ctx, [x + w, yy, z0 + h * 0.5], [x + w - w / n, yy, z0 + h], col, 1); this.line(ctx, [x, yy, z0], [x + w / n, yy, z0 + h * 0.5], col, 1); this.line(ctx, [x + w, yy, z0], [x + w - w / n, yy, z0 + h * 0.5], col, 1); },
  timberR(ctx, x, w, y, z0, d, h, n, col) { const xx = x + w; col = col || 'rgba(60,38,18,0.85)'; for (let i = 0; i <= n; i++) this.line(ctx, [xx, y + d * i / n, z0], [xx, y + d * i / n, z0 + h], col, 1.2); this.line(ctx, [xx, y, z0 + h * 0.5], [xx, y + d, z0 + h * 0.5], col, 1.1); this.line(ctx, [xx, y, z0 + h], [xx, y + d, z0 + h], col, 1.3); this.line(ctx, [xx, y, z0], [xx, y + d, z0], col, 1.3); this.line(ctx, [xx, y, z0 + h * 0.5], [xx, y + d / n, z0 + h], col, 1); this.line(ctx, [xx, y + d, z0 + h * 0.5], [xx, y + d - d / n, z0 + h], col, 1); },
  brickL(ctx, x, y, d, z0, w, h) { const yy = y + d; for (let z = z0 + 0.09; z < z0 + h; z += 0.09) this.line(ctx, [x, yy, z], [x + w, yy, z], 'rgba(0,0,0,0.16)', 0.5); },
  brickR(ctx, x, w, y, z0, d, h) { const xx = x + w; for (let z = z0 + 0.09; z < z0 + h; z += 0.09) this.line(ctx, [xx, y, z], [xx, y + d, z], 'rgba(0,0,0,0.2)', 0.5); },
  /* Treppengiebel auf einer Wand (Fläche über der Wand) */
  stepGableL(ctx, x, y, d, z0, w, rh, col, steps) { const yy = y + d, pts = [[x, yy, z0]]; steps = steps || 5; for (let i = 0; i <= steps; i++) { pts.push([x + (w / 2) * i / steps, yy, z0 + rh * i / steps]); pts.push([x + (w / 2) * (i + 1) / steps, yy, z0 + rh * i / steps]); } pts.length = pts.length - 1; for (let i = steps; i >= 0; i--) { pts.push([x + w / 2 + (w / 2) * (steps - i) / steps, yy, z0 + rh * i / steps]); pts.push([x + w / 2 + (w / 2) * (steps - i + 1) / steps, yy, z0 + rh * i / steps]); } pts.length = pts.length - 1; pts.push([x + w, yy, z0]); this.poly(ctx, pts, this.shade(col, this.LIGHT.left), 'rgba(30,20,10,0.55)'); return pts; },
  stepGableR(ctx, x, w, y, z0, d, rh, col, steps) { const xx = x + w, pts = [[xx, y, z0]]; steps = steps || 5; for (let i = 0; i <= steps; i++) { pts.push([xx, y + (d / 2) * i / steps, z0 + rh * i / steps]); pts.push([xx, y + (d / 2) * (i + 1) / steps, z0 + rh * i / steps]); } pts.length = pts.length - 1; for (let i = steps; i >= 0; i--) { pts.push([xx, y + d / 2 + (d / 2) * (steps - i) / steps, z0 + rh * i / steps]); pts.push([xx, y + d / 2 + (d / 2) * (steps - i + 1) / steps, z0 + rh * i / steps]); } pts.length = pts.length - 1; pts.push([xx, y + d, z0]); this.poly(ctx, pts, this.shade(col, this.LIGHT.right), 'rgba(30,20,10,0.55)'); return pts; },
};
