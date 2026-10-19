## ADDED Requirements

### Requirement: Family name
Creating a family SHALL ask for a name, store it in the file and use it to tell families apart.

#### Scenario: Create
- **WHEN** the user creates a family and enters "Laurent"
- **THEN** the save dialog suggests Laurent.gigi and the family is titled Laurent

#### Scenario: Default file names
- **WHEN** the user exports or shares
- **THEN** the suggested names are family-export.gigi and family.html in every language
