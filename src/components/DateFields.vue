<script setup lang="ts">
import { MONTH_NAMES, type PartialDateInput } from "../data/dates.ts";

defineProps<{ label: string; testPrefix: string }>();
const model = defineModel<PartialDateInput>({ required: true });

const inputClass = "rounded border border-gray-300 px-2 py-1";
</script>

<template>
  <fieldset class="flex flex-wrap items-end gap-2">
    <legend class="mb-1 text-sm text-gray-600">{{ label }}</legend>
    <input
      v-model="model.year"
      :data-testid="`${testPrefix}-year`"
      placeholder="Year"
      inputmode="numeric"
      :class="[inputClass, 'w-24']"
    />
    <select v-model="model.month" :data-testid="`${testPrefix}-month`" :class="inputClass">
      <option value="">Month</option>
      <option v-for="(name, index) in MONTH_NAMES" :key="name" :value="String(index + 1)">
        {{ name }}
      </option>
    </select>
    <input
      v-model="model.day"
      :data-testid="`${testPrefix}-day`"
      placeholder="Day"
      inputmode="numeric"
      :class="[inputClass, 'w-20']"
    />
  </fieldset>
</template>
