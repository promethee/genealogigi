# Manual tests

Run with `npm run tauri:dev`. These cover what automated tests cannot: the real
native dialogs, real files, and the Tauri settings store.

## Welcome screen

| #   | Action                                                                  | Expected                                                                                            |
| --- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1   | First launch (delete `%APPDATA%\app.genealogigi\settings.json` first)   | Welcome screen. "Resume last family" is greyed out. No error.                                       |
| 2   | Click **Create new family…**, choose a folder, keep `family.json`, Save | App shows the path and "0 people · 0 relationships". File exists and contains `"schemaVersion": 1`. |
| 3   | Close the app, relaunch                                                 | Welcome screen. Resume button reads "Resume family.json" and is enabled.                            |
| 4   | Click **Resume**                                                        | Same loaded view as step 2.                                                                         |
| 5   | Relaunch, click **Open family file…**, then Cancel                      | Still on welcome. No error.                                                                         |
| 6   | Click **Open family file…**, pick a file containing `{not json`         | Red message "The file is not valid JSON." Still on welcome. The file is unchanged.                  |
| 7   | Click **Open family file…**, pick the file from step 2                  | Loaded view appears.                                                                                |
| 8   | Close the app, rename or delete the file from step 2, relaunch          | Message "Last family file not found: ...". Resume greyed out. No new file created.                  |
| 9   | Click **Create new family…**, then Cancel                               | Still on welcome. No file written.                                                                  |

## Person record

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

## Save a copy

Start from an open family with at least one person.

| #   | Action                                                                 | Expected                                                                        |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1   | Click **Save a copy…**, then Cancel                                    | Nothing happens. No message.                                                    |
| 2   | Click **Save a copy…**, choose a new file name, Save                   | Green message "Copy saved to ...". The new file exists and has the same people. |
| 3   | Check the header path                                                  | It still shows the original file.                                               |
| 4   | Add a person, then open the copy in a text editor                      | The copy does not have the new person (it is a snapshot).                       |
| 5   | Click **Save a copy…**, choose the file that is open, confirm replace  | Error "Choose a different file...". The open file is not modified.              |
| 6   | Click **Save a copy…**, choose an existing other file, confirm replace | The file is replaced. Green message shown.                                      |
| 7   | With the green message showing, add a person                           | The green message disappears.                                                   |
| 8   | Quit and relaunch, click Resume                                        | The original file opens, not the copy.                                          |

## Person dates and life status

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

## Git sync

Setup: a folder that is a git repository with a remote (e.g. a private GitHub repo you can push to). Create or open the family file inside it.

| #   | Action                                                             | Expected                                                                                                                              |
| --- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Add a person, click **Sync with Git**                              | Button shows "Syncing…", then "Synced with git: committed your changes and pushed." The commit "Update family data" is on the remote. |
| 2   | Click **Sync with Git** again without changes                      | "no local changes to commit"; no new commit.                                                                                          |
| 3   | On another clone, edit and push the file; sync here                | The new people appear without reopening.                                                                                              |
| 4   | Edit the same person here and elsewhere, push elsewhere, sync here | Error "resolve it with git". `git status` shows no rebase in progress; your commit is intact.                                         |
| 5   | Open a family file in a folder without a repository                | Hint "not in a git repository"; no button.                                                                                            |
| 6   | Open a file in a repository without a remote                       | Hint "no remote"; no button.                                                                                                          |
| 7   | Rename git temporarily so it is not on PATH, reopen the app        | Hint "git was not found".                                                                                                             |
| 8   | No console window flashes during sync (Windows)                    | Confirmed.                                                                                                                            |

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

| #   | Action                                                       | Expected                                                                                                                                |
| --- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Launch the app                                               | Top bar with the logo and "Genealogigi"; welcome card with tagline and three buttons with icons.                                        |
| 2   | Look at the language switch (top right)                      | A UK flag + "English" and a French flag + "Français"; the flags are real images, not letters.                                           |
| 3   | Switch to French                                             | Names stay "English" and "Français"; the rest turns French.                                                                             |
| 4   | Open a family, look at the people list                       | Avatar circles with initials; **Edit** and **Delete** are bordered buttons with icons; Delete is red; hover highlights them.            |
| 5   | Tab through the page with the keyboard                       | Every button shows a visible focus ring.                                                                                                |
| 6   | Click **Add person**                                         | Life status is **Living**.                                                                                                              |
| 7   | Type birth year 1815                                         | Status becomes **Deceased** by itself and death fields appear. Pick another status by hand, then change the year: it no longer changes. |
| 8   | Edit a person saved with status Unknown                      | The form shows Unknown.                                                                                                                 |
| 9   | Add a confirmed biological parent link, then an adoptive one | "Ada is parent of Byron" (no parentheses) and "Ada is parent of Cleo (adoptive)".                                                       |
| 10  | Tree tab                                                     | Soft dotted background, rounded boxes with a shadow, root in green.                                                                     |

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
