<script setup lang="ts">
import { watch } from "vue";
import { t } from "../i18n/index.ts";
import { useAppStore } from "../store/index.ts";
import AppIcon from "./AppIcon.vue";

const app = useAppStore();

// A manual "up to date" / "failed" message fades after a few seconds.
watch(
  () => app.manualResult,
  (result) => {
    if (result) setTimeout(() => app.clearManualResult(), 6000);
  },
);
</script>

<template>
  <div
    v-if="app.bannerVisible && app.update"
    data-testid="update-banner"
    class="flex flex-wrap items-center justify-center gap-3 border-b border-sky-200 dark:border-sky-900 bg-sky-50 px-5 py-2 text-sm text-sky-900 dark:bg-sky-950/50 dark:text-sky-100 dark:bg-sky-950/50 dark:text-sky-100"
    role="status"
  >
    <span data-testid="update-text">
      {{ t("update.available", { latest: app.update.latest, current: app.currentVersion }) }}
    </span>
    <button data-testid="update-download" class="btn btn-primary btn-sm" @click="app.download()">
      <AppIcon name="copy" />
      {{ t("update.download") }}
    </button>
    <button data-testid="update-dismiss" class="btn btn-secondary btn-sm" @click="app.dismiss()">
      {{ t("update.dismiss") }}
    </button>
  </div>
  <div
    v-else-if="app.manualResult"
    data-testid="update-result"
    class="border-b px-5 py-1.5 text-center text-sm"
    :class="
      app.manualResult === 'current'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200'
        : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200'
    "
    role="status"
  >
    {{
      app.manualResult === "current"
        ? t("update.current", { current: app.currentVersion })
        : t("update.failed")
    }}
  </div>
</template>
