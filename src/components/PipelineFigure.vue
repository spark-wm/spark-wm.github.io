<script setup lang="ts">
// Animated scene for each of the seven training stages (0-based `stage`). Each scene loops with its own
// duration and emits `cycle` after every loop, so a parent can autoplay through the stages.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { t } from '../content'
import { tr, ui } from '../state'
import { clock } from '../clock'

const props = withDefaults(defineProps<{ stage: number; playing?: boolean }>(), { playing: true })
const emit = defineEmits<{ cycle: [] }>()

type Label = { x: number; y: number; text: string; anchor?: 'start' | 'middle' | 'end'; strong?: boolean; accent?: boolean }

const DUR = [4200, 4200, 4200, 4600, 5200, 4800, 6400]
const W = 480
const H = 300
const uid = 'pf' + Math.random().toString(36).slice(2, 8)

const p = ref(0.55)
let start = clock.now()
let raf = 0
let held = 0

function frame() {
  const now = clock.now()
  const d = DUR[props.stage] ?? 4000
  let el = now - start
  if (el >= d) {
    const n = Math.floor(el / d)
    start += n * d
    el -= n * d
    emit('cycle')
  }
  p.value = el / d
  raf = requestAnimationFrame(frame)
}
function run() {
  cancelAnimationFrame(raf)
  if (ui.reducedMotion && !clock.frozen()) { p.value = 0.55; return }
  if (!props.playing) return
  start = clock.now() - held
  raf = requestAnimationFrame(frame)
}
function stop() {
  held = clock.now() - start
  cancelAnimationFrame(raf)
}
watch(() => props.stage, () => { held = 0; start = clock.now(); p.value = 0; if (props.playing) run() })
watch(() => props.playing, (on) => (on ? run() : stop()))
onMounted(run)
onBeforeUnmount(() => cancelAnimationFrame(raf))

// ------------------------------------------------------------------ helpers
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const ease = (v: number) => { const x = clamp(v); return x * x * (3 - 2 * x) }
const seg = (v: number, a: number, b: number) => clamp((v - a) / (b - a))
const lerp = (a: number, b: number, f: number) => a + (b - a) * f
function slots(n: number, x0 = 24, x1 = 456, gap = 10) {
  const w = (x1 - x0 - (n - 1) * gap) / n
  return { w, x: (i: number) => x0 + i * (w + gap), c: (i: number) => x0 + i * (w + gap) + w / 2 }
}
const hash = (a: number, b: number, c: number) => {
  let h = (a * 73856093) ^ (b * 19349663) ^ (c * 83492791)
  h = (h ^ (h >>> 13)) * 1274126177
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
const L = t.training.fig

// ------------------------------------------------------------------ stage 1: camera control
const s0 = computed(() => {
  const sl = slots(6)
  const k = Math.min(30, Math.floor(seg(p.value, 0.05, 0.85) * 30))
  const noise = 1 - k / 30
  const arcs: { d: string; o: number }[] = []
  let n = 0
  for (let a = 0; a < 6; a++) for (let b = a + 1; b < 6; b++) {
    const h = 12 + (b - a) * 9
    arcs.push({ d: `M${sl.c(a)} 104 C ${sl.c(a)} ${104 - h}, ${sl.c(b)} ${104 - h}, ${sl.c(b)} 104`, o: 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(2 * Math.PI * (p.value * 2 + n * 0.11))) })
    n++
  }
  const bars = Array.from({ length: 62 }, (_, i) => 3 + Math.abs(Math.sin(i * 1.7 + p.value * 12.6) * 5 + Math.sin(i * 0.45 - p.value * 6.3) * 3) * (0.45 + 0.55 * (1 - noise)))
  // camera marker on a cubic Bézier
  const P = [[24, 258], [140, 214], [300, 296], [456, 238]]
  const u = p.value
  const bz = (i: number) => (1 - u) ** 3 * P[0][i] + 3 * (1 - u) ** 2 * u * P[1][i] + 3 * (1 - u) * u ** 2 * P[2][i] + u ** 3 * P[3][i]
  const dz = (i: number) => 3 * (1 - u) ** 2 * (P[1][i] - P[0][i]) + 6 * (1 - u) * u * (P[2][i] - P[1][i]) + 3 * u ** 2 * (P[3][i] - P[2][i])
  const ang = (Math.atan2(dz(1), dz(0)) * 180) / Math.PI
  const labels: Label[] = [
    { x: 24, y: 24, text: tr(L.wholeClip) },
    { x: 456, y: 24, text: tr(L.steps30), anchor: 'end', strong: true },
    { x: 456, y: 180, text: tr(L.sound), anchor: 'end' },
    { x: 24, y: 290, text: tr(L.camera) },
  ]
  return { sl, noise, arcs, bars, cam: { x: bz(0), y: bz(1), ang }, path: `M${P[0][0]} ${P[0][1]} C ${P[1][0]} ${P[1][1]}, ${P[2][0]} ${P[2][1]}, ${P[3][0]} ${P[3][1]}`, labels }
})

