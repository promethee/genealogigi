<script setup lang="ts">
import { computed, ref } from "vue";
import { t } from "../i18n/index.ts";
import {
  buildPedigree,
  clampGenerations,
  DEFAULT_GENERATIONS,
  MAX_GENERATIONS,
  MIN_GENERATIONS,
  truncateName,
  type PedigreeDirection,
} from "../data/pedigree.ts";
import {
  displayName,
  displayNameParts,
  inputFromPerson,
  lastNameSuggestions,
  lifespan,
  placeSuggestions,
  type PersonFormInput,
} from "../data/people.ts";
import type { PersonId } from "../data/types.ts";
import { useFamilyStore } from "../store/index.ts";
import PersonDetail from "./PersonDetail.vue";
import PersonForm from "./PersonForm.vue";

const SLOT_WIDTH = 190;
const BOX_WIDTH = 170;
const BOX_HEIGHT = 48;
const LEVEL_HEIGHT = 96;
const PADDING = 16;

const family = useFamilyStore();

const chosenRoot = ref<PersonId | "">("");
/** The person whose detail is open below the chart, and whether it is being edited. */
const selectedId = ref<PersonId | null>(null);
const editing = ref(false);
const generations = ref(DEFAULT_GENERATIONS);
const direction = ref<PedigreeDirection>("ancestors");

const people = computed(() => family.data?.people ?? []);
const generationOptions = Array.from(
  { length: MAX_GENERATIONS - MIN_GENERATIONS + 1 },
  (_, i) => MIN_GENERATIONS + i,
);

/** The chosen root if it still exists, otherwise the first person. */
const rootId = computed<PersonId | null>(() => {
  const chosen = people.value.find((p) => p.id === chosenRoot.value);
  return chosen?.id ?? people.value[0]?.id ?? null;
});

const pedigree = computed(() =>
  family.data && rootId.value
    ? buildPedigree(family.data, rootId.value, clampGenerations(generations.value), direction.value)
    : null,
);

const selected = computed(() => people.value.find((p) => p.id === selectedId.value));

function select(id: PersonId | null): void {
  selectedId.value = id;
  editing.value = false;
}

async function saveSelected(input: PersonFormInput): Promise<void> {
  if (!selectedId.value) return;
  if (await family.editPerson(selectedId.value, input)) editing.value = false;
}

const names = computed(() => new Map(people.value.map((p) => [p.id, displayName(p)])));

const positions = computed(() => {
  const map = new Map<string, { x: number; y: number }>();
  for (const node of pedigree.value?.nodes ?? []) {
    map.set(node.key, {
      x: PADDING + node.slot * SLOT_WIDTH,
      y: PADDING + node.level * LEVEL_HEIGHT,
    });
  }
  return map;
});

const size = computed(() => {
  const p = pedigree.value;
  if (!p) return { width: 0, height: 0 };
  return {
    width: PADDING * 2 + Math.max(0, p.slots - 1) * SLOT_WIDTH + BOX_WIDTH,
    height: PADDING * 2 + Math.max(0, p.levels - 1) * LEVEL_HEIGHT + BOX_HEIGHT,
  };
});

const edgePaths = computed(() =>
  (pedigree.value?.edges ?? []).flatMap((edge) => {
    const from = positions.value.get(edge.fromKey);
    const to = positions.value.get(edge.toKey);
    if (!from || !to) return [];
    // Links run from the facing sides of the two boxes: up to ancestors, down to descendants.
    const upward = to.y < from.y;
    const x1 = from.x + BOX_WIDTH / 2;
    const y1 = upward ? from.y : from.y + BOX_HEIGHT;
    const x2 = to.x + BOX_WIDTH / 2;
    const y2 = upward ? to.y + BOX_HEIGHT : to.y;
    const mid = (y1 + y2) / 2;
    return [
      {
        key: `${edge.fromKey}>${edge.toKey}`,
        d: `M ${x1} ${y1} V ${mid} H ${x2} V ${y2}`,
        dashed: edge.nature !== "biological-confirmed",
      },
    ];
  }),
);

// Second line of a box: "née Martin · 1950–" (either part may be missing).
const lifespans = computed(
  () =>
    new Map(
      people.value.map((p) => {
        const { birthName } = displayNameParts(p);
        return [
          p.id,
          [birthName ? t("person.nee", { name: birthName }) : "", lifespan(p)]
            .filter(Boolean)
            .join(" · "),
        ];
      }),
    ),
);
const shortNames = computed(
  () => new Map(people.value.map((p) => [p.id, displayNameParts(p).name])),
);

function fullName(id: PersonId): string {
  return names.value.get(id) ?? t("rel.unknownPerson");
}
</script>

