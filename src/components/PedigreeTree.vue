<script setup lang="ts">
import { computed, ref } from "vue";
import { monthName, t, tn } from "../i18n/index.ts";
import {
  activeFilterCount,
  filterPlaces,
  matchesFilters,
  NO_FILTERS,
  type TreeFilters,
} from "../data/treeFilters.ts";
import { focusStats } from "../data/focusStats.ts";
import {
  ALL_GENERATIONS,
  buildPedigree,
  clampGenerations,
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
import TreeAvatar from "./TreeAvatar.vue";
import PersonForm from "./PersonForm.vue";

// Boxes hold a round portrait at the left, then the name and lifespan.
const SLOT_WIDTH = 224;
const BOX_WIDTH = 200;
const BOX_HEIGHT = 56;
const LEVEL_HEIGHT = 104;
const AVATAR_R = 21;
const TEXT_X = 58;
const NAME_MAX = 17;
const PADDING = 16;
/** The tree shrinks to fit the panel, but never below this fraction (then it scrolls). */
const MIN_SCALE = 0.45;

const props = defineProps<{ highlightIds?: ReadonlySet<PersonId> }>();

const family = useFamilyStore();

const chosenRoot = ref<PersonId | "">("");
/** The person whose detail is open below the chart, and whether it is being edited. */
const selectedId = ref<PersonId | null>(null);
const editing = ref(false);
// Everything is shown by default; the focused person only decides who the chart is centred on.
const generations = ref(ALL_GENERATIONS);
const direction = ref<PedigreeDirection>("ancestors");
const showSiblings = ref(false);

const people = computed(() => family.data?.people ?? []);

const filters = ref<TreeFilters>({ ...NO_FILTERS });
const filterCount = computed(() => activeFilterCount(filters.value));
const places = computed(() => filterPlaces(people.value));
const lastNames = computed(() =>
  lastNameSuggestions(people.value).sort((a, b) => a.localeCompare(b)),
);
const matching = computed(
  () => new Set(people.value.filter((p) => matchesFilters(p, filters.value)).map((p) => p.id)),
);
/** True when a filter is on and this person does not satisfy all of them. */
const isFaded = (id: PersonId): boolean => filterCount.value > 0 && !matching.value.has(id);
const personOfKey = computed(
  () => new Map((pedigree.value?.nodes ?? []).map((n) => [n.key, n.personId])),
);
function resetFilters(): void {
  filters.value = { ...NO_FILTERS };
}
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const generationOptions = Array.from(
  { length: MAX_GENERATIONS - MIN_GENERATIONS + 1 },
  (_, i) => MIN_GENERATIONS + i,
);

const GENERATION_KEYS = {
  ancestors: ["parents", "grandparents", "greatGrandparents"],
  descendants: ["children", "grandchildren", "greatGrandchildren"],
} as const;

/** "2 parents · 3 grandparents · 1 child ..." for the focused person. */
const focusChips = computed(() => {
  if (!family.data || !rootId.value) return [];
  const stats = focusStats(family.data, rootId.value);
  const chips: string[] = [];
  for (const side of ["ancestors", "descendants"] as const) {
    stats[side].forEach((count, index) => {
      const known = GENERATION_KEYS[side][index];
      chips.push(
        known
          ? tn(`tree.stats.${known}`, count)
          : tn(`tree.stats.${side}`, count, { gen: index + 1 }),
      );
    });
  }
  if (stats.siblings > 0) chips.push(tn("tree.stats.siblings", stats.siblings));
  if (stats.partners > 0) chips.push(tn("tree.stats.partners", stats.partners));
  return chips;
});

/** The chosen root if it still exists, otherwise the first person. */
const rootId = computed<PersonId | null>(() => {
  const chosen = people.value.find((p) => p.id === chosenRoot.value);
  return chosen?.id ?? people.value[0]?.id ?? null;
});

const pedigree = computed(() =>
  family.data && rootId.value
    ? buildPedigree(
        family.data,
        rootId.value,
        clampGenerations(generations.value),
        direction.value,
        // The parents are not drawn in the descendants view, so siblings would float unlinked.
        { siblings: showSiblings.value && direction.value !== "descendants" },
      )
    : null,
);

const selected = computed(() => people.value.find((p) => p.id === selectedId.value));

/** Centres the chart on a person and opens their card (used by the search box). */
function focusPerson(id: PersonId): void {
  chosenRoot.value = id;
  select(id);
}
defineExpose({ focusPerson });

function select(id: PersonId | null): void {
  selectedId.value = id;
  editing.value = false;
}

async function saveSelected(input: PersonFormInput): Promise<void> {
  if (!selectedId.value) return;
  if (await family.editPerson(selectedId.value, input)) editing.value = false;
}

const byId = computed(() => new Map(people.value.map((p) => [p.id, p])));

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
        faded:
          isFaded(personOfKey.value.get(edge.fromKey) as PersonId) ||
          isFaded(personOfKey.value.get(edge.toKey) as PersonId),
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
            <option :value="ALL_GENERATIONS">{{ t("tree.generations.all") }}</option>
            <option v-for="n in generationOptions" :key="n" :value="n">{{ n }}</option>
          </select>
        </label>
        <label
          v-if="direction !== 'descendants'"
          class="flex items-center gap-2 pb-2 text-sm text-slate-600"
        >
          <input
            v-model="showSiblings"
            type="checkbox"
            data-testid="tree-siblings"
            class="size-4 accent-emerald-700"
          />
          {{ t("tree.siblings") }}
        </label>
        <p class="flex items-center gap-4 text-xs text-slate-500" data-testid="tree-legend">
          <span class="flex items-center gap-1">
            <svg width="28" height="6">
              <line x1="0" y1="3" x2="28" y2="3" stroke="var(--tree-edge)" stroke-width="2" />
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
                stroke="var(--tree-edge)"
                stroke-width="2"
                stroke-dasharray="5 3"
              />
            </svg>
            {{ t("tree.legend.other") }}
          </span>
        </p>
      </div>

      <div class="mb-3 rounded-lg border border-slate-200 px-3 py-2" data-testid="filters">
        <div class="mb-2 flex flex-wrap items-center gap-3 text-sm">
          <span class="font-medium text-slate-800">{{ t("filter.title") }}</span>
          <span v-if="filterCount" data-testid="filter-count" class="chip">
            {{ tn("filter.matches", matching.size) }}
          </span>
          <button
            v-if="filterCount"
            data-testid="filter-reset"
            class="btn btn-secondary btn-sm"
            @click="resetFilters()"
          >
            {{ t("filter.reset") }}
          </button>
        </div>
        <div class="flex flex-wrap items-end gap-3">
          <label class="label">
            {{ t("filter.status") }}
            <select v-model="filters.status" data-testid="filter-status" class="input">
              <option value="any">{{ t("filter.any") }}</option>
              <option value="living">{{ t("filter.living") }}</option>
              <option value="deceased">{{ t("filter.deceased") }}</option>
            </select>
          </label>
          <label class="label">
            {{ t("filter.birthPlace") }}
            <select v-model="filters.birthPlace" data-testid="filter-birth-place" class="input">
              <option value="">{{ t("filter.any") }}</option>
              <option v-for="p in places.birth" :key="p" :value="p">{{ p }}</option>
            </select>
          </label>
          <label class="label">
            {{ t("filter.deathPlace") }}
            <select v-model="filters.deathPlace" data-testid="filter-death-place" class="input">
              <option value="">{{ t("filter.any") }}</option>
              <option v-for="p in places.death" :key="p" :value="p">{{ p }}</option>
            </select>
          </label>
          <label class="label">
            {{ t("filter.birthMonth") }}
            <select
              v-model.number="filters.birthMonth"
              data-testid="filter-birth-month"
              class="input"
            >
              <option :value="0">{{ t("filter.any") }}</option>
              <option v-for="m in MONTHS" :key="m" :value="m">{{ monthName(m) }}</option>
            </select>
          </label>
          <label class="label">
            {{ t("filter.deathMonth") }}
            <select
              v-model.number="filters.deathMonth"
              data-testid="filter-death-month"
              class="input"
            >
              <option :value="0">{{ t("filter.any") }}</option>
              <option v-for="m in MONTHS" :key="m" :value="m">{{ monthName(m) }}</option>
            </select>
          </label>
          <label class="label">
            {{ t("filter.lastName") }}
            <select v-model="filters.lastName" data-testid="filter-last-name" class="input">
              <option value="">{{ t("filter.any") }}</option>
              <option v-for="n in lastNames" :key="n" :value="n">{{ n }}</option>
            </select>
          </label>
        </div>
      </div>

      <div
        class="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600"
        data-testid="focus-stats"
      >
        <span class="font-medium text-slate-800">{{
          t("tree.stats.title", { name: rootId ? (names.get(rootId) ?? "") : "" })
        }}</span>
        <span v-if="!focusChips.length" class="ml-2">{{ t("tree.stats.none") }}</span>
        <ul v-else class="mt-1 flex flex-wrap gap-1.5">
          <li v-for="chip in focusChips" :key="chip" data-testid="focus-chip" class="chip">
            {{ chip }}
          </li>
        </ul>
      </div>

      <div
        class="overflow-auto rounded-xl border border-slate-200 bg-slate-50/70 bg-[radial-gradient(circle,#cbd5e1_1px,transparent_1px)] [background-size:18px_18px] dark:bg-[radial-gradient(circle,#334155_1px,transparent_1px)]"
      >
        <svg
          v-if="pedigree"
          class="mx-auto"
          data-testid="tree-svg"
          :width="size.width"
          :height="size.height"
          :style="{
            maxWidth: '100%',
            height: 'auto',
            minWidth: `${Math.round(size.width * MIN_SCALE)}px`,
          }"
          :viewBox="`0 0 ${size.width} ${size.height}`"
        >
          <defs>
            <clipPath id="tree-avatar-clip" clipPathUnits="objectBoundingBox">
              <circle cx="0.5" cy="0.5" r="0.5" />
            </clipPath>
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
            :opacity="edge.faded ? 0.25 : undefined"
            :d="edge.d"
            fill="none"
            stroke="var(--tree-edge)"
            stroke-width="2"
            stroke-linejoin="round"
            :stroke-dasharray="edge.dashed ? '5 4' : undefined"
          />
          <g
            v-for="node in pedigree.nodes"
            :key="node.key"
            data-testid="tree-node"
            :data-faded="isFaded(node.personId) ? true : undefined"
            :opacity="isFaded(node.personId) ? 0.3 : undefined"
            :data-highlight="props.highlightIds?.has(node.personId) ? true : undefined"
            :data-root="node.generation === 0 && !node.sibling"
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
              :fill="
                node.generation === 0 && !node.sibling ? 'var(--tree-root)' : 'var(--tree-node)'
              "
              :stroke="
                props.highlightIds?.has(node.personId)
                  ? '#f59e0b'
                  : node.personId === selectedId
                    ? '#0ea5e9'
                    : node.generation === 0 && !node.sibling
                      ? 'var(--tree-root-stroke)'
                      : 'var(--tree-node-stroke)'
              "
              :stroke-width="
                props.highlightIds?.has(node.personId)
                  ? 4
                  : node.personId === selectedId
                    ? 2.5
                    : node.generation === 0 && !node.sibling
                      ? 1.5
                      : 1
              "
              filter="url(#node-shadow)"
            />
            <TreeAvatar
              :person="byId.get(node.personId)"
              :cx="BOX_HEIGHT / 2"
              :cy="BOX_HEIGHT / 2"
              :r="AVATAR_R"
            />
            <text
              :x="TEXT_X"
              :y="lifespans.get(node.personId) ? 25 : BOX_HEIGHT / 2 + 5"
              text-anchor="start"
              font-size="14"
              font-weight="500"
              fill="var(--tree-text)"
            >
              {{ truncateName(shortNames.get(node.personId) ?? fullName(node.personId), NAME_MAX) }}
            </text>
            <text
              v-if="lifespans.get(node.personId)"
              data-testid="tree-lifespan"
              :x="TEXT_X"
              y="42"
              text-anchor="start"
              font-size="11"
              fill="var(--tree-muted)"
            >
              {{ lifespans.get(node.personId) }}
            </text>
          </g>
        </svg>
      </div>

      <div
        v-if="selected"
        class="mt-4 rounded-xl border border-slate-200 bg-surface p-5"
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
        <PersonDetail
          v-else
          :key="selected.id"
          :person-id="selected.id"
          show-tree-action
          @edit="editing = true"
          @close="select(null)"
          @select="select($event)"
          @center="chosenRoot = $event"
          @deleted="select(null)"
        />
        <p
          v-if="family.error"
          data-testid="error"
          class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300"
        >
          {{ family.error }}
        </p>
      </div>
    </template>
  </section>
</template>
