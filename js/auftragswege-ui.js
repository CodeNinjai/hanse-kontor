/* The order book points to real trading places. Purchases and handovers happen there. */
'use strict';
Object.assign(HK.I18N.de, {
  saltmeeting:'Wessel am Kai',missionhandover:'Warenübergabe',missionsources:'Bezugsquellen',
  introQuiet:'Du beginnst mit „Erste Schritte“. Weitere Geschichten und Handelsbriefe erscheinen nach der Einführung; der erste Lieferauftrag schon beim passenden Schritt.',
  introExplore:'Alle Angebote jetzt entdecken',
  missionVisitRecipient:'Zum Auftraggeber: {name}',missionFindSources:'Händler auf der Karte finden',missionVisitMarket:'Zum Markt',
  missionSourceHint:'Kaufe beim Händler vor Ort. Vorausbestellungen, Ankunftstermine und Risiken findest du in der Planung.',
  missionSources:'Bezugsquellen für {good}',missionSourceStock:'{qty} Last verfügbar · {price} Mark je Last',
  missionSourceVisit:'Auf der Karte besuchen',missionProduction:'Eigene Produktion prüfen',
  missionHandoverTitle:'Warenübergabe · {name}',missionDeliveredHere:'Die Lieferung ist übergeben und die Auszahlung gebucht.',
  missionHandOver:'{qty} Last {good} übergeben · {money} Mark',
  saltVisit:'Wessel am Kai treffen',saltMeeting:'Jakob Wessel · Warenannahme am Kai',
  saltMeetingText:'Wessel nimmt deine vollständige Lieferung aus dem Lager entgegen. Die vereinbarte Auszahlung erhältst du bei der Übergabe.',
  saltMeetingMissing:'Für die Übergabe fehlen noch {qty} Last {good}.',saltMeetingDone:'Wessel hat die Lieferung quittiert. Besprecht im Auftragsbuch, wie es weitergeht.',
  saltHornExtraTitle:'Weitere Geschäfte mit Horn',
  saltHornExtra:'Horn ist ein zusätzlicher Käufer für überschüssigen Räucherfisch. Er kann frühestens vier Tage nach seiner Abreise wieder im Hafen liegen; Verzögerungen sind möglich. Bei seiner Ankunft findest du Preis und Abnahmemenge an seinem Schiff. Das ist ein separates Geschäft und erfüllt Wessels Auftrag nicht.',
  missionRouteHelp:'Das Auftragsbuch hält Zusagen, Fristen und Ergebnisse fest. „Händler auf der Karte finden“ zeigt aktuelle Bezugsquellen; ein Besuch öffnet den Händler auf der Karte. Dort kaufst du selbst die gewünschte Menge. Über „Auftraggeber aufsuchen“ gelangst du zur Warenübergabe. Fehlende Menge, zu geringe Qualität oder eine abgelaufene Frist verhindern die Übergabe. Vorausbestellte Ware zählt erst nach ihrer Ankunft im Lager.',
});
Object.assign(HK.I18N.en, {
  saltmeeting:'Wessel at the quay',missionhandover:'Goods handover',missionsources:'Sources',
  introQuiet:'Begin with First steps. Further stories and trading letters appear after the introduction; your first delivery offer appears at the relevant step.',
  introExplore:'Discover all offers now',
  missionVisitRecipient:'Visit {name}',missionFindSources:'Find traders on the map',missionVisitMarket:'Go to market',
  missionSourceHint:'Buy at the trading location. Planning covers advance orders, arrival dates and risks.',
  missionSources:'Sources for {good}',missionSourceStock:'{qty} last available · {price} marks per last',
  missionSourceVisit:'Visit on the map',missionProduction:'Check your own production',
  missionHandoverTitle:'Goods handover · {name}',missionDeliveredHere:'The goods have been handed over and the payment booked.',
  missionHandOver:'Hand over {qty} last of {good} · {money} marks',
  saltVisit:'Meet Wessel at the quay',saltMeeting:'Jakob Wessel · Receiving goods at the quay',
  saltMeetingText:'Wessel accepts the full delivery from your warehouse. You receive the agreed payment when you hand it over.',
  saltMeetingMissing:'You still need {qty} last of {good} for the handover.',saltMeetingDone:'Wessel has signed the receipt. Discuss the next step in your order book.',
  saltHornExtraTitle:'Further business with Horn',
  saltHornExtra:'Horn is an additional buyer for surplus smoked fish. He can return to port no earlier than four days after leaving; delays are possible. His ship shows prices and demand when he arrives. This is a separate trade and does not fulfil Wessel’s order.',
  missionRouteHelp:'Your order book records promises, deadlines and results. Find traders on the map shows current sources; visiting opens the actual trader on the map. Buy the quantity you need there. Visit the recipient takes you to the handover. Missing goods, insufficient quality or an expired deadline prevent delivery. Prepaid goods only count once they reach your warehouse.',
});
Object.assign(HK.UI, {
  missionSourceId:null,
  panel_missionsources() {
    const st=HK.state,c=st.contracts.active.find(c=>c.id===this.missionSourceId);
    if(!c?.good)return `<p>${HK.t('postGone')}</p><button data-action="missions">${HK.t('missionsTab')}</button>`;
    const g=c.good,card=(name,art,detail,attrs)=>`<article class="mission-source">${art}<div><b>${this.esc(name)}</b><small>${detail}</small><button class="small" ${attrs}>${HK.t('missionSourceVisit')}</button></div></article>`;
    let h=this.head(HK.t('missionSources',{good:HK.goodName(g)}),'','missionRouteHelp')+`<p class="hint">${HK.t('missionSourceHint')}</p><div class="mission-sources">`;
    h+=card(HK.t('market'),HK.MenuArt.place('market'),HK.t('missionSourceStock',{qty:Math.floor(st.town.stock[g]||0),price:HK.fmt(HK.marketBuyPrice(st,g,1))}),`data-action="warehousetrade" data-good="${g}"`);
    for(const v of HK.besucherAlle(st).filter(v=>v.cargo[g]?.qty>0))h+=card(HK.besucherName(v),HK.MenuArt.place(v.sea?'harbour':'gate'),HK.t('missionSourceStock',{qty:v.cargo[g].qty,price:HK.fmt(HK.nettoKauf(st,v,g))}),`data-action="missionsupplier" data-id="${v.id}" data-good="${g}"`);
    for(const [id,s] of Object.entries(st.rural?.sites||{}))if((s.stock[g]||0)>0)h+=card(HK.name(HK.RURAL_BUILDINGS[id]),HK.MenuArt.good(g),`${Math.floor(s.stock[g])} ${HK.t('unitLast')} · ${HK.t('ruralEarliest',{date:HK.fmtDate(st.day+1)})}`,`data-action="ruralopen" data-site="${id}"`);
    if(g==='smokedfish')h+=card(HK.name(HK.BUILDING.smokery),HK.MenuArt.place('smokery'),HK.t('missionProduction'),`data-action="businessplace" data-building="smokery"`);
    return h+`</div><div class="btn-row"><button class="small" data-action="tradeplans">${HK.t('tradePlanning')} →</button><button class="small" data-action="missions">${HK.t('missionBack')}</button></div>`;
  },
  panel_missionhandover() {
    const st=HK.state,c=st.contracts.active.find(c=>c.id===this.missionDeliveryId),receipt=st.post.contracts.find(c=>c.id===this.missionDeliveryId),order=c||receipt;
    if(!order)return `<p>${HK.t('postGone')}</p>`;
    const v=order.visitorId&&HK.findVisitor(st,order.visitorId),name=v?HK.besucherName(v):HK.t('giver_'+order.giver);
    let h=this.head(HK.t('missionHandoverTitle',{name}),'','missionRouteHelp')+'<section class="salt-meeting">';
    if(c){
      const have=Math.floor(st.warehouse.stock[c.good]||0),missing=Math.max(0,c.qty-have),late=st.day>c.deadline,low=c.minQuality&&HK.goodQuality(st,c.good)<c.minQuality;
      h+=`<div class="salt-order-heading">${HK.MenuArt.good(c.good)}<div><h3>${c.qty} ${HK.t('unitLast')} ${HK.goodName(c.good)}</h3><small>${HK.t('tradeDue')}: ${HK.fmtDate(c.deadline)}</small>${c.minQuality?`<small>${HK.t('cityMinQuality',{quality:c.minQuality})}</small>`:''}</div></div>`;
      if(missing||late||low)h+=`<p class="hint">${HK.t(late?'missionDeadlinePassed':missing?'saltMeetingMissing':'missionQualityNext',{qty:missing,good:HK.goodName(c.good)})}</p>`;
      h+=`<button class="primary" data-action="delivercontract" data-id="${c.id}" ${missing||late||low?'disabled':''}>${HK.t('missionHandOver',{qty:c.qty,good:HK.goodName(c.good),money:HK.fmt(c.reward)})}</button>`;
    }else h+=`<p>${HK.t('missionDeliveredHere')}</p>`;
    return h+`<button class="small" data-action="missions">${HK.t('missionBack')}</button></section>`;
  },
  openMissionVisitor(v) {
    this.sceneClick({kind:'visitor',panel:v.sea?'harbour':'gate',id:v.id});
    const pos=v.sea?HK.BERTHS[v.berth]:HK.CARAVAN_SPOTS[v.spotIndex??0];
    if(pos)HK.Scene.zeigeAuf(pos.x,pos.y);
  },
  openSaltMeeting() {
    this.panel='saltmeeting';HK.Scene.selected=null;this.setTab('place');
    HK.Scene.zeigeAuf(24.05,19.87);this.sidebar.scrollTop=0;
  },
  panel_saltmeeting() {
    const st=HK.state,c=HK.saltContract(st),p=HK.saltProjection(st);
    let h=this.head(HK.t('saltMeeting'),'','missionRouteHelp')+`<section class="salt-meeting"><div class="salt-host">${HK.MenuArt.portrait('Jakob Wessel')}<p>${HK.t('saltMeetingText')}</p></div>`;
    if(c) {
      const late=st.day>c.deadline,low=c.minQuality&&HK.goodQuality(st,c.good)<c.minQuality,ready=!late&&!low&&!p.missing;
      h+=`<div class="salt-order-heading">${HK.MenuArt.good(c.good)}<div><h3>${HK.t('saltOrderGoal',{qty:c.qty,good:HK.goodName(c.good),date:HK.fmtDate(c.deadline)})}</h3>${c.minQuality?`<small>${HK.t('cityMinQuality',{quality:c.minQuality})}</small>`:''}</div></div>`;
      if(!ready)h+=`<p class="hint">${HK.t(late?'missionDeadlinePassed':p.missing?'saltMeetingMissing':'missionQualityNext',{qty:p.missing,good:HK.goodName(c.good)})}</p>`;
      h+=`<button class="primary" data-action="saltdeliver" data-choice="business" ${ready?'':'disabled'}>${HK.t('missionHandOver',{qty:c.qty,good:HK.goodName(c.good),money:HK.fmt(c.reward)})}</button>`;
      if(c.saltStory==='salt')h+=`<details class="salt-details"><summary>${HK.t('saltOtherOptions')}</summary><p>${HK.t('saltCommunityHint')}</p><button class="small" data-action="saltdeliver" data-choice="community" ${ready?'':'disabled'}>${HK.t('saltCommunity',{reward:HK.fmt(c.reward-320)})}</button></details>`;
    } else h+=`<p>${HK.t('saltMeetingDone')}</p>`;
    return h+`<button class="small" data-action="saltjournal">${HK.t('missionOpen')}</button></section>`;
  },
});
{
  const action=HK.UI.action;
  HK.UI.action=function(d) {
    const st=HK.state;
    if(d.action==='introexplore') { st.lehrgang.explore=true;HK.introSync(st);HK.scheduleSave?.();this.renderAll();return; }
    if(d.action==='missionsources') { this.missionSourceId=+d.id;this.panel='missionsources';this.setTab('place');this.sidebar.scrollTop=0;return; }
    if(d.action==='missionsupplier') {const v=HK.findVisitor(st,+d.id);if(v)this.openMissionVisitor(v);return;}
    if(d.action==='saltmeet') {this.openSaltMeeting();return;}
    if(d.action==='saltjournal') {this.missionFocus='salt';this.setTab('missions');return;}
    if(d.action==='missionvisit') {
      const c=st.contracts.active.find(c=>c.id===+d.id);if(!c)return;
      if(c.saltStory){this.openSaltMeeting();return;}
      const v=c.visitorId&&HK.findVisitor(st,c.visitorId);
      if(v)this.openMissionVisitor(v);
      else {const panel=HK.CONTRACT_GIVERS[c.giver].panel;HK.Presentation.openPlace(panel);const b=HK.BUILDINGS.find(b=>b.panel===panel);if(b)HK.Scene.zeigeAuf(b.x+b.w/2,b.y+b.d/2);}
      this.missionDeliveryId=c.id;this.panel='missionhandover';this.setTab('place');this.sidebar.scrollTop=0;
      return;
    }
    // A handover is confirmed at its actual location, never from the order book.
    if(d.action==='saltdeliver'&&(this.tab!=='place'||this.panel!=='saltmeeting')){this.openSaltMeeting();return;}
    action.call(this,d);
  };
  const scene=HK.UI.sceneClick;
  HK.UI.sceneClick=function(h){if(h.kind==='town-event'&&h.story){this.openSaltMeeting();return;}return scene.call(this,h);};
  const row=HK.UI.contractRow;
  HK.UI.contractRow=function(c,active){
    if(c.saltStory)return ''; // Wessel receives these personally at the quay.
    let h=row.call(this,c,active);
    if(active&&c.type==='deliver')h=h.replace(/>([^<>]*)<\/button>/,`>${HK.t('missionHandOver',{qty:c.qty,good:HK.goodName(c.good),money:HK.fmt(c.reward)})}</button>`);
    return h;
  };
  const teaser=HK.UI.tradeTeaser;
  HK.UI.tradeTeaser=function(){return HK.introStage(HK.state)===0?'':teaser.call(this);};
}

