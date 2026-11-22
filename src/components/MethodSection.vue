<script setup lang="ts">
import { computed, ref } from 'vue'
import { DRAFT, clips, efficiency, t } from '../content'
import { tr, ui } from '../state'
import { useInView } from '../composables/useInView'
import ChunkFigure from './ChunkFigure.vue'
import SparseFigure from './SparseFigure.vue'
import QuantFigure from './QuantFigure.vue'

const cmpRoot = ref<HTMLElement | null>(null)
const seen = useInView(cmpRoot, { ratio: 0.25 })
const grow = computed(() => seen.value || ui.reducedMotion)
const sp = efficiency.speed
const speedKnown = computed(() => sp.oneGpu !== null || sp.fourGpu !== null)
const fmt = (n: number | null) => (n === null ? '' : n.toFixed(2))
</script>

<template>
  <section id="method" class="block">
    <div class="wrap">
      <div class="block-head">
        <h2>{{ tr(t.method.title) }}</h2>
        <p class="lead text muted">{{ tr(t.method.body) }}</p>
      </div>

      <div class="part">
        <div class="copy">
          <h3>{{ tr(t.method.chunkTitle) }}</h3>
          <p>{{ tr(t.method.chunkBody) }}</p>
        </div>
        <div class="figure">
          <ChunkFigure :clip="clips[0]" />
          <p class="caption">{{ tr(t.method.chunkCaption) }}</p>
        </div>
      </div>

      <div class="part">
        <div class="copy">
          <h3>{{ tr(t.method.sparseTitle) }}</h3>
          <p>{{ tr(t.method.sparseBody) }}</p>
        </div>
        <div class="figure">
          <SparseFigure />
          <p class="caption">{{ tr(t.method.sparseCaption) }}</p>
        </div>
      </div>

      <div class="part">
        <div class="copy">
          <h3>{{ tr(t.method.quantTitle) }}</h3>
          <p>{{ tr(t.method.quantBody) }}</p>
        </div>
        <div class="figure">
          <QuantFigure />
          <p class="caption">{{ tr(t.method.quantCaption) }}</p>
        </div>
      </div>

      <div ref="cmpRoot" class="cmp">
        <h3 class="cmp-title">{{ tr(t.method.compareTitle) }}</h3>
        <div v-for="(r, i) in efficiency.rows" :key="i" class="cmp-row">
          <p class="cmp-label">{{ tr(r.label) }}</p>
          <div class="bars">
            <div class="bar-line">
              <span class="who">{{ tr(t.efficiency.before) }}</span>
              <span class="track"><span class="fill before" :style="{ width: grow ? '100%' : '0%' }" /></span>
              <span class="val num">{{ tr(r.beforeText) }}</span>
            </div>
            <div class="bar-line">
              <span class="who strong">{{ tr(t.efficiency.after) }}</span>
              <span class="track"><span class="fill after" :style="{ width: grow ? (100 * r.after) / r.before + '%' : '0%', transitionDelay: '0.25s' }" /></span>
              <span class="val num strong">{{ tr(r.afterText) }}</span>
            </div>
          </div>
        </div>
        <div v-if="speedKnown || DRAFT" class="cmp-row">
          <p class="cmp-label">{{ tr(t.efficiency.speedTitle) }}</p>
          <div class="speed">
            <p><span class="num big">{{ speedKnown ? fmt(sp.oneGpu) : '' }}</span><span v-if="!speedKnown" class="pending">{{ tr(t.pending) }}</span><span class="muted">{{ tr(t.efficiency.oneGpu) }}</span></p>
            <p><span class="num big">{{ speedKnown ? fmt(sp.fourGpu) : '' }}</span><span v-if="!speedKnown" class="pending">{{ tr(t.pending) }}</span><span class="muted">{{ tr(t.efficiency.fourGpu) }}</span></p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.muted {
  color: var(--ink2);
}
.part {
  display: grid;
  grid-template-columns: minmax(0, 4fr) minmax(0, 7fr);
  gap: clamp(24px, 4vw, 64px);
  align-items: start;
}
.part + .part {
  margin-top: clamp(56px, 7vw, 96px);
}
.copy {
  display: grid;
  gap: 16px;
  position: sticky;
  top: 96px;
}
.copy p {
  color: var(--ink2);
}
.figure {
  display: grid;
  gap: 12px;
}
.cmp {
  display: grid;
  margin-top: clamp(64px, 8vw, 112px);
  border-top: 1px solid var(--line2);
}
.cmp-title {
  padding: 20px 0 4px;
}
.cmp-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2.4fr);
  gap: 24px;
  padding: 24px 0;
  border-bottom: 1px solid var(--line);
  align-items: center;
}
.cmp-label {
  font-size: 18px;
  font-weight: 600;
}
.bars {
  display: grid;
  gap: 10px;
}
.bar-line {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr) 190px;
  gap: 14px;
  align-items: center;
}
.who {
  font-size: 15px;
  color: var(--ink2);
}
.strong {
  color: var(--ink);
  font-weight: 650;
}
.track {
  height: 14px;
  border-radius: 3px;
  background: var(--bg2);
  overflow: hidden;
}
.fill {
  display: block;
  height: 100%;
  border-radius: 3px;
  transition: width 1.1s cubic-bezier(0.2, 0.7, 0.2, 1);
}
.fill.before {
  background: var(--ink3);
}
.fill.after {
  background: var(--accent);
}
.val {
  font-size: 15px;
  color: var(--ink2);
}
.speed {
  display: flex;
  gap: 48px;
  flex-wrap: wrap;
}
.speed p {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.big {
  font-size: 40px;
  font-weight: 650;
  letter-spacing: -0.02em;
}
@media (max-width: 980px) {
  .part {
    grid-template-columns: 1fr;
  }
  .copy {
    position: static;
    max-width: var(--text);
  }
}
@media (max-width: 860px) {
  .cmp-row {
    grid-template-columns: 1fr;
  }
  .bar-line {
    grid-template-columns: 64px minmax(0, 1fr);
  }
  .val {
    grid-column: 2;
    margin-top: -6px;
  }
}
</style>
