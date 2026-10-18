# Design

## Decisions (made without a user round-trip, change freely)

- **New form type "Parents of", default.** It is the most common case. The
  single-parent type stays for adding a second parent later or a lone parent.
- **Field order: Child, Parent 1, Parent 2.** You think "this child, these
  parents". No gender or role is implied by the order.
- **One nature for both links.** The common case; a different nature for one
  parent is set afterwards with Edit.
- **All or nothing** by building on `addParentChild` twice over immutable data
  (a throw discards both) and saving once.
- **Partners checkbox, off by default.** Recording a partnership from a shared
  child is an inference (adoptive/step cases, separated parents), so it is
  opt-in. Status "unknown" is the honest value. Hidden when already partners.
- **No tolerance for an existing link:** an existing identical link is an
  error, as for single links; use "Parent of" to add the missing parent.
- **Test ids:** `rel-child`, `rel-parent-a`, `rel-parent-b`, `rel-partners`;
  the single-parent form keeps `rel-first`/`rel-second`.
- **Errors reuse existing messages**, plus "The two parents must be different
  people." and "Choose a child and two parents."
