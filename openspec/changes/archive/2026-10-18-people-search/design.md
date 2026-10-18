## Decisions
- Pure `searchPeople(people, query)`: case- and accent-insensitive, every word must match (AND) in any first/last name (birth, married, nickname...) or birth/death place. Reason: families search by maiden name or town. Results keep file order.
- One search state in `PeopleView`, shared by both tabs, kept when switching tabs. Enter picks the first result; Escape clears.
- Tree highlight is an amber outline, distinct from the selected (blue) and focused (green) boxes. It does not hide anything, so the layout is stable (soft filters, a separate feature, will do dimming).
- The tree exposes `focusPerson(id)`; the parent calls it. No store needed.
