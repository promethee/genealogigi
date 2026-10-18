## Decisions
- One file, no network: data (JSON in a script element, `<` `>` `&` and line separators escaped), CSS and a small vanilla viewer are inline. No external fonts, scripts or images.
- The page does no logic: `buildShareModel` pre-computes names, dates, relatives, timeline text in the active language. Reason: reuses tested app code, no second copy of date or naming rules.
- The viewer builds the DOM with `textContent` only and accepts only `data:image/(jpeg|png|webp);base64` photo sources: a hostile name or note cannot run code.
- Read-only; a hash route (`#p=<id>`) makes relatives clickable and the browser Back button work. On narrow screens the list and the card alternate.
- Everyone is included (living people too): the confirmation says so. Hiding living people is a possible later option.
- Not a tree drawing in v1: navigation is through relatives, which keeps the page small and robust.
- Default file name: `<family file name>.html`; written with the existing raw-file writer. `saveFileDialog` gains an optional `extensions` list.
