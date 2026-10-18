# save-copy Specification

## Purpose
Write a snapshot of the open family to another file without changing which file is open.

## Requirements

### Requirement: Save a copy of the open family

The app SHALL let the user save a snapshot of the open family to another file
chosen with the native save dialog, without changing which file is open.

#### Scenario: Copy saved

- **WHEN** the user clicks Save a copy and picks a new location
- **THEN** a file with the same people and relationships is written there
- **AND** a message says where the copy was saved
- **AND** the open file and the remembered last file are unchanged

#### Scenario: Cancelled

- **WHEN** the user cancels the save dialog
- **THEN** nothing is written and no message or error is shown

#### Scenario: Same file refused

- **WHEN** the user picks the file that is currently open
- **THEN** nothing is written and an error asks for a different file

#### Scenario: Write fails

- **WHEN** writing the copy fails
- **THEN** an error message is shown and the open family is unaffected

### Requirement: Notice does not linger

The app SHALL clear the copy-saved message when the user does anything else
that changes the family or opens another file.

#### Scenario: Cleared by an edit

- **WHEN** a copy-saved message is showing and the user adds a person
- **THEN** the message is gone
