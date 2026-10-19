## ADDED Requirements

### Requirement: No self-link
A person SHALL never be selectable on both sides of a new link.

#### Scenario: Same person twice
- **WHEN** the person already chosen as parent is chosen as child
- **THEN** the parent field is emptied and Add stays disabled

### Requirement: Search narrows relationship lines
While the search box is not empty, the relationship list SHALL show only links involving a matching person.

#### Scenario: Search by name
- **WHEN** the user searches "ada"
- **THEN** only the lines involving Ada are listed; clearing the search shows all lines again
