import { createPinia } from "pinia";
import type { PlatformAPI } from "../platform/PlatformAPI.ts";
import { createPlatformAPI } from "../platform/tauri.ts";
import { defineFamilyStore } from "./family.ts";
import { defineLanguageStore } from "./language.ts";

declare global {
  interface Window {
    /** Dev-only seam: lets Playwright run the UI in a plain browser with a fake shell. */
    __GENEALOGIGI_PLATFORM__?: PlatformAPI;
  }
}

export const pinia = createPinia();
const platform =
  (import.meta.env.DEV ? window.__GENEALOGIGI_PLATFORM__ : undefined) ?? createPlatformAPI();
export const useFamilyStore = defineFamilyStore(platform);
export const useLanguageStore = defineLanguageStore(platform);
