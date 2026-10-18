# Design

## Decisions (made without a user round-trip, change freely)

- **Detail is a view first, edit second**, as asked: `PersonDetail` is read-only
  with an Edit button; the existing `PersonForm` is reused for editing.
- **Placement:** in the tree tab the detail sits **below** the chart (a side panel
  would squeeze a chart that is already wide and scrolls); in the list tab it
  opens in a card above the list.
- **Click vs re-root:** single click = open detail (the new request); re-root
  becomes double-click plus a button in the detail, and the root selector stays.
- **Places are optional free text** on the birth and death facets:
  `PersonBorn.birthPlace?`, `PersonDeceased.placeOfDeath?`. No schema version
  bump: old files load unchanged; an older app version would ignore them.
- **A place without a date** stores a fully unknown birth date (the facet needs
  one), as already done for "deceased without a death date".
- **Death place only when Deceased.** A living person has no death facet.
- **Suggestions** for places, like last names, from a native datalist; ranked by
  frequency, case-insensitive. Birth and death places share one list.
- **Relatives are derived**, never stored: parents, children, partners and
  siblings come from the existing relationships (new pure `relatives.ts`).
  Sibling = shares at least one parent; half-sibling when the known parent sets
  differ.
- **Relatives are links**: a name opens that person's detail (the tree selection
  follows).
- **List summary and tree boxes do not show places** (too long); the detail does.
- **Selection state** lives in the view components, not the store.
- **Delete moved to the card** (user request): the destructive action needs the
  context of the full card; list rows keep the non-destructive Edit. The
  relationships list keeps its own Delete (a relationship is not a person card).
- **"born"/"died" wording** replaces "b."/"d."; the tree's compact "1815–1852"
  lifespan is unchanged.
- **Logo flipped:** the in-app mark and the app icon now show a tree growing
  upward (root at the bottom), matching the ancestors-on-top charts.

