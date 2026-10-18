import { describe, expect, it } from "vitest";
import { avatarClasses, avatarColors, avatarIndex, initialsOf } from "./avatar.ts";
import { addPerson } from "./people.ts";
import type { FamilyData, Person } from "./types.ts";

const person = (first: string, last: string): Person => {
  const data = addPerson({ schemaVersion: 1, people: [], relationships: [] } as FamilyData, {
    firstName: first,
    lastName: last,
  });
  return data.people[0]!;
};

describe("avatars", () => {
  it("uses up to two initials of the main name", () => {
    expect(initialsOf(person("Marie", "Dubois"))).toBe("MD");
    expect(initialsOf(person("marie", ""))).toBe("M");
    // Nobody named: the placeholder label "Unnamed person" gives two initials.
    expect(initialsOf({ id: person("x", "").id })).toBe("UP");
  });

  it("gives the same colour to the same person every time", () => {
    const p = person("Ada", "Byron");
    expect(avatarIndex(p)).toBe(avatarIndex({ id: p.id }));
    expect(avatarClasses(p)).toBe(avatarClasses(p));
    expect(avatarColors(p)).toEqual(avatarColors(p));
  });

  it("spreads people over the palette and always returns a valid entry", () => {
    const seen = new Set<number>();
    for (let i = 0; i < 60; i++) seen.add(avatarIndex(person(`P${i}`, "")));
    expect(seen.size).toBeGreaterThan(3);
    for (const index of seen) expect(index).toBeGreaterThanOrEqual(0);
    expect(avatarColors(person("Ada", "")).tint).toMatch(/^#[0-9a-f]{6}$/);
    expect(avatarClasses(person("Ada", ""))).toContain("dark:");
  });
});
