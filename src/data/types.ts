// src/data/types.ts

/**
 * Generic branded UUID type — prevents a plain string from being assigned
 * where a specific entity's id is expected without going through
 * `createUuidId`/`parseUuidId`, catching mistakes at compile time.
 */
export type UuidId<Brand extends string> = string & { readonly __brand: Brand };

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createUuidId<Brand extends string>(): UuidId<Brand> {
  return crypto.randomUUID() as UuidId<Brand>;
}

/** Validates an untrusted string (e.g. loaded from JSON) as a UuidId. */
export function parseUuidId<Brand extends string>(value: string): UuidId<Brand> {
  if (!UUID_RE.test(value)) {
    throw new Error(`Invalid id: "${value}" is not a UUID`);
  }
  return value as UuidId<Brand>;
}

export type PersonId = UuidId<"PersonId">;
export type RelationshipId = UuidId<"RelationshipId">;
export type EventId = UuidId<"EventId">;
export type PhotoId = UuidId<"PhotoId">;

/** A person known only by id — no other facts recorded (yet). */
export interface UnknownPerson {
  id: PersonId;
}

export const UNKNOWN_YEAR_SENTINEL = 9999;

/**
 * A date whose precision may vary — the end user might not know every part
 * of it (day, month, or even year) but may want to add missing parts later.
 *
 * `raw` is always a complete, valid date: unknown year -> UNKNOWN_YEAR_SENTINEL,
 * unknown month -> January, unknown day -> 1st, unknown hour/minute -> 00:00.
 * Used for sorting/comparison only.
 *
 * Never infer "unknown" by checking `raw` against the sentinel — always
 * check the *Known flags below; they are the source of truth for
 * precision/display (e.g. "March 1980" vs "March 1st 1980").
 */
export interface VariablePrecisionDate {
  raw: string; // ISO 8601, e.g. "1980-03-01T00:00"

  yearKnown: boolean;
  monthKnown: boolean;
  dayKnown: boolean;
  hourKnown: boolean;
  minuteKnown: boolean;
}

export interface PersonFirstName {
  value: string;
  kind: "birth" | "current" | "nickname" | "other";
  date: VariablePrecisionDate;
  /** At most one per list; with none marked, the first entry is primary. */
  primary?: boolean;
}

export interface PersonLastName {
  value: string;
  kind: "birth" | "married" | "current" | "other";
  date: VariablePrecisionDate;
  /** At most one per list; with none marked, the first entry is primary. */
  primary?: boolean;
}

/** A non-empty array — at least one element guaranteed at the type level. */
export type NonEmptyArray<T> = [T, ...T[]];

// A person with only a first name, only a last name, or both are all valid
// NamedPersons; a person with neither is not representable.
export interface NamedPersonWithFirstName extends UnknownPerson {
  firstNames: NonEmptyArray<PersonFirstName>;
  lastNames?: PersonLastName[];
}

export interface NamedPersonWithLastName extends UnknownPerson {
  firstNames?: PersonFirstName[];
  lastNames: NonEmptyArray<PersonLastName>;
}

export type NamedPerson = NamedPersonWithFirstName | NamedPersonWithLastName;

export interface PersonBorn extends UnknownPerson {
  birthDate: VariablePrecisionDate;
  /** Optional free-text place, e.g. "Lyon, France". */
  birthPlace?: string;
}

export interface PersonLiving extends UnknownPerson {
  living: true;
}

export interface PersonDeceased extends UnknownPerson {
  living: false;
  dateOfDeath: VariablePrecisionDate;
  /** Optional free-text place. */
  placeOfDeath?: string;
}

/**
 * A person's full record. Each facet (names, birth, life status) is fully
 * optional and, when present, is a complete/valid instance of its own type
 * — no partially-filled facets are representable.
 */
export interface Person extends UnknownPerson {
  names?: NamedPerson;
  /** Free text (memories, stories), line breaks kept. Optional: older files load unchanged. */
  notes?: string;
  born?: PersonBorn;
  lifeStatus?: PersonLiving | PersonDeceased;
  /** The first photo is the main one. Optional: files saved before photos load unchanged. */
  photos?: PersonPhoto[];
}

/** A picture of a person, shrunk and stored inside the family file as a data URL. */
export interface PersonPhoto {
  id: PhotoId;
  /** "data:image/jpeg;base64,..." (png and webp are accepted too). */
  dataUrl: string;
  caption?: string;
}

export interface UnknownRelationship {
  id: RelationshipId;
}

export interface RelationshipFamilialPermanent extends UnknownRelationship {
  parentId: PersonId;
  childId: PersonId;
  nature: "biological-confirmed" | "biological-presumed" | "adoptive";
}

export interface RelationshipFamilialTemporaryOngoing extends UnknownRelationship {
  parentId: PersonId;
  childId: PersonId;
  nature: "step" | "foster" | "guardian";
  status: "ongoing";
  startDate: VariablePrecisionDate;
}

export interface RelationshipFamilialTemporaryEnded extends UnknownRelationship {
  parentId: PersonId;
  childId: PersonId;
  nature: "step" | "foster" | "guardian";
  status: "ended";
  startDate: VariablePrecisionDate;
  endDate: VariablePrecisionDate;
}

export interface RelationshipFamilialTemporaryUnknownStatus extends UnknownRelationship {
  parentId: PersonId;
  childId: PersonId;
  nature: "step" | "foster" | "guardian";
  status: "unknown";
  startDate: VariablePrecisionDate;
}

export type RelationshipFamilialTemporary =
  | RelationshipFamilialTemporaryOngoing
  | RelationshipFamilialTemporaryEnded
  | RelationshipFamilialTemporaryUnknownStatus;

export type RelationshipFamilial = RelationshipFamilialPermanent | RelationshipFamilialTemporary;

export interface RelationshipSocialOngoing extends UnknownRelationship {
  personAId: PersonId;
  personBId: PersonId;
  status: "ongoing";
  startDate: VariablePrecisionDate;
}

export interface RelationshipSocialEnded extends UnknownRelationship {
  personAId: PersonId;
  personBId: PersonId;
  status: "ended";
  startDate: VariablePrecisionDate;
  endDate: VariablePrecisionDate;
}

export interface RelationshipSocialUnknownStatus extends UnknownRelationship {
  personAId: PersonId;
  personBId: PersonId;
  status: "unknown";
  startDate: VariablePrecisionDate;
}

export type RelationshipSocial =
  RelationshipSocialOngoing | RelationshipSocialEnded | RelationshipSocialUnknownStatus;

export type Relationship = RelationshipFamilial | RelationshipSocial;

export type EventKind =
  | "marriage"
  | "divorce"
  /** No longer offered, but events saved with it still load and show. */
  | "baptism"
  | "residence"
  | "occupation"
  | "education"
  | "military"
  | "emigration"
  | "immigration"
  | "other";

/**
 * Something that happened in people's lives, recorded by the user (birth and death are facts of
 * the person, not events). An event involves one or more people: a marriage has two.
 */
export interface FamilyEvent {
  id: EventId;
  kind: EventKind;
  date: VariablePrecisionDate;
  place?: string;
  description?: string;
  personIds: [PersonId, ...PersonId[]];
}

export interface FamilyData {
  schemaVersion: 1;
  people: Person[];
  relationships: Relationship[];
  /** Optional so files saved before events existed load unchanged. */
  events?: FamilyEvent[];
}
