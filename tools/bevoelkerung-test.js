'use strict';
const assert=require('node:assert/strict');
const H = require('./domain-loader.cjs')(undefined, { random: Math.random, scene: ['scene', 'buildings', 'art', 'flair', 'stadtereignisse', 'warenverkehr', 'landwirtschaft-scene', 'bevoelkerung-scene'] }), S = H.Scene;
H.state = H.newGame({ name: 'Kartentest', difficulty: 'normal', years: 20 });
H.UI = { selectedVisitor: null };
S.clock=.5;S.weather='clear';S.populationSetup(H.state);
const people=Object.values(H.state.population.people),mobile=people.filter(p=>p.motion);
assert(people.length>=140);assert.equal(new Set(people.map(p=>p.name)).size,people.length);
for(const p of people){assert(H.citizenBuilding(p.home),'Unknown home '+p.id);assert(H.citizenStory(p));assert(H.citizenJob(p));}
const women=people.filter(p=>p.gender==='female'&&p.type!=='child');
assert(women.length>35,'Women missing from town');assert(women.every(p=>p.look.dress&&!p.look.beard),'Female appearance not migrated');
assert(people.filter(p=>p.type==='child').every(p=>!p.look.beard));
const benchesSeen=new Set();let checks=0,entries=0,departures=0;
const sim=seconds=>{for(let i=0;i<seconds*10;i++){
 const reserved=mobile.map(p=>p.motion.bench).filter(Boolean);assert.equal(new Set(reserved).size,reserved.length,'Bench double booked');
 for(const p of mobile)if(p.motion.place==='bench'&&p.motion.seated===1)benchesSeen.add(p.motion.bench);
 const before=mobile.map(p=>({...p.motion}));S.time+=.1;S.updateGates(.1);S.populationUpdate(.1);
 mobile.forEach((p,j)=>{const a=before[j],b=p.motion;
  assert(Math.hypot(a.x-b.x,a.y-b.y)<.039,'Teleport: '+p.id);
  if(a.hidden!==b.hidden){if(b.hidden){assert(['home','away'].includes(b.place),'Disappears outside destination');entries++;}else{assert(['home','away'].includes(a.place),'Appears on street');departures++;}}
  if(!b.hidden&&!S.populationFree(b.x,b.y)){const door=S.populationDoor(p.home).door;assert(Math.hypot(b.x-door[0],b.y-door[1])<.7,'Walks through obstacle: '+p.id);}
  checks++;
 });
}};
sim(120);assert(mobile.some(p=>p.motion.visits>1),'No errands');
const beforeRain=mobile.map(p=>p.motion.hidden);S.weather='rain';S.populationUpdate(.1);
assert(mobile.every((p,i)=>p.motion.hidden===beforeRain[i]),'Rain instantly hides people');
S.weather='clear';S.clock=.98;sim(450);
assert(mobile.filter(p=>p.type!=='guard').every(p=>p.motion.hidden),'Day workers have not reached their homes');
S.clock=.5;sim(450);assert(mobile.some(p=>!p.motion.hidden),'Town did not wake up');
const save=H.serialize(H.state),copy=H.deserialize(save);
for(const p of people){const q=copy.population.people[p.id];assert.equal(q.name,p.name);assert.equal(q.home,p.home);assert.deepEqual(JSON.parse(JSON.stringify(q.motion??null)),JSON.parse(JSON.stringify(p.motion??null)));}
const legacy=JSON.parse(save);delete legacy.population;assert(Object.keys(H.deserialize(JSON.stringify(legacy)).population.people).length>=140,'Old save not migrated');
H.state.day=15;sim(450);
assert(mobile.filter(p=>p.guest).every(p=>p.motion.hidden&&p.motion.place==='away'),'Visitors did not leave at gate');
assert(![...S.populationNav().cache.values()].some(p=>p===null),'Unreachable daily route');
assert(benchesSeen.size>=4,'Benches remain unused: '+[...benchesSeen]);assert(entries>50&&departures>50);console.log(JSON.stringify({result:'PASS',people:people.length,women:women.length,benchesUsed:benchesSeen.size,checks,entries,departures,saving:true,migration:true,guestDeparture:true}));
