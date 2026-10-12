/* Ortsgebundene Stadtdetails und kleine Alltagsszenen.
   Feste Standflächen, gespeicherte Geometrie und deterministische Variation. */
'use strict';
// Named contacts keep recognisable clothes, faces and tools in every pose.
HK.NAMED_LOOKS = {
  priest: {hair:'#aaa291',beard:'short',cap:'none',trim:'#cbc3a5',action:'book',width:.92},
  customs: {hair:'#76543a',beard:'moustache',cap:'cap',trim:'#b2a071',action:'ledger'},
  innkeeper: {hair:'#795033',cap:'bonnet',apron:'#d1c5a6',action:'mug',width:1.08},
  guild: {hair:'#b9b1a0',beard:'short',cap:'beret',trim:'#bea571',action:'talk',width:1.1},
  bailiff: {hair:'#493d32',beard:'moustache',cap:'cap',trim:'#96968b',action:'patrol',width:1.06},
  changer: {hair:'#6c5140',beard:'short',cap:'beret',trim:'#b6a466',action:'coins',width:.94},
  shipwright: {hair:'#9b7954',beard:'full',cap:'none',apron:'#a08c69',action:'measure',width:1.12},
  mayor: {hair:'#c3beb0',beard:'short',cap:'beret',trim:'#d0b376',action:'ledger',width:1.12},
  abbot: {hair:'#b6b0a1',beard:'full',cap:'hood',trim:'#b8a989',action:'book',width:1.05},
  craftmaster: {hair:'#6e4830',beard:'moustache',cap:'cap',apron:'#b8a781',action:'measure',width:1.08},
  harbourmaster: {hair:'#aaa591',beard:'full',cap:'cap',trim:'#b4a67a',action:'ledger'},
  divekeeper: {hair:'#4b382b',beard:'full',cap:'none',apron:'#8c8066',action:'mug',width:1.13},
  schoolmaster: {hair:'#8b8270',cap:'beret',trim:'#c3bba4',action:'book',width:.9},
  weighmaster: {hair:'#9f7c4c',beard:'short',cap:'cap',apron:'#b3a58a',action:'ledger',width:1.04},
};
HK.NAMED_ACTIVITIES = {
  book:['liest in einem Buch','reading a book'], ledger:['prüft Aufzeichnungen','checking records'],
  mug:['reinigt einen Krug','cleaning a mug'], coins:['zählt Münzen','counting coins'],
  measure:['prüft sein Werkzeug','checking tools'], patrol:['hält Ausschau','keeping watch'],
  talk:['gestikuliert','gesturing'], walk:['auf einem Rundgang','making the rounds'],
};

