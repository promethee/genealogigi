## ADDED Requirements

### Requirement: Add two parents of a child at once

The app SHALL let the user choose a child and two different parents and a
nature, and add both parent-child links in one action. The action SHALL be
the default way of adding parent links in the form.

#### Scenario: Two parents

- **WHEN** the user picks child Byron, parents Ada and Cleo, and adds
- **THEN** both "Ada is parent of Byron" and "Cleo is parent of Byron" are saved and listed

#### Scenario: Same nature for both

- **WHEN** the user picks nature foster with start year 2000
- **THEN** both links are foster links with that start year

#### Scenario: Same person twice

- **WHEN** both parents are the same person
- **THEN** nothing is added and an error says the two parents must be different people

#### Scenario: All or nothing

- **WHEN** one parent is already recorded as a parent of the child
- **THEN** nothing is added and an error says the relationship already exists

#### Scenario: A parent equal to the child, or a cycle

- **WHEN** a chosen parent is the child, or would create a cycle
- **THEN** nothing is added and the same error as for a single link is shown

#### Scenario: Missing choices

- **WHEN** the child or a parent is not chosen
- **THEN** nothing is added and an error asks the user to choose a child and two parents

### Requirement: Record the couple as partners

When adding two parents, the user MAY tick "Also record the parents as
partners". The app SHALL then add a partner relationship with status unknown
unless the two are already partners. It is off by default.

#### Scenario: Ticked

- **WHEN** the box is ticked and the parents are not partners yet
- **THEN** a partnership between them is saved with the two parent links

#### Scenario: Already partners

- **WHEN** the parents are already partners (any status)
- **THEN** no second partnership is added

#### Scenario: Not ticked

- **WHEN** the box is not ticked
- **THEN** no partnership is added
