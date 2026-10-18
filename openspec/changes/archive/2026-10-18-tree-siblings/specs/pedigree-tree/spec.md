## ADDED Requirements

### Requirement: Siblings of the root

In the ancestors and hourglass views the user SHALL be able to show the root's
siblings. They are drawn on the root's row beside the root and linked to the
shared parents. The option SHALL be off by default and not offered in the
descendants view.

#### Scenario: Full siblings

- **WHEN** Byron and Sis have the same two parents and Byron is the root with Show siblings ticked
- **THEN** Sis is drawn on Byron's row, linked to both parents

#### Scenario: Half-sibling

- **WHEN** a person shares only one parent with the root
- **THEN** they are drawn on the root's row, linked only to the shared parent

#### Scenario: Order

- **WHEN** the root has an older and a younger sibling with known birth years
- **THEN** the older one is to the left of the root and the younger to the right

#### Scenario: No siblings

- **WHEN** the root has no siblings or no recorded parents
- **THEN** ticking the option changes nothing

#### Scenario: Off by default

- **WHEN** the Tree tab opens
- **THEN** siblings are not shown

#### Scenario: Descendants view

- **WHEN** the descendants view is chosen
- **THEN** the option is not offered

#### Scenario: Sibling boxes

- **WHEN** the user clicks a sibling
- **THEN** their card opens below the chart; double-clicking makes them the root

#### Scenario: Only one root

- **WHEN** siblings are shown
- **THEN** only the root is highlighted as root
