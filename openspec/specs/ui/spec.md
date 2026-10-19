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
