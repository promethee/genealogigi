# Proposal

## Why

Parent links can only be biological or adoptive. Real families also have
step-parents, foster parents and guardians whose role starts and may end. The
data model already supports these (nature, status, start/end dates); the UI and
validation do not.

## What Changes

- Parent-child form gains natures **step**, **foster**, **guardian**.
- For those natures the form also asks for a **status** (ongoing / ended /
  unknown), a **start date** (any part optional) and, when ended, an **end date**.
- Validation: end date cannot be certainly before the start date.
- Relationship list shows the status and period, e.g.
  "Ada is parent of Byron (foster, 1990–1995)".
- Pedigree draws these links dashed, like other non-confirmed links.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `relationship-record`: temporary parent natures with status and dates.
- `pedigree-tree`: temporary parent links are drawn and explained.

## Impact

- Code: `src/data/relationships.ts`, `RelationshipsSection.vue`,
  `PedigreeTree.vue` (legend text), store unchanged in shape.
- Data model and file format unchanged.
- Tests: unit tests for relationships; scoped e2e; manual steps.
- Dependencies: none.
