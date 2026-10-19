import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { addPerson, displayName } from "../data/people.ts";
import { addPartners } from "../data/relationships.ts";
import type { FamilyData } from "../data/types.ts";
import type { PlatformAPI } from "../platform/PlatformAPI.ts";
import { defineFamilyStore } from "./family.ts";

const EMPTY: FamilyData = { schemaVersion: 1, people: [], relationships: [] };

interface FakeOptions {
  lastPath?: string | null;
  existingFiles?: string[];
  openResult?: string | null;
  saveResult?: string | null;
  loadError?: Error;
  confirmResult?: boolean;
  saveError?: Error;
  gitStatus?: "no-git" | "not-repo" | "no-remote" | "ready";
  gitSync?: () => Promise<"committed" | "no-changes">;
  pickImages?: { name: string; dataUrl: string }[];
}

function fakePlatform(options: FakeOptions = {}) {
  let lastPath = options.lastPath ?? null;
  let failSaves = false;
  const files = new Map<string, FamilyData>(
    (options.existingFiles ?? []).map((path) => [path, EMPTY]),
  );
  /** Raw text of files written or seeded as text (imports, backups). */
  const raw = new Map<string, string>();
  const save = vi.fn(async (path: string, data: FamilyData) => {
    if (options.saveError && failSaves) throw options.saveError;
    files.set(path, data);
    raw.delete(path);
  });
  const platform: PlatformAPI = {
    openFileDialog: async () => options.openResult ?? null,
    saveFileDialog: async () => options.saveResult ?? null,
    data: {
      exists: async (path) => files.has(path),
      load: async (path) => {
        if (options.loadError) throw options.loadError;
        return files.get(path) ?? EMPTY;
      },
      save,
      readRaw: async (path) => {
        const text = raw.get(path);
        if (text !== undefined) return text;
        const parsed = files.get(path);
        if (!parsed) throw new Error(`no such file: ${path}`);
        return JSON.stringify(parsed, null, 2);
      },
      writeRaw: async (path, text) => {
        raw.set(path, text);
      },
    },
    settings: {
      getLastFilePath: async () => lastPath,
      setLastFilePath: async (path) => {
        lastPath = path;
      },
      getLanguage: async () => null,
      setLanguage: async () => {},
      getTheme: async () => null,
      setTheme: async () => {},
      getDismissedUpdate: async () => null,
      setDismissedUpdate: async () => {},
    },
    confirm: async () => options.confirmResult ?? true,
    git: {
      status: async () => options.gitStatus ?? "not-repo",
      sync: options.gitSync ?? (async () => "committed"),
    },
    pickImages: async () => options.pickImages ?? [],
    window: { setTitle: async () => {} },
    openExternal: async () => {},
    exit: async () => {},
  };
  return {
    platform,
    save,
    files,
    raw,
    getLastPath: () => lastPath,
    failSavesFromNowOn: () => {
      failSaves = true;
    },
  };
}

function makeStore(options?: FakeOptions) {
  const fake = fakePlatform(options);
  setActivePinia(createPinia());
  return { store: defineFamilyStore(fake.platform, async (dataUrl) => dataUrl)(), ...fake };
}

