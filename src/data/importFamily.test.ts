import { describe, expect, it } from "vitest";
import { ImportError, parseFamilyFile, summarize } from "./importFamily.ts";
import { MAX_NOTES_CHARS, addPerson } from "./people.ts";
import { addParentChild } from "./relationships.ts";
import { addEvent } from "./events.ts";
import { addPhotos } from "./photos.ts";
import type { FamilyData } from "./types.ts";

const messages = {
  "not-json": "NOT JSON",
  "not-family": "NOT FAMILY",
  "newer-version": "NEWER",
};
const parse = (value: unknown) =>
  parseFamilyFile(typeof value === "string" ? value : JSON.stringify(value), messages);

const ID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const empty = { schemaVersion: 1, people: [], relationships: [] };

function real(): FamilyData {
  let data: FamilyData = { schemaVersion: 1, people: [], relationships: [] };
  data = addPerson(data, {
    firstName: "Ada",
    lastName: "Byron",
    birth: { year: "1815", month: "", day: "" },
  });
  data = addPerson(data, { firstName: "Byron", lastName: "" });
  data = addParentChild(data, {
    parentId: data.people[0]!.id,
    childId: data.people[1]!.id,
    nature: "adoptive",
  });
  data = addEvent(data, {
    kind: "marriage",
    date: { year: "1840", month: "", day: "" },
    personIds: [data.people[0]!.id, data.people[1]!.id],
  });
  data = addPhotos(data, data.people[0]!.id, [{ dataUrl: "data:image/jpeg;base64,/9j/AAAA" }]);
  return data;
}

describe("a file the app wrote", () => {
  it("round-trips unchanged, with no warnings", () => {
    const data = real();
    const result = parse(JSON.stringify(data, null, 2));
    expect(result.warnings).toEqual([]);
    expect(result.data).toEqual(data);
    expect(result.summary).toEqual({ people: 2, relationships: 1, events: 1, photos: 1 });
  });

  it("accepts an empty family, and an old file without events or photos, without warnings", () => {
    expect(parse(empty).warnings).toEqual([]);
    expect(parse(empty).summary).toEqual({ people: 0, relationships: 0, events: 0, photos: 0 });
    const old = real();
    delete old.events;
    old.people = old.people.map(({ photos: _p, ...rest }) => (void _p, rest));
    expect(parse(old).warnings).toEqual([]);
  });
});

describe("files that cannot be imported", () => {
  it("rejects text that is not JSON", () => {
    for (const bad of ["", "not json", "{", "<html></html>"]) {
      expect(() => parse(bad), bad).toThrow(ImportError);
      expect(() => parse(bad)).toThrow("NOT JSON");
    }
  });

  it("rejects JSON that is not a family", () => {
    for (const bad of [
      "[]",
      "null",
      "42",
      '"text"',
      "{}",
      '{"people":[]}',
      '{"relationships":[]}',
      '{"people":{},"relationships":[]}',
    ]) {
      expect(() => parse(bad), bad).toThrow("NOT FAMILY");
    }
  });

  it("rejects a newer schema version, and a nonsense one", () => {
    expect(() => parse({ ...empty, schemaVersion: 2 })).toThrow("NEWER");
    expect(() => parse({ ...empty, schemaVersion: "1" })).toThrow("NEWER");
    expect(() => parse({ ...empty, schemaVersion: 0 })).toThrow("NOT FAMILY");
  });

  it("carries the error code", () => {
    try {
      parse("x");
    } catch (error) {
      expect((error as ImportError).code).toBe("not-json");
    }
  });
});

