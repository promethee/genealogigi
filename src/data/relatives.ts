import { isParentChild } from "./relationships.ts";
import type { FamilyData, PersonId, RelationshipFamilial, RelationshipSocial } from "./types.ts";

/** Everything below is derived from the stored relationships; nothing is stored twice. */

export interface ParentLink {
  personId: PersonId;
  nature: RelationshipFamilial["nature"];
  link: RelationshipFamilial;
}

export interface PartnerLink {
  personId: PersonId;
  link: RelationshipSocial;
}

export interface Sibling {
  personId: PersonId;
  /** True when they do not share all their known parents. */
  half: boolean;
  /** The parents they have in common. */
  sharedParents: PersonId[];
}

export interface Relatives {
  parents: ParentLink[];
  children: ParentLink[];
  partners: PartnerLink[];
  siblings: Sibling[];
}

function parentLinksOf(data: FamilyData, id: PersonId): RelationshipFamilial[] {
  return data.relationships.filter(
    (r): r is RelationshipFamilial => isParentChild(r) && r.childId === id,
  );
}

/** Links that point at people still in the file; hand-edited files can leave strays. */
function known(data: FamilyData): Set<PersonId> {
  return new Set(data.people.map((p) => p.id));
}

export function siblingsOf(data: FamilyData, id: PersonId): Sibling[] {
  const people = known(data);
  const mine = new Set(
    parentLinksOf(data, id)
      .map((r) => r.parentId)
      .filter((p) => people.has(p)),
  );
  if (mine.size === 0) return [];
  const result = new Map<PersonId, Set<PersonId>>();
  for (const r of data.relationships) {
    if (!isParentChild(r) || !mine.has(r.parentId) || r.childId === id) continue;
    if (!people.has(r.childId)) continue;
    const shared = result.get(r.childId) ?? new Set<PersonId>();
    shared.add(r.parentId);
    result.set(r.childId, shared);
  }
  return data.people
    .filter((p) => result.has(p.id))
    .map((p) => {
      const theirs = new Set(
        parentLinksOf(data, p.id)
          .map((r) => r.parentId)
          .filter((x) => people.has(x)),
      );
      const sharedParents = [...(result.get(p.id) as Set<PersonId>)];
      const full = theirs.size === mine.size && sharedParents.length === mine.size;
      return { personId: p.id, half: !full, sharedParents };
    });
}

export function relativesOf(data: FamilyData, id: PersonId): Relatives {
  const people = known(data);
  const parents: ParentLink[] = [];
  const children: ParentLink[] = [];
  const partners: PartnerLink[] = [];
  for (const r of data.relationships) {
    if (isParentChild(r)) {
      if (r.childId === id && people.has(r.parentId)) {
        parents.push({ personId: r.parentId, nature: r.nature, link: r });
      } else if (r.parentId === id && people.has(r.childId)) {
        children.push({ personId: r.childId, nature: r.nature, link: r });
      }
    } else if (r.personAId === id && people.has(r.personBId)) {
      partners.push({ personId: r.personBId, link: r });
    } else if (r.personBId === id && people.has(r.personAId)) {
      partners.push({ personId: r.personAId, link: r });
    }
  }
  return { parents, children, partners, siblings: siblingsOf(data, id) };
}