describe("family store: welcome screen", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("starts on the welcome screen (no file loaded)", () => {
    const { store } = makeStore();
    expect(store.filePath).toBeNull();
  });

  describe("resume", () => {
    it("is enabled and shows the file name when the remembered file exists", async () => {
      const path = "C:\\families\\smith.json";
      const { store } = makeStore({ lastPath: path, existingFiles: [path] });
      await store.init();
      expect(store.resumePath).toBe(path);
      expect(store.resumeFileName).toBe("smith.json");
    });

    it("is disabled when nothing is remembered", async () => {
      const { store } = makeStore();
      await store.init();
      expect(store.resumePath).toBeNull();
      expect(store.error).toBeNull();
    });

    it("is disabled with a message, and creates no file, when the remembered file is gone", async () => {
      const { store, save, files } = makeStore({ lastPath: "/gone.json" });
      await store.init();
      expect(store.resumePath).toBeNull();
      expect(store.error).toContain("not found");
      expect(save).not.toHaveBeenCalled();
      expect(files.size).toBe(0);
    });

    it("loads the remembered file and leaves the welcome screen", async () => {
      const path = "/a/family.json";
      const { store } = makeStore({ lastPath: path, existingFiles: [path] });
      await store.init();
      await store.resume();
      expect(store.filePath).toBe(path);
      expect(store.data).toEqual(EMPTY);
    });
  });

  describe("open existing", () => {
    it("loads the picked file and remembers its path", async () => {
      const path = "/b/family.json";
      const { store, getLastPath } = makeStore({ existingFiles: [path], openResult: path });
      await store.openExisting();
      expect(store.filePath).toBe(path);
      expect(getLastPath()).toBe(path);
    });

    it("stays on the welcome screen without error when cancelled", async () => {
      const { store } = makeStore({ openResult: null });
      await store.openExisting();
      expect(store.filePath).toBeNull();
      expect(store.error).toBeNull();
    });

    it("shows an error, stays put and does not write when the file is not valid JSON", async () => {
      const path = "/bad.json";
      const { store, save, getLastPath } = makeStore({
        existingFiles: [path],
        openResult: path,
        loadError: new SyntaxError("Unexpected token"),
      });
      await store.openExisting();
      expect(store.filePath).toBeNull();
      expect(store.error).toBe("The file is not valid JSON.");
      expect(save).not.toHaveBeenCalled();
      expect(getLastPath()).toBeNull();
    });
  });

  describe("create new", () => {
    it("writes an empty family at the chosen path and remembers it", async () => {
      const path = "/new/family.json";
      const { store, files, getLastPath } = makeStore({ saveResult: path });
      await store.createNew();
      expect(files.get(path)).toEqual(EMPTY);
      expect(store.filePath).toBe(path);
      expect(getLastPath()).toBe(path);
    });

    it("writes nothing when cancelled", async () => {
      const { store, save } = makeStore({ saveResult: null });
      await store.createNew();
      expect(save).not.toHaveBeenCalled();
      expect(store.filePath).toBeNull();
    });
  });
});

describe("family store: people", () => {
  async function loadedStore(options: FakeOptions = {}) {
    const path = "/p/family.json";
    const made = makeStore({ ...options, saveResult: path });
    await made.store.createNew();
    return { ...made, path };
  }

  it("adds a person and persists it to the file", async () => {
    const { store, files, path } = await loadedStore();
    expect(await store.addPerson({ firstName: "Ada", lastName: "Lovelace" })).toBe(true);
    expect(store.data?.people).toHaveLength(1);
    expect(files.get(path)?.people).toHaveLength(1);
  });

  it("survives a restart: a fresh store resumes and sees the person", async () => {
    const { store, platform } = await loadedStore();
    await store.addPerson({ firstName: "Ada", lastName: "" });
    setActivePinia(createPinia());
    const restarted = defineFamilyStore(platform)();
    await restarted.init();
    await restarted.resume();
    expect(restarted.data?.people).toHaveLength(1);
  });

  it("rejects a blank person with a message and does not save", async () => {
    const { store, save } = await loadedStore();
    save.mockClear();
    expect(await store.addPerson({ firstName: " ", lastName: "" })).toBe(false);
    expect(store.error).toBe("At least one name is required.");
    expect(save).not.toHaveBeenCalled();
    expect(store.data?.people).toHaveLength(0);
  });

  it("does not show the person and reports an error when saving fails", async () => {
    const { store, failSavesFromNowOn } = await loadedStore({ saveError: new Error("disk full") });
    failSavesFromNowOn();
    expect(await store.addPerson({ firstName: "Ada", lastName: "" })).toBe(false);
    expect(store.data?.people).toHaveLength(0);
    expect(store.error).toBe(
      "Could not write to family.json. Check that the file is present and writable.",
    );
  });

  it("renames a person, keeping the id", async () => {
    const { store } = await loadedStore();
    await store.addPerson({ firstName: "Ada", lastName: "Byron" });
    const id = store.data?.people[0]?.id;
    if (!id) throw new Error("no person");
    expect(await store.editPerson(id, { firstName: "Ada", lastName: "Lovelace" })).toBe(true);
    expect(store.data?.people[0]?.id).toBe(id);
    expect(store.data?.people[0]?.names?.lastNames?.[0]?.value).toBe("lovelace");
  });

  it("deletes after confirmation", async () => {
    const { store, files, path } = await loadedStore({ confirmResult: true });
    await store.addPerson({ firstName: "Ada", lastName: "" });
    const id = store.data?.people[0]?.id;
    if (!id) throw new Error("no person");
    expect(await store.deletePerson(id, "Ada")).toBe(true);
    expect(store.data?.people).toHaveLength(0);
    expect(files.get(path)?.people).toHaveLength(0);
  });

  it("keeps the person when the confirmation is cancelled", async () => {
    const { store } = await loadedStore({ confirmResult: false });
    await store.addPerson({ firstName: "Ada", lastName: "" });
    const id = store.data?.people[0]?.id;
    if (!id) throw new Error("no person");
    expect(await store.deletePerson(id, "Ada")).toBe(false);
    expect(store.data?.people).toHaveLength(1);
  });

  it("keeps both people when two adds are fired back to back", async () => {
    const { store, files, path } = await loadedStore();
    await Promise.all([
      store.addPerson({ firstName: "A", lastName: "" }),
      store.addPerson({ firstName: "B", lastName: "" }),
    ]);
    expect(store.data?.people).toHaveLength(2);
    expect(files.get(path)?.people).toHaveLength(2);
  });
});

