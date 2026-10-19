## Why
Several families can be kept as several files; a file name alone is a poor way to tell them apart. Default export and share file names were also translated, which makes them unpredictable.

## What Changes
- Creating a family first asks for its name (in-app prompt; required; Cancel stops the creation). The name is stored in the file (optional `name`, no schema bump), shown as the page title and on the welcome screen's Resume button, used for the suggested file name (`<Name>.gigi`) and as the title of a shared web page. A Rename button changes it later.
- Default file names are never translated: `family-export.gigi` for Export, `family.html` for Share.
