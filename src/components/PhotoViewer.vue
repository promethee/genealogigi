<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { Person, PersonPhoto } from "../data/types.ts";
import { t } from "../i18n/index.ts";
import { useFamilyStore } from "../store/index.ts";
import AppIcon from "./AppIcon.vue";

const props = defineProps<{ person: Person; index: number }>();
const emit = defineEmits<{ close: []; "update:index": [index: number] }>();

const family = useFamilyStore();

const photos = computed<PersonPhoto[]>(() => props.person.photos ?? []);
const photo = computed(() => photos.value[props.index]);
const caption = ref(photo.value?.caption ?? "");
watch(photo, (p) => (caption.value = p?.caption ?? ""), { immediate: true });

const dirty = computed(() => caption.value.trim() !== (photo.value?.caption ?? ""));

function go(delta: number): void {
  const total = photos.value.length;
  if (total > 1) emit("update:index", (props.index + delta + total) % total);
}

async function saveCaption(): Promise<void> {
  if (photo.value) await family.captionPhoto(props.person.id, photo.value.id, caption.value);
}

async function makeMain(): Promise<void> {
  if (!photo.value) return;
  // The photo moves to the front, so the viewer follows it there.
  if (await family.makeMainPhoto(props.person.id, photo.value.id)) emit("update:index", 0);
}

async function remove(): Promise<void> {
  if (!photo.value) return;
  const wasLast = props.index >= photos.value.length - 1;
  if (!(await family.deletePhoto(props.person.id, photo.value.id))) return;
  if (photos.value.length === 0) emit("close");
  else if (wasLast) emit("update:index", photos.value.length - 1);
}

function onKey(event: KeyboardEvent): void {
  if (event.target instanceof HTMLInputElement) {
    if (event.key === "Escape") emit("close");
    return;
  }
  if (event.key === "Escape") emit("close");
  else if (event.key === "ArrowLeft") go(-1);
  else if (event.key === "ArrowRight") go(1);
}
onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));
</script>

<template>
  <div
    v-if="photo"
    class="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
    role="dialog"
    aria-modal="true"
    data-testid="photo-viewer"
    @click.self="emit('close')"
  >
    <div class="card flex max-h-full w-full max-w-2xl flex-col gap-3 overflow-auto p-4">
      <div class="relative grid place-items-center rounded-xl bg-slate-100">
        <img
          :src="photo.dataUrl"
          :alt="photo.caption ?? ''"
          data-testid="viewer-image"
          class="max-h-[60vh] max-w-full rounded-xl object-contain"
        />
        <template v-if="photos.length > 1">
          <button
            class="btn btn-secondary btn-sm absolute top-1/2 left-2 size-9 -translate-y-1/2 p-0!"
            data-testid="viewer-prev"
            :aria-label="t('photo.previous')"
            @click="go(-1)"
          >
            ‹
          </button>
          <button
            class="btn btn-secondary btn-sm absolute top-1/2 right-2 size-9 -translate-y-1/2 p-0!"
            data-testid="viewer-next"
            :aria-label="t('photo.next')"
            @click="go(1)"
          >
            ›
          </button>
        </template>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
        <span data-testid="viewer-count">{{
          t("photo.of", { n: index + 1, total: photos.length })
        }}</span>
        <span v-if="index === 0" class="chip" data-testid="viewer-main">{{ t("photo.main") }}</span>
      </div>

      <form class="flex flex-wrap items-end gap-2" @submit.prevent="saveCaption">
        <label class="label min-w-56 flex-1">
          {{ t("photo.caption") }}
          <input
            v-model="caption"
            data-testid="viewer-caption"
            class="input"
            autocomplete="off"
            :placeholder="t('photo.captionPlaceholder')"
          />
        </label>
        <button
          type="submit"
          data-testid="viewer-save-caption"
          class="btn btn-secondary"
          :disabled="!dirty"
        >
          <AppIcon name="check" />
          {{ t("photo.saveCaption") }}
        </button>
      </form>

      <div class="flex flex-wrap justify-between gap-2">
        <span class="flex gap-2">
          <button
            v-if="index !== 0"
            data-testid="viewer-make-main"
            class="btn btn-secondary"
            @click="makeMain"
          >
            {{ t("photo.makeMain") }}
          </button>
          <button data-testid="viewer-remove" class="btn btn-danger" @click="remove">
            <AppIcon name="trash" />
            {{ t("photo.remove") }}
          </button>
        </span>
        <button data-testid="viewer-close" class="btn btn-secondary" @click="emit('close')">
          {{ t("photo.close") }}
        </button>
      </div>
    </div>
  </div>
</template>
