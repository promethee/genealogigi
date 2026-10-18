<script setup lang="ts">
import { computed } from "vue";
import { formatDate } from "../data/dates.ts";
import { displayName, displayNameParts, lifeSummary, primaryOf } from "../data/people.ts";
import { relativesOf } from "../data/relatives.ts";
import { natureLabel, statusLabel } from "../data/relationships.ts";
import type { PersonId } from "../data/types.ts";
import { t, type MessageKey } from "../i18n/index.ts";
import { useFamilyStore } from "../store/index.ts";
import AppIcon from "./AppIcon.vue";

const props = defineProps<{
  personId: PersonId;
  /** Offer "Show tree from here" (the tree tab). */
  showTreeAction?: boolean;
}>();
const emit = defineEmits<{
  edit: [];
  close: [];
  select: [id: PersonId];
  center: [id: PersonId];
  deleted: [];
}>();

const family = useFamilyStore();

const person = computed(() => family.data?.people.find((p) => p.id === props.personId));
const relatives = computed(() => (family.data ? relativesOf(family.data, props.personId) : null));

const nameOf = (id: PersonId): string => {
  const other = family.data?.people.find((p) => p.id === id);
  return other ? displayName(other) : t("rel.unknownPerson");
};

const initials = computed(() =>
  person.value
    ? displayNameParts(person.value)
        .name.split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w.charAt(0).toUpperCase())
        .join("")
    : "",
);

interface NameLine {
  value: string;
  kind: string;
  since: string;
  main: boolean;
}

function lines<K extends string>(
  entries:
    | { value: string; kind: K; date: Parameters<typeof formatDate>[0]; primary?: boolean }[]
    | undefined,
): NameLine[] {
  const main = primaryOf(entries);
  return (entries ?? []).map((e) => ({
    value: e.value,
    kind: t(`kind.${e.kind}` as MessageKey),
    since: e.date.yearKnown || e.date.monthKnown || e.date.dayKnown ? formatDate(e.date) : "",
    main: e === main,
  }));
}

const firstNames = computed(() => lines(person.value?.names?.firstNames));
const lastNames = computed(() => lines(person.value?.names?.lastNames));

/** "born 10 Dec 1815 in London" / "born in London" / "born 1815". */
const bornText = computed(() => {
  const born = person.value?.born;
  if (!born) return "";
  const known = born.birthDate.yearKnown || born.birthDate.monthKnown || born.birthDate.dayKnown;
  const date = known ? t("person.birthShort", { date: formatDate(born.birthDate) }) : "";
  const place = born.birthPlace;
  if (date && place) return `${date} ${t("detail.in", { place })}`;
  if (place) return t("detail.bornIn", { place });
  return date;
});

const lifeText = computed(() => {
  const status = person.value?.lifeStatus;
  if (!status) return "";
  if (status.living) return t("person.living");
  const d = status.dateOfDeath;
  const known = d.yearKnown || d.monthKnown || d.dayKnown;
  const date = known ? t("person.deathShort", { date: formatDate(d) }) : t("person.deceased");
  if (status.placeOfDeath) {
    return known
      ? `${date} ${t("detail.in", { place: status.placeOfDeath })}`
      : t("detail.diedIn", { place: status.placeOfDeath });
  }
  return date;
});

const hasLife = computed(() => Boolean(bornText.value || lifeText.value));

async function remove(): Promise<void> {
  if (!person.value) return;
  if (await family.deletePerson(props.personId, displayName(person.value))) emit("deleted");
}
</script>