describe("harmless problems are dropped and counted", () => {
  it("warns about a missing version but accepts the file", () => {
    const result = parse({ people: [], relationships: [] });
    expect(result.warnings).toEqual([{ code: "no-version", count: 1 }]);
    expect(result.data.schemaVersion).toBe(1);
  });

  it("drops people without a valid id, and duplicate ids", () => {
    const result = parse({
      ...empty,
      people: [{ id: ID(1) }, { id: "nope" }, { name: "x" }, 5, null, { id: ID(1) }, { id: ID(2) }],
    });
    expect(result.data.people.map((p) => p.id)).toEqual([ID(1), ID(2)]);
    expect(result.warnings).toContainEqual({ code: "people", count: 4 });
    expect(result.warnings).toContainEqual({ code: "duplicate-people", count: 1 });
  });

  it("drops relationships that point at missing people or are malformed", () => {
    const result = parse({
      ...empty,
      people: [{ id: ID(1) }, { id: ID(2) }],
      relationships: [
        { id: ID(10), parentId: ID(1), childId: ID(2), nature: "adoptive" },
        { id: ID(11), parentId: ID(1), childId: ID(99), nature: "adoptive" },
        { id: ID(12), personAId: ID(1), personBId: ID(2), status: "unknown", startDate: {} },
        { id: ID(13), personAId: ID(77), personBId: ID(2), status: "unknown", startDate: {} },
        { id: "bad", parentId: ID(1), childId: ID(2) },
        "junk",
      ],
    });
    expect(result.data.relationships.map((r) => r.id)).toEqual([ID(10), ID(12)]);
    expect(result.warnings).toEqual([{ code: "relationships", count: 4 }]);
  });

  it("drops events with no known person, an unknown type or no date, and trims their people", () => {
    const date = {
      raw: "1900-01-01T00:00",
      yearKnown: true,
      monthKnown: false,
      dayKnown: false,
      hourKnown: false,
      minuteKnown: false,
    };
    const result = parse({
      ...empty,
      people: [{ id: ID(1) }, { id: ID(2) }],
      events: [
        { id: ID(20), kind: "marriage", date, personIds: [ID(1), ID(99), ID(2)] },
        { id: ID(21), kind: "marriage", date, personIds: [ID(99)] },
        { id: ID(22), kind: "party", date, personIds: [ID(1)] },
        { id: ID(23), kind: "marriage", personIds: [ID(1)] },
        { id: ID(24), kind: "baptism", date, personIds: [ID(1)] },
        "junk",
      ],
    });
    expect(result.data.events!.map((e) => e.id)).toEqual([ID(20), ID(24)]);
    expect(result.data.events![0]!.personIds).toEqual([ID(1), ID(2)]);
    expect(result.warnings).toEqual([{ code: "events", count: 4 }]);
  });

  it("drops invalid photos, keeps valid ones, and applies the limit", () => {
    const good = (n: number) => ({ id: ID(100 + n), dataUrl: "data:image/png;base64,AAAA" });
    const photos = [
      good(1),
      { id: ID(200), dataUrl: "https://example.com/x.jpg" },
      { id: ID(201), dataUrl: "data:image/svg+xml;base64,AAAA" },
      { id: "bad", dataUrl: "data:image/png;base64,AAAA" },
      { id: ID(202), dataUrl: `data:image/png;base64,${"A".repeat(1_500_000)}` },
      5,
    ];
    const result = parse({
      ...empty,
      people: [
        { id: ID(1), photos },
        { id: ID(2), photos: [{ id: ID(203), dataUrl: "junk" }] },
      ],
    });
    expect(result.data.people[0]!.photos).toEqual([good(1)]);
    expect("photos" in result.data.people[1]!).toBe(false);
    expect(result.warnings).toEqual([{ code: "photos", count: 6 }]);

    const many = Array.from({ length: 14 }, (_, i) => good(i));
    const limited = parse({ ...empty, people: [{ id: ID(1), photos: many }] });
    expect(limited.data.people[0]!.photos).toHaveLength(12);
    expect(limited.warnings).toEqual([{ code: "photos", count: 2 }]);
  });

  it("drops a malformed facet but keeps the person", () => {
    const result = parse({
      ...empty,
      people: [{ id: ID(1), names: "x", born: 5, lifeStatus: [], photos: "no" }],
    });
    expect(result.data.people).toEqual([{ id: ID(1) }]);
    expect(result.warnings).toEqual([]);
  });

  it("keeps fields it does not know about", () => {
    const result = parse({ ...empty, people: [{ id: ID(1), custom: { a: 1 } }] });
    expect((result.data.people[0] as unknown as { custom: unknown }).custom).toEqual({ a: 1 });
  });
});

describe("summarize", () => {
  it("counts people, relationships, events and photos", () => {
    expect(summarize(real())).toEqual({ people: 2, relationships: 1, events: 1, photos: 1 });
    expect(summarize({ schemaVersion: 1, people: [], relationships: [] })).toEqual({
      people: 0,
      relationships: 0,
      events: 0,
      photos: 0,
    });
  });
});

describe("notes on import", () => {
  it("keeps text notes, drops notes that are not text, and caps the length", () => {
    const base = real();
    const [a, b, c] = [
      base.people[0]!,
      { ...base.people[1]!, id: ID(7) },
      { ...base.people[1]!, id: ID(8) },
    ];
    const result = parse({
      ...base,
      people: [
        { ...a, notes: "Fine" },
        { ...b, notes: 42 },
        { ...c, notes: "y".repeat(25000) },
      ],
      relationships: [],
    });
    expect(result.data.people[0]?.notes).toBe("Fine");
    expect(result.data.people[1]).not.toHaveProperty("notes");
    expect(result.data.people[2]?.notes).toHaveLength(20000);
  });
});
