# language Specification

## Purpose
TBD - created by archiving change i18n-en-fr. Update Purpose after archive.

## Requirements

### Requirement: Language switch always available

The app SHALL show an English/French switch at the top right of the window on
every screen, and switching SHALL change all visible text immediately without
losing the user's work.

#### Scenario: Welcome screen

- **WHEN** the welcome screen is shown
- **THEN** the language switch is visible at the top right

#### Scenario: Loaded family

- **WHEN** a family is open
- **THEN** the same switch is visible and switching to French shows French labels, buttons and messages

#### Scenario: Unsaved form kept

- **WHEN** the user has typed into the person form and switches language
- **THEN** the typed values are still there

### Requirement: Language is remembered

The app SHALL remember the chosen language between launches and, with no
saved choice, use French when the system language starts with "fr", else English.

#### Scenario: Restart

- **WHEN** the user chooses French and restarts the app
- **THEN** the app starts in French

#### Scenario: First launch

- **WHEN** there is no saved choice and the system language is French
- **THEN** the app starts in French

### Requirement: Everything is translated

The app SHALL translate labels, buttons, hints, errors, confirmations, notices,
relationship descriptions, life summaries, tree legends, month names and date
formats, and SHALL display plural forms correctly.

#### Scenario: Relationship text

- **WHEN** Ada is a foster parent of Byron from 1990 and the language is French
- **THEN** the row reads in French, with French month names for any dated entries

#### Scenario: Error

- **WHEN** the user adds a parent link of a person to themself in French
- **THEN** the error is shown in French

#### Scenario: Plurals

- **WHEN** a family has 0, 1 and 2 people in French
- **THEN** the summary reads "0 personne", "1 personne" and "2 personnes"

### Requirement: Language does not change the file

The app SHALL store the same data in the family file whatever the UI language.

#### Scenario: Same file

- **WHEN** the same person is added in English and in French
- **THEN** the saved JSON is identical apart from ids
