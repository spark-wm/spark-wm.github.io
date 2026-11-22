<script setup lang="ts">
// A clip with a generation timeline under it: video chunks (with the 5-chunk memory window),
// sound chunks that end `audioLead` seconds before their video chunk, and a playhead.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { DRAFT, mediaPath, t, type Clip } from '../content'
import { isDark, reportVisibility, tr, ui } from '../state'
import UiIcon from './UiIcon.vue'

const props = defineProps<{ clip: Clip; playerId: string; priority?: boolean }>()

const video = ref<HTMLVideoElement | null>(null)
const track = ref<HTMLDivElement | null>(null)
const spec = ref<HTMLCanvasElement | null>(null)
const root = ref<HTMLElement | null>(null)

const time = ref(0)
const playing = ref(false)
const trackW = ref(800)
const small = ref(typeof window !== 'undefined' && window.innerWidth < 760)
let visible = 0
let userPaused = false
let raf = 0

const m = computed(() => props.clip.meta)
const N = computed(() => m.value.chunks)
const cs = computed(() => m.value.chunkSec)
const dur = computed(() => m.value.duration)
const cur = computed(() => Math.min(N.value - 1, Math.max(0, Math.floor(time.value / cs.value))))
const memStart = computed(() => Math.max(0, cur.value - 5))
const src = computed(() => mediaPath(props.clip.id, small.value ? 'sd.mp4' : 'full.mp4'))
const poster = computed(() => mediaPath(props.clip.id, small.value ? 'poster-sm.webp' : 'poster.webp'))
const strip = computed(() => mediaPath(props.clip.id, 'strip.webp'))
const muted = computed(() => !(ui.sound && ui.audible === props.playerId))
const cellW = computed(() => trackW.value / N.value)
const thumbs = computed(() => cellW.value >= 22)
const cellH = computed(() => Math.round(Math.max(18, Math.min(40, (cellW.value * m.value.strip.tileH) / m.value.strip.tileW))))
const pct = (s: number) => `${(100 * Math.max(0, Math.min(dur.value, s))) / dur.value}%`
const ticks = computed(() => { const out: number[] = []; for (let s = 0; s <= dur.value + 0.01; s += 5) out.push(s); return out })

const readout = computed(() => {
  const k = cur.value + 1
  return ui.lang === 'zh' ? `第 ${k} 块，共 ${N.value} 块` : `Chunk ${k} of ${N.value}`
})

/** Sound chunk k covers [aEnd(k-1), aEnd(k)]; it ends audioLead before video chunk k ends. */
const aEnd = (k: number) => (k < 0 ? 0 : Math.min(dur.value, (k + 1) * cs.value - props.clip.audioLead))
const audioCur = computed(() => ({ a: aEnd(cur.value - 1), b: aEnd(cur.value) }))

// ---------------------------------------------------------------- spectrogram
let specImg: HTMLImageElement | null = null
let specCol: HTMLCanvasElement | null = null

function colourise() {
  if (!specImg || !specImg.complete || !specImg.naturalWidth) return
  const w = specImg.naturalWidth
  const h = specImg.naturalHeight
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const x = c.getContext('2d')!
  x.drawImage(specImg, 0, 0)
  const d = x.getImageData(0, 0, w, h)
  // stage background -> warm grey -> near white
  const lo = [24, 22, 18]
  const mid = [120, 112, 100]
  const hi = [240, 234, 224]
  for (let i = 0; i < d.data.length; i += 4) {
    const v = Math.pow(d.data[i] / 255, 1.35)
    const [a, b, f] = v < 0.55 ? [lo, mid, v / 0.55] : [mid, hi, (v - 0.55) / 0.45]
    d.data[i] = a[0] + (b[0] - a[0]) * f
    d.data[i + 1] = a[1] + (b[1] - a[1]) * f
    d.data[i + 2] = a[2] + (b[2] - a[2]) * f
    d.data[i + 3] = 255
  }
  x.putImageData(d, 0, 0)
  specCol = c
  drawSpec()
}

function loadSpec() {
  specCol = null
  specImg = new Image()
  specImg.onload = colourise
  specImg.src = mediaPath(props.clip.id, 'spec.png')
}

