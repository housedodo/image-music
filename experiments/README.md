# experiments

Side prototypes that share the "read the pixels, derive something structured" idea
but aren't part of the music engine.

## `catdex.html`

Photograph a cat → 32×32 pixel sprite → collectible card. Single file, no build, no
server, no model. Open it directly in a browser.

The pipeline is the interesting part, and it reuses three ideas from the music mapping:

1. **Subject isolation** — median colour of the border ring is assumed to be background;
   pixels far from it in RGB are foreground, cleaned up with a 3×3 majority filter.
2. **Square crop** to the subject's bounding box, then downsample to 32×32.
3. **Median-cut quantisation** to 6 colours, plus a derived outline colour traced round
   the silhouette.
4. **Measurement** — coverage, palette spread, edge roughness, contrast, circular hue
   mean. These become the card's stats, so they're readable off the sprite.
5. **Determinism** — name, title and rarity are drawn from an xorshift PRNG seeded with
   a 32-bit hash of the quantised sprite, exactly as `docs/MAPPING.md` requires of the
   music. The same cat always produces the same card.
6. **Deduplication** — a 64-bit average hash (aHash); within 8 bits of a card you own,
   it's the same cat and the sighting count increments instead of minting a duplicate.

Known gap: step 1 is a background heuristic, not a cat detector. A real version runs a
small on-device classifier (MobileNet, or a YOLO-nano) to confirm "cat" and supply a
proper bounding box. Everything downstream is unchanged by that swap.

Storage is `localStorage`, per browser. The page also attempts `claude.use("db")` first
and falls back silently, so hosting it as a capability-backed artifact needs no code
change — only the declaration.
