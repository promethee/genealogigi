# Proposal

## Why

People and relationships can be stored but not seen. A family tree is the
reason the app exists, and a pedigree (a person and their ancestors) is the
simplest chart that makes parent-child data meaningful.

## What Changes

- A **Tree** tab next to the people list showing a pedigree chart: the chosen
  person on the left, parents to the right, grandparents beyond, and so on.
- Choose the root person from a list; click any person in the chart to make
  them the root.
- Choose how many generations to show (2 to 6, default 4).
- Line style shows certainty: solid for biological-confirmed, dashed for
  biological-presumed and adoptive.
- Handles real-world data: missing parents, one known parent, more than two
  parents, an ancestor reachable by several paths, and a corrupt file
  containing a parent-child cycle.

## Capabilities

### New Capabilities

- `pedigree-tree`: viewing a person's ancestors as a pedigree chart.

### Modified Capabilities

None.

## Impact

- Code: new pure layout module `src/data/pedigree.ts`, new
  `src/components/PedigreeTree.vue`, a List/Tree tab switch in `PeopleView`.
- Data model and file format: unchanged (read-only feature).
- Tests: unit tests for the layout, scoped Playwright e2e, manual steps.
- Dependencies: none (plain SVG, no charting library).
