import {analysePixels,patchOf} from './core.js';
import {SCENES} from './gen.mjs';
const rows=[]; const chords=new Set(), roots=new Set(), quals=new Set();
for(const [name,d] of Object.entries(SCENES)){
  const f=analysePixels(d,128,128), p=patchOf(f), chord=p.rootName+" "+p.quality;
  chords.add(chord); roots.add(p.rootName); quals.add(p.quality);
  rows.push([name,chord,p.voices,p.grey?"grey":"col",f.colourfulness.toFixed(2),f.warmth.toFixed(2),
    p.c.light.toFixed(2),p.c.sat.toFixed(2),p.c.density.toFixed(2),p.c.entropy.toFixed(2)]);
}
console.log("scene                 chord          v  src  colf warm | calibrated: light sat  dens ent");
rows.forEach(r=>console.log(r[0].padEnd(21),r[1].padEnd(14),r[2],r[3],r[4].padStart(5),r[5].padStart(5),
  "|",r[6].padStart(15),r[7].padStart(4),r[8].padStart(4),r[9].padStart(4)));
console.log("\ndistinct chords:",chords.size,"/",rows.length," roots:",roots.size," qualities:",quals.size);
console.log("qualities:",[...quals].join(", "));
