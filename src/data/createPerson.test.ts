import { describe, expect, it } from "vitest";
import { addPersonWithParents } from "./createPerson.ts";
import { addPerson } from "./people.ts";
import { isParentChild } from "./relationships.ts";
import type { FamilyData, PersonId } from "./types.ts";

function family(...names: string[]): { data: FamilyData; ids: PersonId[] } {
  let data: FamilyData = { schemaVersion: 1, people: [], relationships: [] };
  for (const name of names) data = addPerson(data, { firstName: name, lastName: "" });
  return { data, ids: data.people.map((p) => p.id) };
}

const child = { firstName: "Byron", lastName: "" };

describe("addPersonWithParents", () => {
  it("adds a person without parents exactly like addPerson", () => {
    const { data } = family("Ada");
    expect(addPersonWithParents(data, child).people).toHaveLength(2);
    expect(
      addPersonWithParents(data, child, { parentIds: [], nature: "adoptive" }).relationships,
    ).toEqual([]);
  });

  it("creates the person and two parent links together", () => {
    const { data, ids } = family("Ada", "Cleo");
    const next = addPersonWithParents(data, child, {
      parentIds: [ids[0]!, ids[1]!],
      nature: "biological-confirmed",
    });
    const created = next.people[2]!;
    expect(next.people).toHaveLength(3);
    expect(next.relationships).toHaveLength(2);
    expect(next.relationships.every((r) => isParentChild(r) && r.childId === created.id)).toBe(
      true,
    );
  });

  it("creates one link for one parent, with the chosen nature", () => {
    const { data, ids } = family("Ada");
    const next = addPersonWithParents(data, child, { parentIds: [ids[0]!], nature: "adoptive" });
    expect(next.relationships).toHaveLength(1);
    expect(next.relationships[0]).toMatchObject({ nature: "adoptive", parentId: ids[0] });
  });

  it("uses the second field alone just as well", () => {
    const { data, ids } = family("Ada");
    const next = addPersonWithParents(data, child, {
      parentIds: [ids[0]!],
      nature: "biological-presumed",
    });
    expect(next.relationships).toHaveLength(1);
  });

  it("optionally records the couple as partners", () => {
    const { data, ids } = family("Ada", "Cleo");
    const next = addPersonWithParents(data, child, {
      parentIds: [ids[0]!, ids[1]!],
      nature: "biological-confirmed",
      recordPartners: true,
    });
    expect(next.relationships).toHaveLength(3);
    expect(next.relationships[2]).toMatchObject({ status: "unknown" });
  });

  it("refuses the same parent twice and leaves the data untouched", () => {
    const { data, ids } = family("Ada");
    expect(() =>
      addPersonWithParents(data, child, { parentIds: [ids[0]!, ids[0]!], nature: "adoptive" }),
    ).toThrow("must be different people");
    expect(data.people).toHaveLength(1);
  });

  it("refuses an unknown parent", () => {
    const { data } = family("Ada");
    expect(() =>
      addPersonWithParents(data, child, {
        parentIds: ["11111111-1111-4111-8111-111111111111" as PersonId],
        nature: "adoptive",
      }),
    ).toThrow("Person not found");
  });

  it("fails as a whole when the person's own data is invalid", () => {
    const { data, ids } = family("Ada");
    const nextYear = String(new Date().getFullYear() + 1);
    expect(() =>
      addPersonWithParents(
        data,
        { ...child, birth: { year: nextYear, month: "", day: "" } },
        { parentIds: [ids[0]!], nature: "adoptive" },
      ),
    ).toThrow("cannot be in the future");
  });
});
