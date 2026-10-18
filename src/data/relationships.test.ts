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
  updateRelationship,
  editValuesOf,
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

const blank = { year: "", month: "", day: "" };
const year = (y: string) => ({ ...blank, year: y });

describe("addParentChild (temporary natures)", () => {
  const base = (ids: PersonId[]) => ({ parentId: id(ids, 0), childId: id(ids, 1) });

  it("adds an ongoing foster link with a start date", () => {
    const { data, ids } = family("Ada", "Byron");
    const next = addParentChild(data, {
      ...base(ids),
      nature: "foster",
      status: "ongoing",
      start: year("1990"),
      end: blank,
    });
    expect(next.relationships[0]).toMatchObject({ nature: "foster", status: "ongoing" });
    const text = describeRelationship(next.relationships[0]!, (p) =>
      displayName(next.people.find((x) => x.id === p)!),
    );
    expect(text).toBe("Ada is parent of Byron (foster, from 1990)");
  });

  it("adds an ended step link with a period", () => {
    const { data, ids } = family("Ada", "Byron");
    const next = addParentChild(data, {
      ...base(ids),
      nature: "step",
      status: "ended",
      start: year("1990"),
      end: year("1995"),
    });
    const text = describeRelationship(next.relationships[0]!, () => "X");
    expect(text).toBe("X is parent of X (step, 1990–1995)");
  });

  it("stores unknown dates when left blank", () => {
    const { data, ids } = family("Ada", "Byron");
    const next = addParentChild(data, {
      ...base(ids),
      nature: "guardian",
      status: "ended",
      start: blank,
      end: blank,
    });
    const r = next.relationships[0];
    expect(r).toMatchObject({ startDate: { yearKnown: false }, endDate: { yearKnown: false } });
    expect(describeRelationship(r!, () => "X")).toContain("(guardian, ended)");
  });

  it("rejects an end before the start and invalid dates", () => {
    const { data, ids } = family("Ada", "Byron");
    const input = { ...base(ids), nature: "step" as const, status: "ended" as const };
    expect(() =>
      addParentChild(data, { ...input, start: year("1995"), end: year("1990") }),
    ).toThrow("end date cannot be before");
    expect(() =>
      addParentChild(data, { ...input, start: { year: "", month: "4", day: "31" }, end: blank }),
    ).toThrow("Start date");
  });

  it("allows the same end and start year", () => {
    const { data, ids } = family("Ada", "Byron");
    const input = { ...base(ids), nature: "step" as const, status: "ended" as const };
    expect(() =>
      addParentChild(data, { ...input, start: year("1990"), end: year("1990") }),
    ).not.toThrow();
  });

  it("rejects the same temporary nature twice but allows another nature or a permanent link", () => {
    const { data, ids } = family("Ada", "Byron");
    const foster = {
      ...base(ids),
      nature: "foster" as const,
      status: "ongoing" as const,
      start: blank,
      end: blank,
    };
    const once = addParentChild(data, foster);
    expect(() => addParentChild(once, foster)).toThrow(RelationshipError);
    const twice = addParentChild(once, { ...foster, nature: "step" });
    const thrice = addParentChild(twice, { ...base(ids), nature: "biological-confirmed" });
    expect(thrice.relationships).toHaveLength(3);
  });

  it("still applies cycle and self-link rules", () => {
    const { data, ids } = family("Ada", "Byron");
    const step = { nature: "step" as const, status: "ongoing" as const, start: blank, end: blank };
    expect(() =>
      addParentChild(data, { parentId: id(ids, 0), childId: id(ids, 0), ...step }),
    ).toThrow(RelationshipError);
    const once = addParentChild(data, { ...base(ids), ...step });
    expect(() =>
      addParentChild(once, { parentId: id(ids, 1), childId: id(ids, 0), ...step }),
    ).toThrow("cycle");
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

describe("partner dates", () => {
  it("stores and describes a period", () => {
    const { data, ids } = family("Ada", "Byron");
    const next = addPartners(data, {
      personAId: id(ids, 0),
      personBId: id(ids, 1),
      status: "ended",
      start: year("1990"),
      end: year("1995"),
    });
    expect(describeRelationship(next.relationships[0]!, () => "X")).toBe(
      "X and X are partners (ended, 1990–1995)",
    );
    const ongoing = addPartners(data, {
      personAId: id(ids, 0),
      personBId: id(ids, 1),
      status: "ongoing",
      start: year("1990"),
    });
    expect(describeRelationship(ongoing.relationships[0]!, () => "X")).toContain(
      "(ongoing, from 1990)",
    );
  });

  it("rejects end before start and bad dates", () => {
    const { data, ids } = family("Ada", "Byron");
    const input = { personAId: id(ids, 0), personBId: id(ids, 1), status: "ended" as const };
    expect(() => addPartners(data, { ...input, start: year("1995"), end: year("1990") })).toThrow(
      "end date cannot be before",
    );
    expect(() => addPartners(data, { ...input, start: year("abc") })).toThrow("Start date");
  });
});

describe("updateRelationship", () => {
  const foster = (ids: PersonId[]) => ({
    parentId: id(ids, 0),
    childId: id(ids, 1),
    nature: "foster" as const,
    status: "ongoing" as const,
    start: year("2000"),
    end: blank,
  });

  it("changes a permanent link into a temporary one, keeping id and position", () => {
    const { data, ids } = family("Ada", "Byron", "Cleo");
    let d = addParentChild(data, { parentId: id(ids, 0), childId: id(ids, 1), nature: "adoptive" });
    d = addPartners(d, { personAId: id(ids, 1), personBId: id(ids, 2), status: "ongoing" });
    const original = d.relationships[0]!;
    const next = updateRelationship(d, original.id, foster(ids));
    expect(next.relationships[0]).toMatchObject({
      id: original.id,
      nature: "foster",
      status: "ongoing",
    });
    expect(next.relationships[1]).toEqual(d.relationships[1]);
  });

  it("changes a temporary link back to permanent, dropping dates", () => {
    const { data, ids } = family("Ada", "Byron");
    const d = addParentChild(data, foster(ids));
    const next = updateRelationship(d, d.relationships[0]!.id, {
      parentId: id(ids, 0),
      childId: id(ids, 1),
      nature: "biological-confirmed",
    });
    expect(next.relationships[0]).toEqual({
      id: d.relationships[0]!.id,
      parentId: id(ids, 0),
      childId: id(ids, 1),
      nature: "biological-confirmed",
    });
  });

  it("updates partner status and dates", () => {
    const { data, ids } = family("Ada", "Byron");
    const d = addPartners(data, {
      personAId: id(ids, 0),
      personBId: id(ids, 1),
      status: "ongoing",
    });
    const next = updateRelationship(d, d.relationships[0]!.id, {
      personAId: id(ids, 0),
      personBId: id(ids, 1),
      status: "ended",
      start: year("1990"),
      end: year("1995"),
    });
    expect(describeRelationship(next.relationships[0]!, () => "X")).toContain("(ended, 1990–1995)");
  });

  it("ignores itself when checking duplicates but rejects a collision", () => {
    const { data, ids } = family("Ada", "Byron");
    let d = addParentChild(data, foster(ids));
    d = addParentChild(d, { ...foster(ids), nature: "step" });
    const [fosterLink, stepLink] = d.relationships;
    expect(() =>
      updateRelationship(d, fosterLink!.id, { ...foster(ids), start: year("2001") }),
    ).not.toThrow();
    expect(() => updateRelationship(d, stepLink!.id, foster(ids))).toThrow("already exists");
  });

  it("rejects invalid dates, changed people, type switches and unknown ids", () => {
    const { data, ids } = family("Ada", "Byron", "Cleo");
    const d = addParentChild(data, foster(ids));
    const rid = d.relationships[0]!.id;
    expect(() =>
      updateRelationship(d, rid, {
        ...foster(ids),
        status: "ended",
        start: year("1995"),
        end: year("1990"),
      }),
    ).toThrow("end date cannot be before");
    expect(() => updateRelationship(d, rid, { ...foster(ids), childId: id(ids, 2) })).toThrow(
      "cannot be changed",
    );
    expect(() =>
      updateRelationship(d, rid, {
        personAId: id(ids, 0),
        personBId: id(ids, 1),
        status: "ongoing",
      }),
    ).toThrow("cannot change between");
    expect(() => updateRelationship(d, createUuidId<"RelationshipId">(), foster(ids))).toThrow(
      RelationshipNotFoundError,
    );
  });
});

describe("editValuesOf", () => {
  it("prefills dates from a saved link", () => {
    const { data, ids } = family("Ada", "Byron");
    const d = addParentChild(data, {
      parentId: id(ids, 0),
      childId: id(ids, 1),
      nature: "step",
      status: "ended",
      start: year("1990"),
      end: year("1995"),
    });
    expect(editValuesOf(d.relationships[0]!)).toMatchObject({
      nature: "step",
      status: "ended",
      start: { year: "1990" },
      end: { year: "1995" },
    });
  });
});
