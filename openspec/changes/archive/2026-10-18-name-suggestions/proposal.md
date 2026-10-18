# Proposal

## Why

Families share last names. Retyping "Dubois" for every relative is slow and
invites spelling variants that later look like different families.

## What Changes

- Last-name inputs in the person form offer **suggestions** drawn from the last
  names already saved in the family file: most frequent first, then
  alphabetical, one entry per name (case-insensitive).
- Suggestions apply to every last-name row, including a married name.
- First names are not suggested (not requested; they rarely repeat).
- Suggestions never block typing something new.

## Capabilities

### Modified Capabilities

- `person-record`: last-name suggestions.

## Impact

- `people.ts` (suggestion list), `PersonForm.vue`, `NameEntriesEditor.vue`,
  `PeopleView.vue`. Native `<datalist>`: no dependency. Data model unchanged.
