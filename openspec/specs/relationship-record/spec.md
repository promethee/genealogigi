# relationship-record Specification

## Purpose
Create, list, delete and persist relationships between people: parent-child (permanent natures) and partners, with validation against self-links, duplicates and cycles.

## Requirements

### Requirement: List relationships

The app SHALL list the family's relationships in readable form, with an
empty-state message when there are none.

#### Scenario: Parent-child row

- **WHEN** Ada is a confirmed biological parent of Byron
- **THEN** the list shows "Ada is parent of Byron" with the nature

#### Scenario: Empty

- **WHEN** no relationships exist
- **THEN** a message says there are no relationships yet

### Requirement: Add a parent-child relationship

The app SHALL let the user link a parent and a child with a nature of
biological (confirmed), biological (presumed), or adoptive.

#### Scenario: Add

- **WHEN** the user picks parent Ada, child Byron and a nature, and adds
- **THEN** the relationship is saved and listed

#### Scenario: Same person

- **WHEN** parent and child are the same person
- **THEN** nothing is added and an error says a person cannot be their own
  parent

#### Scenario: Cycle

- **WHEN** Ada is a parent of Byron and the user makes Byron a parent of Ada
- **THEN** nothing is added and an error says it would create a cycle

#### Scenario: Duplicate

- **WHEN** Ada is already recorded as parent of Byron and the user adds it
  again
- **THEN** nothing is added and an error says it already exists

### Requirement: Add a partner relationship

The app SHALL let the user link two people as partners with a status of
ongoing, ended, or unknown, without constraining their gender.

#### Scenario: Add

- **WHEN** the user picks two different people and a status and adds
- **THEN** the partnership is saved and listed

#### Scenario: Same person

- **WHEN** both people are the same
- **THEN** nothing is added and an error is shown

#### Scenario: Duplicate ignores order

- **WHEN** Ada and Byron are partners with status ongoing and the user adds
  Byron and Ada with status ongoing
- **THEN** nothing is added and an error says it already exists

#### Scenario: Different status allowed

- **WHEN** Ada and Byron are partners with status ended and the user adds them
  as ongoing
- **THEN** the second partnership is added

### Requirement: Delete a relationship

The app SHALL let the user delete a relationship after confirming.

#### Scenario: Confirm

- **WHEN** the user deletes a relationship and confirms
- **THEN** it is removed from the list and the file

#### Scenario: Cancel

- **WHEN** the user cancels the confirmation
- **THEN** the relationship remains

### Requirement: Relationships are persisted immediately

The app SHALL write every relationship change to the family file and SHALL
undo the change and show an error if the write fails.

#### Scenario: Survives restart

- **WHEN** the user adds a relationship, closes the app and resumes the file
- **THEN** the relationship is listed

### Requirement: Relationship form needs two people

The app SHALL disable adding relationships while fewer than two people exist
and say why.

#### Scenario: One person

- **WHEN** the family has fewer than two people
- **THEN** the add controls are disabled with a hint to add people first

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
