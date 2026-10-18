# Proposal

## Why

Nobody can tell which version they run, and an installed desktop app never
learns that a newer one exists. Installers do not exist yet, but the check
should be there when releases start.

## What Changes

- The **window title** shows the name and version: "Genealogigi 0.1.0".
- The version lives in one place (`package.json`); `tauri.conf.json` and
  `Cargo.toml` must match it, enforced by a test. Bumped to 0.1.0.
- **On startup** the app asks GitHub for the latest release
  (`promethee/genealogigi`). If it is newer, a banner offers **Download**
  (opens the release page in the browser) and **Dismiss** (remembered for that
  version). Silent when offline, when there is no release, or when up to date.
- A small **Check for updates** button in the top bar runs the same check on
  demand and says "You are up to date" or shows the banner.
- Updates are **never installed automatically**: the user downloads and runs the
  new installer. No signing keys, no auto-updater.

## Capabilities

### New Capabilities

- `app-update`: version display and update check.

## Impact

- `vite.config.ts` (version constant), `appInfo.ts`, `update.ts` (pure), app
  store, `UpdateBanner.vue`, `PlatformAPI` (window title, open link, dismissed
  version), Rust: `tauri-plugin-opener`, capability for the window title.
- Network: one GET to `api.github.com` at startup (no family data sent).
- Website wording adjusted: family data never leaves the computer.
