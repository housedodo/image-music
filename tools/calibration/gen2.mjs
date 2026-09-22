const N=128;
const rnd=(s=>()=>((s=s*1103515245+12345&0x7fffffff)/0x7fffffff))(7);
const n=a=>(rnd()-0.5)*a;
function mk(fn){const d=new Uint8ClampedArray(N*N*4);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const[r,g,b]=fn(x/N,y/N,x,y);const i=(y*N+x)*4;
  d[i]=r;d[i+1]=g;d[i+2]=b;d[i+3]=255;} return d;}
export const S={
 "beige room":   mk((u,v)=>v<0.62?[214,203,186].map(c=>c+n(14)):[150,126,101].map(c=>c+n(14))),
 "red door":     mk((u,v)=>(u>0.3&&u<0.7)?[172,40,34].map(c=>c+n(14)):[198,194,186].map(c=>c+n(9))),
 "night window": mk(()=>[26+n(14),30+n(14),52+n(18)]),
 "green hedge":  mk(()=>[54+n(40),92+n(44),44+n(34)]),
 /* strongly periodic: eight vertical bands -> should find a clear delay time */
 "fence":        mk((u,v,x)=>((x%16)<6?[42,38,34]:[196,200,206]).map(c=>c+n(10))),
 /* same colours, no periodicity: the control for the delay mapping */
 "fence shuffled":mk((u,v,x)=>(rnd()>0.62?[42,38,34]:[196,200,206]).map(c=>c+n(10))),
 /* one hue only vs two strong hues: the control for dominance */
 "pure teal":    mk(()=>[30+n(10),140+n(16),140+n(16)]),
 "teal + orange":mk((u,v)=>(u<0.5?[30,140,140]:[210,120,30]).map(c=>c+n(16))),
};
