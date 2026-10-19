## ADDED Requirements

### Requirement: Friendly write errors
A failed write SHALL show "Could not write to {file}. Check that the file is present and writable." naming the file, never the operating system message.

#### Scenario: Save fails
- **WHEN** the disk refuses a write
- **THEN** the error names the file in plain words and the family in memory is unchanged

### Requirement: Name case
Names SHALL be saved in lowercase and displayed capitalized (first letter of each word, hyphen and apostrophe part).

#### Scenario: Typed in capitals
- **WHEN** "JEAN-PIERRE" is saved as a first name
- **THEN** the file holds "jean-pierre" and the app shows "Jean-Pierre"
