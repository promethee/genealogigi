# Design

## Decisions (made without a user round-trip, change freely)

- **Progressive disclosure.** Detailed controls show when a person has more
  than one name in the list, or the single name has a non-default kind or a
  date. A new person sees only two text fields. Reason: most people never
  change names.
- **Marriage is the first-class case.** "+ Last name changed (e.g. marriage)"
  adds a row of kind Married, makes it the main name, and labels the date
  "Since". The birth name stays as the first row.
- **New last name is main by default; new first name is not.** The user asked
  for the married name to be reflected in the display. First-name changes are
  rare and often just a nickname or spelling, so they stay opt-in.
- **Display:** `displayName` returns "First Main (née Birth)" when a birth-kind
  last name exists and differs (case-sensitive) from the main last name.
  Trees put "née Birth" on the second line with the lifespan to keep the name
  line short (box width is fixed).
- **Only `birth` kind counts as the "née" name.** If several, the first.
- **No data-model change.** Kinds `birth` and `married` already exist.
- **Wording:** "Primary" is shown as "Main name"; data field stays `primary`.
- **Autofill off** on name and date inputs (a stray "1981" appeared in a year
  box from WebView history).
- **Not in this change:** a marriage-driven shortcut from the partnership form
  ("took partner's name"). Possible follow-up.
