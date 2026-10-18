import { defineStore } from "pinia";
import { computed } from "vue";
import { isLocale, locale, localeFromSystem, setLocale, type Locale } from "../i18n/index.ts";
import type { PlatformAPI } from "../platform/PlatformAPI.ts";

/** The UI language: remembered through the platform, first launch follows the system. */
export function defineLanguageStore(platform: PlatformAPI) {
  return defineStore("language", () => {
    const current = computed(() => locale.value);

    async function init(): Promise<void> {
      let saved: unknown = null;
      try {
        saved = await platform.settings.getLanguage();
      } catch {
        // A shell without language support: fall back to the system language.
      }
      const system = typeof navigator === "undefined" ? undefined : navigator.language;
      setLocale(isLocale(saved) ? saved : localeFromSystem(system));
    }

    async function choose(next: Locale): Promise<void> {
      setLocale(next);
      try {
        await platform.settings.setLanguage(next);
      } catch {
        // Not remembered, but the switch itself still works.
      }
    }

    return { current, init, choose };
  });
}
