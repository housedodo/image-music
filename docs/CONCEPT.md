# Concept

## 1. The core problem

Anyone can map pixels to noise. The hard part is making the result feel *caused by* the
picture — a listener who can see the image should be able to say "yes, that's what it
sounds like", and two different photos should sound obviously different while two photos
of the same thing sound obviously related.

That gives three design constraints, and everything downstream follows from them:

1. **Perceptual correspondence.** The mapping must use image properties humans actually
   notice (colour, brightness, busy-vs-calm, hard-vs-soft edges) — not properties they
   don't (mean blue-channel value, JPEG block variance).
2. **Musical safety.** The output must be listenable *by construction*, not by luck.
   Pitches come from a scale, rhythm from a grid, loudness from a compressor. The image
   chooses *within* a musical system; it never gets to break it.
3. **Stability.** Nudging the camera 5° must not change the key. Features get smoothed and
   quantised before they touch anything structural.

Rule of thumb: **the image controls the colour of the music; the music theory controls the
correctness of the music.**

## 2. The central metaphor: the image *is* a score

An image is a 2D field. So is a piano roll. The cheapest and most legible mapping is the
direct one:

```
        image                          music
  ┌──────────────────┐          ┌──────────────────┐
  │                  │ top      │                  │ high pitch
  │                  │          │                  │
  │                  │ bottom   │                  │ low pitch
  └──────────────────┘          └──────────────────┘
   left ──────► right            start ──────► end
```

