/* Material studies from Havenrode, redrawn in Sundhaven's world coordinates.
   Geometry stays compatible with Pixi's retained shapes, night emission and picking.
   Cosmetic variation is deterministic and never consumes the simulation's random stream. */
'use strict';
HK.Art = {
  noise(x, y) { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); },
  mix(a, b, t) { return a.map((v, i) => v + (b[i] - v) * t); },
  brick(ctx, point, width, z0, height) {
    if (HK.Scene.picking) return;
    const course = 0.105, block = 0.25, mortar = [], edges = [];
    for (let row = 0, z = z0; z < z0 + height; row++, z += course) {
      const top = Math.min(z + course, z0 + height);
      if (row) mortar.push([point(0, z), point(width, z)]);
      for (let u = -(row % 2) * block / 2; u < width; u += block) {
        const left = Math.max(0, u), right = Math.min(width, u + block);
        if (u > 0) edges.push([point(u, z), point(u, top)]);
        const n = this.noise(u + width, z * 3);
        if (n < 0.35) HK.Iso.poly(ctx, [point(left + 0.015, z + 0.012), point(right - 0.012, z + 0.012), point(right - 0.012, top - 0.015), point(left + 0.015, top - 0.015)], n < 0.15 ? 'rgba(66,43,31,0.1)' : 'rgba(223,179,123,0.09)');
      }
    }
    HK.Iso.lines(ctx, mortar, 'rgba(216,183,139,0.22)', 0.45);
    HK.Iso.lines(ctx, edges, 'rgba(60,45,34,0.16)', 0.4);
  },
  footing(ctx, b) {
    const I = HK.Iso, front = (u, z) => [b.x + u, b.y + b.d + 0.004, z], side = (u, z) => [b.x + b.w + 0.004, b.y + u, z];
    for (const [point, width, shade] of [[front, b.w, 1], [side, b.d, 0.8]]) {
      for (let u = 0; u < width; u += 0.24) {
        const end = Math.min(width, u + 0.23), n = this.noise(b.x + u, b.y), top = 0.1 + n * 0.04;
        I.poly(ctx, [point(u, 0.01), point(end, 0.01), point(end, top), point(u, top + 0.01)], I.shade(['#9b937c', '#b0a58b', '#8c8974'][Math.floor(n * 3)], shade));
      }
      I.line(ctx, point(0, b.h - 0.02), point(width, b.h - 0.02), 'rgba(216,197,155,0.24)', 0.65);
    }
  },
  pave(ctx, a, b, width) {
    const I = HK.Iso, dx = b[0] - a[0], dy = b[1] - a[1], length = Math.hypot(dx, dy);
    if (!length) return;
    const tx = dx / length, ty = dy / length, nx = -ty, ny = tx;
    const point = (along, across) => [a[0] + tx * along + nx * across, a[1] + ty * along + ny * across, 0];
    const step = 0.25, courses = Math.max(1, Math.round(width / 0.23)), rowWidth = width / courses;
    for (let row = 0; row < courses; row++) {
      const across = -width / 2 + row * rowWidth + 0.015;
      for (let u = -(row % 2) * step / 2; u < length; u += step) {
        const start = Math.max(0, u) + 0.015, end = Math.min(length, u + step) - 0.018;
        if (end <= start) continue;
        const n = this.noise(a[0] + u, a[1] + row), colors = this.pavingPalette ? this.pavingPalette((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) : ['#96927f', '#a39c85', '#888975', '#aaa28b', '#928d78'];
        I.poly(ctx, [point(start, across + n * 0.01), point(end, across), point(end - 0.005, across + rowWidth - 0.03), point(start + 0.007, across + rowWidth - 0.025)], colors[Math.floor(n * colors.length)]);
      }
    }
    // Drainage courses and cart wear stay on the paving, clear of houses and people.
    for (const across of [-width / 2 + 0.035, width / 2 - 0.035]) I.line(ctx, point(0, across), point(length, across), 'rgba(52,66,52,0.26)', 0.9);
    if (width > 0.65) for (const across of [-width * 0.22, width * 0.22]) I.line(ctx, point(0, across), point(length, across), 'rgba(73,67,46,0.12)', 1.3);
  },
};

