## Why
The photo rows of the manual list depend on real file reads and real image decoding.

## What Changes
- Dev-only `images` queue in the dialog seam answers the image picker with file paths.
- `real-app/photos.test.mjs`: 8 checks. Harness click falls back to a direct click when an overlay intercepts it.
- MANUAL_TESTS.md Photos rows marked.
