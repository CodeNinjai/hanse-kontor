'use strict';
{
 const U=HK.UI,T=HK.citizenText;
 const title=U.panelTitle,click=U.sceneClick,action=U.action,venture=U.panel_venture,person=U.panel_person,house=U.panel_burgher;
 U.panelTitle=function(){return this.panel==='citizen'?HK.citizenName(HK.state,HK.state.population.people[this.citizen]):title.call(this);};
 U.sceneClick=function(h){
  if(h.kind!=='citizen')return click.call(this,h);
  const p=HK.state.population.people[h.citizen];if(!p)return;
  p.met??=HK.state.day;this.citizen=p.id;this.citizenDestination=h.destination||null;this.panel='citizen';HK.Scene.selected=h.building?.id||null;
  this.setTab('place');this.sidebar.scrollTop=0;HK.scheduleSave?.();
 };
 U.citizenPlace=function(id){const b=HK.citizenBuilding(id);return b?(b.burgher?HK.buildingLabel(HK.state,b):HK.name(b)):id;};
 U.citizenStatus=function(p){const m=p.motion;if(!m)return T(HK.servicePresent(HK.state,p)?['Im Dienst','On duty']:['Abgereist','Departed']);
  const labels={home:p.guest?['In der Herberge','At the inn']:['Zu Hause','At home'],work:['Am Arbeitsplatz','At work'],market:['Auf dem Markt','At the market'],bench:['Ruht sich auf einer Bank aus','Resting on a bench'],break:['Kurzer Rundgang am Arbeitsort','A short round at work'],away:['Außerhalb der Stadt','Out of town'],arrival:['Ankunft in Sundhaven','Arriving in Sundhaven']};
  if(m.place==='walking')return T(m.target==='home'?['Auf dem Heimweg','Heading home']:m.target==='away'?['Verlässt die Stadt','Leaving town']:m.target==='bench'?['Unterwegs zu einer Bank','Heading to a bench']:m.target==='market'?['Unterwegs zum Markt','Heading to market']:['Auf dem Weg zur Arbeit','Heading to work']);
  return T(labels[m.place]||['In der Stadt','In town']);
 };
 U.citizenLinks=function(p){return `<div class="btn-row"><button class="small" data-action="citizenhome" data-id="${p.id}">${T(['Wohnort zeigen','Show home'])}</button><button class="small" data-action="citizenwork" data-id="${p.id}">${T(['Arbeitsort zeigen','Show workplace'])}</button></div>`;};
 U.citizenSummary=function(p){return `<section><p><span class="tag">${T(p.guest?['Gast','Guest']:p.gender==='female'?['Bewohnerin','Resident']:['Bewohner','Resident'])}</span> · ${p.age} ${T(['Jahre','years'])}</p><p><b>${this.esc(this.citizenStatus(p))}</b></p><p>${T(['Wohnt in','Lives at'])}: ${this.esc(p.lodging==='ship'?T(['An Bord des Schiffes','Aboard the ship']):this.citizenPlace(p.home))}<br>${T(['Tätigkeit','Occupation'])}: ${this.esc(HK.citizenJob(p))}</p>${p.guest?`<p>${T(['Herkunft','Origin'])}: ${p.origin?HK.name(HK.ORIGIN[p.origin]):T(['Sundhaven','Sundhaven'])}<br>${T(['Aufenthalt','Visit'])}: ${HK.fmtDate(p.arrival)} – ${p.departure===null?T(['offen','open']):HK.fmtDate(p.departure)}</p>`:''}<p>${this.esc(HK.citizenStory(p))}</p>${this.citizenLinks(p)}</section>`;};
 U.panel_citizen=function(){const st=HK.state,p=st.population.people[this.citizen];if(!p)return'';
  let h=`<div class="panel-head illustrated-head">${HK.MenuArt.portrait(p.contact||p.id,p)}<div><h2>${this.esc(HK.citizenName(st,p))}</h2><div class="meta">${this.esc(HK.citizenJob(p))}</div></div></div>`+this.citizenSummary(p);
  h+=`<section><h3>${T(['Begegnung','Meeting'])}</h3><p>${T(['„Guten Tag. Was führt Euch zu mir?“','“Good day. What brings you to me?”'])}</p><div class="btn-row"><button data-action="citizentalk" data-id="${p.id}">${T(['Ins Gespräch kommen','Start a conversation'])}</button>${p.contact?`<button data-action="citizencontact" data-id="${p.id}">${T(['Geschäfte & Beziehungen','Business & relationships'])}</button>`:''}</div></section>`;
  if(p.conversation?.day===st.day)h+=`<section><p>${HK.t(p.conversation.key,p.conversation.vars||{})}</p>${p.conversation.action?`<button data-action="citizenoffer" data-id="${p.id}">${p.conversation.action==='alms'?HK.t('alms',{cost:p.conversation.cost}):HK.t('cheapFish',{cost:p.conversation.cost})}</button>`:''}</section>`;
  if(this.citizenDestination?.building)h+=`<section><button data-action="businessplace" data-building="${this.citizenDestination.building.id}">${T(['Transportziel öffnen','Open freight destination'])}</button></section>`;
  h+=`<details><summary>${T(['Letzte Wege','Recent visits'])}</summary><ul>${p.history.map(e=>`<li>${HK.fmtDate(e.day)} · ${this.esc(e.place==='home'?this.citizenPlace(p.home):e.place==='work'?this.citizenPlace(p.work):T(e.place==='away'?['Stadt verlassen','Left town']:e.place==='bench'?['Pause auf einer Bank','Rested on a bench']:e.place==='break'?['Rundgang am Arbeitsort','A round at work']:['Marktplatz besucht','Visited the market']))}</li>`).join('')||`<li>${T(['Noch keine abgeschlossenen Wege erfasst.','No completed trips recorded yet.'])}</li>`}</ul></details>`;
  return h;
 };
 U.panel_person=function(){const h=person.call(this),p=HK.state.population?.people['contact:'+this.person];return h+(p?this.citizenSummary(p):'');};
 U.citizenRows=function(list){return list.map(p=>`<button class="choice" data-action="citizenopen" data-id="${p.id}"><b>${this.esc(HK.citizenName(HK.state,p))}</b><small>${this.esc(HK.citizenJob(p))} · ${this.esc(this.citizenStatus(p))}</small></button>`).join('');};
 U.panel_venture=function(){let h=venture.call(this);if(HK.Scene.selected==='inn'){
  const guests=Object.values(HK.state.population?.people||{}).filter(p=>p.home==='inn'&&p.guest&&p.motion?.place!=='away'&&HK.servicePresent(HK.state,p));
  h+=`<section><h3>${T(['Gästebuch','Guest book'])} · ${guests.length}</h3><p>${T(['Diese Reisenden haben ihre Unterkunft hier. Tagsüber sind sie auch in der Stadt unterwegs. Hier kannst du ihre Herkunft und ihren geplanten Aufenthalt nachsehen.','These travellers lodge here and explore the town during the day. Here you can check their origins and planned visits.'])}</p><div class="choices">${this.citizenRows(guests)}</div></section>`;
 }return h;};
 U.panel_burgher=function(){const residents=Object.values(HK.state.population?.people||{}).filter(p=>p.home===this.burgher);return house.call(this)+(residents.length?`<section><h3>${T(['Bewohner','Residents'])}</h3><div class="choices">${this.citizenRows(residents)}</div></section>`:'');};
 U.action=function(d){const p=HK.state.population?.people[d.id];
  if(d.action==='citizenopen'){this.sceneClick({kind:'citizen',citizen:d.id});return;}
  if(p&&d.action==='citizencontact'){click.call(this,{kind:'person',person:p.contact});return;}
  if(p&&['citizenhome','citizenwork'].includes(d.action)){const b=HK.citizenBuilding(d.action==='citizenhome'?p.home:p.work);if(b){HK.Scene.zeigeAuf(b.x+b.w/2,b.y+b.d/2);this.sceneClick({kind:'building',building:b,panel:b.panel||'rural'});}return;}
  if(p&&d.action==='citizentalk'){if(p.conversation?.day!==HK.state.day)p.conversation={...HK.encounter(HK.state,['merchant','fisher','beggar','monk','guard','child','pilgrim','porter'].includes(p.type)?p.type:'citizen'),day:HK.state.day,type:p.type};p.met??=HK.state.day;this.renderSidebar();HK.scheduleSave?.();return;}
  if(p&&d.action==='citizenoffer'){if(p.conversation?.action&&this.result(HK.encounterAction(HK.state,p.conversation))){p.conversation.action=null;this.renderSidebar();HK.scheduleSave?.();}return;}
  return action.call(this,d);
 };
}
