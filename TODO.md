# TODO.md — Genealogigi

Legend: [ ] not started · [~] in progress · [x] done

## Phase 1 — Ground work (complete entirely before any feature work)

- [x] Initialize repo (npm project, package.json, Tauri `src-tauri/`)
- [x] Add LICENSE (MIT)
- [x] Add README.md (description, install/run instructions, link to Pages site once it exists)
- [x] Add .gitignore (Deno cache, build output, etc.)
- [x] Pin Deno version (document in README + lockfile/config) — pinned to 2.9.6 (exact patch), agent-maintained per DECISIONS.md
- [x] Scaffold Deno Desktop + Vue 3 + TypeScript + Tailwind, confirm it runs with the native Windows title bar (close/minimize/maximize working)
- [x] Set up lint + format (deno lint / deno fmt) as a required check (wired into CI)
- [x] Set up type-checking as a required, fast check (wired into CI)
- [x] Set up unit test runner: `Deno.test` (placeholder test in `src/data/store.test.ts`)
- [x] Set up e2e test tool: Playwright (config only, no tests yet)
- [x] Define the `PlatformAPI` interface (window control, file access, DB access, exit) and implement it for Deno Desktop
- [x] Set up JSON file-backed data store (load/save, atomic writes) behind `PlatformAPI` — supersedes earlier SQLite connection layer item
- [x] Wire up basic Pinia store structure (empty/skeleton is fine)
- [x] Decide final storage approach — JSON-only (folder as source of truth), decision recorded in DECISIONS.md; SQLite deferred, may be added later as a cache/index if needed
- [x] Add CI (lint + typecheck + unit tests on push) — added rather than deferred; see DECISIONS.md
- [x] Confirm ground work checkpoint: lint, typecheck, and unit tests all pass cleanly on a clean checkout

- [x] Re-verify on a clean checkout after Deno→Tauri migration: `npm ci`, fmt, lint, check, test pass on a copy of tracked files; `cargo check` passes (Linux, with GTK libs). Full `tauri build` (Windows installer) not run
- [x] Replace placeholder app icon (green tile with a pedigree diagram, regenerated via `npx tauri icon`)

## Phase 2 — Features (one at a time, each with scoped e2e tests)

- [~] Feature: define + persist a person record (names only) — OpenSpec change `person-record`; archived 2026-10-18; real-app run 2026-10-18 passed (see checkpoint log); remaining manual steps listed there
- [~] Feature: welcome screen (resume / open / create) — OpenSpec change `welcome-screen`; archived 2026-10-18; manual run of MANUAL_TESTS.md still unconfirmed
- [x] Feature: birth date, life status and death date (OpenSpec `person-dates`, archived 2026-10-18)
- [x] Feature: several names per person with primary marker, kinds, dates, ordering (OpenSpec `person-names`, archived 2026-10-18)
- [x] Feature: step, foster and guardian parents with status and dates (OpenSpec `temporary-parents`, archived 2026-10-18)
- [x] Feature: edit relationships and partner dates (OpenSpec `edit-relationships`, archived 2026-10-18)
- [~] Feature: define + persist a relationship (parent-child permanent natures, partners) — OpenSpec change `relationship-record` archived 2026-10-18; real-app run 2026-10-18 passed (see checkpoint log); remaining manual steps listed there
- [~] Feature: basic family tree visualization (pedigree) — OpenSpec change `pedigree-tree` archived 2026-10-18; real-app run 2026-10-18 passed (see checkpoint log); remaining manual steps listed there
- [x] Feature: save a copy of the open family (OpenSpec `save-copy`, archived 2026-10-18) — covers the JSON-export need, since the file is already JSON
- [x] Feature: data export (JSON) — closed: covered by save-copy, the family file is already JSON
- [ ] (Add more features here as they're defined — keep one feature per checklist item, don't pre-plan too far ahead of current progress)

## Phase 3 — GitHub Pages portfolio site

