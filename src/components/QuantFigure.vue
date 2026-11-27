<script setup lang="ts">
// MXFP8 fake quantization of one group, as configured in train.qat: 32 values share
// one power-of-two scale and each value is rounded to the nearest FP8 E4M3 number (3 mantissa bits).
// In units of that scale s = 2^floor(log2 max|x|), values lie in (-2, 2); E4M3 spacing is 2^(e-3) inside
// [2^e, 2^(e+1)), and the largest magnitude is 448 / 256 = 1.75.
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { t } from '../content'
import { ui } from '../state'
import { useInView } from '../composables/useInView'

const N = 32
const mode = ref<'bf16' | 'mx'>('mx')
const seed = ref(5)
const k = ref(1) // 0 = BF16 values, 1 = MXFP8 values
const touched = ref(false)
const root = ref<HTMLElement | null>(null)
const live = useInView(root, { ratio: 0.3, live: true })

function rng(s: number) {
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}
function e4m3(u: number) {
  const m = Math.abs(u)
  if (m === 0) return 0
  const step = 2 ** (Math.floor(Math.log2(m)) - 3)
  return Math.sign(u) * Math.min(1.75, Math.round(m / step) * step)
}
const bars = computed(() => {
  const r = rng(seed.value * 104729)
  const v = Array.from({ length: N }, () => (r() + r() + r() + r() - 2) * 1.3)
  const s = 2 ** Math.floor(Math.log2(Math.max(...v.map(Math.abs))))
  return v.map((x) => ({ u: x / s, q: e4m3(x / s) }))
})

// geometry
const W = 10
const GAP = 4
const X0 = 8
const H = 54
const Y0 = 120
const x = (i: number) => X0 + i * (W + GAP)
const right = x(N - 1) + W
const levels: number[] = []
for (let e = -1; e <= 0; e++) for (let j = 0; j < 8; j++) {
  const m = 2 ** e * (1 + j / 8)
  if (m <= 1.75) levels.push(m, -m)
}
function rect(h: number) {
  return { y: h >= 0 ? Y0 - h : Y0, height: Math.max(1, Math.abs(h)) }
}

// animate k towards the mode
let raf = 0
function animateTo(target: number) {
  cancelAnimationFrame(raf)
  if (ui.reducedMotion) { k.value = target; return }
  const from = k.value
  const t0 = performance.now()
  const dur = 700
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / dur)
    const e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2
    k.value = from + (target - from) * e
    if (p < 1) raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
}
watch(mode, (m) => animateTo(m === 'mx' ? 1 : 0))

function choose(m: 'bf16' | 'mx') {
  touched.value = true
  mode.value = m
}

// on its own: show a new group as BF16, then quantize it
let timer = 0
function loop() {
  clearInterval(timer)
  if (ui.reducedMotion || touched.value) return
  timer = window.setInterval(() => {
    if (touched.value) { clearInterval(timer); return }
    if (mode.value === 'mx') { seed.value += 1; mode.value = 'bf16' } else mode.value = 'mx'
  }, 2400)
}
watch(live, (on) => (on ? loop() : clearInterval(timer)), { immediate: true })
onBeforeUnmount(() => { clearInterval(timer); cancelAnimationFrame(raf) })

const bits = computed(() => (mode.value === 'mx' ? 8 : 16))
</script>

<template>
  <figure ref="root" class="fig stage-fig">
    <div class="top">
      <div class="seg" role="radiogroup">
        <button role="radio" :aria-checked="mode === 'bf16'" :class="{ on: mode === 'bf16' }" @click="choose('bf16')">BF16</button>
        <button role="radio" :aria-checked="mode === 'mx'" :class="{ on: mode === 'mx' }" @click="choose('mx')">MXFP8</button>
      </div>
      <p class="share"><span class="num big">{{ bits }}</span><span class="muted">{{ t.method.qBits }}</span></p>
    </div>

    <p class="head">{{ t.method.qGroup }}</p>
    <svg :viewBox="`0 0 ${right + X0} ${2 * Y0}`" class="plot" role="img" :aria-label="`${t.method.qGroup}, ${bits} ${t.method.qBits}`">
      <rect :x="X0" y="0" :width="right - X0" height="1.5" class="rule" />
      <line v-for="(l, i) in levels" :key="'l' + i" :x1="X0" :x2="right" :y1="Y0 - H * l" :y2="Y0 - H * l" class="level" :style="{ opacity: 0.08 + 0.32 * k }" />
      <line :x1="X0" :x2="right" :y1="Y0" :y2="Y0" class="axis" />
      <g v-for="(b, i) in bars" :key="i">
        <rect :x="x(i)" v-bind="rect(H * (b.u + (b.q - b.u) * k))" :width="W" rx="1.5" class="bar" :class="{ q: k > 0.5 }" />
        <line :x1="x(i) - 1.5" :x2="x(i) + W + 1.5" :y1="Y0 - H * b.u" :y2="Y0 - H * b.u" class="orig" :style="{ opacity: k }" />
      </g>
    </svg>

    <ul class="legend">
      <li><i class="sw orig" />{{ t.method.qOrig }}</li>
      <li><i class="sw q" />{{ t.method.qSnap }}</li>
      <li><i class="sw level" />{{ t.method.qGrid }}</li>
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
  min-width: 1.3em;
  text-align: right;
}
.muted {
  color: var(--stage-ink2);
  font-size: 15px;
}
.head {
  font-size: 13px;
  color: var(--stage-ink2);
  margin-bottom: 6px;
}
.plot {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}
.rule {
  fill: #ff5a1f;
}
.level {
  stroke: var(--stage-ink2);
  stroke-width: 0.6;
}
.axis {
  stroke: var(--stage-ink3);
  stroke-width: 1;
}
.bar {
  fill: var(--stage-ink3);
  transition: fill 0.3s;
}
.bar.q {
  fill: #ff5a1f;
}
.orig {
  stroke: var(--stage-ink);
  stroke-width: 1.5;
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
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 2px;
}
.sw.orig {
  height: 2px;
  border-radius: 0;
  background: var(--stage-ink);
}
.sw.q {
  background: #ff5a1f;
}
.sw.level {
  height: 1px;
  border-radius: 0;
  background: var(--stage-ink2);
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
