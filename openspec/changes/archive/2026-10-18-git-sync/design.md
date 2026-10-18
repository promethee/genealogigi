# Design

## Decisions (made without a user round-trip, change freely)

- **Shell out to the user's `git`** from a Rust command, not a git library and
  not the Tauri shell plugin. Reason: reuses the user's credentials, ssh keys
  and config; no auth code, no new plugin or capability scope; testable with
  plain temporary repositories. Con: requires git installed (reported clearly).
- **Behind `PlatformAPI.git`** (`status`, `sync`), per the shell-portability rule.
- **Statuses:** `no-git`, `not-repo`, `no-remote`, `ready`. Checked when the
  loaded view opens and after each sync.
- **Sync steps** in the file's folder: add the file; commit if staged changes
  exist (message "Update family data"); if the branch has an upstream, or the
  remote has a same-named branch, `pull --rebase`; then `push -u origin HEAD`.
  Only the family file is staged, never other files.
- **Conflicts:** `rebase --abort`, return an error. JSON merges are not
  attempted: the local commit stays, the user resolves with git.
- **Reload after sync** through the normal loader, so an invalid pulled file
  produces the usual error and the in-memory data is not replaced with garbage.
- **Queued with saves** on the store's existing mutation queue.
- **Missing platform git** (fake shells in e2e): status failure is treated as
  "unavailable" and the section is hidden.
- **Windows:** git is spawned with CREATE_NO_WINDOW so no console flashes.
- **No automatic sync.** Manual button only; auto-sync can come later.
