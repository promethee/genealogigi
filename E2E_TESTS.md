# Automated tests

What runs by itself, and where each former manual step is now checked. What only a human can judge
is in [MANUAL_TESTS.md](./MANUAL_TESTS.md).

| Suite                           | Command             | Checks          | What it drives                                                                                             |
| ------------------------------- | ------------------- | --------------- | ---------------------------------------------------------------------------------------------------------- |
| Unit (Vitest)                   | `npm test`          | 396             | The data layer, i18n parity, contrast, version consistency                                                 |
| Browser end-to-end (Playwright) | `npm run e2e`       | 249             | The real UI and store in a browser against a fake shell, one spec per feature                              |
| Real app (WebDriver)            | `npm run test:real` | 54 (53 as root) | The real Tauri window: real files, settings, restarts, image decoding, update check, OS theme and language |
| Rust                            | `cargo test --lib`  | 7               | Native commands                                                                                            |

The lists below are generated from the test files; the counts drift, the files are the truth.

## 1. Real-app suite

### `real-app/data.test.mjs`

- **people: saved file, restart, delete**
  - a new family shows the empty message
  - Rename changes the title, is saved in the file, and shows on Resume after a restart
  - dates and a deceased status are written the way the file format says
  - a last name alone is enough; no name at all is refused
  - both people are still there after a real restart
  - delete: Cancel keeps the person, Confirm removes them from the file
- **relationships: saved file, restart, delete, cascade**
  - a parent link is saved; the reverse is refused as a cycle
  - a step link with status and dates is written with those dates
  - both links survive a real restart
  - delete a link: Cancel keeps it, Confirm removes it from the file
  - deleting a person warns about their links and removes them from the file
- **names and events: saved file and restart**
  - a married name is stored with its kind and year
  - editing only the birth date keeps both names
  - an event is saved to the file and is still on the card after a restart
- **the interface language never leaks into the file**
  - using French writes no French text
- **a save that fails**
  - shows an error, lists nothing new and leaves the file alone

### `real-app/os-language.test.mjs`

- **language follows the system, then the user's choice**
  - first launch on a French system is in French and saves nothing
  - choosing English is saved and wins over the French system after a restart

### `real-app/os-theme.test.mjs`

- **theme follows the system, then the user's choice**
  - first launch with a dark system starts dark and saves nothing
  - clicking the toggle switches to light and saves the choice
  - the saved choice wins over the dark system after a restart

### `real-app/photos.test.mjs`

- **photos**
  - two picked images are shrunk to small JPEGs inside the family file
  - the viewer pages through photos; a caption is saved to the file
  - Make main moves the second photo first
  - Remove: Cancel keeps the photo, Confirm removes it from the file
  - Export keeps the photos
  - bad files are skipped with a message; the good one is added
  - the 12-photo limit disables Add
  - the photos are still there after a real restart

### `real-app/real-app.test.mjs`

- **welcome screen (real file dialogs seam, real files and settings)**
  - first launch: welcome screen, Resume greyed out, no error
  - the window title carries the version
  - cancelling the name prompt writes nothing and never reaches the save dialog
  - the name is required: OK stays disabled until something is typed
  - cancelling the save dialog after naming the family writes nothing
  - Create new: loaded view, titled with the name, a real file with schemaVersion 1
  - a person is saved to the real file, atomically
  - after a real restart, Resume offers the file and reopens it
  - Close family returns to the welcome screen, Resume still offered
  - cancelling Open shows no error
  - opening a corrupt file shows an error and leaves the file alone
  - opening the family file loads it
- **export, import with backup, share (real files)**
  - Export writes the same people to another file and keeps the open file
  - Import backs up the previous file (dated, hashed), then replaces the family
  - Share writes one self-contained HTML page with everyone in it
- **settings survive a real restart**
  - language and theme are stored in the real settings file
- **a remembered file that disappeared**
  - shows the missing path, greys out Resume, and creates nothing

### `real-app/updates.test.mjs`

- **update check**
  - no release published yet: no banner, no error
  - Check for updates says you are up to date
  - with no network: 'Could not check', no banner
  - a newer release at startup shows an invitation with the version and the link
  - Download and the link ask the system browser to open the release page
  - Dismiss hides the banner, and it stays hidden after a restart
  - Check for updates shows a dismissed banner again
  - a still newer release brings the banner back after a restart

## 2. Browser end-to-end specs

### `e2e/app-version-update.spec.ts` (12)

- the window title is the name and the version
- a newer release shows a banner with Download and Dismiss at startup
- Download opens the release page
- the banner invites with the version and shows a link that opens the release
- if the browser cannot be opened the link is shown to copy
- Dismiss hides the banner and it stays hidden after a restart
- a dismissed version does not hide a newer one
- nothing is shown when up to date, with no release, or offline
- Check for updates reports 'up to date' and 'could not check'
- a manual check shows the banner again for a dismissed version
- banner and button are French in French
- the app works when the shell has no title, link or update support

### `e2e/birth-date-default.spec.ts` (5)

- the birth year shows a grey example 30 years back and saves nothing by itself
- the example follows the language
- a birth date in the future is rejected, this year alone is fine
- a death date in the future is rejected
- the future-date error is French in French

### `e2e/card-fixes.spec.ts` (12)

- 'Child born' says 'with' the child's other parent, never the child
- a child with only one known parent has no 'with'
- the Close button is at the bottom right of the person card
- the Close button is also at the bottom of the card in the tree tab
- 'Baptism' is not offered when adding an event
- an old baptism event still shows and can be edited
- person (list card)
- person (tree card)
- relationship
- event
- photo
- the question is asked in the active language

### `e2e/confirm-dialog.spec.ts` (4)

- deleting asks in an in-app dialog with the question, focused on Cancel
- Cancel, Escape and the backdrop keep the person; Confirm deletes
- the dialog follows the language and the dark theme
- Confirm is neutral and Cancel is red

### `e2e/dark-theme.spec.ts` (8)

- the toggle switches between light and dark and swaps its icon
- the page background and text really change
- a first launch follows the system preference
- a saved choice wins over the system, and is remembered after a restart
- a live change of the system preference is followed until the user chooses
- the tree and the small family tree use themed colours, not white boxes
- text keeps readable contrast in the ${theme} theme
- the theme button is available on the welcome screen and in French

### `e2e/descendant-chart.spec.ts` (4)

- shows descendants of the chosen root, limited by generations
- a root without children shows only itself
- child links keep their dashed styling
- clicking re-roots and stays in descendants mode; switching back shows ancestors

### `e2e/edit-relationships.spec.ts` (4)

- edits a parent link from adoptive to foster and it survives a restart
- edit form is prefilled and partner dates can be set
- invalid edit shows an error and cancel leaves the link unchanged
- adds partners with a start date

