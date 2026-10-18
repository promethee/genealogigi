# portfolio-site Specification

## Purpose
TBD - created by archiving change portfolio-site. Update Purpose after archive.

## Requirements

### Requirement: Landing page content

The site SHALL present Genealogigi as free, explain its main benefits,
show screenshots of the tree views and the people list, tell the name story,
and say how to get the app.

#### Scenario: Free framing

- **WHEN** a visitor reads the hero
- **THEN** it presents the app as free by intent, not as a reduced version of a paid product

#### Scenario: Screenshots

- **WHEN** a visitor scrolls the page
- **THEN** they see a pedigree, an hourglass and the people list, each with alt text and a caption

#### Scenario: No installer yet

- **WHEN** no release exists
- **THEN** the page gives build-from-source steps and links to the releases page for later

### Requirement: Works everywhere

The site SHALL be a single static page that works on a phone, follows the
visitor's light or dark preference and loads nothing from third parties.

#### Scenario: Phone width

- **WHEN** the page is viewed at 375 px wide
- **THEN** there is no horizontal scrolling of the page
