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

Drop in an image (or hit "Camera"), press **Play**. Every knob in the UI corresponds to a
documented mapping rule.

## Read next

| File | What's in it |
|---|---|
| [`docs/CONCEPT.md`](docs/CONCEPT.md) | The idea, the three possible products, the reasoning behind every sound choice |
| [`docs/MAPPING.md`](docs/MAPPING.md) | The image-feature → music-parameter table, precisely specified |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Staged build plan, tech options with trade-offs |
| [`web/`](web/) | The prototype: analysis, mapping, synthesis, sequencer |

## The one-sentence version

An image is a 2D field; music is a 2D field (time × pitch). The whole app is one honest
projection from the first onto the second — everything else is taste.