### `e2e/export.spec.ts` (4)

- saves a copy with the same people and keeps the original open
- cancelling the dialog shows nothing and writes nothing
- refuses to copy onto the open file
- the copy-saved message disappears after another change

### `e2e/family-name.spec.ts` (8)

- Create new asks for the family name before the save dialog
- the name is required: OK is disabled when empty; Cancel and Escape create nothing
- Enter in the field confirms
- characters a file name cannot hold are replaced in the suggestion only
- Rename changes the title and is remembered by Resume after a restart
- a family without a name is titled by its file name
- export and share suggest <name>-export.gigi and <name>.html, in any language; the page carries the name
- the prompt is in French in French

### `e2e/focused-person.spec.ts` (4)

- the selector says Focused person, and all generations are drawn by default
- the panel counts ancestors and descendants of the focused person
- a person with no relatives says so, and French is used
- the Generations choice can still limit the chart

### `e2e/hourglass-chart.spec.ts` (3)

- shows ancestors above and descendants below the root
- keeps dashed links and limits each side by generations
- clicking re-roots and stays in hourglass mode

### `e2e/import-export.spec.ts` (5)

- import replaces the family after a confirmation, with a dated and hashed backup
- declining the confirmation changes nothing and writes no backup
- an invalid file shows an error and keeps the family
- skipped items are listed after the import
- close family goes back to the welcome screen, which offers to resume

### `e2e/language.spec.ts` (10)

- the switch is visible at the top right on the welcome screen and changes its text
- the switch stays visible when a family is open, and labels, plurals and hints follow
- switching language keeps what was typed in the form
- the choice is remembered after a restart
- relationship rows and dates are French in French
- the saved file does not depend on the language
- starts in French when nothing was saved
- a saved choice wins over the system language
- French says vivant(e) for a living person in the form only, not in the list or the card
- French: the relationships panel is titled 'Lien / filiation'

### `e2e/name-change-ui.spec.ts` (6)

- a new person has a simple form: one first and one last name, no extra controls
- marriage: the married name becomes main and the list shows the birth name as née
- a first-name change does not become the main name by itself
- choosing the birth name as main name removes the née
- the tree box shows the name, then née and lifespan
- a person edited with an existing single dated name shows detailed controls

### `e2e/name-suggestions.spec.ts` (3)

- last names already saved are suggested, most frequent first
- the married-name field gets the suggestions too, and any other value is accepted
- no suggestions list when nothing is saved yet

### `e2e/pedigree-tree.spec.ts` (5)

- tree tab explains when there is nobody to show, and tabs switch back
- shows the first person as root with ancestors, limited by generations
- draws adoptive links dashed and confirmed links solid, with a legend
- clicking a person re-roots the chart
- the root can be chosen from the list

### `e2e/people-search.spec.ts` (12)

- list view: the list shows only matches, accents and case ignored
- list view: Enter or a result opens the card
- tree view: matches are highlighted and a result focuses the tree on them
- the search is in French too
- toolbar: search in the centre, People/Tree switch on the left
- Add person sits left of the People title; Add relationship left of the Relationships title
- the Tree tab keeps the search centred and the switch on the left
- there is no Sync with Git button (parked for v2)
- the people list has a title with an icon, like the relationships
- Enter closes the suggestions, and typing opens them again
- Escape and clicking elsewhere also close the suggestions
- the people list and the relationships panel start at the same height

### `e2e/person-dates.spec.ts` (5)

- saves birth, deceased status and death date, and shows a summary
- accepts a partial date and a living person
- rejects a day without a month, an impossible day and death before birth
- editing shows the saved dates and keeps them after a restart
- the tree shows a lifespan under names that have dates

### `e2e/person-detail.spec.ts` (15)

- the list shows 'born' and 'died' wording
- clicking a name opens a read-only card with names, birth and death places
- relatives are listed and open that person's card
- a person without data shows a quiet card with no empty sections
- Edit opens the form, saving returns to the card
- Delete exists only on the card and asks for confirmation
- a birth place without a date is saved, a living person has no death place
- saved places are suggested
- the card is French in French
- clicking a person opens their card below the chart without changing the root
- double-click and 'Show tree from here' re-root
- edit in place: the chart shows the new name and the card returns to view
- a relative in the card moves the selection; Close hides the card
- Delete on the tree card removes the person and closes the card
- a name that is not the default kind still shows its kind

### `e2e/person-mini-tree.spec.ts` (6)

- the card shows parents above, partner beside, children below
- a non-confirmed child link is dashed and noted; confirmed links are solid
- clicking a box opens that person's card and redraws the tree around them
- the card of someone with no family has no small tree
- only children: no row above
- French heading, and the tree also shows in the tree tab's card

### `e2e/person-names.spec.ts` (7)

- adds a nickname and a married name with a year
- rejects an invalid name date
- the chosen primary name is the one displayed
- up and down reorder names and are disabled at the ends
- blank rows are ignored, and all-blank is rejected
- a person with several names can be edited without losing any, and survives a restart
- the tree shows the primary name

### `e2e/person-notes.spec.ts` (4)

- a note typed in the form shows on the card with its line breaks
- no note, no Notes section; editing keeps and changes the note
- the note is saved in the file and survives a restart
- search finds a word that is only in a note, and French labels are used

### `e2e/person-parents.spec.ts` (8)

- no Parents section when nobody exists yet, nor when editing
- creating a person with two parents saves the person and both links
- one parent, with an adoptive nature
- no parent chosen creates only the person
- choosing a parent who is already the other parent empties the other field
- an invalid person saves no parent links either
- optionally records the parents as partners, only when they are not yet
- French labels

### `e2e/person-photos.spec.ts` (17)

- a person without photos shows initials and an Add photos button
- adding a photo makes it the main one, shown in the card and the list
- a large image is shrunk to 480 px on its longest side and stored as JPEG in the file
- several photos at once keep their order; the first stays main
- a cancelled picker changes nothing; a file that is not an image is reported
- a good image next to a bad one: the good one is added, the problem is reported
- a person can have at most 12 photos
- the viewer shows the photo, navigates, captions, makes main and closes
- removing a photo asks first; removing the main one promotes the next
- photos survive a restart and a copy of the family, and go with the person
- a file without photos loads and shows initials
- a box shows a round portrait at the left, initials when there is no photo
- long names are shortened and stay inside the box, to the right of the portrait
- clicking and double-clicking a box with a portrait still work
- the card's small tree shows portraits too
- portraits and discs stay visible in the dark theme
- French labels in the gallery and viewer

### `e2e/person-record.spec.ts` (6)

- empty family shows an invitation to add a person
- adds people with both names or only one
- rejects a person with no name
- edits a person's name
- deleting asks for confirmation and respects cancel
- people survive a restart

