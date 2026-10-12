'use strict';
const assert=require('node:assert/strict'),HK=require('./domain-loader.cjs')(831);
const fresh=()=>HK.newGame({name:'Einstieg',difficulty:'normal',years:20});
const st=fresh();assert.equal(st.post.messages.length,1);assert.equal(st.post.messages[0].type,'welcome');assert.equal(st.contracts.offers.length,0);
// Time alone cannot trigger a flood of introductory offers.
st.day=20;HK.refreshContracts(st);HK.addTradeCycle(st,20);HK.postSync(st);assert.equal(st.contracts.offers.length,0);assert.equal(st.post.messages.length,1);
st.speed=1;HK.lehrgangMerke(st,'hafen');assert.equal(st.lehrgang.schritt,2);
const funds=st.money;assert.equal(HK.marketSell(st,'beer',0).ok,false);assert.equal(st.lehrgang.schritt,2);assert.equal(st.money,funds);
assert(HK.marketSell(st,'beer',1).ok);assert.equal(st.lehrgang.schritt,3);assert.equal(st.contracts.offers.length,1);assert.equal(st.contracts.offers[0].tradeTitle,'grain');
const c=st.contracts.offers[0];assert.equal(c.offered,20);assert.equal(c.deliverBy,undefined);assert(HK.acceptContract(st,c.id).ok);assert.equal(c.deadline,32);
HK.addStock(st.warehouse.stock,'grain',18);assert(HK.deliverContract(st,c.id).ok);assert(st.lehrgang.flags.verkauf);
// Starter salt may go to Wessel; paid delivery is a legitimate first sale.
const salt=fresh();salt.speed=1;HK.lehrgangMerke(salt,'hafen');assert(HK.startSaltStory(salt).ok);HK.addStock(salt.warehouse.stock,'salt',12);assert(HK.saltDeliver(salt).ok);assert(salt.lehrgang.flags.verkauf);assert(salt.lehrgang.schritt>=4);
// Existing stuck saves recover from receipts, once; no restart or duplicate reward.
salt.lehrgang.schritt=2;delete salt.lehrgang.flags.verkauf;delete salt.lehrgang.guided;
const repaired=HK.deserialize(HK.serialize(salt));assert(repaired.lehrgang.flags.verkauf);assert(repaired.lehrgang.schritt>=4);
const saved=HK.serialize(repaired),loaded=HK.deserialize(saved);assert.equal(HK.serialize(loaded),saved);
assert.equal(HK.introStage(loaded),2);
const empty=fresh();empty.warehouse.stock={};empty.speed=1;HK.lehrgangMerke(empty,'hafen');assert(HK.marketBuy(empty,'beer',1).ok);assert(HK.marketSell(empty,'beer',1).ok);assert.equal(empty.lehrgang.schritt,3);
// Early exploration opens content without completing or paying out the introduction.
const free=fresh(),money=free.money;free.lehrgang.explore=true;HK.introSync(free);assert.equal(free.lehrgang.schritt,0);assert.equal(free.money,money);assert(free.post.messages.some(m=>m.type==='saltOffer'));assert(free.contracts.offers.length>0);assert(!free.post.messages.some(m=>['ship','incoming','news'].includes(m.type)));
console.log('PASS: calm start, staged deadlines, first sale/replacement goods, salt delivery, old save repair, idempotent loading, optional exploration');
