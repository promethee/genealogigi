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
import { t } from "../i18n/index.ts";
import { involvesPerson } from "./relationships.ts";
import {
  createUuidId,
  type FamilyData,
  type NamedPerson,
  type Person,
  type PersonBorn,
  type PersonDeceased,
  type PersonFirstName,
  type PersonId,
  type PersonLastName,
  type PersonLiving,
  type VariablePrecisionDate,
} from "./types.ts";

export { PersonNotFoundError, UNKNOWN_DATE };

export type LifeStatusChoice = "unknown" | "living" | "deceased";
export type FirstNameKind = PersonFirstName["kind"];
export type LastNameKind = PersonLastName["kind"];

export const FIRST_NAME_KINDS: readonly FirstNameKind[] = ["birth", "current", "nickname", "other"];
export const LAST_NAME_KINDS: readonly LastNameKind[] = ["birth", "married", "current", "other"];

/** One editable row of the names form. */
export interface NameEntryInput<K extends string> {
  value: string;
  kind: K;
  date: PartialDateInput;
  primary: boolean;
}

export function blankNameEntry<K extends string>(kind: K, primary = false): NameEntryInput<K> {
  return { value: "", kind, date: emptyDateInput(), primary };
}

/**
 * What the person form submits. Names come as lists (`firstNames`,
 * `lastNames`) or, as shorthand, as single strings (`firstName`, `lastName`);
 * lists win when given. Birth, status and death are optional so that callers
 * sending only names leave those facets untouched on update.
 */
export interface PersonFormInput {
  firstName?: string;
  lastName?: string;
  firstNames?: NameEntryInput<FirstNameKind>[];
  lastNames?: NameEntryInput<LastNameKind>[];
  birth?: PartialDateInput;
  status?: LifeStatusChoice;
  death?: PartialDateInput;
}

/** A fully-populated form state. */
export interface PersonFormValues {
  firstNames: NameEntryInput<FirstNameKind>[];
  lastNames: NameEntryInput<LastNameKind>[];
  birth: PartialDateInput;
  status: LifeStatusChoice;
  death: PartialDateInput;
}

export function emptyPersonForm(): PersonFormValues {
  return {
    firstNames: [blankNameEntry<FirstNameKind>("birth", true)],
    lastNames: [blankNameEntry<LastNameKind>("birth", true)],
    birth: emptyDateInput(),
    status: "living",
    death: emptyDateInput(),
  };
}

/** A birth year this many years ago or more makes "deceased" the likelier answer. */
export const LIKELY_DECEASED_AFTER_YEARS = 110;

/**
 * The status to preselect for a new person from the typed birth year: deceased when the
 * year is more than 110 years back, living otherwise (including when blank or not a year).
 */
export function suggestedStatus(
  birthYear: string,
  currentYear: number = new Date().getFullYear(),
): "living" | "deceased" {
  const text = birthYear.trim();
  if (!/^\d{1,4}$/.test(text)) return "living";
  const year = Number(text);
  return year >= 1 && currentYear - year > LIKELY_DECEASED_AFTER_YEARS ? "deceased" : "living";
}

export class NameRequiredError extends Error {
  constructor() {
    super(t("err.nameRequired"));
    this.name = "NameRequiredError";
  }
}

export class NamesNotEditableError extends Error {
  constructor() {
    super(t("err.namesNotEditable"));
    this.name = "NamesNotEditableError";
  }
}

export class DateOrderError extends InvalidDateError {
  constructor() {
    super(t("err.deathBeforeBirth"));
    this.name = "DateOrderError";
  }
}

/** The primary entry: the first marked primary, otherwise the first entry. */
export function primaryOf<T extends { primary?: boolean }>(
  entries: T[] | undefined,
): T | undefined {
  if (!entries || entries.length === 0) return undefined;
  return entries.find((entry) => entry.primary) ?? entries[0];
}

interface StoredName<K extends string> {
  value: string;
  kind: K;
  date: VariablePrecisionDate;
  primary?: boolean;
}

/**
 * Drops blank rows, validates dates, and marks exactly one entry primary: the
 * chosen row, or the first remaining row if the chosen one was dropped.
 */
function buildEntries<K extends string>(rows: NameEntryInput<K>[], label: string): StoredName<K>[] {
  const kept = rows
    .map((row) => ({ row, value: row.value.trim() }))
    .filter((item) => item.value !== "");
  const chosen = kept.findIndex((item) => item.row.primary);
  const primaryIndex = chosen === -1 ? 0 : chosen;
  return kept.map(({ row, value }, index) => ({
    value,
    kind: row.kind,
    date: dateFromInput(row.date, label) ?? UNKNOWN_DATE,
    ...(index === primaryIndex ? { primary: true } : {}),
  }));
}

function usesLists(input: PersonFormInput): boolean {
  return input.firstNames !== undefined || input.lastNames !== undefined;
}

