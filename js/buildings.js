/* Isometrische Gebäude, Mauern, Bäume, Requisiten, Schiffe, Personen */
'use strict';
Object.assign(HK.Scene, {
  seed(b) { return ((b.x * 13 + b.y * 7) * 10) | 0; },
  lightNoise(x, y) { const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return v - Math.floor(v); },
  houseLightProfile(b) {
    const key = [b.id, b.x, b.y, b.w, b.d].join(','), cache = this._houseLightProfiles ||= new Map();
    if (cache.has(key)) return cache.get(key);
    const n = k => this.lightNoise(b.x + k * 2.71, b.y - k * 1.83);
    const type = ['tavern', 'dive'].includes(b.id) ? 'inn' : b.kind === 'hospital' ? 'care' : ['storage', 'warehouse', 'kontor'].includes(b.panel) || b.kind === 'longhouse' ? 'store' : 'home';
    const profile = { start: .78 + n(1) * .045, late: .87 + n(2) * .07, bed: .97 + n(3) * .06, wake: 1.20 + n(4) * .035,
      levels: type === 'inn' ? [0, .82, .62, .10, .28] : type === 'care' ? [0, .6, .42, .18, .32] : type === 'store' ? [0, .28, .12, .015, .18] : [0, .66, .26, .045, .30] };
    cache.set(key, profile); return profile;
  },
  houseLightStage(b) {
    const clock = this.clock, p = this.houseLightProfile(b), t = clock < .3 ? clock + 1 : clock;
    if (t < p.start || t > 1.26) return 0;
    return t >= p.wake ? 4 : t >= p.bed ? 3 : t >= p.late ? 2 : 1;
  },
  houseDark(b) {
    const st = HK.state, owner = b.burgher && st?.burghers?.[b.burgher], house = b.panel === 'house' && st?.houses?.[b.plot];
    return !!(owner && (owner.vacantUntil > st.day || owner.damaged) || house?.damaged || b.panel === 'workshop' && !st?.workshops?.[b.plot]?.type);
  },
  houseLightKey(b) { return this.houseDark(b) ? 'empty' : this.houseLightStage(b); },
  withHouseLights(b, draw) {
    const previous = this.lightingBuilding; this.lightingBuilding = b;
    try { return draw(); } finally { this.lightingBuilding = previous; }
  },
  windowLight(a) {
    if (!this.nightK || this.picking || this.emitOff) return null;
    const b = this.lightingBuilding || { x: Math.floor(a[0]), y: Math.floor(a[1]) }, stage = this.houseLightStage(b);
    if (!stage || this.houseDark(b)) return null;
    const rank = this.lightNoise(a[0] * 3.7 + a[2] * 7.1, a[1] * 4.3 - a[2] * 2.9);
    if (rank >= this.houseLightProfile(b).levels[stage]) return null;
    const n = this.lightNoise(a[0] + a[2] * 13, a[1] - a[2] * 5), brightness = (.27 + n * .43) * (stage === 3 ? .6 : stage === 2 ? .82 : 1);
    return { brightness, color: ['#d7a15c', '#c79357', '#dbc086', '#be8950'][Math.floor(n * 4)], green: 158 + Math.round(n * 42), blue: 76 + Math.round(n * 38) };
  },
  lampGlow(x, y, role) {
    // Bewegte Schiffslichter brauchen einen festen Wert: Ortsrauschen
    // würde während der Fahrt Helligkeit und Schlafenszeit ständig ändern.
    if (role === 'ship') return .58;
    if (role === 'beacon' || role === 'gate' || role === 'public' || role === 'fire') return role === 'beacon' ? 1 : .72;
    const n = this.lightNoise(x * .013, y * .019), brightness = .45 + n * .4;
    if (n < .12) return brightness;
    const t = this.clock < .3 ? this.clock + 1 : this.clock, bed = .92 + n * .10, wake = 1.21 + n * .025;
    if (t <= bed || t >= wake) return brightness;
    // Langsames Erlöschen nach Hausrhythmus; kein Zufall und kein Animationsflackern.
    return brightness * Math.max(0, 1 - (t - bed) / .012, 1 - (wake - t) / .012);
  },
  chimney(ctx, x, y, z) { I.box(ctx, x, y, z, 0.14, 0.14, 0.32, { wall: '#68564f', top: '#574642' }); },
  houseChimneys(b, ridge) {
    ridge = ridge || (['gable', 'hall'].includes(b.kind) ? 'x' : 'y');
    const rh = Math.min(b.w, b.d) * 0.62;
    const roofZ = (u, v) => b.h + rh * (1 - Math.abs(2 * (ridge === 'x' ? v : u) - 1));
    const chimneys = [{ x: b.x + b.w * 0.75, y: b.y + b.d * 0.4, z: roofZ(0.75, 0.4), w: 0.14, h: 0.32 }];
    if (b.bigChimney) chimneys.push({ x: b.x + b.w * 0.55, y: b.y + b.d * 0.35, z: roofZ(0.55, 0.35), w: 0.3, h: 0.9 });
    return chimneys;
  },
  gableFlag(ctx, x, y, z) { I.line(ctx, [x, y, z], [x, y, z + 0.6], '#62472c', 1.2); this.pennant(ctx, x, y, z + 0.6, 0.45, 0.2, ['#bfa361'], true); },
  /* Verkaufstafel an der Traufseite: ein Brett mit rotem Wachssiegel */
  saleSign(ctx, b) {
    const x = b.x + b.w * 0.18, y = b.y + b.d, z = b.h * 0.62;
    I.line(ctx, [x, y, z + 0.26], [x, y, z + 0.02], '#674e38', 1.2);
    I.poly(ctx, [[x - 0.2, y, z], [x + 0.2, y, z], [x + 0.2, y, z - 0.22], [x - 0.2, y, z - 0.22]], '#ece5d2');
    I.poly(ctx, [[x - 0.2, y, z], [x + 0.2, y, z], [x + 0.2, y, z - 0.04], [x - 0.2, y, z - 0.04]], '#c9b48a');
    I.poly(ctx, [[x + 0.04, y, z - 0.1], [x + 0.15, y, z - 0.1], [x + 0.15, y, z - 0.2], [x + 0.04, y, z - 0.2]], '#96493d');
  },
  /* Leerstand: vernagelte Tür */
  boardedDoor(ctx, b) {
    const x = b.x + b.w * 0.5, y = b.y + b.d, z = b.h * 0.34;
    I.poly(ctx, [[x - 0.26, y, z + 0.05], [x + 0.26, y, z - 0.02], [x + 0.26, y, z - 0.1], [x - 0.26, y, z - 0.03]], '#7a5e40');
    I.poly(ctx, [[x - 0.26, y, z - 0.18], [x + 0.26, y, z - 0.25], [x + 0.26, y, z - 0.33], [x - 0.26, y, z - 0.26]], '#7a5e40');
  },
  /* Fahne im Wind (weht nach +x), als Fläche im Raum: Streifen von oben nach unten, optional spitz zulaufend */
  pennant(ctx, x, y, z, len, h, cols, taper, sampleTime) {
    if (this.capturePennants && !this.picking) { this.capturePennants.push([x,y,z,len,h,cols,taper]); return; }
    const t = sampleTime ?? this.time, n = 5, wave = f => Math.sin(t * 5 + x * 2.3 + y - f * 5) * 0.05 * f * len * 3 + f * f * 0.06;
    const edge = (fz) => { const pts = []; for (let i = 0; i <= n; i++) { const f = i / n; pts.push([x + len * f, y, z - wave(f) - fz * h * (taper ? (0.15 + 0.85 * (1 - f)) : 1)]); } return pts; };
    const m = cols.length;
    for (let k = 0; k < m; k++) { const top = edge(k / m), bot = edge((k + 1) / m).reverse(); I.poly(ctx, top.concat(bot), cols[k]); }
    I.path(ctx, edge(0).concat(edge(1).reverse())); ctx.strokeStyle = 'rgba(20,10,5,0.55)'; ctx.lineWidth = 0.6; ctx.stroke();
  },

  /* Wandausstattung: Fenster in Reihen auf beiden sichtbaren Wänden */
  facadeWindows(ctx, b, floors, o) {
    if (this.picking) return;
    if (b.windowStyle === 'chapel') {
      // One chapel facade, rather than lancets painted over two domestic floors.
      const frame = { arch: true, archRise: .14, frame: '#b09b7c' };
      for (let i = 0; i < 4; i++) I.windowL(ctx, b.x, b.y, b.d, .38, b.w * (i + .5) / 4, .26, .9, frame);
      I.windowR(ctx, b.x, b.w, b.y, .91, b.d / 2, .24, .35, { ...frame, archRise: .12 });
      return;
    }
    o = o || {}; const seed = this.seed(b), shut = [null, '#52675a', '#80573f', '#56665b', '#796942', '#526272'][seed % 6], flowers = seed % 3 === 0;
    const nL = Math.max(1, Math.round(b.w / 0.5)), nR = Math.max(1, Math.round(b.d / 0.5));
    for (let f = 0; f < floors; f++) {
      if (f > 0 && b.noWindowsUpper) continue;
      const z = 0.3 + f * (b.h / floors) * 0.95, hz = 0.32, wz = 0.24;
      for (let i = 0; i < nL; i++) { const u = b.w * (i + 0.5) / nL; if (f === 0 && o.doorL !== undefined && Math.abs(u - o.doorL) < 0.3) continue; I.windowL(ctx, b.x, b.y, b.d, z, u, wz, hz, { shutters: f === 0 ? shut : null, flowers: f === 1 && flowers && (i + seed) % 2 === 0 && this.season() !== 'winter', curtains: !b.hoist && (i + f + seed) % 3 === 0, arch: o.arch }); }
      for (let i = 0; i < nR; i++) { const v = b.d * (i + 0.5) / nR; if (f === 0 && o.doorR !== undefined && Math.abs(v - o.doorR) < 0.3) continue; I.windowR(ctx, b.x, b.w, b.y, z, v, wz, hz, { shutters: f === 0 ? shut : null, flowers: f === 1 && flowers && (i + seed) % 2 === 0 && this.season() !== 'winter', curtains: !b.hoist && (i + f + seed) % 3 === 0, arch: o.arch }); }
    }
  },
  wallTexture(ctx, b, brick, z0, h) {
    if (this.picking) return;
    if (brick) { I.brickL(ctx, b.x, b.y, b.d, z0, b.w, h); I.brickR(ctx, b.x, b.w, b.y, z0, b.d, h); return; }
    const nL = Math.max(2, Math.round(b.w / 0.65)), nR = Math.max(2, Math.round(b.d / 0.65));
    I.timberL(ctx, b.x, b.y, b.d, z0, b.w, h, nL); I.timberR(ctx, b.x, b.w, b.y, z0, b.d, h, nR);
    // Backstein-Ausfachung in einzelnen Feldern
    const seed = this.seed(b); if (seed % 3 === 0) { for (let i = 0; i < nL; i++) if ((i + seed) % 2) { const u0 = b.x + b.w * i / nL, u1 = b.x + b.w * (i + 1) / nL; I.poly(ctx, [[u0, b.y + b.d, z0 + h * 0.5], [u1, b.y + b.d, z0 + h * 0.5], [u1, b.y + b.d, z0 + h], [u0, b.y + b.d, z0 + h]], 'rgba(162,74,58,0.55)'); } }
  },
  drawHouse(ctx, b, st, season, sv, gableKind) {
    const wall = b.wall || '#cdbc99', brick = !!b.brick, brickCol = brick ? (b.wall || '#9c4e40') : wall, roof = b.roof || (brick ? '#605548' : '#8e493a'), rh = Math.min(b.w, b.d) * 0.62;
    I.shadow(ctx, b.x, b.y, b.w, b.d, b.h + rh * 0.6, sv.v, sv.a);
    // Sockel und Wände
    I.box(ctx, b.x, b.y, 0, b.w, b.d, b.h, { wall: brick ? brickCol : (b.stone ? '#9a9284' : wall) }, { noTop: true });
    I.poly(ctx, [[b.x, b.y + b.d, 0], [b.x + b.w, b.y + b.d, 0], [b.x + b.w, b.y + b.d, 0.12], [b.x, b.y + b.d, 0.12]], 'rgba(60,50,40,0.5)'); I.poly(ctx, [[b.x + b.w, b.y, 0], [b.x + b.w, b.y + b.d, 0], [b.x + b.w, b.y + b.d, 0.12], [b.x + b.w, b.y, 0.12]], 'rgba(40,30,20,0.55)');
    if (b.stone) { for (let z = 0.15; z < b.h; z += 0.15) { I.line(ctx, [b.x, b.y + b.d, z], [b.x + b.w, b.y + b.d, z], 'rgba(0,0,0,0.18)', 0.5); I.line(ctx, [b.x + b.w, b.y, z], [b.x + b.w, b.y + b.d, z], 'rgba(0,0,0,0.22)', 0.5); } }
    else this.wallTexture(ctx, b, brick, 0.12, b.h - 0.12);
    // Vorkragung: Schattenband in halber Höhe
    if (!brick && !b.stone && b.h > 1.0) { I.poly(ctx, [[b.x, b.y + b.d, b.h * 0.5], [b.x + b.w, b.y + b.d, b.h * 0.5], [b.x + b.w, b.y + b.d, b.h * 0.5 - 0.06], [b.x, b.y + b.d, b.h * 0.5 - 0.06]], 'rgba(0,0,0,0.3)'); I.poly(ctx, [[b.x + b.w, b.y, b.h * 0.5], [b.x + b.w, b.y + b.d, b.h * 0.5], [b.x + b.w, b.y + b.d, b.h * 0.5 - 0.06], [b.x + b.w, b.y, b.h * 0.5 - 0.06]], 'rgba(0,0,0,0.35)'); }
    const floors = b.h > 1.0 ? 2 : 1;
    const doorR = b.d / 2, doorL = gableKind ? undefined : b.w / 2;
    this.drawHouseGreenery?.(ctx,b,season);
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
      if (ridge === 'x') { const pts = I.stepGableR(ctx, b.x, b.w, b.y, b.h, b.d, rh + 0.12, brickCol, 5); this.gableDeco(ctx, b, pts, 'R'); }
      else { const pts = I.stepGableL(ctx, b.x, b.y, b.d, b.h, b.w, rh + 0.12, brickCol, 5); this.gableDeco(ctx, b, pts, 'L'); }
    } else {
      I.gableRoof(ctx, b.x, b.y, b.h, b.w, b.d, rh, roofCol, ridge, { gableFill: b.stone ? '#9a9284' : wall, overhang: 0.14, material: snow ? 'snow' : b.roofMaterial });
      // Giebelfachwerk
      if (!b.stone) { if (ridge === 'x') { I.line(ctx, [b.x + b.w, b.y + b.d / 2, b.h], [b.x + b.w, b.y + b.d / 2, b.h + rh], 'rgba(70,45,22,0.85)', 1.2); I.line(ctx, [b.x + b.w, b.y + b.d * 0.25, b.h + rh * 0.5], [b.x + b.w, b.y + b.d * 0.75, b.h + rh * 0.5], 'rgba(70,45,22,0.85)', 1); I.windowR(ctx, b.x, b.w, b.y, b.h + 0.1, b.d / 2, 0.2, 0.25, {}); } else { I.line(ctx, [b.x + b.w / 2, b.y + b.d, b.h], [b.x + b.w / 2, b.y + b.d, b.h + rh], 'rgba(70,45,22,0.85)', 1.2); I.line(ctx, [b.x + b.w * 0.25, b.y + b.d, b.h + rh * 0.5], [b.x + b.w * 0.75, b.y + b.d, b.h + rh * 0.5], 'rgba(70,45,22,0.85)', 1); I.windowL(ctx, b.x, b.y, b.d, b.h + 0.1, b.w / 2, 0.2, 0.25, {}); } }
    }
    // Gaube auf der sichtbaren Dachfläche
    if ((ridge === 'y' ? b.d : b.w) > 1.4 && this.seed(b) % 2) { if (ridge === 'y') { const gx = b.x + b.w * 0.72, gy = b.y + b.d * 0.5; I.box(ctx, gx, gy - 0.15, b.h + rh * 0.25, 0.3, 0.3, 0.28, { wall: wall }, { noTop: true }); I.pyramid(ctx, gx, gy - 0.15, b.h + rh * 0.25 + 0.28, 0.3, 0.3, 0.16, roofCol); I.windowR(ctx, gx, 0.3, gy - 0.15, b.h + rh * 0.25 + 0.05, 0.15, 0.14, 0.16, {}); } else { const gx = b.x + b.w * 0.5, gy = b.y + b.d * 0.72; I.box(ctx, gx - 0.15, gy, b.h + rh * 0.25, 0.3, 0.3, 0.28, { wall: wall }, { noTop: true }); I.pyramid(ctx, gx - 0.15, gy, b.h + rh * 0.25 + 0.28, 0.3, 0.3, 0.16, roofCol); I.windowL(ctx, gx - 0.15, gy, 0.3, b.h + rh * 0.25 + 0.05, 0.15, 0.14, 0.16, {}); } }
    const chimneys = this.houseChimneys(b, ridge), chimney = chimneys[0];
    this.chimney(ctx, chimney.x, chimney.y, chimney.z);
    if (b.hoist && !b.separateExtras) this.drawHouseHoist(ctx, b);
    if (b.sign) { const p = I.p(b.x + b.w, b.y + b.d * 0.2, b.h * 0.7); ctx.strokeStyle = '#62472c'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + 12, p[1] - 4); ctx.stroke(); ctx.fillStyle = '#6c4a2f'; ctx.fillRect(p[0] + 8, p[1] - 4, 9, 8); ctx.fillStyle = '#d8c7a0'; ctx.fillRect(p[0] + 9, p[1] - 3, 7, 6); this.signIcon(ctx, b.sign, p[0] + 12.5, p[1]); }
    if (b.shabby) { I.poly(ctx, [[b.x, b.y + b.d, 0.12], [b.x + b.w, b.y + b.d, 0.12], [b.x + b.w, b.y + b.d, 0.45], [b.x, b.y + b.d, 0.45]], 'rgba(60,50,30,0.3)'); I.poly(ctx, [[b.x + b.w, b.y + 0.1, b.h * 0.5], [b.x + b.w, b.y + 0.5, b.h * 0.5], [b.x + b.w, b.y + 0.4, b.h * 0.95], [b.x + b.w, b.y + 0.15, b.h * 0.9]], 'rgba(40,60,30,0.28)'); if (!b.separateExtras) this.barrel3(ctx, b.x + b.w + 0.12, b.y + b.d - 0.3, 0); }
    if (b.bigChimney) { const q = chimneys[1]; I.box(ctx, q.x, q.y, q.z, q.w, q.w, q.h, { wall: '#68564f', top: '#4e433b' }); }
    if (b.flagpole) { I.line(ctx, [b.x + b.w + 0.05, b.y + 0.15, 0], [b.x + b.w + 0.05, b.y + 0.15, 1.8], '#62472c', 1.3); this.pennant(ctx, b.x + b.w + 0.05, b.y + 0.15, 1.8, 0.5, 0.3, ['#c8102e', '#f0ece0'], false); }
    if (b.id === 'bathhouse') for (let i = 0; i < 3; i++) { const p = I.p(chimney.x + 0.07, chimney.y + 0.07, chimney.z + chimney.h); ctx.fillStyle = `rgba(240,240,240,${0.25 - i * 0.06})`; ctx.beginPath(); ctx.arc(p[0] + 2 + Math.sin(this.time * 2 + i) * 3, p[1] - 6 - i * 7, 3 + i * 2, 0, 6.28); ctx.fill(); }
  },
  /* Zunftzeichen auf dem Aushängeschild */
  signIcon(ctx, kind, x, y) {
    ctx.save(); ctx.translate(x, y);
    switch (kind) {
      case 'tavern': ctx.fillStyle = '#bb9d58'; ctx.beginPath(); ctx.ellipse(0, 0, 3, 1.6, -0.4, 0, 6.28); ctx.fill(); break;
      case 'mug': ctx.fillStyle = '#84623f'; ctx.fillRect(-2, -2.2, 3.4, 4.4); ctx.strokeStyle = '#84623f'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(1.8, 0, 1.3, -1.3, 1.3); ctx.stroke(); ctx.fillStyle = '#f0e9da'; ctx.fillRect(-2, -2.8, 3.4, 1); break;
      case 'pretzel': ctx.strokeStyle = '#936a3c'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, 0.3, 2.3, 0.3, 2.85); ctx.moveTo(-2, 1.8); ctx.lineTo(1.4, -1.6); ctx.moveTo(2, 1.8); ctx.lineTo(-1.4, -1.6); ctx.stroke(); break;
      case 'cleaver': ctx.fillStyle = '#9a9a9a'; ctx.fillRect(-2.4, -2, 4, 3); ctx.fillStyle = '#72502e'; ctx.fillRect(1.4, -0.4, 1.4, 3); break;
      case 'barrel': ctx.fillStyle = '#876339'; ctx.beginPath(); ctx.ellipse(0, 0, 2.2, 2.7, 0, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#593e24'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-2.1, -0.8); ctx.lineTo(2.1, -0.8); ctx.moveTo(-2.1, 0.8); ctx.lineTo(2.1, 0.8); ctx.stroke(); break;
      case 'fish': ctx.fillStyle = '#416d8e'; ctx.beginPath(); ctx.ellipse(-0.5, 0, 2.4, 1.3, 0, 0, 6.28); ctx.fill(); ctx.beginPath(); ctx.moveTo(1.6, 0); ctx.lineTo(3, -1.4); ctx.lineTo(3, 1.4); ctx.fill(); break;
      case 'sail': ctx.fillStyle = '#e8e0c8'; ctx.beginPath(); ctx.moveTo(-1.5, 2.5); ctx.lineTo(-1.5, -2.6); ctx.lineTo(2.4, 1.2); ctx.fill(); ctx.fillStyle = '#62472c'; ctx.fillRect(-2.1, -2.8, 0.8, 5.6); break;
      case 'pot': ctx.fillStyle = '#a66c44'; ctx.beginPath(); ctx.moveTo(-2, -1.5); ctx.lineTo(2, -1.5); ctx.lineTo(1.4, 2.4); ctx.lineTo(-1.4, 2.4); ctx.fill(); ctx.fillRect(-2.4, -2.4, 4.8, 1); break;
      case 'book': ctx.fillStyle = '#843636'; ctx.fillRect(-2.6, -2, 5.2, 4); ctx.fillStyle = '#f0e9da'; ctx.fillRect(-2.1, -1.5, 2, 3); ctx.fillRect(0.2, -1.5, 2, 3); break;
      case 'cross': ctx.fillStyle = '#c8102e'; ctx.fillRect(-0.7, -2.6, 1.4, 5.2); ctx.fillRect(-2.4, -0.7, 4.8, 1.4); break;
      case 'scale': ctx.strokeStyle = '#62472c'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(0, -2.6); ctx.lineTo(0, 2.4); ctx.moveTo(-2.6, -1.4); ctx.lineTo(2.6, -1.4); ctx.moveTo(-2.6, -1.4); ctx.lineTo(-2.6, 0.6); ctx.moveTo(2.6, -1.4); ctx.lineTo(2.6, 0.6); ctx.stroke(); ctx.fillStyle = '#bb9d58'; ctx.beginPath(); ctx.ellipse(-2.6, 1, 1.4, 0.7, 0, 0, 6.28); ctx.ellipse(2.6, 1, 1.4, 0.7, 0, 0, 6.28); ctx.fill(); break;
      case 'ring': ctx.strokeStyle = '#bfa361'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, 0.4, 2.1, 0, 6.28); ctx.stroke(); ctx.fillStyle = '#b44949'; ctx.beginPath(); ctx.arc(0, -2, 1.1, 0, 6.28); ctx.fill(); break;
      case 'mortar': ctx.fillStyle = '#7d766a'; ctx.beginPath(); ctx.moveTo(-2.4, -0.4); ctx.lineTo(2.4, -0.4); ctx.lineTo(1.6, 2.4); ctx.lineTo(-1.6, 2.4); ctx.fill(); ctx.strokeStyle = '#6c5946'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0.4, -0.6); ctx.lineTo(2.2, -2.8); ctx.stroke(); break;
      case 'anchor': ctx.strokeStyle = '#34467f'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(0, -2.6); ctx.lineTo(0, 2.2); ctx.moveTo(-2, -1.2); ctx.lineTo(2, -1.2); ctx.moveTo(-2.4, 0.8); ctx.quadraticCurveTo(0, 3.2, 2.4, 0.8); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -3.1, 0.8, 0, 6.28); ctx.stroke(); break;
      default: ctx.fillStyle = '#bfa361'; ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, 6.28); ctx.fill();
    }
    ctx.restore();
  },
  gableDeco(ctx, b, pts, side) {
    if (this.picking) return;
    // Alle Details liegen in der Giebelebene und passen in den tatsächlichen Treppenriss.
    const axis = side === 'R' ? 1 : 0, span = side === 'R' ? b.d : b.w, start = side === 'R' ? b.y : b.x;
    const z0 = Math.min(...pts.map(p => p[2])), rh = Math.max(...pts.map(p => p[2])) - z0, center = start + span / 2;
    const point = (u, z) => side === 'R' ? [b.x + b.w, u, z] : [u, b.y + b.d, z];
    const outline = pts.map(p => [p[axis], p[2]]), variant = this.seed(b) % 3;
    const inset = (u0, u1, z1, z2, arch, fill) => {
      const shape = [point(u0, z1), point(u1, z1), point(u1, z2)];
      if (arch) shape.push(point((u0 + u1) / 2, z2 + rh * .045));
      shape.push(point(u0, z2));
      if (!shape.every(p => I.inHull(outline, p[axis], p[2]))) return;
      I.poly(ctx, shape, fill, '#766b59', .65);
      I.line(ctx, point(u0, z1), point(u0, z2), 'rgba(47,37,30,.45)', .8);
      I.line(ctx, point(u0, z1), point(u1, z1), 'rgba(217,197,158,.5)', .65);
    };
    if (variant === 0 && span >= .8) for (const dir of [-1, 1]) {
      const u = center + dir * span * .23;
      inset(u - span * .05, u + span * .05, z0 + rh * .10, z0 + rh * .31, true, side === 'R' ? '#b6ad95' : '#c7bca2');
    }
    // Speicherluke mit Holzfüllung und Beschlägen statt eines aufgesetzten schwarzen Kastens.
    const hw = Math.min(.11, span * .075), low = z0 + rh * .12, high = z0 + rh * .49;
    inset(center - hw, center + hw, low, high, false, ['#62523e', '#71604a', '#554b3e'][variant]);
    I.line(ctx, point(center, low), point(center, high), 'rgba(29,25,20,.55)', .65);
    for (const z of [low + rh * .07, high - rh * .07]) I.line(ctx, point(center - hw * .85, z), point(center + hw * .85, z), '#51483b', .6);
    if (variant !== 1) {
      const oval = Array.from({ length: 16 }, (_, i) => { const t = i * Math.PI / 8; return point(center + Math.cos(t) * Math.min(.045, span * .045), z0 + rh * (.72 + Math.sin(t) * .055)); });
      if (oval.every(p => I.inHull(outline, p[axis], p[2]))) I.poly(ctx, oval, '#48453b', '#b8ad93', .85);
    }
  },
  drawHall(ctx, b, st, season, sv) {
    this.drawHouse(ctx, b, st, season, sv, true);
    // Ecktürmchen
    const tx = b.x + b.w - 0.02, ty = b.y + 0.02;
    I.cylinder(ctx, tx, ty, b.h * 0.45, 0.2, b.h * 0.7, b.wall || '#9c4e40', { brick: true, noTop: true }); I.cone(ctx, tx, ty, b.h * 1.15, 0.24, 0.5, season === 'winter' ? '#e6eaee' : '#574e42');
    if (b.banner) { const p = I.p(b.x + b.w, b.y + b.d * 0.5, b.h * 0.85); ctx.fillStyle = b.banner === 'green' ? '#347e46' : b.banner === 'red' ? '#8a3d39' : '#6f398b'; ctx.fillRect(p[0] - 3, p[1], 7, 18); ctx.fillStyle = '#bfa361'; ctx.fillRect(p[0] - 1, p[1] + 4, 3, 3); ctx.fillStyle = '#62472c'; ctx.fillRect(p[0] - 5, p[1] - 1, 11, 1.5); }
    if (b.id === 'bailiff') { const p = I.p(b.x + b.w, b.y + b.d * 0.5, 0.9); this.lamps.push([p[0] + 3, p[1]]); ctx.fillStyle = '#62472c'; ctx.fillRect(p[0] + 2, p[1] - 6, 1.5, 7); }
  },
  drawTownhall(ctx, b, st, season, sv) {
    const rh = 0.7, snow = season === 'winter', xx = b.x + b.w;
    I.shadow(ctx, b.x, b.y, b.w, b.d, b.h + 0.4, sv.v, sv.a);
    I.box(ctx, b.x, b.y, 0, b.w, b.d, b.h, { wall: '#9c4e40' }, { noTop: true });
    I.brickL(ctx, b.x, b.y, b.d, 0, b.w, b.h); I.brickR(ctx, b.x, b.w, b.y, 0, b.d, b.h);
    // Arkaden auf der Marktseite (+x), Fensterreihe darüber
    const n = 7; for (let i = 0; i < n; i++) { const v = b.d * (i + 0.5) / n; const a = [xx, b.y + v - 0.19, 0], bb = [xx, b.y + v + 0.19, 0], c = [xx, b.y + v + 0.19, 0.55], m = [xx, b.y + v, 0.72], d = [xx, b.y + v - 0.19, 0.55]; I.poly(ctx, [a, bb, c, m, d], '#4f463b'); I.poly(ctx, [a, bb, [bb[0], bb[1], 0.25], [a[0], a[1], 0.25]], 'rgba(255,220,160,0.12)'); }
    for (let i = 0; i < 8; i++) I.windowR(ctx, b.x, b.w, b.y, 0.95, b.d * (i + 0.5) / 8, 0.22, 0.42, { arch: true, frame: '#5e4434' });
    for (let i = 0; i < 2; i++) I.windowL(ctx, b.x, b.y, b.d, 0.95, b.w * (i + 0.5) / 2, 0.22, 0.42, { arch: true, frame: '#5e4434' });
    I.poly(ctx, [[xx, b.y, b.h - 0.06], [xx, b.y + b.d, b.h - 0.06], [xx, b.y + b.d, b.h], [xx, b.y, b.h]], '#c9c0ad');
    I.gableRoof(ctx, b.x, b.y, b.h, b.w, b.d, rh, snow ? '#e6eaee' : '#605548', 'y', { overhang: 0.02, rows: 6 });
    I.stepGableL(ctx, b.x, b.y, b.d, b.h, b.w, rh + 0.15, '#9c4e40', 5); I.windowL(ctx, b.x, b.y, b.d, b.h + 0.15, b.w / 2, 0.2, 0.3, { arch: true });
    // Turm an der Marktseite
    const tx = xx - 0.55, ty = b.y + b.d / 2 - 0.3;
    I.box(ctx, tx, ty, 0, 0.6, 0.6, b.h + rh + 0.9, { wall: '#9c4e40' }, { noTop: true }); I.brickL(ctx, tx, ty, 0.6, 0, 0.6, b.h + rh + 0.9); I.brickR(ctx, tx, 0.6, ty, 0, 0.6, b.h + rh + 0.9);
    I.windowR(ctx, tx, 0.6, ty, b.h + rh + 0.3, 0.3, 0.18, 0.32, { arch: true }); const cp = I.p(tx + 0.6, ty + 0.3, b.h + rh + 0.05); ctx.fillStyle = '#bfa361'; ctx.beginPath(); ctx.arc(cp[0], cp[1], 4, 0, 6.28); ctx.fill(); ctx.fillStyle = '#4f463b'; ctx.beginPath(); ctx.arc(cp[0], cp[1], 2.8, 0, 6.28); ctx.fill();
    I.pyramid(ctx, tx - 0.05, ty - 0.05, b.h + rh + 0.9, 0.7, 0.7, 1.1, snow ? '#e6eaee' : '#574e42');
    I.line(ctx, [tx + 0.3, ty + 0.3, b.h + rh + 2.0], [tx + 0.3, ty + 0.3, b.h + rh + 2.4], '#bfa361', 1.5); this.pennant(ctx, tx + 0.3, ty + 0.3, b.h + rh + 2.4, 0.5, 0.22, ['#c8102e'], true);
    for (const [lx, ly] of [[xx + 0.05, b.y + 0.1], [xx + 0.05, b.y + b.d - 0.1]]) { const p = I.p(lx, ly, 0.9); this.lamps.push([p[0], p[1], 'public']); I.line(ctx, [lx, ly, 0], [lx, ly, 0.9], '#4e433b', 1.3); }
  },
  drawChurch(ctx, b, st, season, sv) {
    const snow = season === 'winter', tw = 0.8, nx = b.x + tw, nw = b.w - tw, rh = 1.3;
    I.shadow(ctx, b.x, b.y, b.w, b.d, b.h + rh * 0.5, sv.v, sv.a);
    // Turm zuerst: das davor liegende Schiff verdeckt seine rechte Seite unterhalb des Daches
    const CB = st && st.churchBuild ? st.churchBuild : { done: {}, active: null }, prog = st && HK.churchBuildProgress ? HK.churchBuildProgress(st) : 0;
    HK.Scene.emitOff = !!(st && st.interdictUntil > st.day);
    const towerUp = CB.done.tower ? 1 : CB.active && CB.active.id === 'tower' ? prog : 0, th = 4.6 + 1.6 * towerUp, ty = b.y + b.d - tw;
    I.box(ctx, b.x, ty, 0, tw, tw, th, { wall: '#9c4e40' }, { noTop: true }); I.brickL(ctx, b.x, ty, tw, 0, tw, th); I.brickR(ctx, b.x, tw, ty, 0, tw, th);
    for (let k = 0; k < (th > 5.8 ? 5 : 4); k++) { I.windowL(ctx, b.x, ty, tw, 1.0 + k * 0.95, tw / 2, 0.2, 0.42, { arch: true, frame: '#5e4434' }); if (k > 1) I.windowR(ctx, b.x, tw, ty, 1.0 + k * 0.95, tw / 2, 0.2, 0.42, { arch: true, frame: '#5e4434' }); }
    I.poly(ctx, [[b.x, ty + tw, th - 0.1], [b.x + tw, ty + tw, th - 0.1], [b.x + tw, ty + tw, th], [b.x, ty + tw, th]], '#c9c0ad');
    const sh = 1.9 + 0.9 * (CB.done.tower ? 1 : 0);
    if (CB.active && CB.active.id === 'tower') this.drawScaffold(ctx, b.x, ty, tw, tw, 4.6, th + 0.3); else I.pyramid(ctx, b.x - 0.05, ty - 0.05, th, tw + 0.1, tw + 0.1, sh, snow ? '#dfe3e8' : '#574e42');
    if (CB.active?.id !== 'tower') {
      const cp = I.p(b.x + tw / 2, ty + tw / 2, th + sh); ctx.strokeStyle = '#bfa361'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cp[0], cp[1]); ctx.lineTo(cp[0], cp[1] - 14); ctx.moveTo(cp[0] - 4, cp[1] - 10); ctx.lineTo(cp[0] + 4, cp[1] - 10); ctx.stroke(); ctx.fillStyle = '#bfa361'; ctx.beginPath(); ctx.arc(cp[0], cp[1], 2.5, 0, 6.28); ctx.fill();
    }
    I.doorL(ctx, b.x, ty, tw, 0, tw / 2, 0.32, 0.62, true);
    // Schiff
    I.box(ctx, nx, b.y, 0, nw, b.d, b.h, { wall: '#9c4e40' }, { noTop: true }); I.brickL(ctx, nx, b.y, b.d, 0, nw, b.h); I.brickR(ctx, nx, nw, b.y, 0, b.d, b.h);
    for (let i = 0; i < 5; i++) { const u = nw * (i + 0.5) / 5; I.windowL(ctx, nx, b.y, b.d, 0.45, u, 0.22, 1.1, { arch: true, frame: '#5e4434' }); I.box(ctx, nx + u + 0.28, b.y + b.d - 0.02, 0, 0.12, 0.18, b.h * 0.8, { wall: '#9c4e40', top: '#874537' }); }
    I.windowR(ctx, nx, nw, b.y, 0.5, b.d / 2, 0.3, 1.1, { arch: true, frame: '#5e4434' });
    I.doorL(ctx, nx, b.y, b.d, 0, nw * 0.5 - 0.02, 0.4, 0.7, true);
    I.gableRoof(ctx, nx, b.y, b.h, nw, b.d, rh, snow ? '#e6eaee' : '#605548', 'x', { overhang: 0.06, rows: 10 });
    I.stepGableR(ctx, nx, nw, b.y, b.h, b.d, rh + 0.1, '#9c4e40', 6); I.windowR(ctx, nx, nw, b.y, b.h + 0.2, b.d / 2, 0.2, 0.5, { arch: true });
    I.poly(ctx, [[nx + 0.1, b.y + b.d / 2, b.h + rh], [nx + nw - 0.1, b.y + b.d / 2, b.h + rh], [nx + nw - 0.1, b.y + b.d / 2, b.h + rh + 0.08], [nx + 0.1, b.y + b.d / 2, b.h + rh + 0.08]], '#c9c0ad');
    // Seitenschiff vor dem Langhaus: fertig oder im Bau mit Gerüst
    if (CB.done.aisle || (CB.active && CB.active.id === 'aisle')) {
      const ay = b.y + b.d, ad = 0.5, ah = CB.done.aisle ? 1.05 : 0.15 + 0.9 * prog, ax = nx + 0.2, aw = nw - 0.4;
      I.box(ctx, ax, ay, 0, aw, ad, ah, { wall: '#9c4e40' }, { noTop: true }); I.brickL(ctx, ax, ay, ad, 0, aw, ah); I.brickR(ctx, ax, aw, ay, 0, ad, ah);
      if (CB.done.aisle) {
        for (let i = 0; i < 4; i++) I.windowL(ctx, ax, ay, ad, 0.3, aw * (i + 0.5) / 4, 0.18, 0.55, { arch: true, frame: '#5e4434' });
        I.poly(ctx, [[ax - 0.04, ay - 0.02, ah + 0.42], [ax + aw + 0.04, ay - 0.02, ah + 0.42], [ax + aw + 0.04, ay + ad + 0.05, ah], [ax - 0.04, ay + ad + 0.05, ah]], snow ? '#e6eaee' : '#605548', 'rgba(0,0,0,0.35)');
        for (let i = 1; i < 6; i++) { const u = ax + aw * i / 6; I.line(ctx, [u, ay - 0.02, ah + 0.42], [u, ay + ad + 0.05, ah], 'rgba(0,0,0,0.18)', 0.6); }
      } else this.drawScaffold(ctx, ax, ay, aw, ad, 0, 1.3);
    }
    if (HK.Scene.emitOff && !this.picking) { const dp = I.p(nx + nw * 0.5, b.y + b.d + 0.05, 0.75); ctx.strokeStyle = '#5e4434'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(dp[0] - 7, dp[1] - 6); ctx.lineTo(dp[0] + 7, dp[1] + 6); ctx.moveTo(dp[0] + 7, dp[1] - 6); ctx.lineTo(dp[0] - 7, dp[1] + 6); ctx.stroke(); }
    HK.Scene.emitOff = false;
  },
  /* Baugerüst: Stangen und Riegel aus Holz um einen Quader */
  drawScaffold(ctx, x, y, w, d, z0, z1) {
    const col = '#8b7149';
    for (let u = 0; u <= w + 0.001; u += Math.max(0.3, w / 4)) { const ux = Math.min(x + u, x + w); I.line(ctx, [ux, y + d + 0.12, z0], [ux, y + d + 0.12, z1], col, 1.2); }
    for (let v = 0; v <= d + 0.001; v += Math.max(0.3, d / 2)) { const vy = Math.min(y + v, y + d); I.line(ctx, [x + w + 0.12, vy, z0], [x + w + 0.12, vy, z1], col, 1.2); }
    for (let z = z0 + 0.35; z < z1; z += 0.45) { I.line(ctx, [x, y + d + 0.12, z], [x + w, y + d + 0.12, z], col, 1); I.line(ctx, [x + w + 0.12, y, z], [x + w + 0.12, y + d, z], col, 1); I.line(ctx, [x, y + d + 0.12, z - 0.02], [x + w, y + d + 0.12, z - 0.02], 'rgba(0,0,0,0.25)', 0.6); }
  },
  drawHuts(ctx, b, st, season, sv) {
    const snow = season === 'winter';
    for (const [hx, hy, hw, hd, rot] of [[b.x, b.y, 0.7, 0.6, 'x'], [b.x + 0.8, b.y + 0.9, 0.65, 0.7, 'y'], [b.x + 0.05, b.y + 1.7, 0.75, 0.6, 'x'], [b.x + 1.0, b.y + 2.0, 0.55, 0.5, 'y']]) {
      I.shadow(ctx, hx, hy, hw, hd, 0.5, sv.v, sv.a); I.box(ctx, hx, hy, 0, hw, hd, 0.42, { wall: '#8c6c45' }, { noTop: true });
      for (let z = 0.08; z < 0.42; z += 0.09) { I.line(ctx, [hx, hy + hd, z], [hx + hw, hy + hd, z], 'rgba(0,0,0,0.25)', 0.5); I.line(ctx, [hx + hw, hy, z], [hx + hw, hy + hd, z], 'rgba(0,0,0,0.3)', 0.5); }
      // Reetdach: dick, weich überstehend, mit Firstkappe
      I.gableRoof(ctx, hx, hy, 0.42, hw, hd, Math.min(hw, hd) * 0.6, snow ? '#e6eaee' : '#a8905a', rot, { overhang: 0.14, rows: 5, gableFill: '#8c6c45', tileDark: 'rgba(90,60,20,0.35)' });
      if (rot === 'x') I.line(ctx, [hx - 0.1, hy + hd / 2, 0.42 + Math.min(hw, hd) * 0.6], [hx + hw + 0.1, hy + hd / 2, 0.42 + Math.min(hw, hd) * 0.6], '#796642', 2.2); else I.line(ctx, [hx + hw / 2, hy - 0.1, 0.42 + Math.min(hw, hd) * 0.6], [hx + hw / 2, hy + hd + 0.1, 0.42 + Math.min(hw, hd) * 0.6], '#796642', 2.2);
      I.doorR(ctx, hx, hw, hy, 0, hd / 2, 0.2, 0.32, false); I.windowL(ctx, hx, hy, hd, 0.14, hw / 2, 0.14, 0.14, {});
    }
    // Fischgestell, Netze, Rauchfeuer
    for (const u of [0.1, 0.5]) I.line(ctx, [b.x + 1.5, b.y + u, 0], [b.x + 1.5, b.y + u, 0.5], '#66503a', 1.2); I.line(ctx, [b.x + 1.5, b.y + 0.1, 0.45], [b.x + 1.5, b.y + 0.5, 0.45], '#66503a', 1);
    for (let k = 0.14; k < 0.5; k += 0.07) I.line(ctx, [b.x + 1.5, b.y + k, 0.45], [b.x + 1.5, b.y + k, 0.3], '#b8a888', 1.2);
    const fp = I.p(b.x + 0.9, b.y + 0.4, 0); ctx.fillStyle = '#66503a'; ctx.beginPath(); ctx.ellipse(fp[0], fp[1], 5, 2.5, 0, 0, 6.28); ctx.fill(); if (!this.picking) { ctx.fillStyle = `rgba(255,140,40,${0.6 + Math.sin(this.time * 8) * 0.25})`; ctx.beginPath(); ctx.arc(fp[0], fp[1] - 2, 2, 0, 6.28); ctx.fill(); if (this.light() < 0.6) this.lamps.push([fp[0], fp[1] - 2, 'fire']); }
  },
  drawYard(ctx, b) {
    I.poly(ctx, [[b.x, b.y, 0], [b.x + b.w, b.y, 0], [b.x + b.w, b.y + b.d, 0], [b.x, b.y + b.d, 0]], this.pat.planks, 'rgba(0,0,0,0.4)');
    // Kiel und Spanten
    I.line(ctx, [b.x + 0.2, b.y + 1.0, 0.25], [b.x + 1.6, b.y + 1.0, 0.25], '#c8a879', 2.5);
    for (let i = 0; i < 7; i++) { const x = b.x + 0.3 + i * 0.2, r = 0.45 - Math.abs(i - 3) * 0.06; const pts = []; for (let k = 0; k <= 6; k++) { const a = Math.PI + k * Math.PI / 6; pts.push([x, b.y + 1.0 + Math.cos(a) * r, 0.25 + Math.sin(a) * -r * 0.9 + 0.02]); } ctx.strokeStyle = '#c8a879'; ctx.lineWidth = 1.6; ctx.beginPath(); pts.forEach((q, k) => { const s = I.p(q[0], q[1], q[2]); k ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); }); ctx.stroke(); }
    for (let i = 0; i < 4; i++) I.box(ctx, b.x + 0.2, b.y + 1.7, i * 0.06, 1.2, 0.25, 0.06, { wall: '#876339', top: '#9a7a4a' });
    I.box(ctx, b.x + 1.2, b.y + 0.1, 0, 0.55, 0.5, 0.5, { wall: '#8c6c45' }, { noTop: true }); I.gableRoof(ctx, b.x + 1.2, b.y + 0.1, 0.5, 0.55, 0.5, 0.3, '#6c5946', 'x', { overhang: 0.06, rows: 3, gableFill: '#8c6c45' });
    I.line(ctx, [b.x + 0.15, b.y + 0.15, 0], [b.x + 0.15, b.y + 0.15, 1.4], '#62472c', 1.5); const p = I.p(b.x + 0.15, b.y + 0.15, 1.4); ctx.fillStyle = '#bfa361'; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + 9 + Math.sin(this.time * 4) * 2, p[1] + 3); ctx.lineTo(p[0], p[1] + 6); ctx.fill();
  },
  drawPlot(ctx, b, st, season, sv) {
    const ws = st.workshops[b.plot];
    if (!ws.type) {
      const { x, y, w, d } = b, snow = season === 'winter';
      const noise = (u, v) => HK.Art.noise(x + u + b.plot * 3, y + v);
      // Low, inhabited-looking vacant yards. All details stay inside the plot;
      // the street-facing opening is at the back (small y), beside the notice.
      I.poly(ctx, [[x, y, 0], [x + w, y, 0], [x + w, y + d, 0], [x, y + d, 0]], snow ? '#c7cbc0' : '#8e8970');
      I.poly(ctx, [[x + .05, y + .3, .002], [x + .32, y + .16, .002], [x + w - .1, y + .27, .002], [x + w - .17, y + d - .12, .002], [x + .19, y + d - .06, .002]], snow ? '#d9dbcf' : '#a39778');
      I.poly(ctx, [[x + .38, y, .003], [x + .79, y, .003], [x + .87, y + .6, .003], [x + .58, y + .82, .003], [x + .35, y + .49, .003]], snow ? '#adae9d' : '#b0a184');
      for (let i = 0; i < 28; i++) {
        const u = .08 + noise(i, 1) * (w - .16), v = .1 + noise(i, 2) * (d - .2);
        const edge = u < .25 || u > w - .27 || v > d - .25;
        if (!edge) continue;
        I.poly(ctx, [[x + u - .045, y + v, .005], [x + u, y + v - .06, .005], [x + u + .065, y + v, .005], [x + u, y + v + .04, .005]], snow ? '#c0c8ba' : '#7e8461');
        if (!snow) for (let k = 0; k < 3; k++) I.line(ctx, [x + u, y + v, .008], [x + u + (k - 1) * .035, y + v + .01, .045 + noise(i, k) * .055], '#737b53', .6);
      }
      const fence = (ax, ay, bx, by) => {
        const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / .42));
        for (const z of [.13, .27]) I.line(ctx, [ax, ay, z], [bx, by, z], '#8b7958', 1.3);
        for (let i = 0; i <= n; i++) {
          const px = ax + (bx - ax) * i / n, py = ay + (by - ay) * i / n;
          I.box(ctx, px - .025, py - .025, 0, .05, .05, .34, { wall: '#78674d', top: '#aa9872' });
        }
      };
      fence(x + .04, y + .04, x + .32, y + .04);
      fence(x + .86, y + .04, x + w - .04, y + .04);
      fence(x + .04, y + .04, x + .04, y + d - .04);
      // Modest leftover building materials, varied per yard and resting on bearers.
      const tx = x + .19, ty = y + d - .4;
      if (b.plot !== 1) {
        for (const u of [.07, .43]) I.box(ctx, tx + u, ty, 0, .065, .25, .055, { wall: '#655941', top: '#827354' });
        for (let i = 0; i < 3 + b.plot; i++) I.box(ctx, tx, ty + (i % 3) * .072, .055 + Math.floor(i / 3) * .035, .57, .065, .032, { wall: '#8c7753', top: '#b39a6c' });
      } else {
        for (let i = 0; i < 5; i++) I.box(ctx, tx + (i % 3) * .14, ty + Math.floor(i / 3) * .12, 0, .12, .1, .07, { wall: '#827e6e', top: '#aaa48e' });
      }
      fence(x + .04, y + d - .04, x + w - .04, y + d - .04);
      fence(x + w - .04, y + .04, x + w - .04, y + d - .04);
      // A small timber notice with a parchment and seal instead of a rooftop billboard.
      const sx = x + (b.plot === 2 ? .22 : w - .3), sy = y + .12, top = .72;
      I.box(ctx, sx - .022, sy - .02, 0, .044, .044, top, { wall: '#796447', top: '#ab9270' });
      I.box(ctx, sx - .19, sy - .028, top - .27, .38, .055, .25, { wall: '#806747', top: '#ad936a' });
      I.poly(ctx, [[sx - .135, sy + .029, top - .045], [sx + .135, sy + .029, top - .045], [sx + .125, sy + .029, top - .23], [sx - .12, sy + .029, top - .22]], '#d8c69d');
      for (let i = 0; i < 2; i++) I.line(ctx, [sx - .085, sy + .031, top - .09 - i * .045], [sx + .07 - i * .025, sy + .031, top - .09 - i * .045], '#817154', .6);
      const seal = I.p(sx + .065, sy + .032, top - .185);
      ctx.fillStyle = '#975344'; ctx.beginPath(); ctx.arc(seal[0], seal[1], .8, 0, Math.PI * 2); ctx.fill();
      return;
    }
    const cols = { brewery: ['#c9af7b', '#7e4634'], smokehouse: ['#8a7a6a', '#505050'], weaver: ['#b3ab93', '#605449'], smithy: ['#9a9284', '#605449'], saltworks: ['#b8b4aa', '#635c68'], ropemaker: ['#b9aa83', '#79694f'], sailweaver: ['#c9c1a4', '#687e7b'] };
    const c = cols[ws.type];
    this.drawHouse(ctx, Object.assign({}, b, { wall: c[0], roof: c[1], stone: ws.type === 'smithy' }), st, season, sv, false);
    const fx = b.x + b.w + 0.15, fy = b.y + b.d * 0.5;
    if (ws.type === 'brewery') for (let i = 0; i < 3; i++) this.barrel3(ctx, b.x + b.w + 0.2, b.y + 0.2 + i * 0.22, 0);
    if (ws.type === 'smokehouse') { for (let k = 0; k < 5; k++) I.line(ctx, [b.x + b.w + 0.2, b.y + 0.2 + k * 0.15, 0.5], [b.x + b.w + 0.2, b.y + 0.2 + k * 0.15, 0.3], '#b8a888', 1.2); I.line(ctx, [b.x + b.w + 0.2, b.y + 0.1, 0.52], [b.x + b.w + 0.2, b.y + 0.95, 0.52], '#66503a', 1); }
    if (ws.type === 'smithy') { const p = I.p(fx, fy, 0.25); const gl = ctx.createRadialGradient(p[0], p[1], 1, p[0], p[1], 14); gl.addColorStop(0, `rgba(255,140,40,${0.5 + Math.sin(this.time * 7) * 0.2})`); gl.addColorStop(1, 'rgba(255,100,20,0)'); ctx.fillStyle = gl; ctx.fillRect(p[0] - 14, p[1] - 14, 28, 28); I.box(ctx, b.x + b.w + 0.1, fy - 0.15, 0, 0.3, 0.3, 0.2, { wall: '#505050', top: '#555' }); }
    if (ws.type === 'weaver') for (let i = 0; i < 3; i++) I.box(ctx, b.x + b.w + 0.12, b.y + 0.2 + i * 0.25, 0, 0.15, 0.2, 0.15, { wall: ['#496eb4', '#b44949', '#e8e0c8'][i], top: ['#496eb4', '#b44949', '#e8e0c8'][i] });
    if (ws.type === 'saltworks') I.pyramid(ctx, b.x + b.w + 0.1, b.y + 0.3, 0, 0.4, 0.4, 0.3, '#f0eee8');
    const p = I.p(b.x + b.w + 0.02, b.y + 0.05, b.h); ctx.fillStyle = ws.idle ? '#963d3d' : '#3e974d'; ctx.beginPath(); ctx.arc(p[0], p[1], 2.5, 0, 6.28); ctx.fill();
  },
  marketStalls(b) { return [[b.x + 0.25, b.y + 0.12, '#a55c4e'], [b.x + 1.25, b.y + 0.1, '#7d8e93'], [b.x + 2.25, b.y + 0.12, '#8c8a5e'], [b.x + 2.5, b.y + 1.3, '#b09256'], [b.x + 2.5, b.y + 2.3, '#8d7a6a'], [b.x + 0.08, b.y + 1.5, '#a55c4e']].map(q => ({ x: q[0], y: q[1], c: q[2] })); },
  marketSacks(b) { return [[b.x + 0.4, b.y + 2.3], [b.x + 0.6, b.y + 2.35], [b.x + 2.0, b.y + 3.1]]; },
  drawStall(ctx, sd, i, st) {
    const x = sd.x, y = sd.y, mine = i < st.stalls, col = mine ? '#b99753' : sd.c;
    I.box(ctx, x, y, 0, 0.55, 0.35, 0.3, { wall: '#84623f', top: '#9a7a4a' });
    for (const [px, py] of [[x, y], [x + 0.55, y], [x, y + 0.35], [x + 0.55, y + 0.35]]) I.line(ctx, [px, py, 0], [px, py, 0.7], '#72502e', 1.2);
    if (HK.Art?.drawMarketCanopy) HK.Art.drawMarketCanopy(ctx, x, y, col, this.season() === 'winter');
    else I.gableRoof(ctx, x, y, 0.7, 0.55, 0.35, 0.15, col, 'x', { overhang: 0.08, rows: 2, tileDark: 'rgba(255,255,255,0.35)' });
    const goods = [['#c6b475', '#b2914a'], ['#a95445', '#7d9455'], ['#7d9455', '#c6b475'], ['#b2914a', '#876d3d'], ['#a95445', '#6f5285'], ['#ded5bf', '#4f6a93']][i];
    if (HK.Art?.drawMarketProduce) HK.Art.drawMarketProduce(ctx, sd, i);
    else for (let k = 0; k < 4; k++) { const p = I.p(x + 0.1 + k * 0.12, y + 0.4, 0.32); ctx.fillStyle = goods[k % 2]; ctx.beginPath(); ctx.arc(p[0], p[1], 2, 0, 6.28); ctx.fill(); }
    if (mine) this.gableFlag(ctx, x + 0.55, y, 0.75);
  },
  drawMarket() {},
  /* Lagerhalle: Traufenhaus mit Ladeluken statt Fenstern im Obergeschoss, Kran, Rampe */
  drawLonghouse(ctx, b, st, season, sv) {
    this.drawHouse(ctx, Object.assign({}, b, { noWindowsUpper: true }), st, season, sv, false);
    const yy = b.y + b.d, n = Math.max(2, Math.round(b.w / 0.8));
    for (let i = 0; i < n; i++) { const u = b.x + b.w * (i + 0.5) / n; if (b.low) continue; I.poly(ctx, [[u - 0.16, yy + 0.005, b.h * 0.55], [u + 0.16, yy + 0.005, b.h * 0.55], [u + 0.16, yy + 0.005, b.h * 0.92], [u - 0.16, yy + 0.005, b.h * 0.92]], '#62472c', 'rgba(20,10,5,0.6)', 0.6); I.line(ctx, [u, yy + 0.01, b.h * 0.55], [u, yy + 0.01, b.h * 0.92], 'rgba(0,0,0,0.5)', 0.6); }
    if (b.low) { for (let u = 0.3; u < b.w; u += 0.6) I.poly(ctx, [[b.x + u - 0.1, yy + 0.005, 0.12], [b.x + u + 0.1, yy + 0.005, 0.12], [b.x + u + 0.1, yy + 0.005, 0.42], [b.x + u - 0.1, yy + 0.005, 0.42]], '#62472c'); }
    if (!b.low && !b.separateExtras) { this.drawLoadingPad(ctx, b); this.crate3(ctx, b.x + 0.25, yy + 0.02, 0, 0.22); }
  },
  /* Offene Markthalle: Pfosten, Satteldach, Tische mit Fisch */
  drawOpenHall(ctx, b, st, season, sv) {
    const rh = 0.45, snow = season === 'winter';
    I.shadow(ctx, b.x, b.y, b.w, b.d, b.h + rh * 0.5, sv.v, sv.a);
    I.poly(ctx, [[b.x, b.y, 0], [b.x + b.w, b.y, 0], [b.x + b.w, b.y + b.d, 0], [b.x, b.y + b.d, 0]], this.pat.stone, 'rgba(0,0,0,0.3)');
    // Tische hinten (werden von Pfosten und Dach überlagert)
    for (const [tx, ty] of [[b.x + 0.15, b.y + 0.2], [b.x + 0.85, b.y + 0.2], [b.x + 0.15, b.y + 0.65], [b.x + 0.85, b.y + 0.65]]) { I.box(ctx, tx, ty, 0.25, 0.5, 0.3, 0.08, { wall: '#84623f', top: '#a08a5a' }); for (let k = 0; k < 4; k++) { const p = I.p(tx + 0.08 + k * 0.11, ty + 0.15, 0.36); ctx.fillStyle = k % 2 ? '#9fb3c8' : '#7d93a8'; ctx.beginPath(); ctx.ellipse(p[0], p[1], 3.2, 1.4, -0.4, 0, 6.28); ctx.fill(); ctx.fillStyle = '#474747'; ctx.fillRect(p[0] + 1.5, p[1] - 1, 0.9, 0.9); } }
    for (const [px, py] of [[b.x, b.y], [b.x + b.w / 2, b.y], [b.x + b.w, b.y], [b.x, b.y + b.d], [b.x + b.w / 2, b.y + b.d], [b.x + b.w, b.y + b.d]]) I.line(ctx, [px, py, 0], [px, py, b.h], '#6c4a2f', 2.6);
    I.line(ctx, [b.x, b.y + b.d, b.h - 0.05], [b.x + b.w, b.y + b.d, b.h - 0.05], '#62472c', 1.8); I.line(ctx, [b.x + b.w, b.y, b.h - 0.05], [b.x + b.w, b.y + b.d, b.h - 0.05], '#62472c', 1.8);
    I.gableRoof(ctx, b.x, b.y, b.h, b.w, b.d, rh, snow ? '#e6eaee' : '#7f6e4d', 'x', { overhang: 0.16, rows: 5, gableFill: '#8c6c45' });
    const p = I.p(b.x + b.w, b.y + b.d * 0.5, b.h + 0.1); ctx.fillStyle = '#d8c7a0'; ctx.fillRect(p[0] - 6, p[1] - 4, 12, 7); ctx.fillStyle = '#416d8e'; ctx.beginPath(); ctx.ellipse(p[0], p[1] - 0.5, 4, 1.8, -0.3, 0, 6.28); ctx.fill();
    const gullP = I.p(b.x + 0.3, b.y - 0.1, b.h + rh + 0.05); ctx.fillStyle = '#f0ece0'; ctx.beginPath(); ctx.ellipse(gullP[0], gullP[1], 2.5, 1.8, 0, 0, 6.28); ctx.fill();
  },
  /* Kloster: Kapelle mit Dachreiter, Konventsflügel, Kreuzgang mit Garten und Brunnen */
  drawMonastery(ctx, b, st, season, sv) {
    const snow = season === 'winter';
    I.shadow(ctx, b.x, b.y, b.w, b.d, b.h + 0.6, sv.v, sv.a);
    // Kapelle hinten über die ganze Breite (First entlang x), Dachreiter mit Glocke
    const cd = 0.95;
    this.drawHouse(ctx, { id: 'monastery_c', windowStyle: 'chapel', x: b.x, y: b.y, w: b.w, d: cd, h: b.h + 0.2, brick: true, roof: '#605548' }, st, season, sv, true);
    const rh = Math.min(b.w, cd) * 0.62, tx = b.x + b.w * 0.5 - 0.14, ty = b.y + cd * 0.5 - 0.14, tz = b.h + 0.2 + rh * 0.85;
    I.box(ctx, tx, ty, tz, 0.28, 0.28, 0.5, { wall: '#68564f' }, { noTop: true }); const bp = I.p(tx + 0.14, ty + 0.28, tz + 0.25); ctx.fillStyle = '#bb9d58'; ctx.beginPath(); ctx.arc(bp[0], bp[1], 2.2, 0, 6.28); ctx.fill();
    I.pyramid(ctx, tx - 0.04, ty - 0.04, tz + 0.5, 0.36, 0.36, 0.55, snow ? '#e6eaee' : '#574e42');
    const cp = I.p(tx + 0.14, ty + 0.14, tz + 1.05); ctx.strokeStyle = '#bfa361'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(cp[0], cp[1]); ctx.lineTo(cp[0], cp[1] - 9); ctx.moveTo(cp[0] - 3, cp[1] - 6.5); ctx.lineTo(cp[0] + 3, cp[1] - 6.5); ctx.stroke();
    // Konventsflügel vorne links, Kreuzgarten vorne rechts mit Mauer, Brunnen und Baum
    const ww = 1.2, gy = b.y + cd + 0.05, gd = b.d - cd - 0.05, gx = b.x + ww + 0.1, gw = b.w - ww - 0.1;
    this.drawHouse(ctx, { id: 'monastery_w', x: b.x, y: gy, w: ww, d: gd, h: b.h - 0.3, brick: true, roof: '#605548' }, st, season, sv, false);
    I.poly(ctx, [[gx, gy, 0], [gx + gw, gy, 0], [gx + gw, gy + gd, 0], [gx, gy + gd, 0]], snow ? this.pat.snow : this.pat.grass);
    I.poly(ctx, [[gx + 0.15, gy + 0.15, 0.005], [gx + gw - 0.15, gy + 0.15, 0.005], [gx + gw - 0.15, gy + gd - 0.15, 0.005], [gx + 0.15, gy + gd - 0.15, 0.005]], 'rgba(0,0,0,0)', 'rgba(120,100,60,0.5)', 0.8);
    I.cylinder(ctx, gx + gw * 0.5, gy + gd * 0.5, 0, 0.14, 0.2, '#8f887a', { brick: true }); this.drawTree(ctx, gx + 0.3, gy + 0.25, 0.26, season, sv);
    for (let v = 0.12; v < gd; v += 0.24) I.line(ctx, [gx + gw, gy + v, 0], [gx + gw, gy + v, 0.42], '#7d766a', 2.2);
    for (let u = 0.12; u < gw; u += 0.24) I.line(ctx, [gx + u, gy + gd, 0], [gx + u, gy + gd, 0.42], '#8f887a', 2.2);
    I.box(ctx, gx, gy + gd - 0.06, 0.42, gw + 0.06, 0.06, 0.07, { wall: '#8f887a', top: '#a9a292' }); I.box(ctx, gx + gw - 0.06, gy, 0.42, 0.06, gd, 0.07, { wall: '#7d766a', top: '#a9a292' });
    { const mp = I.p(gx + gw - 0.35, gy + gd - 0.25, 0); this.drawPerson(ctx, mp[0], mp[1], '#66503a', 'monk', 1, false, '#dcc3aa', 0, -1, null, null, 0.8); }
  },
  /* Spital: Backsteinhalle mit Kreuz am Giebel und Glockengiebel, Kranke auf Bänken */
  drawHospital(ctx, b, st, season, sv) {
    this.drawHouse(ctx, Object.assign({}, b, { brick: true, roof: '#605548' }), st, season, sv, false);
    const rh = Math.min(b.w, b.d) * 0.62, cx = b.x + b.w / 2, yy = b.y + b.d;
    I.line(ctx, [cx, yy + 0.02, b.h + rh - 0.1], [cx, yy + 0.02, b.h + rh + 0.4], '#bfa361', 2); I.line(ctx, [cx - 0.1, yy + 0.02, b.h + rh + 0.25], [cx + 0.1, yy + 0.02, b.h + rh + 0.25], '#bfa361', 2);
    I.poly(ctx, [[b.x + b.w + 0.005, b.y + b.d * 0.5 - 0.18, 0.95], [b.x + b.w + 0.005, b.y + b.d * 0.5 + 0.18, 0.95], [b.x + b.w + 0.005, b.y + b.d * 0.5 + 0.18, 1.2], [b.x + b.w + 0.005, b.y + b.d * 0.5 - 0.18, 1.2]], '#ece4d0'); I.poly(ctx, [[b.x + b.w + 0.01, b.y + b.d * 0.5 - 0.04, 0.97], [b.x + b.w + 0.01, b.y + b.d * 0.5 + 0.04, 0.97], [b.x + b.w + 0.01, b.y + b.d * 0.5 + 0.04, 1.18], [b.x + b.w + 0.01, b.y + b.d * 0.5 - 0.04, 1.18]], '#c8102e'); I.poly(ctx, [[b.x + b.w + 0.01, b.y + b.d * 0.5 - 0.14, 1.04], [b.x + b.w + 0.01, b.y + b.d * 0.5 + 0.14, 1.04], [b.x + b.w + 0.01, b.y + b.d * 0.5 + 0.14, 1.11], [b.x + b.w + 0.01, b.y + b.d * 0.5 - 0.14, 1.11]], '#c8102e');
    if (!b.separateExtras) { this.drawHospitalBench(ctx, b); this.drawHospitalPatient(ctx, b); }
  },
  /* Marstall: langes niedriges Stallgebäude mit offener Front, Pferde davor */
  drawStable(ctx, b, st, season, sv) {
    this.drawHouse(ctx, Object.assign({}, b, { wall: '#c9b48a', roof: '#9a8352', noWindowsUpper: true }), st, season, sv, false);
    const yy = b.y + b.d;
    for (let u = 0.35; u < b.w - 0.2; u += 0.55) I.poly(ctx, [[b.x + u - 0.18, yy + 0.005, 0.12], [b.x + u + 0.18, yy + 0.005, 0.12], [b.x + u + 0.18, yy + 0.005, 0.5], [b.x + u - 0.18, yy + 0.005, 0.5]], '#5b3e25', 'rgba(20,10,5,0.5)', 0.5);
    for (const [hx, hy, col] of [[b.x + 0.4, yy + 0.35, '#754d30'], [b.x + 1.3, yy + 0.3, '#8b6a4a']]) { const p = I.p(hx, hy, 0); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(p[0], p[1] + 1, 9, 3, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(p[0], p[1] - 7, 8, 4.5, 0, 0, 6.28); ctx.fill(); ctx.fillRect(p[0] - 6, p[1] - 6, 2, 6); ctx.fillRect(p[0] + 4, p[1] - 6, 2, 6); ctx.beginPath(); ctx.moveTo(p[0] + 6, p[1] - 9); ctx.lineTo(p[0] + 11, p[1] - 14); ctx.lineTo(p[0] + 13, p[1] - 9); ctx.lineTo(p[0] + 9, p[1] - 7); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p[0] - 8, p[1] - 8); ctx.lineTo(p[0] - 11, p[1] - 2); ctx.stroke(); }
    for (let u = 0; u <= b.w; u += 0.25) I.line(ctx, [b.x + u, yy + 0.6, 0], [b.x + u, yy + 0.6, 0.2], '#7e5934', 1); I.line(ctx, [b.x, yy + 0.6, 0.16], [b.x + b.w, yy + 0.6, 0.16], '#7e5934', 1);
  },
  /* Holzhof: Stapel aus Stämmen und Brettern, Sägebock */
  drawTimberyard(ctx, b, st, season, sv) {
    I.poly(ctx, [[b.x, b.y, 0], [b.x + b.w, b.y, 0], [b.x + b.w, b.y + b.d, 0], [b.x, b.y + b.d, 0]], 'rgba(90,70,40,0.25)', 'rgba(60,40,20,0.3)');
    for (let u = 0; u <= b.w; u += 0.2) I.line(ctx, [b.x + u, b.y + b.d, 0], [b.x + u, b.y + b.d, 0.2], '#7e5934', 1); I.line(ctx, [b.x, b.y + b.d, 0.16], [b.x + b.w, b.y + b.d, 0.16], '#7e5934', 1);
    const logs = (lx, ly, n, len) => { for (let r = 0; r < 3; r++) for (let i = 0; i < n - r; i++) { const y = ly + i * 0.14 + r * 0.07, z = r * 0.12; I.line(ctx, [lx, y, z + 0.07], [lx + len, y, z + 0.07], '#876339', 3.2); const e = I.p(lx + len, y, z + 0.07); ctx.fillStyle = '#c8a879'; ctx.beginPath(); ctx.ellipse(e[0], e[1], 1.8, 2.2, 0, 0, 6.28); ctx.fill(); } };
    logs(b.x + 0.1, b.y + 0.1, 4, 0.7); logs(b.x + 0.1, b.y + 0.6, 3, 0.5);
    for (let i = 0; i < 5; i++) I.box(ctx, b.x + 0.9, b.y + 0.15, i * 0.05, 0.35, 0.6, 0.05, { wall: '#9a7a4a', top: '#b89a62' });
    I.line(ctx, [b.x + 0.95, b.y + 0.85, 0], [b.x + 1.15, b.y + 0.85, 0.35], '#6c4a2f', 1.5); I.line(ctx, [b.x + 1.15, b.y + 0.85, 0.35], [b.x + 1.35, b.y + 0.85, 0], '#6c4a2f', 1.5);
  },
  /* Kapelle: kleiner Backsteinbau mit Chorfenster, Dachreiter, Kreuz */
  drawChapel(ctx, b, st, season, sv) {
    this.drawHouse(ctx, Object.assign({}, b, { brick: true, roof: '#605548' }), st, season, sv, true);
    const rh = Math.min(b.w, b.d) * 0.62 + 0.12;
    I.windowR(ctx, b.x, b.w, b.y, 0.3, b.d * 0.5, 0.22, 0.7, { arch: true, frame: '#5e4434' });
    const cx = b.x + b.w * 0.3, cy = b.y + b.d * 0.5;
    I.box(ctx, cx - 0.1, cy - 0.1, b.h + rh * 0.6, 0.2, 0.2, 0.35, { wall: '#68564f' }, { noTop: true }); I.pyramid(ctx, cx - 0.13, cy - 0.13, b.h + rh * 0.6 + 0.35, 0.26, 0.26, 0.4, season === 'winter' ? '#e6eaee' : '#574e42');
    const cp = I.p(cx, cy, b.h + rh * 0.6 + 0.75); ctx.strokeStyle = '#bfa361'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cp[0], cp[1]); ctx.lineTo(cp[0], cp[1] - 8); ctx.moveTo(cp[0] - 2.5, cp[1] - 5.5); ctx.lineTo(cp[0] + 2.5, cp[1] - 5.5); ctx.stroke();
    if (this.light() < 0.6) { const lp = I.p(b.x + b.w + 0.05, b.y + b.d * 0.5, 0.9); this.lamps.push([lp[0], lp[1]]); }
  },
  drawGate(ctx, b, st, season, sv) {
    const g = HK.WALL.gates.find(x => x.haus === 'gebaeude') || HK.WALL.gates[HK.WALL.gates.length - 1];
    this.drawGatehouse(ctx, this.gateSpec(g), sv);
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
  /* Prisma über beliebigem konvexen Viereck (Weltkoordinaten): sichtbare Seiten nach Tiefe, dann Deckel.
     Schattierung nach Ausrichtung der Fläche (nach +y hell, nach +x dunkler). */
  prism(ctx, base, z0, h, col, o) {
    o = o || {}; let area = 0; for (let i = 0; i < 4; i++) { const a = base[i], b = base[(i + 1) % 4]; area += a[0] * b[1] - b[0] * a[1]; }
    const sgn = area > 0 ? 1 : -1, faces = [];
    for (let i = 0; i < 4; i++) { if (o.hideEdges && o.hideEdges.includes(i)) continue; const a = base[i], b = base[(i + 1) % 4]; const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1; const n = [sgn * dy / len, -sgn * dx / len]; if (n[0] + n[1] <= 0.02) continue; const f = (n[1] - n[0] + 1) / 2; faces.push({ a, b, n, k: 0.74 + 0.26 * f, depth: (a[0] + a[1] + b[0] + b[1]) / 2 }); }
    faces.sort((p, q) => p.depth - q.depth);
    for (const f of faces) { I.poly(ctx, [[f.a[0], f.a[1], z0], [f.b[0], f.b[1], z0], [f.b[0], f.b[1], z0 + h], [f.a[0], f.a[1], z0 + h]], I.shade(col.wall, f.k), o.stroke || 'rgba(0,0,0,0)'); if (o.masonry) this.masonryFace(ctx, f.a, f.b, z0, h); }
    if (!o.noTop) I.poly(ctx, base.map(q => [q[0], q[1], z0 + h]), I.shade(col.top || col.wall, 1.08), o.stroke || 'rgba(0,0,0,0)');
    return faces;
  },
  masonryFace(ctx, a, b, z0, h) {
    const course = 0.13, len = Math.hypot(b[0] - a[0], b[1] - a[1]); let row = 0;
    for (let z = z0 + course; z < z0 + h; z += course, row++) { I.line(ctx, [a[0], a[1], z], [b[0], b[1], z], 'rgba(0,0,0,0.28)', 0.6); I.line(ctx, [a[0], a[1], z + 0.02], [b[0], b[1], z + 0.02], 'rgba(255,255,255,0.07)', 0.6); for (let u = (row % 2) * 0.17; u < len; u += 0.34) { const f = u / len; I.line(ctx, [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, z - course], [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, z], 'rgba(0,0,0,0.22)', 0.6); } }
    I.poly(ctx, [[a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z0 + 0.22], [a[0], a[1], z0 + 0.22]], 'rgba(20,20,15,0.22)');
  },
  /* ---------- Stadtmauer ----------
     Backstein auf Feldsteinsockel, wie an der Ostsee gebaut wurde: unten graue Findlinge, darüber
     roter Ziegel im Verband, oben ein heller Gesimsstein. Nach außen Schießscharten, nach innen die
     Bogenblenden, die den Wehrgang tragen. Auf der Krone der Wehrgang: außen die Zinnenbrüstung mit
     Scharten, innen eine niedrige Brüstung mit Holzgeländer. Stücke von höchstens 2,2 Einheiten,
     Tore als Lücken, in denen die Torhäuser stehen. */
  MAUER: { ziegel: '#8f5a47', ziegelTop: '#8a8074', sockel: '#6d685f', sockelTop: '#7a746a', kante: '#b7ab93', holz: '#6b4e34', sockelH: 0.36 },
  /* Ziegelverband auf einer Fläche a→b: Lagerfugen hell, Stoßfugen versetzt und dunkel */
  ziegelFace(ctx, a, b, z0, hh) {
    const lage = 0.075, len = Math.hypot(b[0] - a[0], b[1] - a[1]); let row = 0;
    const at = f => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    for (let z = z0 + lage; z < z0 + hh - 0.01; z += lage, row++) {
      I.line(ctx, [a[0], a[1], z], [b[0], b[1], z], 'rgba(238,220,196,0.17)', 0.5);
      if (row % 2 === 0) for (let u = 0.11 + (row % 4 ? 0.11 : 0); u < len; u += 0.22) { const q = at(u / len); I.line(ctx, [q[0], q[1], z - lage], [q[0], q[1], z], 'rgba(60,28,18,0.22)', 0.5); }
    }
    // Ausblühungen und Feuchte: ein paar hellere und dunklere Flecken je Stück
    const zuf = u => { const r = Math.sin(u * 12.9898 + a[0] * 7.1 + a[1] * 3.3) * 43758.5453; return r - Math.floor(r); };
    for (let k = 0; k < 4; k++) { const f0 = zuf(k) * 0.8, f1 = f0 + 0.08 + zuf(k + 9) * 0.14, zz = z0 + 0.1 + zuf(k + 5) * (hh - 0.3); const p = at(f0), q = at(Math.min(1, f1)); I.poly(ctx, [[p[0], p[1], zz], [q[0], q[1], zz], [q[0], q[1], zz + 0.09], [p[0], p[1], zz + 0.09]], k % 2 ? 'rgba(255,240,220,0.07)' : 'rgba(40,20,10,0.09)'); }
  },
  /* Feldsteinsockel: unregelmäßige Findlinge als helle Rundungen im dunklen Mörtel */
  feldsteinFace(ctx, a, b, z0, hh) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const zuf = u => { const r = Math.sin(u * 12.9898 + a[0] * 5.7 + a[1] * 2.9) * 43758.5453; return r - Math.floor(r); };
    const at = f => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    let i = 0;
    for (let u = 0.03; u < len - 0.05; u += 0.13 + zuf(i) * 0.12, i++) {
      const w = 0.09 + zuf(i + 3) * 0.1, zz = z0 + 0.03 + zuf(i + 7) * (hh - 0.16), zh = 0.07 + zuf(i + 11) * 0.07;
      const p = at(u / len), q = at(Math.min(1, (u + w) / len));
      I.poly(ctx, [[p[0], p[1], zz], [q[0], q[1], zz], [q[0], q[1], zz + zh], [p[0], p[1], zz + zh]], zuf(i + 2) > 0.5 ? 'rgba(205,200,188,0.28)' : 'rgba(150,146,136,0.3)', 'rgba(35,32,28,0.35)', 0.5);
    }
    I.poly(ctx, [[a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z0 + 0.1], [a[0], a[1], z0 + 0.1]], 'rgba(20,20,15,0.22)');
  },
  /* Schießscharte auf der Fläche durch P (Fußpunkt der Scharte), n zeigt vom Mauerwerk weg */
  scharte(ctx, P, n, dirV, z, breit, hoch) {
    const o = 0.004, bx = P[0] + n[0] * o, by = P[1] + n[1] * o, s = dirV;
    const w = breit, hh = hoch;
    I.poly(ctx, [[bx - s[0] * w, by - s[1] * w, z], [bx + s[0] * w, by + s[1] * w, z], [bx + s[0] * w, by + s[1] * w, z + hh], [bx - s[0] * w, by - s[1] * w, z + hh]], 'rgba(230,215,190,0.28)');
    I.poly(ctx, [[bx - s[0] * w * 0.28, by - s[1] * w * 0.28, z + 0.02], [bx + s[0] * w * 0.28, by + s[1] * w * 0.28, z + 0.02], [bx + s[0] * w * 0.28, by + s[1] * w * 0.28, z + hh - 0.02], [bx - s[0] * w * 0.28, by - s[1] * w * 0.28, z + hh - 0.02]], '#2e2521');
  },
  /* Bogenblende an der Innenseite: eine flache Nische mit rundem Sturz, die den Wehrgang trägt */
  blende(ctx, P, n, s, z0, hh, halb) {
    const o = 0.004, bx = P[0] + n[0] * o, by = P[1] + n[1] * o;
    const pts = [[bx - s[0] * halb, by - s[1] * halb, z0], [bx + s[0] * halb, by + s[1] * halb, z0]];
    for (let k = 0; k <= 6; k++) { const a = Math.PI * k / 6, cx = Math.cos(a) * halb, cz = Math.sin(a) * halb * 0.9; pts.push([bx + s[0] * cx, by + s[1] * cx, z0 + hh - halb * 0.9 + cz]); }
    I.poly(ctx, pts, 'rgba(40,20,14,0.22)', 'rgba(238,220,196,0.22)', 0.6);
  },
  // Gemeinsamer Gehrungspunkt für beide Wandflächen an einer Ecke. Alle
  // Sockel, Gesimse und Brüstungen benutzen denselben Anschluss je Abstand.
  wallSection(segment, u, offset) {
    const pts = HK.WALL.pts, A = pts[segment], B = pts[segment + 1];
    const dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy), n = [dy / len, -dx / len];
    const vertex = Math.abs(u) < 1e-8 ? segment : Math.abs(u - len) < 1e-8 ? segment + 1 : -1;
    if (vertex > 0 && vertex < pts.length - 1) {
      const P = pts[vertex - 1], Q = pts[vertex], R = pts[vertex + 1];
      const l0 = Math.hypot(Q[0] - P[0], Q[1] - P[1]), l1 = Math.hypot(R[0] - Q[0], R[1] - Q[1]);
      const n0 = [(Q[1] - P[1]) / l0, -(Q[0] - P[0]) / l0], n1 = [(R[1] - Q[1]) / l1, -(R[0] - Q[0]) / l1];
      const k = offset / (1 + n0[0] * n1[0] + n0[1] * n1[1]);
      return [Q[0] + (n0[0] + n1[0]) * k, Q[1] + (n0[1] + n1[1]) * k];
    }
    return [A[0] + dx / len * u + n[0] * offset, A[1] + dy / len * u + n[1] * offset];
  },
  // Only the exposed circular boundary belongs to the tower. Where a wall
  // continues from the circle, a complete cylinder would paint over its face.
  towerBaseArcs(cx, cy, radius, halfWidth, full = false) {
    let arcs = [[0, full ? 2*Math.PI : Math.PI]];
    const cut = (lo, hi) => { arcs = arcs.flatMap(([a,b]) => hi <= a || lo >= b ? [[a,b]] : [[a,Math.max(a,lo)],[Math.min(b,hi),b]].filter(([x,y])=>y-x>1e-8)); };
    const pts = HK.WALL.pts;
    for (let i=0; i<pts.length-1; i++) {
      const A=pts[i],B=pts[i+1],dx=B[0]-A[0],dy=B[1]-A[1],len=Math.hypot(dx,dy);
      const along=((cx-A[0])*dx+(cy-A[1])*dy)/len,off=((cx-A[0])*dy-(cy-A[1])*dx)/len;
      if(Math.abs(off)>1e-8 || along < -1e-8 || along > len+1e-8)continue;
      for(const sign of [-1,1]) {
        if((sign<0?along:len-along)<radius)continue;
        const angle=Math.atan2(sign*dy,sign*dx)+Math.PI/4,spread=Math.asin(halfWidth/radius);
        for(const turn of [-2*Math.PI,0,2*Math.PI])cut(angle+turn-spread,angle+turn+spread);
      }
    }
    return arcs;
  },
  towerBaseLayer(ctx, cx, cy, radius, halfWidth, z, height, color, innerRadius, innerHalfWidth) {
    const arcs=this.towerBaseArcs(cx,cy,radius,halfWidth),B=I.p(cx,cy,z),T=I.p(cx,cy,z+height);
    const rx=radius*Math.SQRT2*I.TW,ry=radius*Math.SQRT2*I.TH;
    const point=(a,r,zz)=>[cx+Math.cos(a-Math.PI/4)*r,cy+Math.sin(a-Math.PI/4)*r,zz];
    for(const [a,b] of arcs) {
      ctx.beginPath();ctx.ellipse(B[0],B[1],rx,ry,0,a,b);ctx.lineTo(T[0]+Math.cos(b)*rx,T[1]+Math.sin(b)*ry);ctx.ellipse(T[0],T[1],rx,ry,0,b,a,true);ctx.closePath();
      ctx.fillStyle=I.shade(color,.85);ctx.fill();
      const gradient=ctx.createLinearGradient(B[0]-rx,0,B[0]+rx,0);gradient.addColorStop(0,'rgba(0,0,0,0.12)');gradient.addColorStop(.35,'rgba(255,255,240,0.18)');gradient.addColorStop(1,'rgba(0,0,0,0.42)');ctx.fillStyle=gradient;ctx.fill();
    }
    if(innerRadius) {
      // The ledge is a full annulus, including the rear portions visible beside
      // the narrower shaft. Its two edges meet their own wall footprints.
      const outer=this.towerBaseArcs(cx,cy,radius,halfWidth,true),inner=this.towerBaseArcs(cx,cy,innerRadius,innerHalfWidth,true);
      for(let k=0;k<outer.length;k++) {
        const [a,b]=outer[k],near=inner[k];if(!near)continue;
        const ring=[],steps=Math.ceil((b-a)*24);
        for(let i=0;i<=steps;i++)ring.push(point(a+(b-a)*i/steps,radius,z+height));
        for(let i=steps;i>=0;i--)ring.push(point(near[0]+(near[1]-near[0])*i/steps,innerRadius,z+height));
        I.poly(ctx,ring,I.shade(color,1.08));
      }
    }
    return arcs;
  },
  wallSegments() {
    const segs = [], Wd = HK.WALL, t = Wd.t, h = Wd.h, M = this.MAUER, zs = M.sockelH;
    const quad = (p, q, w, n) => [[p[0] + n[0] * w, p[1] + n[1] * w], [q[0] + n[0] * w, q[1] + n[1] * w], [q[0] - n[0] * w, q[1] - n[1] * w], [p[0] - n[0] * w, p[1] - n[1] * w]];
    const piece = (a, b, dir, nOut, segment, u0, u1, range) => {
      const section = (u, offset, radial = 0) => {
        let along = u0 + u;
        if (range.startTower && Math.abs(along - range.lo) < 1e-8) along = range.startTower.at + Math.sqrt((range.startTower.r + radial) ** 2 - offset ** 2);
        if (range.endTower && Math.abs(along - range.hi) < 1e-8) along = range.endTower.at - Math.sqrt((range.endTower.r + radial) ** 2 - offset ** 2);
        return this.wallSection(segment, along, offset);
      };
      const strip = (lo, hi, radial = 0) => [section(0, hi, radial), section(u1 - u0, hi, radial), section(u1 - u0, lo, radial), section(0, lo, radial)];
      const hideEdges = [];
      if (u0 > range.lo + 1e-8 || range.startTower) hideEdges.push(3);
      if (u1 < range.hi - 1e-8 || range.endTower) hideEdges.push(1);
      const wallPrism = (ctx, footprint, z, height, color, options = {}) => this.prism(ctx, footprint, z, height, color, { ...options, hideEdges });
      const base = strip(-t / 2, t / 2), sock = strip(-t / 2 - 0.06, t / 2 + 0.06, 0.06);
      const k = Math.max(...sock.map(q => q[0] + q[1])), box = [Math.min(...sock.map(q => q[0])), Math.min(...sock.map(q => q[1])), Math.max(...sock.map(q => q[0])), Math.max(...sock.map(q => q[1]))];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]), at = (u, n, w) => [a[0] + dir[0] * u + n[0] * w, a[1] + dir[1] * u + n[1] * w];
      segs.push({ k, box, guardRange: { segment, u0, u1 }, f: (ctx, sv, part = 'all') => {
        const visOut = nOut[0] + nOut[1] > 0.02, nIn = [-nOut[0], -nOut[1]];
        const drawOuterParapet = () => {
          wallPrism(ctx, strip(t / 2 - 0.14, t / 2), h, 0.14, { wall: M.ziegel, top: M.kante }, {});
          for (let u = 0.06; u + 0.3 <= len; u += 0.52) {
            const p = at(u, nOut, t / 2 - 0.07), q = at(u + 0.3, nOut, t / 2 - 0.07);
            this.prism(ctx, quad(p, q, 0.07, nOut), h + 0.14, 0.36, { wall: M.ziegel, top: M.kante }, { stroke: 'rgba(0,0,0,0.3)' });
            if (visOut) {
              const m = at(u + 0.15, nOut, t / 2);
              I.poly(ctx, [[m[0] - dir[0] * 0.02, m[1] - dir[1] * 0.02, h + 0.2], [m[0] + dir[0] * 0.02, m[1] + dir[1] * 0.02, h + 0.2], [m[0] + dir[0] * 0.02, m[1] + dir[1] * 0.02, h + 0.44], [m[0] - dir[0] * 0.02, m[1] - dir[1] * 0.02, h + 0.44]], '#2e2521');
            }
          }
        };
        const drawInnerParapet = () => {
          const iA = section(0, -t / 2 + 0.05), iB = section(len, -t / 2 + 0.05);
          wallPrism(ctx, strip(-t / 2, -t / 2 + 0.1), h, 0.12, { wall: M.ziegel, top: M.kante }, {});
          for (let u = 0.12; u < len; u += 0.46) { const p = at(u, nIn, t / 2 - 0.05); I.line(ctx, [p[0], p[1], h + 0.12], [p[0], p[1], h + 0.46], M.holz, 1.4); }
          I.line(ctx, [iA[0], iA[1], h + 0.44], [iB[0], iB[1], h + 0.44], M.holz, 1.2);
        };
        if (part === 'front') { (visOut ? drawOuterParapet : drawInnerParapet)(); return; }
        const fs = wallPrism(ctx, sock, 0, zs, { wall: M.sockel, top: M.sockelTop }, { noTop: true });
        for (const f of fs) this.feldsteinFace(ctx, f.a, f.b, 0, zs);
        wallPrism(ctx, strip(-t / 2 - 0.02, t / 2 + 0.02, 0.03), zs - 0.04, 0.05, { wall: M.kante, top: M.kante }, {});
        const fz = wallPrism(ctx, base, zs, h - zs, { wall: M.ziegel, top: M.ziegelTop }, {});
        for (const f of fz) this.ziegelFace(ctx, f.a, f.b, zs, h - zs);
        // Welche Längsseite zeigt zum Betrachter? Außen: Scharten. Innen: Bogenblenden.
        if (visOut) { for (let u = 0.6; u < len - 0.35; u += 1.1) this.scharte(ctx, at(u, nOut, t / 2), nOut, dir, zs + 0.42, 0.075, 0.34); }
        else { for (let u = 0.42; u + 0.42 < len; u += 0.72) this.blende(ctx, at(u, nIn, t / 2), nIn, dir, zs + 0.04, h - zs - 0.14, 0.27); }
        // Gesims unter der Krone
        wallPrism(ctx, strip(-t / 2 - 0.03, t / 2 + 0.03), h - 0.07, 0.07, { wall: M.kante, top: M.kante }, {});
        // Plattenfugen auf dem Gang
        for (let u = 0.4; u < len; u += 0.8) { const p = at(u, nOut, t / 2 - 0.14), q = at(u, nIn, t / 2 - 0.1); I.line(ctx, [p[0], p[1], h + 0.003], [q[0], q[1], h + 0.003], 'rgba(0,0,0,0.18)', 0.6); }
        // Hintere Brüstung, Wache, vordere Brüstung: auch ohne Wache muss
        // das Geländer hinter den Zinnen und ihren Schießscharten bleiben.
        (visOut ? drawInnerParapet : drawOuterParapet)();
        // Die Wache gehört zum Wehrgang, zwischen die hintere und vordere
        // Brüstung. Ein eigenes Bodenobjekt würde ihre Beine vor die Mauer ziehen.
        if (part === 'all' && HK.WALL_PATROLS.some(p => p.seg === segment && p.u0 < u1 && p.u1 >= u0)) {
          const time = this.time; // auch leere Patrouillenstücke müssen beim Weitergehen auffrischen
          for (const guard of this.wallGuards || []) {
            if (guard.p.seg !== segment || guard.u < u0 || guard.u >= u1) continue;
            const q = this.wallGuardPos(guard), sp = I.p(q.x, q.y, h + 0.02);
            this.drawPerson(ctx, sp[0], sp[1], '#435479', 'guard', 1, false, '#dcc3aa', guard.wait > 0 ? 0 : guard.phase, q.facing, null, null, 0.85);
          }
        }
        if (part !== 'rear') (visOut ? drawOuterParapet : drawInnerParapet)();
      } });
    };
    for (let i = 0; i < Wd.pts.length - 1; i++) {
      const A = Wd.pts[i], B = Wd.pts[i + 1], dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy), dir = [dx / len, dy / len];
      const nOut = [dir[1], -dir[0]]; // Stadt liegt rechts der Laufrichtung, außen ist links
      const gaps = Wd.gates.filter(g => g.seg === i).map(g => { const along = Math.abs(dir[0]) > Math.abs(dir[1]) ? (g.at - A[0]) / dir[0] : (g.at - A[1]) / dir[1]; return { lo: along - g.w / 2, hi: along + g.w / 2 }; });
      for (const [cx, cy, r] of Wd.towers) {
        const at = (cx - A[0]) * dir[0] + (cy - A[1]) * dir[1], off = (cx - A[0]) * nOut[0] + (cy - A[1]) * nOut[1];
        if (Math.abs(off) < 1e-8 && at >= -1e-8 && at <= len + 1e-8) gaps.push({ lo: at - r, hi: at + r, tower: { at, r } });
      }
      gaps.sort((p, q) => p.lo - q.lo);
      const ranges = []; let lo = 0, startTower = null;
      for (const gap of gaps) {
        if (gap.lo > lo) ranges.push({ lo, hi: Math.min(len, gap.lo), startTower, endTower: gap.tower });
        if (gap.hi > lo) { lo = gap.hi; startTower = gap.tower; }
      }
      if (lo < len) ranges.push({ lo, hi: len, startTower, endTower: null });
      for (const range of ranges) for (let u = range.lo; u < range.hi - 0.01; u += 2.2) { const u1 = Math.min(u + 2.2, range.hi); piece([A[0] + dir[0] * u, A[1] + dir[1] * u], [A[0] + dir[0] * u1, A[1] + dir[1] * u1], dir, nOut, i, u, u1, range); }
    }
    // Torhäuser: das Nordtor gehört zur Mauer; das Landtor ist ein anklickbares Gebäude (drawGate)
    for (const g of Wd.gates) {
      if (g.haus === 'gebaeude') continue;
      const sp = this.gateSpec(g);
      for (const p of this.gateParts(sp)) segs.push({ k: p.flat ? 0 : p.k, box: p.flat ? null : p.box, gateHouse: p.part === 'house' ? sp : null, f: (ctx, sv) => this.drawGatehouse(ctx, sp, sv, p.part) });
    }
    // Türme: Feldsteinsockel, Ziegelschaft mit Scharten, Gesimsring, Zinnenkranz, Kegeldach
    const tower = (cx, cy, r, hh, k) => segs.push({ k, box: [cx - r - 0.06, cy - r - 0.06, cx + r + 0.06, cy + r + 0.06], f: (ctx, sv) => {
      // Ein Weltkreis wird um sqrt(2) breiter als die bisherigen Bildschirmellipsen.
      // Mantel, Sockel, Fugen, Scharten und Dach müssen dieselbe Projektion nutzen.
      const rx = rr => rr * Math.SQRT2 * I.TW, ry = rr => rr * Math.SQRT2 * I.TH;
      const surface = (a, rr, z) => I.p(cx + Math.cos(a - Math.PI / 4) * rr, cy + Math.sin(a - Math.PI / 4) * rr, z);
      const cylinder = (z, rr, height, color, options) => I.cylinder(ctx, cx, cy, z, rr * Math.SQRT2, height, color, options);
      const baseArcs = this.towerBaseLayer(ctx,cx,cy,r+.06,t/2+.06,0,zs,M.sockel,r+.03,t/2+.02);
      this.towerBaseLayer(ctx,cx,cy,r+.06,t/2+.06,0,.10,'#555149');
      // Fieldstones follow the cylinder surface, including its foreshortening.
      // Screen-space ellipses spill past the silhouette onto adjoining walls.
      for (let a = 0.1; a < Math.PI; a += 0.32) {
        const z = 0.09 + ((a * 7) | 0) % 3 * 0.085;
        const halfAngle = Math.min(.14, a - .015, Math.PI - .015 - a);
        if (!baseArcs.some(([lo,hi])=>a-halfAngle>=lo && a+halfAngle<=hi)) continue;
        const stone = [];
        for (let j = 0; j < 10; j++) {
          const q = j / 10 * Math.PI * 2, angle = a + Math.cos(q) * halfAngle;
          stone.push([cx + Math.cos(angle - Math.PI / 4) * (r + .06), cy + Math.sin(angle - Math.PI / 4) * (r + .06), z + Math.sin(q) * .055]);
        }
        I.poly(ctx, stone, ((a * 13) | 0) % 2 ? 'rgba(205,200,188,0.28)' : 'rgba(150,146,136,0.3)');
      }
      this.towerBaseLayer(ctx,cx,cy,r+.03,t/2+.02,zs-.04,.05,M.kante,r,t/2);
      cylinder(zs, r, hh - zs, M.ziegel, { noTop: true });
      for (let z = zs + 0.075; z < hh; z += 0.075) { const P = I.p(cx, cy, z); ctx.strokeStyle = 'rgba(238,220,196,0.15)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.ellipse(P[0], P[1], rx(r), ry(r), 0, 0, Math.PI); ctx.stroke(); const off = ((z / 0.075) | 0) % 2 ? 0.28 : 0; if (((z / 0.075) | 0) % 2 === 0) for (let a = 0.15 + off; a < Math.PI; a += 0.56) { const Q = surface(a, r, z); ctx.strokeStyle = 'rgba(60,28,18,0.22)'; ctx.beginPath(); ctx.moveTo(Q[0], Q[1]); ctx.lineTo(Q[0], Q[1] + 0.075 * I.ZS); ctx.stroke(); } }
      for (const [a, z] of [[0.9, hh * 0.4], [1.6, hh * 0.62], [0.5, hh * 0.78], [2.3, hh * 0.5]]) { const Q = surface(a, r * 0.998, z); ctx.fillStyle = 'rgba(230,215,190,0.28)'; ctx.fillRect(Q[0] - 2.2, Q[1] - 9, 4.4, 10); ctx.fillStyle = '#2e2521'; ctx.fillRect(Q[0] - 0.9, Q[1] - 8.5, 1.8, 9); }
      cylinder(hh, r + 0.09, 0.16, M.kante, {}); cylinder(hh + 0.16, r + 0.09, 0.1, M.sockelTop, {});
      for (let a = 0; a < 6.28; a += 0.55) { const px = cx + Math.cos(a) * (r + 0.02), py = cy + Math.sin(a) * (r + 0.02); if (px + py > cx + cy - 0.15) I.box(ctx, px - 0.07, py - 0.07, hh + 0.26, 0.14, 0.14, 0.2, { wall: M.ziegel, top: M.kante }, { stroke: 'rgba(0,0,0,0.35)' }); }
      I.cone(ctx, cx, cy, hh + 0.42, (r + 0.02) * Math.SQRT2, 1.15, this.season() === 'winter' ? '#e6eaee' : '#574e42');
      const T = I.p(cx, cy, hh + 1.57), B = I.p(cx, cy, hh + 0.42); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.6; for (let a = 0.2; a < Math.PI; a += 0.5) { ctx.beginPath(); ctx.moveTo(T[0], T[1]); ctx.lineTo(B[0] + Math.cos(a) * rx(r + 0.02), B[1] + Math.sin(a) * ry(r + 0.02)); ctx.stroke(); }
      I.line(ctx, [cx, cy, hh + 1.57], [cx, cy, hh + 2.05], '#62472c', 1.2); this.pennant(ctx, cx, cy, hh + 2.05, 0.5, 0.22, ['#c8102e'], true);
    } });
    for (const [cx, cy, r, hh] of Wd.towers) tower(cx, cy, r, hh, cx + cy + r + 0.6);
    return segs;
  },
  /* Lage eines Tors: Mittelpunkt auf der Mauerlinie, Außenrichtung d, Richtung entlang der Mauer s, Durchfahrtbreite */
  gateSpec(g) {
    const Wd = HK.WALL, A = Wd.pts[g.seg], B = Wd.pts[g.seg + 1], dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy), dir = [dx / len, dy / len];
    const d = [dir[1], -dir[0]];
    const cx = Math.abs(dir[0]) > Math.abs(dir[1]) ? g.at : A[0], cy = Math.abs(dir[0]) > Math.abs(dir[1]) ? A[1] : g.at;
    return { cx, cy, d, s: dir, pw: g.pw || 0.9, moat: Wd.moat };
  },
  /* Torhaus mit Zugbrücke und Vorwerk. Beide Tore stehen achsparallel, darum genügen Kästen.
     u zählt von der Mauerlinie nach außen, v entlang der Mauer. */
  gateParts(sp) {
    return this.drawGatehouse(null, sp, this.shadowVec(), 'layout').map(p => ({ ...p, k: p.k ?? p.box[2] + p.box[3] }));
  },
  drawGatehouse(ctx, sp, sv, part) {
    const M = this.MAUER, zs = M.sockelH, h = HK.WALL.h, pw = sp.pw, d = sp.d, s = sp.s, pk = this.picking, winter = this.season() === 'winter';
    const R = (u0, u1, v0, v1) => {                       // Rechteck (u,v) → achsparalleles Rechteck (x,y,w,d)
      const xs = [sp.cx + d[0] * u0 + s[0] * v0, sp.cx + d[0] * u1 + s[0] * v1], ys = [sp.cy + d[1] * u0 + s[1] * v0, sp.cy + d[1] * u1 + s[1] * v1];
      return { x: Math.min(...xs), y: Math.min(...ys), w: Math.abs(xs[1] - xs[0]), d: Math.abs(ys[1] - ys[0]) };
    };
    const P = (u, v, z) => [sp.cx + d[0] * u + s[0] * v, sp.cy + d[1] * u + s[1] * v, z];
    const box = (r, z0, hh, col, o) => I.box(ctx, r.x, r.y, z0, r.w, r.d, hh, col, o || {});
    const brick = (r, z0, hh) => { box(r, z0, hh, { wall: M.ziegel, top: M.ziegelTop }, { stroke: 'rgba(0,0,0,0)' }); this.ziegelFace(ctx, [r.x, r.y + r.d], [r.x + r.w, r.y + r.d], z0, hh); this.ziegelFace(ctx, [r.x + r.w, r.y], [r.x + r.w, r.y + r.d], z0, hh); };
    const sockel = (r, hh) => { box(r, 0, hh, { wall: M.sockel, top: M.sockelTop }, { stroke: 'rgba(0,0,0,0)', noTop: true }); this.feldsteinFace(ctx, [r.x, r.y + r.d], [r.x + r.w, r.y + r.d], 0, hh); this.feldsteinFace(ctx, [r.x + r.w, r.y], [r.x + r.w, r.y + r.d], 0, hh); };
    const zinnen = (r, z0) => { box({ x: r.x - 0.03, y: r.y - 0.03, w: r.w + 0.06, d: r.d + 0.06 }, z0, 0.1, { wall: M.kante, top: M.kante }); for (let u = 0.03; u + 0.22 <= r.w; u += 0.4) { box({ x: r.x + u, y: r.y + r.d - 0.14, w: 0.22, d: 0.14 }, z0 + 0.1, 0.3, { wall: M.ziegel, top: M.kante }, { stroke: 'rgba(0,0,0,0.35)' }); box({ x: r.x + u, y: r.y, w: 0.22, d: 0.14 }, z0 + 0.1, 0.3, { wall: M.ziegel, top: M.kante }, { stroke: 'rgba(0,0,0,0.35)' }); } for (let v = 0.03; v + 0.22 <= r.d; v += 0.4) { box({ x: r.x + r.w - 0.14, y: r.y + v, w: 0.14, d: 0.22 }, z0 + 0.1, 0.3, { wall: M.ziegel, top: M.kante }, { stroke: 'rgba(0,0,0,0.35)' }); box({ x: r.x, y: r.y + v, w: 0.14, d: 0.22 }, z0 + 0.1, 0.3, { wall: M.ziegel, top: M.kante }, { stroke: 'rgba(0,0,0,0.35)' }); } };
    const dach = (r, z0, rh) => I.pyramid(ctx, r.x + 0.06, r.y + 0.06, z0, r.w - 0.12, r.d - 0.12, rh, winter ? '#e6eaee' : '#574e42');
    const tw = 0.95, TH = h + 1.1, u0 = -0.55, u1 = 0.45;
    if (part === undefined || part === 'house') I.shadow(ctx, R(u0, u1, -pw / 2 - 0.1 - tw, pw / 2 + 0.1 + tw).x, R(u0, u1, -pw / 2 - 0.1 - tw, pw / 2 + 0.1 + tw).y, Math.abs(u1 - u0) * Math.abs(d[0]) + (pw + 0.2 + 2 * tw) * Math.abs(s[0]), Math.abs(u1 - u0) * Math.abs(d[1]) + (pw + 0.2 + 2 * tw) * Math.abs(s[1]), TH, sv.v, sv.a);

    /* Zugbrücke über den Graben: Bohlen auf zwei Balken, Ketten zum Torhaus */
    const bA = 0.45, bE = sp.moat.d1 + 0.25;
    const deck = R(bA, bE, -pw / 2 - 0.08, pw / 2 + 0.08);
    if (part === undefined || part === 'bridge') {
    box(deck, 0.02, 0.07, { wall: '#5f452f', top: '#8a6845' }, { stroke: 'rgba(0,0,0,0)' });
    for (let u = bA + 0.12; u < bE; u += 0.16) I.line(ctx, P(u, -pw / 2 - 0.08, 0.095), P(u, pw / 2 + 0.08, 0.095), 'rgba(40,25,12,0.35)', 0.6);
    for (const v of [-pw / 2 - 0.02, pw / 2 + 0.02]) I.line(ctx, P(bA, v, 0.1), P(bE, v, 0.1), '#4e3722', 1.6);
    }
    if (part === 'bridge') return;
    /* Vorwerk auf dem Außenufer: niedrige Zwingermauer mit zwei Rundtürmchen am Vortor */
    const vA = bE - 0.1, vE = bE + 1.5, vw = pw / 2 + 1.05, mt = 0.26, mh = 0.8;
    // Auch die Stirnmauern des Vorwerks enden an der Turmrundung.
    const frontWall = (sign, radius, halfWidth) => {
      const cut = pw / 2 + 0.42 + Math.sqrt(radius * radius - halfWidth * halfWidth);
      return R(vE - mt / 2 - halfWidth, vE - mt / 2 + halfWidth, sign > 0 ? cut : -vw - halfWidth + mt / 2, sign > 0 ? vw + halfWidth - mt / 2 : -cut);
    };
    const vorwerk = [R(vA, vE, -vw - mt, -vw), R(vA, vE, vw, vw + mt), frontWall(-1, 0.27, mt / 2), frontWall(1, 0.27, mt / 2)];
    const teile = vorwerk.map((r, i) => ({ box: [r.x, r.y, r.x + r.w, r.y + r.d], k: r.x + r.w + r.y + r.d, f: () => {
      const foot = i < 2 ? r : frontWall(i === 2 ? -1 : 1, 0.3, mt / 2);
      const crown = i < 2 ? { x: r.x - 0.02, y: r.y - 0.02, w: r.w + 0.04, d: r.d + 0.04 } : frontWall(i === 2 ? -1 : 1, 0.27, mt / 2 + 0.02);
      box(foot, 0, 0.22, { wall: M.sockel, top: M.sockelTop }, { stroke: 'rgba(0,0,0,0)', noTop: true }); brick(r, 0.22, mh - 0.22);
      box(crown, mh, 0.06, { wall: M.kante, top: M.kante });
      for (let q = 0.05; q + 0.16 <= Math.max(r.w, r.d); q += 0.34) { const rr = r.w > r.d ? { x: r.x + q, y: r.y, w: 0.16, d: r.d } : { x: r.x, y: r.y + q, w: r.w, d: 0.16 }; box(rr, mh + 0.06, 0.2, { wall: M.ziegel, top: M.kante }, { stroke: 'rgba(0,0,0,0.3)' }); }
    } }));
    for (const v of [-pw / 2 - 0.42, pw / 2 + 0.42]) { const c = P(vE - 0.13, v, 0); teile.push({ box: [c[0] - 0.34, c[1] - 0.34, c[0] + 0.34, c[1] + 0.34], k: c[0] + c[1] + 0.3, f: () => { I.cylinder(ctx, c[0], c[1], 0, 0.3 * Math.SQRT2, 0.22, M.sockel, { noTop: true }); I.cylinder(ctx, c[0], c[1], 0.22, 0.27 * Math.SQRT2, 1.05, M.ziegel, { noTop: true }); I.cylinder(ctx, c[0], c[1], 1.27, 0.33 * Math.SQRT2, 0.1, M.kante, {}); I.cone(ctx, c[0], c[1], 1.37, 0.34 * Math.SQRT2, 0.62, winter ? '#e6eaee' : '#574e42'); } }); }
    // Torbogen des Vortors: dunkle Öffnung in der Stirnmauer beidseits der Durchfahrt (die Durchfahrt selbst ist frei)
    if (part === 'layout') {
      const house = R(u0 - 0.05, u1 + 0.05, -pw / 2 - 0.15 - tw, pw / 2 + 0.15 + tw);
      return [{ part: 'bridge', flat: true, box: [deck.x, deck.y, deck.x + deck.w, deck.y + deck.d] }, ...teile.map((p, i) => ({ part: i, box: p.box, k: p.k })), { part: 'house', box: [house.x, house.y, house.x + house.w, house.y + house.d] }];
    }
    if (typeof part === 'number') { teile[part].f(); return; }
    if (part === undefined) { teile.sort((a, b) => a.k - b.k); for (const tl of teile) tl.f(); }
    if (!pk && part === undefined) { const lp = P(vE, 0, 0.9); this.lamps.push([...I.p(lp[0], lp[1], lp[2]), 'gate']); }

    /* Torhaus: zwei Flankentürme, dazwischen der Torbau mit Durchfahrt, Fallgatter, Stadtwappen und Satteldach */
    const tL = R(u0, u1, -pw / 2 - 0.1 - tw, -pw / 2 - 0.1), tR = R(u0, u1, pw / 2 + 0.1, pw / 2 + 0.1 + tw), mid = R(u0 + 0.05, u1, -pw / 2 - 0.12, pw / 2 + 0.12);
    const turm = r => { sockel({ x: r.x - 0.05, y: r.y - 0.05, w: r.w + 0.1, d: r.d + 0.1 }, zs); box({ x: r.x - 0.03, y: r.y - 0.03, w: r.w + 0.06, d: r.d + 0.06 }, zs - 0.04, 0.05, { wall: M.kante, top: M.kante }); brick(r, zs, TH - zs); box({ x: r.x - 0.03, y: r.y - 0.03, w: r.w + 0.06, d: r.d + 0.06 }, TH - 0.08, 0.08, { wall: M.kante, top: M.kante }); zinnen(r, TH); dach(r, TH + 0.4, 0.9); };
    const [nah, fern] = (tL.x + tL.y) > (tR.x + tR.y) ? [tL, tR] : [tR, tL];
    turm(fern);
    // Torbau
    sockel({ x: mid.x - 0.03, y: mid.y - 0.03, w: mid.w + 0.06, d: mid.d + 0.06 }, zs); brick(mid, zs, h + 0.45 - zs);
    box({ x: mid.x - 0.03, y: mid.y - 0.03, w: mid.w + 0.06, d: mid.d + 0.06 }, h + 0.37, 0.08, { wall: M.kante, top: M.kante });
    { // Satteldach zwischen den Türmen, First quer zur Durchfahrt
      const z0 = h + 0.45, rh = 0.55, x0 = mid.x, x1 = mid.x + mid.w, y0 = mid.y, y1 = mid.y + mid.d, col = winter ? '#e6eaee' : '#574e42';
      if (Math.abs(d[0]) > 0.5) { const mx = (x0 + x1) / 2; I.poly(ctx, [[x0, y0, z0], [x0, y1, z0], [mx, y1, z0 + rh], [mx, y0, z0 + rh]], I.shade(col, 0.86)); I.poly(ctx, [[x1, y0, z0], [x1, y1, z0], [mx, y1, z0 + rh], [mx, y0, z0 + rh]], I.shade(col, 1.0), 'rgba(52,38,22,0.28)'); I.poly(ctx, [[x0, y1, z0], [x1, y1, z0], [mx, y1, z0 + rh]], I.shade(M.ziegel, 0.95), 'rgba(0,0,0,0.25)'); }
      else { const my = (y0 + y1) / 2; I.poly(ctx, [[x0, y0, z0], [x1, y0, z0], [x1, my, z0 + rh], [x0, my, z0 + rh]], I.shade(col, 0.86)); I.poly(ctx, [[x0, y1, z0], [x1, y1, z0], [x1, my, z0 + rh], [x0, my, z0 + rh]], I.shade(col, 1.0), 'rgba(52,38,22,0.28)'); I.poly(ctx, [[x1, y0, z0], [x1, y1, z0], [x1, my, z0 + rh]], I.shade(M.ziegel, 0.95), 'rgba(0,0,0,0.25)'); }
    }
    // Durchfahrt: Bogen auf der Außen- und der Innenseite; nur die dem Betrachter zugewandte ist sichtbar
    const bogen = (u, tief) => { const pts = [P(u, -pw / 2 + 0.05, 0), P(u, pw / 2 - 0.05, 0)]; for (let k = 0; k <= 6; k++) { const a = Math.PI * k / 6, cv = Math.cos(a) * (pw / 2 - 0.05), cz = Math.sin(a) * (pw / 2 - 0.05); pts.push(P(u, cv, 0.75 + cz)); } I.poly(ctx, pts, tief ? '#2e2521' : 'rgba(255,240,200,0.14)'); };
    const aussenSichtbar = d[0] + d[1] > 0; bogen(aussenSichtbar ? u1 + 0.003 : u0 - 0.003, true);
    if (aussenSichtbar) { // Fallgatter im Bogen, Wappen darüber, Ketten der Zugbrücke
      I.poly(ctx, [P(u1 + 0.006, -0.16, 1.62), P(u1 + 0.006, 0.16, 1.62), P(u1 + 0.006, 0.16, 1.44), P(u1 + 0.006, -0.16, 1.44)], '#c8102e'); I.poly(ctx, [P(u1 + 0.006, -0.16, 1.44), P(u1 + 0.006, 0.16, 1.44), P(u1 + 0.006, 0.16, 1.28), P(u1 + 0.006, -0.16, 1.28)], '#f0ece0');
      for (const v of [-pw / 2 - 0.02, pw / 2 + 0.02]) { const m = P((u1 + bE) / 2, v, 0.55); I.line(ctx, P(u1, v, 1.55), [m[0], m[1], m[2]], 'rgba(50,45,40,0.85)', 1.1); I.line(ctx, [m[0], m[1], m[2]], P(bE, v, 0.1), 'rgba(50,45,40,0.85)', 1.1); }
      if (!pk) { const l1 = P(u1 + 0.05, -pw / 2 - 0.35, 0.95), l2 = P(u1 + 0.05, pw / 2 + 0.35, 0.95); this.lamps.push([...I.p(...l1), 'gate'], [...I.p(...l2), 'gate']); }
    }
    turm(nah);
    if (part === undefined) this.drawGateGrille(ctx, sp, this.gateOpening(sp));
  },
  // Clip the moving ironwork analytically to the arch. The bars disappear
  // into the masonry as they rise; this also works in the retained Pixi context.
  drawGateGrille(ctx, sp, opening) {
    if (this.picking) return;
    const outside=sp.d[0]+sp.d[1]>0,u=outside?.456:-.556;
    const P=(v,z)=>[sp.cx+sp.d[0]*u+sp.s[0]*v,sp.cy+sp.d[1]*u+sp.s[1]*v,z];
    const radius=sp.pw/2-.05,lift=opening*1.3;
    for(let v=-radius+.08;v<radius;v+=.16){
      const top=.75+Math.sqrt(Math.max(0,radius*radius-v*v)),bottom=.02+lift;
      if(bottom<top)I.line(ctx,P(v,bottom),P(v,top),'#9b9582',.85);
    }
    for(let z=.2;z<1.22;z+=.2){
      const raised=z+lift;if(raised>=.75+radius)continue;
      const half=raised<=.75?radius:Math.sqrt(Math.max(0,radius*radius-(raised-.75)**2));
      I.line(ctx,P(-half,raised),P(half,raised),'#827c6c',.95);
    }
  },
  drawMole(ctx, sv) {
    const m = HK.MOLE;
    /* Die Mole ist aus demselben Stein wie die Kaimauer, aus der sie wächst: ihre Flanken laufen
       durch dieselbe Mauerroutine, bekommen also Quaderlagen, Deckstein, nassen Fuß und Algensaum.
       Ihre Landkante folgt dem schrägen Uferverlauf, damit sie mit der Mauerkrone zusammenfällt. */
    const S = HK.Scene, deckZ = 0;
    const yA = S.uferY(m.x), yB = S.uferY(m.x + m.w);
    const kx0 = m.x - 0.28, kx1 = m.x + m.w + 0.28, ky0 = m.y1 - 1.25;
    const zuf = u => { const r = Math.sin(u * 12.9898) * 43758.5453; return r - Math.floor(r); };

    /* Deck aus Pflastersteinen. Die Landkante verläuft schräg, darum wird jede Reihe auf den
       Umriss beschnitten; sonst ragten die Platten an der Wurzel über den Rand hinaus. */
    const rand = x => yA + (yB - yA) * (x - m.x) / m.w;      // Uferlinie über die Breite
    I.poly(ctx, [[m.x, yA, deckZ], [m.x + m.w, yB, deckZ], [m.x + m.w, m.y1, deckZ], [m.x, m.y1, deckZ]], '#837d72');
    const reihen = 3;
    for (let y = m.y1; y > Math.min(yA, yB); y -= 0.46) {
      const y2 = y - 0.46;
      for (let k = 0; k < reihen; k++) {
        const a = m.x + m.w * k / reihen, b = m.x + m.w * (k + 1) / reihen;
        const ra = rand(a), rb = rand(b);
        const ya = Math.max(y2, ra), yb = Math.max(y2, rb);
        if (ya >= y - 0.02 && yb >= y - 0.02) continue;        // ganz außerhalb
        const t = zuf(a * 5.1 + y * 7.3 + k * 2.9);
        I.poly(ctx, [[a, ya, deckZ], [b, yb, deckZ], [b, y, deckZ], [a, y, deckZ]], I.shade('#8b8479', 0.94 + t * 0.15), 'rgba(40,34,26,0.16)');
      }
    }
    // Flanke zum Wasser: dasselbe Quaderwerk wie an der Kaimauer
    S.drawQuayWall(ctx, [m.x + m.w, yB], [m.x + m.w, m.y1], [1, 0], m.y1 - yB);

    /* Molenkopf: die verbreiterte Plattform, auf der der Leuchtturm steht — Deck und zwei Mauerseiten */
    I.poly(ctx, [[kx0, ky0, deckZ], [kx1, ky0, deckZ], [kx1, m.y1, deckZ], [kx0, m.y1, deckZ]], '#837d72');
    for (let y = m.y1; y > ky0 + 0.01; y -= 0.46) {
      const y2 = Math.max(ky0, y - 0.46);
      for (let k = 0; k < 4; k++) {
        const a = kx0 + (kx1 - kx0) * k / 4, b = kx0 + (kx1 - kx0) * (k + 1) / 4;
        const t = zuf(a * 3.7 + y * 9.1 + k * 1.3);
        I.poly(ctx, [[a, y2, deckZ], [b, y2, deckZ], [b, y, deckZ], [a, y, deckZ]], I.shade('#8b8479', 0.95 + t * 0.14), 'rgba(40,34,26,0.16)');
      }
    }
    S.drawQuayWall(ctx, [kx1, ky0], [kx1, m.y1], [1, 0], m.y1 - ky0);
    S.drawQuayWall(ctx, [kx0, m.y1], [kx1, m.y1], [0, 1], kx1 - kx0);
  },
  drawLighthouse(ctx) {
    // Separate from the walkable deck so people can pass in front of the tower.
    const L=HK.LIGHTHOUSE,lz=0;
    I.cylinder(ctx, L.x, L.y, lz, L.r, L.h, '#8f887a', { brick: true, noTop: true }); I.cylinder(ctx, L.x, L.y, lz + L.h, L.r + 0.08, 0.15, '#686357', {});
    I.cylinder(ctx, L.x, L.y, lz + L.h + 0.15, L.r * 0.6, 0.35, '#554c46', { noTop: true }); I.cone(ctx, L.x, L.y, lz + L.h + 0.5, L.r * 0.7, 0.45, '#574e42');
    /* Das Fenster gehört auf den runden Schaft, nicht auf eine gedachte ebene Wand. Ein Wandfenster
       liegt in der Ebene x = konstant und zeigt darum nach rechts unten; der Schaft zeigt an dieser
       Stelle aber zum Betrachter, und das Fenster stand schief darauf. Es wird deshalb in
       Bildkoordinaten auf die zugewandte Rundung gesetzt — so tragen auch die Mauertürme ihre
       Schießscharten. */
    {
      const rx = L.r * I.TW, ry = L.r * I.TH;
      const M = I.p(L.x, L.y, lz + 0.95);
      const fx = M[0], fy = M[1] + ry * 0.6;          // Sohlbankhöhe, auf die vordere Rundung gerückt
      const bw = rx * 0.24, bh = 0.4 * I.ZS;          // halbe Breite und Höhe der Öffnung
      const bogen = (w, h, dy) => {                   // Öffnung mit halbrundem Sturz
        ctx.beginPath();
        ctx.moveTo(fx - w, fy + dy);
        ctx.lineTo(fx - w, fy + dy - h + w);
        ctx.arc(fx, fy + dy - h + w, w, Math.PI, 0);
        ctx.lineTo(fx + w, fy + dy);
        ctx.closePath();
      };
      bogen(bw + 2.1, bh + 2.4, 1.5);                 // Gewände aus hellerem Stein
      ctx.fillStyle = I.shade('#8f887a', 1.12); ctx.fill();
      ctx.strokeStyle = 'rgba(42,36,28,0.32)'; ctx.lineWidth = 0.7; ctx.stroke();
      const nacht = this.light() < 0.8;
      bogen(bw, bh, 0);                               // die Öffnung selbst
      ctx.fillStyle = nacht ? 'rgba(232,172,92,0.85)' : '#2b2721'; ctx.fill();
      ctx.fillStyle = I.shade('#8f887a', 0.9);        // Sohlbank
      ctx.fillRect(fx - bw - 2.6, fy + 1.4, (bw + 2.6) * 2, 1.7);
    }
    if (this.light() < 0.8) { const p = I.p(L.x, L.y, lz + L.h + 0.32); ctx.fillStyle = 'rgba(255,175,70,0.85)'; ctx.beginPath(); ctx.arc(p[0], p[1], 3, 0, 6.28); ctx.fill(); this.lamps.push([p[0], p[1], 'beacon']); }
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
    this.drawWindmillShadow(ctx, sv);
    this.drawWindmillBody(ctx, sv);
    this.drawWindmillRotor(ctx, t * this.MILL_SPEED);
  },
  MILL_SPEED: 0.22, // Havenrodes ruhiger Lauf: knapp 29 Sekunden je Umdrehung
  windmillHub() { const m = HK.WINDMILL; return I.p(m.x + 0.3, m.y + 0.3, 2.15); },
  windmillBox() { const m = HK.WINDMILL; return [m.x - 0.8, m.y - 0.55, m.x + 0.55, m.y + 0.95]; },
  drawWindmillShadow(ctx, sv) {
    if (this.picking) return;
    const m = HK.WINDMILL, points = [];
    for (const [z, r] of [[0, 0.49], [2.08, 0.4], [2.7, 0]]) for (let i = 0; i < 24; i++) {
      const a = i * Math.PI / 12;
      points.push(I.p(m.x + Math.cos(a) * r + sv.v[0] * z, m.y + Math.sin(a) * r + sv.v[1] * z, 0));
    }
    const hull = I.hull(points);
    ctx.beginPath(); hull.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath();
    ctx.fillStyle = `rgba(15,10,5,${sv.a})`; ctx.fill();
  },
  drawWindmillBody(ctx, sv) {
    // Turmmühle aus dem Hafen-Referenzbild: verjüngter Steinmantel mit
    // dunkler Haube. Runde Grundrisse werden vollständig in der Welt projiziert.
    const m = HK.WINDMILL, baseZ = 0.12, topZ = 2.08;
    I.cylinder(ctx, m.x, m.y, 0, 0.49 * Math.SQRT2, baseZ, '#837c6d', {});
    const radius = z => 0.47 + (0.32 - 0.47) * (z - baseZ) / (topZ - baseZ);
    const point = (a, z) => [m.x + Math.cos(a) * radius(z), m.y + Math.sin(a) * radius(z), z];
    for (let i = 0; i < 24; i++) {
      const a = -Math.PI / 4 + i * Math.PI / 24, b = a + Math.PI / 24, light = 0.9 + 0.15 * Math.cos((a + b) / 2 + 0.5);
      I.poly(ctx, [point(a, baseZ), point(b, baseZ), point(b, topZ), point(a, topZ)], I.shade('#b4a287', light));
    }
    // Leise Steinlagen folgen der Rundung und der Verjüngung des Turms.
    ctx.strokeStyle = 'rgba(79,65,47,0.22)'; ctx.lineWidth = 0.5;
    for (let z = 0.25, row = 0; z < topZ; z += 0.14, row++) {
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const p = I.p(...point(-Math.PI / 4 + i * Math.PI / 24, z));
        i ? ctx.lineTo(...p) : ctx.moveTo(...p);
      }
      ctx.stroke();
      for (let a = -Math.PI / 4 + 0.17 + (row % 2) * 0.19; a < Math.PI * 3 / 4; a += 0.38) I.line(ctx, point(a, z - 0.12), point(a, z), 'rgba(86,72,54,0.17)', 0.45);
    }
    I.cylinder(ctx, m.x, m.y, topZ - 0.045, 0.345 * Math.SQRT2, 0.09, '#756a58', {});
    I.cone(ctx, m.x, m.y, topZ + 0.045, 0.4 * Math.SQRT2, 0.58, '#5c544a');
    for (const a of [0, Math.PI / 6, Math.PI / 3, Math.PI / 2]) I.line(ctx, [m.x, m.y, topZ + 0.625], [m.x + Math.cos(a) * 0.4, m.y + Math.sin(a) * 0.4, topZ + 0.045], 'rgba(38,33,27,0.28)', 0.5);
    // Öffnungen auf der dem Betrachter zugewandten Rundung.
    const opening = (z, width, height, fill) => {
      const r = radius(z), p = I.p(m.x + r / Math.SQRT2, m.y + r / Math.SQRT2, z);
      ctx.beginPath(); ctx.moveTo(p[0] - width, p[1]); ctx.lineTo(p[0] - width, p[1] - height + width);
      ctx.arc(p[0], p[1] - height + width, width, Math.PI, 0); ctx.lineTo(p[0] + width, p[1]); ctx.closePath();
      ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = '#91836d'; ctx.lineWidth = 1; ctx.stroke();
      return p;
    };
    const door = opening(0.05, 3.9, 15.5, '#5d4a35');
    ctx.strokeStyle = '#79634a'; ctx.lineWidth = 0.6;
    for (const off of [-1.6, 1.1]) { ctx.beginPath(); ctx.moveTo(door[0] + off, door[1] - 1); ctx.lineTo(door[0] + off, door[1] - 11); ctx.stroke(); }
    opening(1.27, 1.8, 5.5, '#48473d');
    I.line(ctx, [m.x + 0.19, m.y + 0.19, 2.15], [m.x + 0.3, m.y + 0.3, 2.15], '#6d573c', 2.5);
  },
  // Kreisförmige Segelflügel in Havenrodes Bildebene. Pixi kann diese fertige
  // Geometrie um die Nabe drehen, ohne den Baukörper oder die Flügel neu aufzubauen.
  drawWindmillRotor(ctx, angle) {
    const hub = this.windmillHub();
    for (let k = 0; k < 4; k++) {
      const a = angle + k * Math.PI / 2, dx = Math.cos(a), dy = Math.sin(a), px = -dy, py = dx;
      const p = (r, w = 0) => [hub[0] + dx * r + px * w, hub[1] + dy * r + py * w];
      ctx.strokeStyle = '#755b3c'; ctx.lineWidth = 2.3;
      ctx.beginPath(); ctx.moveTo(...hub); ctx.lineTo(...p(41)); ctx.stroke();
      ctx.fillStyle = '#c9bc93'; ctx.beginPath(); ctx.moveTo(...p(13.5)); ctx.lineTo(...p(38.6)); ctx.lineTo(...p(38.6, 7.1)); ctx.lineTo(...p(13.5, 7.1)); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(117,91,60,0.46)'; ctx.lineWidth = 0.45;
      for (const r of [18, 24, 30, 36]) { ctx.beginPath(); ctx.moveTo(...p(r)); ctx.lineTo(...p(r, 7.1)); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(...p(13.5, 7.1)); ctx.lineTo(...p(39.5, 7.1)); ctx.stroke();
    }
    ctx.fillStyle = '#755b3c'; ctx.beginPath(); ctx.arc(hub[0], hub[1], 2.3, 0, Math.PI * 2); ctx.fill();
  },
  drawFarm(ctx, season, sv, farm) { const f = farm || HK.FARM; this.drawHouse(ctx, { x: f.x, y: f.y, w: f.w, d: f.d, h: f.h || 0.85, wall: farm ? '#bfae86' : '#c3b189', roof: '#9a8352', thatchLine: true }, HK.state, season, sv, false); for (let u = 0; u < 1.6; u += 0.18) I.line(ctx, [f.x - 0.4 + u, f.y + f.d + 0.5, 0], [f.x - 0.4 + u, f.y + f.d + 0.5, 0.2], '#7e5934', 1); I.line(ctx, [f.x - 0.4, f.y + f.d + 0.5, 0.15], [f.x + 1.2, f.y + f.d + 0.5, 0.15], '#7e5934', 1); if (!HK.ruralInit) for (const [sx, sy] of [[f.x + 0.2, f.y + f.d + 0.25], [f.x + 0.6, f.y + f.d + 0.3], [f.x + 1.0, f.y + f.d + 0.2]]) { const p = I.p(sx, sy, 0); ctx.fillStyle = '#f0ece0'; ctx.beginPath(); ctx.ellipse(p[0], p[1] - 2, 3.5, 2.5, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = '#554646'; ctx.fillRect(p[0] + 2.5, p[1] - 3.5, 2, 2); } },
  /* Bündiger Eichenanleger: Querbohlen auf Längsträgern und verstrebten Pfählen.
     Alle Holzdetails liegen in Weltkoordinaten, damit die Maserung mitläuft. */
  drawPier(ctx, p, t) {
    const h = (p.w || 0.6) / 2, x0 = p.x - h, x1 = p.x + h, z = this.DECK_Z;
    const tone = v => this.steinTon(p.x * 7.3 + v * 13.7);
    const postRows = [];
    for (let y = p.y0 + 0.4; y < p.y1 - 0.15; y += 0.85) postRows.push(y);
    if (!postRows.length || p.y1 - postRows[postRows.length - 1] > 0.4) postRows.push(p.y1 - 0.2);
    const xs = [x0 + 0.13, p.x, x1 - 0.13];
    for (const y of postRows) {
      for (const px of xs) {
        I.cylinder(ctx, px, y, this.WATER_Z, 0.065 * Math.SQRT2, z - 0.09 - this.WATER_Z, '#645a49', { noTop: true });
        I.cylinder(ctx, px, y, this.WATER_Z, 0.067 * Math.SQRT2, 0.1, '#465047', { noTop: true });
      }
      // Querriegel sitzen unter den Bohlen; schräge Streben tragen die Randträger.
      I.box(ctx, x0 + 0.05, y - 0.08, z - 0.29, x1 - x0 - 0.1, 0.16, 0.18, { wall: '#736550', top: '#8b7960' });
      for (let i = 0; i < xs.length - 1; i++) {
        const a = [xs[i], y, this.WATER_Z + 0.06], b = [xs[i + 1], y, z - 0.24];
        I.poly(ctx, [[a[0], a[1], a[2] - 0.035], [b[0], b[1], b[2] - 0.035], [b[0], b[1], b[2] + 0.035], [a[0], a[1], a[2] + 0.035]], '#786951', 'rgba(40,34,26,0.28)', 0.45);
      }
    }
    for (const px of [x0, x1 - 0.16]) I.box(ctx, px, p.y0, z - 0.23, 0.16, p.y1 - p.y0, 0.23, { wall: '#786b55', top: '#97866b' });
    I.box(ctx, x0, p.y1 - 0.17, z - 0.23, x1 - x0, 0.17, 0.23, { wall: '#807159', top: '#97866b' });
    // Dunkle Fugen zwischen breiten, leicht verschieden gealterten Bohlen.
    I.poly(ctx, [[x0, p.y0, z], [x1, p.y0, z], [x1, p.y1, z], [x0, p.y1, z]], '#625a49');
    let row = 0;
    for (let y = p.y0; y < p.y1 - 1e-8; y += 0.21, row++) {
      const end = Math.min(p.y1, y + 0.21), lo = y === p.y0 ? y : y + 0.009, hi = end === p.y1 ? end : end - 0.006;
      // Versetzte Stoßfugen statt eines aufgeklebten Bildschirmrasters.
      const cut = x0 + (x1 - x0) * (row % 3 === 0 ? 0.38 : 0.64), parts = row % 3 === 1 ? [[x0, x1]] : [[x0, cut - 0.007], [cut + 0.007, x1]];
      for (const [a, b] of parts) {
        I.poly(ctx, [[a, lo, z], [b, lo, z], [b, hi, z], [a, hi, z]], I.shade('#95846b', 0.94 + tone(row + a) * 0.14));
        I.line(ctx, [a + 0.015, lo + 0.012, z], [b - 0.015, lo + 0.012, z], 'rgba(226,215,187,0.22)', 0.45);
        for (let grain = 0; grain < 2; grain++) {
          const gy = lo + (hi - lo) * (0.3 + grain * 0.38), inset = (b - a) * (0.07 + tone(row * 3 + grain) * 0.15);
          I.line(ctx, [a + inset, gy, z], [b - inset * 0.6, gy + (tone(row + grain + 19) - 0.5) * 0.015, z], 'rgba(62,53,38,0.14)', 0.4);
        }
        for (const px of [x0 + 0.12, p.x, x1 - 0.12]) if (px > a + 0.025 && px < b - 0.025) {
          I.line(ctx, [px - 0.01, lo + 0.045, z], [px + 0.01, lo + 0.045, z], '#574f41', 0.9);
        }
      }
    }
    // Anschlussfuge zum Stein bei exakt gleicher Höhe, mit flachen Eisenlaschen.
    I.line(ctx, [x0, p.y0, z], [x1, p.y0, z], 'rgba(40,35,28,0.48)', 0.75);
    for (const px of [x0 + 0.2, x1 - 0.2]) {
      I.poly(ctx, [[px - 0.035, p.y0, z], [px + 0.035, p.y0, z], [px + 0.035, p.y0 + 0.16, z], [px - 0.035, p.y0 + 0.16, z]], '#6b685a');
      I.line(ctx, [px - 0.012, p.y0 + 0.11, z], [px + 0.012, p.y0 + 0.11, z], '#3f4038', 0.8);
    }
    // Bolzen und Endholz an den sichtbaren Randbalken.
    for (const y of postRows) {
      I.line(ctx, [x1, y - 0.025, z - 0.12], [x1, y + 0.025, z - 0.12], '#514d41', 1);
      I.line(ctx, [x1, y - 0.12, z - 0.19], [x1, y + 0.12, z - 0.19], 'rgba(47,39,27,0.2)', 0.5);
    }
  },
  /* Poller und Laterne am Kopf des Stegs */
  drawPierEnd(ctx, p, t) {
    const h = (p.w || 0.6) / 2;
    const z = this.DECK_Z;
    for (const px of [p.x - h + 0.1, p.x + h - 0.22]) I.box(ctx, px, p.y1 - 0.22, z, 0.12, 0.12, 0.2, { wall: '#4e4441', top: '#665b54' });
    I.line(ctx, [p.x, p.y1 - 0.3, z], [p.x, p.y1 - 0.3, z + 0.9], '#4e433b', 1.4);
    if (!this.picking) { const lp = I.p(p.x, p.y1 - 0.3, z + 0.9); this.lamps.push([lp[0], lp[1]]); ctx.fillStyle = '#554c46'; ctx.fillRect(lp[0] - 3, lp[1] - 3, 6, 4); }
  },
  /* Farben der Ware: erster Ton die Sonnenseite, zweiter die Schattenseite */
  CARGO_TONE: {
    grain: ['#c5ab72', '#a98f57'], salt: ['#ddd8c6', '#bdb8a4'], wool: ['#d3c6a8', '#b1a386'], spices: ['#b8905a', '#96723f'],
    beer: ['#906a3b', '#7a5a32'], wine: ['#7c443f', '#6c3733'], fish: ['#6f7f74', '#5c6a5e'], smokedfish: ['#86734d', '#76663f'],
    wax: ['#bfab63', '#a59044'], cloth: ['#8a6a9a', '#6d537c'], finecloth: ['#9c5a86', '#80476d'], furs: ['#87623e', '#765432'],
    iron: ['#7c7c86', '#61616b'], tools: ['#8d7c5c', '#76674a'], timber: ['#a67e48', '#8b6739'], leather: ['#8e6d46', '#7d5e38'],
    hemp: ['#b8b58a', '#95916a'], flax: ['#d7c495', '#b4a274'], pitch: ['#494637', '#353629'], bricks: ['#bc7757', '#99593f'],
    honey: ['#c49c54', '#a17b3b'], cheese: ['#d8bc72', '#b69a55'], rope: ['#c4a374', '#a18359'], canvas: ['#e1d7b7', '#bcb393'],
    flour: ['#e4dbc3','#bdb494'], milk: ['#dadcc5','#abb8a6'], meat: ['#b57e66','#92614e'], hides: ['#baa68a','#96866f'], stone: ['#aeb5a4','#899685'], dressedstone: ['#cecdb3','#aab6a3'], cattle: ['#b69e78','#8e7654'],
    barley: ['#cdb57e','#ad9660'], malt: ['#a5784a','#875f37'], hops: ['#a9bf74','#879d58'],
  },
  cargoTone(g) { return this.CARGO_TONE[g] || ['#9a7a4a', '#85683d']; },
  CARGO_STEP: { crate: 0.28, barrel: 0.32, sack: 0.34, livestock: 0.5 },
  /* Ein Häufchen statt eines Turms: Kisten zwei nebeneinander und eines obenauf, Säcke und Fässer nebeneinander */
  PILE: {
    crate: [[-0.15, 0, 0], [0.15, 0, 0], [0, 0, 1]],
    sack: [[-0.14, -0.05, 0], [0.14, -0.05, 0], [0, 0.22, 0]],
    barrel: [[-0.14, -0.05, 0], [0.14, -0.05, 0], [0, 0.22, 0]],
  },
  cargoHeight(kind, scale = 1) { return (this.CARGO_STEP[kind] || 0.28) * scale; },
  /* Sack: praller Leib, abgebundener Hals, Falten. Keine Ellipse mehr. */
  sack3(ctx, x, y, z, a, b, k) {
    const p = I.p(x, y, z);
    ctx.save(); ctx.translate(p[0], p[1]); ctx.scale((k || 1) * 0.85, (k || 1) * 0.72);
    ctx.fillStyle = a;
    ctx.beginPath();
    ctx.moveTo(-5.6, -1.2);
    ctx.bezierCurveTo(-6.8, -5.6, -4.4, -8.2, -2.4, -9.6);
    ctx.lineTo(2.4, -9.6);
    ctx.bezierCurveTo(4.4, -8.2, 6.8, -5.6, 5.6, -1.2);
    ctx.bezierCurveTo(3.4, 1.8, -3.4, 1.8, -5.6, -1.2);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = b;
    ctx.beginPath();
    ctx.moveTo(1.6, -9.6); ctx.bezierCurveTo(4.4, -8.2, 6.8, -5.6, 5.6, -1.2);
    ctx.bezierCurveTo(4.6, 0.6, 3.2, 1.4, 1.6, 1.8);
    ctx.bezierCurveTo(3.2, -2.4, 3.1, -6.4, 1.6, -9.6);
    ctx.fill();
    ctx.fillStyle = a;
    ctx.beginPath(); ctx.moveTo(-2.4, -9.6); ctx.quadraticCurveTo(-2.0, -12.4, -3.4, -13.4);
    ctx.lineTo(3.4, -13.4); ctx.quadraticCurveTo(2.0, -12.4, 2.4, -9.6); ctx.fill();
    ctx.strokeStyle = 'rgba(66,48,26,0.75)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-2.7, -10.1); ctx.lineTo(2.7, -10.1); ctx.stroke();
    ctx.strokeStyle = 'rgba(66,48,26,0.2)'; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(-2.6, -8.2); ctx.quadraticCurveTo(-4.2, -4.6, -3.4, -0.8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0.4, -8.4); ctx.quadraticCurveTo(-0.4, -4.4, 0.2, -0.4); ctx.stroke();
    ctx.strokeStyle = 'rgba(244,229,195,0.24)'; ctx.lineWidth = 0.5;
    for (const y of [-6, -4, -2]) { ctx.beginPath(); ctx.moveTo(-3.5, y); ctx.lineTo(2.5, y + 0.4); ctx.stroke(); }
    ctx.restore();
  },
  /* Fass in den Farben der Ware */
  barrelT(ctx, x, y, z, a, b, scale = 1) {
    const base = I.p(x, y, z), rx = 0.12 * Math.SQRT2 * I.TW, ry = 0.12 * Math.SQRT2 * I.TH, h = this.cargoHeight('barrel') * I.ZS;
    ctx.save(); ctx.translate(...base); ctx.scale(scale, scale);
    const body = () => { ctx.beginPath(); ctx.moveTo(-rx * 0.78, 0); ctx.quadraticCurveTo(-rx * 1.16, -h * 0.5, -rx * 0.78, -h); ctx.ellipse(0, -h, rx * 0.78, ry * 0.78, 0, Math.PI, 0); ctx.quadraticCurveTo(rx * 1.16, -h * 0.5, rx * 0.78, 0); ctx.ellipse(0, 0, rx * 0.78, ry * 0.78, 0, 0, Math.PI); ctx.closePath(); };
    body(); ctx.fillStyle = '#9a7a52'; ctx.fill(); ctx.strokeStyle = 'rgba(60,46,31,0.55)'; ctx.lineWidth = 0.6; ctx.stroke();
    const shade = ctx.createLinearGradient(-rx, 0, rx, 0); shade.addColorStop(0, 'rgba(238,214,168,0.22)'); shade.addColorStop(0.45, 'rgba(94,69,42,0)'); shade.addColorStop(1, 'rgba(67,49,32,0.35)'); body(); ctx.fillStyle = shade; ctx.fill();
    ctx.strokeStyle = 'rgba(74,52,30,0.45)'; ctx.lineWidth = 0.45;
    for (const f of [-0.55, -0.15, 0.3, 0.65]) { ctx.beginPath(); ctx.moveTo(rx * f * 0.78, -h); ctx.quadraticCurveTo(rx * f * 1.13, -h * 0.5, rx * f * 0.78, 0); ctx.stroke(); }
    for (const f of [0.15, 0.75]) { ctx.strokeStyle = '#666052'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(0, -h * f, rx * (0.78 + Math.sin(f * Math.PI) * 0.2), ry * 0.88, 0, 0, Math.PI); ctx.stroke(); }
    ctx.fillStyle = '#b09a74'; ctx.beginPath(); ctx.ellipse(0, -h, rx * 0.78, ry * 0.78, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#76654d'; ctx.lineWidth = 0.55; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-rx * 0.62, -h); ctx.lineTo(rx * 0.62, -h); ctx.stroke();
    ctx.fillStyle = a; ctx.beginPath(); ctx.ellipse(rx * 0.3, -h + 0.2, 0.8, 0.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  /* Kiste mit Deckelfuge und Bändern */
  crateT(ctx, x, y, z, a, b, s, heading = 0) {
    s = s || 0.28;
    const c = Math.cos(heading), sn = Math.sin(heading), P = (u, v, h) => [x + u * c - v * sn, y + u * sn + v * c, z + h];
    const base = [[-s / 2, -s / 2], [s / 2, -s / 2], [s / 2, s / 2], [-s / 2, s / 2]].map(q => P(...q, 0).slice(0, 2));
    const faces = this.prism(ctx, base, z, s, { wall: '#9a805b', top: '#b4a07b' }, { stroke: 'rgba(60,46,31,0.4)' });
    for (const f of faces) {
      const mix = (t, h) => [f.a[0] + (f.b[0] - f.a[0]) * t, f.a[1] + (f.b[1] - f.a[1]) * t, z + h];
      for (const h of [s * 0.33, s * 0.66]) I.line(ctx, mix(0, h), mix(1, h), 'rgba(68,51,32,0.32)', 0.45);
      for (const t of [0.1, 0.9]) { I.line(ctx, mix(t, 0), mix(t, s), '#89704f', 1.1); for (const h of [s * 0.13, s * 0.87]) { const p = I.p(...mix(t, h)); ctx.fillStyle = '#665e4d'; ctx.fillRect(p[0] - 0.35, p[1] - 0.35, 0.7, 0.7); } }
      I.poly(ctx, [mix(0.35, s * 0.38), mix(0.65, s * 0.38), mix(0.65, s * 0.63), mix(0.35, s * 0.63)], a);
    }
    for (const u of [-s / 6, s / 6]) I.line(ctx, P(u, -s / 2, s), P(u, s / 2, s), 'rgba(68,51,32,0.3)', 0.45);
  },
  /* Ein Stück Ware, in Form und Farbe passend zur Ware selbst */
  drawCargo(ctx, x, y, z, it, k = 1, heading = 0) {
    const t = this.cargoTone(it.good);
    if (it.kind === 'barrel') this.barrelT(ctx, x, y, z, t[0], t[1], k);
    else if (it.kind === 'sack') this.sack3(ctx, x, y, z, t[0], t[1], k);
    else this.crateT(ctx, x, y, z, t[0], this.lighten(t[0]), 0.28 * k, heading);
  },
  lighten(c) {
    const n = parseInt(c.slice(1), 16), r = Math.min(255, (n >> 16) + 26), g = Math.min(255, ((n >> 8) & 255) + 22), b = Math.min(255, (n & 255) + 16);
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  },
  /* Stapel auf dem Steg */
  drawStack(ctx, sl, sv) {
    const n = sl.items.length; if (!n) return;
    const z0 = HK.Scene.DECK_Z;
    if (!this.picking) { const sp = I.p(sl.x, sl.y + 0.04, z0); ctx.fillStyle = '#15261e28'; ctx.beginPath(); ctx.ellipse(sp[0], sp[1], 14, 6, 0, 0, 6.28); ctx.fill(); }
    for (let k = 0; k < n; k++) {
      const it = sl.items[k], pl = this.PILE[it.kind] || this.PILE.crate, p = pl[k] || pl[2];
      this.drawCargo(ctx, sl.x + p[0], sl.y + p[1], z0 + p[2] * (this.CARGO_STEP[it.kind] || 0.28), it);
    }
  },
  drawTree(ctx, x, y, r, season, sv) {
    const s = I.p(x, y, 0), R = r * 46, th = r * 30;
    if (!this.picking) { ctx.fillStyle = `rgba(15,10,5,${sv.a * 0.8})`; ctx.beginPath(); ctx.ellipse(s[0] + sv.v[0] * 14, s[1] + sv.v[1] * 8 + 2, R * 0.95, R * 0.42, 0, 0, 6.28); ctx.fill(); }
    ctx.fillStyle = '#6c4a2f'; ctx.beginPath(); ctx.moveTo(s[0] - 3, s[1] + 1); ctx.lineTo(s[0] + 3, s[1] + 1); ctx.lineTo(s[0] + 2, s[1] - th); ctx.lineTo(s[0] - 2, s[1] - th); ctx.fill();
    if (season === 'winter') { ctx.strokeStyle = '#6c4a2f'; ctx.lineWidth = 1.6; for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.3; ctx.beginPath(); ctx.moveTo(s[0], s[1] - th * 0.9); ctx.lineTo(s[0] + Math.cos(a) * R * 1.1, s[1] - th * 0.9 + Math.sin(a) * R * 1.1); ctx.stroke(); } return; }
    const pal = season === 'autumn' ? ['#7c5933', '#986e3f', '#ab8049', '#c19d68'] : ['#516242', '#5a7149', '#667e53', '#849a6c'];
    const cy = s[1] - th - R * 0.55, sway = Math.sin(this.time * 1.2 + x) * 1.2;
    const lobes = [[0, 0.05, 1], [-0.55, 0.3, 0.68], [0.55, 0.32, 0.66], [-0.3, -0.45, 0.6], [0.32, -0.42, 0.62], [0, -0.7, 0.45]];
    const blob = (k, col, off) => { ctx.fillStyle = col; ctx.beginPath(); for (const [lx, ly, lr] of lobes) ctx.arc(s[0] + sway + lx * R + (off ? off[0] * R : 0), cy + ly * R + (off ? off[1] * R : 0), lr * R * k, 0, 6.28); ctx.fill(); };
    blob(1.06, 'rgba(37,50,26,0.55)'); // Umriss
    blob(1, pal[1]);
    blob(0.78, pal[0], [0.16, 0.18]); // Schattenseite unten rechts
    blob(0.72, pal[2], [-0.12, -0.12]);
    blob(0.42, pal[3], [-0.24, -0.3]);
    ctx.fillStyle = 'rgba(25,45,15,0.35)'; for (let i = 0; i < 7; i++) { const a = i * 0.9 + x; ctx.beginPath(); ctx.arc(s[0] + sway + Math.cos(a) * R * 0.6, cy + Math.sin(a) * R * 0.5 + R * 0.1, R * 0.12, 0, 6.28); ctx.fill(); }
  },
  barrel3(ctx, x, y, z, scale = 0.88) { this.barrelT(ctx, x, y, z, '#a38d68', '#806c4d', scale); },
  crate3(ctx, x, y, z, s) { this.crateT(ctx, x + s / 2, y + s / 2, z, '#a38d68', '#b4a07b', s); },
  drawWell(ctx, p) {
    const { x, y } = p, outer = .22, inner = .16, lip = .315;
    const circle = (radius, z, color) => {
      const q = I.p(x, y, z); ctx.fillStyle = color; ctx.beginPath();
      ctx.ellipse(q[0], q[1], radius * Math.SQRT2 * I.TW, radius * Math.SQRT2 * I.TH, 0, 0, Math.PI * 2); ctx.fill();
    };
    const post = dx => I.box(ctx, x + dx - .022, y - .022, 0, .044, .044, .965, { wall: '#73563a', top: '#a08860' });
    // The far support is behind the masonry. The near one stands outside it.
    post(-.255);
    circle(inner, lip, '#3b4037');
    circle(inner, .19, '#45625f');
    I.line(ctx, [x, y, .19], [x, y, .64], '#b5a17a', .65);
    // The front wall masks the lower water surface and the rope inside the shaft.
    I.cylinder(ctx, x, y, 0, outer * Math.SQRT2, .27, '#898575', { brick: true, noTop: true });
    I.cylinder(ctx, x, y, .27, (outer + .018) * Math.SQRT2, lip - .27, '#a69e88', { noTop: true });
    const at = (r, a) => [x + Math.cos(a) * r, y + Math.sin(a) * r, lip];
    // Coping stones form an actual ring, not a filled lid with water on top.
    for (let i = 0; i < 16; i++) {
      const a = i * Math.PI / 8, b = (i + 1) * Math.PI / 8;
      I.poly(ctx, [at(inner, a), at(outer + .018, a), at(outer + .018, b), at(inner, b)], i % 2 ? '#b5ad97' : '#aaa38e');
      if (i % 2 === 0) I.line(ctx, at(inner, a), at(outer + .018, a), '#7e7868', .45);
    }
    post(.255);
    // Spindle, wound rope and crank share the supports' world coordinates.
    I.line(ctx, [x - .28, y, .64], [x + .28, y, .64], '#5e4833', 2.1);
    for (const dx of [-.025, 0, .025]) I.line(ctx, [x + dx, y - .02, .61], [x + dx, y + .02, .67], '#baa57b', .65);
    I.line(ctx, [x + .28, y, .64], [x + .28, y, .53], '#625444', 1.1);
    I.line(ctx, [x + .28, y, .53], [x + .28, y + .09, .53], '#8c704d', 1.5);
    for (const dx of [-.255, .255]) for (const side of [-1, 1])
      I.line(ctx, [x + dx, y + side * .18, .8], [x + dx, y, .98], '#72553a', 1.4);
    I.gableRoof(ctx, x - .28, y - .19, .8, .56, .38, .18, '#734a36', 'x', { overhang: .02, rows: 3 });
  },
  drawProp(ctx, p, st, sv) {
    switch (p.t) {
      case 'crates': this.crate3(ctx, p.x, p.y, 0, 0.26); this.crate3(ctx, p.x + 0.28, p.y + 0.05, 0, 0.22); this.crate3(ctx, p.x + 0.1, p.y + 0.02, 0.26, 0.2); break;
      case 'barrels': this.barrel3(ctx, p.x, p.y, 0); this.barrel3(ctx, p.x + 0.24, p.y + 0.02, 0); this.barrel3(ctx, p.x + 0.12, p.y + 0.22, 0); break;
      case 'well': this.drawWell(ctx, p); break;
      case 'statue': { I.box(ctx, p.x - 0.22, p.y - 0.22, 0, 0.44, 0.44, 0.25, { wall: '#8f887a', top: '#a9a292' }); I.box(ctx, p.x - 0.14, p.y - 0.14, 0.25, 0.28, 0.28, 0.5, { wall: '#7d766a', top: '#9a9284' }); const s = I.p(p.x, p.y, 0.75); ctx.fillStyle = '#8f8878'; ctx.beginPath(); ctx.moveTo(s[0] - 3, s[1]); ctx.lineTo(s[0] + 3, s[1]); ctx.lineTo(s[0] + 4, s[1] - 15); ctx.lineTo(s[0] - 4, s[1] - 15); ctx.fill(); ctx.beginPath(); ctx.arc(s[0], s[1] - 17.5, 3, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#8f8878'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(s[0] + 4, s[1] - 12); ctx.lineTo(s[0] + 8, s[1] - 22); ctx.stroke(); ctx.fillStyle = '#bb9d58'; ctx.fillRect(s[0] - 6, s[1] - 11, 4, 6); break; }
      case 'nets': { for (let k = 0; k < 5; k++) I.line(ctx, [p.x, p.y + k * 0.08, 0.35], [p.x + 0.05, p.y + k * 0.08 + 0.3, 0], 'rgba(60,50,40,0.6)', 0.6); I.line(ctx, [p.x, p.y, 0], [p.x, p.y, 0.4], '#66503a', 1.2); I.line(ctx, [p.x, p.y + 0.35, 0], [p.x, p.y + 0.35, 0.4], '#66503a', 1.2); I.line(ctx, [p.x, p.y, 0.38], [p.x, p.y + 0.35, 0.38], '#66503a', 1); break; }
      case 'pillory': { I.line(ctx, [p.x, p.y, 0], [p.x, p.y, 0.75], '#6c5946', 2.4); I.box(ctx, p.x - 0.2, p.y - 0.06, 0.55, 0.4, 0.12, 0.14, { wall: '#84623f', top: '#9a7a4a' }); const q = I.p(p.x - 0.05, p.y, 0.62); ctx.fillStyle = '#463d38'; ctx.beginPath(); ctx.arc(q[0], q[1], 1.6, 0, 6.28); ctx.arc(q[0] + 5, q[1] + 1, 1.2, 0, 6.28); ctx.arc(q[0] - 5, q[1] + 1, 1.2, 0, 6.28); ctx.fill(); break; }
      case 'ropes': { for (const u of [0, 0.9, 1.8]) I.line(ctx, [p.x + u, p.y, 0], [p.x + u, p.y, 0.45], '#66503a', 1.4); for (let k = 0; k < 3; k++) I.line(ctx, [p.x, p.y, 0.42 - k * 0.1], [p.x + 1.8, p.y, 0.42 - k * 0.1], k % 2 ? '#c9b48a' : '#a89060', 0.9); const q = I.p(p.x + 2.1, p.y + 0.1, 0); ctx.fillStyle = '#b89a62'; ctx.beginPath(); ctx.ellipse(q[0], q[1], 5, 2.6, 0, 0, 6.28); ctx.fill(); ctx.strokeStyle = 'rgba(60,40,15,0.6)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.ellipse(q[0], q[1], 2, 1, 0, 0, 6.28); ctx.stroke(); break; }
      case 'sails': { I.line(ctx, [p.x, p.y, 0], [p.x, p.y, 0.7], '#66503a', 1.4); I.line(ctx, [p.x + 1.0, p.y, 0], [p.x + 1.0, p.y, 0.7], '#66503a', 1.4); I.line(ctx, [p.x, p.y, 0.68], [p.x + 1.0, p.y, 0.68], '#62472c', 1); I.poly(ctx, [[p.x + 0.1, p.y + 0.01, 0.66], [p.x + 0.9, p.y + 0.01, 0.66], [p.x + 0.85, p.y + 0.06, 0.25], [p.x + 0.5, p.y + 0.1, 0.12], [p.x + 0.15, p.y + 0.06, 0.25]], '#ede5d4', 'rgba(80,60,30,0.5)', 0.6); for (let k = 0.25; k < 0.9; k += 0.2) I.line(ctx, [p.x + k, p.y + 0.02, 0.64], [p.x + k, p.y + 0.06, 0.2], 'rgba(120,100,70,0.35)', 0.6); break; }
      case 'kiln': { I.cylinder(ctx, p.x, p.y, 0, 0.28, 0.35, '#8b6a4a', { brick: true, noTop: true }); I.cone(ctx, p.x, p.y, 0.35, 0.3, 0.4, '#84623f'); const q = I.p(p.x, p.y + 0.27, 0.12); ctx.fillStyle = '#463d38'; ctx.fillRect(q[0] - 2.5, q[1] - 4, 5, 4.5); if (!this.picking) { ctx.fillStyle = `rgba(255,120,30,${0.5 + Math.sin(this.time * 6) * 0.2})`; ctx.fillRect(q[0] - 1.5, q[1] - 3, 3, 2.5); if (this.light() < 0.6) this.lamps.push([q[0], q[1] - 2, 'fire']); } for (let k = 0; k < 4; k++) { const r = I.p(p.x + 0.4 + (k % 2) * 0.15, p.y - 0.1 + (k >> 1) * 0.15, 0.06); ctx.fillStyle = '#a66c44'; ctx.beginPath(); ctx.ellipse(r[0], r[1], 2.4, 1.6, 0, 0, 6.28); ctx.fill(); } break; }
      case 'frames': { for (const v of [0, 0.5, 1.0]) { I.line(ctx, [p.x, p.y + v, 0], [p.x, p.y + v, 0.7], '#66503a', 1.3); } I.line(ctx, [p.x, p.y, 0.66], [p.x, p.y + 1.0, 0.66], '#62472c', 1); for (const v of [0.08, 0.58]) I.poly(ctx, [[p.x, p.y + v, 0.64], [p.x, p.y + v + 0.34, 0.64], [p.x, p.y + v + 0.3, 0.2], [p.x, p.y + v + 0.04, 0.24]], '#a8825a', 'rgba(60,40,20,0.6)', 0.6); I.cylinder(ctx, p.x - 0.25, p.y + 0.3, 0, 0.16, 0.18, '#6c5946', {}); const q = I.p(p.x - 0.25, p.y + 0.3, 0.18); ctx.fillStyle = '#7e6c34'; ctx.beginPath(); ctx.ellipse(q[0], q[1], 0.12 * I.TW, 0.12 * I.TH, 0, 0, 6.28); ctx.fill(); break; }
      case 'dyecloths': { const cols = ['#496eb4', '#b44949', '#b5a44b', '#3e984c']; I.line(ctx, [p.x, p.y, 0], [p.x, p.y, 0.75], '#66503a', 1.3); I.line(ctx, [p.x, p.y + 1.1, 0], [p.x, p.y + 1.1, 0.75], '#66503a', 1.3); I.line(ctx, [p.x, p.y, 0.72], [p.x, p.y + 1.1, 0.72], '#62472c', 1); cols.forEach((c, i) => { const v = 0.08 + i * 0.26; I.poly(ctx, [[p.x, p.y + v, 0.71], [p.x, p.y + v + 0.2, 0.71], [p.x, p.y + v + 0.2, 0.25 + Math.sin(this.time * 2 + i) * 0.02], [p.x, p.y + v, 0.22]], c, 'rgba(20,10,5,0.4)', 0.5); }); I.cylinder(ctx, p.x - 0.28, p.y + 0.55, 0, 0.17, 0.22, '#6c5946', {}); const q = I.p(p.x - 0.28, p.y + 0.55, 0.22); ctx.fillStyle = '#4a49b3'; ctx.beginPath(); ctx.ellipse(q[0], q[1], 0.13 * I.TW, 0.13 * I.TH, 0, 0, 6.28); ctx.fill(); break; }
      case 'gallows': { I.box(ctx, p.x - 0.35, p.y - 0.35, 0, 0.7, 0.7, 0.25, { wall: '#8f887a', top: '#a9a292' }); I.line(ctx, [p.x, p.y, 0.25], [p.x, p.y, 1.5], '#66503a', 3); I.line(ctx, [p.x, p.y, 1.48], [p.x + 0.55, p.y, 1.48], '#66503a', 2.6); I.line(ctx, [p.x, p.y, 1.15], [p.x + 0.3, p.y, 1.46], '#66503a', 1.2); I.line(ctx, [p.x + 0.45, p.y, 1.46], [p.x + 0.45, p.y, 1.15], '#593e24', 0.8); const q = I.p(p.x + 0.45, p.y, 1.12); ctx.strokeStyle = '#593e24'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(q[0], q[1], 2, 2.6, 0, 0, 6.28); ctx.stroke(); const cr = I.p(p.x + 0.5, p.y - 0.05, 1.5); ctx.fillStyle = '#463d38'; ctx.beginPath(); ctx.ellipse(cr[0], cr[1], 2.6, 1.6, 0, 0, 6.28); ctx.fill(); break; }
      case 'tollbar': { I.line(ctx, [p.x, p.y - 0.55, 0], [p.x, p.y - 0.55, 0.6], '#66503a', 2); I.line(ctx, [p.x, p.y + 0.55, 0], [p.x, p.y + 0.55, 0.6], '#66503a', 2); const up = HK.state && HK.state.caravans.length ? 0.9 : 0; I.line(ctx, [p.x, p.y - 0.55, 0.5], [p.x, p.y + 0.55, 0.5 + up], '#c8102e', 2.2); for (let k = 0.15; k < 1.0; k += 0.3) I.line(ctx, [p.x, p.y - 0.55 + k, 0.5 + up * k / 1.1], [p.x, p.y - 0.55 + k + 0.15, 0.5 + up * (k + 0.15) / 1.1], '#f0ece0', 2.2); I.box(ctx, p.x - 0.2, p.y - 0.85, 0, 0.35, 0.3, 0.35, { wall: '#84623f' }, { noTop: true }); I.pyramid(ctx, p.x - 0.2, p.y - 0.85, 0.35, 0.35, 0.3, 0.2, '#6c5946'); break; }
      case 'boatup': { I.poly(ctx, [[p.x, p.y, 0], [p.x + 0.85, p.y - 0.05, 0], [p.x + 0.8, p.y + 0.25, 0.14], [p.x + 0.05, p.y + 0.3, 0.14]], '#6b4a2c', 'rgba(0,0,0,0.4)'); for (let k = 0.1; k < 0.8; k += 0.15) I.line(ctx, [p.x + k, p.y + 0.02, 0.02], [p.x + k, p.y + 0.27, 0.13], 'rgba(0,0,0,0.3)', 0.5); I.line(ctx, [p.x + 0.9, p.y + 0.35, 0], [p.x + 1.05, p.y + 0.35, 0.8], '#66503a', 1.6); for (let k = 0; k < 6; k++) I.line(ctx, [p.x + 0.92 + k * 0.02, p.y + 0.35 + k * 0.05, 0.1 + k * 0.1], [p.x + 0.7, p.y + 0.45 + k * 0.06, 0], 'rgba(90,80,60,0.6)', 0.5); break; }
      case 'fishracks': { for (const u of [0, 0.5, 1.0]) I.line(ctx, [p.x + u, p.y, 0], [p.x + u, p.y, 0.6], '#66503a', 1.3); I.line(ctx, [p.x, p.y, 0.58], [p.x + 1.0, p.y, 0.58], '#66503a', 1); I.line(ctx, [p.x, p.y, 0.38], [p.x + 1.0, p.y, 0.38], '#66503a', 1); for (let k = 0.06; k < 1.0; k += 0.11) { I.line(ctx, [p.x + k, p.y, 0.58], [p.x + k, p.y, 0.44], '#9fb3c8', 1.4); I.line(ctx, [p.x + k + 0.05, p.y, 0.38], [p.x + k + 0.05, p.y, 0.24], '#7d93a8', 1.4); } break; }
      case 'logs': { for (let r = 0; r < 3; r++) for (let i = 0; i < 4 - r; i++) { const y = p.y + i * 0.14 + r * 0.07, z = r * 0.12; I.line(ctx, [p.x, y, z + 0.07], [p.x + 0.8, y, z + 0.07], '#876339', 3.2); const e = I.p(p.x + 0.8, y, z + 0.07); ctx.fillStyle = '#c8a879'; ctx.beginPath(); ctx.ellipse(e[0], e[1], 1.8, 2.2, 0, 0, 6.28); ctx.fill(); } break; }
      case 'shrine': { I.box(ctx, p.x - 0.12, p.y - 0.12, 0, 0.24, 0.24, 0.9, { wall: '#8f887a', top: '#a9a292' }); I.box(ctx, p.x - 0.16, p.y - 0.16, 0.9, 0.32, 0.32, 0.25, { wall: '#7d766a' }, { noTop: true }); I.pyramid(ctx, p.x - 0.2, p.y - 0.2, 1.15, 0.4, 0.4, 0.22, '#574e42'); const q = I.p(p.x + 0.16, p.y + 0.06, 1.02); ctx.fillStyle = '#bb9d58'; ctx.fillRect(q[0] - 1, q[1] - 2, 2, 3); if (!this.picking) { ctx.fillStyle = 'rgba(255,180,80,0.8)'; ctx.fillRect(q[0] - 0.6, q[1] + 2, 1.2, 1.2); } break; }
      case 'cross': { I.line(ctx, [p.x, p.y, 0], [p.x, p.y, 0.9], '#675c52', 2.4); I.line(ctx, [p.x - 0.15, p.y, 0.7], [p.x + 0.15, p.y, 0.7], '#675c52', 2.4); break; }
      case 'laundry': { const a = I.p(p.x, p.y, 0.6), b = I.p(p.x + 1.1, p.y, 0.6); I.line(ctx, [p.x, p.y, 0], [p.x, p.y, 0.65], '#6c4a2f', 1.2); I.line(ctx, [p.x + 1.1, p.y, 0], [p.x + 1.1, p.y, 0.65], '#6c4a2f', 1.2); ctx.strokeStyle = '#333'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 3, b[0], b[1]); ctx.stroke(); ['#e8e0c8', '#843f3f', '#3f6284', '#e8e0c8'].forEach((c, i) => { const t = 0.18 + i * 0.2, lx = a[0] + (b[0] - a[0]) * t, ly = a[1] + (b[1] - a[1]) * t + 2, sw = Math.sin(this.time * 3 + i) * 1.5; ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 5, ly + 2); ctx.lineTo(lx + 5 + sw, ly + 9); ctx.lineTo(lx + sw, ly + 7); ctx.fill(); }); break; }
    }
  },
  /* Liegt am zugeordneten Liegeplatz ein festgemachtes Schiff? Nur dann hebt der Kran. */
  craneBusy(p) {
    const st = HK.state; if (!st || p.berth == null) return false;
    const s = st.ships.find(v => v.berth === p.berth); if (!s) return false;
    const a = this.shipAnim && this.shipAnim[s.id];
    return !!a && !a.leaving && Math.abs(a.x - a.tx) + Math.abs(a.y - a.ty) < 0.05;
  },
  /* Hafenkran nach Havenrode: gekreuzte Schwellen, senkrechter Drehpfosten,
     Handwinde und ein offener, abgestützter Ausleger. Maße in unserer Welt. */
  craneLoadPose(d) {
    const cs = this.craneState(d), slot = d.slot || this.dockSlotFor(d), kind = d.cargo?.kind || d.load?.kind || d.lastDrop?.item.kind || slot.items.at(-1)?.kind || 'crate';
    const index = d.direction === 'out' ? d.pickIndex || 0 : cs.load ? slot.items.length : d.lastDrop?.index ?? Math.max(0, slot.items.length - 1);
    const place = (this.PILE[kind] || this.PILE.crate)[Math.min(2, index)], over = d.direction === 'out' ? d.u >= 0.13 && d.u < 0.4 : d.u >= 0.55 && d.u < 0.86;
    const bottom = over ? this.DECK_Z + place[2] * this.CARGO_STEP[kind] : this.DECK_Z + 0.14, drift = over ? 1 - cs.lift : 0;
    return { x: d.cx + Math.sin(cs.th) * cs.reach + place[0] * drift, y: d.cy + Math.cos(cs.th) * cs.reach + place[1] * drift,
      z: bottom + cs.lift * (this.DECK_Z + 1.22 - bottom), height: this.cargoHeight(kind) };
  },
  drawTreadCrane(ctx, d, omitLoad = false) {
    const x = d.cx, y = d.cy, z = this.DECK_Z, cs = this.craneState(d), pk = this.picking;
    const beam = (a, b, w, depth, color) => {
      const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len * w / 2, ny = dx / len * w / 2;
      const pts = [a, b].flatMap(p => [[p[0] - nx, p[1] - ny, p[2] - depth / 2], [p[0] + nx, p[1] + ny, p[2] - depth / 2], [p[0] + nx, p[1] + ny, p[2] + depth / 2], [p[0] - nx, p[1] - ny, p[2] + depth / 2]]);
      const centre = a.map((v, i) => (v + b[i]) / 2);
      for (const ids of [[0, 1, 2, 3], [4, 7, 6, 5], [0, 4, 5, 1], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0]]) {
        const q = ids.map(i => pts[i]), u = q[1].map((v, i) => v - q[0][i]), v = q[2].map((n, i) => n - q[0][i]);
        const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], mid = centre.map((_, i) => q.reduce((sum, p) => sum + p[i], 0) / 4);
        const sign = n.reduce((sum, v, i) => sum + v * (mid[i] - centre[i]), 0) < 0 ? -1 : 1;
        if (sign * (n[0] + n[1] + n[2] * 2 * I.TH / I.ZS) <= 1e-9) continue;
        I.poly(ctx, q, I.shade(color, n[2] * sign > 0 ? 1.13 : n[0] * sign > 0 ? 0.86 : 1), 'rgba(53,42,29,0.25)', 0.45);
      }
    };
    I.box(ctx, x - 0.09, y - 0.46, z, 0.18, 0.92, 0.1, { wall: '#806b4e', top: '#b29a73' });
    I.box(ctx, x - 0.34, y - 0.08, z + 0.1, 0.85, 0.16, 0.1, { wall: '#806b4e', top: '#b29a73' });
    beam([x, y - 0.4, z + 0.1], [x, y, z + 0.77], 0.075, 0.075, '#a08459');
    beam([x + 0.43, y, z + 0.2], [x, y, z + 0.77], 0.075, 0.075, '#a08459');
    I.box(ctx, x - 0.055, y - 0.055, z + 0.1, 0.11, 0.11, 1.86, { wall: '#806346', top: '#aa8b60' });
    for (const zz of [0.34, 0.76, 1.84]) I.box(ctx, x - 0.059, y - 0.059, z + zz, 0.118, 0.118, 0.045, { wall: '#626456', top: '#7d7b66' });
    const bx = x + Math.sin(cs.th) * d.R, by = y + Math.cos(cs.th) * d.R, bz = z + 2.12;
    beam([x, y, z + 1.89], [bx, by, bz], 0.09, 0.1, '#92734c');
    beam([x, y, z + 1.08], [x + (bx - x) * 0.72, y + (by - y) * 0.72, z + 2.025], 0.065, 0.07, '#a58a5e');
    I.line(ctx, [x, y, z + 1.95], [bx, by, bz + 0.05], '#c4aa7b', 0.65);
    const spin = cs.lift * Math.PI * 4; // Winde dreht nur beim Heben und Senken
    I.line(ctx, [x - 0.12, y - 0.08, z + 0.44], [x - 0.12, y + 0.16, z + 0.44], '#646354', 2);
    this.isoWheel(ctx, x - 0.12, y + 0.16, z + 0.44, 0.24, 1, 0, spin);
    const slot = d.slot || this.dockSlotFor(d), kind = d.cargo?.kind || d.load?.kind || d.lastDrop?.item.kind || slot.items.at(-1)?.kind || 'crate';
    const pile = this.PILE[kind] || this.PILE.crate, index = d.direction === 'out' ? (d.pickIndex || 0) : cs.load ? slot.items.length : d.lastDrop?.index ?? Math.max(0, slot.items.length - 1);
    const place = pile[Math.min(index, pile.length - 1)], landingZ = z + place[2] * (this.CARGO_STEP[kind] || 0.28);
    const overStack = d.direction === 'out' ? d.u >= 0.13 && d.u < 0.4 : d.u >= 0.55 && d.u < 0.86, bottomZ = overStack ? landingZ : z + 0.14;
    const trolleyX = x + Math.sin(cs.th) * cs.reach, trolleyY = y + Math.cos(cs.th) * cs.reach, trolleyZ = z + 1.89 + cs.reach / d.R * 0.23;
    const drift = overStack ? 1 - cs.lift : 0, loadX = trolleyX + place[0] * drift, loadY = trolleyY + place[1] * drift;
    const hookZ = bottomZ + cs.lift * (z + 1.22 - bottomZ), cargoH = this.cargoHeight(kind);
    I.line(ctx, [trolleyX, trolleyY, trolleyZ], [loadX, loadY, hookZ + cargoH + 0.06], '#bfa77b', 0.85);
    if (!pk) {
      const pulley = I.p(trolleyX, trolleyY, trolleyZ), hook = I.p(loadX, loadY, hookZ + cargoH + 0.04);
      ctx.strokeStyle = '#646456'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(pulley[0], pulley[1], 1.4, 1.8, 0, 0, Math.PI * 2); ctx.stroke();
      if (!cs.load) { ctx.beginPath(); ctx.moveTo(hook[0], hook[1] - 1); ctx.lineTo(hook[0] + 1.5, hook[1] + 2); ctx.quadraticCurveTo(hook[0] + 1, hook[1] + 4, hook[0] - 1.3, hook[1] + 2.5); ctx.stroke(); }
    }
    if (cs.load && d.load && !omitLoad) {
      this.drawCargo(ctx, loadX, loadY, hookZ, d.load);
      for (const side of [-1, 1]) I.line(ctx, [loadX, loadY, hookZ + cargoH + 0.06], [loadX + side * 0.12, loadY, hookZ + cargoH * 0.7], '#c7b68c', 0.65);
    }
    {
      const operator = I.p(x - 0.32, y + 0.31, z);
      this.drawPerson(ctx, operator[0], operator[1], '#775e48', 'porter', 1, false, '#dcc3aa', 0, 1, null, null, 0.85);
    }
  },
  /* Stehendes Rad in der Isometrie: der Kreis liegt in der Ebene aus Fahrtrichtung und Höhe,
     projiziert also als geneigte Ellipse. Punkte werden gerechnet statt als Kreis gezeichnet. */
  isoWheel(ctx, cx, cy, cz, r, dx, dy, spin) {
    const P = (th, rr) => I.p(cx + Math.cos(th) * rr * dx, cy + Math.cos(th) * rr * dy, cz + Math.sin(th) * rr);
    const ring = (rr, col) => { ctx.fillStyle = col; ctx.beginPath(); for (let k = 0; k <= 22; k++) { const q = P(k / 22 * 6.2832, rr); k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); } ctx.closePath(); ctx.fill(); };
    ring(r, '#614627');
    ring(r * 0.86, '#8c6d45');
    ring(r * 0.70, '#745839');
    if (!this.picking) {
      ctx.strokeStyle = '#9d7c50'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) {
        const a = spin + i * 1.0472, q0 = P(a, r * 0.16), q1 = P(a, r * 0.78);
        ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.stroke();
      }
    }
    ring(r * 0.2, '#674b2d');
  },
  drawHouseHoist(ctx, b) {
    const gx = b.x + b.w, gy = b.y + b.d / 2, rh = Math.min(b.w, b.d) * .62;
    const beam = b.h + rh, hook = beam - .5;
    // House hoists have no assigned freight job. Park an empty hook rather
    // than inventing a suspended parcel and an endless loading animation.
    I.line(ctx, [gx + .02, gy, beam - .38], [gx + .38, gy, beam - .02], '#715236', 1.8);
    I.line(ctx, [gx, gy, beam + .05], [gx + .5, gy, beam - .05], '#62472c', 2.5);
    const pulley = I.p(gx + .48, gy, beam - .08);
    ctx.fillStyle = '#514b3e'; ctx.beginPath(); ctx.arc(pulley[0], pulley[1], 1.5, 0, Math.PI * 2); ctx.fill();
    I.line(ctx, [gx + .5, gy, beam - .08], [gx + .5, gy, hook], '#75664b', .8);
    const p = I.p(gx + .5, gy, hook);
    ctx.strokeStyle = '#49443a'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0], p[1] + 1.3);
    ctx.arc(p[0] + 1.2, p[1] + 1.3, 1.2, Math.PI, 0, true); ctx.stroke();
  },
  drawLoadingPad(ctx, b) {
    const yy = b.y + b.d;
    I.poly(ctx, [[b.x + .2, yy, 0], [b.x + .8, yy, 0], [b.x + .8, yy + .35, 0], [b.x + .2, yy + .35, 0]], 'rgba(60,45,25,.35)');
  },
  drawHospitalBench(ctx, b) { I.box(ctx, b.x + .2, b.y + b.d + .12, 0, .7, .18, .18, { wall: '#84623f', top: '#a08a5a' }); },
  drawHospitalPatient(ctx, b) {
    const p = I.p(b.x + .45, b.y + b.d + .32, 0);
    this.drawPerson(ctx, p[0], p[1], '#8a8a7a', 'beggar', 1, false, '#d2aa91', 0, 1, null, null, .8);
  },
  /* Anbauten außerhalb des Hausgrundrisses müssen zwischen Nachbarhäusern
     und Passanten einsortierbar sein. Die Bodenschattierung liegt ganz unten. */
  buildingExtras(b) {
    const extras = [], yy = b.y + b.d, xx = b.x + b.w;
    const add = (part, box, f) => extras.push({ part, box, f });
    if (b.hoist) add('hoist', [xx, b.y + b.d / 2 - .1, xx + .62, b.y + b.d / 2 + .12], c => this.drawHouseHoist(c, b));
    if (b.shabby) add('barrel', [xx - .03, yy - .45, xx + .27, yy - .15], c => this.barrel3(c, xx + .12, yy - .3, 0));
    if (b.kind === 'longhouse' && !b.low) {
      add('pad', null, c => this.drawLoadingPad(c, b));
      add('crate', [b.x + .25, yy + .02, b.x + .47, yy + .24], c => this.crate3(c, b.x + .25, yy + .02, 0, .22));
    }
    if (b.kind === 'hospital') {
      add('bench', [b.x + .2, yy + .12, b.x + .9, yy + .3], c => this.drawHospitalBench(c, b));
      add('patient', [b.x + .35, yy + .22, b.x + .55, yy + .42], c => this.drawHospitalPatient(c, b));
    }
    return extras;
  },
  drawBuilding(ctx, b, st, season, sv, separateExtras = false) {
    if (separateExtras) b = { ...b, separateExtras: true };
    const previousLights = this.lightingBuilding; this.lightingBuilding = b;
    try {
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
        case 'stable': this.drawStable(ctx, b, st, season, sv); break;
        case 'timberyard': this.drawTimberyard(ctx, b, st, season, sv); break;
        case 'chapel': this.drawChapel(ctx, b, st, season, sv); break;
        case 'market': return;
      }
      const bh = b.burgher && st.burghers ? st.burghers[b.burgher] : null;
      const owned = (bh && bh.owner === 'player') || (b.panel === 'house' && st.houses[b.plot].owner === 'player') || (b.panel === 'workshop' && st.workshops[b.plot].type) || (b.id === 'tavern' && st.tavernOwned) || (b.id === 'bathhouse' && st.bathhouseOwned) || (b.panel === 'venture' && st.ventures && st.ventures[b.id]) || (b.panel === 'storage' && st.storages && st.storages[b.plot] && st.storages[b.plot].owner === 'player') || (b.id === 'dive' && st.ventures && st.ventures.dive);
      if (owned) this.gableFlag(ctx, b.x + b.w - 0.06, b.y + b.d - 0.06, b.h);
      if (bh && HK.burgherForSale(st, bh)) this.saleSign(ctx, b);
      if (bh && bh.vacantUntil > st.day) this.boardedDoor(ctx, b);
      if (((bh && bh.damaged) || (b.panel === 'house' && st.houses[b.plot].damaged))) { I.poly(ctx, [[b.x, b.y + b.d, 0], [b.x + b.w, b.y + b.d, 0], [b.x + b.w, b.y + b.d, b.h], [b.x, b.y + b.d, b.h]], 'rgba(20,15,10,0.6)'); I.poly(ctx, [[b.x + b.w, b.y, 0], [b.x + b.w, b.y + b.d, 0], [b.x + b.w, b.y + b.d, b.h], [b.x + b.w, b.y, b.h]], 'rgba(20,15,10,0.65)'); }
    } finally { this.lightingBuilding = previousLights; }
  },

  /* ---------- Schiffe (3D-Rumpf, gedreht) ---------- */
  /* Havenrodes Stationsriss auf die bestehenden Liegeplätze verkleinert.
     Längen und Breite bleiben innerhalb der bisherigen Manövrierflächen. */
  SHIP_PROFILE: [[-2.2, .46], [-1.8, .71], [-1.15, .9], [-.35, .99], [.5, .94], [1.3, .76], [2, .48], [2.65, .035]]
    .map(([u, v]) => [-1.2 + (u + 2.2) * 2.45 / 4.85, v * .42 / .99]).reverse(),
  shipSheer(u) { return Math.max(0, Math.abs((u + 1.2) * 4.85 / 2.45 - 2.2) - 0.8) * 0.075; },
  drawShip(ctx, x, y, heading, scale, origin, docked, selected, cargo) {
    const c = Math.cos(heading), sn = Math.sin(heading), s = scale, t = this.time, pk = this.picking;
    const bob = Math.sin(t * (docked ? 1.1 : 1.5) + x) * (docked ? 0.012 : 0.03);
    const W = (u, v, z) => [x + (u * c - v * sn) * s, y + (u * sn + v * c) * s, this.WATER_Z + z * s];
    const P = (u, v, z) => I.p(...W(u, v, z));
    const line = (points, color, width = 0.6, close = false) => {
      ctx.beginPath(); points.forEach((q, i) => { const p = I.p(...q); i ? ctx.lineTo(...p) : ctx.moveTo(...p); });
      if (close) ctx.closePath(); ctx.strokeStyle = color; ctx.lineWidth = width * s; ctx.stroke();
    };
    const localLine = (a, b, color, width = 0.6) => line([W(...a), W(...b)], color, width);
    const box = (u, v, z, length, width, height, color, top) => {
      const base = [[u, v], [u + length, v], [u + length, v + width], [u, v + width]].map(q => W(...q, 0).slice(0, 2));
      this.prism(ctx, base, this.WATER_Z + z * s, height * s, { wall: color, top: top || color }, { stroke: 'rgba(52,42,28,0.3)' });
    };
    const sheer = u => this.shipSheer(u), deckZ = u => 0.525 + sheer(u) + bob;
    const profile = this.SHIP_PROFILE, outline = profile.concat(profile.slice().reverse().map(([u, v]) => [u, -v]));
    const ring = (width, z) => outline.map(([u, v]) => W(u, v * width, z + sheer(u) + bob));
    const flag = { luebeck: '#aa5347', bruegge: '#68758b', bergen: '#6b7d58', danzig: '#a38a55', riga: '#846883', stockholm: '#a3945c', london: '#8f514b', own: '#b59b63', guard: '#596e83', rival_kruse: '#748260', rival_bracht: '#8e6b50', rival_detmers: '#806578' }[origin] || '#8d8370';
    const visible = (a, b) => { const nu = b[1] - a[1], nv = a[0] - b[0]; return (nu * c - nv * sn) + (nu * sn + nv * c) > 1e-8; };
    // Water effects cannot be part of a moored ship sprite: that sprite can
    // overlap foreground piers. At sea, reject each segment over solid ground.
    if (!pk && !docked) {
      const wet=q=>this.isWater(q[0],q[1])&&!this.pierAt(q[0],q[1])&&!this.moleAt(q[0],q[1]);
      const waterLine=pts=>{for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],m=a.map((v,k)=>(v+b[k])/2);if(wet(a)&&wet(b)&&wet(m))line([a,b],'rgba(183,211,204,0.2)',.55);}};
      const waterOutline=outline.map(([u,v])=>W(u,v*1.02,0));
      if(waterOutline.every(wet))I.poly(ctx,waterOutline,'rgba(18,47,52,0.18)');
      for (const side of [-1,1]) waterLine(Array.from({length:6},(_,i)=>W(-1.1-i*.27,side*(.12+i*.09)+Math.sin(t*2+i)*.035,0)));
    }
    // Klinkerrumpf mit flachem Deckssprung und breitem Mittelschiff.
    const layers = [[0.3, 0.03], [0.77, 0.165], [1, 0.39], [0.97, 0.555]];
    const faces = [];
    for (let layer = 0; layer < layers.length - 1; layer++) {
      const low = ring(...layers[layer]), high = ring(...layers[layer + 1]);
      for (let i = 0; i < outline.length; i++) {
        const j = (i + 1) % outline.length; if (!visible(outline[i], outline[j])) continue;
        const points = [low[i], low[j], high[j], high[i]], edge = [high[i], high[j]];
        const normal = (outline[j][1] - outline[i][1]) * c - (outline[i][0] - outline[j][0]) * sn;
        faces.push({ points, edge, color: I.shade(['#6c5841', '#8b6948', '#a3855c'][layer], normal > 0 ? 0.9 : 1), k: points.reduce((sum, q) => sum + q[0] + q[1], 0) / 4 });
      }
    }
    faces.sort((a, b) => a.k - b.k).forEach(f => I.poly(ctx, f.points, f.color, 'rgba(54,43,30,0.23)', 0.45));
    const widthAtHeight = z => z < 0.39 ? 0.77 + (z - 0.165) / 0.225 * 0.23 : 1 - (z - 0.39) / 0.165 * 0.03;
    for (let z = 0.19, course = 0; z < 0.555; z += 0.055, course++) {
      const points = ring(widthAtHeight(z), z);
      for (let i = 0; i < outline.length; i++) {
        const j = (i + 1) % outline.length; if (!visible(outline[i], outline[j])) continue;
        line([points[i], points[j]], course % 2 ? 'rgba(210,180,128,0.28)' : 'rgba(57,46,32,0.4)', 0.55);
      }
    }
    I.poly(ctx, ring(0.88, 0.525), '#b8a17c', 'rgba(64,52,34,0.25)', 0.5);
    const widthAt = u => {
      for (let i = 0; i < profile.length - 1; i++) if (u <= profile[i][0] && u >= profile[i + 1][0]) {
        const a = profile[i], b = profile[i + 1], f = (a[0] - u) / (a[0] - b[0]); return a[1] + (b[1] - a[1]) * f;
      }
      return 0;
    };
    for (let u = -1.18; u < 1.2; u += 0.095) {
      const v = widthAt(u) * 0.87;
      localLine([u, -v, deckZ(u)], [u, v, deckZ(u)], 'rgba(90,74,48,0.32)', 0.45);
    }
    const railing = front => {
      for (let i = 0; i < outline.length; i++) {
        const j = (i + 1) % outline.length, a = outline[i], b = outline[j]; if (visible(a, b) !== front) continue;
        localLine([a[0], a[1] * 0.97, 0.57 + sheer(a[0]) + bob], [b[0], b[1] * 0.97, 0.57 + sheer(b[0]) + bob], '#c0a475', 1.25);
        localLine([a[0], a[1] * 0.97, 0.57 + sheer(a[0]) + bob], [a[0], a[1] * 0.97, 0.7 + sheer(a[0]) + bob], '#9b7d55', 0.7);
        localLine([a[0], a[1] * 0.97, 0.7 + sheer(a[0]) + bob], [b[0], b[1] * 0.97, 0.7 + sheer(b[0]) + bob], '#b69b6d', 0.85);
      }
    };
    railing(false);
    // Offenes Achterkastell auf Stützen statt der massiven Kajüte.
    const sternZ = 0.87 + bob, sternU = -1.13, sternEnd = -0.73, sternV = 0.25;
    for (const u of [sternU + 0.035, sternEnd - 0.035]) for (const v of [-sternV + 0.02, sternV - 0.02]) {
      box(u - 0.018, v - 0.018, deckZ(u), 0.036, 0.036, sternZ - deckZ(u), '#8e7350');
    }
    box(sternU, -sternV, sternZ, sternEnd - sternU, sternV * 2, 0.07, '#a1855c', '#bda780');
    for (let u = sternU + 0.04; u < sternEnd; u += 0.08) localLine([u, -sternV, sternZ + 0.07], [u, sternV, sternZ + 0.07], 'rgba(89,71,44,0.28)', 0.45);
    for (const v of [-sternV, sternV]) {
      for (let u = sternU; u <= sternEnd + 1e-8; u += 0.1) localLine([u, v, sternZ + 0.07], [u, v, sternZ + 0.23], '#9b8058', 0.65);
      localLine([sternU, v, sternZ + 0.23], [sternEnd, v, sternZ + 0.23], '#bda16e', 1.1);
    }
    localLine([sternU, -sternV, sternZ + 0.23], [sternU, sternV, sternZ + 0.23], '#bda16e', 1.1);
    const hz = deckZ(0) + 0.07;
    box(-0.16, -0.17, deckZ(0), 0.36, 0.34, 0.07, '#816745', '#5b3e25');
    // Gräting und Kreuzleisten bleiben Teil der Luke, auf deren Süll.
    I.poly(ctx, [[-0.16, -0.17], [0.2, -0.17], [0.2, 0.17], [-0.16, 0.17]].map(q => W(...q, hz)), '#5b3e25');
    for (let u = -0.14; u < 0.2; u += 0.065) localLine([u, -0.16, hz], [u, 0.16, hz], '#b09a71', 0.8);
    for (let v = -0.14; v < 0.17; v += 0.075) localLine([-0.15, v, hz], [0.19, v, hz], '#a48e65', 0.45);
    if (cargo) {
      const places = [[-0.4, -0.2], [0.45, -0.2], [0.42, 0.14]];
      Object.entries(cargo).filter(([g, c]) => (typeof c === 'number' ? c : c.qty) > 0).slice(0, 3).forEach(([good], i) => this.drawCargo(ctx, ...W(...places[i], deckZ(places[i][0])), { good, kind: HK.cargoKind(good) }, Math.min(1, s), heading));
    } else {
      this.crate3(ctx, ...W(0.42, 0.14, deckZ(0.42)), 0.17 * s);
      this.barrel3(ctx, ...W(-0.4, -0.2, deckZ(-0.4)), 0.88 * s); this.barrel3(ctx, ...W(0.45, -0.2, deckZ(0.45)), 0.88 * s);
    }
    if (!pk) {
      const rope = P(-0.39, 0.22, deckZ(-0.39)); ctx.strokeStyle = '#c6af7f'; ctx.lineWidth = 0.65 * s;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(rope[0], rope[1], (2 + i) * s, (1 + i * 0.4) * s, 0, 0, Math.PI * 2); ctx.stroke(); }
    }
    {
      for (const [u, v, z, color, size] of [[0.48, 0.03, deckZ(0.48), '#607b7b', 0.56], [-0.91, 0.03, sternZ + 0.07, '#986449', 0.58]]) {
        const p = P(u, v, z); this.drawPerson(ctx, p[0], p[1], color, 'fisher', 1, false, '#d2aa91', docked ? 0 : t * 3, 1, null, null, size * s);
      }
    }
    // Einzelmast und zurückhaltende stehende Takelage in der Segelrichtung.
    const mastU = -0.34, mastTop = 2.385 + bob, yardZ = 1.92 + bob, yardW = 0.68;
    localLine([mastU, 0, deckZ(mastU)], [mastU, 0, mastTop], '#765839', 2.35);
    localLine([mastU - 0.014, 0, deckZ(mastU)], [mastU - 0.014, 0, mastTop - 0.04], '#bc9a66', 0.6);
    const rigging = front => {
      for (const side of [-1, 1]) {
        const anchor = W(mastU, side * 0.38, 0), isFront = (anchor[0] + anchor[1] > x + y); if (isFront !== front) continue;
        for (const u of [-0.65, -0.34, -0.04]) localLine([mastU, 0, mastTop - 0.28], [u, side * 0.38, deckZ(u) + 0.03], front ? 'rgba(83,72,52,0.7)' : '#b4a17b', 0.55);
      }
    };
    rigging(false);
    localLine([mastU, 0, mastTop - 0.035], [1.21, 0, deckZ(1.21) + 0.23], '#b5a17b', 0.55);
    localLine([mastU, 0, mastTop - 0.035], [-1.09, 0, sternZ + 0.23], '#998468', 0.55);
    const basket = W(mastU, 0, 2.05 + bob);
    I.cylinder(ctx, basket[0], basket[1], basket[2], 0.065 * s, 0.075 * s, '#a28a61', {});
    localLine([mastU + 0.025, -yardW, yardZ], [mastU + 0.025, yardW, yardZ], '#93714b', 1.75);
    if (docked) {
      // Einzelne weiche Tuchfalten und Bindebänder nach dem Vorbild.
      for (let i = 0; i < 12; i++) {
        const v0 = -yardW + i * yardW * 2 / 12, v1 = v0 + yardW * 2 / 12, drop = 0.095 + Math.sin(i * 0.85) * 0.025;
        I.poly(ctx, [W(mastU + 0.012, v0, yardZ - 0.015), W(mastU + 0.012, v1, yardZ - 0.015), W(mastU + 0.055, v1, yardZ - drop), W(mastU + 0.055, v0, yardZ - drop - 0.015)], ['#b7a782', '#dacbaa', '#cbbd97'][i % 3]);
        if (i % 3 === 0) localLine([mastU + 0.055, v0, yardZ + 0.02], [mastU + 0.055, v0, yardZ - 0.135], '#8f805e', 0.5);
      }
    } else {
      const belly = 0.15 + Math.sin(t * 1.2 + x) * 0.02;
      const sailPoint = (f, g) => W(mastU + 0.025 + belly * (1 - f * f * 0.5) * g, f * yardW * (1 - 0.06 * g), yardZ - g * 1.15 + Math.abs(f) * g * 0.035);
      const sail = [sailPoint(-1, 0), sailPoint(1, 0)].concat(Array.from({ length: 9 }, (_, i) => sailPoint(1 - i / 4, 1)));
      I.poly(ctx, sail, '#d7cbaa', 'rgba(113,94,60,0.32)', 0.5);
      for (let i = 1; i < 9; i++) line([sailPoint(-1 + i / 4, 0), sailPoint(-1 + i / 4, 1)], 'rgba(128,111,78,0.22)', 0.4);
      if (!pk) I.poly(ctx, [sailPoint(-0.16, 0.35), sailPoint(0.16, 0.35), sailPoint(0.16, 0.61), sailPoint(-0.16, 0.61)], flag);
      for (const side of [-1, 1]) line([sailPoint(side, 1), W(-0.62, side * 0.35, deckZ(-0.62))], 'rgba(111,96,68,0.6)', 0.5);
    }
    rigging(true);
    railing(true);
    localLine([1.24, 0, 0.04 + bob], [1.29, 0, deckZ(1.24) + 0.22], '#8f6d48', 1.9);
    // Ruder und Pinne folgen derselben Drehung und Schiffsbewegung.
    I.poly(ctx, [W(-1.21, 0, 0.23 + bob), W(-1.36, 0, 0.1 + bob), W(-1.36, 0, 0.025 + bob), W(-1.22, 0, 0.035 + bob)], '#846749', 'rgba(67,53,34,0.3)', 0.45);
    localLine([-1.22, 0, deckZ(-1.2)], [-0.89, 0, sternZ + 0.14], '#92734b', 0.75);
    const mt = W(mastU, 0, mastTop);
    if (!pk) this.pennant(ctx, mt[0], mt[1], mt[2] + 0.015 * s, 0.58 * s, 0.14 * s, [flag], true);
    const lampV = (c - sn >= 0 ? 1 : -1) * 0.2, lampZ = sternZ + 0.23;
    box(-1.09, lampV - 0.025, lampZ, 0.05, 0.05, 0.08, '#695d48', '#8a795b');
    if (!pk) {
      const lp = P(-1.065, lampV, lampZ + 0.045);
      ctx.fillStyle = this.light() < 0.7 ? '#dbc49b' : '#b9a174';
      ctx.fillRect(lp[0] - 0.7 * s, lp[1] - 1 * s, 1.4 * s, 2 * s);
      if (this.light() < 0.7) this.lamps.push([...lp, 'ship']);
    }
    if (selected) {
      const hull = this.shipHull(x, y, heading, s); ctx.strokeStyle = '#d3c292'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      ctx.beginPath(); hull.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
    }
  },
  drawBoat(ctx,x,y,own,t,motion={}) {
    const bob=motion.bob??Math.sin(t*2)*.012,heading=motion.heading||0,co=Math.cos(heading),si=Math.sin(heading);
    const W=(u,v,z)=>[x+u*co-v*si,y+u*si+v*co,this.WATER_Z+z+bob];
    if(motion.moving&&!this.picking)for(const side of [-1,1])I.line(ctx,W(-.5,side*.14,-bob),W(-.92,side*.29,-bob),'rgba(183,211,204,.25)',.6);
    if(motion.net>0){
      const reach=.22+motion.net*.38;
      I.poly(ctx,[W(-.2,.19,.23),W(.2,.19,.23),W(.24,reach,.015),W(-.3,reach,.015)],'rgba(98,112,87,.42)');
      for(let i=0;i<5;i++)I.line(ctx,W(-.2+i*.1,.19,.23),W(-.3+i*.135,reach,.015),'#a4a185',.5);
      for(let i=1;i<=3;i++){const f=i/3;I.line(ctx,W(-.2-.1*f,.19+(reach-.19)*f,.23*(1-f)),W(.2+.04*f,.19+(reach-.19)*f,.23*(1-f)),'#8e937a',.5);}
    }
    const outline=[[.58,0],[.38,-.19],[-.34,-.2],[-.53,-.12],[-.53,.12],[-.34,.2],[.38,.19]].reverse();
    const bands=[[.48,.025],[.73,.10],[.92,.20],[1,.30]],faces=[];
    for(let k=0;k<bands.length-1;k++)for(let i=0;i<outline.length;i++){
      const a=outline[i],b=outline[(i+1)%outline.length],nu=b[1]-a[1],nv=a[0]-b[0];if(nu*(co+si)+nv*(co-si)<=0)continue;
      const [lo,z0]=bands[k],[hi,z1]=bands[k+1],pts=[W(a[0]*.96,a[1]*lo,z0),W(b[0]*.96,b[1]*lo,z0),W(b[0],b[1]*hi,z1),W(a[0],a[1]*hi,z1)];
      faces.push({pts,k:(a[0]+b[0])*(co+si)+(a[1]+b[1])*(co-si),col:['#816c4d','#96805c','#ae9872'][k]});
    }
    faces.sort((a,b)=>a.k-b.k).forEach(f=>I.poly(ctx,f.pts,f.col,'#65563e',.4));
    I.poly(ctx,outline.map(([u,v])=>W(u,v*.85,.27)),'#74654b','#c0a87d',1);
    for(const u of [-.3,-.02,.26])I.line(ctx,W(u,-.16,.30),W(u,.16,.30),'#b9a17a',2);
    for(const side of [-1,1])I.line(ctx,W(-.34,side*.19,.32),W(.38,side*.18,.32),'#c2ab81',1);
    I.line(ctx,W(.13,0,.28),W(.13,0,1.25),'#806643',1.5);
    // Small square sail: linen panels and cordage share the cog palette.
    const sail=(u,v,z)=>W(.13+u,v,z);
    I.line(ctx,sail(0,-.3,1.12),sail(0,.3,1.12),'#a28b63',1.1);
    for(let k=0;k<6;k++){const a=-.28+k*.093,b=a+.093;I.poly(ctx,[sail(0,a,1.1),sail(0,b,1.1),sail(.10,b*.8,motion.moving===false?1.02:.63),sail(.10,a*.8,motion.moving===false?1.02:.63)],k%2?'#c6b895':'#d4c6a5','#b4a785',.25);}
    for(const u of [-.48,.53])I.line(ctx,W(.13,0,1.22),W(u,0,.33),'#b7a47b',.55);
    // A coil and folded fishing net, contained inside the open hold.
    for(let k=0;k<4;k++)I.line(ctx,W(-.02+k*.045,.03,.34),W(.04+k*.045,.13,.34),'#8e9273',.7);
    const p=I.p(...W(-.32,0,.28));this.drawPerson(ctx,p[0],p[1],own?'#687654':'#63777c','fisher',1,false,'#cfb18c',0,1,null,{head:heading},.48);
    I.line(ctx,W(-.42,.17,.35),W(.03,.43,.05),'#967e53',1.1);
  },
  /* Karawanenlager vor dem Landtor. Kein fahrendes Gespann, sondern eine Rast: der Planwagen steht
     mit stillen Rädern, die Ochsen sind ausgespannt und grasen am Pflock, am Feuer sitzt und steht
     die Mannschaft, ein Träger räumt Waren vom Wagen auf den Stapel. Alles läuft mit Periode 6 s,
     weil der Aussehens-Schlüssel des Lagers (siehe buildItems) alle 6 s von vorn zählt. */
  drawCaravan(ctx, x, y, t, sv, visitor) {
    const pk = this.picking, nacht = this.light() < 0.6;
    const at = (u, v) => [x + u, y + v];                         // Wagenachse liegt in x
    const teile = [];                                            // Maler-Reihenfolge nach x+y
    const stelle = (k, f) => teile.push({ k, f });

    /* --- Planwagen --- */
    const RH = 0.27, RV = 0.21, bett = RH - 0.03, WL = 1.15, WB = 0.52;
    const rad = (u, v, R) => this.isoWheel(ctx, x + u, y + v, R, R, 1, 0, 0);   // still: kein Drehwinkel
    stelle(-0.6, () => {
      I.shadow(ctx, x - WL / 2, y - WB / 2, WL, WB, 0.7, sv.v, sv.a);
      rad(-0.36, -0.32, RH); rad(0.38, -0.32, RV);                              // ferne Räder
      I.line(ctx, [x - 0.36, y - 0.32, RH], [x - 0.36, y + 0.32, RH], '#5e4330', 1.8);
      I.line(ctx, [x + 0.38, y - 0.32, RV], [x + 0.38, y + 0.32, RV], '#5e4330', 1.6);
      I.obox(ctx, x, y, bett, 1, 0, WL, WB, 0.09, '#87643b');                    // Wagenbett
      for (const sv2 of [-1, 1]) I.obox(ctx, x, y + sv2 * (WB / 2 - 0.03), bett + 0.09, 1, 0, WL, 0.06, 0.2, '#8e6d42');
      for (const su of [-1, 1]) I.obox(ctx, x + su * (WL / 2 - 0.03), y, bett + 0.09, 1, 0, 0.06, WB, 0.22, '#8a6a43');
      // Plane über Spriegeln: Umriss aus hinterem und vorderem Bogen, dann die Rippen darüber
      const zs = bett + 0.29, RB = 0.31, bogen = (u) => { const o = []; for (let k = 0; k <= 8; k++) { const a = Math.PI * k / 8; o.push([x + u, y + Math.cos(a) * RB, zs + Math.sin(a) * RB]); } return o; };
      const hinten = bogen(-WL / 2 + 0.02), vorn = bogen(WL / 2 - 0.02);
      I.poly(ctx, hinten.concat(vorn.slice().reverse()), '#d8ceae', 'rgba(60,45,25,0.35)', 0.7);
      I.poly(ctx, vorn.concat([[vorn[8][0], vorn[8][1], zs], [vorn[0][0], vorn[0][1], zs]]), '#c7bc9c', 'rgba(60,45,25,0.4)', 0.7);
      for (const u of [-0.36, -0.12, 0.12, 0.36]) { const b = bogen(u); ctx.strokeStyle = 'rgba(70,52,30,0.35)'; ctx.lineWidth = 0.8; ctx.beginPath(); for (let k = 0; k <= 5; k++) { const q = I.p(...b[k]); k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); } ctx.stroke(); }
      // Vorderer Einstieg: dunkle Öffnung, Plane seitlich aufgebunden
      const oe = []; for (let k = 1; k <= 7; k++) { const a = Math.PI * k / 8; oe.push([vorn[0][0] + 0.005, y + Math.cos(a) * RB * 0.62, zs + Math.sin(a) * RB * 0.62]); }
      I.poly(ctx, oe.concat([[oe[6][0], oe[6][1], zs + 0.02], [oe[0][0], oe[0][1], zs + 0.02]]), '#3a2f24');
      I.line(ctx, [vorn[0][0], y + RB * 0.62, zs + 0.02], [vorn[0][0], y + RB * 0.9, zs + 0.2], '#b9ae90', 2.2);
      rad(-0.36, 0.32, RH); rad(0.38, 0.32, RV);                                 // nahe Räder
      // Deichsel abgelegt: vom Vorderwagen zum Boden
      for (const v of [-0.09, 0.09]) I.line(ctx, [x + WL / 2 - 0.05, y + v, bett], [x + WL / 2 + 0.42, y + v * 0.4, 0.03], '#6f5236', 1.7);
      I.line(ctx, [x + WL / 2 + 0.42, y - 0.06, 0.03], [x + WL / 2 + 0.42, y + 0.06, 0.03], '#6f5236', 1.7);
      if (nacht) { const lp = I.p(vorn[0][0], y + RB, zs + 0.05); ctx.fillStyle = 'rgba(255,190,90,0.85)'; ctx.beginPath(); ctx.arc(lp[0], lp[1], 2.4, 0, 6.28); ctx.fill(); this.lamps.push([lp[0], lp[1]]); }
    });

    /* --- Ochsen, ausgespannt: grasen mit gesenktem Kopf, Schwanz schlägt --- */
    const ochse = (ox, oy, ph, k) => stelle(k, () => {
      if (!pk) { const sp = I.p(ox, oy, 0); ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(sp[0], sp[1] + 1, 15, 5, 0, 0, 6.28); ctx.fill(); }
      for (const [lu, lv] of [[-0.17, -0.09], [-0.17, 0.09], [0.15, -0.09], [0.15, 0.09]]) I.line(ctx, [ox + lu, oy + lv, 0], [ox + lu, oy + lv, 0.2], '#5a3d2c', 2);
      I.obox(ctx, ox, oy, 0.18, 1, 0, 0.5, 0.27, 0.28, '#7a5443');
      I.obox(ctx, ox - 0.1, oy, 0.44, 1, 0, 0.3, 0.2, 0.05, '#6e4a3b');                 // Widerrist
      const kx = ox + 0.34, kz = 0.1 + Math.abs(Math.sin(t * 1.0472 + ph)) * 0.05;     // Kopf gesenkt, kaut
      I.line(ctx, [ox + 0.22, oy, 0.4], [kx - 0.02, oy, kz + 0.16], '#74503f', 5);        // Hals
      I.obox(ctx, kx, oy, kz, 1, 0, 0.2, 0.15, 0.17, '#6f4a3a');
      I.obox(ctx, kx + 0.08, oy, kz, 1, 0, 0.07, 0.12, 0.09, '#9c8676');                 // helles Maul
      for (const hv of [-1, 1]) I.line(ctx, [kx - 0.04, oy + hv * 0.06, kz + 0.17], [kx - 0.02, oy + hv * 0.13, kz + 0.27], '#e6dcc4', 1.5);
      const sw = Math.sin(t * 3.1416 + ph) * 0.06;
      I.line(ctx, [ox - 0.25, oy, 0.4], [ox - 0.33, oy + sw, 0.14], '#4e3324', 1.3);
    });
    ochse(x + 0.6, y + 0.8, 0, 1.4); ochse(x + 1.0, y + 1.0, 1.7, 2.0);
    stelle(2.1, () => {                                                             // Pflock mit Stricken
      I.line(ctx, [x + 0.85, y + 1.28, 0], [x + 0.85, y + 1.28, 0.28], '#5e4330', 2.2);
      I.line(ctx, [x + 0.85, y + 1.28, 0.24], [x + 0.92, y + 0.82, 0.14], 'rgba(120,100,70,0.8)', 0.8);
      I.line(ctx, [x + 0.85, y + 1.28, 0.24], [x + 1.32, y + 1.02, 0.14], 'rgba(120,100,70,0.8)', 0.8);
    });

    /* --- Lagerfeuer mit Steinring, Flammen, Rauch --- */
    const fx = x - 0.35, fy = y + 1.0;
    stelle(0.65, () => {
      const fp = I.p(fx, fy, 0);
      if (!pk) { ctx.fillStyle = 'rgba(40,30,20,0.35)'; ctx.beginPath(); ctx.ellipse(fp[0], fp[1], 9, 4, 0, 0, 6.28); ctx.fill(); }
      for (let k = 0; k < 7; k++) { const a = k / 7 * 6.283, q = I.p(fx + Math.cos(a) * 0.14, fy + Math.sin(a) * 0.14, 0); ctx.fillStyle = k % 2 ? '#6e6a62' : '#7d786e'; ctx.beginPath(); ctx.ellipse(q[0], q[1], 2.2, 1.5, 0, 0, 6.28); ctx.fill(); }
      I.line(ctx, [fx - 0.09, fy - 0.05, 0.02], [fx + 0.09, fy + 0.04, 0.05], '#4f3620', 2.2);
      I.line(ctx, [fx + 0.07, fy - 0.07, 0.02], [fx - 0.08, fy + 0.07, 0.05], '#5a3f26', 2.2);
      if (!pk) {
        const f1 = 0.75 + Math.sin(t * 12.566) * 0.2, f2 = 0.7 + Math.sin(t * 18.85 + 1) * 0.25;
        const zunge = (dx, h, w, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(fp[0] + dx - w, fp[1] - 1); ctx.quadraticCurveTo(fp[0] + dx - w * 0.3, fp[1] - h * 0.55, fp[0] + dx, fp[1] - h); ctx.quadraticCurveTo(fp[0] + dx + w * 0.3, fp[1] - h * 0.55, fp[0] + dx + w, fp[1] - 1); ctx.closePath(); ctx.fill(); };
        zunge(-1.5, 9 * f1, 3.2, 'rgba(255,120,30,0.85)'); zunge(1.5, 8 * f2, 2.8, 'rgba(255,150,40,0.85)'); zunge(0, 5.5 * f1, 1.8, 'rgba(255,225,120,0.9)');
        for (let k = 0; k < 3; k++) { const a = ((t * 0.5 + k / 3) % 1); ctx.fillStyle = `rgba(150,150,150,${0.28 * (1 - a)})`; ctx.beginPath(); ctx.arc(fp[0] + Math.sin(a * 6 + k) * 2.5, fp[1] - 10 - a * 22, 1.8 + a * 3.5, 0, 6.28); ctx.fill(); }
        if (nacht) { ctx.fillStyle = `rgba(255,150,50,${0.55 + Math.sin(t * 12.566) * 0.15})`; ctx.beginPath(); ctx.ellipse(fp[0], fp[1] - 4, 5, 7, 0, 0, 6.28); ctx.fill(); this.lamps.push([fp[0], fp[1] - 3, 'fire']); }
      }
    });

    /* --- Mannschaft --- */
    stelle(0.5, () => {                                                             // sitzt am Feuer, ein Klotz davor
      const sp = I.p(x - 0.65, y + 1.15, 0);
      this.drawPerson(ctx, sp[0], sp[1] - 2, '#6f5a3e', 'merchant', 1, false, '#d2aa91', 0, 1, null, null, 0.8);
      I.obox(ctx, x - 0.63, y + 1.23, 0, 0.8, 0.6, 0.26, 0.09, 0.1, '#6a4b30');
    });
    stelle(1.65, () => { const sp = I.p(x + 0.4, y + 1.25, 0); this.drawPerson(ctx, sp[0], sp[1], '#7b5f47', 'citizen', 1, false, '#dcc3aa', 0, -1, null, { hat: true }, 0.88); });
    // Only actual offered goods remain beside the wagon. Transport workers
    // are scene actors driven by completed purchases and sales.
    const parcels = Object.entries(visitor?.cargo || {}).filter(([g, c]) => c.qty > 0).slice(0, 3);
    parcels.forEach(([good], i) => stelle(-0.45 + i * 0.2, () => this.drawCargo(ctx, x - 1.05 + (i % 2) * 0.32, y + 0.32 + Math.floor(i / 2) * 0.32, 0, { good, kind: HK.cargoKind(good) })));

    teile.sort((a, b) => a.k - b.k);
    for (const tl of teile) tl.f();
  },
  /* Ein Karren, frei gedreht: Bett zwischen zwei Speichenrädern, Deichsel, Zieher davor.
     Die Ausrichtung kommt als Winkel, damit der Karren beim Abbiegen mitdreht statt zu springen. */
  barrowLayout(x, y, ang, o = {}) {
    const dx = Math.cos(ang), dy = Math.sin(ang), at = (u, v) => [x + dx * u - dy * v, y + dy * u + dx * v];
    const box = points => [Math.min(...points.map(p => p[0])), Math.min(...points.map(p => p[1])), Math.max(...points.map(p => p[0])), Math.max(...points.map(p => p[1]))];
    const half = o.ox ? .29 : .35, back = o.ox ? -.36 : -.4;
    const body = [[back, -half], [.56, -half], [.56, half], [back, half]].map(p => at(...p));
    const actor = o.actorPos || (o.loading ? [x - .58, y + .08] : at(o.ox ? .92 : .68, 0));
    const adx = Math.cos(o.actorHead ?? ang), ady = Math.sin(o.actorHead ?? ang);
    const actorHull = o.ox ? [[-.17, -.2], [.36, -.2], [.36, .2], [-.17, .2]].map(([u, v]) => [actor[0] + adx * u - ady * v, actor[1] + ady * u + adx * v])
      : [[actor[0] - .1, actor[1] - .1], [actor[0] + .1, actor[1] - .1], [actor[0] + .1, actor[1] + .1], [actor[0] - .1, actor[1] + .1]];
    return { body, actor, actorHull, bodyBox: box(body), actorBox: box(actorHull) };
  },
  drawOx(ctx, x, y, z, heading, phase = 0, moving = false) {
    const dx = Math.cos(heading), dy = Math.sin(heading);
    const W = (u, v, h) => [x + dx * u - dy * v, y + dy * u + dx * v, z + h];
    const P = (u, v, h) => I.p(...W(u, v, h));
    const stroke = (points, color, width) => {
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath();
      points.forEach((p, i) => i ? ctx.lineTo(...P(...p)) : ctx.moveTo(...P(...p))); ctx.stroke();
    };
    // Der Rundkörper folgt der isometrischen Projektion seiner Längs- und
    // Querachse. Er bleibt im bereits geprüften Grundriss des Gespanns.
    const oval = (u, v, h, length, width, height, color) => {
      const center = P(u, v, h), ax = P(u + length, v, h), ay = P(u, v + width, h);
      const vx = [ax[0] - center[0], ax[1] - center[1]], vy = [ay[0] - center[0], ay[1] - center[1]];
      const xx = vx[0] ** 2 + vy[0] ** 2, xy = vx[0] * vx[1] + vy[0] * vy[1], yy = vx[1] ** 2 + vy[1] ** 2 + (height * I.ZS) ** 2;
      const angle = .5 * Math.atan2(2 * xy, xx - yy), delta = Math.hypot(xx - yy, 2 * xy);
      ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(...center, Math.sqrt((xx + yy + delta) / 2), Math.sqrt(Math.max(0, (xx + yy - delta) / 2)), angle, 0, Math.PI * 2); ctx.fill();
    };
    if (!this.picking) oval(0, 0, .005, .18, .12, 0, 'rgba(0,0,0,.2)');
    const stride = moving ? Math.sin(phase) * .032 : 0, lift = moving ? Math.abs(Math.sin(phase)) * .009 : 0;
    const leg = (u, side, front) => {
      const step = stride * side * (front ? 1 : -1);
      stroke([[u, side * .075, .27 + lift], [u + step * .45, side * .09, .13], [u + step, side * .1, .025]], side * (dx - dy) < 0 ? '#543c2d' : '#73523a', 1.65);
      stroke([[u + step - .012, side * .1, .016], [u + step + .024, side * .1, .016]], '#392e25', 1.9);
    };
    const far = dx - dy >= 0 ? -1 : 1, facingNear = dx + dy >= 0;
    leg(-.11, far, false); leg(.11, far, true);
    const tail = () => stroke([[-.15, 0, .38], [-.165, .015 + (moving ? Math.sin(phase * .5) * .012 : 0), .16]], '#5d4230', 1.1);
    const head = () => {
      oval(.16, 0, .39 + lift, .09, .08, .09, '#7e583c');
      // Breite Stirn, seitliche Ohren, helle gebogene Hörner und stumpfes Maul.
      oval(.235, 0, .4 + lift, .075, .07, .072, '#8c694a');
      for (const side of [-1, 1]) {
        oval(.205, side * .095, .42 + lift, .035, .045, .016, '#765238');
        stroke([[.215, side * .055, .455 + lift], [.21, side * .12, .47 + lift], [.24, side * .155, .505 + lift]], '#e5d7b3', 1.25);
      }
      oval(.305, 0, .35 + lift, .05, .065, .035, '#c0a487');
      const eye = P(.25, -far * .057, .423 + lift); ctx.fillStyle = '#29251d'; ctx.beginPath(); ctx.arc(...eye, .55, 0, Math.PI * 2); ctx.fill();
      const nose = P(.342, -far * .03, .363 + lift); ctx.fillStyle = '#5b4938'; ctx.beginPath(); ctx.arc(...nose, .5, 0, Math.PI * 2); ctx.fill();
    };
    if (!facingNear) head(); else tail();
    oval(-.015, 0, .32 + lift, .155, .115, .115, '#896544');
    oval(.075, 0, .36 + lift, .095, .105, .095, '#98704b');
    // Widerrist, Joch und Hals verbinden das Tier mit dem Zuggeschirr.
    stroke([[.09, -.115, .41 + lift], [.09, .115, .41 + lift]], '#b08b53', 1.8);
    stroke([[.09, -.09, .38], [-.14, -.09, .3]], '#4f4130', .8);
    stroke([[.09, .09, .38], [-.14, .09, .3]], '#4f4130', .8);
    leg(-.11, -far, false); leg(.11, -far, true);
    if (facingNear) head(); else tail();
  },
  drawBarrow(ctx, x, y, z0, ang, o, part = 'all') {
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    const at = (u, v) => [x + dx * u + nx * v, y + dy * u + ny * v];
    const L = o.ox ? 0.72 : 0.8, Wd = o.ox ? 0.42 : 0.64, R = o.ox ? 0.22 : 0.23, az = o.ox ? 0.22 : 0.23;
    if (part !== 'actor') {
      if (!this.picking) { const sp = I.p(x, y, z0); ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(sp[0], sp[1] + 2, 16, 6, 0, 0, 6.28); ctx.fill(); }
      const off = Wd / 2 + (o.ox ? 0.08 : 0.03), spin = o.spin || 0;
      const wp = [at(-0.02, -off), at(-0.02, off)];
      const near = (wp[0][0] + wp[0][1]) >= (wp[1][0] + wp[1][1]) ? 0 : 1;
      const wheel = (i) => this.isoWheel(ctx, wp[i][0], wp[i][1], z0 + az, R, dx, dy, spin);
      wheel(1 - near);
      I.line(ctx, [wp[0][0], wp[0][1], z0 + az], [wp[1][0], wp[1][1], z0 + az], '#6a4d33', 1.6);
      I.obox(ctx, x, y, z0 + az - 0.01, dx, dy, L, Wd, 0.07, '#87643b');
      const bh = 0.16, side = Wd / 2 - 0.025;
      for (const sv of [-side, side]) { const c = at(0, sv); I.obox(ctx, c[0], c[1], z0 + az + 0.06, dx, dy, L, 0.05, bh, '#8e6d42'); }
      const hb = at(-L / 2 + 0.03, 0); I.obox(ctx, hb[0], hb[1], z0 + az + 0.06, dx, dy, 0.05, Wd, bh + 0.03, '#8a6a43');
      (o.items || []).forEach((it, i) => { const places = [[-0.18, -0.14], [0.14, -0.14], [-0.02, 0.16]], c = at(...places[i % 3]); this.drawCargo(ctx, c[0], c[1], z0 + az + 0.06, it, 1, ang); });
      if (o.hay) { const c = at(0, 0); I.obox(ctx, c[0], c[1], z0 + az + 0.06, dx, dy, L * 0.78, Wd * 0.78, 0.2, '#bda061'); }
      for (const v of [-0.11, 0.11]) { const a0 = at(0.3, v), a1 = at(0.56, v * 0.5); I.line(ctx, [a0[0], a0[1], z0 + az + 0.04], [a1[0], a1[1], z0 + 0.38], '#7a5e40', 1.6); }
      wheel(near);
    }
    if (part === 'body') return;
    const m = this.barrowLayout(x, y, ang, o).actor;
    if (o.ox) {
      this.drawOx(ctx, m[0], m[1], z0, o.actorHead ?? ang, o.phase, !o.still);
    } else {
      const mp = I.p(m[0], m[1], z0);
      this.drawPerson(ctx, mp[0], mp[1], o.color, 'porter', ctx.globalAlpha, false, o.skin, o.still ? 0 : o.phase, (dx - dy) >= 0 ? 1 : -1, null, { head: o.actorHead ?? ang }, 0.88);
    }
  },
  drawCart(ctx, wx, wy, c, t, part = 'all') {
    this.drawBarrow(ctx, wx, wy, 0, c.head != null ? c.head : 0, { ox: c.ox, items: c.items || [], actorPos: c.actorPos, actorHead: c.actorHead, color: '#627350', skin: '#dcc3aa', phase: c.moving ? t * 9 : 0, spin: c.wheelSpin, still: !c.moving }, part);
  },
  drawPortCart(ctx, x, y, z0, w, t, part = 'all') {
    this.drawBarrow(ctx, x, y, z0, w.head != null ? w.head : 0, { items: w.items, color: w.color, skin: w.skin, phase: w.phase, spin: w.wheelSpin, still: !w.moving, loading: w.state === 'lift', actorHead: w.pushing ? w.head + Math.PI : w.head }, part);
  },
  drawChicken(ctx, x, y, phase, heading = 0, moving = false, peck = false) {
    const dx = Math.cos(heading), dy = Math.sin(heading), stride = moving ? Math.sin(phase) * 0.04 : 0;
    const P = (u, v, z) => [x + ((u * dx - v * dy) - (u * dy + v * dx)) * I.TW, y + ((u * dx - v * dy) + (u * dy + v * dx)) * I.TH - z * I.ZS];
    ctx.strokeStyle = '#8b7049'; ctx.lineWidth = 0.65;
    for (const side of [-1, 1]) { const foot = P(side * stride, side * 0.035, 0), hip = P(0, side * 0.035, 0.08); ctx.beginPath(); ctx.moveTo(...hip); ctx.lineTo(...foot); ctx.lineTo(...P(side * stride + 0.03, side * 0.035, 0)); ctx.stroke(); }
    const tail = [P(-0.08, 0, 0.12), P(-0.16, -0.035, 0.18), P(-0.15, 0.035, 0.14)];
    ctx.fillStyle = '#d4c9ad'; ctx.beginPath(); tail.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.fill();
    const body = P(0, 0, 0.1 + (moving ? Math.abs(Math.sin(phase)) * 0.012 : 0));
    const angle = Math.atan2((dx + dy) * I.TH, (dx - dy) * I.TW);
    ctx.fillStyle = '#e7dfca'; ctx.beginPath(); ctx.ellipse(...body, 3.2, 2.05, angle, 0, Math.PI * 2); ctx.fill();
    const head = P(0.105, 0, peck ? 0.045 : 0.18), beak = P(0.175, 0, peck ? 0.03 : 0.165);
    ctx.fillStyle = '#f0e8d3'; ctx.beginPath(); ctx.arc(...head, 1.35, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ad8b4d'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(...head); ctx.lineTo(...beak); ctx.stroke();
    ctx.fillStyle = '#a24c3c'; ctx.fillRect(head[0] - 0.6, head[1] - 2.1, 1.2, 1.1);
    ctx.fillStyle = '#4c4333'; ctx.beginPath(); ctx.arc(head[0] + (dx - dy >= 0 ? 0.6 : -0.6), head[1] - 0.2, 0.35, 0, Math.PI * 2); ctx.fill();
  },
  /* Reiter: Pferd als Körper mit Beinen, darauf der Ritter */
  drawHorseman(ctx, x, y, dir, color) {
    ctx.save(); ctx.translate(x, y); const d = dir || 1;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, 1, 11, 3, 0, 0, 6.28); ctx.fill();
    ctx.strokeStyle = '#62472c'; ctx.lineWidth = 2; ctx.beginPath(); for (const lx of [-6, -3, 4, 7]) { ctx.moveTo(lx, -6); ctx.lineTo(lx + (lx < 0 ? -1 : 1), 0); } ctx.stroke();
    ctx.fillStyle = color || '#754d30'; ctx.beginPath(); ctx.ellipse(0, -9, 10, 4.5, 0, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.moveTo(8 * d, -11); ctx.lineTo(13 * d, -17); ctx.lineTo(15 * d, -14); ctx.lineTo(11 * d, -9); ctx.fill();
    ctx.fillStyle = '#593e24'; ctx.beginPath(); ctx.moveTo(9 * d, -12); ctx.lineTo(12 * d, -19); ctx.lineTo(13 * d, -17); ctx.fill();
    ctx.strokeStyle = '#593e24'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-10 * d, -9); ctx.lineTo(-14 * d, -3); ctx.stroke();
    ctx.fillStyle = '#9f4141'; ctx.fillRect(-4, -11, 8, 3);
    ctx.restore();
    this.drawPerson(ctx, x, y - 10, '#8a8a94', 'knight', 1, false, '#dcc3aa', 0, d, null, null, 0.85);
  },
  drawPerson(ctx, x, y, color, type, alpha, hover, skin, phase, dir, person, w, forceScale) {
    const look = (person && HK.NAMED_LOOKS?.[person]) || w?.look, d = forceScale || 0.9;
    const heading = w?.head, front = heading == null ? 1 : (Math.cos(heading) + Math.sin(heading)) / Math.SQRT2;
    if (heading != null) dir = Math.cos(heading) - Math.sin(heading) >= 0 ? 1 : -1;
    const side = heading == null ? dir || 1 : Math.sign(Math.cos(heading) - Math.sin(heading)) || 1, profile = Math.abs(front) < 0.4;
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(d * (type === 'child' ? 0.7 : look?.width || 1), d * (type === 'child' ? 0.7 : 1));
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(1, 1, 5, 2, 0, 0, 6.28); ctx.fill();
    if (hover) { ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, -9, 11, 0, 6.28); ctx.stroke(); }
    const seated=w?.seated||0;
    const step = Math.sin(phase || 0) * 1.65*(1-seated);
    const forwardX=heading==null?dir||1:(Math.cos(heading)-Math.sin(heading))/Math.SQRT2;
    const forwardY=heading==null?0:(Math.cos(heading)+Math.sin(heading))*.23;
    const sx=step*forwardX,sy=step*forwardY;
    // Short, rounded legs and flat shoe silhouettes remain readable from the
    // front too. Projecting a shoe as a line made it look like an extra shin.
    for(const leg of [-1.4,1.4]){
      const sign=leg<0?1:-1,swing=Math.sin((phase||0)+(sign<0?Math.PI:0));
      const lift=Math.max(0,swing)*.7*(1-seated);
      const ax=leg-2*seated+sign*sx,ay=-.55-4*seated+sign*sy-lift;
      const kx=leg-seated+sign*sx*.5+forwardX*lift*.35,ky=-2.8-2*seated+sign*sy*.4-lift*.45;
      ctx.strokeStyle='#65513e';ctx.lineWidth=2.1;ctx.lineCap='round';ctx.lineJoin='round';
      ctx.beginPath();ctx.moveTo(leg,-5.2-3*seated);ctx.lineTo(kx,ky);ctx.lineTo(ax,ay);ctx.stroke();
      ctx.fillStyle='#40392e';ctx.beginPath();
      ctx.ellipse(ax+forwardX*.35,ay+.22,1.25+Math.abs(forwardX)*.4,.65,0,0,Math.PI*2);ctx.fill();
    }
    ctx.lineCap='butt';ctx.lineJoin='miter';
    ctx.translate(0,-3*seated);
    if(w?.toolArms)ctx.transform(1,0,-(w.workLean||0),1,0,w.workBend||0);
    const shoulder = profile ? 2.1 : 3, hem = look?.dress?(profile?4:5.5):profile?3.4:5, hemY=look?.dress?-1.4-2*seated:-4;
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-shoulder, -13); ctx.lineTo(shoulder, -13); ctx.lineTo(hem, hemY); ctx.lineTo(-hem, hemY); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(-3, -13, 2.5, look?.dress?10.5:9);
    if(look?.dress){ctx.strokeStyle='rgba(40,30,25,.22)';ctx.lineWidth=.5;for(const px of [-2,1.5]){ctx.beginPath();ctx.moveTo(px*.5,-7);ctx.lineTo(px,hemY);ctx.stroke();}}
    if (look) {
      ctx.fillStyle = look.trim || '#b29a72'; ctx.fillRect(-shoulder, -12.8, shoulder*2, 1);
      ctx.fillStyle = '#65533e'; ctx.fillRect(-3.5, -8, 7, .9);
      if (look.apron && front >= -.4) {
        ctx.fillStyle = look.apron; ctx.beginPath();ctx.moveTo(-1.6,-12);ctx.lineTo(1.6,-12);ctx.lineTo(3.2,look.dress?hemY-.4:-4.5);ctx.lineTo(-3.2,look.dress?hemY-.4:-4.5);ctx.closePath();ctx.fill();
      }
      if (front >= -.4) { ctx.fillStyle=look.trim || '#b29a72'; for(let k=0;k<3;k++)ctx.fillRect(.3,-11+k*1.6,.65,.65); }
    }
    if (type === 'monk') { ctx.strokeStyle = '#d8c9a1'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-4, -8); ctx.lineTo(4, -8); ctx.stroke(); }
    if (type === 'guard') { ctx.fillStyle = '#9a9aa0'; ctx.fillRect(-3, -13, 6, 5); ctx.strokeStyle = '#736250'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(5, -24); ctx.stroke(); ctx.fillStyle = '#8a8a90'; ctx.beginPath(); ctx.moveTo(5, -24); ctx.lineTo(3.5, -20); ctx.lineTo(6.5, -20); ctx.fill(); }
    if (type === 'beggar') { ctx.strokeStyle = '#736250'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-4, -14); ctx.stroke(); }
    if (type === 'pilgrim') { ctx.strokeStyle = '#84623f'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(6 * (dir || 1), 1); ctx.lineTo(5 * (dir || 1), -22); ctx.stroke(); ctx.fillStyle = '#cfc189'; ctx.beginPath(); ctx.arc(-1.5, -10, 1.3, 0, 6.28); ctx.fill(); }
    if (type === 'torch') { const f = 0.7 + Math.sin((phase || 0) * 3 + x) * 0.3; ctx.strokeStyle = '#74552f'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(5 * (dir || 1), -6); ctx.lineTo(7 * (dir || 1), -20); ctx.stroke(); ctx.fillStyle = 'rgba(255,150,40,' + (0.25 * f) + ')'; ctx.beginPath(); ctx.arc(7 * (dir || 1), -22, 6, 0, 6.28); ctx.fill(); ctx.fillStyle = '#d1bd8e'; ctx.beginPath(); ctx.ellipse(7 * (dir || 1), -22, 2, 3.2 * f, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = '#be8961'; ctx.beginPath(); ctx.ellipse(7 * (dir || 1), -21, 1.2, 2, 0, 0, 6.28); ctx.fill(); }
    if (type === 'knight') { ctx.fillStyle = '#9f4141'; ctx.beginPath(); ctx.ellipse(-4 * (dir || 1), -8, 3, 4, 0, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#e1d5b7'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-4 * (dir || 1), -11); ctx.lineTo(-4 * (dir || 1), -5); ctx.stroke(); ctx.strokeStyle = '#736250'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(5 * (dir || 1), 0); ctx.lineTo(5 * (dir || 1), -34); ctx.stroke(); ctx.fillStyle = '#bfa361'; ctx.beginPath(); ctx.moveTo(5 * (dir || 1), -34); ctx.lineTo(5 * (dir || 1) + 9 * (dir || 1), -31); ctx.lineTo(5 * (dir || 1), -28); ctx.fill(); }
    if (w && w.basket) { ctx.fillStyle = '#b8a070'; ctx.beginPath(); ctx.ellipse(5 * (dir || 1), -6, 3, 2.5, 0, 0, 6.28); ctx.fill(); }
    if (w && w.items && w.items.length && !w.cart) {
      ctx.save(); ctx.translate(5 * (dir || 1) - I.OX, -8.5 - I.OY);
      this.drawCargo(ctx, 0, 0, 0, w.items[0], 1 / d); ctx.restore();
    }
    const gesture = w?.gesture || 0, working = look && w?.working, lift = Math.sin(gesture)*1.1;
    const handY = working ? -9.5 + lift : -6;
    if(!w?.toolArms){
    ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.beginPath();
    ctx.moveTo(-3,-12);ctx.lineTo(working?-.7:w?.items?.length?2*(dir||1):-4-step*.4,working?handY:w?.items?.length?-9:-6);
    ctx.moveTo(3,-12);ctx.lineTo(working?4:w?.items?.length?8*(dir||1):4+step*.4,working?handY-1:w?.items?.length?-9:-6);ctx.stroke();
    }
    if(working && front>=-.4) {
      ctx.fillStyle=skin||'#dcc3aa';ctx.beginPath();ctx.arc(-.7,handY,.85,0,Math.PI*2);ctx.arc(4,handY-1,.85,0,Math.PI*2);ctx.fill();
      if(look.action==='book'||look.action==='ledger') {
        ctx.fillStyle=look.action==='book'?'#765444':'#a58b61';ctx.fillRect(-1.3,handY-2,6.2,3.8);
        ctx.fillStyle='#d6caa8';ctx.fillRect(-.8,handY-1.6,5.2,2.8);
        ctx.strokeStyle='#8c795b';ctx.lineWidth=.45;ctx.beginPath();ctx.moveTo(1.8,handY-1.6);ctx.lineTo(1.8,handY+1.2);ctx.stroke();
        if(look.action==='ledger'){ctx.strokeStyle='#eee1bb';ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(3,handY);ctx.lineTo(5+lift*.4,handY-4);ctx.stroke();}
      } else if(look.action==='mug') {
        ctx.fillStyle='#a88b5c';ctx.fillRect(.4,handY-2.2,2.5,3.2);ctx.strokeStyle='#d2bc91';ctx.lineWidth=.65;ctx.beginPath();ctx.arc(3.1,handY-.8,1, -Math.PI/2,Math.PI/2);ctx.stroke();
        ctx.fillStyle='#c8c1a8';ctx.fillRect(2.1+lift*.4,handY-2.3,1.8,1.1);
      } else if(look.action==='coins') {
        ctx.fillStyle='#806344';ctx.beginPath();ctx.ellipse(1,handY+.5,2.3,1.2,0,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#ccb474';for(let k=0;k<3;k++){ctx.beginPath();ctx.arc(k*.9,handY,.55,0,Math.PI*2);ctx.fill();}
        ctx.beginPath();ctx.arc(3.5,handY-1.4,.65,0,Math.PI*2);ctx.fill();
      } else if(look.action==='measure') {
        ctx.strokeStyle='#c4aa72';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-1,handY+.6);ctx.lineTo(5,handY-1.5);ctx.stroke();
        ctx.strokeStyle='#6b6559';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(3,handY-1);ctx.lineTo(2,handY-3);ctx.stroke();
      }
    }
    ctx.fillStyle = skin || '#dcc3aa'; ctx.beginPath(); ctx.arc(0, -16, 3.2, 0, 6.28); ctx.fill();
    if (look && front >= -.4) {
      ctx.fillStyle=look.hair;ctx.beginPath();ctx.arc(0,-16.6,3.25,Math.PI,Math.PI*2);ctx.lineTo(2.8,-17.4);ctx.lineTo(-2.8,-17.4);ctx.fill();
      ctx.fillRect(-3,-17.5,.8,2.6);
    }
    {
      if (front < -0.4) { ctx.fillStyle = look?.hair || '#65513e'; ctx.beginPath(); ctx.arc(0, -16.5, 3.3, Math.PI, Math.PI * 2); ctx.lineTo(2.7, -14); ctx.lineTo(-2.7, -14); ctx.fill(); ctx.strokeStyle = 'rgba(31,26,19,.3)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, -5); ctx.stroke(); }
      else { ctx.fillStyle = '#514639'; ctx.fillRect(profile ? side * 1.6 : -1.2, -17, 0.65, 0.7); if (!profile) ctx.fillRect(1.1, -17, 0.65, 0.7); if (profile) { ctx.fillStyle = skin || '#dcc3aa'; ctx.beginPath(); ctx.moveTo(side * 2.3, -17); ctx.lineTo(side * 4.1, -15.5); ctx.lineTo(side * 2.3, -14.8); ctx.fill(); } }
    }
    if(look && front>=-.4) {
      if(look.beard){ctx.fillStyle=look.hair;ctx.beginPath();ctx.moveTo(-2.4,-14.7);ctx.lineTo(2.4,-14.7);ctx.lineTo(look.beard==='full'?1:1.8,look.beard==='full'?-11.7:-13);ctx.lineTo(-1.7,-13);ctx.closePath();ctx.fill();
        if(look.beard==='moustache'){ctx.fillStyle=skin||'#dcc3aa';ctx.fillRect(-2,-13.8,4,1.8);}}
      ctx.strokeStyle='#967158';ctx.lineWidth=.45;ctx.beginPath();ctx.moveTo(profile?side*2:0,-16.3);ctx.lineTo(profile?side*2.5:.5,-15.2);ctx.stroke();
      ctx.strokeStyle='#765744';ctx.beginPath();ctx.moveTo(profile?side*1.6:-.8,-14);ctx.lineTo(profile?side*2.6:1,-14);ctx.stroke();
    }
    if (look) {
      ctx.fillStyle=look.cap==='bonnet'?'#ded5b9':look.cap==='hood'?color:look.trim||color;
      if(['coif','veil','braid'].includes(look.cap)){
        if(look.cap==='braid'){ctx.strokeStyle=look.hair;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(front<-.4?0:-2.7,-17);ctx.lineTo(front<-.4?0:-3.5,-10);ctx.stroke();ctx.fillStyle='#b99a63';ctx.fillRect(front<-.4?-1:-4.5,-10,2,.8);}
        else{ctx.fillStyle=look.cap==='veil'?'#c5bba0':'#e0d5bb';ctx.beginPath();ctx.arc(0,-16.8,3.8,Math.PI,2*Math.PI);ctx.lineTo(look.cap==='veil'?4.8:3.4,look.cap==='veil'?-11:-14);ctx.lineTo(2.5,-14.2);ctx.lineTo(2.5,-17.5);ctx.lineTo(-2.5,-17.5);ctx.lineTo(-2.5,-14.2);ctx.lineTo(look.cap==='veil'?-4.8:-3.4,look.cap==='veil'?-11:-14);ctx.closePath();ctx.fill();}
      }
      else if(look.cap==='beret'){ctx.beginPath();ctx.ellipse(-.5,-19.2,4.4,1.7,-.12,0,Math.PI*2);ctx.fill();ctx.fillStyle=color;ctx.fillRect(-3,-19.3,6,1);}
      else if(look.cap==='cap'){ctx.beginPath();ctx.arc(0,-18.5,3.3,Math.PI,0);ctx.fill();ctx.fillRect(-3.6,-18.7,7.2,1);}
      else if(look.cap==='bonnet'||look.cap==='hood'){ctx.beginPath();ctx.arc(0,-16.7,3.7,Math.PI,Math.PI*2);ctx.lineTo(3.7,-14);ctx.lineTo(2.7,-14);ctx.lineTo(2.7,-17.5);ctx.lineTo(-2.7,-17.5);ctx.lineTo(-2.7,-14);ctx.lineTo(-3.7,-14);ctx.closePath();ctx.fill();}
    }
    else if (type === 'monk') { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, -16.5, 3.8, Math.PI * 1.05, Math.PI * 1.95); ctx.fill(); }
    else if (type === 'merchant' || type === 'static' || (w && w.hat)) { ctx.fillStyle = person === 'priest' ? '#3e3e3e' : '#593e24'; ctx.fillRect(-4.5, -19.5, 9, 1.5); ctx.fillRect(-3, -23, 6, 4); }
    else if (type === 'fisher') { ctx.fillStyle = '#8a8a7a'; ctx.beginPath(); ctx.arc(0, -17, 3.6, Math.PI, 0); ctx.fill(); }
    else if (type === 'pilgrim') { ctx.fillStyle = '#66503a'; ctx.beginPath(); ctx.ellipse(0, -18.5, 6, 1.6, 0, 0, 6.28); ctx.fill(); ctx.beginPath(); ctx.arc(0, -19, 3, Math.PI, 0); ctx.fill(); }
    else if (type === 'knight') { ctx.fillStyle = '#9a9aa4'; ctx.beginPath(); ctx.arc(0, -16.5, 3.8, 0, 6.28); ctx.fill(); ctx.fillStyle = '#4c4c59'; ctx.fillRect(-3, -16.5, 6, 1.2); ctx.fillStyle = '#bf6161'; ctx.beginPath(); ctx.moveTo(-1, -20); ctx.lineTo(1, -20); ctx.lineTo(2, -25); ctx.lineTo(-2, -25); ctx.fill(); }
    else if (type === 'torch') { ctx.fillStyle = '#c8b890'; ctx.beginPath(); ctx.arc(0, -16.5, 3.6, Math.PI * 1.1, Math.PI * 1.9); ctx.fill(); }
    else if (type === 'citizen') { ctx.fillStyle = '#e8e0c8'; ctx.beginPath(); ctx.arc(0, -16.5, 3.6, Math.PI * 1.1, Math.PI * 1.9); ctx.fill(); }
    if (person === 'priest') { ctx.fillStyle = '#f0ece0'; ctx.fillRect(-2.5, -13, 5, 1.5); }
    if (person === 'mayor') { ctx.fillStyle = '#bfa361'; ctx.fillRect(-3, -11, 6, 1.5); }
    ctx.restore();
  },
});
