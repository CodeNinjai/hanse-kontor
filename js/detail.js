/* Detailgrafik: Koggen, Häuser, Kai. Überschreibt Zeichenroutinen aus scene.js. */
'use strict';

/* ---------- Kogge in Seitenansicht (Heck links, Bug rechts) ---------- */
HK.Scene.shipBody = function (ctx, flag, docked, mirror) {
  const t = this.time;
  // Rumpf: hoher, bauchiger Koggenrumpf. Wasserlinie y=0, Dollbord mittschiffs y=-30
  const hull = () => { ctx.beginPath(); ctx.moveTo(-50, -34); ctx.quadraticCurveTo(-52, -10, -40, 3); ctx.lineTo(36, 3); ctx.quadraticCurveTo(50, -2, 56, -30); ctx.lineTo(60, -44); ctx.lineTo(54, -43); ctx.quadraticCurveTo(48, -28, 34, -25); ctx.quadraticCurveTo(0, -22, -34, -25); ctx.quadraticCurveTo(-44, -28, -46, -36); ctx.closePath(); };
  hull(); ctx.fillStyle = '#3a2612'; ctx.fill();
  ctx.save(); hull(); ctx.clip();
  // Klinkergänge
  const planks = ['#432c15', '#4d3319', '#583b1e', '#634323', '#6d4a27', '#78522c', '#6a4726', '#5c3e20'];
  for (let i = 0; i < 8; i++) { const yy = 3 - i * 3.4; ctx.fillStyle = planks[i]; ctx.beginPath(); ctx.moveTo(-56, yy - 14); ctx.quadraticCurveTo(-20, yy + 2, 0, yy + 2); ctx.quadraticCurveTo(28, yy + 2, 62, yy - 16); ctx.lineTo(62, 12); ctx.lineTo(-56, 12); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-56, yy - 14); ctx.quadraticCurveTo(-20, yy + 2, 0, yy + 2); ctx.quadraticCurveTo(28, yy + 2, 62, yy - 16); ctx.stroke(); ctx.strokeStyle = 'rgba(255,220,170,0.12)'; ctx.beginPath(); ctx.moveTo(-56, yy - 13); ctx.quadraticCurveTo(-20, yy + 3, 0, yy + 3); ctx.quadraticCurveTo(28, yy + 3, 62, yy - 15); ctx.stroke(); }
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; for (let x = -42; x < 50; x += 6) for (let i = 0; i < 7; i++) ctx.fillRect(x + (i % 2) * 3, -i * 3.4 + 1 - Math.abs(x) * 0.05 * (i < 4 ? 1 : 0.5), 1, 1);
  // Bergholz und Farbstreifen
  ctx.strokeStyle = '#1a1008'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-50, -26); ctx.quadraticCurveTo(0, -16, 56, -32); ctx.stroke();
  ctx.strokeStyle = flag; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-49, -22); ctx.quadraticCurveTo(0, -12.5, 55, -28); ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-60, 0, 130, 4); // dunkle Wasserlinie
  ctx.restore();
  // Ruder mit Pinne
  ctx.fillStyle = '#2a1a0c'; ctx.beginPath(); ctx.moveTo(-50, -30); ctx.lineTo(-55, -28); ctx.lineTo(-54, 2); ctx.lineTo(-48, 1); ctx.fill(); ctx.strokeStyle = '#4a3018'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-52, -30); ctx.lineTo(-36, -38); ctx.stroke();
  // Vorsteven, Bugspriet, Anker
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(56, -36); ctx.lineTo(64, -50); ctx.stroke(); ctx.fillStyle = '#c9a24a'; ctx.beginPath(); ctx.arc(59, -45, 2, 0, 6.28); ctx.fill();
  ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(50, -42); ctx.lineTo(76, -58); ctx.stroke();
  ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(52, -34); ctx.lineTo(52, -18); ctx.moveTo(48, -19); ctx.quadraticCurveTo(52, -13, 56, -19); ctx.moveTo(49, -32); ctx.lineTo(55, -32); ctx.stroke();
  // Deck, Reling mit Stützen
  ctx.fillStyle = '#7a5a34'; ctx.fillRect(-34, -28, 68, 4); ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let x = -32; x < 34; x += 4) ctx.fillRect(x, -28, 0.8, 4);
  ctx.strokeStyle = '#2e1d0e'; ctx.lineWidth = 1; for (let x = -30; x <= 30; x += 6) { ctx.beginPath(); ctx.moveTo(x, -25); ctx.lineTo(x, -33); ctx.stroke(); } ctx.fillStyle = '#4a3018'; ctx.fillRect(-32, -34, 64, 1.6);
  // Heckkastell: zweistöckig, Zinnenreling, Fenster, Heckleuchte
  ctx.fillStyle = this.pat.planks; ctx.fillRect(-48, -56, 28, 24); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(-48, -56, 28, 24);
  ctx.fillStyle = '#4a3018'; ctx.fillRect(-50, -45, 32, 1.5); ctx.fillRect(-50, -57, 32, 2);
  ctx.fillStyle = '#2a1a0a'; for (let i = 0; i < 6; i++) ctx.fillRect(-48 + i * 5, -62, 3, 5);
  ctx.fillStyle = '#20160c'; for (const wx of [-43, -35, -27]) { ctx.fillRect(wx, -52, 5, 5); ctx.fillStyle = 'rgba(180,200,220,0.45)'; ctx.fillRect(wx + 1, -51, 3, 2); ctx.fillStyle = '#20160c'; }
  ctx.fillStyle = flag; ctx.fillRect(-48, -43, 28, 2);
  ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-53, -66, 1.6, 10); ctx.fillStyle = '#c9a24a'; ctx.fillRect(-55, -68, 5, 5); ctx.fillStyle = 'rgba(255,230,140,0.9)'; ctx.fillRect(-54, -67, 3, 3);
  // Bugkastell
  ctx.fillStyle = this.pat.planks; ctx.beginPath(); ctx.moveTo(28, -32); ctx.lineTo(54, -40); ctx.lineTo(54, -50); ctx.lineTo(28, -44); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fill();
  ctx.fillStyle = '#2a1a0a'; for (let i = 0; i < 5; i++) ctx.fillRect(30 + i * 5, -50 - i * 1.2, 2.6, 4);
  // Ladung und Mannschaft
  const bar = (x, y) => { ctx.fillStyle = '#8a6a3a'; ctx.beginPath(); ctx.ellipse(x, y, 3.2, 4, 0, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#2e1d0e'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x - 3, y - 1.8); ctx.lineTo(x + 3, y - 1.8); ctx.moveTo(x - 3, y + 1.8); ctx.lineTo(x + 3, y + 1.8); ctx.stroke(); ctx.fillStyle = 'rgba(255,220,170,0.25)'; ctx.fillRect(x - 1.5, y - 3.5, 1, 7); };
  bar(-14, -37); bar(-7, -37); bar(-10.5, -44); ctx.fillStyle = '#9a7a4a'; ctx.fillRect(12, -43, 9, 9); ctx.strokeStyle = '#4a3018'; ctx.lineWidth = 0.8; ctx.strokeRect(12.5, -42.5, 8, 8); ctx.beginPath(); ctx.moveTo(12, -43); ctx.lineTo(21, -34); ctx.stroke(); ctx.fillStyle = '#c9b078'; ctx.beginPath(); ctx.ellipse(4, -36, 4, 2.6, 0, 0, 6.28); ctx.fill();
  if (!mirror) { this.drawPerson(ctx, 24, -33, '#5a4a7a', 'fisher', 1, false, '#d9a98a', docked ? 0 : t * 5, 1, null, null, 0.8); this.drawPerson(ctx, -36, -57, '#7a3a3a', 'merchant', 1, false, '#e8c39e', 0, -1, null, null, 0.75); this.drawPerson(ctx, -2, -33, '#3a5a7a', 'fisher', 1, false, '#c9946c', 0, 1, null, null, 0.8); }
  // Mast mit Wanten und Webleinen, Rah, Mastkorb
  ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-2.4, -112, 4.8, 84); ctx.fillStyle = 'rgba(255,220,170,0.25)'; ctx.fillRect(-2.4, -112, 1.4, 84);
  ctx.strokeStyle = 'rgba(30,20,10,0.85)'; ctx.lineWidth = 0.7;
  for (const sd of [-1, 1]) { for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(sd * 1.6, -98); ctx.lineTo(sd * (28 + k * 6), -34); ctx.stroke(); } for (let y = -90; y < -38; y += 5) { const f = (y + 98) / 64; ctx.beginPath(); ctx.moveTo(sd * (1.6 + 26.4 * f), y); ctx.lineTo(sd * (1.6 + 38.4 * f), y + 0.8); ctx.stroke(); } }
  ctx.beginPath(); ctx.moveTo(0, -112); ctx.lineTo(74, -56); ctx.moveTo(0, -112); ctx.lineTo(-52, -62); ctx.stroke();
  ctx.fillStyle = '#4a3a2a'; ctx.fillRect(-7.5, -106, 15, 6); ctx.fillStyle = '#2a1a0a'; for (let i = 0; i < 4; i++) ctx.fillRect(-7 + i * 3.8, -109, 1.6, 3);
  ctx.fillStyle = '#2a1a0a'; ctx.fillRect(-36, -96, 72, 2.8); ctx.fillStyle = 'rgba(255,220,170,0.2)'; ctx.fillRect(-36, -96, 72, 0.9);
  if (docked) {
    ctx.fillStyle = '#e4d9bf'; ctx.beginPath(); ctx.moveTo(-36, -94); for (let x = -36; x < 36; x += 8) ctx.quadraticCurveTo(x + 4, -87 + Math.sin(x) * 1.5, x + 8, -91); ctx.lineTo(36, -88); for (let x = 36; x > -36; x -= 8) ctx.quadraticCurveTo(x - 4, -82 + Math.cos(x) * 1.5, x - 8, -86); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.moveTo(-36, -89); ctx.quadraticCurveTo(0, -84, 36, -89); ctx.lineTo(36, -87); ctx.quadraticCurveTo(0, -82, -36, -87); ctx.fill();
    ctx.strokeStyle = 'rgba(80,60,30,0.6)'; ctx.lineWidth = 0.8; for (let x = -32; x <= 32; x += 8) { ctx.beginPath(); ctx.moveTo(x, -95); ctx.lineTo(x, -84); ctx.stroke(); }
  } else {
    const belly = 12 + Math.sin(t * 2) * 1.5;
    const sail = () => { ctx.beginPath(); ctx.moveTo(-36, -94); ctx.lineTo(36, -94); ctx.quadraticCurveTo(36 + belly, -66, 32, -38); ctx.lineTo(-32, -38); ctx.quadraticCurveTo(-36 + belly * 0.4, -66, -36, -94); ctx.closePath(); };
    sail(); ctx.fillStyle = '#efe6d2'; ctx.fill();
    ctx.save(); sail(); ctx.clip();
    ctx.strokeStyle = 'rgba(120,100,70,0.35)'; ctx.lineWidth = 0.8; for (let x = -28; x <= 28; x += 8) { ctx.beginPath(); ctx.moveTo(x, -94); ctx.quadraticCurveTo(x + belly * 0.15, -66, x - 1, -38); ctx.stroke(); }
    const g = ctx.createLinearGradient(-36, 0, 44, 0); g.addColorStop(0, 'rgba(0,0,0,0.24)'); g.addColorStop(0.45, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(255,255,240,0.25)'); ctx.fillStyle = g; ctx.fillRect(-44, -100, 100, 70);
    ctx.fillStyle = flag; ctx.beginPath(); ctx.moveTo(-10, -80); ctx.lineTo(10, -80); ctx.lineTo(10, -64); ctx.quadraticCurveTo(10, -54, 0, -50); ctx.quadraticCurveTo(-10, -54, -10, -64); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f4ead6'; ctx.fillRect(-1.6, -78, 3.2, 24); ctx.fillRect(-8, -71, 16, 3.2);
    ctx.restore();
    ctx.strokeStyle = 'rgba(60,40,20,0.6)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-32, -38); ctx.lineTo(-44, -30); ctx.moveTo(32, -38); ctx.lineTo(46, -30); ctx.stroke();
  }
  if (!mirror) { ctx.fillStyle = flag; ctx.beginPath(); ctx.moveTo(2.4, -112); for (let i = 1; i <= 5; i++) ctx.lineTo(2.4 + i * 5.5, -112 + Math.sin(t * 6 - i) * 1.8 * (i / 5)); ctx.lineTo(30, -109); for (let i = 5; i >= 1; i--) ctx.lineTo(2.4 + i * 5.5, -107.5 + Math.sin(t * 6 - i) * 1.8 * (i / 5)); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(2.4, -110.3, 9, 1); }
};

