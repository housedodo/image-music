import fs from 'fs';
import {analysePixels,calib} from './core.js';
import {SCENES} from './gen.mjs';
const all={};
for(const [k,d] of Object.entries(SCENES)) all[k]=analysePixels(d,128,128);
const photos=JSON.parse(fs.readFileSync('photos.json'));
for(const [k,a] of Object.entries(photos)) all["PHOTO "+k]=analysePixels(new Uint8ClampedArray(a),128,128);
const rows=[];
for(const [k,f] of Object.entries(all)){
  const c=calib(f);
  const val=0.45*c.light+0.22*c.sat+0.25*c.warmth+0.08*(1-c.density);
  const aro=0.38*c.contrast+0.30*c.density+0.20*c.sat+0.12*c.grain;
  rows.push({k,val,aro});
}
const med=a=>{const s=[...a].sort((x,y)=>x-y);return s[s.length>>1];};
const V=rows.map(r=>r.val), A=rows.map(r=>r.aro);
console.log("valence  median",med(V).toFixed(3)," min",Math.min(...V).toFixed(3)," max",Math.max(...V).toFixed(3));
console.log("arousal  median",med(A).toFixed(3)," min",Math.min(...A).toFixed(3)," max",Math.max(...A).toFixed(3));
// pick k so the observed min/max land near 0.1/0.9 after the logistic
const kFor=(arr,m)=>{const lo=Math.min(...arr),hi=Math.max(...arr);
  return Math.min(14, 2.2/Math.max(0.05,Math.min(m-lo,hi-m)));};
const kV=kFor(V,med(V)), kA=kFor(A,med(A));
console.log("suggested  kV",kV.toFixed(1)," kA",kA.toFixed(1));
const sig=(v,m,k)=>1/(1+Math.exp(-k*(v-m)));
console.log("\nname                     valence arousal  ->  vBand aroBand");
rows.sort((a,b)=>b.val-a.val).forEach(r=>{
  const ev=sig(r.val,med(V),kV), ea=sig(r.aro,med(A),kA);
  const vb=ev>0.62?"high":ev<0.38?"low":"mid", ab=ea>0.62?"energetic":ea<0.38?"calm":"mid";
  console.log("  "+r.k.padEnd(22),ev.toFixed(2),"   "+ea.toFixed(2),"    ",vb.padEnd(5),ab);
});
