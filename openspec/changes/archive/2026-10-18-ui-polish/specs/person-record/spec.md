## ADDED Requirements

### Requirement: Sensible life status default

A new person SHALL start with life status Living. While the user has not chosen
a status, entering a birth year more than 110 years in the past SHALL set it to
Deceased, and clearing or changing it back to a recent year SHALL restore
Living. A status the user picked SHALL NOT be changed automatically. Editing an
existing person SHALL show their stored status, including Unknown.

#### Scenario: New person

- **WHEN** the add-person form opens
- **THEN** life status is Living

#### Scenario: Old birth year

- **WHEN** the user types birth year 1815 and has not chosen a status
- **THEN** life status becomes Deceased and the death date fields appear

#### Scenario: User choice wins

- **WHEN** the user picks Living and then types birth year 1815
- **THEN** life status stays Living

#### Scenario: Existing person

- **WHEN** a person saved with unknown status is edited
- **THEN** the form shows Unknown
