import { ref } from "vue";
import { en, type MessageKey } from "./en.ts";
import { fr } from "./fr.ts";

export type { MessageKey };
export type Locale = "en" | "fr";
export const LOCALES: readonly Locale[] = ["en", "fr"];

const catalogs: Record<Locale, Record<MessageKey, string>> = { en, fr };

/** The active language. Reactive, so templates and computeds re-render when it changes. */
export const locale = ref<Locale>("en");

export function setLocale(next: Locale): void {
  locale.value = next;
  if (typeof document !== "undefined") document.documentElement.lang = next;
}

/** French when the system language starts with "fr", otherwise English. */
export function localeFromSystem(language: string | undefined): Locale {
  return language?.toLowerCase().startsWith("fr") ? "fr" : "en";
}

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "fr";
}

type Params = Record<string, string | number>;

function format(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/** Translates `key` into the active language, filling `{name}` placeholders. */
export function t(key: MessageKey, params?: Params): string {
  return format(catalogs[locale.value][key], params);
}

/** Keys that have `.one` and `.other` forms, e.g. "summary.people". */
export type PluralBase = MessageKey extends infer K
  ? K extends `${infer B}.one`
    ? B
    : never
  : never;

/** Plural-aware translation: `{count}` is filled in automatically. */
export function tn(base: PluralBase, count: number, params?: Params): string {
  const form = new Intl.PluralRules(locale.value).select(count) === "one" ? "one" : "other";
  return t(`${base}.${form}` as MessageKey, { ...params, count });
}

const monthKey = (prefix: "month" | "monthShort", month: number) =>
  `${prefix}.${month}` as MessageKey;

/** Month 1..12 in the active language, e.g. "December". */
export const monthName = (month: number): string => t(monthKey("month", month));
/** Month 1..12 abbreviated, e.g. "Dec". */
export const monthShort = (month: number): string => t(monthKey("monthShort", month));