{
  const I = HK.Iso, S = HK.Scene, A = HK.Art;
  Object.assign(I.LIGHT, { right: 0.78, roofR: 0.81, back: 0.74 });

  I.brickL = (ctx, x, y, d, z, w, h) => A.brick(ctx, (u, zz) => [x + u, y + d, zz], w, z, h);
  I.brickR = (ctx, x, w, y, z, d, h) => A.brick(ctx, (u, zz) => [x + w, y + u, zz], d, z, h);
  for (const name of ['stepGableL', 'stepGableR']) {
    const original = I[name];
    I[name] = function (ctx, ...args) {
      const pts = original.call(this, ctx, ...args), z0 = args[3];
      if (!S.picking) for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        if (a[2] <= z0 || Math.abs(a[2] - b[2]) > 1e-6) continue;
        const axis = name === 'stepGableL' ? 0 : 1;
        const start = Math.min(a[axis], b[axis]), width = Math.abs(a[axis] - b[axis]);
        if (!width) continue;
        // Texture each stair below its own horizontal edge. A rectangular
        // texture over the entire gable spills into the sky beside the roof.
        A.brick(ctx, (u, z) => axis === 0 ? [start + u, a[1], z] : [a[0], start + u, z], width, z0, a[2] - z0);
      }
      return pts;
    };
  }

  I.roofLines = function (ctx, quad, rows, dark, material) {
    if (S.picking) return;
    // Both orientations start at the ridge; courses follow the pitch rather than the screen.
    const q = Math.abs(quad[0][2] - quad[1][2]) < 0.001 ? quad : [quad[0], quad[3], quad[2], quad[1]];
    const point = (u, v) => A.mix(A.mix(q[0], q[1], u), A.mix(q[3], q[2], u), v);
    if (material === 'snow') return;
    if (material === 'thatch') {
      // Short overlapping reed bundles lie on the actual roof plane. No tile grid
      // or full-length bright stripes; the seed stays independent of game RNG.
      const length = Math.hypot(q[1][0]-q[0][0],q[1][1]-q[0][1]);
      const bundles = Math.max(12,Math.ceil(length/.025));
      const light=[],shadow=[];
      for(let row=1;row<8;row++) {
        const v=row/8;
        this.poly(ctx,[point(0,v-.024),point(1,v-.024),point(1,v),point(0,v)],'rgba(65,53,32,.06)');
      }
      for(let row=0;row<8;row++) for(let col=0;col<bundles;col++) {
        const n=A.noise(q[0][0]+col*.17,q[0][1]+row*.31);
        const u=(col+.18+n*.6)/bundles,v=(row+.12+n*.22)/8;
        const end=Math.min(.995,v+.065+n*.045);
        (n>.52?light:shadow).push([point(u,v),point(u+.002,end)]);
        if(n<.17) this.poly(ctx,[point(Math.max(0,u-.012),v),point(Math.min(1,u+.024),v),point(Math.min(1,u+.024),end),point(Math.max(0,u-.012),end)],'rgba(69,58,36,.06)');
      }
      this.lines(ctx,shadow,'rgba(65,53,32,.17)',.35);
      this.lines(ctx,light,'rgba(223,202,149,.18)',.35);
      // Dense rolled ridge and a substantial, softly broken reed eave.
      this.poly(ctx,[point(0,0),point(1,0),point(1,.055),point(0,.055)],'rgba(72,59,36,.2)');
      const lip=q.slice(2).map(p=>[p[0],p[1],p[2]-.035]);
      this.poly(ctx,[q[2],q[3],lip[1],lip[0]],'#786445');
      for(let i=0;i<bundles;i++) {
        const u=(i+.5)/bundles,a=point(u,.965),b=point(u,1);
        b[2]-=.015+A.noise(i,q[0][0])*.023;
        this.line(ctx,a,b,'rgba(194,174,121,.48)',.55);
      }
      return;
    }
    const p = this.p(...q[0]), end = this.p(...q[1]), cols = Math.max(3, Math.min(16, Math.round(Math.hypot(end[0] - p[0], end[1] - p[1]) / 6)));
    rows = rows || 7;
    const courses = [], joints = [], glints = [];
    for (let row = 0; row < rows; row++) {
      const v0 = row / rows, v1 = (row + 1) / rows;
      if (row) { courses.push([point(0, v0), point(1, v0)]); glints.push([point(0, v0 + 0.02), point(1, v0 + 0.02)]); }
      for (let col = 0; col < cols; col++) {
        const u0 = (col + (row % 2) * 0.5) / cols, u1 = Math.min(1, u0 + 1 / cols);
        if (u0 >= 1) continue;
        joints.push([point(u0, v0), point(u0, v1)]);
        const n = A.noise(q[0][0] + col, q[0][1] + row);
        if (n < 0.35) this.poly(ctx, [point(u0 + 0.008, v0 + 0.01), point(u1 - 0.008, v0 + 0.01), point(u1 - 0.008, v1 - 0.01), point(u0 + 0.008, v1 - 0.01)], n < 0.15 ? 'rgba(218,159,98,0.11)' : 'rgba(50,39,31,0.1)');
      }
    }
    this.lines(ctx, courses, 'rgba(48,36,27,0.26)', 0.55);
    this.lines(ctx, joints, 'rgba(48,36,27,0.18)', 0.4);
    this.lines(ctx, glints, 'rgba(223,178,123,0.13)', 0.4);
  };

  const texture = S.wallTexture;
  S.wallTexture = function (ctx, b, brick, z0, h) {
    if (!this.picking && !brick) {
      for (let k = 0; k < 9; k++) {
        const u = 0.05 + A.noise(b.x + k, b.y) * Math.max(0, b.w - 0.2), z = z0 + A.noise(b.y + k, b.x) * Math.max(0, h - 0.12), w = 0.04 + A.noise(k, b.x) * 0.05;
        I.poly(ctx, [[b.x + u, b.y + b.d, z], [b.x + u + w, b.y + b.d, z + 0.01], [b.x + u + w * 0.7, b.y + b.d, z + 0.07], [b.x + u - 0.01, b.y + b.d, z + 0.06]], 'rgba(93,78,52,0.13)');
      }
    }
    texture.call(this, ctx, b, brick, z0, h);
  };
  const house = S.drawHouse;
  S.drawHouse = function (ctx, b, ...args) { house.call(this, ctx, b, ...args); if (!this.picking) A.footing(ctx, b); };

  const window3 = I.window3;
  I.window3 = function (ctx, a, b, c, d, options) {
    window3.call(this, ctx, a, b, c, d, options);
    if (!S.picking) this.line(ctx, [a[0], a[1], a[2] - 0.025], [b[0], b[1], b[2] - 0.025], 'rgba(221,202,163,0.55)', 1.1);
  };

  // Beschläge und zurückgesetzte Türfüllungen bleiben direkt auf der Fassade.
  for (const side of ['L', 'R']) {
    const name = 'door' + side, original = I[name];
    I[name] = function (ctx, x, yOrWidth, depthOrY, z, u, width, height, arch) {
      original.call(this, ctx, x, yOrWidth, depthOrY, z, u, width, height, arch);
      if (S.picking) return;
      const point = (v, h) => side === 'L' ? [x + u + v, yOrWidth + depthOrY, z + h] : [x + yOrWidth, depthOrY + u + v, z + h];
      const n = A.noise(x + u, yOrWidth + depthOrY), wood = ['#71573c', '#665342', '#775e40'][Math.floor(n * 3)];
      this.poly(ctx, [point(-width * .39, .04), point(width * .39, .04), point(width * .39, height * .92), point(-width * .39, height * .92)], wood);
      for (const v of [-.2, 0, .2]) this.line(ctx, point(width * v, .05), point(width * v, height * .88), 'rgba(36,30,23,.38)', .45);
      const edge = [point(-width / 2, 0), point(-width / 2, height)];
      if (arch) edge.push(point(0, height + width * .5));
      edge.push(point(width / 2, height), point(width / 2, 0));
      for (let i = 1; i < edge.length; i++) this.line(ctx, edge[i - 1], edge[i], arch ? '#b29f7d' : '#9c8060', .9);
      for (const h of [.21, .7]) this.line(ctx, point(-width * .43, height * h), point(-width * .12, height * h), '#49473c', .8);
      const p = this.p(...point(width * .23, height * .46)); ctx.fillStyle = '#b39a62'; ctx.fillRect(p[0], p[1], 1.1, 1.4);
    };
  }

  const patterns = S.makePatterns;
  S.makePatterns = function () {
    patterns.call(this);
    // Fine grain instead of high-contrast, screen-aligned grass and dirt patterns.
    const pattern = (color, count, dark, light) => {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 48 * this.RS;
      const ctx = canvas.getContext('2d'); ctx.scale(this.RS, this.RS);
      ctx.fillStyle = color; ctx.fillRect(0, 0, 48, 48);
      for (let k = 0; k < count; k++) {
        ctx.fillStyle = k % 2 ? dark : light;
        ctx.fillRect(A.noise(k, 3) * 48, A.noise(k, 7) * 48, 1.4, 0.8);
      }
      const pat = this.ctx.createPattern(canvas, 'repeat');
      if (pat.setTransform) pat.setTransform(new DOMMatrix().scale(1 / this.RS));
      pat._quelle = canvas; pat._rs = this.RS; return pat;
    };
    this.pat.earth = pattern('#969078', 100, 'rgba(76,72,49,0.12)', 'rgba(215,199,156,0.1)');
    this.pat.grass = pattern('#74805b', 95, 'rgba(45,65,37,0.12)', 'rgba(171,184,113,0.12)');
    this.pat.cobble = '#898775';
  };
  // Standortgebundene Variation: weder die Uhr noch Spielzufall verändern
  // Art, Wuchs oder Blattfarben eines Baums.
  S.treeProfile = function (x, y, r) {
    const key = x + ',' + y + ',' + r, cache = this._treeProfiles ||= new Map();
    if (cache.has(key)) return cache.get(key);
    const n = k => A.noise(x + k * 3.17, y - k * 1.93);
    const species = HK.TREE_SPECIES?.[x+','+y] || ['oak', 'linden', 'birch', 'poplar'][Math.floor(n(1) * 4)];
    const lobes = {
      oak: [[-17, -23, 17, 1], [16, -25, 19, .9], [-3, -41, 22, .9], [-18, -42, 13, .9], [15, -47, 14, .85], [3, -20, 15, .8]],
      linden: [[-15, -25, 16, 1], [14, -27, 17, 1], [0, -42, 22, 1], [-12, -44, 15, .95], [11, -49, 14, .95], [0, -24, 16, .85]],
      birch: [[-10, -24, 14, 1.2], [11, -29, 13, 1.1], [-3, -41, 16, 1.15], [8, -54, 11, 1.05], [-11, -49, 10, 1.1]],
      poplar: [[-6, -19, 13, 1.2], [5, -32, 14, 1.15], [-3, -46, 12, 1.15], [2, -58, 9, 1.1], [0, -68, 5, 1.15]],
      spruce: [], pine: [],
    }[species].map(([cx, cy, radius, tall], i) => ({ x: cx + (n(i + 4) - .5) * 6, y: cy + (n(i + 15) - .5) * 5, r: radius * (.9 + n(i + 25) * .16), tall }));
    const profile = { species, scale: r * 1.05 * (.92 + n(2) * .16), lean: (n(3) - .5) * 5,
      tint: .92 + n(30) * .14, phase: n(31) * Math.PI * 2, lobes };
    cache.set(key, profile); return profile;
  };
  S.treePivot = function (x, y, r) {
    const p = I.p(x, y, 0), tr = this.treeProfile(x, y, r);
    return [p[0] + tr.lean * tr.scale, p[1] - 24 * tr.scale];
  };
  S.treeMotion = function (x, y, r, t) {
    const tr = this.treeProfile(x, y, r), wind = this.weather === 'rain' ? 1.6 : this.weather === 'snow' ? .65 : 1;
    return wind * (tr.species==='spruce'||tr.species==='pine' ? .013 : .022) * (.55 * Math.sin(t * .72 + tr.phase) + .35 * Math.sin(t * .29 + x * .07) + .1 * Math.sin(t * 1.4 + tr.phase * 2));
  };
  S.drawTreeBody = function (ctx, x, y, r, season, sv) {
    const p = I.p(x, y, 0), tr = this.treeProfile(x, y, r), s = tr.scale;
    if (!this.picking) {
      ctx.fillStyle = `rgba(25,39,29,${sv.a * (season === 'winter' && !['spruce','pine'].includes(tr.species) ? .28 : .6)})`;
      ctx.beginPath(); ctx.ellipse(p[0] + sv.v[0] * 12, p[1] + sv.v[1] * 8, (tr.species === 'poplar' ? 16 : 27) * s, 11 * s, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.save(); ctx.translate(...p); ctx.scale(s, s);
    const birch = tr.species === 'birch', thick = tr.species === 'oak' ? 3.5 : birch ? 2 : 2.7;
    ctx.fillStyle = birch ? '#c5c0a6' : '#715b43';
    ctx.beginPath(); ctx.moveTo(-thick - 1.5, 1); ctx.lineTo(thick + 1, 1); ctx.lineTo(tr.lean + thick * .6, -28); ctx.lineTo(tr.lean - thick * .55, -28); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = birch ? '#726f5d' : '#a18a63'; ctx.lineWidth = .8;
    ctx.beginPath(); ctx.moveTo(-thick * .55, -2); ctx.lineTo(tr.lean - thick * .3, -25); ctx.stroke();
    if (birch) {
      ctx.strokeStyle = '#666653'; ctx.lineWidth = 1.2; ctx.beginPath();
      for (let i = 0; i < 5; i++) { const yy = -4 - i * 4.5, xx = tr.lean * -yy / 28; ctx.moveTo(xx - 1.5, yy); ctx.lineTo(xx + (i % 2 ? .2 : 1.4), yy + .4); } ctx.stroke();
    } else {
      ctx.strokeStyle = '#65533c'; ctx.lineWidth = 1.1; ctx.beginPath();
      ctx.moveTo(-2, -3); ctx.lineTo(-7, 1); ctx.moveTo(2, -2); ctx.lineTo(6, 2); ctx.stroke();
    }
    ctx.restore();
  };
  S.drawTreeCrown = function (ctx, x, y, r, season, angle = 0) {
    const tr = this.treeProfile(x, y, r), birch = tr.species === 'birch';
    if(tr.species==='spruce'||tr.species==='pine'){
      this.drawConiferCrown(ctx,x,y,r,season,angle);return;
    }
    const colors = {
      spring: { oak: ['#526343', '#71804d', '#8f9859'], linden: ['#566c45', '#798a50', '#9daa69'], birch: ['#61744b', '#87935c', '#a6b272'], poplar: ['#4e6647', '#6c7e51', '#8c9d62'] },
      summer: { oak: ['#43593c', '#627547', '#839058'], linden: ['#4c6643', '#6e8150', '#91a16a'], birch: ['#576e49', '#7b8b59', '#9da969'], poplar: ['#425e46', '#607a52', '#889865'] },
      autumn: { oak: ['#6f6344', '#92824d', '#b09b60'], linden: ['#786b42', '#a38e50', '#c5b06d'], birch: ['#887849', '#b5a35d', '#d1bf80'], poplar: ['#6d7148', '#8b9657', '#b0b270'] },
    };
    ctx.save(); ctx.translate(...this.treePivot(x, y, r)); ctx.rotate(angle); ctx.scale(tr.scale, tr.scale);
    const line = (pts, color, width) => { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.stroke(); };
    const bark = birch ? '#a9a991' : '#715b43';
    for (const [i, lobe] of tr.lobes.entries()) {
      line([[0, 3], [lobe.x * .4, lobe.y * .55], [lobe.x, lobe.y - lobe.r * .5]], bark, i < 3 ? 2.3 : 1.2);
      if (season === 'winter') {
        line([[lobe.x * .4, lobe.y * .55], [lobe.x - lobe.r * .55, lobe.y - lobe.r * .2]], bark, 1.1);
        line([[lobe.x, lobe.y - lobe.r * .5], [lobe.x + lobe.r * .35, lobe.y - lobe.r]], bark, .8);
        line([[lobe.x * .4 - 1, lobe.y * .55 - 1], [lobe.x * .85 - 1, lobe.y - lobe.r * .35 - 1]], '#d8d8c7', .9);
      }
    }
    if (season !== 'winter') {
      const palette = (colors[season] || colors.summer)[tr.species].map(c => I.shade(c, tr.tint));
      const leaf = (cx, cy, radius, tall, color, seed) => {
        ctx.fillStyle = color; ctx.beginPath();
        for (let j = 0; j < 12; j++) {
          const a = j * Math.PI / 6, size = radius * (.89 + A.noise(seed + j, x + y) * .14), px = cx + Math.cos(a) * size, py = cy + Math.sin(a) * size * tall;
          j ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.closePath(); ctx.fill();
      };
      for (const [i, l] of tr.lobes.entries()) {
        leaf(l.x, l.y, l.r, l.tall, palette[i % 2], i * 17);
        leaf(l.x - l.r * .2, l.y - l.r * .25, l.r * .65, l.tall, palette[1], i * 19 + 2);
        leaf(l.x - l.r * .22, l.y - l.r * .35, l.r * .38, l.tall * .65, I.shade(palette[2], .96), i * 23 + 5);
        for (let j = 0; j < 4; j++) {
          const a = A.noise(i * 7 + j, x) * Math.PI * 2, rr = l.r * (.25 + A.noise(y, i * 13 + j) * .45);
          const px = l.x + Math.cos(a) * rr, py = l.y + Math.sin(a) * rr * l.tall;
          ctx.fillStyle = j % 2 ? 'rgba(42,54,31,.16)' : 'rgba(212,210,143,.18)';
          ctx.beginPath(); ctx.ellipse(px, py, 1.7, .8, -.4, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    ctx.restore();
  };
  S.drawConiferCrown = function(ctx,x,y,r,season,angle) {
    const tr=this.treeProfile(x,y,r),pine=tr.species==='pine',winter=season==='winter';
    const palette=(pine?['#3e6154','#577969','#7f9575']:['#355a48','#507454','#789168']).map(c=>I.shade(c,tr.tint));
    ctx.save();ctx.translate(...this.treePivot(x,y,r));ctx.rotate(angle);ctx.scale(tr.scale,tr.scale);
    ctx.strokeStyle=pine?'#92704e':'#695b40';ctx.lineWidth=pine?3:2;ctx.beginPath();ctx.moveTo(0,5);ctx.lineTo(-1,-62);ctx.stroke();
    const tiers=pine?4:6;
    for(let i=0;i<tiers;i++){
      const base=(pine?-12:10)-i*(pine?12:12),width=(pine?27:26)-i*(pine?5:4),tip=base-(pine?25:31),lean=(A.noise(i+x,y)-.5)*5;
      const shape=[[lean,tip],[lean-width*.42,base-15],[lean-width,base-1]];
      for(let j=0;j<=8;j++){const u=j/8;shape.push([lean-width+u*width*2,base+(j%2?2:-1)+A.noise(i*13+j,y)*3+Math.sin(u*Math.PI)*3]);}
      shape.push([lean+width*.82,base-7],[lean+width*.32,base-17]);
      ctx.fillStyle=palette[0];ctx.beginPath();shape.forEach((p,j)=>j?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fill();
      ctx.fillStyle=palette[1];ctx.beginPath();ctx.moveTo(lean,tip);ctx.lineTo(lean-width*.42,base-15);ctx.lineTo(lean-width,base-1);ctx.lineTo(lean-2,base+3);ctx.lineTo(lean+width*.3,base-5);ctx.closePath();ctx.fill();
      // Broken branch tips give texture without expensive moving needle geometry.
      ctx.strokeStyle=palette[2];ctx.lineWidth=1;
      for(let j=0;j<4;j++){const yy=base-5-j*4,ww=width*(.7-j*.14);ctx.beginPath();ctx.moveTo(lean-ww,yy);ctx.lineTo(lean-ww*.3,yy-3);ctx.lineTo(lean+ww*.12,yy-1);ctx.stroke();}
      if(winter){ctx.fillStyle='#d9ded0';ctx.beginPath();ctx.moveTo(lean,tip);ctx.lineTo(lean-width*.38,base-16);ctx.lineTo(lean-width*.68,base-6);ctx.lineTo(lean-width*.18,base-9);ctx.lineTo(lean+width*.1,base-6);ctx.lineTo(lean+width*.37,base-11);ctx.closePath();ctx.fill();}
    }
    ctx.restore();
  };
  S.drawTree = function (ctx, x, y, r, season, sv) {
    this.drawTreeBody(ctx, x, y, r, season, sv);
    // Eingebettete Hof-/Inselbäume gehören zur ruhenden Gebäudegrafik.
    // Die freien Kartenbäume erhalten ihre Bewegung in buildItems.
    this.drawTreeCrown(ctx, x, y, r, season);
  };
}
