# Design

## Decisions (made without a user round-trip, change freely)

- **Inline edit form** below the row (not a modal): consistent with the page,
  no new component framework. One edit open at a time.
- **People are fixed.** Changing who is linked is delete + re-add; it would
  re-trigger cycle checks and blur the meaning of "edit".
- **Same id, same position** in the list after edit.
- **Shared builders** in `relationships.ts` for add and update so validation
  and duplicate rules cannot diverge; update ignores the link being edited
  when checking duplicates.
- **Partner dates:** add form gains optional start/end; blank = unknown date.
  End-before-start rejected, as for parent links.
- **Partner duplicate rule unchanged** (same pair and same status), now also
  excluding itself on edit.
- **Permanent <-> temporary** nature changes allowed in edit; dates dropped
  when the new nature is permanent.
- **Partner display:** status, then period as for temporary parents
  ("ongoing, from 1990", "ended, 1990–1995"); no extra text when dates unknown,
  so existing rows read as before.
- **Store action** `editRelationship(id, input)`; persists immediately and
  rolls back on failure like other mutations.
