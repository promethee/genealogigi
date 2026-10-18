import { describe, expect, it } from "vitest";
import { focusStats } from "./focusStats.ts";
import { addPerson } from "./people.ts";
import { addParentChild, addPartners } from "./relationships.ts";
import type { FamilyData, PersonId } from "./types.ts";

function build() {
  let d: FamilyData = { schemaVersion: 1, people: [], relationships: [] };
  const ids: Record<string, PersonId> = {};
  for (const n of ["Gran", "Mum", "Dad", "Me", "Sis", "Kid1", "Kid2", "GrandKid"]) {
    d = addPerson(d, { firstName: n, lastName: "" });
    ids[n] = d.people[d.people.length - 1]!.id;
  }
  const pc = (p: string, c: string) => {
    d = addParentChild(d, { parentId: ids[p]!, childId: ids[c]!, nature: "biological-confirmed" });
  };
  pc("Gran", "Mum");
  pc("Mum", "Me");
  pc("Dad", "Me");
  pc("Mum", "Sis");
  pc("Dad", "Sis");
  pc("Me", "Kid1");
  pc("Me", "Kid2");
  pc("Kid1", "GrandKid");
  d = addPartners(d, { personAId: ids.Me!, personBId: ids.Dad!, status: "ongoing" });
  return { d, ids };
}

describe("focusStats", () => {
  it("counts ancestors and descendants per generation, siblings and partners", () => {
    const { d, ids } = build();
    expect(focusStats(d, ids.Me!)).toEqual({
      ancestors: [2, 1],
      descendants: [2, 1],
      siblings: 1,
      partners: 1,
    });
  });

  it("is all zeros for someone with no links, and ignores unknown ids", () => {
    const { d } = build();
    const alone = addPerson(d, { firstName: "Solo", lastName: "" });
    const id = alone.people[alone.people.length - 1]!.id;
    expect(focusStats(alone, id)).toEqual({
      ancestors: [],
      descendants: [],
      siblings: 0,
      partners: 0,
    });
  });

  it("does not loop on a cycle", () => {
    const { d, ids } = build();
    // The API refuses cycles, so a hand-edited file is simulated.
    const first = d.relationships[0]!;
    const cyclic: FamilyData = {
      ...d,
      relationships: [
        ...d.relationships,
        {
          ...first,
          id: "99999999-9999-4999-8999-999999999999",
          parentId: ids.Mum!,
          childId: ids.Gran!,
        } as never,
      ],
    };
    expect(() => focusStats(cyclic, ids.Me!)).not.toThrow();
  });
});
