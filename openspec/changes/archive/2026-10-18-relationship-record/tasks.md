## 1. Data layer

- [x] 1.1 `src/data/relationships.ts`: add parent-child / partners, remove,
      describe, validation errors, cycle check
- [x] 1.2 `removePerson` cascades; `relationshipsOf(person)` helper
- [x] 1.3 Unit tests for both

## 2. Store

- [x] 2.1 Store actions; delete confirmation reports relationship count
- [x] 2.2 Unit tests with fake `PlatformAPI`

## 3. UI

- [x] 3.1 `RelationshipsSection.vue` form and list, mounted in `PeopleView`

## 4. Verification

- [x] 4.1 Scoped Playwright e2e
- [x] 4.2 fmt, lint, typecheck, unit tests, e2e
- [x] 4.3 MANUAL_TESTS.md section, TODO.md, archive
