import {analysePixels,buildPatch} from './core.js';
const N=128;
function mk(fn){const d=new Uint8ClampedArray(N*N*4);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const[r,g,b]=fn(x,y);const i=(y*N+x)*4;
  d[i]=r;d[i+1]=g;d[i+2]=b;d[i+3]=255;} return d;}
// crypto-quality-ish independent randomness, no LCG stride aliasing
const R=()=>Math.random();
// irregular bands: same colours and same coverage as the fence, no fixed spacing
const edges=[]; {let x=0; while(x<N){ x+=4+Math.floor(R()*22); edges.push(x);} }
const inBand=x=>{let c=0; for(const e of edges) if(x>=e) c++; return c%2===0;};
const cases={
  "fence (16px regular)": mk(x=>((x%16)<6?[42,38,34]:[196,200,206]).map(c=>c+(R()-.5)*10)),
  "bands, irregular":     mk(x=>(inBand(x)?[42,38,34]:[196,200,206]).map(c=>c+(R()-.5)*10)),
  "per-pixel noise":      mk(()=>{const g=R()>.6?40:198; return [g,g+2,g+6];}),
  "windows (32px grid)":  mk((x,y)=>((x%32)<14&&(y%32)<14?[240,226,170]:[38,36,40]).map(c=>c+(R()-.5)*8)),
};
console.log("control            periodStrength  delay      feedback  mix");
for(const [k,d] of Object.entries(cases)){
  const f=analysePixels(d,N,N), p=buildPatch(f);
  console.log("  "+k.padEnd(22),f.periodStrength.toFixed(3).padStart(5),
    "   "+String(Math.round(p.fx.delayTime*1000)+"ms").padStart(6),
    "   "+(p.fx.delayFeedback*100).toFixed(0).padStart(3)+"%",
    "   "+(p.fx.delayMix*100).toFixed(0).padStart(3)+"%",
    "  (period "+(f.period*N).toFixed(0)+"px)");
}
