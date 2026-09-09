import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { loadFamilyData, saveFamilyData } from "./store.ts";
import { createUuidId, type FamilyData, type PersonId } from "./types.ts";

Deno.test("save then load round-trips family data", async () => {
  const tmpFile = await Deno.makeTempFile({ suffix: ".json" });
  try {
    const sample: FamilyData = {
      schemaVersion: 1,
      people: [{ id: createUuidId<"PersonId">() as PersonId }],
      relationships: [],
    };

    await saveFamilyData(tmpFile, sample);
    const loaded = await loadFamilyData(tmpFile);

    assertEquals(loaded, sample);
  } finally {
    await Deno.remove(tmpFile);
  }
});
