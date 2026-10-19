## ADDED Requirements

### Requirement: OS theme and language are checked in the real app
The real-app suite SHALL verify that first launch follows the system theme and language and that a saved choice wins.

#### Scenario: Dark system
- **WHEN** the system is dark and nothing is saved
- **THEN** the app starts dark and saves no theme
