# ui Specification

## Purpose
TBD - created by archiving change ui-polish-3. Update Purpose after archive.

## Requirements

### Requirement: Form focus
Opening the person form SHALL focus the first name input.

#### Scenario: Add person
- **WHEN** the user opens the person form
- **THEN** the cursor is in the first name field

### Requirement: Safe confirmations
`confirm(message, { tone: "safe" })` SHALL show a green Confirm and a neutral Cancel; other confirmations keep their warning look.

#### Scenario: Share
- **WHEN** the share confirmation is shown
- **THEN** Confirm is green and focused, Cancel is neutral

### Requirement: Partner colour
Partner segments SHALL use `--tree-partner`, distinct from `--tree-edge`.

#### Scenario: Small family tree
- **WHEN** a person has a partner
- **THEN** the segment between them is drawn in the partner colour

### Requirement: Whole-family chart
`buildFamilyTree(data)` SHALL place every person exactly once, parents on a row above their children, partners on the same row.

#### Scenario: Everyone
- **WHEN** the Tree tab shows "Everyone"
- **THEN** there is one box per person, no root styling, and the root, generations and siblings controls are hidden

### Requirement: Shared page tree
The exported page SHALL contain a Tree view with every person, working offline.

#### Scenario: Open a person from the tree
- **WHEN** a box in the shared page's Tree view is clicked
- **THEN** that person's card opens

### Requirement: No self-link
A person SHALL never be selectable on both sides of a new link.

#### Scenario: Same person twice
- **WHEN** the person already chosen as parent is chosen as child
- **THEN** the parent field is emptied and Add stays disabled

### Requirement: Search narrows relationship lines
While the search box is not empty, the relationship list SHALL show only links involving a matching person.

#### Scenario: Search by name
- **WHEN** the user searches "ada"
- **THEN** only the lines involving Ada are listed; clearing the search shows all lines again

### Requirement: Everyone by default
The Tree tab SHALL open on the whole-family view.

#### Scenario: First visit
- **WHEN** the user opens the Tree tab
- **THEN** the direction selector shows "Everyone" and every person is drawn once

### Requirement: Shared tree portraits and centring
The shared page's Tree view SHALL show each person's first photo in their box and centre a chart narrower than its frame.

#### Scenario: Person with a photo
- **WHEN** a person has a photo
- **THEN** it replaces their initials in the tree box
