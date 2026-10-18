## Decisions
- Pure `matchesFilters(person, filters)` in `src/data/treeFilters.ts`. A person with no data for an active filter does not match it (unknown is not "living" and has no month).
- Places compare case- and accent-insensitively and exactly; choices come from places already saved, so no typing and no typos. Last name matches any of the person's last names (maiden included).
- Faded = SVG group `opacity 0.3`; links fade when either end is faded. Fading, not hiding, keeps the chart stable and still readable (the user asked for "soft").
- Filters live in the tree component state (not saved in the file) and are independent of the search highlight (amber outline still shows on faded people).
- Counts report matches among all people, so the user sees the effect even if matches are off-screen.
