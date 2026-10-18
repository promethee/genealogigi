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
    expect(p.columns).toBe(1);
    expect(p.rows).toBe(1);
  });

  it("returns an empty chart for an unknown root", () => {
    const { data } = build(["Me"], []);
    const p = buildPedigree(data, createUuidId<"PersonId">() as PersonId);
    expect(p.nodes).toHaveLength(0);
    expect(p.columns).toBe(0);
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
    expect(root?.row).toBe(0.5); // between rows 0 and 1
    expect(p.rows).toBe(2);
  });

  it("handles a single known parent", () => {
    const { data, id } = build(["Me", "Mum"], [["Mum", "Me"]]);
    const p = buildPedigree(data, id("Me"));
    expect(personsAt(p, 1, data)).toEqual(["Mum"]);
    expect(p.nodes.find((n) => n.generation === 0)?.row).toBe(0);
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
    expect(p.columns).toBe(3);
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
