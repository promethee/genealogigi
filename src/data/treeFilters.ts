import { normalizeText } from "./search.ts";
import type { Person } from "./types.ts";

export type StatusFilter = "any" | "living" | "deceased";

export interface TreeFilters {
  status: StatusFilter;
  birthPlace: string;
  deathPlace: string;
  /** 1..12, or 0 for any. */
  birthMonth: number;
  deathMonth: number;
  lastName: string;
}

export const NO_FILTERS: TreeFilters = {
  status: "any",
  birthPlace: "",
  deathPlace: "",
  birthMonth: 0,
  deathMonth: 0,
  lastName: "",
};

/** Number of filters that are switched on. */
export function activeFilterCount(f: TreeFilters): number {
  return [
    f.status !== "any",
    f.birthPlace !== "",
    f.deathPlace !== "",
    f.birthMonth !== 0,
    f.deathMonth !== 0,
    f.lastName !== "",
  ].filter(Boolean).length;
}

/** The month (1..12) of a date, only when the month is actually known. */
function monthOf(date: { raw: string; monthKnown: boolean } | undefined): number | null {
  if (!date?.monthKnown) return null;
  const month = Number(date.raw.slice(5, 7));
  return month >= 1 && month <= 12 ? month : null;
}

const same = (a: string | undefined, b: string): boolean =>
  a !== undefined && normalizeText(a.trim()) === normalizeText(b.trim());

/** True when the person satisfies every active filter; no active filter matches everyone. */
export function matchesFilters(person: Person, f: TreeFilters): boolean {
  const status = person.lifeStatus;
  if (f.status === "living" && status?.living !== true) return false;
  if (f.status === "deceased" && status?.living !== false) return false;
  if (f.birthPlace && !same(person.born?.birthPlace, f.birthPlace)) return false;
  if (f.deathPlace && !(status?.living === false && same(status.placeOfDeath, f.deathPlace))) {
    return false;
  }
  if (f.birthMonth && monthOf(person.born?.birthDate) !== f.birthMonth) return false;
  if (f.deathMonth) {
    const died = status?.living === false ? monthOf(status.dateOfDeath) : null;
    if (died !== f.deathMonth) return false;
  }
  if (f.lastName && !(person.names?.lastNames ?? []).some((n) => same(n.value, f.lastName))) {
    return false;
  }
  return true;
}

/** Distinct birth places and death places already saved, for the filter choices. */
export function filterPlaces(people: Person[]): { birth: string[]; death: string[] } {
  const distinct = (values: (string | undefined)[]) => {
    const seen = new Map<string, string>();
    for (const v of values) {
      const value = v?.trim();
      if (value && !seen.has(normalizeText(value))) seen.set(normalizeText(value), value);
    }
    return [...seen.values()].sort((a, b) => a.localeCompare(b));
  };
  return {
    birth: distinct(people.map((p) => p.born?.birthPlace)),
    death: distinct(
      people.map((p) => (p.lifeStatus?.living === false ? p.lifeStatus.placeOfDeath : undefined)),
    ),
  };
}
