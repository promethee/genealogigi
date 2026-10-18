import { describe, expect, it } from "vitest";
import {
  buildPedigree,
  clampGenerations,
  DEFAULT_GENERATIONS,
  truncateName,
  type Pedigree,
} from "./pedigree.ts";
import { addPerson } from "./people.ts";
import type { ParentChildNature } from "./relationships.ts";
import { createUuidId, type FamilyData, type PersonId } from "./types.ts";

/** Builds a family by name; parent links are given as [parent, child, nature?]. */
function build(
  names: string[],
  links: [string, string, ParentChildNature?][],
): { data: FamilyData; id: (name: string) => PersonId } {
  let data: FamilyData = { schemaVersion: 1, people: [], relationships: [] };
  for (const name of names) data = addPerson(data, { firstName: name, lastName: "" });
  const id = (name: string): PersonId => {
    const index = names.indexOf(name);
    const person = data.people[index];
    if (!person) throw new Error(`no ${name}`);
    return person.id;
  };
  // Written straight into the data (not via addParentChild) so tests can model
  // corrupt files that the app itself would refuse to create.
  for (const [parent, child, nature] of links) {
    data.relationships.push({
      id: createUuidId<"RelationshipId">(),
      parentId: id(parent),
      childId: id(child),
      nature: nature ?? "biological-confirmed",
    });
  }
  return { data, id };
}

function personsAt(p: Pedigree, generation: number, data: FamilyData): string[] {
  return p.nodes
    .filter((n) => n.generation === generation)
    .map((n) => data.people.find((x) => x.id === n.personId)?.names?.firstNames?.[0]?.value ?? "?")
    .sort();
}

describe("buildPedigree", () => {
  it("shows only the root when there are no parents", () => {
    const { data, id } = build(["Me"], []);
    const p = buildPedigree(data, id("Me"));
    expect(p.nodes).toHaveLength(1);
    expect(p.edges).toHaveLength(0);
    expect(p.levels).toBe(1);
    expect(p.slots).toBe(1);
  });

  it("returns an empty chart for an unknown root", () => {
    const { data } = build(["Me"], []);
    const p = buildPedigree(data, createUuidId<"PersonId">() as PersonId);
    expect(p.nodes).toHaveLength(0);
    expect(p.levels).toBe(0);
  });

  it("places two parents in the next column and centres the root", () => {
    const { data, id } = build(
      ["Me", "Mum", "Dad"],
      [
        ["Mum", "Me"],
        ["Dad", "Me"],
      ],
    );
    const p = buildPedigree(data, id("Me"));
    expect(personsAt(p, 1, data)).toEqual(["Dad", "Mum"]);
    expect(p.edges).toHaveLength(2);
    const root = p.nodes.find((n) => n.generation === 0);
    expect(root?.slot).toBe(0.5); // between rows 0 and 1
    expect(p.slots).toBe(2);
  });

  it("handles a single known parent", () => {
    const { data, id } = build(["Me", "Mum"], [["Mum", "Me"]]);
    const p = buildPedigree(data, id("Me"));
    expect(personsAt(p, 1, data)).toEqual(["Mum"]);
    expect(p.nodes.find((n) => n.generation === 0)?.slot).toBe(0);
  });

  it("shows more than two parents", () => {
    const { data, id } = build(
      ["Me", "A", "B", "C"],
      [
        ["A", "Me"],
        ["B", "Me"],
        ["C", "Me"],
      ],
    );
    const p = buildPedigree(data, id("Me"));
    expect(personsAt(p, 1, data)).toEqual(["A", "B", "C"]);
  });

  it("respects the generation limit", () => {
    const { data, id } = build(
      ["Me", "Mum", "Gran", "GreatGran"],
      [
        ["Mum", "Me"],
        ["Gran", "Mum"],
        ["GreatGran", "Gran"],
      ],
    );
    const p = buildPedigree(data, id("Me"), 2);
    expect(p.levels).toBe(3);
    expect(personsAt(p, 3, data)).toEqual([]);
    expect(personsAt(buildPedigree(data, id("Me"), 3), 3, data)).toEqual(["GreatGran"]);
  });

  it("draws a shared ancestor once per path", () => {
    // Cousins' child: both parents descend from the same grandparent.
    const { data, id } = build(
      ["Me", "Mum", "Dad", "Gran"],
      [
        ["Mum", "Me"],
        ["Dad", "Me"],
        ["Gran", "Mum"],
        ["Gran", "Dad"],
      ],
    );
    const p = buildPedigree(data, id("Me"));
    const grans = p.nodes.filter((n) => n.personId === id("Gran"));
    expect(grans).toHaveLength(2);
    expect(new Set(p.nodes.map((n) => n.key)).size).toBe(p.nodes.length);
  });

  it("does not loop on a parent-child cycle in the file", () => {
    const { data, id } = build(
      ["A", "B"],
      [
        ["A", "B"],
        ["B", "A"],
      ],
    );
    const p = buildPedigree(data, id("A"), 6);
    // A -> parent B; B's parent A is already on the path, so it stops.
    expect(p.nodes.map((n) => n.generation).sort()).toEqual([0, 1]);
  });

  it("skips relationships that point to a missing person", () => {
    const { data, id } = build(["Me"], []);
    data.relationships.push({
      id: createUuidId<"RelationshipId">(),
      parentId: createUuidId<"PersonId">() as PersonId,
      childId: id("Me"),
      nature: "adoptive",
    });
    expect(buildPedigree(data, id("Me")).nodes).toHaveLength(1);
  });

  it("carries the nature on each edge", () => {
    const { data, id } = build(
      ["Me", "Mum", "Dad"],
      [
        ["Mum", "Me", "adoptive"],
        ["Dad", "Me"],
      ],
    );
    const natures = buildPedigree(data, id("Me"))
      .edges.map((e) => e.nature)
      .sort();
    expect(natures).toEqual(["adoptive", "biological-confirmed"]);
  });

  it("ignores partner relationships", () => {
    const { data, id } = build(["Me", "Pat"], []);
    data.relationships.push({
      id: createUuidId<"RelationshipId">(),
      personAId: id("Me"),
      personBId: id("Pat"),
      status: "unknown",
      startDate: {
        raw: "9999-01-01T00:00",
        yearKnown: false,
        monthKnown: false,
        dayKnown: false,
        hourKnown: false,
        minuteKnown: false,
      },
    });
    expect(buildPedigree(data, id("Me")).nodes).toHaveLength(1);
  });
});

