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
