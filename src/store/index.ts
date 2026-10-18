import { createPinia } from "pinia";
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
    __GENEALOGIGI_FETCH__?: Parameters<typeof defineAppStore>[1];
  }
}

export const pinia = createPinia();
const platform =
  (import.meta.env.DEV ? window.__GENEALOGIGI_PLATFORM__ : undefined) ?? createPlatformAPI();
export const useFamilyStore = defineFamilyStore(platform);
export const useLanguageStore = defineLanguageStore(platform);
// With a fake shell (tests) the update check only ever uses the fetch the test provides.
const testShell = import.meta.env.DEV && window.__GENEALOGIGI_PLATFORM__ !== undefined;
export const useAppStore = defineAppStore(
  platform,
  testShell
    ? (window.__GENEALOGIGI_FETCH__ ??
        (() => Promise.reject(new Error("network disabled in tests"))))
    : undefined,
);
export const useThemeStore = defineThemeStore(platform);
