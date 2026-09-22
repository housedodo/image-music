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


---

# Layers and detail

## Three layers from one photo

**One picture, one pad — nothing stacks across photos.** The layers come from inside the
single image: it is split into shadows, midtones and highlights at `mean ± 0.62σ`, and each
band is measured separately. A band covering under 10% of the frame is dropped, so a flat
picture plays one layer and a picture with real tonal range plays three — decided by the
photograph, not by a setting.

| Per-layer, from that band | |
|---|---|
| root | that band's dominant hue, **snapped into the whole picture's scale** so it can only add consonant tones |
| register | shadows take octave 2, midtones 3, highlights 4 |
| voice count | that band's saturation, adjusted by its colour dominance |
| cutoff, Q | that band's brightness and contrast, on its own lowpass |
| gain | how much of the frame the band covers |
| pan | band index, spread by the frame's L/R colour difference |

Measured on a real photo (a cat in a sunbeam): three layers at octaves 2/3/4 with cutoffs
379 Hz / 793 Hz / 2155 Hz, coverage 26% / 45% / 29%, pan −0.45 / 0 / +0.45.

## Colour dominance

`dominance` is the share of the saturation²-weighted hue histogram held by its strongest
peak (plus its two neighbours).

| | effect |
|---|---|
| high (one strong colour) | one fewer note, detune scaled down — purer, more focused |
| low (many colours) | one more note, detune scaled up — wider, hazier |

A genuine **second** hue peak (share > 0.16, measured after suppressing the first peak and
its neighbours) contributes its own chord tone an octave up, snapped into the key with the
root excluded so it is always a real added colour. Measured: a single-hue frame reads 0.88
and plays 3 notes; a two-hue frame reads 0.11, plays 5, and adds an F against a G root.

## Effects from fine detail

### Delay ← spatial repetition

Autocorrelation of the column-luminance signal across the frame. The peak lag is the
spacing; delay time is `0.09 + (lag/width) × 1.55` seconds.

Scoring the raw peak does not work — random speckle produces a broad hump that scores as
high as a fence. **Real periodicity repeats**, so the score takes the weaker of the
correlation at the peak lag and at twice it, minus the mean correlation:

```
strength = clamp( (min(ac[L], ac[2L]) − mean(ac)) × 2.6 )
```

Two corrections were needed, both found by running real photographs rather than synthetic
scenes:

1. **High-pass the column signal** (subtract a moving average over `W/10`). A broad
   left-to-right gradient otherwise masquerades as repetition.
2. **Start the search past the first local minimum** of the autocorrelation. Any smooth
   signal correlates strongly with itself at the smallest lag offered, so all three test
   photographs originally reported strength 1.000 at 4px and got an identical delay.

Measured after both: a regular 16px fence scores 1.000 → 284 ms, a 32px window grid
1.000 → 478 ms, per-pixel noise 0.032, and three ordinary photographs 0.18–0.32 — all
gated to no echo, since mix and feedback start at `(strength − 0.42)`.

## Perceived brightness

`light` is `0.5 × mean + 0.5 × 75th percentile` of luminance, not the mean alone: a sunny
photograph containing deep forest shadow has a mean around 0.49 and was being read as a
night shot.

Warmth now **modulates** darkness instead of adding to it:

```
dark = (1 − light) × (0.80 + 0.40 × (1 − warmth))
```

so coolness deepens a dark picture but cannot drag a bright one to the bottom of the mode
ladder. Before this, a sunlit alpine road came out `min♭9`, the bleakest quality available.

### Chorus ← grain

Mean chroma disagreement between horizontally adjacent pixels, driving two opposed
modulated delays (±depth, hard-panned). Fine-grained surfaces get ensemble movement;
smooth gradients stay still.

### Reverb pre-delay ← depth

Absolute difference between top-half and bottom-half mean luminance, read as a depth cue.
A strong gradient pushes the pre-delay from 5 ms to 90 ms, so the room gets bigger.

## Verifying

`tools/calibration/run3.mjs` prints the detail features, the delay mapping and the layer
stack; `ctrl.mjs` runs the periodicity detector against regular, irregular and random
controls. Both slice the core out of `web/pad.body.html`, so they cannot drift from what
ships.


---

# The affect grid

## Why the ladder failed

Chord quality used to come off a single bright-to-dark ladder. Measured over fifteen
images it produced **8 majors, 7 minors and zero neutrals** — the curve was steep enough to
snap everything to one end or the other, so `sus2` and `add9` never occurred at all. Worse,
the median real photograph landed in the minor half, which is why every early result
sounded dark.

