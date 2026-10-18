# Design

## Flow

1. App starts, store reads the remembered last path.
2. Welcome screen renders. **Resume** is enabled only if a path is remembered
   and the file still exists; otherwise it is disabled with a hint.
3. Open: `openFileDialog` → load → remember path → leave welcome.
4. Create new: `saveFileDialog` → write empty `FamilyData`
   (`schemaVersion: 1`) → remember path → leave welcome.
5. Any failure keeps the user on the welcome screen with an error message.

## Decisions

- Logic lives in a Pinia store (`useFamilyStore`) that only talks to
  `PlatformAPI`; `WelcomeView.vue` is a thin wrapper. Unit-testable with a
  fake `PlatformAPI`.
- `PlatformAPI.data.exists(filePath)` is added because `loadFamilyData`
  returns an empty family for a missing file, which would make Resume silently
  create an empty file.

## Open question: where to remember the last path

| Option | Pros | Cons |
| --- | --- | --- |
| **A. `localStorage` behind `PlatformAPI.settings`** (recommended) | No new dependency, no Rust change, trivial to fake in tests. | Lives in the WebView profile; wiped if WebView data is cleared (user just clicks Open again). |
| **B. `@tauri-apps/plugin-store`** | Real JSON settings file in the app data dir; survives WebView resets; reusable for future settings. | New npm + Rust dependency, extra capability permissions, more setup. |

Spec text is written to be storage-agnostic, so either choice satisfies it.
