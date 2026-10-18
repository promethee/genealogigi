import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { APP_TITLE, APP_VERSION } from "../appInfo.ts";
import { checkForUpdate, type UpdateCheck } from "../data/update.ts";
import type { PlatformAPI } from "../platform/PlatformAPI.ts";

type FetchFn = Parameters<typeof checkForUpdate>[0];

/**
 * The app itself: its window title and the "is there a newer version" check. Every shell call
 * is guarded, so a shell without these capabilities (a plain browser, the e2e fake) still works.
 */
export function defineAppStore(
  platform: PlatformAPI,
  fetchFn: FetchFn = (url, init) => fetch(url, init),
  currentVersion: string = APP_VERSION,
) {
  return defineStore("app", () => {
    /** The newer release found by the last check, if any. */
    const update = ref<{ latest: string; url: string } | null>(null);
    const dismissed = ref<string | null>(null);
    const checking = ref(false);
    /** Result of the last manual check, shown briefly in the top bar. */
    const manualResult = ref<"current" | "failed" | null>(null);

    const bannerVisible = computed(
      () => update.value !== null && update.value.latest !== dismissed.value,
    );

    async function run(): Promise<UpdateCheck> {
      checking.value = true;
      try {
        const result = await checkForUpdate(fetchFn, currentVersion);
        update.value =
          result.status === "available" ? { latest: result.latest, url: result.url } : null;
        return result;
      } finally {
        checking.value = false;
      }
    }

    /** Sets the window title, then looks for a newer version without showing anything else. */
    async function init(): Promise<void> {
      try {
        await platform.window.setTitle(APP_TITLE);
      } catch {
        // No native window (plain browser): nothing to title.
      }
      try {
        dismissed.value = await platform.settings.getDismissedUpdate();
      } catch {
        dismissed.value = null;
      }
      await run();
    }

    /** The manual button: same check, but every outcome is reported and a dismissal is ignored. */
    async function checkNow(): Promise<void> {
      manualResult.value = null;
      dismissed.value = null;
      const result = await run();
      if (result.status !== "available") manualResult.value = result.status;
    }

    async function dismiss(): Promise<void> {
      const latest = update.value?.latest;
      if (!latest) return;
      dismissed.value = latest;
      try {
        await platform.settings.setDismissedUpdate(latest);
      } catch {
        // Dismissed for this session only.
      }
    }

    async function download(): Promise<void> {
      if (!update.value) return;
      try {
        await platform.openExternal(update.value.url);
      } catch {
        // Nothing sensible to do if the browser cannot be opened.
      }
    }

    function clearManualResult(): void {
      manualResult.value = null;
    }

    return {
      update,
      checking,
      manualResult,
      bannerVisible,
      currentVersion,
      init,
      checkNow,
      dismiss,
      download,
      clearManualResult,
    };
  });
}
