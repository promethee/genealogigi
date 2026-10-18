import {
  dateFromInput,
  emptyDateInput,
  formatDate,
  inputFromDate,
  isCertainlyBefore,
  UNKNOWN_DATE,
} from "./dates.ts";
import type { PartialDateInput } from "./dates.ts";
import { t } from "../i18n/index.ts";
import { PersonNotFoundError } from "./errors.ts";
import {
  createUuidId,
  type FamilyData,
  type Person,
  type PersonId,
  type Relationship,
  type RelationshipFamilial,
  type RelationshipFamilialPermanent,
  type RelationshipFamilialTemporary,
  type RelationshipId,
  type RelationshipSocial,
  type VariablePrecisionDate,
} from "./types.ts";

export type ParentChildNature = RelationshipFamilialPermanent["nature"];
export type TemporaryNature = RelationshipFamilialTemporary["nature"];
export type TemporaryStatus = RelationshipFamilialTemporary["status"];
export type PartnerStatus = RelationshipSocial["status"];

export const PARENT_CHILD_NATURES: readonly ParentChildNature[] = [
  "biological-confirmed",
  "biological-presumed",
  "adoptive",
];
export const TEMPORARY_NATURES: readonly TemporaryNature[] = ["step", "foster", "guardian"];
export const TEMPORARY_STATUSES: readonly TemporaryStatus[] = ["ongoing", "ended", "unknown"];
export const PARTNER_STATUSES: readonly PartnerStatus[] = ["ongoing", "ended", "unknown"];

export class RelationshipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RelationshipError";
  }
}

