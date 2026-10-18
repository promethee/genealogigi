<script setup lang="ts">
import { ref } from "vue";
import AppIcon from "../components/AppIcon.vue";
import { t, tn } from "../i18n/index.ts";
import PedigreeTree from "../components/PedigreeTree.vue";
import PersonForm from "../components/PersonForm.vue";
import RelationshipsSection from "../components/RelationshipsSection.vue";
import {
  displayName,
  displayNameParts,
  inputFromPerson,
  emptyPersonForm,
  lastNameSuggestions,
  lifeSummary,
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

function initialInput(): PersonFormValues {
  const target = formTarget.value;
  const person = family.data?.people.find((p) => p.id === target);
  return person ? inputFromPerson(person) : emptyPersonForm();
}

const AVATAR_COLORS = [
  "bg-emerald-100 text-emerald-800",
  "bg-sky-100 text-sky-800",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-800",
  "bg-violet-100 text-violet-800",
  "bg-teal-100 text-teal-800",
];

/** Up to two initials of the main name, e.g. "Marie Dubois" -> "MD". */
function initials(person: Parameters<typeof displayName>[0]): string {
  const words = displayNameParts(person).name.split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

/** A stable pastel colour per person, from a hash of their id. */
function avatarColor(person: Parameters<typeof displayName>[0]): string {
  let hash = 0;
  for (const ch of person.id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] as string;
}

async function submit(input: PersonFormInput): Promise<void> {
  const target = formTarget.value;
  if (!target) return;
  const ok =
    target === "new" ? await family.addPerson(input) : await family.editPerson(target, input);
  if (ok) formTarget.value = null;
}
</script>

<template>
  <main class="h-full w-full overflow-auto">
    <div class="mx-auto flex max-w-5xl flex-col gap-5 px-6 py-6">
      <header class="card p-5">
        <p data-testid="loaded-path" class="truncate font-mono text-xs text-slate-400">
          {{ family.filePath }}
        </p>
        <p data-testid="loaded-summary" class="mt-1 text-xl font-semibold text-slate-900">
          {{ tn("summary.people", family.data?.people.length ?? 0) }} ·
          {{ tn("summary.relationships", family.data?.relationships.length ?? 0) }}
        </p>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <button data-testid="save-copy" class="btn btn-secondary" @click="family.saveCopy()">
            <AppIcon name="copy" />
            {{ t("header.saveCopy") }}
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
        </div>
        <p
          v-if="family.notice"
          data-testid="notice"
          class="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
        >
          {{ family.notice }}
        </p>
      </header>

      <nav class="inline-flex self-start rounded-xl bg-slate-200/70 p-1 text-sm font-medium">
        <button
          data-testid="tab-list"
          class="cursor-pointer rounded-lg px-4 py-1.5 transition"
          :class="
            tab === 'list'
              ? 'bg-white text-slate-900 shadow-sm'
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
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          "
          @click="tab = 'tree'"
        >
          {{ t("tab.tree") }}
        </button>
      </nav>

      <div v-if="tab === 'tree'" class="card p-5">
        <PedigreeTree />
      </div>
      <template v-else>
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

        <div v-if="formTarget" class="card p-5">
          <PersonForm
            :key="formTarget"
            :initial="initialInput()"
            :auto-status="formTarget === 'new'"
            :last-name-suggestions="lastNameSuggestions(family.data?.people ?? [])"
            @submit="submit"
            @cancel="formTarget = null"
          />
        </div>

        <p
          v-if="family.error"
          data-testid="error"
          class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
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
            v-for="person in family.data.people"
            :key="person.id"
            data-testid="person-row"
            class="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-slate-50"
          >
            <span class="flex min-w-0 items-center gap-3">
              <span
                class="grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold"
                :class="avatarColor(person)"
                aria-hidden="true"
              >
                {{ initials(person) }}
              </span>
              <span class="min-w-0">
                <span data-testid="person-name" class="block truncate font-medium text-slate-900">{{
                  displayName(person)
                }}</span>
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
                data-testid="edit-person"
                class="btn btn-secondary btn-sm"
                @click="formTarget = person.id"
              >
                <AppIcon name="pencil" />
                {{ t("common.edit") }}
              </button>
              <button
                data-testid="delete-person"
                class="btn btn-danger btn-sm"
                @click="family.deletePerson(person.id, displayName(person))"
              >
                <AppIcon name="trash" />
                {{ t("common.delete") }}
              </button>
            </span>
          </li>
        </ul>
        <div class="card p-5">
          <RelationshipsSection />
        </div>
      </template>
    </div>
  </main>
</template>
