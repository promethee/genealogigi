[src/App.vue#72BB]
1:<script setup lang="ts">
2:import { createPlatformAPI } from './platform/PlatformAPI.ts';
3:
4:const platformAPI = createPlatformAPI();
5:</script>
6:
7:<template>
8:  <div class="h-screen w-screen bg-white flex flex-col">
9:    <div class="h-8 flex items-center justify-end px-2 bg-gray-100">
10:      <button
11:        class="text-sm text-gray-600 hover:text-red-600"
12:        @click="platformAPI.close()">
13:        ✕
14:      </button>
15:    </div>
16:    <main class="flex-1 flex items-center justify-center text-gray-400">
17:      Genealogigi — ground work in progress
18:    </main>
19:  </div>
20:</template>

[You have received this identical output 3 times. Re-reading 'src/App.vue' will not change it — use a narrower selector (path:A-B), or proceed with the edit.]