### `e2e/person-timeline.spec.ts` (9)

- a new card shows birth and death in order, plus an Add event button
- a person with nothing recorded says so
- adds a marriage with another person; it is on both timelines, in order
- the event survives a restart
- type Other needs a description; future dates are rejected
- edit and delete a user event; delete asks for confirmation
- the person cannot be added to their own event, nor twice
- names with dates, children and partnerships appear on the timeline
- French timeline and form

### `e2e/project-page.spec.ts` (5)

- the page is in French without any click
- the page stays in English
- falls back to English
- ?lang=en wins over the browser, and the footer links switch and are remembered
- the hero screenshot is shown whole, never cropped by its frame

### `e2e/relationship-record.spec.ts` (6)

- add controls are disabled until two people exist
- adds a parent-child relationship and it survives a restart
- rejects a cycle and a duplicate; the same person on both sides is impossible
- adds partners; reversed duplicate is rejected
- deleting a relationship respects cancel and confirm
- deleting a person also removes their relationships

### `e2e/relationship-search.spec.ts` (3)

- searching keeps only the relationship lines of the people found
- a search that finds nobody says so; clearing it brings every line back
- filtering the lines never narrows the choices of the relationship form

### `e2e/saved-with.spec.ts` (2)

- the family file records the app version that wrote it
- an older stamp is replaced by the next save

### `e2e/share-web-page.spec.ts` (11)

- Share is disabled until there are two people and one relationship
- French explains why Share is disabled
- declining the warning writes nothing; the warning says everyone is included
- the exported page lists people, searches, and follows relatives
- hostile text in a name is shown as text and never runs
- on a phone the list and the card alternate, with a Back button
- the page is written in the app's language
- the exported page has a Tree view with everyone; a box opens that person
- the Tree view shows partners in their own colour and fits the window
- the Tree view shows a person's portrait in their box, initials otherwise
- the Tree view is centred in its frame when it is narrower than the window

### `e2e/temporary-parents.spec.ts` (4)

- adds an ended step link with a period and shows dates only when relevant
- ongoing foster link shows its start; permanent natures hide the extra fields
- rejects end before start, a bad date and a repeated nature
- tree draws a foster parent with a dashed link

### `e2e/tree-default.spec.ts` (2)

- opens on the tree when relationships exist, on the people list otherwise
- a family without relationships resumes on the people list

### `e2e/tree-filters.spec.ts` (7)

- filters are collapsed by default and stay open while one is on
- nothing is faded until a filter is chosen
- Living fades the deceased, and keeps them clickable
- filters add up: place, month and last name
- links to faded people fade, and Reset brings everything back
- the filter panel has no explanatory title: the fading speaks for itself
- filters are offered in French with month names

### `e2e/tree-siblings.spec.ts` (8)

- siblings are shown by default, and can be switched off
- older siblings are on the left, younger or unknown on the right
- siblings are linked to the shared parents and only the root is highlighted
- a sibling box opens its card, and double-click re-roots on it
- the option is not offered in the descendants view, but is in the hourglass
- a root without parents shows no siblings and nothing breaks
- French label, and the card has an explicit Close button
- the card's siblings title is singular for one sibling, plural for several (English and French)

### `e2e/two-parents.spec.ts` (8)

- 'Parent of' is the one parent type: parent, optional other parent, child
- with no other parent, a single parent link is added
- adds both parents of a child in one step and survives a restart
- the nature and dates apply to both links
- the same person twice, missing choices and an existing link add nothing
- a person can never end up as their own parent or as both parents
- optionally records the parents as partners, once
- French labels

### `e2e/ui-polish-3.spec.ts` (6)

- opening the person form puts the cursor in the first name
- the People / Tree switch sits on the left, before the search box
- a person's name in the list is plain text, not a clickable control
- the share confirmation is green and neutral; a delete confirmation keeps its warning look
- in the small family tree the partner segment has its own colour
- a name is saved as typed and shown with its first letter in uppercase

### `e2e/ui-polish.spec.ts` (12)

- the language switch shows a flag and the language's own name
- welcome screen: name, tagline and three icon buttons
- rows have a View button with an eye icon; Edit and Delete are on the person card
- French: the row button reads Voir
- the people list shows an avatar with initials
- a new person starts as living
- an old birth year switches the status to deceased, and back
- a status the user picked is never changed automatically
- unknown is still selectable and an existing unknown status is shown when editing
- the relationships list leaves confirmed biological unmarked and shows other natures
- the card does not spell out 'living' or an unknown partner status
- the header logo draws the shared tree mark

### `e2e/vertical-tree.spec.ts` (5)

- ancestors are drawn above the root, generation by generation
- links join the bottom of a parent to the top of the child
- descendants hang below the root
- the chart scrolls once it would have to shrink below its floor
- the chart shrinks to fit the panel instead of scrolling, down to a floor

### `e2e/welcome-screen.spec.ts` (3)

- fresh start shows welcome with Resume disabled
- create new, then resume after restart
- opening a corrupt file shows an error and stays on welcome

### `e2e/whole-family-tree.spec.ts` (5)

- Everyone shows every person exactly once, linked, with the controls it does not need hidden
- Everyone joins partners with a segment in the partner colour
- clicking a box in Everyone opens that person's card
- switching back to a focused view restores the controls
- the Tree tab opens on the whole family by default

### `e2e/wide-layout.spec.ts` (2)

- on a wide window the people list and the relationships sit side by side
- on a narrow window they stack

## 3. Former manual steps, now automated

The step-by-step list that used to be the manual test file, by feature. Each section says which test files check it. Rows only a human can judge (marked below) were kept in [MANUAL_TESTS.md](./MANUAL_TESTS.md) in its own form. The wording of these steps is historical (some labels have since been renamed, for example "Save a copy" became "Export…"); the test files are the truth.

### Welcome screen

Automated by: `e2e/welcome-screen.spec.ts`, `real-app/real-app.test.mjs: welcome screen`.

| #   | Action                                                                  | Expected                                                                                            |
| --- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1   | First launch (delete `%APPDATA%\app.genealogigi\settings.json` first)   | Welcome screen. "Resume last family" is greyed out. No error.                                       |
| 2   | Click **Create new family…**, choose a folder, keep `family.gigi`, Save | App shows the path and "0 people · 0 relationships". File exists and contains `"schemaVersion": 1`. |
| 3   | Close the app, relaunch                                                 | Welcome screen. Resume button reads "Resume family.gigi" and is enabled.                            |
| 4   | Click **Resume**                                                        | Same loaded view as step 2.                                                                         |
| 5   | Relaunch, click **Open family file…**, then Cancel                      | Still on welcome. No error.                                                                         |
| 6   | Click **Open family file…**, pick a file containing `{not json`         | Red message "The file is not valid JSON." Still on welcome. The file is unchanged.                  |
| 7   | Click **Open family file…**, pick the file from step 2                  | Loaded view appears.                                                                                |
| 8   | Close the app, rename or delete the file from step 2, relaunch          | Message "Last family file not found: ...". Resume greyed out. No new file created.                  |
| 9   | Click **Create new family…**, then Cancel                               | Still on welcome. No file written.                                                                  |

