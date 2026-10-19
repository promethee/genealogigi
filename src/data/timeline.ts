import { toDisplayName } from "./nameCase.ts";
import { t, type MessageKey } from "../i18n/index.ts";
import { eventsOf } from "./events.ts";
import { displayName } from "./people.ts";
import { isParentChild, natureLabel } from "./relationships.ts";
import type {
  EventId,
  FamilyData,
  PersonId,
  RelationshipFamilialTemporary,
  VariablePrecisionDate,
} from "./types.ts";

export type TimelineKind = "birth" | "name" | "partnership" | "child" | "link" | "event" | "death";

export interface TimelineEntry {
  /** Stable per entry, for rendering. */
  key: string;
  kind: TimelineKind;
  /** Null when the entry has no usable date. */
  date: VariablePrecisionDate | null;
  /** What happened, already translated (the active language when the timeline was built). */
  text: string;
  /** Other people involved; each is a link to their card. */
  people: PersonId[];
  /** Set for user events, which can be edited and deleted. */
  eventId?: EventId;
}

const known = (d: VariablePrecisionDate | undefined): d is VariablePrecisionDate =>
  d !== undefined && (d.yearKnown || d.monthKnown || d.dayKnown);

/** Ties on the same date: birth first, death last. */
const RANK: Record<TimelineKind, number> = {
  birth: 0,
  name: 1,
  partnership: 1,
  child: 1,
  link: 1,
  event: 1,
  death: 2,
};

function sortValue(entry: TimelineEntry): [number, string, number] {
  const dated = entry.date !== null && entry.date.yearKnown;
  return [dated ? 0 : 1, dated ? (entry.date as VariablePrecisionDate).raw : "", RANK[entry.kind]];
}

/**
 * The person's life as a sequence, derived from what is recorded (birth, death, dated names,
 * partnerships, children's births, fixed-period parent links) plus the events they are part of.
 * Dated entries come first in date order, then undated ones (birth first, death last).
 */
export function timelineOf(data: FamilyData, personId: PersonId): TimelineEntry[] {
  const person = data.people.find((p) => p.id === personId);
  if (!person) return [];
  const known_ = new Set(data.people.map((p) => p.id));
  const nameOf = (id: PersonId) => {
    const other = data.people.find((p) => p.id === id);
    return other ? displayName(other) : t("rel.unknownPerson");
  };
  const entries: TimelineEntry[] = [];
  const push = (e: Omit<TimelineEntry, "key">) =>
    entries.push({ ...e, key: `${e.kind}:${entries.length}` });

  const born = person.born;
  if (born && (known(born.birthDate) || born.birthPlace)) {
    push({
      kind: "birth",
      date: known(born.birthDate) ? born.birthDate : null,
      text: born.birthPlace ? t("timeline.bornIn", { place: born.birthPlace }) : t("timeline.born"),
      people: [],
    });
  }

  for (const list of [person.names?.firstNames, person.names?.lastNames]) {
    for (const entry of list ?? []) {
      if (entry.kind === "birth") continue;
      push({
        kind: "name",
        date: known(entry.date) ? entry.date : null,
        text: t("timeline.name", {
          value: toDisplayName(entry.value),
          kind: t(`kind.${entry.kind}` as MessageKey).toLowerCase(),
        }),
        people: [],
      });
    }
  }

  for (const r of data.relationships) {
    if (!isParentChild(r)) {
      if (r.personAId !== personId && r.personBId !== personId) continue;
      const other = r.personAId === personId ? r.personBId : r.personAId;
      if (!known_.has(other)) continue;
      if (known(r.startDate)) {
        push({
          kind: "partnership",
          date: r.startDate,
          text: t("timeline.partnerStart", { name: nameOf(other) }),
          people: [other],
        });
      }
      if (r.status === "ended" && known(r.endDate)) {
        push({
          kind: "partnership",
          date: r.endDate,
          text: t("timeline.partnerEnd", { name: nameOf(other) }),
          people: [other],
        });
      }
      continue;
    }
    if (r.parentId !== personId && r.childId !== personId) continue;
    const other = r.parentId === personId ? r.childId : r.parentId;
    if (!known_.has(other)) continue;
    if (r.parentId === personId) {
      const childBorn = data.people.find((p) => p.id === other)?.born?.birthDate;
      if (known(childBorn)) {
        push({
          kind: "child",
          date: childBorn,
          text: t("timeline.childBorn", { name: nameOf(other) }),
          // "with" names the child's other parent(s), never the child (who is in the text).
          people: data.relationships
            .filter(isParentChild)
            .filter((link) => link.childId === other && link.parentId !== personId)
            .map((link) => link.parentId)
            .filter((id, i, all) => known_.has(id) && all.indexOf(id) === i),
        });
      }
    }
    if ("startDate" in r) {
      const link = r as RelationshipFamilialTemporary;
      const nature = natureLabel(link.nature);
      if (known(link.startDate)) {
        push({
          kind: "link",
          date: link.startDate,
          text: t("timeline.linkStart", { nature, name: nameOf(other) }),
          people: [other],
        });
      }
      if (link.status === "ended" && known(link.endDate)) {
        push({
          kind: "link",
          date: link.endDate,
          text: t("timeline.linkEnd", { nature, name: nameOf(other) }),
          people: [other],
        });
      }
    }
  }

  for (const event of eventsOf(data, personId)) {
    const label = t(`event.kind.${event.kind}` as MessageKey);
    const what = event.description
      ? event.kind === "other"
        ? event.description
        : `${label}: ${event.description}`
      : label;
    push({
      kind: "event",
      date: known(event.date) ? event.date : null,
      text: event.place ? t("timeline.eventIn", { what, place: event.place }) : what,
      people: event.personIds.filter((p) => p !== personId && known_.has(p)),
      eventId: event.id,
    });
  }

  const status = person.lifeStatus;
  if (status && !status.living) {
    push({
      kind: "death",
      date: known(status.dateOfDeath) ? status.dateOfDeath : null,
      text: status.placeOfDeath
        ? t("timeline.diedIn", { place: status.placeOfDeath })
        : t("timeline.died"),
      people: [],
    });
  }

  // Stable sort: dated entries by date, undated after; ties keep birth first and death last.
  return entries
    .map((entry, index) => ({ entry, index, sort: sortValue(entry) }))
    .sort(
      (a, b) =>
        a.sort[0] - b.sort[0] ||
        a.sort[1].localeCompare(b.sort[1]) ||
        a.sort[2] - b.sort[2] ||
        a.index - b.index,
    )
    .map(({ entry }) => entry);
}
