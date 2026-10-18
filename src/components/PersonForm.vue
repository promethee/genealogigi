<script setup lang="ts">
import { reactive } from "vue";
import { MONTH_NAMES } from "../data/dates.ts";
import { FIRST_NAME_KINDS, LAST_NAME_KINDS, type PersonFormValues } from "../data/people.ts";
import NameEntriesEditor from "./NameEntriesEditor.vue";

const props = defineProps<{ initial: PersonFormValues }>();
const emit = defineEmits<{ submit: [input: PersonFormValues]; cancel: [] }>();

// The form state is plain JSON, so a JSON round trip is a safe deep copy even when the
// values are reactive proxies (structuredClone throws on those).
const clonePlain = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

// Deep copy so editing never touches the caller's object.
const form = reactive<PersonFormValues>(clonePlain(props.initial));

function submit(): void {
  emit("submit", clonePlain(form));
}

const inputClass = "rounded border border-gray-300 px-2 py-1";
</script>

<template>
  <form class="mb-4 flex flex-col gap-3" @submit.prevent="submit">
    <NameEntriesEditor
      v-model="form.firstNames"
      title="First names"
      noun="first name"
      :kinds="FIRST_NAME_KINDS"
      test-prefix="first-name"
    />
    <NameEntriesEditor
      v-model="form.lastNames"
      title="Last names"
      noun="last name"
      :kinds="LAST_NAME_KINDS"
      test-prefix="last-name"
    />

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
