<script setup lang="ts">
import { computed } from "vue";
import { avatarColors, initialsOf } from "../data/avatar.ts";
import { mainPhotoOf } from "../data/photos.ts";
import type { Person } from "../data/types.ts";

/**
 * A round portrait inside an SVG chart: the main photo, or initials on a tinted disc. The
 * parent SVG must define `<clipPath id="tree-avatar-clip" clipPathUnits="objectBoundingBox">`.
 */
const props = defineProps<{ person: Person | undefined; cx: number; cy: number; r: number }>();

const photo = computed(() => (props.person ? mainPhotoOf(props.person) : undefined));
const colors = computed(() =>
  props.person ? avatarColors(props.person) : { tint: "#94a3b8", ink: "#64748b" },
);
const initials = computed(() => (props.person ? initialsOf(props.person) : "?"));
</script>

<template>
  <g data-testid="tree-avatar" :data-photo="photo ? 'true' : 'false'">
    <image
      v-if="photo"
      :href="photo.dataUrl"
      :x="cx - r"
      :y="cy - r"
      :width="r * 2"
      :height="r * 2"
      preserveAspectRatio="xMidYMid slice"
      clip-path="url(#tree-avatar-clip)"
    />
    <template v-else>
      <circle :cx="cx" :cy="cy" :r="r" :fill="colors.tint" fill-opacity="0.2" />
      <text
        :x="cx"
        :y="cy"
        text-anchor="middle"
        dominant-baseline="central"
        :font-size="Math.round(r * 0.8)"
        font-weight="600"
        :fill="colors.ink"
      >
        {{ initials }}
      </text>
    </template>
    <circle
      :cx="cx"
      :cy="cy"
      :r="r"
      fill="none"
      stroke="var(--tree-node-stroke)"
      stroke-width="1"
    />
  </g>
</template>
