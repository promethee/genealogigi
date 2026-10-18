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

### Requirement: Light and dark themes

The app SHALL offer a light and a dark theme covering every screen and
component, with a theme button always visible in the top bar. With no saved
choice it SHALL follow the system preference; a choice made with the button
SHALL be remembered and take precedence.

#### Scenario: Toggle

- **WHEN** the user clicks the theme button
- **THEN** the app switches between light and dark immediately and the button shows the opposite theme's icon

#### Scenario: First launch follows the system

- **WHEN** there is no saved choice and the system prefers dark
- **THEN** the app starts dark

#### Scenario: Saved choice wins

- **WHEN** the user chose light and the system prefers dark
- **THEN** the app starts light

#### Scenario: Remembered

- **WHEN** the user switches to dark and restarts the app
- **THEN** it starts dark

#### Scenario: Every surface

- **WHEN** the theme is dark
- **THEN** the page, cards, inputs, buttons, banners, the tree charts and the small family tree all use dark colours, with no white panels left

### Requirement: Readable in both themes

Text SHALL keep at least 4.5:1 contrast against its background in both themes
for primary text, links, buttons, inputs and notices.

#### Scenario: Contrast

- **WHEN** the card text, muted text, link, primary button, input and error message are measured in either theme
- **THEN** each meets 4.5:1 (muted text 3:1)
