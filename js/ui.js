/* Oberfläche: Seitenleiste, Gebäudemenüs, Dialoge */
'use strict';

HK.UI = {
  tab: 'place', panel: 'kontor', plot: 0, selectedVisitor: null, selectedOwnShip: null, person: null, encounter: null,
  inputs: { qty: 10, qtyAll: false, smuggle: false, loan: 1000, bet: 100, donate: 200, dest: 'luebeck', bring: '' }, modalOpen: false, modalRender: null, unread: 0,

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
    this.$('file-import').addEventListener('change', e => { if (e.target.files[0]) HK.importGame(e.target.files[0]); e.target.value = ''; });
    this.$('btn-help').addEventListener('click', () => this.showHelp());
    this.$('btn-menu').addEventListener('click', () => { HK.setSpeed(0); this.showTitle(true); });
    document.querySelectorAll('#hud .lang-btn').forEach(b => b.addEventListener('click', () => HK.setLang(b.dataset.lang)));
    this.sidebar.addEventListener('click', e => { const b = e.target.closest('[data-action]'); if (b && !b.disabled) this.action(b.dataset); });
    this.sidebar.addEventListener('input', e => { const el = e.target; if (el.dataset.field) { this.inputs[el.dataset.field] = el.type === 'checkbox' ? el.checked : el.value; if (el.dataset.field === 'qty') this.inputs.qtyAll = false; } });
    this.sidebar.addEventListener('change', e => { const el = e.target; if (el.dataset.field === 'smuggle' || el.dataset.field === 'dest' || el.dataset.field === 'bring') this.renderSidebar(); if (el.dataset.field === 'acceptBribes') { HK.state.acceptBribes = el.checked; } });
    document.addEventListener('keydown', e => {
      if (this.modalOpen || !HK.state || ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
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
    if (tab === 'log') this.unread = 0;
    this.renderSidebar(); this.renderTabs();
  },
  renderTabs() {
    const badge = this.$('log-badge'); badge.textContent = this.unread || ''; badge.hidden = !this.unread;
    this.$('tab-place-label').textContent = this.panelTitle();
  },
  panelTitle() {
    const p = this.panel;
    if (p === 'person' && this.person) return HK.PERSON[this.person].name;
    if (p === 'encounter') return HK.t('enc_' + (this.encounter ? this.encounter.type : 'citizen') + '_label');
    if (p === 'house') return HK.name(HK.BUILDINGS.find(b => b.panel === 'house' && b.plot === this.plot));
    if (p === 'workshop') return HK.name(HK.BUILDINGS.find(b => b.panel === 'workshop' && b.plot === this.plot));
    const sel = HK.Scene.selected && HK.BUILDING[HK.Scene.selected]; if (sel && sel.panel === p) return HK.name(sel);
    const b = HK.BUILDINGS.find(x => x.panel === p); return b ? HK.name(b) : HK.t(p);
  },
  showGame() { this.$('title-screen').hidden = true; this.$('game').hidden = false; this.$('hud').hidden = false; this.$('side').hidden = false; },
  /* Hintergrund um die Szene an den Himmel anpassen */
  syncBackdrop() { const P = HK.Scene.palette(); const el = this.$('scene-wrap'); if (el) el.style.background = `linear-gradient(${HK.Scene.rgb(P.top)}, ${HK.Scene.rgb(P.near.map(v => v * 0.6))} 55%, #1a120c)`; if (!HK.preview && HK.state) this.renderHeader(); },

  /* Klick in der Szene */
  sceneClick(h) {
    if (h.kind === 'building') { this.panel = h.panel; if (h.building.plot !== undefined) this.plot = h.building.plot; HK.Scene.selected = h.building.id; if (h.panel !== 'harbour' && h.panel !== 'gate') this.selectedVisitor = null; }
    else if (h.kind === 'visitor') { this.panel = h.panel; this.selectedVisitor = h.id; HK.Scene.selected = h.panel === 'gate' ? 'gate' : 'harbour'; }
    else if (h.kind === 'person') { this.panel = 'person'; this.person = h.person; HK.Scene.selected = null; }
    else if (h.kind === 'walker') { this.panel = 'encounter'; this.encounter = Object.assign({ type: h.walker.type }, HK.encounter(HK.state, h.walker.type)); HK.Scene.selected = null; }
    this.setTab('place');
  },

  /* ---------- Titel ---------- */
  showTitle(hasSave) {
    const ts = this.$('title-screen'); ts.hidden = false; this.$('game').hidden = false;
    const inGame = !!HK.state && !HK.preview;
    const render = () => {
      ts.innerHTML = `<div class="title-box"><h1>${HK.t('title')}</h1><p class="subtitle">${HK.t('subtitle')}</p>
        <div class="lang-row"><button class="lang-btn ${HK.LANG === 'de' ? 'active' : ''}" data-lang="de">Deutsch</button><button class="lang-btn ${HK.LANG === 'en' ? 'active' : ''}" data-lang="en">English</button></div>
        ${inGame ? `<button class="big" id="t-resume">${HK.t('continuePlay')}</button>` : ''}
        ${hasSave && !inGame ? `<button class="big" id="t-continue">${HK.t('continueGame')}</button>` : ''}
        <form id="new-game-form" class="new-game">
          <label>${HK.t('playerName')}<input id="ng-name" name="name" maxlength="30" value="${this.esc(HK.t('defaultName'))}"></label>
          <fieldset><legend>${HK.t('difficulty')}</legend>${['easy', 'normal', 'hard'].map(d => `<label class="radio"><input type="radio" name="difficulty" value="${d}" ${d === 'normal' ? 'checked' : ''}> <b>${HK.t(d)}</b> <small>${HK.t('diffHint_' + d)}</small></label>`).join('')}</fieldset>
          <button type="submit" class="big primary">${HK.t('newGame')}</button></form>
        ${hasSave && inGame ? `<button id="t-load" class="link">${HK.t('load')}</button>` : ''}<button id="t-help" class="link">${HK.t('help')}</button></div>`;
      ts.querySelectorAll('.lang-btn').forEach(b => b.addEventListener('click', () => HK.setLang(b.dataset.lang)));
      const r = ts.querySelector('#t-resume'); if (r) r.addEventListener('click', () => { ts.hidden = true; });
      this.$('hud').hidden = !inGame; this.$('side').hidden = !inGame;
      const c = ts.querySelector('#t-continue'); if (c) c.addEventListener('click', () => HK.loadGame());
      const l = ts.querySelector('#t-load'); if (l) l.addEventListener('click', () => { if (confirm(HK.t('confirmNewGame'))) HK.loadGame(); });
      ts.querySelector('#t-help').addEventListener('click', () => this.showHelp());
      ts.querySelector('#new-game-form').addEventListener('submit', e => {
        e.preventDefault();
        if (inGame && !confirm(HK.t('confirmNewGame'))) return;
        const fd = new FormData(e.target);
        HK.startWithState(HK.newGame({ name: (fd.get('name') || '').trim() || HK.t('defaultName'), difficulty: fd.get('difficulty') }));
        HK.autosave();
      });
    };
    render(); this.titleRender = render;
  },

  /* ---------- Modal, Toast ---------- */
  modal(html, opts) {
    const m = this.$('modal'); m.hidden = false; this.modalOpen = true;
    m.innerHTML = `<div class="modal-box ${opts && opts.wide ? 'wide' : ''}">${html}</div>`;
    m.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => this.closeModal()));
    return m.querySelector('.modal-box');
  },
  closeModal() { this.$('modal').hidden = true; this.$('modal').innerHTML = ''; this.modalOpen = false; this.modalRender = null; },
  showHelp() { const r = () => this.modal(`<h2>${HK.t('helpTitle')}</h2><div class="help">${HK.t('helpText')}</div><div class="modal-actions"><button data-close class="primary">${HK.t('close')}</button></div>`); r(); this.modalRender = r; },
  showEnd(won) {
    HK.setSpeed(0);
    this.modal(`<h2>${won ? HK.t('won') : HK.t('gameOver')}</h2><p>${won ? '' : HK.t('bankrupt')}</p><p>${HK.t('day')} ${HK.state.day} · ${HK.t('netWorth')}: ${HK.fmt(HK.netWorth(HK.state))} ${HK.t('mark')}</p>
      <div class="modal-actions">${won ? `<button data-close class="primary">${HK.t('continuePlay')}</button>` : ''}<button id="end-new" class="${won ? '' : 'primary'}">${HK.t('newGame')}</button></div>`)
      .querySelector('#end-new').addEventListener('click', () => { this.closeModal(); this.showTitle(false); });
  },
  toast(msg, kind, ms) {
    const c = this.$('toasts'), el = document.createElement('div');
    el.className = 'toast ' + (kind || 'info'); el.innerHTML = msg; c.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, ms || 3500);
    while (c.children.length > 5) c.firstChild.remove();
  },
  onLog(e) {
    if (!HK.state || HK.state.day === 0) return;
    if (this.tab !== 'log') { this.unread++; this.renderTabs(); }
    if (['bad', 'good', 'event', 'arrival'].includes(e.kind)) this.toast(this.logText(e), e.kind === 'arrival' ? 'info' : e.kind);
  },
  logText(e) { const v = Object.assign({}, e.vars); if (v.name) v.name = this.esc(v.name); if (v.ship) v.ship = this.esc(v.ship); return HK.t(e.key === 'sermonAgainst' ? 'sermonAgainstLog' : e.key, v); },

  /* ---------- Rendering ---------- */
  renderAll() { this.renderHeader(); this.renderSidebar(); this.renderTabs(); },
  renderHeader() {
    const st = HK.state; if (!st) return;
    this.$('hud-date').textContent = HK.fmtDate(st.day);
    const c = HK.Scene.clock; this.$('hud-time').textContent = c < 0.2 || c > 0.87 ? HK.t('night') : c < 0.4 ? HK.t('morning') : c < 0.65 ? HK.t('noon') : HK.t('evening');
    this.$('hud-money').textContent = HK.fmt(st.money) + ' ' + HK.t('mark'); this.$('hud-money').classList.toggle('neg', st.money < 0);
    this.$('hud-rep').textContent = Math.round(st.rep); this.$('hud-influence').textContent = Math.floor(st.influence); this.$('hud-piety').textContent = Math.round(st.piety); this.$('hud-suspicion').textContent = Math.round(st.suspicion);
    document.querySelector('.stat.susp').classList.toggle('high', st.suspicion >= 50);
    this.$('hud-rank').textContent = this.esc(st.name) + ' · ' + HK.name(HK.RANKS[st.rank]) + (st.seat !== 'none' ? ' · ' + HK.t('seat_' + st.seat) : '');
    ['btn-pause', 'btn-s1', 'btn-s2', 'btn-s3'].forEach((id, i) => this.$(id).classList.toggle('active', st.speed === i));
  },
  renderSidebar() {
    if (!HK.state) return;
    const active = document.activeElement, focusId = active && this.sidebar.contains(active) ? active.id : null;
    let html = '';
    if (this.tab === 'overview') html = this.renderOverview();
    else if (this.tab === 'log') html = this.renderLog();
    else { const fn = this['panel_' + this.panel]; html = fn ? fn.call(this) : ''; }
    const scroll = this.sidebar.scrollTop; this.sidebar.innerHTML = html; this.sidebar.scrollTop = scroll;
    if (this.tab === 'overview') this.drawChart();
    if (focusId) { const el = this.$(focusId); if (el) el.focus(); }
  },
  bar(v, cls) { return `<div class="bar ${cls || ''}"><i style="width:${HK.clamp(v, 0, 100)}%"></i></div>`; },
  demandBadge(g) { const l = HK.demandLabel(HK.state, g); return `<span class="demand ${l}">${HK.t(l)}</span>`; },
  qtyRow() {
    const q = this.inputs.qtyAll ? 'all' : Math.max(1, parseInt(this.inputs.qty, 10) || 1);
    return `<div class="qty-row"><span>${HK.t('qty')}:</span><input id="qty-input" type="number" min="1" data-field="qty" value="${this.esc(this.inputs.qty)}" ${this.inputs.qtyAll ? 'disabled' : ''}>
      ${[1, 10, 50].map(n => `<button class="small ${!this.inputs.qtyAll && q === n ? 'active' : ''}" data-action="qty" data-n="${n}">${n}</button>`).join('')}<button class="small ${this.inputs.qtyAll ? 'active' : ''}" data-action="qtyall">${HK.t('max')}</button></div>`;
  },
  qty() { return this.inputs.qtyAll ? Infinity : Math.max(1, parseInt(this.inputs.qty, 10) || 1); },
  personRow(pid, extra) {
    const st = HK.state, p = HK.PERSON[pid], loy = st.persons[pid].loyalty, exact = st.spyUntil > st.day || !p.council;
    return `<div class="person"><div class="who"><b>${p.name}</b><small>${p.title[HK.LANG] || p.title.de}${p.faction ? ' · ' + (HK.FACTIONS[p.faction][HK.LANG]) : ''}</small></div>
      <div title="${HK.t('loyalty')}">${exact ? this.bar(loy, loy > 50 ? 'green' : loy < 30 ? 'red' : '') : `<span class="tag">${loy > 55 ? HK.t('gossipFriendly') : loy < 30 ? HK.t('gossipCold') : '?'}</span>`}</div>
      <button class="small" data-action="gift" data-person="${pid}" ${st.money >= HK.giftCost(st, pid) ? '' : 'disabled'}>${HK.t('giveGift', { cost: HK.fmt(HK.giftCost(st, pid)) })}</button>${extra || ''}</div>`;
  },
  head(title, meta) { return `<div class="panel-head"><h2>${title}</h2>${meta ? `<div class="meta">${meta}</div>` : ''}</div>`; },

  /* ---------- Besucher (Schiffe, Karawanen) ---------- */
  visitorTrade(v) {
    const st = HK.state, tariff = HK.tariffRate(st), disc = HK.customsDiscount(st), sm = this.inputs.smuggle;
    let h = `<div class="card selected"><div class="card-head"><b>${this.visitorTitle(v)}</b> <small>${v.sea ? HK.t('fromOrigin', { origin: HK.name(HK.ORIGIN[v.origin]) }) + ' · ' + HK.t('captain') : HK.t('leader')} ${v.captain} · ${HK.t(v.sea ? 'leavesIn' : 'movesOn', { days: v.daysLeft })}</small></div>
      <p class="hint">${HK.t('tariffInfo', { rate: tariff * 100, disc: Math.round(disc * 100) })}</p><label class="check"><input type="checkbox" data-field="smuggle" ${sm ? 'checked' : ''}> ${HK.t('smuggle')} <small>– ${HK.t('smuggleHint')}</small></label>${this.qtyRow()}
      <h4>${HK.t('offers')}</h4><table class="market"><thead><tr><th>${HK.t('good')}</th><th class="num">${HK.t('qty')}</th><th class="num">${HK.t('price')}</th><th class="num">+ Zoll</th><th class="num">${HK.t('warehouse')}</th><th></th></tr></thead><tbody>`;
    const keys = Object.keys(v.cargo);
    if (!keys.length) h += `<tr><td colspan="6" class="hint">–</td></tr>`;
    for (const g of keys) { const c = v.cargo[g]; const full = Math.round(c.price * (1 + (sm ? 0 : tariff * (1 - disc)))); h += `<tr><td class="gname">${HK.goodName(g)} ${this.demandBadge(g)}</td><td class="num">${c.qty}</td><td class="num">${c.price}</td><td class="num">${full}</td><td class="num">${Math.floor(st.warehouse.stock[g] || 0) || ''}</td><td class="acts"><button class="small" data-action="vbuy" data-good="${g}">${HK.t('buy')}</button></td></tr>`; }
    h += `</tbody></table><h4>${HK.t('wants')}</h4><table class="market"><thead><tr><th>${HK.t('good')}</th><th class="num">${HK.t('qty')}</th><th class="num">${HK.t('price')}</th><th class="num">− Zoll</th><th class="num">${HK.t('warehouse')}</th><th></th></tr></thead><tbody>`;
    const wk = Object.keys(v.wants);
    if (!wk.length) h += `<tr><td colspan="6" class="hint">–</td></tr>`;
    for (const g of wk) { const w = v.wants[g]; const net = Math.round(w.price * (1 - (sm ? 0 : tariff * 0.5 * (1 - disc)))); const have = Math.floor(st.warehouse.stock[g] || 0); h += `<tr><td class="gname">${HK.goodName(g)}</td><td class="num">${w.qty}</td><td class="num">${w.price}</td><td class="num">${net}</td><td class="num">${have || ''}</td><td class="acts"><button class="small" data-action="vsell" data-good="${g}" ${have ? '' : 'disabled'}>${HK.t('sell')}</button></td></tr>`; }
    return h + `</tbody></table></div>`;
  },
  visitorTitle(v) { return v.sea ? this.esc(v.name) : HK.t('caravanFrom', { origin: HK.name(HK.ORIGIN[v.origin]) }); },
  visitorList(list) {
    let v = list.find(x => x.id === this.selectedVisitor);
    if (!v && list.length) { v = list[0]; this.selectedVisitor = v.id; }
    let h = list.map(x => x.id === (v && v.id) ? '' : `<div class="card" data-action="selvisitor" data-id="${x.id}" style="cursor:pointer"><div class="card-head"><b>${this.visitorTitle(x)}</b> <small>${x.sea ? HK.t('fromOrigin', { origin: HK.name(HK.ORIGIN[x.origin]) }) + ' · ' : ''}${HK.t(x.sea ? 'leavesIn' : 'movesOn', { days: x.daysLeft })}</small></div><small>${HK.t('offers')}: ${Object.keys(x.cargo).map(HK.goodName).join(', ') || '–'} · ${HK.t('wants')}: ${Object.keys(x.wants).map(HK.goodName).join(', ') || '–'}</small></div>`).join('');
    if (v) h = this.visitorTrade(v) + h;
    return h;
  },
  panel_harbour() {
    const st = HK.state;
    let h = this.head(HK.t('harbour'), `${HK.t('shipsInPort')}: ${st.ships.length}/${st.town.berths}`);
    h += `<section>${st.ships.length ? this.visitorList(st.ships) : `<p class="hint">${HK.t('noShips')}</p>`}</section>`;
    h += `<section><h3>${HK.t('ownShips')}</h3>${this.ownShips()}</section>`;
    if (HK.knowsIncoming(st)) h += this.incomingList();
    return h;
  },
  panel_gate() {
    const st = HK.state;
    return this.head(HK.t('gate'), HK.t('gateHint')) + `<section><h3>${HK.t('caravans')}</h3>${st.caravans.length ? this.visitorList(st.caravans) : `<p class="hint">${HK.t('noCaravans')}</p>`}</section>`;
  },
  ownShips() {
    const st = HK.state;
    if (!st.ownShips.length) return `<p class="hint">${HK.t('noOwnShips')}</p>`;
    let s = st.ownShips.find(x => x.id === this.selectedOwnShip); if (!s) { s = st.ownShips[0]; this.selectedOwnShip = s.id; }
    let h = st.ownShips.map(x => `<div class="card ${x.id === s.id ? 'selected' : ''}" data-action="selown" data-id="${x.id}" style="cursor:pointer"><div class="card-head"><b>${this.esc(x.name)}</b><small>${x.status === 'port' ? HK.t('inPort') : HK.t('away', { dest: HK.name(HK.ORIGIN[x.dest]), days: x.daysLeft })} · ${HK.t('hull')} ${x.hull} %</small></div><small>${HK.t('cargo')}: ${Object.keys(x.cargo).map(g => x.cargo[g] + ' ' + HK.goodName(g)).join(', ') || '–'} (${HK.stockUsed(x.cargo)}/120)</small></div>`).join('');
    if (s.status === 'port') {
      const seaDest = HK.ORIGINS.filter(o => o.sea);
      const dest = HK.ORIGIN[this.inputs.dest] && HK.ORIGIN[this.inputs.dest].sea ? this.inputs.dest : seaDest[0].id;
      const o = HK.ORIGIN[dest];
      h += `<p class="hint">${HK.t('expeditionHint')}</p>${this.qtyRow()}<table class="market"><thead><tr><th>${HK.t('good')}</th><th class="num">${HK.t('warehouse')}</th><th class="num">${HK.t('cargo')}</th><th class="num">${HK.name(o)}</th><th></th></tr></thead><tbody>`;
      for (const g of HK.GOODS) { const wh = Math.floor(st.warehouse.stock[g.id] || 0), c = s.cargo[g.id] || 0; if (!wh && !c) continue; h += `<tr><td class="gname">${HK.goodName(g.id)}</td><td class="num">${wh || ''}</td><td class="num">${c || ''}</td><td class="num">${o.want[g.id] ? '<b>' + Math.round(g.base * (0.75 + o.want[g.id] * 0.4)) + '</b>' : Math.round(g.base * 0.8)}</td><td class="acts"><button class="small" data-action="load" data-good="${g.id}" ${wh ? '' : 'disabled'}>${HK.t('loadShip')}</button><button class="small" data-action="unload" data-good="${g.id}" ${c ? '' : 'disabled'}>${HK.t('unloadShip')}</button></td></tr>`; }
      h += `</tbody></table><div class="btn-row"><label>${HK.t('destination')} <select data-field="dest">${seaDest.map(x => `<option value="${x.id}" ${x.id === dest ? 'selected' : ''}>${HK.name(x)} (${HK.t('daysTrip', { days: x.days * 2 + 1 })})</option>`).join('')}</select></label>
        <label>${HK.t('bringBack')} <select data-field="bring"><option value="">–</option>${Object.keys(o.sell).map(g => `<option value="${g}" ${this.inputs.bring === g ? 'selected' : ''}>${HK.goodName(g)} (${Math.round(HK.GOOD[g].base * o.sell[g])})</option>`).join('')}</select></label>
        <button class="primary" data-action="send" ${s.hull >= 30 ? '' : 'disabled'}>${HK.t('sendShip')}</button></div>`;
    }
    return h;
  },

  /* ---------- Markt, Kontor ---------- */
  panel_market() {
    const st = HK.state, mono = HK.law(st, 'monopoly');
    let h = this.head(HK.t('market'), HK.t('marketHint', { fee: HK.law(st, 'marketFee') }));
    if (mono !== 'none' && st.town.monopolyHolder === 'player') h += `<p class="tag gold">${HK.t('monopolyYours', { good: HK.goodName(mono) })}</p>`;
    h += `<section>${this.qtyRow()}<table class="market"><thead><tr><th>${HK.t('good')}</th><th class="num">${HK.t('stock')}</th><th>${HK.t('demand')}</th><th class="num">${HK.t('buyPrice')}</th><th class="num">${HK.t('sellPrice')}</th><th class="num" title="${HK.t('marketCapHint')}">${HK.t('marketCapHint')}</th><th class="num">${HK.t('warehouse')}</th><th></th></tr></thead><tbody>`;
    for (const g of HK.GOODS) { const wh = Math.floor(st.warehouse.stock[g.id] || 0), cap = HK.marketCap(st, g.id); h += `<tr><td class="gname">${HK.goodName(g.id)}</td><td class="num">${Math.floor(st.town.stock[g.id] || 0)}</td><td>${this.demandBadge(g.id)}</td><td class="num">${HK.marketBuyPrice(st, g.id, 1)}</td><td class="num">${HK.marketSellPrice(st, g.id, 1)}</td><td class="num"><small>${cap}</small></td><td class="num">${wh || ''}</td><td class="acts"><button class="small" data-action="mbuy" data-good="${g.id}">${HK.t('buy')}</button><button class="small" data-action="msell" data-good="${g.id}" ${wh && cap ? '' : 'disabled'}>${HK.t('sell')}</button></td></tr>`; }
    h += `</tbody></table></section><section><h3>${HK.t('stalls')}: ${st.stalls}/${HK.CONST.STALL_MAX}</h3><button class="small" data-action="stall" ${st.stalls < HK.CONST.STALL_MAX && st.money >= HK.CONST.STALL_COST ? '' : 'disabled'}>${HK.t('buyStall', { cost: HK.fmt(HK.CONST.STALL_COST) })}</button></section>`;
    return h;
  },
  panel_kontor() {
    const st = HK.state, tot = HK.ledgerTotals(st);
    let h = this.head(HK.t('kontor'), `${HK.t('netWorth')}: <b>${HK.fmt(HK.netWorth(st))} ${HK.t('mark')}</b>`);
    h += `<section><h3>${HK.t('warehouse')} · ${HK.t('capacityHint', { used: Math.floor(HK.stockUsed(st.warehouse.stock)), cap: st.warehouse.cap })}</h3>`;
    const keys = Object.keys(st.warehouse.stock).filter(g => st.warehouse.stock[g] >= 1);
    h += keys.length ? `<table class="plain">${keys.map(g => `<tr><td>${HK.goodName(g)}</td><td class="num">${Math.floor(st.warehouse.stock[g])} ${HK.t('unitLast')}</td><td class="num"><small>${HK.marketSellPrice(st, g, 1)} ${HK.t('mark')}</small></td></tr>`).join('')}</table>` : `<p class="hint">${HK.t('empty')}</p>`;
    h += `<button class="small" data-action="expandwh" ${st.money >= HK.CONST.WAREHOUSE_EXPAND_COST ? '' : 'disabled'}>${HK.t('expandWarehouse', { qty: HK.CONST.WAREHOUSE_EXPAND, cost: HK.fmt(HK.CONST.WAREHOUSE_EXPAND_COST) })}</button></section>`;
    const inc = Object.keys(tot).filter(k => tot[k] > 0).sort((a, b) => tot[b] - tot[a]), exp = Object.keys(tot).filter(k => tot[k] < 0).sort((a, b) => tot[a] - tot[b]);
    let sum = 0; for (const k in tot) sum += tot[k];
    h += `<section><h3>${HK.t('ledger')}</h3><table class="plain"><tr><td colspan="2"><b>${HK.t('income')}</b></td></tr>${inc.map(k => `<tr><td>${HK.t('src_' + k)}</td><td class="num">+${HK.fmt(tot[k])}</td></tr>`).join('') || `<tr><td class="hint">–</td></tr>`}
      <tr><td colspan="2"><b>${HK.t('expenses')}</b></td></tr>${exp.map(k => `<tr><td>${HK.t('src_' + k)}</td><td class="num">${HK.fmt(tot[k])}</td></tr>`).join('') || `<tr><td class="hint">–</td></tr>`}<tr><td><b>${HK.t('balance')}</b></td><td class="num"><b>${sum >= 0 ? '+' : ''}${HK.fmt(sum)}</b></td></tr></table></section>`;
    return h;
  },

  /* ---------- Rathaus ---------- */
  panel_townhall() {
    const st = HK.state;
    let h = this.head(HK.t('townhall'), `${HK.t('yourSeat')}: <b>${HK.t('seat_' + st.seat)}</b> · ${HK.t('influence')}: <b>${Math.floor(st.influence)}</b>`);
    if (st.pendingLevy) h += `<p class="tag">${HK.t('levy', { amount: HK.fmt(st.pendingLevy.amount), days: st.pendingLevy.until - st.day })} <button class="small" data-action="paylevy" ${st.money >= st.pendingLevy.amount ? '' : 'disabled'}>${HK.t('payLevy')}</button></p>`;
    h += `<section><h3>${HK.t('council')}</h3>${HK.councillors().map(c => this.personRow(c.id)).join('')}${st.spyUntil > st.day ? `<p class="hint">${HK.t('spyActive', { days: st.spyUntil - st.day })}</p>` : ''}
      <div class="btn-row">${st.seat !== 'mayor' ? `<button data-action="run">${HK.t(st.seat === 'none' ? 'runCouncillor' : 'runMayor')}</button>` : ''}</div>
      ${st.seat !== 'none' ? `<label class="check"><input type="checkbox" data-field="acceptBribes" ${st.acceptBribes ? 'checked' : ''}> ${HK.t('acceptBribes')}</label>` : ''}</section>`;
    h += `<section><h3>${HK.t('laws')}</h3><table class="plain">`;
    for (const id in HK.LAWS) {
      const law = HK.LAWS[id];
      h += `<tr><td><b>${HK.name(law)}</b><br><small>${HK.t('lawHint_' + id)}</small></td><td><small>${HK.t('current')}:</small> <b>${HK.lawValueText(id, st.town.laws[id])}</b><br><span class="btn-row">${law.options.filter(o => o !== st.town.laws[id]).map(o => `<button class="tiny" data-action="propose" data-law="${id}" data-value="${o}" ${st.influence >= 20 ? '' : 'disabled'}>→ ${HK.lawValueText(id, o)}</button>`).join('')}</span></td></tr>`;
    }
    h += `</table><p class="hint">${HK.t('propose')}</p></section>`;
    h += `<section><h3>${HK.t('projects')}</h3><table class="plain">${HK.PROJECTS.map(p => `<tr><td><b>${HK.name(p)}</b> <small>+${p.rep} ${HK.t('rep')}</small></td><td class="num">${st.town.projects[p.id] ? `<span class="tag gold">${HK.t('funded')}</span>` : `<button class="small" data-action="project" data-id="${p.id}" ${st.money >= p.cost ? '' : 'disabled'}>${HK.t('fund', { cost: HK.fmt(p.cost) })}</button>`}</td></tr>`).join('')}</table></section>`;
    h += `<section><h3>${HK.t('taxFarm')}</h3><p class="hint">${HK.t('taxFarmHint')}</p>${st.taxFarm && st.taxFarm.until > st.day ? `<p class="tag gold">${HK.t('taxFarmActive', { days: st.taxFarm.until - st.day })}</p>` : `<button class="small" data-action="taxfarm" ${st.money >= HK.taxFarmPrice(st) ? '' : 'disabled'}>${HK.t('buyTaxFarm', { cost: HK.fmt(HK.taxFarmPrice(st)) })}</button>`}</section>`;
    return h;
  },

  /* ---------- Kirche ---------- */
  panel_church() {
    const st = HK.state;
    let h = this.head(HK.t('church'), HK.t('churchHint')) + `<section><b>${HK.t('piety')}: ${Math.round(st.piety)}</b>${this.bar(st.piety, 'blue')}`;
    h += `<div class="btn-row">${[100, 500, 2000].map(a => `<button class="small" data-action="donate" data-amount="${a}" ${st.money >= a ? '' : 'disabled'}>${HK.t('donateAmount', { amount: HK.fmt(a) })}</button>`).join('')}
      <button class="small" data-action="indulgence" ${st.money >= HK.CONST.INDULGENCE_COST + st.suspicion * 15 ? '' : 'disabled'}>${HK.t('indulgence', { cost: HK.fmt(HK.CONST.INDULGENCE_COST + Math.round(st.suspicion * 15)) })}</button></div></section>`;
    h += `<section><h3>${HK.t('churchSupply')}</h3><table class="plain">${['wax', 'wine'].map(g => { const q = st.church.supply[g] || 0, have = Math.floor(st.warehouse.stock[g] || 0), price = Math.round(HK.GOOD[g].base * (st.church.projects.chapel ? 2 : 1.5)); return `<tr><td>${HK.goodName(g)}: ${q} ${HK.t('unitLast')} <small>(${HK.t('warehouse')}: ${have})</small></td><td class="num"><button class="small" data-action="supply" data-good="${g}" ${q > 0 && have > 0 && st.piety >= 40 ? '' : 'disabled'}>${HK.t('supply', { qty: Math.min(q, have), price })}</button></td></tr>`; }).join('')}</table></section>`;
    h += `<section><h3>${HK.t('churchProjects')}</h3><table class="plain">${HK.CHURCH_PROJECTS.map(p => `<tr><td><b>${HK.name(p)}</b> <small>+${p.piety} ${HK.t('piety')}, +${p.rep} ${HK.t('rep')}</small></td><td class="num">${st.church.projects[p.id] ? `<span class="tag gold">${HK.t('funded')}</span>` : `<button class="small" data-action="churchproject" data-id="${p.id}" ${st.money >= p.cost ? '' : 'disabled'}>${HK.t('fund', { cost: HK.fmt(p.cost) })}</button>`}</td></tr>`).join('')}</table></section>`;
    h += `<section><h3>${HK.PERSON.priest.name}</h3>${this.personRow('priest')}<div class="btn-row"><button class="small" data-action="sermon" data-kind="favor" ${st.persons.priest.loyalty >= 40 && st.money >= 500 ? '' : 'disabled'}>${HK.t('sermonFavor')}</button><button class="small" data-action="sermon" data-kind="against" ${st.persons.priest.loyalty >= 60 && st.money >= 800 ? '' : 'disabled'}>${HK.t('sermonAgainst')}</button></div></section>`;
    return h;
  },
  panel_customs() {
    const st = HK.state;
    return this.head(HK.t('customs'), HK.t('customsHint', { name: HK.PERSON.customs.name, rate: HK.law(st, 'tariff'), disc: Math.round(HK.customsDiscount(st) * 100) })) + `<section>${this.personRow('customs')}<p class="hint">${HK.t('smuggleStats', { amount: HK.fmt(st.stats.smuggled) })}</p></section>`;
  },
  panel_guild() {
    const st = HK.state;
    let h = this.head(HK.t('guild'), HK.t('guildHint', { fee: HK.fmt(HK.CONST.GUILD_FEE) })) + `<section>${this.personRow('guild')}`;
    h += st.guildMember ? `<p class="tag gold">${HK.t('member')}</p>` : `<button data-action="joinguild" ${st.money >= HK.CONST.GUILD_FEE ? '' : 'disabled'}>${HK.t('joinGuild', { fee: HK.fmt(HK.CONST.GUILD_FEE) })}</button>`;
    h += `</section><section><h3>${HK.t('licenses')}</h3><table class="plain">${HK.WORKSHOPS.map(w => `<tr><td><b>${HK.name(w)}</b><br><small>${HK.t('produces', { qty: w.qty, good: HK.goodName(w.out) })}, ${HK.t('consumes', { inp: Object.keys(w.inp).map(g => w.inp[g] + ' ' + HK.goodName(g)).join(' + ') })}</small></td><td class="num">${st.licenses[w.id] ? `<span class="tag gold">${HK.t('licensed')}</span>` : `<button class="small" data-action="license" data-type="${w.id}" ${st.guildMember && st.money >= w.license ? '' : 'disabled'}>${HK.t('buyLicense', { cost: HK.fmt(w.license) })}</button>`}</td></tr>`).join('')}</table></section>`;
    return h;
  },
  panel_workshop() {
    const st = HK.state, ws = st.workshops[this.plot], b = HK.BUILDINGS.find(x => x.panel === 'workshop' && x.plot === this.plot);
    let h = this.head(HK.name(b), '');
    if (!ws.type) {
      h += `<p class="hint">${HK.t('workshopEmpty')}</p><table class="plain">${HK.WORKSHOPS.map(w => `<tr><td><b>${HK.name(w)}</b> ${st.licenses[w.id] ? '' : `<span class="tag">${HK.t('needLicense')}</span>`}<br><small>${HK.t('produces', { qty: w.qty, good: HK.goodName(w.out) })}, ${HK.t('consumes', { inp: Object.keys(w.inp).map(g => w.inp[g] + ' ' + HK.goodName(g)).join(' + ') })} · ${HK.t('wage', { wage: w.wage })}</small></td><td class="num"><button class="small" data-action="buildws" data-type="${w.id}" ${st.licenses[w.id] && st.money >= w.cost ? '' : 'disabled'}>${HK.t('build', { cost: HK.fmt(w.cost) })}</button></td></tr>`).join('')}</table>`;
    } else {
      const w = HK.WORKSHOP[ws.type];
      h += `<section><h3>${HK.name(w)}</h3><p>${ws.idle ? `<span class="demand shortage">${HK.t('idle')}</span>` : `<span class="demand surplus">${HK.t('running')}</span>`}</p><p>${HK.t('produces', { qty: w.qty, good: HK.goodName(w.out) })}<br>${HK.t('consumes', { inp: Object.keys(w.inp).map(g => w.inp[g] + ' ' + HK.goodName(g) + ' (' + HK.t('warehouse') + ': ' + Math.floor(st.warehouse.stock[g] || 0) + ')').join(' + ') })}<br>${HK.t('wage', { wage: w.wage })}</p>
        <button class="small danger" data-action="demolishws">${HK.t('demolish')}</button></section>`;
    }
    return h;
  },
  panel_house() {
    const st = HK.state, hs = st.houses[this.plot], b = HK.BUILDINGS.find(x => x.panel === 'house' && x.plot === this.plot);
    let h = this.head(HK.name(b), HK.t('house'));
    if (hs.owner !== 'player') h += `<p>${HK.t('houseOwnerNpc', { price: HK.fmt(hs.price) })}</p><button data-action="buyhouse" ${st.money >= hs.price ? '' : 'disabled'}>${HK.t('buyHouse', { price: HK.fmt(hs.price) })}</button>`;
    else {
      h += `<p><span class="tag gold">${HK.t('yours')}</span> ${HK.t('level', { level: hs.level })} · <b>${HK.t('rentPerDay', { rent: HK.houseRent(st, hs) })}</b>${hs.damaged ? ` · <span class="demand shortage">${HK.t('damaged')}</span>` : ''}</p><div class="btn-row">`;
      if (hs.damaged) h += `<button class="small" data-action="repairhouse" ${st.money >= 800 ? '' : 'disabled'}>${HK.t('repairHouse')}</button>`;
      if (hs.level < 3) h += `<button class="small" data-action="upgradehouse" ${st.money >= HK.CONST.HOUSE_UPGRADE ? '' : 'disabled'}>${HK.t('upgradeHouse', { cost: HK.fmt(HK.CONST.HOUSE_UPGRADE) })}</button>`;
      h += `<button class="small danger" data-action="sellhouse">${HK.t('sellHouse', { price: HK.fmt(Math.round(hs.price * (0.7 + hs.level * 0.15))) })}</button></div>`;
    }
    return h;
  },
  panel_tavern() {
    const st = HK.state;
    let h = this.head(HK.t('tavern'), HK.t('tavernHint')) + `<section>${this.personRow('innkeeper')}`;
    h += st.tavernOwned ? `<p class="tag gold">${HK.t('tavernOwned', { income: HK.tavernIncome(st) })}</p>` : `<button class="small" data-action="buytavern" ${st.money >= HK.CONST.TAVERN_PRICE ? '' : 'disabled'}>${HK.t('buyTavern', { cost: HK.fmt(HK.CONST.TAVERN_PRICE) })}</button>`;
    h += `</section><section><h3>${HK.t('rumors')}</h3><button class="small" data-action="rumor" ${st.money >= HK.rumorCost(st) ? '' : 'disabled'}>${HK.t('rumor', { cost: HK.rumorCost(st) })}</button><ul class="log">${st.rumors.map(r => `<li><small>${HK.fmtDate(r.day)}</small> ${HK.t(r.key, r.vars)}</li>`).join('')}</ul></section>`;
    h += `<section><h3>${HK.t('gamble')}</h3><div class="btn-row"><label>${HK.t('bet')} <input id="bet-input" type="number" min="1" data-field="bet" value="${this.esc(this.inputs.bet)}"></label><button class="small" data-action="gamble" ${st.money >= (parseInt(this.inputs.bet, 10) || 0) && (parseInt(this.inputs.bet, 10) || 0) > 0 ? '' : 'disabled'}>🎲 ${HK.t('gamble')}</button></div></section>`;
    h += `<section><h3>${HK.t('hire')}</h3><div class="btn-row"><button class="small" data-action="spy" ${st.money >= HK.CONST.SPY_COST ? '' : 'disabled'}>${HK.t('hireSpy')}</button>${st.spyUntil > st.day ? `<small>${HK.t('spyActive', { days: st.spyUntil - st.day })}</small>` : ''}</div>
      <div class="btn-row"><button class="small" data-action="thugs" data-target="collect" ${st.money >= HK.thugCost(st) ? '' : 'disabled'}>${HK.t('hireThugsCollect', { cost: HK.thugCost(st) })}</button></div>
      <div class="btn-row">${HK.RIVALS.map(r => `<button class="small danger" data-action="thugs" data-target="${r.id}" ${st.money >= HK.thugCost(st) ? '' : 'disabled'}>${HK.t('hireThugsSabotage', { rival: r.name, cost: HK.thugCost(st) })}</button>`).join('')}</div></section>`;
    return h;
  },
  panel_bank() {
    const st = HK.state, amt = Math.max(0, parseInt(this.inputs.loan, 10) || 0), limit = HK.loanLimit(st);
    let h = this.head(HK.t('bank'), '') + `<section>${this.personRow('changer')}<table class="plain"><tr><td>${HK.t('yourLoan')}</td><td class="num">${HK.fmt(st.loan)} ${HK.t('mark')}</td></tr><tr><td>${HK.t('loanLimit')}</td><td class="num">${HK.fmt(limit)} ${HK.t('mark')}</td></tr></table><p class="hint">${HK.t('interestInfo', { pct: (HK.CONST.LOAN_RATE_DAILY * 36500).toFixed(1) })}</p>
      <div class="btn-row"><input id="loan-input" type="number" min="0" step="500" data-field="loan" value="${this.esc(this.inputs.loan)}"><button class="small" data-action="takeloan" ${amt > 0 && amt <= limit ? '' : 'disabled'}>${HK.t('takeLoan')}</button><button class="small" data-action="repayloan" ${amt > 0 && st.loan > 0 && st.money > 0 ? '' : 'disabled'}>${HK.t('repay')}</button></div></section>`;
    h += `<section><h3>${HK.t('lending')}</h3><p class="hint">${HK.t('lendingHint')}</p>${HK.law(st, 'usuryBan') ? `<p class="demand shortage">${HK.t('usuryWarning')}</p>` : ''}<table class="plain">${st.loanOffers.map(o => `<tr><td><b>${o.name}</b><br><small>${HK.fmt(o.amount)} ${HK.t('mark')} · ${HK.t('interest')} ${o.interest} % · ${HK.t('term', { days: o.days })} · ${HK.t('risk')}: ${HK.t(o.risk < 0.15 ? 'risk_low' : o.risk < 0.28 ? 'risk_mid' : 'risk_high')}</small></td><td class="num"><button class="small" data-action="lend" data-id="${o.id}" ${st.money >= o.amount ? '' : 'disabled'}>${HK.t('lend')}</button></td></tr>`).join('')}</table>`;
    if (st.loansOut.length) h += `<h4>${HK.t('outstanding')}</h4><table class="plain">${st.loansOut.map(l => `<tr><td>${l.name}</td><td class="num">${HK.fmt(l.amount)} +${l.interest} %</td><td class="num">${l.defaulted ? `<span class="demand shortage">${HK.t('defaulted')}</span>` : HK.t('dueIn', { days: Math.max(0, l.due - st.day) })}</td></tr>`).join('')}</table>`;
    return h + `</section>`;
  },
  panel_bailiff() {
    const st = HK.state;
    let h = this.head(HK.t('bailiff'), HK.t('bailiffHint', { name: HK.PERSON.bailiff.name })) + `<section><b>${HK.t('suspicion')}: ${Math.round(st.suspicion)}</b>${this.bar(st.suspicion, 'red')}${this.personRow('bailiff')}`;
    h += st.investigation ? `<p class="demand shortage">${HK.t('investigation', { days: st.investigation.days })}</p><button data-action="bribebailiff" ${st.money >= 1500 + st.suspicion * 20 ? '' : 'disabled'}>${HK.t('bribeBailiff', { cost: HK.fmt(1500 + Math.round(st.suspicion * 20)) })}</button>` : `<p class="hint">${HK.t('noInvestigation')}</p>`;
    return h + `</section>`;
  },
  panel_shipyard() {
    const st = HK.state;
    let h = this.head(HK.t('shipyard'), HK.t('shipyardHint', { name: HK.PERSON.shipwright.name })) + `<section>${this.personRow('shipwright')}<div class="btn-row"><button data-action="buyship" ${st.money >= HK.CONST.SHIP_PRICE && st.ownShips.length < 3 ? '' : 'disabled'}>${HK.t('buyShip', { cost: HK.fmt(HK.CONST.SHIP_PRICE) })}</button>
      <button data-action="buyboat" ${st.money >= HK.CONST.BOAT_PRICE && st.boats < HK.CONST.BOAT_MAX ? '' : 'disabled'}>${HK.t('buyBoat', { cost: HK.fmt(HK.CONST.BOAT_PRICE), fish: HK.CONST.BOAT_FISH })}</button> <small>${HK.t('boats')}: ${st.boats}/${HK.CONST.BOAT_MAX}</small></div></section>`;
    if (st.ownShips.length) h += `<section><h3>${HK.t('ownShips')}</h3><table class="plain">${st.ownShips.map(s => `<tr><td><b>${this.esc(s.name)}</b> <small>${HK.t('hull')} ${s.hull} %</small></td><td class="num">${s.status === 'port' ? `<button class="small" data-action="repairship" data-id="${s.id}" ${s.hull < 100 && st.money >= (100 - s.hull) * 30 ? '' : 'disabled'}>${HK.t('repairShip', { cost: HK.fmt((100 - s.hull) * 30) })}</button> <button class="small danger" data-action="sellship" data-id="${s.id}">${HK.t('sellShip', { price: HK.fmt(Math.round(HK.CONST.SHIP_PRICE * 0.6 * s.hull / 100)) })}</button>` : `<small>${HK.t('away', { dest: HK.name(HK.ORIGIN[s.dest]), days: s.daysLeft })}</small>`}</td></tr>`).join('')}</table></section>`;
    return h;
  },
  panel_fishermen() {
    const st = HK.state, price = Math.round(HK.GOOD.fish.base * 0.6);
    return this.head(HK.t('fishermen'), HK.t('fishermenHint', { qty: st.hutFish || 0, price })) + `<section>${this.qtyRow()}<button data-action="hutfish" ${(st.hutFish || 0) > 0 ? '' : 'disabled'}>${HK.t('buyFish')}</button> <small>${HK.t('boats')}: ${st.boats}</small></section>`;
  },
  panel_bathhouse() {
    const st = HK.state;
    let h = this.head(HK.t('bathhouse'), '');
    if (HK.law(st, 'bathBan')) h += `<p class="demand shortage">${HK.t('bathClosed')}</p>`;
    h += st.bathhouseOwned ? `<p class="tag gold">${HK.t('yours')}: ${HK.bathIncome(st)} ${HK.t('mark')}/${HK.t('day')}</p>` : `<button data-action="buybath" ${st.money >= HK.CONST.BATHHOUSE_PRICE ? '' : 'disabled'}>${HK.t('buyBathhouse', { cost: HK.fmt(HK.CONST.BATHHOUSE_PRICE) })}</button>`;
    return h;
  },
  /* ---------- Neue Viertel: Betriebe, Speicher, Spelunke, Kloster, Spital, Schule, Hafenmeister, Zunft, Fischmarkt ---------- */
  selBuilding() { return HK.Scene.selected && HK.BUILDING[HK.Scene.selected]; },
  panel_venture() {
    const st = HK.state, b = this.selBuilding(), v = b && HK.VENTURE[b.id]; if (!v) return '';
    const o = st.ventures[v.id], cost = HK.ventureCost(st, v);
    let h = this.head(HK.name(v), HK.t('vEffect_' + (v.effect || 'plain')));
    h += `<section><p>${HK.t('ventureBase', { income: v.income })}${v.inp ? ` · ${HK.t('ventureInput', { good: HK.goodName(v.inp) })}` : ''}${v.craft ? ` · <span class="tag">${HK.t('needsCraft')}</span>` : ''}</p>`;
    if (!o) h += `<button data-action="buyventure" data-id="${v.id}" ${st.money >= cost && (!v.craft || st.craftGuild) ? '' : 'disabled'}>${HK.t('buyVenture', { cost: HK.fmt(cost) })}</button>${v.craft && !st.craftGuild ? `<p class="hint">${HK.t('needCraftGuild')}</p>` : ''}`;
    else {
      h += `<p><span class="tag gold">${HK.t('yours')}</span> ${HK.t('ventureLevel', { level: o.level })} · <b>${HK.t('ventureIncome', { income: HK.ventureIncome(st, v.id) })}</b>${v.inp && HK.ventureSupply(st, v) < 0.8 ? ` · <span class="demand shortage">${HK.t('supplyLow', { good: HK.goodName(v.inp) })}</span>` : ''}</p><div class="btn-row">`;
      if (o.level < HK.CONST.VENTURE_MAX_LEVEL) h += `<button class="small" data-action="upgradeventure" data-id="${v.id}" ${st.money >= Math.round(v.cost * HK.CONST.VENTURE_UPGRADE) ? '' : 'disabled'}>${HK.t('upgradeVenture', { cost: HK.fmt(Math.round(v.cost * HK.CONST.VENTURE_UPGRADE)) })}</button>`;
      h += `<button class="small danger" data-action="sellventure" data-id="${v.id}">${HK.t('sellVenture', { price: HK.fmt(Math.round(v.cost * (0.5 + o.level * 0.1))) })}</button></div>`;
    }
    return h + `</section>`;
  },
  panel_storage() {
    const st = HK.state, i = this.plot, def = HK.STORAGES[i], sg = st.storages[i], b = HK.BUILDINGS.find(x => x.panel === 'storage' && x.plot === i);
    let h = this.head(HK.name(b), HK.t('storageHint', { cap: def.cap })) + `<section>`;
    if (sg.owner !== 'player') h += `<button data-action="buystorage" ${st.money >= def.price ? '' : 'disabled'}>${HK.t('buyStorage', { price: HK.fmt(def.price) })}</button>`;
    else {
      h += `<p><span class="tag gold">${HK.t('yours')}</span> ${sg.mode === 'own' ? HK.t('storageOwn', { cap: def.cap }) : `<b>${HK.t('storageRent', { rent: HK.storageRent(st, i) })}</b>`}</p><div class="btn-row"><button class="small" data-action="togglestorage">${HK.t(sg.mode === 'own' ? 'useRent' : 'useOwn')}</button><button class="small danger" data-action="sellstorage">${HK.t('sellStorage', { price: HK.fmt(Math.round(def.price * 0.7)) })}</button></div>`;
    }
    return h + `</section>`;
  },
  panel_dive() {
    const st = HK.state, v = HK.VENTURE.dive, o = st.dive.offer, q = this.qty();
    let h = this.head(HK.name(v), HK.t('diveHint')) + `<section>${this.personRow('divekeeper')}`;
    h += st.ventures.dive ? `<p class="tag gold">${HK.t('diveOwned', { income: HK.ventureIncome(st, 'dive') })}</p>` : `<button class="small" data-action="buyventure" data-id="dive" ${st.money >= v.cost ? '' : 'disabled'}>${HK.t('buyVenture', { cost: HK.fmt(v.cost) })}</button>`;
    h += `</section><section><h3>${HK.t('contraband')}</h3>`;
    if (o && o.qty > 0) h += `<p>${HK.t('contrabandOffer', { qty: o.qty, good: HK.goodName(o.good), price: o.price, base: HK.GOOD[o.good].base })}</p>${this.qtyRow()}<button data-action="contraband" ${st.money >= o.price && HK.whFree(st) > 0 ? '' : 'disabled'}>${HK.t('buyContraband')}</button>`;
    else h += `<p class="hint">${HK.t('contrabandNone')}</p>`;
    h += `</section><section><h3>${HK.t('fence')}</h3><p class="hint">${HK.t('fenceHint', { cap: HK.CONST.FENCE_CAP - (st.dive.fenced || 0) })}</p><table class="plain">${HK.GOODS.filter(g => (st.warehouse.stock[g.id] || 0) >= 1).map(g => `<tr><td>${HK.goodName(g.id)} <small>(${Math.floor(st.warehouse.stock[g.id])})</small></td><td class="num">${HK.fencePrice(st, g.id)}</td><td class="num"><button class="small" data-action="fence" data-good="${g.id}" ${HK.CONST.FENCE_CAP - (st.dive.fenced || 0) > 0 ? '' : 'disabled'}>${HK.t('sell')}</button></td></tr>`).join('') || `<tr><td class="hint">${HK.t('empty')}</td></tr>`}</table></section>`;
    h += `<section><h3>${HK.t('shadyDeals')}</h3><div class="btn-row"><button class="small" data-action="bribewatch" ${st.watchUntil > st.day || st.money < HK.CONST.WATCH_BRIBE ? 'disabled' : ''}>${HK.t('bribeWatch', { cost: HK.CONST.WATCH_BRIBE, days: HK.CONST.WATCH_DAYS })}</button>${st.watchUntil > st.day ? `<small>${HK.t('watchActive', { days: st.watchUntil - st.day })}</small>` : ''}</div>`;
    const dmg = st.ownShips.filter(s => s.status === 'port' && s.hull < 100);
    if (dmg.length) h += `<div class="btn-row">${dmg.map(s => `<button class="small" data-action="sailors" data-id="${s.id}" ${st.money >= HK.CONST.SAILORS_COST ? '' : 'disabled'}>${HK.t('hireSailors', { ship: this.esc(s.name), cost: HK.CONST.SAILORS_COST })}</button>`).join('')}</div>`;
    return h + `</section>`;
  },
  panel_monastery() {
    const st = HK.state;
    let h = this.head(HK.t('monastery'), HK.t('monasteryHint')) + `<section>${this.personRow('abbot')}</section>`;
    h += `<section><h3>${HK.t('monkGoods')}</h3>${this.qtyRow()}<table class="plain">${['beer', 'wax'].map(g => `<tr><td>${HK.goodName(g)} <small>(${st.monastery.stock[g] || 0})</small></td><td class="num">${HK.monkPrice(st, g)} ${HK.t('mark')}</td><td class="num"><button class="small" data-action="buymonk" data-good="${g}" ${(st.monastery.stock[g] || 0) > 0 && st.money >= HK.monkPrice(st, g) ? '' : 'disabled'}>${HK.t('buy')}</button></td></tr>`).join('')}</table></section>`;
    h += `<section><h3>${HK.t('piety')}</h3><div class="btn-row"><button class="small" data-action="relic" ${st.money >= HK.CONST.RELIC_COST && !(st.relicDay !== undefined && st.day - st.relicDay < 365) ? '' : 'disabled'}>${HK.t('relic', { cost: HK.fmt(HK.CONST.RELIC_COST) })}</button>${st.relicDay !== undefined && st.day - st.relicDay < 365 ? `<small>${HK.t('relicDone', { days: 365 - (st.day - st.relicDay) })}</small>` : ''}</div>
      <div class="btn-row"><button class="small" data-action="scriptorium" ${st.money >= HK.CONST.SCRIPT_COST && !(st.scriptUntil > st.day) ? '' : 'disabled'}>${HK.t('scriptorium', { cost: HK.CONST.SCRIPT_COST, days: HK.CONST.SCRIPT_DAYS })}</button>${st.scriptUntil > st.day ? `<small>${HK.t('scriptActive', { days: st.scriptUntil - st.day })}</small>` : ''}</div></section>`;
    if (HK.knowsIncoming(st)) h += this.incomingList();
    return h;
  },
  incomingList() {
    const st = HK.state;
    return `<section><h3>${HK.t('incomingList')}</h3><ul class="log">${st.incoming.length ? st.incoming.map(i => `<li>${HK.t(i.sea ? 'rumorShip' : 'rumorCaravan', { origin: HK.name(HK.ORIGIN[i.origin]), days: Math.max(0, i.days), goods: Object.keys(HK.ORIGIN[i.origin].sell).map(HK.goodName).join(', ') })}</li>`).join('') : `<li>${HK.t('none')}</li>`}</ul></section>`;
  },
  panel_hospital() {
    const st = HK.state;
    let h = this.head(HK.t('hospital'), HK.t('hospitalHint')) + `<section><p>${HK.t('hospitalGiven', { amount: HK.fmt(st.hospitalGiven || 0) })}</p><div class="btn-row"><button class="small" data-action="hospitaldonate" ${st.money >= HK.CONST.HOSPITAL_DONATION ? '' : 'disabled'}>${HK.t('hospitalDonate', { cost: HK.fmt(HK.CONST.HOSPITAL_DONATION) })}</button></div>`;
    h += st.hospitalEndowed ? `<p class="tag gold">${HK.t('hospitalEndowed')}</p>` : `<div class="btn-row"><button class="small" data-action="hospitalendow" ${st.money >= HK.CONST.HOSPITAL_ENDOW ? '' : 'disabled'}>${HK.t('hospitalEndow', { cost: HK.fmt(HK.CONST.HOSPITAL_ENDOW) })}</button></div>`;
    return h + `</section>`;
  },
  panel_school() {
    const st = HK.state, cd = st.schoolDay !== undefined && st.day - st.schoolDay < 30;
    let h = this.head(HK.t('school'), HK.t('schoolHint')) + `<section>${this.personRow('schoolmaster')}<div class="btn-row"><button class="small" data-action="schooldonate" ${st.money >= HK.CONST.SCHOOL_DONATION && !cd ? '' : 'disabled'}>${HK.t('schoolDonate', { cost: HK.fmt(HK.CONST.SCHOOL_DONATION) })}</button>${cd ? `<small>${HK.t('schoolCooldown', { days: 30 - (st.day - st.schoolDay) })}</small>` : ''}</div>`;
    h += st.schoolEndowed ? `<p class="tag gold">${HK.t('schoolEndowed')}</p>` : `<div class="btn-row"><button class="small" data-action="schoolendow" ${st.money >= HK.CONST.SCHOOL_ENDOW ? '' : 'disabled'}>${HK.t('schoolEndow', { cost: HK.fmt(HK.CONST.SCHOOL_ENDOW) })}</button></div>`;
    return h + `</section>`;
  },
  panel_harbourmaster() {
    const st = HK.state;
    let h = this.head(HK.t('harbourmaster'), HK.t('harbourmasterHint', { berths: st.town.berths, ships: st.ships.length })) + `<section>${this.personRow('harbourmaster')}
      <div class="btn-row"><button class="small" data-action="harbourbook" ${st.money >= HK.CONST.HARBOUR_BOOK && !(st.harbourBookUntil > st.day) ? '' : 'disabled'}>${HK.t('harbourBook', { cost: HK.CONST.HARBOUR_BOOK, days: HK.CONST.HARBOUR_BOOK_DAYS })}</button>${st.harbourBookUntil > st.day ? `<small>${HK.t('harbourBookActive', { days: st.harbourBookUntil - st.day })}</small>` : ''}</div>
      <div class="btn-row"><button class="small" data-action="berthpriority" ${st.money >= HK.berthPriorityCost(st) && st.ships.length ? '' : 'disabled'}>${HK.t('berthPriority', { cost: HK.fmt(HK.berthPriorityCost(st)) })}</button></div>
      <div class="btn-row"><button class="small" data-action="extraberth" ${st.money >= HK.CONST.EXTRA_BERTH && st.town.berths < HK.CONST.MAX_BERTHS ? '' : 'disabled'}>${HK.t('extraBerth', { cost: HK.fmt(HK.CONST.EXTRA_BERTH) })}</button> <small>${HK.t('berths')}: ${st.town.berths}/${HK.CONST.MAX_BERTHS}</small></div></section>`;
    if (HK.knowsIncoming(st)) h += this.incomingList();
    return h;
  },
  panel_craftguild() {
    const st = HK.state, fee = Math.round(HK.CONST.CRAFT_FEE * HK.craftDiscount(st));
    let h = this.head(HK.t('craftguild'), HK.t('craftHint', { fee: HK.fmt(fee) })) + `<section>${this.personRow('craftmaster')}`;
    h += st.craftGuild ? `<p class="tag gold">${HK.t('craftMember')}</p>` : `<button data-action="joincraft" ${st.money >= fee ? '' : 'disabled'}>${HK.t('joinCraft', { fee: HK.fmt(fee) })}</button>`;
    h += `</section><section><h3>${HK.t('ventures')}</h3><table class="plain">${HK.VENTURES.filter(v => v.craft).map(v => `<tr><td>${HK.name(v)}</td><td class="num">${st.ventures[v.id] ? `<span class="tag gold">${HK.t('yours')}</span>` : HK.fmt(HK.ventureCost(st, v)) + ' ' + HK.t('mark')}</td></tr>`).join('')}</table></section>`;
    if (st.craftGuild) h += `<section><div class="btn-row"><button class="small" data-action="apprentices" ${st.money >= HK.CONST.APPRENTICES && !(st.apprenticesUntil > st.day) ? '' : 'disabled'}>${HK.t('apprentices', { cost: HK.fmt(HK.CONST.APPRENTICES), days: HK.CONST.APPRENTICE_DAYS })}</button>${st.apprenticesUntil > st.day ? `<small>${HK.t('apprenticesActive', { days: st.apprenticesUntil - st.day })}</small>` : ''}</div>
      <div class="btn-row">${st.masterTitle ? `<span class="tag gold">${HK.t('masterTitleDone')}</span>` : `<button class="small" data-action="mastertitle" ${st.money >= HK.CONST.MASTER_TITLE && HK.ventureCount(st) >= 3 ? '' : 'disabled'}>${HK.t('masterTitle', { cost: HK.fmt(HK.CONST.MASTER_TITLE) })}</button>`}</div></section>`;
    return h;
  },
  panel_fishmarket() {
    const st = HK.state, cap = HK.CONST.FISHMARKET_CAP - (st.fishSold || 0);
    let h = this.head(HK.t('fishmarket'), HK.t('fishmarketHint', { cap })) + `<section>${this.qtyRow()}<table class="plain">${['fish', 'smokedfish'].map(g => `<tr><td>${HK.goodName(g)} <small>(${Math.floor(st.warehouse.stock[g] || 0)})</small></td><td class="num">${HK.fishmarketPrice(st, g)} ${HK.t('mark')}</td><td class="num"><button class="small" data-action="fishsell" data-good="${g}" ${cap > 0 && (st.warehouse.stock[g] || 0) >= 1 ? '' : 'disabled'}>${HK.t('sell')}</button></td></tr>`).join('')}</table></section>`;
    return h;
  },
  panel_person() {
    const p = HK.PERSON[this.person]; if (!p) return '';
    const link = { customs: 'customs', priest: 'church', bailiff: 'bailiff', innkeeper: 'tavern', changer: 'bank', guild: 'guild', shipwright: 'shipyard', mayor: 'townhall', abbot: 'monastery', craftmaster: 'craftguild', harbourmaster: 'harbourmaster', divekeeper: 'dive', schoolmaster: 'school' }[this.person];
    return this.head(p.name, p.title[HK.LANG] || p.title.de) + `<section>${this.personRow(this.person)}${link ? `<button class="small" data-action="open" data-panel="${link}">${HK.name(HK.BUILDINGS.find(b => b.panel === link))} →</button>` : ''}</section>`;
  },
  panel_encounter() {
    const e = this.encounter; if (!e) return '';
    const vars = Object.assign({}, e.vars);
    let h = `<section><p class="encounter">${HK.t(e.key, vars)}</p>`;
    if (e.action === 'alms') h += `<button class="small" data-action="enc" ${HK.state.money >= e.cost ? '' : 'disabled'}>${HK.t('alms', { cost: e.cost })}</button>`;
    if (e.action === 'cheapfish') h += `<button class="small" data-action="enc" ${HK.state.money >= e.cost ? '' : 'disabled'}>${HK.t('cheapFish', { cost: e.cost })}</button>`;
    return h + `</section>`;
  },

  /* ---------- Übersicht, Chronik ---------- */
  renderOverview() {
    const st = HK.state, worth = HK.netWorth(st), tot = HK.ledgerTotals(st);
    const rich = st.rivals.map(r => ({ name: HK.RIVALS.find(x => x.id === r.id).name, w: r.wealth })).concat([{ name: this.esc(st.name) + ' (' + HK.t('you') + ')', w: worth, me: true }]).sort((a, b) => b.w - a.w);
    let h = `<section><h2>${HK.t('overview')}</h2><p class="hint">${HK.t('goals')}</p><table class="plain">
      <tr><td>${HK.t('netWorth')}</td><td class="num"><b>${HK.fmt(worth)} ${HK.t('mark')}</b></td></tr><tr><td>${HK.t('rank')}</td><td class="num">${HK.name(HK.RANKS[st.rank])} · ${HK.t('seat_' + st.seat)}</td></tr>
      <tr><td>${HK.t('rep')}</td><td>${this.bar(st.rep)}</td></tr><tr><td>${HK.t('piety')}</td><td>${this.bar(st.piety, 'blue')}</td></tr><tr><td>${HK.t('suspicion')}</td><td>${this.bar(st.suspicion, 'red')}</td></tr>
      <tr><td>${HK.t('influence')}</td><td class="num">${Math.floor(st.influence)}</td></tr><tr><td>${HK.t('prosperity')}</td><td>${this.bar(st.town.prosperity, 'green')}</td></tr><tr><td>${HK.t('population')}</td><td class="num">${HK.fmt(st.town.pop)}</td></tr></table></section>`;
    h += `<section><h3>${HK.t('richest')}</h3><table class="plain">${rich.map((r, i) => `<tr class="${r.me ? 'me' : ''}"><td>${i + 1}. ${r.me ? '<b>' + r.name + '</b>' : r.name}</td><td class="num">${HK.fmt(r.w)}</td></tr>`).join('')}</table></section>`;
    const inc = Object.keys(tot).filter(k => tot[k] > 0).sort((a, b) => tot[b] - tot[a]);
    let sum = 0; for (const k in tot) sum += tot[k];
    h += `<section><h3>${HK.t('incomeSources')}</h3><table class="plain">${inc.map(k => `<tr><td>${HK.t('src_' + k)}</td><td class="num">+${HK.fmt(tot[k])}</td></tr>`).join('') || `<tr><td class="hint">–</td></tr>`}<tr><td><b>${HK.t('dailyIncome')}</b></td><td class="num"><b>${HK.fmt(sum / st.ledger.length)}</b></td></tr></table></section>`;
    const ev = st.town.events.map(e => `<span class="tag">${HK.t('evn_' + e.type)}</span>`); const se = HK.seasonEvent(st); if (se) ev.push(`<span class="tag gold">${HK.t('season_' + se.id)}</span>`);
    if (ev.length) h += `<section><h3>${HK.t('activeEvents')}</h3><p>${ev.join(' ')}</p></section>`;
    h += `<section><h3>${HK.t('chart')}</h3><canvas id="chart" width="460" height="200"></canvas></section>`;
    return h;
  },
  drawChart() {
    const cv = this.$('chart'); if (!cv) return;
    const ctx = cv.getContext('2d'), h = HK.state.history, W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H); if (h.length < 2) return;
    let min = Math.min(0, ...h.map(p => p.worth)), max = Math.max(...h.map(p => p.worth)); if (max === min) max = min + 1;
    const x = i => 44 + (W - 54) * i / (h.length - 1), y = v => H - 20 - (H - 30) * (v - min) / (max - min);
    ctx.strokeStyle = '#8a6d3b'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(44, 10); ctx.lineTo(44, H - 20); ctx.lineTo(W - 10, H - 20); ctx.stroke();
    ctx.fillStyle = '#5a4a2a'; ctx.font = '11px Georgia'; ctx.textAlign = 'right'; ctx.fillText(HK.fmt(max), 42, 14); ctx.fillText(HK.fmt(min), 42, H - 20);
    ctx.strokeStyle = '#1f5f8b'; ctx.lineWidth = 2; ctx.beginPath(); h.forEach((p, i) => i ? ctx.lineTo(x(i), y(p.worth)) : ctx.moveTo(x(i), y(p.worth))); ctx.stroke();
  },
  renderLog() { const st = HK.state; return st.log.length ? `<section><h2>${HK.t('tabLog')}</h2><ul class="log">${st.log.map(e => `<li class="${e.kind}"><small>${HK.fmtDate(e.day)}</small> ${this.logText(e)}</li>`).join('')}</ul></section>` : `<p class="hint">${HK.t('noLog')}</p>`; },

  /* ---------- Aktionen ---------- */
  result(r) { if (!r || !r.ok) { if (r && r.msg) this.toast(HK.t(r.msg), 'bad'); return false; } return true; },
  maxQty(kind, g, v) {
    const st = HK.state, free = HK.whFree(st);
    if (kind === 'vbuy') { let q = Math.min(free, v.cargo[g].qty); const unit = v.cargo[g].price * (1 + (this.inputs.smuggle ? 0 : HK.tariffRate(st) * (1 - HK.customsDiscount(st)))); return Math.max(0, Math.min(q, Math.floor(st.money / unit))); }
    if (kind === 'vsell') return Math.min(v.wants[g].qty, Math.floor(st.warehouse.stock[g] || 0));
    if (kind === 'mbuy') { let q = Math.min(free, Math.floor(st.town.stock[g] || 0)); while (q > 0 && HK.marketBuyPrice(st, g, q) * q > st.money) q = Math.floor(q * 0.9); return q; }
    if (kind === 'msell') return Math.min(HK.marketCap(st, g), Math.floor(st.warehouse.stock[g] || 0));
    return 0;
  },
  action(d) {
    const st = HK.state, a = d.action, q = this.qty();
    const v = HK.findVisitor(st, this.selectedVisitor);
    const ship = st.ownShips.find(s => s.id === this.selectedOwnShip);
    let r;
    switch (a) {
      case 'qty': this.inputs.qty = parseInt(d.n, 10); this.inputs.qtyAll = false; break;
      case 'qtyall': this.inputs.qtyAll = !this.inputs.qtyAll; break;
      case 'selvisitor': this.selectedVisitor = parseInt(d.id, 10); break;
      case 'selown': this.selectedOwnShip = parseInt(d.id, 10); break;
      case 'open': this.panel = d.panel; HK.Scene.selected = HK.BUILDINGS.find(b => b.panel === d.panel).id; break;
      case 'vbuy': case 'vsell': {
        if (!v) return; const n = Math.min(q, this.maxQty(a, d.good, v)); if (n <= 0) { this.toast(HK.t(a === 'vbuy' ? 'notEnoughMoney' : 'notEnoughCargo'), 'bad'); break; }
        r = a === 'vbuy' ? HK.buyFromVisitor(st, v, d.good, n, this.inputs.smuggle) : HK.sellToVisitor(st, v, d.good, n, this.inputs.smuggle);
        if (this.result(r)) { this.toast(HK.t(a === 'vbuy' ? 'bought' : 'sold', { qty: n, good: HK.goodName(d.good), cost: HK.fmt(r.cost) }), 'good', 1800); if (r.saved) this.toast(HK.t('smuggledOk', { saved: HK.fmt(r.saved) }), 'info', 1800); }
        break;
      }
      case 'mbuy': case 'msell': {
        const n = Math.min(q, this.maxQty(a, d.good)); if (n <= 0) { this.toast(HK.t(a === 'mbuy' ? 'notEnoughMoney' : 'notEnoughCargo'), 'bad'); break; }
        r = a === 'mbuy' ? HK.marketBuy(st, d.good, n) : HK.marketSell(st, d.good, n);
        if (this.result(r)) this.toast(HK.t(a === 'mbuy' ? 'bought' : 'sold', { qty: n, good: HK.goodName(d.good), cost: HK.fmt(r.cost) }), 'good', 1800);
        break;
      }
      case 'stall': this.result(HK.buyStall(st)); break;
      case 'expandwh': this.result(HK.expandWarehouse(st)); break;
      case 'gift': if (this.result(HK.gift(st, d.person))) this.toast(HK.t('giftDone', { name: HK.PERSON[d.person].name }), 'good', 2000); break;
      case 'donate': this.result(HK.donate(st, parseInt(d.amount, 10))); break;
      case 'indulgence': this.result(HK.indulgence(st)); break;
      case 'supply': r = HK.supplyChurch(st, d.good); if (this.result(r)) this.toast(HK.t('sold', { qty: '', good: HK.goodName(d.good), cost: HK.fmt(r.cost) }), 'good', 1800); break;
      case 'churchproject': this.result(HK.churchProject(st, d.id)); break;
      case 'sermon': this.result(HK.sermon(st, d.kind)); break;
      case 'propose': { const law = HK.LAWS[d.law]; const val = law.bool || d.law === 'tariff' || d.law === 'marketFee' ? parseInt(d.value, 10) : d.value; r = HK.propose(st, d.law, val); if (this.result(r)) this.toast(HK.t(r.passed ? 'motionPassed' : 'motionFailed', { law: HK.name(law), value: HK.lawValueText(d.law, val), yes: r.yes, no: r.no }), r.passed ? 'good' : 'bad', 4000); break; }
      case 'run': r = HK.runForSeat(st); if (this.result(r)) this.toast(HK.t(r.won ? (st.seat === 'mayor' ? 'becameMayor' : 'becameCouncillor') : 'electionLost', { support: 0, need: 0 }), r.won ? 'good' : 'bad', 4000); break;
      case 'project': this.result(HK.fundProject(st, d.id)); break;
      case 'taxfarm': this.result(HK.buyTaxFarm(st)); break;
      case 'paylevy': this.result(HK.payLevy(st)); break;
      case 'joinguild': this.result(HK.joinGuild(st)); break;
      case 'license': this.result(HK.buyLicense(st, d.type)); break;
      case 'buildws': this.result(HK.buildWorkshop(st, this.plot, d.type)); break;
      case 'demolishws': if (confirm(HK.t('demolish') + '?')) HK.demolishWorkshop(st, this.plot); break;
      case 'buyhouse': this.result(HK.buyHouse(st, this.plot)); break;
      case 'sellhouse': if (confirm(HK.t('sellHouse', { price: '' }) + '?')) HK.sellHouse(st, this.plot); break;
      case 'upgradehouse': this.result(HK.upgradeHouse(st, this.plot)); break;
      case 'repairhouse': this.result(HK.repairHouse(st, this.plot)); break;
      case 'buytavern': this.result(HK.buyTavern(st)); break;
      case 'buybath': this.result(HK.buyBathhouse(st)); break;
      case 'rumor': this.result(HK.buyRumor(st)); break;
      case 'gamble': r = HK.gamble(st, parseInt(this.inputs.bet, 10)); if (this.result(r)) this.toast(HK.t(r.won ? 'gambleWon' : 'gambleLost', { bet: HK.fmt(r.bet) }), r.won ? 'good' : 'bad', 2500); break;
      case 'spy': this.result(HK.hireSpy(st)); break;
      case 'thugs': r = HK.hireThugs(st, d.target); if (this.result(r) && r.nothing) this.toast(HK.t('thugsNothing'), 'info'); break;
      case 'takeloan': this.result(HK.takeLoan(st, parseInt(this.inputs.loan, 10))); break;
      case 'repayloan': this.result(HK.repayLoan(st, parseInt(this.inputs.loan, 10))); break;
      case 'lend': this.result(HK.lend(st, parseInt(d.id, 10))); break;
      case 'bribebailiff': this.result(HK.bribeBailiff(st)); break;
      case 'buyship': this.result(HK.buyShip(st)); break;
      case 'buyboat': this.result(HK.buyBoat(st)); break;
      case 'repairship': this.result(HK.repairShip(st, parseInt(d.id, 10))); break;
      case 'sellship': if (confirm(HK.t('sellShip', { price: '' }) + '?')) HK.sellOwnShip(st, parseInt(d.id, 10)); break;
      case 'load': if (ship) this.result(HK.loadShip(st, ship.id, d.good, Math.min(q, Math.floor(st.warehouse.stock[d.good] || 0), 120 - HK.stockUsed(ship.cargo)))); break;
      case 'unload': if (ship) this.result(HK.unloadShip(st, ship.id, d.good, Math.min(q, ship.cargo[d.good] || 0, HK.whFree(st)))); break;
      case 'send': if (ship) this.result(HK.sendShip(st, ship.id, this.inputs.dest, this.inputs.bring)); break;
      case 'hutfish': r = HK.buyFishFromHuts(st, Math.min(q, st.hutFish || 0, HK.whFree(st))); if (this.result(r)) this.toast(HK.t('bought', { qty: '', good: HK.goodName('fish'), cost: HK.fmt(r.cost) }), 'good', 1800); break;
      case 'enc': if (this.result(HK.encounterAction(st, this.encounter))) { this.encounter.action = null; } break;
      case 'buyventure': if (this.result(HK.buyVenture(st, d.id))) this.toast(HK.t('ventureBought', { venture: HK.name(HK.VENTURE[d.id]) }), 'good', 2500); break;
      case 'upgradeventure': this.result(HK.upgradeVenture(st, d.id)); break;
      case 'sellventure': if (confirm(HK.t('sellVenture', { price: '' }) + '?')) HK.sellVenture(st, d.id); break;
      case 'buystorage': this.result(HK.buyStorage(st, this.plot)); break;
      case 'togglestorage': this.result(HK.toggleStorage(st, this.plot)); break;
      case 'sellstorage': if (confirm(HK.t('sellStorage', { price: '' }) + '?')) this.result(HK.sellStorage(st, this.plot)); break;
      case 'joincraft': this.result(HK.joinCraftGuild(st)); break;
      case 'apprentices': this.result(HK.hireApprentices(st)); break;
      case 'mastertitle': this.result(HK.masterTitle(st)); break;
      case 'contraband': r = HK.buyContraband(st, q); if (this.result(r)) this.toast(HK.t('bought', { qty: r.qty, good: HK.goodName(st.dive.offer.good), cost: HK.fmt(r.cost) }), 'good', 1800); break;
      case 'fence': r = HK.fenceSell(st, d.good, q); if (this.result(r)) this.toast(HK.t('sold', { qty: r.qty, good: HK.goodName(d.good), cost: HK.fmt(r.cost) }), 'good', 1800); break;
      case 'bribewatch': this.result(HK.bribeWatch(st)); break;
      case 'sailors': this.result(HK.hireSailors(st, parseInt(d.id, 10))); break;
      case 'buymonk': r = HK.buyFromMonks(st, d.good, q); if (this.result(r)) this.toast(HK.t('bought', { qty: r.qty, good: HK.goodName(d.good), cost: HK.fmt(r.cost) }), 'good', 1800); break;
      case 'relic': this.result(HK.donateRelic(st)); break;
      case 'scriptorium': this.result(HK.buyScriptorium(st)); break;
      case 'hospitaldonate': this.result(HK.hospitalDonate(st)); break;
      case 'hospitalendow': this.result(HK.hospitalEndow(st)); break;
      case 'schooldonate': this.result(HK.schoolDonate(st)); break;
      case 'schoolendow': this.result(HK.schoolEndow(st)); break;
      case 'harbourbook': this.result(HK.buyHarbourBook(st)); break;
      case 'berthpriority': this.result(HK.berthPriority(st)); break;
      case 'extraberth': this.result(HK.buyExtraBerth(st)); break;
      case 'fishsell': r = HK.fishmarketSell(st, d.good, q); if (this.result(r)) this.toast(HK.t('sold', { qty: r.qty, good: HK.goodName(d.good), cost: HK.fmt(r.cost) }), 'good', 1800); break;
    }
    this.renderAll();
  },
};
