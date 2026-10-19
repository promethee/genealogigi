## Decisions

- **Message wording**: one i18n key `store.writeFailed` (en/fr) used by two helpers (`writeFamily`, `writeText`) wrapping all platform writes; the original error is kept as `cause` and logged. Chosen over mapping OS error codes: simplest and the same advice fits every cause.
- **Case**: `toStoredName` (trim only) at save, `toDisplayName` (capital after space, hyphen, apostrophe; other letters untouched) at every display site and when filling the edit form. First planned as lowercase storage; changed on the owner's call to keep the typed formatting ("McDonald").
- **Legacy data**: no migration needed; nothing is rewritten. Searching and filtering were already case-insensitive.
- **File names (option C)**: keep accents, normalize to NFC, cap the stem at 100 characters; macOS returns decomposed accents and Windows expects composed ones. Stripping accents was rejected: it loses the user's spelling.
- **Disabled Add**: a `canSubmit` computed (both people chosen); the in-function guards stay as a safety net.
- **Fused parent type**: one form (parent, optional other parent, child). An empty other parent adds one link; a chosen one calls the existing two-parent add, with the "also partners" checkbox shown only then. Chosen over two kinds because users could not tell "Parent of" from "Parents of".
