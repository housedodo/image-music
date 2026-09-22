import fs from 'fs';
import {analysePixels,buildPatch} from './core.js';
const corpus=JSON.parse(fs.readFileSync('corpus.json'));
const moods={}, quals={}, roots={}, rows=[];
for(const [k,a] of Object.entries(corpus)){
  const p=buildPatch(analysePixels(new Uint8ClampedArray(a),128,128));
  moods[p.mood]=(moods[p.mood]||0)+1; quals[p.quality]=(quals[p.quality]||0)+1;
  roots[p.rootName]=(roots[p.rootName]||0)+1;
  rows.push([k,p.rootName+" "+p.quality,p.mood,p.affect.valence,p.affect.arousal,
    p.layers.length,Math.round(p.layers[0].cutoff),p.layers[0].wave,
    Math.round(p.fx.delayMix*100),Math.round(p.fx.wet*100)]);
}
rows.sort((a,b)=>b[3]-a[3]);
console.log("photo             chord          mood        val  aro   L  cut   wave      dly  rev");
rows.forEach(r=>console.log("  "+r[0].padEnd(16),r[1].padEnd(14),r[2].padEnd(11),
  r[3].toFixed(2),r[4].toFixed(2),"  "+r[5],String(r[6]).padStart(4),r[7].padEnd(9),
  String(r[8]+"%").padStart(4),String(r[9]+"%").padStart(4)));
console.log("\n  moods     ",Object.keys(moods).length+"/9 ",JSON.stringify(moods));
console.log("  qualities ",Object.keys(quals).length+"/9 ",JSON.stringify(quals));
console.log("  roots     ",Object.keys(roots).length+"/12",Object.keys(roots).join(" "));
const uniq=new Set(rows.map(r=>r[1]+r[5]));
console.log("  distinct chord+layers:",uniq.size,"/",rows.length);
