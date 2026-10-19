# real-app-tests Specification

## Purpose
TBD - created by archiving change real-app-tests. Update Purpose after archive.

## Requirements

### Requirement: Real-app tests
The project SHALL provide an automated suite that runs the real desktop app and checks real files, settings and restarts.

#### Scenario: Restart
- **WHEN** the suite creates a family and restarts the app
- **THEN** Resume offers the same file

### Requirement: Saved data is checked on the real disk
The real-app suite SHALL verify the saved file contents and persistence across restarts for people, relationships and events.

#### Scenario: Restart
- **WHEN** relationships exist and the app restarts
- **THEN** the same relationships are listed

### Requirement: Photos are checked in the real app
The real-app suite SHALL verify photo resizing, storage, editing and limits against the real app and file.

#### Scenario: Resize
- **WHEN** a 3000x2000 image is picked
- **THEN** a JPEG of at most 480 px is stored in the file

### Requirement: Update check is checked in the real app
The real-app suite SHALL verify the update banner, its link and its dismissal against a local fake release endpoint.

#### Scenario: Dismiss
- **WHEN** a banner is dismissed and the app restarts
- **THEN** the banner stays hidden for that version

### Requirement: OS theme and language are checked in the real app
The real-app suite SHALL verify that first launch follows the system theme and language and that a saved choice wins.

#### Scenario: Dark system
- **WHEN** the system is dark and nothing is saved
- **THEN** the app starts dark and saves no theme
