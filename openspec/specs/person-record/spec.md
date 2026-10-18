# person-record Specification

## Purpose
Create, list, edit, delete and persist people in the loaded family file. First scope is names only.

## Requirements

### Requirement: List people

The app SHALL show the people of the loaded family in a list, each by display
name, and an empty-state message when there are none.

#### Scenario: Empty family

- **WHEN** a family with no people is loaded
- **THEN** the list is empty and a message invites the user to add a person

#### Scenario: Display name

- **WHEN** a person has first name "Ada" and last name "Lovelace"
- **THEN** the list shows "Ada Lovelace"
- **AND** a person with only a last name shows just that last name

### Requirement: Add a person

The app SHALL let the user add a person with a first name, a last name, or
both, and SHALL reject a person with neither.

#### Scenario: Add with both names

- **WHEN** the user submits first name "Ada" and last name "Lovelace"
- **THEN** a person with a new unique id is added and shown in the list

#### Scenario: Add with one name

- **WHEN** the user submits only a last name
- **THEN** the person is added with no first name

#### Scenario: Add with no name

- **WHEN** the user submits both fields empty or blank
- **THEN** nothing is added and a message says at least one name is required

### Requirement: Edit a person's names

The app SHALL let the user change a person's first and last name without
losing any other data stored for that person.

#### Scenario: Rename

- **WHEN** the user changes the last name of an existing person and submits
- **THEN** the list shows the new name and the person keeps the same id

#### Scenario: Other data preserved

- **WHEN** a person has a birth date and life status in the file and the user
  edits the name
- **THEN** the birth date and life status are unchanged in the saved file

### Requirement: Delete a person

The app SHALL let the user delete a person after confirming.

#### Scenario: Confirm delete

- **WHEN** the user deletes a person and confirms
- **THEN** the person disappears from the list and from the file

#### Scenario: Cancel delete

- **WHEN** the user deletes a person and cancels the confirmation
- **THEN** the person remains

### Requirement: Changes are persisted immediately

The app SHALL write every add, edit and delete to the family file, and SHALL
undo the change in the app and show an error if the write fails.

#### Scenario: Survives restart

- **WHEN** the user adds a person, closes the app and resumes the same file
- **THEN** the person is in the list

#### Scenario: Write fails

- **WHEN** saving fails after an add
- **THEN** the person is not shown in the list and an error message is shown

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
