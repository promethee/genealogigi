# Proposal

## Why

There is no way to simply look at a person: the only choice is the edit form.
People also cannot record where they were born or died, and clicking someone
in the tree only re-centres the chart.

## What Changes

- **Person detail view** (read-only): names with kinds and dates (main name
  marked), birth date and place, life status and death date and place, and
  the person's relatives: parents (with nature), partners, children and
  siblings. A relative's name opens that person's detail.
- From the detail view, an **Edit** button opens the existing form for that
  person; saving returns to the detail view.
- **Birth place** and **death place** (optional free text) in the form; place
  suggestions come from places already saved. Stored as optional fields on the
  birth and death facets; old files keep working.
- **Tree:** clicking a person opens their detail **below the tree**. Re-centring
  the tree moves to double-click, and to a **"Show tree from here"** button in
  the detail.
- **People list:** the person's name opens the same detail view.
- Siblings in the tree itself come in a separate change.

## Capabilities

### Modified Capabilities

- `person-record`: detail view, birth/death place.
- `pedigree-tree`: click opens the detail; double-click re-roots.

## Impact

- Types (`PersonBorn.birthPlace`, `PersonDeceased.placeOfDeath`), `people.ts`,
  new `relatives.ts`, `PersonDetail.vue`, `PersonForm.vue`, `PedigreeTree.vue`,
  `PeopleView.vue`, i18n. No schema version bump: the new fields are optional.
- Existing e2e that re-root by single click use double-click.
