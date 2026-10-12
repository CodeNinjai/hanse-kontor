'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({locale:'de-DE'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.HK_URL||'http://localhost:8778');await page.waitForFunction(()=>HK.PixiScene.bereit);await page.locator('#new-game-form button[type=submit]').click();
 await page.evaluate(async()=>{HK.loop=()=>{};HK.state.speed=0;await HK.Audio.ambienceReady;HK.Scene.clock=.5;HK.Scene.weather='clear';HK.Scene.focusDistrict('market');const A=HK.Audio;window.gullCalls=[];const effect=A.effect;A.effect=function(kind,level){const node=effect.call(this,kind,level);if(kind.startsWith('gull'))window.gullCalls.push({kind,played:!!node,level,time:A.context.currentTime});return node;};A.ambienceDeadlines={};A.update();});
 await page.waitForFunction(()=>gullCalls.some(c=>c.played),{},{timeout:10000});assert(await page.evaluate(()=>HK.Audio.profile().market),'Default market view');
 const first=await page.evaluate(()=>gullCalls.length);await page.evaluate(()=>{HK.Scene.focusDistrict('harbour');HK.Audio.update();});
 await page.waitForFunction(n=>gullCalls.length>n,first,{timeout:4500});
 const signals=await page.evaluate(async()=>{const result=[];for(const kind of ['gull','gull2']){const ctx=new OfflineAudioContext(2,32000*2,32000),gain=ctx.createGain();gain.gain.value=.75*.6;gain.connect(ctx.destination);HK.Audio.recordedEffect.call({context:ctx,ambience:gain,ambienceBuffers:HK.Audio.ambienceBuffers,random:()=>.5},kind,.9);const b=await ctx.startRendering();const d=b.getChannelData(0).slice(0,32000);result.push({kind,rms:Math.sqrt(d.reduce((s,v)=>s+v*v,0)/d.length),peak:Math.max(...d.map(Math.abs))});}return result;});
 for(const s of signals){assert(s.rms>.006,'Too quiet at default master/ambience: '+JSON.stringify(s));assert(s.peak<.65,'Gull clips');}
 await page.evaluate(()=>{HK.Scene.clock=.97;HK.Audio.ambienceDeadlines.gulls=-1;window.beforeNight=gullCalls.length;HK.Audio.update();});assert(await page.evaluate(()=>gullCalls.length===beforeNight));
 await page.locator('#btn-audio').click();const before=await page.evaluate(()=>HK.serialize(HK.state)),calls=await page.evaluate(()=>gullCalls.length);await page.locator('#audio-gull').click();assert.equal(await page.evaluate(()=>gullCalls.length),calls+1);assert.equal(await page.evaluate(()=>HK.serialize(HK.state)),before);
 await page.locator('#audio-muted').check();assert(await page.locator('#audio-gull').isDisabled());await page.locator('#audio-muted').uncheck();await page.locator('#audio-ambience').fill('0');assert(await page.locator('#audio-gull').isDisabled());
 // A skipped event is retried, not treated as an audible call.
 assert(await page.evaluate(()=>{const fake={ambienceDeadlines:{gulls:0},ambienceLast:{},ambienceWasHarbour:true,ambiencePlan:()=>({gulls:{enabled:true,kinds:['gull'],level:.9,min:9,max:19}}),random:()=>.5,effect:()=>null};HK.Audio.ambienceEvents.call(fake,{harbour:true},10);return fake.ambienceDeadlines.gulls===12&&!fake.ambienceLast.gulls;}));
 assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',automaticMarketCalls:true,harbourEntryWithinSeconds:true,nightQuiet:true,preview:true,muteRespected:true,signals,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
