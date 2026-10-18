# Design

## Decisions (made without a user round-trip, change freely)

- **Class strategy** (`.dark` on `<html>`) with Tailwind's custom variant, so the
  theme is switchable at runtime and independent of the system after the user chooses.
- **Remap the slate scale through CSS variables** in `.dark`, so nearly every
  existing `text-slate-*`, `border-slate-*`, `bg-slate-*` class flips without edits.
- **Three semantic colours** where a plain remap would collide: `surface` (cards,
  inputs; replaces `bg-white` so `text-white` on buttons stays white), `page` (the
  background) and `link` (emerald that stays readable on dark).
- **Coloured families (emerald, red, sky, amber, avatar pastels)** get explicit
  `dark:` variants on the few elements that use them; they are not remapped, because
  the same shade is also used as a button fill.
- **Tree SVGs use CSS variables** (`--tree-*`) for fills, strokes and text, so they flip
  with the class; geometry is untouched.
- **Button: a single toggle** (sun/moon), not a three-way menu. "Follow the system" is
  the first-launch behaviour; a click makes the choice explicit. Simplest control for
  two themes; a "system" option can come later.
- **Persistence:** `PlatformAPI.settings.getTheme/setTheme`, plus a copy in `localStorage`
  read synchronously at startup to avoid a flash of the wrong theme. The platform
  setting stays authoritative.
- **`color-scheme`** is set on the root so native controls (scrollbars, date pickers,
  select popups) match.
- **Contrast is tested**, not eyeballed: a Playwright test measures the pairs above in
  both themes.
