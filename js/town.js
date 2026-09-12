/* Stadtplan von Sundhaven in Weltkoordinaten (isometrisch).
   x wächst nach rechts-unten, y nach links-unten. Land: x >= 7 und y <= 16.5, sonst Wasser. */
'use strict';

HK.SCENE = { W: 960, H: 640 };
HK.WORLD = { COAST_X: 7, COAST_Y: 16.5, WALL_N: 1.6, WALL_E: 24 };

/* kind: gable (Giebelhaus, ridge quer zur langen Seite), eave (Traufenhaus), hall, townhall, church, huts, yard, plot, market, gate */
HK.BUILDINGS = [
  // Kaizeile
  { id: 'fishermen', kind: 'huts',   x: 7.5,  y: 2.5,  w: 1.5, d: 2.0, h: 0.5, panel: 'fishermen', name: { de: 'Fischerhütten', en: "Fishermen's huts" } },
  { id: 'warehouse', kind: 'gable',  x: 7.4,  y: 6.0,  w: 1.7, d: 1.5, h: 1.6, brick: true, hoist: true, panel: 'kontor', name: { de: 'Lagerhaus', en: 'Warehouse' } },
  { id: 'kontor',    kind: 'gable',  x: 7.4,  y: 7.9,  w: 1.7, d: 1.3, h: 1.3, wall: '#e6d9bc', roof: '#8a3a2a', panel: 'kontor', name: { de: 'Dein Kontor', en: 'Your office' } },
  { id: 'customs',   kind: 'eave',   x: 7.4,  y: 11.0, w: 1.6, d: 1.3, h: 1.1, wall: '#d9cdb2', roof: '#5b5560', flagpole: true, panel: 'customs', name: { de: 'Zollhaus', en: 'Customs house' } },
  { id: 'shipyard',  kind: 'yard',   x: 7.3,  y: 13.0, w: 1.8, d: 2.2, h: 0.4, panel: 'shipyard', name: { de: 'Werft', en: 'Shipyard' } },
  // Block Kirche
  { id: 'church',    kind: 'church', x: 10.3, y: 2.4,  w: 3.8, d: 1.7, h: 1.9, panel: 'church', name: { de: 'Kirche St. Nikolai', en: 'St Nicholas Church' } },
  { id: 'rectory',   kind: 'eave',   x: 14.3, y: 3.8,  w: 0.8, d: 1.1, h: 0.9, wall: '#d9c7a0', roof: '#6b4a3a', panel: 'church', name: { de: 'Pfarrhaus', en: 'Rectory' } },
  // Block Gilde
  { id: 'guild',     kind: 'hall',   x: 16.2, y: 2.5,  w: 1.9, d: 1.5, h: 1.6, brick: true, banner: true, panel: 'guild', name: { de: 'Gildehaus', en: 'Guild hall' } },
  { id: 'f1',        kind: 'gable',  x: 18.5, y: 2.4,  w: 1.0, d: 1.1, h: 1.1, wall: '#e2d4b4', roof: '#8a3a2a', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'f2',        kind: 'gable',  x: 19.7, y: 2.4,  w: 0.9, d: 1.1, h: 1.2, wall: '#d8c9a6', roof: '#6b4a3a', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'f3',        kind: 'eave',   x: 18.5, y: 3.9,  w: 2.0, d: 0.9, h: 1.0, wall: '#dccfae', roof: '#7a3a2a', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  // Block Vogtei
  { id: 'bailiff',   kind: 'hall',   x: 21.7, y: 2.6,  w: 1.7, d: 1.5, h: 1.5, brick: true, turret: true, panel: 'bailiff', name: { de: 'Vogtei', en: "Bailiff's court" } },
  // Block Rathaus und Markt
  { id: 'townhall',  kind: 'townhall', x: 10.2, y: 6.1, w: 1.3, d: 3.4, h: 1.6, panel: 'townhall', name: { de: 'Rathaus', en: 'Town hall' } },
  { id: 'market',    kind: 'market', x: 11.7, y: 6.1,  w: 3.1, d: 3.4, h: 0, panel: 'market', name: { de: 'Marktplatz', en: 'Market square' } },
  // Block Taverne
  { id: 'tavern',    kind: 'eave',   x: 16.2, y: 6.2,  w: 1.7, d: 1.3, h: 1.2, wall: '#c99a66', roof: '#5a3a2a', sign: 'tavern', panel: 'tavern', name: { de: 'Taverne „Zum Goldenen Hering“', en: 'The Golden Herring Tavern' } },
  { id: 'bank',      kind: 'eave',   x: 18.3, y: 6.2,  w: 1.4, d: 1.2, h: 1.3, wall: '#cfc6b4', roof: '#4e4a52', stone: true, sign: 'bank', panel: 'bank', name: { de: 'Geldwechsler', en: 'Money changer' } },
  { id: 'house1',    kind: 'gable',  x: 16.2, y: 8.1,  w: 1.2, d: 1.2, h: 1.2, wall: '#e2d4b4', roof: '#8a3a2a', panel: 'house', plot: 0, name: { de: 'Haus am Kirchweg', en: 'Church Lane house' } },
  { id: 'house2',    kind: 'gable',  x: 17.7, y: 8.1,  w: 1.2, d: 1.2, h: 1.1, wall: '#d8c9a6', roof: '#6b4a3a', panel: 'house', plot: 1, name: { de: 'Haus zum Anker', en: 'Anchor house' } },
  { id: 'f4',        kind: 'gable',  x: 19.2, y: 8.1,  w: 1.2, d: 1.2, h: 1.2, wall: '#e8dcc0', roof: '#7a3a2a', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'f5',        kind: 'eave',   x: 21.7, y: 6.2,  w: 1.6, d: 1.1, h: 1.1, wall: '#d6c8aa', roof: '#7a4a3a', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'f6',        kind: 'gable',  x: 21.7, y: 8.0,  w: 1.6, d: 1.2, h: 1.2, wall: '#e4d6b8', roof: '#5a4a4a', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  // Block Süd-West
  { id: 'house3',    kind: 'eave',   x: 10.2, y: 10.7, w: 1.4, d: 1.2, h: 1.2, wall: '#e8dcc0', roof: '#8a3a2a', panel: 'house', plot: 2, name: { de: 'Giebelhaus', en: 'Gabled house' } },
  { id: 'house4',    kind: 'gable',  x: 11.9, y: 10.7, w: 1.3, d: 1.2, h: 1.3, wall: '#dccfae', roof: '#6a3a2a', panel: 'house', plot: 3, name: { de: 'Haus an der Hafenstraße', en: 'Harbour Street house' } },
  { id: 'plot1',     kind: 'plot',   x: 13.5, y: 10.6, w: 1.4, d: 1.3, h: 1.1, panel: 'workshop', plot: 0, name: { de: 'Werkstattgrundstück I', en: 'Workshop plot I' } },
  { id: 'bathhouse', kind: 'eave',   x: 10.2, y: 12.3, w: 1.6, d: 1.1, h: 1.1, wall: '#dcc2a6', roof: '#8a4a34', panel: 'bathhouse', name: { de: 'Badehaus', en: 'Bathhouse' } },
  { id: 'f7',        kind: 'gable',  x: 12.1, y: 12.3, w: 1.2, d: 1.1, h: 1.2, wall: '#e2d4b4', roof: '#7a3a2a', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'f8',        kind: 'gable',  x: 13.6, y: 12.3, w: 1.2, d: 1.1, h: 1.1, wall: '#d9c9a8', roof: '#8a3a2a', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  // Block Süd-Mitte
  { id: 'plot2',     kind: 'plot',   x: 16.2, y: 10.6, w: 1.4, d: 1.3, h: 1.1, panel: 'workshop', plot: 1, name: { de: 'Werkstattgrundstück II', en: 'Workshop plot II' } },
  { id: 'plot3',     kind: 'plot',   x: 17.9, y: 10.6, w: 1.4, d: 1.3, h: 1.1, panel: 'workshop', plot: 2, name: { de: 'Werkstattgrundstück III', en: 'Workshop plot III' } },
  { id: 'house5',    kind: 'gable',  x: 19.6, y: 10.7, w: 1.2, d: 1.2, h: 1.3, wall: '#e0d0ae', roof: '#6a3a2a', panel: 'house', plot: 4, name: { de: 'Speicherhaus', en: 'Storehouse' } },
  { id: 'f9',        kind: 'eave',   x: 16.2, y: 12.3, w: 1.4, d: 1.1, h: 1.1, wall: '#e4d6b8', roof: '#5a4a4a', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'f10',       kind: 'gable',  x: 17.9, y: 12.3, w: 1.3, d: 1.1, h: 1.2, wall: '#d9c9a8', roof: '#7a3a2a', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'f11',       kind: 'eave',   x: 19.5, y: 12.3, w: 1.3, d: 1.1, h: 1.0, wall: '#e2d4b4', roof: '#8a3a2a', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'f12',       kind: 'gable',  x: 21.7, y: 10.7, w: 1.6, d: 1.2, h: 1.2, wall: '#dccfae', roof: '#6b4a3a', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'f13',       kind: 'eave',   x: 21.7, y: 12.4, w: 1.6, d: 1.0, h: 1.0, wall: '#e8dcc0', roof: '#7a3a2a', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  // Südzeile
  { id: 'f14',       kind: 'gable',  x: 10.2, y: 14.6, w: 1.3, d: 1.1, h: 1.2, wall: '#e2d4b4', roof: '#8a3a2a', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'f15',       kind: 'eave',   x: 11.9, y: 14.6, w: 1.6, d: 1.1, h: 1.0, wall: '#d8c9a6', roof: '#5a4a4a', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'f16',       kind: 'gable',  x: 16.2, y: 14.6, w: 1.3, d: 1.1, h: 1.2, wall: '#dccfae', roof: '#7a3a2a', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'f17',       kind: 'gable',  x: 17.9, y: 14.6, w: 1.3, d: 1.1, h: 1.1, wall: '#e8dcc0', roof: '#6b4a3a', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'f18',       kind: 'eave',   x: 21.7, y: 14.6, w: 1.6, d: 1.1, h: 1.0, wall: '#e4d6b8', roof: '#8a3a2a', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  // Tor (Osttor) und Hafen (Wasser)
  { id: 'gate',      kind: 'gate',   x: 23.7, y: 9.3,  w: 1.0, d: 1.4, h: 1.8, panel: 'gate', name: { de: 'Stadttor', en: 'Town gate' } },
  { id: 'harbour',   kind: 'water',  x: 0, y: 0, w: 0, d: 0, h: 0, panel: 'harbour', name: { de: 'Hafen', en: 'Harbour' } },
];
HK.BUILDING = {}; HK.BUILDINGS.forEach(b => HK.BUILDING[b.id] = b);

/* Straßen: [x1,y1,x2,y2,breite] in Weltkoordinaten */
HK.STREETS = [
  [9.5, 1.8, 9.5, 16.3, 0.9], [15.5, 0.2, 15.5, 16.3, 0.9], [21, 1.8, 21, 16.3, 0.8],
  [7.4, 5.5, 23.8, 5.5, 0.8], [7.4, 10, 23.8, 10, 0.9], [7.4, 14, 23.8, 14, 0.8], [7.4, 2.1, 23.8, 2.1, 0.6], [7.4, 16.2, 23.8, 16.2, 0.6],
  [23.8, 10, 31, 10, 0.9], [15.5, 0.2, 15.5, -3, 0.8],
];
HK.ROAD_NODES = {
  Q1: [7.2, 2.2], Q2: [7.2, 5.5], Q3: [7.2, 10], Q4: [7.2, 14], Q5: [7.2, 16.2],
  H1: [9.5, 2.2], H2: [9.5, 5.5], H23: [9.5, 8.5], H3: [9.5, 10], H4: [9.5, 14], H5: [9.5, 16.2],
  M1: [15.5, 2.2], M2: [15.5, 5.5], M23: [15.5, 8.5], M3: [15.5, 10], M4: [15.5, 14], M5: [15.5, 16.2],
  O1: [21, 2.2], O2: [21, 5.5], O3: [21, 10], O4: [21, 14], O5: [21, 16.2],
  C1: [23.5, 5.5], C2: [23.5, 10], C3: [23.5, 14],
  S1: [12.4, 6.9], S2: [14.3, 6.9], S3: [13.3, 9.2], MK: [13, 10], N1: [12.4, 5.5],
  PA: [11.6, 19.4], PB: [18.6, 19.4], SP1: [11.6, 16.2], SP2: [18.6, 16.2], G: [24.6, 10], OUT: [27, 10], OUT2: [30, 10], NG: [15.5, 0.6],
};
HK.ROAD_EDGES = [
  ['Q1', 'Q2'], ['Q2', 'Q3'], ['Q3', 'Q4'], ['Q4', 'Q5'], ['H1', 'H2'], ['H2', 'H23'], ['H23', 'H3'], ['H3', 'H4'], ['H4', 'H5'],
  ['M1', 'M2'], ['M2', 'M23'], ['M23', 'M3'], ['M3', 'M4'], ['M4', 'M5'], ['O1', 'O2'], ['O2', 'O3'], ['O3', 'O4'], ['O4', 'O5'],
  ['Q1', 'H1'], ['H1', 'M1'], ['M1', 'O1'], ['Q2', 'H2'], ['M2', 'O2'], ['O2', 'C1'], ['Q3', 'H3'], ['H3', 'MK'], ['MK', 'M3'], ['M3', 'O3'], ['O3', 'C2'], ['C2', 'G'], ['G', 'OUT'], ['OUT', 'OUT2'],
  ['Q4', 'H4'], ['H4', 'M4'], ['M4', 'O4'], ['O4', 'C3'], ['Q5', 'H5'], ['H5', 'SP1'], ['SP1', 'M5'], ['M5', 'SP2'], ['SP2', 'O5'], ['C1', 'C2'], ['C2', 'C3'],
  ['S1', 'S2'], ['S2', 'M23'], ['S1', 'S3'], ['S2', 'S3'], ['S3', 'MK'], ['H2', 'N1'], ['N1', 'M2'], ['N1', 'S1'], ['PA', 'SP1'], ['PB', 'SP2'], ['M1', 'NG'],
];
HK.ROAD_ADJ = {}; Object.keys(HK.ROAD_NODES).forEach(k => HK.ROAD_ADJ[k] = []);
HK.ROAD_EDGES.forEach(([a, b]) => { HK.ROAD_ADJ[a].push(b); HK.ROAD_ADJ[b].push(a); });

/* Stege (von der Kaikante nach -x ins Wasser), Liegeplätze, Reede, Boote, Karawanen */
HK.PIERS = [{ x: 11.6, y0: 16.5, y1: 19.9 }, { x: 18.6, y0: 16.5, y1: 19.9 }];
HK.BERTHS = [{ x: 10.45, y: 18.35 }, { x: 12.75, y: 18.35 }, { x: 17.45, y: 18.35 }, { x: 19.75, y: 18.35 }];
HK.SHIP_SCALE = 1.25;
HK.BERTH_HEADING = Math.PI / 2;
HK.OWN_BERTHS = [{ x: 14.6, y: 21.8 }, { x: 16.6, y: 22.6 }, { x: 12.2, y: 22.4 }];
HK.ISLET = { x: -2.2, y: 3.2 };
HK.BOAT_SPOTS = [{ x: 6.3, y: 14.4 }, { x: 5.6, y: 15.0 }, { x: 14.6, y: 18.4 }, { x: 21.0, y: 18.2 }];
HK.GUARD_SHIP = { x: 15.6, y: 22.6, heading: 0.35 };
HK.CARAVAN_SPOTS = [{ x: 25.8, y: 10.9 }, { x: 27.4, y: 10.9 }];
HK.ARRIVE_POINT = { x: 4, y: 27 };
HK.LEAVE_POINT = { x: -3, y: 22 };
HK.MOLE = { x: 21.6, y0: 16.9, y1: 19.0, w: 0.7 };
HK.LIGHTHOUSE = { x: 21.95, y: 19.35, r: 0.45, h: 2.2 };
HK.WINDMILL = { x: 27.2, y: 13.4 };
HK.FIELDS = [[25.2, 3.6, 2.4, 2.2], [25.4, 6.6, 2.2, 2.0], [24.8, 12.6, 1.6, 2.0]];
HK.FARM = { x: 26.4, y: 15.2, w: 1.4, d: 1.0, h: 0.9 };

HK.STATIC_NPCS = [
  { person: 'priest', x: 12.3, y: 4.4, color: '#3a2a20' },
  { person: 'customs', x: 8.3, y: 12.6, color: '#3b4a6b' },
  { person: 'innkeeper', x: 17.0, y: 7.8, color: '#8a3b3b' },
  { person: 'guild', x: 17.2, y: 4.3, color: '#5a4a7a' },
  { person: 'bailiff', x: 22.6, y: 4.4, color: '#2a2a2a' },
  { person: 'changer', x: 19.0, y: 7.7, color: '#4a6a3a' },
  { person: 'shipwright', x: 8.5, y: 12.85, color: '#6a4a2a' },
  { person: 'mayor', x: 11.9, y: 8.3, color: '#6b1f1f' },
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
HK.TREES = [
  [15.2, 4.7, 0.5], [20.7, 4.5, 0.45], [15.1, 9.6, 0.5], [20.8, 9.4, 0.4], [14.9, 13.8, 0.5], [20.7, 13.9, 0.45], [23.3, 15.9, 0.45], [9.3, 15.7, 0.4], [13.9, 16.0, 0.4], [19.6, 16.0, 0.45],
  [23.3, 5.2, 0.35], [23.3, 8.9, 0.35], [9.0, 4.9, 0.35], [14.6, 2.6, 0.4], [23.2, 12.2, 0.35], [9.0, 9.4, 0.3],
  [25.2, 1.2, 0.6], [26.9, 0.6, 0.55], [28.6, 3.2, 0.6], [29.4, 6.0, 0.5], [28.6, 8.4, 0.55], [25.3, 8.9, 0.45], [26.0, 12.3, 0.5], [28.7, 12.2, 0.55], [30.2, 9.0, 0.5], [25.1, 14.7, 0.45], [29.4, 15.4, 0.6], [27.6, 16.6, 0.5], [24.8, 16.4, 0.45], [31, 13, 0.55], [30.8, 1.5, 0.6], [27.5, -1.2, 0.55], [23.5, -1.0, 0.5], [19.5, -1.4, 0.55], [11.5, -1.2, 0.5], [9, -0.4, 0.45],
];
HK.PROPS = [
  { t: 'crates', x: 8.9, y: 5.0 }, { t: 'barrels', x: 9.0, y: 9.4 }, { t: 'crates', x: 7.6, y: 9.7 }, { t: 'barrels', x: 7.7, y: 10.4 }, { t: 'crane', x: 7.6, y: 12.2 },
  { t: 'barrels', x: 17.9, y: 7.7 }, { t: 'well', x: 12.4, y: 8.9 }, { t: 'statue', x: 13.4, y: 7.9 }, { t: 'stalls', x: 0, y: 0 },
  { t: 'crates', x: 5.0, y: 5.6 }, { t: 'barrels', x: 6.2, y: 10.6 }, { t: 'nets', x: 8.6, y: 4.3 }, { t: 'cross', x: 9.9, y: 16.0 }, { t: 'laundry', x: 18.9, y: 9.35 },
  { t: 'crates', x: 22.1, y: 9.6 }, { t: 'barrels', x: 16.0, y: 4.7 },
];
