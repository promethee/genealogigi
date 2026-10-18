import { describe, expect, it } from "vitest";
import { addPerson, displayName, removePerson } from "./people.ts";
import { PersonNotFoundError } from "./errors.ts";
import {
  addParentChild,
  addPartners,
  describeRelationship,
  involvesPerson,
  isParentChild,
  relationshipsOf,
  RelationshipError,
  RelationshipNotFoundError,
  removeRelationship,
} from "./relationships.ts";
import { createUuidId, type FamilyData, type PersonId } from "./types.ts";

function family(...names: string[]): { data: FamilyData; ids: PersonId[] } {
  let data: FamilyData = { schemaVersion: 1, people: [], relationships: [] };
  for (const name of names) data = addPerson(data, { firstName: name, lastName: "" });
  return { data, ids: data.people.map((p) => p.id) };
}

function id(ids: PersonId[], index: number): PersonId {
  const value = ids[index];
  if (!value) throw new Error("missing id");
  return value;
}

describe("addParentChild", () => {
  it("adds a relationship with the chosen nature", () => {
    const { data, ids } = family("Ada", "Byron");
    const next = addParentChild(data, {
      parentId: id(ids, 0),
      childId: id(ids, 1),
      nature: "adoptive",
    });
    expect(next.relationships).toHaveLength(1);
    expect(next.relationships[0]).toMatchObject({
      parentId: ids[0],
      childId: ids[1],
      nature: "adoptive",
    });
    expect(data.relationships).toHaveLength(0); // input not mutated
  });

  it("rejects a person as their own parent", () => {
    const { data, ids } = family("Ada");
    expect(() =>
      addParentChild(data, { parentId: id(ids, 0), childId: id(ids, 0), nature: "adoptive" }),
    ).toThrow(/own parent/);
  });

  it("rejects duplicates regardless of nature", () => {
    const { data, ids } = family("Ada", "Byron");
    const input = { parentId: id(ids, 0), childId: id(ids, 1) };
    const once = addParentChild(data, { ...input, nature: "adoptive" });
    expect(() => addParentChild(once, { ...input, nature: "biological-confirmed" })).toThrow(
      /already exists/,
    );
  });

  it("rejects a direct cycle", () => {
    const { data, ids } = family("Ada", "Byron");
    const once = addParentChild(data, {
      parentId: id(ids, 0),
      childId: id(ids, 1),
      nature: "biological-confirmed",
    });
    expect(() =>
      addParentChild(once, { parentId: id(ids, 1), childId: id(ids, 0), nature: "adoptive" }),
    ).toThrow(/cycle/);
  });

  it("rejects a multi-generation cycle", () => {
    const { data, ids } = family("Grandma", "Mum", "Me");
    let next = addParentChild(data, {
      parentId: id(ids, 0),
      childId: id(ids, 1),
      nature: "biological-confirmed",
    });
    next = addParentChild(next, {
      parentId: id(ids, 1),
      childId: id(ids, 2),
      nature: "biological-confirmed",
    });
    expect(() =>
      addParentChild(next, { parentId: id(ids, 2), childId: id(ids, 0), nature: "adoptive" }),
    ).toThrow(RelationshipError);
  });

  it("allows two parents and siblings (no count or shape constraints)", () => {
    const { data, ids } = family("A", "B", "C");
    let next = addParentChild(data, {
      parentId: id(ids, 0),
      childId: id(ids, 2),
      nature: "adoptive",
    });
    next = addParentChild(next, { parentId: id(ids, 1), childId: id(ids, 2), nature: "adoptive" });
    expect(next.relationships).toHaveLength(2);
  });

  it("rejects unknown people", () => {
    const { data, ids } = family("Ada");
    expect(() =>
      addParentChild(data, {
        parentId: id(ids, 0),
        childId: createUuidId<"PersonId">() as PersonId,
        nature: "adoptive",
      }),
    ).toThrow(PersonNotFoundError);
  });
});

