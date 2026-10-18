# tree-defaults Specification

## Purpose
TBD - created by archiving change tree-defaults. Update Purpose after archive.

## Requirements

### Requirement: Tree defaults and search dropdown
The tree SHALL open as an hourglass with siblings shown, and the search suggestions SHALL close when the user presses Enter.

#### Scenario: First open
- **WHEN** the Tree tab opens
- **THEN** the view is Hourglass and Show siblings is ticked

#### Scenario: Enter
- **WHEN** the user presses Enter in the search box
- **THEN** the suggestions disappear
