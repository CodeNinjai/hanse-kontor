/* Stadtplan von Sundhaven in Weltkoordinaten (isometrisch).
   x wächst nach rechts-unten, y nach links-unten. Land: x >= 7 und y <= 18.5, sonst Wasser.
   Land und Stadt sind Polygone (HK.LAND, HK.TOWN), die Mauer eine Polylinie (HK.WALL). Nördlich das Fischerdorf und das Dorf, östlich das Umland. */
'use strict';

HK.SCENE = { W: 1280, H: 800 };   // Bildausschnitt (Canvas)
HK.MAP = { W: 1600, H: 1000 };     // gesamte Karte in Szenenpixeln; die Kamera zoomt zwischen Gesamtansicht und Detail

/* Landfläche als Polygon (Weltkoordinaten, im Uhrzeigersinn). Alles außerhalb ist Wasser.
   quay markiert gemauerte Kaikanten (Kante von diesem Punkt zum nächsten), sonst natürliches Ufer. */
HK.LAND = [
  [7.6, -30], [7.0, -20], [8.2, -16], [7.4, -12], [7.0, -9], [7.9, -6.5], [7.1, -4.2], [7.8, -2.6], [6.6, -0.6], [7.2, 1.6],
  [6.4, 3.2], [7.0, 5.0, 'quay'], [7.0, 16.0], [6.4, 17.4], [7.6, 19.5], [9.0, 20.45, 'quay'], [25.0, 20.45],
  [26.4, 19.9], [28.6, 19.1], [30.2, 20.1], [31.8, 18.9], [33.4, 19.8], [35.5, 19.2], [38.0, 20.4], [41.0, 20.0], [45.0, 21.2], [60, 21], [60, -30],
];
/* Stadtmauer als Polylinie (Mittellinie); die Stadt liegt rechts der Laufrichtung. Tore als Lücken. */
HK.WALL = { pts: [[7.2, 1.3], [11.5, 1.3], [11.5, -2.4], [23.6, -2.4], [28.3, 0.6], [28.3, 11.8], [31.9, 15.4], [31.9, 18.9]], t: 0.6, h: 1.35,
  gates: [{ seg: 2, at: 15.5, w: 0.8 }, { seg: 4, at: 10.0, w: 1.4 }],
  towers: [[7.2, 1.3, 0.5, 2.0], [11.5, 1.3, 0.5, 2.0], [11.5, -2.4, 0.62, 2.3], [23.6, -2.4, 0.62, 2.3], [28.3, 0.6, 0.62, 2.3], [28.3, 11.8, 0.62, 2.3], [31.9, 15.4, 0.62, 2.3], [31.9, 18.9, 0.62, 2.3], [15.0, -2.4, 0.42, 1.9], [16.0, -2.4, 0.42, 1.9], [28.3, 6.0, 0.5, 2.0], [19.5, -2.4, 0.45, 2.0]] };
/* Stadtboden: Mauerlinie und dann am Ufer zurück */
HK.TOWN = [[7.2, 1.3], [11.5, 1.3], [11.5, -2.4], [23.6, -2.4], [28.3, 0.6], [28.3, 11.8], [31.9, 15.4], [31.9, 18.9], [30.2, 20.1], [28.6, 19.1], [26.4, 19.9], [25.0, 20.45], [9.0, 20.45], [7.6, 19.5], [6.4, 17.4], [7.0, 16.0], [7.0, 5.0], [6.4, 3.2], [7.2, 1.6]];
/* Sandflächen (Fischerdorf, Strand), Dorf im Umland */
HK.SAND = [[[7.0, -4.6], [10.9, -4.6], [11.1, 1.2], [7.2, 1.6], [6.6, -0.6], [7.8, -2.6]], [[33.0, 19.9], [38.2, 20.5], [41.2, 20.1], [41.0, 18.9], [36.0, 18.4], [33.6, 18.9]]];

/* kind: gable (Giebelhaus), eave (Traufenhaus), hall, townhall, church, huts, yard, plot, market, gate,
   longhouse (Lagerhalle), openhall (offene Markthalle), monastery, hospital, school */
