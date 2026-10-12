/* Durable observations and optional progression; no fabricated history on migration. */
'use strict';
HK.ascentText=v=>Array.isArray(v)?v[HK.LANG==='en'?1:0]:v;
HK.ascentInit=function(st){
 st.ascent ||= {version:1,since:st.day,traded:{},lastSale:{},cleanSince:st.day,achievements:{},storms:{},prices:[],priceDay:-1,lastReport:st.day,reports:[],middle:{status:'locked',path:null,steps:{}}};
 return st.ascent;
};
HK.newGameHooks.push(HK.ascentInit);HK.migrateHooks.push(HK.ascentInit);
HK.ASCENT_ACHIEVEMENTS={
 salt:{name:['Salz für die Hanse','Salt for the Hanse'],goal:['1.000 Last Salz kaufen oder verkaufen','Buy or sell 1,000 last of salt'],target:1000,value:st=>st.ascent.traded.salt||0},
 honest:{name:['Ein ehrliches Jahrzehnt','An honest decade'],goal:['Zehn beobachtete Jahre ohne Schmuggel','Ten recorded years without smuggling'],target:3650,value:st=>st.day-st.ascent.cleanSince},
 allies:{name:['Drei Häuser, ein Bündnis','Three houses, one alliance'],goal:['Mit allen drei Rivalen zugleich verbündet sein','Be allied to all three rivals at once'],target:3,value:st=>st.rivals.filter(r=>r.ally).length},
 storms:{name:['Wetterfest','Weathered'],goal:['Dasselbe eigene Schiff übersteht drei Stürme','The same owned ship survives three storms'],target:3,value:st=>Math.max(0,...st.ownShips.map(s=>st.ascent.storms[s.id]||0))},
};
HK.ascentAchievements=function(st){const A=HK.ascentInit(st);for(const [id,d]of Object.entries(HK.ASCENT_ACHIEVEMENTS))if(A.achievements[id]===undefined&&d.value(st)>=d.target){A.achievements[id]=st.day;HK.log(st,'ascentAchievement',{name:HK.ascentText(d.name)},'good');}};
for(const [method,goodIndex,qtyIndex,smIndex]of [['marketBuy',0,1],['marketSell',0,1],['buyFromVisitor',1,2,3],['sellToVisitor',1,2,3],['fishmarketSell',0,1],['buyFromMonks',0,1],['fenceSell',0,1]]){
 const before=HK[method];HK[method]=function(st,...args){const g=args[goodIndex],oldQty=st.warehouse.stock[g]||0,result=before(st,...args);if(result.ok){const A=HK.ascentInit(st),q=Math.abs((st.warehouse.stock[g]||0)-oldQty);if(HK.GOOD[g]&&q>0){A.traded[g]=(A.traded[g]||0)+q;if(['marketSell','sellToVisitor','fishmarketSell','fenceSell'].includes(method))A.lastSale[g]=st.day;}if((smIndex!==undefined&&args[smIndex])||method==='fenceSell')A.cleanSince=st.day;HK.ascentAchievements(st);}return result;};
}
{
 const event=HK.triggerEvent;HK.triggerEvent=function(st,type){const ships=type==='storm'?st.ownShips.filter(s=>s.status==='away').map(s=>s.id):[];const r=event(st,type);if(ships.length){const A=HK.ascentInit(st);for(const id of ships)if(st.ownShips.some(s=>s.id===id&&s.hull>0))A.storms[id]=(A.storms[id]||0)+1;HK.ascentAchievements(st);}return r;};
 const smuggle=HK.smuggleCheck;HK.smuggleCheck=function(st,...args){HK.ascentInit(st).cleanSince=st.day;return smuggle(st,...args);};
}
HK.observeVisitors=function(st){
 const A=HK.ascentInit(st);if(A.priceDay===st.day)return;A.priceDay=st.day;
 for(const v of [...st.ships,...st.caravans])for(const [direction,rows]of [['buy',v.cargo],['sell',v.wants]])for(const [good,row]of Object.entries(rows))if(row.qty>0){
  A.prices.push({day:st.day,visitor:v.id,origin:v.origin,name:v.sea?v.captain:v.name||'',good,direction,qty:row.qty,quality:direction==='buy'?(row.quality??100):HK.goodQuality(st,good),price:direction==='buy'?HK.nettoKauf(st,v,good):HK.nettoVerkauf(st,v,good)});
 }
 A.prices=A.prices.filter(p=>p.day>=st.day-59).slice(-2400);
};
HK.newGameHooks.push(HK.observeVisitors);
HK.migrateHooks.push(st=>{if(st.ascent.priceDay<0)HK.observeVisitors(st);});
HK.factorSuggestions=function(st){
 const rows=[],A=st.ascent;
 for(const c of st.contracts.active.filter(c=>c.type==='deliver'&&st.day<=c.deadline).sort((a,b)=>a.deadline-b.deadline)){
  const missing=Math.max(0,c.qty-Math.floor(st.warehouse.stock[c.good]||0));rows.push({kind:missing?'deadline':'ready',good:c.good,qty:missing||c.qty,due:c.deadline,contract:c.id,tab:missing?'planning':'missions',priority:100-(c.deadline-st.day)});
 }
 for(const d of HK.ruralWaiting(st))rows.push({kind:'incoming',good:d.good,qty:d.qty,due:d.eta,cost:d.cost,panel:'warehouse',priority:45});
 for(const a of HK.tradeAdvances(st))rows.push({kind:'incoming',good:a.good,qty:a.qty,due:a.eta,cost:a.cost,panel:'warehouse',priority:45});
 for(const [good,stock]of Object.entries(st.warehouse.stock)){
  const qty=Math.floor(stock);if(qty<1)continue;const best=HK.besterAbnehmer(st,good);
  if(best&&best.art!=='auftrag'){const visitor=best.visitor!==undefined?HK.findVisitor(st,best.visitor):null;rows.push({kind:'sale',good,qty:Math.min(qty,best.menge),price:best.preis,buyer:best.wer,since:A.lastSale[good]??A.since,panel:visitor?(visitor.sea?'harbour':'gate'):'market',visitor:visitor?.id,priority:st.factor?.trait==='greedy'?70:30});}
 }
 for(const [site,s]of Object.entries(st.rural.sites))if(s.owner&&s.reason)rows.push({kind:'idle',site,reason:s.reason,panel:'rural',priority:st.factor?.trait==='able'?80:60});
 if(!rows.length)rows.push({kind:'calm',panel:'kontor',priority:0});
 return rows.sort((a,b)=>b.priority-a.priority).slice(0,3).map(({priority,...row})=>row);
};
HK.writeFactorReport=function(st){
 const A=HK.ascentInit(st);if(!st.factor||st.day-A.lastReport<7||st.day-(st.factor.since??st.day)<7)return;
 A.lastReport=st.day;const report={day:st.day,name:st.factor.name,trait:st.factor.trait,rows:HK.factorSuggestions(st)};
 A.reports.push(report);A.reports=A.reports.slice(-12);
 HK.postAdd(st,'factor-report:'+st.day,'factorReport','factor',{report});
};
const ms=(id,name,panel,check)=>({id,name,panel,check});
HK.MIDDLE_PATHS={
 production:{name:['Ein eigener Betrieb','Your own business'],art:'rural',steps:[
  ms('join',['Löhne, Rohstoffe und Eigentum prüfen','Review wages, inputs and ownership'],'rural',st=>st.craftGuild||st.guildMember||!!st.helpSeen?.ruralOwnershipHelp),
  ms('own',['Eine Werkstatt oder einen Erzeuger besitzen','Own a workshop or a producer'],'rural',st=>st.workshops.some(w=>w.type)||Object.values(st.rural.sites).some(s=>s.owner)),
  ms('inputs',['Den Betrieb mit Rohstoffen versorgen','Supply production inputs'],'warehouse',st=>st.workshops.some(w=>w.type&&Object.entries(HK.WORKSHOP[w.type].inp).every(([g,q])=>(st.warehouse.stock[g]||0)>=q))||Object.entries(st.rural.sites).some(([id,s])=>s.owner&&Object.entries(HK.RURAL_SITES[id].inp||{}).every(([g,q])=>(st.warehouse.stock[g]||0)>=q))),
  ms('produce',['Einen Arbeitsgang abschließen','Complete a production batch'],'rural',st=>!!st.ascent.middle.produced),
  ms('reserve',['1.000 Mark Betriebsmittel zurücklegen','Keep 1,000 marks in reserve'],'kontor',st=>st.money>=1000)]},
 sea:{name:['Die erste eigene Fahrt','Your first voyage'],art:'harbour',steps:[
  ms('ship',['Ein eigenes Schiff besitzen','Own a ship'],'shipyard',st=>st.ownShips.length>0),
  ms('captain',['Eine Kapitänin oder einen Kapitän einstellen','Hire a captain'],'shipyard',st=>st.ownShips.some(s=>s.captain)||!!st.ascent.returned),
  ms('cargo',['Das Schiff mit Handelsware beladen','Load trade goods aboard'],'harbour',st=>st.ownShips.some(s=>HK.stockUsed(s.cargo)>0)||!!st.ascent.returned),
  ms('send',['Eine Handelsfahrt beginnen','Begin a trading voyage'],'harbour',st=>st.ownShips.some(s=>s.status==='away'&&s.phase!=='privateer')||!!st.ascent.returned),
  ms('return',['Eine Fahrt abschließen','Complete a voyage'],'harbour',st=>!!st.ascent.returned)]},
 property:{name:['Beständigen Besitz aufbauen','Build lasting holdings'],art:'house',steps:[
  ms('read',['Unterhalt und Ertrag prüfen','Review upkeep and income'],'kontor',st=>!!st.helpSeen?.officeHelp),
  ms('house',['Ein bewohntes Bürgerhaus erwerben','Acquire an occupied burgher house'],'kontor',st=>Object.values(st.burghers).some(h=>h.owner==='player')),
  ms('condition',['Eigene Häuser instand halten','Maintain your houses'],'kontor',st=>Object.values(st.burghers).some(h=>h.owner==='player')&&!Object.values(st.burghers).some(h=>h.owner==='player'&&h.damaged)),
  ms('rent',['Miete aus einem Bürgerhaus erhalten','Receive rent from a burgher house'],'kontor',st=>!!st.ascent.middle.rent),
  ms('reserve',['2.000 Mark Rücklage behalten','Keep a reserve of 2,000 marks'],'kontor',st=>st.money>=2000)]},
 politics:{name:['Eine Stimme im Rat','A voice on the council'],art:'townhall',steps:[
  ms('laws',['Ratsregeln und Einflusskosten lesen','Read council rules and influence costs'],'townhall',st=>!!st.helpSeen?.councilLawsHelp),
  ms('rep',['Mindestens 40 Ruf erreichen','Reach at least 40 reputation'],'townhall',st=>st.rep>=40),
  ms('ally',['Einen Ratsherrn mit Loyalität 60 gewinnen','Win a councillor with loyalty 60'],'townhall',st=>HK.councillors().some(c=>st.persons[c.id].loyalty>=60)),
  ms('influence',['20 Einfluss sammeln','Gather 20 influence'],'townhall',st=>st.influence>=20),
  ms('seat',['Einen Ratssitz gewinnen','Win a council seat'],'townhall',st=>st.seat!=='none')]},
};
HK.middleUpdate=function(st){const M=HK.ascentInit(st).middle;if(M.status==='locked'&&st.lehrgang?.fertig&&HK.netWorth(st)>=30000){M.status='available';HK.postAdd(st,'middle-offer','middleOffer','factor');}if(M.status!=='active')return;for(const step of HK.MIDDLE_PATHS[M.path].steps){if(M.steps[step.id]!==undefined)continue;if(!step.check(st))break;M.steps[step.id]=st.day;}if(HK.MIDDLE_PATHS[M.path].steps.every(s=>M.steps[s.id]!==undefined)){M.status='done';M.finished=st.day;HK.log(st,'middleDone',{name:HK.ascentText(HK.MIDDLE_PATHS[M.path].name)},'good');}};
HK.middleChoose=function(st,path){const M=HK.ascentInit(st).middle;if(st.gameOver||M.status!=='available'||!HK.MIDDLE_PATHS[path])return{ok:false};M.path=path;M.status='active';HK.middleUpdate(st);HK.scheduleSave?.();return{ok:true};};
HK.middleArchive=function(st){const M=HK.ascentInit(st).middle;if(!['active','available'].includes(M.status))return{ok:false};M.status='archived';HK.scheduleSave?.();return{ok:true};};
HK.middleRestore=function(st){const M=HK.ascentInit(st).middle;if(M.status!=='archived')return{ok:false};M.status=M.path?'active':'available';HK.middleUpdate(st);return{ok:true};};
{
 const batch=HK.ruralBatch;HK.ruralBatch=function(st,s,...args){const r=batch(st,s,...args);if(!r&&s.owner&&st.ascent)st.ascent.middle.produced=true;return r;};

 const tick=HK.tick;HK.tick=function(st){const day=st.day;tick(st);if(st.day===day||st.gameOver)return;HK.observeVisitors(st);HK.writeFactorReport(st);HK.middleUpdate(st);HK.ascentAchievements(st);};
}
Object.assign(HK.I18N.de,{ascentAchievement:'Erfolg erreicht: {name}.',middleDone:'Vorhaben abgeschlossen: {name}.',postSubject_factorReport:'Wochenbericht deines Faktors',postSubject_middleOffer:'Dein nächster Schritt',postBody_middleOffer:'Dein Handelshaus ist gewachsen. Im Auftragsbuch kannst du jetzt einen freiwilligen Lehrgang für Produktion, Seefahrt, Besitz oder Rat wählen.',ascentAchievements:'Deine Handelsgeschichte',ascentObserved:'Erfasst seit {date}; frühere Taten werden nicht nachträglich erfunden.',middleTitle:'Dein nächster Schritt',middleHint:'Ein freiwilliger Lehrgang für die Mittelphase. Wähle einen Schwerpunkt; vorhandene Leistungen zählen. Du kannst den Lehrgang archivieren, ohne Spielmöglichkeiten zu verlieren.',middleChoose:'Schwerpunkt wählen',middleArchive:'Lehrgang archivieren',middleRestore:'Lehrgang fortsetzen',visitorObservations:'Beobachtete Besucherpreise',visitorObservationHelp:'Datierte Einzelangebote nach Zoll, je Last und ohne einmaligen Mengenrabatt. Die Menge und Güte galten bei der Beobachtung. Verkaufspreise beziehen sich auf deine damalige Güte. Alte Angebote sind keine aktuellen Zusagen.',factorReportTitle:'Bericht vom {date}',factorReportIntro:'{name} hat diese Lage am {date} beobachtet. Preise, Mengen und Fristen können sich inzwischen geändert haben.',factor_deadline:'{qty} Last {good} fehlen für die Lieferung bis {date}.',factor_ready:'{qty} Last {good} sind für die Lieferung bis {date} vorhanden. Prüfe auch die verlangte Güte.',factor_incoming:'{qty} Last {good} sind bestellt: {cost} Mark gebunden, frühestens {date}.',factor_sale:'{buyer} zahlt derzeit {price} Mark je Last {good}, höchstens {qty} Last. Letzter beobachteter Verkauf bzw. Beginn der Erfassung: {date}.',factor_idle:'Bei {site} ruht die Arbeit: {reason}.',factor_calm:'Keine dringende Verpflichtung gefunden. Prüfe vor einem neuen Geschäft deinen Lagerplatz und deine Rücklage.',ascentGo:'Ansehen',ascentReportOpen:'Wochenbericht lesen',ascentReportsNone:'Nach sieben Tagen im Dienst schreibt dein Faktor den ersten Wochenbericht.'});
Object.assign(HK.I18N.en,{ascentAchievement:'Achievement earned: {name}.',middleDone:'Undertaking completed: {name}.',postSubject_factorReport:'Your factor’s weekly report',postSubject_middleOffer:'Your next step',postBody_middleOffer:'Your trading house has grown. Choose an optional course in production, shipping, property or council affairs in your order book.',ascentAchievements:'Your trading history',ascentObserved:'Recorded since {date}; earlier deeds are not invented retroactively.',middleTitle:'Your next step',middleHint:'An optional course for the middle game. Choose a focus; existing accomplishments count. Archiving the course does not lock any gameplay.',middleChoose:'Choose a focus',middleArchive:'Archive course',middleRestore:'Resume course',visitorObservations:'Observed visitor prices',visitorObservationHelp:'Dated offers after duty, per last, without one-time bulk discounts. Quantity and quality applied at observation time. Sale prices use your quality at that time. Old offers are not current promises.',factorReportTitle:'Report of {date}',factorReportIntro:'{name} observed this situation on {date}. Prices, quantities and deadlines may since have changed.',factor_deadline:'You are short of {qty} last of {good} for delivery by {date}.',factor_ready:'{qty} last of {good} are in stock for delivery by {date}. Check the required quality too.',factor_incoming:'{qty} last of {good} are on order: {cost} marks committed, expected no earlier than {date}.',factor_sale:'{buyer} currently pays {price} marks per last of {good}, up to {qty} last. Last recorded sale or start of observations: {date}.',factor_idle:'Work at {site} is halted: {reason}.',factor_calm:'No urgent obligation found. Check storage capacity and reserves before your next deal.',ascentGo:'View',ascentReportOpen:'Read weekly report',ascentReportsNone:'Your factor writes their first weekly report after seven days in service.'});

HK.noteAscentProduction=st=>{if(st.ascent)st.ascent.middle.produced=true;};
HK.noteAscentRent=st=>{if(st.ascent)st.ascent.middle.rent=true;};

{ const log=HK.log;HK.log=function(st,key,...args){if(key==='shipReturned'&&st.ascent)st.ascent.returned=(st.ascent.returned||0)+1;return log(st,key,...args);}; }
{ const buy=HK.buyContraband;HK.buyContraband=function(st,...args){const r=buy(st,...args);if(r.ok)HK.ascentInit(st).cleanSince=st.day;return r;}; }
