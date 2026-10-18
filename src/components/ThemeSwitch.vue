<script setup lang="ts">
import { computed } from "vue";
import { t } from "../i18n/index.ts";
import { useThemeStore } from "../store/index.ts";
import AppIcon from "./AppIcon.vue";

const theme = useThemeStore();
const dark = computed(() => theme.theme === "dark");
const label = computed(() => (dark.value ? t("theme.toLight") : t("theme.toDark")));
</script>

<template>
  <button
    type="button"
    data-testid="theme-toggle"
    :data-theme="theme.theme"
    class="btn btn-secondary btn-sm size-8 p-0!"
    :aria-label="label"
    :title="label"
    @click="theme.toggle()"
  >
    <AppIcon :name="dark ? 'sun' : 'moon'" />
  </button>
</template>