- **x-axis → time.** A playhead sweeps left to right (this is how a spectrogram works, and
  how the ANS synthesiser and Metasynth work; it's the mapping people intuit fastest).
- **y-axis → pitch.** Up is high. Universally understood.
- **brightness → loudness.** Bright pixel = struck note; dark = silence.

Everything else in the system is a *modifier* on top of that spine. Keep the spine. If a
feature can't be explained as "it modifies the sweep", it probably doesn't belong.

## 3. Why each sound choice

This is the section you asked for — the reasoning, not just the table.

### Colour → harmony (hue → key, saturation → chord richness)

Hue is a **circle**. Key is a **circle** (the circle of fifths). Mapping one onto the other
is the only cross-domain correspondence in the whole app that is structurally exact, so use
it: 30° of hue = one step around the circle of fifths. Consequence that falls out for free:
*analogous colours produce closely-related keys*, so a set of photos from the same
golden-hour walk will all sound harmonically compatible. Complementary colours land a
tritone apart and clash — which is correct, because they clash visually too.

Saturation is "how much colour is there", so it maps to **how much harmony is there**:

| Saturation | Chord |
|---|---|
| grey / washed out | bare fifths (open, ambiguous) |
| muted | triads |
| vivid | 7ths and 9ths |
| neon / oversaturated | add tensions, #11, clusters |

A faded photo sounds hollow and archival; a market stall in full sun sounds like a jazz
chord. That's the intuition you want, and it's not a metaphor you have to teach anyone.

Lightness picks the **mode** on a bright→dark axis that mirrors the standard brightness
ordering of the modes: Lydian, Ionian, Mixolydian, Dorian, Aeolian, Phrygian, Locrian. A
high-key photo is Lydian; a night shot is Phrygian. This is the single highest-payoff rule
in the system — it does most of the emotional work.

### Edges and lines → rhythm

Run a Sobel filter and keep two numbers: **how much edge** and **which way it points**.

- **Edge density → rhythmic density.** Busy image = more notes per bar, finer subdivision.
  A foggy lake gets whole notes; a bicycle rack gets sixteenths. This is the most direct
  "structure you can see = structure you can hear" link available, and it's what makes the
  app feel responsive when you wave a camera around.
- **Orientation histogram → articulation.** This is the interesting one:
  - **vertical edges** cut *across* the time axis → they are onsets → **percussive, short,
    hard attack**. Railings, fences, buildings → staccato.
  - **horizontal edges** run *along* the time axis → they are sustains → **pads, drones,
    long notes**. Horizons, water, skylines → legato.
  - **diagonals** are pitch moving through time → **arpeggios and glides**, ascending or
    descending with the slope. Staircases, wires, branches.
  - **no dominant orientation (isotropic)** → texture, not line → **noise, granular, shakers**.

That single rule is why a photo of a forest and a photo of a skyscraper sound like
different genres rather than the same patch at different speeds.

### Contrast and entropy → dynamics and noise

- **Global contrast → dynamic range.** A flat, hazy image is compressed and quiet; a
  high-contrast image has loud hits and real silences.
- **Local entropy / texture → noise layer.** Smooth gradients (sky, skin, paint) sound
  tonal. Rough texture (gravel, foliage, fabric) adds filtered noise and percussion. This
  is the same distinction a listener makes between a flute and a hi-hat, so it transfers
  intuitively.

### Colour temperature → timbre

Warm (red/orange) → sawtooth through a low-pass filter: thick, close, present.
Cool (blue/cyan) → sine/triangle plus reverb and a high-pass: thin, distant, airy.
This tracks the way people already describe both domains with the same words ("warm",
"bright", "dark", "cold"). Free intuition — take it.

### Composition → arrangement

- **Rule-of-thirds regions → voices.** Segment the image into a handful of dominant colour
  regions; each becomes an instrument. Region *area* → that voice's loudness. Region
  *vertical position* → its register. A photo of a beach gives you three voices: sky
  (high pad), sea (mid texture), sand (low drone).
- **Focus / depth of field → reverb and filtering.** Sharp = dry and forward; blurred =
  wet and filtered. This is literally how distance sounds.
- **Faces / detected objects (optional, later) → melodic motifs.** Foreground subject gets
  the lead line. Only worth it once the base system sings.

### Tempo

Derive from edge density + contrast, then **quantise to a musical grid** (e.g. 60–140 BPM
in steps of 4). Never let tempo drift continuously off a raw feature — it makes everything
feel broken. This is constraint #3 in action.

## 4. Three products in this idea — pick one to aim at

The same engine supports all three, but they demand different things, and picking early
saves you a rewrite.

### A. The Instrument (real-time, camera-driven)
Point the phone at the world, it plays. Move it, the music moves.
- *Needs:* low latency, smoothed features, stable key (lock it, don't re-derive per frame).
- *Feels like:* a theremin you play with your eyes.
- *Hardest part:* stability. Raw per-frame features will sound like a fax machine.
- **Best first target** — the demo is instant and nobody needs it explained.

### B. The Renderer (one image → one finished piece)
Drop in a photo, get back a 30–60s composition (and a MIDI/WAV file).
- *Needs:* good musical form — intro/body/outro, repetition, a sense of arrival.
- *Feels like:* a photo filter for your ears; very shareable.
- *Hardest part:* form. A mapping alone gives you 30 seconds of texture, not a piece. Add a
  structure layer that reads the image at multiple scales (whole image = the arrangement,
  quadrants = the sections, cells = the notes).
- **Best commercial target.**

### C. The Toy / Explorer (interactive, you scrub it)
Drag the playhead, mute layers, swap scales, see which pixels made which sound.
- *Needs:* visual feedback linking pixel→note, all knobs exposed.
- *Feels like:* a learning tool, an installation piece, a VJ tool.
- *Hardest part:* nothing, really — it's the cheapest to build.
- **Best for developing the mapping itself.** Build this first *as your dev tool*, even if
  you ship A or B.

Recommended path: **C as a dev harness → A as the demo → B as the product.** The prototype
in `web/` is a C.

## 5. What makes it good vs. merely working

Five things separate a toy from something people replay:

1. **Repetition.** Loop the bar. Humans hear a loop as music and a stream as noise. Cheapest
   possible upgrade, biggest effect.
2. **A bass note.** One low, slow, stable root under everything. Instantly turns arbitrary
   pitches into harmony.
3. **Space.** Silence between events. Threshold hard — take the top ~15% brightest cells per
   column, not everything above 0.5.
4. **One good reverb.** Signal-to-quality ratio is absurd. Do this before adding features.
5. **Voice limits.** Cap polyphony (8–12). Unbounded note spawning is the #1 killer of these
   projects — it turns into mud and then into crackle.

Deliberate non-goals, at least early: realistic instrument samples, beat-matching to a
reference track, style transfer via ML. All of them hide the mapping, which is the whole
point of the app.

## 6. Efficiency — how to actually use it well

**Analysis is cheap if you downsample first.** Never analyse at full resolution. Scale the
image to ~64×64 (grid features) and ~256×256 (edges) on a canvas — the GPU does it for
free — and everything after that is microseconds. Full-res analysis buys you nothing
audible and costs you the frame budget.

**Analyse on a different clock than you play on.** Audio runs at 44.1 kHz and must never
stall. Analysis should run at 5–15 Hz, off the audio thread, writing into a shared
parameter object that the sequencer reads at bar boundaries. Never let an analysis pass
block a note.

**Smooth, then quantise.** Every continuous feature goes through an exponential moving
average (α ≈ 0.1–0.2) before use; every structural decision (key, mode, tempo, subdivision)
is quantised and additionally hysteresis-gated so it only changes when the feature moves
meaningfully and stays moved.

**Change structure only on musical boundaries.** Notes can change any time; chords change
on the bar; key and tempo change on the phrase (4 or 8 bars). Anything else sounds broken
regardless of how correct the mapping is.

**Precompute per image, not per frame.** For the Renderer, run the analysis once, emit a
deterministic score (seeded RNG keyed on an image hash, so the same photo always gives the
same piece — this matters more than it sounds like it does, because it makes the output
feel authored rather than random), then render.

**Practical workflow, once it's built:** shoot for the axis you want. Want rhythm? Shoot
fences, stairs, windows. Want pads? Shoot horizons and fog. Want harmony? Shoot saturated
colour. Want dynamics? Shoot high contrast. The app rewards people who learn to "aim" it —
so make that legible in the UI, and you've turned a generator into an instrument.
