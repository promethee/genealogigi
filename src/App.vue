<script setup lang="ts">
import { useFamilyStore } from "./store/index.ts";
import PeopleView from "./views/PeopleView.vue";
import WelcomeView from "./views/WelcomeView.vue";

const family = useFamilyStore();
</script>

<template>
  <PeopleView v-if="family.filePath" />
  <WelcomeView v-else />
</template>
