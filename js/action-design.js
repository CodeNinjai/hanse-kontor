/* Shared presentation for actions. Original buttons and economy checks stay authoritative. */
'use strict';
Object.assign(HK.I18N.de, {
  actionMap:'Karte', actionBuy:'Erwerben', actionBuild:'Bauen', actionExpand:'Ausbauen', actionHire:'Einstellen', actionRepair:'Reparieren', actionFund:'Stiften', actionJoin:'Beitreten', actionLease:'Pachten',
  actionMissing:'Noch {money} Mark nötig', actionLimit:'Höchstzahl erreicht', actionGuild:'Zuerst der Gilde beitreten', actionRequirement:'Voraussetzung: {name}', actionBuildingBusy:'Ein Bauvorhaben läuft bereits', actionUnavailable:'Derzeit nicht verfügbar',
  actionCapacity:'{qty} Last Laderaum', actionNextLevel:'Stufe {before} → {after}', actionDayIncome:'Derzeit {money} Mark Ertrag / Tag', actionBaseIncome:'{money} Mark Grundertrag / Tag',
  actionFactor:'Verkauf durch deinen Faktor', actionWage:'{money} Mark Lohn / Tag', actionMaster:'Meister einstellen', actionLicense:'Betriebslizenz', actionBerth:'Zusätzlicher Liegeplatz', actionStall:'Neuer Marktstand',
  actionFishingBoat:'Fischerboot', actionFishDaily:'{qty} Last Fisch / Tag', actionConstruction:'Bauzeit: {days} Tage', actionAlreadyRepaired:'Rumpf bereits unbeschädigt', actionRepairHull:'Rumpf {hull} % → 100 %',
  actionEndowSchool:'Schule dauerhaft fördern', actionEndowHospital:'Spital dauerhaft fördern', actionDonateSchool:'Unterricht finanzieren', actionDonateHospital:'Kranke unterstützen', actionStaff:'Personal', actionLocation:'Ort',
});
Object.assign(HK.I18N.en, {
  actionMap:'Map', actionBuy:'Acquire', actionBuild:'Build', actionExpand:'Expand', actionHire:'Hire', actionRepair:'Repair', actionFund:'Fund', actionJoin:'Join', actionLease:'Lease',
  actionMissing:'Need {money} more marks', actionLimit:'Maximum reached', actionGuild:'Join the guild first', actionRequirement:'Requires: {name}', actionBuildingBusy:'Construction already underway', actionUnavailable:'Currently unavailable',
  actionCapacity:'{qty} last cargo capacity', actionNextLevel:'Level {before} → {after}', actionDayIncome:'Currently {money} marks income / day', actionBaseIncome:'{money} marks base income / day',
  actionFactor:'Sales managed by your factor', actionWage:'{money} marks wages / day', actionMaster:'Hire a master', actionLicense:'Workshop licence', actionBerth:'Additional berth', actionStall:'New market stall',
  actionFishingBoat:'Fishing boat', actionFishDaily:'{qty} last fish / day', actionConstruction:'Construction: {days} days', actionAlreadyRepaired:'Hull already undamaged', actionRepairHull:'Hull {hull}% → 100%',
  actionEndowSchool:'Endow the school', actionEndowHospital:'Endow the hospital', actionDonateSchool:'Fund teaching', actionDonateHospital:'Support the sick', actionStaff:'Staff', actionLocation:'Location',
});
HK.ActionDesign = {
  specification(button, ui) {
    const st=HK.state,C=HK.CONST,d=button.dataset,t=HK.t,art=HK.MenuArt;
    const result=(cost,title,detail,image,label='actionBuy',reason='')=>({cost,title,detail,image,label,reason});
    const wage=n=>t('actionWage',{money:n}),income=n=>t('actionDayIncome',{money:HK.fmt(n)});
    switch(d.action) {
      case 'ruralbuy': { const def=HK.RURAL_SITES[d.site]; return result(def.cost,HK.name(HK.RURAL_BUILDINGS[d.site]),t('ruralOwnershipBenefit'),art.place('rural'),'ruralTakeOver'); }
      case 'buyventure': { const v=HK.VENTURE[d.id],owned=st.ventures[d.id]; return result(owned?.owner?Math.round(v.cost*1.4):HK.ventureCost(st,v),HK.name(v),t('actionBaseIncome',{money:v.income}),art.place('venture'),'actionBuy',v.craft&&!st.craftGuild?t('needCraftGuild'):''); }
      case 'upgradeventure': { const v=HK.VENTURE[d.id],o=st.ventures[d.id];return result(Math.round(v.cost*C.VENTURE_UPGRADE),HK.name(v),t('actionNextLevel',{before:o.level,after:o.level+1}),art.place('workshop'),'actionExpand'); }
      case 'hiremaster': return result(C.MASTER_COST,t('actionMaster'),wage(C.MASTER_WAGE),art.portrait('master'),'actionHire');
      case 'hirefactor': return result(C.FACTOR_COST,t('factor'),t('actionFactor')+' · '+wage(C.FACTOR_WAGE),art.portrait('factor'),'actionHire');
      case 'hirecaptain': {const captain=st.captainOffers.find(c=>c.id===+d.id);return result(captain.fee,captain.name,wage(captain.wage),art.portrait(captain.name),'actionHire');}
      case 'buystorage': {const def=HK.STORAGES[ui.plot],s=st.storages[ui.plot];return result(s.owner==='npc'?def.price:Math.round(def.price*1.5),HK.name(HK.BUILDINGS.find(b=>b.panel==='storage'&&b.plot===ui.plot)),t('warehouseStoreOwn',{cap:def.cap}),art.place('warehouse'));}
      case 'buyship': {const def=HK.SHIP_TYPE[d.type];return result(HK.shipTypePrice(st,d.type),HK.name(def),t('actionCapacity',{qty:def.cap}),art.place('harbour'),'actionBuild',st.ownShips.length>=C.MAX_OWN_SHIPS?t('actionLimit'):'');}
      case 'buyboat': return result(C.BOAT_PRICE,t('actionFishingBoat'),t('actionFishDaily',{qty:C.BOAT_FISH})+' · '+t('actionConstruction',{days:3}),art.place('harbour'),'actionBuild',st.boats>=C.BOAT_MAX?t('actionLimit'):'');
      case 'repairship': {const ship=st.ownShips.find(s=>s.id===+d.id);return result(Math.round((100-ship.hull)*30*HK.shipRepairFactor(st)),ship.name,t('actionRepairHull',{hull:ship.hull}),art.place('harbour'),'actionRepair',ship.hull>=100?t('actionAlreadyRepaired'):'');}
      case 'license': {const w=HK.WORKSHOP[d.type];return result(HK.licensePrice(st,d.type),HK.name(w),t('actionLicense'),art.good(w.out),'actionBuy',!st.guildMember?t('actionGuild'):'');}
      case 'buildws': {const w=HK.WORKSHOP[d.type];return result(w.cost,HK.name(w),t('produces',{qty:w.qty,good:HK.goodName(w.out)}),art.good(w.out),'actionBuild',!st.licenses[w.id]?t('needLicense'):'');}
      case 'buyhouse': {const hs=st.houses[ui.plot];return result(HK.housePrice(st,hs),HK.name(HK.BUILDINGS.find(b=>b.panel==='house'&&b.plot===ui.plot)),income(HK.houseRent(st,hs)),art.place('house'));}
      case 'upgradehouse': {const hs=st.houses[ui.plot];return result(C.HOUSE_UPGRADE,t('house'),t('actionNextLevel',{before:hs.level,after:hs.level+1}),art.place('house'),'actionExpand');}
      case 'repairhouse': return result(800,t('house'),t('damaged'),art.place('house'),'actionRepair');
      case 'buyburgher': {const hs=st.burghers[ui.burgher];if(!hs?.sale)return null;return result(hs.sale.price,HK.burgherName(hs),income(HK.burgherRent(st,hs)),art.place('house'));}
      case 'repairburgher': {const hs=st.burghers[ui.burgher];return result(C.BURGHER_REPAIR,HK.burgherName(hs),t('damaged'),art.place('house'),'actionRepair');}
      case 'improveburgher': {const hs=st.burghers[ui.burgher];return result(2200+hs.level*800,HK.burgherName(hs),t('actionNextLevel',{before:hs.level,after:hs.level+1}),art.place('house'),'actionExpand');}
      case 'buytavern': return result(C.TAVERN_PRICE,t('tavern'),income(HK.tavernIncome(st)),art.place('tavern'));
      case 'buybath': return result(C.BATHHOUSE_PRICE,t('bathhouse'),income(HK.bathIncome(st)),art.place('bathhouse'));
      case 'joinguild': return result(C.GUILD_FEE,t('guild'),t('licenses'),art.place('guild'),'actionJoin');
      case 'joincraft': return result(Math.round(C.CRAFT_FEE*HK.craftDiscount(st)),t('craftguild'),t('ventures'),art.place('craftguild'),'actionJoin');
      case 'schifferein': return result(C.SCHIFFER_BEITRITT,t('skippers'),t('schifferRegel',{praemie:Math.round(C.SCHIFFER_PRAEMIE*100),ersatz:Math.round(C.SCHIFFER_ERSATZ*100),jahr:HK.fmt(C.SCHIFFER_JAHR)}),art.place('harbour'),'actionJoin',!st.ownShips.length?t('schifferOhneSchiff'):'');
      case 'buykontor': return result(C.KONTOR_PRICE,HK.name(HK.ORIGIN[d.city]),`${C.KONTOR_UPKEEP} ${t('mark')} / ${t('day')}`,art.place('kontor'));
      case 'churchproject': {const p=HK.CHURCH_PROJECTS.find(x=>x.id===d.id);return result(p.cost,HK.name(p),`+${p.piety} ${t('piety')} · +${p.rep} ${t('rep')}`,art.place('church'),'actionFund');}
      case 'churchbuild': {const b=HK.CHURCH_BUILDS.find(x=>x.id===d.id),cb=st.churchBuild;return result(b.cost,HK.name(b),t('actionConstruction',{days:b.days}),art.place('church'),'actionBuild',cb.active?t('actionBuildingBusy'):b.needs&&!cb.done[b.needs]?t('actionRequirement',{name:HK.name(HK.CHURCH_BUILDS.find(x=>x.id===b.needs))}):'');}
      case 'extraberth': return result(C.EXTRA_BERTH,t('actionBerth'),`${st.town.berths} → ${st.town.berths+1} / ${C.MAX_BERTHS}`,art.place('harbour'),'actionExpand',st.town.berths>=C.MAX_BERTHS?t('actionLimit'):'');
      case 'stall': return result(C.STALL_COST,t('actionStall'),`${st.stalls} → ${st.stalls+1} / ${C.STALL_MAX}`,art.place('market'),'actionBuild',st.stalls>=C.STALL_MAX?t('actionLimit'):'');
      case 'taxfarm': return result(HK.taxFarmPrice(st),t('taxFarm'),t('taxFarmHint'),art.place('customs'),'actionLease');
      case 'weighfarm': return result(HK.weighFarmPrice(st),t('weighhouse'),income(HK.weighFarmIncome(st)),art.place('weighhouse'),'actionLease');
      case 'schoolendow': return result(C.SCHOOL_ENDOW,t('actionEndowSchool'),'',art.book('log'),'actionFund');
      case 'hospitalendow': return result(C.HOSPITAL_ENDOW,t('actionEndowHospital'),'',art.place('hospital'),'actionFund');
      case 'schooldonate': return result(C.SCHOOL_DONATION,t('actionDonateSchool'),'',art.book('log'),'actionFund',st.schoolDay!==undefined&&st.day-st.schoolDay<30?t('schoolCooldown',{days:30-(st.day-st.schoolDay)}):'');
      case 'hospitaldonate': return result(C.HOSPITAL_DONATION,t('actionDonateHospital'),'',art.place('hospital'),'actionFund');
      default:return null;
    }
  },
  rowArt(row,image) {
    const cell=row.cells[0];if(!cell||cell.querySelector('.choice-main'))return;
    const main=document.createElement('div'),copy=document.createElement('div');main.className='choice-main';copy.className='choice-copy';
    while(cell.firstChild)copy.appendChild(cell.firstChild);
    if(image)main.insertAdjacentHTML('afterbegin',image);
    main.appendChild(copy);cell.appendChild(main);
  },
  decision(button,spec,ui,index) {
    if(!Number.isFinite(spec.cost)||spec.cost<0)return;
    const t=HK.t,art=HK.MenuArt,row=button.closest('tr'),cell=button.closest('td');
    const purchase=document.createElement('div');purchase.className='decision-purchase';
    const price=document.createElement('strong');price.className='decision-price';price.append(document.createTextNode(HK.fmt(spec.cost)+' '));
    const currency=document.createElement('small');currency.textContent=t('mark');price.appendChild(currency);purchase.appendChild(price);
    const originalLabel=button.textContent.trim();button.setAttribute('aria-label',originalLabel);button.title=originalLabel;button.textContent=t(spec.label);button.classList.add('decision-commit');
    if(row&&cell){
      row.classList.add('decision-row');row.closest('table').classList.add('action-table');this.rowArt(row,spec.image);button.before(purchase);
      if(button.dataset.action==='churchbuild'){
        const duration=document.createElement('small');duration.className='choice-detail';duration.textContent=spec.detail;row.querySelector('.choice-copy').appendChild(duration);
      }
    }
    else {
      const card=document.createElement('article');card.className='decision-card';card.dataset.decision=button.dataset.action;
      card.insertAdjacentHTML('afterbegin',spec.image||art.place(ui.panel));
      const copy=document.createElement('div');copy.className='decision-copy';
      const title=document.createElement('b');title.textContent=spec.title;copy.appendChild(title);
      if(spec.detail){const detail=document.createElement('small');detail.textContent=spec.detail;copy.appendChild(detail);}
      card.append(copy,purchase);button.before(card);
    }
    purchase.appendChild(button);
    if(button.disabled){
      const reasons=[];if(spec.reason)reasons.push(spec.reason);
      if(HK.state.money<spec.cost)reasons.push(t('actionMissing',{money:HK.fmt(Math.ceil(spec.cost-HK.state.money))}));
      const reason=document.createElement('small');reason.className='decision-reason';reason.id='decision-reason-'+index;
      reason.textContent=reasons.join(' · ')||t('actionUnavailable');purchase.appendChild(reason);button.setAttribute('aria-describedby',reason.id);
    }
  },
  enhance(ui) {
    const root=ui.sidebar,art=HK.MenuArt;
    // Apply after every normal sidebar render, never on the animation loop.
    const heading=root.querySelector('.action-heading');
    if(ui.tab==='place'&&heading&&!heading.querySelector('.menu-art')&&!['person','encounter'].includes(ui.panel)){
      heading.insertAdjacentHTML('afterbegin',art.place(ui.panel,'panel-picture'));heading.classList.add('illustrated-head');
    }
    root.querySelectorAll('button[data-action]').forEach((button,i)=>{
      if(button.closest('.decision-card,.decision-purchase,.ship-build-card,.finance-person-card'))return;
      const spec=this.specification(button,ui);if(spec)this.decision(button,spec,ui,i);
    });
    root.querySelectorAll('table.plain').forEach(table=>{
      if(table.querySelector('thead')||!table.querySelector('button[data-action]'))return;
      table.classList.add('action-table');table.setAttribute('role','table');
      for(const row of table.rows){
        row.classList.toggle('three-cells',row.cells.length===3);
        if(row.querySelector('.choice-main'))continue;
        const action=row.querySelector('[data-good]'),good=action?.dataset.good;
        this.rowArt(row,good?art.good(good):'');
      }
    });
    root.querySelectorAll('.business-assets button:not(.warehouse-store)').forEach(button=>{
      if(button.querySelector('.menu-art'))return;
      const building=HK.BUILDING[button.dataset.building];button.insertAdjacentHTML('afterbegin',art.place(building?.panel||'house'));
    });
    root.querySelectorAll('.card[data-action=selown]').forEach(card=>{
      if(card.querySelector('.fleet-picture'))return;
      card.insertAdjacentHTML('afterbegin',art.place('harbour','fleet-picture'));
      card.setAttribute('role','button');card.tabIndex=0;
      card.setAttribute('aria-pressed',String(card.classList.contains('selected')));
      card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();card.click();}});
    });
  },
};
