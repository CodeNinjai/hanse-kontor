/* node tools/waren-test.js — native transactions, save migration and production */
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
let seed = 741, checks = 0;
const math = Object.create(Math); math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const ctx = vm.createContext({ console, Intl, Math: math, Date, JSON });
for (const file of ['data','town','i18n','game','paths','rivals','contracts','sea','family','offices','faith','deals','staff','burghers','chains','ostviertel','ausgleich','lehrgang','weiterentwicklung','handelsvorhaben','ereignisse','salzgeschichte','salzgeschichte-text','korrespondenz','korrespondenz-text','landwirtschaft','menu-art']) vm.runInContext(fs.readFileSync(path.join(__dirname,'..','js',file+'.js'),'utf8'),ctx,{filename:file});
const H = vm.runInContext('HK',ctx), ids = ['hemp','flax','pitch','bricks','honey','cheese','rope','canvas','flour','cattle','milk','meat','hides','stone','dressedstone'];
const check = (condition, label) => { checks++; assert(condition,label); };
const fresh = () => { H.state = H.newGame({name:'Warenprüfung',difficulty:'normal',years:20}); H.state.money = 1000000; return H.state; };
check(H.GOODS.length === 31 && new Set(H.GOODS.map(g=>g.id)).size === H.GOODS.length,'Unique goods');
check(new Set(Object.values(H.GOOD_GROUPS).flat()).size === H.GOODS.length && Object.values(H.GOOD_GROUPS).flat().length === H.GOODS.length,'Each good has one category');
const pictures = H.GOODS.map(g=>H.MenuArt.good(g.id).replace(/data-menu-art="[^"]*"/g,''));
check(new Set(pictures).size === H.GOODS.length,'Real illustrations must be different, not renamed fallback crates');
for (const id of ids) {
  let st = fresh();
  check(st.town.stock[id]>0 && !st.warehouse.stock[id],'Initial supply, no free personal goods: '+id);
  const money=st.money, stock=st.town.stock[id], buy=H.marketBuyPrice(st,id,2);
  check(H.marketBuy(st,id,2).ok && st.money === money-buy*2 && st.warehouse.stock[id] === 2 && st.town.stock[id] === stock-2,'Market purchase: '+id);
  const sale=H.marketSellPrice(st,id,1), before=st.money;
  check(H.marketSell(st,id,1).ok && st.money === before+sale && st.warehouse.stock[id] === 1,'Market sale: '+id);
  check(H.buyShip(st,'schnigge').ok,'Native ship purchase');
  const ship=st.ownShips.at(-1); st.warehouse.quality[id]=109;
  check(H.loadShip(st,ship.id,id,1).ok && ship.cargo[id] === 1 && !st.warehouse.stock[id] && H.shipGoodQuality(ship,id) === 109,'Ship load and quality: '+id);
  check(H.unloadShip(st,ship.id,id,1).ok && st.warehouse.stock[id] === 1 && H.goodQuality(st,id) === 109,'Unload once without quality loss: '+id);
  const saved=H.deserialize(H.serialize(st));
  check(saved.warehouse.stock[id]===1 && H.goodQuality(saved,id)===109,'Saved quantity and quality: '+id);
  const suppliers=H.ORIGINS.filter(o=>o.sell[id]), buyers=H.ORIGINS.filter(o=>o.want[id]);
  check(suppliers.length>0 && buyers.length>0,'Suppliers and export demand: '+id);
  // Native visitor generation must actually select the additional cargo/want keys.
  let seller,buyer;
  for(let n=0;n<80 && (!seller || !buyer);n++) {
    if(!seller){const v=H.makeVisitor(st,suppliers[0].id); if(v.cargo[id])seller=v;}
    if(!buyer){const v=H.makeVisitor(st,buyers[0].id); if(v.wants[id])buyer=v;}
  }
  check(seller && buyer,'Visitors actually trade new goods: '+id);
  check(H.buyFromVisitor(st,seller,id,2,false).ok && st.warehouse.stock[id]===3,'Visitor purchase: '+id);
  check(H.sellToVisitor(st,buyer,id,2,false).ok && st.warehouse.stock[id]===1,'Visitor sale: '+id);
  const job=st.freight.jobs.at(-1);
  check(job.good===id && job.qty===2 && job.parcels.every(p=>p.kind===H.cargoKind(id)),'Transport parcels use correct goods and packaging: '+id);
  // Reserve real incoming supply, then dock it; quantity and money settle once.
  st=fresh(); const o=suppliers[0]; st.ships=[];st.caravans=[];
  const inc={id:800,origin:o.id,sea:o.sea,days:2,known:true,waiting:0,tradeLot:{good:id,qty:12,price:Math.round(H.GOOD[id].base*o.sell[id])},delayChance:.25};
  st.incoming=[inc]; const quote=H.quoteTradeAdvance(st,inc.id,5), funds=st.money, free=H.whFree(st);
  check(quote.ok && H.reserveTradeSupply(st,inc.id,5).ok && st.money===funds-quote.cost && H.whFree(st)===free-5 && !st.warehouse.stock[id],'Reserved supply: '+id);
  check(H[o.sea?'dockShip':'dockCaravan'](st,o.id,inc) && st.warehouse.stock[id]===5 && H.whFree(st)===free-5,'Actual supplier arrival: '+id);
  H.settleTradeArrival(st,inc,H.visitors(st).at(-1));
  check(st.warehouse.stock[id]===5 && st.money===funds-quote.cost,'No duplicate receipt: '+id);
  // Generate a native delivery order and fulfill it through its real action.
  const giver=Object.keys(H.CONTRACT_GIVERS).find(g=>H.CONTRACT_GIVERS[g].goods?.includes(id));let c;
  for(let n=0;n<100;n++){const offer=H.makeContract(st,giver);if(offer.good===id){c=offer;break;}}
  check(c,'Generated delivery contract: '+id);st.contracts.offers=[c];st.warehouse.stock[id]=c.qty;
  const cash=st.money;check(H.acceptContract(st,c.id).ok && H.deliverContract(st,c.id).ok && st.money===cash+c.reward && !st.warehouse.stock[id],'Contract removes cargo and pays reward: '+id);
  check(!H.deliverContract(st,c.id).ok && st.money===cash+c.reward,'No second contract payment: '+id);
}
// Simulate an older save with no new city goods. Migration must consume no RNG,
// preserve zero stocks, owned goods, cargo, cash, reservations and old prices.
let st=fresh(); st.town.stock.salt=0; const snapshot={money:st.money,warehouse:H.serialize(st.warehouse),incoming:H.serialize(st.incoming),ships:H.serialize(st.ships),personalWorth:H.netWorth(st)};
for(const id of ids)delete st.town.stock[id]; const rng=seed;
st=H.deserialize(H.serialize(st));H.state=st;
check(seed===rng && st.money===snapshot.money && H.netWorth(st)===snapshot.personalWorth,'Migration does not roll dice or change personal worth');
check(H.serialize(st.warehouse)===snapshot.warehouse && H.serialize(st.incoming)===snapshot.incoming && H.serialize(st.ships)===snapshot.ships && st.town.stock.salt===0,'Migration preserves personal inventory, incoming supplies, visitors and zero stock');
check(ids.every(id=>Number.isFinite(st.town.stock[id])&&st.town.stock[id]>0),'Migration fills new city stocks');
st.town.stock.hemp=0;const stocks=H.serialize(st.town.stock);H.migrate(st);check(H.serialize(st.town.stock)===stocks && seed===rng,'Migration is idempotent and preserves new zeroes');
for(const type of ['ropemaker','sailweaver']){
  st=fresh();st.guildMember=true;const w=H.WORKSHOP[type], funds=st.money;
  check(H.buyLicense(st,type).ok && H.buildWorkshop(st,0,type).ok && st.money===funds-w.license-w.cost,'Licensed workshop built: '+type);
  const input=Object.keys(w.inp)[0];st.warehouse.stock[input]=w.inp[input];st.cityLife.nextStory=1e9;
  H.tick(st);check(!st.warehouse.stock[input] && st.warehouse.stock[w.out]===w.qty && !st.workshops[0].idle && H.goodQuality(st,w.out)===100,'Daily production consumes actual inputs: '+type);
  H.tick(st);check(st.warehouse.stock[w.out]===w.qty && st.workshops[0].idle,'Missing raw materials stop production: '+type);
  st=H.deserialize(H.serialize(st));H.state=st;check(st.workshops[0].type===type && st.licenses[type] && st.warehouse.stock[w.out]===w.qty,'Workshop and output persist: '+type);
}
st=fresh();st.day=H.TRADE_NEWS.quayworks.offset;
const baseline=H.consMod(st,'bricks');st.tradePlanning.news=[];check(baseline>H.consMod(st,'bricks'),'Quay works change actual brick demand');
st=fresh();for(const type of ['heatwave','highWater']){
  st.cityLife.stories=[];st.warehouse.stock.cheese=100;st.warehouse.stock.canvas=100;
  const e=H.announceCityStory(st,type,st.day);st.day=e.respondBy+1;H.cityDayStart(st);
  const good=type==='heatwave'?'cheese':'canvas';check(st.warehouse.stock[good]<100 && H.goodQuality(st,good)<100,'Real event damage and quality: '+good);
}
console.log(JSON.stringify({result:'PASS',checks,newGoods:ids.length,totalGoods:H.GOODS.length,productionChains:2,migration:true,trade:true,contracts:true,reservations:true,quality:true}));
