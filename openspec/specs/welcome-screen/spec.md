# welcome-screen Specification

## Purpose
Startup entry point where the user chooses which family file to work on (resume the last one, open an existing one, or create a new one) and sees clear errors when a file cannot be used.

## Requirements

### Requirement: Welcome screen on startup

The app SHALL show the welcome screen at startup, before any family file is
loaded, offering Resume, Open, and Create new actions.

#### Scenario: Fresh start

- **WHEN** the app starts
- **THEN** the welcome screen is shown with Resume, Open, and Create new actions

### Requirement: Resume last family file

The app SHALL remember the path of the last successfully loaded family file
and let the user resume it in one action.

#### Scenario: Resume available

- **WHEN** the app starts and the remembered file still exists
- **THEN** Resume is enabled and shows the file name

#### Scenario: Resume unavailable, nothing remembered

- **WHEN** the app starts and no path is remembered
- **THEN** Resume is disabled

#### Scenario: Resume unavailable, file gone

- **WHEN** the app starts and the remembered file no longer exists
- **THEN** Resume is disabled and a message says the file was not found
- **AND** no file is created

#### Scenario: Resume click

- **WHEN** the user clicks an enabled Resume
- **THEN** the remembered file is loaded and the welcome screen is left

### Requirement: Open existing family file

The app SHALL let the user pick an existing family file with a native dialog.

#### Scenario: Open succeeds

- **WHEN** the user picks a valid family file in the Open dialog
- **THEN** the file is loaded, its path is remembered, and the welcome screen
  is left

#### Scenario: Open cancelled

- **WHEN** the user cancels the Open dialog
- **THEN** the app stays on the welcome screen with no error

### Requirement: Create new family file

The app SHALL let the user choose a location with a native save dialog and
create an empty family file there.

#### Scenario: Create succeeds

- **WHEN** the user picks a location in the Create dialog
- **THEN** a file with `schemaVersion` 1 and no people or relationships is
  written there, its path is remembered, and the welcome screen is left

#### Scenario: Create cancelled

- **WHEN** the user cancels the Create dialog
- **THEN** no file is written and the app stays on the welcome screen

### Requirement: Failures keep the user on the welcome screen

The app SHALL show a readable error and stay on the welcome screen when a file
cannot be read, parsed, or written, and SHALL NOT modify the file.

#### Scenario: Corrupt file

- **WHEN** the user opens a file that is not valid JSON
- **THEN** an error message is shown and the welcome screen remains
- **AND** the file on disk is unchanged

### Requirement: Back to the welcome screen

An open family SHALL offer a Close family button that returns to the welcome
screen, where Resume offers the family just closed.

#### Scenario: Close

- **WHEN** the user clicks Close family
- **THEN** the welcome screen is shown and nothing is lost, because every change is already saved

#### Scenario: Resume

- **WHEN** the welcome screen appears after closing
- **THEN** Resume names the family that was just closed

#### Scenario: Pending save

- **WHEN** a save is still running when the user clicks Close family
- **THEN** the app finishes the save before leaving

#### Scenario: Clean state

- **WHEN** the user opens another family afterwards
- **THEN** no selection, card, message or form from the previous family remains
