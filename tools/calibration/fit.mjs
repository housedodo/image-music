import fs from 'fs';
import {analysePixels} from './core.js';
const corpus=JSON.parse(fs.readFileSync('corpus.json'));
const F={}; for(const [k,a] of Object.entries(corpus)) F[k]=analysePixels(new Uint8ClampedArray(a),128,128);
const KEYS=["light","sat","contrast","density","entropy","sharp","vspread","width","warmth","grain","depth","dominance"];
const q=(a,p)=>{const s=[...a].sort((x,y)=>x-y); return s[Math.min(s.length-1,Math.floor(p*(s.length-1)))];};
console.log("RAW FEATURE DISTRIBUTION OVER 18 REAL PHOTOGRAPHS\n");
console.log("feature     min    p25    median  p75    max    | current anchor -> fitted");
const CUR={light:[0.48,7.0],sat:[0.28,8.0],contrast:[0.40,6.0],density:[0.30,9.0],
  entropy:[0.28,9.0],sharp:[0.30,7.0],vspread:[0.30,7.0],width:[0.20,9.0],
  warmth:[0.55,6.0],grain:[0.13,13],depth:[0.10,12],dominance:[0.85,9.0]};
const fitted={};
for(const k of KEYS){
  const v=Object.values(F).map(f=>f[k]);
  const med=q(v,0.5), p10=q(v,0.10), p90=q(v,0.90);
  // slope so the 10th..90th percentile spans roughly 0.15..0.85
  const half=Math.max(0.02,(p90-p10)/2), kk=Math.min(20,Math.max(2.5,1.73/half));
  fitted[k]=[+med.toFixed(3),+kk.toFixed(1)];
  console.log("  "+k.padEnd(10),q(v,0).toFixed(3),q(v,0.25).toFixed(3),med.toFixed(3).padStart(6),
    q(v,0.75).toFixed(3),q(v,1).toFixed(3),"  | ["+CUR[k][0]+","+CUR[k][1]+"] -> ["+fitted[k][0]+","+fitted[k][1]+"]");
}
fs.writeFileSync('fitted.json',JSON.stringify(fitted,null,1));
console.log("\nfitted anchors written");
