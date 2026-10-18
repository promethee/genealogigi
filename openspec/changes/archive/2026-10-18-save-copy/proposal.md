# Proposal

## Why

The family file is the only copy of the data. Users want a quick way to make a
backup or a variant ("before I merge my cousin's notes") without leaving the
app or copying files by hand in Explorer.

## What Changes

- A **Save a copy…** button in the loaded-family view.
- It asks for a location with the native save dialog and writes the current
  family there (same atomic write as normal saves).
- The app keeps working on the original file; the copy is a snapshot. The
  remembered last file does not change.
- A confirmation message shows where the copy went. Failures show an error.
- Choosing the file currently open is refused, to avoid a misleading "copy".

## Capabilities

### New Capabilities

- `save-copy`: writing a snapshot of the open family to another file.

### Modified Capabilities

None.

## Impact

- Code: new store action `saveCopy` and a `notice` message in
  `src/store/family.ts`, a button and notice in `PeopleView.vue`.
- No change to the file format, `PlatformAPI` or dependencies (reuses the
  existing save dialog and data save).
- Tests: unit tests for the store, scoped Playwright e2e, manual steps.
