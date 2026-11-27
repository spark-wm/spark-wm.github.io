<script setup lang="ts">
// Schematic of one RoLA routing step, following rola.py: every query tile reads all condition
// tiles and its own aligned tile in the current chunk, plus the top 10% of video key tiles by
// pooled q·k score. Everything is also covered by the low-rank branch.
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { t } from '../content'
import { ui } from '../state'
import { useInView } from '../composables/useInView'

const T = 10 // tiles per chunk in the schematic
const CH = 6 // five memory chunks + the chunk being generated
const COND = 2
const ROWS = T
const VIDEO = T * CH
const KEEP = Math.max(1, Math.floor(0.1 * VIDEO))

const mode = ref<'sparse' | 'full'>('sparse')
const seed = ref(1)
const hover = ref(-1)
const root = ref<HTMLElement | null>(null)
const live = useInView(root, { ratio: 0.3, live: true })

function rng(s: number) {
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}

const routes = computed(() => {
  const r = rng(seed.value * 7919)
  const recency = [0.05, 0.12, 0.2, 0.3, 0.45, 0.55]
  const out: Set<number>[] = []
  for (let q = 0; q < ROWS; q++) {
    const scores: [number, number][] = []
    for (let j = 0; j < VIDEO; j++) {
      const m = Math.floor(j / T)
      const p = j % T
      const d = Math.min(Math.abs(p - q), T - Math.abs(p - q))
      scores.push([1.1 * Math.exp(-(d * d) / 3) + recency[m] + 0.95 * r(), j])
    }
    scores.sort((a, b) => b[0] - a[0])
    const pick = new Set(scores.slice(0, KEEP).map((s) => s[1]))
    pick.add((CH - 1) * T + q) // own tile in the current chunk (force_current_block)
    out.push(pick)
  }
  return out
})

const exactShare = computed(() => {
  if (mode.value === 'full') return 100
  let n = 0
  for (const s of routes.value) n += s.size
  return Math.round((100 * n) / (ROWS * VIDEO))
})

// geometry
const cell = 12
const gap = 2
const groupGap = 10
const left = 0
const top = 30
const colX = (c: number) => {
  if (c < COND) return left + c * (cell + gap)
  const j = c - COND
  const g = Math.floor(j / T)
  return left + COND * (cell + gap) + groupGap + g * (T * (cell + gap) + groupGap) + (j % T) * (cell + gap)
}
const width = colX(COND + VIDEO - 1) + cell
const height = top + ROWS * (cell + gap) - gap
const groupSpan = (g: number) => ({ x: colX(COND + g * T), w: T * (cell + gap) - gap })
const pctX = (x: number) => `${((x + 4) / (width + 8)) * 100}%`
// the last label hangs from the right edge of its group so it never runs past the figure
const pctRight = (x: number) => `${((width + 4 - x) / (width + 8)) * 100}%`

function kind(q: number, c: number): 'cond' | 'exact' | 'low' {
  if (c < COND) return 'cond'
  if (mode.value === 'full') return 'exact'
  return routes.value[q].has(c - COND) ? 'exact' : 'low'
}