<template>
  <section v-if="person" data-testid="person-detail" class="flex flex-col gap-5">
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div class="flex min-w-0 items-center gap-3">
        <span
          class="grid size-12 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800"
          aria-hidden="true"
        >
          {{ initials }}
        </span>
        <div class="min-w-0">
          <h2 data-testid="detail-name" class="truncate text-xl font-semibold text-slate-900">
            {{ displayName(person) }}
          </h2>
          <p v-if="lifeSummary(person)" class="text-sm text-slate-500">
            {{ lifeSummary(person) }}
          </p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-if="showTreeAction"
          data-testid="detail-center"
          class="btn btn-secondary btn-sm"
          @click="emit('center', personId)"
        >
          <AppIcon name="users" />
          {{ t("detail.showTree") }}
        </button>
        <button data-testid="detail-edit" class="btn btn-secondary btn-sm" @click="emit('edit')">
          <AppIcon name="pencil" />
          {{ t("common.edit") }}
        </button>
        <button data-testid="detail-delete" class="btn btn-danger btn-sm" @click="remove()">
          <AppIcon name="trash" />
          {{ t("common.delete") }}
        </button>
        <button data-testid="detail-close" class="btn btn-secondary btn-sm" @click="emit('close')">
          {{ t("detail.close") }}
        </button>
      </div>
    </header>

    <div class="grid gap-5 md:grid-cols-2">
      <div class="flex flex-col gap-4">
        <div>
          <h3 class="mb-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">
            {{ t("detail.names") }}
          </h3>
          <ul class="flex flex-col gap-1 text-sm" data-testid="detail-names">
            <li
              v-for="(n, i) in [...firstNames, ...lastNames]"
              :key="i"
              class="flex flex-wrap gap-x-2"
            >
              <span class="font-medium text-slate-800">{{ n.value }}</span>
              <span class="text-slate-500">{{ n.kind }}</span>
              <span v-if="n.since" class="text-slate-500">{{
                t("detail.since", { date: n.since })
              }}</span>
              <span v-if="n.main" class="chip" data-testid="detail-main">{{
                t("detail.main")
              }}</span>
            </li>
          </ul>
        </div>
        <div>
          <h3 class="mb-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">
            {{ t("detail.life") }}
          </h3>
          <ul
            v-if="hasLife"
            class="flex flex-col gap-1 text-sm text-slate-700"
            data-testid="detail-life"
          >
            <li v-if="bornText" data-testid="detail-born">{{ bornText }}</li>
            <li v-if="lifeText" data-testid="detail-status">{{ lifeText }}</li>
          </ul>
          <p v-else class="text-sm text-slate-400" data-testid="detail-nothing">
            {{ t("detail.nothingKnown") }}
          </p>
        </div>
      </div>

      <div v-if="relatives" class="flex flex-col gap-4" data-testid="detail-relatives">
        <div v-if="relatives.parents.length" data-testid="detail-parents">
          <h3 class="mb-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">
            {{ t("detail.parents") }}
          </h3>
          <ul class="flex flex-col gap-1 text-sm">
            <li v-for="p in relatives.parents" :key="p.link.id">
              <button
                class="font-medium text-emerald-700 hover:underline"
                data-testid="detail-relative"
                :title="t('detail.open', { name: nameOf(p.personId) })"
                @click="emit('select', p.personId)"
              >
                {{ nameOf(p.personId) }}
              </button>
              <span v-if="p.nature !== 'biological-confirmed'" class="ml-2 text-slate-500">
                {{ natureLabel(p.nature) }}
              </span>
            </li>
          </ul>
        </div>
        <div v-if="relatives.partners.length" data-testid="detail-partners">
          <h3 class="mb-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">
            {{ t("detail.partners") }}
          </h3>
          <ul class="flex flex-col gap-1 text-sm">
            <li v-for="p in relatives.partners" :key="p.link.id">
              <button
                class="font-medium text-emerald-700 hover:underline"
                data-testid="detail-relative"
                @click="emit('select', p.personId)"
              >
                {{ nameOf(p.personId) }}
              </button>
              <span class="ml-2 text-slate-500">{{ statusLabel(p.link.status) }}</span>
            </li>
          </ul>
        </div>
        <div v-if="relatives.children.length" data-testid="detail-children">
          <h3 class="mb-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">
            {{ t("detail.children") }}
          </h3>
          <ul class="flex flex-col gap-1 text-sm">
            <li v-for="c in relatives.children" :key="c.link.id">
              <button
                class="font-medium text-emerald-700 hover:underline"
                data-testid="detail-relative"
                @click="emit('select', c.personId)"
              >
                {{ nameOf(c.personId) }}
              </button>
              <span v-if="c.nature !== 'biological-confirmed'" class="ml-2 text-slate-500">
                {{ natureLabel(c.nature) }}
              </span>
            </li>
          </ul>
        </div>
        <div v-if="relatives.siblings.length" data-testid="detail-siblings">
          <h3 class="mb-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">
            {{ t("detail.siblings") }}
          </h3>
          <ul class="flex flex-col gap-1 text-sm">
            <li v-for="s in relatives.siblings" :key="s.personId">
              <button
                class="font-medium text-emerald-700 hover:underline"
                data-testid="detail-relative"
                @click="emit('select', s.personId)"
              >
                {{ nameOf(s.personId) }}
              </button>
              <span v-if="s.half" class="ml-2 text-slate-500">{{ t("detail.halfSibling") }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
