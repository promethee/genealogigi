## ADDED Requirements

### Requirement: Edit a relationship

The app SHALL let the user edit an existing relationship in place: for
parent-child its nature, status and dates; for partners its status and dates.
The people involved SHALL NOT be editable. Changes are saved immediately.

#### Scenario: Change nature

- **WHEN** the user edits an adoptive link and changes the nature to foster, with start year 2000
- **THEN** the row reads "(foster, from 2000)" and it survives a restart

#### Scenario: Change partner status and dates

- **WHEN** the user edits an ongoing partnership to ended with start 1990 and end 1995
- **THEN** the row reads "(ended, 1990–1995)"

#### Scenario: Prefilled form

- **WHEN** the user opens edit on a link with saved dates
- **THEN** the fields show the saved values

#### Scenario: Invalid edit

- **WHEN** the user sets an end before the start
- **THEN** nothing changes and an error is shown

#### Scenario: Collision

- **WHEN** the edit would make a link identical to another existing link of the same pair
- **THEN** nothing changes and an error says it already exists

#### Scenario: Cancel

- **WHEN** the user cancels the edit
- **THEN** the relationship is unchanged

### Requirement: Partner dates

The app SHALL let the user give a partnership a start date and, when ended,
an end date, each with any part optional, and SHALL show the period in the list.

#### Scenario: Add with dates

- **WHEN** the user adds ongoing partners with start year 1990
- **THEN** the row reads "(ongoing, from 1990)"