### Person record

Automated by: `e2e/person-record.spec.ts`, `real-app/data.test.mjs: people, saved file, restart, delete`.

| #   | Action                                                      | Expected                                                                         |
| --- | ----------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | Open a new empty family                                     | "0 people" and the message "No people yet. Add the first person to get started." |
| 2   | Add person with first "Ada" and last "Lovelace"             | The list shows "Ada Lovelace". The header says "1 person".                       |
| 3   | Add person with only last name "Byron"                      | The list shows "Byron".                                                          |
| 4   | Add person with both fields empty                           | Message "At least one name is required." Nothing added.                          |
| 5   | Edit "Byron": add first name "Annabella"                    | The list shows "Annabella Byron".                                                |
| 6   | Close the app, relaunch, click Resume                       | Both people are still listed.                                                    |
| 7   | Open the file in a text editor                              | `people` has 2 entries. Names have `"kind": "birth"`.                            |
| 8   | Delete "Annabella Byron", click Cancel in the native dialog | The person remains.                                                              |
| 9   | Delete "Annabella Byron", confirm in the native dialog      | The person disappears and the file has 1 person.                                 |
| 10  | Make the file read-only, then add a person                  | An error is shown and the person is not listed. Restore the file after.          |

### Relationships

Automated by: `e2e/relationship-record.spec.ts`, `real-app/data.test.mjs: relationships, saved file, restart, delete, cascade`.

| #   | Action                                                                            | Expected                                                                                                                  |
| --- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1   | Open a family with one person                                                     | The relationship controls are disabled and a hint says to add people first.                                               |
| 2   | With two people, choose "Parent of", Ada, Byron, "biological, confirmed", Add     | The list shows "Ada is parent of Byron" (confirmed biological is the unmarked default).                                   |
| 3   | Add the reverse (Byron parent of Ada)                                             | Error mentioning a cycle. Nothing added.                                                                                  |
| 4   | Add Ada parent of Byron again                                                     | Error "already exists".                                                                                                   |
| 5   | Choose Ada and Ada                                                                | Error "cannot be their own parent".                                                                                       |
| 6   | Choose "Partner of", Ada, Byron, status ongoing, Add; then Byron, Ada, ongoing    | First is listed, second is rejected as existing.                                                                          |
| 7   | Add Ada and Byron as partners with status ended                                   | Accepted: same pair, different status.                                                                                    |
| 8   | Close the app, relaunch, Resume                                                   | All relationships are still listed.                                                                                       |
| 9   | Delete a relationship, Cancel in the native dialog, then delete again and confirm | Cancel keeps it. Confirm removes it, and the file no longer contains it.                                                  |
| 10  | Delete Ada (who has relationships)                                                | The native dialog mentions the number of relationships. After confirming, those relationships are gone and Byron remains. |

### Pedigree tree

Automated by: `e2e/pedigree-tree.spec.ts`, `e2e/vertical-tree.spec.ts`.

| #   | Action                                                             | Expected                                                                                  |
| --- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| 1   | In an empty family, open the **Tree** tab                          | Message "Nobody to show yet..."                                                           |
| 2   | With the family above, open **Tree**                               | "Me" is root (green box) with Mum and Dad to the right, Gran and GreatGran further right. |
| 3   | Look at the lines                                                  | The line to Dad is dashed. The other lines are solid. The legend explains both.           |
| 4   | Set **Generations** to 2                                           | GreatGran disappears. Gran stays.                                                         |
| 5   | Click "Mum" in the chart                                           | Mum becomes the green root. Only Mum, Gran and GreatGran are shown.                       |
| 6   | Pick "Me" from **Root person**                                     | The chart returns to Me as root.                                                          |
| 7   | Switch to **People** and back to **Tree**                          | The list shows, then the chart again.                                                     |
| 8   | Add a person with a very long name (40+ letters) as a parent of Me | The box shows the name cut with an ellipsis. Hovering shows the full name.                |
| 9   | Resize the window narrower than the chart                          | The chart scrolls inside its frame. The page layout does not break.                       |

### Export, import and close

Automated by: `e2e/export.spec.ts`, `e2e/import-export.spec.ts`, `real-app/real-app.test.mjs: export, import with backup, share`.

| #   | Action                                                             | Expected                                                                                                                                             |
| --- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Click **Export…**, then Cancel                                     | Nothing happens. No message.                                                                                                                         |
| 2   | Click **Export…**, choose a new file name, Save                    | Green message "Exported to ...: N people · ...". The file has the same people. Header path unchanged.                                                |
| 3   | Click **Export…**, choose the open file                            | Error "Choose a different file...". The open file is not modified.                                                                                   |
| 4   | Click **Import…**, then Cancel in the file dialog                  | Nothing happens.                                                                                                                                     |
| 5   | **Import…** the exported file after adding a person                | A confirmation shows both counts, the REPLACE warning and the backup file name. Cancel changes nothing.                                              |
| 6   | Confirm the import                                                 | Family is replaced. Green message names the backup. A `<name>.backup-<date>-<time>-<hash>.json` exists next to the file and holds the previous data. |
| 7   | **Import…** a non-JSON file, then a JSON file that is not a family | A red error each time. The family is unchanged and no backup is written.                                                                             |
| 8   | **Import…** the file that is open                                  | Error "That is the file currently open".                                                                                                             |
| 9   | Click **Close family**                                             | Back to the welcome screen. **Resume** reopens the same family.                                                                                      |
| 10  | Quit and relaunch, click Resume                                    | The original file opens, not the exported one.                                                                                                       |

### Person dates and life status

Automated by: `e2e/person-dates.spec.ts`, `e2e/birth-date-default.spec.ts`, `real-app/data.test.mjs: people (dates in the file)`.

| #   | Action                                                                          | Expected                                                                                                           |
| --- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1   | Add person Ada, birth 10 December 1815, status Deceased, death 27 November 1852 | List shows "born 10 Dec 1815 · died 27 Nov 1852".                                                                  |
| 2   | Edit Ada                                                                        | All fields are pre-filled with the saved values.                                                                   |
| 3   | Add person with only birth year 1900                                            | List shows "born 1900".                                                                                            |
| 4   | Enter a day but no month                                                        | Error "A day needs a month." Nothing saved.                                                                        |
| 5   | Enter 31 April                                                                  | Error that the day does not exist in that month.                                                                   |
| 6   | Enter death year earlier than birth year                                        | Error "Death cannot be before birth."                                                                              |
| 7   | Status Deceased with empty death date                                           | Saved. List shows "deceased".                                                                                      |
| 8   | Open the file in a text editor                                                  | Dates have `raw` plus `yearKnown`/`monthKnown`/`dayKnown` flags. A partial date has `false` for the missing parts. |
| 9   | Tree tab, root Ada                                                              | The box shows "1815–1852" under the name.                                                                          |

