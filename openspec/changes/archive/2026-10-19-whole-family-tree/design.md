## Decisions

- **One layout, two consumers**: `buildFamilyTree` is a pure function returning the `Pedigree` shape (plus `partners`), used by the Tree tab and by the share model, so the app and the page cannot disagree.
- **Each person once** (not duplicated under each parent like the descendants view): rows by longest path from a top ancestor, couples forced onto the lower of their rows, order within a row by the average position of parents (fewer crossings), couples kept adjacent. Rejected: a full graph-layout library (size, overkill for one family).
- **Limits**: centred rows rather than parents centred above children; someone with several partners may have a partner segment crossing a box.
- **Shared page**: the layout is computed at export time and stored in the page data; the viewer only draws SVG with DOM calls (no innerHTML, names via textContent). Initials discs only (no photos) to keep the file small. Chosen over embedding the layout code in the page.
- **Navigation**: `#tree` is the Tree view, `#p=<id>` a person; the browser Back button works between them.
