/* Isometrische Gebäude, Mauern, Bäume, Requisiten, Schiffe, Personen */
'use strict';
Object.assign(HK.Scene, {
  seed(b) { return ((b.x * 13 + b.y * 7) * 10) | 0; },
  chimney(ctx, x, y, z) { I.box(ctx, x, y, z, 0.14, 0.14, 0.32, { wall: '#5a4a44', top: '#3a2f2c' }); },
  gableFlag(ctx, x, y, z) { I.line(ctx, [x, y, z], [x, y, z + 0.6], '#3a2a1a', 1.2); this.pennant(ctx, x, y, z + 0.6, 0.45, 0.2, ['#e0b040'], true); },
  /* Fahne im Wind (weht nach +x), als Fläche im Raum: Streifen von oben nach unten, optional spitz zulaufend */
  pennant(ctx, x, y, z, len, h, cols, taper) {
    const t = this.time, n = 5, wave = f => Math.sin(t * 5 + x * 2.3 + y - f * 5) * 0.05 * f * len * 3 + f * f * 0.06;
    const edge = (fz) => { const pts = []; for (let i = 0; i <= n; i++) { const f = i / n; pts.push([x + len * f, y, z - wave(f) - fz * h * (taper ? (0.15 + 0.85 * (1 - f)) : 1)]); } return pts; };
    const m = cols.length;
    for (let k = 0; k < m; k++) { const top = edge(k / m), bot = edge((k + 1) / m).reverse(); I.poly(ctx, top.concat(bot), cols[k]); }
    I.path(ctx, edge(0).concat(edge(1).reverse())); ctx.strokeStyle = 'rgba(20,10,5,0.55)'; ctx.lineWidth = 0.6; ctx.stroke();
  },

  /* Wandausstattung: Fenster in Reihen auf beiden sichtbaren Wänden */
  facadeWindows(ctx, b, floors, o) {
    o = o || {}; const seed = this.seed(b), shut = [null, '#4f6f3f', '#7a3a3a', '#3a5a7a', '#6a5a2a'][seed % 5], flowers = seed % 2 === 0;
    const nL = Math.max(1, Math.round(b.w / 0.5)), nR = Math.max(1, Math.round(b.d / 0.5));
    for (let f = 0; f < floors; f++) {
      if (f > 0 && b.noWindowsUpper) continue;
      const z = 0.3 + f * (b.h / floors) * 0.95, hz = 0.32, wz = 0.24;
      for (let i = 0; i < nL; i++) { const u = b.w * (i + 0.5) / nL; if (f === 0 && o.doorL !== undefined && Math.abs(u - o.doorL) < 0.3) continue; I.windowL(ctx, b.x, b.y, b.d, z, u, wz, hz, { shutters: f === 0 ? shut : null, flowers: f === 1 && flowers, arch: o.arch }); }
      for (let i = 0; i < nR; i++) { const v = b.d * (i + 0.5) / nR; if (f === 0 && o.doorR !== undefined && Math.abs(v - o.doorR) < 0.3) continue; I.windowR(ctx, b.x, b.w, b.y, z, v, wz, hz, { shutters: f === 0 ? shut : null, flowers: f === 1 && flowers, arch: o.arch }); }
    }
  },
  wallTexture(ctx, b, brick, z0, h) {
    if (brick) { I.brickL(ctx, b.x, b.y, b.d, z0, b.w, h); I.brickR(ctx, b.x, b.w, b.y, z0, b.d, h); return; }
    const nL = Math.max(2, Math.round(b.w / 0.4)), nR = Math.max(2, Math.round(b.d / 0.4));
    I.timberL(ctx, b.x, b.y, b.d, z0, b.w, h, nL); I.timberR(ctx, b.x, b.w, b.y, z0, b.d, h, nR);
    // Backstein-Ausfachung in einzelnen Feldern
    const seed = this.seed(b); if (seed % 3 === 0) { for (let i = 0; i < nL; i++) if ((i + seed) % 2) { const u0 = b.x + b.w * i / nL, u1 = b.x + b.w * (i + 1) / nL; I.poly(ctx, [[u0, b.y + b.d, z0 + h * 0.5], [u1, b.y + b.d, z0 + h * 0.5], [u1, b.y + b.d, z0 + h], [u0, b.y + b.d, z0 + h]], 'rgba(162,74,58,0.55)'); } }
  },
  drawHouse(ctx, b, st, season, sv, gableKind) {
    const wall = b.wall || '#e2d4b4', brick = !!b.brick, roof = b.roof || (brick ? '#4e4650' : '#8f3f2e'), rh = Math.min(b.w, b.d) * 0.62;
    I.shadow(ctx, b.x, b.y, b.w, b.d, b.h + rh * 0.6, sv.v, sv.a);
    // Sockel und Wände
    I.box(ctx, b.x, b.y, 0, b.w, b.d, b.h, { wall: brick ? '#a24a3a' : (b.stone ? '#9a9284' : wall) }, { noTop: true });
    I.poly(ctx, [[b.x, b.y + b.d, 0], [b.x + b.w, b.y + b.d, 0], [b.x + b.w, b.y + b.d, 0.12], [b.x, b.y + b.d, 0.12]], 'rgba(60,50,40,0.5)'); I.poly(ctx, [[b.x + b.w, b.y, 0], [b.x + b.w, b.y + b.d, 0], [b.x + b.w, b.y + b.d, 0.12], [b.x + b.w, b.y, 0.12]], 'rgba(40,30,20,0.55)');
    if (b.stone) { for (let z = 0.15; z < b.h; z += 0.15) { I.line(ctx, [b.x, b.y + b.d, z], [b.x + b.w, b.y + b.d, z], 'rgba(0,0,0,0.18)', 0.5); I.line(ctx, [b.x + b.w, b.y, z], [b.x + b.w, b.y + b.d, z], 'rgba(0,0,0,0.22)', 0.5); } }
    else this.wallTexture(ctx, b, brick, 0.12, b.h - 0.12);
    // Vorkragung: Schattenband in halber Höhe
    if (!brick && !b.stone && b.h > 1.0) { I.poly(ctx, [[b.x, b.y + b.d, b.h * 0.5], [b.x + b.w, b.y + b.d, b.h * 0.5], [b.x + b.w, b.y + b.d, b.h * 0.5 - 0.06], [b.x, b.y + b.d, b.h * 0.5 - 0.06]], 'rgba(0,0,0,0.3)'); I.poly(ctx, [[b.x + b.w, b.y, b.h * 0.5], [b.x + b.w, b.y + b.d, b.h * 0.5], [b.x + b.w, b.y + b.d, b.h * 0.5 - 0.06], [b.x + b.w, b.y, b.h * 0.5 - 0.06]], 'rgba(0,0,0,0.35)'); }
    const floors = b.h > 1.0 ? 2 : 1;
    const doorR = b.d / 2, doorL = gableKind ? undefined : b.w / 2;
    this.facadeWindows(ctx, b, floors, { doorR, doorL, arch: brick || b.stone });
    I.doorR(ctx, b.x, b.w, b.y, 0, doorR, 0.3, 0.5, brick || b.stone);
    if (doorL !== undefined && b.w > 1.3) I.doorL(ctx, b.x, b.y, b.d, 0, doorL, 0.3, 0.5, brick);
    // Dach
    const ridge = gableKind ? 'x' : 'y';
    const snow = season === 'winter';
    const roofCol = snow ? '#e6eaee' : roof;
    if (brick) {
      // Treppengiebel überragen das Dach
      I.gableRoof(ctx, b.x, b.y, b.h, b.w, b.d, rh, roofCol, ridge, { overhang: 0.02, tileDark: 'rgba(0,0,0,0.25)' });
      if (ridge === 'x') { const pts = I.stepGableR(ctx, b.x, b.w, b.y, b.h, b.d, rh + 0.12, '#a24a3a', 5); I.brickR(ctx, b.x, b.w, b.y, b.h, b.d, rh); this.gableDeco(ctx, b, pts, 'R'); }
      else { const pts = I.stepGableL(ctx, b.x, b.y, b.d, b.h, b.w, rh + 0.12, '#a24a3a', 5); this.gableDeco(ctx, b, pts, 'L'); }
    } else {
      I.gableRoof(ctx, b.x, b.y, b.h, b.w, b.d, rh, roofCol, ridge, { gableFill: b.stone ? '#9a9284' : wall, overhang: 0.14 });
      // Giebelfachwerk
      if (!b.stone) { if (ridge === 'x') { I.line(ctx, [b.x + b.w, b.y + b.d / 2, b.h], [b.x + b.w, b.y + b.d / 2, b.h + rh], 'rgba(70,45,22,0.85)', 1.2); I.line(ctx, [b.x + b.w, b.y + b.d * 0.25, b.h + rh * 0.5], [b.x + b.w, b.y + b.d * 0.75, b.h + rh * 0.5], 'rgba(70,45,22,0.85)', 1); I.windowR(ctx, b.x, b.w, b.y, b.h + 0.1, b.d / 2, 0.2, 0.25, {}); } else { I.line(ctx, [b.x + b.w / 2, b.y + b.d, b.h], [b.x + b.w / 2, b.y + b.d, b.h + rh], 'rgba(70,45,22,0.85)', 1.2); I.line(ctx, [b.x + b.w * 0.25, b.y + b.d, b.h + rh * 0.5], [b.x + b.w * 0.75, b.y + b.d, b.h + rh * 0.5], 'rgba(70,45,22,0.85)', 1); I.windowL(ctx, b.x, b.y, b.d, b.h + 0.1, b.w / 2, 0.2, 0.25, {}); } }
    }
    // Gaube auf der sichtbaren Dachfläche
    if ((ridge === 'y' ? b.d : b.w) > 1.4 && this.seed(b) % 2) { if (ridge === 'y') { const gx = b.x + b.w * 0.72, gy = b.y + b.d * 0.5; I.box(ctx, gx, gy - 0.15, b.h + rh * 0.25, 0.3, 0.3, 0.28, { wall: wall }, { noTop: true }); I.pyramid(ctx, gx, gy - 0.15, b.h + rh * 0.25 + 0.28, 0.3, 0.3, 0.16, roofCol); I.windowR(ctx, gx, 0.3, gy - 0.15, b.h + rh * 0.25 + 0.05, 0.15, 0.14, 0.16, {}); } else { const gx = b.x + b.w * 0.5, gy = b.y + b.d * 0.72; I.box(ctx, gx - 0.15, gy, b.h + rh * 0.25, 0.3, 0.3, 0.28, { wall: wall }, { noTop: true }); I.pyramid(ctx, gx - 0.15, gy, b.h + rh * 0.25 + 0.28, 0.3, 0.3, 0.16, roofCol); I.windowL(ctx, gx - 0.15, gy, 0.3, b.h + rh * 0.25 + 0.05, 0.15, 0.14, 0.16, {}); } }
    this.chimney(ctx, b.x + b.w * 0.75, b.y + b.d * 0.4, b.h + rh * 0.55);
    if (b.hoist) { const gx = b.x + b.w, gy = b.y + b.d / 2; I.line(ctx, [gx, gy, b.h + rh + 0.05], [gx + 0.5, gy, b.h + rh - 0.05], '#3a2a1a', 2.5); I.line(ctx, [gx + 0.5, gy, b.h + rh - 0.05], [gx + 0.5, gy, b.h * 0.5 + Math.sin(this.time) * 0.15], '#222', 0.8); I.box(ctx, gx + 0.4, gy - 0.1, b.h * 0.5 + Math.sin(this.time) * 0.15 - 0.25, 0.22, 0.22, 0.25, { wall: '#9a7a4a', top: '#b08a50' }); }
    if (b.sign) { const p = I.p(b.x + b.w, b.y + b.d * 0.2, b.h * 0.7); ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + 12, p[1] - 4); ctx.stroke(); ctx.fillStyle = '#4a3320'; ctx.fillRect(p[0] + 8, p[1] - 4, 9, 8); ctx.fillStyle = '#f0e6cc'; ctx.fillRect(p[0] + 9, p[1] - 3, 7, 6); this.signIcon(ctx, b.sign, p[0] + 12.5, p[1]); }
    if (b.shabby) { I.poly(ctx, [[b.x, b.y + b.d, 0.12], [b.x + b.w, b.y + b.d, 0.12], [b.x + b.w, b.y + b.d, 0.45], [b.x, b.y + b.d, 0.45]], 'rgba(60,50,30,0.3)'); I.poly(ctx, [[b.x + b.w, b.y + 0.1, b.h * 0.5], [b.x + b.w, b.y + 0.5, b.h * 0.5], [b.x + b.w, b.y + 0.4, b.h * 0.95], [b.x + b.w, b.y + 0.15, b.h * 0.9]], 'rgba(40,60,30,0.28)'); this.barrel3(ctx, b.x + b.w + 0.12, b.y + b.d - 0.3, 0); }
    if (b.bigChimney) { I.box(ctx, b.x + b.w * 0.55, b.y + b.d * 0.35, b.h + rh * 0.3, 0.3, 0.3, 0.9, { wall: '#5a4a44', top: '#2a2420' }); }
    if (b.flagpole) { I.line(ctx, [b.x + b.w + 0.05, b.y + 0.15, 0], [b.x + b.w + 0.05, b.y + 0.15, 1.8], '#3a2a1a', 1.3); this.pennant(ctx, b.x + b.w + 0.05, b.y + 0.15, 1.8, 0.5, 0.3, ['#c8102e', '#f0ece0'], false); }
    if (b.id === 'bathhouse') for (let i = 0; i < 3; i++) { const p = I.p(b.x + b.w * 0.75, b.y + b.d * 0.4, b.h + rh * 0.55 + 0.3); ctx.fillStyle = `rgba(240,240,240,${0.25 - i * 0.06})`; ctx.beginPath(); ctx.arc(p[0] + 2 + Math.sin(this.time * 2 + i) * 3, p[1] - 6 - i * 7, 3 + i * 2, 0, 6.28); ctx.fill(); }
  },
  /* Zunftzeichen auf dem Aushängeschild */
  signIcon(ctx, kind, x, y) {
    ctx.save(); ctx.translate(x, y);
    switch (kind) {
      case 'tavern': ctx.fillStyle = '#c9a24a'; ctx.beginPath(); ctx.ellipse(0, 0, 3, 1.6, -0.4, 0, 6.28); ctx.fill(); break;
      case 'mug': ctx.fillStyle = '#7a5a3a'; ctx.fillRect(-2, -2.2, 3.4, 4.4); ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(1.8, 0, 1.3, -1.3, 1.3); ctx.stroke(); ctx.fillStyle = '#f4ead6'; ctx.fillRect(-2, -2.8, 3.4, 1); break;
      case 'pretzel': ctx.strokeStyle = '#a0682a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, 0.3, 2.3, 0.3, 2.85); ctx.moveTo(-2, 1.8); ctx.lineTo(1.4, -1.6); ctx.moveTo(2, 1.8); ctx.lineTo(-1.4, -1.6); ctx.stroke(); break;
      case 'cleaver': ctx.fillStyle = '#9a9a9a'; ctx.fillRect(-2.4, -2, 4, 3); ctx.fillStyle = '#5a3a1a'; ctx.fillRect(1.4, -0.4, 1.4, 3); break;
      case 'barrel': ctx.fillStyle = '#7a5a34'; ctx.beginPath(); ctx.ellipse(0, 0, 2.2, 2.7, 0, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#2a1a0a'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-2.1, -0.8); ctx.lineTo(2.1, -0.8); ctx.moveTo(-2.1, 0.8); ctx.lineTo(2.1, 0.8); ctx.stroke(); break;
      case 'fish': ctx.fillStyle = '#3f6a8a'; ctx.beginPath(); ctx.ellipse(-0.5, 0, 2.4, 1.3, 0, 0, 6.28); ctx.fill(); ctx.beginPath(); ctx.moveTo(1.6, 0); ctx.lineTo(3, -1.4); ctx.lineTo(3, 1.4); ctx.fill(); break;
      case 'sail': ctx.fillStyle = '#e8e0c8'; ctx.beginPath(); ctx.moveTo(-1.5, 2.5); ctx.lineTo(-1.5, -2.6); ctx.lineTo(2.4, 1.2); ctx.fill(); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-2.1, -2.8, 0.8, 5.6); break;
      case 'pot': ctx.fillStyle = '#b06a3a'; ctx.beginPath(); ctx.moveTo(-2, -1.5); ctx.lineTo(2, -1.5); ctx.lineTo(1.4, 2.4); ctx.lineTo(-1.4, 2.4); ctx.fill(); ctx.fillRect(-2.4, -2.4, 4.8, 1); break;
      case 'book': ctx.fillStyle = '#7a2a2a'; ctx.fillRect(-2.6, -2, 5.2, 4); ctx.fillStyle = '#f4ead6'; ctx.fillRect(-2.1, -1.5, 2, 3); ctx.fillRect(0.2, -1.5, 2, 3); break;
      case 'cross': ctx.fillStyle = '#c8102e'; ctx.fillRect(-0.7, -2.6, 1.4, 5.2); ctx.fillRect(-2.4, -0.7, 4.8, 1.4); break;
      default: ctx.fillStyle = '#e0b040'; ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, 6.28); ctx.fill();
    }
    ctx.restore();
  },
  gableDeco(ctx, b, pts, side) {
    // Blendnischen, Luken, Oculus, Giebelzier auf dem Treppengiebel
    const z0 = b.h, rh = Math.min(b.w, b.d) * 0.62 + 0.12;
    if (side === 'R') { const xx = b.x + b.w, cy = b.y + b.d / 2; I.poly(ctx, [[xx, cy - 0.12, z0 + rh * 0.35], [xx, cy + 0.12, z0 + rh * 0.35], [xx, cy + 0.12, z0 + rh * 0.62], [xx, cy - 0.12, z0 + rh * 0.62]], '#2b2620'); I.poly(ctx, [[xx, cy - 0.28, z0 + 0.1], [xx, cy - 0.06, z0 + 0.1], [xx, cy - 0.06, z0 + 0.5], [xx, cy - 0.28, z0 + 0.5]], '#e8dcc4'); I.poly(ctx, [[xx, cy + 0.06, z0 + 0.1], [xx, cy + 0.28, z0 + 0.1], [xx, cy + 0.28, z0 + 0.5], [xx, cy + 0.06, z0 + 0.5]], '#e8dcc4'); const p = I.p(xx, cy, z0 + rh * 0.82); ctx.fillStyle = '#2b2620'; ctx.beginPath(); ctx.ellipse(p[0], p[1], 2.2, 2.6, 0, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#c9c0ad'; ctx.lineWidth = 0.8; ctx.stroke(); I.line(ctx, [xx, cy, z0 + rh], [xx, cy, z0 + rh + 0.2], '#c9c0ad', 1.5); }
    else { const yy = b.y + b.d, cx = b.x + b.w / 2; I.poly(ctx, [[cx - 0.12, yy, z0 + rh * 0.35], [cx + 0.12, yy, z0 + rh * 0.35], [cx + 0.12, yy, z0 + rh * 0.62], [cx - 0.12, yy, z0 + rh * 0.62]], '#2b2620'); I.poly(ctx, [[cx - 0.28, yy, z0 + 0.1], [cx - 0.06, yy, z0 + 0.1], [cx - 0.06, yy, z0 + 0.5], [cx - 0.28, yy, z0 + 0.5]], '#e8dcc4'); I.poly(ctx, [[cx + 0.06, yy, z0 + 0.1], [cx + 0.28, yy, z0 + 0.1], [cx + 0.28, yy, z0 + 0.5], [cx + 0.06, yy, z0 + 0.5]], '#e8dcc4'); const p = I.p(cx, yy, z0 + rh * 0.82); ctx.fillStyle = '#2b2620'; ctx.beginPath(); ctx.ellipse(p[0], p[1], 2.2, 2.6, 0, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#c9c0ad'; ctx.lineWidth = 0.8; ctx.stroke(); I.line(ctx, [cx, yy, z0 + rh], [cx, yy, z0 + rh + 0.2], '#c9c0ad', 1.5); }
  },
  drawHall(ctx, b, st, season, sv) {
    this.drawHouse(ctx, b, st, season, sv, true);
    // Ecktürmchen
    const tx = b.x + b.w - 0.02, ty = b.y + 0.02;
    I.cylinder(ctx, tx, ty, b.h * 0.45, 0.2, b.h * 0.7, '#a24a3a', { brick: true, noTop: true }); I.cone(ctx, tx, ty, b.h * 1.15, 0.24, 0.5, season === 'winter' ? '#e6eaee' : '#3a3038');
    if (b.banner) { const p = I.p(b.x + b.w, b.y + b.d * 0.5, b.h * 0.85); ctx.fillStyle = b.banner === 'green' ? '#2a6a3a' : '#6a2a8a'; ctx.fillRect(p[0] - 3, p[1], 7, 18); ctx.fillStyle = '#e0b040'; ctx.fillRect(p[0] - 1, p[1] + 4, 3, 3); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(p[0] - 5, p[1] - 1, 11, 1.5); }
    if (b.id === 'bailiff') { const p = I.p(b.x + b.w, b.y + b.d * 0.5, 0.9); this.lamps.push([p[0] + 3, p[1]]); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(p[0] + 2, p[1] - 6, 1.5, 7); }
  },
  drawTownhall(ctx, b, st, season, sv) {
    const rh = 0.7, snow = season === 'winter', xx = b.x + b.w;
    I.shadow(ctx, b.x, b.y, b.w, b.d, b.h + 0.4, sv.v, sv.a);
    I.box(ctx, b.x, b.y, 0, b.w, b.d, b.h, { wall: '#a24a3a' }, { noTop: true });
    I.brickL(ctx, b.x, b.y, b.d, 0, b.w, b.h); I.brickR(ctx, b.x, b.w, b.y, 0, b.d, b.h);
    // Arkaden auf der Marktseite (+x), Fensterreihe darüber
    const n = 7; for (let i = 0; i < n; i++) { const v = b.d * (i + 0.5) / n; const a = [xx, b.y + v - 0.19, 0], bb = [xx, b.y + v + 0.19, 0], c = [xx, b.y + v + 0.19, 0.55], m = [xx, b.y + v, 0.72], d = [xx, b.y + v - 0.19, 0.55]; I.poly(ctx, [a, bb, c, m, d], '#2b2620'); I.poly(ctx, [a, bb, [bb[0], bb[1], 0.25], [a[0], a[1], 0.25]], 'rgba(255,220,160,0.12)'); }
    for (let i = 0; i < 8; i++) I.windowR(ctx, b.x, b.w, b.y, 0.95, b.d * (i + 0.5) / 8, 0.22, 0.42, { arch: true, frame: '#3a2a20' });
    for (let i = 0; i < 2; i++) I.windowL(ctx, b.x, b.y, b.d, 0.95, b.w * (i + 0.5) / 2, 0.22, 0.42, { arch: true, frame: '#3a2a20' });
    I.poly(ctx, [[xx, b.y, b.h - 0.06], [xx, b.y + b.d, b.h - 0.06], [xx, b.y + b.d, b.h], [xx, b.y, b.h]], '#c9c0ad');
    I.gableRoof(ctx, b.x, b.y, b.h, b.w, b.d, rh, snow ? '#e6eaee' : '#4e4650', 'y', { overhang: 0.02, rows: 6 });
    I.stepGableL(ctx, b.x, b.y, b.d, b.h, b.w, rh + 0.15, '#a24a3a', 5); I.brickL(ctx, b.x, b.y, b.d, b.h, b.w, rh); I.windowL(ctx, b.x, b.y, b.d, b.h + 0.15, b.w / 2, 0.2, 0.3, { arch: true });
    // Turm an der Marktseite
    const tx = xx - 0.55, ty = b.y + b.d / 2 - 0.3;
    I.box(ctx, tx, ty, 0, 0.6, 0.6, b.h + rh + 0.9, { wall: '#a24a3a' }, { noTop: true }); I.brickL(ctx, tx, ty, 0.6, 0, 0.6, b.h + rh + 0.9); I.brickR(ctx, tx, 0.6, ty, 0, 0.6, b.h + rh + 0.9);
    I.windowR(ctx, tx, 0.6, ty, b.h + rh + 0.3, 0.3, 0.18, 0.32, { arch: true }); const cp = I.p(tx + 0.6, ty + 0.3, b.h + rh + 0.05); ctx.fillStyle = '#e0b040'; ctx.beginPath(); ctx.arc(cp[0], cp[1], 4, 0, 6.28); ctx.fill(); ctx.fillStyle = '#2b2620'; ctx.beginPath(); ctx.arc(cp[0], cp[1], 2.8, 0, 6.28); ctx.fill();
    I.pyramid(ctx, tx - 0.05, ty - 0.05, b.h + rh + 0.9, 0.7, 0.7, 1.1, snow ? '#e6eaee' : '#3a3038');
    I.line(ctx, [tx + 0.3, ty + 0.3, b.h + rh + 2.0], [tx + 0.3, ty + 0.3, b.h + rh + 2.4], '#e0b040', 1.5); this.pennant(ctx, tx + 0.3, ty + 0.3, b.h + rh + 2.4, 0.5, 0.22, ['#c8102e'], true);
    for (const [lx, ly] of [[xx + 0.05, b.y + 0.1], [xx + 0.05, b.y + b.d - 0.1]]) { const p = I.p(lx, ly, 0.9); this.lamps.push([p[0], p[1]]); I.line(ctx, [lx, ly, 0], [lx, ly, 0.9], '#2a2420', 1.3); }
  },
  drawChurch(ctx, b, st, season, sv) {
    const snow = season === 'winter', tw = 0.8, nx = b.x + tw, nw = b.w - tw, rh = 1.3;
    I.shadow(ctx, b.x, b.y, b.w, b.d, b.h + rh * 0.5, sv.v, sv.a);
    // Turm zuerst: das davor liegende Schiff verdeckt seine rechte Seite unterhalb des Daches
    const th = 4.6, ty = b.y + b.d - tw;
    I.box(ctx, b.x, ty, 0, tw, tw, th, { wall: '#a24a3a' }, { noTop: true }); I.brickL(ctx, b.x, ty, tw, 0, tw, th); I.brickR(ctx, b.x, tw, ty, 0, tw, th);
    for (let k = 0; k < 4; k++) { I.windowL(ctx, b.x, ty, tw, 1.0 + k * 0.95, tw / 2, 0.2, 0.42, { arch: true, frame: '#3a2a20' }); if (k > 1) I.windowR(ctx, b.x, tw, ty, 1.0 + k * 0.95, tw / 2, 0.2, 0.42, { arch: true, frame: '#3a2a20' }); }
    I.poly(ctx, [[b.x, ty + tw, th - 0.1], [b.x + tw, ty + tw, th - 0.1], [b.x + tw, ty + tw, th], [b.x, ty + tw, th]], '#c9c0ad');
    I.pyramid(ctx, b.x - 0.05, ty - 0.05, th, tw + 0.1, tw + 0.1, 1.9, snow ? '#dfe3e8' : '#3a3038');
    const cp = I.p(b.x + tw / 2, ty + tw / 2, th + 1.9); ctx.strokeStyle = '#e0b040'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cp[0], cp[1]); ctx.lineTo(cp[0], cp[1] - 14); ctx.moveTo(cp[0] - 4, cp[1] - 10); ctx.lineTo(cp[0] + 4, cp[1] - 10); ctx.stroke(); ctx.fillStyle = '#e0b040'; ctx.beginPath(); ctx.arc(cp[0], cp[1], 2.5, 0, 6.28); ctx.fill();
    I.doorL(ctx, b.x, ty, tw, 0, tw / 2, 0.32, 0.62, true);
    // Schiff
    I.box(ctx, nx, b.y, 0, nw, b.d, b.h, { wall: '#a24a3a' }, { noTop: true }); I.brickL(ctx, nx, b.y, b.d, 0, nw, b.h); I.brickR(ctx, nx, nw, b.y, 0, b.d, b.h);
    for (let i = 0; i < 5; i++) { const u = nw * (i + 0.5) / 5; I.windowL(ctx, nx, b.y, b.d, 0.45, u, 0.22, 1.1, { arch: true, frame: '#3a2a20' }); I.box(ctx, nx + u + 0.28, b.y + b.d - 0.02, 0, 0.12, 0.18, b.h * 0.8, { wall: '#a24a3a', top: '#7e3a2c' }); }
    I.windowR(ctx, nx, nw, b.y, 0.5, b.d / 2, 0.3, 1.1, { arch: true, frame: '#3a2a20' });
    I.doorL(ctx, nx, b.y, b.d, 0, nw * 0.5 - 0.02, 0.4, 0.7, true);
    I.gableRoof(ctx, nx, b.y, b.h, nw, b.d, rh, snow ? '#e6eaee' : '#4e4650', 'x', { overhang: 0.06, rows: 10 });
    I.stepGableR(ctx, nx, nw, b.y, b.h, b.d, rh + 0.1, '#a24a3a', 6); I.brickR(ctx, nx, nw, b.y, b.h, b.d, rh); I.windowR(ctx, nx, nw, b.y, b.h + 0.2, b.d / 2, 0.2, 0.5, { arch: true });
    I.poly(ctx, [[nx + 0.1, b.y + b.d / 2, b.h + rh], [nx + nw - 0.1, b.y + b.d / 2, b.h + rh], [nx + nw - 0.1, b.y + b.d / 2, b.h + rh + 0.08], [nx + 0.1, b.y + b.d / 2, b.h + rh + 0.08]], '#c9c0ad');
  },
  drawHuts(ctx, b, st, season, sv) {
    const snow = season === 'winter';
    for (const [hx, hy, hw, hd, rot] of [[b.x, b.y, 0.7, 0.6, 'x'], [b.x + 0.8, b.y + 0.9, 0.65, 0.7, 'y'], [b.x + 0.05, b.y + 1.7, 0.75, 0.6, 'x'], [b.x + 1.0, b.y + 2.0, 0.55, 0.5, 'y']]) {
      I.shadow(ctx, hx, hy, hw, hd, 0.5, sv.v, sv.a); I.box(ctx, hx, hy, 0, hw, hd, 0.42, { wall: '#8a6a44' }, { noTop: true });
      for (let z = 0.08; z < 0.42; z += 0.09) { I.line(ctx, [hx, hy + hd, z], [hx + hw, hy + hd, z], 'rgba(0,0,0,0.25)', 0.5); I.line(ctx, [hx + hw, hy, z], [hx + hw, hy + hd, z], 'rgba(0,0,0,0.3)', 0.5); }
      // Reetdach: dick, weich überstehend, mit Firstkappe
      I.gableRoof(ctx, hx, hy, 0.42, hw, hd, Math.min(hw, hd) * 0.6, snow ? '#e6eaee' : '#a8905a', rot, { overhang: 0.14, rows: 5, gableFill: '#8a6a44', tileDark: 'rgba(90,60,20,0.35)' });
      if (rot === 'x') I.line(ctx, [hx - 0.1, hy + hd / 2, 0.42 + Math.min(hw, hd) * 0.6], [hx + hw + 0.1, hy + hd / 2, 0.42 + Math.min(hw, hd) * 0.6], '#6a5a3a', 2.2); else I.line(ctx, [hx + hw / 2, hy - 0.1, 0.42 + Math.min(hw, hd) * 0.6], [hx + hw / 2, hy + hd + 0.1, 0.42 + Math.min(hw, hd) * 0.6], '#6a5a3a', 2.2);
      I.doorR(ctx, hx, hw, hy, 0, hd / 2, 0.2, 0.32, false); I.windowL(ctx, hx, hy, hd, 0.14, hw / 2, 0.14, 0.14, {});
    }
    // Fischgestell, Netze, Rauchfeuer
    for (const u of [0.1, 0.5]) I.line(ctx, [b.x + 1.5, b.y + u, 0], [b.x + 1.5, b.y + u, 0.5], '#4a3a2a', 1.2); I.line(ctx, [b.x + 1.5, b.y + 0.1, 0.45], [b.x + 1.5, b.y + 0.5, 0.45], '#4a3a2a', 1);
    for (let k = 0.14; k < 0.5; k += 0.07) I.line(ctx, [b.x + 1.5, b.y + k, 0.45], [b.x + 1.5, b.y + k, 0.3], '#b8a888', 1.2);
    const fp = I.p(b.x + 0.9, b.y + 0.4, 0); ctx.fillStyle = '#4a3a2a'; ctx.beginPath(); ctx.ellipse(fp[0], fp[1], 5, 2.5, 0, 0, 6.28); ctx.fill(); if (!this.picking) { ctx.fillStyle = `rgba(255,140,40,${0.6 + Math.sin(this.time * 8) * 0.25})`; ctx.beginPath(); ctx.arc(fp[0], fp[1] - 2, 2, 0, 6.28); ctx.fill(); if (this.light() < 0.6) this.lamps.push([fp[0], fp[1] - 2]); }
  },
  drawYard(ctx, b) {
    I.poly(ctx, [[b.x, b.y, 0], [b.x + b.w, b.y, 0], [b.x + b.w, b.y + b.d, 0], [b.x, b.y + b.d, 0]], this.pat.planks, 'rgba(0,0,0,0.4)');
    // Kiel und Spanten
    I.line(ctx, [b.x + 0.2, b.y + 1.0, 0.25], [b.x + 1.6, b.y + 1.0, 0.25], '#c9a878', 2.5);
    for (let i = 0; i < 7; i++) { const x = b.x + 0.3 + i * 0.2, r = 0.45 - Math.abs(i - 3) * 0.06; const pts = []; for (let k = 0; k <= 6; k++) { const a = Math.PI + k * Math.PI / 6; pts.push([x, b.y + 1.0 + Math.cos(a) * r, 0.25 + Math.sin(a) * -r * 0.9 + 0.02]); } ctx.strokeStyle = '#c9a878'; ctx.lineWidth = 1.6; ctx.beginPath(); pts.forEach((q, k) => { const s = I.p(q[0], q[1], q[2]); k ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); }); ctx.stroke(); }
    for (let i = 0; i < 4; i++) I.box(ctx, b.x + 0.2, b.y + 1.7, i * 0.06, 1.2, 0.25, 0.06, { wall: '#7a5a34', top: '#9a7a4a' });
    I.box(ctx, b.x + 1.2, b.y + 0.1, 0, 0.55, 0.5, 0.5, { wall: '#8a6a44' }, { noTop: true }); I.gableRoof(ctx, b.x + 1.2, b.y + 0.1, 0.5, 0.55, 0.5, 0.3, '#5a4a3a', 'x', { overhang: 0.06, rows: 3, gableFill: '#8a6a44' });
    I.line(ctx, [b.x + 0.15, b.y + 0.15, 0], [b.x + 0.15, b.y + 0.15, 1.4], '#3a2a1a', 1.5); const p = I.p(b.x + 0.15, b.y + 0.15, 1.4); ctx.fillStyle = '#e0b040'; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + 9 + Math.sin(this.time * 4) * 2, p[1] + 3); ctx.lineTo(p[0], p[1] + 6); ctx.fill();
  },
  drawPlot(ctx, b, st, season, sv) {
    const ws = st.workshops[b.plot];
    if (!ws.type) {
      I.poly(ctx, [[b.x, b.y, 0], [b.x + b.w, b.y, 0], [b.x + b.w, b.y + b.d, 0], [b.x, b.y + b.d, 0]], 'rgba(90,70,40,0.2)');
      for (let u = 0; u <= b.w; u += 0.18) I.line(ctx, [b.x + u, b.y + b.d, 0], [b.x + u, b.y + b.d, 0.22], '#6a4a2a', 1.2); for (let v = 0; v <= b.d; v += 0.18) I.line(ctx, [b.x + b.w, b.y + v, 0], [b.x + b.w, b.y + v, 0.22], '#5a3a1a', 1.2);
      I.line(ctx, [b.x, b.y + b.d, 0.16], [b.x + b.w, b.y + b.d, 0.16], '#6a4a2a', 1); I.line(ctx, [b.x + b.w, b.y, 0.16], [b.x + b.w, b.y + b.d, 0.16], '#5a3a1a', 1);
      I.box(ctx, b.x + b.w - 0.45, b.y + 0.1, 0, 0.35, 0.35, 0.3, { wall: '#7a5a3a' }, { noTop: true }); I.pyramid(ctx, b.x + b.w - 0.45, b.y + 0.1, 0.3, 0.35, 0.35, 0.2, '#5a4a3a');
      const p = I.p(b.x + 0.3, b.y + b.d - 0.3, 0.3); ctx.fillStyle = '#c9c0ad'; ctx.fillRect(p[0] - 5, p[1] - 6, 10, 6); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(p[0] - 0.7, p[1], 1.4, 6);
      return;
    }
    const cols = { brewery: ['#d9b56b', '#6a3a2a'], smokehouse: ['#8a7a6a', '#3a3a3a'], weaver: ['#d9d0b8', '#4e4a52'], smithy: ['#9a9284', '#4e4a52'], saltworks: ['#e0dcd0', '#5b5560'] };
    const c = cols[ws.type];
    this.drawHouse(ctx, Object.assign({}, b, { wall: c[0], roof: c[1], stone: ws.type === 'smithy' }), st, season, sv, false);
    const fx = b.x + b.w + 0.15, fy = b.y + b.d * 0.5;
    if (ws.type === 'brewery') for (let i = 0; i < 3; i++) this.barrel3(ctx, b.x + b.w + 0.2, b.y + 0.2 + i * 0.22, 0);
    if (ws.type === 'smokehouse') { for (let k = 0; k < 5; k++) I.line(ctx, [b.x + b.w + 0.2, b.y + 0.2 + k * 0.15, 0.5], [b.x + b.w + 0.2, b.y + 0.2 + k * 0.15, 0.3], '#b8a888', 1.2); I.line(ctx, [b.x + b.w + 0.2, b.y + 0.1, 0.52], [b.x + b.w + 0.2, b.y + 0.95, 0.52], '#4a3a2a', 1); }
    if (ws.type === 'smithy') { const p = I.p(fx, fy, 0.25); const gl = ctx.createRadialGradient(p[0], p[1], 1, p[0], p[1], 14); gl.addColorStop(0, `rgba(255,140,40,${0.5 + Math.sin(this.time * 7) * 0.2})`); gl.addColorStop(1, 'rgba(255,100,20,0)'); ctx.fillStyle = gl; ctx.fillRect(p[0] - 14, p[1] - 14, 28, 28); I.box(ctx, b.x + b.w + 0.1, fy - 0.15, 0, 0.3, 0.3, 0.2, { wall: '#3a3a3a', top: '#555' }); }
    if (ws.type === 'weaver') for (let i = 0; i < 3; i++) I.box(ctx, b.x + b.w + 0.12, b.y + 0.2 + i * 0.25, 0, 0.15, 0.2, 0.15, { wall: ['#3b6ac2', '#c23b3b', '#e8e0c8'][i], top: ['#3b6ac2', '#c23b3b', '#e8e0c8'][i] });
    if (ws.type === 'saltworks') I.pyramid(ctx, b.x + b.w + 0.1, b.y + 0.3, 0, 0.4, 0.4, 0.3, '#f0eee8');
    const p = I.p(b.x + b.w + 0.02, b.y + 0.05, b.h); ctx.fillStyle = ws.idle ? '#a03030' : '#3a9a4a'; ctx.beginPath(); ctx.arc(p[0], p[1], 2.5, 0, 6.28); ctx.fill();
  },
  marketStalls(b) { return [[b.x + 0.25, b.y + 0.12, '#c23b3b'], [b.x + 1.25, b.y + 0.1, '#3b6ac2'], [b.x + 2.25, b.y + 0.12, '#3b9a4a'], [b.x + 2.5, b.y + 1.3, '#c29a3b'], [b.x + 2.5, b.y + 2.3, '#7a3bc2'], [b.x + 0.08, b.y + 1.5, '#c23b3b']].map(q => ({ x: q[0], y: q[1], c: q[2] })); },
  marketSacks(b) { return [[b.x + 0.4, b.y + 2.3], [b.x + 0.6, b.y + 2.35], [b.x + 2.0, b.y + 3.1]]; },
  drawStall(ctx, sd, i, st) {
    const x = sd.x, y = sd.y, mine = i < st.stalls, col = mine ? '#e0b040' : sd.c;
    I.box(ctx, x, y, 0, 0.55, 0.35, 0.3, { wall: '#7a5a3a', top: '#9a7a4a' });
    for (const [px, py] of [[x, y], [x + 0.55, y], [x, y + 0.35], [x + 0.55, y + 0.35]]) I.line(ctx, [px, py, 0], [px, py, 0.7], '#5a3a1a', 1.2);
    I.gableRoof(ctx, x, y, 0.7, 0.55, 0.35, 0.15, col, 'x', { overhang: 0.08, rows: 2, tileDark: 'rgba(255,255,255,0.35)' });
    const goods = [['#d9c56b', '#c9a24a'], ['#c94a3a', '#8ab04a'], ['#8ab04a', '#d9c56b'], ['#c9a24a', '#8a6a3a'], ['#c94a3a', '#7a3bc2'], ['#e8e0c8', '#3b6ac2']][i];
    for (let k = 0; k < 4; k++) { const p = I.p(x + 0.1 + k * 0.12, y + 0.4, 0.32); ctx.fillStyle = goods[k % 2]; ctx.beginPath(); ctx.arc(p[0], p[1], 2, 0, 6.28); ctx.fill(); }
    if (mine) this.gableFlag(ctx, x + 0.55, y, 0.75);
  },
  drawMarket() {},
  /* Lagerhalle: Traufenhaus mit Ladeluken statt Fenstern im Obergeschoss, Kran, Rampe */
  drawLonghouse(ctx, b, st, season, sv) {
    this.drawHouse(ctx, Object.assign({}, b, { noWindowsUpper: true }), st, season, sv, false);
    const yy = b.y + b.d, n = Math.max(2, Math.round(b.w / 0.8));
    for (let i = 0; i < n; i++) { const u = b.x + b.w * (i + 0.5) / n; if (b.low) continue; I.poly(ctx, [[u - 0.16, yy + 0.005, b.h * 0.55], [u + 0.16, yy + 0.005, b.h * 0.55], [u + 0.16, yy + 0.005, b.h * 0.92], [u - 0.16, yy + 0.005, b.h * 0.92]], '#3a2a1a', 'rgba(20,10,5,0.6)', 0.6); I.line(ctx, [u, yy + 0.01, b.h * 0.55], [u, yy + 0.01, b.h * 0.92], 'rgba(0,0,0,0.5)', 0.6); }
    if (b.low) { for (let u = 0.3; u < b.w; u += 0.6) I.poly(ctx, [[b.x + u - 0.1, yy + 0.005, 0.12], [b.x + u + 0.1, yy + 0.005, 0.12], [b.x + u + 0.1, yy + 0.005, 0.42], [b.x + u - 0.1, yy + 0.005, 0.42]], '#3a2a1a'); }
    if (!b.low) { I.poly(ctx, [[b.x + 0.2, yy, 0], [b.x + 0.8, yy, 0], [b.x + 0.8, yy + 0.35, 0], [b.x + 0.2, yy + 0.35, 0]], 'rgba(60,45,25,0.35)'); this.crate3(ctx, b.x + 0.25, yy + 0.05, 0, 0.22); }
  },
  /* Offene Markthalle: Pfosten, Satteldach, Tische mit Fisch */
  drawOpenHall(ctx, b, st, season, sv) {
    const rh = 0.45, snow = season === 'winter';
    I.shadow(ctx, b.x, b.y, b.w, b.d, b.h + rh * 0.5, sv.v, sv.a);
    I.poly(ctx, [[b.x, b.y, 0], [b.x + b.w, b.y, 0], [b.x + b.w, b.y + b.d, 0], [b.x, b.y + b.d, 0]], this.pat.stone, 'rgba(0,0,0,0.3)');
    // Tische hinten (werden von Pfosten und Dach überlagert)
    for (const [tx, ty] of [[b.x + 0.15, b.y + 0.2], [b.x + 0.85, b.y + 0.2], [b.x + 0.15, b.y + 0.65], [b.x + 0.85, b.y + 0.65]]) { I.box(ctx, tx, ty, 0.25, 0.5, 0.3, 0.08, { wall: '#7a5a3a', top: '#a08a5a' }); for (let k = 0; k < 4; k++) { const p = I.p(tx + 0.08 + k * 0.11, ty + 0.15, 0.36); ctx.fillStyle = k % 2 ? '#9fb3c8' : '#7d93a8'; ctx.beginPath(); ctx.ellipse(p[0], p[1], 3.2, 1.4, -0.4, 0, 6.28); ctx.fill(); ctx.fillStyle = '#2a2a2a'; ctx.fillRect(p[0] + 1.5, p[1] - 1, 0.9, 0.9); } }
    for (const [px, py] of [[b.x, b.y], [b.x + b.w / 2, b.y], [b.x + b.w, b.y], [b.x, b.y + b.d], [b.x + b.w / 2, b.y + b.d], [b.x + b.w, b.y + b.d]]) I.line(ctx, [px, py, 0], [px, py, b.h], '#4a3320', 2.6);
    I.line(ctx, [b.x, b.y + b.d, b.h - 0.05], [b.x + b.w, b.y + b.d, b.h - 0.05], '#3a2a1a', 1.8); I.line(ctx, [b.x + b.w, b.y, b.h - 0.05], [b.x + b.w, b.y + b.d, b.h - 0.05], '#3a2a1a', 1.8);
    I.gableRoof(ctx, b.x, b.y, b.h, b.w, b.d, rh, snow ? '#e6eaee' : '#7a6a4a', 'x', { overhang: 0.16, rows: 5, gableFill: '#8a6a44' });
    const p = I.p(b.x + b.w, b.y + b.d * 0.5, b.h + 0.1); ctx.fillStyle = '#f0e6cc'; ctx.fillRect(p[0] - 6, p[1] - 4, 12, 7); ctx.fillStyle = '#3f6a8a'; ctx.beginPath(); ctx.ellipse(p[0], p[1] - 0.5, 4, 1.8, -0.3, 0, 6.28); ctx.fill();
    const gullP = I.p(b.x + 0.3, b.y - 0.1, b.h + rh + 0.05); ctx.fillStyle = '#f0ece0'; ctx.beginPath(); ctx.ellipse(gullP[0], gullP[1], 2.5, 1.8, 0, 0, 6.28); ctx.fill();
  },
  /* Kloster: Kapelle mit Dachreiter, Konventsflügel, Kreuzgang mit Garten und Brunnen */
  drawMonastery(ctx, b, st, season, sv) {
    const snow = season === 'winter';
    I.shadow(ctx, b.x, b.y, b.w, b.d, b.h + 0.6, sv.v, sv.a);
    // Kapelle hinten über die ganze Breite (First entlang x), Dachreiter mit Glocke
    const cd = 0.95;
    this.drawHouse(ctx, { id: 'monastery_c', x: b.x, y: b.y, w: b.w, d: cd, h: b.h + 0.2, brick: true, roof: '#4e4650' }, st, season, sv, true);
    for (let i = 0; i < 4; i++) I.windowL(ctx, b.x, b.y, cd, 0.35, b.w * (i + 0.5) / 4, 0.2, 0.9, { arch: true, frame: '#3a2a20' });
    const rh = Math.min(b.w, cd) * 0.62, tx = b.x + b.w * 0.5 - 0.14, ty = b.y + cd * 0.5 - 0.14, tz = b.h + 0.2 + rh * 0.85;
    I.box(ctx, tx, ty, tz, 0.28, 0.28, 0.5, { wall: '#5a4a44' }, { noTop: true }); const bp = I.p(tx + 0.14, ty + 0.28, tz + 0.25); ctx.fillStyle = '#c9a24a'; ctx.beginPath(); ctx.arc(bp[0], bp[1], 2.2, 0, 6.28); ctx.fill();
    I.pyramid(ctx, tx - 0.04, ty - 0.04, tz + 0.5, 0.36, 0.36, 0.55, snow ? '#e6eaee' : '#3a3038');
    const cp = I.p(tx + 0.14, ty + 0.14, tz + 1.05); ctx.strokeStyle = '#e0b040'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(cp[0], cp[1]); ctx.lineTo(cp[0], cp[1] - 9); ctx.moveTo(cp[0] - 3, cp[1] - 6.5); ctx.lineTo(cp[0] + 3, cp[1] - 6.5); ctx.stroke();
    // Konventsflügel vorne links, Kreuzgarten vorne rechts mit Mauer, Brunnen und Baum
    const ww = 1.2, gy = b.y + cd + 0.05, gd = b.d - cd - 0.05, gx = b.x + ww + 0.1, gw = b.w - ww - 0.1;
    this.drawHouse(ctx, { id: 'monastery_w', x: b.x, y: gy, w: ww, d: gd, h: b.h - 0.3, brick: true, roof: '#4e4650' }, st, season, sv, false);
    I.poly(ctx, [[gx, gy, 0], [gx + gw, gy, 0], [gx + gw, gy + gd, 0], [gx, gy + gd, 0]], snow ? this.pat.snow : this.pat.grass);
    I.poly(ctx, [[gx + 0.15, gy + 0.15, 0.005], [gx + gw - 0.15, gy + 0.15, 0.005], [gx + gw - 0.15, gy + gd - 0.15, 0.005], [gx + 0.15, gy + gd - 0.15, 0.005]], 'rgba(0,0,0,0)', 'rgba(120,100,60,0.5)', 0.8);
    I.cylinder(ctx, gx + gw * 0.5, gy + gd * 0.5, 0, 0.14, 0.2, '#8f887a', { brick: true }); this.drawTree(ctx, gx + 0.3, gy + 0.25, 0.26, season, sv);
    for (let v = 0.12; v < gd; v += 0.24) I.line(ctx, [gx + gw, gy + v, 0], [gx + gw, gy + v, 0.42], '#7d766a', 2.2);
    for (let u = 0.12; u < gw; u += 0.24) I.line(ctx, [gx + u, gy + gd, 0], [gx + u, gy + gd, 0.42], '#8f887a', 2.2);
    I.box(ctx, gx, gy + gd - 0.06, 0.42, gw + 0.06, 0.06, 0.07, { wall: '#8f887a', top: '#a9a292' }); I.box(ctx, gx + gw - 0.06, gy, 0.42, 0.06, gd, 0.07, { wall: '#7d766a', top: '#a9a292' });
    if (!this.picking) { const mp = I.p(gx + gw - 0.35, gy + gd - 0.25, 0); this.drawPerson(ctx, mp[0], mp[1], '#4a3a2a', 'monk', 1, false, '#e8c39e', 0, -1, null, null, 0.8); }
  },
  /* Spital: Backsteinhalle mit Kreuz am Giebel und Glockengiebel, Kranke auf Bänken */
  drawHospital(ctx, b, st, season, sv) {
    this.drawHouse(ctx, Object.assign({}, b, { brick: true, roof: '#4e4650' }), st, season, sv, false);
    const rh = Math.min(b.w, b.d) * 0.62, cx = b.x + b.w / 2, yy = b.y + b.d;
    I.line(ctx, [cx, yy + 0.02, b.h + rh - 0.1], [cx, yy + 0.02, b.h + rh + 0.4], '#e0b040', 2); I.line(ctx, [cx - 0.1, yy + 0.02, b.h + rh + 0.25], [cx + 0.1, yy + 0.02, b.h + rh + 0.25], '#e0b040', 2);
    I.poly(ctx, [[b.x + b.w + 0.005, b.y + b.d * 0.5 - 0.18, 0.95], [b.x + b.w + 0.005, b.y + b.d * 0.5 + 0.18, 0.95], [b.x + b.w + 0.005, b.y + b.d * 0.5 + 0.18, 1.2], [b.x + b.w + 0.005, b.y + b.d * 0.5 - 0.18, 1.2]], '#f0e6cc'); I.poly(ctx, [[b.x + b.w + 0.01, b.y + b.d * 0.5 - 0.04, 0.97], [b.x + b.w + 0.01, b.y + b.d * 0.5 + 0.04, 0.97], [b.x + b.w + 0.01, b.y + b.d * 0.5 + 0.04, 1.18], [b.x + b.w + 0.01, b.y + b.d * 0.5 - 0.04, 1.18]], '#c8102e'); I.poly(ctx, [[b.x + b.w + 0.01, b.y + b.d * 0.5 - 0.14, 1.04], [b.x + b.w + 0.01, b.y + b.d * 0.5 + 0.14, 1.04], [b.x + b.w + 0.01, b.y + b.d * 0.5 + 0.14, 1.11], [b.x + b.w + 0.01, b.y + b.d * 0.5 - 0.14, 1.11]], '#c8102e');
    I.box(ctx, b.x + 0.2, yy + 0.12, 0, 0.7, 0.18, 0.18, { wall: '#7a5a3a', top: '#a08a5a' });
    if (!this.picking) { const p1 = I.p(b.x + 0.45, yy + 0.32, 0); this.drawPerson(ctx, p1[0], p1[1], '#8a8a7a', 'beggar', 1, false, '#d9a98a', 0, 1, null, null, 0.8); }
  },
  drawGate(ctx, b, st, season, sv) {
    I.shadow(ctx, b.x, b.y, b.w, b.d, b.h, sv.v, sv.a);
    I.box(ctx, b.x, b.y, 0, b.w, b.d, b.h, { wall: '#736d63' }, { stroke: 'rgba(0,0,0,0)', noTop: true }); this.masonry(ctx, true, true, b.x, b.y, b.w, b.d, 0, b.h);
    // Torbogen auf der Außenseite (+x) und Innenseite
    const cy = b.y + b.d / 2; I.poly(ctx, [[b.x + b.w, cy - 0.3, 0], [b.x + b.w, cy + 0.3, 0], [b.x + b.w, cy + 0.3, 0.6], [b.x + b.w, cy, 0.85], [b.x + b.w, cy - 0.3, 0.6]], '#1e1a18');
    I.poly(ctx, [[b.x + b.w, cy - 0.22, 0], [b.x + b.w, cy + 0.22, 0], [b.x + b.w, cy + 0.22, 0.5], [b.x + b.w, cy - 0.22, 0.5]], 'rgba(255,240,200,0.14)');
    // Zinnen und Dach
    I.box(ctx, b.x, b.y, b.h, b.w, b.d, 0.1, { wall: '#736d63', top: '#7d776c' }, { stroke: 'rgba(0,0,0,0)' }); for (let u = 0.04; u < b.w - 0.2; u += 0.4) I.box(ctx, b.x + u, b.y + b.d - 0.16, b.h + 0.1, 0.24, 0.16, 0.3, { wall: '#736d63', top: '#8a847a' }, { stroke: 'rgba(0,0,0,0.35)' }); for (let v = 0.04; v < b.d - 0.2; v += 0.4) I.box(ctx, b.x + b.w - 0.16, b.y + v, b.h + 0.1, 0.16, 0.24, 0.3, { wall: '#736d63', top: '#8a847a' }, { stroke: 'rgba(0,0,0,0.35)' });
    I.pyramid(ctx, b.x + 0.12, b.y + 0.12, b.h + 0.4, b.w - 0.24, b.d - 0.24, 1.0, season === 'winter' ? '#e6eaee' : '#3a3038');
    I.windowR(ctx, b.x, b.w, b.y, 1.1, cy, 0.18, 0.3, { arch: true });
    I.poly(ctx, [[b.x + b.w + 0.01, cy - 0.16, 1.5], [b.x + b.w + 0.01, cy + 0.16, 1.5], [b.x + b.w + 0.01, cy + 0.16, 1.3], [b.x + b.w + 0.01, cy - 0.16, 1.3]], '#c8102e'); I.poly(ctx, [[b.x + b.w + 0.01, cy - 0.16, 1.3], [b.x + b.w + 0.01, cy + 0.16, 1.3], [b.x + b.w + 0.01, cy + 0.16, 1.12], [b.x + b.w + 0.01, cy - 0.16, 1.12]], '#f0ece0'); I.line(ctx, [b.x + b.w + 0.02, cy - 0.2, 1.5], [b.x + b.w + 0.02, cy + 0.2, 1.5], '#3a2a1a', 1.2);
    const lp = I.p(b.x + b.w + 0.05, cy - 0.45, 0.8), lp2 = I.p(b.x + b.w + 0.05, cy + 0.45, 0.8); this.lamps.push([lp[0], lp[1]], [lp2[0], lp2[1]]);
  },
  masonry(ctx, faceL, faceR, x, y, w, d, z0, h) {
    // Steinfugen: waagerechte Lagen und versetzte Stoßfugen auf beiden sichtbaren Flächen
    const course = 0.13; let row = 0;
    for (let z = z0 + course; z < z0 + h; z += course, row++) {
      if (faceL) { I.line(ctx, [x, y + d, z], [x + w, y + d, z], 'rgba(0,0,0,0.28)', 0.6); I.line(ctx, [x, y + d, z + 0.02], [x + w, y + d, z + 0.02], 'rgba(255,255,255,0.07)', 0.6); for (let u = (row % 2) * 0.17; u < w; u += 0.34) I.line(ctx, [x + u, y + d, z - course], [x + u, y + d, z], 'rgba(0,0,0,0.22)', 0.6); }
      if (faceR) { I.line(ctx, [x + w, y, z], [x + w, y + d, z], 'rgba(0,0,0,0.32)', 0.6); for (let v = (row % 2) * 0.17; v < d; v += 0.34) I.line(ctx, [x + w, y + v, z - course], [x + w, y + v, z], 'rgba(0,0,0,0.26)', 0.6); }
    }
    // Feuchte, dunkler Sockel
    if (faceL) I.poly(ctx, [[x, y + d, z0], [x + w, y + d, z0], [x + w, y + d, z0 + 0.22], [x, y + d, z0 + 0.22]], 'rgba(20,20,15,0.22)');
    if (faceR) I.poly(ctx, [[x + w, y, z0], [x + w, y + d, z0], [x + w, y + d, z0 + 0.22], [x + w, y, z0 + 0.22]], 'rgba(20,20,15,0.26)');
  },
  wallSegments() {
    const segs = [], W = HK.WORLD, t = 0.6, h = 1.35, stone = { wall: '#736d63', top: '#8a847a' }, ns = { stroke: 'rgba(0,0,0,0)' };
    const parapet = (ctx, x, y, w, d, along) => {
      // Wehrgang: Brüstung mit Zinnen an der sichtbaren Außenkante
      const L = along ? w : d, ph = 0.12, mh = 0.34, mw = 0.24, gap = 0.16;
      if (along) { I.box(ctx, x, y + d - 0.16, h, w, 0.16, ph, stone, ns); for (let u = 0.04; u + mw <= L; u += mw + gap) I.box(ctx, x + u, y + d - 0.16, h + ph, mw, 0.16, mh, stone, { stroke: 'rgba(0,0,0,0.35)' }); I.box(ctx, x, y, h, w, 0.14, ph + 0.1, stone, ns); }
      else { I.box(ctx, x + w - 0.16, y, h, 0.16, d, ph, stone, ns); for (let v = 0.04; v + mw <= L; v += mw + gap) I.box(ctx, x + w - 0.16, y + v, h + ph, 0.16, mw, mh, stone, { stroke: 'rgba(0,0,0,0.35)' }); I.box(ctx, x, y, h, 0.14, d, ph + 0.1, stone, ns); }
    };
    const seg = (x, y, w, d, k) => segs.push({ k, f: (ctx, sv) => { I.box(ctx, x, y, 0, w, d, h, stone, ns); this.masonry(ctx, true, true, x, y, w, d, 0, h); I.poly(ctx, [[x, y, h], [x + w, y, h], [x + w, y + d, h], [x, y + d, h]], '#7d776c'); parapet(ctx, x, y, w, d, w > d); } });
    for (let x = W.COAST_X + 0.5; x < W.WALL_E; x += 2) { const x1 = Math.min(x + 2, W.WALL_E); if (x < 15.3 && x1 > 15.7) { seg(x, W.WALL_N - t, 15.3 - x, t, x + 2 + W.WALL_N); seg(15.7, W.WALL_N - t, x1 - 15.7, t, x + 2 + W.WALL_N); } else seg(x, W.WALL_N - t, x1 - x, t, x + 2 + W.WALL_N); }
    segs.push({ k: 15.5 + W.WALL_N + 2, f: (ctx) => { I.box(ctx, 15.25, W.WALL_N - t - 0.1, 0, 0.5, t + 0.2, h + 0.7, stone, ns); this.masonry(ctx, true, true, 15.25, W.WALL_N - t - 0.1, 0.5, t + 0.2, 0, h + 0.7); I.poly(ctx, [[15.32, W.WALL_N + 0.1, 0], [15.68, W.WALL_N + 0.1, 0], [15.68, W.WALL_N + 0.1, 0.7], [15.5, W.WALL_N + 0.1, 0.95], [15.32, W.WALL_N + 0.1, 0.7]], '#1e1a18'); I.pyramid(ctx, 15.2, W.WALL_N - t - 0.15, h + 0.7, 0.6, t + 0.3, 0.55, '#3a3038'); } });
    for (const [ya, yb] of [[W.WALL_N, 9.3], [10.7, W.COAST_Y]]) for (let y = ya; y < yb; y += 2) { const y1 = Math.min(y + 2, yb); seg(W.WALL_E, y, t, y1 - y, W.WALL_E + t + y1); }
    // Türme: Mauerwerk, Schießscharten, Kragsteinkranz, Zinnen, Kegeldach
    const tower = (cx, cy, r, hh, k) => segs.push({ k, f: (ctx, sv) => {
      I.cylinder(ctx, cx, cy, 0, r, hh, '#736d63', { noTop: true });
      for (let z = 0.13; z < hh; z += 0.13) { const P = I.p(cx, cy, z); ctx.strokeStyle = 'rgba(0,0,0,0.26)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.ellipse(P[0], P[1], r * I.TW, r * I.TH, 0, 0, Math.PI); ctx.stroke(); const off = ((z / 0.13) | 0) % 2 ? 0.35 : 0; for (let a = 0.15 + off; a < Math.PI; a += 0.7) { const Q = I.p(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z); ctx.beginPath(); ctx.moveTo(Q[0], Q[1]); ctx.lineTo(Q[0], Q[1] + 0.13 * I.ZS); ctx.stroke(); } }
      const base = I.p(cx, cy, 0); ctx.fillStyle = 'rgba(20,20,15,0.25)'; ctx.beginPath(); ctx.ellipse(base[0], base[1], r * I.TW, r * I.TH, 0, 0, Math.PI); ctx.lineTo(base[0] - r * I.TW, base[1] - 0.2 * I.ZS); ctx.ellipse(base[0], base[1] - 0.2 * I.ZS, r * I.TW, r * I.TH, 0, Math.PI, 0, true); ctx.fill();
      for (const [a, z] of [[0.9, hh * 0.35], [1.6, hh * 0.6], [0.5, hh * 0.75]]) { const Q = I.p(cx + Math.cos(a) * r * 0.98, cy + Math.sin(a) * r * 0.98, z); ctx.fillStyle = '#1e1a18'; ctx.fillRect(Q[0] - 1, Q[1] - 8, 2.2, 9); }
      I.cylinder(ctx, cx, cy, hh, r + 0.09, 0.16, '#6a645a', {}); I.cylinder(ctx, cx, cy, hh + 0.16, r + 0.09, 0.1, '#7d776c', {});
      for (let a = 0; a < 6.28; a += 0.55) { const px = cx + Math.cos(a) * (r + 0.02), py = cy + Math.sin(a) * (r + 0.02); if (px + py > cx + cy - 0.15) I.box(ctx, px - 0.07, py - 0.07, hh + 0.26, 0.14, 0.14, 0.2, stone, { stroke: 'rgba(0,0,0,0.35)' }); }
      I.cone(ctx, cx, cy, hh + 0.42, r + 0.02, 1.15, this.season() === 'winter' ? '#e6eaee' : '#3a3038');
      const T = I.p(cx, cy, hh + 1.57), B = I.p(cx, cy, hh + 0.42); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.6; for (let a = 0.2; a < Math.PI; a += 0.5) { ctx.beginPath(); ctx.moveTo(T[0], T[1]); ctx.lineTo(B[0] + Math.cos(a) * (r + 0.02) * I.TW, B[1] + Math.sin(a) * (r + 0.02) * I.TH); ctx.stroke(); }
      I.line(ctx, [cx, cy, hh + 1.57], [cx, cy, hh + 2.05], '#3a2a1a', 1.2); this.pennant(ctx, cx, cy, hh + 2.05, 0.5, 0.22, ['#c8102e'], true);
    } });
    tower(W.WALL_E + 0.3, W.WALL_N - 0.3, 0.62, 2.3, W.WALL_E + W.WALL_N + 1.3);
    tower(W.WALL_E + 0.3, W.COAST_Y + 0.1, 0.62, 2.3, W.WALL_E + W.COAST_Y + 1.3);
    tower(W.COAST_X + 0.6, W.WALL_N - 0.3, 0.5, 2.0, W.COAST_X + W.WALL_N + 1.0);
    tower(15.0, W.WALL_N - 0.3, 0.42, 1.9, 15 + W.WALL_N + 1); tower(16.0, W.WALL_N - 0.3, 0.42, 1.9, 16 + W.WALL_N + 1);
    tower(W.WALL_E + 0.3, 6.0, 0.5, 2.0, W.WALL_E + 6.0 + 1.1); tower(W.WALL_E + 0.3, 13.5, 0.5, 2.0, W.WALL_E + 13.5 + 1.1);
    return segs;
  },
  drawMole(ctx, sv) {
    const m = HK.MOLE, L = HK.LIGHTHOUSE;
    I.box(ctx, m.x, m.y0, 0, m.w, m.y1 - m.y0, 0.35, { wall: '#7d766a', top: '#9a9284' });
    for (let y = m.y0; y < m.y1; y += 0.3) I.line(ctx, [m.x, y, 0.35], [m.x + m.w, y, 0.35], 'rgba(0,0,0,0.15)', 0.5);
    for (let y = m.y0 + 0.4; y < m.y1; y += 0.8) I.box(ctx, m.x + 0.25, y, 0.35, 0.12, 0.12, 0.18, { wall: '#2e2826', top: '#5a504a' });
    I.cylinder(ctx, L.x, L.y, 0, L.r, L.h, '#8f887a', { brick: true, noTop: true }); I.cylinder(ctx, L.x, L.y, L.h, L.r + 0.08, 0.15, '#5e594e', {});
    I.cylinder(ctx, L.x, L.y, L.h + 0.15, L.r * 0.6, 0.35, '#3a3430', { noTop: true }); I.cone(ctx, L.x, L.y, L.h + 0.5, L.r * 0.7, 0.45, '#3a3038');
    I.windowR(ctx, L.x - L.r, L.r, L.y - 0.1, 0.9, 0.1, 0.16, 0.26, { arch: true });
    if (this.light() < 0.8) { const p = I.p(L.x, L.y, L.h + 0.32); const fire = 0.7 + Math.sin(this.time * 9) * 0.3; ctx.fillStyle = `rgba(255,150,40,${fire})`; ctx.beginPath(); ctx.arc(p[0], p[1], 3, 0, 6.28); ctx.fill(); this.lamps.push([p[0], p[1]]); }
  },
  drawIslet(ctx, season, sv) {
    const o = HK.ISLET, c = I.p(o.x, o.y, 0);
    ctx.fillStyle = 'rgba(120,190,190,0.2)'; ctx.beginPath(); ctx.ellipse(c[0], c[1] + 4, 70, 32, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#8f887a'; ctx.beginPath(); ctx.ellipse(c[0], c[1] + 6, 52, 22, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = season === 'winter' ? '#e9edf0' : this.pat.grass; ctx.beginPath(); ctx.ellipse(c[0], c[1], 50, 21, 0, 0, 6.28); ctx.fill();
    for (let i = 0; i < 7; i++) { const a = i * 0.9, px = c[0] + Math.cos(a) * 46, py = c[1] + Math.sin(a) * 19 + 3; ctx.fillStyle = '#7d766a'; ctx.beginPath(); ctx.ellipse(px, py, 5, 3, 0, 0, 6.28); ctx.fill(); }
    for (const [tx, ty, r] of [[o.x - 0.5, o.y - 0.3, 0.45], [o.x + 0.4, o.y + 0.2, 0.5], [o.x - 0.1, o.y + 0.6, 0.35]]) this.drawTree(ctx, tx, ty, r, season, sv);
  },
  drawWindmill(ctx, t, sv) {
    const m = HK.WINDMILL; I.shadow(ctx, m.x - 0.35, m.y - 0.35, 0.7, 0.7, 1.6, sv.v, sv.a);
    I.cylinder(ctx, m.x, m.y, 0, 0.42, 1.3, '#8f887a', { brick: true, noTop: true }); I.cone(ctx, m.x, m.y, 1.3, 0.48, 0.55, '#5a4a3a');
    I.doorL(ctx, m.x - 0.15, m.y + 0.2, 0.2, 0, 0.15, 0.22, 0.4, true);
    const hub = I.p(m.x + 0.1, m.y + 0.45, 1.45); const a0 = t * 0.9;
    for (let k = 0; k < 4; k++) { const a = a0 + k * Math.PI / 2; const ex = hub[0] + Math.cos(a) * 30, ey = hub[1] + Math.sin(a) * 30 * 0.8; ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(hub[0], hub[1]); ctx.lineTo(ex, ey); ctx.stroke(); ctx.fillStyle = 'rgba(240,232,210,0.9)'; ctx.beginPath(); ctx.moveTo(hub[0] + Math.cos(a) * 8, hub[1] + Math.sin(a) * 6.4); ctx.lineTo(ex, ey); ctx.lineTo(ex + Math.cos(a + 1.57) * 7, ey + Math.sin(a + 1.57) * 5.6); ctx.lineTo(hub[0] + Math.cos(a) * 8 + Math.cos(a + 1.57) * 7, hub[1] + Math.sin(a) * 6.4 + Math.sin(a + 1.57) * 5.6); ctx.fill(); ctx.strokeStyle = 'rgba(60,40,20,0.5)'; ctx.lineWidth = 0.6; ctx.stroke(); }
    ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.arc(hub[0], hub[1], 2.5, 0, 6.28); ctx.fill();
  },
  drawFarm(ctx, season, sv) { const f = HK.FARM; this.drawHouse(ctx, { x: f.x, y: f.y, w: f.w, d: f.d, h: f.h, wall: '#d8c9a6', roof: '#9a8352' }, HK.state, season, sv, false); for (let u = 0; u < 1.6; u += 0.18) I.line(ctx, [f.x - 0.4 + u, f.y + f.d + 0.5, 0], [f.x - 0.4 + u, f.y + f.d + 0.5, 0.2], '#6a4a2a', 1); I.line(ctx, [f.x - 0.4, f.y + f.d + 0.5, 0.15], [f.x + 1.2, f.y + f.d + 0.5, 0.15], '#6a4a2a', 1); for (const [sx, sy] of [[f.x + 0.2, f.y + f.d + 0.25], [f.x + 0.6, f.y + f.d + 0.3], [f.x + 1.0, f.y + f.d + 0.2]]) { const p = I.p(sx, sy, 0); ctx.fillStyle = '#f0ece0'; ctx.beginPath(); ctx.ellipse(p[0], p[1] - 2, 3.5, 2.5, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = '#3a3030'; ctx.fillRect(p[0] + 2.5, p[1] - 3.5, 2, 2); } },
  drawPier(ctx, p, t) {
    const w = 0.5, x0 = p.x - w / 2, last = p.y1 >= p.full.y1 - 0.01;
    for (let y = p.y0 + 0.3; y < p.y1; y += 0.35) { I.line(ctx, [x0 + 0.05, y, -0.3], [x0 + 0.05, y, 0.2], '#4a3320', 2); I.line(ctx, [x0 + w - 0.05, y, -0.3], [x0 + w - 0.05, y, 0.2], '#3a2a1a', 2); }
    I.poly(ctx, [[x0, p.y0 - (p.first ? 0.1 : 0), 0.2], [x0 + w, p.y0 - (p.first ? 0.1 : 0), 0.2], [x0 + w, p.y1, 0.2], [x0, p.y1, 0.2]], this.pat.planks);
    for (let y = p.y0; y < p.y1; y += 0.12) I.line(ctx, [x0, y, 0.2], [x0 + w, y, 0.2], 'rgba(0,0,0,0.25)', 0.6);
    I.line(ctx, [x0, p.y0, 0.2], [x0, p.y1, 0.2], 'rgba(0,0,0,0.45)', 0.8); I.line(ctx, [x0 + w, p.y0, 0.2], [x0 + w, p.y1, 0.2], 'rgba(0,0,0,0.45)', 0.8);
    I.poly(ctx, [[x0 + w, p.y0, 0.2], [x0 + w, p.y1, 0.2], [x0 + w, p.y1, 0.05], [x0 + w, p.y0, 0.05]], '#5f4630');
    if (last) {
      I.poly(ctx, [[x0, p.y1, 0.2], [x0 + w, p.y1, 0.2], [x0 + w, p.y1, 0.05], [x0, p.y1, 0.05]], '#6a4f36');
      I.box(ctx, x0 + 0.05, p.y1 - 0.15, 0.2, 0.1, 0.1, 0.18, { wall: '#2e2826', top: '#5a504a' }); I.box(ctx, x0 + w - 0.15, p.y1 - 0.15, 0.2, 0.1, 0.1, 0.18, { wall: '#2e2826', top: '#5a504a' });
      I.line(ctx, [p.x, p.y1 - 0.3, 0.2], [p.x, p.y1 - 0.3, 1.0], '#2a2420', 1.3); const lp = I.p(p.x, p.y1 - 0.3, 1.0); this.lamps.push([lp[0], lp[1]]); ctx.fillStyle = '#3a3430'; ctx.fillRect(lp[0] - 3, lp[1] - 3, 6, 4);
    }
    if (p.y0 <= p.full.y0 + 1.3 && p.y1 > p.full.y0 + 1.3) { this.barrel3(ctx, x0 + 0.12, p.full.y0 + 1.25, 0.2); I.box(ctx, x0 + 0.28, p.full.y0 + 1.0, 0.2, 0.18, 0.18, 0.18, { wall: '#9a7a4a', top: '#b08a50' }); }
  },
  drawTree(ctx, x, y, r, season, sv) {
    const s = I.p(x, y, 0), R = r * 46, th = r * 30;
    if (!this.picking) { ctx.fillStyle = `rgba(15,10,5,${sv.a * 0.8})`; ctx.beginPath(); ctx.ellipse(s[0] + sv.v[0] * 14, s[1] + sv.v[1] * 8 + 2, R * 0.95, R * 0.42, 0, 0, 6.28); ctx.fill(); }
    ctx.fillStyle = '#4a3320'; ctx.beginPath(); ctx.moveTo(s[0] - 3, s[1] + 1); ctx.lineTo(s[0] + 3, s[1] + 1); ctx.lineTo(s[0] + 2, s[1] - th); ctx.lineTo(s[0] - 2, s[1] - th); ctx.fill();
    if (season === 'winter') { ctx.strokeStyle = '#4a3320'; ctx.lineWidth = 1.6; for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.3; ctx.beginPath(); ctx.moveTo(s[0], s[1] - th * 0.9); ctx.lineTo(s[0] + Math.cos(a) * R * 1.1, s[1] - th * 0.9 + Math.sin(a) * R * 1.1); ctx.stroke(); } return; }
    const pal = season === 'autumn' ? ['#7a4a1a', '#b8702a', '#d08a30', '#e8b050'] : ['#2f5a24', '#3f7a2e', '#5a9a3a', '#86bf52'];
    const cy = s[1] - th - R * 0.55, sway = Math.sin(this.time * 1.2 + x) * 1.2;
    const lobes = [[0, 0.05, 1], [-0.55, 0.3, 0.68], [0.55, 0.32, 0.66], [-0.3, -0.45, 0.6], [0.32, -0.42, 0.62], [0, -0.7, 0.45]];
    const blob = (k, col, off) => { ctx.fillStyle = col; ctx.beginPath(); for (const [lx, ly, lr] of lobes) ctx.arc(s[0] + sway + lx * R + (off ? off[0] * R : 0), cy + ly * R + (off ? off[1] * R : 0), lr * R * k, 0, 6.28); ctx.fill(); };
    blob(1.06, 'rgba(25,45,15,0.55)'); // Umriss
    blob(1, pal[1]);
    blob(0.78, pal[0], [0.16, 0.18]); // Schattenseite unten rechts
    blob(0.72, pal[2], [-0.12, -0.12]);
    blob(0.42, pal[3], [-0.24, -0.3]);
    ctx.fillStyle = 'rgba(25,45,15,0.35)'; for (let i = 0; i < 7; i++) { const a = i * 0.9 + x; ctx.beginPath(); ctx.arc(s[0] + sway + Math.cos(a) * R * 0.6, cy + Math.sin(a) * R * 0.5 + R * 0.1, R * 0.12, 0, 6.28); ctx.fill(); }
  },
  barrel3(ctx, x, y, z) { I.cylinder(ctx, x, y, z, 0.11, 0.28, '#7a5a34', {}); const p = I.p(x, y, z + 0.09), q = I.p(x, y, z + 0.2); ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 0.8; for (const c of [p, q]) { ctx.beginPath(); ctx.ellipse(c[0], c[1], 0.11 * I.TW, 0.11 * I.TH, 0, 0, Math.PI); ctx.stroke(); } },
  crate3(ctx, x, y, z, s) { I.box(ctx, x, y, z, s, s, s, { wall: '#9a7a4a', top: '#b08a50' }, { stroke: 'rgba(60,35,10,0.7)' }); I.line(ctx, [x, y + s, z], [x + s, y + s, z + s], 'rgba(60,35,10,0.6)', 0.6); I.line(ctx, [x + s, y, z], [x + s, y + s, z + s], 'rgba(60,35,10,0.6)', 0.6); },
  drawProp(ctx, p, st, sv) {
    switch (p.t) {
      case 'crates': this.crate3(ctx, p.x, p.y, 0, 0.26); this.crate3(ctx, p.x + 0.28, p.y + 0.05, 0, 0.22); this.crate3(ctx, p.x + 0.1, p.y + 0.02, 0.26, 0.2); break;
      case 'barrels': this.barrel3(ctx, p.x, p.y, 0); this.barrel3(ctx, p.x + 0.24, p.y + 0.02, 0); this.barrel3(ctx, p.x + 0.12, p.y + 0.22, 0); break;
      case 'well': { I.cylinder(ctx, p.x, p.y, 0, 0.24, 0.28, '#8f887a', { brick: true }); const c = I.p(p.x, p.y, 0.28); ctx.fillStyle = '#3f6a8a'; ctx.beginPath(); ctx.ellipse(c[0], c[1], 0.17 * I.TW, 0.17 * I.TH, 0, 0, 6.28); ctx.fill(); I.line(ctx, [p.x - 0.22, p.y, 0], [p.x - 0.22, p.y, 0.8], '#4a3320', 2); I.line(ctx, [p.x + 0.22, p.y, 0], [p.x + 0.22, p.y, 0.8], '#4a3320', 2); I.gableRoof(ctx, p.x - 0.26, p.y - 0.18, 0.8, 0.52, 0.36, 0.18, '#5a3a2a', 'x', { overhang: 0.03, rows: 3 }); I.line(ctx, [p.x - 0.22, p.y, 0.68], [p.x + 0.22, p.y, 0.68], '#3a2a1a', 1.5); break; }
      case 'statue': { I.box(ctx, p.x - 0.22, p.y - 0.22, 0, 0.44, 0.44, 0.25, { wall: '#8f887a', top: '#a9a292' }); I.box(ctx, p.x - 0.14, p.y - 0.14, 0.25, 0.28, 0.28, 0.5, { wall: '#7d766a', top: '#9a9284' }); const s = I.p(p.x, p.y, 0.75); ctx.fillStyle = '#8f8878'; ctx.beginPath(); ctx.moveTo(s[0] - 3, s[1]); ctx.lineTo(s[0] + 3, s[1]); ctx.lineTo(s[0] + 4, s[1] - 15); ctx.lineTo(s[0] - 4, s[1] - 15); ctx.fill(); ctx.beginPath(); ctx.arc(s[0], s[1] - 17.5, 3, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#8f8878'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(s[0] + 4, s[1] - 12); ctx.lineTo(s[0] + 8, s[1] - 22); ctx.stroke(); ctx.fillStyle = '#c9a24a'; ctx.fillRect(s[0] - 6, s[1] - 11, 4, 6); break; }
      case 'nets': { for (let k = 0; k < 5; k++) I.line(ctx, [p.x, p.y + k * 0.08, 0.35], [p.x + 0.05, p.y + k * 0.08 + 0.3, 0], 'rgba(60,50,40,0.6)', 0.6); I.line(ctx, [p.x, p.y, 0], [p.x, p.y, 0.4], '#4a3a2a', 1.2); I.line(ctx, [p.x, p.y + 0.35, 0], [p.x, p.y + 0.35, 0.4], '#4a3a2a', 1.2); I.line(ctx, [p.x, p.y, 0.38], [p.x, p.y + 0.35, 0.38], '#4a3a2a', 1); break; }
      case 'pillory': { I.line(ctx, [p.x, p.y, 0], [p.x, p.y, 0.75], '#5a4a3a', 2.4); I.box(ctx, p.x - 0.2, p.y - 0.06, 0.55, 0.4, 0.12, 0.14, { wall: '#7a5a3a', top: '#9a7a4a' }); const q = I.p(p.x - 0.05, p.y, 0.62); ctx.fillStyle = '#1e1a18'; ctx.beginPath(); ctx.arc(q[0], q[1], 1.6, 0, 6.28); ctx.arc(q[0] + 5, q[1] + 1, 1.2, 0, 6.28); ctx.arc(q[0] - 5, q[1] + 1, 1.2, 0, 6.28); ctx.fill(); break; }
      case 'ropes': { for (const u of [0, 0.9, 1.8]) I.line(ctx, [p.x + u, p.y, 0], [p.x + u, p.y, 0.45], '#4a3a2a', 1.4); for (let k = 0; k < 3; k++) I.line(ctx, [p.x, p.y, 0.42 - k * 0.1], [p.x + 1.8, p.y, 0.42 - k * 0.1], k % 2 ? '#c9b48a' : '#a89060', 0.9); const q = I.p(p.x + 2.1, p.y + 0.1, 0); ctx.fillStyle = '#b89a62'; ctx.beginPath(); ctx.ellipse(q[0], q[1], 5, 2.6, 0, 0, 6.28); ctx.fill(); ctx.strokeStyle = 'rgba(60,40,15,0.6)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.ellipse(q[0], q[1], 2, 1, 0, 0, 6.28); ctx.stroke(); break; }
      case 'sails': { I.line(ctx, [p.x, p.y, 0], [p.x, p.y, 0.7], '#4a3a2a', 1.4); I.line(ctx, [p.x + 1.0, p.y, 0], [p.x + 1.0, p.y, 0.7], '#4a3a2a', 1.4); I.line(ctx, [p.x, p.y, 0.68], [p.x + 1.0, p.y, 0.68], '#3a2a1a', 1); I.poly(ctx, [[p.x + 0.1, p.y + 0.01, 0.66], [p.x + 0.9, p.y + 0.01, 0.66], [p.x + 0.85, p.y + 0.06, 0.25], [p.x + 0.5, p.y + 0.1, 0.12], [p.x + 0.15, p.y + 0.06, 0.25]], '#efe6d2', 'rgba(80,60,30,0.5)', 0.6); for (let k = 0.25; k < 0.9; k += 0.2) I.line(ctx, [p.x + k, p.y + 0.02, 0.64], [p.x + k, p.y + 0.06, 0.2], 'rgba(120,100,70,0.35)', 0.6); break; }
      case 'kiln': { I.cylinder(ctx, p.x, p.y, 0, 0.28, 0.35, '#8a6a4a', { brick: true, noTop: true }); I.cone(ctx, p.x, p.y, 0.35, 0.3, 0.4, '#7a5a3a'); const q = I.p(p.x, p.y + 0.27, 0.12); ctx.fillStyle = '#1e1a18'; ctx.fillRect(q[0] - 2.5, q[1] - 4, 5, 4.5); if (!this.picking) { ctx.fillStyle = `rgba(255,120,30,${0.5 + Math.sin(this.time * 6) * 0.2})`; ctx.fillRect(q[0] - 1.5, q[1] - 3, 3, 2.5); if (this.light() < 0.6) this.lamps.push([q[0], q[1] - 2]); } for (let k = 0; k < 4; k++) { const r = I.p(p.x + 0.4 + (k % 2) * 0.15, p.y - 0.1 + (k >> 1) * 0.15, 0.06); ctx.fillStyle = '#b06a3a'; ctx.beginPath(); ctx.ellipse(r[0], r[1], 2.4, 1.6, 0, 0, 6.28); ctx.fill(); } break; }
      case 'frames': { for (const v of [0, 0.5, 1.0]) { I.line(ctx, [p.x, p.y + v, 0], [p.x, p.y + v, 0.7], '#4a3a2a', 1.3); } I.line(ctx, [p.x, p.y, 0.66], [p.x, p.y + 1.0, 0.66], '#3a2a1a', 1); for (const v of [0.08, 0.58]) I.poly(ctx, [[p.x, p.y + v, 0.64], [p.x, p.y + v + 0.34, 0.64], [p.x, p.y + v + 0.3, 0.2], [p.x, p.y + v + 0.04, 0.24]], '#a8825a', 'rgba(60,40,20,0.6)', 0.6); I.cylinder(ctx, p.x - 0.25, p.y + 0.3, 0, 0.16, 0.18, '#5a4a3a', {}); const q = I.p(p.x - 0.25, p.y + 0.3, 0.18); ctx.fillStyle = '#6a5a2a'; ctx.beginPath(); ctx.ellipse(q[0], q[1], 0.12 * I.TW, 0.12 * I.TH, 0, 0, 6.28); ctx.fill(); break; }
      case 'dyecloths': { const cols = ['#3b6ac2', '#c23b3b', '#e0c020', '#3b9a4a']; I.line(ctx, [p.x, p.y, 0], [p.x, p.y, 0.75], '#4a3a2a', 1.3); I.line(ctx, [p.x, p.y + 1.1, 0], [p.x, p.y + 1.1, 0.75], '#4a3a2a', 1.3); I.line(ctx, [p.x, p.y, 0.72], [p.x, p.y + 1.1, 0.72], '#3a2a1a', 1); cols.forEach((c, i) => { const v = 0.08 + i * 0.26; I.poly(ctx, [[p.x, p.y + v, 0.71], [p.x, p.y + v + 0.2, 0.71], [p.x, p.y + v + 0.2, 0.25 + Math.sin(this.time * 2 + i) * 0.02], [p.x, p.y + v, 0.22]], c, 'rgba(20,10,5,0.4)', 0.5); }); I.cylinder(ctx, p.x - 0.28, p.y + 0.55, 0, 0.17, 0.22, '#5a4a3a', {}); const q = I.p(p.x - 0.28, p.y + 0.55, 0.22); ctx.fillStyle = '#3b3ac2'; ctx.beginPath(); ctx.ellipse(q[0], q[1], 0.13 * I.TW, 0.13 * I.TH, 0, 0, 6.28); ctx.fill(); break; }
      case 'gallows': { I.box(ctx, p.x - 0.35, p.y - 0.35, 0, 0.7, 0.7, 0.25, { wall: '#8f887a', top: '#a9a292' }); I.line(ctx, [p.x, p.y, 0.25], [p.x, p.y, 1.5], '#4a3a2a', 3); I.line(ctx, [p.x, p.y, 1.48], [p.x + 0.55, p.y, 1.48], '#4a3a2a', 2.6); I.line(ctx, [p.x, p.y, 1.15], [p.x + 0.3, p.y, 1.46], '#4a3a2a', 1.2); I.line(ctx, [p.x + 0.45, p.y, 1.46], [p.x + 0.45, p.y, 1.15], '#2a1a0a', 0.8); const q = I.p(p.x + 0.45, p.y, 1.12); ctx.strokeStyle = '#2a1a0a'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(q[0], q[1], 2, 2.6, 0, 0, 6.28); ctx.stroke(); const cr = I.p(p.x + 0.5, p.y - 0.05, 1.5); ctx.fillStyle = '#1e1a18'; ctx.beginPath(); ctx.ellipse(cr[0], cr[1], 2.6, 1.6, 0, 0, 6.28); ctx.fill(); break; }
      case 'tollbar': { I.line(ctx, [p.x, p.y - 0.55, 0], [p.x, p.y - 0.55, 0.6], '#4a3a2a', 2); I.line(ctx, [p.x, p.y + 0.55, 0], [p.x, p.y + 0.55, 0.6], '#4a3a2a', 2); const up = HK.state && HK.state.caravans.length ? 0.9 : 0; I.line(ctx, [p.x, p.y - 0.55, 0.5], [p.x, p.y + 0.55, 0.5 + up], '#c8102e', 2.2); for (let k = 0.15; k < 1.0; k += 0.3) I.line(ctx, [p.x, p.y - 0.55 + k, 0.5 + up * k / 1.1], [p.x, p.y - 0.55 + k + 0.15, 0.5 + up * (k + 0.15) / 1.1], '#f0ece0', 2.2); I.box(ctx, p.x - 0.2, p.y - 0.85, 0, 0.35, 0.3, 0.35, { wall: '#7a5a3a' }, { noTop: true }); I.pyramid(ctx, p.x - 0.2, p.y - 0.85, 0.35, 0.35, 0.3, 0.2, '#5a4a3a'); break; }
      case 'boatup': { I.poly(ctx, [[p.x, p.y, 0], [p.x + 0.85, p.y - 0.05, 0], [p.x + 0.8, p.y + 0.25, 0.14], [p.x + 0.05, p.y + 0.3, 0.14]], '#4a3018', 'rgba(0,0,0,0.4)'); for (let k = 0.1; k < 0.8; k += 0.15) I.line(ctx, [p.x + k, p.y + 0.02, 0.02], [p.x + k, p.y + 0.27, 0.13], 'rgba(0,0,0,0.3)', 0.5); I.line(ctx, [p.x + 0.9, p.y + 0.35, 0], [p.x + 1.05, p.y + 0.35, 0.8], '#4a3a2a', 1.6); for (let k = 0; k < 6; k++) I.line(ctx, [p.x + 0.92 + k * 0.02, p.y + 0.35 + k * 0.05, 0.1 + k * 0.1], [p.x + 0.7, p.y + 0.45 + k * 0.06, 0], 'rgba(90,80,60,0.6)', 0.5); break; }
      case 'fishracks': { for (const u of [0, 0.5, 1.0]) I.line(ctx, [p.x + u, p.y, 0], [p.x + u, p.y, 0.6], '#4a3a2a', 1.3); I.line(ctx, [p.x, p.y, 0.58], [p.x + 1.0, p.y, 0.58], '#4a3a2a', 1); I.line(ctx, [p.x, p.y, 0.38], [p.x + 1.0, p.y, 0.38], '#4a3a2a', 1); for (let k = 0.06; k < 1.0; k += 0.11) { I.line(ctx, [p.x + k, p.y, 0.58], [p.x + k, p.y, 0.44], '#9fb3c8', 1.4); I.line(ctx, [p.x + k + 0.05, p.y, 0.38], [p.x + k + 0.05, p.y, 0.24], '#7d93a8', 1.4); } break; }
      case 'cross': { I.line(ctx, [p.x, p.y, 0], [p.x, p.y, 0.9], '#5a5048', 2.4); I.line(ctx, [p.x - 0.15, p.y, 0.7], [p.x + 0.15, p.y, 0.7], '#5a5048', 2.4); break; }
      case 'laundry': { const a = I.p(p.x, p.y, 0.6), b = I.p(p.x + 1.1, p.y, 0.6); I.line(ctx, [p.x, p.y, 0], [p.x, p.y, 0.65], '#4a3320', 1.2); I.line(ctx, [p.x + 1.1, p.y, 0], [p.x + 1.1, p.y, 0.65], '#4a3320', 1.2); ctx.strokeStyle = '#333'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 3, b[0], b[1]); ctx.stroke(); ['#e8e0c8', '#7a3a3a', '#3a5a7a', '#e8e0c8'].forEach((c, i) => { const t = 0.18 + i * 0.2, lx = a[0] + (b[0] - a[0]) * t, ly = a[1] + (b[1] - a[1]) * t + 2, sw = Math.sin(this.time * 3 + i) * 1.5; ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 5, ly + 2); ctx.lineTo(lx + 5 + sw, ly + 9); ctx.lineTo(lx + sw, ly + 7); ctx.fill(); }); break; }
      case 'crane': { I.line(ctx, [p.x, p.y, 0], [p.x, p.y, 1.6], '#4a3320', 4); I.cylinder(ctx, p.x, p.y, 0.2, 0.28, 0.35, '#5a4020', { noTop: false }); I.line(ctx, [p.x, p.y, 1.55], [p.x - 1.0, p.y - 0.3, 1.1], '#4a3320', 3.5); I.line(ctx, [p.x, p.y, 0.9], [p.x - 0.7, p.y - 0.2, 1.25], '#4a3320', 1.5); const hz = 0.35 + Math.sin(this.time * 0.8) * 0.25; I.line(ctx, [p.x - 1.0, p.y - 0.3, 1.1], [p.x - 1.0, p.y - 0.3, hz], '#222', 0.8); this.crate3(ctx, p.x - 1.1, p.y - 0.4, hz - 0.22, 0.22); break; }
    }
  },
  drawBuilding(ctx, b, st, season, sv) {
    switch (b.kind) {
      case 'eave': this.drawHouse(ctx, b, st, season, sv, false); break;
      case 'gable': this.drawHouse(ctx, b, st, season, sv, true); break;
      case 'hall': this.drawHall(ctx, b, st, season, sv); break;
      case 'townhall': this.drawTownhall(ctx, b, st, season, sv); break;
      case 'church': this.drawChurch(ctx, b, st, season, sv); break;
      case 'huts': this.drawHuts(ctx, b, st, season, sv); break;
      case 'yard': this.drawYard(ctx, b); break;
      case 'plot': this.drawPlot(ctx, b, st, season, sv); break;
      case 'gate': this.drawGate(ctx, b, st, season, sv); break;
      case 'longhouse': this.drawLonghouse(ctx, b, st, season, sv); break;
      case 'openhall': this.drawOpenHall(ctx, b, st, season, sv); break;
      case 'monastery': this.drawMonastery(ctx, b, st, season, sv); break;
      case 'hospital': this.drawHospital(ctx, b, st, season, sv); break;
      case 'school': this.drawHouse(ctx, b, st, season, sv, false); break;
      case 'market': return;
    }
    const owned = (b.panel === 'house' && st.houses[b.plot].owner === 'player') || (b.panel === 'workshop' && st.workshops[b.plot].type) || (b.id === 'tavern' && st.tavernOwned) || (b.id === 'bathhouse' && st.bathhouseOwned) || (b.panel === 'venture' && st.ventures && st.ventures[b.id]) || (b.panel === 'storage' && st.storages && st.storages[b.plot] && st.storages[b.plot].owner === 'player') || (b.id === 'dive' && st.ventures && st.ventures.dive);
    if (owned) this.gableFlag(ctx, b.x + b.w - 0.06, b.y + b.d - 0.06, b.h);
    if (b.panel === 'house' && st.houses[b.plot].damaged) { I.poly(ctx, [[b.x, b.y + b.d, 0], [b.x + b.w, b.y + b.d, 0], [b.x + b.w, b.y + b.d, b.h], [b.x, b.y + b.d, b.h]], 'rgba(20,15,10,0.6)'); I.poly(ctx, [[b.x + b.w, b.y, 0], [b.x + b.w, b.y + b.d, 0], [b.x + b.w, b.y + b.d, b.h], [b.x + b.w, b.y, b.h]], 'rgba(20,15,10,0.65)'); }
  },

  /* ---------- Schiffe (3D-Rumpf, gedreht) ---------- */
  drawShip(ctx, x, y, heading, s, origin, docked, selected) {
    const c = Math.cos(heading), sn = Math.sin(heading), t = this.time, pk = this.picking;
    const W = (u, v, z) => [x + (u * c - v * sn) * s, y + (u * sn + v * c) * s, z * s];
    const S = (u, v, z) => I.p(...W(u, v, z));
    const strokeW = (pts, col, lw, close) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); pts.forEach((q, i) => { const p = I.p(q[0], q[1], q[2]); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); if (close) ctx.closePath(); ctx.stroke(); };
    const flag = { luebeck: '#c8102e', bruegge: '#3b6ac2', bergen: '#3b9a4a', danzig: '#c29a3b', riga: '#7a3bc2', stockholm: '#e0c020', london: '#a02020', own: '#e0b040', guard: '#2a4a8a' }[origin] || '#888';
    const flag2 = { luebeck: '#f4f0e6', bruegge: '#e8c840', bergen: '#f0e8d8', danzig: '#2a2a2a', riga: '#f4f0e6', stockholm: '#2a58b8', london: '#f4f0e6', own: '#3a2a10', guard: '#f0ece0' }[origin] || '#eee';
    const bob = docked ? Math.sin(t * 1.1 + x) * 0.012 : Math.sin(t * 1.5 + x) * 0.03;
    // Deckssprung: Dollbord steigt zu Bug und Heck deutlich an
    const sheer = u => 0.72 + 0.18 * u * u + (u > 0.95 ? (u - 0.95) * 0.6 : 0) + (u < -1.0 ? (-1.0 - u) * 0.5 : 0) + bob;
    const prof = [[1.25, 0], [1.14, 0.14], [0.95, 0.27], [0.7, 0.35], [0.4, 0.4], [0.1, 0.42], [-0.2, 0.42], [-0.5, 0.4], [-0.78, 0.36], [-1.0, 0.28], [-1.14, 0.16], [-1.2, 0]];
    const gw = prof.concat(prof.slice(1, -1).reverse().map(q => [q[0], -q[1]]));
    const bul = f => 1 - 0.5 * f * f + 0.1 * Math.sin(f * Math.PI);
    const deckZ = u => sheer(u) - 0.2;
    // Wasserschatten, Spiegelung, Gischt und Kielwasser
    if (!pk) {
      const sp = I.p(x, y, 0); ctx.fillStyle = 'rgba(5,15,35,0.3)'; ctx.beginPath(); ctx.ellipse(sp[0], sp[1] + 3, 1.25 * s * I.TW, 0.6 * s * I.TH * 1.5, -heading * 0.5, 0, 6.28); ctx.fill();
      const wlS = gw.map(g => I.p(...W(g[0] * 0.97, g[1] * bul(1) * 1.15, 0)));
      for (const [dy, a] of [[5, 0.32], [11, 0.18], [17, 0.09]]) { ctx.fillStyle = `rgba(35,22,12,${a})`; ctx.beginPath(); wlS.forEach((p, i) => i ? ctx.lineTo(p[0], p[1] + dy * s) : ctx.moveTo(p[0], p[1] + dy * s)); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = 'rgba(225,238,250,0.30)'; ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.1; ctx.beginPath(); wlS.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (!docked) { ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.2; for (const sd of [-1, 1]) { ctx.beginPath(); for (let k = 0; k <= 5; k++) { const p = I.p(...W(-1.2 - k * 0.3, sd * (0.15 + k * 0.1) + Math.sin(t * 3 + k) * 0.03, 0)); k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.stroke(); } }
    }
    // Bordwand: fünf Klinkerplankengänge je Seite, geteert unten, hell oben, weich entlang der Länge schattiert
    const lightDir = [-0.55, -0.83];
    const lam = (a, b, sign) => { const nx0 = (b[1] - a[1]) * sign, ny0 = -(b[0] - a[0]) * sign; const len = Math.hypot(nx0, ny0) || 1; const nwx = (nx0 * c - ny0 * sn) / len, nwy = (nx0 * sn + ny0 * c) / len; return Math.max(0, nwx * lightDir[0] + nwy * lightDir[1]); };
    const strakes = ['#a8763f', '#986a36', '#84582c', '#5a3c20', '#3e2a16'];
    const N = strakes.length;
    const sides = [{ sign: 1 }, { sign: -1 }].map(sd => { const mid = W(0, sd.sign * 0.4, 0.3); return { sign: sd.sign, sy: I.p(mid[0], mid[1], mid[2])[1] }; }).sort((a, b) => a.sy - b.sy);
    const near = sides[1].sign;
    for (const { sign } of sides) {
      const P = prof;
      const kBow = 0.62 + 0.5 * lam(P[2], P[3], sign), kStern = 0.62 + 0.5 * lam(P[8], P[9], sign), kMid = 0.62 + 0.5 * lam(P[5], P[6], sign);
      const bowS = S(1.1, sign * 0.15, 0.3), sternS = S(-1.1, sign * 0.15, 0.3);
      const ring = f => P.map(g => W(g[0] * (1 - 0.07 * f), sign * g[1] * bul(f), sheer(g[0]) * (1 - f) + 0.03));
      for (let k = 0; k < N; k++) {
        const f0 = k / N, f1 = (k + 1) / N, top = ring(f0), bot = ring(f1).reverse();
        const grad = ctx.createLinearGradient(bowS[0], bowS[1], sternS[0], sternS[1]); grad.addColorStop(0, I.shade(strakes[k], kBow)); grad.addColorStop(0.5, I.shade(strakes[k], kMid)); grad.addColorStop(1, I.shade(strakes[k], kStern));
        I.path(ctx, top.concat(bot)); ctx.fillStyle = grad; ctx.fill();
        if (k) { strokeW(top, 'rgba(20,10,5,0.55)', 0.9); strokeW(top.map(q => [q[0], q[1], q[2] + 0.018 * s]), 'rgba(255,225,170,0.22)', 0.7); }
      }
      // Bergholz, Farbstreifen, Nagelreihen
      const rail = P.map(g => W(g[0], sign * g[1], sheer(g[0]) - 0.07)), wale = P.map(g => W(g[0] * 0.99, sign * g[1] * bul(0.4), sheer(g[0]) * 0.6 + 0.03));
      strokeW(rail, flag, 2.2 * s); strokeW(rail.map(q => [q[0], q[1], q[2] - 0.05 * s]), 'rgba(0,0,0,0.25)', 0.8);
      strokeW(wale, '#2a1a0c', 2.4 * s); strokeW(wale.map(q => [q[0], q[1], q[2] + 0.02 * s]), 'rgba(255,220,160,0.18)', 0.7);
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; for (let i = 1; i < P.length - 1; i++) for (let k = 1; k < N; k++) { const g = P[i]; const q = I.p(...W(g[0] * (1 - 0.07 * k / N), sign * g[1] * bul(k / N), sheer(g[0]) * (1 - k / N) + 0.03)); ctx.fillRect(q[0], q[1], 1, 1); }
    }
    strokeW(gw.map(g => W(g[0], g[1], sheer(g[0]))), 'rgba(20,10,5,0.75)', 1.1, true);
    // Deck mit Längsplanken, Schanzkleid innen
    const inner = gw.map(g => W(g[0] * 0.98, g[1] * 0.88, deckZ(g[0])));
    I.poly(ctx, inner, '#9a7a4e', 'rgba(20,10,5,0.6)', 0.7);
    for (let v = -0.3; v <= 0.31; v += 0.075) { const pts = []; for (let u = -1.0; u <= 1.1; u += 0.15) pts.push(W(u, v, deckZ(u))); strokeW(pts, 'rgba(0,0,0,0.22)', 0.5); }
    for (let i = 0; i < gw.length; i++) { const a = gw[i], b = gw[(i + 1) % gw.length]; if ((a[1] + b[1]) * near < 0) I.poly(ctx, [W(a[0], a[1], sheer(a[0])), W(b[0], b[1], sheer(b[0])), W(b[0] * 0.98, b[1] * 0.88, deckZ(b[0])), W(a[0] * 0.98, a[1] * 0.88, deckZ(a[0]))], '#5a3a1c', 'rgba(20,10,5,0.5)', 0.5); }
    // Luke mit Süll und Gräting
    const hz = deckZ(0) + 0.07, hb = [W(-0.16, -0.17, deckZ(0)), W(0.2, -0.17, deckZ(0)), W(0.2, 0.17, deckZ(0)), W(-0.16, 0.17, deckZ(0))], ht = hb.map(p => [p[0], p[1], hz]);
    const hf = []; for (let i = 0; i < 4; i++) hf.push({ sy: I.p(...hb[i])[1] + I.p(...hb[(i + 1) % 4])[1], q: [hb[i], hb[(i + 1) % 4], ht[(i + 1) % 4], ht[i]] }); hf.sort((a, b) => a.sy - b.sy).slice(2).forEach(f => I.poly(ctx, f.q, '#5a3a1c', 'rgba(20,10,5,0.5)', 0.5));
    I.poly(ctx, ht, '#2a1c10', 'rgba(20,10,5,0.6)', 0.6); ctx.strokeStyle = 'rgba(180,140,90,0.45)'; ctx.lineWidth = 0.6; for (let u = -0.1; u < 0.2; u += 0.06) { const a = S(u, -0.15, hz), b = S(u, 0.15, hz); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } for (let v = -0.11; v < 0.17; v += 0.06) { const a = S(-0.16, v, hz), b = S(0.2, v, hz); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    // Ladung, Taurollen
    this.crate3(ctx, W(0.42, 0.14, 0)[0], W(0.42, 0.14, 0)[1], deckZ(0.42), 0.17 * s); this.barrel3(ctx, W(-0.4, -0.2, 0)[0], W(-0.4, -0.2, 0)[1], deckZ(-0.4)); this.barrel3(ctx, W(0.45, -0.2, 0)[0], W(0.45, -0.2, 0)[1], deckZ(0.45));
    for (const [cu, cv] of [[-0.35, 0.22], [0.25, -0.28]]) { const p = S(cu, cv, deckZ(cu)); ctx.fillStyle = '#b89a62'; ctx.beginPath(); ctx.ellipse(p[0], p[1], 3.2 * s, 1.7 * s, 0, 0, 6.28); ctx.fill(); ctx.strokeStyle = 'rgba(60,40,15,0.6)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.ellipse(p[0], p[1], 3.2 * s, 1.7 * s, 0, 0, 6.28); ctx.stroke(); ctx.beginPath(); ctx.ellipse(p[0], p[1], 1.2 * s, 0.6 * s, 0, 0, 6.28); ctx.stroke(); }
    // Kastelle als nach oben verlängerte Bordwand: Seitenwände folgen dem Rumpfriss, Querwand zum Deck, Reling, Kajüte mit Dach achtern
    const vAt = u => { for (let i = 0; i < prof.length - 1; i++) { const p0 = prof[i], p1 = prof[i + 1]; if (u <= p0[0] && u >= p1[0]) { const f = (p0[0] - u) / (p0[0] - p1[0] || 1); return p0[1] + (p1[1] - p0[1]) * f; } } return 0; };
    const viewDot = (nu) => (nu * c) + (nu * sn);
    const castle = (u0, u1, h, isStern) => {
      const us = [u0].concat(prof.map(g => g[0]).filter(u => u > u0 + 1e-6 && u < u1 - 1e-6), [u1]).sort((p, q) => p - q);
      const top = u => sheer(u) + h, ue = isStern ? u1 : u0, ve = vAt(ue) * 0.96;
      const wall = sign => { const pts = us.map(u => W(u, sign * vAt(u), sheer(u) - 0.03)).concat(us.map(u => W(u, sign * vAt(u), top(u))).reverse()); I.poly(ctx, pts, I.shade('#7a5230', sign === near ? 1 : 0.7), 'rgba(20,10,5,0.6)', 0.7); for (let j = 1; j < 4; j++) strokeW(us.map(u => W(u, sign * vAt(u), sheer(u) - 0.03 + h * j / 4)), 'rgba(0,0,0,0.3)', 0.5); };
      const bulk = () => { if (viewDot(isStern ? 1 : -1) < 0) return; I.poly(ctx, [W(ue, -ve, deckZ(ue)), W(ue, ve, deckZ(ue)), W(ue, ve, top(ue)), W(ue, -ve, top(ue))], '#5c3d20', 'rgba(20,10,5,0.6)', 0.6); for (let v = -ve + 0.08; v < ve; v += 0.08) I.line(ctx, W(ue, v, deckZ(ue)), W(ue, v, top(ue)), 'rgba(0,0,0,0.3)', 0.5); if (isStern) I.poly(ctx, [W(ue, near * 0.05, deckZ(ue)), W(ue, near * 0.2, deckZ(ue)), W(ue, near * 0.2, deckZ(ue) + 0.28), W(ue, near * 0.05, deckZ(ue) + 0.28)], '#1e140a'); };
      wall(-near); bulk(); wall(near);
      const deck = us.map(u => W(u, -vAt(u) * 0.97, top(u))).concat(us.map(u => W(u, vAt(u) * 0.97, top(u))).reverse());
      I.poly(ctx, deck, '#a08050', 'rgba(20,10,5,0.6)', 0.6); for (let v = -0.3; v <= 0.31; v += 0.075) strokeW(us.filter(u => Math.abs(v) < vAt(u) * 0.95).map(u => W(u, v, top(u))), 'rgba(0,0,0,0.2)', 0.5);
      return { us, top, vAt };
    };
    const railingOn = (us, top, sign, hgt, uFrom, uTo) => { const pts = us.filter(u => u >= uFrom - 1e-6 && u <= uTo + 1e-6).map(u => W(u, sign * vAt(u) * 0.97, top(u))); for (const q of pts) I.line(ctx, q, [q[0], q[1], q[2] + hgt], '#3a2410', 1.3 * s); strokeW(pts.map(q => [q[0], q[1], q[2] + hgt]), '#5a4020', 1.8 * s); strokeW(pts.map(q => [q[0], q[1], q[2] + hgt * 0.5]), '#4a3018', 0.9 * s); };
    // Achterkastell mit Kajüte
    const ah = 0.4, ac = castle(-1.2, -0.42, ah, true), aTop = ac.top;
    const rz = u => aTop(u) + 0.01, cabU0 = -1.14, cabU1 = -0.74, ridge = u => rz(u) + 0.28;
    const roofSide = sign => { const us = ac.us.filter(u => u > cabU0 && u < cabU1); const eave = [cabU0].concat(us, [cabU1]).map(u => W(u, sign * (vAt(u) + 0.05), rz(u))), rr = [cabU0].concat(us, [cabU1]).map(u => W(u, 0, ridge(u))); I.poly(ctx, eave.concat(rr.reverse()), sign === near ? '#4a4048' : '#2e2830', 'rgba(20,10,5,0.6)', 0.7); for (let k = 1; k < 4; k++) { const f = k / 4; strokeW([cabU0].concat(us, [cabU1]).map(u => W(u, sign * (vAt(u) + 0.05) * (1 - f), rz(u) + 0.28 * f)), 'rgba(0,0,0,0.3)', 0.5); } };
    roofSide(-near);
    if (viewDot(1) >= 0) { const gv = vAt(cabU1) + 0.05; I.poly(ctx, [W(cabU1, -gv, rz(cabU1)), W(cabU1, gv, rz(cabU1)), W(cabU1, 0, ridge(cabU1))], '#6a4a2a', 'rgba(20,10,5,0.6)', 0.6); I.poly(ctx, [W(cabU1, near * 0.06, rz(cabU1)), W(cabU1, near * 0.2, rz(cabU1)), W(cabU1, near * 0.2, rz(cabU1) + 0.2), W(cabU1, near * 0.06, rz(cabU1) + 0.2)], '#1e140a'); }
    { const wu = -0.94, wv = vAt(wu) + 0.02; I.poly(ctx, [W(wu - 0.07, near * wv, aTop(wu) - ah * 0.65), W(wu + 0.07, near * wv, aTop(wu) - ah * 0.65), W(wu + 0.07, near * wv, aTop(wu) - ah * 0.25), W(wu - 0.07, near * wv, aTop(wu) - ah * 0.25)], this.light() < 0.6 ? '#e8a850' : '#2a2418', '#1a140c', 0.6); if (this.light() < 0.6) this.emit([W(wu - 0.07, near * wv, aTop(wu) - ah * 0.65), W(wu + 0.07, near * wv, aTop(wu) - ah * 0.65), W(wu + 0.07, near * wv, aTop(wu) - ah * 0.25), W(wu - 0.07, near * wv, aTop(wu) - ah * 0.25)], 'rgba(255,170,70,0.85)'); }
    roofSide(near);
    strokeW([cabU0].concat(ac.us.filter(u => u > cabU0 && u < cabU1), [cabU1]).map(u => W(u, 0, ridge(u))), '#1e1a1e', 1.6 * s);
    railingOn(ac.us, aTop, near, 0.2, cabU1, -0.42); railingOn(ac.us, aTop, -near, 0.2, cabU1, -0.42);
    // Vorkastell
    const fh = 0.26, fc = castle(0.68, 1.25, fh, false), fTop = fc.top;
    railingOn(fc.us, fTop, near, 0.18, 0.68, 1.25); railingOn(fc.us, fTop, -near, 0.18, 0.68, 1.25);
    const az = aTop(-0.7) - ah, fz = fTop(0.9) - fh;
    // Mannschaft
    if (!pk) {
      const m1 = S(0.18, -0.3, deckZ(0.18)), m2 = S(-0.62, near * 0.1, aTop(-0.62)), m3 = S(0.9, 0.04, fTop(0.9));
      this.drawPerson(ctx, m1[0], m1[1] + 3, '#5a4a7a', 'fisher', 1, false, '#d9a98a', docked ? 0 : t * 5, 1, null, null, 0.72 * s);
      this.drawPerson(ctx, m2[0], m2[1] + 3, '#7a3a3a', 'merchant', 1, false, '#e8c39e', 0, -1, null, null, 0.68 * s);
      this.drawPerson(ctx, m3[0], m3[1] + 3, '#3a5a6a', 'fisher', 1, false, '#d9a98a', 0, 1, null, null, 0.62 * s);
    }
    // Mast, Stage, Wanten mit Webleinen, Mastkorb
    const zT = deckZ(0) + 2.45, mb = W(0, 0, deckZ(0)), mt = W(0, 0, zT);
    I.line(ctx, mb, mt, '#2a1a0e', 3.8 * s); I.line(ctx, [mb[0], mb[1], mb[2]], [mt[0], mt[1], mt[2]], '#6a4a2c', 1.8 * s);
    for (const sd of [-1, 1]) { for (let k = 0; k < 3; k++) I.line(ctx, W(0, 0, zT - 0.4), W(-0.36 + k * 0.32, sd * 0.38, sheer(-0.36 + k * 0.32)), 'rgba(25,15,8,0.85)', 0.6); for (let j = 1; j < 8; j++) { const f = j / 8; I.line(ctx, W(-0.36 * f, sd * 0.38 * f, zT - 0.4 + (sheer(-0.36) - zT + 0.4) * f), W(0.28 * f, sd * 0.38 * f, zT - 0.4 + (sheer(0.28) - zT + 0.4) * f), 'rgba(25,15,8,0.7)', 0.45); } }
    I.line(ctx, W(0, 0, zT), W(1.3, 0, sheer(1.25) + 0.15), 'rgba(25,15,8,0.85)', 0.6); I.line(ctx, W(0, 0, zT), W(-1.18, 0, ridge(-1.14) + 0.02), 'rgba(25,15,8,0.85)', 0.6);
    I.cylinder(ctx, mt[0], mt[1], zT - 0.45, 0.1 * s, 0.12, '#4a3a2a', {});
    // Rah und Segel: am Kai aufgegeit (hängt halb), auf See gebläht, mit Wappen der Heimatstadt
    const yw = 0.66, yz = zT - 0.55; I.line(ctx, W(0.04, -yw, yz), W(0.04, yw, yz), '#2a1a0a', 2.6 * s); I.line(ctx, W(0.04, -yw, yz), W(0.04, yw, yz), '#6a4a2c', 1.1 * s);
    {
      const belly = docked ? 0.1 : 0.36 + Math.sin(t * 2) * 0.05, hang = docked ? 0.95 : 1.55, zb = yz - hang;
      const foot = []; const nF = 6; for (let k = 0; k <= nF; k++) { const f = -1 + 2 * k / nF; foot.push(W(0.05 + belly * (1 - f * f * 0.5), f * yw * 0.9, zb + (docked ? Math.abs(Math.sin(k * 2.3)) * 0.12 : 0))); }
      const sail = [W(0.05, -yw, yz), W(0.05, yw, yz)].concat(foot.reverse());
      const g0 = S(0.05, -yw, yz), g1 = S(0.05, yw, yz); const sg = ctx.createLinearGradient(g0[0], g0[1], g1[0], g1[1]); sg.addColorStop(0, '#d9ccb0'); sg.addColorStop(0.5, '#f3ead6'); sg.addColorStop(1, '#e6dcc4');
      I.path(ctx, sail); ctx.fillStyle = sg; ctx.fill(); ctx.strokeStyle = 'rgba(80,60,30,0.7)'; ctx.lineWidth = 0.8; ctx.stroke();
      ctx.strokeStyle = 'rgba(120,100,70,0.35)'; ctx.lineWidth = 0.6; for (let k = 1; k < 7; k++) { const f = -1 + 2 * k / 7; const a = S(0.05, f * yw, yz), b = S(0.05 + belly * (1 - f * f * 0.5), f * yw * 0.9, zb + 0.02); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
      for (let k = 1; k < 4; k++) { const f = k / 4; const pts = []; for (let j = 0; j <= 6; j++) { const g = -1 + 2 * j / 6; pts.push(W(0.05 + belly * (1 - g * g * 0.5) * f, g * yw * (1 - 0.1 * f), yz - hang * f)); } strokeW(pts, 'rgba(120,100,70,0.3)', 0.6); }
      if (!pk) {
        // Wappen liegt in der Segelfläche: Punkte über die gleiche Parametrisierung wie das Segeltuch (quer f in -1..1, Höhe g in 0..1)
        const SP = (f, g) => W(0.05 + belly * (1 - f * f * 0.5) * g, f * yw * (1 - 0.1 * g), yz - hang * g + 0.005);
        const sw = docked ? 0.26 : 0.3, g0 = 0.22, g1 = docked ? 0.66 : 0.6, gm = (g0 + g1) / 2, gh = g1 - g0;
        const shield = [SP(-sw, g0), SP(sw, g0), SP(sw, g0 + gh * 0.55)]; for (let k = 1; k <= 5; k++) { const a = k / 5; shield.push(SP(sw * Math.cos(a * Math.PI / 2), g0 + gh * (0.55 + 0.45 * Math.sin(a * Math.PI / 2)))); } for (let k = 4; k >= 0; k--) { const a = k / 5; shield.push(SP(-sw * Math.cos(a * Math.PI / 2), g0 + gh * (0.55 + 0.45 * Math.sin(a * Math.PI / 2)))); }
        I.poly(ctx, shield, flag, 'rgba(40,20,10,0.6)', 0.7);
        if (origin === 'luebeck' || origin === 'london' || origin === 'guard') I.poly(ctx, [SP(-sw, gm - gh * 0.2), SP(sw, gm - gh * 0.2), SP(sw, gm + gh * 0.2), SP(-sw, gm + gh * 0.2)], flag2);
        else if (origin === 'bruegge' || origin === 'stockholm' || origin === 'riga') { I.poly(ctx, [SP(-sw * 0.18, g0), SP(sw * 0.18, g0), SP(sw * 0.18, g1), SP(-sw * 0.18, g1)], flag2); I.poly(ctx, [SP(-sw, gm - gh * 0.12), SP(sw, gm - gh * 0.12), SP(sw, gm + gh * 0.12), SP(-sw, gm + gh * 0.12)], flag2); }
        else { const disc = []; for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; disc.push(SP(Math.cos(a) * sw * 0.5, gm + Math.sin(a) * gh * 0.22)); } I.poly(ctx, disc, flag2); }
      }
      // Schoten und Brassen
      for (const sd of [-1, 1]) { I.line(ctx, foot[sd > 0 ? 0 : nF], W(-0.5, sd * 0.36, sheer(-0.5)), 'rgba(25,15,8,0.6)', 0.5); I.line(ctx, W(0.04, sd * yw, yz), W(-0.6, sd * vAt(-0.6) * 0.9, aTop(-0.6)), 'rgba(25,15,8,0.55)', 0.5); }
    }
    // Steven mit vergoldetem Knauf, Bugspriet, Ruder mit Pinne, Wimpel, Heckleuchte
    I.line(ctx, W(1.22, 0, 0.1), W(1.3, 0, sheer(1.25) + 0.32), '#3a2a1a', 3.2 * s); const kp = S(1.3, 0, sheer(1.25) + 0.34); ctx.fillStyle = '#d4a944'; ctx.beginPath(); ctx.arc(kp[0], kp[1], 2.2 * s, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#7a5a10'; ctx.lineWidth = 0.6; ctx.stroke();
    I.line(ctx, W(1.1, 0, sheer(1.1) + 0.05), W(1.85, 0, sheer(1.25) + 0.55), '#4a3a2a', 2.2 * s);
    I.line(ctx, W(-1.2, 0, 0.05), W(-1.3, 0, sheer(-1.2) + 0.05), '#2a1a0c', 2.8 * s); I.line(ctx, W(-1.27, 0, sheer(-1.2) + 0.02), W(-1.0, 0, aTop(-1.0) + 0.3), '#5a4020', 1.4 * s);
    if (!pk) this.pennant(ctx, mt[0], mt[1], mt[2] + 0.06 * s, 0.85 * s, 0.16 * s, [flag], true);
    const lp = S(-1.16, 0, ridge(-1.14) + 0.1); ctx.fillStyle = '#2a2018'; ctx.fillRect(lp[0] - 2 * s, lp[1] - 3 * s, 4 * s, 4.5 * s); ctx.fillStyle = this.light() < 0.7 ? '#ffd070' : '#c9a24a'; ctx.fillRect(lp[0] - 1.2 * s, lp[1] - 2.2 * s, 2.4 * s, 3 * s); if (this.light() < 0.7) this.lamps.push([lp[0], lp[1]]);
    if (selected) { const hull = this.shipHull(x, y, heading, s); ctx.strokeStyle = '#ffd766'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.beginPath(); hull.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]); }
  },
  drawBoat(ctx, x, y, own, t) {
    const bob = Math.sin(t * 2) * 0.02; const W = (u, v, z) => [x + u, y + v, z];
    const sp = I.p(x, y, 0); ctx.fillStyle = 'rgba(5,15,35,0.3)'; ctx.beginPath(); ctx.ellipse(sp[0], sp[1] + 1, 0.4 * I.TW, 0.3 * I.TH, 0, 0, 6.28); ctx.fill();
    const gw = [[0.4, 0], [0.2, 0.14], [-0.2, 0.15], [-0.38, 0.08], [-0.38, -0.08], [-0.2, -0.15], [0.2, -0.14]];
    for (let i = 0; i < gw.length; i++) { const a = gw[i], b = gw[(i + 1) % gw.length]; if (a[1] + b[1] < 0 && a[0] + b[0] < 0.6) continue; I.poly(ctx, [W(a[0], a[1], 0.2 + bob), W(b[0], b[1], 0.2 + bob), W(b[0] * 0.9, b[1] * 0.5, bob), W(a[0] * 0.9, a[1] * 0.5, bob)], own ? '#7a5030' : '#4a3018', 'rgba(20,10,5,0.6)', 0.6); }
    I.poly(ctx, gw.map(g => W(g[0], g[1], 0.2 + bob)), '#8a6a44', 'rgba(20,10,5,0.7)', 0.6);
    I.line(ctx, W(0, 0, 0.2), W(0, 0, 1.1), '#3a2a1a', 1.5); I.poly(ctx, [W(0, 0, 1.05), W(0.32, 0, 0.45), W(0, 0, 0.35)], own ? '#e0b040' : '#e8e0c8', 'rgba(80,60,30,0.5)', 0.5);
    const p = I.p(...W(-0.15, 0, 0.2)); this.drawPerson(ctx, p[0], p[1] + 3, '#3a5a7a', 'fisher', 1, false, '#d9a98a', 0, 1, null, null, 0.55);
  },
  drawCaravan(ctx, x, y, t, sv) {
    I.shadow(ctx, x - 0.5, y - 0.3, 1.0, 0.6, 0.5, sv.v, sv.a);
    I.box(ctx, x - 0.5, y - 0.28, 0.2, 0.7, 0.55, 0.25, { wall: '#7a5a3a', top: '#8a6a44' });
    const arc = []; for (let k = 0; k <= 6; k++) { const a = Math.PI * k / 6; arc.push([x - 0.5, y + Math.cos(a) * 0.3, 0.45 + Math.sin(a) * 0.3]); } I.poly(ctx, arc.concat([[x + 0.2, y - 0.3, 0.45]].concat(arc.slice().reverse().map(q => [x + 0.2, q[1], q[2]]))), '#d9cfb0', 'rgba(0,0,0,0.3)', 0.6);
    I.poly(ctx, arc.map(q => [x + 0.2, q[1], q[2]]), '#c9bfa0', 'rgba(0,0,0,0.35)', 0.6);
    for (const [wx, wy] of [[x - 0.4, y + 0.3], [x + 0.1, y + 0.3]]) { const p = I.p(wx, wy, 0.15); ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.ellipse(p[0], p[1], 5, 5, 0, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + t; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + Math.cos(a) * 4, p[1] + Math.sin(a) * 4); ctx.stroke(); } }
    I.box(ctx, x + 0.35, y - 0.15, 0.1, 0.5, 0.3, 0.3, { wall: '#8a6a4a', top: '#9a7a5a' }); I.box(ctx, x + 0.8, y - 0.1, 0.25, 0.15, 0.2, 0.25, { wall: '#8a6a4a', top: '#9a7a5a' });
    I.poly(ctx, [[x - 1.1, y + 0.1, 0], [x - 0.6, y + 0.1, 0], [x - 0.85, y + 0.35, 0.5]], '#c9b078'); I.poly(ctx, [[x - 0.6, y + 0.1, 0], [x - 0.6, y + 0.6, 0], [x - 0.85, y + 0.35, 0.5]], '#a9905a');
    if (this.light() < 0.6) { const p = I.p(x - 1.2, y + 0.4, 0.1); ctx.fillStyle = `rgba(255,160,60,${0.8 + Math.sin(t * 9) * 0.2})`; ctx.beginPath(); ctx.arc(p[0], p[1], 3, 0, 6.28); ctx.fill(); this.lamps.push([p[0], p[1]]); }
  },
  drawCart(ctx, wx, wy, c, t) {
    const along = c.a[0] === c.b[0] ? 'y' : 'x', d = c.dir;
    const W = (u, v, z) => along === 'x' ? [wx + u, wy + v, z] : [wx + v, wy + u, z];
    const sp = I.p(wx, wy, 0); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(sp[0], sp[1] + 2, 14, 5, 0, 0, 6.28); ctx.fill();
    I.box(ctx, W(-0.3, -0.18, 0.15)[0], W(-0.3, -0.18, 0.15)[1], 0.15, along === 'x' ? 0.5 : 0.36, along === 'x' ? 0.36 : 0.5, 0.2, { wall: '#7a5a3a', top: '#b8a070' });
    for (const u of [-0.2, 0.15]) { const p = I.p(...W(u, 0.2, 0.1)); ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.ellipse(p[0], p[1], 4, 4, 0, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 0.8; for (let i = 0; i < 3; i++) { const a = i * 2.09 + t * 3 * d; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + Math.cos(a) * 3.5, p[1] + Math.sin(a) * 3.5); ctx.stroke(); } }
    if (c.ox) { const o = W(0.55 * d, 0, 0.12); I.box(ctx, o[0] - 0.15, o[1] - 0.12, 0.12, 0.3, 0.24, 0.22, { wall: '#6a4a3a', top: '#7a5a4a' }); const h = I.p(...W(0.75 * d, 0, 0.35)); ctx.fillStyle = '#6a4a3a'; ctx.fillRect(h[0] - 3, h[1] - 4, 6, 6); }
    else { const p = I.p(...W(0.4 * d, 0, 0)); this.drawPerson(ctx, p[0], p[1], '#5a6a4a', 'citizen', 1, false, '#e8c39e', t * 9, d, null, null, 0.85); }
  },
  drawChicken(ctx, x, y, t) { ctx.fillStyle = '#f0ece0'; ctx.beginPath(); ctx.ellipse(x, y - 2, 3, 2.2, 0, 0, 6.28); ctx.fill(); ctx.beginPath(); ctx.arc(x + 2.5, y - 4, 1.4, 0, 6.28); ctx.fill(); ctx.fillStyle = '#c8102e'; ctx.fillRect(x + 2, y - 6, 1, 1.2); ctx.fillStyle = '#e0a020'; ctx.fillRect(x + 3.5, y - 4, 1.2, 0.8); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x - 1, y, 0.8, 2 + Math.sin(t * 10 + x) * 0.5); ctx.fillRect(x + 1, y, 0.8, 2 - Math.sin(t * 10 + x) * 0.5); },
  drawPerson(ctx, x, y, color, type, alpha, hover, skin, phase, dir, person, w, forceScale) {
    const d = forceScale || 0.9;
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(d * (type === 'child' ? 0.7 : 1), d * (type === 'child' ? 0.7 : 1));
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(1, 1, 5, 2, 0, 0, 6.28); ctx.fill();
    if (hover) { ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, -9, 11, 0, 6.28); ctx.stroke(); }
    const step = Math.sin(phase || 0) * 2.5;
    ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-1.5, -5); ctx.lineTo(-1.5 + step, 0); ctx.moveTo(1.5, -5); ctx.lineTo(1.5 - step, 0); ctx.stroke();
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-3, -13); ctx.lineTo(3, -13); ctx.lineTo(5, -4); ctx.lineTo(-5, -4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(-3, -13, 2.5, 9);
    if (type === 'monk') { ctx.strokeStyle = '#d9c9a0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-4, -8); ctx.lineTo(4, -8); ctx.stroke(); }
    if (type === 'guard') { ctx.fillStyle = '#9a9aa0'; ctx.fillRect(-3, -13, 6, 5); ctx.strokeStyle = '#6a5a4a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(5, -24); ctx.stroke(); ctx.fillStyle = '#8a8a90'; ctx.beginPath(); ctx.moveTo(5, -24); ctx.lineTo(3.5, -20); ctx.lineTo(6.5, -20); ctx.fill(); }
    if (type === 'beggar') { ctx.strokeStyle = '#6a5a4a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-4, -14); ctx.stroke(); }
    if (w && w.basket) { ctx.fillStyle = '#b8a070'; ctx.beginPath(); ctx.ellipse(5 * (dir || 1), -6, 3, 2.5, 0, 0, 6.28); ctx.fill(); }
    ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-3, -12); ctx.lineTo(-4 - step * 0.4, -6); ctx.moveTo(3, -12); ctx.lineTo(4 + step * 0.4, -6); ctx.stroke();
    ctx.fillStyle = skin || '#e8c39e'; ctx.beginPath(); ctx.arc(0, -16, 3.2, 0, 6.28); ctx.fill();
    if (type === 'monk') { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, -16.5, 3.8, Math.PI * 1.05, Math.PI * 1.95); ctx.fill(); }
    else if (type === 'merchant' || type === 'static' || (w && w.hat)) { ctx.fillStyle = person === 'priest' ? '#1a1a1a' : '#2a1a0a'; ctx.fillRect(-4.5, -19.5, 9, 1.5); ctx.fillRect(-3, -23, 6, 4); }
    else if (type === 'fisher') { ctx.fillStyle = '#8a8a7a'; ctx.beginPath(); ctx.arc(0, -17, 3.6, Math.PI, 0); ctx.fill(); }
    else if (type === 'citizen') { ctx.fillStyle = '#e8e0c8'; ctx.beginPath(); ctx.arc(0, -16.5, 3.6, Math.PI * 1.1, Math.PI * 1.9); ctx.fill(); }
    if (person === 'priest') { ctx.fillStyle = '#f0ece0'; ctx.fillRect(-2.5, -13, 5, 1.5); }
    if (person === 'mayor') { ctx.fillStyle = '#e0b040'; ctx.fillRect(-3, -11, 6, 1.5); }
    ctx.restore();
  },
});
