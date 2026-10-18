# Design

## Decisions (made without a user round-trip, change freely)

- **Birth and death stay on the person**, not events: they already exist as facts
  and are shown by the card. The timeline *derives* entries from them, so there
  is one source of truth. Only user-added events are stored as events.
- **Derived entries:** birth (date/place), name changes (non-birth kinds, or any
  name with a known date), partnerships (start/end dates known), children's
  births, temporary parent links (start/end known), death. Undated partnerships
  and links are left out (noise).
- **Event model:** `FamilyEvent { id, kind, date, place?, description?, personIds }`
  with at least one person; `FamilyData.events?` optional so old files load.
  No schema bump. Persons may be many (a marriage has two).
- **Kinds:** marriage, divorce, baptism, residence, occupation, education,
  military, emigration, immigration, other. A fixed list keeps labels translated;
  "other" requires a description. Free text for the rest goes in the description.
- **Not in the future** (as birth and death dates); the date is optional.
- **A marriage event is independent of a partnership record.** Partnerships say
  who partners with whom and for how long; a marriage event is one dated fact. Linking
  them automatically would guess. (A shortcut to create both can come later.)
- **Order:** dated by (year, month, day) with unknown parts treated as the start of the
  period; ties: birth, then others, then death. Undated last: birth first, death last.
- **Editing events** only for user events, inline from the timeline; derived entries
  link to where they are edited (names/relationships) by their nature.
- **Person removal** cleans events (remove the person; delete empty events).
- **Pure modules:** `events.ts` (add/update/remove), `timeline.ts`
  (`timelineOf(data, personId)`), unit-tested; UI in two components.
- **Form:** "With" people are chosen from a dropdown and shown as removable chips.
