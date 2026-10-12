/* Saved nighttime handovers. Rendering never credits goods or cash. */
'use strict';
HK.nightCargoNow=st=>st.day+(Number.isFinite(st.timeOfDay)?st.timeOfDay:.35);
HK.nightCargoPending=st=>(st.freight?.jobs||[]).filter(j=>j.nightCargo&&!j.nightCargo.settled);
HK.queueNightCargo=function(st,job,data,partner){
 const now=HK.nightCargoNow(st),f=now-st.day;
 const start=f<=.15||f>=.82&&f<=.91?now:f<.82?st.day+.82:st.day+1.01;
 job.nightCargo={...data,start,end:start+.08,partner:{id:partner.id,origin:partner.origin,sea:partner.sea,captainId:partner.captainId},settled:false};
 HK.log(st,'nightCargoQueued',{qty:job.qty,good:HK.goodName(job.good)},'info');
};
HK.advanceNightCargo=function(st,time=HK.nightCargoNow(st)){
 let changed=false;
 for(const j of HK.nightCargoPending(st)){
  const n=j.nightCargo;if(time<n.start)continue;
  if(j.status==='queued'){changed=true;j.status='active';for(const p of j.parcels)p.state='carried';}
  if(time+1e-9<n.end)continue;
  // Capacity was reserved when purchasing; no second debit or destination lookup.
  n.settled=true;
  if(j.direction==='in')HK.withQuality(n.quality,()=>HK.addStock(st.warehouse.stock,j.good,j.qty,n.value));
  else {HK.book(st,'shipTrade',n.value);st.stats.volume+=n.value;}
  const result={};HK.smuggleCheck(st,n.value,result);n.caught=!!result.caught;
  HK.noteCaptainTrade(st,n.partner,j.qty,result,true);
  if(j.direction==='in')st.chapters.bought+=j.qty;
  else st.chapters.sold[j.origin]=(st.chapters.sold[j.origin]||0)+j.qty;
  for(const p of j.parcels)HK.completeParcel(st,p);
  HK.log(st,'nightCargoArrived',{qty:j.qty,good:HK.goodName(j.good)},'info');changed=true;
 }
 if(changed)HK.scheduleSave?.();return changed;
};
{
 const free=HK.whFree;HK.whFree=st=>free(st)-HK.nightCargoPending(st).filter(j=>j.direction==='in').reduce((n,j)=>n+j.qty,0);
 const worth=HK.netWorth;HK.netWorth=st=>worth(st)+HK.nightCargoPending(st).reduce((n,j)=>n+(j.direction==='in'?j.nightCargo.value:HK.GOOD[j.good].base*j.qty),0);
 const complete=HK.completeParcel;HK.completeParcel=function(st,p){const j=st.freight?.jobs.find(j=>j.id===p.jobId);if(j?.nightCargo&&!j.nightCargo.settled)return;return complete(st,p);};
}
// Skipping a day also simulates the intervening night, without depending on FPS.
HK.tickHooks.push(st=>HK.advanceNightCargo(st,st.day));
HK.shipBuildProgress=function(st,o){
 const phases={schnigge:[0,1,3,5],kogge:[0,1,2,3,5],holk:[0,1,2,3,4,5],fishingBoat:[0,1,5]}[o.type],fraction=HK.clamp((st.day-o.start)/(o.due-o.start),0,1),index=Math.min(phases.length-1,Math.floor(fraction*phases.length));
 return {fraction,index,count:phases.length,phase:phases[index],percent:Math.floor(fraction*100)};
};
Object.assign(HK.I18N.de,{nightCargoQueued:'Nachttransport vorgemerkt: {qty} Last {good}. Ware beziehungsweise Erlös werden erst bei Übergabe verfügbar.',nightCargoArrived:'Nachttransport abgeschlossen: {qty} Last {good} übergeben.',nightCargoTitle:'Nächtliche Übergaben',nightCargoWaiting:'Wartet auf die Nacht',nightCargoMoving:'Nächtlicher Transport unterwegs',nightCargoHelp:'Schmuggelkäufe werden sofort bezahlt und auf dem Schiff reserviert. Der benötigte Lagerplatz bleibt gebunden. Ware gelangt erst mit der nächtlichen Übergabe ins Lager; bis dahin kann sie nicht verkauft oder verarbeitet werden. Beim Verkauf wird die Ware reserviert, der Erlös kommt bei Übergabe. Zollkontrolle und mögliche Strafe folgen dann ebenfalls. Auch nach Abfahrt des Handelsschiffs bleibt die vereinbarte Übergabe über seine Hafenleute bestehen. Speichern und Tageswechsel erhalten den Auftrag.',yardProgress:'Bauphase {step}/{count} · {percent} %',yardStage0:'Kiellegung',yardStage1:'Spanten setzen',yardStage2:'Rumpf beplanken',yardStage3:'Deck und Aufbauten',yardStage4:'Mast und Takelage',yardStage5:'Ausrüsten zum Stapellauf'});
Object.assign(HK.I18N.en,{nightCargoQueued:'Night handover scheduled: {qty} last {good}. Goods or proceeds become available only on delivery.',nightCargoArrived:'Night handover completed: {qty} last {good} delivered.',nightCargoTitle:'Night handovers',nightCargoWaiting:'Waiting for nightfall',nightCargoMoving:'Night transport underway',nightCargoHelp:'Smuggled purchases are paid immediately and reserved aboard. Warehouse capacity stays reserved. Goods arrive only with the night handover and cannot be sold or processed beforehand. Exports reserve goods and pay proceeds on delivery. Customs checks and possible fines happen then too. The captain’s harbour workers honour the handover even if the trading ship departs. Saving and day changes preserve the order.',yardProgress:'Build stage {step}/{count} · {percent}%',yardStage0:'Laying the keel',yardStage1:'Setting the frames',yardStage2:'Planking the hull',yardStage3:'Deck and upper works',yardStage4:'Mast and rigging',yardStage5:'Fitting out for launch'});

HK.I18N.de.fleetEvent_fishingBuilt='Das Fischerboot ist fertig und nimmt den Fangbetrieb auf. Seine bisherigen Betriebskosten gelten ab jetzt.';
HK.I18N.en.fleetEvent_fishingBuilt='The fishing boat is ready and begins fishing. Its existing operating costs start now.';
HK.I18N.de.buyBoat='Fischerboot bauen · 3 Tage ({cost} Mark, {fish} Fisch/Tag)';
HK.I18N.en.buyBoat='Build fishing boat · 3 days ({cost} marks, {fish} fish/day)';

HK.I18N.de.fleetHelp += ' Auf der Karte durchlaufen Schnigge, Kogge und Holk vier, fünf beziehungsweise sechs Bauphasen. Fischerboote brauchen drei Tage und drei Phasen auf denselben zwei Bauplätzen; Fang und Bootskosten beginnen erst danach.';
HK.I18N.en.fleetHelp += ' On the map, snekkjas, cogs and hulks pass through four, five and six construction stages respectively. Fishing boats take three days and three stages on the same two building berths; fishing and boat costs begin only afterwards.';
