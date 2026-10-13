/* Geometrie und Bewegungen der Karte ohne Browser prüfen:
   node tools/karten-test.js */
'use strict';
const assert = require('node:assert/strict');
let seed = 42;
const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const H = require('./domain-loader.cjs')(seed, { random, scene: ['scene', 'buildings', 'art', 'flair', 'stadtereignisse', 'warenverkehr', 'landwirtschaft-scene', 'fischerboote'] }), S = H.Scene;
H.state = H.newGame({ name: 'Kartentest', difficulty: 'normal', years: 20 });
H.UI = { selectedVisitor: null };
let checks = 0;
function check(condition, message) { checks++; assert(condition, message); }
// Nacht, Regen und Seuche reduzieren die Zahl der Passanten, nicht ihre
// Deckkraft. Die Auswahl darf nicht mit der laufenden Gangphase wechseln.
const visibilityWeather = S.weather, visibilityClock = S.clock, visibilityEvents = H.state.town.events;
const visibilityPeople = Array.from({ length: 100 }, (_, i) => ({ phase: i / 100 * Math.PI * 2, type: 'citizen', nightOwl: i < 20 }));
for (const plague of [false, true]) for (const weather of ['clear', 'rain']) {
  H.state.town.events = plague ? [{ type: 'plague' }] : []; S.weather = weather;
  for (let hour = 0; hour <= 96; hour++) {
    S.clock = hour / 96;
    for (const person of visibilityPeople) {
      const a = S.walkerAlpha(person);
      check(a === 0 || a === 1, 'Passant wird nachts oder bei Regen durchsichtig');
      if (person.nightOwl) check(a === 1, 'Nachtwache oder Warenträger wird unsichtbar');
      person.phase += .41;
      check(S.walkerAlpha(person) === a, 'Sichtbarkeit wechselt mit der Gangphase');
    }
  }
}
S.weather = 'clear'; S.clock = .95; H.state.town.events = [];
check(visibilityPeople.filter(w => S.walkerAlpha(w)).length === 20, 'Nächtliche Straßen haben weiterhin den Tagesandrang');
S.clock = .5;
check(visibilityPeople.every(w => S.walkerAlpha(w) === 1), 'Passanten bleiben tagsüber unsichtbar');
S.weather = visibilityWeather; S.clock = visibilityClock; H.state.town.events = visibilityEvents;
const contains = (b, x, y, margin = 0) => x > b[0] - margin && x < b[2] + margin && y > b[1] - margin && y < b[3] + margin;
const buildings = H.BUILDINGS.filter(b => !['water', 'market', 'gate', 'yard', 'plot', 'huts'].includes(b.kind));
// Getrennte Achsen erkennen auch Kollisionen, bei denen keine Wagenecke im
// Hindernis liegt. Die gedrehten Standflächen werden gegen den Stadtplan geprüft.
function intersects(poly, box) {
  const rect = [[box[0], box[1]], [box[2], box[1]], [box[2], box[3]], [box[0], box[3]]];
  const axes = [[1, 0], [0, 1], ...poly.map((p, i) => { const q = poly[(i + 1) % poly.length]; return [q[1] - p[1], p[0] - q[0]]; })];
  return axes.every(([x, y]) => {
    const a = poly.map(p => p[0] * x + p[1] * y), b = rect.map(p => p[0] * x + p[1] * y);
    return Math.min(Math.max(...a), Math.max(...b)) - Math.max(Math.min(...a), Math.min(...b)) > 1e-5;
  });
}
const cartObstacles = [...buildings, H.FARM, ...H.HAMLET].map(b => ({ id: b.id || 'Bauernhaus', box: S.buildingBox(b) }))
  .concat(H.CITY_DETAILS.map(d => ({ id: d.id, box: S.cityDetailBox(d) })))
  .concat(H.CITY_ACTORS.filter(a=>a.hours).map(a=>({id:a.id,box:[a.x-.08,a.y-.08,a.x+.08,a.y+.08]})))
  .concat(H.PROPS.filter(p => ['crates', 'barrels', 'nets', 'well', 'statue', 'pillory', 'logs', 'cross', 'ropes', 'sails'].includes(p.t)).map(p => ({ id: p.t + '@' + p.x, box: S.propBox(p) })));
