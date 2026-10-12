/* Original Sundhaven score and small acoustic instruments. No game RNG or third-party samples. */
'use strict';
HK.SoundSynth = {
  random(seed=1372) { let value=seed; return ()=>((value=(Math.imul(value,1664525)+1013904223)>>>0)/4294967296); },
  frequency(midi) { return 440*2**((midi-69)/12); },
  composition(kind) {
    const night=kind==='night', harbour=kind==='harbour', beat=night?1.12:harbour?.72:.82, meter=harbour?6:4, bars=harbour?16:24;
    const chords=[[50,57,62,65],[48,55,60,64],[43,55,59,62],[45,57,60,64]], score=[], random=this.random(night?932:harbour?751:401);
    const phrases=night?[[69,67,65,64],[62,64,65,69],[67,65,64,62],[60,62,64,62]]:harbour?[[69,69,67,65,64,62],[64,65,67,69,67,64],[67,71,69,67,65,64],[64,65,64,62,60,62]]:[[62,65,69,67],[64,67,72,71],[67,69,71,69],[65,64,62,60],[69,72,74,72],[67,65,64,67],[71,69,67,65],[64,65,64,62]];
    const add=(voice,midi,time,duration,amp,pan)=>score.push({voice,midi,time,duration,amp,pan});
    for(let bar=0;bar<bars;bar++) {
      const t=bar*meter*beat, chord=chords[Math.floor(bar/2)%4], phrase=phrases[bar%phrases.length];
      add('string',chord[0]-12,t,meter*beat*.86,night?.1:.13,-.2);
      for(let step=0;step<meter;step++) {
        if(night&&step%2)continue;
        const note=chord[1+step%3];add('string',note,t+step*beat+.025*random(),beat*(night?2.6:1.65),night?.09:.15,(step%2?1:-1)*.28);
      }
      if(bar%8!==7)for(let n=0;n<phrase.length;n++) {
        if(night&&(n===1||n===3))continue;
        const space=meter/phrase.length*beat, offset=bar>=16&&!night&&n===2?12:0;
        add('flute',phrase[n]+offset,t+n*space+.09,space*(night?1.55:.83),night?.1:.135,.12);
      }
      if(!night&&bar%4===2)add('string',chord[3]+12,t+meter*beat*.5,beat*2,.045,.4);
    }
    return {kind,duration:bars*meter*beat,score};
  },
  reverb(ctx,destination,seconds=1.65) {
    const impulse=ctx.createBuffer(2,Math.ceil(ctx.sampleRate*seconds),ctx.sampleRate), random=this.random(782);
    for(let channel=0;channel<2;channel++) {const data=impulse.getChannelData(channel);for(let i=0;i<data.length;i++)data[i]=(random()*2-1)*Math.exp(-i/(ctx.sampleRate*.29))*.24;}
    const verb=ctx.createConvolver(),wet=ctx.createGain();verb.buffer=impulse;wet.gain.value=.19;verb.connect(wet).connect(destination);return verb;
  },
  note(ctx,destination,note,time,wet=null) {
    const frequency=this.frequency(note.midi), envelope=ctx.createGain(), pan=ctx.createStereoPanner(), tone=ctx.createOscillator(), filter=ctx.createBiquadFilter();
    const flute=note.voice==='flute', duration=note.duration, real=new Float32Array(10), imaginary=new Float32Array(10);
    for(let i=1;i<10;i++)imaginary[i]=flute?(i===1?1:i===2?.18:i===3?.075:0):1/i**1.8;
    tone.setPeriodicWave(ctx.createPeriodicWave(real,imaginary));tone.frequency.value=frequency;
    filter.type='lowpass';filter.frequency.value=flute?2900:2400;filter.Q.value=.45;pan.pan.value=note.pan||0;
    envelope.gain.setValueAtTime(0,time);envelope.gain.linearRampToValueAtTime(note.amp,time+(flute?.075:.008));
    if(flute) {envelope.gain.setValueAtTime(note.amp*.86,time+Math.max(.08,duration-.14));envelope.gain.linearRampToValueAtTime(0,time+duration+.18);}
    else {envelope.gain.exponentialRampToValueAtTime(.0001,time+Math.max(.12,duration));envelope.gain.linearRampToValueAtTime(0,time+duration+.06);}
    tone.connect(filter).connect(envelope).connect(pan).connect(destination);if(wet)pan.connect(wet);
    let vibrato;
    if(flute) {vibrato=ctx.createOscillator();const depth=ctx.createGain();vibrato.frequency.value=4.8;depth.gain.value=3.5;vibrato.connect(depth).connect(tone.detune);vibrato.start(time);vibrato.stop(time+duration+.2);vibrato.onended=()=>{vibrato.disconnect();depth.disconnect();};}
    tone.start(time);tone.stop(time+duration+.2);
    tone.onended=()=>{tone.disconnect();filter.disconnect();envelope.disconnect();pan.disconnect();};
    return tone;
  },
  ambientBuffer(ctx,kind) {
    if(kind==='rain')return this.rainBuffer(ctx);
    const length=Math.ceil(ctx.sampleRate*12), buffer=ctx.createBuffer(1,length,ctx.sampleRate), data=buffer.getChannelData(0), random=this.random({water:301,wind:402,rain:503,crowd:604}[kind]);
    let smooth=0;
    for(let i=0;i<length;i++) {
      const t=i/ctx.sampleRate, noise=random()*2-1, cycle=2*Math.PI*i/length;
      smooth=smooth*.94+noise*.06;
      data[i]=kind==='water'?(smooth*2.4+noise*.1)*.72:
        kind==='wind'?smooth*2*(.7+.3*Math.sin(cycle*2)):
        kind==='crowd'?0:
        noise*(.64+.09*Math.sin(cycle*4));
    }
    return buffer;
  },
  rainBuffer(ctx) {
    // A quiet bed of rain with separate soft impacts on leaves and timber.
    // Baked once, with no repeating swell or per-drop runtime audio nodes.
    const rate=Math.min(ctx.sampleRate,24000),length=rate*36,fade=Math.round(rate*.4),buffer=ctx.createBuffer(2,length,rate);
    for(let channel=0;channel<2;channel++){
      const random=this.random(503+channel*971),data=buffer.getChannelData(channel),bed=new Float32Array(length+fade);
      let soft=0;
      for(let i=0;i<bed.length;i++){const white=random()*2-1;soft=soft*.93+white*.07;bed[i]=soft*.32+white*.012;}
      for(let i=0;i<length;i++){
        const blend=i<fade?i/fade:1;
        data[i]=i<fade?bed[length+i]*(1-blend)+bed[i]*blend:bed[i];
      }
      let at=Math.floor(random()*rate*.2);
      while(at<length){
        const duration=.025+random()*.065,count=Math.ceil(duration*rate),amp=.13+random()*.22,frequency=330+random()*570;
        let drop=0;
        for(let j=0;j<count;j++){
          const t=j/rate,u=j/count,envelope=(1-Math.exp(-t/.003))*Math.exp(-u*6)*(1-u);
          drop=drop*.68+(random()*2-1)*.32;
          data[(at+j)%length]+=amp*envelope*(drop+.12*Math.sin(2*Math.PI*frequency*t));
        }
        at+=Math.ceil(rate*(.045+random()*.16));
      }
    }
    return buffer;
  },
  effect(ctx,destination,kind,time=ctx.currentTime,pan=0,level=1) {
    const gain=ctx.createGain(), panner=ctx.createStereoPanner();gain.gain.value=level;panner.pan.value=pan;gain.connect(panner).connect(destination);
    const nodes=[], finish=time+(kind==='bell'?5.5:kind==='gull'?1.5:2.5);
    const tone=(frequency,end,amp,type='sine',delay=0)=>{
      const osc=ctx.createOscillator(),env=ctx.createGain(),start=time+delay;osc.type=type;osc.frequency.setValueAtTime(frequency,start);osc.frequency.exponentialRampToValueAtTime(end,start+.22);
      env.gain.setValueAtTime(0,start);env.gain.linearRampToValueAtTime(amp,start+.018);env.gain.exponentialRampToValueAtTime(.0001,start+(kind==='bell'?4.8:kind==='gull'?.53:.34));
      osc.connect(env).connect(gain);osc.start(start);osc.stop(finish);nodes.push(osc,env);
    };
    if(kind==='gull') {tone(1220,800,.06,'sine');tone(1550,1100,.035,'sine',.2);}
    else if(kind==='bird') {tone(2000,3200,.035,'sine');tone(2800,2100,.025,'sine',.22);}
    else if(kind==='cricket') for(let i=0;i<3;i++)tone(3500,3450,.018,'sine',i*.18);
    else if(kind==='bell') {tone(392,392,.1);tone(783,783,.037);tone(1058,1058,.016);}
    else if(kind==='hammer') {tone(640,560,.024,'triangle');tone(1310,1100,.012,'sine',.12);}
    else if(kind==='creak') {tone(160,85,.038,'triangle');tone(115,160,.025,'sine',.3);}
    else if(kind==='hooves') for(let i=0;i<4;i++)tone(i%2?96:124,75,.026,'triangle',i*.2);
    const timer=ctx.createOscillator(),silent=ctx.createGain();silent.gain.value=0;timer.connect(silent).connect(gain);timer.start(time);timer.stop(finish);
    timer.onended=()=>{for(const node of nodes)node.disconnect();timer.disconnect();silent.disconnect();gain.disconnect();panner.disconnect();};
    return timer;
  },
};
