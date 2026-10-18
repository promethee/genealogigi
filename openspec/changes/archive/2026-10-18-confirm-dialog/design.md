## Decisions
- Contract unchanged: `confirm(message): Promise<boolean>`; stores untouched. The Tauri `confirm` calls a small UI service (`src/lib/confirmDialog.ts`) rendered by `ConfirmDialog.vue` in `App.vue`. Shell portability holds: the dialog is plain Vue, not a shell feature.
- Multi-line messages keep their line breaks. Cancel is focused by default and Escape/backdrop cancel (safe for destructive prompts). Enter on the focused button works natively.
- Buttons: Cancel (secondary) and Confirm (primary). One generic label: the messages already say what happens.
- A second request while one is open resolves the first with `false`.
- Test seam: in dev, `window.__GENEALOGIGI_CONFIRM__` exposes the service so the e2e fake shell can use the real dialog.
