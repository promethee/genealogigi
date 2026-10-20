# Genealogigi: development guide

How to build, test and extend Genealogigi, plus the detailed feature status.
For the project overview see [README.md](./README.md).

## Status

Version 1.0.0; website: <https://promethee.github.io/genealogigi/>. Everything in the
[README](./README.md) feature table works today. Not yet (v2): automatic backups, family
statistics, git sync (code present, UI parked), signed installers (the Windows installer of each release is unsigned). Details and history in [TODO.md](./TODO.md).

## Updates and privacy

The window title shows the version (e.g. "Genealogigi 1.0.0"). On startup the app
makes one read-only request to the public GitHub releases API to see whether a newer
release exists, and shows a banner with a download link if so. Nothing is installed
automatically, and no family data is sent. **Check for updates** in the top bar runs
the same check on demand. Offline or without releases, nothing is shown.

The version lives in `package.json`; `src-tauri/tauri.conf.json` and
`src-tauri/Cargo.toml` must carry the same one (a unit test checks it). To release:
bump all three, tag `vX.Y.Z`, publish a GitHub release with the installer.

## Stack

Tauri 2 · Vue 3 · Pinia · Tailwind CSS 4 · TypeScript · JSON file storage

Why these choices: [DECISIONS.md](./DECISIONS.md). Feature specs live in
[openspec/](./openspec) (spec-driven, see below).

## Requirements

- Node.js 24+
- Rust (stable) with the MSVC toolchain, see
  [Tauri prerequisites](https://tauri.app/start/prerequisites/) (includes
  WebView2, present by default on Windows 10/11)

## Install and run

```sh
npm install
npm run tauri:dev     # desktop app with hot reload
npm run tauri:build   # installer in src-tauri/target/release/bundle
```

## Quality checks

```sh
npm run fmt:check && npm run lint && npm run check && npm test
```

End-to-end tests (Playwright, run the UI in a browser against a fake shell):

```sh
npx playwright install chromium   # once
npm run e2e
```

Enable the pre-commit hook once: `git config core.hooksPath .githooks`.

All automated checks are catalogued in [E2E_TESTS.md](./E2E_TESTS.md); things automation cannot cover are listed in [MANUAL_TESTS.md](./MANUAL_TESTS.md).

### Real-app tests

`npm run test:real` drives the **real** Tauri app (window, files, settings store, restarts)
through WebDriver on Linux under a virtual display. It replaces most of the manual list.
One-time setup (Debian/Ubuntu):

```sh
sudo apt-get install -y xvfb xdotool webkit2gtk-driver   # plus the Tauri system packages
cargo install tauri-driver --locked
sudo locale-gen fr_FR.UTF-8                              # the French-system check (skipped without it)
cargo build --manifest-path src-tauri/Cargo.toml          # debug binary used by the tests
npm run test:real                                          # ~30 s
```

Native file dialogs cannot be clicked by WebDriver, so a dev-only seam
(`window.__GENEALOGIGI_TEST_DIALOGS__`) answers them; everything after the dialog is real. Each
run uses temporary data folders, so your own settings are untouched. CI: the on-demand /
weekly workflow `.github/workflows/real-app.yml`.

## Project layout

| Path                            | Purpose                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/data/`                     | Framework-free data model and logic (people, relationships, pedigree layout, file store) |
| `src/platform/`                 | `PlatformAPI` interface and its Tauri implementation; the only place shell APIs are used |
| `src/store/`                    | Pinia family store                                                                       |
| `src/views/`, `src/components/` | Vue UI                                                                                   |
| `src-tauri/`                    | Rust shell (Tauri config, plugins, permissions)                                          |
| `e2e/`                          | Playwright tests, one file per feature                                                   |
| `openspec/`                     | Archived feature specs (`specs/`) and in-flight changes (`changes/`)                     |

## Retaking the screenshots

The README and the project page use `docs/screenshots/` (fictional family, light and dark). With the
dev server running (`npm run dev`), `node scripts/screenshots/take.mjs` rebuilds the family with the
app's own data layer and retakes all six images (set `PW_CHROMIUM_PATH` to reuse a Chromium).

## Working on a feature (OpenSpec)

Each feature starts as a change: `openspec new change <name>`, write the
proposal, spec, design and tasks, implement, then `openspec archive <name>`.
Install the CLI once with `npm install -g @fission-ai/openspec`.

## License

MIT, see [LICENSE](./LICENSE).

## Build notes

Built with Claude Code.
