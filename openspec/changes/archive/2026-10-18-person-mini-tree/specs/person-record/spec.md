## ADDED Requirements

### Requirement: Small family tree on the card

The person card SHALL show a small tree of the person's immediate family:
the person highlighted, their parents above, their partners beside them and
their children below, joined by lines. It SHALL be hidden when the person has
no parent, partner or child.

#### Scenario: Parents, partner and children

- **WHEN** a person has two parents, a partner and two children
- **THEN** the small tree shows two boxes above, the person with the partner beside, and two boxes below

#### Scenario: Only children

- **WHEN** a person has only children
- **THEN** the person is shown with their children below and no row above

#### Scenario: Nothing

- **WHEN** a person has no parent, partner or child
- **THEN** no small tree is shown

#### Scenario: Link style

- **WHEN** a parent link is adoptive, foster or not confirmed biological
- **THEN** its line is dashed and the box notes the nature

#### Scenario: Open a card

- **WHEN** the user clicks a box in the small tree
- **THEN** that person's card opens

#### Scenario: Highlight

- **WHEN** the card is open
- **THEN** only the card's person is highlighted

#### Scenario: Many children

- **WHEN** the person has many children
- **THEN** the small tree scrolls horizontally instead of overflowing the card