function drawSpec() {
  const c = spec.value
  if (!c) return
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const W = c.clientWidth
  const H = c.clientHeight
  if (!W || !H) return
  if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) {
    c.width = Math.round(W * dpr)
    c.height = Math.round(H * dpr)
  }
  const x = c.getContext('2d')!
  x.setTransform(dpr, 0, 0, dpr, 0, 0)
  x.clearRect(0, 0, W, H)
  const px = (s: number) => (W * s) / dur.value
  const ph = px(time.value)
  if (specCol) {
    x.imageSmoothingEnabled = true
    x.globalAlpha = 0.22
    x.drawImage(specCol, 0, 0, W, H)
    x.globalAlpha = 1
    x.save()
    x.beginPath()
    x.rect(0, 0, ph, H)
    x.clip()
    x.drawImage(specCol, 0, 0, W, H)
    x.restore()
  }
  // sound-chunk boundaries
  x.fillStyle = 'rgba(14,13,11,0.9)'
  for (let k = 0; k < N.value; k++) {
    const b = aEnd(k)
    if (b <= 0 || b >= dur.value) continue
    x.fillRect(Math.round(px(b)) - 1, 0, 2, H)
  }
  // current sound chunk
  const { a, b } = audioCur.value
  x.fillStyle = getComputedStyle(c).getPropertyValue('--stage-accent').trim() || '#ff5a1f'
  x.fillRect(px(a) + 1, H - 3, Math.max(0, px(b) - px(a) - 2), 3)
}

// ---------------------------------------------------------------- playback
function tick() {
  const v = video.value
  if (v) time.value = v.currentTime
  drawSpec()
  if (playing.value) raf = requestAnimationFrame(tick)
}

// The <video> is keyed by clip and size, so a switch replaces the element. The old element still fires a
// late "pause" after it is removed; listen only to the element that is current.
const isCurrent = (e?: Event) => !e || e.target === video.value

function onPlay(e?: Event) {
  if (!isCurrent(e)) return
  playing.value = true
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(tick)
}
function onPause(e?: Event) {
  if (!isCurrent(e)) return
  playing.value = false
  cancelAnimationFrame(raf)
  tick()
}

async function play() {
  const v = video.value
  if (!v) return
  v.muted = muted.value
  try {
    await v.play()
  } catch {
    // unmuted autoplay refused: fall back to muted
    v.muted = true
    try { await v.play() } catch { /* still blocked */ }
  }
}

function togglePlay() {
  const v = video.value
  if (!v) return
  if (v.paused) { userPaused = false; play() } else { userPaused = true; v.pause() }
}

function toggleSound() {
  if (muted.value) {
    ui.sound = true
    ui.audible = props.playerId
    userPaused = false
    nextTick(play)
  } else {
    ui.sound = false
  }
}

watch(muted, (mu) => {
  const v = video.value
  if (!v) return
  v.muted = mu
  if (!mu && v.paused && !userPaused) play()
})

function seekTo(s: number) {
  const v = video.value
  if (!v) return
  const target = Math.max(0, Math.min(dur.value - 0.05, s))
  v.currentTime = target
  time.value = target
  drawSpec()
}

let dragging = false
function seekFromEvent(e: PointerEvent) {
  const el = track.value
  if (!el) return
  const r = el.getBoundingClientRect()
  seekTo(((e.clientX - r.left) / r.width) * dur.value)
}
function onDown(e: PointerEvent) {
  dragging = true
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  seekFromEvent(e)
}
function onMove(e: PointerEvent) { if (dragging) seekFromEvent(e) }
function onUp() { dragging = false }
function onKey(e: KeyboardEvent) {
  const now = Math.floor((video.value?.currentTime ?? time.value) / cs.value)
  if (e.key === 'ArrowRight') { seekTo((now + 1) * cs.value + 0.02); e.preventDefault() }
  else if (e.key === 'ArrowLeft') { seekTo(Math.max(0, now - 1) * cs.value + 0.02); e.preventDefault() }
  else if (e.key === ' ' || e.key === 'Enter') { togglePlay(); e.preventDefault() }
}

// ---------------------------------------------------------------- lifecycle
let io: IntersectionObserver | null = null
let ro: ResizeObserver | null = null
const onResize = () => { small.value = window.innerWidth < 760 }
const mq = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-color-scheme: dark)') : null

onMounted(() => {
  loadSpec()
  io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      // share of the viewport this player fills; a tall player can be well in view at a low ratio
      const px = e.intersectionRect.height
      visible = Math.max(e.intersectionRatio, px / Math.max(1, window.innerHeight))
      reportVisibility(props.playerId, visible)
      const v = video.value
      if (!v) continue
      const enough = props.priority ? px > 120 : visible >= 0.45
      if (enough && v.paused && !userPaused) play()
      else if (px < 60 && !v.paused) v.pause()
    }
  }, { threshold: [0, 0.15, 0.3, 0.45, 0.6, 0.8, 1] })
  if (root.value) io.observe(root.value)
  ro = new ResizeObserver(() => {
    if (track.value) trackW.value = track.value.clientWidth
    drawSpec()
  })
  if (track.value) ro.observe(track.value)
  window.addEventListener('resize', onResize)
  mq?.addEventListener('change', drawSpec)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  io?.disconnect()
  ro?.disconnect()
  window.removeEventListener('resize', onResize)
  mq?.removeEventListener('change', drawSpec)
  reportVisibility(props.playerId, 0)
})

