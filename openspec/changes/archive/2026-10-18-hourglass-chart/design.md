# Design

## Decisions (made without a user round-trip, change freely)

- **Compose, don't rewrite.** The hourglass is the ancestors layout plus the
  descendants layout, merged around the shared root. The root node comes from
  the ancestors layout; the descendants root is dropped (edges reference the
  same root key).
- **Nodes get a `column`** (horizontal slot), equal to `generation` in the
  existing charts. Hourglass: ancestors at `A - g`, descendants at `A + g`,
  where A is the number of ancestor columns.
- **Vertical alignment:** descendant rows are shifted so both roots share a row;
  everything is then moved down so the top row is 0.
- **Links** are drawn between the near sides of two boxes in either direction.
- **Generations** applies to each side separately.
- **Control:** a new option in the existing "Show" select.
