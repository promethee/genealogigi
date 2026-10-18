import { describe, expect, it } from "vitest";
import type { VariablePrecisionDate } from "./types.ts";
import {
  dateFromInput,
  emptyDateInput,
  formatDate,
  inputFromDate,
  InvalidDateError,
  isCertainlyBefore,
  isInFuture,
  UNKNOWN_DATE,
  yearOf,
} from "./dates.ts";

const input = (year = "", month = "", day = "") => ({ year, month, day });
const date = (y = "", m = "", d = "") => {
  const result = dateFromInput(input(y, m, d), "Date");
  if (!result) throw new Error("expected a date");
  return result;
};

describe("dateFromInput", () => {
  it("returns null when everything is blank", () => {
    expect(dateFromInput(emptyDateInput(), "Birth date")).toBeNull();
    expect(dateFromInput(input(" ", " ", " "), "Birth date")).toBeNull();
  });

  it("stores a full date with all flags", () => {
    expect(date("1815", "12", "10")).toEqual({
      raw: "1815-12-10T00:00",
      yearKnown: true,
      monthKnown: true,
      dayKnown: true,
      hourKnown: false,
      minuteKnown: false,
    });
  });

  it("year only: month and day default, flags say unknown", () => {
    expect(date("1815")).toMatchObject({
      raw: "1815-01-01T00:00",
      yearKnown: true,
      monthKnown: false,
      dayKnown: false,
    });
  });

  it("month without a year uses the unknown-year sentinel", () => {
    expect(date("", "3")).toMatchObject({
      raw: "9999-03-01T00:00",
      yearKnown: false,
      monthKnown: true,
    });
  });

  it("pads short years", () => {
    expect(date("5").raw).toBe("0005-01-01T00:00");
  });

  it("rejects a day without a month", () => {
    expect(() => dateFromInput(input("1815", "", "10"), "Birth date")).toThrow(
      "Birth date: A day needs a month.",
    );
  });

  it("rejects impossible days, leap-year aware", () => {
    expect(() => date("1815", "4", "31")).toThrow(/does not exist/);
    expect(() => date("1815", "2", "29")).toThrow(/does not exist/);
    expect(date("1816", "2", "29").raw).toBe("1816-02-29T00:00");
    expect(date("1900", "2", "28").raw).toBe("1900-02-28T00:00");
    expect(() => date("1900", "2", "29")).toThrow(/does not exist/);
  });

  it("accepts February 29 when the year is unknown", () => {
    expect(date("", "2", "29").dayKnown).toBe(true);
  });

  it("rejects non-numbers and out-of-range values, naming the field", () => {
    expect(() => date("abc")).toThrow("Date: Year must be a number.");
    expect(() => date("0")).toThrow(/Year must be between 1 and 9998/);
    expect(() => date("9999")).toThrow(/Year must be between/);
    expect(() => date("1815", "13")).toThrow(/Month must be between 1 and 12/);
    expect(() => date("1815", "1", "32")).toThrow(/Day must be between 1 and 31/);
    expect(() => date("-5")).toThrow(InvalidDateError);
  });
});

describe("inputFromDate / formatDate / yearOf", () => {
  it("round-trips through the form inputs", () => {
    for (const parts of [
      ["1815", "12", "10"],
      ["1815", "", ""],
      ["", "3", "7"],
      ["1815", "12", ""],
    ] as const) {
      expect(inputFromDate(date(...parts))).toEqual(input(...parts));
    }
    expect(inputFromDate(undefined)).toEqual(emptyDateInput());
  });

  it("formats by precision", () => {
    expect(formatDate(date("1815", "12", "10"))).toBe("10 Dec 1815");
    expect(formatDate(date("1815", "12"))).toBe("Dec 1815");
    expect(formatDate(date("1815"))).toBe("1815");
    expect(formatDate(date("", "3", "7"))).toBe("7 Mar (year unknown)");
    expect(formatDate(UNKNOWN_DATE)).toBe("unknown");
  });

  it("yearOf is null when the year is unknown", () => {
    expect(yearOf(date("1815"))).toBe(1815);
    expect(yearOf(date("", "3"))).toBeNull();
    expect(yearOf(UNKNOWN_DATE)).toBeNull();
  });
});

describe("isCertainlyBefore", () => {
  it("compares by year, then month, then day", () => {
    expect(isCertainlyBefore(date("1815"), date("1852"))).toBe(true);
    expect(isCertainlyBefore(date("1852"), date("1815"))).toBe(false);
    expect(isCertainlyBefore(date("1815", "3"), date("1815", "12"))).toBe(true);
    expect(isCertainlyBefore(date("1815", "12", "9"), date("1815", "12", "10"))).toBe(true);
  });

  it("is false for equal dates", () => {
    expect(isCertainlyBefore(date("1815", "12", "10"), date("1815", "12", "10"))).toBe(false);
  });

  it("gives up when a part is unknown", () => {
    // same year, one month unknown: cannot tell
    expect(isCertainlyBefore(date("1815"), date("1815", "12"))).toBe(false);
    expect(isCertainlyBefore(date("", "3"), date("1815"))).toBe(false);
    expect(isCertainlyBefore(UNKNOWN_DATE, date("1815"))).toBe(false);
  });
});

describe("isInFuture", () => {
  const today = new Date(2026, 9, 18); // 18 October 2026
  const date = (year: string, month = "", day = "") =>
    dateFromInput({ year, month, day }, "x") as VariablePrecisionDate;

  it("rejects a later year, month or day", () => {
    expect(isInFuture(date("2027"), today)).toBe(true);
    expect(isInFuture(date("2026", "11"), today)).toBe(true);
    expect(isInFuture(date("2026", "10", "19"), today)).toBe(true);
  });

  it("accepts today, the past, and partial dates that may be in the past", () => {
    expect(isInFuture(date("2026", "10", "18"), today)).toBe(false);
    expect(isInFuture(date("2026", "10", "17"), today)).toBe(false);
    expect(isInFuture(date("2026", "9", "30"), today)).toBe(false);
    expect(isInFuture(date("2025", "12", "31"), today)).toBe(false);
    expect(isInFuture(date("2026"), today)).toBe(false);
    expect(isInFuture(date("2026", "10"), today)).toBe(false);
  });

  it("never treats an unknown year as future", () => {
    expect(isInFuture(date("", "12", "31"), today)).toBe(false);
  });
});
