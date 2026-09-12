/* Isometrische Gebäude, Mauern, Bäume, Requisiten, Schiffe, Personen */
'use strict';
Object.assign(HK.Scene, {
  seed(b) { return ((b.x * 13 + b.y * 7) * 10) | 0; },
  chimney(ctx, x, y, z) { I.box(ctx, x, y, z, 0.14, 0.14, 0.32, { wall: '#5a4a44', top: '#3a2f2c' }); },
  gableFlag(ctx, x, y, z) { I.line(ctx, [x, y, z], [x, y, z + 0.6], '#3a2a1a', 1.2); const p = I.p(x, y, z + 0.6); ctx.fillStyle = '#e0b040'; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + 9 + Math.sin(this.time * 4 + x) * 2, p[1] + 3); ctx.lineTo(p[0], p[1] + 6); ctx.fill(); },

  /* Wandausstattung: Fenster in Reihen auf beiden sichtbaren Wänden */
  facadeWindows(ctx, b, floors, o) {
    o = o || {}; const seed = this.seed(b), shut = [null, '#4f6f3f', '#7a3a3a', '#3a5a7a', '#6a5a2a'][seed % 5], flowers = seed % 2 === 0;
    const nL = Math.max(1, Math.round(b.w / 0.5)), nR = Math.max(1, Math.round(b.d / 0.5));
    for (let f = 0; f < floors; f++) {
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
    if (b.sign) { const p = I.p(b.x + b.w, b.y + b.d * 0.2, b.h * 0.7); ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + 12, p[1] - 4); ctx.stroke(); ctx.fillStyle = '#4a3320'; ctx.fillRect(p[0] + 8, p[1] - 4, 9, 8); ctx.fillStyle = '#f0e6cc'; ctx.fillRect(p[0] + 9, p[1] - 3, 7, 6); if (b.sign === 'tavern') { ctx.fillStyle = '#c9a24a'; ctx.beginPath(); ctx.ellipse(p[0] + 12.5, p[1], 3, 1.6, -0.4, 0, 6.28); ctx.fill(); } else { ctx.fillStyle = '#e0b040'; ctx.beginPath(); ctx.arc(p[0] + 12.5, p[1], 2.2, 0, 6.28); ctx.fill(); } }
    if (b.flagpole) { I.line(ctx, [b.x + b.w + 0.05, b.y + 0.15, 0], [b.x + b.w + 0.05, b.y + 0.15, 1.8], '#3a2a1a', 1.3); const p = I.p(b.x + b.w + 0.05, b.y + 0.15, 1.8); ctx.fillStyle = '#c8102e'; ctx.fillRect(p[0], p[1], 9 + Math.sin(this.time * 4), 3); ctx.fillStyle = '#f0ece0'; ctx.fillRect(p[0], p[1] + 3, 9 + Math.sin(this.time * 4), 3); }
    if (b.id === 'bathhouse') for (let i = 0; i < 3; i++) { const p = I.p(b.x + b.w * 0.75, b.y + b.d * 0.4, b.h + rh * 0.55 + 0.3); ctx.fillStyle = `rgba(240,240,240,${0.25 - i * 0.06})`; ctx.beginPath(); ctx.arc(p[0] + 2 + Math.sin(this.time * 2 + i) * 3, p[1] - 6 - i * 7, 3 + i * 2, 0, 6.28); ctx.fill(); }
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
    if (b.banner) { const p = I.p(b.x + b.w, b.y + b.d * 0.5, b.h * 0.85); ctx.fillStyle = '#6a2a8a'; ctx.fillRect(p[0] - 3, p[1], 7, 18); ctx.fillStyle = '#e0b040'; ctx.fillRect(p[0] - 1, p[1] + 4, 3, 3); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(p[0] - 5, p[1] - 1, 11, 1.5); }
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
    I.line(ctx, [tx + 0.3, ty + 0.3, b.h + rh + 2.0], [tx + 0.3, ty + 0.3, b.h + rh + 2.4], '#e0b040', 1.5); const fp = I.p(tx + 0.3, ty + 0.3, b.h + rh + 2.4); ctx.fillStyle = '#c8102e'; ctx.beginPath(); ctx.moveTo(fp[0], fp[1]); ctx.lineTo(fp[0] + 8 + Math.sin(this.time * 4) * 2, fp[1] + 3); ctx.lineTo(fp[0], fp[1] + 6); ctx.fill();
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
    for (const [hx, hy] of [[b.x, b.y], [b.x + 0.7, b.y + 1.1]]) { I.shadow(ctx, hx, hy, 0.65, 0.6, 0.5, sv.v, sv.a); I.box(ctx, hx, hy, 0, 0.65, 0.6, 0.45, { wall: '#8a6a44' }, { noTop: true }); for (let z = 0.08; z < 0.45; z += 0.09) I.line(ctx, [hx, hy + 0.6, z], [hx + 0.65, hy + 0.6, z], 'rgba(0,0,0,0.25)', 0.5); I.gableRoof(ctx, hx, hy, 0.45, 0.65, 0.6, 0.35, snow ? '#e6eaee' : '#9a8352', 'x', { overhang: 0.1, rows: 4, gableFill: '#8a6a44' }); I.doorR(ctx, hx, 0.65, hy, 0, 0.3, 0.2, 0.32, false); I.windowL(ctx, hx, hy, 0.6, 0.15, 0.3, 0.14, 0.14, {}); }
    // Fischgestell, Netz, umgedrehtes Boot
    for (const u of [0.1, 0.5]) I.line(ctx, [b.x + 1.0, b.y + u, 0], [b.x + 1.0, b.y + u, 0.5], '#4a3a2a', 1.2); I.line(ctx, [b.x + 1.0, b.y + 0.1, 0.45], [b.x + 1.0, b.y + 0.5, 0.45], '#4a3a2a', 1);
    for (let k = 0.14; k < 0.5; k += 0.07) I.line(ctx, [b.x + 1.0, b.y + k, 0.45], [b.x + 1.0, b.y + k, 0.3], '#b8a888', 1.2);
    ctx.strokeStyle = 'rgba(60,50,40,0.6)'; for (let k = 0; k < 5; k++) I.line(ctx, [b.x + 0.2 + k * 0.1, b.y + 0.85, 0.25], [b.x + 0.25 + k * 0.1, b.y + 1.0, 0], 'rgba(60,50,40,0.6)', 0.6);
    I.poly(ctx, [[b.x + 0.1, b.y + 1.9, 0], [b.x + 0.9, b.y + 1.85, 0], [b.x + 0.85, b.y + 2.05, 0.12], [b.x + 0.15, b.y + 2.1, 0.12]], '#4a3018', 'rgba(0,0,0,0.4)');
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
  drawMarket(ctx, b, st) {
    const stalls = [[b.x + 0.3, b.y + 0.3, '#c23b3b'], [b.x + 1.3, b.y + 0.25, '#3b6ac2'], [b.x + 2.3, b.y + 0.3, '#3b9a4a'], [b.x + 0.3, b.y + 1.9, '#c29a3b'], [b.x + 2.3, b.y + 2.0, '#7a3bc2'], [b.x + 1.3, b.y + 2.7, '#c23b3b']];
    stalls.forEach(([x, y, c], i) => {
      const mine = i < st.stalls, col = mine ? '#e0b040' : c;
      I.box(ctx, x, y, 0, 0.55, 0.35, 0.3, { wall: '#7a5a3a', top: '#9a7a4a' });
      for (const [px, py] of [[x, y], [x + 0.55, y], [x, y + 0.35], [x + 0.55, y + 0.35]]) I.line(ctx, [px, py, 0], [px, py, 0.7], '#5a3a1a', 1.2);
      I.gableRoof(ctx, x, y, 0.7, 0.55, 0.35, 0.15, col, 'x', { overhang: 0.08, rows: 2, tileDark: 'rgba(255,255,255,0.35)' });
      const goods = [['#d9c56b', '#c9a24a'], ['#c94a3a', '#8ab04a'], ['#8ab04a', '#d9c56b'], ['#c9a24a', '#8a6a3a'], ['#c94a3a', '#7a3bc2'], ['#e8e0c8', '#3b6ac2']][i];
      for (let k = 0; k < 4; k++) { const p = I.p(x + 0.1 + k * 0.12, y + 0.4, 0.32); ctx.fillStyle = goods[k % 2]; ctx.beginPath(); ctx.arc(p[0], p[1], 2, 0, 6.28); ctx.fill(); }
      if (mine) this.gableFlag(ctx, x + 0.55, y, 0.75);
    });
    for (const [sx, sy] of [[b.x + 0.5, b.y + 1.3], [b.x + 0.7, b.y + 1.35], [b.x + 2.8, b.y + 1.4]]) { const p = I.p(sx, sy, 0); ctx.fillStyle = '#b8a070'; ctx.beginPath(); ctx.ellipse(p[0], p[1] - 2, 4, 3, 0, 0, 6.28); ctx.fill(); }
  },
  drawGate(ctx, b, st, season, sv) {
    I.shadow(ctx, b.x, b.y, b.w, b.d, b.h, sv.v, sv.a);
    I.box(ctx, b.x, b.y, 0, b.w, b.d, b.h, { wall: '#8f887a' }, { noTop: true });
    for (let z = 0.15; z < b.h; z += 0.15) { I.line(ctx, [b.x, b.y + b.d, z], [b.x + b.w, b.y + b.d, z], 'rgba(0,0,0,0.2)', 0.5); I.line(ctx, [b.x + b.w, b.y, z], [b.x + b.w, b.y + b.d, z], 'rgba(0,0,0,0.25)', 0.5); }
    // Torbogen auf der Außenseite (+x) und Innenseite
    const cy = b.y + b.d / 2; I.poly(ctx, [[b.x + b.w, cy - 0.3, 0], [b.x + b.w, cy + 0.3, 0], [b.x + b.w, cy + 0.3, 0.6], [b.x + b.w, cy, 0.85], [b.x + b.w, cy - 0.3, 0.6]], '#1e1a18');
    I.poly(ctx, [[b.x + b.w, cy - 0.22, 0], [b.x + b.w, cy + 0.22, 0], [b.x + b.w, cy + 0.22, 0.5], [b.x + b.w, cy - 0.22, 0.5]], 'rgba(255,240,200,0.14)');
    // Zinnen und Dach
    for (let u = 0; u < b.w; u += 0.25) I.box(ctx, b.x + u, b.y + b.d - 0.12, b.h, 0.12, 0.12, 0.15, { wall: '#7d766a', top: '#9a9284' }); for (let v = 0; v < b.d; v += 0.25) I.box(ctx, b.x + b.w - 0.12, b.y + v, b.h, 0.12, 0.12, 0.15, { wall: '#7d766a', top: '#9a9284' });
    I.pyramid(ctx, b.x + 0.1, b.y + 0.1, b.h + 0.15, b.w - 0.2, b.d - 0.2, 0.9, season === 'winter' ? '#e6eaee' : '#3a3038');
    I.windowR(ctx, b.x, b.w, b.y, 1.1, cy, 0.18, 0.3, { arch: true });
    const p = I.p(b.x + b.w, cy, 1.25); ctx.fillStyle = '#c8102e'; ctx.fillRect(p[0] - 4, p[1] - 6, 8, 4); ctx.fillStyle = '#f0ece0'; ctx.fillRect(p[0] - 4, p[1] - 2, 8, 4);
    const lp = I.p(b.x + b.w + 0.05, cy - 0.45, 0.8), lp2 = I.p(b.x + b.w + 0.05, cy + 0.45, 0.8); this.lamps.push([lp[0], lp[1]], [lp2[0], lp2[1]]);
  },
  wallSegments() {
    const segs = [], W = HK.WORLD, t = 0.5, h = 1.15;
    const seg = (x, y, w, d, k) => segs.push({ k, f: (ctx, sv) => { I.box(ctx, x, y, 0, w, d, h, { wall: '#8f887a', top: '#a9a292' }, { stroke: 'rgba(0,0,0,0)' }); for (let z = 0.15; z < h; z += 0.15) { I.line(ctx, [x, y + d, z], [x + w, y + d, z], 'rgba(0,0,0,0.18)', 0.5); I.line(ctx, [x + w, y, z], [x + w, y + d, z], 'rgba(0,0,0,0.22)', 0.5); } const along = w > d; for (let u = 0.05; u < (along ? w : d) - 0.05; u += 0.25) { if (along) I.box(ctx, x + u, y, h, 0.11, 0.12, 0.13, { wall: '#7d766a', top: '#9a9284' }, { stroke: 'rgba(0,0,0,0.25)' }); else I.box(ctx, x + d - 0.12, y + u, h, 0.12, 0.11, 0.13, { wall: '#7d766a', top: '#9a9284' }, { stroke: 'rgba(0,0,0,0.25)' }); } } });
    // Nordmauer entlang y = WALL_N, Ostmauer entlang x = WALL_E, in Stücke geteilt
    for (let x = W.COAST_X + 0.5; x < W.WALL_E; x += 2) { const x1 = Math.min(x + 2, W.WALL_E); if (x < 15.3 && x1 > 15.7) { seg(x, W.WALL_N - t, 15.3 - x, t, x + 2 + W.WALL_N); seg(15.7, W.WALL_N - t, x1 - 15.7, t, x + 2 + W.WALL_N); } else seg(x, W.WALL_N - t, x1 - x, t, x + 2 + W.WALL_N); }
    segs.push({ k: 15.5 + W.WALL_N + 2, f: (ctx) => { I.box(ctx, 15.3, W.WALL_N - t - 0.1, 0, 0.4, t + 0.2, h + 0.6, { wall: '#8f887a', top: '#a9a292' }, { stroke: 'rgba(0,0,0,0)' }); I.poly(ctx, [[15.32, W.WALL_N + 0.1, 0], [15.68, W.WALL_N + 0.1, 0], [15.68, W.WALL_N + 0.1, 0.7], [15.5, W.WALL_N + 0.1, 0.95], [15.32, W.WALL_N + 0.1, 0.7]], '#1e1a18'); I.pyramid(ctx, 15.25, W.WALL_N - t - 0.15, h + 0.6, 0.5, t + 0.3, 0.5, '#3a3038'); } });
    for (let y = W.WALL_N; y < W.COAST_Y; y += 2) { if (y >= 9.3 && y < 10.7) continue; seg(W.WALL_E, y, t, Math.min(2, W.COAST_Y - y), W.WALL_E + t + y + 2); }
    seg(W.WALL_E, 8.3, t, 1.0, W.WALL_E + 9.8); seg(W.WALL_E, 10.7, t, 1.3, W.WALL_E + 12.5);
    // Türme
    const tower = (cx, cy, r, hh, k) => segs.push({ k, f: (ctx, sv) => { I.cylinder(ctx, cx, cy, 0, r, hh, '#8f887a', { brick: true, noTop: true }); for (let a = 0; a < 6.28; a += 0.6) { const px = cx + Math.cos(a) * r * 0.85, py = cy + Math.sin(a) * r * 0.85; if (px + py > cx + cy - 0.1) I.box(ctx, px - 0.06, py - 0.06, hh, 0.12, 0.12, 0.16, { wall: '#7d766a', top: '#9a9284' }); } I.cone(ctx, cx, cy, hh + 0.16, r + 0.05, 0.9, this.season() === 'winter' ? '#e6eaee' : '#3a3038'); const p = I.p(cx, cy, hh + 1.06); ctx.fillStyle = '#c8102e'; ctx.fillRect(p[0], p[1] - 8, 7 + Math.sin(this.time * 4 + cx), 4); I.line(ctx, [cx, cy, hh + 1.06], [cx, cy, hh + 1.5], '#3a2a1a', 1); } });
    tower(W.WALL_E + 0.25, W.WALL_N - 0.25, 0.55, 1.8, W.WALL_E + W.WALL_N + 1.2);
    tower(W.WALL_E + 0.25, W.COAST_Y + 0.1, 0.55, 1.8, W.WALL_E + W.COAST_Y + 1.2);
    tower(W.COAST_X + 0.6, W.WALL_N - 0.25, 0.45, 1.6, W.COAST_X + W.WALL_N + 1.0);
    tower(15.0, W.WALL_N - 0.25, 0.4, 1.5, 15 + W.WALL_N + 1); tower(16.0, W.WALL_N - 0.25, 0.4, 1.5, 16 + W.WALL_N + 1);
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
    const s = I.p(x, y, 0); if (!this.picking) { ctx.fillStyle = `rgba(15,10,5,${sv.a * 0.8})`; ctx.beginPath(); ctx.ellipse(s[0] + sv.v[0] * 12, s[1] + sv.v[1] * 6 + 2, r * 26, r * 12, 0, 0, 6.28); ctx.fill(); }
    ctx.fillStyle = '#4a3320'; ctx.fillRect(s[0] - 2, s[1] - r * 30, 4, r * 30);
    if (season === 'winter') { ctx.strokeStyle = '#4a3320'; ctx.lineWidth = 1.3; for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.35; ctx.beginPath(); ctx.moveTo(s[0], s[1] - r * 26); ctx.lineTo(s[0] + Math.cos(a) * r * 34, s[1] - r * 26 + Math.sin(a) * r * 34); ctx.stroke(); } return; }
    const cols = season === 'autumn' ? ['#b8702a', '#d08a30', '#e0a848'] : ['#3f6a2e', '#5a8a3a', '#7aa84a'];
    const cy = s[1] - r * 40, sway = Math.sin(this.time * 1.2 + x) * 1.2, R = r * 30;
    ctx.fillStyle = cols[0]; ctx.beginPath(); ctx.arc(s[0] + sway, cy, R, 0, 6.28); ctx.arc(s[0] - R * 0.55 + sway, cy + R * 0.25, R * 0.7, 0, 6.28); ctx.arc(s[0] + R * 0.55 + sway, cy + R * 0.25, R * 0.7, 0, 6.28); ctx.arc(s[0] + sway, cy - R * 0.4, R * 0.65, 0, 6.28); ctx.fill();
    ctx.fillStyle = cols[1]; ctx.beginPath(); ctx.arc(s[0] - R * 0.2 + sway, cy - R * 0.15, R * 0.75, 0, 6.28); ctx.arc(s[0] + R * 0.35 + sway, cy - R * 0.05, R * 0.5, 0, 6.28); ctx.fill();
    ctx.fillStyle = cols[2]; ctx.beginPath(); ctx.arc(s[0] - R * 0.4 + sway, cy - R * 0.45, R * 0.42, 0, 6.28); ctx.arc(s[0] + R * 0.1 + sway, cy - R * 0.55, R * 0.3, 0, 6.28); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.arc(s[0] + R * 0.35 + sway, cy + R * 0.35, R * 0.55, 0, 6.28); ctx.fill();
  },
  barrel3(ctx, x, y, z) { I.cylinder(ctx, x, y, z, 0.11, 0.28, '#7a5a34', {}); const p = I.p(x, y, z + 0.09), q = I.p(x, y, z + 0.2); ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 0.8; for (const c of [p, q]) { ctx.beginPath(); ctx.ellipse(c[0], c[1], 0.11 * I.TW, 0.11 * I.TH, 0, 0, Math.PI); ctx.stroke(); } },
  crate3(ctx, x, y, z, s) { I.box(ctx, x, y, z, s, s, s, { wall: '#9a7a4a', top: '#b08a50' }, { stroke: 'rgba(60,35,10,0.7)' }); I.line(ctx, [x, y + s, z], [x + s, y + s, z + s], 'rgba(60,35,10,0.6)', 0.6); I.line(ctx, [x + s, y, z], [x + s, y + s, z + s], 'rgba(60,35,10,0.6)', 0.6); },
  drawProp(ctx, p, st, sv) {
    switch (p.t) {
      case 'crates': this.crate3(ctx, p.x, p.y, 0, 0.26); this.crate3(ctx, p.x + 0.28, p.y + 0.05, 0, 0.22); this.crate3(ctx, p.x + 0.1, p.y + 0.02, 0.26, 0.2); break;
      case 'barrels': this.barrel3(ctx, p.x, p.y, 0); this.barrel3(ctx, p.x + 0.24, p.y + 0.02, 0); this.barrel3(ctx, p.x + 0.12, p.y + 0.22, 0); break;
      case 'well': { I.cylinder(ctx, p.x, p.y, 0, 0.3, 0.3, '#8f887a', { brick: true }); const c = I.p(p.x, p.y, 0.3); ctx.fillStyle = '#3f6a8a'; ctx.beginPath(); ctx.ellipse(c[0], c[1], 0.22 * I.TW, 0.22 * I.TH, 0, 0, 6.28); ctx.fill(); I.line(ctx, [p.x - 0.28, p.y, 0], [p.x - 0.28, p.y, 0.9], '#4a3320', 2); I.line(ctx, [p.x + 0.28, p.y, 0], [p.x + 0.28, p.y, 0.9], '#4a3320', 2); I.gableRoof(ctx, p.x - 0.35, p.y - 0.25, 0.9, 0.7, 0.5, 0.25, '#5a3a2a', 'x', { overhang: 0.05, rows: 3 }); I.line(ctx, [p.x - 0.28, p.y, 0.75], [p.x + 0.28, p.y, 0.75], '#3a2a1a', 1.5); break; }
      case 'statue': { I.box(ctx, p.x - 0.22, p.y - 0.22, 0, 0.44, 0.44, 0.25, { wall: '#8f887a', top: '#a9a292' }); I.box(ctx, p.x - 0.14, p.y - 0.14, 0.25, 0.28, 0.28, 0.5, { wall: '#7d766a', top: '#9a9284' }); const s = I.p(p.x, p.y, 0.75); ctx.fillStyle = '#8f8878'; ctx.beginPath(); ctx.moveTo(s[0] - 3, s[1]); ctx.lineTo(s[0] + 3, s[1]); ctx.lineTo(s[0] + 4, s[1] - 15); ctx.lineTo(s[0] - 4, s[1] - 15); ctx.fill(); ctx.beginPath(); ctx.arc(s[0], s[1] - 17.5, 3, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#8f8878'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(s[0] + 4, s[1] - 12); ctx.lineTo(s[0] + 8, s[1] - 22); ctx.stroke(); ctx.fillStyle = '#c9a24a'; ctx.fillRect(s[0] - 6, s[1] - 11, 4, 6); break; }
      case 'stalls': this.drawMarket(ctx, HK.BUILDING.market, st); break;
      case 'nets': { for (let k = 0; k < 5; k++) I.line(ctx, [p.x, p.y + k * 0.08, 0.35], [p.x + 0.05, p.y + k * 0.08 + 0.3, 0], 'rgba(60,50,40,0.6)', 0.6); I.line(ctx, [p.x, p.y, 0], [p.x, p.y, 0.4], '#4a3a2a', 1.2); I.line(ctx, [p.x, p.y + 0.35, 0], [p.x, p.y + 0.35, 0.4], '#4a3a2a', 1.2); I.line(ctx, [p.x, p.y, 0.38], [p.x, p.y + 0.35, 0.38], '#4a3a2a', 1); break; }
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
      case 'market': return;
    }
    const owned = (b.panel === 'house' && st.houses[b.plot].owner === 'player') || (b.panel === 'workshop' && st.workshops[b.plot].type) || (b.id === 'tavern' && st.tavernOwned) || (b.id === 'bathhouse' && st.bathhouseOwned) || b.id === 'kontor' || b.id === 'warehouse';
    if (owned) this.gableFlag(ctx, b.x + b.w - 0.06, b.y + b.d - 0.06, b.h);
    if (b.panel === 'house' && st.houses[b.plot].damaged) { I.poly(ctx, [[b.x, b.y + b.d, 0], [b.x + b.w, b.y + b.d, 0], [b.x + b.w, b.y + b.d, b.h], [b.x, b.y + b.d, b.h]], 'rgba(20,15,10,0.6)'); I.poly(ctx, [[b.x + b.w, b.y, 0], [b.x + b.w, b.y + b.d, 0], [b.x + b.w, b.y + b.d, b.h], [b.x + b.w, b.y, b.h]], 'rgba(20,15,10,0.65)'); }
  },

  /* ---------- Schiffe (3D-Rumpf, gedreht) ---------- */
  drawShip(ctx, x, y, heading, s, origin, docked, selected) {
    const c = Math.cos(heading), sn = Math.sin(heading), t = this.time;
    const W = (u, v, z) => [x + (u * c - v * sn) * s, y + (u * sn + v * c) * s, z * s];
    const flag = { luebeck: '#c8102e', bruegge: '#3b6ac2', bergen: '#3b9a4a', danzig: '#c29a3b', riga: '#7a3bc2', stockholm: '#e0c020', london: '#a02020', own: '#e0b040', guard: '#f0ece0' }[origin] || '#888';
    const bob = Math.sin(t * 1.4 + x) * 0.02;
    // Deckssprung: Dollbord steigt zu Bug und Heck an
    const sheer = u => 0.62 + 0.16 * u * u + (u > 0.85 ? (u - 0.85) * 0.9 : 0) + (u < -0.9 ? (-0.9 - u) * 0.6 : 0) + bob;
    const prof = [[1.22, 0], [1.1, 0.13], [0.92, 0.24], [0.68, 0.32], [0.4, 0.37], [0.1, 0.39], [-0.2, 0.39], [-0.5, 0.37], [-0.78, 0.33], [-1.0, 0.25], [-1.13, 0.13], [-1.18, 0]];
    const gw = prof.concat(prof.slice(1, -1).reverse().map(q => [q[0], -q[1]]));
    // Wasserschatten und Gischt
    if (!this.picking) { const sp = I.p(x, y, 0); ctx.fillStyle = 'rgba(5,15,35,0.32)'; ctx.beginPath(); ctx.ellipse(sp[0], sp[1] + 2, 1.15 * s * I.TW * 1.05, 0.5 * s * I.TH * 1.6, -heading * 0.5, 0, 6.28); ctx.fill(); I.poly(ctx, gw.map(g => W(g[0] * 1.02, g[1] * 0.78, 0)), 'rgba(255,255,255,0)', 'rgba(255,255,255,0.45)', 1.6); }
    // Bordwand: gewölbte Streifen zwischen Dollbord und Wasserlinie, nach Licht schattiert
    const lightDir = [-0.55, -0.83];
    const faces = [];
    for (let i = 0; i < gw.length; i++) {
      const a = gw[i], b = gw[(i + 1) % gw.length];
      const strips = [];
      const N = 4;
      for (let k = 0; k < N; k++) { const f0 = k / N, f1 = (k + 1) / N; const bul = f => 1 - 0.45 * f * f + 0.12 * Math.sin(f * Math.PI); const q = [W(a[0] * (1 - 0.06 * f0), a[1] * bul(f0), sheer(a[0]) * (1 - f0) + 0.02), W(b[0] * (1 - 0.06 * f0), b[1] * bul(f0), sheer(b[0]) * (1 - f0) + 0.02), W(b[0] * (1 - 0.06 * f1), b[1] * bul(f1), sheer(b[0]) * (1 - f1) + 0.02), W(a[0] * (1 - 0.06 * f1), a[1] * bul(f1), sheer(a[0]) * (1 - f1) + 0.02)]; strips.push(q); }
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; const nx0 = (b[1] - a[1]), ny0 = -(b[0] - a[0]); const len = Math.hypot(nx0, ny0) || 1; const nwx = (nx0 * c - ny0 * sn) / len, nwy = (nx0 * sn + ny0 * c) / len;
      const lam = Math.max(0, nwx * lightDir[0] + nwy * lightDir[1]);
      const sy = I.p(...W(mx, my, 0.3))[1];
      faces.push({ sy, strips, k: 0.5 + 0.55 * lam, side: my >= 0 ? 1 : -1 });
    }
    faces.sort((a, b) => a.sy - b.sy);
    const strakes = ['#5a3a1e', '#66431f', '#704a22', '#7a5227'];
    for (const f of faces) { f.strips.forEach((q, k) => { I.poly(ctx, q, I.shade(strakes[k], f.k), 'rgba(20,10,5,0.55)', 0.6); }); const top = f.strips[0]; I.line(ctx, [top[0][0], top[0][1], top[0][2] - 0.07 * s], [top[1][0], top[1][1], top[1][2] - 0.07 * s], flag, 1.5 * s); I.line(ctx, [top[0][0], top[0][1], top[0][2] - 0.18 * s], [top[1][0], top[1][1], top[1][2] - 0.18 * s], 'rgba(20,10,5,0.7)', 1.8 * s); }
    // Schanzkleid innen und Deck
    const deckZ = u => sheer(u) - 0.16;
    const inner = gw.map(g => W(g[0] * 0.98, g[1] * 0.9, deckZ(g[0])));
    I.poly(ctx, inner, '#8a6a44', 'rgba(20,10,5,0.6)', 0.7);
    for (let u = -1.0; u < 1.15; u += 0.12) I.line(ctx, W(u, -0.33, deckZ(u)), W(u, 0.33, deckZ(u)), 'rgba(0,0,0,0.22)', 0.5);
    for (let i = 0; i < gw.length; i++) { const a = gw[i], b = gw[(i + 1) % gw.length]; const my = (a[1] + b[1]) / 2; if (my * (Math.abs(heading) < 1.6 ? 1 : -1) < 0) { I.poly(ctx, [W(a[0], a[1], sheer(a[0])), W(b[0], b[1], sheer(b[0])), W(b[0] * 0.98, b[1] * 0.9, deckZ(b[0])), W(a[0] * 0.98, a[1] * 0.9, deckZ(a[0]))], '#4a2e14', 'rgba(20,10,5,0.5)', 0.5); } }
    // Kastelle: erhöhte Plattformen mit Zinnenreling
    const castle = (u0, u1, v, z0, h) => {
      const pts = [W(u0, -v, z0), W(u1, -v, z0), W(u1, v, z0), W(u0, v, z0)]; const top = pts.map(p => [p[0], p[1], p[2] + h]);
      const fs = []; for (let i = 0; i < 4; i++) { const q = [pts[i], pts[(i + 1) % 4], top[(i + 1) % 4], top[i]]; fs.push({ sy: q.reduce((m, p) => m + I.p(p[0], p[1], p[2])[1], 0), q, k: i % 2 ? 0.72 : 0.95 }); }
      fs.sort((a, b) => a.sy - b.sy); for (const f of fs) { I.poly(ctx, f.q, I.shade('#6b4424', f.k), 'rgba(20,10,5,0.6)', 0.6); for (let j = 1; j < 3; j++) { const a = f.q[0], b = f.q[1]; I.line(ctx, [a[0], a[1], a[2] + h * j / 3], [b[0], b[1], b[2] + h * j / 3], 'rgba(0,0,0,0.3)', 0.5); } }
      I.poly(ctx, top, '#9a7a4a', 'rgba(20,10,5,0.7)', 0.6);
      for (let i = 0; i < 4; i++) { const a = top[i], b = top[(i + 1) % 4]; for (let k = 0.06; k < 1; k += 0.18) { const px = a[0] + (b[0] - a[0]) * k, py = a[1] + (b[1] - a[1]) * k; I.line(ctx, [px, py, a[2]], [px, py, a[2] + 0.16], '#3a2410', 1.6 * s); } I.line(ctx, [a[0], a[1], a[2] + 0.16], [b[0], b[1], b[2] + 0.16], '#3a2410', 1.2 * s); }
    };
    castle(-1.02, -0.5, 0.31, deckZ(-0.75) + 0.02, 0.42); castle(0.62, 1.02, 0.22, deckZ(0.8) + 0.02, 0.26);
    // Ladung und Mannschaft
    this.crate3(ctx, W(0.25, 0.08, 0)[0], W(0.25, 0.08, 0)[1], deckZ(0.25), 0.18 * s); this.barrel3(ctx, W(-0.25, -0.16, 0)[0], W(-0.25, -0.16, 0)[1], deckZ(-0.25)); this.barrel3(ctx, W(-0.35, 0.12, 0)[0], W(-0.35, 0.12, 0)[1], deckZ(-0.35));
    if (!this.picking) { const m1 = I.p(...W(0.42, -0.2, deckZ(0.42))), m2 = I.p(...W(-0.76, 0, deckZ(-0.76) + 0.44)); this.drawPerson(ctx, m1[0], m1[1] + 3, '#5a4a7a', 'fisher', 1, false, '#d9a98a', docked ? 0 : t * 5, 1, null, null, 0.7 * s); this.drawPerson(ctx, m2[0], m2[1] + 3, '#7a3a3a', 'merchant', 1, false, '#e8c39e', 0, -1, null, null, 0.66 * s); }
    // Mast, Stage, Wanten mit Webleinen, Mastkorb, Rah, Segel
    const zT = deckZ(0) + 2.25, mb = W(0, 0, deckZ(0)), mt = W(0, 0, zT);
    I.line(ctx, mb, mt, '#2f2012', 3.4 * s); I.line(ctx, mb, mt, '#5a4028', 1.6 * s);
    for (const sd of [-1, 1]) { for (let k = 0; k < 3; k++) I.line(ctx, W(0, 0, zT - 0.35), W(-0.32 + k * 0.3, sd * 0.36, sheer(-0.32 + k * 0.3)), 'rgba(25,15,8,0.85)', 0.6); for (let j = 1; j < 7; j++) { const f = j / 7; I.line(ctx, W(-0.32 * f, sd * 0.36 * f, zT - 0.35 + (sheer(-0.32) - zT + 0.35) * f), W(0.28 * f, sd * 0.36 * f, zT - 0.35 + (sheer(0.28) - zT + 0.35) * f), 'rgba(25,15,8,0.7)', 0.45); } }
    I.line(ctx, W(0, 0, zT), W(1.2, 0, sheer(1.2) + 0.1), 'rgba(25,15,8,0.85)', 0.6); I.line(ctx, W(0, 0, zT), W(-1.15, 0, sheer(-1.15) + 0.45), 'rgba(25,15,8,0.85)', 0.6);
    I.cylinder(ctx, mt[0], mt[1], zT - 0.4, 0.09 * s, 0.1, '#4a3a2a', {});
    const yw = 0.5, yz = zT - 0.5; I.line(ctx, W(0.05, -yw, yz), W(0.05, yw, yz), '#2a1a0a', 2.4 * s);
    if (docked) { I.poly(ctx, [W(0.05, -yw, yz - 0.02), W(0.05, yw, yz - 0.02), W(0.07, yw, yz - 0.12), W(0.09, yw * 0.5, yz - 0.16), W(0.07, 0, yz - 0.12), W(0.09, -yw * 0.5, yz - 0.16), W(0.07, -yw, yz - 0.12)], '#e4d9bf', 'rgba(80,60,30,0.6)', 0.6); for (let k = -yw + 0.15; k < yw; k += 0.25) I.line(ctx, W(0.04, k, yz), W(0.1, k, yz - 0.15), 'rgba(80,60,30,0.6)', 0.6); }
    else { const belly = 0.38 + Math.sin(t * 2) * 0.05; const sail = [W(0.05, -yw, yz), W(0.05, yw, yz), W(0.05 + belly, yw * 0.85, deckZ(0) + 0.75), W(0.05 + belly, -yw * 0.85, deckZ(0) + 0.75)]; I.poly(ctx, sail, '#efe6d2', 'rgba(80,60,30,0.6)', 0.7); const P = sail.map(q => I.p(q[0], q[1], q[2])); ctx.strokeStyle = 'rgba(120,100,70,0.35)'; for (let k = 0.15; k < 1; k += 0.14) { ctx.beginPath(); ctx.moveTo(P[0][0] + (P[1][0] - P[0][0]) * k, P[0][1] + (P[1][1] - P[0][1]) * k); ctx.lineTo(P[3][0] + (P[2][0] - P[3][0]) * k, P[3][1] + (P[2][1] - P[3][1]) * k); ctx.stroke(); } const cxs = (P[0][0] + P[1][0] + P[2][0] + P[3][0]) / 4, cys = (P[0][1] + P[1][1] + P[2][1] + P[3][1]) / 4; ctx.fillStyle = flag; ctx.beginPath(); ctx.moveTo(cxs - 5, cys - 7); ctx.lineTo(cxs + 5, cys - 7); ctx.lineTo(cxs + 5, cys + 1); ctx.quadraticCurveTo(cxs + 5, cys + 6, cxs, cys + 8); ctx.quadraticCurveTo(cxs - 5, cys + 6, cxs - 5, cys + 1); ctx.fill(); ctx.fillStyle = '#f4ead6'; ctx.fillRect(cxs - 0.8, cys - 6, 1.6, 12); ctx.fillRect(cxs - 4, cys - 3, 8, 1.6); }
    // Steven, Bugspriet, Ruder mit Pinne, Wimpel, Heckleuchte
    I.line(ctx, W(1.2, 0, 0.1), W(1.26, 0, sheer(1.2) + 0.3), '#3a2a1a', 3 * s); const kp = I.p(...W(1.26, 0, sheer(1.2) + 0.3)); ctx.fillStyle = '#c9a24a'; ctx.beginPath(); ctx.arc(kp[0], kp[1], 2 * s, 0, 6.28); ctx.fill();
    I.line(ctx, W(1.1, 0, sheer(1.1) + 0.05), W(1.75, 0, sheer(1.2) + 0.5), '#4a3a2a', 2 * s);
    I.line(ctx, W(-1.18, 0, 0.05), W(-1.26, 0, sheer(-1.18) + 0.05), '#2a1a0c', 2.6 * s); I.line(ctx, W(-1.24, 0, sheer(-1.18) + 0.02), W(-0.95, 0, deckZ(-0.95) + 0.5), '#4a3018', 1.3 * s);
    if (!this.picking) { const fp = I.p(...mt); ctx.fillStyle = flag; ctx.beginPath(); ctx.moveTo(fp[0], fp[1]); for (let i = 1; i <= 4; i++) ctx.lineTo(fp[0] + i * 4 * s, fp[1] + Math.sin(t * 6 - i) * 1.5 * (i / 4)); ctx.lineTo(fp[0] + 16 * s, fp[1] + 3 * s); for (let i = 4; i >= 1; i--) ctx.lineTo(fp[0] + i * 4 * s, fp[1] + 3.5 * s + Math.sin(t * 6 - i) * 1.5 * (i / 4)); ctx.closePath(); ctx.fill(); }
    const lp = I.p(...W(-1.1, 0, deckZ(-1.0) + 0.7)); ctx.fillStyle = '#c9a24a'; ctx.fillRect(lp[0] - 1.5, lp[1] - 2, 3, 3); if (this.light() < 0.7) this.lamps.push([lp[0], lp[1]]);
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
