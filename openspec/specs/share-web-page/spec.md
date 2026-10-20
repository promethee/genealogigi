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

### Requirement: A person by default
The People view SHALL show a person on the card when list and card are side by side.

#### Scenario: Wide window
- **WHEN** the People view opens without a person in the address
- **THEN** the card shows the person seen last, otherwise the first person, and the list marks them

#### Scenario: Phone
- **WHEN** only one pane fits
- **THEN** the list is shown and no person is opened for the visitor
