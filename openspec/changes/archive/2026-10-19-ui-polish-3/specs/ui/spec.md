## ADDED Requirements

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
