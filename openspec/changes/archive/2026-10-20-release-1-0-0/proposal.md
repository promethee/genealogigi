## Why

Every planned v1 feature is built, tested and checked by hand (all manual rows except the installer). It is time for 1.0.0.

## What changes

- Version 1.0.0 in `package.json`, `package-lock.json`, `tauri.conf.json`, `Cargo.toml`, `Cargo.lock`.
- A `Release` workflow: pushing a tag `v*` builds the Windows installer and attaches it to a DRAFT GitHub release.
