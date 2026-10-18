<script setup lang="ts">
import { computed, ref } from "vue";
import { formatDate } from "../data/dates.ts";
import type { EventInput } from "../data/events.ts";
import { displayName, placeSuggestions } from "../data/people.ts";
import { timelineOf, type TimelineEntry } from "../data/timeline.ts";
import type { EventId, PersonId } from "../data/types.ts";
import { t } from "../i18n/index.ts";
import { useFamilyStore } from "../store/index.ts";
import AppIcon from "./AppIcon.vue";
import EventForm from "./EventForm.vue";

const props = defineProps<{ personId: PersonId }>();
const emit = defineEmits<{ select: [id: PersonId] }>();

const family = useFamilyStore();

const entries = computed<TimelineEntry[]>(() =>
  family.data ? timelineOf(family.data, props.personId) : [],
);
const people = computed(() => family.data?.people ?? []);

/** "new" = adding, an EventId = editing that event, null = form closed. */
const formTarget = ref<"new" | EventId | null>(null);
const editedEvent = computed(() =>
  (family.data?.events ?? []).find((e) => e.id === formTarget.value),
);

const nameOf = (id: PersonId): string => {
  const person = people.value.find((p) => p.id === id);
  return person ? displayName(person) : t("rel.unknownPerson");
};

function when(entry: TimelineEntry): string {
  return entry.date && (entry.date.yearKnown || entry.date.monthKnown || entry.date.dayKnown)
    ? formatDate(entry.date)
    : t("timeline.dateUnknown");
}

async function save(input: EventInput): Promise<void> {
  const target = formTarget.value;
  if (!target) return;
  const ok =
    target === "new" ? await family.addEvent(input) : await family.editEvent(target, input);
  if (ok) formTarget.value = null;
}
</script>

<template>
  <section data-testid="timeline" class="flex flex-col gap-3">
    <div class="flex items-center justify-between gap-3">
      <h3 class="text-xs font-semibold tracking-wide text-slate-400 uppercase">
        {{ t("timeline.title") }}
      </h3>
      <button
        v-if="!formTarget"
        data-testid="event-add"
        class="btn btn-secondary btn-sm"
        @click="formTarget = 'new'"
      >
        <AppIcon name="plus" />
        {{ t("event.add") }}
      </button>
    </div>

    <EventForm
      v-if="formTarget"
      :key="formTarget"
      :person-id="personId"
      :people="people"
      :event="editedEvent"
      :place-suggestions="placeSuggestions(people)"
      @submit="save"
      @cancel="formTarget = null"
    />

    <p v-if="!entries.length" data-testid="timeline-empty" class="text-sm text-slate-400">
      {{ t("timeline.empty") }}
    </p>
    <ol v-else class="relative ml-2 flex flex-col gap-3 border-l-2 border-slate-200 pl-5">
      <li
        v-for="entry in entries"
        :key="entry.key"
        class="relative"
        data-testid="timeline-entry"
        :data-kind="entry.kind"
      >
        <span
          class="absolute top-1.5 -left-[27px] size-3 rounded-full border-2 border-white"
          :class="
            entry.kind === 'birth' || entry.kind === 'death'
              ? 'bg-emerald-600'
              : entry.eventId
                ? 'bg-sky-500'
                : 'bg-slate-400'
          "
          aria-hidden="true"
        />
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span
            data-testid="timeline-date"
            class="w-28 shrink-0 text-xs font-medium text-slate-500"
          >
            {{ when(entry) }}
          </span>
          <span data-testid="timeline-text" class="text-sm text-slate-800">{{ entry.text }}</span>
          <span v-if="entry.people.length" class="text-sm text-slate-500">
            {{ t("timeline.with") }}
            <template v-for="(id, i) in entry.people" :key="id">
              <button
                class="font-medium text-emerald-700 hover:underline"
                data-testid="timeline-person"
                @click="emit('select', id)"
              >
                {{ nameOf(id) }}
              </button>
              <span v-if="i < entry.people.length - 1">, </span>
            </template>
          </span>
          <span v-if="entry.eventId" class="ml-auto flex gap-1.5">
            <button
              data-testid="event-edit"
              class="btn btn-ghost btn-sm"
              @click="formTarget = entry.eventId as EventId"
            >
              <AppIcon name="pencil" />
              {{ t("common.edit") }}
            </button>
            <button
              data-testid="event-delete"
              class="btn btn-danger btn-sm"
              @click="family.deleteEvent(entry.eventId as EventId)"
            >
              <AppIcon name="trash" />
              {{ t("common.delete") }}
            </button>
          </span>
        </div>
      </li>
    </ol>
  </section>
</template>
