## ADDED Requirements

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
