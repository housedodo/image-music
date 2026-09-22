# Pad mode

A reduction of `MAPPING.md`: **one image, one sustained pad.** No grid, no tempo, no note
events. The image specifies a chord and the exact texture it is made of, and holds it.

This is the recommended default mode. The sequencer in `MAPPING.md` remains valid, but it
asks the image to pretend it is a sequence; a pad lets it be what it is — a static field
with a colour, a density and a texture.

## Signal chain

```
6 voice slots ──┐
 (3 detuned     ├─► lowpass filter ──┬─► dry ──┐
  oscillators   │     ▲              └─► wet ──┴─► compressor ─► out
  each)         │     │                   └─► convolution reverb
high-passed ────┘   slow LFO
noise bed
```

One shared lowpass. One LFO on its cutoff. That LFO is the only movement in the patch and
the only surviving trace of rhythm.

## Mapping

| Feature | Extraction | Target | Rule |
|---|---|---|---|
| `hue` | circular mean of H weighted by S·V | **root** | `FIFTHS[round(hue*12) % 12]` — 30° of hue per step round the circle of fifths |
| `light` | mean luma | **chord quality** | bright→dark: maj7♯11, maj9, add9, sus2, min9, min7, min♭9 |
| `light` | as above | **register** | `octave = 2 + round(light*2)` |
| `sat` | mean S where V>0.15 | **voice count** | 2 (bare fifth) → 6 (full stack); grey is hollow, vivid is dense |
| `vspread` | stdev of per-row mean luma | **voicing** | >0.5 lifts the upper three notes an octave — open vs close voicing |
| `entropy` | Shannon entropy of 8×8 luma tiles | **detune** | 2¢ (glassy) → 18¢ (choral); rough surfaces sound rough |
| `light` | as above | **cutoff** | `300 * 23^(light^1.15)` Hz, i.e. 300 Hz → ~7 kHz |
| `contrast` | stdev of luma | **resonance + swell depth** | `Q = 0.6 + contrast*7`; LFO depth `0.25 + contrast*0.65` |
| `density` | mean Sobel magnitude | **LFO rate** | `0.025 + density*0.22` Hz — one cycle per 40 s → per 4.5 s |
| `sharp` | mean laplacian | **reverb wet** | blurrier → wetter and more distant |
| `width` | left/right saturation difference | **stereo width** | `0.25 + width*0.6` |
| `warmth` | (R−B)/(R+B) | **waveform** | sine → triangle → sawtooth |
| `entropy` | as above | **noise bed** | high-passed air layer, gain `entropy^1.6 * 0.012` |

## Voice slots, not note events

A fixed bank of six slots exists for the life of the AudioContext. Changing image does not
stop and restart notes — it retargets every slot's frequency, detune, gain and pan with
`setTargetAtTime`, so the pad **glides** from one patch to the next over ~2.6 s. Slots
above the new voice count fade to zero while still tracking pitch, so nothing clicks.

This is what makes camera input viable in pad mode: the analysis can re-read at 2 Hz and
the pad simply drifts. Under `MAPPING.md`'s sequencer the same input needed hysteresis
gating and phrase-boundary commits.

## Uniqueness

Ten measurements feed the patch; only two quantise (root, quality). The remaining eight are
continuous, so two unrelated photos landing on the same patch is vanishingly unlikely — the
UI prints the raw nine-value fingerprint so this is visible rather than claimed.

Determinism is unchanged from `MAPPING.md`: the same photo always yields the same pad. A
small change in angle moves the continuous parameters slightly and the quantised ones not
at all — and a pad that drifts a little is still the same pad, which is a tolerance a drone
has and a sequence does not.

## Capture on a phone

Two separate file inputs, because they mean different things on mobile and the same thing
on desktop:

- `<input type="file" accept="image/*" capture="environment">` — **Take photo**. On a phone
  this opens the rear camera directly; the shot comes back as a file. No `getUserMedia`
  permission prompt, no live preview to keep alive, and it works in every mobile browser.
- `<input type="file" accept="image/*">` — **Upload**. Opens the photo library.

`getUserMedia` is kept as a third option (**Live camera**) for the continuous case, where
the analysis re-reads at ~1.6 Hz and the pad glides between readings. It is the worst of
the three on a phone — it holds the camera open, drains battery, and needs a permission
grant — so it is not the default.

Layout below 780px collapses to one column and a fixed dock at the bottom holds Hold and
Export, padded with `env(safe-area-inset-bottom)`. Every control is at least 46px tall.

## Export

All rendering is offline via `OfflineAudioContext` at 44.1 kHz using the **same graph
builder** as live playback, so the export is exact rather than a recording of playback.

| File | What it is |
|---|---|
| `pad-loop.wav` | Seamless loop, 16-bit stereo |
| `pad-oneshot.wav` | 12 s, swells in and out |
| `pad.mid` | The chord as held notes, type-0, 120 bpm |
| `patch.json` | Every measurement and every derived synth parameter |
| `source.png` | The analysed frame |
| `README.txt` | What's in the kit and how to use it |

Packed as a store-only ZIP written by hand (~40 lines plus a CRC32 table), so there is no
library dependency.

### Seamless looping

The loop length is chosen as a whole number of LFO cycles nearest 12 seconds, so the filter
breath ends where it started. Oscillator phase still won't match at the seam, so the render
runs `dur + 0.35 s` and the tail is equal-power cross-faded back over the head:

```
out[i] = a[i]·√(i/x) + a[i+n]·√(1−i/x)   for i < x
```

The noise bed is random and never loops on its own; the same crossfade covers it.

### Transpose

A semitone offset (−12…+12) applied to the MIDI note numbers, not to the measurements, so
it moves pitch without touching timbre. Live playback and the export both read it, which
means a pad can be matched to a track's key without re-shooting.

### Delivery

`claude.use("downloads")` when the page runs as an artifact (the sandbox blocks `<a download>`),
falling back to a blob link when served normally. Note the artifact download allowlist has no
`.wav` or `.mid` entry — packing the kit as `.zip` is what makes the audio deliverable at all.
