<script setup lang="ts">
import { reactive } from "vue";
import { MONTH_NAMES } from "../data/dates.ts";
import type { PersonFormValues } from "../data/people.ts";

const props = defineProps<{ initial: PersonFormValues }>();
const emit = defineEmits<{ submit: [input: PersonFormValues]; cancel: [] }>();

const form = reactive<PersonFormValues>({
  ...props.initial,
  birth: { ...props.initial.birth },
  death: { ...props.initial.death },
});

function submit(): void {
  emit("submit", { ...form, birth: { ...form.birth }, death: { ...form.death } });
}

const inputClass = "rounded border border-gray-300 px-2 py-1";
</script>

<template>
  <form class="mb-4 flex flex-col gap-3" @submit.prevent="submit">
    <div class="flex flex-wrap items-end gap-3">
      <label class="flex flex-col text-sm">
        First name
        <input v-model="form.firstName" data-testid="first-name" :class="inputClass" autofocus />
      </label>
      <label class="flex flex-col text-sm">
        Last name
        <input v-model="form.lastName" data-testid="last-name" :class="inputClass" />
      </label>
    </div>

    <fieldset class="flex flex-wrap items-end gap-3">
      <legend class="mb-1 text-sm text-gray-600">Birth date (any part may be left empty)</legend>
      <input
        v-model="form.birth.year"
        data-testid="birth-year"
        placeholder="Year"
        inputmode="numeric"
        :class="[inputClass, 'w-24']"
      />
      <select v-model="form.birth.month" data-testid="birth-month" :class="inputClass">
        <option value="">Month</option>
        <option v-for="(name, index) in MONTH_NAMES" :key="name" :value="String(index + 1)">
          {{ name }}
        </option>
      </select>
      <input
        v-model="form.birth.day"
        data-testid="birth-day"
        placeholder="Day"
        inputmode="numeric"
        :class="[inputClass, 'w-20']"
      />
    </fieldset>

    <div class="flex flex-wrap items-end gap-3">
      <label class="flex flex-col text-sm">
        Life status
        <select v-model="form.status" data-testid="life-status" :class="inputClass">
          <option value="unknown">Unknown</option>
          <option value="living">Living</option>
          <option value="deceased">Deceased</option>
        </select>
      </label>
      <fieldset v-if="form.status === 'deceased'" class="flex flex-wrap items-end gap-3">
        <legend class="mb-1 text-sm text-gray-600">Death date (may be left empty)</legend>
        <input
          v-model="form.death.year"
          data-testid="death-year"
          placeholder="Year"
          inputmode="numeric"
          :class="[inputClass, 'w-24']"
        />
        <select v-model="form.death.month" data-testid="death-month" :class="inputClass">
          <option value="">Month</option>
          <option v-for="(name, index) in MONTH_NAMES" :key="name" :value="String(index + 1)">
            {{ name }}
          </option>
        </select>
        <input
          v-model="form.death.day"
          data-testid="death-day"
          placeholder="Day"
          inputmode="numeric"
          :class="[inputClass, 'w-20']"
        />
      </fieldset>
    </div>

    <div class="flex gap-3">
      <button
        type="submit"
        data-testid="submit-person"
        class="rounded bg-emerald-700 px-4 py-1.5 text-white"
      >
        Save
      </button>
      <button
        type="button"
        data-testid="cancel-person"
        class="rounded border border-gray-300 px-4 py-1.5"
        @click="emit('cancel')"
      >
        Cancel
      </button>
    </div>
  </form>
</template>
