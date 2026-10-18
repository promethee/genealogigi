import { PersonNotFoundError } from "./errors.ts";
import { involvesPerson } from "./relationships.ts";
import {
  createUuidId,
  type FamilyData,
  type NamedPerson,
  type Person,
  type PersonId,
  type VariablePrecisionDate,
} from "./types.ts";

/** Fully-unknown date: the model requires a date on every name entry. */
export const UNKNOWN_DATE: VariablePrecisionDate = {
  raw: "9999-01-01T00:00",
  yearKnown: false,
  monthKnown: false,
  dayKnown: false,
  hourKnown: false,
  minuteKnown: false,
};

export { PersonNotFoundError };

export const UNNAMED_PERSON_LABEL = "Unnamed person";

export interface PersonNameInput {
  firstName: string;
  lastName: string;
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

function buildNames(id: PersonId, input: PersonNameInput): NamedPerson {
  const first = input.firstName.trim();
  const last = input.lastName.trim();
  const firstNames = first ? [{ value: first, kind: "birth" as const, date: UNKNOWN_DATE }] : [];
  const lastNames = last ? [{ value: last, kind: "birth" as const, date: UNKNOWN_DATE }] : [];
  if (firstNames[0]) return { id, firstNames: [firstNames[0]], lastNames };
  if (lastNames[0]) return { id, lastNames: [lastNames[0]] };
  throw new NameRequiredError();
}

/** True when the names fit the simple "one first, one last" form. */
export function canEditNames(person: Person): boolean {
  const names = person.names;
  if (!names) return true;
  return (names.firstNames?.length ?? 0) <= 1 && (names.lastNames?.length ?? 0) <= 1;
}

export function inputFromPerson(person: Person): PersonNameInput {
  return {
    firstName: person.names?.firstNames?.[0]?.value ?? "",
    lastName: person.names?.lastNames?.[0]?.value ?? "",
  };
}

export function displayName(person: Person): string {
  const first = person.names?.firstNames?.[0]?.value;
  const last = person.names?.lastNames?.[0]?.value;
  return [first, last].filter(Boolean).join(" ") || UNNAMED_PERSON_LABEL;
}

export function addPerson(data: FamilyData, input: PersonNameInput): FamilyData {
  const id = createUuidId<"PersonId">();
  const person: Person = { id, names: buildNames(id, input) };
  return { ...data, people: [...data.people, person] };
}

export function updatePerson(data: FamilyData, id: PersonId, input: PersonNameInput): FamilyData {
  const existing = data.people.find((p) => p.id === id);
  if (!existing) throw new PersonNotFoundError(id);
  if (!canEditNames(existing)) throw new NamesNotEditableError();
  const updated: Person = { ...existing, names: buildNames(id, input) };
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
