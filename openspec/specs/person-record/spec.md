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

### Requirement: Simple name entry first

The person form SHALL show a single first-name and a single last-name field
without kind, date, main-name or reorder controls until a person has more than
one name or a name with a non-default kind or date.

#### Scenario: New person

- **WHEN** the user opens the add-person form
- **THEN** there is one First name and one Last name field and no kind, date or Main name controls for them

#### Scenario: Person with several names

- **WHEN** the user edits a person who has a birth and a married last name
- **THEN** both rows are shown with their kind, date and main-name choice

### Requirement: Record a name change

The form SHALL offer "Last name changed (e.g. marriage)" and "First name changed"
actions that add a name row, the first with kind Married and the second with kind
Current, each with a "Since" date. A new last name SHALL become the main name by
default; a new first name SHALL NOT.

#### Scenario: Marriage

- **WHEN** the user enters last name Martin, chooses "Last name changed", enters Dubois and year 2001
- **THEN** after saving the person has last names Martin (birth) and Dubois (married, 2001) with Dubois as main name

#### Scenario: Return to the birth name

- **WHEN** the user marks the birth name as the main name
- **THEN** the person is displayed by their birth name without "née"

### Requirement: Display with birth name

The app SHALL display a person whose main last name differs from their birth
last name as "First Main (née Birth)" in lists and selects.

#### Scenario: Married woman

- **WHEN** a person has birth last name Martin and main last name Dubois
- **THEN** the people list shows "Marie Dubois (née Martin)"

#### Scenario: Unchanged name

- **WHEN** the main last name is the birth last name, or there is no birth last name
- **THEN** no "née" is shown

### Requirement: Sensible life status default

A new person SHALL start with life status Living. While the user has not chosen
a status, entering a birth year more than 110 years in the past SHALL set it to
Deceased, and clearing or changing it back to a recent year SHALL restore
Living. A status the user picked SHALL NOT be changed automatically. Editing an
existing person SHALL show their stored status, including Unknown.

#### Scenario: New person

- **WHEN** the add-person form opens
- **THEN** life status is Living

#### Scenario: Old birth year

- **WHEN** the user types birth year 1815 and has not chosen a status
- **THEN** life status becomes Deceased and the death date fields appear

#### Scenario: User choice wins

- **WHEN** the user picks Living and then types birth year 1815
- **THEN** life status stays Living

#### Scenario: Existing person

- **WHEN** a person saved with unknown status is edited
- **THEN** the form shows Unknown

### Requirement: Last-name suggestions

The person form SHALL suggest, for every last-name field, the last names
already recorded in the family, most frequent first and then alphabetically,
without duplicates (ignoring case), and SHALL still accept any typed value.

#### Scenario: Suggestions from saved people

- **WHEN** Dubois (twice) and Martin are already saved and the add-person form opens
- **THEN** the last-name field offers Dubois, then Martin

#### Scenario: Married names count

- **WHEN** a person has birth last name Martin and married last name Dubois
- **THEN** both names are offered

#### Scenario: Case-insensitive

- **WHEN** "dubois" and "Dubois" are saved
- **THEN** only one of them is offered

#### Scenario: Nothing saved yet

- **WHEN** no last name is saved
- **THEN** no suggestions are offered and typing still works

#### Scenario: Free typing

- **WHEN** the user types a name that is not suggested
- **THEN** it is accepted as typed

### Requirement: Birth date example

The birth year field SHALL show a greyed example year, 30 years before the
current year, and SHALL NOT save it unless the user types a year.

#### Scenario: Placeholder

- **WHEN** the add-person form opens in 2026
- **THEN** the birth year field shows the hint "e.g. 1996" and is empty

#### Scenario: Not saved

- **WHEN** the user saves without typing a birth year
- **THEN** the person has no birth date

### Requirement: No future dates

The app SHALL reject a birth date or death date that is certainly after today.

#### Scenario: Future year

- **WHEN** the user enters a birth year after the current year
- **THEN** nothing is saved and an error says the birth date cannot be in the future

#### Scenario: This year, later month

- **WHEN** the user enters this year with a month that has not started yet
- **THEN** the date is rejected

#### Scenario: Today or earlier

- **WHEN** the date is today or in the past
- **THEN** it is accepted

#### Scenario: Partial date

- **WHEN** only the current year is entered
- **THEN** it is accepted, because it may be in the past

#### Scenario: Death date

- **WHEN** the user enters a death date in the future
- **THEN** it is rejected with the death date message

### Requirement: Person detail view

