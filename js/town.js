/* Stadtplan von Sundhaven: Ansicht vom Hügel hinter der Stadt auf den Hafen (Meer oben) */
'use strict';

HK.SCENE = { W: 960, H: 640, HORIZON: 150, QUAY_Y: 300, QUAY_H: 34 };

/* Gebäude: x,y,w,h = sichtbare Fläche (inkl. Dach), row bestimmt die Tiefenstaffelung.
   style: 'gable' (Giebelhaus, Backstein-Treppengiebel) | 'eave' (Traufenhaus, Fachwerk) | Spezialformen */
HK.BUILDINGS = [
  // hintere Reihe (am Kai)
  { id: 'church',    kind: 'church', x: 28,  y: 330, w: 140, h: 84, panel: 'church',    row: 0, name: { de: 'Kirche St. Nikolai', en: 'St Nicholas Church' } },
  { id: 'fishermen', kind: 'huts',   x: 178, y: 352, w: 80,  h: 60, panel: 'fishermen', row: 0, name: { de: 'Fischerhütten', en: "Fishermen's huts" } },
  { id: 'warehouse', kind: 'gable',  x: 272, y: 326, w: 120, h: 88, panel: 'kontor',    row: 0, brick: true, hoist: true, name: { de: 'Lagerhaus', en: 'Warehouse' } },
  { id: 'kontor',    kind: 'gable',  x: 406, y: 334, w: 78,  h: 80, panel: 'kontor',    row: 0, wall: '#e6d9bc', name: { de: 'Dein Kontor', en: 'Your office' } },
  { id: 'customs',   kind: 'eave',   x: 498, y: 340, w: 80,  h: 74, panel: 'customs',   row: 0, wall: '#d9cdb2', roof: '#5b5560', name: { de: 'Zollhaus', en: 'Customs house' } },
  { id: 'bathhouse', kind: 'eave',   x: 596, y: 344, w: 76,  h: 70, panel: 'bathhouse', row: 0, wall: '#dcc2a6', roof: '#8a4a34', name: { de: 'Badehaus', en: 'Bathhouse' } },
  { id: 'bailiff',   kind: 'hall',   x: 690, y: 330, w: 92,  h: 84, panel: 'bailiff',   row: 0, brick: true, name: { de: 'Vogtei', en: "Bailiff's court" } },
  { id: 'shipyard',  kind: 'yard',   x: 796, y: 338, w: 84,  h: 76, panel: 'shipyard',  row: 0, name: { de: 'Werft', en: 'Shipyard' } },
  // mittlere Reihe
  { id: 'house1',    kind: 'gable',  x: 40,  y: 442, w: 72,  h: 78, panel: 'house', plot: 0, row: 1, wall: '#e2d4b4', name: { de: 'Haus am Kirchweg', en: 'Church Lane house' } },
  { id: 'house2',    kind: 'gable',  x: 122, y: 446, w: 70,  h: 74, panel: 'house', plot: 1, row: 1, wall: '#d8c9a6', roof: '#6b4a3a', name: { de: 'Haus zum Anker', en: 'Anchor house' } },
  { id: 'tavern',    kind: 'eave',   x: 206, y: 438, w: 86,  h: 82, panel: 'tavern',    row: 1, wall: '#c99a66', roof: '#5a3a2a', sign: 'tavern', name: { de: 'Taverne „Zum Goldenen Hering“', en: 'The Golden Herring Tavern' } },
  { id: 'townhall',  kind: 'townhall', x: 330, y: 428, w: 260, h: 66, panel: 'townhall', row: 1, name: { de: 'Rathaus', en: 'Town hall' } },
  { id: 'market',    kind: 'market', x: 330, y: 496, w: 260, h: 64, panel: 'market',    row: 1, name: { de: 'Marktplatz', en: 'Market square' } },
  { id: 'bank',      kind: 'eave',   x: 606, y: 444, w: 84,  h: 76, panel: 'bank',      row: 1, wall: '#cfc6b4', roof: '#4e4a52', stone: true, sign: 'bank', name: { de: 'Geldwechsler', en: 'Money changer' } },
  { id: 'guild',     kind: 'hall',   x: 704, y: 436, w: 92,  h: 84, panel: 'guild',     row: 1, brick: true, banner: true, name: { de: 'Gildehaus', en: 'Guild hall' } },
  { id: 'filler1',   kind: 'eave',   x: 808, y: 450, w: 60,  h: 70, panel: null,        row: 1, wall: '#d6c8aa', roof: '#7a4a3a', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  // vordere Reihe
  { id: 'house3',    kind: 'eave',   x: 40,  y: 556, w: 86,  h: 84, panel: 'house', plot: 2, row: 2, wall: '#e8dcc0', roof: '#8a3a2a', name: { de: 'Giebelhaus', en: 'Gabled house' } },
  { id: 'house4',    kind: 'gable',  x: 140, y: 552, w: 86,  h: 88, panel: 'house', plot: 3, row: 2, wall: '#dccfae', name: { de: 'Haus an der Hafenstraße', en: 'Harbour Street house' } },
  { id: 'plot1',     kind: 'plot',   x: 244, y: 560, w: 78,  h: 80, panel: 'workshop', plot: 0, row: 2, name: { de: 'Werkstattgrundstück I', en: 'Workshop plot I' } },
  { id: 'plot2',     kind: 'plot',   x: 334, y: 560, w: 78,  h: 80, panel: 'workshop', plot: 1, row: 2, name: { de: 'Werkstattgrundstück II', en: 'Workshop plot II' } },
  { id: 'plot3',     kind: 'plot',   x: 424, y: 560, w: 78,  h: 80, panel: 'workshop', plot: 2, row: 2, name: { de: 'Werkstattgrundstück III', en: 'Workshop plot III' } },
  { id: 'house5',    kind: 'gable',  x: 522, y: 552, w: 84,  h: 88, panel: 'house', plot: 4, row: 2, wall: '#e0d0ae', roof: '#6a3a2a', name: { de: 'Speicherhaus', en: 'Storehouse' } },
  { id: 'filler2',   kind: 'eave',   x: 622, y: 560, w: 74,  h: 80, panel: null,        row: 2, wall: '#e4d6b8', roof: '#5a4a4a', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'filler3',   kind: 'gable',  x: 712, y: 556, w: 72,  h: 84, panel: null,        row: 2, wall: '#d9c9a8', roof: '#7a3a2a', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  // Mauer und Tor am rechten Rand
  { id: 'gate',      kind: 'gate',   x: 876, y: 440, w: 40,  h: 70, panel: 'gate',      row: 1, name: { de: 'Stadttor', en: 'Town gate' } },
  { id: 'harbour',   kind: 'water',  x: 0,   y: 150, w: 960, h: 150, panel: 'harbour',  row: -1, name: { de: 'Hafen', en: 'Harbour' } },
];
HK.BUILDING = {}; HK.BUILDINGS.forEach(b => HK.BUILDING[b.id] = b);
HK.WALL_X = 886;

/* Wegenetz für Passanten */
HK.ROAD_NODES = {
  Q1: [70, 322], Q2: [264, 322], Q3: [586, 322], Q4: [788, 322],
  A: [60, 427], P1: [264, 427], S1: [300, 427], C: [460, 427], P2: [586, 427], S2: [598, 427], P3: [788, 427], F: [866, 427],
  M1: [300, 538], MK1: [400, 538], MK2: [520, 538], M2: [598, 538], L: [60, 538], N: [866, 538],
  K1: [300, 636], K2: [598, 636], AL1: [235, 538], AL1b: [235, 636], AL2: [513, 538], AL2b: [513, 636],
  SQ1: [400, 512], SQ2: [520, 512], SQ3: [460, 528],
  G1: [866, 476], GATE: [896, 476], OUT1: [930, 476], OUT2: [934, 570], OUT3: [936, 380],
};
HK.ROAD_EDGES = [
  ['Q1', 'Q2'], ['Q2', 'Q3'], ['Q3', 'Q4'], ['Q2', 'P1'], ['Q3', 'P2'], ['Q4', 'P3'],
  ['A', 'P1'], ['P1', 'S1'], ['S1', 'C'], ['C', 'P2'], ['P2', 'S2'], ['S2', 'P3'], ['P3', 'F'],
  ['S1', 'M1'], ['M1', 'K1'], ['S2', 'M2'], ['M2', 'K2'],
  ['L', 'AL1'], ['AL1', 'M1'], ['M1', 'MK1'], ['MK1', 'MK2'], ['MK2', 'M2'], ['M2', 'N'], ['AL1', 'AL1b'], ['MK2', 'AL2'], ['AL2', 'AL2b'],
  ['MK1', 'SQ1'], ['MK2', 'SQ2'], ['SQ1', 'SQ2'], ['SQ1', 'SQ3'], ['SQ2', 'SQ3'], ['SQ3', 'MK1'], ['SQ3', 'MK2'],
  ['F', 'G1'], ['N', 'G1'], ['G1', 'GATE'], ['GATE', 'OUT1'], ['OUT1', 'OUT2'], ['OUT1', 'OUT3'],
];
HK.ROAD_ADJ = {};
Object.keys(HK.ROAD_NODES).forEach(k => HK.ROAD_ADJ[k] = []);
HK.ROAD_EDGES.forEach(([a, b]) => { HK.ROAD_ADJ[a].push(b); HK.ROAD_ADJ[b].push(a); });
/* Straßenzüge zum Zeichnen (Pflaster): [x1,y1,x2,y2,breite] */
HK.STREETS = [
  [0, 427, 886, 427, 26], [0, 538, 886, 538, 26], [300, 427, 300, 640, 22], [598, 427, 598, 640, 18],
  [235, 538, 235, 640, 12], [513, 538, 513, 640, 12], [264, 322, 264, 427, 12], [586, 322, 586, 427, 12], [788, 322, 788, 427, 12],
  [866, 427, 866, 538, 16], [866, 476, 960, 476, 16],
];

/* Liegeplätze (Schiffsmitte), eigene Schiffe auf Reede, Boote, Karawanen */
HK.PIERS = [{ x: 300, len: 52 }, { x: 660, len: 52 }];
HK.BERTHS = [{ x: 222, y: 280 }, { x: 386, y: 280 }, { x: 580, y: 280 }, { x: 746, y: 280 }];
HK.OWN_BERTHS = [{ x: 330, y: 238 }, { x: 500, y: 236 }, { x: 670, y: 238 }];
HK.BOAT_SPOTS = [{ x: 130, y: 284 }, { x: 160, y: 292 }, { x: 96, y: 290 }, { x: 62, y: 284 }];
HK.CARAVAN_SPOTS = [{ x: 928, y: 512 }, { x: 932, y: 590 }];
HK.HORIZON_SHIP = { x: 720, y: 162 };
HK.LEAVE_POINT = { x: 120, y: 166 };

HK.STATIC_NPCS = [
  { person: 'priest', x: 120, y: 424, color: '#3a2a20' },
  { person: 'customs', x: 540, y: 424, color: '#3b4a6b' },
  { person: 'innkeeper', x: 250, y: 530, color: '#8a3b3b' },
  { person: 'guild', x: 752, y: 530, color: '#5a4a7a' },
  { person: 'bailiff', x: 738, y: 424, color: '#2a2a2a' },
  { person: 'changer', x: 650, y: 530, color: '#4a6a3a' },
  { person: 'shipwright', x: 838, y: 424, color: '#6a4a2a' },
  { person: 'mayor', x: 462, y: 500, color: '#6b1f1f' },
];

HK.WALKER_TYPES = [
  { id: 'citizen', weight: 6, colors: ['#7a5a3a', '#5a6a4a', '#6a4a6a', '#4a5a7a', '#8a6a3a', '#7a3a3a', '#3a5a5a'] },
  { id: 'merchant', weight: 2, colors: ['#8a2a2a', '#2a4a8a', '#3a6a3a', '#5a2a5a'] },
  { id: 'fisher', weight: 2, colors: ['#3a5a7a', '#4a6a8a', '#5a5a4a'] },
  { id: 'beggar', weight: 1, colors: ['#5a5040'] },
  { id: 'monk', weight: 1, colors: ['#4a3a2a', '#2a2a2a'] },
  { id: 'guard', weight: 1, colors: ['#3b4a6b'] },
  { id: 'child', weight: 2, colors: ['#9a7a5a', '#7a9a5a', '#9a5a5a'] },
];

/* Dekoration: Bäume, Kisten, Fässer, Wäscheleinen */
HK.TREES = [{ x: 830, y: 596, r: 22 }, { x: 878, y: 600, r: 16 }, { x: 940, y: 420, r: 18 }, { x: 946, y: 620, r: 20 }, { x: 24, y: 480, r: 14 }, { x: 24, y: 608, r: 16 }, { x: 700, y: 590, r: 0 }];
HK.PROPS = [
  { t: 'crates', x: 300, y: 418 }, { t: 'barrels', x: 386, y: 420 }, { t: 'barrels', x: 232, y: 528 }, { t: 'crates', x: 488, y: 318 }, { t: 'barrels', x: 640, y: 318 },
  { t: 'laundry', x1: 118, y1: 470, x2: 122, y2: 470 }, { t: 'well', x: 460, y: 530 }, { t: 'cross', x: 20, y: 540 }, { t: 'nets', x: 150, y: 330 },
  { t: 'crates', x: 810, y: 318 }, { t: 'bench', x: 214, y: 526 }, { t: 'stalls', x: 340, y: 500 },
];
