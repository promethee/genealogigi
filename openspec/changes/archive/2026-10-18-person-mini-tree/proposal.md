# Proposal

## Why

The card lists parents, partners and children as text. A small picture shows at
a glance where the person sits: who is above them and who is below.

## What Changes

- The person card shows a **small family tree**: the person highlighted in the
  middle, their **parents above**, their **partners beside** them, their
  **children below**, linked by lines (dashed when the parent link is not
  confirmed biological).
- Non-default parent natures are noted in the box ("adoptive", "foster"...).
- Clicking a box opens that person's card.
- Shown only when the person has at least one parent, partner or child.
- Compact and scrollable; no generation controls (the Tree tab is for that).

## Capabilities

### Modified Capabilities

- `person-record`: small family tree on the card.

## Impact

- New `miniTree.ts` (pure layout), `FamilyMiniTree.vue`, `PersonDetail.vue`,
  i18n. No data change.
