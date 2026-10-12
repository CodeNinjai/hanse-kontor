'use strict';
const assert=require('node:assert/strict'),H=require('./domain-loader.cjs')();let checks=0;
const test=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
function state(good='cloth'){
 const s=H.newGame({name:'Nebenaufträge',difficulty:'normal',years:20});H.state=s;
 s.day=0;s.guildSponsorship={version:1,status:'active',acceptedAt:0,terms:{good,qty:8,dueAt:30},history:[]};H.guildSidequestsInit(s);return s;
}
function launch(s,day=1){s.day=day;H.guildSidequestSync(s);}
function accept(s,id){const q=s.guildSidequests.quests[id];assert.equal(q.status,'offer');const before=JSON.stringify(s);assert(H.guildSidequestQuote(s,id,'accept','offer').ok);assert.equal(JSON.stringify(s),before);assert(H.guildSidequestAct(s,id,'accept','offer').ok);}
function stock(s,good,qty,quality=96){H.withQuality(quality,()=>H.addStock(s.warehouse.stock,good,qty));}
test('Day-zero accepted main commitment launches once with saved absolute dates and legacy/expired mains do not relaunch',()=>{
 const s=state();launch(s);assert.equal(s.guildSidequests.status,'open');assert.equal(s.guildSidequests.anchor,0);assert.equal(s.guildSidequests.quests.hospital.dueAt,10);assert.equal(s.guildSidequests.quests.hospital.replyDue,6);const anchor=s.guildSidequests.anchor;s.day=5;H.guildSidequestSync(s);assert.equal(s.guildSidequests.anchor,anchor);
 const completedImmediately=state();completedImmediately.guildSponsorship.status='resolved';completedImmediately.guildSponsorship.ending='fulfilled';completedImmediately.day=1;H.guildSidequestSync(completedImmediately);assert.equal(completedImmediately.guildSidequests.quests.hospital.status,'offer');const old=H.newGame({name:'Old',difficulty:'normal',years:20});old.day=100;old.guildSponsorship={status:'active',acceptedAt:0,terms:{good:'cloth',qty:8,dueAt:20}};H.guildSidequestsInit(old);H.guildSidequestSync(old);assert.equal(old.guildSidequests.status,'done');assert.equal(old.guildSidequests.quests.hospital.status,'locked');
});
test('Hospital fulfillment consumes actual warehouse goods once, keeps shared overview and computes other promises after delivery',()=>{
 const s=state();launch(s);accept(s,'hospital');const q=s.guildSidequests.quests.hospital;stock(s,'cloth',11,96);s.guildSponsorship.status='resolved';s.guildSponsorship.ending='fulfilled';s.guildSponsorship.delivered={};
 s.contracts.active.push({id:'normal1',type:'deliver',good:'cloth',qty:2,deadline:12,giver:'mayor'});
 const summary=H.guildSidequestSummary(s,null,'hospital');assert(summary.items.some(x=>x.id==='hospital'));assert(summary.items.some(x=>x.id==='contract:normal1'));assert.equal(summary.goods.cloth.required,5);assert.equal(summary.goods.cloth.have,11);assert.deepEqual([summary.afterDelivery.remaining,summary.afterDelivery.otherRequired,summary.afterDelivery.shortfall],[8,2,0]);
 const balance=JSON.stringify(summary),rep=s.rep;assert(H.guildSidequestAct(s,'hospital','fulfill','active').ok);assert.equal(s.warehouse.stock.cloth,8);assert.equal(s.guildSidequests.quests.hospital.delivered.quality,96);assert(s.rep>=rep);assert.equal(s.guildSidequests.quests.hospital.history.filter(x=>x.action==='fulfilled').length,1);assert.notEqual(JSON.stringify(H.guildSidequestSummary(s)),balance);
});
test('Bracht escrow comes from finite wealth, pays only on delivery, and can be refunded exactly once',()=>{
 const s=state('tools'),initialWealth=s.rivals.find(x=>x.id==='bracht').wealth;launch(s);const q=s.guildSidequests.quests.bracht,r=s.rivals.find(x=>x.id==='bracht'),wealth=r.wealth,escrow=q.escrowAmount;assert.equal(q.status,'offer');assert.equal(wealth,initialWealth-escrow);const money=s.money;accept(s,'bracht');assert.equal(s.money,money);stock(s,'tools',q.qty,91);assert(H.guildSidequestAct(s,'bracht','fulfill','active').ok);assert.equal(s.money,money+escrow);assert.equal(q.escrowState,'paid');assert.equal(r.wealth,wealth);
 const w=state();launch(w);const b=w.guildSidequests.quests.bracht,rr=w.rivals.find(x=>x.id==='bracht'),held=rr.wealth;accept(w,'bracht');assert(H.guildSidequestAct(w,'bracht','withdraw','active').ok);assert.equal(b.escrowState,'returned');assert.equal(rr.wealth,held+b.escrowAmount);H.guildSidequestEnd(w,'bracht','breach');assert.equal(rr.wealth,held+b.escrowAmount);
});
test('Prospective promise counts only while offered; insufficient Bracht funds never create escrow after its original window',()=>{
 const s=state();launch(s);const q=s.guildSidequests.quests.hospital,base=H.guildSidequestSummary(s).goods.cloth.required;assert.equal(base,8);assert.equal(H.guildSidequestSummary(s,'hospital').goods.cloth.required,11);assert.equal(H.guildSidequestSummary(s).goods.cloth.required,8);
 const poor=state();poor.rivals.find(x=>x.id==='bracht').wealth=0;launch(poor);assert.equal(poor.guildSidequests.quests.bracht.status,'waitingFunds');poor.day=poor.guildSidequests.quests.bracht.fundBy+3;H.guildSidequestSync(poor);assert.equal(poor.guildSidequests.quests.bracht.status,'unfunded');assert.equal(poor.rivals.find(x=>x.id==='bracht').wealth,0);
});
test('Accepted mission persists, extension is once-only, and overdue commitments breach at the stored due date',()=>{
 const s=state();launch(s);accept(s,'hospital');const q=s.guildSidequests.quests.hospital,copy=H.deserialize(H.serialize(s));assert.deepEqual(JSON.parse(JSON.stringify(copy.guildSidequests)),JSON.parse(JSON.stringify(s.guildSidequests)));s.influence=5;assert(H.guildSidequestAct(s,'hospital','extend','active').ok);assert.equal(q.dueAt,14);assert.equal(H.guildSidequestAct(s,'hospital','extend','active').ok,false);s.day=20;H.guildSidequestSync(s);assert.equal(q.status,'breach');assert.equal(q.endedAt,15);assert.equal(q.history.filter(x=>x.action==='breach').length,1);
});
console.log(checks+' side order checks passed');
