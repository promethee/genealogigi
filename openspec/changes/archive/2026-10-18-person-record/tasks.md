## 1. Data layer

- [x] 1.1 `src/data/people.ts`: `addPerson`, `updatePerson`, `removePerson`,
      `displayName`, name-input to model mapping (unknown-date constant)
- [x] 1.2 Unit tests for `people.ts` (all name combinations, blank input,
      other-facets preserved, unique ids)

## 2. Store

- [x] 2.1 Store actions with save + rollback on failure
- [x] 2.2 Unit tests with fake `PlatformAPI` (success, save failure, restart)

## 3. UI

- [x] 3.1 `PeopleView.vue` list with empty state, replaces the placeholder
- [x] 3.2 `PersonForm.vue` add/edit with validation message
- [x] 3.3 Delete with confirmation

## 4. Verification

- [x] 4.1 One Playwright e2e for this feature only
- [x] 4.2 fmt, lint, typecheck, unit tests, manual run (MANUAL_TESTS.md)
- [x] 4.3 Update `TODO.md` + checkpoint log; propose commit message
