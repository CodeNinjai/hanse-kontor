/* Shipyard stages and nighttime couriers share the saved simulation state. */
'use strict';
Object.assign(HK.Scene,{
 drawYard(ctx,b){
  const W=(u,v,z=0)=>[b.x+u,b.y+v,z];
  I.poly(ctx,[W(0,0),W(b.w,0),W(b.w,b.d),W(0,b.d)],this.pat.planks,'#6c624d',.4);
  const orders=HK.state.operations?.orders||[];
  for(let bay=0;bay<2;bay++){
   const cy=.53+bay*1.03,o=orders[bay];
   for(const x of [.3,.75,1.25])I.box(ctx,b.x+x,b.y+cy-.33,0,.09,.66,.08,{wall:'#6d5940',top:'#99845f'});
   if(!o)continue;
   const phase=HK.shipBuildProgress(HK.state,o).phase,L=o.type==='fishingBoat'?.95:o.type==='schnigge'?1.13:o.type==='kogge'?1.32:1.5,x0=(b.w-L)/2;
   const P=(u,v,z)=>W(x0+u*L,cy+v,z);
   I.line(ctx,P(0,0,.12),P(1,0,.19),'#785c3b',2.5);
   const outline=[[0,0],[.16,-.27],[.72,-.28],[1,0],[.72,.28],[.16,.27]];
   if(phase>=1)for(let k=1;k<8;k++){const u=k/9,r=.27*Math.sin(Math.PI*u);const pts=[P(u,-r,.48),P(u,-r*.65,.24),P(u,0,.15),P(u,r*.65,.24),P(u,r,.48)];for(let j=1;j<pts.length;j++)I.line(ctx,pts[j-1],pts[j],'#b6a078',1.35);}
   if(phase>=2)for(let band=0;band<4;band++)for(let k=0;k<outline.length;k++){const a=outline[k],d=outline[(k+1)%outline.length],lo=.16+band*.075,hi=lo+.075;I.poly(ctx,[P(a[0],a[1]*(.45+band*.13),lo),P(d[0],d[1]*(.45+band*.13),lo),P(d[0],d[1]*(.58+band*.13),hi),P(a[0],a[1]*(.58+band*.13),hi)],['#816a49','#927b56','#a28b65','#ad9874'][band],'#65573e',.35);}
   if(phase>=3){I.poly(ctx,outline.map(([u,v])=>P(u,v*.91,.47)),'#b6a17b','#6e6047',.4);for(let k=1;k<9;k++){const u=k/10,r=.23*Math.sin(Math.PI*u);I.line(ctx,P(u,-r,.48),P(u,r,.48),'#8d7856',.4);}I.poly(ctx,[P(.38,-.13,.49),P(.57,-.13,.49),P(.57,.13,.49),P(.38,.13,.49)],'#554e3b');}
   if(phase>=4)I.line(ctx,P(.62,0,.47),P(.62,0,1.33),'#806543',1.8);
   if(phase>=5){I.line(ctx,P(.62,-.27,1.13),P(.62,.27,1.13),'#a18a60',1.6);I.poly(ctx,[P(.62,-.26,1.13),P(.62,.26,1.13),P(.63,.24,.99),P(.63,-.24,.99)],'#d1c3a0');for(const u of [.08,.94])I.line(ctx,P(.62,0,1.3),P(u,0,.48),'#bbaa7f',.6);}
  }
  for(let i=0;i<3;i++)I.box(ctx,b.x+.05,b.y+b.d-.16,i*.045,.7,.12,.045,{wall:'#8c7652',top:'#b29c71'});
 },
 nightCargoPose(job,time){
  const n=job.nightCargo;if(!n||n.settled||time<n.start||time>=n.end)return null;
  this._nightPaths ||= new Map();const key=job.id+':'+job.berth+':'+job.direction;let path=this._nightPaths.get(key);
  if(!path){const source=this.PORTER_HOME[Math.min(1,Math.max(0,Math.floor(job.berth/2)))],target=this.freightNode('warehouse');const nodes=this.route(job.direction==='in'?source:target,job.direction==='in'?target:source);path=nodes.map(k=>HK.ROAD_NODES[k]);this._nightPaths.set(key,path);if(this._nightPaths.size>80)this._nightPaths.delete(this._nightPaths.keys().next().value);}
  if(path.length<2)return null;
  const lengths=path.slice(1).map((p,i)=>Math.hypot(p[0]-path[i][0],p[1]-path[i][1]));let d=lengths.reduce((a,b)=>a+b,0)*(time-n.start)/(n.end-n.start),i=0;while(i<lengths.length-1&&d>lengths[i])d-=lengths[i++];const a=path[i],b=path[i+1],f=d/lengths[i];return{x:a[0]+(b[0]-a[0])*f,y:a[1]+(b[1]-a[1])*f,heading:Math.atan2(b[1]-a[1],b[0]-a[0])};
 }
});
{
 const freight=HK.Scene.freightItems;HK.Scene.freightItems=function(items,t){freight.call(this,items,t);for(const j of HK.nightCargoPending(HK.state)){
  const p=this.nightCargoPose(j,HK.nightCargoNow(HK.state));if(!p)continue;const sp=I.p(p.x,p.y,0),phase=t*5;
  items.push({r:'night-cargo:'+j.id,v:Math.floor(t*12),ap:sp,k:this.pointKey(p.x,p.y),box:[p.x-.15,p.y-.15,p.x+.15,p.y+.15],f:c=>{this.drawPerson(c,...sp,'#565f4b','porter',1,false,'#cfae90',phase,1,null,{head:p.heading,basket:true},.8);this.drawCargo(c,p.x+.06,p.y+.06,.43,{good:j.good,kind:HK.cargoKind(j.good),qty:j.qty});},pick:{kind:'building',building:HK.BUILDING.warehouse,panel:'warehouse',label:HK.t('nightCargoMoving')+' · '+j.qty+' '+HK.goodName(j.good)}});
 }};
 const panel=HK.UI.panel_harbour;HK.UI.panel_harbour=function(){const jobs=HK.nightCargoPending(HK.state);return (jobs.length?`<section>${this.helpHeading('nightCargoTitle','nightCargoHelp',3)}${jobs.map(j=>`<p>${HK.goodName(j.good)} · ${j.qty} ${HK.t('unitLast')} · ${HK.t(j.status==='active'?'nightCargoMoving':'nightCargoWaiting')}</p>`).join('')}</section>`:'')+panel.call(this);};
}
