/* Havenrode's district navigation and restrained UI, adapted to Sundhaven's existing systems. */
'use strict';
Object.assign(HK.I18N.de,{
  mapOptions:'Ansicht',timeControl:'Zeit · {speed}',timeStopped:'Pause',resumeTime:'Zeit fortsetzen',
  menuPlaces:'Stadtbereiche',ruralNav:'Umland',ruralNavShort:'Umland',ruralNavSub:'',menuBooks:'Bücher',backToPlace:'Zurück zum Ort',missionsNav:'Aufträge',
  officeNav:'Handelshaus',officeNavShort:'Handelshaus',sectionNavigation:'Unterseiten',marketSub:'Markt',ruralSub:'Höfe & Betriebe',ruralFieldsSub:'Acker & Vieh',ruralMillSub:'Mühle & Verarbeitung',ruralForestSub:'Wald & Stein',ruralDeliveriesSub:'Lieferungen',caravanSub:'Karawanen',marketPricesSub:'Preise & Verlauf',marketStallsSub:'Marktstände',kontorSub:'Kontor',warehouseSub:'Lagerhaus',staffSub:'Personal',agreementsSub:'Verträge',harbourSub:'Hafen',fleetSub:'Flotte & Versorgung',foreignSub:'Außenhandel & Routen',shipyardSub:'Werft',councilSub:'Rathaus',navBooks:'Bücher',navTownhall:'Rathaus',navRightsOffices:'Rechte & Ämter',navLaws:'Gesetze',navMonopolyLease:'Monopolpacht',navTownProjects:'Städtische Vorhaben',navCustomsLease:'Zollpacht',
  agreementDeliveries:'Bezahlte Lieferungen',agreementTreaties:'Aktive Städteabkommen',agreementRoutes:'Gespeicherte Außenhandelsrouten',agreementNone:'Keine offenen Vereinbarungen.',
  marketTradeNow:'Am Markt handeln',marketPricesSelect:'Ware ansehen',marketStallEffect:'Jeder Marktstand erhöht den Absatz um 35 % und den Verkaufspreis um 4 %. Der Ausbau beginnt nach Bezahlung und dauert zwei Tage.',marketStallOwned:'Deine Stände: {n} von {max}',marketStallBuilding:'Im Bau bis {date} · noch {days} Tage',marketStallNoBuild:'Zurzeit wird kein Marktstand errichtet.',marketStallView:'Marktplatz auf der Karte zeigen',
  placeContext:'In Sundhaven',conversationContext:'Im Gespräch',ruralContext:'Höfe & Handwerk',
  overviewNavHint:'Vermögen, Entwicklung und Ziele',planningNavHint:'Waren beschaffen und Lieferungen planen',missionsNavHint:'Aufträge & Missionen: Fortschritt und Fristen',logNavHint:'Erlebnisse und eigene Notizen',mailNavHint:'Post, Kontakte und Neuigkeiten',
  councilLawsHelp:'Jeder Antrag kostet 20 Einfluss. Danach stimmt der Rat ab; die Änderung ist nicht garantiert. Bei Annahme erhältst du 5 Einfluss zurück. Einen eigenen Ratssitz brauchst du zum Beantragen nicht.',
  pardonNeedRep:'Für eine reine Weste brauchst du Ruf 50; ein Ratssitz genügt dafür nicht.',
  lawMotionCost:'20 Einfluss je Antrag',lawMissingInfluence:'Dir fehlen {n} Einfluss',lawEnact:'Einführung beantragen',lawRepeal:'Aufhebung beantragen',lawChangeValue:'Auf {value} ändern',lawRequestValue:'{value} beantragen',
});
Object.assign(HK.I18N.en,{
  mapOptions:'View',timeControl:'Time · {speed}',timeStopped:'Paused',resumeTime:'Resume time',
  menuPlaces:'Town areas',ruralNav:'Countryside',ruralNavShort:'Rural',ruralNavSub:'',menuBooks:'Books',backToPlace:'Back to location',missionsNav:'Missions',
  officeNav:'Trading house',officeNavShort:'Trading house',sectionNavigation:'Sections',marketSub:'Market',ruralSub:'Farms & producers',ruralFieldsSub:'Fields & livestock',ruralMillSub:'Mill & processing',ruralForestSub:'Forest & stone',ruralDeliveriesSub:'Deliveries',caravanSub:'Caravans',marketPricesSub:'Prices & history',marketStallsSub:'Market stalls',kontorSub:'Counting house',warehouseSub:'Warehouse',staffSub:'Staff',agreementsSub:'Agreements',harbourSub:'Harbour',fleetSub:'Fleet & supplies',foreignSub:'Foreign trade & routes',shipyardSub:'Shipyard',councilSub:'Town hall',navBooks:'Books',navTownhall:'Town hall',navRightsOffices:'Rights & offices',navLaws:'Laws',navMonopolyLease:'Monopoly lease',navTownProjects:'Town projects',navCustomsLease:'Customs lease',
  agreementDeliveries:'Prepaid deliveries',agreementTreaties:'Active city treaties',agreementRoutes:'Saved foreign trade routes',agreementNone:'No open agreements.',
  marketTradeNow:'Trade at market',marketPricesSelect:'View this good',marketStallEffect:'Each market stall increases sales volume by 35 % and the sale price by 4 %. Construction starts after payment and takes two days.',marketStallOwned:'Your stalls: {n} of {max}',marketStallBuilding:'Under construction until {date} · {days} days left',marketStallNoBuild:'No market stall is under construction.',marketStallView:'Show the market square on the map',
  placeContext:'In Sundhaven',conversationContext:'In conversation',ruralContext:'Farms & crafts',
  overviewNavHint:'Wealth, progress and goals',planningNavHint:'Source goods and plan deliveries',missionsNavHint:'Contracts & missions: progress and deadlines',logNavHint:'Events and personal notes',mailNavHint:'Letters, contacts and news',
  councilLawsHelp:'Each motion costs 20 influence. The council then votes; the change is not guaranteed. A successful motion returns 5 influence. You do not need a council seat to propose a motion.',
  pardonNeedRep:'A clean slate requires reputation 50; a council seat is not enough.',
  lawMotionCost:'20 influence per motion',lawMissingInfluence:'You need {n} more influence',lawEnact:'Propose enactment',lawRepeal:'Propose repeal',lawChangeValue:'Change to {value}',lawRequestValue:'Propose {value}',
});
HK.Presentation = {
  districts: {
    market: { x: 14.5, y: 10.2, zoom: 1.65 },
    harbour: { x: 14.0, y: 18.6, zoom: 1.65 },
    church: { x: 15.0, y: 3.8, zoom: 1.8 },
    craft: { x: 26.0, y: 10.0, zoom: 1.8 },
    east: { x: 33.5, y: 8.7, zoom: 1.65 },
    gate: { x: 20.0, y: 0.5, zoom: 1.65 },
    all: null,
  },
  syncView() {
    const S = HK.Scene, U = HK.UI;
    const zoom = U.$('view-zoom'), select = U.$('view-district'), title = U.$('map-location');
    if (zoom) zoom.textContent = Math.round(S.cam.z * 100) + ' %';
    if (select) select.value = S.district || 'custom';
    if (title) title.textContent = HK.t('district_' + (S.district || 'custom'));
    const out = document.querySelector('#zoom-ctl [data-zoom=out]'), inside = document.querySelector('#zoom-ctl [data-zoom=in]');
    if (out) out.disabled = S.cam.z <= S.zoomMin() + 0.001;
    if (inside) inside.disabled = S.cam.z >= S.ZOOM_MAX - 0.001;
  },
  translate() {
    const select = HK.UI.$('view-district');
    if (select) {
      const selected = HK.Scene.district || 'market';
      select.replaceChildren();
      for (const id of [...Object.keys(this.districts), 'custom']) {
        const option = document.createElement('option'); option.value = id; option.textContent = HK.t('district_' + id);
        // A custom camera is reported here; choosing a named quarter restores its framing.
        if (id === 'custom') option.disabled = true;
        select.appendChild(option);
      }
      select.value = selected;
    }
    document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', HK.t(el.dataset.i18nAria)));
    const nav = { market: 'tradeNav', kontor: 'officeNav', harbour: 'shippingNav', townhall: 'councilNav', rural: 'ruralNav', books:'navBooks' };
    document.querySelectorAll('#city-links [data-place]').forEach(button => {
      const place=button.dataset.place;
      button.innerHTML = HK.MenuArt.section(place, 'nav-picture') + `<span>${HK.t(nav[place])}</span>${place==='books'?'<span id="books-badge" class="badge" hidden></span>':''}`;
      button.setAttribute('aria-label',HK.t(nav[button.dataset.place]));
    });
    this.renderNavigation();
    document.querySelectorAll('#city-links [data-place]').forEach(button=>{
      const active=this.currentArea()===button.dataset.place;
      button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
    });
    this.syncView();
  },
  renderNavigation() {
    const area=this.currentArea(), sections={
      market:[['market','marketSub'],['gate','caravanSub'],['marketPrices','marketPricesSub'],['marketStalls','marketStallsSub']],
      kontor:[['kontor','kontorSub'],['warehouse','warehouseSub'],['staff','staffSub'],['agreements','agreementsSub']],
      harbour:[['harbour','harbourSub'],['fleet','fleetSub'],['foreign','foreignSub'],['shipyard','shipyardSub']],
      townhall:[['townhall','navTownhall'],['rightsOffices','navRightsOffices'],['laws','navLaws'],['monopolyLease','navMonopolyLease'],['townProjects','navTownProjects'],['customsLease','navCustomsLease']],
      rural:[['rural','ruralSub'],['ruralFields','ruralFieldsSub'],['ruralMill','ruralMillSub'],['ruralForest','ruralForestSub'],['ruralDeliveries','ruralDeliveriesSub']],
    };
    const sub=this.$areaLinks(),dest=document.getElementById('area-destinations'),tabs=document.getElementById('tabs'),key=HK.LANG+':'+(area||'none');
    sub.setAttribute('aria-label',HK.t('sectionNavigation'));
    if(dest.dataset.structure!==key){
      dest.innerHTML=(sections[area]||[]).map(([panel,label])=>`<button type="button" data-panel="${panel}">${HK.MenuArt.section(panel,'section-picture')}<span>${HK.t(label)}</span></button>`).join('');
      dest.dataset.structure=key;
    }
    const isBooks=area==='books';
    dest.hidden=isBooks;
    tabs.hidden=!isBooks;
    sub.hidden=!area;
    const current=HK.UI.ruralNavPanel?.()||HK.UI.panel;
    dest.querySelectorAll('[data-panel]').forEach(button=>button.setAttribute('aria-current',HK.UI.tab==='place'&&button.dataset.panel===current?'page':'false'));
    document.querySelectorAll('#tabs [data-tab]').forEach(button => {
      if (!button.querySelector('.section-picture')) button.insertAdjacentHTML('afterbegin',HK.MenuArt.section(button.dataset.tab,'section-picture'));
      button.title=HK.t(button.dataset.tab+'NavHint');
    });
  },
  renderNavigationState(){
    this.renderNavigation();
    document.querySelectorAll('#city-links [data-place]').forEach(button=>{
      const active=this.currentArea()===button.dataset.place;
      button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
    });
    document.querySelectorAll('#tabs [data-tab]').forEach(button=>{const active=button.dataset.tab===HK.UI.tab;button.classList.toggle('active',active);button.setAttribute('aria-current',active?'page':'false');});
    this.updateBooksBadge();
  },
  updateBooksBadge(){
    const badge=document.getElementById('books-badge'),st=HK.state;if(!badge)return;
    const mail=st?.post?.messages?.filter(m=>!m.read&&!m.archived).length||0;
    const missions=HK.UI.missionRecords?.().filter(m=>m.status==='active').length||0;
    const count=(HK.UI.unread||0)+mail+missions;
    badge.textContent=count||'';badge.hidden=!count;
    badge.setAttribute('aria-label',count?String(count):'');
  },
  $areaLinks(){return document.getElementById('area-links');},
  currentArea(){return HK.UI.tab==='place'?this.areaForPanel(HK.UI.panel):'books';},
  areaForPanel(panel){
    if(['market','gate','marketPrices','marketStalls'].includes(panel))return 'market';
    if(['kontor','warehouse','staff','agreements','bank'].includes(panel))return 'kontor';
    if(['harbour','fleet','foreign','shipyard'].includes(panel))return 'harbour';
    if(['townhall','rightsOffices','laws','monopolyLease','townProjects','customsLease'].includes(panel))return 'townhall';
    if(['rural','ruralFields','ruralMill','ruralForest','ruralDeliveries'].includes(panel))return 'rural';
    return null;
  },
  openPlace(panel) {
    if (!HK.state || HK.preview) return;
    if(panel==='books'){HK.UI.setTab('overview');return;}
    if(['overview','planning','missions','log','mail'].includes(panel)){HK.UI.setTab(panel);return;}
    if(panel==='gate'){
      HK.UI.returnContext=null;HK.UI.panel='gate';HK.UI.selectedVisitor=HK.state.caravans.find(c=>c.id===HK.UI.selectedVisitor)?.id??HK.state.caravans[0]?.id??null;
      HK.UI.setTab('place');HK.Scene.selected='gate';HK.Scene.focusDistrict('gate');HK.UI.renderAll();return;
    }
    if(['marketPrices','marketStalls'].includes(panel)){
      HK.UI.returnContext=null;HK.UI.panel=panel;HK.UI.setTab('place');HK.Scene.selected='market';HK.Scene.focusDistrict('market');HK.UI.renderAll();return;
    }
    HK.UI.returnContext=null;
    if(panel==='market'||panel==='harbour'||panel==='townhall'){
      const b=HK.BUILDINGS.find(x=>x.panel===panel);if(!b)return;
      HK.UI.panel=panel;HK.Scene.selected=b.id;
      if(panel==='harbour')HK.UI.selectedVisitor=HK.state.ships[0]?.id||null;
      else HK.UI.selectedVisitor=null;
      HK.UI.setTab('place');
      if(panel==='harbour')HK.UI.selectedVisitor=HK.state.ships[0]?.id||null;
      HK.Scene.focusDistrict(panel==='harbour'?'harbour':'market');HK.UI.renderAll();return;
    }
    if(this.areaForPanel(panel)==='rural'){HK.UI.action({action:'ruralopen',section:panel});return;}
    if(panel==='staff'||panel==='agreements'||panel==='fleet'||panel==='foreign'){
      HK.UI.panel=panel; HK.UI.setTab('place');
      const district=panel==='fleet'||panel==='foreign'?'harbour':'market';HK.Scene.focusDistrict(district);HK.UI.renderAll();return;
    }
    if(typeof HK.UI['panel_'+panel]==='function'){
      HK.UI.panel=panel;HK.UI.setTab('place');HK.Scene.focusDistrict('market');HK.UI.renderAll();return;
    }
    const b = HK.BUILDINGS.find(b => b.panel === panel);
    if (!b) return;
    HK.UI.sceneClick({ kind: 'building', building: b, panel });
    if (panel === 'harbour') HK.UI.selectedVisitor = HK.state.ships[0] ? HK.state.ships[0].id : null;
    HK.Scene.focusDistrict({ market: 'market', kontor: 'market', warehouse: 'market', harbour: 'harbour', townhall: 'market' }[panel]);
    HK.UI.renderAll();
  },
};

