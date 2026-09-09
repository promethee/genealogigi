import type { FamilyData } from "./types.ts";

// TODO (Phase 2): resolve a proper per-OS user data directory instead of a
// repo-relative path once the app is actually packaged/distributed.

export async function loadFamilyData(filePath: string): Promise<FamilyData> {
  try {
    const raw = await Deno.readTextFile(filePath);
    return JSON.parse(raw) as FamilyData; // TODO: validate shape, don't just trust the cast
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return { schemaVersion: 1, people: [], relationships: [] };
    }
    throw err;
  }
}

export async function saveFamilyData(filePath: string, data: FamilyData): Promise<void> {
  const tmpFile = `${filePath}.tmp`;
  await Deno.writeTextFile(tmpFile, JSON.stringify(data, null, 2));
  // Rename is atomic on the same filesystem — avoids partial-write corruption
  // if the app crashes mid-save.
  await Deno.rename(tmpFile, filePath);
}
