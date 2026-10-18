import { t } from "../i18n/index.ts";
import { PersonNotFoundError } from "./errors.ts";
import {
  createUuidId,
  type FamilyData,
  type Person,
  type PersonId,
  type PersonPhoto,
  type PhotoId,
} from "./types.ts";

export const MAX_PHOTOS_PER_PERSON = 12;
/** Longest side, in pixels, that a stored photo is shrunk to. */
export const MAX_PHOTO_SIDE = 480;
/** A stored photo (as a data URL) must stay under this many characters (about 1 MB). */
export const MAX_PHOTO_CHARS = 1_400_000;

const DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;

export class PhotoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhotoError";
  }
}

export class PhotoNotFoundError extends Error {
  constructor(id: PhotoId) {
    super(t("err.photoNotFound", { id }));
    this.name = "PhotoNotFoundError";
  }
}

export interface PhotoInput {
  dataUrl: string;
  caption?: string;
}

/** The main photo: the first one. */
export function mainPhotoOf(person: Person): PersonPhoto | undefined {
  return person.photos?.[0];
}

function requirePerson(data: FamilyData, id: PersonId): Person {
  const person = data.people.find((p) => p.id === id);
  if (!person) throw new PersonNotFoundError(id);
  return person;
}

function replace(data: FamilyData, person: Person, photos: PersonPhoto[]): FamilyData {
  const { photos: _old, ...rest } = person;
  void _old;
  const updated: Person = photos.length > 0 ? { ...rest, photos } : rest;
  return { ...data, people: data.people.map((p) => (p.id === person.id ? updated : p)) };
}

/** Adds the photos in order, or none at all if any is invalid or the limit would be passed. */
export function addPhotos(data: FamilyData, personId: PersonId, inputs: PhotoInput[]): FamilyData {
  const person = requirePerson(data, personId);
  const existing = person.photos ?? [];
  if (existing.length + inputs.length > MAX_PHOTOS_PER_PERSON) {
    throw new PhotoError(t("err.photoLimit", { max: MAX_PHOTOS_PER_PERSON }));
  }
  const added: PersonPhoto[] = inputs.map((input) => {
    if (!DATA_URL.test(input.dataUrl)) throw new PhotoError(t("err.photoInvalid"));
    if (input.dataUrl.length > MAX_PHOTO_CHARS) throw new PhotoError(t("err.photoTooLarge"));
    const caption = (input.caption ?? "").trim();
    return {
      id: createUuidId<"PhotoId">(),
      dataUrl: input.dataUrl,
      ...(caption ? { caption } : {}),
    };
  });
  return replace(data, person, [...existing, ...added]);
}

export function removePhoto(data: FamilyData, personId: PersonId, photoId: PhotoId): FamilyData {
  const person = requirePerson(data, personId);
  const photos = person.photos ?? [];
  if (!photos.some((p) => p.id === photoId)) throw new PhotoNotFoundError(photoId);
  return replace(
    data,
    person,
    photos.filter((p) => p.id !== photoId),
  );
}

/** Moves a photo to the front, making it the main one. */
export function makeMainPhoto(data: FamilyData, personId: PersonId, photoId: PhotoId): FamilyData {
  const person = requirePerson(data, personId);
  const photos = person.photos ?? [];
  const chosen = photos.find((p) => p.id === photoId);
  if (!chosen) throw new PhotoNotFoundError(photoId);
  return replace(data, person, [chosen, ...photos.filter((p) => p.id !== photoId)]);
}

export function setPhotoCaption(
  data: FamilyData,
  personId: PersonId,
  photoId: PhotoId,
  caption: string,
): FamilyData {
  const person = requirePerson(data, personId);
  const photos = person.photos ?? [];
  if (!photos.some((p) => p.id === photoId)) throw new PhotoNotFoundError(photoId);
  const text = caption.trim();
  return replace(
    data,
    person,
    photos.map((p) => {
      if (p.id !== photoId) return p;
      const { caption: _old, ...rest } = p;
      void _old;
      return text ? { ...rest, caption: text } : rest;
    }),
  );
}
