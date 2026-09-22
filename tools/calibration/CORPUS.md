# Calibration corpus

The anchors in `CAL` and the affect midpoints are fitted to **18 real photographs**, not to
the synthetic scenes in `gen.mjs`. The photographs themselves are not in the repository —
only the statistics derived from them.

## Procedure

```
node fit.mjs          # raw feature distribution -> CAL anchors
node fitaffect.mjs    # valence/arousal distribution -> grid midpoints
node corpus.mjs       # the full corpus through the finished mapping
```

`fit.mjs` takes each feature's median as the logistic midpoint and picks the slope so the
10th–90th percentiles span roughly 0.15–0.85. That guarantees an ordinary photograph lands
mid-scale and the extremes stay reachable.

To re-fit with your own photographs, decode them to 128×128 RGBA into `corpus.json` as
`{label: [r,g,b,a, ...]}` and re-run.

## What the real distribution corrected

Several anchors guessed from synthetic scenes were badly wrong:

| feature | guessed | measured median |
|---|---|---|
| warmth | 0.55 | **0.773** |
| width | 0.20 | **0.451** |
| sharp | 0.30 | **0.452** |
| depth | 0.10 | **0.059** |
| dominance | 0.85 | **0.770** |
| light | 0.48 | 0.529 |

Real photographs are far warmer, sharper and wider than the flat pastel fills I had been
testing against, and have much less top-to-bottom luminance gradient.

## Result over the corpus

All **9 moods** and all **9 chord qualities** occur; 13 of 18 photographs give a distinct
chord-plus-layer-count.

| photo | chord | mood |
|---|---|---|
| fish and chips | G 6/9 | joyful |
| cyclists on a bench | D 6/9 | joyful |
| meme cat | G 6/9 | joyful |
| cat in a box | G add9 | warm |
| cat in a red bowl | C maj9 | serene |
| red padlock | C maj9 | serene |
| highland cow | D 6/9 | joyful |
| cockroach in a glass | G sus2 | open |
| rowan forest | A maj7♯11 | bright |
| pumpkin field | C♯ sus2 | open |
| run medal | G maj7♯11 | bright |
| alpine road | C♯ quartal | suspended |
| cat in a sunbeam | G sus2 | open |
| dark face | C min9 | wistful |
| IKEA plants | A min♭9 | tense |
| night street poster | G min7 | moody |
| blue studio | A♭ min♭9 | tense |
| food face on a plate | G min7 | moody |

## Known weaknesses

- **Green reads cool.** Warmth is `(R−B)/(R+B)`, which ignores green entirely, so foliage
  sits below the corpus median of 0.773 and pulls toward minor. The IKEA plant hall coming
  out *tense* is the clearest example. A hue-based warmth that treats green as neutral-
  to-positive would fix it.
- **Roots cluster.** Only 6 of 12 pitch classes appear, because real photographs bunch in
  warm hues. Less audible than mood clustering, but real.
- **Texture reads as energy.** A field of grass is high-arousal because it is high-detail;
  the highland cow coming out *joyful* follows from that rather than from anything joyful
  in the picture.

## Re-fit on the app's own pixels

Two things made the first fit subtly wrong:

- **EXIF orientation.** Browsers honour the orientation tag; Pillow does not unless
  `ImageOps.exif_transpose` is called. The Python harness analysed 15 of 19 phone photos
  sideways, which moved every orientation-dependent feature (vertical spread, depth,
  width). Only lightness, saturation and warmth were unaffected.
- **Aliasing.** The app used to draw a 4000-pixel photo straight onto a 128-pixel canvas.
  Most browsers sample rather than average in that case, so texture features (edge
  density, grain, entropy) read noise. `px()` now halves the image in steps before the
  final draw.

The corpus was re-extracted through the app's own path in headless Chromium (stepped
downscale, browser-decoded orientation), and every anchor was refit on that data. Affect
anchors moved to valence mid 0.438 / k 11.1 and arousal mid 0.524 / k 7.6. All nine moods
still appear across the 20 photos, but individual photos shifted. The Malta cliff went from
*tense* min♭9 to *moody* min7.
