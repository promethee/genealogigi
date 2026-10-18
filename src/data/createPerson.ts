import { addPerson, type PersonFormInput } from "./people.ts";
import { addParentChild, addParentsOfChild, type ParentChildNature } from "./relationships.ts";
import type { FamilyData, PersonId } from "./types.ts";

/** Parents chosen while creating a person: none, one or two existing people. */
export interface NewPersonParents {
  parentIds: PersonId[];
  nature: ParentChildNature;
  /** With two parents: also record them as partners (status unknown) unless they already are. */
  recordPartners?: boolean;
}

/**
 * Adds a person and, optionally, their parent links, or nothing at all: every step works on
 * immutable data, so a failure in any of them (the person's own data, a duplicate, a cycle)
 * discards the rest.
 */
export function addPersonWithParents(
  data: FamilyData,
  input: PersonFormInput,
  parents?: NewPersonParents,
): FamilyData {
  const withPerson = addPerson(data, input);
  const ids = parents?.parentIds ?? [];
  if (!parents || ids.length === 0) return withPerson;
  const child = withPerson.people[withPerson.people.length - 1];
  if (!child) return withPerson;
  const [first, second] = ids;
  if (first && second) {
    return addParentsOfChild(withPerson, {
      parentAId: first,
      parentBId: second,
      childId: child.id,
      nature: parents.nature,
      recordPartners: parents.recordPartners,
    });
  }
  return addParentChild(withPerson, {
    parentId: first as PersonId,
    childId: child.id,
    nature: parents.nature,
  });
}
