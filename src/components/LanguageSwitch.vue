<script setup lang="ts">
import { LANGUAGE_NAMES, LOCALES, t } from "../i18n/index.ts";
import { useLanguageStore } from "../store/index.ts";
import FlagIcon from "./FlagIcon.vue";

const language = useLanguageStore();
</script>

<template>
  <div
    role="group"
    :aria-label="t('lang.label')"
    :title="t('lang.label')"
    class="flex gap-0.5 rounded-xl bg-slate-100 p-0.5 text-sm"
    data-testid="language-switch"
  >
    <button
      v-for="code in LOCALES"
      :key="code"
      type="button"
      :data-testid="`lang-${code}`"
      :aria-pressed="language.current === code"
      class="flex cursor-pointer items-center gap-2 rounded-[10px] px-2.5 py-1 font-medium transition"
      :class="
        language.current === code
          ? 'bg-surface text-slate-900 shadow-sm'
          : 'text-slate-500 hover:text-slate-800'
      "
      @click="language.choose(code)"
    >
      <FlagIcon :locale="code" />
      {{ LANGUAGE_NAMES[code] }}
    </button>
  </div>
</template>
