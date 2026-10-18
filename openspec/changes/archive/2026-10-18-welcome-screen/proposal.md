# Proposal

## Why

The app has no entry point: the file dialogs and JSON store exist, but nothing
lets the user pick, create, or resume a family file. Every later feature
(person, relationship, tree) needs a loaded family file first.

## What Changes

- New welcome screen shown at startup with three actions: **Resume** last
  family file, **Open** an existing file, **Create new** family file.
- Remembering the last opened file path between launches (drives Resume).
- After a file is loaded, the app leaves the welcome screen and shows a
  placeholder "family loaded" view (people / relationships count). Real
  features replace the placeholder in later changes.
- Clear, non-crashing error messages for unreadable or corrupt files.
- `PlatformAPI` gains what is needed to remember the last path and to tell
  "file missing" from "empty family" (see design.md).

## Capabilities

### New Capabilities

- `welcome-screen`: startup entry point for choosing which family file to work
  on (resume, open, create) and the errors around it.

### Modified Capabilities

None.

## Impact

- Code: `src/App.vue`, new `src/views/WelcomeView.vue`, new Pinia store
  `src/store/family.ts`, `src/platform/PlatformAPI.ts` + `tauri.ts`.
- Tests: unit tests for the family store (Vitest, fake `PlatformAPI`); one
  Playwright e2e covering only this feature.
- Dependencies: none new, unless the "remember last path" option in design.md
  picks `@tauri-apps/plugin-store`.
