/* Saved construction and repair orders. Benefits are applied only on the due day. */
'use strict';
HK.workInit=st=>{st.works||={nextId:1,active:[],history:[]};return st.works;};
HK.newGameHooks.push(HK.workInit);HK.migrateHooks.push(HK.workInit);
HK.workActive=(st,target)=>st.works?.active.find(w=>w.target===target);
HK.workTarget=(kind,id)=>({expandWarehouse:'warehouse',buildWorkshop:'workshop:'+id,upgradeHouse:'house:'+id,repairHouse:'house:'+id,repairBurgher:'burgher:'+id,improveBurgher:'burgher:'+id,upgradeVenture:'venture:'+id,repairShip:'ship:'+id,hireSailors:'ship:'+id,buyStall:'stalls',buyExtraBerth:'berths',fundProject:id==='harbour'?'berths':'project:'+id,churchProject:'church:'+id})[kind];
HK.workQuote=function(st,kind,id,type){
 const C=HK.CONST,target=HK.workTarget(kind,id),busy=HK.workActive(st,target),no=msg=>({ok:false,msg:msg||'workUnavailable',target});
 if(st.gameOver||!target)return no();if(busy)return {...no('workBusy'),work:busy};
 let cost,days,base,reason,valid=false,account='investments';
 const h=st.houses[id],b=st.burghers[id],v=st.ventures[id],s=st.ownShips.find(s=>s.id===id),ws=st.workshops[id];
 switch(kind){
  case 'expandWarehouse':cost=C.WAREHOUSE_EXPAND_COST;days=4;valid=true;break;
  case 'buildWorkshop':{const def=HK.WORKSHOP[type];if(!def||!ws||ws.type)return no();cost=def.cost;days=6;valid=true;if(!st.licenses[type])reason='needLicense';break;}
  case 'upgradeHouse':cost=C.HOUSE_UPGRADE;days=2+(h?.level||1)*2;base=h?.level;valid=h?.owner==='player'&&h.level<3&&!h.damaged;break;
  case 'repairHouse':cost=800;days=2;valid=h?.owner==='player'&&h.damaged;break;
  case 'repairBurgher':cost=C.BURGHER_REPAIR;days=2;valid=b?.owner==='player'&&b.damaged;break;
  case 'improveBurgher':cost=2200+(b?.level||1)*800;days=2+(b?.level||1)*2;base=b?.level;valid=b?.owner==='player'&&b.level<3&&!b.damaged;break;
  case 'upgradeVenture':cost=Math.round((HK.VENTURE[id]?.cost||0)*C.VENTURE_UPGRADE);days=3+(v?.level||1)*2;base=v?.level;valid=!!v&&!v.owner&&v.level<C.VENTURE_MAX_LEVEL;break;
  case 'repairShip':cost=s?Math.round((100-s.hull)*30*HK.shipRepairFactor(st)):0;days=s?Math.max(1,Math.ceil((100-s.hull)/20)):1;base=s?.hull;valid=s?.status==='port'&&s.hull<100;break;
  case 'hireSailors':cost=C.SAILORS_COST;days=2;base=s?.hull;account='wages';valid=s?.status==='port'&&s.hull<100;break;
  case 'buyStall':cost=C.STALL_COST;days=2;valid=st.stalls<C.STALL_MAX;break;
  case 'buyExtraBerth':cost=C.EXTRA_BERTH;days=8;account='politics';valid=st.town.berths<C.MAX_BERTHS;break;
  case 'fundProject':{const p=HK.PROJECTS.find(p=>p.id===id);cost=p?.cost;days={well:6,harbour:12,wall:18}[id];account='politics';valid=!!p&&!st.town.projects[id]&&(id!=='harbour'||st.town.berths<C.MAX_BERTHS);break;}
  case 'churchProject':{const p=HK.CHURCH_PROJECTS.find(p=>p.id===id);cost=p?.cost;days={altar:5,bells:8,chapel:14}[id];account='church';valid=!!p&&!st.church.projects[id];break;}
 }
 const q={kind,id,type,target,cost,days,base,account,start:st.day,due:st.day+days};
 if(!valid||reason)return {...q,...no(reason)};return {...q,ok:st.money>=cost,msg:st.money>=cost?null:'notEnoughMoney'};
};
HK.workName=function(w){
 if(w.kind==='buildWorkshop')return HK.name(HK.WORKSHOP[w.type]);
 if(w.kind==='fundProject')return HK.name(HK.PROJECTS.find(p=>p.id===w.id));
 if(w.kind==='churchProject')return HK.name(HK.CHURCH_PROJECTS.find(p=>p.id===w.id));
 if(w.kind==='upgradeVenture')return HK.name(HK.VENTURE[w.id]);
 return HK.t('work_'+w.kind);
};
HK.startWork=function(st,kind,id,type){
 const q=HK.workQuote(st,kind,id,type);if(!q.ok)return q;
 const W=HK.workInit(st),w={...q,orderId:W.nextId++};delete w.ok;delete w.msg;
 HK.book(st,w.account,-w.cost);W.active.push(w);
 HK.log(st,'workOrdered',{name:HK.workName(w),date:HK.fmtDate(w.due)},'info');
 return {ok:true,deferred:true,work:w};
};
for(const kind of ['expandWarehouse','buildWorkshop','upgradeHouse','repairHouse','repairBurgher','improveBurgher','upgradeVenture','repairShip','hireSailors','buyStall','buyExtraBerth','fundProject','churchProject'])HK[kind]=(st,id,type)=>HK.startWork(st,kind,id,type);
HK.workRefund=(st,w)=>Math.floor(w.cost*.8*Math.max(0,1-(st.day-w.start)/(w.due-w.start)));
HK.finishWork=function(st,w){
 if(!st.works?.active.includes(w)||st.day<w.due)return false;
 const h=st.houses[w.id],b=st.burghers[w.id],v=st.ventures[w.id],s=st.ownShips.find(s=>s.id===w.id),C=HK.CONST;
 switch(w.kind){
  case 'expandWarehouse':st.warehouse.cap+=C.WAREHOUSE_EXPAND;break;
  case 'buildWorkshop':if(!st.workshops[w.id]||st.workshops[w.id].type)return false;st.workshops[w.id].type=w.type;HK.log(st,'workshopBuilt',{workshop:HK.name(HK.WORKSHOP[w.type])},'good');break;
  case 'upgradeHouse':if(h?.owner!=='player'||h.level!==w.base)return false;h.level++;break;
  case 'repairHouse':if(h?.owner!=='player')return false;h.damaged=false;break;
  case 'repairBurgher':if(b?.owner!=='player')return false;b.damaged=false;b.mood=HK.clamp(b.mood+15,0,100);break;
  case 'improveBurgher':if(b?.owner!=='player'||b.level!==w.base)return false;b.level++;b.mood=HK.clamp(b.mood+12,0,100);HK.log(st,'burgherImproved',{house:HK.burgherName(b)},'good');break;
  case 'upgradeVenture':if(!v||v.owner||v.level!==w.base)return false;v.level++;break;
  case 'repairShip':case 'hireSailors':if(!s||s.status!=='port')return false;s.hull=Math.min(100,s.hull+(w.kind==='hireSailors'?25:100-w.base));if(w.kind==='hireSailors')st.suspicion=HK.clamp(st.suspicion+1,0,100);break;
  case 'buyStall':if(st.stalls>=C.STALL_MAX)return false;st.stalls++;HK.lehrgangMerke(st,'ausbau');break;
  case 'buyExtraBerth':if(st.town.berths>=C.MAX_BERTHS)return false;st.town.berths++;st.rep=HK.clamp(st.rep+6,0,100);st.influence+=4;HK.fac(st,'kaufleute',6);HK.fac(st,'patrizier',3);HK.log(st,'berthBuilt',{n:st.town.berths},'good');break;
  case 'fundProject':{
   const p=HK.PROJECTS.find(p=>p.id===w.id);if(st.town.projects[w.id])return false;st.town.projects[w.id]=true;st.rep=HK.clamp(st.rep+p.rep,0,100);st.influence+=10;
   if(p.effect==='berth')st.town.berths=Math.min(C.MAX_BERTHS,st.town.berths+1);if(p.effect==='prosperity')st.town.prosperity=HK.clamp(st.town.prosperity+8,0,100);
   HK.facAll(st,4);if(w.id==='well')HK.fac(st,'zuenfte',3);if(w.id==='harbour')HK.fac(st,'kaufleute',4);
   const m=st.intrigue?.monopoly;if(m?.construction===w.orderId){if(m.phase==='preparing'&&st.day<=m.due)m.support+=3;delete m.construction;}
   HK.log(st,'projectDone',{project:HK.name(p)},'good');break;
  }
  case 'churchProject':{const p=HK.CHURCH_PROJECTS.find(p=>p.id===w.id);if(st.church.projects[w.id])return false;st.church.projects[w.id]=true;st.piety=HK.clamp(st.piety+p.piety,0,100);st.rep=HK.clamp(st.rep+p.rep,0,100);st.influence+=5;HK.fac(st,'kirche',6);HK.fac(st,'patrizier',2);HK.log(st,'projectDone',{project:HK.name(p)},'good');break;}
  default:return false;
 }
 return true;
};
HK.workClose=function(st,w,status){
 if(!st.works?.active.includes(w))return;
 if(st.intrigue?.monopoly.construction===w.orderId)delete st.intrigue.monopoly.construction;
 const W=HK.workInit(st);W.active=W.active.filter(x=>x.orderId!==w.orderId);W.history.push({...w,status,finished:st.day});if(W.history.length>40)W.history.shift();
 HK.log(st,status==='done'?'workCompleted':status==='cancelled'?'workCancelled':'workLost',{name:HK.workName(w),refund:HK.fmt(w.refund||0)},status==='done'?'good':'info');
 HK.intrigueSync?.(st);HK.postSync?.(st);
};
HK.cancelWork=function(st,id){
 const w=st.works?.active.find(w=>w.orderId===id);if(st.gameOver||!w||st.day>=w.due)return {ok:false,msg:'workUnavailable'};
 const before=w.story?HK.intrigueSnapshot(st):null;w.refund=HK.workRefund(st,w);HK.book(st,w.account,w.refund);HK.workClose(st,w,'cancelled');if(before)HK.intrigueRecord(st,w.story,'workCancelled',before);return {ok:true};
};
HK.workDayStart=function(st){
 for(const w of [...HK.workInit(st).active]){
  // Loss of the target ends work immediately; no phantom repairs or upgrades.
  const owned=w.target.startsWith('house:')?st.houses[w.id]?.owner==='player':w.target.startsWith('burgher:')?st.burghers[w.id]?.owner==='player':w.target.startsWith('venture:')?!!st.ventures[w.id]&&!st.ventures[w.id].owner:w.target.startsWith('ship:')?!!st.ownShips.find(s=>s.id===w.id):true;
  if(!owned){const before=w.story?HK.intrigueSnapshot(st):null;w.refund=HK.workRefund(st,w);HK.book(st,w.account,w.refund);HK.workClose(st,w,'lost');if(before)HK.intrigueRecord(st,w.story,'workCancelled',before);}
  else if(st.day>=w.due){const before=w.story?HK.intrigueSnapshot(st):null,done=HK.finishWork(st,w);HK.workClose(st,w,done?'done':'lost');if(before&&done)HK.intrigueRecord(st,w.story,'workCompleted',before);}
 }
};
for(const [name,group]of Object.entries({sellHouse:'house',sellBurgher:'burgher',sellVenture:'venture',demolishWorkshop:'workshop',sellOwnShip:'ship',sendShip:'ship',privateer:'ship'})){
 const original=HK[name];HK[name]=function(st,id,...args){if(HK.workActive(st,group+':'+id))return {ok:false,msg:'workBusy'};return original(st,id,...args);};
}
{
 const postActions=HK.postActions;HK.postActions=function(st,m){return postActions(st,m).filter(a=>a.id!=='repair'||!HK.workActive(st,'burgher:'+m.ref.id)).map(a=>a.id==='repair'?{...a,hint:'workDuration',vars:{...a.vars,days:2,date:HK.fmtDate(st.day+2)}}:a);};
 const ready=HK.fleetReady;HK.fleetReady=function(st,s,...args){if(s&&HK.workActive(st,'ship:'+s.id))return {ok:false,msg:'workBusy'};return ready(st,s,...args);};
 const worth=HK.netWorth;HK.netWorth=st=>worth(st)+(st.works?.active||[]).reduce((n,w)=>n+HK.workRefund(st,w),0);
 const quote=HK.intrigueQuote;HK.intrigueQuote=function(st,story,action,phase){const q=quote(st,story,action,phase);if(!q.ok)return q;
  if(story==='property'&&['repair','upgrade','sell'].includes(action)){
   if(HK.workActive(st,'house:'+st.intrigue.property.house))return {...q,ok:false,msg:'workBusy'};
   if(action!=='sell')q.days=HK.workQuote(st,action==='repair'?'repairHouse':'upgradeHouse',st.intrigue.property.house).days;
  }
  if(story==='monopoly'&&action==='build'){const w=HK.workQuote(st,'fundProject',q.project);if(!w.ok)return {...q,ok:false,msg:w.msg};q.days=w.days;q.delayedPreview=q.preview;q.preview={};}
  return q;
 };
}
