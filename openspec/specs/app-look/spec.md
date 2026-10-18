# app-look Specification

## Purpose
TBD - created by archiving change ui-polish. Update Purpose after archive.

## Requirements

### Requirement: Actions look like buttons

Every action (Edit, Delete, Save a copy, Sync, Add, Save, Cancel, tabs) SHALL
be visibly a button or tab: a boundary or fill, a hover state, a visible
keyboard focus, and, for destructive actions, a distinct colour.

#### Scenario: Row actions

- **WHEN** the people list or relationships list is shown
- **THEN** Edit and Delete each have a border, an icon and a hover state, and Delete is red

### Requirement: Consistent look

Screens SHALL share one visual system: a top bar with the app name and the
language switch, content in cards on a soft background, matching inputs and
buttons, and readable text.

#### Scenario: Welcome screen

- **WHEN** the app starts
- **THEN** the welcome screen shows the app name, a one-line description and the three actions as buttons with icons, in a card

#### Scenario: People list

- **WHEN** people exist
- **THEN** each row shows an avatar with initials, the name and life summary, and the Edit and Delete buttons
