## ADDED Requirements

### Requirement: Birth date example

The birth year field SHALL show a greyed example year, 30 years before the
current year, and SHALL NOT save it unless the user types a year.

#### Scenario: Placeholder

- **WHEN** the add-person form opens in 2026
- **THEN** the birth year field shows the hint "e.g. 1996" and is empty

#### Scenario: Not saved

- **WHEN** the user saves without typing a birth year
- **THEN** the person has no birth date

### Requirement: No future dates

The app SHALL reject a birth date or death date that is certainly after today.

#### Scenario: Future year

- **WHEN** the user enters a birth year after the current year
- **THEN** nothing is saved and an error says the birth date cannot be in the future

#### Scenario: This year, later month

- **WHEN** the user enters this year with a month that has not started yet
- **THEN** the date is rejected

#### Scenario: Today or earlier

- **WHEN** the date is today or in the past
- **THEN** it is accepted

#### Scenario: Partial date

- **WHEN** only the current year is entered
- **THEN** it is accepted, because it may be in the past

#### Scenario: Death date

- **WHEN** the user enters a death date in the future
- **THEN** it is rejected with the death date message
