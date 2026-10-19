## Why

1. A failed write showed the operating system's raw wording ("failed to rename old path … os error 5").
2. Names typed in any case ("DUPONT", "jean") made the family look inconsistent.

## What changes

- Every write (save, export, import backup, import, share) reports "Could not write to {file}. Check that the file is present and writable."; the technical detail goes to the console.
- Names are stored in lowercase and displayed with each part capitalized (after a space, hyphen or apostrophe).

## Impact

Name values in `.gigi` files are lowercase from now on. Existing files keep their stored case until a person is edited; display capitalizes either way.

## Also in this change

- File name suggestions are NFC-normalized and capped (macOS/Windows portability).
- "Add relationship" stays disabled until the link's required people are selected.
- "Parent of" and "Parents of" fused: one "Parent of" type with an optional "Other parent"; choosing one adds both links.
