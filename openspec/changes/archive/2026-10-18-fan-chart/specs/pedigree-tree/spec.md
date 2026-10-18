## ADDED Requirements

### Requirement: Fan chart

The app SHALL offer a fan chart of the root's ancestors: the root in the
centre and each generation as a ring of wedges, in the chosen generation limit.

#### Scenario: Rings

- **WHEN** the root has two parents and a grandparent and fan is chosen
- **THEN** the root, both parents (first ring) and the grandparent (second ring) are drawn

#### Scenario: Names

- **WHEN** a wedge is drawn
- **THEN** it shows the person's name, truncated when long

#### Scenario: Dashed outline

- **WHEN** a parent link has nature adoptive or foster
- **THEN** that parent's wedge has a dashed outline

#### Scenario: Re-root

- **WHEN** the user clicks a wedge
- **THEN** that person becomes the root and the view stays fan

#### Scenario: Generation limit

- **WHEN** the limit is 2 and the root has a great-grandparent
- **THEN** the great-grandparent is not drawn

#### Scenario: No parents

- **WHEN** the root has no recorded parents
- **THEN** only the root circle is drawn
