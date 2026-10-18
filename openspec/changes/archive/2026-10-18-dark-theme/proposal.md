# Proposal

## Why

Long sessions with family data are easier on the eyes in a dark theme, and
the app should follow the system's light/dark preference like other desktop
apps.

## What Changes

- A **light / dark** theme for the whole app, including the trees, cards,
  forms, banners and the language switch.
- A **theme button** (sun/moon) in the top bar next to the language switch,
  always visible; one click switches.
- **First launch follows the system** (`prefers-color-scheme`); once the user
  clicks, their choice is remembered between launches and wins over the system.
- Text and controls keep readable contrast in both themes (checked by a test).
- The theme is applied before the first paint when possible, to avoid a flash.

## Capabilities

### Modified Capabilities

- `app-look`: light and dark themes.

## Impact

- `style.css` (semantic colours, dark palette), tree and mini-tree SVG colours
  as CSS variables, `ThemeSwitch.vue`, theme store, `PlatformAPI.settings`
  (theme), a few `dark:` variants, i18n. No data change.
