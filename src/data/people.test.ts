import { describe, expect, it } from "vitest";
import {
  addPerson,
  canEditNames,
  displayName,
  inputFromPerson,
  NameRequiredError,
  NamesNotEditableError,
  PersonNotFoundError,
  removePerson,
  UNKNOWN_DATE,
  updatePerson,
} from "./people.ts";
import {
  createUuidId,
  type FamilyData,
  type Person,
  type PersonBorn,
  type PersonId,
} from "./types.ts";

const EMPTY: FamilyData = { schemaVersion: 1, people: [], relationships: [] };

function newId(): PersonId {
  return createUuidId<"PersonId">();
}

function onlyPerson(data: FamilyData): Person {
  const person = data.people[0];
  if (!person) throw new Error("expected one person");
  return person;
}

describe("addPerson", () => {
  it("adds a person with both names and a new id", () => {
    const data = addPerson(EMPTY, { firstName: "Ada", lastName: "Lovelace" });
    const person = onlyPerson(data);
    expect(displayName(person)).toBe("Ada Lovelace");
    expect(person.names?.id).toBe(person.id);
    expect(EMPTY.people).toHaveLength(0); // input not mutated
  });

  it("adds a person with only a last name (no first name)", () => {
    const person = onlyPerson(addPerson(EMPTY, { firstName: "", lastName: "Lovelace" }));
    expect(person.names?.firstNames).toBeUndefined();
    expect(displayName(person)).toBe("Lovelace");
  });

  it("adds a person with only a first name", () => {
    const person = onlyPerson(addPerson(EMPTY, { firstName: "Ada", lastName: "  " }));
    expect(person.names?.lastNames).toEqual([]);
    expect(displayName(person)).toBe("Ada");
  });

  it("trims names and stores them as birth names with an unknown date", () => {
    const person = onlyPerson(addPerson(EMPTY, { firstName: "  Ada ", lastName: "" }));
    expect(person.names?.firstNames?.[0]).toEqual({
      value: "Ada",
      kind: "birth",
      date: UNKNOWN_DATE,
    });
  });

  it("rejects blank input", () => {
    expect(() => addPerson(EMPTY, { firstName: " ", lastName: "" })).toThrow(NameRequiredError);
  });

  it("generates unique ids", () => {
    let data = addPerson(EMPTY, { firstName: "A", lastName: "" });
    data = addPerson(data, { firstName: "A", lastName: "" });
    expect(new Set(data.people.map((p) => p.id)).size).toBe(2);
  });
});

describe("updatePerson", () => {
  it("renames and keeps the same id", () => {
    const added = addPerson(EMPTY, { firstName: "Ada", lastName: "Byron" });
    const id = onlyPerson(added).id;
    const updated = updatePerson(added, id, { firstName: "Ada", lastName: "Lovelace" });
    expect(onlyPerson(updated).id).toBe(id);
    expect(displayName(onlyPerson(updated))).toBe("Ada Lovelace");
  });

  it("preserves birth and life status", () => {
    const id = newId();
    const born: PersonBorn = {
      id,
      birthDate: {
        raw: "1815-12-10T00:00",
        yearKnown: true,
        monthKnown: true,
        dayKnown: true,
        hourKnown: false,
        minuteKnown: false,
      },
    };
    const data: FamilyData = {
      ...EMPTY,
      people: [{ id, born, lifeStatus: { id, living: true } }],
    };
    const updated = onlyPerson(updatePerson(data, id, { firstName: "Ada", lastName: "" }));
    expect(updated.born).toEqual(born);
    expect(updated.lifeStatus).toEqual({ id, living: true });
  });

  it("refuses to edit a person with several names", () => {
    const id = newId();
    const person: Person = {
      id,
      names: {
        id,
        firstNames: [
          { value: "Ada", kind: "birth", date: UNKNOWN_DATE },
          { value: "Addie", kind: "nickname", date: UNKNOWN_DATE },
        ],
      },
    };
    expect(canEditNames(person)).toBe(false);
    expect(() =>
      updatePerson({ ...EMPTY, people: [person] }, id, { firstName: "X", lastName: "" }),
    ).toThrow(NamesNotEditableError);
  });

  it("rejects blank input and unknown ids", () => {
    const added = addPerson(EMPTY, { firstName: "Ada", lastName: "" });
    const id = onlyPerson(added).id;
    expect(() => updatePerson(added, id, { firstName: "", lastName: "" })).toThrow(
      NameRequiredError,
    );
    expect(() => updatePerson(added, newId(), { firstName: "A", lastName: "" })).toThrow(
      PersonNotFoundError,
    );
  });

  it("round-trips through inputFromPerson", () => {
    const person = onlyPerson(addPerson(EMPTY, { firstName: "Ada", lastName: "Lovelace" }));
    expect(inputFromPerson(person)).toEqual({ firstName: "Ada", lastName: "Lovelace" });
  });
});

describe("removePerson", () => {
  it("removes the person", () => {
    const added = addPerson(EMPTY, { firstName: "Ada", lastName: "" });
    expect(removePerson(added, onlyPerson(added).id).people).toHaveLength(0);
  });

  it("throws for an unknown id", () => {
    expect(() => removePerson(EMPTY, newId())).toThrow(PersonNotFoundError);
  });
});

describe("displayName", () => {
  it("falls back for a person with no names", () => {
    expect(displayName({ id: newId() })).toBe("Unnamed person");
  });
});
