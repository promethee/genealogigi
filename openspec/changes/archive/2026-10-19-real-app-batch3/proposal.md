## Why
The update check is network- and browser-dependent, so it was a manual-only block.

## What Changes
- Dev-only override of the releases address (`VITE_GENEALOGIGI_RELEASES_URL`) read by the app store.
- The real-app harness runs a local fake release endpoint and a stub system-browser opener.
- `real-app/updates.test.mjs`: 8 checks. MANUAL_TESTS.md rows marked.
