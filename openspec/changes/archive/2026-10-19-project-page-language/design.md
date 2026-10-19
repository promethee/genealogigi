## Decisions

- **One static page, texts swapped by a small script** (English is the HTML itself, French a dictionary): no second page to keep in sync, no framework, works on GitHub Pages. Without JavaScript or for crawlers the page is English.
- **Order**: `?lang=` then the last manual choice (localStorage) then `navigator.languages` (first fr or en), default English.
- **French screenshots** (`*-fr.jpg`) from the same script (`scripts/screenshots/take.mjs`), swapped through `data-src-fr`.
- **Rejected**: two separate pages with a redirect (duplicated markup, redirect flash) and a server-side `Accept-Language` (Pages is static).
