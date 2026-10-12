/* Residents travel continuously. Only crossing a named doorway / city gate can
   change visibility. Path searches are budgeted across frames and never use RNG. */
'use strict';
{
 const S=HK.Scene,I=HK.Iso;
 class Heap {
  constructor(){this.a=[];} push(v){const a=this.a;let i=a.length;a.push(v);while(i){const p=(i-1)>>1;if(a[p].f<=v.f)break;a[i]=a[p];i=p;}a[i]=v;}
  pop(){const a=this.a,top=a[0],v=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let j=i*2+1;if(j+1<a.length&&a[j+1].f<a[j].f)j++;if(a[j].f>=v.f)break;a[i]=a[j];i=j;}a[i]=v;}return top;}
 }
 S.populationFree=function(x,y){
  if(this.blockedAt(x,y))return false;
  const W=HK.WALL;
  for(let i=0;i<W.pts.length-1;i++){
   const a=W.pts[i],b=W.pts[i+1],dx=b[0]-a[0],dy=b[1]-a[1],u=HK.clamp(((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy),0,1);
   if(Math.hypot(x-a[0]-u*dx,y-a[1]-u*dy)>W.t/2+.07)continue;
   const gate=W.gates.find(g=>g.seg===i);
   if(gate){const sp=this.gateSpec(gate),p=this.gateLocal(sp,{wx:x,wy:y});if(Math.abs(p.v)<sp.pw/2-.055)continue;}
   return false;
  }
  return true;
 };
 S.populationNav=function(){
  const key=this.churchAisle();
  if(this._populationNav?.key===key)return this._populationNav;
  const G=this.GRID,nav={key,G,cells:new Uint8Array(G.w*G.h),cache:new Map(),queue:[],active:null};
  nav.point=k=>[G.x0+(k%G.w+.5)*G.cell,G.y0+(Math.floor(k/G.w)+.5)*G.cell];
  nav.index=(x,y)=>{const i=Math.floor((x-G.x0)/G.cell),j=Math.floor((y-G.y0)/G.cell);return i<0||j<0||i>=G.w||j>=G.h?-1:j*G.w+i;};
  nav.free=k=>{if(k<0||k>=nav.cells.length)return false;if(!nav.cells[k]){const[x,y]=nav.point(k);nav.cells[k]=[[0,0],[.055,0],[-.055,0],[0,.055],[0,-.055]].every(([dx,dy])=>this.populationFree(x+dx,y+dy))?1:2;}return nav.cells[k]===1;};
  // Use the connected public space, not isolated slivers between two facades.
  nav.reachable=new Uint8Array(nav.cells.length);
  const root=nav.index(13,9.5),queue=[root];nav.reachable[root]=1;
  for(let i=0;i<queue.length;i++){const k=queue[i],x=k%G.w,y=Math.floor(k/G.w);
   for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const n=k+dx+dy*G.w;if(x+dx<0||x+dx>=G.w||y+dy<0||y+dy>=G.h||nav.reachable[n]||!nav.free(n))continue;nav.reachable[n]=1;queue.push(n);}
  }
  this._populationNav=nav;return nav;
 };
 S.populationSafe=function(point,radius=1.2){
  const nav=this.populationNav(),center=nav.index(...point),candidates=[];
  for(let y=-Math.ceil(radius/.2);y<=Math.ceil(radius/.2);y++)for(let x=-Math.ceil(radius/.2);x<=Math.ceil(radius/.2);x++){
   const k=center+y*nav.G.w+x;if(!nav.reachable[k]||!nav.free(k))continue;const p=nav.point(k),dist=Math.hypot(p[0]-point[0],p[1]-point[1]);if(dist<=radius)candidates.push({p,dist});
  }
  candidates.sort((a,b)=>a.dist-b.dist);return candidates[0]?.p||null;
 };
 S.populationDoor=function(id){
  const b=HK.citizenBuilding(id);if(!b)return null;
  const choices=[];
  if(b.kind==='eave'&&b.w>1.3)choices.push({door:[b.x+b.w/2,b.y+b.d+.015],outside:[b.x+b.w/2,b.y+b.d+.32]});
  choices.push({door:[b.x+b.w+.015,b.y+b.d/2],outside:[b.x+b.w+.32,b.y+b.d/2]});
  for(const q of choices){const at=this.populationSafe(q.outside,.3);if(at&&Math.hypot(at[0]-q.door[0],at[1]-q.door[1])<.66)return{door:q.door,at};}
  return null;
 };
 // A destination needs room to stand, including people who are still on their way.
 // This is destination selection only; walkers keep their continuous, checked routes.
 S.populationStop=function(p,point,radius=2){
  const nav=this.populationNav(),G=nav.G,spacing=.62,limit=radius+spacing;
  const occupied=[];
  for(const other of Object.values(HK.state.population.people)){
   const m=other.motion;if(other===p||!m)continue;
   const end=m.destination||(m.route?.length?m.route.at(-1):null);
   for(const at of [!m.hidden?[m.x,m.y]:null,end])if(at&&Math.hypot(at[0]-point[0],at[1]-point[1])<limit)occupied.push(at);
  }
  const center=nav.index(...point),cx=center%G.w,cy=Math.floor(center/G.w),steps=Math.ceil(radius/G.cell);
  let best=null,score=Infinity;
  for(let dy=-steps;dy<=steps;dy++)for(let dx=-steps;dx<=steps;dx++){
   if(cx+dx<0||cx+dx>=G.w||cy+dy<0||cy+dy>=G.h)continue;
   const k=center+dy*G.w+dx;if(!nav.reachable[k]||!nav.free(k))continue;
   const at=nav.point(k),d=(at[0]-point[0])**2+(at[1]-point[1])**2;
   if(d>radius*radius||d>=score||occupied.some(q=>(at[0]-q[0])**2+(at[1]-q[1])**2<spacing*spacing))continue;
   best=at;score=d;
  }
  return best;
 };
 S.populationMarketStop=function(p){
  const stalls=this.marketStalls(HK.BUILDING.market),h=HK.citizenHash(p.id)+ (p.motion?.visits||0);
  for(let i=0;i<stalls.length;i++){
   const sd=stalls[(h+i)%stalls.length],at=this.populationStop(p,[sd.x+.2,sd.y+.6],1.6);
   if(at)return at;
  }
  return null;
 };
 S.populationWork=function(p){
  if(p.work==='hunter'&&p.group==='worker'){const stop=HK.HUNTER_ROUND[((p.motion?.visits||0)+(p.motion?.place==='work'?1:0))%HK.HUNTER_ROUND.length];return this.populationSafe(stop,.7);}
  if(p.contact==='priest'&&this.churchAisle())return this.populationSafe([12.3,5]);
  if(p.contact)return this.populationSafe(this.namedNpcRoute(HK.STATIC_NPCS.find(n=>n.person===p.contact)).a,1.6);
  const actor=p.actor&&HK.CITY_ACTORS.find(a=>a.id===p.actor);
  if(actor?.id==='dock-angler')return this.populationSafe([actor.x,actor.y],.4);
  if(p.point)return this.populationSafe(p.point,1.6);
  if(p.group==='vendor'){const sd=this.marketStalls(HK.BUILDING.market)[p.index];return this.populationSafe([sd.x+.68,sd.y+.1],.4);}
  if(p.group==='customer'||p.work==='market')return this.populationMarketStop(p);
  const b=HK.citizenBuilding(p.work),h=HK.citizenHash(p.id+':'+(p.motion?.visits||0));
  return this.populationStop(p,[b.x+b.w+.5+(h%5)*.27,b.y+b.d*.55+(Math.floor(h/5)%5-2)*.33],2.4);
 };
 S.populationSetup=function(st){
  if(!st||this._populationState===st)return;
  HK.populationInit(st);
  this._populationState=st;this._populationNav=null;this.walkers=[];
  const homes=HK.BURGHER_HOUSES.filter(b=>this.populationDoor(b.id));
  for(const p of Object.values(st.population.people)){
   if(p.group==='service')continue;
   if(!this.populationDoor(p.home))p.home=homes[HK.citizenHash(p.id)%homes.length]?.id||'inn';
   if(['watch','freight','service'].includes(p.group))continue;
   const house=this.populationDoor(p.home);
   if(!p.motion){const at=this.populationWork(p);
    const active=!['resident','customer'].includes(p.group)&&this.populationWorking(p)&&!!at;
    p.motion={x:active?at[0]:house.door[0],y:active?at[1]:house.door[1],hidden:!active,place:active?'work':'home',wait:active?2+HK.citizenHash(p.id)%6:(HK.citizenHash(p.id)%24)*.25,head:Math.PI/4,phase:0,route:[],leg:0,target:null,visits:0};
   }
   p.motion.planning=false;
  }
 };
 S.populationWorking=function(p){
  const c=this.clock,[a,b]=p.hours,open=b>1?c>=a||c<b-1:c>=a&&c<b;
  if(!open)return false;
  if(p.group==='worker'){const site=HK.state?.rural?.sites[p.work],d=HK.RURAL_SITES[p.work];return !!site?.active&&!(d?.crops&&this.season()==='winter');}
  if(['actor','customer'].includes(p.group)&&['rain','snow'].includes(this.weather))return false;
  return true;
 };
 S.populationEnqueue=function(p,target,end){
  const nav=this.populationNav(),m=p.motion,start=this.populationSafe([m.x,m.y],.45);if(!start||!end){m.retry=5;return;}
  const from=nav.index(...start),to=nav.index(...end),key=from+'>'+to;
  m.planning=true;m.target=target;m.destination=end;
  const apply=path=>{
   m.planning=false;if(!path){if(target==='bench')m.bench=null;m.retry=20;m.target=null;m.destination=null;m.route=[];return;}
   m.route=[[m.x,m.y],...path];m.leg=1;m.place='walking';m.hidden=false;m.leavingBench=false;
   if(target==='home')m.route.push(this.populationDoor(p.home).door);
  };
  if(nav.cache.has(key)){apply(nav.cache.get(key));return;}
  nav.queue.push({from,to,key,apply});
 };
 S.populationSearch=function(budget=650){
  const nav=this.populationNav(),G=nav.G;
  while(budget>0){
   if(!nav.active){const job=nav.queue.shift();if(!job)return;
    if(nav.cache.has(job.key)){job.apply(nav.cache.get(job.key));continue;}
    job.heap=new Heap();job.dist=new Map([[job.from,0]]);job.prev=new Map();job.heap.push({k:job.from,g:0,f:0});job.count=0;nav.active=job;
   }
   const q=nav.active,n=q.heap.pop();budget--;
   if(!n||q.count++>42000){nav.cache.set(q.key,null);q.apply(null);nav.active=null;continue;}
   if(n.g!==q.dist.get(n.k))continue;
   if(n.k===q.to){const path=[];for(let k=n.k;k!==undefined;k=q.prev.get(k))path.unshift(nav.point(k));
    nav.cache.set(q.key,path);nav.cache.set(q.to+'>'+q.from,path.slice().reverse());q.apply(path);nav.active=null;continue;
   }
   const x=n.k%G.w,y=Math.floor(n.k/G.w),tx=q.to%G.w,ty=Math.floor(q.to/G.w);
   for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
    if(x+dx<0||x+dx>=G.w||y+dy<0||y+dy>=G.h)continue;
    const k=n.k+dx+dy*G.w;if(!nav.free(k)||(dx&&dy&&(!nav.free(n.k+dx)||!nav.free(n.k+dy*G.w))))continue;
    const g=n.g+(dx&&dy?Math.SQRT2:1);if(g>=(q.dist.get(k)??Infinity))continue;
    q.dist.set(k,g);q.prev.set(k,n.k);q.heap.push({k,g,f:g+Math.hypot(x+dx-tx,y+dy-ty)*1.02});
   }
  }
 };
 S.populationBenches=function(){
  const nav=this.populationNav();if(nav.benches)return nav.benches;
  nav.benches=[];
  for(const b of HK.CITY_DETAILS.filter(d=>d.kind==='bench'))for(let slot=0;slot<2;slot++){
   const foot=[b.x+b.w*(slot?.75:.25),b.y+b.d+.08],approach=this.populationSafe([foot[0],b.y+b.d+.38],.4);
   if(approach)nav.benches.push({id:b.id+':'+slot,bench:b.id,foot,approach});
  }
  return nav.benches;
 };
 S.populationReserveBench=function(p){
  const people=Object.values(HK.state.population.people),used=new Set(people.map(q=>q.motion?.bench).filter(Boolean));
  const m=p.motion,available=this.populationBenches().filter(b=>!used.has(b.id)).map(b=>({b,d:Math.hypot(b.approach[0]-m.x,b.approach[1]-m.y)})).filter(q=>q.d<12).sort((a,b)=>a.d-b.d);
  if(!available.length)return null;
  m.bench=available[0].b.id;return available[0].b;
 };
 S.populationUpdate=function(dt){
  const st=HK.state;if(!st)return;this.populationSetup(st);let planned=0;
  for(const p of Object.values(st.population.people)){
   const m=p.motion;if(!m)continue;m.moving=false;
   m.seated=HK.clamp((m.seated||0)+(m.place==='bench'&&!m.leavingBench?1:-1)*dt*1.5,0,1);
   if(m.route?.length&&m.leg<m.route.length){
    let travel=dt*(p.type==='child'?.38:.30);
    while(travel>0&&m.leg<m.route.length){const b=m.route[m.leg],dx=b[0]-m.x,dy=b[1]-m.y,len=Math.hypot(dx,dy),step=Math.min(travel,len),x=len?m.x+dx/len*step:b[0],y=len?m.y+dy/len*step:b[1];
     if(!this.gatePassageClear({wx:m.x,wy:m.y},{wx:x,wy:y}))break;
     if(len>.00001)m.head=Math.atan2(dy,dx);m.x=x;m.y=y;m.phase+=step*22;travel-=step;m.moving ||= step>.00001;
     if(len<=step+.000001)m.leg++;else break;
    }
    if(m.leg>=m.route.length){m.route=[];m.place=m.target;m.target=null;m.destination=null;m.wait=(['resident','customer'].includes(p.group)?3:12)+HK.citizenHash(p.id+':'+m.visits)%8;m.visits++;if(p.work==='hunter'&&m.place==='work')m.wait=8+m.visits%5;
     if(m.place==='bench'){m.wait=35+HK.citizenHash(p.id)%35;m.head=Math.PI/2;m.leavingBench=false;}
     if(m.place==='home'||m.place==='away')m.hidden=true;
     if(m.place==='away')p.returnDay=st.day+5+HK.citizenHash(p.id)%6;
     if(p.history.at(-1)?.place!==m.place){p.history.push({day:st.day,place:m.place});p.history=p.history.slice(-6);}
    }
    continue;
   }
   if(m.planning)continue;
   if(m.retry>0){m.retry=Math.max(0,m.retry-dt);continue;}
   m.wait=Math.max(0,m.wait-dt);
   let target=this.populationWorking(p)?'work':'home';
   if(p.guest&&st.day>=p.departure)target='away';
   if(m.place==='home'&&target==='work'&&m.wait>0)continue;
   if(m.place==='away'){
    if(st.day<(p.returnDay??Infinity))continue;
    p.arrival=st.day;p.departure=st.day+3+HK.citizenHash(p.id)%5;m.hidden=false;m.place='arrival';target='home';
   }
   const benchWeather=!['rain','snow'].includes(this.weather)&&this.clock>=.28&&this.clock<.86;
   if(m.place==='bench'){
    if(m.wait>0&&target==='work'&&benchWeather)continue;
    m.leavingBench=true;if(m.seated>0)continue;
    m.bench=null;
   }
   let bench=null;
   if(planned<2&&target==='work'&&['work','market'].includes(m.place)&&m.wait===0&&p.work!=='hunter'&&benchWeather&&['resident','customer','worker','actor'].includes(p.group)&&(m.visits+HK.citizenHash(p.id))%3===0){
    bench=this.populationReserveBench(p);if(bench)target='bench';
   }
   const workStroll=target==='work'&&m.place==='work'&&m.wait===0&&(p.group==='resident'||p.group==='worker'&&p.work==='hunter'&&!st.rural.sites.hunter.reason);
   if(target==='work'&&m.place==='work'&&m.wait===0&&(p.group==='customer'||p.group==='resident'&&(m.visits+HK.citizenHash(p.id))%4===0))target='market';
   if(target==='work'&&m.place==='work'&&m.wait===0&&p.group==='contact')target='break';
   if(target==='work'&&m.place==='break'&&m.wait>0)continue;
   if(target==='work'&&['resident','customer'].includes(p.group)&&m.place==='market'&&m.wait>0)continue;
   const actor=p.actor&&HK.CITY_ACTORS.find(a=>a.id===p.actor);
   const relocated=actor?.id==='dock-angler'&&target==='work'&&m.place==='work'&&Math.hypot(m.x-actor.x,m.y-actor.y)>.3;
   if(target===m.place&&!workStroll&&!relocated||planned>=2)continue;
   const breakPoint=target==='break'?this.namedNpcRoute(HK.STATIC_NPCS.find(n=>n.person===p.contact)).b:null;
   const end=target==='bench'?bench.approach:target==='break'?this.populationSafe(breakPoint):target==='home'?this.populationDoor(p.home).at:target==='away'?this.populationSafe(HK.ROAD_NODES.NG):target==='market'?this.populationMarketStop(p):this.populationWork(p);
   this.populationEnqueue(p,target,end);planned++;
  }
  this.populationSearch();
 };
 const update=S.update;
 S.update=function(dt){this.populationSetup(HK.state);update.call(this,dt);this.populationUpdate(dt);};
 S.populationPositions=function(){return Object.values(HK.state?.population?.people||{}).filter(p=>p.motion&&!p.motion.hidden).map(p=>({wx:p.motion.x,wy:p.motion.y}));};
 S.populationPick=function(p){return{kind:'citizen',citizen:p.id,label:HK.citizenName(HK.state,p)+' · '+HK.citizenJob(p)};};
 S.populationItems=function(items,st,t){
  this.populationSetup(st);
  for(let i=items.length-1;i>=0;i--){const it=items[i];
   if(it.namedPerson||it.pick?.kind==='walker'||it.cityActor||it.cityVendor!==undefined||it.marketCustomer!==undefined||it.ruralWorker){items.splice(i,1);continue;}
   for(const layer of it.layers||[]){if(layer.guard){const p=st.population.people['watch:'+this.wallGuards.indexOf(layer.guard)];if(p)layer.pick=this.populationPick(p);}}
   if(it.cartPart==='actor'||it.porter){
    const w=it.vehicle||it.porter;
    if(!w.citizen){const used=new Set([...this.porters,...this.carts].map(q=>q.citizen));w.citizen=Array.from({length:12},(_,i)=>'freight:'+i).find(id=>!used.has(id))||'freight:0';}
    const p=st.population.people[w.citizen];it.pick={...this.populationPick(p),destination:it.pick};
   }
  }
  // Keep an inline sailor or worker selectable without stealing the rest of
  // the ship/building hit area. The same parent key is used by every cached pose.
  for(const it of items)for(const layer of it.layers||[it]) {
   if(layer.pick?.kind==='citizen')continue;
   const key=layer.citizenKey||layer.c||layer.r||(layer.box?'at:'+layer.box.map(v=>v.toFixed(2)).join(','):null);
   if(!key)continue;
   const draw=layer.f,work=layer.pick?.building?.id||'harbour';
   layer.f=c=>{const previous=this._citizenContext;this._citizenContext={key,work,index:0};try{draw(c);}finally{this._citizenContext=previous;}};
  }
  for(const p of Object.values(st.population.people)){
   const m=p.motion;if(!m||m.hidden)continue;
   const seat=m.bench&&this.populationBenches().find(b=>b.id===m.bench),blend=m.seated||0;
   const px=seat?m.x+(seat.foot[0]-m.x)*blend:m.x,py=seat?m.y+(seat.foot[1]-m.y)*blend:m.y;
   const ap=I.p(px,py,this.deckZ(px,py)),head=Math.round(m.head/(Math.PI/4))*Math.PI/4,phase=m.moving?Math.floor(m.phase/(Math.PI/12))%24*Math.PI/12:0;
   const frame=Math.floor((t*.55+HK.citizenHash(p.id)%11)*16)%16,working=m.place==='work',actor=p.actor&&HK.CITY_ACTORS.find(a=>a.id===p.actor),worker=p.group==='worker'&&HK.RURAL_WORKERS.find(w=>w.site===p.work);
   const canWork=worker&&!st.rural.sites[p.work].reason,workMotion=worker?this.ruralWorkSample(worker,t,canWork):null;
   const fishMotion=actor?.action==='fish'?this.fishingSample(actor,t):null;
   const item={s:'citizen|'+p.id+'|'+head+'|'+phase+'|'+(working?(workMotion?workMotion.key:fishMotion?fishMotion.key:frame):'walk')+'|'+Math.round(blend*8)+'|'+p.gender,citizen:p.id,ap,k:this.pointKey(px,py),box:[px-.07,py-.07,px+.07,py+.07],pick:this.populationPick(p),f:c=>{
    if(worker?.task==='hunt'&&m.place!=='bench')this.drawHunter(c,{...worker,x:m.x,y:m.y,look:p.look,head,phase,moving:m.moving,motion:workMotion,working:working&&canWork});
    else if(working&&actor)this.drawCityActor(c,{...actor,x:m.x,y:m.y,look:p.look,fishMotion},frame/4);
    else if(working&&worker)this.drawRuralWorker(c,{...worker,x:m.x,y:m.y,look:p.look,motion:workMotion,phase:workMotion?workMotion.u*2*Math.PI:frame*Math.PI/8,working:canWork});
    else this.drawPerson(c,...ap,p.color,p.type,1,false,p.skin,phase,1,p.contact||null,{head,look:p.look,seated:Math.round(blend*8)/8,gesture:frame*Math.PI/8,working:working&&!!p.contact,basket:p.group==='customer'&&m.place!=='work',hat:p.type==='merchant'},.9);
   }};
   if(p.group==='vendor'&&working){item.cityVendor=p.index;item.f=c=>this.drawCityActor(c,{x:m.x,y:m.y,color:p.color,action:'work',look:p.look},frame/4);}
   if(p.group==='customer')item.marketCustomer=p.index;
   items.push(item);
  }
 };
 const drawPerson=S.drawPerson;
 S.drawPerson=function(ctx,...args){
  const context=this._citizenContext,old=this.pickColor;
  if(context&&HK.state?.population){
   const p=HK.serviceCitizen(HK.state,context.key+':'+context.index++,args[3],context.work,args[2]);
   args[10]={...args[10],look:p.look};
   if(this.picking){const id=this.pickTable.length;this.pickTable.push(this.populationPick(p));const code=id*3;this.pickColor=`rgb(255,${code&255},${(code>>8)&255})`;}
  }
  try{return drawPerson.call(this,ctx,...args);}finally{this.pickColor=old;}
 };
}
