<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { DRAFT, clips, mediaPath, t, wallSlots } from '../content'
import { demoPick, tr, ui } from '../state'
import reelMeta from '../data/reel.json'
import StreamPlayer from './StreamPlayer.vue'

// Start the theater on a clip the hero reel does not open with, so the first scroll does not repeat it.
const firstInReel = reelMeta.segments[0]?.id
const index = ref(Math.max(0, clips.findIndex((c) => c.id !== firstInReel)))
const clip = computed(() => clips[index.value])
/** Empty slots are a preview-only placeholder for clips still to come. */
// a draft shows one placeholder for the clips still to come, not a wall of empty frames
const empty = computed(() => (DRAFT && clips.length < wallSlots ? 1 : 0))
const theater = ref<HTMLElement | null>(null)

// Wall tiles loop muted while they are in view; nothing loads before that.
const tiles: HTMLVideoElement[] = []
let io: IntersectionObserver | null = null
function setTile(el: unknown, i: number) {
  if (!(el instanceof HTMLVideoElement) || tiles[i] === el) return
  el.muted = true
  tiles[i] = el
  io?.observe(el)
}

function pick(i: number) {
  index.value = i
  ui.sound = true
  ui.audible = 'theater'
  nextTick(() => theater.value?.scrollIntoView({ behavior: ui.reducedMotion ? 'auto' : 'smooth', block: 'start' }))
}

// the hero reel asks for a clip
watch(() => demoPick.n, () => {
  const i = clips.findIndex((c) => c.id === demoPick.id)
  if (i >= 0) pick(i)
})

onMounted(() => {
  if (ui.reducedMotion) return
  io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const v = e.target as HTMLVideoElement
      if (e.isIntersecting && e.intersectionRatio >= 0.35) {
        if (v.paused) v.play().catch(() => { /* blocked: the poster stays */ })
      } else if (!v.paused) v.pause()
    }
  }, { threshold: [0, 0.35, 0.7] })
  for (const v of tiles) if (v) io.observe(v)
})
onBeforeUnmount(() => io?.disconnect())
</script>

<template>
  <section id="demos" class="block">
    <div class="wrap">
      <div class="block-head">
        <h2>{{ tr(t.demos.title) }}</h2>
        <p class="lead text muted-lead">{{ tr(t.demos.body) }}</p>
      </div>

      <ul class="wall">
        <li v-for="(c, i) in clips" :key="c.id">
          <button class="tile" :class="{ on: i === index }" :aria-pressed="i === index" @click="pick(i)">
            <span class="frame">
              <video
                :ref="(el) => setTile(el, i)"
                :poster="mediaPath(c.id, 'poster-sm.webp')"
                muted
                loop
                playsinline
                preload="none"
                disablepictureinpicture
                tabindex="-1"
                aria-hidden="true"
              >
                <source :src="mediaPath(c.id, 'tile.mp4')" type="video/mp4" />
              </video>
            </span>
            <span class="cap">
              <span class="name">{{ tr(c.title) }}</span>
              <span class="len num">{{ Math.round(c.meta.duration) }} {{ tr(t.demos.seconds) }}</span>
            </span>
          </button>
        </li>
        <li v-for="k in empty" :key="'slot' + k" class="slot">
          <span class="frame ph"><span class="pending">{{ tr(t.pending) }}</span></span>
          <span class="cap"><span class="name">{{ tr(t.demos.more) }}</span></span>
        </li>
      </ul>

      <div ref="theater" class="theater">
        <p class="now">
          <span class="name">{{ tr(clip.title) }}</span>
          <span class="len num">{{ Math.round(clip.meta.duration) }} {{ tr(t.demos.seconds) }}</span>
        </p>
        <StreamPlayer :clip="clip" player-id="theater" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.muted-lead {
  color: var(--ink2);
}
.wall {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px 16px;
}
.wall > li {
  display: grid;
  gap: 10px;
  align-content: start;
}
.tile {
  display: grid;
  gap: 10px;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  text-align: left;
  cursor: pointer;
}
.frame {
  position: relative;
  display: block;
  aspect-ratio: 1344 / 768;
  border-radius: 6px;
  overflow: hidden;
  background: var(--bg2);
}
.tile .frame {
  box-shadow: 0 0 0 1px var(--line);
  transition: box-shadow 0.15s;
}
.tile:hover .frame {
  box-shadow: 0 0 0 1px var(--line2);
}
.tile.on .frame {
  box-shadow: 0 0 0 2px var(--ink);
}
.tile:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
  border-radius: 6px;
}
.frame video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ph {
  display: grid;
  place-items: center;
  box-shadow: inset 0 0 0 1px var(--line);
}
.cap {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  font-size: 15px;
}
.name {
  font-weight: 600;
}
.slot .name {
  font-weight: 500;
  color: var(--ink3);
}
.len {
  color: var(--ink2);
  white-space: nowrap;
}
.theater {
  margin-top: clamp(40px, 5vw, 64px);
  /* html already has scroll-padding-top: 72px for the fixed nav */
  scroll-margin-top: 12px;
}
.now {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 14px;
  font-size: 17px;
}
.now .name {
  font-weight: 650;
}
@media (max-width: 760px) {
  .wall {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px 10px;
  }
  .wall > li:last-child:nth-child(odd) {
    grid-column: 1 / -1;
  }
  .wall > li.slot:last-child:nth-child(odd) {
    display: none;
  }
  .cap {
    font-size: 14px;
  }
}
</style>
