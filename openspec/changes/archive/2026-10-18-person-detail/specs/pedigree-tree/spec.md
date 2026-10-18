## MODIFIED Requirements

### Requirement: Choose the root person

The app SHALL let the user pick the root person from a list of everyone in the
family, defaulting to the first person, and re-centre the chart on a person by
double-clicking them or using "Show tree from here" in their detail.

#### Scenario: Default root

- **WHEN** the Tree tab opens and no root was chosen
- **THEN** the first person is the root

#### Scenario: Pick a root

- **WHEN** the user picks another person in the list
- **THEN** the chart is redrawn with that person as root

#### Scenario: Click to re-root

- **WHEN** the user double-clicks a person in the chart
- **THEN** that person becomes the root

### Requirement: Show descendants

The app SHALL let the user switch the Tree tab between ancestors and
descendants of the root. In descendants mode the root is on the top row and
the people it is a parent of are shown on the rows below, generation by
generation, up to the chosen limit, with the same link styling and robustness
as the ancestor chart.

#### Scenario: Children and grandchildren

- **WHEN** descendants mode is chosen and the root has a child who has a child
- **THEN** the child is shown on the row below the root and the grandchild on the row after, linked

#### Scenario: Several children

- **WHEN** the root has three recorded children
- **THEN** all three are shown on the same row

#### Scenario: Generation limit

- **WHEN** the limit is 2 and the root has a grandchild
- **THEN** the grandchild is not shown

#### Scenario: Link styling

- **WHEN** a child link has nature adoptive or foster
- **THEN** its line is dashed

#### Scenario: Click to re-root

- **WHEN** the user double-clicks a person in the descendants chart
- **THEN** that person becomes the root and the mode stays descendants

#### Scenario: Cycle in file

- **WHEN** the file says A is a parent of B and B is a parent of A
- **THEN** the chart renders and each person appears at most once on any path

### Requirement: Hourglass chart

The app SHALL offer an hourglass view that shows the root's ancestors above
and descendants below the root, with the root appearing once.

#### Scenario: Both sides

- **WHEN** the root has a parent and a child and hourglass is chosen
- **THEN** the parent is above the root and the child is below it, both linked to the root

#### Scenario: Only one side

- **WHEN** the root has no children
- **THEN** only the root and its ancestors are shown, with the root on the bottom row

#### Scenario: Generation limit

- **WHEN** the limit is 2
- **THEN** at most 2 generations are shown on each side

#### Scenario: Re-root

- **WHEN** the user double-clicks a person in the hourglass
- **THEN** that person becomes the root and the view stays hourglass

## ADDED Requirements

### Requirement: Person detail below the tree

Clicking a person in the chart SHALL open that person's detail view below the
chart, with Edit and "Show tree from here" actions, without changing the root.

#### Scenario: Click

- **WHEN** the user clicks a person in the chart
- **THEN** their detail is shown below the chart and the root is unchanged

#### Scenario: Selected highlight

- **WHEN** a person's detail is open
- **THEN** their box is highlighted in the chart

#### Scenario: Edit in place

- **WHEN** the user clicks Edit in the detail, changes a name and saves
- **THEN** the chart shows the new name and the detail returns to view mode

#### Scenario: Show tree from here

- **WHEN** the user clicks "Show tree from here"
- **THEN** that person becomes the root

#### Scenario: Close

- **WHEN** the user closes the detail
- **THEN** it disappears and the chart is unchanged
