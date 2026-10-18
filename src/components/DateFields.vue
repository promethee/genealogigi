<script setup lang="ts">
import { monthNames, type PartialDateInput } from "../data/dates.ts";
import { t } from "../i18n/index.ts";

defineProps<{ label: string; testPrefix: string }>();
const model = defineModel<PartialDateInput>({ required: true });

const inputClass = "input";
</script>

<template>
  <fieldset class="flex flex-wrap items-end gap-2">
    <legend class="mb-1 text-xs font-medium text-slate-500">{{ label }}</legend>
    <input
      v-model="model.year"
      :data-testid="`${testPrefix}-year`"
      :placeholder="t('form.year')"
      inputmode="numeric"
      :class="[inputClass, 'w-24']"
    />
    <select v-model="model.month" :data-testid="`${testPrefix}-month`" :class="inputClass">
      <option value="">{{ t("form.month") }}</option>
      <option v-for="(name, index) in monthNames()" :key="name" :value="String(index + 1)">
        {{ name }}
      </option>
    </select>
    <input
      v-model="model.day"
      :data-testid="`${testPrefix}-day`"
      :placeholder="t('form.day')"
      inputmode="numeric"
      :class="[inputClass, 'w-20']"
    />
  </fieldset>
</template>
