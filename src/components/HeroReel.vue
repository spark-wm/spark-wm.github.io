<script setup lang="ts">
// Hero reel: short segments of the demo clips in one seamless loop (built by tools/build_reel.py).
// The full clips, with the chunk timeline, live in the demo section below.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { clips, mediaPath, t } from '../content'
import reelMeta from '../data/reel.json'
import { demoPick, reportVisibility, tr, ui } from '../state'
import UiIcon from './UiIcon.vue'

const ID = 'hero'
const segs = reelMeta.segments
const total = reelMeta.duration
const byId = Object.fromEntries(clips.map((c) => [c.id, c]))

const root = ref<HTMLElement | null>(null)
const video = ref<HTMLVideoElement | null>(null)
const small = ref(typeof window !== 'undefined' && window.innerWidth < 760)
const src = computed(() => mediaPath('reel', small.value ? 'reel-sd.mp4' : 'reel.mp4'))
const poster = computed(() => mediaPath('reel', small.value ? 'poster-sm.webp' : 'poster.webp'))
const muted = computed(() => !(ui.sound && ui.audible === ID))
const time = ref(0)
const playing = ref(false)
let userPaused = false
let visible = 0

// The first segment's window wraps around the loop point (its start is negative).
const wrapped = (s: number) => segs.length > 1 && s >= total + segs[0].start
const cur = computed(() => {
  const s = time.value
  if (wrapped(s)) return 0
  const k = segs.findIndex((g) => s < g.end)
  return k < 0 ? 0 : k
})
function progress(k: number) {
  if (k !== cur.value) return k < cur.value && !wrapped(time.value) ? 1 : 0
  const g = segs[k]
  const s = wrapped(time.value) ? time.value - total : time.value
  return Math.min(1, Math.max(0, (s - g.start) / (g.end - g.start)))
}
const clip = computed(() => byId[segs[cur.value].id])
const prompt = computed(() => (clip.value?.prompt ? tr(clip.value.prompt) : ''))

let raf = 0
function tick() {
  if (video.value) time.value = video.value.currentTime
  if (playing.value) raf = requestAnimationFrame(tick)
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
    try { await v.play() } catch { /* still blocked: the poster stays */ }
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
    ui.audible = ID
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
function jump(k: number) {
  const v = video.value
  if (!v) return
  v.currentTime = segs[k].jump
  time.value = segs[k].jump
  if (v.paused && !userPaused) play()
}
function openFull() {
  demoPick.id = segs[cur.value].id
  demoPick.n++
}
function onPlay(e: Event) {
  if (e.target !== video.value) return
  playing.value = true
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(tick)
}
function onPause(e: Event) {
  if (e.target !== video.value) return
  playing.value = false
  cancelAnimationFrame(raf)
}

let io: IntersectionObserver | null = null
const onResize = () => { small.value = window.innerWidth < 760 }
onMounted(() => {
  io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const px = e.intersectionRect.height
      visible = Math.max(e.intersectionRatio, px / Math.max(1, window.innerHeight))
      reportVisibility(ID, visible)
      const v = video.value
      if (!v) continue
      if (px > 120 && v.paused && !userPaused && !ui.reducedMotion) play()
      else if (px < 60 && !v.paused) v.pause()
    }
  }, { threshold: [0, 0.15, 0.3, 0.45, 0.6, 0.8, 1] })
  if (root.value) io.observe(root.value)
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  io?.disconnect()
  window.removeEventListener('resize', onResize)
  reportVisibility(ID, 0)
})
// switching between the phone and desktop file keeps the position
watch(small, () => {
  const at = time.value
  nextTick(() => {
    const v = video.value
    if (!v) return
    v.addEventListener('loadedmetadata', () => { v.currentTime = at; if (visible > 0.1 && !userPaused && !ui.reducedMotion) play() }, { once: true })
  })
})
</script>

