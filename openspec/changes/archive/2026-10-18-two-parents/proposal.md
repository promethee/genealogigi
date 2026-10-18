# Proposal

## Why

Most children have two parents, yet the relationship form links one parent to
one child at a time: two submissions, two repeated selections. Recording a
couple and their child should be one step.

## What Changes

- The relationship form's first type becomes **"Parents of"** and is the
  default: pick the **child**, **Parent 1** and **Parent 2**, a nature (and, for
  step/foster/guardian, status and dates), and add both links at once.
- An optional checkbox **"Also record the parents as partners"** adds a partner
  link (status unknown) when they are not already partners. Off by default.
- All or nothing: if either link is invalid (duplicate, cycle, same person)
  nothing is added and the error says why.
- The existing single "Parent of" and "Partner of" types stay.

## Capabilities

### Modified Capabilities

- `relationship-record`: add two parents of a child in one step.

## Impact

- `relationships.ts` (`addParentsOfChild`), store action, `RelationshipsSection.vue`,
  i18n keys. Data model unchanged (two ordinary parent-child links).
- Existing e2e that relied on "Parent of" being the default select it explicitly.