describe("family store: relationships", () => {
  async function twoPeople(options: FakeOptions = {}) {
    const path = "/r/family.json";
    const made = makeStore({ ...options, saveResult: path });
    await made.store.createNew();
    await made.store.addPerson({ firstName: "Ada", lastName: "" });
    await made.store.addPerson({ firstName: "Byron", lastName: "" });
    const [a, b] = made.store.data?.people ?? [];
    if (!a || !b) throw new Error("people missing");
    return { ...made, path, a: a.id, b: b.id };
  }

  it("adds a parent-child link and persists it", async () => {
    const { store, files, path, a, b } = await twoPeople();
    expect(await store.addParentChild({ parentId: a, childId: b, nature: "adoptive" })).toBe(true);
    expect(files.get(path)?.relationships).toHaveLength(1);
  });

  it("reports a cycle error and does not save", async () => {
    const { store, save, a, b } = await twoPeople();
    await store.addParentChild({ parentId: a, childId: b, nature: "adoptive" });
    save.mockClear();
    expect(await store.addParentChild({ parentId: b, childId: a, nature: "adoptive" })).toBe(false);
    expect(store.error).toMatch(/cycle/);
    expect(save).not.toHaveBeenCalled();
    expect(store.data?.relationships).toHaveLength(1);
  });

  it("adds partners and rejects the reversed duplicate", async () => {
    const { store, a, b } = await twoPeople();
    expect(await store.addPartners({ personAId: a, personBId: b, status: "ongoing" })).toBe(true);
    expect(await store.addPartners({ personAId: b, personBId: a, status: "ongoing" })).toBe(false);
    expect(store.error).toMatch(/already exists/);
  });

  it("edits a relationship, persists it, and keeps state on failure", async () => {
    const { store, files, save, path, a, b } = await twoPeople();
    await store.addParentChild({ parentId: a, childId: b, nature: "adoptive" });
    const rid = store.data?.relationships[0]?.id;
    if (!rid) throw new Error("no relationship");
    const blank = { year: "", month: "", day: "" };
    const foster = {
      parentId: a,
      childId: b,
      nature: "foster" as const,
      status: "ongoing" as const,
      start: { ...blank, year: "2000" },
      end: blank,
    };
    expect(await store.editRelationship(rid, foster)).toBe(true);
    expect(files.get(path)?.relationships[0]).toMatchObject({ id: rid, nature: "foster" });

    save.mockClear();
    const bad = { ...foster, status: "ended" as const, end: { ...blank, year: "1990" } };
    expect(await store.editRelationship(rid, bad)).toBe(false);
    expect(store.error).toMatch(/end date/);
    expect(save).not.toHaveBeenCalled();
    expect(store.data?.relationships[0]).toMatchObject({ nature: "foster", status: "ongoing" });
  });

  it("adds two parents in a single save, and nothing when one link is invalid", async () => {
    const { store, save, a, b } = await twoPeople();
    await store.addPerson({ firstName: "Cleo", lastName: "" });
    const c = store.data?.people[2]?.id;
    if (!c) throw new Error("no third person");
    save.mockClear();
    expect(
      await store.addParents({ parentAId: a, parentBId: b, childId: c, nature: "adoptive" }),
    ).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
    expect(store.data?.relationships).toHaveLength(2);

    save.mockClear();
    expect(
      await store.addParents({ parentAId: a, parentBId: b, childId: c, nature: "adoptive" }),
    ).toBe(false);
    expect(store.error).toMatch(/already exists/);
    expect(save).not.toHaveBeenCalled();
    expect(store.data?.relationships).toHaveLength(2);
  });

  it("adds a person with parents in a single save, and nothing when it fails", async () => {
    const { store, save, a, b } = await twoPeople();
    save.mockClear();
    expect(
      await store.addPerson(
        { firstName: "Cleo", lastName: "" },
        { parentIds: [a, b], nature: "adoptive" },
      ),
    ).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
    expect(store.data?.people).toHaveLength(3);
    expect(store.data?.relationships).toHaveLength(2);

    save.mockClear();
    expect(
      await store.addPerson(
        { firstName: "Dan", lastName: "" },
        { parentIds: [a, a], nature: "adoptive" },
      ),
    ).toBe(false);
    expect(store.error).toMatch(/different people/);
    expect(save).not.toHaveBeenCalled();
    expect(store.data?.people).toHaveLength(3);
  });

  it("deletes a relationship only after confirmation", async () => {
    const declined = await twoPeople({ confirmResult: false });
    await declined.store.addPartners({
      personAId: declined.a,
      personBId: declined.b,
      status: "ongoing",
    });
    const relId = declined.store.data?.relationships[0]?.id;
    if (!relId) throw new Error("no relationship");
    expect(await declined.store.deleteRelationship(relId, "x")).toBe(false);
    expect(declined.store.data?.relationships).toHaveLength(1);

    const accepted = await twoPeople({ confirmResult: true });
    await accepted.store.addPartners({
      personAId: accepted.a,
      personBId: accepted.b,
      status: "ongoing",
    });
    const id2 = accepted.store.data?.relationships[0]?.id;
    if (!id2) throw new Error("no relationship");
    expect(await accepted.store.deleteRelationship(id2, "x")).toBe(true);
    expect(accepted.store.data?.relationships).toHaveLength(0);
  });

  it("deleting a person cascades and the confirmation states the count", async () => {
    const messages: string[] = [];
    const { store, platform, a, b, path } = await twoPeople();
    platform.confirm = async (message) => {
      messages.push(message);
      return true;
    };
    await store.addParentChild({ parentId: a, childId: b, nature: "adoptive" });
    await store.addPartners({ personAId: a, personBId: b, status: "ongoing" });
    expect(await store.deletePerson(a, "Ada")).toBe(true);
    expect(messages[0]).toContain("2 relationships");
    expect(store.data?.relationships).toHaveLength(0);
    expect(store.data?.people).toHaveLength(1);
    expect(path).toBeTruthy();
  });
});

