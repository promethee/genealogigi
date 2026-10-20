## ADDED Requirements

### Requirement: A person by default
The People view SHALL show a person on the card when list and card are side by side.

#### Scenario: Wide window
- **WHEN** the People view opens without a person in the address
- **THEN** the card shows the person seen last, otherwise the first person, and the list marks them

#### Scenario: Phone
- **WHEN** only one pane fits
- **THEN** the list is shown and no person is opened for the visitor
