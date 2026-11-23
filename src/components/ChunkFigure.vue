<script setup lang="ts">
// Autoregressive loop on real frames: the next chunk is denoised in 4 steps, then joins the
// 5-chunk memory and the oldest chunk leaves. Noise is blended on pixels for illustration.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { mediaPath, t, type Clip } from '../content'
import { tr, ui } from '../state'
import { useInView } from '../composables/useInView'
import UiIcon from './UiIcon.vue'

const props = defineProps<{ clip: Clip }>()
const root = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const live = useInView(root, { ratio: 0.3, live: true })

const N = props.clip.meta.chunks
const { tileW, tileH } = props.clip.meta.chunksBig
const sprite = mediaPath(props.clip.id, 'chunks.webp')
const LEVELS = [1, 0.75, 0.5, 0.25, 0]

const c = ref(5) // index of the chunk being generated
const step = ref(1) // 1..4 while denoising, 5 = committed
const paused = ref(false)
let sigma = 1
let img: HTMLImageElement | null = null
let noise: HTMLCanvasElement | null = null
let timer = 0
let raf = 0

const memory = computed(() => { const out: number[] = []; for (let k = Math.max(0, c.value - 5); k < c.value; k++) out.push(k); return out })
const tileStyle = (k: number) => ({ backgroundImage: `url(${sprite})`, backgroundSize: `${N * 100}% 100%`, backgroundPosition: `${(k / (N - 1)) * 100}% 0` })
const status = computed(() => {
  if (step.value > 4) return tr(t.method.done)
  return ui.lang === 'zh' ? `第 ${step.value} 步，共 4 步` : `Step ${step.value} of 4`
})

function makeNoise() {
  const w = Math.round(tileW / 2)
  const h = Math.round(tileH / 2)
  const n = document.createElement('canvas')
  n.width = w
  n.height = h
  const x = n.getContext('2d')!
  const d = x.createImageData(w, h)
  for (let i = 0; i < d.data.length; i += 4) {
    // sum of uniforms ~ gaussian, per channel
    for (let ch = 0; ch < 3; ch++) {
      const g = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5
      d.data[i + ch] = Math.max(0, Math.min(255, 128 + g * 110))
    }
    d.data[i + 3] = 255
  }
  x.putImageData(d, 0, 0)
  noise = n
}

function draw() {
  const cv = canvas.value
  if (!cv || !img || !img.complete) return
  const x = cv.getContext('2d')!
  cv.width = tileW
  cv.height = tileH
  const k = Math.min(N - 1, c.value)
  x.filter = sigma > 0.01 ? `blur(${(sigma * 9).toFixed(1)}px)` : 'none'
  x.drawImage(img, k * tileW, 0, tileW, tileH, -12, -12, tileW + 24, tileH + 24)
  x.filter = 'none'
  if (noise && sigma > 0.001) {
    x.globalAlpha = sigma
    x.imageSmoothingEnabled = false
    x.drawImage(noise, 0, 0, tileW, tileH)
    x.globalAlpha = 1
  }
}

function animateTo(target: number, ms: number) {
  cancelAnimationFrame(raf)
  const from = sigma
  const t0 = performance.now()
  const go = (now: number) => {
    const p = Math.min(1, (now - t0) / ms)
    sigma = from + (target - from) * (1 - Math.pow(1 - p, 2))
    draw()
    if (p < 1) raf = requestAnimationFrame(go)
  }
  raf = requestAnimationFrame(go)
}

function advance() {
  if (paused.value || !live.value) return
  if (step.value <= 4) {
    animateTo(LEVELS[step.value], 420)
    timer = window.setTimeout(() => { step.value += 1; advance() }, step.value === 4 ? 650 : 620)
  } else {
    timer = window.setTimeout(() => {
      c.value = c.value + 1 >= N ? 5 : c.value + 1
      step.value = 1
      sigma = 1
      draw()
      timer = window.setTimeout(advance, 300)
    }, 700)
  }
}

function restart() {
  clearTimeout(timer)
  if (ui.reducedMotion) { sigma = LEVELS[2]; step.value = 2; draw(); return }
  advance()
}

watch(live, (on) => { if (on && !paused.value) restart(); else clearTimeout(timer) })
function togglePause() { paused.value = !paused.value; if (!paused.value) restart(); else clearTimeout(timer) }