describe("family store: export", () => {
  /** A loaded family whose save dialog returns the next path in `dialogPaths`. */
  async function loaded(dialogPaths: (string | null)[]) {
    const original = "/orig/family.json";
    const queue = [original, ...dialogPaths];
    const fake = fakePlatform();
    fake.platform.saveFileDialog = async () => queue.shift() ?? null;
    setActivePinia(createPinia());
    const store = defineFamilyStore(fake.platform)();
    await store.createNew();
    await store.addPerson({ firstName: "Ada", lastName: "" });
    return { ...fake, store, original };
  }

  it("writes the same data to the chosen file and keeps the original open", async () => {
    const { store, files, original, getLastPath } = await loaded(["/backup/copy.json"]);
    expect(await store.exportFamily()).toBe(true);
    expect(files.get("/backup/copy.json")).toEqual(files.get(original));
    expect(files.get("/backup/copy.json")?.people).toHaveLength(1);
    expect(store.filePath).toBe(original);
    expect(getLastPath()).toBe(original);
    expect(store.notice).toBe(
      "Exported to /backup/copy.json: 1 person · 0 relationships · 0 events · 0 photos.",
    );
  });

  it("does nothing, silently, when cancelled", async () => {
    const { store, save } = await loaded([null]);
    save.mockClear();
    expect(await store.exportFamily()).toBe(false);
    expect(save).not.toHaveBeenCalled();
    expect(store.notice).toBeNull();
    expect(store.error).toBeNull();
  });

  it("refuses the file that is currently open, ignoring case and slash style", async () => {
    const { store, save } = await loaded(["/ORIG\\Family.json"]);
    save.mockClear();
    expect(await store.exportFamily()).toBe(false);
    expect(store.error).toContain("different file");
    expect(save).not.toHaveBeenCalled();
  });

  it("reports a write failure and leaves the open family untouched", async () => {
    const { store, platform } = await loaded(["/x/copy.json"]);
    platform.data.save = async () => {
      throw new Error("disk full");
    };
    expect(await store.exportFamily()).toBe(false);
    expect(store.error).toBe(
      "Could not write to copy.json. Check that the file is present and writable.",
    );
    expect(store.notice).toBeNull();
    expect(store.data?.people).toHaveLength(1);
  });

  it("clears the notice when the user edits something else", async () => {
    const { store } = await loaded(["/b/copy.json"]);
    await store.exportFamily();
    expect(store.notice).not.toBeNull();
    await store.addPerson({ firstName: "Byron", lastName: "" });
    expect(store.notice).toBeNull();
  });
});

