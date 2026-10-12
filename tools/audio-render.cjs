/* NODE_PATH=/tmp/hanse-browser/node_modules node tools/audio-render.cjs
   Rebuilds the original score as portable MP3 files using native offline Web Audio and ffmpeg. */
'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const directory=path.join(__dirname,'..','assets','audio','procedural-archive');fs.mkdirSync(directory,{recursive:true});
function wave(data,sampleRate) {
 const samples=Buffer.from(data,'base64'),header=Buffer.alloc(44);header.write('RIFF');header.writeUInt32LE(36+samples.length,4);header.write('WAVEfmt ',8);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(2,22);header.writeUInt32LE(sampleRate,24);header.writeUInt32LE(sampleRate*4,28);header.writeUInt16LE(4,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(samples.length,40);return Buffer.concat([header,samples]);
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try {
  const page=await browser.newPage();await page.goto('about:blank');await page.evaluate(()=>globalThis.HK={});await page.addScriptTag({path:path.join(__dirname,'..','js','audio-synth.js')});
  const metadata={title:'Sundhaven – original game score',license:'Original procedural compositions for Hanse-Kontor; no third-party recordings or samples.',tracks:[]};
  for(const kind of ['market','harbour','night']) {
   const rendered=await page.evaluate(async kind=>{
    const S=HK.SoundSynth,composition=S.composition(kind),rate=22050,ctx=new OfflineAudioContext(2,Math.ceil((composition.duration*3+3)*rate),rate),master=ctx.createGain(),low=ctx.createBiquadFilter();
    master.gain.value=.54;low.type='lowpass';low.frequency.value=4200;master.connect(low).connect(ctx.destination);const wet=S.reverb(ctx,master);
    for(let repeat=0;repeat<3;repeat++)for(const note of composition.score)S.note(ctx,master,note,repeat*composition.duration+note.time,wet);
    const buffer=await ctx.startRendering(),length=Math.round(composition.duration*rate),from=length,channels=[buffer.getChannelData(0),buffer.getChannelData(1)],samples=new Int16Array(length*2);
    let peak=0,power=0;
    for(let i=0;i<length;i++)for(let channel=0;channel<2;channel++){const v=channels[channel][from+i];peak=Math.max(peak,Math.abs(v));power+=v*v;samples[i*2+channel]=Math.round(Math.max(-1,Math.min(1,v))*32767);}
    let binary='';const bytes=new Uint8Array(samples.buffer);for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
    return {data:btoa(binary),rate,duration:composition.duration,notes:composition.score.length,peak,rms:Math.sqrt(power/(length*2))};
   },kind);
   const temp=path.join('/tmp','sundhaven-score-'+kind+'.wav');fs.writeFileSync(temp,wave(rendered.data,rendered.rate));
   execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',temp,'-codec:a','libmp3lame','-q:a','4',path.join(directory,kind+'.mp3')]);
   const {data,...meta}=rendered;metadata.tracks.push({...meta,file:kind+'.mp3'});console.log(JSON.stringify({kind,...meta}));fs.unlinkSync(temp);
  }
  fs.writeFileSync(path.join(directory,'score.json'),JSON.stringify(metadata,null,2)+'\n');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
