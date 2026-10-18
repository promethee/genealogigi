# tree-fit-width Specification

## Purpose
TBD - created by archiving change tree-fit-width. Update Purpose after archive.

## Requirements

### Requirement: Tree fits the window
The tree SHALL scale down to the available width, and scroll horizontally only when that would make it smaller than 45% of its natural size.

#### Scenario: Slightly too wide
- **WHEN** the tree is wider than its panel but at least 45% scale fits
- **THEN** it is scaled and there is no horizontal scrolling
