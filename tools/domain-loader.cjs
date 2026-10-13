'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
// Lädt die DOM-freien Spielmodule in der Reihenfolge von index.html (alles vor
// audio-synth). Optionen: `scene` lädt einzelne spätere Module (z. B. 'scene',
// 'buildings') zusätzlich, ebenfalls in der Reihenfolge von index.html;
// `random` ersetzt den eingebauten Zufallsgenerator, wenn ein Test dessen
// Zustand selbst beobachten will.
module.exports=function(seed=419,{scene=[],random}={}){
 const math=Object.create(Math);math.random=random||(()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296));
 const ctx=vm.createContext({console,Intl,Math:math,Date,JSON});
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),cut=html.indexOf('<script src="js/audio-synth');
 const wanted=new Set(scene.map(name=>'js/'+name+'.js')),found=new Set();
 for(const m of html.matchAll(/<script src="(js\/[^"?]+\.js)(?:\?[^" ]*)?"><\/script>/g)){
  const file=m[1];if(m.index>cut&&!wanted.has(file))continue;
  if(m.index>cut)found.add(file);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx,{filename:file});
 }
 for(const file of wanted)if(!found.has(file))throw new Error('Nicht nach audio-synth in index.html eingebunden: '+file);
 return vm.runInContext('HK',ctx);
};
