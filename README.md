# image-music

Turn a picture into music. Point a camera at anything — a wall, a street, a plant — and
the app reads its colours, structures and lines, and plays what it sees.

This repo holds a **concept**, a **mapping spec**, and a **working browser prototype**
you can open right now with no build step.

## Quick start

Open `index.html` — that's pad mode, the whole app in one file with no build step. It runs
straight from disk, and from any static host (GitHub Pages, Cloudflare Pages) over HTTPS,
which the camera requires.

On a phone, **Take photo** opens the rear camera directly. The frame takes the photo's own
aspect ratio, so portrait and landscape both show whole — nothing is cropped.

## Read next

| File | What's in it |
|---|---|
| [`docs/PAD.md`](docs/PAD.md) | **Pad mode** — one image, one sustained chord. The live spec |
| [`docs/CONCEPT.md`](docs/CONCEPT.md) | The idea, the three possible products, the reasoning behind every sound choice |
| [`docs/MAPPING.md`](docs/MAPPING.md) | The older sequencer mapping, precisely specified |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Staged build plan, tech options with trade-offs |

## Also in here, not currently linked from the app

| Path | What it is |
|---|---|
| `web/demo-standalone.html` | The sequencer bench and its angle-stability lab |
| `web/index.html` + `web/*.js` | The modular sequencer prototype |
| `experiments/catdex.html` | Photo → 32×32 pixel cat card, a sibling experiment |

## The one-sentence version

An image is a 2D field; music is a 2D field (time × pitch). The whole app is one honest
projection from the first onto the second — everything else is taste.

## Demo

`web/demo-standalone.html` is a single self-contained file — five procedurally drawn
scenes, the full analysis/mapping/synthesis chain, and an **angle lab** that re-analyses
the current scene at nine angles from −12° to +12° with no temporal smoothing, to show
how much the derived key actually moves. Open it directly in a browser; no server needed.

## Building

`index.html` is generated — don't edit it directly.

```
python3 tools/build.py      # web/pad.body.html  ->  index.html
```

`web/pad.body.html` is the page as the claude.ai artifact host wants it: a `<title>`, a
`<style>`, markup and a `<script>`, with no document skeleton, because that host supplies
one. A plain web server supplies nothing, so `tools/build.py` adds the parts that matter —
most importantly the **viewport meta**, without which a phone renders the page at a 980px
virtual width and skips every mobile media query. It also stamps the build time onto
`<html data-build>`, which the footer prints, and sets no-cache directives.
