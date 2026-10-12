/* Visible consequences use existing, checked public spaces and cached geometry.
   Scene drawing is read-only; no cargo or payments are settled here. */
'use strict';
{
  const S=HK.Scene,I=HK.Iso;
  HK.cityMapEvents=function(st) {
    const active=new Set(HK.activeCityStories(st).map(e=>e.type)), result=[];
    if(['guildFair','wedding','players','embassy','visitors'].some(t=>active.has(t))) result.push({id:'festival',kind:'festival',x:16.2,y:7.66,w:.42,d:.28});
    if(active.has('dockStrike'))result.push({id:'strike',kind:'strike',x:23.75,y:19.76,w:.60,d:.22});
    if(active.has('highWater'))result.push({id:'water',kind:'water',x:15.15,y:19.65,w:.30,d:.25});
    if(active.has('herringRun'))result.push({id:'fish',kind:'fish',x:10.68,y:.20,w:.20,d:.20});
    const story=st.saltStory;
    if(story&&['active','followOffer','followActive'].includes(story.phase))result.push({id:'story-board',kind:'harbour',x:23.75,y:19.76,w:.60,d:.22});
    if(story&&st.day<=story.visualUntil&&story.outcome==='community'&&story.phase!=='failed')result.push({id:'story-thanks',kind:'success',x:10.68,y:.20,w:.20,d:.20});
    if(story?.phase==='failed'&&st.day<=story.visualUntil)result.push({id:'story-failure',kind:'failure',x:23.75,y:19.76,w:.60,d:.22});
    // Shared spaces host one display, so two events never duplicate props or actors.
    return result.filter((e,i)=>result.findIndex(o=>o.x===e.x&&o.y===e.y)===i);
  };
  S.drawTownEvent=function(ctx,e) {
    const {x,y,w,d,kind}=e;
    if(['harbour','failure','strike'].includes(kind)) {
      I.box(ctx,x+.07,y+.08,.32,.045,.045,.58,{wall:'#79684d',top:'#b2996c'});
      I.poly(ctx,[[x+.05,y+.075,.67],[x+w-.06,y+.075,.67],[x+w-.06,y+.075,.92],[x+.05,y+.075,.92]],kind==='failure'?'#9b7764':kind==='strike'?'#a7865f':'#c2b38e','#6b634e',.6);
      for(let i=0;i<3;i++)I.line(ctx,[x+.12,y+.07,.72+i*.065],[x+w-.13,y+.07,.72+i*.065],'#6c644e',.55);
      if(kind==='harbour') { const p=I.p(x+w-.12,y+.075,.84);ctx.fillStyle='#886752';ctx.beginPath();ctx.arc(...p,1.7,0,Math.PI*2);ctx.fill(); }
    } else if(kind==='festival') {
      for(const xx of [x+.03,x+w-.03])I.box(ctx,xx,y+.02,.29,.025,.025,.66,{wall:'#83704f'});
      I.line(ctx,[x+.04,y+.02,.89],[x+w-.03,y+.02,.89],'#b5a37c',.65);
      for(let i=0;i<5;i++){const xx=x+.05+i*(w-.1)/5;I.poly(ctx,[[xx,y+.015,.89],[xx+.055,y+.015,.89],[xx+.028,y+.015,.80]],['#ab6e57','#b99b56','#728777'][i%3],'#786a51',.3);}
      I.cylinder(ctx,x+w/2,y+d/2,.29,.05,.14,'#baa071',{segments:8});
    } else if(kind==='water') {
      // Dry sacks remain on the quay, on the same footprint as the existing rope pile.
      for(let i=0;i<4;i++){const xx=x+.06+(i%2)*.13,yy=y+.06+Math.floor(i/2)*.11;I.cylinder(ctx,xx,yy,0,.065,.10,'#b4a17a',{segments:8});I.line(ctx,[xx-.035,yy,.103],[xx+.035,yy,.103],'#7f735d',.5);}
    } else {
      I.box(ctx,x-.025,y-.035,0,.22,.17,.065,{wall:'#817256',top:'#a99166'});
      for(let i=0;i<4;i++){const p=I.p(x+.005+i*.043,y+.02,.09);ctx.fillStyle='#aeb7a7';ctx.beginPath();ctx.ellipse(...p,1.7,.75,-.2,0,Math.PI*2);ctx.fill();}
      if(kind==='success')I.poly(ctx,[[x+.03,y,.19],[x+.17,y,.19],[x+.10,y,.33]],'#a58a57','#73664b',.45);
    }
  };
  const cityItems=S.cityItems;
  S.cityItems=function(items,st,season,t) {
    cityItems.call(this,items,st,season,t);
    const events=HK.cityMapEvents(st);
    for(const e of events) {
      const box=[e.x-.03,e.y-.04,e.x+e.w,e.y+e.d];
      const pick={kind:'town-event',story:e.id.startsWith('story'),label:HK.t(e.id==='story-board'?'saltMeeting':'cityMap_'+e.kind)};
      items.push({c:'town-event:'+e.id,v:e.kind,townEvent:e.kind,k:e.x+e.w+e.y+e.d+.001,box,pick,f:ctx=>this.drawTownEvent(ctx,e)});
      if(!this.cityActorActive({}))continue;
      const actors=e.kind==='strike'?3:e.kind==='festival'?2:e.kind==='harbour'?1:0;
      for(let i=0;i<actors;i++) {
        const actor={x:e.x-.16-i*.18,y:e.y-.13,color:['#927152','#6c7c76','#876754'][i],action:e.kind==='festival'?'drink':'read'},ap=I.p(actor.x,actor.y,0),gesture=Math.floor((t*.6+i)%4);
        items.push({s:'town-event-actor|'+e.kind+'|'+i+'|'+gesture,ap,townEventActor:e.kind,k:this.pointKey(actor.x,actor.y),pick,box:[actor.x-.07,actor.y-.07,actor.x+.07,actor.y+.07],f:ctx=>this.drawCityActor(ctx,actor,gesture)});
      }
    }
  };
}
