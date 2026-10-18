import type { FamilyData } from "./types.ts";

/** Minimal file operations the store needs; implemented per shell (and by tests). */
export interface FileIO {
  exists(path: string): Promise<boolean>;
  readText(path: string): Promise<string>;
  writeText(path: string, content: string): Promise<void>;
  /** Must replace the destination if it already exists. */
  rename(from: string, to: string): Promise<void>;
}

export async function loadFamilyData(io: FileIO, filePath: string): Promise<FamilyData> {
  if (!(await io.exists(filePath))) {
    return { schemaVersion: 1, people: [], relationships: [] };
  }
  const raw = await io.readText(filePath);
  return JSON.parse(raw) as FamilyData; // TODO: validate shape, don't just trust the cast
}

export async function saveFamilyData(
  io: FileIO,
  filePath: string,
  data: FamilyData,
): Promise<void> {
  const tmpFile = `${filePath}.tmp`;
  await io.writeText(tmpFile, JSON.stringify(data, null, 2));
  // Rename is atomic on the same filesystem — avoids partial-write corruption
  // if the app crashes mid-save.
  await io.rename(tmpFile, filePath);
}