Do this once the app has enough working, screenshot/demo-worthy features to show (revisit timing after Phase 2's first few features land).

- [ ] Draft site copy — commercial-landing-page tone (hero pitch, key benefits, feature highlights) while clearly and persuasively framing it as free (not "free version of a paid thing" — free as the actual pitch)
- [ ] Write the "named after my grandma Gigi" story section (personal detail reserved for this site, not the repo description)
- [ ] Capture polished screenshots/GIFs of the app in use (tree visualization is the priority visual — it's the most demo-able feature)
- [ ] Build the page (static, consistent with existing portfolio project pages — check fountain-editor's docs/index.html approach for style consistency)
- [ ] Add download/install instructions (or a direct download link once releases exist)
- [ ] Link the GitHub Pages site from the repo README and GitHub repo settings ("Website" field)

## Testing policy

Manual tests (`MANUAL_TESTS.md`) are run once at the end, after most features are done. Automated unit, e2e and lint/typecheck run on every feature.

## Backlog / later

- [x] Descendant chart (OpenSpec `descendant-chart`, archived 2026-10-18)
- [x] Hourglass chart (OpenSpec `hourglass-chart`, archived 2026-10-18)
- [x] Fan chart — dropped 2026-10-18 (judged ugly; not how relationships should be shown). Code in git history, commit 2ab97d3
- [ ] Git-based sync (GitHub) via JSON export
- [ ] Verify `npm run tauri:dev` HMR in the real window
- [ ] Frameless/custom window chrome (Tauri supports it; not needed now)

## Checkpoint log

- **2026-09-08** — Ground-work scaffold drafted: deno.json, LICENSE, .gitignore, README, Deno Desktop entrypoint, `PlatformAPI` + stub impl, SQLite connection/migrations, Vue/Tailwind/Vite configs, App.vue skeleton, Pinia skeleton, Deno.test placeholder, Playwright config, GitHub Actions CI (Windows runner). Open items: Deno version pin, storage approach decision, local checkpoint verification.

- **2026-09-08 (cont.)** — Storage decision reversed: SQLite dropped in favor of JSON-only (file/folder as source of truth), per git-sync UX goal. Reworked `PlatformAPI`, `deno-desktop.ts`, added `src/data/store.ts` (atomic load/save), removed `src/db/`. Deno version pinned to 2.9.6 (exact patch, agent-maintained) in CI. Updated `.gitignore` accordingly.

- **2026-09-08 (cont.)** — Fixed stale comment in `PlatformAPI.ts` (`data` block previously referenced "SQLite layer" from before the JSON rewrite). Cleaned up two stale TODO.md lines left over from prior merges (Deno pin line, unit test runner line referencing deleted `src/db/connection.test.ts`).

- **2026-09-08 (cont.)** — Corrected the Deno Desktop scaffold: the original `src/main.ts` was based on a fabricated `@deno/desktop` import and a nonexistent `--unstable-desktop` flag. Replaced with the real API: `Deno.serve()` + `Deno.BrowserWindow` in `main.ts`, `win.bind()`/`bindings.*` for the Deno↔webview bridge (`deno-desktop.ts` now only registers bindings; `PlatformAPI.ts` wraps the `bindings` proxy on the webview side), `FamilyData` moved to a shared `src/data/types.ts`. Fixed `deno.json`: dropped `name`/`version`/`license` (spurious "exports" warning), dropped `singleQuote` override (use default double quotes), excluded `AGENTS.md`/`DECISIONS.md`/`TODO.md`/`README.md` from `deno fmt`. Added `.gitattributes` (`eol=lf`) to fix line-ending diff noise. Fixed `require-await` lint errors in binding stubs. `dev`/`build` tasks now use the real `deno desktop` command. Open: confirm `src/data/store.ts` actually exists in the checkout (was missing when verification ran), then re-run clean-checkout verification.

- **2026-09-08 (cont.)** — Reverted the frameless-window attempt: dropped the double-window workaround and custom exit button, `main.ts` now uses a single `Deno.BrowserWindow` with native title bar/chrome. Confirmed working (single correctly positioned window, native close/minimize/maximize). Ground-work scaffold item for window chrome is now fully verified.

- **2026-09-09** — Worked through the full data model in `src/data/types.ts`: branded `UuidId<Brand>` (generic, replacing per-entity id types), `Person` built from optional facets (`NamedPerson` — first/last names as arrays with kind + `VariablePrecisionDate`, non-empty-array-enforced; `PersonBorn`; `PersonLiving`/`PersonDeceased` for life status).  `VariablePrecisionDate` models partial-precision dates (raw + known-flags, year-unknown sentinel 9999). `Relationship` split into `RelationshipFamilial` (permanent: biological/adoptive; temporary: step/foster/guardian, each with ongoing/ended/unknown status) and `RelationshipSocial` (same three-way status pattern). No relationship type hardcodes parent role/count or partner gender. Derived relationships (sibling, grandparent, etc.) are explicitly out of scope for storage — to be computed, not stored, when built. Fixed a duplicate `UnknownRelationship` declaration bug during review. Person/relationship persistence (the actual store/CRUD layer) is still to come — types only so far.

- **2026-09-09 (cont.)** — Threaded an explicit `filePath` through the persistence layer end-to-end: `loadFamilyData`/`saveFamilyData` in `store.ts`, `PlatformAPI.data.load/save`, the `bindings` global, and `registerBindings` in `deno-desktop.ts` — replacing the earlier hardcoded `./data/family.json` path, per the "family = a single JSON file, user picks the location" UX decision. Added `schemaVersion` to `FamilyData`. Fixed `store.test.ts` (missing filePath args, missing schemaVersion in test fixture) using a temp file for the round-trip test. `deno task check` and `deno lint` both pass. Still stubbed: `openFileDialog`/`saveFileDialog` in `deno-desktop.ts` — needed next for the welcome screen (resume/create-new) to actually function.

- **2026-10-18** — Migrated shell and toolchain: Deno Desktop → Tauri 2, Deno CLI → Node/npm (Vitest, ESLint, Prettier, vue-tsc, Tailwind v4). `store.ts` now takes an injected `FileIO`; `PlatformAPI` has a Tauri implementation (`src/platform/tauri.ts`) with real open/save dialogs; native chrome, so close/minimize removed from the API. Hook and CI rewritten for npm. fmt, lint, typecheck, 3 unit tests, `vite build` and `cargo check` pass. Not yet run: `tauri dev` in a real window. See DECISIONS.md.

- **2026-10-18 (cont.)** — OpenSpec adopted for feature specs (`openspec/`, DECISIONS.md). Implemented change `welcome-screen`: `PlatformAPI` gained `data.exists` and `settings` (last file path via `@tauri-apps/plugin-store`), Pinia `useFamilyStore` (`src/store/family.ts`), `WelcomeView` + placeholder `FamilyLoadedView`. 10 new unit tests, 3 Playwright e2e (fake shell via dev-only `window.__GENEALOGIGI_PLATFORM__`), `MANUAL_TESTS.md` for real dialogs. Not yet verified by hand: the real dialogs and settings persistence.

- **2026-10-18 (cont.)** — Implemented change `person-record` (names only): pure `src/data/people.ts` (add/update/remove, display name, preserves other facets), store actions with save-then-commit, rollback on failure and serialized saves, `PlatformAPI.confirm` (native dialog), `PeopleView` + `PersonForm` replacing the placeholder view. 22 new unit tests (35 total), 6 new Playwright e2e (9 total). Not yet verified by hand: real native confirm dialog and file persistence (see MANUAL_TESTS.md, Person record).

- **2026-10-18 (cont.)** — Implemented and archived `relationship-record`: `src/data/relationships.ts` (parent-child with permanent natures, partners with status, self/duplicate/cycle validation), person delete now cascades relationships (confirm states the count), store actions, `RelationshipsSection.vue`. Unit tests 55 total, e2e 15 total. Temporary natures (step/foster/guardian) and date editing deferred. Manual steps for person-record and relationships still unconfirmed (MANUAL_TESTS.md).

- **2026-10-18 (cont.)** — Implemented and archived `pedigree-tree`: pure layout `src/data/pedigree.ts` (any parent count, shared ancestors drawn per path, cycle/depth safe), `PedigreeTree.vue` (hand-rolled SVG, no new dependency, root picker, generation picker, dashed non-confirmed links, legend, click to re-root), People/Tree tabs. Unit tests 68 total, e2e 20 total. E2E caught a blank root dropdown (fixed). Not yet verified by hand: see MANUAL_TESTS.md.

- **2026-10-18 (real-app run)** — Drove the real Tauri app (WebView2 over CDP) with genuine native open/save/confirm dialogs and a real app restart: 27 checks passed. Covered: welcome 1-9 (first launch, create, resume after restart, open, cancel, corrupt file, missing remembered file, cancelled create), settings.json persistence, atomic save (no .tmp), people add/edit/blank/persist, delete cancel/confirm with relationship cascade, parent-child add and cycle rejection, tree root/click re-root. Not covered (still manual): save failure on a read-only file, very long name ellipsis, narrow-window scrolling, visual styling in the real window, partner/duplicate/status steps (covered by e2e only), generation-limit and dashed-line steps (e2e only).

- **2026-10-18 (save-copy)** — Implemented and archived `save-copy`: store `saveCopy` + `notice` (serialized with other saves, same-file guard ignoring case/slash style), Save a copy button in `PeopleView`. Unit tests 73 total, e2e 24 total. Real app (native dialogs): cancel, successful copy (file identical, no .tmp, notice, snapshot semantics) verified. NOT verified in the real app: same-file refusal and notice-clearing, because the harness could not answer Windows replace-existing-file prompt (covered by unit + e2e only). See MANUAL_TESTS.md Save a copy 5-7.

- **2026-10-18 (checkpoint)** — Tauri 2 + Node migration done; features archived in OpenSpec: welcome-screen, person-record (names only), relationship-record, pedigree-tree, save-copy. 73 unit + 24 e2e tests, lint, typecheck, build, cargo check all pass. Manual tests deferred to the end (see Testing policy); real-app run covered the main flows. Next candidate: birth/death dates in the UI.

- **2026-10-18 (person-dates)** — Implemented and archived `person-dates`: pure `src/data/dates.ts` (partial dates, validation, formatting, certainly-before comparison), people module handles birth/life status/death with keep-unsent-facets update semantics, form fields, list summary, tree lifespan line. Store action `renamePerson` renamed `editPerson`. Unit tests 99 total, e2e 29 total. Manual steps added to MANUAL_TESTS.md (run at the end per Testing policy). Next candidates: multiple names per person, step/foster/guardian parents.

- **2026-10-18 (person-names)** — Implemented and archived `person-names` exactly as designed (user answers: explicit primary marker, editable partial dates on names, Up/Down ordering; optional `primary` flag, schemaVersion stays 1). New `NameEntriesEditor.vue`, entry-list form input with single-string shorthand kept for callers, no more read-only lock. A real bug found by e2e and fixed: form deep copy now JSON-based (structuredClone threw on reactive proxies). ESLint `no-undef` off for .vue (vue-tsc covers it). Unit tests 109 total, e2e 36 total. Manual steps added (run at the end). Next candidate: step/foster/guardian parents.

- **2026-10-18 (cont.)** — Implemented change `temporary-parents`: parent links can be step/foster/guardian with status (ongoing/ended/unknown), partial start/end dates, end-before-start validation, per-nature duplicate rule, period shown in the list, legend updated. New `DateFields.vue`. 116 unit tests, 40 e2e, fmt/lint/typecheck/build green. Manual steps added to `MANUAL_TESTS.md`.

- **2026-10-18 (cont.)** — Chores: new app icon; CI now also runs build, Playwright e2e (chromium) and `cargo check`; removed two stray family JSON files from `src-tauri/` and ignored `src-tauri/*.json` (except `tauri.conf.json`). Clean-copy check: fmt, lint, typecheck, 116 unit tests pass; `cargo check` passes. Manual tests still pending.

- **2026-10-18 (cont.)** — Implemented change `edit-relationships`: inline Edit on each relationship (nature, status, dates; people fixed), shared add/update builders in `relationships.ts`, partner start/end dates in add and list, new `RelationshipEditForm.vue`. Closed the redundant "data export (JSON)" item. 125 unit tests, 44 e2e. Manual steps added.

- **2026-10-18 (cont.)** — Implemented change `descendant-chart`: Tree tab "Show" select (Ancestors/Descendants); `buildPedigree` gained a `direction` parameter reusing the same layout. 131 unit tests, 48 e2e. Manual steps added.

- **2026-10-18 (cont.)** — Implemented change `hourglass-chart`: nodes gain `column`; hourglass layout composes the ancestors and descendants layouts around one root; links drawn in either direction. 135 unit tests, 51 e2e. Manual steps added.

- **2026-10-18 (cont.)** — Removed the fan chart (reverted 2ab97d3) at the user's request: ugly, and not the way relationships should be shown. Pedigree, descendants and hourglass remain.
