# image-music

Turn a picture into music. Point a camera at anything — a wall, a street, a plant — and
the app reads its colours, structures and lines, and plays what it sees.

This repo holds a **concept**, a **mapping spec**, and a **working browser prototype**
you can open right now with no build step.

## Quick start

```bash
cd web && python3 -m http.server 8000
# open http://localhost:8000
```

Open `pad.html` for pad mode, or `index.html` for the sequencer. Drop in an image (or hit "Camera") and press play. Every knob in the UI corresponds to a
documented mapping rule.

## Read next

| File | What's in it |
|---|---|
| [`docs/CONCEPT.md`](docs/CONCEPT.md) | The idea, the three possible products, the reasoning behind every sound choice |
| [`docs/PAD.md`](docs/PAD.md) | **Pad mode** — one image, one sustained chord. The recommended default |
| [`docs/MAPPING.md`](docs/MAPPING.md) | The full sequencer mapping: image-feature → music-parameter, precisely specified |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Staged build plan, tech options with trade-offs |
| [`web/`](web/) | The prototype: analysis, mapping, synthesis, sequencer |

## The one-sentence version

An image is a 2D field; music is a 2D field (time × pitch). The whole app is one honest
projection from the first onto the second — everything else is taste.

## Demo

`web/demo-standalone.html` is a single self-contained file — five procedurally drawn
scenes, the full analysis/mapping/synthesis chain, and an **angle lab** that re-analyses
the current scene at nine angles from −12° to +12° with no temporal smoothing, to show
how much the derived key actually moves. Open it directly in a browser; no server needed.
