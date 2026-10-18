# Design

## Decisions (made without a user round-trip, change freely)

- **Three plain inputs per date** (year, month select, day) instead of a date
  picker. A native date picker cannot express "only the year is known".
- **Rules:** year 1 to 9998; month 1 to 12; day needs a month; the day must
  exist (leap-year aware; with an unknown year, February 29 is accepted).
  Year 9999 is reserved for the model's unknown-year sentinel.
- **Storage:** `raw` gets the sentinel/defaults for unknown parts, and the
  `*Known` flags record precision. Hours and minutes are never set.
- **Deceased with no death date** is allowed (the death is known, the date is
  not): stored as a fully-unknown date.
- **Death before birth is rejected** only when both dates are known far enough
  to compare (year, then month, then day, stopping at the first unknown part).
- **Life status "unknown"** stores no `lifeStatus` facet at all.
- **Update semantics:** the form always sends birth, status and death, so they
  replace what is stored. Callers that send only names (existing API users)
  leave those facets untouched.
- **Store rename** `renamePerson` to `editPerson`.
- **Lifespan text:** deceased "1815–1852" (unknown year shown as "?");
  living with birth year "1990–"; unknown status with birth year "b. 1815";
  otherwise empty. Boxes get a second line, and a bit more height.