watch(() => props.clip.id, () => {
  time.value = 0
  playing.value = false
  loadSpec()
  nextTick(() => { if (visible >= 0.3 && !userPaused) play() })
})
watch(() => [ui.theme, isDark()], drawSpec)
</script>

<template>
  <figure ref="root" class="player">
    <div class="screen" @click="togglePlay">
      <video
        ref="video"
        :key="clip.id + (small ? '-sd' : '-hd')"
        :src="src"
        :poster="poster"
        :muted="true"
        playsinline
        loop
        :preload="priority ? 'auto' : 'metadata'"
        @play="onPlay"
        @pause="onPause"
        @seeked="tick"
        @loadedmetadata="tick"
      />
      <button v-if="muted" class="unmute" @click.stop="toggleSound">
        <UiIcon name="sound-on" :size="18" />
        <span>{{ tr(t.player.turnOn) }}</span>
      </button>
    </div>

    <div class="console">
      <div class="bar">
        <div class="readout">
          <span class="num chunk">{{ readout }}</span>
          <span class="num clock">{{ time.toFixed(1) }} s</span>
        </div>
        <div class="ctrls">
          <button class="ctrl" :aria-label="playing ? tr(t.player.pause) : tr(t.player.play)" @click="togglePlay">
            <UiIcon :name="playing ? 'pause' : 'play'" :size="18" />
          </button>
          <button class="ctrl" :class="{ on: !muted }" :aria-label="muted ? tr(t.player.turnOn) : tr(t.player.turnOff)" @click="toggleSound">
            <UiIcon :name="muted ? 'sound-off' : 'sound-on'" :size="18" />
          </button>
        </div>
      </div>

      <div class="lanes" :style="{ '--cell-h': cellH + 'px' }">
        <div class="labels" aria-hidden="true">
          <span class="lab lab-mem" />
          <span class="lab lab-video">{{ tr(t.player.video) }}</span>
          <span class="lab lab-sound">{{ tr(t.player.sound) }}</span>
          <span class="lab lab-axis" />
        </div>
        <div
          ref="track"
          class="track"
          tabindex="0"
          role="slider"
          :aria-label="tr(t.player.seek)"
          :aria-valuemin="0"
          :aria-valuemax="Math.round(dur)"
          :aria-valuenow="Math.round(time)"
          :aria-valuetext="readout"
          @pointerdown="onDown"
          @pointermove="onMove"
          @pointerup="onUp"
          @pointercancel="onUp"
          @keydown="onKey"
        >
          <div class="mem-row">
            <div v-if="cur > 0" class="mem" :style="{ left: (100 * memStart) / N + '%', width: (100 * (cur - memStart)) / N + '%' }">
              <span class="mem-label">{{ tr(t.player.memory) }}</span>
            </div>
          </div>
          <div class="cells">
            <div
              v-for="k in N"
              :key="k"
              class="cell"
              :class="{ past: k - 1 < cur, now: k - 1 === cur, future: k - 1 > cur, inmem: k - 1 >= memStart && k - 1 < cur }"
              :style="thumbs && k - 1 <= cur ? { backgroundImage: `url(${strip})`, backgroundSize: `${N * 100}% 100%`, backgroundPosition: `${((k - 1) / (N - 1)) * 100}% 0` } : undefined"
            >
              <span v-if="k - 1 === cur" class="fill" :style="{ width: Math.min(100, ((time - cur * cs) / cs) * 100) + '%' }" />
            </div>
          </div>
          <canvas ref="spec" class="spec" />
          <div class="axis">
            <span v-for="s in ticks" :key="s" class="tick num" :style="{ left: pct(s) }">{{ s }} s</span>
          </div>
          <div class="playhead" :style="{ left: pct(time) }" />
        </div>
      </div>

      <p v-if="clip.prompt" class="prompt">{{ tr(clip.prompt) }}</p>
      <p v-else-if="DRAFT" class="prompt"><span class="pending">{{ tr(t.player.promptPending) }}</span></p>
    </div>
  </figure>
</template>

