import fs from 'fs';
import {analysePixels,calib} from './core.js';
const photos=JSON.parse(fs.readFileSync('photos.json'));
console.log("raw valence / arousal for the three real photographs:");
const V=[],A=[];
for(const [k,a] of Object.entries(photos)){
  const c=calib(analysePixels(new Uint8ClampedArray(a),128,128));
  const val=0.45*c.light+0.22*c.sat+0.25*c.warmth+0.08*(1-c.density);
  const aro=0.38*c.contrast+0.30*c.density+0.20*c.sat+0.12*c.grain;
  V.push(val);A.push(aro);
  console.log("  "+k.padEnd(14),"val",val.toFixed(3)," aro",aro.toFixed(3),
    " | c.light",c.light.toFixed(2),"c.sat",c.sat.toFixed(2),"c.warm",c.warmth.toFixed(2),
    "c.con",c.contrast.toFixed(2),"c.dens",c.density.toFixed(2));
}
const med=a=>[...a].sort((x,y)=>x-y)[a.length>>1];
console.log("\n  median val",med(V).toFixed(3),"  spread",(Math.max(...V)-Math.min(...V)).toFixed(3));
console.log("  median aro",med(A).toFixed(3),"  spread",(Math.max(...A)-Math.min(...A)).toFixed(3));
console.log("  suggested kV",(2.0/Math.max(0.04,(Math.max(...V)-Math.min(...V))/2)).toFixed(1),
            " kA",(2.0/Math.max(0.04,(Math.max(...A)-Math.min(...A))/2)).toFixed(1));
