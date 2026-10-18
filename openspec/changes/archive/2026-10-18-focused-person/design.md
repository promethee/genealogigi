## Decisions
- Pure `focusStats(data,id)` counts each distinct person once at their nearest generation; cycles cannot loop. Rendered as chips with plural-aware i18n; generations beyond 3 read "N ancestors, generation G".
- "All" = `ALL_GENERATIONS` (99) sentinel in `clampGenerations`; the path check still cuts cycles. Default direction stays ancestors (a user who wants both picks Hourglass); only the depth limit was removed, so existing views keep their shape.
- Name: "Focused person": it says what it does (centres the chart and drives the numbers).
