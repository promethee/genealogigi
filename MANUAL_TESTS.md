# Manual tests

What a machine cannot judge. Everything else runs by itself:

- **Browser end-to-end tests** (`npm run e2e`, 279 tests): every screen and rule, against a fake shell.
- **Real-app tests** (`npm run test:real`, 53 checks): the real Tauri window, real files, real settings,
  real restarts, real image decoding, the update check against a fake release endpoint, OS dark mode
  and language. Native file dialogs are answered by a scripted seam there.

Everything that used to be a manual step and is now automated is catalogued in
[E2E_TESTS.md](./E2E_TESTS.md): the test lists, and the former steps feature by feature with the test
files that check them. Only what a human must judge is left below.

Run these on **Windows** (the main target) with `npm run tauri:dev`, or with the installer once it
exists. Takes about 10 minutes. Note the date and result at the bottom.

## 1. Native dialogs (the real OS windows)

| #   | Action                                                                                                | Expected                                                                                                                                                                                         |
| --- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Create new family…**                                                                                | First the in-app prompt "What is this family called?" (OK disabled while empty). Then the Windows Save dialog, default name `<family name>.gigi`, filter `.gigi`. Cancel in either does nothing. |
| 2   | Create a family, then **Create new family…** again and pick that existing file                        | Windows asks to replace it; both answers behave sensibly (No keeps the file untouched).                                                                                                          |
| 3   | **Open family file…**                                                                                 | Windows Open dialog lists `.gigi` and `.json` files.                                                                                                                                             |
| 4   | **Export…** and **Share as web page…** (the latter needs a family with two people and a relationship) | Save dialogs suggest `<family name>-export.gigi` and `<family name>.html`, in English and in French.                                                                                             |
| 5   | **Import…**                                                                                           | Open dialog; after choosing a file the in-app confirmation (not a Windows box) appears.                                                                                                          |
| 6   | Person card → **Add photos**                                                                          | Windows picker filtered to images, several files selectable; a large phone/camera photo works.                                                                                                   |

## 2. The window and the installer

| #   | Action                                                   | Expected                                                                                                                         |
| --- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 7   | Rebuild (`cargo clean -p genealogigi` if needed), launch | Title bar and taskbar say "Genealogigi 1.0.0" with the **tree icon** (one trunk, four branches). The window opens **maximized**. |
| 8   | Alt-Tab, pin to the taskbar                              | The same tree icon everywhere.                                                                                                   |
| 9   | Installer (once published): install, launch, uninstall   | Installs without warnings you cannot explain, starts, removes cleanly. Icon in Explorer.                                         |

## 3. Windows settings and the real browser

| #   | Action                                                                        | Expected                                                                                                    |
| --- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 10  | Delete `%APPDATA%\app.genealogigi\settings.json`, set Windows to dark, launch | The app starts dark. Changing Windows' setting while it runs (before ever clicking the toggle) is followed. |
| 11  | Same with Windows set to French                                               | First launch is in French.                                                                                  |
| 12  | With a newer release published, click **Download** in the update banner       | The release page opens in your default browser.                                                             |
| 13  | Make the family file read-only (file properties), then add a person           | An error is shown, the person is not listed. Restore the file after.                                        |

## 4. How it looks (light and dark: check both)

| #   | Action                                                                               | Expected                                                                                                                                                                          |
| --- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 14  | Welcome screen, people list, forms, relationships                                    | Consistent, readable, nothing cut off; flags render; **Tab** shows a visible focus ring everywhere.                                                                               |
| 15  | Person card with photos, timeline and the small family tree                          | Round portraits look good, the small tree fits its column, timeline reads in order.                                                                                               |
| 16  | Tree tab: opens on **Everyone**; then hourglass, siblings, filters, search highlight | Everyone shows each person once, couples side by side joined by a **calm violet** segment (never red); faded people are "soft but readable"; the amber search outline stands out. |
| 17  | Resize the window from narrow to maximised                                           | Tree shrinks with the window; people list and relationships go side by side only when wide.                                                                                       |
| 18  | Delete something, then **Share as web page…**                                        | Delete: **Cancel red**, **Confirm neutral**. Share: **Confirm green**, **Cancel neutral**. Readable in both themes.                                                               |
| 19  | Dark mode: open a native dropdown (e.g. Month) and scroll a long page                | Dropdown and scrollbars are dark and readable.                                                                                                                                    |

## 5. Wording and the outside world

| #   | Action                                                                                  | Expected                                                                                                                                                                                                                    |
| --- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 20  | Use the whole app in French                                                             | Reads naturally: "Lien / filiation", "Parent de" with "Autre parent (facultatif)", "Conjoint(e) de", "Frère / sœur" (one) and "Fratrie / sororité" (several), "Afficher les frères et sœurs", "Personne centrale".          |
| 21  | Open an exported web page (**Share as web page…**) in a real browser, desktop and phone | Looks good, search and relative links work, photos show, the page **opens on the Tree** (everyone, portraits in the boxes, violet partner segment, fits a phone), the People switch shows the list, print preview is clean. |
| 22  | Open the project page (<https://promethee.github.io/genealogigi/>) once Pages is on     | Loads, screenshots show, Download goes to the Releases page; fine on a phone. Opens in **French** with a French browser and **English** otherwise; the English / Français links at the top switch it.                       |

## Last run

| Date       | Who   | Result                                                     | Notes                                                                                                                                    |
| ---------- | ----- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-19 | owner | Section 1 (native dialogs): OK                             | Done before the family-name change: re-check rows 1 and 4 (name prompt, default names). Other sections still to run.                     |
| 2026-10-19 | owner | Family creation (row 1): OK                                | Name prompt then save dialog checked after the family-name change. Row 4 (default names) still to re-check.                              |
| 2026-10-19 | owner | Section 3 (Windows settings, real browser, rows 10–13): OK |                                                                                                                                          |
| 2026-10-19 | owner | Section 4 (how it looks, rows 14–19, light and dark): OK   | Passed twice; rows 16 and 18 re-checked after the "Everyone" default, the violet partner segment and the share confirm tone (see below). |
| 2026-10-19 | owner | Row 20 (whole app in French): OK                           |                                                                                                                                          |
| 2026-10-19 | owner | Row 7 (maximized start): OK                                | App opens full screen.                                                                                                                   |
| 2026-10-19 | owner | Rows 16, 18 and 21: OK                                     | After the Everyone default, violet partner segment, green share confirm, shared page Tree view (portraits, centred).                     |
| 2026-10-20 | owner | Row 8 (Alt-Tab and taskbar icon): OK                       | Tree icon everywhere.                                                                                                                    |
| 2026-10-20 | owner | Section 1 row 4 (suggested names for Export and Share): OK | `<family name>-export.gigi` and `<family name>.html`.                                                                                    |
| 2026-10-20 | owner | Row 21 (shared page): OK                                   | Opens on the Tree; People view shows a person by default.                                                                                |
| 2026-10-20 | owner | Row 22 (project page): OK                                  | French and English, language links at the top.                                                                                           |
| 2026-10-20 | owner | Row 9 (installer of the v1.0.0 draft release): OK          | Installs, starts, tree icon, uninstalls. All 22 rows now passed.                                                                         |
|            |       |                                                            |                                                                                                                                          |