<template>
  <figure ref="root" class="reel" :aria-label="tr(t.reel.label)">
    <div class="screen" @click="togglePlay">
      <video
        ref="video"
        :key="small ? 'sd' : 'hd'"
        :src="src"
        :poster="poster"
        :muted="true"
        playsinline
        loop
        preload="auto"
        disablepictureinpicture
        @play="onPlay"
        @pause="onPause"
        @seeked="tick"
      />
      <button v-if="muted" class="unmute" @click.stop="toggleSound">
        <UiIcon name="sound-on" :size="18" />
        <span>{{ tr(t.player.turnOn) }}</span>
      </button>
    </div>
    <figcaption class="cap">
      <p class="now">
        <span class="name">{{ clip ? tr(clip.title) : '' }}</span>
        <span v-if="prompt" class="prompt">{{ prompt }}</span>
        <button class="open" @click="openFull">
          <span>{{ tr(t.reel.open) }}</span>
          <UiIcon name="chevron" :size="14" />
        </button>
      </p>
      <div class="ctrls">
        <div v-if="segs.length > 1" class="segs">
          <button
            v-for="(g, k) in segs"
            :key="k"
            class="seg"
            :aria-label="`${tr(t.reel.seg)} ${k + 1}: ${byId[g.id] ? tr(byId[g.id].title) : ''}`"
            :aria-current="k === cur"
            @click="jump(k)"
          >
            <span class="fill" :style="{ transform: `scaleX(${progress(k)})` }" />
          </button>
        </div>
        <button class="ctrl" :aria-label="playing ? tr(t.player.pause) : tr(t.player.play)" @click="togglePlay">
          <UiIcon :name="playing ? 'pause' : 'play'" :size="16" />
        </button>
        <button class="ctrl" :class="{ on: !muted }" :aria-label="muted ? tr(t.player.turnOn) : tr(t.player.turnOff)" @click="toggleSound">
          <UiIcon :name="muted ? 'sound-off' : 'sound-on'" :size="16" />
        </button>
      </div>
    </figcaption>
  </figure>
</template>

<style scoped>
.reel {
  margin: 0 auto clamp(40px, 5vw, 64px);
  /* never taller than the window once scrolled to (nav + caption ≈ 150 px) */
  max-width: calc((100svh - 150px) * 1344 / 768);
}
.screen {
  position: relative;
  aspect-ratio: 1344 / 768;
  background: var(--stage);
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
}
.screen video {
  display: block;
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
  background: #ff5a1f;
}
.cap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
  padding-top: 14px;
}
.now {
  display: flex;
  align-items: baseline;
  gap: 14px;
  min-width: 0;
  font-size: 15px;
}
.name {
  font-weight: 650;
  white-space: nowrap;
}
.prompt {
  min-width: 0;
  color: var(--ink2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.open {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--ink2);
  white-space: nowrap;
  transition: color 0.15s;
}
.open:hover {
  color: var(--accent-ink);
}
.ctrls {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: none;
}
.segs {
  display: flex;
  gap: 6px;
  margin-right: 8px;
}
.seg {
  position: relative;
  width: 36px;
  height: 24px;
}
.seg::before,
.seg .fill {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 3px;
  margin-top: -1.5px;
  border-radius: 2px;
}
.seg::before {
  background: var(--line2);
}
.seg .fill {
  background: var(--accent);
  transform-origin: left center;
}
.ctrl {
  display: inline-grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  color: var(--ink2);
  transition: color 0.15s, background-color 0.15s;
}
.ctrl:hover {
  color: var(--ink);
  background: var(--bg2);
}
.ctrl.on {
  color: var(--accent-ink);
}
.seg:focus-visible,
.ctrl:focus-visible,
.open:focus-visible,
.unmute:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
@media (max-width: 760px) {
  .screen {
    border-radius: 8px;
  }
  .unmute {
    left: 10px;
    bottom: 10px;
    height: 36px;
    font-size: 14px;
  }
  .cap {
    padding-top: 10px;
  }
  .now {
    gap: 10px;
    font-size: 14px;
  }
  .prompt {
    display: none;
  }
  .segs {
    margin-right: 2px;
  }
  .seg {
    width: 24px;
  }
}
</style>
