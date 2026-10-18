## MODIFIED Requirements

### Requirement: List relationships

The app SHALL list the family's relationships in readable form, with an
empty-state message when there are none. A parent-child link of nature
biological (confirmed) is the default and SHALL be shown without any nature
mark; every other nature is shown in parentheses.

#### Scenario: Parent-child row

- **WHEN** Ada is a confirmed biological parent of Byron
- **THEN** the list shows "Ada is parent of Byron" with no parenthesised nature

#### Scenario: Other natures are shown

- **WHEN** Ada is an adoptive parent of Byron
- **THEN** the list shows "Ada is parent of Byron (adoptive)"

#### Scenario: Empty

- **WHEN** no relationships exist
- **THEN** a message says there are no relationships yet
