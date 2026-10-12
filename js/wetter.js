/* One persisted weather service. Quotes/rendering never roll weather or apply effects. */
'use strict';
HK.weatherRandom=function(w){w.seed=(Math.imul(w.seed,1664525)+1013904223)>>>0;return w.seed/4294967296;};
HK.weatherSpell=function(st,w,start){
 const r=HK.weatherRandom(w),winter=[11,0,1].includes(HK.monthOf(start)),autumn=[8,9,10].includes(HK.monthOf(start));
 const type=start>20&&r<.035?'storm':winter?(r<.34?'snow':r<.51?'rain':r<.78?'cloudy':'clear'):r<(autumn?.36:.2)?'rain':r<(autumn?.66:.42)?'cloudy':'clear';
 return {id:++w.nextId,type,strength:type==='storm'?1:.3+HK.weatherRandom(w)*.45,start,end:start+2+Math.floor(HK.weatherRandom(w)*3)};
};
HK.weatherInit=function(st){
 if(st.weather)return st.weather;
 const w=st.weather={version:1,seed:(Math.imul(st.day+1,2654435761)+Array.from(st.name||'Sundhaven').reduce((a,c)=>Math.imul(a,31)+c.charCodeAt(0),0))>>>0,nextId:0,processed:st.day-1,history:[]};
 w.current=HK.weatherSpell(st,w,st.day);w.next=HK.weatherSpell(st,w,w.current.end+1);return w;
};
HK.newGameHooks.push(HK.weatherInit);HK.migrateHooks.push(HK.weatherInit);
HK.weatherAt=function(st){
 const w=st?.weather;if(!w)return null;
 // Announced weather stories describe the same local weather, not an unrelated second roll.
 const story=st.cityLife?.stories.find(e=>e.start<=st.day&&e.end>=st.day&&['highWater','frost','heatwave','cropFailure'].includes(e.type));
 if(story)return {...w.current,type:story.type==='frost'?'snow':story.type==='heatwave'?'clear':'rain',strength:.8,start:story.start,end:story.end,cause:story.type};
 return w.current;
};
HK.weatherVisual=st=>{const w=HK.weatherAt(st);return w?.type==='storm'?'rain':w?.type||'clear';};
HK.weatherDayStart=function(st){
 const w=HK.weatherInit(st);if(w.processed>=st.day)return;
 while(st.day>w.current.end){w.current=w.next;w.next=HK.weatherSpell(st,w,w.current.end+1);}
 w.processed=st.day;const current=HK.weatherAt(st);
 w.history.push({day:st.day,type:current.type,strength:current.strength});w.history=w.history.slice(-30);
 if(current.type==='storm'&&w.stormApplied!==current.id){w.stormApplied=current.id;HK.triggerEvent(st,'storm');}
 // A snow spell delays each existing overland transport once, not once per animation frame.
 if(current.type==='snow'&&w.snowApplied!==current.id){w.snowApplied=current.id;for(const inc of st.incoming)if(!inc.sea){inc.days++;inc.weatherDelay={day:st.day,type:'snow',days:1};}for(const d of HK.ruralWaiting(st)){d.eta++;d.weatherDelay={day:st.day,type:'snow',days:1};}}
 if(st.day===w.next.start-1&&w.next.type==='storm'&&w.warned!==w.next.id){w.warned=w.next.id;HK.postAdd(st,'weather:'+w.next.id,'weatherWarning','harbour',{weather:w.next},{date:HK.fmtDate(w.next.start)});}
};
{
 const production=HK.cityProductionMod;HK.cityProductionMod=function(st,g){const w=HK.weatherAt(st),base=production(st,g);if(!w||w.cause)return base;const wet=['rain','storm'].includes(w.type);return base*(g==='fish'?(w.type==='storm'?.7:w.type==='snow'?.9:1):['grain','hemp','flax'].includes(g)?(wet?.95:1):1);};
 const weight=HK.cityStoryWeight;HK.cityStoryWeight=function(st,type){const n=weight(st,type),history=st.weather?.history||[];if(type==='highWater'&&!history.slice(-7).some(w=>w.type==='storm'))return 0;if(type==='cropFailure'&&history.slice(-14).filter(w=>w.type==='rain').length<5)return 0;return n;};
 const event=HK.triggerEvent;HK.triggerEvent=function(st,type){if(type==='storm'&&st.weather){const w=st.weather;if(w.current.type!=='storm'){w.current={id:++w.nextId,type:'storm',strength:1,start:st.day,end:st.day+1};w.next=HK.weatherSpell(st,w,st.day+2);}w.stormApplied=w.current.id;for(const inc of st.incoming)if(inc.sea)inc.weatherDelay={day:st.day,type:'storm',days:2};}return event(st,type);};
}
Object.assign(HK.I18N.de,{weatherTitle:'Wetter und Wege',weatherHelp:'Das Wetter wird mit dem Spielstand gespeichert. Es steuert Regen, Schnee, Licht, Klang und den Rückzug von Bewohnern. Gewöhnlicher Regen verringert Feldarbeit um 5 %, Sturm den Fischfang um 30 %, Schnee um 10 %. Wettergeschichten zeigen ihre eigenen Wirkungen; diese werden nicht zusätzlich mit dem normalen Wettermalus verrechnet. Eine Schneelage verschiebt vorhandene Landtransporte einmalig um einen Tag. Ein Sturm verzögert vorhandene Schiffsankünfte einmalig um zwei Tage und gefährdet Schiffe auf See. Vorhersagen beschreiben die erwartete Lage; angekündigte Stadtgeschichten können sie verändern. Lieferfristen ändern sich nicht automatisch.',weather_clear:'Heiter',weather_cloudy:'Bewölkt',weather_rain:'Regen',weather_snow:'Schnee',weather_storm:'Sturm',weatherForecast:'Ausblick ab {date}: {weather}',weatherObserved:'Beobachtet am {date}',weatherThrough:'Voraussichtlich bis {date}',postSubject_weatherWarning:'Sturmwarnung für den Hafen',postBody_weatherWarning:'Ab {date} wird Sturm erwartet. Bereits unterwegs befindliche Schiffe können zwei Tage später ankommen. Prüfe Vorräte und Lieferzusagen; auf See drohen außerdem Schäden.',weatherDelayed:'Wetterbedingte Verzögerung: +{days} Tag(e), erfasst am {date}.'});
Object.assign(HK.I18N.en,{weatherTitle:'Weather and routes',weatherHelp:'Weather is saved with your game. It controls rain, snow, light, sound and residents seeking shelter. Ordinary rain reduces field work by 5%; storms reduce fishing by 30%, snow by 10%. Weather stories use their own effects without an additional ordinary weather penalty. Each snow spell delays existing overland deliveries once by one day. A storm delays existing sea arrivals once by two days and threatens ships at sea. Forecasts describe expected conditions; announced town stories may change them. Delivery deadlines do not move automatically.',weather_clear:'Clear',weather_cloudy:'Cloudy',weather_rain:'Rain',weather_snow:'Snow',weather_storm:'Storm',weatherForecast:'Outlook from {date}: {weather}',weatherObserved:'Observed on {date}',weatherThrough:'Expected until {date}',postSubject_weatherWarning:'Storm warning for the harbour',postBody_weatherWarning:'A storm is expected from {date}. Ships already underway may arrive two days later. Check your stock and delivery promises; ships at sea also risk damage.',weatherDelayed:'Weather delay: +{days} day(s), recorded on {date}.'});
