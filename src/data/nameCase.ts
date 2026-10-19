/** Names are stored in lowercase and shown with each part capitalized ("jean-pierre" → "Jean-Pierre"). */
export function toStoredName(value: string): string {
  return value.trim().toLocaleLowerCase();
}

/** Capitalizes the first letter after a space, hyphen or apostrophe; other letters are left as they are. */
export function toDisplayName(value: string): string {
  return value.replace(/(^|[\s\-'’])(\p{L})/gu, (_m, sep: string, letter: string) => {
    return sep + letter.toLocaleUpperCase();
  });
}
