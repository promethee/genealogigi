# Design

## Decisions (made without a user round-trip, change freely)

- **Same layout algorithm, axes swapped.** The leaf-slot layout that gave rows
  now gives horizontal slots; generations give vertical levels. No new layout
  code, so cycle safety, generation limit and multi-parent handling are kept.
- **Renames:** `column` -> `level` (vertical, 0 = top), `row` -> `slot`
  (horizontal), `columns` -> `levels`, `rows` -> `slots`.
- **Ancestors flip:** level = deepest generation - generation, so the root is
  on the bottom row and the oldest generation on the top row. Descendants use
  level = generation (root at the top). Hourglass = ancestors layout above, the
  descendants layout below, roots aligned on the same slot.
- **Spacing:** 190 px per slot (box 170 + gap), 96 px per level (box 48 + gap).
- **Links:** vertical elbows (up to ancestors, down to descendants) from the
  facing sides of the boxes. Where several links share a level, their
  horizontal segments overlap on the same line, as is usual in tree charts;
  dashed vs solid is still distinguishable at the box ends.
- **Scrolling:** the chart container keeps `overflow: auto` (so both axes
  scroll); the SVG is centred with auto margins when narrower than the window.
- **No new setting for orientation.** The user asked for vertical; a
  horizontal toggle would be extra code to maintain.
- **Website screenshots regenerated**, captions updated.
