## ADDED Requirements

### Requirement: Soft tree filters
The tree view SHALL let the user combine filters (life status, birth or death place, birth or death month, last name); people who do not match all active filters SHALL be shown faded.

#### Scenario: Living people
- **WHEN** the user chooses "Living"
- **THEN** deceased people and people with unknown status are faded and living people are not

#### Scenario: Cumulative
- **WHEN** the user also chooses a birth month
- **THEN** only people matching both stay normal
