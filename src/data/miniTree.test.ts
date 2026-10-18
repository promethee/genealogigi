import { describe, expect, it } from "vitest";
import { miniTreeOf } from "./miniTree.ts";
import { addPerson } from "./people.ts";
import { relativesOf } from "./relatives.ts";
import type { FamilyData, PersonId } from "./types.ts";
import { createUuidId } from "./types.ts";

function build(
  names: string[],
  parentLinks: [string, string, ("adoptive" | "biological-confirmed" | "foster")?][],
  partners: [string, string, ("ongoing" | "ended")?][] = [],
) {
  let data: FamilyData = { schemaVersion: 1, people: [], relationships: [] };
  for (const n of names) data = addPerson(data, { firstName: n, lastName: "" });
  const id = (n: string) => data.people[names.indexOf(n)]!.id;
  const unknown = {
    raw: "9999-01-01T00:00",
    yearKnown: false,
    monthKnown: false,
    dayKnown: false,
    hourKnown: false,
    minuteKnown: false,
  };
  for (const [p, c, nature] of parentLinks) {
    const base = { id: createUuidId<"RelationshipId">(), parentId: id(p), childId: id(c) };
    data.relationships.push(
      nature === "foster"
        ? { ...base, nature, status: "ongoing", startDate: unknown }
        : { ...base, nature: nature ?? "biological-confirmed" },
    );
  }
  for (const [a, b, status] of partners) {
    data.relationships.push(
      status === "ended"
        ? {
            id: createUuidId<"RelationshipId">(),
            personAId: id(a),
            personBId: id(b),
            status,
            startDate: unknown,
            endDate: unknown,
          }
        : {
            id: createUuidId<"RelationshipId">(),
            personAId: id(a),
            personBId: id(b),
            status: "ongoing",
            startDate: unknown,
          },
    );
  }
  return { data, id };
}

const tree = (data: FamilyData, id: PersonId) => miniTreeOf(id, relativesOf(data, id));
const find = (t: NonNullable<ReturnType<typeof tree>>, id: PersonId) =>
  t.nodes.find((n) => n.personId === id)!;

describe("miniTreeOf", () => {
  const { data, id } = build(
    ["Mum", "Dad", "Me", "Pat", "K1", "K2"],
    [
      ["Mum", "Me"],
      ["Dad", "Me", "adoptive"],
      ["Me", "K1"],
      ["Me", "K2", "foster"],
    ],
    [["Me", "Pat"]],
  );

  it("puts parents above, the person with partners in the middle, children below", () => {
    const t = tree(data, id("Me"))!;
    expect(find(t, id("Mum")).row).toBe(0);
    expect(find(t, id("Dad")).row).toBe(0);
    expect(find(t, id("Me")).row).toBe(1);
    expect(find(t, id("Pat")).row).toBe(1);
    expect(find(t, id("K1")).row).toBe(2);
    expect(find(t, id("K2")).row).toBe(2);
    expect(t.rows).toBe(3);
    expect(find(t, id("Me")).role).toBe("self");
    expect(find(t, id("Pat")).role).toBe("partner");
  });

  it("puts the partner beside the person, and centres each row", () => {
    const t = tree(data, id("Me"))!;
    expect(find(t, id("Pat")).slot).toBe(find(t, id("Me")).slot + 1);
    // Parents (2) and the person+partner (2) and children (2) are all as wide as the widest row.
    expect(t.slots).toBe(2);
    expect(find(t, id("Mum")).slot).toBe(0);
    expect(find(t, id("Dad")).slot).toBe(1);
    expect(find(t, id("K1")).slot).toBe(0);
  });

  it("centres narrower rows under the widest one", () => {
    const wide = build(
      ["Me", "A", "B", "C"],
      [
        ["Me", "A"],
        ["Me", "B"],
        ["Me", "C"],
      ],
    );
    const t = tree(wide.data, wide.id("Me"))!;
    expect(t.slots).toBe(3);
    expect(find(t, wide.id("Me")).slot).toBe(1); // one box centred over three
    expect(t.rows).toBe(2); // no parents: no row above
    expect(find(t, wide.id("Me")).row).toBe(0);
  });

  it("notes non-default natures and dashes their links", () => {
    const t = tree(data, id("Me"))!;
    expect(find(t, id("Mum")).nature).toBeUndefined();
    expect(find(t, id("Dad")).nature).toBe("adoptive");
    expect(find(t, id("K2")).nature).toBe("foster");
    const dashed = t.edges
      .filter((e) => e.dashed && e.kind === "family")
      .map((e) => e.toKey + e.fromKey);
    expect(dashed).toHaveLength(2);
    const solid = t.edges.filter((e) => !e.dashed && e.kind === "family");
    expect(solid).toHaveLength(2);
  });

  it("joins the partner with a horizontal edge, dashed when the partnership ended", () => {
    const ended = build(["Me", "Pat"], [], [["Me", "Pat", "ended"]]);
    const t = tree(ended.data, ended.id("Me"))!;
    expect(t.edges).toEqual([expect.objectContaining({ kind: "partner", dashed: true })]);
    const ongoing = tree(data, id("Me"))!;
    expect(ongoing.edges.find((e) => e.kind === "partner")!.dashed).toBe(false);
  });

  it("is null for someone with no parent, partner or child", () => {
    const lone = build(["A", "B"], []);
    expect(tree(lone.data, lone.id("A"))).toBeNull();
  });

  it("draws a repeated person once", () => {
    const twice = build(
      ["Mum", "Me"],
      [
        ["Mum", "Me"],
        ["Mum", "Me", "adoptive"],
      ],
    );
    // Two links between the same pair are rejected by the app, but hand-edited files may have them.
    twice.data.relationships.push({
      ...twice.data.relationships[0]!,
      id: createUuidId<"RelationshipId">(),
    } as never);
    const t = tree(twice.data, twice.id("Me"))!;
    expect(t.nodes.filter((n) => n.personId === twice.id("Mum"))).toHaveLength(1);
  });
});

describe("several partners", () => {
  it("joins each partner to the box on their left", () => {
    const { data, id } = build(
      ["Me", "P1", "P2"],
      [],
      [
        ["Me", "P1"],
        ["Me", "P2"],
      ],
    );
    const t = tree(data, id("Me"))!;
    const partnerEdges = t.edges.filter((e) => e.kind === "partner");
    expect(partnerEdges.map((e) => [e.fromKey, e.toKey])).toEqual([
      [`self:${id("Me")}`, `partner:${id("P1")}`],
      [`partner:${id("P1")}`, `partner:${id("P2")}`],
    ]);
    expect(find(t, id("P2")).slot).toBe(find(t, id("Me")).slot + 2);
  });
});