// A currently empty caravan pitch is still reserved for the next camp.
for(const sp of H.CARAVAN_SPOTS){
  const a=H.caravanBox(sp),camp=[[a[0],a[1]],[a[2],a[1]],[a[2],a[3]],[a[0],a[3]]];
  for(const b of [...buildings,H.FARM,...H.HAMLET]){
    check(!intersects(camp,S.buildingBox(b)),'Building occupies a caravan camp: '+b.id);
    for(const e of S.buildingExtras(b))if(e.box)check(!intersects(camp,e.box),'Work yard occupies a caravan camp: '+b.id+'/'+e.part);
  }
  for(const [x1,y1,x2,y2,w]of H.STREETS){const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy),nx=-dy/len*w/2,ny=dx/len*w/2;
    check(!intersects([[x1+nx,y1+ny],[x2+nx,y2+ny],[x2-nx,y2-ny],[x1-nx,y1-ny]],a),'Road crosses caravan camp');
  }
}
const workerClock=S.clock;S.clock=.5;
check(S.ruralWorkers(H.state,'summer',0).length===10,'A rural profession has no visible worker');
for(const worker of S.ruralWorkers(H.state,'summer',0)){
  check(!S.blockedAt(worker.x,worker.y),'Rural worker is inside an obstacle: '+worker.site);
  check(!S.isWater(worker.x,worker.y)&&!H.Iso.inHull(S.moatBand().inner,worker.x,worker.y),'Rural worker stands in water');
  const yard=S.buildItems({},H.state,'summer',0),it=yard.find(it=>it.ruralWorker?.site===worker.site),house=yard.find(it=>it.pick?.building?.id===worker.site&&it.c);
  check(it?.pick?.building?.id===worker.site,'Worker cannot open its real business');
  const building=H.RURAL_BUILDINGS[worker.site];
  if(worker.x>=building.x-.1&&worker.y>building.y+building.d)check(yard.indexOf(it)>yard.indexOf(house),'Worker is drawn behind the building in front of it: '+worker.site+'/'+house?.c);
}
S.clock=.95;check(!S.ruralWorkers(H.state,'summer',0).length,'Day workers ignore night');S.clock=.5;
check(S.ruralWorkers(H.state,'winter',0).length===8,'Winter field workers still harvesting');
H.state.rural.sites.woodcutter.active=false;check(!S.ruralWorkers(H.state,'summer',0).some(w=>w.site==='woodcutter'),'Paused operation keeps working');H.state.rural.sites.woodcutter.active=true;S.clock=workerClock;
check(H.RURAL_FORESTS.every(f=>f.trees.length>=12),'Woodland is just a few isolated trees');
function checkCart(w, p) {
  const layout = S.barrowLayout(p.wx, p.wy, w.head ?? 0, { ox: w.ox, loading: w.state === 'lift', actorPos: w.actorPos, actorHead: w.actorHead });
  for (const poly of [layout.body, layout.actorHull]) {
    const hit = cartObstacles.find(b => intersects(poly, b.box));
    check(!hit, `Wagen oder Zugtier schneidet ${hit?.id}: ${JSON.stringify({p,poly})}`);
    check(poly.every(v => !S.isWater(...v) || S.pierAt(...v)), 'Wagen oder Zugtier steht neben Land und Steg: ' + JSON.stringify({p,head:w.head,state:w.state,poly}));
  }
}
const distanceToRoad = (p, road) => {
  const dx = road[2] - road[0], dy = road[3] - road[1];
  const t = Math.max(0, Math.min(1, ((p[0] - road[0]) * dx + (p[1] - road[1]) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(p[0] - road[0] - t * dx, p[1] - road[1] - t * dy);
};
for (const [i, p] of H.TREES.entries()) {
  check(!S.isWater(...p), `Baum ${i} steht im Wasser`);
  check(!buildings.some(b => contains(S.buildingBox(b), p[0], p[1], 0.12)), `Baum ${i} steckt in einem Haus`);
  check(!H.STREETS.some(r => distanceToRoad(p, r) < r[4] / 2 + 0.12), `Baum ${i} steht auf einem Weg`);
  check(!H.PROPS.some(q => contains(S.propBox(q), p[0], p[1], 0.12)), `Baum ${i} steckt in einer Requisite`);
}
const treeSeed = seed;
for (const tr of H.TREES) {
  S.treeProfile(...tr);
  for (const weather of ['clear', 'rain', 'snow']) {
    S.weather = weather;
    for (let t = 0; t < 20; t += .5) check(Number.isFinite(S.treeMotion(...tr, t)) && Math.abs(S.treeMotion(...tr, t)) <= .036, 'Baumbewegung springt oder schlägt zu stark aus');
  }
}
check(seed === treeSeed, 'Baumvariation verändert den Zufall der Wirtschaftssimulation');
S.weather = 'clear';
// Herds remain on pasture, away from the moat, buildings and cultivated fields.
const ruralMoat=S.moatBand().inner;
// Moving animals must actually cover ground, face their travel direction and
// keep supporting hooves planted. Resting must not mean freezing the head.
const animalCoverage=Array.from({length:S.ruralAnimals(0).length},()=>({distance:0,rests:0,steps:0}));
let previousAnimals;
for(let frame=0;frame<=7200;frame++){
  const animals=S.ruralAnimals(frame/60);
  for(const [i,a] of animals.entries()){
    const old=previousAnimals?.[i],coverage=animalCoverage[i];
    if(!a.walking)coverage.rests++;
    if(old){
      const dx=a.x-old.x,dy=a.y-old.y,distance=Math.hypot(dx,dy);coverage.distance+=distance;
      check(distance<.006,'Animal teleports between animation frames');
      if(distance>1e-6)check((dx*Math.cos(a.head)+dy*Math.sin(a.head))/distance>.99,'Animal walks backwards or sideways');
      for(let j=0;j<4;j++)if(a.motion.stance[j]&&old.motion.stance[j]){
        check(Math.hypot(...a.motion.feet[j].map((v,k)=>v-old.motion.feet[j][k]))<1e-9,'Supporting hoof slides over the ground');coverage.steps++;
      }
    }
    if(a.type==='cow')for(const foot of a.motion.feet)check(foot[0]>41.05&&foot[0]<43.65&&foot[1]>17.9&&foot[1]<19.85,'Cow hoof leaves its pasture');
  }
  previousAnimals=animals;
}
for(const a of animalCoverage){check(a.distance>1,'Animal never leaves its standing position');check(a.rests>100&&a.steps>100,'Animal has no grazing pauses or grounded steps');}
for(let t=0;t<150;t+=.5)for(const a of S.ruralAnimals(t)){
  const corners=[[a.x-.25,a.y-.2],[a.x+.25,a.y-.2],[a.x+.25,a.y+.2],[a.x-.25,a.y+.2]];
  check(corners.every(p=>!S.isWater(...p)&&!H.Iso.inHull(ruralMoat,...p)),'Livestock enters water or the moat');
  check(![...buildings,H.FARM,...H.HAMLET].some(b=>contains(S.buildingBox(b),a.x,a.y,.25)),'Livestock overlaps a house');
  // Only the field hare at the east wood's edge may sit in a (purely decorative) field; every other animal stays out.
  if(a.type!=='hare')check(!H.FIELDS.some(([x,y,w,d])=>a.x>x-.2&&a.x<x+w+.2&&a.y>y-.2&&a.y<y+d+.2),'Livestock tramples a cultivated field');
}
for(const b of Object.values(H.RURAL_BUILDINGS))check(S.buildingBox(b).every(Number.isFinite)&&Number.isFinite(S.buildingHeight(b)),'Rural landmark has invalid selection geometry');
for (const [i, p] of H.PROPS.entries()) {
  if (p.t === 'stalls') continue;
  const a = S.propBox(p);
  check(!S.isWater(p.x, p.y), `Requisite ${i} (${p.t}) steht im Wasser`);
  check(!buildings.some(b => Math.min(a[2], b.x + b.w) - Math.max(a[0], b.x) > 0.06 && Math.min(a[3], b.y + b.d) - Math.max(a[1], b.y) > 0.06), `Requisite ${i} (${p.t}) steckt in einem Haus`);
}
// Die seitlichen Abstände sind richtungsabhängig. Beide Richtungen prüfen,
// einschließlich der nachträglich gebauten Kirchenerweiterung.
for (const aisle of [false, true]) {
  H.state.churchBuild = { done: { aisle }, active: null };
  for (const [a, b] of H.ROAD_EDGES) {
    const forward = S.edgeFree(a, b), reverse = S.edgeFree(b, a);
    check(forward.length > 0 && reverse.length > 0, `Unpassierbarer Weg ${a} – ${b}, Seitenschiff: ${aisle}`);
    check(forward.every(off => reverse.includes(-off)), `Falsche Wegseite bei ${a} – ${b}`);
  }
  for (const npc of H.STATIC_NPCS) {
    const p = S.staticNpcPos(npc);
    check(!buildings.some(b => contains(S.buildingBox(b), p.x, p.y)), `${p.person} steht in einem Gebäude`);
    const route=S.namedNpcRoute(npc),poses=new Set(),appearance=H.NAMED_LOOKS[npc.person];
    check(!!appearance?.action, `${npc.person} hat kein individuelles Aussehen`);
    check(route.length>=.39, `${npc.person} hat keinen begehbaren Rundgang`);
    let previous=S.namedNpcPose(npc,0),walking=false,working=false;
    for(let frame=1;frame<=3600;frame++) {
      const current=S.namedNpcPose(npc,frame/30);
      check(S.namedNpcClear(current.x,current.y), `${npc.person} läuft in ein Hindernis, Seitenschiff: ${aisle}`);
      check(Math.hypot(current.x-previous.x,current.y-previous.y)<=.35/30+.00001, `${npc.person} springt zwischen Positionen`);
      check(current.moving||current.phase===0, `${npc.person} läuft bei der Arbeit auf der Stelle`);
      walking ||= current.moving;working ||= !current.moving;
      poses.add(current.action+'|'+current.head+'|'+current.frame);
      previous=current;
    }
    check(walking&&working, `${npc.person} wechselt nicht zwischen Arbeit und Rundgang`);
    check(poses.size<=40, `${npc.person} erzeugt unbegrenzt neue Zeichengeometrie`);
  }
}
H.state.churchBuild = { done: {}, active: null };
// The foregate walls must be obstacles, and every permitted approach/turn
// must clear their rendered footprint, including lane blending at junctions.
const gateSolids=H.WALL.gates.flatMap(g=>S.gateParts(S.gateSpec(g)).filter(p=>typeof p.part==='number').map(p=>p.box));
for(const b of gateSolids)check(S.blockedAt((b[0]+b[2])/2,(b[1]+b[3])/2),'Vorwerksmauer fehlt im Hindernisraster');
check(!H.ROAD_ADJ.OUT.includes('MILLROAD'),'Mühlenweg zweigt innerhalb des Vorwerks ab');
check(S.route('G','MILLROAD').includes('GATEEXIT'),'Weg zur Mühle umgeht den Ausgang des Vortors');
for(const [node,point]of Object.entries(H.ROAD_NODES)){
  if(!H.WALL.gates.some(g=>{const sp=S.gateSpec(g);return Math.hypot(point[0]-sp.cx,point[1]-sp.cy)<7;}))continue;
  for(const from of H.ROAD_ADJ[node])for(const to of H.ROAD_ADJ[node]){
    for(const incoming of S.edgeFree(from,node))for(const outgoing of S.edgeFree(node,to)){
      const end=S.walkerWorld({from,to:node,t:1,off:incoming});
      for(let i=0;i<=100;i++){
        const q=S.walkerWorld({from:node,to,t:i/100,off:outgoing,bx:end.wx,by:end.wy});
        check(!gateSolids.some(b=>contains(b,q.wx,q.wy,.04)),`Passant schneidet Vorwerk: ${from} – ${node} – ${to}`);
      }
    }
  }
}
// Zellmittelpunkte reichen an Hauskanten nicht aus: Punkte knapp innerhalb
// jeder Fassade müssen unabhängig von der Ausrichtung des Rasters gesperrt sein.
for (const b of [...buildings, H.FARM, ...H.HAMLET]) {
  const a = S.buildingBox(b), mx = (a[0] + a[2]) / 2, my = (a[1] + a[3]) / 2;
  for (const [x, y] of [[a[0] + .001, my], [a[2] - .001, my], [mx, a[1] + .001], [mx, a[3] - .001]])
    check(S.blockedAt(x, y), 'Hindernisraster lässt einen Punkt innerhalb der Fassade frei');
}
// Ein Passant zwischen Speicherwand und Ladekorb muss hinter dem Korb, aber
// vor der Wand erscheinen. Ein Korb in der Hausgrafik kann das nicht leisten.
const sortHouse = H.BUILDING.saltstore, hoistX = sortHouse.x + sortHouse.w;
const hoistY = sortHouse.y + sortHouse.d / 2;
const hoistParts = S.buildItems(null, H.state, S.season(), 0);
const core = hoistParts.find(it => it.c === 'b' + sortHouse.id);
const hoist = hoistParts.find(it => it.c === 'extra:' + sortHouse.id + ':hoist');
const px = hoistX + .35, py = hoistY - .25;
const passer = { k: S.pointKey(px, py), box: [px - .05, py - .05, px + .05, py + .05] };
const order = S.depthSort([core, hoist, passer]);
check(order.indexOf(core) < order.indexOf(passer) && order.indexOf(passer) < order.indexOf(hoist), 'Ladekorb wird zusammen mit der Speicherwand einsortiert');
check(hoist.box[2] >= hoistX + .62 && hoist.box[1] <= hoistY - .1, 'Ladekorb ragt aus seinem Sortiergrundriss');
// Rechts neben dem Salzspeicher überlappt das alte Quadrat die Fassade und
// zieht den Wagen hinter das Haus. Sein wirklicher Grundriss ist frei.
for (const ox of [false, true]) {
  const cart = { head: Math.PI / 2, ox }, parts = [];
  S.cartItems(parts, { wx: 9.5, wy: 3.15 }, cart, 0);
  const sorted = S.depthSort([core, ...parts]);
  check(parts.length === 2 && parts.every(it => it.box[0] > sortHouse.x + sortHouse.w), 'Wagengrundriss enthält die benachbarte Hauswand');
  check(parts.every(it => sorted.indexOf(it) > sorted.indexOf(core)), 'Wagen wird hinter der benachbarten Fassade gezeichnet');
}
for (const b of H.BUILDINGS.filter(b => b.kind === 'longhouse' && !b.low)) {
  const goods = hoistParts.find(it => it.c === 'extra:' + b.id + ':crate');
  check(goods && goods.box[1] > b.y + b.d, 'Ladekiste wird als Teil der Fassade sortiert');
  check(hoistParts.find(it => it.c === 'extra:' + b.id + ':pad')?.box === null, 'Bodenschattierung verdeckt Figuren');
}
for (const [i, [x, y, w, d]] of H.FIELDS.entries()) {
  check(![...H.HAMLET, H.FARM].some(b => Math.min(x + w, b.x + b.w) - Math.max(x, b.x) > 0.02 && Math.min(y + d, b.y + b.d) - Math.max(y, b.y) > 0.02), `Feld ${i} überlappt ein Bauernhaus`);
  for (const [j, [qx, qy, qw, qd]] of H.FIELDS.entries()) if (j > i) check(!(Math.min(x + w, qx + qw) - Math.max(x, qx) > 0.02 && Math.min(y + d, qy + qd) - Math.max(y, qy) > 0.02), `Felder ${i} und ${j} überlappen`);
}
S.initChickens();
for (let i = 0; i < 200; i++) { S.update(0.1); for (const c of S.chickens) check(!S.blockedAt(c.x, c.y), 'Huhn wandert in ein Hindernis: ' + JSON.stringify(c)); }
// Wachen müssen genau einmal auf ihrem Mauerstück gezeichnet werden,
// mit einer danach gezeichneten Brüstung im Vordergrund.
const noop = () => {}, fake = new Proxy({ globalAlpha: 1 }, { get: (target, key) => key in target ? target[key] : key.startsWith('create') ? () => ({ addColorStop: noop }) : noop, set: (target, key, value) => { target[key] = value; return true; } });
// Tatsächliche Zeichenhöhen prüfen: Land, Waren und Kaikrone müssen dieselbe
// Auflagefläche haben. Eine reine Prüfung der Weltkoordinaten erkennt das nicht.
const iso = H.Iso, originalPoly = iso.poly, originalCylinder = iso.cylinder;
// Nachtlicht folgt Hausrhythmen, bleibt über Mitternacht stabil und
// verbraucht keinen Zufall aus der Wirtschaft. Fenster und Laternen separat prüfen.
{
  const saved = { clock: S.clock, nightK: S.nightK, emitOff: S.emitOff, picking: S.picking }, randomSeed = seed;
  const window3 = iso.window3, records = [], counts = [], intensities = new Set();
  S.nightK = 1; S.emitOff = false; S.picking = false;
  iso.window3 = (ctx, a) => { const glow = S.windowLight(a); records.push(glow); if (glow) intensities.add(glow.brightness.toFixed(4)); };
  try {
    for (const clock of [.85, .955, .08]) {
      S.clock = clock; records.length = 0;
      for (const b of buildings) S.drawBuilding(fake, b, H.state, S.season(), S.shadowVec());
      counts.push(records.filter(Boolean).length);
      check(records.some(v => !v) && records.some(Boolean), 'Alle Fenster sind gleich beleuchtet');
    }
    check(counts[0] > counts[1] && counts[1] > counts[2], 'Fenster erlöschen nicht im Laufe der Nacht');
    check(counts[2] < counts[0] * .2, 'In der tiefen Nacht bleiben zu viele Fenster an');
    check(intensities.size > 12, 'Fenster haben keine unterschiedlichen Helligkeiten');
    for (const b of buildings) {
      S.clock = .999999; const before = S.houseLightKey(b); S.clock = .000001;
      check(S.houseLightKey(b) === before, 'Hauslicht springt um Mitternacht');
    }
    S.clock = .85; const b = H.BUILDING.house1, house = H.state.houses[b.plot], damaged = house.damaged;
    house.damaged = true;
    check(S.withHouseLights(b, () => S.windowLight([b.x + b.w, b.y + .2, .3])) === null, 'Beschädigtes Haus bleibt beleuchtet');
    house.damaged = damaged;
    S.clock = .5; check(S.withHouseLights(b, () => S.windowLight([b.x + b.w, b.y + .2, .3])) === null, 'Fenster leuchtet tagsüber');
    S.clock = .85; S.emitOff = true; check(S.withHouseLights(b, () => S.windowLight([b.x + b.w, b.y + .2, .3])) === null, 'Emission übergeht gesperrte Beleuchtung'); S.emitOff = false;
    S.clock = .08;
    let off = 0;
    for (let i = 0; i < 100; i++) { if (S.lampGlow(i * 47, i * 31) === 0) off++; check(S.lampGlow(i * 47, i * 31, 'beacon') === 1, 'Leuchtfeuer erlischt nachts'); check(S.lampGlow(i * 47, i * 31, 'ship') === .58, 'Schiffslicht flackert bei Ortsänderung'); }
    check(off > 75, 'Die meisten dekorativen Laternen bleiben in der tiefen Nacht an');
    check(seed === randomSeed, 'Lichtvariation verändert den Spielzufall');
  } finally { iso.window3 = window3; Object.assign(S, saved); }
}
// Stadtdetails stehen auf Land, haben eigene Standflächen und sperren
// keine bestehenden Straßen. Tierbewegungen bleiben im geprüften Freiraum.
{
  const saved = { clock: S.clock, weather: S.weather, picking: S.picking }, randomSeed = seed;
  const overlap = (a, b) => Math.min(a[2], b[2]) > Math.max(a[0], b[0]) + 1e-6 && Math.min(a[3], b[3]) > Math.max(a[1], b[1]) + 1e-6;
  const obstacles = [...H.BUILDINGS.filter(b => !['water', 'market', 'gate'].includes(b.kind)), H.FARM, ...H.HAMLET].map(b => S.buildingBox(b));
  obstacles.push(...H.PROPS.filter(p => p.t !== 'stalls').map(p => S.propBox(p)));
  for (const b of H.BUILDINGS) for (const e of S.buildingExtras(b)) if (e.box) obstacles.push(e.box);
  for (const [x, y] of H.TREES) obstacles.push([x - .1, y - .1, x + .1, y + .1]);
  try {
    S.clock = .5; S.weather = 'clear'; S.picking = false;
    for (const [i, d] of H.CITY_DETAILS.entries()) {
      const box = S.cityDetailBox(d);
      check(!obstacles.some(b => overlap(b, box)), 'Stadtdetail schneidet bestehendes Objekt: ' + d.id);
      for (const other of H.CITY_DETAILS.slice(i + 1)) check(!overlap(box, S.cityDetailBox(other)), 'Stadtdetails überlappen');
      for (const x of [box[0], box[2]]) for (const y of [box[1], box[3]]) check(!S.isWater(x, y), 'Stadtdetail steht im Wasser: ' + d.id);
      check(S.blockedAt(d.x + d.w / 2, d.y + d.d / 2), 'Passanten können durch Stadtdetails laufen: ' + d.id);
    }
    for (const actor of H.CITY_ACTORS) {
      S.clock = actor.hours ? (actor.hours[0] + actor.hours[1]) / 2 : .5;
      check(S.cityActorActive(actor), 'Alltagsszene fehlt tagsüber');
      check(!S.blockedAt(actor.x, actor.y), 'Alltagsfigur steckt in einem Hindernis: ' + actor.id);
      const box = [actor.x - .08, actor.y - .08, actor.x + .08, actor.y + .08];
      check(![...obstacles, ...H.CITY_DETAILS.map(S.cityDetailBox)].some(b => overlap(b, box)), 'Alltagsfigur schneidet ein Objekt: ' + actor.id);
      if(actor.fishing) check(S.isWater(actor.x+actor.fishing[0],actor.y+actor.fishing[1]), 'Angelschnur endet auf Land: '+actor.id);
    }
    S.clock = .5;
    check(S.cityMarketOpen(), 'Markt ist tagsüber geschlossen');
    const daytime = []; S.cityItems(daytime, H.state, 'summer', 2);
    check(daytime.some(it=>it.cityActor?.id==='dock-fishmonger') && !daytime.some(it=>it.cityActor?.id==='dock-dice-player'), 'Hafen hat keinen getrennten Tag- und Abendbetrieb');
    S.clock=.83; const evening=[]; S.cityItems(evening,H.state,'summer',2);
    check(evening.some(it=>it.cityActor?.id==='dock-dice-player') && evening.some(it=>it.cityActor?.id==='dock-fiddler') && !evening.some(it=>it.cityActor?.id==='dock-fishmonger'), 'Abendrunde fehlt oder Tagesarbeit dauert die ganze Nacht');
    check(daytime.find(it=>it.cityDetail?.kind==='fishTray').v !== evening.find(it=>it.cityDetail?.kind==='fishTray').v, 'Fischstand bleibt nach Ladenschluss offen im Grafikcache');
    S.clock=.5;
    check(daytime.filter(it => it.cityVendor !== undefined).length === 6, 'Markthändler fehlen');
    for (const it of daytime.filter(it => it.cityVendor !== undefined)) check(!S.blockedAt((it.box[0] + it.box[2]) / 2, (it.box[1] + it.box[3]) / 2), 'Händler steckt in einem Marktobjekt');
    for (const group of H.CITY_BIRDS) for (let frame = 0; frame < 600; frame++) for (let i = 0; i < group.n; i++) {
      const p = S.cityBirdPose(group, i, frame / 3), next = S.cityBirdPose(group, i, (frame + .01) / 3);
      check(Object.values(p).every(Number.isFinite), 'Vogel enthält ungültige Koordinaten');
      if (!p.z) check(!S.blockedAt(p.x, p.y), 'Vogel läuft in ein Hindernis');
      else check(S.pierAt(p.x, p.y), 'Möwe sitzt neben dem Steg');
      if (group.radius) check((next.x - p.x) * Math.cos(p.head) + (next.y - p.y) * Math.sin(p.head) > 0, 'Vogel läuft rückwärts');
    }
    for (const clump of S.cityVegetation()) check(!S.isWater(clump.x, clump.y), 'Wiesen- oder Uferpflanze schwebt über dem Meer');
    S.clock = .08; const night = []; S.cityItems(night, H.state, 'summer', 2);
    check(!S.cityMarketOpen() && !night.some(it => it.cityActor || it.cityVendor !== undefined || it.cityBird), 'Alltagsszenen ignorieren die tiefe Nacht');
    S.clock = .5; S.weather = 'rain'; const rain = []; S.cityItems(rain, H.state, 'summer', 2);
    check(!rain.some(it => it.cityActor || it.cityBird), 'Ungeschützte Alltagsszenen ignorieren schlechtes Wetter');
    check(rain.filter(it=>it.cityVendor!==undefined).length===6, 'Überdachte Marktstände verlieren bei Regen ihre Händler');
    const winter = []; S.cityItems(winter, H.state, 'winter', 2);
    check(!winter.some(it => it.cityPlant), 'Blumen wachsen im winterlichen Schnee');
    check(seed === randomSeed, 'Stadtflair verändert den Wirtschafts-Zufall');
  } finally { Object.assign(S, saved); }
}
// Ziernischen und Speicherluken müssen auf beiden Giebelrichtungen in
// der tatsächlichen Treppensilhouette liegen, auch an schmalen Häusern.
{
  const line = iso.line, savedPicking = S.picking; S.picking = false;
  try {
    for (const w of [.4, .7, 1, 1.7, 2.8]) for (const d of [.4, .9, 1.5, 2.4]) for (const side of ['L', 'R']) for (let variant = 0; variant < 3; variant++) {
      const b = { x: 2 + variant * .1, y: 3, w, d, h: 1.1 }, rh = Math.min(w, d) * .62 + .12, drawn = [];
      const pts = side === 'L' ? iso.stepGableL(fake, b.x, b.y, d, b.h, w, rh, '#9c4e40', 5) : iso.stepGableR(fake, b.x, w, b.y, b.h, d, rh, '#9c4e40', 5);
      const axis = side === 'L' ? 0 : 1, hull = pts.map(p => [p[axis], p[2]]);
      iso.poly = (ctx, points) => drawn.push(...points);
      iso.line = (ctx, a, b) => drawn.push(a, b);
      S.gableDeco(fake, b, pts, side);
      check(drawn.length > 0, 'Giebel hat keine Details mehr');
      for (const p of drawn) { check(p.every(Number.isFinite), 'Giebeldetail enthält ungültige Koordinaten'); check(iso.inHull(hull, p[axis], p[2]), 'Giebeldetail ragt aus der Treppensilhouette'); }
      iso.poly = originalPoly; iso.line = line;
    }
  } finally { iso.poly = originalPoly; iso.line = line; S.picking = savedPicking; }
}
let polygons = [], cylinders = [];
iso.poly = (ctx, points, fill) => polygons.push({ points, fill });
iso.cylinder = (ctx, x, y, z, r, h) => cylinders.push({ x, y, z, r, h });
try {
  check(S.WATER_Z < 0, 'Meer liegt nicht unter dem Land');
  S.drawWindmillBody(fake, S.shadowVec());
  const mill = S.windmillBox();
  check(polygons.flatMap(p => p.points).every(p => p.every(Number.isFinite) && !S.isWater(p[0], p[1])), 'Mühle enthält ungültige Geometrie oder steht im Wasser');
  check(polygons.flatMap(p => p.points).filter(p => p[2] === 0).every(p => contains(mill, p[0], p[1], 0.001)), 'Mühlenfuß liegt außerhalb seines Grundrisses');
  polygons = [];
  for (const [A, B, n, quay, len] of S.coastEdges()) {
    if (!quay) continue;
    polygons = []; cylinders = [];
    S.drawQuayWall(fake, A, B, n, len);
    const face = polygons[0].points, crown = polygons.find(p => p.fill === '#9c9a92').points;
    check(Math.min(...face.map(p => p[2])) === S.WATER_Z, 'Kaifuß endet über dem Wasser');
    check(Math.max(...polygons.flatMap(p => p.points.map(q => q[2]))) === 0, 'Kaimauer verdeckt den Boden mit einer erhöhten Krone');
    for (const end of [A, B]) check(crown.some(p => Math.hypot(p[0] - end[0], p[1] - end[1]) < 1e-9 && p[2] === 0), 'Kaikrone ist am Anschluss versetzt');
    check(cylinders.every(p => p.z === 0), 'Poller schwebt über der Kaifläche');
  }
  polygons = []; cylinders = [];
  S.drawBank(fake, [32.4, 19.25], [33.4, 19.8], [0, 1], Math.hypot(1, 0.55), true, 'summer');
  check(Math.max(...polygons.flatMap(p => p.points.map(q => q[2]))) === 0, 'Böschung ragt über die Landfläche');
  check(Math.min(...polygons.flatMap(p => p.points.map(q => q[2]))) === S.WATER_Z, 'Böschungsfuß liegt nicht auf Meereshöhe');
  polygons = []; cylinders = []; S.lamps = [];
  S.drawMole(fake, S.shadowVec());
  check(polygons.filter(p => p.fill === '#837d72').every(p => p.points.every(q => q[2] === 0)), 'Mole schließt nicht auf Kaideckhöhe an');
  // Der Leuchtturm wird seit dem Mole-Umbau getrennt vom begehbaren Deck gezeichnet.
  S.drawLighthouse(fake);
  check(cylinders.find(p => p.x === H.LIGHTHOUSE.x && p.y === H.LIGHTHOUSE.y).z === 0, 'Leuchtturm schwebt über der Mole');
  // Die gezeichnete Plankenfläche und ihre Nutzer müssen bündig zum Stein
  // liegen. Auch ein Deck auf z = 0 bleibt für die Wegsuche begehbar.
  for (const pier of H.PIERS) {
    polygons = []; cylinders = [];
    S.drawPier(fake, pier, 0);
    const top = polygons.find(p => p.fill === '#625a49').points;
    check(top.every(p => p[2] === 0), 'Anleger liegt höher als der Kai');
    check(Math.max(...polygons.flatMap(p => p.points.map(q => q[2]))) === 0, 'Randbalken erzeugt eine Stufe am Anleger');
    for (const q of top.filter(p => p[1] === pier.y0)) check(q[1] === S.uferY(q[0]), 'Anleger beginnt neben der Kaikante');
    check(cylinders.every(p => p.z === S.WATER_Z && p.z + p.h <= 0), 'Stegpfähle ragen durch das Deck');
    for (let y = pier.y0 - 0.3; y <= pier.y1 - 0.1; y += 0.1) {
      check(S.deckZ(pier.lane, y) === 0, 'Träger hebt beim Übergang vom Kai zum Steg ab');
      check(!S.blockedAt(pier.lane, y), 'Bündiger Anleger wird von der Wegsuche als Wasser gesperrt');
    }
    check(S.pierAt(pier.x, pier.y1 - 0.1) === pier && !S.pierAt(pier.x, pier.y1 + 0.1), 'Begehbarer Anleger endet neben seiner Zeichnung');
    const savedBox = iso.box, boxes = [];
    iso.box = (ctx, x, y, z, w, d, h) => boxes.push({ x, y, z, w, d, h });
    try {
      S.drawPierEnd(fake, pier, 0);
      check(boxes.every(p => p.z === 0), 'Poller schwebt über dem Anlegedeck');
      boxes.length = 0;
      const dock = S.docks().find(d => d.pier === pier);
      S.drawTreadCrane(fake, dock);
      check(boxes[0].z === 0, 'Kran schwebt über dem Anleger');
      const oldCargo = S.drawCargo, cargo = [];
      S.drawCargo = (ctx, x, y, z) => cargo.push(z);
      try { S.drawStack(fake, { x: pier.lane, y: pier.y0 + 1, items: [{ good: 'salt', kind: 'crate' }] }, S.shadowVec()); }
      finally { S.drawCargo = oldCargo; }
      check(cargo[0] === 0, 'Ware schwebt über dem Anleger');
    } finally { iso.box = savedBox; }
  }
  // Luke, Mastkorb und Waren müssen die Skalierung und Wasserhöhe des Schiffes übernehmen.
  const oldCrate = S.crate3, oldBarrel = S.barrel3, cargo = [], scale = 1.37, x = 18;
  S.crate3 = (ctx, wx, wy, z) => cargo.push({ u: 0.42, z });
  S.barrel3 = (ctx, wx, wy, z) => cargo.push({ u: cargo.length === 1 ? -0.4 : 0.45, z });
  try {
    polygons = []; cylinders = [];
    S.drawShip(fake, x, 25, 0.7, scale, 'luebeck', true, false);
    // Stationsriss des Havenrode-Vorbilds: 21 Pixel Deck über einer
    // Wasserlinie bei -14, 0,015 Welteinheiten je Höhenpixel.
    const bob = Math.sin(S.time * 1.1 + x) * 0.012;
    const deck = u => 0.525 + Math.max(0, Math.abs((u + 1.2) * 4.85 / 2.45 - 2.2) - 0.8) * 0.075 + bob;
    for (const item of cargo) check(Math.abs(item.z - S.WATER_Z - deck(item.u) * scale) < 1e-9, 'Ladung schwebt über dem Schiffsdeck');
    const hatch = polygons.find(p => p.fill === '#5b3e25');
    check(hatch.points.every(p => Math.abs(p[2] - S.WATER_Z - (deck(0) + 0.07) * scale) < 1e-9), 'Luke hat eine andere Höhe als ihr Süll');
    check(cylinders.some(p => Math.abs(p.z - S.WATER_Z - (2.05 + bob) * scale) < 1e-9 && Math.abs(p.h - 0.075 * scale) < 1e-9), 'Mastkorb sitzt nicht am Mast');
  } finally { S.crate3 = oldCrate; S.barrel3 = oldBarrel; }
} finally { iso.poly = originalPoly; iso.cylinder = originalCylinder; }
// Der neue Rumpf muss beim Drehen und Skalieren innerhalb seines tatsächlichen
// Grundrisses bleiben. Auch das breite Heck braucht beide Endpunkte im Riss.
check(S.shipFootprint(0, 0, 0, 1).length === S.SHIP_PROFILE.length * 2, 'Flaches Schiffsheck fehlt im Kollisionsgrundriss');
try {
  for (const scale of [0.9, 1.4, 1.7]) for (let turn = 0; turn < 16; turn++) {
    const heading = turn * Math.PI / 8, x = 18, y = 27, hull = S.shipFootprint(x, y, heading, scale * 1.000001);
    const hullColors = ['#6c5841', '#8b6948', '#a3855c'].flatMap(c => [iso.shade(c, 0.9), iso.shade(c, 1)]);
    for (const docked of [false, true]) {
      let hullVertices = 0;
      iso.poly = (ctx, points, fill) => {
        check(points.every(p => p.every(Number.isFinite)), 'Schiff enthält ungültige Geometrie');
        if (hullColors.includes(fill)) for (const p of points) { hullVertices++; check(iso.inHull(hull, p[0], p[1]), 'Gezeichneter Rumpf ragt aus dem Kollisionsgrundriss'); }
      };
      S.drawShip(fake, x, y, heading, scale, 'luebeck', docked, false);
      check(hullVertices > 0, 'Rumpf wird in einer Drehrichtung unsichtbar');
    }
  }
} finally { iso.poly = originalPoly; }
// Die Winde muss an den Wechseln weich anhalten; Lasten landen bündig auf
// dem freien Stapelplatz statt kurz vor dem Loslassen nach unten zu springen.
for (const dock of S.docks()) {
  const saved = { u: dock.u, working: dock.working, slot: dock.slot, load: dock.load }, oldCargo = S.drawCargo;
  try {
    dock.working = true; dock.slot = { th: 0.45, x: dock.cx + Math.sin(0.45) * dock.R, y: dock.cy + Math.cos(0.45) * dock.R, items: [] };
    for (const u of [0.13, 0.26, 0.4, 0.55, 0.67, 0.74, 0.86]) {
      dock.u = u - 1e-7; const before = S.craneState(dock);
      dock.u = u + 1e-7; const after = S.craneState(dock);
      check(Math.abs(before.lift - after.lift) < 1e-8 && Math.abs(before.th - after.th) < 1e-8, 'Kran ruckt am Ende einer Bewegung');
    }
    for (const kind of ['crate', 'barrel', 'sack']) for (let count = 0; count < 3; count++) {
      const positions = [];
      dock.u = 0.67 - 1e-7; dock.load = { good: 'salt', kind }; dock.slot.items = Array.from({ length: count }, () => ({ good: 'salt', kind }));
      S.drawCargo = (ctx, x, y, z) => positions.push([x, y, z]);
      S.drawTreadCrane(fake, dock);
      const expected = count === 2 && kind === 'crate' ? 0.28 : 0;
      check(positions.length === 1 && Math.abs(positions[0][2] - expected) < 1e-8, 'Kranlast wird über dem Stapel losgelassen');
      const before = positions[0]; positions.length = 0; dock.slot.items.push(dock.load);
      S.drawStack(fake, dock.slot, null);
      check(before.every((v, i) => Math.abs(v - positions.at(-1)[i]) < 1e-8), 'Kranlast springt beim Loslassen auf den Stapelplatz');
    }
  } finally { Object.assign(dock, saved); S.drawCargo = oldCargo; }
}
const harbourTower = H.WALL.towers[H.WALL.moat.to], towerEnd = H.WALL.pts[H.WALL.moat.to];
check(harbourTower[0] === towerEnd[0] && harbourTower[1] === towerEnd[1], 'Hafenturm steht neben der Mauerachse');
for (let i = 0; i < 64; i++) {
  const angle = i / 64 * Math.PI * 2;
  check(!S.isWater(harbourTower[0] + Math.cos(angle) * (harbourTower[2] + 0.04), harbourTower[1] + Math.sin(angle) * (harbourTower[2] + 0.04)), 'Fundament des Hafenturms ragt über die Uferkante');
}
for (const prop of H.PROPS.filter(p => ['crates', 'barrels'].includes(p.t) && p.x > 28 && p.y > 19)) {
  const box = S.propBox(prop);
  for (const x of [box[0], box[2]]) for (const y of [box[1], box[3]]) check(!S.isWater(x, y), 'Hafenware ragt mit ihrer Standfläche ins Wasser');
}
const originalPerson = S.drawPerson, originalPrism = S.prism;
// Hintere Geländer dürfen Schießscharten nicht übermalen. Die Reihenfolge
// muss für beide Mauerseiten und auch auf unbesetzten Mauerstücken stimmen.
const originalLine = iso.line, savedGuards = S.wallGuards;
let testedSlits = 0;
try {
  S.drawPerson = noop;
  for (const guards of [[], savedGuards]) {
    S.wallGuards = guards;
    for (const piece of S.wallSegments()) {
      const order = [];
      iso.line = function (...args) { if (args[3] === S.MAUER.holz) order.push('rail'); return originalLine.apply(this, args); };
      iso.poly = function (...args) {
        if (args[2] === '#2e2521' && args[1].every(p => p[2] >= H.WALL.h + 0.2 - 1e-9 && p[2] <= H.WALL.h + 0.44 + 1e-9)) order.push('slit');
        return originalPoly.apply(this, args);
      };
      S.prism = function (...args) { if (Math.abs(args[2] - H.WALL.h - 0.14) < 1e-9) order.push('merlon'); return originalPrism.apply(this, args); };
      piece.f(fake, S.shadowVec());
      if (!order.includes('rail') || !order.includes('merlon')) continue;
      if (order.includes('slit')) {
        testedSlits += order.filter(p => p === 'slit').length;
        check(order.lastIndexOf('rail') < order.indexOf('merlon'), 'Hinteres Geländer verdeckt Zinnen oder Schießscharten');
      } else check(order.lastIndexOf('merlon') < order.indexOf('rail'), 'Hintere Zinnen werden vor dem inneren Geländer gezeichnet');
    }
  }
  check(testedSlits > 0, 'Keine Schießscharten in der Prüfung erfasst');
} finally {
  S.wallGuards = savedGuards; S.drawPerson = originalPerson; S.prism = originalPrism; iso.line = originalLine; iso.poly = originalPoly;
}
// Die gesamte Mauer: keine sichtbare Wandfläche darf durch einen Turm
// laufen. Geteilte Sockel- und Ziegelschichten müssen an dessen Rundung enden.
const profiles = [];
S.prism = (ctx, base, z0, h, col, options) => { profiles.push({ base, z0, h, col, options }); return []; };
try { for (const piece of S.wallSegments()) piece.f(fake, S.shadowVec()); }
finally { S.prism = originalPrism; }
for (const p of profiles) {
  check(p.base.every(q => q.every(Number.isFinite)), 'Maueranschluss enthält ungültige Koordinaten');
  if (![S.MAUER.sockel, S.MAUER.ziegel, S.MAUER.kante].includes(p.col.wall)) continue;
  const radial = p.z0 === 0 ? 0.06 : Math.abs(p.z0 - (S.MAUER.sockelH - 0.04)) < 1e-9 ? 0.03 : 0;
  for (const [cx, cy, r] of H.WALL.towers) {
    check(!iso.inHull(p.base, cx, cy), 'Mauerstück läuft durch einen Turm');
    for (const q of p.base) check(Math.hypot(q[0] - cx, q[1] - cy) >= r + radial - 1e-8, 'Mauerschicht schneidet in den Turmschaft');
    for (const edge of [0, 1, 2, 3]) {
      const a = p.base[edge], b = p.base[(edge + 1) % 4], dx = b[0] - a[0], dy = b[1] - a[1];
      const u = Math.max(0, Math.min(1, ((cx - a[0]) * dx + (cy - a[1]) * dy) / (dx * dx + dy * dy)));
      check(Math.hypot(a[0] + u * dx - cx, a[1] + u * dy - cy) >= r + radial - 1e-8 || p.options?.hideEdges?.includes(edge), 'Wandfläche verdeckt die Turmrundung');
    }
  }
}
// Alle Turmfüße liegen auf z = 0. Die gezeichnete Ellipse muss die Projektion
// des Weltkreises treffen, nicht nur dieselbe Mitte wie die Mauer haben.
for (const [i, tower] of S.wallSegments().slice(-H.WALL.towers.length).entries()) {
  const [cx, cy, r] = H.WALL.towers[i], ellipses = [], stones = [], ledges = [];
  const roundContext = new Proxy(fake, { get: (target, key) => key === 'ellipse' ? (...args) => ellipses.push(args) : target[key] });
  iso.poly = (ctx, points, fill, ...rest) => {
    if (['rgba(205,200,188,0.28)', 'rgba(150,146,136,0.3)'].includes(fill)) stones.push(points);
    if(fill===iso.shade(S.MAUER.kante,1.08) && points.every(p=>Math.abs(p[2]-S.MAUER.sockelH-.01)<1e-8))ledges.push(points);
    return originalPoly.call(iso, ctx, points, fill, ...rest);
  };
  try { tower.f(roundContext, S.shadowVec()); } finally { iso.poly = originalPoly; }
  for (const stone of stones) for (const [x,y,z] of stone) {
    check(Math.abs(Math.hypot(x-cx,y-cy)-(r+.06)) < 1e-8, 'Sockelstein ragt seitlich über die Turmrundung');
    check(z>0 && z<S.MAUER.sockelH && x+y>=cx+cy, 'Sockelstein verlässt die sichtbare Sockelfläche');
  }
  // A complete cylinder used to paint across the joining wall, especially
  // the nearly horizontal connection at tower 12. Its covered arcs must be gone.
  for (const [radius,halfWidth] of [[r+.06,H.WALL.t/2+.06],[r+.03,H.WALL.t/2+.02]]) {
    const bottom=iso.p(cx,cy,radius===r+.06?0:S.MAUER.sockelH-.04);
    const arcs=ellipses.filter(e=>Math.abs(e[0]-bottom[0])<1e-8 && Math.abs(e[1]-bottom[1])<1e-8 && Math.abs(e[2]-radius*Math.SQRT2*iso.TW)<1e-8 && !e[7]).map(e=>[e[5],e[6]]);
    check(arcs.length>0,'Freie Sockelflächen werden nicht gezeichnet');
    for(const [a,b] of arcs)for(let j=1;j<20;j++) {
      const angle=a+(b-a)*j/20,x=cx+Math.cos(angle-Math.PI/4)*radius,y=cy+Math.sin(angle-Math.PI/4)*radius;
      for(let segment=0;segment<H.WALL.pts.length-1;segment++) {
        const A=H.WALL.pts[segment],B=H.WALL.pts[segment+1],dx=B[0]-A[0],dy=B[1]-A[1],len=Math.hypot(dx,dy);
        const centerOff=((cx-A[0])*dy-(cy-A[1])*dx)/len,centerAlong=((cx-A[0])*dx+(cy-A[1])*dy)/len;
        if(Math.abs(centerOff)>1e-8 || centerAlong<0 || centerAlong>len)continue;
        const along=((x-A[0])*dx+(y-A[1])*dy)/len,off=((x-A[0])*dy-(y-A[1])*dx)/len;
        check(along<0 || along>len || Math.abs(off)>=halfWidth-1e-8,'Turmsockel überzeichnet den angeschlossenen Mauersockel');
      }
    }
    for(const stone of stones)if(radius===r+.06)for(const [x,y] of stone) {
      const angle=Math.atan2(y-cy,x-cx)+Math.PI/4;
      check(arcs.some(([a,b])=>angle>=a-1e-8&&angle<=b+1e-8),'Sockelstein überzeichnet die Mauerfuge');
    }
  }
  // Both borders of the horizontal ledge must meet the corresponding wall
  // side. Reusing the outer angle for the inner radius left a step on corners.
  check(ledges.length>0,'Sockelring hat keine Deckfläche');
  for(const ring of ledges) {
    const split=ring.findIndex(([x,y])=>Math.abs(Math.hypot(x-cx,y-cy)-r)<1e-8);
    check(split>0,'Sockelring fehlt die innere Kante');
    for(const [outer,inner] of [[ring[0],ring.at(-1)],[ring[split-1],ring[split]]]) {
      if(Math.abs(outer[0]+outer[1]-cx-cy)<1e-8 && outer[0]>cx)continue; // 0/2π seam
      let connected=false;
      for(let j=0;j<H.WALL.pts.length-1;j++) {
        const A=H.WALL.pts[j],B=H.WALL.pts[j+1],dx=B[0]-A[0],dy=B[1]-A[1],len=Math.hypot(dx,dy);
        const off=q=>((q[0]-A[0])*dy-(q[1]-A[1])*dx)/len;
        if(Math.abs(off([cx,cy]))>1e-8)continue;
        if(Math.abs(Math.abs(off(outer))-(H.WALL.t/2+.02))<1e-8 && Math.abs(Math.abs(off(inner))-H.WALL.t/2)<1e-8 && off(outer)*off(inner)>0)connected=true;
      }
      check(connected,'Innere und äußere Sockelkante treffen nicht dieselbe Mauerfläche');
    }
  }
  const base = ellipses[0], centre = iso.p(cx, cy, 0);
  const right = iso.p(cx + (r + 0.06) / Math.SQRT2, cy - (r + 0.06) / Math.SQRT2, 0);
  const front = iso.p(cx + (r + 0.06) / Math.SQRT2, cy + (r + 0.06) / Math.SQRT2, 0);
  check(Math.abs(base[0] - centre[0]) < 1e-9 && Math.abs(base[1] - centre[1]) < 1e-9, 'Turmfuß hat einen Höhenversatz zum Boden');
  check(Math.abs(base[2] - right[0] + centre[0]) < 1e-9 && Math.abs(base[3] - front[1] + centre[1]) < 1e-9, 'Turmellipse passt nicht zum Weltgrundriss');
  check(Math.abs(tower.box[0] - cx + r + 0.06) < 1e-9 && Math.abs(tower.box[3] - cy - r - 0.06) < 1e-9, 'Turmsockel fehlt im Grundriss für die Zeichenreihenfolge');
}
for (let i = 1; i < H.WALL.pts.length - 1; i++) {
  const A = H.WALL.pts[i - 1], B = H.WALL.pts[i];
  for (const offset of [-0.36, -0.3, 0.3, 0.36]) {
    const left = S.wallSection(i - 1, Math.hypot(B[0] - A[0], B[1] - A[1]), offset), right = S.wallSection(i, 0, offset);
    check(Math.hypot(left[0] - right[0], left[1] - right[1]) < 1e-9, 'Mauerecke hat versetzte Anschlusskanten');
  }
}
for (const patrol of H.WALL_PATROLS) for (let i = 0; i <= 100; i++) {
  const g = { p: patrol, u: patrol.u0 + (patrol.u1 - patrol.u0) * i / 100, dir: 1 }, q = S.wallGuardPos(g);
  check(H.WALL.towers.every(([x, y, r]) => Math.hypot(q.x - x, q.y - y) > r + 0.06), 'Wache läuft in einen Turm');
}
// Die beiden Torvorwerke haben eigene kleine Rundtürme. Deren Wände und
// Sockel müssen ebenfalls am Kreis enden und auf demselben Boden stehen.
const originalBox = iso.box;
for (const gate of H.WALL.gates) {
  const spec = S.gateSpec(gate), parts = S.gateParts(spec);
  const centres = parts.filter(p => [4, 5].includes(p.part)).map(p => [(p.box[0] + p.box[2]) / 2, (p.box[1] + p.box[3]) / 2]);
  iso.box = (ctx, x, y, z, w, d) => {
    for (const [cx, cy] of centres) {
      check(!iso.inHull([[x, y], [x + w, y], [x + w, y + d], [x, y + d]], cx, cy), 'Vortormauer läuft durch einen Rundturm');
      for (const qx of [x, x + w]) for (const qy of [y, y + d]) check(Math.hypot(qx - cx, qy - cy) >= (z === 0 ? 0.3 : 0.27) - 1e-8, 'Vorwerksockel schneidet in den Turm');
    }
  };
  try { for (const part of [0, 1, 2, 3]) S.drawGatehouse(fake, spec, S.shadowVec(), part); }
  finally { iso.box = originalBox; }
  for (const part of [4, 5]) {
    const ellipses = [], ctx = new Proxy(fake, { get: (target, key) => key === 'ellipse' ? (...args) => ellipses.push(args) : target[key] });
    S.drawGatehouse(ctx, spec, S.shadowVec(), part);
    const centre = iso.p(...centres[part - 4], 0), base = ellipses[0];
    check(Math.abs(base[0] - centre[0]) < 1e-9 && Math.abs(base[1] - centre[1]) < 1e-9, 'Vortorturm hat einen Höhenversatz');
    check(Math.abs(base[2] - 0.3 * Math.SQRT2 * iso.TW) < 1e-9 && Math.abs(base[3] - 0.3 * Math.SQRT2 * iso.TH) < 1e-9, 'Vortorturm hat einen versetzten Grundriss');
  }
}
for (let frame = 0; frame < 160; frame++) {
  S.updateWallGuards(0.25); S.time += 0.25;
  let guards = 0;
  for (const piece of S.wallSegments()) {
    let front = false, drawn = false;
    S.drawPerson = (...args) => { if (args[4] === 'guard') { guards++; drawn = true; } };
    S.prism = function (...args) { if (drawn) front = true; return originalPrism.apply(this, args); };
    piece.f(fake, S.shadowVec());
    if (drawn) check(front, 'Wache wird vor der Brüstung gezeichnet');
  }
  check(guards === H.WALL_PATROLS.length, `Wache fehlt oder erscheint doppelt: ${guards}`);
}
S.drawPerson = originalPerson; S.prism = originalPrism;
// Unabhängige Polygonprüfung: berühren ist erlaubt, überlappen nicht.
function overlap(a, b) {
  for (const polygon of [a, b]) for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i], q = polygon[(i + 1) % polygon.length], nx = q[1] - p[1], ny = p[0] - q[0];
    const pa = a.map(v => v[0] * nx + v[1] * ny), pb = b.map(v => v[0] * nx + v[1] * ny);
    if (Math.max(...pa) <= Math.min(...pb) + 1e-6 || Math.max(...pb) <= Math.min(...pa) + 1e-6) return false;
  }
  return true;
}
const rectangle = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const solidDocks = H.PIERS.map(p => rectangle(p.x - p.w / 2, p.y0, p.x + p.w / 2, p.y1));
solidDocks.push(rectangle(H.MOLE.x, H.MOLE.y0, H.MOLE.x + H.MOLE.w, H.MOLE.y1));
function checkShip(a, scale, label) {
  check([a.x, a.y, a.heading].every(Number.isFinite), `${label}: ungültige Position`);
  const hull = S.shipFootprint(a.x, a.y, a.heading, scale);
  check(hull.every(p => Math.hypot(p[0] - a.x, p[1] - a.y) <= 1.3 * scale), `${label}: Schiffsumriss ist nicht in Weltkoordinaten`);
  check(hull.every(p => S.isWater(...p)), `${label}: Schiff fährt auf Land`);
  check(solidDocks.every(p => !overlap(hull, p)), `${label}: Rumpf durchquert Steg oder Mole`);
}
const anchored = [
  ...H.OWN_BERTHS.map(p => ({ ...p, heading: H.BERTH_HEADING + 0.3, scale: Math.max(...H.SHIP_TYPES.map(s => s.scale)) })),
  ...H.RIVAL_ANCHORAGE.map(p => ({ ...p, heading: p.h, scale: 0.9 })),
];
for (const [i, a] of anchored.entries()) {
  checkShip(a, a.scale, `Reede ${i}`);
  const p = H.Iso.p(a.x, a.y, 0);
  check(p[0] > 0 && p[0] < H.MAP.W && p[1] > 0 && p[1] < H.MAP.H, `Reede ${i} liegt außerhalb der erreichbaren Karte`);
  for (const b of anchored.slice(i + 1)) check(!overlap(S.shipFootprint(a.x, a.y, a.heading, a.scale), S.shipFootprint(b.x, b.y, b.heading, b.scale)), 'Ankernde Schiffe überschneiden sich');
}
// Alle fünf Liegeplätze durch die gesamte Anfahrt, Drehung und Abfahrt prüfen.
for (let berth = 0; berth < H.BERTHS.length; berth++) {
  H.state.ships = [{ id: 900 + berth, berth, origin: 'luebeck', name: 'Prüfschiff', cargo: { salt: 20 } }];
  S.shipAnim = {}; S.porters = []; S._docks = null;
  let arrived = false;
  for (let i = 0; i < 1400; i++) {
    S.update(0.1);
    const a = S.shipAnim[900 + berth]; checkShip(a, H.SHIP_SCALE, `Anfahrt ${berth}`);
    check(anchored.every(b => !overlap(S.shipFootprint(a.x, a.y, a.heading, H.SHIP_SCALE), S.shipFootprint(b.x, b.y, b.heading, b.scale))), `Anfahrt ${berth} durchquert ein ankerndes Schiff`);
    if (a.stage === 'moored') { arrived = true; break; }
  }
  check(arrived, `Schiff ${berth} erreicht seinen Liegeplatz nicht`);
  H.state.ships = [];
  for (let i = 0; i < 1400 && S.shipAnim[900 + berth]; i++) {
    S.update(0.1);
    const a = S.shipAnim[900 + berth]; if (a) checkShip(a, H.SHIP_SCALE, `Abfahrt ${berth}`);
  }
  check(!S.shipAnim[900 + berth], `Schiff ${berth} verlässt den Hafen nicht`);
}
for (let i = 0; i < 160; i++) { S.time = i * 0.5; checkShip(S.guardShip(), 1.15, 'Wachschiff'); }
// Der Lastplatz muss über einen Kranzyklus fest bleiben, auch wenn er voll wird.
S._docks = null;
const dock = S.docks()[0], oldBusy = S.craneBusy;
S.craneBusy = () => true;
H.state.ships = [{ id: 7781, berth: 0, sea: true, cargo: { salt: { qty: 24 } } }];
H.transport(H.state, H.state.ships[0], 'salt', 24, 'in');
dock.slots[0].items = Array.from({ length: S.STACK_MAX - 1 }, () => ({ good: 'salt', kind: 'sack' }));
S.updateDocks(0.1);
const target = dock.slot;
for (let i = 0; i < 100 && dock.u < 0.8; i++) { S.updateDocks(0.1); check(dock.slot === target, 'Kran springt während des Absetzens zum nächsten Stapel'); }
check(target.items.length === S.STACK_MAX, 'Kran legt die Last nicht am gewählten Platz ab');
S.craneBusy = oldBusy;
check(S.cargoKey([{ good: 'salt', kind: 'sack' }]) !== S.cargoKey([{ good: 'grain', kind: 'sack' }]), 'Verschiedene Waren teilen dieselbe Grafik');
// Keine rückwärts oder seitwärts laufenden Hühner, keine Sprünge beim Wenden.
S.initChickens();
let chickenSteps = 0;
for (let i = 0; i < 1800; i++) {
  const before = S.chickens.map(c => ({ x: c.x, y: c.y, phase: c.phase }));
  S.updateChickens(0.05);
  S.chickens.forEach((c, k) => {
    const dx = c.x - before[k].x, dy = c.y - before[k].y, distance = Math.hypot(dx, dy);
    check(distance <= 0.13 * 0.05 + 1e-9, 'Huhn springt beim Richtungswechsel');
    if (distance > 1e-8) {
      chickenSteps++;
      check((dx * Math.cos(c.head) + dy * Math.sin(c.head)) / distance > 0.999999, 'Huhn läuft entgegen seiner Blickrichtung');
      check(Math.abs(c.phase - before[k].phase - distance * 55) < 1e-8, 'Hühnergange ist nicht an Strecke gekoppelt');
    } else check(c.phase === before[k].phase, 'Huhn läuft auf der Stelle');
  });
}
check(chickenSteps > 100, 'Hühner bleiben dauerhaft stehen');
// Ein Rad ohne Schlupf bewegt seinen unteren Umfangspunkt entgegen der Fahrt.
for (let k = 0; k < 8; k++) for (const distance of [0.46, -0.23, 0]) {
  const head = k * Math.PI / 4, cart = { head, wheelSpin: 1.7 };
  S.rollCart(cart, { wx: 0, wy: 0 }, { wx: Math.cos(head) * distance, wy: Math.sin(head) * distance }, 0.23);
  check(Math.abs(distance + (cart.wheelSpin - 1.7) * 0.23) < 1e-9, 'Karrenrad dreht entgegen der tatsächlichen Fahrt');
  check(cart.moving === (distance !== 0), 'Karrenrad dreht beim Halt');
}
// Jedes Schiff liefert endlich viele Pakete. Ein Paket hat zu jedem Zeitpunkt
// genau einen Besitzer: Manifest, Haken, Stapel, Träger oder Lagerübergabe.
S._docks = null; S.porters = [];
H.state = H.newGame({ name: 'Waren', difficulty: 'normal', years: 20 }); H.state.freight.jobs = [];
H.state.ships = Array.from({ length: 4 }, (_, berth) => ({ id: 8000 + berth, berth, sea: true, cargo: { salt: { qty: 25 }, beer: { qty: 17 }, tools: { qty: 9 } } }));
S.snapShips();
for (const v of H.state.ships) for (const [good, cargo] of Object.entries(v.cargo)) H.transport(H.state, v, good, cargo.qty, 'in');
const economics = JSON.stringify({ money: H.state.money, stock: H.state.warehouse.stock, cargo: H.state.ships.map(v => v.cargo) });
for (const d of S.docks()) S.dockManifest(d);
const manifests = S.docks().flatMap(d => d.pending), expectedIds = new Set(manifests.map(it => it.id));
check(expectedIds.size === 32, 'Nicht alle vier Stegliegeplätze haben ihr Manifest');
for (const ship of H.state.ships) for (const [good, cargo] of Object.entries(ship.cargo)) {
  check(manifests.filter(it => it.shipId === ship.id && it.good === good).reduce((n, it) => n + it.qty, 0) === cargo.qty, 'Manifest verändert die Warenmenge');
}
for (let i = 0; i < 10000; i++) {
  S.updateDocks(0.1); S.updatePorters(0.1);
  for (const w of S.porters.filter(w => w.cart)) {
    const p = S.porterPos(w), dx = Math.cos(w.head || 0), dy = Math.sin(w.head || 0);
    checkCart(w, p);
    for (const side of [-1, 1]) {
      const x = p.wx - dx * 0.02 - dy * side * 0.35, y = p.wy - dy * 0.02 + dx * side * 0.35;
      check(!S.isWater(x, y) || S.pierAt(x, y), 'Karrenrad steht neben dem Steg im Wasser');
    }
  }
  const held = S.docks().flatMap(d => [...d.pending, ...(d.load ? [d.load] : []), ...d.slots.flatMap(s => s.items), ...d.delivered, ...d.cancelled]).concat(S.porters.flatMap(w => w.items));
  check(held.length === expectedIds.size && new Set(held.map(it => it.id)).size === expectedIds.size, 'Paket verschwindet oder ist doppelt vorhanden');
  for (const d of S.docks()) for (const slot of d.slots) {
    check(slot.items.length <= S.STACK_MAX, 'Stapel überschreitet Kapazität');
    check(slot.items.every(it => it.good === slot.items[0].good && it.kind === slot.items[0].kind), 'Unpassende Waren werden übereinander gestapelt');
    check(!(slot.reserved && slot.claimedBy), 'Kran und Träger bearbeiten denselben Stapel');
  }
  for (const d of S.docks()) check(S.craneState(d).reach <= d.R + 1e-9, 'Kranseil hängt außerhalb des Auslegers');
}
check(S.docks().flatMap(d => d.delivered).length === expectedIds.size, 'Restpakete werden nicht ins Lager gebracht');
check(S.docks().every(d => !d.working && !d.load && !d.pending.length && !S.dockItems(d)), 'Kran erzeugt nach Entladung neue Waren');
check(S.porters.length === 0, 'Träger verlassen nach Abschluss den Umschlag nicht');
check(JSON.stringify({ money: H.state.money, stock: H.state.warehouse.stock, cargo: H.state.ships.map(v => v.cargo) }) === economics, 'Hafenanimation verändert eigenmächtig den Handel');
// Bei Abfahrt bleiben bereits angeschlagene Lasten erhalten, noch nicht
// geladene Pakete werden aus dem Manifest entfernt.
for (const attached of [false, true]) {
  S._docks = null; S.porters = []; H.state.freight.jobs = []; H.state.ships = [{ id: 8110, berth: 1, sea: true, cargo: { tools: 24 } }]; S.snapShips();
  H.transport(H.state, H.state.ships[0], 'tools', 24, 'in');
  S.updateDocks(0.1);
  const d = S.docks()[0], parcel = d.load;
  while (d.u < (attached ? 0.3 : 0.1)) S.updateDocks(0.1);
  H.state.ships = [];
  for (let i = 0; i < 160; i++) S.updateDocks(0.1);
  const landed = d.slots.flatMap(s => s.items);
  check(attached ? landed.includes(parcel) : d.cancelled.includes(parcel), 'Abfahrt verliert eine Last oder hebt sie ohne Schiff');
  check(landed.length + d.cancelled.length === 3, 'Abfahrt verliert Manifestpakete');
  check(d.slots.every(s => !s.reserved), 'Abfahrt hinterlässt blockierte Stellplätze');
}
// Jede räumlich eindeutige Beziehung muss in der fertigen Zeichenliste stimmen.
H.state = H.newGame({ name: 'Sortierung', difficulty: 'normal', years: 20 }); S.snapShips();
S.walkers = Array.from({ length: 70 }, () => S.makeWalker(true));
for (const t of [0, 0.4, 3.1, 6.3]) {
  S.update(0.1);
  const items = S.buildItems(null, H.state, S.season(), t);
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i].box, b = items[j].box; if (!a || !b) continue;
    const sx = a[2] <= b[0] + 0.02 ? -1 : b[2] <= a[0] + 0.02 ? 1 : 0;
    const sy = a[3] <= b[1] + 0.02 ? -1 : b[3] <= a[1] + 0.02 ? 1 : 0;
    if (sx && sy && sx !== sy) continue;
    check((sx || sy) <= 0, `Falsche Zeichenreihenfolge: ${items[i].c || items[i].s || items[i].r} / ${items[j].c || items[j].s || items[j].r}`);
  }
}
// Auch die gebogenen Übergänge zwischen zwei Wegspuren prüfen. Die echte
// Hausgeometrie ist hier die Referenz, unabhängig vom Hindernisraster.
const occupied = [...buildings, H.FARM, ...H.HAMLET].map(b => S.buildingBox(b)).concat(gateSolids);
for (let frame = 0; frame < 600; frame++) {
  S.update(.1);
  for (const walker of S.walkers) {
    const p = S.walkerWorld(walker);
    check(!occupied.some(b => contains(b, p.wx, p.wy)), 'Passant schneidet beim Abbiegen durch eine Hauswand');
  }
}
// Mehrere vollständige Rundwege einschließlich aller Kreuzungen und Wenden.
S.initCarts();
for (let frame = 0; frame < 4000; frame++) {
  S.update(.1);
  for (const c of S.carts) checkCart(c, { wx: c.a[0] + (c.b[0] - c.a[0]) * c.t, wy: c.a[1] + (c.b[1] - c.a[1]) * c.t });
}
console.log(`Kartenprüfung bestanden: ${checks} Prüfungen, ${H.ROAD_EDGES.length} Wege in beiden Richtungen, ${H.BERTHS.length} vollständige An- und Abfahrten.`);
