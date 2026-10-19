/** Names are stored exactly as typed (only trimmed), so "McDonald" stays "McDonald". */
export function toStoredName(value: string): string {
  return value.trim();
}

/** Shows the first letter after a space, hyphen or apostrophe in uppercase ("jean-pierre" → "Jean-Pierre"); other letters are left as typed. */
export function toDisplayName(value: string): string {
  return value.replace(/(^|[\s\-'’])(\p{L})/gu, (_m, sep: string, letter: string) => {
    return sep + letter.toLocaleUpperCase();
  });
}
