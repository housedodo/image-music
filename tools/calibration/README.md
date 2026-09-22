# Calibration harness

Answers one question: **do ordinary photos all sound the same?**

`analysePixels()` in `web/pad.body.html` is a pure function over RGBA bytes, so it runs
outside a browser. `gen.mjs` synthesises twelve deliberately ordinary scenes — beige living
room, grey pavement, office desk, overcast park — plus five extremes, and the runners map
them through the real `patchOf()`.

```
cd tools/calibration
node -e "…extract core…"   # see the note below
node run.mjs               # the twelve everyday scenes
node run2.mjs              # plus extremes, and the overall spread
```

`core.js` is extracted from `web/pad.body.html` by slicing from `function hsv(` to the
shared-graph marker, then appending
`export {analysePixels,patchOf,PRETTY,QUALITIES};`. Keeping it a slice rather than a copy
means the harness can never drift from the shipped mapping.

## Measured

| | distinct chords | roots | qualities |
|---|---|---|---|
| Before calibration | 6 / 12 | 3 | 4 |
| After | **10 / 12** | **5** | 4 |
| All 17 incl. extremes (chord + voicing) | 17 / 17 | 7 | 5 |

Before: saturation across the twelve ran 0.02–0.37 and edge density 0.10–0.28 — the bottom
fifth of each scale — and G was the root of eight of twelve.

The scenes are synthetic, which is the harness's main weakness: they capture the *muted,
mid-brightness statistics* of everyday photography but not its structure. Re-run the
anchors against a folder of real photos before trusting the exact numbers.
