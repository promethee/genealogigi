import { describe, expect, it } from "vitest";
import { buildFamilyTree } from "./familyTree.ts";
import { addParentChild, addPartners } from "./relationships.ts";
import { emptyDateInput } from "./dates.ts";
import { addPerson } from "./people.ts";
import type { FamilyData, PersonId } from "./types.ts";

const EMPTY: FamilyData = { schemaVersion: 1, people: [], relationships: [] };

function build(names: string[]): { data: FamilyData; id: (n: string) => PersonId } {
  let data = EMPTY;
  for (const n of names) data = addPerson(data, { firstName: n, lastName: "" });
  const id = (n: string): PersonId => {
    const found = data.people.find((p) => p.names?.firstNames?.[0]?.value === n);
    if (!found) throw new Error(n);
    return found.id;
  };
  return { data, id };
}

describe("buildFamilyTree", () => {
  it("is empty without people", () => {
    expect(buildFamilyTree(EMPTY)).toEqual({ nodes: [], edges: [], levels: 0, slots: 0 });
  });

  it("shows everyone once, with parents above their children", () => {
    const { data: base, id } = build(["Gran", "Mum", "Dad", "Me", "Solo"]);
    let data = base;
    const link = (parent: string, child: string) => {
      data = addParentChild(data, {
        parentId: id(parent),
        childId: id(child),
        nature: "biological-confirmed",
      });
    };
    link("Gran", "Mum");
    link("Mum", "Me");
    link("Dad", "Me");
    const tree = buildFamilyTree(data);
    expect(tree.nodes).toHaveLength(5);
    const at = (n: string) => tree.nodes.find((x) => x.personId === id(n));
    expect(at("Gran")?.level).toBe(0);
    expect(at("Mum")?.level).toBe(1);
    expect(at("Me")?.level).toBe(2);
    expect(at("Solo")?.level).toBe(0);
    expect(tree.edges).toHaveLength(3);
    expect(new Set(tree.nodes.map((n) => `${n.level}:${n.slot}`)).size).toBe(5);
  });

  it("keeps a married-in partner on the same row as their partner", () => {
    const { data: base, id } = build(["Gran", "Mum", "Dad", "Me"]);
    let data = base;
    data = addParentChild(data, {
      parentId: id("Gran"),
      childId: id("Mum"),
      nature: "biological-confirmed",
    });
    data = addPartners(data, {
      personAId: id("Mum"),
      personBId: id("Dad"),
      status: "ongoing",
      start: emptyDateInput(),
      end: emptyDateInput(),
    });
    const tree = buildFamilyTree(data);
    const at = (n: string) => tree.nodes.find((x) => x.personId === id(n));
    expect(at("Dad")?.level).toBe(at("Mum")?.level);
    expect(Math.abs((at("Dad")?.slot ?? 0) - (at("Mum")?.slot ?? 0))).toBe(1);
    expect(tree.partners).toEqual([{ aKey: id("Mum"), bKey: id("Dad") }]);
  });
});
