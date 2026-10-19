# Manual tests

Run with `npm run tauri:dev`. These cover what automated tests cannot: the real
native dialogs, real files, and the Tauri settings store.

> 🤖 **Automated:** the rows marked 🤖 below run by themselves against the real app with `npm run test:real` (see [DEVELOPMENT.md](./DEVELOPMENT.md#real-app-tests)). Native file dialogs are answered by a scripted seam, so how the OS dialogs look and behave is still yours to check once per release.

> **Editing a person:** click **View** on the person's row (or their name) to open the card, then **Edit** on the card. **Delete** is only on the card too.

## Welcome screen

🤖 Rows 1–9 are automated (real files, real settings, real restarts). By hand, once: the native dialog look, and the "replace existing file" prompt of the save dialog.

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

## Person record

🤖 Rows 1–9 are automated against the real app and disk (empty message, add, last-name-only, no-name error, file contents, restart, delete with cancel/confirm). Row 10 (save failure) is automated for CI only: it needs a non-root user to make a folder read-only; run it by hand if you skip CI.

Start from a created or opened family file.

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

## Relationships

🤖 Rows 2, 3, 8, 9, 10 are automated (link saved, cycle refused, restart, delete with cancel/confirm, cascade message and file). Rows 1, 4–7 are covered by the browser e2e tests.

Start from a family with at least two people (for example Ada and Byron).

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

## Pedigree tree

Use a family with at least: Me, Mum, Dad, Gran (Mum's parent) and GreatGran
(Gran's parent), with Dad linked as an adoptive parent of Me.

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

## Export, import and close

🤖 Rows 2, 4, 6–10 are automated (real export file, dated and hashed backup, settings after restart). By hand: rows 1, 3 and 5 (cancel flows and the confirmation wording on real dialogs).

Family files use the `.gigi` extension (JSON inside); old `.json` files still open. The file dialogs offer `.gigi`; Open also lists `.json`.

Start from an open family with at least one person.

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

## Person dates and life status

🤖 Rows 1, 3 (partly) and 8 are automated (list text and the file's `raw`/`...Known` fields for a full date and a deceased status). The error rows are covered by the browser e2e tests.

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

## Several names per person

🤖 Rows 2, 9 and 10 are automated (married name with kind and year in the file; editing only the birth date keeps the names).

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

## Step, foster and guardian parents

🤖 Rows 1 and 8 are automated for a step link with status and dates (the file has them).

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

## Edit relationships

🤖 Row 2 (restart) is covered by the relationships restart check; the edit form itself is covered by the browser e2e tests.

| #   | Action                                                               | Expected                                            |
| --- | -------------------------------------------------------------------- | --------------------------------------------------- |
| 1   | Add Ada -> Byron adoptive. Click **Edit**, nature Foster, start 2000 | Row "Ada is parent of Byron (foster, from 2000)".   |
| 2   | Quit and relaunch, Resume                                            | The edited row is unchanged.                        |
| 3   | Add partners Ada and Byron. Edit: Ended, start 1990, end 1995        | Row "(ended, 1990–1995)".                           |
| 4   | Click Edit again                                                     | Fields show 1990 and 1995.                          |
| 5   | Edit with end 1980 and start 1990                                    | Error "end date cannot be before"; form stays open. |
| 6   | Click Cancel                                                         | Form closes, row unchanged.                         |
| 7   | Add partners with start year 1985                                    | Row "(ongoing, from 1985)".                         |

## Descendant chart

| #   | Action                                                                                      | Expected                                        |
| --- | ------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 1   | Family: Gran -> Mum -> Me, Gran -> Uncle (adoptive). Tree tab, Show: Descendants, root Gran | Gran at left; Mum and Uncle next; Me after Mum. |
| 2   | Look at the Uncle link                                                                      | Dashed line.                                    |
| 3   | Generations 2 with a great-grandchild present                                               | The great-grandchild is not shown.              |
| 4   | Click Mum                                                                                   | Mum becomes root; still showing descendants.    |
| 5   | Show: Ancestors                                                                             | Mum and her ancestors.                          |

## Hourglass chart

| #   | Action                                                              | Expected                                                    |
| --- | ------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | Family Gran -> Mum -> Me -> Kid. Tree tab, Show: Hourglass, root Me | Gran, Mum left of Me; Kid right of Me; Me appears once.     |
| 2   | Look at the links                                                   | Lines join the facing sides of the boxes; none cross boxes. |
| 3   | Click Mum                                                           | Mum becomes root; still hourglass.                          |
| 4   | Generations 2 on Gran                                               | Kid (3 generations down) is not shown.                      |

## Tree first

| #   | Action                                                     | Expected                                                                                                                    |
| --- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1   | Resume or open a family that has at least one relationship | The Tree tab is shown first. (Earlier steps that resume a family and then look at the list need a click on the People tab.) |
| 2   | Create a new family                                        | The People tab is shown.                                                                                                    |
| 3   | Add the first relationship                                 | You stay on the People tab.                                                                                                 |

## Name changes (marriage) and simple name form

| #   | Action                                                                                       | Expected                                                                     |
| --- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1   | Click **Add person**                                                                         | One First name and one Last name field. No kind, date or Main name controls. |
| 2   | Enter Marie / Martin. Click **+ Last name changed (e.g. marriage)**. Enter Dubois, year 2001 | A second row: kind Married, "Since year". Save.                              |
| 3   | Look at the people list                                                                      | "Marie Dubois (née Martin)".                                                 |
| 4   | Tree tab with Marie                                                                          | Box: "Marie Dubois" and, below, "née Martin · …".                            |
| 5   | Edit Marie, mark the Martin row as **Main name**, save                                       | "Marie Martin" with no "née".                                                |
| 6   | Add a person, click **+ First name changed**, enter Mia                                      | Saved as "Marie Martin": the new first name is not main until you choose it. |
| 7   | Click into a year box in the form                                                            | No stray autofill suggestion (e.g. "1981") appears.                          |

## Language (English / French)

🤖 Rows 8, 9 and 10 are automated (language kept across restarts; first launch on a French system starts in French and a saved choice wins; no French text in the file).

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

## Vertical tree

| #   | Action                                                          | Expected                                                                                        |
| --- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 1   | Tree tab, Show: Ancestors, a root with parents and grandparents | Root at the bottom; parents on the row above, side by side; oldest at the top.                  |
| 2   | Look at the links                                               | Vertical elbows from the top of a child to the bottom of each parent; dashed for non-confirmed. |
| 3   | Show: Descendants                                               | Root at the top; children below, grandchildren below them.                                      |
| 4   | Show: Hourglass                                                 | Ancestors above the root, descendants below, root in the middle.                                |
| 5   | Generations 6 with a large family, or shrink the window         | The chart area scrolls horizontally and vertically; the page itself does not.                   |
| 6   | Narrow chart (few ancestors)                                    | Centred in the chart area.                                                                      |

## Look and feel, flags, defaults

| #   | Action                                                       | Expected                                                                                                                                                                                   |
| --- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Launch the app                                               | Top bar with the logo and "Genealogigi"; welcome card with tagline and three buttons with icons.                                                                                           |
| 2   | Look at the language switch (top right)                      | A UK flag + "English" and a French flag + "Français"; the flags are real images, not letters.                                                                                              |
| 3   | Switch to French                                             | Names stay "English" and "Français"; the rest turns French.                                                                                                                                |
| 4   | Open a family, look at the people list                       | Avatar circles with initials; each row has a **View** button (eye icon); on the person card **Edit** and **Delete** are bordered buttons with icons, Delete is red; hover highlights them. |
| 5   | Tab through the page with the keyboard                       | Every button shows a visible focus ring.                                                                                                                                                   |
| 6   | Click **Add person**                                         | Life status is **Living**.                                                                                                                                                                 |
| 7   | Type birth year 1815                                         | Status becomes **Deceased** by itself and death fields appear. Pick another status by hand, then change the year: it no longer changes.                                                    |
| 8   | Edit a person saved with status Unknown                      | The form shows Unknown.                                                                                                                                                                    |
| 9   | Add a confirmed biological parent link, then an adoptive one | "Ada is parent of Byron" (no parentheses) and "Ada is parent of Cleo (adoptive)".                                                                                                          |
| 10  | Tree tab                                                     | Soft dotted background, rounded boxes with a shadow, root in green.                                                                                                                        |

## Last-name suggestions

| #   | Action                                                  | Expected                       |
| --- | ------------------------------------------------------- | ------------------------------ |
| 1   | Add Ada Martin, Byron Dubois and Cleo Dubois            | Saved.                         |
| 2   | Add person, click into Last name and type "D"           | A popup suggests "Dubois".     |
| 3   | Clear the field and click into it again                 | "Dubois" first, then "Martin". |
| 4   | Click **+ Last name changed**, click into the new field | The same suggestions appear.   |
| 5   | Type a name that is not suggested and save              | Saved exactly as typed.        |
| 6   | Click into First name                                   | No suggestions.                |

## Two parents at once and birth date hints

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

## Person card, places, delete on the card

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

## Version and update check

🤖 Rows 1–9 are automated against a local fake of GitHub's latest-release endpoint (no release, up to date, network cut, newer release, Download, Dismiss across a restart, re-check, a still newer release). The system browser is replaced by a recorder, so that the page really opens in **your** browser is the one thing left to see once.

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

## Parents while creating a person

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

## Siblings in the tree, Close button

| #   | Action                                                                                                  | Expected                                                                                      |
| --- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 1   | Family: Mum + Dad with Me (1980), Older (1975), Younger (1985); Mum + Step with Half. Tree tab, root Me | Only Me, Mum, Dad.                                                                            |
| 2   | Tick **Show siblings**                                                                                  | Older, Younger and Half appear on Me's row, linked to their shared parents; only Me is green. |
| 3   | Look at their order                                                                                     | Older to the left of Me; Younger and Half to the right.                                       |
| 4   | Half's links                                                                                            | A single line, to Mum.                                                                        |
| 5   | Click a sibling                                                                                         | Their card opens below the chart; double-click makes them the root.                           |
| 6   | Show: Descendants                                                                                       | The checkbox disappears. Hourglass: it is back.                                               |
| 7   | Open any person card                                                                                    | An explicit **Close** button (text, no "X" icon) closes it.                                   |

## Timeline and events

🤖 Rows 3 and 11 are automated (an event is saved to the file with its people, and is still on the card after a restart).

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

## Small family tree on the card

| #   | Action                                                           | Expected                                                                                                          |
| --- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1   | Open the card of someone with two parents, a partner and a child | **Immediate family**: parents above (side by side), the person in green with the partner beside, the child below. |
| 2   | Make the child link adoptive                                     | A dashed line to the child and the word "adoptive" in the box.                                                    |
| 3   | Click the child's box                                            | The child's card opens; the small tree is redrawn around them.                                                    |
| 4   | Open the card of someone with no parent, partner or child        | No small tree.                                                                                                    |
| 5   | Open the card of someone with only children                      | No row above; children below.                                                                                     |
| 6   | Many children                                                    | The little tree scrolls sideways inside its frame.                                                                |
| 7   | Open a card from the Tree tab                                    | The small tree is there too.                                                                                      |

## Light / dark theme

🤖 Rows 1, 2 and 5 are automated on Linux with a real dark GTK setting (first launch follows the system and saves nothing; the toggle saves a choice; the choice wins after a restart). By hand: rows 3, 4, 6, 7 (every surface in dark, native selects, following a live OS change, colours of panels) and the Windows dark-mode setting itself.

| #   | Action                                                                                                      | Expected                                                                   |
| --- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1   | Delete the app's saved settings, set Windows to dark mode, launch                                           | The app starts dark. With Windows in light mode it starts light.           |
| 2   | Click the sun/moon button in the top bar (next to the language switch)                                      | The whole app switches at once, with no half-white panels or fading flash. |
| 3   | Go through: welcome, people list, forms, relationships, card, timeline, event form, tree, small family tree | Every surface is dark in dark mode; text is readable everywhere.           |
| 4   | In dark mode open a native select (e.g. Month) and scroll a long page                                       | The dropdown and the scrollbar are dark too.                               |
| 5   | Quit and relaunch                                                                                           | The last choice is kept, with no flash of the other theme at startup.      |
| 6   | Change Windows' light/dark setting while the app is open (before ever clicking the button)                  | The app follows. After a click on the button it no longer follows.         |
| 7   | Show an update banner / error message in dark mode                                                          | Coloured panels are dark tinted with light text.                           |

## Photos

🤖 Rows 2–7, 12 and 13 are automated: real image decoding and resizing in the real webview (a 3000×2000 image becomes a 480×320 JPEG), file growth, viewer paging, captions, Make main, Remove with cancel/confirm, Export keeps the photos, bad files skipped, the 12-photo limit, and a restart. The picker is answered by a scripted seam, so the **real Windows picker (row 1)**, real camera/HEIC files and the visual rows 8–11 stay yours.

| #   | Action                                                           | Expected                                                                                                                                                        |
| --- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Open a person's card, click **Add photos**                       | The Windows file picker opens, filtered to images; several files can be selected.                                                                               |
| 2   | Pick two photos straight from a phone/camera (large, 4000 px)    | Both appear as thumbnails; the first has a star (main) and is the avatar in the card header and the people list.                                                |
| 3   | Check the family file size before and after                      | It grew by roughly 30–100 KB per photo, not by the original sizes.                                                                                              |
| 4   | Open a photo (click a thumbnail)                                 | A viewer with the photo, "1 / 2", arrows (also ← → keys), caption field, **Make main**, **Remove**, **Close** (Esc also closes).                                |
| 5   | Type a caption, **Save caption**; close and reopen the photo     | The caption is still there.                                                                                                                                     |
| 6   | **Make main** on the second photo                                | It moves first and becomes the avatar everywhere.                                                                                                               |
| 7   | **Remove** and cancel, then Remove and confirm                   | Cancel keeps it; confirm removes it; removing the main promotes the next.                                                                                       |
| 8   | Tree tab                                                         | Each box has a round portrait at the left (photo or initials on a coloured disc), name and lifespan beside it; long names end with "…" and stay inside the box. |
| 9   | Click, then double-click a box with a portrait                   | Click opens the card below; double-click re-centres.                                                                                                            |
| 10  | Open a card: the small family tree                               | Small portraits in each little box.                                                                                                                             |
| 11  | Switch to the dark theme                                         | Portraits and initials discs are still clear.                                                                                                                   |
| 12  | **Export…**, open the export                                     | The photos are in the copy.                                                                                                                                     |
| 13  | Try to add a 13th photo, a .txt renamed to .png, a corrupt image | Add is disabled at 12; bad files give "not a supported image" and are skipped; good ones in the same selection are still added.                                 |
| 14  | Sync with git (if configured)                                    | The family file (with photos) is committed and pushed.                                                                                                          |

## Living status wording

| #   | Action                                   | Expected                                                                                                                 |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | Add a living person with birth year 1990 | The list row says "born 1990" and does not say "living".                                                                 |
| 2   | Add a living person with no dates        | The row has just the name (no second line).                                                                              |
| 3   | A deceased person                        | "born … · died …" (or "deceased").                                                                                       |
| 4   | Open a living person's card              | The Life section says "living".                                                                                          |
| 5   | Switch to French                         | The card says "vivant(e)" and the form's status choice says "Vivant(e)"; the list still shows nothing for living people. |

## Confirmation dialog and wide layout

| #   | Action                                   | Expected                                                                                    |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | Delete a person from its card            | An in-app dialog (app colours, theme, language) asks; Cancel is focused. Not a Windows box. |
| 2   | Press Escape, click outside, then Cancel | Each closes the dialog and keeps the person.                                                |
| 3   | Confirm                                  | The person is deleted.                                                                      |
| 4   | Maximise the window (≥1280px wide)       | People list and Relationships sit side by side; little empty space at the sides.            |
| 5   | Narrow the window                        | They stack again.                                                                           |
| 6   | French: open a card and the tree option  | "Fratrie / sororité" and "Afficher la fratrie / sororité".                                  |

## Tree: fit, focused person

| #   | Action                                               | Expected                                                                                                      |
| --- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1   | Open the Tree tab on a family of several generations | "Focused person" selector; Generations = All; whole tree drawn; no horizontal scroll if it fits at ≥45% size. |
| 2   | Change the focused person                            | The panel lists parents, grandparents, children, grandchildren, siblings, partners with counts.               |
| 3   | Narrow the window gradually                          | The chart shrinks with it; only below ~45% of its size does a scroll bar appear.                              |

## Update invitation

🤖 Rows 1 and 2 are automated (the banner shows the version and link; the button and the link both ask the browser to open the release). Row 3 (browser cannot be opened) stays manual; it is covered by the unit and browser e2e tests.

| #   | Action                                                             | Expected                                                             |
| --- | ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| 1   | Launch with a newer release published (or click Check for updates) | Banner: "Download version X" button, the release link, Dismiss.      |
| 2   | Click the button, then the link                                    | Your browser opens the release page each time. Nothing is installed. |
| 3   | Block the browser opening (if possible)                            | The banner shows "Could not open your browser. Copy this link: ...". |

## Search

| #   | Action                                                   | Expected                                                                                    |
| --- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | People tab: type part of a name, a maiden name or a town | The list shows only matches; accents and case are ignored.                                  |
| 2   | Press Enter, or click a result                           | The person's card opens.                                                                    |
| 3   | Tree tab: type a name                                    | Matching boxes get an amber outline. Clicking a result centres the tree and opens the card. |
| 4   | Press Escape in the box                                  | The search clears; everyone is back.                                                        |

## Tree filters

| #   | Action                                                    | Expected                                                                                  |
| --- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | Tree tab: choose Life status = Living                     | Deceased and unknown-status boxes (and their links) fade; the count shows how many match. |
| 2   | Add Born in = a town, then Born in the month of = a month | Only people matching all of them stay normal.                                             |
| 3   | Click a faded person                                      | Their card opens as usual.                                                                |
| 4   | Click Reset filters                                       | Everyone is back to normal; the count and button disappear.                               |
| 5   | Use search and filters together                           | Matches get the amber outline, even when faded.                                           |

## Person notes

| #   | Action                                             | Expected                                                  |
| --- | -------------------------------------------------- | --------------------------------------------------------- |
| 1   | Add or edit a person, type a multi-line note, save | The card shows a Notes section with the same line breaks. |
| 2   | Edit again and clear the note                      | The Notes section disappears.                             |
| 3   | Search a word that only appears in a note          | The person is found.                                      |
| 4   | Export, import into a fresh family                 | Notes are kept.                                           |

## Share as web page

🤖 Row 2 is automated (the file is written, self-contained, with everyone). By hand: rows 3–5 (opening it in a browser; the e2e suite also opens it).

| #   | Action                                            | Expected                                                                                     |
| --- | ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | Click **Share as web page…**, then Cancel         | Nothing is written.                                                                          |
| 2   | Confirm the warning, choose a file name           | One `.html` file is written; green message names it.                                         |
| 3   | Double-click the file (any browser, even offline) | People list with search; click a person to read their card; relatives are links; Back works. |
| 4   | Open it on a phone-sized window                   | List and card alternate with a Back button.                                                  |
| 5   | Search a word that is only in a note              | The person is found.                                                                         |

## Window icon

Not automatable: on Linux the window icon is not exposed even under a window manager, and Windows is the real target. Check by hand after a rebuild.

| #   | Action                                                        | Expected                                                  |
| --- | ------------------------------------------------------------- | --------------------------------------------------------- |
| 1   | Start the app (rebuilt) and look at the title bar and taskbar | The icon is the tree mark: one trunk branching into four. |
