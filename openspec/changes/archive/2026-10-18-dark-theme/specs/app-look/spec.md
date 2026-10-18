## ADDED Requirements

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
