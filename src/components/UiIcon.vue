<script setup lang="ts">
// Hand-drawn icon set for this site: 20x20 grid, 1.75 stroke, round joins.
defineProps<{ name: 'play' | 'pause' | 'sound-on' | 'sound-off' | 'theme' | 'copy' | 'check' | 'chevron' | 'down'; size?: number }>()
</script>

<template>
  <svg :width="size || 20" :height="size || 20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">
    <template v-if="name === 'play'"><path d="M6.5 4.2v11.6L15.8 10z" fill="currentColor" /></template>
    <template v-else-if="name === 'pause'"><path d="M6.6 4.5v11M13.4 4.5v11" stroke-width="2.6" stroke-linecap="butt" /></template>
    <template v-else-if="name === 'sound-on'">
      <path d="M3.5 7.6h2.8L10 4.6v10.8l-3.7-3H3.5z" fill="currentColor" />
      <path d="M13 7.4a3.6 3.6 0 0 1 0 5.2" />
      <path d="M15.2 5.2a6.8 6.8 0 0 1 0 9.6" />
    </template>
    <template v-else-if="name === 'sound-off'">
      <path d="M3.5 7.6h2.8L10 4.6v10.8l-3.7-3H3.5z" fill="currentColor" />
      <path d="M13.2 7.6l4 4.8M17.2 7.6l-4 4.8" />
    </template>
    <template v-else-if="name === 'theme'">
      <circle cx="10" cy="10" r="6.4" />
      <path d="M10 3.6a6.4 6.4 0 0 1 0 12.8z" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'copy'">
      <rect x="7" y="7" width="9.5" height="9.5" rx="1.6" />
      <path d="M13 4.6V4.3A1.3 1.3 0 0 0 11.7 3H4.3A1.3 1.3 0 0 0 3 4.3v7.4A1.3 1.3 0 0 0 4.3 13h.3" />
    </template>
    <template v-else-if="name === 'check'"><path d="M4.5 10.5l3.6 3.4 7.4-8" /></template>
    <template v-else-if="name === 'chevron'"><path d="M5 7.5l5 5 5-5" /></template>
    <template v-else-if="name === 'down'"><path d="M10 3.5v12M5 11l5 5 5-5" /></template>
  </svg>
</template>
