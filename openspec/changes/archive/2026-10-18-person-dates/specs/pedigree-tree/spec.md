## ADDED Requirements

### Requirement: Lifespan in chart boxes

The app SHALL show a lifespan line under each name in the chart when birth or
death years are known.

#### Scenario: Deceased

- **WHEN** a person was born in 1815 and died in 1852
- **THEN** their box shows "1815–1852"

#### Scenario: Living

- **WHEN** a person is living and was born in 1990
- **THEN** their box shows "1990–"

#### Scenario: Nothing known

- **WHEN** a person has no dates and no life status
- **THEN** their box shows only the name