Saturation carried no weight in mood at all, so a vivid picture and a washed-out one of the
same brightness gave the same chord.

## Two axes

| | from |
|---|---|
| **valence** — warm ↔ cool | `0.45·light + 0.22·sat + 0.25·warmth + 0.08·(1−density)` |
| **arousal** — still ↔ busy | `0.38·contrast + 0.30·density + 0.20·sat + 0.12·grain` |

Each is expanded by a logistic centred at 0.468 / 0.530 with k=14, then split into three
bands at 0.37 and 0.63. The pair indexes a 3×3 grid:

| | **calm** | **mid** | **energetic** |
|---|---|---|---|
| **warm** | maj9 · *serene* | add9 · *warm* | 6/9 · *joyful* |
| **neutral** | sus2 · *open* | quartal · *suspended* | maj7♯11 · *bright* |
| **cool** | min9 · *wistful* | min7 · *moody* | min♭9 · *tense* |

Arousal also drives the synth, not just the chord: it lifts the octave, opens the cutoff
(×0.72–1.47), speeds the breath (×0.65–1.55) and picks the waveform. Waveform used to come
from colour temperature alone, which real photographs almost never push far enough to reach
a sawtooth.

Measured on three real photographs:

| photo | chord | mood | valence / arousal |
|---|---|---|---|
| cat in a sunbeam | G maj9 | serene | 0.67 / 0.20 |
| sunlit alpine road | C♯ maj7♯11 | bright | 0.50 / 0.67 |
| dark blue studio | A♭ min♭9 | tense | 0.12 / 0.80 |

## Calibration debt

**The anchors rest on three real photographs.** The twelve synthetic "everyday" scenes in
`tools/calibration/gen.mjs` turned out to be unrepresentative — flat pastel fills with no
shadow or texture — so anchors derived from them read real photographs as far darker than
they are. They were moved toward the real samples (`light` 0.57→0.48, `density` 0.16→0.30,
`entropy` 0.15→0.28, slopes gentled), but n=3 is not a calibration set.

What would fix it: 15–30 real photographs spanning bright/dark, vivid/muted, busy/still,
warm/cool. Run them through `tools/calibration/photos.mjs`, take the median of each raw
feature, and set that as its anchor. Until then the synthetic scenes cluster on `maj9`, and
that clustering should be read as a fault in the test set rather than in the mapping.


---

# Voicing

Everything sounded tense regardless of the chord name, and the cause was in the notes, not
the naming. Three faults, all visible in the note lists:

**1. Tensions in the bass.** Every layer played the same interval stack from its own base,
so a "serene" maj9 came out `C2 G2 B2 D3` — a major seventh and a ninth in the bass octave,
three semitones apart. Sevenths and ninths beat badly below C3.

**2. Duplicate pitches.** Layers independently landed on the same note — MIDI 55 and 55,
67 and 67 — each with its own detune. Two detuned copies of one pitch is maximum beating,
and that is what read as *looming*.

**3. Detune up to 17.4 cents** on sawtooth oscillators, in the low register.

## Chords by register role

A chord is no longer one interval stack. It is three:

| role | base | contents |
|---|---|---|
| `bass` | MIDI 36 | root and fifth, **always** — nothing else, ever |
| `mid` | MIDI 48 | the triad |
| `top` | MIDI 60 | the colour tones — 9ths, 6ths, ♯11s, where they read as air |

The picture's shadows play `bass`, midtones `mid`, highlights `top`. **All layers share one
root.** Previously each band transposed its own full stack by its own hue, which made the
whole thing polychordal — a large part of the dissonance.

Two spacing rules run at build time: no pitch is used twice, and the `top` layer (and any
added second-colour tone) is lifted by octaves until it clears the highest note below it by
at least 3 semitones.

Detune is scaled by register — `bass ×0.30, mid ×0.65, top ×1.0` — and its range cut, so
the maximum across the corpus is **9.0 cents, down from 17.4**. Resonance is capped at
`0.5 + contrast×1.7` (was ×7). A 48 Hz highpass sits before the compressor.

## Warm pictures get softer treatment

Beyond the chord, valence above 0.60 now changes the sound itself:

- **no sawtooth at all** — a saw through a resonant lowpass reads as tense whatever the
  notes are, so warm pictures use sine and triangle
- **the airy noise bed is scaled by `1.25 − valence×0.75`**, so a serene picture gets a
  fraction of the breath a tense one does

## Result over the corpus

| | before | after |
|---|---|---|
| duplicate pitches | present | **0 / 18** |
| rough low intervals | 6 / 18 | **0 / 18** |
| max detune | 17.4c | **9.0c** |

