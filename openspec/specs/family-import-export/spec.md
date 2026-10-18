# family-import-export Specification

## Purpose
TBD - created by archiving change import-export. Update Purpose after archive.

## Requirements

### Requirement: Export the family

The app SHALL let the user export the open family to a file of their choice and
SHALL report where it went and what it contains. The open file SHALL NOT change.

#### Scenario: Export

- **WHEN** the user clicks Export… and picks a file
- **THEN** a complete copy (people, relationships, events, photos) is written there and a message gives the path and the counts

#### Scenario: Same file

- **WHEN** the user picks the file that is currently open
- **THEN** nothing is written and the message asks for a different file

#### Scenario: Cancel

- **WHEN** the user cancels the dialog
- **THEN** nothing happens

### Requirement: Import a family file

The app SHALL let the user import a family file, replacing the open family
after a confirmation that states what the file contains, what it replaces and
where the backup will be.

#### Scenario: Confirm shows both sides

- **WHEN** the user picks a file
- **THEN** the confirmation lists the counts of people, relationships, events and photos of the file and of the current family, and says the current family will be replaced and backed up

#### Scenario: Cancel

- **WHEN** the user declines
- **THEN** nothing changes and no backup is written

#### Scenario: Replace

- **WHEN** the user confirms
- **THEN** the open family file now holds the imported data, the app shows it, and a message gives the backup file name

#### Scenario: Empty file

- **WHEN** the imported file has no people
- **THEN** the confirmation warns that the family will become empty

#### Scenario: Same file or identical content

- **WHEN** the picked file is the open file, or has identical content
- **THEN** nothing is replaced and the message says so

### Requirement: Backup before import

Before replacing, the app SHALL write the previous file's exact contents next to
it as `<name>.backup-<yyyyMMdd>-<HHmmss>-<hash>.json`, where `<hash>` is the first
8 hexadecimal characters of the SHA-256 of those contents, and SHALL import
nothing if the backup cannot be written and verified.

#### Scenario: Backup name

- **WHEN** `family.json` is replaced on 18 October 2026 at 14:30:55
- **THEN** the backup is `family.backup-20261018-143055-<8 hex>.json` in the same folder

#### Scenario: Backup content

- **WHEN** the backup is written
- **THEN** its contents are byte-for-byte the previous file, and its hash matches the name

#### Scenario: Backup failure

- **WHEN** the backup cannot be written
- **THEN** the import is cancelled, the current family is unchanged and an error says why

### Requirement: Validate imports and warn

The app SHALL refuse files that are not valid family files, with a reason, and
SHALL drop harmless problems and report them as warnings.

#### Scenario: Not JSON

- **WHEN** the file is not valid JSON
- **THEN** it is refused with a message saying so

#### Scenario: Not a family

- **WHEN** the JSON has no people and relationships lists
- **THEN** it is refused as not a Genealogigi family file

#### Scenario: Newer version

- **WHEN** the file's schema version is newer than the app understands
- **THEN** it is refused and the message suggests updating the app

#### Scenario: Dangling links

- **WHEN** relationships or events point to people that are not in the file
- **THEN** those links are dropped and a warning gives the count

#### Scenario: Bad photos and people

- **WHEN** a photo is not a valid image data URL, or a person entry is malformed
- **THEN** it is dropped and a warning gives the count

#### Scenario: Warnings shown

- **WHEN** an import succeeds with dropped items
- **THEN** the warnings are listed after the success message

#### Scenario: Old file

- **WHEN** the file has no events or photos
- **THEN** it imports without warnings
