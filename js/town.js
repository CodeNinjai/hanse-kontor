/* Stadtplan von Sundhaven: Gebäude, Straßen, Wegenetz */
'use strict';

HK.SCENE = { W: 960, H: 640, QUAY_Y: 540 };

/* Gebäude: kind bestimmt die Zeichnung, panel das Menü. plot = Nummer bei kaufbaren Objekten */
HK.BUILDINGS = [
  { id: 'church',     kind: 'church',   x: 400, y: 70,  w: 150, h: 120, panel: 'church',     name: { de: 'Kirche St. Nikolai', en: 'St Nicholas Church' } },
  { id: 'rectory',    kind: 'house',    x: 570, y: 105, w: 70,  h: 80,  panel: 'church',     name: { de: 'Pfarrhaus', en: 'Rectory' }, color: '#d9c7a0' },
  { id: 'guild',      kind: 'hall',     x: 700, y: 90,  w: 120, h: 100, panel: 'guild',      name: { de: 'Gildehaus', en: 'Guild hall' }, color: '#c9a878' },
  { id: 'house1',     kind: 'house',    x: 100, y: 95,  w: 60,  h: 90,  panel: 'house', plot: 0, name: { de: 'Haus am Kirchweg', en: 'Church Lane house' } },
  { id: 'house2',     kind: 'house',    x: 170, y: 95,  w: 60,  h: 90,  panel: 'house', plot: 1, name: { de: 'Haus zum Anker', en: 'Anchor house' } },
  { id: 'house3',     kind: 'house',    x: 240, y: 105, w: 50,  h: 80,  panel: 'house', plot: 2, name: { de: 'Giebelhaus', en: 'Gabled house' } },
  { id: 'bank',       kind: 'house',    x: 110, y: 250, w: 90,  h: 90,  panel: 'bank',       name: { de: 'Geldwechsler', en: 'Money changer' }, color: '#e0d2b0' },
  { id: 'tavern',     kind: 'house',    x: 210, y: 250, w: 80,  h: 100, panel: 'tavern',     name: { de: 'Taverne „Zum Goldenen Hering“', en: 'The Golden Herring Tavern' }, color: '#c98e5a' },
  { id: 'townhall',   kind: 'hall',     x: 400, y: 240, w: 160, h: 60,  panel: 'townhall',   name: { de: 'Rathaus', en: 'Town hall' }, color: '#b8574a' },
  { id: 'market',     kind: 'market',   x: 380, y: 300, w: 200, h: 80,  panel: 'market',     name: { de: 'Marktplatz', en: 'Market square' } },
  { id: 'plot1',      kind: 'plot',     x: 700, y: 250, w: 60,  h: 90,  panel: 'workshop', plot: 0, name: { de: 'Werkstattgrundstück I', en: 'Workshop plot I' } },
  { id: 'plot2',      kind: 'plot',     x: 770, y: 250, w: 60,  h: 90,  panel: 'workshop', plot: 1, name: { de: 'Werkstattgrundstück II', en: 'Workshop plot II' } },
  { id: 'plot3',      kind: 'plot',     x: 840, y: 250, w: 60,  h: 90,  panel: 'workshop', plot: 2, name: { de: 'Werkstattgrundstück III', en: 'Workshop plot III' } },
  { id: 'house4',     kind: 'house',    x: 100, y: 400, w: 80,  h: 70,  panel: 'house', plot: 3, name: { de: 'Haus an der Hafenstraße', en: 'Harbour Street house' } },
  { id: 'house5',     kind: 'house',    x: 190, y: 400, w: 90,  h: 70,  panel: 'house', plot: 4, name: { de: 'Speicherhaus', en: 'Storehouse' } },
  { id: 'kontor',     kind: 'house',    x: 320, y: 400, w: 80,  h: 70,  panel: 'kontor',     name: { de: 'Dein Kontor', en: 'Your office' }, color: '#e8dcc0' },
  { id: 'warehouse',  kind: 'barn',     x: 410, y: 400, w: 110, h: 70,  panel: 'kontor',     name: { de: 'Lagerhaus', en: 'Warehouse' } },
  { id: 'customs',    kind: 'house',    x: 540, y: 400, w: 90,  h: 70,  panel: 'customs',    name: { de: 'Zollhaus', en: 'Customs house' }, color: '#cfc4a8' },
  { id: 'bathhouse',  kind: 'house',    x: 700, y: 400, w: 90,  h: 70,  panel: 'bathhouse',  name: { de: 'Badehaus', en: 'Bathhouse' }, color: '#d8b8a0' },
  { id: 'bailiff',    kind: 'hall',     x: 810, y: 400, w: 100, h: 70,  panel: 'bailiff',    name: { de: 'Vogtei', en: "Bailiff's court" }, color: '#a8a09a' },
  { id: 'fishermen',  kind: 'huts',     x: 40,  y: 495, w: 110, h: 35,  panel: 'fishermen',  name: { de: 'Fischerhütten', en: "Fishermen's huts" } },
  { id: 'shipyard',   kind: 'yard',     x: 790, y: 492, w: 130, h: 42,  panel: 'shipyard',   name: { de: 'Werft', en: 'Shipyard' } },
  { id: 'gate',       kind: 'gate',     x: 0,   y: 190, w: 48,  h: 60,  panel: 'gate',       name: { de: 'Stadttor', en: 'Town gate' } },
  { id: 'harbour',    kind: 'water',    x: 0,   y: 540, w: 960, h: 100, panel: 'harbour',    name: { de: 'Hafen', en: 'Harbour' } },
];
HK.BUILDING = {}; HK.BUILDINGS.forEach(b => HK.BUILDING[b.id] = b);

