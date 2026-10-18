## ADDED Requirements

### Requirement: Share as one web page
The app SHALL export the family as a single self-contained HTML file that works offline in any browser and lets readers search people and follow relatives.

#### Scenario: Export
- **WHEN** the user confirms Share as web page and picks a file
- **THEN** one `.html` file is written and a message names it

#### Scenario: Safe
- **WHEN** a person is named with markup
- **THEN** it is shown as text in the page