### Several names per person

Automated by: `e2e/person-names.spec.ts`, `real-app/data.test.mjs: names and events`.

| #   | Action                                                                                              | Expected                                                                                         |
| --- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1   | Add person: first name Ada, last name Byron. Click **+ Add first name**, enter Addie, kind Nickname | Two first-name rows.                                                                             |
| 2   | Click **+ Add last name**, enter King, kind Married, year 1835. Save                                | List shows "Ada Byron".                                                                          |
| 3   | Edit the person                                                                                     | Both first names and both last names are shown with their kinds. The married name has year 1835. |
| 4   | Mark Addie as **Primary**, save                                                                     | List and Tree show "Addie Byron".                                                                |
| 5   | Use the arrow buttons to move Addie above Ada                                                       | Order changes. The first row's up arrow and the last row's down arrow are disabled.              |
| 6   | Add an empty name row and save                                                                      | Saved without the empty row.                                                                     |
| 7   | Clear every name and save                                                                           | Error "At least one name is required."                                                           |
| 8   | Enter an impossible name date (31 April)                                                            | Error naming the name field. Nothing saved.                                                      |
| 9   | Open the file in a text editor                                                                      | Each name has `kind`, `date`, and exactly one entry per list has `"primary": true`.              |
| 10  | Edit only the birth date of a person with a nickname, then reopen the file                          | The nickname, its kind and date are unchanged.                                                   |

### Step, foster and guardian parents

Automated by: `e2e/temporary-parents.spec.ts`, `real-app/data.test.mjs: relationships (step link dates)`.

| #   | Action                                                                                      | Expected                                                                 |
| --- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | Add Ada and Byron. Parent of: Ada -> Byron, nature Step, status Ended, start 1990, end 1995 | Row "Ada is parent of Byron (step, 1990–1995)".                          |
| 2   | Switch nature to Biological, confirmed                                                      | Status and date fields disappear.                                        |
| 3   | Add Foster, status Ongoing, start year 2000                                                 | Row shows "(foster, from 2000)".                                         |
| 4   | Add Foster again for the same pair                                                          | Error "already exists".                                                  |
| 5   | Step, Ended, start 1995, end 1990                                                           | Error "end date cannot be before the start date."                        |
| 6   | Start 31 April                                                                              | Error naming the start date.                                             |
| 7   | Tree tab, root Byron                                                                        | Ada appears with dashed lines; legend mentions step, foster or guardian. |
| 8   | Open the file in a text editor                                                              | Temporary links have `status`, `startDate` and (if ended) `endDate`.     |

### Edit relationships

Automated by: `e2e/edit-relationships.spec.ts`.

| #   | Action                                                               | Expected                                            |
| --- | -------------------------------------------------------------------- | --------------------------------------------------- |
| 1   | Add Ada -> Byron adoptive. Click **Edit**, nature Foster, start 2000 | Row "Ada is parent of Byron (foster, from 2000)".   |
| 2   | Quit and relaunch, Resume                                            | The edited row is unchanged.                        |
| 3   | Add partners Ada and Byron. Edit: Ended, start 1990, end 1995        | Row "(ended, 1990–1995)".                           |
| 4   | Click Edit again                                                     | Fields show 1990 and 1995.                          |
| 5   | Edit with end 1980 and start 1990                                    | Error "end date cannot be before"; form stays open. |
| 6   | Click Cancel                                                         | Form closes, row unchanged.                         |
| 7   | Add partners with start year 1985                                    | Row "(ongoing, from 1985)".                         |

### Descendant chart

Automated by: `e2e/descendant-chart.spec.ts`.

| #   | Action                                                                                      | Expected                                        |
| --- | ------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 1   | Family: Gran -> Mum -> Me, Gran -> Uncle (adoptive). Tree tab, Show: Descendants, root Gran | Gran at left; Mum and Uncle next; Me after Mum. |
| 2   | Look at the Uncle link                                                                      | Dashed line.                                    |
| 3   | Generations 2 with a great-grandchild present                                               | The great-grandchild is not shown.              |
| 4   | Click Mum                                                                                   | Mum becomes root; still showing descendants.    |
| 5   | Show: Ancestors                                                                             | Mum and her ancestors.                          |

### Hourglass chart

Automated by: `e2e/hourglass-chart.spec.ts`.

| #   | Action                                                              | Expected                                                    |
| --- | ------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | Family Gran -> Mum -> Me -> Kid. Tree tab, Show: Hourglass, root Me | Gran, Mum left of Me; Kid right of Me; Me appears once.     |
| 2   | Look at the links                                                   | Lines join the facing sides of the boxes; none cross boxes. |
| 3   | Click Mum                                                           | Mum becomes root; still hourglass.                          |
| 4   | Generations 2 on Gran                                               | Kid (3 generations down) is not shown.                      |

### Tree first

Automated by: `e2e/tree-default.spec.ts`.

| #   | Action                                                     | Expected                                                                                                                    |
| --- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1   | Resume or open a family that has at least one relationship | The Tree tab is shown first. (Earlier steps that resume a family and then look at the list need a click on the People tab.) |
| 2   | Create a new family                                        | The People tab is shown.                                                                                                    |
| 3   | Add the first relationship                                 | You stay on the People tab.                                                                                                 |

### Name changes (marriage) and simple name form

Automated by: `e2e/name-change-ui.spec.ts`.

| #   | Action                                                                                       | Expected                                                                     |
| --- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1   | Click **Add person**                                                                         | One First name and one Last name field. No kind, date or Main name controls. |
| 2   | Enter Marie / Martin. Click **+ Last name changed (e.g. marriage)**. Enter Dubois, year 2001 | A second row: kind Married, "Since year". Save.                              |
| 3   | Look at the people list                                                                      | "Marie Dubois (née Martin)".                                                 |
| 4   | Tree tab with Marie                                                                          | Box: "Marie Dubois" and, below, "née Martin · …".                            |
| 5   | Edit Marie, mark the Martin row as **Main name**, save                                       | "Marie Martin" with no "née".                                                |
| 6   | Add a person, click **+ First name changed**, enter Mia                                      | Saved as "Marie Martin": the new first name is not main until you choose it. |
| 7   | Click into a year box in the form                                                            | No stray autofill suggestion (e.g. "1981") appears.                          |