The app SHALL show a read-only detail view of a person with: all names (kind,
"since" date, main name marked), birth date and place, life status and, when
deceased, death date and place, and relatives: parents with their nature,
partners with status, children and siblings. Unknown or empty facts SHALL be
left out or marked unknown, never shown as blank labels.

#### Scenario: Open from the list

- **WHEN** the user clicks a person's name in the people list
- **THEN** the detail view of that person is shown

#### Scenario: Names

- **WHEN** a person has birth last name Martin and married last name Dubois (main)
- **THEN** both are listed with their kind and Dubois is marked as the main name

#### Scenario: Relatives

- **WHEN** a person has two parents, a partner and a child
- **THEN** they are listed under Parents, Partners and Children, and clicking one opens that person's detail

#### Scenario: Siblings

- **WHEN** another person shares at least one parent with this person
- **THEN** that person is listed under Siblings (marked half-sibling when they do not share all known parents)

#### Scenario: Nothing known

- **WHEN** a person has no birth data and no relatives
- **THEN** the detail shows the name and no empty sections

### Requirement: Edit from the detail view

The detail view SHALL offer an Edit button that opens the person form, and
saving or cancelling SHALL return to the detail view.

#### Scenario: Edit and return

- **WHEN** the user clicks Edit, changes the first name and saves
- **THEN** the detail view shows the new name

### Requirement: Birth and death place

The person form SHALL offer an optional birth place and, for a deceased person,
an optional death place, as free text, with suggestions from places already
saved. Places SHALL be stored with the birth and death facets and shown in the
detail view.

#### Scenario: Birth place without date

- **WHEN** the user enters a birth place but no birth date
- **THEN** the place is saved and the birth date is unknown

#### Scenario: Death place

- **WHEN** the status is Deceased and a death place is entered
- **THEN** it is saved and shown in the detail view

#### Scenario: Living person

- **WHEN** the status is Living
- **THEN** no death place field is shown and none is stored

#### Scenario: Suggestions

- **WHEN** "Lyon" is already a saved birth place
- **THEN** it is suggested in the birth and death place fields

#### Scenario: Old files

- **WHEN** a file saved without places is opened
- **THEN** it loads and the place fields are empty

### Requirement: Delete only from the person card

Deleting a person SHALL be available only from the person's card (after
confirmation), not directly from the people list. The list keeps Edit.

#### Scenario: List row

- **WHEN** the people list is shown
- **THEN** rows offer Edit but no Delete

#### Scenario: Card

- **WHEN** the user opens a person's card and clicks Delete and confirms
- **THEN** the person and their relationships are removed and the card closes

#### Scenario: Cancel

- **WHEN** the user cancels the confirmation
- **THEN** nothing is deleted and the card stays

### Requirement: Born and died wording

Life summaries SHALL read "born {date}" and "died {date}" (French "né(e) …"
and "décédé(e) …"), not abbreviations.

#### Scenario: Summary

- **WHEN** a person was born on 10 Dec 1815 and died on 27 Nov 1852
- **THEN** the list shows "born 10 Dec 1815 · died 27 Nov 1852"

### Requirement: Parents when creating a person

The add-person form SHALL let the user optionally choose one or two existing
people as the new person's parents, with a nature, and SHALL create the person
and the parent links together or not at all.

#### Scenario: Two parents

- **WHEN** the user adds Byron and chooses Ada and Cleo as parents
- **THEN** Byron, "Ada is parent of Byron" and "Cleo is parent of Byron" are saved together

#### Scenario: One parent

- **WHEN** the user chooses only Parent 1
- **THEN** one parent link is created

#### Scenario: No parent

- **WHEN** no parent is chosen
- **THEN** only the person is created, as before

#### Scenario: Nature

- **WHEN** the user picks adoptive
- **THEN** the created links are adoptive

#### Scenario: Same parent twice

- **WHEN** both parents are the same person
- **THEN** nothing is saved and an error says the two parents must be different people

#### Scenario: Invalid person

- **WHEN** the person's own data is invalid (for example a future birth date)
- **THEN** nothing is saved, including the parent links

#### Scenario: Partners

- **WHEN** two parents are chosen and "Also record the parents as partners" is ticked and they are not partners yet
- **THEN** a partnership with status unknown is saved with them

#### Scenario: Nobody to choose

- **WHEN** the family has no people
- **THEN** the Parents section is not shown

#### Scenario: Editing

- **WHEN** an existing person is edited
- **THEN** the Parents section is not shown
