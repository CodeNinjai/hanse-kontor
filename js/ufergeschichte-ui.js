'use strict';
HK.shoreStatus=T=>T.debt>0?'active':T.phase==='offer'?'available':T.phase==='done'?['expired','ignored','neglected','abandoned'].includes(T.ending)?'failed':['declined','cancelled'].includes(T.ending)?'archived':'done':'active';
Object.assign(HK.UI,{
 shoreOpen(quest='main'){return `<button class="small" data-action="shoreopen" data-quest="${quest}">${HK.t('ig_open')} →</button>`;},
 shoreNext(quest){const S=HK.state.shoreStory,T=quest==='main'?S:S[quest];if(quest==='main'&&T.phase==='done'&&T.debt>0)return HK.t('shoreDebt',{value:HK.fmt(S.debt),date:HK.fmtDate(S.debtDue)});return HK.t('shoreNext_'+(T.phase==='done'?'done':quest==='neighbours'?'neighbours':quest==='aftercare'&&T.phase==='offer'?'aftercare':T.phase));},
 shoreMissionCard(quest,status){const S=HK.state.shoreStory;return `<article class="mission-card ${status}" data-mission="shore-${quest}">${this.missionHeader('story',HK.t('shoreTitle_'+quest),S.site?HK.t('shoreSite_'+S.site):'',HK.MenuArt.good(quest==='main'?'stone':quest==='neighbours'?'beer':'tools'),status)}${this.missionNext(this.shoreNext(quest))}<div class="mission-actions">${this.shoreOpen(quest)}</div></article>`;},
 shoreChoice(quest,action){
  const S=HK.state.shoreStory,T=quest==='main'?S:S[quest],q=HK.shoreQuote(HK.state,quest,action,T.phase),d=HK.SHORE_ACTIONS[action];
  let h=`<article class="intrigue-choice"><div class="plan-heading">${HK.GOOD[d.art]?HK.MenuArt.good(d.art):HK.MenuArt.place(d.art)}<b>${HK.t('shoreAction_'+action)}</b></div><div class="intrigue-price"><span>${HK.t('ig_cost')}</span><strong>${HK.fmt(q.cost??d.cost)} ${HK.t('mark')}</strong></div><p>${HK.t('shoreDesc_'+action)}</p>`;
  if(q.escrowUsed)h+=`<small>${HK.t('shoreEscrow',{value:q.escrowUsed})}</small>`;
  if(Object.keys(q.goods||{}).length)h+=`<small>${HK.t('shoreMaterials',{quality:q.quality})}</small><b>${Object.entries(q.goods).map(([g,n])=>`${n} ${HK.goodName(g)} (${HK.t('shoreStock',{n:HK.state.warehouse.stock[g]||0})})`).join(' · ')}</b><small>${HK.t('shoreBasis',{value:HK.fmt(q.basis)})}</small>`;
  if(q.ready)h+=`<small>${HK.t('shoreDate',{date:HK.fmtDate(q.ready)})}</small>`;
  if(action==='cheap')h+=`<small class="plan-risk">${HK.t('shoreRisk')}</small>`;
  if(Object.values(q.preview||{}).some(Boolean))h+=`<details><summary>${HK.t('ig_effects')}</summary>${this.intrigueEffects(q.preview)}</details>`;
  if(!q.ok)h+=`<small class="plan-risk">${HK.t(q.msg)}</small>`;
  return h+`<button class="small primary" data-action="shoreact" data-quest="${quest}" data-choice="${action}" data-phase="${T.phase}" ${q.ok?'':'disabled'}>${HK.t('shoreAction_'+action)}</button></article>`;
 },
 shorePanel(quest){
  const st=HK.state,S=st.shoreStory,T=quest==='main'?S:S?.[quest];if(!T||T.phase==='locked')return `<p>${HK.t('shoreGone')}</p>`;
  const choices=a=>`<div class="intrigue-choices">${a.map(k=>this.shoreChoice(quest,k)).join('')}</div>`;
  let h=`<button class="small work-back" data-action="missionfocus" data-value="">← ${HK.t('missionBack')}</button><section class="intrigue-story shore-story" data-quest="${quest}">${this.helpHeading('shoreTitle_'+quest,'shoreHelp',2)}${this.missionNext(this.shoreNext(quest))}`;
  const scene=quest==='neighbours'&&T.phase==='offer'?'neighbours':quest==='aftercare'&&T.phase==='offer'?'aftercare':quest==='main'&&['site','finance','inspection'].includes(S.phase)?S.phase:null;
  if(scene)h+=`<p>${HK.t('shoreScene_'+scene)}</p>`;
  if(S.site)h+=`<p>${HK.t('shoreSite_'+S.site)} <button class="small" data-action="shoremap">${HK.t('shoreMap')} ↗</button></p>`;
  if(quest==='main'){
   if(S.phase==='offer')h+=`<p>${HK.t('shoreIntro')}</p><details><summary>${HK.t('shoreBudget')}</summary><p>${HK.t('shoreBudgetSummary')}</p></details>`+choices(['start','decline']);
   if(S.due&&S.phase!=='done')h+=`<p class="intrigue-deadline">${HK.t('shoreDeadline',{date:HK.fmtDate(S.due)})}</p>`;
   if(S.phase==='survey')h+=`<p>${HK.t('shoreDate',{date:HK.fmtDate(S.surveyAt)})}</p>`;
   if(S.phase==='site')h+=choices(['quay','bank']);
   if(['site','finance'].includes(S.phase))h+=`<p>${HK.t(['account','aid'].includes(st.breadStory.ending)?'shorePreviousGood':'shorePreviousBad')}</p>`;
   if(S.phase==='finance')h+=choices(['own','sponsor','parish'])+`<details><summary>${HK.t('shoreBudget')}</summary><p>${HK.t('shoreFinanceHelp')}</p></details>`;
   if(S.phase==='contract')h+=`<p>${HK.t('shoreReadiness')}</p>${S.neighbours.phase==='offer'?this.shoreOpen('neighbours'):''}`+choices(['guild','cheap']);
   if(S.phase==='building')h+=`<p>${HK.t('shoreDate',{date:HK.fmtDate(S.buildAt)})}</p>`;
   if(S.phase==='inspection'){
    if(S.checked)h+=`<p class="${S.defect?'negative':'positive'}">${HK.t(S.defect?'shoreDefect':'shoreSound')}</p>`;
    h+=choices(!S.checked?['inspect']:S.defect?['repair','conceal']:['open']);
   }
   if(S.phase==='done'){h+=`<p>${HK.t('shoreEnd_'+S.ending)}</p>`;if(S.built)h+=this.shoreOpen('aftercare');}
   if(S.debt>0){h+=`<section><b>${HK.t('shoreDebt',{value:HK.fmt(S.debt),date:HK.fmtDate(S.debtDue)})}</b><p>${HK.t('shoreRepaid',{value:HK.fmt(S.repaid||0)})}</p>${S.repayment?`<p>${HK.t('shoreInstalments')}</p>`:''}<details><summary>${HK.t('shoreBudget')}</summary><p>${HK.t('shoreFinanceHelp')}</p>${choices(S.repayment?['repay']:['repay','instalments'])}</details></section>`;}
   if(S.debt===0&&S.repaid)h+=`<p class="positive">${HK.t('shoreDebtPaid')}</p><p>${HK.t('shoreRepaid',{value:HK.fmt(S.repaid)})}</p>`;
  }else if(quest==='neighbours'){
   h+=`<p>${(S.houses||[]).map(id=>this.esc(HK.burgherName(st.burghers[id]))).join(' · ')}</p>`;
   if(T.phase==='offer')h+=`<p>${HK.t('shoreReply',{date:HK.fmtDate(T.due)})}</p>`+choices(['compensate','hours','force']);
   else h+=`<p>${HK.t('shoreEnd_'+T.ending)}</p>`+this.shoreOpen('main');
  }else{
   if(T.phase==='waiting'||T.phase==='repairing')h+=`<p>${HK.t('shoreDate',{date:HK.fmtDate(T.phase==='waiting'?T.at:T.ready)})}</p>`;
   if(T.phase==='offer')h+=`<p class="${S.damaged?'negative':'positive'}">${HK.t(S.damaged?'shoreDamage':'shoreSound')}</p><p>${HK.t('shoreReply',{date:HK.fmtDate(T.due)})}</p>`+choices(S.damaged?['repair','abandon']:['certify','abandon']);
   if(T.phase==='done')h+=`<p>${HK.t('shoreEnd_'+T.ending)}</p>`;
   if(S.supportUntil)h+=`<p>${HK.t('shoreSupport',{n:HK.shoreSupport(st),date:HK.fmtDate(S.supportUntil)})}</p>`;
  }
  if(HK.shoreSound(st))h+=`<p class="hint">${HK.t('shoreBenefits_'+S.site)}</p>`;
  h+=`<details class="intrigue-history"><summary>${HK.t('shoreHistory')}</summary><p>${HK.t('breadCash')}: ${HK.fmt(S.cash)} ${HK.t('mark')} · ${HK.t('breadBasis')}: ${HK.fmt(S.basis)} ${HK.t('mark')}</p><p class="hint">${HK.t('breadAccounting')}</p><ol>${S.history.filter(e=>e.quest===quest).map(e=>`<li><small>${HK.fmtDate(e.day)} · ${this.esc(e.author)}</small><b>${HK.t('shoreAction_'+e.action)}</b>${this.intrigueEffects(e.delta)}</li>`).join('')}</ol></details>`;
  return h+'</section>';
 }
});
{
 const records=HK.UI.missionRecords;HK.UI.missionRecords=function(){const list=records.call(this),S=HK.state.shoreStory;for(const quest of ['main','neighbours','aftercare']){const T=quest==='main'?S:S?.[quest];if(T&&T.phase!=='locked')list.push({kind:'shore',value:quest,status:HK.shoreStatus(T)});}return list;};
 const panel=HK.UI.missionsPanel;HK.UI.missionsPanel=function(){return this.missionFocus?.startsWith('shore:')?this.shorePanel(this.missionFocus.slice(6)):panel.call(this);};
 const letter=HK.UI.postLetterBody;HK.UI.postLetterBody=function(m){
  if(m.type!=='shore')return letter.call(this,m);
  const r=m.ref;let key='shoreLetter_'+r.quest+'_'+r.stage;
  if(r.quest==='aftercare'&&r.stage==='offer')key='shoreLetter_aftercare_'+(r.damaged?'bad':'good');
  if(r.stage==='done'&&r.ending)key='shoreEnd_'+r.ending;
  const body=HK.I18N[HK.lang]?.[key]||HK.I18N.de[key];
  return `<p>${body?HK.t(key):HK.t('shoreLetter',{date:HK.fmtDate(m.day)})}</p>`+this.shoreOpen(r.quest);
 };
 const action=HK.UI.action;HK.UI.action=function(d){
  if(d.action==='shoreopen'){if(!['main','neighbours','aftercare'].includes(d.quest))return;this.missionFocus='shore:'+d.quest;this.setTab('missions');this.sidebar.scrollTop=0;return;}
  if(d.action==='shoreact'){this.result(HK.shoreAct(HK.state,d.quest,d.choice,d.phase));this.renderAll();return;}
  if(d.action==='shoremap'){const p=HK.shoreMapPoint(HK.state);HK.Scene.zeigeAuf(p.x,p.y);return;}
  return action.call(this,d);
 };
 // Small, pickable construction notice on public ground; existing roads and walls keep their geometry.
 HK.shoreMapPoint=st=>st.shoreStory.site==='quay'?{x:24.8,y:19.8}:{x:41.0,y:11.8};
 const city=HK.Scene.cityItems;HK.Scene.cityItems=function(items,st,...args){city.call(this,items,st,...args);const S=st.shoreStory;if(!S?.site||!['building','inspection'].includes(S.phase)&&!S.built)return;
  const p=HK.shoreMapPoint(st),I=HK.Iso;items.push({c:'shore-project',v:S.site+':'+S.phase+':'+!!S.damaged,box:[p.x,p.y,p.x+.34,p.y+.15],k:this.pointKey(p.x+.34,p.y+.15),pick:{kind:'shore-project',label:HK.t('shoreTitle_main')},f:ctx=>{
   I.box(ctx,p.x,p.y,0,.035,.035,.55,{wall:'#8f7958'});I.box(ctx,p.x+.30,p.y,0,.035,.035,.55,{wall:'#8f7958'});
   I.box(ctx,p.x,p.y,.34,.34,.035,.18,{wall:S.damaged?'#9b6952':S.built?'#74845c':'#bea679',top:'#c9b78a'});
   if(!S.built)I.box(ctx,p.x+.05,p.y+.06,0,.21,.10,.09,{wall:'#96957f',top:'#b4b29b'});
  }});
 };
 const click=HK.UI.sceneClick;HK.UI.sceneClick=function(hit){if(hit.kind==='shore-project'){this.action({action:'shoreopen',quest:HK.state.shoreStory.damaged?'aftercare':'main'});return;}return click.call(this,hit);};
}
