# Proposal

## Why

The family file is JSON precisely so it can live in a git repository and be
synced (see DECISIONS.md). There is no way to do that from the app.

## What Changes

- A **Sync with Git** button in the family header.
- It commits the open family file, pulls remote changes (rebase) and pushes,
  in the repository that contains the file, using the user's own `git`
  installation and credentials.
- The data is reloaded after a sync, since a pull may have changed the file.
- The button is replaced by a one-line reason when sync is not possible:
  git missing, file not in a repository, or repository without a remote.
- A conflict aborts the rebase, leaves the local commit intact and tells the
  user to resolve it with git.

## Capabilities

### New Capabilities

- `git-sync`: sync the open family file through git.

## Impact

- Rust: new `src-tauri/src/git.rs`, two commands (`git_status`, `git_sync`),
  with unit tests against temporary local repositories.
- TS: `PlatformAPI.git`, Tauri implementation, store actions, header UI.
- No new plugins or permissions; no network code in the app: `git` does it.
- Data model and file format unchanged.