Object.assign(HK.I18N.de, {
  goodGroup: 'Warengruppe', goodGroup_all: 'Alle Waren', goodGroup_food: 'Lebensmittel', goodGroup_materials: 'Baustoffe & Handwerk', goodGroup_maritime: 'Schiffsbedarf', goodGroup_textiles: 'Fasern & Tuche', goodGroup_luxury: 'Kostbare Waren',
  brandSubtitle: 'Sundhaven · Anno 1372', cityEyebrow: 'Sundhaven · Hansestadt', cityAtmosphere: 'Seewind, Segeltuch und volle Speicher.',
  yourHouse: 'Dein Handelshaus', tradeNav: 'Handel', officeNav: 'Handelshaus', shippingNav: 'Seefahrt', councilNav: 'Rat', cityNavigation: 'Navigation der Stadt',
  districtLabel: 'Stadtviertel anzeigen', district_market: 'Markt & Kontor', district_harbour: 'Der große Hafen', district_church: 'Kirche & Gilde',
  district_craft: 'Das Handwerkerviertel', district_east: 'Im Ostviertel', district_gate: 'Neustadt & Nordtor', district_all: 'Sundhaven · Gesamtansicht', district_custom: 'Sundhaven · Freie Ansicht',
  zoomIn: 'Vergrößern', zoomOut: 'Verkleinern', zoomLevel: 'Zoomstufe', viewAll: 'Gesamtansicht', nextDay: 'Nächster Tag →', gameSpeed: 'Spielgeschwindigkeit',
  timePaused: 'Die Stadt wartet auf dich', timeRunning: 'Zeit läuft · ein Tag in {seconds} Sekunden', timeRunningMinutes: 'Zeit läuft · ein Tag in {minutes} Minuten',
  chooseGood: 'Ware auswählen', tradeGood: '{good} handeln', inYourWarehouse: '{qty} im Lager', marketAvailable: '{qty} verfügbar', marketTakes: 'Heute noch {qty} verkäuflich', tradeUnitHint: 'Preise je Last. Der Handel berücksichtigt die gewählte Menge.', fullPriceList: 'Alle Preise & Tagesmengen',
  marketStockLabel: 'am Markt', marketDemandLabel: 'Abnahme heute', goodsCount: 'Waren', goodsLegend: 'Zahl am Bild: dein Lagerbestand · rot: knapp · grün: Überschuss. Preise in Mark je Last.',
  visitorNetBuy: 'Du zahlst je Last', visitorNetSell: 'Du erhältst je Last', visitorQuantity: 'verkauft {qty} Last', visitorWanted: 'kauft bis zu {qty} Last', beforeDuty: 'Angebot vor Zoll: {price} Mark', dutyBuy: 'Preis {price} Mark + {duty} Mark Zoll', dutySell: 'Gebot {price} Mark − {duty} Mark Zoll', dutyNone: 'Preis {price} Mark, ohne Zoll',
  mapAria: 'Stadtkarte von Sundhaven. Pfeiltasten verschieben, Plus und Minus zoomen, 0 zeigt die ganze Stadt.',
});
Object.assign(HK.I18N.en, {
  goodGroup: 'Commodity group', goodGroup_all: 'All goods', goodGroup_food: 'Food & drink', goodGroup_materials: 'Building & crafts', goodGroup_maritime: 'Ship supplies', goodGroup_textiles: 'Fibres & fabrics', goodGroup_luxury: 'Fine goods',
  brandSubtitle: 'Sundhaven · Anno 1372', cityEyebrow: 'Sundhaven · Hanseatic town', cityAtmosphere: 'Sea breeze, sailcloth and full warehouses.',
  yourHouse: 'Your trading house', tradeNav: 'Trade', officeNav: 'Trading house', shippingNav: 'Shipping', councilNav: 'Council', cityNavigation: 'Town navigation',
  districtLabel: 'Choose a district', district_market: 'Market & trading house', district_harbour: 'The great harbour', district_church: 'Church & guild',
  district_craft: 'The craftsmen’s quarter', district_east: 'The eastern quarter', district_gate: 'New town & north gate', district_all: 'Sundhaven · Town overview', district_custom: 'Sundhaven · Free view',
  zoomIn: 'Zoom in', zoomOut: 'Zoom out', zoomLevel: 'Zoom level', viewAll: 'Town overview', nextDay: 'Next day →', gameSpeed: 'Game speed',
  timePaused: 'The town awaits you', timeRunning: 'Time passes · one day in {seconds} seconds', timeRunningMinutes: 'Time passes · one day in {minutes} minutes',
  chooseGood: 'Choose a good', tradeGood: 'Trade {good}', inYourWarehouse: '{qty} in stock', marketAvailable: '{qty} available', marketTakes: 'Can sell {qty} more today', tradeUnitHint: 'Prices per last. Trades account for the selected quantity.', fullPriceList: 'All prices & daily quantities',
  marketStockLabel: 'at market', marketDemandLabel: 'demand today', goodsCount: 'goods', goodsLegend: 'Number on image: your stock · red: shortage · green: surplus. Prices in marks per last.',
  visitorNetBuy: 'You pay per last', visitorNetSell: 'You receive per last', visitorQuantity: 'sells {qty} last', visitorWanted: 'buys up to {qty} last', beforeDuty: 'Offer before duty: {price} marks', dutyBuy: 'Price {price} marks + {duty} marks duty', dutySell: 'Bid {price} marks − {duty} marks duty', dutyNone: 'Price {price} marks, no duty',
  mapAria: 'Sundhaven town map. Arrow keys move, plus and minus zoom, 0 shows the whole town.',
});

