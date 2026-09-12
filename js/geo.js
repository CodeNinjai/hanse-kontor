/* Geometrie: Projektion, Seewege-Graph, Dijkstra */
'use strict';

HK.MAP = { LON0: -3, LON1: 34, LAT0: 49.5, LAT1: 61.6, W: 960, H: 620 };

HK.project = function (lon, lat) {
  const m = HK.MAP;
  return {
    x: (lon - m.LON0) / (m.LON1 - m.LON0) * m.W,
    y: (m.LAT1 - lat) / (m.LAT1 - m.LAT0) * m.H,
  };
};

HK.distKm = function (a, b) {
  const R = 6371, toRad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toRad, dLon = (b.lon - a.lon) * toRad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toRad) * Math.cos(b.lat * toRad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/* Knoten-Tabelle (Städte + Wegpunkte) und Adjazenz */
HK.NODES = {};
HK.CITIES.forEach(c => HK.NODES[c.id] = { id: c.id, lon: c.lon, lat: c.lat, city: true });
HK.WAYPOINTS.forEach(w => HK.NODES[w.id] = { id: w.id, lon: w.lon, lat: w.lat, city: false });
HK.ADJ = {};
Object.keys(HK.NODES).forEach(id => HK.ADJ[id] = []);
HK.EDGES.forEach(([a, b, kind]) => {
  let d = HK.distKm(HK.NODES[a], HK.NODES[b]);
  if (kind === 'canal') d *= 2.2; // Stecknitzkanal: langsam
  HK.ADJ[a].push({ to: b, d });
  HK.ADJ[b].push({ to: a, d });
});

/* Kürzester Weg (Dijkstra). Liefert {path:[ids], dist} oder null */
HK.findPath = function (from, to) {
  if (from === to) return { path: [from], dist: 0 };
  const dist = {}, prev = {}, done = {};
  Object.keys(HK.NODES).forEach(id => dist[id] = Infinity);
  dist[from] = 0;
  for (;;) {
    let u = null, best = Infinity;
    for (const id in dist) if (!done[id] && dist[id] < best) { best = dist[id]; u = id; }
    if (u === null) return null;
    if (u === to) break;
    done[u] = true;
    for (const e of HK.ADJ[u]) {
      const nd = dist[u] + e.d;
      if (nd < dist[e.to]) { dist[e.to] = nd; prev[e.to] = u; }
    }
  }
  const path = [to];
  while (path[0] !== from) path.unshift(prev[path[0]]);
  return { path, dist: dist[to] };
};

HK.pathDistance = function (path) {
  let d = 0;
  for (let i = 1; i < path.length; i++) d += HK.distKm(HK.NODES[path[i - 1]], HK.NODES[path[i]]);
  return d;
};

/* Position entlang eines Pfades bei zurückgelegter Distanz */
HK.positionOnPath = function (path, travelled) {
  let rem = travelled;
  for (let i = 1; i < path.length; i++) {
    const a = HK.NODES[path[i - 1]], b = HK.NODES[path[i]];
    const d = HK.distKm(a, b);
    if (rem <= d || i === path.length - 1) {
      const t = d > 0 ? Math.min(1, rem / d) : 1;
      return { lon: a.lon + (b.lon - a.lon) * t, lat: a.lat + (b.lat - a.lat) * t, heading: Math.atan2(-(b.lat - a.lat), b.lon - a.lon) };
    }
    rem -= d;
  }
  const n = HK.NODES[path[path.length - 1]];
  return { lon: n.lon, lat: n.lat, heading: 0 };
};