describe("family store: import and close", () => {
  const withZed = addPerson(EMPTY, { firstName: "Zed", lastName: "" });
  const incoming = JSON.stringify(withZed);
  const firstName = (store: { data: FamilyData | null }) =>
    store.data?.people[0] ? displayName(store.data.people[0]) : undefined;

  async function loaded(source: string | null = "/in/other.json", confirmResult = true) {
    const queue = ["/orig/family.json"];
    const fake = fakePlatform({ openResult: source, confirmResult });
    fake.platform.saveFileDialog = async () => queue.shift() ?? null;
    const confirms: string[] = [];
    const confirm = fake.platform.confirm;
    fake.platform.confirm = async (m) => {
      confirms.push(m);
      return confirm(m);
    };
    setActivePinia(createPinia());
    const store = defineFamilyStore(fake.platform)();
    await store.createNew();
    await store.addPerson({ firstName: "Ada", lastName: "" });
    if (source) fake.raw.set(source, incoming);
    return { ...fake, store, confirms };
  }

  it("backs up the previous file, then replaces the family", async () => {
    const { store, raw, files, confirms } = await loaded();
    const previous = JSON.stringify(files.get("/orig/family.json"), null, 2);
    expect(await store.importFamily()).toBe(true);
    const backups = [...raw.keys()].filter((k) => k.includes(".backup-"));
    expect(backups).toHaveLength(1);
    expect(backups[0]).toMatch(/^\/orig\/family\.backup-\d{8}-\d{6}-[0-9a-f]{8}\.json$/);
    expect(raw.get(backups[0]!)).toBe(previous);
    expect(store.data?.people.map(displayName)).toEqual(["Zed"]);
    expect(files.get("/orig/family.json")?.people).toHaveLength(1);
    expect(confirms[0]).toContain("REPLACED");
    expect(store.notice).toContain("Imported other.json");
    expect(store.error).toBeNull();
  });

  it("does nothing when the file dialog or the confirmation is cancelled", async () => {
    for (const [source, confirmResult] of [
      [null, true],
      ["/in/other.json", false],
    ] as const) {
      const { store, raw } = await loaded(source, confirmResult);
      expect(await store.importFamily()).toBe(false);
      expect(firstName(store)).toBe("Ada");
      expect([...raw.keys()].filter((k) => k.includes(".backup-"))).toHaveLength(0);
    }
  });

  it("refuses the open file and invalid files without touching the data", async () => {
    const same = await loaded("/ORIG/family.json");
    expect(await same.store.importFamily()).toBe(false);
    expect(same.store.error).toContain("currently open");

    const bad = await loaded();
    bad.raw.set("/in/other.json", "{nope");
    expect(await bad.store.importFamily()).toBe(false);
    expect(bad.store.error).toContain("not valid JSON");
    expect(firstName(bad.store)).toBe("Ada");
  });

  it("says so when the file is identical to the current family", async () => {
    const { store, raw, files } = await loaded();
    raw.set("/in/other.json", JSON.stringify(files.get("/orig/family.json")));
    expect(await store.importFamily()).toBe(false);
    expect(store.notice).toContain("same content");
  });

  it("aborts, importing nothing, when the backup cannot be written", async () => {
    const { store, platform } = await loaded();
    platform.data.writeRaw = async () => {
      throw new Error("read-only disk");
    };
    expect(await store.importFamily()).toBe(false);
    expect(store.error).toContain("Could not write to family.backup-");
    expect(firstName(store)).toBe("Ada");
  });

  it("aborts when the backup does not read back identically", async () => {
    const { store, platform } = await loaded();
    platform.data.writeRaw = async () => {};
    expect(await store.importFamily()).toBe(false);
    expect(store.error).toContain("could not be verified");
    expect(firstName(store)).toBe("Ada");
  });

  it("lists skipped items as warnings and warns about an empty file", async () => {
    const { store, raw, confirms } = await loaded();
    const two = addPerson(withZed, { firstName: "Yan", lastName: "" });
    const linked = addPartners(two, {
      personAId: two.people[0]!.id,
      personBId: two.people[1]!.id,
      status: "ongoing",
    });
    raw.set("/in/other.json", JSON.stringify({ ...linked, people: [linked.people[0]] }));
    expect(await store.importFamily()).toBe(true);
    expect(store.warnings).toHaveLength(1);
    expect(confirms[0]).toContain("will be skipped");

    raw.set("/in/other.json", JSON.stringify({ schemaVersion: 1, people: [], relationships: [] }));
    expect(await store.importFamily()).toBe(true);
    expect(confirms[1]).toContain("no people");
  });

  it("closes the family and goes back to the welcome screen offering to resume it", async () => {
    const { store } = await loaded();
    await store.closeFamily();
    expect(store.data).toBeNull();
    expect(store.filePath).toBeNull();
    expect(store.resumePath).toBe("/orig/family.json");
  });
});

