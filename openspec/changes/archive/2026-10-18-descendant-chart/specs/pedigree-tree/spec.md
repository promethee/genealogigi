## ADDED Requirements

### Requirement: Show descendants

The app SHALL let the user switch the Tree tab between ancestors and
descendants of the root. In descendants mode the root and the people it is a
parent of are shown, generation by generation, up to the chosen limit, with
the same link styling and robustness as the ancestor chart.

#### Scenario: Children and grandchildren

- **WHEN** descendants mode is chosen and the root has a child who has a child
- **THEN** the child is shown in the next column and the grandchild in the one after, linked

#### Scenario: Several children

- **WHEN** the root has three recorded children
- **THEN** all three are shown

#### Scenario: Generation limit

- **WHEN** the limit is 2 and the root has a grandchild
- **THEN** the grandchild is not shown

#### Scenario: Link styling

- **WHEN** a child link has nature adoptive or foster
- **THEN** its line is dashed

#### Scenario: Click to re-root

- **WHEN** the user clicks a person in the descendants chart
- **THEN** that person becomes the root and the mode stays descendants

#### Scenario: Cycle in file

- **WHEN** the file says A is a parent of B and B is a parent of A
- **THEN** the chart renders and each person appears at most once on any path
