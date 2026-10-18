# Design

## Decisions (made without a user round-trip, change freely)

- **Notify, don't install.** Tauri's updater needs a signing key pair and a
  hosted manifest, and only helps once installers are published. A banner linking
  to the release page works with a plain GitHub release and no secrets. Con: the
  user downloads and runs the installer themselves. Can be upgraded later to
  `tauri-plugin-updater` (the banner and store stay; only "Download" changes).
- **Source: GitHub Releases API** (`/repos/promethee/genealogigi/releases/latest`:
  excludes drafts and pre-releases). 404 (no release yet) = no update.
- **Pure `update.ts`**: version parsing and comparison (semver `x.y.z`, leading
  `v` allowed, pre-release suffix ignored for comparison only when equal numbers
  would compare equal: a pre-release is older than the same release), release
  parsing, and `checkForUpdate(fetch, current)` with a 5 s timeout. No Tauri.
- **`fetch` from the webview** is a web standard, not a shell capability, so it
  is allowed outside `PlatformAPI`; opening the link in the system browser, the
  window title and the dismissed version go through `PlatformAPI`.
- **Window title at runtime** (`setTitle`), because a static config title cannot
  read the version. The static title stays "Genealogigi".
- **One version source:** `package.json` feeds the UI through a Vite `define`;
  a unit test compares it with `tauri.conf.json` and `Cargo.toml`.
- **Dismissed version** stored in the settings store; a manual check ignores it.
- **Silent by default:** startup shows nothing unless an update exists. The
  manual button reports every outcome.
- **Privacy:** only a GET for public release info, no identifiers beyond what
  every HTTP request carries. Stated in the README.
- **Missing shell support** (the e2e fakes): every platform call is guarded.
