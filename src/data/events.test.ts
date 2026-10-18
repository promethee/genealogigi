import { describe, expect, it } from "vitest";
import { addEvent, eventsOf, removeEvent, updateEvent, withoutPerson } from "./events.ts";
import { addPerson, removePerson } from "./people.ts";
import { createUuidId, type EventId, type FamilyData, type PersonId } from "./types.ts";

const blank = { year: "", month: "", day: "" };

function family(...names: string[]): { data: FamilyData; ids: PersonId[] } {
  let data: FamilyData = { schemaVersion: 1, people: [], relationships: [] };
  for (const name of names) data = addPerson(data, { firstName: name, lastName: "" });
  return { data, ids: data.people.map((p) => p.id) };
}

describe("addEvent", () => {
  it("adds a marriage involving two people, visible to both", () => {
    const { data, ids } = family("Ada", "Paul", "Cleo");
    const next = addEvent(data, {
      kind: "marriage",
      date: { ...blank, year: "1975" },
      place: " Lyon ",
      personIds: [ids[0]!, ids[1]!],
    });
    expect(next.events).toHaveLength(1);
    expect(next.events![0]).toMatchObject({
      kind: "marriage",
      place: "Lyon",
      personIds: [ids[0], ids[1]],
      date: { yearKnown: true },
    });
    expect(eventsOf(next, ids[0]!)).toHaveLength(1);
    expect(eventsOf(next, ids[1]!)).toHaveLength(1);
    expect(eventsOf(next, ids[2]!)).toHaveLength(0);
  });

  it("stores an undated event with a fully unknown date and omits empty fields", () => {
    const { data, ids } = family("Ada");
    const event = addEvent(data, { kind: "education", date: blank, personIds: [ids[0]!] })
      .events![0]!;
    expect(event.date.yearKnown).toBe(false);
    expect("place" in event).toBe(false);
    expect("description" in event).toBe(false);
  });

  it("requires a description for type other", () => {
    const { data, ids } = family("Ada");
    expect(() => addEvent(data, { kind: "other", date: blank, personIds: [ids[0]!] })).toThrow(
      "description is required",
    );
    expect(() =>
      addEvent(data, { kind: "other", date: blank, description: "  ", personIds: [ids[0]!] }),
    ).toThrow("description is required");
    expect(() =>
      addEvent(data, {
        kind: "other",
        date: blank,
        description: "Won a prize",
        personIds: [ids[0]!],
      }),
    ).not.toThrow();
  });

  it("needs at least one person, no duplicates and only known people", () => {
    const { data, ids } = family("Ada");
    expect(() => addEvent(data, { kind: "marriage", date: blank, personIds: [] })).toThrow(
      "at least one person",
    );
    expect(() =>
      addEvent(data, { kind: "marriage", date: blank, personIds: [ids[0]!, ids[0]!] }),
    ).toThrow("same person cannot be added twice");
    expect(() =>
      addEvent(data, {
        kind: "marriage",
        date: blank,
        personIds: [createUuidId<"PersonId">() as PersonId],
      }),
    ).toThrow("Person not found");
  });

  it("rejects future and invalid dates", () => {
    const { data, ids } = family("Ada");
    const next = String(new Date().getFullYear() + 1);
    expect(() =>
      addEvent(data, { kind: "marriage", date: { ...blank, year: next }, personIds: [ids[0]!] }),
    ).toThrow("Event date cannot be in the future.");
    expect(() =>
      addEvent(data, {
        kind: "marriage",
        date: { year: "", month: "4", day: "31" },
        personIds: [ids[0]!],
      }),
    ).toThrow("Event date");
  });
});

describe("updateEvent / removeEvent", () => {
  const setup = () => {
    const { data, ids } = family("Ada", "Paul");
    const next = addEvent(data, { kind: "marriage", date: blank, personIds: [ids[0]!] });
    return { data: next, ids, id: next.events![0]!.id };
  };

  it("updates in place, including who is involved", () => {
    const { data, ids, id } = setup();
    const next = updateEvent(data, id, {
      kind: "marriage",
      date: { ...blank, year: "1980" },
      place: "Paris",
      personIds: [ids[0]!, ids[1]!],
    });
    expect(next.events).toHaveLength(1);
    expect(next.events![0]).toMatchObject({ id, place: "Paris", personIds: [ids[0], ids[1]] });
  });

  it("refuses an invalid update and keeps the original", () => {
    const { data, id } = setup();
    expect(() =>
      updateEvent(data, id, { kind: "other", date: blank, personIds: [data.people[0]!.id] }),
    ).toThrow();
    expect(data.events![0]!.kind).toBe("marriage");
  });

  it("removes an event and reports unknown ids", () => {
    const { data, id } = setup();
    expect(removeEvent(data, id).events).toEqual([]);
    expect(() => removeEvent(data, createUuidId<"EventId">() as EventId)).toThrow(
      "Event not found",
    );
    expect(() =>
      updateEvent(data, createUuidId<"EventId">() as EventId, {
        kind: "education",
        date: blank,
        personIds: [data.people[0]!.id],
      }),
    ).toThrow("Event not found");
  });
});

describe("deleting a person", () => {
  it("takes them out of shared events and deletes events left with nobody", () => {
    const { data, ids } = family("Ada", "Paul", "Solo");
    let next = addEvent(data, { kind: "marriage", date: blank, personIds: [ids[0]!, ids[1]!] });
    next = addEvent(next, { kind: "education", date: blank, personIds: [ids[2]!] });
    const after = removePerson(next, ids[1]!);
    expect(after.events).toHaveLength(2);
    expect(after.events![0]!.personIds).toEqual([ids[0]]);
    const gone = removePerson(after, ids[2]!);
    expect(gone.events).toHaveLength(1);
  });

  it("leaves files without events alone", () => {
    const { data, ids } = family("Ada");
    expect(removePerson(data, ids[0]!).events).toBeUndefined();
    expect(withoutPerson([], ids[0]!)).toEqual([]);
  });
});
