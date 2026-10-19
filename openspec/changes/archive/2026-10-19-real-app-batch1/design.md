## Decisions
- Same approach as real-app-tests (WebDriver + dialog seam); a second file runs after the first (sequential) with its own stack and files.
- Assertions read the real saved file, not only the screen, so a format regression shows up.
- A family with relationships reopens on the Tree tab, so the restart check switches to the People tab first.
- The failing-save check uses a read-only folder (the atomic save cannot create its temp file); root ignores permissions, so it is skipped for root and runs on the non-root CI runner. Not verified locally.
