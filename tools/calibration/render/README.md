# Render tests

These drive the **real** Web Audio graph — `graph()`, `applyTo()`, `render()` — in headless
Chromium via Playwright, and measure what actually comes out. Syntax checks and parameter
tables cannot catch a resonant feedback loop or a mix that is all bass; these can.

```
python3 make_page.py after                 # page from the current web/pad.body.html
python3 make_page.py before path/to/old.html
node mixcheck.cjs after                    # level, peak, centroid, partial count, low/mid/high split, growth
node seam.cjs                              # loop join: click, and level step across the seam
```

`set.json` is `{name: "data:image/jpeg;base64,..."}` — your own photos, not committed.

What each metric catches:

| metric | catches |
|---|---|
| peak | clipping; anything near 0.98 is riding the output ceiling |
| centroid, low/mid/high | a mix that is all bass (flat) or all top (harsh) |
| spectral peaks | thinness — how many distinct partials survive |
| growth, last second vs first | a feedback network that is still climbing |
| seam level step | slow modulators that do not complete whole cycles per loop |
