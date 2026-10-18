import { mkdtemp, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadFamilyData, saveFamilyData, type FileIO } from "./store.ts";
import { createUuidId, type FamilyData, type PersonId } from "./types.ts";

const nodeFileIO: FileIO = {
  exists: (path) =>
    stat(path).then(
      () => true,
      () => false,
    ),
  readText: (path) => readFile(path, "utf8"),
  writeText: (path, content) => writeFile(path, content, "utf8"),
  rename,
};

describe("family data store", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "genealogigi-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("save then load round-trips family data", async () => {
    const file = join(dir, "family.json");
    const sample: FamilyData = {
      schemaVersion: 1,
      people: [{ id: createUuidId<"PersonId">() as PersonId }],
      relationships: [],
    };

    await saveFamilyData(nodeFileIO, file, sample);

    expect(await loadFamilyData(nodeFileIO, file)).toEqual(sample);
  });

  it("returns empty family data when the file does not exist", async () => {
    const loaded = await loadFamilyData(nodeFileIO, join(dir, "missing.json"));

    expect(loaded).toEqual({ schemaVersion: 1, people: [], relationships: [] });
  });

  it("overwrites an existing file and leaves no .tmp behind", async () => {
    const file = join(dir, "family.json");
    const empty: FamilyData = { schemaVersion: 1, people: [], relationships: [] };
    await saveFamilyData(nodeFileIO, file, empty);
    const updated: FamilyData = {
      ...empty,
      people: [{ id: createUuidId<"PersonId">() as PersonId }],
    };
    await saveFamilyData(nodeFileIO, file, updated);

    expect(await loadFamilyData(nodeFileIO, file)).toEqual(updated);
    expect(await nodeFileIO.exists(`${file}.tmp`)).toBe(false);
  });
});
