// Image analysis: downsample, then extract the features MAPPING.md asks for.
// Everything runs on small canvases (see CONCEPT.md §6) so this stays microseconds.

export const GRID_COLS = 32;
export const GRID_ROWS = 16;
const EDGE_SIZE = 128;

function scaleTo(source, w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

const luma = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, max === 0 ? 0 : d / max, max];
}

// Circular mean of hue, weighted by saturation*value. A linear mean here is the classic
// bug: it makes red average to cyan (ROADMAP.md, gotchas).
function globalColour(img) {
  let sx = 0, sy = 0, wsum = 0, satSum = 0, satN = 0, vSum = 0, v2Sum = 0;
  let rSum = 0, bSum = 0;
  const d = img.data, n = d.length / 4;
  for (let i = 0; i < d.length; i += 4) {
    const [h, s, v] = rgbToHsv(d[i], d[i + 1], d[i + 2]);
    const w = s * v;
    sx += Math.cos(h * 2 * Math.PI) * w;
    sy += Math.sin(h * 2 * Math.PI) * w;
    wsum += w;
    if (v > 0.15) { satSum += s; satN++; }
    vSum += v; v2Sum += v * v;
    rSum += d[i]; bSum += d[i + 2];
  }
  const mean = vSum / n;
  let hue = wsum > 1e-6 ? Math.atan2(sy, sx) / (2 * Math.PI) : 0;
  if (hue < 0) hue += 1;
  return {
    hue,
    sat: satN ? satSum / satN : 0,
    val: mean,
    contrast: Math.sqrt(Math.max(0, v2Sum / n - mean * mean)) * 2,
    warmth: clamp01(((rSum - bSum) / (rSum + bSum + 1e-6)) * 2 + 0.5),
  };
}

const clamp01 = (x) => Math.min(1, Math.max(0, x));

// Sobel: total edge energy plus an orientation distribution.
// Vertical edges cut across time (onsets); horizontal edges run along it (sustains).
function edges(img) {
  const { width: w, height: h, data } = img;
  const g = new Float32Array(w * h);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) g[p] = luma(data[i], data[i + 1], data[i + 2]);

  let total = 0, vert = 0, horiz = 0, diagUp = 0, diagDown = 0, slopeSum = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const at = (dx, dy) => g[(y + dy) * w + (x + dx)];
      const gx = -at(-1, -1) - 2 * at(-1, 0) - at(-1, 1) + at(1, -1) + 2 * at(1, 0) + at(1, 1);
      const gy = -at(-1, -1) - 2 * at(0, -1) - at(1, -1) + at(-1, 1) + 2 * at(0, 1) + at(1, 1);
      const mag = Math.hypot(gx, gy);
      if (mag < 0.08) continue;
      total += mag;
      // gradient angle; a vertical *line* has a horizontal gradient.
      const a = Math.abs(Math.atan2(gy, gx)); // 0..PI
      if (a < Math.PI / 8 || a > 7 * Math.PI / 8) vert += mag;
      else if (a > 3 * Math.PI / 8 && a < 5 * Math.PI / 8) horiz += mag;
      else if (a < Math.PI / 2) { diagDown += mag; slopeSum -= mag; }
      else { diagUp += mag; slopeSum += mag; }
    }
  }
  const px = (w - 2) * (h - 2);
  const diag = diagUp + diagDown;
  const sum = vert + horiz + diag || 1;
  const density = clamp01((total / px) * 1.6);
  // Isotropic share: how evenly energy is spread over the three line types.
  const shares = [vert / sum, horiz / sum, diag / sum];
  const iso = clamp01(1 - (Math.max(...shares) - Math.min(...shares)) * 1.5);
  return {
    density,
    orient: { vert: shares[0], horiz: shares[1], diag: shares[2], iso },
    slope: Math.sign(slopeSum) || 1,
  };
}

// Shannon entropy over 8x8 luma-histogram tiles -> "texture", drives the noise layer.
function entropy(img) {
  const { width: w, height: h, data } = img;
  const tile = 8;
  let acc = 0, tiles = 0;
  for (let ty = 0; ty + tile <= h; ty += tile) {
    for (let tx = 0; tx + tile <= w; tx += tile) {
      const hist = new Uint8Array(16);
      for (let y = 0; y < tile; y++) {
        for (let x = 0; x < tile; x++) {
          const i = ((ty + y) * w + (tx + x)) * 4;
          hist[Math.min(15, (luma(data[i], data[i + 1], data[i + 2]) * 16) | 0)]++;
        }
      }
      let e = 0;
      for (const c of hist) { if (c) { const p = c / (tile * tile); e -= p * Math.log2(p); } }
      acc += e / 4; // normalise by log2(16)
      tiles++;
    }
  }
  return tiles ? clamp01(acc / tiles) : 0;
}

// Blur estimate: fraction of energy in high frequencies, via a cheap laplacian.
function sharpness(img) {
  const { width: w, height: h, data } = img;
  let acc = 0, n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const at = (dx, dy) => { const i = ((y + dy) * w + (x + dx)) * 4; return luma(data[i], data[i + 1], data[i + 2]); };
      acc += Math.abs(4 * at(0, 0) - at(-1, 0) - at(1, 0) - at(0, -1) - at(0, 1));
      n++;
    }
  }
  return clamp01((acc / n) * 6);
}

function grid(img) {
  const { width: w, data } = img;
  const cells = new Float32Array(GRID_COLS * GRID_ROWS);
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const i = (r * w + c) * 4;
      cells[r * GRID_COLS + c] = luma(data[i], data[i + 1], data[i + 2]);
    }
  }
  return cells;
}

/** Analyse an image/video/canvas source into the feature object mapping.js consumes. */
export function analyse(source) {
  const small = scaleTo(source, GRID_COLS, GRID_ROWS);
  const mid = scaleTo(source, EDGE_SIZE, EDGE_SIZE);
  const colour = globalColour(mid);
  const e = edges(mid);
  return {
    ...colour,
    edgeDensity: e.density,
    orient: e.orient,
    slope: e.slope,
    entropy: entropy(mid),
    sharpness: sharpness(mid),
    grid: grid(small),
  };
}
