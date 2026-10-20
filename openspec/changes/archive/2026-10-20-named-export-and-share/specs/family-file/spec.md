## ADDED Requirements

### Requirement: Family name in suggested file names
The export dialog SHALL suggest `<name>-export.gigi` and the share dialog `<name>.html`, where `<name>` is the family title made file-system safe.

#### Scenario: Named family
- **WHEN** the family is called "Laurent" and the user exports and shares
- **THEN** the dialogs suggest `Laurent-export.gigi` and `Laurent.html`, in any interface language

#### Scenario: Nothing usable
- **WHEN** the title has no usable characters
- **THEN** the suggestions are `family-export.gigi` and `family.html`
