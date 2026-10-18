## MODIFIED Requirements

### Requirement: Certainty of parent links

The app SHALL draw parent links solid for biological-confirmed and dashed for
every other nature (biological-presumed, adoptive, step, foster, guardian),
and SHALL explain the styles in a legend.

#### Scenario: Dashed adoptive link

- **WHEN** a parent link has nature adoptive
- **THEN** its line is dashed

#### Scenario: Dashed foster link

- **WHEN** a parent link has nature foster
- **THEN** its line is dashed and the parent appears in the chart