describe("clampGenerations / truncateName", () => {
  it("clamps to 2..6 and defaults on NaN", () => {
    expect(clampGenerations(1)).toBe(2);
    expect(clampGenerations(99)).toBe(6);
    expect(clampGenerations(Number.NaN)).toBe(DEFAULT_GENERATIONS);
  });

  it("truncates long names only", () => {
    expect(truncateName("Ada")).toBe("Ada");
    const long = "A".repeat(40);
    expect(truncateName(long)).toHaveLength(22);
    expect(truncateName(long).endsWith("…")).toBe(true);
  });
});

describe("buildPedigree descendants", () => {
  const family = () =>
    build(
      ["Gran", "Mum", "Uncle", "Me", "Sis"],
      [
        ["Gran", "Mum"],
        ["Gran", "Uncle", "adoptive"],
        ["Mum", "Me"],
        ["Mum", "Sis"],
      ],
    );

  it("lays out children and grandchildren in later columns", () => {
    const { data, id } = family();
    const p = buildPedigree(data, id("Gran"), 4, "descendants");
    expect(personsAt(p, 0, data)).toEqual(["Gran"]);
    expect(personsAt(p, 1, data).sort()).toEqual(["Mum", "Uncle"]);
    expect(personsAt(p, 2, data).sort()).toEqual(["Me", "Sis"]);
    expect(p.levels).toBe(3);
    expect(p.edges).toHaveLength(4);
    expect(p.edges.find((e) => e.nature === "adoptive")).toBeDefined();
  });

  it("respects the generation limit", () => {
    const { data, id } = build(
      ["Gran", "Mum", "Me", "Kid"],
      [
        ["Gran", "Mum"],
        ["Mum", "Me"],
        ["Me", "Kid"],
      ],
    );
    const p = buildPedigree(data, id("Gran"), 2, "descendants");
    expect(p.levels).toBe(3);
    expect(personsAt(p, 3, data)).toEqual([]);
  });

  it("centres a parent on their children", () => {
    const { data, id } = family();
    const p = buildPedigree(data, id("Mum"), 4, "descendants");
    const slots = p.nodes.map((n) => n.slot);
    const root = p.nodes.find((n) => n.generation === 0);
    expect(root?.slot).toBe((Math.min(...slots) + Math.max(...slots)) / 2);
  });

  it("does not loop on a cycle", () => {
    const { data, id } = build(
      ["A", "B"],
      [
        ["A", "B"],
        ["B", "A"],
      ],
    );
    const p = buildPedigree(data, id("A"), 6, "descendants");
    expect(p.nodes).toHaveLength(2);
  });

  it("gives just the root for someone without children", () => {
    const { data, id } = family();
    const p = buildPedigree(data, id("Me"), 4, "descendants");
    expect(p.nodes).toHaveLength(1);
  });

  it("defaults to ancestors", () => {
    const { data, id } = family();
    expect(buildPedigree(data, id("Me")).nodes).toHaveLength(3);
  });
});

