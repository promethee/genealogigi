## ADDED Requirements

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

