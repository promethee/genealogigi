## Decisions
- `Person.notes?: string`, plain text, kept as typed (line breaks preserved), trimmed at both ends; empty means removed. Max 20000 characters (about 10 pages), enforced in the form (`maxlength`) and by import.
- The card shows Notes only when present, with `white-space: pre-wrap`. Editing is through the existing Edit form, so no new edit mode.
- Search includes notes: people search for "war" or a shop name; matching words anywhere is the expected behaviour.
- Editing a person without sending notes keeps them (same rule as photos).
