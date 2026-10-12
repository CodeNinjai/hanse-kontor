'use strict';
// Exercise actual drawing poses and Pixi resource reuse, including the old
// phase/direction boundaries. Run with Playwright available in NODE_PATH.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
  try{
    const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(process.env.HK_URL||'http://localhost:8778/');
    await page.waitForFunction(()=>HK.PixiScene.bereit);
    await page.locator('#new-game-form button[type=submit]').click();
    await page.evaluate(()=>{HK.loop=()=>{};HK.setSpeed(0);HK.Scene.clock=.5;});
    const poses=await page.evaluate(()=>{
      const S=HK.Scene,originalDraw=S.drawRuralAnimal,originalPos=S.porterPos,originalPorters=S.porters;
      const courier={head:0,freightJob:{good:'cattle'},items:[{good:'cattle'}]};
      const ctx=document.createElement('canvas').getContext('2d'),previous=new Map(),planted=new Map();
      let samples=0,maxStep=0,plantedChecks=0;
      // Inspect the projected geometry, not merely an animation counter.
      try{
        S.porters=[courier];S.porterPos=()=>({wx:42,wy:18.5});
        for(let frame=0;frame<720;frame++){
          const t=frame/60;courier.head=t*.045+Math.PI/2;
          const items=[];S.addRuralItems(items,null,HK.state,S.season(),t);
          const animals=items.filter(it=>(it.r||it.s||'').match(/^(livestock|herd):/));
          if(animals.length!==6+HK.RURAL_DEER.length+HK.WOODLAND_FAUNA.length)throw Error('Missing pasture animal or transported cow');
          for(const [i,item] of animals.entries()){
            const points=[];
            const recorder=new Proxy(ctx,{
              get(target,key){const value=target[key];if(typeof value!=='function')return value;
                return (...args)=>{if(['ellipse','moveTo','lineTo','arc'].includes(key))points.push(args[0],args[1]);return value.apply(target,args);};},
              set(target,key,value){target[key]=value;return true;}
            });
            item.f(recorder);
            if(item.animal&&!item.animal.walking){
              // Shadow, four complete legs and body precede the head/tail.
              // Only stationary grazing poses must remain planted; walking
              // poses are checked separately against actual ground contact.
              const stance=JSON.stringify(points.slice(0,20));
              if(planted.has(i)&&planted.get(i)!==stance)throw Error('Grazing animal shuffles its feet or drifts: '+i);
              planted.set(i,stance);plantedChecks++;
            }else planted.delete(i);
            const old=previous.get(i);
            if(old){
              const step=Math.max(...points.map((v,j)=>Math.abs(v-old[j])));
              if(!(step>1e-7&&step<1))throw Error('Animal pose freezes or jumps: '+i+' at '+t+' delta '+step);
              maxStep=Math.max(maxStep,step);samples++;
            }
            previous.set(i,points);
          }
        }
      }finally{S.drawRuralAnimal=originalDraw;S.porterPos=originalPos;S.porters=originalPorters;}
      return{samples,maxStep,plantedChecks};
    });
    const render=await page.evaluate(()=>{
      const S=HK.Scene,P=HK.PixiScene,times=[];let frames=0;
      for(const [x,y] of [[42,18.5],[13.8,-11.1],[25.2,-13.8]]){
        S.cam.z=3;S.zeigeAuf(x,y);
        for(const clock of [.5,.95]){
          S.clock=clock;S.draw();const graphics=new Map();
          for(let f=0;f<60;f++){
            S.time+=1/60;const start=performance.now();S.draw();times.push(performance.now()-start);frames++;
            for(const [key,e] of P.animiert)if(key.startsWith('livestock:')){
              const old=graphics.get(key);if(old&&old!==e.g)throw Error('Animal allocates new graphics each frame');
              graphics.set(key,e.g);
              const animal=S.ruralAnimals(S.time)[Number(key.split(':')[1])],origin=HK.Iso.p(animal.x,animal.y,0);
              for(let j=0;j<4;j++){
                const leg=e.g.animalLayers['leg'+j],foot=HK.Iso.p(...animal.motion.feet[j]);
                const x=origin[0]+leg.x+Math.cos(leg.rotation)*leg.scale.x,y=origin[1]+leg.y+Math.sin(leg.rotation)*leg.scale.x;
                if(Math.hypot(x-foot[0],y-foot[1])>1e-6)throw Error('Rendered leg misses its planted hoof');
              }
              if(clock===.95){
                const mask=P.emMasken.get(e.g);
                for(const [part,layer] of Object.entries(e.g.animalLayers)){
                  const copy=mask?.animalLayers?.[part];
                  if(!copy||copy.children[0].texture!==layer.children[0].texture||copy.y!==layer.y||copy.rotation!==layer.rotation)throw Error('Night silhouette does not follow animal');
                }
              }
            }
            if(!graphics.size)throw Error('No animal rendered in view');
          }
        }
      }
      if([...P.gestalten.keys()].some(k=>/^(livestock|herd):/.test(k)))throw Error('Continuous animal poses fill the sprite cache');
      times.sort((a,b)=>a-b);return{frames,medianMs:times[Math.floor(times.length/2)],p90Ms:times[Math.floor(times.length*.9)]};
    });
    // Inspect rendered pixel changes, not just the smooth input coordinates.
    // Keep the pixel-change metric as a diagnostic: larger intentional head
    // movements also change more alpha. Actual poses must remain animated.
    const pixels=await page.evaluate(()=>{
      const S=HK.Scene,P=HK.PixiScene,R=P.app.renderer,stage=new PIXI.Container();
      const target=PIXI.RenderTexture.create({width:200,height:160,antialias:true}),results=[];
      try{
        for(const index of [0,2,5]){
          let entry,previous,maxAlphaStep=0,changedFrames=0;const textures=new Set();
          try{
            for(let frame=0;frame<120;frame++){
              const pause=[8,4.5,0][[0,2,5].indexOf(index)];
              const a=S.ruralAnimals(pause+frame/60)[index];
              entry=P.animalGraphic(entry,{animal:a,ap:HK.Iso.p(a.x,a.y,0)});
              if(!entry.g.parent)stage.addChild(entry.g);
              entry.g.position.set(100,85);entry.g.scale.set(4);
              for(const texture of entry.textures)textures.add(texture);
              R.render({container:stage,target,clear:true});
              const data=R.extract.pixels(target).pixels;
              if(previous){let changed=false;
                for(let j=3;j<data.length;j+=4){const delta=Math.abs(data[j]-previous[j]);maxAlphaStep=Math.max(maxAlphaStep,delta);if(delta)changed=true;}
                if(changed)changedFrames++;
              }
              previous=data.slice();
            }
            if(textures.size!==4)throw Error('Animal rebuilds textures while animating');
            if(changedFrames<90)throw Error('Visible animal edges jump or freeze: '+index+'/'+maxAlphaStep+'/'+changedFrames);
            results.push({type:S.ruralAnimals(0)[index].type,maxAlphaStep,changedFrames});
          }finally{if(entry)P.destroyAnimated(entry);}
          if([...textures].some(t=>!t.destroyed))throw Error('Animal textures survive disposal');
        }
      }finally{stage.destroy({children:true});target.destroy(true);}
      return results;
    });
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({result:'PASS',poses,render,pixels,errors}));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
