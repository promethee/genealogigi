<script setup lang="ts">
import { ref } from "vue";
import { t, tn } from "../i18n/index.ts";
import PedigreeTree from "../components/PedigreeTree.vue";
import PersonForm from "../components/PersonForm.vue";
import RelationshipsSection from "../components/RelationshipsSection.vue";
import {
  displayName,
  inputFromPerson,
  emptyPersonForm,
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

async function submit(input: PersonFormInput): Promise<void> {
  const target = formTarget.value;
  if (!target) return;
  const ok =
    target === "new" ? await family.addPerson(input) : await family.editPerson(target, input);
  if (ok) formTarget.value = null;
}
</script>

<template>
  <main class="h-full w-full overflow-auto bg-white p-6 text-gray-700">
    <header class="mb-4">
      <p data-testid="loaded-path" class="text-sm text-gray-500">{{ family.filePath }}</p>
      <p data-testid="loaded-summary" class="text-lg">
        {{ tn("summary.people", family.data?.people.length ?? 0) }} ·
        {{ tn("summary.relationships", family.data?.relationships.length ?? 0) }}
      </p>
      <button
        data-testid="save-copy"
        class="mt-2 rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
        @click="family.saveCopy()"
      >
        {{ t("header.saveCopy") }}
      </button>
      <button
        v-if="family.gitStatus === 'ready'"
        data-testid="git-sync"
        :disabled="family.syncing"
        class="mt-2 ml-2 rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 disabled:text-gray-400"
        @click="family.syncGit()"
      >
        {{ family.syncing ? t("git.syncing") : t("git.sync") }}
      </button>
      <p
        v-else-if="family.gitStatus !== 'unavailable'"
        data-testid="git-hint"
        class="mt-2 text-sm text-gray-400"
      >
        {{ t(`git.hint.${family.gitStatus}`) }}
      </p>
      <p v-if="family.notice" data-testid="notice" class="mt-2 text-sm text-emerald-700">
        {{ family.notice }}
      </p>
    </header>

    <nav class="mb-4 flex gap-2 border-b border-gray-200">
      <button
        data-testid="tab-list"
        class="px-3 py-1.5 text-sm"
        :class="tab === 'list' ? 'border-b-2 border-emerald-700 font-medium' : 'text-gray-500'"
        @click="tab = 'list'"
      >
        {{ t("tab.people") }}
      </button>
      <button
        data-testid="tab-tree"
        class="px-3 py-1.5 text-sm"
        :class="tab === 'tree' ? 'border-b-2 border-emerald-700 font-medium' : 'text-gray-500'"
        @click="tab = 'tree'"
      >
        {{ t("tab.tree") }}
      </button>
    </nav>

    <PedigreeTree v-if="tab === 'tree'" />
    <div v-else>
      <button
        v-if="!formTarget"
        data-testid="add-person"
        class="mb-4 rounded bg-emerald-700 px-4 py-2 text-white"
        @click="formTarget = 'new'"
      >
        {{ t("person.add") }}
      </button>

      <PersonForm
        v-if="formTarget"
        :key="formTarget"
        :initial="initialInput()"
        @submit="submit"
        @cancel="formTarget = null"
      />

      <p v-if="family.error" data-testid="error" class="mb-3 text-sm text-red-600">
        {{ family.error }}
      </p>

      <p v-if="!family.data?.people.length" data-testid="empty-state" class="text-gray-400">
        {{ t("person.empty") }}
      </p>
      <ul v-else class="divide-y divide-gray-200">
        <li
          v-for="person in family.data.people"
          :key="person.id"
          data-testid="person-row"
          class="flex items-center justify-between py-2"
        >
          <span>
            <span data-testid="person-name">{{ displayName(person) }}</span>
            <span
              v-if="lifeSummary(person)"
              data-testid="person-life"
              class="ml-2 text-sm text-gray-500"
              >{{ lifeSummary(person) }}</span
            >
          </span>
          <span class="flex gap-2">
            <button
              data-testid="edit-person"
              class="text-sm text-emerald-700 hover:underline disabled:text-gray-400 disabled:no-underline"
              @click="formTarget = person.id"
            >
              {{ t("common.edit") }}
            </button>
            <button
              data-testid="delete-person"
              class="text-sm text-red-600 hover:underline"
              @click="family.deletePerson(person.id, displayName(person))"
            >
              {{ t("common.delete") }}
            </button>
          </span>
        </li>
      </ul>
      <RelationshipsSection />
    </div>
  </main>
</template>
