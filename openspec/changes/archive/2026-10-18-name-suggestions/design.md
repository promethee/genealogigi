# Design

## Decisions (made without a user round-trip, change freely)

- **Native `<datalist>`.** Zero dependencies, accessible, works in WebView2,
  filters as the user types. Con: browser-styled popup, not themeable.
- **Source:** every last-name entry of every person (birth, married, current,
  other), trimmed, blanks dropped.
- **Order:** by number of occurrences (descending), then alphabetical
  (locale-aware). Case-insensitive grouping; the most common spelling is shown,
  ties broken alphabetically.
- **No cap** on the list: a family file holds tens of names, not thousands.
- **Last names only**, as requested.
- **Computed by a pure function** over the people list; passed to the form as a
  prop so the form stays framework-agnostic about where data lives.
