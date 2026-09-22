import fs from 'fs';
import {analysePixels,calib} from './core.js';
import {SCENES} from './gen.mjs';
const all={};
for(const [k,d] of Object.entries(SCENES)) all[k]=analysePixels(d,128,128);
const photos=JSON.parse(fs.readFileSync('photos.json'));
for(const [k,a] of Object.entries(photos)) all["PHOTO "+k]=analysePixels(new Uint8ClampedArray(a),128,128);
const sig=(v,m,k)=>1/(1+Math.exp(-k*(v-m)));
const rows=[];
for(const [k,f] of Object.entries(all)){
  const c=calib(f);
  const dark=(1-c.light)*(0.80+0.40*(1-c.warmth));
  const q=Math.max(0,Math.min(6,Math.round(sig(dark,0.49,9.5)*6)));
  rows.push({k,dark,q,light:c.light,sat:c.sat,warm:c.warmth,con:c.contrast,dens:c.density});
}
rows.sort((a,b)=>a.dark-b.dark);
console.log("name                     dark   ->q   c.light c.sat c.warm c.con c.dens");
rows.forEach(r=>console.log("  "+r.k.padEnd(22),r.dark.toFixed(3),"  "+r.q+"   ",
  r.light.toFixed(2),r.sat.toFixed(2).padStart(5),r.warm.toFixed(2).padStart(5),
  r.con.toFixed(2).padStart(5),r.dens.toFixed(2).padStart(5)));
const ds=rows.map(r=>r.dark).sort((a,b)=>a-b);
console.log("\n  dark  median",ds[ds.length>>1].toFixed(3)," min",ds[0].toFixed(3)," max",ds[ds.length-1].toFixed(3));
const hist={}; rows.forEach(r=>hist[r.q]=(hist[r.q]||0)+1);
console.log("  quality index histogram (0=brightest .. 6=darkest):",JSON.stringify(hist));
console.log("  => majors (0-2):",rows.filter(r=>r.q<=2).length,"  neutral (3):",rows.filter(r=>r.q===3).length,
            "  minors (4-6):",rows.filter(r=>r.q>=4).length);