/* ---------- Häuser mit mehr Substanz ---------- */
HK.Scene.win2 = function (ctx, x, y, w, h, o) {
  o = o || {};
  // Rahmen, Glas mit Bleiruten, Kreuz, Fensterbank
  ctx.fillStyle = o.frame || '#5a4028'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = '#22252c'; if (o.arch) { ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + w / 2); ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); ctx.lineTo(x + w, y + h); ctx.fill(); } else ctx.fillRect(x, y, w, h);
  const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, 'rgba(170,200,225,0.55)'); g.addColorStop(0.5, 'rgba(120,150,180,0.25)'); g.addColorStop(1, 'rgba(60,80,110,0.2)'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(40,40,50,0.6)'; ctx.lineWidth = 0.5; for (let d = -h; d < w; d += 2.6) { ctx.beginPath(); ctx.moveTo(x + d, y); ctx.lineTo(x + d + h, y + h); ctx.stroke(); }
  ctx.fillStyle = '#d9d0b8'; if (w > 5) { ctx.fillRect(x + w / 2 - 0.5, y, 1, h); ctx.fillRect(x, y + h * 0.45, w, 1); }
  ctx.fillStyle = o.sill || '#8a7a5a'; ctx.fillRect(x - 1.5, y + h, w + 3, 1.2);
  if (o.shutters) { ctx.fillStyle = o.shutters; ctx.fillRect(x - 4, y - 0.5, 3, h + 1); ctx.fillRect(x + w + 1, y - 0.5, 3, h + 1); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x - 4, y + h / 2, 3, 0.8); ctx.fillRect(x + w + 1, y + h / 2, 3, 0.8); }
  if (o.flowers) { ctx.fillStyle = '#4a6a2a'; ctx.fillRect(x - 1, y + h + 1.2, w + 2, 2.4); for (let k = 0; k < w; k += 2.2) { ctx.fillStyle = ['#c8102e', '#e0b040', '#e88'][(k | 0) % 3]; ctx.fillRect(x + k, y + h + 0.6, 1.2, 1.2); } }
  this.windows.push([x, y, w, h]);
};
HK.Scene.roofTiles = function (ctx, pts, color, snow) {
  ctx.save(); ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]); ctx.closePath(); ctx.clip();
  const minY = Math.min(...pts.map(p => p[1])), maxY = Math.max(...pts.map(p => p[1])), minX = Math.min(...pts.map(p => p[0])), maxX = Math.max(...pts.map(p => p[0]));
  ctx.fillStyle = snow ? '#e8ecf0' : color; ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
  if (!snow) { let row = 0; for (let y = minY; y < maxY; y += 3) { for (let x = minX - 4 + (row % 2) * 2; x < maxX + 4; x += 4) { ctx.fillStyle = `rgba(0,0,0,${0.18 + ((x * 7 + y * 3) % 5) * 0.03})`; ctx.beginPath(); ctx.arc(x, y + 3, 2, 0, Math.PI); ctx.fill(); } ctx.fillStyle = 'rgba(255,220,180,0.08)'; ctx.fillRect(minX, y, maxX - minX, 0.8); row++; } }
  const g = ctx.createLinearGradient(0, minY, 0, maxY); g.addColorStop(0, 'rgba(255,240,200,0.16)'); g.addColorStop(1, 'rgba(0,0,0,0.3)'); ctx.fillStyle = g; ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
  ctx.restore();
  ctx.strokeStyle = 'rgba(30,18,10,0.7)'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]); ctx.closePath(); ctx.stroke();
};
HK.Scene.drawEave = function (ctx, b, st, season, opts) {
  opts = opts || {};
  const s = [0.82, 0.92, 1][b.row] || 1, x = b.x, y = b.y, w = b.w, h = b.h, rh = Math.round(h * 0.4), fh = h - rh, d = 12 * s;
  const wall = b.wall || '#e2d4b4', roof = b.roof || '#8f3f2e', dark = ['#5b5560', '#4e4a52', '#5a4a4a'].includes(roof);
  const seed = (x * 13 + y * 7) | 0;
  this.shadowPoly(ctx, x, y + rh, w, fh); this.ao(ctx, x, y + h, w);
  // Seitenwand mit Giebeldreieck (Tiefe)
  ctx.fillStyle = b.stone ? '#6f685c' : this.shade(wall, 0.7); ctx.beginPath(); ctx.moveTo(x + w, y + rh); ctx.lineTo(x + w + d, y + rh - d * 0.55); ctx.lineTo(x + w + d, y + h - d * 0.55); ctx.lineTo(x + w, y + h); ctx.fill();
  ctx.fillStyle = dark ? '#3f3a44' : this.shade(roof, 0.75); ctx.beginPath(); ctx.moveTo(x + w - 7, y); ctx.lineTo(x + w + d - 7, y - d * 0.55); ctx.lineTo(x + w + d + 3, y + rh - d * 0.55); ctx.lineTo(x + w + 3, y + rh); ctx.fill();
  // Erdgeschoss: Steinsockel oder Putz, Obergeschoss vorkragend
  const gf = y + rh + fh * 0.5;
  ctx.fillStyle = b.stone ? this.pat.stone : this.shade(wall, 0.93); ctx.fillRect(x, gf, w, fh * 0.5);
  if (!b.stone) { ctx.fillStyle = this.pat.plaster; ctx.fillRect(x, gf, w, fh * 0.5); ctx.fillStyle = '#8a8070'; ctx.fillRect(x, y + h - 5, w, 5); ctx.fillStyle = 'rgba(0,0,0,0.15)'; for (let k = 0; k < w; k += 7) ctx.fillRect(x + k, y + h - 5, 0.8, 5); }
  ctx.fillStyle = b.stone ? this.pat.stone : wall; ctx.fillRect(x - 2, y + rh, w + 2, fh * 0.5 + 1);
  if (!b.stone) { ctx.fillStyle = this.pat.plaster; ctx.fillRect(x - 2, y + rh, w + 2, fh * 0.5); }
  ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(x - 2, gf, w + 2, 2.2); // Schatten der Vorkragung
  ctx.fillStyle = '#4a3320'; ctx.fillRect(x - 2, gf - 1.5, w + 2, 1.5); // Schwellbalken
  let bays = 3;
  if (!b.stone) {
    bays = Math.max(2, Math.round(w / (17 * s)));
    // Fachwerk oben mit Backstein-Ausfachung in einzelnen Feldern
    const bw = w / bays;
    if (seed % 3 === 0) { ctx.fillStyle = this.pat.brick; for (let i = 0; i < bays; i++) if ((i + seed) % 2) ctx.fillRect(x + i * bw, y + rh, bw, fh * 0.5); }
    this.timberFrame(ctx, x, y + rh, w, fh * 0.5, s);
    ctx.strokeStyle = 'rgba(70,45,22,0.85)'; ctx.lineWidth = 1.6 * s; for (let i = 1; i < bays; i++) { ctx.beginPath(); ctx.moveTo(x + i * bw, gf); ctx.lineTo(x + i * bw, y + h - 5); ctx.stroke(); }
    ctx.fillStyle = '#4a3320'; for (let i = 0; i <= bays; i++) ctx.fillRect(x + i * bw - 1.5, gf, 3, 3); // Knaggen
  } else { bays = Math.max(2, Math.round(w / 22)); ctx.fillStyle = '#c9c0ad'; ctx.fillRect(x, gf - 1, w, 1.5); }
  const bw = w / bays, shut = [null, '#4f6f3f', '#7a3a3a', '#3a5a7a', '#6a5a2a'][seed % 5], flowers = seed % 2 === 0;
  for (let i = 0; i < bays; i++) this.win2(ctx, x + i * bw + bw / 2 - 4 * s, y + rh + 4 * s, 8 * s, 10 * s, { shutters: shut, flowers, arch: b.stone });
  const doorBay = Math.floor(bays / 2);
  for (let i = 0; i < bays; i++) { if (i === doorBay) continue; this.win2(ctx, x + i * bw + bw / 2 - 4 * s, gf + 5 * s, 8 * s, 10 * s, { arch: b.stone }); }
  // Tür mit Bogen, Stufe, Beschlag
  const dx = x + doorBay * bw + bw / 2 - 5.5 * s, dh = 17 * s; ctx.fillStyle = '#8a8070'; ctx.fillRect(dx - 2, y + h - 2, 15 * s, 2);
  ctx.fillStyle = '#5a4028'; ctx.fillRect(dx - 1.5, y + h - dh - 1.5, 14 * s, dh + 1.5);
  this.door(ctx, dx, y + h - dh, 11 * s, dh, true); ctx.strokeStyle = '#2a1a0a'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(dx + 5.5 * s, y + h - dh + 3); ctx.lineTo(dx + 5.5 * s, y + h); ctx.stroke();
  // Erker bei breiten Häusern
  if (w > 76 && seed % 2) { const ox = x + w - 18 * s; ctx.fillStyle = this.shade(wall, 0.96); ctx.fillRect(ox, y + rh + 2, 12 * s, fh * 0.5 - 3); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(ox, y + rh + 2, 12 * s, 1.5); ctx.fillRect(ox, gf - 4, 12 * s, 3); ctx.strokeStyle = 'rgba(70,45,22,0.85)'; ctx.lineWidth = 1.2; ctx.strokeRect(ox, y + rh + 2, 12 * s, fh * 0.5 - 3); this.win2(ctx, ox + 3 * s, y + rh + 5 * s, 6 * s, 9 * s, {}); ctx.fillStyle = this.shade(roof, 0.8); ctx.beginPath(); ctx.moveTo(ox - 2, y + rh + 2); ctx.lineTo(ox + 12 * s + 2, y + rh + 2); ctx.lineTo(ox + 6 * s, y + rh - 5); ctx.fill(); }
  // Dach mit Ziegeln, First, Gaube, Schornstein
  this.roofTiles(ctx, [[x - 4, y + rh], [x + w + 4, y + rh], [x + w - 7, y], [x + 7, y]], dark ? '#4e4650' : roof, season === 'winter');
  ctx.fillStyle = dark ? '#2f2a33' : this.shade(roof, 0.6); for (let k = x + 7; k < x + w - 7; k += 4) ctx.fillRect(k, y - 1.5, 3, 2.2);
  if (w > 64) { const gx = x + w * 0.42, gy = y + rh * 0.3; ctx.fillStyle = this.shade(wall, 0.92); ctx.fillRect(gx - 7, gy, 14, rh * 0.55); ctx.strokeStyle = 'rgba(70,45,22,0.8)'; ctx.lineWidth = 1; ctx.strokeRect(gx - 7, gy, 14, rh * 0.55); this.roofTiles(ctx, [[gx - 10, gy], [gx + 10, gy], [gx, gy - 9]], dark ? '#4e4650' : roof, season === 'winter'); this.win2(ctx, gx - 3.5, gy + 3, 7, 7, {}); }
  ctx.fillStyle = '#6a5a54'; ctx.fillRect(x + w * 0.78, y + 1, 7 * s, 13 * s); ctx.fillStyle = '#3a2f2c'; ctx.fillRect(x + w * 0.78 - 1.5, y - 2, 7 * s + 3, 3.5); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x + w * 0.78, y + 1, 1.5, 13 * s);
  if (season === 'winter') { ctx.fillStyle = '#eef1f4'; ctx.fillRect(x - 4, y + rh - 1.5, w + 8, 2.5); }
  // Aushängeschilder
  const sign = (icon) => { ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - 1, y + rh + 6); ctx.lineTo(x - 15, y + rh + 6); ctx.lineTo(x - 15, y + rh + 9); ctx.stroke(); ctx.fillStyle = '#4a3320'; ctx.fillRect(x - 18, y + rh + 9, 12, 10); ctx.fillStyle = '#f0e6cc'; ctx.fillRect(x - 17, y + rh + 10, 10, 8); icon(x - 12, y + rh + 14); };
  if (b.sign === 'tavern') sign((cx, cy) => { ctx.fillStyle = '#c9a24a'; ctx.beginPath(); ctx.ellipse(cx, cy, 4, 2.2, -0.4, 0, 6.28); ctx.fill(); ctx.fillStyle = '#7a2a2a'; ctx.fillRect(cx - 4.5, cy - 1.5, 2, 3); });
  if (b.sign === 'bank') sign((cx, cy) => { ctx.fillStyle = '#e0b040'; ctx.beginPath(); ctx.arc(cx, cy, 3, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#7a5a10'; ctx.lineWidth = 0.8; ctx.stroke(); });
  if (b.id === 'customs') { for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? '#f0ece0' : '#c8102e'; ctx.fillRect(x - 8, gf + 2 + i * 5, 3, 5); } ctx.fillStyle = '#c8102e'; ctx.fillRect(x + w / 2 - 6, y + rh + 1, 12, 7); ctx.fillStyle = '#f0ece0'; ctx.fillRect(x + w / 2 - 6, y + rh + 4.5, 12, 3.5); }
  if (b.id === 'bathhouse') { for (let i = 0; i < 3; i++) { ctx.fillStyle = `rgba(240,240,240,${0.25 - i * 0.06})`; ctx.beginPath(); ctx.arc(x + w * 0.78 + 3 + Math.sin(this.time * 2 + i) * 3, y - 6 - i * 7, 4 + i * 2, 0, 6.28); ctx.fill(); } }
  if (opts.workshop) this.workshopDeco(ctx, b, opts.workshop, s, st);
};

/* ---------- Giebelhäuser (Backstein-Treppengiebel / Fachwerk) ---------- */
HK.Scene.drawGable = function (ctx, b, st, season) {
  const s = [0.82, 0.92, 1][b.row] || 1, x = b.x, y = b.y, w = b.w, h = b.h, gh = Math.round(h * 0.46), fh = h - gh, d = 12 * s;
  const brick = !!b.brick, wall = b.wall || '#e2d4b4', roofC = b.roof || '#7a3a2a', seed = (x * 11 + y * 5) | 0;
  this.shadowPoly(ctx, x, y + gh, w, fh); this.ao(ctx, x, y + h, w);
  // Dachfläche hinter dem Giebel (rechte Seite sichtbar)
  this.roofTiles(ctx, [[x + w - 2, y + gh], [x + w + d, y + gh - d * 0.55], [x + w / 2 + d, y - d * 0.55 + 2], [x + w / 2, y + 2]], roofC, season === 'winter');
  // Seitenwand
  ctx.fillStyle = brick ? '#6e2f24' : this.shade(wall, 0.7); ctx.beginPath(); ctx.moveTo(x + w, y + gh); ctx.lineTo(x + w + d, y + gh - d * 0.55); ctx.lineTo(x + w + d, y + h - d * 0.55); ctx.lineTo(x + w, y + h); ctx.fill();
  if (brick) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let yy = y + gh + 4; yy < y + h; yy += 4) { ctx.beginPath(); ctx.moveTo(x + w, yy); ctx.lineTo(x + w + d, yy - d * 0.55); ctx.lineTo(x + w + d, yy - d * 0.55 + 1); ctx.lineTo(x + w, yy + 1); ctx.fill(); } }
  const steps = 6;
  const facade = () => { ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + gh); if (brick) { for (let i = 0; i <= steps; i++) { const sx = x + (w / 2) * i / steps, sy = y + gh - gh * i / steps; ctx.lineTo(sx, sy); ctx.lineTo(sx + (w / 2) / steps, sy); } for (let i = steps; i >= 0; i--) { const sx = x + w / 2 + (w / 2) * (steps - i) / steps, sy = y + gh - gh * i / steps; ctx.lineTo(sx, sy); ctx.lineTo(sx + (w / 2) / steps, sy); } } else ctx.lineTo(x + w / 2, y); ctx.lineTo(x + w, y + gh); ctx.lineTo(x + w, y + h); ctx.closePath(); };
  facade(); ctx.fillStyle = brick ? this.pat.brick : wall; ctx.fill();
  if (!brick) { facade(); ctx.fillStyle = this.pat.plaster; ctx.fill(); }
  ctx.save(); facade(); ctx.clip();
  if (brick) {
    // Blendnischen mit hellem Putz, Spitzbogenfenster, Luken, Zieranker
    const cols = 3, cw = (w - 12) / cols;
    for (let i = 0; i < cols; i++) { const nx = x + 6 + i * cw + 2; ctx.fillStyle = '#e8dcc4'; ctx.beginPath(); ctx.moveTo(nx, y + h - 6); ctx.lineTo(nx, y + gh + 4 + cw * 0.4); ctx.arc(nx + cw / 2 - 2, y + gh + 4 + cw * 0.4, cw / 2 - 2, Math.PI, 0); ctx.lineTo(nx + cw - 4, y + h - 6); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(nx, y + gh + 4, cw - 4, h); }
    for (let i = 0; i < cols; i++) { const wx = x + 6 + i * cw + cw / 2 - 4; this.win2(ctx, wx, y + gh + fh * 0.2, 8, 12, { arch: true, frame: '#3a2a20' }); if (i !== 1) this.win2(ctx, wx, y + gh + fh * 0.62, 8, 12, { arch: true, frame: '#3a2a20' }); }
    ctx.fillStyle = '#2b2620'; ctx.fillRect(x + w / 2 - 6, y + gh * 0.5, 12, 11); ctx.fillStyle = '#5a4028'; ctx.fillRect(x + w / 2 - 0.6, y + gh * 0.5, 1.2, 11); ctx.fillRect(x + w / 2 - 6, y + gh * 0.5 + 5, 12, 1);
    ctx.fillStyle = '#2b2620'; ctx.beginPath(); ctx.arc(x + w / 2, y + gh * 0.22, 3.5, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#c9c0ad'; ctx.lineWidth = 1; ctx.stroke(); // Oculus
    ctx.fillStyle = '#e8dcc4'; for (let i = 0; i <= steps; i++) { ctx.fillRect(x + (w / 2) * i / steps, y + gh - gh * i / steps - 1.5, w / 2 / steps, 1.5); ctx.fillRect(x + w / 2 + (w / 2) * (steps - i) / steps, y + gh - gh * i / steps - 1.5, w / 2 / steps, 1.5); } // Giebelabdeckung
    ctx.fillStyle = '#2a2a2a'; for (let i = 0; i < 4; i++) ctx.fillRect(x + 8 + i * (w - 16) / 3, y + gh + 4, 3, 1.2); // Maueranker
    this.door(ctx, x + w / 2 - 7, y + h - 19, 14, 19, true); ctx.fillStyle = '#8a8070'; ctx.fillRect(x + w / 2 - 9, y + h - 2, 18, 2);
  } else {
    const bays = Math.max(2, Math.round(w / (17 * s))), bw = w / bays, gf = y + gh + fh * 0.5;
    ctx.fillStyle = this.shade(wall, 0.93); ctx.fillRect(x, gf, w, fh * 0.5); ctx.fillStyle = this.pat.plaster; ctx.fillRect(x, gf, w, fh * 0.5);
    ctx.fillStyle = '#8a8070'; ctx.fillRect(x, y + h - 5, w, 5);
    if (seed % 2) { ctx.fillStyle = this.pat.brick; for (let i = 0; i < bays; i++) if ((i + seed) % 2) ctx.fillRect(x + i * bw, y + gh, bw, fh * 0.5); }
    this.timberFrame(ctx, x, y + gh, w, fh * 0.5, s);
    ctx.strokeStyle = 'rgba(70,45,22,0.85)'; ctx.lineWidth = 1.6 * s; for (let i = 1; i < bays; i++) { ctx.beginPath(); ctx.moveTo(x + i * bw, gf); ctx.lineTo(x + i * bw, y + h - 5); ctx.stroke(); }
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(x, gf, w, 2.2); ctx.fillStyle = '#4a3320'; ctx.fillRect(x, gf - 1.5, w, 1.5);
    // Giebelfachwerk: Sparren, Riegel, Andreaskreuz
    ctx.strokeStyle = 'rgba(70,45,22,0.85)'; ctx.lineWidth = 1.5 * s; ctx.beginPath(); ctx.moveTo(x + w / 2, y + 2); ctx.lineTo(x + w / 2, y + gh); ctx.moveTo(x + w * 0.2, y + gh * 0.6); ctx.lineTo(x + w * 0.8, y + gh * 0.6); ctx.moveTo(x + w * 0.2, y + gh * 0.6); ctx.lineTo(x + w * 0.2, y + gh); ctx.moveTo(x + w * 0.8, y + gh * 0.6); ctx.lineTo(x + w * 0.8, y + gh); ctx.moveTo(x + w * 0.35, y + gh * 0.3); ctx.lineTo(x + w * 0.65, y + gh * 0.3); ctx.moveTo(x + w * 0.2, y + gh); ctx.lineTo(x + w * 0.35, y + gh * 0.6); ctx.moveTo(x + w * 0.8, y + gh); ctx.lineTo(x + w * 0.65, y + gh * 0.6); ctx.stroke();
    const shut = [null, '#4f6f3f', '#7a3a3a', '#3a5a7a'][seed % 4];
    for (let i = 0; i < bays; i++) this.win2(ctx, x + i * bw + bw / 2 - 4 * s, y + gh + 4 * s, 8 * s, 10 * s, { shutters: shut, flowers: seed % 3 === 0 });
    const doorBay = Math.floor(bays / 2); for (let i = 0; i < bays; i++) if (i !== doorBay) this.win2(ctx, x + i * bw + bw / 2 - 4 * s, gf + 5 * s, 8 * s, 10 * s, {});
    this.win2(ctx, x + w / 2 - 3, y + gh * 0.68, 6, 7, {});
    const dx = x + doorBay * bw + bw / 2 - 5.5 * s; ctx.fillStyle = '#5a4028'; ctx.fillRect(dx - 1.5, y + h - 18.5 * s, 14 * s, 18.5 * s); this.door(ctx, dx, y + h - 17 * s, 11 * s, 17 * s, false); ctx.fillStyle = '#8a8070'; ctx.fillRect(dx - 2, y + h - 2, 15 * s, 2);
  }
  ctx.restore();
  facade(); ctx.strokeStyle = 'rgba(40,20,10,0.6)'; ctx.lineWidth = 1; ctx.stroke();
  if (!brick) { ctx.fillStyle = this.shade(roofC, 0.6); ctx.beginPath(); ctx.moveTo(x - 3, y + gh + 1); ctx.lineTo(x + w / 2, y - 2); ctx.lineTo(x + w + 3, y + gh + 1); ctx.lineTo(x + w, y + gh + 1); ctx.lineTo(x + w / 2, y + 1); ctx.lineTo(x, y + gh + 1); ctx.fill(); }
  if (b.hoist) { ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + w / 2, y + 4); ctx.lineTo(x + w / 2, y - 9); ctx.lineTo(x + w / 2 + 16, y - 7); ctx.stroke(); ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + w / 2, y - 9); ctx.lineTo(x + w / 2 + 16, y + 2); ctx.stroke(); ctx.strokeStyle = '#222'; ctx.lineWidth = 0.8; const hy = y + gh * 0.5 + Math.sin(this.time) * 4; ctx.beginPath(); ctx.moveTo(x + w / 2 + 16, y - 7); ctx.lineTo(x + w / 2 + 16, hy); ctx.stroke(); ctx.fillStyle = '#9a7a4a'; ctx.fillRect(x + w / 2 + 12, hy, 9, 7); ctx.strokeStyle = '#4a3018'; ctx.strokeRect(x + w / 2 + 12.5, hy + 0.5, 8, 6); }
  if (brick) { ctx.fillStyle = '#c9c0ad'; ctx.fillRect(x + w / 2 - 1.5, y - 6, 3, 6); ctx.beginPath(); ctx.arc(x + w / 2, y - 7, 2, 0, 6.28); ctx.fill(); } // Giebelzier
  ctx.fillStyle = '#6a5a54'; ctx.fillRect(x + w * 0.8, y + gh * 0.6, 6 * s, 11 * s); ctx.fillStyle = '#3a2f2c'; ctx.fillRect(x + w * 0.8 - 1.5, y + gh * 0.6 - 2, 6 * s + 3, 3);
};

