/* Recorded nature and working-town sounds, scheduled independently of the game clock. */
'use strict';
Object.assign(HK.Audio,{
  ambienceBuffers:new Map(), ambienceDeadlines:{}, ambienceLast:{}, ambienceReady:null,
  sampleKinds:['water','crowd','bird','gull','gull2','cargo','work','hammer','door','horse'],
  prepareAmbience(){
    if(this.ambienceReady)return this.ambienceReady;
    this.ambienceReady=Promise.allSettled(this.sampleKinds.map(async kind=>{
      const response=await fetch('assets/audio/ambience/'+kind+'.mp3?v='+(kind==='crowd'?'german-2':'1'));if(!response.ok)throw Error('ambience '+kind);
      const buffer=await this.context.decodeAudioData(await response.arrayBuffer());this.ambienceBuffers.set(kind,buffer);
      if(kind==='water'||kind==='crowd'){
        const layer=this.layers[kind],ctx=this.context,source=ctx.createBufferSource(),fade=ctx.createGain(),old=layer.source;
        source.buffer=buffer;source.loop=true;fade.gain.value=0;source.connect(fade).connect(layer.filter);source.start();
        this.ramp(fade.gain,1,3);this.ramp(layer.fallback.gain,0,3);old.stop(ctx.currentTime+3.5);
        old.onended=()=>{old.disconnect();layer.fallback.disconnect();};
        layer.source=source;layer.recorded=true;layer.filter.type='lowpass';layer.filter.frequency.value=kind==='crowd'?2400:3800;
      }
    }));return this.ambienceReady;
  },
  recordedEffect(kind,level){
    const buffer=this.ambienceBuffers.get(kind);if(!buffer)return null;
    const ctx=this.context,source=ctx.createBufferSource(),gain=ctx.createGain(),pan=ctx.createStereoPanner(),now=ctx.currentTime;
    const duration=Math.min(buffer.duration,kind==='bird'?7:kind==='work'?6:8),offset=Math.max(0,(buffer.duration-duration)*this.random());
    source.buffer=buffer;source.playbackRate.value=.96+this.random()*.08;pan.pan.value=(this.random()-.5)*1.2;
    const length=duration/source.playbackRate.value,gull=kind==='gull'||kind==='gull2';
    // Brief calls need their attack and tail intact; the recordings are quieter than the water bed.
    if(gull)level*=2.2;
    const attack=gull?.018:.15,release=gull?.08:.4;
    gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(level,now+Math.min(attack,length/4));
    gain.gain.setValueAtTime(level,now+Math.max(.2,length-release));gain.gain.linearRampToValueAtTime(0,now+length);
    source.connect(gain).connect(pan).connect(this.ambience);source.start(now,offset,duration);
    source.onended=()=>{source.disconnect();gain.disconnect();pan.disconnect();};return source;
  },
  ambiencePlan(p){
    return {
      birds:{enabled:!p.night&&!p.rain,kinds:['bird'],min:p.nature?10:24,max:p.nature?30:42,level:p.nature?.55:.32},
      gulls:{enabled:p.seabirds&&(!p.night||p.evening),kinds:['gull','gull2'],min:p.harbour?(p.evening?18:9):25,max:p.harbour?(p.evening?35:19):45,level:(p.harbour?.9:.5)*(p.rain?.65:p.evening?.8:1)},
      city:{enabled:!p.night&&!p.nature,kinds:p.craft?['hammer','work','door']:['hooves','door','horse','work'],min:p.market?12:19,max:p.market?25:38,level:p.rain?.26:.46},
      port:{enabled:p.harbour,kinds:p.evening?['door','creak']:p.night?['creak']:['cargo','creak','hammer'],min:p.evening?24:p.night?35:13,max:p.evening?46:p.night?65:29,level:p.evening?.30:p.night?.23:.52},
      night:{enabled:p.night&&!p.rain,kinds:['cricket'],min:28,max:55,level:.22},
    };
  },
  ambienceEvents(profile,now){
    if(profile.harbour&&!this.ambienceWasHarbour)delete this.ambienceDeadlines.gulls;
    this.ambienceWasHarbour=profile.harbour;
    for(const [group,plan] of Object.entries(this.ambiencePlan(profile))){
      if(!plan.enabled){delete this.ambienceDeadlines[group];continue;}
      if(this.ambienceDeadlines[group]===undefined){this.ambienceDeadlines[group]=now+(group==='gulls'?(profile.harbour?1:4):3)+this.random()*(group==='gulls'?(profile.harbour?2:4):9);continue;}
      if(now<this.ambienceDeadlines[group])continue;
      const choices=plan.kinds.filter(k=>k!==this.ambienceLast[group]),pool=choices.length?choices:plan.kinds;
      const kind=pool[Math.floor(this.random()*pool.length)],played=this.effect(kind,plan.level*(.8+this.random()*.35));
      if(!played){this.ambienceDeadlines[group]=now+2;continue;}
      this.ambienceLast[group]=kind;this.ambienceDeadlines[group]=now+plan.min+this.random()*(plan.max-plan.min);
    }
  },
});

Object.assign(HK.I18N.de,{audioFieldCredits:'Geräusche: Wasser von RandomMind, Vögel von isaiah658 und Marktmurmeln von Breviceps (CC0); RPG Sound Package von',audioSources:'Alle Quellen & Bearbeitungen'});
Object.assign(HK.I18N.en,{audioFieldCredits:'Sounds: water by RandomMind, birds by isaiah658 and market murmur by Breviceps (CC0); RPG Sound Package by',audioSources:'All sources & edits'});
