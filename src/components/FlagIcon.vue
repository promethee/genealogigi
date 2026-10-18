<script setup lang="ts">
import type { Locale } from "../i18n/index.ts";

// Drawn as SVG because Windows cannot render flag emoji (it shows two letters instead).
defineProps<{ locale: Locale }>();
</script>

<template>
  <span
    class="inline-block h-4 w-6 shrink-0 overflow-hidden rounded-[3px] shadow-[0_0_0_1px_rgba(15,23,42,0.18)]"
    data-testid="flag"
    :data-flag="locale"
  >
    <svg
      v-if="locale === 'fr'"
      viewBox="0 0 3 2"
      class="block size-full"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <rect width="1" height="2" fill="#0055A4" />
      <rect x="1" width="1" height="2" fill="#FFFFFF" />
      <rect x="2" width="1" height="2" fill="#EF4135" />
    </svg>
    <svg
      v-else
      viewBox="0 0 60 30"
      class="block size-full"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <clipPath id="flag-uk-s"><path d="M0,0 v30 h60 v-30 z" /></clipPath>
      <clipPath id="flag-uk-t">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <g clip-path="url(#flag-uk-s)">
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6" />
        <path
          d="M0,0 L60,30 M60,0 L0,30"
          clip-path="url(#flag-uk-t)"
          stroke="#C8102E"
          stroke-width="4"
        />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6" />
      </g>
    </svg>
  </span>
</template>
