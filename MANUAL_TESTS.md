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
| 2   | With two people, choose "Parent of", Ada, Byron, "biological, confirmed", Add     | The list shows "Ada is parent of Byron (biological, confirmed)".                                                          |
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