describe("buildPedigree hourglass", () => {
  const family = () =>
    build(
      ["Gran", "Mum", "Dad", "Me", "Kid", "Sis"],
      [
        ["Gran", "Mum"],
        ["Mum", "Me"],
        ["Dad", "Me"],
        ["Me", "Kid"],
        ["Me", "Sis"],
      ],
    );

  it("puts ancestors left and descendants right of one shared root", () => {
    const { data, id } = family();
    const p = buildPedigree(data, id("Me"), 4, "hourglass");
    const column = (name: string) => p.nodes.find((n) => n.personId === id(name))?.level;
    expect(p.nodes).toHaveLength(6);
    expect(p.levels).toBe(4);
    expect(column("Gran")).toBe(0);
    expect(column("Mum")).toBe(1);
    expect(column("Me")).toBe(2);
    expect(column("Kid")).toBe(3);
    expect(p.nodes.filter((n) => n.personId === id("Me"))).toHaveLength(1);
    expect(p.edges).toHaveLength(5);
  });

  it("aligns the root row and keeps rows non-negative", () => {
    const { data, id } = family();
    const p = buildPedigree(data, id("Me"), 4, "hourglass");
    expect(Math.min(...p.nodes.map((n) => n.slot))).toBe(0);
    expect(p.slots).toBeGreaterThanOrEqual(Math.max(...p.nodes.map((n) => n.slot)) + 1);
    const kids = p.nodes.filter((n) => n.level === 3).map((n) => n.slot);
    const root = p.nodes.find((n) => n.generation === 0);
    expect(root?.slot).toBe((Math.min(...kids) + Math.max(...kids)) / 2);
  });

  it("works with only one side and respects the limit per side", () => {
    const { data, id } = family();
    const noKids = buildPedigree(data, id("Kid"), 2, "hourglass");
    expect(noKids.nodes.map((n) => n.personId)).toContain(id("Me"));
    const root = noKids.nodes.find((n) => n.generation === 0);
    expect(root?.level).toBe(noKids.levels - 1);
    const limited = buildPedigree(data, id("Me"), 2, "hourglass");
    expect(limited.nodes).toHaveLength(6);
    const tight = build(
      ["A", "B", "C", "D"],
      [
        ["A", "B"],
        ["B", "C"],
        ["C", "D"],
      ],
    );
    expect(buildPedigree(tight.data, tight.id("B"), 2, "hourglass").levels).toBe(4);
  });

  it("returns an empty chart for an unknown root", () => {
    const { data } = family();
    const p = buildPedigree(data, createUuidId<"PersonId">() as PersonId, 4, "hourglass");
    expect(p.nodes).toHaveLength(0);
  });
});

describe("vertical levels", () => {
  const links: [string, string][] = [
    ["Gran", "Mum"],
    ["Mum", "Me"],
    ["Dad", "Me"],
    ["Me", "Kid"],
  ];
  const family = () => build(["Gran", "Mum", "Dad", "Me", "Kid"], links);
  const levelOf = (p: Pedigree, data: FamilyData, name: string) =>
    p.nodes.find(
      (n) => data.people.find((x) => x.id === n.personId)?.names?.firstNames?.[0]?.value === name,
    )?.level;

  it("puts ancestors above the root: the root is on the deepest level", () => {
    const { data, id } = family();
    const p = buildPedigree(data, id("Me"), 4, "ancestors");
    expect(p.levels).toBe(3);
    expect(levelOf(p, data, "Gran")).toBe(0);
    expect(levelOf(p, data, "Mum")).toBe(1);
    expect(levelOf(p, data, "Dad")).toBe(1);
    expect(levelOf(p, data, "Me")).toBe(2);
  });

  it("puts descendants below the root: the root is on level 0", () => {
    const { data, id } = family();
    const p = buildPedigree(data, id("Gran"), 4, "descendants");
    expect(levelOf(p, data, "Gran")).toBe(0);
    expect(levelOf(p, data, "Mum")).toBe(1);
    expect(levelOf(p, data, "Me")).toBe(2);
    expect(levelOf(p, data, "Kid")).toBe(3);
  });

  it("puts a lone root on level 0", () => {
    const { data, id } = family();
    expect(buildPedigree(data, id("Kid"), 4, "descendants").nodes[0]?.level).toBe(0);
    expect(buildPedigree(data, id("Gran"), 4, "ancestors").nodes[0]?.level).toBe(0);
  });

  it("spreads siblings of a level across slots, side by side", () => {
    const { data, id } = family();
    const p = buildPedigree(data, id("Me"), 4, "ancestors");
    const slots = p.nodes.filter((n) => n.level === 1).map((n) => n.slot);
    expect(new Set(slots).size).toBe(2);
    expect(p.nodes.find((n) => n.generation === 0)?.slot).toBeCloseTo((slots[0]! + slots[1]!) / 2);
  });
});
