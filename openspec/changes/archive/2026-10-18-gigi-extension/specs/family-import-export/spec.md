## ADDED Requirements

### Requirement: Family file extension
New family files SHALL use the `.gigi` extension with JSON content, and legacy `.json` files SHALL still open.

#### Scenario: New family
- **WHEN** the user creates or exports a family
- **THEN** the suggested file name ends with `.gigi`

#### Scenario: Legacy file
- **WHEN** the user opens or imports a `.json` family file
- **THEN** it loads as before
