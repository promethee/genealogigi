# Proposal

## Why

The pedigree is a left-to-right tree. A fan chart is the classic compact view
of ancestry: the root in the middle and each generation a ring around it.

## What Changes

- The Tree tab "Show" select gains **Fan (ancestors)**.
- Root drawn as a circle; each ancestor is a wedge in the ring of their
  generation, spanning the angle of their own ancestors. Half circle, root at
  the bottom centre.
- Same generation limit (2 to 6), click-to-re-root, dashed outline for
  non-confirmed links, safety against bad data.

## Capabilities

### Modified Capabilities

- `pedigree-tree`: fan layout.

## Impact

- Code: new `src/data/fan.ts` (pure geometry), new `FanChart.vue`,
  `PedigreeTree.vue` (select option, switch renderer).
- Data model and file format unchanged. Tests: unit, scoped e2e, manual.
