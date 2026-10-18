# Design

## Decisions (made without a user round-trip, change freely)

- **Same layout, flipped traversal.** Descendants reuse `buildPedigree` with a
  `direction` parameter ("ancestors" default, "descendants"). Traversal follows
  parent -> child instead of child -> parent. Rows, columns, boxes and edges
  are unchanged, so no second renderer.
- **Left to right** in both modes (root in column 0). A mirrored right-to-left
  layout would add code for no new information.
- **Control:** a "Show" select (Ancestors / Descendants) next to Generations.
  Default Ancestors; choice is not persisted.
- **Shared descendants** (a child reachable through two parents) appear once
  per path, as with shared ancestors.
- **Edge fields** keep their names; `fromKey` is the node nearer the root,
  `toKey` the further one. Comments updated.
- **Parents centred on children** rule stays: in descendants mode a person's
  row is the midpoint of their first and last child.
- **Empty state text** unchanged.
