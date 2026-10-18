import { describe, expect, it } from "vitest";
import { addPerson } from "./people.ts";
import { normalizeText, searchPeople } from "./search.ts";
import type { FamilyData } from "./types.ts";

const d3 = (year: string) => ({ year, month: "", day: "" });

function family(): FamilyData {
  let d: FamilyData = { schemaVersion: 1, people: [], relationships: [] };
  d = addPerson(d, {
    firstName: "Léa",
    lastName: "Dubois",
    birth: d3("1988"),
    birthPlace: "Paris",
  });
  d = addPerson(d, {
    firstNames: [{ value: "Jeanne", kind: "birth", date: d3(""), primary: true }],
    lastNames: [
      { value: "Martin", kind: "birth", date: d3(""), primary: false },
      { value: "Laurent", kind: "married", date: d3("1955"), primary: true },
    ],
  });
  d = addPerson(d, {
    firstName: "Paul",
    lastName: "Laurent",
    status: "deceased",
    death: d3("2009"),
    deathPlace: "Annecy",
  });
  return d;
}

describe("normalizeText", () => {
  it("drops accents and case", () => {
    expect(normalizeText("Léa ÉLOÏSE")).toBe("lea eloise");
  });
});

describe("searchPeople", () => {
  const people = family().people;
  const names = (q: string) => searchPeople(people, q).map((p) => p.names?.firstNames?.[0]?.value);

  it("finds by first name ignoring accents and case", () => {
    expect(names("LEA")).toEqual(["Léa"]);
  });

  it("finds by a maiden name as well as the married one", () => {
    expect(names("martin")).toEqual(["Jeanne"]);
    expect(names("laurent")).toEqual(["Jeanne", "Paul"]);
  });

  it("requires every word, in any order", () => {
    expect(names("laurent jeanne")).toEqual(["Jeanne"]);
    expect(names("paul jeanne")).toEqual([]);
  });

  it("finds by birth and death place", () => {
    expect(names("paris")).toEqual(["Léa"]);
    expect(names("annecy")).toEqual(["Paul"]);
  });

  it("matches nobody for an empty or blank query", () => {
    expect(names("")).toEqual([]);
    expect(names("   ")).toEqual([]);
  });
});

describe("searchPeople in notes", () => {
  it("finds a word that only appears in a note", () => {
    const d = addPerson(
      { schemaVersion: 1, people: [], relationships: [] },
      { firstName: "Ada", lastName: "Byron", notes: "Ran a bakery on Rue Victor Hugo" },
    );
    expect(searchPeople(d.people, "bakery")).toHaveLength(1);
    expect(searchPeople(d.people, "bakery byron")).toHaveLength(1);
    expect(searchPeople(d.people, "florist")).toHaveLength(0);
  });
});
