# DECISIONS.md — Genealogigi

Chronological record of the "why" behind this project's choices. Append new
entries; don't rewrite history — if a decision changes, add a new entry that
supersedes the old one and note that explicitly.

## Project identity

- **Name:** Genealogigi — named after the author's grandmother, nicknamed "Gigi."
- **Purpose:** desktop app to manage and visualize one family's ancestry data.
  Not designed for interoperability with other genealogy tools (no GEDCOM
  import/export goal at this stage).
- **Target user:** not a power user — the app must install and update
  automatically and safely, with minimal friction.

## Desktop shell: Deno Desktop

Considered: Electron, Tauri, Deno Desktop.

- Electron rejected as a third option repeating the stack of two existing
  portfolio projects (fountain-editor, hn-reader — both Electron+React).
- Tauri rejected as the primary pick: requires a Rust backend for native
  bits, adding a second language to maintain long-term.
- **Chosen: Deno Desktop.** Reasons:
  - Built-in binary-diff auto-update (manifest + patches, automatic rollback
    on failed launch) — best fit for the "non-power-user, safe auto-update"
    requirement.
  - Full Node-compatible ecosystem access without a Rust bridge.
  - In-process bindings (no IPC serialization overhead).
  - Strongest portfolio diversification vs. existing Electron+React apps.
  - Risk (pre-stable API, smaller ecosystem) accepted because:
    - Target users are Windows-only, removing most cross-platform WebView
      inconsistency risk.
    - App scope (DB frontend + relationship visualization) stays within the
      "boring," low-edge-case usage surface of the framework.
    - The shell is architected as a thin, swappable wrapper (see below), so
      a pre-stable API shift is a shell-only fix, not a rewrite.
  - (Frameless window was attempted but abandoned — see "Window chrome:
    native, not frameless" below.)

## Shell portability

The desktop shell is explicitly treated as disposable. All shell-specific
calls are isolated behind a `PlatformAPI` interface so the Vue app, Pinia
stores, and data-access logic never call Deno Desktop APIs directly. If Deno
Desktop turns out to be a dead end, only the `PlatformAPI` implementation
needs to be swapped for another shell (e.g. Electron or Tauri).

## Frontend: Vue 3 + Pinia + Tailwind

Considered: React + Redux, Vue + Pinia.

- Author is more fluent in Redux than in plain React, and historically
  reaches for Redux specifically to tame React hooks/`useEffect` complexity.
- Vue's reactivity model avoids much of that complexity at the source, so
  Vue + Pinia isn't a downgrade from Redux — it removes the problem Redux
  was compensating for.
- Pinia has less boilerplate than Redux, favoring long-term maintainability
  for a solo side project revisited infrequently.
- Also chosen for portfolio diversification (a Vue project alongside two
  React projects).

## Storage (superseded — see "Storage: JSON-only" below)

- Not fully decided yet. Leaning: SQLite as the in-app working store (query
  performance for ancestor/descendant lookups), with a JSON export as the
  portable/canonical export format.
- Data must always be exportable, regardless of internal storage choice.
- A future git-provider-based sync (e.g. GitHub) is under consideration —
  this favors JSON (diffable) over SQLite (binary) as the sync format if/when
  built.

## Data model

- Custom schema, not GEDCOM-based. No interoperability goal — this app only
  needs to represent one family's data as gathered by its user, not exchange
  data with other genealogy software.

## Naming / GitHub presentation

- Repo name/product name: Genealogigi.
- GitHub repo description: "Desktop genealogy tracker for managing ancestry
  data and visualizing family relationships. Built with Vue + Deno Desktop.
  Named after my grandma, Gigi."
- The "named after my grandma" detail is reserved for the GitHub Pages site
  copy later, not the short repo description.

## Testing tools

- Unit tests: `Deno.test` (built-in, no extra dependency, fits Deno Desktop choice).
- E2E tests: Playwright (consistency with fountain-editor, which already uses it).

## CI: added now, not deferred

Ground-work phase includes a GitHub Actions workflow (lint + typecheck +
unit tests) on a Windows runner, matching the Windows-primary target
audience. Not deferred, since the checks are cheap to wire up alongside the
rest of the ground-work tooling and catch regressions from the start.

## Deno version pinning

Decision: pin to an exact patch version, not a minor/range pin.

- Version bumps are an agent-maintained task, not something the user handles
  directly.
- An exact pin gives the agent a well-defined, verifiable job each time
  (bump to a specific version, run full CI, report pass/fail) instead of an
  open-ended "stay within range" responsibility with no natural trigger.
- Current stable as of this decision: Deno 2.9.6 (released Aug 27, 2026).
  Pinned in `deno.json`/CI as `2.9.6`; bumps happen only as an explicit,
  agent-run task (not automatic), triggered periodically or on new Deno
  releases.

## Storage: JSON-only (supersedes earlier "SQLite working store, JSON export" note)

Decision: JSON file(s)/folder is the source of truth. No SQLite for now.

- The planned git-sync feature needs a diffable, folder-based format as its
  ongoing source of truth, not an occasional export snapshot — JSON already
  is that format, so there's no translation layer to build or keep in sync.
- End-user UX goal is that the user "owns" their data folder (backup, sync,
  portability) without ever hand-editing it or managing a DB file — a single
  JSON-backed folder is the simplest mental model for that.
- Scope is one family's data — realistically hundreds, not millions, of
  records — so in-memory load + indexing for ancestor/descendant lookups is
  expected to be fine without a query engine.
- SQLite is not ruled out permanently: if a real performance need shows up
  later (large trees, slow lookups), it can be reintroduced as a rebuildable
  cache/index over the JSON files, keeping JSON as the source of truth.

## Window chrome: native, not frameless

Attempted a frameless window (custom exit button) but hit multiple Deno
Desktop pre-stable bugs: `frameless` is silently ignored on the adopted
startup window, and the documented double-window workaround introduced
further bugs (secondary window mispositioned off-screen, close binding not
reaching the right window). Given the Windows-only target and that this is
purely cosmetic, decided to use the native Windows title bar/chrome instead.
No custom close button. Revisit if/when denoland/deno#35635 / #35969 land a
fix upstream.

## Desktop shell: Tauri 2 (supersedes "Desktop shell: Deno Desktop")

Decision (2026-10-18): replace Deno Desktop with Tauri 2.

- Deno Desktop is being abandoned upstream; it cannot be the long-term shell.
- Tauri keeps the native Windows title bar, ships small installers, has
  built-in updater and native file-dialog plugins (fits the "installs and
  updates automatically" target-user goal).
- Rejected: Electron (installer/memory bloat for a one-family app), PWA
  (File System Access API permission re-prompts break the "pick a family
  file" UX), Neutralino (same abandonment risk).
- The `PlatformAPI` abstraction is what makes this swap cheap: Vue, Pinia,
  Tailwind, the data model and JSON-file persistence are unchanged; only the
  `PlatformAPI` implementation and the shell entrypoint are replaced.

## Toolchain: Node + npm (supersedes "Deno version pinning" and Deno.test)

Decision (2026-10-18): drop the Deno CLI entirely; use Node 24 + npm.

- Tauri's CLI/plugins are npm packages and its docs assume Node; leaving Deno
  Desktop while keeping Deno as toolchain would keep the abandonment risk.
- Replacements: Vitest (unit tests), ESLint + typescript-eslint +
  eslint-plugin-vue (lint), Prettier (format), vue-tsc (type-check), Tailwind
  v4 via `@tailwindcss/vite`. Playwright stays for e2e.
- Versions are pinned by `package-lock.json` (CI uses `npm ci`).
- `store.ts` no longer touches `Deno.*`: it takes an injected `FileIO`
  (Tauri fs plugin in the app, `node:fs` in tests).
- Window close/minimize are native chrome, so `PlatformAPI` no longer exposes
  them.

## Tauri file access scope

The fs plugin scope is `**` (any path) because the user picks the family file
anywhere via the native dialog, and the atomic save writes a sibling
`<file>.tmp` that a dialog-granted single-file scope would not cover. The app
loads no remote content, so the exposure is limited. Revisit (e.g. move
load/save into Rust commands) before adding any remote content or updater
beyond the signed Tauri updater.

## Spec-driven features: OpenSpec

Decision (2026-10-18): every Phase 2 feature starts as an OpenSpec change
(`openspec/changes/<name>/`: proposal, spec deltas, design, tasks), approved
by the user before implementation, then archived into `openspec/specs/`.

- Gives a reviewable written contract per feature; fits the one-feature-at-a-time
  loop.
- Cost: some ceremony per feature, and `TODO.md` stays the high-level roadmap
  while OpenSpec holds feature detail.
- Installed as a global CLI (`@fission-ai/openspec`), not a project
  dependency. `.claude/` skills and commands are generated by `openspec init`.

## Charts: no fan chart (2026-10-18)

Decision: the fan chart was built and then removed. The user judged it ugly and
not the way relationships should be presented. Tree charts (pedigree,
descendants, hourglass) stay. Do not re-add radial layouts without asking.
The code is in git history (commit 2ab97d3).

## Git sync (2026-10-18)

Decision: sync shells out to the user's own `git` from a Rust command
(`src-tauri/src/git.rs`), behind `PlatformAPI.git`. Reasons: reuses their
credentials and ssh keys, no auth code, no new plugin scope, testable with
temporary local repositories. Cost: git must be installed (the UI says so).
Manual button only; conflicts abort the rebase and are resolved with git.

## Internationalisation: English and French (2026-10-18)

Decision: hand-rolled i18n (`src/i18n`), no library. Typed catalogs (French must
have every English key), `t()` usable in the data layer, plural keys via
`Intl.PluralRules`, month names in the catalog. The switch is a fixed top bar
(EN | FR) on every screen. Language is stored in the settings store, not in the
family file. Adding a language = a new catalog file and one entry in `LOCALES`.
Shells return codes (git sync), never sentences.

## Birth and death places (2026-10-18)

Decision: `PersonBorn.birthPlace?` and `PersonDeceased.placeOfDeath?` are optional
free-text fields; no schema version bump (files without them load unchanged,
older app versions ignore them). Places are suggested from places already saved.
Relatives (parents, children, partners, siblings) are always derived from the
stored relationships, never stored.

## Updates (2026-10-18)

Decision: notify, don't install. The app reads the latest GitHub release at startup
(and on demand) and shows a banner linking to the release page. No signing keys, no
auto-updater yet. Upgrade path: `tauri-plugin-updater` with a signed `latest.json`
once installers are published; the banner and store stay. The update request sends no
family data (README states it). The e2e fake shell never reaches the network.

## Events and the timeline (2026-10-18)

Decision: birth and death stay facts of the person; the timeline derives entries from
them, from dated names, partnerships, children's births and fixed-period parent links.
Only user-recorded events are stored: `FamilyData.events?: FamilyEvent[]` (kind, partial
date, place, description, one or more people). Optional field, no schema bump. A marriage
event is independent of a partnership record: linking them automatically would guess.

## Theme (2026-10-18)

Decision: light and dark via a `.dark` class on the root. The slate colour scale is remapped
through CSS variables so existing classes flip; `surface`, `page` and `link` are semantic
colours; coloured panels have explicit `dark:` variants; SVG trees use `--tree-*` variables.
One toggle button; first launch follows the system, a click is saved and wins. Contrast
(4.5:1 text, 3:1 muted) is asserted by a Playwright test in both themes.

## Photos (2026-10-18)

Decision: photos are embedded in the family JSON as JPEG data URLs (`Person.photos?`, first =
main, up to 12 per person, max 480 px, quality 0.85), not stored as files beside it. Reason: the
product promise is "one file you own": save-a-copy, git sync and backups keep working with nothing
extra to stage. Cost: a larger file that is rewritten on every save (about 30-100 KB per photo).
Upgrade path if families outgrow this: photos in a sibling folder referenced by name.


## Import, export and close (2026-10-18)

Decision: Import REPLACES the open family (no merge), after a confirmation naming both sides'
counts and the backup file. Reason: merging two trees needs identity matching that a
single-family file does not have. Before replacing, the current file's exact text is written next
to it as `<name>.backup-<yyyyMMdd>-<HHmmss>-<first 8 hex of SHA-256>.json`, read back and
compared; if that fails nothing changes. Validation is structural: unreadable, wrong-shape or
newer-schema files are refused; dangling links, duplicate people, bad photos and bad events are
dropped and reported. Export replaces "Save a copy" (same behaviour, richer message). Close family
awaits pending saves, then shows the welcome screen (Resume still offers the closed file).

## File extension (2026-10-18)

Decision: family files are `.gigi` with JSON content; `.json` stays readable. Reason: recognisable, associable file type without a format change (no schema bump). Backups keep the source extension so they open as family files.

## In-app confirmation and wide layout (2026-10-18)

Decision: `PlatformAPI.confirm` is unchanged but the Tauri shell answers it with a Vue modal (`ConfirmDialog`), so it follows theme and language; Cancel is the default focus. The people tab uses two columns from `xl`.

## Tree fit and focused person (2026-10-18)

Decision: the tree scales down with CSS (viewBox, max-width 100%, floor 45%), no resize observer. The chart centre is called "focused person"; Generations defaults to All (sentinel 99) and a stats panel gives the focused person's counts. Direction default unchanged.
