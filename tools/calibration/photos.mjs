import fs from 'fs';
import {analysePixels,buildPatch,PRETTY} from './core.js';
const data=JSON.parse(fs.readFileSync('photos.json'));
const BN=["shadows","midtones","highlights"];
for(const [name,arr] of Object.entries(data)){
  const f=analysePixels(new Uint8ClampedArray(arr),128,128);
  const p=buildPatch(f);
  console.log("\n════ "+name.toUpperCase()+" ════");
  console.log("  CHORD   "+p.rootName+" "+p.quality+"   ("+p.layers.length+" layer"+(p.layers.length>1?"s":"")+")");
  console.log("  notes   "+p.layers.flatMap(l=>l.notes).map(m=>PRETTY[m%12]+(Math.floor(m/12)-1)).join(" "));
  console.log("  raw     light "+f.light.toFixed(2)+"  sat "+f.sat.toFixed(2)+"  contrast "+f.contrast.toFixed(2)+
              "  warmth "+f.warmth.toFixed(2));
  console.log("          dominance "+f.dominance.toFixed(2)+"  2nd-hue "+f.hue2Share.toFixed(2)+
              "  entropy "+f.entropy.toFixed(2)+"  edges "+f.density.toFixed(2));
  console.log("          sharp "+f.sharp.toFixed(2)+"  grain "+f.grain.toFixed(2)+"  depth "+f.depth.toFixed(2)+
              "  periodicity "+f.periodStrength.toFixed(2)+" @ "+(f.period*128).toFixed(0)+"px");
  p.layers.forEach(l=>console.log("  layer   "+BN[l.band].padEnd(10)+PRETTY[l.pc].padEnd(3)+
    "oct"+l.octave+"  "+String(l.notes.length)+" notes  "+
    String(Math.round(l.cutoff)).padStart(4)+"Hz  Q"+l.q.toFixed(1)+
    "  cover "+String(Math.round(l.coverage*100)).padStart(2)+"%  gain "+l.gain.toFixed(2)+
    "  pan "+l.pan.toFixed(2)+"  "+l.wave));
  console.log("  fx      detune "+p.layers[0].detune.toFixed(1)+"c   delay "+Math.round(p.fx.delayTime*1000)+
    "ms @"+Math.round(p.fx.delayMix*100)+"%  fb "+Math.round(p.fx.delayFeedback*100)+"%");
  console.log("          reverb "+Math.round(p.fx.wet*100)+"%  predelay "+Math.round(p.fx.preDelay*1000)+
    "ms  chorus "+(p.fx.chorusDepth*1000).toFixed(2)+"ms @"+p.fx.chorusRate.toFixed(2)+"Hz  air "+p.fx.air.toFixed(3));
  console.log("          breath "+(1/p.layers[0].lfoRate).toFixed(0)+"s");
}
