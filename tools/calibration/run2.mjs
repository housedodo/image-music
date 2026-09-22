import {analysePixels,patchOf} from './core.js';
import {SCENES,EXTREME} from './gen.mjs';
const all={...SCENES,...EXTREME}, seen=new Set(), roots=new Set(), quals=new Set();
console.log("EXTREMES");
for(const [n,d] of Object.entries(EXTREME)){
  const p=patchOf(analysePixels(d,128,128));
  console.log("  "+n.padEnd(15),(p.rootName+" "+p.quality).padEnd(13),"voices",p.voices,
    " cutoff",Math.round(p.cutoff)+"Hz  detune",p.detune.toFixed(1)+"c  breath",(1/p.lfoRate).toFixed(0)+"s");
}
for(const [n,d] of Object.entries(all)){
  const p=patchOf(analysePixels(d,128,128));
  seen.add(p.rootName+" "+p.quality+"/"+p.voices); roots.add(p.rootName); quals.add(p.quality);
}
console.log("\nACROSS ALL 17 (12 everyday + 5 extreme)");
console.log("  distinct chord+voicing:",seen.size,"/ 17   roots:",roots.size,"  qualities:",quals.size);
