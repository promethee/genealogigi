import { avatarColors, initialsOf } from "./avatar.ts";
import { formatDate } from "./dates.ts";
import { displayName, lifeSummary } from "./people.ts";
import { natureLabel } from "./relationships.ts";
import { relativesOf } from "./relatives.ts";
import { timelineOf } from "./timeline.ts";
import type { FamilyData, PersonId } from "./types.ts";
import { t, tn } from "../i18n/index.ts";

/** Everything the standalone page needs, already translated and formatted: the page does no logic. */

export interface ShareRelative {
  id: PersonId;
  name: string;
  /** e.g. "adoptive" or "half-sibling"; empty for the usual case. */
  note: string;
}

export interface ShareGroup {
  label: string;
  items: ShareRelative[];
}

export interface ShareTimelineEntry {
  when: string;
  text: string;
  people: ShareRelative[];
}

export interface SharePerson {
  id: PersonId;
  name: string;
  initials: string;
  tint: string;
  ink: string;
  life: string;
  notes: string;
  photos: { src: string; caption: string }[];
  groups: ShareGroup[];
  timeline: ShareTimelineEntry[];
}

export interface ShareModel {
  title: string;
  lang: string;
  generated: string;
  labels: {
    search: string;
    none: string;
    people: string;
    notes: string;
    timeline: string;
    back: string;
    footer: string;
    count: string;
  };
  people: SharePerson[];
}

/** A page is only worth sharing when there are at least two people and one link between them. */
export function canShareFamily(data: FamilyData): boolean {
  return data.people.length >= 2 && data.relationships.length >= 1;
}

export function buildShareModel(
  data: FamilyData,
  options: { title: string; lang: string; today: Date },
): ShareModel {
  const byId = new Map(data.people.map((p) => [p.id, p]));
  const nameOf = (id: PersonId): string => {
    const person = byId.get(id);
    return person ? displayName(person) : t("rel.unknownPerson");
  };
  const rel = (id: PersonId, note = ""): ShareRelative => ({ id, name: nameOf(id), note });

  const people: SharePerson[] = data.people.map((person) => {
    const relatives = relativesOf(data, person.id);
    const groups: ShareGroup[] = [
      {
        label: t("detail.parents"),
        items: relatives.parents.map((p) =>
          rel(p.personId, p.nature === "biological-confirmed" ? "" : natureLabel(p.nature)),
        ),
      },
      { label: t("detail.partners"), items: relatives.partners.map((p) => rel(p.personId)) },
      {
        label: t("detail.children"),
        items: relatives.children.map((c) =>
          rel(c.personId, c.nature === "biological-confirmed" ? "" : natureLabel(c.nature)),
        ),
      },
      {
        label: tn("detail.siblings", relatives.siblings.length),
        items: relatives.siblings.map((s) =>
          rel(s.personId, s.half ? t("detail.halfSibling") : ""),
        ),
      },
    ].filter((g) => g.items.length > 0);

    const colors = avatarColors(person);
    return {
      id: person.id,
      name: displayName(person),
      initials: initialsOf(person),
      tint: colors.tint,
      ink: colors.ink,
      life: lifeSummary(person),
      notes: person.notes ?? "",
      photos: (person.photos ?? []).map((p) => ({ src: p.dataUrl, caption: p.caption ?? "" })),
      groups,
      timeline: timelineOf(data, person.id).map((entry) => ({
        when:
          entry.date && (entry.date.yearKnown || entry.date.monthKnown || entry.date.dayKnown)
            ? formatDate(entry.date)
            : t("timeline.dateUnknown"),
        text: entry.text,
        people: entry.people.map((id) => rel(id)),
      })),
    };
  });

  return {
    title: options.title,
    lang: options.lang,
    generated: options.today.toISOString().slice(0, 10),
    labels: {
      search: t("search.placeholder"),
      none: t("search.none"),
      people: t("tab.people"),
      notes: t("detail.notes"),
      timeline: t("timeline.title"),
      back: t("share.back"),
      footer: t("share.footer"),
      count: tn("summary.people", data.people.length),
    },
    people,
  };
}