<style scoped>
.player {
  margin: 0;
  background: var(--stage);
  color: var(--stage-ink);
  border-radius: 10px;
  overflow: hidden;
  --stage-accent: #ff5a1f;
}
.screen {
  position: relative;
  aspect-ratio: 1344 / 768;
  background: #000;
  cursor: pointer;
}
.screen video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.unmute {
  position: absolute;
  left: 16px;
  bottom: 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 16px 0 12px;
  border-radius: 999px;
  background: rgba(14, 13, 11, 0.78);
  color: #f4efe6;
  font-size: 15px;
  font-weight: 600;
  transition: background-color 0.15s;
}
.unmute:hover {
  background: var(--stage-accent);
}
.console {
  padding: 16px 20px 18px;
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;
}
.readout {
  display: flex;
  align-items: baseline;
  gap: 16px;
}
.chunk {
  font-size: 16px;
  font-weight: 600;
}
.clock {
  font-size: 15px;
  color: var(--stage-ink2);
  min-width: 4.2em;
}
.ctrls {
  display: flex;
  gap: 4px;
}
.ctrl {
  width: 40px;
  height: 40px;
  border-radius: var(--radius);
  display: grid;
  place-items: center;
  color: var(--stage-ink2);
}
.ctrl:hover {
  color: var(--stage-ink);
  background: var(--stage3);
}
.ctrl.on {
  color: var(--stage-accent);
}
.lanes {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 0 12px;
}
.labels {
  display: grid;
  grid-template-rows: 22px var(--cell-h, 30px) 44px 22px;
  row-gap: 6px;
  font-size: 13px;
  color: var(--stage-ink2);
  align-items: center;
}
.track {
  position: relative;
  display: grid;
  grid-template-rows: 22px var(--cell-h, 30px) 44px 22px;
  row-gap: 6px;
  touch-action: none;
  cursor: ew-resize;
  outline: none;
  border-radius: 4px;
}
.track:focus-visible {
  box-shadow: 0 0 0 2px var(--stage-accent);
}
.mem-row {
  position: relative;
}
.mem {
  position: absolute;
  top: 6px;
  bottom: 0;
  border: 1px solid var(--stage-ink3);
  border-bottom: 0;
  border-radius: 3px 3px 0 0;
  transition: left 0.18s ease, width 0.18s ease;
}
.mem-label {
  position: absolute;
  left: 50%;
  top: -9px;
  transform: translateX(-50%);
  padding: 0 6px;
  background: var(--stage);
  font-size: 12px;
  line-height: 16px;
  color: var(--stage-ink2);
  white-space: nowrap;
}
.cells {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: 2px;
}
.cell {
  position: relative;
  border-radius: 2px;
  background-color: var(--stage3);
  background-repeat: no-repeat;
  overflow: hidden;
}
.cell.future {
  background-color: transparent;
  box-shadow: inset 0 0 0 1px var(--stage-line);
}
.cell.past {
  opacity: 0.55;
}
.cell.inmem {
  opacity: 1;
}
.cell.now {
  box-shadow: inset 0 0 0 2px var(--stage-accent);
}
.fill {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  background: var(--stage-accent);
}
.spec {
  width: 100%;
  height: 44px;
  border-radius: 2px;
}
.axis {
  position: relative;
}
.tick {
  position: absolute;
  top: 2px;
  transform: translateX(-50%);
  font-size: 12px;
  color: var(--stage-ink3);
  white-space: nowrap;
}
.tick:first-child {
  transform: none;
}
.tick:last-child {
  transform: translateX(-100%);
}
.playhead {
  position: absolute;
  top: 18px;
  bottom: 24px;
  width: 2px;
  margin-left: -1px;
  background: var(--stage-accent);
  pointer-events: none;
}
.prompt {
  margin-top: 14px;
  font-family: var(--serif-it);
  font-style: italic;
  font-size: 18px;
  line-height: 1.45;
  color: var(--stage-ink);
  max-width: 900px;
}
html:lang(zh-CN) .prompt {
  font-style: normal;
  font-size: 16px;
}
.prompt .pending {
  font-family: var(--sans);
  font-style: normal;
}
@media (max-width: 760px) {
  .console {
    padding: 12px 12px 14px;
  }
  .lanes {
    grid-template-columns: 40px minmax(0, 1fr);
    gap: 0 8px;
  }
  .labels {
    font-size: 12px;
  }
  .cells {
    gap: 1px;
  }
  .player {
    border-radius: 8px;
  }
  .unmute {
    left: 10px;
    bottom: 10px;
    height: 36px;
    font-size: 14px;
  }
}
</style>
