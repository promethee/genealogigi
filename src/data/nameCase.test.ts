import { describe, expect, it } from "vitest";
import { toDisplayName, toStoredName } from "./nameCase.ts";

describe("name case", () => {
  it("stores lowercase and trimmed", () => {
    expect(toStoredName("  Jean-Pierre DUPONT ")).toBe("jean-pierre dupont");
  });
  it("displays each part capitalized", () => {
    expect(toDisplayName("jean-pierre")).toBe("Jean-Pierre");
    expect(toDisplayName("de la fontaine")).toBe("De La Fontaine");
    expect(toDisplayName("o'brien")).toBe("O'Brien");
    expect(toDisplayName("élodie")).toBe("Élodie");
    expect(toDisplayName("")).toBe("");
  });
});
