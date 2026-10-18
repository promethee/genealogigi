import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { dateFromInput, formatDate, monthNames } from "../data/dates.ts";
import { addPerson, displayName, lifespan, lifeSummary } from "../data/people.ts";
import { addParentChild, addPartners, describeRelationship } from "../data/relationships.ts";
import type { FamilyData, PersonId } from "../data/types.ts";
import { setLocale } from "./index.ts";

const EMPTY: FamilyData = { schemaVersion: 1, people: [], relationships: [] };
const blank = { year: "", month: "", day: "" };

beforeEach(() => setLocale("fr"));
afterEach(() => setLocale("en"));

function two(): { data: FamilyData; a: PersonId; b: PersonId } {
  let data = addPerson(EMPTY, { firstName: "Ada", lastName: "" });
  data = addPerson(data, { firstName: "Byron", lastName: "" });
  return { data, a: data.people[0]!.id, b: data.people[1]!.id };
}

describe("French output of the data layer", () => {
  it("formats dates with French month names", () => {
    const date = dateFromInput({ year: "1815", month: "12", day: "10" }, "x")!;
    expect(formatDate(date)).toBe("10 déc. 1815");
    const noYear = dateFromInput({ year: "", month: "3", day: "" }, "x")!;
    expect(formatDate(noYear)).toBe("mars (année inconnue)");
    expect(monthNames()[1]).toBe("Février");
  });

  it("translates date errors", () => {
    expect(() => dateFromInput({ ...blank, day: "5" }, "Naissance")).toThrow(
      "Naissance : Un jour nécessite un mois.",
    );
    expect(() => dateFromInput({ ...blank, year: "abc" }, "X")).toThrow("doit être un nombre");
  });

  it("describes relationships in French", () => {
    const { data, a, b } = two();
    const start = { year: "1990", month: "", day: "" };
    const foster = addParentChild(data, {
      parentId: a,
      childId: b,
      nature: "foster",
      status: "ended",
      start,
      end: { year: "1995", month: "", day: "" },
    }).relationships[0]!;
    expect(describeRelationship(foster, (id) => (id === a ? "Ada" : "Byron"))).toBe(
      "Ada est parent de Byron (famille d’accueil, 1990–1995)",
    );
    const partners = addPartners(data, { personAId: a, personBId: b, status: "ongoing" })
      .relationships[0]!;
    expect(describeRelationship(partners, () => "X")).toBe("X et X sont partenaires (en cours)");
  });

  it("translates relationship errors", () => {
    const { data, a } = two();
    expect(() => addParentChild(data, { parentId: a, childId: a, nature: "adoptive" })).toThrow(
      "Une personne ne peut pas être son propre parent.",
    );
  });

  it("translates life summaries and the née display", () => {
    const person = addPerson(EMPTY, {
      firstNames: [{ value: "Marie", kind: "birth", date: blank, primary: true }],
      lastNames: [
        { value: "Martin", kind: "birth", date: blank, primary: false },
        { value: "Dubois", kind: "married", date: blank, primary: true },
      ],
      birth: { year: "1950", month: "", day: "" },
      status: "deceased",
      death: { year: "2020", month: "", day: "" },
    }).people[0]!;
    expect(displayName(person)).toBe("Marie Dubois (née Martin)");
    expect(lifeSummary(person)).toBe("° 1950 · † 2020");
    expect(lifespan(person)).toBe("1950–2020");
  });

  it("translates the unnamed placeholder", () => {
    expect(displayName({ id: "x" as PersonId })).toBe("Personne sans nom");
  });
});
