/* Connected non-delivery stories. Quotes are pure; only explicit actions and
   due dates change state. Actual property/project actions retain their rules. */
'use strict';
HK.intrigueInit=function(st){
 st.intrigue ||= {version:1,monopoly:{phase:'locked',choices:{},evidence:0,support:0,history:[],cash:0},property:{phase:'locked',history:[],cash:0},witness:{phase:'locked',history:[],cash:0},pact:false};
 return st.intrigue;
};
HK.newGameHooks.push(HK.intrigueInit);HK.migrateHooks.push(HK.intrigueInit);
HK.INTRIGUE_STATS=['rep','influence','piety','suspicion'];
HK.intrigueSnapshot=st=>Object.fromEntries(['money',...HK.INTRIGUE_STATS,...HK.FACTION_IDS].map(k=>[k,HK.FACTION_IDS.includes(k)?st.factions[k]:st[k]]));
HK.intrigueEffects=function(st,e){for(const [k,v]of Object.entries(e||{})){if(HK.FACTION_IDS.includes(k))HK.fac(st,k,v);else if(HK.INTRIGUE_STATS.includes(k))st[k]=HK.clamp(st[k]+v,0,k==='influence'?Infinity:100);}};
HK.intrigueRecord=function(st,story,action,before,extra={}){
 const S=st.intrigue[story],after=HK.intrigueSnapshot(st),delta={};
 for(const k of Object.keys(after))if(Math.abs(after[k]-before[k])>.00001)delta[k]=after[k]-before[k];
 const entry={action,day:st.day,author:st.name,generation:st.family.generation,delta,...extra};S.history.push(entry);S.cash+=delta.money||0;
 HK.log(st,'intrigueDecision',{story:HK.t('ig_title_'+story),choice:HK.t('ig_action_'+action)},'event');
 HK.recordDeed(st,'intrigue',story+':'+S.history.length,{story:HK.t('ig_title_'+story),choice:HK.t('ig_action_'+action)});
 return entry;
};
HK.intrigueMail=function(st,story){const S=st.intrigue[story];HK.postAdd(st,'intrigue:'+story+':'+S.phase,'intrigue',story==='witness'?'person:divekeeper':story==='property'?'person:guild':'rival:kruse',{story,phase:S.phase},{story:HK.t('ig_title_'+story)});};
HK.intrigueFinish=function(st,story,ending){const S=st.intrigue[story];S.phase='done';S.pending=null;S.ending=ending;S.finished=st.day;HK.intrigueMail(st,story);};
HK.intrigueBacked=st=>{const P=st.intrigue.property,h=st.houses[P.house];return P.ending==='keep'&&h?.owner==='player'&&h.level>=2&&!h.damaged?1:0;};
HK.intrigueRoll=function(S){S.seed=(Math.imul(S.seed,1664525)+1013904223)>>>0;return S.seed/4294967296;};
HK.intrigueWitness=function(st){const W=st.intrigue.witness;if(W.phase==='locked'){W.phase='pending';W.appear=st.day+4;W.severity=1;}else if(['pending','offer'].includes(W.phase))W.severity=Math.min(3,W.severity+1);};
HK.intrigueSync=function(st){
 const I=HK.intrigueInit(st),M=I.monopoly,P=I.property,W=I.witness;
 if(st.gameOver)return;
 const clothEnded=['done','failed'].includes(st.tradingStories?.cloth.phase);
 if(M.phase==='locked'&&(clothEnded||st.guildMember&&st.rep>=30)){M.phase='offer';HK.intrigueMail(st,'monopoly');}
 if(P.phase==='locked'&&(st.day>=5||clothEnded)){
  const h=st.houses.find(h=>h.owner==='player')||st.houses.find(h=>h.owner==='npc');
  if(h){P.phase='offer';P.house=h.id;HK.intrigueMail(st,'property');}
 }
 if(M.pending&&st.day>=M.pending){M.pending=null;M.evidence+=3;HK.log(st,'igAuditReady',{},'good');HK.postAdd(st,'intrigue:audit','intrigue','person:weighmaster',{story:'monopoly',phase:'preparing'});}
 if(M.phase==='preparing'&&st.day>M.due){const before=HK.intrigueSnapshot(st);HK.intrigueEffects(st,{rep:-1,kaufleute:-2});HK.intrigueFinish(st,'monopoly','expired');HK.intrigueRecord(st,'monopoly','expired',before);}
 if(['acquire','renovate','use'].includes(P.phase)){
  const h=st.houses[P.house];
  if(P.phase==='acquire'&&h?.owner==='player'){P.phase=h.level>=2&&!h.damaged?'use':'renovate';P.acquired=st.day;HK.intrigueMail(st,'property');}
  else if(P.phase!=='acquire'&&h?.owner!=='player'){HK.intrigueFinish(st,'property','soldOutside');}
  else if(h?.owner==='player'&&h.level>=2&&!h.damaged&&P.phase==='renovate'){P.phase='use';HK.intrigueMail(st,'property');}
  else if(P.phase==='use'&&h?.damaged){P.phase='renovate';}
 }
 if(W.phase==='pending'&&st.day>=W.appear){W.phase='offer';W.due=st.day+7;HK.intrigueMail(st,'witness');}
 if(W.phase==='offer'&&st.day>W.due){const before=HK.intrigueSnapshot(st);HK.intrigueEffects(st,HK.INTRIGUE_LEAK);HK.intrigueFinish(st,'witness','exposed');HK.intrigueRecord(st,'witness','exposed',before);}
};
HK.tickHooks.push(HK.intrigueSync);HK.migrateHooks.push(HK.intrigueSync);
HK.INTRIGUE_LEAK={rep:-7,influence:-6,suspicion:14,patrizier:-5,kaufleute:-6,zuenfte:-3,kirche:-4};
HK.INTRIGUE_PREP={
 recover:{group:'recovery',cost:180,effects:{rep:1,kaufleute:1},art:'bank'},
 audit:{group:'evidence',cost:120,effects:{rep:1,kaufleute:2},art:'bank'},
 bribe:{group:'evidence',cost:250,effects:{influence:2,piety:-2,suspicion:5},art:'bank',dirty:true},
 steal:{group:'evidence',cost:100,effects:{piety:-3,suspicion:8},art:'dive',dirty:true,chance:.7,failed:{rep:-3,suspicion:8,patrizier:-3}},
 assembly:{group:'support',cost:180,effects:{influence:6,kaufleute:3,zuenfte:2},art:'guild'},
 persuade:{group:'support',cost:0,effects:{influence:-6,patrizier:3},art:'townhall'},
 build:{group:'support',cost:0,effects:{},art:'townhall'},
 mediate:{group:'pressure',cost:80,effects:{influence:2,piety:1,kaufleute:2},art:'church'},
 forge:{group:'pressure',cost:150,effects:{piety:-3,suspicion:10},art:'bank',dirty:true,chance:.8,failed:{rep:-4,influence:-3,suspicion:7,patrizier:-4}},
 sabotage:{group:'pressure',cost:300,effects:{rep:-2,piety:-4,suspicion:12,kaufleute:-3,zuenfte:-2},art:'warehouse',dirty:true,chance:.65,failed:{rep:-3,suspicion:8,patrizier:-3}}
};
HK.intrigueQuote=function(st,story,action,phase){
 const I=st.intrigue,S=I?.[story],M=I?.monopoly;
 const no=msg=>({ok:false,msg:msg||'igGone'});
 if(st.gameOver||!S||S.phase!==phase)return no();
 if(story==='monopoly'&&S.phase==='preparing'&&st.day>S.due)return no();
 const q={ok:true,story,action,phase,cost:0,income:0,effects:{},preview:{},art:'guild'};
 if(action==='start'&&S.phase==='offer'&&story!=='witness'){}
 else if(action==='withdraw'&&['offer','preparing','acquire','renovate','use'].includes(S.phase)&&story!=='witness'){}
 else if(story==='monopoly'&&S.phase==='preparing'){
  const d=HK.INTRIGUE_PREP[action];
  if(d){
   if(S.choices[d.group])return no();if(action==='recover'&&(!S.choices.evidence||S.evidence>=2||S.pending))return no();Object.assign(q,d);q.effects={...d.effects};
   if(action==='persuade'&&st.influence<6)return no('igNeedInfluence6');
   if(action==='build'){
    const project=HK.PROJECTS.filter(p=>!st.town.projects[p.id]).sort((a,b)=>a.cost-b.cost)[0];if(!project)return no('igNoProject');
    q.project=project.id;q.cost=project.cost;q.preview={rep:project.rep,influence:10,patrizier:4,kaufleute:4+(project.id==='harbour'?4:0),zuenfte:4+(project.id==='well'?3:0),kirche:4};
   }
  }else if(['pact','lease'].includes(action)){
   if(S.evidence<2||S.support+HK.intrigueBacked(st)<2)return no('igNeedCase');
   if(action==='pact'){
    if(HK.law(st,'monopoly')!=='none')return no('igExistingRight');
    if(st.influence<10)return no('igNeedInfluence10');
    q.cost=800;q.effects={rep:4,influence:-10,piety:1,kaufleute:8,zuenfte:6,patrizier:-4,kirche:2};
   }else{
    const reasons=HK.monopolPachtGruende(st);if(reasons.length)return no(reasons[0]);
    q.cost=HK.CONST.PACHT_PREIS;q.preview={influence:-HK.CONST.PACHT_EINFLUSS,kaufleute:-8,zuenfte:-4,patrizier:2};q.effects={rep:2,piety:-2};
   }
  }else if(action==='sellout'){
   const r=st.rivals.find(r=>r.id==='kruse');if(!r||r.wealth<1)return no('igNoRivalMoney');
   q.income=Math.min(600,Math.floor(r.wealth));q.effects={rep:-3,influence:-2,piety:-3,suspicion:6,kaufleute:-5,zuenfte:-3};q.dirty=true;
  }else return no();
 }else if(story==='property'){
  const h=st.houses[S.house];if(!h)return no();q.art='house';
  if(action==='buy'&&S.phase==='acquire'){
   const price=HK.housePrice(st,h);if(h.owner==='player'||price===null)return no('rivalWontSell');q.cost=price;q.preview={patrizier:1};
  }else if(action==='retarget'&&S.phase==='acquire'){
   const h=st.houses.find(h=>h.id!==S.house&&h.owner==='npc');if(!h)return no('igNoHouse');q.house=h.id;
  }else if(action==='repair'&&S.phase==='renovate'&&h.owner==='player'&&h.damaged)q.cost=800;
  else if(action==='upgrade'&&S.phase==='renovate'&&h.owner==='player'&&!h.damaged&&h.level<2)q.cost=HK.CONST.HOUSE_UPGRADE;
  else if(action==='keep'&&S.phase==='use'&&h.owner==='player'&&h.level>=2&&!h.damaged)q.effects={rep:2,influence:3,kaufleute:3,zuenfte:2};
  else if(action==='sell'&&['use','renovate'].includes(S.phase)&&h.owner==='player'){
   q.income=Math.round(h.price*(.7+h.level*.15));q.effects=S.phase==='use'?{influence:2,kaufleute:2}:{rep:-1,zuenfte:-2};
  }else return no();
 }else if(story==='witness'&&S.phase==='offer'){
  if(st.day>S.due)return no();q.art='dive';
  if(action==='pay'){q.cost=200+S.severity*150;q.effects={piety:-1,suspicion:-3};}
  else if(action==='confess'){q.cost=300+S.severity*150;q.effects={rep:-3,influence:-4,piety:5,suspicion:-6,kirche:4,patrizier:-2,kaufleute:-2};}
  else if(action==='expose')q.effects={...HK.INTRIGUE_LEAK};
  else return no();
 }else if(story==='monopoly'&&S.phase==='done'&&action==='breakpact'&&I.pact)q.effects={rep:-6,influence:-3,kaufleute:-10,zuenfte:-5};
 else return no();
 q.preview={...q.preview};for(const [k,v]of Object.entries(q.effects))q.preview[k]=(q.preview[k]||0)+v;
 // Report the actual bounded change, not an impossible gain beyond a cap.
 for(const k of Object.keys(q.preview)){const n=HK.FACTION_IDS.includes(k)?st.factions[k]:st[k];q.preview[k]=HK.clamp(n+q.preview[k],0,k==='influence'?Infinity:100)-n;}
 if(q.failed){q.failurePreview={};for(const k of new Set([...Object.keys(q.effects),...Object.keys(q.failed)])){const n=HK.FACTION_IDS.includes(k)?st.factions[k]:st[k],max=k==='influence'?Infinity:100;q.failurePreview[k]=HK.clamp(HK.clamp(n+(q.failed[k]||0),0,max)+(q.effects[k]||0),0,max)-n;}}
 if(st.money<q.cost)return{...q,ok:false,msg:'notEnoughMoney'};
 return q;
};
HK.intrigueAct=function(st,story,action,phase){
 const q=HK.intrigueQuote(st,story,action,phase);if(!q.ok)return q;
 const I=st.intrigue,S=I[story],M=I.monopoly,before=HK.intrigueSnapshot(st),r=st.rivals.find(r=>r.id==='kruse');
 let result={ok:true},success=true,handledMoney=false;
 if(action==='start'){
  S.started=st.day;
  if(story==='monopoly'){S.phase='preparing';S.due=st.day+35;S.seed=Math.floor(Math.random()*4294967296)>>>0;S.document={owner:'kruse',authentic:true};S.support=Math.min(1,Math.max(0,Math.floor((st.tradingStories?.cloth.buyerTrust||0)/2)));}
  else S.phase='acquire';
 }else if(action==='withdraw')HK.intrigueFinish(st,story,'withdrawn');
 else if(story==='property'){
  if(action==='retarget')S.house=q.house;
  else if(['buy','repair','upgrade','sell'].includes(action)){
   const method={buy:'buyHouse',repair:'repairHouse',upgrade:'upgradeHouse',sell:'sellHouse'}[action];
   result=HK[method](st,S.house);if(!result.ok)return result;handledMoney=true;if(result.deferred)result.work.story=story;
   if(action==='sell')HK.intrigueFinish(st,story,'sold');
  }else if(action==='keep')HK.intrigueFinish(st,story,'keep');
 }else if(story==='monopoly'){
  if(q.group){
   S.choices[q.group]=action;
   if(q.chance)success=HK.intrigueRoll(S)<q.chance;
   if(action==='audit'||action==='recover')S.pending=st.day+2;
   if(action==='bribe'){S.evidence+=2;st.persons.weighmaster.loyalty=HK.clamp(st.persons.weighmaster.loyalty+8,0,100);}
   if(action==='steal'&&success){S.evidence+=3;S.document.owner='player';}
   if(action==='assembly')S.support+=2;
   if(action==='persuade'){S.support+=2;st.persons.mayor.loyalty=HK.clamp(st.persons.mayor.loyalty+5,0,100);}
   if(action==='build'){result=HK.fundProject(st,q.project);if(!result.ok){delete S.choices[q.group];return result;}handledMoney=true;if(result.deferred){S.construction=result.work.orderId;result.work.story=story;}else S.support+=3;}
   if(action==='mediate'){S.support++;if(r)r.attitude=HK.clamp(r.attitude+8,-100,100);}
   if(action==='forge'&&success)S.support+=2;
   if(action==='sabotage'&&success&&r){r.wealth=Math.max(0,r.wealth-Math.min(800,r.wealth));r.intrigueBlockedUntil=st.day+10;S.support++;}
   if(!success)HK.intrigueEffects(st,q.failed);
  }else if(action==='pact'){I.pact=true;I.pactSince=st.day;HK.intrigueFinish(st,story,'pact');}
  else if(action==='lease'){result=HK.pachteMonopol(st,'cloth');if(!result.ok)return result;handledMoney=true;HK.intrigueFinish(st,story,'lease');}
  else if(action==='sellout'){r.wealth-=q.income;r.attitude=HK.clamp(r.attitude+15,-100,100);HK.intrigueFinish(st,story,'sellout');}
  else if(action==='breakpact'){I.pact=false;I.pactBroken=st.day;}
 }else if(story==='witness')HK.intrigueFinish(st,story,action==='expose'?'exposed':action);
 if(!handledMoney){if(q.cost)HK.book(st,story==='property'?'investments':'politics',-q.cost);if(q.income)HK.book(st,'politics',q.income);}
 HK.intrigueEffects(st,q.effects);
 if(q.dirty)HK.intrigueWitness(st);
 const entry=HK.intrigueRecord(st,story,action,before,{success});
 HK.intrigueSync(st);HK.intrigueMail(st,story);HK.scheduleSave?.();return{ok:true,success,entry};
};
// The guild pledge is a genuine alternative mandate, with a visible way out.
{
 const support=HK.seatSupportMod;HK.seatSupportMod=st=>support(st)+(st.intrigue?.pact?1:0);
 const conds=HK.TITLE.merchant.conds;HK.TITLE.merchant.conds=st=>conds(st).map(row=>row[0]==='cond_monopoly'?['igTradeMandate',row[1]||st.intrigue?.pact?1:0,1]:row);
 const propose=HK.propose;HK.propose=function(st,id,value){if(st.intrigue?.pact&&id==='monopoly'&&value!=='none')return{ok:false,msg:'igPactBlocks'};return propose(st,id,value);};
 const reasons=HK.monopolPachtGruende;HK.monopolPachtGruende=st=>st.intrigue?.pact?['igPactBlocks',...reasons(st)]:reasons(st);
 for(const method of ['rivalBuy','rivalMotion','rivalHostile']){const original=HK[method];HK[method]=function(st,r,...args){if(r.intrigueBlockedUntil>st.day)return false;return original(st,r,...args);};}
 const acts=HK.postActions;HK.postActions=function(st,m){if(m.type==='intrigue')return[];return acts(st,m);};
 // Property changes performed on the normal building page are observed too.
 for(const method of ['buyHouse','repairHouse','upgradeHouse','sellHouse']){const original=HK[method];HK[method]=function(st,...args){const result=original(st,...args);if(result.ok)HK.intrigueSync(st);return result;};}
}
