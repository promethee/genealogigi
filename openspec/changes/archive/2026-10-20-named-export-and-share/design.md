## Decisions

- **Supersedes** the earlier rule "default file names are fixed English constants": the family name now leads, and the only fixed English parts are the `-export` suffix and the `family` fallback. Still never translated.
- **Same sanitising** as the new-family file name (`fileStemForFamily`): illegal characters replaced, NFC, capped, reserved Windows names avoided.
- **Title, not raw name**: a family without a stored name uses its file name without extension, like the window title.
