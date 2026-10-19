## Decisions
- Name lives in the file (`FamilyData.name?: string`, 80 characters max, whitespace collapsed): it travels with the family (export, copy, share) and needs no extra settings store. Files without a name still work and show their file name.
- The name prompt is an in-app dialog (like the confirmation), reached through an optional `PlatformAPI.promptText`. Optional so shells and tests without it keep the old behaviour (no name asked).
- Suggested file name is the name made safe for file systems (forbidden characters become `-`, reserved Windows names get a suffix) plus `.gigi`; the user can still change it in the native dialog.
- Resume shows the family name, read from the remembered file at startup (a failed read falls back to the file name).
- Importing a file replaces the family; if the incoming file has no name, the current family's name is kept so a rename is not lost.
- Fixed English default names (constants) for Export and Share: file names are identifiers, not interface text.
