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

### Requirement: Birth date

The app SHALL let the user record a person's birth date with any combination
of year, month and day, and SHALL show it back when editing.

#### Scenario: Full date

- **WHEN** the user enters year 1815, month December, day 10
- **THEN** the person is saved with that birth date and it reappears when
  editing

#### Scenario: Year only

- **WHEN** the user enters only the year 1815
- **THEN** the date is saved as known to the year only

#### Scenario: No date

- **WHEN** all birth fields are empty
- **THEN** the person has no birth date

### Requirement: Life status and death date

The app SHALL let the user mark a person as living, deceased or unknown, and
for deceased people record a death date, which MAY be left empty.

#### Scenario: Deceased with date

- **WHEN** the user picks deceased and enters a death date
- **THEN** the person is saved as deceased with that date

#### Scenario: Deceased without date

- **WHEN** the user picks deceased and leaves the death date empty
- **THEN** the person is saved as deceased with an unknown death date

#### Scenario: Unknown or living ignores death date

- **WHEN** the status is unknown or living
- **THEN** no death date is saved

### Requirement: Date validation

The app SHALL reject invalid dates and SHALL not save the person.

#### Scenario: Day without month

- **WHEN** a day is entered but no month
- **THEN** an error says the day needs a month

#### Scenario: Impossible day

- **WHEN** the user enters 31 April
- **THEN** an error says that day does not exist in that month

#### Scenario: Not a number or out of range

- **WHEN** the year is "abc" or 0 or 9999
- **THEN** an error names the field and nothing is saved

#### Scenario: Death before birth

- **WHEN** both dates are comparable and the death is earlier than the birth
- **THEN** an error says death cannot be before birth

### Requirement: Life summary in the list

The app SHALL show a short life summary next to each person that has dates or
a life status.

#### Scenario: Both dates

- **WHEN** a person was born 10 Dec 1815 and died 27 Nov 1852
- **THEN** the list shows "b. 10 Dec 1815 · d. 27 Nov 1852"

#### Scenario: Living

- **WHEN** a person is living with no birth date
- **THEN** the list shows "living"

### Requirement: Editing keeps unseen data

The app SHALL keep any stored person data the form does not show when the
person is edited.

#### Scenario: Several names kept

- **WHEN** a person with a stored nickname gets their birth date edited
- **THEN** the nickname is still in the file

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
