# Genealogigi

Desktop genealogy tracker for managing one family's ancestry data and
visualizing family relationships. Built with Vue + Tauri.

## Status

Early development. Working today:

- Create, open and resume a family file (a single JSON file you choose).
- Add, edit and delete people: several names (nickname, married...) with a primary, birth date, life status and death date (dates may be partial).
- Save a copy of the open family to another file.
- Link people as parent-child (biological confirmed or presumed, adoptive) or
  as partners, with validation against duplicates and cycles.
- Pedigree chart of a person and their ancestors.

Not yet: step/foster/guardian parents,
descendant charts, other export formats. See [TODO.md](./TODO.md).

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

Things automation cannot cover (real file dialogs, real files) are listed in
[MANUAL_TESTS.md](./MANUAL_TESTS.md).

## Project layout

| Path | Purpose |
| --- | --- |
| `src/data/` | Framework-free data model and logic (people, relationships, pedigree layout, file store) |
| `src/platform/` | `PlatformAPI` interface and its Tauri implementation; the only place shell APIs are used |
| `src/store/` | Pinia family store |
| `src/views/`, `src/components/` | Vue UI |
| `src-tauri/` | Rust shell (Tauri config, plugins, permissions) |
| `e2e/` | Playwright tests, one file per feature |
| `openspec/` | Archived feature specs (`specs/`) and in-flight changes (`changes/`) |

## Working on a feature (OpenSpec)

Each feature starts as a change: `openspec new change <name>`, write the
proposal, spec, design and tasks, implement, then `openspec archive <name>`.
Install the CLI once with `npm install -g @fission-ai/openspec`.

## License

MIT, see [LICENSE](./LICENSE).

## Build notes

Built with Claude (Sonnet 5.5) in Claude Code. Token count, wall-clock time and
memory use were not recorded during the session, so no figures are given.
