# app-update Specification

## Purpose
TBD - created by archiving change app-version-update. Update Purpose after archive.

## Requirements

### Requirement: Version in the window title

The window title SHALL read the app name followed by its version, e.g.
"Genealogigi 0.1.0".

#### Scenario: Title

- **WHEN** the app starts
- **THEN** the window title is "Genealogigi" followed by the current version

#### Scenario: One version

- **WHEN** the project is checked
- **THEN** `package.json`, `tauri.conf.json` and `Cargo.toml` carry the same version

### Requirement: Check for a newer version at startup

On startup the app SHALL look up the latest published release and, when it is
newer than the running version, show a banner with Download and Dismiss. It
SHALL stay silent when the app is up to date, when there is no release, or when
the lookup fails.

#### Scenario: Newer release

- **WHEN** the latest release is 0.2.0 and the app is 0.1.0
- **THEN** a banner says version 0.2.0 is available and offers Download and Dismiss

#### Scenario: Up to date

- **WHEN** the latest release is not newer
- **THEN** no banner is shown

#### Scenario: Offline or no release

- **WHEN** the lookup fails or no release exists
- **THEN** nothing is shown and the app works normally

#### Scenario: Dismiss

- **WHEN** the user dismisses the banner for 0.2.0
- **THEN** it does not return for 0.2.0 on later starts, but does for a newer version

#### Scenario: Download

- **WHEN** the user clicks Download
- **THEN** the release page opens in the browser; nothing is installed by the app

### Requirement: Manual check

The top bar SHALL offer a Check for updates button that runs the same check and
reports the result, including "up to date" and failure.

#### Scenario: Up to date

- **WHEN** the user clicks Check for updates and there is no newer release
- **THEN** a message says the app is up to date and gives the version

#### Scenario: Failure

- **WHEN** the lookup fails
- **THEN** a message says the check could not be done

#### Scenario: Dismissed version

- **WHEN** a newer version was dismissed earlier and the user checks manually
- **THEN** the banner is shown again

### Requirement: No family data is sent

The update check SHALL send no family data.

#### Scenario: Request

- **WHEN** the check runs
- **THEN** the only request is a read of the public release information
