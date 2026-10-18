<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { emptyDateInput, type PartialDateInput } from "../data/dates.ts";
import { EVENT_KINDS, type EventInput } from "../data/events.ts";
import { displayName } from "../data/people.ts";
import type { EventKind, FamilyEvent, Person, PersonId } from "../data/types.ts";
import { inputFromDate } from "../data/dates.ts";
import { t, type MessageKey } from "../i18n/index.ts";
import AppIcon from "./AppIcon.vue";
import DateFields from "./DateFields.vue";

const props = defineProps<{
  /** The person whose card this is: always part of the event. */
  personId: PersonId;
  people: Person[];
  /** An event being edited, or undefined for a new one. */
  event?: FamilyEvent;
  /** Places already saved, offered as suggestions. */
  placeSuggestions?: string[];
}>();
const emit = defineEmits<{ submit: [input: EventInput]; cancel: [] }>();

const kind = ref<EventKind>(props.event?.kind ?? "marriage");
const date = reactive<PartialDateInput>(
  props.event ? { ...inputFromDate(props.event.date) } : emptyDateInput(),
);
const place = ref(props.event?.place ?? "");
const description = ref(props.event?.description ?? "");
/** The other people involved (not the card's person). */
const others = ref<PersonId[]>(props.event?.personIds.filter((p) => p !== props.personId) ?? []);
const toAdd = ref<PersonId | "">("");

const choices = computed(() =>
  props.people.filter((p) => p.id !== props.personId && !others.value.includes(p.id)),
);
const nameOf = (id: PersonId) => {
  const person = props.people.find((p) => p.id === id);
  return person ? displayName(person) : t("rel.unknownPerson");
};

function addOther(): void {
  if (toAdd.value) others.value = [...others.value, toAdd.value];
  toAdd.value = "";
}

function submit(): void {
  emit("submit", {
    kind: kind.value,
    date: { ...date },
    place: place.value,
    description: description.value,
    personIds: [props.personId, ...others.value],
  });
}
</script>

<template>
  <form
    class="flex flex-col gap-3 rounded-xl bg-slate-50 p-4"
    data-testid="event-form"
    @submit.prevent="submit"
  >
    <h4 class="text-sm font-semibold text-slate-700">
      {{ event ? t("event.edit") : t("event.add") }}
    </h4>
    <div class="flex flex-wrap items-end gap-3">
      <label class="label">
        {{ t("event.type") }}
        <select v-model="kind" data-testid="event-kind" class="input">
          <option v-for="k in EVENT_KINDS" :key="k" :value="k">
            {{ t(`event.kind.${k}` as MessageKey) }}
          </option>
        </select>
      </label>
      <DateFields v-model="date" :label="t('event.date')" test-prefix="event-date" />
    </div>
    <datalist v-if="placeSuggestions?.length" id="event-place-suggestions">
      <option v-for="p in placeSuggestions" :key="p" :value="p" />
    </datalist>
    <div class="flex flex-wrap gap-3">
      <label class="label min-w-56 flex-1">
        {{ t("event.place") }}
        <input
          v-model="place"
          data-testid="event-place"
          class="input"
          autocomplete="off"
          :placeholder="t('form.placeExample')"
          :list="placeSuggestions?.length ? 'event-place-suggestions' : undefined"
        />
      </label>
      <label class="label min-w-56 flex-1">
        {{ kind === "other" ? t("event.description") : t("event.descriptionOptional") }}
        <input
          v-model="description"
          data-testid="event-description"
          class="input"
          autocomplete="off"
        />
      </label>
    </div>
    <div class="flex flex-col gap-2">
      <span class="label">{{ t("event.with") }}</span>
      <div class="flex flex-wrap items-center gap-2">
        <span v-for="id in others" :key="id" class="chip" data-testid="event-person">
          {{ nameOf(id) }}
          <button
            type="button"
            class="cursor-pointer text-slate-400 hover:text-red-600"
            data-testid="event-person-remove"
            :aria-label="t('event.removePerson', { name: nameOf(id) })"
            @click="others = others.filter((o) => o !== id)"
          >
            <AppIcon name="x" class="size-3" />
          </button>
        </span>
        <select
          v-if="choices.length"
          v-model="toAdd"
          data-testid="event-add-person"
          class="input"
          @change="addOther"
        >
          <option value="">{{ t("event.addPerson") }}</option>
          <option v-for="p in choices" :key="p.id" :value="p.id">{{ displayName(p) }}</option>
        </select>
      </div>
    </div>
    <div class="flex gap-3">
      <button type="submit" data-testid="event-save" class="btn btn-primary">
        <AppIcon name="check" />
        {{ t("common.save") }}
      </button>
      <button
        type="button"
        data-testid="event-cancel"
        class="btn btn-secondary"
        @click="emit('cancel')"
      >
        {{ t("common.cancel") }}
      </button>
    </div>
  </form>
</template>
