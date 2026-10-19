## ADDED Requirements

### Requirement: Update check is checked in the real app
The real-app suite SHALL verify the update banner, its link and its dismissal against a local fake release endpoint.

#### Scenario: Dismiss
- **WHEN** a banner is dismissed and the app restarts
- **THEN** the banner stays hidden for that version
