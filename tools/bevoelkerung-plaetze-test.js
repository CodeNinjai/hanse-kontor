'use strict';
const assert=require('node:assert/strict');
const H = require('./domain-loader.cjs')(undefined, { random: Math.random, scene: ['scene', 'buildings', 'art', 'flair', 'stadtereignisse', 'warenverkehr', 'landwirtschaft-scene', 'bevoelkerung-scene'] }), S = H.Scene;
H.state = H.newGame({ name: 'Kartentest', difficulty: 'normal', years: 20 });
H.UI = { selectedVisitor: null };
S.clock=.5;S.weather='clear';S.populationSetup(H.state);
const people=Object.values(H.state.population.people),mobile=people.filter(p=>p.motion);
// New towns must not initialise residents on top of one another.
const residents=mobile.filter(p=>['resident','customer'].includes(p.group)&&!p.motion.hidden);
for(let i=0;i<residents.length;i++)for(let j=i+1;j<residents.length;j++){
 const a=residents[i].motion,b=residents[j].motion;
 assert(Math.hypot(a.x-b.x,a.y-b.y)>=.62-1e-8,'Overlapping initial residents');
}
assert.equal(residents.length,0,'Customers must start at home, not wait at the market');
for(let i=0;i<100;i++){S.time+=.1;S.updateGates(.1);S.populationUpdate(.1);}
assert(mobile.filter(p=>p.motion.moving).length>=12,'Residents must set off within ten seconds');
// Reproduce an existing save with a dozen people at the former shared market stops.
const crowd=mobile.filter(p=>['resident','customer'].includes(p.group)).slice(0,12),old=[13.1,9.5];
assert(S.populationFree(...old));
for(const p of crowd)Object.assign(p.motion,{x:old[0],y:old[1],place:'market',route:[],leg:0,target:null,destination:null,planning:false,hidden:false,wait:0,bench:null,seated:0});
let reservations=0,maxStep=0;
for(let i=0;i<2400;i++){
 const before=mobile.map(p=>[p.motion.x,p.motion.y]);
 S.time+=.1;S.updateGates(.1);S.populationUpdate(.1);
 mobile.forEach((p,j)=>{const m=p.motion;maxStep=Math.max(maxStep,Math.hypot(m.x-before[j][0],m.y-before[j][1]));});
 const reserved=mobile.filter(p=>['resident','customer'].includes(p.group)&&['work','market'].includes(p.motion.target)&&p.motion.destination);
 for(let a=0;a<reserved.length;a++)for(let b=a+1;b<reserved.length;b++){
  const x=reserved[a].motion.destination,y=reserved[b].motion.destination;
  assert(Math.hypot(x[0]-y[0],x[1]-y[1])>=.62-1e-8,'Incoming residents share a stop');reservations++;
 }
}
assert(maxStep<=.038001,'Crowd was teleported');
assert(crowd.every(p=>p.motion.visits>0),'Residents stay stuck');
const atOld=mobile.filter(p=>!p.motion.hidden&&Math.hypot(p.motion.x-old[0],p.motion.y-old[1])<.65).length;
assert(atOld<=3,'Old market crowd did not disperse: '+atOld);
// Full destinations cause a short retry; they must not re-use an occupied spot.
const p=crowd[0],other=crowd[1];other.motion.hidden=false;other.motion.x=13.1;other.motion.y=9.5;
assert.equal(S.populationStop(p,[13.1,9.5],.3),null);
assert(reservations>100);
console.log(JSON.stringify({result:'PASS',initialSpacing:true,crowd:12,remainingAtOldStop:atOld,reservationChecks:reservations,maxStep,noTeleport:true,fullStopRejected:true}));
