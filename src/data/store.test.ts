import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { loadFamilyData, saveFamilyData } from "./store.ts";

Deno.test("save then load round-trips family data", async () => {
  const sample = { people: [{ id: "1" }], relationships: [] };
  await saveFamilyData(sample);
  const loaded = await loadFamilyData();
  assertEquals(loaded, sample);
});