Sample voicings at the warm end:

```
cat in a red bowl   C maj9    serene   C2 G2 | C3 E3    | D4 E4 G4
cat in a box        G add9    warm     G2 D3 | G3 B3 D4 | A4 B4 D5
fish and chips      G 6/9     joyful   G2 D3 | G3 B3 E4 | A4 B4
```

`tools/calibration/voicing.mjs` checks the whole corpus for duplicate pitches, rough low
intervals and detune extremes.


---

# Mobile audio

Crackling on a phone is a buffer underrun: the audio thread cannot refill its buffer before
the hardware needs it. The graph was asking too much of a phone in three ways.

## 1. The latency hint (the big one)

`new AudioContext()` defaults to `latencyHint: "interactive"`, which asks for the **smallest
buffer the device will give** — right for a drum pad, wrong for a drone. A sustained pad has
no latency requirement at all:

```js
new AudioContext({latencyHint: "playback"})
```

This alone gives the audio thread several times longer to do the same work.

## 2. Convolution length

A 4.2 s stereo impulse is 370k samples and is by far the most expensive node in the graph.
Cut to 2.6 s stereo (230k), which for a pad is inaudible as a change.

## 3. Voice count

`SLOTS` 5 → 4, so 3 layers × 4 slots × 2 oscillators = 24 running oscillators plus 4 LFOs,
down from 34 total. Silent slots still cost CPU in Web Audio — a node at zero gain is still
processed — so the budget is set by the graph's shape, not by how many notes are sounding.

## Clipping is the other crackle

Nine detuned voices plus delay and reverb can sum past 1.0, and clipping at the output
sounds much like an underrun. The master chain is now:

```
out → highpass 48 Hz → compressor (−17 dB, 5:1) → trim 0.72 → limiter (−1.5 dB, 20:1) → destination
```

## Low-power path

Devices reporting ≤4 cores, or a coarse pointer with ≤6 cores, additionally get a **mono
1.9 s impulse** and **no chorus** (the two modulated delays are skipped, not just muted —
a muted node still costs). Detection is `navigator.hardwareConcurrency` plus
`matchMedia("(pointer: coarse)")`.

**The offline render is never throttled.** It has no deadline, so `graph(ctx)` is called
without the eco flag for exports: a pad exported from a weak phone still gets the full
stereo tail and the chorus.


---

# Installing to a home screen

Served over HTTPS the page is an installable PWA.

| file | generated by | purpose |
|---|---|---|
| `manifest.webmanifest` | `tools/build.py` | name, `display: standalone`, portrait, theme colour, icon set |
| `sw.js` | `tools/build.py` | offline shell; cache name carries the build stamp |
| `icons/*.png` | `tools/icons.py` | 192, 512, maskable 512, apple-touch 180, favicon 64 |

## Caching, carefully

A service worker is the easiest way to make a page stop updating, which would undo the
no-cache work done earlier. So the fetch handler is **network-first**: it always tries the
network, puts a copy in the cache, and only falls back to the cache when the request fails.
Offline still works; a new build still lands on the next load.

`CACHE` is named after the build timestamp and `activate` deletes every other cache, so old
versions cannot accumulate. `skipWaiting` + `clients.claim` mean a new worker takes over
immediately rather than waiting for every tab to close.

Cross-origin requests (Google Fonts) are left alone entirely.

## The install affordance

- **Chrome / Edge** fire `beforeinstallprompt`. It is captured, the default mini-infobar
  suppressed, and a real **Install** button shown in the page.
- **iOS** has no prompt API, so the panel shows the manual instruction instead.
- Hidden when `display-mode: standalone` matches (already installed), when the viewer has
  dismissed it once (`localStorage`), and when no `<link rel="manifest">` is present — that
  last check keeps it off the artifact build, where installing would bookmark claude.ai
  rather than the app.

## Icons

Drawn in `tools/icons.py` with Pillow: a picture frame whose landscape is a sound wave.
Strokes are stamped as overlapping circles rather than drawn with `ImageDraw.line`, whose
mitred joins were visibly jagged at icon sizes. The maskable variant keeps all content
inside the centre 80% safe zone with the background filling the full tile.


---

# Picking a photo while it plays

Choosing a photo pauses the pad; the new one starts it again. Without this the old pad
drones on through the picker and then glides into the new one, so you never hear a clean
entry.

```
input "click"   -> pausePick()   remember whether it was playing, fade out over 0.25 s
input "change"  -> load, rebuild the patch, then fade back in over 0.5 s
input "cancel"  -> resume exactly as it was
```

