<script setup lang="ts">
import { computed, ref } from "vue";
import { t } from "../i18n/index.ts";
import {
  editValuesOf,
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
import type { Relationship } from "../data/types.ts";
import { useFamilyStore } from "../store/index.ts";
import AppIcon from "./AppIcon.vue";
import DateFields from "./DateFields.vue";

const props = defineProps<{ relationship: Relationship }>();
const emit = defineEmits<{ done: [] }>();
const family = useFamilyStore();

const initial = editValuesOf(props.relationship);
const parentChild = isParentChild(props.relationship);
const nature = ref(initial.nature);
const status = ref(initial.status);
const start = ref(initial.start);
const end = ref(initial.end);

const allNatures = [...PARENT_CHILD_NATURES, ...TEMPORARY_NATURES];
const isTemporary = computed(
  () => parentChild && (TEMPORARY_NATURES as readonly string[]).includes(nature.value),
);
const showDates = computed(() => !parentChild || isTemporary.value);
const statuses = computed(() => (parentChild ? TEMPORARY_STATUSES : PARTNER_STATUSES));

async function save(): Promise<void> {
  const r = props.relationship;
  let ok: boolean;
  if (isParentChild(r)) {
    const people = { parentId: r.parentId, childId: r.childId };
    ok = await family.editRelationship(
      r.id,
      isTemporary.value
        ? {
            ...people,
            nature: nature.value as TemporaryNature,
            status: status.value as TemporaryStatus,
            start: start.value,
            end: end.value,
          }
        : { ...people, nature: nature.value as ParentChildNature },
    );
  } else {
    ok = await family.editRelationship(r.id, {
      personAId: r.personAId,
      personBId: r.personBId,
      status: status.value as PartnerStatus,
      start: start.value,
      end: end.value,
    });
  }
  if (ok) emit("done");
}

const selectClass = "input";
</script>

<template>
  <form
    class="mt-3 flex flex-wrap items-end gap-3 rounded-xl bg-slate-50 p-3"
    data-testid="relationship-edit-form"
    @submit.prevent="save"
  >
    <label v-if="parentChild" class="label">
      {{ t("rel.nature") }}
      <select v-model="nature" data-testid="edit-nature" :class="selectClass">
        <option v-for="n in allNatures" :key="n" :value="n">{{ natureLabel(n) }}</option>
      </select>
    </label>
    <label v-if="showDates" class="label">
      {{ t("rel.status") }}
      <select v-model="status" data-testid="edit-status" :class="selectClass">
        <option v-for="s in statuses" :key="s" :value="s">{{ statusLabel(s) }}</option>
      </select>
    </label>
    <template v-if="showDates">
      <DateFields v-model="start" :label="t('rel.start')" test-prefix="edit-start" />
      <DateFields
        v-if="status === 'ended'"
        v-model="end"
        :label="t('rel.end')"
        test-prefix="edit-end"
      />
    </template>
    <button type="submit" data-testid="edit-save" class="btn btn-primary">
      <AppIcon name="check" />
      {{ t("common.save") }}
    </button>
    <button type="button" data-testid="edit-cancel" class="btn btn-secondary" @click="emit('done')">
      {{ t("common.cancel") }}
    </button>
  </form>
</template>
