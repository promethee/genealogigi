## Why
The tree scrolls horizontally even when it could be scaled to fit.

## What Changes
- The tree SVG scales down to the available width (never above 100%).
- Below 45% scale it stops shrinking and scrolls, so boxes stay readable.
