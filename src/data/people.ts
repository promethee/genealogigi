import {
  dateFromInput,
  emptyDateInput,
  formatDate,
  inputFromDate,
  isCertainlyBefore,
  InvalidDateError,
  UNKNOWN_DATE,
  yearOf,
  type PartialDateInput,
} from "./dates.ts";
import { PersonNotFoundError } from "./errors.ts";
import { involvesPerson } from "./relationships.ts";
import {
  createUuidId,
  type FamilyData,
  type NamedPerson,
  type Person,
  type PersonBorn,
  type PersonDeceased,
  type PersonId,
  type PersonLiving,
} from "./types.ts";

export { PersonNotFoundError, UNKNOWN_DATE };

export const UNNAMED_PERSON_LABEL = "Unnamed person";

export type LifeStatusChoice = "unknown" | "living" | "deceased";

export interface PersonNameInput {
  firstName: string;
  lastName: string;
}

/**
 * What the person form submits. Birth, status and death are optional so that
 * callers sending only names leave those facets untouched on update.
 */
export interface PersonFormInput extends PersonNameInput {
  birth?: PartialDateInput;
  status?: LifeStatusChoice;
  death?: PartialDateInput;
}

export type PersonFormValues = Required<PersonFormInput>;

export function emptyPersonForm(): PersonFormValues {
  return {
    firstName: "",
    lastName: "",
    birth: emptyDateInput(),
    status: "unknown",
    death: emptyDateInput(),
  };
}

export class NameRequiredError extends Error {
  constructor() {
    super("At least one name is required.");
    this.name = "NameRequiredError";
  }
}

export class NamesNotEditableError extends Error {
  constructor() {
    super("This person has several names and cannot be edited here yet.");
    this.name = "NamesNotEditableError";
  }
}

export class DateOrderError extends InvalidDateError {
  constructor() {
    super("Death cannot be before birth.");
    this.name = "DateOrderError";
  }
}

function buildNames(id: PersonId, input: PersonNameInput): NamedPerson {
  const first = input.firstName.trim();
  const last = input.lastName.trim();
  const firstNames = first ? [{ value: first, kind: "birth" as const, date: UNKNOWN_DATE }] : [];
  const lastNames = last ? [{ value: last, kind: "birth" as const, date: UNKNOWN_DATE }] : [];
  if (firstNames[0]) return { id, firstNames: [firstNames[0]], lastNames };
  if (lastNames[0]) return { id, lastNames: [lastNames[0]] };
  throw new NameRequiredError();
}

function buildBorn(id: PersonId, birth: PartialDateInput): PersonBorn | undefined {
  const birthDate = dateFromInput(birth, "Birth date");
  return birthDate ? { id, birthDate } : undefined;
}

function buildLifeStatus(
  id: PersonId,
  status: LifeStatusChoice,
  death: PartialDateInput,
): PersonLiving | PersonDeceased | undefined {
  if (status === "living") return { id, living: true };
  if (status === "deceased") {
    return { id, living: false, dateOfDeath: dateFromInput(death, "Death date") ?? UNKNOWN_DATE };
  }
  return undefined;
}

function assertDeathNotBeforeBirth(person: Person): void {
  const status = person.lifeStatus;
  if (!person.born || !status || status.living) return;
  if (isCertainlyBefore(status.dateOfDeath, person.born.birthDate)) throw new DateOrderError();
}

/** True when the names fit the simple "one first, one last" form. */
export function canEditNames(person: Person): boolean {
  const names = person.names;
  if (!names) return true;
  return (names.firstNames?.length ?? 0) <= 1 && (names.lastNames?.length ?? 0) <= 1;
}

export function inputFromPerson(person: Person): PersonFormValues {
  const status = person.lifeStatus;
  return {
    firstName: person.names?.firstNames?.[0]?.value ?? "",
    lastName: person.names?.lastNames?.[0]?.value ?? "",
    birth: inputFromDate(person.born?.birthDate),
    status: !status ? "unknown" : status.living ? "living" : "deceased",
    death: inputFromDate(status && !status.living ? status.dateOfDeath : undefined),
  };
}

export function displayName(person: Person): string {
  const first = person.names?.firstNames?.[0]?.value;
  const last = person.names?.lastNames?.[0]?.value;
  return [first, last].filter(Boolean).join(" ") || UNNAMED_PERSON_LABEL;
}

/** e.g. "b. 10 Dec 1815 · d. 27 Nov 1852", "living", or "" when nothing is known. */
export function lifeSummary(person: Person): string {
  const pieces: string[] = [];
  if (person.born) pieces.push(`b. ${formatDate(person.born.birthDate)}`);
  const status = person.lifeStatus;
  if (status?.living) pieces.push("living");
  if (status && !status.living) {
    const known = status.dateOfDeath.yearKnown || status.dateOfDeath.monthKnown;
    pieces.push(known ? `d. ${formatDate(status.dateOfDeath)}` : "deceased");
  }
  return pieces.join(" · ");
}

/** e.g. "1815–1852", "1990–", "b. 1815", or "" when there is nothing to show. */
export function lifespan(person: Person): string {
  const born = person.born ? yearOf(person.born.birthDate) : null;
  const status = person.lifeStatus;
  if (status && !status.living) {
    return `${born ?? "?"}–${yearOf(status.dateOfDeath) ?? "?"}`;
  }
  if (status?.living && person.born) return `${born ?? "?"}–`;
  if (born !== null) return `b. ${born}`;
  return "";
}

export function addPerson(data: FamilyData, input: PersonFormInput): FamilyData {
  const id = createUuidId<"PersonId">();
  const person: Person = { id, names: buildNames(id, input) };
  const born = buildBorn(id, input.birth ?? emptyDateInput());
  const lifeStatus = buildLifeStatus(
    id,
    input.status ?? "unknown",
    input.death ?? emptyDateInput(),
  );
  if (born) person.born = born;
  if (lifeStatus) person.lifeStatus = lifeStatus;
  assertDeathNotBeforeBirth(person);
  return { ...data, people: [...data.people, person] };
}

export function updatePerson(data: FamilyData, id: PersonId, input: PersonFormInput): FamilyData {
  const existing = data.people.find((p) => p.id === id);
  if (!existing) throw new PersonNotFoundError(id);
  if (!canEditNames(existing)) throw new NamesNotEditableError();

  const { born: oldBorn, lifeStatus: oldLifeStatus, ...rest } = existing;
  const updated: Person = { ...rest, names: buildNames(id, input) };

  // Facets the caller did not send are kept as they were.
  const born = input.birth === undefined ? oldBorn : buildBorn(id, input.birth);
  const lifeStatus =
    input.status === undefined
      ? oldLifeStatus
      : buildLifeStatus(id, input.status, input.death ?? emptyDateInput());
  if (born) updated.born = born;
  if (lifeStatus) updated.lifeStatus = lifeStatus;

  assertDeathNotBeforeBirth(updated);
  return { ...data, people: data.people.map((p) => (p.id === id ? updated : p)) };
}

export function removePerson(data: FamilyData, id: PersonId): FamilyData {
  if (!data.people.some((p) => p.id === id)) throw new PersonNotFoundError(id);
  return {
    ...data,
    people: data.people.filter((p) => p.id !== id),
    relationships: data.relationships.filter((r) => !involvesPerson(r, id)),
  };
}