let timer = 0
function loop() {
  clearInterval(timer)
  if (ui.reducedMotion) return
  timer = window.setInterval(() => { if (mode.value === 'sparse' && hover.value < 0) seed.value += 1 }, 2600)
}
watch(live, (on) => (on ? loop() : clearInterval(timer)), { immediate: true })
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <figure ref="root" class="fig stage-fig">
    <div class="top">
      <div class="seg" role="radiogroup">
        <button role="radio" :aria-checked="mode === 'full'" :class="{ on: mode === 'full' }" @click="mode = 'full'">{{ t.method.full }}</button>
        <button role="radio" :aria-checked="mode === 'sparse'" :class="{ on: mode === 'sparse' }" @click="mode = 'sparse'">{{ t.method.sparse }}</button>
      </div>
      <p class="share"><span class="num big">{{ exactShare }}%</span><span class="muted">{{ t.method.exact }}</span></p>
    </div>

    <div class="labels" aria-hidden="true">
      <span :style="{ left: pctX(colX(0)) }">{{ t.method.promptFrame }}</span>
      <span class="mid" :style="{ left: pctX((groupSpan(0).x + groupSpan(CH - 2).x + groupSpan(0).w) / 2) }">{{ t.player.memory }}</span>
      <span :style="{ right: pctRight(groupSpan(CH - 1).x + groupSpan(CH - 1).w) }">{{ t.method.current }}</span>
    </div>
    <svg :viewBox="`-4 16 ${width + 8} ${height - 12}`" class="grid" role="img" :aria-label="`${exactShare}% ${t.method.exact}`" @mouseleave="hover = -1">
      <g class="heads">
        <rect :x="groupSpan(0).x" y="20" :width="groupSpan(CH - 2).x + groupSpan(0).w - groupSpan(0).x" height="1.5" class="rule" />
        <rect :x="groupSpan(CH - 1).x" y="20" :width="groupSpan(CH - 1).w" height="1.5" class="rule accent" />
      </g>
      <g v-for="q in ROWS" :key="q" :class="{ dim: hover >= 0 && hover !== q - 1 }" @mouseenter="hover = q - 1">
        <rect
          v-for="c in COND + VIDEO"
          :key="c"
          :x="colX(c - 1)"
          :y="top + (q - 1) * (cell + gap)"
          :width="cell"
          :height="cell"
          rx="1.5"
          :class="['c', kind(q - 1, c - 1)]"
        />
      </g>
    </svg>

    <ul class="legend">
      <li><i class="sw cond" />{{ t.method.always }}</li>
      <li><i class="sw exact" />{{ t.method.exact }}</li>
      <li><i class="sw low" />{{ t.method.lowrank }}</li>
    </ul>
  </figure>
</template>

<style scoped>
.stage-fig {
  margin: 0;
  background: var(--stage);
  color: var(--stage-ink);
  border-radius: 10px;
  padding: 20px;
}
.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.seg {
  display: inline-flex;
  padding: 3px;
  border-radius: 8px;
  background: var(--stage3);
}
.seg button {
  height: 34px;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--stage-ink2);
}
.seg button.on {
  background: var(--stage-ink);
  color: var(--stage);
}
.share {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.big {
  font-size: 32px;
  font-weight: 650;
  letter-spacing: -0.02em;
  min-width: 2.6em;
  text-align: right;
}
.muted {
  color: var(--stage-ink2);
  font-size: 15px;
}
.grid {
  width: 100%;
  height: auto;
}
.labels {
  position: relative;
  height: 20px;
  font-size: 13px;
  color: var(--stage-ink2);
}
.labels span {
  position: absolute;
  top: 0;
  white-space: nowrap;
}
.labels span.mid {
  transform: translateX(-50%);
}
.rule {
  fill: var(--stage-ink3);
}
.rule.accent {
  fill: #ff5a1f;
}
.c {
  transition: fill 0.35s, opacity 0.35s;
}
.c.cond {
  fill: var(--stage-ink3);
}
.c.exact {
  fill: var(--stage-ink);
}
.c.low {
  fill: var(--stage3);
}
.dim .c {
  opacity: 0.25;
}
.legend {
  list-style: none;
  margin: 14px 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  font-size: 14px;
  color: var(--stage-ink2);
}
.legend li {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.sw {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  display: inline-block;
}
.sw.cond {
  background: var(--stage-ink3);
}
.sw.exact {
  background: var(--stage-ink);
}
.sw.low {
  background: var(--stage3);
  box-shadow: inset 0 0 0 1px var(--stage-line);
}
@media (max-width: 760px) {
  .stage-fig {
    padding: 14px;
  }
  .big {
    font-size: 26px;
  }
}
</style>
