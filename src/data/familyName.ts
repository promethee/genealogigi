export const MAX_FAMILY_NAME = 80;
/** Longest file name stem suggested; keeps full paths well under the 260-character Windows limit. */
export const MAX_FILE_STEM = 100;

/** Whitespace collapsed, trimmed, and cut to the maximum length. */
export function cleanFamilyName(name: string): string {
  return name.replace(/\s+/g, " ").trim().slice(0, MAX_FAMILY_NAME);
}

const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

/** A file system safe `<name>.gigi`; "family.gigi" when nothing usable is left. */
export function fileNameForFamily(name: string): string {
  // NFC: macOS can hand back decomposed accents (e + combining mark); Windows expects composed.
  let safe = cleanFamilyName(name)
    .normalize("NFC")
    // eslint-disable-next-line no-control-regex
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .slice(0, MAX_FILE_STEM)
    .replace(/^[-.\s]+|[-.\s]+$/g, "");
  if (safe === "") safe = "family";
  if (RESERVED.test(safe)) safe = `${safe}-family`;
  return `${safe}.gigi`;
}
