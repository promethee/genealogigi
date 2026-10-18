# Design

## Decisions (user chose "grey example year" when asked)

- **Placeholder, not a value.** The user wanted a sensible default; a real
  prefilled year would be saved as a made-up birth year when untouched, and
  would also drive the living/deceased auto-status. A grey example gives the
  hint without inventing data.
- **Example = current year minus 30**, a typical adult age. Constant, easy to change.
- **Future check is "certainly after today":** year, then month, then day,
  stopping at the first unknown part, like the other date comparisons. A
  current-year date with unknown month is accepted.
- **Local date** is used for "today".
- **Applies to birth and death dates** only; name "since" dates and
  relationship dates are not checked (a marriage can be planned).
