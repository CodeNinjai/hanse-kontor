/* In-game correspondence and durable mission receipts. No real-world messages are sent.
   Read-only views derive progress from the economy; only actions and ticks create mail. */
'use strict';
HK.postInit=function(st) {
  st.post ||= {nextId:1,messages:[],seen:{},journal:[],nextEntry:1,notes:[],nextNote:1,contracts:[]};
  return st.post;
};
HK.postAdd=function(st,token,type,sender,ref={},vars={}) {
  const P=st.post;if(!P || P.seen[token]!==undefined)return;
  // Routine notices stay in the harbour/calendar during the introduction.
  // Mark them observed so finishing the tutorial cannot dump old announcements into the inbox.
  if (HK.introStage(st) < 2 && ['incoming','ship','news','houseSale'].includes(type)) { P.seen[token]=st.day; return; }
  if (type === 'saltOffer' && HK.introStage(st) < 2) return;
  P.seen[token]=st.day;
  P.messages.push({id:P.nextId++,token,type,sender,ref,vars,day:st.day,read:false,archived:false,replies:[]});
  // Retain actionable correspondence ahead of old informational letters.
  if(P.messages.length>160) {
    const index=P.messages.findIndex(m=>!HK.postActions(st,m).length);
    P.messages.splice(index>=0?index:0,1);
  }
};
HK.postSenderName=function(st,sender) {
  const split=sender.indexOf(':'),kind=split<0?sender:sender.slice(0,split),id=sender.slice(split+1);
  if(kind==='giver')return HK.t('giver_'+id);
  if(kind==='person')return HK.personName(st,id);
  if(kind==='rival')return HK.rivalName(id);
  if(kind==='house')return st.burghers[id]?st.burghers[id].family:HK.t('postHouse');
  if(kind==='ship')return st.regularCaptains[id]?.name||HK.t('postCaptain');
  if(sender==='wessel')return 'Jakob Wessel';
  return HK.t('postSender_'+sender);
};
HK.postSync=function(st) {
  if(!st.post)return;
  const P=st.post,add=(...args)=>HK.postAdd(st,...args),S=st.saltStory;
  add('welcome','welcome','factor');
  if(S.phase==='offer')add('salt:offer','saltOffer','wessel');
  if(S.phase==='active') {
    if(!S.rivalDone&&!S.rivalChoice)add('salt:rival','saltRival','rival:kruse');
    if(!S.windDone&&!S.windChoice)add('salt:wind','saltWind','ship:'+S.captainId);
  }
  if(S.phase==='followOffer')add('salt:follow','saltFollow','wessel');
  for(const receipt of S.receipts)add('salt:receipt:'+receipt.leg,'saltReceipt','wessel',{leg:receipt.leg},{money:HK.fmt(receipt.contribution)});
  for(const c of st.contracts.offers)if(c.expires>st.day&&!c.saltStory)add('contract:'+c.id,'contract','giver:'+c.giver,{id:c.id},{good:c.good||'',qty:c.qty||0,reward:c.reward});
  for(const inc of st.incoming)if(HK.tradeArrivalKnown(st,inc)&&inc.tradeLot)add('incoming:'+inc.id,'incoming',inc.sea?'harbour':'gate',{id:inc.id},{origin:inc.origin,good:inc.tradeLot.good,qty:inc.tradeLot.qty,sea:inc.sea});
  for(const v of st.ships) add('ship:'+v.id,'ship',v.captainId?'ship:'+v.captainId:'harbour',{id:v.id},{name:v.name,origin:v.origin});
  for(const e of st.cityLife.stories)if(e.end>=st.day)add('city:'+e.id,'city','town',{id:e.id},{type:e.type});
  for(const n of st.tradePlanning.news)if(n.known&&n.end>=st.day)add('news:'+n.id+':'+(n.resolved?n.happens?'yes':'no':'rumour'),'news','town',{id:n.id},{type:n.type,confidence:n.confidence,confirmed:n.resolved,happens:n.happens,start:n.start,end:n.end});
  for(const ch of st.chains.active)add('chain:'+ch.id+':'+ch.since+':'+ch.stage,'chain',ch.id==='bishop'?'church':'council',{id:ch.id,stage:ch.stage,since:ch.since},{...ch.data});
  for(const h of Object.values(st.burghers)) {
    P.houseDamageCycles||={};const cycle=P.houseDamageCycles[h.id]||={damaged:false,n:0};
    if(h.damaged&&!cycle.damaged)cycle.n++;cycle.damaged=!!h.damaged;
    if(HK.burgherForSale(st,h))add('house:'+h.id+':sale:'+h.sale.until,'houseSale','house:'+h.id,{id:h.id,until:h.sale.until},{price:h.sale.price});
    if(h.owner==='player'&&h.damaged)add('house:'+h.id+':repair:'+cycle.n,'houseRepair','house:'+h.id,{id:h.id,cycle:cycle.n});
    if(h.owner==='player'&&h.raisedUntil>st.day&&h.mood<40)add('house:'+h.id+':rent:'+h.raisedUntil,'houseRent','house:'+h.id,{id:h.id,until:h.raisedUntil});
  }
  if(st.family.offer)add('family:'+st.family.offer.name+':'+st.family.offer.family+':'+st.family.nextOffer,'family','family',{name:st.family.offer.name,family:st.family.offer.family,offerId:st.family.nextOffer});
  // Receipt-level identifiers are monotonic; compact old source tokens without duplicating live letters.
  if(Object.keys(P.seen).length>600) {
    const live=new Set(P.messages.map(m=>m.token));
    for(const [token,day]of Object.entries(P.seen))if(day<st.day-90&&!live.has(token)&&!token.startsWith('salt:')&&token!=='welcome')delete P.seen[token];
  }
};
HK.postActions=function(st,m) {
  if(st.gameOver || m.replies.length)return [];
  const s=st.saltStory,c=st.contracts.offers.find(c=>c.id===m.ref.id&&c.expires>st.day),h=st.burghers[m.ref.id];
  if(m.type==='saltOffer'&&s.phase==='offer')return [{id:'saltstart',label:'saltStart'}];
  if(m.type==='saltRival'&&!s.rivalDone&&!s.rivalChoice&&s.phase==='active')return [{id:'pact',label:'saltChoice_pact',cost:120}];
  if(m.type==='saltWind'&&!s.windDone&&!s.windChoice&&s.phase==='active'&&HK.saltIncoming(st))return [{id:'pilot',label:'saltChoice_pilot',cost:90}];
  if(m.type==='saltFollow'&&s.phase==='followOffer')return [{id:'follow',label:'saltFollowAccept'},{id:'declineFollow',label:'saltFollowDecline'}];
  if(m.type==='contract'&&c)return [{id:'accept',label:'tradePromise'}];
  if(m.type==='chain') {
    const ch=st.chains.active.find(ch=>ch.id===m.ref.id&&ch.stage===m.ref.stage&&ch.since===m.ref.since);
    if(ch){const vars={...ch.data,good:ch.data.good?HK.goodName(ch.data.good):'',qty:ch.data.qty||'',price:ch.data.price||'',cost:HK.fmt((ch.data.qty||0)*(ch.data.price||0))};if(typeof vars.tithe==='number')vars.tithe=HK.fmt(vars.tithe);
      return (HK.CHAINS[ch.id].stages[ch.stage].choices||[]).map(choice=>({id:'chain:'+choice,label:'ch_'+ch.id+'_'+ch.stage+'_'+choice,hint:'chh_'+ch.id+'_'+ch.stage+'_'+choice,vars}));}
  }
  if(m.type==='city') {
    const e=st.cityLife.stories.find(e=>e.id===m.ref.id);
    if(e&&!e.choice&&st.day<=e.respondBy)return [...HK.CITY_STORIES[e.type].choices,{id:'pass'}].map(ch=>({id:'city:'+ch.id,label:'cityChoice_'+ch.id,cost:ch.cost||0,goods:ch.goods||{},terms:ch}));
  }
  if(m.type==='houseSale'&&h&&HK.burgherForSale(st,h)&&h.sale.until===m.ref.until)return [{id:'buyhouse',label:'postBuyHouse',cost:h.sale.price}];
  if(['houseRepair','contact'].includes(m.type)&&h?.owner==='player'&&h.damaged&&(m.type==='contact'||m.ref.cycle===st.post.houseDamageCycles?.[h.id]?.n))return [{id:'repair',label:'postRepair',cost:HK.CONST.BURGHER_REPAIR}];
  if(['houseRent','contact'].includes(m.type)&&h?.owner==='player'&&(m.type==='contact'||h.raisedUntil===m.ref.until)&&h.raisedUntil>st.day)return [{id:'ease',label:'postEaseRent'}];
  if(m.type==='contact'&&m.sender==='church')return [{id:'donate',label:'postDonate',cost:100}];
  if(m.type==='contact'&&m.sender.startsWith('person:'))return [{id:'gift',label:'postGift',cost:HK.giftCost(st,m.sender.slice(7))}];
  if(m.type==='family'&&st.family.offer?.name===m.ref.name&&st.family.offer?.family===m.ref.family&&st.family.nextOffer===m.ref.offerId)return [{id:'marry',label:'offerAccept',vars:{dowry:HK.fmt(st.family.offer.dowry)},cost:0},{id:'declineMarriage',label:'offerDecline'}];
  return [];
};
HK.postReply=function(st,id,action) {
  const m=st.post.messages.find(m=>m.id===id),a=m&&HK.postActions(st,m).find(a=>a.id===action);
  if(!a)return {ok:false,msg:'postGone'};
  let r;
  if(action==='saltstart')r=HK.startSaltStory(st);
  else if(['pact','pilot'].includes(action))r=HK.saltChoose(st,action);
  else if(action==='follow'||action==='declineFollow')r=HK.saltFollow(st,action==='follow');
  else if(action==='accept')r=HK.acceptContract(st,m.ref.id);
  else if(action.startsWith('chain:'))r=HK.decide(st,m.ref.id,action.slice(6));
  else if(action.startsWith('city:'))r=HK.respondCityStory(st,m.ref.id,action.slice(5));
  else if(action==='buyhouse')r=HK.buyBurgher(st,m.ref.id);
  else if(action==='repair')r=HK.repairBurgher(st,m.ref.id);
  else if(action==='ease')r=HK.easeBurgherRent(st,m.ref.id);
  else if(action==='donate')r=HK.donate(st,100);
  else if(action==='gift')r=HK.gift(st,m.sender.slice(7));
  else if(action==='marry'||action==='declineMarriage')r=HK.answerOffer(st,action==='marry');
  if(!r?.ok)return r||{ok:false,msg:'postGone'};
  m.read=true;m.replies.push({day:st.day,action,label:a.label,vars:a.vars||{},cost:a.cost||0});
  HK.log(st,'postReplied',{sender:HK.postSenderName(st,m.sender),choice:HK.t(a.label,a.vars)},'info');
  HK.postAdd(st,'reply:'+m.id,'answer',m.sender,{message:m.id},{action:a.label});
  HK.scheduleSave?.();return r;
};
HK.postRead=function(st,id) {const m=st.post.messages.find(m=>m.id===id);if(!m)return {ok:false};m.read=true;HK.scheduleSave?.();return {ok:true};};
HK.postArchive=function(st,id) {const m=st.post.messages.find(m=>m.id===id);if(!m)return {ok:false};m.archived=!m.archived;HK.scheduleSave?.();return {ok:true};};
HK.postContact=function(st,sender) {
  if(st.gameOver || !HK.postContacts(st).some(c=>c.sender===sender))return {ok:false,msg:'postGone'};
  // One inquiry per correspondent and game day, with no artificial money or goods reward.
  const token='contact:'+sender+':'+st.day;if(st.post.seen[token]!==undefined)return {ok:false,msg:'postContactAgain'};
  const ref=sender.startsWith('house:')?{id:sender.slice(6)}:{};
  HK.postAdd(st,token,'contact',sender,ref);HK.postSync(st);HK.scheduleSave?.();return {ok:true,id:st.post.messages.find(m=>m.token===token).id};
};
HK.postContacts=function(st) {
  return [{sender:'council',label:HK.t('postSender_council')},{sender:'church',label:HK.t('postSender_church')},
    ...HK.PERSONS.map(p=>({sender:'person:'+p.id,label:HK.personName(st,p.id)})),
    ...st.ships.filter(v=>v.captainId).map(v=>({sender:'ship:'+v.captainId,label:v.captain+' · '+v.name})),
    ...Object.values(st.burghers).map(h=>({sender:'house:'+h.id,label:h.family+' · '+HK.burgherName(h)}))];
};
HK.journalNote=function(st,body) {
  if(typeof body!=='string'||!body.trim()||body.length>1200)return {ok:false,msg:'journalNoteInvalid'};
  if(st.post.notes.length>=100)return {ok:false,msg:'journalNoteFull'};
  st.post.notes.push({id:st.post.nextNote++,day:st.day,body:body.trim()});HK.scheduleSave?.();return {ok:true};
};
HK.journalCategory=function(e) {
  if(/^(salt|contract|chapter|chain|lehrgang|postReplied)/.test(e.key))return 'missions';
  if(/^(city|ev_|bs_|fd_|up_|vi_|pl_)/.test(e.key))return 'city';
  if(/(ship|Ship|voyage|Voyage|Arrival|hansetag|tradeNews)/.test(e.key))return 'world';
  if(/(burgher|house|House|rival|Rival|marri|offer|family|succession|person|gift)/.test(e.key))return 'people';
  return 'trade';
};
HK.journalRecord=function(st,e) {
  if(!st.post||e.journalId)return;
  e.journalId=st.post.nextEntry++;
  if(['bad','event','good'].includes(e.kind)||/^(salt|chapter|contract|chain|tradeAdvance|postReplied)/.test(e.key)) {
    st.post.journal.push({...e,category:HK.journalCategory(e)});
    if(st.post.journal.length>400)st.post.journal.shift();
  }
};
const postLog=HK.log;
HK.log=function(st,...args){postLog(st,...args);HK.journalRecord(st,st.log[0]);};
for(const [method,status]of [['completeContract','done'],['failContract','failed']]) {
  const previous=HK[method];HK[method]=function(st,c) {
    const was=st.contracts.active.includes(c);const r=previous(st,c);
    if(was&&st.post&&!st.contracts.active.includes(c)) {
      st.post.contracts.push({...c,status,finished:st.day});if(st.post.contracts.length>100)st.post.contracts.shift();
    }return r;
  };
}
const postEnterStage=HK.enterStage;
HK.enterStage=function(st,ch,stage){ch.steps||=[];ch.steps.push({stage,day:st.day});const r=postEnterStage(st,ch,stage);if(HK.CHAINS[ch.id].stages[stage].end){const h=st.chains.history.at(-1);if(h?.id===ch.id)h.steps=ch.steps.slice();}return r;};
function preparePost(st){HK.postInit(st);for(const m of st.post.messages)if(m.type==='incoming'){const sea=st.incoming.find(i=>i.id===m.ref.id)?.sea??m.vars.sea??HK.ORIGIN[m.vars.origin]?.sea;if(typeof sea==='boolean'){m.vars.sea=sea;m.sender=sea?'harbour':'gate';}}for(const e of st.log.slice().reverse())HK.journalRecord(st,e);HK.postSync(st);}
HK.newGameHooks.push(preparePost);HK.migrateHooks.push(preparePost);
const postDayEnd=HK.cityDayEnd;
HK.cityDayEnd=function(st){postDayEnd(st);HK.postSync(st);};
// Synchronise once after nested actions have finished changing their full state.
let postActionDepth=0;
for(const method of ['startSaltStory','saltChoose','saltDeliver','saltFollow','acceptContract','deliverContract','completeContract','failContract','reserveTradeSupply','dockShip','dockCaravan','buyRumor','buyTradeInfo','startChain','enterStage','decide','answerOffer','buyBurgher','repairBurgher','easeBurgherRent','respondCityStory','finishChapter']) {
  const previous=HK[method];HK[method]=function(st,...args) {
    postActionDepth++;let r;
    try{r=previous(st,...args);return r;}finally{postActionDepth--;if(!postActionDepth&&r!==false&&r?.ok!==false)HK.postSync(st);}
  };
}