### Language (English / French)

Automated by: `e2e/language.spec.ts`, `real-app/os-language.test.mjs`, `real-app/real-app.test.mjs: settings survive a real restart`, `real-app/data.test.mjs: the interface language never leaks into the file`.

| #   | Action                                                                    | Expected                                                                        |
| --- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1   | Launch the app                                                            | **EN / FR** switch at the top right, visible on the welcome screen.             |
| 2   | Click FR                                                                  | All welcome buttons switch to French.                                           |
| 3   | Open a family; check the switch                                           | Still at the top right, still visible after scrolling a long list.              |
| 4   | Start adding a person, type a name, click EN then FR                      | The typed name is still there; labels switch each time.                         |
| 5   | Month list in the birth date                                              | "Janvier … Décembre" in French, "January … December" in English.                |
| 6   | Trigger an error (a parent link of a person to themself), switch language | The new error appears in the chosen language.                                   |
| 7   | Delete a person with relationships                                        | The native confirmation text is in the chosen language (buttons follow the OS). |
| 8   | Quit and relaunch                                                         | The last chosen language is used.                                               |
| 9   | Delete the app's saved settings and set the OS language to French         | First launch is in French.                                                      |
| 10  | Open the family file in a text editor after using French                  | Same JSON structure as before: no French text added by the app.                 |

### Vertical tree

Automated by: `e2e/vertical-tree.spec.ts`.

| #   | Action                                                          | Expected                                                                                        |
| --- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 1   | Tree tab, Show: Ancestors, a root with parents and grandparents | Root at the bottom; parents on the row above, side by side; oldest at the top.                  |
| 2   | Look at the links                                               | Vertical elbows from the top of a child to the bottom of each parent; dashed for non-confirmed. |
| 3   | Show: Descendants                                               | Root at the top; children below, grandchildren below them.                                      |
| 4   | Show: Hourglass                                                 | Ancestors above the root, descendants below, root in the middle.                                |
| 5   | Generations 6 with a large family, or shrink the window         | The chart area scrolls horizontally and vertically; the page itself does not.                   |
| 6   | Narrow chart (few ancestors)                                    | Centred in the chart area.                                                                      |

### Look and feel, flags, defaults

Automated by: `e2e/ui-polish.spec.ts`, `e2e/card-fixes.spec.ts`.

Left to a human (see MANUAL_TESTS.md): rows 1, 5, 10.

| #   | Action                                                       | Expected                                                                                                                                                                                   |
| --- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2   | Look at the language switch (top right)                      | A UK flag + "English" and a French flag + "Français"; the flags are real images, not letters.                                                                                              |
| 3   | Switch to French                                             | Names stay "English" and "Français"; the rest turns French.                                                                                                                                |
| 4   | Open a family, look at the people list                       | Avatar circles with initials; each row has a **View** button (eye icon); on the person card **Edit** and **Delete** are bordered buttons with icons, Delete is red; hover highlights them. |
| 6   | Click **Add person**                                         | Life status is **Living**.                                                                                                                                                                 |
| 7   | Type birth year 1815                                         | Status becomes **Deceased** by itself and death fields appear. Pick another status by hand, then change the year: it no longer changes.                                                    |
| 8   | Edit a person saved with status Unknown                      | The form shows Unknown.                                                                                                                                                                    |
| 9   | Add a confirmed biological parent link, then an adoptive one | "Ada is parent of Byron" (no parentheses) and "Ada is parent of Cleo (adoptive)".                                                                                                          |

### Last-name suggestions

Automated by: `e2e/name-suggestions.spec.ts`.

| #   | Action                                                  | Expected                       |
| --- | ------------------------------------------------------- | ------------------------------ |
| 1   | Add Ada Martin, Byron Dubois and Cleo Dubois            | Saved.                         |
| 2   | Add person, click into Last name and type "D"           | A popup suggests "Dubois".     |
| 3   | Clear the field and click into it again                 | "Dubois" first, then "Martin". |
| 4   | Click **+ Last name changed**, click into the new field | The same suggestions appear.   |
| 5   | Type a name that is not suggested and save              | Saved exactly as typed.        |
| 6   | Click into First name                                   | No suggestions.                |

### Two parents at once and birth date hints

Automated by: `e2e/two-parents.spec.ts`, `e2e/birth-date-default.spec.ts`.

| #   | Action                                                         | Expected                                                                                       |
| --- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1   | Add Ada, Cleo and Byron. Open the Relationships form           | Type is **Parents of** with fields Child, Parent 1, Parent 2 and Nature.                       |
| 2   | Child Byron, Parent 1 Ada, Parent 2 Cleo, Add                  | Two rows: "Ada is parent of Byron" and "Cleo is parent of Byron".                              |
| 3   | Repeat with the same three people                              | Error "already exists"; still two rows.                                                        |
| 4   | Tick **Also record the parents as partners** for another child | A third row "Ada and Cleo are partners (unknown)". The box is gone for that couple afterwards. |
| 5   | Nature Foster with start year 2000                             | Both rows show "(foster, from 2000)".                                                          |
| 6   | Switch the type to **Parent of**                               | The single-parent form (Parent, Child) is back.                                                |
| 7   | Add person: look at the birth year box                         | A grey hint like "e.g. 1996" (30 years ago); the box is empty.                                 |
| 8   | Save without typing a birth year                               | No birth date stored.                                                                          |
| 9   | Enter next year as the birth year                              | Error "Birth date cannot be in the future."                                                    |
| 10  | Deceased with a death year in the future                       | Error "Death date cannot be in the future."                                                    |

### Person card, places, delete on the card

Automated by: `e2e/person-detail.spec.ts`, `e2e/card-fixes.spec.ts`.

| #   | Action                                                                            | Expected                                                                                         |
| --- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1   | Add a person with birth year 1815, birth place London, deceased 1852, place Paris | The list shows "born 1815 · died 1852".                                                          |
| 2   | Click the person's name                                                           | A card opens: names (kind, main marked), "born 1815 in London", "died 1852 in Paris", relatives. |
| 3   | Click a parent or child name in the card                                          | That person's card opens.                                                                        |
| 4   | Click **Edit** in the card, change the place, Save                                | Back on the card with the new place.                                                             |
| 5   | Look at the list rows                                                             | Only **Edit**: no Delete button.                                                                 |
| 6   | Open a card, click **Delete**, cancel, then Delete and confirm                    | Cancel keeps the person; confirm removes the person and their relationships and closes the card. |
| 7   | Tree tab: click a person                                                          | Their card opens **below** the chart; the chart root is unchanged and the box is outlined.       |
| 8   | Double-click a person, or click **Show tree from here**                           | The chart re-centres on them.                                                                    |
| 9   | Edit a person from the tree card and Save                                         | The chart and the card show the new name.                                                        |
| 10  | Add person, click into Birth place                                                | Places already saved are suggested.                                                              |
| 11  | App logo (top left) and window/taskbar icon                                       | A tree growing upward: root at the bottom, branches above.                                       |

