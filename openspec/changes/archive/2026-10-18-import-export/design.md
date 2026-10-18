# Design

## Decisions (made without a user round-trip, change freely)

- **Export replaces "Save a copy".** They are the same operation (a standalone
  copy of the file, JSON being the format); two buttons for one thing would
  confuse. The new name and the fuller message (path and counts) are the change.
- **Import replaces; it does not merge.** Merging two families needs identity
  matching and conflict rules the app has no basis for. Replace + a hashed backup
  is predictable and reversible. Merge can be its own feature.
- **Backup next to the file**, named `<name>.backup-<date>-<time>-<hash>.json`
  (the user's convention: file name + date suffix + hash of the previous file).
  Hash = first 8 hex chars of SHA-256 of the previous file's exact text. The
  backup is read back and compared before anything is replaced. Same folder, so
  it travels with the family and is visible; git sync stages only the family file,
  so backups stay out of the repository.
- **Local time** in the name, so it matches the user's clock.
- **Validation is structural, not semantic:** parse, shape, version, ids,
  dangling references, photo data URLs. Names and dates are trusted as written (they
  are the app's own formats). Dropped items are counted and reported as warnings
  rather than failing the import, because one broken photo should not block a rescue.
- **Newer schema is refused** (never silently downgraded). Missing version is
  accepted with a warning (a hand-made file).
- **Confirmation is the native dialog**, multi-line, naming both sides' counts, the
  replacement and the backup file name; the empty-file case has an extra line.
- **Replacement goes through the normal save path** (`mutate`), so it is queued with
  other saves and rolls back on failure.
- **Close family** awaits the save queue, clears all family state and re-reads the
  remembered path so Resume shows the family just closed. No confirmation: nothing
  can be lost because every change is saved at once.
- **Shell access:** `PlatformAPI.data.readRaw/writeRaw` (exact text in/out) added;
  hashing uses Web Crypto (`crypto.subtle`), with a small fallback hash if it is missing.
