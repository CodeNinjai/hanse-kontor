/* HK_URL=http://localhost:8778 NODE_PATH=/path/to/node_modules node tools/browser-test.cjs */
'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const shots = process.env.HK_SCREENSHOTS || '/tmp/hanse-map-audit'; fs.mkdirSync(shots, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, locale: 'de-DE' }), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => { let seed = 42; Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296); });
    await page.goto(process.env.HK_URL || 'http://localhost:8778/');
    await page.waitForFunction(() => HK.PixiScene.bereit);
    await page.locator('#new-game-form button[type=submit]').click();
    await page.evaluate(() => {
      window.testLoop = HK.loop; HK.loop = () => {};
      HK.UI.lehrgangAktion('zu'); HK.Scene.weather = 'clear'; HK.Scene.weatherDay = HK.state.day; HK.Scene.clock = .5;
      HK.state.money = 100000; HK.state.ships[0].cargo.salt = { qty: 40, price: 40 };
      HK.state.ships[0].wants.beer = { qty: 40, price: 60 }; HK.UI.renderAll();
    });
    await page.waitForTimeout(100);
    const comparison = await page.evaluate(() => {
      const ship = HK.state.ships[0], previous = ship.wants.salt;
      ship.wants.salt = { qty: 7, price: 1000 };
      HK.UI.marketGood = 'salt'; HK.UI.panel = 'market'; HK.UI.renderAll();
      const section = document.querySelector('.trade-comparison'), badge = section.querySelector('.rat.gut');
      const result = { text: section.textContent, priceRhythm: document.querySelector('.context-help[data-help=marketHelp] .context-help-body').textContent, green: badge?.textContent, fits: section.scrollWidth <= section.clientWidth };
      ship.wants.salt.qty = 0; HK.UI.renderAll();
      result.exhausted = !document.querySelector('.trade-comparison').textContent.includes('Nachfrage: 0 Last');
      if (previous) ship.wants.salt = previous; else delete ship.wants.salt;
      HK.UI.renderAll(); return result;
    });
    assert(comparison.green?.includes('Mark/Last') && comparison.text.includes('Nachfrage: 7 Last') && comparison.priceRhythm.includes('20 Minuten') && comparison.fits && comparison.exhausted, JSON.stringify(comparison));
    assert.equal(await page.locator('#city-links .nav-picture').count(), 4, 'Bebilderte Hauptnavigation fehlt');
    assert.equal(await page.locator('.goods-grid .commodity').count(), await page.evaluate(() => HK.GOODS.length), 'Warenraster ist unvollständig');
    assert.equal(await page.locator('.goods-grid [data-menu-art]').evaluateAll(els => new Set(els.map(e => e.dataset.menuArt)).size), await page.evaluate(() => HK.GOODS.length), 'Warenbilder sind nicht eindeutig');
    await page.locator('#market-good-tools').focus(); await page.locator('#market-good-tools').press('Enter');
    assert.equal(await page.locator('.selected-good-picture').getAttribute('data-menu-art'), 'tools', 'Tastaturauswahl aktualisiert das Warenbild nicht');
    assert.equal(await page.locator('#market-good-tools').getAttribute('aria-pressed'), 'true', 'Warenauswahl ist nicht zugänglich markiert');
    assert.equal(await page.locator('[data-action=mbuy]').getAttribute('data-good'), 'tools', 'Handelsaktion verwendet die vorherige Ware');
    await page.locator('.goods-grid').screenshot({ path: path.join(shots, 'visual-goods-grid.png') });
    await page.locator('#city-links [data-place=harbour]').click();
    assert(await page.locator('.captain-card').count(), 'Kapitäne fehlen im Hafen');
    assert(await page.locator('.captain-card .person-picture').count(), 'Kapitänsporträt fehlt');
    assert(await page.locator('.visitor-good [data-menu-art]').count(), 'Warenkarten beim Besucher fehlen');
    const geometry = await page.evaluate(() => HK.geoStand);
    await page.locator('[data-action=vbuy][data-good=salt]').click();
    assert.equal(await page.evaluate(() => HK.state.freight.jobs.at(-1).qty), 10);
    assert.equal(await page.evaluate(() => HK.geoStand), geometry, 'Handel verwirft die Stadtgeometrie');
    await page.evaluate(() => {
      const h = Object.values(HK.state.burghers)[0]; h.sale = { price: 5000, until: HK.state.day + 60 }; HK.UI.renderAll();
    });
    assert(await page.evaluate(g => HK.geoStand > g, geometry), 'Verkaufstafel aktualisiert die Darstellung nicht');
    await page.locator('[data-action=vsell][data-good=beer]').click();
    assert.equal(await page.evaluate(() => HK.state.freight.jobs.at(-1).direction), 'out');
    await page.evaluate(() => {
      HK.state.town.berths = 5;
      for (const origin of ['bergen', 'riga', 'danzig', 'stockholm']) HK.dockShip(HK.state, origin);
      HK.Scene.snapShips(); HK.Scene.focusDistrict('harbour');
      for (const ship of HK.state.ships.slice(1)) HK.transport(HK.state, ship, 'tools', 17, 'in');
      HK.buyShip(HK.state, 'kogge'); HK.state.warehouse.stock.salt = 50;
      HK.loadShip(HK.state, HK.state.ownShips[0].id, 'salt', 20);
      for (let i = 0; i < 70; i++) HK.Scene.update(.1);
      for (let i = 0; i < 20; i++) HK.Scene.draw(); HK.UI.renderAll();
    });
    assert(await page.evaluate(() => HK.Scene.docks().some(d => d.load)), 'Kran zeigt keine gebuchte Ware');
    await page.screenshot({ path: path.join(shots, 'freight-harbour.png') });
    const economics = await page.evaluate(() => JSON.stringify([HK.state.money, HK.state.warehouse, HK.state.ownShips[0].cargo]));
    const flow = await page.evaluate(() => {
      let boats = 0, cargo = 0, handoff = 0;
      const receipts = HK.state.freight.jobs.slice();
      for (let i = 0; i < 15000; i++) {
        HK.Scene.update(.1); boats = Math.max(boats, HK.Scene.tenders.length);
        handoff += HK.Scene.tenders.filter(t => t.handoff != null).length;
        cargo = Math.max(cargo, HK.Scene.porters.filter(w => w.items.length).length);
        if (i % 500 === 0) HK.Scene.draw();
        if (receipts.every(j => j.status === 'done')) break;
      }
      HK.UI.syncBackdrop(); HK.Scene.draw();
      const complete = receipts.every(j => j.completed === j.qty && j.status === 'done');
      return { boats, cargo, handoff, complete, ...(complete ? {} : { pending: receipts.filter(j => j.status !== 'done'), actors: HK.Scene.porters.map(w => ({ from: w.from, to: w.to, t: w.t, off: w.off, state: w.state, cart: w.cart, items: w.items, pos: HK.Scene.porterPos(w), id: w.trafficId })), walkers: HK.Scene.walkers.map(w => ({ from: w.from, to: w.to, t: w.t, off: w.off, pause: w.pause, id: w.trafficId })) }) };
    });
    assert(flow.complete && flow.boats > 0 && flow.boats <= 2 && flow.handoff > 0 && flow.cargo > 0, JSON.stringify(flow));
    assert.equal(await page.evaluate(() => JSON.stringify([HK.state.money, HK.state.warehouse, HK.state.ownShips[0].cargo])), economics, 'Animation bucht erneut');
    assert(await page.locator('#freight-list progress').evaluateAll(els => els.length && els.every(el => el.value === el.max)), 'Fortschritt aktualisiert sich in Pause nicht');
    await page.evaluate(() => HK.UI.setTab('missions'));
    await page.locator('[data-action=chapter]').click();
    assert.equal(await page.evaluate(() => HK.state.chapters.step), 1);
    await page.evaluate(() => { HK.state.warehouse.stock.grain = 20; HK.UI.renderAll(); });
    await page.locator('[data-action=chapter][data-choice=aid]').click();
    assert.equal(await page.evaluate(() => HK.state.chapters.choice), 'aid');
    assert.equal(await page.evaluate(() => HK.state.warehouse.stock.grain), 8);
    await page.evaluate(() => { HK.state.chapters.sold = { luebeck: 10, riga: 10 }; HK.UI.renderAll(); });
    await page.locator('[data-action=chapter]').click();
    assert.equal(await page.evaluate(() => HK.state.chapters.step), 3);
    await page.screenshot({ path: path.join(shots, 'trading-letters.png') });
    await page.evaluate(() => {
      for (let i = 0; i < 12; i++) HK.tick(HK.state);
      HK.UI.closeModal(); HK.UI.setTab('place'); HK.UI.panel = 'market'; HK.UI.marketGood = 'salt'; HK.UI.renderAll();
    });
    assert(await page.locator('.price-history svg').count(), 'Preisdiagramm fehlt');
    assert(await page.locator('.price-buy').getAttribute('d').then(d => d.includes('L')), 'Preisverlauf hat keine Historie');
    await page.locator('.price-history>summary').click();
    await page.locator('.price-history').screenshot({ path: path.join(shots, 'price-chart.png') });
    await page.screenshot({ path: path.join(shots, 'price-history.png') });
    await page.locator('#side .lang-btn[data-lang=en]').click();
    assert.match(await page.locator('.price-history>summary').textContent(), /Price history/);
    assert.match(await page.locator('#city-links [data-place=market]').textContent(), /Trade/);
    assert.equal(await page.locator('#city-links .nav-picture').count(), 4, 'Sprachwechsel entfernt Navigationsbilder');
    assert.match(await page.locator('#btn-s1').getAttribute('title'), /20 minutes/);
    await page.locator('#side .lang-btn[data-lang=de]').click();
    const saved = await page.evaluate(() => {
      HK.Scene.clock = .63; HK.lastSaveAt = Date.now() - HK.AUTO_SAVE_MS - 1;
      window.testLoop(performance.now()); return JSON.parse(localStorage.getItem(HK.SAVE_KEY));
    });
    assert.equal(saved.timeOfDay, .63); assert.equal(saved.chapters.step, 3);
    await page.evaluate(() => { HK.state.money -= 123; HK.Scene.clock = .1; HK.loadGame(); });
    assert.equal(await page.evaluate(() => HK.state.money), saved.money);
    assert.equal(await page.evaluate(() => HK.Scene.clock), .63);
    await page.evaluate(() => { HK.Scene.clock = .95; HK.Scene.focusDistrict('harbour'); for (let i = 0; i < 30; i++) HK.Scene.draw(); });
    await page.screenshot({ path: path.join(shots, 'freight-night.png') });
    const nightPeople = await page.evaluate(() => {
      const S = HK.Scene, people = [...S.walkers, ...S.porters], list = S.buildItems(null, HK.state, S.season(), S.time);
      const visible = people.filter(w => S.walkerAlpha(w) === 1).length;
      const original = S.drawPerson, alphas = [];
      try {
        S.drawPerson = (...args) => { alphas.push(args[5]); };
        for (const it of list) if (it.s?.startsWith('w|') || it.s?.startsWith('tr|') || it.cartPart === 'actor') it.f(S.ctx);
      } finally { S.drawPerson = original; }
      return { visible, total: people.length, opaque: alphas.length > 0 && alphas.every(a => a === 1), binary: people.every(w => [0, 1].includes(S.walkerAlpha(w))) };
    });
    assert(nightPeople.opaque && nightPeople.binary && nightPeople.visible < nightPeople.total, 'Nachts laufen durchsichtige Figuren: ' + JSON.stringify(nightPeople));
    const lights = await page.evaluate(() => {
      const S = HK.Scene, P = HK.PixiScene, L = HK.LIGHTHOUSE;
      S.focusDistrict('all'); for (let i = 0; i < 30; i++) S.draw();
      const beacon = HK.Iso.p(L.x, L.y, S.DECK_Z + L.h + .32);
      const townhall = P.cache.get('b' + HK.BUILDING.townhall.id).lampen;
      const targets = [beacon, ...townhall], counts = [];
      for (let i = 0; i < 60; i++) {
        S.time += .1; if (i === 20 || i === 40) HK.geoStand++;
        S.draw(); counts.push(targets.map(p => P.lampen.filter(l => Math.hypot(l[0] - p[0], l[1] - p[1]) < .01).length));
      }
      // Check the beacon itself, independently of the halo and moving water.
      const c = document.createElement('canvas'); c.width = c.height = 32;
      const g = c.getContext('2d'), time = S.time, lamps = S.lamps, images = [];
      try {
        for (const t of [0, .175, .35, .525]) {
          S.time = t; S.lamps = []; g.resetTransform(); g.clearRect(0, 0, 32, 32);
          g.translate(16 - beacon[0], 16 - beacon[1]); S.drawMole(g, S.shadowVec());
          images.push(g.getImageData(12, 12, 8, 8).data.join(','));
        }
      } finally { S.time = time; S.lamps = lamps; }
      S.focusDistrict('harbour'); S.draw();
      return { frames: counts.length, sources: targets.length, singleSources: counts.every(row => row.every(n => n === 1)), steadyBeacon: new Set(images).size === 1 };
    });
    assert(lights.singleSources && lights.steadyBeacon, 'Nächtliche Lichtquellen flackern: ' + JSON.stringify(lights));
    const houseLights = await page.evaluate(() => {
      const S = HK.Scene, P = HK.PixiScene, I = HK.Iso, original = I.window3, saved = { clock: S.clock, nightK: S.nightK, time: S.time }, rows = [], intensities = new Set();
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1; const ctx = canvas.getContext('2d');
      let lit = 0, total = 0;
      I.window3 = function (ctx, a, ...args) { const glow = S.windowLight(a); total++; if (glow) { lit++; intensities.add(glow.brightness.toFixed(4)); } return original.call(this, ctx, a, ...args); };
      try {
        S.focusDistrict('all');
        for (const clock of [.85, .955, .08]) {
          S.clock = clock; for (let i = 0; i < 30; i++) S.draw();
          lit = total = 0;
          for (const b of HK.BUILDINGS) if (!['water', 'market'].includes(b.kind)) S.drawBuilding(ctx, b, HK.state, S.season(), S.shadowVec());
          rows.push({ clock, lit, total });
        }
        const b = HK.BUILDING.house1, bed = S.houseLightProfile(b).bed;
        S.clock = (bed - .000001 + 1) % 1; S.draw(); const before = P.cache.get('b' + b.id).revision;
        S.clock = (bed + .000001 + 1) % 1; S.draw(); const after = P.cache.get('b' + b.id).revision;
        const emissionUpdated = P.cache.get('b' + b.id).emMarke.endsWith('|' + after);
        S.clock = .08; let dormant = 0; for (let i = 0; i < 100; i++) if (S.lampGlow(i * 47, i * 31) === 0) dormant++;
        return { rows, brightnessVariants: intensities.size, cacheUpdated: before !== after && after === S.houseLightKey(b), emissionUpdated, dormant };
      } finally { I.window3 = original; Object.assign(S, saved); for (let i = 0; i < 30; i++) S.draw(); }
    });
    assert(houseLights.rows[0].lit > houseLights.rows[1].lit && houseLights.rows[1].lit > houseLights.rows[2].lit && houseLights.rows[2].lit < houseLights.rows[0].lit * .2, 'Die Stadt geht nachts nicht schlafen: ' + JSON.stringify(houseLights));
    assert(houseLights.brightnessVariants > 12 && houseLights.dormant > 75 && houseLights.cacheUpdated && houseLights.emissionUpdated, 'Hauslicht oder Lichtpuffer folgt nicht der Tageszeit: ' + JSON.stringify(houseLights));
    const cityFlair = await page.evaluate(() => {
      const S = HK.Scene, P = HK.PixiScene, saved = { clock: S.clock, weather: S.weather, time: S.time }, plant = S.drawCityPlant;
      try {
        S.clock = .5; S.weather = 'clear'; S.focusDistrict('all'); for (let i = 0; i < 30; i++) S.draw();
        const day = S.buildItems(null, HK.state, S.season(), S.time), counts = list => ({ details: list.filter(it => it.cityDetail).length, actors: list.filter(it => it.cityActor).length, vendors: list.filter(it => it.cityVendor !== undefined).length, birds: list.filter(it => it.cityBird).length, plants: list.filter(it => it.cityPlant).length });
        const plants = [...P.animiert].filter(([key]) => key.startsWith('city-plant:')), snapshots = plants.map(([key, e]) => [key, e.g.context, e.g.rotation]);
        const details = HK.CITY_DETAILS.map(d => ['city:' + d.id, P.cache.get('city:' + d.id).frame]);
        let draws = 0; S.drawCityPlant = function (...args) { draws++; return plant.apply(this, args); };
        for (let i = 0; i < 30; i++) { S.time += 1 / 60; S.draw(); }
        const reused = snapshots.every(([key, ctx]) => P.animiert.get(key).g.context === ctx), swayed = snapshots.some(([key, ctx, rotation]) => Math.abs(P.animiert.get(key).g.rotation - rotation) > 1e-5);
        const staticRebuilds = details.filter(([key, frame]) => P.cache.get(key).frame !== frame).length, idlePlantRedraws = draws;
        const vendorFree = day.filter(it => it.cityVendor !== undefined).every(it => !S.blockedAt((it.box[0] + it.box[2]) / 2, (it.box[1] + it.box[3]) / 2));
        S.clock = .08; for (let i = 0; i < 30; i++) S.draw(); const night = S.buildItems(null, HK.state, S.season(), S.time);
        const covered = S.marketStalls(HK.BUILDING.market).every((sd, i) => P.cache.get('ms' + i).revision === 'closed');
        S.clock = .85; const evening = S.buildItems(null, HK.state, S.season(), S.time).filter(it => it.cityActor).map(it => it.cityActor.id);
        S.clock = .5; S.weather = 'rain'; for (let i = 0; i < 30; i++) S.draw(); const rain = S.buildItems(null, HK.state, S.season(), S.time);
        return { day: counts(day), night: counts(night), rain: counts(rain), evening, covered, vendorFree, reused, swayed, idlePlantRedraws, staticRebuilds };
      } finally { S.drawCityPlant = plant; Object.assign(S, saved); for (let i = 0; i < 30; i++) S.draw(); }
    });
    assert(cityFlair.day.details === 12 && cityFlair.day.actors === 6 && cityFlair.day.vendors === 6 && cityFlair.day.birds === 10 && cityFlair.day.plants > 20 && cityFlair.vendorFree, 'Stadtszenen fehlen oder stehen in Hindernissen: ' + JSON.stringify(cityFlair));
    assert(cityFlair.night.actors === 0 && cityFlair.night.vendors === 0 && cityFlair.night.birds === 0 && cityFlair.rain.actors === 0 && cityFlair.rain.vendors === 0 && cityFlair.rain.birds === 0 && cityFlair.covered && cityFlair.evening.join(',') === 'tavern-guest', 'Stadtalltag ignoriert Tageszeit und Wetter: ' + JSON.stringify(cityFlair));
    assert(cityFlair.reused && cityFlair.swayed && cityFlair.staticRebuilds === 0 && cityFlair.idlePlantRedraws === 0, 'Stadtdetails werden unnötig neu gezeichnet: ' + JSON.stringify(cityFlair));
    const trees = await page.evaluate(() => {
      const S = HK.Scene, P = HK.PixiScene;
      S.focusDistrict('all'); S.clock = .5; for (let i = 0; i < 30; i++) S.draw();
      const crowns = [...P.animiert].filter(([id]) => id.startsWith('tree-crown:'));
      const original = S.drawTreeCrown, contexts = crowns.map(([id, e]) => [id, e.g.context, e.g.rotation]);
      let redraws = 0; S.drawTreeCrown = function (...args) { redraws++; return original.apply(this, args); };
      try {
        for (let i = 0; i < 30; i++) { S.time += 1 / 60; S.draw(); }
        const reused = contexts.every(([id, c]) => P.animiert.get(id).g.context === c);
        const moved = contexts.some(([id, c, angle]) => Math.abs(P.animiert.get(id).g.rotation - angle) > 1e-5);
        const idleRedraws = redraws;
        S.clock = .95; for (let i = 0; i < 30; i++) S.draw();
        S.time += .5; S.draw();
        const masked = crowns.every(([id]) => { const g = P.animiert.get(id).g, mask = P.emMasken.get(g); return mask && mask.rotation === g.rotation && mask.context === g.context; });
        return { crowns: crowns.length, species: new Set(HK.TREES.map(tr => S.treeProfile(...tr).species)).size, reused, moved, idleRedraws, masked };
      } finally { S.drawTreeCrown = original; S.focusDistrict('harbour'); S.draw(); }
    });
    assert(trees.crowns > 20 && trees.species === 4 && trees.reused && trees.moved && trees.idleRedraws === 0 && trees.masked, 'Baumgrafik oder Animation fehlerhaft: ' + JSON.stringify(trees));
    const clipping = await page.evaluate(() => {
      const S = HK.Scene, P = HK.PixiScene, b = HK.BUILDING.saltstore;
      const build = S.buildItems, cam = S.cam, clock = S.clock, selected = S.selected, time = S.time;
      try {
        S.clock = .5; S.time = 1.3; S.selected = null; S.focusDistrict('all');
        const list = build.call(S, null, HK.state, S.season(), S.time);
        const core = list.find(it => it.c === 'b' + b.id), hoist = list.find(it => it.c === 'extra:' + b.id + ':hoist');
        const xx = b.x + b.w, yy = b.y + b.d / 2, x = xx + .35, y = yy - .25, q = HK.Iso.p(x, y, 0);
        const person = { s: 'clipping-probe', ap: q, k: S.pointKey(x, y), box: [x - .05, y - .05, x + .05, y + .05],
          f: c => S.drawPerson(c, ...q, '#374fad', 'static', 1, false, '#dcc3aa', 0, 1) };
        const sorted = S.depthSort([core, hoist, person]), anchor = HK.Iso.p(xx, yy, 0);
        // Probe am Kopf: die Fassadengrafik muss hinter der Figur liegen,
        // der auskragende Ladekorb davor. Zwei unabhängige Canvas-Bilder.
        const pixel = old => {
          const canvas = document.createElement('canvas'); canvas.width = canvas.height = 400;
          const c = canvas.getContext('2d'); c.translate(200, 330); c.scale(3, 3); c.translate(-anchor[0], -anchor[1]);
          if (old) { S.drawBuilding(c, b, HK.state, S.season(), S.shadowVec()); person.f(c); }
          else for (const it of sorted) it.f(c);
          return [...c.getImageData(Math.round(200 + (q[0] - anchor[0]) * 3), Math.round(330 + (q[1] - anchor[1] - 14.4) * 3), 1, 1).data];
        };
        const previous = pixel(true), current = pixel(false);
        S.buildItems = () => sorted;
        for (let i = 0; i < 24; i++) S.draw();
        const children = P.lg.objekte.children, wall = P.cache.get(core.c).g, basket = P.cache.get(hoist.c).g, figure = P.figuren.get('clipping-probe#0');
        const ordered = children.indexOf(wall) < children.indexOf(figure) && children.indexOf(figure) < children.indexOf(basket);
        return { ordered, previous, current, covered: previous[0] > 180 && current[0] < 180 && current[3] === 255 };
      } finally {
        S.buildItems = build; S.cam = cam; S.clock = clock; S.selected = selected; S.time = time;
        for (let i = 0; i < 24; i++) S.draw();
      }
    });
    assert(clipping.ordered && clipping.covered, 'Ladekorb verdeckt die Figur falsch: ' + JSON.stringify(clipping));
    const cartClipping = await page.evaluate(() => {
      const S = HK.Scene, P = HK.PixiScene, b = HK.BUILDING.saltstore;
      const build = S.buildItems, cam = S.cam, clock = S.clock, selected = S.selected;
      try {
        S.clock = .5; S.selected = null; S.focusDistrict('all');
        const core = build.call(S, null, HK.state, S.season(), S.time).find(it => it.c === 'b' + b.id);
        const vehicle = { head: Math.PI / 2, ox: false }, p = { wx: 9.5, wy: 3.15 }, parts = [];
        S.cartItems(parts, p, vehicle, 0);
        const sorted = S.depthSort([core, ...parts]);
        const legacy = { k: S.pointKey(p.wx, p.wy), box: [9, 2.65, 10, 3.65], f: c => S.drawCart(c, p.wx, p.wy, vehicle, 0) };
        const previousOrder = S.depthSort([core, legacy]), anchor = HK.Iso.p(p.wx, p.wy, 0), bed = HK.Iso.p(p.wx, p.wy, .3);
        const pixel = list => {
          const canvas = document.createElement('canvas'); canvas.width = canvas.height = 400;
          const c = canvas.getContext('2d'); c.translate(200, 330); c.scale(3, 3); c.translate(-anchor[0], -anchor[1]);
          for (const it of list) it.f(c);
          return [...c.getImageData(Math.round(200 + (bed[0] - anchor[0]) * 3), Math.round(330 + (bed[1] - anchor[1]) * 3), 1, 1).data];
        };
        const previous = pixel(previousOrder), current = pixel(sorted);
        S.buildItems = () => sorted;
        for (let i = 0; i < 24; i++) S.draw();
        const wall = P.cache.get(core.c).g, children = P.lg.objekte.children;
        const ordered = P.benutzt.length === 2 && P.benutzt.every(g => children.indexOf(g) > children.indexOf(wall));
        return { ordered, previous, current, uncovered: previous.some((v, i) => v !== current[i]) && current[3] === 255 };
      } finally {
        S.buildItems = build; S.cam = cam; S.clock = clock; S.selected = selected;
        for (let i = 0; i < 24; i++) S.draw();
      }
    });
    assert(cartClipping.ordered && cartClipping.uncovered, 'Wagen verschwindet hinter der Hauswand: ' + JSON.stringify(cartClipping));
    const wallGuards = await page.evaluate(() => {
      const S = HK.Scene, P = HK.PixiScene, saved = { guards: S.wallGuards, time: S.time, clock: S.clock, cam: S.cam };
      try {
        S.wallGuards = saved.guards.map(g => ({ ...g, wait: 100 })); S.clock = .5; S.focusDistrict('all');
        const ranges = S.wallSegments().filter(it => it.guardRange).map(it => it.guardRange);
        const guard = S.wallGuards.find(g => ranges.some(r => r.segment === g.p.seg && r.u1 > g.p.u0 + .15 && r.u1 < g.p.u1 - .15));
        const boundary = ranges.find(r => r.segment === guard.p.seg && r.u1 > guard.p.u0 + .15 && r.u1 < guard.p.u1 - .15).u1;
        guard.u = boundary - .04; guard.dir = 1; guard.wait = 0;
        for (let i = 0; i < 30; i++) S.draw();
        const walls = [...P.cache].filter(([id]) => /^w\d+:(rear|front)$/.test(id)).map(([id, e]) => [id, e.frame]);
        let previous = null, moved = 0, maxError = 0, layered = true, unique = true;
        const glyph = list => {
          const idx = list.findIndex(it => it.guard === guard), it = list[idx];
          const serial = list.slice(0, idx).filter(other => other.s === it.s).length;
          return { idx, it, g: P.figuren.get(it.s + '#' + serial) };
        };
        for (let i = 0; i < 120; i++) {
          S.updateWallGuards(1 / 60); S.time += 1 / 60; S.draw();
          const list = S.buildItems(null, HK.state, S.season(), S.time, S.cullRect()), { idx, it, g } = glyph(list);
          const q = S.wallGuardPos(guard), expected = HK.Iso.p(q.x, q.y, HK.WALL.h + .02);
          maxError = Math.max(maxError, Math.hypot(g.position.x - expected[0], g.position.y - expected[1]));
          if (previous && Math.hypot(g.position.x - previous[0], g.position.y - previous[1]) > 1e-7) moved++;
          previous = [g.position.x, g.position.y];
          unique &&= list.filter(other => other.guard === guard).length === 1;
          const rear = list[idx - 1], front = list[idx + 1], children = P.lg.objekte.children;
          layered &&= rear.wallPart === 'rear' && front.wallPart === 'front' &&
            children.indexOf(P.cache.get(rear.c).g) < children.indexOf(g) && children.indexOf(g) < children.indexOf(P.cache.get(front.c).g);
        }
        const crossed = guard.u > boundary;
        const rebuilt = walls.filter(([id, frame]) => P.cache.get(id).frame !== frame).length;
        guard.wait = 1; const stopped = guard.u;
        for (let i = 0; i < 10; i++) { S.updateWallGuards(1 / 60); S.time += 1 / 60; S.draw(); }
        return { frames: 120, moved, maxError, unique, layered, crossed, rebuilt, stopped: guard.u === stopped };
      } finally {
        S.wallGuards = saved.guards; S.time = saved.time; S.clock = saved.clock; S.cam = saved.cam;
        for (let i = 0; i < 24; i++) S.draw();
      }
    });
    assert(wallGuards.moved === 119 && wallGuards.maxError < 1e-6 && wallGuards.unique && wallGuards.layered && wallGuards.crossed && wallGuards.rebuilt === 0 && wallGuards.stopped,
      'Mauerwächter ruckeln oder verdecken die Brüstung: ' + JSON.stringify(wallGuards));
    await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(300);
    await page.locator('#city-links [data-place=market]').click();
    await page.evaluate(() => HK.Scene.draw());
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobilansicht läuft über');
    assert(await page.locator('.goods-grid').evaluate(el => el.scrollWidth <= el.clientWidth), 'Warenraster läuft auf Mobilgeräten über');
    await page.screenshot({ path: path.join(shots, 'features-mobile.png'), fullPage: true });
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ result: 'PASS', flow, nightPeople, lights, houseLights, cityFlair, trees, clipping, cartClipping, wallGuards, chapters: 3, priceDays: saved.priceHistory.length, saveClock: .63, languages: 2, screenshots: shots, errors }));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
