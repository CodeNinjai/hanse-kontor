/* Real receipts, connected routes and the visible market: node tools/logistik-test.js */
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
let seed = 739, checks = 0;
const math = Object.create(Math); math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const ctx = vm.createContext({ console, Intl, Math: math, Date, JSON });
for (const file of ['data', 'town', 'i18n', 'game', 'paths', 'rivals', 'contracts', 'sea', 'family', 'offices', 'faith', 'deals', 'staff', 'burghers', 'chains', 'ostviertel', 'ausgleich', 'lehrgang', 'weiterentwicklung', 'handelsvorhaben', 'ereignisse', 'salzgeschichte', 'salzgeschichte-text','korrespondenz','korrespondenz-text','landwirtschaft', 'iso', 'scene', 'buildings', 'art', 'flair', 'stadtereignisse', 'warenverkehr','landwirtschaft-scene']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', file + '.js'), 'utf8'), ctx, { filename: file });
const H = vm.runInContext('HK', ctx), S = H.Scene;
const check = (value, message) => { checks++; assert(value, message); };
function fresh() { H.state = H.newGame({ name: 'Prüfung', difficulty: 'normal', years: 20 }); H.state.money = 100000; H.state.freight.jobs = []; S._docks = null; S.walkers = []; S.porters = []; S.chickens = []; S.carts = []; S.time = 0; S.clock = .5; S.snapShips(); H.UI = { selectedVisitor: null }; return H.state; }

let st=fresh();
check(H.marketBuy(st,'grain',3).ok,'Market purchase failed');
S.updateFreight(0);
let w=S.porters.find(w=>w.freightJob);
check(w.path[0]==='S1'&&w.path.at(-1)==='WH','Market purchase still terminates on the quay');
check(S.freightPick(w).label.includes(H.freightBuildingName('warehouse')),'Courier does not identify its destination');
for(let i=0;i<2000&&st.freight.jobs[0].status!=='done';i++) S.update(.1);
check(st.freight.jobs[0].status==='done','Market-to-warehouse delivery never finishes');
st=fresh();st.workshops[0].type='ropemaker';st.warehouse.stock.hemp=20;st.cityLife.nextStory=1e9;
H.tick(st);
const incoming=st.freight.jobs.find(j=>j.fromBuilding==='warehouse'&&j.toBuilding==='plot1');
const output=st.freight.jobs.find(j=>j.fromBuilding==='plot1'&&j.toBuilding==='warehouse');
check(incoming&&output&&output.afterJobs.includes(incoming.id),'Production is not connected to its raw-material delivery');
check(st.freight.jobs.some(j=>j.owner==='city'&&j.toBuilding==='market'),'Local producers never supply the market');
const economy=JSON.stringify([st.money,st.warehouse,st.town.stock,st.rural]);
for(let i=0;i<5000&&output.status!=='done';i++) {
 S.update(.1);
 if(incoming.status!=='done')check(output.parcels.every(p=>p.state==='queued'),'Finished goods leave before their raw materials arrive');
}
check(incoming.status==='done'&&output.status==='done','Production transport chain stalls');
check(JSON.stringify([st.money,st.warehouse,st.town.stock,st.rural])===economy,'Animation books economic transfers twice');
// Persist destinations and dependencies, but restart only unfinished parcels.
st=H.deserialize(H.serialize(st));H.state=st;S.snapShips();
check(st.freight.jobs.find(j=>j.id===output.id).toBuilding==='warehouse','Saving loses transport destination');
// Every producer has a reachable path to the central warehouse and the market.
for(const id of Object.keys(H.RURAL_SITES)) {
 const node=S.freightNode(id);
 check(node&&S.route(node,'WH').length>1&&S.route(node,'S1').length>1,'Disconnected producer '+id);
}
S.clock=.5;S.weather='clear';
const items=[];S.cityItems(items,st,'summer',0);
check(items.filter(it=>it.cityVendor!==undefined).length===6,'Market sellers missing');
check(items.filter(it=>it.marketCustomer!==undefined).length===6,'Market shoppers missing');
for(let i=0;i<6;i++)for(let t=0;t<180;t+=.15){const p=S.marketCustomerPose(i,t);check(!S.blockedAt(p.x,p.y)&&!S.isWater(p.x,p.y),'Shopper walks through a stall or obstacle: '+JSON.stringify({i,t,p}));}
const before=S.marketStallKey(0);st.town.stock.grain=0;
check(S.marketStockLevel(0)===0&&S.marketStallKey(0)!==before,'Sold-out grain stays on display');
S.weather='rain';const rain=[];S.cityItems(rain,st,'summer',0);
check(rain.filter(it=>it.cityVendor!==undefined).length===6,'Covered stalls close for rain');
S.clock=.95;const night=[];S.cityItems(night,st,'summer',0);
check(!night.some(it=>it.cityVendor!==undefined||it.marketCustomer!==undefined),'Market ignores closing time');
console.log(JSON.stringify({result:'PASS',checks,connectedProduction:true,market:true,noDoubleBooking:true}));
