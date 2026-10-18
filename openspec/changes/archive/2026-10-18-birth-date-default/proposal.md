# Proposal

## Why

The birth date fields are blank with no hint of what to type, and nothing
stops an impossible date in the future.

## What Changes

- The birth **year** box shows a grey example (current year minus 30, e.g.
  "e.g. 1996") as its placeholder. It is a hint only: nothing is saved unless
  the user types it.
- **Future dates are rejected:** a birth or death date that is certainly after
  today (comparing the year, then month, then day, as far as they are known)
  is refused with "Birth date cannot be in the future." / "Death date ...".
- Partial dates keep working: a year in the past is fine whatever the month.

## Capabilities

### Modified Capabilities

- `person-record`: birth date hint and no future dates.

## Impact

- `dates.ts` (`isInFuture`), `people.ts` (validation), `PersonForm.vue`
  (placeholder), i18n keys. Data model unchanged.
