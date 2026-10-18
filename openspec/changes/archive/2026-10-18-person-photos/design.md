# Design

## Decisions (made without a user round-trip, change freely)

- **Embedded in the family file** as JPEG data URLs (`Person.photos?: PersonPhoto[]`),
  not as files beside it. The product promise is "one file you own": save-a-copy,
  git sync, backups and moving the file all keep working with no extra folder to
  stage or lose. Cost: a bigger JSON (about 30-80 KB per photo after resizing; the
  whole file is rewritten on every save). Fine for a family; the upgrade path
  (photos in a sibling folder, referenced by name) is possible later without changing
  the UI. The README says so.
- **Resize on import** to max 480 px (longest side), JPEG quality 0.85, drawn on a
  canvas so EXIF rotation is honoured; GIF uses its first frame. Original bytes are
  not kept.
- **Array order = importance:** the first photo is the main one; "Make main" moves it
  to the front. No separate flag to keep in sync.
- **Limits:** 12 photos per person; a stored photo must be a JPEG/PNG/WebP data URL
  under 1 MB; the picker only offers image types.
- **Captions** are optional free text, edited in the viewer.
- **Where to add:** the card's gallery (view mode), next to Remove and Make main, not
  the edit form (photos are not form fields). The form is unchanged.
- **Shell access** through `PlatformAPI.pickImages()` (file dialog + read bytes, returns
  data URLs); resizing is browser code in `lib/image.ts`.
- **Avatars:** one pure helper (`avatar.ts`) for initials and a stable colour per
  person, used by HTML and SVG avatars. Photo avatars are round, `object-cover`.
- **Tree boxes grow:** 200 x 56 with a 40 px round portrait at the left (photo or
  initials), name and lifespan to its right. Slot width follows (224). Names are cut
  at 16 characters. Geometry constants stay in one place so links, tests and the
  small tree keep working.
- **Small family tree** boxes get a 24 px avatar too.
- **No photo editing** (crop, rotate) in this change.