{
  const S = HK.Scene, P = HK.Presentation, overview = S.resetCam;
  S.district = 'market';
  S.focusDistrict = function (id) {
    if (!Object.hasOwn(P.districts, id)) return;
    if (id === 'all') overview.call(this);
    else {
      const d = P.districts[id], p = HK.Iso.p(d.x, d.y, 0);
      const viewportScale = Math.max(0.65, Math.min(1.25, HK.SCENE.W / 1100, HK.SCENE.H / 750));
      this.cam.z = HK.clamp(d.zoom * viewportScale, this.zoomMin(), this.ZOOM_MAX);
      this.cam.x = p[0] - HK.SCENE.W / (2 * this.cam.z);
      this.cam.y = p[1] - HK.SCENE.H / (2 * this.cam.z);
      if (id === 'church') {
        const church = HK.BUILDING.church;
        const top = HK.Iso.p(church.x + 0.4, church.y + church.d - 0.4, this.buildingHeight(church))[1];
        this.cam.y = Math.min(this.cam.y, top - 24 / this.cam.z);
      }
      this.clampCam(); this.camAuto = true;
    }
    this.district = id; P.syncView();
  };
  S.resetCam = function () { this.focusDistrict('all'); };
  const fit = S.fit;
  S.fit = function (first) {
    const district = this.district, auto = first || this.camAuto !== false;
    fit.call(this, first);
    if (auto && district && district !== 'custom') this.focusDistrict(district);
    P.syncView();
  };
  for (const name of ['setZoom', 'panBy', 'zeigeAuf']) {
    const original = S[name];
    S[name] = function (...args) { original.apply(this, args); this.district = 'custom'; P.syncView(); };
  }
  const init = HK.UI.init, texts = HK.UI.applyStaticTexts, header = HK.UI.renderHeader, sidebar = HK.UI.renderSidebar;
  const serialize=HK.serialize,deserialize=HK.deserialize,snapshots=new WeakMap();
  HK.serialize=function(st){const data=JSON.parse(serialize(st));delete data._presentation;if(st===HK.state)data._presentation={tab:HK.UI.tab,panel:HK.UI.panel,selected:HK.Scene.selected,plot:HK.UI.plot,burgher:HK.UI.burgher,person:HK.UI.person,citizen:HK.UI.citizen,citizenDestination:HK.UI.citizenDestination,encounter:HK.UI.encounter,selectedVisitor:HK.UI.selectedVisitor,selectedOwnShip:HK.UI.selectedOwnShip,marketGood:HK.UI.marketGood,goodGroup:HK.UI.inputs.goodGroup,returnContext:HK.UI.returnContext};return JSON.stringify(data);};
  HK.deserialize=function(json){const data=JSON.parse(json),saved=data?._presentation;if(saved)delete data._presentation;const state=deserialize(JSON.stringify(data));if(saved)snapshots.set(state,saved);return state;};
  HK.UI.init = function () {
    init.call(this);
    document.addEventListener('click',e=>document.querySelectorAll('.utility-menu[open]').forEach(menu=>{if(!menu.contains(e.target))menu.open=false;}));
    document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.utility-menu[open]').forEach(menu=>{menu.open=false;menu.querySelector('summary').focus();});});
    this.$('view-district').addEventListener('change', e => S.focusDistrict(e.target.value));
    this.$('city-links').addEventListener('click', e => { const b = e.target.closest('[data-place]'); if (b) P.openPlace(b.dataset.place); });
    this.$('city-links').addEventListener('click', e => { const b=e.target.closest('#area-links [data-panel]'); if(b)P.openPlace(b.dataset.panel); });
  };
  HK.UI.applyStaticTexts = function () { texts.call(this); P.translate(); };
  const tabs=HK.UI.renderTabs;HK.UI.renderTabs=function(...args){const result=tabs.apply(this,args);P.updateBooksBadge();return result;};
  HK.UI.renderHeader = function () {
    header.call(this);
    const st = HK.state, el = this.$('time-status');
    if (st && el) {
      const seconds = HK.SPEEDS[st.speed] / 1000;
      el.textContent = !st.speed ? HK.t('timePaused') : seconds >= 60 ? HK.t('timeRunningMinutes', { minutes: seconds / 60 }) : HK.t('timeRunning', { seconds });
      this.updateToolbarTime?.(st);

    }
    P.syncView();
  };
  HK.UI.renderSidebar = function () {
    sidebar.call(this);
    const heading=this.sidebar.querySelector('.panel-head,.work-heading');
    if(heading){
      heading.classList.add('action-heading');
      const title=heading.querySelector('h2'),context=title?.closest('.context-heading')||title;
      if(context){
        const key=this.tab!=='place'?'menuBooks':P.areaForPanel(this.panel)==='rural'?'ruralContext':['person','encounter','citizen'].includes(this.panel)?'conversationContext':'placeContext';
        const label=document.createElement('small');label.className='panel-eyebrow';label.textContent=HK.t(key);context.before(label);
      }
      if(this.tab==='place'&&['gate','marketPrices','marketStalls','ruralFields','ruralMill','ruralForest','ruralDeliveries'].includes(this.panel)){
        const image=heading.querySelector(':scope > .menu-art,:scope > .menu-symbol');
        if(image)image.outerHTML=HK.MenuArt.section(this.panel,'panel-picture');
        else heading.insertAdjacentHTML('afterbegin',HK.MenuArt.section(this.panel,'panel-picture'));
      }
      if(this.tab!=='place'){
        const image=heading.querySelector(':scope > .menu-art,:scope > .menu-symbol');
        if(image)image.outerHTML=HK.MenuArt.book(this.tab,'panel-picture');
        else heading.insertAdjacentHTML('afterbegin',HK.MenuArt.book(this.tab,'panel-picture'));
        heading.classList.add('illustrated-head');
      }
      const localNav=this.sidebar.querySelector('.business-switch');
      if(localNav)heading.after(localNav);
    }
    this.sidebar.querySelectorAll('table.market').forEach(table => {
      const wrap = document.createElement('div'); wrap.className = 'table-scroll';
      wrap.tabIndex = 0; wrap.setAttribute('role', 'region'); wrap.setAttribute('aria-label', HK.t('tradeNav'));
      table.before(wrap); wrap.appendChild(table);
    });
    P.renderNavigationState();
    this.$('side').dataset.view=this.tab;
    this.$('side').dataset.panel=this.panel;
    this.$('place-return').hidden=this.tab==='place';
    this.$('tab-place-label').textContent=this.panelTitle();
    this.sidebar.setAttribute('aria-label',this.sidebar.querySelector('h2')?.textContent||this.panelTitle());
    document.querySelectorAll('#tabs button').forEach(b=>{const active=b.dataset.tab===this.tab;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'page':'false');});
    HK.ActionDesign?.enhance(this);
  };
  // main.js defines startWithState after this file; attach once all scripts have loaded.
  document.addEventListener('DOMContentLoaded', () => {
    const begin = HK.startWithState;
    HK.startWithState = function (st) {
      HK.UI.returnContext=null;
      begin(st); S.focusDistrict('market');
      const saved=snapshots.get(st);if(!saved)return;snapshots.delete(st);
      const U=HK.UI,tabs=['place','overview','planning','missions','log','mail'];
      const panel=typeof U['panel_'+saved.panel]==='function'?saved.panel:'kontor';
      U.panel=panel;U.plot=Number.isInteger(saved.plot)?saved.plot:0;U.burgher=HK.state.burghers?.[saved.burgher]?saved.burgher:'f1';U.person=HK.PERSON[saved.person]?saved.person:null;U.citizen=HK.state.population?.people?.[saved.citizen]?saved.citizen:null;U.citizenDestination=saved.citizenDestination||null;U.encounter=saved.encounter||null;
      U.marketGood=HK.GOOD[saved.marketGood]?saved.marketGood:'beer';U.inputs.goodGroup=HK.GOOD_GROUPS[saved.goodGroup]?saved.goodGroup:'all';
      HK.Scene.selected=saved.selected==='gate'?'gate':(HK.BUILDING[saved.selected]||HK.RURAL_BUILDINGS?.[saved.selected])?saved.selected:null;
      U.selectedVisitor=panel==='gate'?st.caravans.find(v=>v.id===saved.selectedVisitor)?.id||null:panel==='harbour'?st.ships.find(v=>v.id===saved.selectedVisitor)?.id||null:null;
      U.selectedOwnShip=st.ownShips.some(s=>s.id===saved.selectedOwnShip)?saved.selectedOwnShip:null;
      U._restoringNav=true;U.setTab(tabs.includes(saved.tab)?saved.tab:'place');U._restoringNav=false;U.returnContext=saved.returnContext||null;
      const district=panel==='gate'?'gate':P.areaForPanel(panel)==='harbour'?'harbour':'market';S.focusDistrict(district);U.renderAll();
    };
  });
}

