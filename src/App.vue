<script setup lang="ts">
import { createPlatformAPI } from './platform/PlatformAPI.ts';

const platformAPI = createPlatformAPI();
</script>

<template>
  <div class="h-screen w-screen bg-white flex flex-col">
    <div class="h-8 flex items-center justify-end px-2 bg-gray-100">
      <button
        class="text-sm text-gray-600 hover:text-red-600"
        @click="platformAPI.close()">
        ✕
      </button>
    </div>
    <main class="flex-1 flex items-center justify-center text-gray-400">
      Genealogigi — ground work in progress
    </main>
  </div>
</template>
