import { describe, expect, it } from "vitest";
import { buildFan, FAN_RING_WIDTH, truncateLabel, wedgePath } from "./fan.ts";
import { buildPedigree } from "./pedigree.ts";
import { addPerson } from "./people.ts";
import { createUuidId, type FamilyData, type PersonId } from "./types.ts";

function family(links: [string, string, "adoptive"?][]): {
  data: FamilyData;
  id: (n: string) => PersonId;
} {
  const names = ["Me", "Mum", "Dad", "Gran", "GreatGran"];
  let data: FamilyData = { schemaVersion: 1, people: [], relationships: [] };
  for (const name of names) data = addPerson(data, { firstName: name, lastName: "" });
  const id = (n: string) => data.people[names.indexOf(n)]!.id;
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

describe("buildFan", () => {
  const links: [string, string, "adoptive"?][] = [
    ["Mum", "Me"],
    ["Dad", "Me", "adoptive"],
    ["Gran", "Mum"],
  ];

  it("has one wedge per ancestor in the ring of their generation", () => {
    const { data, id } = family(links);
    const fan = buildFan(buildPedigree(data, id("Me"), 4));
    expect(fan.wedges).toHaveLength(3);
    expect(fan.wedges.filter((w) => w.generation === 1)).toHaveLength(2);
    expect(fan.wedges.filter((w) => w.generation === 2)).toHaveLength(1);
    expect(fan.rootKey).not.toBeNull();
    expect(fan.width).toBeGreaterThan(2 * FAN_RING_WIDTH);
  });

  it("carries the link nature to the parent's wedge", () => {
    const { data, id } = family(links);
    const fan = buildFan(buildPedigree(data, id("Me"), 4));
    const dad = fan.wedges.find((w) => w.personId === id("Dad"));
    const mum = fan.wedges.find((w) => w.personId === id("Mum"));
    expect(dad?.nature).toBe("adoptive");
    expect(mum?.nature).toBe("biological-confirmed");
  });

  it("gives a parent's wedge the angle of their own ancestry", () => {
    const { data, id } = family(links);
    const p = buildPedigree(data, id("Me"), 4);
    const fan = buildFan(p);
    // Gran is Mum's only lineage: Mum's wedge and Gran's wedge start at the same angle,
    // so their paths begin at the same x on their own rings' start edge direction.
    const mum = fan.wedges.find((w) => w.personId === id("Mum"))!;
    const gran = fan.wedges.find((w) => w.personId === id("Gran"))!;
    expect(mum.labelRotation).toBeCloseTo(gran.labelRotation, 5);
  });

  it("respects the generation limit and handles no parents", () => {
    const { data, id } = family([...links, ["GreatGran", "Gran"]]);
    expect(buildFan(buildPedigree(data, id("Me"), 2)).wedges).toHaveLength(3);
    expect(buildFan(buildPedigree(data, id("Me"), 4)).wedges).toHaveLength(4);
    const alone = buildFan(buildPedigree(data, id("GreatGran"), 4));
    expect(alone.wedges).toHaveLength(0);
    expect(alone.rootKey).not.toBeNull();
  });

  it("returns an empty fan for an unknown root", () => {
    const { data } = family([]);
    const fan = buildFan(buildPedigree(data, createUuidId<"PersonId">() as PersonId, 4));
    expect(fan.wedges).toHaveLength(0);
    expect(fan.rootKey).toBeNull();
  });

  it("does not loop on a cycle", () => {
    const { data, id } = family([
      ["Mum", "Me"],
      ["Me", "Mum"],
    ]);
    expect(buildFan(buildPedigree(data, id("Me"), 6)).wedges).toHaveLength(1);
  });
});

describe("helpers", () => {
  it("truncates long labels", () => {
    expect(truncateLabel("Short")).toBe("Short");
    expect(truncateLabel("A very very long name")).toHaveLength(14);
  });

  it("draws a closed arc path", () => {
    const d = wedgePath(100, 100, 20, 60, 0, Math.PI / 2);
    expect(d.startsWith("M ")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
    expect(d.match(/A /g)).toHaveLength(2);
  });
});
