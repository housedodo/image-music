import fs from 'fs';
import {analysePixels,buildPatch} from './core.js';
import {SCENES} from './gen.mjs';
const all={};
for(const [k,d] of Object.entries(SCENES)) all[k]=analysePixels(d,128,128);
const photos=JSON.parse(fs.readFileSync('photos.json'));
for(const [k,a] of Object.entries(photos)) all["PHOTO "+k]=analysePixels(new Uint8ClampedArray(a),128,128);
const q={}, rows=[];
for(const [k,f] of Object.entries(all)){
  const p=buildPatch(f);
  q[p.quality]=(q[p.quality]||0)+1;
  rows.push([k,p.rootName+" "+p.quality,p.affect.valence,p.affect.arousal,p.layers.length,
    Math.round(p.layers[0].cutoff),p.layers[0].wave]);
}
console.log("name                     chord         val  aro   L  cutoff  wave");
rows.sort((a,b)=>b[2]-a[2]).forEach(r=>console.log("  "+r[0].padEnd(22),r[1].padEnd(13),
  r[2].toFixed(2),r[3].toFixed(2),"  "+r[4],String(r[5]).padStart(5)+"Hz",r[6]));
console.log("\n  qualities used:",Object.keys(q).length,"->",JSON.stringify(q));
