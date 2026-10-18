# Proposal

## Why

A person can hold several first names and last names in the data model
(birth, current, nickname, married, each with a date), but the UI only edits
one of each, and people with several names are read-only. Real families have
nicknames and married names.

## What Changes

- The person form edits **lists** of first names and last names. Each entry
  has a value, a kind, an optional partial date, a **primary** marker, and
  **Up / Down / Remove** buttons. "Add first name" / "Add last name" add rows.
- Exactly one entry per list is the primary name. The list and the tree show
  the primary first name plus the primary last name.
- People with several names become editable (no more read-only lock).
- Blank rows are ignored; at least one name overall is still required.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `person-record`: several names per person, kinds, dates, primary marker,
  ordering.
- `pedigree-tree`: boxes show the primary name.

## Impact

- Data model: optional `primary` flag on `PersonFirstName` and
  `PersonLastName`. No schema version change.
- Code: `src/data/types.ts`, `src/data/people.ts`, `PersonForm.vue`,
  `PeopleView.vue`.
- Tests: unit, scoped e2e, manual steps.
- Dependencies: none.
