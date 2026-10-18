# Proposal

## Why

The person form shows kind, date, primary and reorder controls on every name
row, even though most people never change their name. The real common case is
a wife taking her husband's last name at marriage, and the app does not show
that: the list and tree show only the primary name.

## What Changes

- The person form starts **simple**: one First name and one Last name field.
- A link **"+ Last name changed (e.g. marriage)"** adds a Married-name row with
  a "Since" date. The new last name becomes the main name by default. A
  smaller **"+ First name changed"** link does the same for first names (the
  new name does not become main automatically).
- Kind, date, main-name and reorder controls appear only once a person has
  more than one name, or a name with a kind or date set.
- Display: when the main last name differs from the birth last name, the
  person is shown as "Marie Dubois (née Martin)" in lists and selects; tree
  boxes show the name on the first line and "née Martin · 1950–" on the second.
- "Primary" is renamed "Main name" in the UI.
- WebView autofill is switched off in these inputs.

## Capabilities

### Modified Capabilities

- `person-record`: simple-first name form; name change shortcut; née display.
- `pedigree-tree`: née shown in boxes.

## Impact

- Code: `NameEntriesEditor.vue`, `PersonForm.vue`, `people.ts` (display),
  `PedigreeTree.vue`. Data model and file format unchanged.
- Existing e2e/manual steps about names are updated.
