## 1. Platform

- [x] 1.1 Add `data.exists(filePath)` to `PlatformAPI` and the Tauri impl
- [x] 1.2 Add remembered-path get/set to `PlatformAPI` (storage per design.md)

## 2. Store

- [x] 2.1 `src/store/family.ts`: state (`filePath`, `data`, `error`), actions
      `resume`, `openExisting`, `createNew`
- [x] 2.2 Unit tests with a fake `PlatformAPI`: each scenario in the spec

## 3. UI

- [x] 3.1 `src/views/WelcomeView.vue` (Resume / Open / Create new, error text)
- [x] 3.2 Placeholder loaded view; `App.vue` switches on `filePath`

## 4. Verification

- [x] 4.1 One Playwright e2e for this feature only
- [x] 4.2 fmt, lint, typecheck, unit tests, `npm run tauri:dev` manual check (see MANUAL_TESTS.md)
- [x] 4.3 Update `TODO.md` + checkpoint log; propose commit message
