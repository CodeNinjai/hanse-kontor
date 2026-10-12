/* Sichtbare Ausführung der bereits gebuchten Handelsbelege. */
'use strict';
Object.assign(HK.Scene, {
  tenders: [],
  freightNode(id) {
    if (id === 'warehouse') return 'WH';
    if (id === 'market') return 'S1';
    if (id === 'kontor') return 'H23';
    const b = HK.BUILDING[id] || HK.RURAL_BUILDINGS?.[id];
    return b ? this.nearestRoad(b.x+(b.w||.6)/2,b.y+(b.d||.6)+.2) : null;
  },
  freightPick(w) {
    const job=w.freightJob || HK.state.freight?.jobs.find(j=>j.id===w.items?.[0]?.jobId);
    if(!job || !w.items?.length) return null;
    const endpoints=HK.freightBuildings(job), end=endpoints[1], b=HK.BUILDING[end]||HK.RURAL_BUILDINGS?.[end]||HK.BUILDING.harbour;
    const route=endpoints.map(id=>id?HK.freightBuildingName(id):HK.t('harbour')).join(' → ');
    return {kind:'building',building:b,panel:b.panel,label:HK.fmt(w.items.reduce((n,p)=>n+p.qty,0))+' '+HK.t('unitLast')+' '+HK.goodName(job.good)+' · '+route};
  },
  prepareTraffic() {
    this._traffic = new Map();
    for (const w of this.walkers.concat(this.porters)) {
      if (!this.walkerAlpha(w)) continue;
      w.trafficId ??= (this._trafficNext = (this._trafficNext || 0) + 1);
      const p = w.dock || w.freightJob ? this.porterPos(w) : this.walkerWorld(w), key = Math.floor(p.wx) + ',' + Math.floor(p.wy);
      const cell = this._traffic.get(key) || []; cell.push({ w, ...p }); this._traffic.set(key, cell);
    }
    for (const c of this.carts) {
      const wx = c.a[0] + (c.b[0] - c.a[0]) * c.t, wy = c.a[1] + (c.b[1] - c.a[1]) * c.t;
      const key = Math.floor(wx) + ',' + Math.floor(wy), cell = this._traffic.get(key) || [];
      cell.push({ w: { cart: true, trafficId: 0, head: c.head }, wx, wy }); this._traffic.set(key, cell);
    }
  },
  trafficClear(w, before, after, dt) {
    if (!this._traffic) return true;
    const dx = after.wx - before.wx, dy = after.wy - before.wy, len = Math.hypot(dx, dy); if (len < 1e-8) return true;
    const x = Math.floor(before.wx), y = Math.floor(before.wy);
    for (let ix = x - 1; ix <= x + 1; ix++) for (let iy = y - 1; iy <= y + 1; iy++) for (const other of this._traffic.get(ix + ',' + iy) || []) {
      if (other.w === w) continue;
      // Different streets merge at a junction. Blocking an actor here can
      // create a ring of mutually waiting pedestrians across the whole graph.
      // Keep their node transitions moving; yield on the shared street itself.
      if (!other.w.cart && ((w.t < 0.12 || w.t > 0.85) ||
          !(w.from === other.w.from && w.to === other.w.to || w.from === other.w.to && w.to === other.w.from))) continue;
      const ox = other.wx - before.wx, oy = other.wy - before.wy, distance = Math.hypot(ox, oy), radius = other.w.cart ? 0.5 : 0.23;
      if (distance > radius || (ox * dx + oy * dy) / len < 0.01) continue;
      const A = HK.ROAD_NODES[w.from], B = HK.ROAD_NODES[w.to], lx = B[0] - A[0], ly = B[1] - A[1], roadLen = Math.hypot(lx, ly);
      const options = this.edgeFree(w.from, w.to).filter(off => Math.abs(off - w.off) > 0.02).sort((a, b) => {
        const sep = off => Math.hypot(before.wx - ly / roadLen * (off - w.off) - other.wx, before.wy + lx / roadLen * (off - w.off) - other.wy);
        return sep(b) - sep(a);
      });
      for (const off of options) {
        const nextOff = w.off + HK.clamp(off - w.off, -dt * 0.35, dt * 0.35);
        const p = this.walkerWorld({ ...w, off: nextOff });
        if (!this.blockedAt(p.wx, p.wy) && Math.hypot(p.wx - other.wx, p.wy - other.wy) > distance + 1e-4) { w.off = nextOff; break; }
      }
      // One actor yields; the other can clear the encounter rather than both
      // waiting forever. A slow lateral step remains bounded by dt.
      const following = w.from === other.w.from && w.to === other.w.to;
      return !following && w.trafficId < other.w.trafficId && !other.w.cart;
    }
    return true;
  },
  freightItems(items, t) {
    for (const tender of this.tenders) {
      const x = tender.x, y = tender.y;
      items.push({ r: 'tender:' + tender.parcel.id, v: Math.floor(t * 10) + '|' + Math.round(tender.heading * 32) + '|' + (tender.handoff != null ? 1 : 0), ap: I.p(x, y, 0),
        k: x + y, box: [x - 0.55, y - 0.55, x + 0.55, y + 0.55], f: c => this.drawCargoTender(c, tender, t) });
      if (tender.handoff != null) {
        const u = tender.parcel.direction === 'in' ? tender.handoff : 1 - tender.handoff;
        const sx = x + Math.cos(tender.heading) * 0.15, sy = y + Math.sin(tender.heading) * 0.15;
        const hx = tender.spec.head[0] + 0.07, hy = tender.spec.head[1] - 0.07;
        const px = sx + (hx - sx) * u, py = sy + (hy - sy) * u, pz = this.WATER_Z + 0.28 + (0.27 - this.WATER_Z - 0.28) * u + Math.sin(u * Math.PI) * 0.18;
        items.push({ r: 'handoff:' + tender.parcel.id, v: tender.parcel.good, ap: I.p(px, py, pz), k: px + py + 1,
          box: [px - 0.14, py - 0.14, px + 0.14, py + 0.14], f: c => this.drawCargo(c, px, py, pz, tender.parcel) });
      }
    }
    for (const d of this.docks()) if (d.load && this.craneState(d).load) {
      const p = this.craneLoadPose(d), id = d.load.id || d.i;
      items.push({ r: 'crane-load:' + d.i, v: id + '|' + Math.floor(d.u * this.CRANE_CYCLE * 15), ap: I.p(p.x, p.y, p.z),
        k: p.x + p.y + 2, box: [p.x - 0.14, p.y - 0.14, p.x + 0.14, p.y + 0.14],
        f: c => { this.drawCargo(c, p.x, p.y, p.z, d.load); for (const side of [-1, 1]) I.line(c, [p.x, p.y, p.z + p.height + 0.06], [p.x + side * 0.12, p.y, p.z + p.height * 0.7], '#c7b68c', 0.65); } });
    }
  },
  drawCargoTender(ctx, tender, t) {
    const x = tender.x, y = tender.y, ca = Math.cos(tender.heading), si = Math.sin(tender.heading), z = this.WATER_Z + 0.05;
    const P = (u, v, h) => [x + u * ca - v * si, y + u * si + v * ca, z + h];
    const hull = [[0.48, 0], [0.28, 0.22], [-0.38, 0.2], [-0.48, 0], [-0.38, -0.2], [0.28, -0.22]].map(q => P(...q, 0).slice(0, 2));
    this.prism(ctx, hull, z, 0.22, { wall: '#8e7049', top: '#b09a6d' }, { stroke: '#66513a' });
    I.line(ctx, P(-0.2, -0.18, 0.24), P(-0.2, 0.18, 0.24), '#6e5337', 1.6);
    const person = I.p(...P(-0.22, 0, 0.22)); this.drawPerson(ctx, ...person, '#627350', 'fisher', 1, false, '#dcc3aa', t * 4, 1, null, { head: tender.heading }, 0.55);
    if (tender.handoff == null) { const cargo = P(0.15, 0, 0.23); this.drawCargo(ctx, ...cargo, tender.parcel); }
    for (const side of [-1, 1]) { const swing = Math.sin(t * 4) * 0.08; I.line(ctx, P(-0.23, side * 0.06, 0.4), P(-0.42 + swing, side * 0.5, 0.04), '#8a7350', 1); }
  },
  dockManifest(d) {
    const st = HK.state;
    if (!st?.freight) return;
    for (const job of st.freight.jobs) {
      if (job.nightCargo || job.status === 'done' || job.kind !== 'visitor' || !job.sea || job.berth >= 4 || Math.floor(job.berth / 2) !== d.i) continue;
      if (!this.craneBusy({ berth: job.berth })) continue;
      for (const p of job.parcels) if (p.state === 'queued' && p.direction === 'in') {
        p.shipId = job.sourceId; p.berth = job.berth; p.state = 'craneQueue'; d.pending.push(p); job.status = 'active';
      }
    }
    d.pending = d.pending.filter(p => {
      if (p.state === 'done') return false;
      if (!st.ships.some(s => s.id === p.shipId)) { d.cancelled.push(p); HK.completeParcel(st, p); return false; }
      return true;
    });
    for (const s of d.slots) s.items = s.items.filter(p => p.state !== 'done');
  },
  dockItems(d) { return d.slots.reduce((n, s) => n + s.items.filter(p => p.direction !== 'out').length, 0); },
  cargoSlot(d, p) {
    return d.slots.find(s => !s.reserved && !s.claimedBy && s.items.length < this.STACK_MAX && s.items.every(it => it.good === p.good && it.kind === p.kind && (it.direction || 'in') === (p.direction || 'in')));
  },
  updateDocks(dt) {
    const st = HK.state;
    for (const d of this.docks()) {
      this.dockManifest(d);
      if (d.cargo && d.u < 0.2 && !st?.ships.some(s => s.id === d.cargo.shipId)) { d.cancelled.push(d.cargo); HK.completeParcel(st, d.cargo); }
      if (d.u < 0.67 && d.cargo?.state === 'done') { if (d.slot) d.slot.reserved = null; d.cargo = d.load = null; d.u = 0; }
      if (!d.cargo && d.u === 0) {
        const outbound = d.slots.find(s => !s.claimedBy && !s.reserved && s.items.some(p => p.direction === 'out' && this.craneBusy({ berth: p.berth })));
        if (outbound) {
          d.slot = outbound; d.cargo = outbound.items.find(p => p.direction === 'out' && this.craneBusy({ berth: p.berth }));
          d.pickIndex = outbound.items.indexOf(d.cargo); d.load = null;
        } else {
          const next = d.pending.findIndex(p => this.craneBusy({ berth: p.berth }) && this.cargoSlot(d, p));
          if (next < 0) { d.working = false; continue; }
          d.cargo = d.pending.splice(next, 1)[0]; d.slot = this.cargoSlot(d, d.cargo); d.load = d.cargo;
        }
        d.direction = d.cargo.direction; d.berth = d.cargo.berth; d.slot.reserved = d.cargo; d.lastDrop = null;
        const b = HK.BERTHS[d.berth]; d.shipTh = Math.atan2(b.x - d.cx, b.y - d.cy); d.shipR = Math.hypot(b.x - d.cx, b.y - d.cy);
      }
      d.working = true;
      const before = d.u; d.u = Math.min(1, d.u + dt / this.CRANE_CYCLE);
      if (d.direction === 'in' && before < 0.2 && d.u >= 0.2) d.load.state = 'hook';
      if (d.direction === 'out' && before < 0.2 && d.u >= 0.2) {
        d.slot.items.splice(d.slot.items.indexOf(d.cargo), 1); d.load = d.cargo; d.load.state = 'hook';
      }
      if (before < 0.67 && d.u >= 0.67) {
        if (d.direction === 'out') HK.completeParcel(st, d.load);
        else { d.lastDrop = { item: d.load, index: d.slot.items.length }; d.load.state = 'pile'; d.slot.items.push(d.load); }
        d.slot.reserved = null; d.load = null; d.dropped = 1;
      }
      if (d.u >= 1) {
        d.parkTh = d.direction === 'out' ? d.shipTh : d.slot.th; d.parkR = d.direction === 'out' ? d.shipR : d.slot.R;
        d.u = 0; d.cargo = null; d.dropped = -1;
      }
    }
  },
  nearestRoad(x, y) {
    return Object.keys(HK.ROAD_NODES).filter(k => !this.blockedAt(...HK.ROAD_NODES[k])).sort((a, b) => Math.hypot(HK.ROAD_NODES[a][0] - x, HK.ROAD_NODES[a][1] - y) - Math.hypot(HK.ROAD_NODES[b][0] - x, HK.ROAD_NODES[b][1] - y))[0];
  },
  tenderSpec(job) {
    const i = job.kind === 'own' ? Math.max(0, job.index) % 2 : 1, p = HK.PIERS[i];
    const b = job.kind === 'own' ? HK.OWN_BERTHS[job.index] : HK.BERTHS[job.berth];
    if (!b) return null;
    const dock = [p.lane - 0.1, p.y1 + 0.65], ship = [b.x + (job.kind === 'own' ? -1.4 : 1.15), b.y];
    return { i, dock, ship, head: [p.lane - 0.1, p.y1 - 0.22], path: [dock, [dock[0], HK.SEA_LANE_Y], [ship[0], HK.SEA_LANE_Y], ship] };
  },
  spawnTender(job, p) {
    const spec = this.tenderSpec(job); if (!spec) return;
    if (this.tenders.length >= 2 || this.tenders.some(t => t.spec.i === spec.i)) return false;
    const path = p.direction === 'in' ? spec.path.slice().reverse() : spec.path;
    p.state = 'tender'; job.status = 'active';
    const head = Math.atan2(path[1][1] - path[0][1], path[1][0] - path[0][0]);
    this.tenders.push({ job, parcel: p, spec, path, pi: 1, t: 0, x: path[0][0], y: path[0][1], heading: head, head, wait: 0.8, handoff: p.direction === 'out' ? 0 : null });
    return true;
  },
  spawnFreightCourier(job, parcels, tender, leg) {
    const i = tender ? this.tenderSpec(job).i : 0;
    const endpoints = HK.freightBuildings(job), home = this.freightNode(job.direction==='in'?endpoints[1]:endpoints[0]);
    const caravan = job.kind === 'visitor' && HK.CARAVAN_SPOTS[job.index];
    const rural=job.kind==='rural'&&HK.RURAL_BUILDINGS[job.ruralSite];
    const sp = rural ? [rural.x+(rural.w||.6)/2,rural.y+(rural.d||.6)+.2] : job.kind === 'market' ? [HK.BUILDING.market.x + 0.8, HK.BUILDING.market.y + 0.8] : caravan && [caravan.x, caravan.y];
    const source = tender ? this.PORTER_DOCK[i] : this.freightNode(job.direction==='in'?endpoints[0]:endpoints[1]) || this.nearestRoad(...(sp || HK.ROAD_NODES.OUT));
    const path = leg ? this.route(leg.from,leg.to) : job.direction === 'in' ? this.route(source, home) : this.route(home, source);
    if (path.length < 2) return;
    const start = tender && job.direction === 'in' ? this.tenderSpec(job).head : caravan && job.direction === 'in' ? [caravan.x - 1.4, caravan.y + 0.62] : HK.ROAD_NODES[path[0]];
    if (this.porters.some(w => { const p = this.porterPos(w); return Math.hypot(p.wx - start[0], p.wy - start[1]) < 0.45; })) return;
    const w = { freightJob: job, tender, freightLeg: leg?.kind, cart: false, cap: 1, items: parcels, path, pi: 1, from: path[0], to: path[1], t: 0,
      state: 'freightMove', off: this.pickOff(path[0], path[1]), speed: 0.48, phase: 0, wait: 0.8, color: '#7a6445', skin: '#dcc3aa', moving: false, nightOwl: true };
    if (tender && job.direction === 'in') { w.a = this.tenderSpec(job).head; w.b = HK.ROAD_NODES[source]; w.ft = 0; w.state = 'freightHeadIn'; }
    if (!tender && caravan && job.direction === 'in') {
      w.connection = [[caravan.x - 1.4, caravan.y + 0.62], [caravan.x - 1.4, caravan.y - 0.55], HK.ROAD_NODES[source]];
      w.ci = 1; w.a = w.connection[0]; w.b = w.connection[1]; w.ft = 0; w.state = 'freightSourceIn';
    }
    for (const p of parcels) p.state = 'carried'; job.status = 'active'; this.porters.push(w);
  },
  updateFreight(dt) {
    const st = HK.state; if (!st?.freight) return;
    // Remove visual actors whose source departed during accelerated game time.
    for (const d of this.docks()) for (const slot of d.slots) if (slot.claimedBy?.items?.some(p => p.state === 'done')) slot.claimedBy = null;
    this.porters = this.porters.filter(w => !(w.freightJob?.status === 'done' && !w.returning) && !w.items?.some(p => p.state === 'done'));
    this.tenders = this.tenders.filter(t => t.parcel.state !== 'done');
    for (const t of this.tenders.slice()) {
      if (t.handoff != null) {
        t.handoff = Math.min(1, t.handoff + dt / 1.2);
        if (t.handoff >= 1) {
          if (t.parcel.direction === 'in') { t.parcel.state = 'courierReady'; this.tenders.splice(this.tenders.indexOf(t), 1); }
          else { t.handoff = null; t.wait = 0; }
        }
        continue;
      }
      if (t.wait > 0) { t.wait -= dt; continue; }
      const a = t.path[t.pi - 1], b = t.path[t.pi], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const angle = Math.atan2(b[1] - a[1], b[0] - a[0]); this.turn(t, angle, dt); t.heading = t.head;
      if (Math.abs(Math.atan2(Math.sin(angle - t.head), Math.cos(angle - t.head))) > 0.1) continue;
      t.t = Math.min(1, t.t + dt * 0.65 / (len || 0.01));
      t.x = a[0] + (b[0] - a[0]) * t.t; t.y = a[1] + (b[1] - a[1]) * t.t;
      if (t.t >= 1) {
        t.pi++; t.t = 0;
        if (t.pi >= t.path.length) {
          if (t.parcel.direction === 'in') t.handoff = 0;
          else { HK.completeParcel(st, t.parcel); this.tenders.splice(this.tenders.indexOf(t), 1); }
        }
      }
    }
    // Player orders get a free courier before background city distribution.
    for (const job of st.freight.jobs.slice().sort((a,b)=>(a.owner==='player'?0:1)-(b.owner==='player'?0:1)||a.id-b.id)) {
      if (job.nightCargo || job.status === 'done') continue;
      if(job.afterJobs?.some(id=>st.freight.jobs.some(j=>j.id===id&&j.status!=='done')))continue;
      if (job.kind === 'own' && st.freight.jobs.some(j => j.id < job.id && j.kind === 'own' && j.sourceId === job.sourceId && j.status !== 'done')) continue;
      const tender = job.kind === 'own' || (job.sea && job.berth >= 4);
      if (job.kind === 'visitor' && job.sea && !tender) {
        const quay = Math.floor(job.berth/2), home = this.PORTER_HOME[quay], endpoints = HK.freightBuildings(job);
        const inbound = job.parcels.find(p=>p.state==='quayReady');
        if(inbound && this.porters.filter(w=>w.freightJob).length<6) this.spawnFreightCourier(job,[inbound],false,{from:home,to:this.freightNode(endpoints[1]),kind:'inland'});
        if (job.direction !== 'out' || !this.craneBusy({ berth: job.berth })) continue;
        const pending = job.parcels.find(p=>p.state==='queued');
        if(pending && this.porters.filter(w=>w.freightJob).length<6) this.spawnFreightCourier(job,[pending],false,{from:this.freightNode(endpoints[0]),to:home,kind:'toQuay'});
        const d = this.docks()[Math.floor(job.berth / 2)], mine = this.porters.filter(w => w.dock === d);
        const parcels = job.parcels.filter(p => p.state === 'quayOutReady').slice(0, 3);
        // Do not occupy all dock workers with exports while import piles need
        // clearing. Reserve a compatible unloading slot before sending a cart.
        const room = parcels.length && d.slots.some(s=>!s.reserved&&!s.claimedBy&&s.items.length+parcels.length<=this.STACK_MAX&&s.items.every(p=>p.direction==='out'&&p.good===job.good));
        if (room && mine.length < this.PORTER_MAX-(this.dockItems(d)>0?1:0)) {
          const w = this.spawnPorter(d, true); if (!w) continue; w.outbound = true; w.items = parcels;
          for (const p of parcels) { p.state = 'carried'; p.berth = job.berth; p.shipId = job.sourceId; }
          job.status = 'active';
        }
        continue;
      }
      if (tender && job.direction === 'in') {
        const p = job.parcels.find(p => p.state === 'queued');
        if (p && this.tenders.length < 2) this.spawnTender(job, p);
      }
      const state = tender && job.direction === 'in' ? 'courierReady' : 'queued';
      const p = job.parcels.find(p => p.state === state);
      if (p && this.porters.filter(w => w.freightJob).length < 6) this.spawnFreightCourier(job, [p], tender);
    }
  },
});
const originalSpawnPorter = HK.Scene.spawnPorter;
HK.Scene.spawnPorter = function (d, cart) {
  const start = this.roadPoint(this.PORTER_HOME[d.i], cart);
  if (this.porters.some(w => { const p = this.porterPos(w); return Math.hypot(p.wx - start[0], p.wy - start[1]) < (cart ? 0.85 : 0.4); })) return null;
  const w = originalSpawnPorter.call(this, d, cart); if (w) w.nightOwl = true; return w;
};
const originalCraneState = HK.Scene.craneState;
HK.Scene.craneState = function (d) {
  if (d.direction !== 'out') return originalCraneState.call(this, d);
  return originalCraneState.call(this, { ...d, shipTh: d.slot?.th ?? d.parkTh, shipR: d.slot?.R ?? d.parkR, slot: { ...d.slot, th: d.shipTh, R: d.shipR } });
};
const originalPorterNext = HK.Scene.porterNext;
HK.Scene.porterNext = function (w) {
  if (w.freightJob) {
    const job = w.freightJob;
    if (w.state === 'freightReturn') {
      if (w.pi >= w.path.length) this.porters.splice(this.porters.indexOf(w), 1);
      return;
    }
    if (w.state === 'freightReturnHead') {
      if (w.ft < 1) return;
      w.a = w.b = null; w.state = 'freightReturn'; w.bx = HK.ROAD_NODES[w.from][0]; w.by = HK.ROAD_NODES[w.from][1]; return;
    }
    if (w.state === 'freightSourceReturn') {
      if (w.ft < 1) return;
      w.ci++; if (w.ci < w.connection.length) { w.a = w.b; w.b = w.connection[w.ci]; w.ft = 0; return; }
      w.a = w.b = null; w.state = 'freightReturn'; w.bx = HK.ROAD_NODES[w.from][0]; w.by = HK.ROAD_NODES[w.from][1]; return;
    }
    if (['freightSourceIn', 'freightSourceOut'].includes(w.state)) {
      if (w.ft < 1) return;
      w.ci++;
      if (w.ci < w.connection.length) { w.a = w.b; w.b = w.connection[w.ci]; w.ft = 0; return; }
      if (w.state === 'freightSourceIn') { w.a = w.b = null; w.state = 'freightMove'; w.bx = HK.ROAD_NODES[w.from][0]; w.by = HK.ROAD_NODES[w.from][1]; return; }
      w.state = 'freightDrop'; w.wait = 0.8; return;
    }
    if (w.state === 'freightHeadIn') {
      if (w.ft < 1) return;
      w.a = w.b = null; w.state = 'freightMove'; w.bx = HK.ROAD_NODES[w.from][0]; w.by = HK.ROAD_NODES[w.from][1]; return;
    }
    if (w.state === 'freightMove' && w.wait <= 0 && w.pi < w.path.length) return; // initial pickup pause
    if (w.state === 'freightMove' && w.t === 0 && w.pi >= w.path.length && w.tender && job.direction === 'out') {
      const p = this.porterPos(w); w.state = 'freightHeadOut'; w.a = [p.wx, p.wy]; w.b = this.tenderSpec(job).head; w.ft = 0; return;
    }
    if (w.state === 'freightMove' && w.pi >= w.path.length && !w.tender && job.kind === 'visitor' && job.direction === 'out') {
      const caravan = HK.CARAVAN_SPOTS[job.index];
      if (caravan) { const p = this.porterPos(w); w.connection = [[p.wx, p.wy], [caravan.x - 1.4, caravan.y - 0.55], [caravan.x - 1.4, caravan.y + 0.62]]; w.ci = 1; w.a = w.connection[0]; w.b = w.connection[1]; w.ft = 0; w.state = 'freightSourceOut'; return; }
    }
    if (w.state !== 'freightDrop') { w.state = 'freightDrop'; w.wait = 0.8; return; }
    if(w.freightLeg==='toQuay') {
      for(const p of w.items) p.state='quayOutReady';
      this.porters.splice(this.porters.indexOf(w),1); return;
    }
    if (w.tender && job.direction === 'out') { if (!this.spawnTender(job, w.items[0])) { w.wait = 0.5; return; } }
    else for (const p of w.items) HK.completeParcel(HK.state, p);
    if (job.direction === 'out') {
      w.items = []; w.returning = true; w.state = 'freightReturn'; w.wait = 0;
      const path = w.path.slice().reverse(), last = this.porterPos(w);
      w.path = path; w.pi = 1; w.from = path[0]; w.to = path[1]; w.t = 0; w.off = this.pickOff(w.from, w.to); w.bx = last.wx; w.by = last.wy;
      if (w.tender) { w.state = 'freightReturnHead'; w.a = [last.wx, last.wy]; w.b = HK.ROAD_NODES[w.from]; w.ft = 0; }
      else if (job.kind === 'visitor') { w.state = 'freightSourceReturn'; w.connection = w.connection.slice().reverse(); w.ci = 1; w.a = w.connection[0]; w.b = w.connection[1]; w.ft = 0; }
      else w.a = w.b = null;
      return;
    }
    this.porters.splice(this.porters.indexOf(w), 1); return;
  }
  if (w.outbound) {
    const d = w.dock, node = HK.ROAD_NODES[this.PORTER_DOCK[d.i]];
    if (w.state === 'waitSlot') w.state = 'go';
    if (w.state === 'go') {
      const p = w.items[0], slot = d.slots.find(s => !s.reserved && !s.claimedBy && s.items.length + w.items.length <= this.STACK_MAX && s.items.every(it => it.direction === 'out' && it.good === p.good && it.kind === p.kind));
      if (!slot) { w.state = 'waitSlot'; w.wait = 0.5; return; }
      slot.claimedBy = w; w.slot = slot; w.state = 'approach'; w.a = [node[0] - 0.1, node[1]]; w.b = [node[0] - 0.1, slot.y - .16]; w.ft = 0; return;
    }
    if (w.state === 'approach') { w.state = 'lift'; w.wait = 0.7; return; }
    if (w.state === 'lift') {
      const slot = w.slot;
      if (slot.items.length >= this.STACK_MAX || slot.reserved) { w.wait = 0.3; return; }
      const p = w.items.pop(); if (p) { p.state = 'pile'; slot.items.push(p); }
      if (w.items.length) { w.wait = 0.55; return; }
      slot.claimedBy = null; w.state = 'back'; w.a = [...w.b]; w.b = [node[0] - 0.1, node[1]]; w.ft = 0; return;
    }
    if (w.state === 'drop') { this.porters.splice(this.porters.indexOf(w), 1); return; }
  }
  if (w.state === 'drop') for (const p of w.items) {
    if(p.jobId) { p.state='quayReady'; p.quay=w.dock.i; }
    else HK.completeParcel(HK.state, p);
  }
  const oldItems = w.items.slice(); originalPorterNext.call(this, w);
  for (const p of w.items) if (!oldItems.includes(p)) p.state = 'carried';
};
const originalUpdate = HK.Scene.update;
HK.Scene.update = function (dt) { this.updateFreight(dt); originalUpdate.call(this, dt); };
const originalSnap = HK.Scene.snapShips;
HK.Scene.snapShips = function () {
  originalSnap.call(this); this.tenders = [];
  for (const d of this.docks()) { d.cargo = null; d.direction = 'in'; }
  // Scene actors are rebuilt after load; completed parcels stay completed.
  for (const j of HK.state?.freight?.jobs || []) if (j.status !== 'done') for (const p of j.parcels) if (p.state !== 'done') p.state = 'queued';
};
