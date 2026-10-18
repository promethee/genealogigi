# Design

## Decisions (made without a user round-trip, change freely)

- **Pedigree first, not descendants/fan/hourglass** (TODO.md backlog).
- **Hand-rolled SVG instead of a charting library.** The layout is a few dozen
  lines of pure TypeScript, easy to unit test, and adds no dependency (a
  dependency would need your approval). Trade-off: no built-in zoom or pan;
  the chart scrolls inside its container.
- **Layout is a pure function** `buildPedigree(data, rootId, maxGenerations)`
  returning positioned nodes and edges in abstract units (column = generation,
  row = slot). Rendering converts to pixels.
- **Row assignment:** nodes with no shown parents take the next free row; a
  node with parents sits at the average row of its first and last parent, so
  chart branches stay centred. Parents keep file order (stable).
- **Pedigree collapse:** a person reachable by several paths is drawn once per
  path (standard pedigree behaviour), each with its own node key.
- **Any number of parents** is supported because the model never fixes it.
- **Cycle and depth safety:** recursion stops at `maxGenerations` and refuses
  to revisit a person already on the current path, so hand-edited cyclic data
  cannot hang the app.
- **Missing people** referenced by a relationship are skipped silently.
- **Orientation:** root at the left, ancestors to the right (reads like a
  left-to-right family list; wide screens suit it).
- **Names** longer than 22 characters are truncated with an ellipsis in the
  box; the full name is in the tooltip.
- Re-rooting changes only view state, never the file.

## Out of scope

Descendants, zoom/pan, printing/export, showing partners, step/foster styling
beyond dashed lines.
