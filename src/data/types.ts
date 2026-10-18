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
}

export interface PersonLastName {
  value: string;
  kind: "birth" | "married" | "current" | "other";
  date: VariablePrecisionDate;
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
}

export interface PersonLiving extends UnknownPerson {
  living: true;
}

export interface PersonDeceased extends UnknownPerson {
  living: false;
  dateOfDeath: VariablePrecisionDate;
}

/**
 * A person's full record. Each facet (names, birth, life status) is fully
 * optional and, when present, is a complete/valid instance of its own type
 * — no partially-filled facets are representable.
 */
export interface Person extends UnknownPerson {
  names?: NamedPerson;
  born?: PersonBorn;
  lifeStatus?: PersonLiving | PersonDeceased;
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

export interface FamilyData {
  schemaVersion: 1;
  people: Person[];
  relationships: Relationship[];
}
