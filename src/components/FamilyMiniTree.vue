<script setup lang="ts">
import { computed } from "vue";
import { miniTreeOf } from "../data/miniTree.ts";
import { displayNameParts } from "../data/people.ts";
import { natureLabel } from "../data/relationships.ts";
import { relativesOf } from "../data/relatives.ts";
import type { PersonId } from "../data/types.ts";
import { truncateName } from "../data/pedigree.ts";
import { t } from "../i18n/index.ts";
import { useFamilyStore } from "../store/index.ts";
import TreeAvatar from "./TreeAvatar.vue";

const props = defineProps<{ personId: PersonId }>();
const emit = defineEmits<{ select: [id: PersonId] }>();

const BOX_W = 156;
const BOX_H = 42;
const GAP_X = 16;
const ROW_H = 70;
const AVATAR_R = 14;
const TEXT_X = 38;
const PAD = 8;

const family = useFamilyStore();

const tree = computed(() =>
  family.data ? miniTreeOf(props.personId, relativesOf(family.data, props.personId)) : null,
);

const byId = computed(() => new Map((family.data?.people ?? []).map((p) => [p.id, p])));

const nameOf = (id: PersonId): string => {
  const person = family.data?.people.find((p) => p.id === id);
  return person ? displayNameParts(person).name : t("rel.unknownPerson");
};

const pos = (slot: number, row: number) => ({
  x: PAD + slot * (BOX_W + GAP_X),
  y: PAD + row * ROW_H,
});

const size = computed(() => {
  const tr = tree.value;
  if (!tr) return { w: 0, h: 0 };
  return {
    w: PAD * 2 + tr.slots * BOX_W + (tr.slots - 1) * GAP_X,
    h: PAD * 2 + (tr.rows - 1) * ROW_H + BOX_H,
  };
});

const boxes = computed(() =>
  (tree.value?.nodes ?? []).map((n) => ({ ...n, ...pos(n.slot, n.row) })),
);

const lines = computed(() => {
  const byKey = new Map(boxes.value.map((b) => [b.key, b]));
  return (tree.value?.edges ?? []).flatMap((e) => {
    const a = byKey.get(e.fromKey);
    const b = byKey.get(e.toKey);
    if (!a || !b) return [];
    if (e.kind === "partner") {
      const y = a.y + BOX_H / 2;
      return [
        {
          key: `${e.fromKey}>${e.toKey}`,
          d: `M ${a.x + BOX_W} ${y} H ${b.x}`,
          dashed: e.dashed,
          partner: true,
        },
      ];
    }
    const down = b.y > a.y;
    const x1 = a.x + BOX_W / 2;
    const y1 = down ? a.y + BOX_H : a.y;
    const x2 = b.x + BOX_W / 2;
    const y2 = down ? b.y : b.y + BOX_H;
    const mid = (y1 + y2) / 2;
    return [
      {
        key: `${e.fromKey}>${e.toKey}`,
        d: `M ${x1} ${y1} V ${mid} H ${x2} V ${y2}`,
        dashed: e.dashed,
        partner: false,
      },
    ];
  });
});
</script>

<template>
  <div v-if="tree" data-testid="mini-tree">
    <h3 class="mb-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">
      {{ t("detail.family") }}
    </h3>
    <div class="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/70 py-1">
      <svg
        class="mx-auto block"
        :width="size.w"
        :height="size.h"
        :style="{ maxWidth: '100%', height: 'auto', minWidth: `${Math.round(size.w * 0.55)}px` }"
        :viewBox="`0 0 ${size.w} ${size.h}`"
        role="img"
        :aria-label="t('detail.family')"
      >
        <defs>
          <clipPath id="tree-avatar-clip" clipPathUnits="objectBoundingBox">
            <circle cx="0.5" cy="0.5" r="0.5" />
          </clipPath>
        </defs>
        <path
          v-for="line in lines"
          :key="line.key"
          data-testid="mini-edge"
          :data-dashed="line.dashed"
          :data-partner="line.partner"
          :d="line.d"
          fill="none"
          :stroke="line.partner ? 'var(--tree-partner)' : 'var(--tree-edge)'"
          stroke-width="1.5"
          :stroke-dasharray="line.dashed ? '4 3' : undefined"
        />
        <g
          v-for="box in boxes"
          :key="box.key"
          data-testid="mini-node"
          :data-role="box.role"
          :class="box.role === 'self' ? '' : 'cursor-pointer'"
          :transform="`translate(${box.x} ${box.y})`"
          @click="box.role !== 'self' && emit('select', box.personId)"
        >
          <title>{{ nameOf(box.personId) }}</title>
          <rect
            :width="BOX_W"
            :height="BOX_H"
            rx="8"
            :fill="box.role === 'self' ? 'var(--tree-root)' : 'var(--tree-node)'"
            :stroke="box.role === 'self' ? 'var(--tree-root-stroke)' : 'var(--tree-node-stroke)'"
            :stroke-width="box.role === 'self' ? 1.5 : 1"
          />
          <TreeAvatar
            :person="byId.get(box.personId)"
            :cx="BOX_H / 2"
            :cy="BOX_H / 2"
            :r="AVATAR_R"
          />
          <text
            :x="TEXT_X"
            :y="box.nature ? 19 : BOX_H / 2 + 4"
            text-anchor="start"
            font-size="12"
            font-weight="500"
            fill="var(--tree-text)"
          >
            {{ truncateName(nameOf(box.personId), 15) }}
          </text>
          <text
            v-if="box.nature"
            data-testid="mini-nature"
            :x="TEXT_X"
            y="33"
            text-anchor="start"
            font-size="9"
            fill="var(--tree-muted)"
          >
            {{ natureLabel(box.nature) }}
          </text>
        </g>
      </svg>
    </div>
  </div>
</template>
