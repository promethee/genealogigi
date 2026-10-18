<script setup lang="ts" generic="K extends string">
import { MONTH_NAMES } from "../data/dates.ts";
import { blankNameEntry, type NameEntryInput } from "../data/people.ts";

const props = defineProps<{
  /** Heading, e.g. "First names". */
  title: string;
  /** Singular noun for buttons, e.g. "first name". */
  noun: string;
  kinds: readonly K[];
  /** Prefix for data-testid attributes, e.g. "first-name". */
  testPrefix: string;
}>();

const entries = defineModel<NameEntryInput<K>[]>({ required: true });

const inputClass = "rounded border border-gray-300 px-2 py-1";

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function add(): void {
  const firstKind = props.kinds[0] as K;
  entries.value = [...entries.value, blankNameEntry(firstKind, entries.value.length === 0)];
}

function remove(index: number): void {
  const wasPrimary = entries.value[index]?.primary === true;
  const rest = entries.value.filter((_, i) => i !== index);
  const head = rest[0];
  if (wasPrimary && head) head.primary = true;
  entries.value = rest;
}

function move(index: number, delta: -1 | 1): void {
  const target = index + delta;
  if (target < 0 || target >= entries.value.length) return;
  const next = [...entries.value];
  const moved = next[index] as NameEntryInput<K>;
  next[index] = next[target] as NameEntryInput<K>;
  next[target] = moved;
  entries.value = next;
}

function makePrimary(index: number): void {
  entries.value.forEach((entry, i) => {
    entry.primary = i === index;
  });
}
</script>

<template>
  <fieldset class="flex flex-col gap-2" :data-testid="`${testPrefix}-list`">
    <legend class="mb-1 text-sm font-medium text-gray-700">{{ title }}</legend>
    <div
      v-for="(entry, index) in entries"
      :key="index"
      class="flex flex-wrap items-center gap-2"
      :data-testid="`${testPrefix}-row`"
    >
      <input
        v-model="entry.value"
        :data-testid="testPrefix"
        :placeholder="capitalise(noun)"
        :class="inputClass"
      />
      <select v-model="entry.kind" :data-testid="`${testPrefix}-kind`" :class="inputClass">
        <option v-for="kind in kinds" :key="kind" :value="kind">{{ capitalise(kind) }}</option>
      </select>
      <input
        v-model="entry.date.year"
        :data-testid="`${testPrefix}-year`"
        placeholder="Year"
        inputmode="numeric"
        :class="[inputClass, 'w-20']"
      />
      <select v-model="entry.date.month" :data-testid="`${testPrefix}-month`" :class="inputClass">
        <option value="">Month</option>
        <option v-for="(name, i) in MONTH_NAMES" :key="name" :value="String(i + 1)">
          {{ name }}
        </option>
      </select>
      <input
        v-model="entry.date.day"
        :data-testid="`${testPrefix}-day`"
        placeholder="Day"
        inputmode="numeric"
        :class="[inputClass, 'w-16']"
      />
      <label class="flex items-center gap-1 text-sm">
        <input
          type="radio"
          :name="`${testPrefix}-primary`"
          :checked="entry.primary"
          :data-testid="`${testPrefix}-primary`"
          @change="makePrimary(index)"
        />
        Primary
      </label>
      <button
        type="button"
        :data-testid="`${testPrefix}-up`"
        :aria-label="`Move ${noun} up`"
        :disabled="index === 0"
        class="rounded border border-gray-300 px-2 py-1 disabled:text-gray-300"
        @click="move(index, -1)"
      >
        ↑
      </button>
      <button
        type="button"
        :data-testid="`${testPrefix}-down`"
        :aria-label="`Move ${noun} down`"
        :disabled="index === entries.length - 1"
        class="rounded border border-gray-300 px-2 py-1 disabled:text-gray-300"
        @click="move(index, 1)"
      >
        ↓
      </button>
      <button
        type="button"
        :data-testid="`${testPrefix}-remove`"
        :aria-label="`Remove ${noun}`"
        class="rounded border border-gray-300 px-2 py-1 text-red-600"
        @click="remove(index)"
      >
        ✕
      </button>
    </div>
    <button
      type="button"
      :data-testid="`add-${testPrefix}`"
      class="self-start text-sm text-emerald-700 hover:underline"
      @click="add"
    >
      + Add {{ noun }}
    </button>
  </fieldset>
</template>
