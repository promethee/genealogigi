## ADDED Requirements

### Requirement: Portraits in the chart

Each box in the tree charts SHALL show the person's portrait (main photo, or
initials on a coloured disc) as a round image at the left of the box, with the
name and lifespan beside it, without overlapping or clipping the text.

#### Scenario: With a photo

- **WHEN** a person in the chart has a main photo
- **THEN** their box shows it as a round portrait at the left

#### Scenario: Without a photo

- **WHEN** a person has none
- **THEN** their box shows their initials on a disc

#### Scenario: Long names

- **WHEN** a name is long
- **THEN** it is shortened with an ellipsis and stays inside the box

#### Scenario: Interactions unchanged

- **WHEN** the user clicks or double-clicks a box
- **THEN** the card opens or the root changes, as before

#### Scenario: Themes

- **WHEN** the theme is dark
- **THEN** portraits and the initials discs stay legible
