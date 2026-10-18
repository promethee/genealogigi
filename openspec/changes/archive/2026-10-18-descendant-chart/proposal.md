# Proposal

## Why

The Tree tab only shows ancestors. To see a person's children, grandchildren
and so on, there is no view.

## What Changes

- The Tree tab gets a **Show** choice: Ancestors (today's chart) or Descendants.
- Descendants draws the root at the left and children in the next column,
  grandchildren after, up to the same generation limit (2 to 6, default 4).
- Same boxes, lifespans, dashed/solid link styling, click-to-re-root and
  robustness against bad data as the ancestor chart.
- Fan and hourglass charts stay in the backlog.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `pedigree-tree`: adds a descendants direction.

## Impact

- Code: `src/data/pedigree.ts` (direction parameter), `PedigreeTree.vue`.
- Data model and file format unchanged.
- Tests: unit, scoped e2e, manual steps.
- Dependencies: none.
