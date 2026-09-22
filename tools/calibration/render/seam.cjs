const { chromium } = require(process.env.PLAYWRIGHT||'playwright');
const fs=require('fs');
const imgs=JSON.parse(fs.readFileSync(require('path').join(__dirname,'set.json')));
(async()=>{
  const browser=await chromium.launch();
  for(const tag of ['before','after']){
    const page=await browser.newPage();
    page.on('pageerror',e=>console.log('PAGE ERROR',e.message));
    await page.goto('file://'+require('path').join(__dirname,'t_'+tag+'.html'));
    await page.waitForFunction(()=>window.__pad);
    const r=await page.evaluate(async(src)=>{
      const P=window.__pad;
      const im=await new Promise(res=>{const i=new Image(); i.onload=()=>res(i); i.src=src;});
      const c=document.createElement('canvas'); c.width=128;c.height=128;
      const x=c.getContext('2d'); x.drawImage(im,0,0,128,128);
      const p=P.buildPatch(P.analysePixels(x.getImageData(0,0,128,128).data,128,128));
      const dur=P.loopSeconds(p), tail=0.6;
      const buf=await P.render(p,dur,tail,"loop");
      const [L]=P.seamless(buf,dur,tail);
      const sr=buf.sampleRate, n=L.length, w=Math.floor(0.5*sr);
      const rms=(a,b)=>{let e=0;for(let i=a;i<b;i++)e+=L[i]*L[i];return Math.sqrt(e/(b-a));};
      /* the loop plays end -> start: compare the half-second either side of the join,
         and the largest single-sample jump across it against typical sample steps */
      let typ=0; for(let i=1;i<n;i++) typ=Math.max(typ,Math.abs(L[i]-L[i-1]));
      return {dur, headVsTailDb:20*Math.log10(rms(0,w)/rms(n-w,n)),
              jump:Math.abs(L[0]-L[n-1]), maxStep:typ,
              first2sVsMiddleDb:20*Math.log10(rms(0,2*sr)/rms(Math.floor(n/2)-sr,Math.floor(n/2)+sr))};
    },imgs['pumpkin field']);
    console.log(tag.padEnd(7),'loop',r.dur.toFixed(1)+'s',
      '| level first 0.5s vs last 0.5s:',(r.headVsTailDb>=0?'+':'')+r.headVsTailDb.toFixed(2)+'dB',
      '| first 2s vs middle:',(r.first2sVsMiddleDb>=0?'+':'')+r.first2sVsMiddleDb.toFixed(2)+'dB',
      '| sample jump at join',r.jump.toFixed(4),'(largest normal step',r.maxStep.toFixed(4)+')');
    await page.close();
  }
  await browser.close();
})();
