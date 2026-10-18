<script setup lang="ts">
import { reactive } from "vue";
import type { PersonNameInput } from "../data/people.ts";

const props = defineProps<{ initial: PersonNameInput }>();
const emit = defineEmits<{ submit: [input: PersonNameInput]; cancel: [] }>();

const form = reactive<PersonNameInput>({ ...props.initial });
</script>

<template>
  <form class="mb-4 flex flex-wrap items-end gap-3" @submit.prevent="emit('submit', { ...form })">
    <label class="flex flex-col text-sm">
      First name
      <input
        v-model="form.firstName"
        data-testid="first-name"
        class="rounded border border-gray-300 px-2 py-1"
        autofocus
      />
    </label>
    <label class="flex flex-col text-sm">
      Last name
      <input
        v-model="form.lastName"
        data-testid="last-name"
        class="rounded border border-gray-300 px-2 py-1"
      />
    </label>
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
  </form>
</template>
