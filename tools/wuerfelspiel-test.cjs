'use strict';
const assert=require('node:assert/strict'),HK=require('./domain-loader.cjs')(423);
const fresh=()=>HK.newGame({name:'Würfeltisch',difficulty:'normal',years:20});
const st=fresh(),money=st.money;
for(const bet of [0,-1,NaN,Infinity,1.5,201,'20'])assert.equal(HK.diceStart(st,bet).ok,false);
assert.equal(st.money,money);st.money=0;assert.equal(HK.diceStart(st,1).ok,false);st.money=money;
assert(HK.diceStart(st,90).ok);assert.equal(st.money,money-90);const r=st.diceGame.round;
assert.equal(HK.diceStart(st,10).ok,false);assert.equal(HK.diceBank(st,r.id,0).ok,false);
for(const args of [[3,r.id,0],[1,r.id+1,0],[1,r.id,1]])assert.equal(HK.diceRoll(st,...args).ok,false);
r.seed=0;assert(HK.diceRoll(st,2,r.id,0).ok);assert.equal(r.score,r.throws[0].reduce((a,b)=>a+b,0));assert(!r.throws[0].includes(1));
assert.equal(HK.diceRoll(st,2,r.id,0).ok,false,'Repeated click rolls twice');
const restored=HK.deserialize(HK.serialize(st));assert.deepEqual(JSON.parse(JSON.stringify(restored.diceGame)),JSON.parse(JSON.stringify(st.diceGame)));
assert(HK.diceRoll(st,1,r.id,1).ok);assert(HK.diceRoll(restored,1,r.id,1).ok);assert.equal(JSON.stringify(st.diceGame),JSON.stringify(restored.diceGame),'Reload rerolls dice');
assert.equal(st.money,restored.money);
// Known position: 12 points on a 90-mark stake pays 120, net +30.
const bank=fresh(),initial=bank.money;HK.diceStart(bank,90);Object.assign(bank.diceGame.round,{score:12,throws:[[6,6]],seed:0});const id=bank.diceGame.round.id;
assert(HK.diceBank(bank,id,1).ok);assert.equal(bank.money,initial+30);assert.equal(bank.ledger[0].gambling,30);assert.equal(bank.diceGame.round.payout,120);
assert.equal(HK.diceBank(bank,id,1).ok,false);assert.equal(bank.money,initial+30);assert.equal(HK.diceRoll(bank,1,id,1).ok,false);
// A one on either die loses the whole stake and cannot be cashed out later.
const bust=fresh();HK.diceStart(bust,90);let seed=0;while(true){const q={seed};const dice=[HK.diceRandom(q),HK.diceRandom(q)].map(x=>1+Math.floor(x*6));if(dice[0]!==1&&dice[1]===1)break;seed++;}bust.diceGame.round.seed=seed;
assert(HK.diceRoll(bust,2,1,0).ok);assert.equal(bust.diceGame.round.status,'bust');assert.equal(bust.diceGame.round.payout,0);assert.equal(bust.ledger[0].gambling,-90);assert.equal(HK.diceBank(bust,1,1).ok,false);
// The sixth successful throw pays automatically exactly once.
const end=fresh();HK.diceStart(end,90);Object.assign(end.diceGame.round,{score:20,throws:[[4],[4],[4],[4],[4]],seed:0});assert(HK.diceRoll(end,1,1,5).ok);assert.equal(end.diceGame.round.status,'banked');assert.equal(end.diceGame.round.score,22);assert.equal(end.diceGame.round.payout,220);assert.equal(end.ledger[0].gambling,130);
assert.equal(HK.diceRoll(end,1,1,6).ok,false);
const old=fresh();delete old.diceGame;HK.migrate(old);assert.equal(old.diceGame.round,null);
// Enumerate fair outcomes and the optimal six-throw policy: neither die choice
// dominates everywhere, and even optimal play cannot mint money in expectation.
const outcomes=n=>n===1?Array.from({length:6},(_,i)=>[i+1]):outcomes(1).flatMap(a=>outcomes(1).map(b=>[...a,...b]));
assert.equal(outcomes(2).filter(d=>d.includes(1)).length,11);
const memo=new Map();function expected(score,left){if(!left)return score;const key=score+':'+left;if(memo.has(key))return memo.get(key);const v=Math.max(score,...[1,2].map(n=>outcomes(n).reduce((sum,d)=>sum+(d.includes(1)?0:expected(score+d.reduce((a,b)=>a+b,0),left-1)),0)/6**n));memo.set(key,v);return v;}
const best=expected(0,6)/9;assert(best>.89&&best<.92);
console.log('PASS: stake validation, saved deterministic rounds, cashout, double actions, bust, six throws, old saves; optimal expected return '+(best*100).toFixed(2)+'% before rounding');
