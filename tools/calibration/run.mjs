import {analysePixels,buildPatch} from './core.js';
import {SCENES} from './gen.mjs';
const chords=new Set(), roots=new Set(), quals=new Set(); const rows=[];
for(const [name,d] of Object.entries(SCENES)){
  const f=analysePixels(d,128,128), p=buildPatch(f), chord=p.rootName+" "+p.quality;
  chords.add(chord); roots.add(p.rootName); quals.add(p.quality);
  rows.push([name,chord,p.layers.length]);
}
rows.forEach(r=>console.log("  "+r[0].padEnd(21),r[1].padEnd(13),r[2]+" layer(s)"));
console.log("\n  distinct chords:",chords.size,"/",rows.length," roots:",roots.size," qualities:",quals.size);
console.log("  qualities:",[...quals].join(", "));
