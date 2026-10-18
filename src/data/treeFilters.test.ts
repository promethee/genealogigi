import { describe, expect, it } from "vitest";
import { addPerson } from "./people.ts";
import {
  activeFilterCount,
  filterPlaces,
  matchesFilters,
  NO_FILTERS,
  type TreeFilters,
} from "./treeFilters.ts";
import type { FamilyData } from "./types.ts";

const d = (year: string, month = "") => ({ year, month, day: "" });

function family(): FamilyData {
  let f: FamilyData = { schemaVersion: 1, people: [], relationships: [] };
  f = addPerson(f, {
    firstName: "Léa",
    lastName: "Dubois",
    birth: d("1988", "3"),
    birthPlace: "Paris",
    status: "living",
  });
  f = addPerson(f, {
    firstName: "Paul",
    lastName: "Laurent",
    birth: d("1930", "3"),
    birthPlace: "lyon",
    status: "deceased",
    death: d("2009", "11"),
    deathPlace: "Annecy",
  });
  f = addPerson(f, { firstName: "Ana", lastName: "Roux", birth: d("1950"), status: "unknown" });
  f = addPerson(f, {
    firstNames: [{ value: "Jeanne", kind: "birth", date: d(""), primary: true }],
    lastNames: [
      { value: "Martin", kind: "birth", date: d(""), primary: false },
      { value: "Laurent", kind: "married", date: d("1955"), primary: true },
    ],
    birthPlace: "Lyon",
    birth: d("1932", "6"),
    status: "living",
  });
  return f;
}

const who = (filters: Partial<TreeFilters>) =>
  family()
    .people.filter((p) => matchesFilters(p, { ...NO_FILTERS, ...filters }))
    .map((p) => p.names?.firstNames?.[0]?.value);

describe("matchesFilters", () => {
  it("matches everyone when no filter is on", () => {
    expect(who({})).toEqual(["Léa", "Paul", "Ana", "Jeanne"]);
    expect(activeFilterCount(NO_FILTERS)).toBe(0);
  });

  it("filters by life status; unknown is neither living nor deceased", () => {
    expect(who({ status: "living" })).toEqual(["Léa", "Jeanne"]);
    expect(who({ status: "deceased" })).toEqual(["Paul"]);
  });

  it("filters by birth and death place ignoring case", () => {
    expect(who({ birthPlace: "LYON" })).toEqual(["Paul", "Jeanne"]);
    expect(who({ deathPlace: "annecy" })).toEqual(["Paul"]);
  });

  it("filters by birth and death month, only when the month is known", () => {
    expect(who({ birthMonth: 3 })).toEqual(["Léa", "Paul"]);
    expect(who({ deathMonth: 11 })).toEqual(["Paul"]);
    expect(who({ birthMonth: 1 })).toEqual([]); // Ana has a year only
  });

  it("matches any last name, the maiden name included", () => {
    expect(who({ lastName: "martin" })).toEqual(["Jeanne"]);
    expect(who({ lastName: "Laurent" })).toEqual(["Paul", "Jeanne"]);
  });

  it("adds filters up", () => {
    expect(who({ status: "living", birthPlace: "Lyon" })).toEqual(["Jeanne"]);
    expect(who({ status: "living", birthMonth: 3, birthPlace: "Lyon" })).toEqual([]);
    expect(activeFilterCount({ ...NO_FILTERS, status: "living", birthMonth: 3 })).toBe(2);
  });
});

describe("filterPlaces", () => {
  it("lists each place once, sorted, per birth and death", () => {
    expect(filterPlaces(family().people)).toEqual({
      birth: ["lyon", "Paris"],
      death: ["Annecy"],
    });
  });
});
