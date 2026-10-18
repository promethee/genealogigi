<script setup lang="ts" generic="K extends string">
import { computed } from "vue";
import { monthNames } from "../data/dates.ts";
import AppIcon from "./AppIcon.vue";
import { t, type MessageKey } from "../i18n/index.ts";
import { blankNameEntry, type NameEntryInput } from "../data/people.ts";

const props = defineProps<{
  /** Heading, e.g. "First names". */
  title: string;
  /** Singular noun for buttons, e.g. "first name". */
  noun: string;
  kinds: readonly K[];
  /** Prefix for data-testid attributes, e.g. "first-name". */
  testPrefix: string;
  /** Link text that adds a changed name, e.g. "Last name changed (e.g. marriage)". */
  addLabel: string;
  /** Kind preselected for a changed name. */
  addKind: K;
  /** Whether a changed name becomes the main name straight away. */
  newBecomesMain: boolean;
  /** Names offered while typing (a native datalist); free typing is always allowed. */
  suggestions?: string[];
}>();

const entries = defineModel<NameEntryInput<K>[]>({ required: true });

const inputClass = "input";

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Detailed controls (kind, date, main name, reorder) only matter once a person has
 * several names or a name that carries a kind or date; most people never change names.
 */
const detailed = computed(() => {
  const list = entries.value;
  if (list.length > 1) return true;
  const only = list[0];
  if (!only) return false;
  const d = only.date;
  return only.kind !== props.kinds[0] || Boolean(d.year || d.month || d.day);
});

function add(): void {
  const empty = entries.value.length === 0;
  const entry = blankNameEntry(props.addKind, empty);
  if (!empty && props.newBecomesMain) {
    entries.value.forEach((e) => {
      e.primary = false;
    });
    entry.primary = true;
  }
  entries.value = [...entries.value, entry];
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
    <datalist v-if="suggestions?.length" :id="`${testPrefix}-suggestions`">
      <option v-for="name in suggestions" :key="name" :value="name" />
    </datalist>
    <legend class="mb-1 text-sm font-semibold text-slate-700">
      {{ detailed ? title : capitalise(noun) }}
    </legend>
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
        autocomplete="off"
        :list="suggestions?.length ? `${testPrefix}-suggestions` : undefined"
        :class="inputClass"
      />
      <select
        v-if="detailed"
        v-model="entry.kind"
        :data-testid="`${testPrefix}-kind`"
        :class="inputClass"
      >
        <option v-for="kind in kinds" :key="kind" :value="kind">
          {{ t(`kind.${kind}` as MessageKey) }}
        </option>
      </select>
      <div v-if="detailed" class="flex items-center gap-2">
        <input
          v-if="detailed"
          v-model="entry.date.year"
          :data-testid="`${testPrefix}-year`"
          :placeholder="index === 0 ? t('form.year') : t('form.sinceYear')"
          autocomplete="off"
          inputmode="numeric"
          :class="[inputClass, index === 0 ? 'w-20' : 'w-36']"
        />
        <select
          v-if="detailed"
          v-model="entry.date.month"
          :data-testid="`${testPrefix}-month`"
          :class="inputClass"
        >
          <option value="">{{ t("form.month") }}</option>
          <option v-for="(name, i) in monthNames()" :key="name" :value="String(i + 1)">
            {{ name }}
          </option>
        </select>
        <input
          v-if="detailed"
          v-model="entry.date.day"
          :data-testid="`${testPrefix}-day`"
          :placeholder="t('form.day')"
          autocomplete="off"
          inputmode="numeric"
          :class="[inputClass, 'w-16']"
        />
      </div>
      <div v-if="detailed" class="flex items-center gap-2">
        <label v-if="detailed" class="flex items-center gap-1 text-sm">
          <input
            type="radio"
            :name="`${testPrefix}-primary`"
            :checked="entry.primary"
            :data-testid="`${testPrefix}-primary`"
            @change="makePrimary(index)"
          />
          {{ t("form.mainName") }}
        </label>
        <button
          v-if="detailed"
          type="button"
          :data-testid="`${testPrefix}-up`"
          :aria-label="t('form.moveUp', { noun })"
          :disabled="index === 0"
          class="btn btn-secondary btn-sm px-2"
          @click="move(index, -1)"
        >
          ↑
        </button>
        <button
          v-if="detailed"
          type="button"
          :data-testid="`${testPrefix}-down`"
          :aria-label="t('form.moveDown', { noun })"
          :disabled="index === entries.length - 1"
          class="btn btn-secondary btn-sm px-2"
          @click="move(index, 1)"
        >
          ↓
        </button>
        <button
          v-if="detailed"
          type="button"
          :data-testid="`${testPrefix}-remove`"
          :aria-label="t('form.remove', { noun })"
          class="btn btn-danger btn-sm px-2"
          @click="remove(index)"
        >
          ✕
        </button>
      </div>
    </div>
    <button
      type="button"
      :data-testid="`add-${testPrefix}`"
      class="btn btn-ghost btn-sm self-start"
      @click="add"
    >
      <AppIcon name="plus" />
      {{ addLabel }}
    </button>
  </fieldset>
</template>
