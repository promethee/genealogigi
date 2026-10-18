## Decisions
- Single source: `src/brand.ts` (`TREE_ICON_PATH`, 24x24 grid, stroked) drives the Vue components; `branding/icon.svg` is the same shape on the green gradient tile and feeds `public/favicon.svg`, the project page and the native icons (`tauri icon` from `branding/icon-1024.png`).
- Straight diagonal branches (organic, reads as a tree even at 16 px) rather than the square elbows of the chart; an earlier square-elbow draft looked like a trident and was dropped.
- A unit test keeps the project page on the same path as the app.
