# family-file Specification

## Purpose
TBD - created by archiving change saved-with-version. Update Purpose after archive.

## Requirements

### Requirement: App version in the file
Every write of a family file SHALL record the app version in `savedWith`, replacing an older value.

#### Scenario: Save
- **WHEN** the app saves, exports or creates a family file
- **THEN** the file contains `savedWith` equal to the running app version

#### Scenario: Import
- **WHEN** a file with a `savedWith` is imported
- **THEN** the imported family does not carry it; the next save stamps the current version

### Requirement: Family name in suggested file names
The export dialog SHALL suggest `<name>-export.gigi` and the share dialog `<name>.html`, where `<name>` is the family title made file-system safe.

#### Scenario: Named family
- **WHEN** the family is called "Laurent" and the user exports and shares
- **THEN** the dialogs suggest `Laurent-export.gigi` and `Laurent.html`, in any interface language

#### Scenario: Nothing usable
- **WHEN** the title has no usable characters
- **THEN** the suggestions are `family-export.gigi` and `family.html`
