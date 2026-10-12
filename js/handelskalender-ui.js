/* Read-only calendar of the economy's actual demand events. */
'use strict';
Object.assign(HK.I18N.de,{
 calendarNow:'Gerade in der Stadt',calendarNext:'Demnächst',calendarRumours:'Aus der Taverne',calendarToday:'Beginnt heute',calendarIn:'In {days} Tagen',calendarActive:'Noch {days} Tage',calendarLastDay:'Heute letzter Tag',calendarConfirmed:'Bestätigt',calendarDemand:'Nachfrage',calendarDetails:'Hintergrund & Zeitraum',calendarVisit:'Ort besuchen',calendarGood:'{good} am Markt ansehen',calendarEmpty:'Zurzeit sind keine weiteren Termine bekannt.',calendarTip:'Ein Wirt hat Neuigkeiten',calendarTipText:'Erfahre, welche Waren bald gefragt sein könnten. Ein Gerücht bleibt unsicher.',calendarHint:'Mehr Nachfrage kann neue Absatzchancen schaffen. Die Prozentwerte verändern die Nachfrage, nicht unmittelbar deinen Verkaufspreis oder Gewinn. Warenbilder führen zum Markt. Bestätigte Termine gelten sicher; Gerüchte zeigen ihre Eintrittschance. Ein abgesagter Termin erzeugt keine zusätzliche Nachfrage.'
});
Object.assign(HK.I18N.en,{
 calendarNow:'Happening in town',calendarNext:'Coming up',calendarRumours:'From the tavern',calendarToday:'Starts today',calendarIn:'In {days} days',calendarActive:'{days} days left',calendarLastDay:'Last day today',calendarConfirmed:'Confirmed',calendarDemand:'Demand',calendarDetails:'Background & dates',calendarVisit:'Visit location',calendarGood:'View {good} at market',calendarEmpty:'No further dates are currently known.',calendarTip:'The innkeeper has news',calendarTipText:'Find out which goods may soon be in demand. A rumour remains uncertain.',calendarHint:'More demand can create opportunities to sell. The percentages affect demand, not your sale price or profit directly. Goods illustrations take you to market. Confirmed dates are certain; rumours show their chance of happening. Cancelled events create no extra demand.'
});
Object.assign(HK.UI,{
 calendarDate(day) {
  const c=HK.CONST,date=new Date(Date.UTC(2000,c.START_MONTH,c.START_DAY+day));
  return {day:date.getUTCDate(),month:new Intl.DateTimeFormat(HK.LANG==='de'?'de-DE':'en-GB',{month:'short',timeZone:'UTC'}).format(date)};
 },
 calendarCard(e) {
  const st=HK.state,active=e.start<=st.day&&e.end>=st.day,denied=e.resolved&&!e.happens,confirmed=e.resolved&&e.happens,date=this.calendarDate(e.start);
  const location={marketdays:'market',quayworks:'harbour',pilgrims:'church',lent:'church',easter:'church',harvest:'market',christmas:'church'}[e.type]||'market';
  const title=HK.t((e.season?'tradeSeason_':'tradeNews_')+e.type),status=denied?HK.t('tradeDenied'):confirmed?HK.t('calendarConfirmed'):HK.t('tradeReliability',{chance:Math.round(e.confidence*100)});
  const timing=active?HK.t(e.end===st.day?'calendarLastDay':'calendarActive',{days:e.end-st.day+1}):HK.t(e.start===st.day?'calendarToday':'calendarIn',{days:e.start-st.day});
  const goods=Object.entries(e.cons).map(([g,f])=>{const pct=Math.round((f-1)*100);return `<button class="calendar-good ${pct<0?'fall':'rise'}" data-action="warehousetrade" data-good="${g}" aria-label="${this.esc(HK.t('calendarGood',{good:HK.goodName(g)}))}">${HK.MenuArt.good(g)}<span>${HK.goodName(g)}<strong>${pct<0?'↓ −':'↑ +'}${Math.abs(pct)} %</strong></span></button>`;}).join('');
  return `<article class="calendar-card ${active?'current':''} ${denied?'cancelled':''}" data-calendar-event="${e.id}"><div class="calendar-card-top"><div class="calendar-date" aria-label="${this.esc(HK.fmtDate(e.start))}"><span>${date.month}</span><b>${date.day}</b></div>${HK.MenuArt.place(location,'calendar-art')}<div class="calendar-title"><small class="calendar-status">${confirmed?'✓ ':denied?'× ':'? '}${status}</small><h4>${title}</h4><span>${denied?'':timing}</span></div></div>${!denied?`<div class="calendar-demand"><small>${HK.t('calendarDemand')}</small><div class="calendar-goods">${goods}</div></div>`:''}<footer><details data-calendar-detail="${e.id}"><summary>${HK.t('calendarDetails')}</summary><p>${HK.fmtDate(e.start)} – ${HK.fmtDate(e.end)}</p>${!e.season?`<p>${HK.t('tradeNewsText_'+e.type)}</p>`:''}</details><button class="small calendar-visit" data-action="businessplace" data-building="${location}">${HK.t('calendarVisit')} <span aria-hidden="true">↗</span></button></footer></article>`;
 },
 tradeCalendarPanel() {
  const st=HK.state,news=st.tradePlanning.news.filter(n=>n.end>=st.day),known=news.filter(n=>n.known).map(n=>({...n,id:'news-'+n.id,cons:HK.TRADE_NEWS[n.type].cons}));
  const events=[...known,...HK.tradeSeasonForecast(st).map(e=>({...e,id:'season-'+e.type,season:true,resolved:true,happens:true}))].sort((a,b)=>a.start-b.start||a.end-b.end);
  const current=events.filter(e=>e.start<=st.day&&!(e.resolved&&!e.happens)),next=events.filter(e=>!current.includes(e)),unknown=news.filter(n=>!n.known);
  let h=`<section class="trade-calendar">${this.helpHeading('tradeCalendar','calendarHint')}<div class="calendar-today">${HK.MenuArt.symbol('planning')}<span>${HK.fmtDate(st.day)}</span></div>`;
  for(const [key,list]of [['calendarNow',current],['calendarNext',next]])if(list.length)h+=`<div class="calendar-group"><h4 class="calendar-group-title">${HK.t(key)} <span>${list.length}</span></h4><div class="calendar-events">${list.map(e=>this.calendarCard(e)).join('')}</div></div>`;
  if(unknown.length)h+=`<div class="calendar-group"><h4 class="calendar-group-title">${HK.t('calendarRumours')}</h4>${unknown.map(n=>`<article class="calendar-rumour">${HK.MenuArt.place('tavern')}<div><b>${HK.t('calendarTip')}</b><p>${HK.t('calendarTipText')}</p></div><button class="small" data-action="tradeinfo" data-id="${n.id}" ${st.money<40?'disabled':''}>${HK.t('tradeInfoBuy')}</button></article>`).join('')}</div>`;
  if(!events.length&&!unknown.length)h+=`<p class="hint">${HK.t('calendarEmpty')}</p>`;
  return h+'</section>';
 }
});
{
 const render=HK.UI.renderSidebar;
 HK.UI.renderSidebar=function(...args){const open=[...this.sidebar.querySelectorAll('[data-calendar-detail][open]')].map(e=>e.dataset.calendarDetail);const r=render.apply(this,args);this.sidebar.querySelectorAll('[data-calendar-detail]').forEach(e=>{e.open=open.includes(e.dataset.calendarDetail);});return r;};
}