/* ---------- Kai mit Stegen, Mole und Leuchtfeuer ---------- */
HK.Scene.drawQuay = function (ctx, t) {
  const QY = HK.SCENE.QUAY_Y, HZ = HK.SCENE.HORIZON;
  // Mole links mit Leuchtfeuer
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, HZ + 72, 118, 6);
  ctx.fillStyle = this.pat.stone; ctx.beginPath(); ctx.moveTo(0, HZ + 62); ctx.lineTo(96, HZ + 64); ctx.quadraticCurveTo(122, HZ + 66, 118, HZ + 78); ctx.lineTo(0, HZ + 80); ctx.fill(); ctx.fillStyle = 'rgba(30,40,50,0.35)'; ctx.fillRect(0, HZ + 72, 118, 8);
  for (let x = 6; x < 110; x += 14) { ctx.fillStyle = '#7d766a'; ctx.beginPath(); ctx.ellipse(x, HZ + 66, 6, 3, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.ellipse(x - 1, HZ + 65, 3, 1.4, 0, 0, 6.28); ctx.fill(); }
  const bx = 104, by = HZ + 66; ctx.fillStyle = this.pat.stone; ctx.fillRect(bx - 6, by - 30, 12, 30); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(bx + 1, by - 30, 5, 30); ctx.fillStyle = '#5e594e'; for (let i = 0; i < 3; i++) ctx.fillRect(bx - 7 + i * 5, by - 34, 3, 4);
  const fire = 0.7 + Math.sin(t * 9) * 0.3; if (this.light() < 0.75) { ctx.fillStyle = `rgba(255,140,40,${fire})`; ctx.beginPath(); ctx.arc(bx, by - 35, 2.5, 0, 6.28); ctx.fill(); this.lamps.push([bx, by - 35]); }
  // Kaimauer
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, QY - 3, 960, 3);
  ctx.fillStyle = this.pat.stone; ctx.fillRect(0, QY, 960, 14); ctx.fillStyle = 'rgba(40,50,60,0.35)'; ctx.fillRect(0, QY, 960, 14); ctx.fillStyle = 'rgba(40,70,50,0.35)'; ctx.fillRect(0, QY, 960, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; for (let x = 0; x < 960; x += 3) if ((x * 7) % 5 < 2) ctx.fillRect(x, QY - 1.5 + Math.sin(t * 3 + x * 0.2), 2, 1); // Gischt
  for (let x = 30; x < 960; x += 90) { ctx.fillStyle = '#2e2826'; ctx.fillRect(x - 3, QY + 12, 6, 8); ctx.fillStyle = '#5a504a'; ctx.fillRect(x - 3, QY + 12, 6, 2); ctx.fillStyle = '#3a3230'; ctx.beginPath(); ctx.arc(x, QY + 12, 3.2, Math.PI, 0); ctx.fill(); }
  for (let x = 480; x < 960; x += 380) { ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, QY); ctx.lineTo(x, QY + 14); ctx.moveTo(x + 5, QY); ctx.lineTo(x + 5, QY + 14); for (let y = QY + 3; y < QY + 14; y += 4) { ctx.moveTo(x, y); ctx.lineTo(x + 5, y); } ctx.stroke(); }
  // Holzstege auf Pfählen
  for (const p of HK.PIERS) {
    const top = QY - p.len;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(p.x - 12, top + 4, 26, p.len);
    for (let y = top + 6; y < QY; y += 9) { ctx.fillStyle = '#4a3320'; ctx.fillRect(p.x - 12, y, 3, 8); ctx.fillRect(p.x + 9, y, 3, 8); ctx.fillStyle = 'rgba(40,70,50,0.5)'; ctx.fillRect(p.x - 12, y + 5, 3, 3); ctx.fillRect(p.x + 9, y + 5, 3, 3); }
    ctx.fillStyle = this.pat.planks; ctx.save(); ctx.translate(p.x - 11, top); ctx.rotate(Math.PI / 2); ctx.fillRect(0, -22, p.len + 2, 22); ctx.restore();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(p.x - 11, top, 22, p.len + 2); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 0.6; for (let y = top; y < QY; y += 3.2) { ctx.beginPath(); ctx.moveTo(p.x - 11, y); ctx.lineTo(p.x + 11, y); ctx.stroke(); }
    ctx.fillStyle = '#2e2826'; ctx.fillRect(p.x - 13, top - 2, 4, 6); ctx.fillRect(p.x + 9, top - 2, 4, 6); ctx.fillStyle = '#3a3230'; ctx.fillRect(p.x - 3, top + 18, 5, 4);
    ctx.fillStyle = '#9a7a4a'; ctx.fillRect(p.x + 2, top + 30, 7, 7); ctx.strokeStyle = '#4a3018'; ctx.strokeRect(p.x + 2.5, top + 30.5, 6, 6); this.barrel(ctx, p.x - 5, top + 12);
    this.lamps.push([p.x, top - 4]); ctx.fillStyle = '#2a2420'; ctx.fillRect(p.x - 0.8, top - 18, 1.6, 18); ctx.fillStyle = '#3a3430'; ctx.fillRect(p.x - 3, top - 21, 6, 5);
  }
  // Taue zu den Schiffen
  if (HK.state) HK.state.ships.forEach((s, i) => { const a = this.shipAnim[s.id]; if (a && !a.leaving && Math.abs(a.x - a.tx) < 4) { const pier = HK.PIERS[Math.floor(i / 2)]; const side = i % 2 ? -1 : 1; ctx.strokeStyle = 'rgba(60,45,30,0.9)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x + side * 44 * a.s, a.y - 14 * a.s); ctx.quadraticCurveTo(a.x + side * 60 * a.s, a.y - 4, pier.x - side * 10, a.y + 4); ctx.moveTo(a.x - side * 40 * a.s, a.y - 12 * a.s); ctx.quadraticCurveTo(a.x - side * 44 * a.s, QY - 6, a.x - side * 30, QY + 12); ctx.stroke(); } });
  // Kran
  const cx = 470, cy = QY + 16; ctx.fillStyle = '#4a3320'; ctx.fillRect(cx - 5, cy - 52, 10, 52); ctx.fillStyle = 'rgba(255,220,170,0.2)'; ctx.fillRect(cx - 5, cy - 52, 2, 52);
  ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.moveTo(cx - 12, cy); ctx.lineTo(cx + 12, cy); ctx.lineTo(cx + 8, cy - 8); ctx.lineTo(cx - 8, cy - 8); ctx.fill(); ctx.fillStyle = '#5a4020'; ctx.beginPath(); ctx.arc(cx, cy - 20, 9, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#2a1a0a'; ctx.lineWidth = 1; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(cx, cy - 20); ctx.lineTo(cx + Math.cos(i + t * 0.3) * 8, cy - 20 + Math.sin(i + t * 0.3) * 8); ctx.stroke(); }
  ctx.strokeStyle = '#4a3320'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx, cy - 50); ctx.lineTo(cx - 36, cy - 34); ctx.stroke(); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy - 30); ctx.lineTo(cx - 26, cy - 40); ctx.stroke();
  ctx.strokeStyle = '#222'; ctx.lineWidth = 1; const hy = cy - 6 + Math.sin(t * 0.8) * 8; ctx.beginPath(); ctx.moveTo(cx - 36, cy - 34); ctx.lineTo(cx - 36, hy); ctx.stroke(); ctx.fillStyle = '#9a7a4a'; ctx.fillRect(cx - 42, hy, 12, 9); ctx.strokeStyle = '#4a3018'; ctx.strokeRect(cx - 41.5, hy + 0.5, 11, 8);
  this.lamps.push([80, QY + 20], [340, QY + 20], [640, QY + 20], [900, QY + 20]);
  for (const [x, y] of [[80, QY + 20], [340, QY + 20], [640, QY + 20], [900, QY + 20]]) { ctx.fillStyle = '#2a2420'; ctx.fillRect(x - 1, y - 22, 2, 22); ctx.fillStyle = '#3a3430'; ctx.fillRect(x - 4, y - 26, 8, 6); ctx.fillStyle = 'rgba(255,230,160,0.35)'; ctx.fillRect(x - 2, y - 24, 4, 3); }
};
/* Rolandstandbild auf dem Markt */
const _drawMarket = HK.Scene.drawMarket;
HK.Scene.drawMarket = function (ctx, b, st) {
  _drawMarket.call(this, ctx, b, st);
  const x = 470, y = 536; ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 1, 9, 3, 0, 0, 6.28); ctx.fill();
  ctx.fillStyle = this.pat.stone; ctx.fillRect(x - 7, y - 12, 14, 12); ctx.fillStyle = '#7a7466'; ctx.fillRect(x - 8, y - 13, 16, 2); ctx.fillRect(x - 6, y - 16, 12, 3);
  ctx.fillStyle = '#8f8878'; ctx.beginPath(); ctx.moveTo(x - 3, y - 16); ctx.lineTo(x + 3, y - 16); ctx.lineTo(x + 4, y - 30); ctx.lineTo(x - 4, y - 30); ctx.fill(); ctx.beginPath(); ctx.arc(x, y - 32, 2.8, 0, 6.28); ctx.fill();
  ctx.strokeStyle = '#8f8878'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x + 4, y - 27); ctx.lineTo(x + 8, y - 36); ctx.stroke(); ctx.fillStyle = '#c9a24a'; ctx.fillRect(x - 6, y - 26, 4, 6);
};
