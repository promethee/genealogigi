# Design

## Decisions (made without a user round-trip, change freely)

- **One static HTML file**, inline CSS, no build step, no JS, no external
  fonts or scripts. Reason: simplest to host and to keep.
- **GitHub Pages from `/docs` on main.** Needs a one-time repository setting.
- **Screenshots are real app output** of a fictional family (not real people),
  captured with Playwright against the fake platform, then cropped.
- **Copy:** free is the pitch, not a discount. Only describes features that
  exist. No invented personal story: the Gigi note says only that the app is
  named after the author's grandmother; the author may extend it.
- **No download button** until releases exist: honest build-from-source steps.
- **fountain-editor style match** (TODO.md) could not be checked from here
  (separate repo); the page uses a neutral style and can be aligned later.
- **Dark mode** through CSS variables and `prefers-color-scheme`.