// ------------------------------------------------------------------ stages 2 and 3: chunk-causal, sparse
const causal = computed(() => {
  const sl = slots(8)
  const c = 1 + Math.min(6, Math.floor(p.value * 7.2))
  const w0 = Math.max(0, c - 5)
  const sparse = props.stage === 2
  const dense = sparse && c < 2
  const tick = Math.floor(p.value * 7.2 * 3)
  const links: { d: string; hot: boolean; faint: boolean }[] = []
  for (let i = w0; i < c; i++) {
    const offs = sparse ? [-12, 0, 12] : [0]
    offs.forEach((o, j) => {
      const x1 = sl.c(i) + o
      const x2 = sl.c(c) - 8 + j * 8
      const h = 16 + (c - i) * 7 + j * 3
      const pick = !sparse || dense || hash(i, j, tick) < 0.2 || (i === c - 1 && j === 1)
      links.push({ d: `M${x1} 104 C ${x1} ${104 - h}, ${x2} ${104 - h}, ${x2} 104`, hot: sparse && pick, faint: sparse && !pick })
    })
  }
  const labels: Label[] = [
    { x: 24, y: 24, text: tr(L.past) },
    { x: 456, y: 24, text: tr(L.steps30), anchor: 'end', strong: true },
    { x: (sl.x(w0) + sl.x(c - 1) + sl.w) / 2, y: 196, text: tr(t.player.memory), anchor: 'middle' },
  ]
  if (sparse) labels.push({ x: 456, y: 46, text: dense ? tr(L.dense) : tr(L.sparse10), anchor: 'end', accent: !dense })
  return { sl, c, w0, links, labels }
})

// ------------------------------------------------------------------ stage 4: four-step distillation
const s3 = computed(() => {
  const x0 = 40
  const x1 = 440
  const tq = Math.floor(seg(p.value, 0.02, 0.92) * 30) / 30
  const ticks48 = Array.from({ length: 48 }, (_, i) => x0 + (i * (x1 - x0)) / 47)
  const tx = x0 + (x1 - x0) * tq
  const jumps = [0, 1, 2, 3].map((j) => {
    const a = x0 + ((x1 - x0) * j) / 4
    const b = x0 + ((x1 - x0) * (j + 1)) / 4
    const f = ease(seg(p.value, 0.06 + j * 0.13, 0.17 + j * 0.13))
    return { d: `M${a} 186 C ${a + 20} 236, ${b - 20} 236, ${b} 186`, f, a, b }
  })
  const done = jumps.filter((j) => j.f >= 1).length
  const cur = jumps.find((j) => j.f > 0 && j.f < 1)
  const sx = cur ? lerp(cur.a, cur.b, cur.f) : done === 4 ? x1 : x0
  const labels: Label[] = [
    { x: x0, y: 70, text: tr(L.teacher30) },
    { x: x0, y: 286, text: tr(L.student4), accent: true },
    { x: x0, y: 168, text: tr(L.noise) },
    { x: x1, y: 168, text: tr(L.clean), anchor: 'end' },
    { x: (x0 + x1) / 2, y: 168, text: tr(L.levels48), anchor: 'middle' },
  ]
  return { x0, x1, ticks48, tx, jumps, sx, labels }
})

