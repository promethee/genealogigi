import type { Person } from "./types.ts";

/** Lower case without accents, so "lea" finds "Léa" and "MARTIN" finds "Martin". */
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase();
}

function haystack(person: Person): string {
  const parts: string[] = [
    ...(person.names?.firstNames ?? []).map((n) => n.value),
    ...(person.names?.lastNames ?? []).map((n) => n.value),
  ];
  if (person.born?.birthPlace) parts.push(person.born.birthPlace);
  const status = person.lifeStatus;
  if (status && !status.living && status.placeOfDeath) parts.push(status.placeOfDeath);
  if (person.notes) parts.push(person.notes);
  return normalizeText(parts.join(" "));
}

/**
 * People whose names (any first or last name, whatever its kind) or birth/death place contain
 * every word of `query`. An empty query matches nobody (callers show everyone instead).
 */
export function searchPeople(people: Person[], query: string): Person[] {
  const words = normalizeText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return people.filter((person) => {
    const text = haystack(person);
    return words.every((word) => text.includes(word));
  });
}
