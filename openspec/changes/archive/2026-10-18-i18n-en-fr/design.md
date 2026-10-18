# Design

## Decisions (made without a user round-trip, change freely)

- **Hand-rolled i18n, no library.** About 60 lines: a reactive `locale`, `t(key,
  params)` with `{name}` placeholders, and plural keys. Reason: two languages,
  no pluralisation beyond one/other, and the data layer needs it outside Vue.
  Con: no tooling for translators; adding a language is one file.
- **Typed catalogs.** `en.ts` defines the keys; `fr.ts` is typed to have exactly
  those keys, so a missing French string fails typecheck. A unit test also
  checks both catalogs use the same placeholders.
- **`t()` is used in the data layer too** (error messages, relationship
  descriptions, life summaries, date formatting). It reads the reactive locale
  at call time, so templates update on switch and tests (English by default)
  keep their expectations. Errors are translated when thrown, so an error
  already on screen keeps its language until the next action.
- **Plurals** via `Intl.PluralRules` with keys `base.one` / `base.other`
  (French: 0 and 1 are singular).
- **Month names are catalog entries**, not `Intl`, so output is identical on
  every WebView and in tests.
- **Switch UI:** two buttons "EN" and "FR" in a fixed top-right container,
  `aria-pressed` marks the active one. Chosen over a dropdown: one click,
  always visible, only two languages.
- **Persistence:** `PlatformAPI.settings.getLanguage/setLanguage` (the
  existing settings store). Missing support in a shell (e2e fakes) is ignored.
  First launch uses `navigator.language`.
- **Git messages from Rust become codes** (`committed`, `no-changes`; errors
  `stage-failed`, `commit-failed`, ...) plus an optional git detail; the UI
  translates the code and appends the detail (git's own text stays as git
  wrote it).
- **`document.documentElement.lang`** follows the language.
- **Not translated:** the app name, file names (`family.json`), the OS dialog
  buttons, git output, the website.
- **Form state survives a switch** because the form holds data, not text.