// ------------------------------------------------------------------ stage 5: training on self-generated history
const s4 = computed(() => {
  const sl = slots(6, 24, 456, 12)
  const gen = seg(p.value, 0.02, 0.48) * 6
  const boxes = Array.from({ length: 6 }, (_, i) => ({ show: gen > i, noise: 1 - clamp((gen - i) * 1.6) }))
  const score = seg(p.value, 0.5, 0.7)
  const grad = ease(seg(p.value, 0.72, 0.96))
  const gx1 = sl.c(5)
  const gx0 = sl.c(0)
  const labels: Label[] = [
    { x: 24, y: 24, text: tr(L.generate) },
    { x: 456, y: 24, text: tr(L.steps4), anchor: 'end', strong: true },
    { x: 240, y: 50, text: tr(L.grad), anchor: 'middle', strong: grad > 0 },
    { x: 122, y: 256, text: tr(L.real), anchor: 'middle', strong: score > 0 },
    { x: 358, y: 256, text: tr(L.fake), anchor: 'middle', strong: score > 0 },
    { x: 240, y: 196, text: 'DMD', anchor: 'middle', strong: score > 0 },
    { x: 121, y: 170, text: tr(L.qAttn), anchor: 'middle', strong: true },
    { x: 377, y: 170, text: tr(L.qFfn), anchor: 'middle', strong: true },
  ]
  // fake quantization: while a chunk is being generated, the continuous ramp in each chip snaps to steps
  const frac = gen >= 6 ? 1 : gen % 1
  const snap = gen >= 6 ? 1 : ease(seg(frac, 0.25, 0.75))
  return { sl, boxes, score, grad, gx0, gx1, labels, snap }
})

// ------------------------------------------------------------------ stage 6: cache-writer and denoiser LoRAs
const s5 = computed(() => {
  const sl = slots(6, 24, 456, 12)
  const m = Math.floor(p.value * 3)
  const q = (p.value * 3) % 1
  const denoise = seg(q, 0.02, 0.5)
  const write = seg(q, 0.52, 0.8)
  const shift = ease(seg(q, 0.82, 1))
  const step = sl.w + 12
  const cache = Array.from({ length: 5 }, (_, i) => ({ x: sl.x(i) - shift * step, o: i === 0 ? 1 - shift : 1, id: m * 10 + i }))
  const curX = sl.x(5) - shift * step
  const labels: Label[] = [
    { x: (sl.x(0) + sl.x(4) + sl.w) / 2, y: 70, text: tr(t.player.memory), anchor: 'middle' },
    { x: 456, y: 24, text: tr(L.steps4), anchor: 'end', strong: true },
    { x: (sl.x(0) + sl.x(4) + sl.w) / 2 - 30, y: 226, text: tr(L.writer), anchor: 'middle', strong: write > 0 && write < 1, accent: write > 0 && write < 1 },
    { x: sl.c(5), y: 226, text: tr(L.denoiser), anchor: 'middle', strong: denoise > 0 && denoise < 1, accent: denoise > 0 && denoise < 1 },
  ]
  return { sl, cache, curX, noise: 1 - denoise, write, labels, arrowFrom: sl.c(5), arrowTo: sl.c(4) }
})

// ------------------------------------------------------------------ stage 7: mixed-length extrapolation
const s6 = computed(() => {
  const lens = [75, 145, 50, 100]
  const m = Math.min(3, Math.floor(p.value * 4))
  const q = (p.value * 4) % 1
  const Lt = lens[m]
  const scale = (456 - 24) / 145
  const grow = ease(seg(q, 0.02, 0.34))
  const width = Lt * scale * grow
  const starts: number[] = []
  for (let k = 0; ; k++) {
    const s = Math.min(k * 45, Lt - 47)
    starts.push(s)
    if (s + 47 >= Lt) break
  }
  const active = Math.min(starts.length - 1, Math.floor(seg(q, 0.4, 0.96) * starts.length))
  const showWin = q >= 0.4
  const sec = Lt * (158 / 24 / 47)
  const secText = sec >= 20 ? '20' : sec.toFixed(1).replace(/\.0$/, '')
  const chunkTicks = Array.from({ length: Math.floor(Lt / 5) }, (_, i) => 24 + (i + 1) * 5 * scale).filter((x) => x < 24 + width - 1)
  const toSec = (l: number) => { const v = l * (158 / 24 / 47); return v >= 20 ? '20' : v.toFixed(1).replace(/\.0$/, '') }
  const others = [50, 75, 100, 145].map((l) => ({ w: (l / 145) * 340, on: l === Lt, sec: toSec(l) }))
  const labels: Label[] = [
    { x: 24, y: 24, text: `${tr(L.rollout)} ${secText} ${ui.lang === 'zh' ? '秒' : 's'}`, strong: true },
    { x: 456, y: 24, text: tr(L.steps4), anchor: 'end', strong: true },
  ]
  others.forEach((o, i) => labels.push({ x: 24 + o.w + 8, y: 213 + i * 18, text: `${o.sec} ${ui.lang === 'zh' ? '秒' : 's'}`, strong: o.on }))
  if (showWin) labels.push({ x: 24 + (starts[active] + 23.5) * scale, y: 92, text: tr(L.window), anchor: 'middle', accent: true })
  return { scale, width, starts, active, showWin, chunkTicks, others, labels }
})

