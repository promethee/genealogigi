# Proposal

## Why

A family tree without faces is a diagram. Each person should be able to have
a picture (at least one), and it should show well in the trees.

## What Changes

- **Photos per person:** one or several (up to 12). The first is the **main**
  photo; any photo can be made main. Each can have a caption.
- **Add photos** from the person card: a file picker (JPEG, PNG, WebP, GIF;
  several at once). Photos are shrunk to at most 480 px and stored as JPEG
  **inside the family file**, so the family stays one portable file.
- **Where they show:** the card (avatar and a gallery with a viewer to read the
  caption, make main, remove), the people list (avatar), the **tree boxes**
  (a round portrait at the left of the box, initials when there is no photo),
  and the small family tree.
- Removing a photo asks for confirmation. Deleting a person removes their photos.
- Old files load unchanged (optional field, no schema bump).

## Capabilities

### New Capabilities

- `person-photos`: photos on people.

### Modified Capabilities

- `pedigree-tree`: portraits in the chart boxes.

## Impact

- Types (`Person.photos?`), new `photos.ts`, `avatar.ts`, `lib/image.ts` (resize),
  store actions, `PlatformAPI.pickImages`, Tauri file read permission, components
  (`PersonAvatar`, `PhotoGallery`, `PhotoViewer`), tree and mini-tree boxes, i18n.
