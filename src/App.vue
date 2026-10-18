<script setup lang="ts">
import { onMounted } from "vue";
import LanguageSwitch from "./components/LanguageSwitch.vue";
import { useFamilyStore, useLanguageStore } from "./store/index.ts";
import PeopleView from "./views/PeopleView.vue";
import WelcomeView from "./views/WelcomeView.vue";

const family = useFamilyStore();
const language = useLanguageStore();
onMounted(() => language.init());
</script>

<template>
  <div class="flex h-screen w-screen flex-col bg-white">
    <!-- Always visible, on every screen. -->
    <div class="flex shrink-0 justify-end border-b border-gray-100 px-4 py-1">
      <LanguageSwitch />
    </div>
    <div class="min-h-0 flex-1">
      <PeopleView v-if="family.filePath" />
      <WelcomeView v-else />
    </div>
  </div>
</template>