function rowsFromInput(input: PersonFormInput): {
  first: NameEntryInput<FirstNameKind>[];
  last: NameEntryInput<LastNameKind>[];
} {
  if (usesLists(input)) return { first: input.firstNames ?? [], last: input.lastNames ?? [] };
  return {
    first: [{ ...blankNameEntry<FirstNameKind>("birth", true), value: input.firstName ?? "" }],
    last: [{ ...blankNameEntry<LastNameKind>("birth", true), value: input.lastName ?? "" }],
  };
}

function buildNames(id: PersonId, input: PersonFormInput): NamedPerson {
  const rows = rowsFromInput(input);
  const first = buildEntries(rows.first, t("date.firstName"));
  const last = buildEntries(rows.last, t("date.lastName"));
  const [firstHead, ...firstRest] = first;
  if (firstHead) return { id, firstNames: [firstHead, ...firstRest], lastNames: last };
  const [lastHead, ...lastRest] = last;
  if (lastHead) return { id, lastNames: [lastHead, ...lastRest] };
  throw new NameRequiredError();
}

function buildBorn(id: PersonId, birth: PartialDateInput): PersonBorn | undefined {
  const birthDate = dateFromInput(birth, t("date.birth"));
  return birthDate ? { id, birthDate } : undefined;
}

function buildLifeStatus(
  id: PersonId,
  status: LifeStatusChoice,
  death: PartialDateInput,
): PersonLiving | PersonDeceased | undefined {
  if (status === "living") return { id, living: true };
  if (status === "deceased") {
    return {
      id,
      living: false,
      dateOfDeath: dateFromInput(death, t("date.death")) ?? UNKNOWN_DATE,
    };
  }
  return undefined;
}

function assertDeathNotBeforeBirth(person: Person): void {
  const status = person.lifeStatus;
  if (!person.born || !status || status.living) return;
  if (isCertainlyBefore(status.dateOfDeath, person.born.birthDate)) throw new DateOrderError();
}

/** True when the names fit the single-string shorthand ("one first, one last"). */
export function canEditNames(person: Person): boolean {
  const names = person.names;
  if (!names) return true;
  return (names.firstNames?.length ?? 0) <= 1 && (names.lastNames?.length ?? 0) <= 1;
}

function rowsFromStored<K extends string>(
  entries: StoredName<K>[] | undefined,
  fallbackKind: K,
): NameEntryInput<K>[] {
  if (!entries || entries.length === 0) return [blankNameEntry(fallbackKind, true)];
  const primary = primaryOf(entries);
  return entries.map((entry) => ({
    value: entry.value,
    kind: entry.kind,
    date: inputFromDate(entry.date),
    primary: entry === primary,
  }));
}

export function inputFromPerson(person: Person): PersonFormValues {
  const status = person.lifeStatus;
  return {
    firstNames: rowsFromStored(person.names?.firstNames, "birth"),
    lastNames: rowsFromStored(person.names?.lastNames, "birth"),
    birth: inputFromDate(person.born?.birthDate),
    status: !status ? "unknown" : status.living ? "living" : "deceased",
    death: inputFromDate(status && !status.living ? status.dateOfDeath : undefined),
  };
}

/**
 * The main name, plus the birth last name when it differs from the main one
 * (a married woman: main "Marie Dubois", birth name "Martin").
 */
export function displayNameParts(person: Person): { name: string; birthName?: string } {
  const first = primaryOf(person.names?.firstNames)?.value;
  const last = primaryOf(person.names?.lastNames)?.value;
  const name = [first, last].filter(Boolean).join(" ") || t("person.unnamed");
  const birth = person.names?.lastNames?.find((n) => n.kind === "birth")?.value;
  return last && birth && birth !== last ? { name, birthName: birth } : { name };
}

/** e.g. "Marie Dubois (née Martin)"; lists and selects use this. */
export function displayName(person: Person): string {
  const { name, birthName } = displayNameParts(person);
  return birthName ? `${name} (${t("person.nee", { name: birthName })})` : name;
}

/** e.g. "b. 10 Dec 1815 · d. 27 Nov 1852", "living", or "" when nothing is known. */
export function lifeSummary(person: Person): string {
  const pieces: string[] = [];
  if (person.born) pieces.push(t("person.birthShort", { date: formatDate(person.born.birthDate) }));
  const status = person.lifeStatus;
  if (status?.living) pieces.push(t("person.living"));
  if (status && !status.living) {
    const known = status.dateOfDeath.yearKnown || status.dateOfDeath.monthKnown;
    pieces.push(
      known
        ? t("person.deathShort", { date: formatDate(status.dateOfDeath) })
        : t("person.deceased"),
    );
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
  if (born !== null) return t("person.birthShort", { date: born });
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
  // The single-string shorthand cannot express several names, so refuse it for those people.
  if (!usesLists(input) && !canEditNames(existing)) throw new NamesNotEditableError();

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
