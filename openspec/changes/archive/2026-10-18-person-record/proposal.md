# Proposal

## Why

The family file can be opened and created, but nothing can be put in it. People
are the core entity: relationships, the tree and export all depend on being
able to add and persist a person first.

## What Changes

- A people list in the loaded-family view, with **Add person**, **Edit** and
  **Delete**.
- First scope is **names only**: a person has at least one first name or one
  last name (matching `NamedPerson`). Other `Person` facets (birth, life
  status) stay in the data model but get no UI yet.
- Every change is saved to the family file immediately (atomic write); a failed
  save reverts the in-memory change and shows an error.
- New framework-agnostic module `src/data/people.ts` (pure add / update /
  remove functions over `FamilyData`), wrapped by the family store.

## Capabilities

### New Capabilities

- `person-record`: creating, listing, editing, deleting and persisting people
  (names only for now).

### Modified Capabilities

None.

## Impact

- Code: new `src/data/people.ts`, additions to `src/store/family.ts`, new
  `src/views/PeopleView.vue` and a person form component, `FamilyLoadedView`
  replaced by the people list.
- Data model: no type changes. Names require a `date` per entry; the UI stores
  a fully-unknown `VariablePrecisionDate` (see design.md).
- Tests: unit tests for `people.ts` and the store; one scoped Playwright e2e;
  new section in `MANUAL_TESTS.md`.
- Dependencies: none.
