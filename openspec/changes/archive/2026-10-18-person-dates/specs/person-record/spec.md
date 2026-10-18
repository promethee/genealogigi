## ADDED Requirements

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
