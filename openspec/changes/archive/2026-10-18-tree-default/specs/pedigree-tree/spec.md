## ADDED Requirements

### Requirement: Tree first when relationships exist

The app SHALL open on the Tree tab when the loaded family has at least one
relationship, and on the People tab otherwise.

#### Scenario: Family with relationships

- **WHEN** the user resumes a family file that has a relationship
- **THEN** the Tree tab is shown first

#### Scenario: Family without relationships

- **WHEN** the user creates a new family or opens one with no relationships
- **THEN** the People tab is shown first
