import { analyse, GRID_COLS, GRID_ROWS } from './analysis.js';
import { FeatureSmoother, mapFeatures, gridToEvents } from './mapping.js';
import { Engine, Sequencer } from './audio.js';

const el = (id) => document.getElementById(id);
const canvas = el('preview');
const ctx = canvas.getContext('2d');

let engine = null, seq = null, params = null, events = [], playhead = 0;
let source = null, video = null, liveTimer = null;
const smoother = new FeatureSmoother();

function draw() {
  if (!source) return;
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(source, 0, 0, w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 0, w, h);

  // Show which cells are firing -- this is the whole point of the explorer build.
  const cw = w / GRID_COLS, ch = h / GRID_ROWS;
  for (const ev of events) {
    ctx.fillStyle = ev.col === playhead ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.22)';
    ctx.fillRect(ev.col * cw + 1, ev.row * ch + 1, cw - 2, ch - 2);
  }
  ctx.fillStyle = 'rgba(120,220,255,0.8)';
  ctx.fillRect(playhead * cw, 0, 2, h);
}

function refresh() {
  if (!source) return;
  const f = analyse(source);
  params = mapFeatures(f, smoother);
  events = gridToEvents(params);
  el('readout').innerHTML = `
    <b>${params.rootName} ${params.mode.name}</b> · ${params.bpm} BPM · 1/${params.subdivision}
    · chord ${params.chord.length} notes · oct ${params.octave}<br>
    <span class="dim">
      hue ${params.raw.hue.toFixed(2)} · sat ${params.raw.sat.toFixed(2)} ·
      light ${params.raw.val.toFixed(2)} · contrast ${params.raw.contrast.toFixed(2)} ·
      edges ${params.raw.density.toFixed(2)} · texture ${params.raw.entropy.toFixed(2)} ·
      warmth ${params.raw.warmth.toFixed(2)} · sharp ${params.raw.sharpness.toFixed(2)}<br>
      lines: vert ${params.orient.vert.toFixed(2)} (hits) ·
      horiz ${params.orient.horiz.toFixed(2)} (pads) ·
      diag ${params.orient.diag.toFixed(2)} (arps) ·
      iso ${params.orient.iso.toFixed(2)} (noise)
    </span>`;
  draw();
}

function setSource(s) {
  source = s;
  const ar = (s.videoWidth || s.naturalWidth || s.width) / (s.videoHeight || s.naturalHeight || s.height);
  canvas.width = 640;
  canvas.height = Math.round(640 / (ar || 1.5));
  refresh();
}

el('file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => { stopCamera(); setSource(img); };
  img.src = URL.createObjectURL(file);
});

el('camera').addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video = document.createElement('video');
    video.srcObject = stream;
    video.playsInline = true;
    await video.play();
    setSource(video);
    // Analysis runs at ~10Hz, independent of the audio clock (CONCEPT.md §6).
    liveTimer = setInterval(refresh, 100);
  } catch (err) {
    el('readout').textContent = 'Camera unavailable: ' + err.message;
  }
});

function stopCamera() {
  if (liveTimer) { clearInterval(liveTimer); liveTimer = null; }
  if (video?.srcObject) video.srcObject.getTracks().forEach((t) => t.stop());
  video = null;
}

el('play').addEventListener('click', () => {
  if (!source) { el('readout').textContent = 'Load an image or start the camera first.'; return; }
  if (!engine) {
    // AudioContext must be created inside a gesture handler.
    engine = new Engine();
    seq = new Sequencer(engine, (step) => { playhead = step; draw(); });
  }
  engine.ctx.resume();
  if (seq.running) { seq.stop(); el('play').textContent = 'Play'; }
  else { seq.start(() => params, () => events); el('play').textContent = 'Stop'; }
});

el('volume').addEventListener('input', (e) => { if (engine) engine.master.gain.value = +e.target.value; });

// A default image so the page does something on first load.
const demo = new Image();
demo.onload = () => setSource(demo);
demo.src = 'demo.svg';
