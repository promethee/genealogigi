# Proposal

## Why

Families move between machines and sometimes need to be restored or merged
into a clean file. "Save a copy" does half of that; there is no way to bring a
file in, and no safety net if an import goes wrong. There is also no way back to
the welcome screen once a family is open.

## What Changes

- **Export…** (replaces "Save a copy…"): writes the open family to a file of
  your choice and says what it contains (people, relationships, events, photos).
- **Import…**: choose a family file, see what it contains and what will happen,
  confirm, and the open family is **replaced** by it.
  - The file is checked first; bad files are refused with a clear reason, and
    harmless problems (links to missing people, broken photos...) are dropped
    and **reported as warnings**.
  - **Before replacing, the current file is backed up** next to it as
    `<name>.backup-<date>-<time>-<hash>.json`, where the hash is the first 8
    characters of the SHA-256 of the previous file's contents. If the backup
    cannot be written, nothing is imported.
  - Importing the open file itself, or an identical file, is detected.
- **Close family** (back to the welcome screen), with the family safely saved
  and "Resume" ready for it.

## Capabilities

### New Capabilities

- `family-import-export`: export, import with validation and backup.

### Modified Capabilities

- `welcome-screen`: return to the welcome screen from an open family.

## Impact

- New `backup.ts`, `importFamily.ts` (pure, unit-tested), store actions,
  `PlatformAPI.data.readRaw/writeRaw`, Tauri implementation, header buttons,
  icons, i18n. Data model unchanged.
- The old `save-copy` button and notice are renamed; their tests updated.