describe("family store: family name", () => {
  /** A store whose shell can ask for a name; `answers` are consumed per question. */
  function named(answers: (string | null)[], saveResult = "/f/Laurent.gigi") {
    const made = makeStore({ saveResult });
    const questions: { message: string; initial?: string }[] = [];
    made.platform.promptText = async (options) => {
      questions.push(options);
      return answers.shift() ?? null;
    };
    const defaults: (string | undefined)[] = [];
    const dialog = made.platform.saveFileDialog;
    made.platform.saveFileDialog = (options) => {
      defaults.push(options?.defaultName);
      return dialog(options);
    };
    return { ...made, questions, defaults };
  }

  it("asks for the name first, suggests <name>.gigi, and stores the name in the file", async () => {
    const { store, files, questions, defaults } = named(["  Famille   Laurent "]);
    await store.createNew();
    expect(questions).toHaveLength(1);
    expect(defaults).toEqual(["Famille Laurent.gigi"]);
    expect(files.get("/f/Laurent.gigi")?.name).toBe("Famille Laurent");
    expect(store.familyTitle).toBe("Famille Laurent");
  });

  it("makes the suggested file name safe", async () => {
    const { store, defaults } = named(["A/B: C"]);
    await store.createNew();
    expect(defaults).toEqual(["A-B- C.gigi"]);
  });

  it("creates nothing when the prompt is cancelled or left empty", async () => {
    for (const answer of [null, "", "   "]) {
      const { store, defaults, save } = named([answer]);
      await store.createNew();
      expect(defaults).toEqual([]); // the save dialog never opened
      expect(save).not.toHaveBeenCalled();
      expect(store.data).toBeNull();
    }
  });

  it("a shell that cannot ask behaves as before: default file name, no name", async () => {
    const { store, files, platform } = makeStore({ saveResult: "/f/x.gigi" });
    expect(platform.promptText).toBeUndefined();
    await store.createNew();
    expect(files.get("/f/x.gigi")).not.toHaveProperty("name");
    expect(store.canRename).toBe(false);
    expect(store.familyTitle).toBe("x"); // the file name stands in
  });

  it("Rename saves the new name and keeps everything else", async () => {
    const { store, files, questions } = named(["Laurent", "Dubois"]);
    await store.createNew();
    await store.addPerson({ firstName: "Ada", lastName: "" });
    expect(await store.renameFamily()).toBe(true);
    expect(questions[1]?.initial).toBe("Laurent");
    expect(files.get("/f/Laurent.gigi")?.name).toBe("Dubois");
    expect(files.get("/f/Laurent.gigi")?.people).toHaveLength(1);
  });

  it("a cancelled or empty rename changes nothing", async () => {
    const { store, files } = named(["Laurent", null, ""]);
    await store.createNew();
    expect(await store.renameFamily()).toBe(false);
    expect(await store.renameFamily()).toBe(false);
    expect(files.get("/f/Laurent.gigi")?.name).toBe("Laurent");
  });

  it("Resume is labelled with the name read from the remembered file, else the file name", async () => {
    const withName = makeStore({ lastPath: "/f/a.gigi", existingFiles: ["/f/a.gigi"] });
    withName.raw.set("/f/a.gigi", JSON.stringify({ ...EMPTY, name: "Famille Laurent" }));
    await withName.store.init();
    expect(withName.store.resumeLabel).toBe("Famille Laurent");

    const without = makeStore({ lastPath: "/f/a.gigi", existingFiles: ["/f/a.gigi"] });
    await without.store.init();
    expect(without.store.resumeLabel).toBe("a.gigi");
  });

  it("an imported file without a name keeps the current name", async () => {
    const { store, platform, raw } = named(["Laurent"]);
    platform.openFileDialog = async () => "/in/other.gigi";
    await store.createNew();
    raw.set("/in/other.gigi", JSON.stringify({ ...EMPTY, people: [] }));
    await store.addPerson({ firstName: "Ada", lastName: "" });
    await store.importFamily();
    expect(store.data?.name).toBe("Laurent");
  });

  it("shares and exports under fixed English default names, whatever the language", async () => {
    const { store, platform, defaults } = named(["Laurent"]);
    await store.createNew();
    await store.addPerson({ firstName: "Ada", lastName: "" });
    await store.addPerson({ firstName: "Byron", lastName: "" });
    const [a, b] = store.data?.people ?? [];
    await store.addPartners({ personAId: a!.id, personBId: b!.id, status: "ongoing" });
    platform.saveFileDialog = async (options) => {
      defaults.push(options?.defaultName);
      return `/out/${options?.defaultName}`;
    };
    await store.exportFamily();
    await store.shareWebPage();
    expect(defaults.slice(-2)).toEqual(["family-export.gigi", "family.html"]);
  });
});

