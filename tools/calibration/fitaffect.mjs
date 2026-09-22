import fs from 'fs';
import {analysePixels,calib} from './core.js';
const corpus=JSON.parse(fs.readFileSync('corpus.json'));
const V=[],A=[],rows=[];
for(const [k,a] of Object.entries(corpus)){
  const c=calib(analysePixels(new Uint8ClampedArray(a),128,128));
  const val=0.45*c.light+0.22*c.sat+0.25*c.warmth+0.08*(1-c.density);
  const aro=0.38*c.contrast+0.30*c.density+0.20*c.sat+0.12*c.grain;
  V.push(val);A.push(aro);rows.push([k,val,aro]);
}
const q=(a,p)=>{const s=[...a].sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.floor(p*(s.length-1)))];};
const kf=(a)=>Math.min(20,Math.max(3,1.73/Math.max(0.02,(q(a,0.90)-q(a,0.10))/2)));
console.log("valence  p10",q(V,0.1).toFixed(3),"median",q(V,0.5).toFixed(3),"p90",q(V,0.9).toFixed(3),"-> mid",q(V,0.5).toFixed(3),"k",kf(V).toFixed(1));
console.log("arousal  p10",q(A,0.1).toFixed(3),"median",q(A,0.5).toFixed(3),"p90",q(A,0.9).toFixed(3),"-> mid",q(A,0.5).toFixed(3),"k",kf(A).toFixed(1));
fs.writeFileSync('affectfit.json',JSON.stringify({vMid:+q(V,0.5).toFixed(3),vK:+kf(V).toFixed(1),
  aMid:+q(A,0.5).toFixed(3),aK:+kf(A).toFixed(1)}));
