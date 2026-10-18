<script setup lang="ts">
import { computed, ref } from "vue";
import { displayName } from "../data/people.ts";
import {
  describeRelationship,
  natureLabel,
  PARENT_CHILD_NATURES,
  PARTNER_STATUSES,
  type ParentChildNature,
  type PartnerStatus,
} from "../data/relationships.ts";
import type { PersonId } from "../data/types.ts";
import { useFamilyStore } from "../store/index.ts";

const family = useFamilyStore();

const kind = ref<"parent" | "partner">("parent");
const firstId = ref<PersonId | "">("");
const secondId = ref<PersonId | "">("");
const nature = ref<ParentChildNature>("biological-confirmed");
const status = ref<PartnerStatus>("ongoing");

const people = computed(() => family.data?.people ?? []);
const relationships = computed(() => family.data?.relationships ?? []);
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
  const ok =
    kind.value === "parent"
      ? await family.addParentChild({
          parentId: firstId.value,
          childId: secondId.value,
          nature: nature.value,
        })
      : await family.addPartners({
          personAId: firstId.value,
          personBId: secondId.value,
          status: status.value,
        });
  if (ok) {
    firstId.value = "";
    secondId.value = "";
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
          <option v-for="n in PARENT_CHILD_NATURES" :key="n" :value="n">
            {{ natureLabel(n) }}
          </option>
        </select>
      </label>
      <label v-else class="flex flex-col text-sm">
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
