'use strict';
HK.UI.weatherPanel=function(){const st=HK.state,w=st.weather,c=HK.weatherAt(st);if(!c)return'';const icon={clear:'☀',cloudy:'☁',rain:'☂',snow:'❄',storm:'☈'};return `<section class="weather-panel">${this.helpHeading('weatherTitle','weatherHelp')}<div class="weather-now"><span aria-hidden="true">${icon[c.type]}</span><div><b>${HK.t('weather_'+c.type)}</b><small>${HK.t('weatherObserved',{date:HK.fmtDate(st.day)})}</small><small>${HK.t('weatherThrough',{date:HK.fmtDate(c.end)})}</small></div></div><small>${HK.t('weatherForecast',{date:HK.fmtDate(w.next.start),weather:HK.t('weather_'+w.next.type)})}</small></section>`;};
{
 const planning=HK.UI.planningPanel;HK.UI.planningPanel=function(){return this.weatherPanel()+planning.call(this);};
 const arrival=HK.UI.tradeArrivalHint;HK.UI.tradeArrivalHint=function(inc){return arrival.call(this,inc)+(inc.weatherDelay?' '+HK.t('weatherDelayed',{days:inc.weatherDelay.days,date:HK.fmtDate(inc.weatherDelay.day)}):'');};
}
