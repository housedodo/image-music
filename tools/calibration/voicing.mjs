import fs from 'fs';
import {analysePixels,buildPatch} from './core.js';
const corpus=JSON.parse(fs.readFileSync('corpus.json'));
const N=['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
/* musically correct roughness rule: a semitone or whole tone anywhere below
   MIDI 60 beats; a third is only a problem below MIDI 48 */
let bad=0, dupes=0, maxDet=0; const rows=[];
for(const [k,a] of Object.entries(corpus)){
  const p=buildPatch(analysePixels(new Uint8ClampedArray(a),128,128));
  const all=p.layers.flatMap(l=>l.notes).sort((x,y)=>x-y);
  if(new Set(all).size!==all.length) dupes++;
  const faults=[];
  for(let i=1;i<all.length;i++){
    const lo=all[i-1], gap=all[i]-lo;
    if(lo<60 && gap<3) faults.push(lo+"+"+gap);
    else if(lo<48 && gap<4) faults.push(lo+"+"+gap);
  }
  if(faults.length) bad++;
  p.layers.forEach(l=>{ if(l.detune>maxDet) maxDet=l.detune; });
  rows.push([k,p.rootName+" "+p.quality,p.mood,p.layers.map(l=>l.wave).join("/"),
    faults.length?faults.join(","):"clean",
    (p.fx.air*1000).toFixed(1)]);
}
console.log("photo             chord         mood        waves               roughness  air");
rows.sort((a,b)=>a[2].localeCompare(b[2])).forEach(r=>console.log("  "+r[0].padEnd(16),r[1].padEnd(13),
  r[2].padEnd(11),r[3].padEnd(20),r[4].padEnd(10),r[5]));
console.log("\n  duplicate pitches:",dupes,"   photos with rough low intervals:",bad,"/",rows.length);
console.log("  max detune across corpus:",maxDet.toFixed(1)+"c  (was 17.4c)");
