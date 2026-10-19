export const MAX_FAMILY_NAME = 80;

/** Whitespace collapsed, trimmed, and cut to the maximum length. */
export function cleanFamilyName(name: string): string {
  return name.replace(/\s+/g, " ").trim().slice(0, MAX_FAMILY_NAME);
}

const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

/** A file system safe `<name>.gigi`; "family.gigi" when nothing usable is left. */
export function fileNameForFamily(name: string): string {
  let safe = cleanFamilyName(name)
    // eslint-disable-next-line no-control-regex
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/^[-.\s]+|[-.\s]+$/g, "");
  if (safe === "") safe = "family";
  if (RESERVED.test(safe)) safe = `${safe}-family`;
  return `${safe}.gigi`;
}
