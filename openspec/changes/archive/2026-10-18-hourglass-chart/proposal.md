# Proposal

## Why

Ancestors and descendants are separate charts. An hourglass shows both around
one person at once.

## What Changes

- The Tree tab "Show" select gains **Hourglass (both)**.
- Ancestors are drawn to the left of the root, descendants to the right, the
  root in the middle column, both limited by the Generations setting.
- Same boxes, lifespans, dashed/solid links, click-to-re-root and robustness.

## Capabilities

### Modified Capabilities

- `pedigree-tree`: hourglass layout.

## Impact

- Code: `src/data/pedigree.ts` (nodes gain `column`, new hourglass layout),
  `PedigreeTree.vue` (x from column, links drawn either direction).
- Data model and file format unchanged. Tests: unit, scoped e2e, manual.
