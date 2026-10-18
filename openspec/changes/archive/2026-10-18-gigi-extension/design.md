## Decisions
- Content stays JSON; only the extension changes. No schema bump.
- Open/import dialogs accept `gigi` and `json` (existing files keep working); save dialogs offer `gigi`.
- Backup name: `<name>.backup-<date>-<time>-<hash8>.<ext>` with the source's extension (default `gigi`). Reason: the backup stays openable as a family file.
- No rename/migration of existing `.json` files: they open as before.
