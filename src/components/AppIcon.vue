<script setup lang="ts">
export type IconName =
  | "pencil"
  | "trash"
  | "plus"
  | "copy"
  | "sync"
  | "folder"
  | "file-plus"
  | "play"
  | "users"
  | "link"
  | "check"
  | "eye"
  | "sun"
  | "moon"
  | "download"
  | "upload"
  | "home"
  | "globe"
  | "filter"
  | "x";

defineProps<{ name: IconName }>();

// Stroke icons on a 24x24 grid (Lucide-style paths), drawn inline so there is no icon dependency.
const PATHS: Record<IconName, string> = {
  pencil: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6",
  plus: "M12 5v14M5 12h14",
  copy: "M9 9h11v11H9ZM5 15H4V4h11v1",
  sync: "M21 12a9 9 0 0 0-15-6.7L3 8M3 3v5h5M3 12a9 9 0 0 0 15 6.7L21 16M21 21v-5h-5",
  folder: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z",
  "file-plus": "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8ZM14 3v5h5M12 12v6M9 15h6",
  play: "M5 3l14 9-14 9Z",
  users:
    "M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 20v-1a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  link: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1",
  check: "M5 12l5 5L20 7",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  download: "M12 3v12M7 10l5 5 5-5M4 20h16",
  upload: "M12 15V3M7 8l5-5 5 5M4 20h16",
  globe:
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18",
  filter: "M3 5h18l-7 8v6l-4 2v-8Z",
  home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  x: "M6 6l12 12M18 6L6 18",
};
</script>

<template>
  <svg
    class="size-4 shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="PATHS[name]" />
  </svg>
</template>