HK.CITY_DETAILS = [
  { id: 'church-bench', kind: 'bench', x: 11.25, y: 4.68, w: .70, d: .24, district: 'church', stone: true },
  { id: 'church-herbs', kind: 'planter', x: 13.55, y: 4.63, w: .40, d: .26, district: 'church' },
  { id: 'tavern-table', kind: 'table', x: 16.2, y: 7.66, w: .42, d: .28, district: 'market' },
  { id: 'east-bench', kind: 'bench', x: 33.30, y: 6.35, w: .70, d: .24, district: 'east', stone: true },
  { id: 'east-flowers', kind: 'planter', x: 33.75, y: 8.18, w: .32, d: .25, district: 'east' },
  { id: 'potter-shelf', kind: 'pottery', x: 25.90, y: 12.40, w: .46, d: .28, district: 'craft' },
  { id: 'baker-basket', kind: 'basket', x: 25.78, y: 6.93, w: .24, d: .24, district: 'craft' },
  { id: 'harbour-rope', kind: 'rope', x: 15.15, y: 19.65, w: .30, d: .25, district: 'harbour' },
  { id: 'harbour-bench', kind: 'bench', x: 24.45, y: 18.35, w: .60, d: .22, district: 'harbour' },
  { id: 'dock-dice-table', kind: 'diceTable', x: 13.35, y: 19.35, w: .42, d: .28, district: 'harbour' },
  { id: 'dock-fish-tray', kind: 'fishTray', x: 10.72, y: 19.65, w: .44, d: .26, district: 'harbour' },
  { id: 'village-bench', kind: 'bench', x: 14.40, y: -6.20, w: .60, d: .24, district: 'village' },
  { id: 'village-herbs', kind: 'planter', x: 18.1, y: -6.6, w: .36, d: .30, district: 'village' },
  { id: 'gate-sign', kind: 'waypost', x: 40.3, y: 9.0, w: .18, d: .18, district: 'gate' },
  // Small planted pockets, surveyed off the roads, doorways and working yards.
  ...[[17.8,4.35],[23.48,-1.25],[28,3.15],[37.78,3.25],[28,6.75],[28,8.75],[28,11.55],[32.35,16.15],[33.15,16.15]].map(([x,y],i)=>({id:'courtyard-pot-'+i,kind:'flowerpot',x,y,w:.48,d:.4,variant:i,district:'garden'})),
  ...[[23.5,-.75],[26.5,-.75],[35.25,.25],[19.5,15],[13.75,14.75]].map(([x,y],i)=>({id:'city-garden-'+i,kind:'garden',x,y,w:.85,d:.5,variant:i,district:'garden'})),
];
HK.CITY_ACTORS = [
  { id: 'church-reader', action: 'read', x: 12.13, y: 4.75, color: '#6c6950', district: 'church' },
  { id: 'net-mender', action: 'mend', x: 10.68, y: .20, color: '#617782', district: 'fisher' },
  { id: 'quay-angler', action: 'fish', x: 7.17, y: 8.9, color: '#647474', district: 'harbour' },
  { id: 'potter-worker', action: 'work', x: 26.9, y: 12.6, color: '#927654', district: 'craft' },
  { id: 'tavern-guest', action: 'drink', x: 16.78, y: 7.91, color: '#85604f', district: 'market', evening: true },
  { id: 'east-reader', action: 'read', x: 34.18, y: 6.45, color: '#576c70', district: 'east' },
  // Off the through-road and away from crane loading lanes. Each gathering
  // has its own hours; it does not fabricate freight or alter the economy.
  { id: 'dock-fishmonger', action: 'work', x: 10.43, y: 19.55, color: '#98745b', district: 'harbour', hours: [.29, .68] },
  { id: 'dock-customer', action: 'talk', x: 11.38, y: 19.68, color: '#798468', district: 'harbour', hours: [.34, .64], dir: -1 },
  { id: 'dock-net-mender', action: 'mend', x: 21.65, y: 19.56, color: '#64818a', district: 'harbour', hours: [.33, .73] },
  { id: 'dock-rope-worker', action: 'mend', x: 15.75, y: 19.51, color: '#9a8057', district: 'harbour', hours: [.32, .71] },
  { id: 'dock-cooper', action: 'hammer', x: 17.52, y: 19.45, color: '#977353', district: 'harbour', hours: [.35, .75] },
  { id: 'dock-clerk', action: 'read', x: 26.60, y: 19.20, color: '#627b70', district: 'harbour', hours: [.37, .76] },
  { id: 'dock-angler', action: 'fish', x: 26.5, y: 23.3, color: '#7b8065', district: 'harbour', hours: [.30, .85], fishing: [.95, .48] },
  { id: 'dock-dice-player', action: 'dice', x: 13.08, y: 19.65, color: '#9e7359', district: 'harbour', hours: [.66, .94] },
  { id: 'dock-dice-friend', action: 'drink', x: 14.02, y: 19.50, color: '#627b83', district: 'harbour', hours: [.66, .94], dir: -1 },
  { id: 'dock-fiddler', action: 'fiddle', x: 14.40, y: 19.62, color: '#956f75', district: 'harbour', hours: [.72, .91] },
  { id: 'dock-sailor', action: 'talk', x: 25.80, y: 19.22, color: '#77858d', district: 'harbour', hours: [.63, .92] },
  { id: 'dock-sailor-friend', action: 'drink', x: 26.18, y: 19.37, color: '#977d5c', district: 'harbour', hours: [.63, .92], dir: -1 },
];
HK.CITY_BIRDS = [
  { id: 'market-pigeons', kind: 'pigeon', x: 13.8, y: 7.6, radius: .20, n: 3 },
  { id: 'east-pigeons', kind: 'pigeon', x: 33.8, y: 9.15, radius: .18, n: 3 },
  { id: 'church-pigeons', kind: 'pigeon', x: 10.85, y: 4.8, radius: .14, n: 2 },
  ...HK.PIERS.map((p, i) => ({ id: 'pier-gull-' + i, kind: 'gull', x: p.x - p.w / 2 + .16, y: p.y1 - .16, z: .2, radius: 0, n: 1 })),
];
{
  const S = HK.Scene, I = HK.Iso, A = HK.Art;
  const rect = d => [d.x, d.y, d.x + d.w, d.y + d.d];
  S.cityDetailBox = rect;
  S.cityMarketOpen = function () { return this.clock >= .25 && this.clock < .83; };
  S.marketGoods = ['grain','meat','cheese','beer','cloth','fish'];
  S.marketStockLevel = function (index) {
    const good=this.marketGoods[index], qty=HK.state?.town.stock[good]||0;
    return qty<=0?0:Math.min(3,Math.max(1,Math.ceil(qty/HK.desired(good)*3)));
  };
  S.marketStallKey = function (index) { return this.cityMarketOpen()+'|'+this.marketStockLevel(index); };
  S.marketCustomerPose = function (index,t) {
    // Front-of-counter approaches stay outside stalls, the well and statues.
    const routes=[[[12.9,9.5],[12.6,7.1],[12.225,6.8]],[[12.9,9.5],[12.6,7.1],[14,7.1],[13.225,6.8]],
      [[13,10],[12.9,9.5],[12.6,7.1],[14,7.1],[14.225,6.8]],[[12.9,9.5],[12.65,8.18],[12.055,8.18]]];
    const path=routes[index%4], stall=[0,1,2,5][index%4];
    const lengths=path.slice(1).map((b,i)=>Math.hypot(b[0]-path[i][0],b[1]-path[i][1]));
    const travel=lengths.reduce((a,b)=>a+b,0)/.34, wait=7+index, cycle=travel*2+wait;
    let u=(t+index*13)%cycle, moving=true, returning=u>=travel+wait;
    if(u>=travel&&u<travel+wait) {u=travel;moving=false;}
    else if(returning) u=cycle-u;
    let distance=u*.34, leg=0;
    while(leg<lengths.length-1&&distance>lengths[leg]) distance-=lengths[leg++];
    const a=path[leg],b=path[leg+1],f=HK.clamp(distance/lengths[leg],0,1);
    return{x:a[0]+(b[0]-a[0])*f,y:a[1]+(b[1]-a[1])*f,head:Math.atan2(b[1]-a[1],b[0]-a[0])+(returning?Math.PI:0),moving,returning,stall};
  };
  S.namedNpcClear = function (x,y) {
    // Keep a body-width clearance from scenery, water and other standing actors.
    if (HK.CITY_ACTORS.some(a=>Math.hypot(a.x-x,a.y-y)<.22)) return false;
    return [[0,0],[.11,0],[-.11,0],[0,.11],[0,-.11]].every(([dx,dy])=>!this.blockedAt(x+dx,y+dy)&&!this.isWater(x+dx,y+dy));
  };
  S.namedNpcRoute = function (source) {
    const home=this.staticNpcPos(source),key=home.person+'|'+home.x+'|'+home.y+'|'+this.churchAisle();
    const cache=this._namedRoutes ||= new Map();
    if(cache.has(key))return cache.get(key);
    let a=[home.x,home.y];
    // Some old stand positions touched props. Find the closest clear footing once.
    if(!this.namedNpcClear(...a)) {
      search: for(let r=.12;r<=1.2;r+=.12)for(let j=0;j<16;j++) {
        const q=[home.x+Math.cos(j*Math.PI/8)*r,home.y+Math.sin(j*Math.PI/8)*r];
        if(this.namedNpcClear(...q)){a=q;break search;}
      }
    }
    let b=a;
    search: for(const len of [1.1,.85,.6,.4])for(let j=0;j<16;j++) {
      const angle=(j+HK.STATIC_NPCS.indexOf(source)*3)*Math.PI/8,q=[a[0]+Math.cos(angle)*len,a[1]+Math.sin(angle)*len];
      let clear=true;
      for(let k=0;k<=24;k++)if(!this.namedNpcClear(a[0]+(q[0]-a[0])*k/24,a[1]+(q[1]-a[1])*k/24)){clear=false;break;}
      if(clear){b=q;break search;}
    }
    const route={a,b,length:Math.hypot(b[0]-a[0],b[1]-a[1])};
    cache.set(key,route);return route;
  };
  S.namedNpcPose = function (source,t) {
    const route=this.namedNpcRoute(source),index=HK.STATIC_NPCS.indexOf(source),look=HK.NAMED_LOOKS[source.person];
    const duration=route.length/.23,wait=7+index%5,cycle=2*(wait+duration);
    const u=((t+index*5.7)%cycle+cycle)%cycle;
    let distance=0,moving=false,back=false,progress=0;
    if(u>=wait&&u<wait+duration){progress=(u-wait)/duration;moving=true;}
    else if(u>=wait+duration&&u<2*wait+duration){progress=1;}
    else if(u>=2*wait+duration){progress=1-(u-2*wait-duration)/duration;moving=true;back=true;}
    if(!duration){progress=0;moving=false;}
    // Ease starts and stops; coordinates remain continuous, only limb poses are cached.
    const f=progress*progress*(3-2*progress);distance=f*route.length;
    const angle=Math.atan2(route.b[1]-route.a[1],route.b[0]-route.a[0])+(back?Math.PI:0);
    const head=moving?Math.round(angle/(Math.PI/4))*Math.PI/4:Math.PI/4+(index%3-1)*Math.PI/4;
    const frame=moving?Math.round(distance*24)%12:Math.floor((t*.55+index)*16)%16;
    return{x:route.a[0]+(route.b[0]-route.a[0])*f,y:route.a[1]+(route.b[1]-route.a[1])*f,
      head,moving,frame,phase:moving?frame*Math.PI/6:0,gesture:moving?0:frame*Math.PI/8,action:moving?'walk':look.action};
  };
  S.cityActorActive = function (actor) {
    if (this.weather === 'rain' || this.weather === 'snow' || HK.state?.town?.events?.some(e => e.type === 'plague')) return false;
    const hours = actor.hours || [.30, actor.evening ? .93 : .77];
    return this.clock >= hours[0] && this.clock < hours[1];
  };
  A.pavingPalette = (x, y) => y > 16 ? ['#92978c', '#a3a697', '#858c83', '#acafa0', '#909789'] : x > 24 && x < 31 ? ['#9b9178', '#aba084', '#8d856e', '#b1a386', '#998c72'] : x >= 31 ? ['#999b8a', '#aaa895', '#898e81', '#b3ae99', '#969b87'] : ['#a09a83', '#ada58e', '#8e8c7b', '#b5aa90', '#98927d'];

  // All planting is deterministic and shares the static scenery cache. No per-frame foliage rebuilds.
  S.drawGardenPlant = function(ctx,x,y,z,r,season,variant) {
    const winter=season==='winter',autumn=season==='autumn',herbs=variant%3===0;
    const colors=winter?['#666b55','#808574','#a7ab96']:autumn?['#5f7045','#899153','#a9a064']:['#496d4c','#739054','#9cac70'];
    const p=I.p(x,y,z),height=r*(herbs?1.25:.9);
    for(let j=0;j<5;j++) {
      const angle=j*2.4+variant,px=p[0]+Math.cos(angle)*r*.47,py=p[1]-height*(.35+j*.13)+Math.sin(angle)*r*.2;
      ctx.strokeStyle='#70734c';ctx.lineWidth=.55;ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(px,py-height*.35);ctx.stroke();
      if(winter&&variant%3===1)continue;
      ctx.fillStyle=colors[j%3];ctx.beginPath();ctx.ellipse(px,py,r*.48,r*.32,angle*.25,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=colors[(j+1)%3];ctx.beginPath();ctx.ellipse(px-r*.13,py-r*.13,r*.28,r*.16,-.4,0,Math.PI*2);ctx.fill();
      if(!winter&&!herbs&&(!autumn||j%2===0)){
        ctx.fillStyle=autumn?'#ba9567':['#dac992','#bc8587','#a59cbd'][variant%3];
        for(let k=0;k<3;k++){const a=k*2.1;ctx.beginPath();ctx.arc(px+Math.cos(a)*.72,py-height*.3+Math.sin(a)*.55,.72,0,Math.PI*2);ctx.fill();}
        ctx.fillStyle='#e2c276';ctx.beginPath();ctx.arc(px,py-height*.3,.35,0,Math.PI*2);ctx.fill();
      }
      if(winter&&j%2===0){ctx.strokeStyle='#dde0d0';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(px-r*.3,py-r*.18);ctx.lineTo(px+r*.15,py-r*.24);ctx.stroke();}
    }
  };
  S.drawCityGarden = function(ctx,d,season) {
    const {x,y,w,d:depth}=d,v=d.variant||0,winter=season==='winter';
    if(d.kind==='flowerpot') {
      const cx=x+w/2,cy=y+depth/2,r=.135,z=.22;
      I.cylinder(ctx,cx,cy,0,r,z,v%2?'#a17d59':'#aa765c',{segments:10});
      I.cylinder(ctx,cx,cy,z-.035,r+.012,.04,v%2?'#baa17a':'#c09672',{segments:10});
      const q=I.p(cx,cy,z+.006);ctx.fillStyle=winter?'#d6d9c9':'#4e5140';ctx.beginPath();ctx.ellipse(...q,r*I.TW*.83,r*I.TH*.83,0,0,Math.PI*2);ctx.fill();
      this.drawGardenPlant(ctx,cx,cy,z+.01,4.2,season,v);
      this.drawGardenPlant(ctx,cx-.045,cy+.035,z+.02,2.5,season,v+1);
      return;
    }
    const edge=Array.from({length:18},(_,i)=>{const a=i/18*Math.PI*2,r=.91+A.noise(i,x+y)*.08;return[x+w/2+Math.cos(a)*w/2*r,y+depth/2+Math.sin(a)*depth/2*r,.015];});
    I.poly(ctx,edge,winter?'#d0d5c5':'#67704b');
    // Low, irregular fieldstone edging, with gaps and rounded individual stones.
    for(let i=0;i<18;i++){
      const a=i/18*Math.PI*2,px=x+w/2+Math.cos(a)*(w/2-.025),py=y+depth/2+Math.sin(a)*(depth/2-.015),q=I.p(px,py,.055);
      ctx.fillStyle=winter?'#d9dcca':['#a59e7e','#8c8b70','#b2a98a'][i%3];ctx.beginPath();ctx.ellipse(...q,1.1+A.noise(i,x)*.55,.65+A.noise(i,y)*.3,i*.7,0,Math.PI*2);ctx.fill();
    }
    for(const [i,[u,vv]] of [[.24,.28],[.58,.26],[.78,.54],[.43,.66],[.2,.64]].entries())this.drawGardenPlant(ctx,x+w*u,y+depth*vv,.065,i===1?5:3.5,season,v+i);
  };
  S.drawHouseGreenery = function(ctx,b,season) {
    if(this.picking||!b.id||b.hoist||b.h<.7||b.w<.7||b.d<.7)return;
    const residential=!!b.burgher||['rectory','tavern','bathhouse','school','monastery_c','monastery_w'].includes(b.id)||b.panel==='house';
    if(!residential)return;
    const seed=Math.abs(this.seed(b));if(A.noise(b.x,b.y)>.34&&!['rectory','tavern','monastery_w'].includes(b.id))return;
    const winter=season==='winter',rose=seed%2===0,height=Math.min(b.h-.12,.50+A.noise(b.y,b.x)*.65);
    for(const side of [0,1]){
      const point=(u,z)=>side?[b.x+b.w+.008,b.y+b.d-u,z]:[b.x+b.w-u,b.y+b.d+.008,z];
      const n=Math.ceil(height*(side?.73:1)/.065),spread=side?.065:.12;
      for(let j=0;j<n;j++){
        const z=.07+j*.065,u=.045+spread*(.5+.5*Math.sin(j*.65+seed)),q=I.p(...point(u,z));
        I.line(ctx,point(u,z),point(.045+spread*(.5+.5*Math.sin((j+1)*.65+seed)),z+.065),'#69744b',.65);
        if(winter&&rose)continue;
        if(A.noise(j+seed,side)>.85)continue;
        for(const sign of [-1,1]){const leaf=I.p(...point(Math.max(.012,u+sign*(.025+A.noise(j,b.x)*.04)),z+.025));ctx.fillStyle=(j+side)%3===0?'#8b9a65':side?'#577551':'#6b8955';ctx.beginPath();ctx.moveTo(leaf[0]-1.5,leaf[1]);ctx.lineTo(leaf[0]-.3,leaf[1]-1.3);ctx.lineTo(leaf[0]+1.4,leaf[1]-.7);ctx.lineTo(leaf[0]+.7,leaf[1]+.8);ctx.closePath();ctx.fill();}
        if(rose&&!winter&&season!=='autumn'&&j%4===2){ctx.fillStyle=['#c39696','#d4bda1'][side];ctx.beginPath();ctx.arc(q[0],q[1],1.2,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e3ce97';ctx.fillRect(q[0]-.3,q[1]-.3,.6,.6);}
      }
    }
  };

  S.drawCityDetail = function (ctx, d, season, sv) {
    const { x, y, w, d: depth } = d, cx = x + w / 2, cy = y + depth / 2;
    if (!this.picking) {
      if(['garden','flowerpot'].includes(d.kind)) {const p=I.p(cx,cy,.005);ctx.fillStyle='rgba(35,52,30,.18)';ctx.beginPath();ctx.ellipse(p[0],p[1]+1,w*I.TW*.42,depth*I.TH*.5,0,0,Math.PI*2);ctx.fill();}
      else I.shadow(ctx, x, y, w, depth, d.kind === 'waypost' ? .9 : .35, sv.v, sv.a * .65);
    }
    if (d.kind === 'flowerpot' || d.kind === 'garden') {
      this.drawCityGarden(ctx,d,season);
    } else if (d.kind === 'bench') {
      for (const dx of [.06, w - .13]) I.box(ctx, x + dx, y + .035, 0, .07, depth - .07, .21, { wall: d.stone ? '#918d7b' : '#625743', top: '#a6a08a' });
      I.box(ctx, x, y, .21, w, depth, .055, { wall: '#776649', top: '#b09a72' });
      for (const t of [.35, .7]) I.line(ctx, [x, y + depth * t, .267], [x + w, y + depth * t, .267], '#76664e', .45);
      for (const dx of [.06, w - .08]) I.box(ctx, x + dx, y + .02, .25, .025, .025, .21, { wall: '#6c5c44' });
      I.box(ctx, x, y + .015, .35, w, .025, .09, { wall: '#a48d64', top: '#bba47a' });
    } else if (d.kind === 'planter') {
      I.box(ctx, x, y, 0, w, depth, .14, { wall: '#887458', top: '#ae9570' });
      I.poly(ctx, [[x + .025, y + .025, .145], [x + w - .025, y + .025, .145], [x + w - .025, y + depth - .025, .145], [x + .025, y + depth - .025, .145]], season === 'winter' ? '#c7ccbf' : '#595647');
      if (season !== 'winter') for (let i = 0; i < 7; i++) {
        const px = x + .055 + A.noise(i, x) * (w - .11), py = y + .055 + A.noise(i, y) * (depth - .11), p = I.p(px, py, .19);
        I.line(ctx, [px, py, .14], [px, py, .24], '#6d7b4e', .8);
        ctx.fillStyle = ['#7d8d59', '#8e9b65', '#657e52'][i % 3]; ctx.beginPath(); ctx.ellipse(p[0], p[1], 2, 1.2, -.4, 0, Math.PI * 2); ctx.fill();
        if (i % 2 === 0) { ctx.fillStyle = season === 'autumn' ? '#ba8a4e' : ['#bc9874', '#a97675', '#c5b181'][i % 3]; ctx.beginPath(); ctx.arc(p[0], p[1] - 1.7, .9, 0, Math.PI * 2); ctx.fill(); }
      }
    } else if (d.kind === 'table' || d.kind === 'pottery' || d.kind === 'diceTable') {
      for (const dx of [.035, w - .085]) I.box(ctx, x + dx, y + .025, 0, .045, depth - .05, .25, { wall: '#65583f' });
      I.box(ctx, x, y, .25, w, depth, .04, { wall: '#806b4c', top: '#b29a70' });
      if (d.kind === 'diceTable') {
        I.poly(ctx, [[x+.08,y+.04,.292],[x+w-.06,y+.04,.292],[x+w-.06,y+depth-.04,.292],[x+.08,y+depth-.04,.292]], '#657463');
        for (const [dx,dy] of [[.16,.12],[.27,.16]]) {
          I.box(ctx,x+dx,y+dy,.295,.035,.035,.035,{wall:'#c9be9e',top:'#e1d4b5'});
          const p=I.p(x+dx+.017,y+dy+.017,.332);ctx.fillStyle='#544a3b';ctx.fillRect(p[0]-.35,p[1]-.3,.7,.6);
        }
        I.cylinder(ctx,x+.045,cy,.29,.028,.06,'#967b55',{segments:8});
      } else if (d.kind === 'table') for (const dx of [.11, w - .12]) {
        I.cylinder(ctx, x + dx, cy, .29, .035, .07, '#a2865c', { segments: 8 });
        const p = I.p(x + dx, cy, .36); ctx.strokeStyle = '#d0b784'; ctx.lineWidth = .65; ctx.beginPath(); ctx.arc(p[0] + 1.4, p[1] + .4, .9, -.9, 1.5); ctx.stroke();
      } else for (let i = 0; i < 3; i++) {
        const px = x + .08 + i * (w - .16) / 2;
        I.cylinder(ctx, px, cy, .29, .045, .09 + (i % 2) * .025, ['#b08b65', '#9d7659', '#c1a17b'][i], { segments: 8 });
        I.cylinder(ctx, px, cy, .38 + (i % 2) * .025, .025, .025, '#a28564', { segments: 8 });
      }
    } else if (d.kind === 'fishTray') {
      for(const dx of [.04,w-.08]) I.box(ctx,x+dx,y+.035,0,.04,depth-.07,.20,{wall:'#746246'});
      I.box(ctx,x,y,.20,w,depth,.035,{wall:'#8b7450',top:'#baa278'});
      for(const dy of [0,depth-.025]) I.box(ctx,x,y+dy,.235,w,.025,.05,{wall:'#8b7450'});
      if (!this.cityMarketOpen()) {
        I.poly(ctx,[[x-.015,y-.015,.29],[x+w+.015,y-.015,.29],[x+w+.015,y+depth+.015,.27],[x-.015,y+depth+.015,.27]],'#969581','#706f5f',.5);
        return;
      }
      for(let i=0;i<5;i++) {
        const p=I.p(x+.07+i*.072,cy,.252);ctx.fillStyle=i%2?'#a8b9b3':'#829d99';ctx.beginPath();ctx.ellipse(...p,2.3,.8,-.4,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#d0d1b7';ctx.lineWidth=.45;ctx.beginPath();ctx.moveTo(p[0]-1,p[1]);ctx.lineTo(p[0]+1.4,p[1]-.7);ctx.stroke();
      }
    } else if (d.kind === 'basket') {
      I.cylinder(ctx, cx, cy, 0, .095, .12, '#9c8860', { segments: 10 });
      for (const z of [.035, .065, .095]) { const p = I.p(cx, cy, z); ctx.strokeStyle = '#c2aa75'; ctx.lineWidth = .55; ctx.beginPath(); ctx.ellipse(p[0], p[1], 3.3, 1.5, 0, 0, Math.PI); ctx.stroke(); }
      for (let i = 0; i < 3; i++) { const p = I.p(cx + (i - 1) * .05, cy, .13); ctx.fillStyle = '#c0a06b'; ctx.beginPath(); ctx.ellipse(p[0], p[1], 1.6, 1, -.5, 0, Math.PI * 2); ctx.fill(); }
    } else if (d.kind === 'rope') {
      for (let i = 0; i < 4; i++) { const p = I.p(cx, cy, .01 + i * .012); ctx.strokeStyle = i % 2 ? '#aa956a' : '#c0ab7e'; ctx.lineWidth = .85; ctx.beginPath(); ctx.ellipse(p[0], p[1], 3.8 - i * .6, 1.8 - i * .2, 0, 0, Math.PI * 2); ctx.stroke(); }
    } else if (d.kind === 'waypost') {
      I.box(ctx, cx - .02, cy - .02, 0, .04, .04, .92, { wall: '#70634b', top: '#a79974' });
      for (const [z, dir] of [[.7, 1], [.85, -1]]) I.poly(ctx, [[cx - dir * .24, cy, z - .055], [cx + dir * .24, cy, z - .055], [cx + dir * .32, cy, z], [cx + dir * .24, cy, z + .055], [cx - dir * .24, cy, z + .055]], '#a38e63', '#675e48', .5);
    }
  };

  // Finite cached poses: a long quiet wait, a bite, then a visible catch and release.
  S.fishingSample = function(actor, t) {
    const clips=[['wait',32,32],['bite',1.2,32],['haul',3,96],['hold',2.4,48],['lower',3,96]];
    const duration=clips.reduce((sum,c)=>sum+c[1],0);
    let phase=((t+HK.citizenHash(actor.id)%19)%duration+duration)%duration;
    for(const [clip,seconds,frames] of clips){
      if(phase<seconds){const frame=Math.min(frames-1,Math.floor(phase/seconds*frames));return {clip,u:frame/frames,key:clip+':'+frame};}
      phase-=seconds;
    }
  };
  S.fishingPose = function(actor,motion) {
    const {clip,u}=motion,smooth=v=>v*v*(3-2*v);
    const lift=clip==='haul'?smooth(u):clip==='hold'?1:clip==='lower'?1-smooth(u):0;
    const [dx,dy]=actor.fishing||[-.62,.18],len=Math.hypot(dx,dy),nx=dx/len,ny=dy/len;
    const grip=[actor.x+nx*.09,actor.y+ny*.09,.38];
    const angle=.32+lift*.81+(clip==='bite'?.035*Math.sin(u*Math.PI*4):0);
    const tip=[grip[0]+nx*len*Math.cos(angle),grip[1]+ny*len*Math.cos(angle),grip[2]+len*Math.sin(angle)];
    const hook=[tip[0]+nx*.05,tip[1]+ny*.05,this.WATER_Z+.02+lift*1.13];
    return {grip,tip,hook,lift,fish:lift>.06,head:Math.atan2(dy,dx)};
  };
  S.drawFishingActor = function(ctx,actor,motion) {
    ctx.save();
    const pose=this.fishingPose(actor,motion),p=I.p(actor.x,actor.y,0),grip=I.p(...pose.grip);
    this.drawPerson(ctx,...p,actor.color,'fisher',1,false,'#d2baa0',0,1,null,{head:pose.head,look:actor.look,toolArms:true},.82);
    ctx.strokeStyle=actor.color;ctx.lineWidth=2;ctx.lineCap='round';
    for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(p[0]+side*2,p[1]-10);ctx.lineTo((p[0]+grip[0])/2+side,p[1]-7);ctx.lineTo(...grip);ctx.stroke();}
    ctx.fillStyle='#d2baa0';ctx.beginPath();ctx.arc(...grip,1,0,Math.PI*2);ctx.fill();
    I.line(ctx,pose.grip,pose.tip,'#aa8960',.85);
    I.line(ctx,pose.tip,pose.hook,'rgba(221,220,191,.85)',.55);
    const hook=I.p(...pose.hook);
    ctx.save();ctx.translate(...hook);
    if(pose.fish){
      ctx.rotate(.18*Math.sin(motion.u*Math.PI*8));
      ctx.fillStyle='#b9c6b2';ctx.strokeStyle='#526b66';ctx.lineWidth=.5;
      ctx.beginPath();ctx.ellipse(0,2.8,1.5,3,0,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,5);ctx.lineTo(-1.8,7.1);ctx.lineTo(1.8,7.1);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.fillStyle='#293f3e';ctx.beginPath();ctx.arc(.55,1.1,.35,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#e1e5cc';ctx.beginPath();ctx.moveTo(-.55,2);ctx.lineTo(-.55,4);ctx.stroke();
    }else{
      ctx.strokeStyle='rgba(188,210,201,.45)';ctx.lineWidth=.45;
      ctx.beginPath();ctx.ellipse(0,0,2.5+Math.sin(motion.u*Math.PI*2)*.5,1.1,0,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='#c69464';ctx.beginPath();ctx.ellipse(0,-.4,.65,1.1,0,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();ctx.restore();
  };
  S.drawCityActor = function (ctx, actor, gesture) {
    if(actor.action==='fish')return this.drawFishingActor(ctx,actor,actor.fishMotion||this.fishingSample(actor,this.time));
    const p = I.p(actor.x, actor.y, 0), { action, color } = actor;
    const dir = actor.dir || (action === 'fish' ? -1 : 1), lift = -.85 + .85 * Math.cos(gesture * Math.PI / 2);
    this.drawPerson(ctx, p[0], p[1], color, action === 'fish' || action === 'mend' ? 'fisher' : 'citizen', 1, false, '#d2baa0', 0, dir, null, {head:Math.PI/4,look:actor.look}, .82);
    ctx.save(); ctx.translate(...p); ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-2.4, -10); ctx.lineTo(1.8, -8 + lift); ctx.moveTo(2.4, -10); ctx.lineTo(5, -8 + lift); ctx.stroke();
    if (action === 'read') {
      ctx.fillStyle = '#827057'; ctx.beginPath(); ctx.moveTo(0, -9 + lift); ctx.lineTo(3, -10 + lift); ctx.lineTo(6, -9 + lift); ctx.lineTo(6, -6 + lift); ctx.lineTo(3, -7 + lift); ctx.lineTo(0, -6 + lift); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#d0c6ac'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(3, -9 + lift); ctx.lineTo(3, -7 + lift); ctx.stroke();
    } else if (action === 'drink') {
      ctx.fillStyle = '#b29466'; ctx.fillRect(3, -10 + lift, 2.4, 3); ctx.strokeStyle = '#c0a477'; ctx.lineWidth = .65; ctx.beginPath(); ctx.arc(6, -8.3 + lift, 1, -1.3, 1.3); ctx.stroke();
    } else if (action === 'mend') {
      ctx.strokeStyle = '#aa9b77'; ctx.lineWidth = .55; ctx.beginPath();
      for (let i = 0; i < 4; i++) { ctx.moveTo(-4 + i * 2, -7); ctx.lineTo(-3 + i * 2, -2); ctx.moveTo(-4, -7 + i * 1.5); ctx.lineTo(3, -6 + i * 1.5); } ctx.stroke();
    } else if (action === 'dice') {
      ctx.fillStyle='#9d8157';ctx.fillRect(3,-9+lift,2.5,3.2);
    } else if (action === 'fiddle') {
      ctx.fillStyle='#ac8152';ctx.beginPath();ctx.ellipse(2,-10,3.7,1.8,-.55,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#6c5035';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(3,-11);ctx.lineTo(7,-14);ctx.stroke();
      ctx.strokeStyle='#d1bf92';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(-1+lift,-14);ctx.lineTo(5+lift,-6);ctx.stroke();
    } else if (action === 'hammer') {
      ctx.strokeStyle='#958260';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(3,-6,3,1.8,-.2,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle='#91754e';ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(3,-8+lift);ctx.lineTo(6,-13+lift);ctx.stroke();
      ctx.fillStyle='#676b61';ctx.fillRect(4,-14+lift,4,1.6);
    } else if (action === 'work') {
      ctx.fillStyle = '#a78b64'; ctx.beginPath(); ctx.ellipse(3, -7 + lift, 2.2, 1.7, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

  };
  S.cityBirdPose = function (group, index, t) {
    const phase = t * .32 + index * 2.3, a = phase + A.noise(index, group.x) * Math.PI * 2;
    const x = group.x + Math.cos(a) * group.radius, y = group.y + Math.sin(a) * group.radius * .65;
    return { x, y, z: group.z || 0, head: group.radius ? Math.atan2(Math.cos(a) * .65, -Math.sin(a)) : Math.PI * .25,
      pose: Math.floor((t * .8 + index * .7) % 4), phase: Math.floor((t * 3 + index) % 2) };
  };
  S.drawCityBird = function (ctx, bird, kind) {
    const p = I.p(bird.x, bird.y, bird.z), dx = Math.cos(bird.head) - Math.sin(bird.head), dy = (Math.cos(bird.head) + Math.sin(bird.head)) * .5;
    const side = dx < 0 ? -1 : 1, peck = bird.pose === 2 ? 1.2 : 0, gull = kind === 'gull';
    ctx.save(); ctx.translate(...p);
    if (!gull) { ctx.fillStyle = 'rgba(36,41,33,.18)'; ctx.beginPath(); ctx.ellipse(0, .9, 3, 1.2, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = gull ? '#b69465' : '#8b786c'; ctx.lineWidth = .55; ctx.beginPath(); ctx.moveTo(-.7, -.5); ctx.lineTo(-.7 + (bird.phase ? .4 : -.4), .6); ctx.moveTo(.7, -.5); ctx.lineTo(.7 + (bird.phase ? -.4 : .4), .6); ctx.stroke();
    ctx.fillStyle = gull ? '#d7d5be' : '#858983'; ctx.beginPath(); ctx.ellipse(0, -1.6, gull ? 3.3 : 2.5, 1.65, Math.atan2(dy, dx), 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = gull ? '#979e97' : '#646f71'; ctx.beginPath(); ctx.ellipse(-side * .6, -1.7, 1.7, 1, -.25 * side, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = gull ? '#e1dfcd' : '#71837b'; ctx.beginPath(); ctx.arc(side * 2, -3.2 + peck, gull ? 1.35 : 1.15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#353d38'; ctx.fillRect(side * 2.4 - .25, -3.6 + peck, .45, .45);
    ctx.strokeStyle = gull ? '#c4a365' : '#9e9885'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(side * 2.8, -2.9 + peck); ctx.lineTo(side * 4, -2.65 + peck); ctx.stroke(); ctx.restore();
  };

  S.cityVegetation = function () {
    if (this._cityVegetation) return this._cityVegetation;
    const clumps = [], band = this.moatBand(), n = band.outer.length / 2, bank = band.outer.slice(n).reverse();
    for (let i = 1; i < bank.length; i++) for (const t of [.32, .67]) {
      const x = bank[i - 1][0] + (bank[i][0] - bank[i - 1][0]) * t, y = bank[i - 1][1] + (bank[i][1] - bank[i - 1][1]) * t;
      if (this.isWater(x, y) || this.cityRoadDistance(x, y) < .8) continue;
      clumps.push({ id: 'reeds-' + i + '-' + t, x, y, kind: 'reeds' });
    }
    for (const [i, [x, y]] of [[10.6, -5.8], [14.7, -12.3], [19.8, -12.0], [22.0, -7.4], [38.9, 18.9], [41.1, 18.3], [45.2, 16.7], [43.3, 8.5], [40.1, 5.8], [29.3, -5.0]].entries()) clumps.push({ id: 'meadow-' + i, x, y, kind: 'flowers' });
    return (this._cityVegetation = clumps);
  };
  S.cityRoadDistance = function (x, y) {
    let dist = Infinity;
    for (const [a, b] of HK.ROAD_EDGES) {
      const A = HK.ROAD_NODES[a], B = HK.ROAD_NODES[b], dx = B[0] - A[0], dy = B[1] - A[1], t = HK.clamp(((x - A[0]) * dx + (y - A[1]) * dy) / (dx * dx + dy * dy), 0, 1);
      dist = Math.min(dist, Math.hypot(x - A[0] - dx * t, y - A[1] - dy * t));
    }
    return dist;
  };
  S.drawCityPlant = function (ctx, clump, season) {
    const { x, y, kind } = clump, reeds = kind === 'reeds', autumn = season === 'autumn';
    for (let i = 0; i < (reeds ? 8 : 12); i++) {
      const u = x + (A.noise(i, x) - .5) * .28, v = y + (A.noise(i, y) - .5) * .28, h = reeds ? .17 + A.noise(i + 7, x) * .22 : .05 + A.noise(i, x) * .07;
      I.line(ctx, [u, v, 0], [u + .022, v, h], reeds ? autumn ? '#9b8a5a' : '#78825a' : '#788755', reeds ? .8 : .55);
      const p = I.p(u + .022, v, h);
      if (reeds && i % 2) { ctx.strokeStyle = '#8c7955'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0], p[1] - 1.6); ctx.stroke(); }
      else if (!reeds) { ctx.fillStyle = autumn ? '#b2945c' : ['#cab581', '#b8b3a0', '#b89b9b'][i % 3]; ctx.beginPath(); ctx.arc(...p, .65, 0, Math.PI * 2); ctx.fill(); }
    }
  };
  S.cityItems = function (items, st, season, t) {
    for (const d of HK.CITY_DETAILS) items.push({ c: 'city:' + d.id, v: d.kind === 'fishTray' ? this.cityMarketOpen() : 0, cityDetail: d, k: d.x + d.w + d.y + d.d, box: rect(d), f: ctx => this.drawCityDetail(ctx, d, season, this.shadowVec()) });
    if (this.picking) return;
    for (const actor of HK.CITY_ACTORS) if (this.cityActorActive(actor)) {
      // Sixteen small, cached poses avoid jerky four-frame arm movements.
      const gesture = Math.floor(((t * .6 + A.noise(actor.x, actor.y) * 4) % 4) * 4) / 4, ap = I.p(actor.x, actor.y, 0);
      items.push({ s: 'city-actor|' + actor.id + '|' + gesture, cityActor: actor, ap, k: this.pointKey(actor.x, actor.y), box: [actor.x - .08, actor.y - .08, actor.x + .08, actor.y + .08], f: ctx => this.drawCityActor(ctx, actor, gesture) });
    }
    if (this.cityMarketOpen()) for (const [i, sd] of this.marketStalls(HK.BUILDING.market).entries()) {
      const x = sd.x + .68, y = sd.y + .1, ap = I.p(x, y, 0), actor = { x, y, color: ['#83714f', '#687b65', '#907469'][i % 3], action: 'work' }, gesture=Math.floor((t*.4+i)%4);
      items.push({ s: 'city-vendor|' + i+'|'+gesture, cityVendor: i, ap, k: this.pointKey(x, y), box: [x - .07, y - .07, x + .07, y + .07], f: ctx => this.drawCityActor(ctx, actor, gesture) });
    }
    if(this.cityMarketOpen()) for(let i=0;i<(['rain','snow'].includes(this.weather)?3:6);i++) {
      const p=this.marketCustomerPose(i,t);if(!this.marketStockLevel(p.stall))continue;
      const head=Math.round(p.head/(Math.PI/4))*Math.PI/4, phase=p.moving?Math.floor(t*9/(Math.PI/8))%16*Math.PI/8:0, ap=I.p(p.x,p.y,0);
      items.push({s:'market-customer|'+i+'|'+head+'|'+phase+'|'+p.returning,marketCustomer:i,ap,k:this.pointKey(p.x,p.y),box:[p.x-.07,p.y-.07,p.x+.07,p.y+.07],
        f:ctx=>this.drawPerson(ctx,...ap,['#8c7057','#617c78','#886e7a','#899267'][i%4],'citizen',1,false,'#d2baa0',phase,1,null,{head,basket:p.returning},.88)});
    }
    if (this.clock >= .28 && this.clock < .80 && this.weather !== 'rain' && this.weather !== 'snow') for (const group of HK.CITY_BIRDS) for (let i = 0; i < group.n; i++) {
      const pose = this.cityBirdPose(group, i, t), heading = Math.round(pose.head / (Math.PI / 4)) * Math.PI / 4, ap = I.p(pose.x, pose.y, pose.z);
      items.push({ s: 'city-bird|' + group.kind + '|' + heading + '|' + pose.pose + '|' + pose.phase, cityBird: group.id, ap, k: this.pointKey(pose.x, pose.y), box: [pose.x - .055, pose.y - .055, pose.x + .055, pose.y + .055], f: ctx => this.drawCityBird(ctx, { ...pose, head: heading }, group.kind) });
    }
    if (season !== 'winter') for (const clump of this.cityVegetation()) {
      const ap = I.p(clump.x, clump.y, 0), angle = .02 * Math.sin(t * .65 + clump.x), box = [clump.x - .18, clump.y - .18, clump.x + .18, clump.y + .18];
      items.push({ r: 'city-plant:' + clump.id, cityPlant: clump, v: season, ap, angle, depthFixed: true, k: clump.x + clump.y, box, f: ctx => this.drawCityPlant(ctx, clump, season) });
    }
  };

  const ground = S.makeGround;
  S.makeGround = function (season) {
    ground.call(this, season);
    const ctx = this.ground.getContext('2d'); ctx.save(); ctx.setTransform(this.RS, 0, 0, this.RS, 0, 0); I.path(ctx, HK.LAND); ctx.clip();
    for (const [x, y, r] of HK.TREES) {
      if (!this.inTown(x, y)) continue;
      const p = I.p(x, y, 0); ctx.fillStyle = season === 'winter' ? 'rgba(90,96,79,.16)' : 'rgba(83,91,60,.30)'; ctx.beginPath(); ctx.ellipse(...p, 7, 3.3, 0, 0, Math.PI * 2); ctx.fill();
      if(season!=='winter')for(let i=0;i<16;i++){
        const angle=i*2.4,rr=.08+A.noise(i,x)*.13,px=x+Math.cos(angle)*rr,py=y+Math.sin(angle)*rr;
        // Keep the low ground cover inside the tree's existing planting pocket.
        const q=I.p(px,py,.012);ctx.fillStyle=season==='autumn'?'#948357':['#748750','#899963','#627c50'][i%3];ctx.beginPath();ctx.ellipse(...q,1.25,.65,angle,0,Math.PI*2);ctx.fill();
        if(i%4===0&&season==='spring'){ctx.fillStyle='#d5cba4';ctx.beginPath();ctx.arc(q[0],q[1]-.45,.55,0,Math.PI*2);ctx.fill();}
      }
      if (season === 'autumn') for (let i = 0; i < 13; i++) { const q = I.p(x + (A.noise(i, x) - .5) * r * 1.6, y + (A.noise(i, y) - .5) * r * 1.6, 0); ctx.fillStyle = ['#9c8553', '#ae945d', '#88734c'][i % 3]; ctx.beginPath(); ctx.ellipse(...q, 1, .45, -.4, 0, Math.PI * 2); ctx.fill(); }
    }
    for (const [x, y, r] of [[12.05, 9.05, .36], [32.0, 6.9, .37], [26.9, 7.9, .35]]) {
      const p = I.p(x, y, 0); ctx.fillStyle = 'rgba(80,88,78,.20)'; ctx.beginPath(); ctx.ellipse(...p, r * 26, r * 13, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  };
  A.drawMarketCanopy = function (ctx, x, y, color, snow) {
    const w = .55, d = .4, cream = snow ? '#d2d6ca' : '#c4b994';
    for (let stripe = 0; stripe < 5; stripe++) {
      const left = x - .025 + stripe * .12, right = left + .12, tint = stripe % 2 ? cream : color;
      I.poly(ctx, [[left, y - .025, .74], [right, y - .025, .74], [right, y + d + .025, .60], [left, y + d + .025, .60]], tint, 'rgba(64,58,43,.2)', .35);
      I.poly(ctx, [[left, y + d + .025, .60], [right, y + d + .025, .60], [right, y + d + .025, .555], [(left + right) / 2, y + d + .025, .535], [left, y + d + .025, .555]], I.shade(tint, .9));
    }
    I.line(ctx, [x - .025, y - .025, .74], [x + w + .025, y - .025, .74], '#a39370', .65);
    for (const xx of [x, x + w]) I.line(ctx, [xx, y, .36], [xx, y, .74], '#72634a', .95);
  };
  A.drawMarketProduce = function (ctx, sd, index) {
    const closed = !S.cityMarketOpen(), level=S.marketStockLevel(index);
    if (closed) {
      I.poly(ctx, [[sd.x + .04, sd.y + .26, .34], [sd.x + .51, sd.y + .26, .34], [sd.x + .51, sd.y + .39, .31], [sd.x + .04, sd.y + .39, .31]], ['#8a826a', '#99917a', '#8b8b76'][index % 3], '#776e59', .55); return;
    }
    if ([2,3,4].includes(index)) {
      for(let n=0;n<level;n++) {
        const x=sd.x+.1+n*.15,y=sd.y+.32;
        if(index===2) { I.cylinder(ctx,x,y,.31,.05,.045,'#d1b772',{});const p=I.p(x,y,.36);ctx.fillStyle='#aa9051';ctx.fillRect(p[0]-.3,p[1]-.3,.6,.6); }
        if(index===3) S.barrelT(ctx,x,y,.31,'#a88650','#81663f',.30);
        if(index===4) for(let fold=0;fold<(n===0?2:1);fold++) I.box(ctx,x-.05,y-.045,.31+fold*.025,.12,.09,.025,{wall:['#8d6785','#657e8c','#b2a178'][n],top:['#ac85a2','#879da8','#ccbd92'][n]});
      }
      return;
    }
    for (let basket = 0; basket < 2; basket++) {
      const x = sd.x + .15 + basket * .25, y = sd.y + .34;
      I.cylinder(ctx, x, y, .31, .07, .07, '#a18b61', { segments: 8 });
      for (let k = 0; k < (level ? level+2 : 0); k++) {
        const p = I.p(x + (k % 3 - 1) * .045, y + (k > 2 ? .025 : -.015), .40 + (k === 4 ? .015 : 0));
        ctx.fillStyle = [['#baa173', '#ccb385'], ['#a77658', '#8c9961'], ['#89905d', '#abb272'], ['#b59768', '#c8b182'], ['#a58967', '#b49979'], ['#b9b2a0', '#87978b']][index][k % 2];
        ctx.beginPath(); ctx.ellipse(...p, index === 5 ? 1.9 : 1.25, .85, -.3, 0, Math.PI * 2); ctx.fill();
      }
    }
  };
}
