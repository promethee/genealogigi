## ADDED Requirements

### Requirement: Hourglass chart

The app SHALL offer an hourglass view that shows the root's ancestors to the
left and descendants to the right of the root, with the root appearing once.

#### Scenario: Both sides

- **WHEN** the root has a parent and a child and hourglass is chosen
- **THEN** the parent is left of the root and the child is right of it, both linked to the root

#### Scenario: Only one side

- **WHEN** the root has no children
- **THEN** only the root and its ancestors are shown, with the root in the rightmost column

#### Scenario: Generation limit

- **WHEN** the limit is 2
- **THEN** at most 2 generations are shown on each side

#### Scenario: Re-root

- **WHEN** the user clicks a person in the hourglass
- **THEN** that person becomes the root and the view stays hourglass
