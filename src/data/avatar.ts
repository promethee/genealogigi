import { displayNameParts } from "./people.ts";
import type { Person } from "./types.ts";

/** Tailwind classes for an HTML avatar disc, light and dark. */
const AVATAR_CLASSES = [
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-100",
  "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200",
  "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200",
  "bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200",
] as const;

/** The same six colours for SVG (tree boxes): a tint behind, a mid-tone for the letters. */
const AVATAR_COLORS = [
  { tint: "#10b981", ink: "#059669" },
  { tint: "#0ea5e9", ink: "#0284c7" },
  { tint: "#f59e0b", ink: "#b45309" },
  { tint: "#f43f5e", ink: "#e11d48" },
  { tint: "#8b5cf6", ink: "#7c3aed" },
  { tint: "#14b8a6", ink: "#0f766e" },
] as const;

/** Up to two initials of the main name, e.g. "Marie Dubois" -> "MD". */
export function initialsOf(person: Person): string {
  return displayNameParts(person)
    .name.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

/** A stable palette index per person, from a hash of their id. */
export function avatarIndex(person: Pick<Person, "id">): number {
  let hash = 0;
  for (const ch of person.id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash % AVATAR_CLASSES.length;
}

export const avatarClasses = (person: Pick<Person, "id">): string =>
  AVATAR_CLASSES[avatarIndex(person)] as string;

export const avatarColors = (person: Pick<Person, "id">): { tint: string; ink: string } =>
  AVATAR_COLORS[avatarIndex(person)] as { tint: string; ink: string };