describe("family store: share as web page", () => {
  it("refuses a family without two people and a relationship, and writes nothing", async () => {
    const { store, platform, raw } = makeStore({
      saveResult: "/s/family.gigi",
      confirmResult: true,
    });
    const writeRaw = vi.spyOn(platform.data, "writeRaw");
    await store.createNew();
    await store.addPerson({ firstName: "Ada", lastName: "" });
    expect(await store.shareWebPage()).toBe(false);
    expect(store.error).toBe("Add at least two people and one relationship to share the family.");
    expect(writeRaw).not.toHaveBeenCalled();
    expect([...raw.keys()].some((k) => k.endsWith(".html"))).toBe(false);
  });
});

describe("family store: person dates", () => {
  it("saves dates through add and edit, and reports invalid dates without saving", async () => {
    const made = makeStore({ saveResult: "/d/family.json" });
    const { store, save } = made;
    await store.createNew();
    const d = (year: string, month = "", day = "") => ({ year, month, day });

    expect(
      await store.addPerson({
        firstName: "Ada",
        lastName: "",
        birth: d("1815", "12", "10"),
        status: "living",
      }),
    ).toBe(true);
    const id = store.data?.people[0]?.id;
    if (!id) throw new Error("no person");
    expect(store.data?.people[0]?.born?.birthDate.raw).toBe("1815-12-10T00:00");

    save.mockClear();
    expect(await store.editPerson(id, { firstName: "Ada", lastName: "", birth: d("abc") })).toBe(
      false,
    );
    expect(store.error).toContain("Birth date: Year must be a number");
    expect(save).not.toHaveBeenCalled();
    expect(store.data?.people[0]?.born?.birthDate.raw).toBe("1815-12-10T00:00");

    expect(
      await store.editPerson(id, {
        firstName: "Ada",
        lastName: "",
        birth: d("1815"),
        status: "deceased",
        death: d("1800"),
      }),
    ).toBe(false);
    expect(store.error).toBe("Death cannot be before birth.");
  });
});

describe("family store: git sync", () => {
  async function opened(options: FakeOptions = {}) {
    const path = "/g/family.json";
    const made = makeStore({ ...options, saveResult: path });
    await made.store.createNew();
    return { ...made, path };
  }

  it("reports the git status of the opened file", async () => {
    expect((await opened({ gitStatus: "ready" })).store.gitStatus).toBe("ready");
    expect((await opened({ gitStatus: "no-remote" })).store.gitStatus).toBe("no-remote");
  });

  it("treats a failing status check as unavailable", async () => {
    const made = makeStore({ saveResult: "/g/f.json" });
    // Simulates a shell without git support (e.g. the e2e fake).
    (made.platform as unknown as { git: unknown }).git = undefined;
    await made.store.createNew();
    expect(made.store.gitStatus).toBe("unavailable");
    expect(await made.store.syncGit()).toBe(false);
  });

  it("syncs, shows the message and reloads the file from disk", async () => {
    const { store, files, path } = await opened({
      gitStatus: "ready",
      gitSync: async () => "no-changes",
    });
    files.set(path, {
      schemaVersion: 1,
      people: [{ id: "11111111-1111-4111-8111-111111111111" } as never],
      relationships: [],
    });
    expect(await store.syncGit()).toBe(true);
    expect(store.notice).toBe("Synced with git: no local changes to commit.");
    expect(store.data?.people).toHaveLength(1);
    expect(store.syncing).toBe(false);
  });

  it("keeps the data and shows the error when git fails", async () => {
    const { store } = await opened({
      gitStatus: "ready",
      gitSync: async () => {
        throw new Error("Could not merge the remote changes.");
      },
    });
    await store.addPerson({ firstName: "Ada", lastName: "" });
    expect(await store.syncGit()).toBe(false);
    expect(store.error).toMatch(/Could not merge/);
    expect(store.data?.people).toHaveLength(1);
    expect(store.syncing).toBe(false);
  });

  it("does nothing unless git is ready", async () => {
    const sync = vi.fn(async () => "committed" as const);
    const { store } = await opened({ gitStatus: "no-remote", gitSync: sync });
    expect(await store.syncGit()).toBe(false);
    expect(sync).not.toHaveBeenCalled();
  });

  it("waits for earlier saves before syncing", async () => {
    const order: string[] = [];
    const made = makeStore({
      saveResult: "/g/family.json",
      gitStatus: "ready",
      gitSync: async () => {
        order.push("sync");
        return "committed" as const;
      },
    });
    await made.store.createNew();
    made.save.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 20));
      order.push("save");
    });
    const add = made.store.addPerson({ firstName: "Ada", lastName: "" });
    const sync = made.store.syncGit();
    await Promise.all([add, sync]);
    expect(order).toEqual(["save", "sync"]);
  });
});

