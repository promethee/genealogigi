# pedigree-tree Specification

## Purpose
Pedigree chart of a person and their ancestors, with selectable root and generation depth, certainty styling and safety against bad data.

## Requirements

### Requirement: Tree tab

The app SHALL offer a Tree tab beside the people list that shows a pedigree
chart of the loaded family.

#### Scenario: Switch tabs

- **WHEN** the user opens the Tree tab
- **THEN** the pedigree chart is shown instead of the people list
- **AND** switching back shows the list again

#### Scenario: No people

- **WHEN** the family has no people
- **THEN** the Tree tab says there is nobody to show yet

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

### Requirement: Show ancestors by generation

The app SHALL show the root and their ancestors up to a chosen number of
generations (2 to 6, default 4), with each generation on its own row, the
root on the bottom row and older generations on the rows above.

#### Scenario: Two known parents

- **WHEN** the root has two recorded parents
- **THEN** both are shown on the row above the root, side by side, linked to the root

#### Scenario: Generation limit

- **WHEN** the limit is 2 and the family has a great-grandparent of the root
- **THEN** the great-grandparent is not shown

#### Scenario: Unknown or single parent

- **WHEN** a person has no recorded parents, or only one
- **THEN** only the recorded parent, if any, is shown and nothing breaks

#### Scenario: More than two parents

- **WHEN** a person has three recorded parents
- **THEN** all three are shown

#### Scenario: Shared ancestor

- **WHEN** the same person is an ancestor through two different paths
- **THEN** they appear once per path

#### Scenario: Oldest at the top

- **WHEN** the root has parents, grandparents and great-grandparents
- **THEN** each generation is drawn above the previous one, great-grandparents at the top

### Requirement: Certainty of parent links

The app SHALL draw parent links solid for biological-confirmed and dashed for
every other nature (biological-presumed, adoptive, step, foster, guardian),
and SHALL explain the styles in a legend.

#### Scenario: Dashed adoptive link

- **WHEN** a parent link has nature adoptive
- **THEN** its line is dashed

#### Scenario: Dashed foster link

- **WHEN** a parent link has nature foster
- **THEN** its line is dashed and the parent appears in the chart

### Requirement: Robust against bad data

The app SHALL not freeze or crash when the file contains a parent-child cycle
or a relationship pointing to a missing person.

#### Scenario: Cycle in file

- **WHEN** the file says A is a parent of B and B is a parent of A
- **THEN** the chart renders and each person appears at most once on any path

### Requirement: Lifespan in chart boxes

The app SHALL show a lifespan line under each name in the chart when birth or
death years are known.

#### Scenario: Deceased

- **WHEN** a person was born in 1815 and died in 1852
- **THEN** their box shows "1815–1852"

#### Scenario: Living

- **WHEN** a person is living and was born in 1990
- **THEN** their box shows "1990–"

#### Scenario: Nothing known

- **WHEN** a person has no dates and no life status
- **THEN** their box shows only the name

### Requirement: Primary name in chart boxes

The app SHALL show each person's primary first and last name in the chart.

#### Scenario: Nickname primary

- **WHEN** a person's primary first name is "Addie"
- **THEN** their box shows "Addie" followed by the primary last name

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

### Requirement: Tree first when relationships exist

The app SHALL open on the Tree tab when the loaded family has at least one
relationship, and on the People tab otherwise.

#### Scenario: Family with relationships

- **WHEN** the user resumes a family file that has a relationship
- **THEN** the Tree tab is shown first

#### Scenario: Family without relationships

- **WHEN** the user creates a new family or opens one with no relationships
- **THEN** the People tab is shown first

### Requirement: Birth name in chart boxes

Tree boxes SHALL show the main name on the first line and, when the main last
name differs from the birth last name, "née Birth" before the lifespan on the
second line.

#### Scenario: Married woman

- **WHEN** a person is Marie Dubois, née Martin, born 1950
- **THEN** her box shows "Marie Dubois" and "née Martin · 1950–"

### Requirement: Scrollable chart

The chart SHALL scroll horizontally and vertically when it is larger than the
window, and SHALL be centred when it is narrower.

#### Scenario: Wide family

- **WHEN** the chart is wider than the window
- **THEN** the chart area scrolls instead of the page or the chart being clipped

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
