## ADDED Requirements

### Requirement: Deleting a person updates events

When a person is deleted they SHALL be removed from every event; an event left
with no people SHALL be deleted.

#### Scenario: Shared event

- **WHEN** a marriage event involves Ada and Paul and Paul is deleted
- **THEN** the event remains on Ada's timeline

#### Scenario: Last person

- **WHEN** an event involves only Ada and Ada is deleted
- **THEN** the event is deleted
