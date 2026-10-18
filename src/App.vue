<script setup lang="ts">
import { onMounted } from "vue";
import { TREE_ICON_PATH } from "./brand.ts";
import AppIcon from "./components/AppIcon.vue";
import ConfirmDialog from "./components/ConfirmDialog.vue";
import LanguageSwitch from "./components/LanguageSwitch.vue";
import ThemeSwitch from "./components/ThemeSwitch.vue";
import UpdateBanner from "./components/UpdateBanner.vue";
import { t } from "./i18n/index.ts";
import { useAppStore, useFamilyStore, useLanguageStore, useThemeStore } from "./store/index.ts";
import PeopleView from "./views/PeopleView.vue";
import WelcomeView from "./views/WelcomeView.vue";

const family = useFamilyStore();
const language = useLanguageStore();
const app = useAppStore();
const theme = useThemeStore();
onMounted(async () => {
  await theme.init();
  await language.init();
  await app.init();
});
</script>

<template>
  <div class="flex h-screen w-screen flex-col bg-page">
    <!-- Always visible, on every screen. -->
    <header
      class="flex shrink-0 items-center justify-between border-b border-slate-200 bg-surface/90 px-5 py-2 backdrop-blur"
    >
      <div class="flex items-center gap-2.5" data-testid="brand">
        <span
          class="grid size-7 place-items-center rounded-lg bg-linear-to-br from-emerald-500 to-emerald-800 text-white shadow-sm"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            class="size-4"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path :d="TREE_ICON_PATH" />
          </svg>
        </span>
        <span class="text-sm font-semibold tracking-tight text-slate-800">Genealogigi</span>
      </div>
      <div class="flex items-center gap-3">
        <button
          data-testid="check-update"
          class="btn btn-ghost btn-sm"
          :disabled="app.checking"
          @click="app.checkNow()"
        >
          <AppIcon name="sync" :class="{ 'animate-spin': app.checking }" />
          {{ app.checking ? t("update.checking") : t("update.check") }}
        </button>
        <ThemeSwitch />
        <LanguageSwitch />
      </div>
    </header>
    <UpdateBanner />
    <ConfirmDialog />
    <div class="min-h-0 flex-1">
      <PeopleView v-if="family.filePath" />
      <WelcomeView v-else />
    </div>
  </div>
</template>
