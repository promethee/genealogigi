# Design

## Layers

1. `src/data/people.ts`: pure functions `addPerson`, `updatePerson`,
   `removePerson` returning a new `FamilyData`. No Vue, no Tauri.
2. `useFamilyStore`: `addPerson` / `updatePerson` / `removePerson` actions that
   apply the pure function, save through `PlatformAPI.data.save`, and roll
   back on failure.
3. Vue: `PeopleView.vue` (list) and `PersonForm.vue` (add/edit), thin.

## Decisions

- **Names entered as plain text, mapped to the model.** The form has "First
  name" and "Last name" fields. Each non-empty field becomes one
  `PersonFirstName` / `PersonLastName` with `kind: "birth"` and
  `date` = fully unknown (`raw: "9999-01-01T00:00"`, all `*Known: false`).
  Rationale: the model requires a `date` and `kind`, but asking for them on
  day one is friction. Multi-name editing (nicknames, married names, dates)
  is a later change.
- **Editing preserves other data.** Updating names must not drop `born` or
  `lifeStatus` already in the file. Only the name facet is replaced, and only
  when the form shows exactly one first/last name; a person with several
  names is shown read-only in the form for now.
- **Delete is unconditional for now** because no relationship exists yet. The
  relationship change must add the rule for deleting a person who has
  relationships.
- **Save per change, not a Save button.** Simplest mental model, matches the
  "file is the source of truth" decision, and the atomic write keeps it safe.
- **Display name:** "First Last", falling back to whichever exists.

## Risks

- A person with several names cannot be fully edited in the UI yet. Mitigated
  by read-only display and the edit being a named later change.
- Saving the whole file on every edit is fine for hundreds of people
  (see DECISIONS.md storage entry).
