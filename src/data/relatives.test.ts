import { describe, expect, it } from "vitest";
import { addPerson } from "./people.ts";
import { relativesOf, siblingsOf } from "./relatives.ts";
import { createUuidId, type FamilyData, type PersonId } from "./types.ts";

function build(
  names: string[],
  parentLinks: [string, string, ("adoptive" | "biological-confirmed")?][],
  partners: [string, string][] = [],
): { data: FamilyData; id: (n: string) => PersonId } {
  let data: FamilyData = { schemaVersion: 1, people: [], relationships: [] };
  for (const name of names) data = addPerson(data, { firstName: name, lastName: "" });
  const id = (n: string) => data.people[names.indexOf(n)]!.id;
  for (const [parent, child, nature] of parentLinks) {
    data.relationships.push({
      id: createUuidId<"RelationshipId">(),
      parentId: id(parent),
      childId: id(child),
      nature: nature ?? "biological-confirmed",
    });
  }
  for (const [a, b] of partners) {
    data.relationships.push({
      id: createUuidId<"RelationshipId">(),
      personAId: id(a),
      personBId: id(b),
      status: "ongoing",
      startDate: data.people[0]!.born?.birthDate ?? {
        raw: "9999-01-01T00:00",
        yearKnown: false,
        monthKnown: false,
        dayKnown: false,
        hourKnown: false,
        minuteKnown: false,
      },
    });
  }
  return { data, id };
}

describe("relativesOf", () => {
  const { data, id } = build(
    ["Mum", "Dad", "Me", "Sis", "Kid", "Gran"],
    [
      ["Mum", "Me"],
      ["Dad", "Me", "adoptive"],
      ["Mum", "Sis"],
      ["Dad", "Sis"],
      ["Me", "Kid"],
      ["Gran", "Mum"],
    ],
    [["Mum", "Dad"]],
  );

  it("lists parents with their nature", () => {
    const r = relativesOf(data, id("Me"));
    expect(r.parents.map((p) => [p.personId, p.nature])).toEqual([
      [id("Mum"), "biological-confirmed"],
      [id("Dad"), "adoptive"],
    ]);
  });

  it("lists children and partners from either side", () => {
    expect(relativesOf(data, id("Me")).children.map((c) => c.personId)).toEqual([id("Kid")]);
    expect(relativesOf(data, id("Mum")).partners.map((p) => p.personId)).toEqual([id("Dad")]);
    expect(relativesOf(data, id("Dad")).partners.map((p) => p.personId)).toEqual([id("Mum")]);
  });

  it("has nothing for a person without relationships", () => {
    const lone = build(["A"], []);
    const r = relativesOf(lone.data, lone.id("A"));
    expect(r).toEqual({ parents: [], children: [], partners: [], siblings: [] });
  });

  it("ignores links to people missing from the file", () => {
    const { data: d, id: i } = build(["A", "B"], [["A", "B"]]);
    const [a, b] = [i("A"), i("B")];
    d.people = d.people.filter((p) => p.id !== a);
    expect(relativesOf(d, b).parents).toEqual([]);
  });
});

describe("siblingsOf", () => {
  it("finds full siblings (all known parents shared)", () => {
    const { data, id } = build(
      ["Mum", "Dad", "Me", "Sis"],
      [
        ["Mum", "Me"],
        ["Dad", "Me"],
        ["Mum", "Sis"],
        ["Dad", "Sis"],
      ],
    );
    expect(siblingsOf(data, id("Me"))).toEqual([
      { personId: id("Sis"), half: false, sharedParents: [id("Mum"), id("Dad")] },
    ]);
  });

  it("marks half-siblings: one shared parent among several", () => {
    const { data, id } = build(
      ["Mum", "Dad", "Step", "Me", "Half"],
      [
        ["Mum", "Me"],
        ["Dad", "Me"],
        ["Mum", "Half"],
        ["Step", "Half"],
      ],
    );
    const sibs = siblingsOf(data, id("Me"));
    expect(sibs).toHaveLength(1);
    expect(sibs[0]).toMatchObject({ personId: id("Half"), half: true, sharedParents: [id("Mum")] });
  });

  it("treats siblings through a single known parent as full when both only know that parent", () => {
    const { data, id } = build(
      ["Mum", "Me", "Sis"],
      [
        ["Mum", "Me"],
        ["Mum", "Sis"],
      ],
    );
    expect(siblingsOf(data, id("Me"))[0]).toMatchObject({ half: false });
  });

  it("is empty without parents, and never lists the person themself", () => {
    const { data, id } = build(["Mum", "Me"], [["Mum", "Me"]]);
    expect(siblingsOf(data, id("Me"))).toEqual([]);
    expect(siblingsOf(data, id("Mum"))).toEqual([]);
  });

  it("lists a sibling once even when they share two parents", () => {
    const { data, id } = build(
      ["Mum", "Dad", "Me", "Sis"],
      [
        ["Mum", "Me"],
        ["Dad", "Me"],
        ["Mum", "Sis"],
        ["Dad", "Sis"],
      ],
    );
    expect(siblingsOf(data, id("Me"))).toHaveLength(1);
  });
});
