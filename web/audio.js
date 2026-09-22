// Web Audio synthesis + sequencer.
// Kept strictly separate from the mapping so a MIDI exporter can consume the same events
// (ROADMAP.md, open question 4).

const midiToHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

function makeImpulse(ctx, seconds = 2.4, decay = 2.6) {
  const len = ctx.sampleRate * seconds;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

export class Engine {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = this.ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0.7;
    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = -14;
    this.comp.ratio.value = 6;
    this.master.connect(this.comp).connect(ctx.destination);

    this.dry = ctx.createGain();
    this.wet = ctx.createGain();
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = makeImpulse(ctx);
    this.dry.connect(this.master);
    this.wet.connect(this.reverb).connect(this.master);

    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 3000;
    this.filter.connect(this.dry);
    this.filter.connect(this.wet);

    this.voices = 0;
    this.polyphonyCap = 12;   // unbounded voices is the #1 killer of these projects
    this.noiseBuffer = makeImpulse(ctx, 1, 0);
  }

  setTone(p) {
    this.filter.frequency.setTargetAtTime(p.cutoff, this.ctx.currentTime, 0.2);
    this.wet.gain.setTargetAtTime(p.reverbWet, this.ctx.currentTime, 0.2);
    this.dry.gain.setTargetAtTime(1 - p.reverbWet * 0.5, this.ctx.currentTime, 0.2);
  }

  // env: {a, d, s, r} seconds; warmth picks saw (thick, warm) vs sine/triangle (airy, cool)
  note(midi, time, dur, velocity, warmth, pan = 0, detune = 0) {
    if (this.voices >= this.polyphonyCap) return;
    const ctx = this.ctx;
    this.voices++;

    const osc = ctx.createOscillator();
    osc.type = warmth > 0.6 ? 'sawtooth' : warmth > 0.35 ? 'triangle' : 'sine';
    osc.frequency.value = midiToHz(midi);
    osc.detune.value = detune;

    const gain = ctx.createGain();
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;

    const attack = 0.002 + (1 - warmth) * 0.03;
    const peak = Math.max(0.02, velocity) * 0.22;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(peak, time + attack);
    gain.gain.exponentialRampToValueAtTime(0.0005, time + Math.max(attack + 0.05, dur));

    osc.connect(gain).connect(panner).connect(this.filter);
    osc.start(time);
    osc.stop(time + dur + 0.1);
    osc.onended = () => { this.voices--; };
  }

  pad(midiNotes, time, dur, gain, warmth) {
    for (const m of midiNotes) {
      const osc = this.ctx.createOscillator();
      osc.type = warmth > 0.5 ? 'sawtooth' : 'sine';
      osc.frequency.value = midiToHz(m);
      osc.detune.value = (Math.random() - 0.5) * 8;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(gain * 0.09, time + 0.4);
      g.gain.setValueAtTime(gain * 0.09, time + dur - 0.6);
      g.gain.exponentialRampToValueAtTime(0.0005, time + dur);
      osc.connect(g).connect(this.filter);
      osc.start(time);
      osc.stop(time + dur + 0.1);
    }
  }

  noise(time, dur, gain) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3000 + Math.random() * 3000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain * 0.12, time);
    g.gain.exponentialRampToValueAtTime(0.0005, time + dur);
    src.connect(bp).connect(g).connect(this.filter);
    src.start(time);
    src.stop(time + dur);
  }
}

/**
 * Lookahead scheduler. Note timing comes from ctx.currentTime, never setTimeout
 * (ROADMAP.md, gotchas) -- setTimeout only decides when to *schedule*.
 */
export class Sequencer {
  constructor(engine, onStep) {
    this.engine = engine;
    this.onStep = onStep;
    this.lookahead = 0.12;
    this.interval = 25;
    this.running = false;
    this.step = 0;
    this.steps = 32;
  }
  start(getParams, getEvents) {
    if (this.running) return;
    this.running = true;
    this.getParams = getParams;
    this.getEvents = getEvents;
    this.nextTime = this.engine.ctx.currentTime + 0.1;
    this.step = 0;
    this.timer = setInterval(() => this.tick(), this.interval);
  }
  stop() {
    this.running = false;
    clearInterval(this.timer);
  }
  tick() {
    const ctx = this.engine.ctx;
    while (this.nextTime < ctx.currentTime + this.lookahead) {
      const p = this.getParams();
      if (!p) return;
      const stepDur = 60 / p.bpm / (p.subdivision / 4);
      this.schedule(p, this.getEvents(), this.nextTime, stepDur);
      this.nextTime += stepDur;
      this.step = (this.step + 1) % this.steps;
    }
  }
  schedule(p, events, time, stepDur) {
    const e = this.engine;
    const o = p.orient;

    // Chord / bass change on the bar, never mid-bar (CONCEPT.md §6).
    if (this.step === 0) {
      e.setTone(p);
      const chord = p.chord.map((d) => 12 * (p.octave + 1) + p.root + scaleAt(p.scale, d) + 12 * Math.floor(d / p.scale.length));
      e.pad(chord, time, stepDur * this.steps, 0.3 + o.horiz, p.warmth);
      e.note(12 * p.octave + p.root, time, stepDur * this.steps * 0.9, 0.9, 1, 0);   // the bass root
    }

    // Vertical edges -> onsets -> the grid voice, played staccato.
    const gridGain = 0.4 + o.vert;
    for (const ev of events) {
      if (ev.step !== this.step) continue;
      e.note(ev.midi, time, stepDur * (0.4 + o.horiz * 2.5), ev.velocity * gridGain, p.warmth, ev.pan);
    }

    // Diagonals -> arpeggio, direction following the image's dominant slope.
    if (o.diag > 0.25 && this.step % 2 === 0) {
      const i = p.slope > 0 ? this.step : this.steps - this.step;
      const deg = (i % (p.scale.length * 2));
      e.note(12 * (p.octave + 2) + p.root + scaleAt(p.scale, deg), time, stepDur * 0.8, o.diag, p.warmth, 0.3);
    }

    // Isotropic texture -> noise.
    if (p.noiseGain * o.iso > 0.12 && this.step % 4 === 2) {
      e.noise(time, stepDur * 0.5, p.noiseGain * o.iso);
    }

    if (this.onStep) this.onStep(this.step, time);
  }
}

function scaleAt(scale, degree) {
  const len = scale.length;
  return scale[((degree % len) + len) % len] + 12 * Math.floor(degree / len);
}
