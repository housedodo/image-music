/* Synthetic "everyday phone photo" scenes: muted, mid-brightness, the boring
   middle of the distribution. Each returns RGBA bytes at 128x128. */
const N=128;
function mk(fn){
  const d=new Uint8ClampedArray(N*N*4);
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){
    const [r,g,b]=fn(x/N,y/N,x,y);
    const i=(y*N+x)*4; d[i]=r; d[i+1]=g; d[i+2]=b; d[i+3]=255;
  }
  return d;
}
const rnd=(s=>()=>((s=s*1103515245+12345&0x7fffffff)/0x7fffffff))(7);
const n=(a)=>(rnd()-0.5)*a;
export const SCENES={
 "beige living room":  mk((u,v)=>{const b=v<0.62?[214,203,186]:[150,126,101]; return [b[0]+n(14),b[1]+n(14),b[2]+n(14)];}),
 "grey pavement":      mk(()=>{const g=126+n(30); return [g,g+n(4),g+n(6)];}),
 "office desk":        mk((u,v)=>v<0.45?[236,236,232]:(u>0.55?[60,62,68]:[196,188,176]).map(c=>c+n(10))),
 "park, overcast":     mk((u,v)=>v<0.38?[196,199,203].map(c=>c+n(8)):[84,106,62].map(c=>c+n(26))),
 "kitchen counter":    mk((u,v)=>v<0.5?[224,219,208].map(c=>c+n(8)):[168,150,124].map(c=>c+n(18))),
 "street, cloudy":     mk((u,v)=>v<0.42?[188,192,198].map(c=>c+n(10)):[118,116,112].map(c=>c+n(24))),
 "cafe, indoor warm":  mk((u,v)=>[176+n(22),150+n(20),118+n(18)]),
 "white wall + plant": mk((u,v)=>(u>0.62&&v>0.4)?[74,112,66].map(c=>c+n(22)):[232,230,226].map(c=>c+n(7))),
 "bedroom, evening":   mk(()=>[96+n(18),86+n(16),80+n(16)]),
 "supermarket aisle":  mk((u,v)=>{const k=Math.floor(u*7)%3; return [[206,72,60],[220,206,90],[70,120,190]][k].map(c=>c*0.75+n(30));}),
 "blue sky + roof":    mk((u,v)=>v<0.55?[124,162,206].map(c=>c+n(12)):[128,96,84].map(c=>c+n(16))),
 "red mug on desk":    mk((u,v)=>(Math.hypot(u-0.5,v-0.55)<0.16)?[186,48,40].map(c=>c+n(14)):[206,200,190].map(c=>c+n(9))),
};
/* extremes, to confirm the logistic doesn't slam everything to the rails */
const rnd2=(s=>()=>((s=s*1103515245+12345&0x7fffffff)/0x7fffffff))(11);
const m=(a)=>(rnd2()-0.5)*a;
function mk2(fn){const d=new Uint8ClampedArray(128*128*4);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){const[r,g,b]=fn(x/128,y/128);const i=(y*128+x)*4;
  d[i]=r;d[i+1]=g;d[i+2]=b;d[i+3]=255;} return d;}
export const EXTREME={
 "night blue":   mk2(()=>[8+m(8),14+m(10),42+m(14)]),
 "noon white":   mk2(()=>[246+m(8),246+m(8),242+m(8)]),
 "neon magenta": mk2((u,v)=>Math.floor(u*9)%2?[236,20,160].map(c=>c+m(20)):[16,8,26].map(c=>c+m(12))),
 "forest green": mk2(()=>[28+m(26),78+m(34),30+m(24)]),
 "sunset orange":mk2((u,v)=>[236-v*60+m(16),128-v*40+m(16),52+m(14)]),
};
