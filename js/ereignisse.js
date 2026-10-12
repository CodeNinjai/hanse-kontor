/* City stories: announced, contextual and persistent; economic effects are settled once.
   Quality is the weighted average of each stock, not an extra quantity or a second cash ledger. */
'use strict';
HK.CITY_STORIES = {
  livestockIllness: {duration:7,prod:{milk:.5,cattle:.6,wool:.75},supply:{milk:-.1,cattle:-.08},quality:{milk:82},demand:{meat:1.2,cheese:1.2},mood:-5,art:'cattle',choices:[{id:'animalCare',cost:90,goods:{grain:3},mitigate:true,mood:4,rep:2}]},
  forestBan: {duration:6,prod:{timber:.55,furs:.65,hides:.75},demand:{timber:1.25,stone:1.2},mood:-3,art:'timber',choices:[{id:'forestRights',cost:100,mitigate:true,rep:2,faction:'zuenfte'}]},
  harvest: { months: [7,8,9], duration: 9, prod: {grain:1.5,hemp:1.3,flax:1.35}, supply:{grain:.18,hemp:.12,flax:.15}, quality:{grain:112,hemp:108,flax:110}, mood:6, art:'grain', choices:[{id:'share',goods:{grain:6},mood:6,rep:2,faction:'zuenfte'}] },
  cropFailure: { months:[7,8,9], duration:10, prod:{grain:.6,hemp:.75,flax:.7}, supply:{grain:-.12,hemp:-.08,flax:-.1}, demand:{grain:1.2,hemp:1.15,flax:1.2}, mood:-7, art:'grain', choices:[{id:'relief',goods:{grain:8},mood:8,rep:3,mitigate:true,faction:'zuenfte'}] },
  herringRun: { months:[2,3,4,8,9], duration:7, prod:{fish:1.6}, supply:{fish:.2}, demand:{salt:1.2}, quality:{fish:112}, mood:5, art:'fish', choices:[{id:'salt',goods:{salt:5},cost:40,mood:2,rep:1,protect:30}] },
  emptyNets: { duration:6, prod:{fish:.55}, demand:{smokedfish:1.2}, mood:-4, art:'fish', choices:[{id:'repairNets',goods:{tools:3},mood:4,rep:2,mitigate:true,faction:'zuenfte'}] },
  saltFleet: { duration:8, supply:{salt:.28}, import:{salt:1.35}, mood:3, art:'salt', choices:[{id:'inspect',cost:70,rep:1,protect:30}] },
  heatwave: { months:[5,6,7], duration:6, prod:{fish:.75,milk:.8}, demand:{beer:1.3,fish:.85}, quality:{fish:75,cheese:80,milk:75,meat:80}, mood:-5, damage:{fish:.06,smokedfish:.03,cheese:.05,milk:.08,meat:.05}, choices:[{id:'cool',cost:90,protect:36,mood:2},{id:'water',goods:{beer:5},mood:6,rep:2,mitigate:true}], art:'beer' },
  frost: { months:[11,0,1], duration:8, prod:{grain:.7,fish:.65}, demand:{furs:1.35,timber:1.25}, delay:{sea:2,land:1}, mood:-5, choices:[{id:'warm',goods:{timber:6},mood:6,rep:2,mitigate:true,faction:'zuenfte'}], art:'furs' },
  highWater: { months:[2,3,9,10], duration:7, prod:{grain:.8,wool:.8}, demand:{timber:1.3}, quality:{grain:82}, delay:{land:2}, damage:{grain:.04,wool:.04,cloth:.03,hemp:.04,flax:.04,canvas:.03}, mood:-6, choices:[{id:'raise',goods:{timber:6},cost:40,protect:36,mood:2},{id:'sandbags',cost:120,mood:5,rep:2,mitigate:true}], art:'timber' },
  dockStrike: { duration:6, delay:{sea:2}, wages:1.12, prod:{tools:.8}, mood:-7, choices:[{id:'mediate',cost:120,mood:7,rep:2,mitigate:true,faction:'zuenfte',follow:'cooperation'},{id:'payWorkers',goods:{grain:5,beer:3},mood:5,rep:2,mitigate:true,faction:'zuenfte'}], art:'tools' },
  guildFair: { duration:5, demand:{tools:1.3,cloth:1.25,rope:1.25,canvas:1.3}, quality:{tools:115,cloth:112,rope:112,canvas:115}, mood:6, contract:{good:'tools',qty:8,minQuality:100}, choices:[{id:'sponsor',cost:140,mood:4,rep:3,faction:'zuenfte',follow:'mastercraft'}], art:'tools' },
  wedding: { duration:4, demand:{beer:1.4,wine:1.45,finecloth:1.3,honey:1.4,cheese:1.3}, mood:7, choices:[{id:'toast',goods:{wine:3},mood:4,rep:2,faction:'patrizier'}], art:'wine' },
  funeral: { duration:4, demand:{wax:1.4,cloth:1.15,beer:.85}, mood:-6, choices:[{id:'candles',goods:{wax:3},mood:5,rep:2,faction:'kirche'}], art:'wax' },
  players: { duration:5, demand:{beer:1.25,cloth:1.15}, mood:8, choices:[{id:'stage',goods:{timber:4},cost:50,mood:4,rep:2,follow:'visitors'}], art:'cloth' },
  dyers: { duration:8, prod:{cloth:1.3,finecloth:1.2}, demand:{wool:1.25}, quality:{cloth:115,finecloth:115}, mood:4, choices:[{id:'apprentices',cost:100,rep:2,influence:2,faction:'zuenfte',follow:'mastercraft'}], art:'finecloth' },
  adulteration: { duration:7, quality:{cloth:72,wine:76}, qualityShock:{cloth:82,wine:85}, mood:-5, choices:[{id:'inspect',cost:80,rep:2,mitigate:true,protect:30,faction:'kaufleute'}], art:'cloth' },
  rats: { duration:6, supply:{grain:-.08}, damage:{grain:.06,cheese:.04}, quality:{grain:85,cheese:85}, mood:-4, choices:[{id:'clean',cost:70,protect:36,rep:1,mitigate:true}], art:'grain' },
  customsDispute: { duration:7, importAll:.8, importPrice:1.08, demand:{salt:1.15,spices:1.15}, mood:-4, choices:[{id:'mediate',cost:110,rep:2,influence:2,mitigate:true,faction:'kaufleute'}], art:'spices' },
  brokenBridge: { duration:7, delay:{land:2}, prod:{timber:.8}, demand:{timber:1.3,tools:1.25,bricks:1.35,rope:1.2,pitch:1.2}, mood:-5, choices:[{id:'bridge',goods:{timber:6,tools:2},mood:6,rep:3,mitigate:true,follow:'visitors'}], art:'timber' },
  coopers: { duration:8, prod:{beer:1.2,smokedfish:1.2}, quality:{beer:113,smokedfish:110}, mood:4, choices:[{id:'apprentices',cost:90,rep:2,protect:36,faction:'zuenfte',follow:'cooperation'}], art:'beer' },
  embassy: { duration:5, demand:{wine:1.3,spices:1.3,finecloth:1.3}, mood:4, contract:{good:'wine',qty:10,minQuality:95}, choices:[{id:'host',cost:160,rep:2,influence:4,faction:'patrizier',follow:'visitors'}], art:'spices' },
  cooperation: { followOnly:true, duration:6, wages:.92, prod:{tools:1.2,timber:1.15}, mood:5, art:'tools', choices:[] },
  mastercraft: { followOnly:true, duration:7, prod:{tools:1.2,cloth:1.2,rope:1.2,canvas:1.2}, quality:{tools:118,cloth:115,rope:118,canvas:115}, mood:5, art:'tools', choices:[] },
  visitors: { followOnly:true, duration:5, demand:{beer:1.25,cloth:1.2}, importAll:1.15, mood:5, art:'beer', choices:[] },
};
HK.cityLifeInit = function (st) {
  st.cityLife ||= { mood:55, nextStory:st.day + 8, nextId:1, stories:[], history:[], cooldown:{}, protectionUntil:0 };
  st.town.quality ||= {}; st.warehouse.quality ||= {};
  HK.qualityStocks.set(st.town.stock, st.town.quality);
  HK.qualityStocks.set(st.warehouse.stock, st.warehouse.quality);
  st.ownShips.forEach(HK.registerShipQuality);
  return st.cityLife;
};
HK.qualityStocks = new WeakMap();
HK.newGameHooks.push(HK.cityLifeInit); HK.migrateHooks.push(HK.cityLifeInit);
HK.goodQuality = (st, good, market = false) => HK.clamp((market ? st.town.quality : st.warehouse.quality)?.[good] ?? 100, 50, 120);
HK.qualityFactor = quality => .5 + HK.clamp(quality,50,120) / 200;
HK.mixQuality = function (quality, good, amount, oldQty, incoming = 100) {
  if (amount <= 0) return;
  quality[good] = HK.clamp(((quality[good] ?? 100) * Math.max(0,oldQty) + incoming * amount) / (Math.max(0,oldQty) + amount),50,120);
};
const qualityAddStock = HK.addStock;
let qualitySource = 100;
HK.addStock = function (stock, good, qty) {
  const quality = HK.qualityStocks.get(stock), old = stock[good] || 0;
  qualityAddStock(stock,good,qty);
  if (quality) { HK.mixQuality(quality,good,qty,old,qualitySource); if (!stock[good]) delete quality[good]; }
};
HK.withQuality = function (quality, action) { const old = qualitySource; qualitySource = quality; try { return action(); } finally { qualitySource = old; } };
const qualityMarketBuyPrice = HK.marketBuyPrice, qualityMarketSellPrice = HK.marketSellPrice;
HK.marketBuyPrice = (st,g,q) => Math.max(1,Math.round(qualityMarketBuyPrice(st,g,q) * HK.qualityFactor(HK.goodQuality(st,g,true))));
HK.marketSellPrice = (st,g,q,quality=HK.goodQuality(st,g)) => Math.max(1,Math.round(qualityMarketSellPrice(st,g,q) * HK.qualityFactor(quality)));
HK.visitorSellPrice = (st,v,g,quality=HK.goodQuality(st,g)) => Math.max(1,Math.round((v.wants[g]?.price || 0) * HK.qualityFactor(quality)));
const qualityMarketBuy = HK.marketBuy, qualityMarketSell = HK.marketSell, qualityVisitorBuy = HK.buyFromVisitor, qualityVisitorSell = HK.sellToVisitor;
HK.marketBuy = (st,g,q) => HK.withQuality(HK.goodQuality(st,g,true), () => qualityMarketBuy(st,g,q));
HK.marketSell = function (st,g,q) { const old = st.town.stock[g] || 0, quality = HK.goodQuality(st,g), result = qualityMarketSell(st,g,q); if (result.ok) HK.mixQuality(st.town.quality,g,Math.floor(q),old,quality); return result; };
HK.buyFromVisitor = (st,v,g,q,sm) => HK.withQuality(v?.cargo[g]?.quality ?? 100, () => qualityVisitorBuy(st,v,g,q,sm));
HK.sellToVisitor = function (st,v,g,q,sm) {
  const row = v?.wants[g]; if (!row) return {ok:false}; const price = row.price;
  row.price = HK.visitorSellPrice(st,v,g);
  try { return qualityVisitorSell(st,v,g,q,sm); } finally { row.price = price; }
};
// Displayed net quotes use the same quality-adjusted visitor unit price as settlement.
if (HK.nettoVerkauf) HK.nettoVerkauf = (st,v,g,quality=HK.goodQuality(st,g)) => v.wants[g] ? Math.round(HK.visitorSellPrice(st,v,g,quality) * (g === 'cloth' && HK.hasVenture(st,'dyer') ? 1.1 : 1) * (1-HK.tariffRate(st)*.5*(1-HK.customsDiscount(st)))) : 0;
const qualityDeliver = HK.deliverContract;
HK.deliverContract = function (st,id) { const c = st.contracts.active.find(c=>c.id===id); if (c?.minQuality && HK.goodQuality(st,c.good) < c.minQuality) return {ok:false,msg:'cityQualityRequired'}; return qualityDeliver(st,id); };
HK.activeCityStories = st => (st.cityLife?.stories || []).filter(e=>st.day >= e.start && st.day <= e.end);
HK.storyScale = e => e.mitigated ? .3 : 1;
HK.cityEffect = function (st, field, good) {
  let result = 1;
  for (const e of HK.activeCityStories(st)) { const value = HK.CITY_STORIES[e.type][field]; const factor = typeof value === 'number' ? value : value?.[good] ?? 1; result *= 1 + (factor-1)*HK.storyScale(e); }
  return HK.clamp(result,.5,1.8);
};
const cityCons = HK.consMod;
HK.consMod = (st,g) => cityCons(st,g) * HK.cityEffect(st,'demand',g) * (1 + ((st.cityLife?.mood ?? 55)-55)*.002);
HK.cityProductionMod = (st,g) => HK.cityEffect(st,'prod',g);
HK.cityWageMod = st => HK.cityEffect(st,'wages');
HK.cityProducedQuality = function (st,g) { let q = 100; for (const e of HK.activeCityStories(st)) { const value=HK.CITY_STORIES[e.type].quality?.[g]; if (value) q += (value-100)*HK.storyScale(e); } return HK.clamp(q,65,120); };
HK.cityProductionQuality = function (st,g,amount) { HK.mixQuality(st.town.quality,g,amount,st.town.stock[g] || 0,HK.cityProducedQuality(st,g)); };
HK.announceCityStory = function (st,type,start=st.day+3,cause=null) {
  const def=HK.CITY_STORIES[type], L=st.cityLife;
  if (!def || st.gameOver || !L || L.stories.length>=3 || L.stories.some(e=>e.type===type) || (L.cooldown[type] > st.day && !cause)) return null;
  const e={id:L.nextId++,type,start,end:start+def.duration-1,respondBy:start+2,activated:false,damageDone:false,choice:null,cause};
  L.stories.push(e); L.cooldown[type]=e.end+90;
  HK.log(st,'cityAnnounced',{event:HK.t('cityTitle_'+type),date:HK.fmtDate(start)},'event');
  return e;
};
HK.cityChoiceQuote = function (st,id,choice) {
  const e=st.cityLife?.stories.find(e=>e.id===id), def=e && HK.CITY_STORIES[e.type];
  if (st.gameOver || !e || e.choice || st.day>e.respondBy || st.day>e.end) return {ok:false,msg:'cityChoiceGone'};
  const c=choice==='pass' ? {id:'pass'} : def.choices.find(c=>c.id===choice);
  if (!c) return {ok:false,msg:'cityChoiceGone'};
  if (st.money<(c.cost||0)) return {ok:false,msg:'notEnoughMoney'};
  if (Object.entries(c.goods||{}).some(([g,q])=>(st.warehouse.stock[g]||0)<q)) return {ok:false,msg:'notEnoughCargo'};
  return {ok:true,c,e};
};
HK.respondCityStory = function (st,id,choice) {
  const q=HK.cityChoiceQuote(st,id,choice); if (!q.ok) return q;
  const {c,e}=q, L=st.cityLife;
  if (c.cost) HK.book(st,'cityStories',-c.cost);
  for (const [g,qty] of Object.entries(c.goods||{})) HK.addStock(st.warehouse.stock,g,-qty);
  e.choice=choice; e.mitigated=!!c.mitigate;
  if (c.protect) L.protectionUntil=Math.max(L.protectionUntil,st.day+c.protect);
  L.mood=HK.clamp(L.mood+(c.mood||0),0,100); st.rep=HK.clamp(st.rep+(c.rep||0),0,100); st.influence+=c.influence||0;
  if (c.faction) HK.fac(st,c.faction,2);
  if (c.follow) { e.follow=c.follow; e.followAt=e.end+HK.rndi(5,9); }
  HK.log(st,'cityResponded',{event:HK.t('cityTitle_'+e.type),choice:HK.t('cityChoice_'+choice)},choice==='pass'?'info':'good');
  HK.scheduleSave?.(); return {ok:true};
};
HK.activateCityStory = function (st,e) {
  if (e.activated) return; e.activated=true;
  const def=HK.CITY_STORIES[e.type], scale=HK.storyScale(e), L=st.cityLife;
  e.appliedScale=scale;
  L.mood=HK.clamp(L.mood+(def.mood||0)*scale,0,100);
  for (const [g,f] of Object.entries(def.supply||{})) { const qty=(st.town.stock[g]||0)*f*scale; HK.withQuality(HK.cityProducedQuality(st,g),()=>HK.addStock(st.town.stock,g,qty)); }
  for (const [g,q] of Object.entries(def.qualityShock||{})) { st.town.quality[g]=HK.goodQuality(st,g,true)+(q-HK.goodQuality(st,g,true))*scale; (e.shockResults ||= {})[g]=st.town.quality[g]; }
  for (const inc of st.incoming) { const delay=def.delay?.[inc.sea?'sea':'land']||0; if (delay) inc.days+=Math.ceil(delay*scale); }
  if (def.contract && st.contracts.offers.length<5) {
    const c=def.contract, price=Math.round(HK.GOOD[c.good].base*1.55);
    st.contracts.offers.push({id:st.contracts.nextId++,giver:'guild',type:'deliver',good:c.good,qty:c.qty,price,reward:price*c.qty,offered:st.day,expires:st.day+3,days:def.duration+3,deliverBy:e.end+3,cityStory:e.type,minQuality:c.minQuality});
  }
  HK.log(st,'cityStarted',{event:HK.t('cityTitle_'+e.type)},'event');
};
HK.cityStoryWeight = function (st,type) {
  const d=HK.CITY_STORIES[type], L=st.cityLife;
  if (d.followOnly || (d.months && !d.months.includes(HK.monthOf(st.day))) || L.cooldown[type]>st.day || L.stories.some(e=>e.type===type)) return 0;
  if (st.day<30 && (d.damage || d.delay || type==='cropFailure')) return 0;
  let weight=1;
  if (type==='dockStrike') weight=st.factions?.zuenfte<40?3:.5;
  if (type==='rats') weight=st.town.stock.grain>HK.desired('grain')*1.8?2:.6;
  if (type==='saltFleet') weight=st.town.stock.salt<HK.desired('salt')?2:1;
  if (type==='players') weight=L.mood<45?2:1;
  if ((type==='highWater' && st.town.projects.well) || (type==='adulteration' && st.watchUntil>st.day)) weight*=.5;
  return weight;
};
HK.cityDayStart = function (st) {
  const L=HK.cityLifeInit(st);
  for (const e of L.stories.slice()) {
    if (st.day>e.end) {
      if (e.follow && st.day<e.followAt) continue;
      if (e.follow) {
        L.stories=L.stories.filter(x=>x!==e);
        const next=HK.announceCityStory(st,e.follow,st.day+2,e.type);
        if (!next && L.stories.some(x=>x.type===e.follow)) e.follow=null;
        else if (!next) { L.stories.push(e); continue; }
      }
      L.history.push({...e,finished:st.day}); L.history=L.history.slice(-24); L.stories=L.stories.filter(x=>x!==e); continue;
    }
    if (st.day>=e.start) HK.activateCityStory(st,e);
    if (st.day>e.respondBy && !e.choice) e.choice='pass';
    if (st.day>e.respondBy && !e.damageDone) {
      e.damageDone=true; e.damageLosses={};
      const protectedStock=L.protectionUntil>=st.day || HK.hasVenture(st,'cooper');
      if (!protectedStock) for (const [g,rate] of Object.entries(HK.CITY_STORIES[e.type].damage||{})) {
        const lost=Math.floor((st.warehouse.stock[g]||0)*rate*HK.storyScale(e));
        if (lost>0) { e.damageLosses[g]=lost; HK.addStock(st.warehouse.stock,g,-lost); st.warehouse.quality[g]=Math.max(50,HK.goodQuality(st,g)-8*HK.storyScale(e)); HK.log(st,'citySpoilage',{qty:lost,good:HK.goodName(g)},'bad'); }
      }
    }
  }
  if (st.day>=L.nextStory && L.stories.length<2 && !st.pendingDecision) {
    const pool=Object.keys(HK.CITY_STORIES).map(type=>({type,weight:HK.cityStoryWeight(st,type)})).filter(x=>x.weight>0);
    let roll=Math.random()*pool.reduce((n,x)=>n+x.weight,0), chosen=pool.at(-1)?.type;
    for (const item of pool) { roll-=item.weight; if (roll<0) {chosen=item.type; break;} }
    if (chosen) HK.announceCityStory(st,chosen,st.day+HK.rndi(2,4));
    L.nextStory=st.day+HK.rndi(10,18);
  }
};
HK.cityDayEnd = function (st) {
  const L=st.cityLife; if (!L) return;
  const staples=['grain','fish','beer','salt'], supply=staples.reduce((n,g)=>n+HK.clamp((st.town.stock[g]||0)/HK.desired(g),0,1),0)/4;
  const sentiment=HK.activeCityStories(st).reduce((n,e)=>n+(HK.CITY_STORIES[e.type].mood||0)*HK.storyScale(e),0);
  const target=HK.clamp(30+st.town.prosperity*.3+supply*15+sentiment,10,90);
  L.mood=HK.clamp(L.mood+(target-L.mood)*.025,0,100);
  for (const p of Object.values(st.persons)) p.loyalty=HK.clamp(p.loyalty+(L.mood-55)*.0006,0,100);
};
// Only free cargo responds to import conditions; existing visits and prepaid quantities/prices stay fixed.
const cityVisitor=HK.makeVisitor;
HK.makeVisitor = function (st,origin) {
  const v=cityVisitor(st,origin);
  for (const [g,row] of Object.entries(v.cargo)) {
    const factor=HK.cityEffect(st,'import',g)*HK.cityEffect(st,'importAll'), quality=HK.cityProducedQuality(st,g);
    row.qty=Math.max(1,Math.round(row.qty*factor)); row.quality=quality;
    row.price=Math.max(1,Math.round(row.price*HK.cityEffect(st,'importPrice')*HK.qualityFactor(quality)));
  }
  return v;
};
const citySettle=HK.settleTradeArrival;
HK.settleTradeArrival = function (st,inc,v) {
  citySettle(st,inc,v);
  const row=inc?.tradeLot && v.cargo[inc.tradeLot.good];
  if (row && !inc.cityLotSettled) {
    inc.cityLotSettled=true; const g=inc.tradeLot.good, q=inc.tradeLot.quality??HK.cityProducedQuality(st,g);
    row.qty=Math.max(0,Math.round(row.qty*HK.cityEffect(st,'import',g)*HK.cityEffect(st,'importAll')));
    row.quality=q; row.price=Math.max(1,Math.round(row.price*HK.cityEffect(st,'importPrice')*(inc.tradeLot.quality===undefined?HK.qualityFactor(q):1)));
    if (!row.qty) delete v.cargo[g];
  }
};
const cityStoryText = {
  livestockIllness:['Unruhe auf den Viehweiden','Einige Tiere sind krank. Die Höfe liefern weniger Milch und Vieh, die Güte der Milch sinkt. Futter und Pflege können die Ausfälle begrenzen.','Trouble in the pastures','Some animals are ill. Farms supply less milk and livestock, and milk quality falls. Feed and care can limit the losses.'],
  forestBan:['Der Forst wird gesperrt','Der Vogt schränkt Holzeinschlag und Jagd ein. Holzfäller und Jäger bringen weniger Ware; Bauleute suchen Holz und Ersatz aus Stein.','The forest is closed','The bailiff restricts logging and hunting. Woodcutters and hunters bring less cargo; builders seek timber and stone alternatives.'],
  harvest:['Eine Ernte für die Speicher','Die Bauern bringen volle Wagen, außergewöhnlich gutes Korn und reichlich Hanf und Flachs. Die Speicher füllen sich, während die Erntehelfer auf ihren Anteil hoffen.','A harvest for the granaries','Farmers bring full wagons of excellent grain, hemp and flax. Stocks rise, but the harvest hands hope to share the bounty.'],
  cropFailure:['Korn auf den Halmen verdorben','Dauerregen hat einen Teil der Ernte vernichtet. Weniger Korn, Hanf und Flachs erreichen die Stadt; die Bäcker suchen Ersatz und die Armen werden unruhig.','Grain spoiled in the fields','Persistent rain ruined part of the harvest. Less grain, hemp and flax reach town; bakers seek alternatives and poorer households grow anxious.'],
  herringRun:['Der Hering zieht in die Bucht','Die Fischer kehren mit vollen Netzen zurück. Frischer Fisch ist reichlich da, doch ohne Salz lässt sich der Fang kaum bewahren.','Herring in the bay','Fishing boats return with full nets. Fresh fish is abundant, but the catch needs salt to keep.'],
  emptyNets:['Leere Netze am Morgen','Die Schwärme bleiben aus. Fischer flicken ihre Netze, Räucherhäuser suchen Ware und die Familien am Hafen bangen um ihr Einkommen.','Empty nets at dawn','The shoals have vanished. Fishers mend nets, smokehouses seek supplies and harbour families worry about their earnings.'],
  saltFleet:['Salzflotte in Sicht','Mehrere Händler bringen Salz aus den Salinen. Das Angebot wächst; sorgfältige Prüfung könnte auch dein Lager vor späteren Schäden schützen.','A salt fleet approaches','Several traders bring salt from the saltworks. Supply grows; careful inspection can also protect your stock against later losses.'],
  heatwave:['Hitze in den Gassen','Die Brunnen werden umlagert, Bier ist gefragt und Fisch und Käse leiden unter der Hitze. Empfindliche Lagerware braucht rechtzeitig Schutz.','Heat in the streets','Queues form at wells, beer is sought and fish and cheese suffer in the heat. Sensitive warehouse stock needs protection in time.'],
  frost:['Eis auf den Handelswegen','Frost bremst Fischer und Fuhrleute. Brennholz und warme Pelze werden gesucht; auch angekündigte Lieferungen brauchen länger.','Ice on the trade routes','Frost slows fishers and carriers. Firewood and warm furs are in demand, and announced supplies take longer.'],
  highWater:['Hochwasser am unteren Kai','Wasser steigt in die unteren Speicher. Korn, Faserballen und Segeltuch können feucht werden, Wagen müssen Umwege nehmen und Zimmerleute werden dringend gebraucht.','Floodwater at the lower quay','Water rises into low granaries. Grain, fibre bales and sailcloth may become damp, wagons take detours and carpenters are urgently needed.'],
  dockStrike:['Die Lastträger legen die Arbeit nieder','Die Hafenarbeiter verlangen bessere Bedingungen. Ankommende Schiffe warten länger; Löhne und Werkzeugversorgung geraten unter Druck.','The porters stop work','Harbour workers demand better terms. Incoming ships face delays; wages and the supply of tools come under pressure.'],
  guildFair:['Die Zünfte zeigen ihr Können','Meister stellen Werkzeuge, Tuche, Seile und Segeltuch aus. Käufer suchen Qualität; ein passender Lieferauftrag öffnet neue Möglichkeiten.','The guilds display their craft','Masters display their finest tools, cloth, rope and sailcloth. Buyers seek quality, and a special delivery contract offers an opportunity.'],
  wedding:['Hochzeit im Ratshausviertel','Eine Patrizierfamilie lädt großzügig ein. Weinhändler, Schneider und Wirte rechnen mit guten Geschäften; auch Honig und Käse sind gefragt, die Gassen sind voller Vorfreude.','A wedding in the council quarter','A patrician family invites lavishly. Vintners, tailors and innkeepers expect business; honey and cheese are also sought, and the streets are full of anticipation.'],
  funeral:['Trauer um einen alten Ratsherrn','Die Stadt nimmt Abschied. Kerzen und Trauertuch werden gebraucht; viele Wirtshausgäste bleiben zu Hause.','Mourning an old councillor','The town bids farewell. Candles and mourning cloth are needed; many regulars stay away from the inns.'],
  players:['Gaukler auf dem Marktplatz','Eine Wandertruppe bringt Musik, Geschichten und Spottverse. Gäste bleiben länger, Wirte schenken aus und die Stadt wird lebhafter.','Players in the market square','Travelling performers bring music, stories and satire. Visitors linger, inns pour drinks and the town grows livelier.'],
  dyers:['Eine Farbe macht die Runde','Ein Färbermeister gelingt ein begehrter Farbton. Die Tuchqualität steigt, Webstuben arbeiten mehr und kaufen zusätzliche Wolle.','A new colour catches on','A master dyer creates a sought-after shade. Cloth quality improves, weaving shops work harder and buy more wool.'],
  adulteration:['Gestreckter Wein, schlechtes Tuch','Käufer entdecken minderwertige Partien. Das Vertrauen sinkt und betroffene Marktware verliert an Wert. Prüfer können weiteren Schaden begrenzen.','Watered wine and poor cloth','Buyers discover inferior lots. Trust falls and affected market stock loses value. Inspectors can limit further damage.'],
  rats:['Spuren im Kornspeicher','Nagespuren werden in Säcken entdeckt. Ein Teil des Stadtkorns ist verloren; ohne Reinigung droht auch deinem Korn und Käse ein begrenzter Verlust.','Tracks in the granary','Gnaw marks appear in sacks. Some city grain is lost; without cleaning your grain and cheese also face a limited loss.'],
  customsDispute:['Streit am Zollpfahl','Händler streiten über die Abfertigung. Neue freie Ladungen fallen kleiner und teurer aus; bestehende Besucherangebote bleiben vereinbart.','A dispute at the customs post','Traders dispute clearance procedures. New unreserved cargo is smaller and dearer; existing visitors keep their agreed offers.'],
  brokenBridge:['Die Brücke zum Umland bricht','Ein beladener Wagen hat die Holzbrücke beschädigt. Karawanen nehmen Umwege, während die Reparatur Holz, Backsteine, Werkzeug, Seile und Pech braucht.','The country bridge breaks','A loaded wagon damaged the wooden bridge. Caravans take detours while repairs need timber, bricks, tools, rope and pitch.'],
  coopers:['Dichte Fässer, gute Arbeit','Die Böttcher verbessern ihre Fässer. Brauer und Räucherer produzieren mehr und bessere Ware; Lagerverluste lassen sich leichter vermeiden.','Sound barrels and good work','Coopers improve their barrels. Brewers and smokehouses produce more and better goods; warehouse losses become easier to prevent.'],
  embassy:['Eine Gesandtschaft logiert in der Stadt','Auswärtige Gesandte erwarten eine gute Tafel und ordentliche Stoffe. Wer sie unterstützt, gewinnt Gehör und kann neue Gäste anziehen.','An embassy stays in town','Foreign envoys expect a fine table and good fabrics. Supporting them earns influence and may attract future visitors.'],
  cooperation:['Die Zusammenarbeit trägt Früchte','Die Hilfe von neulich spricht sich herum. Handwerker helfen einander, produzieren mehr und arbeiten vorübergehend günstiger.','Cooperation bears fruit','Your earlier support is remembered. Craftspeople help one another, produce more and temporarily work for less.'],
  mastercraft:['Aus Schülern werden Könner','Die unterstützten Meister und Lehrlinge liefern ihre ersten besonders guten Arbeiten. Werkzeug und Tuch werden reichlicher und hochwertiger.','Apprentices become skilled hands','The masters and apprentices you supported deliver their first fine work. Tools and cloth become more plentiful and better.'],
  visitors:['Gute Kunde bringt neue Gäste','Reisende erzählen von der Hilfe und Gastfreundschaft der Stadt. Weitere Händler und Gäste kommen, mit neuer Ware und frischer Nachfrage.','Good reports bring new visitors','Travellers speak of the town’s help and hospitality. More traders and guests arrive, bringing goods and fresh demand.'],
};
for (const [id,text] of Object.entries(cityStoryText)) for (const [lang,offset] of [['de',0],['en',2]]) Object.assign(HK.I18N[lang],{['cityTitle_'+id]:text[offset],['cityText_'+id]:text[offset+1]});
Object.assign(HK.I18N.de,{
  cityLife:'Was die Stadt bewegt', cityMood:'Stadtstimmung', cityMood_low:'Besorgt', cityMood_mid:'Zuversichtlich', cityMood_high:'Beschwingt',
  cityMoodHint:'Versorgung, Wohlstand, Ereignisse und deine Hilfe prägen die Stimmung. Sie beeinflusst die Nachfrage und das Vertrauen deiner Kontakte.',
  cityNone:'Zurzeit keine neuen Stadtgeschichten. Jahreszeit, Versorgung und frühere Entscheidungen beeinflussen, was als Nächstes geschieht.',
  cityUpcoming:'Angekündigt',cityActive:'Wirkt jetzt',cityFollow:'Folge deiner Entscheidung',cityUntil:'Reaktion bis {date}',cityHandled:'Deine Entscheidung: {choice}',cityAuto:'Ohne Reaktion: abwarten. Kosten und Waren werden nur bei deiner Wahl gebucht.',
  cityAnnounced:'{event} – angekündigt für {date}.',cityStarted:'{event}: Die Auswirkungen beginnen.',cityResponded:'{event}: {choice}.',citySpoilage:'Lagerschaden: {qty} Last {good} verloren; die verbleibende Partie ist etwas schlechter.',cityChoiceGone:'Diese Reaktion ist nicht mehr möglich.',cityQualityRequired:'Deine Partie erfüllt die verlangte Mindestqualität noch nicht.',
  cityProduction:'Erzeugung in Stadt und eigenen Betrieben',cityDemand:'Nachfrage',citySupply:'Stadtbestand, einmalig',cityQuality:'Qualität neuer Ware',cityQualityShock:'Qualität vorhandener Marktware',cityImport:'Neue freie Importladungen',cityImportPrice:'Preis neuer Importladungen',cityWages:'Löhne',cityDelay:'Bestehende Ankünfte einmalig: {route} +{days} Tage',citySea:'Seeweg',cityLand:'Landweg',cityDamage:'Ohne Schutz ab {date}: {goods} des eigenen Lagerbestands verlieren; Restqualität bis zu −8 Punkte.',cityMitigated:'Laufende Ausschläge auf 30 % begrenzt. Bereits entstandene Schäden und Verzögerungen bleiben bestehen.',
  cityProtection:'Lagervorsorge aktiv bis {date}',cityCooperProtection:'Eigene Böttcherei schützt vor Lagerverlusten dieser Geschichten.',cityProtected:'Dein Lager ist geschützt.',cityProtectTerm:'Lagervorsorge für {days} Tage',cityReliefTerm:'Ausschläge dieser Geschichte auf 30 % begrenzen',cityFollowTerm:'Später mögliche Folge: {event}',cityMoodChange:'Stimmung {value}',cityRepChange:'Ansehen +{value}',cityInfluenceChange:'Einfluss +{value}',cityFactionChange:'Zuwendung der betroffenen Gruppe +2',cityQualityLabel:'Qualität {quality} / 100',cityQualityHint:'100 ist normale Güte. Lagerpartien werden mengenmäßig gemischt; Qualität wirkt auf Markt- und Besuchererlöse. Bereits zugesagte Standardverträge behalten ihren festen Erlös.',cityMinQuality:'Verlangte Güte: mindestens {quality} / 100',cityRecent:'Kürzlich geschehen',cityMore:'{count} Stadtgeschichten · ansehen',src_cityStories:'Hilfe und Vorsorge',cityFree:'Ohne Geldkosten',
  cityChoice_pass:'Abwarten',cityChoice_share:'Erntehelfer versorgen',cityChoice_relief:'Korn für die Armen geben',cityChoice_salt:'Fang haltbar machen',cityChoice_repairNets:'Werkzeug für die Netze geben',cityChoice_inspect:'Prüfer beauftragen',cityChoice_cool:'Lager kühlen und sichern',cityChoice_water:'Getränke für die Nachbarschaft geben',cityChoice_warm:'Brennholz verteilen',cityChoice_raise:'Waren höher und trocken lagern',cityChoice_sandbags:'Hochwasserschutz unterstützen',cityChoice_mediate:'Vermittlung finanzieren',cityChoice_payWorkers:'Arbeiterfamilien versorgen',cityChoice_sponsor:'Meisterwettbewerb fördern',cityChoice_toast:'Wein zum Fest beitragen',cityChoice_candles:'Kerzen für den Abschied geben',cityChoice_stage:'Bühne und Unterkunft bereitstellen',cityChoice_apprentices:'Lehrlinge unterstützen',cityChoice_clean:'Speicher reinigen und sichern',cityChoice_bridge:'Material zur Brückenreparatur geben',cityChoice_host:'Gesandtschaft bewirten',
});
Object.assign(HK.I18N.en,{
  cityLife:'What moves the town',cityMood:'Town sentiment',cityMood_low:'Worried',cityMood_mid:'Hopeful',cityMood_high:'Cheerful',cityMoodHint:'Supply, prosperity, events and your help shape sentiment. It affects demand and the trust of your contacts.',
  cityNone:'No new town stories at present. Season, supply and earlier choices shape what happens next.',cityUpcoming:'Announced',cityActive:'In effect',cityFollow:'A consequence of your choice',cityUntil:'Respond by {date}',cityHandled:'Your choice: {choice}',cityAuto:'No response means wait. Money and goods are booked only when you choose.',
  cityAnnounced:'{event} – announced for {date}.',cityStarted:'{event}: effects begin.',cityResponded:'{event}: {choice}.',citySpoilage:'Warehouse damage: {qty} last of {good} lost; the remaining lot is slightly poorer.',cityChoiceGone:'This response is no longer available.',cityQualityRequired:'Your lot does not yet meet the required minimum quality.',
  cityProduction:'Town and own business production',cityDemand:'Demand',citySupply:'City stock, once',cityQuality:'Quality of new goods',cityQualityShock:'Quality of existing market stock',cityImport:'New unreserved imports',cityImportPrice:'Price of new imports',cityWages:'Wages',cityDelay:'Existing arrivals, once: {route} +{days} days',citySea:'Sea route',cityLand:'Land route',cityDamage:'Without protection after {date}: lose {goods} of your warehouse stock; remaining quality up to −8 points.',cityMitigated:'Ongoing deviations limited to 30%. Damage and delays already incurred remain.',
  cityProtection:'Warehouse precautions until {date}',cityCooperProtection:'Your cooperage protects against warehouse losses from these stories.',cityProtected:'Your warehouse is protected.',cityProtectTerm:'Warehouse precautions for {days} days',cityReliefTerm:'Limit this story’s deviations to 30%',cityFollowTerm:'Possible later consequence: {event}',cityMoodChange:'Sentiment {value}',cityRepChange:'Reputation +{value}',cityInfluenceChange:'Influence +{value}',cityFactionChange:'Affected faction affinity +2',cityQualityLabel:'Quality {quality} / 100',cityQualityHint:'100 is standard quality. Stock quality is blended by quantity and affects market and visitor revenue. Existing standard delivery promises keep their fixed revenue.',cityMinQuality:'Required quality: at least {quality} / 100',cityRecent:'Recently happened',cityMore:'{count} town stories · view',src_cityStories:'Relief and precautions',cityFree:'No cash cost',
  cityChoice_pass:'Wait and see',cityChoice_share:'Feed the harvest hands',cityChoice_relief:'Give grain to the poor',cityChoice_salt:'Preserve the catch',cityChoice_repairNets:'Provide tools for nets',cityChoice_inspect:'Commission inspectors',cityChoice_cool:'Cool and secure the warehouse',cityChoice_water:'Give drinks to neighbours',cityChoice_warm:'Distribute firewood',cityChoice_raise:'Store goods higher and dry',cityChoice_sandbags:'Support flood defences',cityChoice_mediate:'Fund mediation',cityChoice_payWorkers:'Feed workers’ families',cityChoice_sponsor:'Sponsor the masters’ contest',cityChoice_toast:'Contribute wine',cityChoice_candles:'Give candles for mourning',cityChoice_stage:'Provide a stage and lodging',cityChoice_apprentices:'Support apprentices',cityChoice_clean:'Clean and secure granaries',cityChoice_bridge:'Give bridge repair materials',cityChoice_host:'Host the embassy',
});
HK.cityImportQuality = (st,g,qty,quality) => HK.mixQuality(st.town.quality,g,qty,st.town.stock[g] || 0,quality);
HK.registerShipQuality = function (s) { s.quality ||= {}; HK.qualityStocks.set(s.cargo,s.quality); };
HK.shipGoodQuality = (s,g) => HK.clamp(s.quality?.[g] ?? 100,50,120);
for (const method of ['loadShip','unloadShip']) {
  const original=HK[method];
  HK[method]=function (st,id,g,qty) {
    const s=st.ownShips.find(s=>s.id===id), q=method==='loadShip'?HK.goodQuality(st,g):(s?HK.shipGoodQuality(s,g):100);
    if (s && s.status==='port' && Number.isInteger(qty) && qty>0 && (method==='loadShip'?((st.warehouse.stock[g]||0)>=qty && HK.stockUsed(s.cargo)+qty<=HK.shipCap(s)):((s.cargo[g]||0)>=qty && HK.whFree(st)>=qty))) HK.qualityStocks.set(s.cargo,s.quality ||= {});
    return HK.withQuality(q,()=>original(st,id,g,qty));
  };
}
const cityBuyShip=HK.buyShip;
HK.buyShip=function (st,...args) { const result=cityBuyShip(st,...args); if (result.ok) st.ownShips.forEach(HK.registerShipQuality); return result; };

