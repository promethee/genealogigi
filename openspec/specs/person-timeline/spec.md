# person-timeline Specification

## Purpose
TBD - created by archiving change person-timeline. Update Purpose after archive.

## Requirements

### Requirement: Timeline on the person card

The person card SHALL show a chronological timeline of the person's life built
from what is recorded: birth (date and place), dated name changes, partnerships
beginning and ending, the births of their children, fixed-period parent links
(step, foster, guardian) beginning and ending, user events, and death (date and
place). Entries are ordered by date; entries without a usable date come last,
birth first and death last among them.

#### Scenario: Ordered

- **WHEN** a person was born in 1950, took a married name in 1975, had a child in 1980 and died in 2020
- **THEN** the timeline lists those four entries in that order

#### Scenario: Name change

- **WHEN** a person has a married last name Dubois dated 1975
- **THEN** the timeline shows that they took the married name Dubois in 1975

#### Scenario: Birth name is not an event

- **WHEN** a name has kind birth and no date
- **THEN** it does not appear in the timeline

#### Scenario: Partnership

- **WHEN** a partnership with Paul started in 1972 and ended in 1990
- **THEN** both the start and the end appear, each naming Paul

#### Scenario: Children

- **WHEN** a child was born in 1980
- **THEN** "child born" with the child's name appears in 1980

#### Scenario: Partial dates

- **WHEN** an entry only has a year, or year and month
- **THEN** it is shown with that precision and ordered by it

#### Scenario: Undated

- **WHEN** an entry has no known year
- **THEN** it appears after the dated ones as "date unknown"

#### Scenario: Empty

- **WHEN** nothing is recorded for a person
- **THEN** the timeline says there is nothing yet and offers Add event

#### Scenario: Related people

- **WHEN** an entry involves another person
- **THEN** their name is a link that opens their card

### Requirement: Add an event to a person

The card SHALL offer Add event: a type, an optional date (any part optional,
not in the future), an optional place, an optional description, and other people
involved. The event SHALL be saved with the person and every person involved.

#### Scenario: Marriage with another person

- **WHEN** the user adds a marriage in 1975 in Lyon on Ada's card with Paul as the other person
- **THEN** the event appears on both Ada's and Paul's timelines

#### Scenario: Type other needs a description

- **WHEN** the type is Other and the description is empty
- **THEN** nothing is saved and an error asks for a description

#### Scenario: Future date

- **WHEN** the date is in the future
- **THEN** it is rejected

#### Scenario: Several people

- **WHEN** the user adds more than one other person
- **THEN** all of them are linked; the same person cannot be added twice and the person whose card it is cannot be added to themself

#### Scenario: Persisted

- **WHEN** the user adds an event and restarts the app
- **THEN** the event is still on the timeline

#### Scenario: Old files

- **WHEN** a file without events is opened
- **THEN** it loads and timelines show no events

### Requirement: Edit and delete events

User events SHALL be editable and deletable from the timeline (delete after
confirmation). Entries derived from other data (birth, names, partnerships,
children, death) are changed where they live, not in the timeline.

#### Scenario: Edit

- **WHEN** the user edits an event's place and saves
- **THEN** the timeline and every involved person's timeline show the new place

#### Scenario: Delete

- **WHEN** the user deletes an event and confirms
- **THEN** it disappears from all involved timelines

#### Scenario: Derived entries

- **WHEN** the timeline shows a birth entry
- **THEN** it has no Edit or Delete button
