/* One audio graph per page. Wall-clock sound, independent of game speed and economic RNG. */
'use strict';
HK.Audio = {
  key:'hanse-kontor-audio', settings:{master:.75,music:.24,ambience:.6,muted:false}, context:null, timer:null,
  buffers:new Map(), musicNodes:new Set(), effects:new Set(), layers:{}, track:null, lastTrack:null, nextMusicAt:0, pendingTrack:null, request:0, activated:false, error:null,
  random:HK.SoundSynth.random(5031), nextEffect:0, nextBell:0, lastQuarter:null, suspension:0,
  tracks:{
    market:{title:'Angevin',style:'medieval',isrc:'USUAN1200110'},
    harbour:{title:'Lord of the Land',style:'medieval',isrc:'USUAN1400022'},
    night:{title:'Evening Fall (Harp)',style:'medieval',isrc:'USUAN1100236'},
    cinematic:{title:'Windswept',style:'cinematic',isrc:'USUAN1100757'},
    tavern:{title:'Thatched Villagers',style:'tavern',isrc:'USUAN1100720'},
    evening:{title:'Evening',style:'cinematic',isrc:'USUAN2300002'},
    healing:{title:'Healing',style:'cinematic',isrc:'USUAN1200048'},
    folk:{title:'Folk Round',style:'tavern',isrc:'USUAN1100357'},
  },
  lastMedieval:null, lastByStyle:{},
  readSettings() {
    try {const stored=JSON.parse(localStorage.getItem(this.key)||'null');if(stored&&typeof stored==='object')for(const key of ['master','music','ambience','muted'])if(key==='muted'){if(typeof stored[key]==='boolean')this.settings[key]=stored[key];}else if(typeof stored[key]==='number'&&Number.isFinite(stored[key]))this.settings[key]=HK.clamp(stored[key],0,1);}catch(e){/* Defaults also work with blocked storage. */}
    // Introduce the new, quieter recordings once; subsequent volume choices persist.
    try {if(JSON.parse(localStorage.getItem(this.key)||'null')?.musicVersion!==3){this.settings.music=.24;this.persist();}}catch(e){this.settings.music=.24;}
  },
  persist() {try{localStorage.setItem(this.key,JSON.stringify({...this.settings,musicVersion:3}));}catch(e){/* Sound is usable without storage. */}},
  ramp(param,value,seconds=.8) {const now=this.context.currentTime;param.setTargetAtTime(value,now,Math.max(.02,seconds/3));},
  createGraph() {
    if(this.context)return true;
    const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext){this.error='audioUnavailable';return false;}
    try {
      const ctx=this.context=new AudioContext(),master=this.master=ctx.createGain(),music=this.music=ctx.createGain(),ambience=this.ambience=ctx.createGain(),limiter=ctx.createDynamicsCompressor();
      master.gain.value=0;music.gain.value=this.settings.music;ambience.gain.value=this.settings.ambience;limiter.threshold.value=-12;limiter.knee.value=12;limiter.ratio.value=5;limiter.attack.value=.015;limiter.release.value=.25;
      music.connect(master);ambience.connect(master);master.connect(limiter).connect(ctx.destination);
      for(const kind of ['water','wind','rain','crowd']) {
        const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=HK.SoundSynth.ambientBuffer(ctx,kind);source.loop=true;gain.gain.value=0;
        filter.type=kind==='crowd'?'bandpass':'lowpass';filter.frequency.value={water:950,wind:420,rain:1900,crowd:580}[kind];filter.Q.value=kind==='crowd'?.8:.4;
        const fallback=ctx.createGain();source.connect(fallback).connect(filter).connect(gain).connect(ambience);source.start();this.layers[kind]={source,filter,gain,fallback};
      }
      this.prepareAmbience?.();
      return true;
    }catch(e){this.context?.close().catch(()=>{});this.context=null;this.layers={};this.error='audioUnavailable';return false;}
  },
  eligible() {return !!HK.state&&!HK.preview&&!document.hidden&&document.getElementById('title-screen').hidden&&!HK.state.gameOver;},
  async start() {
    // Called directly from a user click, before asynchronous loading, to unlock browser audio.
    this.activated=true;clearTimeout(this.suspension);this.suspension=0;
    if(this.settings.muted||this.settings.master===0||document.hidden){this.refreshUI();return false;}
    if(!this.createGraph()){this.refreshUI();return false;}
    try {await this.context.resume();if(this.settings.muted||this.settings.master===0||document.hidden){this.refreshUI();return false;}if(!this.timer)this.timer=setInterval(()=>this.update(),600);this.update();this.refreshUI();return true;}
    catch(e){this.error='audioNeedsClick';this.refreshUI();return false;}
  },
  profile() {
    const scene=HK.Scene,night=scene.clock<.23||scene.clock>.81,rain=scene.weather==='rain',district=scene.district||'all';
    const centre=scene.toWorld(scene.cam.x+HK.SCENE.W/(2*scene.cam.z),scene.cam.y+HK.SCENE.H/(2*scene.cam.z));
    const free=district==='custom',harbour=district==='harbour'||free&&centre.y>16,craft=district==='craft'||free&&centre.x>23&&centre.y<15,quiet=['church','gate'].includes(district)||free&&(centre.y<5||centre.x>35);
    const nature=quiet||free&&centre.x>35;
    const market=district==='market'||free&&!harbour&&!nature&&!craft;
    const seabirds=harbour||district==='market'||district==='all'||free&&!nature&&!craft&&centre.y>=8;
    const evening=harbour&&scene.clock>=.68&&scene.clock<.94;
    const lateCrowd=evening&&!rain?.012+.28*HK.clamp((.94-scene.clock)/.14,0,1):.012;
    return {night,evening,rain,district,track:night?'night':harbour?'harbour':'market',water:harbour?.3:district==='all'||district==='custom'?.1:.025,wind:rain?.045:.07,rain:rain?(night?.10:.14)*(.6+.4*(HK.weatherAt?.(HK.state)?.strength??1)):0,crowd:nature?0:night?lateCrowd:rain?.12:market?.58:harbour?.38:.28,craft,harbour,nature,market,seabirds};
  },
  update() {
    if(!this.context)return;
    const eligible=this.eligible()&&!this.settings.muted,profile=this.profile();
    this.ramp(this.master.gain,eligible?this.settings.master:0,.3);
    this.ramp(this.music.gain,this.settings.music*(profile.night?.72:1),1.5);this.ramp(this.ambience.gain,this.settings.ambience,1);
    for(const [kind,layer] of Object.entries(this.layers))this.ramp(layer.gain.gain,profile[kind],kind==='rain'||kind==='wind'?6:2.4);
    if(!eligible||this.context.state!=='running')return;
    // Let the piece finish: moving the camera must not restart the soundtrack.
    if(this.settings.music>0&&!this.track&&!this.pendingTrack&&this.context.currentTime>=this.nextMusicAt&&(!this.nextRetry||this.context.currentTime>=this.nextRetry))this.changeTrack(this.nextTrack());
    const now=this.context.currentTime,quarter=Math.floor(HK.Scene.clock*4);
    if(this.lastQuarter!==null&&quarter!==this.lastQuarter&&quarter!==0&&now>=this.nextBell&&this.settings.ambience>0){this.effect('bell',.26);this.nextBell=now+120;}
    this.lastQuarter=quarter;
    if(this.settings.ambience>0)this.ambienceEvents(profile,now);
  },
  effect(kind,level=1) {
    if(!this.context||this.context.state!=='running'||this.settings.muted||this.settings.ambience===0||!this.eligible()||this.effects.size>=6)return null;
    const node=this.recordedEffect(kind,level)||HK.SoundSynth.effect(this.context,this.ambience,kind==='gull2'?'gull':kind,this.context.currentTime,(this.random()-.5)*.8,level),ended=node.onended;
    this.effects.add(node);node.onended=()=>{ended?.();this.effects.delete(node);};return node;
  },
  nextTrack(manual=false) {
    const profile=this.profile(),previous=this.pendingTrack||this.track||this.lastTrack;
    if(!previous)return profile.track;
    const style=this.tracks[previous].style;
    const nextStyle=style==='medieval'?'cinematic':style==='cinematic'&&(manual||!profile.night)?'tavern':'medieval';
    const pool=nextStyle==='medieval'?(profile.night?['night','market']:['market','harbour','night']):Object.keys(this.tracks).filter(id=>this.tracks[id].style===nextStyle);
    const last=nextStyle==='medieval'?this.lastMedieval:this.lastByStyle[nextStyle];
    return pool[(pool.indexOf(last)+1)%pool.length];
  },
  skipTrack() {
    if(this.settings.music===0)this.set('music',.24);
    this.settings.muted=false;this.persist();
    const kind=this.nextTrack(true);
    this.start().then(ok=>{if(ok)this.changeTrack(kind);});
  },
  async buffer(kind) {
    if(!this.buffers.has(kind))this.buffers.set(kind,(async()=>{const response=await fetch('assets/audio/'+kind+'.mp3?v=curated-1');if(!response.ok)throw new Error('track');return this.context.decodeAudioData(await response.arrayBuffer());})());
    try{
      const buffer=await this.buffers.get(kind);
      // Keep decoded recordings bounded as the collection grows.
      for(const key of this.buffers.keys())if(this.buffers.size>2&&key!==kind)this.buffers.delete(key);
      return buffer;
    }catch(e){this.buffers.delete(kind);throw e;}
  },
  async changeTrack(kind) {
    const request=++this.request;this.pendingTrack=kind;
    try {
      const buffer=await this.buffer(kind);
      if(request!==this.request||!this.eligible()||this.settings.muted||this.settings.music===0){if(request===this.request)this.pendingTrack=null;return;}
      const ctx=this.context,source=ctx.createBufferSource(),gain=ctx.createGain(),node={source,gain,kind},now=ctx.currentTime;
      source.buffer=buffer;source.loop=false;gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(1,now+3);
      source.connect(gain).connect(this.music);source.start(now);this.musicNodes.add(node);
      source.onended=()=>{source.disconnect();gain.disconnect();this.musicNodes.delete(node);if(!node.stopping&&this.track===kind){this.lastTrack=kind;this.track=null;this.nextMusicAt=ctx.currentTime+18;this.refreshUI();}};
      for(const old of this.musicNodes)if(old!==node&&!old.stopping){old.stopping=true;old.gain.gain.cancelAndHoldAtTime(now);old.gain.gain.linearRampToValueAtTime(0,now+3);old.source.stop(now+3.1);}
      this.track=kind;this.pendingTrack=null;this.error=null;this.nextRetry=0;this.refreshUI();
      if(this.tracks[kind].style==='medieval')this.lastMedieval=kind;
      this.lastByStyle[this.tracks[kind].style]=kind;
    }catch(e){if(request===this.request){this.pendingTrack=null;this.error='audioMusicFailed';this.nextRetry=this.context.currentTime+30;this.refreshUI();}}
  },
  set(key,value) {
    if(key==='muted')this.settings.muted=!!value;
    else if(['master','music','ambience'].includes(key)&&Number.isFinite(value))this.settings[key]=HK.clamp(value,0,1);
    else return;
    this.persist();
    if(key==='music'&&this.settings.music===0){++this.request;this.pendingTrack=null;this.lastTrack=this.track||this.lastTrack;this.track=null;this.nextMusicAt=0;for(const node of this.musicNodes)if(!node.stopping){node.stopping=true;const now=this.context.currentTime;node.gain.gain.cancelAndHoldAtTime(now);node.gain.gain.linearRampToValueAtTime(0,now+.4);node.source.stop(now+.5);}}
    if(this.settings.muted||this.settings.master===0)this.silence();else {this.error=null;this.nextRetry=0;if(this.activated)this.start();}
    this.refreshUI();
  },
  silence() {
    if(this.timer){clearInterval(this.timer);this.timer=null;}++this.request;this.pendingTrack=null;
    if(!this.context)return;
    this.ramp(this.master.gain,0,.08);clearTimeout(this.suspension);
    this.suspension=setTimeout(()=>{this.suspension=0;if(this.settings.muted||this.settings.master===0||document.hidden)this.context.suspend().catch(()=>{});},100);
  },
  visibility() {if(document.hidden)this.silence();else if(this.activated&&!this.settings.muted)this.start();},
  refreshUI() {HK.UI?.audioStatus?.();},
};
Object.assign(HK.I18N.de,{
  audioStyle_medieval:'Mittelalter',audioStyle_cinematic:'Filmmusik',audioStyle_tavern:'Taverne',
  audioAmbienceOnly:'Nur Stadtgeräusche sind eingeschaltet.',audioTitle:'Musik & Stadtklänge',audioOpen:'Klang',audioOpenHint:'Musik und Stadtgeräusche einstellen',audioMute:'Stummschalten',audioUnmute:'Ton einschalten',audioMaster:'Gesamtlautstärke',audioMusic:'Musik',audioAmbience:'Stadtgeräusche',audioMuted:'Ton ist ausgeschaltet.',audioReady:'Eine kurze Pause für die Stadtklänge.',audioNext:'Nächstes Stück',audioCredits:'Musik & Quellen',audioChanges:'Lautstärke für das Spiel angepasst; sanfte Ein- und Ausblendungen hinzugefügt.',audioPlaying:'Jetzt zu hören: {track}',audioTrack_market:'Angevin',audioTrack_harbour:'Lord of the Land',audioTrack_night:'Evening Fall (Harp)',audioHint:'Mittelalterklänge, sanfte Filmmusik und Tavernenmusik wechseln sich ab. Nachts spielen die ruhigeren Stücke. Die Musik läuft zu Ende, mit kurzen Pausen für Stadtgeräusche.',audioUnavailable:'Dieser Browser kann den Klang nicht wiedergeben.',audioNeedsClick:'Ton einschalten, um die Wiedergabe zu starten.',audioMusicFailed:'Die Musik konnte nicht geladen werden. Die Stadtgeräusche bleiben verfügbar.',audioRetry:'Wiedergabe starten',
});
Object.assign(HK.I18N.en,{
  audioStyle_medieval:'Medieval',audioStyle_cinematic:'Cinematic',audioStyle_tavern:'Tavern',
  audioAmbienceOnly:'Only town ambience is enabled.',audioTitle:'Music & town sounds',audioOpen:'Sound',audioOpenHint:'Adjust music and town ambience',audioMute:'Mute sound',audioUnmute:'Enable sound',audioMaster:'Master volume',audioMusic:'Music',audioAmbience:'Town ambience',audioMuted:'Sound is muted.',audioReady:'A short pause for town ambience.',audioNext:'Next piece',audioCredits:'Music & credits',audioChanges:'Volume adjusted and gentle fades added for the game.',audioPlaying:'Now playing: {track}',audioTrack_market:'Angevin',audioTrack_harbour:'Lord of the Land',audioTrack_night:'Evening Fall (Harp)',audioHint:'Medieval, gentle cinematic and tavern music alternate. Quieter pieces play at night. Each piece finishes, with short pauses for town ambience.',audioUnavailable:'This browser cannot play the audio.',audioNeedsClick:'Enable sound to start playback.',audioMusicFailed:'Music could not be loaded. Town ambience remains available.',audioRetry:'Start playback',
});
