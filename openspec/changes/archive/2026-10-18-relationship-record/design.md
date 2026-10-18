# Design

## Decisions (made without a user round-trip, change freely)

- **Scope: permanent parent-child and partners only.** Temporary natures need
  status plus dates; that UI is better designed together with date editing.
- **Cycle rule.** Adding parent P of child C is rejected when P is already a
  descendant of C (walk child links from C looking for P). Direct and
  multi-generation loops are both caught.
- **Duplicates.** Parent-child: same parent and child, any nature, rejected.
  Partners: same unordered pair with the same status rejected (a couple may
  legitimately have "ended" then "ongoing" entries).
- **Cascade on person delete.** The confirmation text reports the number of
  relationships removed. The alternative (block deleting) was rejected as
  more annoying for a data-entry tool.
- **Unordered partners** are stored as `personAId` / `personBId` in the order
  chosen; display and duplicate checks ignore the order.
- Pure functions in `src/data/relationships.ts`; the store reuses the existing
  save-then-commit `mutate`.

## UI

Two selects (person A, person B), a type select (Parent of / Partner of), a
nature or status select, and an Add button. List rows read like
"Ada Lovelace is parent of Byron (biological, confirmed)" with a Delete
button. The section is disabled with a hint until two people exist.
