## ADDED Requirements

### Requirement: Deleting a person removes their relationships

The app SHALL remove every relationship that involves a person when that
person is deleted, and the confirmation SHALL state how many relationships
will be removed.

#### Scenario: Cascade

- **WHEN** Ada is parent of Byron and the user deletes Ada and confirms
- **THEN** Ada and the parent-child relationship are removed from the file

#### Scenario: Confirmation count

- **WHEN** a person with 2 relationships is deleted
- **THEN** the confirmation mentions 2 relationships
