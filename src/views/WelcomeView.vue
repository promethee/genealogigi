<script setup lang="ts">
import { onMounted } from "vue";
import { useFamilyStore } from "../store/index.ts";

const family = useFamilyStore();
onMounted(() => family.init());
</script>

<template>
  <main class="h-screen w-screen flex flex-col items-center justify-center gap-6 bg-white">
    <h1 class="text-3xl font-semibold text-gray-800">Genealogigi</h1>
    <div class="flex flex-col gap-3 w-72">
      <button
        data-testid="resume"
        class="rounded bg-emerald-700 px-4 py-2 text-white disabled:bg-gray-300 disabled:text-gray-500"
        :disabled="!family.resumePath"
        @click="family.resume()"
      >
        {{ family.resumeFileName ? `Resume ${family.resumeFileName}` : "Resume last family" }}
      </button>
      <button
        data-testid="open"
        class="rounded border border-gray-300 px-4 py-2 hover:bg-gray-50"
        @click="family.openExisting()"
      >
        Open family file…
      </button>
      <button
        data-testid="create"
        class="rounded border border-gray-300 px-4 py-2 hover:bg-gray-50"
        @click="family.createNew()"
      >
        Create new family…
      </button>
    </div>
    <p v-if="family.error" data-testid="error" class="max-w-md text-center text-sm text-red-600">
      {{ family.error }}
    </p>
  </main>
</template>
