## ADDED Requirements

### Requirement: Automatic page language
The project page SHALL display in French when the browser prefers French and in English otherwise.

#### Scenario: French browser
- **WHEN** a visitor whose browser prefers French opens the page
- **THEN** texts, title, description and screenshots are French, with no click

#### Scenario: Other language
- **WHEN** the browser prefers another language
- **THEN** the page is English

#### Scenario: Manual choice
- **WHEN** the visitor opens `?lang=fr` or uses the footer links
- **THEN** that choice wins and is remembered
