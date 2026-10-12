/* NODE_PATH=/tmp/hanse-browser/node_modules node tools/audio-browser-test.cjs */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try {
  const page=await browser.newPage({viewport:{width:1450,height:1000},locale:'de-DE'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.audioContextCreations=0;const Native=window.AudioContext;window.AudioContext=class extends Native{constructor(...args){super(...args);window.audioContextCreations++;}};});
  await page.goto(process.env.HK_URL||'http://localhost:8778/');await page.waitForFunction(()=>HK.PixiScene.bereit);
  assert(await page.evaluate(()=>HK.Audio.context===null&&!HK.Audio.activated),'Title screen starts audio without a gesture');
  await page.locator('#new-game-form button[type=submit]').click();await page.waitForFunction(()=>HK.Audio.context?.state==='running');assert(await page.evaluate(()=>HK.Audio.settings.music===.24),'New score should start quietly');await page.waitForFunction(()=>HK.Audio.track==='market');
  const initial=await page.evaluate(()=>({layers:Object.keys(HK.Audio.layers).length,sources:HK.Audio.musicNodes.size,duration:HK.Audio.musicNodes.values().next().value.source.buffer.duration,settings:HK.Audio.settings}));
  assert.equal(initial.layers,4);assert.equal(initial.sources,1);assert(initial.duration>75);
  // Actual native audio output must have energy and remain well below clipping.
  const signal=await page.evaluate(async()=>{const analyser=HK.Audio.context.createAnalyser();analyser.fftSize=4096;HK.Audio.master.connect(analyser);await new Promise(r=>setTimeout(r,1000));const samples=new Float32Array(4096);analyser.getFloatTimeDomainData(samples);analyser.disconnect();return{peak:Math.max(...samples.map(Math.abs)),rms:Math.sqrt(samples.reduce((n,x)=>n+x*x,0)/samples.length)};});
  assert(signal.rms>.0001&&signal.peak<.95,'Audio is silent or clips');
  await page.evaluate(()=>{HK.loop=()=>{};HK.state.speed=0;HK.Scene.clock=.5;HK.Scene.weather='clear';HK.Scene.focusDistrict('harbour');HK.Audio.update();});assert.equal(await page.evaluate(()=>HK.Audio.track),'market','Camera movement interrupts the piece');await page.evaluate(()=>{for(const n of HK.Audio.musicNodes)n.source.stop();});await page.waitForFunction(()=>HK.Audio.track===null);assert(await page.evaluate(()=>HK.Audio.nextMusicAt>HK.Audio.context.currentTime+10),'Missing musical pause');await page.evaluate(()=>{HK.Audio.nextMusicAt=0;HK.Audio.update();});await page.waitForFunction(()=>HK.Audio.track==='cinematic');
  const day=await page.evaluate(()=>HK.Audio.profile());assert(day.water>.2&&day.crowd>.1);
  await page.evaluate(()=>{HK.Scene.clock=.95;HK.Scene.weather='rain';HK.Audio.update();});assert.equal(await page.evaluate(()=>HK.Audio.track),'cinematic');await page.evaluate(()=>{for(const n of HK.Audio.musicNodes)n.source.stop();});await page.waitForFunction(()=>HK.Audio.track===null);await page.evaluate(()=>{HK.Audio.nextMusicAt=0;HK.Audio.update();});await page.waitForFunction(()=>HK.Audio.track==='night');
  const night=await page.evaluate(()=>HK.Audio.profile());assert(night.crowd<day.crowd&&night.rain>0);
  await page.waitForFunction(()=>HK.Audio.musicNodes.size===1,{},{timeout:10000});
  await page.locator('#btn-audio').click();assert.equal(await page.locator('.audio-sliders input').count(),3);
  await page.locator('#audio-music').fill('27');await page.locator('#audio-ambience').fill('42');
  const settings=await page.evaluate(()=>({value:HK.Audio.settings,stored:JSON.parse(localStorage.getItem(HK.Audio.key))}));assert.equal(settings.value.music,.27);assert.equal(settings.stored.ambience,.42);
  await page.locator('#modal [data-close]').click();
  // Native keyboard activation must mute, not change simulation speed.
  await page.locator('#btn-audio-mute').focus();await page.keyboard.press('Space');await page.waitForFunction(()=>HK.Audio.context.state==='suspended');
  assert(await page.evaluate(()=>HK.state.speed===0&&HK.Audio.settings.muted&&HK.Audio.timer===null));
  await page.locator('#btn-audio-mute').click();await page.waitForFunction(()=>HK.Audio.context.state==='running'&&HK.Audio.timer!==null);
  const reused=await page.evaluate(async()=>{const ctx=HK.Audio.context;for(let i=0;i<5;i++)await HK.Audio.start();return ctx===HK.Audio.context&&window.audioContextCreations===1;});assert(reused,'Resume recreates audio graphs');
  const stable=await page.evaluate(()=>{const snapshot=HK.serialize(HK.state),random=Math.random;let rolls=0;Math.random=()=>{rolls++;return .5;};try{for(let i=0;i<40;i++){HK.Audio.profile();HK.Audio.update();HK.SoundSynth.composition('market');}return{same:HK.serialize(HK.state)===snapshot,rolls,sources:HK.Audio.musicNodes.size};}finally{Math.random=random;}});assert(stable.same&&stable.rolls===0&&stable.sources<=2,'Sound mutates the economy or grows voices');
  // Emulate visibility events in the real browser while checking suspended time.
  await page.evaluate(()=>{window.visibilityOverride=true;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.visibilityOverride});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForFunction(()=>HK.Audio.context.state==='suspended'&&HK.Audio.timer===null);
  await page.evaluate(()=>{window.visibilityOverride=false;document.dispatchEvent(new Event('visibilitychange'));});await page.waitForFunction(()=>HK.Audio.context.state==='running');
  // Every licensed recording decodes, has signal, and fades quietly at its boundaries.
  const tracks=await page.evaluate(async()=>{const results=[];for(const kind of Object.keys(HK.Audio.tracks)){const b=await HK.Audio.buffer(kind),samples=b.getChannelData(0);let peak=0,power=0;for(const v of samples){peak=Math.max(peak,Math.abs(v));power+=v*v;}results.push({kind,duration:b.duration,peak,rms:Math.sqrt(power/samples.length),seam:Math.abs(samples[0]-samples.at(-1))});}return results;});
  for(const t of tracks)assert(t.duration>60&&t.peak<.5&&t.rms>.005&&t.seam<.04,'Damaged soundtrack or missing fades: '+t.kind);
  assert(tracks.reduce((n,t)=>n+t.duration,0)>=30*60,'Music selection shorter than 30 minutes');
  // Native offline rendering catches invalid event schedules and clipping in every sound effect.
  const effects=await page.evaluate(async()=>{const results=[];for(const kind of ['gull','bird','cricket','bell','hammer','creak','hooves']){const c=new OfflineAudioContext(1,22050*6,22050);HK.SoundSynth.effect(c,c.destination,kind,0,0);const b=await c.startRendering(),d=b.getChannelData(0);results.push({kind,peak:Math.max(...d.subarray(0,22050).map(Math.abs)),power:d.reduce((s,v)=>s+v*v,0)});}return results;});for(const t of effects)assert(t.power>.001&&t.peak<.5,'Invalid sound effect '+t.kind);
  assert(await page.evaluate(()=>HK.Audio.buffers.size<=2),'Decoded music cache grows with the playlist');
  // Several day/night cycles must alternate styles without immediate repeats.
  const rotation=await page.evaluate(()=>{
    const A=HK.Audio,saved={track:A.track,lastTrack:A.lastTrack,pendingTrack:A.pendingTrack,lastMedieval:A.lastMedieval,lastByStyle:A.lastByStyle},clock=HK.Scene.clock;
    const sequences=[];
    try{for(const night of [false,true]){HK.Scene.clock=night?.95:.5;Object.assign(A,{track:null,lastTrack:null,pendingTrack:null,lastMedieval:null,lastByStyle:{}});const seq=[];
      for(let i=0;i<18;i++){const id=A.nextTrack();seq.push({id,style:A.tracks[id].style});A.lastTrack=id;A.lastByStyle[A.tracks[id].style]=id;if(A.tracks[id].style==='medieval')A.lastMedieval=id;}
      sequences.push(seq);
    }}finally{Object.assign(A,saved);HK.Scene.clock=clock;}return sequences;
  });
  for(let i=0;i<18;i++){assert.equal(rotation[0][i].style,['medieval','cinematic','tavern'][i%3]);assert.equal(rotation[1][i].style,i%2?'cinematic':'medieval');if(i)assert.notEqual(rotation[1][i].id,rotation[1][i-1].id);}
  assert.equal(new Set(rotation[0].map(t=>t.id)).size,8);
  // Preview the selection through the actual UI, then stop music without stopping ambience.
  await page.locator('#btn-audio').click();const previous=await page.evaluate(()=>HK.Audio.track);
  await page.locator('#audio-next').click();await page.waitForFunction(old=>HK.Audio.track&&HK.Audio.track!==old,previous);
  await page.locator('#audio-music').fill('0');await page.waitForFunction(()=>HK.Audio.musicNodes.size===0);
  assert(await page.evaluate(()=>HK.Audio.context.state==='running'&&HK.Audio.track===null&&HK.Audio.settings.ambience===.42));
  await page.locator('#audio-music').fill('27');await page.waitForFunction(()=>!!HK.Audio.track);
  await page.locator('.music-credits summary').click();assert.match(await page.locator('.music-credits').textContent(),/Kevin MacLeod.*CC BY 4.0/);
  await page.locator('#modal [data-close]').click();
  for(const lang of ['de','en']){await page.evaluate(lang=>HK.setLang(lang),lang);await page.locator('#btn-audio').click();assert(await page.locator('#modal h2').textContent().then(t=>t=== (lang==='de'?'Musik & Stadtklänge':'Music & town sounds')));await page.locator('#modal [data-close]').click();}
  await page.setViewportSize({width:390,height:844});await page.locator('#btn-audio').click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert(await page.locator('#modal .modal-box').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  fs.mkdirSync('/tmp/hanse-map-audit',{recursive:true});await page.screenshot({path:'/tmp/hanse-map-audit/audio-controls-mobile.png'});await page.locator('#modal [data-close]').click();
  await page.locator('#btn-audio-mute').click();await page.waitForFunction(()=>HK.Audio.context.state==='suspended');await page.reload();await page.waitForFunction(()=>HK.PixiScene.bereit);await page.locator('#t-continue').click();
  assert(await page.evaluate(()=>HK.Audio.settings.muted&&HK.Audio.context===null&&HK.Audio.settings.music===.27&&HK.Audio.settings.ambience===.42),'Reload loses persisted preferences or starts muted audio');
  // Blocked assets degrade to ambience and avoid a continuous retry storm.
  const failed=await browser.newPage({locale:'de-DE'});failed.on('pageerror',e=>errors.push(e.message));let requests=0;await failed.route('**/assets/audio/*.mp3*',route=>{requests++;return route.fulfill({status:404,body:''});});
  await failed.goto(process.env.HK_URL||'http://localhost:8778/');await failed.waitForFunction(()=>HK.PixiScene.bereit);await failed.locator('#new-game-form button[type=submit]').click();await failed.waitForFunction(()=>HK.Audio.error==='audioMusicFailed');
  await failed.evaluate(()=>{for(let i=0;i<20;i++)HK.Audio.update();});assert.equal(requests,1);assert(await failed.evaluate(()=>HK.Audio.context.state==='running'&&Object.keys(HK.Audio.layers).length===4));await failed.close();
  const unsupported=await browser.newPage({locale:'de-DE'});unsupported.on('pageerror',e=>errors.push(e.message));
  await unsupported.addInitScript(()=>{Object.defineProperty(window,'AudioContext',{value:undefined,configurable:true});Object.defineProperty(window,'webkitAudioContext',{value:undefined,configurable:true});localStorage.setItem('hanse-kontor-audio',JSON.stringify({master:3,music:'bad',ambience:-3,muted:'bad'}));});
  await unsupported.goto(process.env.HK_URL||'http://localhost:8778/');await unsupported.waitForFunction(()=>HK.PixiScene.bereit);await unsupported.locator('#new-game-form button[type=submit]').click();
  assert(await unsupported.evaluate(()=>HK.Audio.error==='audioUnavailable'&&HK.Audio.context===null&&HK.Audio.settings.master===1&&HK.Audio.settings.music===.24&&HK.Audio.settings.ambience===0&&!HK.Audio.settings.muted));
  await unsupported.locator('#btn-audio').click();assert.match(await unsupported.locator('#audio-status').textContent(),/Browser/);await unsupported.close();
  assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',signal,tracks,effects:effects.length,settings:'persisted',visibility:'suspends',languages:2,mobile:true,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
