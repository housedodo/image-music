# Mapping specification

The single source of truth. `web/mapping.js` implements this file; if they disagree, this
file is right and the code is a bug.

All features are normalised to `[0,1]` unless stated. All are smoothed (EMA α=0.15) before
use. Structural parameters are additionally quantised and hysteresis-gated.

## Level 0 — Global features → musical frame

| Feature | Extraction | Musical target | Rule |
|---|---|---|---|
| `hue` | circular mean of H, weighted by S·V | **key / root** | `fifthsIndex = round(hue*360 / 30) % 12`; root = circle-of-fifths[fifthsIndex] |
| `sat` | mean S over pixels with V>0.15 | **chord extension** | <0.15 → 5ths · <0.35 → triad · <0.6 → 7th · <0.8 → 9th · else → add #11 |
| `val` | mean V | **mode** | bright→dark: Lydian, Ionian, Mixolydian, Dorian, Aeolian, Phrygian, Locrian |
| `val` | as above | **register offset** | `octave = 2 + round(val*3)` |
| `contrast` | stdev of V | **dynamic range** | `velRange = 0.25 + 0.75*contrast` |
| `edgeDensity` | mean Sobel magnitude | **tempo**, **subdivision** | `bpm = quantise(60 + 80*edgeDensity, 4)`; subdivision 1/4→1/16 |
| `entropy` | Shannon entropy of local 8×8 luma histograms | **noise layer gain** | `noiseGain = entropy^1.5` |
| `warmth` | (R−B)/(R+B), remapped | **timbre** | 0 = sine + reverb + HPF · 1 = saw + LPF, dry |
| `blur` | high-freq energy ratio | **reverb wet / LPF cutoff** | blurrier → wetter, darker |

**Hysteresis:** key, mode and tempo only update when the driving feature moves by >0.08 and
holds for 2 consecutive analysis frames. Key and tempo apply at the next 4-bar phrase; chord
extension at the next bar.

## Level 1 — Grid → note events

Downsample to `COLS × ROWS` (default 32 × 16) in linear-light luma.

- **column `c`** → time step `c` of the bar loop (left→right)
- **row `r`** → scale degree, **bottom = lowest**: `degree = ROWS-1-r`
- **pitch** = `scale[degree % len] + 12*floor(degree/len) + rootMidi + 12*octave`
- **gate**: cell fires if `luma > columnThreshold(c)`, where `columnThreshold` is set so at
  most `maxVoices` (default 3) cells fire per column — take the top-N, not a fixed cut.
  This is what creates space; a fixed threshold gives either silence or mud.
- **velocity** = `0.25 + velRange * normalise(luma within column)`
- **duration** = from local horizontal edge run-length at that cell: a long horizontal run
  means the bright region continues → sustain through following steps.
- **pan** = `(c/COLS)*2 − 1`, narrowed to ±0.6. Stereo follows the sweep.

## Level 2 — Edge orientation → articulation

Sobel gives `gx, gy` per pixel. Bin `θ = atan2(gy,gx)` into 4 buckets weighted by magnitude,
normalise to a distribution `{vert, horiz, diag, iso}`.

| Dominant | Voice added | Envelope | Notes |
|---|---|---|---|
| `vert` | pluck / mallet | A 2ms, D 120ms | strongest → also drives the kick pattern |
| `horiz` | pad / drone | A 400ms, R 1200ms | plays the chord, not the grid |
| `diag` | arpeggio | A 5ms, D 200ms | direction = sign of mean slope: up-right → ascending |
| `iso` | noise / shaker | filtered white, short | gain = `iso * noiseGain` |

All four voices are always present; the distribution sets their **mix**, so a change in the
image crossfades the arrangement instead of hard-switching it.

## Level 3 — Regions → arrangement (optional, Renderer only)

k-means (k=4) over pixels in Lab space, with xy appended at low weight so clusters are
spatially coherent.

| Region property | Target |
|---|---|
| cluster size (fraction of pixels) | voice gain |
| mean y of cluster | register of that voice |
| cluster hue distance from global hue | detune / harmonic tension of that voice |
| cluster compactness | note length (compact = short, diffuse = sustained) |

## Level 4 — Form (Renderer only)

Read the image at three scales so structure exists at three time scales:

| Image scale | Musical scale |
|---|---|
| whole image | piece: key, tempo, timbre palette, overall arc |
| quadrants (2×2) | four 8-bar sections, in reading order TL→TR→BL→BR |
| cells | the bar-level note grid |

Arc: the section whose quadrant has the highest contrast becomes the climax — move it to
position 3 of 4 and build toward it.

## Determinism

Every random choice draws from a PRNG seeded with a 64-bit hash of the downsampled image.
The same photo must always produce the same piece.

## Constants worth tuning first

```
COLS=32  ROWS=16  maxVoicesPerColumn=3  polyphonyCap=12
emaAlpha=0.15    hysteresis=0.08       analysisHz=10
bpmRange=[60,140] bpmStep=4
```
