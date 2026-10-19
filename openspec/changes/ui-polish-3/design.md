## Decisions

- **Confirm tone**: an optional `tone: "safe"` on `PlatformAPI.confirm` (default unchanged), so only the share question changes and the shell seam stays one method. Confirm is focused first for safe questions, Cancel for risky ones.
- **Person name**: made plain text rather than fixing the click: the View button already opens the card, and on a narrow window the card opens above the list, out of sight, which made the name look broken.
- **Partner colour**: rose (`#e11d48`, `#fb7185` in dark). The main focused tree has no partner segments, so the colour applies to the small tree and the new whole-family chart.
- **Maximized**: `"maximized": true` in the window config; the previous 1100x750 stays as the restored size.
