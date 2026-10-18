# Design

## Decisions (made without a user round-trip, change freely)

- **Immediate family only**: parents, partners, children. Grandparents and
  siblings are in the card's lists and the Tree tab; the point here is the
  person's *role* around them.
- **Own tiny layout, not the pedigree builder**: three rows of boxes, each row
  centred. Parents above the person; the person and their partners on one row
  (partners to the right, joined by a short line); children below, centred under
  that row. A pure function (`miniTree.ts`) returns slots and edges, tested
  without Vue.
- **Compact boxes** (130 x 34), name truncated, a second small line for a
  non-default nature ("adoptive", "foster"...), dashed lines as in the big tree.
- **Clickable**: a box opens that person's card.
- **Hidden when empty**, so lone people get a clean card.
- **Placement:** at the top of the card's relatives column, above the lists.
- **Same colours as the big tree** (emerald for the person, slate for others).