The fades are faster than a deliberate Play/Stop (0.25 s and 0.5 s against 0.9 s and 1.6 s),
so it reads as a transition rather than a stop.

## Not getting stuck silent

The failure mode to avoid is pausing and never resuming. Three guards:

- **`cancel` event** on `<input type="file">` — the clean signal, but only on Chrome 113+
  and Safari 16.4+.
- **Focus fallback** — when focus returns to the window and no file has arrived, resume
  after 2 s. A phone can be slow to hand the file back after the camera closes, and
  `change` clears this timer as soon as it fires.
- **Every exit path calls `endPick`** — a decode failure, an empty file list, a second
  click while one is already open.

Playback only resumes if it was playing *before* the pick, so tapping Take photo on a
silent app leaves it silent, and no AudioContext is created.

Starters and saved pads are unaffected — those load instantly, so they keep the 2.8 s glide,
which is the nicer behaviour when there is no picker to wait for.


---

# Salience

Every measurement was a pixel-count average, but the eye does not weight a photograph that
way. Each pixel now carries an attention weight — **local luminance contrast** against a
box-blurred surround (normalised against the 85th percentile, not the maximum, or one
specular highlight collapses every other weight onto the floor) times a **mild centre
bias** — and the mood features are re-measured through it, blended 50/50 with the plain
average.

There is deliberately **no brightness term**. Weighting bright pixels higher would push
every dark photograph lighter, which is the opposite of what is wanted: only a dark
*surround* should lose its vote, not a dark *subject*.

Effect over the 19-photo corpus: all 9 moods still occur, no regressions, and two small
improvements (a sunlit room moved serene → warm, an overcast field joyful → bright).

## What it does not fix, and why

A cave mouth framing a bright bay still comes out **tense**. Three approaches were tried
and measured:

| approach | result |
|---|---|
| local contrast alone | barely moves it — craggy limestone is *full* of detail, so the rock scores as "interesting" |
| dark-region-connected-to-border detector | either fires on 17 of 19 photographs (a percentile threshold just means "the darker part of any photo") or, once tightened, on none |
| saturation as a third cue | regressed a dark sleeping face to *open* — ochre rock is saturated, pale sky is not |

The honest reason: **a cave framing a bay and a dark room with a glowing monitor are
structurally the same image** — dark surround, bright middle. What separates them is that a
bay is cheerful and a dark studio is not, which is semantic, not geometric. Any threshold
that flips the first also flips the second, and *tense* is right for the second.

This needs a model that knows what is in the frame. It is not a calibration problem.

---

# Colour as instrument

Hue picked the key but said nothing about the sound. It now also picks the **harmonic
recipe** — a `PeriodicWave` built from explicit harmonic amplitudes, so these are genuinely
different timbres rather than three stock waveforms.

| hue | family | harmonics | character |
|---|---|---|---|
| red | `ember` | strong 2nd and 3rd | reedy, burning |
| yellow | `gold` | odd-weighted, strong 5th and 7th | bell, metallic |
| green | `moss` | odd only, fast rolloff | woody, hollow |
| blue | `tide` | sparse, near-sine | glassy, pure |
| violet | `dusk` | full spectrum, slow rolloff | bowed strings |
| magenta | `rose` | 2nd only, then nothing | soft, breathy |

Harmonics are damped by `ROLE_HARM[role] × (1.05 − valence×0.45)`: the bass keeps only its
lowest partials whatever the colour (or the low end growls), and a warm picture is damped
further. That replaces the old crude rule of banning sawtooth on warm images — the stock
`type` is gone entirely.

**Each band picks its own family from its own hue**, so a photograph whose shadows and
highlights differ in colour is scored for two instruments at once. Measured examples:

```
food face on a plate   tide / tide / ember    blue trousers under warm food
run medal              tide / ember / ember   blue shirt under an orange medal
highland cow           moss / gold  / gold    green shade under golden grass
cat in a red bowl      ember / ember / dusk   warm room, violet highlight
```

Across the corpus only 4 of 6 families appear as the *overall* label — photographs cluster
in warm hues, so `ember` takes 10 of 19 — but all 6 appear at band level, which is where
they actually sound.

# Tuning by ear: the lab

Every fix so far came from a listening complaint turned into a measurement. That runs out:
"bright but sounds dark" and "the highs take over" are judgements about *this* picture, and
the only ground truth is a person listening. `lab.html` (source `web/lab.body.html`, built by
`tools/build.py`) collects that ground truth.

