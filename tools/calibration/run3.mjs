import {analysePixels,buildPatch,PRETTY,calib} from './core.js';
import {S} from './gen2.mjs';
const F={}; for(const [k,d] of Object.entries(S)) F[k]=analysePixels(d,128,128);

console.log("DETAIL FEATURES");
console.log("  scene            period  strength  grain  depth  dominance  hue2share");
for(const [k,f] of Object.entries(F))
  console.log("  "+k.padEnd(16),f.period.toFixed(3).padStart(6),f.periodStrength.toFixed(3).padStart(8),
    f.grain.toFixed(3).padStart(6),f.depth.toFixed(3).padStart(6),f.dominance.toFixed(3).padStart(10),
    f.hue2Share.toFixed(3).padStart(10));

console.log("\nDELAY — does a repeating picture give a repeating echo?");
for(const k of ["fence","fence shuffled","beige room"]){
  const p=buildPatch(F[k]);
  console.log("  "+k.padEnd(16),Math.round(p.fx.delayTime*1000)+"ms  feedback",
    (p.fx.delayFeedback*100).toFixed(0)+"%  mix",(p.fx.delayMix*100).toFixed(0)+"%");
}
console.log("\nDOMINANCE — one colour vs two");
for(const k of ["pure teal","teal + orange"]){
  const p=buildPatch(F[k]), l=p.layers[0];
  console.log("  "+k.padEnd(16),(p.rootName+" "+p.quality).padEnd(12),"notes",l.notes.length,
    " detune",l.detune.toFixed(1)+"c  dominance",l.dom.toFixed(2),
    " 2nd colour tone:",l.second?PRETTY[l.second%12]:"none");
}
console.log("\nLAYERING — one photo, then stacking more");
for(const set of [["beige room"],["beige room","red door"],["beige room","red door","night window"],
                  ["beige room","red door","night window","green hedge"]]){
  const p=buildPatch(F[set[0]]);
  const notes=p.layers.flatMap(l=>l.notes);
  console.log("  "+String(set.length)+" photo(s): "+(p.rootName+" "+p.quality).padEnd(11),
    "layers",p.layers.length," notes",String(notes.length).padStart(2),
    " pitches",[...new Set(notes.map(m=>PRETTY[m%12]))].join(","),
    " delay",Math.round(p.fx.delayTime*1000)+"ms");
  p.layers.forEach((l,i)=>console.log("      layer"+i,"oct"+l.octave,PRETTY[l.pc].padEnd(2),
    "cut",String(Math.round(l.cutoff)).padStart(4)+"Hz","pan",l.pan.toFixed(2),"gain",l.gain.toFixed(2)));
}
