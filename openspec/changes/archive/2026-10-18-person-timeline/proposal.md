# Proposal

## Why

A person's card lists facts but not their life as a sequence. Genealogy is
about events: birth, marriage, moves, name changes, children, death. Users also
need to record events the app does not infer, and some involve other people
(a marriage).

## What Changes

- The person card shows a **timeline**: birth, name changes (with dates),
  partnerships beginning and ending, children's births, foster/step/guardian
  periods, user-added events, and death, in date order; undated entries last.
- The user can **add an event** to a person: a type (marriage, divorce,
  baptism, residence, occupation, education, military service, emigration,
  immigration, other), an optional partial date, an optional place, an optional
  description, and **other people** involved. The event then appears on every
  involved person's timeline.
- User events can be **edited and deleted** from the timeline.
- Deleting a person removes them from events; an event left with nobody is
  deleted.
- Events are stored in the family file as an optional `events` list (old files
  load unchanged).
- The small family tree in the card is a separate change.

## Capabilities

### New Capabilities

- `person-timeline`: timeline and events.

### Modified Capabilities

- `person-record`: deleting a person updates events.

## Impact

- Types (`FamilyEvent`, `FamilyData.events?`), new `events.ts`, `timeline.ts`,
  store actions, `EventForm.vue`, `PersonTimeline.vue`, `PersonDetail.vue`, i18n.
  No schema version bump (optional field).
