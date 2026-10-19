## Why

1. A failed write showed the operating system's raw wording ("failed to rename old path … os error 5").
2. Names typed in any case ("DUPONT", "jean") made the family look inconsistent.

## What changes

- Every write (save, export, import backup, import, share) reports "Could not write to {file}. Check that the file is present and writable."; the technical detail goes to the console.
- Names are stored as typed and displayed with the first letter of each part capitalized (after a space, hyphen or apostrophe).

## Impact

Name values are saved exactly as typed; display capitalizes the first letter of each part.

## Also in this change

- File name suggestions are NFC-normalized and capped (macOS/Windows portability).
- "Add relationship" stays disabled until the link's required people are selected.
- "Parent of" and "Parents of" fused: one "Parent of" type with an optional "Other parent"; choosing one adds both links.
