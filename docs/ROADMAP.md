# Roadmap and tech options

## Staged plan

Each stage is shippable and each one sounds better than the last. Do not skip 1.

**Stage 1 — Spine (½ day).** Grid sweep, one synth voice, fixed C minor pentatonic, loop the
bar. *Goal: it already sounds like music.* Pentatonic is the cheat code here — nothing in it
can clash, so you can debug the mapping without debugging the harmony.

**Stage 2 — Colour → harmony.** Hue→key, lightness→mode, saturation→chord. Add the bass
root. *Goal: two different photos sound like two different pieces.*

**Stage 3 — Edges → rhythm.** Sobel, density→subdivision, orientation→the four-voice mix.
*Goal: a fence and a horizon sound like different genres.*

**Stage 4 — Polish.** Reverb, filters, velocity curves, polyphony cap, compressor on the
master. *Goal: you'd listen to it voluntarily.*

**Stage 5 — Pick a product** (see `CONCEPT.md` §4): camera input (A), MIDI/WAV export (B),
or scrub-and-inspect UI (C).

**Stage 6 — Regions and form.** k-means voices, multi-scale structure, the climax rule.

## Tech options

### Browser (what the prototype uses) — **recommended start**
`<canvas>` + `getImageData` for analysis, Web Audio for synthesis, `getUserMedia` for
camera. Zero install, runs on a phone, shareable as a URL.
*Trade-off:* Web Audio's built-in nodes are basic; heavy per-frame analysis in JS will drop
frames unless you downsample (you must anyway — see CONCEPT §6).
*Upgrades in place:* **Tone.js** for a real transport, scheduler and effects (removes maybe
300 lines of scheduling code — take it as soon as you're past Stage 2); **AudioWorklet** for
custom DSP; **WebGL/WebGPU** for the Sobel pass if you go real-time at high resolution.

### Python — **recommended for the Renderer**
`Pillow`/`OpenCV` + `numpy` for analysis, `mido`/`pretty_midi` to emit MIDI, then render
with `fluidsynth` and a SoundFont, or hand the MIDI to a DAW.
*Trade-off:* not interactive, no camera, awkward to share.
*Strength:* MIDI output is the killer feature — the piece is now editable by a musician, and
"open it in Ableton" is a genuinely compelling pitch. Analysis code is ~5× shorter than JS.

### Hybrid — **the likely endpoint**
Browser for the interactive instrument; a Python CLI sharing the same mapping constants for
high-quality offline renders and MIDI export. Keep `MAPPING.md` as the shared contract so
the two implementations can't drift.

### Others worth knowing
- **SuperCollider / Pure Data** — best sound quality and the most expressive synthesis, but
  image analysis is painful. Good if you already know it, otherwise a detour.
- **Unity / TouchDesigner** — right answer if this becomes an installation with visuals.
- **Native (JUCE, Rust + cpal)** — only once it's a plugin. Premature before Stage 5.

## Practical gotchas

- Browsers block audio until a user gesture. Start the `AudioContext` inside a click handler.
- `getImageData` on a tainted canvas throws. Serve images same-origin or set `crossOrigin`.
- Schedule notes ahead with `AudioContext.currentTime` + lookahead (~100ms); never use
  `setTimeout` for note timing.
- Cap polyphony and put a `DynamicsCompressorNode` on the master, or the first busy photo
  will clip hard enough to be unpleasant.
- HSV mean of hue must be a **circular** mean. Averaging raw degrees makes red average to
  cyan, which will quietly ruin your key mapping and be very hard to notice.

## Open questions worth deciding early

1. Is the mapping **fixed** (a signature sound — better art, more identity) or **user-
   editable** (a toy — more replay value)? Affects how much UI you build.
2. Does the same photo always give the same music? (Say yes — see MAPPING §Determinism.)
3. Real-time camera, or still images only? Real-time roughly doubles the engineering.
4. Is MIDI export in scope? If yes, keep the synth and the score strictly separate from
   Stage 1 — retrofitting that separation is miserable.
