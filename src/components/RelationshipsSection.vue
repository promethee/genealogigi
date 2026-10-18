<script setup lang="ts">
import { computed, ref } from "vue";
import { emptyDateInput } from "../data/dates.ts";
import { t } from "../i18n/index.ts";
import { displayName } from "../data/people.ts";
import {
  describeRelationship,
  isParentChild,
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
import AppIcon from "./AppIcon.vue";
import DateFields from "./DateFields.vue";
import RelationshipEditForm from "./RelationshipEditForm.vue";
import { useFamilyStore } from "../store/index.ts";

const family = useFamilyStore();

// "parents" (two parents of a child) is the most common case, so it comes first.
const kind = ref<"parents" | "parent" | "partner">("parents");
const childId = ref<PersonId | "">("");
const parentAId = ref<PersonId | "">("");
const parentBId = ref<PersonId | "">("");
const recordPartners = ref(false);
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
  () => kind.value !== "partner" && (TEMPORARY_NATURES as readonly string[]).includes(nature.value),
);

/** The checkbox is pointless when the two chosen parents are already partners. */
const alreadyPartners = computed(() =>
  relationships.value.some(
    (r) =>
      !isParentChild(r) &&
      ((r.personAId === parentAId.value && r.personBId === parentBId.value) ||
        (r.personAId === parentBId.value && r.personBId === parentAId.value)),
  ),
);
const canAdd = computed(() => people.value.length >= 2);

function nameOf(id: PersonId): string {
  const person = people.value.find((p) => p.id === id);
  return person ? displayName(person) : t("rel.unknownPerson");
}

function natureInput():
  | { nature: ParentChildNature }
  | {
      nature: TemporaryNature;
      status: TemporaryStatus;
      start: typeof start.value;
      end: typeof end.value;
    } {
  return isTemporary.value
    ? {
        nature: nature.value as TemporaryNature,
        status: linkStatus.value,
        start: start.value,
        end: end.value,
      }
    : { nature: nature.value as ParentChildNature };
}

async function addParents(): Promise<void> {
  if (!childId.value || !parentAId.value || !parentBId.value) {
    family.error = t("rel.chooseParents");
    return;
  }
  const ok = await family.addParents({
    childId: childId.value,
    parentAId: parentAId.value,
    parentBId: parentBId.value,
    recordPartners: recordPartners.value && !alreadyPartners.value,
    ...natureInput(),
  });
  if (ok) {
    childId.value = "";
    parentAId.value = "";
    parentBId.value = "";
    recordPartners.value = false;
    start.value = emptyDateInput();
    end.value = emptyDateInput();
  }
}

async function add(): Promise<void> {
  if (kind.value === "parents") return addParents();
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
  <section data-testid="relationships-section">
    <h2 class="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
      <AppIcon name="link" class="text-emerald-700" />
      {{ t("rel.title") }}
    </h2>

    <p
      v-if="!canAdd"
      data-testid="relationships-hint"
      class="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500"
    >
      {{ t("rel.hint") }}
    </p>

    <form class="mb-5 flex flex-wrap items-end gap-3" @submit.prevent="add">
      <label class="label">
        {{ t("rel.type") }}
        <select v-model="kind" data-testid="rel-kind" :disabled="!canAdd" class="input">
          <option value="parents">{{ t("rel.parentsOf") }}</option>
          <option value="parent">{{ t("rel.parentOf") }}</option>
          <option value="partner">{{ t("rel.partnerOf") }}</option>
        </select>
      </label>
      <template v-if="kind === 'parents'">
        <label class="label">
          {{ t("rel.child") }}
          <select v-model="childId" data-testid="rel-child" :disabled="!canAdd" class="input">
            <option value="" disabled>{{ t("rel.choose") }}</option>
            <option v-for="p in people" :key="p.id" :value="p.id">{{ displayName(p) }}</option>
          </select>
        </label>
        <label class="label">
          {{ t("rel.parent1") }}
          <select v-model="parentAId" data-testid="rel-parent-a" :disabled="!canAdd" class="input">
            <option value="" disabled>{{ t("rel.choose") }}</option>
            <option v-for="p in people" :key="p.id" :value="p.id">{{ displayName(p) }}</option>
          </select>
        </label>
        <label class="label">
          {{ t("rel.parent2") }}
          <select v-model="parentBId" data-testid="rel-parent-b" :disabled="!canAdd" class="input">
            <option value="" disabled>{{ t("rel.choose") }}</option>
            <option v-for="p in people" :key="p.id" :value="p.id">{{ displayName(p) }}</option>
          </select>
        </label>
      </template>
      <label v-if="kind !== 'parents'" class="label">
        {{ kind === "parent" ? t("rel.parent") : t("rel.person") }}
        <select v-model="firstId" data-testid="rel-first" :disabled="!canAdd" class="input">
          <option value="" disabled>{{ t("rel.choose") }}</option>
          <option v-for="p in people" :key="p.id" :value="p.id">{{ displayName(p) }}</option>
        </select>
      </label>
      <label v-if="kind !== 'parents'" class="label">
        {{ kind === "parent" ? t("rel.child") : t("rel.partner") }}
        <select v-model="secondId" data-testid="rel-second" :disabled="!canAdd" class="input">
          <option value="" disabled>{{ t("rel.choose") }}</option>
          <option v-for="p in people" :key="p.id" :value="p.id">{{ displayName(p) }}</option>
        </select>
      </label>
      <label v-if="kind !== 'partner'" class="label">
        {{ t("rel.nature") }}
        <select v-model="nature" data-testid="rel-nature" :disabled="!canAdd" class="input">
          <option v-for="n in allNatures" :key="n" :value="n">
            {{ natureLabel(n) }}
          </option>
        </select>
      </label>
      <template v-if="isTemporary">
        <label class="label">
          {{ t("rel.status") }}
          <select v-model="linkStatus" data-testid="rel-link-status" class="input">
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
      <label v-else-if="kind === 'partner'" class="label">
        {{ t("rel.status") }}
        <select v-model="status" data-testid="rel-status" :disabled="!canAdd" class="input">
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
      <label
        v-if="kind === 'parents' && !alreadyPartners"
        class="flex items-center gap-2 pb-2 text-sm text-slate-600"
      >
        <input
          v-model="recordPartners"
          type="checkbox"
          data-testid="rel-partners"
          class="size-4 accent-emerald-700"
        />
        {{ t("rel.alsoPartners") }}
      </label>
      <button type="submit" data-testid="rel-add" :disabled="!canAdd" class="btn btn-primary">
        <AppIcon name="plus" />
        {{ t("rel.add") }}
      </button>
    </form>

    <p
      v-if="!relationships.length"
      data-testid="relationships-empty"
      class="text-sm text-slate-400"
    >
      {{ t("rel.empty") }}
    </p>
    <ul v-else class="divide-y divide-slate-100">
      <li v-for="r in relationships" :key="r.id" data-testid="relationship-row" class="py-2.5">
        <div class="flex items-center justify-between gap-3">
          <span data-testid="relationship-text">{{ describeRelationship(r, nameOf) }}</span>
          <span class="flex shrink-0 gap-2">
            <button
              data-testid="edit-relationship"
              class="btn btn-secondary btn-sm"
              @click="editingId = editingId === r.id ? null : r.id"
            >
              <AppIcon name="pencil" />
              {{ t("common.edit") }}
            </button>
            <button
              data-testid="delete-relationship"
              class="btn btn-danger btn-sm"
              @click="family.deleteRelationship(r.id, describeRelationship(r, nameOf))"
            >
              <AppIcon name="trash" />
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
