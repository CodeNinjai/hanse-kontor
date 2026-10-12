/* Woodland life uses resident routes and retained animal layers, never frame RNG. */
'use strict';
{
 const S=HK.Scene,I=HK.Iso;
 const sample=S.ruralWorkSample;
 S.ruralWorkSample=function(w,t,working=true){
  if(w.task!=='hunt')return sample.call(this,w,t,working);
  if(!working)return {clip:'rest',u:0,frame:0,key:'hunt:idle'};
  let local=((t+2.1)%12+12)%12;
  for(const [clip,seconds] of [['look',4],['track',5],['rest',3]]){
   if(local<seconds){const frame=Math.floor(local/seconds*48);return {clip,u:frame/48,frame,key:'hunt:'+clip+':'+frame};}local-=seconds;
  }
 };
 S.drawHunter=function(c,w){
  const p=I.p(w.x,w.y,0),motion=w.motion||{clip:'rest',u:0},wave=w.working?Math.sin(Math.PI*motion.u)**2:0;
  const crouch=motion.clip==='track'?wave:0,look=motion.clip==='look'?wave:0,check=motion.clip==='rest'?wave:0,skin='#d6b995';
  const head=w.head??Math.PI/4,dx=Math.cos(head),dy=Math.sin(head);
  const q=(u,v,z)=>[w.x+dx*u-dy*v,w.y+dy*u+dx*v,z];
  // Leather quiver on the back, with visible arrow fletching.
  I.line(c,q(-.10,-.08,.28),q(-.16,-.08,.62),'#695539',2.8);
  for(const v of [-.105,-.055]){I.line(c,q(-.16,v,.52),q(-.19,v,.76),'#b49d6e',.65);I.line(c,q(-.19,v,.76),q(-.16,v,.70),'#d3c3a0',1);}
  this.drawPerson(c,...p,w.color,'citizen',1,false,skin,w.moving?w.phase:0,1,null,{look:w.look,toolArms:true,workLean:crouch*.25,workBend:crouch*4,hat:true,head},.9);
  const hold=q(.14,.10,.34-crouch*.09),hand=q(.12,-.10,.34+look*.28-crouch*.23+check*.10);
  const arm=(world,side)=>{const end=I.p(...world),shoulder=[p[0]+side*2.2+crouch*2.4,p[1]-10.6+crouch*3.5];c.strokeStyle=w.color;c.lineWidth=1.7;c.beginPath();c.moveTo(...shoulder);c.lineTo((shoulder[0]+end[0])*.5+side,(shoulder[1]+end[1])*.5+1.5);c.lineTo(...end);c.stroke();c.fillStyle=skin;c.beginPath();c.arc(...end,.8,0,Math.PI*2);c.fill();};
  const bowHand=I.p(...hold),bottom=I.p(...q(.14,.1,.09)),top=I.p(...q(.14,.1,.69-crouch*.12));bottom[0]-=2;top[0]-=2;
  c.strokeStyle='#a58a59';c.lineWidth=1.1;c.beginPath();c.moveTo(...bottom);c.quadraticCurveTo(bowHand[0]+2,bowHand[1],...top);c.stroke();c.strokeStyle='#d0c09a';c.lineWidth=.45;c.beginPath();c.moveTo(...bottom);c.lineTo(...top);c.stroke();
  arm(hold,1);arm(hand,-1);
  // The inspection gesture touches the ground; the bow remains lowered.
  if(crouch>.5){for(let i=0;i<3;i++)I.line(c,q(.16+i*.055,-.12,.007),q(.19+i*.055,-.1,.007),'#776c4c',.6);}
 };
 const worker=S.drawRuralWorker;
 S.drawRuralWorker=function(c,w){return w.task==='hunt'?this.drawHunter(c,w):worker.call(this,c,w);};
 const status=HK.UI.citizenStatus;
 HK.UI.citizenStatus=function(p){
  if(p.work==='hunter'&&p.group==='worker'&&p.motion&&!p.motion.hidden){
   if(p.motion.place==='walking'&&p.motion.target==='work')return HK.citizenText(['Auf Pirsch im Wald','On a woodland patrol']);
   if(p.motion.place==='work'&&!HK.state.rural.sites.hunter.reason){const clip=S.ruralWorkSample({task:'hunt'},S.time).clip;return HK.citizenText(clip==='track'?['Liest Spuren am Waldboden','Reading tracks on the forest floor']:clip==='look'?['Hält nach Wild Ausschau','Watching for wildlife']:['Prüft Bogen und Ausrüstung','Checking bow and equipment']);}
  }
  return status.call(this,p);
 };
 S.woodlandDetails=function(){
  if(this._woodlandDetails)return this._woodlandDetails;
  const details=[],types=['fern','berries','mushrooms','fern','deadwood'];
  for(const forest of HK.RURAL_FORESTS)for(const [i,tree]of forest.trees.entries()){
   if(i%2)continue;
   const [tx,ty]=tree,angle=i*2.399,x=tx+Math.cos(angle)*.5,y=ty+Math.sin(angle)*.5;
   if(!I.inHull(HK.LAND,x,y)||this.isWater(x,y)||this.blockedAt(x,y))continue;
   if(HK.STREETS.some(([ax,ay,bx,by,width])=>{const dx=bx-ax,dy=by-ay,u=HK.clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(x-ax-u*dx,y-ay-u*dy)<width/2+.35;}))continue;
   if([...HK.RURAL_DEER,...HK.WOODLAND_FAUNA,...HK.HUNTER_ROUND].some(p=>Math.hypot(x-p[0],y-p[1])<.5))continue;
   details.push({x,y,kind:types[i/2%types.length],seed:i});
  }
  return this._woodlandDetails=details;
 };
 S.drawWoodlandDetail=function(c,d,season){
  const {x,y,kind}=d,winter=season==='winter',autumn=season==='autumn';
  if(kind==='deadwood'){
   I.obox(c,x,y,.055,1,0,.45,.09,.09,'#77644b');
   I.line(c,[x-.1,y,.11],[x+.2,y,.11],winter?'#ccd0c1':'#82905a',1.4);
   for(const u of [-.05,.13])I.line(c,[x+u,y,.1],[x+u+.07,y-.1,.14],'#796a4e',.9);return;
  }
  if(kind==='mushrooms'){
   if(winter)return;
   for(const [u,v,r]of [[0,0,1.7],[.10,.04,1.1],[-.08,.06,.9]]){const p=I.p(x+u,y+v,0);c.strokeStyle='#c7b997';c.lineWidth=.7;c.beginPath();c.moveTo(...p);c.lineTo(p[0],p[1]-1.9);c.stroke();c.fillStyle=autumn?'#b18655':'#a6956a';c.beginPath();c.ellipse(p[0],p[1]-2,r,r*.55,0,Math.PI,Math.PI*2);c.fill();}return;
  }
  if(kind==='berries'){
   for(let i=0;i<5;i++){const p=I.p(x+Math.sin(i*2)*.12,y+Math.cos(i*2)*.12,.08+i%2*.05);c.fillStyle=winter?'#8c977f':autumn?'#8e8850':i%2?'#65804e':'#788c56';c.beginPath();c.ellipse(...p,2.8,2,0,0,Math.PI*2);c.fill();if(!winter&&season!=='spring'){c.fillStyle='#8c4c45';c.beginPath();c.arc(p[0]+1,p[1],.65,0,Math.PI*2);c.fill();}}return;
  }
  for(let i=0;i<7;i++){
   const a=i*Math.PI*2/7,dx=Math.cos(a),dy=Math.sin(a),end=[x+dx*.23,y+dy*.23,.1];
   I.line(c,[x,y,0],end,winter?'#a1aa91':autumn?'#95905d':'#69844d',.65);
   if(!winter)for(const u of [.35,.6,.82])for(const sign of [-1,1])I.line(c,[x+dx*.23*u,y+dy*.23*u,.1*u],[x+dx*.23*u-dy*.06*sign-dx*.04,y+dy*.23*u+dx*.06*sign-dy*.04,.1*u+.02],autumn?'#a39761':'#7d965b',.7);
  }
 };
 const add=S.addRuralItems;
 S.addRuralItems=function(items,c,st,season,t){
  add.call(this,items,c,st,season,t);
  for(const d of this.woodlandDetails())items.push({c:'woodland:'+d.x+':'+d.y,k:this.pointKey(d.x,d.y),box:[d.x-.28,d.y-.28,d.x+.28,d.y+.28],f:c=>this.drawWoodlandDetail(c,d,season)});
  return items;
 };
}
