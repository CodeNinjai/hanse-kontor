/* A finite grain dispute: public stock moves into a saved, rival-owned reserve.
   Views and quotes are pure. Daily transitions and decisions settle each lot once. */
'use strict';
HK.breadInit=function(st){return st.breadStory ||= {version:1,phase:'locked',history:[],cash:0,basis:0,reserve:0,released:0,relief:0};};
HK.newGameHooks.push(HK.breadInit);HK.migrateHooks.push(HK.breadInit);
HK.breadTrusted=st=>st.saltStory?.outcome==='community'||st.memory?.petitions.some(p=>p.type==='food'&&p.status==='done');
HK.breadCrisis=st=>st.breadStory&&['offer','declined','investigate','decision'].includes(st.breadStory.phase)&&st.day<=st.breadStory.due;
HK.breadSnapshot=st=>({...HK.intrigueSnapshot(st),mood:st.cityLife.mood,prosperity:st.town.prosperity});
HK.breadEffects=function(st,e){HK.intrigueEffects(st,e);if(e.mood)st.cityLife.mood=HK.clamp(st.cityLife.mood+e.mood,0,100);if(e.prosperity)st.town.prosperity=HK.clamp(st.town.prosperity+e.prosperity,0,100);};
HK.breadPreview=function(st,e){const before=HK.breadSnapshot(st),out={};for(const[k,v]of Object.entries(e))out[k]=HK.clamp(before[k]+v,0,k==='influence'?Infinity:100)-before[k];return out;};
HK.breadRecord=function(st,action,before,extra={}){
 const B=st.breadStory,after=HK.breadSnapshot(st),delta={};
 for(const k of Object.keys(after))if(after[k]!==before[k])delta[k]=after[k]-before[k];
 const e={action,day:st.day,author:st.name,generation:st.family.generation,delta,...extra};B.history.push(e);B.cash+=delta.money||0;B.basis+=extra.basis||0;
 HK.recordDeed(st,'bread','bread:'+B.history.length,{choice:HK.t('breadAction_'+action)},B.person||null);return e;
};
HK.breadMail=function(st,stage,day=st.day){const B=st.breadStory;HK.postAdd(st,'bread:'+stage,'bread',stage==='report'&&B.person?'citizen:'+B.person:'person:mayor',{stage},{date:HK.fmtDate(day)});};
HK.breadRelease=function(st,qty,wholesale=false){
 const B=st.breadStory,n=Math.min(B.reserve,Math.max(0,Math.floor(qty)));if(!n)return 0;
 HK.withQuality(B.quality,()=>HK.addStock(st.town.stock,'grain',n));B.reserve-=n;B.released+=n;
 if(wholesale){const r=st.rivals.find(r=>r.id==='kruse'),payment=n*B.wholesale;if(r)r.wealth+=payment;B.auctionProceeds=(B.auctionProceeds||0)+payment;}
 return n;
};
HK.breadFinish=function(st,ending,support=0){const B=st.breadStory;B.phase='done';B.ending=ending;B.finished=st.day;B.support=support;B.supportUntil=st.day+120;B.supportGeneration=st.family.generation;HK.breadMail(st,'done');};
HK.breadFollowupTerms=function(st,offerAt,saved={}){
 const B=st.breadStory,f=saved.factions||st.factions||{},dirty=!!saved.dirty,previous=saved.previous||B.solution||B.ending||'unknown',dueAt=offerAt+21;
 const church=f.kirche||0,merchants=f.kaufleute||0,guilds=f.zuenfte||0;
 const churchQty=church>=60?8:church<35?12:10,marketQty=guilds>=60?4:6;
 const merchantCost=Math.max(150,300+(previous==='warrant'||previous==='frame'?150:0)-(merchants>=60?75:0));
 return {offerAt,replyDue:offerAt+7,dueAt,previous,dirty,factions:{kirche:church,kaufleute:merchants,zuenfte:guilds,patrizier:f.patrizier||0},
  church:{qty:churchQty,quality:85,reasons:[church>=60?'trusted':church<35?'mistrust':'standard']},
  merchants:{cost:merchantCost,reasons:[...(previous==='warrant'||previous==='frame'?['seizure']:[]),...(merchants>=60?['trusted']:[]),...(previous!=='warrant'&&previous!=='frame'&&merchants<60?['standard']:[])]},
  council:{qty:marketQty,quality:85,influence:4+(dirty?2:0),reasons:[...(guilds>=60?['trusted']:['standard']),...(dirty?['manipulation']:[])],dirty}};
};
HK.breadFollowupSchedule=function(st){
 const B=st.breadStory;if(!B||B.followup||B.phase!=='done'||!B.review)return;
 B.followup={version:1,status:'scheduled',availableAt:B.finished+14,history:[],previous:B.solution||B.ending||'unknown',dirty:!!B.dirty,factions:{...st.factions}};
};
HK.breadFollowupElection=st=>{const F=st.breadStory?.followup?.support;return F&&F.generation===st.family.generation&&st.day<F.until?F.delta:0;};
HK.breadElection=st=>{const B=st.breadStory,old=B?.phase==='done'&&B.supportGeneration===st.family.generation&&st.day<B.supportUntil?B.support||0:0;return old+HK.breadFollowupElection(st);};
HK.breadFollowupQuote=function(st,action,expected){
 const F=st.breadStory?.followup,no=msg=>({ok:false,msg:msg||'breadGone'});if(st.gameOver||!F||F.status!==expected)return no();
 const q={ok:true,action,status:expected,cost:0,influenceCost:0,goods:0,basis:0,income:0};
 if(expected==='offer'){
  if(st.day>F.terms.replyDue)return no();
  if(['church','merchants','council','decline'].includes(action)){
   if(action==='council'){q.influenceCost=F.terms.council.influence;if(st.influence<q.influenceCost){q.ok=false;q.msg='needInfluence';}}
  }else return no();
 }else if(expected==='active'){
  if(st.day>F.terms.dueAt)return no();
  if(action==='fulfill'){
   if(F.pledge==='church'||F.pledge==='council'){
    const term=F.terms[F.pledge];q.goods=term.qty;q.requiredQuality=term.quality;q.quality=HK.goodQuality(st,'grain');
    q.basis=HK.goodsValue(st,'grain',Math.min(q.goods,st.warehouse.stock.grain||0));
    if((st.warehouse.stock.grain||0)<q.goods)q.ok=false,q.msg='notEnoughCargo';else if(q.quality<q.requiredQuality)q.ok=false,q.msg='cityQualityRequired';
   }else if(F.pledge==='merchants'){
    q.cost=F.terms.merchants.cost;if(st.money<q.cost)q.ok=false,q.msg='notEnoughMoney';
   }else return no();
  }else if(action==='extend'){
   if(F.extended)return no('breadFollowupExtended');q.influenceCost=2;if(st.influence<2)q.ok=false,q.msg='needInfluence';
  }else if(action!=='withdraw')return no();
 }else return no();
 if(action==='withdraw')q.effects=HK.breadFollowupEffects(F.pledge,'withdrawn');
 if(expected==='active'&&action==='fulfill')q.effects=HK.breadFollowupEffects(F.pledge,'fulfilled');
 return q;
};
HK.breadFollowupRecord=function(st,action,before,extra={}){
 const B=st.breadStory,F=B.followup,e={action,day:st.day,author:st.name,generation:st.family.generation,...extra};
 F.history.push(e);F.history=F.history.slice(-40);
 // The main ledger keeps the full chronological cash/goods account for both parts of the story.
 e.entry=HK.breadRecord(st,'followup_'+action,before,{goods:extra.goods||0,basis:extra.basis||0,pledge:F.pledge||null});
 return e;
};
HK.breadFollowupResolve=function(st,ending,day=st.day){
 const F=st.breadStory.followup;if(!F||F.status!=='active')return;
 F.status='reaction';F.ending=ending;F.resolvedAt=day;F.reaction={at:day+3,generation:F.actorGeneration??st.family.generation,delta:ending==='fulfilled'?1:ending==='breach'?-1:0,previous:F.terms.previous,pledge:F.pledge||'none',effects:HK.breadFollowupEffects(F.pledge,ending)};
};
HK.BREAD_FOLLOWUP_EFFECTS={
 church:{fulfilled:{rep:2,piety:2,kirche:3,kaufleute:-2,mood:3},withdrawn:{rep:-1,kirche:-2},breach:{rep:-3,mood:-2,kirche:-4}},
 merchants:{fulfilled:{rep:1,kaufleute:4,zuenfte:-3},withdrawn:{rep:-1,kaufleute:-2},breach:{rep:-3,mood:-2,kaufleute:-4}},
 council:{fulfilled:{rep:1,influence:1,zuenfte:4,patrizier:-3,mood:2},withdrawn:{rep:-1,zuenfte:-2},breach:{rep:-3,mood:-2,zuenfte:-4}}
};
HK.breadFollowupEffects=(pledge,ending)=>({...HK.BREAD_FOLLOWUP_EFFECTS[pledge]?.[ending]});
HK.breadFollowupSync=function(st){
 const B=st.breadStory,F=B&&B.followup;if(!F)return;
 if(F.status==='scheduled'&&st.day>=F.availableAt){F.offerAt=F.availableAt;F.terms=HK.breadFollowupTerms(st,F.offerAt,F);F.status='offer';HK.breadMail(st,'followup_offer',F.offerAt);}
 if(F.status==='offer'&&st.day>F.terms.replyDue){F.status='resolved';F.ending='unanswered';F.resolvedAt=F.terms.replyDue+1;F.history.push({action:'unanswered',day:F.resolvedAt,author:st.name,generation:st.family.generation});HK.breadMail(st,'followup_unanswered',F.resolvedAt);}
 if(F.status==='active'&&st.day>F.terms.dueAt){const before=HK.breadSnapshot(st),day=F.terms.dueAt+1;F.history.push({action:'breach',day,author:st.name,generation:F.actorGeneration,pledge:F.pledge});HK.breadFollowupResolve(st,'breach',day);HK.breadRecord(st,'followup_breach',before,{day,generation:F.actorGeneration,pledge:F.pledge,previous:F.terms.previous});}
 if(F.status==='reaction'&&st.day>=F.reaction.at){const before=HK.breadSnapshot(st);HK.breadEffects(st,F.reaction.effects);F.reactionDay=F.reaction.at;F.support={delta:F.reaction.delta,until:F.reaction.at+90,generation:F.reaction.generation};F.status='resolved';F.history.push({action:'reaction',day:F.reaction.at,author:st.name,generation:F.reaction.generation,delta:F.reaction.delta});HK.breadRecord(st,'followup_reaction',before,{day:F.reaction.at,generation:F.reaction.generation,pledge:F.pledge,outcome:F.ending,support:F.reaction.delta,previous:F.reaction.previous});HK.breadMail(st,'followup_reaction',F.reaction.at);}
};
HK.breadFollowupMigrate=function(st){const F=st.breadStory?.followup;if(!F)return;F.version=1;F.history ||= [];};
HK.breadFollowupAct=function(st,action,expected){
 const q=HK.breadFollowupQuote(st,action,expected);if(!q.ok)return q;
 const B=st.breadStory,F=B.followup,T=F.terms,r=st.rivals.find(x=>x.id==='kruse'),before=HK.breadSnapshot(st);
 if(q.influenceCost)st.influence-=q.influenceCost;
 if(expected==='offer'){
  if(action==='decline'){F.status='resolved';F.ending='declined';F.resolvedAt=st.day;HK.breadFollowupRecord(st,'declined',before,{pledge:null});HK.breadMail(st,'followup_declined');HK.scheduleSave?.();return{ok:true};}
  F.pledge=action;F.status='active';F.acceptedAt=st.day;F.actorGeneration=st.family.generation;F.history.push({action:'accepted',day:st.day,author:st.name,generation:st.family.generation,pledge:action,influence:q.influenceCost});HK.breadRecord(st,'followup_accept',before,{pledge:action,influence:q.influenceCost});HK.scheduleSave?.();return{ok:true};
 }
 if(action==='extend'){F.terms.dueAt+=7;F.extended=true;F.history.push({action:'extended',day:st.day,author:st.name,generation:F.actorGeneration,dueAt:F.terms.dueAt,influence:q.influenceCost});HK.breadRecord(st,'followup_extend',before,{influence:q.influenceCost,dueAt:F.terms.dueAt});HK.scheduleSave?.();return{ok:true};}
 if(action==='withdraw'){
  F.history.push({action:'withdrawn',day:st.day,author:st.name,generation:F.actorGeneration,pledge:F.pledge});HK.breadFollowupResolve(st,'withdrawn');HK.breadRecord(st,'followup_withdraw',before,{generation:F.actorGeneration,pledge:F.pledge});HK.scheduleSave?.();return{ok:true};
 }
 if(F.pledge==='church'){
  HK.addStock(st.warehouse.stock,'grain',-q.goods);F.delivered={qty:q.goods,quality:q.quality,channel:'households',day:st.day};
  HK.breadEffects(st,HK.breadFollowupEffects(F.pledge,'fulfilled'));
 }else if(F.pledge==='merchants'){
  HK.book(st,'politics',-q.cost);if(r)r.wealth+=q.cost;F.paid={amount:q.cost,to:'kruse',day:st.day};
  HK.breadEffects(st,HK.breadFollowupEffects(F.pledge,'fulfilled'));
 }else{
  const actualQuality=q.quality;HK.addStock(st.warehouse.stock,'grain',-q.goods);HK.withQuality(actualQuality,()=>HK.addStock(st.town.stock,'grain',q.goods));F.delivered={qty:q.goods,quality:actualQuality,channel:'publicMarket',day:st.day};
  HK.breadEffects(st,HK.breadFollowupEffects(F.pledge,'fulfilled'));
 }
 F.history.push({action:'fulfilled',day:st.day,author:st.name,generation:F.actorGeneration,pledge:F.pledge,goods:q.goods,basis:q.basis,cost:q.cost});HK.breadFollowupResolve(st,'fulfilled');
 HK.breadRecord(st,'followup_fulfill',before,{generation:F.actorGeneration,pledge:F.pledge,goods:q.goods,basis:q.basis,cost:q.cost,income:0});HK.breadMail(st,'followup_waiting');HK.scheduleSave?.();return{ok:true};
};
HK.breadSync=function(st,migrating=false){
 const B=HK.breadInit(st);if(st.gameOver)return;
 if(B.phase==='locked'&&st.day>=18){
  const r=st.rivals.find(r=>r.id==='kruse'),unit=HK.marketBuyPrice(st,'grain',1);
  const qty=Math.max(0,Math.min(48,Math.floor((st.town.stock.grain||0)*.2),Math.floor((r?.wealth||0)/unit)));
  if(!qty||(st.town.stock.grain||0)>HK.desired('grain')*1.1)return;
  B.unit=unit;B.wholesale=Math.round(HK.GOOD.grain.base*.65);B.reserve=qty;B.initialReserve=qty;
  B.quality=HK.goodQuality(st,'grain',true);if(r)r.wealth-=B.reserve*B.unit;HK.addStock(st.town.stock,'grain',-B.reserve);
  B.cause=Math.random()<.5?'fraud':'debt';B.phase='offer';B.opened=st.day;B.due=st.day+18;
  B.person=Object.values(st.population?.people||{}).find(p=>!p.guest&&!p.contact&&p.type!=='child'&&p.job==='porter')?.id;
  const before=HK.breadSnapshot(st);HK.breadEffects(st,{mood:-6});HK.breadRecord(st,'crisis',before,{reserved:B.reserve});HK.breadMail(st,'offer');
 }
 if(['offer','declined','investigate','decision'].includes(B.phase)&&st.day>B.due){
  const before=HK.breadSnapshot(st);HK.breadRelease(st,B.reserve,true);HK.breadEffects(st,{mood:-4,...(B.accepted?{rep:-3,influence:-2,zuenfte:-3}:{})});HK.breadFinish(st,B.phase==='declined'?'declined':B.accepted?'expired':'unanswered');HK.breadRecord(st,'expired',before);return;
 }
 if(B.phase==='investigate'&&B.reportAt!==undefined&&st.day>=B.reportAt){
  B.report=B.method==='listen'&&!B.trusted?'rumour':B.cause;B.phase='decision';B.reportDay=st.day;HK.breadMail(st,'report');
 }
 if(B.phase==='waiting'&&st.day>=B.reviewAt){
  // Unpurchased grain returns through a one-time wholesale sale. This is not a gift from the player.
  HK.breadRelease(st,B.reserve,true);
  B.review={day:st.day,stock:st.town.stock.grain||0,threshold:Math.ceil(HK.desired('grain')*.55),relief:B.relief};
  B.phase='review';B.reviewDue=B.reviewAt+7;HK.breadMail(st,'review',B.reviewAt);
 }
 if(B.phase==='review'&&st.day>B.reviewDue){
  const before=HK.breadSnapshot(st);HK.breadEffects(st,B.dirty?{rep:-6,influence:-4,piety:-2,suspicion:10,patrizier:-4,kaufleute:-4,zuenfte:-5,kirche:-3,mood:-5}:{rep:-2,zuenfte:-2});
  HK.breadFinish(st,B.dirty?'exposed':'missedReview',-1);HK.breadRecord(st,'missedReview',before);if(!migrating)HK.breadFollowupSchedule(st);
 }
 HK.breadFollowupSync(st);
};
HK.tickHooks.push(st=>HK.breadSync(st));HK.migrateHooks.push(st=>HK.breadSync(st,true),HK.breadFollowupMigrate);
HK.BREAD_ACTIONS={
 accept:{cost:0,effects:{},art:'townhall'},decline:{cost:0,effects:{},art:'townhall'},
 audit:{cost:80,effects:{},art:'bank'},verify:{cost:80,effects:{},art:'bank'},listen:{cost:0,effects:{},art:'market'},bribe:{cost:140,effects:{piety:-1,suspicion:3,kaufleute:-1},art:'bank'},skip:{cost:0,effects:{},art:'townhall'},
 negotiate:{cost:0,effects:{rep:3,influence:1,piety:1,kaufleute:3,zuenfte:2,mood:8},art:'guild'},
 warrant:{cost:0,effects:{rep:4,influence:-8,patrizier:2,kaufleute:-3,zuenfte:4,mood:8},art:'townhall'},
 relief:{cost:0,effects:{rep:3,piety:3,kirche:4,zuenfte:2,mood:8},art:'grain'},
 frame:{cost:100,effects:{rep:2,piety:-3,suspicion:6,kaufleute:-4,mood:6},art:'bank'},
 collude:{cost:0,effects:{rep:-2,piety:-3,suspicion:5,kaufleute:2,zuenfte:-4,mood:2},art:'guild'},
 account:{cost:0,effects:{rep:2,influence:3,zuenfte:2,mood:2},art:'townhall'},
 aid:{cost:0,effects:{rep:1,piety:2,kirche:2,mood:4},art:'grain'},
 acknowledge:{cost:0,effects:{rep:-1,influence:-1,piety:1},art:'townhall'},
 restitution:{cost:0,effects:{rep:-2,influence:-2,piety:3,suspicion:-3,kirche:3,kaufleute:-2,mood:3},art:'church'},
 confess:{cost:0,effects:{rep:-4,influence:-3,piety:2,suspicion:4,patrizier:-2,kaufleute:-3,zuenfte:-2,kirche:2,mood:-2},art:'church'},
 suppress:{cost:220,effects:{rep:-3,influence:-2,piety:-3,suspicion:8,patrizier:-3,zuenfte:-5,kirche:-3,mood:-4},art:'dive'}
};
HK.breadQuote=function(st,action,phase){
 const B=st.breadStory,d=HK.BREAD_ACTIONS[action],no=msg=>({ok:false,msg:msg||'breadGone'});
 if(st.gameOver||!B||!d||B.phase!==phase)return no();
 if(['offer','investigate','decision'].includes(phase)&&st.day>B.due||phase==='review'&&st.day>B.reviewDue)return no();
 const q={ok:true,action,phase,cost:d.cost,income:0,effects:{...d.effects},art:d.art,goods:0,basis:0},fail=msg=>{q.ok=false;q.msg=msg;};
 if(phase==='offer'&&['accept','decline'].includes(action)){}
 else if(phase==='investigate'&&['audit','listen','bribe','skip'].includes(action)&&!B.method){
  q.days=action==='audit'?2:action==='listen'&&!HK.breadTrusted(st)?1:0;
  if(st.day+q.days>B.due)fail('breadTooLate');
 }else if(phase==='decision'&&action==='verify'&&['rumour','none'].includes(B.report)){
  q.days=2;if(st.day+2>B.due)fail('breadTooLate');
 }else if(phase==='decision'&&['negotiate','warrant','relief','frame','collude'].includes(action)){
  if(action!=='relief'&&!B.reserve)fail('breadNoReserve');
  if(action==='negotiate')q.cost=Math.ceil(B.reserve*B.unit*(st.intrigue?.pact ? 80 : 110)/100);
  if(action==='warrant'){
   if(B.report!=='fraud')fail('breadNeedProof');q.effects.influence=HK.intrigueBacked(st)?-6:-8;
   if(st.influence<-q.effects.influence)fail('breadNeedInfluence');
  }
  if(action==='relief')q.goods=12;
  if(action==='collude'){
   if(st.intrigue?.pact)fail('breadPactBlocks');const r=st.rivals.find(r=>r.id==='kruse');q.income=Math.min(350,Math.max(0,Math.floor(r?.wealth||0)));if(!q.income)fail('igNoRivalMoney');
  }
 }else if(phase==='review'){
  if(B.dirty){if(!['restitution','confess','suppress'].includes(action))return no();if(action==='restitution')q.cost=(B.bribeIncome||0)+180;}
  else{
   if(!['account','aid','acknowledge'].includes(action))return no();
   if(action==='account'&&B.review.relief<12&&B.review.stock<B.review.threshold)fail('breadNotEnoughHelp');
   if(action==='aid')q.goods=8;
  }
 }else return no();
 if(q.goods){q.basis=HK.goodsValue(st,'grain',Math.min(q.goods,st.warehouse.stock.grain||0));if((st.warehouse.stock.grain||0)<q.goods)fail('notEnoughCargo');else if(HK.goodQuality(st,'grain')<85)fail('cityQualityRequired');}
 if(st.money<q.cost)fail('notEnoughMoney');
 q.preview=HK.breadPreview(st,q.effects);return q;
};
HK.breadAct=function(st,action,phase){
 const q=HK.breadQuote(st,action,phase);if(!q.ok)return q;
 const B=st.breadStory,before=HK.breadSnapshot(st),r=st.rivals.find(r=>r.id==='kruse');
 if(q.cost)HK.book(st,'politics',-q.cost);if(q.income)HK.book(st,'politics',q.income);
 if(q.goods){HK.addStock(st.warehouse.stock,'grain',-q.goods);B.relief+=q.goods;}
 if(action==='accept'){B.accepted=st.day;B.phase='investigate';}
 else if(action==='decline'){B.phase='declined';}
 else if(['audit','verify','listen','bribe','skip'].includes(action)){
  B.method=action;B.trusted=!!HK.breadTrusted(st);B.reportAt=st.day+q.days;B.phase='investigate';
  if(action==='skip'){B.report='none';B.phase='decision';}
  if(action==='bribe'){B.corruptInquiry=true;st.persons.weighmaster.loyalty=HK.clamp(st.persons.weighmaster.loyalty+3,0,100);}
 }else if(phase==='decision'){
  B.solution=action;B.dirty=!!B.corruptInquiry||['collude','frame'].includes(action);B.phase='waiting';B.reviewAt=st.day+7;
  if(action==='negotiate'){if(r)r.wealth+=q.cost;HK.breadRelease(st,B.reserve);}
  if(action==='warrant'||action==='frame')HK.breadRelease(st,B.reserve);
  if(action==='collude'){r.wealth-=q.income;B.bribeIncome=q.income;HK.breadRelease(st,Math.ceil(B.reserve/2));}
  HK.breadMail(st,'waiting');
 }else if(phase==='review'){
  HK.breadFinish(st,action,['account','aid'].includes(action)?1:['confess','suppress'].includes(action)?-1:0);
 }
 HK.breadEffects(st,q.effects);const entry=HK.breadRecord(st,action,before,{basis:q.basis,goods:q.goods});if(phase==='review')HK.breadFollowupSchedule(st);HK.breadSync(st);HK.scheduleSave?.();return{ok:true,entry};
};
{
 const cons=HK.consMod;HK.consMod=function(st,g){return cons(st,g)*(HK.breadCrisis(st)&&['grain','flour'].includes(g)?1.12:1);};
 const support=HK.seatSupportMod;HK.seatSupportMod=st=>support(st)+HK.breadElection(st);
 const actions=HK.postActions;HK.postActions=function(st,m){return m.type==='bread'?[]:actions(st,m);};
}