HK.I18N.de.tradeAdvanceTerms += ' Vorausbezahlte Partien bleiben in Menge, Preis und normaler Güte (100) zugesagt.';
HK.I18N.en.tradeAdvanceTerms += ' Prepaid lots remain committed in quantity, price and standard quality (100).';

HK.cityWorkshopOutput = function (st, ws, recipe) {
  const exact = recipe.qty * HK.cityProductionMod(st, recipe.out) + (ws.outputRemainder || 0);
  const qty = Math.floor(exact + 1e-9); ws.outputRemainder = Math.max(0,exact - qty);
  return qty;
};
HK.shipSaleUnitPrice = (st, s, g, origin) => Math.round(HK.GOOD[g].base * (origin.want[g] ? HK.wantFactor(origin.want[g]) : .85) * HK.qualityFactor(s.cargo[g] ? HK.shipGoodQuality(s,g) : HK.goodQuality(st,g)));

HK.I18N.de.cityDamageRecorded = 'Lagerverlust dieser Geschichte: {goods}.';
HK.I18N.en.cityDamageRecorded = 'Warehouse loss from this story: {goods}.';
HK.I18N.de.cityDamageNone = 'Durch diese Geschichte wurde keine eigene Lagerware verloren.';
HK.I18N.en.cityDamageNone = 'No goods from your warehouse were lost to this story.';
HK.cityNumber = n => n.toLocaleString(HK.LANG === 'de' ? 'de-DE' : 'en-GB', {maximumFractionDigits:1});

// Advice prices the proposed source grade without writing a hypothetical stock to the save.
if (HK.besterAbnehmer) HK.besterAbnehmer = function (st,g,except,quality) {
  quality ??= typeof except==='object' && except?.cargo[g] ? except.cargo[g].quality ?? 100 : except==='markt' ? HK.goodQuality(st,g,true) : HK.goodQuality(st,g);
  let best=null;
  const take=(preis,wer,menge,art,visitor)=>{if(preis>0&&menge>0&&(!best||preis>best.preis))best={preis,wer,menge,art,...(visitor!==undefined?{visitor}:{})};};
  for(const v of HK.visitors(st))if(v!==except&&v.wants[g])take(HK.nettoVerkauf(st,v,g,quality),HK.besucherName(v),v.wants[g].qty,'besucher',v.id);
  const cap=HK.marketCap(st,g);if(except!=='markt'&&cap>0)take(HK.marketSellPrice(st,g,1,quality),HK.t('market'),cap,'markt');
  for(const c of st.contracts.active)if(c.type==='deliver'&&c.good===g&&st.day<=c.deadline&&quality>=(c.minQuality||0))take(c.price,HK.t('giver_'+c.giver),c.qty,'auftrag');
  return best;
};
