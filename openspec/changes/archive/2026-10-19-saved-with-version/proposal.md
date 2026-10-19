## Why

A family file said which format it uses (`schemaVersion`) but not which app version wrote it, which makes support and future migrations harder.

## What changes

Every write adds `savedWith` (the app version) to the file. Informational only; no schema bump.
