<script setup lang="ts">
import { computed } from "vue";
import { buildFan, FAN_ROOT_RADIUS, truncateLabel } from "../data/fan.ts";
import type { Pedigree } from "../data/pedigree.ts";
import type { PersonId } from "../data/types.ts";

const props = defineProps<{
  pedigree: Pedigree;
  names: Map<PersonId, string>;
  lifespans: Map<PersonId, string>;
}>();
const emit = defineEmits<{ select: [id: PersonId] }>();

const fan = computed(() => buildFan(props.pedigree));
const rootNode = computed(() => props.pedigree.nodes.find((n) => n.generation === 0));

const name = (id: PersonId): string => props.names.get(id) ?? "Unknown person";
const title = (id: PersonId): string => {
  const life = props.lifespans.get(id);
  return life ? `${name(id)} (${life})` : name(id);
};
</script>

<template>
  <svg
    data-testid="fan-svg"
    :width="fan.width"
    :height="fan.height"
    :viewBox="`0 0 ${fan.width} ${fan.height}`"
  >
    <g
      v-for="w in fan.wedges"
      :key="w.key"
      data-testid="fan-wedge"
      :data-dashed="w.nature !== 'biological-confirmed'"
      class="cursor-pointer"
      @click="emit('select', w.personId)"
    >
      <title>{{ title(w.personId) }}</title>
      <path
        :d="w.path"
        fill="#ffffff"
        stroke="#374151"
        stroke-width="1.5"
        :stroke-dasharray="w.nature !== 'biological-confirmed' ? '5 3' : undefined"
      />
      <text
        :transform="`translate(${w.labelX} ${w.labelY}) rotate(${w.labelRotation})`"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="12"
        fill="#111827"
        pointer-events="none"
      >
        {{ truncateLabel(name(w.personId)) }}
      </text>
    </g>
    <g v-if="rootNode" data-testid="fan-root" data-root="true">
      <title>{{ title(rootNode.personId) }}</title>
      <circle :cx="fan.cx" :cy="fan.cy" :r="FAN_ROOT_RADIUS" fill="#d1fae5" stroke="#374151" />
      <text
        :x="fan.cx"
        :y="fan.cy - 6"
        text-anchor="middle"
        font-size="12"
        fill="#111827"
        pointer-events="none"
      >
        {{ truncateLabel(name(rootNode.personId)) }}
      </text>
    </g>
  </svg>
</template>
