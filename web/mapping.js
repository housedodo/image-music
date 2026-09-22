// Image features -> musical parameters. This file implements docs/MAPPING.md.
// If the two disagree, the doc is right and this is a bug.

import { GRID_COLS, GRID_ROWS } from './analysis.js';

// Circle of fifths as pitch classes, starting at C. Hue steps of 30 degrees walk it,
// so analogous colours give closely related keys and complements give a tritone.
const FIFTHS = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];

// Ordered bright -> dark, which is exactly the brightness ordering of the modes.
const MODES = [
  { name: 'Lydian',     steps: [0, 2, 4, 6, 7, 9, 11] },
  { name: 'Ionian',     steps: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'Mixolydian', steps: [0, 2, 4, 5, 7, 9, 10] },
  { name: 'Dorian',     steps: [0, 2, 3, 5, 7, 9, 10] },
  { name: 'Aeolian',    steps: [0, 2, 3, 5, 7, 8, 10] },
  { name: 'Phrygian',   steps: [0, 1, 3, 5, 7, 8, 10] },
  { name: 'Locrian',    steps: [0, 1, 3, 5, 6, 8, 10] },
];

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const clamp01 = (x) => Math.min(1, Math.max(0, x));

function chordDegrees(sat) {
  if (sat < 0.15) return [0, 4];            // bare fifths: washed out, ambiguous
  if (sat < 0.35) return [0, 2, 4];         // triad
  if (sat < 0.60) return [0, 2, 4, 6];      // seventh
  if (sat < 0.80) return [0, 2, 4, 6, 8];   // ninth
  return [0, 2, 4, 6, 8, 10];               // neon: add tensions
}

/** Smooths continuous features and gates structural ones so the key stops flickering. */
export class FeatureSmoother {
  constructor(alpha = 0.15, hysteresis = 0.08) {
    this.alpha = alpha; this.hysteresis = hysteresis;
    this.state = {}; this.held = {}; this.pending = {};
  }
  smooth(key, value) {
    const prev = this.state[key];
    return (this.state[key] = prev === undefined ? value : prev + this.alpha * (value - prev));
  }
  // Only lets a structural feature move once it has moved meaningfully AND stayed moved.
  gate(key, value) {
    if (this.held[key] === undefined) return (this.held[key] = value);
    if (Math.abs(value - this.held[key]) < this.hysteresis) { this.pending[key] = 0; return this.held[key]; }
    this.pending[key] = (this.pending[key] || 0) + 1;
    if (this.pending[key] >= 2) { this.pending[key] = 0; this.held[key] = value; }
    return this.held[key];
  }
}

export function mapFeatures(f, smoother) {
  const s = (k, v) => smoother.smooth(k, v);
  const g = (k, v) => smoother.gate(k, v);

  const hue = g('hue', s('hue', f.hue));
  const val = g('val', s('val', f.val));
  const sat = s('sat', f.sat);
  const contrast = s('contrast', f.contrast);
  const density = g('density', s('density', f.edgeDensity));
  const entropy = s('entropy', f.entropy);
  const warmth = s('warmth', f.warmth);
  const sharpness = s('sharpness', f.sharpness);

  const root = FIFTHS[Math.round(hue * 12) % 12];
  const mode = MODES[Math.min(MODES.length - 1, Math.round((1 - val) * (MODES.length - 1)))];
  const octave = 2 + Math.round(val * 3);
  const bpm = Math.round((60 + 80 * density) / 4) * 4;
  const subdivision = [4, 8, 8, 16][Math.min(3, Math.floor(density * 4))];

  return {
    root, rootName: NOTE_NAMES[root], mode, scale: mode.steps, octave, bpm, subdivision,
    chord: chordDegrees(sat),
    velRange: 0.25 + 0.75 * clamp01(contrast),
    noiseGain: Math.pow(clamp01(entropy), 1.5),
    warmth,                                   // 0 = sine/airy/wet, 1 = saw/thick/dry
    reverbWet: clamp01(0.15 + (1 - sharpness) * 0.6),
    cutoff: 400 + Math.pow(sharpness, 1.5) * 6000,
    orient: f.orient,
    slope: f.slope,
    grid: f.grid,
    raw: { hue, sat, val, contrast, density, entropy, warmth, sharpness },
  };
}

/** MIDI note for a scale degree, where degree 0 is the lowest row of the grid. */
export function degreeToMidi(p, degree) {
  const len = p.scale.length;
  const oct = Math.floor(degree / len);
  return 12 * (p.octave + 1) + p.root + p.scale[((degree % len) + len) % len] + 12 * oct;
}

/**
 * Turn the grid into one bar of note events.
 * Per column we keep only the brightest `maxVoices` cells -- a fixed threshold gives you
 * either silence or mud, and this is what creates space (CONCEPT.md §5).
 */
export function gridToEvents(p, maxVoices = 3) {
  const events = [];
  for (let c = 0; c < GRID_COLS; c++) {
    const col = [];
    for (let r = 0; r < GRID_ROWS; r++) col.push({ r, v: p.grid[r * GRID_COLS + c] });
    col.sort((a, b) => b.v - a.v);
    const top = col.slice(0, maxVoices).filter((x) => x.v > 0.12);
    if (!top.length) continue;
    const loudest = top[0].v || 1;
    for (const cell of top) {
      const degree = GRID_ROWS - 1 - cell.r;   // bottom of image = lowest pitch
      events.push({
        step: c,
        midi: degreeToMidi(p, degree),
        velocity: 0.25 + p.velRange * (cell.v / loudest) * 0.75,
        pan: ((c / GRID_COLS) * 2 - 1) * 0.6,  // stereo follows the sweep
        row: cell.r, col: c,
      });
    }
  }
  return events;
}
