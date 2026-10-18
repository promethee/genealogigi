# Design

## Decisions (answered by the user on 2026-10-18)

1. **Primary name = explicit marker.** Each name entry may carry
   `primary: true`. The user chooses it in the form.
2. **Each name carries an editable partial date** (year, month, day, any part
   optional), reusing the date inputs and validation from `person-dates`.
   A blank date is stored as the fully-unknown date, as before.
3. **Ordering = Up / Down buttons** per entry. No drag and drop, no automatic
   ordering.
4. **File format: optional flag, no version bump.** `schemaVersion` stays 1.
   When no entry in a list is marked primary (all existing files), the first
   entry of that list is the primary one. If several are marked (corrupt
   file), the first marked wins.

## Consequences of those decisions

- **Per list.** First names and last names each have their own primary. The
  display name is "primary first name + primary last name", or just whichever
  exists.
- **Saving normalises.** On save, exactly one entry per non-empty list gets
  `primary: true` (the one the user chose; if the chosen row was blank and
  dropped, the first remaining row). Other entries carry no flag.
- **Kinds.** First names: birth, current, nickname, other. Last names: birth,
  married, current, other. New rows default to "birth".
- **Rows.** Blank-value rows are dropped on save. A person must still end up
  with at least one name (first or last), else "At least one name is
  required."
- **Form defaults.** A new person form shows one empty first-name row and one
  empty last-name row; an existing person shows their stored entries (plus an
  empty row for a list that has none).
- **Dates on names** show their year/month/day. Hours and minutes of a stored
  name date are not editable and are not preserved on save (names are
  date-only in the UI).
- **No read-only lock** any more: every person is editable, and all names
  round-trip through the form.

## Implementation note (API only, no behaviour change)

`PersonFormInput` accepts either lists (`firstNames`, `lastNames`) or the
simple strings (`firstName`, `lastName`). Lists win when given. The simple
strings stay as shorthand for callers that edit a single name; for a person
who has several names they are refused (`NamesNotEditableError`) because they
cannot express the others.
