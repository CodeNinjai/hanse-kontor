'use strict';
{
 const actions={expandwh:'expandWarehouse',buildws:'buildWorkshop',upgradehouse:'upgradeHouse',repairhouse:'repairHouse',repairburgher:'repairBurgher',improveburgher:'improveBurgher',upgradeventure:'upgradeVenture',repairship:'repairShip',sailors:'hireSailors',stall:'buyStall',extraberth:'buyExtraBerth',project:'fundProject',churchproject:'churchProject'};
 const groups={sellhouse:'house',sellburgher:'burgher',sellventure:'venture',demolishws:'workshop',sellship:'ship',send:'ship',privateer:'ship'};
 function targetId(ui,d){if(['send','privateer'].includes(d.action))return ui.selectedOwnShip;if(['buildws','upgradehouse','repairhouse','sellhouse','demolishws'].includes(d.action))return ui.plot;if(['repairburgher','improveburgher','sellburgher'].includes(d.action))return ui.burgher;return ['repairship','sailors','sellship'].includes(d.action)?Number(d.id):d.id;}
 HK.UI.workLocation=function(w){
  if(w.target.startsWith('ship:'))return HK.state.ownShips.find(s=>s.id===w.id)?.name||HK.t('ownShips');
  if(w.target.startsWith('burgher:'))return HK.burgherName(HK.state.burghers[w.id]);
  if(w.target.startsWith('house:')||w.target.startsWith('workshop:')){const b=HK.BUILDINGS.find(b=>b.panel===(w.target.startsWith('house:')?'house':'workshop')&&b.plot===w.id);return b?HK.name(b):String(w.id);}
  return '';
 };
 HK.UI.workCard=function(w){const st=HK.state,progress=Math.max(0,Math.min(100,Math.floor((st.day-w.start)/(w.due-w.start)*100))),location=this.workLocation(w);return `<article class="work-order"><div class="plan-heading">${HK.MenuArt.place(w.target.startsWith('ship:')?'harbour':w.target==='warehouse'?'warehouse':'workshop')}<div><b>${this.esc(HK.workName(w))}</b>${location?`<small>${this.esc(location)}</small>`:''}</div></div><strong>${HK.t('workDue',{date:HK.fmtDate(w.due),days:Math.max(0,w.due-st.day)})}</strong><progress value="${progress}" max="100" aria-label="${HK.t('workProgress')}"></progress><small>${HK.t('workPaid',{cost:HK.fmt(w.cost)})}</small><button class="small" data-action="workcancel" data-id="${w.orderId}">${HK.t('workCancel',{refund:HK.fmt(HK.workRefund(st,w))})}</button></article>`;};
 const planning=HK.UI.planningPanel;HK.UI.planningPanel=function(){const st=HK.state,W=HK.workInit(st);return `<section class="work-plan">${this.helpHeading('workTitle','workHelp',3)}<div class="work-orders">${W.active.slice().sort((a,b)=>a.due-b.due).map(w=>this.workCard(w)).join('')||`<small>${HK.t('workEmpty')}</small>`}</div>${st.operations.orders.length?`<h4>${HK.t('workShipOrders')}</h4>${st.operations.orders.map(o=>`<p>${this.esc(o.type==='fishingBoat'?HK.t('fishingBoat'):HK.name(HK.SHIP_TYPE[o.type]))} · ${HK.fmtDate(o.due)}</p>`).join('')}<button class="small" data-action="fleetgo" data-panel="shipyard">${HK.t('fleetYard')}</button>`:''}${st.churchBuild.active?`<h4>${HK.t('workChurchBuild')}</h4><p>${this.esc(HK.name(HK.CHURCH_BUILD[st.churchBuild.active.id]))} · ${HK.fmtDate(st.churchBuild.active.until)}</p>`:''}${W.history.length?`<details><summary>${HK.t('workHistory')}</summary>${W.history.slice(-5).reverse().map(w=>`<p>${this.esc(HK.workName(w))} · ${HK.t('work_'+w.status)}<br><small>${HK.fmtDate(w.finished)}</small></p>`).join('')}</details>`:''}</section>`+planning.call(this);};
 const render=HK.UI.renderSidebar;HK.UI.renderSidebar=function(){render.call(this);if(!HK.state)return;const st=HK.state,seen=new Set();
  for(const button of this.sidebar.querySelectorAll('button[data-action]')){
   const d=button.dataset,kind=actions[d.action],id=targetId(this,d),group=groups[d.action];if(!kind&&!group)continue;
   const q=kind?HK.workQuote(st,kind,id,d.type):null,w=HK.workActive(st,q?.target||group+':'+id);
   if(w){button.disabled=true;button.title=HK.t('workBusy');seen.add(w);}
   else if(q){button.disabled=!q.ok;button.title=q.ok?HK.t('workDuration',{days:q.days,date:HK.fmtDate(q.due)}):HK.t(q.msg);}
   if(q&&!w&&q.days){const hint=document.createElement('small');hint.className='work-duration';hint.textContent=HK.t('workDuration',{days:q.days,date:HK.fmtDate(q.due)});button.insertAdjacentElement('afterend',hint);}
  }
  // Show the relevant project even when another module hides its purchase control.
  const target=this.panel==='house'?'house:'+this.plot:this.panel==='workshop'?'workshop:'+this.plot:this.panel==='burgher'?'burgher:'+this.burgher:this.panel==='warehouse'?'warehouse':null;
  const current=HK.workActive(st,target);if(current)seen.add(current);
  if(this.tab==='place'&&seen.size)this.sidebar.insertAdjacentHTML('afterbegin',`<section class="work-plan">${this.helpHeading('workTitle','workHelp',3)}${[...seen].map(w=>this.workCard(w)).join('')}<button class="small" data-action="tradeplans">${HK.t('workPlan')}</button></section>`);
 };
 const action=HK.UI.action;HK.UI.action=function(d){if(d.action!=='workcancel')return action.call(this,d);this.result(HK.cancelWork(HK.state,Number(d.id)));HK.scheduleSave?.();this.renderAll();};
 // Story pages show the same live order instead of asking for another purchase.
 const next=HK.UI.intrigueNext;HK.UI.intrigueNext=function(story){const st=HK.state,w=story==='property'?HK.workActive(st,'house:'+st.intrigue.property.house):story==='monopoly'?st.works.active.find(w=>w.orderId===st.intrigue.monopoly.construction):null;return w?HK.t('workDue',{date:HK.fmtDate(w.due),days:Math.max(0,w.due-st.day)}):next.call(this,story);};
 const panel=HK.UI.intriguePanel;HK.UI.intriguePanel=function(story){const html=panel.call(this,story),st=HK.state,w=story==='property'?HK.workActive(st,'house:'+st.intrigue.property.house):story==='monopoly'?st.works.active.find(w=>w.orderId===st.intrigue.monopoly.construction):null;return html+(w?`<section>${this.helpHeading('workTitle','workHelp',3)}${this.workCard(w)}</section>`:'');};
}
