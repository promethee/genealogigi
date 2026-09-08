# TODO.md — Genealogigi

Legend: [ ] not started · [~] in progress · [x] done

## Phase 1 — Ground work (complete entirely before any feature work)

- [ ] Initialize repo (Deno project structure, deno.json)
- [ ] Add LICENSE (MIT)
- [ ] Add README.md (description, install/run instructions, link to Pages
      site once it exists)
- [ ] Add .gitignore (Deno cache, build output, etc.)
- [ ] Pin Deno version (document in README + lockfile/config)
- [ ] Scaffold Deno Desktop + Vue 3 + TypeScript + Tailwind, confirm it runs
      as a frameless window with a working custom exit button
- [ ] Set up lint + format (deno lint / deno fmt) as a required check
- [ ] Set up type-checking as a required, fast check
- [ ] Set up unit test runner: `Deno.test` (even with a trivial placeholder test)
- [ ] Set up e2e test tool: Playwright (config only, no tests yet — used
      per-feature in Phase 2)
- [ ] Define the `PlatformAPI` interface (window control, file access, DB
      access, exit) and implement it for Deno Desktop
- [ ] Set up SQLite connection layer + migration mechanism behind `PlatformAPI`
- [ ] Wire up basic Pinia store structure (empty/skeleton is fine)
- [ ] Decide final storage approach (SQLite-only vs. SQLite+JSON hybrid) and
      record the decision in DECISIONS.md
- [ ] Add CI (lint + typecheck + unit tests on push) — or explicitly decide
      to defer and note why in DECISIONS.md
- [ ] Confirm ground work checkpoint: lint, typecheck, and unit tests all
      pass cleanly on a clean checkout

## Phase 2 — Features (one at a time, each with scoped e2e tests)

- [ ] Feature: define + persist a person record (core entity)
- [ ] Feature: define + persist a relationship (parent/child, spouse)
- [ ] Feature: basic family tree visualization (single chart type, e.g. pedigree)
- [ ] Feature: data export (JSON)
- [ ] (Add more features here as they're defined — keep one feature per
      checklist item, don't pre-plan too far ahead of current progress)

## Phase 3 — GitHub Pages portfolio site

Do this once the app has enough working, screenshot/demo-worthy features to
show (revisit timing after Phase 2's first few features land).

- [ ] Draft site copy — commercial-landing-page tone (hero pitch, key
      benefits, feature highlights) while clearly and persuasively framing it
      as free (not "free version of a paid thing" — free as the actual pitch)
- [ ] Write the "named after my grandma Gigi" story section (personal detail
      reserved for this site, not the repo description)
- [ ] Capture polished screenshots/GIFs of the app in use (tree
      visualization is the priority visual — it's the most demo-able feature)
- [ ] Build the page (static, consistent with existing portfolio project
      pages — check fountain-editor's docs/index.html approach for style
      consistency)
- [ ] Add download/install instructions (or a direct download link once
      releases exist)
- [ ] Link the GitHub Pages site from the repo README and GitHub repo
      settings ("Website" field)

## Backlog / later

- [ ] Additional chart types (descendant, fan, hourglass)
- [ ] Git-based sync (GitHub) via JSON export

## Checkpoint log

(Agent appends a short note + commit message proposal here at each checkpoint)
