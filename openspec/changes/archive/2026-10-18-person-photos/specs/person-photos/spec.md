## ADDED Requirements

### Requirement: Add photos to a person

The person card SHALL let the user add one or more photos from image files
(JPEG, PNG, WebP, GIF). Photos SHALL be reduced to at most 480 px on the longest
side and stored in the family file. A person SHALL have at most 12 photos.

#### Scenario: First photo

- **WHEN** a person has no photo and the user adds one
- **THEN** it becomes their main photo and appears in the card header and the list

#### Scenario: Several at once

- **WHEN** the user picks three files
- **THEN** all three are added in the order picked

#### Scenario: Large image

- **WHEN** the user picks a 4000 x 3000 photo
- **THEN** the stored photo is no larger than 480 px on its longest side

#### Scenario: Not an image

- **WHEN** a picked file is not a supported image
- **THEN** nothing is added for it and an error says so

#### Scenario: Limit

- **WHEN** a person already has 12 photos
- **THEN** adding another is refused with a message naming the limit

#### Scenario: Cancel

- **WHEN** the user cancels the file picker
- **THEN** nothing changes

### Requirement: Main photo and captions

The first photo SHALL be the main one, and the user SHALL be able to make any
photo the main one and give a photo an optional caption.

#### Scenario: Make main

- **WHEN** the user opens the second photo and clicks Make main
- **THEN** it becomes the main photo and is shown in the avatar, list and trees

#### Scenario: Caption

- **WHEN** the user types a caption and saves
- **THEN** the viewer shows it afterwards

### Requirement: Remove a photo

The user SHALL be able to remove a photo after confirming; if it was the main
photo, the next one becomes main.

#### Scenario: Remove main

- **WHEN** the main photo is removed and another remains
- **THEN** the next photo is the new main photo

#### Scenario: Cancel

- **WHEN** the user cancels the confirmation
- **THEN** the photo stays

### Requirement: Photos live in the family file

Photos SHALL be saved in the family file, survive a restart, be included in a
copy of the family, and be removed with the person.

#### Scenario: Persisted

- **WHEN** the user adds a photo and restarts the app
- **THEN** the photo is still there

#### Scenario: Old files

- **WHEN** a file without photos is opened
- **THEN** it loads and every person shows initials

#### Scenario: Person deleted

- **WHEN** a person with photos is deleted
- **THEN** their photos are gone from the file

### Requirement: Avatars everywhere

A person's main photo SHALL be their avatar in the card, the people list, the
tree boxes and the small family tree; people without a photo SHALL show
initials on a coloured disc.

#### Scenario: List

- **WHEN** a person has a main photo
- **THEN** the people list shows it in the round avatar instead of initials

#### Scenario: No photo

- **WHEN** a person has no photo
- **THEN** their initials are shown, as before
