'use strict';
HK.intrigueStatus=S=>S.phase==='offer'?'available':S.phase==='done'?(S.ending==='expired'?'failed':'done'):'active';
Object.assign(HK.UI,{
 intrigueNext(story){const S=HK.state.intrigue[story];return HK.t(S.phase==='done'?'ig_end_'+S.ending:'ig_next_'+story+'_'+S.phase);},
 intrigueArt(story){return HK.MenuArt.place(story==='property'?'house':story==='witness'?'dive':'guild');},
 intrigueOpenButton(story){return `<button class="small" data-action="intrigueopen" data-story="${story}">${HK.t('ig_open')} →</button>`;},
 intrigueMissionCard(story,status){
  const S=HK.state.intrigue[story];
  return `<article class="mission-card ${status}" data-mission="intrigue-${story}">${this.missionHeader('story',HK.t('ig_title_'+story),'',this.intrigueArt(story),status)}${this.missionNext(this.intrigueNext(story))}${S.due&&S.phase!=='done'?`<small>${HK.t('ig_until',{date:HK.fmtDate(S.due)})}</small>`:''}<div class="mission-actions">${this.intrigueOpenButton(story)}</div></article>`;
 },
 intrigueEffects(e){
  return `<div class="intrigue-effects">${Object.entries(e||{}).filter(([,v])=>v).map(([k,v])=>`<span class="${(k==='suspicion'?v<0:v>0)?'positive':'negative'}">${HK.FACTION_IDS.includes(k)?HK.FACTIONS[k][HK.LANG]:HK.t(k)} <b>${v>0?'+':''}${HK.fmt(v)}${k==='money'?' '+HK.t('mark'):''}</b></span>`).join('')}</div>`;
 },
 intrigueChoice(story,choice){
  const st=HK.state,S=st.intrigue[story],q=HK.intrigueQuote(st,story,choice,S.phase),d=HK.INTRIGUE_PREP[choice];
  const effects=q.preview||d?.effects||{},cost=q.cost??d?.cost;
  let h=`<article class="intrigue-choice ${q.ok?'':'unavailable'}"><div class="plan-heading">${HK.MenuArt.place(q.art||d?.art||'guild')}<b>${HK.t('ig_action_'+choice)}</b></div>`;
  if(cost)h+=`<div class="intrigue-price"><span>${HK.t('ig_cost')}</span><strong>${HK.fmt(cost)} ${HK.t('mark')}</strong></div>`;
  if(q.days)h+=`<small class="work-duration">${HK.t('workDuration',{days:q.days,date:HK.fmtDate(st.day+q.days)})}</small>`;
  if(q.days&&S.due&&st.day+q.days>S.due)h+=`<small class="plan-risk">${HK.t('workTooLate')}</small>`;
  if(q.delayedPreview)h+=`<details><summary>${HK.t('workAfterCompletion')}</summary>${this.intrigueEffects(q.delayedPreview)}</details>`;
  if(q.income)h+=`<div class="intrigue-price"><span>${HK.t('ig_income')}</span><strong class="positive">+${HK.fmt(q.income)} ${HK.t('mark')}</strong></div>`;
  if(q.project)h+=`<b>${this.esc(HK.name(HK.PROJECTS.find(p=>p.id===q.project)))}</b>`;
  h+=`<p>${HK.t(choice==='start'?'ig_intro_'+story:'ig_desc_'+choice)}</p>`;
  if(q.chance||d?.chance)h+=`<strong class="plan-risk">${HK.t('ig_chance',{n:Math.round((q.chance||d.chance)*100)})}</strong>`;
  if(q.dirty||d?.dirty)h+=`<small class="plan-risk">${HK.t(st.intrigue.witness.phase==='done'?'ig_dirtyResolved':st.intrigue.witness.phase==='locked'?'ig_dirty':'ig_dirtyPending')}</small>`;
  if(Object.values(effects).some(Boolean)||q.failed||d?.failed)h+=`<details class="intrigue-consequences"><summary>${HK.t('ig_effects')}</summary>${this.intrigueEffects(effects)}${q.failurePreview?`<small>${HK.t('ig_failureTotal')}</small>${this.intrigueEffects(q.failurePreview)}`:''}</details>`;
  if(!q.ok)h+=`<small class="plan-risk">${HK.t(q.msg)}</small>`;
  return h+`<button class="small ${['withdraw','retarget','breakpact'].includes(choice)?'':'primary'}" data-action="intrigueact" data-story="${story}" data-choice="${choice}" data-phase="${S.phase}" ${q.ok?'':'disabled'}>${HK.t('ig_action_'+choice)}</button></article>`;
 },
 intriguePanel(story){
  const st=HK.state,S=st.intrigue?.[story];if(!S||['locked','pending'].includes(S.phase))return `<p>${HK.t('igGone')}</p>`;
  let h=`<button class="small work-back" data-action="missionfocus" data-value="">← ${HK.t('missionBack')}</button><section class="intrigue-story" data-story="${story}">${this.helpHeading('ig_title_'+story,'igHelp',2)}${this.missionNext(this.intrigueNext(story))}`;
  if(S.due&&S.phase!=='done')h+=`<p class="intrigue-deadline">${HK.t('ig_until',{date:HK.fmtDate(S.due)})}</p>`;
  if(story==='property'){
   const house=st.houses[S.house],b=HK.BUILDINGS.find(b=>b.panel==='house'&&b.plot===S.house),price=house&&HK.housePrice(st,house);
   if(house)h+=`<div class="intrigue-property"><div class="plan-heading">${this.intrigueArt(story)}<div><small>${HK.t('ig_house')}</small><b>${this.esc(b?HK.name(b):HK.t('house'))}</b><small>${HK.t('level',{level:house.level})} · ${house.owner==='player'?HK.t('yours'):house.owner==='npc'?HK.t('ig_forSale'):HK.rivalName(house.owner)}${house.damaged?' · '+HK.t('damaged'):''}</small></div></div>${house.owner!=='player'&&price!==null?`<p>${HK.t('ig_purchaseBudget',{price:HK.fmt(price),upgrade:HK.fmt(HK.CONST.HOUSE_UPGRADE),repair:HK.fmt(house.damaged?800:0)})}</p>`:''}${b?`<button class="small" data-action="businessplace" data-building="${b.id}">${HK.t('ig_showHouse')} ↗</button>`:''}</div>`;
  }
  if(S.phase==='offer'&&story!=='witness')h+=`<div class="intrigue-choices">${this.intrigueChoice(story,'start')}${this.intrigueChoice(story,'withdraw')}</div>`;
  else if(story==='monopoly'&&S.phase==='preparing'){
   h+=`<div class="intrigue-dossier"><b>${HK.t('ig_case',{n:S.evidence})}</b><b>${HK.t('ig_support',{n:S.support+HK.intrigueBacked(st)})}</b></div><p class="hint">${HK.t('ig_chooseOne')}</p>`;
   if(HK.intrigueBacked(st))h+=`<small>${HK.t('ig_houseSupport')}</small>`;
   if(S.pending)h+=`<p>${HK.t('ig_pending',{date:HK.fmtDate(S.pending)})}</p>`;
   for(const group of ['evidence','support','pressure']){
    const open=group==='evidence'&&!S.choices.evidence||group==='support'&&S.choices.evidence&&!S.choices.support;
    h+=`<details class="intrigue-group" ${open?'open':''}><summary>${S.choices[group]?(S.history.find(e=>e.action===S.choices[group])?.success===false?'✕ ':'✓ '):''}${HK.t('ig_group_'+group)}</summary>`;
    if(S.choices[group]){const failed=S.history.find(e=>e.action===S.choices[group])?.success===false;h+=`<p class="${failed?'negative':'intrigue-chosen'}">${failed?'✕':'✓'} ${HK.t('ig_chosen',{choice:HK.t('ig_action_'+S.choices[group])})}${failed?' · '+HK.t('ig_failed'):''}</p><p>${HK.t(failed?'ig_after_failed':S.choices[group]==='audit'&&!S.pending?'ig_after_auditReady':'ig_after_'+S.choices[group])}</p>`;}
    else h+=`<div class="intrigue-choices">${Object.keys(HK.INTRIGUE_PREP).filter(k=>HK.INTRIGUE_PREP[k].group===group).map(k=>this.intrigueChoice(story,k)).join('')}</div>`;
    h+='</details>';
   }
   if(S.choices.evidence&&S.evidence<2&&!S.pending&&!S.choices.recovery)h+=this.intrigueChoice(story,'recover');
   h+=`<details class="intrigue-group" ${S.evidence>=2&&S.support+HK.intrigueBacked(st)>=2?'open':''}><summary>${HK.t('ig_group_resolution')}</summary><div class="intrigue-choices">${['pact','lease','sellout'].map(k=>this.intrigueChoice(story,k)).join('')}</div></details><details><summary>${HK.t('ig_action_withdraw')}</summary>${this.intrigueChoice(story,'withdraw')}</details>`;
   const rival=st.rivals.find(r=>r.id==='kruse');if(rival?.intrigueBlockedUntil>st.day)h+=`<p>${HK.t('ig_sabotaged',{date:HK.fmtDate(rival.intrigueBlockedUntil)})}</p>`;
  }else if(story==='property'&&S.phase!=='done'){
   const actions=S.phase==='acquire'?['buy','retarget']:S.phase==='renovate'?[st.houses[S.house].damaged?'repair':'upgrade','sell']:['keep','sell'];
   h+=`<div class="intrigue-choices">${actions.map(k=>this.intrigueChoice(story,k)).join('')}</div><details><summary>${HK.t('ig_action_withdraw')}</summary>${this.intrigueChoice(story,'withdraw')}</details>`;
  }else if(story==='witness'&&S.phase==='offer')h+=`<p>${HK.t('ig_intro_witness')}</p><div class="intrigue-choices">${['pay','confess','expose'].map(k=>this.intrigueChoice(story,k)).join('')}</div>`;
  if(story==='monopoly'&&st.intrigue.pact)h+=`<p class="positive">${HK.t('ig_pactActive')}</p><details><summary>${HK.t('ig_action_breakpact')}</summary>${this.intrigueChoice(story,'breakpact')}</details>`;
  if(S.history.length)h+=`<details class="intrigue-history"><summary>${HK.t('ig_history')}</summary><div class="intrigue-price"><span>${HK.t('ig_cash')}</span><strong>${S.cash>0?'+':''}${HK.fmt(S.cash)} ${HK.t('mark')}</strong></div><small>${HK.t('ig_cashHelp')}</small><ol>${S.history.map(e=>`<li><small>${HK.fmtDate(e.day)} · ${this.esc(e.author)}</small><b>${HK.t('ig_action_'+e.action)}</b>${e.success===false?`<strong class="negative">${HK.t('ig_failed')}</strong>`:''}${this.intrigueEffects(e.delta)}</li>`).join('')}</ol></details>`;
  return h+'</section>';
 }
});
{
 const records=HK.UI.missionRecords;HK.UI.missionRecords=function(){const list=records.call(this);for(const story of ['monopoly','property','witness']){const S=HK.state.intrigue?.[story];if(S&&!['locked','pending'].includes(S.phase))list.push({kind:'intrigue',value:story,status:HK.intrigueStatus(S)});}return list;};
 const missions=HK.UI.missionsPanel;HK.UI.missionsPanel=function(){return this.missionFocus?.startsWith('intrigue:')?this.intriguePanel(this.missionFocus.slice(9)):missions.call(this);};
 const letter=HK.UI.postLetterBody;HK.UI.postLetterBody=function(m){if(m.type==='intrigue')return `<b>${HK.t('ig_title_'+m.ref.story)}</b><br>${HK.t('ig_letter',{date:HK.fmtDate(m.day)})}<br>${this.intrigueNext(m.ref.story)}<br>${this.intrigueOpenButton(m.ref.story)}`;return letter.call(this,m);};
 const lease=HK.UI.panel_monopolyLease;HK.UI.panel_monopolyLease=function(){const h=lease.call(this);return HK.state.intrigue.pact?h+`<section><p>${HK.t('ig_pactActive')}</p>${this.intrigueOpenButton('monopoly')}</section>`:h;};
 const action=HK.UI.action;HK.UI.action=function(d){
  if(d.action==='intrigueopen'){if(!['monopoly','property','witness'].includes(d.story))return;this.missionFocus='intrigue:'+d.story;this.setTab('missions');this.sidebar.scrollTop=0;return;}
  if(d.action==='intrigueact'){const result=HK.intrigueAct(HK.state,d.story,d.choice,d.phase);this.result(result);if(result.ok&&result.success===false)this.toast(HK.t('ig_failed'),'bad');this.renderAll();return;}
  return action.call(this,d);
 };
}
