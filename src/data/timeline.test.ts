import { afterEach, describe, expect, it } from "vitest";
import { setLocale } from "../i18n/index.ts";
import { addEvent } from "./events.ts";
import { addPerson } from "./people.ts";
import { addParentChild, addPartners } from "./relationships.ts";
import { timelineOf } from "./timeline.ts";
import type { FamilyData, PersonId } from "./types.ts";

afterEach(() => setLocale("en"));

const blank = { year: "", month: "", day: "" };
const y = (year: string, month = "", day = "") => ({ year, month, day });

function base() {
  let data: FamilyData = { schemaVersion: 1, people: [], relationships: [] };
  data = addPerson(data, {
    firstNames: [{ value: "Marie", kind: "birth", date: blank, primary: true }],
    lastNames: [
      { value: "Martin", kind: "birth", date: blank, primary: false },
      { value: "Dubois", kind: "married", date: y("1975"), primary: true },
    ],
    birth: y("1950", "3", "2"),
    birthPlace: "Lyon",
    status: "deceased",
    death: y("2020"),
    deathPlace: "Nice",
  });
  data = addPerson(data, { firstName: "Paul", lastName: "", birth: y("1948"), status: "living" });
  data = addPerson(data, { firstName: "Kid", lastName: "", birth: y("1980", "6") });
  const [marie, paul, kid] = data.people.map((p) => p.id) as [PersonId, PersonId, PersonId];
  return { data, marie, paul, kid };
}

const texts = (data: FamilyData, id: PersonId) => timelineOf(data, id).map((e) => e.text);

describe("timelineOf", () => {
  it("orders birth, a dated name change, a child's birth and death", () => {
    const { data, marie, kid } = base();
    const withChild = addParentChild(data, {
      parentId: marie,
      childId: kid,
      nature: "biological-confirmed",
    });
    expect(texts(withChild, marie)).toEqual([
      "Born in Lyon",
      "Name: Dubois (married)",
      "Child born: Kid",
      "Died in Nice",
    ]);
  });

  it("does not list a birth name without a date", () => {
    const { data, marie } = base();
    expect(texts(data, marie).some((t) => t.includes("Martin"))).toBe(false);
  });

  it("includes partnership start and end with the other person", () => {
    const { data, marie, paul } = base();
    let next = addPartners(data, {
      personAId: marie,
      personBId: paul,
      status: "ended",
      start: y("1972"),
      end: y("1990"),
    });
    const entries = timelineOf(next, marie);
    const start = entries.find((e) => e.text.includes("began"))!;
    const end = entries.find((e) => e.text.includes("ended"))!;
    expect(start.text).toBe("Partnership with Paul began");
    expect(start.people).toEqual([paul]);
    expect(end.text).toBe("Partnership with Paul ended");
    expect(entries.indexOf(start)).toBeLessThan(entries.indexOf(end));
    // The other side sees it too.
    expect(texts(next, paul)).toContain("Partnership with Marie Dubois (née Martin) began");
    next = addPartners(data, { personAId: marie, personBId: paul, status: "ongoing" });
    expect(texts(next, marie).some((t) => t.includes("Partnership"))).toBe(false); // undated: left out
  });

  it("shows fixed-period parent links with their nature", () => {
    const { data, marie, kid } = base();
    const next = addParentChild(data, {
      parentId: marie,
      childId: kid,
      nature: "foster",
      status: "ended",
      start: y("1990"),
      end: y("1995"),
    });
    expect(texts(next, kid)).toContain("foster link with Marie Dubois (née Martin) began");
    expect(texts(next, kid)).toContain("foster link with Marie Dubois (née Martin) ended");
  });

  it("includes events, with other people, and orders them among the rest", () => {
    const { data, marie, paul } = base();
    const next = addEvent(data, {
      kind: "marriage",
      date: y("1975"),
      place: "Lyon",
      personIds: [marie, paul],
    });
    const entries = timelineOf(next, marie);
    const marriage = entries.find((e) => e.eventId)!;
    expect(marriage.text).toBe("Marriage in Lyon");
    expect(marriage.people).toEqual([paul]);
    // 1975 name change and 1975 marriage sit between birth (1950) and death (2020).
    expect(entries[0]!.text).toBe("Born in Lyon");
    expect(entries[entries.length - 1]!.text).toBe("Died in Nice");
    expect(texts(next, paul)).toContain("Marriage in Lyon");
    expect(timelineOf(next, paul).find((e) => e.eventId)!.people).toEqual([marie]);
  });

  it("uses the description: appended for typed events, alone for type other", () => {
    const { data, marie } = base();
    let next = addEvent(data, {
      kind: "occupation",
      date: y("1980"),
      description: "Teacher",
      personIds: [marie],
    });
    next = addEvent(next, {
      kind: "other",
      date: y("1985"),
      description: "Won a prize",
      personIds: [marie],
    });
    expect(texts(next, marie)).toContain("Occupation: Teacher");
    expect(texts(next, marie)).toContain("Won a prize");
  });

  it("puts undated entries after dated ones, birth first and death last among them", () => {
    let data: FamilyData = { schemaVersion: 1, people: [], relationships: [] };
    data = addPerson(data, {
      firstName: "Ada",
      lastName: "",
      birth: blank,
      birthPlace: "Rome",
      status: "deceased",
      death: blank,
    });
    const ada = data.people[0]!.id;
    data = addEvent(data, { kind: "education", date: blank, personIds: [ada] });
    data = addEvent(data, { kind: "residence", date: y("1900"), personIds: [ada] });
    // Dated first; then undated: the birth entry before the other undated one, death last.
    expect(texts(data, ada)).toEqual(["Residence", "Born in Rome", "Education", "Died"]);
  });

  it("orders partial dates by what is known", () => {
    const { data, marie } = base();
    let next = addEvent(data, { kind: "residence", date: y("1980", "12"), personIds: [marie] });
    next = addEvent(next, { kind: "education", date: y("1980"), personIds: [marie] });
    next = addEvent(next, { kind: "occupation", date: y("1980", "6", "15"), personIds: [marie] });
    const order = texts(next, marie).filter((t) =>
      ["Education", "Occupation", "Residence"].includes(t),
    );
    expect(order).toEqual(["Education", "Occupation", "Residence"]);
  });

  it("is empty for a person with nothing, and for an unknown id", () => {
    let data: FamilyData = { schemaVersion: 1, people: [], relationships: [] };
    data = addPerson(data, { firstName: "Solo", lastName: "" });
    expect(timelineOf(data, data.people[0]!.id)).toEqual([]);
    expect(timelineOf(data, "11111111-1111-4111-8111-111111111111" as PersonId)).toEqual([]);
  });

  it("is translated", () => {
    const { data, marie } = base();
    setLocale("fr");
    expect(texts(data, marie)[0]).toBe("Naissance à Lyon");
    expect(texts(data, marie).at(-1)).toBe("Décès à Nice");
  });
});