const labels = computed<Label[]>(() => {
  switch (props.stage) {
    case 0: return s0.value.labels
    case 1:
    case 2: return causal.value.labels
    case 3: return s3.value.labels
    case 4: return s4.value.labels
    case 5: return s5.value.labels
    default: return s6.value.labels
  }
})
const pct = (v: number, of: number) => `${(100 * v) / of}%`
</script>

<template>
  <div class="pf" :class="'st' + stage">
    <svg :viewBox="`0 0 ${W} ${H}`" class="svg" aria-hidden="true">
      <defs>
        <pattern :id="uid + 'h'" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" class="hatch-bg" />
          <rect width="2.2" height="6" class="hatch-fg" />
        </pattern>
        <marker :id="uid + 'a'" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 8 4 0 8z" class="head" />
        </marker>
      </defs>

      <!-- 1 camera control -->
      <g v-if="stage === 0">
        <path v-for="(a, i) in s0.arcs" :key="'a' + i" :d="a.d" class="link" :style="{ opacity: a.o }" />
        <g v-for="i in 6" :key="'b' + i">
          <rect :x="s0.sl.x(i - 1)" y="110" :width="s0.sl.w" height="46" rx="4" class="clean" />
          <rect :x="s0.sl.x(i - 1)" y="110" :width="s0.sl.w" height="46" rx="4" :fill="`url(#${uid}h)`" :style="{ opacity: s0.noise }" class="edge" />
        </g>
        <rect v-for="(h, i) in s0.bars" :key="'s' + i" :x="24 + (i * 432) / 62" :y="172 - h / 2" width="2.6" :height="h" rx="1" class="bar" />
        <path :d="s0.path" class="cam" />
        <g :transform="`translate(${s0.cam.x} ${s0.cam.y}) rotate(${s0.cam.ang})`">
          <rect x="-9" y="-6" width="12" height="12" rx="2" class="camera" />
          <path d="M3 -4 L11 -8 L11 8 L3 4 z" class="camera" />
        </g>
      </g>

      <!-- 2 chunk-causal / 3 sparse -->
      <g v-else-if="stage === 1 || stage === 2">
        <path v-for="(l, i) in causal.links" :key="'l' + i" :d="l.d" class="link" :class="{ hot: l.hot, faint: l.faint }" />
        <g v-for="i in 8" :key="'c' + i">
          <rect
            :x="causal.sl.x(i - 1)"
            y="110"
            :width="causal.sl.w"
            height="46"
            rx="4"
            :fill="i - 1 === causal.c ? `url(#${uid}h)` : undefined"
            :class="i - 1 < causal.c ? 'clean' : i - 1 === causal.c ? 'now' : 'future'"
          />
          <g v-if="i - 1 <= causal.c">
            <rect v-for="k in 6" :key="k" :x="causal.sl.x(i - 1) - 6 + (k - 1) * (causal.sl.w / 6)" :y="170 - (2 + ((i * 7 + k * 3) % 5))" width="2.4" :height="4 + 2 * ((i * 7 + k * 3) % 5)" rx="1" class="bar" />
          </g>
        </g>
        <path :d="`M${causal.sl.x(causal.w0)} 180 v6 H${causal.sl.x(causal.c - 1) + causal.sl.w} v-6`" class="bracket" />
      </g>

      <!-- 4 four-step distillation -->
      <g v-else-if="stage === 3">
        <rect :x="s3.x0" y="148" :width="s3.x1 - s3.x0" height="2" class="axis" />
        <rect v-for="(x, i) in s3.ticks48" :key="'t' + i" :x="x - 0.75" y="142" width="1.5" height="14" class="tick48" />
        <rect v-for="i in 31" :key="'tt' + i" :x="s3.x0 + ((s3.x1 - s3.x0) * (i - 1)) / 30 - 1" y="84" width="2" height="16" class="tstep" :class="{ on: s3.x0 + ((s3.x1 - s3.x0) * (i - 1)) / 30 <= s3.tx + 0.5 }" />
        <rect :x="s3.tx - 4" y="80" width="8" height="24" rx="2" class="tmark" />
        <path v-for="(j, i) in s3.jumps" :key="'j' + i" :d="j.d" class="jump" pathLength="1" :style="{ strokeDasharray: 1, strokeDashoffset: 1 - j.f, opacity: j.f > 0.01 ? 1 : 0 }" />
        <rect :x="s3.sx - 6" y="178" width="12" height="16" rx="2" class="smark" />
      </g>

      <!-- 5 self-generated history -->
      <g v-else-if="stage === 4">
        <g v-for="(b, i) in s4.boxes" :key="'g' + i">
          <rect v-if="b.show" :x="s4.sl.x(i)" y="96" :width="s4.sl.w" height="46" rx="4" class="own" />
          <rect v-if="b.show" :x="s4.sl.x(i)" y="96" :width="s4.sl.w" height="46" rx="4" :fill="`url(#${uid}h)`" :style="{ opacity: b.noise }" class="edge" />
          <rect v-if="!b.show" :x="s4.sl.x(i)" y="96" :width="s4.sl.w" height="46" rx="4" class="future" />
        </g>
        <g v-for="cx in [24, 280]" :key="'q' + cx">
          <rect :x="cx" y="158" width="176" height="24" rx="4" class="chip" />
          <path :d="`M${cx + 8} 176 L${cx + 22} 164`" class="ramp" :style="{ opacity: 1 - s4.snap }" />
          <path :d="`M${cx + 8} 176 h3.5 v-4 h3.5 v-4 h3.5 v-4 h3.5`" class="stairs" :style="{ opacity: 0.25 + 0.75 * s4.snap }" />
        </g>
        <path :d="`M${s4.gx1} 90 C ${s4.gx1} 58, ${s4.gx0} 58, ${s4.gx0} 88`" class="grad" pathLength="1" :style="{ strokeDasharray: 1, strokeDashoffset: 1 - s4.grad, opacity: s4.grad > 0.01 ? 1 : 0 }" :marker-end="s4.grad > 0.98 ? `url(#${uid}a)` : undefined" />
        <path d="M240 146 L240 184 M240 208 L122 236 M240 208 L358 236" class="link" :style="{ opacity: 0.2 + 0.8 * s4.score }" />
        <rect x="24" y="236" width="196" height="40" rx="5" class="score" :class="{ on: s4.score > 0 }" />
        <rect x="260" y="236" width="196" height="40" rx="5" class="score" :class="{ on: s4.score > 0 }" />
      </g>

      <!-- 6 cache-writer and denoiser LoRAs -->
      <g v-else-if="stage === 5">
        <path :d="`M${s5.sl.x(0)} 92 v-6 H${s5.sl.x(4) + s5.sl.w} v6`" class="bracket" />
        <rect v-for="b in s5.cache" :key="b.id" :x="b.x" y="110" :width="s5.sl.w" height="46" rx="4" class="clean" :style="{ opacity: b.o }" />
        <rect :x="s5.curX" y="110" :width="s5.sl.w" height="46" rx="4" class="own" />
        <rect :x="s5.curX" y="110" :width="s5.sl.w" height="46" rx="4" :fill="`url(#${uid}h)`" :style="{ opacity: s5.noise }" />
        <rect :x="s5.curX" y="110" :width="s5.sl.w" height="46" rx="4" class="now-edge" fill="none" />
        <path :d="`M${s5.arrowFrom} 166 C ${s5.arrowFrom} 196, ${s5.arrowTo + 8} 196, ${s5.arrowTo + 8} 162`" class="grad" pathLength="1" :style="{ strokeDasharray: 1, strokeDashoffset: 1 - s5.write, opacity: s5.write > 0.01 ? 1 : 0 }" :marker-end="s5.write > 0.98 ? `url(#${uid}a)` : undefined" />
      </g>

      <!-- 7 mixed-length extrapolation -->
      <g v-else>
        <rect v-for="(o, i) in s6.others" :key="'o' + i" x="24" :y="210 + i * 18" :width="o.w" height="6" rx="3" class="len" :class="{ on: o.on }" />
        <rect x="24" y="110" :width="s6.width" height="46" rx="4" class="own" />
        <rect v-for="(x, i) in s6.chunkTicks" :key="'k' + i" :x="x - 0.75" y="110" width="1.5" height="46" class="ck" />
        <g v-if="s6.showWin">
          <rect v-for="(s, i) in s6.starts" :key="'w' + i" :x="24 + s * s6.scale" y="102" :width="47 * s6.scale" height="62" rx="5" class="win" :class="{ on: i === s6.active, past: i < s6.active }" />
        </g>
      </g>
    </svg>
    <div class="labels" aria-hidden="true">
      <span
        v-for="(l, i) in labels"
        :key="stage + '-' + i"
        class="lbl"
        :class="[l.anchor || 'start', { strong: l.strong, accent: l.accent }]"
        :style="{ left: pct(l.x, W), top: pct(l.y, H) }"
      >{{ l.text }}</span>
    </div>
  </div>
