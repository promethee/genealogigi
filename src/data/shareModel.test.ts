import { describe, expect, it } from "vitest";
import { addPerson } from "./people.ts";
import { addParentChild, addPartners } from "./relationships.ts";
import { addEvent } from "./events.ts";
import { buildShareModel, canShareFamily } from "./shareModel.ts";
import type { FamilyData } from "./types.ts";

const d = (year: string, month = "", day = "") => ({ year, month, day });
const today = new Date("2026-10-18T12:00:00Z");

function family() {
  let f: FamilyData = { schemaVersion: 1, people: [], relationships: [] };
  const ids: Record<string, string> = {};
  const add = (key: string, first: string, last: string, extra = {}) => {
    f = addPerson(f, { firstName: first, lastName: last, ...extra });
    ids[key] = f.people[f.people.length - 1]!.id;
  };
  add("paul", "Paul", "Laurent", { birth: d("1930"), notes: "Baker" });
  add("jeanne", "Jeanne", "Martin");
  add("odile", "Odile", "Laurent", { birth: d("1958", "6", "2") });
  add("claire", "Claire", "Laurent");
  const pc = (p: string, c: string, nature = "biological-confirmed" as const) => {
    f = addParentChild(f, { parentId: ids[p]! as never, childId: ids[c]! as never, nature });
  };
  pc("paul", "odile");
  pc("jeanne", "odile");
  pc("paul", "claire", "adoptive" as never);
  f = addPartners(f, {
    personAId: ids.paul! as never,
    personBId: ids.jeanne! as never,
    status: "ongoing",
  });
  f = addEvent(f, {
    kind: "marriage",
    date: d("1955", "6"),
    place: "Lyon",
    description: "",
    personIds: [ids.paul as never, ids.jeanne as never],
  });
  return { f, ids };
}

describe("buildShareModel", () => {
  const { f, ids } = family();
  const model = buildShareModel(f, { title: "Laurent", lang: "en", today });
  const person = (key: string) => model.people.find((p) => p.id === ids[key])!;

  it("describes the page and counts everyone", () => {
    expect(model.title).toBe("Laurent");
    expect(model.generated).toBe("2026-10-18");
    expect(model.people).toHaveLength(4);
  });

  it("gives each person a name, life summary, initials and notes", () => {
    const paul = person("paul");
    expect(paul.name).toBe("Paul Laurent");
    expect(paul.initials).toBe("PL");
    expect(paul.notes).toBe("Baker");
    expect(person("odile").life).toContain("1958");
  });

  it("groups relatives with links, marking non-standard ones", () => {
    const paul = person("paul");
    const labels = paul.groups.map((g) => g.label);
    expect(labels).toEqual(["Partners", "Children"]);
    const children = paul.groups.find((g) => g.label === "Children")!.items;
    expect(children.map((c) => c.name)).toEqual(["Odile Laurent", "Claire Laurent"]);
    expect(children[1]!.note).toBe("adoptive");
    expect(children[0]!.note).toBe("");
    expect(person("odile").groups.map((g) => g.label)).toEqual(["Parents", "Sibling"]);
  });

  it("includes the timeline with formatted dates and linked people", () => {
    const entries = person("paul").timeline;
    const marriage = entries.find((e) => e.text.toLowerCase().includes("marriage"))!;
    expect(marriage.when).toContain("1955");
    expect(marriage.people.map((p) => p.name)).toContain("Jeanne Martin");
  });

  it("does not repeat a person that has nothing to say", () => {
    expect(person("claire").notes).toBe("");
    expect(person("claire").photos).toEqual([]);
  });
});

describe("canShareFamily", () => {
  const { f } = family();
  const empty: FamilyData = { schemaVersion: 1, people: [], relationships: [] };

  it("needs at least two people and one relationship", () => {
    expect(canShareFamily(empty)).toBe(false);
    expect(canShareFamily({ ...f, relationships: [] })).toBe(false); // people, but no link
    expect(canShareFamily({ ...f, people: f.people.slice(0, 1) })).toBe(false); // one person
    expect(canShareFamily(f)).toBe(true);
    const two = { ...f, people: f.people.slice(0, 2), relationships: f.relationships.slice(0, 1) };
    expect(canShareFamily(two)).toBe(true); // exactly the minimum
  });
});
