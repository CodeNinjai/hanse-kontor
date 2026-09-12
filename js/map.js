/* Karte (SVG) */
'use strict';

HK.Map = {
  svg: null, shipLayer: null, cityLayer: null, routeLayer: null, cityEls: {},

  init(svg) {
    this.svg = svg;
    const m = HK.MAP;
    svg.setAttribute('viewBox', `0 0 ${m.W} ${m.H}`);
    svg.innerHTML = '';
    const NS = 'http://www.w3.org/2000/svg';
    const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); (parent || svg).appendChild(e); return e; };
    // Meer
    el('rect', { x: 0, y: 0, width: m.W, height: m.H, class: 'sea' });
    // Wellen-Deko
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * m.W, y = Math.random() * m.H;
      el('path', { d: `M${x} ${y} q4 -3 8 0 t8 0`, class: 'wave' });
    }
    // Land
    for (const poly of HK.LAND) {
      const pts = poly.map(([lon, lat]) => { const p = HK.project(lon, lat); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ');
      el('polygon', { points: pts, class: 'land' });
    }
    // Seewege (dezent)
    this.routeLayer = el('g', { class: 'lanes' });
    for (const [a, b] of HK.EDGES) {
      const pa = HK.project(HK.NODES[a].lon, HK.NODES[a].lat), pb = HK.project(HK.NODES[b].lon, HK.NODES[b].lat);
      el('line', { x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y, class: 'lane' }, this.routeLayer);
    }
    this.pathLayer = el('g', { class: 'paths' });
    // Städte
    this.cityLayer = el('g', { class: 'cities' });
    this.cityEls = {};
    for (const c of HK.CITIES) {
      const p = HK.project(c.lon, c.lat);
      const g = el('g', { class: 'city', 'data-city': c.id, transform: `translate(${p.x.toFixed(1)},${p.y.toFixed(1)})` }, this.cityLayer);
      el('circle', { r: 11, class: 'city-halo' }, g);
      el('circle', { r: 5, class: 'city-dot' }, g);
      el('rect', { x: -6, y: -14, width: 12, height: 8, class: 'kontor-flag' }, g);
      const labelBelow = ['bremen', 'hamburg', 'koeln', 'bruegge', 'london', 'rostock', 'danzig', 'riga', 'novgorod', 'visby'].includes(c.id);
      const t = el('text', { x: 0, y: labelBelow ? 20 : -18, class: 'city-label' }, g);
      t.textContent = HK.cityName(c.id);
      el('text', { x: 0, y: labelBelow ? 31 : -29, class: 'city-event' }, g);
      g.addEventListener('click', () => HK.UI.selectCity(c.id));
      this.cityEls[c.id] = g;
    }
    this.shipLayer = el('g', { class: 'ships' });
    this.shipEls = {};
    this.el = el;
  },

  relabel() {
    for (const c of HK.CITIES) this.cityEls[c.id].querySelector('.city-label').textContent = HK.cityName(c.id);
  },

  update(state) {
    const NS = 'http://www.w3.org/2000/svg';
    // Städte: Kontor-Flagge, Auswahl, Ereignis
    for (const c of HK.CITIES) {
      const g = this.cityEls[c.id];
      g.classList.toggle('has-kontor', !!state.kontors[c.id]);
      g.classList.toggle('selected', HK.UI.selectedCity === c.id);
      g.classList.toggle('home', state.home === c.id);
      const ev = state.cities[c.id].events[0];
      g.querySelector('.city-event').textContent = ev ? HK.t('evn_' + ev.type) : '';
    }
    // Schiffe
    const seen = {};
    for (const s of state.ships) {
      seen[s.id] = true;
      let g = this.shipEls[s.id];
      if (!g) {
        g = document.createElementNS(NS, 'g');
        g.setAttribute('class', 'ship');
        g.innerHTML = '<path class="ship-hull" d="M-7,3 L7,3 L5,7 L-5,7 Z"/><path class="ship-sail" d="M0,3 L0,-8 L6,-2 Z"/><line class="ship-mast" x1="0" y1="3" x2="0" y2="-9"/>';
        g.addEventListener('click', (e) => { e.stopPropagation(); HK.UI.selectShip(s.id); });
        this.shipLayer.appendChild(g);
        this.shipEls[s.id] = g;
      }
      let lon = s.lon, lat = s.lat;
      if (s.city !== null) {
        // im Hafen: leicht versetzt neben der Stadt, gestaffelt
        const idx = state.ships.filter(x => x.city === s.city).indexOf(s);
        const p = HK.project(HK.CITY[s.city].lon, HK.CITY[s.city].lat);
        g.setAttribute('transform', `translate(${(p.x + 14 + idx * 9).toFixed(1)},${(p.y + 4).toFixed(1)}) scale(0.8)`);
      } else {
        const p = HK.project(lon, lat);
        g.setAttribute('transform', `translate(${p.x.toFixed(1)},${p.y.toFixed(1)})`);
      }
      g.classList.toggle('selected', HK.UI.selectedShip === s.id);
      g.classList.toggle('sailing', s.city === null);
    }
    for (const id in this.shipEls) if (!seen[id]) { this.shipEls[id].remove(); delete this.shipEls[id]; }
    // Pfad des gewählten Schiffs
    this.pathLayer.innerHTML = '';
    const sel = state.ships.find(x => x.id === HK.UI.selectedShip);
    if (sel && sel.path) {
      const pts = sel.path.map(id => { const p = HK.project(HK.NODES[id].lon, HK.NODES[id].lat); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ');
      const pl = document.createElementNS(NS, 'polyline');
      pl.setAttribute('points', pts); pl.setAttribute('class', 'ship-path');
      this.pathLayer.appendChild(pl);
    }
  },
};