describe("addPartners", () => {
  it("adds partners of any status, including ended (with an end date)", () => {
    const { data, ids } = family("Ada", "Byron");
    const input = { personAId: id(ids, 0), personBId: id(ids, 1) };
    for (const status of ["ongoing", "ended", "unknown"] as const) {
      const next = addPartners(data, { ...input, status });
      expect(next.relationships[0]).toMatchObject({ status });
    }
    const ended = addPartners(data, { ...input, status: "ended" }).relationships[0];
    expect(ended && "endDate" in ended).toBe(true);
  });

  it("rejects the same person twice", () => {
    const { data, ids } = family("Ada");
    expect(() =>
      addPartners(data, { personAId: id(ids, 0), personBId: id(ids, 0), status: "ongoing" }),
    ).toThrow(/own partner/);
  });

  it("rejects a duplicate pair even in reverse order", () => {
    const { data, ids } = family("Ada", "Byron");
    const once = addPartners(data, {
      personAId: id(ids, 0),
      personBId: id(ids, 1),
      status: "ongoing",
    });
    expect(() =>
      addPartners(once, { personAId: id(ids, 1), personBId: id(ids, 0), status: "ongoing" }),
    ).toThrow(/already exists/);
  });

  it("allows the same pair with a different status", () => {
    const { data, ids } = family("Ada", "Byron");
    const once = addPartners(data, {
      personAId: id(ids, 0),
      personBId: id(ids, 1),
      status: "ended",
    });
    const twice = addPartners(once, {
      personAId: id(ids, 0),
      personBId: id(ids, 1),
      status: "ongoing",
    });
    expect(twice.relationships).toHaveLength(2);
  });
});

describe("removeRelationship and cascade", () => {
  it("removes a relationship by id", () => {
    const { data, ids } = family("Ada", "Byron");
    const next = addPartners(data, {
      personAId: id(ids, 0),
      personBId: id(ids, 1),
      status: "ongoing",
    });
    const relId = next.relationships[0]?.id;
    if (!relId) throw new Error("no relationship");
    expect(removeRelationship(next, relId).relationships).toHaveLength(0);
  });

  it("throws for an unknown relationship", () => {
    const { data } = family("Ada");
    expect(() => removeRelationship(data, createUuidId<"RelationshipId">())).toThrow(
      RelationshipNotFoundError,
    );
  });

  it("removing a person removes their relationships and keeps the others", () => {
    const { data, ids } = family("A", "B", "C");
    let next = addParentChild(data, {
      parentId: id(ids, 0),
      childId: id(ids, 1),
      nature: "adoptive",
    });
    next = addPartners(next, { personAId: id(ids, 1), personBId: id(ids, 2), status: "ongoing" });
    next = addPartners(next, { personAId: id(ids, 0), personBId: id(ids, 2), status: "ongoing" });
    expect(relationshipsOf(next, id(ids, 0))).toHaveLength(2);

    const after = removePerson(next, id(ids, 0));
    expect(after.relationships).toHaveLength(1);
    expect(after.relationships.every((r) => !involvesPerson(r, id(ids, 0)))).toBe(true);
  });
});

describe("describeRelationship", () => {
  it("reads naturally for both kinds", () => {
    const { data, ids } = family("Ada", "Byron");
    const nameOf = (pid: PersonId) =>
      displayName(data.people.find((p) => p.id === pid) ?? { id: pid });
    const pc = addParentChild(data, {
      parentId: id(ids, 0),
      childId: id(ids, 1),
      nature: "biological-confirmed",
    }).relationships[0];
    const partners = addPartners(data, {
      personAId: id(ids, 0),
      personBId: id(ids, 1),
      status: "ongoing",
    }).relationships[0];
    if (!pc || !partners) throw new Error("missing");
    expect(isParentChild(pc)).toBe(true);
    expect(describeRelationship(pc, nameOf)).toBe("Ada is parent of Byron (biological, confirmed)");
    expect(describeRelationship(partners, nameOf)).toBe("Ada and Byron are partners (ongoing)");
  });
});
