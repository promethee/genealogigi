<script setup lang="ts">
import { LOCALES, t, type Locale } from "../i18n/index.ts";
import { useLanguageStore } from "../store/index.ts";

const language = useLanguageStore();

const LABELS: Record<Locale, string> = { en: "EN", fr: "FR" };
</script>

<template>
  <div
    role="group"
    :aria-label="t('lang.label')"
    :title="t('lang.label')"
    class="flex overflow-hidden rounded border border-gray-300 text-xs"
    data-testid="language-switch"
  >
    <button
      v-for="code in LOCALES"
      :key="code"
      type="button"
      :data-testid="`lang-${code}`"
      :aria-pressed="language.current === code"
      class="px-2 py-0.5"
      :class="
        language.current === code
          ? 'bg-emerald-700 text-white'
          : 'bg-white text-gray-600 hover:bg-gray-50'
      "
      @click="language.choose(code)"
    >
      {{ LABELS[code] }}
    </button>
  </div>
</template>
