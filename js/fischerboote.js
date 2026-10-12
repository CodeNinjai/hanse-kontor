/* Visible fishing rounds. Catch and wages remain in the daily economy tick.
   Save the short activity clock so loading never sends a boat back to shore. */
'use strict';
{
 const S=HK.Scene,I=HK.Iso;
 for(const [lang,text] of Object.entries({
  de:{fishBoatOut:'Auf dem Weg zum Fangplatz',fishBoatCatch:'Netze einholen',fishBoatHome:'Rückfahrt',fishBoatUnload:'Fang löschen',fishBoatRest:'Am Liegeplatz',fishBoatOwn:'Eigenes Fischerboot'},
  en:{fishBoatOut:'Sailing to fishing grounds',fishBoatCatch:'Hauling nets',fishBoatHome:'Returning to port',fishBoatUnload:'Unloading catch',fishBoatRest:'At berth',fishBoatOwn:'Your fishing boat'}
 }))Object.assign(HK.I18N[lang],text);

 S.fishingBoatRoute=function(i){
  const a=HK.BOAT_SPOTS[i],b=HK.FISHING_GROUNDS[i];
  const travel=Math.hypot(b.x-a.x,b.y-a.y)/.15;
  return {a,b,heading:Math.atan2(b.y-a.y,b.x-a.x),travel,fish:24+i*2,unload:12,cycle:travel*2+24+i*2+12};
 };
 S.fishingBoatPose=function(i,elapsed){
  const r=this.fishingBoatRoute(i),ease=u=>{u=HK.clamp(u,0,1);return u*u*(3-2*u);};
  let u=0,heading=r.heading,activity='Rest',moving=false,net=0;
  if(elapsed>=0&&elapsed<r.travel){u=ease(elapsed/r.travel);activity='Out';moving=true;}
  else if(elapsed>=r.travel&&elapsed<r.travel+r.fish){
   u=1;activity='Catch';const t=elapsed-r.travel;
   heading+=Math.PI*ease((t-r.fish+6)/6);
   // Set, work and recover the net before turning for home.
   net=t<3?ease(t/3):t>r.fish-9?1-ease((t-r.fish+9)/3):1;
  }else if(elapsed>=r.travel+r.fish&&elapsed<r.cycle-r.unload){
   u=1-ease((elapsed-r.travel-r.fish)/r.travel);heading+=Math.PI;activity='Home';moving=true;
  }else if(elapsed>=r.cycle-r.unload){
   heading+=Math.PI*(1-ease((elapsed-r.cycle+r.unload)/6));activity='Unload';
  }
  return {x:r.a.x+(r.b.x-r.a.x)*u,y:r.a.y+(r.b.y-r.a.y)*u,heading,activity,moving,net};
 };
 S.updateFishingBoats=function(dt){
  const st=HK.state;if(!st)return;
  const n=Math.min(HK.BOAT_SPOTS.length,2+st.boats);
  if(!Array.isArray(st.fishingTraffic))st.fishingTraffic=[];
  st.fishingTraffic.length=n;
  const canSail=this.clock>=.24&&this.clock<.76&&HK.weatherAt?.(st)?.type!=='storm';
  for(let i=0;i<n;i++){
   const r=this.fishingBoatRoute(i);
   let e=st.fishingTraffic[i];
   if(!Number.isFinite(e)||e< -30||e>=r.cycle)e=-(i*3+.5);
   if(st.speed>0&&!st.gameOver&&!HK.UI.modalOpen){
    // Once out, finish the round even after dusk. Only departure is gated;
    // nightfall, changing speed and the next day cannot teleport a vessel.
    if(e>=0||canSail)e+=Math.max(0,dt);
    if(e>=r.cycle)e=-6-i*2;
   }
   st.fishingTraffic[i]=e;
  }
 };
 S.fishingBoatItems=function(items,st,t){
  for(let i=0;i<Math.min(HK.BOAT_SPOTS.length,2+st.boats);i++){
   const p=this.fishingBoatPose(i,st.fishingTraffic?.[i]??-(i*3+.5)),own=i>=2;
   const heading=Math.round(p.heading*128/(2*Math.PI))*2*Math.PI/128,net=Math.round(p.net*8)/8;
   // Translate every frame; only rebuild the tiny hull when its heading or net
   // changes. Bobbing uses the same world z in geometry and retained anchor.
   const bob=Math.sin(t*1.5+i*1.7)*.009;
   items.push({r:'fishing-boat:'+i,v:[own,heading,p.moving,net].join('|'),
    ap:I.p(p.x,p.y,bob),k:p.x+p.y,box:[p.x-.7,p.y-.7,p.x+.7,p.y+.7],
    f:c=>this.drawBoat(c,p.x,p.y,own,0,{heading,moving:p.moving,net,bob}),
    pick:{kind:'building',building:HK.BUILDING.fishermen,panel:'fishermen',label:HK.t(own?'fishBoatOwn':'fishingBoat')+' · '+HK.t('fishBoat'+p.activity)}});
  }
 };
 const update=S.update;S.update=function(dt){this.updateFishingBoats(dt);return update.call(this,dt);};
}
