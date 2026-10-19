import { createPinia } from "pinia";
import { askConfirm } from "../lib/confirmDialog.ts";
import { askText } from "../lib/promptDialog.ts";
import type { PlatformAPI } from "../platform/PlatformAPI.ts";
import { createPlatformAPI } from "../platform/tauri.ts";
import { defineAppStore } from "./app.ts";
import { defineFamilyStore } from "./family.ts";
import { defineLanguageStore } from "./language.ts";
import { defineThemeStore } from "./theme.ts";

declare global {
  interface Window {
    /** Dev-only seam: lets Playwright run the UI in a plain browser with a fake shell. */
    __GENEALOGIGI_PLATFORM__?: PlatformAPI;
    /** Dev-only seam: the e2e fake shell never touches the network unless a test provides this. */
    /** Dev-only seam: lets a fake shell show the real in-app confirmation dialog. */
    __GENEALOGIGI_CONFIRM__?: typeof askConfirm;
    /** Dev-only seam: lets a fake shell show the real in-app text prompt. */
    __GENEALOGIGI_PROMPT__?: typeof askText;
    __GENEALOGIGI_FETCH__?: Parameters<typeof defineAppStore>[1];
  }
}

if (import.meta.env.DEV) {
  window.__GENEALOGIGI_CONFIRM__ = askConfirm;
  window.__GENEALOGIGI_PROMPT__ = askText;
}

export const pinia = createPinia();
const platform =
  (import.meta.env.DEV ? window.__GENEALOGIGI_PLATFORM__ : undefined) ?? createPlatformAPI();
export const useFamilyStore = defineFamilyStore(platform);
export const useLanguageStore = defineLanguageStore(platform);
// With a fake shell (tests) the update check only ever uses the fetch the test provides.
const testShell = import.meta.env.DEV && window.__GENEALOGIGI_PLATFORM__ !== undefined;
// Dev-only seam for the real-app tests: ask this address (a local fake) for the latest release
// instead of GitHub. Set through the dev server's environment; never present in a build.
const releasesOverride: string | undefined = import.meta.env.DEV
  ? (import.meta.env as Record<string, string | undefined>).VITE_GENEALOGIGI_RELEASES_URL
  : undefined;
export const useAppStore = defineAppStore(
  platform,
  testShell
    ? (window.__GENEALOGIGI_FETCH__ ??
        (() => Promise.reject(new Error("network disabled in tests"))))
    : releasesOverride
      ? (_url, init) => fetch(releasesOverride, init)
      : undefined,
);
export const useThemeStore = defineThemeStore(platform);
