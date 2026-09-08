# TODO.md — Genealogigi

Legend: [ ] not started · [~] in progress · [x] done

## Phase 1 — Ground work (complete entirely before any feature work)

- [ ] Initialize repo (Deno project structure, deno.json) — deno.json drafted, run `deno init`/`git init` locally
- [x] Add LICENSE (MIT)
- [x] Add README.md (description, install/run instructions, link to Pages site once it exists)
- [x] Add .gitignore (Deno cache, build output, etc.)
- [x] Pin Deno version (document in README + lockfile/config) — pinned to 2.9.6 (exact patch), agent-maintained per DECISIONS.md
- [x] Scaffold Deno Desktop + Vue 3 + TypeScript + Tailwind — App.vue, main.ts, vite/tailwind configs drafted; confirm it actually runs as a frameless window with working exit button
- [x] Set up lint + format (deno lint / deno fmt) as a required check (wired into CI)
- [x] Set up type-checking as a required, fast check (wired into CI)
- [x] Set up unit test runner: `Deno.test` (placeholder test in `src/data/store.test.ts`)
- [x] Set up e2e test tool: Playwright (config only, no tests yet)
- [x] Define the `PlatformAPI` interface (window control, file access, DB access, exit) and implement it for Deno Desktop
- [x] Set up JSON file-backed data store (load/save, atomic writes) behind `PlatformAPI` — supersedes earlier SQLite connection layer item
- [x] Wire up basic Pinia store structure (empty/skeleton is fine)
- [x] Decide final storage approach — JSON-only (folder as source of truth), decision recorded in DECISIONS.md; SQLite deferred, may be added later as a cache/index if needed
- [x] Add CI (lint + typecheck + unit tests on push) — added rather than deferred; see DECISIONS.md
- [ ] Confirm ground work checkpoint: lint, typecheck, and unit tests all pass cleanly on a clean checkout — pending local run

## Phase 2 — Features (one at a time, each with scoped e2e tests)

- [ ] Feature: define + persist a person record (core entity)
- [ ] Feature: define + persist a relationship (parent/child, spouse)
- [ ] Feature: basic family tree visualization (single chart type, e.g. pedigree)
- [ ] Feature: data export (JSON)
- [ ] (Add more features here as they're defined — keep one feature per checklist item, don't pre-plan too far ahead of current progress)

## Phase 3 — GitHub Pages portfolio site

Do this once the app has enough working, screenshot/demo-worthy features to show (revisit timing after Phase 2's first few features land).

- [ ] Draft site copy — commercial-landing-page tone (hero pitch, key benefits, feature highlights) while clearly and persuasively framing it as free (not "free version of a paid thing" — free as the actual pitch)
- [ ] Write the "named after my grandma Gigi" story section (personal detail reserved for this site, not the repo description)
- [ ] Capture polished screenshots/GIFs of the app in use (tree visualization is the priority visual — it's the most demo-able feature)
- [ ] Build the page (static, consistent with existing portfolio project pages — check fountain-editor's docs/index.html approach for style consistency)
- [ ] Add download/install instructions (or a direct download link once releases exist)
- [ ] Link the GitHub Pages site from the repo README and GitHub repo settings ("Website" field)

## Backlog / later

- [ ] Additional chart types (descendant, fan, hourglass)
- [ ] Git-based sync (GitHub) via JSON export
- [ ] Investigate true Vite HMR under `deno desktop` (current dev task rebuilds Vue then relaunches; `--hmr` / per-framework dev-server integration not yet verified for a plain Vite/Vue SPA)

## Checkpoint log

- **2026-09-08** — Ground-work scaffold drafted: deno.json, LICENSE, .gitignore, README, Deno Desktop entrypoint, `PlatformAPI` + stub impl, SQLite connection/migrations, Vue/Tailwind/Vite configs, App.vue skeleton, Pinia skeleton, Deno.test placeholder, Playwright config, GitHub Actions CI (Windows runner). Open items: Deno version pin, storage approach decision, local checkpoint verification.

- **2026-09-08 (cont.)** — Storage decision reversed: SQLite dropped in favor of JSON-only (file/folder as source of truth), per git-sync UX goal. Reworked `PlatformAPI`, `deno-desktop.ts`, added `src/data/store.ts` (atomic load/save), removed `src/db/`. Deno version pinned to 2.9.6 (exact patch, agent-maintained) in CI. Updated `.gitignore` accordingly.

- **2026-09-08 (cont.)** — Fixed stale comment in `PlatformAPI.ts` (`data` block previously referenced "SQLite layer" from before the JSON rewrite). Cleaned up two stale TODO.md lines left over from prior merges (Deno pin line, unit test runner line referencing deleted `src/db/connection.test.ts`).

- **2026-09-08 (cont.)** — Corrected the Deno Desktop scaffold: the original `src/main.ts` was based on a fabricated `@deno/desktop` import and a nonexistent `--unstable-desktop` flag. Replaced with the real API: `Deno.serve()` + `Deno.BrowserWindow` in `main.ts`, `win.bind()`/`bindings.*` for the Deno↔webview bridge (`deno-desktop.ts` now only registers bindings; `PlatformAPI.ts` wraps the `bindings` proxy on the webview side), `FamilyData` moved to a shared `src/data/types.ts`. Fixed `deno.json`: dropped `name`/`version`/`license` (spurious "exports" warning), dropped `singleQuote` override (use default double quotes), excluded `AGENTS.md`/`DECISIONS.md`/`TODO.md`/`README.md` from `deno fmt`. Added `.gitattributes` (`eol=lf`) to fix line-ending diff noise. Fixed `require-await` lint errors in binding stubs. `dev`/`build` tasks now use the real `deno desktop` command. Open: confirm `src/data/store.ts` actually exists in the checkout (was missing when verification ran), then re-run clean-checkout verification.
