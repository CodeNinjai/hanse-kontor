/* Oberfläche */
'use strict';

HK.UI = {
  selectedCity: null, selectedShip: null, selectedKontor: null, tab: 'city', tradeShip: null,
  inputs: { qty: 10, qtyAll: false, loan: 1000 }, modalOpen: false, modalRender: null, unread: 0,

  esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); },
  $(id) { return document.getElementById(id); },

  init() {
    this.sidebar = this.$('sidebar');
    this.applyStaticTexts();
    document.querySelectorAll('#tabs button').forEach(b => b.addEventListener('click', () => this.setTab(b.dataset.tab)));
    this.$('btn-pause').addEventListener('click', () => HK.setSpeed(0));
    this.$('btn-s1').addEventListener('click', () => HK.setSpeed(1));
    this.$('btn-s2').addEventListener('click', () => HK.setSpeed(2));
    this.$('btn-s3').addEventListener('click', () => HK.setSpeed(3));
    this.$('btn-step').addEventListener('click', () => HK.stepDay());
    this.$('btn-save').addEventListener('click', () => HK.saveGame());
    this.$('btn-export').addEventListener('click', () => HK.exportGame());
    this.$('btn-import').addEventListener('click', () => this.$('file-import').click());
    this.$('file-import').addEventListener('change', (e) => { if (e.target.files[0]) HK.importGame(e.target.files[0]); e.target.value = ''; });
    this.$('btn-help').addEventListener('click', () => this.showHelp());
    this.$('btn-menu').addEventListener('click', () => { HK.setSpeed(0); this.showTitle(true); });
    document.querySelectorAll('.lang-btn').forEach(b => b.addEventListener('click', () => HK.setLang(b.dataset.lang)));
    // Delegation für Aktionen in der Seitenleiste
    this.sidebar.addEventListener('click', (e) => {
      const b = e.target.closest('[data-action]');
      if (b) { this.action(b.dataset); }
    });
    this.sidebar.addEventListener('input', (e) => {
      const el = e.target;
      if (el.dataset.field) { this.inputs[el.dataset.field] = el.type === 'checkbox' ? el.checked : el.value; if (el.dataset.field === 'qty') this.inputs.qtyAll = false; }
      if (el.dataset.manager) this.onManagerInput(el);
    });
    this.sidebar.addEventListener('change', (e) => {
      const el = e.target;
      if (el.dataset.manager) this.onManagerInput(el);
      if (el.dataset.field === 'tradeShip') { this.tradeShip = parseInt(el.value, 10); this.renderSidebar(); }
      if (el.dataset.field === 'dest') { this.inputs.dest = el.value; this.renderSidebar(); }
    });
    document.addEventListener('keydown', (e) => {
      if (this.modalOpen || !HK.state || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') { e.preventDefault(); HK.setSpeed(HK.state.speed ? 0 : 2); }
      if (e.key === '1') HK.setSpeed(1); if (e.key === '2') HK.setSpeed(2); if (e.key === '3') HK.setSpeed(3);
      if (e.key === 'n' || e.key === 'N') HK.stepDay();
    });
  },

  applyStaticTexts() {
    document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = HK.t(el.dataset.i18n));
    document.querySelectorAll('[data-i18n-title]').forEach(el => el.title = HK.t(el.dataset.i18nTitle));
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === HK.LANG));
    document.title = HK.t('title');
  },

  setTab(tab) {
    this.tab = tab;
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    if (tab === 'log') { this.unread = 0; }
    this.renderSidebar();
    this.renderTabs();
  },
  renderTabs() {
    const badge = this.$('log-badge');
    badge.textContent = this.unread > 0 ? this.unread : '';
    badge.hidden = this.unread === 0;
  },

  selectCity(id) { this.selectedCity = id; this.inputs.dest = undefined; this.setTab('city'); HK.Map.update(HK.state); },
  selectShip(id) {
    this.selectedShip = id;
    const s = HK.state.ships.find(x => x.id === id);
    if (s && s.city !== null) this.selectedCity = s.city;
    this.inputs.dest = undefined;
    this.setTab('ships'); HK.Map.update(HK.state);
  },

  showGame() { this.$('title-screen').hidden = true; this.$('game').hidden = false; },

  /* ---------- Titel / Neues Spiel ---------- */
  showTitle(hasSave) {
    const ts = this.$('title-screen');
    ts.hidden = false;
    const inGame = !!HK.state;
    const render = () => {
      const cities = HK.CITIES.filter(c => c.shipyard).map(c => `<option value="${c.id}" ${c.id === 'luebeck' ? 'selected' : ''}>${HK.cityName(c.id)}</option>`).join('');
      ts.innerHTML = `
      <div class="title-box">
        <h1>${HK.t('title')}</h1>
        <p class="subtitle">${HK.t('subtitle')}</p>
        <div class="lang-row">
          <button class="lang-btn ${HK.LANG === 'de' ? 'active' : ''}" data-lang="de">Deutsch</button>
          <button class="lang-btn ${HK.LANG === 'en' ? 'active' : ''}" data-lang="en">English</button>
        </div>
        ${inGame ? `<button class="big" id="t-resume">${HK.t('continuePlay')}</button>` : ''}
        ${hasSave && !inGame ? `<button class="big" id="t-continue">${HK.t('continueGame')}</button>` : ''}
        <form id="new-game-form" class="new-game">
          <label>${HK.t('playerName')}<input name="name" maxlength="30" value="${this.esc(HK.t('defaultName'))}"></label>
          <label>${HK.t('homeCity')}<select name="home">${cities}</select></label>
          <fieldset><legend>${HK.t('difficulty')}</legend>
            ${['easy', 'normal', 'hard'].map(d => `<label class="radio"><input type="radio" name="difficulty" value="${d}" ${d === 'normal' ? 'checked' : ''}> <b>${HK.t(d)}</b> <small>${HK.t('diffHint_' + d)}</small></label>`).join('')}
          </fieldset>
          <button type="submit" class="big primary">${HK.t('newGame')}</button>
        </form>
        ${hasSave && inGame ? `<button id="t-load" class="link">${HK.t('load')}</button>` : ''}
        <button id="t-help" class="link">${HK.t('help')}</button>
      </div>`;
      ts.querySelectorAll('.lang-btn').forEach(b => b.addEventListener('click', () => { HK.setLang(b.dataset.lang); render(); }));
      const resume = ts.querySelector('#t-resume'); if (resume) resume.addEventListener('click', () => { ts.hidden = true; });
      const cont = ts.querySelector('#t-continue'); if (cont) cont.addEventListener('click', () => HK.loadGame());
      const load = ts.querySelector('#t-load'); if (load) load.addEventListener('click', () => { if (confirm(HK.t('confirmNewGame'))) HK.loadGame(); });
      ts.querySelector('#t-help').addEventListener('click', () => this.showHelp());
      ts.querySelector('#new-game-form').addEventListener('submit', (e) => {
        e.preventDefault();
        if (inGame && !confirm(HK.t('confirmNewGame'))) return;
        const fd = new FormData(e.target);
        const st = HK.newGame({ name: fd.get('name').trim() || HK.t('defaultName'), home: fd.get('home'), difficulty: fd.get('difficulty') });
        HK.startWithState(st);
        HK.autosave();
        this.toast(HK.t('welcome', { city: HK.cityName(st.home), name: this.esc(st.playerName), ship: HK.name(HK.SHIP_TYPE[st.ships[0].type]) }), 'good', 8000);
      });
    };
    render();
    this.titleRender = render;
  },

  /* ---------- Modal ---------- */
  modal(html, opts) {
    const m = this.$('modal');
    m.hidden = false; this.modalOpen = true;
    m.innerHTML = `<div class="modal-box ${opts && opts.wide ? 'wide' : ''}">${html}</div>`;
    m.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => this.closeModal()));
    return m.querySelector('.modal-box');
  },
  closeModal() { this.$('modal').hidden = true; this.$('modal').innerHTML = ''; this.modalOpen = false; this.modalRender = null; HK.lastTick = performance.now(); },
  showHelp() {
    const render = () => this.modal(`<h2>${HK.t('helpTitle')}</h2><div class="help">${HK.t('helpText')}</div><div class="modal-actions"><button data-close class="primary">${HK.t('close')}</button></div>`);
    render(); this.modalRender = render;
  },
  showEnd(won) {
    HK.setSpeed(0);
    this.modal(`<h2>${won ? HK.t('won') : HK.t('gameOver')}</h2><p>${won ? '' : HK.t('bankrupt')}</p>
      <p>${HK.t('daysPlayed')}: ${HK.state.day} · ${HK.t('netWorth')}: ${HK.fmt(HK.netWorth(HK.state))} ${HK.t('mark')}</p>
      <div class="modal-actions">${won ? `<button data-close class="primary">${HK.t('continuePlay')}</button>` : ''}<button id="end-new" class="${won ? '' : 'primary'}">${HK.t('newGame')}</button></div>`)
      .querySelector('#end-new').addEventListener('click', () => { this.closeModal(); this.showTitle(false); });
  },

  toast(msg, kind, ms) {
    const c = this.$('toasts');
    const el = document.createElement('div');
    el.className = 'toast ' + (kind || 'info');
    el.innerHTML = msg;
    c.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, ms || 3500);
    while (c.children.length > 5) c.firstChild.remove();
  },
  onLog(entry) {
    if (!HK.state || HK.state.day === 0) return;
    if (this.tab !== 'log') { this.unread++; this.renderTabs(); }
    if (['bad', 'good', 'event', 'arrival'].includes(entry.kind)) this.toast(this.logText(entry), entry.kind === 'arrival' ? 'info' : entry.kind);
  },
  logText(e) {
    const vars = Object.assign({}, e.vars);
    if (vars.city && HK.CITY[vars.city]) vars.city = HK.cityName(vars.city);
    if (vars.ship) vars.ship = this.esc(vars.ship);
    if (vars.name) vars.name = this.esc(vars.name);
    return HK.t(e.key, vars);
  },

  /* ---------- Rendering ---------- */
  renderAll() { this.renderHeader(); HK.Map.update(HK.state); this.renderSidebar(); },

  renderHeader() {
    const st = HK.state; if (!st) return;
    this.$('hud-date').textContent = HK.fmtDate(st.day);
    this.$('hud-money').textContent = HK.fmt(st.money) + ' ' + HK.t('mark');
    this.$('hud-money').classList.toggle('neg', st.money < 0);
    this.$('hud-rank').textContent = this.esc(st.playerName) + ' · ' + HK.name(HK.RANKS[st.rank]);
    ['btn-pause', 'btn-s1', 'btn-s2', 'btn-s3'].forEach((id, i) => this.$(id).classList.toggle('active', st.speed === i));
  },

  renderSidebar() {
    if (!HK.state) return;
    const active = document.activeElement;
    const focusId = active && this.sidebar.contains(active) ? active.id : null;
    const sel = focusId && active.selectionStart != null ? [active.selectionStart, active.selectionEnd] : null;
    let html = '';
    switch (this.tab) {
      case 'city': html = this.renderCity(); break;
      case 'ships': html = this.renderShips(); break;
      case 'kontors': html = this.renderKontors(); break;
      case 'bank': html = this.renderBank(); break;
      case 'log': html = this.renderLog(); break;
      case 'stats': html = this.renderStats(); break;
    }
    const scroll = this.sidebar.scrollTop;
    this.sidebar.innerHTML = html;
    this.sidebar.scrollTop = scroll;
    if (this.tab === 'stats') this.drawChart();
    if (focusId) { const el = this.$(focusId); if (el) { el.focus(); if (sel && el.setSelectionRange) try { el.setSelectionRange(sel[0], sel[1]); } catch (e) { /* */ } } }
  },

  demandBadge(state, cid, g) {
    const l = HK.demandLabel(state, cid, g);
    return `<span class="demand ${l}">${HK.t(l)}</span>`;
  },

  dockedShips(cid) { return HK.state.ships.filter(s => s.city === cid); },
  currentTradeShip(cid) {
    const docked = this.dockedShips(cid);
    let ship = docked.find(s => s.id === this.tradeShip);
    if (!ship) ship = docked.find(s => s.id === this.selectedShip) || docked[0] || null;
    if (ship) this.tradeShip = ship.id;
    return ship;
  },

  renderCity() {
    const st = HK.state, cid = this.selectedCity;
    if (!cid) return `<p class="hint">${HK.t('selectCity')}</p>`;
    const def = HK.CITY[cid], city = st.cities[cid], k = st.kontors[cid];
    const docked = this.dockedShips(cid);
    const ship = this.currentTradeShip(cid);
    const ev = city.events.map(e => `<span class="event-tag">${HK.t('evn_' + e.type)} · ${HK.t('lastsDays', { days: e.daysLeft })}</span>`).join(' ');
    let h = `<div class="panel-head"><h2>${HK.cityName(cid)} ${st.home === cid ? '<span class="home-tag">' + HK.t('homeCityLabel') + '</span>' : ''}</h2>
      <div class="meta">${HK.t('population')}: ${HK.fmt(def.pop * 1000)} · ${HK.t('reputation')}: <b>${Math.round(city.rep)}</b> ${def.shipyard ? '· ⚓ ' + HK.t('shipyard') : ''}</div>
      ${ev ? `<div class="events">${ev}</div>` : ''}</div>`;

    // Schiffsauswahl
    h += `<section><h3>${HK.t('shipsHere')}</h3>`;
    if (docked.length === 0) h += `<p class="hint">${HK.t('noShipHere')}</p>`;
    else h += `<label class="inline">${HK.t('selectShip')} <select data-field="tradeShip">${docked.map(s => `<option value="${s.id}" ${ship && s.id === ship.id ? 'selected' : ''}>${this.esc(s.name)} (${HK.name(HK.SHIP_TYPE[s.type])}, ${HK.cargoUsed(s)}/${HK.cargoCap(s)})</option>`).join('')}</select></label>`;
    h += `</section>`;

    // Markt
    const q = this.inputs.qtyAll ? 'all' : Math.max(1, parseInt(this.inputs.qty, 10) || 1);
    h += `<section><h3>${HK.t('market')}</h3>
      <div class="qty-row"><span>${HK.t('qty')}:</span><input id="qty-input" type="number" min="1" data-field="qty" value="${this.esc(this.inputs.qty)}" ${this.inputs.qtyAll ? 'disabled' : ''}>
      ${[1, 10, 50].map(n => `<button class="small ${!this.inputs.qtyAll && q === n ? 'active' : ''}" data-action="qty" data-n="${n}">${n}</button>`).join('')}
      <button class="small ${this.inputs.qtyAll ? 'active' : ''}" data-action="qtyall">${HK.t('max')}</button></div>
      <table class="market"><thead><tr><th>${HK.t('good')}</th><th>${HK.t('stock')}</th><th>${HK.t('trend')}</th><th>${HK.t('buyPrice')}</th><th>${HK.t('sellPrice')}</th>${ship ? `<th>${HK.t('ship')}</th>` : ''}${k ? `<th>${HK.t('kontor')}</th>` : ''}<th></th></tr></thead><tbody>`;
    for (const g of HK.GOODS) {
      const id = g.id;
      const bp = HK.buyPrice(st, cid, id, 1), sp = HK.sellPrice(st, cid, id, 1);
      const inShip = ship ? (ship.cargo[id] || 0) : 0, inK = k ? (k.storage[id] || 0) : 0;
      h += `<tr><td class="gname">${HK.goodName(id)}</td><td class="num">${Math.floor(city.stock[id] || 0)}</td><td>${this.demandBadge(st, cid, id)}</td><td class="num">${bp}</td><td class="num">${sp}</td>`;
      if (ship) h += `<td class="num">${inShip || ''}</td>`;
      if (k) h += `<td class="num">${Math.floor(inK) || ''}</td>`;
      h += `<td class="acts">`;
      if (ship) {
        h += `<button class="small" data-action="buy" data-good="${id}" title="${HK.t('buy')}">${HK.t('buy')}</button><button class="small" data-action="sell" data-good="${id}" ${inShip ? '' : 'disabled'}>${HK.t('sell')}</button>`;
        if (k) h += `<button class="small alt" data-action="tokontor" data-good="${id}" ${inShip ? '' : 'disabled'} title="${HK.t('toKontor')}">⇩</button><button class="small alt" data-action="toship" data-good="${id}" ${inK ? '' : 'disabled'} title="${HK.t('toShip')}">⇧</button>`;
      }
      h += `</td></tr>`;
    }
    h += `</tbody></table></section>`;

    // Kontor
    h += `<section><h3>${HK.t('kontor')}</h3>`;
    if (!k) {
      const okRep = city.rep >= HK.CONST.KONTOR_MIN_REP;
      h += `<p>${okRep ? '' : '<span class="hint">' + HK.t('kontorNeedsRep', { rep: HK.CONST.KONTOR_MIN_REP }) + '</span><br>'}
        <button data-action="buildkontor" ${okRep && st.money >= HK.CONST.KONTOR_COST ? '' : 'disabled'}>${HK.t('buildKontor', { cost: HK.fmt(HK.CONST.KONTOR_COST) })}</button></p>`;
    } else {
      h += `<p>${HK.t('storageCap')}: <b>${HK.t('capacityHint', { used: Math.floor(HK.storageUsed(k)), cap: k.capacity })}</b> · ${HK.t('buildings')}: ${k.buildings.length}/${HK.CONST.MAX_BUILDINGS}
        <button class="small" data-action="gotokontor">${HK.t('manager')} &amp; ${HK.t('buildings')} →</button></p>`;
    }
    h += `</section>`;

    // Spenden
    h += `<section><h3>${HK.t('donate')}</h3><div class="btn-row">
      <button class="small" data-action="donate" data-kind="church" ${st.money >= HK.donationCost(st, cid, 'church') ? '' : 'disabled'}>${HK.t('donateChurch', { cost: HK.fmt(HK.donationCost(st, cid, 'church')) })}</button>
      <button class="small" data-action="donate" data-kind="poor" ${st.money >= HK.donationCost(st, cid, 'poor') ? '' : 'disabled'}>${HK.t('donatePoor', { cost: HK.fmt(HK.donationCost(st, cid, 'poor')) })}</button></div></section>`;

    // Werft
    if (def.shipyard) {
      h += `<section><h3>${HK.t('shipyard')}</h3>`;
      if (ship) {
        const rc = HK.repairCost(ship);
        h += `<p><b>${this.esc(ship.name)}</b> · ${HK.t('hull')}: ${ship.hull} % · ${HK.t('weapons')}: ${HK.t('weaponsLevel', { lvl: ship.weapons })}</p><div class="btn-row">
          <button class="small" data-action="repair" ${rc > 0 && st.money >= rc ? '' : 'disabled'}>${HK.t('repairCost', { cost: HK.fmt(rc) })}</button>
          <button class="small" data-action="arm" ${ship.weapons < HK.CONST.MAX_WEAPONS && st.money >= HK.CONST.WEAPON_COST ? '' : 'disabled'}>${HK.t('buyWeapons', { cost: HK.fmt(HK.CONST.WEAPON_COST) })}</button></div>`;
      }
      h += `<h4>${HK.t('buildShip')}</h4><table class="plain">`;
      for (const t of HK.SHIP_TYPES) {
        h += `<tr><td><b>${HK.name(t)}</b><br><small>${HK.t('shipTypeInfo', { capacity: t.capacity, speed: t.speed, crew: t.crew })}</small></td><td class="num">${HK.fmt(t.price)} ${HK.t('mark')}</td><td><button class="small" data-action="buildship" data-type="${t.id}" ${st.money >= t.price ? '' : 'disabled'}>${HK.t('build')}</button></td></tr>`;
      }
      h += `</table></section>`;
    }
    return h;
  },

  renderShips() {
    const st = HK.state;
    if (st.ships.length === 0) return `<p class="hint">${HK.t('noShips')}</p>`;
    let ship = st.ships.find(s => s.id === this.selectedShip);
    if (!ship) { ship = st.ships[0]; this.selectedShip = ship.id; }
    let h = `<section><h2>${HK.t('ships')}</h2><div class="ship-list">`;
    for (const s of st.ships) {
      const t = HK.SHIP_TYPE[s.type];
      const where = s.city !== null ? HK.t('docked', { city: HK.cityName(s.city) }) : HK.t('atSea', { city: HK.cityName(s.dest) });
      h += `<div class="ship-card ${s.id === ship.id ? 'selected' : ''}" data-action="selectship" data-id="${s.id}">
        <div class="ship-card-head"><b>${this.esc(s.name)}</b> <small>${HK.name(t)}</small>${s.routeActive ? ' <span class="tag">' + HK.t('routeActive') + '</span>' : ''}</div>
        <div class="ship-card-meta">${where} · ${HK.t('cargo')} ${HK.cargoUsed(s)}/${t.capacity} · ${HK.t('hull')} ${s.hull} %</div></div>`;
    }
    h += `</div></section>`;
    const t = HK.SHIP_TYPE[ship.type];
    h += `<section class="panel-head"><h2>${this.esc(ship.name)} <small>${HK.name(t)}</small></h2>
      <div class="meta">${HK.t('hull')}: ${ship.hull} % · ${HK.t('crew')}: ${t.crew} · ${HK.t('weapons')}: ${HK.t('weaponsLevel', { lvl: ship.weapons })} · ${HK.t('speed')}: ${Math.round(HK.shipSpeed(ship))} km/${HK.t('day')} · ${HK.t('value')}: ${HK.fmt(HK.shipValue(ship))} ${HK.t('mark')}</div>`;
    if (ship.city === null) {
      const remaining = HK.pathDistance(ship.path) - ship.travelled;
      h += `<p><b>${HK.t('atSea', { city: HK.cityName(ship.dest) })}</b> · ${HK.t('arrivesIn', { days: Math.max(1, Math.ceil(remaining / HK.shipSpeed(ship))) })}</p>`;
    } else h += `<p><b>${HK.t('docked', { city: HK.cityName(ship.city) })}</b></p>`;
    h += `</section>`;
    // Ladung
    h += `<section><h3>${HK.t('cargo')} (${HK.cargoUsed(ship)}/${t.capacity} ${HK.t('unitLast')})</h3>`;
    const cargo = Object.keys(ship.cargo);
    if (cargo.length === 0) h += `<p class="hint">–</p>`;
    else h += `<table class="plain">${cargo.map(g => `<tr><td>${HK.goodName(g)}</td><td class="num">${ship.cargo[g]} ${HK.t('unitLast')}</td><td class="num"><small>${HK.fmt(ship.cargo[g] * HK.GOOD[g].base)} ${HK.t('mark')}</small></td></tr>`).join('')}</table>`;
    h += `</section>`;
    // Navigation
    if (ship.city !== null) {
      const dest = this.inputs.dest && this.inputs.dest !== ship.city ? this.inputs.dest : HK.CITIES.find(c => c.id !== ship.city).id;
      const days = HK.travelDays(ship, ship.city, dest);
      h += `<section><h3>${HK.t('sailTo')}</h3><div class="btn-row">
        <select data-field="dest">${HK.CITIES.filter(c => c.id !== ship.city).map(c => `<option value="${c.id}" ${c.id === dest ? 'selected' : ''}>${HK.cityName(c.id)} (${HK.t('travelDays', { days: HK.travelDays(ship, ship.city, c.id) })})</option>`).join('')}</select>
        <button class="primary" data-action="sail" data-dest="${dest}">${HK.t('depart')} · ${HK.t('travelDays', { days })}</button></div>
        <div class="btn-row"><button class="small" data-action="gotocity" data-city="${ship.city}">${HK.t('market')} ${HK.cityName(ship.city)} →</button>
        <button class="small" data-action="rename">${HK.t('rename')}</button>
        <button class="small danger" data-action="sellship">${HK.t('sellShip', { price: HK.fmt(HK.shipValue(ship)) })}</button></div></section>`;
    }
    // Route
    h += `<section><h3>${HK.t('route')}</h3>`;
    if (ship.route && ship.route.stops.length) {
      h += `<p>${ship.route.stops.map((s, i) => `<span class="tag ${ship.routeActive && i === ship.routeIdx ? 'active' : ''}">${HK.cityName(s.city)}</span>`).join(' → ')}</p>`;
    } else h += `<p class="hint">${HK.t('routeNone')}</p>`;
    h += `<div class="btn-row"><button class="small" data-action="editroute">${HK.t('routeEdit')}</button>`;
    if (ship.routeActive) h += `<button class="small" data-action="stoproute">${HK.t('routeStop')}</button>`;
    else h += `<button class="small primary" data-action="startroute" ${ship.route && ship.route.stops.length >= 2 ? '' : 'disabled'}>${HK.t('routeStart')}</button>`;
    h += `</div></section>`;
    return h;
  },

  renderKontors() {
    const st = HK.state;
    const ids = Object.keys(st.kontors);
    if (!ids.includes(this.selectedKontor)) this.selectedKontor = ids.includes(this.selectedCity) ? this.selectedCity : ids[0];
    const cid = this.selectedKontor, k = st.kontors[cid];
    let h = `<section><h2>${HK.t('kontorCount')}</h2><div class="btn-row wrap">${ids.map(id => `<button class="small ${id === cid ? 'active' : ''}" data-action="selectkontor" data-id="${id}">${HK.cityName(id)}</button>`).join('')}</div></section>`;
    if (!k) return h;
    h += `<section><h3>${HK.cityName(cid)} · ${HK.t('storage')} ${HK.t('capacityHint', { used: Math.floor(HK.storageUsed(k)), cap: k.capacity })}</h3>
      <p><button class="small" data-action="expandkontor" ${st.money >= HK.CONST.KONTOR_EXPAND_COST ? '' : 'disabled'}>${HK.t('expandStorage', { qty: 500, cost: HK.fmt(HK.CONST.KONTOR_EXPAND_COST) })}</button>
      <button class="small" data-action="gotocity" data-city="${cid}">${HK.t('market')} →</button></p>
      <p class="hint">${HK.t('managerHint', { qty: HK.CONST.MANAGER_QTY_DEFAULT })}</p>
      <table class="market"><thead><tr><th>${HK.t('good')}</th><th>${HK.t('storage')}</th><th>${HK.t('buyPrice')}</th><th>${HK.t('sellPrice')}</th><th>${HK.t('manager')}</th><th>${HK.t('limit')}</th><th>${HK.t('perDay')}</th></tr></thead><tbody>`;
    for (const g of HK.GOODS) {
      const m = k.manager[g.id] || { mode: 'none', price: '', qty: HK.CONST.MANAGER_QTY_DEFAULT };
      h += `<tr><td class="gname">${HK.goodName(g.id)}</td><td class="num">${Math.floor(k.storage[g.id] || 0) || ''}</td><td class="num">${HK.buyPrice(st, cid, g.id, 1)}</td><td class="num">${HK.sellPrice(st, cid, g.id, 1)}</td>
        <td><select data-manager="mode" data-good="${g.id}" id="mgr-mode-${g.id}"><option value="none" ${m.mode === 'none' ? 'selected' : ''}>${HK.t('modeNone')}</option><option value="buy" ${m.mode === 'buy' ? 'selected' : ''}>${HK.t('modeBuy')}</option><option value="sell" ${m.mode === 'sell' ? 'selected' : ''}>${HK.t('modeSell')}</option></select></td>
        <td><input type="number" min="0" class="tiny" data-manager="price" data-good="${g.id}" id="mgr-price-${g.id}" value="${m.price}" ${m.mode === 'none' ? 'disabled' : ''}></td>
        <td><input type="number" min="1" class="tiny" data-manager="qty" data-good="${g.id}" id="mgr-qty-${g.id}" value="${m.qty}" ${m.mode === 'none' ? 'disabled' : ''}></td></tr>`;
    }
    h += `</tbody></table></section>`;
    // Betriebe
    h += `<section><h3>${HK.t('buildings')} (${k.buildings.length}/${HK.CONST.MAX_BUILDINGS})</h3>`;
    if (k.buildings.length) {
      h += `<table class="plain">${k.buildings.map(b => { const d = HK.BUILDING[b.type]; return `<tr><td><b>${HK.name(d)}</b>${b.idle ? ' <span class="demand shortage">' + HK.t('noInput') + '</span>' : ''}<br><small>${HK.t('produces', { qty: d.qty, good: HK.goodName(d.out) })}${d.inp ? ', ' + HK.t('consumes', { qty: d.inQty, good: HK.goodName(d.inp) }) : ''}</small></td><td><button class="small danger" data-action="demolish" data-id="${b.id}">${HK.t('demolish')}</button></td></tr>`; }).join('')}</table>`;
    }
    const options = HK.BUILDINGS.filter(b => HK.canBuildHere(b, cid));
    if (options.length === 0) h += `<p class="hint">${HK.t('noBuildingsHere')}</p>`;
    else if (k.buildings.length < HK.CONST.MAX_BUILDINGS) {
      h += `<h4>${HK.t('build')}</h4><table class="plain">${options.map(d => `<tr><td><b>${HK.name(d)}</b><br><small>${HK.t('produces', { qty: d.qty, good: HK.goodName(d.out) })}${d.inp ? ', ' + HK.t('consumes', { qty: d.inQty, good: HK.goodName(d.inp) }) : ''}<br>${HK.t('buildingCost', { cost: HK.fmt(d.cost), upkeep: d.upkeep })}</small></td><td><button class="small" data-action="build" data-type="${d.id}" ${st.money >= d.cost ? '' : 'disabled'}>${HK.t('build')}</button></td></tr>`).join('')}</table>`;
    } else h += `<p class="hint">${HK.t('maxBuildings', { n: HK.CONST.MAX_BUILDINGS })}</p>`;
    h += `</section>`;
    return h;
  },

  onManagerInput(el) {
    const cid = this.selectedKontor, k = HK.state.kontors[cid];
    if (!k) return;
    const g = el.dataset.good;
    const cur = k.manager[g] || { mode: 'none', price: 0, qty: HK.CONST.MANAGER_QTY_DEFAULT };
    const mode = el.dataset.manager === 'mode' ? el.value : cur.mode;
    const price = el.dataset.manager === 'price' ? parseInt(el.value, 10) : cur.price;
    const qty = el.dataset.manager === 'qty' ? parseInt(el.value, 10) : cur.qty;
    // Sinnvoller Vorschlag beim Umschalten des Modus
    let p = price;
    if (el.dataset.manager === 'mode' && mode !== 'none' && !(cur.price > 0)) p = mode === 'buy' ? Math.round(HK.GOOD[g].base * 0.7) : Math.round(HK.GOOD[g].base * 1.3);
    HK.setManager(HK.state, cid, g, mode, p, qty);
    if (el.dataset.manager === 'mode') this.renderSidebar();
  },

  renderBank() {
    const st = HK.state, c = HK.dailyCosts(st), limit = HK.loanLimit(st);
    const amt = Math.max(0, parseInt(this.inputs.loan, 10) || 0);
    let h = `<section><h2>${HK.t('bank')}</h2>
      <table class="plain"><tr><td>${HK.t('money')}</td><td class="num">${HK.fmt(st.money)} ${HK.t('mark')}</td></tr>
      <tr><td>${HK.t('loan')}</td><td class="num">${HK.fmt(st.loan)} ${HK.t('mark')}</td></tr>
      <tr><td>${HK.t('loanLimit')}</td><td class="num">${HK.fmt(limit)} ${HK.t('mark')}</td></tr>
      <tr><td>${HK.t('netWorth')}</td><td class="num"><b>${HK.fmt(HK.netWorth(st))} ${HK.t('mark')}</b></td></tr></table>
      <p class="hint">${HK.t('interest', { pct: (HK.CONST.LOAN_INTEREST_DAILY * 365 * 100).toFixed(1) })}</p>
      <div class="btn-row"><input id="loan-input" type="number" min="0" step="500" data-field="loan" value="${this.esc(this.inputs.loan)}">
      <button class="small" data-action="takeloan" ${amt > 0 && amt <= limit ? '' : 'disabled'}>${HK.t('takeLoan')}</button>
      <button class="small" data-action="repayloan" ${amt > 0 && st.loan > 0 && st.money > 0 ? '' : 'disabled'}>${HK.t('repayLoan')}</button></div></section>`;
    h += `<section><h3>${HK.t('dailyCost')}</h3><table class="plain"><tr><td>${HK.t('wages')}</td><td class="num">${c.wages}</td></tr><tr><td>${HK.t('upkeep')}</td><td class="num">${c.upkeep}</td></tr><tr><td>${HK.t('interestCost')}</td><td class="num">${c.interest}</td></tr><tr><td><b>Σ</b></td><td class="num"><b>${c.wages + c.upkeep + c.interest} ${HK.t('mark')}/${HK.t('day')}</b></td></tr></table></section>`;
    // Rat
    const next = HK.RANKS[st.rank + 1];
    h += `<section><h3>${HK.t('council')}</h3><p>${HK.t('rank')}: <b>${HK.name(HK.RANKS[st.rank])}</b></p>`;
    if (next) {
      const worth = HK.netWorth(st), rep = st.cities[st.home].rep, kn = Object.keys(st.kontors).length;
      const row = (label, cur, req, fmt) => `<tr><td>${label}</td><td class="num">${fmt(cur)} / ${fmt(req)}</td><td>${cur >= req ? '✔' : '✘'}</td></tr>`;
      h += `<h4>${HK.t('rankReq', { rank: HK.name(next) })}</h4><table class="plain">
        ${row(HK.t('netWorth'), worth, next.worth, HK.fmt)}
        ${row(HK.t('reqRep', { city: HK.cityName(st.home) }), Math.floor(rep), next.rep, x => x)}
        ${row(HK.t('reqKontors'), kn, next.kontors, x => x)}</table>`;
    }
    h += `</section>`;
    return h;
  },

  renderLog() {
    const st = HK.state;
    if (!st.log.length) return `<p class="hint">${HK.t('noLog')}</p>`;
    return `<section><h2>${HK.t('log')}</h2><ul class="log">${st.log.map(e => `<li class="${e.kind}"><small>${HK.fmtDate(e.day)}</small> ${this.logText(e)}</li>`).join('')}</ul></section>`;
  },

  renderStats() {
    const st = HK.state;
    return `<section><h2>${HK.t('tabStats')}</h2><table class="plain">
      <tr><td>${HK.t('daysPlayed')}</td><td class="num">${st.day}</td></tr>
      <tr><td>${HK.t('netWorth')}</td><td class="num">${HK.fmt(HK.netWorth(st))} ${HK.t('mark')}</td></tr>
      <tr><td>${HK.t('profitTotal')}</td><td class="num">${HK.fmt(st.stats.profit)} ${HK.t('mark')}</td></tr>
      <tr><td>${HK.t('tradeVolume')}</td><td class="num">${HK.fmt(st.stats.volume)} ${HK.t('mark')}</td></tr>
      <tr><td>${HK.t('shipCount')}</td><td class="num">${st.ships.length}</td></tr>
      <tr><td>${HK.t('kontorCount')}</td><td class="num">${Object.keys(st.kontors).length}</td></tr></table></section>
      <section><h3>${HK.t('chart')}</h3><canvas id="chart" width="480" height="220"></canvas></section>`;
  },
  drawChart() {
    const cv = this.$('chart'); if (!cv) return;
    const ctx = cv.getContext('2d'), h = HK.state.history, W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    if (h.length < 2) return;
    let min = Math.min(...h.map(p => p.worth)), max = Math.max(...h.map(p => p.worth));
    if (max === min) max = min + 1;
    min = Math.min(min, 0);
    const x = i => 40 + (W - 50) * i / (h.length - 1), y = v => H - 20 - (H - 30) * (v - min) / (max - min);
    ctx.strokeStyle = '#8a6d3b'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(40, 10); ctx.lineTo(40, H - 20); ctx.lineTo(W - 10, H - 20); ctx.stroke();
    ctx.fillStyle = '#5a4a2a'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(HK.fmt(max), 38, 14); ctx.fillText(HK.fmt(min), 38, H - 20);
    if (min < 0) { ctx.strokeStyle = '#b55'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(40, y(0)); ctx.lineTo(W - 10, y(0)); ctx.stroke(); ctx.setLineDash([]); }
    ctx.strokeStyle = '#1f5f8b'; ctx.lineWidth = 2; ctx.beginPath();
    h.forEach((p, i) => i ? ctx.lineTo(x(i), y(p.worth)) : ctx.moveTo(x(i), y(p.worth)));
    ctx.stroke();
    ctx.textAlign = 'left'; ctx.fillText(HK.t('day') + ' ' + h[0].day, 42, H - 6); ctx.textAlign = 'right'; ctx.fillText(HK.t('day') + ' ' + h[h.length - 1].day, W - 10, H - 6);
  },

  /* ---------- Aktionen ---------- */
  result(r, okMsg) {
    if (!r.ok) { if (r.msg) this.toast(HK.t(r.msg), 'bad'); return false; }
    if (okMsg) this.toast(okMsg, 'good', 2000);
    return true;
  },
  tradeQty(ship, good, kind) {
    const st = HK.state, cid = ship.city;
    if (!this.inputs.qtyAll) return Math.max(1, parseInt(this.inputs.qty, 10) || 1);
    const free = HK.cargoCap(ship) - HK.cargoUsed(ship), k = st.kontors[cid];
    if (kind === 'buy') {
      let q = Math.min(free, Math.floor(st.cities[cid].stock[good] || 0));
      while (q > 0 && HK.buyPrice(st, cid, good, q) * q > st.money) q--;
      return q;
    }
    if (kind === 'sell') return ship.cargo[good] || 0;
    if (kind === 'tokontor') return Math.min(ship.cargo[good] || 0, k ? k.capacity - HK.storageUsed(k) : 0);
    if (kind === 'toship') return Math.min(free, k ? Math.floor(k.storage[good] || 0) : 0);
    return 0;
  },
  action(d) {
    const st = HK.state, a = d.action;
    const ship = st.ships.find(s => s.id === (this.tab === 'city' ? this.tradeShip : this.selectedShip));
    const cid = this.selectedCity;
    switch (a) {
      case 'qty': this.inputs.qty = parseInt(d.n, 10); this.inputs.qtyAll = false; break;
      case 'qtyall': this.inputs.qtyAll = !this.inputs.qtyAll; break;
      case 'buy': case 'sell': case 'tokontor': case 'toship': {
        if (!ship || ship.city !== cid) return;
        const q = this.tradeQty(ship, d.good, a);
        if (q <= 0) return;
        let r;
        if (a === 'buy') { r = HK.buy(st, ship, d.good, q); if (r.ok) this.toast(HK.t('bought', { qty: q, good: HK.goodName(d.good), cost: HK.fmt(r.cost) }), 'good', 1800); }
        else if (a === 'sell') { r = HK.sell(st, ship, d.good, q); if (r.ok) this.toast(HK.t('sold', { qty: q, good: HK.goodName(d.good), cost: HK.fmt(r.cost) }), 'good', 1800); }
        else r = HK.transfer(st, ship, d.good, q, a === 'tokontor');
        this.result(r);
        break;
      }
      case 'buildkontor': this.result(HK.buildKontor(st, cid)); break;
      case 'gotokontor': this.selectedKontor = cid; this.setTab('kontors'); return;
      case 'gotocity': this.selectCity(d.city); return;
      case 'donate': if (this.result(HK.donate(st, cid, d.kind))) this.toast(HK.t('donated', { city: HK.cityName(cid) }), 'good', 2000); break;
      case 'repair': if (ship) this.result(HK.repairShip(st, ship)); break;
      case 'arm': if (ship) this.result(HK.buyWeapons(st, ship)); break;
      case 'buildship': this.result(HK.buildShip(st, cid, d.type)); break;
      case 'selectship': this.selectedShip = parseInt(d.id, 10); this.inputs.dest = undefined; break;
      case 'sail': if (ship) { const r = HK.sailTo(st, ship, d.dest); this.result(r); } break;
      case 'rename': if (ship) { const n = prompt(HK.t('newShipName'), ship.name); if (n && n.trim()) ship.name = n.trim().slice(0, 30); } break;
      case 'sellship': if (ship && confirm(HK.t('confirmSellShip', { ship: ship.name }))) { HK.sellShip(st, ship); this.selectedShip = st.ships.length ? st.ships[0].id : null; } break;
      case 'editroute': if (ship) { this.routeEditor(ship); return; } break;
      case 'startroute': if (ship) this.result(HK.startRoute(st, ship)); break;
      case 'stoproute': if (ship) HK.stopRoute(st, ship); break;
      case 'selectkontor': this.selectedKontor = d.id; break;
      case 'expandkontor': this.result(HK.expandKontor(st, this.selectedKontor)); break;
      case 'build': this.result(HK.buildBuilding(st, this.selectedKontor, d.type)); break;
      case 'demolish': if (confirm(HK.t('confirmDemolish'))) HK.demolish(st, this.selectedKontor, parseInt(d.id, 10)); break;
      case 'takeloan': this.result(HK.takeLoan(st, parseInt(this.inputs.loan, 10))); break;
      case 'repayloan': this.result(HK.repayLoan(st, parseInt(this.inputs.loan, 10))); break;
    }
    this.renderAll();
  },

  /* ---------- Routen-Editor ---------- */
  routeEditor(ship) {
    HK.setSpeed(0);
    const route = ship.route ? JSON.parse(JSON.stringify(ship.route)) : { stops: [] };
    if (!route.stops.length && ship.city !== null) route.stops.push({ city: ship.city, orders: {} });
    const render = () => {
      const st = HK.state;
      const cityOpts = (sel) => HK.CITIES.map(c => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${HK.cityName(c.id)}</option>`).join('');
      let h = `<h2>${HK.t('routeEdit')} – ${this.esc(ship.name)}</h2><p class="hint">${HK.t('routeHint')}</p><div class="stops">`;
      route.stops.forEach((stop, i) => {
        const k = st.kontors[stop.city];
        h += `<div class="stop"><div class="stop-head"><b>${i + 1}. ${HK.t('stop')}</b> <select data-stop="${i}" class="stop-city">${cityOpts(stop.city)}</select>
          <button class="small danger" data-remove="${i}">${HK.t('removeStop')}</button></div>
          <table class="orders"><thead><tr><th>${HK.t('good')}</th><th>${HK.t('orders')}</th><th>${HK.t('limit')}</th><th>${HK.t('qty')}</th></tr></thead><tbody>`;
        for (const g of HK.GOODS) {
          const o = stop.orders[g.id] || { mode: 'none', price: '', qty: '' };
          const showPrice = o.mode === 'buy' || o.mode === 'sell', showQty = o.mode === 'buy' || o.mode === 'load';
          h += `<tr class="${o.mode === 'none' ? 'dim' : ''}"><td>${HK.goodName(g.id)} <small>(${HK.buyPrice(st, stop.city, g.id, 1)}/${HK.sellPrice(st, stop.city, g.id, 1)})</small></td>
            <td><select data-order="${i}" data-good="${g.id}" data-f="mode"><option value="none" ${o.mode === 'none' ? 'selected' : ''}>–</option><option value="buy" ${o.mode === 'buy' ? 'selected' : ''}>${HK.t('buy')}</option><option value="sell" ${o.mode === 'sell' ? 'selected' : ''}>${HK.t('sell')}</option>${k ? `<option value="unload" ${o.mode === 'unload' ? 'selected' : ''}>${HK.t('modeUnload')}</option><option value="load" ${o.mode === 'load' ? 'selected' : ''}>${HK.t('modeLoad')}</option>` : ''}</select></td>
            <td>${showPrice ? `<input type="number" min="0" class="tiny" data-order="${i}" data-good="${g.id}" data-f="price" value="${o.price}" placeholder="${o.mode === 'buy' ? HK.t('maxPrice') : HK.t('minPrice')}">` : ''}</td>
            <td>${showQty ? `<input type="number" min="1" class="tiny" data-order="${i}" data-good="${g.id}" data-f="qty" value="${o.qty}" placeholder="${HK.t('max')}">` : ''}</td></tr>`;
        }
        h += `</tbody></table></div>`;
      });
      h += `</div><div class="btn-row"><button class="small" id="add-stop">+ ${HK.t('addStop')}</button></div>
        <div class="modal-actions"><button data-close>${HK.t('cancel')}</button><button class="primary" id="route-apply">${HK.t('apply')}</button></div>`;
      const box = this.modal(h, { wide: true });
      box.querySelector('#add-stop').addEventListener('click', () => { route.stops.push({ city: HK.CITIES.find(c => !route.stops.some(s => s.city === c.id)).id, orders: {} }); render(); });
      box.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => { route.stops.splice(parseInt(b.dataset.remove, 10), 1); render(); }));
      box.querySelectorAll('.stop-city').forEach(s => s.addEventListener('change', () => { route.stops[parseInt(s.dataset.stop, 10)].city = s.value; render(); }));
      box.querySelectorAll('[data-order]').forEach(el => {
        const upd = () => {
          const stop = route.stops[parseInt(el.dataset.order, 10)], g = el.dataset.good;
          const o = stop.orders[g] || { mode: 'none', price: 0, qty: 0 };
          if (el.dataset.f === 'mode') {
            o.mode = el.value;
            if (o.mode === 'none') delete stop.orders[g];
            else { stop.orders[g] = o; if (!o.price) o.price = o.mode === 'buy' ? Math.round(HK.GOOD[g].base * 0.8) : Math.round(HK.GOOD[g].base * 1.2); if (!o.qty) o.qty = HK.cargoCap(ship); }
            render();
          } else { o[el.dataset.f] = parseInt(el.value, 10) || 0; stop.orders[g] = o; }
        };
        el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', upd);
      });
      box.querySelector('#route-apply').addEventListener('click', () => {
        if (route.stops.length < 2) { this.toast(HK.t('routeNeedsStops'), 'bad'); return; }
        ship.route = route; ship.routeIdx = 0;
        if (ship.routeActive) ship.routeActive = false;
        this.closeModal(); this.renderAll();
      });
    };
    render();
    this.modalRender = render;
  },
};
