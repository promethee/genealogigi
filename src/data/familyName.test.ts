import { describe, expect, it } from "vitest";
import { cleanFamilyName, fileNameForFamily, MAX_FAMILY_NAME } from "./familyName.ts";

describe("cleanFamilyName", () => {
  it("trims, collapses spaces and caps the length", () => {
    expect(cleanFamilyName("  Famille   Laurent \n")).toBe("Famille Laurent");
    expect(cleanFamilyName("x".repeat(500))).toHaveLength(MAX_FAMILY_NAME);
    expect(cleanFamilyName("   ")).toBe("");
  });
});

describe("fileNameForFamily", () => {
  it("is the name plus .gigi", () => {
    expect(fileNameForFamily("Laurent")).toBe("Laurent.gigi");
    expect(fileNameForFamily("Famille Chateau-Lunette")).toBe("Famille Chateau-Lunette.gigi");
    expect(fileNameForFamily("Zoé & Léa")).toBe("Zoé & Léa.gigi"); // accents and & are fine
  });

  it("replaces characters a file name cannot hold", () => {
    expect(fileNameForFamily('A/B\\C:D*E?F"G<H>I|J')).toBe("A-B-C-D-E-F-G-H-I-J.gigi");
  });

  it("never ends in a dot or space and falls back when nothing is usable", () => {
    expect(fileNameForFamily("Laurent. ")).toBe("Laurent.gigi");
    expect(fileNameForFamily("///")).toBe("family.gigi");
    expect(fileNameForFamily("")).toBe("family.gigi");
  });

  it("avoids the names Windows reserves", () => {
    expect(fileNameForFamily("con")).toBe("con-family.gigi");
    expect(fileNameForFamily("NUL")).toBe("NUL-family.gigi");
    expect(fileNameForFamily("COM1")).toBe("COM1-family.gigi");
  });

  it("keeps accents and composes them (NFC)", () => {
    expect(fileNameForFamily("He\u0301rault")).toBe("H\u00e9rault.gigi");
  });
});
