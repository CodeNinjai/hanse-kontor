/* node tools/ereignisse-test.js: real economic effects, response races and stock quality. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
let seed=423,checks=0; const math=Object.create(Math); math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const ctx=vm.createContext({console,Intl,Math:math,Date,JSON});
for (const file of ['data','town','i18n','game','paths','rivals','contracts','sea','family','offices','faith','deals','staff','burghers','chains','ostviertel','ausgleich','lehrgang','weiterentwicklung','handelsvorhaben','ereignisse', 'salzgeschichte', 'salzgeschichte-text','korrespondenz','korrespondenz-text','landwirtschaft']) vm.runInContext(fs.readFileSync(path.join(__dirname,'..','js',file+'.js'),'utf8'),ctx,{filename:file});
const H=vm.runInContext('HK',ctx),check=(v,label)=>{checks++;assert(v,label);};
const fresh=()=>{H.state=H.newGame({name:'Stadtprüfung',difficulty:'normal',years:20});H.state.cityLife.nextStory=100000;return H.state;};
const story=(st,type,start=st.day+3)=>H.announceCityStory(st,type,start);
for (const [type,def] of Object.entries(H.CITY_STORIES)) {
  for (const field of ['prod','demand','supply','quality','qualityShock','damage','import']) for (const g of Object.keys(def[field]||{})) check(!!H.GOOD[g],type+' references invalid good '+g);
  for (const lang of ['de','en']) {check(!!H.I18N[lang]['cityTitle_'+type]&&!!H.I18N[lang]['cityText_'+type],type+' lacks story translation');for(const c of def.choices)check(!!H.I18N[lang]['cityChoice_'+c.id],type+' lacks choice translation');}
}
let st=fresh(),e=story(st,'highWater'),snapshot=H.serialize(st),savedSeed=seed;
for (let i=0;i<50;i++) {H.cityChoiceQuote(st,e.id,'raise');H.cityEffect(st,'prod','grain');H.cityProducedQuality(st,'grain');H.marketBuyPrice(st,'grain',10);H.marketSellPrice(st,'grain',10);}
check(H.serialize(st)===snapshot&&seed===savedSeed,'Quotes mutate the save or roll the future');
check(H.cityEffect(st,'prod','grain')===1,'An announcement affects production before its start');
check(!H.respondCityStory(st,e.id,'raise').ok&&H.serialize(st)===snapshot,'An unaffordable goods response mutates the state');
H.addStock(st.warehouse.stock,'timber',6);const money=st.money;
check(H.respondCityStory(st,e.id,'raise').ok&&st.money===money-40&&!st.warehouse.stock.timber,'Response fails to book exact goods and cash');
snapshot=H.serialize(st);check(!H.respondCityStory(st,e.id,'raise').ok&&H.serialize(st)===snapshot,'Repeated response books twice');
st=fresh();e=story(st,'frost',3);const sea=st.incoming.find(i=>i.sea),days=sea.days;
st.day=3;H.cityDayStart(st);check(sea.days===days+2&&e.activated&&H.cityEffect(st,'prod','fish')===.65,'Activation misses transport or production');
snapshot=H.serialize(st);H.cityDayStart(st);check(H.serialize(st)===snapshot,'Repeated day start repeats one-time effects');
check(H.respondCityStory(st,e.id,'warm').ok===false,'Response consumes missing firewood');
H.addStock(st.warehouse.stock,'timber',6);check(H.respondCityStory(st,e.id,'warm').ok&&sea.days===days+2&&Math.abs(H.cityEffect(st,'prod','fish')-.895)<1e-8,'Late mitigation erases delays or misses ongoing effects');
st=fresh();e=story(st,'rats',3);H.addStock(st.warehouse.stock,'grain',100);st.day=6;H.cityDayStart(st);
check(st.warehouse.stock.grain===94&&H.goodQuality(st,'grain')===92,'Unprotected storage does not suffer the declared quantity and quality loss');
H.cityDayStart(st);check(st.warehouse.stock.grain===94,'Spoilage is booked more than once');
st=fresh();e=story(st,'rats',3);H.addStock(st.warehouse.stock,'grain',100);check(H.respondCityStory(st,e.id,'clean').ok,'Storage precautions unavailable');st.day=6;H.cityDayStart(st);
check(st.warehouse.stock.grain===100&&H.goodQuality(st,'grain')===100,'Precautions do not protect storage');
st=fresh();e=story(st,'rats',3);st.ventures.cooper={level:1};H.addStock(st.warehouse.stock,'grain',100);st.day=6;H.cityDayStart(st);check(st.warehouse.stock.grain===100,'Owned cooperage fails to prevent event spoilage');
st=fresh();st.money=100000;st.town.quality.salt=80;const price=H.marketBuyPrice(st,'salt',10),oldMoney=st.money;
check(H.marketBuy(st,'salt',10).ok&&st.money===oldMoney-price*10&&Math.abs(H.goodQuality(st,'salt')-93.33333333333333)<1e-8,'Market purchase fails weighted quality or quoted price');
const salePrice=H.marketSellPrice(st,'salt',2),marketQty=st.town.stock.salt,marketQuality=H.goodQuality(st,'salt',true),warehouseQuality=H.goodQuality(st,'salt');
check(H.marketSell(st,'salt',2).ok&&Math.abs(H.goodQuality(st,'salt',true)-(marketQuality*marketQty+warehouseQuality*2)/(marketQty+2))<1e-8,'Market sale fails to transfer quality');
st=fresh();const v=st.ships[0];v.cargo={cloth:{qty:20,price:100,quality:70}};v.wants={cloth:{qty:20,price:200}};st.money=100000;
check(H.buyBulkTrade(st,v,'cloth',10).ok&&H.goodQuality(st,'cloth')===70,'Bulk purchase washes away poor quality');
const advice=H.besterAbnehmer(st,'cloth',v),goodAdvice=H.besterAbnehmer(st,'cloth',v,100);check(advice.preis<=goodAdvice.preis,'Advice promotes a quality downgrade as normal resale');
const unit=H.visitorSellPrice(st,v,'cloth'),net=H.nettoVerkauf(st,v,'cloth'),rowPrice=v.wants.cloth.price,beforeMoney=st.money;
const sale=H.sellToVisitor(st,v,'cloth',2,false),goods=Math.round(unit*2),duty=Math.round(goods*H.tariffRate(st)*.5*(1-H.customsDiscount(st)));
check(unit===170&&sale.ok&&st.money===beforeMoney+goods-duty&&v.wants.cloth.price===rowPrice&&Math.abs(net-sale.cost/2)<=1,'Visitor displayed and settled quality prices differ');
st.ownShips.push({id:900,status:'port',cargo:{},cap:120,hull:100});
check(H.loadShip(st,900,'cloth',5).ok&&H.shipGoodQuality(st.ownShips.at(-1),'cloth')===70,'Loading restores bad cargo to normal quality');
check(H.unloadShip(st,900,'cloth',5).ok&&H.goodQuality(st,'cloth')===70,'Unloading restores bad cargo to normal quality');
st=fresh();e=story(st,'guildFair',0);H.cityDayStart(st);const c=st.contracts.offers.find(c=>c.cityStory==='guildFair');check(!!c&&c.minQuality===100&&H.acceptContract(st,c.id).ok&&c.deadline===e.end+3,'Quality contract missing or deadline changed');
H.addStock(st.warehouse.stock,'tools',8);st.warehouse.quality.tools=80;snapshot=H.serialize(st);
check(!H.deliverContract(st,c.id).ok&&H.serialize(st)===snapshot,'Below-grade contract delivers goods or books money');
st.warehouse.quality.tools=100;const rewardMoney=st.money;check(H.deliverContract(st,c.id).ok&&st.money===rewardMoney+c.reward&&!st.warehouse.stock.tools,'Quality contract settlement incorrect');
check(!H.deliverContract(st,c.id).ok,'Contract pays twice');
st=fresh();e=story(st,'adulteration',0);H.cityDayStart(st);const visiting=H.makeVisitor(st,'luebeck');
check(Object.entries(visiting.cargo).filter(([g])=>['cloth','wine'].includes(g)).every(([g,row])=>row.quality===H.cityProducedQuality(st,g)),'New import quality not declared');
check(H.goodQuality(st,'cloth',true)===82&&H.cityProducedQuality(st,'cloth')===72,'Quality shock or new production not effective');
st=fresh();const inc=st.incoming.find(i=>!i.sea);check(H.reserveTradeSupply(st,inc.id,18).ok,'Advance cannot be reserved');e=story(st,'cropFailure',0);H.cityDayStart(st);st.caravans=[];H.dockCaravan(st,inc.origin,inc);
check(st.warehouse.stock.grain===18&&H.goodQuality(st,'grain')===100,'Event damages the agreed quantity or quality of a prepaid lot');
st=fresh();e=story(st,'dockStrike',0);check(H.respondCityStory(st,e.id,'mediate').ok,'Mediation failed');st.day=e.followAt;H.cityDayStart(st);const next=st.cityLife.stories.find(x=>x.type==='cooperation');
check(!!next&&next.cause==='dockStrike','Earlier support creates no follow-up');st.day=next.start;H.cityDayStart(st);check(H.cityWageMod(st)===.92,'Follow-up does not lower actual wages');
st=fresh();const baseline=JSON.parse(H.serialize(st));baseline.town.quality={};baseline.warehouse.quality={};delete baseline.cityLife;
const oldStock=JSON.stringify(baseline.warehouse.stock),oldMoneyLoad=baseline.money;H.state=H.deserialize(JSON.stringify(baseline));st=H.state;snapshot=H.serialize(st);H.migrate(st);
check(st.money===oldMoneyLoad&&JSON.stringify(st.warehouse.stock)===oldStock&&H.goodQuality(st,'beer')===100&&H.serialize(st)===snapshot,'Legacy migration changes existing goods or is not idempotent');
st=fresh();e=story(st,'wedding');st.gameOver=true;snapshot=H.serialize(st);check(!H.respondCityStory(st,e.id,'pass').ok&&H.serialize(st)===snapshot,'Game-over response still changes the save');
// Season and city context constrain the generator rather than just flavouring its text.
st=fresh();st.day=40;check(H.cityStoryWeight(st,'heatwave')===0&&H.cityStoryWeight(st,'highWater')>0,'Season gating ignores spring');
st.day=320;check(H.cityStoryWeight(st,'frost')>0&&H.cityStoryWeight(st,'harvest')===0,'Season gating ignores winter');
st.factions.zuenfte=20;const strikeWeight=H.cityStoryWeight(st,'dockStrike');st.factions.zuenfte=80;check(strikeWeight>H.cityStoryWeight(st,'dockStrike'),'Guild relations do not shape event likelihood');
e=story(st,'dockStrike');check(H.cityStoryWeight(st,'dockStrike')===0,'The same story can overlap itself');
st=fresh();e=story(st,'cooperation',0);H.cityDayStart(st);const ws={outputRemainder:0},recipe=H.WORKSHOP.smithy;
let produced=0;for(let i=0;i<5;i++)produced+=H.cityWorkshopOutput(st,ws,recipe);
check(produced===6,'Small workshops round away the entire production bonus');
st=fresh();e=story(st,'guildFair',0);H.cityDayStart(st);const oldWarehouse=st.warehouse.stock.tools||0;
st.workshops[0].type='smithy';H.addStock(st.warehouse.stock,'iron',10);const wageBefore=st.money;H.tick(st);
check(st.warehouse.stock.tools===oldWarehouse+1&&H.goodQuality(st,'tools')===115&&st.workshops[0].idle===false,'Real workshop tick does not receive event quality');
st=fresh();e=story(st,'dockStrike',0);H.cityDayStart(st);st.workshops[0].type='smithy';H.addStock(st.warehouse.stock,'iron',10);H.tick(st);
check(st.ledger.at(-1).wages===-Math.round(H.WORKSHOP.smithy.wage*1.12),'Event wage changes do not reach the cash ledger');
st=fresh();st.cityLife.mood=30;const badDemand=H.consMod(st,'beer'),loyalty=st.persons.customs.loyalty;H.cityDayEnd(st);
check(st.persons.customs.loyalty<loyalty,'Town sentiment does not affect contact trust');st.cityLife.mood=80;check(H.consMod(st,'beer')>badDemand,'Town sentiment does not affect actual demand');
st=fresh();st.day=40;e=story(st,'highWater',41);H.addStock(st.warehouse.stock,'timber',6);H.respondCityStory(st,e.id,'raise');
const rawSave=H.serialize(st),loaded=H.deserialize(rawSave),rngAfterLoad=seed;H.migrate(loaded);
check(JSON.stringify(loaded.cityLife)===JSON.stringify(st.cityLife)&&JSON.stringify(loaded.warehouse.quality)===JSON.stringify(st.warehouse.quality)&&JSON.stringify(loaded.town.quality)===JSON.stringify(st.town.quality)&&seed===rngAfterLoad,'Loading active stories rerolls their outcome or changes stored precautions');
// Actual day-to-day runs check season gating, bounded histories, live prices and stock invariants.
st=fresh();st.cityLife.nextStory=8;st.money=100000000;const seen=new Set();let eventLogSeen=false;
for (let i=0;i<365*4;i++) {
  if(st.pendingDecision){const p=st.pendingDecision,choices=H.CHAINS[p.chain].stages[p.stage].choices;check(choices.some(choice=>H.decide(st,p.chain,choice).ok),'Simulated player cannot resolve a pending decision');}
  H.tick(st);eventLogSeen ||= st.log.some(x=>x.key.startsWith('city'));for(const e of st.cityLife.stories)seen.add(e.type);
  check(st.cityLife.stories.length<=3&&st.cityLife.history.length<=24,'Unbounded event state');
  check(Number.isFinite(st.cityLife.mood)&&st.cityLife.mood>=0&&st.cityLife.mood<=100,'Invalid sentiment');
  for(const g of H.GOODS)check(Number.isFinite(H.marketBuyPrice(st,g.id,1))&&H.goodQuality(st,g.id)>=50&&H.goodQuality(st,g.id)<=120&&(st.town.stock[g.id]||0)>=0,'Invalid market state');
}
check(seen.size>=16,'Context scheduler shows too little variety: '+seen.size);
check(st.cityLife.history.length===24&&eventLogSeen,'Events never enter the live game log');
console.log(JSON.stringify({result:'PASS',checks,baseStories:Object.values(H.CITY_STORIES).filter(s=>!s.followOnly).length,followups:Object.values(H.CITY_STORIES).filter(s=>s.followOnly).length,observed:seen.size,years:4}));
