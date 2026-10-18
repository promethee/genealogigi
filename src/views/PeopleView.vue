<script setup lang="ts">
import { computed, ref } from "vue";
import { searchPeople } from "../data/search.ts";
import type { NewPersonParents } from "../data/createPerson.ts";
import { isParentChild } from "../data/relationships.ts";
import AppIcon from "../components/AppIcon.vue";
import PersonAvatar from "../components/PersonAvatar.vue";
import { t, tn } from "../i18n/index.ts";
import PedigreeTree from "../components/PedigreeTree.vue";
import PersonDetail from "../components/PersonDetail.vue";
import PersonForm from "../components/PersonForm.vue";
import RelationshipsSection from "../components/RelationshipsSection.vue";
import {
  displayName,
  inputFromPerson,
  emptyPersonForm,
  lastNameSuggestions,
  lifeSummary,
  placeSuggestions,
  type PersonFormInput,
  type PersonFormValues,
} from "../data/people.ts";
import type { PersonId } from "../data/types.ts";
import { useFamilyStore } from "../store/index.ts";

const family = useFamilyStore();

// Tree first once there are relationships; chosen once, so adding the first one does not switch tabs.

const tab = ref<"list" | "tree">(family.data?.relationships.length ? "tree" : "list");

/** "new" = add form open, a PersonId = editing that person, null = form closed. */
const formTarget = ref<"new" | PersonId | null>(null);

/** The person whose detail card is open (read-only), or null. */
const viewing = ref<PersonId | null>(null);

const search = ref("");
const tree = ref<InstanceType<typeof PedigreeTree> | null>(null);
const matches = computed(() => searchPeople(family.data?.people ?? [], search.value));
const matchIds = computed(() => new Set(matches.value.map((p) => p.id)));
/** The list shows only matches while searching (focus); the tree highlights them instead. */
const listedPeople = computed(() =>
  search.value.trim() ? matches.value : (family.data?.people ?? []),
);
const RESULTS_SHOWN = 8;

/** List view: open the card. Tree view: centre the chart on them and open their card. */
function pick(id: PersonId): void {
  if (tab.value === "tree") tree.value?.focusPerson(id);
  else viewing.value = id;
}

function initialInput(): PersonFormValues {
  const target = formTarget.value;
  const person = family.data?.people.find((p) => p.id === target);
  return person ? inputFromPerson(person) : emptyPersonForm();
}

const parentChoices = computed(() =>
  (family.data?.people ?? []).map((p) => ({ id: p.id, label: displayName(p) })),
);

function arePartners(a: PersonId, b: PersonId): boolean {
  return (family.data?.relationships ?? []).some(
    (r) =>
      !isParentChild(r) &&
      ((r.personAId === a && r.personBId === b) || (r.personAId === b && r.personBId === a)),
  );
}

async function submit(input: PersonFormInput, parents?: NewPersonParents): Promise<void> {
  const target = formTarget.value;
  if (!target) return;
  const ok =
    target === "new"
      ? await family.addPerson(input, parents)
      : await family.editPerson(target, input);
  if (ok) {
    formTarget.value = null;
    // After editing someone, go back to their card.
    if (target !== "new") viewing.value = target;
  }
}
</script>

