# Proposal

## Why

The app is English only. The user (and their family) read French. The
language must be switchable at any time from anywhere in the window.

## What Changes

- A **language switch EN | FR** fixed at the top right of the window, visible
  on every screen including the welcome screen.
- Every user-facing string in the app is translated: forms, lists, trees,
  errors, confirmations, notices, git sync messages, month names and dates.
- The choice is remembered between launches; the first launch follows the
  system language (French if it starts with "fr", else English).
- The data file is not affected: names, dates and relationship natures are
  stored language-independently.
- Out of scope: the GitHub Pages site (stays English), native OS dialog
  button labels (they follow the OS), more languages (the catalog design
  makes adding one a single new file).

## Capabilities

### New Capabilities

- `language`: UI language selection and translation.

## Impact

- New `src/i18n/` (core, English and French catalogs), `LanguageSwitch.vue`,
  language store, `PlatformAPI.settings.getLanguage/setLanguage`.
- Every component, the store and the data layer's user-facing strings use `t()`.
- Rust git commands return error codes, translated in the UI.
- Tests: catalog completeness, French rendering, e2e switch.
