<script setup lang="ts">
import { computed, ref } from "vue";
import { emptyDateInput } from "../data/dates.ts";
import { t } from "../i18n/index.ts";
import { displayName } from "../data/people.ts";
import {
  describeRelationship,
  natureLabel,
  statusLabel,
  PARENT_CHILD_NATURES,
  PARTNER_STATUSES,
  TEMPORARY_NATURES,
  TEMPORARY_STATUSES,
  type ParentChildNature,
  type PartnerStatus,
  type TemporaryNature,
  type TemporaryStatus,
} from "../data/relationships.ts";
import type { PersonId, RelationshipId } from "../data/types.ts";
import DateFields from "./DateFields.vue";
import RelationshipEditForm from "./RelationshipEditForm.vue";
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
const editingId = ref<RelationshipId | null>(null);

const people = computed(() => family.data?.people ?? []);
const relationships = computed(() => family.data?.relationships ?? []);
const allNatures = [...PARENT_CHILD_NATURES, ...TEMPORARY_NATURES];
const isTemporary = computed(
  () => kind.value === "parent" && (TEMPORARY_NATURES as readonly string[]).includes(nature.value),
);
const canAdd = computed(() => people.value.length >= 2);

function nameOf(id: PersonId): string {
  const person = people.value.find((p) => p.id === id);
  return person ? displayName(person) : t("rel.unknownPerson");
}

async function add(): Promise<void> {
  if (!firstId.value || !secondId.value) {
    family.error = t("rel.chooseTwo");
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
          start: start.value,
          end: end.value,
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
    <h2 class="mb-3 text-lg font-medium">{{ t("rel.title") }}</h2>

    <p v-if="!canAdd" data-testid="relationships-hint" class="mb-3 text-sm text-gray-400">
      {{ t("rel.hint") }}
    </p>

    <form class="mb-4 flex flex-wrap items-end gap-3" @submit.prevent="add">
      <label class="flex flex-col text-sm">
        {{ t("rel.type") }}
        <select
          v-model="kind"
          data-testid="rel-kind"
          :disabled="!canAdd"
          class="rounded border border-gray-300 px-2 py-1"
        >
          <option value="parent">{{ t("rel.parentOf") }}</option>
          <option value="partner">{{ t("rel.partnerOf") }}</option>
        </select>
      </label>
      <label class="flex flex-col text-sm">
        {{ kind === "parent" ? t("rel.parent") : t("rel.person") }}
        <select
          v-model="firstId"
          data-testid="rel-first"
          :disabled="!canAdd"
          class="rounded border border-gray-300 px-2 py-1"
        >
          <option value="" disabled>{{ t("rel.choose") }}</option>
          <option v-for="p in people" :key="p.id" :value="p.id">{{ displayName(p) }}</option>
        </select>
      </label>
      <label class="flex flex-col text-sm">
        {{ kind === "parent" ? t("rel.child") : t("rel.partner") }}
        <select
          v-model="secondId"
          data-testid="rel-second"
          :disabled="!canAdd"
          class="rounded border border-gray-300 px-2 py-1"
        >
          <option value="" disabled>{{ t("rel.choose") }}</option>
          <option v-for="p in people" :key="p.id" :value="p.id">{{ displayName(p) }}</option>
        </select>
      </label>
      <label v-if="kind === 'parent'" class="flex flex-col text-sm">
        {{ t("rel.nature") }}
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
          {{ t("rel.status") }}
          <select
            v-model="linkStatus"
            data-testid="rel-link-status"
            class="rounded border border-gray-300 px-2 py-1"
          >
            <option v-for="s in TEMPORARY_STATUSES" :key="s" :value="s">
              {{ statusLabel(s) }}
            </option>
          </select>
        </label>
        <DateFields v-model="start" :label="t('rel.start')" test-prefix="rel-start" />
        <DateFields
          v-if="linkStatus === 'ended'"
          v-model="end"
          :label="t('rel.end')"
          test-prefix="rel-end"
        />
      </template>
      <label v-else-if="kind === 'partner'" class="flex flex-col text-sm">
        {{ t("rel.status") }}
        <select
          v-model="status"
          data-testid="rel-status"
          :disabled="!canAdd"
          class="rounded border border-gray-300 px-2 py-1"
        >
          <option v-for="s in PARTNER_STATUSES" :key="s" :value="s">{{ statusLabel(s) }}</option>
        </select>
      </label>
      <template v-if="kind === 'partner'">
        <DateFields v-model="start" :label="t('rel.start')" test-prefix="rel-start" />
        <DateFields
          v-if="status === 'ended'"
          v-model="end"
          :label="t('rel.end')"
          test-prefix="rel-end"
        />
      </template>
      <button
        type="submit"
        data-testid="rel-add"
        :disabled="!canAdd"
        class="rounded bg-emerald-700 px-4 py-1.5 text-white disabled:bg-gray-300"
      >
        {{ t("rel.add") }}
      </button>
    </form>

    <p v-if="!relationships.length" data-testid="relationships-empty" class="text-gray-400">
      {{ t("rel.empty") }}
    </p>
    <ul v-else class="divide-y divide-gray-200">
      <li v-for="r in relationships" :key="r.id" data-testid="relationship-row" class="py-2">
        <div class="flex items-center justify-between">
          <span data-testid="relationship-text">{{ describeRelationship(r, nameOf) }}</span>
          <span class="flex gap-3">
            <button
              data-testid="edit-relationship"
              class="text-sm text-emerald-700 hover:underline"
              @click="editingId = editingId === r.id ? null : r.id"
            >
              {{ t("common.edit") }}
            </button>
            <button
              data-testid="delete-relationship"
              class="text-sm text-red-600 hover:underline"
              @click="family.deleteRelationship(r.id, describeRelationship(r, nameOf))"
            >
              {{ t("common.delete") }}
            </button>
          </span>
        </div>
        <RelationshipEditForm
          v-if="editingId === r.id"
          :relationship="r"
          @done="editingId = null"
        />
      </li>
    </ul>
  </section>
</template>
