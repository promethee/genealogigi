## ADDED Requirements

### Requirement: Flags and native names

The language switch SHALL show a flag and the language's own name for each
option ("English", "Français"), whatever the active language, and SHALL render
the flags without relying on emoji fonts.

#### Scenario: Names in their own language

- **WHEN** the interface is in French
- **THEN** the switch still reads "English" and "Français"

#### Scenario: Flags

- **WHEN** the switch is shown
- **THEN** each option has a flag image next to its name, and the active option is highlighted
