<script setup lang="ts">
import { onMounted } from "vue";
import AppIcon from "../components/AppIcon.vue";
import { t } from "../i18n/index.ts";
import { useFamilyStore } from "../store/index.ts";

const family = useFamilyStore();
onMounted(() => family.init());
</script>

<template>
  <main
    class="flex h-full w-full items-center justify-center bg-linear-to-b from-slate-50 to-emerald-50/60 p-6"
  >
    <div class="card flex w-full max-w-md flex-col items-center gap-6 px-8 py-10">
      <span
        class="grid size-14 place-items-center rounded-2xl bg-linear-to-br from-emerald-500 to-emerald-800 text-white shadow-md"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          class="size-8"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 21v-6M12 15H6v-4M12 15h6v-4M6 11V6M18 11V6" />
        </svg>
      </span>
      <div class="text-center">
        <h1 class="text-3xl font-semibold tracking-tight text-slate-900">Genealogigi</h1>
        <p class="mt-1.5 text-sm text-slate-500" data-testid="tagline">
          {{ t("welcome.tagline") }}
        </p>
      </div>
      <div class="flex w-full flex-col gap-2.5">
        <button
          data-testid="resume"
          class="btn btn-primary justify-start px-4 py-2.5"
          :disabled="!family.resumePath"
          @click="family.resume()"
        >
          <AppIcon name="play" />
          {{
            family.resumeFileName
              ? t("welcome.resume", { file: family.resumeFileName })
              : t("welcome.resumeLast")
          }}
        </button>
        <button
          data-testid="open"
          class="btn btn-secondary justify-start px-4 py-2.5"
          @click="family.openExisting()"
        >
          <AppIcon name="folder" />
          {{ t("welcome.open") }}
        </button>
        <button
          data-testid="create"
          class="btn btn-secondary justify-start px-4 py-2.5"
          @click="family.createNew()"
        >
          <AppIcon name="file-plus" />
          {{ t("welcome.create") }}
        </button>
      </div>
      <p
        v-if="family.error"
        data-testid="error"
        class="w-full rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700"
      >
        {{ family.error }}
      </p>
    </div>
  </main>
</template>
