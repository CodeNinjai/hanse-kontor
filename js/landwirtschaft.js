/* Farms and local crafts: finite stocks, real inputs, timed deliveries. DOM-free. */
'use strict';
HK.RURAL_SITES = {
  grainfarm:{period:7,cost:3600,wage:12,out:{grain:12},crops:true},
  fiberfarm:{period:7,cost:4200,wage:12,out:{flax:10},crops:true},
  sheepfarm:{period:3,cost:4600,wage:8,inp:{grain:1},out:{wool:3}},
  cattlefarm:{period:1,cost:6200,wage:5,inp:{grain:1},out:{milk:3},extra:{cattle:1},extraPeriod:7},
  dairy:{period:1,cost:4000,wage:6,inp:{milk:3},out:{cheese:1}},
  windmill:{period:1,cost:9800,wage:8,inp:{grain:3},out:{flour:3}},
  woodcutter:{period:2,cost:4200,wage:8,out:{timber:4},resource:80,regrow:1,use:4},
  hunter:{period:3,cost:3800,wage:10,out:{meat:2,hides:1,furs:1},resource:50,regrow:.75,use:3},
  quarry:{period:2,cost:7000,wage:10,out:{stone:4},resource:2000,use:4},
  stonemason:{period:1,cost:5500,wage:12,inp:{stone:3},out:{dressedstone:2}},
  hopgarden:{period:7,cost:2800,wage:10,out:{hops:4},winterRest:true},   // Hopfen wächst nur von Frühjahr bis Herbst; im Winter ruht der Garten wie die Äcker
  malthouse:{period:2,cost:3200,wage:5,inp:{barley:3},out:{malt:2}},
};
// Crops a field farm can rotate through; grain and barley yield alike.
HK.RURAL_CROPS=['grain','barley','hemp','flax'];
HK.ruralCropYield=good=>['grain','barley'].includes(good)?12:10;
HK.RURAL_RECIPES = {
  tannery:{inp:{hides:2,salt:1},out:{leather:2},wage:10},
  butcher:{inp:{cattle:1},out:{meat:4,hides:2},wage:12},
  bakery:{inp:{flour:2},out:{},wage:0},
};
HK.ruralCraftRecipe=function(st,id){
  const d=HK.RURAL_RECIPES[id],level=st.ventures[id]?.level||1;
  return{inp:Object.fromEntries(Object.entries(d.inp).map(([g,q])=>[g,q*level])),out:Object.fromEntries(Object.entries(d.out).map(([g,q])=>[g,q*level])),wage:d.wage*level,skill:st.ventures[id]?.master?3:0};
};
HK.ruralInit = function(st) {
  st.rural ||= {sites:{},deliveries:[],nextId:1,day:st.day,crafts:{}};
  const R=st.rural; R.crafts ||= {};
  for(const [id,d] of Object.entries(HK.RURAL_SITES)) {
    R.sites[id] ||= {stock:Object.fromEntries(Object.entries(d.out).map(([g,q])=>[g,q*6])),quality:{},owner:false,active:true,crop:Object.keys(d.out)[0],next:st.day+d.period,resource:d.resource,reason:null};
    HK.qualityStocks.set(R.sites[id].stock,R.sites[id].quality);
  }
  return R;
};
HK.newGameHooks.push(HK.ruralInit);HK.migrateHooks.push(HK.ruralInit);
HK.ruralWaiting = st => (st.rural?.deliveries||[]).filter(d=>d.status==='waiting');
const ruralFree=HK.whFree, ruralWorth=HK.netWorth;
HK.whFree=st=>ruralFree(st)-HK.ruralWaiting(st).reduce((n,d)=>n+d.qty,0);
HK.netWorth=function(st){
  let worth=ruralWorth(st)+HK.ruralWaiting(st).reduce((n,d)=>n+d.value,0);
  for(const [id,s] of Object.entries(st.rural?.sites||{}))if(s.owner)worth+=HK.RURAL_SITES[id].cost*.6+HK.stockValue(s.stock);
  return Math.round(worth);
};
HK.ruralQuote=function(st,id,good,qty){
  const s=st.rural?.sites[id],def=HK.RURAL_SITES[id];
  if(st.gameOver||!s||!def||!HK.GOOD[good]||!Number.isInteger(qty)||qty<=0||(s.stock[good]||0)<qty)return{ok:false,msg:'notEnoughStock'};
  if(HK.whFree(st)<qty)return{ok:false,msg:'warehouseFull'};
  const quality=HK.goodQuality({warehouse:s},good),unit=s.owner?0:Math.round(HK.GOOD[good].base*.82*HK.qualityFactor(quality));
  const freight=8+Math.ceil(qty/10)*2,goods=unit*qty,cost=goods+freight;
  if(st.money<cost)return{ok:false,msg:'notEnoughMoney'};
  return{ok:true,site:id,good,qty,quality,unit,goods,freight,cost,ownSource:s.owner,value:s.owner?HK.GOOD[good].base*qty:goods,eta:st.day+1};
};
HK.orderRural=function(st,id,good,qty){
  const q=HK.ruralQuote(st,id,good,qty);if(!q.ok)return q;
  HK.book(st,'market',-q.cost);HK.addStock(st.rural.sites[id].stock,good,-qty);
  st.rural.deliveries.push({...q,id:st.rural.nextId++,status:'waiting',ordered:st.day,latest:st.day+9});
  HK.log(st,'ruralOrdered',{qty,good:HK.goodName(good),site:HK.name(HK.RURAL_BUILDINGS[id]),date:HK.fmtDate(q.eta)},'info');
  HK.scheduleSave?.();return{ok:true,cost:q.cost};
};
HK.buyRural=function(st,id){
  const s=st.rural?.sites[id],d=HK.RURAL_SITES[id];
  if(st.gameOver||!s||!d||s.owner)return{ok:false};
  if(st.money<d.cost)return{ok:false,msg:'notEnoughMoney'};
  HK.book(st,'investments',-d.cost);
  // Remaining merchant stock is sold into the city before the business changes hands.
  for(const [g,q] of Object.entries(s.stock))HK.withQuality(s.quality[g]??100,()=>HK.addStock(st.town.stock,g,q));
  s.stock={};s.quality={};HK.qualityStocks.set(s.stock,s.quality);s.owner=true;
  HK.log(st,'ruralPurchased',{site:HK.name(HK.RURAL_BUILDINGS[id])},'good');return{ok:true};
};
HK.setRuralCrop=function(st,id,good){
  const s=st.rural?.sites[id],d=HK.RURAL_SITES[id];
  if(st.gameOver||!s?.owner||!d?.crops||!HK.RURAL_CROPS.includes(good)||s.crop===good&&!s.nextCrop||s.nextCrop===good)return{ok:false};
  if(s.crop===good)delete s.nextCrop;else s.nextCrop=good;HK.scheduleSave?.();return{ok:true};
};
HK.toggleRural=function(st,id){const s=st.rural?.sites[id];if(st.gameOver||!s?.owner)return{ok:false};s.active=!s.active;HK.scheduleSave?.();return{ok:true};};
HK.setRuralCraft=function(st,id){
  if(st.gameOver||!HK.RURAL_RECIPES[id]||id==='bakery'||!HK.hasVenture(st,id))return{ok:false};
  st.rural.crafts[id]=st.rural.crafts[id]==='produce'?'income':'produce';HK.scheduleSave?.();return{ok:true};
};
const ruralIncome=HK.ventureIncome;
HK.ventureIncome=function(st,id){
  if(st.rural?.crafts[id]==='produce'&&HK.RURAL_RECIPES[id])return 0;
  return ruralIncome(st,id);
};
HK.ruralYield=function(st,id){
  const s=st.rural.sites[id],d=HK.RURAL_SITES[id],winter=[11,0,1].includes(HK.monthOf(st.day));
  const out=d.crops?{[s.crop]:HK.ruralCropYield(s.crop)}:{...d.out};
  if((d.crops||d.winterRest)&&winter)return{};
  if(d.extra&&st.day% d.extraPeriod===0)Object.assign(out,d.extra);
  for(const good of Object.keys(out))out[good]=Math.max(1,Math.round(out[good]*(HK.cityProductionMod?.(st,good)??1)));
  return out;
};
HK.ruralBatch=function(st,s,d,out,inputStock,inputQuality,dest,quality){
  const qty=Object.values(out).reduce((a,b)=>a+b,0),used=Object.values(d.inp||{}).reduce((a,b)=>a+b,0);
  if(!qty)return'ruralWinter';
  if(Object.entries(d.inp||{}).some(([g,q])=>(inputStock[g]||0)<q))return'ruralInputs';
  const free=dest===st.warehouse.stock?HK.whFree(st)+(dest===inputStock?used:0):100-HK.stockUsed(dest);
  if(free<qty)return'ruralFull';
  if(d.resource&&s.resource<d.use)return'ruralResourceEmpty';
  const inputGrade=Math.min(120,...Object.keys(d.inp||{}).map(g=>inputQuality[g]??100));
  for(const [g,q] of Object.entries(d.inp||{}))HK.addStock(inputStock,g,-q);
  if(d.resource)s.resource-=d.use;
  for(const [g,q] of Object.entries(out))HK.withQuality(Math.min(inputGrade,HK.cityProducedQuality(st,g))+(d.skill||0),()=>HK.addStock(dest,g,q));
  if(s.owner&&d.wage)HK.book(st,'wages',-d.wage);
  return null;
};
HK.ruralDay=function(st){
  const R=HK.ruralInit(st);if(R.day>=st.day)return;R.day=st.day;
  // Arrival releases reserved space before adding goods. Animation never settles quantities.
  for(const d of HK.ruralWaiting(st)){
    if(st.day>d.latest){d.status='refunded';d.finished=st.day;HK.book(st,'market',d.cost);const src=!d.ownSource&&R.sites[d.site].owner?st.town:R.sites[d.site];HK.withQuality(d.quality,()=>HK.addStock(src.stock,d.good,d.qty));HK.log(st,'ruralRefunded',{good:HK.goodName(d.good)},'info');continue;}
    if(st.landClosedUntil>st.day){d.eta++;continue;}
    if(st.day<d.eta)continue;
    d.status='delivered';d.finished=st.day;
    HK.withQuality(d.quality,()=>HK.addStock(st.warehouse.stock,d.good,d.qty,d.cost+(d.ownSource?HK.marketSellPrice(st,d.good,d.qty)*d.qty:0)));
    const job=HK.transport(st,null,d.good,d.qty,'in','rural');job.ruralSite=d.site;
    HK.log(st,'ruralArrived',{qty:d.qty,good:HK.goodName(d.good),site:HK.name(HK.RURAL_BUILDINGS[d.site])},'good');
  }
  R.deliveries=R.deliveries.filter(d=>d.status==='waiting'||st.day-d.finished<=30);
  for(const [id,s] of Object.entries(R.sites)){
    const d=HK.RURAL_SITES[id];if(d.regrow)s.resource=Math.min(d.resource,s.resource+d.regrow);
    if(!s.active||st.day<s.next)continue;
    s.next=st.day+d.period;
    const src=s.owner?st.warehouse:st.town;
    s.reason=HK.ruralBatch(st,s,d,HK.ruralYield(st,id),src.stock,src.quality,s.stock,s.quality);
    if(!s.reason) for(const [g,q] of Object.entries(d.inp||{})) HK.localTransport(st,s.owner?'warehouse':'market',id,g,q,s.owner?'player':'city');
    if(!s.reason&&s.nextCrop){s.crop=s.nextCrop;delete s.nextCrop;}
    if(!s.owner){ // Local traders distribute a share of the finite stock to the market.
      for(const [g,q] of Object.entries(s.stock)){const sent=Math.floor(q*.12);if(sent){HK.withQuality(s.quality[g]??100,()=>HK.addStock(st.town.stock,g,sent));HK.addStock(s.stock,g,-sent);HK.localTransport(st,id,'market',g,sent,'city');}}
    }
  }
  for(const [id,mode] of Object.entries(R.crafts))if(mode==='produce'&&HK.hasVenture(st,id)){
    const d=HK.ruralCraftRecipe(st,id),s={owner:true};
    R.craftStatus ||= {};R.craftStatus[id]=HK.ruralBatch(st,s,d,d.out,st.warehouse.stock,st.warehouse.quality,st.warehouse.stock,st.warehouse.quality);
    if(!R.craftStatus[id]) {
      for(const [g,q] of Object.entries(d.inp)) HK.localTransport(st,'warehouse',id,g,q);
      for(const [g,q] of Object.entries(d.out)) HK.localTransport(st,id,'warehouse',g,q);
    }
  }
};
Object.assign(HK.I18N.de,{
  ruralFarmOrder:"Beim Bauern bestellen",
  ruralProducerOrder:"Beim Erzeuger bestellen",
  ruralOwnStock:"Deine Waren vor Ort",
  ruralFarmBuy:"Hof übernehmen",
  ruralBusinessBuy:"Betrieb übernehmen",
  ruralManage:"Deinen Betrieb führen",
  ruralTakeOver:"Übernehmen",
  ruralBatchOutput:"Produktion je Arbeitsgang",
  ruralAvailable:"{qty} Last vor Ort verfügbar",
  ruralQuality:"Qualität {quality} (100 = normal)",
  ruralOwnerWages:"Als Eigentümer: {cost} Mark Lohn je Arbeitsgang",
  ruralPaused:"Produktion pausiert",
  ruralStockExcluded:"Der vorhandene Warenbestand ist nicht im Kaufpreis enthalten.",
  ruralOwnershipBenefit:"Künftige Erzeugnisse gehören dir und bleiben bis zur Abholung vor Ort.",
  ruralOrderQuantity:"Liefermenge: {qty} Last",
  ruralPriceBreakdown:"Ware {goods} + Fracht {freight} Mark",
  ruralFreightOnly:"Nur Fracht: {freight} Mark",
  ruralEarliest:"Früheste Ankunft: {date}",
  ruralOwnStockEmpty:"Noch keine Waren vor Ort. Nach der nächsten erfolgreichen Produktion kannst du sie abholen lassen.",
  ruralStockEmpty:"Zurzeit keine Waren vor Ort verfügbar.",
  ruralOrderHelp:"<p><b>Bestand:</b> Die angezeigten Last sind jetzt beim Erzeuger verfügbar. Last ist die Mengeneinheit für Waren. Dafür musst du den Betrieb nicht besitzen.</p><p><b>Bestellen:</b> Du bezahlst Ware und Fracht sofort; bei eigenen Waren nur die Fracht. Der Gesamtpreis gilt für die angezeigte Liefermenge. Diese kann auf Vorrat, freien Lagerplatz und dein Geld begrenzt sein. Die Fracht kostet 8 Mark plus 2 Mark je angefangene 10 Last.</p><p><b>Ankunft:</b> Frühestens am nächsten Spieltag in deinem Lagerhaus. Der Platz wird sofort reserviert. Landsperren können die Lieferung verzögern; ist sie nach neun Tagen noch blockiert, wird der bezahlte Betrag vollständig erstattet.</p><p><b>Qualität:</b> 100 ist normale Qualität, kein Höchstwert. Niedrigere Werte bedeuten schlechtere, höhere Werte bessere Ware. Sie beeinflusst den Warenpreis.</p>",
  ruralOwnershipHelp:"<p><b>Übernahme:</b> Der Kaufpreis wird einmalig bezahlt. Der bisherige Warenbestand ist nicht enthalten: Er geht beim Besitzerwechsel an den Stadtmarkt. Bereits bestellte Lieferungen bleiben bestehen.</p><p><b>Dein Betrieb:</b> Künftige Erzeugnisse gehören dir. Benötigte Rohstoffe kommen aus deinem Lagerhaus. Löhne werden nur bei erfolgreicher Produktion fällig, nicht jeden Tag zusätzlich.</p><p><b>Abholung:</b> Die Erzeugnisse bleiben am Betrieb. Du lässt sie gegen Frachtkosten in dein Lagerhaus bringen. Arbeit pausieren und wieder aufnehmen kannst du hier; bei Ackerhöfen lässt sich auch die nächste Kultur wählen.</p>",
  ruralProductionHelp:"<p><b>Je Arbeitsgang:</b> Die Symbole zeigen die normalen Warenmengen in Last. Links vom Pfeil stehen benötigte Rohstoffe, rechts die Erzeugnisse. Ohne Pfeil werden keine Waren als Rohstoffe benötigt. Ereignisse können Ertrag und Qualität verändern.</p><p><b>Rhythmus:</b> „Alle 7 Tage“ heißt ein Arbeitsgang alle sieben Spieltage. Der nächste Produktionstermin ist kein Liefertermin. Fehlende Rohstoffe, voller Bestand, erschöpfte Ressourcen oder Winterruhe können einen Arbeitsgang verhindern; auf Ackerhöfen ruht die Produktion im Winter.</p><p><b>Lohn:</b> Du zahlst ihn erst als Eigentümer und nur je erfolgreichem Arbeitsgang. Bei einem fremden Erzeuger zahlst du ausschließlich deine Bestellung.</p><p><b>Bierkette:</b> Ein Bauernhof kann statt Korn auch Gerste anbauen. Die Mälzerei macht aus 3 Last Gerste 2 Last Malz, der Hopfengarten liefert Hopfen. Die Brauerei in der Stadt braut aus 2 Last Malz und 1 Last Hopfen 4 Last Bier; fehlt eines davon im Lager, steht sie still.</p>",

  ruralShowMap:'Auf Karte zeigen',
  ruralDaily:'Arbeitsgang täglich',ruralQueuedCrop:'Nach dieser Ernte: {good}',
  cityChoice_animalCare:'Futter und Tierpflege finanzieren',cityChoice_forestRights:'Forst- und Jagdrechte aushandeln',
  ruralTitle:'Umland & Produktion',ruralHelp:'Bauern und Handwerker haben endliche Vorräte. Käufe und Abholungen reservieren Platz im Lager und kommen frühestens am nächsten Tag. Landsperren verschieben die Ankunft; nach neun Tagen wird ein blockierter Auftrag vollständig erstattet. Eigene Betriebe verbrauchen Rohstoffe aus deinem Lager, zahlen Löhne je Arbeitsgang und behalten Erzeugnisse vor Ort. Der Winter unterbricht die Feldwirtschaft. Gerberei und Fleischerei können zwischen Geldeinnahmen und Warenproduktion wechseln.',
  ruralOwned:'Dein Betrieb',ruralLocal:'Lokaler Erzeuger',ruralCycle:'Arbeitsgang alle {days} Tage',ruralNext:'Nächster Arbeitsgang: {date}',ruralWages:'Lohn je Arbeitsgang: {cost} Mark',ruralInputs:'Rohstoffe fehlen',ruralFull:'Lager am Betrieb voll',ruralWinter:'Winterruhe auf den Feldern',ruralResourceEmpty:'Ressource erschöpft',ruralGrowing:'Die laufende Kultur muss erst abgeerntet werden.',ruralResource:'Ressource: {qty} / {max}',ruralRegrow:'Erholung: +{qty} je Tag',ruralOutput:'Erzeugnisse',ruralNeeds:'Verbraucht',ruralBuy:'Betrieb kaufen · {cost} Mark',ruralOrder:'Liefern lassen',ruralCollect:'Abholen lassen',ruralArrival:'Frühestens morgen · Fracht ab 10 Mark',ruralPause:'Arbeit pausieren',ruralResume:'Arbeit aufnehmen',ruralCrop:'Nächste Kultur',ruralCropHelp:'Nach der Ernte: Korn, Gerste, Hanf oder Flachs. Die neue Kultur braucht sieben Tage.',ruralProduction:'Warenproduktion',ruralIncome:'Geldeinnahmen',ruralCraftSwitch:'Betriebsart wechseln',ruralDeliveries:'Lieferungen aus dem Umland',ruralOrdered:'{qty} Last {good} bei {site} bestellt. Früheste Ankunft: {date}.',ruralArrived:'{qty} Last {good} von {site} im Lager eingetroffen.',ruralPurchased:'{site} gehört jetzt deinem Handelshaus.',ruralRefunded:'Die Lieferung von {good} wurde nach der Landsperre vollständig erstattet.',ruralGrainExtra:'Zusätzlich alle sieben Tage: 1 Last Vieh',ruralOverview:'Bauern, Mühle, Wald & Stein',ruralTransport:'Lieferung aus dem Umland',
});
Object.assign(HK.I18N.en,{
  ruralFarmOrder:"Order from the farmer",
  ruralProducerOrder:"Order from the producer",
  ruralOwnStock:"Your goods on site",
  ruralFarmBuy:"Take over the farm",
  ruralBusinessBuy:"Take over the business",
  ruralManage:"Manage your business",
  ruralTakeOver:"Take over",
  ruralBatchOutput:"Production per batch",
  ruralAvailable:"{qty} last available on site",
  ruralQuality:"Quality {quality} (100 = normal)",
  ruralOwnerWages:"As owner: {cost} marks wages per batch",
  ruralPaused:"Production paused",
  ruralStockExcluded:"Existing goods are not included in the purchase price.",
  ruralOwnershipBenefit:"Future products belong to you and stay on site until collected.",
  ruralOrderQuantity:"Delivery quantity: {qty} last",
  ruralPriceBreakdown:"Goods {goods} + freight {freight} marks",
  ruralFreightOnly:"Freight only: {freight} marks",
  ruralEarliest:"Earliest arrival: {date}",
  ruralOwnStockEmpty:"No goods on site yet. Arrange collection after the next successful production batch.",
  ruralStockEmpty:"No goods currently available on site.",
  ruralOrderHelp:"<p><b>Stock:</b> The last shown are goods currently available at the producer. Last is the unit for goods. You do not need to own the business to order.</p><p><b>Ordering:</b> Pay for goods and freight immediately; for your own goods, pay freight only. The total applies to the displayed delivery quantity, which may be limited by stock, warehouse space and funds. Freight costs 8 marks plus 2 marks per started 10 last.</p><p><b>Arrival:</b> Your warehouse receives the goods no earlier than the next game day. Space is reserved immediately. Road closures can delay delivery; if still blocked after nine days, the payment is refunded in full.</p><p><b>Quality:</b> 100 means normal quality, not a maximum. Lower values mean poorer goods, higher values better goods. Quality affects the goods price.</p>",
  ruralOwnershipHelp:"<p><b>Taking over:</b> Pay the purchase price once. Existing goods are not included: they go to the town market on transfer. Orders already placed remain valid.</p><p><b>Your business:</b> Future products belong to you. Required inputs come from your warehouse. Wages are charged only for successful production, not as an additional daily fee.</p><p><b>Collection:</b> Products stay on site. Arrange transport to your warehouse for a freight fee. You can pause or resume work here; crop farms also let you choose the next crop.</p>",
  ruralProductionHelp:"<p><b>Per batch:</b> The icons show normal quantities in last. Inputs appear to the left of the arrow and products to the right. Without an arrow, no goods are needed as inputs. Events can change yields and quality.</p><p><b>Schedule:</b> Every 7 days means one batch every seven game days. The next production date is not a delivery date. Missing inputs, full storage, depleted resources or winter rest can prevent production; crop farms stop producing in winter.</p><p><b>Wages:</b> You pay these only as owner and only for each successful batch. At another producer, you only pay for your order.</p><p><b>Beer chain:</b> A farm can grow barley instead of grain. The malthouse turns 3 last of barley into 2 last of malt, and the hop garden supplies hops. The brewery in town brews 4 last of beer from 2 last of malt and 1 last of hops; if either is missing from the warehouse, it stands idle.</p>",

  ruralShowMap:'Show on map',
  ruralDaily:'A batch every day',ruralQueuedCrop:'After this harvest: {good}',
  cityChoice_animalCare:'Fund feed and animal care',cityChoice_forestRights:'Negotiate forestry and hunting rights',
  ruralTitle:'Countryside & production',ruralHelp:'Farmers and craftspeople hold finite stocks. Purchases and collections reserve warehouse space and arrive no earlier than the following day. Road closures delay arrival; blocked orders are refunded in full after nine days. Owned businesses use inputs from your warehouse, pay wages per batch and retain products on site. Winter stops field farming. Tannery and butcher can switch between cash income and producing goods.',
  ruralOwned:'Your business',ruralLocal:'Local producer',ruralCycle:'Batch every {days} days',ruralNext:'Next batch: {date}',ruralWages:'Wages per batch: {cost} marks',ruralInputs:'Inputs missing',ruralFull:'Local store full',ruralWinter:'Fields resting for winter',ruralResourceEmpty:'Resource exhausted',ruralGrowing:'Harvest the current crop first.',ruralResource:'Resource: {qty} / {max}',ruralRegrow:'Recovery: +{qty} per day',ruralOutput:'Products',ruralNeeds:'Consumes',ruralBuy:'Buy business · {cost} marks',ruralOrder:'Order delivery',ruralCollect:'Arrange collection',ruralArrival:'Tomorrow at earliest · freight from 10 marks',ruralPause:'Pause work',ruralResume:'Resume work',ruralCrop:'Next crop',ruralCropHelp:'After harvesting: grain, barley, hemp or flax. A new crop takes seven days.',ruralProduction:'Goods production',ruralIncome:'Cash income',ruralCraftSwitch:'Switch operation',ruralDeliveries:'Countryside deliveries',ruralOrdered:'Ordered {qty} last of {good} from {site}. Earliest arrival: {date}.',ruralArrived:'{qty} last of {good} from {site} arrived at the warehouse.',ruralPurchased:'{site} now belongs to your trading house.',ruralRefunded:'The blocked delivery of {good} has been refunded in full.',ruralGrainExtra:'Also every seven days: 1 last of livestock',ruralOverview:'Farms, mill, forest & stone',ruralTransport:'Delivery from the countryside',
});