describe("child births name the other parent, not the child", () => {
  it("shows the child's other parent after 'with', and nobody when there is none", () => {
    const { data, marie, paul, kid } = base();
    const both = addParentChild(
      addParentChild(data, { parentId: marie, childId: kid, nature: "biological-confirmed" }),
      { parentId: paul, childId: kid, nature: "biological-confirmed" },
    );
    const entry = timelineOf(both, marie).find((e) => e.kind === "child")!;
    expect(entry.text).toBe("Child born: Kid");
    expect(entry.people).toEqual([paul]); // the other parent, never the child
    expect(timelineOf(both, paul).find((e) => e.kind === "child")!.people).toEqual([marie]);

    const single = addParentChild(data, {
      parentId: marie,
      childId: kid,
      nature: "biological-confirmed",
    });
    expect(timelineOf(single, marie).find((e) => e.kind === "child")!.people).toEqual([]);
  });

  it("lists every other parent once, even with a step-parent, and skips people who left the file", () => {
    const { data, marie, paul, kid } = base();
    let next = addParentChild(data, {
      parentId: marie,
      childId: kid,
      nature: "biological-confirmed",
    });
    next = addParentChild(next, { parentId: paul, childId: kid, nature: "adoptive" });
    next = {
      ...next,
      relationships: [
        ...next.relationships,
        { ...next.relationships[1]!, id: "22222222-2222-4222-8222-222222222222" as never },
      ],
    };
    expect(timelineOf(next, marie).find((e) => e.kind === "child")!.people).toEqual([paul]);
    const gone = { ...next, people: next.people.filter((p) => p.id !== paul) };
    expect(timelineOf(gone, marie).find((e) => e.kind === "child")!.people).toEqual([]);
  });
});

describe("event types", () => {
  it("does not offer baptism any more, but an old baptism event still shows", async () => {
    const { EVENT_KINDS } = await import("./events.ts");
    expect(EVENT_KINDS).not.toContain("baptism");
    expect(EVENT_KINDS).toContain("marriage");
    const { data, marie } = base();
    const old: FamilyData = {
      ...data,
      events: [
        {
          id: "33333333-3333-4333-8333-333333333333" as never,
          kind: "baptism",
          date: {
            raw: "1950-04-01T00:00",
            yearKnown: true,
            monthKnown: false,
            dayKnown: false,
            hourKnown: false,
            minuteKnown: false,
          },
          personIds: [marie],
        },
      ],
    };
    expect(texts(old, marie)).toContain("Baptism");
  });
});
