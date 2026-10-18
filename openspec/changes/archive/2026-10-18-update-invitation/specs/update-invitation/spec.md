## ADDED Requirements

### Requirement: Update invitation
When a newer version exists the app SHALL invite the user to download it, show the release link, and still show it if the browser cannot be opened.

#### Scenario: Browser cannot open
- **WHEN** opening the link fails
- **THEN** a message with the link is shown
