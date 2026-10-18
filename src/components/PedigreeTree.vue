<script setup lang="ts">
import { computed, ref } from "vue";
import {
  buildPedigree,
  clampGenerations,
  DEFAULT_GENERATIONS,
  MAX_GENERATIONS,
  MIN_GENERATIONS,
  truncateName,
  type PedigreeDirection,
} from "../data/pedigree.ts";
import { displayName, displayNameParts, lifespan } from "../data/people.ts";
import type { PersonId } from "../data/types.ts";
import { useFamilyStore } from "../store/index.ts";

const COLUMN_WIDTH = 210;
const BOX_WIDTH = 170;
const BOX_HEIGHT = 48;
const ROW_HEIGHT = 64;
const PADDING = 16;

const family = useFamilyStore();

const chosenRoot = ref<PersonId | "">("");
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

const names = computed(() => new Map(people.value.map((p) => [p.id, displayName(p)])));

const positions = computed(() => {
  const map = new Map<string, { x: number; y: number }>();
  for (const node of pedigree.value?.nodes ?? []) {
    map.set(node.key, {
      x: PADDING + node.column * COLUMN_WIDTH,
      y: PADDING + node.row * ROW_HEIGHT,
    });
  }
  return map;
});

const size = computed(() => {
  const p = pedigree.value;
  if (!p) return { width: 0, height: 0 };
  return {
    width: PADDING * 2 + (p.columns - 1) * COLUMN_WIDTH + BOX_WIDTH,
    height: PADDING * 2 + Math.max(0, p.rows - 1) * ROW_HEIGHT + BOX_HEIGHT,
  };
});

const edgePaths = computed(() =>
  (pedigree.value?.edges ?? []).flatMap((edge) => {
    const from = positions.value.get(edge.fromKey);
    const to = positions.value.get(edge.toKey);
    if (!from || !to) return [];
    // Links run from the near side of one box to the near side of the other.
    const rightward = to.x >= from.x;
    const x1 = rightward ? from.x + BOX_WIDTH : from.x;
    const y1 = from.y + BOX_HEIGHT / 2;
    const x2 = rightward ? to.x : to.x + BOX_WIDTH;
    const y2 = to.y + BOX_HEIGHT / 2;
    const mid = (x1 + x2) / 2;
    return [
      {
        key: `${edge.fromKey}>${edge.toKey}`,
        d: `M ${x1} ${y1} H ${mid} V ${y2} H ${x2}`,
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
          [birthName ? `née ${birthName}` : "", lifespan(p)].filter(Boolean).join(" · "),
        ];
      }),
    ),
);
const shortNames = computed(
  () => new Map(people.value.map((p) => [p.id, displayNameParts(p).name])),
);

function fullName(id: PersonId): string {
  return names.value.get(id) ?? "Unknown person";
}
</script>

<template>
  <section data-testid="tree-section">
    <p v-if="!people.length" data-testid="tree-empty" class="text-gray-400">
      Nobody to show yet. Add people and parent-child relationships first.
    </p>

    <template v-else>
      <div class="mb-4 flex flex-wrap items-end gap-4">
        <label class="flex flex-col text-sm">
          Root person
          <select
            :value="rootId ?? ''"
            data-testid="tree-root"
            class="rounded border border-gray-300 px-2 py-1"
            @change="chosenRoot = ($event.target as HTMLSelectElement).value as PersonId"
          >
            <option v-for="p in people" :key="p.id" :value="p.id">
              {{ displayName(p) }}
            </option>
          </select>
        </label>
        <label class="flex flex-col text-sm">
          Show
          <select
            v-model="direction"
            data-testid="tree-direction"
            class="rounded border border-gray-300 px-2 py-1"
          >
            <option value="ancestors">Ancestors</option>
            <option value="descendants">Descendants</option>
            <option value="hourglass">Hourglass (both)</option>
          </select>
        </label>
        <label class="flex flex-col text-sm">
          Generations
          <select
            v-model.number="generations"
            data-testid="tree-generations"
            class="rounded border border-gray-300 px-2 py-1"
          >
            <option v-for="n in generationOptions" :key="n" :value="n">{{ n }}</option>
          </select>
        </label>
        <p class="flex items-center gap-4 text-xs text-gray-500" data-testid="tree-legend">
          <span class="flex items-center gap-1">
            <svg width="28" height="6">
              <line x1="0" y1="3" x2="28" y2="3" stroke="#374151" stroke-width="2" />
            </svg>
            biological, confirmed
          </span>
          <span class="flex items-center gap-1">
            <svg width="28" height="6">
              <line
                x1="0"
                y1="3"
                x2="28"
                y2="3"
                stroke="#374151"
                stroke-width="2"
                stroke-dasharray="5 3"
              />
            </svg>
            presumed, adoptive, step, foster or guardian
          </span>
        </p>
      </div>

      <div class="overflow-auto rounded border border-gray-200">
        <svg
          v-if="pedigree"
          data-testid="tree-svg"
          :width="size.width"
          :height="size.height"
          :viewBox="`0 0 ${size.width} ${size.height}`"
        >
          <path
            v-for="edge in edgePaths"
            :key="edge.key"
            data-testid="tree-edge"
            :data-dashed="edge.dashed"
            :d="edge.d"
            fill="none"
            stroke="#374151"
            stroke-width="2"
            :stroke-dasharray="edge.dashed ? '5 3' : undefined"
          />
          <g
            v-for="node in pedigree.nodes"
            :key="node.key"
            data-testid="tree-node"
            :data-root="node.generation === 0"
            class="cursor-pointer"
            :transform="`translate(${positions.get(node.key)?.x ?? 0} ${positions.get(node.key)?.y ?? 0})`"
            @click="chosenRoot = node.personId"
          >
            <title>{{ fullName(node.personId) }}</title>
            <rect
              :width="BOX_WIDTH"
              :height="BOX_HEIGHT"
              rx="6"
              :fill="node.generation === 0 ? '#d1fae5' : '#ffffff'"
              stroke="#374151"
            />
            <text
              :x="BOX_WIDTH / 2"
              :y="lifespans.get(node.personId) ? 20 : BOX_HEIGHT / 2 + 5"
              text-anchor="middle"
              font-size="14"
              fill="#111827"
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
              fill="#6b7280"
            >
              {{ lifespans.get(node.personId) }}
            </text>
          </g>
        </svg>
      </div>
    </template>
  </section>
</template>
