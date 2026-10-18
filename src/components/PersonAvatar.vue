<script setup lang="ts">
import { computed } from "vue";
import { avatarClasses, initialsOf } from "../data/avatar.ts";
import { displayNameParts } from "../data/people.ts";
import { mainPhotoOf } from "../data/photos.ts";
import type { Person } from "../data/types.ts";

const props = withDefaults(defineProps<{ person: Person; size?: "sm" | "md" | "lg" }>(), {
  size: "md",
});

const photo = computed(() => mainPhotoOf(props.person));
const sizeClass = computed(
  () => ({ sm: "size-9 text-xs", md: "size-11 text-sm", lg: "size-16 text-lg" })[props.size],
);
</script>

<template>
  <img
    v-if="photo"
    :src="photo.dataUrl"
    :alt="displayNameParts(person).name"
    data-testid="avatar-photo"
    class="shrink-0 rounded-full object-cover ring-1 ring-slate-200"
    :class="sizeClass"
  />
  <span
    v-else
    data-testid="avatar-initials"
    class="grid shrink-0 place-items-center rounded-full font-semibold"
    :class="[sizeClass, avatarClasses(person)]"
    aria-hidden="true"
  >
    {{ initialsOf(person) }}
  </span>
</template>
