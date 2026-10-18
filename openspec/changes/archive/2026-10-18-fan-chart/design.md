# Design

## Decisions (made without a user round-trip, change freely)

- **Derive from the pedigree layout.** The fan reuses `buildPedigree` (ancestors)
  and turns it into wedges, so cycle safety, generation limit and
  more-than-two-parents handling come for free.
- **Angles by leaf rows.** Each node's wedge covers the angular slice of the
  leaf rows below it (leaf = no further ancestors). A person with one known
  parent thus gets a wider wedge than one with two parents' lineages; no empty
  gaps for unknown ancestors.
- **Half circle**, root circle at the bottom centre, sweeping left to right over
  the top. Fits wide screens, avoids upside-down text.
- **Geometry is pure TS** in `src/data/fan.ts` (angles to SVG arc paths and
  label placement), unit-tested without Vue.
- **Labels** run along the radius, flipped on the left half so they read
  upright; truncated to 14 characters.
- **Dashed outline** replaces dashed lines (no lines in a fan).
- **Lifespans** only in the hover title, wedges are too small for a second line.
- **Control:** option in the existing "Show" select; other charts unchanged.
