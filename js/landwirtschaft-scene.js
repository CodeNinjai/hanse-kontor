/* Rural objects share depth sorting; grazing animals animate retained layers. */
'use strict';
(() => {
  const S=HK.Scene,I=HK.Iso;
  S.drawRuralHome=function(ctx,b,st,season,sv){
    const styles={grainfarm:['#b9a377','#a18c61'],fiberfarm:['#adad80','#938364'],sheepfarm:['#a4997c','#978665'],cattlefarm:['#9a7851','#9d895e'],dairy:['#c2b592','#816b52'],hunter:['#826e51','#615d49'],woodcutter:['#9c8460','#746550'],stonemason:['#a9a58c','#776b59']};
    const [wall,roof]=styles[b.id]||['#b9a377','#80755b'];
    this.drawHouse(ctx,{...b,wall,roof,roofMaterial:['grainfarm','fiberfarm','sheepfarm','cattlefarm'].includes(b.id)?'thatch':undefined,noWindowsUpper:true},st,season,sv,false);
    const yy=b.y+b.d,xx=b.x+b.w;
    if(['hunter','woodcutter','cattlefarm'].includes(b.id))for(let z=.16;z<b.h-.05;z+=.11){
      I.line(ctx,[b.x+.03,yy+.006,z],[xx-.03,yy+.006,z],'#655338',1.15);
      I.line(ctx,[xx+.006,b.y+.03,z],[xx+.006,yy-.03,z],'#594b38',1.05);
    }
    if(['grainfarm','fiberfarm','sheepfarm','cattlefarm'].includes(b.id)){
      I.doorL(ctx,b.x,b.y,b.d,0,b.w*.54,.45,.59,false);
      // Brace stays within the barn door instead of floating across the facade.
      I.line(ctx,[b.x+b.w*.54-.18,yy+.015,.08],[b.x+b.w*.54+.18,yy+.015,.5],'#957d58',.7);
    }
    if(b.id==='hunter'){
      // Bow, quiver and antler sign stay on the cabin wall.
      const x=b.x+b.w*.2,y=yy+.012;
      I.line(ctx,[x,y,.29],[x+.1,y,.66],'#b4a078',1.25);I.line(ctx,[x+.1,y,.66],[x+.18,y,.43],'#b4a078',1.25);I.line(ctx,[x+.18,y,.43],[x,y,.29],'#c2b795',.5);
      for(const u of [-.11,.11]){I.line(ctx,[xx-.22,yy+.014,.65],[xx-.22+u,yy+.014,.8],'#c6bd9f',1);I.line(ctx,[xx-.22+u,yy+.014,.8],[xx-.22+u*1.4,yy+.014,.84],'#c6bd9f',.8);}
    }
    if(b.id==='stonemason'){
      I.poly(ctx,[[b.x+.3,yy+.012,.17],[xx-.18,yy+.012,.17],[xx-.18,yy+.012,.69],[b.x+.3,yy+.012,.69]],'#4c5147');
      for(const x of [b.x+.3,xx-.18])I.line(ctx,[x,yy+.018,.1],[x,yy+.018,.72],'#aa9270',1.5);
      I.line(ctx,[b.x+.3,yy+.018,.72],[xx-.18,yy+.018,.72],'#b5a07a',2);
    }
  };
  const farm=S.drawFarm;
  S.drawFarm=function(ctx,season,sv,b){const home=b||HK.FARM;if(!home.id)return farm.call(this,ctx,season,sv,b);this.drawRuralHome(ctx,home,HK.state,season,sv);};
  S.ruralAnimalShape=function(type){
    const cow=type==='cow',deer=['deer','hind','fawn'].includes(type),hare=type==='hare',fox=type==='fox',fawn=type==='fawn';
    return {cow,deer,hare,fox,antlers:type==='deer',length:cow?.58:hare?.23:fox?.36:fawn?.29:deer?.45:.36,
      headRadius:hare?2.1:fox?2.7:fawn?2.4:3.3,muzzleRadius:hare?1.4:fawn?1.7:fox?2.1:2.4,
      height:cow?.39:hare?.17:fox?.24:fawn?.28:deer?.4:.25,
      rx:cow?12:hare?5:fox?8:fawn?6.5:deer?10:8,ry:cow?6:hare?3:fox?3.5:fawn?3.3:deer?4.5:5,
      coat:cow?'#c9b492':hare?'#9f947b':fox?'#b2794d':fawn?'#bb9769':deer?'#a88b63':'#dfdac4'};
  };
  S.drawRuralAnimal=function(ctx,x,y,type,head,phase,motion={},part='all'){
    const shape=this.ruralAnimalShape(type),{cow,deer,hare,fox,antlers,length,height}=shape,dx=Math.cos(head),dy=Math.sin(head),nx=-dy,ny=dx;
    const walk=motion.walk??1,tailPhase=motion.tail??phase;
    const p=(u,v,z)=>I.p(x+dx*u+nx*v,y+dy*u+ny*v,z),body=p(0,0,height),a=p(length,0,0),b=p(0,0,0),angle=Math.atan2(a[1]-b[1],a[0]-b[0]);
    if(part==='all'||part==='body'||part==='shadow'){
    ctx.fillStyle='rgba(40,48,30,.17)';ctx.beginPath();ctx.ellipse(b[0],b[1]+1,cow?10:6,3,angle,0,Math.PI*2);ctx.fill();
    }
    if(part==='all'||part==='body'){
    ctx.strokeStyle=cow?'#68513a':'#716d58';ctx.lineWidth=cow?2.3:1.6;
    let leg=0;
    for(const u of [-length*.55,length*.5])for(const v of [-.09,.09]){const top=p(u*.8,v*.7,height),planted=motion.feet?.[leg++],foot=planted?I.p(...planted):p(u+Math.sin(phase+u*6+v*8)*.025*walk,v,0);ctx.beginPath();ctx.moveTo(...top);ctx.lineTo(...foot);ctx.stroke();}
    }
    if(part==='all'||part==='body'||part==='torso'){
    ctx.fillStyle=shape.coat;ctx.beginPath();ctx.ellipse(body[0],body[1],shape.rx,shape.ry,angle,0,Math.PI*2);ctx.fill();
    if(cow){ctx.fillStyle='#7c5c40';for(const [u,v] of [[-.1,-.05],[.15,.02]]){const patch=p(u,v,height+.06);ctx.beginPath();ctx.ellipse(patch[0],patch[1],3.8,2.6,angle,0,Math.PI*2);ctx.fill();}}
    else if(type==='sheep'){ctx.fillStyle='#eee7d1';for(const u of [-.12,0,.12]){const tuft=p(u,0,height+.04);ctx.beginPath();ctx.ellipse(tuft[0],tuft[1]-1,3.8,3,0,0,Math.PI*2);ctx.fill();}}
    }
    if(type==='fawn'&&(part==='all'||part==='torso')){ctx.fillStyle='#e4d1a5';for(const u of [-.12,0,.12]){const q=p(u,0,height+.03);ctx.beginPath();ctx.ellipse(...q,.8,.6,0,0,Math.PI*2);ctx.fill();}}
    const graze=motion.graze??(Math.sin(phase)+1)*.06,h=p(length*.9,0,height-.07-graze),snout=p(length*1.18,0,height-.15-graze);
    if(part==='all'||part==='body'){
    const neck=p(length*.48,0,height-.03);ctx.strokeStyle=cow?'#b0966f':'#79735e';ctx.lineWidth=cow?5:3;ctx.beginPath();ctx.moveTo(...neck);ctx.lineTo(...h);ctx.stroke();
    }
    if(part==='all'||part==='head'){
    ctx.fillStyle=cow?'#b0966f':fox?'#b2794d':deer?'#927653':hare?'#9f947b':'#79735e';ctx.beginPath();ctx.ellipse(h[0],h[1],cow?5:shape.headRadius,cow?4:shape.headRadius*.9,angle,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=cow?'#ddc59c':fox?'#ddd0a9':'#958975';ctx.beginPath();ctx.ellipse(snout[0],snout[1],cow?3.6:shape.muzzleRadius,cow?2.7:shape.muzzleRadius*.75,angle,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#303c2d';ctx.beginPath();ctx.arc(h[0]+1,h[1]-1,1,0,Math.PI*2);ctx.fill();
    for(const v of [-.14,.14]){const ear=p(length*(hare?.62:.86),v,height+(hare?.19:fox?.015:-.07)-graze);ctx.strokeStyle=cow?'#ad9069':'#79735e';ctx.lineWidth=cow?2.5:1.5;ctx.beginPath();if(fox){ctx.fillStyle='#89573c';ctx.moveTo(h[0]-1.2,h[1]);ctx.lineTo(...ear);ctx.lineTo(h[0]+1.2,h[1]);ctx.fill();}else{ctx.moveTo(...h);ctx.lineTo(...ear);ctx.stroke();}}
    if(cow){ctx.strokeStyle='#e1d7b9';ctx.lineWidth=1.2;for(const v of [-.07,.07]){const base=p(length*.86,v,height-.04-graze),tip=p(length*.8,v*1.7,height+.025-graze);ctx.beginPath();ctx.moveTo(...base);ctx.lineTo(...tip);ctx.stroke();}}
    if(hare||fox){const nose=p(length*1.35,0,height-.15-graze);ctx.fillStyle='#393d32';ctx.beginPath();ctx.arc(...nose,.7,0,Math.PI*2);ctx.fill();}
    if(antlers){ctx.strokeStyle='#c4b697';ctx.lineWidth=1;for(const v of [-.07,.07]){const base=p(length*.85,v,height-.03-graze),tip=p(length*.72,v*1.5,height+.12-graze),branch=p(length*.65,v*2,height+.1-graze);ctx.beginPath();ctx.moveTo(...base);ctx.lineTo(...tip);ctx.moveTo(...base);ctx.lineTo(...branch);ctx.stroke();}}
    }
    if(part==='all'||part==='tail'){
    const tail=p(-length*(fox||deer||hare?.5:.75),0,height*(deer||hare?.85:.75)),tip=p(-length*(fox?1.35:deer||hare?.62:.9),.04*Math.sin(tailPhase),height*(fox?.7:deer||hare?.72:.2));ctx.strokeStyle=fox?'#b2794d':'#776047';ctx.lineWidth=1;ctx.beginPath();if(fox){const dx=tip[0]-tail[0],dy=tip[1]-tail[1],len=Math.hypot(dx,dy)||1,nx=-dy/len*2,ny=dx/len*2;ctx.fillStyle='#b2794d';ctx.moveTo(...tail);ctx.lineTo(tail[0]+dx*.45+nx,tail[1]+dy*.45+ny);ctx.lineTo(...tip);ctx.lineTo(tail[0]+dx*.45-nx,tail[1]+dy*.45-ny);ctx.closePath();ctx.fill();ctx.fillStyle='#e0d4b1';ctx.beginPath();ctx.moveTo(...tip);ctx.lineTo(tail[0]+dx*.7+nx*.55,tail[1]+dy*.7+ny*.55);ctx.lineTo(tail[0]+dx*.7-nx*.55,tail[1]+dy*.7-ny*.55);ctx.fill();}else{ctx.moveTo(...tail);ctx.lineTo(...tip);ctx.stroke();}
    }
  };
  const build=S.drawBuilding;
  const cargo=S.drawCargo;
  S.drawCargo=function(ctx,x,y,z,it,...args){if(it?.good==='cattle')return;return cargo.call(this,ctx,x,y,z,it,...args);};
  S.drawBuilding=function(ctx,b,st,season,sv,separate){
    if(['hunter','woodcutter','stonemason'].includes(b.id))return this.drawRuralHome(ctx,b,st,season,sv);
    if(b.id==='malthouse')return this.drawMalthouse(ctx,b,st,season,sv);
    if(b.kind==='hopyard')return this.drawHopGarden(ctx,b,season,sv);
    if(b.kind!=='quarry')return build.call(this,ctx,b,st,season,sv,separate);
    this.drawQuarry(ctx,b,season,sv);
  };
  // Malthouse: a low working hall with the kiln (Darre) and its vent cowl on
  // the right, malt sacks stacked in front of the kiln; all within the footprint.
  S.drawMalthouse=function(c,b,st,season,sv){
    const hall={...b,w:b.w*.68},kx=b.x+hall.w,ky=b.y+.08,kw=b.w-hall.w-.02,kd=.55,kh=b.h+.3,winter=season==='winter';
    this.drawHouse(c,{...hall,noWindowsUpper:true},st,season,sv,false);
    I.shadow(c,kx,ky,kw,kd,kh+.3,sv.v,sv.a*.8);
    I.box(c,kx,ky,0,kw,kd,kh,{wall:'#a8654b'},{noTop:true});
    for(let z=.1;z<kh;z+=.1){I.line(c,[kx,ky+kd,z],[kx+kw,ky+kd,z],'rgba(70,32,22,.28)',.45);I.line(c,[kx+kw,ky,z],[kx+kw,ky+kd,z],'rgba(60,28,20,.32)',.45);}
    // Fire hole under the kiln floor, faintly glowing while the malthouse works.
    const s=st.rural?.sites?.malthouse,burning=s?.active&&!s.reason;
    I.poly(c,[[kx+kw,ky+.18,.04],[kx+kw,ky+.37,.04],[kx+kw,ky+.37,.2],[kx+kw,ky+.18,.2]],burning?'#c7783c':'#3e2c22');
    I.pyramid(c,kx-.03,ky-.03,kh,kw+.06,kd+.06,.32,winter?'#e6eaee':'#5d4d3e');
    const cx=kx+kw/2-.07,cy=ky+kd/2-.07;
    I.box(c,cx,cy,kh+.24,.14,.14,.14,{wall:'#6b5a48',top:'#4e4236'});
    I.pyramid(c,cx-.03,cy-.03,kh+.38,.2,.2,.08,'#5a4a3a');
    for(const [u,v,z] of [[.06,.64,0],[.24,.66,0],[.15,.7,.11]])this.drawCargo(c,kx+u,b.y+v,z,{good:'malt',kind:'sack'},.6);
  };
  // Hop garden: tall poles strung with wire, bines climbing them through the
  // year, and a small shed at the back corner of the yard.
  S.drawHopGarden=function(c,b,season,sv){
    const winter=season==='winter',spring=season==='spring',P=(u,v,z=0)=>[b.x+u,b.y+v,z];
    I.poly(c,[P(0,0),P(b.w,0),P(b.w,b.d),P(0,b.d)],winter?'#c9c6b6':'#7d6a4c');
    for(let v=.2;v<b.d;v+=.35)I.line(c,P(.85,v),P(b.w-.05,v),winter?'#b6b2a1':'#6a593f',1.1);
    this.drawHouse(c,{x:b.x+.06,y:b.y+.08,w:.62,d:.55,h:.45,kind:'eave',wall:'#a99a76',roof:'#6f6148',noWindowsUpper:true},HK.state,season,sv,false);
    const poles=[];for(const u of [.95,1.3,1.65])for(const v of [.2,.55,.9,1.25])poles.push([u,v]);
    poles.sort((p,q)=>p[0]+p[1]-q[0]-q[1]);
    const top=b.h-.05,grow=winter?0:spring?.45:1;
    for(const v of [.2,.55,.9,1.25])I.line(c,P(.95,v,top),P(1.65,v,top),'#8a7d62',.5);
    for(const [u,v] of poles){
      I.line(c,P(u,v,0),P(u,v,top+.04),'#8b6f48',1.4);
      if(!grow)continue;
      const h=top*grow;
      for(let k=0;k<6;k++){const z0=h*k/6,z1=h*(k+1)/6,s=k%2?.035:-.035;I.line(c,P(u+s,v,z0),P(u-s,v,z1),'#5d7b3a',1.3);}
      if(season==='summer'||season==='autumn')for(const [du,z] of [[-.05,top*.82],[.05,top*.68],[-.04,top*.5],[.05,top*.92]]){
        const q=I.p(b.x+u+du,b.y+v,z);c.fillStyle=season==='autumn'?'#c3c47a':'#a9c46c';c.beginPath();c.ellipse(q[0],q[1],1.5,2.2,0,0,Math.PI*2);c.fill();
      }
      if(grow===1){const q=I.p(b.x+u,b.y+v,top*.75);c.fillStyle='rgba(96,130,62,.85)';c.beginPath();c.ellipse(q[0],q[1],3.2,6,0,0,Math.PI*2);c.fill();}
    }
    // A basket of picked cones in front of the shed.
    const q=I.p(b.x+.4,b.y+1.05,.1);c.fillStyle='#9c7c4f';c.beginPath();c.ellipse(q[0],q[1]+2,5,3,0,0,Math.PI*2);c.fill();
    if(!winter){c.fillStyle='#b6cc7a';c.beginPath();c.ellipse(q[0],q[1],4.2,2.2,0,0,Math.PI*2);c.fill();}
  };
  S.drawQuarry=function(c,b,season,sv){
    const P=(u,v,z=0)=>[b.x+u*b.w,b.y+v*b.d,z*b.h],winter=season==='winter';
    const noise=(u,v)=>HK.Art.noise(b.x+u,b.y+v);
    const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
    I.shadow(c,b.x,b.y,b.w,b.d,b.h,sv.v,sv.a*.65);
    // Dusty working floor, with an irregular outline contained in the quarry.
    I.poly(c,[[.015,.15],[.23,.015],[.79,.04],[.99,.28],[.965,.88],[.72,.995],[.2,.96],[.025,.73]].map(q=>P(...q)),winter?'#c4c3b5':'#aaa18a');
    for(let i=0;i<65;i++){
      const u=.05+noise(i,1)*.9,v=.62+noise(i,2)*.32,r=.005+noise(i,3)*.012;
      I.poly(c,[P(u-r,v),P(u,v-r,.002),P(u+r,v),P(u,v+r)],i%3?'rgba(103,99,80,.17)':'rgba(220,211,182,.2)');
    }
    // Three exposed benches of bedrock. Each face shares its vertices with
    // the shelf above/below, so there are no loose lines or floating panels.
    const us=[.015,.12,.26,.4,.55,.71,.85,.98];
    const heights=[.61,.83,.94,.88,.98,.83,.76,.55];
    const front=[.28,.31,.285,.33,.3,.32,.275,.26];
    let back=us.map((u,i)=>P(u,.06+noise(i,4)*.05,heights[i]+.035));
    let top=us.map((u,i)=>P(u,front[i],heights[i]));
    const faces=['#a5a18e','#a9a490','#a19f8b','#ada794','#a4a18d'];
    for(let tier=0;tier<3;tier++){
      const bottom=us.map((u,i)=>P(u,front[i]+tier*.17+.014,tier===0?.49+heights[i]*.07:tier===1?.22+heights[i]*.035:.025));
      if(tier)top=us.map((u,i)=>P(u,front[i]+tier*.17,((back[i][2]/b.h)-.022)));
      // Dark exposed flank gives the rock mass thickness, even at the ends.
      const last=us.length-1;
      I.poly(c,[back[last],top[last],bottom[last],[back[last][0],back[last][1],bottom[last][2]]],'#7d8072');
      for(let i=0;i<us.length-1;i++){
        const a=top[i],bb=top[i+1],d=bottom[i],e=bottom[i+1];
        I.poly(c,[back[i],back[i+1],bb,a],winter?'#d3d4c9':['#bcb49d','#b2ac95','#c2baa4'][(i+tier)%3]);
        I.poly(c,[a,bb,e,d],faces[(i+tier*2)%faces.length]);
        // Bedding planes follow the vertical face, with short fractures and
        // chipped edges instead of repeated diagonal stripes across the rock.
        for(const t of [.35,.72]){
          const left=mix(a,d,t),right=mix(bb,e,t+.025);
          const m=mix(left,right,.45);m[2]-=.012;
          I.lines(c,[[left,m],[m,right]],'rgba(83,84,71,.2)',.5);
          I.line(c,mix(a,d,t+.045),mix(bb,e,t+.06),'rgba(221,214,187,.23)',.4);
        }
        const cut=.23+noise(i,tier+8)*.45,fracture=mix(a,bb,cut),end=mix(d,e,Math.min(.92,cut+.1));
        I.line(c,fracture,mix(fracture,end,.55),'rgba(82,84,73,.18)',.45);
        // Uneven spalls and mineral patches soften the cut faces without
        // turning the whole outcrop into a grid of identical blocks.
        const face=(u,v)=>mix(mix(a,bb,u),mix(d,e,u),v);
        for(let chip=0;chip<5;chip++){
          const u=.1+noise(i*5+chip,tier+22)*.65,v=.12+noise(chip+i,tier+27)*.65;
          I.poly(c,[face(u,v),face(u+.12,v-.055),face(u+.18,v+.075),face(u+.07,v+.16)],chip%2?'rgba(216,209,185,.16)':'rgba(78,82,69,.085)');
        }
        I.poly(c,[a,mix(a,bb,.12),mix(a,d,.11)],'#c3bba5');
        for(let k=0;k<6;k++){
          const u=noise(i*8+k,tier+12),v=.1+noise(k+i,tier+17)*.8;
          const point=mix(mix(a,bb,u),mix(d,e,u),v);
          I.line(c,point,[point[0]+.018,point[1],point[2]-.012],k%2?'rgba(68,74,62,.16)':'rgba(221,214,188,.25)',.4);
        }
      }
      if(!tier){
        // Thin weathered soil cap on the crest, not a roof-like outline.
        for(let i=0;i<us.length-1;i++)I.poly(c,[back[i],back[i+1],mix(back[i+1],top[i+1],.23),mix(back[i],top[i],.18)],winter?'#dadbd0':'#858770');
      }
      back=bottom;
    }
    const rock=(u,v,r,h,tone)=>{
      const a=P(u-r,v-r*.3),bb=P(u+r*.7,v-r*.55),d=P(u+r,v+r*.55),e=P(u-r*.6,v+r*.8);
      const peak=P(u-r*.1,v-r*.1,h),shoulder=P(u+r*.55,v+r*.3,h*.65);
      I.poly(c,[a,bb,shoulder,peak],tone);
      I.poly(c,[bb,d,shoulder],I.shade(tone,.72));
      I.poly(c,[peak,shoulder,d,e,a],I.shade(tone,.86));
      I.poly(c,[peak,shoulder,e],I.shade(tone,.95));
    };
    // A loose scree fan, irregular in size and spacing, with a few larger breaks.
    const rubble=Array.from({length:24},(_,i)=>({u:.45+noise(i,31)*.46,v:.7+noise(i,32)*.2,r:.013+noise(i,33)*.018,h:.02+noise(i,34)*.034}));
    rubble.push({u:.78,v:.75,r:.085,h:.15},{u:.58,v:.72,r:.055,h:.095},{u:.87,v:.83,r:.047,h:.075});
    rubble.sort((a,bb)=>(a.u*b.w+a.v*b.d)-(bb.u*b.w+bb.v*b.d));
    for(const [i,r]of rubble.entries())rock(r.u,r.v,r.r,r.h,['#b9b39e','#a5a591','#c2baa4'][i%3]);
    // Dressed stone is recognisably different from the broken rock behind it.
    for(const v of [.865,.955])I.box(c,b.x+.12,b.y+v*b.d,0,.83,.045,.035,{wall:'#817356',top:'#9a8868'});
    for(let i=0;i<3;i++){
      const x=b.x+.17+i*.25,y=b.y+b.d-.27;
      I.box(c,x,y,.035,.225,.22,.16,{wall:'#aaa996',top:'#ccc7b0'});
      I.line(c,[x+.02,y+.221,.175],[x+.2,y+.221,.175],'#d0cab4',.45);
    }
  };
  S.ruralAnimals=function(t){
    return [[41.5,18.25,'cow'],[42.9,19.5,'cow'],[13.15,-11.35,'sheep'],[13.8,-11.05,'sheep'],[14.35,-11.45,'sheep'],...HK.RURAL_DEER,...HK.WOODLAND_FAUNA].map(([x,y,type],i)=>{
      const {cow,deer,fox,hare,length,height}=this.ruralAnimalShape(type);
      const cx=cow?42.6:x,cy=cow?18.85:y,rx=cow?.42:fox?.52:hare?.3:deer?.28:.16,ry=cow?.24:fox?.3:deer?.2:.12;
      const period=cow?12:11+i*.3,walking=7,offset=cow?0:i*1.7;
      const elapsed=t+offset,cycle=Math.floor(elapsed/period),local=elapsed-cycle*period;
      const f=Math.min(1,local/walking),ease=v=>v*v*v*(v*(v*6-15)+10);
      const travel=cycle+ease(f),blend=Math.sin(Math.PI*f)**2;
      const at=u=>{const angle=(cow?i*Math.PI:i*2)+u*Math.PI/2;
        return{x:cx+Math.cos(angle)*rx,y:cy+Math.sin(angle)*ry,head:Math.atan2(ry*Math.cos(angle),-rx*Math.sin(angle))};};
      const point=at(travel),feet=[],stance=[];
      // Four step cycles per quarter of the path. A supporting hoof is a
      // fixed world point; only the swinging hoof moves to its next foothold.
      // At each rest boundary all four legs are in their supporting phase.
      for(const [j,u] of [-length*.55,length*.5].entries())for(const [k,v] of [-.09,.09].entries()){
        const shift=(j+k)%2*.5,s=travel*4+shift,n=Math.floor(s),part=s-n;
        const foothold=step=>{const q=at((step+.3-shift)/4),dx=Math.cos(q.head),dy=Math.sin(q.head);return[q.x+dx*u-dy*v,q.y+dy*u+dx*v];};
        const a=foothold(n),b=foothold(n+1),swing=Math.max(0,(part-.6)/.4),mix=ease(swing);
        feet.push([a[0]+(b[0]-a[0])*mix,a[1]+(b[1]-a[1])*mix,Math.sin(Math.PI*swing)**2*.07]);stance.push(part<=.6);
      }
      return{...point,type,phase:travel*8*Math.PI,walking:local<walking,travel,
        motion:{walk:blend,feet,stance,graze:(.075+Math.sin(t*.65+i*1.9)*.06)*(1-.8*blend)*(hare?.15:fox?.5:type==='fawn'?.7:1),tail:t*(.95+i*.021)+i*2.3}};
    });
  };
  const extras=S.buildingExtras;
  S.buildingExtras=function(b){
    const list=extras.call(this,b);
    const yy=b.y+b.d,xx=b.x+b.w;
    const add=(part,box,f)=>list.push({part,box,f});
    // Each small work area has a complete support and fits beside the doorway.
    // Bounds include wheels, sacks and handles so it sorts with passing people.
    if(b.id==='grainfarm')add('graincart',[b.x-.12,yy+.06,b.x+.55,yy+.68],c=>{
      const x=b.x+.04,y=yy+.13,z=.18;
      I.poly(c,[[x-.08,y,0],[x+.48,y,0],[x+.48,y+.5,0],[x-.08,y+.5,0]],'rgba(35,39,25,.14)');
      for(const u of [-.045,.465])this.isoWheel(c,x+u,y+.22,.11,.11,0,1,0);
      I.box(c,x,y,z,.42,.34,.045,{wall:'#77603e',top:'#a88b5a'});
      for(let u=.07;u<.42;u+=.07)I.line(c,[x+u,y,z+.046],[x+u,y+.34,z+.046],'#7e6746',.45);
      for(const u of [0,.4]){
        I.box(c,x+u,y,z,.025,.34,.15,{wall:'#8d724a',top:'#b59a67'});
        I.line(c,[x+u,y+.28,z],[x+u,y+.53,.07],'#91744a',1.25);
      }
      I.box(c,x,y,z,.42,.025,.15,{wall:'#8d724a',top:'#b59a67'});
      this.drawCargo(c,x+.14,y+.12,z+.047,{good:'grain',kind:'sack'},.66);
      this.drawCargo(c,x+.29,y+.23,z+.047,{good:'grain',kind:'sack'},.62);
    });
    if(b.id==='fiberfarm')add('flaxbundles',[b.x-.04,yy+.07,b.x+.43,yy+.43],c=>{
      const x=b.x+.04,y=yy+.15;
      for(const u of [0,.28])I.box(c,x+u,y,0,.06,.22,.08,{wall:'#756347',top:'#8d7955'});
      I.box(c,x-.03,y-.015,.08,.39,.25,.025,{wall:'#8e7956',top:'#b0996b'});
      for(const [u,v] of [[.04,.05],[.2,.11]]){
        for(let j=0;j<9;j++){
          const a=(j-4)*.018;
          const tip=[x+u+a*.8+.025,y+v+(j%2)*.012,.39+(j%4)*.018];
          I.line(c,[x+u+a,y+v,.105],tip,['#a29761','#c2b583','#8f885a'][j%3],.45);
          I.line(c,[tip[0]-.014,tip[1],tip[2]-.04],tip,'#a79b6c',.35);
        }
        I.line(c,[x+u-.045,y+v,.24],[x+u+.065,y+v,.24],'#786b43',1);
      }
    });
    if(b.id==='sheepfarm')add('woolrack',[b.x-.08,yy+.04,b.x+.45,yy+.4],c=>{
      const x=b.x-.025,y=yy+.1;
      for(const u of [0,.36])for(const v of [0,.2])I.box(c,x+u,y+v,0,.035,.035,.16,{wall:'#806b4b'});
      for(let v=0;v<.25;v+=.062)I.box(c,x-.025,y+v,.14,.44,.052,.035,{wall:'#87704e',top:'#af9973'});
      this.drawCargo(c,x+.11,y+.11,.175,{good:'wool',kind:'sack'},.72);
      this.drawCargo(c,x+.31,y+.13,.175,{good:'wool',kind:'sack'},.6);
      I.line(c,[x-.04,y+.02,.02],[x-.04,y+.02,.56],'#8f7952',1.1);
      for(const u of [-.045,0,.045])I.line(c,[x-.04,y+.02,.48],[x-.04+u,y+.02,.58],'#716650',.65);
    });
    if(b.id==='dairy')add('cheeserack',[b.x-.09,yy+.05,b.x+.43,yy+.4],c=>{
      const x=b.x-.04,y=yy+.1,z=.24;
      for(const u of [0,.33])for(const v of [0,.18])I.box(c,x+u,y+v,0,.045,.045,z,{wall:'#806c4d'});
      I.box(c,x-.025,y-.02,z,.43,.28,.035,{wall:'#937c54',top:'#b4a17b'});
      for(const v of [.06,.14])I.line(c,[x-.02,y+v,z+.036],[x+.4,y+v,z+.036],'#8d7a56',.4);
      for(const u of [.08,.27])I.cylinder(c,x+u,y+.12,z+.035,.065,.04,'#d1b867');
    });
    if(b.id==='cattlefarm'){
      add('feedingtrough',[41.2,18.95,41.95,19.28],c=>{
        I.box(c,41.22,18.97,0,.7,.27,.14,{wall:'#8b7551',top:'#554d36'});
        for(let i=0;i<7;i++)I.line(c,[41.26+i*.08,19,.15],[41.34+i*.08,19.17,.17],'#b5a36a',.8);
      });
      for(const [i,a] of [[41.05,17.9,43.65,17.9],[43.65,17.9,43.65,19.85],[43.65,19.85,41.05,19.85],[41.05,17.9,41.05,18.35],[41.05,19,41.05,19.85]].entries()){
        const [x,y,x2,y2]=a,len=Math.hypot(x2-x,y2-y),steps=Math.ceil(len/.4);
        add('pasturefence'+i,[Math.min(x,x2)-.035,Math.min(y,y2)-.035,Math.max(x,x2)+.035,Math.max(y,y2)+.035],c=>{
          for(let j=0;j<=steps;j++){const u=x+(x2-x)*j/steps,v=y+(y2-y)*j/steps;I.line(c,[u,v,0],[u,v,.28],'#8a7350',1.25);}
          for(const z of [.12,.23])I.line(c,[x,y,z],[x2,y2,z],'#a28b62',1.2);
        });
      }
    }
    if(b.id==='hunter')add('hiderack',[b.x-.48,b.y+.08,b.x-.16,b.y+.7],c=>{
      for(const y of [b.y+.12,b.y+.66])I.line(c,[b.x-.32,y,0],[b.x-.32,y,.65],'#80684a',1.4);
      I.line(c,[b.x-.32,b.y+.12,.61],[b.x-.32,b.y+.66,.61],'#80684a',1.8);
      I.poly(c,[[b.x-.31,b.y+.2,.53],[b.x-.31,b.y+.58,.56],[b.x-.31,b.y+.53,.18],[b.x-.31,b.y+.39,.25],[b.x-.31,b.y+.27,.16]],'#b99b6e');
      I.line(c,[b.x-.305,b.y+.36,.25],[b.x-.305,b.y+.39,.48],'#9a7b54',.65);
    });
    if(b.id==='stonemason'){
      add('stonework',[b.x+.13,yy+.13,b.x+.81,yy+.54],c=>{
        const x=b.x+.17,y=yy+.18;
        I.poly(c,[[x-.025,y,0],[x+.61,y,0],[x+.61,y+.33,0],[x-.025,y+.33,0]],'rgba(42,43,32,.17)');
        // A banker's bench: heavy trestles, cross-brace and thick planks.
        for(const u of [.02,.46]){
          for(const v of [.02,.22])I.box(c,x+u,y+v,0,.075,.075,.16,{wall:'#7d6b4d',top:'#998564'});
          I.box(c,x+u-.01,y+.015,.10,.095,.29,.045,{wall:'#8f7853',top:'#aa9167'});
        }
        I.line(c,[x+.06,y+.29,.05],[x+.5,y+.29,.14],'#8d7652',1.2);
        for(const v of [0,.11,.22])I.box(c,x-.015,y+v,.16,.61,.105,.05,{wall:'#8c7655',top:'#aa9672'});
        // A low, broad workpiece rests on the tabletop, under the worker's chisel.
        I.box(c,x+.13,y+.065,.21,.37,.215,.09,{wall:'#a9ab98',top:'#ccc8af'});
        I.line(c,[x+.15,y+.275,.295],[x+.48,y+.275,.295],'#d7d1b9',.55);
        for(let i=0;i<7;i++)I.line(c,[x+.155+i*.047,y+.281,.23],[x+.165+i*.047,y+.281,.28],'#8e9383',.35);
        I.line(c,[x+.13,y+.1,.301],[x+.47,y+.1,.301],'#8c8e7c',.35);
        // Small chips lie on the ground, contained within this sortable footprint.
        for(const [u,v,r]of [[.04,.335,.023],[.22,.34,.018],[.55,.32,.025]])
          I.poly(c,[[x+u-r,y+v,0],[x+u,y+v-r,.016],[x+u+r,y+v,0],[x+u,y+v+r,0]],'#b6b49f');
      });
      add('stoneStock',[b.x-.34,yy+.04,b.x+.09,yy+.38],c=>{
        const x=b.x-.3,y=yy+.08;
        for(const v of [.015,.2])I.box(c,x-.015,y+v,0,.36,.045,.045,{wall:'#796b50',top:'#968263'});
        I.box(c,x,y,.045,.3,.25,.13,{wall:'#989d8c',top:'#b6b9a5'});
        I.box(c,x+.035,y+.035,.175,.23,.18,.105,{wall:'#a8ab99',top:'#c6c4af'});
        I.line(c,[x+.02,y+.251,.065],[x+.27,y+.251,.065],'#838b7b',.4);
      });
    }
    if(b.id==='woodcutter')list.push({part:'logpile',box:[b.x+.4,b.y+b.d+.1,b.x+1.1,b.y+b.d+.45],f:c=>{
      for(let i=0;i<3;i++){const x=b.x+.48,y=b.y+b.d+.17+i*.1,z=i===2?.17:0;I.obox(c,x+.23,y,z,1,0,.62,.095,.1,'#9d7f54');const p=I.p(x-.08,y,z+.04);c.fillStyle='#c8ab79';c.beginPath();c.ellipse(p[0],p[1],2.4,1.8,0,0,Math.PI*2);c.fill();}
    }});
    if(b.id==='woodcutter')add('choppingblock',[xx+.12,yy+.42,xx+.42,yy+.72],c=>{
      I.box(c,xx+.14,yy+.44,0,.25,.24,.15,{wall:'#8c7251',top:'#c4a777'});
      const p=I.p(xx+.26,yy+.56,.16);c.strokeStyle='#896f48';c.lineWidth=.6;c.beginPath();c.ellipse(...p,3.5,1.8,0,0,Math.PI*2);c.stroke();
      I.line(c,[xx+.2,yy+.5,.15],[xx+.34,yy+.66,.2],'#755d41',1.2);
      I.box(c,xx+.17,yy+.55,.15,.10,.09,.13,{wall:'#9c7c51',top:'#d0b584'});
      I.line(c,[xx+.215,yy+.55,.28],[xx+.225,yy+.64,.28],'#755938',.55);
    });
    return list;
  };
  const ground=S.makeGround;
  S.makeGround=function(season){
    ground.call(this,season);const c=this.ground.getContext('2d');c.save();c.setTransform(this.RS,0,0,this.RS,0,0);I.path(c,HK.LAND);c.clip();
    for(const forest of HK.RURAL_FORESTS)for(const [x,y,r] of forest.trees){const p=I.p(x,y,0);c.fillStyle=season==='winter'?'rgba(79,90,69,.19)':'rgba(58,73,38,.24)';c.beginPath();c.ellipse(...p,r*17,r*8,0,0,Math.PI*2);c.fill();
      if(season!=='winter')for(let i=0;i<5;i++){const q=I.p(x+Math.sin(i*2+x)*r*.65,y+Math.cos(i*3+y)*r*.65,0);c.fillStyle=i%2?'#8c865c':'#647046';c.beginPath();c.ellipse(...q,1.5,.7,0,0,Math.PI*2);c.fill();}
    }c.restore();
  };
  // A longer work routine reuses a small set of smooth poses at different tempos.
  // No randomness per frame and no ever-growing animation/cache key.
  S.ruralWorkClips={stroke:96,adjust:48,rest:32};
  S.ruralWorkRoutines={
    axe:[['stroke',1.35],['stroke',1.08],['adjust',1.9],['stroke',1.5],['rest',2.2],['stroke',1.18],['adjust',2.3]],
    chisel:[['stroke',.66],['stroke',.48],['stroke',.82],['adjust',1.5],['stroke',.57],['stroke',.72],['rest',1.8],['adjust',1.3]],
    hoe:[['stroke',1.5],['stroke',1.25],['adjust',2.1],['stroke',1.7],['rest',2.2],['stroke',1.35]],
    harvest:[['stroke',1.7],['stroke',1.3],['adjust',2.4],['rest',1.7],['stroke',1.55],['adjust',1.9]],
    pick:[['stroke',1.6],['stroke',1.3],['rest',2.1],['adjust',1.6],['stroke',1.45]],
  };
  S.ruralWorkSample=function(w,t,working=true){
    const routine=this.ruralWorkRoutines[w.task];if(!routine)return null;
    if(!working)return {clip:'rest',frame:0,u:0,key:w.task+':idle'};
    const period=routine.reduce((n,q)=>n+q[1],0),offset=(HK.citizenHash(w.site)%97)/97*period;
    let time=((t+offset)%period+period)%period;
    for(const [clip,duration] of routine){
      if(time<duration){const frames=this.ruralWorkClips[clip],frame=Math.floor(time/duration*frames);return {clip,frame,u:frame/frames,key:w.task+':'+clip+':'+frame};}
      time-=duration;
    }
    return {clip:'stroke',frame:0,u:0,key:w.task+':stroke:0'};
  };
  S.ruralWorkPose=function(w){
    const motion=w.motion||{clip:'stroke',u:((w.phase||0)/(2*Math.PI)%1+1)%1},u=w.working?motion.u:0;
    const smooth=v=>{v=HK.clamp(v,0,1);return v*v*(3-2*v);},wave=Math.sin(Math.PI*u)**2;
    const stroke=w.working&&motion.clip==='stroke',adjust=w.working&&motion.clip==='adjust',rest=w.working&&motion.clip==='rest';
    const lift=stroke?(u<.46?smooth(u/.46):1-smooth((u-.46)/.24)):0;
    const hit=stroke&&u>=.70&&u<.88?(u-.70)/.18:-1;
    const reach=adjust?wave:0,breath=rest?wave:0;
    const lean=(w.task==='chisel'?.17:.25)*(stroke?(1-lift)*wave:reach*.8),bend=stroke?wave*(1-lift)*2.5:reach*2.2;
    if(w.task==='harvest'){
      const sweep=stroke?wave:0,grip=[w.x+.32-sweep*.18,w.y+.14-sweep*.06,.19+reach*.1];
      const second=[w.x+.24,w.y+.10,.24+reach*.13],along=[1,0,0],across=[0,0,1],length=.09;
      return {clip:motion.clip,u,lift,hit:-1,reach,breath,lean,bend,angle:0,grip,tip:[grip[0]+length,grip[1],grip[2]],along,across,second,length};
    }
    const dx=w.task==='chisel'||w.task==='pick'?0:w.task==='hoe'?.97:.876,dy=w.task==='chisel'||w.task==='pick'?-1:w.task==='hoe'?Math.sqrt(1-dx*dx):-Math.sqrt(1-dx*dx);
    const base=w.task==='chisel'?0:w.task==='hoe'?-.68:w.task==='pick'?-.65:-.15;
    const raised=w.task==='chisel'?1.4:w.task==='hoe'?.28:2.05;
    const angle=base+(raised-base)*lift-(w.task==='chisel'?.35:.18)*breath;
    const drag=w.task==='hoe'&&stroke?.12*smooth((u-.70)/.18)*(1-smooth((u-.88)/.12)):0;
    const grip=w.task==='chisel'?[w.x+.055-reach*.035,w.y-.08,.42]:[w.x+.08-dx*drag,w.y+.05-dy*drag,w.task==='hoe'?.36:.37];
    const length=w.task==='chisel'?.24:.49,along=[dx*Math.cos(angle),dy*Math.cos(angle),Math.sin(angle)],across=[-dx*Math.sin(angle),-dy*Math.sin(angle),Math.cos(angle)];
    const tip=grip.map((v,i)=>v+length*along[i]);
    const second=w.task==='chisel'?[tip[0],w.y-.32,.37]:grip.map((v,i)=>v+.14*along[i]);
    if(adjust&&w.task==='axe'){second[0]+=reach*.23;second[1]-=reach*.09;second[2]-=reach*.16;}
    return {clip:motion.clip,u,lift,hit,reach,breath,lean,bend,angle,grip,tip,along,across,second,length};
  };
  S.ruralAxePose=function(w){return this.ruralWorkPose(w);};
  S.ruralWorkers=function(st,season,t){
    if(this.clock<.28||this.clock>.82)return[];
    return HK.RURAL_WORKERS.filter(w=>st.rural?.sites[w.site]?.active&&!(w.crop&&season==='winter')).map((w,i)=>{
      const working=!st.rural.sites[w.site].reason,motion=this.ruralWorkSample(w,t,working);
      return {...w,motion,phase:motion?motion.u*2*Math.PI:Math.floor(t*2+i*3)%16*Math.PI/8,working};
    });
  };
  S.drawRuralCraftWorker=function(c,w){
    const a=this.ruralWorkPose(w),p=I.p(w.x,w.y,0),skin='#d6b995',stone=w.task==='chisel',farmer=['hoe','harvest'].includes(w.task);
    const lean=a.lean,bend=a.bend;
    this.drawPerson(c,...p,w.color,'porter',1,false,skin,0,1,null,{look:w.look,toolArms:true,workLean:lean,workBend:bend,hat:true,head:stone||w.task==='pick'?-Math.PI/2:0},.9);
    const arm=(q,side)=>{
      const hand=I.p(...q),shoulder=[p[0]+side*2.4+11.7*lean,p[1]-10.8+bend*.9];
      const elbow=[shoulder[0]+(hand[0]-shoulder[0])*.48-side*.7,shoulder[1]+(hand[1]-shoulder[1])*.48+1.8];
      c.strokeStyle=w.color;c.lineWidth=1.8;c.beginPath();c.moveTo(...shoulder);c.lineTo(...elbow);c.lineTo(...hand);c.stroke();
      c.fillStyle=skin;c.beginPath();c.arc(...hand,.85,0,Math.PI*2);c.fill();
    };
    if(w.task==='harvest'){
      const left=a.second,right=a.grip;
      // Hold a small sheaf with one hand and draw a curved sickle through it.
      const hop=w.site==='hopgarden';
      for(let i=0;i<4;i++){
        const b=[left[0]+(i-1.5)*.025,left[1],left[2]-.14],top=[b[0]+.03,left[1]-.025,left[2]+.10];
        I.line(c,b,top,hop?'#5f7a3c':'#bba46d',.7);I.line(c,top,[top[0]+.04,top[1],top[2]-.025],hop?'#b6cc7a':'#d1bc7d',.9);
      }
      I.line(c,right,[right[0]+.065,right[1],right[2]-.04],'#816443',1.6);
      const q=I.p(right[0]+.09,right[1],right[2]);c.strokeStyle='#adb6a0';c.lineWidth=1.15;c.beginPath();c.arc(q[0],q[1],3,.15,Math.PI*1.3);c.stroke();
      arm(left,-1);arm(right,1);return;
    }
    if(stone){
      // The support hand holds the chisel against the stone; the other swings a mallet.
      I.line(c,[a.second[0],w.y-.32,.302],[a.second[0],w.y-.32,.44],'#bac1ad',1.1);
      I.line(c,a.grip,a.tip,'#8c7250',1.4);
      I.obox(c,a.tip[0],a.tip[1],a.tip[2]-.04,1,0,.16,.09,.08,'#9c8969');
    }else{
      I.line(c,a.grip,a.tip,'#91734c',1.5);
      if(w.task==='axe'){
        const blade=(l,v)=>a.tip.map((q,i)=>q+l*a.along[i]+v*a.across[i]);
        I.poly(c,[blade(-.045,.035),blade(.035,.025),blade(.055,-.12),blade(-.075,-.14)],'#697673','#454e49',.45);
        I.line(c,blade(.055,-.12),blade(-.075,-.14),'#bec6b8',.8);
      }else if(w.task==='hoe'){
        I.poly(c,[[a.tip[0]-.055,a.tip[1]-.08,a.tip[2]],[a.tip[0]+.07,a.tip[1]-.065,a.tip[2]],[a.tip[0]+.07,a.tip[1]+.055,a.tip[2]-.035],[a.tip[0]-.055,a.tip[1]+.04,a.tip[2]-.035]],'#747d6a','#adb199',.4);
      }else I.line(c,[a.tip[0]-.13,a.tip[1],a.tip[2]-.04],[a.tip[0]+.13,a.tip[1],a.tip[2]-.015],'#929b8c',1.8);
    }
    arm(a.second,-1);arm(a.grip,1);
    if(a.hit>=0){
      const z=stone?.305:farmer?.045:w.task==='axe'?.17:.08,base=I.p(a.tip[0],a.tip[1],z),flight=a.hit;
      for(let i=0;i<3;i++){
        const x=base[0]+(i-1)*flight*5,y=base[1]-Math.sin(flight*Math.PI)*(2+i*.5);
        c.fillStyle=stone?'#c0bda6':farmer?'#827653':'#ba9a65';c.beginPath();c.ellipse(x,y,.7*(1-flight*.6),.4,0,0,Math.PI*2);c.fill();
      }
    }
  };
  S.drawRuralWorker=function(c,w){
    if(this.ruralWorkRoutines[w.task])return this.drawRuralCraftWorker(c,w);
    const p=I.p(w.x,w.y,0),swing=w.working?Math.sin(w.phase):0;
    this.drawPerson(c,...p,w.color,w.task==='hunt'?'fisher':'porter',1,false,'#d6b995',0,1,null,{look:w.look,toolArms:w.task==='axe',hat:w.task!=='churn',head:['hunt','chisel','pick'].includes(w.task)?Math.PI:0},.9);
    if(w.task==='hunt'){
      const x=w.x+.16,y=w.y;
      I.line(c,[x,y,.13],[x+.14,y,.43],'#ae9568',1.3);I.line(c,[x+.14,y,.43],[x,y,.68],'#ae9568',1.3);I.line(c,[x,y,.13],[x+.025+swing*.015,y,.4],'#c0b89a',.55);I.line(c,[x+.025+swing*.015,y,.4],[x,y,.68],'#c0b89a',.55);
      I.line(c,[w.x-.1,w.y,.4],[w.x-.18,w.y,.68],'#6f5940',2.6);
    }else if(w.task==='shepherd')I.line(c,[w.x+.2,w.y+.08,0],[w.x+.2,w.y+.08,.7],'#8c7552',1.3);
    else if(w.task==='feed'||w.task==='sack')this.drawCargo(c,w.x+.18,w.y+.07,.11,{good:w.good||(w.task==='feed'?'grain':'flour'),kind:'sack'});
    else if(w.task==='churn'){
      this.barrel3(c,w.x+.28,w.y+.05,0,.85);I.line(c,[w.x+.28,w.y+.05,.2],[w.x+.28,w.y+.05,.52+swing*.04],'#b39c71',1.3);
    }
  };
  const update=S.update;
  S.update=function(dt){update.call(this,dt);const mill=HK.state?.rural?.sites.windmill;if(mill?.active&&!mill.reason)this.ruralMillAngle=((this.ruralMillAngle||0)+dt*this.MILL_SPEED)%(Math.PI*2);};
  S.addRuralItems=function(list,ctx,st,season,t){
    const ids={farm:'cattlefarm',ham0:'grainfarm',ham1:'fiberfarm',ham2:'sheepfarm',ham3:'dairy','windmill-body':'windmill'};
    for(const item of list){
      if(ids[item.c]){const b=HK.RURAL_BUILDINGS[ids[item.c]];item.pick={kind:'building',building:b,panel:'rural',label:HK.name(b)};}
      if(item.r==='windmill-rotor'){item.angle=this.ruralMillAngle||0;item.f=c=>this.drawWindmillRotor(c,this.picking?item.angle:0);const b=HK.RURAL_BUILDINGS.windmill;item.pick={kind:'building',building:b,panel:'rural',label:HK.name(b)};}
    }
    for(const b of [HK.FARM,...HK.HAMLET])for(const extra of this.buildingExtras(b))if(extra.box){
      const box=extra.box;list.push({c:'rural-yard:'+b.id+':'+extra.part,k:(box[0]+box[2])/2+box[3],box,f:extra.f,pick:{kind:'building',building:b,panel:'rural',label:HK.name(b)}});
    }
    for(const [i,a] of this.ruralAnimals(t).entries()){
      // The renderer retains body, head and tail separately. Only their
      // transforms change; slow motion no longer re-tessellates silhouettes.
      list.push({r:'livestock:'+i,animal:a,v:a.head+':'+a.phase,ap:I.p(a.x,a.y,0),k:this.pointKey(a.x,a.y),box:[a.x-.25,a.y-.2,a.x+.25,a.y+.2],f:c=>this.drawRuralAnimal(c,a.x,a.y,a.type,a.head,a.phase,a.motion)});
    }
    for(const [i,w] of this.porters.entries())if(w.freightJob?.good==='cattle'&&w.items?.length){
      const p=this.porterPos(w),head=w.head||0,x=p.wx-Math.cos(head)*.35,y=p.wy-Math.sin(head)*.35,phase=w.phase||0,motion={walk:w.moving?1:0,graze:.015,tail:t*.7+i};
      const blocked=HK.BUILDINGS.some(b=>b.w&&x>b.x-.2&&x<b.x+b.w+.2&&y>b.y-.2&&y<b.y+b.d+.2);
      if(!blocked&&!this.isWater(x,y))list.push({r:'herd:'+i,v:head+':'+phase+':'+motion.walk+':'+motion.tail,ap:I.p(x,y,0),k:this.pointKey(x,y),box:[x-.25,y-.2,x+.25,y+.2],f:c=>this.drawRuralAnimal(c,x,y,'cow',head,phase,motion)});
    }
    for(const w of this.ruralWorkers(st,season,t)){
      const b=HK.RURAL_BUILDINGS[w.site];list.push({s:'rural-worker:'+w.site+':'+(w.motion?.key||w.phase)+':'+w.working,ap:I.p(w.x,w.y,0),k:this.pointKey(w.x,w.y),box:[w.x-.1,w.y-.1,w.x+.1,w.y+.1],ruralWorker:w,
        pick:{kind:'building',building:b,panel:'rural',label:HK.name(b)},f:c=>this.drawRuralWorker(c,w)});
    }
    return list;
  };
  if(HK.PixiScene){
    // Rasterise each small layer once at the maximum map display resolution.
    // Linear texture sampling preserves subpixel head/tail motion. Rebuilding
    // vector strokes every frame makes their edge coverage jump between MSAA
    // samples even when all of the input coordinates move continuously.
    HK.PixiScene.animalGraphic=function(e,it){
      const a=it.animal,ap=it.ap,shape=S.ruralAnimalShape(a.type),{cow,deer,hare,fox,antlers,length,height}=shape;
      if(!e){
        const g=new PIXI.Container(),textures=[],layers={},canonical=I.p(0,0,0);
        const layer=(name,texture,width,height,x,y)=>{
          const node=new PIXI.Container(),sprite=new PIXI.Sprite(texture);
          sprite.position.set(x,y);sprite.width=width;sprite.height=height;
          node.addChild(sprite);g.addChild(node);layers[name]=node;return node;
        };
        const picture=part=>{
          const canvas=document.createElement('canvas');canvas.width=384;canvas.height=312;
          const c=canvas.getContext('2d');c.setTransform(6,0,0,6,(32-canonical[0])*6,(36-canonical[1])*6);
          S.drawRuralAnimal(c,0,0,a.type,-Math.PI/4,0,{walk:0,graze:.045},part);
          const texture=PIXI.Texture.from(canvas);texture.source.scaleMode='linear';textures.push(texture);
          return layer(part,texture,64,52,-32,-36);
        };
        // A reusable, softly sampled unit segment for legs, neck and tail.
        const canvas=document.createElement('canvas');canvas.width=8;canvas.height=24;
        const c=canvas.getContext('2d');c.fillStyle='#fff';c.fillRect(0,8,8,8);
        const line=PIXI.Texture.from(canvas);line.source.scaleMode='linear';textures.push(line);
        picture('shadow');
        for(let j=0;j<4;j++)layer('leg'+j,line,1,3,0,-1.5);
        picture('torso');layer('neck',line,1,3,0,-1.5);
        const diskCanvas=document.createElement('canvas');diskCanvas.width=diskCanvas.height=64;
        const dc=diskCanvas.getContext('2d');dc.fillStyle='#fff';dc.beginPath();dc.arc(32,32,24,0,Math.PI*2);dc.fill();
        const disk=PIXI.Texture.from(diskCanvas);disk.source.scaleMode='linear';textures.push(disk);
        const ellipse=(name,rx,ry,color)=>{const w=rx*2/.75,h=ry*2/.75,node=layer(name,disk,w,h,-w/2,-h/2);node.children[0].tint=color;};
        ellipse('head',cow?5:shape.headRadius,cow?4:shape.headRadius*.9,cow?0xb0966f:fox?0xb2794d:deer?0x927653:hare?0x9f947b:0x79735e);
        ellipse('muzzle',cow?3.6:shape.muzzleRadius,cow?2.7:shape.muzzleRadius*.75,cow?0xddc59c:fox?0xddd0a9:0x958975);if(hare||fox)ellipse('nose',.7,.7,0x393d32);
        ellipse('eye',1,1,0x303c2d);
        for(const name of ['ear0','ear1',...(cow||antlers?['horn0','horn1']:[]),...(antlers?['branch0','branch1']:[]),'tail'])layer(name,line,1,3,0,-1.5);
        if(fox){
          const canvas=document.createElement('canvas');canvas.width=64;canvas.height=32;const c=canvas.getContext('2d');
          c.fillStyle='#b2794d';c.beginPath();c.moveTo(0,16);c.quadraticCurveTo(28,-12,64,16);c.quadraticCurveTo(28,44,0,16);c.fill();
          c.fillStyle='#e0d4b1';c.beginPath();c.moveTo(45,8);c.lineTo(64,16);c.lineTo(45,24);c.lineTo(48,16);c.fill();
          const texture=PIXI.Texture.from(canvas);texture.source.scaleMode='linear';textures.push(texture);const sprite=layers.tail.children[0];sprite.texture=texture;sprite.position.set(0,-.5);sprite.width=1;sprite.height=1;
        }
        if(fox){
          const canvas=document.createElement('canvas');canvas.width=64;canvas.height=32;const c=canvas.getContext('2d');c.fillStyle='#fff';c.beginPath();c.moveTo(0,0);c.lineTo(64,16);c.lineTo(0,32);c.fill();const texture=PIXI.Texture.from(canvas);texture.source.scaleMode='linear';textures.push(texture);
          for(const name of ['ear0','ear1']){const sprite=layers[name].children[0];sprite.texture=texture;sprite.position.set(0,-.5);sprite.width=1;sprite.height=1;}
        }
        layers.shadow.pivot.set(0,1);
        layers.torso.pivot.set(0,-height*I.ZS);
        g.animalLayers=layers;
        e={g,textures,verl:[],lampen:[]};
      }
      const layers=e.g.animalLayers,dx=Math.cos(a.head),dy=Math.sin(a.head);
      const p=(u,v,z)=>{const q=I.p(a.x+dx*u-dy*v,a.y+dy*u+dx*v,z);return[q[0]-ap[0],q[1]-ap[1]];};
      const axis=p(1,0,0),angle=Math.atan2(axis[1],axis[0]),foreshorten=Math.hypot(...axis)/(Math.SQRT2*I.TW);
      const place=(layer,point,scale=foreshorten)=>{layer.position.set(...point);layer.rotation=angle;layer.scale.set(scale,1);};
      const segment=(name,start,end,width,color)=>{
        const node=layers[name],x=end[0]-start[0],y=end[1]-start[1];
        node.position.set(...start);node.rotation=Math.atan2(y,x);node.scale.set(Math.hypot(x,y),width);node.children[0].tint=color;
      };
      place(layers.shadow,[0,1]);place(layers.torso,p(0,0,height));
      let j=0;
      for(const u of [-length*.55,length*.5])for(const v of [-.09,.09]){
        const foot=I.p(...a.motion.feet[j]);
        segment('leg'+j,p(u*.8,v*.7,height),[foot[0]-ap[0],foot[1]-ap[1]],cow?2.3:1.6,cow?0x68513a:0x716d58);j++;
      }
      const head=p(length*.9,0,height-.07-a.motion.graze);
      segment('neck',p(length*.48,0,height-.03),head,cow?5:3,cow?0xb0966f:0x79735e);
      layers.head.position.set(...head);
      layers.muzzle.position.set(...p(length*1.18,0,height-.15-a.motion.graze));
      layers.eye.position.set(head[0]+1,head[1]-1);if(hare||fox)layers.nose.position.set(...p(length*1.35,0,height-.15-a.motion.graze));
      for(const [i,v] of [-.14,.14].entries())segment('ear'+i,head,p(length*(hare?.62:.86),v,height+(hare?.19:fox?.015:-.07)-a.motion.graze),cow?2.5:fox?2.4:1.5,cow?0xad9069:fox?0x89573c:0x79735e);
      if(cow)for(const [i,v] of [-.07,.07].entries())segment('horn'+i,p(length*.86,v,height-.04-a.motion.graze),p(length*.8,v*1.7,height+.025-a.motion.graze),1.2,0xe1d7b9);
      if(antlers)for(const [i,v] of [-.07,.07].entries()){
        const base=p(length*.85,v,height-.03-a.motion.graze);
        segment('horn'+i,base,p(length*.72,v*1.5,height+.12-a.motion.graze),1,0xc4b697);
        segment('branch'+i,base,p(length*.65,v*2,height+.1-a.motion.graze),1,0xc4b697);
      }
      segment('tail',p(-length*(fox||deer||hare?.5:.75),0,height*(deer||hare?.85:.75)),p(-length*(fox?1.35:deer||hare?.62:.9),.06*Math.sin(a.motion.tail),height*(fox?.7:deer||hare?.72:.2)),fox?4:1,fox?0xffffff:0x776047);
      return e;
    };
    HK.PixiScene.animalMask=function(g,mask){
      if(!mask){
        mask=new PIXI.Container();mask.animalLayers={};
        for(const [part,layer] of Object.entries(g.animalLayers)){
          const copy=new PIXI.Container(),source=layer.children[0],sprite=new PIXI.Sprite(source.texture);
          sprite.position.copyFrom(source.position);sprite.scale.copyFrom(source.scale);sprite.tint=0x000000;
          copy.addChild(sprite);mask.addChild(copy);mask.animalLayers[part]=copy;
        }
      }
      for(const [part,layer] of Object.entries(g.animalLayers)){
        const copy=mask.animalLayers[part];copy.position.copyFrom(layer.position);copy.pivot.copyFrom(layer.pivot);
        copy.scale.copyFrom(layer.scale);copy.rotation=layer.rotation;
      }
      return mask;
    };
  }
})();
