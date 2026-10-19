## Decisions

- **Optional string `savedWith`**, no `schemaVersion` bump: older apps ignore it and older files load unchanged.
- **Stamped in the store write helper** (`writeFamily`), so save, create, export and import all carry it; the pure data layer stays version-free.
- **Information only**: it is never used to refuse or migrate a file; `schemaVersion` still governs format.
- **Cost accepted**: a re-save rewrites that field, so a file changes after any save by a newer app.
