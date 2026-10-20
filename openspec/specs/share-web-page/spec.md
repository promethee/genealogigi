# share-web-page Specification

## Purpose
TBD - created by archiving change share-web-page. Update Purpose after archive.

## Requirements

### Requirement: Share as one web page
The app SHALL export the family as a single self-contained HTML file that works offline in any browser and lets readers search people and follow relatives.

#### Scenario: Export
- **WHEN** the user confirms Share as web page and picks a file
- **THEN** one `.html` file is written and a message names it

#### Scenario: Safe
- **WHEN** a person is named with markup
- **THEN** it is shown as text in the page

### Requirement: Tree first
The shared page SHALL open on its Tree view.

#### Scenario: Opening the file
- **WHEN** the shared page is opened without a hash
- **THEN** the Tree is shown and the Tree switch is pressed

#### Scenario: Back from a person
- **WHEN** a person is opened from the Tree and the visitor presses Back
- **THEN** the Tree is shown again
