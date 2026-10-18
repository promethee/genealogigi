# Proposal

## Why

First hands-on feedback: the interface is clean but plain. The language
switch has no flags and names the languages in English-neutral codes; Edit and
Delete look like text, not buttons; and a new person's life status starts at
"Unknown", which is rarely right.

## What Changes

- **Language switch:** a flag next to each language, and each language named
  in itself ("English", "Français"). Flags are drawn as inline SVG (Windows
  cannot render flag emoji).
- **Look:** a consistent visual system: soft background, cards, a top bar with
  the app name and the switch, pill tabs, avatar initials in the people list,
  consistent inputs and buttons with icons, nicer tree boxes with soft shadow.
- **Buttons:** Edit and Delete are real buttons (border, hover, icon).
- **Life status default:** a new person starts as **Living**, and switches to
  **Deceased** by itself when the typed birth year is more than 110 years ago
  (until the user picks a status). "Unknown" stays available.
- **Relationships list:** "biological, confirmed" is the unmarked default:
  "Ada is parent of Byron"; other natures stay in parentheses.
- No change to data, behaviour, test ids or translations of existing text.

## Capabilities

### Modified Capabilities

- `language`: flags and native names.
- `person-record`: life status default.
- `relationship-record`: the confirmed-biological default is not displayed.

### New Capabilities

- `app-look`: visual consistency rules (buttons look like buttons).

## Impact

- New `AppIcon.vue`, `FlagIcon.vue`; shared CSS classes in `style.css`; most
  components get new classes only.
- `people.ts` (default status, suggestion), `PersonForm.vue`.
- Existing e2e about life status and "b. 1815" summaries updated.
- Website screenshots regenerated.
