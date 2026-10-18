# Proposal

## Why

People are only names. Genealogy needs when someone was born and died, and
whether they are still alive. The data model already supports partial dates,
life status and death dates; the UI does not expose them.

## What Changes

- Person form gains a **birth date**, a **life status** (unknown / living /
  deceased) and, for deceased people, a **death date**.
- Dates may be partial: year, month and day are each optional (a day needs a
  month). Unknown parts are stored with the model's known-flags.
- Validation: numbers in range, real calendar days, death not before birth.
- The people list shows a short life summary, e.g.
  "b. 10 Dec 1815 · d. 27 Nov 1852".
- Pedigree boxes show a lifespan line, e.g. "1815–1852".
- Editing a person still keeps everything not shown in the form.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `person-record`: people carry birth date, life status and death date.
- `pedigree-tree`: boxes show a lifespan.

## Impact

- Code: new `src/data/dates.ts`; `src/data/people.ts`, `src/store/family.ts`,
  `PersonForm.vue`, `PeopleView.vue`, `PedigreeTree.vue`.
- Store action `renamePerson` is renamed `editPerson` (it edits more than
  names now).
- Data model and file format unchanged.
- Tests: unit tests for dates, people and store; scoped e2e; manual steps.
- Dependencies: none.
