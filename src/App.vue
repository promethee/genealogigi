<script setup lang="ts">
import { onMounted } from "vue";
import LanguageSwitch from "./components/LanguageSwitch.vue";
import { useFamilyStore, useLanguageStore } from "./store/index.ts";
import PeopleView from "./views/PeopleView.vue";
import WelcomeView from "./views/WelcomeView.vue";

const family = useFamilyStore();
const language = useLanguageStore();
onMounted(() => language.init());
</script>

<template>
  <div class="flex h-screen w-screen flex-col bg-slate-50">
    <!-- Always visible, on every screen. -->
    <header
      class="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white/90 px-5 py-2 backdrop-blur"
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
            <path d="M12 3v6M12 9H6v4M12 9h6v4M6 13v5M18 13v5" />
          </svg>
        </span>
        <span class="text-sm font-semibold tracking-tight text-slate-800">Genealogigi</span>
      </div>
      <LanguageSwitch />
    </header>
    <div class="min-h-0 flex-1">
      <PeopleView v-if="family.filePath" />
      <WelcomeView v-else />
    </div>
  </div>
</template>
