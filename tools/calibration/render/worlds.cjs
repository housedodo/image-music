// Renders every photo in all ten worlds through the real graph and reports level, peak and
// A-weighted balance. SRV = folder holding the built index.html, SET = {name: dataURL} json.
// PHOTOS="a,b" picks photos. Usage: SET=set.json node worlds.cjs
const { chromium } = require('playwright');
const fs=require('fs'), path=require('path'), http=require('http');
const imgs=JSON.parse(fs.readFileSync(process.env.SET||'set.json'));
const pick=(process.env.PHOTOS||'cat in box,malta cliff,blue studio').split(',');
const srv=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);const f=path.join((process.env.SRV||'../../..'),u==='/'?'index.html':u);
  fs.readFile(f,(e,b)=>{ if(e){r.writeHead(404);r.end();return;} r.writeHead(200,{'content-type':'text/html'}); r.end(b);});}).listen(8766);
(async()=>{
  const b=await chromium.launch(); const p=await b.newPage(); const errs=[];
  p.on('pageerror',e=>errs.push(e.message));
  await p.route('https://**', r=>r.fulfill({status:404}));
  await p.goto('http://localhost:8766/index.html?test'); await p.waitForFunction(()=>window.__pad);
  for(const name of pick){
    const res=await p.evaluate(async({url,name})=>{
      const P=window.__pad; const img=new Image(); img.src=url; await img.decode();
      const fr=P.makeFrame((c,w,h)=>c.drawImage(img,0,0,w,h),name,img.naturalWidth,img.naturalHeight);
      const out=[];
      for(const w of P.WORLDS){
        const s=P.buildScene(fr.f,{},w.id);
        const buf=await P.render(s,24,2,"loop");
        const sr=buf.sampleRate, L=buf.getChannelData(0), R=buf.getChannelData(1);
        const from=Math.floor(8*sr), to=Math.floor(30*sr); let s2=0,pk=0,nan=0;
        for(let i=from;i<to;i++){ const v=(L[i]+R[i])/2; if(!isFinite(v)) nan++; s2+=v*v; pk=Math.max(pk,Math.abs(L[i]),Math.abs(R[i])); }
        // A-weighted centroid via coarse FFT over 4 windows
        const N=8192, mag=new Float64Array(N/2);
        for(let st=from; st+N<=to; st+=Math.floor((to-from-N)/4)){
          const re=new Float64Array(N), im=new Float64Array(N);
          for(let i=0;i<N;i++) re[i]=((L[st+i]+R[st+i])/2)*(0.5-0.5*Math.cos(2*Math.PI*i/(N-1)));
          for(let i=1,j=0;i<N;i++){ let bb=N>>1; for(;j&bb;bb>>=1) j^=bb; j^=bb; if(i<j){[re[i],re[j]]=[re[j],re[i]];} }
          for(let len=2;len<=N;len<<=1){ const a=-2*Math.PI/len; for(let i=0;i<N;i+=len) for(let k=0;k<len/2;k++){ const wr=Math.cos(a*k), wi=Math.sin(a*k);
            const xr=re[i+k+len/2], xi=im[i+k+len/2], tr=xr*wr-xi*wi, ti=xr*wi+xi*wr; re[i+k+len/2]=re[i+k]-tr; im[i+k+len/2]=im[i+k]-ti; re[i+k]+=tr; im[i+k]+=ti; } }
          for(let k=0;k<N/2;k++) mag[k]+=re[k]*re[k]+im[k]*im[k];
        }
        const Aw=f=>{const f2=f*f, r=(148693636*f2*f2)/((f2+424.36)*Math.sqrt((f2+11599.29)*(f2+544496.41))*(f2+148693636)); return Math.pow(10,(20*Math.log10(r)+2.0)/10);};
        let tot=0,cen=0,hi=0; for(let k=1;k<N/2;k++){ const f=k*sr/N, m=mag[k]*Aw(f); tot+=m; cen+=m*f; if(f>2000) hi+=m; }
        out.push({w:w.id, rms:20*Math.log10(Math.sqrt(s2/(to-from))+1e-9), pk, nan, cen:cen/tot, hi:hi/tot, prog:s.prog.map(x=>x.n).join('-')});
      }
      return out;
    },{url:imgs[name],name});
    console.log('\n'+name);
    res.forEach(r=>console.log('  '+r.w.padEnd(7),r.rms.toFixed(1).padStart(6)+'dB','peak',r.pk.toFixed(2),'A-centroid',Math.round(r.cen).toString().padStart(5)+'Hz','>2k',(r.hi*100).toFixed(0).padStart(3)+'%',r.nan?'NaN!':'',r.prog));
  }
  console.log('errors:',errs.length?errs:'none'); await b.close(); srv.close();
})();
