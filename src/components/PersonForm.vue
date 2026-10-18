<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { monthNames } from "../data/dates.ts";
import { t } from "../i18n/index.ts";
import {
  FIRST_NAME_KINDS,
  LAST_NAME_KINDS,
  suggestedStatus,
  type PersonFormValues,
} from "../data/people.ts";
import AppIcon from "./AppIcon.vue";
import NameEntriesEditor from "./NameEntriesEditor.vue";

const props = defineProps<{
  initial: PersonFormValues;
  /** True for a new person: the life status follows the birth year until the user picks one. */
  autoStatus?: boolean;
  /** Last names already saved, offered as suggestions in the last-name fields. */
  lastNameSuggestions?: string[];
}>();
const emit = defineEmits<{ submit: [input: PersonFormValues]; cancel: [] }>();

// The form state is plain JSON, so a JSON round trip is a safe deep copy even when the
// values are reactive proxies (structuredClone throws on those).
const clonePlain = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

// Deep copy so editing never touches the caller's object.
const form = reactive<PersonFormValues>(clonePlain(props.initial));

// Until the user picks a status themselves, it follows the typed birth year.
const statusTouched = ref(false);
watch(
  () => form.birth.year,
  (year) => {
    if (props.autoStatus && !statusTouched.value) form.status = suggestedStatus(year);
  },
);

function submit(): void {
  emit("submit", clonePlain(form));
}

const inputClass = "input";

/** A grey hint (30 years back), not a value: nothing is saved unless the user types it. */
const birthYearExample = computed(() =>
  t("form.example", { value: new Date().getFullYear() - 30 }),
);
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="submit">
    <NameEntriesEditor
      v-model="form.firstNames"
      :title="t('form.firstNames')"
      :noun="t('form.firstName').toLowerCase()"
      :kinds="FIRST_NAME_KINDS"
      test-prefix="first-name"
      :add-label="t('form.firstChanged')"
      add-kind="current"
      :new-becomes-main="false"
    />
    <NameEntriesEditor
      v-model="form.lastNames"
      :title="t('form.lastNames')"
      :noun="t('form.lastName').toLowerCase()"
      :kinds="LAST_NAME_KINDS"
      test-prefix="last-name"
      :add-label="t('form.lastChanged')"
      add-kind="married"
      :new-becomes-main="true"
      :suggestions="lastNameSuggestions"
    />

    <fieldset class="flex flex-wrap items-end gap-3">
      <legend class="mb-1 text-xs font-medium text-slate-500">{{ t("form.birthDate") }}</legend>
      <input
        v-model="form.birth.year"
        data-testid="birth-year"
        :placeholder="birthYearExample"
        inputmode="numeric"
        :class="[inputClass, 'w-24']"
      />
      <select v-model="form.birth.month" data-testid="birth-month" :class="inputClass">
        <option value="">{{ t("form.month") }}</option>
        <option v-for="(name, index) in monthNames()" :key="name" :value="String(index + 1)">
          {{ name }}
        </option>
      </select>
      <input
        v-model="form.birth.day"
        data-testid="birth-day"
        :placeholder="t('form.day')"
        inputmode="numeric"
        :class="[inputClass, 'w-20']"
      />
    </fieldset>

    <div class="flex flex-wrap items-end gap-3">
      <label class="label">
        {{ t("form.lifeStatus") }}
        <select
          v-model="form.status"
          data-testid="life-status"
          :class="inputClass"
          @change="statusTouched = true"
        >
          <option value="unknown">{{ t("form.status.unknown") }}</option>
          <option value="living">{{ t("form.status.living") }}</option>
          <option value="deceased">{{ t("form.status.deceased") }}</option>
        </select>
      </label>
      <fieldset v-if="form.status === 'deceased'" class="flex flex-wrap items-end gap-3">
        <legend class="mb-1 text-xs font-medium text-slate-500">{{ t("form.deathDate") }}</legend>
        <input
          v-model="form.death.year"
          data-testid="death-year"
          :placeholder="t('form.year')"
          inputmode="numeric"
          :class="[inputClass, 'w-24']"
        />
        <select v-model="form.death.month" data-testid="death-month" :class="inputClass">
          <option value="">{{ t("form.month") }}</option>
          <option v-for="(name, index) in monthNames()" :key="name" :value="String(index + 1)">
            {{ name }}
          </option>
        </select>
        <input
          v-model="form.death.day"
          data-testid="death-day"
          :placeholder="t('form.day')"
          inputmode="numeric"
          :class="[inputClass, 'w-20']"
        />
      </fieldset>
    </div>

    <div class="flex gap-3">
      <button type="submit" data-testid="submit-person" class="btn btn-primary">
        <AppIcon name="check" />
        {{ t("common.save") }}
      </button>
      <button
        type="button"
        data-testid="cancel-person"
        class="btn btn-secondary"
        @click="emit('cancel')"
      >
        {{ t("common.cancel") }}
      </button>
    </div>
  </form>
</template>
