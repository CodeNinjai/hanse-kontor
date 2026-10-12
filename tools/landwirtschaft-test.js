'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
let seed=53,checks=0;const math=Object.create(Math);math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const ctx=vm.createContext({console,Intl,Math:math,Date,JSON});
for(const file of ['data','town','i18n','game','paths','rivals','contracts','sea','family','offices','faith','deals','staff','burghers','chains','ostviertel','ausgleich','lehrgang','weiterentwicklung','handelsvorhaben','ereignisse','salzgeschichte','salzgeschichte-text','korrespondenz','korrespondenz-text','landwirtschaft','menu-art'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..','js',file+'.js'),'utf8'),ctx,{filename:file});
const H=vm.runInContext('HK',ctx),check=(v,m)=>{checks++;assert(v,m);},fresh=()=>{H.state=H.newGame({name:'Landprüfung',difficulty:'normal',years:20});H.state.money=1000000;return H.state;};
const runDay=st=>{st.day++;H.ruralDay(st);};
let st=fresh();check(Object.keys(st.rural.sites).length===10,'Ten real producers');
for(const id of Object.keys(H.RURAL_SITES)){
  st=fresh();const s=st.rural.sites[id],def=H.RURAL_SITES[id],g=Object.keys(s.stock)[0],qty=Math.min(3,s.stock[g]),money=st.money,free=H.whFree(st),local=s.stock[g],q=H.ruralQuote(st,id,g,qty);
  check(q.ok&&H.orderRural(st,id,g,qty).ok&&st.money===money-q.cost,'Payment includes actual goods and freight: '+id);
  check(!st.warehouse.stock[g]&&s.stock[g]===local-qty&&H.whFree(st)===free-qty,'Local stock leaves seller; goods wait; warehouse space reserved: '+id);
  const saved=H.deserialize(H.serialize(st));check(H.ruralWaiting(saved).length===1&&H.whFree(saved)===free-qty,'Waiting delivery persists: '+id);
  runDay(st);check(st.warehouse.stock[g]===qty&&H.ruralWaiting(st).length===0&&H.whFree(st)===free-qty,'Delivery releases reservation once: '+id);
  const state=H.serialize(st);H.ruralDay(st);check(H.serialize(st)===state,'Same day cannot produce or deliver twice: '+id);
  check(st.freight.jobs.some(j=>j.kind==='rural'&&j.ruralSite===id&&j.good===g&&j.qty===qty),'Real transport receipt names producer: '+id);
  // Buying a business grants no pre-existing merchant stock or wages twice.
  st=fresh();const funds=st.money,personal=H.serialize(st.warehouse);
  check(H.buyRural(st,id).ok&&st.money===funds-def.cost&&st.rural.sites[id].owner,'Native business purchase: '+id);
  check(H.stockUsed(st.rural.sites[id].stock)===0&&H.serialize(st.warehouse)===personal,'No free inventory at purchase: '+id);
  const own=st.rural.sites[id];st.day=own.next-1;
  for(const [input,n] of Object.entries(def.inp||{})){st.warehouse.stock[input]=n;st.warehouse.quality[input]=88;}
  const inputBefore={...st.warehouse.stock},cash=st.money;runDay(st);
  check(H.stockUsed(own.stock)>0&&st.money===cash-def.wage&&!own.reason,'Production charges wages and stores output locally: '+id);
  for(const [input,n] of Object.entries(def.inp||{}))check((st.warehouse.stock[input]||0)===(inputBefore[input]||0)-n,'Consumes real warehouse input: '+id+'/'+input);
  for(const output of Object.keys(own.stock))if(def.inp)check(own.quality[output]===88,'Bad input is not upgraded to perfect output: '+id+'/'+output);
  const good=Object.keys(own.stock)[0],cost=H.ruralQuote(st,id,good,1);check(cost.unit===0&&cost.goods===0&&cost.cost===cost.freight,'Own collection costs only freight: '+id);
  const worth=H.netWorth(st);check(H.orderRural(st,id,good,1).ok&&H.netWorth(st)===worth-cost.freight,'Collection does not duplicate own cargo worth: '+id);
  check(H.toggleRural(st,id).ok&&!own.active,'Work can pause: '+id);
}
st=fresh();for(const bad of [0,-1,NaN,Infinity,1.5]){const before=H.serialize(st);check(!H.orderRural(st,'grainfarm','grain',bad).ok&&H.serialize(st)===before,'Invalid order is pure');}
let before=H.serialize(st);check(!H.orderRural(st,'grainfarm','spices',1).ok&&H.serialize(st)===before,'No invented inventory');
st.warehouse.stock.tools=H.whFree(st);before=H.serialize(st);check(!H.orderRural(st,'grainfarm','grain',1).ok&&H.serialize(st)===before,'Capacity cannot be overbooked');
// Road closures preserve a prepaid lot; exceeding the limit returns money and stock once.
st=fresh();let cash=st.money;H.orderRural(st,'grainfarm','grain',3);st.landClosedUntil=30;
for(let i=0;i<9;i++)runDay(st);check(!st.warehouse.stock.grain&&H.ruralWaiting(st).length===1,'Road closure prevents goods appearing');
runDay(st);check(st.money===cash&&H.ruralWaiting(st).length===0&&!st.warehouse.stock.grain,'Full refund after excessive delay');
runDay(st);check(st.money===cash,'No duplicate refund');
// Changing ownership while an NPC order waits must not award refunded goods to the player.
st=fresh();H.orderRural(st,'grainfarm','grain',3);H.buyRural(st,'grainfarm');H.toggleRural(st,'grainfarm');st.landClosedUntil=30;for(let i=0;i<10;i++)runDay(st);
check(!st.rural.sites.grainfarm.stock.grain&&!st.warehouse.stock.grain,'Ownership cannot turn cancelled NPC cargo into free stock');
// Field choices wait for harvest and then grow the selected crop over a full cycle.
st=fresh();H.buyRural(st,'grainfarm');let farm=st.rural.sites.grainfarm;
check(H.setRuralCrop(st,'grainfarm','hemp').ok&&farm.crop==='grain'&&farm.nextCrop==='hemp','Crop change cannot bypass growing time');
for(let i=0;i<7;i++)runDay(st);check(farm.stock.grain===12&&farm.crop==='hemp'&&!farm.stock.hemp,'Existing crop harvested before changing');
for(let i=0;i<7;i++)runDay(st);check(farm.stock.hemp===10,'Next crop produces after seven days');
st.day=300;st.rural.day=299;farm.next=300;const hemp=farm.stock.hemp;H.ruralDay(st);check(farm.stock.hemp===hemp&&farm.reason==='ruralWinter','Winter pauses field production');
// Feed, local space and natural resource limits are hard constraints before any debit.
for(const id of ['cattlefarm','windmill','dairy','stonemason']){
 st=fresh();H.buyRural(st,id);const s=st.rural.sites[id],d=H.RURAL_SITES[id];s.next=1;st.warehouse.stock={};H.qualityStocks.set(st.warehouse.stock,st.warehouse.quality);cash=st.money;runDay(st);
 check(s.reason==='ruralInputs'&&st.money===cash&&H.stockUsed(s.stock)===0,'Missing inputs stop '+id);
 for(const [g,q]of Object.entries(d.inp)){st.warehouse.stock[g]=q;}s.stock.tools=100;const inputs=H.serialize(st.warehouse.stock);s.next=st.day+1;runDay(st);
 check(s.reason==='ruralFull'&&H.serialize(st.warehouse.stock)===inputs&&st.money===cash,'Full site cannot consume inputs or wages: '+id);
}
st=fresh();H.buyRural(st,'quarry');let quarry=st.rural.sites.quarry;quarry.resource=3;quarry.next=1;cash=st.money;runDay(st);check(quarry.reason==='ruralResourceEmpty'&&quarry.resource===3&&st.money===cash,'Quarry cannot overdraw remaining stone');
st=fresh();H.buyRural(st,'woodcutter');H.toggleRural(st,'woodcutter');st.rural.sites.woodcutter.resource=10;runDay(st);check(st.rural.sites.woodcutter.resource===11&&!st.rural.sites.woodcutter.stock.timber,'Paused woodcutting lets forest regrow');
// Existing enterprises retain income on old saves; production is an explicit switch.
for(const id of ['tannery','butcher']){
 st=fresh();st.craftGuild=true;check(H.buyVenture(st,id).ok,'Buy existing craft');const income=H.ventureIncome(st,id);check(income>0&&H.setRuralCraft(st,id).ok&&H.ventureIncome(st,id)===0,'Production replaces passive income: '+id);
 const d=H.RURAL_RECIPES[id];for(const[g,q]of Object.entries(d.inp)){st.warehouse.stock[g]=q;st.warehouse.quality[g]=84;}cash=st.money;H.tick(st);
 for(const[g,q]of Object.entries(d.out))check(st.warehouse.stock[g]===q&&H.goodQuality(st,g)===84,'Native processing output and quality: '+id+'/'+g);
 check(st.ledger.at(-1).wages===-d.wage&&!st.ledger.at(-1).ventures,'Only manufacturing wages, no parallel income: '+id);check(H.setRuralCraft(st,id).ok&&H.ventureIncome(st,id)>0,'Can restore income mode: '+id);
 const outputs=H.serialize(Object.fromEntries(Object.keys(d.out).map(g=>[g,st.warehouse.stock[g]])));H.tick(st);check(H.serialize(Object.fromEntries(Object.keys(d.out).map(g=>[g,st.warehouse.stock[g]])))===outputs,'Cash operation cannot grant free warehouse goods: '+id);
}
st=fresh();st.craftGuild=true;H.buyVenture(st,'tannery');H.setRuralCraft(st,'tannery');H.upgradeVenture(st,'tannery');st.warehouse.stock.hides=4;st.warehouse.stock.salt=2;H.tick(st);check(st.warehouse.stock.leather===4&&!st.warehouse.stock.hides&&!st.warehouse.stock.salt&&st.ledger.at(-1).wages===-20,'Craft upgrade scales inputs, outputs and wages together');
st.warehouse.stock.leather=0;st.warehouse.stock.hides=4;st.warehouse.stock.salt=2;st.warehouse.quality.hides=90;st.warehouse.quality.salt=90;H.hireMaster(st,'tannery');H.tick(st);check(H.goodQuality(st,'leather')===93,'A master improves work without restoring bad inputs to perfect quality');
st=fresh();H.buyRural(st,'cattlefarm');st.warehouse.stock.grain=1;const e=H.announceCityStory(st,'livestockIllness',1);st.day=1;H.cityDayStart(st);H.ruralDay(st);check(st.rural.sites.cattlefarm.stock.milk===2&&st.rural.sites.cattlefarm.quality.milk===82,'Livestock event changes actual farm output and quality');
// Migration only adds NPC data; it neither settles deliveries nor consumes RNG/cash.
st=fresh();delete st.rural;const state=H.serialize(st),random=seed,cargo=H.serialize(st.warehouse);st=H.deserialize(state);check(seed===random&&H.serialize(st.warehouse)===cargo&&!Object.values(st.rural.sites).some(s=>s.owner),'Legacy migration grants no owned assets or cargo');
const migrated=H.serialize(st.rural);H.migrate(st);check(H.serialize(st.rural)===migrated&&seed===random,'Idempotent migration');
console.log(JSON.stringify({result:'PASS',checks,sites:10,goods:H.GOODS.length,production:true,quality:true,deliveries:true,cropRotation:true,resources:true,legacy:true}));