export class RelationshipNotFoundError extends Error {
  constructor(id: RelationshipId) {
    super(t("err.relNotFound", { id }));
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

export interface PermanentParentChildInput {
  parentId: PersonId;
  childId: PersonId;
  nature: ParentChildNature;
}

export interface TemporaryParentChildInput {
  parentId: PersonId;
  childId: PersonId;
  nature: TemporaryNature;
  status: TemporaryStatus;
  /** Any part may be blank; all blank means unknown. */
  start: PartialDateInput;
  /** Only used when status is "ended". */
  end: PartialDateInput;
}

export type ParentChildInput = PermanentParentChildInput | TemporaryParentChildInput;

function isTemporaryInput(input: ParentChildInput): input is TemporaryParentChildInput {
  return (TEMPORARY_NATURES as readonly string[]).includes(input.nature);
}

function isTemporary(r: Relationship): r is RelationshipFamilialTemporary {
  return isParentChild(r) && (TEMPORARY_NATURES as readonly string[]).includes(r.nature);
}

function buildParentChild(
  data: FamilyData,
  input: ParentChildInput,
  id: RelationshipId,
  ignoring?: RelationshipId,
): RelationshipFamilial {
  requirePerson(data, input.parentId);
  requirePerson(data, input.childId);
  if (input.parentId === input.childId) {
    throw new RelationshipError(t("err.relSelf"));
  }
  // Permanent links: one per pair. Temporary links: one per pair and nature.
  const exists = data.relationships.some(
    (r) =>
      r.id !== ignoring &&
      isParentChild(r) &&
      r.parentId === input.parentId &&
      r.childId === input.childId &&
      (isTemporaryInput(input) ? r.nature === input.nature : !isTemporary(r)),
  );
  if (exists) throw new RelationshipError(t("err.relExists"));
  if (isDescendant(data, input.childId, input.parentId)) {
    throw new RelationshipError(t("err.relCycle"));
  }
  const base = { id, parentId: input.parentId, childId: input.childId };
  if (!isTemporaryInput(input)) return { ...base, nature: input.nature };
  const startDate = dateFromInput(input.start, t("date.start")) ?? UNKNOWN_DATE;
  if (input.status === "ended") {
    const endDate = dateFromInput(input.end, t("date.end")) ?? UNKNOWN_DATE;
    if (isCertainlyBefore(endDate, startDate)) {
      throw new RelationshipError(t("err.endBeforeStart"));
    }
    return { ...base, nature: input.nature, status: "ended", startDate, endDate };
  }
  return { ...base, nature: input.nature, status: input.status, startDate };
}

export function addParentChild(data: FamilyData, input: ParentChildInput): FamilyData {
  const relationship = buildParentChild(data, input, createUuidId<"RelationshipId">());
  return { ...data, relationships: [...data.relationships, relationship] };
}

export interface PartnersInput {
  personAId: PersonId;
  personBId: PersonId;
  status: PartnerStatus;
  /** Any part may be blank; omitted or blank means unknown. */
  start?: PartialDateInput;
  /** Only used when status is "ended". */
  end?: PartialDateInput;
}

function buildPartners(
  data: FamilyData,
  input: PartnersInput,
  id: RelationshipId,
  ignoring?: RelationshipId,
): RelationshipSocial {
  requirePerson(data, input.personAId);
  requirePerson(data, input.personBId);
  if (input.personAId === input.personBId) {
    throw new RelationshipError(t("err.partnerSelf"));
  }
  const duplicate = data.relationships.some(
    (r) =>
      r.id !== ignoring &&
      !isParentChild(r) &&
      r.status === input.status &&
      ((r.personAId === input.personAId && r.personBId === input.personBId) ||
        (r.personAId === input.personBId && r.personBId === input.personAId)),
  );
  if (duplicate) throw new RelationshipError(t("err.partnerExists"));
  const startDate = (input.start && dateFromInput(input.start, t("date.start"))) || UNKNOWN_DATE;
  const base = { id, personAId: input.personAId, personBId: input.personBId, startDate };
  if (input.status !== "ended") return { ...base, status: input.status };
  // `ended` additionally requires an end date by type.
  const endDate = (input.end && dateFromInput(input.end, t("date.end"))) || UNKNOWN_DATE;
  if (isCertainlyBefore(endDate, startDate)) {
    throw new RelationshipError(t("err.endBeforeStart"));
  }
  return { ...base, status: "ended", endDate };
}

export function addPartners(data: FamilyData, input: PartnersInput): FamilyData {
  const relationship = buildPartners(data, input, createUuidId<"RelationshipId">());
  return { ...data, relationships: [...data.relationships, relationship] };
}

/** Replaces the relationship `id` in place; the people must be the ones already linked. */
export function updateRelationship(
  data: FamilyData,
  id: RelationshipId,
  input: ParentChildInput | PartnersInput,
): FamilyData {
  const existing = data.relationships.find((r) => r.id === id);
  if (!existing) throw new RelationshipNotFoundError(id);
  const next =
    "parentId" in input
      ? buildParentChild(data, input, id, id)
      : buildPartners(data, input, id, id);
  if (isParentChild(existing) !== isParentChild(next)) {
    throw new RelationshipError(t("err.relTypeChange"));
  }
  const samePeople = isParentChild(existing)
    ? existing.parentId === (next as RelationshipFamilial).parentId &&
      existing.childId === (next as RelationshipFamilial).childId
    : existing.personAId === (next as RelationshipSocial).personAId &&
      existing.personBId === (next as RelationshipSocial).personBId;
  if (!samePeople) throw new RelationshipError(t("err.relPeopleChange"));
  return { ...data, relationships: data.relationships.map((r) => (r.id === id ? next : r)) };
}

export function removeRelationship(data: FamilyData, id: RelationshipId): FamilyData {
  if (!data.relationships.some((r) => r.id === id)) throw new RelationshipNotFoundError(id);
  return { ...data, relationships: data.relationships.filter((r) => r.id !== id) };
}

export function natureLabel(nature: RelationshipFamilial["nature"]): string {
  return t(`nature.${nature}`);
}

/** "ongoing" / "ended" / "unknown" in the active language. */
export function statusLabel(status: TemporaryStatus | PartnerStatus): string {
  return t(`status.${status}`);
}

function periodText(start: VariablePrecisionDate, end?: VariablePrecisionDate): string {
  const known = (d: VariablePrecisionDate) => d.yearKnown || d.monthKnown || d.dayKnown;
  if (end) {
    if (!known(start) && !known(end)) return "";
    return `${known(start) ? formatDate(start) : "?"}–${known(end) ? formatDate(end) : "?"}`;
  }
  return known(start) ? t("rel.from", { date: formatDate(start) }) : "";
}

/** e.g. "Ada is parent of Byron (biological, confirmed)" or "(foster, 1990–1995)". */
export function describeRelationship(r: Relationship, nameOf: (id: PersonId) => string): string {
  if (isParentChild(r)) {
    const parts = [natureLabel(r.nature)];
    if (isTemporary(r)) {
      const period = periodText(r.startDate, r.status === "ended" ? r.endDate : undefined);
      if (period) parts.push(period);
      if (r.status === "ended" && !period) parts.push(statusLabel("ended"));
      else if (r.status === "unknown") parts.push(t("rel.statusUnknown"));
      else if (r.status === "ongoing" && !period) parts.push(statusLabel("ongoing"));
    }
    return t("rel.describe.parent", {
      parent: nameOf(r.parentId),
      child: nameOf(r.childId),
      details: parts.join(", "),
    });
  }
  const period = periodText(r.startDate, r.status === "ended" ? r.endDate : undefined);
  const detail = period ? `${statusLabel(r.status)}, ${period}` : statusLabel(r.status);
  return t("rel.describe.partners", {
    a: nameOf(r.personAId),
    b: nameOf(r.personBId),
    details: detail,
  });
}

export interface RelationshipEditValues {
  nature: ParentChildNature | TemporaryNature;
  status: TemporaryStatus | PartnerStatus;
  start: PartialDateInput;
  end: PartialDateInput;
}

/** Form values for editing `r`; dates are blank for permanent links. */
export function editValuesOf(r: Relationship): RelationshipEditValues {
  const blank = emptyDateInput();
  if (isParentChild(r)) {
    if (!isTemporary(r)) return { nature: r.nature, status: "ongoing", start: blank, end: blank };
    return {
      nature: r.nature,
      status: r.status,
      start: inputFromDate(r.startDate),
      end: r.status === "ended" ? inputFromDate(r.endDate) : blank,
    };
  }
  return {
    nature: "biological-confirmed",
    status: r.status,
    start: inputFromDate(r.startDate),
    end: r.status === "ended" ? inputFromDate(r.endDate) : blank,
  };
}
