const { chromium } = require(process.env.PLAYWRIGHT||'playwright');
const fs=require('fs');
const imgs=JSON.parse(fs.readFileSync(require('path').join(__dirname,'set.json')));
const page_=process.argv[2]||'after';
(async()=>{
  const browser=await chromium.launch();
  const page=await browser.newPage();
  page.on('pageerror',e=>console.log('PAGE ERROR',e.message));
  await page.goto('file://'+require('path').join(__dirname,'t_'+page_+'.html'));
  await page.waitForFunction(()=>window.__pad);
  const res=await page.evaluate(async(imgs)=>{
    const P=window.__pad, out={};
    for(const [name,src] of Object.entries(imgs)){
      const im=await new Promise(r=>{const i=new Image(); i.onload=()=>r(i); i.src=src;});
      const c=document.createElement('canvas'); c.width=128;c.height=128;
      const x=c.getContext('2d'); x.drawImage(im,0,0,128,128);
      const f=P.analysePixels(x.getImageData(0,0,128,128).data,128,128);
      const p=P.buildPatch(f);
      const buf=await P.render(p,8,0.6,"loop");
      const sr=buf.sampleRate, L=buf.getChannelData(0), R=buf.getChannelData(1), from=Math.floor(6*sr), to=L.length;
      let s2=0,pk=0; for(let i=from;i<to;i++){const v=(L[i]+R[i])/2; s2+=v*v; pk=Math.max(pk,Math.abs(L[i]),Math.abs(R[i]));}
      const N=8192, mag=new Float64Array(N/2);
      for(let st=from; st+N<=to; st+=N){
        const re=new Float64Array(N), im2=new Float64Array(N);
        for(let i=0;i<N;i++){ const w=0.5-0.5*Math.cos(2*Math.PI*i/(N-1)); re[i]=((L[st+i]+R[st+i])/2)*w; }
        for(let i=1,j=0;i<N;i++){ let b=N>>1; for(;j&b;b>>=1) j^=b; j^=b; if(i<j){[re[i],re[j]]=[re[j],re[i]];} }
        for(let len=2;len<=N;len<<=1){ const a=-2*Math.PI/len;
          for(let i=0;i<N;i+=len) for(let k=0;k<len/2;k++){
            const wr=Math.cos(a*k), wi=Math.sin(a*k), xr=re[i+k+len/2], xi=im2[i+k+len/2];
            const tr=xr*wr-xi*wi, ti=xr*wi+xi*wr;
            re[i+k+len/2]=re[i+k]-tr; im2[i+k+len/2]=im2[i+k]-ti; re[i+k]+=tr; im2[i+k]+=ti; } }
        for(let k=0;k<N/2;k++) mag[k]+=re[k]*re[k]+im2[k]*im2[k];
      }
      const band=(a,b)=>{let e=0; for(let k=Math.floor(a*N/sr);k<Math.floor(b*N/sr);k++) e+=mag[k]; return e;};
      const tot=band(20,20000); let cen=0; for(let k=0;k<N/2;k++) cen+=mag[k]*k*sr/N;
      let mx=0; for(let k=2;k<N/2-2;k++) mx=Math.max(mx,mag[k]);
      let peaks=0; for(let k=2;k<N/2-2;k++) if(mag[k]>mx*1e-3&&mag[k]>mag[k-1]&&mag[k]>mag[k+1]&&mag[k]>mag[k-2]&&mag[k]>mag[k+2]) peaks++;
      const seg=(a,b)=>{let e=0;for(let i=a;i<b;i++){e+=L[i]*L[i];} return Math.sqrt(e/(b-a));};
      out[name]={mood:p.mood, rms:20*Math.log10(Math.sqrt(s2/(to-from))), pk, cen:cen/tot, peaks,
        low:band(20,300)/tot, mid:band(300,2000)/tot, high:band(2000,20000)/tot,
        grow:20*Math.log10(seg(to-sr,to)/seg(from,from+sr))};
    }
    return out;
  },imgs);
  console.log('['+page_+']  photo           mood        RMS     peak  centroid  peaks  low/mid/high           grow');
  for(const [k,v] of Object.entries(res))
    console.log('   '+k.padEnd(15),v.mood.padEnd(10),v.rms.toFixed(1).padStart(6)+'dB',v.pk.toFixed(2).padStart(5),
      String(Math.round(v.cen)).padStart(6)+'Hz',String(v.peaks).padStart(5),'  ',
      (v.low*100).toFixed(0).padStart(3)+'% /'+(v.mid*100).toFixed(0).padStart(3)+'% /'+(v.high*100).toFixed(1).padStart(4)+'%',
      '  '+(v.grow>=0?'+':'')+v.grow.toFixed(1)+'dB');
  await browser.close();
})();
