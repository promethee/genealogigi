# Design

## Decisions (made without a user round-trip, change freely)

- **Snapshot, not "Save As" switch.** After copying, the app stays on the
  original file. Switching files is already possible with Open, and keeping
  the working file stable avoids surprises about which file edits go to.
- **Same-file guard.** Paths are compared after normalising slashes and case
  (Windows paths are case-insensitive). Overwriting the open file with
  itself is harmless but would show a "copy saved" message that is not true.
- **Overwriting another existing file** is allowed: the native save dialog
  already asks the user to confirm replacing a file.
- **Notice message** lives in the family store (`notice`) and is cleared by
  any other action, so stale text never lingers.
- **Default file name** is `family-copy.json`.
- **Source of truth is the in-memory data**, which always equals the open file
  because every change is saved before it is committed.
