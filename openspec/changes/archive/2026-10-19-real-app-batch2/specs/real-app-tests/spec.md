## ADDED Requirements

### Requirement: Photos are checked in the real app
The real-app suite SHALL verify photo resizing, storage, editing and limits against the real app and file.

#### Scenario: Resize
- **WHEN** a 3000x2000 image is picked
- **THEN** a JPEG of at most 480 px is stored in the file
