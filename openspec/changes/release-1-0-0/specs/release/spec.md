## ADDED Requirements

### Requirement: Tagged release build
Pushing a tag `vX.Y.Z` SHALL build the Windows installer on CI and attach it to a draft release, and SHALL fail when the tag differs from the app version.

#### Scenario: Matching tag
- **WHEN** `v1.0.0` is pushed and `package.json` says 1.0.0
- **THEN** a draft release `Genealogigi v1.0.0` holds the installer

#### Scenario: Wrong tag
- **WHEN** a tag does not match the app version
- **THEN** the workflow fails before building
