/* Requests belong to existing residents. Decisions and witnesses persist across succession. */
'use strict';
HK.memoryInit=function(st){st.memory ||= {version:1,nextPetition:st.day+12,nextId:1,petitions:[],deeds:[],nextDeed:1};return st.memory;};
HK.newGameHooks.push(HK.memoryInit);HK.migrateHooks.push(HK.memoryInit);
HK.recordDeed=function(st,type,source,vars={},person=null){
 const M=HK.memoryInit(st);if(M.deeds.some(d=>d.source===source))return;
 const d={id:M.nextDeed++,source,type,vars,person,day:st.day,author:st.name,generation:st.family?.generation||1};M.deeds.push(d);M.deeds=M.deeds.slice(-160);
 HK.log(st,'memoryRecorded',{name:d.author,event:HK.t('deed_'+type,vars)},'info');return d;
};
HK.PETITIONS={
 food:{job:'citizen',good:'grain',qty:4,follow:'introduction'},
 nets:{job:'fisher',good:'hemp',qty:3,follow:'arrival'},
 tools:{job:'porter',good:'tools',qty:2,follow:'introduction'},
 warmth:{job:'beggar',good:'timber',qty:4,follow:'arrival'},
};
HK.makePetition=function(st,type){
 const def=HK.PETITIONS[type],M=HK.memoryInit(st);if(!def||M.petitions.some(p=>p.status==='available'))return null;
 const residents=Object.values(st.population.people).filter(p=>!p.guest&&!p.contact&&p.type!=='child'&&p.job===def.job&&!M.petitions.some(r=>r.person===p.id));
 const person=residents[0];if(!person)return null;
 const p={id:M.nextId++,person:person.id,name:HK.citizenName(st,person),home:person.home,type,good:def.good,qty:def.qty,day:st.day,due:st.day+8,status:'available',cost:Math.ceil(HK.GOOD[def.good].base*def.qty*1.1)};
 M.petitions.push(p);M.petitions=M.petitions.slice(-40);HK.postAdd(st,'petition:'+p.id,'petition','citizen:'+p.person,{petition:p.id,name:p.name},{name:p.name,good:HK.goodName(p.good),qty:p.qty,date:HK.fmtDate(p.due),cost:p.cost});return p;
};
HK.petitionQuote=function(st,id,choice){
 const p=st.memory?.petitions.find(p=>p.id===id);if(st.gameOver||!p||p.status!=='available'||st.day>p.due||!['goods','fund','decline'].includes(choice))return{ok:false,msg:'postGone'};
 if(choice==='goods'&&(st.warehouse.stock[p.good]||0)<p.qty)return{ok:false,msg:'notEnoughCargo'};
 if(choice==='fund'&&st.money<p.cost)return{ok:false,msg:'notEnoughMoney'};
 // Funding buys the requested finite town stock on the resident's behalf.
 if(choice==='fund'&&(st.town.stock[p.good]||0)<p.qty)return{ok:false,msg:'notEnoughStock'};
 return {ok:true,p};
};
HK.answerPetition=function(st,id,choice){
 const q=HK.petitionQuote(st,id,choice);if(!q.ok)return q;const p=q.p;
 if(choice==='goods')HK.addStock(st.warehouse.stock,p.good,-p.qty);
 if(choice==='fund'){HK.book(st,'cityStories',-p.cost);HK.addStock(st.town.stock,p.good,-p.qty);}
 p.choice=choice;p.finished=st.day;p.status=choice==='decline'?'archived':'done';p.author=st.name;p.generation=st.family.generation;
 if(choice!=='decline'){p.followAt=st.day+7;st.rep=HK.clamp(st.rep+1,0,100);}
 HK.recordDeed(st,choice==='decline'?'refused':'helped','petition:'+p.id,{name:p.name,good:HK.goodName(p.good),qty:p.qty},p.person);
 const letter=st.post.messages.find(m=>m.type==='petition'&&m.ref.petition===p.id);if(letter){letter.read=true;letter.replies.push({day:st.day,action:choice,label:'petition_'+choice,vars:{},cost:choice==='fund'?p.cost:0});}
 HK.scheduleSave?.();return{ok:true};
};
HK.memorySupport=function(st){return st.memory?.petitions.filter(p=>p.followDone&&p.status==='done'&&p.generation===st.family.generation&&st.day-p.finished<=180)||[];};
HK.memoryObjections=st=>(st.memory?.deeds||[]).filter(d=>d.type==='contractFailed'&&d.generation===st.family.generation&&st.day-d.day<=180);
HK.memoryConversation=function(st,id){
 const person=st.population.people[id],M=st.memory;if(!person||!M||st.day-(person.lastMemoryDay??-999)<30)return null;
 const d=M.deeds.slice().reverse().find(d=>d.person===id)||M.deeds.slice().reverse().find(d=>['cityHelp','contractDone','contractFailed'].includes(d.type)&&st.day-d.day<90);
 if(!d)return null;person.lastMemoryDay=st.day;person.lastMemory=d.id;return{key:'memorySaid',vars:{name:d.author,event:HK.t('deed_'+d.type,d.vars),date:HK.fmtDate(d.day)}};
};
{
 const support=HK.seatSupportMod;HK.seatSupportMod=st=>support(st)+(HK.memorySupport(st).length?1:0)-(HK.memoryObjections(st).length>=2?1:0);
 const complete=HK.completeContract;HK.completeContract=function(st,c){const active=st.contracts.active.includes(c),r=complete(st,c);if(active&&!st.contracts.active.includes(c))HK.recordDeed(st,'contractDone','contract:'+c.id,{giver:HK.t('giver_'+c.giver),reward:c.reward},null);return r;};
 const fail=HK.failContract;HK.failContract=function(st,c){const active=st.contracts.active.includes(c),r=fail(st,c);if(active&&!st.contracts.active.includes(c))HK.recordDeed(st,'contractFailed','contract:'+c.id,{giver:HK.t('giver_'+c.giver)},null);return r;};
 const city=HK.respondCityStory;HK.respondCityStory=function(st,id,choice){const e=st.cityLife.stories.find(e=>e.id===id),r=city(st,id,choice);if(r.ok&&choice!=='pass')HK.recordDeed(st,'cityHelp','city:'+id,{event:HK.t('cityTitle_'+e.type),choice:HK.t('cityChoice_'+choice)});return r;};
 const actions=HK.postActions;HK.postActions=function(st,m){if(m.type!=='petition')return actions(st,m);const p=st.memory?.petitions.find(p=>p.id===m.ref.petition);if(st.gameOver||!p||p.status!=='available'||st.day>p.due)return[];return[{id:'petition:goods',label:'petition_goods',goods:{[p.good]:p.qty}},{id:'petition:fund',label:'petition_fund',cost:p.cost},{id:'petition:decline',label:'petition_decline'}];};
 const reply=HK.postReply;HK.postReply=function(st,id,choice){const m=st.post.messages.find(m=>m.id===id);if(choice.startsWith('petition:')&&m?.type==='petition')return HK.answerPetition(st,m.ref.petition,choice.slice(9));return reply(st,id,choice);};
 const sender=HK.postSenderName;HK.postSenderName=function(st,id){if(id.startsWith('citizen:')){const p=st.population.people[id.slice(8)];return p?HK.citizenName(st,p):HK.t('postHouse');}return sender(st,id);};
}
HK.tickHooks.push(st=>{
 const M=HK.memoryInit(st);
 for(const p of M.petitions){
  if(p.status==='available'&&st.day>p.due){p.status='archived';p.choice='unanswered';p.finished=st.day;HK.recordDeed(st,'unanswered','petition:'+p.id,{name:p.name},p.person);}
  if(p.status==='done'&&!p.followDone&&st.day>=p.followAt){
   p.followDone=st.day;const def=HK.PETITIONS[p.type],arrival=def.follow==='arrival'&&st.incoming.find(i=>!HK.tradeArrivalKnown(st,i));
   if(arrival){arrival.known=true;p.follow={kind:'arrival',origin:arrival.origin,eta:st.day+arrival.days};}
   else {const pid=p.type==='tools'?'c_witten':'c_rode';st.persons[pid].loyalty=HK.clamp(st.persons[pid].loyalty+2,0,100);p.follow={kind:'introduction',pid,name:HK.personName(st,pid)};}
   HK.postAdd(st,'petition-thanks:'+p.id,'petitionThanks','citizen:'+p.person,{petition:p.id,name:p.name},{name:p.name});
  }
 }
 if(st.day>=M.nextPetition){const types=Object.keys(HK.PETITIONS);HK.makePetition(st,types[(M.nextId-1)%types.length]);M.nextPetition=st.day+60;}
});
Object.assign(HK.I18N.de,{postSubject_petition:'Eine Bitte aus der Nachbarschaft',postSubject_petitionThanks:'Eure Hilfe ist nicht vergessen',petitionTitle:'Eine Bitte von {name}',petition_goods:'Waren aus dem Lager geben',petition_fund:'Einkauf für den Haushalt finanzieren',petition_decline:'Freundlich absagen',petition_body:'{name} bittet bis {date} um {qty} Last {good}. Du kannst die Ware geben oder den Einkauf für {cost} Mark finanzieren. Helfen bringt +1 Ruf. Eine spätere Empfehlung oder ein Ankunftshinweis ist möglich. Dies ist freiwillige Hilfe ohne Vertragsstrafe.',petition_food:'Für den Haushalt soll ein Kornvorrat angelegt werden.',petition_nets:'Die Fischernetze brauchen neues Garn.',petition_tools:'Für regelmäßige Hafenarbeit fehlen brauchbare Werkzeuge.',petition_warmth:'Der Haushalt möchte einen kleinen Brennholzvorrat anlegen.',petitionThanks_intro:'{name} hat euch bei {contact} empfohlen: Loyalität +2.',petitionThanks_arrival:'{name} hat von einer wirklichen Lieferung aus {origin} gehört. Bei der Nachricht erwartet: {date}. Sie ist nun in der Planung bekannt.',petitionSupport:'Dankbare Nachbarn unterstützen deine Kandidatur: insgesamt +1 Unterstützung, bis 180 Tage nach der Hilfe. Die Empfehlung gilt der handelnden Person, nicht automatisch ihren Erben.',memoryTitle:'Woran die Stadt sich erinnert',memoryRecorded:'{name}: {event}',memorySaid:'„Ich erinnere mich an {name}: {event} Das war am {date}.“',deed_helped:'{name} erhielt {qty} Last {good}.',deed_refused:'Die Bitte von {name} wurde ausdrücklich abgelehnt.',deed_unanswered:'Die Bitte von {name} blieb unbeantwortet.',deed_contractDone:'Auftrag für {giver} erfüllt; {reward} Mark ausgezahlt.',deed_contractFailed:'Lieferzusage gegenüber {giver} gebrochen.',deed_cityHelp:'Bei „{event}“ geholfen: {choice}.',petitionDeadline:'Antwort bis {date}',petitionResolved:'Reaktion: {choice}',petition_unanswered:'Nicht beantwortet'});
Object.assign(HK.I18N.en,{postSubject_petition:'A neighbour’s request',postSubject_petitionThanks:'Your help is remembered',petitionTitle:'A request from {name}',petition_goods:'Give goods from storage',petition_fund:'Fund the household purchase',petition_decline:'Politely decline',petition_body:'{name} asks for {qty} last of {good} by {date}. Give the goods or fund the purchase for {cost} marks. Helping grants +1 reputation. A later introduction or arrival report may follow. This is voluntary help without a contract penalty.',petition_food:'The household wants to put aside a grain reserve.',petition_nets:'Fishing nets need fresh yarn.',petition_tools:'Serviceable tools are needed for regular dock work.',petition_warmth:'The household wants to build a small firewood reserve.',petitionThanks_intro:'{name} recommended you to {contact}: loyalty +2.',petitionThanks_arrival:'{name} heard of an actual delivery from {origin}, expected on {date} when reported. It is now known in Planning.',petitionSupport:'Grateful neighbours support your candidacy: +1 total support, lasting until 180 days after the help. The recommendation belongs to the person who helped, not automatically their heirs.',memoryTitle:'What the town remembers',memoryRecorded:'{name}: {event}',memorySaid:'“I remember {name}: {event} That was on {date}.”',deed_helped:'{name} received {qty} last of {good}.',deed_refused:'The request from {name} was explicitly declined.',deed_unanswered:'The request from {name} went unanswered.',deed_contractDone:'Order for {giver} fulfilled; {reward} marks paid.',deed_contractFailed:'Delivery promise to {giver} broken.',deed_cityHelp:'Helped during “{event}”: {choice}.',petitionDeadline:'Reply by {date}',petitionResolved:'Response: {choice}',petition_unanswered:'Unanswered'});
Object.assign(HK.I18N.de,{memoryObjection:'Mindestens zwei gebrochene Zusagen in 180 Tagen: −1 Wahlunterstützung. Die folgenden belegten Fälle begründen den Vorbehalt.'});
Object.assign(HK.I18N.en,{memoryObjection:'At least two broken promises in 180 days: −1 election support. The recorded cases below explain the objection.'});
