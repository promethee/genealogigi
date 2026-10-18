# Proposal

## Why

People exist but cannot be linked. Relationships are the whole point of a
family tree, and the tree visualization depends on them being stored first.

## What Changes

- A relationships section in the loaded-family view with **Add**, list and
  **Delete**.
- Two kinds in this first scope:
  - **Parent-child** with a permanent nature: biological (confirmed),
    biological (presumed), or adoptive.
  - **Partners** with a status: ongoing, ended, or unknown. Gender and count
    are never constrained.
- Validation: both people must exist, a person cannot be related to
  themselves, no duplicate relationship, and no parent-child cycle (nobody can
  become their own ancestor).
- Deleting a person also deletes their relationships, after a confirmation
  that says how many will go.
- Temporary parent-child natures (step, foster, guardian) and dates stay in
  the data model but get no UI yet.

## Capabilities

### New Capabilities

- `relationship-record`: creating, listing, deleting and persisting
  relationships between existing people.

### Modified Capabilities

- `person-record`: deleting a person now also removes their relationships.

## Impact

- Code: new `src/data/relationships.ts`, `removePerson` in
  `src/data/people.ts` cascades, new store actions, new
  `src/components/RelationshipsSection.vue`.
- Data model: no type changes. Start and end dates are stored as the
  fully-unknown date.
- Tests: unit tests for the module and store, scoped e2e, manual test steps.
- Dependencies: none.
