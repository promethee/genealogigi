# Design

## Decisions (made without a user round-trip, change freely)

- **Root's siblings only**, not every ancestor's: the chart would double in size
  for little value. Click an ancestor and use "Show tree from here" to see theirs.
- **A checkbox, off by default.** The default chart stays compact.
- **Placement on the root's row**, centred on the shared parents, nearest the
  root first; older to the left, younger or unknown to the right. Slots one box
  apart, so nothing overlaps (the root row holds only the root otherwise).
- **Links go to the parent boxes** the sibling shares, with the sibling's own
  nature for that link (dashed when not confirmed biological).
- **Hourglass:** siblings join the ancestors half only.
- **Not in descendants view:** the parents are not drawn there, so the siblings
  would float unlinked.
- **Layout stays pure:** a new optional `siblings` flag on `buildPedigree`;
  sibling nodes carry `sibling: true` and generation 0 so they sit on the root's level.