describe("family store: photos", () => {
  const png = "data:image/png;base64,AAAA";

  async function withPerson(options: FakeOptions = {}) {
    const made = makeStore({ ...options, saveResult: "/p/family.json" });
    await made.store.createNew();
    await made.store.addPerson({ firstName: "Ada", lastName: "" });
    const id = made.store.data?.people[0]?.id;
    if (!id) throw new Error("no person");
    return { ...made, id };
  }

  it("adds the picked photos in one save", async () => {
    const { store, save, id } = await withPerson({
      pickImages: [
        { name: "a.png", dataUrl: png },
        { name: "b.png", dataUrl: png },
      ],
    });
    save.mockClear();
    expect(await store.pickPhotos(id)).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
    expect(store.data?.people[0]?.photos).toHaveLength(2);
  });

  it("does nothing when the picker is cancelled", async () => {
    const { store, save, id } = await withPerson({ pickImages: [] });
    save.mockClear();
    expect(await store.pickPhotos(id)).toBe(false);
    expect(save).not.toHaveBeenCalled();
    expect(store.error).toBeNull();
  });

  it("skips files that cannot be shrunk, adds the rest and reports the problem", async () => {
    const made = makeStore({
      saveResult: "/p/family.json",
      pickImages: [
        { name: "good.png", dataUrl: png },
        { name: "bad.txt", dataUrl: "BAD" },
      ],
    });
    // A fresh store (own pinia) whose shrinker refuses "BAD" like a browser would for a non-image.
    setActivePinia(createPinia());
    const store = defineFamilyStore(made.platform, async (url) => {
      if (url === "BAD") throw new Error("decode failed");
      return url;
    })();
    await store.createNew();
    await store.addPerson({ firstName: "Ada", lastName: "" });
    const id = store.data!.people[0]!.id;
    const ok = await store.pickPhotos(id);
    expect(store.error).toMatch(/not a supported image/);
    expect(ok).toBe(true);
    expect(store.data?.people[0]?.photos).toHaveLength(1);
  });

  it("reports a failing picker", async () => {
    const made = makeStore({ saveResult: "/p/family.json" });
    (made.platform as unknown as { pickImages: unknown }).pickImages = async () => {
      throw new Error("dialog failed");
    };
    await made.store.createNew();
    await made.store.addPerson({ firstName: "Ada", lastName: "" });
    expect(await made.store.pickPhotos(made.store.data!.people[0]!.id)).toBe(false);
    expect(made.store.error).toBe("dialog failed");
  });

  it("makes a photo main, captions it, and removes it only after confirmation", async () => {
    const { store, id } = await withPerson({
      pickImages: [
        { name: "a.png", dataUrl: png },
        { name: "b.png", dataUrl: png },
      ],
    });
    await store.pickPhotos(id);
    const [first, second] = store.data!.people[0]!.photos!;
    expect(await store.makeMainPhoto(id, second!.id)).toBe(true);
    expect(store.data!.people[0]!.photos![0]!.id).toBe(second!.id);
    expect(await store.captionPhoto(id, first!.id, "Summer")).toBe(true);
    expect(store.data!.people[0]!.photos!.find((p) => p.id === first!.id)?.caption).toBe("Summer");
    expect(await store.deletePhoto(id, first!.id)).toBe(true);
    expect(store.data!.people[0]!.photos).toHaveLength(1);
  });

  it("keeps the photo when the removal is declined", async () => {
    const { store, id } = await withPerson({
      confirmResult: false,
      pickImages: [{ name: "a.png", dataUrl: png }],
    });
    await store.pickPhotos(id);
    const photoId = store.data!.people[0]!.photos![0]!.id;
    expect(await store.deletePhoto(id, photoId)).toBe(false);
    expect(store.data!.people[0]!.photos).toHaveLength(1);
  });

  it("refuses beyond the limit and leaves the data as it was", async () => {
    const many = Array.from({ length: 13 }, (_, i) => ({ name: `${i}.png`, dataUrl: png }));
    const { store, id } = await withPerson({ pickImages: many });
    expect(await store.pickPhotos(id)).toBe(false);
    expect(store.error).toMatch(/at most 12 photos/);
    expect(store.data!.people[0]!.photos).toBeUndefined();
  });
});
