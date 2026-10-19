## ADDED Requirements

### Requirement: Whole-family chart
`buildFamilyTree(data)` SHALL place every person exactly once, parents on a row above their children, partners on the same row.

#### Scenario: Everyone
- **WHEN** the Tree tab shows "Everyone"
- **THEN** one box per person, no root styling, root/generations/siblings controls hidden

### Requirement: Shared page tree
The exported page SHALL contain a Tree view with every person, working offline.
