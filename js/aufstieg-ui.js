'use strict';
Object.assign(HK.UI,{
 middleMissionCard(){
  const M=HK.state.ascent.middle,path=HK.MIDDLE_PATHS[M.path],status=M.status==='archived'?'archived':M.status;
  let html=`<article class="mission-card ${status}" data-mission="middle">${this.missionHeader('intro',HK.t('middleTitle'),path?HK.ascentText(path.name):'',HK.MenuArt.place(path?.art||'kontor'),status)}`;
  if(!path)html+=`<p>${HK.t('middleHint')}</p>`+(M.status==='available'?`<div class="middle-paths">${Object.entries(HK.MIDDLE_PATHS).map(([id,p])=>`<button data-action="middlechoose" data-path="${id}">${HK.MenuArt.place(p.art)}<span>${HK.ascentText(p.name)}</span></button>`).join('')}</div>`:'');
  else {const steps=path.steps,n=steps.filter(s=>M.steps[s.id]!==undefined).length,next=steps.find(s=>M.steps[s.id]===undefined);html+=this.missionProgress(HK.t('introProgress',{n,m:steps.length}),n,steps.length);if(next&&M.status==='active')html+=this.missionNext(HK.ascentText(next.name))+`<button class="small primary" data-action="ascentplace" data-panel="${next.panel}">${HK.t('lehrgangZeig')}</button>`;html+=`<details class="mission-history"><summary>${HK.t('missionMilestones')}</summary><ol>${steps.map(s=>`<li>${M.steps[s.id]!==undefined?'✓ ':''}${HK.ascentText(s.name)}</li>`).join('')}</ol></details>`;}
  if(['active','available'].includes(M.status))html+=`<button class="small link" data-action="middlearchive">${HK.t('middleArchive')}</button>`;
  if(M.status==='archived')html+=`<button class="small" data-action="middlerestore">${HK.t('middleRestore')}</button>`;
  return html+'</article>';
 },
 ascentAchievements(){
  const st=HK.state,A=st.ascent;if(!A)return'';
  return `<section><details class="ascent-achievements"><summary>${HK.t('ascentAchievements')} · ${Object.keys(A.achievements).length}/${Object.keys(HK.ASCENT_ACHIEVEMENTS).length}</summary><small>${HK.t('ascentObserved',{date:HK.fmtDate(A.since)})}</small><div class="achievement-list">${Object.entries(HK.ASCENT_ACHIEVEMENTS).map(([id,d])=>`<article><b>${A.achievements[id]!==undefined?'✓ ':''}${HK.ascentText(d.name)}</b><small>${HK.ascentText(d.goal)}</small>${A.achievements[id]!==undefined?`<small>${HK.fmtDate(A.achievements[id])}</small>`:this.missionProgress(`${Math.min(d.target,Math.floor(d.value(st)))}/${d.target}`,d.value(st),d.target)}</article>`).join('')}</div></details></section>`;
 },
 factorReportBody(report){
  const content=report.rows.map((r,i)=>{
   const text=this.postText('factor_'+r.kind,{qty:r.qty,good:r.good?HK.goodName(r.good):'',date:HK.fmtDate(r.due??r.since??report.day),cost:HK.fmt(r.cost||0),price:r.price,buyer:r.buyer,site:r.site?HK.name(HK.RURAL_BUILDINGS[r.site]):'',reason:r.reason?HK.t(r.reason):''});
   return `<span class="factor-report-row">${text}<button class="small" data-action="reportgo" data-day="${report.day}" data-index="${i}">${HK.t('ascentGo')} →</button></span>`;
  }).join('');
  return this.postText('factorReportIntro',{name:report.name,date:HK.fmtDate(report.day)})+content;
 },
});
{
 const records=HK.UI.missionRecords;HK.UI.missionRecords=function(){const list=records.call(this),M=HK.state.ascent?.middle;if(M&&M.status!=='locked')list.push({kind:'middle',status:M.status});return list;};
 const overview=HK.UI.renderOverview;HK.UI.renderOverview=function(){return overview.call(this)+this.ascentAchievements();};
 const chronicle=HK.UI.showChronicle;HK.UI.showChronicle=function(){chronicle.call(this);const decorate=()=>{this.$('modal').querySelector('.modal-actions')?.insertAdjacentHTML('beforebegin',this.ascentAchievements());};decorate();const redraw=this.modalRender;this.modalRender=()=>{redraw();decorate();};};
 const price=HK.UI.priceChart;HK.UI.priceChart=function(good){
  const rows=(HK.state.ascent?.prices||[]).filter(p=>p.good===good).slice(-8).reverse();
  return price.call(this,good)+`<details class="market-details visitor-history"><summary>${HK.t('visitorObservations')}</summary><p class="hint">${HK.t('visitorObservationHelp')}</p>${rows.length?rows.map(r=>`<div class="visitor-price-row"><span><b>${HK.name(HK.ORIGIN[r.origin])}</b> · ${HK.fmtDate(r.day)}<small>${this.esc(r.name)} · ${r.qty} ${HK.t('unitLast')} · ${HK.t('cityQualityLabel',{quality:Math.round(r.quality)})}</small></span><span>${HK.t(r.direction==='buy'?'buy':'sell')}<strong>${r.price} ${HK.t('mark')}</strong></span></div>`).join(''):`<p>${HK.t('priceHistoryEmpty')}</p>`}</details>`;
 };
 const letter=HK.UI.postLetterBody;HK.UI.postLetterBody=function(m){if(m.type==='factorReport')return this.factorReportBody(m.ref.report);return letter.call(this,m);};
 const office=HK.UI.panel_kontor;HK.UI.panel_kontor=function(){let html=office.call(this);if(!HK.state.factor)return html;const m=HK.state.post.messages.filter(m=>m.type==='factorReport').at(-1);return html+`<div class="factor-report-link">${m?`<button class="small" data-action="reportopen" data-id="${m.id}">${HK.t('ascentReportOpen')} · ${HK.fmtDate(m.day)}</button>`:`<small>${HK.t('ascentReportsNone')}</small>`}</div>`;};
 const action=HK.UI.action;HK.UI.action=function(d){const st=HK.state;
  if(d.action==='middlechoose')this.result(HK.middleChoose(st,d.path));
  else if(d.action==='middlearchive')this.result(HK.middleArchive(st));
  else if(d.action==='middlerestore')this.result(HK.middleRestore(st));
  else if(d.action==='reportopen'){this.postSelected=+d.id;this.postMode='letters';HK.postRead(st,+d.id);this.setTab('mail');return;}
  else if(d.action==='ascentplace'||d.action==='reportgo'){
   const report=st.post.messages.find(m=>m.type==='factorReport'&&m.ref.report.day===+d.day)?.ref.report;
   const target=d.action==='reportgo'?report?.rows[+d.index]:{panel:d.panel};if(!target)return;
   if(target.good)this.marketGood=target.good;
   if(target.site){this.action({action:'ruralopen',site:target.site});return;}
   if(target.visitor!==undefined){const visitor=HK.findVisitor(st,target.visitor);if(visitor){this.sceneClick({kind:'visitor',id:visitor.id,panel:visitor.sea?'harbour':'gate'});return;}this.toast(HK.t('postShipLeft'),'info');}
   if(target.tab)this.setTab(target.tab);
   else{const b=HK.BUILDINGS.find(b=>b.panel===target.panel);if(b)this.sceneClick({kind:'building',building:b,panel:target.panel});else{this.panel=target.panel;this.setTab('place');}}return;
  }else return action.call(this,d);
  HK.scheduleSave?.();this.renderAll();
 };
}
Object.assign(HK.I18N.de,{workStatus_archived:'Archiviert'});Object.assign(HK.I18N.en,{workStatus_archived:'Archived'});