/* Wegenetz für Passanten */
HK.ROAD_NODES = {
  A: [48, 220], B: [300, 220], C: [480, 220], D: [660, 220], E: [900, 220],
  F: [300, 380], G: [480, 380], H: [660, 380],
  I: [40, 480], J: [300, 480], K: [480, 480], L: [660, 480], M: [920, 480],
  N: [300, 60], O: [660, 60], P: [480, 312], Q: [420, 345], R: [540, 345],
  S: [480, 512], T: [200, 512], U: [740, 512],
};
HK.ROAD_EDGES = [
  ['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'E'], ['N', 'B'], ['B', 'F'], ['F', 'J'], ['O', 'D'], ['D', 'H'], ['H', 'L'],
  ['F', 'G'], ['G', 'H'], ['G', 'K'], ['I', 'J'], ['J', 'K'], ['K', 'L'], ['L', 'M'], ['G', 'P'], ['P', 'Q'], ['P', 'R'], ['Q', 'F'], ['R', 'H'],
  ['K', 'S'], ['J', 'T'], ['L', 'U'], ['S', 'T'], ['S', 'U'],
];
HK.ROAD_ADJ = {};
Object.keys(HK.ROAD_NODES).forEach(k => HK.ROAD_ADJ[k] = []);
HK.ROAD_EDGES.forEach(([a, b]) => { HK.ROAD_ADJ[a].push(b); HK.ROAD_ADJ[b].push(a); });

/* Liegeplätze und Boote */
HK.BERTHS = [{ x: 200, y: 585 }, { x: 380, y: 585 }, { x: 560, y: 585 }, { x: 740, y: 585 }];
HK.BOAT_SPOTS = [{ x: 60, y: 565 }, { x: 95, y: 575 }, { x: 130, y: 562 }, { x: 165, y: 578 }];
HK.CARAVAN_SPOTS = [{ x: 70, y: 235 }, { x: 120, y: 232 }];

/* Feste Personen mit Standort (id verweist auf HK.PERSON) */
HK.STATIC_NPCS = [
  { person: 'priest', x: 478, y: 200, color: '#3a2a20' },
  { person: 'customs', x: 588, y: 478, color: '#3b4a6b' },
  { person: 'innkeeper', x: 252, y: 360, color: '#8a3b3b' },
  { person: 'guild', x: 760, y: 200, color: '#5a4a7a' },
  { person: 'bailiff', x: 860, y: 478, color: '#2a2a2a' },
  { person: 'changer', x: 155, y: 348, color: '#4a6a3a' },
  { person: 'shipwright', x: 850, y: 486, color: '#6a4a2a' },
  { person: 'mayor', x: 470, y: 308, color: '#6b1f1f' },
];

/* Passanten-Typen: Anteil und Farben */
HK.WALKER_TYPES = [
  { id: 'citizen', weight: 6, colors: ['#7a5a3a', '#5a6a4a', '#6a4a6a', '#4a5a7a', '#8a6a3a'] },
  { id: 'merchant', weight: 2, colors: ['#8a2a2a', '#2a4a8a', '#3a6a3a'] },
  { id: 'fisher', weight: 2, colors: ['#3a5a7a', '#4a6a8a'] },
  { id: 'beggar', weight: 1, colors: ['#5a5040'] },
  { id: 'monk', weight: 1, colors: ['#4a3a2a'] },
  { id: 'guard', weight: 1, colors: ['#3b4a6b'] },
  { id: 'child', weight: 2, colors: ['#9a7a5a', '#7a9a5a'] },
];
