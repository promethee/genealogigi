import { dateFromInput, isInFuture, UNKNOWN_DATE, type PartialDateInput } from "./dates.ts";
import { InvalidDateError } from "./dates.ts";
import { PersonNotFoundError } from "./errors.ts";
import { t } from "../i18n/index.ts";
import {
  createUuidId,
  type EventId,
  type EventKind,
  type FamilyData,
  type FamilyEvent,
  type PersonId,
} from "./types.ts";

export const EVENT_KINDS: readonly EventKind[] = [
  "marriage",
  "divorce",
  "baptism",
  "residence",
  "occupation",
  "education",
  "military",
  "emigration",
  "immigration",
  "other",
];

export class EventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EventError";
  }
}

export class EventNotFoundError extends Error {
  constructor(id: EventId) {
    super(t("err.eventNotFound", { id }));
    this.name = "EventNotFoundError";
  }
}

export interface EventInput {
  kind: EventKind;
  /** Any part may be blank; all blank means unknown. */
  date: PartialDateInput;
  place?: string;
  description?: string;
  /** Everyone involved, the person whose card it is included. */
  personIds: PersonId[];
}

export function eventsOf(data: FamilyData, id: PersonId): FamilyEvent[] {
  return (data.events ?? []).filter((e) => e.personIds.includes(id));
}

function buildEvent(data: FamilyData, input: EventInput, id: EventId): FamilyEvent {
  const [first, ...rest] = input.personIds;
  if (!first) throw new EventError(t("err.eventNoPerson"));
  const people = [first, ...rest];
  if (new Set(people).size !== people.length) throw new EventError(t("err.eventDuplicatePerson"));
  for (const person of people) {
    if (!data.people.some((p) => p.id === person)) throw new PersonNotFoundError(person);
  }
  const description = (input.description ?? "").trim();
  if (input.kind === "other" && description === "") {
    throw new EventError(t("err.eventNeedsDescription"));
  }
  const date = dateFromInput(input.date, t("date.event")) ?? UNKNOWN_DATE;
  if (isInFuture(date)) throw new InvalidDateError(t("err.dateFuture", { label: t("date.event") }));
  const place = (input.place ?? "").trim();
  return {
    id,
    kind: input.kind,
    date,
    ...(place ? { place } : {}),
    ...(description ? { description } : {}),
    personIds: [first, ...rest],
  };
}

export function addEvent(data: FamilyData, input: EventInput): FamilyData {
  const event = buildEvent(data, input, createUuidId<"EventId">());
  return { ...data, events: [...(data.events ?? []), event] };
}

export function updateEvent(data: FamilyData, id: EventId, input: EventInput): FamilyData {
  const existing = (data.events ?? []).find((e) => e.id === id);
  if (!existing) throw new EventNotFoundError(id);
  const event = buildEvent(data, input, id);
  return { ...data, events: (data.events ?? []).map((e) => (e.id === id ? event : e)) };
}

export function removeEvent(data: FamilyData, id: EventId): FamilyData {
  if (!(data.events ?? []).some((e) => e.id === id)) throw new EventNotFoundError(id);
  return { ...data, events: (data.events ?? []).filter((e) => e.id !== id) };
}

/** Takes a deleted person out of every event; an event left with nobody is deleted. */
export function withoutPerson(events: FamilyEvent[], id: PersonId): FamilyEvent[] {
  return events.flatMap((event) => {
    const rest = event.personIds.filter((p) => p !== id);
    const [first, ...others] = rest;
    return first ? [{ ...event, personIds: [first, ...others] as FamilyEvent["personIds"] }] : [];
  });
}
