# person-notes Specification

## Purpose
TBD - created by archiving change person-notes. Update Purpose after archive.

## Requirements

### Requirement: Person notes
Each person SHALL have an optional free-text note, edited in the person form, shown on the card, and searchable.

#### Scenario: Add a note
- **WHEN** the user types a note and saves
- **THEN** the card shows it with its line breaks

#### Scenario: Search
- **WHEN** the user searches a word that only appears in a note
- **THEN** that person is found
