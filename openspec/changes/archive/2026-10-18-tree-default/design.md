# Design

## Decisions (made after asking the user: "Tree tab is default")

- **Condition, not blanket default.** A tree of an empty family or of people
  with no links is a lone box and hides the add-people controls; so the tree
  is the default only when at least one relationship exists.
- **Evaluated once on entering the loaded view**, not reactive: adding the
  first relationship does not yank the user off the People tab.
- **Relationships list stays a list** (it is also the add/edit/delete UI).
  An indented-tree list was offered and not chosen.