HK.BUILDINGS = [
  // Fischerdorf vor der Nordmauer
  { id: 'fishermen', kind: 'huts',   x: 7.6,  y: -1.9, w: 1.6, d: 2.4, h: 0.5, panel: 'fishermen', name: { de: 'Fischerdorf', en: "Fishermen's village" } },
  // Kaizeile West
  { id: 'saltstore', kind: 'longhouse', x: 7.4, y: 2.4, w: 1.7, d: 1.5, h: 1.5, brick: true, wall: '#a4604c',  hoist: true, panel: 'storage', plot: 0, name: { de: 'Salzspeicher', en: 'Salt store' } },
  { id: 'warehouse', kind: 'gable',  x: 7.4,  y: 6.0,  w: 1.7, d: 1.5, h: 1.6, brick: true, wall: '#93463c',  hoist: true, panel: 'kontor', name: { de: 'Lagerhaus', en: 'Warehouse' } },
  { id: 'kontor',    kind: 'gable',  x: 7.4,  y: 7.9,  w: 1.7, d: 1.3, h: 1.3, wall: '#cdbc99', roof: '#8b4639', panel: 'kontor', name: { de: 'Dein Kontor', en: 'Your office' } },
  { id: 'customs',   kind: 'eave',   x: 7.4,  y: 11.0, w: 1.6, d: 1.3, h: 1.1, wall: '#a79e88', roof: '#665a4e', flagpole: true, panel: 'customs', name: { de: 'Zollhaus', en: 'Customs house' } },
  { id: 'shipyard',  kind: 'yard',   x: 7.3,  y: 13.0, w: 1.8, d: 2.2, h: 0.4, panel: 'shipyard', name: { de: 'Werft', en: 'Shipyard' } },
  // Block Kirche
  { id: 'church',    kind: 'church', x: 10.3, y: 2.4,  w: 3.8, d: 1.7, h: 1.9, panel: 'church', name: { de: 'Kirche St. Nikolai', en: 'St Nicholas Church' } },
  { id: 'rectory',   kind: 'eave',   x: 14.3, y: 3.8,  w: 0.8, d: 1.1, h: 0.9, wall: '#c5b48f', roof: '#795442', panel: 'church', name: { de: 'Pfarrhaus', en: 'Rectory' } },
  // Block Gilde
  { id: 'guild',     kind: 'hall',   x: 16.2, y: 2.5,  w: 1.9, d: 1.5, h: 1.6, brick: true, wall: '#ab6a4e',  banner: true, panel: 'guild', name: { de: 'Gildehaus', en: 'Guild hall' } },
  { id: 'f1',        kind: 'gable',  x: 18.5, y: 2.4,  w: 1.0, d: 1.1, h: 1.1, wall: '#b58059', roof: '#8b4639', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'f2',        kind: 'gable',  x: 19.7, y: 2.4,  w: 0.9, d: 1.1, h: 1.2, wall: '#c9b48f', roof: '#795442', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'f3',        kind: 'eave',   x: 18.5, y: 3.9,  w: 2.0, d: 0.9, h: 1.0, wall: '#c1a367', roof: '#844636', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  // Block Vogtei
  { id: 'bailiff',   kind: 'hall',   x: 21.7, y: 2.6,  w: 1.7, d: 1.5, h: 1.5, brick: true, wall: '#8d4a42',  turret: true, panel: 'bailiff', name: { de: 'Vogtei', en: "Bailiff's court" } },
  // Block Rathaus und Markt
  { id: 'townhall',  kind: 'townhall', x: 10.2, y: 6.1, w: 1.3, d: 3.4, h: 1.6, panel: 'townhall', name: { de: 'Rathaus', en: 'Town hall' } },
  { id: 'market',    kind: 'market', x: 11.7, y: 6.1,  w: 3.1, d: 3.4, h: 0, panel: 'market', name: { de: 'Marktplatz', en: 'Market square' } },
  // Block Taverne
  { id: 'tavern',    kind: 'eave',   x: 16.2, y: 6.2,  w: 1.7, d: 1.3, h: 1.2, wall: '#9d6a4b', roof: '#734a36', sign: 'tavern', panel: 'tavern', name: { de: 'Taverne „Zum Goldenen Hering“', en: 'The Golden Herring Tavern' } },
  { id: 'bank',      kind: 'eave',   x: 18.3, y: 6.2,  w: 1.4, d: 1.2, h: 1.3, wall: '#b6ad97', roof: '#605449', stone: true, sign: 'bank', panel: 'bank', name: { de: 'Geldwechsler', en: 'Money changer' } },
  { id: 'house1',    kind: 'gable',  x: 16.2, y: 8.1,  w: 1.2, d: 1.2, h: 1.2, wall: '#cdbc99', roof: '#8b4639', panel: 'house', plot: 0, name: { de: 'Haus am Kirchweg', en: 'Church Lane house' } },
  { id: 'house2',    kind: 'gable',  x: 17.7, y: 8.1,  w: 1.2, d: 1.2, h: 1.1, wall: '#b39257', roof: '#795442', panel: 'house', plot: 1, name: { de: 'Haus zum Anker', en: 'Anchor house' } },
  { id: 'f4',        kind: 'gable',  x: 19.2, y: 8.1,  w: 1.2, d: 1.2, h: 1.2, wall: '#bfab86', roof: '#844636', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'f5',        kind: 'eave',   x: 21.7, y: 6.2,  w: 1.6, d: 1.1, h: 1.1, wall: '#c6ab90', roof: '#84503f', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'f6',        kind: 'gable',  x: 21.7, y: 8.0,  w: 1.6, d: 1.2, h: 1.2, wall: '#c5b48f', roof: '#65554f', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  // Block Süd-West
  { id: 'house3',    kind: 'eave',   x: 10.2, y: 10.7, w: 1.4, d: 1.2, h: 1.2, wall: '#ab7350', roof: '#8b4639', panel: 'house', plot: 2, name: { de: 'Giebelhaus', en: 'Gabled house' } },
  { id: 'house4',    kind: 'gable',  x: 11.9, y: 10.7, w: 1.3, d: 1.2, h: 1.3, wall: '#c9b48f', roof: '#7e4634', panel: 'house', plot: 3, name: { de: 'Haus an der Hafenstraße', en: 'Harbour Street house' } },
  { id: 'plot1',     kind: 'plot',   x: 13.5, y: 10.6, w: 1.4, d: 1.3, h: 1.1, panel: 'workshop', plot: 0, name: { de: 'Werkstattgrundstück I', en: 'Workshop plot I' } },
  { id: 'bathhouse', kind: 'eave',   x: 10.2, y: 12.3, w: 1.6, d: 1.1, h: 1.1, wall: '#c6ab90', roof: '#8f503a', panel: 'bathhouse', name: { de: 'Badehaus', en: 'Bathhouse' } },
  { id: 'f7',        kind: 'gable',  x: 12.1, y: 12.3, w: 1.2, d: 1.1, h: 1.2, wall: '#cdbc99', roof: '#844636', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'f8',        kind: 'gable',  x: 13.6, y: 12.3, w: 1.2, d: 1.1, h: 1.1, wall: '#c1a367', roof: '#8b4639', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  // Block Süd-Mitte
  { id: 'plot2',     kind: 'plot',   x: 16.2, y: 10.6, w: 1.4, d: 1.3, h: 1.1, panel: 'workshop', plot: 1, name: { de: 'Werkstattgrundstück II', en: 'Workshop plot II' } },
  { id: 'plot3',     kind: 'plot',   x: 17.9, y: 10.6, w: 1.4, d: 1.3, h: 1.1, panel: 'workshop', plot: 2, name: { de: 'Werkstattgrundstück III', en: 'Workshop plot III' } },
  { id: 'house5',    kind: 'gable',  x: 19.6, y: 10.7, w: 1.2, d: 1.2, h: 1.3, wall: '#b58059', roof: '#7e4634', panel: 'house', plot: 4, name: { de: 'Speicherhaus', en: 'Storehouse' } },
  { id: 'f9',        kind: 'eave',   x: 16.2, y: 12.3, w: 1.4, d: 1.1, h: 1.1, wall: '#bfab86', roof: '#65554f', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'f10',       kind: 'gable',  x: 17.9, y: 12.3, w: 1.3, d: 1.1, h: 1.2, wall: '#b09a72', roof: '#844636', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'f11',       kind: 'eave',   x: 19.5, y: 12.3, w: 1.3, d: 1.1, h: 1.0, wall: '#c5b48f', roof: '#8b4639', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'f12',       kind: 'gable',  x: 21.7, y: 10.7, w: 1.6, d: 1.2, h: 1.2, wall: '#b39257', roof: '#795442', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'f13',       kind: 'eave',   x: 21.7, y: 12.4, w: 1.6, d: 1.0, h: 1.0, wall: '#c6ab90', roof: '#844636', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  // Südzeile
  { id: 'f14',       kind: 'gable',  x: 10.2, y: 14.6, w: 1.3, d: 1.1, h: 1.2, wall: '#ab7350', roof: '#8b4639', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'f15',       kind: 'eave',   x: 11.9, y: 14.6, w: 1.6, d: 1.1, h: 1.0, wall: '#b09a72', roof: '#65554f', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'f16',       kind: 'gable',  x: 16.2, y: 14.6, w: 1.3, d: 1.1, h: 1.2, wall: '#c9b48f', roof: '#844636', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'f17',       kind: 'gable',  x: 17.9, y: 14.6, w: 1.3, d: 1.1, h: 1.1, wall: '#c1a367', roof: '#795442', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'f18',       kind: 'eave',   x: 21.7, y: 14.6, w: 1.6, d: 1.1, h: 1.0, wall: '#a89a7f', roof: '#8b4639', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  // Hafenviertel am Südkai
  { id: 'storage2',  kind: 'longhouse', x: 7.4, y: 16.75, w: 2.4, d: 1.3, h: 1.4, brick: true, wall: '#9a5a46',  hoist: true, panel: 'storage', plot: 1, name: { de: 'Lagerhalle am Kai', en: 'Quayside warehouse' } },
  { id: 'fishmarket', kind: 'openhall', x: 10.3, y: 16.9, w: 1.6, d: 1.1, h: 0.8, panel: 'fishmarket', name: { de: 'Fischmarkt', en: 'Fish market' } },
  { id: 'dive',      kind: 'eave',   x: 12.3, y: 16.8, w: 1.4, d: 1.2, h: 1.0, wall: '#8e7d62', roof: '#634e40', shabby: true, sign: 'mug', panel: 'dive', name: { de: 'Spelunke „Zum Nassen Hund“', en: 'The Wet Dog dive' } },
  { id: 'ropewalk',  kind: 'longhouse', x: 14.0, y: 17.15, w: 3.2, d: 0.7, h: 0.6, wall: '#b09a72', roof: '#7f6e4d', low: true, panel: 'venture', name: { de: 'Seilerei', en: 'Ropewalk' } },
  { id: 'cooper',    kind: 'eave',   x: 17.5, y: 16.8, w: 1.3, d: 1.2, h: 1.0, wall: '#9d6a4b', roof: '#795442', sign: 'barrel', panel: 'venture', name: { de: 'Böttcherei', en: 'Cooperage' } },
  { id: 'smokery',   kind: 'eave',   x: 19.1, y: 16.85, w: 1.4, d: 1.15, h: 1.0, wall: '#8e7d62', roof: '#505050', bigChimney: true, sign: 'fish', panel: 'venture', name: { de: 'Fischräucherei', en: 'Fish smokery' } },
  { id: 'storage3',  kind: 'longhouse', x: 20.9, y: 16.75, w: 2.4, d: 1.3, h: 1.4, brick: true, wall: '#a56854',  hoist: true, panel: 'storage', plot: 2, name: { de: 'Speicher am Bollwerk', en: 'Bulwark warehouse' } },
  { id: 'sailmaker', kind: 'eave',   x: 24.7, y: 16.85, w: 1.5, d: 1.15, h: 1.0, wall: '#a89f7c', roof: '#65554f', sign: 'sail', panel: 'venture', name: { de: 'Segelmacherei', en: 'Sailmaker' } },
  { id: 'harbourmaster', kind: 'eave', x: 26.4, y: 16.8, w: 1.2, d: 1.2, h: 1.2, wall: '#b6ad97', roof: '#605449', stone: true, flagpole: true, panel: 'harbourmaster', name: { de: 'Hafenmeisterei', en: "Harbour master's office" } },
  // Handwerkerviertel und Stiftungen im Osten
  { id: 'monastery', kind: 'monastery', x: 24.7, y: 2.4, w: 2.7, d: 1.9, h: 1.5, panel: 'monastery', name: { de: 'Kloster St. Marien', en: "St Mary's Abbey" } },
  { id: 'craftguild', kind: 'hall',  x: 24.7, y: 7.3,  w: 1.5, d: 1.3, h: 1.5, brick: true, wall: '#97523f',  banner: 'green', panel: 'craftguild', name: { de: 'Zunfthaus', en: 'Craft guild hall' } },
  { id: 'bakery',    kind: 'gable',  x: 24.7, y: 5.7,  w: 1.1, d: 1.1, h: 1.0, wall: '#c1a367', roof: '#8b4639', sign: 'pretzel', panel: 'venture', name: { de: 'Bäckerei', en: 'Bakery' } },
  { id: 'butcher',   kind: 'eave',   x: 26.1, y: 5.7,  w: 1.2, d: 1.1, h: 1.0, wall: '#c6ab90', roof: '#795442', sign: 'cleaver', panel: 'venture', name: { de: 'Fleischerei', en: 'Butcher' } },
  { id: 'tannery',   kind: 'eave',   x: 26.4, y: 14.5, w: 1.0, d: 1.2, h: 0.9, wall: '#8e7d62', roof: '#6c5946', frames: true, panel: 'venture', name: { de: 'Gerberei', en: 'Tannery' } },
  { id: 'hospital',  kind: 'hospital', x: 24.7, y: 10.9, w: 2.5, d: 1.4, h: 1.3, panel: 'hospital', name: { de: 'Heilig-Geist-Spital', en: 'Holy Ghost hospital' } },
  { id: 'potter',    kind: 'gable',  x: 24.7, y: 12.9, w: 1.2, d: 1.0, h: 0.9, wall: '#b58059', roof: '#844636', kiln: true, sign: 'pot', panel: 'venture', name: { de: 'Töpferei', en: 'Pottery' } },
  { id: 'dyer',      kind: 'eave',   x: 26.2, y: 12.9, w: 1.2, d: 1.1, h: 1.0, wall: '#a89f7c', roof: '#605449', dyeCloths: true, panel: 'venture', name: { de: 'Färberei', en: 'Dye works' } },
  { id: 'school',    kind: 'school', x: 24.7, y: 14.5, w: 1.5, d: 1.2, h: 1.3, stone: true, wall: '#a79e88', roof: '#605449', sign: 'book', panel: 'school', name: { de: 'Lateinschule', en: 'Latin school' } },
  // Neustadt hinter der alten Nordmauer
  { id: 'stables',   kind: 'stable', x: 12.2, y: -1.9, w: 2.0, d: 1.2, h: 0.8, panel: 'venture', name: { de: 'Marstall', en: 'Stables' } },
  { id: 'granary',   kind: 'longhouse', x: 15.78, y: -1.95, w: 1.1, d: 1.25, h: 1.6, brick: true, wall: '#b07458',  hoist: true, panel: 'storage', plot: 3, name: { de: 'Kornspeicher', en: 'Granary' } },
  { id: 'weighhouse', kind: 'eave',  x: 16.9, y: -1.9, w: 1.5, d: 1.2, h: 1.3, stone: true, wall: '#b6ad97', roof: '#605449', sign: 'scale', panel: 'weighhouse', name: { de: 'Stadtwaage', en: 'Weigh house' } },
  { id: 'f20',       kind: 'gable',  x: 18.7, y: -1.9, w: 1.1, d: 1.2, h: 1.1, wall: '#b58059', roof: '#8b4639', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'inn',       kind: 'eave',   x: 20.1, y: -1.9, w: 1.8, d: 1.2, h: 1.2, wall: '#b39257', roof: '#795442', sign: 'tavern', panel: 'venture', name: { de: 'Herberge „Zum Wegweiser“', en: 'The Signpost inn' } },
  { id: 'f21',       kind: 'gable',  x: 22.2, y: -1.9, w: 1.0, d: 1.1, h: 1.1, wall: '#bfab86', roof: '#65554f', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'goldsmith', kind: 'gable',  x: 12.2, y: 0.95, w: 1.3, d: 0.9, h: 1.2, wall: '#cdbc99', roof: '#605449', sign: 'ring', panel: 'venture', name: { de: 'Goldschmied', en: 'Goldsmith' } },
  { id: 'apothecary', kind: 'eave',  x: 13.8, y: 0.95, w: 1.3, d: 0.9, h: 1.1, wall: '#c5b48f', roof: '#844636', sign: 'mortar', panel: 'venture', name: { de: 'Apotheke', en: 'Apothecary' } },
  { id: 'chapel',    kind: 'chapel', x: 16.6, y: 0.7,  w: 1.4, d: 1.1, h: 1.2, panel: 'chapel', name: { de: 'Kapelle St. Gertrud', en: "St Gertrude's chapel" } },
  { id: 'f22',       kind: 'gable',  x: 18.4, y: 0.95, w: 1.2, d: 0.9, h: 1.1, wall: '#ab7350', roof: '#8b4639', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'f23',       kind: 'eave',   x: 19.9, y: 0.95, w: 1.5, d: 0.9, h: 1.0, wall: '#c9b48f', roof: '#795442', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'f24',       kind: 'gable',  x: 21.7, y: 0.95, w: 1.1, d: 0.9, h: 1.2, wall: '#c1a367', roof: '#844636', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'f25',       kind: 'eave',   x: 24.6, y: 0.95, w: 1.4, d: 0.9, h: 1.0, wall: '#b09a72', roof: '#65554f', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  { id: 'f26',       kind: 'gable',  x: 26.3, y: 0.95, w: 1.0, d: 0.9, h: 1.1, wall: '#c5b48f', roof: '#8b4639', name: { de: 'Bürgerhaus', en: 'Townhouse' } },
  // Bollwerk im Südosten
  { id: 'timberyard', kind: 'timberyard', x: 28.4, y: 13.9, w: 1.3, d: 1.0, h: 0.5, panel: 'venture', name: { de: 'Holzhof', en: 'Timber yard' } },
  { id: 'arsenal',   kind: 'hall',   x: 28.4, y: 16.2, w: 1.5, d: 1.3, h: 1.4, stone: true, wall: '#9c937f', roof: '#574e42', banner: 'red', panel: 'arsenal', name: { de: 'Zeughaus', en: 'Arsenal' } },
  { id: 'pilot',     kind: 'gable',  x: 30.2, y: 16.4, w: 1.0, d: 1.0, h: 1.0, wall: '#a89a7f', roof: '#665a4e', sign: 'anchor', name: { de: 'Lotsenhaus', en: "Pilot's house" } },
  // Tor (Osttor) und Hafen (Wasser)
  { id: 'gate',      kind: 'gate',   x: 27.8, y: 9.3,  w: 1.0, d: 1.4, h: 2.1, panel: 'gate', name: { de: 'Stadttor', en: 'Town gate' } },
  { id: 'harbour',   kind: 'water',  x: 0, y: 0, w: 0, d: 0, h: 0, panel: 'harbour', name: { de: 'Hafen', en: 'Harbour' } },
];
HK.BUILDING = {}; HK.BUILDINGS.forEach(b => HK.BUILDING[b.id] = b);

/* Straßen: [x1,y1,x2,y2,breite] in Weltkoordinaten */
HK.STREETS = [
  [9.5, 1.8, 9.5, 18.3, 0.9], [15.5, 2.4, 15.5, 18.3, 0.9], [21, 1.8, 21, 18.3, 0.8], [24, 0.4, 24, 18.3, 0.8], [27.5, 0.4, 27.5, 18.3, 0.5],
  [7.4, 5.5, 27.8, 5.5, 0.8], [7.4, 10, 27.8, 10, 0.9], [7.4, 14, 29.9, 14.3, 0.8], [7.4, 2.1, 27.8, 2.1, 0.6], [7.4, 16.2, 31.0, 16.2, 0.6],
  [12.0, 0.4, 27.5, 0.4, 0.8], [15.5, 2.4, 15.5, -2.4, 0.8], [29.9, 14.3, 29.9, 18.3, 0.6],
  [28.8, 10, 31.6, 10, 0.9], [31.6, 10, 34.5, 9.0, 0.7], [34.5, 9.0, 38.5, 9.8, 0.7], [15.5, -2.4, 15.6, -5.2, 0.7], [15.6, -5.2, 16.6, -8.0, 0.6], [16.6, -8.0, 16.0, -11.0, 0.6], [8.2, 0.6, 8.2, -3.4, 0.5],
];
HK.ROAD_NODES = {
  Q1: [7.2, 2.2], Q2: [7.2, 5.5], Q3: [7.2, 10], Q4: [7.2, 14], Q5: [7.2, 16.2], Q6: [7.2, 18.3],
  H1: [9.5, 2.2], H2: [9.5, 5.5], H23: [9.5, 8.5], H3: [9.5, 10], H4: [9.5, 14], H5: [10.05, 16.2], H6: [10.05, 18.3],
  M1: [15.5, 2.2], M2: [15.5, 5.5], M23: [15.5, 8.5], M3: [15.5, 10], M4: [15.5, 14], M5: [15.5, 16.2], M6: [15.5, 18.3],
  O1: [21, 2.2], O2: [21, 5.5], O3: [21, 10], O4: [21, 14], O5: [21, 16.2], O6: [21, 18.3],
  C0: [24, 2.2], C1: [24, 5.5], C2: [24, 10], C3: [24, 14], C4: [24, 16.2], C5: [24, 18.3],
  E1: [27.5, 2.2], E2: [27.5, 5.5], E3: [27.5, 10], E4: [27.5, 14.2], E5: [27.5, 16.2], E6: [27.5, 18.3],
  B1: [29.9, 14.5], B2: [29.9, 16.2], B3: [29.9, 18.3], B4: [31.0, 16.2],
  N0: [12.0, 0.4], N1: [15.5, 0.4], N2: [19.5, 0.4], N3: [24, 0.4], N4: [27.3, 0.4],
  S1: [12.6, 7.1], S2: [14.0, 7.1], S3: [12.9, 9.5], MK: [13, 10], NN: [12.6, 5.5],
  PA: [12.45, 22.9], PB: [19.45, 22.9], SP1: [12.45, 18.3], SP2: [19.45, 18.3], G: [29.2, 10], OUT: [31.6, 10], OUT2: [34.5, 9.0], OUT3: [38.5, 9.8],
  NG: [15.5, -2.4], NG2: [15.6, -5.2], V1: [16.6, -8.0], V2: [16.0, -11.0], V3: [14.2, -7.6], V4: [18.6, -7.2],
  FV1: [9.5, 0.6], FV2: [9.5, -1.0], FV3: [9.5, -2.4], FV4: [10.9, -1.0],
};
HK.ROAD_EDGES = [
  ['Q1', 'Q2'], ['Q2', 'Q3'], ['Q3', 'Q4'], ['Q4', 'Q5'], ['Q5', 'Q6'], ['H1', 'H2'], ['H2', 'H23'], ['H23', 'H3'], ['H3', 'H4'], ['H4', 'H5'], ['H5', 'H6'],
  ['M1', 'M2'], ['M2', 'M23'], ['M23', 'M3'], ['M3', 'M4'], ['M4', 'M5'], ['O1', 'O2'], ['O2', 'O3'], ['O3', 'O4'], ['O4', 'O5'], ['O5', 'O6'],
  ['C0', 'C1'], ['C1', 'C2'], ['C2', 'C3'], ['C3', 'C4'], ['C4', 'C5'], ['E1', 'E2'], ['E2', 'E3'], ['E3', 'E4'], ['E4', 'E5'], ['E5', 'E6'],
  ['Q1', 'H1'], ['H1', 'M1'], ['M1', 'O1'], ['O1', 'C0'], ['C0', 'E1'], ['Q2', 'H2'], ['M2', 'O2'], ['O2', 'C1'], ['C1', 'E2'],
  ['Q3', 'H3'], ['H3', 'MK'], ['MK', 'M3'], ['M3', 'O3'], ['O3', 'C2'], ['C2', 'E3'], ['E3', 'G'], ['G', 'OUT'], ['OUT', 'OUT2'], ['OUT2', 'OUT3'],
  ['H4', 'M4'], ['M4', 'O4'], ['O4', 'C3'], ['C3', 'E4'], ['E4', 'B1'], ['Q5', 'H5'], ['H5', 'M5'], ['M5', 'O5'], ['O5', 'C4'], ['C4', 'E5'], ['E5', 'B2'], ['B2', 'B4'],
  ['Q6', 'H6'], ['H6', 'SP1'], ['SP1', 'M6'], ['M6', 'SP2'], ['SP2', 'O6'], ['O6', 'C5'], ['C5', 'E6'], ['E6', 'B3'], ['B1', 'B2'], ['B2', 'B3'],
  ['S1', 'S2'], ['S2', 'M23'], ['S1', 'S3'], ['S2', 'S3'], ['S3', 'MK'], ['H2', 'NN'], ['NN', 'M2'], ['NN', 'S1'], ['PA', 'SP1'], ['PB', 'SP2'],
  ['N0', 'N1'], ['N1', 'N2'], ['N2', 'N3'], ['N3', 'N4'], ['N1', 'M1'], ['N3', 'C0'], ['N4', 'E1'], ['N1', 'NG'], ['NG', 'NG2'], ['NG2', 'V1'], ['V1', 'V2'], ['V1', 'V3'], ['V1', 'V4'],
  ['Q1', 'FV1'], ['FV1', 'FV2'], ['FV2', 'FV3'], ['FV2', 'FV4'],
];
HK.ROAD_ADJ = {}; Object.keys(HK.ROAD_NODES).forEach(k => HK.ROAD_ADJ[k] = []);
HK.ROAD_EDGES.forEach(([a, b]) => { HK.ROAD_ADJ[a].push(b); HK.ROAD_ADJ[b].push(a); });

/* Stege (von der Kaikante nach +y ins Wasser), Liegeplätze, Reede, Boote, Karawanen */
HK.PIERS = [{ x: 11.6, y0: 20.45, y1: 24.2, w: 2.4, crane: 11.05, lane: 12.45 }, { x: 18.6, y0: 20.45, y1: 24.2, w: 2.4, crane: 18.05, lane: 19.45 }];
HK.BERTHS = [{ x: 9.75, y: 22.35 }, { x: 13.45, y: 22.35 }, { x: 16.75, y: 22.35 }, { x: 20.45, y: 22.35 }, { x: 23.6, y: 22.35 }];
HK.SHIP_SCALE = 1.4;
HK.BERTH_HEADING = Math.PI / 2;
HK.OWN_BERTHS = [{ x: 14.6, y: 24.9 }, { x: 16.6, y: 25.7 }, { x: 12.2, y: 25.5 }, { x: 18.6, y: 26.7 }, { x: 10.4, y: 26.7 }];
HK.RIVAL_ANCHORAGE = [{ x: 20.8, y: 24.7, h: 2.1 }, { x: 23.4, y: 25.5, h: 1.9 }, { x: 9.6, y: 24.3, h: 2.3 }];
HK.ISLET = { x: -3.6, y: 5.6 };
HK.BOAT_SPOTS = [{ x: 6.2, y: -1.2 }, { x: 5.5, y: -0.4 }, { x: 15.6, y: 22.3 }, { x: 25.2, y: 21.9 }];
HK.GUARD_SHIP = { x: 15.6, y: 25.7, heading: 0.35 };
HK.CARAVAN_SPOTS = [{ x: 30.4, y: 10.9 }, { x: 32.0, y: 10.9 }];
HK.ARRIVE_POINT = { x: 4, y: 30.1 };
HK.LEAVE_POINT = { x: -3, y: 25.1 };
HK.MOLE = { x: 25.6, y0: 20.8, y1: 22.7, w: 0.7 };
HK.LIGHTHOUSE = { x: 25.95, y: 23.05, r: 0.45, h: 2.2 };
/* Sperrflächen für Passanten: die Krone der Kaimauer ist gemauerte Kante, kein Gehweg */
HK.NOWALK = [[8.8, 19.75, 10.3, 20.5], [12.9, 19.75, 17.3, 20.5], [19.9, 19.75, 25.2, 20.5]];
HK.WINDMILL = { x: 33.8, y: 12.4 };
HK.FIELDS = [[29.6, 3.6, 2.4, 2.2], [30.4, 6.4, 2.2, 2.0], [33.4, 14.4, 1.8, 2.0], [35.6, 12.0, 2.0, 1.8], [12.2, -8.6, 2.0, 1.4], [18.4, -9.6, 2.2, 1.6], [19.0, -6.2, 1.8, 1.4], [11.6, -6.4, 1.6, 1.2]];
HK.FARM = { x: 34.6, y: 16.9, w: 1.4, d: 1.0, h: 0.9 };
HK.HAMLET = [{ x: 13.6, y: -7.4, w: 1.3, d: 1.0 }, { x: 17.2, y: -8.2, w: 1.4, d: 1.0 }, { x: 15.0, y: -10.4, w: 1.2, d: 0.9 }, { x: 18.6, y: -6.0, w: 1.0, d: 0.9 }];

HK.STATIC_NPCS = [
  { person: 'priest', x: 12.3, y: 4.4, color: '#5e4434' },
  { person: 'customs', x: 8.3, y: 12.6, color: '#435479' },
  { person: 'innkeeper', x: 17.0, y: 7.8, color: '#8f3d3d' },
  { person: 'guild', x: 17.2, y: 4.3, color: '#5e4d7f' },
  { person: 'bailiff', x: 22.6, y: 4.4, color: '#474747' },
  { person: 'changer', x: 19.0, y: 7.7, color: '#547942' },
  { person: 'shipwright', x: 8.5, y: 12.85, color: '#7e5934' },
  { person: 'mayor', x: 11.9, y: 8.3, color: '#7a3232' },
  { person: 'abbot', x: 26.2, y: 4.6, color: '#62472c' },
  { person: 'craftmaster', x: 25.3, y: 8.85, color: '#36734a' },
  { person: 'harbourmaster', x: 27.2, y: 18.25, color: '#34467f' },
  { person: 'divekeeper', x: 13.2, y: 18.25, color: '#734a36' },
  { person: 'schoolmaster', x: 25.3, y: 15.95, color: '#404058' },
  { person: 'weighmaster', x: 17.7, y: -0.3, color: '#5d554a' },
];
HK.WALKER_TYPES = [
  { id: 'citizen', weight: 6, colors: ['#84623f', '#627350', '#735073', '#4d5e7f', '#906e3c', '#843f3f', '#466c6c'] },
  { id: 'merchant', weight: 2, colors: ['#853f3d', '#445a7d', '#4e7049', '#684769'] },
  { id: 'fisher', weight: 2, colors: ['#3f6284', '#4a6a8b', '#666654'] },
  { id: 'beggar', weight: 1, colors: ['#6a5e4b'] },
  { id: 'monk', weight: 1, colors: ['#66503a', '#474747'] },
  { id: 'guard', weight: 1, colors: ['#435479'] },
  { id: 'child', weight: 2, colors: ['#9a7a5a', '#7a9a5a', '#9a5a5a'] },
];
HK.TREES = [
  [15.2, 4.7, 0.5], [20.7, 4.5, 0.45], [15.3, 9.95, 0.45], [20.8, 9.4, 0.4], [14.9, 13.8, 0.5], [20.7, 13.9, 0.45], [23.3, 15.9, 0.45], [9.3, 15.7, 0.4], [13.9, 16.0, 0.4], [19.6, 16.0, 0.45],
  [23.3, 5.2, 0.35], [23.3, 8.9, 0.35], [9.0, 4.9, 0.35], [14.6, 2.6, 0.4], [23.2, 12.2, 0.35], [9.0, 9.4, 0.3], [26.5, 8.4, 0.35], [26.9, 12.2, 0.3], [24.5, 12.6, 0.3], [27.0, 16.3, 0.35], [9.5, 18.1, 0.3], [16.9, 18.15, 0.3],
  [23.3, 0.2, 0.3], [25.6, -0.3, 0.35], [29.3, 12.4, 0.3], [30.8, 14.9, 0.3], [31.0, 17.6, 0.32],
  [30.2, 1.6, 0.55], [32.4, 0.4, 0.6], [33.4, 3.6, 0.6], [33.8, 6.6, 0.5], [33.2, 8.4, 0.5], [30.4, 9.0, 0.45], [32.8, 11.0, 0.45], [36.2, 8.2, 0.55], [37.6, 11.4, 0.55], [35.4, 15.8, 0.5], [38.4, 15.0, 0.6], [37.2, 17.6, 0.5], [33.2, 17.4, 0.45], [40.2, 12.8, 0.55], [39.6, 6.4, 0.6], [36.6, 3.2, 0.55], [39.4, 2.2, 0.5], [41.0, 9.4, 0.5], [42.6, 16.6, 0.55], [40.8, 18.6, 0.45],
  [27.6, -1.6, 0.55], [30.4, -3.0, 0.55], [25.2, -3.8, 0.5], [21.4, -4.4, 0.5], [12.4, -4.6, 0.45], [10.4, -3.0, 0.45], [19.8, -3.8, 0.4], [11.0, -10.2, 0.6], [12.6, -12.4, 0.55], [20.8, -11.4, 0.6], [22.6, -8.6, 0.55], [24.4, -6.4, 0.5], [9.6, -7.4, 0.45], [17.8, -13.2, 0.55], [14.4, -13.8, 0.5], [7.6, 0.5, 0.3], [9.2, -14.6, 0.5], [28.2, -8.2, 0.6], [26.6, -11.0, 0.55], [30.8, -6.4, 0.5],
];
HK.PROPS = [
  { t: 'crates', x: 8.55, y: 4.65 }, { t: 'barrels', x: 8.69, y: 10.56 }, { t: 'barrels', x: 7.84, y: 10.54 }, { t: 'barrels', x: 17.9, y: 7.7 }, { t: 'well', x: 12.05, y: 9.05 }, { t: 'statue', x: 14.18, y: 8.38 }, { t: 'pillory', x: 14.4, y: 9.2 }, { t: 'crates', x: 5.0, y: 5.6 }, { t: 'nets', x: 10.4, y: 0.6 }, { t: 'nets', x: 10.1, y: -0.4 }, { t: 'laundry', x: 18.9, y: 9.35 }, { t: 'barrels', x: 16.0, y: 4.7 }, { t: 'kiln', x: 26.1, y: 13.05 }, { t: 'frames', x: 27.95, y: 14.65 }, { t: 'dyecloths', x: 27.98, y: 12.75 }, { t: 'gallows', x: 30.6, y: 7.6 }, { t: 'tollbar', x: 29.6, y: 10.0 }, { t: 'well', x: 15.3, y: -6.6 }, { t: 'crates', x: 14.51, y: -0.45 }, { t: 'barrels', x: 17.2, y: -0.35 }, { t: 'logs', x: 30.25, y: 13.5 }, { t: 'logs', x: 30.6, y: 15.0 }, { t: 'shrine', x: 16.2, y: -4.3 }, { t: 'boatup', x: 34.4, y: 19.05 }, { t: 'nets', x: 36.4, y: 18.75 }, { t: 'boatup', x: 9.5, y: -3.0 }, { t: 'fishracks', x: 10.2, y: -1.8 }, { t: 'well', x: 26.9, y: 7.9 }, { t: 'stalls', x: 0.0, y: 0.0 },
  { t: 'cross', x: 8.95, y: 18.9 }, { t: 'crates', x: 9.25, y: 18.8 }, { t: 'barrels', x: 10.1, y: 18.85 }, { t: 'nets', x: 10.85, y: 18.7 }, { t: 'crates', x: 11.3, y: 19.2 }, { t: 'barrels', x: 13.0, y: 18.85 }, { t: 'crates', x: 13.6, y: 19.2 }, { t: 'ropes', x: 14.4, y: 19.0 }, { t: 'crates', x: 16.5, y: 18.8 }, { t: 'barrels', x: 17.3, y: 18.85 }, { t: 'nets', x: 18.05, y: 18.7 }, { t: 'crates', x: 18.4, y: 19.2 }, { t: 'barrels', x: 19.9, y: 18.85 }, { t: 'crates', x: 20.5, y: 19.2 }, { t: 'nets', x: 21.45, y: 18.7 }, { t: 'crates', x: 22.0, y: 18.8 }, { t: 'sails', x: 22.9, y: 18.7 }, { t: 'ropes', x: 22.8, y: 19.3 },
];