// the frame sprite is large (one tile per chunk), so it loads only when the figure is near the viewport
const near = useInView(root, { ratio: 0, margin: '800px' })
watch(near, (n) => {
  if (!n || img) return
  img = new Image()
  img.onload = draw
  img.src = sprite
})
onMounted(makeNoise)
onBeforeUnmount(() => { clearTimeout(timer); cancelAnimationFrame(raf) })
</script>

<template>
  <figure ref="root" class="fig stage-fig">
    <div class="grid">
      <div class="col cond">
        <p class="cap" :class="{ one: ui.lang === 'zh' }">{{ tr(t.method.condition) }}</p>
        <div class="tile poster" :style="{ backgroundImage: `url(${mediaPath(clip.id, 'poster-sm.webp')})` }" />
      </div>
      <div class="col mem">
        <p class="cap">{{ tr(t.method.cache) }}</p>
        <TransitionGroup name="slide" tag="div" class="mem-row">
          <div v-for="k in memory" :key="k" class="tile" :style="tileStyle(k)" />
        </TransitionGroup>
      </div>
      <div class="col next">
        <p class="cap">{{ tr(t.method.current) }}</p>
        <div class="canvas-wrap" :class="{ done: step > 4 }">
          <canvas ref="canvas" :width="clip.meta.chunksBig.tileW" :height="clip.meta.chunksBig.tileH" />
        </div>
        <div class="steps">
          <span v-for="s in 4" :key="s" class="seg" :class="{ on: s < step || step > 4, now: s === step }" />
          <span class="status num">{{ status }}</span>
        </div>
      </div>
    </div>
    <button class="pause" :aria-label="paused ? tr(t.player.play) : tr(t.player.pause)" @click="togglePause">
      <UiIcon :name="paused ? 'play' : 'pause'" :size="16" />
    </button>
  </figure>
</template>

<style scoped>
.stage-fig {
  position: relative;
  margin: 0;
  background: var(--stage);
  color: var(--stage-ink);
  border-radius: 10px;
  padding: 20px;
}
.grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 3.2fr) minmax(0, 2.4fr);
  gap: 16px;
  align-items: start;
}
.cap.one {
  /* the Chinese label is one character too wide for the narrow column; let it run into the gap */
  white-space: nowrap;
}
.cap {
  font-size: 13px;
  line-height: 1.35;
  color: var(--stage-ink2);
  margin-bottom: 10px;
  min-height: 2.7em;
}
.tile {
  aspect-ratio: 472 / 270;
  border-radius: 3px;
  background-color: var(--stage3);
  background-repeat: no-repeat;
}
.poster {
  background-size: cover;
  background-position: center;
}
.mem-row {
  position: relative;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 4px;
}
.slide-move,
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.5s cubic-bezier(0.3, 0.7, 0.2, 1), opacity 0.5s;
}
.slide-enter-from {
  opacity: 0;
  transform: translateX(60%);
}
.slide-leave-to {
  opacity: 0;
  transform: translateX(-60%);
}
.slide-leave-active {
  position: absolute;
  width: calc((100% - 16px) / 5);
}
.canvas-wrap {
  border-radius: 3px;
  overflow: hidden;
  box-shadow: 0 0 0 2px var(--stage-accent, #ff5a1f);
  transition: box-shadow 0.3s;
}
.canvas-wrap.done {
  box-shadow: 0 0 0 2px var(--stage-ink2);
}
.canvas-wrap canvas {
  width: 100%;
  height: auto;
}
.steps {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
}
.seg {
  width: 22px;
  height: 4px;
  border-radius: 2px;
  background: var(--stage3);
  transition: background-color 0.25s;
}
.seg.on {
  background: var(--stage-ink2);
}
.seg.now {
  background: #ff5a1f;
}
.status {
  margin-left: 10px;
  font-size: 14px;
  color: var(--stage-ink);
}
.pause {
  position: absolute;
  right: 12px;
  top: 12px;
  width: 32px;
  height: 32px;
  border-radius: var(--radius);
  display: grid;
  place-items: center;
  color: var(--stage-ink3);
}
.pause:hover {
  color: var(--stage-ink);
  background: var(--stage3);
}
@media (max-width: 760px) {
  .stage-fig {
    padding: 14px;
  }
  .grid {
    grid-template-columns: minmax(0, 1fr) minmax(0, 2.6fr);
  }
  .next {
    grid-column: 1 / -1;
  }
  .cap {
    min-height: 0;
  }
}
</style>
