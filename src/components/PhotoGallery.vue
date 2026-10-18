<script setup lang="ts">
import { computed, ref } from "vue";
import { MAX_PHOTOS_PER_PERSON } from "../data/photos.ts";
import type { PersonId } from "../data/types.ts";
import { t } from "../i18n/index.ts";
import { useFamilyStore } from "../store/index.ts";
import AppIcon from "./AppIcon.vue";
import PhotoViewer from "./PhotoViewer.vue";

const props = defineProps<{ personId: PersonId }>();

const family = useFamilyStore();
const person = computed(() => family.data?.people.find((p) => p.id === props.personId));
const photos = computed(() => person.value?.photos ?? []);

/** Index of the photo open in the viewer, or null. */
const viewing = ref<number | null>(null);
</script>

<template>
  <section v-if="person" data-testid="photos" class="flex flex-col gap-2">
    <div class="flex items-center justify-between gap-3">
      <h3 class="text-xs font-semibold tracking-wide text-slate-400 uppercase">
        {{ t("photo.title") }}
      </h3>
      <button
        data-testid="photo-add"
        class="btn btn-secondary btn-sm"
        :disabled="photos.length >= MAX_PHOTOS_PER_PERSON"
        @click="family.pickPhotos(personId)"
      >
        <AppIcon name="plus" />
        {{ t("photo.add") }}
      </button>
    </div>
    <p v-if="!photos.length" data-testid="photos-empty" class="text-sm text-slate-400">
      {{ t("photo.empty") }}
    </p>
    <ul v-else class="grid grid-cols-4 gap-2 sm:grid-cols-5">
      <li v-for="(photo, i) in photos" :key="photo.id" class="relative">
        <button
          class="block aspect-square w-full cursor-pointer overflow-hidden rounded-xl ring-1 ring-slate-200 transition hover:ring-2 hover:ring-emerald-600"
          data-testid="photo-thumb"
          :aria-label="t('photo.open', { n: i + 1, total: photos.length })"
          @click="viewing = i"
        >
          <img :src="photo.dataUrl" :alt="photo.caption ?? ''" class="size-full object-cover" />
        </button>
        <span
          v-if="i === 0"
          data-testid="photo-main-badge"
          class="pointer-events-none absolute top-1 left-1 rounded-full bg-emerald-700 px-1.5 py-0.5 text-[10px] font-medium text-white"
        >
          ★
        </span>
      </li>
    </ul>

    <PhotoViewer
      v-if="viewing !== null && person.photos?.length"
      :person="person"
      :index="Math.min(viewing, person.photos.length - 1)"
      @update:index="viewing = $event"
      @close="viewing = null"
    />
  </section>
</template>
