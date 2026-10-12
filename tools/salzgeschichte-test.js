/* Real branching actions, deadlines, economic conservation, save/load and map placement. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
let seed=910,checks=0;const math=Object.create(Math);math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const ctx=vm.createContext({console,Intl,Math:math,Date,JSON});
for(const f of ['data','town','i18n','game','paths','rivals','contracts','sea','family','offices','faith','deals','staff','burghers','chains','ostviertel','ausgleich','lehrgang','weiterentwicklung','handelsvorhaben','ereignisse','salzgeschichte','salzgeschichte-text','korrespondenz','korrespondenz-text','landwirtschaft','iso','scene','buildings','art','flair','stadtereignisse'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..','js',f+'.js'),'utf8'),ctx,{filename:f});
const H=vm.runInContext('HK',ctx),S=H.Scene,check=(v,m)=>{checks++;assert(v,m);};
function fresh(){H.state=H.newGame({name:'Geschichte',difficulty:'normal',years:20});H.state.speed=0;return H.state;}
function loaded(st){H.state=H.deserialize(H.serialize(st));return H.state;}
function begin(){const st=fresh();check(H.startSaltStory(st).ok,'Story does not start');return st;}
let st=fresh(),snapshot=H.serialize(st),random=seed;
for(let i=0;i<30;i++){H.saltProjection(st);H.saltChoiceQuote(st,'pact');H.cityMapEvents(st);}
check(snapshot===H.serialize(st)&&random===seed,'Reading an offer changes simulation');
st.contracts.active=Array.from({length:3},(_,i)=>({id:i+800}));snapshot=H.serialize(st);
check(!H.startSaltStory(st).ok&&H.serialize(st)===snapshot,'Full contract list partially starts story');
st=begin();let c=H.saltContract(st),s=st.saltStory,money=st.money;
check(c.deadline===4&&c.qty===32&&c.reward===2240&&H.saltIncoming(st).tradeLot.qty===24,'Opening promise and real supply differ');
snapshot=H.serialize(st);check(!H.startSaltStory(st).ok&&H.serialize(st)===snapshot,'Story duplicated');
const r=H.saltRival(st),wealth=r.wealth,stock=st.town.stock.salt;
check(H.saltChoose(st,'pact').ok&&st.money===money-120&&r.wealth===wealth+120,'Pact does not transfer exact payment');
st.day=1;H.cityDayStart(st);check(st.town.stock.salt===stock&&s.rivalDone,'Pact still consumes shared salt');
snapshot=H.serialize(st);check(!H.saltChoose(st,'pact').ok&&snapshot===H.serialize(st),'Repeated pact payment');
st=begin();s=st.saltStory;c=H.saltContract(st);st.day=1;const r2=H.saltRival(st),stock2=st.town.stock.salt,wealth2=r2.wealth;H.cityDayStart(st);
check(s.rivalQty===8&&st.town.stock.salt===stock2-8&&r2.wealth===wealth2-8*s.rivalPrice,'Rival buys no real shared goods or ignores budget');
const q=H.saltChoiceQuote(st,'buyback'),salt=st.warehouse.stock.salt;money=st.money;
check(q.ok&&H.saltChoose(st,'buyback').ok&&st.money===money-q.cost&&st.warehouse.stock.salt===salt+8&&s.rivalQty===0,'Buyback creates/deletes money or goods');
snapshot=H.serialize(st);check(!H.saltChoose(st,'buyback').ok&&snapshot===H.serialize(st),'Rival can sell same cargo twice');
st=begin();money=st.money;st.money=89;snapshot=H.serialize(st);check(!H.saltChoose(st,'pilot').ok&&snapshot===H.serialize(st),'Unaffordable choice mutates story');st.money=money;
check(H.saltChoose(st,'pilot').ok,'Pilot choice failed');st=loaded(st);s=st.saltStory;const inc=H.saltIncoming(st);st.day=2;H.cityDayStart(st);
check(s.windDelay===1&&inc.days===4&&s.extras===90,'Pilot does not reduce announced delay after save');snapshot=H.serialize(st);H.cityDayStart(st);check(snapshot===H.serialize(st),'Same day applies story effects twice');
st=begin();st.day=2;H.cityDayStart(st);check(st.saltStory.windDelay===2&&H.saltIncoming(st).days===5,'Unassisted headwind wrong');
check(H.saltChoose(st,'extend').ok&&H.saltContract(st).deadline===6&&H.saltContract(st).reward===2080&&st.saltStory.buyer.trust===-1,'Renegotiation terms differ from promise');snapshot=H.serialize(st);check(!H.saltChoose(st,'extend').ok&&snapshot===H.serialize(st),'Repeated extension');
// A real purchase adds its paid cost including duty to the weighted goods value.
st=begin();s=st.saltStory;const basis=s.costs.salt.value,qty=s.costs.salt.qty;
let buy=H.marketBuy(st,'salt',12);check(buy.ok&&s.costs.salt.value===basis+buy.cost&&s.costs.salt.qty===qty+12,'Market purchase valuation differs from payment');
const projected=H.saltProjection(st);money=st.money;const rep=st.rep,mood=st.cityLife.mood;
check(H.saltDeliver(st,'community').ok&&st.money===money+1920&&!st.warehouse.stock.salt,'Community delivery has wrong cash/stock');
check(s.receipts[0].basis===basis+buy.cost&&s.receipts[0].contribution===1920-basis-buy.cost,'Receipt invents profit by ignoring starting stock');
check(st.rep>=rep+4&&st.cityLife.mood===mood+6&&s.outcome==='community'&&s.buyer.trust===2,'Community choice lacks persistent consequences');
snapshot=H.serialize(st);check(!H.saltDeliver(st,'community').ok&&snapshot===H.serialize(st),'Delivery paid twice');
st=loaded(st);s=st.saltStory;check(s.outcome==='community'&&s.buyer.trust===2&&s.receipts.length===1,'Loading forgets people/choice/receipt');
check(H.saltFollow(st,true).ok&&H.saltContract(st).deadline===7&&H.saltContract(st).minQuality===90,'Immediate follow-up unavailable');
buy=H.marketBuy(st,'smokedfish',8);check(buy.ok,'Follow-up has no immediate procurement path');
st.warehouse.quality.smokedfish=75;snapshot=H.serialize(st);check(!H.saltDeliver(st).ok&&snapshot===H.serialize(st),'Poor quality meets promised delivery');
st.warehouse.quality.smokedfish=100;check(H.saltDeliver(st).ok&&s.phase==='done'&&s.receipts.length===2&&s.buyer.trust===4,'Second order fails to complete');
// Reserved arrivals retain paid value and the same named captain across both visits.
st=begin();s=st.saltStory;const supply=H.saltIncoming(st),a=H.quoteTradeAdvance(st,supply.id,12),initial=s.costs.salt.value;
check(H.reserveTradeSupply(st,supply.id,12).ok,'Cannot secure actual salt supply');st=loaded(st);s=st.saltStory;st.ships=[];const arrival=H.saltIncoming(st);money=st.money;
check(H.dockShip(st,'luebeck',arrival),'Captain cannot dock');const visitor=st.ships.at(-1);
check(visitor.captain==='Ludeke Horn'&&visitor.captainId===s.captainId&&st.regularCaptains[s.captainId].visits===1,'Story captain missing/duplicate visits');
check(st.money===money&&st.warehouse.stock.salt===32&&Math.abs(s.costs.salt.value-initial-a.cost)<1e-8,'Prepaid arrival paid twice or loses paid goods value');
H.settleTradeArrival(st,arrival,visitor);check(st.warehouse.stock.salt===32&&Math.abs(s.costs.salt.value-initial-a.cost)<1e-8,'Repeated arrival duplicates cost or stock');
st.incoming=st.incoming.filter(i=>i!==arrival);check(H.saltDeliver(st).ok,'Prepaid goods do not fulfil promise');
check(s.returnPending&&!H.saltIncoming(st),'Return voyage starts while captain is still berthed');
st=loaded(st);s=st.saltStory;st.ships=[];H.saltPlanReturn(st);
const returning=H.saltIncoming(st);check(returning.saltStory==='return'&&returning.days===4,'Successful first order does not cause return visit after departure');
H.saltPlanReturn(st);check(st.incoming.filter(i=>i.saltStory==='return').length===1,'Repeated update schedules two return voyages');
check(H.dockShip(st,'luebeck',returning)&&st.regularCaptains[s.captainId].visits===2&&st.ships[0].wants.smokedfish.qty===16,'Returning captain lost memory or real demand');
check(!H.dockShip(st,'luebeck',returning),'One captain commands two ships simultaneously');
// Purchases from visitors and bulk discounts use paid prices, not quoted estimates.
st=begin();const v=st.ships[0];v.cargo.salt={qty:30,price:40};const value=st.saltStory.costs.salt.value;buy=H.buyBulkTrade(st,v,'salt',10);
check(buy.ok&&st.saltStory.costs.salt.value===value+buy.cost,'Bulk deal cost double counted or excludes duty');
const old=st.saltStory.costs.salt.value;H.addStock(st.warehouse.stock,'salt',-5);check(Math.abs(st.saltStory.costs.salt.value-old*25/30)<1e-8,'Outgoing stock retains entire valuation');
// Explicit deadline expiry and exact-once penalties also work through the native contract hook.
st=begin();check(H.saltChoose(st,'pilot').ok,'Pilot before failure');c=H.saltContract(st);st.day=4;H.tick(st);
check(st.saltStory.phase==='failed'&&st.saltStory.buyer.trust===-3&&st.saltStory.receipts[0].failed,'Broken promise not remembered');
check(st.saltStory.receipts[0].extras===426,'Failure ignores already paid pilot cost');
money=st.money;H.failContract(st,c);check(st.money===money&&st.saltStory.receipts.length===1,'Same broken promise is penalised twice');
snapshot=H.serialize(st);check(!H.saltChoose(st,'extend').ok&&snapshot===H.serialize(st),'Expired promise renegotiates retroactively');
st=loaded(st);check(st.saltStory.phase==='failed','Load revives failed story');
// All event props and actors stay on land, in public space, outside building footprints.
st=begin();st.cityLife.stories=['guildFair','dockStrike','highWater','herringRun'].map((type,i)=>({id:i,type,start:0,end:6}));S.clock=.5;S.weather='clear';
const events=H.cityMapEvents(st);check(events.length===4,'Coincident events duplicate shared-space props');
for(const e of events)for(const [x,y]of [[e.x,e.y],[e.x+e.w,e.y+e.d]])check(!S.isWater(x,y),e.kind+' prop in water');
let items=[];S.cityItems(items,st,'spring',0);const actors=items.filter(i=>i.townEventActor);
for(const actor of actors){const [x,y]=[actor.box[0]+.07,actor.box[1]+.07];check(!S.isWater(x,y),'Event actor in water');check(!H.BUILDINGS.some(b=>x>b.x&&x<b.x+b.w&&y>b.y&&y<b.y+b.d),'Event actor inside building');}
check(actors.length===5,'Daytime scenes lack actors');S.clock=.05;items=[];S.cityItems(items,st,'spring',0);check(!items.some(i=>i.townEventActor),'Nighttime event actors remain');
st=begin();const pure=H.serialize(st),pureSeed=seed;for(let i=0;i<50;i++){H.saltProjection(st);H.saltChoiceQuote(st,'pilot');H.cityMapEvents(st);}
check(H.serialize(st)===pure&&seed===pureSeed,'Live story quote changes state/random');
st.gameOver=true;snapshot=H.serialize(st);check(!H.saltDeliver(st,'community').ok&&snapshot===H.serialize(st),'Game-over delivery mutates choice or price');
console.log(JSON.stringify({result:'PASS',checks,branches:['business','community','pact','buyback','pilot','extend','deadline','quality'],returningCaptain:true,saveLoad:true,mapEvents:4}));
