## ADDED Requirements

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
