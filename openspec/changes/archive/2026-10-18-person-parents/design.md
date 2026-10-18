# Design

## Decisions (made without a user round-trip, change freely)

- **Optional section, shown only when there is someone to choose** and only for
  new people. Editing parents stays in the relationships form to avoid two
  places that can disagree.
- **Two selects, not a search box:** families are small; selects reuse the
  labels used elsewhere ("Marie Dubois (née Martin)").
- **Nature limited to permanent ones** (biological confirmed/presumed,
  adoptive). Step/foster/guardian need status and dates, which the relationships
  form already handles; duplicating those fields here would crowd a short form.
- **Atomic:** `addPersonWithParents` builds on `addPerson` and the existing link
  functions over immutable data and saves once, so a failure anywhere discards
  everything.
- **Partners checkbox** as in the "Parents of" form: off by default, status unknown,
  hidden when they already are partners.
- **The form stays store-free:** it receives the choices and an "are partners"
  function as props and emits the parents choice with the person.
