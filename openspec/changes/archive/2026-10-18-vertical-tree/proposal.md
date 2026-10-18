# Proposal

## Why

Family trees are read top to bottom, oldest generation first. The charts run
left to right, which reads like a flow chart rather than a family tree, and
wastes the screen's height.

## What Changes

- All tree charts are drawn **vertically**: ancestors on the rows **above** the
  root (oldest at the top), descendants on the rows **below** it.
- Pedigree: root at the bottom, each older generation one row higher; the two
  parents of a person sit side by side with the person centred under them.
- Descendants: root at the top, children below.
- Hourglass: ancestors above, the root in the middle, descendants below.
- Links are vertical elbows joining the facing sides of the boxes.
- The chart scrolls (both ways) when larger than the window.

## Capabilities

### Modified Capabilities

- `pedigree-tree`: orientation of ancestors, descendants and hourglass.

## Impact

- Code: `src/data/pedigree.ts` (levels and slots instead of columns and rows),
  `PedigreeTree.vue` (axes, link routing), site screenshots and captions.
- Data model and file format unchanged.
- Tests: unit (levels), e2e (vertical order, scroll), existing hourglass e2e
  updated.
