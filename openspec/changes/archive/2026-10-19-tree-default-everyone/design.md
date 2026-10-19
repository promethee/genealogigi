## Decisions

- **Default = Everyone**: the fullest picture; picking another view centres on one person. Existing tests that depend on a focused view now choose Hourglass explicitly.
- **Portraits in the shared tree** are read from the people data already in the page (no duplicated image data in the tree model); only safe `data:image` URLs are drawn, clipped to a circle.
- **Centring**: `margin: 0 auto` on the SVG; a wider chart still scrolls from the left.
