# Proposal

## Why

Relationships are best understood as a tree, but the app opens on the flat
people list. The tree should be the first thing seen once relationships exist.

## What Changes

- When a family file is opened (or resumed) and has at least one
  relationship, the **Tree tab** is shown first.
- A family without relationships still opens on the People tab, where people
  and relationships are added.
- The fan chart was removed earlier at the user's request; trees only.

## Capabilities

### Modified Capabilities

- `pedigree-tree`: default tab.

## Impact

- Code: `PeopleView.vue` (initial tab). Existing e2e that resume a family with
  relationships now click the People tab first.
- Data model unchanged.
