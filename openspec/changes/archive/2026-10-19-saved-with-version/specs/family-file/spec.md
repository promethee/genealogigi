## ADDED Requirements

### Requirement: App version in the file
Every write of a family file SHALL record the app version in `savedWith`, replacing an older value.

#### Scenario: Save
- **WHEN** the app saves, exports or creates a family file
- **THEN** the file contains `savedWith` equal to the running app version

#### Scenario: Import
- **WHEN** a file with a `savedWith` is imported
- **THEN** the imported family does not carry it; the next save stamps the current version
