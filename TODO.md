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

- [x] Draft site copy — commercial-landing-page tone (hero pitch, key benefits, feature highlights) while clearly and persuasively framing it as free (not "free version of a paid thing" — free as the actual pitch)
- [x] Write the "named after my grandma Gigi" story section (two sentences; the author may extend it) (personal detail reserved for this site, not the repo description)
- [x] Capture polished screenshots (fictional family; no GIFs) of the app in use (tree visualization is the priority visual — it's the most demo-able feature)
- [x] Build the page (`docs/index.html`; neutral style, fountain-editor alignment not checked) (static, consistent with existing portfolio project pages — check fountain-editor's docs/index.html approach for style consistency)
- [x] Add download/install instructions (build from source; releases page linked) (or a direct download link once releases exist)
- [~] Link the GitHub Pages site: README done; still to do in GitHub: Settings → Pages → deploy from `main` `/docs`, then set the repo "Website" field

## Testing policy

Manual tests (`MANUAL_TESTS.md`) are run once at the end, after most features are done. Automated unit, e2e and lint/typecheck run on every feature.

## Backlog / later

- [x] Descendant chart (OpenSpec `descendant-chart`, archived 2026-10-18)
- [x] Hourglass chart (OpenSpec `hourglass-chart`, archived 2026-10-18)
- [x] Fan chart — dropped 2026-10-18 (judged ugly; not how relationships should be shown). Code in git history, commit 2ab97d3
- [x] Git-based sync (OpenSpec `git-sync`, archived 2026-10-18): manual button, runs the user's own git
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

- **2026-10-18 (cont.)** — Implemented change `tree-default` after asking the user: the Tree tab opens first when the family has relationships; the People tab otherwise. Relationships list stays a list. 3 existing e2e fixed to click the People tab after resume; 2 new e2e. 135 unit, 53 e2e.

- **2026-10-18 (cont.)** — Implemented change `git-sync`: Rust `git.rs` (status, commit+pull --rebase+push, abort on conflict; 7 cargo tests on temporary local repos), `PlatformAPI.git`, store `gitStatus`/`syncGit` queued with saves, header button or reason hint. CI runs `cargo test`. 141 unit, 7 cargo, 57 e2e. Manual steps added (needs a real remote). Not automatic: manual button only.

- **2026-10-18 (cont.)** — Implemented change `portfolio-site`: static `docs/index.html` (free-as-the-pitch hero, feature cards, 3 screenshots of a fictional family, name note, build-from-source steps), screenshots in `docs/screenshots/`, README status and link. Checked at 1280 and 375 px, no horizontal overflow. Left for the user: enable GitHub Pages and set the "Website" field.

- **2026-10-18 (cont.)** — Implemented change `name-change-ui`: person form is simple by default; "+ Last name changed (e.g. marriage)" adds a Married row that becomes the main name; "+ First name changed" adds a Current row (not main); detailed controls appear only with several names or a dated/kinded one; list/selects show "Marie Dubois (née Martin)", tree boxes show née before the lifespan; "Primary" is now "Main name"; autofill off. 144 unit tests. Existing name e2e updated for the new default.

- **2026-10-18 (cont.)** — Implemented change `i18n-en-fr`: hand-rolled typed i18n (`src/i18n`, English + French catalogs, plurals, French month names), EN/FR switch in a top bar on every screen, language remembered via `PlatformAPI.settings`, first launch follows the system language, every UI string, error, confirmation and relationship/life text translated, git sync results/errors are now codes from Rust translated in the UI. 159 unit, 7 cargo, 65 e2e. Website and OS dialog buttons not translated. Manual steps added.

- **2026-10-18 (cont.)** — Implemented change `vertical-tree`: tree charts are vertical (ancestors above the root, oldest at the top; descendants below; hourglass both). Same layout algorithm with axes swapped (`level`/`slot`), vertical elbow links, centred and scrollable. Site screenshots and captions regenerated. 163 unit, 75 e2e. Manual steps added.

- **2026-10-18 (cont.)** — Implemented change `ui-polish` after hands-on feedback: language switch with SVG flags and native names (English / Français); shared design system (`.btn`, `.input`, `.card`, `.chip`), top bar, welcome card, pill tabs, avatar initials, icon buttons (Edit/Delete now look like buttons), softer tree boxes; new people start as Living and switch to Deceased by themselves for birth years over 110 years back (until the user picks); confirmed biological parent links are shown unmarked in the relationships list. 167 unit, 84 e2e. Site screenshots to be regenerated.

- **2026-10-18 (cont.)** — Implemented change `name-suggestions`: last-name fields suggest names already saved (most frequent first, case-insensitive) through a native datalist, including the married-name row; first names not suggested. Renamed `Icon.vue` to `AppIcon.vue` (lint rule). Manual steps added.

- **2026-10-18 (cont.)** — Implemented changes `two-parents` (relationship form defaults to "Parents of": child + two parents + nature added atomically, optional "also record as partners" with status unknown) and `birth-date-default` (grey example birth year = current year − 30, as the user chose; birth and death dates in the future rejected). 183 unit, ~97 e2e. Manual steps added.

- **2026-10-18 (cont.)** — Implemented change `person-detail`: read-only person card (names, birth/death date and place, parents, partners, children, siblings; relatives are links) with Edit (returns to the card) and Delete (Delete now only on the card, not in list rows); optional birth and death places (optional model fields, suggestions from saved places); tree click opens the card below the chart, double-click or "Show tree from here" re-roots, selected box outlined; "born/died" wording; logo and app icon flipped (tree growing upward). 199 unit, 113 e2e.

- **2026-10-18 (cont.)** — Implemented change `app-version-update`: version 0.1.0 (single source in package.json, test checks tauri.conf.json and Cargo.toml), window title "Genealogigi 0.1.0" set at runtime, startup check of the GitHub latest release (silent unless newer) with a Download/Dismiss banner (dismissal remembered per version), "Check for updates" button in the top bar, link opened in the system browser via `tauri-plugin-opener` (scoped to this repo). No auto-install: notify only; `tauri-plugin-updater` is the upgrade path once signed installers exist. 225 unit, 7 cargo, 123 e2e.

- **2026-10-18 (cont.)** — Implemented change `person-parents`: the add-person form has an optional Parents section (Parent 1/2 from existing people, permanent natures, optional "also record as partners"); person and links are saved together or not at all (`createPerson.ts`). Hidden when nobody exists and when editing. Step/foster/guardian stay in the relationships form (they need dates). 234 unit, 131 e2e.

- **2026-10-18 (cont.)** — People list rows now have a **View** button (eye icon) that opens the person card, replacing the row Edit button (the name still opens it too); Edit and Delete are on the card. e2e updated accordingly.

- **2026-10-18 (cont.)** — Implemented change `tree-siblings`: "Show siblings" checkbox (ancestors and hourglass views) draws the root's siblings, including half-siblings, on the root's row linked to their shared parents (older left, younger/unknown right); the card's X became an explicit **Close** button. 241 unit, 138 e2e.

- **2026-10-18 (cont.)** — Implemented change `person-timeline`: the person card has a **Timeline** (birth, dated names, partnerships, children's births, fixed-period parent links, user events, death; date order, undated last) and **Add event** (marriage, divorce, baptism, residence, occupation, education, military, emigration, immigration, other; partial date, place, description, other people involved). User events are editable/deletable; deleting a person updates events. Stored as optional `events` in the file. 261 unit, ~150 e2e. The small family tree in the card is the next change.

- **2026-10-18 (cont.)** — Implemented change `person-mini-tree`: the card shows a small tree of the immediate family (parents above, partners beside, children below; dashed + noted for non-confirmed natures; boxes open cards; hidden when empty). Pure layout in `miniTree.ts`. 269 unit, 154 e2e.

- **2026-10-18 (cont.)** — Implemented change `dark-theme`: light/dark theme (class strategy; slate scale remapped through CSS variables, semantic `surface`/`page`/`link` colours, `dark:` variants for coloured panels, tree and small-tree colours as CSS variables); sun/moon button in the top bar; first launch follows the system, a click is remembered (platform setting + localStorage copy to avoid a flash); transitions paused while switching; contrast measured by a test in both themes. 278 unit, ~163 e2e.

- **2026-10-18 (cont.)** — Implemented change `person-photos`: up to 12 photos per person (first = main, captions, make main, remove with confirmation), added from the card with a multi-file picker (`PlatformAPI.pickImages`, `fs:allow-read-file`), shrunk to 480 px JPEG on a canvas and stored inside the family file (optional `photos`); avatars in the card header, people list and both trees; tree boxes redesigned with a round portrait (photo or coloured initials) at the left (200x56); viewer with navigation, caption, make main, remove. 306 unit, ~176 e2e. Photos are in the form of the card only (not the edit form).

- **2026-10-18 (cont.)** — Fixes from hands-on use: timeline "Child born: X" now says "with" the child's other parent (never the child); the person card's **Close** button moved to the bottom right (also in the tree tab); **baptism** is no longer offered as an event type (old events still load, show and can be edited); every Delete (person list/tree card, relationship, event, photo) is covered by a test that proves it asks for confirmation first, in the active language.

- **2026-10-18 (cont.)** — French: "living" is now "vivant(e)" (summary and the life-status choice), matching "décédé(e)".

- **2026-10-18 (cont.)** — People list: a living person is no longer marked "living" (it is the normal case); only births and deaths are shown. The card's Life section still states the status ("living" / "vivant(e)").


- **2026-10-18 (import-export)** — Implemented `import-export`: Export… (replaces Save a copy), Import… (replace after native confirmation; backup `<name>.backup-yyyyMMdd-HHmmss-<sha256 first 8>.json` written, read back and verified before anything changes; damaged items skipped and listed as warnings; newer schema refused), Close family (back to the welcome screen). Pure modules `backup.ts`, `importFamily.ts`; `PlatformAPI.data.readRaw/writeRaw`. Real-app run deferred (MANUAL_TESTS.md "Export, import and close").

- **2026-10-18 (gigi-extension)** — Family files now use `.gigi` (JSON inside): default names, save dialogs; Open/Import still accept `.json`; backups keep the source extension. Archived `gigi-extension`.

- **2026-10-18 (confirm-dialog, wide-layout)** — Confirmations use an in-app themed dialog (Tauri `confirm` -> `askConfirm`, Cancel focused, Esc/backdrop cancel); French "Fratrie / sororité"; people list and relationships side by side from 1280px, content width up to 120rem. Archived both. Real-window check deferred (MANUAL_TESTS.md).

- **2026-10-18 (tree-fit-width, focused-person)** — Tree SVG scales to the panel (floor 45%, then scrolls); "Root person" is now "Focused person" (fr "Personne ciblée"), Generations defaults to All, and a panel shows counts of ancestors/descendants per generation, siblings and partners (`focusStats`). Archived both.

- **2026-10-18 (website)** — New landing page `docs/index.html` (hero, download CTA to Releases, tree/card/list screenshots in light+dark JPEGs from a seeded demo family, feature tiles, `.gigi` privacy section, FAQ). NOT public: GitHub Pages stays off until the owner reviews it (Settings → Pages, `main` `/docs`).

- **2026-10-18 (update-invitation)** — Update banner now invites with the version ("Download version X"), shows the release link (click opens it through the shell), and shows the link to copy if the browser cannot be opened. Archived `update-invitation`.

- **2026-10-18 (people-search)** — Search box above the tabs (names incl. maiden/married/nickname, birth/death places; accent/case-insensitive; all words must match). List view filters, tree view highlights matches in amber, a result focuses the tree on the person. Landing page rewritten shorter and aimed at non-technical users (no file-format talk). Archived `people-search`.

- **2026-10-18 (landing page v3)** — Page cut to: hero, three benefits (Simple / Free / Yours), "Every person has a story" card section, final call to action. No FAQ, no file-format talk, no name story. Still not public (Pages off).

- **2026-10-18 (tree-filters)** — Tree tab filters (life status, birth/death place, birth/death month, last name), cumulative; non-matching people and their links are faded (opacity), still clickable; match count and Reset. Pure `treeFilters.ts` with tests. Archived `tree-filters`. CI run #54 went red on a Windows page-load timeout in a docs-only commit (not a test failure); failed job re-run once.

- **2026-10-18 (list polish)** — People list is a titled card with the users icon (like Relationships); the search box sits on the same line as the People/Tree switch.

- **2026-10-18 (tree-defaults)** — Tree opens as Hourglass with siblings on; search suggestions close on Enter/Escape/choice/leaving the box; French "Personne centrale". Archived `tree-defaults`.

- **2026-10-18 (map dropped)** — Person-card map considered and dropped by the owner (online needs network, offline needs a bundled gazetteer). Not planned.

- **2026-10-18 (backlog)** — Family stats dashboard deferred to v2 (size, ages, names, patterns, timeline, upcoming birthdays, to-complete list). Undo/redo, print/PDF and keyboard shortcuts rejected.

- **2026-10-18 (backlog v2)** — Automatic backups deferred to v2: on open, copy into `<name>.backups/` (skip if unchanged, keep last 10, same naming as import backups) plus a Restore… list (current file backed up first); optional second folder later. Needs `PlatformAPI` list-folder and delete. Accepted for next: person notes, single-file HTML share. Dropped: relationship calculator, guided start.

- **2026-10-18 (person-notes)** — Free-text Notes per person (form + card, line breaks kept, 20 000 chars max, searchable, sanitised on import; optional `notes` field, no schema bump). Archived `person-notes`.

- **2026-10-18 (share-web-page, ui-polish-2)** — "Share as web page…" writes ONE offline HTML file (searchable list, person cards, clickable relatives, timeline, light/dark, print-friendly; DOM built with textContent so names cannot run code). Batch of polish: Add person on the toolbar line, neutral Confirm / red Cancel, no "main" badge or default "Birth" on names, singular "Sibling"/"Frère / sœur", removed the "place in the family" heading. Archived `share-web-page`, `ui-polish-2`.

- **2026-10-18 (ui-polish-3)** — UI/UX pass: card hides "living" and an unknown partner status, mini family tree scales to its column, tree filters collapsed behind a Filters button, name rows wrap as groups. Archived `ui-polish-3`. Real-app (Linux, Xvfb + tauri-driver) test tooling installed in this environment; see the exploration notes below.

- **2026-10-18 (brand-icon)** — One mark everywhere: a tree from one trunk to four branches (`src/brand.ts`, `branding/icon.svg`); app header, welcome screen, web favicon, project page logo + favicon and the native Tauri icons (regenerated with `tauri icon`) all match; a test keeps the page equal to the app. Archived `brand-icon`.
