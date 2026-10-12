'use strict';
Object.assign(HK.UI, {
  missionFilter:'all',missionFocus:null,postFilter:'inbox',postSelected:null,postMode:'letters',journalFilter:'all',journalQuery:'',
  postText(key,vars={}) {return HK.t(key,Object.fromEntries(Object.entries(vars).map(([k,v])=>[k,typeof v==='string'?this.esc(v):v])));},
  workHeading(title,hint,icon) {return `<div class="work-heading">${HK.MenuArt.symbol(icon)}<div>${this.helpHeading(title,hint,2)}</div></div>`;},
  workFilters(action,current,options) {return `<div class="work-filters">${options.map(([id,key])=>`<button class="small ${current===id?'active':''}" data-action="${action}" data-value="${id}" aria-pressed="${current===id}">${HK.t(key)}</button>`).join('')}</div>`;},
  missionContractCard(c,status) {
    const st=HK.state,active=status==='active',finished=['done','failed'].includes(status),good=c.type==='deliver',have=good?Math.min(c.qty,Math.floor(st.warehouse.stock[c.good]||0)):0;
    const title=c.tradeTitle?HK.t('tradeTitle_'+c.tradeTitle):c.cityStory?HK.t('cityTitle_'+c.cityStory):HK.t('giver_'+c.giver)+' · '+(good?HK.goodName(c.good):HK.name(HK.ORIGIN[c.dest]));
    const due=active?c.deadline:c.deliverBy;
    let html=`<article class="mission-card ${status}" data-contract="${c.id}">${this.missionHeader(good?'delivery':'voyage',title,HK.t('giver_'+c.giver),good?HK.MenuArt.good(c.good):HK.MenuArt.place('harbour'),status)}<div class="mission-terms"><b>${HK.t('tradeFixedRevenue')}: ${HK.fmt(c.reward)} ${HK.t('mark')}</b><small>${finished?HK.fmtDate(c.finished):due!==undefined?HK.t('tradeDue')+': '+HK.fmtDate(due):HK.t('missionAfterAccept',{days:c.days})}</small></div>`;
    if(!finished) {
      if(good) {
        html+=this.missionProgress(`${HK.goodName(c.good)} · ${HK.t('saltStockCompact',{have,qty:c.qty})}`,have,c.qty);
        if(c.minQuality)html+=`<small>${HK.t('cityMinQuality',{quality:c.minQuality})}</small>${this.cityQualityBadge(HK.goodQuality(st,c.good))}`;
      }else html+=`<p>${HK.t(c.shipId?'missionShipAssigned':'missionShipNeeded')}</p>`;
      html+=`<small>${HK.t('tradePenalty',{penalty:Math.round(c.reward*.15)})}</small>`;
      const next=!active?(st.contracts.active.length>=3?'missionSlotsFull':'missionAcceptNext'):st.day>c.deadline?'missionDeadlinePassed':good?(have<c.qty?'missionStockNext':c.minQuality&&HK.goodQuality(st,c.good)<c.minQuality?'missionQualityNext':'missionDeliverNext'):(c.shipId?'missionVoyageWait':'missionShipNeeded');
      html+=this.missionNext(HK.t(next))+'<div class="mission-actions">';
      if(!active)html+=`<small>${HK.t('missionOfferUntil',{date:HK.fmtDate(c.expires-1)})}</small><button class="small primary" data-action="acceptcontract" data-id="${c.id}" ${st.contracts.active.length>=3?'disabled':''}>${HK.t('tradePromise')}</button>`;
      else {
        if(good)html+=`<button class="small primary" data-action="missionvisit" data-id="${c.id}">${HK.t('missionVisitRecipient',{name:HK.t('giver_'+c.giver)})}</button>`;
        html+=`<button class="small" data-action="missionsources" data-id="${c.id}">${HK.t('missionFindSources')}</button>`;
      }
    }
    if(!finished)html+='</div>';
    return html+'</article>';
  },
  introMission(detailed=false) {
    const L=HK.state.lehrgang;if(!L)return '';
    const n=HK.LEHRGANG.length,step=HK.lehrgangSchritt(HK.state),done=L.fertig;
    let html=`<article class="mission-card intro-mission ${done?'done':'active'}" data-mission="intro">${this.missionHeader('intro',HK.t('lehrgang'),done&&L.finished!==undefined?HK.fmtDate(L.finished):'',HK.MenuArt.book('missions'),done?'done':'active')}${this.missionProgress(HK.t('introProgress',{n:Math.min(L.schritt,n),m:n}),Math.min(L.schritt,n),n)}`;
    if(!detailed)return html+(step?this.missionNext(HK.t('lg_'+step.id+'_titel')):'')+`<div class="mission-actions"><button class="small" data-action="missionfocus" data-value="intro">${HK.t('introOpen')}</button></div></article>`;
    if(step)html+=`<div class="intro-task"><h3>${HK.t('lg_'+step.id+'_titel')}</h3><p>${HK.t('lg_'+step.id+'_text')}</p>${step.lohn?`<small class="lg-lohn">${HK.t('lehrgangLohn',{lohn:HK.lehrgangLohnText(step.lohn)})}</small>`:''}<button class="small primary" ${step.ziel?'data-action="lehrgang" data-lg="zeig"':'data-action="introtime"'}>${HK.t(step.ziel?'lehrgangZeig':'introStartTime')}</button></div>`;
    html+=`<ol class="intro-steps">${HK.LEHRGANG.map((s,i)=>`<li class="${i<L.schritt?'done':i===L.schritt?'current':''}" ${i===L.schritt?'aria-current="step"':''}><span aria-hidden="true">${i<L.schritt?'✓':i+1}</span><div><b>${HK.t('lg_'+s.id+'_titel')}</b>${s.lohn?`<small>${HK.lehrgangLohnText(s.lohn)}</small>`:''}</div></li>`).join('')}</ol></article>`;
    return html;
  },
  missionHeader(kind,title,subtitle,art,status) {
    return `<div class="mission-heading">${art}<div><div class="mission-meta"><small>${HK.t('missionKind_'+kind)}</small><span class="tag">${HK.t('workStatus_'+status)}</span></div><b class="mission-title">${title}</b>${subtitle?`<small>${subtitle}</small>`:''}</div></div>`;
  },
  missionProgress(text,value,max) {
    return `<div class="mission-progress"><p>${text}</p><progress value="${Math.max(0,Math.min(value,max))}" max="${max}" aria-label="${this.esc(text)}"></progress></div>`;
  },
  missionNext(text) {return `<p class="mission-next"><small>${HK.t('introNext')}</small>${text}</p>`;},
  missionRecords() {
    const st=HK.state,S=st.saltStory,records=[];
    if(st.lehrgang&&(!st.lehrgang.fertig||st.lehrgang.finished!==undefined))records.push({kind:'intro',status:st.lehrgang.fertig?'done':'active'});
    if(S&&(S.phase!=='offer'||HK.introStage(st)===2))records.push({kind:'salt',status:S.phase==='offer'?'available':S.phase==='done'?'done':S.phase==='failed'?'failed':'active'});
    if(st.chapters&&(HK.introStage(st)===2||st.chapters.step>0))records.push({kind:'chapter',status:st.chapters.step<3?'active':'done'});
    for(const ch of st.chains.active)records.push({kind:'chain',status:'active',value:ch});
    for(const c of st.contracts.active.filter(c=>!c.saltStory))records.push({kind:'contract',status:'active',value:c});
    for(const c of st.contracts.offers.filter(c=>!c.saltStory&&c.expires>st.day))records.push({kind:'contract',status:'available',value:c});
    for(const c of st.post.contracts.filter(c=>!c.saltStory).slice().reverse())records.push({kind:'contract',status:c.status,value:c});
    for(const ch of st.chains.history.slice().reverse())records.push({kind:'chain',status:'done',value:ch});
    return records;
  },
  missionSaltCard(status) {
    const st=HK.state,S=st.saltStory,c=HK.saltContract(st),first=S.receipts.find(r=>r.leg==='salt'),second=S.receipts.find(r=>r.leg==='fish');
    let html=`<article class="mission-card ${status}" data-mission="salt">${this.missionHeader('story',HK.t('saltTitle'),'Jakob Wessel · Ludeke Horn · Everd Kruse',HK.MenuArt.good(c?.good||'salt'),status)}`;
    if(c){
      const have=Math.min(c.qty,Math.floor(st.warehouse.stock[c.good]||0));
      html+=`<div class="mission-terms"><b>${HK.t('tradeFixedRevenue')}: ${HK.fmt(c.reward)} ${HK.t('mark')}</b><small>${HK.t('tradeDue')}: ${HK.fmtDate(c.deadline)}</small></div>`;
      html+=this.missionProgress(`${HK.goodName(c.good)} · ${HK.t('saltStockCompact',{have,qty:c.qty})}`,have,c.qty);
      if(c.minQuality)html+=`<small>${HK.t('cityMinQuality',{quality:c.minQuality})}</small>${this.cityQualityBadge(HK.goodQuality(st,c.good))}`;
      html+=`<small>${HK.t('tradePenalty',{penalty:Math.round(c.reward*.15)})}</small>`;
      html+=this.missionNext(HK.t(st.day>c.deadline?'missionDeadlinePassed':have<c.qty?'missionSaltProcure':c.minQuality&&HK.goodQuality(st,c.good)<c.minQuality?'missionQualityNext':'missionSaltDeliver'));
    }else html+=this.missionNext(HK.t(S.phase==='followOffer'?'missionSaltOptional':status==='available'?'missionSaltReview':status==='failed'?'missionReviewFailure':'missionStoryFinished'));
    html+=`<details class="mission-history"><summary>${HK.t('missionMilestones')}</summary><ol class="mission-steps"><li class="${first&&!first.failed?'done':''}">${first&&!first.failed?'✓':'1.'} ${HK.t('saltFirstOrder')}</li><li class="${second&&!second.failed?'done':''}">${second&&!second.failed?'✓':'2.'} ${HK.t('saltSecondOrder')} <small>${HK.t('missionOptional')}</small></li></ol></details><div class="mission-actions"><button class="small" data-action="missionfocus" data-value="salt">${HK.t('missionOpen')}</button></div></article>`;
    return html;
  },
  missionChainCard(ch,status) {
    let html=`<article class="mission-card ${status}" data-mission="chain-${this.esc(ch.id)}">${this.missionHeader('story',HK.t('chainName_'+ch.id),status==='done'?HK.fmtDate(ch.day):'',HK.MenuArt.book('log'),status)}`;
    if(status==='active'){
      const sd=HK.CHAINS[ch.id].stages[ch.stage];
      html+=`<p>${HK.t('missionStage')}: <b>${HK.t('stage_'+ch.id+'_'+ch.stage)}</b></p>`;
      html+=this.missionNext(HK.t(sd.choices?'missionDecision':'missionNextStage',{days:Math.max(0,(sd.days||0)-(HK.state.day-ch.since))}));
      if(sd.choices)html+=`<div class="mission-actions"><button class="small" data-action="postdecision" data-id="${ch.id}">${HK.t('missionDecision')}</button></div>`;
    }
    if(ch.steps?.length)html+=`<details class="mission-history"><summary>${HK.t('missionMilestones')}</summary><ol class="mission-steps">${ch.steps.map((step,i)=>`<li>${status==='active'&&i===ch.steps.length-1?'→':'✓'} ${HK.t('stage_'+ch.id+'_'+step.stage)} <small>${HK.fmtDate(step.day)}</small></li>`).join('')}</ol></details>`;
    return html+'</article>';
  },
  missionsPanel() {
    const st=HK.state,filter=this.missionFilter,records=this.missionRecords();
    let html=this.workHeading('missionsTitle','missionsHint','missions');
    if(this.missionFocus==='intro'&&st.lehrgang?.fertig&&filter!=='finished')this.missionFocus=null;
    if(this.missionFocus==='intro')return html+`<button class="small work-back" data-action="missionfocus" data-value="">← ${HK.t('missionBack')}</button>`+this.introMission(true);
    if(this.missionFocus==='salt')return html+`<button class="small work-back" data-action="missionfocus" data-value="">← ${HK.t('missionBack')}</button>`+this.saltStoryPanel();
    const counts={active:records.filter(r=>r.status==='active').length,available:records.filter(r=>r.status==='available').length,finished:records.filter(r=>['done','failed','archived'].includes(r.status)).length};
    html+=`<div class="work-summary mission-summary"><span><strong data-mission-count="active">${counts.active}</strong>${HK.t('missionRunningCount')}</span><span><strong data-mission-count="available">${counts.available}</strong>${HK.t('missionAvailableCount')}</span><span><strong data-mission-count="finished">${counts.finished}</strong>${HK.t('workFinished')}</span></div>`;
    if(HK.introStage(st)<2)html+=`<p class="hint intro-focus-note">${HK.t('introQuiet')} <button class="small link" data-action="introexplore">${HK.t('introExplore')}</button></p>`;
    html+=this.workFilters('missionfilter',filter,[['all','missionAllOpen'],['active','workStatus_active'],['available','workStatus_available'],['finished','workFinished']]);
    const shown=records.filter(r=>filter==='all'?['active','available'].includes(r.status):filter==='finished'?['done','failed','archived'].includes(r.status):r.status===filter);
    shown.sort((a,b)=>(a.status==='available'?1:0)-(b.status==='available'?1:0));
    html+='<div class="mission-list">';
    for(const r of shown)html+=this[r.kind+'MissionCard']?this[r.kind+'MissionCard'](r.value,r.status):r.kind==='intro'?this.introMission():r.kind==='salt'?this.missionSaltCard(r.status):r.kind==='chapter'?this.chapterPanel():r.kind==='chain'?this.missionChainCard(r.value,r.status):this.missionContractCard(r.value,r.status);
    return html+(shown.length?'':`<p class="hint mission-empty">${HK.t('missionEmpty_'+(filter==='all'?'open':filter))}</p>`)+'</div>';
  },
  postLetterBody(m) {
    const st=HK.state,r=m.ref,v=m.vars;
    if(m.type==='saltOffer')return HK.t('saltIntro')+'<br>'+HK.t('postSaltOfferTerms')+'<br>'+HK.t('saltOpening');
    if(m.type==='saltRival')return this.postText('saltRivalWarning',{rival:HK.rivalName('kruse'),date:HK.fmtDate(st.saltStory.rivalAt)});
    if(m.type==='saltWind')return this.postText('saltWindWarning',{date:HK.fmtDate(st.saltStory.windAt)})+' '+HK.t('saltTerms_pilot');
    if(m.type==='saltFollow')return HK.t('saltFollowText');
    if(m.type==='saltReceipt')return this.postText('saltDelivered',v);
    if(m.type==='city')return HK.t('cityText_'+v.type);
    if(m.type==='news')return HK.t('tradeNewsText_'+v.type)+' '+HK.t(v.confirmed?v.happens?'tradeConfirmed':'tradeDenied':'tradeReliability',{chance:Math.round(v.confidence*100)});
    if(m.type==='incoming') {const inc=st.incoming.find(i=>i.id===r.id);return this.postText('postIncomingBody',{origin:v.origin==='umland'?HK.t('postFromCountryside'):HK.name(HK.ORIGIN[v.origin]),good:HK.goodName(v.good),qty:v.qty})+' '+(inc?this.tradeArrivalHint(inc):HK.t('postPastArrival'));}
    if(m.type==='ship')return this.postText('postShipBody',{name:v.name,origin:HK.name(HK.ORIGIN[v.origin])})+' '+(!HK.findVisitor(st,r.id)?HK.t('postShipLeft'):'');
    if(m.type==='contract') {const c=[...st.contracts.offers,...st.contracts.active,...st.post.contracts].find(c=>c.id===r.id);if(!c)return HK.t('postGone');const due=c.deadline??c.deliverBy;return this.postText(c.type==='voyage'?'postVoyageBody':'postContractBody',{qty:c.qty||'',good:c.good?HK.goodName(c.good):'',dest:c.dest?HK.name(HK.ORIGIN[c.dest]):'',reward:c.reward})+'<br>'+HK.t('tradeDue')+': '+(due!==undefined?HK.fmtDate(due):HK.t('missionAfterAccept',{days:c.days}))+' · '+HK.t('tradePenalty',{penalty:Math.round(c.reward*.15)})+(c.minQuality?'<br>'+HK.t('cityMinQuality',{quality:c.minQuality}):'')+(c.shady?'<br>'+HK.t('shady'):'')+(st.contracts.offers.includes(c)?'<br>'+HK.t('missionOfferUntil',{date:HK.fmtDate(c.expires-1)}):'');}
    if(m.type==='houseSale')return this.postText('postHouseSaleBody',{price:v.price});
    if(m.type==='houseRepair')return HK.t('postHouseRepairBody');
    if(m.type==='houseRent')return HK.t('postHouseRentBody');
    if(m.type==='family'){const o=st.family.offer;return o&&o.name===r.name&&o.family===r.family&&st.family.nextOffer===r.offerId?this.postText('offer_'+o.house,{name:o.name,family:o.family,dowry:HK.fmt(o.dowry),rival:o.rival?HK.rivalName(o.rival):''})+' '+HK.t('offerEffect_'+o.house):this.postText('postFamilyBody',r);}
    if(m.type==='chain') {const ch=st.chains.active.find(c=>c.id===r.id),current=ch?.stage===r.stage&&ch.since===r.since,sd=HK.CHAINS[r.id].stages[r.stage],vars={...v,good:v.good?HK.goodName(v.good):'',qty:v.qty||'',price:v.price||'',cost:HK.fmt((v.qty||0)*(v.price||0))};if(typeof vars.tithe==='number')vars.tithe=HK.fmt(vars.tithe);return HK.t('chainName_'+r.id)+' · '+HK.t('stage_'+r.id+'_'+r.stage)+'<br>'+ (sd.choices?this.postText('dec_'+r.id+'_'+r.stage,vars):r.stage===Object.keys(HK.CHAINS[r.id].stages)[0]?HK.t('chainStart_'+r.id):'')+(!current?' · '+HK.t('postPastStage'):'');}
    if(m.type==='contact') {
      if(m.sender==='church')return HK.t('postChurchBody');
      if(m.sender==='council')return HK.t('postCouncilBody');
      if(m.sender.startsWith('person:'))return this.postText('postPersonBody',{name:HK.postSenderName(st,m.sender),loyalty:Math.round(st.persons[m.sender.slice(7)].loyalty)});
      if(m.sender.startsWith('house:')) {const h=st.burghers[r.id];return h?this.postText(h.owner==='player'?'postHouseBody':'postHouseNeighbourBody',{house:HK.burgherName(h),mood:Math.round(h.mood),rent:HK.burgherRent(st,h)}):HK.t('postGone');}
      if(m.sender.startsWith('ship:'))return HK.t('postCaptainBody');
    }
    return this.postText('postBody_'+m.type,v);
  },
  postPanel() {
    const st=HK.state,selected=st.post.messages.find(m=>m.id===this.postSelected);
    let html=this.workHeading('postTitle','postHint','mail');
    html+=this.workFilters('postmode',this.postMode,[['letters','postLetters'],['world','postWorld'],['contacts','postWrite']]);
    if(this.postMode==='world')return html+this.cityLifePanel();
    if(this.postMode==='contacts')return html+`<section class="post-compose">${this.helpHeading('postWrite','postComposeHint')}<label for="post-contact">${HK.t('postRecipient')}</label><select id="post-contact">${HK.postContacts(st).map(c=>`<option value="${this.esc(c.sender)}">${this.esc(c.label)}</option>`).join('')}</select><button class="small primary" data-action="postcontact">${HK.t('postSendInquiry')}</button></section>`;
    if(selected) {
      const actions=HK.postActions(st,selected),thread=st.post.messages.filter(m=>m.sender===selected.sender&&m.id!==selected.id).slice(-5);
      html+=`<button class="small work-back" data-action="postopen" data-id="">← ${HK.t('postBack')}</button><article class="post-letter"><div class="post-letter-top">${HK.MenuArt.portrait(selected.sender)}<div><small>${HK.t('postFrom')}</small><b>${this.esc(HK.postSenderName(st,selected.sender))}</b><small>${HK.fmtDate(selected.day)}</small></div><span class="post-seal" aria-hidden="true">✦</span></div><h3>${HK.t('postSubject_'+selected.type)}</h3><p>${this.postLetterBody(selected)}</p>`;
      if(selected.type==='city'){const e=st.cityLife.stories.find(e=>e.id===selected.ref.id);if(e)html+=this.cityEffects(e);}
      html+=`<div class="post-replies">${actions.map(a=>{
        const goods=Object.entries(a.goods||{}),affordable=!(a.cost>st.money)&&goods.every(([g,q])=>(st.warehouse.stock[g]||0)>=q),costs=[a.cost?`${a.cost} ${HK.t('mark')}`:'',...goods.map(([g,q])=>`${q} ${HK.t('unitLast')} ${HK.goodName(g)}`)].filter(Boolean).join(' + '),ch=a.terms,benefits=[];
        if(ch?.mood)benefits.push(HK.t('cityMoodChange',{value:'+'+ch.mood}));if(ch?.rep)benefits.push(HK.t('cityRepChange',{value:ch.rep}));if(ch?.mitigate)benefits.push(HK.t('cityReliefTerm'));if(ch?.protect)benefits.push(HK.t('cityProtectTerm',{days:ch.protect}));
        return `<div class="post-reply-option"><button class="small" data-action="postreply" data-id="${selected.id}" data-choice="${a.id}" ${affordable?'':'disabled'}>${this.postText(a.label,a.vars)}${costs&&!['pact','pilot','donate'].includes(a.id)?` · ${costs}`:''}</button>${a.hint?`<small>${this.postText(a.hint,a.vars)}</small>`:''}${benefits.length?`<small>${benefits.join(' · ')}</small>`:''}</div>`;
      }).join('')}</div>`;
      if(!actions.length)html+=`<small>${HK.t(selected.replies.length?'postAnswered':'postInformation')}</small>`;
      html+=`<div class="btn-row"><button class="small" data-action="missions">${HK.t('missionsTab')}</button><button class="small" data-action="tradeplans">${HK.t('tradePlanningTab')}</button><button class="small" data-action="postarchive" data-id="${selected.id}">${HK.t(selected.archived?'postRestore':'postArchive')}</button></div>`;
      for(const reply of selected.replies)html+=`<div class="post-outgoing"><small>${HK.t('postYourReply')} · ${HK.fmtDate(reply.day)}</small><b>${this.postText(reply.label,reply.vars)}</b></div>`;
      if(thread.length)html+=`<details class="post-thread"><summary>${HK.t('postThread')}</summary>${thread.map(m=>`<button class="post-thread-link" data-action="postopen" data-id="${m.id}">${HK.fmtDate(m.day)} · ${HK.t('postSubject_'+m.type)}</button>`).join('')}</details>`;
      return html+'</article>';
    }
    html+=this.workFilters('postfilter',this.postFilter,[['inbox','postInbox'],['unread','postUnread'],['archive','postArchiveFolder'],['all','workAll']]);
    const messages=st.post.messages.filter(m=>this.postFilter==='all'||this.postFilter==='archive'?this.postFilter==='all'||m.archived:this.postFilter==='unread'?!m.read&&!m.archived:!m.archived).slice().reverse();
    html+=`<div class="post-list">${messages.map(m=>`<button class="post-envelope ${m.read?'read':'unread'}" data-action="postopen" data-id="${m.id}">${HK.MenuArt.portrait(m.sender)}<span><small>${this.esc(HK.postSenderName(st,m.sender))} · ${HK.fmtDate(m.day)}</small><b>${HK.t('postSubject_'+m.type)}</b><small>${HK.postActions(st,m).length?HK.t('postReplyPossible'):m.replies.length?HK.t('postAnswered'):HK.t('postInformation')}</small></span>${!m.read?'<i class="post-unread-dot" aria-hidden="true"></i>':''}</button>`).join('')||`<p class="hint">${HK.t('postEmpty')}</p>`}</div>`;
    return html;
  },
  renderLog() {
    const st=HK.state,q=this.journalQuery.trim().toLocaleLowerCase(),P=st.post;
    let html=this.workHeading('journalTitle','journalHint','log');
    html+=this.workFilters('journalfilter',this.journalFilter,[['all','workAll'],['missions','missionsTab'],['city','postCity'],['world','postWorld'],['people','postPeople'],['trade','tradeNav'],['notes','journalNotes']]);
    html+=`<label class="journal-search" for="journal-search">${HK.t('journalSearch')}<input id="journal-search" type="search" value="${this.esc(this.journalQuery)}" maxlength="100"><button class="small" data-action="journalsearch">${HK.t('journalSearchButton')}</button></label>`;
    if(this.journalFilter==='notes') {
      html+=`<section class="journal-notepad"><label for="journal-note">${HK.t('journalNewNote')}</label><textarea id="journal-note" rows="4" maxlength="1200" placeholder="${this.esc(HK.t('journalNotePlaceholder'))}"></textarea><button class="small primary" data-action="journalnote">${HK.t('journalSaveNote')}</button></section>`;
      return html+P.notes.filter(n=>!q||n.body.toLocaleLowerCase().includes(q)).slice().reverse().map(n=>`<article class="journal-entry note"><small>${HK.fmtDate(n.day)}</small><p>${this.esc(n.body)}</p><button class="small" data-action="journaldelete" data-id="${n.id}">${HK.t('journalDeleteNote')}</button></article>`).join('');
    }
    const entries=[...P.journal,...(this.journalFilter==='all'?P.notes.map(n=>({...n,kind:'note',category:'notes'})):[])].filter(e=>(this.journalFilter==='all'||e.category===this.journalFilter)&&(!q||(e.kind==='note'?e.body:this.postText(e.key,e.vars)).toLocaleLowerCase().includes(q))).reverse().sort((a,b)=>b.day-a.day);
    let day=null;for(const e of entries.slice(0,100)) {
      if(e.day!==day){day=e.day;html+=`<h3 class="journal-date">${HK.fmtDate(day)}</h3>`;}
      html+=`<article class="journal-entry ${e.kind}"><span class="journal-kind">${HK.t(e.kind==='note'?'journalNotes':'journalCategory_'+e.category)}</span><p>${e.kind==='note'?this.esc(e.body):this.postText(e.key==='sermonAgainst'?'sermonAgainstLog':e.key,e.vars)}</p></article>`;
    }
    if(!entries.length)html+=`<p class="hint">${HK.t('journalEmpty')}</p>`;
    html+=`<details class="journal-technical"><summary>${HK.t('journalAllEntries')}</summary><ul class="log">${st.log.slice(0,100).map(e=>`<li><small>${HK.fmtDate(e.day)}</small> ${this.postText(e.key==='sermonAgainst'?'sermonAgainstLog':e.key,e.vars)}</li>`).join('')}</ul></details><button class="small" data-action="chronicle">${HK.t('journalChronicle')}</button>`;
    return html;
  },
});
const workTabs=HK.UI.renderTabs;
HK.UI.renderTabs=function(){workTabs.call(this);const st=HK.state;if(!st)return;const mail=this.$('mail-badge'),missions=this.$('mission-badge');const unread=st.post.messages.filter(m=>!m.read&&!m.archived).length,ongoing=this.missionRecords().filter(r=>r.status==='active').length;mail.textContent=unread||'';mail.hidden=!unread;missions.textContent=ongoing||'';missions.hidden=!ongoing;};
const workAction=HK.UI.action;
HK.UI.action=function(d) {
  const st=HK.state;
  if(d.action==='introtime'){HK.setSpeed(1);return;}
  if(d.action==='missions'){this.missionFocus=null;this.setTab('missions');return;}
  if(d.action==='missionfocus'){this.missionFocus=d.value||null;this.renderSidebar();this.sidebar.scrollTop=0;return;}
  if(d.action==='missionfilter'){this.missionFilter=d.value;this.missionFocus=null;}
  else if(d.action==='postmode'){this.postMode=d.value;this.postSelected=null;}
  else if(d.action==='postfilter'){this.postFilter=d.value;this.postSelected=null;}
  else if(d.action==='postopen'){this.postSelected=+d.id||null;if(this.postSelected)HK.postRead(st,this.postSelected);}
  else if(d.action==='postarchive'){this.result(HK.postArchive(st,+d.id));this.postSelected=null;}
  else if(d.action==='postreply'){this.result(HK.postReply(st,+d.id,d.choice));}
  else if(d.action==='postcontact'){const r=HK.postContact(st,this.$('post-contact').value);if(this.result(r)){this.postSelected=r.id;this.postMode='letters';HK.postRead(st,r.id);}}
  else if(d.action==='postquick'){const r=HK.postContact(st,d.sender),existing=st.post.messages.find(m=>m.token==='contact:'+d.sender+':'+st.day);if(r.ok||existing){this.postSelected=r.id||existing.id;this.postMode='letters';HK.postRead(st,this.postSelected);this.setTab('mail');return;}this.result(r);}
  else if(d.action==='postdecision'){const ch=st.chains.active.find(c=>c.id===d.id);if(ch&&HK.CHAINS[ch.id].stages[ch.stage].choices)this.showDecision(ch);return;}
  else if(d.action==='journalfilter'){this.journalFilter=d.value;}
  else if(d.action==='journalsearch'){this.journalQuery=this.$('journal-search').value;}
  else if(d.action==='journalnote'){this.result(HK.journalNote(st,this.$('journal-note').value));}
  else if(d.action==='journaldelete'){st.post.notes=st.post.notes.filter(n=>n.id!==+d.id);HK.scheduleSave?.();}
  else return workAction.call(this,d);
  this.renderAll();
};
const workPlan=HK.UI.planningPanel;
HK.UI.planningPanel=function(){return workPlan.call(this)+`<section><h3>${HK.t('planningRisks')}</h3>${HK.state.cityLife.stories.filter(e=>e.end>=HK.state.day).map(e=>`<details><summary>${HK.t('cityTitle_'+e.type)} · ${HK.fmtDate(e.start)}</summary>${this.cityEffects(e)}</details>`).join('')||`<p class="hint">${HK.t('planningNoRisks')}</p>`}</section>`;};
const workArrivalHint=HK.UI.tradeArrivalHint;
HK.UI.tradeArrivalHint=function(inc){return workArrivalHint.call(this,inc)+(inc.saltStory==='salt'&&!HK.state.saltStory.windDone?' '+HK.t('saltWindWarning',{date:HK.fmtDate(HK.state.saltStory.windAt)}):'');};
const workScene=HK.UI.sceneClick;
HK.UI.sceneClick=function(h){if(h.kind!=='town-event')return workScene.call(this,h);if(h.story){this.missionFocus='salt';this.setTab('missions');}else{this.postMode='world';this.setTab('mail');}};
for(const method of ['showDecision','showOffer']) {
  const previous=HK.UI[method];HK.UI[method]=function(value) {
    previous.call(this,value);const decorate=()=>{const box=this.$('modal').querySelector('.modal-box'),button=document.createElement('button');
    button.className='small';button.dataset.postDefer='';button.textContent=HK.t('postKeepLetter');
    button.addEventListener('click',()=>{
      this.closeModal();HK.postSync(HK.state);const m=HK.state.post.messages.slice().reverse().find(m=>method==='showDecision'?m.type==='chain'&&m.ref.id===value.id&&m.ref.stage===value.stage:m.type==='family');
      this.postMode='letters';this.postSelected=m?.id||null;if(m)HK.postRead(HK.state,m.id);this.setTab('mail');
    });box.appendChild(button);};decorate();const redraw=this.modalRender;this.modalRender=()=>{redraw();decorate();};
  };
}
for(const panel of ['person','burgher','church','townhall','harbour']) {
  const previous=HK.UI['panel_'+panel];if(!previous)continue;
  HK.UI['panel_'+panel]=function(...args){
    const html=previous.apply(this,args),sender=panel==='person'?'person:'+this.person:panel==='burgher'?'house:'+this.burgher:panel==='church'?'church':panel==='townhall'?'council':HK.findVisitor(HK.state,this.selectedVisitor)?.captainId?'ship:'+HK.findVisitor(HK.state,this.selectedVisitor).captainId:null;
    return html+(sender?`<button class="planning-link" data-action="postquick" data-sender="${this.esc(sender)}">${HK.MenuArt.symbol('mail')}${HK.t('postWrite')}</button>`:'');
  };
}
