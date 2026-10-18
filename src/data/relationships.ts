import { PersonNotFoundError } from "./errors.ts";
import {
  createUuidId,
  type FamilyData,
  type Person,
  type PersonId,
  type Relationship,
  type RelationshipFamilial,
  type RelationshipFamilialPermanent,
  type RelationshipId,
  type RelationshipSocial,
} from "./types.ts";

// Dates are not edited in the UI yet; the model still requires them on partnerships.
const UNKNOWN_START_DATE = {
  raw: "9999-01-01T00:00",
  yearKnown: false,
  monthKnown: false,
  dayKnown: false,
  hourKnown: false,
  minuteKnown: false,
};

export type ParentChildNature = RelationshipFamilialPermanent["nature"];
export type PartnerStatus = RelationshipSocial["status"];

export const PARENT_CHILD_NATURES: readonly ParentChildNature[] = [
  "biological-confirmed",
  "biological-presumed",
  "adoptive",
];
export const PARTNER_STATUSES: readonly PartnerStatus[] = ["ongoing", "ended", "unknown"];

export class RelationshipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RelationshipError";
  }
}

export class RelationshipNotFoundError extends Error {
  constructor(id: RelationshipId) {
    super(`Relationship not found: ${id}`);
    this.name = "RelationshipNotFoundError";
  }
}

export function isParentChild(r: Relationship): r is RelationshipFamilial {
  return "parentId" in r;
}

export function involvesPerson(r: Relationship, id: PersonId): boolean {
  return isParentChild(r)
    ? r.parentId === id || r.childId === id
    : r.personAId === id || r.personBId === id;
}

export function relationshipsOf(data: FamilyData, id: PersonId): Relationship[] {
  return data.relationships.filter((r) => involvesPerson(r, id));
}

function requirePerson(data: FamilyData, id: PersonId): void {
  if (!data.people.some((p: Person) => p.id === id)) throw new PersonNotFoundError(id);
}

/** True when `target` is reachable from `start` by following parent -> child links. */
function isDescendant(data: FamilyData, start: PersonId, target: PersonId): boolean {
  const seen = new Set<PersonId>();
  const stack: PersonId[] = [start];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined || seen.has(current)) continue;
    seen.add(current);
    for (const r of data.relationships) {
      if (!isParentChild(r) || r.parentId !== current) continue;
      if (r.childId === target) return true;
      stack.push(r.childId);
    }
  }
  return false;
}

export interface ParentChildInput {
  parentId: PersonId;
  childId: PersonId;
  nature: ParentChildNature;
}

export function addParentChild(data: FamilyData, input: ParentChildInput): FamilyData {
  requirePerson(data, input.parentId);
  requirePerson(data, input.childId);
  if (input.parentId === input.childId) {
    throw new RelationshipError("A person cannot be their own parent.");
  }
  const exists = data.relationships.some(
    (r) => isParentChild(r) && r.parentId === input.parentId && r.childId === input.childId,
  );
  if (exists) throw new RelationshipError("This parent-child relationship already exists.");
  if (isDescendant(data, input.childId, input.parentId)) {
    throw new RelationshipError(
      "This would create a cycle: the parent is a descendant of the child.",
    );
  }
  const relationship: RelationshipFamilialPermanent = {
    id: createUuidId<"RelationshipId">(),
    parentId: input.parentId,
    childId: input.childId,
    nature: input.nature,
  };
  return { ...data, relationships: [...data.relationships, relationship] };
}

export interface PartnersInput {
  personAId: PersonId;
  personBId: PersonId;
  status: PartnerStatus;
}

export function addPartners(data: FamilyData, input: PartnersInput): FamilyData {
  requirePerson(data, input.personAId);
  requirePerson(data, input.personBId);
  if (input.personAId === input.personBId) {
    throw new RelationshipError("A person cannot be their own partner.");
  }
  const samePair = (r: Relationship): boolean =>
    !isParentChild(r) &&
    r.status === input.status &&
    ((r.personAId === input.personAId && r.personBId === input.personBId) ||
      (r.personAId === input.personBId && r.personBId === input.personAId));
  if (data.relationships.some(samePair)) {
    throw new RelationshipError("This partnership already exists.");
  }
  const base = {
    id: createUuidId<"RelationshipId">(),
    personAId: input.personAId,
    personBId: input.personBId,
    startDate: UNKNOWN_START_DATE,
  };
  // `ended` additionally requires an end date by type.
  const relationship: RelationshipSocial =
    input.status === "ended"
      ? { ...base, status: "ended", endDate: UNKNOWN_START_DATE }
      : { ...base, status: input.status };
  return { ...data, relationships: [...data.relationships, relationship] };
}

export function removeRelationship(data: FamilyData, id: RelationshipId): FamilyData {
  if (!data.relationships.some((r) => r.id === id)) throw new RelationshipNotFoundError(id);
  return { ...data, relationships: data.relationships.filter((r) => r.id !== id) };
}

const NATURE_LABEL: Record<RelationshipFamilial["nature"], string> = {
  "biological-confirmed": "biological, confirmed",
  "biological-presumed": "biological, presumed",
  adoptive: "adoptive",
  step: "step",
  foster: "foster",
  guardian: "guardian",
};

export function natureLabel(nature: RelationshipFamilial["nature"]): string {
  return NATURE_LABEL[nature];
}

/** e.g. "Ada is parent of Byron (biological, confirmed)". */
export function describeRelationship(r: Relationship, nameOf: (id: PersonId) => string): string {
  if (isParentChild(r)) {
    return `${nameOf(r.parentId)} is parent of ${nameOf(r.childId)} (${natureLabel(r.nature)})`;
  }
  return `${nameOf(r.personAId)} and ${nameOf(r.personBId)} are partners (${r.status})`;
}
