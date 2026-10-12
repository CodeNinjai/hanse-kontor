'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
module.exports=function(seed=419){
 const math=Object.create(Math);math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const ctx=vm.createContext({console,Intl,Math:math,Date,JSON});
 const index=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').split('<script src="js/audio-synth')[0];
 for(const [,file] of index.matchAll(/<script src="(js\/[^"?]+\.js)(?:\?[^" ]*)?"><\/script>/g))vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx,{filename:file});
 return vm.runInContext('HK',ctx);
};
