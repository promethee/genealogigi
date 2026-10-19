## Why
The manual test list covers what the browser e2e cannot: the real window, real files, the real settings store and real restarts. Running it by hand each time is slow and error-prone.

## What Changes
- A `real-app/` suite drives the real Tauri app through WebDriver (tauri-driver) under a virtual display: `npm run test:real`.
- A dev-only seam answers the native file dialogs; everything after the dialog is real.
- The matching rows of MANUAL_TESTS.md are marked as automated; the rest stay manual.
- A separate on-demand/weekly CI workflow runs it on Linux.
