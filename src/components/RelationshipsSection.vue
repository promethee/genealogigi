<script setup lang="ts">
import { computed, ref } from "vue";
import { emptyDateInput } from "../data/dates.ts";
import { displayName } from "../data/people.ts";
import {
  describeRelationship,
  natureLabel,
  PARENT_CHILD_NATURES,
  PARTNER_STATUSES,
  TEMPORARY_NATURES,
  TEMPORARY_STATUSES,
  type ParentChildNature,
  type PartnerStatus,
  type TemporaryNature,
  type TemporaryStatus,
} from "../data/relationships.ts";
import type { PersonId } from "../data/types.ts";
import DateFields from "./DateFields.vue";
import { useFamilyStore } from "../store/index.ts";

const family = useFamilyStore();

const kind = ref<"parent" | "partner">("parent");
const firstId = ref<PersonId | "">("");
const secondId = ref<PersonId | "">("");
const nature = ref<ParentChildNature | TemporaryNature>("biological-confirmed");
const linkStatus = ref<TemporaryStatus>("ongoing");
const start = ref(emptyDateInput());
const end = ref(emptyDateInput());
const status = ref<PartnerStatus>("ongoing");

const people = computed(() => family.data?.people ?? []);
const relationships = computed(() => family.data?.relationships ?? []);
const allNatures = [...PARENT_CHILD_NATURES, ...TEMPORARY_NATURES];
const isTemporary = computed(
  () => kind.value === "parent" && (TEMPORARY_NATURES as readonly string[]).includes(nature.value),
);
const canAdd = computed(() => people.value.length >= 2);

function nameOf(id: PersonId): string {
  const person = people.value.find((p) => p.id === id);
  return person ? displayName(person) : "Unknown person";
}

async function add(): Promise<void> {
  if (!firstId.value || !secondId.value) {
    family.error = "Choose two people.";
    return;
  }
  const parent = { parentId: firstId.value, childId: secondId.value };
  const ok =
    kind.value === "parent"
      ? await family.addParentChild(
          isTemporary.value
            ? {
                ...parent,
                nature: nature.value as TemporaryNature,
                status: linkStatus.value,
                start: start.value,
                end: end.value,
              }
            : { ...parent, nature: nature.value as ParentChildNature },
        )
      : await family.addPartners({
          personAId: firstId.value,
          personBId: secondId.value,
          status: status.value,
        });
  if (ok) {
    firstId.value = "";
    secondId.value = "";
    start.value = emptyDateInput();
    end.value = emptyDateInput();
  }
}
</script>

<template>
  <section class="mt-8" data-testid="relationships-section">
    <h2 class="mb-3 text-lg font-medium">Relationships</h2>

    <p v-if="!canAdd" data-testid="relationships-hint" class="mb-3 text-sm text-gray-400">
      Add at least two people before adding relationships.
    </p>

    <form class="mb-4 flex flex-wrap items-end gap-3" @submit.prevent="add">
      <label class="flex flex-col text-sm">
        Type
        <select
          v-model="kind"
          data-testid="rel-kind"
          :disabled="!canAdd"
          class="rounded border border-gray-300 px-2 py-1"
        >
          <option value="parent">Parent of</option>
          <option value="partner">Partner of</option>
        </select>
      </label>
      <label class="flex flex-col text-sm">
        {{ kind === "parent" ? "Parent" : "Person" }}
        <select
          v-model="firstId"
          data-testid="rel-first"
          :disabled="!canAdd"
          class="rounded border border-gray-300 px-2 py-1"
        >
          <option value="" disabled>Choose…</option>
          <option v-for="p in people" :key="p.id" :value="p.id">{{ displayName(p) }}</option>
        </select>
      </label>
      <label class="flex flex-col text-sm">
        {{ kind === "parent" ? "Child" : "Partner" }}
        <select
          v-model="secondId"
          data-testid="rel-second"
          :disabled="!canAdd"
          class="rounded border border-gray-300 px-2 py-1"
        >
          <option value="" disabled>Choose…</option>
          <option v-for="p in people" :key="p.id" :value="p.id">{{ displayName(p) }}</option>
        </select>
      </label>
      <label v-if="kind === 'parent'" class="flex flex-col text-sm">
        Nature
        <select
          v-model="nature"
          data-testid="rel-nature"
          :disabled="!canAdd"
          class="rounded border border-gray-300 px-2 py-1"
        >
          <option v-for="n in allNatures" :key="n" :value="n">
            {{ natureLabel(n) }}
          </option>
        </select>
      </label>
      <template v-if="isTemporary">
        <label class="flex flex-col text-sm">
          Status
          <select
            v-model="linkStatus"
            data-testid="rel-link-status"
            class="rounded border border-gray-300 px-2 py-1"
          >
            <option v-for="s in TEMPORARY_STATUSES" :key="s" :value="s">{{ s }}</option>
          </select>
        </label>
        <DateFields v-model="start" label="Start (optional)" test-prefix="rel-start" />
        <DateFields
          v-if="linkStatus === 'ended'"
          v-model="end"
          label="End (optional)"
          test-prefix="rel-end"
        />
      </template>
      <label v-else-if="kind === 'partner'" class="flex flex-col text-sm">
        Status
        <select
          v-model="status"
          data-testid="rel-status"
          :disabled="!canAdd"
          class="rounded border border-gray-300 px-2 py-1"
        >
          <option v-for="s in PARTNER_STATUSES" :key="s" :value="s">{{ s }}</option>
        </select>
      </label>
      <button
        type="submit"
        data-testid="rel-add"
        :disabled="!canAdd"
        class="rounded bg-emerald-700 px-4 py-1.5 text-white disabled:bg-gray-300"
      >
        Add relationship
      </button>
    </form>

    <p v-if="!relationships.length" data-testid="relationships-empty" class="text-gray-400">
      No relationships yet.
    </p>
    <ul v-else class="divide-y divide-gray-200">
      <li
        v-for="r in relationships"
        :key="r.id"
        data-testid="relationship-row"
        class="flex items-center justify-between py-2"
      >
        <span data-testid="relationship-text">{{ describeRelationship(r, nameOf) }}</span>
        <button
          data-testid="delete-relationship"
          class="text-sm text-red-600 hover:underline"
          @click="family.deleteRelationship(r.id, describeRelationship(r, nameOf))"
        >
          Delete
        </button>
      </li>
    </ul>
  </section>
</template>