### Version and update check

Automated by: `e2e/app-version-update.spec.ts`, `real-app/updates.test.mjs`, `real-app/real-app.test.mjs: window title`.

| #   | Action                                                                                  | Expected                                                                          |
| --- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1   | Launch the app, look at the window title bar and the taskbar                            | "Genealogigi 0.1.0".                                                              |
| 2   | Launch with no GitHub release published yet                                             | No banner, no error.                                                              |
| 3   | Click **Check for updates** (top bar)                                                   | "You are up to date (0.1.0)." for a few seconds.                                  |
| 4   | Disconnect the network, click **Check for updates**                                     | "Could not check for updates."; the app keeps working.                            |
| 5   | Publish a GitHub release tagged v0.2.0 (or temporarily lower the app version), relaunch | A banner "Version 0.2.0 is available (you have 0.1.0)" with Download and Dismiss. |
| 6   | Click **Download**                                                                      | The release page opens in your browser; nothing is installed.                     |
| 7   | Click **Dismiss**, relaunch                                                             | The banner stays hidden for 0.2.0.                                                |
| 8   | Click **Check for updates** after dismissing                                            | The banner shows again.                                                           |
| 9   | Publish v0.3.0, relaunch                                                                | The banner returns for 0.3.0.                                                     |

### Parents while creating a person

Automated by: `e2e/person-parents.spec.ts`.

| #   | Action                                                                                   | Expected                                                                               |
| --- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1   | Start a new family, click **Add person**                                                 | No Parents section (nobody to choose).                                                 |
| 2   | Add Ada and Cleo. Click **Add person**, name Byron                                       | A **Parents (optional)** section with Parent 1 and Parent 2 (both "None").             |
| 3   | Choose Ada and Cleo, Save                                                                | Byron is added; the list shows "Ada is parent of Byron" and "Cleo is parent of Byron". |
| 4   | Add another person, choose only Parent 1, nature adoptive                                | One adoptive link.                                                                     |
| 5   | Choose the same person for both parents                                                  | Error "must be different people"; nothing saved.                                       |
| 6   | Birth year in the future with a parent chosen                                            | Error; neither the person nor the link is saved.                                       |
| 7   | Choose two parents who are not partners and tick **Also record the parents as partners** | A partnership (unknown) is added too; the box is gone next time for that couple.       |
| 8   | Edit an existing person                                                                  | No Parents section.                                                                    |

### Siblings in the tree, Close button

Automated by: `e2e/tree-siblings.spec.ts`.

| #   | Action                                                                                                  | Expected                                                                                      |
| --- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 1   | Family: Mum + Dad with Me (1980), Older (1975), Younger (1985); Mum + Step with Half. Tree tab, root Me | Only Me, Mum, Dad.                                                                            |
| 2   | Tick **Show siblings**                                                                                  | Older, Younger and Half appear on Me's row, linked to their shared parents; only Me is green. |
| 3   | Look at their order                                                                                     | Older to the left of Me; Younger and Half to the right.                                       |
| 4   | Half's links                                                                                            | A single line, to Mum.                                                                        |
| 5   | Click a sibling                                                                                         | Their card opens below the chart; double-click makes them the root.                           |
| 6   | Show: Descendants                                                                                       | The checkbox disappears. Hourglass: it is back.                                               |
| 7   | Open any person card                                                                                    | An explicit **Close** button (text, no "X" icon) closes it.                                   |

### Timeline and events

Automated by: `e2e/person-timeline.spec.ts`, `real-app/data.test.mjs: names and events (event saved, still there after a restart)`.

| #   | Action                                                                                | Expected                                                                                |
| --- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | Open the card of a person born 1950 in Lyon, deceased 2020                            | A **Timeline** with "Born in Lyon" first and "Died" last.                               |
| 2   | Give them a dated married name (1975), a child born 1980, a partnership starting 1972 | Entries appear in date order: partnership, name, child's birth between birth and death. |
| 3   | Click **Add event**, type Marriage, year 1975, place Lyon, add Paul under **With**    | "Marriage in Lyon" appears, with "with Paul".                                           |
| 4   | Click Paul's name in the entry                                                        | Paul's card opens; his timeline shows the same marriage, linking back.                  |
| 5   | Type **Other** without a description, Save                                            | Error asking for a description.                                                         |
| 6   | Enter a future year                                                                   | Error "cannot be in the future".                                                        |
| 7   | **Edit** the event (blue dot) and change the place; Save                              | The new place shows on both people's timelines.                                         |
| 8   | **Delete** the event, cancel, then confirm                                            | Cancel keeps it; confirm removes it from both timelines.                                |
| 9   | Look at the birth, name and child entries                                             | No Edit/Delete on them (they come from the person and relationships).                   |
| 10  | Delete Paul (card, Delete)                                                            | The marriage stays on Marie's timeline without Paul.                                    |
| 11  | Quit, relaunch, reopen the card                                                       | Events are still there; open the JSON: an `events` list with `personIds`.               |

### Small family tree on the card

Automated by: `e2e/person-mini-tree.spec.ts`.

| #   | Action                                                           | Expected                                                                                                          |
| --- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1   | Open the card of someone with two parents, a partner and a child | **Immediate family**: parents above (side by side), the person in green with the partner beside, the child below. |
| 2   | Make the child link adoptive                                     | A dashed line to the child and the word "adoptive" in the box.                                                    |
| 3   | Click the child's box                                            | The child's card opens; the small tree is redrawn around them.                                                    |
| 4   | Open the card of someone with no parent, partner or child        | No small tree.                                                                                                    |
| 5   | Open the card of someone with only children                      | No row above; children below.                                                                                     |
| 6   | Many children                                                    | The little tree scrolls sideways inside its frame.                                                                |
| 7   | Open a card from the Tree tab                                    | The small tree is there too.                                                                                      |

### Light / dark theme

Automated by: `e2e/dark-theme.spec.ts`, `real-app/os-theme.test.mjs`.

Left to a human (see MANUAL_TESTS.md): rows 3, 4.

| #   | Action                                                                                     | Expected                                                                   |
| --- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| 1   | Delete the app's saved settings, set Windows to dark mode, launch                          | The app starts dark. With Windows in light mode it starts light.           |
| 2   | Click the sun/moon button in the top bar (next to the language switch)                     | The whole app switches at once, with no half-white panels or fading flash. |
| 5   | Quit and relaunch                                                                          | The last choice is kept, with no flash of the other theme at startup.      |
| 6   | Change Windows' light/dark setting while the app is open (before ever clicking the button) | The app follows. After a click on the button it no longer follows.         |
| 7   | Show an update banner / error message in dark mode                                         | Coloured panels are dark tinted with light text.                           |

