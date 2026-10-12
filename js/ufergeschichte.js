/* Public works, neighbours and a later load test share one persistent project.
   Escrow belongs to the sponsor; no action creates free goods or cash rewards. */
'use strict';
HK.shoreInit=st=>st.shoreStory ||= {version:1,phase:'locked',history:[],cash:0,basis:0,escrow:0,neighbours:{phase:'locked'},aftercare:{phase:'locked'}};
HK.newGameHooks.push(HK.shoreInit);HK.migrateHooks.push(HK.shoreInit);
HK.shoreSound=st=>!!(st.shoreStory?.built&&!st.shoreStory.damaged);
HK.shoreSupport=st=>{const S=st.shoreStory;return S?.aftercare.phase==='done'&&S.aftercare.ending==='certified'&&st.day<S.supportUntil&&st.family.generation===S.generation?1:0;};
HK.shoreRecord=function(st,quest,action,before,extra={}){const S=st.shoreStory,after=HK.breadSnapshot(st),delta={};for(const k of Object.keys(after))if(after[k]!==before[k])delta[k]=after[k]-before[k];const e={quest,action,day:st.day,author:st.name,delta,...extra};S.history.push(e);S.cash+=delta.money||0;S.basis+=extra.basis||0;HK.recordDeed(st,'shore','shore:'+S.history.length,{choice:HK.t('shoreAction_'+action)});return e;};
HK.shoreMail=function(st,quest,stage){HK.postAdd(st,'shore:'+quest+':'+stage,'shore',quest==='neighbours'?'person:guild':quest==='aftercare'?'person:weighmaster':'person:mayor',{quest,stage,site:st.shoreStory.site,ending:(quest==='main'?st.shoreStory:st.shoreStory[quest]).ending,damaged:!!st.shoreStory.damaged});};
HK.shoreReturnEscrow=function(st){const S=st.shoreStory,r=st.rivals.find(r=>r.id==='bracht');if(S.escrow&&r)r.wealth+=S.escrow;S.escrow=0;};
HK.shoreChances=function(st){const S=st.shoreStory;for(const inc of st.incoming){if(inc.delayResolved)continue;HK.decorateTradeArrival(inc);const previous=inc.shoreReduction||0,bonus=HK.shoreSound(st)&&inc.sea===(S.site==='quay')?Math.min(.1,inc.delayChance+previous):0;inc.delayChance=Math.max(0,inc.delayChance+previous-bonus);inc.shoreReduction=bonus;}};
HK.shoreSync=function(st){
 const S=HK.shoreInit(st);if(st.gameOver)return;
 if(S.phase==='locked'&&st.day>=35&&st.breadStory?.phase==='done'&&st.day>=st.breadStory.finished+3){S.phase='offer';HK.shoreMail(st,'main','offer');}
 if(['survey','site','finance','contract','building','inspection'].includes(S.phase)&&st.day>S.due){const before=HK.breadSnapshot(st);HK.shoreReturnEscrow(st);S.phase='done';S.finished=st.day;S.ending='expired';S.neighbours.phase='done';S.neighbours.finished ??= st.day;S.neighbours.ending ||= 'cancelled';HK.breadEffects(st,{rep:-3,influence:-2,zuenfte:-2});HK.shoreRecord(st,'main','expired',before);HK.shoreMail(st,'main','done');}
 if(S.phase==='survey'&&st.day>=S.surveyAt){S.phase='site';HK.shoreMail(st,'main','survey');}
 if(S.phase==='building'&&st.day>=S.buildAt){S.phase='inspection';HK.shoreMail(st,'main','inspection');}
 if(S.neighbours.phase==='offer'&&st.day>S.neighbours.due){const before=HK.breadSnapshot(st);S.neighbours.phase='done';S.neighbours.finished=st.day;S.neighbours.ending='ignored';S.disputed=true;HK.shoreHouseMood(st,-8);HK.breadEffects(st,{rep:-2,zuenfte:-3,mood:-3});HK.shoreRecord(st,'neighbours','ignored',before);HK.shoreMail(st,'neighbours','done');}
 if(S.aftercare.phase==='waiting'&&st.day>=S.aftercare.at){S.aftercare.phase='offer';S.aftercare.due=st.day+12;S.damaged=!!S.defect;if(S.damaged){const before=HK.breadSnapshot(st);HK.breadEffects(st,{mood:-4,kaufleute:-2});HK.shoreRecord(st,'aftercare','damage',before);}HK.shoreMail(st,'aftercare','offer');}
 if(S.aftercare.phase==='repairing'&&st.day>=S.aftercare.ready){S.damaged=false;S.defect=false;S.aftercare.phase='offer';S.aftercare.repaired=true;HK.shoreMail(st,'aftercare','repaired');}
 if(S.aftercare.phase==='offer'&&st.day>S.aftercare.due){const before=HK.breadSnapshot(st);S.aftercare.phase='done';S.aftercare.finished=st.day;S.aftercare.ending='neglected';HK.breadEffects(st,{rep:-2,zuenfte:-2});HK.shoreRecord(st,'aftercare','neglected',before);HK.shoreMail(st,'aftercare','done');}
 if(S.debt>0&&!S.repayment&&st.day>S.debtDue){const before=HK.breadSnapshot(st);S.debt+=40;S.repayment='instalments';S.paidDay=st.day;HK.breadEffects(st,{rep:-2,patrizier:-3});HK.shoreRecord(st,'main','overdue',before);HK.shoreMail(st,'main','overdue');}
 if(S.debt>0&&S.repayment==='instalments'&&st.day>(S.paidDay??S.opened)){
  S.paidDay=st.day;const n=Math.min(10,S.debt,Math.max(0,Math.floor(st.money)));if(n){HK.book(st,'politics',-n);S.cash-=n;S.debt-=n;const r=st.rivals.find(r=>r.id==='bracht');if(r)r.wealth+=n;S.repaid=(S.repaid||0)+n;}
  if(!S.debt)HK.shoreMail(st,'main','debtPaid');
 }
 HK.shoreChances(st);
};
HK.shoreHouseMood=function(st,n){for(const id of st.shoreStory.houses||[]){const h=st.burghers[id];if(h)h.mood=HK.clamp(h.mood+n,0,100);}};
HK.tickHooks.push(HK.shoreSync);HK.migrateHooks.push(HK.shoreSync);
HK.SHORE_ACTIONS={
 start:{cost:100,effects:{},art:'townhall'},decline:{cost:0,effects:{},art:'townhall'},
 quay:{cost:0,effects:{kaufleute:2,patrizier:1,zuenfte:-1},art:'harbour'},bank:{cost:0,effects:{zuenfte:2,kirche:1,kaufleute:-1},art:'gate'},
 own:{cost:0,effects:{},art:'bank'},sponsor:{cost:0,effects:{piety:-1,patrizier:2},art:'bank'},parish:{cost:0,effects:{piety:2,kirche:2},art:'church'},
 guild:{cost:1600,goods:{timber:12,stone:8,tools:2},quality:85,days:10,effects:{zuenfte:2},art:'tools'},cheap:{cost:900,goods:{timber:8,stone:4,tools:1},quality:70,days:6,effects:{zuenfte:-2},art:'timber'},
 compensate:{cost:120,effects:{rep:1,zuenfte:2,mood:2},art:'house'},hours:{cost:0,effects:{rep:1,zuenfte:1},art:'house'},force:{cost:0,effects:{influence:-4,rep:-2,suspicion:3,zuenfte:-4,mood:-2},art:'townhall'},
 inspect:{cost:80,effects:{},art:'tools'},repair:{cost:450,goods:{timber:3,stone:2},quality:85,days:3,effects:{},art:'tools'},
 open:{cost:0,effects:{rep:4,influence:3,prosperity:3,mood:3},art:'townhall'},conceal:{cost:0,effects:{rep:1,piety:-2,suspicion:5},art:'dive'},
 certify:{cost:0,effects:{rep:2,influence:2,zuenfte:2,mood:2},art:'townhall'},abandon:{cost:0,effects:{rep:-3,zuenfte:-3,mood:-2},art:'townhall'},
 repay:{cost:0,effects:{},art:'bank'},instalments:{cost:0,effects:{piety:-1},art:'bank'}
};
HK.shoreQuote=function(st,quest,action,phase){
 const S=st.shoreStory,T=quest==='main'?S:quest==='neighbours'?S?.neighbours:quest==='aftercare'?S?.aftercare:null,d=HK.SHORE_ACTIONS[action];
 const no=()=>({ok:false,msg:'shoreGone'});if(st.gameOver||!T||!d||T.phase!==phase)return no();
 const q={ok:true,cost:d.cost,goods:{...d.goods},quality:d.quality||0,effects:{...d.effects},art:d.art,basis:0,escrowUsed:0},fail=msg=>{q.ok=false;q.msg=msg;};
 if(quest==='main'){
  if(['survey','site','finance','contract','building','inspection'].includes(phase)&&st.day>S.due)return no();
  if(phase==='offer'&&['start','decline'].includes(action)){}
  else if(phase==='site'&&['quay','bank'].includes(action)){}
  else if(phase==='finance'&&['own','sponsor','parish'].includes(action)){
   if(action==='sponsor'){if((st.rivals.find(r=>r.id==='bracht')?.wealth||0)<600)fail('shoreSponsorPoor');}
   if(action==='parish'&&st.piety<40&&!['account','aid'].includes(st.breadStory?.ending))fail('shoreParishNeeds');
  }else if(phase==='contract'&&['guild','cheap'].includes(action)){
   q.total=d.cost-(S.funding==='parish'?250:0);q.escrowUsed=Math.min(S.escrow,q.total);q.cost=q.total-q.escrowUsed;q.days=d.days+(S.slow?2:0);q.ready=st.day+q.days;
   if(S.neighbours.phase!=='done')fail('shoreNeighboursFirst');if(q.ready>S.due)fail('shoreTooLate');
  }else if(phase==='inspection'&&['inspect','repair','open','conceal'].includes(action)){
   if(action==='inspect'&&S.checked)return no();
   if(action==='repair'){if(!S.checked||!S.defect)return no();q.ready=st.day+3;if(q.ready>S.due)fail('shoreTooLate');}
   if(action==='open'&&(!S.checked||S.defect))fail('shoreNeedCheck');
   if(action==='conceal'&&(!S.checked||!S.defect))return no();
  }else if(['repay','instalments'].includes(action)&&S.debt>0){
   if(action==='repay')q.cost=S.debt;else if(S.repayment)return no();
  }else return no();
 }else if(quest==='neighbours'&&phase==='offer'&&['compensate','hours','force'].includes(action)&&st.day<=T.due){if(action==='force'&&st.influence<4)fail('shoreInfluence');}
 else if(quest==='aftercare'&&phase==='offer'&&st.day<=T.due&&['repair','certify','abandon'].includes(action)){
  if(action==='repair'){if(!S.damaged)return no();q.ready=st.day+3;if(q.ready>T.due)fail('shoreTooLate');}
  if(action==='certify'&&S.damaged)fail('shoreDamageFirst');
 }else return no();
 for(const[g,n]of Object.entries(q.goods)){q.basis+=HK.goodsValue(st,g,Math.min(n,st.warehouse.stock[g]||0));if((st.warehouse.stock[g]||0)<n)fail('notEnoughCargo');else if(HK.goodQuality(st,g)<q.quality)fail('cityQualityRequired');}
 if(st.money<q.cost)fail('notEnoughMoney');q.preview=HK.breadPreview(st,q.effects);return q;
};
HK.shoreAct=function(st,quest,action,phase){
 const q=HK.shoreQuote(st,quest,action,phase);if(!q.ok)return q;const S=st.shoreStory,before=HK.breadSnapshot(st),r=st.rivals.find(r=>r.id==='bracht');
 if(q.cost)HK.book(st,'politics',-q.cost);for(const[g,n]of Object.entries(q.goods))HK.addStock(st.warehouse.stock,g,-n);
 if(action==='repay'){if(r)r.wealth+=q.cost;S.repaid=(S.repaid||0)+q.cost;S.debt=0;}
 else if(action==='instalments'){S.debt+=40;S.repayment='instalments';S.paidDay=st.day;}
 else if(quest==='main'){
  if(action==='start'){S.phase='survey';S.opened=st.day;S.surveyAt=st.day+2;S.due=st.day+40;S.seed=Math.floor(Math.random()*4294967296)>>>0;}
  if(action==='decline'){S.phase='done';S.finished=st.day;S.ending='declined';}
  if(['quay','bank'].includes(action)){S.site=action;S.phase='finance';S.houses=Object.entries(st.burghers).filter(([,h])=>h.quarter===(action==='quay'?'hafen':'neustadt')).slice(0,3).map(([id])=>id);S.neighbours={phase:'offer',due:st.day+10};HK.shoreMail(st,'neighbours','offer');}
  if(['own','sponsor','parish'].includes(action)){S.funding=action;S.phase='contract';if(action==='sponsor'){r.wealth-=600;S.escrow=600;}}
  if(['guild','cheap'].includes(action)){S.contract=action;S.phase='building';S.buildAt=q.ready;S.escrow-=q.escrowUsed;if(q.escrowUsed){S.debt=720;S.debtDue=st.day+21;}S.defect=action==='cheap'&&HK.intrigueRoll(S)<.4;}
  if(action==='inspect')S.checked=true;
  if(action==='repair'){S.defect=false;S.phase='building';S.buildAt=q.ready;}
  if(['open','conceal'].includes(action)){S.phase='done';S.finished=st.day;S.ending=action;S.built=st.day;S.aftercare={phase:'waiting',at:st.day+14};S.concealed=action==='conceal';HK.shoreMail(st,'main','done');}
 }else if(quest==='neighbours'){
  S.neighbours.phase='done';S.neighbours.finished=st.day;S.neighbours.ending=action;if(action==='hours')S.slow=true;if(action==='force')S.disputed=true;HK.shoreHouseMood(st,action==='force'?-10:5);HK.shoreMail(st,'neighbours','done');
 }else if(quest==='aftercare'){
  if(action==='repair'){S.aftercare.phase='repairing';S.aftercare.ready=q.ready;}
  else{S.aftercare.phase='done';S.aftercare.finished=st.day;S.aftercare.ending=action==='certify'?'certified':'abandoned';if(action==='certify'){S.supportUntil=st.day+180;S.generation=st.family.generation;}HK.shoreMail(st,'aftercare','done');}
 }
 HK.breadEffects(st,q.effects);const entry=HK.shoreRecord(st,quest,action,before,{basis:q.basis,goods:q.goods,escrow:q.escrowUsed});HK.shoreSync(st);HK.scheduleSave?.();return{ok:true,entry};
};
{
 const trade=HK.tradeDayStart;HK.tradeDayStart=function(st){HK.shoreChances(st);return trade(st);};
 const schedule=HK.scheduleArrival;HK.scheduleArrival=function(st,...args){const result=schedule(st,...args);HK.shoreChances(st);return result;};
 const rural=HK.ruralQuote;HK.ruralQuote=function(st,...args){if(!HK.shoreSound(st)||st.shoreStory.site!=='bank')return rural(st,...args);const q=rural({...st,money:Infinity},...args);if(!q.ok)return q;q.freight=Math.max(0,q.freight-2);q.cost=q.goods+q.freight;return st.money<q.cost?{ok:false,msg:'notEnoughMoney'}:q;};
 const support=HK.seatSupportMod;HK.seatSupportMod=st=>support(st)+HK.shoreSupport(st);
 const worth=HK.netWorth;HK.netWorth=st=>worth(st)-(st.shoreStory?.debt||0);
 const post=HK.postActions;HK.postActions=function(st,m){return m.type==='shore'?[]:post(st,m);};
}
