import fs from 'fs';
import {analysePixels,buildPatch} from './core.js';
const c=JSON.parse(fs.readFileSync('corpus2.json'));
const rows=[]; const moods={};
for(const [k,a] of Object.entries(c)){
  const f=analysePixels(new Uint8ClampedArray(a),128,128);
  const p=buildPatch(f);
  moods[p.mood]=(moods[p.mood]||0)+1;
  rows.push([k,p.rootName+" "+p.quality,p.mood,p.affect.valence,
    f.plainLight,f.light,""]);
}
rows.sort((a,b)=>b[3]-a[3]);
console.log("photo             chord         mood       val  | light plain->sal | framed?");
rows.forEach(r=>console.log("  "+r[0].padEnd(16),r[1].padEnd(13),r[2].padEnd(10),
  r[3].toFixed(2),"|",r[4].toFixed(2)+"->"+r[5].toFixed(2),"     |",r[6]));
console.log("\n  moods used:",Object.keys(moods).length+"/9",JSON.stringify(moods));
