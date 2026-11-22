<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { DRAFT, facts, t } from '../content'
import { tr, ui } from '../state'
import { useInView } from '../composables/useInView'

const root = ref<HTMLElement | null>(null)
const seen = useInView(root, { ratio: 0.4 })
const shown = facts.filter((f) => f.value !== null || DRAFT)
const display = ref(shown.map((f) => (f.countTo !== undefined && !ui.reducedMotion ? '0' : f.value ?? '')))
let raf = 0

watch(seen, (on) => {
  if (!on || ui.reducedMotion) return
  const t0 = performance.now()
  const D = 900
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / D)
    const e = 1 - Math.pow(1 - p, 3)
    display.value = shown.map((f) => (f.countTo !== undefined ? String(Math.round(f.countTo * e)) : f.value ?? ''))
    if (p < 1) raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
})
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <ul ref="root" class="facts">
    <li v-for="(f, i) in shown" :key="i" class="fact">
      <p class="value num">
        <template v-if="f.value !== null">{{ display[i] }}<span v-if="f.unit" class="unit">{{ f.unit }}</span></template>
        <span v-else class="pending">{{ tr(t.pending) }}</span>
      </p>
      <p class="label">{{ tr(f.label) }}</p>
    </li>
  </ul>
</template>

<style scoped>
.facts {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  border-top: 1px solid var(--line2);
}
.fact {
  padding: 20px 20px 4px 0;
}
.fact + .fact {
  padding-left: 20px;
  border-left: 1px solid var(--line);
}
.value {
  font-size: clamp(40px, 4.6vw, 64px);
  font-weight: 650;
  font-stretch: 108%;
  line-height: 1;
  letter-spacing: -0.03em;
  min-height: 1em;
  margin-left: -0.03em;
}
.unit {
  font-size: 0.5em;
  font-weight: 600;
  letter-spacing: 0;
  margin-left: 0.08em;
  color: var(--ink2);
}
.value .pending {
  font-size: 15px;
  letter-spacing: 0;
  vertical-align: middle;
}
.label {
  margin-top: 10px;
  font-size: 15px;
  line-height: 1.4;
  color: var(--ink2);
  max-width: 220px;
}
@media (max-width: 760px) {
  .facts {
    grid-template-columns: 1fr 1fr;
  }
  .fact,
  .fact + .fact {
    padding: 16px 12px 8px 0;
    border-left: 0;
  }
  .fact:nth-child(even) {
    padding-left: 12px;
    border-left: 1px solid var(--line);
  }
}
</style>
