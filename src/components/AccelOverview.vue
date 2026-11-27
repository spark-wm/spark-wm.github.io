<script setup lang="ts">
// Overview of where SparkWM saves compute relative to H3: one card per change, what each one cuts,
// and the resulting end-to-end speed-up (shown once measured). Only facts stated elsewhere on the page.
import { computed, ref } from 'vue'
import { efficiency, t } from '../content'
import { ui } from '../state'
import { useInView } from '../composables/useInView'
import UiIcon from './UiIcon.vue'

const O = t.method.overview
const root = ref<HTMLElement | null>(null)
const seen = useInView(root, { ratio: 0.25 })
const on = computed(() => seen.value || ui.reducedMotion)
const speedup = computed(() => efficiency.multi.speedup)

// fixed "selected" cells for the sparse-attention sketch (about 10% of 48)
const lit = new Set([3, 14, 22, 37, 41])
</script>

<template>
  <figure ref="root" class="ov" :class="{ on }">
    <p class="ov-label">{{ O.label }}</p>
    <ol class="cards">
      <li v-for="(c, i) in O.cards" :key="i" class="card" :class="{ base: i === 0 }" :style="{ transitionDelay: on ? i * 90 + 'ms' : '0ms' }">
        <span class="idx num">{{ i }}</span>
        <svg class="mini" viewBox="0 0 120 40" aria-hidden="true" data-dot>
          <!-- 0: whole clip, many steps -->
          <g v-if="i === 0">
            <rect x="2" y="4" width="116" height="16" rx="3" class="dim" />
            <rect v-for="k in 30" :key="k" :x="2 + (k - 1) * 3.93" y="27" width="1.6" height="9" rx="0.8" class="tick" />
          </g>
          <!-- 1: five cached chunks + the current one -->
          <g v-else-if="i === 1">
            <path d="M2 6 v-3 h92 v3" class="bracket" />
            <rect v-for="k in 5" :key="k" :x="2 + (k - 1) * 19" y="10" width="15" height="22" rx="2.5" class="dim" />
            <rect x="97" y="10" width="21" height="22" rx="2.5" class="acc" />
          </g>
          <!-- 2: about 30 steps down to 4 -->
          <g v-else-if="i === 2">
            <circle v-for="k in 15" :key="k" :cx="4 + ((k - 1) % 5) * 7" :cy="8 + Math.floor((k - 1) / 5) * 12" r="2.2" class="dimdot" />
            <path d="M44 20 h20 m-5 -5 l5 5 l-5 5" class="arrow" />
            <circle v-for="k in 4" :key="'a' + k" :cx="76 + (k - 1) * 12.5" cy="20" r="4.6" class="acc" />
          </g>
          <!-- 3: sparse attention, a few exact tiles -->
          <g v-else-if="i === 3">
            <rect v-for="k in 48" :key="k" :x="2 + ((k - 1) % 12) * 9.8" :y="2 + Math.floor((k - 1) / 12) * 9.4" width="8" height="7.6" rx="1.4" :class="lit.has(k - 1) ? 'acc' : 'dim'" />
          </g>
          <!-- 4: 16 bits to 8 bits -->
          <g v-else>
            <rect v-for="k in 16" :key="k" :x="2 + (k - 1) * 7.25" y="4" width="5.6" height="12" rx="1.2" class="dim" />
            <rect v-for="k in 8" :key="'b' + k" :x="2 + (k - 1) * 7.25" y="24" width="5.6" height="12" rx="1.2" class="acc" />
          </g>
        </svg>
        <p class="name">{{ c.name }}</p>
        <p class="note">{{ c.note }}</p>
        <p v-if="c.cut" class="cut-inline"><span class="cut-label">{{ O.saves }}</span><span class="cut-what"><UiIcon name="down" :size="14" class="down" />{{ c.cut }}</span></p>
      </li>
    </ol>
    <div v-if="speedup !== null" class="result">
      <p class="result-label">{{ O.result }}</p>
      <p class="result-value"><span class="num big">{{ speedup >= 10 ? Math.round(speedup) : speedup.toFixed(1) }}<span class="unit">×</span></span></p>
    </div>
  </figure>
</template>

<style scoped>
.ov {
  margin: 0 0 clamp(56px, 7vw, 96px);
  color: var(--stage-ink);
}
.ov-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--ink2);
  margin-bottom: 14px;
}
.cards {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 18px;
}
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 18px 20px;
  border-radius: 14px;
  background: var(--stage);
  box-shadow: inset 0 0 0 1px var(--stage-line);
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.on .card {
  opacity: 1;
  transform: none;
}
.card:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 66px;
  right: -18px;
  width: 18px;
  height: 1.5px;
  background: var(--stage-accent);
}
.card.base {
  background: var(--stage);
  box-shadow: inset 0 0 0 1px var(--stage-line);
}
.card.base .name {
  color: var(--stage-ink2);
}
.idx {
  display: inline-grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  background: var(--stage-accent);
  color: #120a03;
}
.base .idx {
  background: var(--stage3);
  color: var(--stage-ink2);
}
.mini {
  width: 100%;
  height: 64px;
  margin: 10px 0 6px;
}
.dim {
  fill: var(--stage3);
}
.acc {
  fill: var(--stage-accent);
}
.tick,
.dimdot {
  fill: var(--stage-ink3);
}
.bracket,
.arrow {
  fill: none;
  stroke: var(--stage-ink3);
  stroke-width: 1.4;
}
.arrow {
  stroke: var(--stage-accent);
  stroke-linecap: round;
  stroke-linejoin: round;
}
.name {
  font-size: 18px;
  font-weight: 650;
  line-height: 1.3;
}
.note {
  font-size: 14px;
  line-height: 1.45;
  color: var(--stage-ink2);
}
.cut-inline {
  display: grid;
  gap: 2px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--stage-line);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
}
.cut-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--stage-ink3);
}
.down {
  display: inline-block;
  vertical-align: -2px;
  color: var(--stage-accent);
  margin-right: 6px;
  stroke-width: 2.2;
}
.result {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
  padding: 16px 18px;
  border-radius: 10px;
  background: linear-gradient(90deg, rgba(255, 106, 0, 0.16), rgba(255, 106, 0, 0.04));
  box-shadow: inset 0 0 0 1px rgba(255, 106, 0, 0.35);
}
.result-label {
  font-size: 16px;
  font-weight: 650;
}
.big {
  font-size: 40px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--stage-ink);
}
.unit {
  font-size: 0.5em;
  margin-left: 4px;
  color: var(--stage-ink2);
}
@media (max-width: 900px) {
  .cards {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .card {
    display: grid;
    grid-template-columns: 28px minmax(0, 1fr) 110px;
    grid-template-areas: 'idx name mini' 'idx note mini' 'idx cut mini';
    column-gap: 12px;
    row-gap: 2px;
    padding: 14px;
  }
  .card:not(:last-child)::after {
    display: none;
  }
  .idx {
    grid-area: idx;
  }
  .name {
    grid-area: name;
  }
  .note {
    grid-area: note;
  }
  .mini {
    grid-area: mini;
    align-self: center;
    height: 44px;
    margin: 0;
  }
  .cut-inline {
    grid-area: cut;
    margin-top: 6px;
    padding-top: 8px;
  }
  .result {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
}
</style>
