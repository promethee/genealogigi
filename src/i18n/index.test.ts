import { afterEach, describe, expect, it } from "vitest";
import { en } from "./en.ts";
import { fr } from "./fr.ts";
import { localeFromSystem, locale, monthName, monthShort, setLocale, t, tn } from "./index.ts";

afterEach(() => setLocale("en"));

const placeholders = (text: string): string[] =>
  [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1] as string).sort();

describe("catalogs", () => {
  it("French has exactly the English keys", () => {
    expect(Object.keys(fr).sort()).toEqual(Object.keys(en).sort());
  });

  it("every key uses the same placeholders in both languages", () => {
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(placeholders(fr[key]), key).toEqual(placeholders(en[key]));
    }
  });

  it("no French value is empty", () => {
    for (const [key, value] of Object.entries(fr)) expect(value.trim(), key).not.toBe("");
  });
});

describe("t / tn", () => {
  it("translates and fills placeholders", () => {
    expect(t("welcome.resume", { file: "a.json" })).toBe("Resume a.json");
    setLocale("fr");
    expect(t("welcome.resume", { file: "a.json" })).toBe("Reprendre a.json");
  });

  it("leaves unknown placeholders alone", () => {
    expect(t("welcome.resume")).toBe("Resume {file}");
  });

  it("pluralises: English 1 is singular, French 0 and 1 are singular", () => {
    expect(tn("summary.people", 0)).toBe("0 people");
    expect(tn("summary.people", 1)).toBe("1 person");
    expect(tn("summary.people", 2)).toBe("2 people");
    setLocale("fr");
    expect(tn("summary.people", 0)).toBe("0 personne");
    expect(tn("summary.people", 1)).toBe("1 personne");
    expect(tn("summary.people", 2)).toBe("2 personnes");
  });

  it("names months in the active language", () => {
    expect(monthName(12)).toBe("December");
    expect(monthShort(12)).toBe("Dec");
    setLocale("fr");
    expect(monthName(12)).toBe("décembre");
    expect(monthShort(2)).toBe("févr.");
  });
});

describe("locale", () => {
  it("follows the system language", () => {
    expect(localeFromSystem("fr-FR")).toBe("fr");
    expect(localeFromSystem("FR")).toBe("fr");
    expect(localeFromSystem("en-US")).toBe("en");
    expect(localeFromSystem(undefined)).toBe("en");
  });

  it("setLocale updates the reactive value", () => {
    setLocale("fr");
    expect(locale.value).toBe("fr");
  });
});
