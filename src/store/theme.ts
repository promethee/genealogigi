import { defineStore } from "pinia";
import { ref } from "vue";
import type { PlatformAPI } from "../platform/PlatformAPI.ts";

export type Theme = "light" | "dark";

/** Copy kept in localStorage so the right theme is applied before the first paint. */
export const THEME_CACHE_KEY = "genealogigi:theme";

export const isTheme = (value: unknown): value is Theme => value === "light" || value === "dark";

/** Puts the theme on the page: the `dark` class (for styles) and `color-scheme` (native controls). */
export function applyTheme(
  theme: Theme,
  root: HTMLElement | undefined = globalThis.document?.documentElement,
): void {
  if (!root) return;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function systemPrefersDark(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;
}

function readCache(): Theme | null {
  try {
    const value = globalThis.localStorage?.getItem(THEME_CACHE_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

function writeCache(theme: Theme): void {
  try {
    globalThis.localStorage?.setItem(THEME_CACHE_KEY, theme);
  } catch {
    // No storage: the platform setting still remembers it.
  }
}

/** The very first paint: the cached choice if any, otherwise the system preference. */
export function initialTheme(prefersDark: () => boolean = systemPrefersDark): Theme {
  return readCache() ?? (prefersDark() ? "dark" : "light");
}

/**
 * Light or dark. With no saved choice the app follows the system; once the user clicks, their
 * choice is saved and wins over the system.
 */
export function defineThemeStore(
  platform: PlatformAPI,
  prefersDark: () => boolean = systemPrefersDark,
) {
  return defineStore("theme", () => {
    const theme = ref<Theme>(initialTheme(prefersDark));
    /** True once the user (or a saved setting) chose: the system no longer decides. */
    const explicit = ref(false);

    function set(next: Theme): void {
      theme.value = next;
      applyTheme(next);
      writeCache(next);
    }

    async function init(): Promise<void> {
      let saved: unknown = null;
      try {
        saved = await platform.settings.getTheme();
      } catch {
        // A shell without theme support: follow the system.
      }
      if (isTheme(saved)) {
        explicit.value = true;
        set(saved);
      } else {
        set(prefersDark() ? "dark" : "light");
      }
      // Until the user chooses, a change of the system preference is followed live.
      if (typeof matchMedia === "function") {
        matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", (event) => {
          if (!explicit.value) set(event.matches ? "dark" : "light");
        });
      }
    }

    async function toggle(): Promise<void> {
      explicit.value = true;
      const root = globalThis.document?.documentElement;
      root?.classList.add("theme-switching");
      set(theme.value === "dark" ? "light" : "dark");
      // Two frames later the new colours are painted; transitions can come back.
      if (root && typeof requestAnimationFrame === "function") {
        requestAnimationFrame(() =>
          requestAnimationFrame(() => root.classList.remove("theme-switching")),
        );
      } else {
        root?.classList.remove("theme-switching");
      }
      try {
        await platform.settings.setTheme(theme.value);
      } catch {
        // Not remembered, but the switch itself still works.
      }
    }

    return { theme, explicit, init, toggle };
  });
}
