# Design

## Decisions (made without a user round-trip, change freely)

- **Flags as inline SVG components**, not emoji: Windows (the main target)
  renders flag emoji as two letters. UK flag for English, French tricolour
  for French. The UK flag stands for the language, not a country claim; a
  third language can add its own.
- **Native names are constants**, not catalog entries: they must not change
  with the interface language.
- **Shared classes in `style.css`** (`.btn`, `.btn-primary`, `.btn-secondary`,
  `.btn-danger`, `.btn-sm`, `.input`, `.card`, `.chip`) via Tailwind `@apply`,
  so components stay readable and the look can be tuned in one place.
- **Palette:** slate neutrals, emerald accent (already the app colour),
  white cards, `slate-50` page. No dark mode yet.
- **Icons:** a small inline-SVG `AppIcon.vue` (pencil, trash, plus, copy, sync,
  folder, file-plus, user, link), stroke style, no icon dependency.
- **Avatars:** initials (max 2) on a pastel circle; colour from a hash of the
  person id so it is stable.
- **Layout:** content centred, `max-w-5xl`; header becomes a card with the
  path as a muted chip, counts as chips, actions as buttons.
- **Tabs:** pill-style segmented control.
- **Tree:** rounded boxes with a soft shadow, root in emerald, softer link
  colour; geometry (sizes and positions) unchanged.
- **Life status default:** `living`, with the 110-year rule. Reason: most
  people entered today are alive; people with an old birth year are almost
  surely not. "Unknown" remains selectable; stored data is untouched. The
  110 threshold uses the current year and is a constant, easy to change.
- **Auto status** applies only to the add form; once the user touches the
  select it never changes by itself.
- **Behaviour and test ids unchanged**; only the tests that depended on the
  old "Unknown" default are updated.
- **Unmarked default nature.** Only the list text changes: a
  biological-confirmed link has no parentheses. The add/edit forms still list
  the nature (preselected), and the tree legend still explains solid vs dashed.
  Temporary links keep their nature and dates (they are never the default).