### Photos

Automated by: `e2e/person-photos.spec.ts`, `real-app/photos.test.mjs`.

Left to a human (see MANUAL_TESTS.md): rows 1, 8, 10, 11.

| #   | Action                                                           | Expected                                                                                                                         |
| --- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 2   | Pick two photos straight from a phone/camera (large, 4000 px)    | Both appear as thumbnails; the first has a star (main) and is the avatar in the card header and the people list.                 |
| 3   | Check the family file size before and after                      | It grew by roughly 30–100 KB per photo, not by the original sizes.                                                               |
| 4   | Open a photo (click a thumbnail)                                 | A viewer with the photo, "1 / 2", arrows (also ← → keys), caption field, **Make main**, **Remove**, **Close** (Esc also closes). |
| 5   | Type a caption, **Save caption**; close and reopen the photo     | The caption is still there.                                                                                                      |
| 6   | **Make main** on the second photo                                | It moves first and becomes the avatar everywhere.                                                                                |
| 7   | **Remove** and cancel, then Remove and confirm                   | Cancel keeps it; confirm removes it; removing the main promotes the next.                                                        |
| 9   | Click, then double-click a box with a portrait                   | Click opens the card below; double-click re-centres.                                                                             |
| 12  | **Export…**, open the export                                     | The photos are in the copy.                                                                                                      |
| 13  | Try to add a 13th photo, a .txt renamed to .png, a corrupt image | Add is disabled at 12; bad files give "not a supported image" and are skipped; good ones in the same selection are still added.  |
| 14  | Sync with git (if configured)                                    | The family file (with photos) is committed and pushed.                                                                           |

### Living status wording

Automated by: `e2e/language.spec.ts`, `e2e/person-detail.spec.ts`, `e2e/ui-polish.spec.ts`.

| #   | Action                                   | Expected                                                                                                                 |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | Add a living person with birth year 1990 | The list row says "born 1990" and does not say "living".                                                                 |
| 2   | Add a living person with no dates        | The row has just the name (no second line).                                                                              |
| 3   | A deceased person                        | "born … · died …" (or "deceased").                                                                                       |
| 4   | Open a living person's card              | The Life section says "living".                                                                                          |
| 5   | Switch to French                         | The card says "vivant(e)" and the form's status choice says "Vivant(e)"; the list still shows nothing for living people. |

### Confirmation dialog and wide layout

Automated by: `e2e/confirm-dialog.spec.ts`, `e2e/wide-layout.spec.ts`.

| #   | Action                                   | Expected                                                                                    |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | Delete a person from its card            | An in-app dialog (app colours, theme, language) asks; Cancel is focused. Not a Windows box. |
| 2   | Press Escape, click outside, then Cancel | Each closes the dialog and keeps the person.                                                |
| 3   | Confirm                                  | The person is deleted.                                                                      |
| 4   | Maximise the window (≥1280px wide)       | People list and Relationships sit side by side; little empty space at the sides.            |
| 5   | Narrow the window                        | They stack again.                                                                           |
| 6   | French: open a card and the tree option  | "Fratrie / sororité" and "Afficher la fratrie / sororité".                                  |

### Tree: fit, focused person

Automated by: `e2e/vertical-tree.spec.ts`, `e2e/focused-person.spec.ts`.

| #   | Action                                               | Expected                                                                                                      |
| --- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1   | Open the Tree tab on a family of several generations | "Focused person" selector; Generations = All; whole tree drawn; no horizontal scroll if it fits at ≥45% size. |
| 2   | Change the focused person                            | The panel lists parents, grandparents, children, grandchildren, siblings, partners with counts.               |
| 3   | Narrow the window gradually                          | The chart shrinks with it; only below ~45% of its size does a scroll bar appear.                              |

### Update invitation

Automated by: `e2e/app-version-update.spec.ts`, `real-app/updates.test.mjs`.

| #   | Action                                                             | Expected                                                             |
| --- | ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| 1   | Launch with a newer release published (or click Check for updates) | Banner: "Download version X" button, the release link, Dismiss.      |
| 2   | Click the button, then the link                                    | Your browser opens the release page each time. Nothing is installed. |
| 3   | Block the browser opening (if possible)                            | The banner shows "Could not open your browser. Copy this link: ...". |

### Search

Automated by: `e2e/people-search.spec.ts`.

| #   | Action                                                   | Expected                                                                                    |
| --- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | People tab: type part of a name, a maiden name or a town | The list shows only matches; accents and case are ignored.                                  |
| 2   | Press Enter, or click a result                           | The person's card opens.                                                                    |
| 3   | Tree tab: type a name                                    | Matching boxes get an amber outline. Clicking a result centres the tree and opens the card. |
| 4   | Press Escape in the box                                  | The search clears; everyone is back.                                                        |

### Tree filters

Automated by: `e2e/tree-filters.spec.ts`.

| #   | Action                                                    | Expected                                                                                  |
| --- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | Tree tab: choose Life status = Living                     | Deceased and unknown-status boxes (and their links) fade; the count shows how many match. |
| 2   | Add Born in = a town, then Born in the month of = a month | Only people matching all of them stay normal.                                             |
| 3   | Click a faded person                                      | Their card opens as usual.                                                                |
| 4   | Click Reset filters                                       | Everyone is back to normal; the count and button disappear.                               |
| 5   | Use search and filters together                           | Matches get the amber outline, even when faded.                                           |

### Person notes

Automated by: `e2e/person-notes.spec.ts`.

| #   | Action                                             | Expected                                                  |
| --- | -------------------------------------------------- | --------------------------------------------------------- |
| 1   | Add or edit a person, type a multi-line note, save | The card shows a Notes section with the same line breaks. |
| 2   | Edit again and clear the note                      | The Notes section disappears.                             |
| 3   | Search a word that only appears in a note          | The person is found.                                      |
| 4   | Export, import into a fresh family                 | Notes are kept.                                           |

### Share as web page

Automated by: `e2e/share-web-page.spec.ts`, `real-app/real-app.test.mjs: export, import with backup, share`.

| #   | Action                                            | Expected                                                                                     |
| --- | ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | Click **Share as web page…**, then Cancel         | Nothing is written.                                                                          |
| 2   | Confirm the warning, choose a file name           | One `.html` file is written; green message names it.                                         |
| 3   | Double-click the file (any browser, even offline) | People list with search; click a person to read their card; relatives are links; Back works. |
| 4   | Open it on a phone-sized window                   | List and card alternate with a Back button.                                                  |
| 5   | Search a word that is only in a note              | The person is found.                                                                         |
