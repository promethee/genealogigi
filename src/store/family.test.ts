import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
}

function fakePlatform(options: FakeOptions = {}) {
  let lastPath = options.lastPath ?? null;
  let failSaves = false;
  const files = new Map<string, FamilyData>(
    (options.existingFiles ?? []).map((path) => [path, EMPTY]),
  );
  const save = vi.fn(async (path: string, data: FamilyData) => {
    if (options.saveError && failSaves) throw options.saveError;
    files.set(path, data);
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
    },
    settings: {
      getLastFilePath: async () => lastPath,
      setLastFilePath: async (path) => {
        lastPath = path;
      },
    },
    confirm: async () => options.confirmResult ?? true,
    exit: async () => {},
  };
  return {
    platform,
    save,
    files,
    getLastPath: () => lastPath,
    failSavesFromNowOn: () => {
      failSaves = true;
    },
  };
}

function makeStore(options?: FakeOptions) {
  const fake = fakePlatform(options);
  setActivePinia(createPinia());
  return { store: defineFamilyStore(fake.platform)(), ...fake };
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
    expect(store.error).toBe("disk full");
  });

  it("renames a person, keeping the id", async () => {
    const { store } = await loadedStore();
    await store.addPerson({ firstName: "Ada", lastName: "Byron" });
    const id = store.data?.people[0]?.id;
    if (!id) throw new Error("no person");
    expect(await store.editPerson(id, { firstName: "Ada", lastName: "Lovelace" })).toBe(true);
    expect(store.data?.people[0]?.id).toBe(id);
    expect(store.data?.people[0]?.names?.lastNames?.[0]?.value).toBe("Lovelace");
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

describe("family store: save a copy", () => {
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
    expect(await store.saveCopy()).toBe(true);
    expect(files.get("/backup/copy.json")).toEqual(files.get(original));
    expect(files.get("/backup/copy.json")?.people).toHaveLength(1);
    expect(store.filePath).toBe(original);
    expect(getLastPath()).toBe(original);
    expect(store.notice).toBe("Copy saved to /backup/copy.json");
  });

  it("does nothing, silently, when cancelled", async () => {
    const { store, save } = await loaded([null]);
    save.mockClear();
    expect(await store.saveCopy()).toBe(false);
    expect(save).not.toHaveBeenCalled();
    expect(store.notice).toBeNull();
    expect(store.error).toBeNull();
  });

  it("refuses the file that is currently open, ignoring case and slash style", async () => {
    const { store, save } = await loaded(["/ORIG\\Family.json"]);
    save.mockClear();
    expect(await store.saveCopy()).toBe(false);
    expect(store.error).toContain("different file");
    expect(save).not.toHaveBeenCalled();
  });

  it("reports a write failure and leaves the open family untouched", async () => {
    const { store, platform } = await loaded(["/x/copy.json"]);
    platform.data.save = async () => {
      throw new Error("disk full");
    };
    expect(await store.saveCopy()).toBe(false);
    expect(store.error).toBe("disk full");
    expect(store.notice).toBeNull();
    expect(store.data?.people).toHaveLength(1);
  });

  it("clears the notice when the user edits something else", async () => {
    const { store } = await loaded(["/b/copy.json"]);
    await store.saveCopy();
    expect(store.notice).not.toBeNull();
    await store.addPerson({ firstName: "Byron", lastName: "" });
    expect(store.notice).toBeNull();
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
