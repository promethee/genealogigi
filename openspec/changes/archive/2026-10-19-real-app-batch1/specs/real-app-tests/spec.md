## ADDED Requirements

### Requirement: Saved data is checked on the real disk
The real-app suite SHALL verify the saved file contents and persistence across restarts for people, relationships and events.

#### Scenario: Restart
- **WHEN** relationships exist and the app restarts
- **THEN** the same relationships are listed
