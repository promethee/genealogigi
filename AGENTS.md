# AGENTS.md — Genealogigi

You are working in the Genealogigi repo, a desktop genealogy app for managing
and visualizing one family's ancestry data.

## Stack

- Shell: Deno Desktop (frameless window, custom exit control, Windows-primary target)
- Frontend: Vue 3 (`<script setup>`) + Pinia + Tailwind CSS
- Language: TypeScript throughout
- Storage: SQLite (working store); JSON export planned (future git-sync target)
- Data model: custom, single-family scope — no GEDCOM/interoperability layer

Full rationale for every choice above lives in `DECISIONS.md` — read it before
proposing changes that touch stack, architecture, or scope.

## Architectural rule: shell portability

The desktop shell (Deno Desktop) is treated as a thin, swappable wrapper.
All shell-specific calls (window lifecycle, file dialogs, DB bindings, exit)
MUST go through a single `PlatformAPI` abstraction — never called directly
from Vue components or Pinia stores. If you need a new shell capability, add
it to the `PlatformAPI` interface first, then implement it for Deno Desktop.

## Workflow — follow this order strictly

### Phase 1: Ground work (do this first, entirely, before any feature work)

Set up the project skeleton and every tool that prevents regressions before
writing feature code:

- Project scaffold (Deno Desktop + Vue + TS + Tailwind wired together)
- Linting + formatting (deno lint/fmt or equivalent) wired into a pre-commit step
- Type-checking as a required, fast check
- Unit test runner configured (even with zero tests yet)
- The `PlatformAPI` interface + a Deno Desktop implementation stub
- SQLite connection layer + migration mechanism
- CI (if/when added) running lint + typecheck + unit tests

Do not start on any user-facing feature until this phase is checked off in
TODO.md.

### Phase 2: Features, one at a time

For each feature:

1. Implement the feature (UI + store + data layer as needed).
2. Write e2e test(s) covering ONLY this feature — do not write e2e tests for
   other features "while you're in there," and do not go back and add e2e
   coverage for previously shipped features unless asked.
3. Run the full existing test suite + lint + typecheck before considering the
   feature done.

### Git checkpoints

At natural stopping points (end of ground work, end of each feature, or when
asked), you:

1. Update `TODO.md` — check off what's done, add/adjust upcoming items, and
   append a dated entry to the Checkpoint log.
2. Propose a git commit message (conventional-commits style preferred:
   `feat:`, `chore:`, `test:`, etc.) for the user to review and run themselves.
   Do not run `git commit` yourself unless explicitly told to.

When presenting a checkpoint, clearly separate the two: label the Checkpoint
log text and the proposed commit message as distinct items, don't blend them
into one block.

### Decision points

Whenever a situation requires the user's input or a decision from them
(a fork in approach, a tradeoff, an ambiguous requirement), present the
options as honest pros & cons for each — don't just pick one silently or
ask an open-ended question. Be direct about downsides, including for the
option you'd lean toward.

## General conventions

- TypeScript everywhere; no `any` without a comment explaining why.
- Keep components/stores framework-agnostic where the logic isn't inherently
  Vue/Deno-specific — favor plain TS modules for data/query logic, thin
  Vue wrappers on top.
- When a decision is made or changed during a session (stack, data model,
  scope), record it in `DECISIONS.md` before moving on.

## Response format

- Be explicit about every change: either
  1. a precise snippet with clear location context (file path, surrounding
     lines or a marker like "after function X" / "replace the `foo()` body"),
     OR
  2. the full updated file.
     Default to (1) — precise snippets — for token efficiency. Only use (2) when
     the user asks for it, or when a change is too scattered/extensive for a
     snippet to stay unambiguous.
- Keep responses precise, concise, and limited in length. No "scroll-worthy"
  answers — no padding, no restating context back, no exhaustive
  explanations — unless the user explicitly asks for more detail.
