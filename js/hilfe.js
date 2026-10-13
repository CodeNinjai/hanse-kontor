/* One searchable handbook for global help and existing contextual explanations. */
'use strict';
HK.helpInit=st=>{st.helpSeen ||= {};};
HK.newGameHooks.push(HK.helpInit);HK.migrateHooks.push(HK.helpInit);
HK.HELP_ARTICLES=[
 {id:'gambling',group:'people',title:['Glücksspiel und der Würfeltisch','Gambling and the dice table'],keywords:'Glückspiel Glücksspiel Würfeln Würfel Taverne Wetten dice gamble gambling tavern bet',key:'gambleHelp',links:[{panel:'tavern',label:['Zum Goldenen Hering · Würfeln','Visit the Golden Herring · Dice']}]} ,
 {id:'start',group:'start',title:['Deine ersten Geschäfte','Your first trades'],keywords:'Einstieg Anfang Tutorial Einführung start introduction tutorial',body:()=>HK.t('lg_zwischen_text'),links:[{tab:'missions',label:['Einführung und Aufträge','Introduction and orders']},{panel:'harbour',label:['Zum Hafen','Visit the harbour']}]},
 {id:'profit',group:'trade',title:['Auszahlung und Gewinn','Payment and profit'],keywords:'Geld Marge Erlös Verlust money margin revenue loss',body:()=>HK.LANG==='en'?'Payment is the money you receive on delivery. To estimate profit, subtract the value of your goods, the current cost of any shortfall, and additional costs. Example: 880 marks paid minus 1,360 marks spent buying the missing goods leaves a loss of 480 marks. Prices can change before you buy. Compare suppliers before committing. Wages, rent and other ongoing costs also affect your trading house.':'Die Auszahlung ist das Geld bei Ablieferung. Für den voraussichtlichen Gewinn werden Warenwert, heutige Kosten der Fehlmenge und Sonderkosten abgezogen. Beispiel: 880 Mark Auszahlung minus 1.360 Mark für fehlende Ware ergeben 480 Mark Verlust. Bis zum Einkauf können sich Preise ändern. Vergleiche Bezugsquellen vor einer Zusage. Löhne, Mieten und andere laufende Kosten belasten zusätzlich dein Handelshaus.',links:[{tab:'planning',label:['Bezugsquellen vergleichen','Compare suppliers']}]},
 {id:'prices',group:'trade',title:['Warum ändern sich Preise?','Why do prices change?'],keywords:'Preis Angebot Nachfrage Kurve Verlauf Zoll Gebühren price supply demand chart tariff fees',body:()=>HK.LANG==='en'?'Market prices reflect local stock, demand, prosperity, events and quality. Buying and selling change stock; daily production and consumption change it again. Visitors have their own finite offers. The price history records observed market prices over up to 60 days, with purchase and sale prices separate. A cheaper offer is useful only if its quantity, quality and arrival fit your plans.':'Marktpreise hängen von Stadtvorrat, Nachfrage, Wohlstand, Ereignissen und Güte ab. Käufe und Verkäufe ändern Bestände; täglich kommen Produktion und Verbrauch hinzu. Besucher haben eigene, endliche Angebote. Der Preisverlauf zeigt tatsächlich beobachtete Marktpreise für bis zu 60 Tage, getrennt nach Einkauf und Verkauf. Ein günstiges Angebot hilft nur, wenn Menge, Güte und Ankunft zu deinem Vorhaben passen.',links:[{panel:'marketPrices',label:['Preise & Verlauf öffnen','Open prices & history']}]},
 {id:'contracts',group:'trade',title:['Lieferzusagen sicher erfüllen','Fulfilling delivery promises'],keywords:'Auftrag Mission Termin Frist Strafe quality contract mission deadline penalty',key:'missionsHint',links:[{tab:'missions',label:['Aufträge öffnen','Open orders']},{tab:'planning',label:['Beschaffung planen','Plan procurement']}]},
 {id:'planning',group:'trade',title:['Planung und Vorauszahlungen','Planning and advance payments'],keywords:'Lieferung Risiko Reservierung Verspätung Hafenmeister delivery reservation delay harbourmaster',key:'tradeAdvanceHelp',links:[{tab:'planning',label:['Planung öffnen','Open planning']}]},
 {id:'warehouse',group:'stock',title:['Lager, Platz und Güte','Storage, capacity and quality'],keywords:'Waren Bestand Qualität reserviert Rückfracht storage stock quality reserved cargo',key:'warehouseHelp',links:[{panel:'warehouse',label:['Zum Lagerhaus','Visit the warehouse']}]},
 {id:'office',group:'stock',title:['Kontor, Personal und Lagerhaus','Counting house, staff and warehouse'],keywords:'Kontor Lager Unterschied Kasse Buchhaltung Faktor Lagerarbeiter office warehouse cash ledger factor staff workers',key:'officeHelp',links:[{panel:'kontor',label:['Zum Kontor','Visit the counting house']},{panel:'staff',label:['Zum Personal','Visit staff']},{panel:'warehouse',label:['Zum Lagerhaus','Visit the warehouse']}]},
 {id:'production',group:'production',title:['So arbeitet dein Betrieb','How your business works'],keywords:'Bauern Mühle Holz Jagd Steinmetz Rohstoffe Lohn Arbeitsgang Produktion Bier Gerste Malz Mälzerei Hopfen Brauerei farm mill timber hunting masonry inputs wages production beer barley malt malthouse hops brewery',key:'ruralProductionHelp',links:[{panel:'rural',label:['Umland und Produktion','Countryside and production']}]},
 {id:'ownership',group:'production',title:['Erzeugnisse kaufen oder Betrieb besitzen?','Buy produce or own the business?'],keywords:'kaufen Betrieb Besitzer Besitz Gewinn Kosten buy business owner cost',key:'ruralOwnershipHelp',links:[{panel:'rural',label:['Betriebe ansehen','View businesses']}]},
 {id:'fleet',group:'sea',title:['Eine eigene Handelsfahrt','Your own trading voyage'],keywords:'Kogge Schiff Kapitän Fahrt Ladung Segel Rückkehr Laderaum cog ship captain voyage cargo return capacity',body:()=>HK.t('fleetHelp')+' '+HK.t('operationsHelp'),links:[{panel:'harbour',label:['Flotte verwalten','Manage your fleet']},{panel:'shipyard',label:['Zur Werft','Visit the shipyard']}]},
 {id:'people',group:'people',title:['Bewohner, Gäste und Beziehungen','Residents, guests and relationships'],keywords:'Menschen Name Frau Mann Gast Gasthof Herberge Gespräch Ruf people name guest inn relationship reputation',body:()=>HK.LANG==='en'?'Click a person to see their name, home, occupation and recent movements. Residents travel between home and work; guests stay at the inn or aboard their ship. Rain and night can send them home. Named contacts may offer conversations and letters. A background story does not automatically mean that a personal mission is available.':'Klicke eine Person an: Das Profil zeigt Name, Wohnort, Tätigkeit und letzte Wege. Bewohner gehen zwischen Zuhause und Arbeit; Gäste wohnen in der Herberge oder an Bord. Regen und Nacht können den Heimweg auslösen. Benannte Ansprechpartner bieten teilweise Gespräche und Briefe. Ein Hintergrundtext bedeutet nicht automatisch, dass eine persönliche Mission verfügbar ist.',links:[{tab:'mail',label:['Nachrichten öffnen','Open messages']}]},
 {id:'council',group:'politics',title:['Gesetze und Ratsanträge','Laws and council motions'],keywords:'Rat Gesetze Pfeil deaktiviert Einfluss abstimmen mayor laws arrow disabled influence vote',key:'councilLawsHelp',links:[{panel:'laws',label:['Zu den Gesetzen','View laws']}]},
 {id:'faith',group:'politics',title:['Stiften und Kirche fördern','Endowments and the church'],keywords:'Kirche Kloster Spital Frömmigkeit Bruderschaft Wallfahrt church monastery hospital piety brotherhood pilgrimage',body:()=>HK.LANG==='en'?'Donations, church deliveries, endowments and building projects are different actions. Read whether an action is a one-time donation, a sale of goods or a construction commitment. The patron title lists its actual requirements in Overview. A pilgrimage needs a relic, a brotherhood and a chapel; a church building takes time.':'Spenden, Kirchenlieferungen, Stiftungen und Bauprojekte sind unterschiedliche Handlungen. Prüfe, ob du einmalig spendest, Waren verkaufst oder ein Bauvorhaben finanzierst. Die tatsächlichen Bedingungen des Stiftertitels stehen in der Übersicht. Eine Wallfahrt verlangt Reliquie, Bruderschaft und Kapelle; ein Kirchenbau braucht Zeit.',links:[{panel:'church',label:['Zur Kirche','Visit the church']},{tab:'overview',label:['Titel ansehen','View titles']}]},
 {id:'books',group:'start',title:['Welches Buch hilft mir weiter?','Which book should I use?'],keywords:'Menü Journal Chronik Nachrichten Planung Aufträge Fortschritt menu journal chronicle mail planning orders progress',body:()=>HK.LANG==='en'?'Orders track your goals and progress. Planning compares where to obtain goods, by when, and at what risk. Messages contain offers and replies. The Journal records decisions and results and stores your own notes. Overview shows your position and title requirements.':'Aufträge verfolgen Ziele und Fortschritte. Planung vergleicht, wo du Waren bis wann und mit welchem Risiko bekommst. Nachrichten enthalten Angebote und Antworten. Das Journal hält Entscheidungen und Ergebnisse fest und nimmt eigene Notizen auf. Die Übersicht zeigt deine Lage und die Titelbedingungen.',links:[{tab:'missions',label:['Aufträge','Orders']},{tab:'log',label:['Journal','Journal']}]},
];
HK.HELP_GROUPS={start:['Einstieg','Getting started'],trade:['Handel und Gewinn','Trade and profit'],stock:['Kontor und Lager','Office and storage'],production:['Produktion','Production'],sea:['Seefahrt','Shipping'],people:['Menschen','People'],politics:['Rat und Kirche','Council and church'],context:['Weitere Ortshilfen','More contextual help']};
HK.helpText=value=>Array.isArray(value)?value[HK.LANG==='en'?1:0]:value;
// Existing question marks remain the authoritative source for specialist help.
HK.helpArticles=function(){
 const list=HK.HELP_ARTICLES.slice(),keys=new Set(list.map(a=>a.key));
 for(const [key,value]of Object.entries(HK.I18N[HK.LANG]))if(/Help$/.test(key)&&!keys.has(key)&&typeof value==='string'&&value.length>60){
  list.push({id:'context:'+key,group:'context',title:HK.I18N[HK.LANG][key.replace(/Help$/,'')]||HK.helpText(['Ortshilfe','Contextual help']),key});
 }
 for(const [key,title]of Object.entries(HK.helpContextTitles||{}))if(!keys.has(key)&&!list.some(a=>a.key===key)&&HK.t(key)!==key)list.push({id:'context:'+key,group:'context',title,key});
 return list.filter(a=>!a.key||HK.t(a.key)!==a.key);
};
HK.helpBody=a=>a.body?a.body():HK.t(a.key);
HK.helpSearch=function(query,group='all'){
 const norm=s=>String(s).replace(/<[^>]*>/g,' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
 const words=norm(query).trim().split(/\s+/).filter(Boolean);
 return HK.helpArticles().filter(a=>(group==='all'||a.group===group)&&words.every(w=>norm(HK.helpText(a.title)+' '+(a.key||'')+' '+(a.keywords||'')+' '+HK.helpBody(a)).includes(w)));
};
HK.helpRead=function(st,id){if(!st)return;HK.helpInit(st);if(st.helpSeen[id]!==1){st.helpSeen[id]=1;HK.middleUpdate?.(st);HK.scheduleSave?.();}};
Object.assign(HK.I18N.de,{handbook:'Handbuch von Sundhaven',helpSearch:'Thema, Ware oder Gebäude suchen',helpEmpty:'Dazu wurde kein Artikel gefunden. Versuche „Gewinn“, „Lager“ oder „Auftrag“.',helpAll:'Alle Themen',helpOpenBook:'Im Handbuch weiterlesen',helpBack:'Alle Artikel',helpUnread:'Noch ungelesen',helpContents:'Inhaltsverzeichnis'});
Object.assign(HK.I18N.en,{handbook:'Sundhaven handbook',helpSearch:'Search for a topic, good or building',helpEmpty:'No matching article. Try “profit”, “storage” or “contract”.',helpAll:'All topics',helpOpenBook:'Read more in the handbook',helpBack:'All articles',helpUnread:'Not read yet',helpContents:'Contents'});
HK.UI.showHelp=function(topic=null){
 let current=HK.helpArticles().find(a=>a.id===topic||a.key===topic)?.id||null;
 let query='',group='all';const ui=this;
 const render=()=>{
  const previous=ui.$('modal').querySelector('#handbook-search');if(previous)query=previous.value;
  const box=ui.modal(`<h2>${HK.t('handbook')}</h2><div class="handbook"><label for="handbook-search">${HK.t('helpSearch')}<input type="search" id="handbook-search" maxlength="100" value="${ui.esc(query)}"></label><nav class="work-filters" aria-label="${HK.t('helpContents')}"><button data-help-group="all" aria-pressed="${group==='all'}">${HK.t('helpAll')}</button>${Object.entries(HK.HELP_GROUPS).map(([id,label])=>`<button class="small" data-help-group="${id}" aria-pressed="${id===group}">${HK.helpText(label)}</button>`).join('')}</nav><div id="handbook-content" aria-live="polite"></div></div><div class="modal-actions"><button data-close class="primary">${HK.t('close')}</button></div>`,{wide:true});
  const content=box.querySelector('#handbook-content');
  const bind=()=>{
   content.querySelectorAll('[data-help-topic]').forEach(b=>b.onclick=()=>{current=b.dataset.helpTopic;draw();});
   content.querySelectorAll('[data-help-place]').forEach(b=>b.onclick=()=>{const a=HK.helpArticles().find(a=>a.id===current),link=a?.links?.[+b.dataset.helpPlace];if(!HK.state||HK.preview||!link)return;ui.closeModal();if(link.tab)ui.setTab(link.tab);else if(['market','gate','marketPrices','marketStalls'].includes(link.panel))HK.Presentation.openPlace(link.panel);else{const building=HK.BUILDINGS.find(b=>b.panel===link.panel);if(building)ui.sceneClick({kind:'building',building,panel:link.panel});else{ui.panel=link.panel;ui.setTab('place');}}});
   const back=content.querySelector('[data-help-back]');if(back)back.onclick=()=>{current=null;draw();};
  };
  const draw=()=>{
   const a=HK.helpArticles().find(a=>a.id===current);
   if(a){if(HK.state&&!HK.preview)HK.helpRead(HK.state,a.key||a.id);content.innerHTML=`<button class="small" data-help-back>← ${HK.t('helpBack')}</button><article class="handbook-article" tabindex="-1"><small>${HK.helpText(HK.HELP_GROUPS[a.group])}</small><h3>${ui.esc(HK.helpText(a.title))}</h3><div>${HK.helpBody(a)}</div><div class="btn-row">${(a.links||[]).map((l,i)=>`<button class="small" data-help-place="${i}" ${!HK.state||HK.preview?'disabled':''}>${HK.helpText(l.label)} →</button>`).join('')}</div></article>`;}
   else{const matches=HK.helpSearch(query,group);content.innerHTML=`<div class="handbook-results">${matches.map(a=>`<button data-help-topic="${ui.esc(a.id)}"><span>${ui.esc(HK.helpText(a.title))}</span><small>${HK.helpText(HK.HELP_GROUPS[a.group])}</small></button>`).join('')||`<p>${HK.t('helpEmpty')}</p>`}</div>`;}
   bind();if(a)content.querySelector('article').focus();
  };
  box.querySelector('#handbook-search').oninput=e=>{query=e.target.value;current=null;draw();};
  box.querySelectorAll('[data-help-group]').forEach(b=>b.onclick=()=>{group=b.dataset.helpGroup;current=null;box.querySelectorAll('[data-help-group]').forEach(n=>n.setAttribute('aria-pressed',n===b));draw();});
  draw();
 };render();this.modalRender=render;
};
{
 const contextual=HK.UI.contextualHelp;
 HK.UI.contextualHelp=function(key,label){
  (HK.helpContextTitles ||= {})[key]=label||HK.t('contextHelp');
  let html=contextual.call(this,key,label);
  if(!HK.state?.helpSeen?.[key])html=html.replace('class="context-help"','class="context-help unread-help"');
  return html.replace('</div></details>',`<button class="small link" data-action="handbook" data-topic="${this.esc(key)}">${HK.t('helpOpenBook')} →</button></div></details>`);
 };
 const init=HK.UI.init;HK.UI.init=function(){init.call(this);this.sidebar.addEventListener('toggle',e=>{const el=e.target;if(el.matches?.('.context-help')&&el.open){HK.helpRead(HK.state,el.dataset.help);el.classList.remove('unread-help');}},true);};
 const action=HK.UI.action;HK.UI.action=function(d){if(d.action==='handbook'){this.showHelp(d.topic);return;}return action.call(this,d);};
}

HK.HELP_ARTICLES.push(
 {id:'weather',group:'sea',title:['Wetter, Wege und Vorhersage','Weather, routes and forecasts'],keywords:'Wetter Regen Schnee Sturm Wettervorhersage wet rain snow storm forecast',key:'weatherHelp',links:[{tab:'planning',label:['Wetterbericht ansehen','View weather report']}]},
 {id:'calculation',group:'trade',title:['So wird eine Lieferung abgerechnet','How a delivery is settled'],keywords:'Kosten Marge Gewinn Einkauf Umladen cost margin profit purchases transfers',key:'deliveryCalculationHelp',links:[{tab:'missions',label:['Aufträge prüfen','Review orders']}]}
);
