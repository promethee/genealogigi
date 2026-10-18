# Proposal

## Why

Relationships can only be added and deleted. Fixing a wrong nature, status or
date means delete and re-add. Partnerships cannot carry dates at all from the
UI, although the model requires them.

## What Changes

- Each relationship row gets an **Edit** button opening an inline form.
- Parent-child edit: nature, and for step/foster/guardian the status and
  start/end dates. The two people stay fixed.
- Partner edit: status, start date and (when ended) end date. The two people
  stay fixed.
- The add form for partners also gains start/end dates.
- Partner rows show their period, e.g. "(ended, 1990–1995)".
- Same validation and duplicate rules as adding; a link never conflicts with itself.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `relationship-record`: edit relationships; partner dates.

## Impact

- Code: `src/data/relationships.ts`, `src/store/family.ts`,
  `RelationshipsSection.vue`, new `RelationshipEditForm.vue`.
- Data model and file format unchanged.
- Tests: unit, store, scoped e2e, manual steps.
- Dependencies: none.
