## Decisions
- WebDriver through `tauri-driver` + WebKitWebDriver on Linux, under Xvfb: the only supported way to drive a real Tauri window, no extra dependency (a ~100-line W3C client over fetch; test runner is `node:test`).
- Native dialogs are the one thing WebDriver cannot click, so `window.__GENEALOGIGI_TEST_DIALOGS__` supplies scripted answers, read only when `import.meta.env.DEV` (never in a production build). The app's own in-app confirmation is clicked for real. The look of the OS dialogs stays a manual check.
- Isolation: each run gets its own XDG data/config/cache dirs and temp files, so the developer's real settings are untouched; restarts reuse the same dirs.
- Scope: welcome flow, real file contents and atomic writes, restart persistence, export, import with dated and hashed backup, share page, settings (language, theme), remembered-file-missing, window title. Not covered (stay manual): OS dialog appearance, window icon (needs a window manager), update check (network), Windows-specific behaviour.
- CI: a separate workflow (`workflow_dispatch` + weekly), not on every push, because it compiles the Rust shell; the Windows main CI is unchanged.
- Finding: writing language and theme then closing the app immediately lost the second write only in the test (app killed mid-save), so the test waits for the settings file.
