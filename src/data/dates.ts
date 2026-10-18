import { monthName, monthShort, t } from "../i18n/index.ts";
import { UNKNOWN_YEAR_SENTINEL, type VariablePrecisionDate } from "./types.ts";

/** Fully-unknown date: the model requires a date wherever one is expected. */
export const UNKNOWN_DATE: VariablePrecisionDate = {
  raw: "9999-01-01T00:00",
  yearKnown: false,
  monthKnown: false,
  dayKnown: false,
  hourKnown: false,
  minuteKnown: false,
};

/** Raw text from the three date inputs; any part may be blank. */
export interface PartialDateInput {
  year: string;
  month: string;
  day: string;
}

export function emptyDateInput(): PartialDateInput {
  return { year: "", month: "", day: "" };
}

export class InvalidDateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidDateError";
  }
}

/** Month names 1..12 in the active language (call at render time, not import time). */
export const monthNames = (): string[] =>
  Array.from({ length: 12 }, (_, i) => {
    const name = monthName(i + 1);
    return name.charAt(0).toUpperCase() + name.slice(1);
  });

const MIN_YEAR = 1;
const MAX_YEAR = UNKNOWN_YEAR_SENTINEL - 1;
// Used only to validate February 29 when the year is unknown.
const LEAP_YEAR_FOR_UNKNOWN = 2000;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function parsePart(label: string, text: string, min: number, max: number): number | null {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  if (!/^\d+$/.test(trimmed)) throw new InvalidDateError(t("err.dateNumber", { label }));
  const value = Number(trimmed);
  if (value < min || value > max) {
    throw new InvalidDateError(t("err.dateRange", { label, min, max }));
  }
  return value;
}

const pad = (value: number, width: number) => String(value).padStart(width, "0");

/**
 * Turns the three inputs into a VariablePrecisionDate, or null when all are
 * blank. `label` prefixes error messages ("Birth date", "Death date").
 */
export function dateFromInput(
  input: PartialDateInput,
  label: string,
): VariablePrecisionDate | null {
  const wrap = <T>(fn: () => T): T => {
    try {
      return fn();
    } catch (err) {
      if (err instanceof InvalidDateError)
        throw new InvalidDateError(t("err.dateWrap", { label, message: err.message }));
      throw err;
    }
  };

  return wrap(() => {
    const year = parsePart(t("date.year"), input.year, MIN_YEAR, MAX_YEAR);
    const month = parsePart(t("date.month"), input.month, 1, 12);
    const day = parsePart(t("date.day"), input.day, 1, 31);
    if (year === null && month === null && day === null) return null;
    if (day !== null && month === null) throw new InvalidDateError(t("err.dateDayNeedsMonth"));
    if (day !== null && month !== null && day > daysInMonth(year ?? LEAP_YEAR_FOR_UNKNOWN, month)) {
      throw new InvalidDateError(t("err.dateDayInvalid"));
    }
    return {
      raw: `${pad(year ?? UNKNOWN_YEAR_SENTINEL, 4)}-${pad(month ?? 1, 2)}-${pad(day ?? 1, 2)}T00:00`,
      yearKnown: year !== null,
      monthKnown: month !== null,
      dayKnown: day !== null,
      hourKnown: false,
      minuteKnown: false,
    };
  });
}

function parts(date: VariablePrecisionDate): { year: number; month: number; day: number } {
  return {
    year: Number(date.raw.slice(0, 4)),
    month: Number(date.raw.slice(5, 7)),
    day: Number(date.raw.slice(8, 10)),
  };
}

/** The inverse of `dateFromInput`, for pre-filling the form. */
export function inputFromDate(date: VariablePrecisionDate | undefined): PartialDateInput {
  if (!date) return emptyDateInput();
  const p = parts(date);
  return {
    year: date.yearKnown ? String(p.year) : "",
    month: date.monthKnown ? String(p.month) : "",
    day: date.dayKnown ? String(p.day) : "",
  };
}

/** e.g. "10 Dec 1815", "Dec 1815", "1815", "10 Dec (year unknown)". */
export function formatDate(date: VariablePrecisionDate): string {
  const p = parts(date);
  const pieces: string[] = [];
  if (date.dayKnown) pieces.push(String(p.day));
  if (date.monthKnown) pieces.push(monthShort(p.month));
  if (date.yearKnown) pieces.push(String(p.year));
  if (pieces.length === 0) return t("date.unknown");
  if (!date.yearKnown) pieces.push(t("date.yearUnknown"));
  return pieces.join(" ");
}

/** The year if it is known, otherwise null. */
export function yearOf(date: VariablePrecisionDate): number | null {
  return date.yearKnown ? parts(date).year : null;
}

/**
 * True only when `a` is certainly earlier than `b`. Compares year, then month,
 * then day, and gives up (false) at the first part either date does not know.
 */
export function isCertainlyBefore(a: VariablePrecisionDate, b: VariablePrecisionDate): boolean {
  const pa = parts(a);
  const pb = parts(b);
  const steps: [boolean, number, number][] = [
    [a.yearKnown && b.yearKnown, pa.year, pb.year],
    [a.monthKnown && b.monthKnown, pa.month, pb.month],
    [a.dayKnown && b.dayKnown, pa.day, pb.day],
  ];
  for (const [comparable, left, right] of steps) {
    if (!comparable) return false;
    if (left < right) return true;
    if (left > right) return false;
  }
  return false;
}
