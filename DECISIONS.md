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
  - Frameless window + custom exit button confirmed supported natively via
    `Deno.BrowserWindow`'s `frameless` option — not a workaround.

## Shell portability

The desktop shell is explicitly treated as disposable. All shell-specific
calls are isolated behind a `PlatformAPI` interface so the Vue app, Pinia
stores, and SQLite/data logic never call Deno Desktop APIs directly. If Deno
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

## Storage

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
