# Proposal

## Why

Adding a child means adding the person, then opening the relationships form and
choosing the same person again. Parents are the most common relationship, so
they should be settable while creating the person.

## What Changes

- The **add-person form** gets an optional **Parents** section: Parent 1 and
  Parent 2 (people already in the family, both optional), a nature
  (biological confirmed / presumed / adoptive), and, when both are chosen and
  not yet partners, "Also record the parents as partners".
- Saving creates the person and the parent links in **one step**: all or
  nothing, one save.
- The section is hidden when nobody exists yet, and in edit mode (the
  relationships form and Edit there cover later changes).
- Step, foster and guardian parents need dates: they stay in the relationships form.

## Capabilities

### Modified Capabilities

- `person-record`: parents can be set when creating a person.

## Impact

- New `createPerson.ts` (person + parents), store action, `PersonForm.vue`,
  `PeopleView.vue`, i18n. Data model unchanged.