<template>
  <section data-testid="tree-section">
    <p v-if="!people.length" data-testid="tree-empty" class="text-sm text-slate-400">
      {{ t("tree.empty") }}
    </p>

    <template v-else>
      <div class="mb-4 flex flex-wrap items-end gap-4">
        <label class="label">
          {{ t("tree.root") }}
          <select
            :value="rootId ?? ''"
            data-testid="tree-root"
            class="input"
            @change="chosenRoot = ($event.target as HTMLSelectElement).value as PersonId"
          >
            <option v-for="p in people" :key="p.id" :value="p.id">
              {{ displayName(p) }}
            </option>
          </select>
        </label>
        <label class="label">
          {{ t("tree.show") }}
          <select v-model="direction" data-testid="tree-direction" class="input">
            <option value="ancestors">{{ t("tree.ancestors") }}</option>
            <option value="descendants">{{ t("tree.descendants") }}</option>
            <option value="hourglass">{{ t("tree.hourglass") }}</option>
          </select>
        </label>
        <label class="label">
          {{ t("tree.generations") }}
          <select v-model.number="generations" data-testid="tree-generations" class="input">
            <option v-for="n in generationOptions" :key="n" :value="n">{{ n }}</option>
          </select>
        </label>
        <p class="flex items-center gap-4 text-xs text-slate-500" data-testid="tree-legend">
          <span class="flex items-center gap-1">
            <svg width="28" height="6">
              <line x1="0" y1="3" x2="28" y2="3" stroke="#94a3b8" stroke-width="2" />
            </svg>
            {{ t("tree.legend.confirmed") }}
          </span>
          <span class="flex items-center gap-1">
            <svg width="28" height="6">
              <line
                x1="0"
                y1="3"
                x2="28"
                y2="3"
                stroke="#94a3b8"
                stroke-width="2"
                stroke-dasharray="5 3"
              />
            </svg>
            {{ t("tree.legend.other") }}
          </span>
        </p>
      </div>

      <div
        class="overflow-auto rounded-xl border border-slate-200 bg-slate-50/70 bg-[radial-gradient(circle,#cbd5e1_1px,transparent_1px)] [background-size:18px_18px]"
      >
        <svg
          v-if="pedigree"
          class="mx-auto"
          data-testid="tree-svg"
          :width="size.width"
          :height="size.height"
          :viewBox="`0 0 ${size.width} ${size.height}`"
        >
          <defs>
            <filter id="node-shadow" x="-10%" y="-10%" width="120%" height="140%">
              <feDropShadow
                dx="0"
                dy="1.5"
                stdDeviation="2"
                flood-color="#0f172a"
                flood-opacity="0.12"
              />
            </filter>
          </defs>
          <path
            v-for="edge in edgePaths"
            :key="edge.key"
            data-testid="tree-edge"
            :data-dashed="edge.dashed"
            :d="edge.d"
            fill="none"
            stroke="#94a3b8"
            stroke-width="2"
            stroke-linejoin="round"
            :stroke-dasharray="edge.dashed ? '5 4' : undefined"
          />
          <g
            v-for="node in pedigree.nodes"
            :key="node.key"
            data-testid="tree-node"
            :data-root="node.generation === 0"
            class="cursor-pointer"
            :data-selected="node.personId === selectedId"
            :transform="`translate(${positions.get(node.key)?.x ?? 0} ${positions.get(node.key)?.y ?? 0})`"
            @click="select(node.personId)"
            @dblclick="chosenRoot = node.personId"
          >
            <title>{{ fullName(node.personId) }}</title>
            <rect
              :width="BOX_WIDTH"
              :height="BOX_HEIGHT"
              rx="10"
              :fill="node.generation === 0 ? '#ecfdf5' : '#ffffff'"
              :stroke="
                node.personId === selectedId
                  ? '#0ea5e9'
                  : node.generation === 0
                    ? '#059669'
                    : '#cbd5e1'
              "
              :stroke-width="node.personId === selectedId ? 2.5 : node.generation === 0 ? 1.5 : 1"
              filter="url(#node-shadow)"
            />
            <text
              :x="BOX_WIDTH / 2"
              :y="lifespans.get(node.personId) ? 20 : BOX_HEIGHT / 2 + 5"
              text-anchor="middle"
              font-size="14"
              font-weight="500"
              fill="#0f172a"
            >
              {{ truncateName(shortNames.get(node.personId) ?? fullName(node.personId)) }}
            </text>
            <text
              v-if="lifespans.get(node.personId)"
              data-testid="tree-lifespan"
              :x="BOX_WIDTH / 2"
              y="38"
              text-anchor="middle"
              font-size="11"
              fill="#64748b"
            >
              {{ lifespans.get(node.personId) }}
            </text>
          </g>
        </svg>
      </div>

      <div
        v-if="selected"
        class="mt-4 rounded-xl border border-slate-200 bg-white p-5"
        data-testid="tree-detail-panel"
      >
        <PersonForm
          v-if="editing"
          :key="selected.id"
          :initial="inputFromPerson(selected)"
          :last-name-suggestions="lastNameSuggestions(people)"
          :place-suggestions="placeSuggestions(people)"
          @submit="saveSelected"
          @cancel="editing = false"
        />
        <p
          v-if="editing && family.error"
          data-testid="error"
          class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {{ family.error }}
        </p>
        <PersonDetail
          v-else-if="!editing"
          :key="selected.id"
          :person-id="selected.id"
          show-tree-action
          @edit="editing = true"
          @close="select(null)"
          @select="select($event)"
          @center="chosenRoot = $event"
          @deleted="select(null)"
        />
      </div>
    </template>
  </section>
</template>
