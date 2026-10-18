## ADDED Requirements

### Requirement: Temporary parent natures

The app SHALL let the user link a parent and a child with a nature of step,
foster or guardian, with a status of ongoing, ended or unknown and a start
date; an ended link also has an end date. Every date part is optional.

#### Scenario: Ongoing foster parent

- **WHEN** the user picks nature foster, status ongoing, start year 1990, and adds
- **THEN** the link is saved and listed as "foster" with "from 1990"

#### Scenario: Ended step-parent

- **WHEN** the user picks nature step, status ended, start year 1990, end year 1995
- **THEN** the link is listed with the period "1990–1995"

#### Scenario: Dates left empty

- **WHEN** the user adds a guardian link with no dates
- **THEN** the link is saved with fully unknown dates

#### Scenario: End before start

- **WHEN** the end year is earlier than the start year
- **THEN** nothing is added and an error says the end cannot be before the start

#### Scenario: Invalid date

- **WHEN** the user enters 31 April as a start date
- **THEN** nothing is added and an error names the start date

#### Scenario: Same nature twice

- **WHEN** Ada is already a foster parent of Byron and the user adds foster again
- **THEN** nothing is added and an error says it already exists

#### Scenario: Different nature allowed

- **WHEN** Ada is a biological parent of Byron and the user adds step
- **THEN** the step link is added