Object.assign(HK.I18N.de, {
  officeBuilding: 'Dein Kontor', warehouseBuilding: 'Lagerhaus', businessNavigation: 'Kontor und Lagerhaus',
  officeHelp: 'Im Kontor findest du Kasse, Buchungen und Besitz. Faktor und Lagerarbeiter verwaltest du unter Personal; Warenbestand und Lieferungen liegen im Lagerhaus.',
  warehouseHelp: 'Hier siehst du den gemeinsamen Warenbestand deiner Speicher. Vorausbezahlte Lieferungen reservieren Lagerplatz und werden bei Ankunft eingelagert. Waren auf eigenen Schiffen gehören erst nach dem Entladen zum Lagerbestand. Klicke auf eine Warenkarte, um sie am Markt zu handeln.',
  officeCash: 'Verfügbare Kasse', officeDebt: 'Bankdarlehen', officeBalance: 'Saldo · 30 Tage', officeBank: 'Bankgeschäfte',
  factorHelp: 'Der Faktor verkauft täglich knappe Waren aus deinem Lager, wenn der Markt gut zahlt. Seine Eigenart beeinflusst die Geschäfte. Lohn wird täglich fällig.',
  factorDailyWage: 'Lohn: {wage} Mark/Tag', officePortfolio: 'Geschäfte & Besitz', officeNoBusiness: 'Noch keine eigenen Betriebe oder vermietbaren Immobilien.',
  warehouseSpace: 'Lagerplatz', warehouseStored: 'Eingelagert', warehouseReserved: 'Für Lieferungen reserviert', warehouseFree: 'Frei', warehouseCapacity: 'Gesamtkapazität: {cap} Last',
  warehouseStock: 'Deine Waren', warehouseTrade: '{good} am Markt handeln', warehouseDeliveries: 'Erwartete Lieferungen', warehouseNoDeliveries: 'Keine Lieferung unterwegs',
  warehousePrepaid: 'Vorausbezahlt · {cost} Mark', warehouseUnknownArrival: 'Ankunft noch offen', warehousePlanning: 'Lieferung planen',
  warehouseSeaCargo: 'Waren auf eigenen Schiffen', warehouseShipAtQuay: 'Am Kai · noch nicht eingelagert', warehouseShipReturning: 'Rückfahrt · erwartet: {date}', warehouseShipUnload: 'Im Hafen entladen', warehouseShipOpen: 'Schiff öffnen',
  warehouseExpand: 'Lager ausbauen', warehouseStores: 'Zusätzliche Speicher', warehouseStoreOwn: '+{cap} Last Lagerplatz', warehouseStoreRented: 'Vermietet · {rent} Mark/Tag',
  warehouseMoreSpace: 'zusätzlicher Lagerplatz', warehouseCapacityChange: '{before} → {after} Last gesamt', warehouseExpandAction: 'Ausbauen', warehouseMissingMoney: 'Noch {money} Mark nötig',
  warehouseStoreOffer: '{cap} Last · {cost} Mark', warehouseOrdered: 'Bestellt', warehouseTransit: 'Unterwegs', warehouseReturn: 'Rückfahrt', warehouseQuay: 'Am Kai', warehouseDelayed: 'Ankunft verschoben', warehouseDeliveryTerms: 'Zahlung & Absicherung', warehouseSupplier: 'Zum Betrieb',
  freightEmpty: 'Noch keine Warenbewegungen', freightProgress: '{done} / {qty} Last übergeben', freightCarrier: 'Händler', freightArrival: 'Eingang', freightDeparture: 'Ausgang',
});
Object.assign(HK.I18N.en, {
  officeBuilding: 'Your office', warehouseBuilding: 'Warehouse', businessNavigation: 'Office and warehouse',
  officeHelp: 'The counting house shows cash, entries and property. Manage the factor and warehouse workers under Staff; stock and deliveries are in the Warehouse.',
  warehouseHelp: 'This view shows the shared stock of your stores. Prepaid supplies reserve space and enter stock on arrival. Cargo on your own ships enters stock only when unloaded. Select a goods card to trade it at market.',
  officeCash: 'Available cash', officeDebt: 'Bank loan', officeBalance: 'Balance · 30 days', officeBank: 'Banking',
  factorHelp: 'The factor sells scarce goods from your warehouse daily when market prices are favourable. Their trait influences trades. Wages are paid daily.',
  factorDailyWage: 'Wage: {wage} marks/day', officePortfolio: 'Businesses & property', officeNoBusiness: 'No owned businesses or rentable property yet.',
  warehouseSpace: 'Storage space', warehouseStored: 'In stock', warehouseReserved: 'Reserved for deliveries', warehouseFree: 'Free', warehouseCapacity: 'Total capacity: {cap} last',
  warehouseStock: 'Your goods', warehouseTrade: 'Trade {good} at market', warehouseDeliveries: 'Expected deliveries', warehouseNoDeliveries: 'No deliveries in transit',
  warehousePrepaid: 'Prepaid · {cost} marks', warehouseUnknownArrival: 'Arrival pending', warehousePlanning: 'Plan a delivery',
  warehouseSeaCargo: 'Cargo aboard your ships', warehouseShipAtQuay: 'At the quay · not unloaded', warehouseShipReturning: 'Returning · expected: {date}', warehouseShipUnload: 'Unload at the harbour', warehouseShipOpen: 'Open ship',
  warehouseExpand: 'Expand storage', warehouseStores: 'Additional stores', warehouseStoreOwn: '+{cap} last of space', warehouseStoreRented: 'Rented out · {rent} marks/day',
  warehouseMoreSpace: 'additional storage space', warehouseCapacityChange: '{before} → {after} last total', warehouseExpandAction: 'Expand', warehouseMissingMoney: 'Need {money} more marks',
  warehouseStoreOffer: '{cap} last · {cost} marks', warehouseOrdered: 'Ordered', warehouseTransit: 'In transit', warehouseReturn: 'Returning', warehouseQuay: 'At quay', warehouseDelayed: 'Arrival delayed', warehouseDeliveryTerms: 'Payment & protection', warehouseSupplier: 'Visit supplier',
  freightEmpty: 'No cargo movements yet', freightProgress: '{done} / {qty} last handed over', freightCarrier: 'Trader', freightArrival: 'Inbound', freightDeparture: 'Outbound',
});