// A visitor-specific delivery remains available at the selected ship or caravan.
for(const panel of ['harbour','gate']) {
  const render=HK.UI['panel_'+panel];
  HK.UI['panel_'+panel]=function(){
    const h=render.call(this),contracts=HK.state.contracts.active.filter(c=>c.visitorId===this.selectedVisitor);
    return h+(contracts.length?`<section><h3>${HK.t('contracts')}</h3><table class="plain">${contracts.map(c=>this.contractRow(c,true)).join('')}</table></section>`:'');
  };
}
HK.I18N.de.missionsHint+=' '+HK.I18N.de.missionRouteHelp;
HK.I18N.en.missionsHint+=' '+HK.I18N.en.missionRouteHelp;
HK.I18N.de.postBody_welcome='Willkommen in deinem Kontor. Beginne im Auftragsbuch mit „Erste Schritte“: Sie führen dich vom Hafenbesuch bis zum ersten eigenen Geschäft. Anfangs erhältst du nur die passenden Aufträge. Schiffe und angekündigte Waren findest du direkt am Hafen und in der Planung. Weitere Geschichten folgen nach der Einführung; du kannst sie im Auftragsbuch auch früher freischalten.';
HK.I18N.en.postBody_welcome='Welcome to your counting house. Begin with First steps in the order book: it takes you from visiting the harbour to your first business. Initially, only relevant orders appear. Find ships and announced supplies at the harbour and in Planning. Further stories follow after the introduction; you can also reveal them earlier from the order book.';

Object.assign(HK.I18N.de, {missionSaltProcure:'Finde Händler und Bezugsquellen in der Geschichte. Gekauft wird vor Ort.',missionSaltDeliver:'Die Ware liegt bereit. Wessel erwartet dich am Kai zur Übergabe.',missionDeliverNext:'Die Ware liegt bereit. Besuche den Auftraggeber zur Übergabe.'});
Object.assign(HK.I18N.en, {missionSaltProcure:'Find traders and sources in the story. Buy at their location.',missionSaltDeliver:'The goods are ready. Wessel awaits the handover at the quay.',missionDeliverNext:'The goods are ready. Visit the recipient to hand them over.'});
