## ADDED Requirements

### Requirement: Several names per person

The app SHALL let the user give a person any number of first names and last
names, each with a kind and an optional partial date.

#### Scenario: Add a nickname

- **WHEN** the user adds a second first name "Addie" with kind nickname
- **THEN** the person is saved with both first names

#### Scenario: Married name with a date

- **WHEN** the user adds the last name "King" with kind married and year 1835
- **THEN** it is saved with a date known to the year

#### Scenario: Invalid name date

- **WHEN** a name date is invalid (for example day 31 of April)
- **THEN** an error names the field and nothing is saved

### Requirement: Primary name

The app SHALL let the user mark one first name and one last name as primary,
and SHALL show the primary names wherever the person's name is displayed.

#### Scenario: Choose primary

- **WHEN** a person has first names "Ada" and "Addie" and the user marks
  "Addie" primary
- **THEN** the list shows "Addie" with the primary last name

#### Scenario: Old files without a marker

- **WHEN** a stored person has several first names and none marked primary
- **THEN** the first one is shown as the primary

#### Scenario: Exactly one primary per list after saving

- **WHEN** the user saves a person with several names
- **THEN** exactly one entry per non-empty list is marked primary in the file

### Requirement: Order of names

The app SHALL let the user move a name up or down within its list.

#### Scenario: Move down

- **WHEN** the user moves the first of two first names down
- **THEN** it becomes second and the other becomes first

#### Scenario: Ends

- **WHEN** a name is first in its list
- **THEN** its Up button is disabled, and likewise Down for the last name

### Requirement: Blank rows and required name

The app SHALL ignore name rows with a blank value and SHALL still require at
least one name overall.

#### Scenario: Blank row ignored

- **WHEN** the user leaves an added row empty and saves
- **THEN** the person is saved without that row

#### Scenario: All blank

- **WHEN** every name row is blank
- **THEN** nothing is saved and an error says at least one name is required

### Requirement: Every person is editable

The app SHALL let the user edit any person, including people with several
names, without losing any name.

#### Scenario: Edit a person with a nickname

- **WHEN** the user edits the birth date of a person who has a nickname
- **THEN** the nickname, its kind and its date are unchanged in the file
