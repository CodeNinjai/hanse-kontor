/* A saved push-your-luck tavern game. Only explicit actions change the round. */
'use strict';
HK.DICE_RULES=Object.freeze({maxStake:200,maxThrows:6,breakEven:9});
HK.diceInit=function(st){st.diceGame ||= {round:null,nextId:1};};
HK.newGameHooks.push(HK.diceInit);HK.migrateHooks.push(HK.diceInit);
HK.diceRandom=function(round){round.seed=(Math.imul(round.seed,1664525)+1013904223)>>>0;return round.seed/4294967296;};
HK.dicePayout=round=>Math.floor(round.stake*round.score/HK.DICE_RULES.breakEven);
HK.diceStart=function(st,stake){
 HK.diceInit(st);const game=st.diceGame;
 if(game.round?.status==='playing')return {ok:false,msg:'diceAlreadyPlaying'};
 if(!Number.isSafeInteger(stake)||stake<1||stake>HK.DICE_RULES.maxStake)return {ok:false,msg:'diceStakeError'};
 if(st.money<stake)return {ok:false,msg:'notEnoughMoney'};
 game.round={id:game.nextId++,status:'playing',stake,score:0,throws:[],seed:HK.rndi(1,0xffffffff),day:st.day,payout:0,pietyLoss:0};
 HK.book(st,'gambling',-stake);
 return {ok:true};
};
HK.diceFinish=function(st,status){
 const r=st.diceGame?.round;if(r?.status!=='playing')return {ok:false};
 r.status=status;r.payout=status==='bust'?0:HK.dicePayout(r);r.finishedDay=st.day;
 if(r.payout)HK.book(st,'gambling',r.payout);
 if(HK.diceRandom(r)<.15){r.pietyLoss=Math.min(1,st.piety);st.piety=HK.clamp(st.piety-1,0,100);}
 HK.log(st,'diceReceipt',{stake:r.stake,payout:r.payout,net:r.payout-r.stake},r.payout>r.stake?'good':r.payout<r.stake?'bad':'info');
 HK.scheduleSave?.();return {ok:true};
};
HK.diceRoll=function(st,count,id,turn){
 const r=st.diceGame?.round;
 if(r?.status!=='playing'||r.id!==id||r.throws.length!==turn||![1,2].includes(count)||turn>=HK.DICE_RULES.maxThrows)return {ok:false};
 const dice=Array.from({length:count},()=>1+Math.floor(HK.diceRandom(r)*6));r.throws.push(dice);
 if(dice.includes(1))return HK.diceFinish(st,'bust');
 r.score+=dice.reduce((a,b)=>a+b,0);
 if(r.throws.length===HK.DICE_RULES.maxThrows)return HK.diceFinish(st,'banked');
 HK.scheduleSave?.();return {ok:true};
};
HK.diceBank=function(st,id,turn){
 const r=st.diceGame?.round;
 if(r?.status!=='playing'||r.id!==id||r.throws.length!==turn||!turn)return {ok:false};
 return HK.diceFinish(st,'banked');
};
// Keep legacy callers on the new game; a single call never settles a random bet.
HK.gamble=HK.diceStart;
