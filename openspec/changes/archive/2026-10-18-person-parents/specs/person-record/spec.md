## ADDED Requirements

### Requirement: Parents when creating a person

The add-person form SHALL let the user optionally choose one or two existing
people as the new person's parents, with a nature, and SHALL create the person
and the parent links together or not at all.

#### Scenario: Two parents

- **WHEN** the user adds Byron and chooses Ada and Cleo as parents
- **THEN** Byron, "Ada is parent of Byron" and "Cleo is parent of Byron" are saved together

#### Scenario: One parent

- **WHEN** the user chooses only Parent 1
- **THEN** one parent link is created

#### Scenario: No parent

- **WHEN** no parent is chosen
- **THEN** only the person is created, as before

#### Scenario: Nature

- **WHEN** the user picks adoptive
- **THEN** the created links are adoptive

#### Scenario: Same parent twice

- **WHEN** both parents are the same person
- **THEN** nothing is saved and an error says the two parents must be different people

#### Scenario: Invalid person

- **WHEN** the person's own data is invalid (for example a future birth date)
- **THEN** nothing is saved, including the parent links

#### Scenario: Partners

- **WHEN** two parents are chosen and "Also record the parents as partners" is ticked and they are not partners yet
- **THEN** a partnership with status unknown is saved with them

#### Scenario: Nobody to choose

- **WHEN** the family has no people
- **THEN** the Parents section is not shown

#### Scenario: Editing

- **WHEN** an existing person is edited
- **THEN** the Parents section is not shown
