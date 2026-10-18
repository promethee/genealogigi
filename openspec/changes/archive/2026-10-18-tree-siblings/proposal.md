# Proposal

## Why

The tree shows a person's ancestors but never their brothers and sisters, even
though they share the same parents. There is no way to see the root's siblings
in the chart.

## What Changes

- A **Show siblings** checkbox next to Generations (ancestors and hourglass views).
- When ticked, the root's siblings (people sharing at least one parent) appear on
  the root's row, beside the root, each linked to the parents they share.
  Older siblings (earlier known birth year) sit to the left, younger or unknown
  to the right.
- Half-siblings appear too, linked only to the parent they share.
- Sibling boxes behave like any box: click opens the card, double-click re-roots.
- Not offered in the descendants view (the parents are not drawn there).

## Capabilities

### Modified Capabilities

- `pedigree-tree`: siblings of the root.

## Impact

- `pedigree.ts` (sibling nodes and links), `PedigreeTree.vue` (checkbox),
  i18n. Uses the existing `siblingsOf`. Data model unchanged.
