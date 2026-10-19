import { describe, expect, it } from "vitest";
import {
  addPerson,
  canEditNames,
  DateOrderError,
  displayName,
  displayNameParts,
  emptyPersonForm,
  type FirstNameKind,
  inputFromPerson,
  type LastNameKind,
  lastNameSuggestions,
  lifeSummary,
  placeSuggestions,
  lifespan,
  MAX_NOTES_CHARS,
  type PersonFormInput,
  NameRequiredError,
  NamesNotEditableError,
  PersonNotFoundError,
  removePerson,
  suggestedStatus,
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
      value: "ada",
      kind: "birth",
      date: UNKNOWN_DATE,
      primary: true,
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
    const form = inputFromPerson(person);
    expect(form.firstNames[0]?.value).toBe("Ada");
    expect(form.lastNames[0]?.value).toBe("Lovelace");
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

describe("person dates and life status", () => {
  const empty = { year: "", month: "", day: "" };
  const d = (year: string, month = "", day = "") => ({ year, month, day });
  const base: FamilyData = { schemaVersion: 1, people: [], relationships: [] };

  it("adds a person with birth, deceased status and death date", () => {
    const data = addPerson(base, {
      firstName: "Ada",
      lastName: "Lovelace",
      birth: d("1815", "12", "10"),
      status: "deceased",
      death: d("1852", "11", "27"),
    });
    const person = data.people[0] as Person;
    expect(person.born?.birthDate.raw).toBe("1815-12-10T00:00");
    expect(person.lifeStatus).toMatchObject({ living: false });
    expect(lifeSummary(person)).toBe("born 10 Dec 1815 · died 27 Nov 1852");
    expect(lifespan(person)).toBe("1815–1852");
  });

  it("deceased without a death date is stored with an unknown date", () => {
    const person = addPerson(base, {
      firstName: "Ada",
      lastName: "",
      status: "deceased",
      death: empty,
    }).people[0] as Person;
    expect(person.lifeStatus).toMatchObject({ living: false, dateOfDeath: UNKNOWN_DATE });
    expect(lifeSummary(person)).toBe("deceased");
    expect(lifespan(person)).toBe("?–?");
  });

  it("living or unknown status ignores any death date", () => {
    for (const status of ["living", "unknown"] as const) {
      const person = addPerson(base, {
        firstName: "A",
        lastName: "",
        status,
        death: d("1900"),
      }).people[0] as Person;
      expect(person.lifeStatus === undefined || person.lifeStatus.living).toBe(true);
    }
  });

  it("no dates and unknown status store no facets", () => {
    const person = addPerson(base, { firstName: "A", lastName: "" }).people[0] as Person;
    expect(person.born).toBeUndefined();
    expect(person.lifeStatus).toBeUndefined();
    expect(lifeSummary(person)).toBe("");
    expect(lifespan(person)).toBe("");
  });

  it("lifespan variants", () => {
    const make = (extra: Partial<PersonFormInput>) =>
      addPerson(base, { firstName: "A", lastName: "", ...extra }).people[0] as Person;
    expect(lifespan(make({ birth: d("1990"), status: "living" }))).toBe("1990–");
    expect(lifespan(make({ birth: d("1815") }))).toBe("born 1815");
    expect(lifespan(make({ status: "living" }))).toBe("");
    expect(lifespan(make({ status: "deceased", death: d("1852") }))).toBe("?–1852");
    // A living person is not marked in the summary (the normal case).
    expect(lifeSummary(make({ status: "living" }))).toBe("");
    expect(lifeSummary(make({ status: "living", birth: d("1990") }))).toBe("born 1990");
  });

  it("rejects invalid dates and does not add the person", () => {
    expect(() => addPerson(base, { firstName: "A", lastName: "", birth: d("abc") })).toThrow(
      /Birth date: Year must be a number/,
    );
    expect(() =>
      addPerson(base, {
        firstName: "A",
        lastName: "",
        status: "deceased",
        death: d("1900", "4", "31"),
      }),
    ).toThrow(/Death date: That day does not exist/);
  });

  it("rejects death before birth, but not when undecidable", () => {
    expect(() =>
      addPerson(base, {
        firstName: "A",
        lastName: "",
        birth: d("1900"),
        status: "deceased",
        death: d("1850"),
      }),
    ).toThrow(DateOrderError);
    expect(() =>
      addPerson(base, {
        firstName: "A",
        lastName: "",
        birth: d("1900"),
        status: "deceased",
        death: d("1900", "5"),
      }),
    ).not.toThrow();
  });

  it("edit replaces facets that are sent, keeps those that are not", () => {
    const added = addPerson(base, {
      firstName: "Ada",
      lastName: "",
      birth: d("1815"),
      status: "living",
    });
    const id = (added.people[0] as Person).id;

    const namesOnly = updatePerson(added, id, { firstName: "Adeline", lastName: "" });
    expect((namesOnly.people[0] as Person).born?.birthDate.raw).toBe("1815-01-01T00:00");
    expect((namesOnly.people[0] as Person).lifeStatus).toMatchObject({ living: true });

    const cleared = updatePerson(added, id, {
      firstName: "Ada",
      lastName: "",
      birth: empty,
      status: "unknown",
      death: empty,
    });
    expect((cleared.people[0] as Person).born).toBeUndefined();
    expect((cleared.people[0] as Person).lifeStatus).toBeUndefined();
  });

  it("round-trips all facets through inputFromPerson", () => {
    const person = addPerson(base, {
      firstName: "Ada",
      lastName: "Lovelace",
      birth: d("1815", "12", "10"),
      status: "deceased",
      death: d("1852", "11", "27"),
    }).people[0] as Person;
    expect(inputFromPerson(person)).toEqual({
      firstNames: [{ value: "Ada", kind: "birth", date: empty, primary: true }],
      lastNames: [{ value: "Lovelace", kind: "birth", date: empty, primary: true }],
      birth: d("1815", "12", "10"),
      birthPlace: "",
      status: "deceased",
      death: d("1852", "11", "27"),
      deathPlace: "",
      notes: "",
    });
  });

  it("editing dates keeps a stored nickname", () => {
    const id = newId();
    const nicknamed: Person = {
      id,
      names: {
        id,
        firstNames: [
          { value: "Ada", kind: "birth", date: UNKNOWN_DATE },
          { value: "Addie", kind: "nickname", date: UNKNOWN_DATE },
        ],
      },
    };
    // The names form is locked for several-name people, so the nickname stays in the file.
    expect(() =>
      updatePerson({ ...base, people: [nicknamed] }, id, {
        firstName: "Ada",
        lastName: "",
        birth: d("1815"),
      }),
    ).toThrow(NamesNotEditableError);
    expect(nicknamed.names?.firstNames).toHaveLength(2);
  });
});

describe("several names per person", () => {
  const empty = { year: "", month: "", day: "" };
  const base: FamilyData = { schemaVersion: 1, people: [], relationships: [] };
  const first = (value: string, kind: FirstNameKind = "birth", primary = false) => ({
    value,
    kind,
    date: empty,
    primary,
  });
  const last = (value: string, kind: LastNameKind = "birth", primary = false) => ({
    value,
    kind,
    date: empty,
    primary,
  });
  const one = (data: FamilyData) => data.people[0] as Person;

  it("stores several first and last names with kinds", () => {
    const person = one(
      addPerson(base, {
        firstNames: [first("Ada", "birth", true), first("Addie", "nickname")],
        lastNames: [last("Byron", "birth", true), last("King", "married")],
      }),
    );
    expect(person.names?.firstNames?.map((n) => [n.value, n.kind])).toEqual([
      ["ada", "birth"],
      ["addie", "nickname"],
    ]);
    expect(person.names?.lastNames?.map((n) => n.kind)).toEqual(["birth", "married"]);
  });

  it("stores a partial date on a name and rejects an invalid one", () => {
    const person = one(
      addPerson(base, {
        firstNames: [first("Ada")],
        lastNames: [
          { ...last("King", "married", true), date: { year: "1835", month: "", day: "" } },
        ],
      }),
    );
    expect(person.names?.lastNames?.[0]?.date).toMatchObject({
      yearKnown: true,
      monthKnown: false,
    });
    expect(() =>
      addPerson(base, {
        firstNames: [{ ...first("Ada"), date: { year: "1815", month: "4", day: "31" } }],
        lastNames: [],
      }),
    ).toThrow(/First name date: That day does not exist/);
  });

  it("marks exactly one primary per list and displays it", () => {
    const person = one(
      addPerson(base, {
        firstNames: [first("Ada"), first("Addie", "nickname", true)],
        lastNames: [last("Byron", "birth", true)],
      }),
    );
    expect(person.names?.firstNames?.filter((n) => n.primary).map((n) => n.value)).toEqual([
      "addie",
    ]);
    expect(displayName(person)).toBe("Addie Byron");
  });

  it("falls back to the first entry when none is marked (old files)", () => {
    const id = newId();
    const old: Person = {
      id,
      names: {
        id,
        firstNames: [
          { value: "Ada", kind: "birth", date: UNKNOWN_DATE },
          { value: "Addie", kind: "nickname", date: UNKNOWN_DATE },
        ],
      },
    };
    expect(displayName(old)).toBe("Ada");
    const form = inputFromPerson(old);
    expect(form.firstNames.map((n) => n.primary)).toEqual([true, false]);
  });

  it("first marked primary wins when a corrupt file marks several", () => {
    const id = newId();
    const corrupt: Person = {
      id,
      names: {
        id,
        firstNames: [
          { value: "A", kind: "birth", date: UNKNOWN_DATE },
          { value: "B", kind: "other", date: UNKNOWN_DATE, primary: true },
          { value: "C", kind: "other", date: UNKNOWN_DATE, primary: true },
        ],
      },
    };
    expect(displayName(corrupt)).toBe("B");
  });

  it("drops blank rows and moves primary to the first remaining row if its row was blank", () => {
    const person = one(
      addPerson(base, {
        firstNames: [first("", "birth", true), first("Ada"), first("Addie")],
        lastNames: [last(" ")],
      }),
    );
    expect(person.names?.firstNames?.map((n) => n.value)).toEqual(["ada", "addie"]);
    expect(person.names?.firstNames?.[0]?.primary).toBe(true);
    expect(person.names?.lastNames).toEqual([]);
  });

  it("requires a name even with lists", () => {
    expect(() => addPerson(base, { firstNames: [first(" ")], lastNames: [last("")] })).toThrow(
      NameRequiredError,
    );
  });

  it("keeps list order, so Up/Down changes the stored order", () => {
    const person = one(
      addPerson(base, { firstNames: [first("B"), first("A", "birth", true)], lastNames: [] }),
    );
    expect(person.names?.firstNames?.map((n) => n.value)).toEqual(["b", "a"]);
  });

  it("edits a person who has several names without losing any", () => {
    const added = addPerson(base, {
      firstNames: [first("Ada", "birth", true), first("Addie", "nickname")],
      lastNames: [last("Byron", "birth", true)],
    });
    const id = one(added).id;
    const form = inputFromPerson(one(added));
    const edited = updatePerson(added, id, {
      ...form,
      birth: { year: "1815", month: "", day: "" },
    });
    const person = one(edited);
    expect(person.names?.firstNames?.map((n) => [n.value, n.kind])).toEqual([
      ["ada", "birth"],
      ["addie", "nickname"],
    ]);
    expect(person.born?.birthDate.yearKnown).toBe(true);
  });

  it("the shorthand strings are still refused for people with several names", () => {
    const added = addPerson(base, {
      firstNames: [first("Ada"), first("Addie", "nickname")],
      lastNames: [],
    });
    expect(() => updatePerson(added, one(added).id, { firstName: "X", lastName: "" })).toThrow(
      NamesNotEditableError,
    );
  });
});

describe("displayName with a birth last name", () => {
  const blank = { year: "", month: "", day: "" };
  const row = <K extends string>(value: string, kind: K, primary: boolean) => ({
    value,
    kind,
    date: blank,
    primary,
  });
  const person = (lastNames: ReturnType<typeof row<LastNameKind>>[]) =>
    onlyPerson(
      addPerson(EMPTY, { firstNames: [row("Marie", "birth" as FirstNameKind, true)], lastNames }),
    );

  it("shows née when the main last name differs from the birth name", () => {
    const p = person([row("Martin", "birth", false), row("Dubois", "married", true)]);
    expect(displayName(p)).toBe("Marie Dubois (née Martin)");
    expect(displayNameParts(p)).toEqual({ name: "Marie Dubois", birthName: "Martin" });
  });

  it("shows no née when the birth name is the main one", () => {
    const p = person([row("Martin", "birth", true), row("Dubois", "married", false)]);
    expect(displayName(p)).toBe("Marie Martin");
  });

  it("shows no née without a birth-kind last name or with a single name", () => {
    expect(displayName(person([row("Dubois", "married", true)]))).toBe("Marie Dubois");
    expect(displayName(person([row("Martin", "birth", true)]))).toBe("Marie Martin");
  });
});

describe("life status default", () => {
  it("a new person form starts as living", () => {
    expect(emptyPersonForm().status).toBe("living");
  });

  it("suggests deceased only for birth years more than 110 years ago", () => {
    expect(suggestedStatus("1815", 2026)).toBe("deceased");
    expect(suggestedStatus("1916", 2026)).toBe("living"); // exactly 110
    expect(suggestedStatus("1915", 2026)).toBe("deceased"); // 111
    expect(suggestedStatus("1990", 2026)).toBe("living");
  });

  it("suggests living for blank, partial or invalid input", () => {
    expect(suggestedStatus("", 2026)).toBe("living");
    expect(suggestedStatus("  ", 2026)).toBe("living");
    expect(suggestedStatus("abc", 2026)).toBe("living");
    expect(suggestedStatus("0", 2026)).toBe("living");
    expect(suggestedStatus("12345", 2026)).toBe("living");
  });
});

describe("lastNameSuggestions", () => {
  const blank = { year: "", month: "", day: "" };
  const withLast = (data: FamilyData, names: [string, "birth" | "married"][]) =>
    addPerson(data, {
      firstName: "X",
      lastNames: names.map(([value, kind], i) => ({
        value,
        kind,
        date: blank,
        primary: i === 0,
      })),
    });

  it("lists names most frequent first, then alphabetical", () => {
    let data = EMPTY;
    for (const name of ["Martin", "Dubois", "Dubois", "Abel"])
      data = withLast(data, [[name, "birth"]]);
    expect(lastNameSuggestions(data.people)).toEqual(["Dubois", "Abel", "Martin"]);
  });

  it("includes married names and ignores blanks", () => {
    let data = withLast(EMPTY, [
      ["Martin", "birth"],
      ["Dubois", "married"],
    ]);
    data = addPerson(data, { firstName: "Solo", lastName: "" });
    expect(lastNameSuggestions(data.people)).toEqual(["Dubois", "Martin"]);
  });

  it("merges spellings that differ only in case, keeping the most common one", () => {
    let data = EMPTY;
    for (const name of ["dubois", "Dubois", "Dubois"]) data = withLast(data, [[name, "birth"]]);
    expect(lastNameSuggestions(data.people)).toEqual(["Dubois"]);
  });

  it("is empty when nobody has a last name", () => {
    expect(lastNameSuggestions([])).toEqual([]);
    expect(
      lastNameSuggestions(addPerson(EMPTY, { firstName: "Ada", lastName: "" }).people),
    ).toEqual([]);
  });
});

describe("no future dates", () => {
  const nextYear = String(new Date().getFullYear() + 1);
  const blank = { year: "", month: "", day: "" };

  it("rejects a future birth date", () => {
    expect(() =>
      addPerson(EMPTY, { firstName: "Ada", lastName: "", birth: { ...blank, year: nextYear } }),
    ).toThrow("Birth date cannot be in the future.");
  });

  it("rejects a future death date", () => {
    expect(() =>
      addPerson(EMPTY, {
        firstName: "Ada",
        lastName: "",
        status: "deceased",
        death: { ...blank, year: nextYear },
      }),
    ).toThrow("Death date cannot be in the future.");
  });

  it("accepts this year (partial) and past dates", () => {
    const year = String(new Date().getFullYear());
    expect(() =>
      addPerson(EMPTY, { firstName: "Ada", lastName: "", birth: { ...blank, year } }),
    ).not.toThrow();
    expect(() =>
      addPerson(EMPTY, { firstName: "Ada", lastName: "", birth: { ...blank, year: "1815" } }),
    ).not.toThrow();
  });
});

describe("birth and death places", () => {
  const blank = { year: "", month: "", day: "" };

  it("stores a trimmed birth place with the birth date", () => {
    const p = onlyPerson(
      addPerson(EMPTY, {
        firstName: "Ada",
        lastName: "",
        birth: { ...blank, year: "1815" },
        birthPlace: "  London, UK ",
      }),
    );
    expect(p.born?.birthPlace).toBe("London, UK");
    expect(p.born?.birthDate.yearKnown).toBe(true);
  });

  it("keeps a place without a date, with a fully unknown date", () => {
    const p = onlyPerson(
      addPerson(EMPTY, { firstName: "Ada", lastName: "", birth: blank, birthPlace: "Lyon" }),
    );
    expect(p.born).toMatchObject({ birthPlace: "Lyon", birthDate: { yearKnown: false } });
  });

  it("stores no birth facet without a date or a place, and no empty place field", () => {
    const none = onlyPerson(addPerson(EMPTY, { firstName: "Ada", lastName: "", birth: blank }));
    expect(none.born).toBeUndefined();
    const dated = onlyPerson(
      addPerson(EMPTY, {
        firstName: "Ada",
        lastName: "",
        birth: { ...blank, year: "1900" },
        birthPlace: "   ",
      }),
    );
    expect("birthPlace" in (dated.born ?? {})).toBe(false);
  });

  it("stores the death place only for a deceased person", () => {
    const deceased = onlyPerson(
      addPerson(EMPTY, {
        firstName: "Ada",
        lastName: "",
        status: "deceased",
        death: { ...blank, year: "1852" },
        deathPlace: "Paris",
      }),
    );
    expect(deceased.lifeStatus).toMatchObject({ living: false, placeOfDeath: "Paris" });
    const living = onlyPerson(
      addPerson(EMPTY, { firstName: "Ada", lastName: "", status: "living", deathPlace: "Paris" }),
    );
    expect(living.lifeStatus).toEqual({ id: living.id, living: true });
  });

  it("round-trips through the form values and survives edits that omit places", () => {
    const added = addPerson(EMPTY, {
      firstName: "Ada",
      lastName: "",
      birth: { ...blank, year: "1815" },
      birthPlace: "London",
      status: "deceased",
      death: { ...blank, year: "1852" },
      deathPlace: "Paris",
    });
    const person = onlyPerson(added);
    expect(inputFromPerson(person)).toMatchObject({ birthPlace: "London", deathPlace: "Paris" });
    // A caller that only renames leaves birth and death (and places) untouched.
    const renamed = onlyPerson(
      updatePerson(added, person.id, { firstName: "Adaline", lastName: "" }),
    );
    expect(renamed.born?.birthPlace).toBe("London");
    expect(renamed.lifeStatus).toMatchObject({ placeOfDeath: "Paris" });
    // The form sends everything: an emptied place is removed.
    const cleared = onlyPerson(
      updatePerson(added, person.id, {
        ...inputFromPerson(person),
        birthPlace: "",
      }),
    );
    expect(cleared.born && "birthPlace" in cleared.born).toBe(false);
  });

  it("loads old files without places", () => {
    const old = onlyPerson(
      addPerson(EMPTY, { firstName: "Ada", lastName: "", birth: { ...blank, year: "1815" } }),
    );
    expect(inputFromPerson(old).birthPlace).toBe("");
    expect(inputFromPerson(old).deathPlace).toBe("");
  });
});

describe("placeSuggestions", () => {
  it("ranks birth and death places together, most frequent first, ignoring case", () => {
    const blank = { year: "", month: "", day: "" };
    let data = EMPTY;
    for (const place of ["Lyon", "Paris", "lyon", "Nice"]) {
      data = addPerson(data, { firstName: "X", lastName: "", birth: blank, birthPlace: place });
    }
    data = addPerson(data, {
      firstName: "Y",
      lastName: "",
      status: "deceased",
      death: blank,
      deathPlace: "Paris",
    });
    expect(placeSuggestions(data.people)).toEqual(["Lyon", "Paris", "Nice"]);
  });
});

describe("person notes", () => {
  const empty: FamilyData = { schemaVersion: 1, people: [], relationships: [] };

  it("stores a trimmed note with its line breaks, and none when blank", () => {
    const withNote = addPerson(empty, {
      firstName: "Ada",
      lastName: "",
      notes: "  Line 1\nLine 2  ",
    });
    expect(withNote.people[0]?.notes).toBe("Line 1\nLine 2");
    const blank = addPerson(empty, { firstName: "Ada", lastName: "", notes: "   " });
    expect(blank.people[0]).not.toHaveProperty("notes");
  });

  it("caps the length", () => {
    const long = "x".repeat(MAX_NOTES_CHARS + 50);
    const d = addPerson(empty, { firstName: "Ada", lastName: "", notes: long });
    expect(d.people[0]?.notes).toHaveLength(MAX_NOTES_CHARS);
  });

  it("keeps the note when an edit does not send one, replaces it, and removes it when emptied", () => {
    let d = addPerson(empty, { firstName: "Ada", lastName: "", notes: "Kept" });
    const id = d.people[0]!.id;
    d = updatePerson(d, id, { firstName: "Ada", lastName: "" });
    expect(d.people[0]?.notes).toBe("Kept");
    d = updatePerson(d, id, { firstName: "Ada", lastName: "", notes: "New" });
    expect(d.people[0]?.notes).toBe("New");
    d = updatePerson(d, id, { firstName: "Ada", lastName: "", notes: "" });
    expect(d.people[0]).not.toHaveProperty("notes");
  });

  it("round-trips through the form values", () => {
    const d = addPerson(empty, { firstName: "Ada", lastName: "", notes: "Hello" });
    expect(inputFromPerson(d.people[0]!).notes).toBe("Hello");
    expect(emptyPersonForm().notes).toBe("");
  });
});
