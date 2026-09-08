import type { FamilyData } from './types.ts';

// TODO (Phase 2): resolve a proper per-OS user data directory instead of a
// repo-relative path once the app is actually packaged/distributed.
const DATA_DIR = './data';
const DATA_FILE = `${DATA_DIR}/family.json`;

export async function loadFamilyData(): Promise<FamilyData> {
  try {
    const raw = await Deno.readTextFile(DATA_FILE);
    return JSON.parse(raw) as FamilyData;
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return { people: [], relationships: [] };
    }
    throw err;
  }
}

export async function saveFamilyData(data: FamilyData): Promise<void> {
  await Deno.mkdir(DATA_DIR, { recursive: true });
  const tmpFile = `${DATA_FILE}.tmp`;
  await Deno.writeTextFile(tmpFile, JSON.stringify(data, null, 2));
  // Rename is atomic on the same filesystem — avoids partial-write corruption
  // if the app crashes mid-save.
  await Deno.rename(tmpFile, DATA_FILE);
}
