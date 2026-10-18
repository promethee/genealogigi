import { isParentChild } from "./relationships.ts";
import { siblingsOf } from "./relatives.ts";
import type { FamilyData, PersonId } from "./types.ts";

export interface FocusStats {
  /** People per generation going up: index 0 = parents, 1 = grandparents... */
  ancestors: number[];
  /** People per generation going down: index 0 = children, 1 = grandchildren... */
  descendants: number[];
  siblings: number;
  partners: number;
}

/** Counts each distinct person once, at the nearest generation they are reached. */
function byGeneration(
  data: FamilyData,
  start: PersonId,
  next: (id: PersonId) => PersonId[],
): number[] {
  const seen = new Set<PersonId>([start]);
  const counts: number[] = [];
  let frontier = [start];
  while (frontier.length > 0) {
    const level: PersonId[] = [];
    for (const id of frontier) {
      for (const other of next(id)) {
        if (!seen.has(other)) {
          seen.add(other);
          level.push(other);
        }
      }
    }
    if (level.length > 0) counts.push(level.length);
    frontier = level;
  }
  return counts;
}

/** Numbers about one person's place in the family, derived from the stored links. */
export function focusStats(data: FamilyData, id: PersonId): FocusStats {
  const known = new Set(data.people.map((p) => p.id));
  const links = data.relationships.filter(isParentChild);
  const parentsOf = (x: PersonId) =>
    links.filter((l) => l.childId === x && known.has(l.parentId)).map((l) => l.parentId);
  const childrenOf = (x: PersonId) =>
    links.filter((l) => l.parentId === x && known.has(l.childId)).map((l) => l.childId);
  const partners = new Set<PersonId>();
  for (const r of data.relationships) {
    if (isParentChild(r)) continue;
    if (r.personAId === id && known.has(r.personBId)) partners.add(r.personBId);
    if (r.personBId === id && known.has(r.personAId)) partners.add(r.personAId);
  }
  return {
    ancestors: byGeneration(data, id, parentsOf),
    descendants: byGeneration(data, id, childrenOf),
    siblings: siblingsOf(data, id).length,
    partners: partners.size,
  };
}