</template>

<style scoped>
.pf {
  position: relative;
  aspect-ratio: 480 / 300;
  font-family: var(--sans);
}
.svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.labels {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.lbl {
  position: absolute;
  transform: translateY(-50%);
  white-space: nowrap;
  font-size: 13px;
  line-height: 1.2;
  color: var(--stage-ink2);
}
.lbl.middle {
  transform: translate(-50%, -50%);
}
.lbl.end {
  transform: translate(-100%, -50%);
}
.lbl.strong {
  color: var(--stage-ink);
  font-weight: 600;
}
.lbl.accent {
  color: #ff7a45;
}
.hatch-bg {
  fill: var(--stage2);
}
.hatch-fg {
  fill: var(--stage-ink3);
}
.clean {
  fill: var(--stage-ink3);
}
.own {
  fill: var(--stage3);
  stroke: var(--stage-ink2);
  stroke-width: 1.2;
}
.edge {
  stroke: var(--stage-ink3);
  stroke-width: 1.2;
}
.now,
.now-edge {
  stroke: #ff5a1f;
  stroke-width: 2.2;
}
.future {
  fill: none;
  stroke: var(--stage-line);
  stroke-width: 1.2;
}
.link {
  fill: none;
  stroke: var(--stage-ink2);
  stroke-width: 1.3;
}
.link.faint {
  opacity: 0.18;
}
.link.hot {
  stroke: var(--stage-ink);
  stroke-width: 2;
}
.bar {
  fill: var(--stage-ink3);
}
.cam {
  fill: none;
  stroke: var(--stage-ink3);
  stroke-width: 1.5;
}
.camera {
  fill: var(--stage-ink);
}
.bracket {
  fill: none;
  stroke: var(--stage-ink2);
  stroke-width: 1.3;
}
.axis {
  fill: var(--stage-ink3);
}
.tick48 {
  fill: var(--stage-ink3);
  opacity: 0.6;
}
.tstep {
  fill: var(--stage3);
}
.tstep.on {
  fill: var(--stage-ink2);
}
.tmark {
  fill: var(--stage-ink);
}
.jump {
  fill: none;
  stroke: #ff5a1f;
  stroke-width: 2.2;
  stroke-linecap: round;
}
.smark {
  fill: #ff5a1f;
}
.grad {
  fill: none;
  stroke: var(--stage-ink);
  stroke-width: 1.8;
}
.head {
  fill: var(--stage-ink);
}
.chip {
  fill: none;
  stroke: var(--stage-ink);
  stroke-width: 1.3;
}
.ramp {
  fill: none;
  stroke: var(--stage-ink3);
  stroke-width: 1.4;
  stroke-linecap: round;
}
.stairs {
  fill: none;
  stroke: var(--stage-accent);
  stroke-width: 1.6;
  stroke-linejoin: round;
}
.score {
  fill: var(--stage2);
  stroke: var(--stage-ink3);
  transition: stroke 0.2s;
}
.score.on {
  stroke: var(--stage-ink);
}
.len {
  fill: var(--stage3);
}
.len.on {
  fill: var(--stage-ink3);
}
.ck {
  fill: var(--stage2);
}
.win {
  fill: none;
  stroke: var(--stage-ink3);
  stroke-width: 1.2;
}
.win.past {
  stroke: var(--stage-ink2);
}
.win.on {
  stroke: #ff5a1f;
  stroke-width: 2.2;
}
@media (max-width: 520px) {
  .lbl {
    font-size: 12px;
  }
}
</style>