Load a photo and the lab plays it five ways. All five keep the image's root and every
effect setting, and each changes only one thing:

| setting | chord | top layer | shimmer / tail | what it tests |
|---|---|---|---|---|
| As mapped | whatever the app picks | as mapped | as mapped | the baseline |
| Pure | root + fifths | 55 % level, cut 2.6 kHz | 0.5× / 1× | does removing the third fix "dark"? |
| Warm | add9 | 65 %, 3 kHz | 0.7× / 1× | major without a leading tone |
| Airy | 6/9 | 70 %, 2.8 kHz | 1.4× / 1.5× | bright and open, with more space |
| Deep | minor | 55 %, 2.2 kHz | 0.4× / 1.2× | is the picture actually minor? |

Every alternative also softens the harmonic recipe (`soft`, 0.55–0.8, which damps the
upper partials of the oscillator wave), drops the second-colour tone, and keeps the top
layer at least 3 semitones clear of the middle one. Rate each setting 👍 fits / 😐 could work / 👎 wrong, add a note, save. A record
stores the ratings, the favourite (the single top-rated setting, if there is one), what the app
picked, and all the image features. That is enough to refit the mapping later without
the photo. Export writes the whole set as JSON with the thumbnails stripped.

The Pages build keeps records in `localStorage` on that device. The claude.ai copy keeps
them in the artifact's database, so they can be read back directly for fitting.

## Why "the highs take over": A-weighting

The earlier mix checks measured raw energy and found it bass-heavy. The ear does not hear
raw energy. Weighted with the A-curve (roughly −20 dB at 100 Hz, +1 dB at 2–4 kHz), the
Malta cliff patch has a *perceived* centroid of about 1 kHz with only 13 % of the heard
energy below 300 Hz. The three top voices at 330–620 Hz plus shimmer sit where hearing is
most sensitive. The softer alternatives land at 630–980 Hz. Measure perceived balance with
A-weighting from now on (`labtest.cjs` pattern in the calibration notes).

## Two more dissonance sources, and a remaining one

- **The second colour tone.** A strong second hue adds its own pitch class to the top.
  On the cliff that was E♭ over a C♯-minor chord: a whole tone from the root and a
  semitone from the E. It is now dropped if it falls a semitone, a major seventh, or a
  tritone from any sounding pitch class.
- **Chord qualities that are dissonant by design.** Of the 20 corpus photos, 6 still
  contain a semitone, a major 7th or a tritone between pitch classes. They come from
  *tense* (min♭9), *bright* (maj7♯11) and *wistful* (min9). "Bright" is the notable one:
  a ♯11 over a major 7th reads as luminous to a jazz ear and as "off" to most people.
  The lab ratings decide whether it goes. Changing it before then would be guessing.

## Why a bright photo can still read dark

Valence mixes lightness, saturation, warmth and entropy against the corpus median. A
white cliff under a pale sky is light, but it is also low in saturation, cool (sea and sky
blue outweigh the stone), and busy (rock texture). Three of the four push toward minor, and
the result is C♯ min7, *moody*. That is correct for the rule. Whether the rule is right is
exactly what the lab's *Pure / Warm / Airy* ratings will show.

## Training set 8: what the first ratings changed

Eight photos were rated in the lab. The findings, and what changed in the engine:

- **The top was too loud on 5 of 8** ("too strong high note"), even where the sound was
  otherwise "perfect". "As mapped" also won on fullness, so the body stays as it was and
  only the top moves. Top layer gain drops from 1.05 to 0.62, its filter sits 25 % lower,
  and shimmer drops to 65 %. On the Malta cliff the perceived (A-weighted) centroid falls
  from 1008 to 877 Hz and the heard low end rises from 13 % to 26 %.
- **6/9 lost both times it played** (two *joyful* photos: As mapped 👎, Airy 👎/😐,
  Warm 👍 both times). The one *suspended* photo also preferred Warm over quartal. Both
  cells now play **add9 open**: root, fifth and a major tenth in the body, with 9th, 5th and
  octave on top. It is still major, but more open than *warm*'s close add9.
- **Dark blue and violet should sound submerged** (user note). A `submerged` factor
  (0 to 1, from darkness × a blue–violet dominant hue) drops the top an octave above 0.5,
  lowers the body and top filters by up to 45 %, and takes up to 40 % off the top and
  70 % off the shimmer.
- **Kept:** moody min7 (rated best on a warm-orange photo), serene maj9, wistful min9.
  *Deep* (minor) was rated 👎 on every warm photo, which confirms minor is right only for
  cool pictures.
