# Design

## Decisions (made without a user round-trip, change freely)

- **Same form, more natures.** One nature select lists all six. Status and
  date fields appear only for step/foster/guardian. Reason: one place to add
  parent links; no new screen.
- **Dates reuse `PartialDateInput` / `dateFromInput`** (year, month select,
  day). Blank start -> `UNKNOWN_DATE` (the model requires a start date). Blank
  end on an ended link -> `UNKNOWN_DATE`.
- **Default status "ongoing".** Most common case; user changes it as needed.
- **Validation:** end certainly before start is rejected via
  `isCertainlyBefore`. Unknown parts never cause a rejection.
- **Duplicates:** permanent natures keep the old rule (one permanent link per
  parent/child pair). Temporary natures are unique per parent/child/nature,
  so someone can be both step and foster parent, but not foster twice.
  A temporary link never conflicts with a permanent one.
- **Cycles / self-link** rules apply to all natures unchanged.
- **Display:** nature label, then period: ongoing/unknown with known start
  -> ", from 1990"; ended -> ", 1990–1995" (unknown side shown as "?");
  no known start on ongoing/unknown -> nothing extra. Status "unknown" shown
  as ", status unknown" when no start is known.
- **Pedigree:** no layout change. Dashed rule already covers every non-
  confirmed nature; only the legend wording and the spec change.
- **Editing links** is out of scope (delete and re-add, as today).
- **Input type:** `ParentChildInput` becomes a union keyed on `nature`;
  permanent natures carry no status/dates (old callers keep compiling).