<template>
  <main class="h-full w-full overflow-auto">
    <div class="mx-auto flex max-w-[120rem] flex-col gap-5 px-6 py-6">
      <header class="card p-5">
        <p data-testid="loaded-path" class="truncate font-mono text-xs text-slate-400">
          {{ family.filePath }}
        </p>
        <p data-testid="loaded-summary" class="mt-1 text-xl font-semibold text-slate-900">
          {{ tn("summary.people", family.data?.people.length ?? 0) }} ·
          {{ tn("summary.relationships", family.data?.relationships.length ?? 0) }}
        </p>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <button data-testid="export" class="btn btn-secondary" @click="family.exportFamily()">
            <AppIcon name="download" />
            {{ t("header.export") }}
          </button>
          <button data-testid="import" class="btn btn-secondary" @click="family.importFamily()">
            <AppIcon name="upload" />
            {{ t("header.import") }}
          </button>
          <button
            v-if="family.gitStatus === 'ready'"
            data-testid="git-sync"
            :disabled="family.syncing"
            class="btn btn-secondary"
            @click="family.syncGit()"
          >
            <AppIcon name="sync" :class="{ 'animate-spin': family.syncing }" />
            {{ family.syncing ? t("git.syncing") : t("git.sync") }}
          </button>
          <p v-else-if="family.gitStatus !== 'unavailable'" data-testid="git-hint" class="chip">
            {{ t(`git.hint.${family.gitStatus}`) }}
          </p>
          <button
            data-testid="close-family"
            class="btn btn-secondary ml-auto"
            @click="family.closeFamily()"
          >
            <AppIcon name="home" />
            {{ t("header.close") }}
          </button>
        </div>
        <p
          v-if="family.notice"
          data-testid="notice"
          class="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
        >
          {{ family.notice }}
        </p>
        <ul
          v-if="family.warnings.length"
          data-testid="import-warnings"
          class="mt-2 list-disc rounded-lg bg-amber-50 px-3 py-2 pl-7 text-sm text-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
        >
          <li v-for="w in family.warnings" :key="w">{{ w.replace(/^• /, "") }}</li>
        </ul>
      </header>

      <div class="relative max-w-md" data-testid="search-box">
        <input
          v-model="search"
          type="search"
          data-testid="search"
          class="input w-full"
          :placeholder="t('search.placeholder')"
          :aria-label="t('search.label')"
          @keydown.enter.prevent="matches[0] && pick(matches[0].id)"
          @keydown.esc="search = ''"
        />
        <ul
          v-if="search.trim() && matches.length"
          data-testid="search-results"
          class="card absolute z-20 mt-1 max-h-72 w-full overflow-auto py-1 text-sm"
        >
          <li v-for="p in matches.slice(0, RESULTS_SHOWN)" :key="p.id">
            <button
              data-testid="search-result"
              class="block w-full cursor-pointer px-3 py-1.5 text-left hover:bg-slate-100"
              @click="pick(p.id)"
            >
              {{ displayName(p) }}
              <span class="text-xs text-slate-500">{{ lifeSummary(p) }}</span>
            </button>
          </li>
          <li v-if="matches.length > RESULTS_SHOWN" class="px-3 py-1 text-xs text-slate-500">
            {{ tn("search.more", matches.length - RESULTS_SHOWN) }}
          </li>
        </ul>
        <p
          v-else-if="search.trim()"
          data-testid="search-none"
          class="card absolute z-20 mt-1 w-full px-3 py-2 text-sm text-slate-500"
        >
          {{ t("search.none") }}
        </p>
      </div>

      <nav class="inline-flex self-start rounded-xl bg-slate-200/70 p-1 text-sm font-medium">
        <button
          data-testid="tab-list"
          class="cursor-pointer rounded-lg px-4 py-1.5 transition"
          :class="
            tab === 'list'
              ? 'bg-surface text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          "
          @click="tab = 'list'"
        >
          {{ t("tab.people") }}
        </button>
        <button
          data-testid="tab-tree"
          class="cursor-pointer rounded-lg px-4 py-1.5 transition"
          :class="
            tab === 'tree'
              ? 'bg-surface text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          "
          @click="tab = 'tree'"
        >
          {{ t("tab.tree") }}
        </button>
      </nav>

      <div v-if="tab === 'tree'" class="card p-5">
        <PedigreeTree ref="tree" :highlight-ids="search.trim() ? matchIds : undefined" />
      </div>
      <div v-else class="grid items-start gap-5 xl:grid-cols-2" data-testid="list-layout">
        <div class="flex min-w-0 flex-col gap-5">
          <div v-if="!formTarget">
            <button
              data-testid="add-person"
              class="btn btn-primary px-4 py-2"
              @click="formTarget = 'new'"
            >
              <AppIcon name="plus" />
              {{ t("person.add") }}
            </button>
          </div>

          <div v-if="viewing && !formTarget" class="card p-5" data-testid="person-card">
            <PersonDetail
              :key="viewing"
              :person-id="viewing"
              @edit="formTarget = viewing"
              @close="viewing = null"
              @select="viewing = $event"
              @deleted="viewing = null"
            />
          </div>

          <div v-if="formTarget" class="card p-5">
            <PersonForm
              :key="formTarget"
              :initial="initialInput()"
              :auto-status="formTarget === 'new'"
              :last-name-suggestions="lastNameSuggestions(family.data?.people ?? [])"
              :place-suggestions="placeSuggestions(family.data?.people ?? [])"
              :parent-choices="parentChoices"
              :are-partners="arePartners"
              @submit="submit"
              @cancel="formTarget = null"
            />
          </div>

          <p
            v-if="family.error"
            data-testid="error"
            class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300"
          >
            {{ family.error }}
          </p>

          <p
            v-if="!family.data?.people.length"
            data-testid="empty-state"
            class="card px-5 py-8 text-center text-sm text-slate-400"
          >
            {{ t("person.empty") }}
          </p>
          <ul v-else class="card divide-y divide-slate-100 overflow-hidden">
            <li
              v-for="person in listedPeople"
              :key="person.id"
              data-testid="person-row"
              class="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-slate-50"
            >
              <span class="flex min-w-0 items-center gap-3">
                <PersonAvatar :person="person" size="md" />
                <span class="min-w-0">
                  <button
                    data-testid="person-name"
                    class="block max-w-full cursor-pointer truncate text-left font-medium text-slate-900 hover:text-link hover:underline"
                    :title="t('detail.open', { name: displayName(person) })"
                    @click="viewing = person.id"
                  >
                    {{ displayName(person) }}
                  </button>
                  <span
                    v-if="lifeSummary(person)"
                    data-testid="person-life"
                    class="block text-xs text-slate-500"
                    >{{ lifeSummary(person) }}</span
                  >
                </span>
              </span>
              <span class="flex shrink-0 gap-2">
                <button
                  data-testid="view-person"
                  class="btn btn-secondary btn-sm"
                  @click="viewing = person.id"
                >
                  <AppIcon name="eye" />
                  {{ t("common.view") }}
                </button>
              </span>
            </li>
          </ul>
        </div>
        <div class="card min-w-0 p-5">
          <RelationshipsSection />
        </div>
      </div>
    </div>
  </main>
</template>
