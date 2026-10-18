## ADDED Requirements

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
