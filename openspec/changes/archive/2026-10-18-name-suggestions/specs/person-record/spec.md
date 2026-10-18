## ADDED Requirements

### Requirement: Last-name suggestions

The person form SHALL suggest, for every last-name field, the last names
already recorded in the family, most frequent first and then alphabetically,
without duplicates (ignoring case), and SHALL still accept any typed value.

#### Scenario: Suggestions from saved people

- **WHEN** Dubois (twice) and Martin are already saved and the add-person form opens
- **THEN** the last-name field offers Dubois, then Martin

#### Scenario: Married names count

- **WHEN** a person has birth last name Martin and married last name Dubois
- **THEN** both names are offered

#### Scenario: Case-insensitive

- **WHEN** "dubois" and "Dubois" are saved
- **THEN** only one of them is offered

#### Scenario: Nothing saved yet

- **WHEN** no last name is saved
- **THEN** no suggestions are offered and typing still works

#### Scenario: Free typing

- **WHEN** the user types a name that is not suggested
- **THEN** it is accepted as typed
