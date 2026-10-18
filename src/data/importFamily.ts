import { MAX_PHOTO_CHARS, MAX_PHOTOS_PER_PERSON } from "./photos.ts";
import { EVENT_KINDS } from "./events.ts";
import {
  UUID_RE,
  type EventKind,
  type FamilyData,
  type FamilyEvent,
  type Person,
} from "./types.ts";

/** Why a file cannot be imported at all. */
export type ImportErrorCode = "not-json" | "not-family" | "newer-version";

export class ImportError extends Error {
  constructor(
    readonly code: ImportErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ImportError";
  }
}

/** Harmless problems that were fixed by dropping something; each is counted. */
export type ImportWarningCode =
  "no-version" | "people" | "duplicate-people" | "relationships" | "events" | "photos";

export interface ImportWarning {
  code: ImportWarningCode;
  count: number;
}

export interface FamilySummary {
  people: number;
  relationships: number;
  events: number;
  photos: number;
}

export interface ImportResult {
  data: FamilyData;
  warnings: ImportWarning[];
  summary: FamilySummary;
}

export function summarize(data: FamilyData): FamilySummary {
  return {
    people: data.people.length,
    relationships: data.relationships.length,
    events: data.events?.length ?? 0,
    photos: data.people.reduce((sum, p) => sum + (p.photos?.length ?? 0), 0),
  };
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isId = (value: unknown): value is string => typeof value === "string" && UUID_RE.test(value);

const PHOTO_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;

/**
 * Reads the text of a family file, checks its shape and returns clean data plus warnings.
 * Throws `ImportError` when the file cannot be a family at all (not JSON, wrong shape, a newer
 * version). Anything harmless that is broken (a person without a valid id, links to missing
 * people, bad photos) is dropped and counted instead, so one bad item never blocks a rescue.
 * Names and dates are trusted as written: they are the app's own formats.
 */
export function parseFamilyFile(
  text: string,
  messages: Record<ImportErrorCode, string>,
): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new ImportError("not-json", messages["not-json"]);
  }
  if (!isObject(raw) || !Array.isArray(raw.people) || !Array.isArray(raw.relationships)) {
    throw new ImportError("not-family", messages["not-family"]);
  }
  const warnings: ImportWarning[] = [];
  const warn = (code: ImportWarningCode, count: number) => {
    if (count > 0) warnings.push({ code, count });
  };

  if (raw.schemaVersion === undefined) warn("no-version", 1);
  else if (typeof raw.schemaVersion !== "number" || raw.schemaVersion > 1) {
    throw new ImportError("newer-version", messages["newer-version"]);
  } else if (raw.schemaVersion !== 1) {
    throw new ImportError("not-family", messages["not-family"]);
  }

  // People: objects with a unique valid id.
  const seen = new Set<string>();
  const people: Person[] = [];
  let badPeople = 0;
  let duplicates = 0;
  for (const entry of raw.people) {
    if (!isObject(entry) || !isId(entry.id)) {
      badPeople += 1;
      continue;
    }
    if (seen.has(entry.id)) {
      duplicates += 1;
      continue;
    }
    seen.add(entry.id);
    people.push(sanitizePerson(entry));
  }
  warn("people", badPeople);
  warn("duplicate-people", duplicates);

  // Photos: valid image data URLs only, within the limits.
  let droppedPhotos = 0;
  for (const person of people) {
    if (!person.photos) continue;
    const kept = person.photos.filter(
      (p) =>
        isObject(p) &&
        isId(p.id) &&
        typeof p.dataUrl === "string" &&
        PHOTO_URL.test(p.dataUrl) &&
        p.dataUrl.length <= MAX_PHOTO_CHARS,
    );
    const limited = kept.slice(0, MAX_PHOTOS_PER_PERSON);
    droppedPhotos += person.photos.length - limited.length;
    if (limited.length > 0) person.photos = limited;
    else delete person.photos;
  }
  warn("photos", droppedPhotos);

  // Relationships: valid ids that point at people in the file.
  const relationships = raw.relationships.filter((r): r is FamilyData["relationships"][number] => {
    if (!isObject(r) || !isId(r.id)) return false;
    if ("parentId" in r)
      return isId(r.parentId) && isId(r.childId) && seen.has(r.parentId) && seen.has(r.childId);
    return isId(r.personAId) && isId(r.personBId) && seen.has(r.personAId) && seen.has(r.personBId);
  });
  warn("relationships", raw.relationships.length - relationships.length);

  // Events (optional): a known type and at least one person that exists.
  const events: FamilyEvent[] = [];
  let droppedEvents = 0;
  if (raw.events !== undefined) {
    const list = Array.isArray(raw.events) ? raw.events : [];
    if (!Array.isArray(raw.events)) droppedEvents += 1;
    for (const e of list) {
      if (!isObject(e) || !isId(e.id) || !Array.isArray(e.personIds)) {
        droppedEvents += 1;
        continue;
      }
      const known = e.personIds.filter((p): p is string => isId(p) && seen.has(p));
      const kinds: readonly string[] = [...EVENT_KINDS, "baptism"];
      if (
        known.length === 0 ||
        typeof e.kind !== "string" ||
        !kinds.includes(e.kind) ||
        !isObject(e.date)
      ) {
        droppedEvents += 1;
        continue;
      }
      const [first, ...rest] = known;
      events.push({
        ...(e as unknown as FamilyEvent),
        kind: e.kind as EventKind,
        personIds: [first as string, ...rest] as FamilyEvent["personIds"],
      });
    }
  }
  warn("events", droppedEvents);

  const data: FamilyData = {
    schemaVersion: 1,
    people,
    relationships,
    ...(events.length > 0 ? { events } : {}),
  };
  return { data, warnings, summary: summarize(data) };
}

/** Keeps what the app understands of a person; a malformed facet is dropped, not the person. */
function sanitizePerson(entry: Record<string, unknown>): Person {
  const person = { ...entry } as unknown as Person;
  const asRecord = person as unknown as Record<string, unknown>;
  if ("names" in asRecord && !isObject(asRecord.names)) delete asRecord.names;
  if ("born" in asRecord && !isObject(asRecord.born)) delete asRecord.born;
  if ("lifeStatus" in asRecord && !isObject(asRecord.lifeStatus)) delete asRecord.lifeStatus;
  if ("photos" in asRecord && !Array.isArray(asRecord.photos)) delete asRecord.photos;
  return person;
}
