// Offline tuning of worldScores(): feed it features + image-model labels saved from the
// browser (worlds_feat.json: {name:{f,labels}}) and it prints which world each photo gets.
// The scoring body here is the one ported into web/pad.body.html.
import fs from 'fs'; import {calib,affect} from './core.js';
const S=fs.readFileSync('../../web/pad.body.html','utf8');
const rules=eval('(function(){'+S.slice(S.indexOf('var TAG_RULES'),S.indexOf('function see('))+';return TAG_RULES;})()');
const clamp=v=>Math.max(0,Math.min(1,v));
const d=JSON.parse(fs.readFileSync('worlds_feat.json'));
const FACE={'dark face':1,'night poster':1};
const TH=+(process.env.TH||0.1);
function scores(f,c,af,t){
  const q=f.cues, g=k=>q[k]||0, dark=clamp((0.30-f.light)/0.18), T=k=>t[k]?1:0;
  return {
    drift:  0.40+0.20*T('cat'),
    glass:  0.10+0.55*g('sparkle')*c.sharp+0.25*g('foliage')*c.sharp+0.25*T('flora'),
    tide:   0.08+0.60*g('water')+0.30*g('sky')*(1-g('snow'))-0.15*af.arousal+0.70*T('water'),
    choir:  0.02+0.22*g('skin')*(1-c.density)*(1-dark)+1.05*T('face'),
    pulse:  0.04+1.6*clamp(f.periodStrength-0.36)+0.90*g('lights')+0.10*af.arousal+0.40*T('city'),
    titan:  0.06+0.55*c.contrast*c.width+0.30*af.arousal*c.contrast+0.30*T('vast')*(1-T('water')),
    dust:   0.06+0.55*(1-c.sat)*(1-c.contrast)*(1-dark)+0.20*c.grain*(1-c.sat),
    abyss:  0.02+0.95*dark*(1-g('glow'))*(1-g('lights'))*(1-0.5*T('face'))*(1.2-0.8*f.warmth),
    ember:  0.02+1.30*g('glow')+0.60*dark*f.warmth+0.60*T('fire')+0.20*T('food')+0.15*T('cat')*f.warmth,
    aurora: 0.02+0.70*g('snow')*(1-f.warmth)+0.35*g('sky')*f.light*(1-c.sat)+0.60*T('winter')
  };
}
const cnt={};
for(const [k,v] of Object.entries(d)){
  const t={}; (v.labels||[]).forEach(l=>rules.forEach(([n,re])=>{ if(l.s>TH && re.test(l.n)) t[n]=1; })); if(FACE[k]) t.face=1;
  const c=calib(v.f), af=affect(c), sc=scores(v.f,c,af,t);
  const top=Object.entries(sc).sort((a,b)=>b[1]-a[1]);
  cnt[top[0][0]]=(cnt[top[0][0]]||0)+1;
  console.log(k.padEnd(18),top[0][0].padEnd(7),top.slice(0,3).map(([a,b])=>a+':'+b.toFixed(2)).join(' ').padEnd(36),Object.keys(t).join(','));
}
console.log(cnt);
